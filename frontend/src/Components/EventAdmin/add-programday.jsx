import React, { Fragment, useState, useEffect, useContext } from 'react';
import { Container, Row, Col, Button, Card, CardBody, Modal, ModalHeader, ModalBody, ModalFooter, Label, PopoverBody, UncontrolledPopover } from 'reactstrap';
import axios from 'axios';
import SweetAlert from 'sweetalert2';
import { MdDelete, MdInfoOutline } from "react-icons/md";
import { Breadcrumbs } from '../../AbstractElements';
import { useNavigate } from 'react-router-dom';
import { Field, Form } from 'react-final-form';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import useAuth from '../../Auth/protectedAuth';
import { getToken } from '../../Auth/Auth';
import { required, Notify } from '../Utils/validationUtils';
import { BackendAPI } from '../../api';
import debounce from 'lodash.debounce';
import { PermissionsContext } from '../../contexts/PermissionsContext';

// Utility function used to combine multiple validation functions into a single validation function
const composeValidators = (...validators) => value =>
    validators.reduce((error, validator) => error || validator(value), undefined);

// Utility function to format the date as yyyy-MM-dd
const formatDate = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0'); // Months are zero-indexed
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};




const AddProgramday = () => {
    useAuth();
    const [startDate, setStartDate] = useState(new Date());
    const [endDate, setEndDate] = useState(new Date());
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();
    const [modal, setModal] = useState(false);
    const [dateError, setDateError] = useState('');
    const [dateTouched, setDateTouched] = useState(false);
    const [nameTouched, setNameTouched] = useState(false);
    const [startTime, setStartTime] = useState('08:00'); // Default to 8:00 AM
    const [endTime, setEndTime] = useState('17:00');
    const [timeError, setTimeError] = useState('');
    const { permissions } = useContext(PermissionsContext);
    const [popperPlacement, setPopperPlacement] = useState('bottom-start');

    const validateTime = (time) => {
        const [hours, minutes] = time.split(':').map(Number);
        if (minutes !== 0 && minutes !== 30) {
            return 'Time must be in 30-minute intervals (e.g., 00 or 30 minutes).';
        }
        return '';
    };

    const handleStartTimeChange = (e) => {
        const newStartTime = e.target.value;
        setStartTime(newStartTime);
        const error = validateTime(newStartTime);
        if (error) {
            setTimeError(error);
        } else if (newStartTime > endTime) {
            setTimeError('Start time should be less than or equal to end time.');
        } else {
            setTimeError('');
        }
    };

    const handleEndTimeChange = (e) => {
        const newEndTime = e.target.value;
        setEndTime(newEndTime);
        const error = validateTime(newEndTime);
        if (error) {
            setTimeError(error);
        } else if (newEndTime < startTime) {
            setTimeError('End time should be greater than or equal to start time.');
        } else {
            setTimeError('');
        }
    };

    useEffect(() => {
        const updatePopperPlacement = () => {
          // Check screen width to set popperPlacement
          if (window.innerWidth >= 992) { // Typically for laptop/desktop
            setPopperPlacement('right-start');
          } else {
            setPopperPlacement('bottom-start');
          }
        };
    
        // Call function on initial render
        updatePopperPlacement();
    
        // Add event listener to handle window resizing
        window.addEventListener('resize', updatePopperPlacement);
    
        // Cleanup event listener on unmount
        return () => window.removeEventListener('resize', updatePopperPlacement);
      }, []);
    

    useEffect(() => {

        const fetchSessionData = async () => {
            try {
                const token = getToken();
                const response = await axios.get(`${BackendAPI}/Programday/get-session-date`, {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                });

                if (response.data && Array.isArray(response.data.setting)) {
                    const settings = response.data.setting;
                    const eventStartDateSetting = settings.find(setting => setting.cs_parameter === 'Event Start Date');
                    const eventEndDateSetting = settings.find(setting => setting.cs_parameter === 'event_end_date');
                    const eventStartDate = eventStartDateSetting ? eventStartDateSetting.cs_value : '';
                    const eventEndDateSettingvalue = eventEndDateSetting ? eventEndDateSetting.cs_value : '';
                    const eventStartDateFromDatabase = new Date(eventStartDate);
                    const eventEndDateFromDatabase = new Date(eventEndDateSettingvalue);
                    setStartDate(eventStartDateFromDatabase);
                    setEndDate(eventEndDateFromDatabase);
                } else {
                    console.error('Error: Invalid response format or missing data');
                }
            } catch (error) {
                console.error('Error fetching session data:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchSessionData();
    }, [permissions]);

        // Extract Programdays component
        const ManageprogramdayPermissions = permissions['Manageprogramday'];

    const checkDateAvailability = async (date) => {
        console.log("date", date);
        try {
            const token = getToken();
            const response = await axios.post(`${BackendAPI}/Programday/check-date`, null, {
                params: { date: formatDate(date) },
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
            return response.data.isAvailable; // Ensure the response structure matches
        } catch (error) {
            console.error('Error checking date availability:', error);
            return false;
        }
    };

    const handleDateChange = async (date) => {
        if (date) {
            const isAvailable = await checkDateAvailability(date);
            if (!isAvailable) {
                setDateError('The selected date is already taken. Please choose another date.');
            } else {
                setDateError('');
                // setStartDate(date);
            }
        }
    };

    const onSubmit = async (formData) => {
        if (dateError) {
            console.error('Form submission blocked due to date error');
            return;
        }

        const ProgramdayData = {
            ...formData,
            programDate: formatDate(new Date(formData.programDate)), // Store only the date part
            startTime, // Include startTime
            endTime
        };

        try {
            console.log('Form data to send:', ProgramdayData);
            const token = getToken();
            await axios.post(`${BackendAPI}/Programday/addProgramday`, ProgramdayData, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            SweetAlert.fire({
                title: 'Success!',
                text: 'Programday added successfully!',
                icon: 'success',
                timer: 3000,
                showConfirmButton: false,
                allowOutsideClick: false,
                allowEscapeKey: false,
            }).then((result) => {
                if (result.dismiss === SweetAlert.DismissReason.timer) {
                    navigate(`${process.env.PUBLIC_URL}/event/manage-program/Consoft`);
                }
            });
        } catch (error) {
            console.error('Error creating program day:', error.message);
        }
    };

    const handleCancel = () => {
        setModal(true);
    };

    const handleNavigation = () => {
        navigate(`${process.env.PUBLIC_URL}/event/manage-program/Consoft`);
    };

    return (
        <Fragment>
            <Breadcrumbs parentClickHandler={handleNavigation} mainTitle="Create Program Day" parent="Manage Programday" title="Create Programday" />
            <Container fluid={true}>
                <Row>
                    <Col sm="12">
                        <Card>
                            <CardBody>
                                <Form onSubmit={onSubmit}>
                                    {({ handleSubmit }) => (
                                        <form className='needs-validation' noValidate='' onSubmit={handleSubmit}>
                                            <Row>
                                                <Col md="4" className="mb-3">
                                                    <Field
                                                        name="dName"
                                                        validate={composeValidators(required, Notify)}
                                                    >
                                                        {({ input, meta }) => (
                                                            <div>
                                                                <Label className='form-label' for="name"><strong>Program Day Name <span className="red-asterisk">*</span></strong></Label>
                                                                <MdInfoOutline
                                                                    id="namePopover"
                                                                    style={{
                                                                        cursor: 'pointer', position: 'absolute', marginLeft: '5px'
                                                                    }}
                                                                />
                                                                <UncontrolledPopover
                                                                    placement="bottom"
                                                                    target="namePopover"
                                                                    trigger="focus"
                                                                >
                                                                    <PopoverBody>
                                                                        Enter the name for that specific event day. This name will be displayed in the Event App.
                                                                    </PopoverBody>
                                                                </UncontrolledPopover>
                                                                <input
                                                                    {...input}
                                                                    className="form-control"
                                                                    id="name"
                                                                    type="text"
                                                                    placeholder="Enter Program day name"
                                                                    onChange={(e) => {
                                                                        input.onChange(e);
                                                                        setNameTouched(true);
                                                                    }}
                                                                />
                                                                {meta.error && meta.touched && <p className='d-block text-danger'>{meta.error}</p>}
                                                            </div>
                                                        )}
                                                    </Field>
                                                </Col>
                                            </Row>
                                            <Row>
                                                <Col md="4" className="mb-3">
                                                    <Field name="programDate" validate={composeValidators(required)}>
                                                        {({ input, meta }) => (
                                                            <div>
                                                                <Label className='form-label' for="programDate">
                                                                    <strong>Program Date<span className="red-asterisk">*</span></strong>
                                                                </Label>
                                                                <MdInfoOutline
                                                                    id="datePopover"
                                                                    style={{
                                                                        cursor: 'pointer', position: 'absolute', marginLeft: '5px'
                                                                    }}
                                                                />
                                                                <UncontrolledPopover
                                                                    placement="bottom"
                                                                    target="datePopover"
                                                                    trigger="focus"
                                                                >
                                                                    <PopoverBody>
                                                                        Select the date for the event. The sessions will be created for that date.
                                                                    </PopoverBody>
                                                                </UncontrolledPopover>
                                                                <DatePicker
                                                                    {...input}
                                                                    selected={input.value ? new Date(input.value) : null}
                                                                    onChange={(date) => {
                                                                        handleDateChange(date); // Custom date validation
                                                                        input.onChange(date); // Trigger onChange of the Field component
                                                                    }}
                                                                    dateFormat="yyyy-MM-dd"
                                                                    placeholderText="Select Program Date"
                                                                    className="form-control"
                                                                    minDate={startDate}
                                                                    maxDate={endDate}
                                                                    showMonthDropdown
                                                                    showYearDropdown
                                                                    dropdownMode="select"
                                                                    popperPlacement={popperPlacement}
                                                                />
                                                                {dateError && <p className='d-block text-danger'>{dateError}</p>}
                                                                {meta.error && meta.touched && <p className='d-block text-danger'>{meta.error}</p>}
                                                            </div>
                                                        )}
                                                    </Field>
                                                </Col>
                                            </Row>
                                            <Row>
                                                <Col md="4" className="mb-3">
                                                    <Label className='form-label' for="startTime"><strong>Start Time <span className="red-asterisk">*</span></strong></Label>
                                                    <MdInfoOutline
                                                        id="startPopover"
                                                        style={{
                                                            cursor: 'pointer', position: 'absolute', marginLeft: '5px'
                                                        }}
                                                    />
                                                    <UncontrolledPopover
                                                        placement="bottom"
                                                        target="startPopover"
                                                        trigger="focus"
                                                    >
                                                        <PopoverBody>
                                                            Select the start time for the event day. Session timeline for that day will be start from here.
                                                        </PopoverBody>
                                                    </UncontrolledPopover>
                                                    <input
                                                        type="time"
                                                        id="startTime"
                                                        className="form-control"
                                                        value={startTime}
                                                        // readOnly
                                                        onChange={handleStartTimeChange}
                                                        step="1800"
                                                    />
                                                </Col>

                                                <Col md="4" className="mb-3">
                                                    <Label className='form-label' for="endTime"><strong>End Time <span className="red-asterisk">*</span></strong></Label>
                                                    <MdInfoOutline
                                                        id="endPopover"
                                                        style={{
                                                            cursor: 'pointer', position: 'absolute', marginLeft: '5px'
                                                        }}
                                                    />
                                                    <UncontrolledPopover
                                                        placement="bottom"
                                                        target="endPopover"
                                                        trigger="focus"
                                                    >
                                                        <PopoverBody>
                                                            Select the start time for the event day. Session timeline for that day will be start from here.
                                                        </PopoverBody>
                                                    </UncontrolledPopover>
                                                    <input
                                                        type="time"
                                                        id="endTime"
                                                        className="form-control"
                                                        value={endTime}
                                                        // readOnly
                                                        onChange={handleEndTimeChange}
                                                        step="1800"
                                                    />
                                                </Col>
                                                {timeError && <Col md="12"><p className='d-block text-danger'>{timeError}</p></Col>}
                                            </Row>
                                            { ManageprogramdayPermissions?.add === 1 && (
                                            <div>
                                                <Button color='primary' type='submit' className="me-2 mt-3">Add</Button>
                                                <Button color='warning' onClick={handleCancel} className="mt-3">Cancel</Button>
                                            </div>
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
                    <Button onClick={handleNavigation} color='warning'>Yes</Button>
                    <Button color="primary" onClick={() => setModal(!modal)}>No</Button>
                </ModalFooter>
            </Modal>
        </Fragment>
    );
};

export default AddProgramday;
