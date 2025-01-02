import React, { useState, useEffect } from 'react';
import { Card, CardBody, CardHeader, FormGroup, Label, Input, Button, Row, Col, Alert, Table, Media } from 'reactstrap';
import axios from 'axios';
import Swal from 'sweetalert2';
import { BackendAPI } from '../../api'; // Adjust import path as per your project structure
import generatePDFFromCertificateListforList from './CertificatePrint';
import { ToastContainer, toast } from "react-toastify";
import { Field, Form } from 'react-final-form'; // Import Field and Form from react-final-form
import Select from 'react-select';
import { required, email, NAME, Img, PDF, option, number, radio, username1, password, expiryDate } from '../Utils/validationUtils';
import SweetAlert from 'sweetalert2';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import useDirectuser from '../../Auth/Directuser';

//Utility function used to combine multiple validation functions into a single validation function
const composeValidators = (...validators) => value =>
  validators.reduce((error, validator) => error || validator(value), undefined);

const Certificate = () => {
  // useDirectuser();
  const [settings, setSettings] = useState({
    certificate: 'No',
    feedbackForm: 'No',
    certificateWithFeedback: 'No',
  });
  const [regNo, setRegNo] = useState('');
  const [name, setName] = useState('');
  const [searchResult, setSearchResult] = useState([]);
  const [error, setError] = useState('');
  const [searchType, setSearchType] = useState('regNo'); // 'regNo' or 'name'

  const [fieldLabels, setFieldLabels] = useState([]);
  const [fieldType, setFieldType] = useState([]);
  const [requiredfield, setRequiredField] = useState([]); // Define requiredfield state
  const [fieldId, setFieldId] = useState([]);
  const [fieldName, setFieldName] = useState([]);
  const [fieldmulti, setfieldmulti] = useState([]);
  const navigate = useNavigate(); // Initialize useHistory
  const [modal, setModal] = useState(false);
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [prefixes, setPrefixes] = useState([]);
  const [state, setState] = useState([]);
  const [country, setCountry] = useState([]);
  const [regCat, setRegCat] = useState([]);
  const [workshop, setWorkshop] = useState([]);
  const [dayType, setDayType] = useState([]);
  const [custom, setCustom] = useState([]);

  console.log("fieldmulti", fieldmulti);
  console.log("settings.certificate", settings.certificate);
  console.log("settings.certificateWithFeedback", settings.certificateWithFeedback);


  const ratingFields = fieldLabels
    .map((label, index) => ({ label, type: fieldType[index], id: fieldId[index], fieldName: fieldName[index], index }))
    .filter((field) => field.type === "Rating");


  // Options for Search Type
  const searchTypeOptions = [
    { value: 'regNo', label: 'Registration Number' },
    { value: 'name', label: 'Name' },
  ];


  console.log("ratingFields", ratingFields);

  // Get "Your Rating" dropdown options
  const yourRatingOptions = custom.filter((option) =>
    fieldLabels.some(
      (label, index) => label === "Your Rating" && option.cs_field_id === fieldId[index]
    )
  );

  const dropdownOptions = yourRatingOptions.map((option) => ({
    value: option.cs_field_option_value,
    label: option.cs_field_option,
  }));

  useEffect(() => {
    fetchFields(); // Corrected function name
  }, []);

  useEffect(() => {
    fetchDropdown(); // Corrected function name
  }, []);


  console.log("ratingFields", ratingFields); // Check the structure of ratingFields array


  useEffect(() => {
    fetchSettings();
  }, []);

    const fetchSettings = async () => {
      try {
        setLoading(true);
        
        const response = await axios.get(`${BackendAPI}/auth/getsettings`, {});
        const fetchedSettings = response.data.settings;
        
        if (!fetchedSettings || fetchedSettings === "Yes") {
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


  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await axios.get(`${BackendAPI}/register/getCertFeedbackData`);

        console.log("response.data", response.data);

        if (response.data && response.data.setting) {
          // Map the settings array to extract the parameters
          const settings = response.data.setting.reduce((acc, setting) => {
            acc[setting.cs_parameter] = setting.cs_value;
            return acc;
          }, {});

          setSettings({
            certificate: settings.certificate || 'No',
            feedbackForm: settings.feedback_form || 'No',
            certificateWithFeedback: settings.certificate_with_feedback || 'No',
          });
        }
      } catch (error) {
        console.error('Error fetching settings:', error);
        Swal.fire('Error', 'Unable to fetch settings. Please try again.', 'error');
      }
    };

    fetchSettings();
  }, []);

  const handleSearch = async (e) => {

    console.log(e);
    // Ensure e is a valid event object
    // if (e && e.preventDefault) {
    //   e.preventDefault();
    // }

    // Validate input based on selected search type
    if (searchType === 'regNo' && !regNo) {
      setError('Please provide a Registration Number.');
      return;
    } else if (searchType === 'name' && !name) {
      setError('Please provide a Name.');
      return;
    }

    // Clear any existing error before making the request
    setError('');

    try {
      const response = await axios.post(`${BackendAPI}/register/searchCertificate`, {
        regNo,
        name,
        searchType,  // Send searchType to the backend to specify search method
      });

      // Handle the API response
      if (response.data && response.data.success) {
        setSearchResult(response.data.data); // Update search result with the fetched data
        // Swal.fire({
        //   title: 'Success!',
        //   text: 'Certificate data fetched successfully.',
        //   icon: 'success',
        //   confirmButtonText: 'OK',
        // });
      } else {
        setSearchResult([]); // Clear previous search results
        Swal.fire({
          title: 'Not Found',
          text: response.data.message || 'No matching data found.',
          icon: 'error',
          confirmButtonText: 'OK',
        });
      }
    } catch (error) {
      console.error('Error fetching certificate data:', error);
      setSearchResult([]); // Clear search results on error
      Swal.fire({
        title: 'Error',
        text: 'Something went wrong. Please try again.',
        icon: 'error',
        confirmButtonText: 'OK',
      });
    }
  };

  const handlePrintCertificate = async (user) => {
    try {
      console.log("User data for certificate:", user);

      const category = user.cs_reg_category;
      console.log("Category for user:", category);

      const payload = { category };
      console.log("Sending payload:", payload);

      // Fetch badge data for the specific user
      const response = await axios.post(`${BackendAPI}/register/getcertfileds`, payload);

      if (response.data && response.data.badgedata) {
        const apibadgeDataResponse = response.data.badgedata;
        console.log("Fetched badge data:", apibadgeDataResponse);

        // Process badge data fields for the user
        apibadgeDataResponse.badge_fields.forEach((field) => {
          if (user.hasOwnProperty(field.cs_field_name) && user[field.cs_field_name] !== null && user[field.cs_field_name] !== undefined) {
            field.cs_field_name = String(user[field.cs_field_name]).trim();
          } else if (field.cs_field_name === "fullname") {
            const fullName = user.cs_title
              ? `${user.cs_title} ${user.cs_first_name} ${user.cs_last_name}`
              : `${user.cs_first_name} ${user.cs_last_name}`;
            field.cs_field_name = fullName;
          } else {
            field.cs_field_name = "";
          }

          // Example: Bold the text if it's the First Name
          if (field.cs_field_label === "First Name") {
            field.textBold = true;
          } else {
            field.textBold = false;
          }
        });

        console.log("Final badge data for user:", apibadgeDataResponse);

        // Generate the certificate PDF for the specific user
        const badgeList = [apibadgeDataResponse];
        await generatePDFFromCertificateListforList(badgeList);

        toast.success('Certificate downloaded successfully.');
      } else {
        toast.error('No badge data found for this user.');
      }

    } catch (error) {
      console.error('Error fetching badge data:', error);
      if (error.response && error.response.data && error.response.data.error) {
        toast.error(error.response.data.error);
      } else {
        toast.error('An unexpected error occurred while fetching badge data.');
      }
    }
  };


  const fetchFields = async () => {
    try {
      const response = await axios.get(`${BackendAPI}/register/getFeedbackField`);
      const fieldsData = response.data.Fields;
      const requiredfield = fieldsData.map(field => field.cs_is_required);
      const fieldLabels = fieldsData.map(field => field.cs_field_label);
      const fieldType = fieldsData.map(field => field.field_type_name);
      const fieldId = fieldsData.map(field => field.cs_field_id);
      const fieldName = fieldsData.map(field => field.cs_field_name);
      const fieldmulti = fieldsData.map(field => field.cs_field_multi);

      setData(fieldsData);
      setFieldLabels(fieldLabels);
      setFieldType(fieldType);
      setFieldName(fieldName);
      setfieldmulti(fieldmulti);
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
      const response = await axios.get(`${BackendAPI}/register/getDropdownDataFeedback`);
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


  const onSubmit = async (formData) => {
    try {
      // Initialize an object to hold non-empty form data
      const values = {};

      // Loop through formData to filter out empty fields
      for (const key in formData) {
        if (Object.hasOwnProperty.call(formData, key)) {
          if (formData[key].value !== '') {
            values[key] = formData[key].value || formData[key];
          }
        }
      }

      console.log('Formatted form data to send:', values);

      // Make the API call to submit feedback
      const response = await axios.post(`${BackendAPI}/register/submitFeedback`, values);

      // If the feedback submission is successful
      if (response.data.success) {
        const userData = response.data.user; // Extract user data from the response

        // Call handlePrintCertificate with the user data
        handlePrintCertificate(userData);

        // Show success message
        SweetAlert.fire({
          title: 'Success!',
          html: `Feedback Submitted successfully!`,
          icon: 'success',
          timer: 3000,
          showConfirmButton: false,
          allowOutsideClick: false,
          allowEscapeKey: false,
        }).then((result) => {
          // Navigate to another page after success
          if (result.dismiss === SweetAlert.DismissReason.timer) {
            navigate(`${process.env.PUBLIC_URL}/thank-you`);
          }
        });
      } else {
        // Handle failure case where success is false
        SweetAlert.fire({
          title: 'Error!',
          html: response.data.message || 'Something went wrong. Please try again.',
          icon: 'error',
          confirmButtonText: 'OK',
        });
      }
    } catch (error) {
      // Log any errors that occur during the request
      console.error('Error submitting feedback:', error.message);

      // Handle API errors with a response
      const errorMessage = error.response?.data?.message || 'Failed to submit feedback. Please try again.';
      SweetAlert.fire({
        title: 'Error!',
        html: errorMessage,
        icon: 'error',
        confirmButtonText: 'OK',
      });
    }
  };



  const handleCancel = () => {
    setModal(true);
  };



  return (
    <Row className="justify-content-center mt-4">
      <Col md="8">
        <Card>
          <CardHeader>
            <h5>{settings.certificate === 'Yes' && settings.certificateWithFeedback === 'Yes' ? 'Feedback Form' : 'Search Certificate'}</h5>
          </CardHeader>
          <CardBody>
            {settings.certificate === 'Yes' && settings.certificateWithFeedback === 'Yes' ? (
              // Feedback Form
              <Form
                onSubmit={onSubmit}
              >
                {({ handleSubmit }) => (
                  <form className="needs-validation" noValidate onSubmit={handleSubmit}>
                    <Row className="d-flex flex-wrap">
                      {fieldLabels.map((label, index) => {
                        const isFieldRequired = requiredfield[index] === '1'; // Use string comparison for clarity
                        const fieldTypeValue = fieldType[index];

                        // Check if the field type is valid
                        if (!['Long Text', 'Number', 'Text', 'Email', 'Radio', 'Dropdown', 'MCQ', 'Date'].includes(fieldTypeValue)) {
                          return null; // Skip rendering this Col if the fieldType is invalid
                        }

                        return (
                          <Col
                            key={index}
                            xs={12}  // Full width for small devices
                            sm={6}   // Half width for medium devices
                            md={4}   // One-third width for larger devices
                            className="mb-3"
                          >
                            {/* Render fields based on their type */}
                            {fieldTypeValue === 'Long Text' && (
                              <Field
                                name={`${fieldName[index]}`} // Use dynamic field name
                                validate={isFieldRequired ? composeValidators(required) : (value) => composeValidators()(value)}
                              >
                                {({ input, meta }) => (
                                  <div>
                                    <Label className="form-label" for={`displayname${index}`}>
                                      <strong>{label}</strong>{isFieldRequired && <span className="text-danger"> *</span>}
                                    </Label>
                                    <textarea
                                      {...input}
                                      className="form-control"
                                      id={`displayname${index}`}
                                      placeholder={`Enter ${label}`}
                                    />
                                    {meta.error && meta.touched && <p className="d-block text-danger">{meta.error}</p>}
                                  </div>
                                )}
                              </Field>
                            )}

                            {fieldTypeValue === 'Number' && (
                              <Field
                                name={`${fieldName[index]}`} // Use dynamic field name
                                validate={isFieldRequired ? composeValidators(number) : (value) => composeValidators()(value)}
                              >
                                {({ input, meta }) => (
                                  <div>
                                    <Label className="form-label" for={`displayname${index}`}>
                                      <strong>{label}</strong>{isFieldRequired && <span className="text-danger"> *</span>}
                                    </Label>
                                    <input
                                      {...input}
                                      className="form-control"
                                      id={`displayname${index}`}
                                      type="number"
                                      placeholder={`Enter ${label}`}
                                    />
                                    {meta.error && meta.touched && <p className="d-block text-danger">{meta.error}</p>}
                                  </div>
                                )}
                              </Field>
                            )}

                            {fieldTypeValue === 'Text' && (
                              <Field
                                name={`${fieldName[index]}`} // Use dynamic field name
                                validate={isFieldRequired ? composeValidators(NAME) : (value) => composeValidators()(value)}
                              >
                                {({ input, meta }) => (
                                  <div>
                                    <Label className="form-label" for={`displayname${index}`}>
                                      <strong>{label}</strong>{isFieldRequired && <span className="text-danger"> *</span>}
                                    </Label>
                                    <input
                                      {...input}
                                      className="form-control"
                                      id={`displayname${index}`}
                                      type="text"
                                      placeholder={`Enter ${label}`}
                                    />
                                    {meta.error && meta.touched && <p className="d-block text-danger">{meta.error}</p>}
                                  </div>
                                )}
                              </Field>
                            )}

                            {fieldTypeValue === 'Email' && (
                              <Field
                                name={`${fieldName[index]}`} // Use dynamic field name
                                validate={isFieldRequired ? composeValidators(email) : (value) => composeValidators()(value)}
                              >
                                {({ input, meta }) => (
                                  <div>
                                    <Label className="form-label" for={`displayname${index}`}>
                                      <strong>{label}</strong>{isFieldRequired && <span className="text-danger"> *</span>}
                                    </Label>
                                    <input
                                      {...input}
                                      className="form-control"
                                      id={`displayname${index}`}
                                      type="text"
                                      placeholder={`Enter ${label}`}
                                    />
                                    {meta.error && meta.touched && <p className="d-block text-danger">{meta.error}</p>}
                                  </div>
                                )}
                              </Field>
                            )}

                            {fieldTypeValue === 'Radio' && (
                              <Field
                                name={`${fieldName[index]}`} // Use dynamic field name
                                validate={isFieldRequired ? composeValidators(radio) : (value) => composeValidators()(value)}
                              >
                                {({ input, meta }) => (
                                  <div>
                                    <Label className="form-label" for={`radio${index}`}>
                                      <strong>{label}</strong>{isFieldRequired && <span className="text-danger"> *</span>}
                                    </Label>
                                    <div>
                                      <Media body className="icon-state switch-sm">
                                        <Label className="switch">
                                          <Input
                                            type="checkbox"
                                            checked={input.value === 'Yes'}
                                            onChange={(e) => input.onChange(e.target.checked ? 'Yes' : 'No')}
                                          />
                                          <span
                                            className={"switch-state " + (input.value === 'Yes' ? "bg-success" : "bg-danger")}
                                          ></span>
                                        </Label>
                                      </Media>
                                    </div>
                                    {meta.error && meta.touched && <p className="d-block text-danger">{meta.error}</p>}
                                  </div>
                                )}
                              </Field>
                            )}

                            {fieldType[index] === 'Dropdown' && (
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

                            {fieldType[index] === 'MCQ' && (
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
                                      {/* Check if fieldmulti is 1 for checkboxes or 0 for radio buttons */}
                                      <div className="d-flex flex-wrap">
                                        {/* Use d-flex to display horizontally */}
                                        {matchedOptions.map((option, i) => (
                                          fieldmulti[index] === '1' ? (  // Check if it's multi-select
                                            <div key={i}> {/* Use form-check-inline for horizontal alignment */}
                                              <input
                                                type="checkbox"
                                                id={`checkbox-${fieldName[index]}-${i}`}
                                                name={`${fieldName[index]}[]`} // Use array notation to handle multiple selections
                                                value={option.cs_field_option_value}
                                                checked={input.value && input.value.includes(option.cs_field_option_value)} // For multi-select, check if the value is included
                                                onChange={(e) => {
                                                  const currentValues = Array.isArray(input.value) ? [...input.value] : []; // Create a copy of the array
                                                  if (e.target.checked) {
                                                    // Add the value if it's checked
                                                    if (!currentValues.includes(option.cs_field_option_value)) {
                                                      currentValues.push(option.cs_field_option_value);
                                                    }
                                                  } else {
                                                    // Remove the value if it's unchecked
                                                    const updatedValues = currentValues.filter(
                                                      (val) => val !== option.cs_field_option_value
                                                    );
                                                    input.onChange(updatedValues); // Update the state with the filtered array
                                                    return;
                                                  }
                                                  input.onChange(currentValues); // Update the state with the new array
                                                }}
                                                onBlur={input.onBlur}
                                              />
                                              <Label htmlFor={`checkbox-${fieldName[index]}-${i}`} className="form-check-label me-3" style={{ marginLeft: '10px' }}>
                                                {option.cs_field_option}  
                                              </Label>
                                            </div>
                                          ) : (  // If fieldmulti is 0, render radio buttons for single select
                                            <div key={i}>
                                              <Input
                                                type="radio"
                                                id={`radio-${fieldName[index]}-${i}`}
                                                name={`${fieldName[index]}`} // Same name for all radio buttons in this group
                                                value={option.cs_field_option_value}
                                                checked={input.value === option.cs_field_option_value} // For radio, check if value matches the selected option
                                                onChange={input.onChange}
                                                onBlur={input.onBlur}
                                              />
                                              <Label htmlFor={`radio-${fieldName[index]}-${i}`} className="form-check-label" style={{ marginLeft: '10px' }}>
                                                {option.cs_field_option}
                                              </Label>
                                            </div>
                                          )
                                        ))}
                                      </div>
                                      {meta.error && meta.touched && <p className='d-block text-danger'>{meta.error}</p>}
                                    </div>
                                  );
                                }}
                              </Field>
                            )}


                            {fieldTypeValue === 'Date' && (
                              <Field
                                name={`${fieldName[index]}`} // Use dynamic field name
                                validate={isFieldRequired ? composeValidators(expiryDate) : (value) => composeValidators()(value)}
                              >
                                {({ input, meta }) => (
                                  <div>
                                    <Label className="form-label" for={`displayname${index}`}>
                                      <strong>{label}</strong>{isFieldRequired && <span className="text-danger"> *</span>}
                                    </Label>
                                    <input
                                      {...input}
                                      className="form-control"
                                      id={`displayname${index}`}
                                      type="date"
                                      placeholder={`Enter ${label}`}
                                      max="9999-12-31"
                                    />
                                    {meta.error && meta.touched && <p className="d-block text-danger">{meta.error}</p>}
                                  </div>
                                )}
                              </Field>
                            )}
                          </Col>
                        );
                      })}

                      {/* {fieldType[index] === 'Rating' && ( */}

                      <Table bordered className="mt-4">
                        <thead>
                          <tr>
                            <th>Category</th>
                            {dropdownOptions.map((option, index) => (
                              <th key={index}>{option.label}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {ratingFields.map((field, index) => (
                            <tr key={field.id}>
                              {/* Column 1: Category */}
                              <td>
                                <Label>{field.label}</Label>
                              </td>

                              {/* Columns 2+: Radio Buttons for Options */}
                              {dropdownOptions.map((option, idx) => (
                                <td key={idx}>
                                  {/* Use field.label for dynamic name and id */}
                                  <Field name={`${field.fieldName}`} type="radio" value={option.value}>
                                    {({ input }) => (
                                      <Input
                                        {...input}
                                        type="radio"
                                        value={option.value}
                                        id={`${field.label}`} // Unique ID based on label and option
                                        name={`${field.fieldName}`} // Unique name based on field.label (category name)
                                      />
                                    )}
                                  </Field>
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </Table>





                      {/* )} */}

                      {/* {AddUserPermissions?.add === 1 && ( */}
                      <div>
                        <Button color='primary' type='submit' className="me-2 mt-3">Submit Feedback</Button>
                        <Button color='warning' onClick={handleCancel} className="mt-3">Cancel</Button>
                      </div>
                      {/* )} */}
                    </Row>
                  </form>
                )}
              </Form>
            ) : settings.certificate === 'Yes' && settings.certificateWithFeedback === 'No' ? (
              // Static Certificate Search Form with React Final Form
              <Form onSubmit={handleSearch}>
                {({ handleSubmit }) => (
                  <form noValidate onSubmit={handleSubmit}>
                    <Row>
                      <Col md="6">
                        <FormGroup>
                          <label htmlFor="searchType">Search By:</label>
                          <Select
                            id="searchType"
                            options={searchTypeOptions}
                            value={searchTypeOptions.find((option) => option.value === searchType)}
                            onChange={(selected) => setSearchType(selected.value)}
                            isClearable={false}
                            placeholder="Select Search Type"
                          />
                        </FormGroup>
                      </Col>
                    </Row>

                    {/* Conditionally render fields based on selected searchType */}
                    {searchType === 'regNo' && (
                      <Row>
                        <Col md="6">
                          <FormGroup>
                            <label htmlFor="regNo">Search by Registration Number:</label>
                            <Input
                              type="text"
                              id="regNo"
                              value={regNo}
                              onChange={(e) => setRegNo(e.target.value)}
                              placeholder="Enter Registration Number"
                            />
                          </FormGroup>
                        </Col>
                      </Row>
                    )}

                    {searchType === 'name' && (
                      <Row>
                        <Col md="6">
                          <FormGroup>
                            <label htmlFor="name">Search by Name:</label>
                            <Input
                              type="text"
                              id="name"
                              value={name}
                              onChange={(e) => setName(e.target.value)}
                              placeholder="Enter Name"
                            />
                          </FormGroup>
                        </Col>
                      </Row>
                    )}

                    {error && <Alert color="danger">{error}</Alert>}
                    <Button color="primary" type="submit">
                      Search
                    </Button>
                  </form>
                )}
              </Form>
            ) : (
              <h3>Feedback Form not Acticvated !</h3>
            )}

            {searchResult && searchResult.length > 0 && (
              <div className="mt-4">
                <h6>Search Result:</h6>
                <Table bordered>
                  <thead>
                    <tr>
                      <th>Reg No</th>
                      <th>Name</th>
                      <th>Category</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {searchResult.map((user, index) => (
                      <tr key={index}>
                        <td>{user.cs_regno}</td>
                        <td>{user.cs_first_name} {user.cs_last_name}</td>
                        <td>{user.cs_reg_category}</td>
                        <td>
                          <Button
                            color="success"
                            size="sm"
                            onClick={() => handlePrintCertificate(user)}
                          >
                            Download Certificate
                          </Button>
                        </td>
                      </tr>
                    ))}

                  </tbody>
                </Table>
              </div>
            )}
          </CardBody>
        </Card>
      </Col>
    </Row>
  );
};

export default Certificate;
