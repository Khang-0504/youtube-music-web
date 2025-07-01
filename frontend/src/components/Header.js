import React from 'react';
import { Navbar, Container, Nav, Button } from 'react-bootstrap';
import { BsMusicNoteBeamed, BsGear } from 'react-icons/bs';

const Header = ({ onShowApiKeyModal }) => {
  return (
    <Navbar bg="dark" variant="dark" expand="lg">
      <Container>
        <Navbar.Brand href="#home">
          <BsMusicNoteBeamed className="me-2" />
          YouTube Music Web
        </Navbar.Brand>
        <Navbar.Toggle aria-controls="basic-navbar-nav" />
        <Navbar.Collapse id="basic-navbar-nav" className="justify-content-end">
          <Nav>
            <Button 
              variant="outline-light" 
              size="sm" 
              onClick={onShowApiKeyModal}
              className="d-flex align-items-center"
            >
              <BsGear className="me-1" /> API Key
            </Button>
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
};

export default Header; 