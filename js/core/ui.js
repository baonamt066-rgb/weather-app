// ============================================================================
// ========== XỬ LÝ ĐA NGÔN NGỮ (i18n) & QUY ĐỔI ĐƠN VỊ NHIỆT ĐỘ ==========
// ============================================================================

/**
 * HÀM 1: Cập nhật lại toàn bộ văn bản hiển thị trên giao diện theo ngôn ngữ hiện tại
 * Hàm này duyệt qua hàng loạt phần tử DOM và thay thế nội dung (innerText, placeholder, title,...)
 * bằng chuỗi ký tự tương ứng lấy từ bộ từ điển `i18n`.
 */
function updateUIByLanguage() {
    // Lấy ra gói ngôn ngữ hiện tại (ví dụ: i18n['vi'] hoặc i18n['en']) gán vào biến cấu trúc rút gọn 't'
    const t = i18n[currentLang];
    
    // --- Ô TÌM KIẾM & NÚT ĐỊNH VỊ CHÍNH ---
    document.getElementById('search-input').placeholder = t.searchCityPlaceholder; // Thay đổi gợi ý nhập thành phố
    document.getElementById('geo-btn').title = t.geoBtnTitle; // Thay đổi văn bản gợi ý (tooltip) khi di chuột vào nút GPS

    // --- CÁC CHỈ SỐ THỜI TIẾT PHỤ (Khối thông tin nhanh) ---
    const statItems = document.querySelectorAll('.stat-item p');
    // Kiểm tra an toàn: Nếu tìm thấy đủ hoặc thừa 3 thẻ <p> đại diện cho Gió, Độ ẩm, Cảm giác như
    if (statItems.length >= 3) {
        statItems[0].innerText = t.wind;      // Chỉ số 1: Tốc độ gió
        statItems[1].innerText = t.humidity;  // Chỉ số 2: Độ ẩm không khí
        statItems[2].innerText = t.feelsLike; // Chỉ số 3: Nhiệt độ cảm nhận thực tế
    }

    // --- TIÊU ĐỀ KHỐI DỰ BÁO 5 NGÀY ---
    const forecastTitle = document.querySelector('.forecast-list h3');
    // Dùng innerHTML vì cần chèn lại cả thẻ i chứa icon FontAwesome kèm chữ ngôn ngữ mới
    if (forecastTitle) forecastTitle.innerHTML = `<i class="fas fa-cloud-sun" style="margin-right: 8px;"></i>${t.forecast5Days}`;

    // --- KHỐI TỔNG QUAN THỜI TIẾT CHI TIẾT (DASHBOARD OVERVIEW) ---
    const overviewTitle = document.querySelector('.overview-header h3');
    if (overviewTitle) overviewTitle.innerText = t.overviewTitle;
    document.getElementById('tab-temp').innerText = t.tabTemp;   // Tab đồ thị Nhiệt độ
    document.getElementById('tab-humid').innerText = t.tabHumid; // Tab đồ thị Lượng mưa/Độ ẩm

    // --- THANH SIDEBAR DANH SÁCH THÀNH PHỐ ĐÃ LƯU ---
    const addCityBtn = document.querySelector('.add-city-btn p');
    if (addCityBtn) addCityBtn.innerText = t.addCity; // Chữ nút "Thêm thành phố"

    // --- PANEL BẢN ĐỒ QUỐC GIA (MAP PANEL) ---
    document.getElementById('map-search-btn').innerText = t.mapSearchBtn; // Nút tìm kiếm bản đồ
    document.getElementById('country-input').placeholder = t.mapInputPlaceholder; // Gợi ý nhập tên quốc gia

    // --- BẢNG CHÚ GIẢI THANG NHIỆT ĐỘ BẢN ĐỒ (MAP LEGEND) ---
    const legendTitle = document.querySelector('.map-legend h3');
    if (legendTitle) legendTitle.innerText = t.legendTitle;
    const legendItems = document.querySelectorAll('.legend-item');
    // Cập nhật nhãn trạng thái thời tiết cho 4 mức màu sắc trên bản đồ (Nóng, Ấm, Mát, Lạnh)
    if (legendItems.length >= 4) {
        legendItems[0].innerHTML = `<div class="color-box" style="background: #FFB3B3;"></div> ${t.legendHot}`;
        legendItems[1].innerHTML = `<div class="color-box" style="background: #FFF3A3;"></div> ${t.legendWarm}`;
        legendItems[2].innerHTML = `<div class="color-box" style="background: #B7F0C1;"></div> ${t.legendCool}`;
        legendItems[3].innerHTML = `<div class="color-box" style="background: #A7D8FF;"></div> ${t.legendCold}`;
    }

    // --- GIAO DIỆN PANEL CÀI ĐẶT (SETTINGS PANEL) ---
    const settingsTitle = document.querySelector('.settings-title');
    if (settingsTitle) settingsTitle.innerHTML = `<i class="fas fa-cog"></i> ${t.settingsTitle}`;

    // Tên các phân mục cài đặt chính (Ví dụ: Thông tin tài khoản, Tùy biến ứng dụng)
    const sectionLabels = document.querySelectorAll('.settings-section-label');
    if (sectionLabels.length >= 2) {
        sectionLabels[0].innerText = t.settingsAccInfo;
        sectionLabels[1].innerText = t.settingsAppCust;
    }

    // Tiêu đề dòng và mô tả chi tiết của từng mục cài đặt (Cài đặt đơn vị đo và Cài đặt ngôn ngữ)
    const rowTitles = document.querySelectorAll('.settings-row-title');
    const rowDescs = document.querySelectorAll('.settings-row-desc');
    if (rowTitles.length >= 2) {
        rowTitles[0].innerText = t.settingsUnitTitle;
        rowDescs[0].innerText = t.settingsUnitDesc;
        rowTitles[1].innerText = t.settingsLangTitle;
        rowDescs[1].innerText = t.settingsLangDesc;
    }

    // --- GIAO DIỆN PANEL THIÊN VĂN MẶT TRỜI / MẶT TRĂNG (SUN & MOON PANEL) ---
    const smRowHeaders = document.querySelectorAll('.sm-row-header span:nth-child(2)');
    if (smRowHeaders.length >= 2) {
        smRowHeaders[0].innerText = t.daytime;   // Nhãn chu kỳ ban ngày
        smRowHeaders[1].innerText = t.nighttime; // Nhãn chu kỳ ban đêm
    }

    // Nút lưu cấu hình cài đặt: Chỉ cập nhật chữ nếu nút không ở trạng thái "đang xoay tải (fa-spin)" hoặc "đã lưu xong (fa-check)"
    const btn = document.getElementById('settings-save-btn');
    if (!btn.innerHTML.includes('fa-spin') && !btn.innerHTML.includes('fa-check')) {
        btn.innerHTML = `<i class="fas fa-save" style="margin-right:8px;"></i>${t.settingsSave}`;
    }

    // --- DỊCH TOÀN BỘ TEXT TRÊN THANH MENU ĐIỀU HƯỚNG CHÍNH (SIDEBAR NAV) ---
    const navDashboardText = document.getElementById('text-nav-dashboard');
    if (navDashboardText) navDashboardText.innerText = t.navDashboard;
    const navMapText = document.getElementById('text-nav-map');
    if (navMapText) navMapText.innerText = t.navMap;
    const navSunmoonText = document.getElementById('text-nav-sunmoon');
    if (navSunmoonText) navSunmoonText.innerText = t.navTimeline;
    const navSettingsText = document.getElementById('text-nav-settings');
    if (navSettingsText) navSettingsText.innerText = t.navSettings;
    const navLogoutText = document.getElementById('text-nav-logout');
    if (navLogoutText) navLogoutText.innerText = t.navLogout;

    // --- NỘI DUNG HỘP THOẠI XÁC NHẬN ĐĂNG XUẤT (LOGOUT POP-UP) ---
    const logoutTitle = document.querySelector('#logout-popup h3');
    if (logoutTitle) logoutTitle.innerText = t.logoutTitle;
    const logoutBody = document.querySelector('#logout-popup .popup-body');
    if (logoutBody) logoutBody.innerText = t.logoutMessage;
    const popupCancel = document.getElementById('popup-cancel-btn');
    if (popupCancel) popupCancel.innerText = t.logoutCancel; // Nút Huỷ bỏ
    const popupLogout = document.getElementById('popup-logout-btn');
    if (popupLogout) popupLogout.innerText = t.logoutConfirm; // Nút Xác nhận thoát

    // --- CÁC VĂN BẢN KHÁC TRÊN TRANG THIÊN VĂN ---
    const smPageTitleText = document.getElementById('sm-page-title-text');
    if (smPageTitleText) smPageTitleText.innerText = t.sunMoonPageTitle;
    const smDayOffsetLabel = document.getElementById('sm-day-offset-label');
    if (smDayOffsetLabel) smDayOffsetLabel.innerText = t.smDayOffsetLabel;
    const smSearchText = document.getElementById('sm-search-text');
    if (smSearchText) smSearchText.innerText = t.smSearchBtn;

    // --- XỬ LÝ LỜI CHÀO NGƯỜI DÙNG TRÊN THANH HEADER ---
    const headerGreeting = document.getElementById('header-greeting');
    if (headerGreeting) {
        // Tách chuỗi hiện tại theo dấu phẩy để lấy lại tên người dùng ở vế sau (ví dụ: "Chào bạn, Nam" -> lấy "Nam")
        const userName = headerGreeting.innerText.split(', ')[1] || 'User';
        // Nối tiền tố lời chào mới theo ngôn ngữ tương ứng (ví dụ tiếng Anh sẽ thành "Welcome, Nam")
        headerGreeting.innerText = t.greetingPrefix + userName;
    }

    // --- HIỂN THỊ NHIỆT ĐỘ NỀN CƠ BẢN TRÊN KHU VỰC BẢN ĐỒ ---
    if (sharedBaseTemp !== null) {
        document.getElementById('map-base-temp').innerText = `${t.baseTempPrefix}${formatTempRound(sharedBaseTemp)}°${currentUnitSys}`;
        document.getElementById('base-temp-display').innerText = `${t.baseTempPrefix}${formatTempFixed(sharedBaseTemp)}°${currentUnitSys}`;
    }
}

