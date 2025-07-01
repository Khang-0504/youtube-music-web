const ytdl = require('ytdl-core');

/**
 * Lấy thông tin stream audio từ video YouTube
 * @param {string} videoId - ID của video YouTube
 * @returns {Object} Thông tin audio stream
 */
const getAudioInfo = async (videoId) => {
  try {
    const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;
    
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