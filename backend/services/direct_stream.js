const path = require('path');
const { PassThrough } = require('stream');
const https = require('https');
const http = require('http');
const { exec, spawn } = require('child_process');
const fs = require('fs');

// Kiểm tra xem yt-dlp có sẵn không
let ytdlpAvailable = false;
let ytdlpPath = 'yt-dlp'; // Mặc định yt-dlp trong PATH

// Tìm yt-dlp trong PATH
const checkYtDlp = () => {
  return new Promise((resolve) => {
    // Trước tiên kiểm tra trong thư mục bin của dự án (cho Render)
    const projectBinPath = path.join(__dirname, '..', '..', 'bin', 'yt-dlp');
    if (fs.existsSync(projectBinPath)) {
      ytdlpPath = projectBinPath;
      console.log('Đã tìm thấy yt-dlp trong thư mục dự án:', ytdlpPath);
      ytdlpAvailable = true;
      resolve(true);
      return;
    }

    // Kiểm tra OS để sử dụng lệnh phù hợp
    const isWindows = process.platform === 'win32';
    const command = isWindows ? 'where yt-dlp' : 'which yt-dlp';
    
    console.log(`Kiểm tra yt-dlp với lệnh: ${command} (platform: ${process.platform})`);
    exec(command, (error, stdout, stderr) => {
      if (error) {
        console.log(`Không tìm thấy yt-dlp trong PATH: ${error.message}`);
        // Thử một vị trí phổ biến khác trên Linux
        if (!isWindows) {
          const commonPaths = [
            '/usr/bin/yt-dlp',
            '/usr/local/bin/yt-dlp',
            '/opt/homebrew/bin/yt-dlp'
          ];
          
          for (const commonPath of commonPaths) {
            if (fs.existsSync(commonPath)) {
              ytdlpPath = commonPath;
              ytdlpAvailable = true;
              console.log('Đã tìm thấy yt-dlp tại vị trí phổ biến:', ytdlpPath);
              resolve(true);
              return;
            }
          }
        }
        
        ytdlpAvailable = false;
        resolve(false);
        return;
      }

      // Lấy đường dẫn đầu tiên tìm được
      const foundPath = stdout.trim().split('\n')[0];
      if (foundPath) {
        ytdlpPath = foundPath;
        console.log('Đã tìm thấy yt-dlp tại:', ytdlpPath);
        ytdlpAvailable = true;
        resolve(true);
      } else {
        console.log('Không tìm thấy yt-dlp trong PATH');
        ytdlpAvailable = false;
        resolve(false);
      }
    });
  });
};

// Khởi tạo - kiểm tra yt-dlp
checkYtDlp().catch(err => {
  console.error('Lỗi khi kiểm tra yt-dlp:', err);
  ytdlpAvailable = false;
});

/**
 * Lấy thông tin video YouTube từ oEmbed API
 * @param {string} videoId - ID của video YouTube
 * @returns {Object} Thông tin cơ bản về video
 */
const getBasicVideoInfo = async (videoId) => {
  return new Promise((resolve, reject) => {
    const url = `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`;
    
    https.get(url, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          if (res.statusCode !== 200) {
            return reject(new Error(`HTTP Error: ${res.statusCode}`));
          }
          
          const info = JSON.parse(data);
          resolve({
            title: info.title || 'Unknown Title',
            author: info.author_name || 'Unknown Author',
            url: `https://www.youtube.com/watch?v=${videoId}`,
            mimeType: 'audio/mp4',
            lengthSeconds: 0
          });
        } catch (error) {
          reject(error);
        }
      });
    }).on('error', (error) => {
      reject(error);
    });
  });
};

/**
 * Lấy thông tin video bằng yt-dlp
 * @param {string} videoId - ID của video YouTube 
 * @returns {Promise<Object>} Thông tin video
 */
