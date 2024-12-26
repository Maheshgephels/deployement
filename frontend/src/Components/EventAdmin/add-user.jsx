import React, { Fragment, useState, useEffect, useContext } from 'react';
import { Container, Row, Col, Input, Label, Button, Card, CardBody, Modal, ModalHeader, FormFeedback, ModalBody, ModalFooter, Media } from 'reactstrap';
import { useForm } from 'react-hook-form';
import axios from 'axios';
import { BackendAPI } from '../../api';
import SweetAlert from 'sweetalert2';
// import { Input } from 'antd';
import { Breadcrumbs } from '../../AbstractElements';
import { Link, useNavigate } from 'react-router-dom';
import Select from 'react-select';
import { Field, Form } from 'react-final-form'; // Import Field and Form from react-final-form
import { required, email, Name, Img, PDF, fieldname, Notify, number, username1, password, mobileno } from '../Utils/validationUtils';
import debounce from 'lodash.debounce';
import { PermissionsContext } from '../../contexts/PermissionsContext';


import useAuth from '../../Auth/protectedAuth';
import { getToken } from '../../Auth/Auth';
import { FaEye, FaEyeSlash } from 'react-icons/fa';


//Utility function used to combine multiple validation functions into a single validation function
const composeValidators = (...validators) => value =>
    validators.reduce((error, validator) => error || validator(value), undefined);

