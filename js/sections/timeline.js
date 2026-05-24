// ============================================================================
// ========== MODULE 7: TÍNH TOÁN LỊCH TRÌNH MẶT TRỜI & MẶT TRĂNG (SUN & MOON) ==========
// ============================================================================

/**
 * 💡 PHÂN TÍCH NGUYÊN NHÂN CỐT LÕI CỦA LỖI MÚI GIỜ VIỆT NAM (VN BUG LOGIC):
 * API dự báo (Forecast 5-day / 3-hour) của OpenWeatherMap luôn trả về danh sách các mốc thời gian
 * cố định dựa theo chuẩn giờ quốc tế UTC, cách nhau đúng 3 tiếng một lần: 00:00, 03:00, 06:00, 09:00, 12:00, 15:00...
 *
 * - Khi đổi sang giờ địa phương của Nhật Bản (Japan - UTC+9), các mốc này cộng thêm 9 tiếng sẽ thành:
 * 09:00, 12:00, 15:00, 18:00, 21:00, 00:00, 03:00, 06:00 (Trùng khớp 100% với tập giờ hiển thị [6, 9, 12, 15, 18, 21, 0, 3]).
 * - Khi đổi sang giờ địa phương của Việt Nam (Vietnam - UTC+7), các mốc này cộng thêm 7 tiếng sẽ thành:
 * 07:00, 10:00, 13:00, 16:00, 19:00, 22:00, 01:00, 04:00 (Lệch hoàn toàn, không trùng bất kỳ giờ nào trong tập giờ cũ).
 *
 * Hệ quả của mã nguồn cũ: Bản đồ Nhật Bản hiển thị đầy đủ cả 8 mốc thời gian, trong khi tại Việt Nam
 * hệ thống lọc theo giờ cố định không tìm thấy kết quả nào trùng khớp, dẫn đến thanh Timeline bị trống trơn (ZERO items).
 *
 * 🛠 GIẢI PHÁP SỬA LỖI (FIX):
 * Loại bỏ hoàn toàn việc đối sánh giờ cứng. Thay vào đó, lấy trực tiếp các mốc thực tế mà API trả về cho thành phố đó,
 * dùng thuật toán Số học UTC để dịch chuyển sang đúng giờ local của thành phố. Sau đó phân loại dựa theo khoảng thời gian sinh học:
 * - Ban ngày (Daytime): Giờ địa phương nằm trong khoảng từ 06h đến 17h.
 * - Ban đêm (Nighttime): Giờ địa phương nằm trong khoảng từ 18h đến 23h, hoặc từ 00h đến 05h sáng hôm sau.
 */

// ── 1. CÁC HÀM TRỢ GIÚP TÍNH TOÁN THỜI GIAN (HELPERS) ──────────────────────────

/**
 * Trích xuất ngày giờ chi tiết của một trạm khí tượng theo múi giờ địa phương
 * @param {Object} item - Một phần tử dự báo từ API OpenWeather Map
 * @param {number} tz - Lượng giây lệch so với múi giờ quốc tế UTC (Timezone offset tính bằng giây)
 * @returns {Object} Đối tượng chứa năm, tháng, ngày, giờ địa phương chuẩn hóa
 */
function smCityDate(item, tz) {
    // Nhân 1000 để chuyển đổi đơn vị giây (Unix timestamp) của API sang Mili-giây của JavaScript Date
    const d = new Date((item.dt + tz) * 1000);
    return {
        y: d.getUTCFullYear(),
        m: d.getUTCMonth() + 1,
        d: d.getUTCDate(),
        h: d.getUTCHours(),
        // Tạo chuỗi định dạng YYYY-MM-DD phục vụ so sánh chuỗi ngày tháng nhanh
        dateStr: `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`
    };
}

/**
 * Cộng thêm số ngày vào chuỗi ngày hiện tại (Xử lý bước nhảy ngày qua đêm)
 * @param {string} dateStr - Chuỗi ngày gốc định dạng YYYY-MM-DD
 * @param {number} n - Số ngày cần cộng thêm
 * @returns {string} Chuỗi ngày mới sau khi cộng
 */
