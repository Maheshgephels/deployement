import React, { Fragment, useState, useEffect } from 'react';
import { Container, Row, Col, Button, Card, CardBody, Badge, Table } from 'reactstrap';
import axios from 'axios';
import { BackendAPI } from '../../api';
import { Breadcrumbs } from '../../AbstractElements';
import { useNavigate, useLocation } from 'react-router-dom';
import moment from 'moment';
import { getToken } from '../../Auth/Auth';
import useAuth from '../../Auth/protectedAuth';

const ViewAddon = () => {
    useAuth();
    const [addonData, setAddonData] = useState(null); // Renamed from ticketData
    const [durationData, setDurationData] = useState([]); // No change needed
    const [ticket, setTicket] = useState([]);
    const navigate = useNavigate();
    const location = useLocation();
    const item = location.state;
    const [isExpanded, setIsExpanded] = useState(false);
    const [gstfee, setgstfee] = useState();
    const [gstinclded, setgstinclded] = useState();
    const [gstamount, setgstamount] = useState();
    const [gstpercentage, setgstpercentage] = useState(18);
    const [processingfeein, setprocessingfeein] = useState();
    const [processinginclded, setprocessinginclded] = useState();
    const [currency, setcurrency] = useState();
    const [processingfeeornot, setprocessingfeeornot] = useState();
    const [processingAmount, setProcessingAmount] = useState(0);
    const [processingFee, setProcessingFee] = useState(0);

    console.log("Addon", addonData);
    console.log("Ticketdata", ticket);


    useEffect(() => {
        const fetchData = async () => {
            if (!item || !item.addonId) return;

            try {
                const token = getToken();
                const response = await axios.get(`${BackendAPI}/addonRoutes/fetchaddonData/${item.addonId}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });

                const { addon, durations } = response.data;
                setAddonData(addon); // Updated to set addon data
                setDurationData(durations);
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
           
            const fetchcurrency = response.data.currency[0];
            const fetchgstfee = response.data.gstfee[0];
            const fetchgstinclded = response.data.gstinclded[0];
            const fetchprocessingfeein = response.data.processingfeein[0];
            const fetchprocessinginclded = response.data.processinginclded[0];
            const fetchprocessingfeeornot = response.data.processingfeeornot[0];
            const fetchgstamount = response.data.gstamount[0];
            const fetchProcessingFee = response.data.processingFees[0];

            setProcessingFee(fetchProcessingFee);
            setcurrency(fetchcurrency.cs_value);
            setgstfee(fetchgstfee.cs_value);
            setgstinclded(fetchgstinclded.cs_value);
            setprocessingfeein(fetchprocessingfeein.cs_value);
            setprocessinginclded(fetchprocessinginclded.cs_value);
            setprocessingfeeornot(fetchprocessingfeeornot.cs_value);
            setgstpercentage(fetchgstamount.cs_value);
            setTicket(fetchTicket);
        } catch (error) {
            console.error('Error fetching dropdown data:', error);
        }
    };

    useEffect(() => {
        fetchDropdown();
    }, []);

    const handleNavigation = () => {
        navigate(`${process.env.PUBLIC_URL}/registration/manage-addon/Consoft`);
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

    const calculateAmounts = (amount) => {
        console.log("Initial amount:", amount);

        let gstAmount = 0;
        let processingAmount = 0;
        let regAmount = parseFloat(amount) || 0;;  // Initialize regAmount with the base ticket amount
        // let totalAmount = amount;  // Initialize totalAmount with the base ticket amount
        let totalAmount = parseFloat(amount) || 0;

        // Calculate GST and adjust regAmount
        if (gstfee === 'Yes') {
            if (gstinclded === 'Yes') {
                if (processingfeeornot === 'Yes') {
                    console.log("processinginclded",processinginclded);
                    if (processinginclded === 'Include') {
                        // Eliminate processing fee before calculating GST
                      
                        let baseAmountWithoutProcessing = amount;

                        // Calculate processing fee if applicable
                        if (processingfeein === 'Percentage') {
                            processingAmount = (amount * parseFloat(processingFee.cs_value)) / 100;
                            console.log("processingAmount (Percentage):", processingAmount);
                        } else {
                            processingAmount = parseFloat(processingFee.cs_value);
                            console.log("processingAmount (Fixed):", processingAmount);
                        }

                        baseAmountWithoutProcessing -= processingAmount;  // Subtract processing fee from base amount
                        console.log("baseAmountWithoutProcessing", baseAmountWithoutProcessing);
                        // Calculate GST after removing processing fee
                        gstAmount = (baseAmountWithoutProcessing * parseFloat(gstpercentage)) / 100;
                        regAmount = baseAmountWithoutProcessing - gstAmount; // Adjust regAmount after GST
                        console.log("GST included with processing fee:", gstAmount);
                        console.log("Adjusted regAmount after GST:", regAmount);
                    }
                }
                    else {
                        // If processing fee is not included, calculate GST directly on the amount
                        gstAmount = (amount * parseFloat(gstpercentage)) / 100;
                        regAmount = amount - gstAmount;  // Adjust regAmount after GST
                        console.log("GST without processing fee:", gstAmount);
                        console.log("Adjusted regAmount without GST:", regAmount);
                    }
                
            }
            else {
                // If GST is excluded, calculate normally
                gstAmount = (amount * parseFloat(gstpercentage)) / 100;
                totalAmount += gstAmount;  // Add GST to total if excluded
                console.log("GST excluded, totalAmount now:", totalAmount);
            }

        }

        // Calculate processing fee
        if (processingfeeornot === 'Yes') {
            if (processinginclded === 'Exclude') {
                processingAmount =
                    processingfeein === 'Percentage'
                        ? (totalAmount * parseFloat(processingFee.cs_value)) / 100
                        : parseFloat(processingFee.cs_value);

                totalAmount += processingAmount;  // Add processing fee if excluded
                console.log("Processing fee added to totalAmount:", processingAmount);
            } else {
                // Processing fee already considered for regAmount when included
                if (processingfeein !== 'Percentage') {
                    processingAmount = parseFloat(processingFee.cs_value);
                    console.log("Processing fee considered already in regAmount:", processingAmount);
                }
            }
        }

        // Log the final calculated amounts to the console
        console.log("Final gstAmount:", gstAmount);
        console.log("Final processingAmount:", processingAmount);
        console.log("Final regAmount:", regAmount);
        console.log("Final totalAmount:", totalAmount);

        // Return calculated amounts
        return {
            gstAmount: gstAmount,
            processingAmount: processingAmount,
            regAmount: regAmount,
            totalAmount: totalAmount
        };
    };

    return (
        <Fragment>
            <Breadcrumbs parentClickHandler={handleNavigation} mainTitle="View Add-on" parent="Manage Add-on" title="View Add-on" />
            <Container fluid>
                <Row>
                    <Col sm="12">
                        <Card>
                            <CardBody>
                                {addonData && (
                                    <Fragment>
                                        <div className='mb-3'>
                                            <Badge
                                                color={
                                                    addonData.addon_status === 'Open' ? 'success' :
                                                        addonData.addon_status === 'Close' ? 'danger' :
                                                            addonData.addon_status === 'SoldOut' ? 'warning' :
                                                                'dark'
                                                }
                                                style={{ fontSize: '1rem', padding: '0.25rem 0.5rem' }}
                                            >
                                                {addonData.addon_status}
                                            </Badge>

                                            <Badge
                                                color={addonData.addon_visiblility === 1 ? 'secondary' : 'success'}
                                                style={{ fontSize: '1rem', padding: '0.25rem 0.5rem' }}
                                            >
                                                {addonData.addon_visiblility === 1 ? 'Hide' : 'Unhide'}
                                            </Badge>
                                        </div>

                                        <div className="d-flex align-items-center mb-3">
                                            <h3>{addonData.addon_title || 'No Title'}</h3>
                                            <medium className='ms-2' color='success'>
                                                {addonData.addon_ispaid === 1 ? '(Paid)' : '(Free)'}
                                            </medium>
                                        </div>

                                        <Table className="mt-4">
                                            <tbody>
                                                <tr>
                                                    <td>Description</td>
                                                    <td>
                                                        {addonData.addon_description ? (
                                                            isExpanded ? (
                                                                <span>
                                                                    {addonData.addon_description}
                                                                    <a onClick={toggleDescription} style={{ padding: 0, cursor: 'pointer', marginLeft: '5px' }}>
                                                                        <strong>Read Less</strong>
                                                                    </a>
                                                                </span>
                                                            ) : (
                                                                addonData.addon_description.length > 100 ? (
                                                                    <span>
                                                                        {getTruncatedDescription(addonData.addon_description)}
                                                                        <a onClick={toggleDescription} style={{ padding: 0, cursor: 'pointer', marginLeft: '5px' }}>
                                                                            <strong>Read More</strong>
                                                                        </a>
                                                                    </span>
                                                                ) : (
                                                                    <span>{addonData.addon_description}</span>
                                                                )
                                                            )
                                                        ) : (
                                                            <span>No Description</span>
                                                        )}
                                                    </td>
                                                </tr>
                                                <tr>
                                                    <td>Tickets</td>
                                                    <td>
                                                        {
                                                            addonData.addon_ticket_ids === null || addonData.addon_ticket_ids.length === 0
                                                                ? 'No Ticket'
                                                                : (() => {
                                                                    let tickets = [];

                                                                    try {
                                                                        // Step 1: Extract IDs from the string "{18,19,20}"
                                                                        if (typeof addonData.addon_ticket_ids === 'string') {
                                                                            tickets = addonData.addon_ticket_ids
                                                                                .replace(/[{}]/g, '')  // Remove braces
                                                                                .split(',')            // Split by comma
                                                                                .map(id => parseInt(id.trim(), 10));  // Convert each ID to a number
                                                                        } else {
                                                                            tickets = addonData.addon_ticket_ids;
                                                                        }
                                                                    } catch (e) {
                                                                        console.error('Error parsing ticket IDs:', e);
                                                                    }

                                                                    // Step 2: Ensure tickets is an array of numbers
                                                                    tickets = Array.isArray(tickets) ? tickets : [tickets];

                                                                    // Step 3: Find matching ticket titles
                                                                    const matchedTickets = ticket
                                                                        ? ticket
                                                                            .filter(t => tickets.includes(t.ticket_id)) // Filter by ticket_id
                                                                            .map(t => t.ticket_title) // Extract ticket_title
                                                                        : [];

                                                                    // Return matched ticket titles or 'No Ticket' if none found
                                                                    return matchedTickets.length > 0
                                                                        ? matchedTickets.join(', ')
                                                                        : 'No Ticket';
                                                                })()
                                                        }
                                                    </td>
                                                </tr>

                                                <tr>
                                                    <td>Addon Type</td>
                                                    <td>{addonData.addon_type || 'N/A'}</td>
                                                </tr>
                                                <tr>
                                                    <td>Registration Type</td>
                                                    <td>{addonData.addon_cat_type === "1" ? "Residential" : "Non-residential"}</td>
                                                </tr>
                                                <tr>
                                                    <td>Addon Seats</td>
                                                    <td>
                                                        {
                                                            addonData.addon_type === 'Limited' && addonData.addon_count
                                                                ? `${addonData.addon_type} ${addonData.addon_count} seats` || 'N/A'
                                                                : addonData.addon_type || 'N/A'
                                                        }
                                                    </td>
                                                </tr>



                                            </tbody>
                                        </Table>

                                        {/* <Table className="mt-4 table-striped">
                                            <thead>
                                                <tr>
                                                    <th>Duration Name</th>
                                                    <th>Start Date</th>
                                                    <th>End Date</th>
                                                    <th>Amount</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {durationData.map((duration, index) => (
                                                    <tr key={duration.addon_duration_id || index}>
                                                        <td>{duration.addon_duration_name || 'N/A'}</td>
                                                        <td>{duration.addon_duration_start_date ? moment(duration.addon_duration_start_date).format('DD-MM-YYYY') : 'N/A'}</td>
                                                        <td>{duration.addon_duration_till_date ? moment(duration.addon_duration_till_date).format('DD-MM-YYYY') : 'N/A'}</td>
                                                    
                                                           <td>{duration.addon_amount ? `${duration.addon_amount}` : 'N/A'}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </Table> */}
                                        <Table className="mt-4 table-striped">
                                            <thead>
                                                <tr>
                                                    <th>Duration Name</th>
                                                    <th>Start Date</th>
                                                    <th>End Date</th>
                                                    <th>Ticket Amount</th>
                                                    <th>GST Amount</th>
                                                    <th>Processing Fee</th>
                                                    <th>Total Amount</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {durationData.map((duration, index) => {
                                                    const { gstAmount, processingAmount, totalAmount,regAmount } = calculateAmounts(duration.addon_amount);

                                                    return (
                                                        
                                                         <tr key={duration.addon_duration_id || index}>
                                                        <td>{duration.addon_duration_name || 'N/A'}</td>
                                                        <td>{duration.addon_duration_start_date ? moment(duration.addon_duration_start_date).format('DD-MM-YYYY') : 'N/A'}</td>
                                                        <td>{duration.addon_duration_till_date ? moment(duration.addon_duration_till_date).format('DD-MM-YYYY') : 'N/A'}</td>
                                                    
                                                    
                                                            <td>{regAmount > 0 ? `${regAmount.toFixed(2)} ${currency}` : 'N/A'}</td>
                                                            <td>{gstAmount > 0 ? `${gstAmount.toFixed(2)} ${currency}` : 'N/A'}</td>
                                                            <td>{processingAmount > 0 ? `${processingAmount.toFixed(2)} ${currency}` : 'N/A'}</td>
                                                            <td>{totalAmount > 0 ? `${totalAmount.toFixed(2)} ${currency}` : 'N/A'}</td> {/* Uncomment this line */}
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </Table>

                                    </Fragment>
                                )}
                                {!addonData && <p>Loading addon details...</p>}
                            </CardBody>
                        </Card>
                    </Col>
                </Row>
            </Container>
        </Fragment>
    );
};

export default ViewAddon;
