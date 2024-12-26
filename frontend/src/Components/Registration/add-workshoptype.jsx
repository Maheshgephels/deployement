import React, { Fragment, useState, useEffect, useRef , useContext} from 'react';
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
import { PermissionsContext } from '../../contexts/PermissionsContext';


import useAuth from '../../Auth/protectedAuth';
import { getToken } from '../../Auth/Auth';


//Utility function used to combine multiple validation functions into a single validation function
const composeValidators = (...validators) => value =>
    validators.reduce((error, validator) => error || validator(value), undefined);

const AddRegWorkshopType = () => {
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
    const { permissions } = useContext(PermissionsContext);


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

    
    const AddWorkshopPermissions = permissions['RegWorkshoptype'];

    const onSubmit = async (formData, event) => {
        if (nameValidationMessage) {
            return; // Prevent form submission if there is a validation error
        }
       
  

        try {
            console.log('Form data to send:', formData);
            const token = getToken();
            await axios.post(`${BackendAPI}/regWorkshop/addworkshoptype`, formData, {
                headers: {
                    Authorization: `Bearer ${token}` // Include the token in the Authorization header
                }
            });

            SweetAlert.fire({
                title: 'Success!',
                text: 'Workshop Type created successfully!',
                icon: 'success',
                timer: 3000,
                showConfirmButton: false,
                allowOutsideClick: false,
                allowEscapeKey: false ,
                allowOutsideClick: false,
                allowEscapeKey: false // Disable clicking outside the modal
            }).then((result) => {
                if (result.dismiss === SweetAlert.DismissReason.timer) {
                    navigate(`${process.env.PUBLIC_URL}/registration/manage-reg-workshoptype/Consoft`);
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
            const response = await axios.post(`${BackendAPI}/regWorkshop/check-workshoptype-name`, { dName: value }, {
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
        navigate(`${process.env.PUBLIC_URL}/registration/manage-reg-workshoptype/Consoft`);
    };





    return (
        <Fragment>
            <Breadcrumbs parentClickHandler={handleNavigation} mainTitle="Create Workshop Type" parent="Manage Workshop Type" title="Create Workshop Type" />
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
                                                        validate={composeValidators(required, Name)}
                                                    >
                                                        {({ input, meta }) => (
                                                            <div>

                                                                <Label className='form-label' for="displayname"><strong>Workshop Type Name <span className="red-asterisk">*</span></strong></Label>
                                                                <input
                                                                    {...input}
                                                                    className="form-control"
                                                                    id="displayname"
                                                                    type="text"
                                                                    placeholder="Enter Workshop type name"
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

                                              

                                             


                                            </Row>

                                               

{AddWorkshopPermissions?.add === 1 && (
                                                <div>
                                                <Button color='primary' type='submit' className="me-2 mt-3">Create Workshop Type</Button>
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

export default AddRegWorkshopType;
