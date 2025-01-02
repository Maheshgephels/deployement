import React, { useState, useEffect, useRef } from 'react';
import { Card, CardBody, Table, Button, Row, Col, Alert } from 'reactstrap';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import useAuth from '../../Auth/protectedAuth';
import { getToken } from '../../Auth/Auth';
import { BackendAPI, BackendPath } from '../../api';
import { Breadcrumbs } from '../../AbstractElements';
import { FaCamera } from 'react-icons/fa';
import generatePDFFromCertificateListforList from './CertificatePrint';
import { ToastContainer, toast } from "react-toastify";
import Swal from 'sweetalert2'; // Import SweetAlert

// const defaultAvatar = 'https://via.placeholder.com/150';

const UserDashboard = () => {
    useAuth();

    const [fields, setFields] = useState([]);
    const [profilePhoto, setProfilePhoto] = useState(null);
    const [profileImageUrl, setProfileImageUrl] = useState(null);
    const [profileImageUrl1, setProfileImageUrl1] = useState('profile/pendingprofileimage.png');
    const navigate = useNavigate();
    const fileInputRef = useRef(null);
    const [Data, setformData] = useState([]);
    const [settings, setSettings] = useState({
        certificate: 'No',
        feedbackForm: 'No',
        certificateWithFeedback: 'No',
    });

    console.log("Data fdfd", Data);

    // Function to fetch user and field data
    useEffect(() => {
        fetchuser(); // Fetch workshop data when component mounts
    }, []);

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const response = await axios.get(`${BackendAPI}/register/getCertFeedbackData`);

                console.log("response.data", response.data);

                if (response.data && response.data.setting) {
                    // Map the settings array to extract the parameters
                    const settings = response.data.setting.reduce((acc, setting) => {
                        acc[setting.cs_parameter] = setting.cs_value;
                        return acc;
                    }, {});

                    setSettings({
                        certificate: settings.certificate || 'No',
                        feedbackForm: settings.feedback_form || 'No',
                        certificateWithFeedback: settings.certificate_with_feedback || 'No',
                    });
                }
            } catch (error) {
                console.error('Error fetching settings:', error);
                Swal.fire('Error', 'Unable to fetch settings. Please try again.', 'error');
            }
        };

        fetchSettings();
    }, []);

    const fetchuser = async () => {
        try {
            const token = getToken();
            const userId = localStorage.getItem('UserId');
            const response = await axios.post(`${BackendAPI}/userdashboard/edituser`, { userId }, {
                headers: {
                    Authorization: `Bearer ${token}` // Include the token in the Authorization header
                }
            });
            console.log('Data from API:', response.data);
            setformData(response.data[0]); // Set workshop data to the first item in the response array
        } catch (error) {
            console.error('Error fetching workshop data:', error);
        }
    };

    const fetchUserAndFieldData = async () => {
        try {
            const token = getToken();
            const userId = localStorage.getItem('UserId');

            const response = await axios.get(`${BackendAPI}/userdashboard/getUserAndFieldData`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
                params: {
                    user_id: userId,
                },
            });

            setFields(response.data.Fields);

            // Set the profile image URL if available; if the response contains a new image URL, use it
            if (response.data.cs_profile) {
                setProfileImageUrl(response.data.cs_profile); // This should reflect the latest profile image
            }
            else {
                setProfileImageUrl('profile/Dummy.png');
            }
        } catch (error) {
            console.error('Error fetching user and field data:', error);
        }
    };


    useEffect(() => {
        fetchUserAndFieldData(); // Call the fetch function when the component mounts
    }, []);

    const handlePhotoChange = async (e) => {
        const file = e.target.files[0];
        const maxFileSize = 2 * 1024 * 1024;

        if (file && file.size > maxFileSize) {
            Swal.fire('Error', 'File size exceeds 2MB limit.', 'error');
            e.target.value = ''; // Reset the file input
        } else if (file) {
            // Immediately show the new profile photo
            setProfileImageUrl(URL.createObjectURL(file));
            await handlePhotoUpload(file); // Call the upload function
        }
    };

    const handleEditClick = () => {
        const userId = localStorage.getItem('UserId');
        navigate(`${process.env.PUBLIC_URL}/edit-basicdetails/Consoft`, { state: { userId } });
    };

    const handlePhotoUpload = async (file) => {
        const formData = new FormData();
        formData.append('profilePhoto', file);
        formData.append('userId', localStorage.getItem('UserId')); // Send userId in the request
        const token = getToken();

        try {
            const response = await axios.post(`${BackendAPI}/userdashboard/uploadProfilePhoto`, formData, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'multipart/form-data',
                },
            });

            if (response.status === 200) { // Check if response status is 200
                Swal.fire({
                    icon: 'success',
                    title: 'Success',
                    text: 'Profile photo uploaded successfully.',
                });
                // Fetch the latest data to get the updated profile image
                fetchUserAndFieldData();
            }
        } catch (error) {
            console.error('Error uploading profile photo:', error);
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: `Error uploading profile photo: ${error.message}`,
            });
        }
    };



    const handlePrintCertificate = async (user) => {
        try {
            console.log("User data for certificate:", user);

            const category = user.cs_reg_category;
            console.log("Category for user:", category);

            const payload = { category };
            console.log("Sending payload:", payload);

            // Fetch badge data for the specific user
            const response = await axios.post(`${BackendAPI}/register/getcertfileds`, payload);

            if (response.data && response.data.badgedata) {
                const apibadgeDataResponse = response.data.badgedata;
                console.log("Fetched badge data:", apibadgeDataResponse);

                // Process badge data fields for the user
                apibadgeDataResponse.badge_fields.forEach((field) => {
                    if (user.hasOwnProperty(field.cs_field_name) && user[field.cs_field_name] !== null && user[field.cs_field_name] !== undefined) {
                        field.cs_field_name = String(user[field.cs_field_name]).trim();
                    } else if (field.cs_field_name === "fullname") {
                        const fullName = user.cs_title
                            ? `${user.cs_title} ${user.cs_first_name} ${user.cs_last_name}`
                            : `${user.cs_first_name} ${user.cs_last_name}`;
                        field.cs_field_name = fullName;
                    } else {
                        field.cs_field_name = "";
                    }

                    // Example: Bold the text if it's the First Name
                    if (field.cs_field_label === "First Name") {
                        field.textBold = true;
                    } else {
                        field.textBold = false;
                    }
                });

                console.log("Final badge data for user:", apibadgeDataResponse);

                // Generate the certificate PDF for the specific user
                const badgeList = [apibadgeDataResponse];
                await generatePDFFromCertificateListforList(badgeList);

                toast.success('Certificate downloaded successfully.');
            } else {
                toast.error('No badge data found for this user.');
            }

        } catch (error) {
            console.error('Error fetching badge data:', error);
            if (error.response && error.response.data && error.response.data.error) {
                toast.error(error.response.data.error);
            } else {
                toast.error('An unexpected error occurred while fetching badge data.');
            }
        }
    };



    const triggerFileSelect = () => {
        fileInputRef.current.click();
    };

    return (
        <div>
            <Breadcrumbs mainTitle="Dashboard" parent="User" title="Dashboard" />
            <Row className='justify-content-center'>
                <Col sm={8}>
                    <Card className="mt-4">
                        <CardBody>
                            <h5>Basic User Details</h5>
                            <div className="my-4 ms-auto text-center">
                                <div className="avatar-wrapper ms-auto" onClick={triggerFileSelect}>
                                    <img src={`${BackendPath}${profileImageUrl}`} alt="Profile" className="profile-avatar" />
                                    <div className="upload-icon">
                                        <FaCamera />
                                    </div>
                                </div>

                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handlePhotoChange}
                                    className="d-none"
                                    ref={fileInputRef}
                                />
                            </div>
                            <Table responsive bordered hover>
                                <tbody>
                                    {fields.length > 0 ? (
                                        fields.map((field, index) => (
                                            <tr key={index}>
                                                <td>{field.field_label}</td>
                                                <td>{field.field_value}</td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan="2">No user details found</td>
                                        </tr>
                                    )}
                                </tbody>
                            </Table>
                            <Button color="primary" onClick={handleEditClick} className="mt-3">
                                Edit
                            </Button>


                        </CardBody>
                    </Card>

                </Col>

                {Data?.cs_isconfirm === 0 && Data?.confirm_payment === 1 ? (
                    <Col sm={4}>
                        <Card className="mt-4">
                            <CardBody>
                                <div className="avatar-wrapper justify-content-center" >
                                    <img src={`${BackendPath}${profileImageUrl}`} alt="Profile" className="profile-avatar" />
                                </div>

                                <div>
                                    <p>You have applied for the ticket: <strong>{Data.ticket_name}</strong></p>
                                </div>

                                <Table responsive bordered hover>
                                    <tbody>
                                        <tr>
                                            <td>Date</td>
                                            <td>{new Date(Data?.cs_apply_date).toLocaleDateString() || 'N/A'}</td>

                                        </tr>
                                        <tr>
                                            <td>Time</td>
                                            <td>{new Date(Data?.cs_apply_date).toLocaleTimeString() || 'N/A'}</td>
                                        </tr>
                                    </tbody>
                                </Table>

                            </CardBody>
                        </Card>
                    </Col>
                ) : Data?.cs_isconfirm == 1 ? (
                    <Col sm={4}>
                        <Alert
                            color="success"
                            style={{ backgroundColor: '#d4edda', color: '#155724', borderColor: '#c3e6cb' }} // Light green colors for member status
                            className="mt-3"
                        >
                            {/* <h4 className="alert-heading">?? Membership Approved!</h4>
<hr />
<p className="mb-2">
<strong>Congratulations!</strong> Your membership has been approved and you are now part of IADVL Pune.
</p> */}
                            <div className="alert alert-success" role="alert" style={{ padding: '1.5rem', borderRadius: '0.5rem', boxShadow: '0 4px 8px rgba(0,0,0,0.1)' }}>
                                <h4 className="alert-heading" style={{ color: '#155724', fontSize: '1.4rem' }}>
                                    🎉 You are Registered for the Conference!
                                </h4>
                                <hr style={{ border: '1px solid #c3e6cb', margin: '1rem 0' }} />
                                <p className="mb-2" style={{ fontSize: '1rem', color: '#155724' }}>
                                    Your Registration Number is:
                                    <span style={{ fontWeight: 'bold', fontSize: '1.2rem', color: '#0c5e2f', marginLeft: '0.3rem' }}>
                                        {Data?.cs_regno}
                                    </span>
                                </p>
                                <p style={{ fontSize: '1rem', color: '#155724' }}>
                                    <strong>Category:</strong> {Data?.category_name}
                                </p>
                                <p style={{ fontSize: '1rem', color: '#155724' }}>
                                    <strong>Ticket:</strong> {Data?.ticket_name}
                                </p>

                            </div>

                            {settings.certificate === 'Yes' && settings.certificateWithFeedback === 'No' ? (
                                <Button
                                    color="success"
                                    size="sm"
                                    onClick={() => handlePrintCertificate(Data)}
                                >
                                    Download Certificate
                                </Button>
                            ) : null} {/* If certificate is not 'Yes', render nothing */}



                            {/* <p className="mt-3">Welcome to the community! We look forward to your active participation.</p>
<hr />
<p className="mb-0">If you have any questions, feel free to reach out to us at support@iadvlpune.com.</p> */}
                        </Alert>
                    </Col>
                ) : null}
            </Row>
            <style jsx="true">{`
                .avatar-wrapper {
                    position: relative;
                    display: inline-block;
                    cursor: pointer;
                }

                .profile-avatar {
                    width: 150px;
                    height: 150px;
                    border-radius: 50%;
                    object-fit: cover;
                    border: 2px solid #ddd;
                }

                .upload-icon {
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    position: absolute;
                    bottom: 0;
                    right: 0;
                    background-color: rgba(0, 0, 0, 0.6);
                    color: white;
                    padding: 10px;
                    border-radius: 50%;
                    cursor: pointer;
                }

                .upload-icon:hover {
                    background-color: rgba(0, 0, 0, 0.8);
                }
            `}</style>
        </div>
    );
};

export default UserDashboard;
