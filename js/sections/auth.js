// ============================================================================
// ========== TẢI THÔNG TIN USER & XỬ LÝ HỘP THOẠI XÁC NHẬN ĐĂNG XUẤT ==========
// ============================================================================

/**
 * --- 1. TỰ ĐỘNG NẠP THÔNG TIN TÀI KHOẢN NGƯỜI DÙNG ĐANG ĐĂNG NHẬP ---
 * Sử dụng cấu trúc IIFE (Hàm nặc danh tự khởi chạy ngầm ngay khi chương trình đọc tới)
 * Giúp cô lập các biến xử lý thông tin cá nhân, bảo mật dữ liệu và không làm ảnh hưởng đến các hàm khác.
 */
(function loadUserInfo() {
    let user = null;
    try { 
        // Đọc chuỗi thông tin người dùng hiện tại từ LocalStorage và giải mã thành đối tượng JSON
        user = JSON.parse(localStorage.getItem('currentUser')); 
    } catch (e) { 
        /* Bỏ qua lỗi cấu trúc chuỗi JSON nếu có */ 
    }

    // Áp dụng kỹ thuật Optional Chaining (?.) và toán tử HO (||)
    // Nếu trong LocalStorage có dữ liệu tài khoản thì lấy, nếu không (Chưa đăng nhập) thì dùng dữ liệu mặc định của hệ thống
    const fullname = user?.fullname || 'Bảo Nam';
    const email = user?.email || 'baonam1066@gmail.com';

    /**
     * TẠO KÝ TỰ VIẾT TẮT ĐẠI DIỆN CHO AVATAR (AVATAR INITIALS LOGIC)
     * Quy tắc logic: Cắt chuỗi họ tên và lấy ký tự đầu tiên của 2 từ cuối cùng.
     * Ví dụ: "Trần Bảo Nam" -> 2 từ cuối là "Bảo" và "Nam" -> Chữ cái đầu là "B" và "N" -> Kết quả: "BN"
     * @param {string} name - Họ và tên đầy đủ cần xử lý viết tắt
     * @returns {string} Chuỗi ký tự viết tắt (In hoa)
     */
    function getInitials(name) {
        // Cắt bỏ khoảng trắng thừa ở 2 đầu (trim), sau đó dùng biểu thức chính quy (Regex) split(/\s+/) 
        // để tách chuỗi thành một mảng các từ, loại bỏ hoàn toàn các khoảng trắng vô định ở giữa các từ.
        const parts = name.trim().split(/\s+/);
        
        // Mệnh đề kiểm tra an toàn: Nếu tên chỉ gồm đúng 1 từ duy nhất (Ví dụ: "Nam")
        // Trả về ngay chữ cái đầu tiên của từ đó và viết hoa nó lên.
        if (parts.length === 1) return parts[0][0].toUpperCase();
        
        // Trích xuất ký tự đầu của từ cuối cùng (Ví dụ với "Trần Bảo Nam" -> parts[2][0] -> từ "Nam" lấy chữ "N")
        const last = parts[parts.length - 1][0].toUpperCase();
        
        // Trích xuất ký tự đầu của từ kế cuối (Ví dụ với "Trần Bảo Nam" -> parts[1][0] -> từ "Bảo" lấy chữ "B")
        const second = parts[parts.length - 2][0].toUpperCase();
        
        // Nối từ kế cuối lên trước từ cuối theo đúng thứ tự tên tiếng Việt (Kết quả: "B" + "N" = "BN")
        return second + last;
    }

    // Thực hiện gọi hàm để lấy 2 chữ cái viết tắt của họ tên
    const initials = getInitials(fullname);
    
    // Tách mảng lấy từ cuối cùng (pop) để làm tên gọi riêng hiển thị ở lời chào góc màn hình (Ví dụ: "Nam")
    const firstName = fullname.trim().split(/\s+/).pop();

    // --- CẬP NHẬT THÔNG TIN LÊN THANH TIÊU ĐỀ (HEADER UI) ---
    const headerGreeting = document.getElementById('header-greeting');
    const headerAvatar = document.getElementById('header-avatar');
    
    // Đổi văn bản lời chào (Sử dụng textContent để an toàn bảo mật, tránh lỗi XSS injection)
    if (headerGreeting) headerGreeting.textContent = `Hi, ${firstName}`;
    
    // Gọi API từ dịch vụ ui-avatars.com để tự động vẽ hình ảnh đại diện avatar hình tròn dựa theo chữ viết tắt (initials)
    // Hàm encodeURIComponent giúp chuyển các ký tự đặc biệt sang chuỗi an toàn khi truyền qua URL
    if (headerAvatar) headerAvatar.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(initials)}&background=1a6fa8&color=fff&bold=true&length=2`;

    // --- CẬP NHẬT THÔNG TIN LÊN TRANG CÀI ĐẶT TÀI KHOẢN (SETTINGS UI) ---
    const settingsAvatar = document.getElementById('settings-avatar');
    const settingsFullname = document.getElementById('settings-fullname');
    const settingsEmail = document.getElementById('settings-email');
    
    if (settingsAvatar) settingsAvatar.textContent = initials;     // Đổ chữ viết tắt vào khung tròn avatar text trong Settings
    if (settingsFullname) settingsFullname.textContent = fullname; // Hiện họ tên đầy đủ
    if (settingsEmail) settingsEmail.textContent = email;          // Hiện địa chỉ Email
})();


// --- 2. LOGIC ĐIỀU KHIỂN HỘP THOẠI ĐĂNG XUẤT (LOGOUT POPUP LOGIC) ---

// Lấy phần tử phủ tối màn hình (Overlay) chứa khung hộp thoại Popup
const logoutOverlay = document.getElementById('logout-overlay');

// Lấy phần tử nút bấm Đăng xuất ở thanh menu dọc bên cạnh (Sidebar)
const logoutBtn = document.querySelector('.sidebar .logout');

/**
 * SỰ KIỆN A: Mở hộp thoại xác nhận khi người dùng nhấn nút Đăng xuất trên thanh Sidebar PC
 */
logoutBtn.addEventListener('click', () => {
    // Thêm class 'show' để CSS thay đổi opacity từ 0 lên 1 và hiển thị khối giao diện popup mượt mà
    logoutOverlay.classList.add('show');
});

/**
 * SỰ KIỆN B: Đóng hộp thoại khi nhấn vào nút "Huỷ" (Cancel) bên trong popup
 */
document.getElementById('popup-cancel-btn').addEventListener('click', () => {
    // Xóa class 'show' để ẩn hoàn toàn hộp thoại đi, đưa màn hình trở lại bình thường
    logoutOverlay.classList.remove('show');
});

/**
 * SỰ KIỆN C: Đóng hộp thoại khi nhấn vào nút dấu X (Close) ở góc trên bên phải khung popup
 */
document.getElementById('popup-close-btn').addEventListener('click', () => {
    logoutOverlay.classList.remove('show');
});

/**
 * SỰ KIỆN D: Đóng hộp thoại khi click chuột vào vùng tối bên ngoài (Click-outside to close)
 * Giúp người dùng thoát hộp thoại nhanh mà không nhất thiết phải tìm đúng nút huỷ.
 */
logoutOverlay.addEventListener('click', (e) => {
    // Kiểm tra kỹ thuật: Nếu phần tử thực tế bị click (e.target) chính là vùng nền tối logoutOverlay, 
    // chứ không phải là nhấp chuột vào bên trong các thẻ con của hộp thoại popup nằm ở giữa.
    if (e.target === logoutOverlay) {
        logoutOverlay.classList.remove('show');
    }
});

/**
 * SỰ KIỆN E: Thực hiện đăng xuất hoàn toàn khi nhấn nút "Xác nhận Đăng xuất"
 */
document.getElementById('popup-logout-btn').addEventListener('click', () => {
    // Điều hướng trình duyệt chuyển trang lập tức, quay trở về file màn hình form Đăng ký / Đăng nhập
    window.location.href = 'register_login_form.html';
});