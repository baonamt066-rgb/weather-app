// ============================================================================
// ========== XỬ LÝ THANH ĐIỀU HƯỚNG BOTTOM NAVIGATION (CHO MOBILE) ==========
// ============================================================================

// --- 1. LẤY DANH SÁCH PHẦN TỬ ---
// Sử dụng document.querySelectorAll để chọn toàn bộ các thẻ có class là '.bottom-nav-item'.
// Biến 'bnavItems' lúc này sẽ lưu giữ một NodeList (mảng các phần tử) chứa tất cả các nút bấm trên thanh menu mobile.
const bnavItems = document.querySelectorAll('.bottom-nav-item');

/**
 * --- 2. HÀM ĐỒNG BỘ TRẠNG THÁI SÁNG (ACTIVE) CỦA CÁC NÚT BẤM ---
 * Hàm này có nhiệm vụ làm sáng nút được bấm và tắt sáng tất cả các nút còn lại, tránh hiện tượng nhiều nút cùng sáng một lúc.
 * @param {string} activeId - ID của nút bấm cần được bật trạng thái active (Ví dụ: 'bnav-dashboard')
 */
function syncBottomNav(activeId) {
    // Bước A: Duyệt qua từng nút bấm một trong danh sách bnavItems bằng vòng lặp forEach
    // Xóa bỏ class 'active' khỏi tất cả các nút để đưa toàn bộ thanh điều hướng về trạng thái mặc định (tối/ẩn)
    bnavItems.forEach(item => item.classList.remove('active'));
    
    // Bước B: Tìm đúng phần tử nút bấm đang được người dùng tương tác dựa vào ID truyền vào (activeId)
    const el = document.getElementById(activeId);
    
    // Bước C: Mệnh đề kiểm tra an toàn, nếu tìm thấy phần tử đó trong DOM, tiến hành thêm class 'active'
    // Class 'active' này kết hợp với CSS sẽ làm cho nút bấm sáng lên hoặc đổi màu làm nổi bật tab hiện tại
    if (el) el.classList.add('active');
}


// --- 3. GẮN SỰ KIỆN CLICK CHO TỪNG NÚT BẤM ĐIỀU HƯỚNG ---

/**
 * NÚT 1: Chuyển sang màn hình Dashboard (Trang chủ thời tiết)
 */
document.getElementById('bnav-dashboard').addEventListener('click', () => {
    // Gọi hàm switchView() để thực hiện ẩn các view khác và hiển thị viewDashboard, đồng thời làm sáng menu tương ứng trên PC
    switchView(navDashboard, viewDashboard);
    // Đồng bộ bật sáng nút Dashboard dưới thanh Bottom Nav mobile
    syncBottomNav('bnav-dashboard');
});

/**
 * NÚT 2: Chuyển sang màn hình Bản đồ trực quan (Map panel)
 */
document.getElementById('bnav-map').addEventListener('click', () => {
    // Chuyển đổi giao diện sang khu vực Bản đồ vệ tinh/thời tiết
    switchView(navMap, viewMap);
    // Đồng bộ bật sáng nút Bản đồ dưới thanh Bottom Nav mobile
    syncBottomNav('bnav-map');
});

/**
 * NÚT 3: Chuyển sang màn hình Theo dõi Mặt trời & Mặt trăng (Sun & Moon panel)
 */
document.getElementById('bnav-sunmoon').addEventListener('click', () => {
    // Chuyển đổi giao diện sang khu vực chu kỳ thiên văn, bình minh, hoàng hôn
    switchView(navSunmoon, viewSunmoon);
    // Đồng bộ bật sáng nút Sun/Moon dưới thanh Bottom Nav mobile
    syncBottomNav('bnav-sunmoon');
});

/**
 * NÚT 4: Chuyển sang màn hình Cài đặt cấu hình (Settings panel)
 */
document.getElementById('bnav-settings').addEventListener('click', () => {
    // Chuyển đổi giao diện sang khu vực cấu hình ngôn ngữ, đơn vị đo
    switchView(navSettings, viewSettings);
    // Đồng bộ bật sáng nút Cài đặt dưới thanh Bottom Nav mobile
    syncBottomNav('bnav-settings');
});

/**
 * NÚT 5: Kích hoạt chức năng Đăng xuất tài khoản (Logout)
 */
document.getElementById('bnav-logout').addEventListener('click', () => {
    // Thay vì chuyển màn hình (switchView), nút này sẽ tìm phần tử Hộp thoại xác nhận đăng xuất (#logout-overlay)
    // Sau đó thêm class 'show' để kích hoạt hiệu ứng CSS hiển thị bảng Pop-up hỏi xem người dùng có chắc chắn muốn thoát hay không.
    document.getElementById('logout-overlay').classList.add('show');
});