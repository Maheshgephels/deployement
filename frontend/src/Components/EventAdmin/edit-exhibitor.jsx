import React, { Fragment, useState, useEffect, useContext } from 'react';
import { Container, Row, Col, Input, Label, Button, Card, CardBody, Modal, ModalHeader, ModalBody, ModalFooter, Popover, PopoverHeader, PopoverBody } from 'reactstrap';
import { useForm } from 'react-hook-form';
import axios from 'axios';
import { BackendAPI, BackendPath } from '../../api';
import SweetAlert from 'sweetalert2';
import { Breadcrumbs } from '../../AbstractElements';
import { useNavigate, useLocation } from 'react-router-dom';
import Select from 'react-select';
import { Field, Form } from 'react-final-form';
import { required, FacName, Img, Email, ContactPerson, Contact, BanImg, Description, Address, Website, option } from '../Utils/validationUtils';
import debounce from 'lodash.debounce';
import useAuth from '../../Auth/protectedAuth';
import { getToken } from '../../Auth/Auth';
import { toast } from 'react-toastify';
import { Tooltip } from 'react-tooltip';
import GrapesEditor from '../GrapesEditor/GrapesEditor';
import styled from 'styled-components';
import { PermissionsContext } from '../../contexts/PermissionsContext';


const composeValidators = (...validators) => value =>
    validators.reduce((error, validator) => error || validator(value), undefined);

const RedAsterisk = styled.span`
  color: red;
`;


