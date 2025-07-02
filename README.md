# YouTube Music Web App

Ứng dụng web đơn giản để tìm kiếm và phát nhạc từ YouTube chỉ bằng audio.

## Tính năng

- Tìm kiếm bài hát trên YouTube
- Phát audio (không video) từ các video YouTube
- Hiển thị thông tin bài hát (tiêu đề, lượt xem, thời lượng)
- Lưu lịch sử phát nhạc
- Hỗ trợ nhập API key YouTube tùy chỉnh hoặc sử dụng key mặc định

## Cấu trúc dự án

```
youtube-music-web/
├── backend/              # Server Node.js với Express
│   ├── server.js         # Entry point
│   ├── routes/           # API endpoints
│   ├── services/         # Logic xử lý
│   └── package.json      
├── frontend/             # Client React
│   ├── public/           # Tài nguyên tĩnh
│   ├── src/              # Mã nguồn React
│   └── package.json
└── README.md             # Tài liệu dự án
```

## Công nghệ sử dụng

### Backend
- Node.js & Express
- ytdl-core (thay thế cho yt-dlp)
- googleapis (YouTube Data API v3)

### Frontend
- React
- Bootstrap
- HTML5 Audio API

## Cài đặt và chạy

### Chuẩn bị

1. Lấy YouTube Data API v3 key:
   - Đăng nhập vào [Google Cloud Console](https://console.cloud.google.com/)
   - Tạo dự án mới
   - Bật YouTube Data API v3
   - Tạo credentials (API key)

2. Cấu hình API key:
   - Đặt API key vào file `backend/config.js` hoặc
   - Đặt API key khi chạy ứng dụng web

### Backend

```bash
cd backend
npm install
npm start
```

Backend sẽ chạy tại http://localhost:5000

### Frontend

```bash
cd frontend
npm install
npm start
```

Frontend sẽ chạy tại http://localhost:3000

## Triển khai (Deployment)

### Cách 1: Vercel (Đơn giản nhất)

1. Đăng ký tài khoản tại [Vercel](https://vercel.com/)
2. Cài đặt Vercel CLI: `npm i -g vercel`
3. Đăng nhập: `vercel login`
4. Triển khai:
   ```bash
   cd backend
   vercel
   ```
   ```bash
   cd frontend
   vercel
   ```

### Cách 2: Railway

1. Đăng ký tại [Railway](https://railway.app/)
2. Tạo dự án mới
3. Kết nối GitHub repository
4. Cấu hình các biến môi trường (YouTube API Key)
5. Deploy

### Cách 3: Heroku + Netlify

**Backend (Heroku):**
```bash
cd backend
heroku create
git init
heroku git:remote -a your-heroku-app-name
git add .
git commit -m "Initial commit"
git push heroku master
```

**Frontend (Netlify):**
1. Sửa proxy trong `frontend/package.json` thành URL của backend trên Heroku
2. Build: `npm run build`
3. Deploy thư mục build lên Netlify

## Cách sử dụng

1. Mở ứng dụng trong trình duyệt
2. Nhập YouTube API key (lần đầu sử dụng)
3. Nhập từ khóa tìm kiếm vào ô tìm kiếm
4. Chọn bài hát từ danh sách kết quả
5. Nhạc sẽ tự động phát

## Vượt qua giới hạn truy cập của YouTube với Cookies

YouTube thường có giới hạn truy cập (HTTP 429) cho các yêu cầu không xác thực. Để giải quyết vấn đề này, bạn cần cung cấp cookies từ tài khoản YouTube đã đăng nhập của bạn.

### Cách xuất và sử dụng cookies.txt

#### 1. Cài đặt tiện ích mở rộng cho trình duyệt:
- **Chrome/Cốc Cốc**: [Get cookies.txt](https://chrome.google.com/webstore/detail/get-cookiestxt/bgaddhkoddajcdgocldbbfleckgcbcid)
- **Firefox**: [Cookie Quick Manager](https://addons.mozilla.org/en-US/firefox/addon/cookie-quick-manager/)

#### 2. Xuất cookies từ YouTube:
1. Đăng nhập vào [YouTube](https://www.youtube.com) bằng tài khoản Google của bạn
2. Mở tiện ích "Get cookies.txt" đã cài đặt
3. Nhấn "Export" để tải xuống file cookies.txt

#### 3. Thêm cookies vào ứng dụng cục bộ:
- Đặt file cookies.txt đã tải xuống vào thư mục `backend/` của dự án
- KHÔNG commit file này lên GitHub (đã thêm vào .gitignore)

#### 4. Triển khai cookies lên Render.com (QUAN TRỌNG):

1. **Tải cookie lên Render**:
   - Đăng nhập vào [Render Dashboard](https://dashboard.render.com)
   - Chọn dịch vụ web của bạn (youtube-music-web)
   - Vào tab "Environment"
   - Cuộn xuống phần "Secret Files"
   - Nhấn "Add Secret File"

2. **Cấu hình Secret File**:
   - **File Path (đường dẫn)**: `/opt/render/project/src/backend/cookies.txt`
   - **File Contents (nội dung)**: Dán toàn bộ nội dung của file cookies.txt vào ô này
   - Nhấn "Save"

3. **Triển khai lại ứng dụng**:
   - Sau khi lưu, vào tab "Manual Deploy"
   - Chọn "Clear build cache & deploy"
   - Đợi quá trình triển khai hoàn tất

### Kiểm tra cookies.txt

Nếu cookies.txt được cấu hình đúng:
1. Nó sẽ bắt đầu bằng dòng "# Netscape HTTP Cookie File"
2. Có nhiều dòng chứa thông tin cookie của YouTube (.youtube.com)
3. Kích thước thường từ 1KB đến 5KB

### Lưu ý bảo mật
- Cookies chứa thông tin đăng nhập tài khoản Google của bạn
- KHÔNG chia sẻ file cookies.txt hoặc đưa vào mã nguồn công khai
- Định kỳ cập nhật cookies (khoảng 1-2 tháng/lần) để đảm bảo tính hiệu lực
- Chỉ sử dụng trên các dịch vụ bạn kiểm soát hoàn toàn

## Giấy phép

MIT 

## Hướng dẫn sử dụng với yt-dlp và cookies-from-browser

Ứng dụng sử dụng yt-dlp để truy cập nội dung từ YouTube. Có hai cách thiết lập:

### 1. Cài đặt tự động với script

**Trên Windows:**
- Chạy file `setup-ytdlp.bat` để tự động cài đặt và cấu hình yt-dlp

**Trên Linux/macOS:**
- Chạy lệnh `./setup-ytdlp.sh` để tự động cài đặt và cấu hình yt-dlp

Script sẽ tự động:
- Cài đặt yt-dlp với hỗ trợ web (`pip install yt-dlp[web]`)
- Tìm trình duyệt đã đăng nhập YouTube trên máy tính của bạn
- Kiểm tra khả năng vượt qua kiểm tra bot của YouTube
- Tạo file cấu hình .env với các tham số cần thiết

### 2. Cài đặt thủ công

Nếu bạn muốn cài đặt thủ công:

1. Cài đặt yt-dlp với hỗ trợ web:
   ```
   pip install yt-dlp[web]
   ```

2. Đảm bảo bạn đã đăng nhập vào YouTube trong trình duyệt (Chrome, Firefox, Safari, vv.)

3. Khi chạy ứng dụng trong môi trường development, yt-dlp sẽ tự động lấy cookies từ trình duyệt của bạn.

### Lưu ý quan trọng

- **Môi trường development:** Sử dụng `--cookies-from-browser` để lấy cookies trực tiếp từ trình duyệt
- **Môi trường production:** Vẫn cần file cookies.txt để xác thực với YouTube
- Nếu gặp lỗi "Sign in to confirm you're not a bot", hãy đảm bảo đã đăng nhập vào YouTube trong trình duyệt

## Triển khai

Dự án được thiết kế để triển khai trên nền tảng Render.com. Chi tiết triển khai xem tại [deploy-guide.md](deploy-guide.md). 

## YouTube Music Web

Ứng dụng web nghe nhạc YouTube đơn giản và hiệu quả.

### Tính năng

- Phát nhạc từ YouTube mà không bị gián đoạn bởi quảng cáo
- Tìm kiếm bài hát, album, nghệ sĩ
- Tạo và quản lý danh sách phát
- Giao diện người dùng thân thiện và đáp ứng
- Hỗ trợ phát nhạc nền trên thiết bị di động

### Cài đặt và Chạy

#### Phương pháp 1: Sử dụng Docker

```
docker-compose up -d
```

#### Phương pháp 2: Cài đặt thủ công

1. Cài đặt Node.js (phiên bản 16+)
2. Cài đặt yt-dlp (sử dụng để stream âm thanh từ YouTube)

```bash
# Trên Linux/Mac
pip install -U "yt-dlp[web]"

# Trên Windows
pip install -U "yt-dlp[web]"
# HOẶC tải xuống từ https://github.com/yt-dlp/yt-dlp/releases
```

3. Cài đặt dependencies
```bash
# Cài đặt frontend dependencies
npm install

# Cài đặt backend dependencies
cd backend
npm install
cd ..
```

4. Chạy trình thiết lập yt-dlp (quan trọng)
```bash
# Trên Windows
./setup-ytdlp.bat

# Trên Linux/Mac
./setup-ytdlp.sh
```

5. Chạy ứng dụng
```bash
# Chạy cả frontend và backend
npm run dev

# Hoặc chạy riêng từng cái
npm run start-frontend
cd backend && npm run dev
```

### Giải quyết vấn đề "Sign in to confirm you're not a bot"

YouTube đã tăng cường phát hiện bot. Để giải quyết vấn đề này, ứng dụng sử dụng các phương pháp sau:

#### Trong môi trường phát triển (local)

1. Tự động sử dụng cookies từ trình duyệt của bạn
2. Hỗ trợ Chrome, Firefox, Edge, Safari tùy theo hệ điều hành
3. Chạy lệnh thiết lập: `./setup-ytdlp.bat` (Windows) hoặc `./setup-ytdlp.sh` (Linux/Mac)

#### Trong môi trường sản xuất (Render.com)

1. Tự động sử dụng cơ chế fallback qua các API thay thế:
   - Invidious API
   - Piped API
   - URL Embed

2. Tự động cập nhật cookies giả qua script `bin/update-production-cookies.sh`

### Các API thay thế được hỗ trợ

Nếu yt-dlp không thể truy cập YouTube trực tiếp, ứng dụng sẽ tự động sử dụng các API thay thế:

1. **Invidious API**: API phi tập trung để truy cập YouTube
2. **Piped API**: API thay thế khác để stream nội dung YouTube
3. **URL Embed**: Sử dụng iframe embed để vượt qua một số hạn chế

### Triển khai lên Render.com

Ứng dụng có sẵn cấu hình để triển khai lên Render.com. Chỉ cần kết nối repository với Render và nó sẽ tự động triển khai.

### Đóng góp

Mọi đóng góp đều được chào đón! Vui lòng tạo issue hoặc pull request. 