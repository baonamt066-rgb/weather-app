// ============================================================================
// ========== ĐỒNG BỘ NGƯỢC TỪ SIDEBAR NAV SANG BOTTOM NAV (CHO MOBILE) ==========
// ============================================================================

/**
 * Đoạn mã dưới đây xử lý tình huống "Đồng bộ hóa giao diện chéo" (Cross-UI Synchronization).
 * Khi người dùng đang ở giao diện máy tính (PC) dùng Sidebar, nhưng thắt nhỏ màn hình lại hoặc
 * khi hệ thống kích hoạt click trên Sidebar, thanh điều hướng phía dưới (Bottom Nav) dành cho thiết bị
 * di động cũng phải tự động sáng đúng tab tương ứng để đảm bảo trạng thái giao diện luôn đồng nhất.
 */

// --- 1. SỰ KIỆN CLICK VÀO TAB DASHBOARD TRÊN SIDEBAR ---
navDashboard.addEventListener('click', () => {
    
    // Gọi hàm syncBottomNav để lập tức làm sáng nút 'bnav-dashboard' dưới thanh menu mobile
    syncBottomNav('bnav-dashboard');
    
    // Sử dụng setTimeout để tạo một khoảng trễ (delay) nhỏ là 350 miligiây
    // Lý do: Đợi hiệu ứng chuyển tab CSS (nếu có) thực hiện xong, đảm bảo khung hiển thị đã mở ra hoàn toàn.
    setTimeout(() => { 
        // Kiểm tra an toàn (Guard Condition): Nếu biến 'map' (đối tượng bản đồ Leaflet) đã được khởi tạo
        // và không ở trạng thái chưa định nghĩa ('undefined'), thì tiến hành gọi hàm invalidateSize().
        // Hàm này bắt buộc bản đồ tính toán lại kích thước vùng chứa, sửa triệt để lỗi mất mảnh bản đồ khi đổi view.
        if (typeof map !== 'undefined') map.invalidateSize(); 
    }, 350);
});

// --- 2. SỰ KIỆN CLICK VÀO TAB BẢN ĐỒ (MAP) TRÊN SIDEBAR ---
navMap.addEventListener('click', () => {
    // Tự động kích hoạt làm sáng nút Bản đồ 'bnav-map' ở dưới thanh Bottom Nav mobile
    syncBottomNav('bnav-map');
});

// --- 3. SỰ KIỆN CLICK VÀO TAB THIÊN VĂN (SUNMOON) TRÊN SIDEBAR ---
navSunmoon.addEventListener('click', () => {
    // Tự động kích hoạt làm sáng nút Mặt trời & Mặt trăng 'bnav-sunmoon' ở dưới thanh Bottom Nav mobile
    syncBottomNav('bnav-sunmoon');
});

// --- 4. SỰ KIỆN CLICK VÀO TAB CÀI ĐẶT (SETTINGS) TRÊN SIDEBAR ---
navSettings.addEventListener('click', () => {
    // Tự động kích hoạt làm sáng nút Cài đặt 'bnav-settings' ở dưới thanh Bottom Nav mobile
    syncBottomNav('bnav-settings');
});