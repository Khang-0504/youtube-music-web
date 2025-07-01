import React, { useState } from 'react';
import { Modal, Button, Form, Alert } from 'react-bootstrap';

const ApiKeyModal = ({ show, onHide, onSave, apiKey }) => {
  const [key, setKey] = useState(apiKey || '');
  const [error, setError] = useState('');

  const handleSave = () => {
    if (!key || key.trim() === '') {
      setError('Vui lòng nhập API key của bạn');
      return;
    }
    
    // Kiểm tra định dạng API key cơ bản
    if (!key.match(/^[A-Za-z0-9_-]{20,}$/)) {
      setError('API key có vẻ không đúng định dạng');
      return;
    }
    
    onSave(key.trim());
  };

  return (
    <Modal show={show} onHide={onHide} centered>
      <Modal.Header closeButton>
        <Modal.Title>YouTube API Key</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <p>
          Nhập YouTube Data API v3 key của bạn để sử dụng ứng dụng. 
          API key giúp tìm kiếm bài hát trên YouTube.
        </p>
        
        <Alert variant="info">
          <Alert.Heading>Cách lấy API key</Alert.Heading>
          <ol className="mb-0">
            <li>Đăng nhập vào <a href="https://console.cloud.google.com/" target="_blank" rel="noreferrer">Google Cloud Console</a></li>
            <li>Tạo dự án mới</li>
            <li>Bật YouTube Data API v3</li>
            <li>Tạo credentials (API key)</li>
            <li>Sao chép API key và dán vào đây</li>
          </ol>
        </Alert>
        
        {error && <Alert variant="danger">{error}</Alert>}
        
        <Form.Group>
          <Form.Label>API Key</Form.Label>
          <Form.Control
            type="text"
            placeholder="Nhập YouTube API key của bạn"
            value={key}
            onChange={(e) => {
              setKey(e.target.value);
              setError('');
            }}
          />
          <Form.Text className="text-muted">
            API key sẽ được lưu trên trình duyệt của bạn và không được chia sẻ.
          </Form.Text>
        </Form.Group>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide}>
          Hủy
        </Button>
        <Button variant="primary" onClick={handleSave}>
          Lưu
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default ApiKeyModal; 