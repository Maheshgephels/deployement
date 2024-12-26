// import React, { Fragment, useState, useEffect } from 'react';
// import { Container, Row, Col, Button, Card, CardBody, Modal, ModalHeader, ModalBody, ModalFooter, Badge } from 'reactstrap';
// import axios from 'axios';
// import { BackendAPI } from '../../api';
// import SweetAlert from 'sweetalert2';
// import { Breadcrumbs } from '../../AbstractElements';
// import { useNavigate, useLocation } from 'react-router-dom';
// import { getToken } from '../../Auth/Auth';
// import useAuth from '../../Auth/protectedAuth';

// const ViewTicket = () => {
//     useAuth();
//     const [ticketData, setTicketData] = useState(null);   // To store the ticket data
//     const [durationData, setDurationData] = useState([]); // To store the duration data
//     const navigate = useNavigate();
//     const location = useLocation();
//     const item = location.state; // Default to empty object
//     const [regCat, setRegCat] = useState([]);
//     const [Cattype, setCattype] = useState([]);


//     console.log("Ticket Data", ticketData);

//     useEffect(() => {
//         const fetchData = async () => {
//             if (!item || !item.ticketId) return; // Ensure item and ID are valid

//             try {
//                 const token = getToken();
//                 const response = await axios.get(`${BackendAPI}/ticketRoutes/fetchticketData/${item.ticketId}`, {
//                     headers: {
//                         Authorization: `Bearer ${token}`
//                     }
//                 });

//                 // Assuming response contains both 'ticket' and 'durations'
//                 const { ticket, durations } = response.data;
//                 setTicketData(ticket);        // Set the ticket data to state
//                 setDurationData(durations);   // Set the durations to state
//             } catch (error) {
//                 console.error('Error fetching ticket data:', error.message);
//             }
//         };

//         fetchData();
//     }, [item]);

//     const fetchDropdown = async () => {
//         try {
//             const token = getToken();
//             const response = await axios.get(`${BackendAPI}/ticketRoutes/getDropdownData`, {
//                 headers: {
//                     Authorization: `Bearer ${token}`
//                 }
//             });


//             const { regCategory: fetchregcat, regtype: fetchcatgorie } = response.data;

//             setRegCat(fetchregcat);
//             setCattype(fetchcatgorie);

//         } catch (error) {
//             console.error('Error fetching dropdown data:', error);

//         }
//     };

//     useEffect(() => {
//         fetchDropdown();
//     }, []);

//     const handleNavigation = () => {
//         navigate(`${process.env.PUBLIC_URL}/manage-facility/Consoft`);
//     };

//     const getVisibilityText = (visibility) => visibility === '1' ? 'Show' : 'Hide';

//     return (
//         <Fragment>
//             <Breadcrumbs parentClickHandler={handleNavigation} mainTitle="View Ticket" parent="Manage Facility" title="View Ticket" />
//             <Container fluid={true}>
//                 <Row>
//                     <Col sm="12">
//                         <Card>
//                             <CardBody>
//                                 {/* Box with border */}

//                                 {/* Oval buttons */}
//                                 {ticketData ? (
//                                     <Fragment>
//                                         {ticketData.ticket_status === 'Open' ? (
//                                             <Badge color="success">
//                                                 Open
//                                             </Badge>
//                                         ) : ticketData.ticket_status === 'Close' ? (
//                                             <Badge color="danger">
//                                                 Close
//                                             </Badge>
//                                         ) : ticketData.ticket_status === 'SoldOut' ? (
//                                             <Badge color="warning">
//                                                 Sold Out
//                                             </Badge>
//                                         ) : (
//                                             <Badge color="dark">
//                                                 Unknown Status
//                                             </Badge>
//                                         )}


//                                         {ticketData.ticket_visibility === 1 ? (
//                                             <Badge color="secondary">
//                                                 Hide
//                                             </Badge>
//                                         ) : (
//                                             <Badge color="success">
//                                                 Unhide
//                                             </Badge>
//                                         )}


