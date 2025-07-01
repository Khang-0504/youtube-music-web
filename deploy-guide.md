# Hướng dẫn triển khai YouTube Music Web

Dưới đây là hướng dẫn chi tiết cách triển khai ứng dụng YouTube Music Web lên một máy chủ để có thể truy cập qua URL riêng.

## 1. Chuẩn bị môi trường

### Yêu cầu hệ thống
- Node.js (v14 trở lên)
- npm (v6 trở lên)
- yt-dlp (đã cài đặt và có trong PATH)

### Cài đặt yt-dlp
- **Windows**: 
  ```
  choco install yt-dlp
  ```
  hoặc tải trực tiếp từ [yt-dlp GitHub](https://github.com/yt-dlp/yt-dlp/releases) và thêm vào PATH

- **Linux**:
  ```
  sudo curl -L https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp -o /usr/local/bin/yt-dlp
  sudo chmod a+rx /usr/local/bin/yt-dlp
  ```

## 2. Cài đặt ứng dụng

1. Clone repository (nếu bạn dùng git) hoặc upload code lên máy chủ:
   ```
   git clone <repository-url> youtube-music-web
   cd youtube-music-web
   ```

2. Cài đặt tất cả dependencies:
   ```
   npm run install-all
   ```

3. Build ứng dụng frontend:
   ```
   npm run build
   ```

## 3. Cấu hình

### Tạo file cấu hình môi trường
Tạo file `.env` trong thư mục `backend` với nội dung sau:

```
# Cấu hình server
PORT=5000
HOST=0.0.0.0

# Cấu hình CORS
CORS_ORIGIN=*

# API key YouTube
DEFAULT_YOUTUBE_API_KEY=YOUR_YOUTUBE_API_KEY
```

Lưu ý: 
- Thay `YOUR_YOUTUBE_API_KEY` bằng API key thật của bạn
- `HOST=0.0.0.0` cho phép server lắng nghe trên tất cả các network interfaces
- `CORS_ORIGIN=*` cho phép truy cập từ bất kỳ domain nào

## 4. Triển khai

### Triển khai trên máy chủ riêng (VPS/Dedicated Server)

1. Khởi động ứng dụng:
   ```
   npm run start
   ```

2. Để giữ ứng dụng luôn chạy, bạn có thể sử dụng PM2:
   ```
   npm install -g pm2
   pm2 start backend/server.js --name youtube-music-web
   pm2 save
   pm2 startup
   ```

### Cấu hình Nginx (nếu cần)

Nếu bạn muốn sử dụng Nginx làm reverse proxy:

1. Cài đặt Nginx:
   ```
   sudo apt install nginx
   ```

2. Tạo cấu hình site:
   ```
   sudo nano /etc/nginx/sites-available/youtube-music-web
   ```

3. Thêm cấu hình sau:
   ```
   server {
       listen 80;
       server_name your-domain.com www.your-domain.com;

       location / {
           proxy_pass http://localhost:5000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```

4. Kích hoạt site và khởi động lại Nginx:
   ```
   sudo ln -s /etc/nginx/sites-available/youtube-music-web /etc/nginx/sites-enabled/
   sudo nginx -t
   sudo systemctl restart nginx
   ```

5. Cấu hình HTTPS với Certbot (tùy chọn nhưng khuyến nghị):
   ```
   sudo apt install certbot python3-certbot-nginx
   sudo certbot --nginx -d your-domain.com -d www.your-domain.com
   ```

### Triển khai trên dịch vụ Hosting PaaS

#### Heroku
1. Cài đặt Heroku CLI và đăng nhập
2. Tạo file `Procfile` trong thư mục gốc:
   ```
   web: cd backend && npm start
   ```
3. Triển khai:
   ```
   heroku create your-app-name
   git push heroku main
   ```

#### Railway/Render/Vercel
- Những dịch vụ này có thể triển khai trực tiếp từ GitHub repository
- Cấu hình các biến môi trường trong dashboard của dịch vụ
- Đặt build command: `npm run build`
- Đặt start command: `npm run start`

## 5. Truy cập ứng dụng

Sau khi triển khai, bạn có thể truy cập ứng dụng qua:
- URL của dịch vụ hosting nếu sử dụng PaaS
- Domain của bạn nếu đã cấu hình với Nginx
- http://your-server-ip:5000 nếu chỉ chạy trực tiếp

## 6. Khắc phục sự cố

### Vấn đề với yt-dlp
- Kiểm tra yt-dlp đã cài đặt đúng cách: `yt-dlp --version`
- Cập nhật yt-dlp lên phiên bản mới nhất: `yt-dlp -U`

### Vấn đề với API YouTube
- Kiểm tra API key có hiệu lực
- Kiểm tra hạn ngạch API còn đủ

### Vấn đề với CORS
- Nếu frontend và backend chạy trên các domain khác nhau, hãy cấu hình CORS_ORIGIN để chỉ định chính xác domain của frontend

### Vấn đề với proxy
- Kiểm tra cấu hình Nginx và đảm bảo proxy_pass trỏ đến đúng địa chỉ và cổng của ứng dụng 