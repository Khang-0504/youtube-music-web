/**
 * Dịch vụ kiểm tra sức khỏe của hệ thống
 * Sử dụng cho Render.com healthcheck
 */
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

/**
 * Kiểm tra sức khỏe của hệ thống
 * @returns {Promise<Object>} Thông tin trạng thái
 */
const checkHealth = async () => {
  const startTime = Date.now();
  const result = {
    status: 'ok',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || 'unknown',
    node_env: process.env.NODE_ENV || 'development',
    services: {
      yt_dlp: { status: 'unknown' },
      config: { status: 'unknown' },
      cookies: { status: 'unknown' },
      public_dir: { status: 'unknown' }
    }
  };

  // Kiểm tra yt-dlp
  try {
    const ytdlpPath = path.join(__dirname, '..', '..', 'bin', 'yt-dlp');
    const hasYtDlp = fs.existsSync(ytdlpPath);
    
    if (hasYtDlp) {
      result.services.yt_dlp.status = 'ok';
      result.services.yt_dlp.path = ytdlpPath;
      
      // Kiểm tra phiên bản yt-dlp
      await new Promise((resolve, reject) => {
        exec(`${ytdlpPath} --version`, (error, stdout, stderr) => {
          if (error) {
            result.services.yt_dlp.status = 'error';
            result.services.yt_dlp.error = error.message;
          } else {
            result.services.yt_dlp.version = stdout.trim();
          }
          resolve();
        });
      });
    } else {
      // Thử kiểm tra yt-dlp trong PATH
      await new Promise((resolve, reject) => {
        exec('which yt-dlp || where yt-dlp', (error, stdout, stderr) => {
          if (error) {
            result.services.yt_dlp.status = 'missing';
          } else {
            result.services.yt_dlp.status = 'ok';
            result.services.yt_dlp.path = stdout.trim();
          }
          resolve();
        });
      });
    }
  } catch (error) {
    result.services.yt_dlp.status = 'error';
    result.services.yt_dlp.error = error.message;
  }

  // Kiểm tra file cấu hình
  try {
    const configPath = path.join(__dirname, '..', 'config', 'yt-dlp.conf');
    const hasConfig = fs.existsSync(configPath);
    
    result.services.config.status = hasConfig ? 'ok' : 'missing';
    if (hasConfig) {
      result.services.config.path = configPath;
      
      // Kiểm tra nội dung file cấu hình
      const configContent = fs.readFileSync(configPath, 'utf8');
      result.services.config.fallback_only = configContent.includes('fallback_only=true');
      result.services.config.embed_url = configContent.includes('embed_url=true');
    }
  } catch (error) {
    result.services.config.status = 'error';
    result.services.config.error = error.message;
  }

  // Kiểm tra cookies
  try {
    const cookiesPath = path.join(__dirname, '..', 'cookies.txt');
    const hasCookies = fs.existsSync(cookiesPath);
    
    result.services.cookies.status = hasCookies ? 'ok' : 'missing';
    if (hasCookies) {
      result.services.cookies.path = cookiesPath;
      result.services.cookies.size = fs.statSync(cookiesPath).size;
      result.services.cookies.modified = fs.statSync(cookiesPath).mtime.toISOString();
    }
  } catch (error) {
    result.services.cookies.status = 'error';
    result.services.cookies.error = error.message;
  }

  // Kiểm tra thư mục public
  try {
    const publicPath = path.join(__dirname, '..', 'public');
    const hasPublic = fs.existsSync(publicPath);
    
    result.services.public_dir.status = hasPublic ? 'ok' : 'missing';
    if (hasPublic) {
      result.services.public_dir.path = publicPath;
      
      // Kiểm tra file index.html
      const indexPath = path.join(publicPath, 'index.html');
      const hasIndex = fs.existsSync(indexPath);
      
      result.services.public_dir.has_index = hasIndex;
      if (hasIndex) {
        result.services.public_dir.index_size = fs.statSync(indexPath).size;
        result.services.public_dir.index_modified = fs.statSync(indexPath).mtime.toISOString();
      }
    }
  } catch (error) {
    result.services.public_dir.status = 'error';
    result.services.public_dir.error = error.message;
  }

  // Kiểm tra tổng trạng thái
  const criticalServices = ['yt_dlp', 'public_dir'];
  const criticalFailures = criticalServices.filter(
    service => result.services[service].status !== 'ok'
  );

  if (criticalFailures.length > 0) {
    result.status = 'error';
    result.errors = criticalFailures.map(service => ({
      service,
      status: result.services[service].status,
      error: result.services[service].error
    }));
  }

  // Thời gian kiểm tra
  result.check_time_ms = Date.now() - startTime;

  return result;
};

module.exports = { checkHealth }; 