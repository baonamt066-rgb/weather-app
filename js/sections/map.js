// ============================================================================
// ========== HỆ THỐNG PHÂN TÍCH VÀ XỬ LÝ BẢN ĐỒ NHIỆT ĐỘ GRID MAPPING ==========
// ============================================================================

/**
 * HÀM 1: Thuật toán Tạo số ngẫu nhiên theo hạt giống (Seeded Random Number Generator)
 * Giải thích lý do: Math.random() thông thường của JS trả về kết quả hoàn toàn ngẫu nhiên sau mỗi lần gọi.
 * Để 2 bản đồ (bản đồ nhỏ ở Dashboard và bản đồ lớn fullscreen ở Map Panel) hiển thị các ô nhiệt độ 
 * giống hệt nhau khi cùng xem một quốc gia, hệ thống cần một hàm toán học sinh số ngẫu nhiên nhưng CỐ ĐỊNH theo hạt giống (seed).
 * @param {number} seed - Mã số làm hạt giống đầu vào (thường tính từ tọa độ ô x, y)
 * @returns {number} Giá trị số thực nằm trong khoảng [0, 1) nhưng luôn cố định với cùng một seed.
 */
function seededRand(seed) {
    // Sử dụng hàm lượng giác Math.sin kết hợp hằng số chu kỳ lớn để tạo ra sự phân tán giả ngẫu nhiên (Pseudo-random)
    const x = Math.sin(seed + 1) * 43758.5453123;
    // Lấy phần thập phân còn dư bằng cách trừ đi phần nguyên đổ xuống (Math.floor), đảm bảo kết quả luôn < 1
    return x - Math.floor(x);
}

/**
 * HÀM 2: Tạo lưới ma trận độ lệch nhiệt độ (Build Temperature Offsets Grid)
 * Hàm này xây dựng một ma trận 2 chiều kích thước 4x4 (16 ô) chứa các giá trị nhiệt độ biến thiên xung quanh nhiệt độ nền.
 * Nhờ hàm seededRand ở trên, với cùng một giá trị `baseTemp`, ma trận kết quả trả về sẽ luôn trùng khớp 100%.
 * @param {number} baseTemp - Nhiệt độ nền gốc lấy từ trạm khí tượng/API quốc gia
 * @returns {Array<Array<number>>} Ma trận vuông 4x4 chứa giá trị nhiệt độ chi tiết từng vùng
 */
function buildTempOffsets(baseTemp) {
    const offsets = [];
    for (let x = 0; x < 4; x++) {
        offsets[x] = [];
        for (let y = 0; y < 4; y++) {
            // Tạo mã seed duy nhất dựa trên vị trí ô hiện tại trong lưới: x * 4 + y (từ 0 đến 15)
            const seedValue = x * 4 + y;
            // seededRand trả về [0, 1). Trừ đi 0.5 sẽ đưa về khoảng [-0.5, 0.5), sau đó nhân 14 để tạo biên độ dao động ± 7°C
            const offset = (seededRand(seedValue) - 0.5) * 14; 
            // Nhiệt độ của ô cụ thể = Nhiệt độ nền trung bình + Biên độ dao động ngẫu nhiên cố định
            offsets[x][y] = baseTemp + offset;
        }
    }
    return offsets;
}

/**
 * HÀM 3: Bộ lọc màu sắc theo thang nhiệt độ (Shared Temperature Color Palette)
 * Áp dụng quy tắc phân màu đồng bộ cho cả 2 bản đồ dựa theo ngưỡng nhiệt độ đầu vào.
 * @param {number} temp - Nhiệt độ cần kiểm tra
 * @returns {string} Mã màu dạng HEX tương ứng
 */
function getSharedTempColor(temp) {
    if (temp < 20) return '#A7D8FF';              // Lạnh (<20°C): Màu xanh dương nhạt
    if (temp >= 20 && temp < 27) return '#B7F0C1'; // Mát (20-27°C): Màu xanh lá cây mượt
    if (temp >= 27 && temp < 32) return '#FFF3A3'; // Ấm (27-32°C): Màu vàng nhạt
    return '#FFB3B3';                              // Nóng (>32°C): Màu hồng đỏ cảnh báo
}

