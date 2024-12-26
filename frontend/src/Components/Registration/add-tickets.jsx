import React, { Fragment, useEffect, useState, useCallback } from 'react';
import { Container, Row, Col, Button, Card, CardBody, CardHeader, FormFeedback, Input, FormGroup, Label, Modal, ModalBody, ModalFooter, ModalHeader, Table, Media } from 'reactstrap';
import { Form, Field } from 'react-final-form';
import { required, Name, selection } from '../Utils/validationUtils';
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
import Slider from 'rc-slider';
import 'rc-slider/assets/index.css';
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

const AddTicket = () => {
    useAuth();
    const [seatType, setSeatType] = useState('Unlimited');
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modal, setModal] = useState(false);
    const [regCat, setRegCat] = useState([]);
    const [Cattype, setCattype] = useState([]);
    const [selectedCategories, setSelectedCategories] = useState([]);
    const [isManualApproval, setIsManualApproval] = useState(false);
    const [priceType, setPriceType] = useState('Free');
    const [durations, setDurations] = useState([]);
    const [newDuration, setNewDuration] = useState({ name: '', startDate: new Date(), endDate: new Date(), amount: '', currency: 'USD' });
    const [isEditing, setIsEditing] = useState(false);
    const [editIndex, setEditIndex] = useState(null);
    const [errors, setErrors] = useState({});
    const [percentage, setPercentage] = useState(0);
    const [isVisible, setIsVisible] = useState(false);
    const [maxBuyingLimit, setMaxBuyingLimit] = useState('');
    const [selectedType, setSelectedType] = useState(''); // Se
    const [isSliderChange, setIsSliderChange] = useState(false); // Flag to track slider interaction
    const [seatCount, setSeatCount] = useState('');
    const [modalOpen, setModalOpen] = useState(false);
    const [value, setValue] = useState('');
    const navigate = useNavigate(); // Initialize useHistory


    // Handle seat type change
    const handleSeatTypeChange = (selectedOption) => {
        const value = selectedOption.value;
        setSeatType(value);

        // Clear seat count if the type is changed to Unlimited
        if (value === 'Unlimited') {
            setSeatCount(''); // Reset seat count when seat type is Unlimited
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

    const onSubmit = async (values) => {
        const selectedCategory = values.category ? values.category.map(option => option.value) : null;
        // Prepare the data to be sent
        const formData = {
            ticketTitle: values.ticketTitle,
            ticketDescription: values.ticketDescription,
            regtype: selectedType,
            ticketStatus: values.ticketStatus,
            seatType: seatType, // This will be either "Unlimited" or "Limited"
            seatCount: seatType === 'Limited' ? seatCount : null, // Include seat count if Limited is selected
            registrationCategory: selectedCategory, // Array of selected categories
            isManualApproval: isManualApproval, // Manual approval toggle value
            priceType: priceType, // "Free" or "Paid"
            durations: durations, // Array of duration objects with name, endDate, amount, currency
            isVisible: values.isvisible ? 1 : 0, // Transform checkbox value
            isPrivate: values.isprivate ? 1 : 0, // Transform checkbox value
            maxBuyingLimit: values.maxBuyingLimit, // Maximum buying limit maxBuyingLimit
            mailDescription: value,
        };

        console.log("formData", formData); // Log the prepared data



        try {
            const token = getToken(); // Retrieve the token from your auth utility

            // Make the POST request to your 'addticket' route
            const response = await axios.post(`${BackendAPI}/ticketRoutes/addticket`, formData, {
                headers: {
                    Authorization: `Bearer ${token}`, // Include the token in the Authorization header
                    'Content-Type': 'application/json', // Set the content type for JSON data
                },
            });

            // Handle the success response (e.g., show a success message or redirect)
            if (response.data.success) {
                SweetAlert.fire({
                    title: 'Success!',
                    html: `Ticket created successfully!`,
                    icon: 'success',
                    timer: 3000,
                    showConfirmButton: false,
                    allowOutsideClick: false,
                    allowEscapeKey: false
                }).then((result) => {
                    if (result.dismiss === SweetAlert.DismissReason.timer) {
                        navigate(`${process.env.PUBLIC_URL}/registration/manage-tickets/Consoft`);
                    }
                });
            }
            console.log('Form submitted successfully:', response.data);
        } catch (error) {
            // Handle any errors that occur during the API call
            console.error('Error submitting form:', error);
            // You can show an error notification or handle the error in a user-friendly way here
        }
    };

    const fetchDropdown = async () => {
        try {
            const token = getToken();
            const response = await axios.get(`${BackendAPI}/ticketRoutes/getDropdownData`, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
            setData(response.data);
            setLoading(false);

            const { regCategory: fetchregcat, regtype: fetchcatgorie } = response.data;

            setRegCat(fetchregcat);
            setCattype(fetchcatgorie);

        } catch (error) {
            console.error('Error fetching dropdown data:', error);
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDropdown();
    }, []);

    const handleCategorySelect = (e) => {
        const value = e.target.value;
        if (value && !selectedCategories.includes(value)) {
            setSelectedCategories([...selectedCategories, value]);
        }
    };

    const handleCategoryRemove = (category) => {
        setSelectedCategories(selectedCategories.filter(cat => cat !== category));
    };

    const handleTypeSelect = (e) => {
        setSelectedType(e.target.value);
    }
    const handleMaxBuyingLimitChange = (e) => {
        setMaxBuyingLimit(e.target.value);
    };

    const handlePercentageChange = (value) => {
        setPercentage(value);
        console.log("Value", value);
    };

    const handleCancel = () => {
        setModal(true);
    };

    const handleNavigation = () => {
        navigate(`${process.env.PUBLIC_URL}/registration/manage-tickets/Consoft`);
    };





    return (
        <Fragment>
            <Breadcrumbs mainTitle="Create Ticket" parent="Manage Ticket" title="Create Ticket" />
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
                                                        name="ticketTitle"
                                                        validate={composeValidators(required, Name)}
                                                    >
                                                        {({ input, meta }) => (
                                                            <div className="form-group">
                                                                <label><strong>Title</strong><span className="red-asterisk">*</span></label>
                                                                <input
                                                                    {...input}
                                                                    type="text"
                                                                    placeholder="Enter Ticket Title"
                                                                    className={`form-control ${meta.touched && meta.error ? 'error-class' : ''}`}
                                                                />
                                                                {meta.error && meta.touched && <p className='d-block text-danger'>{meta.error}</p>}
                                                            </div>
                                                        )}
                                                    </Field>
                                                </Col>
                                                <Col md="12" className="mb-3">
                                                    <Field
                                                        name="ticketDescription"
                                                        validate={required}
                                                    >
                                                        {({ input, meta }) => (
                                                            <div className="form-group">
                                                                <label><strong>Description</strong><span className="red-asterisk">*</span></label>
                                                                <textarea
                                                                    {...input}
                                                                    placeholder="Enter Ticket Description"
                                                                    className={`form-control ${meta.touched && meta.error ? 'error-class' : ''}`}
                                                                />
                                                                {meta.error && meta.touched && <p className='d-block text-danger'>{meta.error}</p>}
                                                            </div>
                                                        )}
                                                    </Field>
                                                </Col>
                                                <Col md="12" className="mb-3">
                                                    <div className="row align-items-center">
                                                        <div className="col-md-9"> {/* Limit the width of this div */}
                                                            <p className="mb-0">
                                                                <strong>Registration Approval</strong>
                                                            </p>
                                                            <small>
                                                                You can pre-screen the order request placed by the visitors and manually approve or deny them before issuing their tickets.
                                                            </small>
                                                        </div>
                                                        <Media body className="icon-state switch-sm col-md-3 text-end"> {/* Align the switch to the right */}
                                                            <Label className="switch">
                                                                <Input
                                                                    type="checkbox" // Use checkbox for switch functionality
                                                                    onChange={handleToggleChange}
                                                                    checked={isManualApproval}
                                                                />
                                                                <span className={"switch-state " + (isManualApproval ? "bg-success" : "bg-danger")}></span>
                                                            </Label>
                                                        </Media>
                                                    </div>
                                                </Col>


                                                <Col md="6" className="mb-3">
                                                    <div className="form-group">
                                                        <label><strong>Registration Type</strong></label>
                                                        <Input
                                                            type="select"
                                                            className="form-control"
                                                            onChange={handleTypeSelect}
                                                            value={selectedType}
                                                        >
                                                            <option value="">Select Type</option>
                                                            {Cattype.map((type) => (
                                                                <option key={type.reg_typeid} value={type.reg_typeid}>
                                                                    {type.cs_reg_type_name}
                                                                </option>
                                                            ))}
                                                        </Input>
                                                    </div>
                                                </Col>
                                                <Col md="6" className="mb-3">
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
                                                <Col md="12" className="mb-3">
                                                    <div className="form-group">
                                                        <label><strong>Number of Seats</strong></label>
                                                        <Select
                                                            value={{ label: seatType, value: seatType }}  // Set selected value
                                                            onChange={handleSeatTypeChange}  // Directly pass selectedOption to handleSeatTypeChange
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
                                                                        onChange={handleSeatCountChange}  // Update seat count state
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
                                                {/* <Col md="4">
                                                    <div className="form-group">
                                                        <label>Registration Category</label>
                                                        <Input
                                                            type="select"
                                                            className="form-control"
                                                            onChange={handleCategorySelect}
                                                        >
                                                            <option value="">Select Category</option>
                                                            {regCat.map((category) => (
                                                                <option key={category.cs_reg_cat_id} value={category.cs_reg_cat_id}>
                                                                    {category.cs_reg_category}
                                                                </option>
                                                            ))}
                                                        </Input>
                                                    </div>
                                                    <div className="form-group">
                                                        {/* <label>Selected Categories</label> */}
                                                {/* <div>
                                                            {selectedCategories.map((categoryId) => {
                                                                const category = regCat.find(cat => cat.cs_reg_cat_id === parseInt(categoryId, 10));
                                                                const categoryName = category ? category.cs_reg_category : '';
                                                                return (
                                                                    <Tag key={categoryId}>
                                                                        {categoryName}
                                                                        <span className="remove-tag" onClick={() => handleCategoryRemove(categoryId)}>x</span>
                                                                    </Tag>
                                                                );
                                                            })}
                                                        </div>
                                                    </div>
                                                </Col> */}

                                                <Col md="12" className="mb-3">
                                                    <Field
                                                        name={`category`} // Use dynamic field name
                                                    >
                                                        {({ input }) => (
                                                            <div>
                                                                <Label className='form-label' for="category"><strong>Category</strong></Label>
                                                                <Select
                                                                    {...input}
                                                                    options={[
                                                                        ...regCat.map(pref => ({ value: pref.cs_reg_cat_id, label: pref.cs_reg_category }))
                                                                    ]}
                                                                    // options={regCat.map(pref => ({ value: pref.cs_reg_cat_id, label: pref.cs_reg_category }))}
                                                                    placeholder={`Select Category`}
                                                                    isSearchable={true}
                                                                    onChange={(value) => {
                                                                        if (value && value.length > 0 && value[0].value === 'all') {
                                                                            const allCatNames = regCat.map(pref => pref.cs_reg_cat_id);
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

                                                <Col md="9" className="mb-3">
                                                    <Field name="maxBuyingLimit">
                                                        {({ input, meta }) => (
                                                            <div>
                                                                <label>
                                                                    <strong>Maximum Buying Limit</strong>
                                                                    <span className="red-asterisk">*</span>
                                                                </label>
                                                                <Slider
                                                                    min={0}
                                                                    max={100}
                                                                    value={percentage}
                                                                    onChange={handlePercentageChange}  // Update slider state
                                                                    marks={{ 0: '0', 50: '50', 100: '100' }}
                                                                    step={1}
                                                                    handleStyle={{ color: 'orange', borderColor: 'orange', height: 20, width: 20 }}
                                                                    trackStyle={{ backgroundColor: 'orange' }}  // Set the track color to orange
                                                                />


                                                            </div>
                                                        )}
                                                    </Field>
                                                </Col>

                                                <Col md="3" className="mb-3">
                                                    <Field name="maxBuyingLimit" validate={selection} initialValue={percentage}>
                                                        {({ input, meta }) => (
                                                            <div className="form-group">
                                                                <label>
                                                                    {/* <strong>Maximum Buying Limit</strong>
                                                                    <span className="red-asterisk">*</span> */}
                                                                </label>
                                                                <input
                                                                    {...input}
                                                                    type="number"
                                                                    min="0"
                                                                    max="100"
                                                                    value={percentage}  // Bind the same state as the slider
                                                                    onChange={(e) => {
                                                                        const value = Number(e.target.value);
                                                                        input.onChange(value);  // Update Field's input value
                                                                        handlePercentageChange(value);  // Update slider and input state
                                                                    }}
                                                                    placeholder="Enter Percentage"
                                                                    className='form-control'
                                                                />

                                                                {meta.error && meta.touched && !percentage && (
                                                                    <p className='d-block text-danger'>{meta.error}</p>
                                                                )}
                                                            </div>
                                                        )}
                                                    </Field>
                                                </Col>

                                                {/* <Col md="6" className="mb-3">
                                                    <Field
                                                        name="maxBuyingLimit"
                                                        validate={composeValidators(required)} // Use your validation function
                                                    >
                                                        {({ input, meta }) => (
                                                            <div className="form-group">
                                                                <label>Maximum Buying Limit <span className="red-asterisk">*</span></label>
                                                                <input
                                                                    {...input}
                                                                    type="number"
                                                                    placeholder="Enter Maximum Buying Limit"
                                                                    className={`form-control ${meta.touched && meta.error ? 'is-invalid' : ''}`}
                                                                />
                                                                {meta.touched && meta.error && (
                                                                    <FormFeedback>{meta.error}</FormFeedback>
                                                                )}
                                                            </div>
                                                        )}
                                                    </Field>
                                                </Col> */}






                                                {/* <Col md="4">
                                                    <div className="form-group">
                                                        <label>Maximum Buying Limit</label>
                                                        <Input
                                                            type="number"
                                                            name="maxBuyingLimit"

                                                            value={maxBuyingLimit}
                                                            onChange={handleMaxBuyingLimitChange}
                                                            placeholder="Enter Maximum Buying Limit"
                                                            validate={composeValidators(required, Name)}
                                                        />
                                                    </div>
                                                </Col> */}



                                                {/* <Col md="4">
                                                    <ApprovalContainer>
                                                        
                                                        <Switch
                                                            onChange={handleToggleChange}
                                                            checked={isManualApproval}
                                                            onColor="#86d3ff"
                                                            offColor="#cccccc"
                                                        />
                                                    </ApprovalContainer>
                                                </Col> */}


                                                {/* <Media body className="icon-state switch-sm">
                                                        <Label className="switch">
                                                            <Input type="checkbox" checked={isChecked} onChange={() => setIsChecked(!isChecked)} />
                                                            <span className={"switch-state " + (isChecked ? "bg-success" : "bg-danger")}></span>
                                                        </Label>
                                                    </Media> */}


                                                <Col md="12" className='mt-3 mb-3'>
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
                                                                            <Button color="success" onClick={handleSaveDuration}>
                                                                                Save
                                                                            </Button>
                                                                            <Button color="secondary" onClick={handleCancelEdit}>
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
                                                                            <Button size="sm" color="warning" onClick={() => { handleEditDuration(index) }}>
                                                                                <FaEdit />
                                                                            </Button>
                                                                            <Button size="sm" color="danger" onClick={() => { handleDeleteDuration(index) }}>
                                                                                <MdDelete />
                                                                            </Button>
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
                                                        <Col md="6" className="mb-3">
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
                                                        <Col md="6" className="mb-3">
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
                                            <Row>
                                                <Col md="12 mb-3">
                                                    <Label for="body"><strong>Message:</strong></Label>
                                                    <Field
                                                        name="Body"
                                                    >
                                                        {({ input }) => (
                                                            // <Input {...input} type="textarea" id="body" placeholder="Enter mail body" />
                                                            <ReactQuill theme="snow" value={value} onChange={setValue} modules={{
                                                                toolbar: [
                                                                    [{ header: '1' }, { header: '2' }, { font: [] }],
                                                                    [{ size: ['small', false, 'large', 'huge'] }],  // Remove the size options and add the below line
                                                                    ['bold', 'italic', 'underline', 'strike', 'blockquote'],
                                                                    [{ list: 'ordered' }, { list: 'bullet' }],
                                                                    [{ 'align': [] }, { 'color': [] }, { 'background': [] }],
                                                                    ['link', 'image', 'video'],
                                                                    ['clean']
                                                                ],
                                                            }} />
                                                        )}
                                                    </Field>
                                                </Col>

                                                <Col md="12" className="mb-3">
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


                                                <Col md="12">
                                                    <Field
                                                        name="isprivate"
                                                        type="checkbox"
                                                    // validate={composeValidators(required, Wname)}
                                                    >
                                                        {({ input, meta }) => (
                                                            <div >
                                                                <input
                                                                    {...input}
                                                                    id="isprivate" // Correct ID for the input
                                                                />
                                                                <Label className='form-check-label' style={{ marginLeft: '10px' }} for="isprivate"><strong>Is Private</strong></Label>
                                                                {meta.error && meta.touched && <p className='d-block text-danger'>{meta.error}</p>}
                                                            </div>
                                                        )}
                                                    </Field>
                                                </Col>
                                            </Row>
                                            {/* <Row>
                                                <Col md="12">
                                                    <Field
                                                        name="MailDescription"
                                                        validate={required}
                                                        component={({ input, meta }) => (
                                                            <QuillEditor input={input} meta={meta} />
                                                        )}
                                                    />
                                                </Col>
                                            </Row> */}
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

export default AddTicket;
