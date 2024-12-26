import React, { useState, useEffect, useRef, Fragment, useContext } from 'react';
import { Container, Row, Col, Card, Table, CardHeader, CardBody, Toast, ToastBody, ToastHeader, Input, Button, Modal, ModalHeader, ModalFooter, ModalBody, PopoverBody, UncontrolledPopover, Label, Popover, FormGroup } from 'reactstrap';
import { Breadcrumbs } from '../../AbstractElements';
import axios from 'axios';
import { BackendAPI, BackendPath } from '../../api';
import Select from 'react-select';
import { FaEdit } from 'react-icons/fa'; // Import the key icon
import { MdDelete, MdInfoOutline } from "react-icons/md";
import { FaRegClone } from "react-icons/fa";
import { FiEdit2 } from "react-icons/fi";
import { Button as B, Dropdown as D, Menu } from 'antd';
import { BsThreeDotsVertical, BsThreeDots } from "react-icons/bs";
import { useNavigate } from 'react-router-dom';
import './createcertificate.css';
import { Tooltip } from 'react-tooltip';
import { toast } from 'react-toastify';
import { required } from '../Utils/validationUtils';
// import { Breadcrumbs } from '../../AbstractElements';
import moment from 'moment';
import SweetAlert from 'sweetalert2';
import { PermissionsContext } from '../../contexts/PermissionsContext';
import useAuth from '../../Auth/protectedAuth';
import { getToken } from '../../Auth/Auth';
import Swal from 'sweetalert2';
import { FaCopy, FaQrcode } from "react-icons/fa"; // Import icons
import { QRCodeCanvas } from 'qrcode.react'; // Install using: npm install qrcode.react

