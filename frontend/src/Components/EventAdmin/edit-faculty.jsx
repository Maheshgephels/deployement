
import React, { Fragment, useEffect, useState, useContext, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { Container, Row, Col, Card, Label, Button, CardBody, Modal, ModalHeader, ModalBody, ModalFooter, Input, FormFeedback, Popover, PopoverHeader, PopoverBody, UncontrolledPopover } from 'reactstrap';
import axios from 'axios';
import { BackendAPI, BackendPath } from '../../api';
import { Field, Form } from 'react-final-form';
import { required, email, Name, Img, PDF, fieldname, Notify, number, shortbio, longbio } from '../Utils/validationUtils';
import CustomizerContext from '../../_helper/Customizer';
import { Link, useNavigate } from 'react-router-dom';
import { Breadcrumbs } from '../../AbstractElements';
import { MdDelete, MdInfoOutline } from "react-icons/md";
import SweetAlert from 'sweetalert2';
import debounce from 'lodash.debounce';
import useAuth from '../../Auth/protectedAuth';
import { getToken } from '../../Auth/Auth';
import Select from 'react-select';
import styled from 'styled-components';
import { PermissionsContext } from '../../contexts/PermissionsContext';

const composeValidators = (...validators) => value =>
    validators.reduce((error, validator) => error || validator(value), undefined);

const Editfaculty = () => {
    useAuth();
    const [Faculty, setFaculty] = useState({}); // State to store Faculty data
    const { layoutURL } = useContext(CustomizerContext);
    const [modal, setModal] = useState(false);
    const location = useLocation();
    const { catName } = location.state;
    const { FacultyId, Facultyname } = location.state;
    const navigate = useNavigate();
    const [name, setName] = useState('');
    const [nameValidationMessage, setNameValidationMessage] = useState('');
    const [nameTouched, setNameTouched] = useState(false);
    const [FacilityName, setFacilityName] = useState('');
    const [newRoleDescription, setNewRoleDescription] = useState('');
    const [isChecked, setIsChecked] = useState([]); // Initialize isChecked state
    const [files, setFiles] = useState({ brightModeIcon: '', darkModeIcon: '' });
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const initialValue = '';
    const [selectedFacilityType, setSelectedFacilityType] = useState(initialValue);
    const [selectedImage, setSelectedImage] = useState(null);
    const [selectedPdf, setSelectedPdf] = useState(null);
    const [imageError, setImageError] = useState('');
    const [pdfError, setPdfError] = useState('');
    const username = localStorage.getItem('username');
    const [state, setState] = useState([]);
    const [country, setCountry] = useState([]);
    const [facultytype, setfacultytype] = useState([]);
    const [prefixes, setPrefixes] = useState([]);
    const { permissions } = useContext(PermissionsContext);
    const [selectedcv, setselectedcv] = useState(null);

    const [imageErrorforcv, setImageErrorforcv] = useState('');
    const [imagePreview, setImagePreview] = useState(Faculty.photo || null);
    const [pdfPreview, setPdfPreview] = useState(null);
    const [adminServerName, setAdminServerName] = useState('');

    const [logoOpen, setLogoOpen] = useState(false);
    const [imageOpen, setImageOpen] = useState(false);
    const [iconPreviewUrl, setIconPreviewUrl] = useState(null);
    const [imagePreviewUrl, setImagePreviewUrl] = useState(null);
    const iconAvailableRef = useRef(null);



    useEffect(() => {
        fetchFaculty(); // Fetch Faculty data when component mounts
    }, []);

    const RedAsterisk = styled.span`
  color: red;
`;


    const fetchDropdown = async () => {
        try {
            const token = getToken();
            const response = await axios.get(`${BackendAPI}/faculty/getDropdownData`, {
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
            setState(fetchstate);
            setCountry(fetchcountry);
            setfacultytype(fetchfacultytype);

            console.log("Check:", fetchfacultytype);


        } catch (error) {
            console.error('Error fetching dropdown data:', error);
            setLoading(false);
        }
    };

    const fetchFaculty = async () => {
        try {
            const token = getToken();
            const response = await axios.post(`${BackendAPI}/faculty/editFaculty`, { FacultyId }, {
                headers: {
                    Authorization: `Bearer ${token}` // Include the token in the Authorization header
                }
            });
            console.log('Data from API:', response.data);
            setFaculty(response.data[0]); // Set Faculty data to the first item in the response array
        } catch (error) {
            console.error('Error fetching Faculty data:', error);
        }
    };

    useEffect(() => {
        fetchadminserver(); // Fetch Faculty data when component mounts
    }, [permissions]);

    // Extract Facultys component
    const FacultysPermissions = permissions['ManageFaculty'];

    const fetchadminserver = async () => {
        try {
            const token = getToken();
            const response = await axios.get(`${BackendAPI}/faculty/adminserver`, {
                headers: {
                    Authorization: `Bearer ${token}` // Include the token in the Authorization header
                }
            });
            console.log('server', response.data);


            const data = response.data;
            console.log('data', data);
            // Assuming `adminserver_name` is the field you need
            setAdminServerName(data.adminserver_name || '');

        } catch (error) {
            console.error('Error fetching Faculty data:', error);
        }
    };




    // const handleCancel = () => {
    //     const URL = '/Faculty/';
    //     navigate(`${process.env.PUBLIC_URL}${URL}${layoutURL}`);
    // };
    const handleCancel = () => {
        setModal(true);
    };

    const handleNavigation = () => {
        navigate(`${process.env.PUBLIC_URL}/event/manage-faculty/Consoft`);
    };


    const onSubmit = async (formData) => {
        if (nameValidationMessage) {
            return; // Prevent form submission if there is a validation error
        }
        try {
            // Prepare FormData with formData fields
            const FacultyData = new FormData();

            Object.keys(formData).forEach(key => {
                if (key !== 'prefix' && key !== 'country' && key !== 'facultytype') {
                    FacultyData.append(key, formData[key]);
                }
            });

            // Append file to FormData if exists

            FacultyData.append('brightModeIcon', files.brightModeIcon);
            FacultyData.append('Facultycv', files.Facultycv);


            // Include FacultyId in the payload
            FacultyData.append('prefix', formData.prefix);
            FacultyData.append('FacultyId', FacultyId);
            // FacultyData.append('state', formData.state); // Ensure formData.state is a valid string representation
            FacultyData.append('country', formData.country); // Ensure formData.country is a valid string representation
            FacultyData.append('facultytype', formData.facultytype); //

            const token = getToken();
            // Send formData to server
            const response = await axios.post(`${BackendAPI}/faculty/updateFaculty`, FacultyData, {
                headers: {
                    Authorization: `Bearer ${token}` // Include the token in the Authorization header
                }
            });

            // Handle server response
            if (response.status === 200) {
                console.log('Faculty updated successfully');
                // Show success message to the user
                SweetAlert.fire({
                    title: 'Success!',
                    text: 'Changes updated successfully!',
                    icon: 'success',
                    timer: 3000,
                    showConfirmButton: false,
                    allowOutsideClick: false,
                    allowEscapeKey: false
                }).then((result) => {
                    if (result.dismiss === SweetAlert.DismissReason.timer) {
                        navigate(`${process.env.PUBLIC_URL}/event/manage-faculty/${layoutURL}`);
                    }
                });
            } else {
                // Handle unexpected status codes
                console.error('Error updating Faculty:', response.data.message);
            }
        } catch (error) {
            // Handle network error or other exceptions
            console.error('Error updating Faculty:', error.message);
        }
    };



    // const handleImageChange = async (event, type) => {
    //     const file = event.target.files[0];
    //     if (file) {
    //         try {
    //             await Img(file);
    //             setFiles(prevFiles => ({ ...prevFiles, [type]: file }));
    //             setSelectedImage(file);
    //             const url = URL.createObjectURL(file);
    //             setIconPreviewUrl(url);
    //         } catch (error) {
    //             setSelectedImage(null);
    //             setImageError(error);
    //         }
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

    const handleImageChange1 = async (event, type) => {
        const file = event.target.files[0];
        if (file) {
            setFiles(prevFiles => ({ ...prevFiles, [type]: file }));
            const errorMessage = PDF(file); // Validate the file
            if (errorMessage) {
                setselectedcv(null);
                setImageErrorforcv(errorMessage);
            } else {
                setselectedcv(file); // Update selectedImage state
                setImageErrorforcv('');
                const reader = new FileReader();
                reader.onloadend = () => {
                    setPdfPreview(reader.result);
                };
                reader.readAsDataURL(file);
            }
        } else {
            setselectedcv(null);
            // setImageErrorforcv('Please select a file.');
            setPdfPreview(null);
        }
    };


    useEffect(() => {
        fetchDropdown(); // Corrected function name
    }, []);



    const currentImagePath = Faculty.photo ? `${adminServerName}${Faculty.photo}` : '';
    const currentPdfPath = Faculty.resume ? `${adminServerName}${Faculty.resume}` : '';



    return (
        <Fragment>
            <Breadcrumbs parentClickHandler={handleNavigation} mainTitle={
                <>
                    Edit Faculty
                    <MdInfoOutline
                        id="userPopover"
                        style={{
                            cursor: 'pointer', position: 'absolute', marginLeft: '5px'
                        }}
                    />
                    <UncontrolledPopover
                        placement="bottom"
                        target="userPopover"
                        trigger="focus"
                    >
                        <PopoverBody>
                            You can manage faculty information from here. Details such as Name, Designation, Bio, and Country will be displayed on the faculty page in the Event App. <br />
                            Faculty will be categorized according to Faculty type in the Event App.
                        </PopoverBody>
                    </UncontrolledPopover>
                </>
            } parent="Manage Faculty" title="Edit Faculty" />
            <Container fluid={true}>

                <Row>
                    <Col sm="12">
                        <Card>
                            <CardBody>
                                {/* <p>Admin Server Name: {adminServerName}</p> */}
                                <p className='text-danger'>Note:- First Name, Last Name, Mobile No, and Email fields are non-editable here. For modifications, visit the user listing and edit the fields</p>
                                <Form onSubmit={onSubmit}>
                                    {({ handleSubmit }) => (
                                        <form className='needs-validation' noValidate='' onSubmit={handleSubmit}>

                                            <Row>
                                                {/* <Col md="4" className="mb-3">
                                                 <Label className='form-label' for="prefix"><strong>Title <span className="red-asterisk">*</span></strong></Label>
                                                    <Field
                                                        name="prefix" // Use dynamic field name
                                                        validate={composeValidators(required)}
                                                        initialValue={Faculty.ntitle || ''}
                                                    >
                                                           {({ input, meta }) => (
                                                            <div>
                                                                <select
                                                                    {...input}
                                                                    className="form-control"
                                                                    id="selectmethod"
                                                                    disabled
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

                                                </Col> */}
                                                <Col md="4" className="mb-3">
                                                    <Field
                                                        name="fName"
                                                        validate={composeValidators(required, Notify)}
                                                        initialValue={Faculty.fname || ''}
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
                                                                    disabled
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
                                                        name="mName"
                                                        initialValue={Faculty.mname || ''}
                                                    >
                                                        {({ input, meta }) => (
                                                            <div>

                                                                <Label className='form-label' for="mName"><strong>Middle Name</strong></Label>
                                                                <input
                                                                    {...input}
                                                                    className="form-control"
                                                                    id="mName"
                                                                    type="text"
                                                                    placeholder="Enter Middle Name"
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
                                                        initialValue={Faculty.lname || ''}
                                                    >
                                                        {({ input, meta }) => (
                                                            <div>

                                                                <Label className='form-label' for="lname"><strong>last Name <span className="red-asterisk">*</span></strong></Label>
                                                                <input
                                                                    {...input}
                                                                    className="form-control"
                                                                    id="lname"
                                                                    type="text"
                                                                    placeholder="Enter Faculty last name"
                                                                    disabled
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
                                                        name="mobile"

                                                        initialValue={Faculty.contact1 || ''}
                                                    >
                                                        {({ input, meta }) => (
                                                            <div>

                                                                <Label className='form-label' for="mobile"><strong>Contact Number <span className="red-asterisk">*</span></strong></Label>
                                                                <input
                                                                    {...input}
                                                                    className="form-control"
                                                                    id="mobile"
                                                                    type="number"
                                                                    placeholder="Enter Contact Number"
                                                                    disabled
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

                                                        initialValue={Faculty.email1 || ''}
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
                                                                    disabled
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
                                                    <Label className='form-label' for="type">
                                                        <strong>Faculty type <span className="red-asterisk">*</span></strong>
                                                    </Label>
                                                    <Field
                                                        name="facultytype"
                                                        validate={composeValidators(required)}
                                                        initialValue={Faculty.facultytype_id || ''}
                                                    >
                                                        {({ input, meta }) => (
                                                            <div>
                                                                <select
                                                                    {...input}
                                                                    className="form-control"
                                                                    id="selectmethod"
                                                                >
                                                                    <option value="" disabled>Select Faculty type</option>
                                                                    {facultytype.map((option) => (
                                                                        <option key={option.facultytype_id} value={option.facultytype_id}>
                                                                            {option.type_title}
                                                                        </option>
                                                                    ))}
                                                                </select>
                                                                {meta.error && meta.touched && (
                                                                    <FormFeedback className='d-block text-danger'>
                                                                        {meta.error}
                                                                    </FormFeedback>
                                                                )}
                                                            </div>
                                                        )}
                                                    </Field>
                                                </Col>



                                                <Col md="4" className="mb-3">
                                                    <Field
                                                        name="designation"

                                                        initialValue={Faculty.designation || ''}
                                                    >
                                                        {({ input, meta }) => (
                                                            <div>

                                                                <Label className='form-label' for="designation"><strong>Designation</strong></Label>
                                                                <input
                                                                    {...input}
                                                                    className="form-control"
                                                                    id="designation"
                                                                    type="text"
                                                                    placeholder="Enter designation"

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
                                                        name="description"
                                                        validate={composeValidators(shortbio)}
                                                        initialValue={Faculty.description || ''}
                                                    >
                                                        {({ input, meta }) => (
                                                            <div>

                                                                {/* <Label className='form-label' for="description"><strong>Bio </strong></Label> */}
                                                                <Label className='form-label' for="description"><strong>Bio <span className="red-asterisk">*</span></strong> <small>(250 Words)</small></Label>
                                                                <Field name="description">
                                                                    {({ input }) => (
                                                                        <Input {...input} type="textarea" id="description" placeholder="Enter Faculty description" />
                                                                    )}

                                                                </Field>
                                                                {meta.error && meta.touched && <p className='d-block text-danger'>{meta.error}</p>}

                                                            </div>
                                                        )}


                                                    </Field>
                                                </Col>

                                                <Col md="4" className="mb-3">
                                                    <Field
                                                        name="longdescription"
                                                        validate={composeValidators(longbio)}
                                                        initialValue={Faculty.long_description || ''}
                                                    >
                                                        {({ input, meta }) => (
                                                            <div>

                                                                <Label className='form-label' for="longdescription"><strong>Long Bio</strong><small>(1000 Words)</small></Label>
                                                                <Field name="longdescription">
                                                                    {({ input }) => (
                                                                        <Input {...input} type="textarea" id="longdescription" placeholder="Enter Faculty Long description" />
                                                                    )}

                                                                </Field>
                                                                {meta.error && meta.touched && <p className='d-block text-danger'>{meta.error}</p>}

                                                            </div>
                                                        )}


                                                    </Field>
                                                </Col>



                                                <Col md="4" className="mb-3">
                                                    <Field
                                                        name="City"
                                                        initialValue={Faculty.city || ''}
                                                    >
                                                        {({ input, meta }) => (
                                                            <div>

                                                                <Label className='form-label' for="City"><strong>City</strong></Label>
                                                                <input
                                                                    {...input}
                                                                    className="form-control"
                                                                    id="City"
                                                                    type="text"
                                                                    placeholder="Enter City"
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
                                                    <Label className='form-label' for="type"><strong>Country <span className="red-asterisk">*</span></strong></Label>
                                                    <Field
                                                        name="country" // Use dynamic field name
                                                        validate={composeValidators(required)}
                                                        initialValue={Faculty.country}
                                                    >
                                                        {({ input, meta }) => (
                                                            <div>
                                                                <select
                                                                    {...input}
                                                                    className="form-control"
                                                                    id="selectmethod"
                                                                >
                                                                    <option value="">Select country</option>
                                                                    {country.map((option) => (
                                                                        <option key={option.cs_countryCode} value={option.cs_countryCode}>
                                                                            {option.cs_country}
                                                                        </option>
                                                                    ))}
                                                                </select>
                                                                {meta.error && meta.touched && <FormFeedback className='d-block text-danger'>{meta.error}</FormFeedback>}
                                                            </div>
                                                        )}
                                                    </Field>
                                                </Col>

                                                {/* <Col md="4" className="mb-3">
                                                    <Label for="brightModeIcon">
                                                        <strong>Profile Image</strong>
                                                    </Label>
                                                    <Input
                                                        type="file"
                                                        name="brightmode"
                                                        onChange={(event) => handleImageChange(event, 'brightModeIcon')}
                                                    />
                                                    {imageError && <p style={{ color: 'red' }}>{imageError}</p>}
                                                    {imagePreview && (
                                                        <div>
                                                            <p style={{ color: 'green' }}>Current Profile:</p>
                                                            <img
                                                                src={imagePreview}
                                                                alt="Profile"
                                                                style={{ width: '100px', height: '100px', objectFit: 'cover' }}
                                                            />
                                                        </div>
                                                    )}
                                                    {!imagePreview && Faculty.photo && (
                                                        <div>
                                                            <p style={{ color: 'green' }}>Current Profile:</p>
                                                            <img
                                                                src={currentImagePath}
                                                                alt="Profile"
                                                                style={{ width: '100px', height: '100px', objectFit: 'cover' }}
                                                            />
                                                        </div>
                                                    )}
                                                </Col> */}

                                                <Col md="4" className="mb-3">
                                                    <Field
                                                        name="Website"
                                                        initialValue={Faculty.website_link}

                                                    >
                                                        {({ input, meta }) => (
                                                            <div>

                                                                <Label className='form-label' for="Website"><strong>Website</strong></Label>
                                                                <input
                                                                    {...input}
                                                                    className="form-control"
                                                                    id="Website"
                                                                    type="text"
                                                                    placeholder="Enter faculty Website"
                                                                    onChange={(e) => {
                                                                        input.onChange(e); // Trigger onChange of the Field component

                                                                    }}
                                                                />

                                                                {meta.error && meta.touched && <p className='d-block text-danger'>{meta.error}</p>}

                                                            </div>
                                                        )}
                                                    </Field>

                                                </Col>

                                                {/* Faculty Profile */}
                                                <Col md="4" className="mb-3">
                                                    <div>
                                                        <Label for="brightModeIcon"><strong>Profile Image</strong></Label>
                                                        <Input
                                                            type="file"
                                                            name="brightModeIcon"
                                                            onChange={(event) => handleImageChange(event, 'brightModeIcon')}
                                                        />
                                                        {imageError && <p style={{ color: 'red' }}>{imageError}</p>}
                                                        {!imageError && (iconPreviewUrl || Faculty.photo) && (
                                                            <p
                                                                ref={iconAvailableRef}
                                                                style={{ color: 'green', cursor: 'pointer' }}
                                                                onMouseEnter={() => setLogoOpen(true)}
                                                                onMouseLeave={() => setLogoOpen(false)}
                                                            >
                                                                ✔️ Faculty Profile Preview
                                                            </p>
                                                        )}


                                                        <Popover
                                                            placement="right"
                                                            isOpen={logoOpen}
                                                            target={iconAvailableRef.current} // Use ref for the target
                                                            toggle={() => setLogoOpen(!logoOpen)}
                                                        >
                                                            <PopoverHeader>Faculty Profile Preview</PopoverHeader>
                                                            {/* <PopoverBody>
                                                                <img src={`${BackendPath}${item.exh_logo}`} alt="Current Exhibitor Icon" style={{ maxWidth: '200px' }} />
                                                            </PopoverBody> */}
                                                            <PopoverBody>
                                                                {iconPreviewUrl ? (
                                                                    <img src={iconPreviewUrl} alt="Current faculty Icon" style={{ maxWidth: '200px' }} />
                                                                ) : (
                                                                    <img src={`${BackendPath}${Faculty.photo}`} alt="Current faculty Icon" style={{ maxWidth: '200px' }} />
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



                                                {/* <Col md="4" className="mb-3">
                                                    <div>
                                                        <Label for="Facultycv"><strong>CV</strong></Label>
                                                        <Input
                                                            type="file"
                                                            name="Facultycv"
                                                            accept="application/pdf"
                                                            onChange={(event) => handleImageChange1(event, 'Facultycv')}
                                                        />
                                                        {imageErrorforcv && <p style={{ color: 'red' }}>{imageErrorforcv}</p>}
                                                        {<p style={{ color: 'green' }}>Selected document: {Faculty.resume}</p>}
                                                    </div>
                                                </Col> */}



                                                <Col md="4" className="mb-3">
                                                    <div>
                                                        <Label for="Facultycv">
                                                            <strong>CV</strong>
                                                        </Label>
                                                        <Input
                                                            type="file"
                                                            name="Facultycv"
                                                            accept="application/pdf"
                                                            onChange={(event) => handleImageChange1(event, 'Facultycv')}
                                                        />
                                                        {imageErrorforcv && <p style={{ color: 'red' }}>{imageErrorforcv}</p>}
                                                        {pdfPreview && (
                                                            <div>
                                                                <p style={{ color: 'green' }}>Preview:</p>
                                                                <embed
                                                                    src={pdfPreview}
                                                                    type="application/pdf"
                                                                    width="100%"
                                                                    height="200px"
                                                                // style={{ border: '1px solid #ccc' }}
                                                                />
                                                            </div>
                                                        )}
                                                        {Faculty.resume && !selectedcv && (
                                                            <div>
                                                                {/* <p style={{ color: 'green' }}>Current CV:</p> */}
                                                                <a href={`${BackendPath}${Faculty.resume}`} target="_blank" rel="noopener noreferrer" style={{ color: 'green', cursor: 'pointer' }}>
                                                                    ✔️ Click to open Current CV
                                                                </a>
                                                            </div>
                                                        )}
                                                    </div>
                                                </Col>




                                            </Row>


                                            {/* <small className="form-text text-muted">Note: For icon change visit facility page.</small> Help text for pagination */}

                                            {FacultysPermissions?.edit === 1 && (
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

export default Editfaculty;
