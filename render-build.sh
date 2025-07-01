#!/bin/bash
# Script chạy trong quá trình build trên Render.com

# Đường dẫn thư mục gốc của dự án
PROJECT_ROOT="/opt/render/project/src"
BIN_DIR="$PROJECT_ROOT/bin"

# Tạo thư mục bin nếu chưa tồn tại
mkdir -p $BIN_DIR

# Tải yt-dlp mới nhất
echo "Đang tải yt-dlp..."
curl -L https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp -o $BIN_DIR/yt-dlp
chmod +x $BIN_DIR/yt-dlp

# Tạo file cookie trống nếu không tồn tại
echo "Tạo file cookie mặc định nếu cần..."
if [ ! -f "$PROJECT_ROOT/backend/cookies.txt" ]; then
    echo "# Netscape HTTP Cookie File" > "$PROJECT_ROOT/backend/cookies.txt"
    echo "# Đây là file cookie mặc định. Thay thế bằng cookie thật từ trình duyệt để cải thiện khả năng hoạt động." >> "$PROJECT_ROOT/backend/cookies.txt"
fi

# Di chuyển vào thư mục frontend
cd "$PROJECT_ROOT/frontend"

# Cài đặt các phụ thuộc cho frontend
echo "Cài đặt các phụ thuộc cho frontend..."
npm install

# Build frontend
echo "Đang build frontend..."
npm run build

# Kiểm tra thư mục build frontend
echo "Kiểm tra thư mục build frontend:"
ls -la build

# Copy thư mục build vào backend/public
echo "Copy build frontend vào thư mục public của backend..."
mkdir -p "$PROJECT_ROOT/backend/public"
cp -r build/* "$PROJECT_ROOT/backend/public/"

echo "Build hoàn tất!" 