const AddEventUser = () => {
    useAuth();
    const [FacilityName, setFacilityName] = useState('');
    const [newRoleDescription, setNewRoleDescription] = useState('');
    const [isChecked, setIsChecked] = useState([]); // Initialize isChecked state
    const [files, setFiles] = useState({ brightModeIcon: '', darkModeIcon: '' });
    const [data, setData] = useState([]);
    const navigate = useNavigate(); // Initialize useHistory
    const [loading, setLoading] = useState(true);
    const [modal, setModal] = useState(false);
    const { register, handleSubmit, formState: { errors } } = useForm();
    const initialValue = '';
    const [selectedFacilityType, setSelectedFacilityType] = useState(initialValue);
    const [selectedImage, setSelectedImage] = useState(null);
    const [selectedPdf, setSelectedPdf] = useState(null);
    const [imageError, setImageError] = useState('');
    const [pdfError, setPdfError] = useState('');
    const [name, setName] = useState('');
    const [nameValidationMessage, setNameValidationMessage] = useState('');
    const [nameTouched, setNameTouched] = useState(false);
    const [prefixes, setPrefixes] = useState([]);
    const [showPassword, setShowPassword] = useState(false);
    const [regCat, setRegCat] = useState([]);
    const { permissions } = useContext(PermissionsContext);

    console.log("Reg:", regCat);

    // Update onFilesChange function to store file objects
    const onFilesChange = (event, type) => {
        const file = event.target.files[0];
        if (file) {
            setFiles(prevFiles => ({ ...prevFiles, [type]: file }));
        }
    };

    const onFilesError = (error, file) => {
        console.error('error', error);
    };

    const handleCancel = () => {
        setModal(true);
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
            const fetchregcat = response.data.regCategory.filter(cat => cat.cs_reg_cat_id !== 2);            const fetchworkshop = response.data.workshop;
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
    }, [permissions]);

        // Extract Users component
        const ManageUserPermissions = permissions['ManageUser'];

    const onSubmit = async (formData, event) => {
        if (nameValidationMessage) {
            return; // Prevent form submission if there is a validation error
        }

        const UserData = {
            ...formData,
        };

        try {
            console.log('Form data to send:', UserData);
            const token = getToken();
            await axios.post(`${BackendAPI}/eventuser/addUser`, UserData, {
                headers: {
                    Authorization: `Bearer ${token}` // Include the token in the Authorization header
                }
            });

            SweetAlert.fire({
                title: 'Success!',
                text: 'User added successfully!',
                icon: 'success',
                timer: 3000,
                showConfirmButton: false,
                allowOutsideClick: false,
                allowEscapeKey: false,
                allowOutsideClick: false,
                allowEscapeKey: false // Disable clicking outside the modal
            }).then((result) => {
                if (result.dismiss === SweetAlert.DismissReason.timer) {
                    navigate(`${process.env.PUBLIC_URL}/event/manage-user/Consoft`);
                }
            });
        } catch (error) {
            console.error('Error creating application login:', error.message);
        }
    };


    const validatename = debounce(async (value) => {
        try {

            // Call the API to check name availability
            const token = getToken();
            const response = await axios.post(`${BackendAPI}/eventuser/check-user-name`, { uName: value }, {
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

    useEffect(() => {
        if (nameTouched) { // Only validate name if it has been touched
            validatename(name);
        }
        return () => {
            validatename.cancel();
        };
    }, [name, nameTouched]);




    const handleImageChange = async (event, type) => {
        const file = event.target.files[0];
        if (file) {
            setFiles(prevFiles => ({ ...prevFiles, [type]: file }));
            setSelectedImage(file); // Update selectedImage state
        }
        try {
            await Img(file); // Wait for the Promise to resolve
            setImageError('');
        } catch (error) {
            setSelectedImage(null);
            setImageError(error);
        }
    };

    // const handlePdfChange = async (event, type) => {
    //     const file = event.target.files[0];
    //     if (file) {
    //         setFiles(prevFiles => ({ ...prevFiles, [type]: file }));
    //         setSelectedPdf(file); // Update selectedImage state

    //     }

    //     try {
    //         await Img(file); // Wait for the Promise to resolve
    //         setPdfError('');
    //     } catch (error) {
    //         setSelectedPdf(null);
    //         setPdfError(error);
    //     }

    // };


    // const validatename = debounce(async (value) => {
    //     try {

    //         // Call the API to check name availability
    //         const token = getToken();
    //         const response = await axios.post(`${BackendAPI}/User/check-User-name`, { dName: value }, {
    //             headers: {
    //                 Authorization: `Bearer ${token}` // Include the token in the Authorization header
    //             }
    //         });

    //         console.log('Server response:', response);
    //         if (!response.data.available) {
    //             setNameValidationMessage('User name already exists');
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


    const handleNavigation = () => {
        navigate(`${process.env.PUBLIC_URL}/event/manage-user/Consoft`);
    };





    return (
        <Fragment>
            <Breadcrumbs parentClickHandler={handleNavigation} mainTitle="Create User" parent="Manage User" title="Create User" />
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
                                                        name="prefix" // Use dynamic field name
                                                        validate={composeValidators(required)}
                                                    >
                                                        {({ input, meta }) => (
                                                            <div>
                                                                <Label className='form-label' for="prefix">
                                                                    <strong>Title <span className="red-asterisk">*</span></strong>
                                                                </Label>
                                                                <Select
                                                                    {...input}
                                                                    options={
                                                                        prefixes.map(pref => ({ value: pref.cs_prefix, label: pref.cs_prefix }))
                                                                    }

                                                                    // options={[{ value: '', label: 'Select' }, // Adding the "Select" option as the first item
                                                                    // ...state.map(pref => ({ value: pref.cs_state_name, label: pref.cs_state_name }))]}
                                                                    placeholder={`Select Title`}
                                                                    isSearchable={true}
                                                                    onChange={(value) => input.onChange(value)}
                                                                    onBlur={input.onBlur}
                                                                    classNamePrefix="react-select"
                                                                    style={{ zIndex: 3 }}
                                                                />
                                                                {meta.error && meta.touched && <p className='d-block text-danger'>{meta.error}</p>}
                                                            </div>
                                                        )}
                                                    </Field>

                                                </Col>
                                                <Col md="4" className="mb-3">
                                                    <Field
                                                        name="fName"
                                                        validate={composeValidators(required, Notify)}
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
                                                    >
                                                        {({ input, meta }) => (
                                                            <div>

                                                                <Label className='form-label' for="lname"><strong>Last Name <span className="red-asterisk">*</span></strong></Label>
                                                                <input
                                                                    {...input}
                                                                    className="form-control"
                                                                    id="lname"
                                                                    type="text"
                                                                    placeholder="Enter Last Name"
                                                                  
                                                                />

                                                                {meta.error && meta.touched && <p className='d-block text-danger'>{meta.error}</p>}

                                                            </div>
                                                        )}
                                                    </Field>

                                                </Col>
                                                <Col md="4" className="mb-3">
                                                    <Field
                                                        name="regcat" // Use dynamic field name
                                                        validate={composeValidators(required)}
                                                    >
                                                        {({ input, meta }) => (
                                                            <div>
                                                                <Label className='form-label' for="regcat">
                                                                    <strong>Registration Category <span className="red-asterisk">*</span></strong>
                                                                </Label>
                                                                <Select
                                                                    {...input}
                                                                    options={
                                                                        regCat.map(pref => ({ value: pref.cs_reg_cat_id, label: pref.cs_reg_category }))
                                                                    }

                                                                    // options={[{ value: '', label: 'Select' }, // Adding the "Select" option as the first item
                                                                    // ...state.map(pref => ({ value: pref.cs_state_name, label: pref.cs_state_name }))]}
                                                                    placeholder={`Select Registration Category`}
                                                                    isSearchable={true}
                                                                    onChange={(value) => input.onChange(value)}
                                                                    onBlur={input.onBlur}
                                                                    classNamePrefix="react-select"
                                                                    style={{ zIndex: 3 }}
                                                                />
                                                                {meta.error && meta.touched && <p className='d-block text-danger'>{meta.error}</p>}
                                                            </div>
                                                        )}
                                                    </Field>

                                                </Col>

                                                <Col md="4" className="mb-3">
                                                    <Field
                                                        name="mobile"
                                                        validate={composeValidators(required, mobileno)}
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

                                                                {meta.error && meta.touched && <p className='d-block text-danger'>{meta.error}</p>}

                                                            </div>
                                                        )}
                                                    </Field>

                                                </Col>

                                                <Col md='4 mb-3'>
                                                    <Field
                                                        name="uName"
                                                        validate={composeValidators(required, username1)}
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
                                                                        style={{ zIndex: 1 }}
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
                                                                <Label className='form-check-label' style={{ marginLeft: '10px' }} for="adduser"><strong>Do you want to creates its faculty profile.</strong></Label>
                                                                {meta.error && meta.touched && <p className='d-block text-danger'>{meta.error}</p>}
                                                            </div>
                                                        )}
                                                    </Field>
                                                </Col>
                                            </Row>

                                            {ManageUserPermissions?.add === 1 && (
                                            <div>
                                                <Button color='primary' type='submit' className="me-2 mt-3">Add User</Button>
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
                    <Button
                        onClick={handleNavigation} color='warning'>
                        Yes

                    </Button>
                    {/* <Link to="/manage-facility/Consoft" className="btn btn-warning">Yes</Link> */}
                    <Button color="primary" onClick={() => setModal(!modal)}>No</Button>
                </ModalFooter>
            </Modal>
        </Fragment>
    );
};

export default AddEventUser;
