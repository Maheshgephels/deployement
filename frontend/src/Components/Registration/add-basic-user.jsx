import React, { Fragment, useState, useEffect, useContext } from 'react';
import { Container, Row, Col, Input, Label, Button, Card, CardBody, Modal, ModalHeader, FormFeedback, ModalBody, ModalFooter, Media, PopoverBody, UncontrolledPopover } from 'reactstrap';
import { useForm } from 'react-hook-form';
import axios from 'axios';
import { BackendAPI } from '../../api';
import SweetAlert from 'sweetalert2';
// import { Input } from 'antd';
import { Breadcrumbs } from '../../AbstractElements';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { MdDelete, MdInfoOutline } from "react-icons/md";
import Select from 'react-select';
import { Field, Form } from 'react-final-form'; // Import Field and Form from react-final-form
import { required, email, NAME, Img, PDF, option, number, radio, username1, password ,expiryDate } from '../Utils/validationUtils';
import moment from 'moment';
import { PermissionsContext } from '../../contexts/PermissionsContext';
import useAuth from '../../Auth/protectedAuth';
import { getToken } from '../../Auth/Auth';




//Utility function used to combine multiple validation functions into a single validation function
const composeValidators = (...validators) => value =>
    validators.reduce((error, validator) => error || validator(value), undefined);

