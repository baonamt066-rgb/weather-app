// ============================================================================
// ========== CÁC HÀM XỬ LÝ GỌI API LẤY DỮ LIỆU THỜI TIẾT (ASYNC / AWAIT) ==========
// ============================================================================

/**
 * HÀM 1: Lấy dữ liệu thời tiết dựa vào tên Thành phố (City Name)
 * @param {string} city - Tên thành phố do người dùng nhập từ ô tìm kiếm (vd: "Hanoi")
 * Từ khóa 'async' biến hàm này thành một hàm bất đồng bộ, cho phép sử dụng 'await' bên trong.
 */
async function getWeather(city) {
    // [Bước 1]: Hiển thị màn hình chờ (Loading) bằng cách đổi display sang 'flex'
    // Giúp người dùng biết hệ thống đang xử lý, tăng trải nghiệm UX (User Experience)
    loadingOverlay.style.display = 'flex';
    
    // Sử dụng cấu trúc try...catch...finally để kiểm soát lỗi khi gọi dữ liệu từ bên ngoài (API)
    try {
        // [Bước 2]: Gửi yêu cầu (Request) lấy thời tiết HIỆN TẠI (current weather)
        // 'await fetch' bắt JS tạm dừng tại đây cho đến khi server OpenWeather trả về kết quả (Response)
        const currentRes = await fetch(`https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${openWeatherKey}&units=metric&lang=${currentLang}`);
        
        // Chuyển đổi dữ liệu thô (Response) vừa nhận được sang định dạng JSON để JS có thể đọc hiểu
        const currentData = await currentRes.json();
        
        // [Bước 3]: Kiểm tra tính hợp lệ của dữ liệu trả về từ OpenWeather
        // Nếu mã trạng thái 'cod' không phải là 200 (ví dụ 404 do nhập sai tên thành phố), chủ động ném ra lỗi (throw Error)
        if (currentData.cod !== 200) throw new Error('Không tìm thấy thành phố!');

        // [Bước 4]: Gửi tiếp yêu cầu lấy thông tin DỰ BÁO THỜI TIẾT (forecast - các khung giờ/ngày tiếp theo)
        const forecastRes = await fetch(`https://api.openweathermap.org/data/2.5/forecast?q=${city}&appid=${openWeatherKey}&units=metric&lang=${currentLang}`);
        // Chuyển đổi dữ liệu dự báo sang JSON
        const forecastData = await forecastRes.json();

        // [Bước 5]: Truyền cả 2 bộ dữ liệu (Hiện tại & Dự báo) vào hàm hiển thị để vẽ lại giao diện (DOM)
        displayWeatherData(currentData, forecastData);
        
    } catch (error) {
        // Khối 'catch' sẽ bắt lấy bất kỳ lỗi nào xảy ra trong khối 'try' (Lỗi mạng, lỗi sai tên thành phố,...)
        // Hiển thị hộp thoại cảnh báo (alert) thông báo nội dung lỗi cụ thể cho người dùng biết
        alert(error.message);
        
    } finally {
        // Khối 'finally' LUÔN LUÔN ĐƯỢC CHẠY bất kể dòng code trong 'try' thành công hay thất bại (bị lỗi)
        // Nhiệm vụ: Ẩn màn hình chờ (Loading) đi để người dùng thao tác tiếp với ứng dụng
        loadingOverlay.style.display = 'none';
    }
}

/**
 * HÀM 2: Lấy dữ liệu thời tiết dựa vào Tọa độ địa lý (Kinh độ & Vĩ độ)
 * @param {number} lat - Vĩ độ (Latitude) - nhận được từ GPS thiết bị hoặc Bản đồ Leaflet
 * @param {number} lon - Kinh độ (Longitude)
 */
async function getWeatherByCoords(lat, lon) {
    // [Bước 1]: Hiển thị màn hình chờ (Loading) tương tự như hàm tìm kiếm theo tên
    loadingOverlay.style.display = 'flex';
    
    try {
        // [Bước 2]: Gửi yêu cầu lấy thời tiết HIỆN TẠI bằng cách truyền tham số tọa độ (lat, lon) vào URL API
        const currentRes = await fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${openWeatherKey}&units=metric&lang=${currentLang}`);
        const currentData = await currentRes.json();
        
        // [Bước 3]: Gửi yêu cầu lấy dữ liệu DỰ BÁO THỜI TIẾT theo tọa độ (lat, lon)
        const forecastRes = await fetch(`https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${openWeatherKey}&units=metric&lang=${currentLang}`);
        const forecastData = await forecastRes.json();
        
        // [Bước 4]: Đổ toàn bộ dữ liệu tọa độ lấy được vào hàm hiển thị để cập nhật giao diện
        displayWeatherData(currentData, forecastData);
        
    } catch (error) {
        // Khối 'catch' ở đây in lỗi ra tab Console của nhà phát triển (F12) thay vì bật alert như hàm trên
        // Phù hợp khi hệ thống tự động định vị ngầm bằng GPS lúc vừa tải trang
        console.error(error);
        
    } finally {
        // Luôn ẩn màn hình chờ sau khi hoàn thành việc lấy và vẽ dữ liệu thời tiết (hoặc sau khi gặp lỗi)
        loadingOverlay.style.display = 'none';
    }
}