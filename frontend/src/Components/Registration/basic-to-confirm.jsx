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
import { required, email, Img, PDF, option, number, Name, NAME, radio, username, expiryDate } from '../Utils/validationUtils';
import { PermissionsContext } from '../../contexts/PermissionsContext';
import useAuth from '../../Auth/protectedAuth';
import { toast } from 'react-toastify';
import { getToken } from '../../Auth/Auth';
import moment from 'moment';



//Utility function used to combine multiple validation functions into a single validation function
const composeValidators = (...validators) => value =>
    validators.reduce((error, validator) => error || validator(value), undefined);

const AdminConfirmUser = () => {
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
    const { Data } = location.state || {};
    const [prefixes, setPrefixes] = useState([]);
    const [state, setState] = useState([]);
    const [country, setCountry] = useState([]);
    const [regCat, setRegCat] = useState([]);
    const [workshop, setWorkshop] = useState([]);
    const [dayType, setDayType] = useState([]);
    const [custom, setCustom] = useState([]);
    const [customfield, setCustomfield] = useState([]);
    const [ticket, setTicket] = useState([]);
    const [filteredTickets, setFilteredTickets] = useState([]); // State for filtered tickets
    const [filteredAddon, setFilteredAddon] = useState([]);
    const [paymentType, setPaymentType] = useState([]);
    const [paymentStatus, setPaymentStatus] = useState([]);
    const [ticketAmount, setTicketAmount] = useState([]);
    const [addonAmount, setAddonAmount] = useState([]);
    const [addonCounts, setAddonCounts] = useState({});
    const [addon, setAddon] = useState([]);
    const [regAmount, setRegAmount] = useState('');
    const [regAddonAmount, setRegAddonAmount] = useState('');
    const [processingAmount, setProcessingAmount] = useState('');
    const [processingFee, setProcessingFee] = useState('');
    const [totalPaidAmount, settotalPaidAmount] = useState('');
    const { permissions } = useContext(PermissionsContext);
    const [category, setCategory] = useState(''); // Define state and setter
    const [addonticket, setAddonTicket] = useState(''); // Define state and setter
    const [showNextStep, setShowNextStep] = useState(false); // Handles when "Next" is clicked
    const [isChecked, setIsChecked] = useState(false); // Track the state of the checkbox
    const [sendEmail, setSendEmail] = useState(false);
    const paymentTypeOptions = paymentType.map(type => ({
        value: type.paymenttype_id,
        label: type.paymenttype_name
    }));
    const paymentStatusOptions = paymentStatus.map(status => ({
        value: status.paymentstatus_id,
        label: status.paymentstatus_name
    }));


    console.log("Addon Ticket", addonticket);
    console.log("Ticket Amount", ticketAmount);
    console.log("Addon Amount", addonAmount);
    console.log("Reg Amount", regAmount);
    console.log("Reg Addon Amount", regAddonAmount);
    console.log("Processing Fee", processingFee);







    const empty = '';



    console.log("Temp Data", Data);
    // console.log("Ticket", ticket);
    console.log("Category to match", category);






    useEffect(() => {
        fetchFields(); // Corrected function name
    }, [permissions]);

    useEffect(() => {
        fetchDropdown(); // Corrected function name
    }, []);




    // Extract Add User setting Permissions component
    const AddUserPermissions = permissions['AdminConfirmUser'];

    const fetchFields = async () => {
        try {
            const token = getToken();
            const response = await axios.get(`${BackendAPI}/reguser/getField`, {
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
            const customfield = fieldsData.map(field => field.cs_iscustom);


            console.log("Data:", fieldsData);
            console.log("Custom:", customfield);



            // setData(fieldsData);
            setFieldLabels(fieldLabels);
            setFieldType(fieldType);
            setFieldName(fieldName);
            setCustomfield(customfield);
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
        const username = formData.cs_first_name;

        try {
            // Filter out fields with empty values and exclude payment-related fields from 'values'
            const toastId = toast.info('Processing...', { autoClose: false });
            const values = {};
            const paymentDetails = {};

            const paymentFields = [
                'total_paid_amount',
                'processing_fee',
                'conference_fees',
                'branch',
                'bank',
                'payment_date',
                'cheque_no',
                'payment_mode',
                'paymenttype_id',
                'paymentstatus_id',
                'currency',
                'temppayment_id', // Added temppayment_id
            ];

            for (const key in formData) {
                if (Object.hasOwnProperty.call(formData, key)) {
                    if (formData[key].value !== '') {
                        // Add payment-related fields to paymentDetails
                        if (paymentFields.includes(key)) {
                            paymentDetails[key] = formData[key].value || formData[key];
                        } else {
                            // Add other fields to values
                            values[key] = formData[key].value || formData[key];
                        }
                    }
                }
            }

            // Add temppayment_id to paymentDetails manually from Data object
            if (Data?.temppayment_id) {
                paymentDetails.temppayment_id = Data.temppayment_id;
            }

            console.log('Formatted form data to send:', values);
            console.log('Payment details to send:', paymentDetails);

            const token = getToken();

            if (Data?.id) {
                // Make the API call to add user with separate data and payment details
                const response = await axios.post(`${BackendAPI}/reguser/addTempConfirmUser`, {
                    data: values, // Send the filtered data
                    paymentDetails: paymentDetails, // Send the payment details separately
                    Id: Data.id
                }, {
                    headers: {
                        Authorization: `Bearer ${token}` // Include the token in the Authorization header
                    }
                });

                toast.dismiss(toastId);


                if (response.data.success) {
                    SweetAlert.fire({
                        title: 'Success!',
                        text: sendEmail ?
                            `User <b>${username}</b> created and mail sent successfully!` :
                            `User <b>${username}</b> created successfully!`,
                        icon: 'success',
                        timer: 3000,
                        showConfirmButton: false,
                        allowOutsideClick: false,
                        allowEscapeKey: false
                    }).then((result) => {
                        if (result.dismiss === SweetAlert.DismissReason.timer) {
                            navigate(`${process.env.PUBLIC_URL}/registration/confirm-user-listing/Consoft`);
                        }
                    });
                }
            } else {
                // Execute other API when Data is empty
                const alternateResponse = await axios.post(`${BackendAPI}/reguser/addBasConfUser`, {
                    data: values, // You can send the same or different data here
                    paymentDetails: paymentDetails,
                }, {
                    headers: {
                        Authorization: `Bearer ${token}` // Include the token in the Authorization header
                    }
                });

                if (alternateResponse.data.success) {
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
                            navigate(`${process.env.PUBLIC_URL}/registration/confirm-user-listing/Consoft`);
                        }
                    });
                }
            }
        } catch (error) {
            console.error('Error creating user:', error.message);
        }
    };




    useEffect(() => {
        const filterTickets = () => {
            if (category) {
                const parsedCategory = JSON.parse(category); // Parse the category

                const filtered = ticket.filter(ticket => {
                    // Check if ticket_category is valid
                    if (ticket.ticket_category && ticket.ticket_category !== 'null') {
                        try {
                            const ticketCategories = JSON.parse(ticket.ticket_category); // Parse ticket_category
                            return Array.isArray(ticketCategories) && ticketCategories.includes(parsedCategory); // Ensure it's an array and includes the category
                        } catch (e) {
                            console.error("Error parsing ticket category:", e);
                            return false; // Return false if parsing fails
                        }
                    }
                    return false; // If ticket_category is null or invalid, return false
                });
                setFilteredTickets(filtered); // Set filtered tickets
            } else {
                setFilteredTickets([]); // If no category, show all tickets
            }
        };

        const filterAddon = () => {
            if (addonticket) {
                const parsedAddon = JSON.parse(addonticket); // Parse the selected addon ticket
                console.log("Addon:", parsedAddon);

                // Find the matching ticket based on the addon ticket ID
                const matchedTicket = ticketAmount.find(ticketItem => ticketItem.ticket_id === parsedAddon);
                console.log("Matched", matchedTicket);
                if (matchedTicket) {
                    const amount = matchedTicket.tick_amount; // Get the ticket amount
                    setRegAmount(amount); // Store the ticket amount in regAmount

                    // Calculate the processing fee based on the percentage
                    const currentAmount = parseFloat(regAmount);
                    const processingPercentage = processingFee.cs_value; // This should be your percentage
                    const processingFeeAmount = parseFloat(amount * processingPercentage) / 100; // Calculate processing fee

                    console.log("Processing Fees", processingFeeAmount);

                    setProcessingAmount(processingFeeAmount); // Set the calculated processing fee
                    settotalPaidAmount(currentAmount + processingFeeAmount);
                    console.log("Matched Ticket Amount:", amount);
                    console.log("Processing Fee Amount:", processingFeeAmount);
                } else {
                    setRegAmount(''); // Reset if no matching ticket is found
                    setProcessingAmount(0); // Reset processing amount as well
                }


                const filtered = addon.filter(addon => {
                    if (addon.addon_ticket_ids && addon.addon_ticket_ids !== 'null') {
                        try {
                            const parsedTicketIds = JSON.parse(addon.addon_ticket_ids);
                            console.log("Parsed Ticket Addon IDs:", parsedTicketIds);
                            return Array.isArray(parsedTicketIds) && parsedTicketIds.includes(parsedAddon);
                        } catch (e) {
                            console.error("Error parsing addon ticket IDs:", e);
                            return false; // Return false if parsing fails
                        }
                    }
                    return false; // If addon_ticket_ids is null or invalid, return false 
                });

                setFilteredAddon(filtered); // Set the filtered addons
            } else {
                setFilteredAddon([]); // If no category, reset the filtered addons
                setRegAmount(''); // Reset regAmount if no addonticket
            }
        };

        // Call the filter functions
        filterTickets(); // Call the filter function
        filterAddon(); // Call the filter function
    }, [category, addonticket, ticket]); // Run effect when category or tickets change

    console.log("Addon Ticket", addonticket);
    console.log("Ticket Amount", ticketAmount);






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

            // Extracting the data from the response
            const fetchprefixes = response.data.prefix;
            const fetchstate = response.data.states;
            const fetchcountry = response.data.country;
            const fetchregcat = response.data.regCategory;
            const fetchworkshop = response.data.workshop;
            const fetchdaytype = response.data.dayType;
            const fetchCutomData = response.data.custom;
            const fetchTicket = response.data.ticket;
            const fetchAddon = response.data.addon;
            const fetchPaymentType = response.data.paymentType;
            const fetchPaymentStatus = response.data.paymentStatus;
            const fetchTicketAmount = response.data.ticketAmount;
            const fetchAddonAmount = response.data.addonAmount;
            const fetchProcessingFee = response.data.processingFees[0];

            console.log("Fetched Ticket Amount", fetchTicketAmount);

            // Get the current date
            const currentDate = new Date();

            // Filter ticket amounts based on the current date
            const filteredTicketAmount = fetchTicketAmount.filter(ticket => {
                const startDate = new Date(ticket.tick_duration_start_date);
                const endDate = new Date(ticket.tick_duration_till_date);
                return startDate <= currentDate && endDate >= currentDate;
            });

            // Log filtered ticket amounts
            console.log("Filtered Ticket Amount", filteredTicketAmount);

            setTicket(fetchTicket);

            // Set other states
            setPrefixes(fetchprefixes);
            setState(fetchstate);
            setCountry(fetchcountry);
            setRegCat(fetchregcat);
            setWorkshop(fetchworkshop);
            setDayType(fetchdaytype);
            setCustom(fetchCutomData);
            setAddon(fetchAddon);
            setPaymentType(fetchPaymentType);
            setPaymentStatus(fetchPaymentStatus);
            setTicketAmount(filteredTicketAmount); // Set the filtered ticket amounts
            setAddonAmount(fetchAddonAmount);
            setProcessingFee(fetchProcessingFee);

            console.log(fetchprefixes);

        } catch (error) {
            console.error('Error fetching dropdown data:', error);
            setLoading(false);
        }
    };





    const handleNavigation = () => {
        navigate(`${process.env.PUBLIC_URL}/User-listing/Consoft`);
    };

    const handleCheckboxChange = (e) => {
        const checked = e.target.checked;
        setIsChecked(checked); // Set the checkbox state
        if (checked) {
            setShowNextStep(false); // Ensure the form stays in the first and second row when checkbox is checked

        }
    };

    const handleNextClick = () => {
        setShowNextStep(true); // Move to the third row and show Submit/Cancel buttons
    };

    const handleBackClick = () => {
        setShowNextStep(false); // Go back to the first and second rows
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
                                        <form className="needs-validation" noValidate="" onSubmit={handleSubmit}>
                                            {/* Main row for the first and second rows */}
                                            {!showNextStep && (
                                                <Row className="d-flex flex-wrap">
                                                    {fieldLabels.map((label, index) => {
                                                        const isFieldRequired = requiredfield[index] === '1'; // Use string comparison for clarity
                                                        return (
                                                            <Col
                                                                key={index}
                                                                xs={12} // Full width for small devices
                                                                sm={6}  // Half width for medium devices
                                                                md={4}  // One-third width for larger devices
                                                                className="mb-3"
                                                            >
                                                                {/* Render the fields */}
                                                                {fieldType[index] === 'Dropdown' && fieldLabels[index] === 'Title' && (
                                                                    <Field
                                                                        name={`${fieldName[index]}`}
                                                                        initialValue={Data?.cs_title || ''} // Use optional chaining to avoid errors
                                                                        validate={isFieldRequired ? composeValidators(option) : (value) => composeValidators()(value)}
                                                                    >
                                                                        {({ input, meta }) => {
                                                                            const selectedOption = prefixes.find(option => option.cs_prefix === Data?.cs_title);
                                                                            let options = prefixes.map(pref => ({
                                                                                value: pref.cs_prefix,
                                                                                label: pref.cs_prefix,
                                                                            }));

                                                                            if (!isFieldRequired) {
                                                                                options = [{ value: '', label: 'Select' }, ...options];
                                                                            }

                                                                            return (
                                                                                <div>
                                                                                    <Label className='form-label' for={`displayname${index}`}>
                                                                                        <strong>{label}</strong>{isFieldRequired && <span className="text-danger"> *</span>}
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




                                                                {
                                                                    fieldType[index] === 'Dropdown' && fieldLabels[index] === 'State' && (
                                                                        <Field
                                                                            name={`${fieldName[index]}`}
                                                                            initialValue={Data?.cs_state || ''}
                                                                            // Use optional chaining to avoid errors
                                                                            validate={isFieldRequired ? composeValidators(option) : (value) => composeValidators()(value)}
                                                                        >
                                                                            {({ input, meta }) => {
                                                                                const selectedOption = state.find(option => option.cs_state_name === Data?.cs_state);
                                                                                let options = state.map(pref => ({
                                                                                    value: pref.cs_state_name,
                                                                                    label: pref.cs_state_name,
                                                                                }));

                                                                                if (!isFieldRequired) {
                                                                                    options = [{ value: '', label: 'Select' }, ...options];
                                                                                }

                                                                                return (
                                                                                    <div>
                                                                                        <Label className='form-label' for={`displayname${index}`}>
                                                                                            <strong>{label}</strong>{isFieldRequired && <span className="text-danger"> *</span>}
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

                                                                    )

                                                                }

                                                                {
                                                                    fieldType[index] === 'Dropdown' && fieldLabels[index] === 'Country' && (
                                                                        <Field
                                                                            name={`${fieldName[index]}`}
                                                                            initialValue={Data?.cs_country || ''} // Use optional chaining to avoid errors
                                                                            validate={isFieldRequired ? composeValidators(option) : (value) => composeValidators()(value)}
                                                                        >
                                                                            {({ input, meta }) => {
                                                                                const selectedOption = country.find(option => option.cs_country === Data?.cs_country);
                                                                                let options = country.map(pref => ({
                                                                                    value: pref.cs_country,
                                                                                    label: pref.cs_country,
                                                                                }));

                                                                                if (!isFieldRequired) {
                                                                                    options = [{ value: '', label: 'Select' }, ...options];
                                                                                }

                                                                                return (
                                                                                    <div>
                                                                                        <Label className='form-label' for={`displayname${index}`}>
                                                                                            <strong>{label}</strong>{isFieldRequired && <span className="text-danger"> *</span>}
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

                                                                    )


                                                                }

                                                                {
                                                                    fieldType[index] === 'Dropdown' && fieldLabels[index] === 'Workshop Category' && (
                                                                        <Field
                                                                            name={`${fieldName[index]}`}
                                                                            initialValue={Data?.cs_workshop_category || ''} // Use optional chaining to avoid errors
                                                                            validate={isFieldRequired ? composeValidators(option) : (value) => composeValidators()(value)}
                                                                        >
                                                                            {({ input, meta }) => {
                                                                                const selectedOption = workshop.find(option => option.cs_workshop_id === Data?.cs_workshop_category);
                                                                                let options = workshop.map(pref => ({
                                                                                    value: pref.cs_workshop_id,
                                                                                    label: pref.cs_workshop_name,
                                                                                }));

                                                                                if (!isFieldRequired) {
                                                                                    options = [{ value: '', label: 'Select' }, ...options];
                                                                                }

                                                                                return (
                                                                                    <div>
                                                                                        <Label className='form-label' for={`displayname${index}`}>
                                                                                            <strong>{label}</strong>{isFieldRequired && <span className="text-danger"> *</span>}
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
                                                                    )

                                                                }

                                                                {
                                                                    fieldType[index] === 'Dropdown' && fieldLabels[index] === 'Registration Category' && (
                                                                        <Field
                                                                            name={`${fieldName[index]}`}
                                                                            initialValue={Data?.cs_reg_cat_id || ''} // Use optional chaining to avoid errors
                                                                            validate={isFieldRequired ? composeValidators(option) : (value) => composeValidators()(value)}
                                                                        >
                                                                            {({ input, meta }) => {
                                                                                const selectedOption = regCat.find(option => option.cs_reg_cat_id === Data?.cs_reg_cat_id);
                                                                                let options = regCat.map(pref => ({
                                                                                    value: pref.cs_reg_cat_id,
                                                                                    label: pref.cs_reg_category,
                                                                                }));

                                                                                if (!isFieldRequired) {
                                                                                    options = [{ value: '', label: 'Select' }, ...options];
                                                                                }

                                                                                return (
                                                                                    <div>
                                                                                        <Label className='form-label' for={`displayname${index}`}>
                                                                                            <strong>{label}</strong>{isFieldRequired && <span className="text-danger"> *</span>}
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
                                                                    )


                                                                }


                                                                {
                                                                    fieldType[index] === 'Dropdown' && fieldLabels[index] === 'Registration Type' && (
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
                                                                    )
                                                                }

                                                                {/* Ticket */}
                                                                {
                                                                    fieldType[index] === 'Dropdown' && fieldLabels[index] === 'Ticket' && (
                                                                        <Field
                                                                            name={`${fieldName[index]}`} // Use dynamic field name
                                                                            initialValue={Data?.cs_ticket || ''}
                                                                            validate={requiredfield[index] === '1' ? composeValidators(option) : (value) => composeValidators()(value)}
                                                                        >
                                                                            {({ input, meta }) => {
                                                                                const selectedOption = ticket.find(option => option.ticket_id === parseInt(Data?.cs_ticket));


                                                                                let options = ticket.map(pref => ({
                                                                                    value: pref.ticket_id,
                                                                                    label: pref.ticket_title,
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
                                                                                                console.log("Selected Option:", selectedOption);
                                                                                                input.onChange(selectedOption ? selectedOption.value : '');
                                                                                                setAddonTicket(selectedOption.value);
                                                                                            }}

                                                                                            onBlur={input.onBlur}
                                                                                            classNamePrefix="react-select"
                                                                                            value={options.find(option => option.value === parseInt(input.value)) || null}
                                                                                        />
                                                                                        {meta.error && meta.touched && <p className='d-block text-danger'>{meta.error}</p>}
                                                                                    </div>
                                                                                );
                                                                            }}
                                                                        </Field>
                                                                    )
                                                                }

                                                                {/* Addon */}

                                                                {/* {fieldType[index] === 'Dropdown' && fieldLabels[index] === 'Addons' && (
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
                                                                                    addon.map(pref => ({ value: pref.addon_id, label: pref.addon_title })) :
                                                                                    [
                                                                                        { value: '', label: 'Select' }, // Adding the "Select" option as the first item
                                                                                        ...addon.map(pref => ({ value: pref.addon_id, label: pref.addon_title }))
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
                                                            )} */}

                                                                {
                                                                    fieldType[index] === 'Dropdown' && fieldLabels[index] === 'Addons' && (
                                                                        <Field
                                                                            name={`${fieldName[index]}`} // Use dynamic field name
                                                                            initialValue={Data?.cs_addons || ''}
                                                                            validate={requiredfield[index] === '1' ? composeValidators(option) : (value) => composeValidators()(value)}
                                                                        >
                                                                            {({ input, meta }) => {
                                                                                const selectedOption = addon.find(option => option.addon_id === parseInt(Data?.cs_addons));

                                                                                let options = addon.map(pref => ({
                                                                                    value: pref.addon_id,
                                                                                    label: pref.addon_title,
                                                                                }));

                                                                                // Conditionally add the "Select" option based on requiredfield[index]
                                                                                if (requiredfield[index] !== '1') {
                                                                                    options = [
                                                                                        { value: '', label: 'Select' },
                                                                                        ...options
                                                                                    ];
                                                                                }

                                                                                console.log("Selected addon Option:", selectedOption);
                                                                                console.log("Registration Options:", options);

                                                                                return (
                                                                                    <div>
                                                                                        <Label className='form-label' htmlFor={`displayname${index}`}>
                                                                                            <strong>{label}</strong>{requiredfield[index] === '1' && <span className="text-danger"> *</span>}
                                                                                        </Label>
                                                                                        <Select
                                                                                            {...input}
                                                                                            options={options}
                                                                                            placeholder={`Select ${label}`}
                                                                                            isSearchable={true}
                                                                                            onChange={(selectedOption) => {
                                                                                                console.log("Selected Option:", selectedOption);
                                                                                                input.onChange(selectedOption ? selectedOption.value : '');

                                                                                                // Find the selected addon amount
                                                                                                const matchedAddon = addonAmount.find(addon => addon.addon_id === selectedOption.value);
                                                                                                if (matchedAddon) {
                                                                                                    const currentAmount = parseFloat(regAmount);
                                                                                                    const addonAmountToAdd = parseFloat(matchedAddon.addon_amount);
                                                                                                    const processingPercentage = processingFee.cs_value;
                                                                                                    const processingFeeAmount = parseFloat(currentAmount * processingPercentage) / 100; // Calculate processing fee

                                                                                                    setRegAddonAmount(matchedAddon.addon_amount); // Set the amount in regAmount
                                                                                                    setRegAmount(currentAmount + addonAmountToAdd);
                                                                                                    setProcessingAmount(processingFeeAmount);
                                                                                                    settotalPaidAmount(currentAmount + addonAmountToAdd + processingFeeAmount)
                                                                                                } else {
                                                                                                    setRegAddonAmount(''); // Reset if no matching addon amount is found
                                                                                                }
                                                                                            }}
                                                                                            onBlur={input.onBlur}
                                                                                            classNamePrefix="react-select"
                                                                                            value={options.find(option => option.value === parseInt(input.value)) || null}
                                                                                        />
                                                                                        {meta.error && meta.touched && <p className='d-block text-danger'>{meta.error}</p>}
                                                                                    </div>
                                                                                );
                                                                            }}
                                                                        </Field>


                                                                    )
                                                                }

                                                                {
                                                                    fieldType[index] === 'Dropdown' && (customfield[index] == 1) && (
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
                                                                    )
                                                                }






                                                                {
                                                                    fieldType[index] === 'Long Text' && (
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
                                                                    )
                                                                }

                                                                {
                                                                    fieldType[index] === 'Number' && (
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
                                                                    )
                                                                }

                                                                {
                                                                    fieldType[index] === 'Text' && (
                                                                        <Field
                                                                            name={`${fieldName[index]}`}
                                                                            initialValue={Data?.[fieldName[index]] || ''}
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

                                                                    )
                                                                }


                                                                {
                                                                    fieldType[index] === 'Email' && (
                                                                        <Field
                                                                            name={`${fieldName[index]}`} // Use dynamic field name
                                                                            initialValue={Data?.cs_email}
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
                                                                    )
                                                                }

                                                                {
                                                                    fieldType[index] === 'Radio' && (
                                                                        <Field
                                                                            name={`${fieldName[index]}`} // Use dynamic field name
                                                                            initialValue={Data?.[fieldName[index]] || ''}
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
                                                                            // initialValue={Data?.[fieldName[index]] || ''}
                                                                            initialValue={Data?.[fieldName[index]]
                                                                                ? moment(Data[fieldName[index]]).isValid()
                                                                                    ? moment(Data[fieldName[index]]).format('YYYY-MM-DD')
                                                                                    : Data[fieldName[index]]
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
                                                            </Col>
                                                        );
                                                    })}
                                                </Row>
                                            )}
                                            {!showNextStep && (
                                                <>
                                                    {/* First Row */}
                                                    <Row>
                                                        <Col xs={12} sm={6} md={4} className="mb-3">
                                                            {/* <Field name="paymenttype_id">
                                                                {({ input, meta }) => (
                                                                    <div>
                                                                        <Label className="form-label" for="paymenttype_id">
                                                                            <strong>Payment Status</strong><span className="text-danger"> *</span>
                                                                        </Label>
                                                                        <input
                                                                            {...input}
                                                                            className="form-control"
                                                                            id="paymenttype_id"
                                                                            placeholder="Payment Status"
                                                                        />
                                                                        {meta.error && meta.touched && <p className="d-block text-danger">{meta.error}</p>}
                                                                    </div>
                                                                )}
                                                            </Field> */}
                                                            {/* <Field
                                                                name="paymenttype_id"
                                                                initialValue={Data?.paymenttype_id}
                                                            >
                                                                {({ input, meta }) => (
                                                                    <div>
                                                                        <Label className='form-label' for="paymenttype_id"><strong>Payment Status</strong></Label>
                                                                        <Select
                                                                            {...input}
                                                                            options={paymentStatusOptions}
                                                                            placeholder={`Select Payment Status`}
                                                                            isSearchable={true}
                                                                            onChange={(value) => {
                                                                                input.onChange(value);
                                                                            }}
                                                                            onBlur={input.onBlur}
                                                                            classNamePrefix="react-select"
                                                                            isMulti={false}
                                                                            value={input.value}
                                                                        />
                                                                        {meta.error && meta.touched && <p className='d-block text-danger'>{meta.error}</p>}
                                                                    </div>
                                                                )}
                                                            </Field> */}

                                                            <Field
                                                                name="paymentstatus_id"
                                                                initialValue={Data?.paymentstatus_id}
                                                            >
                                                                {({ input, meta }) => {
                                                                    const selectedOption = paymentStatusOptions.find(option => option.value === input.value);

                                                                    console.log("Selected Option", selectedOption);

                                                                    return (
                                                                        <div>
                                                                            <Label className='form-label' for="paymentstatus_id"><strong>Payment Status</strong></Label>
                                                                            <Select
                                                                                {...input}
                                                                                options={paymentStatusOptions}
                                                                                placeholder={`Select Payment Status`}
                                                                                isSearchable={true}
                                                                                onChange={(value) => {
                                                                                    input.onChange(value);
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

                                                        <Col xs={12} sm={6} md={4} className="mb-3">
                                                            {/* <Field name="payment_mode">
                                                                {({ input, meta }) => (
                                                                    <div>
                                                                        <Label className="form-label" for="payment_mode">
                                                                            <strong>Payment Mode</strong><span className="text-danger"> *</span>
                                                                        </Label>
                                                                        <input
                                                                            {...input}
                                                                            className="form-control"
                                                                            id="payment_mode"
                                                                            placeholder="Payment Mode"
                                                                        />
                                                                        {meta.error && meta.touched && <p className="d-block text-danger">{meta.error}</p>}
                                                                    </div>
                                                                )}
                                                            </Field> */}
                                                            {/* <Field
                                                                name="payment_mode"
                                                                initialValue={Data?.payment_mode}
                                                            >
                                                                {({ input, meta }) => (
                                                                    <div>
                                                                        <Label className='form-label' for="eventday"><strong>Payment Mode</strong></Label>
                                                                        <Select
                                                                            {...input}
                                                                            options={paymentTypeOptions}
                                                                            placeholder={`Select Payment Mode`}
                                                                            isSearchable={true}
                                                                            onChange={(value) => {
                                                                                input.onChange(value);
                                                                            }}
                                                                            onBlur={input.onBlur}
                                                                            classNamePrefix="react-select"
                                                                            isMulti={false}
                                                                            value={input.value}
                                                                        />
                                                                        {meta.error && meta.touched && <p className='d-block text-danger'>{meta.error}</p>}
                                                                    </div>
                                                                )}
                                                            </Field> */}

                                                            <Field
                                                                name="paymenttype_id"
                                                                initialValue={Data?.paymenttype_id}
                                                            >
                                                                {({ input, meta }) => {
                                                                    const selectedOption = paymentTypeOptions.find(option => option.value === input.value);

                                                                    console.log("Selected Type Option", selectedOption);

                                                                    return (
                                                                        <div>
                                                                            <Label className='form-label' for="paymenttype_id"><strong>Payment Type</strong></Label>
                                                                            <Select
                                                                                {...input}
                                                                                options={paymentTypeOptions}
                                                                                placeholder={`Select Payment Status`}
                                                                                isSearchable={true}
                                                                                onChange={(value) => {
                                                                                    input.onChange(value);
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

                                                        <Col xs={12} sm={6} md={4} className="mb-3">

                                                            <Field name="payment_mode"
                                                                initialValue={Data?.payment_mode}
                                                            >
                                                                {({ input, meta }) => (
                                                                    <div className="form-group">
                                                                        <label><strong>Ticket Status</strong></label>
                                                                        <Select
                                                                            {...input}
                                                                            value={{ label: input.value, value: input.value }} // Pre-select value in react-select
                                                                            onChange={(e) => input.onChange(e.value)} // Update form state
                                                                            options={[
                                                                                { value: 'Online', label: 'Online' },
                                                                                { value: 'Offline', label: 'Offline' },
                                                                            ]}
                                                                            classNamePrefix="react-select"
                                                                        // className={`form-control ${meta.touched && meta.error ? 'error-class' : ''}`}
                                                                        />
                                                                        {meta.touched && meta.error && (
                                                                            <FormFeedback>{meta.error}</FormFeedback>
                                                                        )}
                                                                    </div>
                                                                )}
                                                            </Field>
                                                        </Col>


                                                    </Row>
                                                    <Row>

                                                        <Col xs={12} sm={6} md={4} className="mb-3">
                                                            <Field name="cheque_no"
                                                                initialValue={Data?.cheque_no}

                                                            >
                                                                {({ input, meta }) => (
                                                                    <div>
                                                                        <Label className="form-label" for="cheque_no">
                                                                            <strong>DD / CHEQUE NO. / TRANSACTION ID</strong><span className="text-danger"> *</span>
                                                                        </Label>
                                                                        <input
                                                                            {...input}
                                                                            className="form-control"
                                                                            id="cheque_no"
                                                                            placeholder="Transaction ID"
                                                                        />
                                                                        {meta.error && meta.touched && <p className="d-block text-danger">{meta.error}</p>}
                                                                    </div>
                                                                )}
                                                            </Field>


                                                        </Col>

                                                        <Col xs={12} sm={6} md={4} className="mb-3">
                                                            <Field name="payment_date"
                                                                initialValue={Data?.payment_date ? moment(Data.payment_date).format('YYYY-MM-DD') : ''}
                                                            >
                                                                {({ input, meta }) => (
                                                                    <div>
                                                                        <Label className="form-label" for="payment_date">
                                                                            <strong>Payment Date</strong><span className="text-danger"> *</span>
                                                                        </Label>
                                                                        <input
                                                                            {...input}
                                                                            className="form-control"
                                                                            id="payment_date"
                                                                            type="date"
                                                                            placeholder="Enter Payment Date"
                                                                            max="9999-12-31"
                                                                        />
                                                                        {meta.error && meta.touched && <p className="d-block text-danger">{meta.error}</p>}
                                                                    </div>
                                                                )}
                                                            </Field>

                                                        </Col>

                                                        <Col xs={12} sm={6} md={4} className="mb-3">
                                                            <Field name="bank"
                                                                initialValue={Data?.bank}
                                                            >
                                                                {({ input, meta }) => (
                                                                    <div>
                                                                        <Label className="form-label" for="bank">
                                                                            <strong>Bank</strong><span className="text-danger"> *</span>
                                                                        </Label>
                                                                        <input
                                                                            {...input}
                                                                            className="form-control"
                                                                            id="bank"
                                                                            placeholder="Bank"
                                                                        />
                                                                        {meta.error && meta.touched && <p className="d-block text-danger">{meta.error}</p>}
                                                                    </div>
                                                                )}
                                                            </Field>

                                                        </Col>
                                                    </Row>
                                                    <Row>


                                                        <Col xs={12} sm={6} md={4} className="mb-3">

                                                            <Field name="branch"
                                                                initialValue={Data?.branch}
                                                            >
                                                                {({ input, meta }) => (
                                                                    <div>
                                                                        <Label className="form-label" for="branch">
                                                                            <strong>Branch</strong><span className="text-danger"> *</span>
                                                                        </Label>
                                                                        <input
                                                                            {...input}
                                                                            className="form-control"
                                                                            id="branch"
                                                                            placeholder="Branch"
                                                                        />
                                                                        {meta.error && meta.touched && <p className="d-block text-danger">{meta.error}</p>}
                                                                    </div>
                                                                )}
                                                            </Field>

                                                        </Col>



                                                        <Col xs={12} sm={6} md={4} className="mb-3">
                                                            <Field name="currency"
                                                                initialValue={Data?.currency}
                                                            >
                                                                {({ input, meta }) => (
                                                                    <div>
                                                                        <Label className="form-label" for="currency">
                                                                            <strong>Payment Currency</strong><span className="text-danger"> *</span>
                                                                        </Label>
                                                                        <input
                                                                            {...input}
                                                                            className="form-control"
                                                                            id="currency"
                                                                            placeholder="Currency"
                                                                        />
                                                                        {meta.error && meta.touched && <p className="d-block text-danger">{meta.error}</p>}
                                                                    </div>
                                                                )}
                                                            </Field>

                                                        </Col>

                                                        <Col xs={12} sm={6} md={4} className="mb-3">
                                                            <Field name="conference_fees"
                                                                initialValue={Data?.conference_fees}
                                                            >
                                                                {({ input, meta }) => (
                                                                    <div>
                                                                        <Label className="form-label" for="conference_fees">
                                                                            <strong>Registration Amount</strong><span className="text-danger"> *</span>
                                                                        </Label>
                                                                        <input
                                                                            {...input}
                                                                            className="form-control"
                                                                            id="conference_fees"
                                                                            placeholder="Registration Amount"
                                                                        />
                                                                        {meta.error && meta.touched && <p className="d-block text-danger">{meta.error}</p>}
                                                                    </div>
                                                                )}
                                                            </Field>

                                                        </Col>
                                                    </Row>

                                                    <Row>
                                                        <Col xs={12} sm={6} md={4} className="mb-3">

                                                            <Field name="processing_fee"
                                                                initialValue={Data?.processing_fee}                                                         >
                                                                {({ input, meta }) => (
                                                                    <div>
                                                                        <Label className="form-label" for="processing_fee">
                                                                            <strong>Processing Fees {processingFee.cs_value}%</strong><span className="text-danger"> *</span>
                                                                        </Label>
                                                                        <input
                                                                            {...input}
                                                                            className="form-control"
                                                                            id="processing_fee"
                                                                            placeholder="Processing Fees"
                                                                        />
                                                                        {meta.error && meta.touched && <p className="d-block text-danger">{meta.error}</p>}
                                                                    </div>
                                                                )}
                                                            </Field>

                                                        </Col>

                                                        <Col xs={12} sm={6} md={4} className="mb-3">
                                                            <Field name="total_paid_amount"
                                                                initialValue={Data?.total_paid_amount}
                                                            >
                                                                {({ input, meta }) => (
                                                                    <div>
                                                                        <Label className="form-label" for="total_paid_amount">
                                                                            <strong>Total Paid Amount</strong><span className="text-danger"> *</span>
                                                                        </Label>
                                                                        <input
                                                                            {...input}
                                                                            className="form-control"
                                                                            id="total_paid_amount"
                                                                            placeholder="Total Paid Amount"
                                                                        />
                                                                        {meta.error && meta.touched && <p className="d-block text-danger">{meta.error}</p>}
                                                                    </div>
                                                                )}
                                                            </Field>
                                                        </Col>
                                                    </Row>
                                                </>
                                            )}

                                            {/* Row for the checkbox - hide this when Next is clicked */}
                                            {!showNextStep && (
                                                <Row>
                                                    <Col md="8" className="mb-3">
                                                        {/* <Field name="cs_iscomplimentary" type="checkbox">
                                                            {({ input, meta }) => (
                                                                <div>
                                                                    <input
                                                                        {...input}
                                                                        id="cs_iscomplimentary"
                                                                        checked={input.checked} // Use input.checked to get the current checked state
                                                                        onChange={(e) => {
                                                                            const isChecked = e.target.checked ? 1 : 0; // Convert to 1 or 0
                                                                            input.onChange(isChecked); // Update form state with 1 or 0
                                                                            handleCheckboxChange(e); // Update checkbox state
                                                                        }}
                                                                    />
                                                                    <Label className='form-check-label' style={{ marginLeft: '10px' }} for="cs_iscomplimentary">
                                                                        <strong>Is this a complimentary?</strong>
                                                                    </Label>
                                                                    {meta.error && meta.touched && <p className='d-block text-danger'>{meta.error}</p>}
                                                                </div>
                                                            )}
                                                        </Field> */}


                                                        <Field
                                                            name="sendEmail"
                                                            type="checkbox"
                                                        >
                                                            {({ input, meta }) => (
                                                                <div className="mb-2">
                                                                    <input
                                                                        {...input}
                                                                        id="sListing"
                                                                        checked={sendEmail} // Controlled component
                                                                        onChange={(e) => {
                                                                            input.onChange(e); // Trigger Field's onChange
                                                                            setSendEmail(e.target.checked); // Update state
                                                                        }}
                                                                    />
                                                                    <Label className='form-check-label' style={{ marginLeft: '10px' }} for="sListing">
                                                                        <strong>Do you want to send a confirmation email to {Data?.cs_first_name} ?</strong>
                                                                    </Label>
                                                                    {meta.error && meta.touched && <p className='d-block text-danger'>{meta.error}</p>}
                                                                </div>
                                                            )}
                                                        </Field>
                                                    </Col>
                                                </Row>
                                            )}

                                            {/* Conditionally render the fields when showNextStep is true */}



                                            {/* Next button (shown when checkbox is unchecked and on the first step) */}
                                            {/* {!showNextStep && !isChecked && (
                                                <Row>
                                                    <Col xs={12}>
                                                        <Button color='primary' className="me-2 mt-3" onClick={handleNextClick}>Next</Button>
                                                    </Col>
                                                </Row>
                                            )} */}

                                            {/* Back and Submit buttons when the third row is shown */}
                                            {(!showNextStep) && (
                                                <Row className="d-flex justify-content-between align-items-center">
                                                    {/* <Col xs="auto">
                                                        {showNextStep && (
                                                            <Button color='success' className="me-2 mt-3" onClick={handleBackClick}>Back</Button>
                                                        )}
                                                    </Col> */}
                                                    <Col xs="auto">
                                                        <Button color='warning' className="me-2 mt-3">Cancel</Button>
                                                        <Button color='primary' type='submit' className="me-2 mt-3">Submit</Button>
                                                    </Col>
                                                </Row>

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
        </Fragment >
    );
};

export default AdminConfirmUser;




