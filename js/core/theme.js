// ============================================================================
// ========== XỬ LÝ CHUYỂN ĐỔI GIAO DIỆN SÁNG / TỐI (THEME TOGGLE) ==========
// ============================================================================

/**
 * [BƯỚC 1]: KHỞI TẠO BIẾN TRẠNG THÁI GIAO DIỆN (THEME)
 * Sử dụng phương thức localStorage.getItem để kiểm tra xem trước đó người dùng đã chọn theme nào chưa.
 * - Nếu đã có giá trị trong LocalStorage (ví dụ 'night'), biến 'currentTheme' sẽ nhận giá trị đó.
 * - Nếu là lần đầu tiên truy cập trang (chưa có dữ liệu), toán tử logic HO (||) sẽ tự động gán giá trị mặc định là 'day'.
 */
currentTheme = localStorage.getItem('weatherTheme') || 'day';


/**
 * [BƯỚC 2]: HÀM ÁP DỤNG CẤU HÌNH GIAO DIỆN LÊN ỨNG DỤNG
 * Hàm này có nhiệm vụ thay đổi class trên thẻ <body> để kích hoạt CSS Theme, đổi icon nút bấm và ghi dữ liệu lại vào bộ nhớ.
 * @param {string} theme - Trạng thái theme cần áp dụng ('day' hoặc 'night')
 */
function applyTheme(theme) {
    // Tìm phần tử nút bấm chuyển đổi giao diện trên HTML qua ID 'themeToggle'
    const btn = document.getElementById('themeToggle');
    
    // TÌNH HUỐNG A: Áp dụng giao diện Ban đêm (Night Mode)
    if (theme === 'night') {
        // Thêm class 'night-mode' vào thẻ <body> để toàn bộ trang web chuyển sang tông màu tối theo CSS thiết lập sẵn
        document.body.classList.add('night-mode');
        
        // Thay đổi cấu trúc HTML bên trong nút bấm (nếu tìm thấy nút này trên giao diện)
        // Icon lúc này chuyển thành hình MẶT TRỜI (fa-sun) màu vàng nhạt (#ffd166).
        // Giải thích logic UX: Khi giao diện đang là đêm, nút bấm sẽ hiển thị hình mặt trời làm gợi ý cho người dùng hiểu rằng "bấm vào đây để chuyển sang ban ngày".
        if (btn) btn.innerHTML = '<i class="fas fa-sun" style="color:#ffd166;"></i>';
        
    // TÌNH HUỐNG B: Áp dụng giao diện Ban ngày (Day Mode)
    } else {
        // Xóa class 'night-mode' khỏi thẻ <body> để trang web quay về các màu sắc tươi sáng mặc định
        document.body.classList.remove('night-mode');
        
        // Thay đổi cấu trúc HTML bên trong nút bấm chuyển sang hình MẶT TRĂNG (fa-moon) màu xanh nhạt (#b0c8e8).
        // Gợi ý cho người dùng hiểu rằng "bấm vào đây để chuyển sang ban đêm".
        if (btn) btn.innerHTML = '<i class="fas fa-moon" style="color:#b0c8e8;"></i>';
    }
    
    // ĐỒNG BỘ VÀO BỘ NHỚ TRÌNH DUYỆT:
    // Lưu lại giá trị theme hiện tại vào LocalStorage với tên khóa là 'weatherTheme'.
    // Điều này giúp lưu giữ lựa chọn của người dùng, không bị mất đi hoặc bị reset khi họ tải lại trang (F5).
    localStorage.setItem('weatherTheme', theme);
}


/**
 * [BƯỚC 3]: ĐĂNG KÝ SỰ KIỆN CLICK CHO NÚT BẤM CHUYỂN ĐỔI THEME
 * Lắng nghe hành vi click chuột của người dùng vào nút #themeToggle để đảo ngược trạng thái theme hiện tại.
 */
document.getElementById('themeToggle').addEventListener('click', () => {
    // Sử dụng toán tử ba ngôi (Ternary Operator) để đảo trạng thái:
    // Nếu 'currentTheme' hiện tại đang là 'day' thì chuyển thành 'night', ngược lại nếu không phải 'day' thì chuyển thành 'day'.
    currentTheme = currentTheme === 'day' ? 'night' : 'day';
    
    // Gọi hàm áp dụng giao diện applyTheme() vừa định nghĩa ở trên để cập nhật giao diện và bộ nhớ theo trạng thái mới
    applyTheme(currentTheme);
});


/**
 * [BƯỚC 4]: KÍCH HOẠT NGAY KHI TẢI TRANG (IMMEDIATE EXECUTION)
 * Gọi hàm applyTheme ngay lập tức mà không cần đợi người dùng bấm nút.
 * Giúp ứng dụng nhận diện ngay theme cũ đã lưu trong LocalStorage ngay từ lúc vừa tải trang, 
 * ngăn chặn hiện tượng màn hình bị chớp trắng đột ngột (Flicker) nếu người dùng vốn đang để chế độ Ban đêm.
 */
applyTheme(currentTheme);