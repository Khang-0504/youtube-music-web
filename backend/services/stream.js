const ytdl = require('ytdl-core');

/**
 * Lấy thông tin stream audio từ video YouTube
 * @param {string} videoId - ID của video YouTube
 * @returns {Object} Thông tin audio stream
 */
const getAudioInfo = async (videoId) => {
  try {
    const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;
    
    try {
      // Lấy thông tin video với options pour contourner le problème
      const info = await ytdl.getInfo(videoUrl, {
        requestOptions: {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            'Accept-Language': 'en-US,en;q=0.9'
          }
        }
      });
      
      // Lọc ra định dạng audio có chất lượng tốt nhất
      const audioFormats = ytdl.filterFormats(info.formats, 'audioonly');
      const bestAudioFormat = audioFormats[0];
      
      if (!bestAudioFormat) {
        throw new Error('Không tìm thấy định dạng audio cho video này');
      }
      
      return {
        url: bestAudioFormat.url,
        title: info.videoDetails.title,
        author: info.videoDetails.author.name,
        lengthSeconds: parseInt(info.videoDetails.lengthSeconds),
        mimeType: bestAudioFormat.mimeType,
        contentLength: bestAudioFormat.contentLength
      };
    } catch (error) {
      // Kiểm tra lỗi 410 (Gone) hoặc 429 (Too Many Requests)
      const errorMessage = error.message || '';
      if (errorMessage.includes('410') || errorMessage.includes('Status code: 410') || 
          errorMessage.includes('Gone')) {
        console.log('Lỗi với ytdl-core: Status code: 410');
        throw new Error('Status code: 410');
      }
      
      if (errorMessage.includes('429') || errorMessage.includes('Status code: 429') || 
          errorMessage.includes('Too Many Requests')) {
        console.log('Lỗi với ytdl-core: Status code: 429');
        throw new Error('Status code: 429');
      }
      
      throw error;
    }
  } catch (error) {
    console.error('Lỗi khi lấy thông tin audio:', error);
    throw error;
  }
};

/**
 * Tạo stream audio từ video YouTube
 * @param {string} videoId - ID của video YouTube
 * @returns {ReadableStream} Stream audio
 */
const createAudioStream = (videoId) => {
  try {
    const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;
    
    // Tạo stream với các tùy chọn tối ưu cho âm thanh và contourner le problème
    const stream = ytdl(videoUrl, {
      filter: 'audioonly',
      quality: 'highestaudio',
      highWaterMark: 1 << 25, // ~32MB
      requestOptions: {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
          'Accept-Language': 'en-US,en;q=0.9'
        }
      }
    });
    
    // Xử lý lỗi stream
    stream.on('error', (error) => {
      console.error('Lỗi stream ytdl-core:', error.message);
    });
    
    return stream;
  } catch (error) {
    console.error('Lỗi khi tạo audio stream:', error);
    throw error;
  }
};

module.exports = {
  getAudioInfo,
  createAudioStream
}; 