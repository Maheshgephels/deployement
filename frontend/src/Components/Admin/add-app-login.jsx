import React, { Fragment, useState, useEffect } from 'react';
import { Container, Row, Col, Button, Card, CardBody, Modal, ModalHeader, ModalBody, ModalFooter, FormFeedback, Label, PopoverBody, UncontrolledPopover } from 'reactstrap';
import { Breadcrumbs } from '../../AbstractElements';
import axios from 'axios';
import { BackendAPI } from '../../api';
import SweetAlert from 'sweetalert2';
import debounce from 'lodash.debounce';
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import { MdDelete, MdInfoOutline } from "react-icons/md";
import { IoIosArrowDown } from "react-icons/io";
import { Field, Form } from 'react-final-form'; // Import Field and Form from react-final-form
import { Link, useNavigate } from 'react-router-dom';
import Select from 'react-select';
import { required, email, username, Wname, password, option } from '../Utils/validationUtils';
import useAuth from '../../Auth/protectedAuth';


import { getToken } from '../../Auth/Auth';

//Utility function used to combine multiple validation functions into a single validation function
const composeValidators = (...validators) => value =>
    validators.reduce((error, validator) => error || validator(value), undefined);

const CreateAppLogin = () => {
    useAuth();
    const [data, setData] = useState([]);
    const navigate = useNavigate(); // Initialize useHistory
    const [loading, setLoading] = useState(true);
    const [modal, setModal] = useState(false);
    const initialValue = '';
    const [showPassword, setShowPassword] = useState(false);
    const [name, setName] = useState('');
    const [nameValidationMessage, setNameValidationMessage] = useState('');
    const [nameTouched, setNameTouched] = useState(false);


    const currentDate = new Date();
    const minDate = currentDate.toLocaleDateString('en-GB').split('/').reverse().join('-');




    useEffect(() => {
        fetchAppLogin(); // Corrected function name
    }, []);

    const fetchAppLogin = async () => {
        try {
            const token = getToken();
            const response = await axios.get(`${BackendAPI}/role/getRoles`, {
                headers: {
                    Authorization: `Bearer ${token}` // Include the token in the Authorization header
                }
            });
            setData(response.data);
            setLoading(false);
            console.log('Facility Types:', response.data); // Log the data received from the API
        } catch (error) {
            console.error('Error fetching facility types:', error);
            setLoading(false);
        }
    };

    const role = [...new Set(data.map(item => ({ value: item.cs_role_id, label: item.cs_role_name })))];

    const handleSelect = (event) => {
        console.log(event.target.value);
    }

    const onSubmit = async (values) => {

        if (nameValidationMessage) {
            return; // Prevent form submission if there is a validation error
        }
        try {
            console.log('Form data to send:', values);

            // Format the expiry date as "dd-mm-yyyy"
            const formattedExpiry = values.expiry.split('-').reverse().join('-');
            console.log('Expiry date to send:', formattedExpiry);
            const token = getToken();
            await axios.post(`${BackendAPI}/login/storeappuserlogin`, values, {
                headers: {
                    Authorization: `Bearer ${token}` // Include the token in the Authorization header
                }
            });

            SweetAlert.fire({
                title: 'Success!',
                text: 'App User login created successfully!',
                icon: 'success',
                timer: 3000,
                showConfirmButton: false,
                allowOutsideClick: false,
                allowEscapeKey: false
            }).then((result) => {
                if (result.dismiss === SweetAlert.DismissReason.timer) {
                    navigate(`${process.env.PUBLIC_URL}/onsite/manage-app-user/Consoft`);
                }
            });
        } catch (error) {
            console.error('Error creating application login:', error.message);
        }
    };



    const handleCancel = () => {
        setModal(true);
    };


    const validatename = debounce(async (value) => {
        try {

            // Call the API to check name availability
            const token = getToken();
            const response = await axios.post(`${BackendAPI}/login/check-user-name`, { uName: value }, {
                headers: {
                    Authorization: `Bearer ${token}` // Include the token in the Authorization header
                }
            });

            console.log('Server response:', response);
            if (!response.data.available) {
                setNameValidationMessage('Username already exists');
            } else {
                // Only set the validation message if the name is valid
                setNameValidationMessage('');
            }
        } catch (error) {
            console.error('Error checking username availability:', error);
            setNameValidationMessage('Error checking name availability');
        }
    }, 500); // Debounce time: 500ms



    // Effect to trigger validation when name changes
    useEffect(() => {
        if (nameTouched) { // Only validate name if it has been touched
            validatename(name);
        }
        return () => {
            validatename.cancel();
        };
    }, [name, nameTouched]);

    const handleNavigation = () => {
        navigate(`${process.env.PUBLIC_URL}/onsite/manage-app-user/Consoft`);
    };




    return (
        <Fragment>
            <Breadcrumbs parentClickHandler={handleNavigation} mainTitle="Create App User" parent="App User Login" title="Create App User" />
            {/* <Breadcrumbs parentClickHandler={handleNavigation} mainTitle="Create App User" parent="App User Login" title="Create App User"  parentClickHandler={handleNavigation} /> */}
            <Container fluid={true}>
                <Row>
                    <Col sm="12">
                        <Card>
                            <CardBody>
                                <Form onSubmit={onSubmit}>
                                    {({ handleSubmit }) => (
                                        <form className='needs-validation' noValidate='' onSubmit={handleSubmit}>
                                            {/* Your form fields */}
                                            <Row>
                                                <Col md='4 mb-3'>
                                                    <Field
                                                        name="uName"
                                                        validate={composeValidators(required, username)}
                                                    >
                                                        {({ input, meta }) => (
                                                            <div>

                                                                <Label className='form-label' for="uName"><strong>User Name <span className="red-asterisk">*</span></strong></Label>
                                                                <input
                                                                    {...input}
                                                                    className="form-control"
                                                                    id="uName"
                                                                    type="text"
                                                                    placeholder="Enter User name"
                                                                    onChange={(e) => {
                                                                        input.onChange(e); // Trigger onChange of the Field component
                                                                        setName(e.target.value); // Update userName state
                                                                        setNameTouched(true);
                                                                    }}
                                                                />

                                                                {nameValidationMessage && <div className="text-danger">{nameValidationMessage}</div>}


                                                                {meta.error && meta.touched && <FormFeedback className='d-block text-danger'>{meta.error}</FormFeedback>}
                                                            </div>
                                                        )}
                                                    </Field>
                                                </Col>

                                                <Col md='4' className='mb-3'>
                                                    <Field
                                                        name="pass"
                                                        validate={composeValidators(required, password)}
                                                    >
                                                        {({ input, meta }) => (
                                                            <div>
                                                                <Label className='form-label' for="password"><strong>Password <span className="red-asterisk">*</span></strong></Label>
                                                                <div className="input-group">
                                                                    <input
                                                                        {...input}
                                                                        className="form-control"
                                                                        id="password"
                                                                        type={showPassword ? "text" : "password"}
                                                                        placeholder="Enter Password"
                                                                    />
                                                                    <button
                                                                        className="btn btn-outline-dark"
                                                                        type="button"
                                                                        onClick={() => setShowPassword(!showPassword)}
                                                                    >
                                                                        {showPassword ? <FaEye /> : <FaEyeSlash />}
                                                                    </button>
                                                                </div>
                                                                {meta.error && meta.touched && <FormFeedback className='d-block text-danger'>{meta.error}</FormFeedback>}
                                                            </div>
                                                        )}
                                                    </Field>
                                                </Col>

                                            </Row>

                                            <Row>
                                                <Col md='4 mb-3'>
                                                    <Field
                                                        name="email"
                                                        validate={composeValidators(required, email)}
                                                    >
                                                        {({ input, meta }) => (
                                                            <div>

                                                                <Label className='form-label' for="email"><strong>Email <span className="red-asterisk">*</span></strong></Label>
                                                                <input
                                                                    {...input}
                                                                    className="form-control"
                                                                    id="email"
                                                                    type="text"
                                                                    placeholder="Enter Email"
                                                                />
                                                                {meta.error && meta.touched && <FormFeedback className='d-block text-danger'>{meta.error}</FormFeedback>}
                                                            </div>
                                                        )}
                                                    </Field>
                                                </Col>

                                                <Col md="4" className="mb-3">
                                                    <Label className='form-label' for="type"><strong>Role Name <span className="red-asterisk">*</span></strong></Label>
                                                    <Field
                                                        name="roleid"
                                                        validate={option}
                                                    >
                                                        {({ input, meta }) => (
                                                            <div>
                                                                <select
                                                                    {...input}
                                                                    className="form-control"
                                                                    id="selectmethod"
                                                                >
                                                                    <option value="">Select Role</option>
                                                                    {role.map((option) => (
                                                                        <option key={option.value} value={option.value}>
                                                                            {option.label}
                                                                        </option>
                                                                    ))}
                                                                </select>
                                                                {/* <button type="button"
                                                                >
                                                                    <IoIosArrowDown />

                                                                </button> */}
                                                                {meta.error && meta.touched && <FormFeedback className='d-block text-danger'>{meta.error}</FormFeedback>}
                                                                <div className='valid-feedback'>Looks good!</div>
                                                            </div>
                                                        )}
                                                    </Field>
                                                </Col>

                                            </Row>

                                            <Row>
                                                <Col md='4 mb-3'>
                                                    <Field
                                                        name="expiry"
                                                        validate={composeValidators(option)}
                                                    >
                                                        {({ input, meta }) => (
                                                            <div>

                                                                <Label className='form-label' for='expiry_date'><strong> Login Expiry Date <span className="red-asterisk">*</span></strong></Label>

                                                                <input
                                                                    {...input}
                                                                    className="form-control"
                                                                    id="expiry_date"
                                                                    type="date"
                                                                    placeholder="Enter Expiry Date"
                                                                    min={minDate}
                                                                    max="9999-12-31"
                                                                />

                                                                {meta.error && meta.touched && <FormFeedback className='d-block text-danger'>{meta.error}</FormFeedback>}
                                                            </div>
                                                        )}
                                                    </Field>
                                                </Col>

                                                <Col md='4 mb-3'>
                                                    <Field
                                                        name="spotnumber"
                                                        validate={composeValidators(option)}
                                                    >
                                                        {({ input, meta }) => (
                                                            <div>

                                                                <Label className='form-label' for='spot_number'><strong> Spot Registration Start <span className="red-asterisk">*</span></strong></Label>
                                                                <MdInfoOutline
                                                                    id="loginPopover"
                                                                    style={{
                                                                        cursor: 'pointer', marginLeft: '5px'
                                                                    }}
                                                                />
                                                                <UncontrolledPopover
                                                                    placement="bottom"
                                                                    target="loginPopover"
                                                                    trigger="focus"
                                                                >
                                                                    <PopoverBody>
                                                                        From this number, registration numbers will be allocated to users and used during registration in the app. These numbers will be unique for all app users.
                                                                    </PopoverBody>
                                                                </UncontrolledPopover>
                                                                <input
                                                                    {...input}
                                                                    className="form-control"
                                                                    id="spot_number"
                                                                    type="number"
                                                                    min="0" // Set the minimum value allowed to 1
                                                                    placeholder="Enter a number"
                                                                />

                                                                {meta.error && meta.touched && <FormFeedback className='d-block text-danger'>{meta.error}</FormFeedback>}
                                                            </div>
                                                        )}
                                                    </Field>
                                                </Col>

                                            </Row>


                                            <div>
                                                <Button color='primary' type='submit' className="me-2 mt-3">Create App Login</Button>
                                                <Button color='warning' onClick={handleCancel} className="mt-3">Cancel</Button>
                                            </div>



                                            {/* Repeat the above pattern for other fields */}
                                            {/* Add submit and cancel buttons */}
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
                    <div className='ms-2'>
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
                    <Button color="primary" onClick={() => setModal(!modal)}>No</Button>
                </ModalFooter>
            </Modal>
        </Fragment>
    );
};

export default CreateAppLogin;