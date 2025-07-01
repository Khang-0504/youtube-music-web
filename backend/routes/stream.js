const express = require('express');
const { getAudioInfo, createAudioStream } = require('../services/stream');
// Import alternative service pour le fallback
const alternativeService = require('../services/stream_alternative');
// Import yt-dlp service as last resort
const directService = require('../services/direct_stream');

const router = express.Router();

/**
 * @route   GET /api/stream/info/:videoId
 * @desc    Lấy thông tin audio stream
 * @param   {string} videoId - ID video YouTube
 * @access  Public
 */
router.get('/info/:videoId', async (req, res) => {
  try {
    const { videoId } = req.params;
    
    if (!videoId) {
      return res.status(400).json({
        error: 'Thiếu ID video',
        message: 'Vui lòng cung cấp ID video YouTube'
      });
    }
    
    // Trong môi trường production, ưu tiên yt-dlp ngay từ đầu
    if (process.env.NODE_ENV === 'production') {
      try {
        console.log('Môi trường production: Ưu tiên yt-dlp');
        const audioInfo = await directService.getVideoInfo(videoId);
        return res.json(audioInfo);
      } catch (ytdlpError) {
        console.error('Lỗi với yt-dlp, thử phương pháp khác:', ytdlpError.message);
        // Tiếp tục thử các phương pháp khác
      }
    }
    
    try {
      // Thử với ytdl-core
      const audioInfo = await getAudioInfo(videoId);
      return res.json(audioInfo);
    } catch (ytdlError) {
      console.log('Lỗi với ytdl-core, thử với play-dl:', ytdlError.message);
      try {
        // Thử với play-dl
        const audioInfo = await alternativeService.getAudioInfo(videoId);
        return res.json(audioInfo);
      } catch (playDlError) {
        console.error('Lỗi với play-dl, thử với yt-dlp:', playDlError.message);
        try {
          // Thử với yt-dlp
          const audioInfo = await directService.getVideoInfo(videoId);
          return res.json(audioInfo);
        } catch (ytdlpError) {
          console.error('Cả ba phương thức đều thất bại:', ytdlpError.message);
          throw new Error(`Không thể lấy thông tin audio: ${ytdlpError.message}`);
        }
      }
    }
  } catch (error) {
    console.error('Lỗi khi lấy thông tin audio:', error);
    
    if (error.message.includes('Video unavailable') || error.message.includes('Video không có sẵn')) {
      return res.status(404).json({
        error: 'Video không có sẵn',
        message: 'Video này không tồn tại hoặc đã bị xóa'
      });
    }
    
    if (error.message.includes('copyright') || error.message.includes('bản quyền')) {
      return res.status(403).json({
        error: 'Vấn đề bản quyền',
        message: 'Video này bị chặn vì vấn đề bản quyền'
      });
    }
    
    res.status(500).json({
      error: 'Lỗi máy chủ',
      message: 'Đã xảy ra lỗi khi lấy thông tin audio: ' + error.message
    });
  }
});

/**
 * @route   GET /api/stream/:videoId
 * @desc    Stream audio từ video YouTube
 * @param   {string} videoId - ID video YouTube
 * @access  Public
 */
