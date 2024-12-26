import React, { Fragment, useState, useEffect, useRef } from 'react';
import { Container, Row, Col, Input, Label, Button, Card, CardBody, Modal, ModalHeader, FormFeedback, ModalBody, ModalFooter, Media,  Popover, PopoverHeader, PopoverBody } from 'reactstrap';
import { useForm } from 'react-hook-form';
import axios from 'axios';
import { BackendAPI } from '../../api';
import SweetAlert  from 'sweetalert2';
// import { Input } from 'antd';
import { Breadcrumbs } from '../../AbstractElements';
import { Link, useNavigate } from 'react-router-dom';
import Select from 'react-select';
import { Field, Form } from 'react-final-form'; // Import Field and Form from react-final-form
import { required, email, Name, Img, PDF } from '../Utils/validationUtils';
import debounce from 'lodash.debounce';


import useAuth from '../../Auth/protectedAuth';
import { getToken } from '../../Auth/Auth';


//Utility function used to combine multiple validation functions into a single validation function
const composeValidators = (...validators) => value =>
    validators.reduce((error, validator) => error || validator(value), undefined);

const CreateRegWorkshop = () => {
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
    const [message, setMessage] = useState('');
    const [iconOpen, setIconOpen] = useState(false);
    const [iconPreviewUrl, setIconPreviewUrl] = useState(null);
    const iconAvailableRef = useRef(null);
    const [custom, setCustom] = useState([]);


    useEffect(() => {
        fetchFacilityType(); // Corrected function name
        fetchDropdown();
    }, []);



    const fetchFacilityType = async () => {
        try {
            const token = getToken();
            const response = await axios.get(`${BackendAPI}/user/getfacilityType`, {
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

    const fetchDropdown = async () => {
        try {
            const token = getToken();
            const response = await axios.get(`${BackendAPI}/manageuser/getDropdownData`, {
                headers: {
                    Authorization: `Bearer ${token}` // Include the token in the Authorization header
                }
            });
         console.log(response.data);
            setLoading(false);

            const fetchCutomData = response.data.workshoptype;


            setCustom(fetchCutomData);


        } catch (error) {
            console.error('Error fetching dropdown data:', error);
            setLoading(false);
        }
    };

    // Filter out "foodviewallaccess" type
    const uniqueTypes = [...new Set(data.map(item => item.cs_type))].filter(type => type !== 'foodviewallaccess', '');

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

    const onSubmit = async (formData, event) => {
        if (nameValidationMessage) {
            return; // Prevent form submission if there is a validation error
        }
        try {
            // Include the current timestamp in the formData
            formData.datetime = new Date().toISOString();

            // Assign "Yes" or "No" based on isChecked state
            formData.daywise = "No";

            // Assign selected facility type to formData
            // formData.facilityType = selectedFacilityType.value;

            // Create a new FormData object to hold form data and files
            const formDataToSend = new FormData();

            // Append form data fields to FormData
            Object.keys(formData).forEach(key => {
                formDataToSend.append(key, formData[key]);
            });

            // Append files to FormData
            formDataToSend.append('brightModeIcon', files.brightModeIcon);
            const token = getToken();
            // Now you can send formDataToSend to the server
            const response = await axios.post(`${BackendAPI}/user/storeFacilityType`, formDataToSend, {
                headers: {
                    Authorization: `Bearer ${token}` // Include the token in the Authorization header
                }
            });

        } catch (error) {
            console.error('Error creating facility:', error.message);
        }

        // Second part of the onSubmit function for workshop creation
        const workshopData = {
            ...formData
        };

        try {
            console.log('Form data to send:', workshopData);
            const token = getToken();
            await axios.post(`${BackendAPI}/regWorkshop/addworkshop`, workshopData, {
                headers: {
                    Authorization: `Bearer ${token}` // Include the token in the Authorization header
                }
            });

            SweetAlert.fire({
                title: 'Success!',
                text: 'Workshop created successfully!',
                icon: 'success',
                timer: 3000,
                showConfirmButton: false,
                allowOutsideClick: false,
                allowEscapeKey: false ,
                allowOutsideClick: false,
                allowEscapeKey: false // Disable clicking outside the modal
            }).then((result) => {
                if (result.dismiss === SweetAlert.DismissReason.timer) {
                    navigate(`${process.env.PUBLIC_URL}/registration/manage-reg-workshop/Consoft`);
                }
            });
        } catch (error) {
            console.error('Error creating application login:', error.message);
        }
    };




    const handleImageChange = async (event, type) => {
        const file = event.target.files[0];

        if (file) {
            setFiles(prevFiles => ({ ...prevFiles, [type]: file }));
            setSelectedImage(file); // Update selectedImage state
            const url = URL.createObjectURL(file);
            setIconPreviewUrl(url);
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


    const validatename = debounce(async (value) => {
        try {

            // Call the API to check name availability
            const token = getToken();
            const response = await axios.post(`${BackendAPI}/regWorkshop/check-workshop-name`, { dName: value }, {
                headers: {
                    Authorization: `Bearer ${token}` // Include the token in the Authorization header
                }
            });

            console.log('Server response:', response);
            if (!response.data.available) {
                setNameValidationMessage('Workshop name already exists');
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


    const handleNavigation = () => {
        navigate(`${process.env.PUBLIC_URL}/registration/manage-reg-workshop/Consoft`);
    };

    
    const workshopOptions = custom.map((option) => ({
        value: option.id,
        label: option.workshoptype_name,
    }));




    return (
        <Fragment>
            <Breadcrumbs parentClickHandler={handleNavigation} mainTitle="Create Workshop" parent="Manage Workshop" title="Create Workshop" />
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
                                                        name="wName"
                                                        validate={composeValidators(required, Name)}
                                                    >
                                                        {({ input, meta }) => (
                                                            <div>

                                                                <Label className='form-label' for="displayname"><strong>Workshop Name <span className="red-asterisk">*</span></strong></Label>
                                                                <input
                                                                    {...input}
                                                                    className="form-control"
                                                                    id="displayname"
                                                                    type="text"
                                                                    placeholder="Enter Workshop name"
                                                                    onChange={(e) => {
                                                                        input.onChange(e); // Trigger onChange of the Field component
                                                                        setName(e.target.value); // Update userName state
                                                                        setNameTouched(true);
                                                                    }}
                                                                />
                                                                {nameValidationMessage && <div className="text-danger">{nameValidationMessage}</div>}

                                                                {meta.error && meta.touched && <p className='d-block text-danger'>{meta.error}</p>}
                                                            </div>
                                                        )}
                                                    </Field>

                                                </Col>
                                                <Col md="4" className="mb-3">
                                                    <Label className='form-label' for="type">
                                                        <strong>Workshop Type <span className="red-asterisk">*</span></strong>
                                                    </Label>
                                                    <Field name="workshoptype_id">
                                                        {({ input, meta }) => (
                                                            <div>
                                                                <Select
                                                                    {...input}
                                                                    id="selectmethod"
                                                                    options={workshopOptions} // use the mapped options here
                                                                    classNamePrefix="react-select"
                                                                    onChange={(selectedOption) => input.onChange(selectedOption.value)}
                                                                    value={workshopOptions.find(option => option.value === input.value) || null} // find the selected option
                                                                    placeholder="Select Workshop Type"
                                                                />
                                                                {meta.error && meta.touched && (
                                                                    <FormFeedback className='d-block text-danger'>{meta.error}</FormFeedback>
                                                                )}
                                                            </div>
                                                        )}
                                                    </Field>
                                                </Col>

                                                {/* 
                                                <Col md='4 mb-3'>
                                                    <Field
                                                        name="uName"
                                                        validate={composeValidators(required, name)}
                                                    >
                                                        {({ input, meta }) => (
                                                            <div>

                                                                <Label className='form-label' for="displayname"><strong>User Name <span className="red-asterisk">*</span></strong></Label>
                                                                <input
                                                                    {...input}
                                                                    className="form-control"
                                                                    id="displayname"
                                                                    type="text"
                                                                    placeholder="Enter User name"
                                                                />
                                                                {meta.error && meta.touched && <FormFeedback className='d-block text-danger'>{meta.error}</FormFeedback>}
                                                            </div>
                                                        )}
                                                    </Field>
                                                </Col> */}



                                                {/* <Col md='4 mb-3'>
                                            <Label className='form-label' for='validationCustom01'>
                                                First name
                                            </Label>
                                            <input className='form-control' id='validationCustom01' type='text' placeholder='Mark' name='fName' {...register('fName', { required: true })} />
                                            <span className='d-block'>{errors.fName && 'First name is required'}</span>
                                            <div className='valid-feedback'>Looks good!</div>
                                        </Col> */}



                                                {/* <Col md="4 mb-3">
                                                    <Label for="type"><strong>Facility Type <span className="red-asterisk">*</span></strong></Label>
                                                    <Select
                                                        options={uniqueTypes.map(type => ({ value: type, label: type }))}
                                                        className="js-example-basic-single col-sm-12"
                                                        value={selectedFacilityType}
                                                        onChange={(selectedOption) => setSelectedFacilityType(selectedOption)}
                                                        name="facilityType" // Add the name property if required
                                                    />
                                                    {selectedFacilityType === null && <span className='d-block text-danger'>Facility type is required</span>}
                                                </Col> */}

                                            </Row>

                                          
                                                {/* <Col md="4 mb-3">
                                                    <div>
                                                        <Label for="brightModeIcon"><strong>Icon <span className="red-asterisk">*</span></strong></Label>
                                                        <Input type="file" name="brightmode" onChange={(event) => handleImageChange(event, 'brightModeIcon')} required />
                                                        {imageError && <p style={{ color: 'red' }}>{imageError}</p>}
                                                        {selectedImage && <p style={{ color: 'green' }}>Selected icon: {selectedImage.name}</p>}
                                                    </div>
                                                </Col> */}
                                                 

                                                {/* <Col md="4 mb-3">
                                                    <div>
                                                        <Label for="darkModeIcon"><strong>Dark Mode Icon <span className="red-asterisk">*</span></strong></Label>
                                                        <Input type="file" name="darkmode" onChange={(event) => handlePdfChange(event, 'darkModeIcon')} required />
                                                        {pdfError && <p style={{ color: 'red' }}>{pdfError}</p>}
                                                        {selectedPdf && <p style={{ color: 'green' }}>Selected icon: {selectedPdf.name}</p>}
                                                    </div>
                                                </Col> */}

                                                {/* <Col md="4 mb-3">
                                                    <Label for="brightModeIcon"><strong>Bright Mode Icon <span className="red-asterisk">*</span></strong></Label>
                                                    <Input
                                                        type="file"
                                                        name="brightmode"
                                                        onChange={(event) => onFilesChange(event, 'brightModeIcon')}
                                                        accept="image/*"
                                                    />
                                                    <Field name="brightmode" validate={required}>
                                                        {({ meta }) => (
                                                            <Fragment>
                                                                {meta.error && meta.touched && <FormFeedback className='d-block text-danger'>{meta.error}</FormFeedback>}
                                                                <div className='valid-feedback'>Looks good!</div>
                                                            </Fragment>
                                                        )}
                                                    </Field>
                                                </Col>
                                                <Col md="4 mb-3">
                                                    <Label for="darkModeIcon"><strong>Dark Mode Icon</strong></Label>
                                                    <Input
                                                        type="file"
                                                        name="darkmode"
                                                        {...register('darkmode', { required: true })}
                                                        onChange={(event) => onFilesChange(event, 'darkModeIcon')}
                                                        accept="image/*"
                                                    />
                                                    {errors.darkmode && <FormFeedback className='d-block text-danger'>Dark mode icon is required</FormFeedback>}
                                                    <div className='valid-feedback'>Looks good!</div>
                                                </Col> */}

                                            

                                            {/* 
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
                                            </Row> */}

                                            <div>
                                                <Button color='primary' type='submit' className="me-2 mt-3">Create Workshop</Button>
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

export default CreateRegWorkshop;
