from retriever import HighSpeedRetriever

_retriever = None

async def get_retriever():
    """Trả về instance retriever toàn cục, chỉ khởi tạo 1 lần."""
    global _retriever
    if _retriever is None:
        _retriever = HighSpeedRetriever()
        await _retriever.model._ensure_model_loaded()
        print("🌍 Global retriever initialized.")
    return _retriever
