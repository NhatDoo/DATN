# preload_embedding.py
from embedding import EmbeddingModel
import asyncio

async def preload():
    model = EmbeddingModel()
    await model._ensure_model_loaded()
    print("✅ Embedding model is warm and ready in RAM!")

if __name__ == "__main__":
    asyncio.run(preload())