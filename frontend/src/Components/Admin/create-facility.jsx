import React, { Fragment, useState, useEffect, useRef } from 'react';
import { Container, Row, Col, Input, Label, Button, Card, CardBody, Modal, ModalHeader, FormFeedback, ModalBody, ModalFooter, Media, Popover, PopoverHeader, PopoverBody, UncontrolledPopover } from 'reactstrap';
import { useForm } from 'react-hook-form';
import axios from 'axios';
import { BackendAPI } from '../../api';
import SweetAlert from 'sweetalert2';
// import { Input } from 'antd';
import { MdDelete, MdInfoOutline } from "react-icons/md";
import { Breadcrumbs } from '../../AbstractElements';
import { Link, useNavigate } from 'react-router-dom';
import Select from 'react-select';
import { Field, Form } from 'react-final-form'; // Import Field and Form from react-final-form
import { required, email, FacName, Img, PDF } from '../Utils/validationUtils';
import debounce from 'lodash.debounce';
import useAuth from '../../Auth/protectedAuth';
import { getToken } from '../../Auth/Auth';
import { toast } from 'react-toastify';



//Utility function used to combine multiple validation functions into a single validation function
const composeValidators = (...validators) => value =>
    validators.reduce((error, validator) => error || validator(value), undefined);



const DismissibleNotification = ({ message, onClose }) => {
    return (
        <div style={{
            position: 'fixed',
            bottom: '20px',
            left: '20px',
            backgroundColor: '#000',
            color: '#fff',
            padding: '15px',
            borderRadius: '5px',
            boxShadow: '0px 0px 10px rgba(0, 0, 0, 0.5)',
            zIndex: '9999'
        }}>
            <span>{message}</span>
            <button onClick={onClose} style={{ marginLeft: '10px', backgroundColor: 'transparent', border: 'none', color: '#fff', cursor: 'pointer' }}>✕</button>
        </div>
    );
};

