import os
import time
import uuid
import base64
import json
from io import BytesIO
from typing import List
from datetime import datetime

import cv2
import numpy as np
from PIL import Image

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from starlette.responses import JSONResponse

from sqlalchemy import create_engine, Column, String, Integer, JSON as JSONField
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

import requests
import insightface
import faiss
from dotenv import load_dotenv
load_dotenv()


# ===========================================================
# CONFIG
# ===========================================================

ROOT_FACE_DIR = "employee_faces"         # per-site folder storage
ROOT_DB_DIR = "sites"                    # SQLite per site
ROOT_FAISS_DIR = "faiss_data"            # FAISS per site

os.makedirs(ROOT_FACE_DIR, exist_ok=True)
os.makedirs(ROOT_DB_DIR, exist_ok=True)
os.makedirs(ROOT_FAISS_DIR, exist_ok=True)

MODEL_NAME = "buffalo_l"
EMBEDDING_DIM = 512
MAX_IMAGES_PER_EMPLOYEE = 5
CONFIDENCE_THRESHOLD = 0.35

# ERPNext Config (use environment vars)
ERP_URL = os.getenv("ERP_URL")
ERP_KEY = os.getenv("ERP_KEY")
ERP_SECRET = os.getenv("ERP_SECRET")

USE_GPU = 0

ERP_HEADERS = {
    "Authorization": f"token {ERP_KEY}:{ERP_SECRET}",
    "Content-Type": "application/json"
}


# ===========================================================
# FASTAPI init
# ===========================================================

app_api = FastAPI()


# ===========================================================
# Load InsightFace Model
# ===========================================================

print("Loading InsightFace model...")
insight = insightface.app.FaceAnalysis(name=MODEL_NAME)
insight.prepare(ctx_id=0 if USE_GPU == 1 else -1, det_size=(640, 640))
print("Model loaded.")


# ===========================================================
# Pydantic Models
# ===========================================================

class RegisterMultipleRequest(BaseModel):
    site_id: str
    employee_id: str
    employee_name: str
    images: List[str]


class RecognizeRequest(BaseModel):
    site_id: str
    image: str
    latitude: float
    longitude: float
    device_id: str


# ===========================================================
# Helper: return site-specific DB
# ===========================================================

def get_site_db(site_id):
    path = f"{ROOT_DB_DIR}/{site_id}_faces.db"
    engine = create_engine(f"sqlite:///{path}", connect_args={"check_same_thread": False})
    Base = declarative_base()

    class Employee(Base):
        __tablename__ = "employees"
        id = Column(String, primary_key=True)
        name = Column(String)
        embeddings = Column(JSONField)
        total_images = Column(Integer, default=0)

    Base.metadata.create_all(engine)

    Session = sessionmaker(bind=engine)
    return Session(), Employee


# ===========================================================
# Helper: Load FAISS per-site
# ===========================================================

faiss_cache = {}  # in memory: {site_id: (index, vectors, store)}

def load_faiss_for_site(site_id):
    if site_id in faiss_cache:
        return faiss_cache[site_id]

    faiss_file = f"{ROOT_FAISS_DIR}/{site_id}.index"
    meta_file = f"{ROOT_FAISS_DIR}/{site_id}_meta.json"

    if not os.path.exists(faiss_file):
        index = faiss.IndexFlatIP(EMBEDDING_DIM)
        vectors = np.zeros((0, EMBEDDING_DIM), dtype="float32")
        store = []
        faiss_cache[site_id] = (index, vectors, store)
        return index, vectors, store

    index = faiss.read_index(faiss_file)
    with open(meta_file, "r") as f:
        meta = json.load(f)
        vectors = np.array(meta["vectors"], dtype="float32")
        store = meta["mappings"]

    faiss_cache[site_id] = (index, vectors, store)
    return index, vectors, store


def save_faiss_for_site(site_id, index, vectors, store):
    faiss_file = f"{ROOT_FAISS_DIR}/{site_id}.index"
    meta_file = f"{ROOT_FAISS_DIR}/{site_id}_meta.json"

    faiss.write_index(index, faiss_file)
    with open(meta_file, "w") as f:
        json.dump({
            "vectors": vectors.tolist(),
            "mappings": store
        }, f)


# ===========================================================
# Helpers
# ===========================================================

def base64_to_bgr(b64):
    try:
        raw = base64.b64decode(b64.split(",")[-1])
        arr = np.frombuffer(raw, np.uint8)
        img = cv2.imdecode(arr, cv2.IMREAD_COLOR)
        return img
    except:
        return None


