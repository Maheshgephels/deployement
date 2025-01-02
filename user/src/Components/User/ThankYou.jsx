import React, { useEffect } from 'react';
import { Button, Container, Row, Col, Card } from 'reactstrap';
import { useNavigate } from 'react-router-dom';
import useDirectuser from '../../Auth/Directuser';

const ThankYouPage = () => {
    useDirectuser();
    const navigate = useNavigate(); // for navigation after submitting feedback

    useEffect(() => {
        const timer = setTimeout(() => {
            navigate(-1); // Go back to the previous page after 5 seconds
        }, 5000);

        return () => clearTimeout(timer); // Cleanup the timer on component unmount
    }, [navigate]);

    return (
        <Container className="thank-you-page">
            <Row className="justify-content-center align-items-center">
                <Col xs={12} md={6} className="text-center">
                    <Card className="p-3">
                        <h1 className="mb-4">Thank You for Your Feedback!</h1>
                        <p>Your feedback is very important to us. We appreciate you taking the time to share your thoughts.</p>
                        <p>You will be redirected to the previous page in 5 seconds.</p>

                        {/* Optional: Button to navigate back immediately */}
                        <Button color="primary" onClick={() => navigate(-1)}>
                            Go Back Now
                        </Button>
                    </Card>
                </Col>
            </Row>
        </Container>
    );
};

export default ThankYouPage;