function smAddDays(dateStr, n) {
    const d = new Date(dateStr + 'T00:00:00Z');
    d.setUTCDate(d.getUTCDate() + n);
    return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`;
}

/**
 * Trích xuất nhanh số giờ địa phương của một gói dữ liệu API
 */
function getLocalHour(item, timezone) {
    return new Date((item.dt + timezone) * 1000).getUTCHours();
}

/**
 * Tính toán chuỗi ngày đích dựa trên khoảng lệch ngày (Day Offset) so với hôm nay
 */
function getTargetDate(dayOffset) {
    const today = new Date();
    today.setDate(today.getDate() + dayOffset);
    return today.toISOString().split("T")[0]; // Cắt chuỗi lấy định dạng YYYY-MM-DD
}

// ── 2. BỘ LỌC PHÂN TÁCH DỮ LIỆU BAN NGÀY / BAN ĐÊM (CORE SPLITTER) ────────────────

/**
 * Phân tách mảng dữ liệu thô từ API thành 2 danh sách: Lịch trình Mặt trời và Lịch trình Mặt trăng
 * @param {Array} allList - Mảng 40 phần tử dự báo thời tiết 5 ngày từ API
 * @param {number} tz - Múi giờ của thành phố (giây)
 * @param {number} dayOffset - Khoảng lệch ngày (0: Hôm nay, 1: Ngày mai,...)
 * @returns {Object} Đối tượng gồm hai mảng { sun: [...], moon: [...] } đã được lọc gọn tối đa 4 phần tử mỗi bên
 */
function smSplitEntries(allList, tz, dayOffset) {
    const targetDate = getTargetDate(dayOffset);

    // Thuật toán Định vị điểm đầu (Index Anchoring): Tìm phần tử đầu tiên trong danh sách trùng khớp với ngày cần xem.
    let startIndex = allList.findIndex(item => item.dt_txt.split(" ")[0] === targetDate);
    if (startIndex === -1) startIndex = 0; // Dự phòng nếu không tìm thấy thì quét từ đầu mảng

    // Thuật toán Mở rộng vùng đệm dữ liệu (Forecast Pool Expansion): 
    // Thay vì chỉ lấy 8 mục (24 tiếng), hệ thống trích xuất hẳn 16 mục liên tiếp (48 tiếng). 
    // Điều này giúp bao quát trọn vẹn các mốc thời gian ban đêm xuyên suốt sang rạng sáng ngày hôm sau mà không lo mất dấu dữ liệu.
    const forecastPool = allList.slice(startIndex, startIndex + 16);

    const sun = [];
    const moon = [];

    forecastPool.forEach(item => {
        const hour = getLocalHour(item, tz);
        const slot = { item, hour }; // Đóng gói dữ liệu đi kèm giờ địa phương thực tế

        // Phân loại tài nguyên sinh học theo khoảng giờ địa phương (Classifying Timeline Slots)
        if (hour >= 6 && hour < 18) {
            // Khung giờ Mặt Trời: Từ 6 giờ sáng đến trước 18 giờ tối
            if (sun.length < 4) sun.push(slot); // Giới hạn giao diện hiển thị tối đa 4 cột mốc đẹp nhất
        } else {
            // Khung giờ Mặt Trăng: Từ 18 giờ tối đến 5 giờ sáng hôm sau
            if (moon.length < 4) moon.push(slot);
        }
    });

    return { sun, moon };
}

// ── 3. BỘ DỰNG GIAO DIỆN TIMELINE ĐỘNG (RENDERER) ───────────────────────────────

/**
 * Kết xuất cấu trúc HTML các mốc thời gian vào vùng chứa container được chỉ định
 * @param {HTMLElement} container - Vùng chứa DOM nhận mã HTML
 * @param {Array} slots - Mảng các phần tử mốc thời gian [{item, hour}, ...]
 */
function smRenderTimeline(container, slots) {
    container.innerHTML = ''; // Làm rỗng container trước khi vẽ mới

    slots.forEach(slot => {
        if (!slot || !slot.item) return;

        const el = document.createElement('div');
        const { item, hour } = slot;
        const temp = formatTempRound(item.main.temp); // Làm tròn nhiệt độ theo đơn vị hệ thống
        const iconCode = item.weather[0].icon;
        const desc = item.weather[0].description;
        const iconUrl = `https://openweathermap.org/img/wn/${iconCode}@2x.png`;
        const timeStr = `${String(hour).padStart(2, '0')}h`; // Chuẩn hóa chuỗi hiển thị giờ dạng "07h", "13h"

        // LOGIC KHỞI TẠO BIỂU TƯỢNG ĐẶC BIỆT TRÊN TIMELINE (SM UX EMOJI):
        // Nếu là trời quang ban ngày ('01d') hoặc trời trong ban đêm ('01n'), sử dụng emoji cỡ lớn để tăng tính thẩm mỹ.
        // Các trạng thái mây, mưa, dông sét phức tạp khác sẽ sử dụng ảnh đồ họa icon chuẩn từ OpenWeatherMap.
        const iconHtml = (iconCode === '01d')
            ? `<span class="sm-emoji">☀️</span>`
            : (iconCode === '01n')
                ? `<span class="sm-emoji">🌙</span>`
                : `<img src="${iconUrl}" alt="${desc}">`;

        el.className = 'sm-timeline-item';
        el.innerHTML = `
            <span class="sm-time">${timeStr}</span>
            <span class="sm-icon">${iconHtml}</span>
            <span class="sm-temp">${temp}°${currentUnitSys}</span>
            <span class="sm-desc">${desc}</span>
            <span class="sm-dot"></span>
        `;
        container.appendChild(el);
    });
}