/**
 * HÀM 4: Kiểm tra trạng thái màn hình thiết bị di động
 * @returns {boolean} True nếu chiều rộng màn hình nhỏ hơn hoặc bằng 768px (Mobile/Tablet)
 */
function isMobileMap() {
    return window.innerWidth <= 768;
}

/**
 * HÀM 5: Khởi tạo Bản đồ nhỏ (Dashboard Leaflet Map)
 * Cấu hình bản đồ tĩnh đặt tại trung tâm Dashboard chính.
 */
function initDashboardMap() {
    const el = document.getElementById('map');
    if (!el || map) return; // Kiểm tra an toàn nếu không có thẻ HTML hoặc bản đồ đã được tạo rồi thì dừng lại

    map = L.map('map', {
        zoomControl: false,        // Ẩn hai nút cộng/trừ zoom mặc định để giao diện gọn gàng hơn
        attributionControl: false, // Ẩn dòng chữ bản quyền Leaflet ở góc dưới
        dragging: isMobileMap(),   // Trên PC khóa kéo thả bản đồ (để cuộn trang mượt), trên Mobile bật để vuốt xem
        scrollWheelZoom: false,    // Khóa tính năng cuộn chuột vô tình làm phóng to/thu nhỏ bản đồ
        doubleClickZoom: false,    // Khóa phóng to khi double click
        touchZoom: isMobileMap(),  // Bật/tắt zoom bằng hai ngón tay tùy theo thiết bị di động
        zoomSnap: 0,               // Cho phép tỷ lệ thu phóng ở mức số thập phân tự do
        zoomDelta: 0.5             // Bước nhảy zoom mượt hơn với biên độ 0.5
    }).setView([16.0, 108.0], 5);  // Định vị tọa độ mặc định ban đầu tại khu vực Biển Đông / Việt Nam
}

/**
 * HÀM 6: Khởi tạo Bản đồ lớn toàn màn hình (Fullscreen Map Panel)
 */
function initCountryMapPanel() {
    const el = document.getElementById('country-map');
    if (!el || countryMap) return;

    countryMap = L.map('country-map', {
        zoomControl: false,
        attributionControl: false,
        zoomSnap: 0,
        zoomDelta: 0.5
    }).setView([20, 0], 2); // Khởi tạo view bao quát toàn cầu lúc ban đầu
}

/**
 * HÀM 7: Lắng nghe và xử lý co giãn kích thước màn hình (Responsive Resize Handler)
 * Đảm bảo các lớp bản đồ tự động co giãn ôm khít ranh giới quốc gia (fitBounds) khi xoay màn hình hoặc đổi kích thước cửa sổ.
 */
function initMapResizeHandler() {
    if (window._mapResizeBound) return; // Mẫu thiết kế Guard Pattern: Chặn việc đăng ký trùng lặp sự kiện nhiều lần
    window._mapResizeBound = true;

    window.addEventListener('resize', () => {
        // Cập nhật lại quyền tương tác kéo thả bản đồ theo thời gian thực dựa trên kích thước màn hình mới
        if (isMobileMap()) {
            if (map) { map.dragging.enable(); map.touchZoom.enable(); }
        } else {
            if (map) { map.dragging.disable(); map.touchZoom.disable(); }
        }
        
        // Nếu bản đồ Dashboard đang hiển thị một quốc gia (currentGeoLayer)
        if (map && currentGeoLayer) {
            map.invalidateSize(); // Ép Leaflet tính toán lại kích thước khung chứa DOM (sửa lỗi sọc trắng mất mảnh bản đồ)
            // Tự động căn chỉnh bản đồ vừa vặn với khung nhìn kèm theo khoảng đệm (padding) tinh chỉnh sẵn
            map.fitBounds(currentGeoLayer.getBounds(), { paddingBottomRight: [10, 60], paddingTopLeft: [10, 10] });
        }
        
        // Tương tự với bản đồ lớn toàn màn hình
        if (countryMap && currentCountryLayer) {
            countryMap.invalidateSize();
            countryMap.fitBounds(currentCountryLayer.getBounds(), { paddingBottomRight: [40, 100], paddingTopLeft: [40, 80] });
        }
    });
}

