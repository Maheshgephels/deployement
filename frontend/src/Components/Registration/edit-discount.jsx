import React, { Fragment, useEffect, useState } from 'react';
import { Container, Row, Col, Button, Card, CardBody, CardHeader, FormFeedback, Input, FormGroup, Label, Modal, ModalBody, ModalHeader, ModalFooter, Table, Media, ListGroup, ListGroupItem } from 'reactstrap';
import { Breadcrumbs } from '../../AbstractElements';
import { Form, Field } from 'react-final-form';
import { required, Name } from '../Utils/validationUtils';
import useAuth from '../../Auth/protectedAuth';
import Select from 'react-select';
import { FaEdit, FaPlus } from 'react-icons/fa';
import { getToken } from '../../Auth/Auth';
import axios from 'axios';
import { BackendAPI } from '../../api';
import DatePicker from 'react-datepicker';
import moment from 'moment';
import SweetAlert from 'sweetalert2';
import Slider from 'rc-slider';
import 'rc-slider/assets/index.css';
import { Link, useNavigate, useLocation } from 'react-router-dom';


const composeValidators = (...validators) => value =>
    validators.reduce((error, validator) => error || validator(value), undefined);





const EditDiscount = () => {
    useAuth();
    const location = useLocation();
    const { discount } = location.state;
    const [ticktes, setticktes] = useState([]);
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [seatType, setSeatType] = useState(discount.discount_seat_type);
    const [seatCount, setSeatCount] = useState(discount.discount_count);
    const [modal, setModal] = useState(false);
    const [modalOpen, setModalOpen] = useState(false);
    const [percentage, setPercentage] = useState(0);

    const [selectedOption, setSelectedOption] = useState('manual');
    const [email, setEmail] = useState('');
    const [guestList, setGuestList] = useState([]);
    const [error, setError] = useState('');

    const [startDateTime, setStartDateTime] = useState(null);
    const [endDateTime, setEndDateTime] = useState(null);
    const navigate = useNavigate(); // Initialize useHistory
    const [invalidEmails, setInvalidEmails] = useState([]);
    const [addedEmails, setAddedEmails] = useState([]);
    const [selectedEmails, setSelectedEmails] = useState([]);

    console.log("Discount", discount);

    useEffect(() => {
        // Check if discount_emails is available and process it
        const start = discount.discount_start_datetime ? new Date(discount.discount_start_datetime) : null;
        const end = discount.discount_end_datetime ? new Date(discount.discount_end_datetime) : null;

        setStartDateTime(start);
        setEndDateTime(end);

        if (discount && discount.discount_emails) {
            // Remove the curly braces and split the emails by comma
            const parsedEmails = discount.discount_emails.replace(/[{}]/g, '').split(',').map(email => email.trim());
            setGuestList(parsedEmails);  // Update state with the list of emails
            setPercentage(discount.discount_percentage);
        }
    }, [discount]);


    const selectedTicketIds = discount.discount_ticket_ids
        ? discount.discount_ticket_ids
            .replace(/[{}]/g, '') // Remove curly braces
            .split(',') // Split by comma
            .map(Number) // Convert strings to numbers
        : [];

    // Create an array of selected options based on ticket IDs
    const selectedOptions = selectedTicketIds.map(ticketId => {
        const ticket = ticktes.find(pref => pref.ticket_id === ticketId);
        return ticket ? { value: ticket.ticket_id, label: ticket.ticket_title } : null;
    }).filter(Boolean); // Filter out any null values


    const handleEmailChange = (e) => {
        setEmail(e.target.value);
        setError(''); // Reset error on input change
    };

    const handleAddEmail = () => {
        // Simple email validation
        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailPattern.test(email)) {
            setError('Please enter a valid email address');
            return;
        }
        // Add email to guest list
        setGuestList([...guestList, email]);
        setEmail(''); // Clear input
        setAddedEmails(...addedEmails,email);
    };


    const handleDateTimeChange = (date, fieldSetter) => {
        fieldSetter(date);
    };

    // Handler to update percentage value when slider or input field changes
    const handlePercentageChange = (value) => {
        setPercentage(value);
    };



    const onSubmit = async (values) => {
        const formattedStartDateTime = startDateTime ? moment(startDateTime).format('YYYY-MM-DD HH:mm:ss') : null;
        const formattedEndDateTime = endDateTime ? moment(endDateTime).format('YYYY-MM-DD HH:mm:ss') : null;

        // Construct the formatted values object
        const formattedValues = {
            ...values,
            discountId: discount.discount_id,
            startDateTime: formattedStartDateTime,
            endDateTime: formattedEndDateTime,
            seatType: seatType,                          // This will be either "Unlimited" or "Limited" for the general seat type
            seatCount: seatType === 'Limited' ? seatCount : null, // Include se
            guestList: guestList,
        };
        console.log('Form Values:', formattedValues);

        try {
            const token = getToken(); // Retrieve the token from your auth utility

            // Make the POST request to your 'addaddon' route
            const response = await axios.post(`${BackendAPI}/discountRoutes/editdiscount`, formattedValues, {
                headers: {
                    Authorization: `Bearer ${token}`, // Include the token in the Authorization header
                    'Content-Type': 'application/json', // Set the content type for JSON data
                },
            });

            // Handle the success response (e.g., show a success message or redirect)
            if (response.data.success) {
                SweetAlert.fire({
                    title: 'Success!',
                    html: `Discount updated successfully!`,
                    icon: 'success',
                    timer: 3000,
                    showConfirmButton: false,
                    allowOutsideClick: false,
                    allowEscapeKey: false
                }).then((result) => {
                    if (result.dismiss === SweetAlert.DismissReason.timer) {
                        navigate(`${process.env.PUBLIC_URL}/registration/manage-discount/Consoft`);
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

            const { regCategory: fetchregcat, regtype: fetchcatgorie, tickets: fetchticket, workshop: fetchworkshop } = response.data;


            setticktes(fetchticket);


        } catch (error) {
            console.error('Error fetching dropdown data:', error);
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDropdown();
    }, []);


    // Handle seat type change
    const handleSeatTypeChange = (selectedOption, form) => {
        const value = selectedOption.value;  // Extract the value from react-select option
        setSeatType(value);

        // Clear seat count if the type is changed to Unlimited
        if (value === 'Unlimited') {
            setSeatCount('');
            form.change('seatCount', ''); // Clear the seatCount in form state as well
        }
    };

    const handleSeatCountChange = (e) => {
        setSeatCount(e.target.value);
    };

    const toggleModal = () => {
        setModalOpen(!modalOpen);
    };

    const handleNavigation = () => {
        navigate(`${process.env.PUBLIC_URL}/registration/manage-discount/Consoft`);
    };

    const handleCancel = () => {
        setModal(true);
    };

    const handleClose = () => {
        // Remove emails in addedEmails from guestList
        setGuestList(prevGuestList => 
            prevGuestList.filter(email => !addedEmails.includes(email))
        );
        
        // Clear addedEmails
        setAddedEmails([]);
        
        // Close the modal
        toggleModal();
    };

    const handleSave = () => {
        setAddedEmails([]); // Clear added emails
        toggleModal(); // Close modal
    };

    const handleFileUpload = (event) => {
        const file = event.target.files[0];

        // Handle file parsing logic (for CSV files)
        const reader = new FileReader();
        reader.onload = () => {
            const fileContent = reader.result;
            const lines = fileContent.split('\n');

            // Skip the first row (header row)
            const emailRows = lines.slice(1);

            const emails = emailRows.map(line => line.trim());

            const validEmails = [];
            const invalidEmailsList = [];

            emails.forEach(email => {
                const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (emailPattern.test(email)) {
                    validEmails.push(email);
                } else {
                    invalidEmailsList.push(email);
                }
            });

            // Update the states
            setGuestList(prevList => [...prevList, ...validEmails]); // Add valid emails to the guest list
            setInvalidEmails(invalidEmailsList); // Store invalid emails
            setAddedEmails(validEmails); // Newly added valid emails
        };

        // Read the file as text
        reader.readAsText(file);
    };

    const handleSampleDownload = () => {
        // Logic to download a sample file
        const sampleData = "Guest Email\nexample1@example.com\nexample2@example.com";
        const blob = new Blob([sampleData], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);

        const link = document.createElement('a');
        link.href = url;
        link.download = 'sample_guest_list.csv';
        link.click();

        URL.revokeObjectURL(url);
    };

    const handleCheckboxChange = (email) => {
        if (selectedEmails.includes(email)) {
            setSelectedEmails(selectedEmails.filter((item) => item !== email));
        } else {
            setSelectedEmails([...selectedEmails, email]);
        }
    };

    // Handle remove selected emails
    const handleRemoveSelected = () => {
        setGuestList(guestList.filter((email) => !selectedEmails.includes(email)));
        setSelectedEmails([]); // Reset selected emails
    };


    return (
        <Fragment>
            <Breadcrumbs mainTitle="Edit Discount" parent="Registration Admin" title="Edit Discount" />
            <Container fluid={true}>
                <Row className='justify-content-center'>
                    <Col sm="8">
                        <Card>
                            <CardBody>
                                <Form
                                    onSubmit={onSubmit}
                                    initialValues={{
                                        discode: discount.discount_code,
                                        discountType: discount.discount_type,
                                        percentage: percentage,
                                        maxDiscount: discount.discount_max_limit,
                                        flatAmount: discount.discount_amount,
                                        discountTarget: discount.discount_applyto == "1" ? "all" : "specific",
                                        tickets: selectedOptions,
                                        userEligibility: discount.discount_eligibility == "1" ? "all" : "specific",
                                        redemptionLevel: discount.discount_eligibility == "1" ? "entireOrder" : "individualTickets",

                                    }} // Set
                                    render={({ handleSubmit, form, values }) => (
                                        <form onSubmit={handleSubmit}>
                                            <Row>
                                                <Col md="12" className="mb-3">
                                                    <Field
                                                        name="discode"
                                                        validate={composeValidators(required, Name)}
                                                    >
                                                        {({ input, meta }) => (
                                                            <div className="form-group">
                                                                <label><strong>Discount Code</strong><span className="red-asterisk">*</span></label>
                                                                <input
                                                                    {...input}
                                                                    type="text"
                                                                    placeholder="Enter Discount Code"
                                                                    className={`form-control ${meta.touched && meta.error ? 'error-class' : ''}`}
                                                                />
                                                                {meta.error && meta.touched && <p className='d-block text-danger'>{meta.error}</p>}
                                                            </div>
                                                        )}
                                                    </Field>
                                                </Col>
                                            </Row>

                                            <Row>

                                                <Col md="12" className="mb-3">
                                                    <FormGroup>
                                                        <label><strong>Discount Type</strong><span className="red-asterisk">*</span></label>
                                                        <div>
                                                            <Field name="discountType" type="radio" value="percentage">
                                                                {({ input }) => (
                                                                    <div className="form-check form-check-inline">
                                                                        <input
                                                                            {...input}
                                                                            type="radio"
                                                                            id="percentage"
                                                                            className="form-check-input"
                                                                        />
                                                                        <label className="form-check-label" htmlFor="percentage">Percentage</label>
                                                                    </div>
                                                                )}
                                                            </Field>
                                                            <Field name="discountType" type="radio" value="flat">
                                                                {({ input }) => (
                                                                    <div className="form-check form-check-inline">
                                                                        <input
                                                                            {...input}
                                                                            type="radio"
                                                                            id="flat"
                                                                            className="form-check-input"
                                                                        />
                                                                        <label className="form-check-label" htmlFor="flat">Flat</label>
                                                                    </div>
                                                                )}
                                                            </Field>
                                                        </div>
                                                    </FormGroup>
                                                </Col>
                                            </Row>

                                            <Row>
                                                {values.discountType === 'flat' && (
                                                    <Col md="12" className="mb-3">
                                                        <Field
                                                            name="flatAmount"
                                                            validate={required}
                                                        >
                                                            {({ input, meta }) => (
                                                                <div className="form-group">
                                                                    <label><strong>Flat Discount Amount</strong><span className="red-asterisk">*</span></label>
                                                                    <input
                                                                        {...input}
                                                                        type="number"
                                                                        placeholder="Enter Amount"
                                                                        className={`form-control ${meta.touched && meta.error ? 'error-class' : ''}`}
                                                                    />
                                                                    {meta.error && meta.touched && <p className='d-block text-danger'>{meta.error}</p>}
                                                                </div>
                                                            )}
                                                        </Field>
                                                    </Col>
                                                )}

                                                {values.discountType === 'percentage' && (

                                                    <>
                                                        <Col md="12" className="mb-4">
                                                            <Field name="percentages">
                                                                {({ input, meta }) => (
                                                                    <div>
                                                                        <label>
                                                                            <strong>Discount Percentage</strong>
                                                                        </label>
                                                                        <Slider
                                                                            min={0}
                                                                            max={100}
                                                                            value={percentage}
                                                                            onChange={handlePercentageChange}
                                                                            marks={{ 0: '0%', 50: '50%', 100: '100%' }}
                                                                            step={1}
                                                                            handleStyle={{ color: 'orange', borderColor: 'orange', height: 20, width: 20 }}
                                                                            trackStyle={{ backgroundColor: 'orange' }}  // This sets the track color to orange
                                                                        />

                                                                        {meta.error && meta.touched && (
                                                                            <p className="d-block text-danger">{meta.error}</p>
                                                                        )}
                                                                    </div>
                                                                )}
                                                            </Field>
                                                        </Col>

                                                        <Col md="6" className="mb-3">
                                                            <Field name="percentage" validate={required}>
                                                                {({ input, meta }) => (
                                                                    <div className="form-group">
                                                                        <label>
                                                                            <strong>Discount Percentage</strong>
                                                                            <span className="red-asterisk">*</span>
                                                                        </label>
                                                                        <input
                                                                            {...input}
                                                                            type="number"
                                                                            min="0"
                                                                            max="100"
                                                                            placeholder="Enter Percentage"
                                                                            className={`form-control ${meta.touched && meta.error ? 'error-class' : ''}`}
                                                                            onChange={(e) => {
                                                                                const value = Number(e.target.value);
                                                                                input.onChange(value);  // Sync with Field's input handler
                                                                                handlePercentageChange(value);  // Update your state
                                                                            }}
                                                                        />
                                                                        {meta.error && meta.touched && <p className='d-block text-danger'>{meta.error}</p>}
                                                                    </div>
                                                                )}
                                                            </Field>
                                                        </Col>

                                                        {/* <Col md="6" className="mb-3">
                                                            <Field
                                                                name="percentage"
                                                                validate={required}
                                                            >
                                                                {({ input, meta }) => (
                                                                    <div className="form-group">
                                                                        <label>
                                                                            <strong>Discount Percentage</strong>
                                                                            <span className="red-asterisk">*</span>
                                                                        </label>                                                                                
                                                                        <input
                                                                            {...input}
                                                                            type="number"
                                                                            min="1"
                                                                            max="100"
                                                                            placeholder="Enter Percentage"
                                                                            className={`form-control ${meta.touched && meta.error ? 'error-class' : ''}`}
                                                                        />
                                                                        {meta.error && meta.touched && <p className='d-block text-danger'>{meta.error}</p>}
                                                                    </div>
                                                                )}
                                                            </Field>
                                                        </Col> */}




                                                        <Col md="6" className="mb-3">
                                                            <Field
                                                                name="maxDiscount"
                                                                validate={required}
                                                            >
                                                                {({ input, meta }) => (
                                                                    <div className="form-group">
                                                                        <label><strong>Maximum Discount Value</strong><span className="red-asterisk">*</span></label>
                                                                        <input
                                                                            {...input}
                                                                            type="number"
                                                                            placeholder="Enter Maximum Discount"
                                                                            className={`form-control ${meta.touched && meta.error ? 'error-class' : ''}`}
                                                                        />
                                                                        {meta.error && meta.touched && <p className='d-block text-danger'>{meta.error}</p>}
                                                                    </div>
                                                                )}
                                                            </Field>
                                                        </Col>
                                                    </>
                                                )}
                                            </Row>
                                            <Row>
                                                {/* Apply Discount To All or Specific Tickets */}
                                                <Col md="12" className="mb-3">
                                                    <FormGroup>
                                                        <label><strong>Apply Discount To</strong><span className="red-asterisk">*</span></label>
                                                        <div>
                                                            <Field name="discountTarget" type="radio" value="all">
                                                                {({ input }) => (
                                                                    <div className="form-check form-check-inline">
                                                                        <input
                                                                            {...input}
                                                                            type="radio"
                                                                            id="allTickets"
                                                                            className="form-check-input"
                                                                        />
                                                                        <label className="form-check-label" htmlFor="allTickets">All Tickets</label>
                                                                    </div>
                                                                )}
                                                            </Field>
                                                            <Field name="discountTarget" type="radio" value="specific">
                                                                {({ input }) => (
                                                                    <div className="form-check form-check-inline">
                                                                        <input
                                                                            {...input}
                                                                            type="radio"
                                                                            id="specificTickets"
                                                                            className="form-check-input"
                                                                        />
                                                                        <label className="form-check-label" htmlFor="specificTickets">Specific Tickets</label>
                                                                    </div>
                                                                )}
                                                            </Field>
                                                        </div>
                                                    </FormGroup>
                                                </Col>
                                            </Row>

                                            <Row>
                                                {/* Conditionally show the dropdown if 'Specific Tickets' is selected */}
                                                {values.discountTarget === 'specific' && (
                                                    <Col md="12" className="mb-3">
                                                        <Field name={`tickets`}>
                                                            {({ input }) => (
                                                                <div>
                                                                    <Label className='form-label' for="tickets"><strong>Tickets</strong></Label>
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
                                                                        isClearable={false}
                                                                        isMulti={true}
                                                                        value={input.value || []} // Ensure the value is controlled
                                                                    />
                                                                </div>
                                                            )}
                                                        </Field>
                                                    </Col>
                                                )}
                                            </Row>

                                            <Row>
                                                {/* Discount Eligibility Radio Buttons */}
                                                <Col md="12" className="mb-3">
                                                    <FormGroup>
                                                        <label><strong>User Eligibility</strong><span className="red-asterisk">*</span></label>
                                                        <div>
                                                            <Field name="userEligibility" type="radio" value="all">
                                                                {({ input }) => (
                                                                    <div className="form-check form-check-inline">
                                                                        <input
                                                                            {...input}
                                                                            type="radio"
                                                                            id="allUsers"
                                                                            className="form-check-input"
                                                                        />
                                                                        <label className="form-check-label" htmlFor="allUsers">All Users</label>
                                                                    </div>
                                                                )}
                                                            </Field>
                                                            <Field name="userEligibility" type="radio" value="specific">
                                                                {({ input }) => (
                                                                    <div className="form-check form-check-inline">
                                                                        <input
                                                                            {...input}
                                                                            type="radio"
                                                                            id="specificUsers"
                                                                            className="form-check-input"
                                                                        />
                                                                        <label className="form-check-label" htmlFor="specificUsers">Specific Users</label>
                                                                    </div>
                                                                )}
                                                            </Field>
                                                        </div>
                                                    </FormGroup>
                                                </Col>
                                            </Row>

                                            <Row>
                                                {/* Redemption Level Radio Buttons */}
                                                <Col md="12" className="mb-3">
                                                    <FormGroup>
                                                        <label><strong>Set Redemption Level</strong><span className="red-asterisk">*</span></label>
                                                        <div>
                                                            <Field name="redemptionLevel" type="radio" value="entireOrder">
                                                                {({ input }) => (
                                                                    <div className="form-check form-check-inline">
                                                                        <input
                                                                            {...input}
                                                                            type="radio"
                                                                            id="entireOrder"
                                                                            className="form-check-input"
                                                                        />
                                                                        <label className="form-check-label" htmlFor="entireOrder">Entire Order</label>
                                                                    </div>
                                                                )}
                                                            </Field>
                                                            <Field name="redemptionLevel" type="radio" value="individualTickets">
                                                                {({ input }) => (
                                                                    <div className="form-check form-check-inline">
                                                                        <input
                                                                            {...input}
                                                                            type="radio"
                                                                            id="individualTickets"
                                                                            className="form-check-input"
                                                                        />
                                                                        <label className="form-check-label" htmlFor="individualTickets">Individual Tickets</label>
                                                                    </div>
                                                                )}
                                                            </Field>
                                                        </div>
                                                    </FormGroup>
                                                </Col>
                                            </Row>

                                            <Row>
                                                <Col md="12" className="mb-3">
                                                    {/* <div className="form-group">
                                                        <label>Number of Seats</label>
                                                        <Input
                                                            type="select"
                                                            value={seatType}
                                                            onChange={(e) => handleSeatTypeChange(e, form)}
                                                            className="form-control"
                                                        >
                                                            <option value="Unlimited">Unlimited</option>
                                                            <option value="Limited">Limited</option>
                                                        </Input>
                                                    </div> */}
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
                                            </Row>

                                            <Row>
                                                {/* Conditionally show 'Add Guest' button if 'Specific Users' is selected */}
                                                {values.userEligibility === 'specific' && (
                                                    <Col md="12" className="mb-3">
                                                        <div>
                                                            <Button
                                                                color=""
                                                                onClick={toggleModal}
                                                            >
                                                                <FaPlus /><span className='ms-2'>Add Guest</span>
                                                            </Button>
                                                        </div>
                                                        {guestList.length > 0 && (
                                                            <div className="text-muted">
                                                                <strong>{guestList.length}  </strong>
                                                                {guestList.length === 1 ? ' Guest' : ' Guests'} Added
                                                            </div>
                                                        )}
                                                    </Col>
                                                )}
                                            </Row>

                                            <Row>
                                                {/* Discount Start Date and Time */}
                                                <Col md="6">
                                                    <FormGroup>
                                                        <label for="startDateTime"><strong>Discount Start Date and Time</strong><span className="red-asterisk">*</span></label>
                                                        <DatePicker
                                                            selected={startDateTime}
                                                            onChange={(date) => handleDateTimeChange(date, setStartDateTime)}
                                                            showTimeSelect
                                                            timeFormat="HH:mm"
                                                            timeIntervals={15}
                                                            dateFormat="yyyy-MM-dd HH:mm"
                                                            timeCaption="Time"
                                                            className="form-control"
                                                            placeholderText="Select Start Date and Time"
                                                        />
                                                    </FormGroup>
                                                </Col>

                                                {/* Discount End Date and Time */}
                                                <Col md="6">
                                                    <FormGroup>
                                                        <label for="endDateTime">
                                                            <strong>Discount End Date and Time</strong><span className="red-asterisk">*</span>
                                                        </label>
                                                        <DatePicker
                                                            selected={endDateTime}
                                                            onChange={(date) => handleDateTimeChange(date, setEndDateTime)}
                                                            showTimeSelect
                                                            timeFormat="HH:mm"
                                                            timeIntervals={15}
                                                            dateFormat="yyyy-MM-dd HH:mm"
                                                            timeCaption="Time"
                                                            className="form-control"
                                                            placeholderText="Select End Date and Time"
                                                        />
                                                    </FormGroup>
                                                </Col>
                                            </Row>


                                            <div className="d-flex justify-content-end mt-3">
                                                <Button color='warning' onClick={handleCancel} className="ms-3">Cancel</Button>
                                                <Button type="submit" color="primary" className='ms-3'>Save</Button>
                                            </div>


                                            <Modal isOpen={modalOpen} toggle={handleClose}>
                                            <ModalHeader toggle={handleClose}>Add Guest</ModalHeader>
                                                <ModalBody>
                                                    <FormGroup>
                                                        <label><strong>Guest Type</strong></label>
                                                        <div>
                                                            <Label>
                                                                <Input
                                                                    type="radio"
                                                                    value="manual"
                                                                    checked={selectedOption === 'manual'}
                                                                    onChange={() => setSelectedOption('manual')}
                                                                />
                                                                <span className='ms-2'>Manually Enter Email</span>
                                                            </Label>
                                                            <Label className='ms-3'>
                                                                <Input
                                                                    type="radio"
                                                                    value="list"
                                                                    checked={selectedOption === 'list'}
                                                                    onChange={() => setSelectedOption('list')}
                                                                />
                                                                <span className='ms-2'>Import Guest List</span>
                                                            </Label>
                                                        </div>
                                                    </FormGroup>

                                                    {selectedOption === 'manual' && (
                                                        <FormGroup>
                                                            <Label for="emailInput"><strong>Email</strong></Label>
                                                            <Input
                                                                type="email"
                                                                id="emailInput"
                                                                value={email}
                                                                onChange={handleEmailChange}
                                                                placeholder="Enter guest email"
                                                            />
                                                            {error && <div className="text-danger">{error}</div>}
                                                            <Button color="" onClick={handleAddEmail} className="mt-2">
                                                                <FaPlus /><span className='ms-2'>Add Email</span>
                                                            </Button>
                                                        </FormGroup>
                                                    )}

                                                    {selectedOption === 'list' && (
                                                        <div className="mt-4 text-center">
                                                            <h5>Import Guest List</h5>
                                                            <p>
                                                                Upload a file with guest email addresses to import your guest list quickly.
                                                            </p>

                                                            {/* Import File Button */}
                                                            <div className="d-flex justify-content-center mt-md-0">
                                                                <Input
                                                                    type="file"
                                                                    accept=".csv"
                                                                    onChange={handleFileUpload} // Pass the event directly
                                                                    style={{ display: 'none' }}
                                                                    id="fileInput"
                                                                />
                                                                <label htmlFor="fileInput" className="btn btn-primary">
                                                                    Import File
                                                                </label>
                                                            </div>

                                                            {/* Download Sample File (as text, not button) */}
                                                            <div className="mt-3">
                                                                <span
                                                                    style={{ cursor: 'pointer', color: '#007bff' }}
                                                                    onClick={handleSampleDownload}
                                                                >
                                                                    Download Sample File
                                                                </span>
                                                            </div>
                                                            {/* {addedEmails.length > 0 && (
                <div className="mt-4">
                    <h6>Newly Added Emails:</h6>
                    <ul>
                        {addedEmails.map((email, index) => (
                            <li key={index}>{email}</li>
                        ))}
                    </ul>
                </div>
            )} */}

                                                            {/* Display invalid emails */}
                                                            {invalidEmails.length > 0 && (
                                                                <div className="mt-4">
                                                                    <h6>Invalid Emails:</h6>
                                                                    <ul>
                                                                        {invalidEmails.map((email, index) => (
                                                                            <li key={index} className="text-danger">
                                                                                {email}
                                                                            </li>
                                                                        ))}
                                                                    </ul>
                                                                </div>
                                                            )}
                                                        </div>


                                                    )}

                                                    {/* {guestList.length > 0 && (
                            <ListGroup>
                                <h6>Guest List:</h6>
                                {guestList.map((guestEmail, index) => (
                                    <ListGroupItem key={index}>{guestEmail}</ListGroupItem>
                                ))}
                            </ListGroup>
                        )} */}

                                                    {guestList.length > 0 && (
                                                        <div>
                                                            <h6>Guest List:</h6>
                                                            <Table striped bordered hover responsive>
                                                                <thead>
                                                                    <tr>
                                                                        <th></th>
                                                                        <th>Email Address</th>
                                                                    </tr>
                                                                </thead>
                                                                <tbody>
                                                                    {guestList.map((guestEmail, index) => (
                                                                        <tr key={index}>
                                                                            <td>
                                                                                <input
                                                                                    type="checkbox"
                                                                                    checked={selectedEmails.includes(guestEmail)}
                                                                                    onChange={() => handleCheckboxChange(guestEmail)}
                                                                                />
                                                                            </td>
                                                                            <td>{guestEmail}</td>
                                                                        </tr>
                                                                    ))}
                                                                </tbody>
                                                            </Table>

                                                            {/* Remove button */}
                                                            <div className="mt-3">
                                                                <Button
                                                                    color="danger"
                                                                    disabled={selectedEmails.length === 0}
                                                                    onClick={handleRemoveSelected}
                                                                >
                                                                    Remove Selected
                                                                </Button>
                                                            </div>
                                                        </div>
                                                    )}
                                                </ModalBody>
                                                <ModalFooter>
                                                <Button color="primary" onClick={handleSave}>
        Save
    </Button>
    <Button color="warning" onClick={handleClose}>
        Close
    </Button>
                                                </ModalFooter>
                                            </Modal>


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

export default EditDiscount;