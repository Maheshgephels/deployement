import React, { Fragment, useState, useEffect, useRef, useContext } from 'react';
import { Container, Row, Col, Input, Label, Button, Card, CardBody, Modal, ModalHeader, ModalBody, ModalFooter, Popover, PopoverHeader, PopoverBody } from 'reactstrap';
import { useForm } from 'react-hook-form';
import axios from 'axios';
import { BackendAPI } from '../../api';
import SweetAlert from 'sweetalert2';
import { Breadcrumbs } from '../../AbstractElements';
import { useNavigate } from 'react-router-dom';
import Select from 'react-select';
import { Field, Form } from 'react-final-form';
import { required, FacName, Img, Email, ContactPerson, Contact, BanImg, Description, Address, Website, option } from '../Utils/validationUtils';
import debounce from 'lodash.debounce';
import useAuth from '../../Auth/protectedAuth';
import { getToken } from '../../Auth/Auth';
import { toast } from 'react-toastify';
import GrapesEditor from '../GrapesEditor/GrapesEditor';
import { PermissionsContext } from '../../contexts/PermissionsContext';
import styled from 'styled-components';
// import './MobilePreview.css'

const composeValidators = (...validators) => value =>
    validators.reduce((error, validator) => error || validator(value), undefined);

// const RedAsterisk = styled.span`
//   color: red;
// `;


