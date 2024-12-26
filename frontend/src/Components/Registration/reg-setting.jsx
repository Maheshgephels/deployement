import React, { Fragment, useState, useEffect, useContext, useRef } from 'react';
import { Container, Row, Col, Label, Input, Button, Card, CardBody, CardHeader, Modal, ModalHeader, FormFeedback, ModalBody, ModalFooter, Popover, PopoverHeader, PopoverBody, UncontrolledPopover } from 'reactstrap';
import axios from 'axios';
import { BackendAPI, BackendPath } from '../../api/index';
import SweetAlert from 'sweetalert2';
import { Breadcrumbs } from '../../AbstractElements';
import { MdDelete, MdInfoOutline } from "react-icons/md";
import { Link, useNavigate } from 'react-router-dom';
import TimezoneSelect from 'react-timezone-select';
import CustomizerContext from '../../_helper/Customizer';
import { Form, Field } from 'react-final-form';
import { required, email as validateEmail, name, expiryDate, BanImg, BackImg, Img1, ReceiptHeaderFooter } from '../Utils/validationUtils';
import { PermissionsContext } from '../../contexts/PermissionsContext';
import useAuth from '../../Auth/protectedAuth';
import { getToken } from '../../Auth/Auth';
import debounce from 'lodash.debounce';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import { toast } from 'react-toastify';
import styled from 'styled-components';


const RedAsterisk = styled.span`
  color: red;
`;

const AdminTimezone = localStorage.getItem('AdminTimezone');

console.log("Timezone", AdminTimezone);

