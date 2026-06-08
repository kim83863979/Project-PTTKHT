import random
import os
from models import Node, CellState
dx     = [ 0, -1,  0,  1]
dy     = [ 1,  0, -1,  0]
HUONG  = ["E", "N", "W", "S"]
OPPOSITE = {"N": "S", "S": "N", "E": "W", "W": "E"}
 
DO   = "\033[91m"
TIM  = "\033[95m"
XANH = "\033[96m"
XANHLA  = "\033[92m"
XAM  = "\033[90m"
DAM  = "\033[1m"
RST  = "\033[0m"
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
 
        # Vẽ animation mỗi vài bước
        if len(stack) % max(1, rows * cols // 60) == 0 or not stack:
            os.system("cls")
            print(ve_mecung(grid, rows, cols, set(stack), stack[-1] if stack else None))
            print(f"\n  Stack: {len(stack)}\n")
 
 
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

def ve_mecung(grid, rows, cols, stack_set, current):
    lines = []
    lines.append(XAM + "┌" + "──┬" * (cols - 1) + "──┐" + RST)
 
    for r in range(rows):
        hang = XAM + "│" + RST
        for c in range(cols):
            node = grid[r][c]
            pos  = (r, c)
 
            if node.state == CellState.START.value:
                nd = XANH + "S " + RST
            elif node.state == CellState.END.value:
                nd = XANHLA  + "E " + RST
            elif pos == current:
                nd = DO   + "██" + RST
            elif pos in stack_set:
                nd = TIM  + "▓▓" + RST
            elif node.visited:
                nd = "  "
            else:
                nd = XAM  + "██" + RST
 
            hang += nd
            if c < cols - 1:
                hang += (XAM + "│" + RST) if node.wall["E"] else " "
            else:
                hang += XAM + "│" + RST
        lines.append(hang)
 
        if r < rows - 1:
            sep = XAM + "├"
            for c in range(cols):
                sep += "──" if grid[r][c].wall["S"] else "  "
                sep += "┼" if c < cols - 1 else "┤"
            lines.append(sep + RST)
        else:
            lines.append(XAM + "└" + "──┴" * (cols - 1) + "──┘" + RST)
 
    return "\n".join(lines)
def main():
    try:
        size = os.get_terminal_size()
        rows = max(3, (size.lines - 4) // 2)
        cols = max(3, (size.columns - 1) // 3)
    except OSError:
        rows, cols = 10, 20
 
    grid = make_grid(rows, cols)
 
    os.system("clear")
    explore(0, 0, grid, rows, cols)
 
    os.system("clear")
    print(f"\n  {DAM}✓ HOÀN THÀNH  —  {rows}×{cols}{RST}\n")
    print(ve_mecung(grid, rows, cols, set(), None))
    print(f"\n  {XANH}S{RST} = Xuất phát    {XANHLA}E{RST} = Đích\n")
 
if __name__ == "__main__":
    main()           

    
    
