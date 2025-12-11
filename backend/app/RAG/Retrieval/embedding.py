from sentence_transformers import SentenceTransformer
from concurrent.futures import ThreadPoolExecutor
import asyncio
import torch

# 🧠 Bộ nhớ chia sẻ toàn cục cho model và executor
_shared_model = None
_shared_executor = ThreadPoolExecutor(max_workers=4)
_shared_device = "cuda" if torch.cuda.is_available() else "cpu"


class EmbeddingModel:
    def __init__(self, model_name: str = "sentence-transformers/all-MiniLM-L6-v2"):
        self.model_name = model_name
        self.device = _shared_device
        print("💤 EmbeddingModel initialized (global lazy mode, model not loaded yet).")

    async def _ensure_model_loaded(self):
        """Tải model nếu chưa được load (singleton global)."""
        global _shared_model
        if _shared_model is None:
            print(f"⚙️ Loading embedding model ({self.model_name}) on {_shared_device}...")
            loop = asyncio.get_event_loop()
            _shared_model = await loop.run_in_executor(
                _shared_executor,
                lambda: SentenceTransformer(self.model_name, device=_shared_device)
            )
            # ⚡ Warm-up GPU
            _shared_model.encode(["warm up"], normalize_embeddings=True)
            print(f"✅ Model loaded globally and warmed up on {_shared_device}.")

    async def encode_async(self, texts):
        """Mã hóa văn bản thành embedding (tự động load model nếu cần)."""
        await self._ensure_model_loaded()

        if isinstance(texts, str):
            texts = [texts]

        loop = asyncio.get_event_loop()
        embeddings = await loop.run_in_executor(
            _shared_executor,
            lambda: _shared_model.encode(texts, normalize_embeddings=True)
        )
        return embeddings