/**
 * Vẽ khung trống dự phòng (Skeleton/Placeholder Paint) trước khi tải mạng
 * Đảm bảo giao diện UI không bao giờ bị trắng trơn hoặc sụp đổ cấu trúc trong lúc chờ phản hồi từ API.
 */
function smShowPlaceholderTimelines() {
    smRenderTimeline(document.getElementById('sm-sun-timeline'), []);
    smRenderTimeline(document.getElementById('sm-moon-timeline'), []);
    document.getElementById('sm-sun-section').style.display = 'block';
    document.getElementById('sm-moon-section').style.display = 'block';
}

// ── 4. LUỒNG TẢI DỮ LIỆU VÀ KẾT XUẤT CHÍNH (MAIN FETCH & RENDER) ────────────────

/**
 * Hàm điều phối lõi: Tải đồng thời thông tin thời tiết hiện tại và lịch trình dự báo, tính toán múi giờ và vẽ giao diện
 * @param {string} queryParams - Chuỗi tham số truy vấn API (Ví dụ: "q=Hanoi" hoặc "lat=21.0&lon=105.8")
 * @param {number} offset - Số ngày chênh lệch cần xem lịch trình
 */
async function smFetchAndRender(queryParams, offset) {
    const loading = document.getElementById('sm-loading');
    const infoStrip = document.getElementById('sm-info-strip');
    const sunTimeline = document.getElementById('sm-sun-timeline');
    const moonTimeline = document.getElementById('sm-moon-timeline');

    smShowPlaceholderTimelines(); // Khởi tạo bộ khung trống tạm thời bảo vệ UX Layout
    infoStrip.style.display = 'none';
    loading.classList.add('show'); // Kích hoạt hiệu ứng vòng xoay chờ tải dữ liệu

    try {
        // [QUY TRÌNH 1]: Gửi yêu cầu lấy thời tiết hiện tại để trích xuất Tên thành phố, Múi giờ gốc (Timezone Offset) và Bình minh / Hoàng hôn
        const curRes = await fetch(
            `https://api.openweathermap.org/data/2.5/weather?${queryParams}&appid=${openWeatherKey}&units=metric&lang=${currentLang}`
        );
        const curData = await curRes.json();
        
        // Xử lý ngoại lệ (Error Handling Guard): Trường hợp nhập sai tên thành phố, API trả về mã lỗi khác 200
        if (curData.cod !== 200) {
            document.getElementById('sm-city-label').textContent = 'City not found';
            document.getElementById('sm-date-badge').textContent = curData.message || '';
            document.getElementById('sm-sunrise-info').innerHTML = '';
            document.getElementById('sm-sunset-info').innerHTML = '';
            infoStrip.style.display = 'flex';
            return;
        }

        // [QUY TRÌNH 2]: Gửi yêu cầu tải chuỗi 40 mốc thời gian dự báo thời tiết cho 5 ngày tiếp theo
        const fRes = await fetch(
            `https://api.openweathermap.org/data/2.5/forecast?${queryParams}&appid=${openWeatherKey}&units=metric&lang=${currentLang}`
        );
        const fData = await fRes.json();
        const allList = fData.list || [];

        // [QUY TRÌNH 3]: Tính toán lịch thời gian chuẩn tuyệt đối (Pure UTC Arithmetic)
        const tz = curData.timezone; // Số giây chênh lệch phía Đông của kinh tuyến Greenwich (UTC)
        
        // Chuyển đổi mốc thời gian hiện tại trên máy khách sang đúng mốc thời gian thực tế tại địa phương thành phố đó
        const cityNow = new Date(Date.now() + tz * 1000);
        
        // Khởi tạo đối tượng ngày đích dựa trên tham số offset ngày, tính toán theo trục thời gian chuẩn quốc tế UTC
        const target = new Date(Date.UTC(
            cityNow.getUTCFullYear(),
            cityNow.getUTCMonth(),
            cityNow.getUTCDate() + offset
        ));

        // [QUY TRÌNH 4]: Chạy thuật toán phân tách mảng, bóc tách các mốc ban ngày và ban đêm của giờ địa phương
        const { sun, moon } = smSplitEntries(allList, tz, offset);

        // [QUY TRÌNH 5]: Vẽ toàn bộ các ô phần tử thời gian hợp lệ lên màn hình giao diện ứng dụng
        smRenderTimeline(sunTimeline, sun);
        smRenderTimeline(moonTimeline, moon);

        // [QUY TRÌNH 6]: Biên dịch ngôn ngữ hiển thị và định dạng nhãn thông tin dải tóm tắt (Info Strip)
        const pad2 = n => String(n).padStart(2, '0'); // Hàm nhỏ đệm số không đứng trước (Ví dụ: "05" thay vì "5")
        const t = i18n[currentLang]; // Lấy từ điển dịch thuật hiện tại
        
        // Tính toán chính xác thời điểm bình minh và hoàng hôn theo giờ địa phương của thành phố đích
        const sunriseD = new Date((curData.sys.sunrise + tz) * 1000);
        const sunsetD = new Date((curData.sys.sunset + tz) * 1000);
        
        // Chọn định dạng cấu trúc ngôn ngữ hiển thị ngày tháng (Tiếng Anh: en-US, Tiếng Việt: vi-VN)
        const locale = currentLang === 'en' ? 'en-US' : 'vi-VN';
        const displayDate = target.toLocaleDateString(locale, {
            weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC'
        });
        
        // Tạo nhãn tính toán ngày tương đối (Hôm nay, +1 ngày, +2 ngày hoặc lùi ngày nếu có)
        const offsetLabel = offset === 0 ? t.today
            : (offset > 0 ? `+${offset} ${Math.abs(offset) > 1 ? t.daysCode : t.dayCode}`
                : `${offset} ${Math.abs(offset) > 1 ? t.daysCode : t.dayCode}`);

        // Đổ toàn bộ chuỗi thông số văn bản đã biên dịch xong lên giao diện người dùng
        document.getElementById('sm-city-label').textContent = curData.name;
        document.getElementById('sm-city-input').value = curData.name;
        document.getElementById('sm-date-badge').textContent = `${displayDate} (${offsetLabel})`;
        document.getElementById('sm-sunrise-info').innerHTML =
            `<i class="fas fa-sun" style="margin-right:4px"></i> ${t.sunrise} ${pad2(sunriseD.getUTCHours())}:${pad2(sunriseD.getUTCMinutes())}`;
        document.getElementById('sm-sunset-info').innerHTML =
            `<i class="fas fa-moon" style="margin-right:4px"></i> ${t.sunset} ${pad2(sunsetD.getUTCHours())}:${pad2(sunsetD.getUTCMinutes())}`;
        
        infoStrip.style.display = 'flex'; // Kích hoạt hiển thị thanh dải thông tin hoàn chỉnh

    } catch (err) {
        console.error('Lỗi nghiêm trọng tại Module Sun & Moon:', err);
        document.getElementById('sm-city-label').textContent = 'Connection error';
        document.getElementById('sm-date-badge').textContent = 'Check your network and try again';
        document.getElementById('sm-sunrise-info').innerHTML = '';
        document.getElementById('sm-sunset-info').innerHTML = '';
        infoStrip.style.display = 'flex';
    } finally {
        loading.classList.remove('show'); // Tắt vòng xoay chờ tải, giải phóng màn hình ứng dụng
    }
}

