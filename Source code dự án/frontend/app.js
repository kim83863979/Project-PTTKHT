/* ==========================================================================
   1. CẤU HÌNH BIẾN TOÀN CỤC
   ========================================================================== */
const MAZE_API_BASE_URL = "http://127.0.0.1:8000";
let ROWS = 30;
let COLS = 50;
let startPos = { row: 10, col: 10 };
let endPos = { row: 10, col: 40 };

let mouseDown = false;
let isAnimating = false;
let isMazeActive = false;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function getAnimationDelay() {
  const slider = document.getElementById("speed-slider");
  if (!slider) return 10;
  const speed = parseInt(slider.value, 10);
  return (100 - speed) * 8;
}

/* ==========================================================================
   2. HÀM TẠO LƯỚI (ĐÃ SỬA LỖI TRẮNG MA TRẬN)
   ========================================================================== */
function createGrid() {
  // 🌟 FIX LỖI 1: Lấy ID "grid" trực tiếp bên trong hàm để chắc chắn HTML đã tải xong
  const gridContainer = document.getElementById("grid");
  if (!gridContainer) {
    console.error("Lỗi: Không tìm thấy thẻ có id='grid' trên HTML!");
    return;
  }

  gridContainer.innerHTML = "";
  gridContainer.style.display = "grid";
  gridContainer.style.gridTemplateRows = `repeat(${ROWS}, 1fr)`;
  gridContainer.style.gridTemplateColumns = `repeat(${COLS}, 1fr)`;

  for (let row = 0; row < ROWS; row++) {
    for (let col = 0; col < COLS; col++) {
      const cell = document.createElement("div");
      cell.classList.add("cell");
      cell.dataset.row = row;
      cell.dataset.col = col;

      if (row === startPos.row && col === startPos.col)
        cell.classList.add("start");
      if (row === endPos.row && col === endPos.col) cell.classList.add("end");

      cell.addEventListener("mousedown", () => {
        if (isAnimating) return;
        toggleWall(cell);
      });

      cell.addEventListener("mouseover", () => {
        if (isAnimating) return;
        if (mouseDown) toggleWall(cell);
      });

      gridContainer.appendChild(cell);
    }
  }
}

// Thay đổi kích thước của ma trận
function changeGridSize() {
  const sizeSelect = document.getElementById("size-select");
  if (!sizeSelect) return;
  const sizeType = sizeSelect.value;

  if (sizeType === "small") {
    ROWS = 20;
    COLS = 20;
    startPos = { row: 3, col: 3 };
    endPos = { row: 16, col: 16 };
  } else if (sizeType === "medium") {
    ROWS = 20;
    COLS = 35;
    startPos = { row: 7, col: 7 };
    endPos = { row: 7, col: 28 };
  } else {
    ROWS = 30;
    COLS = 50;
    startPos = { row: 10, col: 10 };
    endPos = { row: 10, col: 40 };
  }

  isMazeActive = false;
  clearBoard();
  createGrid();
}

function toggleWall(cell) {
  if (cell.classList.contains("start") || cell.classList.contains("end"))
    return;
  cell.classList.toggle("wall");
}

document.addEventListener("mousedown", () => {
  mouseDown = true;
});
document.addEventListener("mouseup", () => {
  mouseDown = false;
});

/* ==========================================================================
   3. KHÓA / MỞ KHÓA GIAO DIỆN KHI ANIMATION CHẠY
   ========================================================================== */
function getLockableElements() {
  return [
    ...document.querySelectorAll("button"),
    ...document.querySelectorAll("select"),
    ...document.querySelectorAll("input[type=range]"),
  ];
}

function lockUI() {
  getLockableElements().forEach((el) => {
    el.disabled = true;
    el.classList.add("ui-locked");
  });
}

function unlockUI() {
  getLockableElements().forEach((el) => {
    el.disabled = false;
    el.classList.remove("ui-locked");
  });
}

/* ==========================================================================
   4. HELPER DOM
   ========================================================================== */
function getCellElement(r, c) {
  return document.querySelector(`[data-row="${r}"][data-col="${c}"]`);
}

function getGridData() {
  const cells = document.querySelectorAll(".cell");
  return Array.from(cells).map((el) => ({
    row: parseInt(el.dataset.row),
    col: parseInt(el.dataset.col),
    is_wall: el.classList.contains("wall"),
    weight: parseInt(el.dataset.weight || "1"),
  }));
}

/* ==========================================================================
   5. ANIMATION & DASHBOARD
   ========================================================================== */
function clearAnimation() {
  document.querySelectorAll(".visited, .path").forEach((cell) => {
    cell.classList.remove("visited", "path");
  });
}

