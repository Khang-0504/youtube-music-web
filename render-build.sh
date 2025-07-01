#!/usr/bin/env bash
# Script cài đặt yt-dlp và build ứng dụng cho Render

# Cài đặt yt-dlp
echo "Đang cài đặt yt-dlp..."
curl -L https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp -o ./yt-dlp
chmod a+rx ./yt-dlp
mkdir -p bin
mv ./yt-dlp bin/
export PATH="$PATH:$(pwd)/bin"

# Kiểm tra phiên bản
echo "Phiên bản yt-dlp:"
yt-dlp --version

# Cài đặt dependencies
echo "Đang cài đặt dependencies..."
npm install

# Build frontend
echo "Đang build frontend..."
cd frontend && npm install && npm run build && cd ..

echo "Build hoàn tất!" 