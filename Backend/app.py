#!/usr/bin/env python3
"""
Indian Law Chatbot API (FAISS + Hugging Face + Layman Explanation)
Optimized, production-ready, and fully clean output.
"""

import os
import json
import logging
import re
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

import numpy as np
from flask import Flask, jsonify, request
from flask_cors import CORS
from sentence_transformers import SentenceTransformer
import faiss
from transformers import pipeline
from dotenv import load_dotenv
from waitress import serve

# ---------------------------
# Load env & logging
# ---------------------------
load_dotenv()
logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")
logger = logging.getLogger(__name__)

# ---------------------------
# Configuration
# ---------------------------
@dataclass
class Config:
    HUGGINGFACE_API_KEY: Optional[str] = os.getenv("HUGGINGFACE_API_KEY")
    EMBEDDER_MODEL: str = os.getenv("EMBEDDER_MODEL", "sentence-transformers/all-MiniLM-L6-v2")
    FAISS_INDEX_PATH: str = os.getenv("FAISS_INDEX_PATH", "data/faiss.index")
    META_PATH: str = os.getenv("META_PATH", "data/meta.npy")
    TOP_K: int = int(os.getenv("TOP_K", 3))
    MAX_SECTION_CHARS: int = int(os.getenv("MAX_SECTION_CHARS", 1500))
    CORS_ORIGINS: List[str] = field(default_factory=lambda: os.getenv("CORS_ORIGINS", "*").split(","))
    FLASK_ENV: str = os.getenv("FLASK_ENV", "development")
    DEVICE: int = int(os.getenv("DEVICE", -1))  # -1=CPU, >=0 GPU
    RETRIEVE_MULTIPLIER: int = int(os.getenv("RETRIEVE_MULTIPLIER", 5))
    SIMILARITY_THRESHOLD: float = float(os.getenv("SIMILARITY_THRESHOLD", 0.2))
    MAX_GENERATION_TOKENS: int = int(os.getenv("MAX_GENERATION_TOKENS", 256))
    QUERY_EMBED_CACHE_SIZE: int = int(os.getenv("QUERY_EMBED_CACHE_SIZE", 512))

cfg = Config()
Path("data").mkdir(exist_ok=True)

# ---------------------------
# Helper utilities
# ---------------------------
def l2_normalize(vec: np.ndarray, eps: float = 1e-8) -> np.ndarray:
    if vec.ndim == 1:
        return vec / (np.linalg.norm(vec) + eps)
    return vec / (np.linalg.norm(vec, axis=1, keepdims=True) + eps)

class QueryEmbedCache:
    """Simple LRU cache for query embeddings."""
    def __init__(self, max_size: int = 512):
        self.max_size = max_size
        self._store: Dict[str, np.ndarray] = {}
        self._order: List[str] = []

    def get(self, q: str) -> Optional[np.ndarray]:
        if q in self._store:
            self._order.remove(q)
            self._order.insert(0, q)
            return self._store[q]
        return None

    def set(self, q: str, emb: np.ndarray) -> None:
        if q in self._store:
            self._order.remove(q)
        self._store[q] = emb
        self._order.insert(0, q)
        if len(self._order) > self.max_size:
            old = self._order.pop()
            del self._store[old]

query_cache = QueryEmbedCache(cfg.QUERY_EMBED_CACHE_SIZE)

# ---------------------------
# Load FAISS index & metadata
# ---------------------------
def load_faiss_and_meta(index_path: str, meta_path: str) -> Tuple[faiss.Index, List[Any]]:
    if not os.path.exists(index_path) or not os.path.exists(meta_path):
        raise FileNotFoundError("❌ FAISS index or metadata not found. Run indexing.py first.")
    logger.info(f"📥 Loading FAISS index from {index_path}")
    index = faiss.read_index(index_path)
    logger.info("📥 Loading metadata...")
    meta = list(np.load(meta_path, allow_pickle=True))
    logger.info(f"✅ Loaded {len(meta)} sections")
    return index, meta

# ---------------------------
# Initialize models
# ---------------------------
logger.info("🚀 Initializing SentenceTransformer...")
embedder = SentenceTransformer(cfg.EMBEDDER_MODEL)
index, ipc_meta = load_faiss_and_meta(cfg.FAISS_INDEX_PATH, cfg.META_PATH)

logger.info("🤖 Initializing Hugging Face generator...")
generator = pipeline(
    task="text2text-generation",
    model=os.getenv("GENERATOR_MODEL", "google/flan-t5-large"),
    device=cfg.DEVICE if cfg.DEVICE >= 0 else -1
)

# ---------------------------
# Retrieval logic
# ---------------------------
def encode_query(query: str) -> np.ndarray:
    cached = query_cache.get(query)
    if cached is not None:
        return cached
    emb = embedder.encode([query], convert_to_numpy=True)[0].astype("float32")
    emb = l2_normalize(emb)
    query_cache.set(query, emb)
    return emb

