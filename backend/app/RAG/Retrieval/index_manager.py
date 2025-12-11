# rag_service/retrieval/index_manager.py
import faiss
import numpy as np
import os, json

class IndexManager:
    def __init__(self, dim: int, index_path: str = "../data/course_index.faiss", meta_path: str = "../data/course_meta.json"):
        self.dim = dim
        self.index_path = index_path
        self.meta_path = meta_path
        self.index = faiss.IndexFlatIP(dim)
        self.id_to_meta = {}

    def add_embeddings(self, embeddings: np.ndarray, metas: list):
        # 🧠 Đảm bảo embeddings có đúng shape (n, dim)
        if embeddings.ndim == 1:
            embeddings = embeddings.reshape(1, -1)
        elif embeddings.ndim > 2:
            embeddings = embeddings.squeeze()  # loại bỏ chiều dư
        
        if embeddings.shape[1] != self.dim:
            raise ValueError(
                f"Embedding dimension mismatch: expected {self.dim}, got {embeddings.shape[1]}"
            )

        # ✅ Thêm vào FAISS
        self.index.add(embeddings.astype("float32"))

        start_id = len(self.id_to_meta)
        for i, meta in enumerate(metas):
            self.id_to_meta[start_id + i] = meta


    def search(self, query_emb: np.ndarray, top_k: int = 5):
        D, I = self.index.search(query_emb.astype("float32"), top_k)
        results = []
        for score, idx in zip(D[0], I[0]):
            if idx >= 0:
                results.append({
                    "score": float(score),
                    "meta": self.id_to_meta.get(str(idx)) or self.id_to_meta.get(idx)
                })
        return results

    def save(self):
        os.makedirs(os.path.dirname(self.index_path), exist_ok=True)
        faiss.write_index(self.index, self.index_path)
        with open(self.meta_path, "w", encoding="utf-8") as f:
            json.dump(self.id_to_meta, f, ensure_ascii=False, indent=2)

    def load(self):
        if not os.path.exists(self.index_path):
            raise FileNotFoundError("FAISS index not found.")
        self.index = faiss.read_index(self.index_path)
        with open(self.meta_path, "r", encoding="utf-8") as f:
            self.id_to_meta = json.load(f)
        print(f"📂 Loaded {len(self.id_to_meta)} items from index.")


    def save_index(self, index_path: str, meta_path: str):
        """Alias để lưu chỉ số FAISS + metadata với đường dẫn tùy chỉnh"""
        self.index_path = index_path
        self.meta_path = meta_path
        self.save()
        print(f"💾 Saved FAISS index → {index_path}")
        print(f"💾 Saved metadata → {meta_path}")

    def load_index(self, index_path: str, meta_path: str):
        """Alias để tải chỉ số FAISS + metadata với đường dẫn tùy chỉnh"""
        if not os.path.exists(index_path) or not os.path.exists(meta_path):
            raise FileNotFoundError(f"Missing FAISS index or metadata: {index_path}, {meta_path}")
        self.index_path = index_path
        self.meta_path = meta_path
        self.load()
        print(f"✅ Successfully loaded FAISS index from {index_path}")
