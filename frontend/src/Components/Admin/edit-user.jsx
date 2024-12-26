import React, { Fragment, useState, useEffect } from 'react';
import { Container, Row, Col, Input, Label, Button, Card, CardBody, Modal, ModalHeader, FormFeedback, ModalBody, ModalFooter, Media } from 'reactstrap';
import { useForm } from 'react-hook-form';
import axios from 'axios';
import { BackendAPI } from '../../api';
import SweetAlert from 'sweetalert2';
// import { Input } from 'antd';
import { Breadcrumbs } from '../../AbstractElements';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import Select from 'react-select';
import { Field, Form } from 'react-final-form'; // Import Field and Form from react-final-form
import { required, email, NAME, Img, PDF, option, number,expiryDate } from '../Utils/validationUtils';

import useAuth from '../../Auth/protectedAuth';
import { getToken } from '../../Auth/Auth';
import moment from 'moment';



//Utility function used to combine multiple validation functions into a single validation function
const composeValidators = (...validators) => value =>
    validators.reduce((error, validator) => error || validator(value), undefined);

const EditUser = () => {
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
    const [User, setUser] = useState([]);
    const [dayType, setDayType] = useState([]);
    const [custom, setCustom] = useState([]);
    const location = useLocation();
    const { catId } = location.state;
    const [workshoptype, setworkshoptype] = useState([]);

    console.log("FieldName", fieldName);
    console.log("Required", requiredfield);

    useEffect(() => {
        fetchUserDetail(); // Fetch workshop data when component mounts
    }, []);

    const fetchUserDetail = async () => {
        try {
            const token = getToken();
            const response = await axios.post(`${BackendAPI}/manageuser/fetchuserdetail`, { catId }, {
                headers: {
                    Authorization: `Bearer ${token}` // Include the token in the Authorization header
                }
            });
            // console.log('Data from API:', response.data);
            setUser(response.data[0]); // Set workshop data to the first item in the response array
        } catch (error) {
            console.error('Error fetching user detail data:', error);
        }
    };

    useEffect(() => {
        fetchFields(); // Corrected function name
    }, []);

    useEffect(() => {
        fetchDropdown(); // Corrected function name
    }, []);

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
        try {
            const id = catId;
            console.log("id", id);

            // Generate the expectedFields array based on requiredfield values
            const expectedFields = fieldName.filter((_, index) => requiredfield[index] === '0');

            // Process formData to ensure all fields, including empty ones, are included
            const values = {};
            for (const key in formData) {
                if (Object.hasOwnProperty.call(formData, key)) {
                    values[key] = formData[key].value !== undefined ? formData[key].value : formData[key] || '';
                }
            }

            // Ensure all expected fields are included, including empty ones
            expectedFields.forEach(field => {
                if (!(field in values)) {
                    values[field] = ''; // Ensure field is included if missing
                }
            });

            console.log('Formatted form data to send:', values);

            // Add catId to the values object
            values.cs_regno = id;

            const token = getToken();
            await axios.post(`${BackendAPI}/manageuser/editUser`, values, {
                headers: {
                    Authorization: `Bearer ${token}` // Include the token in the Authorization header
                }
            });

            SweetAlert.fire({
                title: 'Success!',
                text: 'User data updated successfully!',
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
        } catch (error) {
            console.error('Error creating application login:', error.message);
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
            // console.log(response.data);
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


            // console.log(fetchprefixes);


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
            <Breadcrumbs parentClickHandler={handleNavigation} mainTitle="Edit User" parent="Manage User" title="Edit User" />
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
                                                                    name={`${fieldName[index]}`}
                                                                    initialValue={User.cs_title || ''}
                                                                    validate={isFieldRequired ? composeValidators(option) : (value) => composeValidators()(value)}
                                                                >
                                                                    {({ input, meta }) => {
                                                                        const options = requiredfield[index] !== '1'
                                                                            ? [{ value: '', label: 'Select' }, ...prefixes.map(pref => ({ value: pref.cs_prefix, label: pref.cs_prefix }))]
                                                                            : prefixes.map(pref => ({ value: pref.cs_prefix, label: pref.cs_prefix }));

                                                                        return (
                                                                            <div>
                                                                                <Label className='form-label' htmlFor={`displayname${index}`}>
                                                                                    <strong>{label}</strong>
                                                                                    {isFieldRequired && <span className="text-danger"> *</span>}
                                                                                </Label>
                                                                                <Select
                                                                                    {...input}
                                                                                    options={options}
                                                                                    placeholder={`Select ${label}`}
                                                                                    isSearchable={true}
                                                                                    onChange={(selectedOption) => input.onChange(selectedOption ? selectedOption.value : '')}
                                                                                    onBlur={input.onBlur}
                                                                                    classNamePrefix="react-select"
                                                                                    value={options.find(option => option.value === input.value) || null}
                                                                                />
                                                                                {meta.error && meta.touched && <p className='d-block text-danger'>{meta.error}</p>}
                                                                            </div>
                                                                        );
                                                                    }}
                                                                </Field>
                                                            )}

                                                            {fieldType[index] === 'Dropdown' && fieldLabels[index] === 'State' && (
                                                                <Field
                                                                    name={`${fieldName[index]}`} // Use dynamic field name
                                                                    initialValue={User.cs_state || ''}
                                                                    validate={requiredfield[index] === '1' ? composeValidators(option) : (value) => composeValidators()(value)}
                                                                >
                                                                    {({ input, meta }) => {
                                                                        // Find the option corresponding to User.cs_state
                                                                        const selectedOption = state.find(option => option.cs_state_name === User.cs_state);

                                                                        // Map state to create the options array
                                                                        let options = state.map(pref => ({
                                                                            value: pref.cs_state_name,
                                                                            label: pref.cs_state_name,
                                                                        }));

                                                                        // Conditionally add the "Select" option based on requiredfield[index]
                                                                        if (requiredfield[index] !== '1') {
                                                                            options = [
                                                                                { value: '', label: 'Select' },
                                                                                ...options
                                                                            ];
                                                                        }

                                                                        return (
                                                                            <div>
                                                                                <Label className='form-label' for={`displayname${index}`}>
                                                                                    <strong>{label}</strong>{requiredfield[index] === '1' && <span className="text-danger"> *</span>}
                                                                                </Label>
                                                                                <Select
                                                                                    {...input}
                                                                                    options={options}
                                                                                    placeholder={`Select ${label}`}
                                                                                    isSearchable={true}
                                                                                    onChange={(selectedOption) => {
                                                                                        input.onChange(selectedOption ? selectedOption.value : '');
                                                                                    }}
                                                                                    onBlur={input.onBlur}
                                                                                    classNamePrefix="react-select"
                                                                                    value={options.find(option => option.value === input.value) || null} // Set the value directly to the initialValue
                                                                                />
                                                                                {meta.error && meta.touched && <p className='d-block text-danger'>{meta.error}</p>}
                                                                            </div>
                                                                        );
                                                                    }}
                                                                </Field>
                                                            )}

                                                            {fieldType[index] === 'Dropdown' && fieldLabels[index] === 'Country' && (
                                                                <Field
                                                                    name={`${fieldName[index]}`} // Use dynamic field name
                                                                    initialValue={User.cs_country || ''}
                                                                    validate={requiredfield[index] === '1' ? composeValidators(option) : (value) => composeValidators()(value)}
                                                                >
                                                                    {({ input, meta }) => {
                                                                        const selectedOption = country.find(option => option.cs_country === User.cs_country);
                                                                        let options = country.map(pref => ({
                                                                            value: pref.cs_country,
                                                                            label: pref.cs_country,
                                                                        }));

                                                                        // Conditionally add the "Select" option based on requiredfield[index]
                                                                        if (requiredfield[index] !== '1') {
                                                                            options = [
                                                                                { value: '', label: 'Select' },
                                                                                ...options
                                                                            ];
                                                                        }

                                                                        return (
                                                                            <div>
                                                                                <Label className='form-label' for={`displayname${index}`}>
                                                                                    <strong>{label}</strong>{requiredfield[index] === '1' && <span className="text-danger"> *</span>}
                                                                                </Label>
                                                                                <Select
                                                                                    {...input}
                                                                                    options={options}
                                                                                    placeholder={`Select ${label}`}
                                                                                    isSearchable={true}
                                                                                    onChange={(selectedOption) => {
                                                                                        input.onChange(selectedOption ? selectedOption.value : '');
                                                                                    }}
                                                                                    onBlur={input.onBlur}
                                                                                    classNamePrefix="react-select"
                                                                                    value={options.find(option => option.value === input.value) || null}
                                                                                />
                                                                                {meta.error && meta.touched && <p className='d-block text-danger'>{meta.error}</p>}
                                                                            </div>
                                                                        );
                                                                    }}
                                                                </Field>
                                                            )}
                                                            {fieldType[index] === 'Dropdown' && fieldLabels[index] === 'Workshop Category' && (
                                                                <Field
                                                                    name={`${fieldName[index]}`} // Use dynamic field name
                                                                    initialValue={User.cs_workshop_category || ''}
                                                                    validate={requiredfield[index] === '1' ? composeValidators(option) : (value) => composeValidators()(value)}
                                                                >
                                                                    {({ input, meta }) => {
                                                                        // Ensure that the initial value is parsed as an integer
                                                                        const initialValue = parseInt(input.value, 10);

                                                                        // Find the selected option based on the initial value
                                                                        const selectedOption = workshop.find(option => option.cs_workshop_id === initialValue);

                                                                        // Map options to the format expected by react-select
                                                                        let options = workshop.map(pref => ({
                                                                            value: pref.cs_workshop_id,
                                                                            label: pref.cs_workshop_name,
                                                                        }));

                                                                        // Conditionally add the "Select" option based on requiredfield[index]
                                                                        if (requiredfield[index] !== '1') {
                                                                            options = [
                                                                                { value: '', label: 'Select' },
                                                                                ...options
                                                                            ];
                                                                        }

                                                                        return (
                                                                            <div>

                                                                                <Label className='form-label' for={`displayname${index}`}>
                                                                                    <strong>{label}</strong>{requiredfield[index] === '1' && <span className="text-danger"> *</span>}
                                                                                </Label>
                                                                                <Select
                                                                                    {...input}
                                                                                    options={options}
                                                                                    placeholder={`Select ${label}`}
                                                                                    isSearchable={true}
                                                                                    onChange={(selectedOption) => {
                                                                                        // Ensure the selected value is passed as a string
                                                                                        input.onChange(selectedOption ? selectedOption.value.toString() : '');
                                                                                    }}
                                                                                    onBlur={input.onBlur}
                                                                                    classNamePrefix="react-select"
                                                                                    value={options.find(option => option.value === initialValue) || null}
                                                                                />
                                                                                {meta.error && meta.touched && <p className='d-block text-danger'>{meta.error}</p>}
                                                                            </div>
                                                                        );
                                                                    }}
                                                                </Field>
                                                            )}

                                                            {fieldType[index] === 'Workshop' && (
                                                               <Field
                                                               name={`${fieldName[index]}`}
                                                               initialValue={User[fieldName[index]] || ''}
                                                               validate={requiredfield[index] === '1' ? composeValidators(option) : (value) => composeValidators()(value)}
                                                           >
                                                               {({ input, meta }) => {
                                                                   const initialValue = User[fieldName[index]] ? User[fieldName[index]].toString() : '';
                                                           
                                                                   let options = workshop
                                                                       .filter(pref => pref.cs_workshoptype_id === workshoptype[index])
                                                                       .map(pref => ({ value: pref.cs_workshop_id.toString(), label: pref.cs_workshop_name }));
                                                           
                                                                   if (requiredfield[index] !== '1') {
                                                                       options = [
                                                                           { value: '', label: 'Select' },
                                                                           ...options
                                                                       ];
                                                                   }
                                                           
                                                                   return (
                                                                       <div>
                                                                           <Label className="form-label" for={`displayname${index}`}>
                                                                               <strong>{label}</strong>
                                                                               {requiredfield[index] === '1' && <span className="text-danger"> *</span>}
                                                                           </Label>
                                                                           <Select
                                                                               {...input}
                                                                               options={options}
                                                                               placeholder={`Select ${label}`}
                                                                               isSearchable={true}
                                                                               onChange={(selected) => {
                                                                                   input.onChange(selected ? selected.value.toString() : '');
                                                                               }}
                                                                               onBlur={input.onBlur}
                                                                               classNamePrefix="react-select"
                                                                               value={options.find(option => option.value === input.value) || null}
                                                                           />
                                                                           {meta.error && meta.touched && <p className="d-block text-danger">{meta.error}</p>}
                                                                       </div>
                                                                   );
                                                               }}
                                                           </Field>
                                                           
                                                            )}



                                                            {fieldType[index] === 'Dropdown' && fieldLabels[index] === 'Registration Category' && (
                                                                <Field
                                                                    name={`${fieldName[index]}`} // Use dynamic field name
                                                                    initialValue={User.cs_reg_cat_id || ''}
                                                                    validate={requiredfield[index] === '1' ? composeValidators(option) : (value) => composeValidators()(value)}
                                                                >
                                                                    {({ input, meta }) => {
                                                                        const selectedOption = regCat.find(option => option.cs_reg_cat_id === User.cs_reg_category);





                                                                        let options = regCat.map(pref => ({
                                                                            value: pref.cs_reg_cat_id,
                                                                            label: pref.cs_reg_category,
                                                                        }));

                                                                        // Conditionally add the "Select" option based on requiredfield[index]
                                                                        if (requiredfield[index] !== '1') {
                                                                            options = [
                                                                                { value: '', label: 'Select' },
                                                                                ...options
                                                                            ];
                                                                        }

                                                                        console.log("Selected  Registration Option:", selectedOption);
                                                                        console.log("Registration Options:", options);

                                                                        return (
                                                                            <div>
                                                                                <Label className='form-label' for={`displayname${index}`}>
                                                                                    <strong>{label}</strong>{requiredfield[index] === '1' && <span className="text-danger"> *</span>}
                                                                                </Label>
                                                                                <Select
                                                                                    {...input}
                                                                                    options={options}
                                                                                    placeholder={`Select ${label}`}
                                                                                    isSearchable={true}
                                                                                    onChange={(selectedOption) => {
                                                                                        input.onChange(selectedOption ? selectedOption.value : '');
                                                                                    }}
                                                                                    onBlur={input.onBlur}
                                                                                    classNamePrefix="react-select"
                                                                                    value={options.find(option => option.value === input.value) || null}
                                                                                />
                                                                                {meta.error && meta.touched && <p className='d-block text-danger'>{meta.error}</p>}
                                                                            </div>
                                                                        );
                                                                    }}
                                                                </Field>
                                                            )}


                                                            {/* //---------------  */}



                                                            {/* {fieldType[index] === 'Dropdown' && fieldLabels[index] === 'Registration Type' && (
                                                                <Field
                                                                    name={`${fieldName[index]}`} // Use dynamic field name
                                                                    initialValue={User.cs_reg_type || ''}
                                                                    validate={isFieldRequired ? composeValidators(required) : undefined}
                                                                >
                                                                    {({ input, meta }) => {
                                                                        // Convert User.cs_reg_type to number
                                                                        const regType = parseInt(User.cs_reg_type);

                                                                        // Find the selected option based on the converted number
                                                                        const selectedOption = dayType.find(option => option.cs_reg_daytype_id === regType);

                                                                        // Map options
                                                                        const options = dayType.map(pref => ({
                                                                            value: pref.cs_reg_daytype_id,
                                                                            label: pref.cs_reg_daytype_name,
                                                                        }));

                                                                        return (
                                                                            <div>
                                                                                <Label className='form-label' htmlFor={`displayname${index}`}><strong>{label}</strong></Label>
                                                                                <Select
                                                                                    {...input}
                                                                                    options={options}
                                                                                    placeholder={`Select ${label}`}
                                                                                    isSearchable={true}
                                                                                    onChange={(selectedOption) => {
                                                                                        console.log("Dropdown value changed:", selectedOption); // Add debug logging
                                                                                        input.onChange(selectedOption ? selectedOption.value : '');
                                                                                    }}
                                                                                    onBlur={input.onBlur}
                                                                                    classNamePrefix="react-select"
                                                                                    value={selectedOption || null} // Set the value to the selected option object
                                                                                />

                                                                                {meta.error && meta.touched && <p className='d-block text-danger'>{meta.error}</p>}
                                                                            </div>
                                                                        );
                                                                    }}
                                                                </Field>
                                                            )} */}



                                                            {fieldType[index] === 'Dropdown' && fieldLabels[index] === 'Registration Type' && (
                                                                <Field
                                                                    name={`${fieldName[index]}`}
                                                                    initialValue={User.cs_reg_type || ''}
                                                                    validate={requiredfield[index] === '1' ? composeValidators(option) : (value) => composeValidators()(value)}
                                                                >
                                                                    {({ input, meta }) => {
                                                                        // Parse the initial value to ensure it's a number
                                                                        const initialValue = parseInt(input.value, 10);

                                                                        // Map options to the format expected by react-select
                                                                        let options = dayType.map(pref => ({
                                                                            value: pref.cs_reg_daytype_id,
                                                                            label: pref.cs_reg_daytype_name,
                                                                        }));

                                                                        // Conditionally add the "Select" option based on requiredfield[index]
                                                                        if (requiredfield[index] !== '1') {
                                                                            options = [
                                                                                { value: '', label: 'Select' },
                                                                                ...options
                                                                            ];
                                                                        }

                                                                        return (
                                                                            <div>
                                                                                <Label className='form-label' for={`displayname${index}`}>
                                                                                    <strong>{label}</strong>{requiredfield[index] === '1' && <span className="text-danger"> *</span>}
                                                                                </Label>
                                                                                <Select
                                                                                    {...input}
                                                                                    options={options}
                                                                                    placeholder={`Select ${label}`}
                                                                                    isSearchable={true}
                                                                                    onChange={(selectedOption) => {
                                                                                        // Ensure that the selected value is converted to string if necessary
                                                                                        input.onChange(selectedOption ? selectedOption.value.toString() : '');
                                                                                    }}
                                                                                    onBlur={input.onBlur}
                                                                                    classNamePrefix="react-select"
                                                                                    value={options.find(option => option.value === initialValue) || null}
                                                                                />
                                                                                {meta.error && meta.touched && <p className='d-block text-danger'>{meta.error}</p>}
                                                                            </div>
                                                                        );
                                                                    }}
                                                                </Field>
                                                            )}


                                                            


                                                            {fieldType[index] === 'Dropdown' && (fieldId[index] > 23) && (

                                                                <Field
                                                                    name={`${fieldName[index]}`} // Dynamic field name
                                                                    initialValue={User[fieldName[index]] || ''} // Initial value from User data
                                                                    validate={requiredfield[index] === '1' ? composeValidators(option) : (value) => composeValidators()(value)}
                                                                >
                                                                    {({ input, meta }) => {
                                                                        const matchedOptions = custom.filter(option => option.cs_field_id === fieldId[index]);

                                                                        // Map matchedOptions to react-select format
                                                                        let options = matchedOptions.map(option => ({
                                                                            value: option.cs_field_option_value,
                                                                            label: option.cs_field_option,
                                                                        }));

                                                                        // Conditionally add the "Select" option based on requiredfield[index]
                                                                        if (requiredfield[index] !== '1') {
                                                                            options = [
                                                                                { value: '', label: 'Select' },
                                                                                ...options
                                                                            ];
                                                                        }

                                                                        // Determine the selected option
                                                                        const selectedOption = options.find(option => option.value === input.value);

                                                                        return (
                                                                            <div>
                                                                                <Label className='form-label' for={`displayname${index}`}>
                                                                                    <strong>{label}</strong>{requiredfield[index] === '1' && <span className="text-danger"> *</span>}
                                                                                </Label>
                                                                                <Select
                                                                                    {...input}
                                                                                    options={options}
                                                                                    placeholder={`Select ${label}`}
                                                                                    isSearchable={true}
                                                                                    onChange={(selectedOption) => {
                                                                                        input.onChange(selectedOption ? selectedOption.value : '');
                                                                                    }}
                                                                                    onBlur={input.onBlur}
                                                                                    classNamePrefix="react-select"
                                                                                    value={selectedOption || null} // Set the selected option
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
                                                                    initialValue={User[fieldName[index]] || ''}
                                                                    // validate={isFieldRequired ? composeValidators(required) : required}
                                                                    validate={requiredfield[index] === '1' ? composeValidators(NAME) : (value) => composeValidators()(value)}

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
                                                                    initialValue={User[fieldName[index]] || ''}
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
                                                                    name={`${fieldName[index]}`}
                                                                    initialValue={User[fieldName[index]] || ''}
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
                                                                                value={input.value || ''}
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
                                                                            initialValue={User?.[fieldName[index]]
                                                                                ? moment(User[fieldName[index]]).isValid()
                                                                                    ? moment(User[fieldName[index]]).format('YYYY-MM-DD')
                                                                                    : User[fieldName[index]]
                                                                                : ''}
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
                                                                    name={`${fieldName[index]}`}
                                                                    initialValue={User[fieldName[index]] || ''}
                                                                    validate={isFieldRequired ? composeValidators(email) : (value) => composeValidators()(value)}
                                                                >
                                                                    {({ input, meta }) => (
                                                                        <div>
                                                                            <Label className='form-label' htmlFor={`displayname${index}`}>
                                                                                <strong>{label}</strong>
                                                                                {isFieldRequired && <span className="text-danger"> *</span>}
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

                                            <div>
                                                <Button color='primary' type='submit' className="me-3 mt-3">Edit User</Button>
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

                    <Button onClick={handleNavigation} color='warning'>
                        Yes
                    </Button>

                    {/* <Link to="/manage-facility/Consoft" className="btn btn-warning">Yes</Link> */}
                    <Button color="primary" onClick={() => setModal(!modal)}>No</Button>
                </ModalFooter>
            </Modal>
        </Fragment>
    );
};

export default EditUser;