import React, { Fragment, useEffect, useState } from 'react';
import { Container, Row, Col, Button, Card, CardBody, CardHeader, FormFeedback, Input, FormGroup, Label, Modal, ModalBody, ModalFooter, Table, Media } from 'reactstrap';
import { Form, Field } from 'react-final-form';
import useAuth from '../../Auth/protectedAuth';
import Select from 'react-select';
import { getToken } from '../../Auth/Auth';
import axios from 'axios';
import { BackendAPI } from '../../api';
import { Breadcrumbs } from '../../AbstractElements';
import { useLocation } from 'react-router-dom';
import { required, Name } from '../Utils/validationUtils';
import DatePicker from 'react-datepicker';
import { FaPlus } from 'react-icons/fa';
import SweetAlert from 'sweetalert2';
import { Link, useNavigate } from 'react-router-dom';

const composeValidators = (...validators) => value =>
    validators.reduce((error, validator) => error || validator(value), undefined);

const EditTicket = () => {
    useAuth();
    const location = useLocation();
    const { addon } = location.state;

    const [loading, setLoading] = useState(true);
    const [ticktes, setticktes] = useState([]);
    const [addonCategory, setAddonCategory] = useState(addon.addon_cat_type);
    const [accompanySeatType, setAccompanySeatType] = useState(addon.addon_accper_type); // State for accompany seat type
    const [selectedType, setSelectedType] = useState(addon.addon_workshop_id); // Se
    const [Workshops, setWorkshops] = useState([]);
    const [regCat, setRegCat] = useState([]);
    const [Cattype, setCattype] = useState([]);
    const [seatType, setSeatType] = useState(addon.addon_type);
    const [seatCount, setSeatCount] = useState(addon.addon_count);
    const [priceType, setPriceType] = useState(addon.addon_ispaid === 1 ? 'Paid' : 'Free');
    const [newDuration, setNewDuration] = useState({ name: '', startDate: new Date(), endDate: new Date(), amount: '', currency: 'USD' });
    const [errors, setErrors] = useState({});
    const [editIndex, setEditIndex] = useState(null);
    const [durations, setDurations] = useState([]);
    const [modalOpen, setModalOpen] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const navigate = useNavigate(); // Initialize useHistory


    console.log("Users", addon);

    const handleAccompanySeatTypeChange = (type) => {
        setAccompanySeatType(type); // Update accompany seat type ("unlimited" or "limited")
    };


    // Convert the addon_ticket_ids string into an array of numbers
    const selectedTicketIds = addon.addon_ticket_ids
        ? addon.addon_ticket_ids
            .replace(/[{}]/g, '') // Remove curly braces
            .split(',') // Split by comma
            .map(Number) // Convert strings to numbers
        : [];

    // Create an array of selected options based on ticket IDs
    const selectedOptions = selectedTicketIds.map(ticketId => {
        const ticket = ticktes.find(pref => pref.ticket_id === ticketId);
        return ticket ? { value: ticket.ticket_id, label: ticket.ticket_title } : null;
    }).filter(Boolean); // Filter out any null values

    const fetchDropdown = async () => {
        try {
            const token = getToken();
            const response = await axios.get(`${BackendAPI}/addonRoutes/getDropdownData`, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
            // setData(response.data);
            setLoading(false);

            const { regCategory: fetchregcat, regtype: fetchcatgorie, tickets: fetchticket, workshop: fetchworkshop } = response.data;

            setRegCat(fetchregcat);
            setCattype(fetchcatgorie);
            setticktes(fetchticket);
            setWorkshops(fetchworkshop)

            console.log("mahesh", Workshops);

        } catch (error) {
            console.error('Error fetching dropdown data:', error);
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDropdown();
    }, []);

    const handleEditDuration = (index) => {
        // setIsEditing(true);
        setEditIndex(index);
        setNewDuration(durations[index]); // Populate the form with the current values
        setModalOpen(true);
    };


    const handleAddDuration = () => {
        let validationErrors = {};
        if (!newDuration.name) {
            validationErrors.name = "Duration Name is required";
        }
        if (!newDuration.amount) {
            validationErrors.amount = "Amount is required";
        }
        if (!newDuration.endDate) {
            validationErrors.endDate = "End Date is required";
        }
        if (!newDuration.startDate) {
            validationErrors.startDate = "Start Date is required";
        }

        if (Object.keys(validationErrors).length > 0) {
            setErrors(validationErrors);
            return;
        }
        setDurations([...durations, newDuration]);
        setNewDuration({ name: '', startDate: new Date(), endDate: new Date(), amount: '', currency: 'USD' });
        setErrors({});
    };

    const handleDurationChange = (e) => {
        const { name, value } = e.target;
        setNewDuration(prev => ({ ...prev, [name]: value }));
    };

    const handleDateChange = (date) => {
        setNewDuration(prev => ({ ...prev, endDate: date }));
    };

    const handlestartDateChange = (date) => {
        setNewDuration(prev => ({ ...prev, startDate: date }));
    };

    const handleDeleteDuration = (index) => {
        setDurations(durations.filter((_, i) => i !== index));
    };

    const handleSaveDuration = () => {
        setDurations((prevDurations) =>
            prevDurations.map((duration, index) =>
                index === editIndex ? newDuration : duration
            )
        );
        setIsEditing(false);
        setEditIndex(null);
        setNewDuration({ name: '', startDate: new Date(), endDate: new Date(), amount: '', currency: 'USD' }); // Reset form
        setModalOpen(false);
    };


    const handleCancelEdit = () => {
        // setIsEditing(false);
        setEditIndex(null);
        setNewDuration({ name: '', startDate: new Date(), endDate: new Date(), amount: '', currency: 'USD' }); // Reset form
        setModalOpen(false);
    };



    const fetchDuration = async (addonId) => {
        try {
            const token = getToken();
            const response = await axios.get(`${BackendAPI}/addonRoutes/getDuration`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
                params: {
                    addonId: addonId, // Sending addonId as a query parameter
                },
            });
    
            console.log("Response Data:", response.data);  // You can check this to ensure data is coming correctly
    
            // Assuming response.data is an array of objects like the one you showed.
            const newDurations = response.data.map((duration) => ({
                addon_duration_id: duration.addon_duration_id,
                name: duration.addon_duration_name,
                startDate: new Date(duration.addon_duration_start_date),  // Convert to Date object for easier formatting
                endDate: new Date(duration.addon_duration_till_date),  // Convert to Date object for easier formatting
                amount: duration.addon_amount,
                currency: duration.addon_currency,
            }));
    
            // Update state to append new durations to the existing ones
            setDurations((prevDurations) => [...prevDurations, ...newDurations]);
    
            console.log("Updated durations:", [...durations, ...newDurations]);
    
        } catch (error) {
            console.error('Error fetching addon duration data:', error);
            setLoading(false);  // Update loading state to handle errors
        }
    };

    useEffect(() => {
        fetchDuration(addon.addon_id);
    }, []);

    const handleAddonCategoryChange = (event) => {
        setAddonCategory(event.target.value);
    };

    const handleTypeSelect = (e) => {
        setSelectedType(e.target.value);
    }

    const handleSeatTypeChange = (e) => {
        const value = e.target.value;
        setSeatType(value);

        // Clear seat count if the type is changed to Unlimited
        if (value === 'Unlimited') {
            setSeatCount('');
        }
    };

    const handleSeatCountChange = (e) => {
        setSeatCount(e.target.value);
    };


    const handlePriceChange = (e) => {
        setPriceType(e.target.value);
    };


    const onSubmit = async (values) => {
        const selectedTickets = values.tickets ? values.tickets.map(option => option.value) : null;
    
        // Prepare the data to be sent
        const formData = {
            addonId:addon.addon_id,
            tickets: selectedTickets,
            addonTitle: values.addonTitle,                 // Addon Title field
            addonDescription: values.addonDescription,     // Addon Description field
            addonCategory: addonCategory,                  // Addon Category from the local state (can be "0", "1", or "2")
            workshopDetails: values.workshopDetails,       // Workshop details if selected
            accompanySeatType: values.accompanySeatType,   // Seat type for accompany (unlimited/limited)
            accpseatNumber: addonCategory === "2" && values.accompanySeatType === 'Limited' ? values.accpseatNumber : null, // Seat number if "Limited" selected in accompany
            seatType: seatType,  
            priceType: priceType,                          // This will be either "Unlimited" or "Limited" for the general seat type
            seatCount: seatType === 'Limited' ? seatCount : null, // Include seat count if Limited is selected
            ticketStatus: values.ticketStatus,             // Ticket status: Open, Close, or Sold Out
            durations: durations,                          // Array of duration objects with name, endDate, amount, and currency
            isVisible: values.isvisible ? 1 : 0,           // Checkbox for visibility (1 if checked, 0 if not)
        };
    
        console.log("formData", formData); // Log the prepared data
    
        try {
            const token = getToken(); // Retrieve the token from your auth utility
    
            // Make the POST request to your 'addaddon' route
            const response = await axios.post(`${BackendAPI}/addonRoutes/editaddon`, formData, {
                headers: {
                    Authorization: `Bearer ${token}`, // Include the token in the Authorization header
                    'Content-Type': 'application/json', // Set the content type for JSON data
                },
            });
    
            // Handle the success response (e.g., show a success message or redirect)
            if (response.data.success) {
                SweetAlert.fire({
                    title: 'Success!',
                    html: `Addon created successfully!`,
                    icon: 'success',
                    timer: 3000,
                    showConfirmButton: false,
                    allowOutsideClick: false,
                    allowEscapeKey: false
                }).then((result) => {
                    if (result.dismiss === SweetAlert.DismissReason.timer) {
                        navigate(`${process.env.PUBLIC_URL}/registration/manage-addon/Consoft`);
                    }
                });
            }
            console.log('Form submitted successfully:', response.data);
        } catch (error) {
            // Handle any errors that occur during the API call
            console.error('Error submitting form:', error);
            // Show an error notification or handle the error in a user-friendly way here
        }
    };

    return (
        <Fragment>
            <Breadcrumbs mainTitle="Edit Ticket" parent="Manage Addon" title="Edit Addon" />
            <Container fluid={true}>
                <Row>
                    <Col sm="12">
                        <Card>
                            <CardBody>
                                <Form
                                    onSubmit={onSubmit}
                                    initialValues={{
                                        tickets: selectedOptions,
                                        addonTitle: addon.addon_title,
                                        addonDescription: addon.addon_description,
                                        addonCategory: addon.addon_cat_type,
                                        accompanySeatType: addon.addon_accper_type,
                                        accpseatNumber: addon.addon_accper_limit,
                                        ticketStatus: addon.addon_status,
                                        isvisible: addon.addon_visiblility,
                                    }} // Set initial values
                                    render={({ handleSubmit }) => (
                                        <form onSubmit={handleSubmit}>
                                            <Row>
                                                <Col md="4" className="mb-3">
                                                    <Field name={`tickets`}>
                                                        {({ input }) => (
                                                            <div>
                                                                <Label className='form-label' htmlFor="tickets"><strong>Tickets</strong></Label>
                                                                <Select
                                                                    {...input}
                                                                    options={[
                                                                        { value: 'all', label: 'Select All' },
                                                                        ...ticktes.map(pref => ({ value: pref.ticket_id, label: pref.ticket_title })),
                                                                    ]}
                                                                    placeholder={`Select Tickets`}
                                                                    isSearchable={true}
                                                                    onChange={(value) => {
                                                                        if (value && value.length > 0 && value[0].value === 'all') {
                                                                            const allCatNames = ticktes.map(pref => pref.ticket_id);
                                                                            input.onChange(allCatNames.map(id => ({ value: id, label: ticktes.find(ticket => ticket.ticket_id === id).ticket_title })));
                                                                        } else {
                                                                            input.onChange(value);
                                                                        }
                                                                    }}
                                                                    onBlur={input.onBlur}
                                                                    classNamePrefix="react-select"
                                                                    isMulti={true}
                                                                    value={input.value || []} // Ensure the value is controlled
                                                                />
                                                            </div>
                                                        )}
                                                    </Field>
                                                </Col>
                                                <Col md="4" className="mb-3">
                                                    <Field name={`addonTitle`} validate={composeValidators(required, Name)}>
                                                        {({ input, meta }) => (
                                                            <div className="form-group">
                                                                <label>Addon Title <span className="red-asterisk">*</span></label>
                                                                <input
                                                                    {...input}
                                                                    type="text"
                                                                    placeholder="Enter Addon Title"
                                                                    className={`form-control ${meta.touched && meta.error ? 'error-class' : ''}`}
                                                                />
                                                                {meta.error && meta.touched && <p className='d-block text-danger'>{meta.error}</p>}
                                                            </div>
                                                        )}
                                                    </Field>
                                                </Col>
                                                <Col md="4">
                                                    <Field
                                                        name="addonDescription"
                                                        validate={required}
                                                    >
                                                        {({ input, meta }) => (
                                                            <div className="form-group">
                                                                <label>Description <span className="red-asterisk">*</span></label>
                                                                <textarea
                                                                    {...input}
                                                                    placeholder="Enter Addon Description"
                                                                    className={`form-control ${meta.touched && meta.error ? 'error-class' : ''}`}
                                                                />
                                                                {meta.error && meta.touched && <p className='d-block text-danger'>{meta.error}</p>}
                                                            </div>
                                                        )}
                                                    </Field>
                                                </Col>
                                                <Col md="4">
                                                    <Field
                                                        name="addonCategory"
                                                        validate={required}
                                                        defaultValue="addon.addon_cat_type"
                                                    >
                                                        {({ input, meta }) => (
                                                            <div className="form-group">
                                                                <label>Addon Category</label>
                                                                <Input
                                                                    {...input}
                                                                    type="select"
                                                                    onChange={(e) => {
                                                                        input.onChange(e); // Update form state
                                                                        handleAddonCategoryChange(e); // Update local state
                                                                    }}
                                                                    className={`form-control ${meta.touched && meta.error ? 'error-class' : ''}`}
                                                                >
                                                                    <option value="0">Other</option>
                                                                    <option value="1">Workshop</option>
                                                                    <option value="2">Accompany Person</option>

                                                                </Input>
                                                                {meta.touched && meta.error && (
                                                                    <FormFeedback>{meta.error}</FormFeedback>
                                                                )}
                                                            </div>
                                                        )}
                                                    </Field>

                                                    {/* Conditionally render new dropdown if "Workshop" is selected */}
                                                    {addonCategory === "1" && (
                                                        <Field name="workshopDetails">
                                                            {({ input, meta }) => (
                                                                <div className="form-group">
                                                                    <label>Choose Workshop</label>
                                                                    <Input
                                                                        {...input}
                                                                        type="select"
                                                                        className="form-control"
                                                                        onChange={(e) => {
                                                                            input.onChange(e); // Update form state
                                                                            handleTypeSelect(e); // Update selected workshop state
                                                                        }}
                                                                        value={selectedType}
                                                                    >
                                                                        <option value="">Select Workshop</option>
                                                                        {Array.isArray(Workshops) && Workshops.length > 0 ? (
                                                                            Workshops.map((type) => (
                                                                                <option key={type.cs_workshop_id} value={type.cs_workshop_id}>
                                                                                    {type.cs_workshop_name}
                                                                                </option>
                                                                            ))
                                                                        ) : (
                                                                            <option disabled>No Workshops Available</option>
                                                                        )}
                                                                    </Input>
                                                                    {meta.touched && meta.error && (
                                                                        <FormFeedback>{meta.error}</FormFeedback>
                                                                    )}
                                                                </div>
                                                            )}
                                                        </Field>
                                                    )}
                                                    {addonCategory === "2" && (
                                                        <div className="form-group">
                                                            <label>Seats Availability</label>
                                                            <div>
                                                                {/* Unlimited radio button */}
                                                                <Field name="accompanySeatType" type="radio" value="Unlimited">
                                                                    {({ input }) => (
                                                                        <label>
                                                                            <Input
                                                                                {...input}
                                                                                type="radio"
                                                                                value="Unlimited"
                                                                                onChange={(e) => {
                                                                                    input.onChange(e);
                                                                                    handleAccompanySeatTypeChange("Unlimited"); // Custom handler for updating local state
                                                                                }}
                                                                            />
                                                                            Unlimited
                                                                        </label>
                                                                    )}
                                                                </Field>

                                                                {/* Limited radio button */}
                                                                <Field name="accompanySeatType" type="radio" value="Limited" className="ms-5">
                                                                    {({ input }) => (
                                                                        <label>
                                                                            <Input
                                                                                {...input}
                                                                                type="radio"
                                                                                value="Limited"
                                                                                onChange={(e) => {
                                                                                    input.onChange(e);
                                                                                    handleAccompanySeatTypeChange("Limited"); // Custom handler for updating local state
                                                                                }}
                                                                            />
                                                                            Limited
                                                                        </label>
                                                                    )}
                                                                </Field>
                                                            </div>
                                                        </div>
                                                    )}

                                                    {/* Conditionally render the number input field if "Limited" is selected */}
                                                    {addonCategory === "2" && accompanySeatType === "Limited" && (
                                                        <Field name="accpseatNumber" validate={required}>
                                                            {({ input, meta }) => (
                                                                <div className="form-group">
                                                                    <label>Enter Number of Seats</label>
                                                                    <Input
                                                                        {...input}
                                                                        type="number"
                                                                        min="1"
                                                                        className={`form-control ${meta.touched && meta.error ? 'error-class' : ''}`}
                                                                    />
                                                                    {meta.touched && meta.error && (
                                                                        <FormFeedback>{meta.error}</FormFeedback>
                                                                    )}
                                                                </div>
                                                            )}
                                                        </Field>
                                                    )}

                                                </Col>
                                                <Col md="4">
                                                    <div className="form-group">
                                                        <label>Number of Seats</label>
                                                        <Input
                                                            type="select"
                                                            value={seatType}
                                                            onChange={(e) => handleSeatTypeChange(e)}
                                                            className="form-control"
                                                        >
                                                            <option value="Unlimited">Unlimited</option>
                                                            <option value="Limited">Limited</option>
                                                        </Input>
                                                    </div>
                                                    {seatType === 'Limited' && (
                                                        <Field
                                                            name="seatCount"
                                                        >
                                                            {({ input, meta }) => (
                                                                <div className="form-group mt-2">
                                                                    <label>Seat Count</label>
                                                                    <input
                                                                        {...input}
                                                                        type="number"
                                                                        placeholder="Enter Seat Count"
                                                                        value={seatCount}
                                                                        onChange={handleSeatCountChange}
                                                                        className={`form-control ${meta.touched && meta.error ? 'error-class' : ''}`}
                                                                    />
                                                                    {meta.touched && meta.error && (
                                                                        <FormFeedback>{meta.error}</FormFeedback>
                                                                    )}
                                                                </div>
                                                            )}
                                                        </Field>
                                                    )}
                                                </Col>

                                                <Col md="4">
                                                    <Field
                                                        name="ticketStatus"
                                                        validate={required}
                                                        defaultValue="Open"
                                                    >
                                                        {({ input, meta }) => (
                                                            <div className="form-group">
                                                                <label>Ticket Status</label>
                                                                <Input
                                                                    {...input}
                                                                    type="select"
                                                                    className={`form-control ${meta.touched && meta.error ? 'error-class' : ''}`}
                                                                >
                                                                    <option value="Open">Open</option>
                                                                    <option value="Close">Close</option>
                                                                    <option value="SoldOut">Marked as Sold Out</option>
                                                                </Input>
                                                                {meta.touched && meta.error && (
                                                                    <FormFeedback>{meta.error}</FormFeedback>
                                                                )}
                                                            </div>
                                                        )}
                                                    </Field>
                                                </Col>


                                                <Col md="4" className="mb-3 mt-4">
                                                    <Field
                                                        name="isvisible"
                                                        type="checkbox"
                                                    // validate={composeValidators(required, Wname)}
                                                    >
                                                        {({ input, meta }) => (
                                                            <div >
                                                                <input
                                                                    {...input}
                                                                    id="isvisible" // Correct ID for the input
                                                                />
                                                                <Label className='form-check-label' style={{ marginLeft: '10px' }} for="isvisible"><strong>Is Visible</strong></Label>
                                                                {meta.error && meta.touched && <p className='d-block text-danger'>{meta.error}</p>}
                                                            </div>
                                                        )}
                                                    </Field>
                                                </Col>

                                                <Col md="4" className='mt-3'>
                                                    <div className="form-group">
                                                        <strong>Price</strong>
                                                        <div className='me-5'>
                                                            <Input
                                                                type="radio"
                                                                name="priceType"
                                                                value="Free"
                                                                checked={priceType === 'Free'}
                                                                onChange={handlePriceChange}

                                                            /> <strong >Free</strong>
                                                            <Input
                                                                type="radio"
                                                                name="priceType"
                                                                value="Paid"
                                                                checked={priceType === 'Paid'}
                                                                onChange={handlePriceChange}
                                                                className='ms-5'
                                                            /> <strong>Paid</strong>
                                                        </div>
                                                    </div>
                                                </Col>

                                                {priceType === 'Paid' && (

                                                    <Card className='mt-5'>
                                                        <CardHeader>
                                                            Duration Management
                                                        </CardHeader>
                                                        <CardBody>
                                                            <Row>
                                                                <Col md="3">
                                                                    <div className="form-group">
                                                                        <label>Duration Name</label>
                                                                        <Input
                                                                            type="text"
                                                                            name="name"
                                                                            value={newDuration.name}
                                                                            onChange={handleDurationChange}
                                                                            placeholder="Enter Duration Name"
                                                                        />
                                                                        {errors.name && <div className="text-danger">{errors.name}</div>}
                                                                    </div>
                                                                </Col>
                                                                <Col md="2">
                                                                    <div className="form-group">
                                                                        <label>Start Date</label>
                                                                        <DatePicker
                                                                            selected={newDuration.startDate}
                                                                            onChange={handlestartDateChange}
                                                                            className="form-control"
                                                                        />
                                                                    </div>
                                                                    {errors.StartDate && <div className="text-danger">{errors.StartDate}</div>}
                                                                </Col>
                                                                <Col md="2">
                                                                    <div className="form-group">
                                                                        <label>End Date</label>
                                                                        <DatePicker
                                                                            selected={newDuration.endDate}
                                                                            onChange={handleDateChange}
                                                                            className="form-control"
                                                                        />
                                                                    </div>
                                                                    {errors.endDate && <div className="text-danger">{errors.endDate}</div>}
                                                                </Col>
                                                                <Col md="2">
                                                                    <div className="form-group">
                                                                        <label>Amount</label>
                                                                        <Input
                                                                            type="number"
                                                                            name="amount"
                                                                            value={newDuration.amount}
                                                                            onChange={handleDurationChange}
                                                                            placeholder="Enter Amount"
                                                                        />
                                                                        {errors.amount && <div className="text-danger">{errors.amount}</div>}
                                                                    </div>
                                                                </Col>
                                                                <Col md="2">
                                                                    <div className="form-group">
                                                                        <label>Currency</label>
                                                                        <Input
                                                                            type="select"
                                                                            name="currency"
                                                                            value={newDuration.currency}
                                                                            onChange={handleDurationChange}
                                                                        >
                                                                            <option value="USD">USD</option>
                                                                            <option value="EUR">EUR</option>
                                                                            <option value="GBP">GBP</option>
                                                                        </Input>
                                                                    </div>
                                                                </Col>
                                                                <Col md="1" style={{ alignSelf: 'end' }}>
                                                                    <div className="form-group">
                                                                        {isEditing ? (
                                                                            <>
                                                                                <Button color="success" onClick={handleSaveDuration}>
                                                                                    Save
                                                                                </Button>
                                                                                <Button color="secondary" onClick={handleCancelEdit}>
                                                                                    Cancel
                                                                                </Button>
                                                                            </>
                                                                        ) : (
                                                                            <Button color="primary" onClick={handleAddDuration}>
                                                                                <FaPlus />
                                                                            </Button>
                                                                        )}
                                                                    </div>
                                                                </Col>
                                                            </Row>
                                                            <Table striped>
                                                                <thead>
                                                                    <tr>
                                                                        <th>Name</th>
                                                                        <th>Start Date</th>
                                                                        <th>End Date</th>
                                                                        <th>Amount</th>
                                                                        <th>Currency</th>
                                                                        <th>Actions</th>
                                                                    </tr>
                                                                </thead>
                                                                <tbody>
                                                                    {durations.map((duration, index) => (
                                                                        <tr key={index}>
                                                                            <td>{duration.name}</td>
                                                                            <td>{duration.startDate.toLocaleDateString()}</td>
                                                                            <td>{duration.endDate.toLocaleDateString()}</td>
                                                                            <td>{duration.amount}</td>
                                                                            <td>{duration.currency}</td>
                                                                            <td>
                                                                                <Button color="info" onClick={() => handleEditDuration(index)}>Edit</Button>
                                                                                <Button color="danger" onClick={() => handleDeleteDuration(index)}>Delete</Button>
                                                                            </td>
                                                                        </tr>
                                                                    ))}
                                                                </tbody>
                                                            </Table>
                                                        </CardBody>
                                                    </Card>
                                                )}

                                                <Modal isOpen={modalOpen} toggle={() => setModalOpen(!modalOpen)}>
                                                    <ModalBody>
                                                        <Row>
                                                            <Col md="3">
                                                                <div className="form-group">
                                                                    <label>Duration Name</label>
                                                                    <Input
                                                                        type="text"
                                                                        name="name"
                                                                        value={newDuration.name}
                                                                        onChange={handleDurationChange}
                                                                        placeholder="Enter Duration Name"
                                                                    />
                                                                    {errors.name && <div className="text-danger">{errors.name}</div>}
                                                                </div>
                                                            </Col>
                                                            <Col md="3">
                                                                <div className="form-group">
                                                                    <label>Start Date</label>
                                                                    <DatePicker
                                                                        selected={newDuration.startDate}
                                                                        onChange={handlestartDateChange}
                                                                        className="form-control"
                                                                    />
                                                                </div>
                                                                {errors.StartDate && <div className="text-danger">{errors.StartDate}</div>}
                                                            </Col>
                                                            <Col md="3">
                                                                <div className="form-group">
                                                                    <label>End Date</label>
                                                                    <DatePicker
                                                                        selected={newDuration.endDate}
                                                                        onChange={handleDateChange}
                                                                        className="form-control"
                                                                    />
                                                                </div>
                                                                {errors.endDate && <div className="text-danger">{errors.endDate}</div>}
                                                            </Col>
                                                            <Col md="2">
                                                                <div className="form-group">
                                                                    <label>Amount</label>
                                                                    <Input
                                                                        type="number"
                                                                        name="amount"
                                                                        value={newDuration.amount}
                                                                        onChange={handleDurationChange}
                                                                        placeholder="Enter Amount"
                                                                    />
                                                                    {errors.amount && <div className="text-danger">{errors.amount}</div>}
                                                                </div>
                                                            </Col>
                                                            <Col md="2">
                                                                <div className="form-group">
                                                                    <label>Currency</label>
                                                                    <Input
                                                                        type="select"
                                                                        name="currency"
                                                                        value={newDuration.currency}
                                                                        onChange={handleDurationChange}
                                                                    >
                                                                        <option value="USD">USD</option>
                                                                        <option value="EUR">EUR</option>
                                                                        <option value="GBP">GBP</option>
                                                                    </Input>
                                                                </div>
                                                            </Col>
                                                        </Row>
                                                    </ModalBody>
                                                    <ModalFooter>
                                                        <Button color="success" onClick={handleSaveDuration}>Save</Button>
                                                        <Button color="secondary" onClick={handleCancelEdit}>Cancel</Button>
                                                    </ModalFooter>
                                                </Modal>


                                            </Row>
                                            <Button type="submit" color="primary" className='mt-5'>Submit</Button>
                                        </form>
                                    )}
                                />
                            </CardBody>
                        </Card>
                    </Col>
                </Row>
            </Container>
        </Fragment>
    );
};

export default EditTicket;
