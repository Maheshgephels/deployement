import React, { Fragment, useState, useEffect } from 'react';
import {
  Container, Row, Col, Button, Card, CardBody, CardHeader, FormFeedback, Label, Input, Table, Media, Modal, ModalBody, ModalFooter,
} from 'reactstrap';
import axios from 'axios';
import SweetAlert from 'sweetalert2';
import { Breadcrumbs } from '../../AbstractElements';
import { useNavigate, useLocation } from 'react-router-dom';
import { Field, Form } from 'react-final-form';
import { required, Name, selection } from '../Utils/validationUtils';
import useAuth from '../../Auth/protectedAuth';
import { getToken } from '../../Auth/Auth';
import debounce from 'lodash.debounce';
import { BackendAPI } from '../../api';
import Select from 'react-select';
import ReactQuill from 'react-quill';
import DatePicker from 'react-datepicker';
import { FaPlus, FaEdit } from 'react-icons/fa';
import { MdDelete } from "react-icons/md";
import Slider from 'rc-slider';
import 'rc-slider/assets/index.css';

const composeValidators = (...validators) => (value) =>
  validators.reduce((error, validator) => error || validator(value), undefined);

const EditTicket = () => {
  useAuth(); // Protected route logic

  const navigate = useNavigate();
  const { ticket } = useLocation().state;
  const [seatType, setSeatType] = useState(ticket.ticket_type);
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [regCat, setRegCat] = useState([]);
  const [Cattype, setCattype] = useState([]);
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [isManualApproval, setIsManualApproval] = useState(ticket.ticket_isapprove_by_admin == 0 ? false : true);
  const [priceType, setPriceType] = useState(ticket.ticket_ispaid === '1' ? 'Paid' : 'Free');
  const [durations, setDurations] = useState([]);
  const [seatCount, setSeatCount] = useState(ticket.ticket_count);
  const [value, setValue] = useState(ticket.ticket_mail_description);
  const [errors, setErrors] = useState({});
  const [percentage, setPercentage] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const [maxBuyingLimit, setMaxBuyingLimit] = useState('');
  const [selectedType, setSelectedType] = useState(ticket.reg_typeid); // S
  const [newDuration, setNewDuration] = useState({ name: '', startDate: new Date(), endDate: new Date(), amount: '', currency: 'USD' });
  const [isEditing, setIsEditing] = useState(false);
  const [editIndex, setEditIndex] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState([]);

  console.log("ticket", ticket);

  const handleNavigation = () => {
    navigate(`${process.env.PUBLIC_URL}/registration/manage-tickets/Consoft`);
  };

  const fetchDropdownData = async () => {
    try {
      const token = getToken();
      const { data } = await axios.get(`${BackendAPI}/ticketRoutes/getDropdownData`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const { regCategory, regtype } = data;
      setRegCat(regCategory);
      setCattype(regtype);
    } catch (error) {
      console.error('Error fetching dropdown data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Initialize selectedCategory based on the ticket's category if available
    if (ticket.ticket_category) {
      try {
        const parsed = JSON.parse(ticket.ticket_category); // Parse the JSON string
        if (Array.isArray(parsed)) {
          setSelectedCategory(parsed); // Set the parsed IDs
        }
      } catch (error) {
        console.error("Invalid ticket_category format:", ticket.ticket_category);
      }
    }
  }, [ticket]);

  const fetchDuration = async (ticketId) => {
    try {
      const token = getToken();
      const { data } = await axios.get(`${BackendAPI}/ticketRoutes/getDuration`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { ticketId }
      });

      const newDurations = data.map((duration) => ({
        addon_duration_id: duration.tick_duration_id,
        name: duration.tick_duration_name,
        startDate: new Date(duration.tick_duration_start_date),
        endDate: new Date(duration.tick_duration_till_date),
        amount: duration.tick_amount,
        currency: duration.tick_currency,
      }));
      setDurations((prevDurations) => [...prevDurations, ...newDurations]);
    } catch (error) {
      console.error('Error fetching duration data:', error);
    }
  };

  const onSubmit = async (values) => {

    // const selectedCategory = values.category ? values.category.map((option) => option.value) : null;
    // const selectedCategory = Array.isArray(values.category)
    // ? values.category.map((item) => (typeof item === 'object' && item.value ? item.value : item)) // Handle both ID and object formats
    // : [];

    // console.log("selectedCategory",selectedCategory);

    const formData = {
      ticketId: ticket.ticket_id,
      ticketTitle: values.ticketTitle,
      ticketDescription: values.ticketDescription,
      ticketStatus: values.ticketStatus,
      seatType,
      seatCount: seatType === 'Limited' ? seatCount : null,
      registrationCategory: selectedCategory,
      regtype: selectedType,
      isManualApproval,
      priceType,
      durations,
      isVisible: values.isVisible ? 1 : 0,
      isPrivate: values.isPrivate ? 1 : 0,
      maxBuyingLimit: values.maxBuyingLimit,
      mailDescription: value,
    };


    console.log("formData", formData); // Log the prepared data

    try {
      const token = getToken();
      const response = await axios.post(`${BackendAPI}/ticketRoutes/editticket`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.data.success) {
        SweetAlert.fire({
          title: 'Success!',
          text: 'Ticket updated successfully!',
          icon: 'success',
          timer: 3000,
          showConfirmButton: false,
          allowOutsideClick: false,
        }).then(() => {
          navigate(`${process.env.PUBLIC_URL}/registration/manage-tickets/Consoft`);
        });
      }
    } catch (error) {
      console.error('Error submitting form:', error);
    }
  };

  const handlePriceChange = (e) => {
    setPriceType(e.target.value);
  };


  useEffect(() => {
    fetchDropdownData();
    fetchDuration(ticket.ticket_id);
    setPercentage(ticket.ticket_max_limit);
  }, [ticket.ticket_id]);

  const handleTypeSelect = (e) => {
    setSelectedType(e.target.value);
  }



  const handleSeatTypeChange = (e, form) => {
    const value = e.target.value;
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

  const handleToggleChange = () => {
    setIsManualApproval(!isManualApproval);
  };

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

  //Need here isvisible and isprivate vlaue is not coming selected vakues are coming from frontend.

  const handlePercentageChange = (value) => {
    setPercentage(value);
    console.log("Value", value);
  };

  const handleCancel = () => {
    setModal(true);
  };




  return (
    <Fragment>
      <Breadcrumbs
        parentClickHandler={handleNavigation}
        mainTitle="Edit Ticket"
        parent="Manage Ticket"
        title="Edit Ticket"
      />
      <Container fluid>
        <Row className='justify-content-center'>
          <Col sm="8">
            <Card>
              <CardBody>
                <Form
                  onSubmit={onSubmit}
                  initialValues={{
                    ticketTitle: ticket.ticket_title, // Set initial values here
                    ticketDescription: ticket.ticket_description,
                    ticketStatus: ticket.ticket_status,
                    isPrivate: Boolean(ticket.ticket_isprivate),
                    isVisible: Boolean(ticket.ticket_visibility),
                    maxBuyingLimit: ticket.ticket_max_limit,
                    Body: ticket.ticket_mail_description,


                    // Add other initial values for the form
                  }}
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
                                {meta.error && meta.touched && <p className="text-danger">{meta.error}</p>}
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
                              classNamePrefix="react-select"
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
                          <Field
                            name="ticketStatus"
                            validate={required}
                            defaultValue="Open"
                          >
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
                              onChange={(selectedOption) => handleSeatTypeChange(selectedOption, form)}  // Pass selectedOption instead of e
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
                        {/* <Col md="12" className="mb-3">
                          <Field name="category">
                            {({ input }) => {
                              // Parse the ticket_category: it could be either a single number or an array of numbers
                              let selectedCategoryIds = [];

                              // Check if the category is a single number or an array
                              if (ticket.ticket_category) {
                                if (ticket.ticket_category.startsWith('[') && ticket.ticket_category.endsWith(']')) {
                                  // Handle array format [0,1]
                                  selectedCategoryIds = ticket.ticket_category
                                    .replace(/[\[\]{}]/g, '') // Remove brackets and curly braces
                                    .split(',') // Split by comma
                                    .map(Number); // Convert strings to numbers
                                } else {
                                  // Handle single value
                                  selectedCategoryIds = [Number(ticket.ticket_category)];
                                }
                              }

                              // Map selected category IDs to select option format
                              const selectedOptions = selectedCategoryIds.map(catId => {
                                const category = regCat.find(pref => pref.cs_reg_cat_id === catId);
                                return category ? { value: category.cs_reg_cat_id, label: category.cs_reg_category } : null;
                              }).filter(Boolean); // Filter out null values

                              return (
                                <div>
                                  <Label className="form-label" htmlFor="category">
                                    <strong>Category</strong>
                                  </Label>
                                  <Select
                                    {...input}
                                    options={[
                                      ...regCat.map(pref => ({ value: pref.cs_reg_cat_id, label: pref.cs_reg_category }))
                                    ]}
                                    placeholder="Select Category"
                                    isSearchable={true}
                                    isMulti={true} // Enable multi-select
                                    value={selectedOptions} // Set the value to selected category options
                                    onChange={(value) => {
                                      // If "Select All" is chosen
                                      if (value && value.length > 0 && value[0].value === 'all') {
                                        const allCategoryOptions = regCat.map(pref => ({
                                          value: pref.cs_reg_cat_id,
                                          label: pref.cs_reg_category
                                        }));
                                        input.onChange(allCategoryOptions); // Select all categories
                                      } else {
                                        // If new options are selected, merge them with existing selections
                                        const selectedValues = value.map(option => option.value);
                                        const currentValues = selectedOptions.map(option => option.value);

                                        // Combine and filter duplicates
                                        const newValues = Array.from(new Set([...currentValues, ...selectedValues]));

                                        // Map back to the format expected by the Select component
                                        const newOptions = newValues.map(val => {
                                          const category = regCat.find(pref => pref.cs_reg_cat_id === val);
                                          return category ? { value: category.cs_reg_cat_id, label: category.cs_reg_category } : null;
                                        }).filter(Boolean);

                                        input.onChange(newOptions); // Update selected options
                                      }
                                    }}
                                    onBlur={input.onBlur}
                                    classNamePrefix="react-select"
                                  />
                                </div>
                              );
                            }}
                          </Field>
                        </Col> */}
                        <Col md="12" className="mb-3">
                          <Field name="category">
                            {({ input, meta }) => {
                              // Ensure the selectedCategory is handled as an array of IDs or objects with value/label
                              const selectedOptions = selectedCategory.map((catId) => {
                                const category = regCat.find((pref) => pref.cs_reg_cat_id === catId);
                                return category ? { value: category.cs_reg_cat_id, label: category.cs_reg_category } : null;
                              }).filter(Boolean);

                              return (
                                <div>
                                  <Label className="form-label" htmlFor="category">
                                    <strong>Category</strong>
                                  </Label>
                                  <Select
                                    {...input}
                                    options={regCat.map((pref) => ({
                                      value: pref.cs_reg_cat_id,
                                      label: pref.cs_reg_category,
                                    }))}
                                    placeholder="Select Category"
                                    isSearchable={true}
                                    isMulti={true} // Enable multi-select
                                    value={selectedOptions} // Ensure the correct value is passed to Select
                                    onChange={(selected) => {
                                      // Extract IDs from the selected options and update the form state
                                      const newValues = selected.map((option) => option.value); // Ensure only IDs are passed
                                      console.log("newValues", newValues);
                                      setSelectedCategory(newValues); // Update local state with new selected IDs
                                      input.onChange(newValues); // Update form state with new IDs
                                    }}
                                    onBlur={input.onBlur}
                                    classNamePrefix="react-select"
                                  />
                                </div>
                              );
                            }}
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

                                />


                              </div>
                            )}
                          </Field>
                        </Col>

                        <Col md="3" className="mb-3">
                          <Field name="maxBuyingLimit" validate={selection}>
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




                        {/* <Col md="4">
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
                              <Input
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
                                    {/* <td>
                                      <Button color="info" onClick={() => handleEditDuration(index)}>Edit</Button>
                                      <Button color="danger" onClick={() => handleDeleteDuration(index)}>Delete</Button>
                                    </td> */}
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
                              <ReactQuill theme="snow" value={value || input.value} onChange={setValue} modules={{
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
                          <Field name="isVisible" type="checkbox">
                            {({ input, meta }) => (
                              <div>
                                <input {...input} id="isVisible" checked={input.checked || input.value} />
                                <Label className="form-check-label" style={{ marginLeft: '10px' }} for="isVisible">
                                  <strong>Is Visible</strong>
                                </Label>
                                {meta.error && meta.touched && <p className="d-block text-danger">{meta.error}</p>}
                              </div>
                            )}
                          </Field>
                        </Col>

                        <Col md="12" className="mb-2">
                          <Field name="isPrivate" type="checkbox">
                            {({ input, meta }) => (
                              <div>
                                <input {...input} id="isPrivate" checked={input.checked || input.value} />
                                <Label className="form-check-label" style={{ marginLeft: '10px' }} for="isPrivate">
                                  <strong>Is Private</strong>
                                </Label>
                                {meta.error && meta.touched && <p className="d-block text-danger">{meta.error}</p>}
                              </div>
                            )}
                          </Field>
                        </Col>
                      </Row>
                      <Button type="submit" color="primary" className="mt-5">Submit</Button>
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
