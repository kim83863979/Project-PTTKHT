#dijkstra
import heapq
def dijkstra(grid, start, end):
    """
    grid  : ma trận 2D, mỗi ô là dict {"is_wall": bool, "weight": int}
    start : (row, col) điểm bắt đầu
    end   : (row, col) điểm kết thúc

    Returns:
        path          – danh sách (row, col) từ start → end
        visited_order – thứ tự các ô được thăm (dùng cho animation)
        cost          – tổng chi phí đường đi tối ưu
    """
    rows, cols = len(grid), len(grid[0])

    # Bảng chi phí g: khởi tạo vô cực
    INF = float("inf")
    g = [[INF] * cols for _ in range(rows)]
    g[start[0]][start[1]] = 0

    parent = {}
    visited_order = []

    # Min-Heap: (g_cost, row, col)
    heap = [(0, start[0], start[1])]

    while heap:
        g_current, r, c = heapq.heappop(heap)

        # Lazy deletion: bỏ qua entry cũ
        if g_current > g[r][c]:
            continue

        visited_order.append((r, c))

        # Đến đích
        if (r, c) == end:
            return _reconstruct_path(parent, start, end), visited_order, g[r][c]

        # Relaxation: cập nhật chi phí g cho hàng xóm
        for nr, nc in _get_neighbors(grid, r, c, rows, cols):
            g_new = g_current + grid[nr][nc]["weight"]  # ← Tính g mới

            if g_new < g[nr][nc]:                       # ← So sánh
                g[nr][nc]          = g_new              # ← Cập nhật g
                parent[(nr, nc)]   = (r, c)
                heapq.heappush(heap, (g_new, nr, nc))   # ← Push Min-Heap

    return [], visited_order, INF  # không tìm thấy đường


def _get_neighbors(grid, r, c, rows, cols):
    for dr, dc in [(-1,0),(1,0),(0,-1),(0,1)]:
        nr, nc = r + dr, c + dc
        if 0 <= nr < rows and 0 <= nc < cols and not grid[nr][nc]["is_wall"]:
            yield nr, nc


def _reconstruct_path(parent, start, end):
    path, cur = [], end
    while cur != start:
        path.append(cur)
        cur = parent.get(cur)
        if cur is None:
            return []
    path.append(start)
    path.reverse()
    return path


# ── Demo ──────────────────────────────────────
if __name__ == "__main__":
    # Lưới 5x5, tường ký hiệu is_wall=True
    rows, cols = 5, 5
    grid = [[{"is_wall": False, "weight": 1} for _ in range(cols)] for _ in range(rows)]

    for c in range(1, 4): grid[1][c]["is_wall"] = True
    grid[2][1]["is_wall"] = True
    grid[3][1]["is_wall"] = True
    grid[3][3]["is_wall"] = True
    grid[4][3]["is_wall"] = True

    path, visited, cost = dijkstra(grid, (0,0), (4,4))
    print("Cost   :", cost)
    print("Path   :", path)
    print("Visited:", len(visited), "ô")
