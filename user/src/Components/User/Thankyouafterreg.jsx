import React, { useEffect } from 'react';
import { Button, Container, Row, Col, Card } from 'reactstrap';
import { useNavigate } from 'react-router-dom';
import useDirectuser from '../../Auth/Directuser';

const ThankYouPagereg = () => {
    const navigate = useNavigate(); // for navigation after submitting feedback

    return (
        <Container className="thank-you-page d-flex vh-100">
        <Row className="justify-content-center align-items-center m-auto">
          <Col xs={12} md={8} lg={6}>
            <Card className="text-center p-4 shadow-lg" style={{ borderRadius: '20px', backgroundColor: '#f9f9f9' }}>
              <h3 className="mb-4 text-primary">
                Thank you for your Registration of <span style={{ color: '#007bff' }}>STRIDE ACL FOCUS 2025</span>
              </h3>
              <p className="text-muted">
                Registration has been successfully completed! Check your email for a confirmation mail.
              </p>
              <Button
                color="primary"
                onClick={() => (window.location.href = 'https://www.stridebyavant.com/')}
                style={{
                  padding: '10px 20px',
                  borderRadius: '25px',
                  fontSize: '16px',
                }}
              >
                Go Back to Main Website
              </Button>
            </Card>
          </Col>
        </Row>
      </Container>
    );
};

export default ThankYouPagereg;
