from fastapi import FastAPI, Request, Cookie, HTTPException , Body
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from redis.asyncio import Redis
from datetime import datetime
import pandas as pd
import numpy as np
# import sys
# sys.path.append(".") 

from pydantic import BaseModel
import json
import os
import ast

from convertjsontocsv import convert_data
from train_model import train_model
import joblib
import jwt  # pip install PyJWT

SECRET_KEY = "59efedfdabdd1cfb6321d61887a52e73b65db593e961a35cbc6e8db80972631237dda83d0f9d88cb9db094f066e6f8d98351a86c6d813fd6d60d61a1e2f06317"  # giống với NestJS
ALGORITHM = "HS256"

app = FastAPI()

class FilePayload(BaseModel):
    file: str

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

DATA_DIR = os.path.join(os.getcwd(), "data")

COURSES_FILE = os.path.join(DATA_DIR, "courses.json")

redis = Redis(host="localhost", port=6379, decode_responses=True)


def reload_model():
    global tfidf, tfidf_matrix, course_sim, user_enc, course_enc, courses, interactions

    # load model
    tfidf = joblib.load("models/tfidf_vectorizer.pkl")
    tfidf_matrix = joblib.load("models/tfidf_matrix.pkl")     # NEW
    course_sim = joblib.load("models/course_similarity.pkl")
    user_enc = joblib.load("models/user_encoder.pkl")
    course_enc = joblib.load("models/course_encoder.pkl")

    # load data reference
    courses = pd.read_csv("models/courses_reference.csv")     # dùng file cố định theo model
    
    # Parse categories if column exists
    def parse_categories(x):
        if isinstance(x, str):
            try:
                return ast.literal_eval(x)
            except (ValueError, SyntaxError):
                return []
        return x if isinstance(x, list) else []

    if "categories" in courses.columns:
        courses["categories"] = courses["categories"].apply(parse_categories)

    interactions = pd.read_csv("data/user_history.csv")       # cái này vẫn realtime (online)

reload_model()



