import React, { Fragment, useState, useEffect } from 'react';
import { Container, Row, Col, Button, Card, CardBody, Modal, ModalHeader, ModalBody, ModalFooter, FormFeedback, Label } from 'reactstrap';
import { Breadcrumbs } from '../../AbstractElements';
import axios from 'axios';
import { BackendAPI } from '../../api';
import SweetAlert from 'sweetalert2';
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import { IoIosArrowDown } from "react-icons/io";
import { Field, Form } from 'react-final-form'; // Import Field and Form from react-final-form
import { Link, useNavigate } from 'react-router-dom';
import Select from 'react-select';
import { required, email, Wname, password, expiryDate } from '../Utils/validationUtils';
import useAuth from '../../Auth/protectedAuth';

//Utility function used to combine multiple validation functions into a single validation function
const composeValidators = (...validators) => value =>
    validators.reduce((error, validator) => error || validator(value), undefined);

const AddWorkshop = () => {
    useAuth();
    const [data, setData] = useState([]);
    const navigate = useNavigate(); // Initialize useHistory
    const [loading, setLoading] = useState(true);
    const [modal, setModal] = useState(false);
    const initialValue = '';
    const [showPassword, setShowPassword] = useState(false);

    useEffect(() => {
        fetchFacilityType(); // Corrected function name
    }, []);

    const fetchFacilityType = async () => {
        try {
            const response = await axios.get(`${BackendAPI}/role/getroles`);
            setData(response.data);
            setLoading(false);
            console.log('Facility Types:', response.data); // Log the data received from the API
        } catch (error) {
            console.error('Error fetching facility types:', error);
            setLoading(false);
        }
    };


    const handleSelect = (event) => {
        console.log(event.target.value);
    }

    const onSubmit = async (values) => {

        const formData = {
            ...values,
            adduser: values.adduser ? "1" : "0",
            spot: values.spot ? "1" : "0"
        };

        try {
            console.log('Form data to send:', formData);
            await axios.post(`${BackendAPI}/workshop/addworkshop`, formData);

            SweetAlert.fire({
                title: 'Success!',
                text: 'Workshop created successfully!',
                icon: 'success',
                timer: 3000,
                showConfirmButton: false,
                allowOutsideClick: false,
                allowEscapeKey: false 
            }).then((result) => {
                if (result.dismiss === SweetAlert.DismissReason.timer) {
                    navigate("/onsite/manage-workshop/Consoft");
                }
            });
        } catch (error) {
            console.error('Error creating application login:', error.message);
        }
    };

    const handleCancel = () => {
        setModal(true);
    };

    return (
        <Fragment>
            <Breadcrumbs parentClickHandler={handleNavigation} mainTitle="Create Workshop" parent="Workshop" title="Create Workshop" />
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
                                                        name="workshopName"
                                                        validate={composeValidators(required, Wname)}
                                                    >
                                                        {({ input, meta }) => (
                                                            <div>
                                                                <Label className='form-label' for="workshopName"><strong>Workshop Name <span className="red-asterisk">*</span></strong></Label>
                                                                <input
                                                                    {...input}
                                                                    className="form-control"
                                                                    id="workshopName"
                                                                    type="text"
                                                                />
                                                                {meta.error && meta.touched && <p className='d-block text-danger'>{meta.error}</p>}
                                                            </div>
                                                        )}
                                                    </Field>
                                                </Col>
                                            </Row>

                                            <Row>
                                                <Col md="4" className="mb-3">
                                                    <Field
                                                        name="adduser"
                                                        type="checkbox"
                                                        // validate={composeValidators(required, Wname)}
                                                    >
                                                        {({ input, meta }) => (
                                                            <div >
                                                                <input
                                                                    {...input}
                                                                    id="adduser" // Correct ID for the input
                                                                />
                                                                <Label className='form-check-label' style={{ marginLeft: '10px' }} for="adduser"><strong>Visible in add user form</strong></Label>
                                                                {meta.error && meta.touched && <p className='d-block text-danger'>{meta.error}</p>}
                                                            </div>
                                                        )}
                                                    </Field>
                                                </Col>
                                            </Row>

                                            <Row>
                                                <Col md="4" className="mb-3">
                                                    <Field
                                                        name="spot"
                                                        type="checkbox"
                                                        // validate={composeValidators(required, Wname)}
                                                    >
                                                        {({ input, meta }) => (
                                                            <div >
                                                                <input
                                                                    {...input}
                                                                    id="spot" // Correct ID for the input
                                                                />
                                                                <Label className='form-check-label' style={{ marginLeft: '10px' }} for="spot"><strong>Visible in App registration form</strong></Label>
                                                                {meta.error && meta.touched && <p className='d-block text-danger'>{meta.error}</p>}
                                                            </div>
                                                        )}
                                                    </Field>
                                                </Col>
                                            </Row>




                                            <div>
                                                <Button color='primary' type='submit' className="mr-2 mt-3">Create Workshop</Button>
                                                <Button color='warning' onClick={handleCancel} className="mt-3">Cancel</Button>
                                            </div>




                                        </form>
                                    )}
                                </Form>
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
                    <Link to="/onsite/manage-workshop/Consoft" className="btn btn-warning">Yes</Link>
                    <Button color="primary" onClick={() => setModal(!modal)}>No</Button>
                </ModalFooter>
            </Modal>
        </Fragment>
    );
};

export default AddWorkshop;
