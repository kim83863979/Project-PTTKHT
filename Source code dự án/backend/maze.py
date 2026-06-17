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

def maze_to_node_grid(node_grid, rows, cols):
    """
    Trả về (new_grid, new_rows, new_cols).
    new_grid là List[List[Node]] kích thước (2*rows-1) x (2*cols-1).
    """
    new_rows = 2 * rows - 1
    new_cols = 2 * cols - 1
 
    new_grid = [
        [Node(row=r, col=c, is_blocked=True) for c in range(new_cols)]
        for r in range(new_rows)
    ]
 
    for r in range(rows):
        for c in range(cols):
            node = node_grid[r][c]
            nr, nc = 2 * r, 2 * c
 
            new_grid[nr][nc].is_blocked = node.is_blocked
            new_grid[nr][nc].weight      = node.weight
 
            if c < cols - 1:                                   # tường Đông
                new_grid[nr][nc + 1].is_blocked = node.wall["E"]
            if r < rows - 1:                                   # tường Nam
                new_grid[nr + 1][nc].is_blocked = node.wall["S"]
 
    return new_grid, new_rows, new_cols
 
def scale_point(r, c):
    """Tọa độ gốc -> tọa độ trong lưới gấp đôi."""
    return 2 * r, 2 * c
 
 
def unscale_path(path_rc_list):
    """
    Lọc danh sách [row, col] trong lưới gấp đôi,
    chỉ giữ điểm ô gốc, quy đổi về tọa độ gốc.
    """
    result = []
    for r, c in path_rc_list:
        if r % 2 == 0 and c % 2 == 0:
            result.append([r // 2, c // 2])
    return result
