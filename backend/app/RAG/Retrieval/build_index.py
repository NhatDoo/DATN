import json
import numpy as np
import asyncio
from index_manager import IndexManager
from embedding import EmbeddingModel


DATA_PATH = "../data/courses.json"

async def build_index():
    # 1️⃣ Load dữ liệu JSON
    with open(DATA_PATH, "r", encoding="utf-8") as f:
        data = json.load(f)

    # 2️⃣ Chuẩn bị text để embedding (có thể kết hợp title + description)
    texts = [f"{item['title']} - {item['description']}" for item in data]

    # 3️⃣ Sinh embedding
    model = EmbeddingModel()
    embeddings = await model.encode_async(texts)
    embeddings = np.array(embeddings).astype("float32")

    # 4️⃣ Tạo index FAISS và lưu metadata
    dim = embeddings.shape[1]
    index_manager = IndexManager(dim)
    index_manager.add_embeddings(embeddings, data)

    # 5️⃣ Ghi file index + metadata
    index_manager.save()
    print(f"✅ Đã lưu {len(data)} items vào index {index_manager.index_path}")

if __name__ == "__main__":
    asyncio.run(build_index())
