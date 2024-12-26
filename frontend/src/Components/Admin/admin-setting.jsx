import React, { Fragment, useState, useEffect, useContext } from 'react';
import { Container, Row, Col, Label, Button, Card, CardBody, CardHeader, Modal, ModalHeader, FormFeedback, ModalBody, ModalFooter, PopoverBody, UncontrolledPopover } from 'reactstrap';
import axios from 'axios';
import { BackendAPI } from '../../api';
import SweetAlert from 'sweetalert2';
import { Breadcrumbs } from '../../AbstractElements';
import { Link, useNavigate } from 'react-router-dom';
import TimezoneSelect from 'react-timezone-select';
import CustomizerContext from '../../_helper/Customizer';
import { Form, Field } from 'react-final-form';
import { required, email as validateEmail, name, expiryDate } from '../Utils/validationUtils';
import { MdDelete, MdInfoOutline } from "react-icons/md";
import { PermissionsContext } from '../../contexts/PermissionsContext';
import AppSetting from './App-setting';
import CertificateSetting from './Certificate-setting';
import useAuth from '../../Auth/protectedAuth';
import { getToken } from '../../Auth/Auth';
import debounce from 'lodash.debounce';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import { toast } from 'react-toastify';

const AdminTimezone = localStorage.getItem('AdminTimezone');

console.log("Timezone", AdminTimezone);


