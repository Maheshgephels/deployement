import React, { Fragment, useState, useEffect, useContext } from 'react';
import { Container, Row, Col, Input, Label, Button, Card, CardBody, Modal, ModalHeader, FormFeedback, ModalBody, ModalFooter, Media, PopoverBody, UncontrolledPopover } from 'reactstrap';
import { useForm } from 'react-hook-form';
import axios from 'axios';
import { BackendAPI } from '../../api';
import SweetAlert from 'sweetalert2';
// import { Input } from 'antd';
import { Breadcrumbs } from '../../AbstractElements';
import { Link, useNavigate } from 'react-router-dom';
import { MdDelete, MdInfoOutline } from "react-icons/md";
import Select from 'react-select';
import { Field, Form } from 'react-final-form'; // Import Field and Form from react-final-form
import { required, email, Img, PDF, option, number, Name, NAME,expiryDate } from '../Utils/validationUtils';
import { PermissionsContext } from '../../contexts/PermissionsContext';




//Utility function used to combine multiple validation functions into a single validation function
const composeValidators = (...validators) => value =>
    validators.reduce((error, validator) => error || validator(value), undefined);

const AddUser = () => {
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
    const [prefixes, setPrefixes] = useState([]);
    const [state, setState] = useState([]);
    const [country, setCountry] = useState([]);
    const [regCat, setRegCat] = useState([]);
    const [workshop, setWorkshop] = useState([]);
    const [dayType, setDayType] = useState([]);
    const [custom, setCustom] = useState([]);
    const [username, setusername] = useState([]);
    const { permissions } = useContext(PermissionsContext);
    const [workshoptype, setworkshoptype] = useState([]);

    const empty = '';



    console.log("Category", regCat);


    useEffect(() => {
        fetchFields(); // Corrected function name
    }, [permissions]);

    useEffect(() => {
        fetchDropdown(); // Corrected function name
    }, []);

    // Extract Add User setting Permissions component
    const AddUserPermissions = permissions['AddUser'];

    const fetchFields = async () => {
        try {
            const token = getToken();
            const response = await axios.get(`${BackendAPI}/manageuser/getField`, {
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
            const WorkshopType = fieldsData.map(field => field.cs_workshoptype_id);

            setData(fieldsData);
            setFieldLabels(fieldLabels);
            setFieldType(fieldType);
            setFieldName(fieldName);
            setRequiredField(requiredfield); // Set requiredfield state
            setFieldId(fieldId);
            setLoading(false);
            setworkshoptype(WorkshopType);


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
        const username = formData.cs_first_name;

        try {
            // Filter out fields with empty values
            const values = {};

            for (const key in formData) {
                if (Object.hasOwnProperty.call(formData, key)) {
                    if (formData[key].value !== '') {
                        values[key] = formData[key].value || formData[key];
                    }
                }
            }

            console.log('Formatted form data to send:', values);
            const token = getToken();

            // Make the API call to add user
            const response = await axios.post(`${BackendAPI}/manageuser/addUser`, values, {
                headers: {
                    Authorization: `Bearer ${token}` // Include the token in the Authorization header
                }
            });

            if (response.data.success) {
                SweetAlert.fire({
                    title: 'Success!',
                    html: `User <b>${username}</b> created successfully!`,
                    icon: 'success',
                    timer: 3000,
                    showConfirmButton: false,
                    allowOutsideClick: false,
                    allowEscapeKey: false
                }).then((result) => {
                    if (result.dismiss === SweetAlert.DismissReason.timer) {
                        navigate(`${process.env.PUBLIC_URL}/onsite/manage-user/Consoft`);
                    }
                });
            }
        } catch (error) {
            console.error('Error creating user:', error.message);
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
        navigate(`${process.env.PUBLIC_URL}/onsite/manage-user/Consoft`);
    };



    return (
        <Fragment>
            <Breadcrumbs parentClickHandler={handleNavigation} mainTitle={
                <>
                    Create User
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
            } parent="Manage User" title="Create User" />
            <Container fluid={true}>
                <Row>
                    <Col sm="12">
                        <Card>
                            <CardBody>
                                <Form onSubmit={onSubmit}>
                                    {({ handleSubmit }) => (
                                        <form className='needs-validation' noValidate='' onSubmit={handleSubmit}>
                                            <Row className="d-flex flex-wrap">
                                                {/* Render multiple Field components based on the length of fieldLabels array */}
                                                {fieldLabels.map((label, index) => {
                                                    const isFieldRequired = requiredfield[index] === 1;
                                                    return (
                                                        <Col
                                                            key={index}
                                                            xs={12} // Full width for small devices
                                                            sm={6}  // Half width for medium devices
                                                            md={4}  // One-third width for larger devices
                                                            className="mb-3"
                                                        >
                                                            {fieldType[index] === 'Dropdown' && fieldLabels[index] === 'Title' && (
                                                                <Field
                                                                    name={`${fieldName[index]}`} // Use dynamic field name
                                                                    validate={isFieldRequired ? composeValidators(option) : (value) => composeValidators()(value)}
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
                                                                                    [
                                                                                        { value: '', label: 'Select' },
                                                                                        ...prefixes.map(pref => ({ value: pref.cs_prefix, label: pref.cs_prefix }))
                                                                                    ]
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
                                                                                    regCat.map(pref => ({ value: pref.cs_reg_cat_id, label: pref.cs_reg_category })) :
                                                                                    [
                                                                                        { value: '', label: 'Select' }, // Adding the "Select" option as the first item
                                                                                        ...regCat.map(pref => ({ value: pref.cs_reg_cat_id, label: pref.cs_reg_category }))
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

                                                            {fieldType[index] === 'Workshop' && (
                                                                <Field
                                                                    name={`${fieldName[index]}`} // Use dynamic field name
                                                                    validate={requiredfield[index] === '1' ? composeValidators(option) : (value) => composeValidators()(value)}
                                                                >
                                                                    {({ input, meta }) => (
                                                                        <div>
                                                                            <Label className='form-label' for={`displayname${index}`}>
                                                                                <strong>{label}</strong>
                                                                                {requiredfield[index] === '1' && <span className="text-danger"> *</span>}
                                                                            </Label>
                                                                            <Select
                                                                                {...input}
                                                                                options={requiredfield[index] === '1' ?
                                                                                    workshop
                                                                                        .filter(pref => pref.cs_workshoptype_id === workshoptype[index]) // Filter by workshop type ID
                                                                                        .map(pref => ({ value: pref.cs_workshop_id, label: pref.cs_workshop_name }))
                                                                                    :
                                                                                    [
                                                                                        { value: '', label: 'Select' }, // Adding the "Select" option as the first item
                                                                                        ...workshop
                                                                                            .filter(pref => pref.cs_workshoptype_id === workshoptype[index]) // Filter by workshop type ID
                                                                                            .map(pref => ({ value: pref.cs_workshop_id, label: pref.cs_workshop_name }))
                                                                                    ]
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




                                                            {fieldType[index] === 'Long Text' && (
                                                                <Field
                                                                    name={`${fieldName[index]}`} // Use dynamic field name
                                                                    validate={isFieldRequired ? composeValidators(required) : (value) => composeValidators()(value)}
                                                                >
                                                                    {({ input, meta }) => (
                                                                        <div>
                                                                            <Label className='form-label' for={`displayname${index}`}>
                                                                                <strong>{label}</strong>{isFieldRequired && <span className="text-danger"> *</span>}
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
                                                                    validate={isFieldRequired ? composeValidators(number) : (value) => composeValidators()(value)}
                                                                >
                                                                    {({ input, meta }) => (
                                                                        <div>
                                                                            <Label className='form-label' for={`displayname${index}`}>
                                                                                <strong>{label}</strong>{isFieldRequired && <span className="text-danger"> *</span>}
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
                                                                    validate={isFieldRequired ? composeValidators(NAME) : (value) => composeValidators()(value)}
                                                                >
                                                                    {({ input, meta }) => (
                                                                        <div>
                                                                            <Label className='form-label' for={`displayname${index}`}>
                                                                                <strong>{label}</strong>{isFieldRequired && <span className="text-danger"> *</span>}
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

                                                            {fieldType[index] === 'Email' && (
                                                                <Field
                                                                    name={`${fieldName[index]}`} // Use dynamic field name
                                                                    validate={isFieldRequired ? composeValidators(email) : (value) => composeValidators()(value)}
                                                                >
                                                                    {({ input, meta }) => (
                                                                        <div>
                                                                            <Label className='form-label' for={`displayname${index}`}>
                                                                                <strong>{label}</strong>{isFieldRequired && <span className="text-danger"> *</span>}
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
                                            </Row>

                                            {AddUserPermissions?.add === 1 && (
                                                <div>
                                                    <Button color='primary' type='submit' className="me-2 mt-3">Create User</Button>
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

export default AddUser;




