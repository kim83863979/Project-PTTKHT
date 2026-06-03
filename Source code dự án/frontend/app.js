// Xử lý tương tác chuột + khóa/mở khóa UI khi animation đang chạy
// ── Danh sách các phần tử cần khóa
const LOCKABLE = [
  ...document.querySelectorAll("button"),
  ...document.querySelectorAll("input[type=range]"),
];

// ── Khóa toàn bộ nút bấm và thanh trượt
function lockUI() {
  LOCKABLE.forEach((el) => {
    el.disabled = true;
    el.classList.add("ui-locked"); // tuỳ chọn: thêm class để style CSS
  });
}

// ── Mở khóa lại khi animation hoàn thành
function unlockUI() {
  LOCKABLE.forEach((el) => {
    el.disabled = false;
    el.classList.remove("ui-locked");
  });
}

// ── Chạy thuật toán + animation
async function runAlgorithm() {
  lockUI(); // ← khóa trước khi bắt đầu

  try {
    const result = await fetchAlgorithm(); // gọi API Python
    await animateVisited(result.visited_order); // loang màu từng ô
    await animatePath(result.path); // tô đường đi
    updateDashboard(result); // cập nhật số liệu
  } finally {
    unlockUI(); // ← mở khóa khi xong (kể cả lỗi)
  }
}

// ── Animation: loang màu các ô đã thăm
function animateVisited(visitedOrder) {
  return new Promise((resolve) => {
    let i = 0;

    function step() {
      if (i >= visitedOrder.length) {
        resolve();
        return;
      }
      const [r, c] = visitedOrder[i];
      const cell = getCellElement(r, c);
      if (cell) cell.classList.add("visited");
      i++;
      requestAnimationFrame(step);
    }

    requestAnimationFrame(step);
  });
}

// ── Animation: tô màu đường đi tối ưu
function animatePath(path) {
  return new Promise((resolve) => {
    let i = 0;

    function step() {
      if (i >= path.length) {
        resolve();
        return;
      }
      const [r, c] = path[i];
      const cell = getCellElement(r, c);
      if (cell) cell.classList.add("path");
      i++;
      requestAnimationFrame(step);
    }

    requestAnimationFrame(step);
  });
}

// ── Gọi API Python (FastAPI/Flask)
async function fetchAlgorithm() {
  const algorithm = document.getElementById("algo-select").value;
  const gridData = getGridData(); // hàm lấy trạng thái lưới hiện tại

  const response = await fetch("/api/solve", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ algorithm, grid: gridData }),
  });

  if (!response.ok) throw new Error("API error: " + response.status);
  return response.json();
}

// ── Cập nhật dashboard số liệu
function updateDashboard(result) {
  document.getElementById("stat-cost").textContent = result.cost;
  document.getElementById("stat-visited").textContent =
    result.visited_order.length;
  document.getElementById("stat-time").textContent =
    result.time_ms.toFixed(3) + " ms";
}

// ── Helper: lấy DOM element của ô (row, col)
function getCellElement(r, c) {
  return document.querySelector(`[data-row="${r}"][data-col="${c}"]`);
}

// ── Helper: đọc trạng thái lưới từ DOM
function getGridData() {
  const cells = document.querySelectorAll(".cell");
  return Array.from(cells).map((el) => ({
    row: parseInt(el.dataset.row),
    col: parseInt(el.dataset.col),
    is_wall: el.classList.contains("wall"),
    weight: parseInt(el.dataset.weight || "1"),
  }));
}

// ── Gắn sự kiện nút Run ──────────────────────────────────────────────────────
document.getElementById("btn-run").addEventListener("click", runAlgorithm);

//VÂN ANH

/*BIẾN TOÀN CỤC*/

let isMouseDown = false;
let isAnimating = false;
let dragType = null;

/*VẼ TƯỜNG + KÉO THẢ START/END*/

function attachCellEvents(cell) {
  // Vẽ/Xóa tường
  cell.addEventListener("mousedown", () => {
    if (isAnimating) return;

    if (cell.classList.contains("start") || cell.classList.contains("end"))
      return;

    isMouseDown = true;

    cell.classList.toggle("wall");
  });

  cell.addEventListener("mouseover", () => {
    if (isAnimating) return;

    if (!isMouseDown) return;

    if (cell.classList.contains("start") || cell.classList.contains("end"))
      return;

    cell.classList.add("wall");
  });

  // Kéo Start / End
  cell.addEventListener("dragstart", () => {
    if (cell.classList.contains("start")) {
      dragType = "start";
    }

    if (cell.classList.contains("end")) {
      dragType = "end";
    }
  });

  cell.addEventListener("dragover", (e) => {
    e.preventDefault();
  });

  cell.addEventListener("drop", (e) => {
    e.preventDefault();

    if (isAnimating) return;

    if (cell.classList.contains("wall")) return;

    if (dragType === "start") {
      const oldStart = document.querySelector(".start");

      if (oldStart) {
        oldStart.classList.remove("start");
      }

      cell.classList.add("start");
      cell.draggable = true;
    }

    if (dragType === "end") {
      const oldEnd = document.querySelector(".end");

      if (oldEnd) {
        oldEnd.classList.remove("end");
      }

      cell.classList.add("end");
      cell.draggable = true;
    }
  });
}

/*THẢ CHUỘT*/

document.addEventListener("mouseup", () => {
  isMouseDown = false;
});

/*XÓA ANIMATION CŨ*/

function clearAnimation() {
  document.querySelectorAll(".visited, .path").forEach((cell) => {
    cell.classList.remove("visited");
    cell.classList.remove("path");
  });
}

/*KHÓA / MỞ KHÓA UI*/

const LOCKABLE = [
  ...document.querySelectorAll("button"),
  ...document.querySelectorAll("input[type=range]"),
];

function lockUI() {
  LOCKABLE.forEach((el) => {
    el.disabled = true;
    el.classList.add("ui-locked");
  });
}

function unlockUI() {
  LOCKABLE.forEach((el) => {
    el.disabled = false;
    el.classList.remove("ui-locked");
  });
}

/*LẤY DỮ LIỆU GRID*/

function getGridData() {
  const cells = document.querySelectorAll(".cell");

  return Array.from(cells).map((el) => ({
    row: parseInt(el.dataset.row),

    col: parseInt(el.dataset.col),

    is_wall: el.classList.contains("wall"),

    is_start: el.classList.contains("start"),

    is_end: el.classList.contains("end"),

    weight: parseInt(el.dataset.weight || "1"),
  }));
}

/*CHẠY THUẬT TOÁN*/

async function runAlgorithm() {
  clearAnimation();

  isAnimating = true;

  lockUI();

  try {
    const result = await fetchAlgorithm();

    await animateVisited(result.visited_order);

    await animatePath(result.path);

    updateDashboard(result);
  } catch (error) {
    console.error(error);

    alert(error.message);
  } finally {
    isAnimating = false;

    unlockUI();
  }
}

/*GẮN SỰ KIỆN NÚT RUN*/

document.getElementById("btn-run").addEventListener("click", runAlgorithm);
