import React, { Fragment, useEffect, useState } from 'react';
import { Container, Row, Col, Button, Card, CardBody, CardHeader, FormFeedback, Input, FormGroup, Label, Modal, ModalBody, ModalHeader, ModalFooter, Table, Media } from 'reactstrap';
import { Form, Field } from 'react-final-form';
import useAuth from '../../Auth/protectedAuth';
import Select from 'react-select';
import { getToken } from '../../Auth/Auth';
import axios from 'axios';
import { BackendAPI } from '../../api';
import { Breadcrumbs } from '../../AbstractElements';
import { useLocation } from 'react-router-dom';
import { required, Name, option } from '../Utils/validationUtils';
import DatePicker from 'react-datepicker';
import { FaEdit, FaPlus } from 'react-icons/fa';
import { MdDelete } from "react-icons/md";
import SweetAlert from 'sweetalert2';
import { Link, useNavigate } from 'react-router-dom';
import { FaUserTie, FaIdCard, FaTicketAlt, FaCheckCircle } from 'react-icons/fa'; // Importing the required React Icons

const composeValidators = (...validators) => value =>
    validators.reduce((error, validator) => error || validator(value), undefined);

const Allocateuser = () => {
    useAuth();
    const location = useLocation();
    const { ticket } = location.state;

    const [loading, setLoading] = useState(true);
    const [modal, setModal] = useState(false);
    const [tickets, setTickets] = useState([]); // 
    const [regCat, setRegCat] = useState([]);
    const [users, setUsers] = useState([]); // State to store the fetched user data
    const [selectedPartner, setSelectedPartner] = useState(null); // State to store the selected user
    const [partner2Details, setPartner2Details] = useState(null);
    const [partners, setPartners] = useState([]);

    const options = [
        { value: '0', label: 'Other' },
        { value: '1', label: 'Workshop' },
        { value: '2', label: 'Accompany Person' }
    ];

    console.log("addons", ticket);

    // Effect to update the selected option in case addon.addon_cat_type changes
    // useEffect(() => {
    //     if (addon.addon_cat_type !== undefined) {
    //         setAddonCategory(String(addon.addon_cat_type));
    //     }
    // }, [addon.addon_cat_type]);




    const fetchDropdown = async () => {
        try {
            const token = getToken();
            const response = await axios.get(`${BackendAPI}/addonRoutes/getDropdownData`, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
            // setData(response.data);
            setLoading(false);

            const { regCategory: fetchregcat, regtype: fetchcatgorie, tickets: fetchTicket, workshop: fetchworkshop, workshoptype: fetchworkshoptype } = response.data;




            const regCatOptions = fetchregcat.map(pref => ({
                value: pref.cs_reg_cat_id,
                label: pref.cs_reg_category,
            }));

            // Populate ticket options
            const ticketOptions = fetchTicket.map(ticket => ({
                value: ticket.ticket_id,
                label: ticket.ticket_title,
            }));

            console.log("ticketOptions", ticketOptions);

            setRegCat(regCatOptions);
            setTickets(ticketOptions);

        } catch (error) {
            console.error('Error fetching dropdown data:', error);
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDropdown();
    }, []);

    useEffect(() => {
        const fetchPartner = async () => {
            try {
                const token = getToken(); // Retrieve the token

                const response = await axios.get(`${BackendAPI}/allocation/partners`, {
                    headers: {
                        Authorization: `Bearer ${token}`, // Send the token in the Authorization header
                    },
                });

                if (response.status === 200) {
                    console.log("Response Data:", response.data);
                    setPartners(response.data); // Update state with partner data

                    if (ticket.partner_assigned === 1) {
                        console.log("Debug: ticket.partner_assigned is 1", ticket.partner_assigned);
                        
                        // Debug: Log ticket details
                        console.log("Debug: ticket object:", ticket);
                    
                        // Debug: Log partners array
                        console.log("Debug: partners array:", partners);
                    
                        // Find the partner
                        const partner = response.data.find(
                            (partner) => partner.p1_userid === ticket.id || partner.p2_userid === ticket.id
                        );
                    
                        // Debug: Log the result of the find operation
                        console.log("Debug: Found partner object:", partner);
                    
                        if (partner) {
                            // Construct label and value for selected partner
                            const label = `${partner.p1_userid === ticket.id ? partner.p2_userid : partner.p1_userid} -- ${partner.p1_userid === ticket.id ? partner.p2_name : partner.p1_name}`;
                            const value = partner.p1_userid === ticket.id ? partner.p2_userid : partner.p1_userid;
                    
                            // Debug: Log the constructed label and value
                            console.log("Debug: Constructed label:", label);
                            console.log("Debug: Constructed value:", value);
                    
                            // Call handleChange with the formatted label and value
                            handleChange({ label, value });
                        } else {
                            console.warn("Debug: No partner found for the given ticket ID");
                        }
                    }
                }
            } catch (err) {
                console.error("Error fetching partners:", err); // Log the error for debugging

            }
        };

        fetchPartner();
    }, []);

    useEffect(() => {
        // Check if ticket.cs_ticket is available
        if (ticket.cs_ticket) {
            // Call the handleAssignTicket function with the current ticket.cs_ticket
            handleAssignTicket(ticket.cs_ticket);
        }
    }, [ticket.cs_ticket]); // Dependency array ensures the effect runs when ticket.cs_ticket changes

    const handleAssignTicket = async (ticketId) => {
        if (!ticketId) {
            return; // If no ticket is provided, do nothing
        }

        try {
            const token = getToken();
            const response = await axios.post(`${BackendAPI}/allocation/notassigneduser`, {
                userid: ticket.id, // Use the provided ticketId
                ticketId: ticketId,
                allocated : ticket.partner_assigned
            }, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            const userData = response.data.data; // Assuming the response structure is { data: [users] }

            // Update the state with the fetched user data
            setUsers(userData);
        } catch (error) {
            console.error('Error assigning ticket:', error);
        }
    };

    const handleChange = (selectedOption) => {
        console.log("selectedOption",selectedOption);
        setSelectedPartner(selectedOption); // Update selected partner

        // Find the corresponding user details in the users array
        const matchedUser = users.find(user => user.id === selectedOption.value);

        if (matchedUser) {
            setPartner2Details(matchedUser); // Store the full details of partner2
        } else {
            console.warn('No matching user found for selected partner.');
        }
    };

    // Map through users and concatenate their first name and last name for dropdown display
    const partnerOptions = users.map(user => ({
        label: `${ user.id} -- ${user.cs_first_name} ${user.cs_last_name}`, // Concatenate first and last names
        value: user.id, // Use user ID as the value
    }));


    const handleSubmit = async () => {
        if (!selectedPartner) {
            alert('Please select a partner before submitting.');
            return;
        }

        // Construct the payload
        const payload = {
            userId: ticket.id, // User ID for the current ticket
            partner1: {
                ...ticket, // Include all ticket details
            },
            partner2: partner2Details ? { ...partner2Details } : {}, // Include full details of partner2
        };

        console.log("payload", payload);


        try {
            // Send the data to the backend
            const token = getToken();
            const response = await axios.post(`${BackendAPI}/allocation/edit-allocatedpartner`, payload, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            if (response.status === 200) {
                alert('Partner successfully updated.');
                // Optionally, redirect or reload data
            } else {
                alert('Failed to update the partner.');
            }
        } catch (error) {
            console.error('Error updating partner:', error);
            alert('An error occurred while submitting the data.');
        }
    };

    return (
        <Fragment>
            <Breadcrumbs mainTitle="Edit Add-on" parent="Manage Addon" title="Edit Add-on" />
            <Container fluid={true}>
                <Row className='justify-content-center'>
                    <Col sm="8">
                        <Card>
                            <CardBody>
                                <div className="d-flex justify-content-between align-tickets-center mb-4">
                                    <div className="partner-name d-flex align-tickets-center" style={{ fontWeight: 'bold', fontSize: '18px', color: '#333' }}>
                                        <FaUserTie className="me-2" style={{ fontSize: '22px', color: '#4A90E2' }} />
                                        Partner 1
                                    </div>
                                    <div className="user-name" style={{ fontSize: '16px', color: '#555' }}>
                                        {ticket.cs_first_name} {ticket.cs_last_name}
                                    </div>
                                </div>

                                {/* Registration Number */}
                                <div className="d-flex justify-content-between align-tickets-center mb-4">
                                    <div className="regno-label" style={{ fontWeight: '500', fontSize: '16px', color: '#777' }}>
                                        <FaIdCard className="me-2" style={{ color: '#4A90E2' }} />
                                        Registration No:
                                    </div>
                                    <div className="regno-value" style={{ fontWeight: '500', fontSize: '16px', color: '#333' }}>
                                        {ticket.cs_regno}
                                    </div>
                                </div>

                                {/* Ticket Name */}
                                <div className="d-flex justify-content-between align-tickets-center mb-4">
                                    <div className="ticket-label" style={{ fontWeight: '500', fontSize: '16px', color: '#777' }}>
                                        <FaTicketAlt className="me-2" style={{ color: '#4A90E2' }} />
                                        Ticket:
                                    </div>
                                    <div className="ticket-name" style={{ fontWeight: '500', fontSize: '16px', color: '#333' }}>
                                        {tickets.find(option => option.value === parseInt(ticket.cs_ticket, 10))?.label || "N/A"}
                                    </div>
                                </div>

                                <div>
                                    <h3>Select Partner</h3>
                                    <Select
                                        options={partnerOptions} // Dropdown options
                                        value={selectedPartner} // Selected value
                                        onChange={handleChange} // Handle change
                                        placeholder="Select a Partner"
                                    />
                                    <div>
                                        {selectedPartner ? (
                                            <p>Selected Partner: {selectedPartner.label}</p> // Display selected partner
                                        ) : (
                                            <p>No partner selected</p>
                                        )}
                                    </div>
                                </div>

                                <div className="mt-4 text-center">
                                    <Button color="primary" onClick={handleSubmit}>Submit</Button>
                                </div>

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
            </Modal>
        </Fragment>
    );
};

export default Allocateuser;
