@echo off
REM Script cài đặt và kiểm tra yt-dlp với hỗ trợ cookies-from-browser cho Windows
REM Tác giả: Khang
REM Ngày: 2/7/2025

echo === Thiết lập yt-dlp cho YouTube Music Web ===
echo.

echo Hệ điều hành: Windows

REM Kiểm tra Python
python --version > nul 2>&1
if %errorlevel% equ 0 (
    set PYTHON=python
    for /f "tokens=*" %%a in ('python --version') do echo Python: %%a
) else (
    python3 --version > nul 2>&1
    if %errorlevel% equ 0 (
        set PYTHON=python3
        for /f "tokens=*" %%a in ('python3 --version') do echo Python: %%a
    ) else (
        echo Không tìm thấy Python. Vui lòng cài đặt Python 3.
        exit /b 1
    )
)

REM Kiểm tra pip
%PYTHON% -m pip --version > nul 2>&1
if %errorlevel% equ 0 (
    set PIP=%PYTHON% -m pip
    for /f "tokens=*" %%a in ('%PYTHON% -m pip --version') do echo Pip: %%a
) else (
    echo Không tìm thấy pip. Vui lòng cài đặt pip.
    exit /b 1
)

REM Kiểm tra yt-dlp
where yt-dlp > nul 2>&1
if %errorlevel% equ 0 (
    for /f "tokens=*" %%a in ('where yt-dlp') do set YTDLP_PATH=%%a
    echo Đã tìm thấy yt-dlp tại: %YTDLP_PATH%
    for /f "tokens=*" %%a in ('yt-dlp --version') do echo Phiên bản: %%a
    
    REM Kiểm tra xem đã cài đặt với hỗ trợ web chưa
    yt-dlp --help | findstr "cookies-from-browser" > nul
    if %errorlevel% neq 0 (
        echo yt-dlp chưa hỗ trợ cookies-from-browser. Đang cài đặt lại...
        %PIP% install -U "yt-dlp[web]"
    ) else (
        echo yt-dlp đã hỗ trợ cookies-from-browser.
    )
) else (
    echo Không tìm thấy yt-dlp. Đang cài đặt...
    %PIP% install -U "yt-dlp[web]"
    for /f "tokens=*" %%a in ('where yt-dlp') do set YTDLP_PATH=%%a
    echo Đã cài đặt yt-dlp tại: %YTDLP_PATH%
)

REM Kiểm tra trình duyệt
echo.
echo === Kiểm tra trình duyệt ===

set BROWSERS=chrome firefox edge brave opera

set FOUND_BROWSER=

for %%b in (%BROWSERS%) do (
    echo|set /p="Kiểm tra %%b... "
    yt-dlp --cookies-from-browser %%b --list-subs "https://www.youtube.com/watch?v=dQw4w9WgXcQ" >nul 2>&1
    if %errorlevel% equ 0 (
        echo TÌM THẤY ✓
        set FOUND_BROWSER=%%b
        goto browser_found
    ) else (
        echo Không tìm thấy.
    )
)

echo Không tìm thấy trình duyệt nào có thể sử dụng với yt-dlp.
exit /b 1

:browser_found

REM Thử tải video để kiểm tra khả năng vượt kiểm tra bot
echo.
echo === Kiểm tra khả năng vượt kiểm tra bot ===
echo Đang thử tải thông tin video từ YouTube...

set TEST_CMD=yt-dlp -j --cookies-from-browser %FOUND_BROWSER% --extractor-args "youtube:player_client=android,web,tv" --extractor-args "youtube:api=innertube" --user-agent "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36" --add-header "Accept: text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8" --add-header "Accept-Language: en-US,en;q=0.9" --add-header "Sec-Fetch-Mode: navigate" https://www.youtube.com/watch?v=dQw4w9WgXcQ

echo Đang chạy lệnh: %TEST_CMD%
%TEST_CMD% >nul 2>&1
if %errorlevel% equ 0 (
    echo THÀNH CÔNG ✓ - Có thể tải video mà không bị kiểm tra bot!
) else (
    echo THẤT BẠI ✗ - Vẫn bị YouTube kiểm tra bot.
    echo Thử phương pháp thay thế với URL nhúng...
    
    set TEST_CMD=yt-dlp -j --cookies-from-browser %FOUND_BROWSER% --extractor-args "youtube:player_client=android,web,tv" --extractor-args "youtube:api=innertube" "https://www.youtube.com/embed/dQw4w9WgXcQ"
    
    %TEST_CMD% >nul 2>&1
    if %errorlevel% equ 0 (
        echo THÀNH CÔNG ✓ - URL nhúng hoạt động!
    ) else (
        echo THẤT BẠI ✗ - Cả hai phương pháp đều không hoạt động.
        echo Vui lòng đăng nhập vào YouTube trong trình duyệt %FOUND_BROWSER% và thử lại.
        exit /b 1
    )
)

REM Cập nhật file môi trường nếu cần thiết
echo.
echo === Cập nhật cấu hình yt-dlp cho dự án ===

REM Tạo file .env nếu chưa tồn tại
if not exist ".env" (
    type nul > .env
)

REM Thêm cấu hình vào file .env
echo YTDLP_PATH=%YTDLP_PATH% >> .env
echo YTDLP_BROWSER=%FOUND_BROWSER% >> .env

echo.
echo Đã cập nhật cấu hình yt-dlp vào file .env
echo Bạn có thể sử dụng yt-dlp với --cookies-from-browser %FOUND_BROWSER% trong dự án của mình.
echo.
echo === Thiết lập hoàn tất ===

REM Hướng dẫn sử dụng cho developer
echo.
echo === Hướng dẫn sử dụng ===
echo 1. Trong môi trường development, code sẽ tự động sử dụng --cookies-from-browser %FOUND_BROWSER%
echo 2. Đảm bảo bạn đã đăng nhập vào YouTube trong trình duyệt %FOUND_BROWSER%
echo 3. Không cần file cookies.txt khi phát triển trên local
echo 4. Khi deploy lên server, bạn vẫn cần file cookies.txt cho môi trường production
echo.
echo Cảm ơn bạn đã sử dụng script thiết lập này!

pause 