//                                         {/* Ticket Information */}
//                                         <h3 style={{ marginBottom: '20px', color: '#495057', fontWeight: '600' }}>
//                                             {ticketData.ticket_title || 'No Title'}
//                                         </h3>
//                                         <Row style={{ borderBottom: '1px solid #e3e3e3', paddingBottom: '10px', marginBottom: '15px' }}>
//                                             <Col md="12"><strong>Description:</strong> {ticketData.ticket_description || 'No Description'}</Col>
//                                             {/* <Col md="6"><strong>Number of Tickets:</strong> {ticketData.number_of_tickets || 'N/A'}</Col> */}
//                                         </Row>
//                                         {/*  <p><strong>Category:</strong> {ticketData.ticket_category === null ? 'No Category' : ticketData.ticket_category || 'No Category'}</p>
//                                             <p><strong>Number of Tickets:</strong> {ticketData.number_of_tickets || 'N/A'}</p>
//                                             <p><strong>Type:</strong> {ticketData.reg_typeid || 'N/A'}</p>
//                                             <p><strong>Number of seats:</strong> {ticketData.ticket_type === 'Unlimited' ? 'Unlimited' : ticketData.ticket_count || 'N/A'}</p>
//                                             <p><strong>Maximum Buying Limit:</strong> {ticketData.ticket_max_limit || 'N/A'}</p> */}

//                                         <div style={{ fontSize: '16px', lineHeight: '1.8' }}>
//                                             {/* <Row style={{ borderBottom: '1px solid #e3e3e3', paddingBottom: '10px', marginBottom: '15px' }}>
//                                                     <Col md="6"><strong>Title:</strong> {ticketData.ticket_title || 'No Title'}</Col>
//                                                     <Col md="6"><strong>Category:</strong> {ticketData.ticket_category === null ? 'No Category' : ticketData.ticket_category || 'No Category'}</Col>
//                                                 </Row> */}
//                                             <Row style={{ borderBottom: '1px solid #e3e3e3', paddingBottom: '10px', marginBottom: '15px' }}>
//                                                 {/* <Col md="6"><strong>Category:</strong> {ticketData.ticket_category === "null" ? 'No Category' : ticketData.ticket_category || 'No Category'}</Col> */}
// <Col md="6">
//     <strong>Category:</strong> {
//         ticketData.ticket_category === null || ticketData.ticket_category.length === 0
//             ? 'No Category'
//             : (() => {
//                 let categories = [];

//                 try {
//                     // Parse the category data if it’s a string
//                     if (typeof ticketData.ticket_category === 'string') {
//                         categories = JSON.parse(ticketData.ticket_category);
//                     } else {
//                         categories = ticketData.ticket_category;
//                     }
//                 } catch (e) {
//                     console.error('Error parsing ticket category:', e);
//                 }

//                 // Flatten the array if it's nested
//                 if (Array.isArray(categories) && Array.isArray(categories[0])) {
//                     categories = categories.flat();
//                 }

//                 // Ensure categories is an array of numbers
//                 categories = Array.isArray(categories) ? categories : [categories];

//                 // Debugging: Log the parsed and flattened categories
//                 console.log('Flattened Categories:', categories);
//                 console.log('regCat:', regCat);

//                 // Filter regCat to find matching category names
//                 const matchedCategories = regCat
//                     ? regCat
//                         .filter(cat => categories.includes(cat.cs_reg_cat_id)) // Compare category IDs
//                         .map(cat => cat.cs_reg_category) // Get corresponding category names
//                     : [];

//                 // Debugging: Log the matched categories
//                 console.log('Matched Categories:', matchedCategories);

//                 // Return matched categories or 'No Category'
//                 return matchedCategories.length > 0
//                     ? matchedCategories.join(', ')
//                     : 'No Category'; // If no matches, return 'No Category'
//             })()
//     }
// </Col>




