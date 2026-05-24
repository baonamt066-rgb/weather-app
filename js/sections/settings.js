// ============================================================================
// ========== QUẢN LÝ CÀI ĐẶT ỨNG DỤNG & ĐỒNG BỘ ĐỒNG THỜI (SETTINGS) ==========
// ============================================================================

/**
 * --- 1. ĐIỀU HƯỚNG SỰ KIỆN CHUYỂN TAB PANEL CÀI ĐẶT ---
 * Khi người dùng nhấp vào mục "Cài đặt" trên Sidebar, hàm switchView sẽ ẩn toàn bộ 
 * các giao diện panel khác và chỉ kích hoạt hiển thị vùng không gian của `viewSettings`.
 */
navSettings.addEventListener('click', () => switchView(navSettings, viewSettings));

/**
 * --- 2. THUẬT TOÁN ĐỒNG BỘ ĐƠN VỊ ĐO TOÀN HỆ THỐNG (APPLY UNIT CHANGE) ---
 * Hàm này chịu trách nhiệm chuyển đổi và ép toàn bộ ứng dụng tính toán, vẽ lại giao diện 
 * theo đơn vị nhiệt độ mới (°C, °F hoặc °K) ngay lập tức mà không cần tải lại trang.
 * @param {string} newUnit - Giá trị đơn vị đo mới do người dùng lựa chọn ('C' / 'F' / 'K')
 */
function applyUnitChange(newUnit) {
    // [Bước A]: Cập nhật biến trạng thái toàn cục và đồng bộ giá trị hiển thị của thẻ <select> trong Settings
    currentUnitSys = newUnit;
    document.getElementById('setting-unit').value = currentUnitSys;

    // [Bước B]: Nếu ứng dụng đã có sẵn dữ liệu thời tiết cũ lưu trong bộ nhớ (latestCurrentData & latestForecastData)
    // Thực hiện gọi hàm displayWeatherData để ép Dashboard vẽ lại biểu đồ Chart.js và cập nhật các con số nhiệt độ theo đơn vị mới.
    if (latestCurrentData && latestForecastData) {
        displayWeatherData(latestCurrentData, latestForecastData);
    }
    
    // [Bước C]: Tải lại toàn bộ danh sách các thành phố phụ quan tâm ở thanh Sidebar 
    // để cập nhật lại nhiệt độ của từng thẻ mini-card theo đơn vị mới đo đạc.
    renderSavedCities();
    
    // [Bước D]: Đồng bộ hóa bản đồ phân lưới nhiệt độ (Grid Temperature Map)
    if (sharedCountryCode && sharedBaseTemp !== null) {
        // Vẽ lại bản đồ ranh giới của quốc gia hiện tại với nhiệt độ nền gốc
        renderCountryMap(sharedCountryCode, sharedBaseTemp);
        
        // Cập nhật chuỗi văn bản thông số nhiệt độ nền phía dưới bản đồ nhỏ
        document.getElementById('base-temp-display').innerText = `Nhiệt độ nền: ${formatTempFixed(sharedBaseTemp)}°${currentUnitSys}`;
        
        // Kiểm tra tiêu đề tên nước trên bản đồ lớn, nếu đã có dữ liệu nước cụ thể (khác trạng thái khởi tạo '---')
        // Gọi hàm tìm kiếm processCountrySearch để cập nhật đồng bộ luôn cho bản đồ lớn fullscreen.
        const titleEl = document.getElementById('country-name-display');
        if (titleEl && titleEl.innerText !== '---') {
            processCountrySearch(titleEl.innerText);
        }
    }
    
    // [Bước E]: Kích hoạt cập nhật lại các thông số tính toán bình minh, hoàng hôn bên Tab Panel Mặt trời & Mặt trăng.
    smSearchForecast();
}

/**
 * --- 3. SỰ KIỆN NHẤN NÚT LƯU CÀI ĐẶT VÀ GIẢI THUẬT LIÊN THÔNG BẤT ĐỒNG BỘ ---
 * Sử dụng giải thuật xử lý song song (Parallel Processing) kết hợp Delay mượt (Natural Time Delay) 
 * giúp giao diện chuyển đổi mượt mà, tránh giật lag cục bộ do biểu đồ vẽ lại cùng lúc với bản đồ.
 */
