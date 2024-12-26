import React, { Fragment, useState, useEffect, useContext } from "react";
import {
    Container,
    Row,
    Col,
    Button,
    Card,
    CardBody,
    CardHeader,
    Modal,
    ModalHeader,
    ModalBody,
    ModalFooter,
} from "reactstrap";
import Select from "react-select";
import axios from "axios";
import { BackendAPI } from "../../api";
import SweetAlert from "sweetalert2";
import { useNavigate } from "react-router-dom";
import useAuth from "../../Auth/protectedAuth";
import { getToken } from "../../Auth/Auth";
import CustomizerContext from "../../_helper/Customizer";

const CertificateSetting = () => {
    useAuth();

    const { layoutURL } = useContext(CustomizerContext);
    const navigate = useNavigate();

    const [settings, setSettings] = useState();
    const [certificate, setCertificate] = useState({ value: "No", label: "No" });
    const [certificateWithFeedback, setCertificateWithFeedback] = useState({
        value: "No",
        label: "No",
    });
    const [feedbackForm, setFeedbackForm] = useState({ value: "No", label: "No" });

    const [loading, setLoading] = useState(true);
    const [modal, setModal] = useState(false);

    const yesNoOptions = [
        { value: "Yes", label: "Yes" },
        { value: "No", label: "No" },
    ];

    useEffect(() => {
        fetchSetting();
    }, []);

    const fetchSetting = async () => {
        try {
            const token = getToken();
            const response = await axios.get(
                `${BackendAPI}/setting/getCertFeedbackData`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );
    
            if (response.data && response.data.setting) {
                const fetchedSettings = response.data.setting.reduce(
                    (acc, setting) => ({
                        ...acc,
                        [setting.cs_parameter]: setting.cs_value,
                    }),
                    {}
                );
    
                setSettings(fetchedSettings);
    
                // Set default values based on fetched settings
                setCertificate({
                    value: fetchedSettings.certificate || "No",
                    label: fetchedSettings.certificate || "No",
                });
                setCertificateWithFeedback({
                    value: fetchedSettings.certificate_with_feedback || "No",
                    label: fetchedSettings.certificate_with_feedback || "No",
                });
                setFeedbackForm({
                    value: fetchedSettings.feedback_form || "No",
                    label: fetchedSettings.feedback_form || "No",
                });
    
                setLoading(false);
            } else {
                console.error("Error: Invalid response format");
                setLoading(false);
            }
        } catch (error) {
            console.error("Error fetching settings:", error);
            setLoading(false);
        }
    };

    const handleSubmit = async (event) => {
        event.preventDefault();

        const formData = {
            certificate: certificate.value,
            certificateWithFeedback: certificateWithFeedback.value,
            feedbackForm: feedbackForm.value,
        };

        try {
            const token = getToken();
            const response = await axios.post(
                `${BackendAPI}/setting/updateCertSettings`,
                formData,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            if (response.status === 200) {
                SweetAlert.fire({
                    title: "Success!",
                    text: "Certificate settings updated successfully!",
                    icon: "success",
                    timer: 3000,
                    showConfirmButton: false,
                }).then(() => {
                    navigate(
                        `${process.env.PUBLIC_URL}/onsite/dashboard/${layoutURL}`
                    );
                });
            }
        } catch (error) {
            console.error("Error updating settings:", error);
        }
    };

    const handleCancel = () => setModal(true);

    const handleNavigation = () => navigate("/onsite/dashboard/Consoft");

    if (loading) return <div>Loading...</div>;

    return (
        <Fragment>
            <Container fluid={true}>
                <Row>
                    <Col sm="12">
                        <Card>
                            <CardHeader>
                                <h5 className="mb-0">Certificate Settings</h5>
                            </CardHeader>
                            <CardBody>
                                <form onSubmit={handleSubmit}>
                                    {/* Certificate Field */}
                                    <Row>
                                        <Col md="4" className="mb-3">
                                            <label>Certificate</label>
                                            <Select
                                                options={yesNoOptions}
                                                value={certificate}
                                                classNamePrefix="react-select"
                                                onChange={(selected) => setCertificate(selected)}
                                            />
                                        </Col>
                                    </Row>

                                    {/* Certificate with Feedback Field (Visible if Certificate is Yes) */}
                                    {certificate.value === "Yes" && (
                                        <Row>
                                            <Col md="4" className="mb-3">
                                                <label>Certificate with Feedback</label>
                                                <Select
                                                    options={yesNoOptions}
                                                    value={certificateWithFeedback}
                                                    classNamePrefix="react-select"
                                                    onChange={(selected) =>
                                                        setCertificateWithFeedback(selected)
                                                    }
                                                />
                                            </Col>
                                        </Row>
                                    )}

                                    {/* Feedback Form Field (Visible if Certificate is No or Certificate with Feedback is No) */}
                                    {(certificate.value === "No" ||
                                        certificateWithFeedback.value === "No") && (
                                        <Row>
                                            <Col md="4" className="mb-3">
                                                <label>Feedback Form</label>
                                                <Select
                                                    options={yesNoOptions}
                                                    value={feedbackForm}
                                                    classNamePrefix="react-select"
                                                    onChange={(selected) =>
                                                        setFeedbackForm(selected)
                                                    }
                                                />
                                            </Col>
                                        </Row>
                                    )}

                                    {/* Save and Cancel Buttons */}
                                    <div>
                                        <Button
                                            color="primary"
                                            type="submit"
                                            className="me-3 mt-3"
                                        >
                                            Save
                                        </Button>
                                        <Button
                                            color="warning"
                                            onClick={handleCancel}
                                            className="mt-3"
                                        >
                                            Cancel
                                        </Button>
                                    </div>
                                </form>
                            </CardBody>
                        </Card>
                    </Col>
                </Row>
            </Container>
            <Modal isOpen={modal} toggle={() => setModal(!modal)} centered>
                <ModalHeader toggle={() => setModal(!modal)}>
                    Confirmation
                </ModalHeader>
                <ModalBody>
                    <p>
                        Your changes will be discarded. Are you sure you want to
                        cancel?
                    </p>
                </ModalBody>
                <ModalFooter>
                    <Button onClick={handleNavigation} color="warning">
                        Yes
                    </Button>
                    <Button color="primary" onClick={() => setModal(!modal)}>
                        No
                    </Button>
                </ModalFooter>
            </Modal>
        </Fragment>
    );
};

export default CertificateSetting;
