const express = require('express');
const cors = require('cors');
const config = require('./config');
const searchRoutes = require('./routes/search');
const streamRoutes = require('./routes/stream');

const app = express();

// Middleware
app.use(cors({
  origin: config.corsOrigin,
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// Routes
app.use('/api/search', searchRoutes);
app.use('/api/stream', streamRoutes);

// Home route
app.get('/', (req, res) => {
  res.json({
    message: 'YouTube Music Web API',
    endpoints: {
      search: '/api/search?q=QUERY&apiKey=YOUR_API_KEY',
      stream: '/api/stream/VIDEO_ID'
    }
  });
});

// Serve static frontend files if they exist in the build directory
const path = require('path');
const frontendBuildPath = path.join(__dirname, '..', 'frontend', 'build');
try {
  if (require('fs').existsSync(frontendBuildPath)) {
    console.log('Phục vụ tệp frontend từ:', frontendBuildPath);
    app.use(express.static(frontendBuildPath));
    
    // Serve index.html for all other routes (for React router)
    app.get('*', (req, res) => {
      if (!req.path.startsWith('/api/')) {
        res.sendFile(path.join(frontendBuildPath, 'index.html'));
      }
    });
  }
} catch (error) {
  console.log('Không tìm thấy thư mục build frontend:', error.message);
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
}); 