import React, { Fragment, useEffect, useState, useContext } from 'react';
import { useLocation } from 'react-router-dom';
import { Container, Row, Col, Card, Label, Button, CardBody, Modal, ModalHeader, ModalBody, ModalFooter, Input, } from 'reactstrap';
import axios from 'axios';
import { BackendAPI } from '../../api';
import { Field, Form } from 'react-final-form';
import { required, email, Name, Img, PDF, fieldname, Notify } from '../Utils/validationUtils';
import CustomizerContext from '../../_helper/Customizer';
import { Link, useNavigate } from 'react-router-dom';
import { Breadcrumbs } from '../../AbstractElements';
import SweetAlert from 'sweetalert2';
import debounce from 'lodash.debounce';
import useAuth from '../../Auth/protectedAuth';
import { getToken } from '../../Auth/Auth';
import { PermissionsContext } from '../../contexts/PermissionsContext';

const composeValidators = (...validators) => value =>
    validators.reduce((error, validator) => error || validator(value), undefined);

const EditNotification = () => {
    useAuth();
    const [Notification, setNotification] = useState({}); // State to store Notification data
    const { layoutURL } = useContext(CustomizerContext);
    const [modal, setModal] = useState(false);
    const location = useLocation();
    const { catName } = location.state;
    const { NotificationId, Notificationname } = location.state;
    const navigate = useNavigate();
    const [name, setName] = useState('');
    const [nameValidationMessage, setNameValidationMessage] = useState('');
    const [nameTouched, setNameTouched] = useState(false);
    const { permissions } = useContext(PermissionsContext);

    useEffect(() => {
        fetchNotification(); // Fetch Notification data when component mounts
    }, [permissions]);

        // Extract Notifications component
        const NotificationsPermissions = permissions['Notification'];

    const fetchNotification = async () => {
        try {
            const token = getToken();
            const response = await axios.post(`${BackendAPI}/Notification/editNotification`, { NotificationId }, {
                headers: {
                    Authorization: `Bearer ${token}` // Include the token in the Authorization header
                }
            });
            console.log('Data from API:', response.data);
            setNotification(response.data[0]); // Set Notification data to the first item in the response array
        } catch (error) {
            console.error('Error fetching Notification data:', error);
        }
    };




    // const handleCancel = () => {
    //     const URL = '/Notification/';
    //     navigate(`${process.env.PUBLIC_URL}${URL}${layoutURL}`);
    // };
    const handleCancel = () => {
        setModal(true);
    };

    const handleNavigation = () => {
        navigate(`${process.env.PUBLIC_URL}/event/manage-notification/Consoft`);
    };


    const onSubmit = async (values) => {

        if (nameValidationMessage) {
            return; // Prevent form submission if there is a validation error
        }

        try {
            const token = getToken();
            // Send formData to server
            const response = await axios.post(`${BackendAPI}/Notification/updateNotification`, { values, NotificationId }, {
                headers: {
                    Authorization: `Bearer ${token}` // Include the token in the Authorization header
                }
            });

            // Handle server response
            if (response.status === 200) {
                // Show success message to the user
                console.log('Notification updated successfully');
            } else {
                // Handle error condition
                console.error('Error updating Notification:', response.data.message);
            }

            SweetAlert.fire({
                title: 'Success!',
                text: 'Changes Updated successfully !',
                icon: 'success',
                timer: 3000,
                showConfirmButton: false,
                allowOutsideClick: false,
                allowEscapeKey: false
            }).then((result) => {
                if (result.dismiss === SweetAlert.DismissReason.timer) {
                    navigate(`${process.env.PUBLIC_URL}/event/manage-notification/${layoutURL}`);
                }
            });
        } catch (error) {
            // Handle network error or other exceptions
            console.error('Error updating settings:', error.message);
        }
    };


    // const validatename = debounce(async (value) => {
    //     try {

    //         if (value === Notificationname) {
    //             // Skip validation if the name is the same as the current name
    //             setNameValidationMessage('');
    //             return;
    //         }

    //         // Call the API to check name availability
    //         const token = getToken();
    //         const response = await axios.post(`${BackendAPI}/Notification/check-Notification-name`, { dName: value }, {
    //             headers: {
    //                 Authorization: `Bearer ${token}` // Include the token in the Authorization header
    //             }
    //         });

    //         console.log('Server response:', response);
    //         if (!response.data.available) {
    //             setNameValidationMessage('Notification name already exists');
    //         } else {
    //             // Only set the validation message if the name is valid
    //             setNameValidationMessage('');
    //         }
    //     } catch (error) {
    //         console.error('Error checking username availability:', error);
    //         setNameValidationMessage('Error checking name availability');
    //     }
    // }, 500); // Debounce time: 500ms

    // useEffect(() => {
    //     if (nameTouched) { // Only validate name if it has been touched
    //         validatename(name);
    //     }
    //     return () => {
    //         validatename.cancel();
    //     };
    // }, [name, nameTouched]);

    return (
        <Fragment>
            <Breadcrumbs parentClickHandler={handleNavigation} mainTitle="Edit Notification" parent="Manage Notification" title="Edit Notification" />
            <Container fluid={true}>
                <Row>
                    <Col sm="12">
                        <Card>
                            <CardBody>
                                <Form onSubmit={onSubmit}>
                                    {({ handleSubmit }) => (
                                        <form className='needs-validation' noValidate='' onSubmit={handleSubmit}>
                                            <Row>
                                                <Col md="4" className="mb-3">
                                                    <Field
                                                        name="dName"
                                                        initialValue={Notification.heading || ''} // Set initial value to Notification name, defaulting to empty string
                                                        validate={composeValidators(required, Notify)}
                                                    >
                                                        {({ input, meta }) => (
                                                            <div>
                                                                <Label className='form-label' for="NotificationName"><strong>Notification Heading <span className="red-asterisk">*</span></strong></Label>
                                                                <input
                                                                    {...input}
                                                                    className="form-control"
                                                                    id="NotificationName"
                                                                    type="text"
                                                                    placeholder="Enter Notification name"
                                                                    onChange={(e) => {
                                                                        input.onChange(e); // Trigger onChange of the Field component
                                                                        setName(e.target.value); // Update userName state
                                                                        setNameTouched(true);
                                                                    }}
                                                                />


                                                                {meta.error && meta.touched && <p className='d-block text-danger'>{meta.error}</p>}
                                                            </div>
                                                        )}
                                                    </Field>
                                                </Col>
                                            </Row>


                                            <Row>
                                                <Col md="6 mb-3">
                                                    <Label for="Description"><strong>Description <span className="red-asterisk">*</span></strong></Label>
                                                    <Field
                                                        name="Description"
                                                        initialValue={Notification.description || ''}
                                                        validate={composeValidators(required, Notify)}
                                                    >
                                                        {({ input, meta }) => (
                                                            <>
                                                                <Input {...input} type="textarea" id="Description" placeholder="Enter Notification description" />
                                                                {meta.error && meta.touched && <p className='d-block text-danger'>{meta.error}</p>}
                                                            </>
                                                        )}
                                                    </Field>
                                                </Col>
                                            </Row>

                                            {/* <small className="form-text text-muted">Note: For icon change visit facility page.</small> Help text for pagination */}

                                            {NotificationsPermissions?.edit === 1 && (
                                            <div>
                                                <Button color='primary' type='submit' className="me-2 mt-3">Save</Button>
                                                <Button color='warning' onClick={handleCancel} className="mt-3">Cancel</Button>
                                            </div>
                                            )}
                                        </form>
                                    )}
                                </Form>
                            </CardBody>
                        </Card>
                    </Col>
                </Row>
            </Container>

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
                    <Button
                        onClick={handleNavigation} color='warning'>
                        Yes

                    </Button>
                    {/* <Link to="/App-user/Consoft" className="btn btn-warning">Yes</Link> */}
                    <Button color="primary" onClick={() => setModal(!modal)}>No</Button>
                </ModalFooter>
            </Modal>
        </Fragment>
    );
};

export default EditNotification;