async function animateVisited(visitedOrder, algoKey) {
  isAnimating = true;
  const barVisited = document.getElementById("stat-visited");
  const modalVisited = document.getElementById(`m-${algoKey}-visited`);

  for (let i = 0; i < visitedOrder.length; i++) {
    if (!isAnimating) return;

    const [r, c] = visitedOrder[i];
    const cell = document.querySelector(
      `.cell[data-row='${r}'][data-col='${c}']`,
    );
    if (
      cell &&
      !cell.classList.contains("start") &&
      !cell.classList.contains("end")
    ) {
      cell.classList.add("visited");
    }

    if (barVisited) barVisited.textContent = i + 1;
    if (modalVisited) modalVisited.textContent = i + 1;

    const delay = getAnimationDelay();
    if (delay > 0) {
      await sleep(delay);
    }
  }
}

async function animatePath(path, finalCost, algoKey) {
  for (let i = 0; i < path.length; i++) {
    if (!isAnimating) return;

    const [r, c] = path[i];
    const cell = document.querySelector(
      `.cell[data-row='${r}'][data-col='${c}']`,
    );
    if (
      cell &&
      !cell.classList.contains("start") &&
      !cell.classList.contains("end")
    ) {
      cell.classList.add("path");
    }
    await sleep(15);
  }

  if (document.getElementById("stat-cost"))
    document.getElementById("stat-cost").textContent = finalCost ?? 0;
  if (document.getElementById(`m-${algoKey}-cost`))
    document.getElementById(`m-${algoKey}-cost`).textContent =
      (finalCost ?? 0) + " ô";

  isAnimating = false;
}

function showNoPathMessage() {
  let banner = document.getElementById("no-path-banner");
  if (!banner) {
    banner = document.createElement("div");
    banner.id = "no-path-banner";
    banner.className = "no-path-banner";
    banner.textContent =
      "⚠ Không tìm thấy đường đi từ điểm Bắt đầu đến điểm Kết thúc.";
    const dashboard = document.querySelector(".dashboard");
    if (dashboard) dashboard.insertAdjacentElement("afterend", banner);
  }
  banner.classList.add("show");

  clearTimeout(showNoPathMessage._timer);
  showNoPathMessage._timer = setTimeout(() => {
    banner.classList.remove("show");
  }, 3500);
}

function renderMaze(nodes) {
  if (!nodes) return;
  nodes.forEach((node) => {
    const cell = getCellElement(node.row, node.col);
    if (!cell) return;
    cell.classList.remove("visited", "path", "wall");
    if (!node.wall) return;
    cell.classList.toggle("wall-n", node.wall.N);
    cell.classList.toggle("wall-s", node.wall.S);
    cell.classList.toggle("wall-e", node.wall.E);
    cell.classList.toggle("wall-w", node.wall.W);
  });
}

/* ==========================================================================
   6. GỌI API KẾT NỐI BACKEND
   ========================================================================== */
