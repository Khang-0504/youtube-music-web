import React, { useState, useEffect } from 'react';
import { Container } from 'react-bootstrap';
import Header from './components/Header';
import SearchBar from './components/SearchBar';
import SongList from './components/SongList';
import Player from './components/Player';
import ApiKeyModal from './components/ApiKeyModal';

function App() {
  const [songs, setSongs] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [currentSong, setCurrentSong] = useState(null);
  const [apiKey, setApiKey] = useState(localStorage.getItem('youtubeApiKey') || '');
  const [showApiKeyModal, setShowApiKeyModal] = useState(!localStorage.getItem('youtubeApiKey'));
  const [history, setHistory] = useState(
    JSON.parse(localStorage.getItem('songHistory') || '[]')
  );

  // Lưu API key vào localStorage khi thay đổi
  useEffect(() => {
    if (apiKey) {
      localStorage.setItem('youtubeApiKey', apiKey);
    }
  }, [apiKey]);

  // Lưu lịch sử phát nhạc vào localStorage khi thay đổi
  useEffect(() => {
    localStorage.setItem('songHistory', JSON.stringify(history));
  }, [history]);

  // Hàm tìm kiếm bài hát
  const searchSongs = async (query) => {
    if (!query) return;

    setLoading(true);
    setError(null);
    setSearchQuery(query);

    try {
      const params = new URLSearchParams({
        q: query
      });
      
      // Thêm API key vào tham số nếu có
      if (apiKey) {
        params.append('apiKey', apiKey);
      }
      
      const response = await fetch(`/api/search?${params.toString()}`);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Lỗi khi tìm kiếm bài hát');
      }
      
      setSongs(data.results || []);
    } catch (error) {
      console.error('Lỗi tìm kiếm:', error);
      setError(error.message);
      setSongs([]);
    } finally {
      setLoading(false);
    }
  };

  // Hàm phát bài hát
  const playSong = (song) => {
    setCurrentSong(song);
    
    // Thêm bài hát vào lịch sử
    const existingIndex = history.findIndex(item => item.id === song.id);
    
    if (existingIndex !== -1) {
      // Nếu bài hát đã có trong lịch sử, cập nhật timestamp
      const updatedHistory = [...history];
      updatedHistory[existingIndex] = {
        ...song,
        timestamp: new Date().toISOString()
      };
      setHistory(updatedHistory);
    } else {
      // Nếu bài hát chưa có trong lịch sử, thêm mới
      setHistory([
        {
          ...song,
          timestamp: new Date().toISOString()
        },
        ...history
      ].slice(0, 50)); // Giới hạn 50 bài hát trong lịch sử
    }
  };

  // Hàm lưu API key
  const saveApiKey = (key) => {
    setApiKey(key);
    setShowApiKeyModal(false);
  };

  return (
    <div className="app-container pb-5">
      <Header onShowApiKeyModal={() => setShowApiKeyModal(true)} />
      
      <Container className="search-container">
        <SearchBar onSearch={searchSongs} />
        
        {error && <div className="alert alert-danger mt-3">{error}</div>}
        
        <SongList 
          songs={songs} 
          loading={loading} 
          onSongSelect={playSong} 
          currentSong={currentSong}
          searchQuery={searchQuery}
        />
      </Container>
      
      {currentSong && <Player song={currentSong} />}
      
      <ApiKeyModal 
        show={showApiKeyModal} 
        onHide={() => setShowApiKeyModal(false)} 
        onSave={saveApiKey}
        apiKey={apiKey}
      />
    </div>
  );
}

export default App; 