/**
 * HÀM 2: Kích hoạt quy trình thay đổi ngôn ngữ toàn hệ thống
 * @param {string} lang - Mã ngôn ngữ đích cần chuyển sang ('vi' hoặc 'en')
 */
async function applyLangChange(lang) {
    // Cập nhật lại biến cờ trạng thái ngôn ngữ toàn cục
    currentLang = lang;
    
    // Đồng bộ giá trị được chọn vào thẻ <select> trong trang Cài đặt để giao diện đồng nhất
    document.getElementById('setting-lang').value = lang;
    
    // Khởi chạy hàm dịch toàn bộ giao diện đã phân tích ở trên
    updateUIByLanguage();
    
    // Nếu trước đó hệ thống đã từng tải dữ liệu thời tiết (tức là biến latestCurrentData có dữ liệu)
    if (latestCurrentData) {
        // Tiến hành gọi lại API getWeather theo tên thành phố cũ để OpenWeather trả về mô tả thời tiết (mây, mưa,...) bằng ngôn ngữ mới dịch
        await getWeather(latestCurrentData.name);
    }
    
    // Vẽ lại danh sách thành phố yêu thích ở thanh Sidebar để cập nhật tên nút/nhãn theo ngôn ngữ mới
    await renderSavedCities();
    
    // Chạy lại hàm dự báo thiên văn mặt trời/mặt trăng để dịch nội dung phần thời gian biểu
    smSearchForecast();
}

