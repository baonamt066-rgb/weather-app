// ============================================================================
// ========== QUẢN LÝ DANH SÁCH VÀ THÊM MỚI THÀNH PHỐ QUAN TÂM ==========
// ============================================================================

/**
 * HÀM 1: Vẽ (Render) danh sách các thành phố quan tâm lên thanh Sidebar
 * Hàm này duyệt qua mảng `savedCities`, gọi API lấy thời tiết thời gian thực của từng nơi,
 * dựng cấu trúc thẻ HTML mini và chèn động vào vùng chứa `#side-cities-list`.
 */
async function renderSavedCities() {
    // [Bước 1]: Reset vùng chứa bằng cách xóa rỗng toàn bộ nội dung HTML cũ bên trong.
    // Điều này giúp tránh hiện tượng các thẻ cũ bị lặp lại (duplicate) khi hàm được gọi lại nhiều lần.
    sideCitiesList.innerHTML = '';

    // [Bước 2]: Sử dụng vòng lặp for...of để duyệt qua từng tên thành phố nằm trong mảng `savedCities`.
    // Dùng for...of kết hợp 'await' giúp kiểm soát thứ tự gọi API tuần tự và xử lý bất đồng bộ chuẩn xác.
    for (let city of savedCities) {
        try {
            // Gửi yêu cầu lấy thời tiết hiện tại của thành phố đang xét
            const res = await fetch(`https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${openWeatherKey}&units=metric&lang=${currentLang}`);
            
            // Nếu phản hồi từ OpenWeather thành công (HTTP Status Code 200-299)
            if (res.ok) {
                // Chuyển đổi dữ liệu nhận được sang định dạng đối tượng JSON
                const data = await res.json();
                
                // Trích xuất mã biểu tượng thời tiết (Ví dụ: '01d', '02n', '04d')
                const iconCode = data.weather[0].icon;
                
                // LOGIC TÙY BIẾN ICON ĐẶC BIỆT:
                // Nếu là trời quang đãng, nắng/đêm trong suốt ('01d' hoặc '01n'), sử dụng emoji mặt trời lớn ☀️ để giao diện đẹp hơn.
                // Ngược lại, nếu là mây, mưa, sấm sét,... thì dùng thẻ <img> để nạp hình ảnh icon gốc từ server OpenWeatherMap.
                const iconHtml = (iconCode === '01d' || iconCode === '01n')
                    ? `<span style="font-size: 34px; margin-right: 15px; display: inline-block;">☀️</span>`
                    : `<img src="https://openweathermap.org/img/wn/${iconCode}@2x.png" alt="icon" style="width: 50px;">`;
                
                // Dựng chuỗi HTML cấu trúc của một thẻ Thành phố thu nhỏ (Mini City Card)
                // - Sự kiện onclick="getWeather('${data.name}')" giúp người dùng click vào thẻ này là Dashboard lớn tự cập nhật thời tiết nơi đó.
                // - formatTempRound() được gọi để làm tròn nhiệt độ và tự động đổi sang đơn vị đo (°C/°F/°K) hệ thống đang chọn.
                const html = `
                    <div class="mini-city-card" onclick="getWeather('${data.name}')" style="cursor:pointer" title="Nhấn để xem chi tiết">
                        <div class="city-left">
                            ${iconHtml}
                            <div>
                                <h4>${data.name}</h4>
                                <p>${data.weather[0].description}</p>
                            </div>
                        </div>
                        <h2>${formatTempRound(data.main.temp)}°</h2>
                    </div>
                `;
                
                // Cộng dồn thẻ vừa dựng vào bên trong vùng chứa HTML trên giao diện
                sideCitiesList.innerHTML += html;
            }
        } catch (e) { 
            // Sử dụng console.error để in thông báo lỗi ra tab F12 nếu một thành phố cụ thể bị lỗi mạng hoặc API lỗi, 
            // đảm bảo vòng lặp không bị đứt gãy, các thành phố còn lại trong danh sách vẫn tiếp tục được tải bình thường.
            console.error("Lỗi tải thành phố phụ:", city); 
        }
    }

    // [Bước 3]: Sau khi duyệt và vẽ xong toàn bộ các thành phố, tiến hành tạo thêm một nút bấm "Thêm thành phố" (Add Button)
    // Nút bấm này nằm ở cuối danh sách, khi click sẽ kích hoạt hàm addNewCity()
    const btnHtml = `
        <div class="add-city-btn" onclick="addNewCity()">
            <i class="fas fa-plus" style="margin-bottom: 10px; font-size: 20px;"></i>
            <p>Thêm thành phố quan tâm</p>
        </div>
    `;
    
    // Đẩy nút thêm mới vào vị trí dưới cùng của thanh Sidebar
    sideCitiesList.innerHTML += btnHtml;
}

