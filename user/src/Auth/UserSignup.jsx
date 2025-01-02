import axios from 'axios';
import { BackendAPI } from "../api";
import React, { Fragment, useState, useEffect, useContext } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Card, CardBody, Row, Col, Button, Label } from 'reactstrap';
import { Btn, H4, P, H6, Image } from "../AbstractElements";
import { Field, Form } from 'react-final-form';
import Select from 'react-select';
import { jwtDecode } from "jwt-decode";
// import { required, email, Img, PDF, option, number, Name, NAME, username1, password } from '../Utils/validationUtils';
import { required, email, Img, PDF, option, number, Name, NAME, username1, password, expiryDate } from '../Components/Utils/validationUtils';
import { PermissionsContext } from "../contexts/PermissionsContext";
import logo from "../assets/images/logo/logo-icon.png";
import man from "../assets/images/dashboard/profile.jpg";
import { ToastContainer, toast } from "react-toastify";
import styles from './Signin.module.css'; // Import CSS module
import moment from 'moment';
import useDashboard from './userdashboardAuth'


const UserSignup = () => {
    // useDashboard();
    const navigate = useNavigate(); 
    const history = useNavigate();
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modal, setModal] = useState(false);
    const [fieldLabels, setFieldLabels] = useState([]);
    const [fieldType, setFieldType] = useState([]);
    const [requiredfield, setRequiredField] = useState([]); // Define requiredfield state
    const [fieldId, setFieldId] = useState([]);
    const [fieldName, setFieldName] = useState([]);
    const location = useLocation();
    const [prefixes, setPrefixes] = useState([]);
    const [state, setState] = useState([]);
    const [country, setCountry] = useState([]);
    const [regCat, setRegCat] = useState([]);
    const [workshop, setWorkshop] = useState([]);
    const [dayType, setDayType] = useState([]);
    const [custom, setCustom] = useState([]);
    const [username, setusername] = useState([]);
    const { updatePermissions } = useContext(PermissionsContext);
    const [serverUsernameError, setServerUsernameError] = useState("");
    const [serverPasswordError, setServerPasswordError] = useState("");

    const composeValidators = (...validators) => value =>
        validators.reduce((error, validator) => error || validator(value), undefined);

    const handleNavigation = () => {
        history(`${process.env.PUBLIC_URL}/userlogin`);
    };

    const toSentenceCase = (str) => {
        if (!str) return ''; // Handle empty or undefined strings
        return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
      };


    const handleSubmit = async (formData) => {
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

        if (values.cs_first_name) {
            values.cs_first_name = toSentenceCase(values.cs_first_name);
          }
    
          if (values.cs_last_name) {
            values.cs_last_name = toSentenceCase(values.cs_last_name);
          }
    

        // Manually add cs_reg_cat_id to the values object
        // values.cs_reg_cat_id = cs_reg_cat_id; 

        console.log('Formatted form data to send:', values);

        try {
            const response = await axios.post(`${BackendAPI}/auth/addBasicUser`, values, {
                headers: { 'Content-Type': 'application/json' }
            });

            if (response.status === 200) {
                const data = response.data;

                localStorage.setItem('Usertoken', data.token);
                localStorage.setItem('Userusername', data.username);
                localStorage.setItem('UserId', data.id);
                const decodedToken = jwtDecode(data.token);
                localStorage.setItem('Userauthenticated', true);
                localStorage.setItem("Userlogin", true);
                updatePermissions(data.permissions);
                localStorage.setItem("Username", decodedToken.role);
                localStorage.setItem("UserprofileURL", logo);
                localStorage.setItem("UserprofileURL", man);
                localStorage.setItem("Userusername", username);
                localStorage.setItem("Userpermissions", JSON.stringify(data.permissions));
                localStorage.setItem("UserloginSuccess", "true");
                history(`${process.env.PUBLIC_URL}/user-dashboard/Consoft`);
            } else {
                throw new Error('Failed to authenticate');
            }
        } catch (error) {
            console.error('Login error:', error.message);
            if (error.response && error.response.data && error.response.data.message) {
                const errorMessage = error.response.data.message;

                if (errorMessage.includes('Invalid username')) {
                    setServerUsernameError(errorMessage);
                } else if (errorMessage.includes('Invalid password')) {
                    setServerPasswordError(errorMessage);
                } else {
                    toast.error(errorMessage);
                }
            } else {
                toast.error('Failed to authenticate. Please try again.');
            }
        }

    };

    const fetchFields = async () => {
        try {
            // const token = getToken();
            const response = await axios.get(`${BackendAPI}/auth/getBasicField`, {
                headers: { 'Content-Type': 'application/json' }
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

    const fetchDropdown = async () => {
        try {
            const response = await axios.get(`${BackendAPI}/auth/getDropdownData`, {
            });
            setData(response.data);
            console.log(response.data);
            setLoading(false);

            const fetchprefixes = response.data.prefix;
            const fetchstate = response.data.states;
            const fetchcountry = response.data.country;
            const fetchCutomData = response.data.custom;


            setPrefixes(fetchprefixes);
            setState(fetchstate);
            setCountry(fetchcountry);

            setCustom(fetchCutomData);


            console.log(fetchprefixes);


        } catch (error) {
            console.error('Error fetching dropdown data:', error);
            setLoading(false);
        }
    };


    // useEffect(() => {
    //     fetchFields(); // Corrected function name
    // });

    useEffect(() => {
        fetchDropdown(); // Corrected function name
        fetchFields();
    }, []);

    const validateUniqueUsername = async (value) => {
        try {
            const response = await axios.get(`${BackendAPI}/auth/check-username/${value}`, {
            });
            if (response.data.exists) {
                return 'Username already taken';
            }
        } catch (error) {
            return 'Error checking username';
        }
        return undefined;
    };

    const validateUniqueEmail = async (value) => {

        console.log("value",value);
        try {
            const response = await axios.get(`${BackendAPI}/auth/check-email/${value}`, {
            });
            if (response.data.exists) {
                return 'Email is already registered';
            }
        } catch (error) {
            return 'Error checking email';
        }
        return undefined;
    };


    useEffect(() => {
        fetchSettings();
      }, []);
      
        const fetchSettings = async () => {
          try {
            setLoading(true);
            
            const response = await axios.get(`${BackendAPI}/auth/getsettings`, {});
            const fetchedSettings = response.data.settings;
            
            if (!fetchedSettings || fetchedSettings === "No") {
              // Redirect to 404 if settings are invalid or "no"
              navigate(`${process.env.PUBLIC_URL}/404`);
            }
            
            setLoading(false);
          } catch (error) {
            console.error("Error fetching settings:", error);
            toast.error("Failed to load settings data");
            setLoading(false);
          }
        };


    return (
        <div className='row justify-content-center align-items-center mt-5'>
            <Card className='col-12 col-md-6'>
                <CardBody className='row'>
                    <div className='col-12'>
                        <div className="text-center">
                            <img src={logo} alt="Logo" className="" />
                        </div>
                        <div className="text-center mt-2 mb-2">
                            <H4 style={{ color: '#15496b' }}>Basic Registration</H4>
                        </div>
                        {/* <P>Enter your email & password to login</P> */}
                        {/* <h2 className="mb-4">Sign Up</h2> */}
                        <Form
                            onSubmit={handleSubmit}
                            render={({ handleSubmit }) => (
                                <form onSubmit={handleSubmit} className='theme-form login-form'>
                                    <Row className="mt-5">
                                        {fieldLabels.map((label, index) => {
                                            const isFieldRequired = requiredfield[index] === '1';

                                            return (
                                                <Col key={index} xs={12} md={6} className="mb-3">
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

                                                    {fieldType[index] === 'Date' && (
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

                                                                        // min={minDate}
                                                                        max="9999-12-31"
                                                                    />
                                                                    {meta.error && meta.touched && <p className='d-block text-danger'>{meta.error}</p>}
                                                                </div>
                                                            )}
                                                        </Field>
                                                    )
                                                    }






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
                                                                        onBlur={(e) => {
                                                                            const trimmedValue = e.target.value.trim(); // Trim leading and trailing spaces on blur
                                                                            input.onBlur(trimmedValue);
                                                                            input.onChange(trimmedValue); // Update the form state with the trimmed value
                                                                        }}

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
                                                                        onBlur={(e) => {
                                                                            const trimmedValue = e.target.value.trim(); // Trim leading and trailing spaces on blur
                                                                            input.onBlur(trimmedValue);
                                                                            input.onChange(trimmedValue); // Update the form state with the trimmed value
                                                                        }}

                                                                    />
                                                                    {meta.error && meta.touched && <p className='d-block text-danger'>{meta.error}</p>}
                                                                </div>
                                                            )}
                                                        </Field>
                                                    )}


                                                    {fieldType[index] === 'Email' && (
                                                        <Field
                                                            name={`${fieldName[index]}`} // Use dynamic field name
                                                            validate={requiredfield[index] === '1' ? composeValidators(email,validateUniqueEmail) : (value) => composeValidators()(value)}
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
                                                                        onBlur={(e) => {
                                                                            const trimmedValue = e.target.value.trim(); // Trim leading and trailing spaces on blur
                                                                            input.onBlur(trimmedValue);
                                                                            input.onChange(trimmedValue); // Update the form state with the trimmed value
                                                                        }}

                                                                    />
                                                                    {meta.error && meta.touched && <p className='d-block text-danger'>{meta.error}</p>}
                                                                </div>
                                                            )}
                                                        </Field>
                                                    )}

                                                    {fieldType[index] === 'Username' && (
                                                        <Field
                                                            name={`${fieldName[index]}`} // Use dynamic field name
                                                            validate={requiredfield[index] === '1' ? composeValidators(username1,validateUniqueUsername) : (value) => composeValidators()(value)}
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
                                    {/* <Button color="primary" type="submit">Sign Up</Button> */}

                                    <div className="d-flex justify-content-center mt-3">
                                        <Btn attrBtn={{ className: 'd-block w-50', color: 'primary', type: 'submit' }}>
                                            Create Account
                                        </Btn>
                                    </div>

                                    <div className="text-center mt-3">
                                        Already registered?{' '}
                                        <a
                                            onClick={handleNavigation}
                                            className={styles.signupLink}
                                            style={{ color: 'blue', cursor: 'pointer' }}
                                        >Log in</a>
                                    </div>

                                </form>
                            )}
                        />
                    </div>
                </CardBody>
            </Card>
        </div>
    );
};

export default UserSignup;