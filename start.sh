#!/bin/bash

# Đảm bảo yt-dlp có quyền thực thi
if [ -f "bin/yt-dlp" ]; then
  chmod +x bin/yt-dlp
  echo "Đã cấp quyền thực thi cho yt-dlp"
fi

# Cấu hình port cho môi trường Render
export PORT=10000
export NODE_ENV=production

# Di chuyển vào thư mục backend và chạy ứng dụng
cd backend && npm start 