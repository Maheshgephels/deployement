import React, { Fragment, useState, useEffect } from 'react';
import { Container, Row, Col, Button, Card, CardBody, Badge, Table } from 'reactstrap';
import axios from 'axios';
import { BackendAPI } from '../../api';
import { Breadcrumbs } from '../../AbstractElements';
import { useNavigate, useLocation } from 'react-router-dom';
import moment from 'moment';
import { getToken } from '../../Auth/Auth';
import useAuth from '../../Auth/protectedAuth';

const ViewDiscount = () => {
    useAuth();
    const [discountData, setDiscountData] = useState(null); // Renamed from ticketData
    const [ticket, setTicket] = useState([]);
    const navigate = useNavigate();
    const location = useLocation();
    const item = location.state;
    const [isExpanded, setIsExpanded] = useState(false);

    console.log("Discount", discountData);

    useEffect(() => {
        const fetchData = async () => {
            if (!item || !item.discountId) return;

            try {
                const token = getToken();
                const response = await axios.get(`${BackendAPI}/discountRoutes/fetchdiscountData/${item.discountId}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });

                const { discount } = response.data;
                setDiscountData(discount); // Updated to set addon data
            } catch (error) {
                console.error('Error fetching addon data:', error.message);
            }
        };

        fetchData();
    }, [item]);

    const fetchDropdown = async () => {
        try {
            const token = getToken();
            const response = await axios.get(`${BackendAPI}/ticketRoutes/getDropdownData`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            const { ticket: fetchTicket } = response.data;
            setTicket(fetchTicket);
        } catch (error) {
            console.error('Error fetching dropdown data:', error);
        }
    };

    useEffect(() => {
        fetchDropdown();
    }, []);



    const handleNavigation = () => {
        navigate(`${process.env.PUBLIC_URL}/registration/manage-discount/Consoft`);
    };

    const toggleDescription = () => {
        setIsExpanded(!isExpanded);
    };

    const getTruncatedDescription = (description) => {
        const words = description.split(' ');
        if (words.length > 25) {
            return words.slice(0, 25).join(' ') + '...';
        }
        return description;
    };

    return (
        <Fragment>
            <Breadcrumbs parentClickHandler={handleNavigation} mainTitle="View Discount" parent="Manage Discount" title="View Discount" />
            <Container fluid>
                <Row>
                    <Col sm="12">
                        <Card>
                            <CardBody>
                                {discountData && (
                                    <Fragment>
                                        <div className='mb-3'>
                                            <Badge
                                                color={discountData.status === 1 ? 'success' : 'danger'}
                                                style={{ fontSize: '1rem', padding: '0.25rem 0.5rem' }}
                                            >
                                                {discountData.status === 1 ? 'Active' : 'Inactive'}
                                            </Badge>
                                        </div>

                                        <div className="d-flex align-items-center mb-3">
                                            <h3>{discountData.discount_code || 'No Title'}</h3>
                                        </div>

                                        <Table className="mt-4">
                                            <tbody>
                                                <tr>
                                                    <td>Discount Code</td>
                                                    <td><strong>{discountData.discount_code || 'N/A'}</strong></td>
                                                </tr>
                                                <tr>
                                                    <td>Tickets</td>
                                                    <td>
                                                        {
                                                            discountData.discount_ticket_ids === null || discountData.discount_ticket_ids.length === 0
                                                                ? 'No Ticket'
                                                                : (() => {
                                                                    let tickets = [];
                                                                    try {
                                                                        if (typeof discountData.discount_ticket_ids === 'string') {
                                                                            tickets = discountData.discount_ticket_ids
                                                                                .replace(/[{}]/g, '')
                                                                                .split(',')
                                                                                .map(id => parseInt(id.trim(), 10));
                                                                        } else {
                                                                            tickets = discountData.discount_ticket_ids;
                                                                        }
                                                                    } catch (e) {
                                                                        console.error('Error parsing ticket IDs:', e);
                                                                    }

                                                                    tickets = Array.isArray(tickets) ? tickets : [tickets];

                                                                    const matchedTickets = ticket
                                                                        ? ticket.filter(t => tickets.includes(t.ticket_id)).map(t => t.ticket_title)
                                                                        : [];

                                                                    return matchedTickets.length > 0
                                                                        ? matchedTickets.join(', ')
                                                                        : 'No Ticket';
                                                                })()
                                                        }
                                                    </td>
                                                </tr>
                                                <tr>
                                                    <td>Discount Type</td>
                                                    <td>{discountData.discount_type || 'N/A'}</td>
                                                </tr>

                                                {discountData.discount_type === 'percentage' && (
                                                    <>
                                                        <tr>
                                                            <td>Discount Percentage</td>
                                                            <td>{discountData.discount_percentage ? discountData.discount_percentage + '%' : 'N/A'}</td>
                                                        </tr>
                                                        <tr>
                                                            <td>Maximum Discount Value</td>
                                                            <td>{discountData.discount_max_limit || 'N/A'}</td>
                                                        </tr>
                                                    </>
                                                )}


                                                {discountData.discount_type === 'flat' && (
                                                    <>
                                                        <tr>
                                                            <td>Flat Discount Amount</td>
                                                            <td>{discountData.discount_amount || 'N/A'}</td>
                                                        </tr>
                                                    </>
                                                )}

                                                <tr>
                                                    <td>Discount Seats</td>
                                                    <td>
                                                        {
                                                            discountData.discount_seat_type === 'Limited' && discountData.discount_count
                                                                ? `${discountData.discount_seat_type} ${discountData.discount_count} seats`
                                                                : discountData.discount_seat_type || 'N/A'
                                                        }
                                                    </td>
                                                </tr>

                                                {/* Displaying dates */}
                                                <tr>
                                                    <td>Start Date</td>
                                                    <td>{moment(discountData.discount_start_datetime).format('DD-MM-YYYY, h:mm A') || 'N/A'}</td>
                                                </tr>
                                                <tr>
                                                    <td>End Date</td>
                                                    <td>{moment(discountData.discount_end_datetime).format('DD-MM-YYYY, h:mm A') || 'N/A'}</td>
                                                </tr>

                                                {discountData.discount_eligibility === '1' && (
                                                    <tr>
                                                        <td>Discount Eligibility</td>
                                                        <td>All Users</td>
                                                    </tr>
                                                )}
                                                {discountData.discount_redemption_level === '1' ? (
                                                    <tr>
                                                        <td>Discount Redemption Level</td>
                                                        <td>Entire Order</td>
                                                    </tr>
                                                ) : (
                                                    <tr>
                                                        <td>Discount Redemption Level</td>
                                                        <td>Individual Tickets</td>
                                                    </tr>
                                                )}

                                            </tbody>
                                        </Table>

                                        {discountData.discount_eligibility === '2' && (
                                            <Table className="mt-4 table-striped">
                                                <thead>
                                                    <tr>
                                                        <th>Discount Eligible Emails</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {discountData.discount_emails && discountData.discount_emails.trim() ? (
                                                        discountData.discount_emails
                                                            .replace(/[{}"]/g, '') // Remove braces and quotes
                                                            .split(',') // Split the emails by commas
                                                            .map((email, index) => (
                                                                <tr key={index}>
                                                                    <td>{email.trim() || 'No emails provided'}</td> {/* Trim spaces and display */}
                                                                </tr>
                                                            ))
                                                    ) : (
                                                        <tr>
                                                            <td>No emails provided</td>
                                                        </tr>
                                                    )}
                                                </tbody>
                                            </Table>
                                        )}
                                    </Fragment>

                                )}
                                {!discountData && <p>Loading discount details...</p>}
                            </CardBody>
                        </Card>
                    </Col>
                </Row>
            </Container>
        </Fragment>
    );
};

export default ViewDiscount;
