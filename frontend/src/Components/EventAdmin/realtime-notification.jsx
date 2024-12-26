import React, { useEffect, useState, Fragment } from 'react';
import { Container, Row, Col, Label, Button, Card, CardBody, Modal, ModalHeader, ModalBody, ModalFooter, Input } from 'reactstrap';
import { useForm, Controller } from 'react-hook-form';
import axios from 'axios';
import { BackendAPI } from '../../api';
import SweetAlert from 'sweetalert2';
import { Breadcrumbs } from '../../AbstractElements';
import { Link, useNavigate } from 'react-router-dom';
import useAuth from '../../Auth/protectedAuth';
import { getToken } from '../../Auth/Auth';

const RealTimeNotification = () => {
  useAuth();
  const navigate = useNavigate();
  const [modal, setModal] = useState(false);
  const { control, handleSubmit, formState: { errors } } = useForm();

  const handleCancel = () => {
    setModal(true);
  };

  const onSubmit = async (data) => {
    try {
      const token = getToken();
      await axios.post(`${BackendAPI}/notification/send-notification`, data, {
        headers: {
          Authorization: `Bearer ${token}`

        }
        
      });

      SweetAlert.fire({
        title: 'Success!',
        text: 'Notification sent!',
        icon: 'success',
        timer: 3000,
        showConfirmButton: false,
        allowOutsideClick: false,
        allowEscapeKey: false
      }).then((result) => {
        if (result.dismiss === SweetAlert.DismissReason.timer) {
          navigate(`${process.env.PUBLIC_URL}/event/manage-notification/Consoft`);
        }
      });
    } catch (error) {
      console.error('There was an error sending the notification!', error);
    }
  };

  const handleNavigation = () => {
    navigate(`${process.env.PUBLIC_URL}/event/manage-notification/Consoft`);
  };

  return (
    <Fragment>
      <Breadcrumbs parentClickHandler={handleNavigation} mainTitle="Send Notification" parent="Manage Notification" title="Send Notification" />
      <Container fluid={true}>
        <Row>
          <Col sm="12">
            <Card>
              <CardBody>
                <form className='needs-validation' noValidate='' onSubmit={handleSubmit(onSubmit)}>
                  <Row>
                    <Col md="4" className="mb-3">
                      <Label className='form-label' for="title"><strong>Title <span className="red-asterisk">*</span></strong></Label>
                      <Controller
                        name="title"
                        control={control}
                        defaultValue=""
                        rules={{ required: 'Title is required' }}
                        render={({ field }) => (
                          <Input
                            {...field}
                            type="text"
                            id="title"
                            placeholder="Enter Notification Title"
                            invalid={errors.title ? true : false}
                          />
                        )}
                      />
                      {errors.title && <p className='d-block text-danger'>{errors.title.message}</p>}
                    </Col>
                  </Row>
                  <Row>
                    <Col md="4" className="mb-3">
                      <Label className='form-label' for="body"><strong>Body <span className="red-asterisk">*</span></strong></Label>
                      <Controller
                        name="body"
                        control={control}
                        defaultValue=""
                        rules={{ required: 'Body is required' }}
                        render={({ field }) => (
                          <Input
                            {...field}
                            type="textarea"
                            id="body"
                            placeholder="Enter Notification Body"
                            invalid={errors.body ? true : false}
                          />
                        )}
                      />
                      {errors.body && <p className='d-block text-danger'>{errors.body.message}</p>}
                    </Col>
                  </Row>
                  <div>
                    <Button color='primary' type='submit' className="me-2 mt-3">Send</Button>
                    <Button color='warning' onClick={handleCancel} className="mt-3">Cancel</Button>
                  </div>
                </form>
              </CardBody>
            </Card>
          </Col>
        </Row>
      </Container>
      {/* Modal */}
      <Modal isOpen={modal} toggle={() => setModal(!modal)} centered>
        <ModalHeader toggle={() => setModal(!modal)}>Confirmation</ModalHeader>
        <ModalBody>
          <div>
            <p>
              Your changes will be discarded. Are you sure you want to cancel?
            </p>
          </div>
        </ModalBody>
        <ModalFooter>
          <Button onClick={handleNavigation} color='warning'>Yes</Button>
          <Button color="primary" onClick={() => setModal(!modal)}>No</Button>
        </ModalFooter>
      </Modal>
    </Fragment>
  );
};

export default RealTimeNotification;