const CreateCertificate = () => {
    useAuth();
    // State variables
    const [badgeName, setBadgeName] = useState('');
    const [badgeType, setBadgeType] = useState('');
    const [designation, setDesignation] = useState('');
    const [categories, setCategories] = useState([]);
    const [designations, setDesignations] = useState([]);
    const [createdBadges, setCreatedBadges] = useState([]);
    const [typeError, setTypeError] = useState('');
    const [nameError, setNameError] = useState('');
    const [editingBadgeName, setEditingBadgeName] = useState('');
    const [editModal, setEditModal] = useState(false); // State for edit modal
    const [editingBadge, setEditingBadge] = useState(null); // State for editing badge
    const [statusModal, setStatusModal] = useState(false);
    const [badgeId, setBadgeId] = useState(null);
    const [badgeCategoryId, setBadgeCategoryId] = useState(null);
    const [selectedCat, setSelectedCat] = useState(null); // Added state to store selected category
    const [catData, setCatData] = useState([]);
    const [prodData, setProdData] = useState([]);
    const navigate = useNavigate(); // Initialize navigate hook
    const { permissions } = useContext(PermissionsContext);
    const [modal, setModal] = useState(false);
    const [badgeToDelete, setBadgeToDelete] = useState(null); // State to track which badge to delete
    const [showToast, setShowToast] = useState(false);
    
    const [popoverOpen, setPopoverOpen] = useState(false);
    const [settings, setSettings] = useState({
        certificate: 'No',
        feedbackForm: 'No',
        certificateWithFeedback: 'No',
        isUserpanel: 'No'
    });


    const link = `${BackendPath}user/certificate`;

    const handleCopy = () => {
        navigator.clipboard.writeText(link);
        setShowToast(true);
        setTimeout(() => setShowToast(false), 2000); // Hide toast after 2 seconds
    };


    console.log("createdBadges", createdBadges);
    console.log("Cats", catData);
    console.log("selectedCat", selectedCat);


    // Fetch categories from the backend API
    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const token = getToken();
                const response = await axios.post(`${BackendAPI}/certificate/getcategories`, null, {
                    headers: {
                        Authorization: `Bearer ${token}` // Include the token in the Authorization header
                    }
                });
                setCategories(response.data.categories);
            } catch (error) {
                console.error('Error fetching categories:', error);
            }
        };
        fetchCategories();
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
                        isUserpanel: settings.user_panel || 'No',
                    });
                }
            } catch (error) {
                console.error('Error fetching settings:', error);
                Swal.fire('Error', 'Unable to fetch settings. Please try again.', 'error');
            }
        };

        fetchSettings();
    }, []);

    useEffect(() => {
        const fetchCat = async () => {
            try {
                const token = getToken();
                const response = await axios.get(`${BackendAPI}/certificate/getNoCertCat`, {
                    headers: {
                        Authorization: `Bearer ${token}` // Include the token in the Authorization header
                    }
                });
                const catData = response.data.Types.map(item => ({
                    id: item.cs_reg_cat_id,
                    Cat: item.cs_reg_category
                }));
                setCatData(catData);
                setProdData(response.data.prodData)
            } catch (error) {
                console.error('Error fetching types:', error);
            }
        };
        fetchCat();
    }, []);


    // Handler for saving the edited badge name
    const handleSaveBadgeName = async () => {
        try {
            const token = getToken();
            const response = await axios.put(`${BackendAPI}/certificate/updatecertname/${editingBadge.badge_id}`, { badgeName: editingBadgeName }, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            if (response.data.success) {
                setCreatedBadges((prevBadges) =>
                    prevBadges.map((badge) =>
                        badge.badge_id === editingBadge.badge_id ? { ...badge, badge_name: editingBadgeName } : badge
                    )
                );
                setEditingBadge(null);
                setEditModal(false);
                toast.success('Badge name updated successfully');
            } else {
                toast.error('Failed to update badge name');
            }
        } catch (error) {
            console.error('Error updating badge name:', error);
            toast.error('Error updating badge name');
        }
    };

    // Handler for opening the edit mode
    const handleEditBadgeName = (badge) => {
        setEditingBadge(badge);
        setEditingBadgeName(badge.badge_name);
        setEditModal(true);
    };


    // Fetch designations based on selected category
    useEffect(() => {
        const fetchDesignations = async () => {
            if (badgeType) {
                try {
                    const token = getToken();
                    const response = await axios.get(`${BackendAPI}/certificate/getdesignations/${badgeType}`, {
                        headers: {
                            Authorization: `Bearer ${token}` // Include the token in the Authorization header
                        }
                    });
                    setDesignations(response.data.designations);
                } catch (error) {
                    console.error('Error fetching designations:', error);
                }
            }
        };
        fetchDesignations();
    }, [badgeType]);

    useEffect(() => {
        const fetchCreatedBadges = async () => {
            try {
                const token = getToken();
                const response = await axios.get(`${BackendAPI}/certificate/getcreatedcertificate`, {
                    headers: {
                        Authorization: `Bearer ${token}` // Include the token in the Authorization header
                    }
                });
                setCreatedBadges(response.data.createdBadges);
            } catch (error) {
                console.error('Error fetching created badges:', error);
            }
        };
        fetchCreatedBadges();
    }, [permissions]);



    // Extract CreateBadgePermissions component
    const CreateBadgePermissions = permissions['Createbadge'];

    const handleBadgeNameChange = (event) => {
        setBadgeName(event.target.value);
    };

    const handleBadgeTypeChange = (event) => {
        setBadgeType(event.target.value);
    };

    const handleDesignationChange = (event) => {
        setDesignation(event.target.value);
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        const nameValidationError = required(badgeName);
        const typeValidationError = required(badgeType);

        if (nameValidationError) {
            setNameError(nameValidationError);
        } else {
            setNameError('');
        }

        if (typeValidationError) {
            setTypeError(typeValidationError);
        } else {
            setTypeError('');
        }

        // If both fields are valid, proceed with form submission or other actions
        if (!nameValidationError && !typeValidationError) {
            try {
                console.log('Badge Name:', badgeName);
                console.log('Category ID:', badgeType);
                const token = getToken();
                // Send badge data to backend to create a new badge
                const response = await axios.post(`${BackendAPI}/certificate/createcert`, {
                    badgeName,
                    categoryId: badgeType, // Ensure categoryId is sent as an integer
                }, {
                    headers: {
                        Authorization: `Bearer ${token}` // Include the token in the Authorization header
                    }
                });

                // Handle success or show a success message
                console.log('Badge created successfully:', response.data);

                if (response.status === 201) {
                    // navigate(`${process.env.PUBLIC_URL}/onsite/badge-design/Consoft`, {
                    //     state: {
                    //         badgeName: badgeName,
                    //         designation: designation,
                    //         category: categories.find(cat => cat.id === parseInt(badgeType)) // Assuming badgeType is a string
                    //     }
                    // });

                    navigate(`${process.env.PUBLIC_URL}/onsite/certificate-config/Consoft`, {
                        state: {
                            badgeName: badgeName,
                            designation: designation,
                            category: categories.find(cat => cat.id === parseInt(badgeType)) // Assuming badgeType is a string
                        }
                    });
                }
            } catch (error) {
                // Handle error or show an error message
                console.error('Error creating badge:', error);
                if (error.response && error.response.data && error.response.data.message) {
                    // If the error response contains a message from the API, display it
                    // You can set it to a state variable and display it in your UI
                    toast.error(error.response.data.message); // Use toast.error for displaying error messages
                } else {
                    // If there is no specific message from the API, display a generic error message
                    toast.error('Error fetching created badges. Please try again.'); // Display a generic error message
                }
            }
        }
    };



    const handleEdit = async (badge) => {
        console.log("Badge category name: ", badge.category_name);
        try {
            const token = getToken();
            // // Make an API call to fetch badge data based on category name
            // const badgeFieldsResponse = await axios.post(`${BackendAPI}/certificate/getbadgefileds`, { category: badge.category_name });

            // Make an API call to fetch badge data based on category name

            const badgeFieldsResponse = await axios.post(
                `${BackendAPI}/certificate/getcertfileds`,
                { category: badge.category_name },
                {
                    headers: {
                        Authorization: `Bearer ${token}` // Include the token in the Authorization header
                    }
                }
            );
            if (badgeFieldsResponse.status === 200) {
                // Extract badge data from the response
                const badgeDataApi = badgeFieldsResponse.data.badgedata;
                console.log("Badge data from Create Certificate page API: ", badgeDataApi);
                const badgegge = createdBadges;

                console.log("Badge data: ", badgeDataApi);

                // Navigate to the BadgeDesigner component with the badge data
                // navigate("/onsite/badge-design/Consoft", {
                navigate(`${process.env.PUBLIC_URL}/onsite/certificate-design/Consoft`, {
                    state: {
                        badgeDatafromApi: badgeDataApi,
                        badge: badge,
                        badge_Type: createdBadges.badge_type
                        // Pass any other necessary data here
                    }
                });

            } else {
                // Handle error response from the API
                console.error('Failed to fetch badge data:', badgeFieldsResponse.data.message);
                // Show error message to the user
                toast.error('Failed to fetch badge data. Please try again.');
            }
        } catch (error) {
            // Handle network errors
            console.error('Error fetching badge data:', error);
            // Show error message to the user
            toast.error('Error fetching badge data. Please try again.');
        }
    };

    const handleRemove = async () => {
        if (!badgeToDelete) return;

        try {
            const token = getToken();
            const response = await axios.delete(`${BackendAPI}/certificate/removecertificate/${badgeToDelete.badge_id}`, {
                headers: {
                    Authorization: `Bearer ${token}` // Include the token in the Authorization header
                }
            });
            if (response.status === 200) {
                // Remove the badge from state
                setCreatedBadges(prevBadges => prevBadges.filter(badge => badge.badge_id !== badgeToDelete.badge_id));
                // Display success toast message
                toast.success('Certificate removed successfully');
            } else {
                // Display error toast message if response status is not 200
                toast.error('Error removing badge');
            }
        } catch (error) {
            // Log the error to console
            console.error('Error removing badge:', error);
            // Display error toast message
            toast.error('Error removing badge');
        } finally {
            // Close the modal and clear the badge to be deleted
            setModal(false);
            setBadgeToDelete(null);
        }
    };

    const handleSelectChange = (selectedOption) => {
        setSelectedCat(selectedOption ? selectedOption.value : null);
    };


    const toggleStatusModal = (badgeId, badgeCat) => {

        // console.log("badgeCat" ,badgeCat);
        // console.log("badgeId",badgeId);
        setBadgeId(badgeId);
        setBadgeCategoryId(badgeCat)
        setStatusModal(!statusModal);
    };

    const closetoggleStatusModal = () => {
        setStatusModal(false);
    };


    const handleCloneBadge = async () => {

        closetoggleStatusModal();
        // if (!selectedCategory) {
        //     alert("Please select a category.");
        //     return;
        // }
        const token = getToken();
        try {
            const response = await axios.post(
                `${BackendAPI}/certificate/cloneCertificate`,
                { badgeId, selectedCat }, // Pass data as the second argument
                {
                    headers: {
                        Authorization: `Bearer ${token}` // Include the token in the Authorization header
                    }
                }
            );

            if (response.status === 200) {
                // alert('Badge cloned successfully!');
                SweetAlert.fire({
                    title: 'Success!',
                    text: 'Certificate Template Clone Successfully!',
                    icon: 'success',
                    timer: 3000,
                    showConfirmButton: false,
                    allowOutsideClick: false,
                    allowEscapeKey: false
                }).then((result) => {
                    if (result.dismiss === SweetAlert.DismissReason.timer) {
                        navigate(`${process.env.PUBLIC_URL}/onsite/manage-certificate/Consoft`);
                    }
                });

            }
        } catch (error) {
            console.error("Failed to clone Certificate:", error);
            alert('Error cloning Certificate. Please try again.');
        }
    };

    const openDeleteModal = (badge) => {
        setBadgeToDelete(badge);
        setModal(true);
    };

    const getSettings = (badge) => [
        ...(CreateBadgePermissions?.edit === 1
            ? [{
                key: '1',
                label: (
                    <div onClick={() => handleEdit(badge)}>
                        <FaEdit /> Edit Certificate
                    </div>
                ),
            }]
            : []
        ),

        ...(CreateBadgePermissions?.edit === 1
            ? [{
                key: '2', // Ensure unique key for each option
                label: (
                    <div onClick={() => handleEditBadgeName(badge)}>
                        <FiEdit2 /> Edit Certificate Name
                    </div>
                )
            }]
            : []
        ),

        ...(CreateBadgePermissions?.delete === 1
            ? [{
                key: '3', // Ensure unique key for each option
                label: (
                    <div onClick={() => openDeleteModal(badge)}>
                        <MdDelete /> Delete Certificate
                    </div>
                )
            }]
            : []
        ),

        ...(CreateBadgePermissions?.edit === 1
            ? [{
                key: '4', // Ensure unique key for each option
                label: (
                    <div onClick={() => toggleStatusModal(badge.badge_id, badge.category_id)}>
                        <FaRegClone /> Clone Certificate
                    </div>
                )
            }]
            : []
        )
        // Add more options if needed
    ];



    return (
        <Fragment>
            <Breadcrumbs mainTitle={
                <>
                    Manage Certificate
                    <MdInfoOutline
                        id="badgePopover"
                        style={{
                            cursor: 'pointer', position: 'absolute', marginLeft: '5px'
                        }}
                    />
                    <UncontrolledPopover
                        placement="bottom"
                        target="badgePopover"
                        trigger="focus"
                    >
                        <PopoverBody>
                            Create and set up a badge for each individual category.
                            The same badge design will be printed for all users related to that category.
                        </PopoverBody>
                    </UncontrolledPopover>
                </>
            } parent="Onsite App" title="Manage Certificate" />
            <Container fluid={true}>
                <Row>
                    {CreateBadgePermissions?.add === 1 && (
                        <Col sm="12">
                            <Card>
                                <CardHeader className="d-flex justify-content-between align-items-center flex-column flex-md-row">
                                    <h5 className="mb-2 mb-md-0">Create Certificate</h5>
                                    {settings.isUserpanel === 'No' && settings.certificate === 'Yes' && settings.certificateWithFeedback === 'Yes' ? (

                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '15px', border: '1px solid gray', borderRadius: '10px', marginTop: '8px' }}>
                                            {/* Link Display */}
                                            <div className="link p-3 " style={{ fontWeight: 'bold', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '100%' }}>
                                                {link}
                                            </div>
                                            <div className='d-flex'>

                                                {/* Copy Icon */}
                                                <div className='mx-2'
                                                    style={{ cursor: 'pointer', color: '#007bff' }}
                                                    onClick={handleCopy}
                                                    title="Copy Link"
                                                >
                                                    <FaCopy size={20} />
                                                </div>

                                                {/* Toast for Copied Link */}
                                                {showToast && (
                                                    <div style={{ position: 'fixed', bottom: '20px', right: '20px', zIndex: 1050 }}>
                                                        <Toast>
                                                            <ToastHeader icon="success">Copied!</ToastHeader>
                                                            <ToastBody>Link copied to clipboard.</ToastBody>
                                                        </Toast>
                                                    </div>
                                                )}

                                                {/* QR Code Icon */}
                                                <div className='mx-2'
                                                    id="qrIcon"
                                                    style={{ cursor: 'pointer', color: '#6c757d' }}
                                                    title="Show QR Code"
                                                >
                                                    <FaQrcode size={20} />
                                                </div>

                                                {/* QR Code Popover */}
                                                <Popover
                                                    placement="top"
                                                    isOpen={popoverOpen}
                                                    target="qrIcon"
                                                    toggle={() => setPopoverOpen(!popoverOpen)}
                                                >
                                                    <PopoverBody>
                                                        <QRCodeCanvas
                                                            value={link} // Dynamic link
                                                            size={150} // QR code size
                                                            bgColor="#ffffff" // Background color
                                                            fgColor="#000000" // Foreground color
                                                            level="H" // Error correction level
                                                        />
                                                    </PopoverBody>
                                                </Popover>
                                            </div>

                                        </div>
                                    ) : null}
                                </CardHeader>
                                <CardBody>
                                    <form onSubmit={handleSubmit}>
                                        <div className="row">
                                            <div className="col-6">
                                                <div className="form-group">
                                                    <label htmlFor="badgeName">Certificate Name:</label>
                                                    <input
                                                        type="text"
                                                        id="badgeName"
                                                        className="form-control"
                                                        value={badgeName}
                                                        onChange={handleBadgeNameChange}
                                                    />
                                                    {nameError && <div className="text-danger">{nameError}</div>}
                                                </div>
                                            </div>
                                            <div className="col-6">
                                                <div className="form-group">
                                                    <label htmlFor="badgeType">Select Category:</label>
                                                    <select
                                                        id="badgeType"
                                                        className="form-control"
                                                        value={badgeType}
                                                        onChange={handleBadgeTypeChange}
                                                        classNamePrefix="react-select"
                                                    >
                                                        <option value="">Select a category</option>
                                                        {categories.map(category => (
                                                            <option key={category.id} value={category.id}>{category.name}</option>
                                                        ))}
                                                    </select>
                                                    {typeError && <div className="text-danger">{typeError}</div>}
                                                </div>
                                            </div>
                                        </div>

                                        <button type="submit" className="btn btn-primary mt-3">Create Certificate</button>
                                    </form>
                                </CardBody>
                            </Card>
                        </Col>
                    )}
                </Row>
                <Row>
                    <Col sm="12">
                        <Card>
                            <CardBody>
                                <div className="table-responsive">
                                    <Table>
                                        <thead>
                                            <tr className="border-bottom-primary">
                                                <th scope="col" className="text-start">Certificate Name</th>
                                                {/* <th scope='col' className='text-start'>Badge Type</th> */}
                                                <th scope="col" className="text-start">Category Name</th>
                                                <th scope="col" className="text-start">Last Updated</th>
                                                <th scope="col" className="text-end">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {createdBadges.length > 0 ? (
                                                createdBadges.map((badge) => (
                                                    <tr key={badge.badge_id} className="border-bottom-primary">
                                                        {/* <td className='text-start'>{badge.badge_name}</td> */}
                                                        <td className="text-start">{badge.badge_name}</td>
                                                        {/* <td className='text-start'>{badge.badge_type || 'N/A'}</td> */}
                                                        <td className="text-start">{badge.category_name}</td>
                                                        <td className="text-start">
                                                            {moment(badge.updated_at).format("YYYY-MM-DD HH:mm:ss")}
                                                        </td>
                                                        {CreateBadgePermissions?.edit === 1 || CreateBadgePermissions?.delete === 1 ? (
                                                            <td className="text-end">
                                                                <Tooltip id="tooltip" globalEventOff="click" />
                                                                <D
                                                                    menu={{ items: getSettings(badge) }} // Pass user to getSettings
                                                                    placement="bottomLeft"
                                                                    arrow
                                                                    trigger={["click"]}
                                                                >
                                                                    <Button color="" size="lg" className="circular">
                                                                        <BsThreeDotsVertical />
                                                                    </Button>
                                                                </D>
                                                            </td>
                                                        ) : null}
                                                    </tr>
                                                ))
                                            ) : (
                                                <tr>
                                                    <td colSpan="4" className="text-center">
                                                        No Data Found
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </Table>
                                </div>
                            </CardBody>
                        </Card>
                    </Col>

                </Row>
            </Container>

            {/* Edit Badge Modal */}
            <Modal isOpen={editModal} toggle={() => setEditModal(!editModal)} centered>
                <ModalHeader toggle={() => setEditModal(!editModal)}>Edit Certificate Name</ModalHeader>
                <ModalBody>
                    <div className="form-group">
                        <label htmlFor="editBadgeName">Certificate Name:</label>
                        <Input
                            type="text"
                            id="editBadgeName"
                            value={editingBadgeName}
                            onChange={(e) => setEditingBadgeName(e.target.value)}
                        />
                    </div>
                </ModalBody>
                <ModalFooter>
                    <Button color="primary" onClick={handleSaveBadgeName}>Save</Button>
                    <Button color="secondary" onClick={() => setEditModal(!editModal)}>Cancel</Button>
                </ModalFooter>
            </Modal>


            {/* Delete Confirmation Modal */}
            <Modal isOpen={modal} toggle={() => setModal(!modal)} centered size="md">
                <ModalHeader toggle={() => setModal(!modal)}>Confirm</ModalHeader>
                <ModalBody>Are you sure you want to delete this Certificate Template?</ModalBody>
                <ModalFooter>
                    <Button color="primary" onClick={handleRemove}>Yes</Button>
                    <Button color="warning" onClick={() => setModal(!modal)}>No</Button>
                </ModalFooter>
            </Modal>

            {/* Clone Badge Modal */}
            <Modal isOpen={statusModal} toggle={closetoggleStatusModal} centered size="md">
                <ModalHeader toggle={closetoggleStatusModal}>Confirmation</ModalHeader>
                <ModalBody>
                    <div className='ms-2'>
                        <p><strong>Alert: Clone Certificate</strong></p>
                        {/* <p>
                            Are you sure you want to inactive the <strong>{selectedCatname}</strong> category ?<br /><br />

                            If you proceed, the <strong>{selectedCatname}</strong> category will become Inactive, and all users assigned to this category will be automatically transferred to the selected replacement category. <br />
                            Please select the replacement category.                        </p> */}
                        <p>Are you sure you want to continue?</p>
                    </div>

                    <FormGroup>
                        <Label for="categorySelect">Select Certificate Category:</Label>
                        <Select
                            id="categorySelect"
                            value={catData.find(option => option.value === selectedCat)}
                            onChange={handleSelectChange}
                            options={catData
                                .filter(option => option.id !== parseInt(badgeCategoryId)) // Convert to a number if necessary
                                .map(pref => ({ value: pref.id, label: pref.Cat }))}
                            isSearchable={true}
                            classNamePrefix="react-select"
                        />

                    </FormGroup>
                </ModalBody>
                <ModalFooter>
                    <Button color="primary" onClick={handleCloneBadge}>Clone Certificate</Button>
                    <Button color="danger" onClick={closetoggleStatusModal}>No</Button>
                </ModalFooter>
            </Modal>
        </Fragment>
    );
};

export default CreateCertificate;
