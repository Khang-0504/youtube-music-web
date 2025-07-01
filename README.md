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

YouTube thường có giới hạn truy cập (HTTP 429) cho các yêu cầu không xác thực. Để giải quyết vấn đề này, bạn có thể cung cấp cookies từ tài khoản YouTube đã đăng nhập của bạn:

### Cách xuất và sử dụng cookies.txt
1. **Cài đặt tiện ích mở rộng cho trình duyệt:**
   - Chrome/Cốc Cốc: [Get cookies.txt](https://chrome.google.com/webstore/detail/get-cookiestxt/bgaddhkoddajcdgocldbbfleckgcbcid)
   - Firefox: [Cookie Quick Manager](https://addons.mozilla.org/en-US/firefox/addon/cookie-quick-manager/)

2. **Xuất cookies từ YouTube:**
   - Đăng nhập vào [YouTube](https://www.youtube.com) bằng tài khoản Google của bạn
   - Mở tiện ích "Get cookies.txt" đã cài đặt
   - Nhấn "Export" để tải xuống file cookies.txt

3. **Thêm cookies vào ứng dụng:**
   - Đặt file cookies.txt đã tải xuống vào thư mục `backend/` của dự án
   - KHÔNG commit file này lên GitHub (đã thêm vào .gitignore)

4. **Triển khai trên Render.com:**
   - Khi triển khai trên Render.com, bạn cần tải lên file cookies.txt thông qua Render Dashboard
   - Vào Environment > Secret Files > Add Secret File
   - Path: `/opt/render/project/src/backend/cookies.txt`
   - Contents: Nội dung của file cookies.txt đã xuất

### Lưu ý bảo mật
- Cookies chứa thông tin đăng nhập tài khoản Google của bạn
- KHÔNG chia sẻ file cookies.txt hoặc đưa vào mã nguồn công khai
- Định kỳ cập nhật cookies (khoảng 1-2 tháng/lần) để đảm bảo tính hiệu lực

## Giấy phép

MIT 