router.get('/:videoId', async (req, res) => {
  try {
    const { videoId } = req.params;
    
    if (!videoId) {
      return res.status(400).json({
        error: 'Thiếu ID video',
        message: 'Vui lòng cung cấp ID video YouTube'
      });
    }
    
    // Giá trị mặc định
    let audioInfo = {
      mimeType: 'audio/mp4',
      contentLength: 0
    };
    let streamMethod = 'ytdl-core';
    
    // Trong môi trường production, ưu tiên yt-dlp ngay từ đầu
    if (process.env.NODE_ENV === 'production') {
      try {
        console.log('Môi trường production: Ưu tiên yt-dlp cho stream');
        audioInfo = await directService.getVideoInfo(videoId);
        console.log('Đã lấy thông tin audio bằng yt-dlp');
        streamMethod = 'yt-dlp';
      } catch (ytdlpError) {
        console.error('Lỗi với yt-dlp, thử phương pháp khác:', ytdlpError.message);
        // Tiếp tục thử các phương pháp khác
      }
    } else {
      // Thử lấy thông tin với các phương pháp khác nhau
      try {
        // Thử với ytdl-core
        audioInfo = await getAudioInfo(videoId);
        console.log('Đã lấy thông tin audio bằng ytdl-core');
        streamMethod = 'ytdl-core';
      } catch (ytdlError) {
        console.log('Lỗi với ytdl-core, thử với play-dl:', ytdlError.message);
        try {
          // Thử với play-dl
          audioInfo = await alternativeService.getAudioInfo(videoId);
          console.log('Đã lấy thông tin audio bằng play-dl');
          streamMethod = 'play-dl';
        } catch (playDlError) {
          console.log('Lỗi với play-dl, thử với yt-dlp:', playDlError.message);
          try {
            // Thử với yt-dlp
            audioInfo = await directService.getVideoInfo(videoId);
            console.log('Đã lấy thông tin audio bằng yt-dlp');
            streamMethod = 'yt-dlp';
          } catch (ytdlpError) {
            console.error('Cả ba phương thức đều thất bại khi lấy thông tin:', ytdlpError.message);
            // Sử dụng giá trị mặc định, và hy vọng streaming trực tiếp hoạt động
            streamMethod = 'yt-dlp-direct';
          }
        }
      }
    }
    
    if (!audioInfo || !audioInfo.mimeType) {
      audioInfo = {
        mimeType: 'audio/mp4',
        contentLength: 0
      };
    }
    
    // Thiết lập header phản hồi
    res.setHeader('Content-Type', audioInfo.mimeType.split(';')[0]);
    if (audioInfo.contentLength) {
      res.setHeader('Content-Length', audioInfo.contentLength);
    }
    res.setHeader('Accept-Ranges', 'bytes');
    
    // Tạo và pipe audio stream tới response
    let audioStream;
    
    try {
      console.log(`Đang tạo stream bằng phương thức: ${streamMethod}`);
      
      // Trong môi trường production, ưu tiên sử dụng yt-dlp
      if (process.env.NODE_ENV === 'production' && streamMethod !== 'yt-dlp' && streamMethod !== 'yt-dlp-direct') {
        try {
          console.log('Môi trường production: Chuyển sang yt-dlp cho stream');
          audioStream = await directService.createAudioStream(videoId);
        } catch (ytdlpStreamError) {
          console.log('Lỗi khi tạo stream với yt-dlp trong production, thử phương pháp thay thế:', ytdlpStreamError.message);
          // Tiếp tục với phương pháp ban đầu
        }
      }
      
      // Nếu chưa có stream từ yt-dlp trong production, tiếp tục với phương pháp đã chọn
      if (!audioStream) {
        switch(streamMethod) {
          case 'play-dl':
            try {
              audioStream = await alternativeService.createAudioStream(videoId);
            } catch (playDlStreamError) {
              // Kiểm tra lỗi chuyển hướng
              if (playDlStreamError.message === 'REDIRECT_TO_DIRECT_STREAM') {
                console.log('Được chuyển hướng từ play-dl sang yt-dlp');
                audioStream = await directService.createAudioStream(videoId);
              } else {
                throw playDlStreamError;
              }
            }
            break;
          case 'yt-dlp':
          case 'yt-dlp-direct':
            audioStream = await directService.createAudioStream(videoId);
            break;
          case 'ytdl-core':
          default:
            try {
              audioStream = createAudioStream(videoId);
            } catch (ytdlStreamError) {
              console.log('Lỗi khi tạo stream với ytdl-core, thử với play-dl:', ytdlStreamError.message);
              try {
                audioStream = await alternativeService.createAudioStream(videoId);
              } catch (playDlStreamError) {
                // Kiểm tra lỗi chuyển hướng
                if (playDlStreamError.message === 'REDIRECT_TO_DIRECT_STREAM') {
                  console.log('Được chuyển hướng từ play-dl sang yt-dlp');
                  audioStream = await directService.createAudioStream(videoId);
                } else {
                  console.log('Lỗi khi tạo stream với play-dl, thử với yt-dlp:', playDlStreamError.message);
                  audioStream = await directService.createAudioStream(videoId);
                }
              }
            }
            break;
        }
      }
      
      if (!audioStream) {
        throw new Error('Không thể tạo stream audio');
      }
      
      // Xử lý lỗi stream
      audioStream.on('error', (error) => {
        console.error('Lỗi stream:', error);
        if (!res.headersSent) {
          res.status(500).json({
            error: 'Lỗi stream',
            message: 'Đã xảy ra lỗi khi phát audio: ' + error.message
          });
        } else if (!res.finished) {
          res.end();
        }
      });
      
      // Stream audio
      audioStream.pipe(res);
      
      // Xử lý khi client ngắt kết nối
      req.on('close', () => {
        if (audioStream && audioStream.destroy && typeof audioStream.destroy === 'function') {
          audioStream.destroy();
        }
      });
      
    } catch (streamError) {
      console.error('Không thể tạo stream audio:', streamError);
      throw streamError;
    }
    
  } catch (error) {
    console.error('Lỗi khi stream audio:', error);
    
    if (!res.headersSent) {
      if (error.message.includes('Video unavailable') || error.message.includes('Video không có sẵn')) {
        return res.status(404).json({
          error: 'Video không có sẵn',
          message: 'Video này không tồn tại hoặc đã bị xóa'
        });
      }
      
      res.status(500).json({
        error: 'Lỗi máy chủ',
        message: 'Đã xảy ra lỗi khi stream audio: ' + error.message
      });
    }
  }
});

module.exports = router; 