from fastapi import FastAPI
from pipeline import RAGPipeline
from data.data import router as course_router
from fastapi import APIRouter, Query, HTTPException
from Retrieval.retriever import HighSpeedRetriever
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()
rag = RAGPipeline()

app.include_router(course_router)

retriever = HighSpeedRetriever()


app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/rag")
async def rag_search(q: str):
    result = await rag.run(q)
    return result




@app.get("/search")
async def search_courses(
    q: str = Query(..., description="Từ khoá để tìm kiếm khóa học"),
    top_k: int = Query(5, ge=1, le=50, description="Số lượng kết quả cần trả về"),
):
    """
    🔍 Tìm kiếm khóa học theo ngữ nghĩa (sử dụng FAISS + Redis cache)
    """
    try:
        results = await retriever.retrieve(q, top_k)
        return results
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=3006)