//                                                 {/* 
//                                                     <Col md="6"><strong>Number of Tickets:</strong> {ticketData.number_of_tickets || 'N/A'}</Col> */}
//                                             </Row>
//                                             <Row style={{ borderBottom: '1px solid #e3e3e3', paddingBottom: '10px', marginBottom: '15px' }}>
//                                                 <Col md="6"><strong>Resgistration Type:</strong> {ticketData.reg_typeid == "1" ? "Residental" : "Non-residental" || 'N/A'}</Col>
//                                                 <Col md="6"><strong>Number of seats:</strong> {ticketData.ticket_type === 'Unlimited' ? 'Unlimited' : ticketData.ticket_count || 'N/A'}</Col>
//                                             </Row>
//                                             <Row style={{ borderBottom: '1px solid #e3e3e3', paddingBottom: '10px', marginBottom: '15px' }}>
//                                                 <Col md="6"><strong>Maximum Buying Limit:</strong> {ticketData.ticket_max_limit || 'N/A'}</Col>
//                                             </Row>
//                                         </div>
//                                     </Fragment>
//                                 ) : (
//                                     <p>Loading ticket details...</p>
//                                 )}
//                             </CardBody>
//                         </Card>
//                     </Col>
//                 </Row>
//             </Container>
//         </Fragment>
//     );
// };

// export default ViewTicket;

import React, { Fragment, useState, useEffect } from 'react';
import { Container, Row, Col, Button, Card, CardBody, Badge, Table } from 'reactstrap';
import axios from 'axios';
import { BackendAPI } from '../../api';
import { Breadcrumbs } from '../../AbstractElements';
import { useNavigate, useLocation } from 'react-router-dom';
import moment from 'moment';
import { getToken } from '../../Auth/Auth';
import useAuth from '../../Auth/protectedAuth';