def extract_embedding(img_bgr):
    faces = insight.get(img_bgr)
    if not faces:
        return None
    best = max(faces, key=lambda f: f.det_score)
    emb = best.normed_embedding.astype("float32")
    return emb


def compress_selfie(b64):
    raw = base64.b64decode(b64.split(",")[-1])
    img = Image.open(BytesIO(raw))

    img = img.transpose(Image.FLIP_LEFT_RIGHT)
    if img.width > 700:
        ratio = 700 / img.width
        img = img.resize((700, int(img.height * ratio)), Image.Resampling.LANCZOS)

    buf = BytesIO()
    img.save(buf, format="JPEG", quality=65)
    encoded = base64.b64encode(buf.getvalue()).decode("utf-8")
    return encoded


# ===========================================================
# ERPNext FUNCTIONS
# ===========================================================

def erp_request(method, path, params=None, json_payload=None):
    url = f"{ERP_URL.rstrip('/')}/{path.lstrip('/')}"
    try:
        if method.lower() == "get":
            r = requests.get(url, headers=ERP_HEADERS, params=params, timeout=15)
        elif method.lower() == "post":
            r = requests.post(url, headers=ERP_HEADERS, json=json_payload, timeout=15)
        elif method.lower() == "put":
            r = requests.put(url, headers=ERP_HEADERS, json=json_payload, timeout=15)
        else:
            raise ValueError("Unsupported method")
    except Exception as e:
        # network/timeout/etc
        print(f"[ERP REQUEST ERROR] {method.upper()} {url} -> {e}")
        return None, str(e)

    try:
        data = r.json()
    except Exception:
        data = None

    return r, data

# -----------------------
# Safe: get last Employee Checkin
# -----------------------
def erp_get_last_checkin(employee):
    """Fetch last checkin and then fetch full document to ensure log_type is included."""

    # Step 1: Get list (may not include log_type)
    params = {
        "filters": json.dumps([["employee", "=", employee]]),
        "order_by": "time desc",
        "limit_page_length": 1,
        "fields": '["name","employee","log_type","time"]'
    }

    r, data = erp_request("get", "/api/resource/Employee Checkin", params=params)
    if r is None or r.status_code != 200:
        return None

    items = data.get("data") if isinstance(data, dict) else None
    if not items:
        return None

    last = items[0]
    checkin_name = last.get("name")

    # Step 2: Fetch full document to ensure we ALWAYS get log_type
    r2, data2 = erp_request("get", f"/api/resource/Employee Checkin/{checkin_name}")
    if r2 and r2.status_code == 200:
        full_doc = data2.get("data", {})
        return full_doc

    # Fall back to summary
    return last


# -----------------------
# Safe next_log() - defensive
# -----------------------
def next_log(last):
    """Decides next log based on last log_type; defaults to IN."""

    if not last:
        return "IN"

    # Extract log_type from full ERPNext response
    log_type = last.get("log_type") or last.get("log type") or last.get("type")

    # If ERPNext still didn’t send it — default to IN
    if log_type not in ("IN", "OUT"):
        return "IN"

    return "OUT" if log_type == "IN" else "IN"


# -----------------------
# Safe create checkin / upload helpers using erp_request
# -----------------------
def erp_create_checkin(employee, log_type, lat, lon, device_id):
    payload = {
        "employee": employee,
        "log_type": log_type,
        "time": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        "latitude": lat,
        "longitude": lon,
        "device_id": device_id
    }
    r, data = erp_request("post", "/api/resource/Employee Checkin", json_payload=payload)
    if r is None:
        return False, data  # data contains error string from erp_request
    if r.status_code not in (200, 201):
        return False, r.text
    # data expected to be {"data": {...}}
    return True, data.get("data", {}).get("name")

def erp_upload_selfie(checkin_name, b64):
    payload = {
        "doctype": "Employee Checkin",
        "attached_to_name": checkin_name,
        "file_name": f"selfie_{checkin_name}.jpg",
        "is_private": 1,
        "content": b64,
        "decode": True
    }
    r, data = erp_request("post", "/api/resource/File", json_payload=payload)
    if r is None:
        return False, data
    if r.status_code not in (200, 201):
        return False, r.text
    return True, data.get("data", {}).get("file_url")

