const { google } = require('googleapis');
const config = require('../config');

// Tạo YouTube API client
const createYoutubeClient = (apiKey) => {
  const key = apiKey || config.defaultYouTubeApiKey;
  return google.youtube({
    version: 'v3',
    auth: key
  });
};

// Tìm kiếm video trên YouTube
const searchVideos = async (query, apiKey, maxResults = 10) => {
  try {
    const youtube = createYoutubeClient(apiKey);
    
    // Thực hiện tìm kiếm
    const searchResponse = await youtube.search.list({
      part: 'id,snippet',
      q: query,
      maxResults,
      type: 'video',
      videoCategoryId: '10', // Danh mục Music
      videoEmbeddable: true
    });
    
    if (!searchResponse.data.items || searchResponse.data.items.length === 0) {
      return [];
    }
    
    // Lấy danh sách ID video để lấy thêm thông tin
    const videoIds = searchResponse.data.items.map(item => item.id.videoId);
    
    // Lấy thêm thông tin chi tiết của video (thời lượng, lượt xem)
    const videoResponse = await youtube.videos.list({
      part: 'contentDetails,statistics,snippet',
      id: videoIds.join(',')
    });
    
    // Kết hợp kết quả
    return videoResponse.data.items.map(video => {
      // Chuyển đổi thời lượng từ ISO 8601 sang định dạng dễ đọc
      const duration = video.contentDetails.duration
        .replace('PT', '')
        .replace('H', 'h ')
        .replace('M', 'm ')
        .replace('S', 's');
      
      return {
        id: video.id,
        title: video.snippet.title,
        thumbnail: video.snippet.thumbnails.high.url,
        channelTitle: video.snippet.channelTitle,
        duration,
        views: parseInt(video.statistics.viewCount || 0).toLocaleString(),
        url: `https://www.youtube.com/watch?v=${video.id}`
      };
    });
  } catch (error) {
    console.error('Lỗi khi tìm kiếm video:', error);
    throw error;
  }
};

module.exports = {
  searchVideos
}; 