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
    try:
        # 🔥 ĐÂY LÀ BƯỚC TIẾP THEO: Gọi hàm của bạn để dựng ma trận Node logic
        node_grid = data.build_node_grid()
        
        # Thử lấy tọa độ điểm Start và End từ ma trận Node ra để kiểm tra
        start_row, start_col = data.start
        end_row, col_end = data.end
        start_node = node_grid[start_row][start_col]
        end_node = node_grid[end_row][col_end]
        
        # Trả về thông báo thành công cho Frontend
        return {
            "status": "success",
            "message": "Đã tiếp nhận và dựng ma trận Node thành công!",
            "info": {
                "rows": data.rows,
                "cols": data.cols,
                "start_node_state": start_node.state, # Sẽ in ra "start"
                "end_node_state": end_node.state      # Sẽ in ra "end"
            }
        }
        
    except Exception as e:
        return {
            "status": "error",
            "message": f"Quá trình dựng ma trận Node bị lỗi: {str(e)}"
        }