app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/recommend")
async def recommend_for_user(request: Request, access_token: str = Cookie(None), top_n: int = 100):
    convert_data()
    courses, interactions, user_enc, course_enc, course_sim = train_model()

    if not access_token:
        raise HTTPException(status_code=401, detail="Missing access_token in cookie")

    try:
        payload = jwt.decode(access_token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload.get("sub") or payload.get("user_id")
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

    if not user_id:
        raise HTTPException(status_code=400, detail="Invalid token payload")

    print(f"⚙️ Cache miss for user {user_id}, generating...")

    # === Lọc dữ liệu user ===
    user_data = interactions[interactions["user_id"] == user_id]
    user_data = user_data[user_data["course_id"].notna()]  # bỏ NaN

    if user_data.empty:
        raise HTTPException(status_code=404, detail="No interaction data found for this user")

    # === Lọc course_id hợp lệ ===
    valid_course_ids = [cid for cid in user_data["course_id"] if cid in course_enc.classes_]
    if not valid_course_ids:
        raise HTTPException(status_code=404, detail="No valid course_ids found for this user")

    # === Encode các course_id hợp lệ ===
    course_indices = course_enc.transform(valid_course_ids)

    # === Tính toán ===
    sim_scores = course_sim[course_indices].mean(axis=0)
    for idx in course_indices:
        sim_scores[idx] = -1  # loại bỏ chính khóa học đó

    recommended_idx = np.argsort(sim_scores)[::-1][:top_n]
    recommended_courses = courses.iloc[recommended_idx]

    # 🧩 Thay NaN bằng None để JSON hợp lệ
    recommended_courses["background"] = recommended_courses["background"].where(
        pd.notnull(recommended_courses["background"]), None
    )

    # ✅ Chọn các cột cần trả về
    result_columns = ["id", "title", "instructor_id", "price_bigint", "slug", "background"]
    
    # Add categories if it exists
    if "categories" in recommended_courses.columns:
        result_columns.append("categories")
    
    result = recommended_courses[result_columns].to_dict(orient="records")

    return result



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






@app.post("/retrain")
async def retrain():
    if  convert_data():
        train_model()
        reload_model() 
    return {"ok": True}


@app.post("/add")
def add_course(course: dict = Body(...)):
    """Thêm một khóa học mới"""
    courses = load_courses()

    if any(c["id"] == course["id"] for c in courses):
        raise HTTPException(status_code=400, detail="Course already exists")

    courses.append(course)
    save_courses(courses)


    print(f"✅ Added new course: {course['title']} ({course['id']})")
    return {"message": f"✅ Added course {course['id']}", "total": len(courses)}


@app.put("/update/{course_id}")
def update_course(course_id: str, new_data: dict = Body(...)):
    """Cập nhật thông tin khóa học"""
    courses = load_courses()
    for c in courses:
        if c["id"] == course_id:
            c.update(new_data)
            save_courses(courses)
            print(f"✏️ Updated course: {course_id}")
            return {"message": f"✏️ Updated course {course_id}"}
    convert_data()
    train_model()
    reload_model()

    raise HTTPException(status_code=404, detail="Course not found")


@app.delete("/delete/{course_id}")
def delete_course(course_id: str):
    """Xóa một khóa học"""
    courses = load_courses()
    new_courses = [c for c in courses if c["id"] != course_id]

    if len(new_courses) == len(courses):
        raise HTTPException(status_code=404, detail="Course not found")

    save_courses(new_courses)
    convert_data()
    train_model()
    print(f"🗑️ Deleted course: {course_id}")
    return {"message": f"🗑️ Deleted course {course_id}", "total": len(new_courses)}


@app.post("/lesson/add")
def add_lesson(lesson: Lesson):
    courses = load_courses()
    for c in courses:
        if c["id"] == lesson.course_id:
            c.setdefault("lessons", []).append(lesson.dict())
            save_courses(courses)
            return {"message": f"✅ Added lesson {lesson.id} to course {lesson.course_id}"}
    convert_data()
    train_model()
    raise HTTPException(status_code=404, detail="Course not found")


@app.delete("/lesson/delete/{lesson_id}")
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
    convert_data()
    train_model()

    raise HTTPException(status_code=404, detail="Lesson not found")


@app.put("/lesson/update/{lesson_id}")
def update_lesson(lesson_id: str, new_data: dict = Body(...)):
    """Cập nhật thông tin lesson"""
    courses = load_courses()
    for c in courses:
        lessons = c.get("lessons", [])
        for l in lessons:
            if l["id"] == lesson_id:
                l.update(new_data)
                save_courses(courses)
                return {"message": f"✏️ Updated lesson {lesson_id}"}
    
    raise HTTPException(status_code=404, detail="Lesson not found")


@app.post("/review/add")
def add_review(review: dict = Body(...)):
    """Thêm review vào course"""
    courses = load_courses()
    course_id = review.get("course_id")
    
    if not course_id:
        raise HTTPException(status_code=400, detail="Missing course_id in review data")
    
    for c in courses:
        if c["id"] == course_id:
            c.setdefault("reviews", []).append(review)
            save_courses(courses)
            print(f"✅ Added review {review.get('id')} to course {course_id}")
            return {"message": f"✅ Added review to course {course_id}"}
    
    raise HTTPException(status_code=404, detail="Course not found")


@app.put("/review/update/{review_id}")
def update_review(review_id: str, new_data: dict = Body(...)):
    """Cập nhật thông tin review"""
    courses = load_courses()
    
    for c in courses:
        reviews = c.get("reviews", [])
        for r in reviews:
            if r["id"] == review_id:
                r.update(new_data)
                save_courses(courses)
                print(f"✏️ Updated review {review_id}")
                return {"message": f"✏️ Updated review {review_id}"}
    
    raise HTTPException(status_code=404, detail="Review not found")


@app.delete("/review/delete/{review_id}")
def delete_review(review_id: str):
    """Xóa review theo review_id"""
    courses = load_courses()
    
    for c in courses:
        reviews = c.get("reviews", [])
        new_reviews = [r for r in reviews if r["id"] != review_id]
        
        if len(new_reviews) < len(reviews):  # review đã bị xóa
            c["reviews"] = new_reviews
            save_courses(courses)
            print(f"🗑️ Deleted review {review_id} from course {c['id']}")
            return {"message": f"🗑️ Deleted review {review_id}"}
    
    raise HTTPException(status_code=404, detail="Review not found")


@app.post("/add-history")
async def add_history(request: Request):

    data = await request.json()

    required_fields = ["user_id", "keyword", "action_type", "course_id", "price"]
    for field in required_fields:
        if field not in data:
            return {"error": f"Missing required field: {field}"}

    # 🕒 Thêm timestamp nếu chưa có
    data["timestamp"] = data.get("timestamp", datetime.utcnow().isoformat())

    # 📁 Đọc file hiện tại (nếu có)
    if os.path.exists("data/response.json"):
        with open("data/response.json", "r", encoding="utf-8") as f:
            try:
                history = json.load(f)
            except json.JSONDecodeError:
                history = []
    else:
        history = []

    # ➕ Thêm bản ghi mới
    history.append(data)

    # 💾 Ghi lại file JSON
    with open("data/response.json", "w", encoding="utf-8") as f:
        json.dump(history, f, ensure_ascii=False, indent=2)

    print("✅ User activity added:", data)

    if not os.path.exists("data/user_history.csv"):
        convert_data()

    if  convert_data():
        train_model()
        reload_model() 
    
    
    return {"status": "ok", "message": "User activity logged successfully", "entry": data}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=3005)