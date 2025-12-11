import pandas as pd
import json
import os

def convert_data():

    # 1) đảm bảo file tồn tại
    if not os.path.exists("data/response.json"):
        with open("data/response.json", "w") as f:
            json.dump([], f)

    # Đọc dữ liệu người dùng
    df = pd.read_json("data/response.json")

    # loại timezone nếu có
    for col in df.select_dtypes(include=['datetimetz']).columns:
        df[col] = df[col].dt.tz_localize(None)

    # convert datetime về string luôn để csv stable
    for col in df.select_dtypes(include=['datetime64[ns]']).columns:
        df[col] = df[col].astype(str)

    df.to_csv("data/user_history.csv", index=False)

    # đọc courses
    with open("data/courses.json", "r", encoding="utf-8") as f:
        data = json.load(f)

    df = pd.json_normalize(data)

    # ✅ các feature
    df["lesson_count"] = df["lessons"].apply(lambda x: len(x) if isinstance(x, list) else 0)
    df["total_duration"] = df["lessons"].apply(lambda lessons: sum(l.get("duration_seconds", 0) for l in lessons) if isinstance(lessons, list) else 0)
    df["review_count"] = df["reviews"].apply(lambda x: len(x) if isinstance(x, list) else 0)
    df["avg_rating"] = df["reviews"].apply(lambda reviews: (sum(r.get("rating", 0) for r in reviews) / len(reviews)) if isinstance(reviews, list) and len(reviews) > 0 else 0)

    # Base columns that should always exist
    base_columns = [
        "id", "title", "price_bigint", "instructor_id",
        "lesson_count", "total_duration", "background", "review_count", "avg_rating", "slug"
    ]
    
    # Add categories if it exists
    if "categories" in df.columns:
        base_columns.append("categories")
    
    df_flat = df[base_columns]

    df_flat.to_csv("data/courses_cleaned.csv", index=False)

    print("✅ convert_data finished")

    return True   # <= cái này quan trọng
