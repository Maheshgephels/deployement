import React from 'react';
import { Fragment } from 'react';
import { Col, Container, Row } from 'reactstrap';
import { P } from '../../AbstractElements';

const Footer = () => {
  return (
    <Fragment>
      <footer className="footer">
        <Container fluid={true}>
          <Row>
            <Col md="12" className="footer-copyright text-center">
              <P attrPara={{ className: "mb-0" }}>{'Copyright 2024 © ConSoft : Product by Gephels Systems All Rights Reserved.'}</P>
            </Col>
          </Row>
        </Container>
      </footer>
    </Fragment>
  );
};

export default Footer;