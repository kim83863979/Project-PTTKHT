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
    el.classList.add("ui-locked");   // tuỳ chọn: thêm class để style CSS
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
  lockUI();                              // ← khóa trước khi bắt đầu

  try {
    const result = await fetchAlgorithm();          // gọi API Python
    await animateVisited(result.visited_order);     // loang màu từng ô
    await animatePath(result.path);                 // tô đường đi
    updateDashboard(result);                        // cập nhật số liệu
  } finally {
    unlockUI();                          // ← mở khóa khi xong (kể cả lỗi)
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
  const gridData = getGridData();   // hàm lấy trạng thái lưới hiện tại

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
  document.getElementById("stat-visited").textContent = result.visited_order.length;
  document.getElementById("stat-time").textContent = result.time_ms.toFixed(3) + " ms";
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
