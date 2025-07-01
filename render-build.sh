#!/usr/bin/env bash
# Script cài đặt yt-dlp và build ứng dụng cho Render

# Hiển thị thư mục hiện tại
echo "Thư mục hiện tại: $(pwd)"
ls -la

# Cài đặt yt-dlp
echo "Đang cài đặt yt-dlp..."
curl -L https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp -o ./yt-dlp
chmod a+rx ./yt-dlp
mkdir -p bin
mv ./yt-dlp bin/
export PATH="$PATH:$(pwd)/bin"

# Kiểm tra phiên bản
echo "Phiên bản yt-dlp:"
./bin/yt-dlp --version

# Cài đặt start.sh có quyền thực thi
echo "Cấp quyền thực thi cho start.sh..."
chmod +x start.sh

# Cài đặt dependencies
echo "Đang cài đặt dependencies..."
npm install

# Kiểm tra cấu trúc thư mục
echo "Cấu trúc thư mục:"
ls -la

# Build frontend
echo "Đang build frontend..."
cd frontend && npm install && npm run build && cd ..

# Kiểm tra thư mục build
echo "Kiểm tra thư mục build frontend:"
ls -la frontend/build

# Copy build frontend vào thư mục public của backend (đảm bảo server.js sẽ phục vụ từ đây)
echo "Copy build frontend vào thư mục public của backend..."
mkdir -p backend/public
cp -r frontend/build/* backend/public/

echo "Build hoàn tất!" 