const getYtDlpVideoInfo = async (videoId) => {
  return new Promise((resolve, reject) => {
    const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;
    
    // Tùy chọn mới: sử dụng --cookies-from-browser thay vì cookies.txt
    let command = `${ytdlpPath} -j`;
    
    // Tùy chọn mạnh nhất để vượt qua kiểm tra bot
    command += ` --extractor-args "youtube:player_client=android,web,tv" --skip-download --no-check-certificates`;
    command += ` --user-agent "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"`;
    command += ` --add-header "Accept: text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8"`;
    command += ` --add-header "Accept-Language: en-US,en;q=0.9"`;
    command += ` --add-header "Sec-Fetch-Mode: navigate"`;
    command += ` --add-header "Sec-Fetch-Dest: document"`;
    command += ` --add-header "Sec-Fetch-Site: none"`;
    
    // Kiểm tra nếu đang chạy trên môi trường local (development)
    const env = process.env.NODE_ENV || 'development';
    const isLocal = env === 'development';
    
    if (isLocal) {
      // Trên môi trường local, sử dụng --cookies-from-browser
      console.log('Môi trường development: sử dụng cookies-from-browser');
      
      // Xác định OS để chọn đúng trình duyệt
      const isWindows = process.platform === 'win32';
      const isMac = process.platform === 'darwin';
      
      if (isWindows) {
        // Thử Chrome, Edge, Firefox trên Windows
        command += ` --cookies-from-browser chrome`;
      } else if (isMac) {
        // Thử Safari, Chrome, Firefox trên Mac
        command += ` --cookies-from-browser safari`;
      } else {
        // Trên Linux thử Firefox, Chrome
        command += ` --cookies-from-browser firefox`;
      }
    } else {
      // Trên môi trường production, vẫn thử dùng cookies.txt
      let cookiesPath = path.resolve(__dirname, '..', 'www.youtube.com_cookies.txt');
      if (!fs.existsSync(cookiesPath)) {
        cookiesPath = path.resolve(__dirname, '..', 'cookies.txt');
      }
      
      const hasCookies = fs.existsSync(cookiesPath);
      if (hasCookies) {
        console.log('Môi trường production: sử dụng cookies.txt tại:', cookiesPath);
        command += ` --cookies "${cookiesPath}"`;
      } else {
        console.log('Không tìm thấy file cookies, sử dụng headers để mô phỏng trình duyệt');
      }
    }
    
    // Thêm API innertube và URL video
    command += ` --extractor-args "youtube:api=innertube"`;
    command += ` ${videoUrl}`;
    
    console.log('Thực thi lệnh:', command);
    
    exec(command, { maxBuffer: 1024 * 1024 * 10 }, (error, stdout, stderr) => {
      if (error) {
        console.error('Lỗi khi lấy thông tin từ yt-dlp:', error);
        console.error('stderr:', stderr);
        
        // Thử lại với phương pháp khác nếu cần
        if (stderr && stderr.includes("Sign in to confirm you're not a bot")) {
          console.log('Đang thử lại với phương pháp thứ hai');
          
          // Thử với tùy chọn bỏ qua địa chỉ IP
          const secondCommand = `${ytdlpPath} -j --extractor-args "youtube:player_client=android" --extractor-args "youtube:api=innertube" --proxy "socks5://127.0.0.1:9150" --skip-download ${videoUrl}`;
          
          exec(secondCommand, { maxBuffer: 1024 * 1024 * 10 }, (secondError, secondStdout, secondStderr) => {
            if (secondError) {
              console.error('Lỗi khi thử phương pháp thứ hai:', secondError);
              
              // Thử phương pháp thứ ba - sử dụng URL nhúng thay vì URL trực tiếp
              console.log('Đang thử phương pháp thứ ba với URL nhúng');
              const embedCommand = `${ytdlpPath} -j --extractor-args "youtube:player_client=android" --skip-download "https://www.youtube.com/embed/${videoId}"`;
              
              exec(embedCommand, { maxBuffer: 1024 * 1024 * 10 }, (embedError, embedStdout, embedStderr) => {
                if (embedError) {
                  console.error('Lỗi khi thử phương pháp thứ ba:', embedError);
                  return reject(error); // Trả về lỗi ban đầu nếu cả ba phương pháp đều thất bại
                }
                
                try {
                  const videoInfo = JSON.parse(embedStdout);
                  processVideoInfo(videoInfo, resolve);
                } catch (parseError) {
                  console.error('Lỗi khi phân tích dữ liệu từ phương pháp embed:', parseError);
                  reject(parseError);
                }
              });
              return;
            }
            
            try {
              const videoInfo = JSON.parse(secondStdout);
              processVideoInfo(videoInfo, resolve);
            } catch (parseError) {
              console.error('Lỗi khi phân tích dữ liệu từ phương pháp thứ hai:', parseError);
              reject(parseError);
            }
          });
          return;
        }
        
        return reject(error);
      }
      
      try {
        const videoInfo = JSON.parse(stdout);
        processVideoInfo(videoInfo, resolve);
      } catch (parseError) {
        console.error('Lỗi khi phân tích dữ liệu từ yt-dlp:', parseError);
        reject(parseError);
      }
    });
  });
};

