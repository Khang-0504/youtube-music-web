const express = require('express');
const cors = require('cors');
const config = require('./config');
const searchRoutes = require('./routes/search');
const streamRoutes = require('./routes/stream');
const path = require('path');
const fs = require('fs');

const app = express();

// Middleware
app.use(cors({
  origin: config.corsOrigin,
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

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

// Serve static files from the 'public' directory
const publicPath = path.join(__dirname, 'public');
if (fs.existsSync(publicPath)) {
  console.log('Phục vụ tệp frontend từ:', publicPath);
  app.use(express.static(publicPath));
  
  // Serve index.html for all other routes (for React router)
  app.get('*', (req, res, next) => {
    // Skip API routes
    if (req.path.startsWith('/api/')) {
      return next();
    }
    res.sendFile(path.join(publicPath, 'index.html'));
  });
} else {
  console.log('Thư mục public không tồn tại:', publicPath);
  
  // Fallback: Try to serve from frontend/build if public doesn't exist
  const frontendBuildPath = path.join(__dirname, '..', 'frontend', 'build');
  if (fs.existsSync(frontendBuildPath)) {
    console.log('Phục vụ tệp frontend từ:', frontendBuildPath);
    app.use(express.static(frontendBuildPath));
    
    // Serve index.html for all other routes (for React router)
    app.get('*', (req, res, next) => {
      // Skip API routes
      if (req.path.startsWith('/api/')) {
        return next();
      }
      res.sendFile(path.join(frontendBuildPath, 'index.html'));
    });
  } else {
    console.log('Không tìm thấy thư mục build frontend:', frontendBuildPath);
    
    // Home route as fallback if no frontend files exist
    app.get('/', (req, res) => {
      res.json({
        message: 'YouTube Music Web API',
        endpoints: {
          search: '/api/search?q=QUERY&apiKey=YOUR_API_KEY',
          stream: '/api/stream/VIDEO_ID'
        }
      });
    });
  }
}

// Error handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    error: 'Đã xảy ra lỗi trên máy chủ',
    message: err.message
  });
});

// Start server
const PORT = config.port;
const HOST = config.host;
app.listen(PORT, HOST, () => {
  console.log(`Server đang chạy tại http://${HOST === '0.0.0.0' ? 'localhost' : HOST}:${PORT}`);
  console.log(`Môi trường: ${process.env.NODE_ENV || 'development'}`);
}); 