import React, { Fragment, useState, useEffect, useContext } from 'react';
import { Container, Row, Col, Input, Label, Button, Card, CardBody, Modal, ModalHeader, Table, FormFeedback, ModalBody, ModalFooter, Media, PopoverBody, UncontrolledPopover } from 'reactstrap';
import { useForm } from 'react-hook-form';
import axios from 'axios';
import { BackendAPI } from '../../api';
import SweetAlert from 'sweetalert2';
// import { Input } from 'antd';
import { Breadcrumbs } from '../../AbstractElements';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { MdDelete, MdInfoOutline } from "react-icons/md";
import { FaUser, FaRegIdCard, FaMoneyBillWave, FaTicketAlt, FaPlus } from 'react-icons/fa';
import Select from 'react-select';
import { Field, Form } from 'react-final-form'; // Import Field and Form from react-final-form
import { required, email, Img, PDF, option, number, Name, NAME, radio, expiryDate } from '../Utils/validationUtils';
import { PermissionsContext } from '../../contexts/PermissionsContext';
import useAuth from '../../Auth/protectedAuth';
import { getToken } from '../../Auth/Auth';
import { Divider } from 'antd';





//Utility function used to combine multiple validation functions into a single validation function
const composeValidators = (...validators) => value =>
    validators.reduce((error, validator) => error || validator(value), undefined);