// Hàm xử lý thông tin video từ yt-dlp
const processVideoInfo = (videoInfo, resolve) => {
  // Tìm định dạng audio tốt nhất
  const audioFormats = videoInfo.formats.filter(format => 
    format.acodec && format.acodec !== 'none' && (!format.vcodec || format.vcodec === 'none')
  );
  
  let bestAudioFormat;
  if (audioFormats.length > 0) {
    // Sắp xếp theo chất lượng giảm dần
    bestAudioFormat = audioFormats.sort((a, b) => {
      const aQuality = a.abr || 0;
      const bQuality = b.abr || 0;
      return bQuality - aQuality;
    })[0];
  } else {
    // Nếu không tìm thấy định dạng audio, sử dụng định dạng đầu tiên
    bestAudioFormat = videoInfo.formats[0];
  }
  
  resolve({
    url: bestAudioFormat?.url || videoInfo.url,
    title: videoInfo.title,
    author: videoInfo.uploader || 'Unknown',
    lengthSeconds: videoInfo.duration || 0,
    mimeType: getMimeType(bestAudioFormat),
    contentLength: bestAudioFormat?.filesize || 0
  });
};

/**
 * Lấy thông tin video từ Invidious API (thay thế cho YouTube API để tránh giới hạn)
 * @param {string} videoId - ID của video YouTube
 * @returns {Promise<Object>} Thông tin video
 */
const getInvidiousVideoInfo = async (videoId) => {
  return new Promise((resolve, reject) => {
    // Danh sách các API Invidious công khai
    const invidiousInstances = [
      'https://invidious.snopyta.org',
      'https://yewtu.be',
      'https://invidious.kavin.rocks',
      'https://vid.puffyan.us',
      'https://invidious.namazso.eu',
      'https://inv.riverside.rocks'
    ];
    
    // Chọn ngẫu nhiên một instance để cân bằng tải
    const randomInstance = invidiousInstances[Math.floor(Math.random() * invidiousInstances.length)];
    const url = `${randomInstance}/api/v1/videos/${videoId}`;
    
    console.log(`Đang lấy thông tin từ Invidious API: ${url}`);
    
    https.get(url, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          if (res.statusCode !== 200) {
            return reject(new Error(`HTTP Error: ${res.statusCode}`));
          }
          
          const info = JSON.parse(data);
          
          // Tìm định dạng audio tốt nhất
          let bestAudioFormat = null;
          if (info.adaptiveFormats) {
            const audioFormats = info.adaptiveFormats.filter(format => 
              format.type && format.type.includes('audio')
            );
            
            if (audioFormats.length > 0) {
              // Sắp xếp theo chất lượng
              bestAudioFormat = audioFormats.sort((a, b) => b.bitrate - a.bitrate)[0];
            }
          }
          
          resolve({
            url: bestAudioFormat ? bestAudioFormat.url : null,
            title: info.title,
            author: info.author,
            lengthSeconds: info.lengthSeconds || 0,
            mimeType: bestAudioFormat ? bestAudioFormat.type : 'audio/mp4',
            contentLength: bestAudioFormat ? bestAudioFormat.contentLength : 0
          });
        } catch (error) {
          reject(error);
        }
      });
    }).on('error', (error) => {
      reject(error);
    });
  });
};

/**
 * Lấy thông tin video YouTube
 * @param {string} videoId - ID của video YouTube
 * @returns {Object} Thông tin video
 */