/**
 * HÀM 3: Hàm lõi chuyển đổi nhiệt độ từ Celsius sang đơn vị được chọn
 * @param {number} c - Giá trị nhiệt độ gốc tính bằng độ C (Celsius) trả về từ API
 * @returns {number} Giá trị nhiệt độ sau khi đã quy đổi
 */
function getConvertedTemp(c) {
    // Nếu hệ thống đang cấu hình dùng độ F (Fahrenheit): Áp dụng công thức nhân 9 chia 5 cộng 32
    if (currentUnitSys === 'F') return c * 9 / 5 + 32;
    // Nếu hệ thống cấu hình dùng độ K (Kelvin): Cộng thêm hằng số tuyệt đối 273.15
    if (currentUnitSys === 'K') return c + 273.15;
    // Mặc định nếu là độ C ('C') thì trả về nguyên vẹn giá trị gốc ban đầu
    return c;
}

/**
 * HÀM 4: Làm tròn thành số nguyên gần nhất sau khi đổi nhiệt độ (Dùng hiển thị ngắn gọn)
 * Ví dụ: 25.6°C -> 26°C
 */
function formatTempRound(c) { 
    return Math.round(getConvertedTemp(c)); 
}

/**
 * HÀM 5: Lấy chính xác 1 chữ số thập phân sau dấu phẩy sau khi đổi nhiệt độ (Dùng hiển thị chi tiết)
 * Ví dụ: 25.34°C -> 25.3°C
 */
function formatTempFixed(c) { 
    return getConvertedTemp(c).toFixed(1); 
}