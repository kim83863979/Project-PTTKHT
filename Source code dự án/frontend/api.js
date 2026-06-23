const API_URL = "http://127.0.0.1:8000";

// ── Gọi API sinh mê cung (Randomized DFS)
async function fetchMaze() {
  const payload = {
    rows: ROWS,
    cols: COLS,
    grid: buildGrid(),
    start: [startPos.row, startPos.col],
    end: [endPos.row, endPos.col],
    algorithm: "Rd_dfs",
    allow_diagonal: false,
    heuristic: "manhattan",
  };

  const response = await fetch(`${API_URL}/api/solve`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!response.ok) throw new Error(`Lỗi server: ${response.status}`);
  return response.json();
}

// ── Gọi API tìm đường (A*, Dijkstra, BFS)
async function fetchMatrix() {
  const algorithm = document.getElementById("algo-select").value;

  const payload = {
    rows: ROWS,
    cols: COLS,
    grid: buildGrid(),
    start: [startPos.row, startPos.col],
    end: [endPos.row, endPos.col],
    algorithm: algorithm,
    allow_diagonal: false,
    heuristic: "manhattan",
  };

  const response = await fetch(`${API_URL}/api/solve`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!response.ok) throw new Error(`Lỗi server: ${response.status}`);
  return response.json();
}

// ── Xây grid từ DOM để gửi lên Python
function buildGrid() {
  const rawGridData = getGridData();
  const matrixGrid = [];

  for (let r = 0; r < ROWS; r++) {
    const rowItems = [];
    for (let c = 0; c < COLS; c++) {
      const index = r * COLS + c;
      const cell = rawGridData[index];
      rowItems.push({
        blocked: cell ? cell.is_wall : false,
        weight: cell ? parseFloat(cell.weight || 1) : 1.0,
      });
    }
    matrixGrid.push(rowItems);
  }

  return matrixGrid;
}

async function clearBoard() {
  if (isAnimating) return;
  clearAnimation();

  // 1. Xóa sạch các vách tường đen hiển thị trên màn hình trình duyệt
  document
    .querySelectorAll(".cell")
    .forEach((cell) => cell.classList.remove("wall"));

  // 2. Bắn tín hiệu POST ép Server FastAPI phải xóa trắng bộ nhớ đệm LAST_MAZE
  try {
    await fetch(`${API_URL}/api/clear`, { method: "POST" });
  } catch (error) {
    console.error("Không thể làm sạch bộ nhớ đệm mê cung trên Server:", error);
  }

  // 3. Reset các chỉ số trên bảng điện tử Dashboard về 0
  const statCost = document.getElementById("stat-cost");
  const statVisited = document.getElementById("stat-visited");
  const statTime = document.getElementById("stat-time");

  if (statCost) statCost.textContent = "0";
  if (statVisited) statVisited.textContent = "0";
  if (statTime) statTime.textContent = "0 ms";
}
