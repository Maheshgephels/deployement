import React, { Fragment, useEffect, useState, useContext } from 'react';
import { useLocation } from 'react-router-dom';
import { Container, Row, Col, Input, Label, Button, Card, CardBody, Modal, ModalHeader, FormFeedback, ModalBody, ModalFooter, Media } from 'reactstrap';
import axios from 'axios';
import { BackendAPI } from '../../api';
import { Field, Form } from 'react-final-form';
import { required, email, Name, Img, PDF, fieldname, Notify, number, username, Editpassword, Editusername } from '../Utils/validationUtils';
import CustomizerContext from '../../_helper/Customizer';
import { Link, useNavigate } from 'react-router-dom';
import { Breadcrumbs } from '../../AbstractElements';
import SweetAlert from 'sweetalert2';
import debounce from 'lodash.debounce';
import useAuth from '../../Auth/protectedAuth';
import { getToken } from '../../Auth/Auth';
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import Select from 'react-select';
import { PermissionsContext } from '../../contexts/PermissionsContext';

const composeValidators = (...validators) => value =>
    validators.reduce((error, validator) => error || validator(value), undefined);

const EditEventUser = () => {
    useAuth();
    const [User, setUser] = useState({}); // State to store User data
    const { layoutURL } = useContext(CustomizerContext);
    const [modal, setModal] = useState(false);
    const location = useLocation();
    const { catName } = location.state;
    const { UserId } = location.state;
    const navigate = useNavigate();
    const [name, setName] = useState('');
    const [Username, setUsername] = useState('');
    const [nameValidationMessage, setNameValidationMessage] = useState('');
    const [nameTouched, setNameTouched] = useState(false);
    const [prefixes, setPrefixes] = useState([]);
    const [showPassword, setShowPassword] = useState(false);
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [regCat, setRegCat] = useState([]);
    const [isChecked, setIsChecked] = useState(false);
    const { permissions } = useContext(PermissionsContext);



    useEffect(() => {
        fetchUser(); // Fetch User data when component mounts
    }, [permissions]);

    // Extract Users component
    const ManageUserPermissions = permissions['ManageUser'];

    const fetchUser = async () => {
        try {
            const token = getToken();
            const response = await axios.post(`${BackendAPI}/eventuser/editUser`, { UserId }, {
                headers: {
                    Authorization: `Bearer ${token}` // Include the token in the Authorization header
                }
            }
            );
            console.log('Data from API:', response.data);
            setUser(response.data[0]); // Set User data to the first item in the response array
            setIsChecked(response.data[0].cs_isfaculty === 1);
            setUsername(response.data[0].cs_username);
        } catch (error) {
            console.error('Error fetching User data:', error);
        }
    };

    const fetchDropdown = async () => {
        try {
            const token = getToken();
            const response = await axios.get(`${BackendAPI}/eventuser/getDropdownData`, {
                headers: {
                    Authorization: `Bearer ${token}` // Include the token in the Authorization header
                }
            });
            setData(response.data);
            console.log(response.data);
            setLoading(false);

            const fetchprefixes = response.data.prefix;
            const fetchstate = response.data.states;
            const fetchcountry = response.data.country;
            const fetchregcat = response.data.regCategory;
            const fetchworkshop = response.data.workshop;
            const fetchdaytype = response.data.dayType;
            const fetchCutomData = response.data.custom;
            const fetchfacultytype = response.data.facultytype;


            setPrefixes(fetchprefixes);
            setRegCat(fetchregcat);

            console.log("Check:", fetchfacultytype);


        } catch (error) {
            console.error('Error fetching dropdown data:', error);
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDropdown(); // Corrected function name
    }, []);




    // const handleCancel = () => {
    //     const URL = '/User/';
    //     navigate(`${process.env.PUBLIC_URL}${URL}${layoutURL}`);
    // };
    const handleCancel = () => {
        setModal(true);
    };

    const handleNavigation = () => {
        navigate(`${process.env.PUBLIC_URL}/event/manage-user/Consoft`);
    };


    const onSubmit = async (values) => {

        if (nameValidationMessage) {
            return; // Prevent form submission if there is a validation error
        }

        try {
            const token = getToken();

            // Add the 'isChecked' value to the values object
            const updatedValues = {
                ...values,
                isChecked: isChecked // Assuming 'adduser' is the name of the checkbox
            };

            // Send formData to server
            const response = await axios.post(`${BackendAPI}/eventuser/updateUser`, { values: updatedValues, UserId }, {
                headers: {
                    Authorization: `Bearer ${token}` // Include the token in the Authorization header
                }
            });

            // Handle server response
            if (response.status === 200) {
                // Show success message to the user
                console.log('User updated successfully');
            } else {
                // Handle error condition
                console.error('Error updating User:', response.data.message);
            }

            SweetAlert.fire({
                title: 'Success!',
                text: 'Changes Updated successfully!',
                icon: 'success',
                timer: 3000,
                showConfirmButton: false,
                allowOutsideClick: false,
                allowEscapeKey: false
            }).then((result) => {
                if (result.dismiss === SweetAlert.DismissReason.timer) {
                    navigate(`${process.env.PUBLIC_URL}/event/manage-user/${layoutURL}`);
                }
            });
        } catch (error) {
            // Handle network error or other exceptions
            console.error('Error updating settings:', error.message);
        }
    };



    const validatename = debounce(async (value) => {
        try {

            if (value === Username) {
                // Skip validation if the name is the same as the current name
                setNameValidationMessage('');
                return;
            }

            // Call the API to check name availability
            const token = getToken();
            const response = await axios.post(`${BackendAPI}/eventuser/check-user-name`, { uName: value }, {
                headers: {
                    Authorization: `Bearer ${token}` // Include the token in the Authorization header
                }
            });

            console.log('Server response:', response);
            if (!response.data.available) {
                setNameValidationMessage('User name already exists');
            } else {
                // Only set the validation message if the name is valid
                setNameValidationMessage('');
            }
        } catch (error) {
            console.error('Error checking username availability:', error);
            setNameValidationMessage('Error checking name availability');
        }
    }, 500); // Debounce time: 500ms

    useEffect(() => {
        if (nameTouched) { // Only validate name if it has been touched
            validatename(name);
        }
        return () => {
            validatename.cancel();
        };
    }, [name, nameTouched]);

    return (
        <Fragment>
            <Breadcrumbs parentClickHandler={handleNavigation} mainTitle="Edit User" parent="Manage User" title="Edit User" />
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
                                                    <Label className='form-label' for="prefix"><strong>Title <span className="red-asterisk">*</span></strong></Label>
                                                    <Field
                                                        name="prefix" // Use dynamic field name
                                                        validate={composeValidators(required)}
                                                        initialValue={User.cs_title}
                                                    >
                                                        {({ input, meta }) => (
                                                            <div>
                                                                <select
                                                                    {...input}
                                                                    className="form-control"
                                                                    id="selectmethod"
                                                                >
                                                                    <option value="">Select Title</option>
                                                                    {prefixes.map((option) => (
                                                                        <option key={option.cs_prefix} value={option.cs_prefix}>
                                                                            {option.cs_prefix}
                                                                        </option>
                                                                    ))}
                                                                </select>
                                                                {meta.error && meta.touched && <FormFeedback className='d-block text-danger'>{meta.error}</FormFeedback>}
                                                            </div>
                                                        )}
                                                    </Field>

                                                </Col>
                                                <Col md="4" className="mb-3">
                                                    <Field
                                                        name="fName"
                                                        validate={composeValidators(required, Notify)}
                                                        initialValue={User.cs_first_name}
                                                    >
                                                        {({ input, meta }) => (
                                                            <div>

                                                                <Label className='form-label' for="fname"><strong>First Name <span className="red-asterisk">*</span></strong></Label>
                                                                <input
                                                                    {...input}
                                                                    className="form-control"
                                                                    id="fname"
                                                                    type="text"
                                                                    placeholder="Enter first name"
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

                                                <Col md="4" className="mb-3">
                                                    <Field
                                                        name="lname"
                                                        validate={composeValidators(required, Notify)}
                                                        initialValue={User.cs_last_name}
                                                    >
                                                        {({ input, meta }) => (
                                                            <div>

                                                                <Label className='form-label' for="lname"><strong>last Name <span className="red-asterisk">*</span></strong></Label>
                                                                <input
                                                                    {...input}
                                                                    className="form-control"
                                                                    id="lname"
                                                                    type="text"
                                                                    placeholder="Enter Last Name"
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

                                                <Col md="4" className="mb-3">
                                                    <Label className='form-label' for="regcat"><strong>Registration Category  <span className="red-asterisk">*</span></strong></Label>
                                                    <Field
                                                        name="regcat" // Use dynamic field name
                                                        validate={composeValidators(required)}
                                                        initialValue={User.cs_reg_category}
                                                    >
                                                        {({ input, meta }) => (
                                                            <div>
                                                                <select
                                                                    {...input}
                                                                    className="form-control"
                                                                    id="selectmethod"
                                                                >
                                                                    <option value="">Select Title</option>
                                                                    {regCat
                                                                        .map((option) => (
                                                                            <option key={option.cs_reg_cat_id} value={option.cs_reg_category}>
                                                                                {option.cs_reg_category}
                                                                            </option>
                                                                        ))}
                                                                </select>
                                                                {meta.error && meta.touched && <FormFeedback className='d-block text-danger'>{meta.error}</FormFeedback>}
                                                            </div>
                                                        )}
                                                    </Field>

                                                </Col>

                                                <Col md="4" className="mb-3">
                                                    <Field
                                                        name="mobile"
                                                        validate={composeValidators(required, number)}
                                                        initialValue={User.cs_phone}
                                                    >
                                                        {({ input, meta }) => (
                                                            <div>

                                                                <Label className='form-label' for="mobile"><strong>Contact Number <span className="red-asterisk">*</span></strong></Label>
                                                                <input
                                                                    {...input}
                                                                    className="form-control"
                                                                    id="mobile"
                                                                    type="text"
                                                                    placeholder="Enter Contact Number"
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
                                                <Col md="4" className="mb-3">
                                                    <Field
                                                        name="email"
                                                        validate={composeValidators(required, email)}
                                                        initialValue={User.cs_email}
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

                                                <Col md='4 mb-3'>
                                                    <Field
                                                        name="uName"
                                                        validate={composeValidators(required, Editusername)}
                                                        initialValue={User.cs_username}
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
                                                        validate={composeValidators(required, Editpassword)}
                                                        initialValue={User.cs_password}
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
                                                <Col md="6" className="mb-3">
                                                    <Field name="adduser" type="checkbox">
                                                        {({ input }) => (
                                                            <div>
                                                                <input
                                                                    {...input}
                                                                    id="adduser"
                                                                    checked={isChecked}
                                                                    onChange={(e) => {
                                                                        setIsChecked(e.target.checked);
                                                                        input.onChange(e);
                                                                    }}
                                                                />
                                                                <Label className='form-check-label' style={{ marginLeft: '10px' }} for="adduser">
                                                                    <strong>Do you want to create its faculty profile?</strong>
                                                                </Label>
                                                            </div>
                                                        )}
                                                    </Field>
                                                </Col>
                                            </Row>

                                            {/* <small className="form-text text-muted">Note: For icon change visit facility page.</small> Help text for pagination */}

                                            {ManageUserPermissions?.edit === 1 && (
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

export default EditEventUser;