const EditExhibitor = () => {
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
    const [name, setName] = useState('');
    const [sponsor, setSponsor] = useState([]);
    const [nameValidationMessage, setNameValidationMessage] = useState('');
    const [nameTouched, setNameTouched] = useState(false);
    const [mode, setMode] = useState([]);
    const [formDataToSend, setFormDataToSend] = useState(null);
    const [showGrapesEditor, setShowGrapesEditor] = useState(false);
    const [exhType, setExhType] = useState([]); // State variable to track selected page type
    const location = useLocation();
    const { item } = location.state;
    const [initialData, setInitialData] = useState({});
    const [showRemaining, setShowRemaining] = useState(item.show_type);
    const [logoOpen, setLogoOpen] = useState(false);
    const [imageOpen, setImageOpen] = useState(false);
    const [iconPreviewUrl, setIconPreviewUrl] = useState(null);
    const [imagePreviewUrl, setImagePreviewUrl] = useState(null);
    const { permissions } = useContext(PermissionsContext);



    console.log("Box", showRemaining);
    console.log("Selected Option", exhType);



    useEffect(() => {
        setShowRemaining(item.show_type);
    }, [item.show_type, permissions]);

    // Extract Workshops component
    const ExhibitorsPermissions = permissions['Exhibitors'];

    const handleShowTypeChange = (e, input) => {
        const isChecked = e.target.checked;
        const value = isChecked ? 1 : 0;
        input.onChange(value);
        setShowRemaining(value);
    };


    console.log("Data:", exhType);

    useEffect(() => {
        setInitialData({
            eName: item.exh_name,
            eType: item.exh_type,
            eDesc: item.exh_description,
            ePerson: item.exh_contact_person,
            email: item.exh_email,
            eContact: item.exh_contact,
            eAddress: item.exh_address,
            eWebsite: item.exh_website,
            // show_type: item.show_type,
            // show_listing: item.show_listing,
            // show_detail: item.show_detail
        });
    }, [item]);

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





    const handleCancel = () => {
        setModal(true);
    };

    const onSubmit = async (values) => {
        if (nameValidationMessage) {
            return; // Prevent form submission if there is a validation error
        }
        const exh_id = item.exh_id;
        const selectedType = values.eType ? values.eType.value : ''; // Ensure correct access to the selected value


        console.log("Data to send", values);

        // Function to convert boolean to 1 or 0
        const convertBooleanToNumber = (value) => value ? 1 : 0;

        const show_type = values.type;
        const show_listing = show_type ? convertBooleanToNumber(values.listing) : 0;
        const show_detail = show_type ? convertBooleanToNumber(values.detail) : 0;

        // Compare current values with initial data
        const updatedFields = {};
        Object.keys(values).forEach(key => {
            if (values[key] !== initialData[key]) {
                updatedFields[key] = values[key];
            }
        });

        // Ensure eDesc is included even if it's empty
        updatedFields.eDesc = values.eDesc || '';
        updatedFields.ePerson = values.ePerson || '';
        updatedFields.email = values.email || '';
        updatedFields.eContact = values.eContact || '';
        updatedFields.eAddress = values.eAddress || '';
        updatedFields.eWebsite = values.eWebsite || '';




        // Check if files are new or different
        if (files.exhIcon) updatedFields.exhIcon = files.exhIcon;
        if (files.exhImage) updatedFields.exhImage = files.exhImage;

        // Create a FormData object
        const formDataToSend = new FormData();
        formDataToSend.append('exh_id', exh_id);
        formDataToSend.append('show_type', show_type);
        formDataToSend.append('show_listing', show_listing);
        formDataToSend.append('show_detail', show_detail);
        formDataToSend.append('e_Type', selectedType);
        Object.keys(updatedFields).forEach(key => {
            formDataToSend.append(key, updatedFields[key]); // Always append the key and value
        });

        console.log("Data to send", formDataToSend);

        try {
            const token = getToken();
            const response = await axios.post(`${BackendAPI}/exhibitor/updateExhibitor`, formDataToSend, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'multipart/form-data'
                }
            });

            SweetAlert.fire({
                title: 'Success!',
                text: 'Exhibitor updated successfully!',
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
            console.error('Error updating exhibitor:', error.message);
        }
    };

    // const onSubmit = async (values) => {
    //     const exh_id = item.exh_id;

    //     const show_type_1 = values.show_type ? 1 : 0;
    //     const show_lisiting_1 = values.show_type ? 1 : 0;
    //     const show_detail_1 = values.show_type ? 1 : 0;




    //     console.log("1",show_type_1);
    //     console.log("2",show_lisiting_1);
    //     console.log("3",show_detail_1);


    //     // Function to convert boolean to 1 or 0
    //     // const convertBooleanToNumber = (value) => value ? 1 : 0;

    //     // Compare current values with initial data
    //     const updatedFields = {};
    //     Object.keys(values).forEach(key => {
    //         if (values[key] !== initialData[key]) {
    //             if (typeof values[key] === 'boolean') {
    //                 updatedFields[key] = convertBooleanToNumber(values[key]);
    //             } else {
    //                 updatedFields[key] = values[key];
    //             }
    //         }
    //     });

    //     // Check if files are new or different
    //     if (files.exhIcon) updatedFields.exhIcon = files.exhIcon;
    //     if (files.exhImage) updatedFields.exhImage = files.exhImage;

    //     // Create a FormData object
    //     const formDataToSend = new FormData();
    //     formDataToSend.append('exh_id', exh_id); // Add exh_id to FormData
    //     Object.keys(updatedFields).forEach(key => {
    //         if (updatedFields[key] !== undefined) {
    //             formDataToSend.append(key, updatedFields[key]);
    //         }
    //     });

    //     console.log("Data to send", formDataToSend);

    //     try {
    //         const token = getToken();
    //         const response = await axios.post(`${BackendAPI}/exhibitor/updateExhibitor`, formDataToSend, {
    //             headers: {
    //                 Authorization: `Bearer ${token}`,
    //                 'Content-Type': 'multipart/form-data'
    //             }
    //         });

    //         SweetAlert.fire({
    //             title: 'Success!',
    //             text: 'Exhibitor updated successfully!',
    //             icon: 'success',
    //             timer: 3000,
    //             showConfirmButton: false,
    //             allowOutsideClick: false,
    //             allowEscapeKey: false
    //         }).then((result) => {
    //             if (result.dismiss === SweetAlert.DismissReason.timer) {
    //                 setShowGrapesEditor(false);
    //                 navigate(`${process.env.PUBLIC_URL}/event/manage-exhibitor/Consoft`);
    //             }
    //         });

    //     } catch (error) {
    //         console.error('Error updating exhibitor:', error.message);
    //     }
    // };







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
            setImageError('');
        } catch (error) {
            setSelectedIcon(null);
            setImageError(error);
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
            await BanImg(file); // Wait for the Promise to resolve
            setImageError('');
        } catch (error) {
            setSelectedImage(null);
            setImageError(error);
        }
    };






    const validatename = debounce(async (value) => {
        try {

            if (value === item.exh_name) {
                // Skip validation if the name is the same as the current name
                setNameValidationMessage('');
                return;
            }

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
    }, [name, nameTouched]);

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
            <Breadcrumbs parentClickHandler={handleNavigation} mainTitle="Edit Exhibitor" parent="Manage Exhibitor" title="Edit Exhibitor" />
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
                                                        initialValue={item.exh_name}
                                                    >
                                                        {({ input, meta }) => (
                                                            <div>
                                                                <Label className='form-label' for="exhname"><strong>Exhibitor Name <span className="red-asterisk">*</span></strong></Label>
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
                                                        initialValue={item.exh_type}
                                                    >
                                                        {({ input, meta }) => {
                                                            // Define options locally
                                                            const options = [
                                                                { value: 'Platinum', label: 'Platinum' },
                                                                { value: 'Gold', label: 'Gold' },
                                                                { value: 'Silver', label: 'Silver' }
                                                            ];

                                                            // Find the selected option based on the input value
                                                            const selectedOption = options.find(option => option.value === input.value);

                                                            return (
                                                                <div>
                                                                    <Label className='form-label' for="eventday">
                                                                        <strong>Select Exhibitor Type <span className="red-asterisk">*</span></strong>
                                                                    </Label>
                                                                    <Select
                                                                        {...input}
                                                                        options={options}
                                                                        placeholder={`Select Exhibitor Type`}
                                                                        isSearchable={true}
                                                                        onChange={(value) => {
                                                                            input.onChange(value.value); // Update form state
                                                                            setExhType(value.value); // Update local state if needed
                                                                        }}
                                                                        onBlur={input.onBlur}
                                                                        classNamePrefix="react-select"
                                                                        isMulti={false}
                                                                        value={selectedOption} // Use the selectedOption
                                                                    />
                                                                    {meta.error && meta.touched && <p className='d-block text-danger'>{meta.error}</p>}
                                                                </div>
                                                            );
                                                        }}
                                                    </Field>
                                                </Col> */}

                                                <Col md="4" className="mb-3">
                                                    <Field
                                                        name="eType"
                                                        validate={option}
                                                        initialValue={item.exh_type}
                                                    >
                                                        {({ input, meta }) => {
                                                            const selectedOption = sponserOptions.find(option => option.value === input.value);

                                                            console.log("Selected Option", selectedOption);

                                                            return (
                                                                <div>
                                                                    <Label className='form-label' for="eventday"><strong>Select Exhibitor Type <span className="red-asterisk">*</span></strong></Label>
                                                                    <Select
                                                                        {...input}
                                                                        options={sponserOptions}
                                                                        placeholder="Select Exhibitor Type"
                                                                        isSearchable={true}
                                                                        onChange={(value) => {
                                                                            input.onChange(value);
                                                                            setExhType(value); // Update state based on selection
                                                                        }}
                                                                        onBlur={input.onBlur}
                                                                        classNamePrefix="react-select"
                                                                        isMulti={false}
                                                                        value={selectedOption}
                                                                    />
                                                                    {meta.error && meta.touched && <p className='d-block text-danger'>{meta.error}</p>}
                                                                </div>
                                                            );
                                                        }}
                                                    </Field>
                                                </Col>

                                                {/* <Col md="4" className="mb-3">
                                                    <Field
                                                        name="eType"
                                                        validate={option}
                                                        initialValue={item.exh_type}

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
                                                </Col> */}






                                                <Col md='4' className='mb-3'>
                                                    <Field
                                                        name="eDesc"
                                                        validate={composeValidators(Description)}
                                                        initialValue={item.exh_description || ''}
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
                                                        initialValue={item.exh_contact_person}
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
                                                        initialValue={item.exh_email}
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
                                                        initialValue={item.exh_contact}
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
                                                        initialValue={item.exh_address}
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
                                                        initialValue={item.exh_website}
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



                                                {/* Exhibitor Icon */}
                                                <Col md="4" className="mb-3">
                                                    <div>
                                                        <Label for="exhIcon"><strong>Exhibitor Icon <span className="red-asterisk">*</span></strong></Label>
                                                        <Input
                                                            type="file"
                                                            name="exhicon"
                                                            onChange={(event) => handleIconChange(event, 'exhIcon')}
                                                            required={!item.exh_logo}
                                                        />
                                                        {imageError && <p style={{ color: 'red' }}>{imageError}</p>}
                                                        {!imageError && (
                                                            <p
                                                                id="iconAvailable"
                                                                style={{ color: 'green', cursor: 'pointer' }}
                                                                onMouseEnter={() => setLogoOpen(true)}
                                                                onMouseLeave={() => setLogoOpen(false)}
                                                            >
                                                                ✔️ Exhibitor Icon Preview
                                                            </p>
                                                        )}

                                                        <Popover
                                                            placement="right"
                                                            isOpen={logoOpen}
                                                            target="iconAvailable"
                                                            toggle={() => setLogoOpen(!logoOpen)}
                                                        >
                                                            <PopoverHeader>Exhibitor Icon Preview</PopoverHeader>
                                                            {/* <PopoverBody>
                                                                <img src={`${BackendPath}${item.exh_logo}`} alt="Current Exhibitor Icon" style={{ maxWidth: '200px' }} />
                                                            </PopoverBody> */}
                                                            <PopoverBody>
                                                                {iconPreviewUrl ? (
                                                                    <img src={iconPreviewUrl} alt="Current Exhibitor Icon" style={{ maxWidth: '200px' }} />
                                                                ) : (
                                                                    <img src={`${BackendPath}${item.exh_logo}`} alt="Current Exhibitor Icon" style={{ maxWidth: '200px' }} />
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

                                                {/* Exhibition Image */}
                                                <Col md="4" className="mb-3">
                                                    <div>
                                                        <Label for="exhImage"><strong>Exhibition Image</strong></Label>
                                                        <Input
                                                            type="file"
                                                            name="exhImage"
                                                            onChange={(event) => handleImageChange(event, 'exhImage')}
                                                        />
                                                        {imageError && <p style={{ color: 'red' }}>{imageError}</p>}
                                                        {!imageError && (
                                                            <p
                                                                id="imageAvailable"
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
                                                            target="imageAvailable"
                                                            toggle={() => setImageOpen(!imageOpen)}
                                                        >
                                                            <PopoverHeader>Exhibition Image Preview</PopoverHeader>
                                                            {/* <PopoverBody>
                                                                <img src={`${BackendPath}${item.exh_image}`} alt="Current Exhibition Image" style={{ maxWidth: '200px' }} />
                                                            </PopoverBody> */}
                                                            <PopoverBody>
                                                                {iconPreviewUrl ? (
                                                                    <img src={iconPreviewUrl} alt="Current Exhibitor image" style={{ maxWidth: '200px' }} />
                                                                ) : (
                                                                    <img src={`${BackendPath}${item.exh_image}`} alt="Current Exhibitor image" style={{ maxWidth: '200px' }} />
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
                                                        name="type"
                                                        type="checkbox"
                                                        initialValue={item.show_type}
                                                    >
                                                        {({ input, meta }) => (
                                                            <div>
                                                                <input
                                                                    {...input}
                                                                    id="sType"
                                                                    // onChange={(e) => {
                                                                    //     input.onChange(e);
                                                                    //     setShowRemaining(e.target.checked);
                                                                    // }}
                                                                    onChange={(e) => handleShowTypeChange(e, input)}

                                                                />
                                                                <Label className='form-check-label' style={{ marginLeft: '10px' }} for="sType">
                                                                    <strong>Should the exhibitor type be visible in the event app exhibitor?</strong>
                                                                </Label>
                                                                {meta.error && meta.touched && <p className='d-block text-danger'>{meta.error}</p>}
                                                            </div>
                                                        )}
                                                    </Field>
                                                </Col>
                                            </Row>

                                            {showRemaining !== 0 && (
                                                <>
                                                    <Row>
                                                        <Col md="8" className="mb-3">
                                                            <Field
                                                                name="listing"
                                                                type="checkbox"
                                                                initialValue={item.show_listing}
                                                            >
                                                                {({ input, meta }) => (
                                                                    <div>
                                                                        <input
                                                                            {...input}
                                                                            id="sListing"
                                                                        />
                                                                        <Label className='form-check-label' style={{ marginLeft: '10px' }} for="sListing">
                                                                            <strong>Should the exhibitor type be visible in the event app exhibitor listing?</strong>
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
                                                                name="detail"
                                                                type="checkbox"
                                                                initialValue={item.show_detail}
                                                            >
                                                                {({ input, meta }) => (
                                                                    <div>
                                                                        <input
                                                                            {...input}
                                                                            id="sDetail"
                                                                        />
                                                                        <Label className='form-check-label' style={{ marginLeft: '10px' }} for="sDetail">
                                                                            <strong>Should the exhibitor type be visible in the event app exhibitor detail page?</strong>
                                                                        </Label>
                                                                        {meta.error && meta.touched && <p className='d-block text-danger'>{meta.error}</p>}
                                                                    </div>
                                                                )}
                                                            </Field>
                                                        </Col>
                                                    </Row>
                                                </>
                                            )}


                                            {ExhibitorsPermissions?.edit === 1 && (
                                                <div className="d-flex justify-content-between mt-3">
                                                    <div>
                                                        <Button color='primary' type='submit' className="me-2">Update Exhibitor</Button>
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

export default EditExhibitor;