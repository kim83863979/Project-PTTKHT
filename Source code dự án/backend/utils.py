from models import Node
from typing import List

def reconstruct_path(end_node: Node) -> List[List[int]]:
    """
    Duyệt ngược từ node Đích (End) về node Đầu (Start) dựa vào con trỏ .parent
    """
    path = []
    current = end_node

    while current is not None:
        path.append([current.row, current.col])
        current = current.parent

    path.reverse()
    return path