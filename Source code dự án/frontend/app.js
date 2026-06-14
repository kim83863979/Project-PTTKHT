/* ==========================================================================
   1. CẤU HÌNH BIẾN TOÀN CỤC & KHỞI TẠO LƯỚI (VÂN ANH)
   ========================================================================== */
const ROWS = 30;
const COLS = 50;
const gridContainer = document.getElementById("grid");

let mouseDown = false;
let isAnimating = false; // Biến cờ để khóa tương tác khi đang chạy thuật toán

// Tọa độ cố định của điểm xuất phát và điểm đích
const startPos = { row: 10, col: 10 };
const endPos = { row: 10, col: 40 };

// Hàm tự động sinh lưới 30x50 ô vuông khi tải trang
function createGrid() {
  gridContainer.innerHTML = ""; // Làm sạch lưới cũ nếu có
  for (let row = 0; row < ROWS; row++) {
    for (let col = 0; col < COLS; col++) {
      const cell = document.createElement("div");
      cell.classList.add("cell");
      cell.dataset.row = row;
      cell.dataset.col = col;

      // Đặt vị trí hiển thị ban đầu cho Start và End
      if (row === startPos.row && col === startPos.col) {
        cell.classList.add("start");
      }
      if (row === endPos.row && col === endPos.col) {
        cell.classList.add("end");
      }

      // Gắn sự kiện tương tác chuột vẽ tường
      cell.addEventListener("mousedown", () => {
        if (isAnimating) return;
        toggleWall(cell);
      });

      cell.addEventListener("mouseover", () => {
        if (isAnimating) return;
        if (mouseDown) {
          toggleWall(cell);
        }
      });

      gridContainer.appendChild(cell);
    }
  }
}

function toggleWall(cell) {
  // Không cho phép vẽ tường đè lên ô Start hoặc ô End
  if (cell.classList.contains("start") || cell.classList.contains("end")) {
    return;
  }
  cell.classList.toggle("wall");
}

// Bắt sự kiện nhấn giữ chuột toàn màn hình để vẽ tường liên tục
document.addEventListener("mousedown", () => {
  mouseDown = true;
});
document.addEventListener("mouseup", () => {
  mouseDown = false;
});

/* ==========================================================================
   2. KHÓA / MỞ KHÓA GIAO DIỆN KHI ANIMATION CHẠY (Đ. THÁI)
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
   3. CHUẨN HÓA DỮ LIỆU ĐỂ ĐỒNG BỘ VỚI BACKEND PYTHON (Q. KIM)
   ========================================================================== */

// Helper lấy phần tử DOM nhanh theo tọa độ
function getCellElement(r, c) {
  return document.querySelector(`[data-row="${r}"][data-col="${c}"]`);
}

// Chuyển đổi trạng thái ô lưới trên web thành Ma trận 2 chiều chuẩn Pydantic Model
function getGridMatrixData() {
  const matrix = [];
  for (let r = 0; r < ROWS; r++) {
    const rowData = [];
    for (let c = 0; c < COLS; c++) {
      const cell = getCellElement(r, c);

      // CHUẨN HÓA: Nếu là tường (wall) thì trả về số 0, nếu trống thì trả về số 1
      if (cell.classList.contains("wall")) {
        rowData.push(0); // 0 nghĩa là Bị chặn (Wall) theo logic của Gia Bân
      } else {
        rowData.push(1); // 1 nghĩa là Đường trống đi được
      }
    }
    matrix.push(rowData);
  }
  return matrix;
}

// Hàm fetch gửi gói tin HTTP POST đến API FastAPI
async function fetchAlgorithm() {
  const algorithmName = document.getElementById("algo-select").value;
  const gridMatrix = getGridMatrixData();

  const payload = {
    rows: ROWS,
    cols: COLS,
    start: [startPos.row, startPos.col],
    end: [endPos.row, endPos.col],
    algorithm: algorithmName,
    allow_diagonal: false,
    heuristic: "manhattan",
    grid: gridMatrix,
  };

  // Trỏ trực tiếp đến địa chỉ localhost tuyệt đối của Server uvicorn
  const response = await fetch("http://127.0.0.1:8000/api/solve", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!response.ok) throw new Error("API Error: " + response.status);
  return response.json();
}

/* ==========================================================================
   4. HIỆU ỨNG ĐỒ HỌA HOẠT HỌA ANIMATION & DASHBOARD (VÂN)
   ========================================================================== */
function clearAnimation() {
  document.querySelectorAll(".visited, .path").forEach((cell) => {
    cell.classList.remove("visited");
    cell.classList.remove("path");
  });
}

function animateVisited(visitedOrder) {
  return new Promise((resolve) => {
    if (!visitedOrder || visitedOrder.length === 0) {
      resolve();
      return;
    }

    // Đọc giá trị thanh trượt (Từ 1 đến 10)
    const slider = document.getElementById("speed-slider");
    const sliderValue = slider ? parseInt(slider.value) : 5;

    // Công thức tính thời gian chờ nghịch đảo: Kéo slider càng to (nhanh) thì delay càng nhỏ (loang nhanh)
    const delay = Math.max(1, (11 - sliderValue) * 3);

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
      setTimeout(step, delay); // 🔥 Thay số 8 cố định bằng biến delay động
    }
    step();
  });
}

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
      setTimeout(step, 25); // Tốc độ vẽ đường đi tối ưu
    }
    step();
  });
}

function updateDashboard(result) {
  document.getElementById("stat-cost").textContent = result.cost;
  document.getElementById("stat-visited").textContent =
    result.visited_order.length;
  document.getElementById("stat-time").textContent =
    result.time_ms.toFixed(3) + " ms";
}

/* ==========================================================================
   5. ĐIỀU HƯỚNG DÒNG CHẠY CHÍNH (MAIN RUNNER)
   ========================================================================== */
async function runAlgorithm() {
  if (isAnimating) return;

  clearAnimation();
  isAnimating = true;
  lockUI();

  try {
    const result = await fetchAlgorithm();

    if (result.status === "success") {
      // Chạy tuần tự: Loang màu xanh xong rồi mới vẽ đường đi màu vàng
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

// Hàm xóa toàn bộ bảng để người dùng vẽ lại từ đầu
function clearBoard() {
  if (isAnimating) return;
  clearAnimation();
  document
    .querySelectorAll(".cell")
    .forEach((cell) => cell.classList.remove("wall"));
  document.getElementById("stat-cost").textContent = "0";
  document.getElementById("stat-visited").textContent = "0";
  document.getElementById("stat-time").textContent = "0 ms";
}

/* ==========================================================================
   6. KÍCH HOẠT KHI TẢI TRANG SẴN SÀNG
   ========================================================================== */
document.addEventListener("DOMContentLoaded", () => {
  createGrid();

  // Gắn sự kiện lắng nghe cho các nút bấm trên thanh công cụ
  document.getElementById("btn-run").addEventListener("click", runAlgorithm);
  document.getElementById("btn-clear").addEventListener("click", clearBoard);
});
