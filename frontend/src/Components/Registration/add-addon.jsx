import React, { Fragment, useEffect, useState, useCallback } from 'react';
import { Container, Row, Col, Button, Card, CardBody, CardHeader, FormFeedback, Input, FormGroup, Label, Modal, ModalBody, ModalHeader, ModalFooter, Table, Media } from 'reactstrap';
import { Form, Field } from 'react-final-form';
import { required, Name } from '../Utils/validationUtils';
import useAuth from '../../Auth/protectedAuth';
import { Breadcrumbs, Btn, H5 } from '../../AbstractElements';
import styled from 'styled-components';
import axios from 'axios';
import { BackendAPI } from '../../api';
import { getToken } from '../../Auth/Auth';
import Switch from 'react-switch';
import Select from 'react-select';
import { FaEdit, FaPlus } from 'react-icons/fa';
import { MdDelete } from "react-icons/md";
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import ReactQuill from 'react-quill';
import SweetAlert from 'sweetalert2';
import { Link, useNavigate, useLocation } from 'react-router-dom';
const composeValidators = (...validators) => value =>
    validators.reduce((error, validator) => error || validator(value), undefined);

const RedAsterisk = styled.span`
    color: red;
`;

const Tag = styled.div`
    display: inline-block;
    background: #e0e0e0;
    border-radius: 3px;
    padding: 2px 8px;
    margin: 2px;
    font-size: 12px;
    color: #333;
    cursor: pointer;

    .remove-tag {
        margin-left: 5px;
        font-weight: bold;
        color: red;
    }
`;

const ApprovalContainer = styled.div`
    display: flex;
    align-items: center;
    margin-top: 1rem;
`;

const DurationTable = styled(Table)`
    margin-top: 1rem;
`;