/**
 * HÀM 8: Đăng ký sự kiện tìm kiếm quốc gia trong Map Panel
 */
function initMapPanelEvents() {
    if (window._mapPanelEventsBound) return;
    window._mapPanelEventsBound = true;

    const mapSearchBtn = document.getElementById('map-search-btn');
    const countryInput = document.getElementById('country-input');

    // Nhấp chuột vào nút "Tìm kiếm" trên Panel Bản đồ
    if (mapSearchBtn) {
        mapSearchBtn.addEventListener('click', () => {
            const val = countryInput ? countryInput.value.trim() : '';
            if (val) processCountrySearch(val);
        });
    }

    // Gõ phím "Enter" ngay trong ô nhập tên quốc gia
    if (countryInput) {
        countryInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                const val = e.target.value.trim();
                if (val) processCountrySearch(val);
            }
        });
    }
}

/**
 * HÀM 9: Hàm tổng hợp khởi chạy toàn bộ hệ thống bản đồ ứng dụng
 */
function initMaps() {
    initDashboardMap();
    initCountryMapPanel();
    initMapResizeHandler();
    initMapPanelEvents();

    // Tạo một khoảng trễ cực nhỏ 100ms để đảm bảo các thẻ CSS v-nhìn hiển thị xong, giúp bản đồ hiển thị đủ mảnh ngay từ đầu
    if (map) setTimeout(() => map.invalidateSize(), 100);
    if (countryMap) setTimeout(() => countryMap.invalidateSize(), 100);
}

/**
 * HÀM 10: Vẽ bản đồ phân lưới nhiệt độ lên Dashboard nhỏ (Render Country Grid Map)
 * @param {string} countryCode2Letter - Mã quốc gia 2 ký tự (Ví dụ: 'VN', 'JP')
 * @param {number} baseTemp - Nhiệt độ nền gốc lấy từ API thời tiết hiện tại
 */
