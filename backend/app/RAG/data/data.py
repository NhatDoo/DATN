from fastapi import FastAPI,APIRouter, Request, Cookie, HTTPException , Body
from fastapi.responses import JSONResponse
from redis.asyncio import Redis
import pandas as pd
import numpy as np
from Retrieval.retriever import HighSpeedRetriever
# import sys
# sys.path.append(".") 

from pydantic import BaseModel
import json
import os


SECRET_KEY = "59efedfdabdd1cfb6321d61887a52e73b65db593e961a35cbc6e8db80972631237dda83d0f9d88cb9db094f066e6f8d98351a86c6d813fd6d60d61a1e2f06317"  # giống với NestJS
ALGORITHM = "HS256"

router = APIRouter()
retriever = HighSpeedRetriever()

DATA_DIR = os.path.join(os.getcwd(), "data")
COURSES_FILE = os.path.join(DATA_DIR, "courses.json")

class Lesson(BaseModel):
    id: str
    course_id: str
    title: str
    content: str | None = None
    media_url: str | None = None
    order_idx: int | None = 0
    duration_seconds: int | None = None
    status: str | None = "temp"
    # thêm các field khác nếu có

class LessonCreateRequest(BaseModel):
    course_id: str
    lesson: Lesson

def load_courses():
    """Đọc danh sách khóa học từ file JSON"""
    if not os.path.exists(COURSES_FILE):
        os.makedirs(DATA_DIR, exist_ok=True)
        with open(COURSES_FILE, "w", encoding="utf-8") as f:
            json.dump([], f)
        return []

    with open(COURSES_FILE, "r", encoding="utf-8") as f:
        try:
            return json.load(f)
        except json.JSONDecodeError:
            return []


def save_courses(courses):
    """Ghi danh sách khóa học ra file JSON"""
    os.makedirs(DATA_DIR, exist_ok=True)
    with open(COURSES_FILE, "w", encoding="utf-8") as f:
        json.dump(courses, f, indent=2, ensure_ascii=False)


@router.post("/add")
async def add_course(course: dict = Body(...)):
    """Thêm một khóa học mới + cập nhật FAISS index cục bộ"""
    courses = load_courses()

    if any(c["id"] == course["id"] for c in courses):
        raise HTTPException(status_code=400, detail="Course already exists")

    courses.append(course)
    save_courses(courses)

    print(f"✅ Added new course: {course['title']} ({course['id']})")
    

    # 🧠 Tạo embedding mới cho khóa học
    text = " ".join([
        str(course.get("title", "")),
        str(course.get("short_description", "")),
        str(course.get("description", "")),
    ])
    embedding = await retriever.model.encode_async(text)
    print(f"Embedding type: {type(embedding)}")
    print(f"Embedding shape (before np.array): {np.array(embedding).shape}")
    print(f"🧠 Embeddings shape: {embedding.shape}")

    # 🧩 Thêm vào FAISS index cục bộ trong RAM
    retriever.index.add_embeddings(
        embedding.astype('float32'),  # không cần bọc thêm []
        [course]
    )


    # 💾 Lưu index ra file để đảm bảo không mất khi restart
    retriever.index.save_index(
        retriever.index_file,
        retriever.meta_file
    )

    print(f"📦 FAISS in-memory index updated with course {course['id']}")

    return {
        "message": f"✅ Added course {course['id']} and updated FAISS in-memory",
        "total": len(courses)
    }


@router.put("/update/{course_id}")
def update_course(course_id: str, new_data: dict = Body(...)):
    """Cập nhật thông tin khóa học"""
    courses = load_courses()
    for c in courses:
        if c["id"] == course_id:
            c.update(new_data)
            save_courses(courses)
            print(f"✏️ Updated course: {course_id}")
            return {"message": f"✏️ Updated course {course_id}"}

    raise HTTPException(status_code=404, detail="Course not found")


@router.delete("/delete/{course_id}")
def delete_course(course_id: str):
    """Xóa một khóa học"""
    courses = load_courses()
    new_courses = [c for c in courses if c["id"] != course_id]

    if len(new_courses) == len(courses):
        raise HTTPException(status_code=404, detail="Course not found")

    save_courses(new_courses)
    print(f"🗑️ Deleted course: {course_id}")
    return {"message": f"🗑️ Deleted course {course_id}", "total": len(new_courses)}


@router.post("/lesson/add")
def add_lesson(lesson: Lesson):
    courses = load_courses()
    for c in courses:
        if c["id"] == lesson.course_id:
            c.setdefault("lessons", []).append(lesson.dict())
            save_courses(courses)
            return {"message": f"✅ Added lesson {lesson.id} to course {lesson.course_id}"}
    raise HTTPException(status_code=404, detail="Course not found")


@router.delete("/lesson/delete/{lesson_id}")
def remove_lesson(lesson_id: str):
    """Xóa 1 lesson theo lesson_id mà không cần course_id"""
    courses = load_courses()

    for c in courses:
        lessons = c.get("lessons", [])
        new_lessons = [l for l in lessons if l["id"] != lesson_id]

        if len(new_lessons) < len(lessons):  # tức là có lesson bị xóa
            c["lessons"] = new_lessons
            save_courses(courses)
            return {"message": f"🗑️ Removed lesson {lesson_id} from course {c['id']}"}

    raise HTTPException(status_code=404, detail="Lesson not found")

