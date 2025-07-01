const play = require('play-dl');

/**
 * Lấy thông tin stream audio từ video YouTube
 * @param {string} videoId - ID của video YouTube
 * @returns {Object} Thông tin audio stream
 */
const getAudioInfo = async (videoId) => {
  try {
    if (!videoId) {
      throw new Error('ID video không hợp lệ');
    }
    
    const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;
    console.log('Đang lấy thông tin từ URL:', videoUrl);
    
    // Lưu URL trực tiếp vào cache
    directUrls[videoId] = videoUrl;
    
    try {
      // Lấy thông tin video
      const info = await play.video_info(videoUrl);
      const videoDetails = info.video_details;
      
      if (!videoDetails) {
        throw new Error('Không thể lấy thông tin chi tiết video');
      }
      
      // Lưu trữ thông tin video để sử dụng sau này
      videoInfoCache[videoId] = info;
      
      // Lấy formats
      const formats = info.format;
      if (!formats || formats.length === 0) {
        throw new Error('Không tìm thấy định dạng cho video này');
      }
      
      // Lọc ra định dạng audio
      const audioFormats = formats.filter(format => 
        format.mimeType && format.mimeType.includes('audio')
      );
      
      if (audioFormats.length === 0) {
        // Nếu không tìm thấy định dạng audio, thử lấy bất kỳ định dạng nào
        console.log('Không tìm thấy định dạng audio, sử dụng định dạng đầu tiên');
        const bestAudioFormat = formats[0];
        
        return {
          url: bestAudioFormat.url,
          title: videoDetails.title || 'Unknown Title',
          author: videoDetails.channel?.name || 'Unknown Author',
          lengthSeconds: videoDetails.durationInSec || 0,
          mimeType: bestAudioFormat.mimeType || 'audio/mp4',
          contentLength: bestAudioFormat.contentLength || 0
        };
      }
      
      const bestAudioFormat = audioFormats[0];
      
      return {
        url: bestAudioFormat.url,
        title: videoDetails.title || 'Unknown Title',
        author: videoDetails.channel?.name || 'Unknown Author',
        lengthSeconds: videoDetails.durationInSec || 0,
        mimeType: bestAudioFormat.mimeType || 'audio/mp4',
        contentLength: bestAudioFormat.contentLength || 0
      };
    } catch (error) {
      // Kiểm tra lỗi 429 (Too Many Requests) và chuyển hướng sang direct_stream
      if (error.message.includes('429') || error.message.includes('Too Many Requests')) {
        console.log('Phát hiện lỗi 429, chuyển hướng sang direct_stream');
        throw new Error('REDIRECT_TO_DIRECT_STREAM');
      }
      // Kiểm tra lỗi 410 (Gone) và chuyển hướng sang direct_stream
      if (error.message.includes('410') || error.message.includes('Gone')) {
        console.log('Phát hiện lỗi 410, chuyển hướng sang direct_stream');
        throw new Error('REDIRECT_TO_DIRECT_STREAM');
      }
      throw error;
    }
  } catch (error) {
    // Kiểm tra nếu là lỗi chuyển hướng đặc biệt
    if (error.message === 'REDIRECT_TO_DIRECT_STREAM') {
      throw error;
    }
    console.error('Lỗi khi lấy thông tin audio:', error);
    throw error;
  }
};

// Cache để lưu trữ thông tin video
const videoInfoCache = {};
// Cache để lưu trữ URL trực tiếp
const directUrls = {};

/**
 * Tạo stream audio từ video YouTube
 * @param {string} videoId - ID của video YouTube
 * @returns {ReadableStream} Stream audio
 */
const createAudioStream = async (videoId) => {
  try {
    if (!videoId) {
      throw new Error('ID video không hợp lệ');
    }
    
    // Lấy URL từ cache nếu có
    const videoUrl = directUrls[videoId] || `https://www.youtube.com/watch?v=${videoId}`;
    console.log('Đang tạo stream từ URL:', videoUrl);
    
    try {
      // Phương pháp 1: Sử dụng stream trực tiếp
      console.log('Thử phương pháp 1: stream trực tiếp');
      const streamResult = await play.stream(videoUrl);
      
      if (streamResult && streamResult.stream) {
        console.log('Phương pháp 1 thành công: stream trực tiếp');
        return streamResult.stream;
      } else {
        throw new Error('Không thể tạo stream');
      }
    } catch (streamError) {
      console.log('Phương pháp 1 thất bại:', streamError.message);
      
      // Kiểm tra lỗi 429 (Too Many Requests) và chuyển hướng sang direct_stream
      if (streamError.message.includes('429') || streamError.message.includes('Too Many Requests')) {
        console.log('Phát hiện lỗi 429, chuyển hướng sang direct_stream');
        throw new Error('REDIRECT_TO_DIRECT_STREAM');
      }
      // Kiểm tra lỗi 410 (Gone) và chuyển hướng sang direct_stream
      if (streamError.message.includes('410') || streamError.message.includes('Gone')) {
        console.log('Phát hiện lỗi 410, chuyển hướng sang direct_stream');
        throw new Error('REDIRECT_TO_DIRECT_STREAM');
      }
      
      try {
        // Phương pháp 2: Thử lấy thông tin trước, sau đó stream
        console.log('Thử phương pháp 2: lấy thông tin trước rồi stream');
        
        // Kiểm tra xem đã có thông tin trong cache chưa
        let info;
        if (videoInfoCache[videoId]) {
          console.log('Sử dụng thông tin video từ cache');
          info = videoInfoCache[videoId];
        } else {
          console.log('Lấy thông tin video mới');
          info = await play.video_info(videoUrl);
          videoInfoCache[videoId] = info;
        }
        
        // Tạo stream từ thông tin
        const audioFormats = info.format.filter(format => 
          format.mimeType && format.mimeType.includes('audio')
        );
        
        if (audioFormats.length > 0) {
          // Sử dụng direct URL từ format thay vì stream_from_info
          const audioFormat = audioFormats[0];
          if (audioFormat.url) {
            console.log('Đã tìm thấy URL audio trực tiếp, tạo stream từ URL');
            // Chuyển hướng sang direct_stream.js để xử lý
            throw new Error('REDIRECT_TO_DIRECT_STREAM');
          }
        }
        
        // Nếu không thể lấy URL trực tiếp, thử lại stream_from_info
        const streamResult = await play.stream_from_info(info);
        if (streamResult && streamResult.stream) {
          console.log('Phương pháp 2 thành công: stream_from_info');
          return streamResult.stream;
        }
        
        throw new Error('Không thể tạo stream từ thông tin');
      } catch (infoError) {
        console.log('Phương pháp 2 thất bại:', infoError.message);
        
        // Phương pháp 3: Chuyển hướng sang direct_stream.js
        console.log('Chuyển hướng sang direct_stream.js');
        throw new Error('REDIRECT_TO_DIRECT_STREAM');
      }
    }
  } catch (error) {
    // Nếu là chuyển hướng sang direct_stream, ném lỗi đặc biệt
    if (error.message === 'REDIRECT_TO_DIRECT_STREAM') {
      throw error;
    }
    
    console.error('Lỗi chi tiết khi tạo audio stream:', error);
    throw error;
  }
};

module.exports = {
  getAudioInfo,
  createAudioStream
}; 