const AddExhibitor = () => {
    useAuth();
    const [isChecked, setIsChecked] = useState([]); // Initialize isChecked state
    const [files, setFiles] = useState({ exhIcon: '', darkModeIcon: '' });
    const [data, setData] = useState([]);
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [modal, setModal] = useState(false);
    const { register, handleSubmit, formState: { errors } } = useForm();
    const [selectedImage, setSelectedImage] = useState(null);
    const [selectedIcon, setSelectedIcon] = useState(null);
    const [imageError, setImageError] = useState('');
    const [iconError, setIconError] = useState('');
    const [name, setName] = useState('');
    const [nameValidationMessage, setNameValidationMessage] = useState('');
    const [nameTouched, setNameTouched] = useState(false);
    const [mode, setMode] = useState([]);
    const [sponsor, setSponsor] = useState([]);
    const [formDataToSend, setFormDataToSend] = useState(null);
    const [showGrapesEditor, setShowGrapesEditor] = useState(false);
    const [exhType, setExhType] = useState([]); // State variable to track selected page type
    const [showRemaining, setShowRemaining] = useState(false);
    const [imageOpen, setImageOpen] = useState(false);
    const [iconOpen, setIconOpen] = useState(false);
    const [iconPreviewUrl, setIconPreviewUrl] = useState(null);
    const [imagePreviewUrl, setImagePreviewUrl] = useState(null);
    const iconAvailableRef = useRef(null);
    const RedAsterisk = () => <span className="text-danger">*</span>;
    const { permissions } = useContext(PermissionsContext);


    console.log("Type:", exhType);

    const handleCancel = () => {
        setModal(true);
    };

    useEffect(() => {
        fetchSponsor(); // Corrected function name
    }, [permissions]);

    const fetchSponsor = async () => {
        try {
            const token = getToken();
            const response = await axios.get(`${BackendAPI}/exhibitor/getSponsor`, {
                headers: {
                    Authorization: `Bearer ${token}` // Include the token in the Authorization header
                }
            });

            setSponsor(response.data.sponData);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching facility types:', error);
            setLoading(false);
        }
    };

    const onSubmit = async (values) => {
        const selectedType = values.eType ? values.eType.value : ''; // Ensure correct access to the selected value

        console.log("Selected Type:", selectedType); // Debugging log

        const formData = {
            ...values,
            eType: selectedType, // Assuming eType determines directlink or customeditor
            show_type: values.show_type ? 1 : 0,
            show_listing: values.show_listing ? 1 : 0,
            show_detail: values.show_detail ? 1 : 0
        };

        try {
            const formDataToSend = new FormData();

            Object.keys(formData).forEach(key => {
                formDataToSend.append(key, formData[key]);
            });

            formDataToSend.append('exhIcon', files.exhIcon);
            formDataToSend.append('exhImage', files.exhImage);

            console.log("Data to send", formDataToSend);

            // Uncomment for actual API submission  
            const token = getToken();

            const response = await axios.post(`${BackendAPI}/exhibitor/storeExhibitor`, formDataToSend, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'multipart/form-data'
                }
            });

            SweetAlert.fire({
                title: 'Success!',
                text: 'Exhibitor created successfully!',
                icon: 'success',
                timer: 3000,
                showConfirmButton: false,
                allowOutsideClick: false,
                allowEscapeKey: false
            }).then((result) => {
                if (result.dismiss === SweetAlert.DismissReason.timer) {
                    setShowGrapesEditor(false);
                    navigate(`${process.env.PUBLIC_URL}/event/manage-exhibitor/Consoft`);
                }
            });

        } catch (error) {
            console.error('Error creating page:', error.message);
        }
    };





    const handleIconChange = async (event, type) => {
        const file = event.target.files[0];

        if (file) {
            setFiles(prevFiles => ({ ...prevFiles, [type]: file }));
            setSelectedIcon(file); // Update selectedImage state
            const url = URL.createObjectURL(file);
            setIconPreviewUrl(url);
        }
        try {
            await Img(file); // Wait for the Promise to resolve
            setIconError('');
        } catch (error) {
            setSelectedIcon(null);
            setIconError(error);
        }
    };


    const handleImageChange = async (event, type) => {
        const file = event.target.files[0];

        if (file) {
            setFiles(prevFiles => ({ ...prevFiles, [type]: file }));
            setSelectedImage(file); // Update selectedImage state
            const url = URL.createObjectURL(file);
            setImagePreviewUrl(url);
        }
        try {
            await BanImg(file); // Wait for the Promise to resolve
            setImageError('');
        } catch (error) {
            setSelectedImage(null);
            setImageError(error);
        }
    };






    const validatename = debounce(async (value) => {
        if (nameValidationMessage) {
            return; // Prevent form submission if there is a validation error
        }
        try {
            // Call the API to check name availability
            const token = getToken();
            const response = await axios.post(`${BackendAPI}/exhibitor/check-exhibitor-name`, { eName: value }, {
                headers: {
                    Authorization: `Bearer ${token}` // Include the token in the Authorization header
                }
            });

            console.log('Server response:', response);
            if (!response.data.available) {
                setNameValidationMessage('Exhibitor name already exists');
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
    }, [name, nameTouched, permissions]);

    // Extract Workshops component
    const ExhibitorsPermissions = permissions['Exhibitors'];

    const handleNavigation = () => {
        navigate(`${process.env.PUBLIC_URL}/event/manage-exhibitor/Consoft`);
    };

    if (showGrapesEditor) {
        return <GrapesEditor formDataToSend={formDataToSend} navigate={navigate} />;
    }

    const sponserOptions = sponsor.map(spon => ({
        value: spon.spon_name,
        label: spon.spon_name
    }));

    return (
        <Fragment>
            <Breadcrumbs parentClickHandler={handleNavigation} mainTitle="Create Exhibitor" parent="Manage Exhibitor" title="Create Exhibitor" />
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
                                                        name="eName"
                                                        validate={composeValidators(required, FacName)}
                                                    >
                                                        {({ input, meta }) => (
                                                            <div>
                                                                {/* <Label className='form-label' for="exhname"><strong>Exhibitor Name <span className="red-asterisk">*</span></strong></Label> */}
                                                                <Label className='form-label' for="exhname">
                                                                    <strong>Exhibitor Name <span className="red-asterisk">*</span></strong>
                                                                </Label>
                                                                <input
                                                                    {...input}
                                                                    className="form-control"
                                                                    id="exhname"
                                                                    type="text"
                                                                    placeholder="Enter Exhibitor Name"
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

                                                {/* <Col md="4" className="mb-3">
                                                    <Field
                                                        name="eType"
                                                        validate={option}
                                                    >
                                                        {({ input, meta }) => (
                                                            <div>
                                                                <Label className='form-label' for="eventday"><strong>Select Exhibitor Type <span className="red-asterisk">*</span></strong></Label>
                                                                <Select
                                                                    {...input}
                                                                    options={[
                                                                        { value: 'Platinum', label: 'Platinum' },
                                                                        { value: 'Gold', label: 'Gold' },
                                                                        { value: 'Silver', label: 'Silver' }

                                                                    ]}
                                                                    placeholder={`Select Exhibitor Type`}
                                                                    isSearchable={true}
                                                                    onChange={(value) => {
                                                                        input.onChange(value);
                                                                        setExhType(value); // Update state based on selection
                                                                    }}
                                                                    onBlur={input.onBlur}
                                                                    classNamePrefix="react-select"
                                                                    isMulti={false}
                                                                    value={input.value}
                                                                />
                                                                {meta.error && meta.touched && <p className='d-block text-danger'>{meta.error}</p>}
                                                            </div>
                                                        )}
                                                    </Field>
                                                </Col> */}

                                                <Col md="4" className="mb-3">
                                                    <Field
                                                        name="eType"
                                                        validate={option}
                                                    >
                                                        {({ input, meta }) => (
                                                            <div>
                                                                <Label className='form-label' for="eventday"><strong>Select Exhibitor Type <span className="red-asterisk">*</span></strong></Label>
                                                                <Select
                                                                    {...input}
                                                                    options={sponserOptions}
                                                                    placeholder={`Select Exhibitor Type`}
                                                                    isSearchable={true}
                                                                    onChange={(value) => {
                                                                        input.onChange(value);
                                                                        setExhType(value); // Update state based on selection
                                                                    }}
                                                                    onBlur={input.onBlur}
                                                                    classNamePrefix="react-select"
                                                                    isMulti={false}
                                                                    value={input.value}
                                                                />
                                                                {meta.error && meta.touched && <p className='d-block text-danger'>{meta.error}</p>}
                                                            </div>
                                                        )}
                                                    </Field>
                                                </Col>



                                                <Col md='4' className='mb-3'>
                                                    <Field
                                                        name="eDesc"
                                                        validate={composeValidators(Description)}
                                                    >
                                                        {({ input, meta }) => (
                                                            <div>
                                                                <Label className='form-label' for="desc"><strong>Exhibitor Description</strong> <small>(750 Words)</small></Label>
                                                                <Input
                                                                    {...input}
                                                                    className="form-control"
                                                                    id="desc"
                                                                    type="textarea"
                                                                    placeholder="Enter Exhibitor Description"
                                                                />
                                                                {meta.error && meta.touched && <p className='d-block text-danger'>{meta.error}</p>}
                                                            </div>
                                                        )}
                                                    </Field>
                                                </Col>


                                            </Row>

                                            <Row>
                                                <Col md='4' className='mb-3'>
                                                    <Field
                                                        name="ePerson"
                                                    >
                                                        {({ input, meta }) => (
                                                            <div>
                                                                <Label className='form-label' for="person"><strong>Exhibitor Contact Person</strong></Label>
                                                                <Input
                                                                    {...input}
                                                                    className="form-control"
                                                                    id="person"
                                                                    type="text"
                                                                    placeholder="Enter Contact Person Name"
                                                                />
                                                                {meta.error && meta.touched && <p className='d-block text-danger'>{meta.error}</p>}
                                                            </div>
                                                        )}
                                                    </Field>
                                                </Col>

                                                <Col md='4 mb-3'>
                                                    <Field
                                                        name="email"
                                                        validate={composeValidators(Email)}
                                                    >
                                                        {({ input, meta }) => (
                                                            <div>

                                                                <Label className='form-label' for="email"><strong>Email</strong></Label>
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
                                                        name="eContact"
                                                        validate={composeValidators(Contact)}
                                                    >
                                                        {({ input, meta }) => (
                                                            <div>

                                                                <Label className='form-label' for="contact"><strong>Contact Number</strong></Label>
                                                                <input
                                                                    {...input}
                                                                    className="form-control"
                                                                    id="contact"
                                                                    type="text"
                                                                    placeholder="Enter contact number"
                                                                />
                                                                {meta.error && meta.touched && <p className='d-block text-danger'>{meta.error}</p>}
                                                            </div>
                                                        )}
                                                    </Field>
                                                </Col>


                                            </Row>

                                            <Row>

                                                <Col md='4' className='mb-3'>
                                                    <Field
                                                        name="eAddress"
                                                        validate={composeValidators(Address)}
                                                    >
                                                        {({ input, meta }) => (
                                                            <div>
                                                                <Label className='form-label' for="address"><strong>Exhibitor Address</strong></Label>
                                                                <Input
                                                                    {...input}
                                                                    className="form-control"
                                                                    id="address"
                                                                    type="textarea"
                                                                    placeholder="Enter exhibitor address"
                                                                />
                                                                {meta.error && meta.touched && <p className='d-block text-danger'>{meta.error}</p>}
                                                            </div>
                                                        )}
                                                    </Field>
                                                </Col>

                                                <Col md='4' className='mb-3'>
                                                    <Field
                                                        name="eWebsite"
                                                        validate={composeValidators(Website)}
                                                    >
                                                        {({ input, meta }) => (
                                                            <div>
                                                                <Label className='form-label' for="website"><strong>Exhibitor Website</strong></Label>
                                                                <input
                                                                    {...input}
                                                                    className="form-control"
                                                                    id="website"
                                                                    type="text"
                                                                    placeholder="Enter exhibitor website"
                                                                />
                                                                {meta.error && meta.touched && <p className='d-block text-danger'>{meta.error}</p>}
                                                            </div>
                                                        )}
                                                    </Field>
                                                </Col>

                                                <Col md="4" className="mb-3">
                                                    <div>
                                                        <Label for="exhIcon">
                                                            <strong>Exhibitor Icon <span className="red-asterisk">*</span></strong>
                                                        </Label>
                                                        <Input
                                                            type="file"
                                                            name="exhicon"
                                                            onChange={(event) => handleIconChange(event, 'exhIcon')}
                                                            required
                                                        />
                                                        {iconError && <p style={{ color: 'red' }}>{iconError}</p>}

                                                        {/* Conditionally render the preview text */}
                                                        {iconPreviewUrl && !iconError && (
                                                            <p
                                                                ref={iconAvailableRef}
                                                                style={{ color: 'green', cursor: 'pointer' }}
                                                                onMouseEnter={() => setIconOpen(true)}
                                                                onMouseLeave={() => setIconOpen(false)}
                                                            >
                                                                ✔️ Exhibitor Icon Preview
                                                            </p>
                                                        )}

                                                        <Popover
                                                            placement="right"
                                                            isOpen={iconOpen}
                                                            target={iconAvailableRef.current} // Use ref for the target
                                                            toggle={() => setIconOpen(!iconOpen)}
                                                        >
                                                            <PopoverHeader>Exhibitor Icon Preview</PopoverHeader>
                                                            <PopoverBody>
                                                                {iconPreviewUrl ? (
                                                                    <img src={iconPreviewUrl} alt="Current Exhibitor Icon" style={{ maxWidth: '200px' }} />
                                                                ) : (
                                                                    <p>No icon selected</p>
                                                                )}
                                                            </PopoverBody>
                                                        </Popover>
                                                    </div>

                                                    {!selectedIcon && (
                                                        <small className="form-text text-muted">
                                                            <strong>Image Size:</strong> 200KB Max <br />
                                                            <strong>Dimensions:</strong> 600(H) × 600(W) <br />
                                                            <strong>Image Type:</strong> PNG
                                                        </small>
                                                    )}
                                                </Col>



                                            </Row>

                                            <Row>

                                                {/* <Col md="4 mb-3">
                                                    <div>
                                                        <Label for="exhImage"><strong>Exhibition Image <span className="red-asterisk">*</span></strong></Label>
                                                        <Input type="file" name="exhImage" onChange={(event) => handleImageChange(event, 'exhImage')} required />
                                                        {imageError && <p style={{ color: 'red' }}>{imageError}</p>}
                                                    </div>
                                                </Col> */}

                                                <Col md="4" className="mb-3">
                                                    <div>
                                                        <Label for="exhIcon">
                                                            <strong>Exhibitor Image</strong>
                                                        </Label>
                                                        <Input
                                                            type="file"
                                                            name="exhImage"
                                                            onChange={(event) => handleImageChange(event, 'exhImage')}
                                                        />
                                                        {imageError && <p style={{ color: 'red' }}>{imageError}</p>}

                                                        {/* Conditionally render the preview text */}
                                                        {imagePreviewUrl && !imageError && (
                                                            <p
                                                                ref={iconAvailableRef}
                                                                style={{ color: 'green', cursor: 'pointer' }}
                                                                onMouseEnter={() => setImageOpen(true)}
                                                                onMouseLeave={() => setImageOpen(false)}
                                                            >
                                                                ✔️ Banner Image Preview
                                                            </p>
                                                        )}

                                                        <Popover
                                                            placement="right"
                                                            isOpen={imageOpen}
                                                            target={iconAvailableRef.current} // Use ref for the target
                                                            toggle={() => setImageOpen(!imageOpen)}
                                                        >
                                                            <PopoverHeader>Exhibitor Image Preview</PopoverHeader>
                                                            <PopoverBody>
                                                                {imagePreviewUrl ? (
                                                                    <img src={imagePreviewUrl} alt="Current Exhibitor Image" style={{ maxWidth: '200px' }} />
                                                                ) : (
                                                                    <p>No image selected</p>
                                                                )}
                                                            </PopoverBody>
                                                        </Popover>
                                                    </div>
                                                    {!selectedImage && (
                                                        <small className="form-text text-muted">
                                                            <strong>Image Size:</strong> 300KB Max <br />
                                                            <strong>Dimensions:</strong> 2000(W) × 600(H) <br />
                                                            <strong>Image Type:</strong> PNG, JPG, JPEG
                                                        </small>

                                                    )}
                                                </Col>


                                            </Row>

                                            <Row>
                                                <Col md="8" className="mb-3">
                                                    <Field
                                                        name="show_type"
                                                        type="checkbox"
                                                    >
                                                        {({ input, meta }) => (
                                                            <div>
                                                                <input
                                                                    {...input}
                                                                    id="sType"
                                                                    onChange={(e) => {
                                                                        input.onChange(e);
                                                                        setShowRemaining(e.target.checked);
                                                                    }}
                                                                />
                                                                <Label className='form-check-label' style={{ marginLeft: '10px' }} for="sType">
                                                                    <strong>Should the exhibitor type be visible in the event app exhibitor ?</strong>
                                                                </Label>
                                                                {meta.error && meta.touched && <p className='d-block text-danger'>{meta.error}</p>}
                                                            </div>
                                                        )}
                                                    </Field>
                                                </Col>
                                            </Row>

                                            {showRemaining && (
                                                <>
                                                    <Row>
                                                        <Col md="8" className="mb-3">
                                                            <Field
                                                                name="show_listing"
                                                                type="checkbox"
                                                            >
                                                                {({ input, meta }) => (
                                                                    <div>
                                                                        <input
                                                                            {...input}
                                                                            id="sListing"
                                                                        />
                                                                        <Label className='form-check-label' style={{ marginLeft: '10px' }} for="sListing">
                                                                            <strong>Should the exhibitor type be visible in the event app exhibitor listing ?</strong>
                                                                        </Label>
                                                                        {meta.error && meta.touched && <p className='d-block text-danger'>{meta.error}</p>}
                                                                    </div>
                                                                )}
                                                            </Field>
                                                        </Col>
                                                    </Row>

                                                    <Row>
                                                        <Col md="8" className="mb-3">
                                                            <Field
                                                                name="show_detail"
                                                                type="checkbox"
                                                            >
                                                                {({ input, meta }) => (
                                                                    <div>
                                                                        <input
                                                                            {...input}
                                                                            id="sDetail"
                                                                        />
                                                                        <Label className='form-check-label' style={{ marginLeft: '10px' }} for="sDetail">
                                                                            <strong>Should the exhibitor type be visible in the  event app exhibitor detail page?</strong>
                                                                        </Label>
                                                                        {meta.error && meta.touched && <p className='d-block text-danger'>{meta.error}</p>}
                                                                    </div>
                                                                )}
                                                            </Field>
                                                        </Col>
                                                    </Row>
                                                </>
                                            )}


                                            {ExhibitorsPermissions?.add === 1 && (
                                                <div className="d-flex justify-content-between mt-3">
                                                    <div>

                                                        <Button color='primary' type='submit' className="me-2">Create Exhibitor</Button>
                                                        <Button color='warning' onClick={handleCancel}>Cancel</Button>

                                                    </div>

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

export default AddExhibitor;