const RegAdminSetting = () => {
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
    const [eventName, setEventName] = useState('');
    const [eventDays, setEventDays] = useState('');
    const [tokenExpiryTime, setTokenExpiryTime] = useState('');
    const [timezone, setTimezone] = useState('');
    const [files, setFiles] = useState({ logoimage: '' });
    const [imageError, setImageError] = useState('');
    const [selectedImage, setSelectedImage] = useState(null);
    const [logoimage, setlogoimage] = useState('');
    const [backgroundimg, setbackgroundimg] = useState('');
    const [imageErrorforbanner, setImageErrorforbanner] = useState('');
    const [filesforbanner, setFilesforbanner] = useState({ backgroundimg: '' });
    const [selectedImageforbanner, setSelectedImageforbanner] = useState(null);

    const [imageOpen, setImageOpen] = useState(false);
    const [iconOpen, setIconOpen] = useState(false);
    const [iconPreviewUrl, setIconPreviewUrl] = useState(null);
    const [imagePreviewUrl, setImagePreviewUrl] = useState(null);
    const iconAvailableRef = useRef(null);
    // const [startDate, setStartDate] = useState('');



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
        eventvenue: '',
        eventenddate: '',

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

    const handleImageChange = async (event, type) => {
        const file = event.target.files[0];
        if (file) {
            setFiles(prevFiles => ({ ...prevFiles, [type]: file }));
            setSelectedImage(file); // Update selectedImage state
            const url = URL.createObjectURL(file);
            setIconPreviewUrl(url);
        }
        try {
            await ReceiptHeaderFooter(file); // Wait for the Promise to resolve
            setImageError('');
        } catch (error) {
            setSelectedImage(null);
            setImageError(error);
        }
    };


    const handleImageChangeforbanner = async (event, type) => {
        const file = event.target.files[0];
        if (file) {
            setFiles(prevFiles => ({ ...prevFiles, [type]: file }));
            setSelectedImageforbanner(file); // Update selectedImage state
            const url = URL.createObjectURL(file);
            setImagePreviewUrl(url);
        }
        try {
            await ReceiptHeaderFooter(file); // Wait for the Promise to resolve
            setImageErrorforbanner('');
        } catch (error) {
            setSelectedImageforbanner(null);
            setImageErrorforbanner(error);
        }
    };





    // Extract AdminSettingPermissions component
    const AdminSettingPermissions = permissions['RegAdminSetting'];

    const fetchSetting = async () => {
        try {
            const token = getToken();
            const response = await axios.get(`${BackendAPI}/regsetting/getAdminSetting`, {
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
                const eventenddateSetting = settings.find(setting => setting.cs_parameter === "event_end_date");
                const eventVenue = settings.find(setting => setting.cs_parameter === "event_venue");
                const eventMode = settings.find(setting => setting.cs_parameter === "dynamiclogin_id");
                const eventtime = settings.find(setting => setting.cs_parameter === "event_time");
                const eventiconsetting = settings.find(setting => setting.cs_parameter === "payment_receipt_head");
                const eventbackgroundsetting = settings.find(setting => setting.cs_parameter === "payment_receipt_foot");

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
                    eventenddate: eventenddateSetting ? eventenddateSetting.cs_value : '',
                    eventvenue: eventVenue ? eventVenue.cs_value : '',
                    eventMode: eventMode ? eventMode.cs_value : '',
                    eventtime: eventtime ? eventtime.cs_value : '',
                });

            

                setlogoimage(eventiconsetting ? eventiconsetting.cs_value : '');
                setbackgroundimg(eventbackgroundsetting ? eventbackgroundsetting.cs_value : '');

                // Console log eventstartdate
                console.log('eventstartdate:', eventMode ? eventMode.cs_value : '');

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
            const response = await axios.post(`${BackendAPI}/regsetting/check-admin-regno`, { regstart: value }, {
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

        console.log("FOrm", values);


        localStorage.setItem('AdminTimezone', values.timezone);

        formData.append('logoimage', files.logoimage);
        formData.append('backgroundimg', files.backgroundimg);

        setIsProcessing(true);
        // setMessage('The process has started and is running in the background. Once it is completed, we will notify you. In the meantime, you are free to start other processes.');

        const toastId = toast.info('Processing...', { autoClose: false });

        try {
            const token = getToken();
            const response = await axios.post(`${BackendAPI}/regsetting/updateAdminSettings`, formData, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            if (response.status === 200) {
                console.log('Settings updated successfully');
                toast.dismiss(toastId);
                toast.success(response.data.message);
                navigate(`${process.env.PUBLIC_URL}/event/dashboard/Consoft`);
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
        navigate(`${process.env.PUBLIC_URL}/registration/dashboard/Consoft`);
    };

    const handleNavigation = () => {
        navigate(`${process.env.PUBLIC_URL}/registration/dashboard/Consoft`);
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
                                                    <Field name="eventvenue" validate={required}>
                                                        {({ input, meta }) => (
                                                            <div>
                                                                <Label className='form-label' for="eventvenue"><strong>Event Venue <span className="red-asterisk">*</span></strong></Label>
                                                                <input
                                                                    {...input}
                                                                    className="form-control"
                                                                    id="eventvenue"
                                                                    type="text"
                                                                    placeholder="Enter event venue"
                                                                    readOnly={AdminSettingPermissions?.validate === 0}
                                                                />
                                                                {meta.error && meta.touched && <FormFeedback className='d-block text-danger'>{meta.error}</FormFeedback>}
                                                            </div>
                                                        )}
                                                    </Field>
                                                </Col>

                                                <Col md="4" className="mb-3">
                                                    <Field name="eventMode" validate={required}>
                                                        {({ input, meta }) => (
                                                            <div>
                                                                <Label className='form-label' for="eventMode"><strong>Event App Mode <span className="red-asterisk">*</span></strong></Label>
                                                                <MdInfoOutline
                                                                    id="modePopover"
                                                                    style={{
                                                                        cursor: 'pointer', position: 'absolute', marginLeft: '5px'
                                                                    }}
                                                                />
                                                                <UncontrolledPopover
                                                                    placement="bottom"
                                                                    target="modePopover"
                                                                    trigger="focus"
                                                                >
                                                                    <PopoverBody>
                                                                        Select the correct type of event mode. App access will be set based on your selection: <br />

                                                                        <strong>Public:</strong> Anyone can view the event in the event app. No restrictions. <br />
                                                                        <strong>Hybrid:</strong> Some pages which you choose to show guest are open to everyone, and other pages are only for logged in
                                                                        users in the event app. You can set the access while creating the page. <br />
                                                                        <strong>Private:</strong> Only after login  users can access the event in the event app.
                                                                    </PopoverBody>
                                                                </UncontrolledPopover>
                                                                <select
                                                                    {...input}
                                                                    className="form-control"
                                                                    id="eventMode"
                                                                    disabled={AdminSettingPermissions?.validate === 0}
                                                                >
                                                                    <option value="">Select event mode</option>
                                                                    <option value="1">Public</option>
                                                                    <option value="2">Hybrid</option>
                                                                    <option value="3">Private</option>
                                                                </select>
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
                                                                <Label className='form-label' for='timezone'><strong>Timezone <span className="red-asterisk">*</span></strong></Label>
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
                                                                    onChange={(timezone) => {
                                                                        input.onChange(timezone.value);
                                                                    }} isDisabled={AdminSettingPermissions?.validate === 0}
                                                                    classNamePrefix="react-select"
                                                                />
                                                                {meta.error && meta.touched && <FormFeedback className='d-block text-danger'>{meta.error}</FormFeedback>}
                                                            </div>
                                                        )}
                                                    </Field>
                                                </Col>

                                                {/* 
                                                <Col md="4" className="mb-3">

                                                    <Field
                                                        name="eventstartdate"
                                                    >
                                                        {({ input, meta }) => (
                                                            <div>
                                                                <Label className='form-label' for='eventstartdate'><strong>Event Start Date <span className="red-asterisk">*</span></strong></Label>
                                                                <input
                                                                    {...input}
                                                                    className="form-control"
                                                                    id="eventstartdate"
                                                                    type="date"
                                                                    placeholder="Enter Expiry Date"
                                                                    min={minDate}
                                                                    max="9999-12-31"
                                                                />
                                                                {meta.error && meta.touched && <FormFeedback className='d-block text-danger'>{meta.error}</FormFeedback>}
                                                            </div>
                                                        )}
                                                    </Field>


                                                </Col>

                                                <Col md="4" className="mb-3">

                                                    <Field
                                                        name="eventenddate"
                                                    >
                                                        {({ input, meta }) => (
                                                            <div>
                                                                <Label className='form-label' for='eventenddate'><strong>Event End Date <span className="red-asterisk">*</span></strong></Label>
                                                                <input
                                                                    {...input}
                                                                    className="form-control"
                                                                    id="eventenddate"
                                                                    type="date"
                                                                    placeholder="Enter End Date"
                                                                    min={minDate}
                                                                    max="9999-12-31"
                                                                />
                                                                {meta.error && meta.touched && <FormFeedback className='d-block text-danger'>{meta.error}</FormFeedback>}
                                                            </div>
                                                        )}
                                                    </Field>


                                                </Col> */}


                                                <Col md="4" className="mb-3">
                                                    <Field name="eventstartdate">
                                                        {({ input, meta }) => (
                                                            <div>
                                                                <Label className='form-label' for='eventstartdate'><strong>Event Start Date <span className="red-asterisk">*</span></strong></Label>
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
                                                                        Select the event start date. This date will be applied as the event start date
                                                                        when creating the event program days.
                                                                    </PopoverBody>
                                                                </UncontrolledPopover>
                                                                <input
                                                                    {...input}
                                                                    className="form-control"
                                                                    id="eventstartdate"
                                                                    type="date"
                                                                    placeholder="Enter Start Date"
                                                                    // min={minDate}
                                                                    max="9999-12-31"
                                                                    onChange={(e) => {
                                                                        input.onChange(e);
                                                                        setStartDate(e.target.value);
                                                                    }}
                                                                />
                                                                {meta.error && meta.touched && <FormFeedback className='d-block text-danger'>{meta.error}</FormFeedback>}
                                                            </div>
                                                        )}
                                                    </Field>
                                                </Col>

                                                <Col md="4" className="mb-3">
                                                    <Field name="eventenddate">
                                                        {({ input, meta }) => (
                                                            <div>
                                                                <Label className='form-label' for='eventenddate'><strong>Event End Date <span className="red-asterisk">*</span></strong></Label>
                                                                <MdInfoOutline
                                                                    id="endPopover"
                                                                    style={{
                                                                        cursor: 'pointer', marginLeft: '5px'
                                                                    }}
                                                                />
                                                                <UncontrolledPopover
                                                                    placement="bottom"
                                                                    target="endPopover"
                                                                    trigger="focus"
                                                                >
                                                                    <PopoverBody>
                                                                        Select the event end date. This date will be used as the end date for the event when creating event program days.
                                                                    </PopoverBody>
                                                                </UncontrolledPopover>
                                                                <input
                                                                    {...input}
                                                                    className="form-control"
                                                                    id="eventenddate"
                                                                    type="date"
                                                                    placeholder="Enter End Date"
                                                                    min={startDate}
                                                                    max="9999-12-31"
                                                                />
                                                                {meta.error && meta.touched && <FormFeedback className='d-block text-danger'>{meta.error}</FormFeedback>}
                                                            </div>
                                                        )}
                                                    </Field>
                                                </Col>

                                                <Col md="4" className="mb-3">

                                                    <Field
                                                        name="eventtime"
                                                    >
                                                        {({ input, meta }) => (
                                                            <div>
                                                                <Label className='form-label' for='eventtime'><strong>Event Start Time <span className="red-asterisk">*</span></strong></Label>
                                                                <input
                                                                    {...input}
                                                                    className="form-control"
                                                                    id="eventtime"
                                                                    type="time"
                                                                    placeholder="Enter Event time"
                                                                    // min={minDate}
                                                                    max="9999-12-31"
                                                                />
                                                                {meta.error && meta.touched && <FormFeedback className='d-block text-danger'>{meta.error}</FormFeedback>}
                                                            </div>
                                                        )}
                                                    </Field>


                                                </Col>

                                                {/* <Col md="4 mb-3">
                                                    <div>
                                                        <Label for="logoimage"><strong>Logo Image <span className="red-asterisk">*</span></strong></Label>
                                                        <Input
                                                            type="file"
                                                            name="logoimage"
                                                            onChange={(event) => handleImageChange(event, 'logoimage')}
                                                            required={!selectedImage && !logoimage}
                                                        />
                                                        {imageError && <p style={{ color: 'red' }}>{imageError}</p>}
                                                        {selectedImage && <p>Selected image: {selectedImage.name}</p>}
                                                        {selectedImage === null && logoimage && <p style={{ color: 'green' }}>Logo Image available: {logoimage.replace('app-icon\\', '')}</p>}
                                                    </div>
                                                </Col> */}

                                                <Col md="4" className="mb-3">
                                                    <div>
                                                        <Label for="exhIcon">
                                                            <strong>Payment Receipt Header <span className="red-asterisk">*</span></strong>
                                                        </Label>
                                                        <MdInfoOutline
                                                            id="logoPopover"
                                                            style={{
                                                                cursor: 'pointer', marginLeft: '5px'
                                                            }}
                                                        />
                                                        <UncontrolledPopover
                                                            placement="bottom"
                                                            target="logoPopover"
                                                            trigger="focus"
                                                        >
                                                            <PopoverBody>
                                                                The icon you upload will be displayed on both the Event App Admin Dashboard and in the Event App during event search. <br />
                                                                Please ensure the image meets the required specifications for best display.
                                                            </PopoverBody>
                                                        </UncontrolledPopover>
                                                        <Input
                                                            type="file"
                                                            name="logoimage"
                                                            onChange={(event) => handleImageChange(event, 'logoimage')}
                                                            required={!selectedImage && !logoimage}
                                                        />
                                                        {imageError && <p style={{ color: 'red' }}>{imageError}</p>}

                                                        {/* Conditionally render the preview text */}
                                                        {!imageError && (
                                                            <p
                                                                ref={iconAvailableRef}
                                                                style={{ color: 'green', cursor: 'pointer' }}
                                                                onMouseEnter={() => setIconOpen(true)}
                                                                onMouseLeave={() => setIconOpen(false)}
                                                            >
                                                                ✔️ Receipt Header Preview
                                                            </p>
                                                        )}

                                                        <Popover
                                                            placement="right"
                                                            isOpen={iconOpen}
                                                            target={iconAvailableRef.current} // Use ref for the target
                                                            toggle={() => setIconOpen(!iconOpen)}
                                                        >
                                                            <PopoverHeader>Receipt Header Preview</PopoverHeader>
                                                            <PopoverBody>
                                                                {iconPreviewUrl ? (
                                                                    <img src={iconPreviewUrl} alt="Current Exhibitor image" style={{ maxWidth: '200px' }} />
                                                                ) : (
                                                                    <img src={`${BackendPath}${logoimage}`} alt="Current Exhibitor image" style={{ maxWidth: '200px' }} />
                                                                )}
                                                            </PopoverBody>
                                                        </Popover>
                                                    </div>
                                                    {!selectedImage && (
                                                        <small className="form-text text-muted">
                                                        <strong>Image Size:</strong> 200KB Max <br />
                                                        <strong>Dimensions:</strong> 800(W) × 100(H) <br />
                                                        <strong>Image Type:</strong> PNG, JPG, JPEG
                                                    </small>
                                                    )}
                                                </Col>
                                                {/* <Col md="4 mb-3">
                                                    <div>
                                                        <Label for="backgroundimg"><strong>Event background Image <span className="red-asterisk">*</span></strong></Label>
                                                        <Input
                                                            type="file"
                                                            name="backgroundimg"
                                                            onChange={(event) => handleImageChangeforbanner(event, 'backgroundimg')}
                                                            required={!selectedImageforbanner && !backgroundimg}
                                                        />
                                                        {imageErrorforbanner && <p style={{ color: 'red' }}>{imageErrorforbanner}</p>}
                                                        {selectedImageforbanner && <p>Selected image: {selectedImageforbanner.name}</p>}
                                                        {selectedImageforbanner === null && backgroundimg && <p style={{ color: 'green' }}>Banner Image available: {backgroundimg.replace('app-icon\\', '')}</p>}
                                                    </div>
                                                </Col> */}

                                                {/* Event Banner Image */}
                                                <Col md="4" className="mb-3">
                                                    <div>
                                                        <Label for="backgroundimg"><strong>Payment Receipt Footer <span className="red-asterisk">*</span></strong></Label>
                                                        <MdInfoOutline
                                                            id="bannerPopover"
                                                            style={{
                                                                cursor: 'pointer', marginLeft: '5px'
                                                            }}
                                                        />
                                                        <UncontrolledPopover
                                                            placement="bottom"
                                                            target="bannerPopover"
                                                            trigger="focus"
                                                        >
                                                            <PopoverBody>
                                                                The background image you upload will be displayed on the Home page of the event app. <br />
                                                                Please ensure the image meets the required specifications for the best display quality.
                                                            </PopoverBody>
                                                        </UncontrolledPopover>
                                                        <Input
                                                            type="file"
                                                            name="backgroundimg"
                                                            onChange={(event) => handleImageChangeforbanner(event, 'backgroundimg')}
                                                            required={!selectedImageforbanner && !backgroundimg}
                                                        />
                                                        {imageErrorforbanner && <p style={{ color: 'red' }}>{imageErrorforbanner}</p>}
                                                        {!imageErrorforbanner && (
                                                            <p
                                                                id="imageAvailable"
                                                                style={{ color: 'green', cursor: 'pointer' }}
                                                                onMouseEnter={() => setImageOpen(true)}
                                                                onMouseLeave={() => setImageOpen(false)}
                                                            >
                                                                ✔️ Receipt Footer Preview
                                                            </p>
                                                        )}

                                                        <Popover
                                                            placement="right"
                                                            isOpen={imageOpen}
                                                            target="imageAvailable"
                                                            toggle={() => setImageOpen(!imageOpen)}
                                                        >
                                                            <PopoverHeader>Receipt Footer Preview</PopoverHeader>
                                                            {/* <PopoverBody>
                                                                <img src={`${BackendPath}${item.exh_image}`} alt="Current Exhibition Image" style={{ maxWidth: '200px' }} />
                                                            </PopoverBody> */}
                                                            <PopoverBody>
                                                                {imagePreviewUrl ? (
                                                                    <img src={imagePreviewUrl} alt="Current banner image" style={{ maxWidth: '200px' }} />
                                                                ) : (
                                                                    <img src={`${BackendPath}${backgroundimg}`} alt="Current banner image" style={{ maxWidth: '200px' }} />
                                                                )}
                                                            </PopoverBody>
                                                        </Popover>
                                                    </div>
                                                    {!selectedImageforbanner && (
                                                        <small className="form-text text-muted">
                                                            <strong>Image Size:</strong> 200KB Max <br />
                                                            <strong>Dimensions:</strong> 800(W) × 100(H) <br />
                                                            <strong>Image Type:</strong> PNG, JPG, JPEG
                                                        </small>
                                                    )}
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
                    {/* <Link to="/manage-facility/Consoft" className="btn btn-warning">Yes</Link> */}
                    <Button color="primary" onClick={() => setModal(!modal)}>No</Button>
                </ModalFooter>
            </Modal>
        </Fragment>
    );
};

export default RegAdminSetting;