def erp_update_selfie(checkin_name, url):
    # Put update, silently ignore failures (but print)
    r, data = erp_request("put", f"/api/resource/Employee Checkin/{checkin_name}", json_payload={"selfie": url})
    if r is None or r.status_code not in (200, 201):
        print(f"[ERP] update selfie failed: {r} {data}")

# ===========================================================
# ROUTE: Health
# ===========================================================

@app_api.get("/health")
def health():
    return {"status": "ok", "model": MODEL_NAME}


# ===========================================================
# ROUTE: Register Multiple Faces
# ===========================================================

@app_api.post("/register_multiple")
def register(req: RegisterMultipleRequest):

    session, Employee = get_site_db(req.site_id)

    emp = session.query(Employee).filter(Employee.id == req.employee_id).first()
    if not emp:
        emp = Employee(id=req.employee_id, name=req.employee_name, embeddings=[], total_images=0)
        session.add(emp)
        session.commit()
        session.refresh(emp)

    index, vectors, store = load_faiss_for_site(req.site_id)

    site_dir = f"{ROOT_FACE_DIR}/{req.site_id}"
    emp_dir = f"{site_dir}/{req.employee_id}"
    os.makedirs(emp_dir, exist_ok=True)

    saved, failed = 0, 0

    for i, image_b64 in enumerate(req.images, start=1):
        img = base64_to_bgr(image_b64)
        if img is None:
            failed += 1
            continue

        emb = extract_embedding(img)
        if emb is None:
            failed += 1
            continue

        # Save image
        fname = f"{req.employee_id}_{int(time.time())}_{i}.jpg"
        cv2.imwrite(os.path.join(emp_dir, fname), img)

        # Add to FAISS
        emb_vec = emb.reshape(1, EMBEDDING_DIM)
        vectors = np.vstack([vectors, emb_vec])
        index.add(emb_vec)

        vid = vectors.shape[0] - 1
        store.append({"employee_id": req.employee_id, "vector_id": vid})

        # Save in DB
        emp.embeddings.append({"file": fname, "vector_id": vid})
        saved += 1

    emp.total_images += saved
    session.commit()

    save_faiss_for_site(req.site_id, index, vectors, store)

    return {
        "success": True,
        "saved": saved,
        "failed": failed,
        "employee_id": req.employee_id
    }


# ===========================================================
# ROUTE: Recognize and Punch
# ===========================================================

@app_api.post("/recognize")
def recognize(req: RecognizeRequest):

    session, Employee = get_site_db(req.site_id)
    index, vectors, store = load_faiss_for_site(req.site_id)

    img = base64_to_bgr(req.image)
    if img is None:
        raise HTTPException(400, "Invalid image")

    emb = extract_embedding(img)
    if emb is None:
        return {"success": False, "error": "No face detected"}

    if index.ntotal == 0:
        return {"success": False, "error": "No employees registered for this site"}

    q = emb.reshape(1, EMBEDDING_DIM)
    D, I = index.search(q, 10)

    results = []
    for score, idx in zip(D[0], I[0]):
        if idx < len(store):
            results.append({
                "employee_id": store[idx]["employee_id"],
                "score": float(score)
            })

    if not results:
        return {"success": False, "error": "No match"}

    best = max(results, key=lambda x: x["score"])
    if best["score"] < CONFIDENCE_THRESHOLD:
        return {"success": False, "error": "Low confidence"}

    employee = best["employee_id"]

    # ERPNext Punch
    last = erp_get_last_checkin(employee)
    log_type = next_log(last)

    ok, checkin_name = erp_create_checkin(
        employee, log_type,
        req.latitude, req.longitude,
        req.device_id
    )
    if not ok:
        return {"success": False, "error": "ERPNext checkin failed", "detail": checkin_name}

    # Upload selfie
    compressed = compress_selfie(req.image)
    ok2, file_url = erp_upload_selfie(checkin_name, compressed)
    if ok2:
        erp_update_selfie(checkin_name, file_url)
    emp_obj = session.query(Employee).filter(Employee.id == employee).first()
    employee_name = emp_obj.name if emp_obj else employee

    return {
        "success": True,
        "site_id": req.site_id,
        "employee_id": employee,
        "employee_name": employee_name,
        "log_type": log_type,
        "checkin_name": checkin_name,
        "selfie_url": file_url,
        "confidence": best["score"]
    }


# ===========================================================
# Uvicorn Entry
# ===========================================================

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("server:app_api", host="0.0.0.0", port=5000, workers=1)
