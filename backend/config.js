require('dotenv').config();

module.exports = {
  port: process.env.PORT || 5000,
  defaultYouTubeApiKey: process.env.DEFAULT_YOUTUBE_API_KEY || 'AIzaSyDRiA_cBa_B8pb0W9so02qmA6iVlInN2mQ',
  corsOrigin: process.env.CORS_ORIGIN || '*',
  host: process.env.HOST || '0.0.0.0'
}; 