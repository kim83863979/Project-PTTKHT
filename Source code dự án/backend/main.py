import time
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from models import MatrixPayload
from algorithms import dijkstra_algorithm, a_star_algorithm
# 🔥 ĐƯỜNG DÂY KẾT NỐI: Import hàm truy vết của Gia Bân từ utils
from utils import reconstruct_path
from maze import explore, maze_to_node_grid, scale_point, unscale_path

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

LAST_MAZE = {"node_grid": None, "rows": 0, "cols": 0}

@app.post("/api/solve")
def solve_matrix(data: MatrixPayload):
    try:
        node_grid = data.build_node_grid()
        sr, sc = data.start
        er, ec = data.end
 
        start_time = time.perf_counter()
 
        # ── Randomized DFS: sinh mê cung ──
        if data.algorithm == "dfs":
            for r in range(data.rows):
                for c in range(data.cols):
                    node_grid[r][c].wall = {"N": True, "S": True, "E": True, "W": True}
 
            explore(sr, sc, node_grid, data.rows, data.cols)
 
            # Lưu lại để dùng cho A*/Dijkstra ngay sau đó
            LAST_MAZE["node_grid"] = node_grid
            LAST_MAZE["rows"] = data.rows
            LAST_MAZE["cols"] = data.cols
 
            end_time = time.perf_counter()
            execution_time_ms = (end_time - start_time) * 1000
 
            path_json = [
                node_grid[r][c].to_dict()
                for r in range(data.rows)
                for c in range(data.cols)
                if node_grid[r][c].visited
            ]
 
            return {
                "status":        "success",
                "visited_order": [],
                "path":          path_json,
                "cost":          0,
                "time_ms":       execution_time_ms,
            }
 
        # ── Tìm đường: A* / Dijkstra ──
        use_maze = (
            LAST_MAZE["node_grid"] is not None
            and LAST_MAZE["rows"] == data.rows
            and LAST_MAZE["cols"] == data.cols
        )
 
        if use_maze:
            # Có mê cung từ DFS -> chuyển sang lưới gấp đôi để giữ đúng logic tường
            work_grid, wrows, wcols = maze_to_node_grid(LAST_MAZE["node_grid"], data.rows, data.cols)
            wsr, wsc = scale_point(sr, sc)
            wer, wec = scale_point(er, ec)
            
            def neighbor_fn(node, grid):
                neighbors = []
                for dr, dc in [(-1, 0), (1, 0), (0, -1), (0, 1)]:
                    nr, nc = node.row + dr, node.col + dc
                    if 0 <= nr < wrows and 0 <= nc < wcols:
                        nb = grid[nr][nc]
                        if not nb.is_blocked:
                            neighbors.append(nb)
                return neighbors
        else:
            # Không có mê cung -> dùng grid người dùng tự vẽ tường (is_blocked)
            work_grid = node_grid
            wsr, wsc, wer, wec = sr, sc, er, ec
 
        start_node = work_grid[wsr][wsc]
        end_node   = work_grid[wer][wec]
 
        if data.algorithm == "astar":
            visited_order, found = a_star_algorithm(work_grid, start_node, end_node, neighbor_fn)
        elif data.algorithm == "dijkstra":
            visited_order, found = dijkstra_algorithm(work_grid, start_node, end_node, neighbor_fn)
        else:
            return {"status": "error", "message": f"Thuật toán {data.algorithm} đang được phát triển."}
        end_time = time.perf_counter()
        execution_time_ms = (end_time - start_time) * 1000
 
        path = []
        cost = 0
 
        if found:
            path = reconstruct_path(end_node)
            for r, c in path:
                cost += work_grid[r][c].weight
            if len(path) > 2:
                path = path[1:-1]
 
            if use_maze:
                path          = unscale_path(path)
                visited_order = unscale_path(visited_order)
 
        return {
            "status":        "success",
            "visited_order": visited_order,
            "path":          path,
            "cost":          cost if found else 0,
            "time_ms":       execution_time_ms,
        }
 
    except Exception as e:
        return {"status": "error", "message": str(e)}