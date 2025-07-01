import React, { useState, useRef, useEffect } from 'react';
import { Container, Row, Col, ProgressBar } from 'react-bootstrap';
import { BsPlayFill, BsPauseFill, BsVolumeUpFill, BsVolumeMuteFill } from 'react-icons/bs';

const Player = ({ song }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  
  const audioRef = useRef(null);
  
  // Tự động phát khi song thay đổi
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.load();
      audioRef.current.play().catch(error => {
        console.error('Lỗi tự động phát:', error);
        setIsPlaying(false);
      });
    }
  }, [song]);
  
  // Cập nhật trạng thái khi audio thay đổi
  useEffect(() => {
    const audio = audioRef.current;
    
    const updateTime = () => {
      setCurrentTime(audio.currentTime);
    };
    
    const updateDuration = () => {
      setDuration(audio.duration);
      setIsPlaying(true);
    };
    
    const onEnd = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };
    
    const onPlay = () => {
      setIsPlaying(true);
    };
    
    const onPause = () => {
      setIsPlaying(false);
    };
    
    // Thêm event listeners
    audio.addEventListener('timeupdate', updateTime);
    audio.addEventListener('loadedmetadata', updateDuration);
    audio.addEventListener('ended', onEnd);
    audio.addEventListener('play', onPlay);
    audio.addEventListener('pause', onPause);
    
    // Cleanup khi unmount
    return () => {
      audio.removeEventListener('timeupdate', updateTime);
      audio.removeEventListener('loadedmetadata', updateDuration);
      audio.removeEventListener('ended', onEnd);
      audio.removeEventListener('play', onPlay);
      audio.removeEventListener('pause', onPause);
    };
  }, []);
  
  // Hàm xử lý play/pause
  const togglePlay = () => {
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play().catch(error => {
        console.error('Lỗi phát nhạc:', error);
      });
    }
    setIsPlaying(!isPlaying);
  };
  
  // Hàm xử lý mute/unmute
  const toggleMute = () => {
    audioRef.current.muted = !isMuted;
    setIsMuted(!isMuted);
  };
  
  // Hàm xử lý điều chỉnh âm lượng
  const handleVolumeChange = (e) => {
    const value = parseFloat(e.target.value);
    setVolume(value);
    audioRef.current.volume = value;
    setIsMuted(value === 0);
  };
  
  // Hàm xử lý tua tới một vị trí
  const handleSeek = (e) => {
    const seekTime = parseFloat(e.target.value);
    audioRef.current.currentTime = seekTime;
    setCurrentTime(seekTime);
  };
  
  // Format thời gian từ giây sang mm:ss
  const formatTime = (seconds) => {
    if (isNaN(seconds)) return '0:00';
    
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' + secs : secs}`;
  };
  
  return (
    <div className="player-container">
      <Container>
        <Row className="align-items-center">
          <Col xs={12} md={4} className="d-flex align-items-center mb-2 mb-md-0">
            <img 
              src={song.thumbnail}
              alt={song.title}
              style={{ width: '50px', height: '50px', objectFit: 'cover', borderRadius: '4px' }}
              className="me-2"
            />
            <div className="overflow-hidden">
              <div className="text-truncate" style={{ maxWidth: '100%' }}>{song.title}</div>
              <small className="text-muted">{song.channelTitle}</small>
            </div>
          </Col>
          
          <Col xs={12} md={8}>
            <div className="audio-controls">
              <button className="control-button" onClick={togglePlay}>
                {isPlaying ? <BsPauseFill /> : <BsPlayFill />}
              </button>
              
              <div className="progress-container">
                <div className="d-flex justify-content-between small mb-1">
                  <span>{formatTime(currentTime)}</span>
                  <span>{formatTime(duration)}</span>
                </div>
                <input
                  type="range"
                  className="form-range"
                  min="0"
                  max={duration || 0}
                  step="0.01"
                  value={currentTime}
                  onChange={handleSeek}
                />
              </div>
              
              <div className="d-flex align-items-center">
                <button className="control-button" onClick={toggleMute}>
                  {isMuted ? <BsVolumeMuteFill /> : <BsVolumeUpFill />}
                </button>
                <input
                  type="range"
                  className="form-range ms-2"
                  style={{ width: '80px' }}
                  min="0"
                  max="1"
                  step="0.01"
                  value={volume}
                  onChange={handleVolumeChange}
                />
              </div>
            </div>
          </Col>
        </Row>
      </Container>
      
      <audio 
        ref={audioRef} 
        style={{ display: 'none' }}
      >
        <source src={`/api/stream/${song.id}`} type="audio/mpeg" />
        Trình duyệt của bạn không hỗ trợ phát audio.
      </audio>
    </div>
  );
};

export default Player; 