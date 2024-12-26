import React, { Fragment, useEffect, useState } from 'react';
import { Container, Row, Col, Button, Card, CardBody, CardHeader, FormFeedback, Input, FormGroup, Label, Modal, ModalBody, ModalHeader, ModalFooter, Table, Media } from 'reactstrap';
import { Form, Field } from 'react-final-form';
import useAuth from '../../Auth/protectedAuth';
import Select from 'react-select';
import { getToken } from '../../Auth/Auth';
import axios from 'axios';
import { BackendAPI } from '../../api';
import { Breadcrumbs } from '../../AbstractElements';
import { useLocation } from 'react-router-dom';
import { required, Name, option } from '../Utils/validationUtils';
import DatePicker from 'react-datepicker';
import { FaEdit, FaPlus } from 'react-icons/fa';
import { MdDelete } from "react-icons/md";
import SweetAlert from 'sweetalert2';
import { Link, useNavigate } from 'react-router-dom';

const composeValidators = (...validators) => value =>
    validators.reduce((error, validator) => error || validator(value), undefined);

const EditTicket = () => {
    useAuth();
    const location = useLocation();
    const { addon } = location.state;

    const [loading, setLoading] = useState(true);
    const [modal, setModal] = useState(false);
    const [ticktes, setticktes] = useState([]);
    const [addonCategory, setAddonCategory] = useState(String(addon.addon_cat_type));
    const [accompanySeatType, setAccompanySeatType] = useState(addon.addon_accper_type); // State for accompany seat type
    const [selectedType, setSelectedType] = useState(addon.addon_workshop_id);
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
    const [workshoptypedata, setworkshoptype] = useState([]);
    const [selectedworkshoptype, setselectedworkshoptype] = useState(addon.addon_workshoprtype_id);
    const [selectedworkshop, setselectedworkshop] = useState(addon.addon_workshop_id);

    const options = [
        { value: '0', label: 'Other' },
        { value: '1', label: 'Workshop' },
        { value: '2', label: 'Accompany Person' }
    ];

    // Effect to update the selected option in case addon.addon_cat_type changes
    // useEffect(() => {
    //     if (addon.addon_cat_type !== undefined) {
    //         setAddonCategory(String(addon.addon_cat_type));
    //     }
    // }, [addon.addon_cat_type]);


    console.log("addonCategory", addonCategory);

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

            const { regCategory: fetchregcat, regtype: fetchcatgorie, tickets: fetchticket, workshop: fetchworkshop, workshoptype: fetchworkshoptype } = response.data;

            setRegCat(fetchregcat);
            setCattype(fetchcatgorie);
            setticktes(fetchticket);
            setWorkshops(fetchworkshop);
            setworkshoptype(fetchworkshoptype);

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

    // const handleAddonCategoryChange = (selectedOption) => {
    //     console.log("Selected:",selectedOption);
    //     setAddonCategory(selectedOption.value);
    // };

    // const handleTypeSelect = (e) => {
    //     if (selectedOption && selectedOption.value) {
    //     setSelectedType(e.target.value);
    // };
    const handleTypeSelect = (selectedOption) => {
        if (selectedOption && selectedOption.value) {
            console.log("Selected Option:", selectedOption);
            setSelectedType(selectedOption.value); // Update the selected workshop ID
        }
    };

    const handleSeatTypeChange = (selectedOption, form) => {
        const value = selectedOption.value;  // Extract the value from react-select option
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
        console.log("values",values);
        const selectedTickets = values.tickets ? values.tickets.map(option => option.value) : null;

        // Prepare the data to be sent
        const formData = {
            addonId: addon.addon_id,
            tickets: selectedTickets,
            addonTitle: values.addonTitle,                 // Addon Title field
            addonDescription: values.addonDescription,     // Addon Description field
            addonCategory: addonCategory,                  // Addon Category from the local state (can be "0", "1", or "2")
            workshopDetails: selectedworkshop,       // Workshop details if selected
            accompanySeatType: values.accompanySeatType,   // Seat type for accompany (unlimited/limited)
            accpseatNumber: addonCategory === "2" && values.accompanySeatType === 'Limited' ? values.accpseatNumber : null, // Seat number if "Limited" selected in accompany
            seatType: seatType,
            priceType: priceType,                          // This will be either "Unlimited" or "Limited" for the general seat type
            seatCount: seatType === 'Limited' ? seatCount : null, // Include seat count if Limited is selected
            ticketStatus: values.ticketStatus,             // Ticket status: Open, Close, or Sold Out
            durations: durations,                          // Array of duration objects with name, endDate, amount, and currency
            isVisible: values.isvisible ? 1 : 0,   
            workshoptype: selectedworkshoptype,        // Checkbox for visibility (1 if checked, 0 if not)
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
                    html: `Addon updated successfully!`,
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

    const handleNavigation = () => {
        navigate(`${process.env.PUBLIC_URL}/registration/manage-addon/Consoft`);
    };

    const handleCancel = () => {
        setModal(true);
    };
    const filteredWorkshops = Workshops.filter(
        (workshop) => workshop.cs_workshoptype_id === selectedworkshoptype
    );
    console.log("addon.addon_workshop_id:", addon.addon_workshop_id);

    return (
        <Fragment>
            <Breadcrumbs mainTitle="Edit Add-on" parent="Manage Addon" title="Edit Add-on" />
            <Container fluid={true}>
                <Row className='justify-content-center'>
                    <Col sm="8">
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
                                        workshopDetails : selectedworkshop,

                                    }} // Set initial values
                                    render={({ handleSubmit }) => (
                                        <form onSubmit={handleSubmit}>
                                            <Row>
                                                <Col md="12" className="mb-3">
                                                    <Field name={`tickets`}
                                                        validate={required}>
                                                        {({ input }) => (
                                                            <div>
                                                                <Label className='form-label' for="tickets"><strong>Available to<span className="red-asterisk">*</span> </strong></Label>

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

                                                <Col md="12" className="mb-3">
                                                    {/* <Field
                                                        name="addonCategory"
                                                        validate={required}
                                                        defaultValue="addon.addon_cat_type"
                                                    >
                                                        {({ input, meta }) => (
                                                            <div className="form-group">
                                                                <div className="form-group mb-3">
                                                                    <label><strong>Addon Category</strong></label>
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
                                                                </div>
                                                                {meta.touched && meta.error && (
                                                                    <FormFeedback>{meta.error}</FormFeedback>
                                                                )}
                                                            </div>
                                                        )}
                                                    </Field> */}
                                                    <Field name="addonCategory">
                                                        {({ input, meta }) => {
                                                            // Find the selected option based on the current value in input
                                                            const selectedOption = options.find(option => option.value === addonCategory);

                                                            return (
                                                                <div className="form-group mb-3">
                                                                    <Label className="form-label" for="eventday">
                                                                        <strong>
                                                                            Addon Category <span className="red-asterisk">*</span>
                                                                        </strong>
                                                                    </Label>
                                                                    <Select
                                                                        {...input} // Pass in the input props (value and onChange)
                                                                        options={options}
                                                                        onChange={(selectedOption) => {
                                                                            input.onChange(selectedOption.value); // Update form state
                                                                            setAddonCategory(selectedOption.value); // Update local state
                                                                            console.log("Value Changed to:", selectedOption.value);
                                                                        }}
                                                                        onBlur={input.onBlur}
                                                                        value={selectedOption} // Ensure the correct option is selected
                                                                        classNamePrefix="react-select"
                                                                    />
                                                                    {meta.touched && meta.error && (
                                                                        <FormFeedback>{meta.error}</FormFeedback>
                                                                    )}
                                                                </div>
                                                            );
                                                        }}
                                                    </Field>



                                                    {/* Conditionally render new dropdown if "Workshop" is selected */}
                                                    {
                                                        addonCategory === "1" && (

                                                            //     <Field name="workshopDetails" initialValue={addon.addon_workshop_id}>
                                                            //     {({ input, meta }) => {
                                                            //       // Find the selected option based on either the state or input value
                                                            //       const selectedOption = Workshops.find(
                                                            //         (type) => type.cs_workshop_id === selectedType
                                                            //       );

                                                            //       return (
                                                            //         <div className="form-group">
                                                            //           <label><strong>Workshop</strong></label>
                                                            //           <Select
                                                            //             {...input} // Spread the input props from react-final-form
                                                            //             options={Workshops.map((type) => ({
                                                            //               value: type.cs_workshop_id,
                                                            //               label: type.cs_workshop_name,
                                                            //             }))}
                                                            //             onChange={(selectedOption) => {
                                                            //               input.onChange(selectedOption.value); // Update form input state
                                                            //               handleTypeSelect(selectedOption); // Update local state for tracking
                                                            //             }}
                                                            //             classNamePrefix="react-select"
                                                            //             // Ensure the correct value is shown in the dropdown
                                                            //             value={
                                                            //               selectedOption
                                                            //                 ? { value: selectedOption.cs_workshop_id, label: selectedOption.cs_workshop_name }
                                                            //                 : null
                                                            //             }
                                                            //           />

                                                            //           {meta.touched && meta.error && (
                                                            //             <FormFeedback>{meta.error}</FormFeedback>
                                                            //           )}
                                                            //         </div>
                                                            //       );
                                                            //     }}
                                                            //   </Field>

                                                            <div>
                                                                {/* Workshop Type Dropdown */}
                                                                <div className="form-group">
                                                                    <label><strong>Workshop Type</strong></label>
                                                                    <Select
                                                                        options={workshoptypedata.map((type) => ({
                                                                            value: type.id,
                                                                            label: type.workshoptype_name,
                                                                        }))}
                                                                        value={workshoptypedata
                                                                            .map((type) => ({
                                                                                value: type.id,
                                                                                label: type.workshoptype_name,
                                                                            }))
                                                                            .find((option) => option.value === selectedworkshoptype)} // Set the selected option based on state
                                                                        onChange={(selectedOption) => {
                                                                            console.log("selectedOption.value",selectedOption.value);
                                                                            setselectedworkshoptype(selectedOption.value); // Update state when option changes
                                                                        }}
                                                                        classNamePrefix="react-select"
                                                                    />
                                                                </div>


                                                                {/* Workshop Dropdown (Rendered only after type is selected) */}
                                                                {workshoptypedata !== "0" && (
                                                                    <Field name="workshopDetails" initialValue={selectedworkshop}>
                                                                        {({ input, meta }) => {
                                                                            // Ensure filteredWorkshops is correctly populated based on selectedworkshoptype
                                                                            const filteredWorkshops = Workshops.filter(
                                                                                (workshop) => workshop.cs_workshoptype_id === selectedworkshoptype
                                                                            );

                                                                            // Find the selected value based on input.value
                                                                            const selectedValue = filteredWorkshops.find(
                                                                                (type) => type.cs_workshop_id === input.value
                                                                            );

                                                                            return (
                                                                                <div className="form-group">
                                                                                    <label><strong>Workshop</strong></label>
                                                                                    <Select
                                                                                        options={filteredWorkshops.map((type) => ({
                                                                                            value: type.cs_workshop_id,
                                                                                            label: type.cs_workshop_name,
                                                                                        }))}
                                                                                        value={
                                                                                            selectedValue
                                                                                                ? { value: selectedValue.cs_workshop_id, label: selectedValue.cs_workshop_name }
                                                                                                : null
                                                                                        } // Ensure value matches the selected option
                                                                                        onChange={(selectedOption) => {
                                                                                            setselectedworkshop(selectedOption.value);
                                                                                            input.onChange(selectedOption ? selectedOption.value : null); // Update Formik's state
                                                                                        }}
                                                                                        classNamePrefix="react-select"
                                                                                    />
                                                                                    {meta.touched && meta.error && (
                                                                                        <FormFeedback>{meta.error}</FormFeedback>
                                                                                    )}
                                                                                </div>
                                                                            );
                                                                        }}
                                                                    </Field>
                                                                )}





                                                            </div>



                                                        )
                                                    }
                                                    {
                                                        addonCategory === "2" && (
                                                            <div className="form-group">
                                                                <label><strong>Accompany</strong></label>
                                                                <div>
                                                                    {/* Unlimited radio button */}
                                                                    {/* <Field name="accompanySeatType" type="radio" value="Unlimited">
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
                                                                                className='me-2'
                                                                            />
                                                                            Unlimited
                                                                        </label>
                                                                    )}
                                                                </Field> */}
                                                                    <Field name="accompanySeatType" type="radio" value="Unlimited">
                                                                        {({ input }) => (
                                                                            <label>
                                                                                <input
                                                                                    {...input}
                                                                                    type="radio"
                                                                                    onChange={(e) => {
                                                                                        input.onChange(e);
                                                                                        handleAccompanySeatTypeChange("Unlimited");
                                                                                    }}
                                                                                    className='me-2'
                                                                                />
                                                                                Unlimited
                                                                            </label>
                                                                        )}
                                                                    </Field>

                                                                    {/* Limited radio button */}
                                                                    {/* <Field name="accompanySeatType" type="radio" value="Limited" className="ms-5">
                                                                    {({ input }) => (
                                                                        <label className='ms-2'>
                                                                            <Input
                                                                                {...input}
                                                                                type="radio"
                                                                                value="Limited"
                                                                                onChange={(e) => {
                                                                                    input.onChange(e);
                                                                                    handleAccompanySeatTypeChange("Limited"); // Custom handler for updating local state
                                                                                }}
                                                                                className='me-2'
                                                                            />
                                                                            Limited
                                                                        </label>
                                                                    )}
                                                                </Field> */}
                                                                    <Field name="accompanySeatType" type="radio" value="Limited" className="ms-5">
                                                                        {({ input }) => (
                                                                            <label className='ms-2'>
                                                                                <input
                                                                                    {...input}
                                                                                    type="radio"
                                                                                    onChange={(e) => {
                                                                                        input.onChange(e);
                                                                                        handleAccompanySeatTypeChange("Limited");
                                                                                    }}
                                                                                    className='me-2'
                                                                                />
                                                                                Limited
                                                                            </label>
                                                                        )}
                                                                    </Field>
                                                                </div>
                                                            </div>
                                                        )
                                                    }

                                                    {/* Conditionally render the number input field if "Limited" is selected */}
                                                    {
                                                        addonCategory === "2" && accompanySeatType === "Limited" && (
                                                            <Field name="accpseatNumber" validate={required}>
                                                                {({ input, meta }) => (
                                                                    <div className="form-group">
                                                                        <label><strong>Enter Number of Seats</strong></label>
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
                                                        )
                                                    }

                                                </Col>
                                                <Col md="12" className="mb-3">
                                                    <Field name={`addonTitle`} validate={composeValidators(required, Name)}>
                                                        {({ input, meta }) => (
                                                            <div className="form-group">
                                                                <label className="d-flex justify-content-between align-items-center">
                                                                    <strong>Title Name<span className="red-asterisk">*</span></strong>
                                                                    <small>(0/50)</small>
                                                                </label>                                                                 <input
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
                                                <Col md="12" className="mb-3">
                                                    <Field
                                                        name="addonDescription"
                                                        validate={required}
                                                    >
                                                        {({ input, meta }) => (
                                                            <div className="form-group">
                                                                <label className="d-flex justify-content-between align-items-center">
                                                                    <strong>Description<span className="red-asterisk">*</span></strong><small>(0/250)</small>
                                                                </label>                                                                <textarea
                                                                    {...input}
                                                                    placeholder="Enter Addon Description"
                                                                    className={`form-control ${meta.touched && meta.error ? 'error-class' : ''}`}
                                                                />
                                                                {meta.error && meta.touched && <p className='d-block text-danger'>{meta.error}</p>}
                                                            </div>
                                                        )}
                                                    </Field>
                                                </Col>

                                                <Col md="12" className="mb-3">
                                                    <div className="form-group">
                                                        <label><strong>Number of Add ons</strong></label>
                                                        <Select
                                                            value={{ label: seatType, value: seatType }}  // Set selected value
                                                            onChange={(selectedOption) => handleSeatTypeChange(selectedOption)}  // Pass selectedOption instead of e
                                                            options={[
                                                                { value: 'Unlimited', label: 'Unlimited' },
                                                                { value: 'Limited', label: 'Limited' },
                                                            ]}
                                                            classNamePrefix="react-select"
                                                        />
                                                    </div>
                                                    {seatType === 'Limited' && (
                                                        <Field
                                                            name="seatCount"
                                                        >
                                                            {({ input, meta }) => (
                                                                <div className="form-group mt-2">
                                                                    <label><strong>Seat Count</strong></label>
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

                                                <Col md="12" className="mb-3">
                                                    <Field name="ticketStatus" validate={required} initialValue={addon.addon_status}>
                                                        {({ input, meta }) => (
                                                            <div className="form-group">
                                                                <label><strong>Ticket Status</strong></label>
                                                                <Select
                                                                    {...input}
                                                                    value={{ label: input.value, value: input.value }} // Pre-select value in react-select
                                                                    onChange={(e) => input.onChange(e.value)} // Update form state
                                                                    options={[
                                                                        { value: 'Open', label: 'Open' },
                                                                        { value: 'Close', label: 'Close' },
                                                                        { value: 'SoldOut', label: 'Marked as Sold Out' },
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




                                                <Col md="12" className="mb-3">
                                                    <div className="form-group">
                                                        <strong>Price</strong>
                                                        <div className='me-5 mt-3'>
                                                            <input
                                                                type="radio"
                                                                name="priceType"
                                                                value="Free"
                                                                checked={priceType === 'Free'}
                                                                onChange={handlePriceChange}
                                                                className='me-2'
                                                            /> <strong >Free</strong>
                                                            <input
                                                                type="radio"
                                                                name="priceType"
                                                                value="Paid"
                                                                checked={priceType === 'Paid'}
                                                                onChange={handlePriceChange}
                                                                className='ms-3 me-2'

                                                            />Paid
                                                        </div>
                                                    </div>
                                                </Col>

                                                {priceType === 'Paid' && (

                                                    <Card className='mt-3'>
                                                        <CardHeader>
                                                            <h5><strong>Duration Management</strong></h5>
                                                        </CardHeader>
                                                        <CardBody>
                                                            <Row>
                                                                <Col md="12" className='mb-2'>
                                                                    <div className="form-group">
                                                                        <label><strong>Duration Name</strong></label>
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
                                                            </Row>
                                                            <Row>
                                                                <Col md="6" className='mb-2'>
                                                                    <div className="form-group">
                                                                        <label><strong>Start Date</strong></label>
                                                                        <DatePicker
                                                                            selected={newDuration.startDate}
                                                                            onChange={handlestartDateChange}
                                                                            className="form-control"
                                                                            showMonthDropdown
                                                                            showYearDropdown
                                                                        />
                                                                    </div>
                                                                    {errors.StartDate && <div className="text-danger">{errors.StartDate}</div>}
                                                                </Col>
                                                                <Col md="6" className='mb-2'>
                                                                    <div className="form-group">
                                                                        <label><strong>End Date</strong></label>
                                                                        <DatePicker
                                                                            selected={newDuration.endDate}
                                                                            onChange={handleDateChange}
                                                                            className="form-control"
                                                                            showMonthDropdown
                                                                            showYearDropdown
                                                                        />
                                                                    </div>
                                                                    {errors.endDate && <div className="text-danger">{errors.endDate}</div>}
                                                                </Col>
                                                                <Col md="6" className='mb-2'>
                                                                    <div className="form-group">
                                                                        <label><strong>Amount</strong></label>
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
                                                                {/* <Col md="6" className='mb-2'>
                                                                    <div className="form-group">
                                                                        <label><strong>Currency</strong></label>
                                                                        <Select
                                                                            name="currency"
                                                                            value={{ label: newDuration.currency, value: newDuration.currency }} // Set the selected value
                                                                            onChange={(option) => handleDurationChange({ target: { name: 'currency', value: option.value } })} // Update using a synthetic event
                                                                            options={[
                                                                                { value: 'USD', label: 'USD' },
                                                                                { value: 'EUR', label: 'EUR' },
                                                                                { value: 'GBP', label: 'GBP' }
                                                                            ]}
                                                                            classNamePrefix="react-select"
                                                                        />
                                                                    </div>
                                                                </Col> */}
                                                                <Col md="12" style={{ alignSelf: 'end' }}>
                                                                    <div className="form-group">
                                                                        {isEditing ? (
                                                                            <>
                                                                                <Button color="primary" onClick={handleSaveDuration}>
                                                                                    Save
                                                                                </Button>
                                                                                <Button color="warning" onClick={handleCancelEdit}>
                                                                                    Cancel
                                                                                </Button>
                                                                            </>
                                                                        ) : (
                                                                            <Button color="" onClick={handleAddDuration} className='mt-2'>
                                                                                <FaPlus /> <strong>Add</strong>
                                                                            </Button>
                                                                        )}
                                                                    </div>
                                                                </Col>
                                                            </Row>
                                                            <div className='table-responsive'>

                                                                <Table striped>
                                                                    <thead>
                                                                        <tr>
                                                                            <th>Name</th>
                                                                            <th>Start Date</th>
                                                                            <th>End Date</th>
                                                                            <th>Amount</th>
                                                                            {/* <th>Currency</th> */}
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
                                                                                {/* <td>{duration.currency}</td> */}
                                                                                <td>
                                                                                    <Button size="sm" color="warning" onClick={() => handleEditDuration(index)}>
                                                                                        <FaEdit /> {/* Edit icon */}
                                                                                    </Button>
                                                                                    <Button size="sm" color="danger" onClick={() => handleDeleteDuration(index)}>
                                                                                        <MdDelete /> {/* Delete icon */}
                                                                                    </Button>
                                                                                </td>

                                                                            </tr>
                                                                        ))}
                                                                    </tbody>
                                                                </Table>
                                                            </div>
                                                        </CardBody>
                                                    </Card>
                                                )}

                                                <Row>

                                                    <Col md="12" className="mt-4">
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
                                                                    <Label className='form-check-label' style={{ marginLeft: '10px' }} for="isvisible"><strong>Is visible on user dashboard</strong></Label>
                                                                    {meta.error && meta.touched && <p className='d-block text-danger'>{meta.error}</p>}
                                                                </div>
                                                            )}
                                                        </Field>
                                                    </Col>

                                                </Row>

                                                <Modal isOpen={modalOpen} toggle={() => setModalOpen(!modalOpen)} centered>
                                                    <ModalBody>
                                                        <Row>
                                                            <Col md="12" className="mb-3">
                                                                <div className="form-group">
                                                                    <label><strong>Duration Name</strong></label>
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
                                                        </Row>
                                                        <Row>
                                                            <Col md="6" className="mb-3">
                                                                <div className="form-group">
                                                                    <label>Start Date</label>
                                                                    <DatePicker
                                                                        selected={newDuration.startDate}
                                                                        onChange={handlestartDateChange}
                                                                        className="form-control"
                                                                        showMonthDropdown
                                                                        showYearDropdown
                                                                    />
                                                                </div>
                                                                {errors.StartDate && <div className="text-danger">{errors.StartDate}</div>}
                                                            </Col>
                                                            <Col md="6" className="mb-3">
                                                                <div className="form-group">
                                                                    <label>End Date</label>
                                                                    <DatePicker
                                                                        selected={newDuration.endDate}
                                                                        onChange={handleDateChange}
                                                                        className="form-control"
                                                                        showMonthDropdown
                                                                        showYearDropdown
                                                                    />
                                                                </div>
                                                                {errors.endDate && <div className="text-danger">{errors.endDate}</div>}
                                                            </Col>
                                                        </Row>
                                                        <Row>
                                                            <Col md="6">
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
                                                            {/* <Col md="6">
                                                                <div className="form-group">
                                                                    <label><strong>Currency</strong></label>
                                                                    <Select
                                                                        name="currency"
                                                                        value={{ label: newDuration.currency, value: newDuration.currency }} // Set the selected value
                                                                        onChange={(option) => handleDurationChange({ target: { name: 'currency', value: option.value } })} // Update using a synthetic event
                                                                        options={[
                                                                            { value: 'USD', label: 'USD' },
                                                                            { value: 'EUR', label: 'EUR' },
                                                                            { value: 'GBP', label: 'GBP' }
                                                                        ]}
                                                                        classNamePrefix="react-select"
                                                                    />
                                                                </div>
                                                            </Col> */}
                                                        </Row>
                                                    </ModalBody>
                                                    <ModalFooter>
                                                        <Button color="primary" onClick={handleSaveDuration}>Save</Button>
                                                        <Button color="warning" onClick={handleCancelEdit}>Cancel</Button>
                                                    </ModalFooter>
                                                </Modal>


                                            </Row>
                                            <div className="d-flex justify-content-end mt-3">
                                                <Button color='warning' onClick={handleCancel} className="ms-3">Cancel</Button>
                                                <Button type="submit" color="primary" className='ms-3'>Save</Button>
                                            </div>

                                        </form>
                                    )}
                                />
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
                    {/* <Link to="/Categories/Consoft" className="btn btn-warning">Yes</Link> */}
                    <Button color="primary" onClick={() => setModal(!modal)}>No</Button>
                </ModalFooter>
            </Modal>
        </Fragment>
    );
};

export default EditTicket;
