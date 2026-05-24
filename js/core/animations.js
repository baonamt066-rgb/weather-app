// ============================================================================
// ========== GENERATE STARS (TỰ ĐỘNG TẠO HIỆU ỨNG BẦU TRỜI SAO NGẪU NHIÊN) ==========
// ============================================================================

/**
 * Sử dụng cấu trúc IIFE (Immediately Invoked Function Expression)
 * Đây là hàm khởi tạo ngay lập tức sau khi khai báo, giúp đóng gói phạm vi biến (scope),
 * tránh làm ô nhiễm (pollute) hoặc xung đột biến với các đoạn mã khác trong file.
 */
(function generateStars() {
    
    // 1. Tìm phần tử DOM đóng vai trò là "bầu trời" (vùng chứa các ngôi sao) dựa vào ID
    const starsEl = document.getElementById('sky-stars');
    
    // 2. Kỹ thuật "Guard Clause" (Mệnh đề bảo vệ): 
    // Nếu không tìm thấy phần tử `#sky-stars` trên giao diện HTML, kết thúc và thoát hàm ngay lập tức.
    // Điều này giúp ngăn chặn lỗi runtime (gây sập ứng dụng JS) ở các dòng code phía sau.
    if (!starsEl) return;
    
    // 3. Vòng lặp for để tạo ra đúng 90 ngôi sao trên bầu trời
    for (let i = 0; i < 90; i++) {
        
        // Tạo mới một thẻ <span> trong bộ nhớ làm đại diện cho 1 ngôi sao độc lập
        const s = document.createElement('span');
        
        // 4. Định hình thuộc tính CSS trực tiếp (Inline Style) cho ngôi sao bằng Template Literals (``)
        // Kết hợp hàm Math.random() [trả về giá trị từ 0 đến cận 1] để tạo tính ngẫu nhiên tự nhiên:
        s.style.cssText = `
            /* Độ rộng ngẫu nhiên từ 1.0px đến 3.5px (Kích thước ngôi sao to nhỏ khác nhau) */
            width:${Math.random() * 2.5 + 1}px;
            
            /* Chiều cao ngẫu nhiên từ 1.0px đến 3.5px (Đảm bảo ngôi sao là hình vuông/tròn đều) */
            height:${Math.random() * 2.5 + 1}px;
            
            /* Vị trí trục dọc ngẫu nhiên nằm trong khoảng từ 0% đến 75% chiều cao vùng chứa */
            /* Giới hạn 75% giúp các ngôi sao tập trung ở nửa trên bầu trời, tránh đè vào các nút ở chân màn hình */
            top:${Math.random() * 75}%;
            
            /* Vị trí trục ngang ngẫu nhiên trải rộng từ 0% đến 100% toàn độ rộng màn hình */
            left:${Math.random() * 100}%;
            
            /* Thời gian chờ trước khi bắt đầu nhấp nháy ngẫu nhiên từ 0s đến 3s */
            /* Giúp các ngôi sao không bị nhấp nháy đồng loạt cùng một lúc, tạo hiệu ứng lung linh tự nhiên */
            animation-delay:${Math.random() * 3}s;
            
            /* Thời gian hoàn thành một chu kỳ nhấp nháy ngẫu nhiên từ 1.5s đến 3.5s */
            /* Có ngôi sao sẽ chớp nhanh, có ngôi sao sẽ chớp chậm hơn */
            animation-duration:${Math.random() * 2 + 1.5}s;
        `;
        
        // 5. Gắn thẻ <span> vừa được cấu hình CSS vào làm con bên trong vùng chứa `#sky-stars`
        // Lúc này ngôi sao chính thức xuất hiện trên giao diện người dùng
        starsEl.appendChild(s);
    }
})();