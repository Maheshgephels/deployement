import React, { Fragment, useState, useEffect, useContext, useRef } from 'react';
import { Container, Row, Col, Input, Label, Button, Card, CardBody, CardHeader, Modal, ModalHeader, FormFeedback, ModalBody, ModalFooter, Media, Popover, PopoverHeader, PopoverBody, UncontrolledPopover } from 'reactstrap';
import axios from 'axios';
import { BackendAPI, BackendPath } from '../../api';
import SweetAlert from 'sweetalert2';
import { Breadcrumbs } from '../../AbstractElements';
import { Link, useNavigate } from 'react-router-dom';
import TimezoneSelect from 'react-timezone-select';
import { Field, Form } from 'react-final-form';
import CustomizerContext from '../../_helper/Customizer';
import { required, email, name, Img, fileValidation, BanImg, expiryDate } from '../Utils/validationUtils';
import { MdDelete, MdInfoOutline } from "react-icons/md";
import { PermissionsContext } from '../../contexts/PermissionsContext';
import useAuth from '../../Auth/protectedAuth';
import { getToken } from '../../Auth/Auth';
const AppSetting = () => {
    useAuth();
    const [eventName, setEventName] = useState('');
    const [eventDays, setEventDays] = useState('');
    const [tokenExpiryTime, setTokenExpiryTime] = useState('');
    const [timezone, setTimezone] = useState('');
    const [bannerimg, setBannerimg] = useState('');
    const [loading, setLoading] = useState(true);
    const [modal, setModal] = useState(false);
    const [files, setFiles] = useState({ bannerimage: '' });
    const [imageError, setImageError] = useState('');
    const [selectedImage, setSelectedImage] = useState(null);
    const navigate = useNavigate(); // Initialize useHistory
    const { layoutURL } = useContext(CustomizerContext);
    const { permissions } = useContext(PermissionsContext);
    const [imageOpen, setImageOpen] = useState(false);
    const [iconOpen, setIconOpen] = useState(false);
    const [iconPreviewUrl, setIconPreviewUrl] = useState(null);
    const [imagePreviewUrl, setImagePreviewUrl] = useState(null);
    const iconAvailableRef = useRef(null);



    useEffect(() => {
        fetchSetting();
    }, [permissions]);

    // Extract App device setting Permissions component
    const AppdevicesettingPermissions = permissions['AppSetting'];

    const fetchSetting = async () => {
        try {
            const token = getToken();
            const response = await axios.get(`${BackendAPI}/setting/getSetting`, {
                headers: {
                    Authorization: `Bearer ${token}` // Include the token in the Authorization header
                }
            });
            if (response.data && response.data.setting) {
                const settings = response.data.setting;
                const eventNameSetting = settings.find(setting => setting.cs_parameter === "Event Name");
                const eventDaysSetting = settings.find(setting => setting.cs_parameter === "Event Days");
                const tokenExpiryTimeSetting = settings.find(setting => setting.cs_parameter === "Token Expiry Time");
                const timezoneSetting = settings.find(setting => setting.cs_parameter === "Time Zone");
                const bannerimagesetting = settings.find(setting => setting.cs_parameter === "Banner Image");

                setEventName(eventNameSetting ? eventNameSetting.cs_value : '');
                setEventDays(eventDaysSetting ? eventDaysSetting.cs_value : '');
                setBannerimg(bannerimagesetting ? bannerimagesetting.cs_value : '');
                console.log('Banner Image Setting:', bannerimagesetting ? bannerimagesetting.cs_value : '');
                // Convert tokenExpiryTime from seconds to minutes
                const tokenExpiryTimeInMinutes = tokenExpiryTimeSetting ? Math.floor(tokenExpiryTimeSetting.cs_value / 60) : '';

                // Format tokenExpiryTime in "mm" format
                const tokenExpiryTimeFormatted = tokenExpiryTimeInMinutes !== '' ? String(tokenExpiryTimeInMinutes).padStart(2, '0') : '';
                setTokenExpiryTime(tokenExpiryTimeFormatted);


                setTimezone(timezoneSetting ? timezoneSetting.cs_value : '');

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
        formData.append('tokenExpiryTime', tokenExpiryTime);

        // Append files to the FormData object
        if (files.bannerimage) {
            formData.append('bannerimage', files.bannerimage);
        }

        console.log(formData);

        try {
            const token = getToken();
            // Send formData to server
            const response = await axios.post(`${BackendAPI}/setting/updateSettings`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                    Authorization: `Bearer ${token}`
                }
            });



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
    };



    const handleImageChange = async (event, type) => {
        const file = event.target.files[0];
        if (file) {
            setFiles(prevFiles => ({ ...prevFiles, [type]: file }));
            setSelectedImage(file); // Update selectedImage state
            const url = URL.createObjectURL(file);
            setImagePreviewUrl(url);
        }
        try {
            await BanImg(file); // Wait for the Promise to resolve
            setImageError('');
        } catch (error) {
            setSelectedImage(null);
            setImageError(error);
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
            {/* <Breadcrumbs parentClickHandler={handleNavigation} mainTitle="App Device Setting" parent="Facility" title="App Device Setting" /> */}
            <Container fluid={true}>
                <Row>
                    <Col sm="12">
                        <Card>
                            <CardHeader className="d-flex justify-content-between align-items-center flex-column flex-md-row">
                                <div className="mb-2 mb-md-0">
                                    <h5 className="mb-2 text-center">App Setting</h5>
                                </div>
                            </CardHeader>

                            <CardBody>
                                <form onSubmit={handleSubmit}>


                                    <Row>
                                        {/* <Col md="4 mb-3">
                                            <div>
                                                <Label for="bannerimage"><strong>Banner Image <span className="red-asterisk">*</span></strong></Label>
                                                <Input type="file" name="bannerimg" onChange={(event) => handleImageChange(event, 'bannerimage')} readOnly={AppdevicesettingPermissions?.validate === 0} required />
                                                {imageError && <p style={{ color: 'red' }}>{imageError}</p>}
                                                {selectedImage && <p>Selected image: {selectedImage.name}</p>}
                                                {selectedImage === null && bannerimg && <p style={{ color: 'green' }}>Banner Image available: {bannerimg.replace('app-icon\\', '')}</p>}
                                            </div>
                                        </Col> */}

                                        {/* Event Banner Image */}
                                        <Col md="4" className="mb-3">
                                            <div>
                                                <Label for="bannerimage"><strong>Banner Image <span className="red-asterisk">*</span></strong></Label>
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
                                                        Set the banner image, as it will be displayed on the dashboard of the Onsite App.
                                                    </PopoverBody>
                                                </UncontrolledPopover>
                                                <Input
                                                    type="file"
                                                    name="bannerimage"
                                                    onChange={(event) => handleImageChange(event, 'bannerimage')}
                                                    required
                                                />
                                                {imageError && <p style={{ color: 'red' }}>{imageError}</p>}
                                                {!imageError && (
                                                    <p
                                                        id="imageAvailable"
                                                        style={{ color: 'green', cursor: 'pointer' }}
                                                        onMouseEnter={() => setImageOpen(true)}
                                                        onMouseLeave={() => setImageOpen(false)}
                                                    >
                                                        ✔️ Event Background Image Preview
                                                    </p>
                                                )}

                                                <Popover
                                                    placement="right"
                                                    isOpen={imageOpen}
                                                    target="imageAvailable"
                                                    toggle={() => setImageOpen(!imageOpen)}
                                                >
                                                    <PopoverHeader>Exhibition Image Preview</PopoverHeader>
                                                    {/* <PopoverBody>
                                                                <img src={`${BackendPath}${item.exh_image}`} alt="Current Exhibition Image" style={{ maxWidth: '200px' }} />
                                                            </PopoverBody> */}
                                                    <PopoverBody>
                                                        {imagePreviewUrl ? (
                                                            <img src={imagePreviewUrl} alt="Current banner image" style={{ maxWidth: '200px' }} />
                                                        ) : (
                                                            <img src={`${BackendPath}${bannerimg}`} alt="Current banner image" style={{ maxWidth: '200px' }} />
                                                        )}
                                                    </PopoverBody>
                                                </Popover>
                                            </div>
                                            {!selectedImage && (
                                                <small className="form-text text-muted">
                                                    <strong>Image Size:</strong> 300KB Max <br />
                                                    <strong>Dimensions:</strong> 2000(W) × 600(H) <br />
                                                    <strong>Image Type:</strong> PNG, JPG, JPEG
                                                </small>

                                            )}
                                        </Col>
                                    </Row>


                                    <Col md='4 mb-3'>
                                        <Label className='form-label' for='expirytime'><strong>Token Expiry Time <span className="red-asterisk">*</span></strong></Label>
                                        <MdInfoOutline
                                            id="tokenPopover"
                                            style={{
                                                cursor: 'pointer', marginLeft: '5px'
                                            }}
                                        />
                                        <UncontrolledPopover
                                            placement="bottom"
                                            target="tokenPopover"
                                            trigger="focus"
                                        >
                                            <PopoverBody>
                                                Set the token time expiry in minutes for the Onsite app. After this period,
                                                the app session will be log out, and organizers will need to log in again to continue using the app.
                                            </PopoverBody>
                                        </UncontrolledPopover>
                                        <Input
                                            id="expirytime"
                                            type="number"
                                            placeholder="Enter Token Expiry time in minutes"
                                            value={tokenExpiryTime}
                                            min={1}
                                            onChange={(e) => setTokenExpiryTime(e.target.value)}
                                            readOnly={AppdevicesettingPermissions?.validate === 0}
                                        // onChange={(e) => {
                                        //     const value = e.target.value;
                                        //     // Validate if the input follows the format HH:MM (24-hour format)
                                        //     if (/^([01]\d|2[0-3]):([0-5]\d)$/.test(value) || value === '') {
                                        //         setTokenExpiryTime(value);
                                        //     }

                                        />
                                    </Col>

                                    {AppdevicesettingPermissions?.validate === 1 && (
                                        <div>
                                            <Button color='primary' type='submit' className="me-3 mt-3">Save</Button>
                                            <Button color='warning' onClick={handleCancel} className="mt-3">Cancel</Button>
                                        </div>
                                    )}
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

export default AppSetting;
