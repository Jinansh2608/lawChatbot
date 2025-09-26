import os
import json
import logging
from pathlib import Path
import numpy as np
from flask import Flask, request, jsonify
from flask_cors import CORS
from sentence_transformers import SentenceTransformer
import faiss
from transformers import AutoTokenizer, AutoModelForSeq2SeqLM, pipeline
from dotenv import load_dotenv
from waitress import serve

# ---------------------------
# Setup & Config
# ---------------------------
load_dotenv()
logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")

class Config:
    HF_API_KEY = os.getenv("HUGGINGFACE_API_KEY")
    EMBEDDER_MODEL = os.getenv("EMBEDDER_MODEL", "sentence-transformers/all-MiniLM-L6-v2")
    GENERATOR_MODEL = os.getenv("GENERATOR_MODEL", "google/flan-t5-large")
    FAISS_INDEX_PATH = os.getenv("FAISS_INDEX_PATH", "data/faiss.index")
    META_PATH = os.getenv("META_PATH", "data/meta.npy")
    TOP_K = int(os.getenv("TOP_K", 3))
    MAX_SECTION_CHARS = int(os.getenv("MAX_SECTION_CHARS", 800))
    CORS_ORIGINS = os.getenv("CORS_ORIGINS", "*").split(",")
    FLASK_ENV = os.getenv("FLASK_ENV", "development")
    DEVICE = int(os.getenv("DEVICE", "-1"))  # -1 = CPU, 0 = GPU

Path("data").mkdir(exist_ok=True)

# ---------------------------
# Load FAISS index & metadata
# ---------------------------
def load_faiss_and_meta(index_path, meta_path):
    if not os.path.exists(index_path) or not os.path.exists(meta_path):
        raise FileNotFoundError("❌ FAISS index or metadata not found. Run indexing.py first.")
    logging.info(f"Loading FAISS index from {index_path}")
    index = faiss.read_index(index_path)
    texts = list(np.load(meta_path, allow_pickle=True))
    logging.info(f"✅ Loaded {len(texts)} legal sections")
    return index, texts

# ---------------------------
# Initialize embedder and FAISS
# ---------------------------
logging.info("Initializing sentence embedder...")
embedder = SentenceTransformer(Config.EMBEDDER_MODEL)
index, ipc_texts = load_faiss_and_meta(Config.FAISS_INDEX_PATH, Config.META_PATH)

# ---------------------------
# Load Hugging Face Generator
# ---------------------------
if not Config.HF_API_KEY:
    raise ValueError("❌ HUGGINGFACE_API_KEY missing in .env")

logging.info(f"Loading generator model: {Config.GENERATOR_MODEL}")
tokenizer = AutoTokenizer.from_pretrained(Config.GENERATOR_MODEL, use_auth_token=Config.HF_API_KEY)
model = AutoModelForSeq2SeqLM.from_pretrained(Config.GENERATOR_MODEL, use_auth_token=Config.HF_API_KEY)
generator = pipeline("text2text-generation", model=model, tokenizer=tokenizer, device=Config.DEVICE)
logging.info("✅ Generator ready.")

# ---------------------------
# Retrieve top-k sections
# ---------------------------
def retrieve(query, top_k=Config.TOP_K, max_chars=Config.MAX_SECTION_CHARS, similarity_threshold=0.3):
    q_emb = embedder.encode([query], convert_to_numpy=True).astype("float32")
    D, I = index.search(q_emb, top_k*5)  # retrieve more, filter by similarity

    results = []
    for score, idx in zip(D[0], I[0]):
        if score < similarity_threshold:
            continue
        text = ipc_texts[idx]
        if len(text) > max_chars:
            text = text[:max_chars] + "...\n[truncated]"
        results.append({"id": int(idx), "text": text})
        if len(results) >= top_k:
            break
    return results

# ---------------------------
# Build prompt with layman explanation
# ---------------------------
def build_prompt(user_query, retrieved_chunks):
    chunks_text = "\n\n---\n\n".join([f"[{c['id']}] {c['text']}" for c in retrieved_chunks])
    return f"""
You are an expert Indian law assistant.
Answer STRICTLY using the provided IPC sections.

Provide JSON with keys:
- title: Short title for the query
- summary_plain: One-line legal summary
- legal_answer: Detailed legal explanation
- layman_explanation: Simple explanation for non-lawyers
- sources: List of section IDs used

RETRIEVED SECTIONS:
{chunks_text}

QUESTION: {user_query}
"""

# ---------------------------
# Generate structured answer
# ---------------------------
def generate_answer_for_query(query):
    retrieved = retrieve(query)
    if not retrieved:
        return {"error": "Answer not available in the provided sections."}, "none"

    prompt = build_prompt(query, retrieved)
    logging.info("🔍 Generating legal response...")
    out = generator(prompt, max_new_tokens=500, do_sample=False)
    raw = out[0]["generated_text"].strip()

    # Parse JSON safely
    try:
        json_part = raw[raw.find("{"):] if "{" in raw else raw
        parsed = json.loads(json_part)
        if "sources" not in parsed:
            parsed["sources"] = [c["id"] for c in retrieved]
        if "layman_explanation" not in parsed:
            parsed["layman_explanation"] = "In simple words, this is the legal position based on retrieved IPC sections."
        return parsed, "rag"
    except json.JSONDecodeError:
        logging.warning("⚠️ Model returned non-JSON. Falling back to manual structure.")
        return {
            "title": "Legal Query",
            "summary_plain": "Answer derived from retrieved sections.",
            "legal_answer": raw,
            "layman_explanation": "In simple words, this is the legal position based on retrieved IPC sections.",
            "sources": [c["id"] for c in retrieved]
        }, "rag_text"

# ---------------------------
# Flask API
# ---------------------------
def create_app():
    app = Flask(__name__)
    CORS(app, resources={r"/*": {"origins": Config.CORS_ORIGINS}})

    @app.route("/chat", methods=["POST"])
    def chat():
        data = request.json or {}
        query = data.get("query", "").strip()
        if not query:
            return jsonify({"error": "Query is required"}), 400

        try:
            answer, mode = generate_answer_for_query(query)
            return jsonify({
                "query": query,
                "mode": mode,
                "response": answer,
                "context_used": retrieve(query)
            })
        except Exception as e:
            logging.exception("❌ Error in /chat")
            return jsonify({"error": f"Internal server error: {str(e)}"}), 500

    @app.route("/", methods=["GET"])
    def home():
        return jsonify({"message": "✅ Indian Law Chatbot API with FAISS + RAG + Layman Explanation"})

    return app

# ---------------------------
# Run server
# ---------------------------
if __name__ == "__main__":
    app = create_app()
    if Config.FLASK_ENV.lower() == "production":
        logging.info("🚀 Starting production server on port 5000...")
        serve(app, host="0.0.0.0", port=5000)
    else:
        logging.info("🧪 Starting development server...")
        app.run(host="0.0.0.0", port=5000, debug=True)