const ViewTicket = () => {
    useAuth();
    const [ticketData, setTicketData] = useState(null);   // To store the ticket data
    const [durationData, setDurationData] = useState([]); // To store the duration data
    const navigate = useNavigate();
    const location = useLocation();
    const item = location.state; // Default to empty object
    const [regCat, setRegCat] = useState([]);
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

    console.log("Ticket", ticketData);

    console.log("Duration", durationData);


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




    useEffect(() => {
        const fetchData = async () => {
            if (!item || !item.ticketId) return; // Ensure item and ID are valid

            try {
                const token = getToken();
                const response = await axios.get(`${BackendAPI}/ticketRoutes/fetchticketData/${item.ticketId}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });

                const { ticket, durations } = response.data;
                setTicketData(ticket);        // Set the ticket data to state
                setDurationData(durations);
            } catch (error) {
                console.error('Error fetching ticket data:', error.message);
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

            const { regCategory: fetchregcat } = response.data;
            const fetchcurrency = response.data.currency[0];
            const fetchgstfee = response.data.gstfee[0];
            const fetchgstinclded = response.data.gstinclded[0];
            const fetchprocessingfeein = response.data.processingfeein[0];
            const fetchprocessinginclded = response.data.processinginclded[0];
            const fetchprocessingfeeornot = response.data.processingfeeornot[0];
            const fetchgstamount = response.data.gstamount[0];
            const fetchProcessingFee = response.data.processingFees[0];

            setRegCat(fetchregcat);
            setProcessingFee(fetchProcessingFee);
            setcurrency(fetchcurrency.cs_value);
            setgstfee(fetchgstfee.cs_value);
            setgstinclded(fetchgstinclded.cs_value);
            setprocessingfeein(fetchprocessingfeein.cs_value);
            setprocessinginclded(fetchprocessinginclded.cs_value);
            setprocessingfeeornot(fetchprocessingfeeornot.cs_value);
            setgstpercentage(fetchgstamount.cs_value);
        } catch (error) {
            console.error('Error fetching dropdown data:', error);
        }
    };

    useEffect(() => {
        fetchDropdown();
    }, []);

    const handleNavigation = () => {
        navigate(`${process.env.PUBLIC_URL}/registration/manage-tickets/Consoft`);
    };

    const getVisibilityText = (visibility) => visibility === '1' ? 'Show' : 'Hide';

    // Function to toggle the description
    const toggleDescription = () => {
        setIsExpanded(!isExpanded);
    };

    // Function to get the truncated description
    const getTruncatedDescription = (description) => {
        const words = description.split(' ');
        if (words.length > 25) {
            return words.slice(0, 25).join(' ') + '...';
        }
        return description;
    };

    return (
        <Fragment>
            <Breadcrumbs parentClickHandler={handleNavigation} mainTitle="View Ticket" parent="Manage Facility" title="View Ticket" />
            <Container fluid>
                <Row>
                    <Col sm="12">
                        <Card>
                            <CardBody>
                                {/* Ticket Status Badge */}
                                {ticketData && (
                                    <Fragment>
                                        <div className='mb-3'>
                                            <Badge
                                                color={
                                                    ticketData.ticket_status === 'Open' ? 'success' :
                                                        ticketData.ticket_status === 'Close' ? 'danger' :
                                                            ticketData.ticket_status === 'SoldOut' ? 'warning' :
                                                                'dark'
                                                }
                                                style={{ fontSize: '1rem', padding: '0.25rem 0.5rem' }} // Adjusted for medium size
                                            >
                                                {ticketData.ticket_status}
                                            </Badge>

                                            {/* Ticket Visibility Badge */}
                                            <Badge
                                                color={ticketData.ticket_visibility === 1 ? 'secondary' : 'success'}
                                                style={{ fontSize: '1rem', padding: '0.25rem 0.5rem' }} // Adjusted for medium size
                                            >
                                                {ticketData.ticket_visibility === 1 ? 'Hide' : 'Unhide'}
                                            </Badge>
                                        </div>

                                        <div className="d-flex align-items-center mb-3">
                                            <h3>
                                                {ticketData.ticket_title || 'No Title'}
                                            </h3>
                                            <medium className='ms-2' color='success' >
                                                {ticketData.ticket_ispaid === 1 ? '(Paid)' : '(Free)'}
                                            </medium>


                                        </div>




                                        {/* Ticket Information */}
                                        <Table className="mt-4">
                                            {/* <thead>
                                                <tr>
                                                    <th>Field</th>
                                                    <th>Value</th>
                                                </tr>
                                            </thead> */}
                                            <tbody>
                                                <tr>
                                                    <td>Description</td>
                                                    <td>
                                                        {ticketData.ticket_description && ticketData.ticket_description.length > 0 ? (
                                                            isExpanded ? (
                                                                <span>
                                                                    {ticketData.ticket_description}
                                                                    <a onClick={toggleDescription} style={{ padding: 0, cursor: 'pointer', marginLeft: '5px' }}>
                                                                        <strong>Read Less</strong>
                                                                    </a>
                                                                </span>
                                                            ) : (
                                                                ticketData.ticket_description.length > 100 ? ( // Adjust this value to your desired limit
                                                                    <span>
                                                                        {getTruncatedDescription(ticketData.ticket_description)}
                                                                        <a onClick={toggleDescription} style={{ padding: 0, cursor: 'pointer', marginLeft: '5px' }}>
                                                                            <strong>Read More</strong>
                                                                        </a>
                                                                    </span>
                                                                ) : (
                                                                    <span>{ticketData.ticket_description}</span> // Display full description without links
                                                                )
                                                            )
                                                        ) : (
                                                            <span>No Description</span> // Handling for empty description
                                                        )}
                                                    </td>

                                                </tr>
                                                <tr>
                                                    {/* <td>Category</td>
                                                    <td>{ticketData.ticket_category || 'No Category'}</td> */}
                                                    <td>Category</td>
                                                    <td>
                                                        {
                                                            ticketData.ticket_category === null || ticketData.ticket_category.length === 0
                                                                ? 'No Category'
                                                                : (() => {
                                                                    let categories = [];

                                                                    try {
                                                                        // Parse the category data if it’s a string
                                                                        if (typeof ticketData.ticket_category === 'string') {
                                                                            categories = JSON.parse(ticketData.ticket_category);
                                                                        } else {
                                                                            categories = ticketData.ticket_category;
                                                                        }
                                                                    } catch (e) {
                                                                        console.error('Error parsing ticket category:', e);
                                                                    }

                                                                    // Flatten the array if it's nested
                                                                    if (Array.isArray(categories) && Array.isArray(categories[0])) {
                                                                        categories = categories.flat();
                                                                    }

                                                                    // Ensure categories is an array of numbers
                                                                    categories = Array.isArray(categories) ? categories : [categories];

                                                                    // Debugging: Log the parsed and flattened categories
                                                                    console.log('Flattened Categories:', categories);
                                                                    console.log('regCat:', regCat);

                                                                    // Filter regCat to find matching category names
                                                                    const matchedCategories = regCat
                                                                        ? regCat
                                                                            .filter(cat => categories.includes(cat.cs_reg_cat_id)) // Compare category IDs
                                                                            .map(cat => cat.cs_reg_category) // Get corresponding category names
                                                                        : [];

                                                                    // Debugging: Log the matched categories
                                                                    console.log('Matched Categories:', matchedCategories);

                                                                    // Return matched categories or 'No Category'
                                                                    return matchedCategories.length > 0
                                                                        ? matchedCategories.join(', ')
                                                                        : 'No Category'; // If no matches, return 'No Category'
                                                                })()
                                                        }
                                                    </td>
                                                </tr>
                                                <tr>
                                                    <td>Registration Type</td>
                                                    <td>{ticketData.reg_typeid === "1" ? "Residential" : "Non-residential"}</td>
                                                </tr>
                                                <tr>
                                                    <td>Number of Seats</td>
                                                    <td>{ticketData.ticket_type === 'Unlimited' ? 'Unlimited' : ticketData.ticket_count || 'N/A'}</td>
                                                </tr>
                                                <tr>
                                                    <td>Maximum Buying Limit</td>
                                                    <td>{ticketData.ticket_max_limit || 'N/A'}</td>
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
                                                    <tr key={duration.tick_duration_id || index}>
                                                        <td>{duration.tick_duration_name || 'N/A'}</td>
                                                        <td>{duration.tick_duration_start_date ? moment(duration.tick_duration_start_date).format('DD-MM-YYYY') : 'N/A'}</td>
                                                        <td>{duration.tick_duration_till_date ? moment(duration.tick_duration_till_date).format('DD-MM-YYYY') : 'N/A'}</td>
                                                       
                                                           <td>{duration.tick_amount ? `${duration.tick_amount}` : 'N/A'}</td>
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
                                                    const { gstAmount, processingAmount, totalAmount,regAmount } = calculateAmounts(duration.tick_amount);

                                                    return (
                                                        <tr key={duration.tick_duration_id || index}>
                                                            <td>{duration.tick_duration_name || 'N/A'}</td>
                                                            <td>{duration.tick_duration_start_date ? moment(duration.tick_duration_start_date).format('DD-MM-YYYY') : 'N/A'}</td>
                                                            <td>{duration.tick_duration_till_date ? moment(duration.tick_duration_till_date).format('DD-MM-YYYY') : 'N/A'}</td>
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
                                {!ticketData && <p>Loading ticket details...</p>}
                            </CardBody>
                        </Card>
                    </Col>
                </Row>
            </Container>
        </Fragment>
    );
};

export default ViewTicket;

