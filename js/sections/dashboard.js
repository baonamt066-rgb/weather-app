// ============================================================================
// ========== QUẢN LÝ DANH SÁCH VÀ THÊM MỚI THÀNH PHỐ QUAN TÂM ==========
// ============================================================================

/**
 * HÀM 0: Quản lý Modal thêm thành phố (Helper functions)
 */
function showAddCityModal() {
    const modal = document.getElementById('add-city-modal');
    const input = document.getElementById('modal-city-input');
    modal.style.display = 'flex';
    input.focus();
    input.value = '';
}

function hideAddCityModal() {
    const modal = document.getElementById('add-city-modal');
    modal.style.display = 'none';
}

function showModalAlert(msg, type = 'info') {
    // Hiển thị cảnh báo bằng cách focus vào input và thêm border color
    const input = document.getElementById('modal-city-input');
    const colors = {
        success: '#4CAF50',
        error: '#f44336',
        warning: '#ff9800'
    };
    
    input.style.borderColor = colors[type] || colors.info;
    
    // Nếu là lỗi, delay 2 giây rồi reset
    if (type !== 'success') {
        setTimeout(() => {
            input.style.borderColor = '#ddd';
        }, 2000);
    }
    
    // Hiển thị alert bằng console hoặc tooltip
    console.log(`[${type.toUpperCase()}] ${msg}`);
    
    // Tạo thông báo dạng tooltip nhỏ trên input
    const tooltip = document.createElement('div');
    tooltip.textContent = msg;
    tooltip.style.cssText = `
        position: absolute;
        top: -35px;
        left: 15px;
        background: ${colors[type] || '#2196F3'};
        color: white;
        padding: 8px 12px;
        border-radius: 6px;
        font-size: 12px;
        z-index: 10000;
        animation: slideUp 0.3s ease-out;
    `;
    
    const inputParent = input.parentElement;
    inputParent.style.position = 'relative';
    inputParent.appendChild(tooltip);
    
    setTimeout(() => tooltip.remove(), 3000);
}

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
                
                // Chuẩn hóa tên thành phố để chèn vào onclick HTML an toàn hơn
                const safeCityName = data.name.replace(/'/g, "\\'");
                
                // Dựng chuỗi HTML cấu trúc của một thẻ Thành phố thu nhỏ (Mini City Card)
                // - click vào thẻ sẽ xem chi tiết
                // - click vào nút xóa sẽ xoá khỏi danh sách quan tâm
                const html = `
                    <div class="mini-city-card" onclick="getWeather('${safeCityName}')" style="cursor:pointer" title="Nhấn để xem chi tiết">
                        <button class="mini-city-delete" onclick="removeSavedCity(event, '${safeCityName}')" title="Xóa thành phố"><i class="fas fa-trash-alt"></i></button>
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
 * Hàm này hiển thị modal nhập liệu, kiểm tra xem thành phố đó có tồn tại thật trên API không,
 * nếu hợp lệ thì thêm vào mảng, lưu lại vào LocalStorage của tài khoản và vẽ lại Sidebar.
 */
async function addNewCity() {
    showAddCityModal();
}

async function submitNewCity() {
    const input = document.getElementById('modal-city-input');
    const newCity = input.value.trim();
    
    if (!newCity) {
        input.focus();
        return;
    }
    
    // Mở màn hình phủ chờ (Loading Overlay) để người dùng không bấm loạn khi hệ thống đang xử lý kiểm tra mạng
    loadingOverlay.style.display = 'flex';
    hideAddCityModal();
    
    try {
        // Gửi một yêu cầu thử nghiệm (Test Request) tới OpenWeather để xác minh xem tên thành phố này có tồn tại thật hay không
        const res = await fetch(`https://api.openweathermap.org/data/2.5/weather?q=${newCity}&appid=${openWeatherKey}&units=metric&lang=${currentLang}`);
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
                showModalAlert("✅ Thêm thành phố thành công!", 'success');
                
            } else {
                // Nếu `.includes()` trả về true, báo lỗi cho người dùng biết thành phố này đã được lưu từ trước
                showAddCityModal();
                showModalAlert("⚠️ Thành phố này đã có trong danh sách!", 'warning');
            }
        } else {
            // TÌNH HUỐNG 2: API trả về mã khác 200 (Ví dụ: 404 - Nhập sai chính tả hoặc thành phố không tồn tại trong DB OpenWeather)
            showAddCityModal();
            showModalAlert("❌ Không tìm thấy thành phố này. Vui lòng nhập lại!", 'error');
        }
    } catch (e) {
        // Bắt các lỗi vật lý như mất kết nối Internet, đứt cáp mạng trong quá trình fetch dữ liệu
        showAddCityModal();
        showModalAlert("❌ Có lỗi xảy ra khi kiểm tra thành phố.", 'error');
    } finally {
        // Khối LUÔN LUÔN CHẠY: Ẩn màn hình phủ chờ (Loading Overlay) đi để giải phóng giao diện cho người dùng
        loadingOverlay.style.display = 'none';
    }
}

function removeSavedCity(event, cityName) {
    event.stopPropagation();

    const index = savedCities.findIndex(c => c.toLowerCase() === cityName.toLowerCase());
    if (index === -1) {
        console.warn('Không tìm thấy thành phố để xóa:', cityName);
        return;
    }

    savedCities.splice(index, 1);
    try {
        localStorage.setItem(getSavedCitiesKey(), JSON.stringify(savedCities));
    } catch (e) {
        console.error('Failed to persist savedCities after removal', e);
    }

    renderSavedCities();
    showModalAlert(`✅ Đã xóa ${cityName} khỏi danh sách!`, 'success');
}

// ============================================================================
// ========== EVENT LISTENERS CHO MODAL THÊM THÀNH PHỐ ==========
// ============================================================================

// Nút Thêm
document.getElementById('modal-submit-btn').addEventListener('click', submitNewCity);

// Nút Hủy
document.getElementById('modal-cancel-btn').addEventListener('click', hideAddCityModal);

// Nút X đóng modal
document.getElementById('modal-close-btn').addEventListener('click', hideAddCityModal);

// Nút Escape đóng modal
document.getElementById('modal-city-input').addEventListener('keydown', (e) => {
    if (e.key === 'Escape') hideAddCityModal();
    if (e.key === 'Enter') submitNewCity();
});

// Click ngoài modal để đóng
document.getElementById('add-city-modal').addEventListener('click', (e) => {
    if (e.target.id === 'add-city-modal') hideAddCityModal();
});