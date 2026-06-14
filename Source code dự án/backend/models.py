from __future__ import annotations

from enum import Enum
from typing import Any, Dict, List, Optional, Tuple

from pydantic import BaseModel


# ==========================================================
# Cell State
# ==========================================================

class CellState(str, Enum):
    EMPTY = "empty"
    START = "start"
    END = "end"
    VISITED = "visited"
    PATH = "path"
    BLOCKED = "blocked"


# ==========================================================
# Direction
# ==========================================================

class Direction(str, Enum):
    UP = "up"
    DOWN = "down"
    LEFT = "left"
    RIGHT = "right"
    UP_LEFT = "up_left"
    UP_RIGHT = "up_right"
    DOWN_LEFT = "down_left"
    DOWN_RIGHT = "down_right"


# ==========================================================
# Node
# ==========================================================

class Node:
    """
    Node đại diện cho một ô trong ma trận.
    """

    def __init__(
        self,
        row: int,
        col: int,
        weight: float = 1.0,
        is_blocked: bool = False
    ):
        self.row = row
        self.col = col

        self.weight = weight
        self.is_blocked = is_blocked

        self.g_cost: Optional[float] = None
        self.h_cost: float = 0.0
        self.f_cost: Optional[float] = None
        self.path_cost: Optional[float] = None

        self.depth: int = 0

        self.state: str = CellState.EMPTY.value

        self.came_from: str = ""
        self.visit_order: int = 0
        self.open_count: int = 0

        self.neighbors_explored: List[Tuple[int, int]] = []

        self.parent: Optional["Node"] = None

        self.visited = False
        self.closed = False

    @property
    def position(self) -> Tuple[int, int]:
        return (self.row, self.col)

    def to_dict(self) -> Dict[str, Any]:
        return {
            "row": self.row,
            "col": self.col,
            "g_cost": self.g_cost,
            "h_cost": self.h_cost,
            "f_cost": self.f_cost,
            "path_cost": self.path_cost,
            "depth": self.depth,
            "state": self.state,
            "is_blocked": self.is_blocked,
            "weight": self.weight,
            "came_from": self.came_from,
            "visit_order": self.visit_order,
            "open_count": self.open_count,
            "neighbors_explored": self.neighbors_explored,
            "parent_position": (
                [self.parent.row, self.parent.col]
                if self.parent
                else None
            ),
        }

    def __repr__(self):
        return f"Node({self.row},{self.col})"


# ==========================================================
# Matrix Payload
# ==========================================================

class MatrixPayload(BaseModel):
    rows: int
    cols: int

    grid: List[List[Any]]

    start: List[int]
    end: List[int]

    algorithm: str = "astar"
    allow_diagonal: bool = False
    heuristic: str = "manhattan"

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> "MatrixPayload":
        return cls(**data)

    def build_node_grid(self) -> List[List[Node]]:
        """
        Chuyển grid thành ma trận Node.
        """
        node_grid: List[List[Node]] = []

        for r in range(self.rows):
            row_nodes = []
            for c in range(self.cols):
                value = self.grid[r][c]

                if isinstance(value, dict):
                    blocked = value.get("blocked", False)
                    weight = float(value.get("weight", 1))
                else:
                    blocked = value == 0
                    weight = 1.0

                node = Node(
                    row=r,
                    col=c,
                    weight=weight,
                    is_blocked=blocked
                )
                row_nodes.append(node)
            node_grid.append(row_nodes)

        sr, sc = self.start
        er, ec = self.end

        node_grid[sr][sc].state = CellState.START.value
        node_grid[er][ec].state = CellState.END.value

        return node_grid

    # 🔥 ĐÃ KHÔI PHỤC & NÂNG CẤP: Hàm quét ô hàng xóm lân cận của Gia Bân
    def get_neighbors(self, node: Node, node_grid: List[List[Node]]) -> List[Node]:
        """
        Quét và trả về danh sách các ô hàng xóm đi được xung quanh Node hiện tại.
        """
        neighbors = []
        
        # 4 hướng di chuyển cơ bản (Lên, Xuống, Trái, Phải)
        directions = [(-1, 0), (1, 0), (0, -1), (0, 1)]
        
        # Nếu Front-end bật cấu hình allow_diagonal = True thì nạp thêm 4 hướng chéo
        if self.allow_diagonal:
            directions.extend([(-1, -1), (-1, 1), (1, -1), (1, 1)])

        for dr, dc in directions:
            nr = node.row + dr
            nc = node.col + dc

            # Kiểm tra điều kiện biên ma trận (chống lỗi IndexError)
            if 0 <= nr < self.rows and 0 <= nc < self.cols:
                neighbor = node_grid[nr][nc]
                
                # Loại bỏ ngay ô tường chắn, chỉ giữ lại ô đi được
                if not neighbor.is_blocked:
                    neighbors.append(neighbor)

        return neighbors