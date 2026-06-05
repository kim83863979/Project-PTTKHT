from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from models import MatrixPayload

# Khởi tạo server
app = FastAPI(
    title="Matrix Processing API",
    description="API tiếp nhận dữ liệu ma trận từ Frontend",
    version="1.0"
)

# Cấu hình CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)


@app.get("/")
def home():
    return {
        "message": "Backend Server đang hoạt động"
    }


@app.post("/matrix")
def receive_matrix(data: MatrixPayload):

    matrix = data.grid

    rows = len(matrix)
    cols = len(matrix[0]) if rows > 0 else 0

    return {
        "status": "success",
        "message": "Đã nhận dữ liệu ma trận",
        "rows": rows,
        "cols": cols,
        "matrix": matrix
    }
