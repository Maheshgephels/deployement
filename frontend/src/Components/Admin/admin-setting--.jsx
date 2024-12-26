import React, { Fragment, useState, useEffect, useContext } from 'react';
import { Container, Row, Col, Input, Label, Button, Card, CardBody, CardHeader, Modal, ModalHeader, FormFeedback, ModalBody, ModalFooter, Media } from 'reactstrap';
import axios from 'axios';
import { BackendAPI } from '../../api';
import SweetAlert from 'sweetalert2';
import { Breadcrumbs } from '../../AbstractElements';
import { Link, useNavigate } from 'react-router-dom';
import TimezoneSelect from 'react-timezone-select';
import CustomizerContext from '../../_helper/Customizer';
import Select from 'react-select';
import { required, email, name, Img, fileValidation, BanImg, expiryDate } from '../Utils/validationUtils';

const AdminSetting = () => {
    const [eventName, setEventName] = useState('');
    const [eventDays, setEventDays] = useState('');
    const [tokenExpiryTime, setTokenExpiryTime] = useState('');
    const [timezone, setTimezone] = useState('');
    const [bannerimg, setBannerimg] = useState('');
    const [email, setEmail] = useState('');
    const [mobile, setMobile] = useState('');
    const [from, setFrom] = useState('');
    const [to, setTo] = useState('');
    const [cc, setCc] = useState('');
    const [bcc, setBcc] = useState('');
    const [replyto, setReplyto] = useState('');
    const [sms, setSms] = useState('');
    const [spotregstart, setSpotregstart] = useState('');
    const [loading, setLoading] = useState(true);
    const [modal, setModal] = useState(false);
    // const [files, setFiles] = useState({ bannerimage: '' });
    const [imageError, setImageError] = useState('');
    const [selectedImage, setSelectedImage] = useState(null);
    const navigate = useNavigate(); // Initialize useHistory
    const { layoutURL } = useContext(CustomizerContext);



    useEffect(() => {
        fetchSetting();
    }, []);

    const fetchSetting = async () => {
        try {
            const response = await axios.get(`${BackendAPI}/setting/getAdminSetting`);
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


                setEventName(eventNameSetting ? eventNameSetting.cs_value : '');
                setEventDays(eventDaysSetting ? eventDaysSetting.cs_value : '');
                setTimezone(timezoneSetting ? timezoneSetting.cs_value : '');
                setEmail(emailSetting ? emailSetting.cs_value : '');
                setMobile(mobileSetting ? mobileSetting.cs_value : '');
                setFrom(fromSetting ? fromSetting.cs_value : '');
                setTo(toSetting ? toSetting.cs_value : '');
                setCc(ccSetting ? ccSetting.cs_value : '');
                setBcc(bccSetting ? bccSetting.cs_value : '');
                setReplyto(replytoSetting ? replytoSetting.cs_value : '');
                setSms(smsSetting ? smsSetting.cs_value : '');
                setSpotregstart(spotregstartSetting ? spotregstartSetting.cs_value : '');

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


    const handleSubmit = async (event) => {
        event.preventDefault();
    
        // Create a FormData object to store form data including files
        const formData = new FormData();
    
        // Append form data to the FormData object
        formData.append('eventName', eventName);
        formData.append('eventDays', eventDays);
        formData.append('tokenExpiryTime', tokenExpiryTime);
        formData.append('timezone', timezone);
        formData.append('email', email);
        formData.append('from', from);
        formData.append('to', to);
        formData.append('cc', cc);
        formData.append('bcc', bcc);
        formData.append('replyto', replyto);
    
        try {
            // Send formData to server
            console.log('Form data:', formData )
            
            const response = await axios.post(`${BackendAPI}/setting/updateAdminSettings`, formData);
    
            // Handle server response
            if (response.status === 200) {
                // Show success message to the user
                console.log('Settings updated successfully');
            } else {
                // Handle error condition
                console.error('Error updating settings:', response.data.message);
            }
    
            SweetAlert.fire({
                title: 'Success!',
                text: 'App device setting updated successfully!',
                icon: 'success',
                timer: 3000,
                showConfirmButton: false,
                allowOutsideClick: false,
                allowEscapeKey: false 
            }).then((result) => {
                if (result.dismiss === SweetAlert.DismissReason.timer) {
                    navigate(`${process.env.PUBLIC_URL}/dashboard/default/${layoutURL}`);
                }
            });
        } catch (error) {
            // Handle network error or other exceptions
            console.error('Error updating settings:', error.message);
        }
    
        // Call the function to manipulate eventDays
        ManipulatingEventDays(eventDays);
    };
    
    const ManipulatingEventDays = async (eventDaysData) => {
        try {
            // Create a FormData object to store form data
            const formData = new FormData();
            
            // Append eventDaysData to the FormData object
            formData.append('eventDays', eventDaysData);
    
            // Send formData to the server
            const response = await axios.post(`${BackendAPI}/setting/ChangeEvemtDay`, formData);
            
            // You can do something with the response here if needed
            console.log('Response:', response.data);
        } catch (error) {
            console.error('Error manipulating event days:', error.message);
        }
    };
    



    // const handleImageChange = async (event, type) => {
    //     const file = event.target.files[0];
    //     if (file) {
    //         setFiles(prevFiles => ({ ...prevFiles, [type]: file }));
    //         setSelectedImage(file); // Update selectedImage state
    //     }
    //     try {
    //         await BanImg(file); // Wait for the Promise to resolve
    //         setImageError('');
    //     } catch (error) {
    //         setSelectedImage(null);
    //         setImageError(error);
    //     }
    // };

    const handleCancel = () => {
        const URL = '/dashboard/default/';
        // Pass data as state through route props
        navigate(`${process.env.PUBLIC_URL}${URL}${layoutURL}`);
    };



    return (
        <Fragment>
            <Breadcrumbs parentClickHandler={handleNavigation} mainTitle="Admin Setting" parent="Setting" title="Admin Setting" />
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
                                <form onSubmit={handleSubmit}>

                                    <Row>
                                        <Col md="4" className="mb-3">
                                            <Label className='form-label' for="eventname"><strong>Event Name <span className="red-asterisk">*</span></strong></Label>
                                            <Input
                                                id="eventname"
                                                type="text"
                                                placeholder="Enter event name"
                                                value={eventName}
                                                onChange={(e) => setEventName(e.target.value)}
                                            />
                                        </Col>
                                    </Row>

                                    <Row>
                                        <Col md="4" className="mb-3">
                                            <Label className='form-label' for="eventdays"><strong>Event Days <span className="red-asterisk">*</span></strong></Label>
                                            <Input
                                                id="eventdays"
                                                type="number"
                                                placeholder="Enter event day"
                                                value={eventDays}
                                                min="1"
                                                onChange={(e) => setEventDays(e.target.value)}
                                            />
                                        </Col>
                                    </Row>

                                    <Row>
                                        <Col md="4" className="mb-3">
                                            <Label className='form-label' for="email"><strong>Admin Email</strong></Label>
                                            <Input
                                                id="email"
                                                type="text"
                                                placeholder="Enter email"
                                                value={email}
                                                onChange={(e) => setEmail(e.target.value)}
                                            />
                                        </Col>
                                    </Row>

                                    <Row>
                                        <Col md="4" className="mb-3">
                                            <Label className='form-label' for="from"><strong>From</strong></Label>
                                            <Input
                                                id="from"
                                                type="text"
                                                placeholder="Enter From"
                                                value={from}
                                                onChange={(e) => setFrom(e.target.value)}
                                            />
                                        </Col>
                                    </Row>

                                    <Row>
                                        <Col md="4" className="mb-3">
                                            <Label className='form-label' for="to"><strong>To</strong></Label>
                                            <Input
                                                id="to"
                                                type="text"
                                                placeholder="Enter To"
                                                value={to}
                                                onChange={(e) => setTo(e.target.value)}
                                            />
                                        </Col>
                                    </Row>

                                    <Row>
                                        <Col md="4" className="mb-3">
                                            <Label className='form-label' for="cc"><strong>CC</strong></Label>
                                            <Input
                                                id="cc"
                                                type="text"
                                                placeholder="Enter Cc"
                                                value={cc}
                                                onChange={(e) => setCc(e.target.value)}
                                            />
                                        </Col>
                                    </Row>

                                    <Row>
                                        <Col md="4" className="mb-3">
                                            <Label className='form-label' for="bcc"><strong>BCC</strong></Label>
                                            <Input
                                                id="bcc"
                                                type="text"
                                                placeholder="Enter Bcc"
                                                value={bcc}
                                                onChange={(e) => setBcc(e.target.value)}
                                            />
                                        </Col>
                                    </Row>

                                    <Row>
                                        <Col md="4" className="mb-3">
                                            <Label className='form-label' for="replyto"><strong>Reply-To</strong></Label>
                                            <Input
                                                id="replyto"
                                                type="text"
                                                placeholder="Enter Reply-To"
                                                value={replyto}
                                                onChange={(e) => setReplyto(e.target.value)}
                                            />
                                        </Col>
                                    </Row>

                                    {/* <Row>
                                        <Col md="4 mb-3">
                                            <div>
                                                <Label for="bannerimage"><strong>Banner Image <span className="red-asterisk">*</span></strong></Label>
                                                <Input type="file" name="bannerimg" onChange={(event) => handleImageChange(event, 'bannerimage')} />
                                                {imageError && <p style={{ color: 'red' }}>{imageError}</p>}
                                                {selectedImage && <p>Selected image: {selectedImage.name}</p>}
                                                {selectedImage === null && bannerimg && <p style={{ color: 'green' }}>Banner Image available: {bannerimg.replace('app-icon\\', '')}</p>}
                                            </div>
                                        </Col>
                                    </Row> */}




                                    {/* <Row>
                                        <Col md='4 mb-3'>
                                            <Label className='form-label' for='expirytime'><strong>Token Expiry Time <span className="red-asterisk">*</span></strong></Label>
                                            <Input
                                                id="expirytime"
                                                type="time"
                                                placeholder="Enter Token Expiry time"
                                                value={tokenExpiryTime}
                                                onChange={(e) => setTokenExpiryTime(e.target.value)}
                                            />
                                        </Col>
                                    </Row> */}
                                    {/* <Col md='4 mb-3'>
                                        <Label className='form-label' for='expirytime'><strong>Token Expiry Time <span className="red-asterisk">*</span></strong></Label>
                                        <Input
                                            id="expirytime"
                                            type="text"
                                            placeholder="Enter Token Expiry time"
                                            value={tokenExpiryTime}
                                            onChange={(e) => setTokenExpiryTime(e.target.value)}

                                        onChange={(e) => {
                                            const value = e.target.value;
                                            // Validate if the input follows the format HH:MM (24-hour format)
                                            if (/^([01]\d|2[0-3]):([0-5]\d)$/.test(value) || value === '') {
                                                setTokenExpiryTime(value);
                                            }

                                        />
                                    </Col> */}



                                    {/* <Row>
                                        <Col md='4 mb-3'>
                                            <Label className='form-label' for='sms'><strong> SMS Sending <span className="red-asterisk">*</span></strong></Label>
                                            <Select
                                                value={sms}
                                                onChange={(selected) => setSms(selected.value)}
                                            />
                                        </Col>
                                    </Row> */}

                                    <Row>
                                        <Col md='4 mb-3'>
                                            <Label className='form-label' for='timezone'><strong> Timezone <span className="red-asterisk">*</span></strong></Label>
                                            <TimezoneSelect
                                                value={timezone}
                                                onChange={(selected) => setTimezone(selected.value)}
                                            />
                                        </Col>
                                    </Row>

                                    <div>
                                        <Button color='primary' type='submit' className="mr-2 mt-3">Save</Button>
                                        <Button color='warning' onClick={handleCancel} className="mt-3">Cancel</Button>
                                    </div>
                                </form>
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
                    <Link to="/manage-facility/Consoft" className="btn btn-warning">Yes</Link>
                    <Button color="primary" onClick={() => setModal(!modal)}>No</Button>
                </ModalFooter>
            </Modal>
        </Fragment>
    );
};

export default AdminSetting;
