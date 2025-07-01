import React, { useState } from 'react';
import { Form, Button, InputGroup } from 'react-bootstrap';
import { BsSearch } from 'react-icons/bs';

const SearchBar = ({ onSearch }) => {
  const [query, setQuery] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (query.trim()) {
      onSearch(query.trim());
    }
  };

  return (
    <div className="mt-3">
      <Form onSubmit={handleSubmit}>
        <InputGroup>
          <Form.Control
            type="text"
            placeholder="Tìm bài hát, nghệ sĩ..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="Tìm kiếm"
          />
          <Button variant="primary" type="submit">
            <BsSearch /> Tìm
          </Button>
        </InputGroup>
      </Form>
    </div>
  );
};

export default SearchBar; 