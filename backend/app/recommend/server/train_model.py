import os
import numpy as np
import pandas as pd
import joblib
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from sklearn.preprocessing import LabelEncoder

def train_model():
    os.makedirs("models", exist_ok=True)

    courses = pd.read_csv("data/courses_cleaned.csv")
    interactions = pd.read_csv("data/user_history.csv")

    courses.fillna("", inplace=True)
    interactions = interactions[interactions["action_type"].isin(["view","enroll","search"])]
    interactions["user_id"] = interactions["user_id"].fillna("unknown_user")
    interactions["course_id"] = interactions["course_id"].fillna("unknown_course")
    interactions = interactions[interactions["course_id"] != ""]

    # ===== CONTENT BASED =====
    courses["text"] = courses["title"].astype(str)
    tfidf = TfidfVectorizer(stop_words="english")
    tfidf_matrix = tfidf.fit_transform(courses["text"])
    content_sim = cosine_similarity(tfidf_matrix)

    # ===== COLLABORATIVE =====
    if len(interactions) == 0:
        collab_sim = np.zeros_like(content_sim)
        user_enc = LabelEncoder().fit(["unknown_user"])
        course_enc = LabelEncoder().fit(["unknown_course"])
    else:
        user_enc = LabelEncoder()
        course_enc = LabelEncoder()
        user_enc.fit(interactions["user_id"])
        course_enc.fit(interactions["course_id"])

        interactions["user_idx"] = user_enc.transform(interactions["user_id"])
        interactions["course_idx"] = course_enc.transform(interactions["course_id"])

        num_users = len(user_enc.classes_)
        num_courses = len(course_enc.classes_)

        user_course_matrix = np.zeros((num_users, num_courses))

        for _, row in interactions.iterrows():
            weight = 1 if row["action_type"]=="view" else 2
            user_course_matrix[row["user_idx"], row["course_idx"]] += weight

        if num_courses > 1:
            collab_sim_partial = cosine_similarity(user_course_matrix.T)
        else:
            collab_sim_partial = np.zeros((num_courses, num_courses))

        collab_sim = np.zeros((len(courses), len(courses)))
        id_to_idx = {cid: i for i,cid in enumerate(courses["id"])}

        for i,cid_i in enumerate(course_enc.classes_):
            if cid_i not in id_to_idx: continue
            for j,cid_j in enumerate(course_enc.classes_):
                if cid_j not in id_to_idx: continue
                collab_sim[id_to_idx[cid_i], id_to_idx[cid_j]] = collab_sim_partial[i,j]

    # ===== HYBRID =====
    hybrid_sim = 0.6 * content_sim + 0.4 * collab_sim

    # ===== SAVE =====
    joblib.dump(tfidf, "models/tfidf_vectorizer.pkl")
    joblib.dump(tfidf_matrix, "models/tfidf_matrix.pkl")   
    joblib.dump(hybrid_sim, "models/course_similarity.pkl")
    joblib.dump(user_enc, "models/user_encoder.pkl")
    joblib.dump(course_enc, "models/course_encoder.pkl")

    courses.to_csv("models/courses_reference.csv", index=False)  

    print("✅ Train model thành công")
    print("Hybrid shape:", hybrid_sim.shape)

    return courses, interactions, user_enc, course_enc, hybrid_sim
