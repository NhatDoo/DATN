import os
import json
import numpy as np
import redis.asyncio as aioredis
from Retrieval.index_manager import IndexManager
from Retrieval.embedding import EmbeddingModel

# 🔥 Global singletons (reuse model, index, Redis)
_global_model = None
_global_index = None
_global_redis = None


class HighSpeedRetriever:
    def __init__(self, redis_url="redis://localhost:6379", dim=384):
        global _global_model, _global_index, _global_redis

        # 🧠 Model toàn cục
        if _global_model is None:
            print("⚙️ Loading global embedding model...")
            _global_model = EmbeddingModel()
        self.model = _global_model

        # 🧠 FAISS Index toàn cục (chỉ load 1 lần thật sự)
        if _global_index is None:
            _global_index = IndexManager(dim)
            _global_index.loaded = False
        self.index = _global_index

        # 🧠 Redis connection pool toàn cục
        if _global_redis is None:
            _global_redis = aioredis.from_url(
                redis_url, decode_responses=True, max_connections=10
            )
        self.redis = _global_redis

        # 🔍 File paths
        self.index_file = os.path.join(os.path.dirname(__file__), "../data/course_index.faiss")
        self.meta_file = os.path.join(os.path.dirname(__file__), "../data/course_meta.json")

        # ✅ Load index (chỉ 1 lần)
        if not getattr(_global_index, "loaded", False):
            if os.path.exists(self.index_file) and os.path.exists(self.meta_file):
                _global_index.load_index(self.index_file, self.meta_file)
                _global_index.loaded = True
                print("📦 Loaded FAISS index + metadata vào RAM (1st time).")
            else:
                print("⚠️ Chưa có index — cần build trước.")

    async def build_index(self, courses: list):
        """Tạo index FAISS (nếu chưa có)"""
        if os.path.exists(self.index_file):
            print("⚡ Index đã tồn tại — bỏ qua.")
            return

        texts, metas = [], []
        for c in courses:
            texts.append(" ".join([
                str(c.get("title", "")),
                str(c.get("description", "")),
                str(c.get("category_id", "")),
            ]))
            metas.append({
                "id": c.get("id"),
                "title": c.get("title"),
                "price": c.get("price_bigint"),
                "category": c.get("category_id"),
            })

        print("🔄 Đang tạo embeddings...")
        embeddings = await self.model.encode_async(texts)
        self.index.add_embeddings(np.array(embeddings), metas)

        os.makedirs(os.path.dirname(self.index_file), exist_ok=True)
        self.index.save_index(self.index_file, self.meta_file)
        print(f"✅ Indexed {len(courses)} courses và lưu vào disk.")

    async def retrieve(self, query: str, top_k: int = 10):
        """Truy vấn FAISS + Redis cache"""
        cache_key = f"retrieval:{query.lower()}"

        # ⚡ Cache hit
        cached = await self.redis.get(cache_key)
        if cached:
            print(f"⚡ Cache hit: {query}")
            return json.loads(cached)

        # 🧠 Encode query
        print(f"⚙️ Cache miss → tính embedding cho: {query}")
        query_emb = await self.model.encode_async(query)
        results = self.index.search(np.array(query_emb), top_k)

        # ✅ Cache 10 phút
        await self.redis.set(cache_key, json.dumps(results, ensure_ascii=False), ex=600)
        return results

    async def close(self):
        pass  # giữ global Redis pool mở