const AddAddon = () => {
    useAuth();
    const [seatType, setSeatType] = useState('Unlimited');
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modal, setModal] = useState(false);
    const [regCat, setRegCat] = useState([]);
    const [Cattype, setCattype] = useState([]);
    const [ticktes, setticktes] = useState([]);
    const [Workshops, setWorkshops] = useState([]);
    const [selectedCategories, setSelectedCategories] = useState([]);
    const [isManualApproval, setIsManualApproval] = useState(false);
    const [priceType, setPriceType] = useState('Free');
    const [durations, setDurations] = useState([]);
    const [newDuration, setNewDuration] = useState({ name: '', startDate: new Date(), endDate: new Date(), amount: '', currency: 'USD' });
    const [isEditing, setIsEditing] = useState(false);
    const [editIndex, setEditIndex] = useState(null);
    const [errors, setErrors] = useState({});
    const [isVisible, setIsVisible] = useState(false);
    const [maxBuyingLimit, setMaxBuyingLimit] = useState('');
    const [selectedType, setSelectedType] = useState(''); // Se
    const [isExpanded, setIsExpanded] = useState(false);
    const [showAll, setShowAll] = useState(false); // State to toggle visibility of the full list
    const [seatCount, setSeatCount] = useState('');
    const [modalOpen, setModalOpen] = useState(false);
    const [value, setValue] = useState('');
    const navigate = useNavigate(); // Initialize useHistory
    const [addonCategory, setAddonCategory] = useState("0");
    const [workshoptypedata, setworkshoptype] = useState([]);
    const [selectedworkshoptype, setselectedworkshoptype] = useState("0");


    const [accompanySeatType, setAccompanySeatType] = useState("Unlimited"); // State for accompany seat type

    console.log("Duration", durations);

    const handleAccompanySeatTypeChange = (type) => {
        setAccompanySeatType(type); // Update accompany seat type ("unlimited" or "limited")
    };


    // Handle seat type change
    const handleSeatTypeChange = (selectedOption, form) => {
        const value = selectedOption.value;  // Extract the value from react-select option
        setSeatType(value);

        // Clear seat count if the type is changed to Unlimited
        if (value === 'Unlimited') {
            setSeatCount('');
        }
    };


    // Handle seat count change
    const handleSeatCountChange = (e) => {
        setSeatCount(e.target.value);
    };

    const handleVisibilityChange = (event) => {
        setIsVisible(event.target.checked);
    };

    const handleToggleChange = () => {
        setIsManualApproval(!isManualApproval);
    };
    const handleEditDuration = (index) => {
        // setIsEditing(true);
        setEditIndex(index);
        setNewDuration(durations[index]); // Populate the form with the current values
        setModalOpen(true);
    };

    const handlePriceChange = (e) => {
        setPriceType(e.target.value);
    };

    const handleDurationChange = (e) => {
        setNewDuration({ ...newDuration, [e.target.name]: e.target.value });
    };

    const toggleShowAll = () => {
        setShowAll(!showAll);
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

    // const handleDurationChange = (e) => {
    //     const { name, value } = e.target;
    //     setNewDuration(prev => ({ ...prev, [name]: value }));
    // };

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

    // const onSubmit = async (values) => {
    //     const selectedtickets = values.tickets ? values.tickets.map(option => option.value) : null;
    //     // Prepare the data to be sent
    //     const formData = {
    //         tickets: selectedtickets,
    //         addonTitle: values.addonTitle,
    //         addonDescription: values.addonDescription,
    //         category: addonCategory,
    //         ticketStatus: values.ticketStatus,
    //         seatType: seatType, // This will be either "Unlimited" or "Limited"
    //         seatCount: seatType === 'Limited' ? seatCount : null, // Include seat count if Limited is selected
    //         durations: durations, // Array of duration objects with name, endDate, amount, currency
    //         isVisible: values.isvisible ? 1 : 0, // Transform checkbox value
    //     };

    //     console.log("formData", formData); // Log the prepared data



    //     try {
    //         const token = getToken(); // Retrieve the token from your auth utility

    //         // Make the POST request to your 'addticket' route
    //         const response = await axios.post(`${BackendAPI}/addonRoutes/addaddon`, formData, {
    //             headers: {
    //                 Authorization: `Bearer ${token}`, // Include the token in the Authorization header
    //                 'Content-Type': 'application/json', // Set the content type for JSON data
    //             },
    //         });

    //         // Handle the success response (e.g., show a success message or redirect)
    //         if (response.data.success) {
    //             SweetAlert.fire({
    //                 title: 'Success!',
    //                 html: `adddon created successfully!`,
    //                 icon: 'success',
    //                 timer: 3000,
    //                 showConfirmButton: false,
    //                 allowOutsideClick: false,
    //                 allowEscapeKey: false
    //             }).then((result) => {
    //                 if (result.dismiss === SweetAlert.DismissReason.timer) {
    //                     navigate(`${process.env.PUBLIC_URL}/registration/manage-tickets/Consoft`);
    //                 }
    //             });
    //         }
    //         console.log('Form submitted successfully:', response.data);
    //     } catch (error) {
    //         // Handle any errors that occur during the API call
    //         console.error('Error submitting form:', error);
    //         // You can show an error notification or handle the error in a user-friendly way here
    //     }
    // };

    const onSubmit = async (values) => {
        const selectedTickets = values.tickets ? values.tickets.map(option => option.value) : null;

        // Prepare the data to be sent
        const formData = {
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
            workshoptype: selectedworkshoptype,
        };

        console.log("formData", formData); // Log the prepared data

        try {
            const token = getToken(); // Retrieve the token from your auth utility

            // Make the POST request to your 'addaddon' route
            const response = await axios.post(`${BackendAPI}/addonRoutes/addaddon`, formData, {
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


    const fetchDropdown = async () => {
        try {
            const token = getToken();
            const response = await axios.get(`${BackendAPI}/addonRoutes/getDropdownData`, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
            setData(response.data);
            setLoading(false);

            const { regCategory: fetchregcat, regtype: fetchcatgorie, tickets: fetchticket, workshop: fetchworkshop, workshoptype: fetchworkshoptype } = response.data;

            setRegCat(fetchregcat);
            setCattype(fetchcatgorie);
            setticktes(fetchticket);
            setWorkshops(fetchworkshop);
            setworkshoptype(fetchworkshoptype);

            console.log("mahesh", workshoptypedata);

        } catch (error) {
            console.error('Error fetching dropdown data:', error);
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDropdown();
    }, []);

    const handleTypeSelect = (selectedOption) => {
        setSelectedType(selectedOption.value);
    };

    const handleMaxBuyingLimitChange = (e) => {
        setMaxBuyingLimit(e.target.value);
    };

    const handleAddonCategoryChange = (selectedOption) => {
        setAddonCategory(selectedOption.value);
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



    return (
        <Fragment>
            <Breadcrumbs mainTitle="Create Add-on" parent="Manage Addon" title="Create Add-on" />
            <Container fluid={true}>
                <Row className='justify-content-center'>
                    <Col sm="8">
                        <Card>
                            <CardBody>
                                <Form
                                    onSubmit={onSubmit}
                                    render={({ handleSubmit, form }) => (
                                        <form onSubmit={handleSubmit}>
                                            <Row>
                                                <Col md="12" className="mb-3">
                                                    <Field
                                                        name={`tickets`} // Use dynamic field name
                                                        validate={required}
                                                    >
                                                        {({ input }) => (
                                                            <div>
                                                                <Label className='form-label' for="tickets"><strong>Available to<span className="red-asterisk">*</span> </strong></Label>
                                                                <Select
                                                                    {...input}
                                                                    options={[
                                                                        { value: 'all', label: 'Select All' },
                                                                        ...ticktes.map(pref => ({ value: pref.ticket_id, label: pref.ticket_title }))
                                                                    ]}
                                                                    // options={regCat.map(pref => ({ value: pref.cs_reg_cat_id, label: pref.cs_reg_category }))}
                                                                    placeholder={`Select Ticktes`}
                                                                    isSearchable={true}
                                                                    onChange={(value) => {
                                                                        if (value && value.length > 0 && value[0].value === 'all') {
                                                                            const allCatNames = ticktes.map(pref => pref.ticket_id);
                                                                            input.onChange([{ value: allCatNames, label: 'Select All' }]);
                                                                        } else {
                                                                            input.onChange(value);
                                                                        }
                                                                    }}
                                                                    // onChange={(value) => input.onChange(value)}
                                                                    onBlur={input.onBlur}
                                                                    classNamePrefix="react-select"
                                                                    isMulti={true}
                                                                    value={input.value}
                                                                />

                                                            </div>
                                                        )}
                                                    </Field>
                                                </Col>

                                            </Row>
                                            <Row>

                                                <Col md="12" className="mb-3">
                                                    <Field
                                                        name="addonCategory"
                                                        validate={required}
                                                        defaultValue="Open"
                                                    >
                                                        {({ input, meta }) => {
                                                            // Ensure the selected value is an object with value and label
                                                            const selectedValue = [
                                                                { value: '0', label: 'Other' },
                                                                { value: '1', label: 'Workshop' },
                                                                { value: '2', label: 'Accompany Person' }
                                                            ].find(option => option.value === input.value);

                                                            return (
                                                                <div className="form-group mb-3">
                                                                    <label><strong>Addon Category</strong></label>
                                                                    <Select
                                                                        {...input}
                                                                        options={[
                                                                            { value: '0', label: 'Other' },
                                                                            { value: '1', label: 'Workshop' },
                                                                            { value: '2', label: 'Accompany Person' }
                                                                        ]}
                                                                        classNamePrefix="react-select"
                                                                        onChange={(selectedOption) => {
                                                                            input.onChange(selectedOption.value); // Update form state
                                                                            handleAddonCategoryChange(selectedOption); // Update local state
                                                                        }}
                                                                        value={selectedValue || null} // Ensure the value is an object
                                                                    />

                                                                    {meta.touched && meta.error && (
                                                                        <FormFeedback>{meta.error}</FormFeedback>
                                                                    )}
                                                                </div>
                                                            );
                                                        }}
                                                    </Field>


                                                    {/* Conditionally render new dropdown if "Workshop" is selected */}
                                                    {addonCategory === "1" && (
                                                        // <Field name="workshopDetails">
                                                        //     {({ input, meta }) => (
                                                        //         <div className="form-group">
                                                        //             <label><strong>Workshop</strong></label>
                                                        //             <Select
                                                        //                 {...input}
                                                        //                 options={Workshops.map((type) => ({
                                                        //                     value: type.cs_workshop_id,
                                                        //                     label: type.cs_workshop_name
                                                        //                 }))}
                                                        //                 onChange={(selectedOption) => {
                                                        //                     input.onChange(selectedOption.value); // Update form state
                                                        //                     handleTypeSelect(selectedOption); // Update selected workshop state
                                                        //                 }}
                                                        //                 classNamePrefix="react-select"
                                                        //             />

                                                        //             {meta.touched && meta.error && (
                                                        //                 <FormFeedback>{meta.error}</FormFeedback>
                                                        //             )}
                                                        //         </div>
                                                        //     )}
                                                        // </Field>
                                                        <div>
                                                            {/* Workshop Type Dropdown */}
                                                            <div className="form-group">
                                                                <label><strong>Workshop Type</strong></label>
                                                                <Select
                                                                    options={workshoptypedata.map((type) => ({
                                                                        value: type.id,
                                                                        label: type.workshoptype_name
                                                                    }))}
                                                                    onChange={(selectedOption) => {
                                                                        setselectedworkshoptype(selectedOption.value); // Update selected workshop type
                                                                    }}
                                                                    classNamePrefix="react-select"
                                                                />
                                                            </div>

                                                            {/* Workshop Dropdown (Rendered only after type is selected) */}
                                                            {workshoptypedata !== "0" && (
                                                                <Field name="workshopDetails">
                                                                    {({ input, meta }) => {
                                                                        // Find the selected value from filteredWorkshops
                                                                        const selectedValue = filteredWorkshops.find(
                                                                            (type) => type.cs_workshop_id === input.value
                                                                        );

                                                                        console.log("Selected Value:", selectedValue);

                                                                        return (
                                                                            <div className="form-group">
                                                                                <label><strong>Workshop</strong></label>
                                                                                <Select
                                                                                    options={filteredWorkshops.map((type) => ({
                                                                                        value: type.cs_workshop_id,
                                                                                        label: type.cs_workshop_name
                                                                                    }))}
                                                                                    value={
                                                                                        selectedValue
                                                                                            ? { value: selectedValue.cs_workshop_id, label: selectedValue.cs_workshop_name }
                                                                                            : null
                                                                                    } // Ensure value matches the Select option format
                                                                                    onChange={(selectedOption) => {
                                                                                        console.log("Selected Option:", selectedOption);
                                                                                        input.onChange(selectedOption.value); // Update form state
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
                                                    )}

                                                    {addonCategory === "2" && (
                                                        <div className="form-group">
                                                            <label><strong>Accompany</strong></label>
                                                            <div>
                                                                {/* Unlimited radio button */}
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
                                                    )}

                                                    {/* Conditionally render the number input field if "Limited" is selected */}
                                                    {addonCategory === "2" && accompanySeatType === "Limited" && (
                                                        <Field name="accpseatNumber" validate={required}>
                                                            {({ input, meta }) => (
                                                                <div className="form-group">
                                                                    <label><strong>Enter Number of Seats</strong></label>
                                                                    <input
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


                                                <Col md="12" className="mb-3">
                                                    <Field
                                                        name="addonTitle"
                                                        validate={composeValidators(required, Name)}
                                                    >
                                                        {({ input, meta }) => (
                                                            <div className="form-group">
                                                                <label className="d-flex justify-content-between align-items-center">
                                                                    <strong>Title Name<span className="red-asterisk">*</span></strong>
                                                                    <small>(0/50)</small>
                                                                </label>                                                                <input
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
                                                                </label>
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




                                                <Col md="12" className="mb-3">
                                                    <div className="form-group">
                                                        <label><strong>Number of Add ons</strong></label>
                                                        <Select
                                                            value={{ label: seatType, value: seatType }}  // Set selected value
                                                            onChange={(selectedOption) => handleSeatTypeChange(selectedOption, form)}  // Pass selectedOption instead of e
                                                            options={[
                                                                { value: 'Unlimited', label: 'Unlimited' },
                                                                { value: 'Limited', label: 'Limited' },
                                                            ]}
                                                            classNamePrefix="react-select"
                                                        />
                                                    </div>

                                                    {seatType === 'Limited' && (
                                                        <Field name="seatCount">
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
                                                    <Field name="ticketStatus" validate={required} defaultValue="Open">
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




                                                <Col md="12" className='mt-3'>
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
                                                            /> Free
                                                            <input
                                                                type="radio"
                                                                name="priceType"
                                                                value="Paid"
                                                                checked={priceType === 'Paid'}
                                                                onChange={handlePriceChange}
                                                                className='ms-3 me-2'
                                                            /> Paid
                                                        </div>
                                                    </div>
                                                </Col>


                                            </Row>



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
                                                                        onChange={(date) => setNewDuration({ ...newDuration, startDate: date })}
                                                                        className="form-control"
                                                                    />
                                                                </div>
                                                                {errors.StartDate && <div className="text-danger">{errors.StartDate}</div>}
                                                            </Col>
                                                            <Col md="6" className='mb-2'>
                                                                <div className="form-group">
                                                                    <label><strong>End Date</strong></label>
                                                                    <DatePicker
                                                                        selected={newDuration.endDate}
                                                                        onChange={(date) => setNewDuration({ ...newDuration, endDate: date })}
                                                                        className="form-control"
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
                                                                        value={{ label: newDuration.currency, value: newDuration.currency }}
                                                                        onChange={(option) => handleDurationChange({ target: { name: 'currency', value: option.value } })}
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
                                                                            <Button color="success" onClick={() => { /* handleSaveDuration */ }}>
                                                                                Save
                                                                            </Button>
                                                                            <Button color="secondary" onClick={() => { /* handleCancelEdit */ }}>
                                                                                Cancel
                                                                            </Button>
                                                                        </>
                                                                    ) : (
                                                                        <Button color="" onClick={handleAddDuration} className='mt-2'>
                                                                            <FaPlus /><span className='ms-2'>Add</span>
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
                                                                    {durations.length > 0 && (
                                                                        <>
                                                                            <tr>
                                                                                <td>{durations[0].name}</td>
                                                                                <td>{durations[0].startDate.toLocaleDateString()}</td>
                                                                                <td>{durations[0].endDate.toLocaleDateString()}</td>
                                                                                <td>{durations[0].amount}</td>
                                                                                {/* <td>{durations[0].currency}</td> */}
                                                                                <td>
                                                                                    <Button size="sm" color="warning" onClick={() => { handleEditDuration(0) }}>
                                                                                        <FaEdit />
                                                                                    </Button>
                                                                                    <Button size="sm" color="danger" onClick={() => { handleDeleteDuration(0) }}>
                                                                                        <MdDelete />
                                                                                    </Button>
                                                                                </td>
                                                                            </tr>
                                                                            {showAll && durations.slice(1).map((duration, index) => (
                                                                                <tr key={index + 1}>
                                                                                    <td>{duration.name}</td>
                                                                                    <td>{duration.startDate.toLocaleDateString()}</td>
                                                                                    <td>{duration.endDate.toLocaleDateString()}</td>
                                                                                    <td>{duration.amount}</td>
                                                                                    <td>{duration.currency}</td>
                                                                                    <td>
                                                                                        <Button size="sm" color="warning" onClick={() => { handleEditDuration(index + 1) }}>
                                                                                            <FaEdit />
                                                                                        </Button>
                                                                                        <Button size="sm" color="danger" onClick={() => { handleDeleteDuration(index + 1) }}>
                                                                                            <MdDelete />
                                                                                        </Button>
                                                                                    </td>
                                                                                </tr>
                                                                            ))}
                                                                        </>
                                                                    )}
                                                                </tbody>
                                                            </Table>

                                                        </div>
                                                        {durations.length > 1 && (
                                                            <Button color="primary" onClick={toggleShowAll} className="mt-2">
                                                                {showAll ? 'See Less' : 'See List'}
                                                            </Button>
                                                        )}
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
                                                                <label><strong>Start Date</strong></label>
                                                                <DatePicker
                                                                    selected={newDuration.startDate}
                                                                    onChange={handlestartDateChange}
                                                                    className="form-control"
                                                                />
                                                            </div>
                                                            {errors.StartDate && <div className="text-danger">{errors.StartDate}</div>}
                                                        </Col>
                                                        <Col md="6" className="mb-3">
                                                            <div className="form-group">
                                                                <label><strong>End Date</strong></label>
                                                                <DatePicker
                                                                    selected={newDuration.endDate}
                                                                    onChange={handleDateChange}
                                                                    className="form-control"
                                                                />
                                                            </div>
                                                            {errors.endDate && <div className="text-danger">{errors.endDate}</div>}
                                                        </Col>
                                                    </Row>
                                                    <Row>
                                                        <Col md="6">
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

export default AddAddon;
