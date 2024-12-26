import React, { Fragment } from 'react';
import { Container, Row, Col, Card, CardBody, CardHeader, Input, Label, Media } from 'reactstrap';
import { Breadcrumbs, P } from '../../../AbstractElements';
import { SampleCard } from '../../../Constant';
import HeaderCard from '../../Common/Component/HeaderCard';
// import { Switchcolor } from '../../../Data/FormWidgets';

const Sample = () => {
  return (
    <Fragment>
      <Breadcrumbs parentClickHandler={handleNavigation} mainTitle="Sample Page" parent="Pages" title="Sample Page" />
      <Container fluid={true}>
        <Row>
          <Col sm="12">
            <Card>
              <HeaderCard title={SampleCard} span1="lorem ipsum dolor sit amet, consectetur adipisicing elit" />
              <CardBody className="row switch-showcase height-equal">
                <Col sm="12">



                  
                    <Media body className="text-center icon-state switch-md">
                      <Label className="switch">
                        <Input type="checkbox" /><span className={"switch-state bg-success"}></span>
                      </Label>
                    </Media>
                  


                </Col>
              </CardBody>
            </Card>
          </Col>
        </Row>
      </Container>
    </Fragment>
  );
};

export default Sample;