const CreateFacility = () => {
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
    const [isProcessing, setIsProcessing] = useState(false);
    const [message, setMessage] = useState('');
    const [iconOpen, setIconOpen] = useState(false);
    const [iconPreviewUrl, setIconPreviewUrl] = useState(null);
    const iconAvailableRef = useRef(null);


    useEffect(() => {
        fetchFacilityType(); // Corrected function name
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
            formData.daywise = isChecked ? "Yes" : "No";
            const formDataToSend = new FormData();

            Object.keys(formData).forEach(key => {
                formDataToSend.append(key, formData[key]);
            });

            formDataToSend.append('brightModeIcon', files.brightModeIcon);

            const token = getToken();

            // setIsProcessing(true);
            // setMessage('Process started. It may take longer.');

            // // Show toast notification for ongoing process
            // toast.info('Processing...', { autoClose: false });

            const response = await axios.post(`${BackendAPI}/user/storeFacilityType`, formDataToSend, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            // // Hide the ongoing process toast notification
            // toast.dismiss();

            // // Show success toast notification
            // toast.success(response.data.message);

            // // Redirect to the desired location
            // navigate(`${process.env.PUBLIC_URL}/manage-facility/Consoft`);
            SweetAlert.fire({
                title: 'Success!',
                text: 'Facility created successfully !',
                icon: 'success',
                timer: 3000,
                showConfirmButton: false,
                allowOutsideClick: false,
                allowEscapeKey: false
            }).then((result) => {
                if (result.dismiss === SweetAlert.DismissReason.timer) {
                    navigate(`${process.env.PUBLIC_URL}/onsite/manage-facility/Consoft`);
                }
            });
        } catch (error) {
            console.error('Error creating facility:', error.message);
        } finally {
            // setIsProcessing(false);
        }
    };





    // const handleImageChange = (event, type) => {
    //     const file = event.target.files[0];
    //     if (file) {
    //         setFiles(prevFiles => ({ ...prevFiles, [type]: file }));
    //     }
    //     const errorMessage = Img(file); // Implement validateImageFile function
    //     if (errorMessage) {
    //         setSelectedImage(null);
    //         setImageError(errorMessage);
    //     } else {
    //         setSelectedImage(file);
    //         setImageError('');
    //     }
    // };

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
            const response = await axios.post(`${BackendAPI}/login/check-facility-name`, { dName: value }, {
                headers: {
                    Authorization: `Bearer ${token}` // Include the token in the Authorization header
                }
            });

            console.log('Server response:', response);
            if (!response.data.available) {
                setNameValidationMessage('Facility name already exists');
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
        navigate(`${process.env.PUBLIC_URL}/onsite/manage-facility/Consoft`);
    };




    return (
        <Fragment>
            <Breadcrumbs parentClickHandler={handleNavigation} mainTitle="Create Facility" parent="Manage Facility" title="Create Facility" />
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
                                                        validate={composeValidators(required, FacName)}
                                                    >
                                                        {({ input, meta }) => (
                                                            <div>

                                                                <Label className='form-label' for="displayname"><strong>Facility Name <span className="red-asterisk">*</span></strong></Label>
                                                                <input
                                                                    {...input}
                                                                    className="form-control"
                                                                    id="displayname"
                                                                    type="text"
                                                                    placeholder="Enter Facility name"
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


                                                <Col md="4" className="mb-3">
                                                    <Label className='form-label' for="type"><strong>Facility Type <span className="red-asterisk">*</span></strong></Label>
                                                    <Field
                                                        name="facilityType"
                                                        validate={required}
                                                    >
                                                        {({ input, meta }) => (
                                                            <div>
                                                                <select
                                                                    {...input}
                                                                    className="form-control"
                                                                    id="selectmethod"
                                                                >
                                                                    <option value="">Select type</option>
                                                                    {/* <option value="registration">Registration</option> */}
                                                                    <option value="food">Food</option>
                                                                    <option value="certificate">Certificate</option>
                                                                    <option value="gift">Checkin/Gift</option>

                                                                </select>
                                                                {/* <select
                                                                    {...input}
                                                                    className="form-control"
                                                                    id="selectmethod"
                                                                >
                                                                    <option value="">Select Role</option>
                                                                    {uniqueTypes.map((type) => (
                                                                        <option key={type} value={type}>
                                                                            {type}
                                                                        </option>
                                                                    ))}
                                                                </select> */}
                                                                {meta.error && meta.touched && <p className='d-block text-danger'>{meta.error}</p>}

                                                                <div className='valid-feedback'>Looks good!</div>
                                                            </div>
                                                        )}
                                                    </Field>
                                                </Col>






                                            </Row>

                                            <Row>
                                                {/* <Col md="4 mb-3">
                                                    <Field
                                                        name="brightModeIcon"
                                                        validate={composeValidators(required)}
                                                    >
                                                        {({ input, meta }) => (
                                                            <div>
                                                                <Label for="brightModeIcon"><strong>Bright Mode Icon <span className="red-asterisk">*</span></strong></Label>
                                                                <Input
                                                                    {...input}
                                                                    type="file"
                                                                    name="brightmode"
                                                                    onChange={(event) => handleImageChange(event, 'brightModeIcon')}
                                                                />
                                                                {!selectedImage && meta.error && meta.touched && <p className='d-block text-danger'>{meta.error}</p>}

                                                                {imageError && <p style={{ color: 'red' }}>{imageError}</p>}

                                                                {selectedImage && <p>Selected image: {selectedImage.name}</p>}
                                                            </div>
                                                        )}
                                                    </Field>
                                                </Col> */}

                                                {/* <Col md="4 mb-3">
                                                    <Field
                                                        name="darkModeIcon"
                                                        validate={composeValidators(required)}
                                                    >
                                                        {({ input, meta }) => (
                                                            <div>
                                                                <Label for="darkModeIcon"><strong>Dark Mode Icon <span className="red-asterisk">*</span></strong></Label>
                                                                <Input
                                                                    {...input}
                                                                    type="file"
                                                                    name="darkmode"
                                                                    onChange={(event) => handlePdfChange(event, 'darkModeIcon')}
                                                                />
                                                                {meta.error && meta.touched && <p style={{ color: 'red' }}>{meta.error}</p>}
                                                                {selectedPdf && <p>Selected image: {selectedPdf.name}</p>}
                                                            </div>
                                                        )}
                                                    </Field>
                                                </Col> */}



                                                {/* <Col md="4 mb-3">
                                                    <div>
                                                        <Label for="brightModeIcon"><strong>Icon <span className="red-asterisk">*</span></strong></Label>
                                                        <Input type="file" name="brightmode" onChange={(event) => handleImageChange(event, 'brightModeIcon')} required />
                                                        {imageError && <p style={{ color: 'red' }}>{imageError}</p>}
                                                        {selectedImage && <p style={{ color: 'green' }}>Selected image: {selectedImage.name}</p>}
                                                    </div>
                                                </Col> */}

                                                <Col md="4" className="mb-3">
                                                    <div>
                                                        <Label for="brightModeIcon">
                                                            <strong>Facility Icon <span className="red-asterisk">*</span></strong>
                                                        </Label>
                                                        <Input
                                                            type="file"
                                                            name="brightmode"
                                                            onChange={(event) => handleImageChange(event, 'brightModeIcon')}
                                                            required
                                                        />
                                                        {imageError && <p style={{ color: 'red' }}>{imageError}</p>}

                                                        {/* Conditionally render the preview text */}
                                                        {iconPreviewUrl && !imageError && (
                                                            <p
                                                                ref={iconAvailableRef}
                                                                style={{ color: 'green', cursor: 'pointer' }}
                                                                onMouseEnter={() => setIconOpen(true)}
                                                                onMouseLeave={() => setIconOpen(false)}
                                                            >
                                                                ✔️ Facility Icon Preview
                                                            </p>
                                                        )}

                                                        <Popover
                                                            placement="right"
                                                            isOpen={iconOpen}
                                                            target={iconAvailableRef.current} // Use ref for the target
                                                            toggle={() => setIconOpen(!iconOpen)}
                                                        >
                                                            <PopoverHeader>Facility Icon Preview</PopoverHeader>
                                                            <PopoverBody>
                                                                {iconPreviewUrl ? (
                                                                    <img src={iconPreviewUrl} alt="Current facility Icon" style={{ maxWidth: '200px' }} />
                                                                ) : (
                                                                    <p>No icon selected</p>
                                                                )}
                                                            </PopoverBody>
                                                        </Popover>
                                                    </div>
                                                    {!selectedImage && (
                                                        <small className="form-text text-muted">
                                                            <strong>Image Size:</strong> 200KB Max <br />
                                                            <strong>Dimensions:</strong> 600(H) × 600(W) <br />
                                                            <strong>Image Type:</strong> PNG
                                                        </small>
                                                    )}


                                                </Col>

                                                {/* <Col md="4 mb-3">
                                                    <div>
                                                        <Label for="darkModeIcon"><strong>Dark Mode Icon <span className="red-asterisk">*</span></strong></Label>
                                                        <Input type="file" name="darkmode" onChange={(event) => handlePdfChange(event, 'darkModeIcon')} required/>
                                                        {!selectedPdf || !pdfError && <p style={{ color: 'red' }}>This field is required.</p>}
                                                        {pdfError && <p style={{ color: 'red' }}>{pdfError}</p>}
                                                        {selectedPdf && <p style={{ color: 'green' }}>Selected image: {selectedPdf.name}</p>}
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

<Col md="4 mb-3">
                                                    <Label for="roleDescription"><strong>Daywise</strong></Label>
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
                                                    <Media body className="icon-state switch-sm">
                                                        <Label className="switch">
                                                            <Input type="checkbox" checked={isChecked} onChange={() => setIsChecked(!isChecked)} />
                                                            <span className={"switch-state " + (isChecked ? "bg-success" : "bg-danger")}></span>
                                                        </Label>
                                                    </Media>
                                                    <Media>
                                                        {isChecked ? (
                                                            <Label className="text-success ml-3">Yes</Label>
                                                        ) : (
                                                            <Label className="text-danger ml-3">No</Label>
                                                        )}
                                                    </Media>
                                                </Col>

                                            </Row>

                                           
                                            <div>
                                                {message && <DismissibleNotification message={message} onClose={() => setMessage('')} />}
                                                {/* Your form and other components */}
                                            </div>

                                            <div>
                                                <Button color='primary' type='submit' className="me-3 mt-3">Create Facility</Button>
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

export default CreateFacility;