async function renderCountryMap(countryCode2Letter, baseTemp) {
    if (!map) initDashboardMap();
    if (!map) return;

    try {
        // [Bước 1]: Gọi API RestCountries để tìm mã quốc gia 3 ký tự (cca3) phục vụ việc lấy file GeoJSON ranh giới
        const resCountry = await fetch(`https://restcountries.com/v3.1/alpha/${countryCode2Letter}`);
        const countryData = await resCountry.json();
        const cca3 = countryData[0].cca3.toUpperCase(); // Ví dụ: 'VNM', 'JPN'

        // Cập nhật tên quốc gia bằng Tiếng Việt (nếu có trong dữ liệu dịch) và hiển thị nhiệt độ nền
        document.getElementById('map-country-name').innerText = countryData[0].translations?.vie?.common || countryData[0].name.common;
        document.getElementById('map-base-temp').innerText = `Nhiệt độ nền: ${formatTempRound(baseTemp)}°${currentUnitSys}`;

        // [Bước 2]: Tải file GeoJSON định dạng ranh giới địa lý chi tiết của quốc gia từ kho dữ liệu Github công cộng
        const resGeo = await fetch(`https://raw.githubusercontent.com/johan/world.geo.json/master/countries/${cca3}.geo.json`);
        if (!resGeo.ok) throw new Error("Không có map.");
        const geoData = await resGeo.json();

        // [Bước 3]: Sử dụng thư viện Turf.js tính toán hộp ranh giới chứa (Bounding Box - bbox) của toàn bộ quốc gia
        const bbox = turf.bbox(geoData);
        
        // Thuật toán xử lý ranh giới các nước nằm sát đường kinh tuyến đổi ngày 180 độ (Ví dụ: Mỹ, Nga, Fiji,...)
        // Tránh lỗi bản đồ bị kéo vệt dài quét ngang toàn cầu bằng cách dịch chuyển tọa độ âm cộng thêm 360 độ
        if (bbox[2] - bbox[0] > 280) {
            turf.coordEach(geoData, coord => { if (coord[0] < 0) coord[0] += 360; });
        }

        // Tính toán lại ma trận khung lưới 4x4 dựa trên tọa độ biên độ tối thiểu và tối đa mới
        const newBbox = turf.bbox(geoData);
        const minLng = newBbox[0], minLat = newBbox[1], maxLng = newBbox[2], maxLat = newBbox[3];
        
        // Chia chiều dài và chiều rộng địa lý của quốc gia ra làm 4 phần bằng nhau (tạo bước nhảy kinh độ/vĩ độ)
        const lngStep = (maxLng - minLng) / 4;
        const latStep = (maxLat - minLat) / 4;
        const gridFeatures = [];

        // Khởi tạo bảng danh sách 16 ô nhiệt độ cố định dựa theo hàm Seeded Random
        const tempOffsets = buildTempOffsets(baseTemp);

        // Vòng lặp lồng nhau duyệt qua ma trận lưới tọa độ 4x4
        for (let x = 0; x < 4; x++) {
            for (let y = 0; y < 4; y++) {
                // Thuật toán tạo nhiễu đa giác (Noise Map): Tạo biên giới răng cưa nhỏ giữa các ô nhiệt độ giúp bản đồ trông tự nhiên hơn
                const maxNoiseX = Math.min(0.05, Math.abs(lngStep) * 0.4);
                const maxNoiseY = Math.min(0.05, Math.abs(latStep) * 0.4);
                const noiseX = () => (seededRand(x * 10 + y + 100) - 0.5) * (0.01 > maxNoiseX ? maxNoiseX : 0.01);
                const noiseY = () => (seededRand(x * 10 + y + 200) - 0.5) * (0.01 > maxNoiseY ? maxNoiseY : 0.01);

                // Thiết lập 4 điểm góc của 1 ô hình vuông (Polygon Cell) kèm theo sai số nhiễu tọa độ địa lý
                const p1 = [minLng + x * lngStep + noiseX(), minLat + y * latStep + noiseY()];
                const p2 = [minLng + (x + 1) * lngStep + noiseX(), minLat + y * latStep + noiseY()];
                const p3 = [minLng + (x + 1) * lngStep + noiseX(), minLat + (y + 1) * latStep + noiseY()];
                const p4 = [minLng + x * lngStep + noiseX(), minLat + (y + 1) * latStep + noiseY()];
                
                // Dùng Turf.js biến 4 điểm góc thành một đối tượng đa giác GeoJSON chuẩn chỉnh
                const cellPolygon = turf.polygon([[p1, p2, p3, p4, p1]]);
                const cellTemp = tempOffsets[x][y]; // Lấy giá trị nhiệt độ đã gán cho ô này

                try {
                    // Thuật toán Giao thoa bản đồ (Map Intersection): Duyệt qua ranh giới quốc gia gốc, 
                    // cắt đa giác ô vuông này chỉ giữ lại phần diện tích NẰM TRONG đất liền của quốc gia đó (loại bỏ phần biển thừa).
                    geoData.features.forEach(feat => {
                        const intersection = turf.intersect(cellPolygon, feat);
                        if (intersection) { 
                            intersection.properties = { temp: cellTemp }; // Đóng gói nhiệt độ vào thuộc tính của mảnh bản đồ cắt gọn
                            gridFeatures.push(intersection); 
                        }
                    });
                } catch (err) {
                    // Nếu quá trình cắt giao thoa bị lỗi hình học phức tạp, lấy luôn ô vuông thô làm phương án dự phòng
                    cellPolygon.properties = { temp: cellTemp }; 
                    gridFeatures.push(cellPolygon);
                }
            }
        }

        // [Bước 4]: Xóa lớp bản đồ cũ ra khỏi màn hình (nếu có) để tránh hiện tượng xếp chồng nhiều lớp làm nặng bộ nhớ
        if (currentGeoLayer) map.removeLayer(currentGeoLayer);
        
        // Nạp mảng các mảnh đa giác nhiệt độ (gridFeatures) vào Leaflet dưới dạng lớp dữ liệu L.geoJSON
        currentGeoLayer = L.geoJSON(gridFeatures, {
            // Định nghĩa style màu sắc đổ nền động theo nhiệt độ của từng mảnh đa giác
            style: f => ({ 
                fillColor: getSharedTempColor(f.properties.temp), 
                fillOpacity: 0.6, 
                color: "rgba(255, 255, 255, 0.7)", 
                weight: 1 
            }),
            // Đăng ký tương tác sự kiện trên từng mảnh bản đồ nhỏ
            onEachFeature: (f, l) => {
                // Tạo nhãn thông tin (Tooltip) hiển thị nhiệt độ chi tiết khi di chuột qua ô đất đó
                l.bindTooltip(`🌡 ${formatTempFixed(f.properties.temp)}°${currentUnitSys}`, { className: "custom-tooltip" });
                l.on({
                    // Hiệu ứng tương tác Hover UX: Di chuột vào thì ô bản đồ sáng bừng lên (Tăng fillOpacity lên 0.9)
                    mouseover: (e) => e.target.setStyle({ fillOpacity: 0.9 }),
                    // Rời chuột ra thì ô bản đồ mờ trở lại trạng thái ban đầu (0.6)
                    mouseout: (e) => e.target.setStyle({ fillOpacity: 0.6 })
                });
            }
        }).addTo(map);

        // Kích hoạt tính toán kích thước bao và căn góc bản đồ tự động bắt trọn toàn bộ ranh giới quốc gia vừa vẽ
        map.invalidateSize();
        map.fitBounds(currentGeoLayer.getBounds(), { paddingBottomRight: [10, 60], paddingTopLeft: [10, 10] });
    } catch (err) { console.log("Lỗi dựng bản đồ Dashboard:", err); }
}

