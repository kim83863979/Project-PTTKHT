/* ==========================================================================
   1. CẤU HÌNH BIẾN TOÀN CỤC & KHỞI TẠO LƯỚI
   ========================================================================== */
const ROWS = 30;
const COLS = 50;
const gridContainer = document.getElementById("grid");

let mouseDown = false;
let isAnimating = false;

const startPos = { row: 10, col: 10 };
const endPos   = { row: 10, col: 40 };

function createGrid() {
  gridContainer.innerHTML = "";
  for (let row = 0; row < ROWS; row++) {
    for (let col = 0; col < COLS; col++) {
      const cell = document.createElement("div");
      cell.classList.add("cell");
      cell.dataset.row = row;
      cell.dataset.col = col;

      if (row === startPos.row && col === startPos.col) cell.classList.add("start");
      if (row === endPos.row   && col === endPos.col)   cell.classList.add("end");

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

function toggleWall(cell) {
  if (cell.classList.contains("start") || cell.classList.contains("end")) return;
  cell.classList.toggle("wall");
}

document.addEventListener("mousedown", () => { mouseDown = true; });
document.addEventListener("mouseup",   () => { mouseDown = false; });


/* ==========================================================================
   2. KHÓA / MỞ KHÓA GIAO DIỆN KHI ANIMATION CHẠY
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
   3. HELPER DOM
   ========================================================================== */
function getCellElement(r, c) {
  return document.querySelector(`[data-row="${r}"][data-col="${c}"]`);
}

function getGridData() {
  const cells = document.querySelectorAll(".cell");
  return Array.from(cells).map((el) => ({
    row:     parseInt(el.dataset.row),
    col:     parseInt(el.dataset.col),
    is_wall: el.classList.contains("wall"),
    weight:  parseInt(el.dataset.weight || "1"),
  }));
}


/* ==========================================================================
   4. ANIMATION + DASHBOARD
   ========================================================================== */
function clearAnimation() {
  document.querySelectorAll(".visited, .path").forEach((cell) => {
    cell.classList.remove("visited", "path");
  });
}

// visited_order trả về dạng [[row, col], ...] từ main.py
function animateVisited(visitedOrder) {
  return new Promise((resolve) => {
    if (!visitedOrder || visitedOrder.length === 0) { resolve(); return; }

    const slider      = document.getElementById("speed-slider");
    const sliderValue  = slider ? parseInt(slider.value) : 5;
    const delay        = Math.max(1, (11 - sliderValue) * 3);

    let i = 0;
    function step() {
      if (i >= visitedOrder.length) { resolve(); return; }
      const [r, c] = visitedOrder[i];
      const cell = getCellElement(r, c);
      if (cell) cell.classList.add("visited");
      i++;
      setTimeout(step, delay);
    }
    step();
  });
}

// path trả về dạng [[row, col], ...] từ main.py
function animatePath(path) {
  return new Promise((resolve) => {
    if (!path || path.length === 0) { resolve(); return; }
    let i = 0;
    function step() {
      if (i >= path.length) { resolve(); return; }
      const [r, c] = path[i];
      const cell = getCellElement(r, c);
      if (cell) cell.classList.add("path");
      i++;
      setTimeout(step, 25);
    }
    step();
  });
}

function updateDashboard(result) {
  document.getElementById("stat-cost").textContent    = result.cost ?? 0;
  document.getElementById("stat-visited").textContent = (result.visited_order?.length ?? 0);
  document.getElementById("stat-time").textContent    = (result.time_ms?.toFixed(2) ?? 0) + " ms";
}

function showNoPathMessage() {
  let banner = document.getElementById("no-path-banner");
  if (!banner) {
    banner = document.createElement("div");
    banner.id = "no-path-banner";
    banner.className = "no-path-banner";
    banner.textContent = "⚠ Không tìm thấy đường đi từ điểm Bắt đầu đến điểm Kết thúc.";
    const dashboard = document.querySelector(".dashboard");
    dashboard.insertAdjacentElement("afterend", banner);
  }
  banner.classList.add("show");
 
  clearTimeout(showNoPathMessage._timer);
  showNoPathMessage._timer = setTimeout(() => {
    banner.classList.remove("show");
  }, 3500);
}

// Vẽ tường mê cung từ Randomized DFS — node.wall = {N, S, E, W}
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
   5. ĐIỀU HƯỚNG DÒNG CHẠY CHÍNH
   ========================================================================== */
async function runAlgorithm() {
  if (isAnimating) return;

  clearAnimation();
  isAnimating = true;
  lockUI();

  try {
    const result = await fetchMatrix();

    if (result.status === "success") {
      await animateVisited(result.visited_order);
      await animatePath(result.path);
      updateDashboard(result);
    } else {
      alert("Lỗi thuật toán: " + result.message);
    }
  } catch (error) {
    console.error(error);
    alert("Không kết nối được với Server Python! Hãy đảm bảo bạn đã gõ lệnh uvicorn ở backend.");
  } finally {
    isAnimating = false;
    unlockUI();
  }
}

async function generateMaze() {
  if (isAnimating) return;

  clearAnimation();
  document.querySelectorAll(".cell.wall, .wall-n, .wall-s, .wall-e, .wall-w").forEach((el) => {
    el.classList.remove("wall", "wall-n", "wall-s", "wall-e", "wall-w");
  });

  isAnimating = true;
  lockUI();

  try {
    const result = await fetchMaze();

    if (result.status === "success") {
      renderMaze(result.path);   // DFS trả path = danh sách node đã thăm
      updateDashboard(result);
    } else {
      alert("Lỗi sinh mê cung: " + result.message);
    }
  } catch (error) {
    console.error(error);
    alert("Không kết nối được với Server Python! Hãy đảm bảo bạn đã gõ lệnh uvicorn ở backend.");
  } finally {
    isAnimating = false;
    unlockUI();
  }
}

function clearBoard() {
  if (isAnimating) return;
  clearAnimation();
  document.querySelectorAll(".cell").forEach((cell) => {
    cell.classList.remove("wall", "wall-n", "wall-s", "wall-e", "wall-w");
  });
  document.getElementById("stat-cost").textContent    = "0";
  document.getElementById("stat-visited").textContent = "0";
  document.getElementById("stat-time").textContent    = "0 ms";
}


/* ==========================================================================
   6. KÍCH HOẠT KHI TẢI TRANG SẴN SÀNG
   ========================================================================== */
document.addEventListener("DOMContentLoaded", () => {
  createGrid();

  document.getElementById("btn-run").addEventListener("click", runAlgorithm);
  document.getElementById("btn-maze").addEventListener("click", generateMaze);
  document.getElementById("btn-clear").addEventListener("click", clearBoard);
});