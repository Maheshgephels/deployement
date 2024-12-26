import React, { Fragment, useEffect, useState, useContext } from 'react';
import { useLocation } from 'react-router-dom';
import { Container, Row, Col, Card, Label, Button, CardBody } from 'reactstrap';
import axios from 'axios';
import { BackendAPI } from '../../api';
import { Field, Form } from 'react-final-form';
import { required, Notify } from '../Utils/validationUtils';
import CustomizerContext from '../../_helper/Customizer';
import { Link, useNavigate } from 'react-router-dom';
import { Breadcrumbs } from '../../AbstractElements';
import SweetAlert from 'sweetalert2';
import useAuth from '../../Auth/protectedAuth';
import { getToken } from '../../Auth/Auth';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { PermissionsContext } from '../../contexts/PermissionsContext';

const composeValidators = (...validators) => value =>
    validators.reduce((error, validator) => error || validator(value), undefined);

const EditProgramDay = () => {
    useAuth();
    const [programDay, setProgramDay] = useState({});
    const { layoutURL } = useContext(CustomizerContext);
    const [modal, setModal] = useState(false);
    const location = useLocation();
    const { catName } = location.state;
    const { ProgramdayId, Programdayname } = location.state;
    const navigate = useNavigate();
    const [startDate, setStartDate] = useState(new Date());
    const [endDate, setEndDate] = useState(new Date());
    const [loading, setLoading] = useState(true);
    const [dateError, setDateError] = useState('');
    const [dateTouched, setDateTouched] = useState(false);
    const [selectedDate, setSelectedDate] = useState(new Date()); // Renamed from Date to selectedDate
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

    useEffect(() => {
        fetchProgramDay(); // Fetch Programday data when component mounts
    }, []);

    const fetchProgramDay = async () => {
        try {
            const token = getToken();
            const response = await axios.post(`${BackendAPI}/Programday/editProgramday`, { ProgramdayId }, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
            const programData = response.data[0];
            console.log('Data from API:', programData);
            setProgramDay(programData);
            setSelectedDate(programData.to_date); // Update to use selectedDate
            setStartTime(programData.start_time);
            setEndTime(programData.end_time);

        } catch (error) {
            console.error('Error fetching Programday data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCancel = () => {
        setModal(true);
    };

    const handleNavigation = () => {
        navigate(`${process.env.PUBLIC_URL}/event/manage-programday/Consoft`);
    };

    const formatDate = (date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0'); // Months are zero-indexed
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };


    const onSubmit = async (values) => {
        if (dateError) {
            return; // Prevent form submission if there is a validation error
        }
        try {
            const token = getToken();

            // Format the dates
            const formattedToDate = formatDate(new Date(values.to_date));

            // Prepare the payload with formatted dates
            const payload = {
                ...values,
                to_date: formattedToDate,
                ProgramdayId,
                startTime,
                endTime
            };

            const response = await axios.post(`${BackendAPI}/Programday/updateProgramday`, payload, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            if (response.status === 200) {
                console.log('Programday updated successfully');
            } else {
                console.error('Error updating Programday:', response.data.message);
            }

            SweetAlert.fire({
                title: 'Success!',
                text: 'Changes Updated successfully!',
                icon: 'success',
                timer: 3000,
                showConfirmButton: false,
                allowOutsideClick: false,
                allowEscapeKey: false
            }).then((result) => {
                if (result.dismiss === SweetAlert.DismissReason.timer) {
                    navigate(`${process.env.PUBLIC_URL}/event/manage-program/${layoutURL}`);
                }
            });
        } catch (error) {
            console.error('Error updating settings:', error.message);
        }
    };

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
        console.log("selectedDate", selectedDate);
        const currentdate = formatDate(date);
        if (currentdate === selectedDate) {
            // Skip validation if the date is the same as the current date
            setDateError('');
            return;
        }
        if (date) {
            const isAvailable = await checkDateAvailability(date);
            if (!isAvailable) {
                console.log("available")
                setDateError('The selected date is already taken. Please choose another date.');
            } else {
                console.log("not available")
                setDateError('');
                // setStartDate(date);
            }
        }
    };


    return (
        <Fragment>
            <Breadcrumbs parentClickHandler={handleNavigation} mainTitle="Edit Program Day" parent="Manage Programday" title="Edit Program Day" />
            <Container fluid={true}>
                <Row>
                    <Col sm="12">
                        <Card>
                            <CardBody>
                                <Form onSubmit={onSubmit} initialValues={programDay}>
                                    {({ handleSubmit }) => (
                                        <form className='needs-validation' noValidate='' onSubmit={handleSubmit}>
                                            <Row>
                                                <Col md="4" className="mb-3">
                                                    <Field
                                                        name="prog_name"
                                                        validate={composeValidators(required, Notify)}
                                                    >
                                                        {({ input, meta }) => (
                                                            <div>
                                                                <Label className='form-label' for="prog_name"><strong>Program Day Name <span className="red-asterisk">*</span></strong></Label>
                                                                <input
                                                                    {...input}
                                                                    className="form-control"
                                                                    id="prog_name"
                                                                    type="text"
                                                                    placeholder="Enter Program Name"
                                                                />
                                                                {meta.error && meta.touched && <p className='d-block text-danger'>{meta.error}</p>}
                                                            </div>
                                                        )}
                                                    </Field>
                                                </Col>
                                            </Row>
                                            <Row>
                                                <Col md="4" className="mb-3">
                                                    <Field name="to_date" validate={composeValidators(required)}>
                                                        {({ input, meta }) => (
                                                            <div>
                                                                <Label className='form-label' for="to_date"><strong>Program Date <span className="red-asterisk">*</span></strong></Label>
                                                                <DatePicker
                                                                    {...input}
                                                                    selected={input.value ? new Date(input.value) : null}
                                                                    onChange={(date) => {
                                                                        handleDateChange(date); // Custom date validation
                                                                        input.onChange(date); // Trigger onChange of the Field component
                                                                    }}
                                                                    dateFormat="yyyy-MM-dd"
                                                                    placeholderText="Select To Date"
                                                                    className="form-control"
                                                                    minDate={startDate}
                                                                    maxDate={endDate}
                                                                    showMonthDropdown
                                                                    showYearDropdown
                                                                    dropdownMode="select"
                                                                    popperPlacement={popperPlacement}
                                                                />
                                                                {meta.error && meta.touched && <p className='d-block text-danger'>{meta.error}</p>}
                                                            </div>
                                                        )}
                                                    </Field>
                                                    {dateError && <p className='d-block text-danger'>{dateError}</p>}
                                                </Col>
                                            </Row>
                                            <Row>
                                                <Col md="4" className="mb-3">
                                                    <Label className='form-label' for="start_time"><strong>Start Time <span className="red-asterisk">*</span></strong></Label>
                                                    <input
                                                        className="form-control"
                                                        id="start_time"
                                                        type="time"
                                                        value={startTime}
                                                        onChange={handleStartTimeChange}
                                                    />
                                                </Col>
                                                <Col md="4" className="mb-3">
                                                    <Label className='form-label' for="end_time"><strong>End Time <span className="red-asterisk">*</span></strong></Label>
                                                    <input
                                                        className="form-control"
                                                        id="end_time"
                                                        type="time"
                                                        value={endTime}
                                                        onChange={handleEndTimeChange}
                                                    />
                                                </Col>

                                                {timeError && <Col md="12"><p className='d-block text-danger'>{timeError}</p></Col>}
                                            </Row>
                                            { ManageprogramdayPermissions?.edit === 1 && (
                                            <Row>
                                                <Col md="12" className="mb-3">
                                                    <Button color="primary" type="submit">
                                                        Update
                                                    </Button>
                                                    <Button color="warning" onClick={handleCancel} style={{ marginLeft: '10px' }}>
                                                        Cancel
                                                    </Button>
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
        </Fragment>
    );
};

export default EditProgramDay;
