import random
from models import Node, CellState
dx     = [ 0, -1,  0,  1]
dy     = [ 1,  0, -1,  0]
HUONG  = ["E", "N", "W", "S"]
OPPOSITE = {"N": "S", "S": "N", "E": "W", "W": "E"}

def explore(start_r, start_c, grid, rows, cols):
    """
    Randomized DFS dùng Stack
    """
    stack = [(start_r, start_c)]
    grid[start_r][start_c].visited = True
 
    while stack:
        x, y = stack[-1]   
 
        # Tìm ô liền kề chưa visited, xáo trộn ngẫu nhiên
        huongs = list(range(4))
        random.shuffle(huongs)
 
        co_the_di = []
        for i in huongs:
            nx, ny = x + dx[i], y + dy[i]
            if 0 <= nx < rows and 0 <= ny < cols:
                if not grid[nx][ny].visited and not grid[nx][ny].is_blocked:
                    co_the_di.append((nx, ny, HUONG[i]))
 
        if co_the_di:
            nx, ny, huong = co_the_di[0]
 
            # Bẻ tường 2 chiều
            grid[x][y].wall[huong]             = False
            grid[nx][ny].wall[OPPOSITE[huong]] = False
 
            grid[nx][ny].visited = True
            stack.append((nx, ny))             # push
        else:
            stack.pop()                        # quay lui 
 
def make_grid(rows, cols):
    """
    Tạo List[List[Node]], mỗi Node có thêm thuộc tính wall
    """
    grid = []
    for r in range(rows):
        row = []
        for c in range(cols):
            node = Node(row=r, col=c)
            node.wall = {"N": True, "S": True, "E": True, "W": True}
            row.append(node)
        grid.append(row)
 
    grid[0][0].state            = CellState.START.value
    grid[rows-1][cols-1].state  = CellState.END.value
 
    return grid

def maze_to_wall_grid(node_grid, rows, cols):
    """
    Tạo lưới mới kích thước (2*rows-1) x (2*cols-1).
    Mỗi ô gốc -> 1 điểm. Khoảng giữa 2 ô kề -> 1 "ô tường".
    Tường còn nguyên -> is_wall=True (chặn). Tường đã bẻ -> is_wall=False (đi qua được).
    """
    new_rows = 2 * rows - 1
    new_cols = 2 * cols - 1
 
    new_grid = [
        [{"is_wall": True, "weight": 1.0} for _ in range(new_cols)]
        for _ in range(new_rows)
    ]
 
    for r in range(rows):
        for c in range(cols):
            node = node_grid[r][c]
            nr, nc = 2 * r, 2 * c
 
            new_grid[nr][nc]["is_wall"] = node.is_blocked
            new_grid[nr][nc]["weight"]  = node.weight
 
            if c < cols - 1:                                    # tường Đông
                new_grid[nr][nc + 1]["is_wall"] = node.wall["E"]
            if r < rows - 1:                                    # tường Nam
                new_grid[nr + 1][nc]["is_wall"] = node.wall["S"]
 
    return new_grid, new_rows, new_cols
 
 
def scale_point(r, c):
    """Tọa độ gốc -> tọa độ trong lưới gấp đôi."""
    return 2 * r, 2 * c
 
 
def unscale_path(path):
    """Lọc bỏ các điểm tường, giữ lại điểm ô gốc, quy đổi về tọa độ gốc."""
    return [(r // 2, c // 2) for r, c in path if r % 2 == 0 and c % 2 == 0]
    
    
