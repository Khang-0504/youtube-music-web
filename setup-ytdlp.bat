@echo off
REM Script cài đặt và kiểm tra yt-dlp với hỗ trợ cookies-from-browser cho Windows
REM Tác giả: Khang
REM Ngày: 2/7/2025

echo === Thiết lập yt-dlp cho YouTube Music Web ===
echo.

echo Hệ điều hành: Windows

REM Kiểm tra Python
python --version >nul 2>&1
if %errorlevel% equ 0 (
    set PYTHON=python
    echo Python được tìm thấy
) else (
    echo Không tìm thấy Python. Vui lòng cài đặt Python 3.
    pause
    exit /b 1
)

REM Kiểm tra pip
%PYTHON% -m pip --version >nul 2>&1
if %errorlevel% equ 0 (
    set PIP=%PYTHON% -m pip
    echo Pip được tìm thấy
) else (
    echo Không tìm thấy pip. Vui lòng cài đặt pip.
    pause
    exit /b 1
)

REM Cài đặt yt-dlp
echo.
echo === Cài đặt yt-dlp ===
echo Đang cài đặt yt-dlp với hỗ trợ web...
%PIP% install -U "yt-dlp[web]"

REM Kiểm tra cài đặt
yt-dlp --version >nul 2>&1
if %errorlevel% equ 0 (
    echo yt-dlp đã được cài đặt thành công
    set YTDLP_PATH=yt-dlp
) else (
    echo Không thể cài đặt yt-dlp. Vui lòng thử cài đặt thủ công: pip install "yt-dlp[web]"
    pause
    exit /b 1
)

REM Kiểm tra trình duyệt
echo.
echo === Kiểm tra trình duyệt ===

set BROWSERS=chrome firefox edge brave opera

set FOUND_BROWSER=

for %%b in (%BROWSERS%) do (
    echo Kiểm tra %%b...
    yt-dlp --cookies-from-browser %%b --version >nul 2>&1
    if %errorlevel% equ 0 (
        echo TÌM THẤY - Có thể sử dụng %%b
        set FOUND_BROWSER=%%b
        goto browser_found
    )
)

echo Không tìm thấy trình duyệt nào có thể sử dụng với yt-dlp.
echo Vui lòng đảm bảo bạn đã cài đặt và đăng nhập vào YouTube trên một trong các trình duyệt: Chrome, Firefox, Edge
pause
exit /b 1

:browser_found

echo.
echo === Trình duyệt đã tìm thấy: %FOUND_BROWSER% ===
echo.

REM Thử tải video để kiểm tra khả năng vượt kiểm tra bot
echo === Kiểm tra khả năng vượt kiểm tra bot ===
echo Đang thử tải thông tin video từ YouTube...

yt-dlp --cookies-from-browser %FOUND_BROWSER% -j --skip-download --extractor-args "youtube:player_client=android" "https://www.youtube.com/watch?v=dQw4w9WgXcQ" >nul 2>&1
if %errorlevel% equ 0 (
    echo THÀNH CÔNG - Có thể tải video mà không bị kiểm tra bot!
) else (
    echo Đang thử phương pháp thay thế...
    yt-dlp --cookies-from-browser %FOUND_BROWSER% -j --skip-download "https://www.youtube.com/embed/dQw4w9WgXcQ" >nul 2>&1
    if %errorlevel% equ 0 (
        echo THÀNH CÔNG - URL nhúng hoạt động!
    ) else (
        echo LƯU Ý: Có thể vẫn bị YouTube kiểm tra bot.
        echo Vui lòng đảm bảo bạn đã đăng nhập vào YouTube trong trình duyệt %FOUND_BROWSER%
    )
)

REM Cập nhật file môi trường
echo.
echo === Cập nhật cấu hình yt-dlp cho dự án ===

REM Tạo file .env nếu chưa tồn tại
echo YTDLP_PATH=%YTDLP_PATH% > .env
echo YTDLP_BROWSER=%FOUND_BROWSER% >> .env

echo.
echo Đã cập nhật cấu hình yt-dlp vào file .env
echo Bạn có thể sử dụng yt-dlp với --cookies-from-browser %FOUND_BROWSER% trong dự án của mình.
echo.

REM Tạo file test đơn giản để kiểm tra
echo @echo off > test-ytdlp.bat
echo echo Đang thử nghiệm yt-dlp với %FOUND_BROWSER%... >> test-ytdlp.bat
echo yt-dlp --cookies-from-browser %FOUND_BROWSER% -f bestaudio -o test_audio.mp3 --skip-download "https://www.youtube.com/watch?v=dQw4w9WgXcQ" >> test-ytdlp.bat
echo echo Nếu không có lỗi hiển thị, cấu hình đã hoạt động! >> test-ytdlp.bat
echo pause >> test-ytdlp.bat

echo === Thiết lập hoàn tất ===
echo File test-ytdlp.bat đã được tạo để bạn có thể kiểm tra lại cấu hình.
echo.
echo Hướng dẫn sử dụng:
echo 1. Trong môi trường development, code sẽ tự động sử dụng --cookies-from-browser %FOUND_BROWSER%
echo 2. Đảm bảo bạn đã đăng nhập vào YouTube trong trình duyệt %FOUND_BROWSER%
echo 3. Không cần file cookies.txt khi phát triển trên local
echo.

pause 