// ============================================================================
// ========== CẤU HÌNH API, ĐA NGÔN NGỮ & QUẢN LÝ TRẠNG THÁI TOÀN CỤC ==========
// ============================================================================

// --- 1. CẤU HÌNH API KEY ---
// Mã định danh ứng dụng (API Key) được cấp từ dịch vụ OpenWeatherMap để xác thực quyền gọi dữ liệu thời tiết.
var openWeatherKey = '289b1cfba83a8b6aec6623cd52543989';

// --- 2. QUẢN LÝ BIỂU ĐỒ & DỮ LIỆU ĐỒ THỊ (CHART SYSTEM) ---
var chartInstance = null;      // Lưu trữ đối tượng (instance) của thư viện Chart.js để có thể xóa/vẽ lại đồ thị mà không bị lỗi đè dữ liệu.
var currentHourlyData = [];    // Mảng chứa danh sách dữ liệu thời tiết theo từng khung giờ (phục vụ vẽ trục X, Y cho biểu đồ).
var currentChartMode = 'temp'; // Chế độ hiển thị biểu đồ hiện tại, mặc định là 'temp' (nhiệt độ), có thể đổi sang 'humid' (độ ẩm).

/**
 * --- 3. LOGIC PHÂN TÁCH BỘ NHỚ LƯU TRỮ THEO TỪNG NGƯỜI DÙNG (PER-USER STORAGE) ---
 * Hàm này phân tích tài khoản đang đăng nhập để tạo ra một "Key" (Khóa) LocalStorage độc nhất cho từng người.
 * Giúp dữ liệu danh sách thành phố yêu thích của tài khoản A không bị lẫn sang tài khoản B trên cùng một máy tính.
 * @returns {string} Tên khóa lưu trữ trong LocalStorage (Ví dụ: "savedCities::12345")
 */
function getSavedCitiesKey() {
    try {
        // Đọc chuỗi thông tin tài khoản hiện tại từ LocalStorage và chuyển đổi từ JSON thành đối tượng JS (Object)
        const cu = JSON.parse(localStorage.getItem('currentUser'));
        
        // Tình huống A: Nếu tài khoản có mã ID người dùng (uid) -> Tạo khóa theo ID (Ưu tiên nhất vì tính bảo mật)
        if (cu && cu.uid) return `savedCities::${cu.uid}`;
        
        // Tình huống B: Nếu không có uid nhưng có Email -> Tạo khóa dựa theo địa chỉ Email của họ
        if (cu && cu.email) return `savedCities::${cu.email}`;
    } catch (e) { 
        /* Bỏ qua lỗi (ignore): Nếu chuỗi JSON bị lỗi hoặc không có currentUser, chương trình sẽ tự xuống dòng dưới */ 
    }
    // Tình huống C: Người dùng chưa đăng nhập (Khách vãng lai) -> Dùng chung một kho dữ liệu mặc định của guest
    return 'savedCities::guest';
}

/**
 * --- 4. TỰ ĐỘNG NẠP DANH SÁCH THÀNH PHỐ QUAN TÂM KHI KHỞI CHẠY (IIFE LOGIC) ---
 * Sử dụng hàm nặc danh chạy ngay để gán giá trị khởi tạo cho biến `savedCities`.
 */
var savedCities = (function () {
    try {
        const key = getSavedCitiesKey(); // Lấy tên khóa tương ứng với trạng thái đăng nhập hiện tại
        const stored = JSON.parse(localStorage.getItem(key)); // Đọc dữ liệu mảng đã lưu từ LocalStorage
        
        // Kiểm tra an toàn: Dữ liệu lấy ra phải là một mảng (Array) ĐỒNG THỜI mảng đó phải có chứa phần tử bên trong
        if (Array.isArray(stored) && stored.length) return stored;
    } catch (e) { 
        /* Tránh sập ứng dụng nếu dữ liệu LocalStorage bị chỉnh sửa thủ công dẫn tới sai cấu trúc JSON */ 
    }
    // Nếu là tài khoản mới tinh hoặc chưa lưu gì, trả về danh sách 2 thành phố mặc định của Việt Nam
    return ['Ho Chi Minh', 'Da Nang'];
})();

// --- 5. BIẾN CHIA SẺ LIÊN THÔNG DỮ LIỆU GIỮA CÁC CHỨC NĂNG (SHARED STATE) ---
var sharedBaseTemp = null;    // Lưu trữ nhiệt độ nền cơ bản để đồng bộ dữ liệu giữa Dashboard và Panel Bản đồ
var sharedCountryCode = null; // Lưu trữ mã quốc gia (Ví dụ: 'VN', 'JP') đang được chọn

// --- 6. CẤU HÌNH THAM SỐ GIAO DIỆN MẶC ĐỊNH ---
var currentUnitSys = 'C';     // Hệ thống đơn vị đo nhiệt độ hiện tại ('C': Celsius, 'F': Fahrenheit, 'K': Kelvin)
var currentLang = 'vi';        // Ngôn ngữ hệ thống mặc định ('vi': Tiếng Việt, 'en': Tiếng Anh)
var latestCurrentData = null;  // Lưu giữ gói dữ liệu thời tiết hiện tại mới nhất nhận về từ API
var latestForecastData = null; // Lưu giữ gói dữ liệu dự báo 5 ngày mới nhất nhận về từ API

