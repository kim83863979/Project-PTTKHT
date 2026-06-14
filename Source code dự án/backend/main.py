import time
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from models import MatrixPayload
from algorithms import dijkstra_algorithm, a_star_algorithm
# 🔥 ĐƯỜNG DÂY KẾT NỐI: Import hàm truy vết của Gia Bân từ utils
from utils import reconstruct_path

app = FastAPI(
    title="Matrix Processing API",
    description="API tiếp nhận dữ liệu ma trận từ Frontend",
    version="1.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)

@app.get("/")
def home():
    return {"message": "Backend Server đang hoạt động"}

@app.post("/api/solve")
def solve_matrix(data: MatrixPayload):
    try:
        node_grid = data.build_node_grid()
        sr, sc = data.start
        er, ec = data.end
        start_node = node_grid[sr][sc]
        end_node = node_grid[er][ec]
        
        start_time = time.perf_counter()
        
        # 🔥 TRUYỀN HÀM: Đưa hàm data.get_neighbors vào làm tham số thứ 4
        if data.algorithm == "astar":
            visited_order, found = a_star_algorithm(node_grid, start_node, end_node, data.get_neighbors)
        elif data.algorithm == "dijkstra":
            visited_order, found = dijkstra_algorithm(node_grid, start_node, end_node, data.get_neighbors)
        else:
            return {"status": "error", "message": f"Thuật toán {data.algorithm} đang được phát triển."}
            
        end_time = time.perf_counter()
        execution_time_ms = (end_time - start_time) * 1000
        
        path = []
        cost = 0
        
        if found:
            # 🔥 SỬ DỤNG: Gọi hàm reconstruct_path của Gia Bân
            path = reconstruct_path(end_node)
            
            # Tính toán cost động dựa trên mảng đường đi thu được
            for r, c in path:
                cost += node_grid[r][c].weight
            
            # Tùy chọn: Loại bỏ ô start và end ra khỏi mảng path để giao diện không bị đè màu hoạt họa
            if len(path) > 2:
                path = path[1:-1]
                
        return {
            "status": "success",
            "visited_order": visited_order,
            "path": path,
            "cost": cost if found else 0,
            "time_ms": execution_time_ms
        }
        
    except Exception as e:
        return {"status": "error", "message": str(e)}