// ── 5. ĐIỀU HƯỚNG TÌM KIẾM VÀ TỰ ĐỘNG ĐỊNH VỊ (SEARCH & GEOLOCATION) ──────────────

/**
 * Thực hiện quét và đọc dữ liệu từ ô nhập liệu để kích hoạt tìm kiếm lịch trình
 */
function smSearchForecast() {
    const city = document.getElementById('sm-city-input').value.trim();
    if (!city) {
        document.getElementById('sm-city-input').focus(); // Đặt con trỏ chuột vào ô nhập nếu người dùng bỏ trống
        return;
    }
    // Đọc khoảng lệch ngày, giới hạn giá trị an toàn trong phạm vi từ ngày 0 (hôm nay) đến tối đa ngày 7
    let offset = parseInt(document.getElementById('sm-day-offset').value) || 0;
    offset = Math.max(0, Math.min(7, offset));
    document.getElementById('sm-day-offset').value = offset;
    
    // Gọi luồng nạp và xử lý chính thức dữ liệu thời tiết theo tên thành phố
    smFetchAndRender(`q=${encodeURIComponent(city)}`, offset);
}

/**
 * Thuật toán Tự động tải dữ liệu thông minh (Smart Auto-Load Fallback Algorithm):
 * Hệ thống cố gắng sử dụng tính năng Định vị GPS toàn cầu của trình duyệt (Navigator Geolocation) 
 * để hiển thị thời tiết chính xác tại vị trí thực tế của người dùng ngay khi vừa mở tab.
 * Nếu người dùng từ chối cấp quyền hoặc quá trình định vị vượt quá thời gian chờ 5 giây (Timeout 5000ms),
 * hệ thống sẽ tự động kích hoạt cơ chế dự phòng, lấy thủ đô "Hanoi" làm vị trí mặc định để chạy ứng dụng.
 */
