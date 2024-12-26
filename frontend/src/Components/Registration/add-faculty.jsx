import React, { Fragment, useState, useEffect } from 'react';
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
import { required, email, Name, Img, PDF, fieldname, Notify, number } from '../Utils/validationUtils';
import debounce from 'lodash.debounce';


import useAuth from '../../Auth/protectedAuth';
import { getToken } from '../../Auth/Auth';


//Utility function used to combine multiple validation functions into a single validation function
const composeValidators = (...validators) => value =>
    validators.reduce((error, validator) => error || validator(value), undefined);

const AddFaculty = () => {
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
    const [selectedcv, setselectedcv] = useState(null);
    const [selectedPdf, setSelectedPdf] = useState(null);
    const [imageError, setImageError] = useState('');
    const [imageErrorforcv, setImageErrorforcv] = useState('');
    const [pdfError, setPdfError] = useState('');
    const [name, setName] = useState('');
    const [nameValidationMessage, setNameValidationMessage] = useState('');
    const [nameTouched, setNameTouched] = useState(false);
    const username = localStorage.getItem('username');
    const [state, setState] = useState([]);
    const [country, setCountry] = useState([]);
    const [facultytype, setfacultytype] = useState([]);
    const [prefixes, setPrefixes] = useState([]);
    


    console.log("Country:", country);


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
            // setState(fetchstate);
            setCountry(fetchcountry);
            setfacultytype(fetchfacultytype);
            

            console.log("Check:", fetchfacultytype);


        } catch (error) {
            console.error('Error fetching dropdown data:', error);
            setLoading(false);
        }
    };





    // Filter out "foodviewallaccess" type

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
            const FacultyData = new FormData();
    
            // Append fields from formData to FormData object
            Object.keys(formData).forEach(key => {
                if (key !== 'prefix' && key !== 'state' && key !== 'country' && key !== 'facultytype') {
                    FacultyData.append(key, formData[key]);
                }
            });
    
            // Append files or other specific data
            FacultyData.append('brightModeIcon', files.brightModeIcon);
            FacultyData.append('Facultycv', files.Facultycv);
    
            // Add username to FormData
            FacultyData.append('publishby', username);
            FacultyData.append('prefix', formData.prefix.value);
            // FacultyData.append('state', formData.state.value); // Ensure formData.state is a valid string representation
            FacultyData.append('country', formData.country.value); // Ensure formData.country is a valid string representation
            FacultyData.append('facultytype', formData.facultytype.value); // Ensure formData.facultytype is a valid string representation
    
            console.log('Form data to send:', FacultyData);
    
            const token = getToken();
            await axios.post(`${BackendAPI}/faculty/addFaculty`, FacultyData, {
                headers: {
                    Authorization: `Bearer ${token}` // Include the token in the Authorization header
                }
            });
    
            SweetAlert.fire({
                title: 'Success!',
                text: 'Faculty Added successfully!',
                icon: 'success',
                timer: 3000,
                showConfirmButton: false,
                allowOutsideClick: false,
                allowEscapeKey: false
            }).then((result) => {
                if (result.dismiss === SweetAlert.DismissReason.timer) {
                    navigate(`${process.env.PUBLIC_URL}/event/manage-faculty/Consoft`);
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
          }
        } else {
          setselectedcv(null);
          setImageErrorforcv('Please select a file.');
        }
      };
      
    



    useEffect(() => {
        fetchDropdown(); // Corrected function name
    }, []);



    const handleNavigation = () => {
        navigate(`${process.env.PUBLIC_URL}/event/manage-faculty/Consoft`);
    };





    return (
        <Fragment>
            <Breadcrumbs parentClickHandler={handleNavigation} mainTitle="Create Faculty" parent="Manage Faculty" title="Create Faculty" />
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
                                                                    <strong>Title <span className="red-asterisk">*</span></strong>{<span className="text-danger"> </span>}
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
                                                    >
                                                        {({ input, meta }) => (
                                                            <div>

                                                                <Label className='form-label' for="lname"><strong>Last Name <span className="red-asterisk">*</span></strong></Label>
                                                                <input
                                                                    {...input}
                                                                    className="form-control"
                                                                    id="lname"
                                                                    type="text"
                                                                    placeholder="Enter Faculty Handing"
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
                                                        validate={composeValidators(required, number)}
                                                    >
                                                        {({ input, meta }) => (
                                                            <div>

                                                                <Label className='form-label' for="mobile"><strong>Mobile No. <span className="red-asterisk">*</span></strong></Label>
                                                                <input
                                                                    
                                                                    {...input}
                                                                    className="form-control"
                                                                    id="mobile"
                                                                    type="number"
                                                                    placeholder="Enter Mobile No"
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



                                                <Col md="4" className="mb-3">
                                                    <Field
                                                        name="facultytype" // Use dynamic field name
                                                        validate={composeValidators(required)}
                                                    >
                                                        {({ input, meta }) => (
                                                            <div>
                                                                <Label className='form-label' for="facultytype">
                                                                    <strong>Faculty type<span className="red-asterisk">*</span></strong>
                                                                </Label>
                                                                <Select
                                                                    {...input}
                                                                    options={
                                                                        facultytype.map(pref => ({ value: pref.facultytype_id, label: pref.type_title }))
                                                                    }

                                                                    // options={[{ value: '', label: 'Select' }, // Adding the "Select" option as the first item
                                                                    // ...state.map(pref => ({ value: pref.cs_state_name, label: pref.cs_state_name }))]}
                                                                    placeholder={`Select faculty type `}
                                                                    isSearchable={true}
                                                                    onChange={(value) => input.onChange(value)}
                                                                    onBlur={input.onBlur}
                                                                    classNamePrefix="react-select"
                                                                />
                                                                {meta.error && meta.touched && <p className='d-block text-danger'>{meta.error}</p>}
                                                            </div>
                                                        )}
                                                    </Field>

                                                </Col>
                                                <Col md="4" className="mb-3">
                                                    <Field
                                                        name="longdescription"
                                                        validate={composeValidators(required, Notify)}
                                                    >
                                                        {({ input, meta }) => (
                                                            <div>

                                                                <Label className='form-label' for="longdescription"><strong>Long Bio <span className="red-asterisk">*</span></strong></Label>
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
                                                        name="description"
                                                        validate={composeValidators(required, Notify)}
                                                    >
                                                        {({ input, meta }) => (
                                                            <div>

                                                                <Label className='form-label' for="description"><strong>Short Bio <span className="red-asterisk">*</span></strong></Label>
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
                                                        name="country"
                                                        validate={composeValidators(required)}
                                                    >
                                                        {({ input, meta }) => (
                                                            <div>
                                                                <Label className="form-label" for="country">
                                                                    <strong>Country <span className="red-asterisk">*</span></strong>
                                                                </Label>
                                                                <Select
                                                                    {...input}
                                                                    options={country.map(cntry => ({ value: cntry.cs_countryCode, label: cntry.cs_country }))}
                                                                    placeholder="Select country"
                                                                    isSearchable={true}
                                                                    onChange={(value) => input.onChange(value)}
                                                                    onBlur={input.onBlur}
                                                                    classNamePrefix="react-select"
                                                                />
                                                                {meta.error && meta.touched && <p className="d-block text-danger">{meta.error}</p>}
                                                            </div>
                                                        )}
                                                    </Field>
                                                </Col>



                                                {/* <Col md="4" className="mb-3">
                                                    <Field
                                                        name="state" // Use dynamic field name
                                                        validate={composeValidators(required)}
                                                    >
                                                        {({ input, meta }) => (
                                                            <div>
                                                                <Label className='form-label' for="state">
                                                                    <strong>State<span className="red-asterisk">*</span></strong>{<span className="text-danger"></span>}
                                                                </Label>
                                                                <Select
                                                                    {...input}
                                                                    options={
                                                                        state.map(pref => ({ value: pref.cs_state_name, label: pref.cs_state_name }))
                                                                    }

                                                                    // options={[{ value: '', label: 'Select' }, // Adding the "Select" option as the first item
                                                                    // ...state.map(pref => ({ value: pref.cs_state_name, label: pref.cs_state_name }))]}
                                                                    placeholder={`Select state`}
                                                                    isSearchable={true}
                                                                    onChange={(value) => input.onChange(value)}
                                                                    onBlur={input.onBlur}
                                                                    classNamePrefix="react-select"
                                                                />
                                                                {meta.error && meta.touched && <p className='d-block text-danger'>{meta.error}</p>}
                                                            </div>
                                                        )}
                                                    </Field>

                                                </Col> */}

                                                <Col md="4" className="mb-3">
                                                    <Field
                                                        name="City"
                                                        validate={composeValidators(required, Notify)}
                                                    >
                                                        {({ input, meta }) => (
                                                            <div>

                                                                <Label className='form-label' for="City"><strong>City <span className="red-asterisk">*</span></strong></Label>
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
                                                <Col md="4 mb-3">
                                                    <div>
                                                        <Label for="brightModeIcon"><strong>Profile picture <span className="red-asterisk">*</span></strong></Label>
                                                        <Input type="file" name="brightmode" onChange={(event) => handleImageChange(event, 'brightModeIcon')} required />
                                                        {imageError && <p style={{ color: 'red' }}>{imageError}</p>}
                                                        {selectedImage && <p style={{ color: 'green' }}>Selected icon: {selectedImage.name}</p>}
                                                    </div>
                                                </Col>

                                                <Col md="4" className="mb-3">
                                                <div>
                                                    <Label for="Facultycv"><strong>CV</strong></Label>
                                                    <Input 
                                                    type="file" 
                                                    name="Facultycv" 
                                                    accept="application/pdf" 
                                                    onChange={(event) => handleImageChange1(event, 'Facultycv')} 
                                                    />
                                                    {imageErrorforcv && <p style={{ color: 'red' }}>{imageErrorforcv}</p>}
                                                    {selectedcv && <p style={{ color: 'green' }}>Selected document: {selectedcv.name}</p>}
                                                </div>
                                                </Col>


                                                <Col md="4" className="mb-3">
                                                    <Field
                                                        name="Website"
                                                        
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



                                            <div>
                                                <Button color='primary' type='submit' className="me-2 mt-3">Save</Button>
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

export default AddFaculty;
