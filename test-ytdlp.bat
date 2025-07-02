@echo off 
echo Đang thử nghiệm yt-dlp với chrome... 
yt-dlp --cookies-from-browser chrome -f bestaudio -o test_audio.mp3 --skip-download "https://www.youtube.com/watch?v=dQw4w9WgXcQ" 
echo Nếu không có lỗi hiển thị, cấu hình đã hoạt động! 
pause 
