from fastapi import FastAPI, UploadFile, File
from transformers import AutoFeatureExtractor, AutoModelForImageClassification
import cv2, torch, numpy as np, tempfile, time
from fastapi.middleware.cors import CORSMiddleware
from tqdm import tqdm

app = FastAPI(title="NSFW Video Detector")


app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

MODEL_NAME = "Falconsai/nsfw_image_detection"
DESIRED_FPS = 15
BATCH_SIZE = 16
DIFF_THRESHOLD = 5.0
NSFW_THRESHOLD = 0.5

device = "cuda" if torch.cuda.is_available() else "cpu"
extractor = AutoFeatureExtractor.from_pretrained(MODEL_NAME)
model = AutoModelForImageClassification.from_pretrained(MODEL_NAME).to(device)
model.eval()


@app.post("/check_nsfw")
async def check_nsfw(file: UploadFile = File(...)):
    print(f"🔥 Received request to /check_nsfw: filename={file.filename}")

    """
    Endpoint nhận 1 video, quét toàn bộ khung hình và trả kết quả:
    {
        "is_nsfw": bool,
        "nsfw_frames": [...],
        "total_checked": int,
        "processing_time": float
    }
    """
    with tempfile.NamedTemporaryFile(delete=False, suffix=".mp4") as tmp:
        tmp.write(await file.read())
        video_path = tmp.name

    cap = cv2.VideoCapture(video_path)
    if not cap.isOpened():
        return {"error": "Cannot open video"}

    video_fps = cap.get(cv2.CAP_PROP_FPS) or 30.0
    frame_count = int(cap.get(cv2.CAP_PROP_FRAME_COUNT) or 0)
    step = max(1, round(video_fps / DESIRED_FPS))

    nsfw_frames = []
    frames_batch, batch_indices = [], []
    prev_gray = None
    checked = 0
    start_time = time.time()

    for i in tqdm(range(0, frame_count, step)):
        cap.set(cv2.CAP_PROP_POS_FRAMES, i)
        ret, frame = cap.read()
        if not ret:
            continue

        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
        if prev_gray is not None:
            diff = np.mean(cv2.absdiff(gray, prev_gray))
            if diff < DIFF_THRESHOLD:
                continue
        prev_gray = gray

        rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        frames_batch.append(rgb)
        batch_indices.append(i)
        checked += 1

        if len(frames_batch) >= BATCH_SIZE:
            inputs = extractor(images=frames_batch, return_tensors="pt").to(device)
            with torch.no_grad():
                logits = model(**inputs).logits
                preds = torch.softmax(logits, dim=1)[:, 1].cpu().numpy()

            for idx, score in zip(batch_indices, preds):
                if score > NSFW_THRESHOLD:
                    timestamp_sec = idx / video_fps
                    nsfw_frames.append({
                        "frame_idx": idx,
                        "time_s": timestamp_sec,
                        "score": float(score)
                    })


            frames_batch.clear()
            batch_indices.clear()

    cap.release()
    elapsed = time.time() - start_time

    is_nsfw = len(nsfw_frames) > 0
    

    return {
        "is_nsfw": is_nsfw,
        "nsfw_frames": nsfw_frames,
        "total_checked": checked,
        "processing_time": round(elapsed, 2)
    }
