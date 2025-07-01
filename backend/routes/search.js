const express = require('express');
const { searchVideos } = require('../services/youtube');

const router = express.Router();

/**
 * @route   GET /api/search
 * @desc    Tìm kiếm video trên YouTube
 * @query   {string} q - Từ khóa tìm kiếm
 * @query   {string} apiKey - (Tùy chọn) API key YouTube
 * @query   {number} maxResults - (Tùy chọn) Số lượng kết quả tối đa
 * @access  Public
 */
router.get('/', async (req, res) => {
  try {
    const { q, apiKey, maxResults = 10 } = req.query;
    
    if (!q) {
      return res.status(400).json({
        error: 'Thiếu từ khóa tìm kiếm',
        message: 'Vui lòng cung cấp tham số q (từ khóa tìm kiếm)'
      });
    }
    
    const videos = await searchVideos(q, apiKey, parseInt(maxResults));
    
    res.json({
      query: q,
      results: videos,
      count: videos.length
    });
  } catch (error) {
    console.error('Lỗi khi tìm kiếm:', error);
    
    // Xử lý lỗi liên quan đến API YouTube
    if (error.code === 400) {
      return res.status(400).json({
        error: 'Lỗi yêu cầu',
        message: error.message
      });
    }
    
    if (error.code === 403) {
      return res.status(403).json({
        error: 'Lỗi xác thực API key',
        message: 'API key không hợp lệ hoặc đã hết hạn mức sử dụng'
      });
    }
    
    res.status(500).json({
      error: 'Lỗi máy chủ',
      message: 'Đã xảy ra lỗi khi tìm kiếm video'
    });
  }
});

module.exports = router; 