const getVideoInfo = async (videoId) => {
  try {
    if (!videoId) {
      throw new Error('ID video không hợp lệ');
    }
    
    const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;
    console.log('Đang lấy thông tin video từ dịch vụ trực tiếp:', videoUrl);
    
    // Nếu yt-dlp khả dụng, sử dụng nó
    if (ytdlpAvailable) {
      try {
        console.log('Đang lấy thông tin video từ yt-dlp:', videoUrl);
        // Lấy thông tin từ yt-dlp
        return await getYtDlpVideoInfo(videoId);
      } catch (ytdlpError) {
        console.error('Lỗi khi lấy thông tin video từ yt-dlp:', ytdlpError);
        
        // Thử sử dụng Invidious API khi yt-dlp thất bại
        try {
          console.log('Thử sử dụng Invidious API sau khi yt-dlp thất bại');
          return await getInvidiousVideoInfo(videoId);
        } catch (invidiousError) {
          console.error('Lỗi khi sử dụng Invidious API:', invidiousError);
          // Cuối cùng thử phương pháp cuối cùng
          return await getBasicVideoInfo(videoId);
        }
      }
    } else {
      // Thử sử dụng Invidious API 
      try {
        console.log('yt-dlp không khả dụng, thử sử dụng Invidious API');
        return await getInvidiousVideoInfo(videoId);
      } catch (invidiousError) {
        console.error('Lỗi khi sử dụng Invidious API:', invidiousError);
        // Nếu yt-dlp không khả dụng, sử dụng oEmbed API
        return await getBasicVideoInfo(videoId);
      }
    }
  } catch (error) {
    console.error('Lỗi khi lấy thông tin video:', error);
    throw error;
  }
};

/**
 * Xác định MIME type dựa trên định dạng
 * @param {Object} format - Định dạng từ yt-dlp
 * @returns {string} MIME type
 */
const getMimeType = (format) => {
  if (!format) return 'audio/mp4';
  
  const ext = format.ext || '';
  
  switch (ext.toLowerCase()) {
    case 'mp3':
      return 'audio/mpeg';
    case 'm4a':
      return 'audio/mp4';
    case 'opus':
      return 'audio/opus';
    case 'ogg':
      return 'audio/ogg';
    case 'webm':
      return 'audio/webm';
    default:
      return 'audio/mp4';
  }
};

/**
 * Tạo stream từ URL
 * @param {string} url - URL để stream
 * @returns {ReadableStream} Stream data
 */
const createStreamFromUrl = (url) => {
  return new Promise((resolve, reject) => {
    const passThrough = new PassThrough();
    
    // Xác định đúng module http/https để sử dụng
    const httpModule = url.startsWith('https:') ? https : http;
    
    httpModule.get(url, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        // Xử lý chuyển hướng
        return createStreamFromUrl(res.headers.location)
          .then(stream => resolve(stream))
          .catch(err => reject(err));
      }
      
      if (res.statusCode !== 200) {
        return reject(new Error(`HTTP Error: ${res.statusCode}`));
      }
      
      res.pipe(passThrough);
      
      res.on('error', (error) => {
        passThrough.emit('error', error);
      });
      
    }).on('error', (error) => {
      reject(error);
    });
    
    resolve(passThrough);
  });
};

/**
 * Tạo stream audio bằng yt-dlp
 * @param {string} videoId - ID của video YouTube
 * @returns {Promise<ReadableStream>} Stream audio
 */