async function fetchMatrix() {
  const algorithm = document.getElementById("algo-select").value;
  const payload = {
    rows: ROWS,
    cols: COLS,
    grid: buildGridPayload(),
    start: [startPos.row, startPos.col],
    end: [endPos.row, endPos.col],
    algorithm: algorithm,
    allow_diagonal: false,
    heuristic: "manhattan",
  };

  const response = await fetch(
    `${MAZE_API_BASE_URL}/api/solve?is_maze=${isMazeActive}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    },
  );
  if (!response.ok) throw new Error(`Lỗi server: ${response.status}`);
  return response.json();
}

async function fetchMaze() {
  const payload = {
    rows: ROWS,
    cols: COLS,
    grid: buildGridPayload(),
    start: [startPos.row, startPos.col],
    end: [endPos.row, endPos.col],
    algorithm: "Rd_dfs",
    allow_diagonal: false,
    heuristic: "manhattan",
  };

  const response = await fetch(`${MAZE_API_BASE_URL}/api/solve?is_maze=false`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!response.ok) throw new Error(`Lỗi server: ${response.status}`);
  return response.json();
}

function buildGridPayload() {
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

async function runAlgorithm() {
  if (isAnimating) return;

  clearAnimation();
  isAnimating = true;
  lockUI();

  const algoKey = document.getElementById("algo-select").value;

  try {
    const result = await fetchMatrix();

    if (result.status === "success") {
      document.getElementById("stat-time").textContent =
        result.time_ms.toFixed(2) + " ms";
      if (document.getElementById(`m-${algoKey}-time`)) {
        document.getElementById(`m-${algoKey}-time`).textContent =
          result.time_ms.toFixed(2) + " ms";
      }

      document
        .querySelectorAll(".comparison-table tr")
        .forEach((tr) => tr.classList.remove("row-highlight"));
      const activeRow = document.getElementById(`modal-row-${algoKey}`);
      if (activeRow) activeRow.classList.add("row-highlight");

      document.getElementById("stat-cost").textContent = "0";
      document.getElementById("stat-visited").textContent = "0";

      await animateVisited(result.visited_order, algoKey);

      if (result.path.length === 0) {
        showNoPathMessage();
        isAnimating = false;
        unlockUI();
      } else {
        await animatePath(result.path, result.cost, algoKey);
      }
    } else {
      alert("Lỗi thuật toán: " + result.message);
    }
  } catch (error) {
    console.error(error);
    alert(
      "Không kết nối được với Server Python! Hãy đảm bảo bạn đã gõ lệnh uvicorn ở backend.",
    );
  } finally {
    isAnimating = false;
    unlockUI();
  }
}

async function generateMaze() {
  if (isAnimating) return;

  clearAnimation();
  document
    .querySelectorAll(".cell.wall, .wall-n, .wall-s, .wall-e, .wall-w")
    .forEach((el) => {
      el.classList.remove("wall", "wall-n", "wall-s", "wall-e", "wall-w");
    });

  isAnimating = true;
  lockUI();
  isMazeActive = true;

  try {
    const result = await fetchMaze();

    if (result.status === "success") {
      renderMaze(result.path);
      document.getElementById("stat-time").textContent =
        result.time_ms.toFixed(2) + " ms";
      document.getElementById("stat-cost").textContent = "0";
      document.getElementById("stat-visited").textContent = "0";
    } else {
      alert("Lỗi sinh mê cung: " + result.message);
    }
  } catch (error) {
    console.error(error);
    alert(
      "Không kết nối được với Server Python! Hãy đảm bảo bạn đã gõ lệnh uvicorn ở backend.",
    );
  } finally {
    isAnimating = false;
    unlockUI();
  }
}

function clearBoard() {
  if (isAnimating) return;
  clearAnimation();
  isMazeActive = false;

  document.querySelectorAll(".cell").forEach((cell) => {
    cell.classList.remove("wall", "wall-n", "wall-s", "wall-e", "wall-w");
  });

  document.getElementById("stat-cost").textContent = "0";
  document.getElementById("stat-visited").textContent = "0";
  document.getElementById("stat-time").textContent = "0 ms";

  // 🌟 Đã thêm "dfs" vào danh sách để dọn dẹp số liệu khi xóa bảng
  const algos = ["bfs", "dfs", "dijkstra", "astar"];
  algos.forEach((k) => {
    if (document.getElementById(`m-${k}-cost`))
      document.getElementById(`m-${k}-cost`).textContent = "-";
    if (document.getElementById(`m-${k}-visited`))
      document.getElementById(`m-${k}-visited`).textContent = "-";
    if (document.getElementById(`m-${k}-time`))
      document.getElementById(`m-${k}-time`).textContent = "-";
  });
  document
    .querySelectorAll(".comparison-table tr")
    .forEach((tr) => tr.classList.remove("row-highlight"));
}

/* ==========================================================================
   7. KHỞI ĐỘNG HỆ THỐNG AN TOÀN (CHỈ CHẠY KHI HTML ĐÃ TẢI XONG 100%)
   ========================================================================== */
document.addEventListener("DOMContentLoaded", () => {
  // Chờ HTML vẽ xong mới tiến hành dựng lưới ma trận
  createGrid();

  // 🌟 FIX LỖI 2: Dùng if để kiểm tra, nếu thiếu nút nào trên HTML cũng không làm sập code
  const sizeSelect = document.getElementById("size-select");
  if (sizeSelect) sizeSelect.addEventListener("change", changeGridSize);

  const btnRun = document.getElementById("btn-run");
  if (btnRun) btnRun.addEventListener("click", runAlgorithm);

  const btnMaze = document.getElementById("btn-maze");
  if (btnMaze) btnMaze.addEventListener("click", generateMaze);

  const btnClear = document.getElementById("btn-clear");
  if (btnClear) btnClear.addEventListener("click", clearBoard);

  // Setup hệ thống bảng Modal ẩn so sánh thống kê
  const modal = document.getElementById("stats-modal");
  const openBtn = document.getElementById("open-stats-btn");
  const closeBtn = document.getElementById("close-stats-btn");

  if (openBtn && modal && closeBtn) {
    openBtn.addEventListener("click", () => modal.classList.add("active"));
    closeBtn.addEventListener("click", () => modal.classList.remove("active"));
    modal.addEventListener("click", (e) => {
      if (e.target === modal) modal.classList.remove("active");
    });
  }
});