def retrieve(query: str) -> List[Dict[str, Any]]:
    query = query.strip()
    if not query:
        return []

    q_emb = encode_query(query).reshape(1, -1)
    search_k = max(cfg.RETRIEVE_MULTIPLIER * cfg.TOP_K, cfg.TOP_K + 1)
    D, I = index.search(q_emb, search_k)

    results = []
    for dist, idx in zip(D[0], I[0]):
        if idx < 0 or idx >= len(ipc_meta):
            continue

        meta_item = ipc_meta[idx]
        text = meta_item["text"] if isinstance(meta_item, dict) else str(meta_item)
        results.append({
            "id": int(idx),
            "text": text[:cfg.MAX_SECTION_CHARS] + ("...\n[truncated]" if len(text) > cfg.MAX_SECTION_CHARS else ""),
            "full_text": text
        })
        if len(results) >= cfg.TOP_K:
            break

    return results

# ---------------------------
# Hugging Face JSON extraction
# ---------------------------
def extract_json(text: str) -> dict:
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        # Remove redundant labels
        text_clean = re.sub(r'(?i)\blayman_explanation\s*:\s*', '', text)
        text_clean = re.sub(r'(?i)\bexample\s*:\s*', '', text_clean)
        start, end = text_clean.find("{"), text_clean.rfind("}")
        if start != -1 and end != -1:
            try:
                return json.loads(text_clean[start:end+1])
            except:
                pass
        return {"layman_explanation": text_clean.strip(), "example": ""}

# ---------------------------
# Generate layman explanation
# ---------------------------
def generate_layman(section_text: str, section_id: int) -> Dict[str, str]:
    text_snippet = section_text[:cfg.MAX_SECTION_CHARS]
    prompt = (
        f"You are a legal assistant. Explain the following legal section in plain English "
        f"for a layperson and provide a short example.\n\n"
        f"Respond ONLY in valid JSON with two keys: 'layman_explanation' and 'example'.\n\n"
        f"Legal Section (ID: {section_id}):\n{text_snippet}"
    )
    try:
        out = generator(prompt, max_new_tokens=cfg.MAX_GENERATION_TOKENS, do_sample=False)
        raw = out[0].get("generated_text", "").strip()
        return extract_json(raw)
    except Exception as e:
        logger.error(f"❌ Error generating layman explanation for section {section_id}: {e}")
        return {"layman_explanation": "[Error generating explanation]", "example": ""}

# ---------------------------
# Full RAG pipeline
# ---------------------------
def generate_answer_for_query(query: str) -> Dict[str, Any]:
    retrieved = retrieve(query)
    if not retrieved:
        return {"query": query, "summary_plain": "No relevant sections found", "sections": [], "final_answer": ""}

    sections = []
    final_parts = []

    for r in retrieved:
        layman = generate_layman(r["full_text"], r["id"])
        sections.append({
            "id": r["id"],
            "title": f"Section {r['id']}",
            "legal_text": r["text"],
            "layman_explanation": layman["layman_explanation"],
            "example": layman["example"]
        })
        final_parts.append(
            f"📘 {sections[-1]['title']}:\nLayman: {layman['layman_explanation']}\nExample: {layman['example']}\n"
        )

    return {
        "query": query,
        "summary_plain": "Answer based on retrieved IPC sections.",
        "sections": sections,
        "final_answer": "\n".join(final_parts)
    }

# ---------------------------
# Flask API
# ---------------------------
def create_app() -> Flask:
    app = Flask(__name__)
    CORS(app, resources={r"/*": {"origins": cfg.CORS_ORIGINS}})
    app.config["JSON_SORT_KEYS"] = False

    @app.route("/", methods=["GET"])
    def home():
        return jsonify({"message": "✅ Indian Law Chatbot API running"}), 200

    @app.route("/ping", methods=["GET"])
    def ping():
        return jsonify({"ok": True}), 200

    @app.route("/chat", methods=["POST"])
    def chat():
        data = request.get_json(silent=True) or {}
        query = (data.get("query") or "").strip()
        if not query:
            return jsonify({"error": "Query is required"}), 400
        try:
            response = generate_answer_for_query(query)
            return jsonify({"query": query, "response": response}), 200
        except Exception as e:
            logger.exception("Unhandled /chat error: %s", e)
            return jsonify({"error": "Internal server error"}), 500

    return app

# ---------------------------
# Run server
# ---------------------------
if __name__ == "__main__":
    app = create_app()
    if cfg.FLASK_ENV.lower() == "production":
        logger.info("🚀 Starting production server on port 5000...")
        serve(app, host="0.0.0.0", port=5000)
    else:
        logger.info("🧪 Starting dev server at http://0.0.0.0:5000")
        app.run(host="0.0.0.0", port=5000, debug=True)
