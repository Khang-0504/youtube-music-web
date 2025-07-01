import React from 'react';
import { Row, Col, Card, Spinner } from 'react-bootstrap';
import { BsPlayCircleFill, BsMusicNoteList, BsClock, BsEye } from 'react-icons/bs';

const SongList = ({ songs, loading, onSongSelect, currentSong, searchQuery }) => {
  if (loading) {
    return (
      <div className="text-center my-5">
        <Spinner animation="border" role="status" variant="primary">
          <span className="visually-hidden">Đang tải...</span>
        </Spinner>
        <p className="mt-2">Đang tìm kiếm bài hát...</p>
      </div>
    );
  }

  if (songs.length === 0 && searchQuery) {
    return (
      <div className="text-center my-5">
        <BsMusicNoteList size={40} className="text-muted mb-2" />
        <p>Không tìm thấy bài hát nào phù hợp với "{searchQuery}"</p>
      </div>
    );
  }

  if (songs.length === 0 && !searchQuery) {
    return (
      <div className="text-center my-5">
        <BsMusicNoteList size={40} className="text-muted mb-2" />
        <p>Hãy tìm kiếm bài hát bạn muốn nghe</p>
      </div>
    );
  }

  return (
    <div className="mt-4">
      <h5 className="mb-3">Kết quả tìm kiếm cho: "{searchQuery}"</h5>
      <Row xs={1} md={2} lg={3} className="g-4">
        {songs.map((song) => (
          <Col key={song.id}>
            <Card 
              className={`song-item h-100 ${currentSong && currentSong.id === song.id ? 'playing' : ''}`} 
              onClick={() => onSongSelect(song)}
            >
              <div className="position-relative">
                <Card.Img 
                  variant="top" 
                  src={song.thumbnail} 
                  alt={song.title}
                />
                <div className="position-absolute top-50 start-50 translate-middle">
                  <BsPlayCircleFill size={50} className="text-light opacity-75" />
                </div>
              </div>
              <Card.Body>
                <Card.Title className="song-title">{song.title}</Card.Title>
                <div className="song-details">
                  <p className="mb-1">{song.channelTitle}</p>
                  <div className="d-flex justify-content-between">
                    <span><BsClock className="me-1" />{song.duration}</span>
                    <span><BsEye className="me-1" />{song.views}</span>
                  </div>
                </div>
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>
    </div>
  );
};

export default SongList; 
 