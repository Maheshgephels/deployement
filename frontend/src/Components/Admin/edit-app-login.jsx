import React, { Fragment, useState, useEffect } from 'react';
import { Container, Row, Col, Button, Card, CardBody, Modal, ModalHeader, ModalBody, ModalFooter, FormFeedback, Label } from 'reactstrap';
import { Breadcrumbs } from '../../AbstractElements';
import axios from 'axios';
import { BackendAPI } from '../../api';
import SweetAlert from 'sweetalert2';
import debounce from 'lodash.debounce';
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import { IoIosArrowDown } from "react-icons/io";
import { Field, Form } from 'react-final-form';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { required, email, username, password, expiryDate } from '../Utils/validationUtils';
import useAuth from '../../Auth/protectedAuth';
import { getToken } from '../../Auth/Auth';
// Utility function used to combine multiple validation functions into a single validation function
const composeValidators = (...validators) => value =>
    validators.reduce((error, validator) => error || validator(value), undefined);

const EditAppLogin = () => {
    useAuth();
    const [data, setData] = useState({});
    const [roleId, setRoleId] = useState([]);
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [modal, setModal] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [name, setName] = useState('');
    const [nameValidationMessage, setNameValidationMessage] = useState('');
    const [nameTouched, setNameTouched] = useState(false);
    const location = useLocation();
    const { cs_id, cs_username } = location.state;

    const currentDate = new Date();
    const minDate = currentDate.toLocaleDateString('en-GB').split('/').reverse().join('-');


    useEffect(() => {
        fetchLoginDetail(); // Fetch workshop data when component mounts
    }, []);

    const fetchLoginDetail = async () => {
        try {
            const token = getToken(); 
            const response = await axios.post(`${BackendAPI}/login/editlogin`, { cs_id }, {
                headers: {
                    Authorization: `Bearer ${token}` // Include the token in the Authorization header
                }
            });
            console.log('Data from API:', response.data);
            setData(response.data[0]);
        } catch (error) {
            console.error('Error fetching workshop data:', error);
        }
    };

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
            setRoleId(response.data);
            setLoading(false);
            console.log('Facility Types:', response.data); // Log the data received from the API
        } catch (error) {
            console.error('Error fetching facility types:', error);
            setLoading(false);
        }
    };

    const role = [...new Set(roleId.map(item => ({ value: item.cs_role_id, label: item.cs_role_name })))];

    const onSubmit = async (values) => {
        if (nameValidationMessage) {
            return; // Prevent form submission if there is a validation error
        }
        try {
            const formattedExpiry = values.cs_valid_upto.split('-').reverse().join('-');
            console.log('Expiry date to send:', formattedExpiry);

            const dataToSend = { ...values, cs_id: location.state.cs_id, cs_valid_upto: formattedExpiry };
            console.log('Form data to send:', dataToSend);

            const token = getToken(); 

            await axios.post(`${BackendAPI}/login/updateLogin`, dataToSend,  {
                headers: {
                    Authorization: `Bearer ${token}` // Include the token in the Authorization header
                }
            });

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
                    navigate(`${process.env.PUBLIC_URL}/onsite/manage-app-user/Consoft`);
                }
            });
        } catch (error) {
            console.error('Error updating application login:', error.message);
        }
    };

    const handleCancel = () => {
        setModal(true);
    };

    const validatename = debounce(async (value) => {
        try {
            if (value === cs_username) {
                // Skip validation if the name is the same as the current name
                setNameValidationMessage('');
                return;
            }
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
                setNameValidationMessage('');
            }
        } catch (error) {
            console.error('Error checking username availability:', error);
            setNameValidationMessage('Error checking name availability');
        }
    }, 500);

    useEffect(() => {
        if (nameTouched) {
            validatename(name);
        }
        return () => {
            validatename.cancel();
        };
    }, [name, nameTouched]);

    const convertToDateInputFormat = (dateString) => {
        if (!dateString) return '';

        const parts = dateString.split('-');
        if (parts.length !== 3) return dateString;

        const [day, month, year] = parts;
        return `${year}-${month}-${day}`;
    };

    const initialValues = {
        uName: data.cs_username || '',
        cs_password: data.cs_password || '',
        cs_email: data.cs_email || '',
        cs_role_id: data.cs_role_id || '',
        cs_valid_upto: convertToDateInputFormat(data.cs_valid_upto) || '',
        cs_regno_start: data.cs_regno_start || ''
    };

    const handleNavigation = () => {
        navigate(`${process.env.PUBLIC_URL}/onsite/manage-app-user/Consoft`);
      };

    return (
        <Fragment>
            <Breadcrumbs parentClickHandler={handleNavigation} mainTitle="Edit App User" parent="App User Login" title="Edit App User" />
            <Container fluid={true}>
                <Row>
                    <Col sm="12">
                        <Card>
                            <CardBody>
                                <Form onSubmit={onSubmit} initialValues={initialValues}>
                                    {({ handleSubmit }) => (
                                        <form className='needs-validation' noValidate='' onSubmit={handleSubmit}>
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
                                                                        input.onChange(e);
                                                                        setName(e.target.value);
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
                                                        name="cs_password"
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
                                                        name="cs_email"
                                                    >
                                                        {({ input, meta }) => (
                                                            <div>
                                                                <Label className='form-label' for="email"><strong>Email <span className="red-asterisk">*</span></strong></Label>
                                                                <input
                                                                    {...input}
                                                                    className="form-control"
                                                                    id="email"
                                                                    type="email"
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
                                                        name="cs_role_id"
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
                                                                {meta.error && meta.touched && <FormFeedback className='d-block text-danger'>{meta.error}</FormFeedback>}
                                                            </div>
                                                        )}
                                                    </Field>
                                                </Col>
                                            </Row>

                                            <Row>
                                                <Col md='4 mb-3'>
                                                    <Field
                                                        name="cs_valid_upto"
                                                    >
                                                        {({ input, meta }) => (
                                                            <div>
                                                                <Label className='form-label' for='expiry_date'><strong>Login Expiry Date <span className="red-asterisk">*</span></strong></Label>
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
                                                        name="cs_regno_start"
                                                    >
                                                        {({ input, meta }) => (
                                                            <div>
                                                                <Label className='form-label' for='spot_number'><strong> Spot Registration Start <span className="red-asterisk">*</span></strong></Label>
                                                                <input
                                                                    {...input}
                                                                    className="form-control"
                                                                    id="spot_number"
                                                                    type="number"
                                                                    min="0"
                                                                    placeholder="Enter a number"
                                                                />
                                                                {meta.error && meta.touched && <FormFeedback className='d-block text-danger'>{meta.error}</FormFeedback>}
                                                            </div>
                                                        )}
                                                    </Field>
                                                </Col>
                                            </Row>

                                            <div>
                                                <Button color='primary' type='submit' className="me-2 mt-3">Edit App Login</Button>
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
                    {/* <Link to="/onsite/manage-app-user/Consoft" className="btn btn-warning">Yes</Link> */}
                    <Button color="primary" onClick={() => setModal(!modal)}>No</Button>
                </ModalFooter>
            </Modal>
        </Fragment>
    );
};

export default EditAppLogin;
