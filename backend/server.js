const express = require('express');
const cors = require('cors');
const config = require('./config');
const searchRoutes = require('./routes/search');
const streamRoutes = require('./routes/stream');
const path = require('path');
const fs = require('fs');
const { searchHandler } = require('./handlers/search');
const { streamHandler } = require('./handlers/stream');
const { infoHandler } = require('./handlers/info');
const { getPlaylistHandler } = require('./handlers/playlist');
const { checkHealth } = require('./services/health_check');

const app = express();
const PORT = process.env.PORT || 10000;
const HOST = process.env.HOST || 'localhost';

// Middleware
app.use(cors({
  origin: config.corsOrigin,
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// Kiểm tra môi trường
const env = process.env.NODE_ENV || 'development';
console.log('Môi trường:', env);

// Debug route để kiểm tra môi trường
app.get('/debug', (req, res) => {
  res.json({
    environment: process.env.NODE_ENV,
    config: {
      port: config.port,
      host: config.host,
      corsOrigin: config.corsOrigin
    },
    directories: {
      current: __dirname,
      publicExists: fs.existsSync(path.join(__dirname, 'public')),
      publicFiles: fs.existsSync(path.join(__dirname, 'public')) 
        ? fs.readdirSync(path.join(__dirname, 'public')).slice(0, 10) // Chỉ hiển thị 10 file đầu tiên
        : [],
      frontendBuildExists: fs.existsSync(path.join(__dirname, '..', 'frontend', 'build')),
      frontendBuildFiles: fs.existsSync(path.join(__dirname, '..', 'frontend', 'build'))
        ? fs.readdirSync(path.join(__dirname, '..', 'frontend', 'build')).slice(0, 10)
        : []
    }
  });
});

// API Routes
app.use('/api/search', searchRoutes);
app.use('/api/stream', streamRoutes);
app.get('/api/search', searchHandler);
app.get('/api/stream/:videoId', streamHandler);
app.get('/api/info/:videoId', infoHandler);
app.get('/api/playlist/:playlistId', getPlaylistHandler);

// Health check endpoint for Render.com
app.get('/health', async (req, res) => {
  try {
    const healthData = await checkHealth();
    
    // Nếu có lỗi nghiêm trọng, trả về mã 500
    if (healthData.status === 'error') {
      return res.status(500).json(healthData);
    }
    
    res.json(healthData);
  } catch (error) {
    res.status(500).json({
      status: 'error',
      timestamp: new Date().toISOString(),
      error: error.message
    });
  }
});

// Serve static files from the 'public' directory
const publicPath = path.join(__dirname, 'public');
console.log('Phục vụ tệp frontend từ:', publicPath);
app.use(express.static(publicPath));

// The "catchall" handler: for any request that doesn't
// match one above, send back React's index.html file.
app.get('*', (req, res) => {
  res.sendFile(path.join(publicPath, 'index.html'));
});

// Error handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    error: 'Đã xảy ra lỗi trên máy chủ',
    message: err.message
  });
});

// Start the server
app.listen(PORT, HOST, () => {
  console.log(`Server đang chạy tại http://${HOST}:${PORT}`);
}); 