const EditCatPack = () => {
    useAuth();
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modal, setModal] = useState(false);
    const [error, setError] = useState('');
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
    const [addon, setAddon] = useState([]);
    const [ticketAmount, setTicketAmount] = useState([]);
    const [addonAmount, setAddonAmount] = useState([]);
    const [username, setusername] = useState([]);
    const { permissions } = useContext(PermissionsContext);
    const [category, setCategory] = useState(''); // Define state and setter
    const [addonticket, setAddonTicket] = useState(''); // Define state and setter
    const [regAmount, setRegAmount] = useState(0);
    const [regAddonAmount, setRegAddonAmount] = useState(0);
    const [processingAmount, setProcessingAmount] = useState(0);
    const [processingFee, setProcessingFee] = useState(0);
    const [totalPaidAmount, settotalPaidAmount] = useState(0);
    const [showNextStep, setShowNextStep] = useState(false); // Handles when "Next" is clicked
    const [isChecked, setIsChecked] = useState(false); // Track the state of the checkbox
    const [sendEmail, setSendEmail] = useState(false);
    const [priceType, setPriceType] = useState('');
    const paymentTypeOptions = paymentType.map(type => ({
        value: type.paymenttype_id,
        label: type.paymenttype_name
    }));
    const paymentStatusOptions = paymentStatus.map(status => ({
        value: status.paymentstatus_id,
        label: status.paymentstatus_name
    }));
    const categoryOptions = regCat.map(status => ({
        value: status.cs_reg_cat_id,
        label: status.cs_reg_category
    }));

    // Step 1: Create a map of ticket amounts by ticket_id for quick lookup
    const ticketAmountMap = Object.fromEntries(
        ticketAmount.map(item => [item.ticket_id, item.tick_amount])
    );

    // Step 2: Create the ticketOptions array with the correct property names
    const ticketOptions = ticket.map(status => ({
        value: status.ticket_id,  // Correctly accessing ticket_id
        label: `${status.ticket_title} - Price: ${ticketAmountMap[status.ticket_id] || 'N/A'}` // Correctly using ticket_id for lookup
    }));

    console.log("Ticket Options with Price:", ticketOptions);

    const addonAmountMap = Object.fromEntries(
        addonAmount.map(item => [item.addon_id, item.addon_amount])
    );

    const addonOptions = addon.map(status => ({
        value: status.addon_id,
        label: `${status.addon_title} - Price: ${addonAmountMap[status.addon_id] || 'N/A'}` // Correctly using ticket_id for lookup
    }));

    console.log("Addon Options with Price:", addonOptions);

    console.log("User Data", Data);
    console.log("Ticket", ticketOptions);
    console.log("Ticket Amount", ticketAmount);
    console.log("Addon", addon);
    console.log("PriceType:", priceType);












    // useEffect(() => {
    //     fetchFields(); // Corrected function name
    // }, [permissions]);

    useEffect(() => {
        fetchDropdown(); // Corrected function name
    }, [permissions]);




    // Extract Add User setting Permissions component
    const AddUserPermissions = permissions['EditCatPack'];

    // const fetchFields = async () => {
    //     try {
    //         const token = getToken();
    //         const response = await axios.get(`${BackendAPI}/reguser/getField`, {
    //             headers: {
    //                 Authorization: `Bearer ${token}` // Include the token in the Authorization header
    //             }
    //         });
    //         const fieldsData = response.data.Fields;
    //         const requiredfield = fieldsData.map(field => field.cs_is_required);
    //         const fieldLabels = fieldsData.map(field => field.cs_field_label);
    //         const fieldType = fieldsData.map(field => field.field_type_name);
    //         const fieldId = fieldsData.map(field => field.cs_field_id);
    //         const fieldName = fieldsData.map(field => field.cs_field_name);
    //         const customfield = fieldsData.map(field => field.cs_iscustom);


    //         console.log("Data:", fieldsData);
    //         console.log("Custom:", customfield);



    //         // setData(fieldsData);
    //         setFieldLabels(fieldLabels);
    //         setFieldType(fieldType);
    //         setFieldName(fieldName);
    //         setCustomfield(customfield);
    //         setRequiredField(requiredfield); // Set requiredfield state
    //         setFieldId(fieldId);
    //         setLoading(false);

    //         // console.log('Id:', fieldName);
    //     } catch (error) {
    //         console.error('Error fetching Fields:', error);
    //         setLoading(false);
    //     }
    // };

    useEffect(() => {
        const filterTickets = () => {
            if (category) {
                const parsedCategory = JSON.parse(category); // Parse the category

                console.log("Parsed Cat", parsedCategory);

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
                console.log("Filtered", filtered);
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
                    const amount = parseFloat(matchedTicket.tick_amount); // Convert tick_amount to a number
                    setRegAmount(amount); // Store the ticket amount in regAmount

                    // Calculate the processing fee based on the percentage
                    const currentAmount = amount; // No parseFloat needed if regAmount is already a number
                    const processingPercentage = processingFee.cs_value; // Should be a number
                    const processingFeeAmount = (amount * processingPercentage) / 100; // Correct calculation without parseFloat

                    setProcessingAmount(processingFeeAmount); // Set the calculated processing fee
                    settotalPaidAmount(currentAmount + processingFeeAmount);

                    console.log("Matched Ticket Amount:", amount);
                    console.log("Processing Fee Amount:", processingFeeAmount);
                } else {
                    setRegAmount(0); // Reset if no matching ticket is found
                    setProcessingAmount(0); // Reset processing amount as well
                    settotalPaidAmount(0);
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
                setRegAmount(0); // Reset regAmount if no addonticket
                setProcessingAmount(0);
                settotalPaidAmount(0);

            }
        };

        // Call the filter functions
        filterTickets(); // Call the filter function
        filterAddon(); // Call the filter function
    }, [category, addonticket]); // Run effect when category or tickets change

    console.log("Addon Ticket", addonticket);
    console.log("Ticket Amount", ticketAmount);

    const handleCancel = () => {
        setModal(true);
    };

    const onSubmit = async (formData) => {
        const username = formData.cs_first_name;
    
        // Validate price type selection
        if (!priceType) {
            setError('Please select any one of the above options.');
            return;
        }
    
        try {
            // Separate fields into `values` and `paymentDetails`
            const values = {};
            const paymentDetails = {};
    
            // Define payment-related fields
            const paymentFields = [
                'total_paid_amount',
                'processing_fee',
                'conference_fees',
                'branch',
                'bank',
                'payment_date',
                'tracking_id',
                'payment_mode',
                'paymenttype_id',
                'paymentstatus_id',
                'currency',
                'user_id'
            ];
    
            for (const key in formData) {
                if (Object.hasOwnProperty.call(formData, key)) {
                    const fieldValue = formData[key]?.value !== undefined ? formData[key].value : formData[key];
    
                    // Skip adding `sendEmail` to `values`
                    if (key === 'sendEmail') continue;
    
                    // Check if the field is related to payment details
                    if (paymentFields.includes(key)) {
                        paymentDetails[key] = fieldValue || ''; // Assign empty string if the value is missing
                    } else {
                        values[key] = fieldValue || ''; // Assign empty string if the value is missing
                    }
                }
            }
    
            console.log('Payment details to send:', paymentDetails);
            console.log('Values to send:', values);
    
            // Set any additional payment details if required
            if (Object.keys(paymentDetails).length > 0) {
                paymentDetails.payment_mode = paymentDetails.payment_mode || 'Offline'; // Set a default payment mode
                paymentDetails.user_id = Data.id;
    
                // If payment details are available, set cs_iscomplimentary to 0
                values.cs_iscomplimentary = 0;
            } else {
                // If no payment details, set cs_iscomplimentary to 1
                values.cs_iscomplimentary = 1;
            }
    
            const token = getToken();
    
            // Make the API call
            const response = await axios.post(`${BackendAPI}/paymentRoutes/editCatPack`, {
                data: values, // Send the filtered data
                paymentDetails, // Send the payment details separately
                Id: Data.id,
                sendEmail: formData.sendEmail // Pass `sendEmail` directly if needed
            }, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
    
            if (response.data.success) {
                SweetAlert.fire({
                    title: 'Success!',
                    html: `Category and package changed for <b>${Data.cs_first_name}</b> successfully!`,
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
        } catch (error) {
            console.error('Error creating user:', error.message);
        }
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
            setLoading(false);

            const fetchPaymentType = response.data.paymentType;
            const fetchPaymentStatus = response.data.paymentStatus;
            const fetchregcat = response.data.regCategory;
            const fetchTicket = response.data.ticket;
            const fetchAddon = response.data.addon;
            const fetchTicketAmount = response.data.ticketAmount;
            const fetchAddonAmount = response.data.addonAmount;

            setPaymentType(fetchPaymentType);
            setPaymentStatus(fetchPaymentStatus);
            setRegCat(fetchregcat);
            setTicket(fetchTicket);
            setAddon(fetchAddon);
            setTicketAmount(fetchTicketAmount); // Set the filtered ticket amounts
            setAddonAmount(fetchAddonAmount);


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

    const handlePriceChange = (e) => {
        setPriceType(e.target.value);
        setError('');
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
                                <h5 className="mb-4 text-start">User Details</h5>
                                <ul className="list-unstyled">
                                    <li className="mb-2">
                                        <FaUser className="me-2" />
                                        <strong>Name:</strong> {Data.cs_first_name} {Data.cs_last_name}
                                    </li>
                                    <li className="mb-2">
                                        <FaRegIdCard className="me-2" />
                                        <strong>Registration Number:</strong> {Data.cs_regno}
                                    </li>
                                </ul>

                                <Form onSubmit={onSubmit}>
                                    {({ handleSubmit }) => (
                                        <form className="needs-validation" noValidate="" onSubmit={handleSubmit}>
                                            <Row>
                                                <Col xs={12} sm={6} md={4} className="mb-3 mt-3">
                                                    <Field name="cs_reg_cat_id" initialValue={Data?.cs_reg_cat_id}>
                                                        {({ input, meta }) => {
                                                            const selectedOption = categoryOptions.find(option => option.value === input.value);
                                                            return (
                                                                <div>
                                                                    <Label className="form-label" for="paymenttype_id"><strong>Registration Category</strong></Label>
                                                                    <Select
                                                                        {...input}
                                                                        options={categoryOptions}
                                                                        placeholder="Select Category"
                                                                        isSearchable={true}
                                                                        onChange={(value) => input.onChange(value)}
                                                                        onBlur={input.onBlur}
                                                                        classNamePrefix="react-select"
                                                                        isMulti={false}
                                                                        value={selectedOption}
                                                                    />
                                                                    {meta.error && meta.touched && <p className="d-block text-danger">{meta.error}</p>}
                                                                </div>
                                                            );
                                                        }}
                                                    </Field>
                                                </Col>
                                                <Col xs={12} sm={6} md={4} className="mb-3 mt-3">
                                                    <Field name="cs_ticket" initialValue={parseInt(Data?.cs_ticket)}>
                                                        {({ input, meta }) => {
                                                            const selectedOption = ticketOptions.find(option => option.value === input.value);
                                                            return (
                                                                <div>
                                                                    <Label className="form-label" for="paymenttype_id"><strong>Ticket</strong></Label>
                                                                    <Select
                                                                        {...input}
                                                                        options={ticketOptions}
                                                                        placeholder="Select Ticket"
                                                                        isSearchable={true}
                                                                        onChange={(value) => input.onChange(value)}
                                                                        onBlur={input.onBlur}
                                                                        classNamePrefix="react-select"
                                                                        isMulti={false}
                                                                        value={selectedOption}
                                                                    />
                                                                    {meta.error && meta.touched && <p className="d-block text-danger">{meta.error}</p>}
                                                                </div>
                                                            );
                                                        }}
                                                    </Field>
                                                </Col>
                                                <Col xs={12} sm={6} md={4} className="mb-3 mt-3">
                                                    <Field name="cs_addons" initialValue={parseInt(Data?.cs_addons)}>
                                                        {({ input, meta }) => {
                                                            const selectedOption = addonOptions.find(option => option.value === input.value);
                                                            return (
                                                                <div>
                                                                    <Label className="form-label" for="paymenttype_id"><strong>Add-on</strong></Label>
                                                                    <Select
                                                                        {...input}
                                                                        options={addonOptions}
                                                                        placeholder="Select Addon"
                                                                        isSearchable={true}
                                                                        onChange={(value) => input.onChange(value)}
                                                                        onBlur={input.onBlur}
                                                                        classNamePrefix="react-select"
                                                                        isMulti={false}
                                                                        value={selectedOption}
                                                                    />
                                                                    {meta.error && meta.touched && <p className="d-block text-danger">{meta.error}</p>}
                                                                </div>
                                                            );
                                                        }}
                                                    </Field>
                                                </Col>
                                            </Row>

                                            {/* Price Type Radio Buttons */}
                                            <Col md="12" className="mb-3">
                                                <div className="form-group">
                                                    {/* <strong>Price</strong> */}
                                                    <div className="me-5 mt-3">
                                                        <input
                                                            type="radio"
                                                            name="priceType"
                                                            value="AddPayment"
                                                            onChange={handlePriceChange}
                                                            className="me-2"
                                                        />
                                                        <strong>Add Payment</strong>
                                                        <input
                                                            type="radio"
                                                            name="priceType"
                                                            value="Complimentary"
                                                            checked={priceType === 'Complimentary'}
                                                            onChange={handlePriceChange}
                                                            className="ms-3 me-2"
                                                        />
                                                        <strong>Complimentary</strong>
                                                    </div>
                                                    {/* Show error if price type is not selected */}
                                                    {error && <p style={{ color: 'red', marginTop: '5px' }}>{error}</p>}
                                                </div>
                                            </Col>



                                            {/* Add New Payment Section - Conditional Rendering */}
                                            {priceType === 'AddPayment' && (
                                                <>
                                                    <Divider />
                                                    <CardBody p-1>
                                                        <h5 className="mb-4 text-start">Add New Payment</h5>
                                                        <Row>
                                                            <Col xs={12} sm={6} md={4} className="mb-3">

                                                                <Field
                                                                    name="paymenttype_id"
                                                                    validate={option}
                                                                >
                                                                    {({ input, meta }) => {
                                                                        const selectedOption = paymentTypeOptions.find(option => option.value === input.value);

                                                                        console.log("Selected Type Option", selectedOption);

                                                                        return (
                                                                            <div>
                                                                                <Label className='form-label' for="paymenttype_id"><strong>Payment Type</strong><span className='text-danger'> *</span></Label>
                                                                                <Select
                                                                                    {...input}
                                                                                    options={paymentTypeOptions}
                                                                                    placeholder={`Select Payment Type`}
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

                                                                <Field
                                                                    name="paymentstatus_id"
                                                                    validate={option}

                                                                >
                                                                    {({ input, meta }) => {
                                                                        const selectedOption = paymentStatusOptions.find(option => option.value === input.value);

                                                                        console.log("Selected Option", selectedOption);

                                                                        return (
                                                                            <div>
                                                                                <Label className='form-label' for="paymentstatus_id"><strong>Payment Status</strong><span className='text-danger'> *</span></Label>
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
                                                                <Field name="tracking_id">
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


                                                        </Row>
                                                        <Row>

                                                            <Col xs={12} sm={6} md={4} className="mb-3">
                                                                <Field name="payment_date"
                                                                    validate={expiryDate}
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
                                                                <Field name="bank">
                                                                    {({ input, meta }) => (
                                                                        <div>
                                                                            <Label className="form-label" for="bank">
                                                                                <strong>Bank</strong>
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

                                                            <Col xs={12} sm={6} md={4} className="mb-3">
                                                                <Field name="branch">
                                                                    {({ input, meta }) => (
                                                                        <div>
                                                                            <Label className="form-label" for="branch">
                                                                                <strong>Branch</strong>
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
                                                        </Row>
                                                        <Row>


                                                            <Col xs={12} sm={6} md={4} className="mb-3">
                                                                <Field name="currency">
                                                                    {({ input, meta }) => (
                                                                        <div>
                                                                            <Label className="form-label" for="currency">
                                                                                <strong>Payment Currency</strong>
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
                                                                <Field name="conference_fees">
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

                                                            <Col xs={12} sm={6} md={4} className="mb-3">
                                                                <Field name="processing_fee">
                                                                    {({ input, meta }) => (
                                                                        <div>
                                                                            <Label className="form-label" for="processing_fee">
                                                                                <strong>Processing Fees</strong>
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
                                                        </Row>

                                                        <Row>
                                                            <Col xs={12} sm={6} md={4} className="mb-3">
                                                                <Field name="total_paid_amount"
                                                                    validate={required}
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

                                                    </CardBody>
                                                </>
                                            )}

                                            <Row>
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
                                                                <strong>Do you want to send a changed package email to {Data.cs_first_name} ?</strong>
                                                            </Label>
                                                            {meta.error && meta.touched && <p className='d-block text-danger'>{meta.error}</p>}
                                                        </div>
                                                    )}
                                                </Field>
                                            </Row>



                                            {/* Buttons */}
                                            <Row className="d-flex justify-content-between align-items-center">

                                                <Col xs="auto">
                                                    <Button color="warning" className="me-2 mt-3">Cancel</Button>
                                                    <Button color="primary" type="submit" className="me-2 mt-3">Submit</Button>
                                                </Col>
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

export default EditCatPack;




