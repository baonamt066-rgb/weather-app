// ============================================================================
// ========== KHAI BÁO BIẾN DOM & SỰ KIỆN KHỞI CHẠY (INITIALIZATION) ==========
// ============================================================================

// --- 1. KHAI BÁO CÁC PHẦN TỬ DOM (DOM ELEMENTS) ---
// Dùng phương thức document.getElementById để liên kết các thẻ HTML vào biến JavaScript thông qua ID.

// Ô nhập liệu tìm kiếm tên thành phố
var searchInput = document.getElementById('search-input');

// Nút bấm kích hoạt chức năng định vị vị trí người dùng (GPS)
var geoBtn = document.getElementById('geo-btn');

// Màn hình phủ (Overlay) hiển thị hiệu ứng xoay tròn khi hệ thống đang tải dữ liệu (Loading)
var loadingOverlay = document.getElementById('loading-overlay');

// Vùng chứa danh sách các thành phố đã lưu/yêu thích nằm ở thanh bên cạnh (Sidebar)
var sideCitiesList = document.getElementById('side-cities-list');


// --- 2. SỰ KIỆN TƯƠNG TÁC TRÊN DASHBOARD (EVENT LISTENERS) ---

/**
 * Lắng nghe sự kiện gõ phím ('keypress') trên ô nhập liệu tìm kiếm.
 * Giúp người dùng có thể nhấn phím Enter để tìm kiếm ngay lập tức thay vì phải click chuột vào nút Tìm kiếm.
 */
searchInput.addEventListener('keypress', (e) => {
    // Kiểm tra nếu phím vừa ấn là phím 'Enter' ĐỒNG THỜI ô nhập liệu không bị bỏ trống (sau khi đã cắt bỏ khoảng trắng thừa)
    if (e.key === 'Enter' && searchInput.value.trim() !== '') {
        // Gọi hàm getWeather() đã định nghĩa trước đó và truyền vào tên thành phố đã được làm sạch (trim)
        getWeather(searchInput.value.trim());
    }
});

/**
 * Lắng nghe sự kiện click chuột ('click') vào nút định vị tự động (GPS).
 * Sử dụng Geolocation API có sẵn của trình duyệt để xác định vị trí hiện tại.
 */
geoBtn.addEventListener('click', () => {
    // [Bước 1]: Kiểm tra xem trình duyệt hiện tại có hỗ trợ tính năng định vị (navigator.geolocation) hay không
    // Nếu không hỗ trợ, bật thông báo cảnh báo và thoát hàm ngay lập tức bằng lệnh 'return alert(...)'
    if (!navigator.geolocation) return alert("Trình duyệt không hỗ trợ!");
    
    // [Bước 2]: Nếu có hỗ trợ, gọi hàm getCurrentPosition() để lấy tọa độ thực tế của thiết bị
    navigator.geolocation.getCurrentPosition(
        // Trường hợp 1: Người dùng cho phép quyền truy cập vị trí và lấy tọa độ THÀNH CÔNG
        // Trình duyệt trả về một đối tượng chứa dữ liệu vị trí (pos). Hệ thống sẽ trích xuất:
        // - pos.coords.latitude: Vĩ độ
        // - pos.coords.longitude: Kinh độ
        // Sau đó truyền 2 tham số này vào hàm getWeatherByCoords để tải thời tiết theo tọa độ
        pos => getWeatherByCoords(pos.coords.latitude, pos.coords.longitude),
        
        // Trường hợp 2: Người dùng từ chối cấp quyền truy cập vị trí hoặc thiết bị mất tín hiệu định vị (THẤT BẠI)
        // Hệ thống sẽ bắt lỗi (err) và hiển thị hộp thoại thông báo lỗi ra màn hình
        err => alert("Không thể lấy vị trí.")
    );
});

/**
 * Lắng nghe sự kiện 'window.onload' (Sự kiện kích hoạt khi toàn bộ trang web đã tải xong hoàn toàn)
 * Đây là nơi thiết lập cấu hình ban đầu (Setup / Khởi tạo dữ liệu mặc định) để ứng dụng sẵn sàng hoạt động.
 */
window.onload = async () => {
    // 1. Khởi tạo bản đồ trực quan Leaflet (vẽ các khung nhìn, nạp layer bản đồ)
    initMaps();
    
    // 2. Cập nhật lại toàn bộ ngôn ngữ hiển thị trên giao diện (Tiếng Việt hoặc Tiếng Anh) dựa theo cài đặt hiện tại
    updateUIByLanguage();
    
    // 3. Sử dụng từ khóa 'await' để đợi hệ thống đọc danh sách thành phố yêu thích đã lưu trong LocalStorage 
    // và vẽ (render) chúng lên thanh sidebar hoàn tất trước khi chạy tiếp các dòng dưới
    await renderSavedCities();
    
    // 4. Gọi dữ liệu và hiển thị thời tiết của thủ đô 'Hanoi' làm dữ liệu mặc định ban đầu khi vừa mở trang web lên
    getWeather('Hanoi');
    
    // 5. Điều khiển khung panel Bản đồ (Map Panel): 
    // Mặc định tự động tìm kiếm và định vị camera bản đồ trực tiếp vào khu vực "Vietnam" mà người dùng không cần thao tác gõ.
    processCountrySearch('Vietnam');
};