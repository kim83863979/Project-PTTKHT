from collections import deque
import heapq

def manhattan_distance(node_a, node_b):
    """Hàm la bàn tính khoảng cách ước lượng cho thuật toán A*"""
    return abs(node_a.row - node_b.row) + abs(node_a.col - node_b.col)


def bfs_algorithm(grid, start_node, end_node, get_neighbors_func):
    # Khởi tạo/Làm sạch trạng thái của ma trận Node trước khi chạy
    for row in grid:
        for node in row:
            node.parent = None

    # Khởi tạo Hàng đợi (Queue) đặc trưng cho BFS sử dụng deque
    queue = deque([start_node])
    visited = {start_node}
    visited_nodes_order = []

    while queue:
        current = queue.popleft()

        # Lưu lại thứ tự quét (Bỏ qua điểm đầu và cuối để tránh đè màu giao diện)
        if current != start_node and current != end_node:
            visited_nodes_order.append([current.row, current.col])

        # Kịch bản thành công: Chạm tới đích
        if current == end_node:
            return visited_nodes_order, True

        # Duyệt các ô hàng xóm lân cận thông qua hàm gánh biên
        for neighbor in get_neighbors_func(current, grid):
            if neighbor not in visited:
                visited.add(neighbor)
                neighbor.parent = current  # Lưu vết ô cha trực tiếp vào Node phục vụ utils.py
                queue.append(neighbor)

    return visited_nodes_order, False


def dijkstra_algorithm(grid, start_node, end_node, get_neighbors_func):
    """
    Thuật toán Dijkstra chuẩn hóa theo cấu trúc đối tượng Node
    """
    # Khởi tạo/Làm sạch trạng thái của ma trận Node trước khi chạy
    for row in grid:
        for node in row:
            node.g_cost = float('inf')
            node.parent = None

    start_node.g_cost = 0.0
    count = 0
    
    # Min-Heap lưu tuple: (g_cost, count, node_object)
    heap = [(0.0, count, start_node)]
    visited_nodes_order = []

    while heap:
        g_current, _, current = heapq.heappop(heap)

        # Cơ chế Lazy deletion tối ưu Min-Heap
        if g_current > current.g_cost:
            continue

        # Lưu lại thứ tự quét (Bỏ qua điểm đầu và cuối để tránh đè màu giao diện)
        if current != start_node and current != end_node:
            visited_nodes_order.append([current.row, current.col])

        # Kịch bản thành công: Chạm tới đích
        if current == end_node:
            return visited_nodes_order, True

        # Duyệt các ô hàng xóm lân cận (4 hướng) thông qua hàm của Gia Bân
        for neighbor in get_neighbors_func(current, grid):
            g_new = current.g_cost + neighbor.weight

            if g_new < neighbor.g_cost:
                neighbor.g_cost = g_new
                neighbor.parent = current
                count += 1
                heapq.heappush(heap, (g_new, count, neighbor))

    return visited_nodes_order, False


def a_star_algorithm(grid, start_node, end_node, get_neighbors_func):
    """
    Thuật toán A* chuẩn hóa theo cấu trúc đối tượng Node
    """
    # Khởi tạo/Làm sạch trạng thái của ma trận Node trước khi chạy
    for row in grid:
        for node in row:
            node.g_cost = float('inf')
            node.f_cost = float('inf')
            node.parent = None

    start_node.g_cost = 0.0
    start_node.h_cost = manhattan_distance(start_node, end_node)
    start_node.f_cost = start_node.h_cost

    count = 0
    # Min-Heap sắp xếp theo f_cost thay vì g_cost
    open_set = [(start_node.f_cost, count, start_node)]
    visited_nodes_order = []

    while open_set:
        f_current, _, current = heapq.heappop(open_set)

        if f_current > current.f_cost:
            continue

        if current != start_node and current != end_node:
            visited_nodes_order.append([current.row, current.col])

        if current == end_node:
            return visited_nodes_order, True

        # Duyệt các ô hàng xóm lân cận (4 hướng) 
        for neighbor in get_neighbors_func(current, grid):
            tentative_g_score = current.g_cost + neighbor.weight

            if tentative_g_score < neighbor.g_cost:
                neighbor.parent = current
                neighbor.g_cost = tentative_g_score
                neighbor.h_cost = manhattan_distance(neighbor, end_node)
                neighbor.f_cost = neighbor.g_cost + neighbor.h_cost
                
                count += 1
                heapq.heappush(open_set, (neighbor.f_cost, count, neighbor))

    return visited_nodes_order, False