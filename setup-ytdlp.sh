#!/bin/bash
# Script cài đặt và kiểm tra yt-dlp với hỗ trợ cookies-from-browser
# Tác giả: Khang
# Ngày: 2/7/2025

set -e  # Dừng script nếu có lỗi

echo "=== Thiết lập yt-dlp cho YouTube Music Web ==="

# Kiểm tra hệ điều hành
if [[ "$OSTYPE" == "linux-gnu"* ]]; then
    OS="Linux"
elif [[ "$OSTYPE" == "darwin"* ]]; then
    OS="macOS"
elif [[ "$OSTYPE" == "msys"* || "$OSTYPE" == "win32" ]]; then
    OS="Windows"
else
    OS="Không xác định"
fi

echo "Hệ điều hành: $OS"

# Kiểm tra Python
if command -v python3 &> /dev/null; then
    PYTHON="python3"
elif command -v python &> /dev/null; then
    PYTHON="python"
else
    echo "Không tìm thấy Python. Vui lòng cài đặt Python 3."
    exit 1
fi

echo "Python: $($PYTHON --version)"

# Kiểm tra pip
if command -v pip3 &> /dev/null; then
    PIP="pip3"
elif command -v pip &> /dev/null; then
    PIP="pip"
else
    echo "Không tìm thấy pip. Vui lòng cài đặt pip."
    exit 1
fi

echo "Pip: $($PIP --version)"

# Kiểm tra yt-dlp
if command -v yt-dlp &> /dev/null; then
    YTDLP_PATH=$(which yt-dlp)
    echo "Đã tìm thấy yt-dlp tại: $YTDLP_PATH"
    echo "Phiên bản: $(yt-dlp --version)"
    
    # Kiểm tra xem đã cài đặt với hỗ trợ web chưa
    if ! yt-dlp --help | grep -q "cookies-from-browser"; then
        echo "yt-dlp chưa hỗ trợ cookies-from-browser. Đang cài đặt lại..."
        $PIP install -U "yt-dlp[web]"
    else
        echo "yt-dlp đã hỗ trợ cookies-from-browser."
    fi
else
    echo "Không tìm thấy yt-dlp. Đang cài đặt..."
    $PIP install -U "yt-dlp[web]"
    YTDLP_PATH=$(which yt-dlp)
    echo "Đã cài đặt yt-dlp tại: $YTDLP_PATH"
fi

# Kiểm tra trình duyệt
echo -e "\n=== Kiểm tra trình duyệt ==="

# Danh sách các trình duyệt cần kiểm tra theo hệ điều hành
if [[ "$OS" == "Windows" ]]; then
    BROWSERS=("chrome" "firefox" "edge" "brave" "opera")
elif [[ "$OS" == "macOS" ]]; then
    BROWSERS=("safari" "chrome" "firefox" "brave" "opera")
else
    BROWSERS=("firefox" "chrome" "chromium" "brave" "opera")
fi

# Kiểm tra từng trình duyệt
FOUND_BROWSER=""
for browser in "${BROWSERS[@]}"; do
    echo -n "Kiểm tra $browser... "
    if yt-dlp --cookies-from-browser $browser --list-subs "https://www.youtube.com/watch?v=dQw4w9WgXcQ" &> /dev/null; then
        echo "TÌM THẤY ✓"
        FOUND_BROWSER=$browser
        break
    else
        echo "Không tìm thấy."
    fi
done

if [[ -z "$FOUND_BROWSER" ]]; then
    echo "Không tìm thấy trình duyệt nào có thể sử dụng với yt-dlp."
    exit 1
fi

# Thử tải video để kiểm tra khả năng vượt kiểm tra bot
echo -e "\n=== Kiểm tra khả năng vượt kiểm tra bot ==="
echo "Đang thử tải thông tin video từ YouTube..."

TEST_CMD="yt-dlp -j --cookies-from-browser $FOUND_BROWSER --extractor-args \"youtube:player_client=android,web,tv\" --extractor-args \"youtube:api=innertube\" --user-agent \"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36\" --add-header \"Accept: text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8\" --add-header \"Accept-Language: en-US,en;q=0.9\" --add-header \"Sec-Fetch-Mode: navigate\" https://www.youtube.com/watch?v=dQw4w9WgXcQ"

echo "Đang chạy lệnh: $TEST_CMD"
if eval $TEST_CMD > /dev/null; then
    echo "THÀNH CÔNG ✓ - Có thể tải video mà không bị kiểm tra bot!"
else
    echo "THẤT BẠI ✗ - Vẫn bị YouTube kiểm tra bot."
    echo "Thử phương pháp thay thế với URL nhúng..."
    
    TEST_CMD="yt-dlp -j --cookies-from-browser $FOUND_BROWSER --extractor-args \"youtube:player_client=android,web,tv\" --extractor-args \"youtube:api=innertube\" \"https://www.youtube.com/embed/dQw4w9WgXcQ\""
    
    if eval $TEST_CMD > /dev/null; then
        echo "THÀNH CÔNG ✓ - URL nhúng hoạt động!"
    else
        echo "THẤT BẠI ✗ - Cả hai phương pháp đều không hoạt động."
        echo "Vui lòng đăng nhập vào YouTube trong trình duyệt $FOUND_BROWSER và thử lại."
        exit 1
    fi
fi

# Cập nhật file môi trường nếu cần thiết
echo -e "\n=== Cập nhật cấu hình yt-dlp cho dự án ==="

# Tạo file .env nếu chưa tồn tại
if [[ ! -f ".env" ]]; then
    touch .env
fi

# Thêm cấu hình vào file .env
echo "YTDLP_PATH=$YTDLP_PATH" >> .env
echo "YTDLP_BROWSER=$FOUND_BROWSER" >> .env

echo -e "\nĐã cập nhật cấu hình yt-dlp vào file .env"
echo "Bạn có thể sử dụng yt-dlp với --cookies-from-browser $FOUND_BROWSER trong dự án của mình."
echo -e "\n=== Thiết lập hoàn tất ==="

# Hướng dẫn sử dụng cho developer
echo -e "\n=== Hướng dẫn sử dụng ==="
echo "1. Trong môi trường development, code sẽ tự động sử dụng --cookies-from-browser $FOUND_BROWSER"
echo "2. Đảm bảo bạn đã đăng nhập vào YouTube trong trình duyệt $FOUND_BROWSER"
echo "3. Không cần file cookies.txt khi phát triển trên local"
echo "4. Khi deploy lên server, bạn vẫn cần file cookies.txt cho môi trường production"
echo -e "\nCảm ơn bạn đã sử dụng script thiết lập này!" 