/**
 * HÀM 11: Lấy thông tin nhiệt độ nền thực tế từ API OpenWeather dựa trên tọa độ Lat/Lon
 * Sử dụng giải thuật dự phòng (Fallback Mocking Algorithm) tự tính toán nhiệt độ thực tế theo vĩ độ địa lý nếu API bị quá tải hoặc mất mạng.
 */
async function fetchBaseTemp(lat, lon) {
    const API_KEY = openWeatherKey;
    try {
        const res = await fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&appid=${API_KEY}`);
        if (!res.ok) throw new Error("OpenWeather API error");
        const data = await res.json();
        return data.main.temp;
    } catch (e) {
        // GIẢI THUẬT DỰ PHÒNG THỰC TẾ: Càng gần Xích đạo vĩ độ absLat = 0 thì nhiệt độ càng cao (~33°C).
        // Càng tiến xa về 2 Cực Trái Đất (vĩ độ tăng dần), nhiệt độ giảm tuyến tính tỷ lệ -0.4°C cho mỗi vĩ độ.
        const absLat = Math.abs(lat);
        const realisticMock = 33 - (absLat * 0.4);
        // Trả về giá trị nhiệt độ giả lập kèm sai số nhiễu nhỏ ±2°C để đảm bảo tính sinh động
        return Math.max(-15, realisticMock) + (Math.random() * 4 - 2);
    }
}

/**
 * HÀM 12: Tìm kiếm và dựng bản đồ phân lưới nhiệt độ quy mô lớn trên Fullscreen Map Panel
 * Hoạt động tương tự hàm renderCountryMap nhưng áp dụng cho khung bản đồ lớn độc lập `countryMap`.
 * @param {string} countryName - Tên quốc gia do người dùng nhập vào ô tìm kiếm (Ví dụ: "Vietnam", "Japan")
 */
async function processCountrySearch(countryName) {
    if (!countryMap) initCountryMapPanel();
    if (!countryMap) return;

    // Hiển thị vòng xoay chờ tải (Loading Spinner) riêng của panel bản đồ
    const loading = document.getElementById('map-loading');
    loading.style.display = 'block';

    try {
        // Gọi API tìm kiếm quốc gia theo tên đầy đủ chính xác trước
        let resCountry = await fetch(`https://restcountries.com/v3.1/name/${countryName}?fullText=true`);
        if (!resCountry.ok) {
            // Nếu không tìm thấy, gọi lại theo cơ chế tìm kiếm từ khóa tương đối (Fuzzy Search) phòng khi người dùng gõ tắt
            resCountry = await fetch(`https://restcountries.com/v3.1/name/${countryName}`);
            if (!resCountry.ok) throw new Error(`Không tìm thấy quốc gia "${countryName}". Vui lòng thử lại.`);
        }
        const countryData = await resCountry.json();
        const cInfo = countryData[0];

        const lat = cInfo.latlng[0];
        const lon = cInfo.latlng[1];
        const cca3 = cInfo.cca3.toUpperCase();

        // THUẬT TOÁN ĐỒNG BỘ CHÉO BẢN ĐỒ (CROSS-MAP SYNCHRONIZATION):
        // Nếu quốc gia đang tìm kiếm trùng khớp hoàn toàn với quốc gia đang hiển thị bên màn hình Dashboard nhỏ, 
        // lấy luôn giá trị `sharedBaseTemp` cũ để đảm bảo biểu đồ màu sắc của 2 bên trùng khớp nhau tuyệt đối.
        let baseTemp;
        if (sharedCountryCode && cInfo.cca2 && sharedCountryCode.toUpperCase() === cInfo.cca2.toUpperCase()) {
            baseTemp = sharedBaseTemp;
        } else {
            // Ngược lại, nếu tìm một quốc gia mới tinh chưa xem ở Dashboard, gọi API lấy nhiệt độ nền mới và cập nhật vào biến chia sẻ toàn cục
            baseTemp = await fetchBaseTemp(lat, lon);
            sharedBaseTemp = baseTemp;
            sharedCountryCode = cInfo.cca2;
        }

        // Cập nhật nhãn thông tin lên màn hình lớn
        document.getElementById('country-name-display').innerText = cInfo.name.common;
        document.getElementById('base-temp-display').innerText = `Nhiệt độ nền: ${formatTempFixed(baseTemp)}°${currentUnitSys}`;

        // Tải ranh giới địa lý chi tiết cho bản đồ lớn
        const resGeo = await fetch(`https://raw.githubusercontent.com/johan/world.geo.json/master/countries/${cca3}.geo.json`);
        if (!resGeo.ok) throw new Error(`Không có dữ liệu bản đồ cho quốc gia này (${cca3}).`);
        const geoData = await resGeo.json();
        if (!geoData.features || geoData.features.length === 0) throw new Error("Dữ liệu địa lý không hợp lệ.");

        // Xử lý đường đổi ngày quốc tế kinh độ 180 độ cho bản đồ lớn
        const initialBbox = turf.bbox(geoData);
        if (initialBbox[2] - initialBbox[0] > 280) {
            turf.coordEach(geoData, (coord) => { if (coord[0] < 0) coord[0] += 360; });
        }

        // Xóa lớp bản đồ cũ trên panel lớn
        if (currentCountryLayer) countryMap.removeLayer(currentCountryLayer);

        const bbox = turf.bbox(geoData);
        const minLng = bbox[0], minLat = bbox[1], maxLng = bbox[2], maxLat = bbox[3];
        const lngStep = (maxLng - minLng) / 4;
        const latStep = (maxLat - minLat) / 4;
        const gridFeatures = [];

        // Khởi tạo 16 ô nhiệt độ với hạt giống ngẫu nhiên cố định (Cùng baseTemp sẽ ra cùng bảng giá trị ô nhiệt độ giống bản đồ Dashboard)
        const tempOffsets = buildTempOffsets(baseTemp);

        for (let x = 0; x < 4; x++) {
            for (let y = 0; y < 4; y++) {
                const maxNoiseX = Math.min(0.05, Math.abs(lngStep) * 0.4);
                const maxNoiseY = Math.min(0.05, Math.abs(latStep) * 0.4);
                const noiseX = () => (seededRand(x * 10 + y + 100) - 0.5) * (0.01 > maxNoiseX ? maxNoiseX : 0.01);
                const noiseY = () => (seededRand(x * 10 + y + 200) - 0.5) * (0.01 > maxNoiseY ? maxNoiseY : 0.01);

                const p1 = [minLng + x * lngStep + noiseX(), minLat + y * latStep + noiseY()];
                const p2 = [minLng + (x + 1) * lngStep + noiseX(), minLat + y * latStep + noiseY()];
                const p3 = [minLng + (x + 1) * lngStep + noiseX(), minLat + (y + 1) * latStep + noiseY()];
                const p4 = [minLng + x * lngStep + noiseX(), minLat + (y + 1) * latStep + noiseY()];
                const cellPolygon = turf.polygon([[p1, p2, p3, p4, p1]]);
                const cellTemp = tempOffsets[x][y];

                try {
                    geoData.features.forEach(feat => {
                        const intersection = turf.intersect(cellPolygon, feat);
                        if (intersection) {
                            intersection.properties = { temp: cellTemp };
                            gridFeatures.push(intersection);
                        }
                    });
                } catch (err) {
                    cellPolygon.properties = { temp: cellTemp };
                    gridFeatures.push(cellPolygon);
                }
            }
        }

        // Tạo cấu trúc lớp hiển thị GeoJSON cho bản đồ lớn
        currentCountryLayer = L.geoJSON(gridFeatures, {
            style: feature => ({
                fillColor: getSharedTempColor(feature.properties.temp),
                fillOpacity: 0.6,
                color: "rgba(255, 255, 255, 0.7)",
                weight: 1
            }),
            onEachFeature: function (feature, layer) {
                const tDetails = formatTempFixed(feature.properties.temp);
                // Thuộc tính 'sticky: true' giúp nhãn dính chạy mượt dọc theo vị trí con trỏ chuột của người dùng
                layer.bindTooltip(`🌡 ${tDetails}°${currentUnitSys}`, { sticky: true, className: "country-tooltip" });
                layer.on({
                    mouseover: (e) => { e.target.setStyle({ fillOpacity: 0.9 }); },
                    mouseout: (e) => { e.target.setStyle({ fillOpacity: 0.6 }); }
                });
            }
        }).addTo(countryMap);

        // Cập nhật lại khung nhìn bao phủ khít ranh giới quốc gia trên bản đồ lớn
        countryMap.invalidateSize();
        countryMap.fitBounds(currentCountryLayer.getBounds(), { paddingBottomRight: [40, 100], paddingTopLeft: [40, 80] });

    } catch (err) {
        alert(`Lỗi tìm kiếm: ${err.message}`);
        console.error(err);
    } finally {
        // Tắt vòng xoay chờ tải trong bất kỳ tình huống nào kết thúc quy trình xử lý
        loading.style.display = 'none';
    }
}

// --- 13. XUẤT (EXPOSE) CÁC HÀM TOÀN CỤC RA PHẠM VI CỬA SỔ TRÌNH DUYỆT WINDOW ---
// Giúp các file JavaScript độc lập khác hoặc mã định tuyến router/sidebar có thể gọi liên thông dễ dàng.
window.initMaps = initMaps;
window.renderCountryMap = renderCountryMap;
window.processCountrySearch = processCountrySearch;