const createYtDlpStream = async (videoId) => {
  const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;
  console.log('Đang tạo stream audio từ yt-dlp:', videoUrl);
  
  const passThrough = new PassThrough();
  
  try {
    // Tùy chọn yt-dlp được tối ưu cho streaming
    const ytDlpArgs = [
      '-f', 'bestaudio/best',
      '--no-part',
      '--no-progress',
      '--no-playlist',
      '--quiet',
      // Tùy chọn vượt qua kiểm tra bot mạnh hơn
      '--extractor-args', 'youtube:player_client=android,web,tv',
      '--no-check-certificates',
      // Bổ sung thêm tùy chọn innertube API
      '--extractor-args', 'youtube:api=innertube'
    ];
    
    // Header để mô phỏng trình duyệt
    ytDlpArgs.push('--user-agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
    ytDlpArgs.push('--add-header', 'Accept: text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8');
    ytDlpArgs.push('--add-header', 'Accept-Language: en-US,en;q=0.9');
    ytDlpArgs.push('--add-header', 'Sec-Fetch-Mode: navigate');
    ytDlpArgs.push('--add-header', 'Sec-Fetch-Dest: document');
    ytDlpArgs.push('--add-header', 'Sec-Fetch-Site: none');
    
    // Kiểm tra nếu đang chạy trên môi trường local (development)
    const env = process.env.NODE_ENV || 'development';
    const isLocal = env === 'development';
    
    if (isLocal) {
      // Trên môi trường local, sử dụng --cookies-from-browser
      console.log('Môi trường development: sử dụng cookies-from-browser');
      
      // Xác định OS để chọn đúng trình duyệt
      const isWindows = process.platform === 'win32';
      const isMac = process.platform === 'darwin';
      
      if (isWindows) {
        // Thử Chrome, Edge, Firefox trên Windows
        ytDlpArgs.push('--cookies-from-browser', 'chrome');
      } else if (isMac) {
        // Thử Safari, Chrome, Firefox trên Mac
        ytDlpArgs.push('--cookies-from-browser', 'safari');
      } else {
        // Trên Linux thử Firefox, Chrome
        ytDlpArgs.push('--cookies-from-browser', 'firefox');
      }
    } else {
      // Trên môi trường production, vẫn thử dùng cookies.txt
      let cookiesPath = path.resolve(__dirname, '..', 'www.youtube.com_cookies.txt');
      if (!fs.existsSync(cookiesPath)) {
        cookiesPath = path.resolve(__dirname, '..', 'cookies.txt');
      }
      
      const hasCookies = fs.existsSync(cookiesPath);
      if (hasCookies) {
        console.log('Sử dụng cookies từ:', cookiesPath);
        ytDlpArgs.push('--cookies', cookiesPath);
      } else {
        console.log('Không tìm thấy cookies.txt');
      }
    }
    
    // Thêm các tùy chọn cuối cùng
    ytDlpArgs.push('-o', '-', videoUrl);
    
    console.log('Lệnh yt-dlp:', ytdlpPath, ytDlpArgs.join(' '));
    
    // Chạy yt-dlp với các tùy chọn đã cấu hình
    const ytDlpProcess = spawn(ytdlpPath, ytDlpArgs);
    
    ytDlpProcess.stdout.pipe(passThrough);
    
    ytDlpProcess.stderr.on('data', (data) => {
      const errorMsg = data.toString();
      console.error('yt-dlp stderr:', errorMsg);
      
      // Không cần xử lý ở đây, sẽ được xử lý trong sự kiện 'close'
    });
    
    ytDlpProcess.on('error', (error) => {
      console.error('Lỗi khi chạy yt-dlp:', error);
      passThrough.emit('error', error);
    });
    
    ytDlpProcess.on('close', async (code) => {
      if (code !== 0) {
        console.log(`yt-dlp process exited with code ${code}`);
        
        // Thử phương pháp thay thế - dùng URL nhúng
        try {
          console.log('Thử lại với URL nhúng');
          const embedArgs = [...ytDlpArgs];
          // Thay thế URL cuối cùng
          embedArgs[embedArgs.length - 1] = `https://www.youtube.com/embed/${videoId}`;
          
          const embedProcess = spawn(ytdlpPath, embedArgs);
          embedProcess.stdout.pipe(passThrough);
          
          embedProcess.stderr.on('data', (data) => {
            console.error('Embed yt-dlp stderr:', data.toString());
          });
          
          embedProcess.on('error', async (embedError) => {
            console.error('Lỗi khi chạy embed yt-dlp:', embedError);
            
            // Nếu vẫn thất bại, thử các phương pháp khác
            try {
              console.log('Thử sử dụng Invidious API');
              const invidiousStream = await createInvidiousStream(videoId);
              invidiousStream.pipe(passThrough);
            } catch (invidiousError) {
              console.error('Lỗi khi tạo stream từ Invidious:', invidiousError);
              
              try {
                console.log('Thử sử dụng Piped API');
                const pipedStream = await createPipedStream(videoId);
                pipedStream.pipe(passThrough);
              } catch (pipedError) {
                console.error('Lỗi khi tạo stream từ Piped API:', pipedError);
                
                if (!passThrough.destroyed) {
                  passThrough.emit('error', new Error(`Không thể tạo stream audio từ bất kỳ nguồn nào`));
                }
              }
            }
          });
          
          embedProcess.on('close', async (embedCode) => {
            if (embedCode !== 0) {
              // Nếu vẫn thất bại, thử các phương pháp khác
              try {
                console.log('Thử sử dụng Invidious API');
                const invidiousStream = await createInvidiousStream(videoId);
                invidiousStream.pipe(passThrough);
              } catch (invidiousError) {
                console.error('Lỗi khi tạo stream từ Invidious:', invidiousError);
                
                try {
                  console.log('Thử sử dụng Piped API');
                  const pipedStream = await createPipedStream(videoId);
                  pipedStream.pipe(passThrough);
                } catch (pipedError) {
                  console.error('Lỗi khi tạo stream từ Piped API:', pipedError);
                  
                  if (!passThrough.destroyed) {
                    passThrough.emit('error', new Error(`Không thể tạo stream audio từ bất kỳ nguồn nào`));
                  }
                }
              }
            }
          });
          
          return;
        } catch (embedError) {
          console.error('Lỗi khi tạo stream với URL nhúng:', embedError);
          
          // Nếu thất bại, thử lại với các phương pháp khác
          try {
            console.log('Thử sử dụng Invidious API sau khi yt-dlp thất bại');
            const invidiousStream = await createInvidiousStream(videoId);
            invidiousStream.pipe(passThrough);
          } catch (invidiousError) {
            console.error('Lỗi khi tạo stream từ Invidious:', invidiousError);
            
            try {
              console.log('Thử sử dụng Piped API sau khi Invidious thất bại');
              const pipedStream = await createPipedStream(videoId);
              pipedStream.pipe(passThrough);
            } catch (pipedError) {
              console.error('Lỗi khi tạo stream từ Piped API:', pipedError);
              
              if (!passThrough.destroyed) {
                passThrough.emit('error', new Error(`Không thể tạo stream audio từ bất kỳ nguồn nào`));
              }
            }
          }
        }
      } else {
        console.log('yt-dlp stream kết thúc thành công');
        if (!passThrough.destroyed) {
          passThrough.end();
        }
      }
    });
    
    // Đảm bảo tắt yt-dlp process khi stream bị hủy
    passThrough.on('close', () => {
      if (ytDlpProcess && !ytDlpProcess.killed) {
        ytDlpProcess.kill();
      }
    });
    
    return passThrough;
  } catch (error) {
    console.error('Lỗi khi tạo stream với yt-dlp:', error);
    passThrough.emit('error', error);
    return passThrough;
  }
};

/**
 * Tạo stream audio từ Invidious
 * @param {string} videoId - ID video YouTube
 * @returns {Promise<ReadableStream>} Stream audio
 */
const createInvidiousStream = async (videoId) => {
  try {
    console.log(`Đang tạo stream qua Invidious API cho video ID: ${videoId}`);
    
    // Lấy thông tin từ Invidious
    const info = await getInvidiousVideoInfo(videoId);
    
    if (!info || !info.url) {
      throw new Error('Không tìm thấy URL audio từ Invidious');
    }
    
    console.log(`Đã tìm thấy URL audio từ Invidious: ${info.url.substring(0, 50)}...`);
    return await createStreamFromUrl(info.url);
  } catch (error) {
    console.error('Lỗi khi tạo stream từ Invidious:', error);
    throw error;
  }
};

/**
 * Tạo stream audio từ Piped API
 * @param {string} videoId - ID video YouTube
 * @returns {Promise<ReadableStream>} Stream audio
 */
const createPipedStream = async (videoId) => {
  try {
    console.log(`Đang tạo stream qua Piped API cho video ID: ${videoId}`);
    
    const pipedUrl = `https://pipedapi.kavin.rocks/streams/${videoId}`;
    console.log(`Đang yêu cầu từ Piped API: ${pipedUrl}`);
    
    const response = await new Promise((resolve, reject) => {
      https.get(pipedUrl, (res) => {
        let data = '';
        
        res.on('data', (chunk) => {
          data += chunk;
        });
        
        res.on('end', () => {
          try {
            if (res.statusCode !== 200) {
              return reject(new Error(`HTTP Error: ${res.statusCode}`));
            }
            resolve(JSON.parse(data));
          } catch (error) {
            reject(error);
          }
        });
      }).on('error', (error) => {
        reject(error);
      });
    });
    
    if (!response || !response.audioStreams || response.audioStreams.length === 0) {
      throw new Error('Không tìm thấy stream audio từ Piped API');
    }
    
    // Lấy stream audio chất lượng tốt nhất
    const bestAudio = response.audioStreams.sort((a, b) => b.bitrate - a.bitrate)[0];
    console.log(`Đã tìm thấy URL audio từ Piped: ${bestAudio.url.substring(0, 50)}...`);
    
    return await createStreamFromUrl(bestAudio.url);
  } catch (error) {
    console.error('Lỗi khi tạo stream từ Piped API:', error);
    throw error;
  }
};

/**
 * Tạo stream audio từ video YouTube
 * @param {string} videoId - ID của video YouTube
 * @returns {Promise<ReadableStream>} Stream audio
 */
const createAudioStream = async (videoId) => {
  try {
    if (!videoId) {
      throw new Error('ID video không hợp lệ');
    }
    
    console.log('Đang tạo stream audio từ phương pháp trực tiếp, videoId:', videoId);
    
    // Kiểm tra lại yt-dlp nếu chưa tìm thấy
    if (!ytdlpAvailable) {
      await checkYtDlp();
    }
    
    const env = process.env.NODE_ENV || 'development';
    
    // Trong môi trường production (Render.com), ưu tiên yt-dlp
    if (env === 'production') {
      console.log('Môi trường production: Ưu tiên yt-dlp cho stream');
      
      // Kiểm tra cookies
      let cookiesPath = path.resolve(__dirname, '..', 'www.youtube.com_cookies.txt');
      if (!fs.existsSync(cookiesPath)) {
        cookiesPath = path.resolve(__dirname, '..', 'cookies.txt');
      }
      const hasCookies = fs.existsSync(cookiesPath);
      
      if (ytdlpAvailable && hasCookies) {
        try {
          console.log('Sử dụng yt-dlp với cookies để stream');
          return await createYtDlpStream(videoId);
        } catch (ytdlpError) {
          console.error('Lỗi khi tạo stream từ yt-dlp:', ytdlpError);
          // Tiếp tục với các phương pháp khác
        }
      }
      
      // Thử Invidious nếu yt-dlp thất bại
      try {
        console.log('Thử sử dụng Invidious API');
        return await createInvidiousStream(videoId);
      } catch (invidiousError) {
        console.error('Lỗi khi tạo stream từ Invidious:', invidiousError);
        
        // Thử Piped API
        try {
          console.log('Thử sử dụng Piped API');
          return await createPipedStream(videoId);
        } catch (pipedError) {
          console.error('Lỗi khi tạo stream từ Piped API:', pipedError);
          
          // Phương án cuối cùng
          const info = await getBasicVideoInfo(videoId);
          if (info && info.url) {
            return await createStreamFromUrl(info.url);
          }
          throw new Error('Không thể tạo stream audio bằng bất kỳ phương pháp nào');
        }
      }
    }
    
    // Trong môi trường development, ưu tiên yt-dlp
    // Nếu yt-dlp khả dụng, sử dụng nó
    if (ytdlpAvailable) {
      try {
        return await createYtDlpStream(videoId);
      } catch (ytdlpError) {
        console.error('Lỗi khi tạo stream từ yt-dlp, thử phương pháp thay thế:', ytdlpError);
        
        // Thử dùng Invidious
        try {
          return await createInvidiousStream(videoId);
        } catch (invidiousError) {
          console.error('Lỗi khi tạo stream từ Invidious:', invidiousError);
          
          // Thử phương pháp cuối cùng
          const info = await getVideoInfo(videoId);
          if (info && info.url) {
            return await createStreamFromUrl(info.url);
          }
          throw new Error('Không thể lấy URL stream');
        }
      }
    } else {
      // Phương pháp thay thế nếu không có yt-dlp
      console.log('yt-dlp không khả dụng, thử phương pháp thay thế');
      
      // Thử dùng Invidious
      try {
        return await createInvidiousStream(videoId);
      } catch (invidiousError) {
        console.error('Lỗi khi tạo stream từ Invidious:', invidiousError);
        
        // Thử dùng Piped
        try {
          console.log('Đang tạo stream qua Piped API');
          return await createStreamFromUrl(`https://pipedapi.kavin.rocks/streams/${videoId}`);
        } catch (pipedError) {
          console.error('Lỗi khi tạo stream qua Piped API:', pipedError);
          
          // Thử lấy thông tin video trực tiếp
          const info = await getBasicVideoInfo(videoId);
          
          if (info && info.url) {
            console.log('Thử tạo stream trực tiếp từ URL');
            return await createStreamFromUrl(info.url);
          }
          
          throw new Error('Không thể tạo stream audio bằng bất kỳ phương pháp nào');
        }
      }
    }
  } catch (error) {
    console.error('Lỗi khi tạo audio stream:', error);
    throw error;
  }
};

module.exports = {
  getVideoInfo,
  createAudioStream
}; 