import time
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from models import MatrixPayload
from algorithms import bfs_algorithm, dijkstra_algorithm, a_star_algorithm, dfs_algorithm
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

# Bộ nhớ đệm lưu mê cung ẩn trên RAM máy chủ
LAST_MAZE = {"node_grid": None, "rows": 0, "cols": 0}

# 🌟 CỔNG XOÁ AN TOÀN: Khi Front-end bấm nút Clear Board thì mới xóa cache trên RAM
@app.post("/api/clear")
def clear_maze_cache():
    LAST_MAZE["node_grid"] = None
    LAST_MAZE["rows"] = 0
    LAST_MAZE["cols"] = 0
    return {"status": "success", "message": "Đã xóa bộ nhớ đệm mê cung trên Server"}

@app.post("/api/solve")
def solve_matrix(data: MatrixPayload):
    try:
        node_grid = data.build_node_grid()
        sr, sc = data.start
        er, ec = data.end
 
        start_time = time.perf_counter()
 
        # Randomized DFS: sinh mê cung
        if data.algorithm == "Rd_dfs":
            for r in range(data.rows):
                for c in range(data.cols):
                    node_grid[r][c].wall = {"N": True, "S": True, "E": True, "W": True}
            explore(sr, sc, node_grid, data.rows, data.cols)

            # Lưu lại để dùng cho BFS/DFS/A*/Dijkstra 
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
                "status": "success",
                "visited_order": [],
                "path": path_json,
                "cost": 0,
                "time_ms": execution_time_ms,
            }
        use_maze = (
            LAST_MAZE["node_grid"] is not None
            and LAST_MAZE["rows"] == data.rows
            and LAST_MAZE["cols"] == data.cols
        )
        if use_maze:
            # Có mê cung từ DFS -> chuyển sang lưới gấp đôi
            work_grid, wrows, wcols = maze_to_node_grid(LAST_MAZE["node_grid"], data.rows, data.cols)
            wsr, wsc = scale_point(sr, sc)
            wer, wec = scale_point(er, ec)
            
            def current_neighbors_func(node, grid):
                neighbors = []
                for dr, dc in [(-1, 0), (1, 0), (0, -1), (0, 1)]:
                    nr, nc = node.row + dr, node.col + dc
                    if 0 <= nr < wrows and 0 <= nc < wcols:
                        nb = grid[nr][nc]
                        if not nb.is_blocked:
                            neighbors.append(nb)
                return neighbors
        else:
            # Không có mê cung -> Chạy trên lưới trống hoặc lưới người dùng tự vẽ tay
            work_grid = node_grid
            wsr, wsc, wer, wec = sr, sc, er, ec
            current_neighbors_func = data.get_neighbors
 
        start_node = work_grid[wsr][wsc]
        end_node   = work_grid[wer][wec]
        
        # Tìm đường: BFS/ DFS/ A* / Dijkstra
        if data.algorithm == "astar":
            visited_order, success = a_star_algorithm(work_grid, start_node, end_node, current_neighbors_func)
        elif data.algorithm == "dijkstra":
            visited_order, success = dijkstra_algorithm(work_grid, start_node, end_node, current_neighbors_func)
        elif data.algorithm == "bfs":
            visited_order, success = bfs_algorithm(work_grid, start_node, end_node, current_neighbors_func)
        elif data.algorithm == "dfs":
            visited_order, success = dfs_algorithm(work_grid, start_node, end_node, current_neighbors_func)
        else:
            return {"status": "error", "message": f"Thuật toán {data.algorithm} chưa được tích hợp."}
            
        end_time = time.perf_counter()
        execution_time_ms = (end_time - start_time) * 1000
 
        path = []
        cost = 0
 
        if success:
            path = reconstruct_path(end_node)
            for r, c in path:
                cost += work_grid[r][c].weight
            if len(path) > 2:
                path = path[1:-1]
 
            if use_maze:
                path = unscale_path(path)
                visited_order = unscale_path(visited_order)
        else:
            if use_maze:
                visited_order = unscale_path(visited_order)
            return{
                "status": "no_path",
                "message": "không tìm thấy đường đi",
                "visited_order": visited_order,
                "path":          [],
                "cost":          0,
                "time_ms":       execution_time_ms,
            }
        return {
            "status": "success",
            "visited_order": visited_order,
            "path":          path,
            "cost":          cost if success else 0,
            "time_ms":       execution_time_ms,
        }
 
    except Exception as e:
        return {"status": "error", "message": str(e)}