// --- 7. QUẢN LÝ ĐỐI TƯỢNG BẢN ĐỒ LEAFLET & CÁC LỚP BẢN ĐỒ (MAPS & LAYERS) ---
var currentGeoLayer = null;     // Lưu lớp vẽ ranh giới vùng (GeoJSON) của thành phố/quốc gia trên bản đồ nhỏ
var currentCountryLayer = null; // Lưu lớp vẽ ranh giới vùng trên bản đồ lớn (Country Map panel)
var map;                        // Đối tượng đại diện cho bản đồ nhỏ trên giao diện Dashboard
var countryMap;                 // Đối tượng đại diện cho bản đồ lớn trên giao diện Map

// --- 8. BIẾN LƯU TRẠNG THÁI GIAO DIỆN SÁNG / TỐI ---
var currentTheme;               // Chứa chuỗi ký tự 'day' hoặc 'night' quyết định màu nền ứng dụng

// --- 9. BỘ TỪ ĐIỂN ĐA NGÔN NGỮ TOÀN CỤC (i18n DICTIONARY) ---
// Định nghĩa cấu trúc chuỗi ký tự hiển thị tĩnh cho toàn bộ ứng dụng, chia rõ theo 2 phân vùng 'vi' và 'en'
var i18n = {
    // PHÂN VÙNG NGÔN NGỮ: TIẾNG VIỆT
    vi: {
        searchCityPlaceholder: "Nhập tên thành phố (VD: Hanoi, Tokyo)...",
        geoBtnTitle: "Vị trí hiện tại",
        wind: "Gió",
        humidity: "Độ ẩm",
        feelsLike: "Cảm giác",
        forecast5Days: "Dự báo 5 Ngày Tới",
        overviewTitle: "Tổng quan (24h tới)",
        tabTemp: "Nhiệt độ",
        tabHumid: "Độ ẩm",
        mapSearchBtn: "Tìm kiếm",
        mapInputPlaceholder: "Nhập tên quốc gia (VD: Vietnam, Japan)",
        legendTitle: "Bản Đồ Nhiệt Độ",
        legendHot: "Nóng (>32°C)",
        legendWarm: "Ấm (27–32°C)",
        legendCool: "Mát (20–27°C)",
        legendCold: "Lạnh (<20°C)",
        addCity: "Thêm thành phố quan tâm",
        settingsTitle: "Cài đặt",
        settingsAccInfo: "Thông tin tài khoản",
        settingsAppCust: "Tuỳ chỉnh ứng dụng",
        settingsUnitTitle: "Đơn vị nhiệt độ",
        settingsUnitDesc: "Chuyển đổi giữa °C, °F và °K",
        settingsLangTitle: "Ngôn ngữ",
        settingsLangDesc: "Thay đổi ngôn ngữ hiển thị",
        settingsSave: "Lưu cài đặt",
        saveSaving: "Đang lưu...",
        saveSaved: "Đã lưu!",
        navDashboard: "Dashboard",
        navMap: "Bản đồ",
        navTimeline: "Hoạt động",
        navSettings: "Cài đặt",
        navLogout: "Đăng xuất",
        logoutTitle: "Xác nhận đăng xuất",
        logoutMessage: "Bạn có chắc muốn đăng xuất không?",
        logoutCancel: "Huỷ",
        logoutConfirm: "Đăng xuất",
        sunMoonPageTitle: "Mặt trời & Mặt trăng — Dự báo theo giờ",
        smDayOffsetLabel: "Độ lệch ngày",
        smSearchBtn: "Tìm kiếm",
        greetingPrefix: "Chào, ",
        daytime: "Ban ngày",
        nighttime: "Ban đêm",
        sunrise: "Bình minh",
        sunset: "Hoàng hôn",
        today: "Hôm nay",
        dayCode: "ngày",
        daysCode: "ngày",
        baseTempPrefix: "Nhiệt độ nền: "
    },
    // PHÂN VÙNG NGÔN NGỮ: TIẾNG ANH (ENGLISH)
    en: {
        searchCityPlaceholder: "Enter city name (e.g. Hanoi, Tokyo)...",
        geoBtnTitle: "Current Location",
        wind: "Wind",
        humidity: "Humidity",
        feelsLike: "Feels like",
        forecast5Days: "5-Day Forecast",
        overviewTitle: "Overview (Next 24h)",
        tabTemp: "Temperature",
        tabHumid: "Humidity",
        mapSearchBtn: "Search",
        mapInputPlaceholder: "Enter country name (e.g. Vietnam, Japan)",
        legendTitle: "Temperature Map",
        legendHot: "Hot (>32°C)",
        legendWarm: "Warm (27–32°C)",
        legendCool: "Cool (20–27°C)",
        legendCold: "Cold (<20°C)",
        addCity: "Add watched city",
        settingsTitle: "Settings",
        settingsAccInfo: "Account Info",
        settingsAppCust: "App Customization",
        settingsUnitTitle: "Temperature Unit",
        settingsUnitDesc: "Switch between °C, °F and °K",
        settingsLangTitle: "Language",
        settingsLangDesc: "Change display language",
        settingsSave: "Save settings",
        saveSaving: "Saving...",
        saveSaved: "Saved!",
        navDashboard: "Dashboard",
        navMap: "Map",
        navTimeline: "Timeline",
        navSettings: "Settings",
        navLogout: "Logout",
        logoutTitle: "Confirm Logout",
        logoutMessage: "Are you sure you want to log out?",
        logoutCancel: "Cancel",
        logoutConfirm: "Logout",
        sunMoonPageTitle: "Sun & Moon — Hourly Forecast",
        smDayOffsetLabel: "Day offset",
        smSearchBtn: "Search",
        greetingPrefix: "Hi, ",
        daytime: "Daytime",
        nighttime: "Nighttime",
        sunrise: "Sunrise",
        sunset: "Sunset",
        today: "Today",
        dayCode: "day",
        daysCode: "days",
        baseTempPrefix: "Base Temp: "
    }
};