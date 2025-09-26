import os
import json
import logging
import re
import numpy as np
import faiss
from pathlib import Path
from sentence_transformers import SentenceTransformer
from PyPDF2 import PdfReader

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")
Path("data").mkdir(exist_ok=True)

FAISS_INDEX_PATH = "data/faiss.index"
META_PATH = "data/meta.npy"
META_JSON = "data/meta.json"
PDF_PATH = "data/IPC.pdf"  # Your IPC PDF

# ---------------------------
# Load PDF and split sections
# ---------------------------
def extract_ipc_sections(pdf_path):
    reader = PdfReader(pdf_path)
    text = ""
    for page in reader.pages:
        text += page.extract_text() + "\n"

    # Split by Section pattern
    pattern = r"(Section\s+\d+[A-Z]?\s*\.)(.*?)(?=Section\s+\d+[A-Z]?\.|$)"
    matches = re.findall(pattern, text, flags=re.DOTALL)

    sections = []
    for section_no, content in matches:
        content = content.strip().replace("\n", " ")
        if len(content) > 10:  # filter empty
            sections.append({
                "section_no": section_no.strip(),
                "title": section_no.strip(),
                "text": content
            })
    logging.info(f"Total sections extracted: {len(sections)}")
    return sections

# ---------------------------
# Build FAISS index
# ---------------------------
def build_faiss_index(sections, embedder):
    texts = [s['text'] for s in sections]
    embeddings = embedder.encode(texts, convert_to_numpy=True, show_progress_bar=True).astype("float32")

    index = faiss.IndexFlatL2(embeddings.shape[1])
    index.add(embeddings)

    # Save
    faiss.write_index(index, FAISS_INDEX_PATH)
    np.save(META_PATH, np.array(texts, dtype=object), allow_pickle=True)
    with open(META_JSON, "w") as f:
        json.dump({"n_items": len(texts)}, f, indent=2)
    logging.info("✅ FAISS index and meta saved successfully!")

# ---------------------------
# Main
# ---------------------------
if __name__ == "__main__":
    embedder = SentenceTransformer("sentence-transformers/all-MiniLM-L6-v2")
    sections = extract_ipc_sections(PDF_PATH)
    if len(sections) == 0:
        raise ValueError("No valid sections extracted from PDF.")
    build_faiss_index(sections, embedder)
