const API_URL = "http://localhost:8000";

// ── Gọi API sinh mê cung (Randomized DFS)
async function fetchMaze() {
  const payload = {
    rows:           ROWS,
    cols:           COLS,
    grid:           buildGrid(),
    start:          [startPos.row, startPos.col],
    end:            [endPos.row,   endPos.col],
    algorithm:      "dfs",
    allow_diagonal: false,
    heuristic:      "manhattan",
  };

  const response = await fetch(`${API_URL}/api/solve`, {
    method:  "POST",
    headers: { "Content-Type": "application/json" },
    body:    JSON.stringify(payload),
  });

  if (!response.ok) throw new Error(`Lỗi server: ${response.status}`);
  return response.json();
}

// ── Gọi API tìm đường (A*, Dijkstra)
async function fetchMatrix() {
  const algorithm = document.getElementById("algo-select").value;

  const payload = {
    rows:           ROWS,
    cols:           COLS,
    grid:           buildGrid(),
    start:          [startPos.row, startPos.col],
    end:            [endPos.row,   endPos.col],
    algorithm:      algorithm,
    allow_diagonal: false,
    heuristic:      "manhattan",
  };

  const response = await fetch(`${API_URL}/api/solve`, {
    method:  "POST",
    headers: { "Content-Type": "application/json" },
    body:    JSON.stringify(payload),
  });

  if (!response.ok) throw new Error(`Lỗi server: ${response.status}`);
  return response.json();
}

// ── Xây grid từ DOM
function buildGrid() {
  const rawGridData = getGridData();
  const matrixGrid  = [];

  for (let r = 0; r < ROWS; r++) {
    const rowItems = [];
    for (let c = 0; c < COLS; c++) {
      const index = r * COLS + c;
      const cell  = rawGridData[index];
      rowItems.push({
        blocked: cell ? cell.is_wall                 : false,
        weight:  cell ? parseFloat(cell.weight || 1) : 1.0,
      });
    }
    matrixGrid.push(rowItems);
  }
  
  return matrixGrid;
}