/**
 * HÀM 2: Xử lý thêm một thành phố mới vào danh sách quan tâm
 * Hàm này hiển thị hộp thoại nhập liệu, kiểm tra xem thành phố đó có tồn tại thật trên API không,
 * nếu hợp lệ thì thêm vào mảng, lưu lại vào LocalStorage của tài khoản và vẽ lại Sidebar.
 */
async function addNewCity() {
    // Hiển thị hộp thoại Prompt nguyên bản của trình duyệt để yêu cầu người dùng gõ tên thành phố
    const newCity = prompt("Nhập tên thành phố/tỉnh bạn muốn thêm (VD: Hai Phong, Can Tho):");
    
    // Kiểm tra đầu vào: Người dùng có nhập chữ và chuỗi nhập không phải là khoảng trắng vô nghĩa
    if (newCity && newCity.trim() !== '') {
        // Mở màn hình phủ chờ (Loading Overlay) để người dùng không bấm loạn khi hệ thống đang xử lý kiểm tra mạng
        loadingOverlay.style.display = 'flex';
        
        try {
            // Gửi một yêu cầu thử nghiệm (Test Request) tới OpenWeather để xác minh xem tên thành phố này có tồn tại thật hay không
            const res = await fetch(`https://api.openweathermap.org/data/2.5/weather?q=${newCity.trim()}&appid=${openWeatherKey}&units=metric&lang=${currentLang}`);
            const data = await res.json();
            
            // TÌNH HUỐNG 1: API trả về mã trạng thái 200 (Thành phố tồn tại hợp lệ)
            if (data.cod === 200) {
                // Sử dụng hàm `.includes()` để kiểm tra xem tên chuẩn hóa (data.name) đã có trong danh sách quan tâm trước đó chưa
                if (!savedCities.includes(data.name)) {
                    
                    // Nếu chưa có, đẩy (push) tên chuẩn hóa từ API vào mảng quản lý `savedCities`
                    savedCities.push(data.name);
                    
                    // ĐỒNG BỘ VÀO BỘ NHỚ LOCALSTORAGE:
                    try { 
                        // getSavedCitiesKey() đảm bảo dữ liệu lưu đúng kho lưu trữ của tài khoản đang đăng nhập hiện tại
                        // Chuyển đổi mảng sang dạng chuỗi JSON bằng JSON.stringify trước khi ghi dữ liệu xuống
                        localStorage.setItem(getSavedCitiesKey(), JSON.stringify(savedCities)); 
                    } catch (e) { 
                        console.error('Failed to persist savedCities', e); 
                    }
                    
                    // Gọi hàm renderSavedCities() ở trên bằng từ khóa 'await' để vẽ lại toàn bộ danh sách sidebar cập nhật mới nhất
                    await renderSavedCities();
                    
                } else {
                    // Nếu `.includes()` trả về true, báo lỗi cho người dùng biết thành phố này đã được lưu từ trước
                    alert("Thành phố này đã có trong danh sách!");
                }
            } else {
                // TÌNH HUỐNG 2: API trả về mã khác 200 (Ví dụ: 404 - Nhập sai chính tả hoặc thành phố không tồn tại trong DB OpenWeather)
                alert("Không tìm thấy thành phố này. Vui lòng nhập lại chính xác!");
            }
        } catch (e) {
            // Bắt các lỗi vật lý như mất kết nối Internet, đứt cáp mạng trong quá trình fetch dữ liệu
            alert("Có lỗi xảy ra khi kiểm tra thành phố.");
        } finally {
            // Khối LUÔN LUÔN CHẠY: Ẩn màn hình phủ chờ (Loading Overlay) đi để giải phóng giao diện cho người dùng
            loadingOverlay.style.display = 'none';
        }
    }
}