function smAutoLoad() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            pos => smFetchAndRender(`lat=${pos.coords.latitude}&lon=${pos.coords.longitude}`, 0),
            () => {
                // Phương án dự phòng 1: Người dùng chặn quyền định vị
                document.getElementById('sm-city-input').value = 'Hanoi';
                smFetchAndRender('q=Hanoi', 0);
            },
            { timeout: 5000 } // Phương án dự phòng 2: Hết thời gian chờ 5 giây
        );
    } else {
        // Phương án dự phòng 3: Trình duyệt quá cũ không hỗ trợ thiết bị định vị GPS
        document.getElementById('sm-city-input').value = 'Hanoi';
        smFetchAndRender('q=Hanoi', 0);
    }
}

// ── 6. LẮNG NGHE SỰ KIỆN TƯƠNG TÁC NGƯỜI DÙNG (EVENT LISTENERS) ─────────────────

// Kích hoạt khi người dùng nhấp vào nút kính lúp / nút tìm kiếm biểu tượng Mặt trời & Mặt trăng
document.getElementById('sm-search-btn').addEventListener('click', smSearchForecast);

// Lắng nghe phím Enter trong ô nhập tên thành phố giúp tăng tốc thao tác nhập liệu
document.getElementById('sm-city-input').addEventListener('keypress', e => {
    if (e.key === 'Enter') smSearchForecast();
});

// Lắng nghe phím Enter trong ô cấu hình số ngày lệch (Day Offset)
document.getElementById('sm-day-offset').addEventListener('keypress', e => {
    if (e.key === 'Enter') smSearchForecast();
});

// KÍCH HOẠT CHẠY TỰ ĐỘNG NGAY LẦN ĐẦU TIÊN KHI KHỞI CHẠY KHÔNG GIAN ỨNG DỤNG
smAutoLoad();