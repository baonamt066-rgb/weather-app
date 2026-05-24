// ============================================================================
// ========== XỬ LÝ CHUYỂN ĐỔI GIAO DIỆN MÀN HÌNH (SIDEBAR NAVIGATION) ==========
// ============================================================================

// --- 1. KHAI BÁO CÁC PHẦN TỬ LIÊN KẾT GIAO DIỆN (DOM ELEMENTS) ---

// Các nút bấm trên thanh Menu dọc (Sidebar) dùng để điều hướng
var navDashboard = document.getElementById('nav-dashboard'); // Nút Trang chủ
var navMap       = document.getElementById('nav-map');       // Nút Bản đồ
var navSunmoon   = document.getElementById('nav-sunmoon');   // Nút Mặt trăng/Mặt trời
var navSettings  = document.getElementById('nav-settings');  // Nút Cài đặt

// Các khu vực nội dung (Khối giao diện tương ứng) sẽ được ẩn/hiện tùy chọn
var viewDashboard = document.getElementById('view-dashboard');
var viewMap       = document.getElementById('view-map');
var viewSunmoon   = document.getElementById('view-sunmoon');
var viewSettings  = document.getElementById('view-settings');


/**
 * --- 2. HÀM CORE CHUYỂN ĐỔI QUA LẠI GIỮA CÁC VÙNG GIAO DIỆN ---
 * Hàm này có nhiệm vụ ẩn toàn bộ các màn hình cũ, chỉ làm hiển thị duy nhất màn hình được chọn.
 * ĐỒNG THỜI, xử lý lỗi render kích thước của thư viện Bản đồ Leaflet khi bị thay đổi trạng thái ẩn/hiện.
 * * @param {HTMLElement} activeNav  - Nút bấm menu vừa được click (cần làm sáng)
 * @param {HTMLElement} activeView - Khối giao diện tương ứng được yêu cầu hiển thị
 */
function switchView(activeNav, activeView) {
    
    // BƯỚC A: ĐỒNG BỘ THANH MENU (SIDEBAR)
    // Duyệt qua một mảng chứa tất cả các nút bấm menu bằng vòng lặp forEach.
    // Xóa class 'active' khỏi mọi nút để reset giao diện, sau đó thêm 'active' vào nút vừa chọn để làm sáng nó lên.
    [navDashboard, navMap, navSunmoon, navSettings].forEach(n => n.classList.remove('active'));
    activeNav.classList.add('active');

    // BƯỚC B: RESET TRẠNG THÁI CÁC KHỐI VIEW VỀ MẶC ĐỊNH (ẨN ĐI)
    // Khối Dashboard sử dụng class 'hidden' để ẩn. Các khối còn lại sử dụng class 'active' để hiện,
    // do đó muốn ẩn chúng đi thì ta xóa class 'active' của chúng.
    viewDashboard.classList.add('hidden');
    viewMap.classList.remove('active');
    viewSunmoon.classList.remove('active');
    viewSettings.classList.remove('active');

    // BƯỚC C: KIỂM TRA VÀ HIỂN THỊ KHỐI VIEW ĐƯỢC CHỌN + XỬ LÝ LOGIC BẢN ĐỒ KÈM THEO
    
    // Trường hợp 1: Nếu người dùng chọn xem màn hình DASHBOARD
    if (activeView === viewDashboard) {
        // Loại bỏ class 'hidden' để khối Dashboard hiện ra trên màn hình
        viewDashboard.classList.remove('hidden');
        
        // Sử dụng setTimeout để trì hoãn việc chạy code xử lý bản đồ (chờ 350 miligiây)
        // Lý do: Cần đợi cho hiệu ứng CSS transition/animation chuyển tab hoàn tất hoàn toàn,
        // giúp bản đồ lấy đúng kích thước thật của vùng chứa (đã hiển thị hoàn chỉnh).
        setTimeout(() => {
            // Nếu hàm khởi tạo bản đồ nhỏ hiện diện, tiến hành kích hoạt nó
            if (typeof initMaps === 'function') initMaps();
            
            // Lệnh QUAN TRỌNG: Ép buộc bản đồ nhỏ (map) vẽ lại và tính toán lại kích thước khung hình (Viewport).
            // Nếu không có dòng này, bản đồ khi hiện ra sẽ bị lỗi hiển thị (bị xám xịt hoặc vỡ mảnh tile).
            if (map) map.invalidateSize();
            
            // Tự động căn chỉnh camera (Zoom & Pan) của bản đồ vừa vặn với ranh giới của quốc gia/thành phố (GeoJSON) nếu có dữ liệu layer
            if (currentGeoLayer && map) {
                map.fitBounds(currentGeoLayer.getBounds(), { 
                    paddingBottomRight: [10, 60], // Khoảng đệm an toàn góc dưới bên phải
                    paddingTopLeft: [10, 10]       // Khoảng đệm an toàn góc trên bên trái
                });
            }
        }, 350); // 350ms khớp với thời gian transition của CSS
        
    // Trường hợp 2: Nếu người dùng chọn xem màn hình BẢN ĐỒ LỚN (Map Panel)
    } else if (activeView === viewMap) {
        // Thêm class 'active' để khối giao diện Bản đồ lớn hiện lên
        viewMap.classList.add('active');
        
        // Tương tự, đợi 350ms cho giao diện mở ra hoàn toàn, rồi ép bản đồ lớn (countryMap) cập nhật lại kích thước diện tích
        setTimeout(() => countryMap.invalidateSize(), 350);
        
    // Trường hợp 3: Nếu người dùng chọn xem màn hình THEO DÕI THIÊN VĂN (Sun & Moon Panel)
    } else if (activeView === viewSunmoon) {
        // Kích hoạt class 'active' để hiển thị giao diện mặt trời mặt trăng (không chứa bản đồ nên không cần dùng setTimeout)
        viewSunmoon.classList.add('active');
        
    // Trường hợp 4: Nếu người dùng chọn xem màn hình CÀI ĐẶT CẤU HÌNH (Settings Panel)
    } else if (activeView === viewSettings) {
        // Kích hoạt hiển thị khối cài đặt ngôn ngữ và đơn vị đo
        viewSettings.classList.add('active');
    }
}


// --- 3. ĐĂNG KÝ SỰ KIỆN CLICK CHO CÁC NÚT SIDEBAR ---
// Khi click chuột vào từng nút menu, ta truyền chính xác phần tử nút đó và khối view tương ứng vào hàm switchView.

// Gắn sự kiện chuyển tab cho nút Dashboard
navDashboard.addEventListener('click', () => switchView(navDashboard, viewDashboard));

// Gắn sự kiện chuyển tab cho nút Map (Bản đồ)
navMap.addEventListener('click', () => switchView(navMap, viewMap));

// Gắn sự kiện chuyển tab cho nút Sun & Moon (Thiên văn)
navSunmoon.addEventListener('click', () => switchView(navSunmoon, viewSunmoon));