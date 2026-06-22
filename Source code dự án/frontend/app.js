/* ==========================================================================
   1. CẤU HÌNH BIẾN TOÀN CỤC & KHỞI TẠO LƯỚI
   ========================================================================== */
let ROWS = 30;
let COLS = 50;
let startPos = { row: 10, col: 10 };
let endPos = { row: 10, col: 40 };
const gridContainer = document.getElementById("grid");

let mouseDown = false;
let isAnimating = false;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function getAnimationDelay() {
  const slider = document.getElementById("speed-slider");
  if (!slider) return 10;

  const speed = parseInt(slider.value, 10);
  return (100 - speed) * 8;
}

function createGrid() {
  gridContainer.innerHTML = "";
  for (let row = 0; row < ROWS; row++) {
    for (let col = 0; col < COLS; col++) {
      const cell = document.createElement("div");
      const board = document.getElementById("grid");
      board.style.gridTemplateRows = `repeat(${ROWS}, 1fr)`;
      board.style.gridTemplateColumns = `repeat(${COLS}, 1fr)`;
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
  const sizeType = document.getElementById("size-select").value;

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

  clearBoard();
  createGrid(); // Hàm vẽ các ô div lên màn hình
}
document
  .getElementById("size-select")
  .addEventListener("change", changeGridSize);

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
    row: parseInt(el.dataset.row),
    col: parseInt(el.dataset.col),
    is_wall: el.classList.contains("wall"),
    weight: parseInt(el.dataset.weight || "1"),
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

async function animateVisited(visitedOrder) {
  isAnimating = true; // Khóa các nút bấm khi đang chạy

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
    const delay = getAnimationDelay();
    if (delay > 0) {
      await sleep(delay);
    }
  }
}

async function animatePath(path) {
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
  isAnimating = false;
}

function updateDashboard(result) {
  document.getElementById("stat-cost").textContent = result.cost ?? 0;
  document.getElementById("stat-visited").textContent =
    result.visited_order?.length ?? 0;
  document.getElementById("stat-time").textContent =
    (result.time_ms?.toFixed(2) ?? 0) + " ms";
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

  try {
    const result = await fetchMaze();

    if (result.status === "success") {
      renderMaze(result.path); // DFS trả path = danh sách node đã thăm
      updateDashboard(result);
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
  document.querySelectorAll(".cell").forEach((cell) => {
    cell.classList.remove("wall", "wall-n", "wall-s", "wall-e", "wall-w");
  });
  document.getElementById("stat-cost").textContent = "0";
  document.getElementById("stat-visited").textContent = "0";
  document.getElementById("stat-time").textContent = "0 ms";
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
