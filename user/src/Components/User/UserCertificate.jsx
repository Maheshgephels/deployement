import React, { useState, useEffect } from 'react';
import { Card, CardBody, CardHeader, Button, Row, Col, Alert, Spinner } from 'reactstrap';
import axios from 'axios';
import Swal from 'sweetalert2';
import { BackendAPI } from '../../api'; // Adjust import path as per your project structure
import generatePDFFromCertificateListforList from './CertificatePrint';
import { ToastContainer, toast } from "react-toastify";
import useAuth from '../../Auth/protectedAuth';
import { getToken } from '../../Auth/Auth';
import { Breadcrumbs } from '../../AbstractElements';

const UserCertificate = () => {
    useAuth();
    const [settings, setSettings] = useState({
        certificate: 'No',
        feedbackForm: 'No',
        certificateWithFeedback: 'No',
    });

    const [isLoading, setIsLoading] = useState(false); // Track loading state
    const [error, setError] = useState(null); // Track error state
    const [success, setSuccess] = useState(false); // Track success state
    const [Data, setformData] = useState([]);

    // Fetch user and settings data on component mount
    useEffect(() => {
        fetchuser(); // Fetch user data
        fetchSettings(); // Fetch settings data
    }, []);

    // Function to fetch settings from the backend
    const fetchSettings = async () => {
        try {
            const response = await axios.get(`${BackendAPI}/register/getCertFeedbackData`);
            console.log("response.data", response.data);
            if (response.data && response.data.setting) {
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

    // Fetch user data
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
            setformData(response.data[0]);
        } catch (error) {
            console.error('Error fetching user data:', error);
            setError('Unable to fetch user data.');
        }
    };

    // Handle certificate download
    const handlePrintCertificate = async (user) => {
        setIsLoading(true); // Set loading state to true
        setError(null); // Reset error state
        setSuccess(false); // Reset success state

        try {
            console.log("User data for certificate:", user);

            const category = user.cs_reg_category;
            const payload = { category };

            // Fetch badge data for the specific user
            const response = await axios.post(`${BackendAPI}/register/getcertfileds`, payload);

            if (response.data && response.data.badgedata) {
                const apibadgeDataResponse = response.data.badgedata;

                // Process badge data fields for the user
                apibadgeDataResponse.badge_fields.forEach((field) => {
                    if (user.hasOwnProperty(field.cs_field_name) && user[field.cs_field_name] !== null) {
                        field.cs_field_name = String(user[field.cs_field_name]).trim();
                    } else if (field.cs_field_name === "fullname") {
                        const fullName = user.cs_title
                            ? `${user.cs_title} ${user.cs_first_name} ${user.cs_last_name}`
                            : `${user.cs_first_name} ${user.cs_last_name}`;
                        field.cs_field_name = fullName;
                    } else {
                        field.cs_field_name = "";
                    }
                });

                // Generate the certificate PDF for the specific user
                const badgeList = [apibadgeDataResponse];
                await generatePDFFromCertificateListforList(badgeList);

                setSuccess(true); // Set success state to true
                toast.success('Certificate downloaded successfully.');
            } else {
                setError('No badge data found for this user.');
                toast.error('No badge data found for this user.');
            }
        } catch (error) {
            console.error('Error fetching badge data:', error);
            setError('An unexpected error occurred while fetching badge data.');
            toast.error('An unexpected error occurred.');
        } finally {
            setIsLoading(false); // Reset loading state
        }
    };

    return (
        <div>
            <Breadcrumbs mainTitle="Certificate" parent="User" title="Certificate" />
            <Row className="justify-content-center mt-4">
                <Col md="12">
                    <Card>
                        <CardHeader>
                            <h5>Download Certificate</h5>
                        </CardHeader>
                        <CardBody>
                            {settings.certificate === 'Yes' ? (
                                settings.certificateWithFeedback === 'No' ? (
                                    <>
                                        {isLoading ? (
                                            <div className="text-center">
                                                <Spinner color="primary" />
                                                <p>Processing your certificate...</p>
                                            </div>
                                        ) : (
                                            <>
                                                {success ? (
                                                   <p>
                                                        Certificate downloaded successfully!
                                                        </p>
                                                ) : (
                                                    <Button
                                                        color="success"
                                                        size="sm"
                                                        onClick={() => handlePrintCertificate(Data)}
                                                    >
                                                        Download Certificate
                                                    </Button>
                                                )}
                                            </>
                                        )}
                                    </>
                                ) : (
                                    <div>Feedback form is required before downloading the certificate.</div>
                                )
                            ) : (
                                <h3>Certificate No Available Yet !</h3>
                            )}

                            {error && <Alert color="danger">{error}</Alert>}
                        </CardBody>
                    </Card>
                </Col>
            </Row>
            <ToastContainer />
        </div>
    );
};

export default UserCertificate;