const AdminSetting = () => {
    useAuth();
    const [loading, setLoading] = useState(true);
    const [modal, setModal] = useState(false);
    const navigate = useNavigate();
    const { layoutURL } = useContext(CustomizerContext);
    const { permissions } = useContext(PermissionsContext);
    const [name, setName] = useState('');
    const [nameValidationMessage, setNameValidationMessage] = useState('');
    const [nameTouched, setNameTouched] = useState(false);
    const [currentName, setCurrentName] = useState(''); // Add currentName state
    const [startDate, setStartDate] = useState('');

    const currentDate = new Date();
    const minDate = currentDate.toLocaleDateString('en-GB').split('/').reverse().join('-');
    const [isProcessing, setIsProcessing] = useState(false);
    const [message, setMessage] = useState('');

    const [initialValues, setInitialValues] = useState({
        eventName: '',
        eventDays: '',
        timezone: '',
        email: '',
        mobile: '',
        from: '',
        to: '',
        cc: '',
        bcc: '',
        replyto: '',
        sms: '',
        spotregstart: '',
        regstart: '',
        eventstartdate: '',
    });

    useEffect(() => {
        fetchSetting();
    }, [permissions]);

    const DismissibleNotification = ({ message, onClose }) => {
        return (
            <div style={{
                position: 'fixed',
                bottom: '20px',
                left: '20px',
                backgroundColor: '#000',
                color: '#fff',
                padding: '15px',
                borderRadius: '5px',
                boxShadow: '0px 0px 10px rgba(0, 0, 0, 0.5)',
                zIndex: '9999'
            }}>
                <span>{message}</span>
                <button onClick={onClose} style={{ marginLeft: '10px', backgroundColor: 'transparent', border: 'none', color: '#fff', cursor: 'pointer' }}>✕</button>
            </div>
        );
    };




    // Extract AdminSettingPermissions component
    const AdminSettingPermissions = permissions['AdminSetting'];

    const fetchSetting = async () => {
        try {
            const token = getToken();
            const response = await axios.get(`${BackendAPI}/setting/getAdminSetting`, {
                headers: {
                    Authorization: `Bearer ${token}` // Include the token in the Authorization header
                }
            });
            if (response.data && response.data.setting) {
                const settings = response.data.setting;
                const eventNameSetting = settings.find(setting => setting.cs_parameter === "Event Name");
                const eventDaysSetting = settings.find(setting => setting.cs_parameter === "Event Days");
                const timezoneSetting = settings.find(setting => setting.cs_parameter === "Time Zone");
                const emailSetting = settings.find(setting => setting.cs_parameter === "AdminEmail");
                const mobileSetting = settings.find(setting => setting.cs_parameter === "mobile");
                const fromSetting = settings.find(setting => setting.cs_parameter === "From");
                const toSetting = settings.find(setting => setting.cs_parameter === "TO");
                const ccSetting = settings.find(setting => setting.cs_parameter === "CC");
                const bccSetting = settings.find(setting => setting.cs_parameter === "BCC");
                const replytoSetting = settings.find(setting => setting.cs_parameter === "Reply-To");
                const smsSetting = settings.find(setting => setting.cs_parameter === "SMS Sending");
                const spotregstartSetting = settings.find(setting => setting.cs_parameter === "Spot Registration Start");
                const adminregstartSetting = settings.find(setting => setting.cs_parameter === "Admin Reg Start Number");
                const eventstartdateSetting = settings.find(setting => setting.cs_parameter === "Event Start Date");
                setInitialValues({
                    eventName: eventNameSetting ? eventNameSetting.cs_value : '',
                    eventDays: eventDaysSetting ? eventDaysSetting.cs_value : '',
                    timezone: timezoneSetting ? timezoneSetting.cs_value : '',
                    email: emailSetting ? emailSetting.cs_value : '',
                    mobile: mobileSetting ? mobileSetting.cs_value : '',
                    from: fromSetting ? fromSetting.cs_value : '',
                    to: toSetting ? toSetting.cs_value : '',
                    cc: ccSetting ? ccSetting.cs_value : '',
                    bcc: bccSetting ? bccSetting.cs_value : '',
                    replyto: replytoSetting ? replytoSetting.cs_value : '',
                    sms: smsSetting ? smsSetting.cs_value : '',
                    regstart: adminregstartSetting ? adminregstartSetting.cs_value : '',
                    spotregstart: spotregstartSetting ? spotregstartSetting.cs_value : '',
                    eventstartdate: eventstartdateSetting ? eventstartdateSetting.cs_value : '',
                });

                // Console log eventstartdate
                console.log('eventstartdate:', eventstartdateSetting ? eventstartdateSetting.cs_value : '');

                setLoading(false);
            } else {
                console.error('Error: Invalid response format');
                setLoading(false);
            }
        } catch (error) {
            console.error('Error fetching settings:', error);
            setLoading(false);
        }
    };



    const validatename = debounce(async (value) => {
        if (value === currentName) {
            // Skip validation if the name is the same as the current name
            setNameValidationMessage('');
            return;
        }

        try {
            const token = getToken();
            const response = await axios.post(`${BackendAPI}/setting/check-admin-regno`, { regstart: value }, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            if (!response.data.available) {
                setNameValidationMessage('Registration number already exists');
            } else {
                setNameValidationMessage('');
            }
        } catch (error) {
            console.error('Error checking username availability:', error);
            setNameValidationMessage('Error checking name availability');
        }
    }, 500);


    useEffect(() => {
        if (nameTouched) {
            validatename(name);
        }
        return () => {
            validatename.cancel();
        };
    }, [name, nameTouched]);

    const handleSubmit = async (values) => {
        const formData = new FormData();
        Object.entries(values).forEach(([key, value]) => {
            formData.append(key, value);
        });

        localStorage.setItem('AdminTimezone', values.timezone);


        setIsProcessing(true);
        setMessage('The process has started and is running in the background. Once it is completed, we will notify you. In the meantime, you are free to start other processes.');


        const toastId = toast.info('Processing...', { autoClose: false });

        try {
            const token = getToken();
            const response = await axios.post(`${BackendAPI}/setting/updateAdminSettings`, formData, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            if (response.status === 200) {
                console.log('Settings updated successfully');
                toast.dismiss(toastId);
                setMessage('');
                toast.success(response.data.message);
            } else {
                console.error('Error updating settings:', response.data.message);
                toast.dismiss(toastId);
                toast.error("Setting is not updated properly please try again or contact sper admin");
            }
        } catch (error) {
            console.error('Error updating settings:', error.message);
            toast.dismiss(toastId);
            toast.error('Error processing your request. Please try again.');
        } finally {
            setIsProcessing(false);
        }
    };

    // const handleCancel = () => {
    //     const URL = '/dashboard/default/';
    //     // Pass data as state through route props
    //     navigate(`${process.env.PUBLIC_URL}${URL}${layoutURL}`);
    // };
    const handleCancel = () => {
        setModal(true);
    };

    const handleNavigation = () => {
        navigate(`${process.env.PUBLIC_URL}/onsite/dashboard/Consoft`);
    };

    return (
        <Fragment>
            <Breadcrumbs parentClickHandler={handleNavigation} mainTitle="Super Admin Setting" parent="Setting" title="Super Admin Setting" />
            <Container fluid={true}>

                <Row>
                    <Col sm="12">
                        <Card>
                            <CardHeader className="d-flex justify-content-between align-items-center flex-column flex-md-row">
                                <div className="mb-2 mb-md-0">
                                    <h5 className="mb-2 text-center">Admin Setting</h5>
                                </div>
                            </CardHeader>

                            <CardBody>
                                <Form
                                    onSubmit={handleSubmit}
                                    initialValues={initialValues}
                                    render={({ handleSubmit }) => (
                                        <form onSubmit={handleSubmit}>

                                            <Row>
                                                <Col md="4" className="mb-3">
                                                    <Field name="eventName" validate={required}>
                                                        {({ input, meta }) => (
                                                            <div>
                                                                <Label className='form-label' for="eventname"><strong>Event Name <span className="red-asterisk">*</span></strong></Label>
                                                                <MdInfoOutline
                                                                    id="namePopover"
                                                                    style={{
                                                                        cursor: 'pointer', marginLeft: '5px'
                                                                    }}
                                                                />
                                                                <UncontrolledPopover
                                                                    placement="bottom"
                                                                    target="namePopover"
                                                                    trigger="focus"
                                                                >
                                                                    <PopoverBody>
                                                                        This Event Name will be displayed in both the Onsite App and the Admin Dashboard.
                                                                    </PopoverBody>
                                                                </UncontrolledPopover>

                                                                <input
                                                                    {...input}
                                                                    className="form-control"
                                                                    id="eventname"
                                                                    type="text"
                                                                    placeholder="Enter event name"
                                                                    readOnly={AdminSettingPermissions?.validate === 0}
                                                                />
                                                                {meta.error && meta.touched && <FormFeedback className='d-block text-danger'>{meta.error}</FormFeedback>}
                                                            </div>
                                                        )}
                                                    </Field>
                                                </Col>
                                                <Col md="4" className="mb-3">
                                                    <Field name="eventDays" validate={required}>
                                                        {({ input, meta }) => (
                                                            <div>
                                                                <Label className='form-label' for="eventdays"><strong>Event Days <span className="red-asterisk">*</span></strong></Label>
                                                                <MdInfoOutline
                                                                    id="dayPopover"
                                                                    style={{
                                                                        cursor: 'pointer', marginLeft: '5px'
                                                                    }}
                                                                />
                                                                <UncontrolledPopover
                                                                    placement="bottom"
                                                                    target="dayPopover"
                                                                    trigger="focus"
                                                                >
                                                                    <PopoverBody>
                                                                        Set the event days (e.g., 3 for a 3-day event) to display in the Onsite App. <br />
                                                                        When the event duration is set to 3 days, the app will initialize to display facilities, registration types, check-in options, and other features for each of those days accordingly.
                                                                    </PopoverBody>
                                                                </UncontrolledPopover>
                                                                <input
                                                                    {...input}
                                                                    className="form-control"
                                                                    id="eventdays"
                                                                    type="number"
                                                                    placeholder="Enter event day"
                                                                    min="1"
                                                                    readOnly={AdminSettingPermissions?.validate === 0}
                                                                />
                                                                {meta.error && meta.touched && <FormFeedback className='d-block text-danger'>{meta.error}</FormFeedback>}
                                                            </div>
                                                        )}
                                                    </Field>
                                                </Col>
                                                <Col md="4" className="mb-3">
                                                    <Field name="email" validate={validateEmail}>
                                                        {({ input, meta }) => (
                                                            <div>
                                                                <Label className='form-label' for="email"><strong>Admin Email</strong></Label>
                                                                <input
                                                                    {...input}
                                                                    className="form-control"
                                                                    id="email"
                                                                    type="text"
                                                                    placeholder="Enter email"
                                                                    readOnly={AdminSettingPermissions?.validate === 0}
                                                                />
                                                                {meta.error && meta.touched && <FormFeedback className='d-block text-danger'>{meta.error}</FormFeedback>}
                                                            </div>
                                                        )}
                                                    </Field>
                                                </Col>

                                                <Col md="4" className="mb-3">
                                                    <Field name="from" validate={validateEmail}>
                                                        {({ input, meta }) => (
                                                            <div>
                                                                <Label className='form-label' for="from"><strong>From</strong></Label>
                                                                <input
                                                                    {...input}
                                                                    className="form-control"
                                                                    id="from"
                                                                    type="text"
                                                                    readOnly={AdminSettingPermissions?.validate === 0}
                                                                // placeholder="Enter From"
                                                                />
                                                                {meta.error && meta.touched && <FormFeedback className='d-block text-danger'>{meta.error}</FormFeedback>}
                                                            </div>
                                                        )}
                                                    </Field>
                                                </Col>

                                                {/* <Col md="4" className="mb-3">
                                                    <Field name="to" validate={required}>
                                                        {({ input, meta }) => (
                                                            <div>
                                                                <Label className='form-label' for="to"><strong>To</strong></Label>
                                                                <input
                                                                    {...input}
                                                                    className="form-control"
                                                                    id="to"
                                                                    type="text"
                                                                    readOnly={AdminSettingPermissions?.validate === 0}
                                                                // placeholder="Enter To"
                                                                />
                                                                {meta.error && meta.touched && <FormFeedback className='d-block text-danger'>{meta.error}</FormFeedback>}
                                                            </div>
                                                        )}
                                                    </Field>
                                                </Col> */}
                                                <Col md="4" className="mb-3">
                                                    <Field name="cc" validate={validateEmail}>
                                                        {({ input, meta }) => (
                                                            <div>
                                                                <Label className='form-label' for="cc"><strong>CC</strong></Label>
                                                                <input
                                                                    {...input}
                                                                    className="form-control"
                                                                    id="cc"
                                                                    type="text"
                                                                    readOnly={AdminSettingPermissions?.validate === 0}
                                                                // placeholder="Enter Cc"
                                                                />
                                                                {meta.error && meta.touched && <FormFeedback className='d-block text-danger'>{meta.error}</FormFeedback>}
                                                            </div>
                                                        )}
                                                    </Field>
                                                </Col>
                                                <Col md="4" className="mb-3">
                                                    <Field name="bcc" validate={validateEmail}>
                                                        {({ input, meta }) => (
                                                            <div>
                                                                <Label className='form-label' for="bcc"><strong>BCC</strong></Label>
                                                                <input
                                                                    {...input}
                                                                    className="form-control"
                                                                    id="bcc"
                                                                    type="text"
                                                                    readOnly={AdminSettingPermissions?.validate === 0}
                                                                // placeholder="Enter Bcc"
                                                                />
                                                                {meta.error && meta.touched && <FormFeedback className='d-block text-danger'>{meta.error}</FormFeedback>}
                                                            </div>
                                                        )}
                                                    </Field>
                                                </Col>
                                                <Col md="4" className="mb-3">
                                                    <Field name="replyto" validate={validateEmail}>
                                                        {({ input, meta }) => (
                                                            <div>
                                                                <Label className='form-label' for="replyto"><strong>Reply-To</strong></Label>
                                                                <input
                                                                    {...input}
                                                                    className="form-control"
                                                                    id="replyto"
                                                                    type="text"
                                                                    readOnly={AdminSettingPermissions?.validate === 0}
                                                                // placeholder="Enter Reply-To"
                                                                />
                                                                {meta.error && meta.touched && <FormFeedback className='d-block text-danger'>{meta.error}</FormFeedback>}
                                                            </div>
                                                        )}
                                                    </Field>
                                                </Col>
                                                <Col md='4 mb-3'>
                                                    <Field name="timezone" validate={required}>
                                                        {({ input, meta }) => (
                                                            <div>
                                                                <Label className='form-label' for='timezone'><strong> Timezone <span className="red-asterisk">*</span></strong></Label>
                                                                <MdInfoOutline
                                                                    id="timezonePopover"
                                                                    style={{
                                                                        cursor: 'pointer', marginLeft: '5px'
                                                                    }}
                                                                />
                                                                <UncontrolledPopover
                                                                    placement="bottom"
                                                                    target="timezonePopover"
                                                                    trigger="focus"
                                                                >
                                                                    <PopoverBody>
                                                                        Select the appropriate timezone according to the event location.
                                                                        The entire event will be based on the selected timezone.
                                                                    </PopoverBody>
                                                                </UncontrolledPopover>
                                                                <TimezoneSelect
                                                                    value={input.value}
                                                                    onChange={timezone => input.onChange(timezone.value)}
                                                                    isDisabled={AdminSettingPermissions?.validate === 0}
                                                                    classNamePrefix="react-select"
                                                                />
                                                                {meta.error && meta.touched && <FormFeedback className='d-block text-danger'>{meta.error}</FormFeedback>}
                                                            </div>
                                                        )}
                                                    </Field>
                                                </Col>

                                                {/* <Col md='4 mb-3'>
                                                    <Field name="Regstart" validate={required}>
                                                        {({ input, meta }) => (
                                                            <div>
                                                                <Label className='form-label' for='Regstart'><strong> Admin Registration start<span className="red-asterisk">*</span></strong></Label>
                                                                <TimezoneSelect
                                                                    value={input.value}
                                                                    onChange={Regstart => input.onChange(Regstart.value)}
                                                                    isDisabled={AdminSettingPermissions?.validate === 0}
                                                                />
                                                                {meta.error && meta.touched && <FormFeedback className='d-block text-danger'>{meta.error}</FormFeedback>}
                                                            </div>
                                                        )}
                                                    </Field>
                                                </Col> */}

                                                <Col md="4" className="mb-3">
                                                    <Field name="regstart" validate={required}>
                                                        {({ input, meta }) => (
                                                            <div>
                                                                <Label className='form-label' for="regstart">
                                                                    <strong>Admin Registration start <span className="red-asterisk">*</span></strong>
                                                                </Label>
                                                                <MdInfoOutline
                                                                    id="startPopover"
                                                                    style={{
                                                                        cursor: 'pointer', marginLeft: '5px'
                                                                    }}
                                                                />
                                                                <UncontrolledPopover
                                                                    placement="bottom"
                                                                    target="startPopover"
                                                                    trigger="focus"
                                                                >
                                                                    <PopoverBody>
                                                                        Set the starting number for admin registration. <br />
                                                                        This number will increase by +1 for each user registered by the admin and will also increment for imported users without a registration number. <br />
                                                                        Ensure this number is not assigned to any App User Login.
                                                                    </PopoverBody>
                                                                </UncontrolledPopover>
                                                                <input
                                                                    {...input}
                                                                    className="form-control"
                                                                    id="regstart"
                                                                    type="number"
                                                                    readOnly={AdminSettingPermissions?.validate === 0}
                                                                    onChange={(e) => {
                                                                        input.onChange(e);
                                                                        setName(e.target.value);
                                                                        setNameTouched(true);
                                                                    }}
                                                                />
                                                                {nameValidationMessage && (
                                                                    <FormFeedback className='d-block text-danger'>
                                                                        {nameValidationMessage}
                                                                    </FormFeedback>
                                                                )}

                                                                {meta.error && meta.touched && (
                                                                    <FormFeedback className='d-block text-danger'>
                                                                        {meta.error}
                                                                    </FormFeedback>
                                                                )}

                                                            </div>
                                                        )}
                                                    </Field>
                                                </Col>

                                            </Row>
                                            <Row>
                                                <Col md="4" className="mb-3">
                                                    {/* <Field name="eventstartdate" validate={required}>
                                                        {({ input, meta }) => (
                                                            <div>
                                                                <Label className='form-label' for="eventstartdate"><strong>Event Start Date</strong></Label>
                                                                <DatePicker
                                                                    selected={input.value} // Set selected date based on input value
                                                                    onChange={input.onChange} // Pass input onChange to handle changes
                                                                    className="form-control"
                                                                    id="eventstartdate"
                                                                    dateFormat="yyyy-MM-dd" // Date format
                                                                    readOnly={AdminSettingPermissions?.validate === 0}
                                                                />
                                                                {meta.error && meta.touched && <FormFeedback className='d-block text-danger'>{meta.error}</FormFeedback>}
                                                            </div>
                                                        )}
                                                    </Field> */}
                                                    <Field
                                                        name="eventstartdate"
                                                    >
                                                        {({ input, meta }) => (
                                                            <div>
                                                                <Label className='form-label' for='eventstartdate'><strong>Event Start Date <span className="red-asterisk">*</span></strong></Label>
                                                                <MdInfoOutline
                                                                    id="eventstartPopover"
                                                                    style={{
                                                                        cursor: 'pointer', marginLeft: '5px'
                                                                    }}
                                                                />
                                                                <UncontrolledPopover
                                                                    placement="bottom"
                                                                    target="eventstartPopover"
                                                                    trigger="focus"
                                                                >
                                                                    <PopoverBody>
                                                                        Select the event start date, (Ex-October 15, 2024) This date will be applied to the registration type and 
                                                                        used for organizing event days. <br />
                                                                        Suppose for a 3-day event from October 15 to October 17, 2024, the days will be: <br />

                                                                        First Day: (2024/10/15)<br />
                                                                        Second Day: (2024/10/16)<br />
                                                                        Third Day: (2024/10/17)
                                                                    </PopoverBody>
                                                                </UncontrolledPopover>
                                                                <input
                                                                    {...input}
                                                                    className="form-control"
                                                                    id="eventstartdate"
                                                                    type="date"
                                                                    placeholder="Enter Expiry Date"
                                                                    // min={minDate}
                                                                    max="9999-12-31"
                                                                />
                                                                {meta.error && meta.touched && <FormFeedback className='d-block text-danger'>{meta.error}</FormFeedback>}
                                                            </div>
                                                        )}
                                                    </Field>


                                                </Col>
                                            </Row>
                                            <div>
                                                {message && <DismissibleNotification message={message} onClose={() => setMessage('')} />}
                                                {/* Your form and other components */}
                                            </div>
                                            {AdminSettingPermissions?.validate === 1 && (
                                                <div>
                                                    <Button color='primary' type='submit' className="me-3 mt-3">Save</Button>
                                                    <Button color='warning' onClick={handleCancel} className="mt-3">Cancel</Button>
                                                </div>
                                            )}
                                        </form>
                                    )}
                                />
                            </CardBody>
                        </Card>
                        <AppSetting>

                        </AppSetting>
                    </Col>
                </Row>
                <CertificateSetting />
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
                    {/* <Link to="/manage-facility/Consoft" className="btn btn-warning">Yes</Link> */}
                    <Button color="primary" onClick={() => setModal(!modal)}>No</Button>
                </ModalFooter>
            </Modal>
        </Fragment>
    );
};

export default AdminSetting;