const AddBasicUser = () => {
    useAuth();
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modal, setModal] = useState(false);
    const [fieldLabels, setFieldLabels] = useState([]);
    const [fieldType, setFieldType] = useState([]);
    const [requiredfield, setRequiredField] = useState([]); // Define requiredfield state
    const [fieldId, setFieldId] = useState([]);
    const [fieldName, setFieldName] = useState([]);
    const navigate = useNavigate(); // Initialize useHistory
    const location = useLocation();
    const [prefixes, setPrefixes] = useState([]);
    const [state, setState] = useState([]);
    const [country, setCountry] = useState([]);
    const [regCat, setRegCat] = useState([]);
    const [workshop, setWorkshop] = useState([]);
    const [dayType, setDayType] = useState([]);
    const [custom, setCustom] = useState([]);
    const [username, setusername] = useState([]);
    const { permissions } = useContext(PermissionsContext);



    const empty = '';



    console.log("Category", regCat);




    useEffect(() => {
        fetchFields(); // Corrected function name
    }, [permissions]);

    useEffect(() => {
        fetchDropdown(); // Corrected function name
    }, []);

    // Extract Add User setting Permissions component
    const AddUserPermissions = permissions['AddBasicUser'];

    const fetchFields = async () => {
        try {
            const token = getToken();
            const response = await axios.get(`${BackendAPI}/reguser/getBasicField`, {
                headers: {
                    Authorization: `Bearer ${token}` // Include the token in the Authorization header
                }
            });
            const fieldsData = response.data.Fields;
            const requiredfield = fieldsData.map(field => field.cs_is_required);
            const fieldLabels = fieldsData.map(field => field.cs_field_label);
            const fieldType = fieldsData.map(field => field.field_type_name);
            const fieldId = fieldsData.map(field => field.cs_field_id);
            const fieldName = fieldsData.map(field => field.cs_field_name);

            setData(fieldsData);
            setFieldLabels(fieldLabels);
            setFieldType(fieldType);
            setFieldName(fieldName);
            setRequiredField(requiredfield); // Set requiredfield state
            setFieldId(fieldId);
            setLoading(false);

            // console.log('Id:', fieldName);
        } catch (error) {
            console.error('Error fetching Fields:', error);
            setLoading(false);
        }
    };

    const handleCancel = () => {
        setModal(true);
    };

    const onSubmit = async (formData) => {
        // Extract the registration category ID from the formData
        // const cs_reg_cat_id = formData.cs_reg_category.id; 
        // console.log("ID", cs_reg_cat_id);

        try {
            // Initialize an empty object to hold non-empty form data
            const values = {};

            // Loop through the formData to filter out empty fields
            for (const key in formData) {
                if (Object.hasOwnProperty.call(formData, key)) {
                    // Only add fields with non-empty values
                    if (formData[key].value !== '') {
                        values[key] = formData[key].value || formData[key];
                    }
                }
            }

            // Manually add cs_reg_cat_id to the values object
            // values.cs_reg_cat_id = cs_reg_cat_id; 

            console.log('Formatted form data to send:', values);

            // Get the token for authorization
            const token = getToken();

            // Make the API call to add the basic user
            const response = await axios.post(`${BackendAPI}/reguser/addBasicUser`, values, {
                headers: {
                    Authorization: `Bearer ${token}` // Pass the token in the Authorization header
                }
            });

            // If the user is successfully created, show a success message
            if (response.data.success) {
                SweetAlert.fire({
                    title: 'Success!',
                    html: `Basic user created successfully!`,
                    icon: 'success',
                    timer: 3000,
                    showConfirmButton: false,
                    allowOutsideClick: false,
                    allowEscapeKey: false
                }).then((result) => {
                    // Navigate to another page after success
                    if (result.dismiss === SweetAlert.DismissReason.timer) {
                        navigate(`${process.env.PUBLIC_URL}/registration/basic-user-listing/Consoft`);
                    }
                });
            }
        } catch (error) {
            // Log any errors that occur during the request
            console.error('Error creating user:', error.message);
        }
    };

    const validateUniqueUsername = async (value) => {
        try {
            // const response = await axios.get(`/api/check-username/${value}`);
            const token = getToken();
            const response = await axios.get(`${BackendAPI}/reguser/check-username/${value}`, {
                headers: {
                    Authorization: `Bearer ${token}` // Include the token in the Authorization header
                }
            });
            if (response.data.exists) {
                return 'Username already taken';
            }
        } catch (error) {
            return 'Error checking username';
        }
        return undefined;
    };






    const fetchDropdown = async () => {
        try {
            const token = getToken();
            const response = await axios.get(`${BackendAPI}/reguser/getDropdownData`, {
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
            const fetchTicket = response.data.ticket;


            setPrefixes(fetchprefixes);
            setState(fetchstate);
            setCountry(fetchcountry);

            setRegCat(fetchregcat);
            setWorkshop(fetchworkshop);
            setDayType(fetchdaytype);
            setCustom(fetchCutomData);


            console.log(fetchprefixes);


        } catch (error) {
            console.error('Error fetching dropdown data:', error);
            setLoading(false);
        }
    };


    const handleNavigation = () => {
        navigate(`${process.env.PUBLIC_URL}/registration/basic-user-listing/Consoft`);
    };



    return (
        <Fragment>
            <Breadcrumbs parentClickHandler={handleNavigation} mainTitle={
                <>
                    Create Basic User
                    <MdInfoOutline
                        id="addPopover"
                        style={{
                            cursor: 'pointer', position: 'absolute', marginLeft: '5px'
                        }}
                    />
                    <UncontrolledPopover
                        placement="bottom"
                        target="addPopover"
                        trigger="focus"
                    >
                        <PopoverBody>
                            Use the <strong>Create User</strong> feature to register a new user and ensure all required information is accurately entered before creating.
                        </PopoverBody>
                    </UncontrolledPopover>
                </>
            } parent="Manage Basic Users" title="Create Basic User" />
            <Container fluid={true}>
                <Row>
                    <Col sm="12">
                        <Card>
                            <CardBody>
                                <Form onSubmit={onSubmit}
                                >
                                    {({ handleSubmit }) => (
                                        <form className="needs-validation" noValidate="" onSubmit={handleSubmit}>
                                            <Row className="d-flex flex-wrap">
                                                {fieldLabels.map((label, index) => {
                                                    const isFieldRequired = requiredfield[index] === '1'; // Use string comparison for clarity

                                                    return (
                                                        <Col
                                                            key={index}
                                                            xs={12}  // Full width for small devices
                                                            sm={6}   // Half width for medium devices
                                                            md={4}   // One-third width for larger devices
                                                            className="mb-3"
                                                        >
                                                            {/* Render fields based on their type */}
                                                            {fieldType[index] === 'Dropdown' && fieldLabels[index] === 'Title' && (
                                                                <Field
                                                                    name={fieldName[index]} // Use dynamic field name
                                                                    validate={isFieldRequired ? composeValidators(option) : undefined}
                                                                >
                                                                    {({ input, meta }) => (
                                                                        <div>
                                                                            <Label className='form-label' for={`displayname${index}`}>
                                                                                <strong>{label}</strong>{isFieldRequired && <span className="text-danger"> *</span>}
                                                                            </Label>
                                                                            <Select
                                                                                {...input}
                                                                                options={isFieldRequired ?
                                                                                    prefixes.map(pref => ({ value: pref.cs_prefix, label: pref.cs_prefix })) :
                                                                                    [{ value: '', label: 'Select' }, ...prefixes.map(pref => ({ value: pref.cs_prefix, label: pref.cs_prefix }))]
                                                                                }
                                                                                placeholder={`Select ${label}`}
                                                                                isSearchable={true}
                                                                                onChange={(value) => input.onChange(value)}
                                                                                onBlur={input.onBlur}
                                                                                classNamePrefix="react-select"
                                                                            />
                                                                            {meta.error && meta.touched && <p className='d-block text-danger'>{meta.error}</p>}
                                                                        </div>
                                                                    )}
                                                                </Field>
                                                            )}


                                                            {fieldType[index] === 'Dropdown' && fieldLabels[index] === 'State' && (
                                                                <Field
                                                                    name={`${fieldName[index]}`} // Use dynamic field name
                                                                    validate={requiredfield[index] === '1' ? composeValidators(option) : (value) => composeValidators()(value)}
                                                                >
                                                                    {({ input, meta }) => (
                                                                        <div>
                                                                            <Label className='form-label' for={`displayname${index}`}>
                                                                                <strong>{label}</strong>{requiredfield[index] === '1' && <span className="text-danger"> *</span>}
                                                                            </Label>
                                                                            <Select
                                                                                {...input}
                                                                                options={requiredfield[index] === '1' ?
                                                                                    state.map(pref => ({ value: pref.cs_state_name, label: pref.cs_state_name })) :
                                                                                    [
                                                                                        { value: '', label: 'Select' }, // Adding the "Select" option as the first item
                                                                                        ...state.map(pref => ({ value: pref.cs_state_name, label: pref.cs_state_name }))
                                                                                    ]
                                                                                }

                                                                                // options={[{ value: '', label: 'Select' }, // Adding the "Select" option as the first item
                                                                                // ...state.map(pref => ({ value: pref.cs_state_name, label: pref.cs_state_name }))]}
                                                                                placeholder={`Select ${label}`}
                                                                                isSearchable={true}
                                                                                onChange={(value) => input.onChange(value)}
                                                                                onBlur={input.onBlur}
                                                                                classNamePrefix="react-select"
                                                                            />
                                                                            {meta.error && meta.touched && <p className='d-block text-danger'>{meta.error}</p>}
                                                                        </div>
                                                                    )}
                                                                </Field>
                                                            )}

                                                            {fieldType[index] === 'Dropdown' && fieldLabels[index] === 'Country' && (
                                                                <Field
                                                                    name={`${fieldName[index]}`} // Use dynamic field name
                                                                    validate={requiredfield[index] === '1' ? composeValidators(option) : (value) => composeValidators()(value)}
                                                                >
                                                                    {({ input, meta }) => (
                                                                        <div>
                                                                            <Label className='form-label' for={`displayname${index}`}>
                                                                                <strong>{label}</strong>{requiredfield[index] === '1' && <span className="text-danger"> *</span>}
                                                                            </Label>
                                                                            <Select
                                                                                {...input}
                                                                                options={requiredfield[index] === '1' ?
                                                                                    country.map(pref => ({ value: pref.cs_country, label: pref.cs_country })) :
                                                                                    [
                                                                                        { value: '', label: 'Select' }, // Adding the "Select" option as the first item
                                                                                        ...country.map(pref => ({ value: pref.cs_country, label: pref.cs_country }))
                                                                                    ]
                                                                                }

                                                                                // options={[{ value: '', label: 'Select' }, // Adding the "Select" option as the first item
                                                                                // ...country.map(pref => ({ value: pref.cs_country, label: pref.cs_country }))]}
                                                                                placeholder={`Select ${label}`}
                                                                                isSearchable={true}
                                                                                onChange={(value) => input.onChange(value)}
                                                                                onBlur={input.onBlur}
                                                                                classNamePrefix="react-select"
                                                                            />
                                                                            {meta.error && meta.touched && <p className='d-block text-danger'>{meta.error}</p>}
                                                                        </div>
                                                                    )}
                                                                </Field>
                                                            )}

                                                            {fieldType[index] === 'Dropdown' && fieldLabels[index] === 'Workshop Category' && (
                                                                <Field
                                                                    name={`${fieldName[index]}`} // Use dynamic field name
                                                                    validate={requiredfield[index] === '1' ? composeValidators(option) : (value) => composeValidators()(value)}
                                                                >
                                                                    {({ input, meta }) => (
                                                                        <div>
                                                                            <Label className='form-label' for={`displayname${index}`}>
                                                                                <strong>{label}</strong>{requiredfield[index] === '1' && <span className="text-danger"> *</span>}
                                                                            </Label>
                                                                            <Select
                                                                                {...input}
                                                                                options={requiredfield[index] === '1' ?
                                                                                    workshop.map(pref => ({ value: pref.cs_workshop_id, label: pref.cs_workshop_name })) :
                                                                                    [
                                                                                        { value: '', label: 'Select' }, // Adding the "Select" option as the first item
                                                                                        ...workshop.map(pref => ({ value: pref.cs_workshop_id, label: pref.cs_workshop_name }))
                                                                                    ]
                                                                                }

                                                                                // options={[{ value: '', label: 'Select' }, // Adding the "Select" option as the first item
                                                                                // ...workshop.map(pref => ({ value: pref.cs_workshop_id, label: pref.cs_workshop_name }))]}
                                                                                placeholder={`Select ${label}`}
                                                                                isSearchable={true}
                                                                                onChange={(value) => input.onChange(value)}
                                                                                onBlur={input.onBlur}
                                                                                classNamePrefix="react-select"
                                                                            />
                                                                            {meta.error && meta.touched && <p className='d-block text-danger'>{meta.error}</p>}
                                                                        </div>
                                                                    )}
                                                                </Field>
                                                            )}

                                                            {fieldType[index] === 'Dropdown' && fieldLabels[index] === 'Registration Category' && (
                                                                <Field
                                                                    name={`${fieldName[index]}`} // Use dynamic field name
                                                                    validate={requiredfield[index] === '1' ? composeValidators(option) : (value) => composeValidators()(value)}
                                                                >
                                                                    {({ input, meta }) => (
                                                                        <div>
                                                                            <Label className='form-label' for={`displayname${index}`}>
                                                                                <strong>{label}</strong>{requiredfield[index] === '1' && <span className="text-danger"> *</span>}
                                                                            </Label>
                                                                            <Select
                                                                                {...input}
                                                                                options={requiredfield[index] === '1' ?
                                                                                    regCat.map(pref => ({ value: pref.cs_reg_category, label: pref.cs_reg_category, id: pref.cs_reg_cat_id })) :
                                                                                    [
                                                                                        { value: '', label: 'Select' }, // Adding the "Select" option as the first item
                                                                                        ...regCat.map(pref => ({ value: pref.cs_reg_category, label: pref.cs_reg_category, id: pref.cs_reg_cat_id }))
                                                                                    ]
                                                                                }

                                                                                // options={[{ value: '', label: 'Select' }, // Adding the "Select" option as the first item
                                                                                // ...regCat.map(pref => ({
                                                                                //     value: pref.cs_reg_cat_id,
                                                                                //     label: pref.cs_reg_category
                                                                                // }))]} 
                                                                                placeholder={`Select ${label}`}
                                                                                isSearchable={true}
                                                                                onChange={(value) => input.onChange(value)}
                                                                                onBlur={input.onBlur}
                                                                                classNamePrefix="react-select"
                                                                            />
                                                                            {meta.error && meta.touched && <p className='d-block text-danger'>{meta.error}</p>}
                                                                        </div>
                                                                    )}
                                                                </Field>
                                                            )}


                                                            {fieldType[index] === 'Dropdown' && fieldLabels[index] === 'Registration Type' && (
                                                                <Field
                                                                    name={`${fieldName[index]}`} // Use dynamic field name
                                                                    validate={requiredfield[index] === '1' ? composeValidators(option) : (value) => composeValidators()(value)}
                                                                >
                                                                    {({ input, meta }) => (
                                                                        <div>
                                                                            <Label className='form-label' for={`displayname${index}`}>
                                                                                <strong>{label}</strong>{requiredfield[index] === '1' && <span className="text-danger"> *</span>}
                                                                            </Label>
                                                                            <Select
                                                                                {...input}
                                                                                options={requiredfield[index] === '1' ?
                                                                                    dayType.map(pref => ({ value: pref.cs_reg_daytype_id, label: pref.cs_reg_daytype_name })) :
                                                                                    [
                                                                                        { value: '', label: 'Select' }, // Adding the "Select" option as the first item
                                                                                        ...dayType.map(pref => ({ value: pref.cs_reg_daytype_id, label: pref.cs_reg_daytype_name }))
                                                                                    ]
                                                                                }

                                                                                // options={[{ value: '', label: 'Select' }, // Adding the "Select" option as the first item
                                                                                // ...dayType.map(pref => ({ value: pref.cs_reg_daytype_id, label: pref.cs_reg_daytype_name }))]}
                                                                                placeholder={`Select ${label}`}
                                                                                isSearchable={true}
                                                                                onChange={(value) => input.onChange(value)}
                                                                                onBlur={input.onBlur}
                                                                                classNamePrefix="react-select"
                                                                            />
                                                                            {meta.error && meta.touched && <p className='d-block text-danger'>{meta.error}</p>}
                                                                        </div>
                                                                    )}
                                                                </Field>
                                                            )}

                                                            {fieldType[index] === 'Dropdown' && (fieldId[index] > 23) && (
                                                                <Field
                                                                    name={`${fieldName[index]}`} // Use dynamic field name
                                                                    validate={requiredfield[index] === '1' ? composeValidators(option) : (value) => composeValidators()(value)}
                                                                >
                                                                    {({ input, meta }) => {
                                                                        // Filter fetchCustomData based on matching cs_field_id with fieldId
                                                                        const matchedOptions = custom.filter(option => option.cs_field_id === fieldId[index]);

                                                                        return (
                                                                            <div>
                                                                                <Label className='form-label' for={`displayname${index}`}>
                                                                                    <strong>{label}</strong>{requiredfield[index] === '1' && <span className="text-danger"> *</span>}
                                                                                </Label>
                                                                                <Select
                                                                                    {...input}
                                                                                    options={requiredfield[index] === '1' ?
                                                                                        matchedOptions.map(option => ({ value: option.cs_field_option_value, label: option.cs_field_option })) :
                                                                                        [
                                                                                            { value: '', label: 'Select' }, // Adding the "Select" option as the first item
                                                                                            ...matchedOptions.map(option => ({ value: option.cs_field_option_value, label: option.cs_field_option }))
                                                                                        ]
                                                                                    }

                                                                                    // options={[{ value: '', label: 'Select' }, // Adding the "Select" option as the first item
                                                                                    // ...matchedOptions.map(option => ({ value: option.cs_field_option_value, label: option.cs_field_option }))]}
                                                                                    placeholder={`Select ${label}`}
                                                                                    isSearchable={true}
                                                                                    onChange={(value) => input.onChange(value)}
                                                                                    onBlur={input.onBlur}
                                                                                    classNamePrefix="react-select"
                                                                                />
                                                                                {meta.error && meta.touched && <p className='d-block text-danger'>{meta.error}</p>}
                                                                            </div>
                                                                        );
                                                                    }}
                                                                </Field>
                                                            )}






                                                            {fieldType[index] === 'Long Text' && (
                                                                <Field
                                                                    name={`${fieldName[index]}`} // Use dynamic field name
                                                                    validate={requiredfield[index] === '1' ? composeValidators(required) : (value) => composeValidators()(value)}
                                                                >
                                                                    {({ input, meta }) => (
                                                                        <div>
                                                                            <Label className='form-label' for={`displayname${index}`}>
                                                                                <strong>{label}</strong>{requiredfield[index] === '1' && <span className="text-danger"> *</span>}
                                                                            </Label>
                                                                            <textarea
                                                                                {...input}
                                                                                className="form-control"
                                                                                id={`displayname${index}`}
                                                                                placeholder={`Enter ${label}`}
                                                                            />
                                                                            {meta.error && meta.touched && <p className='d-block text-danger'>{meta.error}</p>}
                                                                        </div>
                                                                    )}
                                                                </Field>
                                                            )}

                                                            {fieldType[index] === 'Number' && (
                                                                <Field
                                                                    name={`${fieldName[index]}`} // Use dynamic field name
                                                                    validate={requiredfield[index] === '1' ? composeValidators(number) : (value) => composeValidators()(value)}
                                                                >
                                                                    {({ input, meta }) => (
                                                                        <div>
                                                                            <Label className='form-label' for={`displayname${index}`}>
                                                                                <strong>{label}</strong>{requiredfield[index] === '1' && <span className="text-danger"> *</span>}
                                                                            </Label>
                                                                            <input
                                                                                {...input}
                                                                                className="form-control"
                                                                                id={`displayname${index}`}
                                                                                type="number"
                                                                                placeholder={`Enter ${label}`}
                                                                            />
                                                                            {meta.error && meta.touched && <p className='d-block text-danger'>{meta.error}</p>}
                                                                        </div>
                                                                    )}
                                                                </Field>
                                                            )}

                                                            {fieldType[index] === 'Text' && (
                                                                <Field
                                                                    name={`${fieldName[index]}`} // Use dynamic field name
                                                                    validate={requiredfield[index] === '1' ? composeValidators(NAME) : (value) => composeValidators()(value)}
                                                                >
                                                                    {({ input, meta }) => (
                                                                        <div>
                                                                            <Label className='form-label' for={`displayname${index}`}>
                                                                                <strong>{label}</strong>{requiredfield[index] === '1' && <span className="text-danger"> *</span>}
                                                                            </Label>
                                                                            <input
                                                                                {...input}
                                                                                className="form-control"
                                                                                id={`displayname${index}`}
                                                                                type="text"
                                                                                placeholder={`Enter ${label}`}
                                                                            />
                                                                            {meta.error && meta.touched && <p className='d-block text-danger'>{meta.error}</p>}
                                                                        </div>
                                                                    )}
                                                                </Field>
                                                            )}


                                                            {fieldType[index] === 'Email' && (
                                                                <Field
                                                                    name={`${fieldName[index]}`} // Use dynamic field name
                                                                    validate={requiredfield[index] === '1' ? composeValidators(email) : (value) => composeValidators()(value)}
                                                                >
                                                                    {({ input, meta }) => (
                                                                        <div>
                                                                            <Label className='form-label' for={`displayname${index}`}>
                                                                                <strong>{label}</strong>{requiredfield[index] === '1' && <span className="text-danger"> *</span>}
                                                                            </Label>
                                                                            <input
                                                                                {...input}
                                                                                className="form-control"
                                                                                id={`displayname${index}`}
                                                                                type="text"
                                                                                placeholder={`Enter ${label}`}
                                                                            />
                                                                            {meta.error && meta.touched && <p className='d-block text-danger'>{meta.error}</p>}
                                                                        </div>
                                                                    )}
                                                                </Field>
                                                            )}

                                                            {
                                                                fieldType[index] === 'Radio' && (
                                                                    <Field
                                                                        name={`${fieldName[index]}`} // Use dynamic field name
                                                                        validate={requiredfield[index] === '1' ? composeValidators(radio) : (value) => composeValidators()(value)}
                                                                    >
                                                                        {({ input, meta }) => (
                                                                            <div>
                                                                                <Label className='form-label' for={`radio${index}`}>
                                                                                    <strong>{label}</strong>{requiredfield[index] === '1' && <span className="text-danger"> *</span>}
                                                                                </Label>
                                                                                <div>
                                                                                    <Media body className="icon-state switch-sm">
                                                                                        <Label className="switch">
                                                                                            <Input
                                                                                                type="checkbox"
                                                                                                checked={input.value === 'Yes'}
                                                                                                onChange={(e) => input.onChange(e.target.checked ? 'Yes' : 'No')}
                                                                                            />
                                                                                            <span className={"switch-state " + (input.value === 'Yes' ? "bg-success" : "bg-danger")}></span>
                                                                                        </Label>
                                                                                    </Media>
                                                                                </div>
                                                                                {meta.error && meta.touched && <p className='d-block text-danger'>{meta.error}</p>}
                                                                            </div>
                                                                        )}
                                                                    </Field>
                                                                )
                                                            }

                                                            {
                                                                fieldType[index] === 'Date' && (
                                                                    <Field
                                                                        name={`${fieldName[index]}`} // Use dynamic field name
                                                                        validate={requiredfield[index] === '1' ? composeValidators(expiryDate) : (value) => composeValidators()(value)}
                                                                    >
                                                                        {({ input, meta }) => (
                                                                            <div>
                                                                                <Label className='form-label' for={`displayname${index}`}>
                                                                                    <strong>{label}</strong>{requiredfield[index] === '1' && <span className="text-danger"> *</span>}
                                                                                </Label>
                                                                                <input
                                                                                    {...input}
                                                                                    className="form-control"
                                                                                    id={`displayname${index}`}
                                                                                    type="date"
                                                                                    placeholder={`Enter ${label}`}
                                                                                    // min={minDate}
                                                                                    max="9999-12-31"
                                                                                />
                                                                                {meta.error && meta.touched && <p className='d-block text-danger'>{meta.error}</p>}
                                                                            </div>
                                                                        )}
                                                                    </Field>
                                                                )
                                                            }
                                                            {fieldType[index] === 'Username' && (
                                                                <Field
                                                                    name={`${fieldName[index]}`} // Use dynamic field name
                                                                    validate={requiredfield[index] === '1' ? composeValidators(username1 ,validateUniqueUsername) : (value) => composeValidators()(value)}
                                                                >
                                                                    {({ input, meta }) => (
                                                                        <div>
                                                                            <Label className='form-label' for={`displayname${index}`}>
                                                                                <strong>{label}</strong>{requiredfield[index] === '1' && <span className="text-danger"> *</span>}
                                                                            </Label>
                                                                            <input
                                                                                {...input}
                                                                                className="form-control"
                                                                                id={`displayname${index}`}
                                                                                type="text"
                                                                                placeholder={`Enter ${label}`}
                                                                            />
                                                                            {meta.error && meta.touched && <p className='d-block text-danger'>{meta.error}</p>}
                                                                        </div>
                                                                    )}
                                                                </Field>
                                                            )}

                                                            {fieldType[index] === 'Password' && (
                                                                <Field
                                                                    name={`${fieldName[index]}`} // Use dynamic field name
                                                                    validate={requiredfield[index] === '1' ? composeValidators(password) : (value) => composeValidators()(value)}
                                                                >
                                                                    {({ input, meta }) => (
                                                                        <div>
                                                                            <Label className='form-label' for={`displayname${index}`}>
                                                                                <strong>{label}</strong>{requiredfield[index] === '1' && <span className="text-danger"> *</span>}
                                                                            </Label>
                                                                            <input
                                                                                {...input}
                                                                                className="form-control"
                                                                                id={`displayname${index}`}
                                                                                type="text"
                                                                                placeholder={`Enter ${label}`}
                                                                            />
                                                                            {meta.error && meta.touched && <p className='d-block text-danger'>{meta.error}</p>}
                                                                        </div>
                                                                    )}
                                                                </Field>
                                                            )}

                                                        </Col>
                                                    );
                                                })}

                                                {AddUserPermissions?.add === 1 && (
                                                    <div>
                                                        <Button color='primary' type='submit' className="me-2 mt-3">Create User</Button>
                                                        <Button color='warning' onClick={handleCancel} className="mt-3">Cancel</Button>
                                                    </div>
                                                )}
                                            </Row>
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
                    <button onClick={handleNavigation} className="btn btn-warning">
                        Yes
                    </button>
                    {/* <Link to="/manage-facility/Consoft" className="btn btn-warning">Yes</Link> */}
                    <Button color="primary" onClick={() => setModal(!modal)}>No</Button>
                </ModalFooter>
            </Modal>
        </Fragment>
    );
};

export default AddBasicUser;




