// ============================================================================
// ========== MODULE 1 & 3: LOGIC THỜI TIẾT LÕI & BIỂU ĐỒ HOẠT HỌA DỰ BÁO ==========
// ============================================================================

/**
 * --- 1. THUẬT TOÁN ĐỒNG BỘ THỜI GIAN THỰC ĐỊA PHƯƠNG (LOCAL TIME SYNC) ---
 * Tính toán chính xác ngày, giờ, phút tại vị trí thành phố đích dựa trên độ lệch múi giờ.
 * @param {number} timezoneOffset - Lượng giây chênh lệch của thành phố so với giờ chuẩn UTC
 */
function updateLocalTime(timezoneOffset) {
    const now = new Date();
    // [Bước 1]: Lấy thời gian hiện tại của máy khách (Epoch ms) + Khoảng lệch múi giờ của thiết bị -> Quy đổi về giờ UTC gốc
    const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
    // [Bước 2]: Cộng thêm số Mili-giây lệch của thành phố mục tiêu để dịch chuyển trục thời gian sang đúng Local Time
    const cityTime = new Date(utc + (1000 * timezoneOffset));
    
    // Cấu hình định dạng chuỗi hiển thị: Thứ, Ngày, Tháng viết tắt, Giờ, Phút (Ví dụ: "Thứ Hai, 25 thg 5, 14:30")
    const options = { weekday: 'long', day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' };
    const locale = currentLang === 'en' ? 'en-US' : 'vi-VN';
    
    // Đẩy chuỗi kết quả đã định dạng ngôn ngữ lên thẻ hiển thị ngày giờ trên Dashboard
    document.getElementById('date-time').innerText = cityTime.toLocaleDateString(locale, options);
}

/**
 * --- 2. LUỒNG ĐIỀU PHỐI VÀ KẾT XUẤT DỮ LIỆU THỜI TIẾT (MAIN DISPLAY LOGIC) ---
 * Nhận gói dữ liệu JSON từ API, phân rã thông số, vẽ thẻ thời tiết hiện tại và vòng lặp dự báo 5 ngày.
 * @param {Object} currentData - Dữ liệu thời tiết hiện tại từ API /weather
 * @param {Object} forecastData - Mảng dữ liệu dự báo 5 ngày / 3 giờ từ API /forecast
 */
function displayWeatherData(currentData, forecastData) {
    // [A] Lưu trữ dữ liệu vào bộ nhớ đệm toàn cục để phục vụ đổi đơn vị đo/đổi ngôn ngữ tức thì
    latestCurrentData = currentData;
    latestForecastData = forecastData;
    
    // [B] Đổ thông số thời tiết cơ bản lên các phần tử giao diện Dashboard
    document.getElementById('city-name').innerText = currentData.name;
    document.getElementById('current-temp').innerText = `${formatTempRound(currentData.main.temp)}°`;
    document.getElementById('feels-like').innerText = `${formatTempRound(currentData.main.feels_like)}°`;
    document.getElementById('humidity').innerText = `${currentData.main.humidity}%`;
    document.getElementById('wind').innerText = `${currentData.wind.speed} km/h`;
    document.getElementById('weather-desc').innerText = currentData.weather[0].description;
    
    // [C] Xử lý tối ưu hóa biểu tượng (Icon Rendering Optimization):
    // Đối với trời quang đãng (01d: ngày, 01n: đêm), sử dụng emoji text cỡ lớn để hiển thị sắc nét, tránh mờ vỡ.
    // Các trạng thái thời tiết khác sẽ nạp ảnh đồ họa 4x chất lượng cao từ OpenWeather CDN.
    const mainIconCode = currentData.weather[0].icon;
    if (mainIconCode === '01d' || mainIconCode === '01n') {
        document.getElementById('main-icon').outerHTML = `<span id="main-icon" style="font-size: 80px; line-height: 1; margin: 10px 0; text-shadow: 0 4px 10px rgba(0,0,0,0.2);">☀️</span>`;
    } else {
        document.getElementById('main-icon').outerHTML = `<img id="main-icon" src="https://openweathermap.org/img/wn/${mainIconCode}@4x.png" alt="Weather Icon" style="width: 100px;">`;
    }
    
    // Kích hoạt cập nhật đồng hồ địa phương
    updateLocalTime(currentData.timezone);

    // [D] THUẬT TOÁN ĐỊNH VỊ MỐC TRƯA DỰ BÁO 5 NGÀY (NOON-TIME ANCHORING FILTER)
    // Mảng dữ liệu thô /forecast trả về 40 phần tử (8 mốc/ngày). Ta cần trích xuất duy nhất 1 mốc đại diện cho mỗi ngày.
    const container = document.getElementById('forecast-container');
    container.innerHTML = ''; // Xóa sạch các thẻ dự báo cũ

    const dailyData = [];
    const seenDates = new Set(); // Cấu trúc Set dùng để kiểm soát trùng lặp chuỗi ngày (YYYY-MM-DD)

    forecastData.list.forEach(item => {
        const date = item.dt_txt.split(' ')[0]; // Bóc tách chuỗi, lấy phần ngày bỏ phần giờ
        
        if (!seenDates.has(date)) {
            // Thuật toán tìm kiếm mốc giữa trưa (12:00:00 PM): Điểm thời tiết ổn định và trực quan nhất trong ngày
            const noonItem = forecastData.list.find(i => i.dt_txt.includes(`${date} 12:00:00`));
            
            // Nếu tìm thấy mốc 12h trưa thì lấy, nếu không (ví dụ ngày cuối hoặc ngày đầu bị thiếu mốc) thì lấy mốc đầu tiên tìm thấy
            dailyData.push(noonItem || item);
            seenDates.add(date); // Đánh dấu ngày này đã được xử lý xong
        }
    });

    // [E] VẼ CÁC THẺ DỰ BÁO CHUẨN ĐỒNG BỘ NGÔN NGỮ (FORECAST RENDER LOOP)
    dailyData.slice(0, 5).forEach(item => {
        const date = new Date(item.dt * 1000);
        const locale = currentLang === 'en' ? 'en-US' : 'vi-VN';
        let shortDay = date.toLocaleDateString(locale, { weekday: 'short' });
        
        // Chuẩn hóa hiển thị Thứ Tiếng Việt (Ví dụ: "Thứ Hai" -> "T2", "Thứ Bảy" -> giữ nguyên "Thứ Bảy")
        if (currentLang === 'vi') {
            const fullDay = date.toLocaleDateString('vi-VN', { weekday: 'long' });
            const parts = fullDay.split(' '); // Tách chuỗi theo khoảng trắng ["Thứ", "Hai"]
            shortDay = (parts[1] === 'Bảy' || parts[1] === 'Nhật') ? fullDay : 'T' + parts[1];
        }
        
        const iconCode = item.weather[0].icon;
        const iconHtml = (iconCode === '01d' || iconCode === '01n')
            ? `<span style="font-size: 24px; min-width: 40px; display: inline-block; text-align: center;">☀️</span>`
            : `<img src="https://openweathermap.org/img/wn/${iconCode}.png" alt="icon" style="width: 40px;">`;
            
        const html = `
            <div class="forecast-item">
                <div class="day-info">
                    <span style="font-weight: 500; min-width: 60px; text-transform: capitalize;">${shortDay}</span>
                    ${iconHtml}
                </div>
                <span class="desc">${item.weather[0].description}</span>
                <div class="temps">
                    <span style="color:#fff">${formatTempRound(item.main.temp_max)}°</span>
                    <span style="color:rgba(255,255,255,0.60); margin-left:5px;">${formatTempRound(item.main.temp_min)}°</span>
                </div>
            </div>
        `;
        container.innerHTML += html; // Bơm thẻ dự báo vào UI
    });

    // [F] LIÊN THÔNG DỮ LIỆU SANG CÁC MODULE KHÁC
    // Trích xuất 8 mốc tiếp theo (24 giờ tới) lưu vào mảng dữ liệu biểu đồ giờ
    currentHourlyData = forecastData.list.slice(0, 8);
    renderChart(); // Vẽ/Cập nhật biểu đồ đường Chart.js
    
    // Đồng bộ mã quốc gia và nhiệt độ nền sang hệ thống bản đồ nhiệt lớp phủ
    renderCountryMap(currentData.sys.country, currentData.main.temp);
    sharedBaseTemp = currentData.main.temp;
    sharedCountryCode = currentData.sys.country;
}

/**
 * --- 3. ĐIỀU HƯỚNG CHUYỂN ĐỔI CHẾ ĐỘ XEM TRÊN BIỂU ĐỒ (TAB NAVIGATION) ---
 */
const tabTemp = document.getElementById('tab-temp');
const tabHumid = document.getElementById('tab-humid');

tabTemp.addEventListener('click', () => {
    currentChartMode = 'temp';
    tabTemp.classList.add('active');
    tabHumid.classList.remove('active');
    renderChart(); // Vẽ lại đồ thị theo dữ liệu nhiệt độ
});

tabHumid.addEventListener('click', () => {
    currentChartMode = 'humid';
    tabHumid.classList.add('active');
    tabTemp.classList.remove('active');
    renderChart(); // Vẽ lại đồ thị theo dữ liệu độ ẩm
});

/**
 * --- 4. THUẬT TOÁN KHỞI TẠO VÀ CẬP NHẬT BIỂU ĐỒ HOẠT HỌA (CHART.JS LOGIC) ---
 * Sử dụng kỹ thuật tái sử dụng thực thể đối tượng (Instance Reuse Technique). 
 * Nếu biểu đồ đã tồn tại, chỉ cập nhật tập dữ liệu (dataset) và gọi lệnh update(), 
 * giúp hiệu ứng dịch chuyển mượt mà, tối ưu bộ nhớ RAM, tránh lỗi chồng chéo canvas (Canvas Flickering).
 */
function renderChart() {
    if (currentHourlyData.length === 0) return;

    const ctx = document.getElementById('overviewChart').getContext('2d');
    
    // Tạo mảng nhãn trục X biểu thị số giờ (Ví dụ: "13:00", "16:00",...)
    const labels = currentHourlyData.map(item => {
        const date = new Date(item.dt * 1000);
        return `${date.getHours()}:00`;
    });

    let chartData, lineColor, labelName;
    let gradient = ctx.createLinearGradient(0, 0, 0, 200); // Khởi tạo vùng dải màu mờ đổ bóng dưới đường vẽ
    const isNight = document.body.classList.contains('night-mode');

    // [Bước A]: Đọc cấu hình chế độ, trích xuất dữ liệu mảng và phối màu Gradient theo trạng thái giao diện (Day/Night)
    if (currentChartMode === 'temp') {
        chartData = currentHourlyData.map(item => getConvertedTemp(item.main.temp));
        lineColor = '#ffd166'; // Đường tuyến tính màu vàng nắng ấm
        labelName = `Nhiệt độ (°${currentUnitSys})`;
        gradient.addColorStop(0, isNight ? 'rgba(255,209,102,0.65)' : 'rgba(255,185,0,0.75)');
        gradient.addColorStop(0.5, isNight ? 'rgba(255,209,102,0.25)' : 'rgba(255,185,0,0.35)');
        gradient.addColorStop(1, 'rgba(255,209,102,0.00)');
    } else {
        chartData = currentHourlyData.map(item => item.main.humidity);
        lineColor = isNight ? '#a8e6ff' : '#1a9fd4'; // Đường tuyến tính màu xanh nước biển
        labelName = 'Độ ẩm (%)';
        gradient.addColorStop(0, isNight ? 'rgba(168,230,255,0.55)' : 'rgba(26,159,212,0.70)');
        gradient.addColorStop(0.5, isNight ? 'rgba(168,230,255,0.20)' : 'rgba(26,159,212,0.30)');
        gradient.addColorStop(1, 'rgba(168,230,255,0.00)');
    }

    // [Bước B]: Thuật toán tự động bo biên trục Y (Dynamic Y-Axis Scaling)
    // Đối với nhiệt độ, tìm giá trị Min/Max thực tế rồi làm tròn về các bội số của 10 để đồ thị luôn nằm chính giữa dải nhìn.
    // Đối với độ ẩm, cố định dải đo tuyệt đối từ 0% đến 100%.
    let yMin, yMax;
    if (currentChartMode === 'temp') {
        const tempMin = Math.min(...chartData);
        const tempMax = Math.max(...chartData);
        yMin = Math.floor(tempMin / 10) * 10;
        yMax = Math.ceil(tempMax / 10) * 10;
    } else {
        yMin = 0;
        yMax = 100;
    }

    // [Bước C]: THỰC THI KIỂM TRA TRẠNG THÁI BIẾN INSTANCE
    if (chartInstance) {
        // PHƯƠNG ÁN CẬP NHẬT (UPDATE PATH): Thực thể đã có, thay thế lõi dữ liệu, đổi màu sắc và ép render lại hoạt họa
        chartInstance.data.labels = labels;
        chartInstance.data.datasets[0].label = labelName;
        chartInstance.data.datasets[0].data = chartData;
        chartInstance.data.datasets[0].borderColor = lineColor;
        chartInstance.data.datasets[0].backgroundColor = gradient;
        chartInstance.data.datasets[0].pointBorderColor = lineColor;
        chartInstance.options.scales.y.min = yMin;
        chartInstance.options.scales.y.max = yMax;
        chartInstance.options.scales.y.ticks.stepSize = currentChartMode === 'temp' ? 10 : 20;
        chartInstance.update(); // Gọi hiệu ứng chuyển tiếp mượt mà nội bộ của Chart.js
    } else {
        // PHƯƠNG ÁN KHỞI TẠO MỚI (CREATION PATH): Khởi tạo đối tượng Chart lần đầu tiên trên Canvas
        chartInstance = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: labelName,
                    data: chartData,
                    borderColor: lineColor,
                    backgroundColor: gradient,
                    borderWidth: 3,
                    pointBackgroundColor: 'rgba(13,79,128,0.85)',
                    pointBorderColor: lineColor,
                    pointBorderWidth: 2,
                    pointRadius: 4,
                    fill: true, // Kích hoạt đổ màu phủ khối phía dưới đường vẽ line
                    tension: 0.4 // Tạo độ cong mượt Bezier cho đường tuyến tính (chống gãy khúc sắc cạnh)
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false, // Cho phép biểu đồ co giãn tự do lấp đầy khung thẻ HTML cha
                animation: { 
                    duration: 800, 
                    easing: 'easeInOutQuart' // Hiệu ứng tăng tốc và giảm tốc hoạt họa mượt mà quý phái
                },
                plugins: { 
                    legend: { display: false }, // Ẩn nhãn chú thích mặc định phía trên để tiết kiệm diện tích UI
                    tooltip: { mode: 'index', intersect: false } // Bật hộp thông tin tra cứu khi di chuột vào bất kỳ vùng cột nào
                },
                scales: {
                    y: {
                        display: true,
                        min: yMin,
                        max: yMax,
                        ticks: {
                            stepSize: currentChartMode === 'temp' ? 10 : 20,
                            color: 'rgba(255,255,255,0.65)',
                            callback: function (value) {
                                // Định dạng hậu tố hiển thị trên nhãn trục tọa độ Y (°C/°F/°K hoặc %)
                                return currentChartMode === 'temp' ? value + '°' + currentUnitSys : value + '%';
                            }
                        },
                        grid: {
                            color: 'rgba(255,255,255,0.10)' // Đường lưới mờ tinh tế ẩn phía sau đồ thị
                        }
                    },
                    x: {
                        grid: { display: false, drawBorder: false }, // Khử bỏ toàn bộ các đường lưới dọc để tránh rối mắt
                        ticks: { color: 'rgba(255,255,255,0.65)', font: { family: 'Outfit', size: 12 } }
                    }
                }
            }
        });
    }
}