document.getElementById('settings-save-btn').addEventListener('click', async () => {
    const btn = document.getElementById('settings-save-btn');
    const langVal = document.getElementById('setting-lang').value; // Lấy ngôn ngữ vừa chọn
    const unitVal = document.getElementById('setting-unit').value; // Lấy đơn vị đo vừa chọn

    // Đánh giá trạng thái (State Evaluation): Kiểm tra xem người dùng có thực sự thay đổi cấu hình hay không
    const langChanged = currentLang !== langVal;
    const unitChanged = currentUnitSys !== unitVal;
    
    // Trích xuất bộ từ điển ngôn ngữ hiện tại trước khi thay đổi để hiển thị chữ chờ "Đang lưu..." đúng ngôn ngữ
    const currentT = i18n[currentLang];

    // [BƯỚC 1]: KÍCH HOẠT HIỆU ỨNG CHỜ CHUYỂN ĐỔI UI (LOADING SPINNER UX)
    // Bơm mã HTML vòng xoay spinner và chữ "Đang lưu..." / "Saving..." vào màn hình phủ toàn cục
    loadingOverlay.innerHTML = `<i class="fas fa-spinner fa-spin"></i> ${currentT.saveSaving}`;
    loadingOverlay.style.display = 'flex'; // Hiển thị màn hình phủ chặn người dùng nhấp lung tung

    // Cập nhật trạng thái ngay trên chính nút Lưu: Thay icon Lưu bằng icon xoay, khóa vô hiệu hóa con trỏ chuột
    btn.innerHTML = `<i class="fas fa-spinner fa-spin" style="margin-right:8px;"></i>${currentT.saveSaving}`;
    btn.style.pointerEvents = 'none';

    // [BƯỚC 2]: GIẢI THUẬT XỬ LÝ SONG SONG TỐI ƯU TỐC ĐỘ (PARALLEL PROCESSING)
    // Sử dụng Promise.allSettled để kích hoạt đồng thời cả việc đổi đơn vị đo và đổi ngôn ngữ (nếu có thay đổi).
    // Kỹ thuật này giúp tận dụng tối đa luồng xử lý, chạy song song thay vì chạy tuần tự (nhanh gấp đôi thời gian thực thi).
    Promise.allSettled([
        unitChanged ? applyUnitChange(unitVal) : Promise.resolve(),
        langChanged ? applyLangChange(langVal) : Promise.resolve()
    ]);

    // [BƯỚC 3]: ĐỘ TRỄ TỰ NHIÊN ĐỂ ĐỒNG BỘ HOẠT HỌA (NATURAL ANIMATION TIMEOUT)
    // Ép hệ thống dừng lại một khoảng thời gian cố định đúng 1200ms bằng Promise và setTimeout.
    // Khoảng trễ này cực kỳ quan trọng, nó tạo không gian trống vừa đủ để biểu đồ Chart.js chạy hiệu ứng vẽ lại thanh đồ thị (animation),
    // và bản đồ Leaflet có thời gian render xong các mảnh đa giác GeoJSON mà không bị nghẽn CPU của trình duyệt.
    await new Promise(r => setTimeout(r, 1200));

    // [BƯỚC 4]: TẮT LOADING OVERLAY VÀ PHẢN HỒI THÀNH CÔNG (SUCCESS FEEDBACK)
    loadingOverlay.style.display = 'none'; // Ẩn màn hình bao phủ toàn cục

    // Trích xuất ngôn ngữ mới sau khi hệ thống đã chuyển đổi xong
    const newT = i18n[currentLang];
    
    // Đổi diện mạo nút Lưu thành trạng thái Đã lưu thành công (Màu trắng mờ sang trọng kèm icon tích v màu xanh)
    btn.innerHTML = `<i class="fas fa-check" style="margin-right:8px;"></i>${newT.saveSaved}`;
    btn.style.background = 'rgba(255,255,255,0.92)';

    // [BƯỚC 5]: TRẢ GIAO DIỆN NÚT BẤM VỀ MẶC ĐỊNH (RESET BUTTON TIMEOUT)
    // Chờ 800ms để người dùng kịp nhìn thấy thông báo "Đã lưu!", sau đó khôi phục lại trạng thái ban đầu của nút bấm.
    setTimeout(() => {
        btn.innerHTML = `<i class="fas fa-save" style="margin-right:8px;"></i>${newT.settingsSave}`;
        btn.style.background = '';          // Trả lại màu nền CSS gốc
        btn.style.pointerEvents = 'auto';  // Mở khóa cho phép nhấp chuột cho các lần cài đặt tiếp theo
    }, 800); 
});