import React, { Fragment, useEffect, useState } from 'react';
import { Container, Row, Col, Button, Card, CardBody, UncontrolledPopover, PopoverBody, Modal } from 'reactstrap';
import { Breadcrumbs } from '../../AbstractElements';
import { MdInfoOutline } from "react-icons/md";
import { useNavigate, useLocation } from 'react-router-dom';
import SweetAlert from 'sweetalert2';
import axios from 'axios';
import { BackendAPI } from "../../api";


/* global Razorpay */  // Do not Remove this

const DirectPaymentConfirmPage = () => {
    const navigate = useNavigate();
    const location = useLocation(); // Use location to get query params
    const [tickets, setTickets] = useState([]); // For ticket dropdown options
    const [regCat, setRegCat] = useState([]);
    const selectedCategoryName = regCat.find(option => option.value === location.state.payUData.category)?.label || "Category not found";

    const selectedTicketName = tickets.find(option => option.value === location.state.payUData.ticket)?.label || "Ticket not found";
    const [showModal, setShowModal] = useState(false);


    const handleCancelClick = () => {
        // Show SweetAlert confirmation
        SweetAlert.fire({
            title: 'Are you sure?',
            text: 'Do you want to cancel and go back?',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Yes, Cancel',
            cancelButtonText: 'No, Stay Here',
        }).then((result) => {
            // If the user confirmed, navigate
            if (result.isConfirmed) {
                navigate(`${process.env.PUBLIC_URL}/userregister`);
            }
        });
    };

    // Extract query parameters from the URL (after returning from PayU)
    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const txnid = params.get('txnid');
        const amount = params.get('amount');
        const status = params.get('status');

        // Handle success or failure alert
        if (txnid && amount) {
            if (status === 'success') {
                SweetAlert.fire({
                    title: 'Payment Successful!',
                    text: `Transaction ID: ${txnid} for an amount of ₹${amount} has been successfully processed.`,
                    icon: 'success',
                    confirmButtonText: 'OK'
                }).then(() => {
                    navigate(`${process.env.PUBLIC_URL}/Thank-you-for-reg`);
                });
            } else {
                SweetAlert.fire({
                    title: 'Payment Failed!',
                    text: `Transaction ID: ${txnid} failed. Please try again.`,
                    icon: 'error',
                    confirmButtonText: 'OK'
                }).then(() => {
                    navigate(`${process.env.PUBLIC_URL}/userregister`);
                });
            }
        }
    }, [location.search, navigate]);

    const fetchDropdown = async () => {
        try {

            const response = await axios.get(`${BackendAPI}/directuser/getDropdownData`);
            const fetchregcat = response.data.regCategory;
            const fetchTicket = response.data.ticket;
            const discountcoupon = response.data.discountcoupon[0];

            // Populate regCat options with registration categories
            const regCatOptions = fetchregcat.map(pref => ({
                value: pref.cs_reg_cat_id,
                label: pref.cs_reg_category,
            }));

            // Populate ticket options
            const ticketOptions = fetchTicket.map(ticket => ({
                value: ticket.ticket_id,
                label: ticket.ticket_title,
            }));

            setRegCat(regCatOptions);
            setTickets(ticketOptions);
            // setdiscountcoupon(discountcoupon.value);

        } catch (error) {
            console.error('Error fetching dropdown data:', error);
        }
    };

    useEffect(() => {
        fetchDropdown();
    }, []);



    // const handlePayNow = () => {
    //     const { payUData, paymentUrl, paymentGateway } = location.state || {}; // Use state if available for initial payment
    //     if (!payUData || !paymentUrl) return;

    //     // Dynamically create the PayU form
    //     const payuForm = document.createElement('form');
    //     payuForm.setAttribute('action', paymentUrl);
    //     payuForm.setAttribute('method', 'POST');

    //     // Dynamically add inputs for all PayU data
    //     Object.keys(payUData).forEach((key) => {
    //         const input = document.createElement('input');
    //         input.type = 'hidden';
    //         input.name = key;
    //         input.value = payUData[key];
    //         payuForm.appendChild(input);
    //     });

    //     // Append the form to the body and submit it
    //     document.body.appendChild(payuForm);
    //     payuForm.submit(); // Automatically submit the PayU form
    // };




    console.log("payUDatafgf", location.state.payUData);
    const handlePayNow = () => {
        const { payUData, paymentUrl, paymentGateway,encryptedData ,accessCode} = location.state || {}; // Use state if available for payment

        if (!paymentGateway) {
            alert("Payment gateway not specified.");
            return;
        }



        if (paymentGateway === 'PayU') {
            if (!payUData || !paymentUrl) {
                alert("Missing PayU payment data or URL.");
                return;
            }

            // Dynamically create the PayU form
            const payuForm = document.createElement('form');
            payuForm.setAttribute('action', paymentUrl);
            payuForm.setAttribute('method', 'POST');

            // Dynamically add inputs for all PayU data
            Object.keys(payUData).forEach((key) => {
                const input = document.createElement('input');
                input.type = 'hidden';
                input.name = key;
                input.value = payUData[key];
                payuForm.appendChild(input);
            });

            // Append the form to the body and submit it
            document.body.appendChild(payuForm);
            payuForm.submit(); // Automatically submit the PayU form
        } else if (paymentGateway === 'Razorpay') {

            if (typeof Razorpay === 'undefined') {
                alert('Razorpay SDK is not loaded');
                return;
            }

            if (!payUData) {
                alert("Missing Razorpay payment data.");
                return;
            }

            // Initialize Razorpay
            const razorpayOptions = {
                key: payUData.key, // Razorpay key ID
                amount: payUData.amount, // Amount in paisa
                currency: payUData.currency,
                name: "Stride by Avant",
                description: payUData.productinfo,
                order_id: payUData.orderId, // Razorpay order ID
                prefill: {
                    name: payUData.firstname,
                    email: payUData.email,
                    contact: payUData.phone,
                },
                notes: {
                    userId: payUData.udf1,
                    temppaymentId: payUData.udf2,
                },
                handler: async function (response) {
                    // Success callback
                    console.log("Payment successful:", response);



                    try {
                        // Make an API call to confirm payment
                        const result = await axios.post(`${BackendAPI}/directuser/confirmRazorpayPayment`, {
                            paymentId: response.razorpay_payment_id,
                            orderId: response.razorpay_order_id,
                            signature: response.razorpay_signature,
                            userId: payUData.udf1, // Pass additional data if needed
                            temppaymentId: payUData.udf2,
                            amount: (payUData.amount) / 100,
                            tax  : payUData.taxamount,

                        });

                        if (result.data.success) {

                            navigate(`${process.env.PUBLIC_URL}/Thank-you-for-reg`);

                        } else {
                            console.error('Failed to confirm payment:', result.data.message);
                            SweetAlert.fire({
                                title: 'Payment Failed!',
                                text: `Transaction ID: ${result.data.data.paymentId} failed. Please try again.`,
                                icon: 'error',
                                confirmButtonText: 'OK'
                            }).then(() => {
                                navigate(`${process.env.PUBLIC_URL}/userregister`);
                            });
                        }
                    } catch (error) {
                        console.error('Error confirming payment:', error);
                        alert('An error occurred while confirming the payment.');
                    }
                    // You can make an API call to verify the payment or process the order
                },
                modal: {
                    ondismiss: function () {
                        // User closed the Razorpay checkout window
                        console.log("Payment cancelled by user.");
                    },
                },
            };

            const rzp = new Razorpay(razorpayOptions);

            // Open Razorpay Checkout
            rzp.open();
        } else if (paymentGateway === 'CCAvenue') {
            if (!payUData) {
                alert("Missing CCAvenue payment data.");
                return;
            }

            // Generate CCAvenue form data
            const ccAvenueData = {
                access_code: accessCode,
                encRequest: encryptedData,
            };

            // Create and submit the form dynamically
            const ccAvenueForm = document.createElement('form');
            ccAvenueForm.setAttribute('action', paymentUrl);
            ccAvenueForm.setAttribute('method', 'POST');
            Object.keys(ccAvenueData).forEach((key) => {
                const input = document.createElement('input');
                input.type = 'hidden';
                input.name = key;
                input.value = ccAvenueData[key];
                ccAvenueForm.appendChild(input);
            });

            document.body.appendChild(ccAvenueForm);
            ccAvenueForm.submit();
        }else {
            alert("Unsupported payment gateway.");
        }
    };


    return (
        <Fragment>

            <Container fluid={true}>
                <Row className='justify-content-center'>
                    <Col xs={12} md={8} lg={6}>
                        <Card>
                            <CardBody>

                                {location.state?.payUData ? (
                                    <>
                                        <table className='table table-bordered table-striped mb-3'>
                                            <tbody>
                                                <tr>
                                                    <td><h6><strong>{location.state.payUData.productinfo}</strong></h6></td>
                                                    <td colSpan={1}></td>
                                                </tr>
                                                <tr>
                                                    <td><strong>Name:</strong></td>
                                                    <td>{location.state.payUData.firstname}</td>
                                                </tr>
                                                {/* <tr>
                                                    <td><strong>Email:</strong></td>
                                                    <td>{location.state.payUData.email}</td>
                                                </tr>*/}
                                                <tr>
                                                    <td><strong>Category:</strong></td>
                                                    <td>{selectedCategoryName}</td>
                                                </tr>
                                                <tr>
                                                    <td><strong>Ticket:</strong></td>
                                                    <td>{selectedTicketName}</td>
                                                </tr>
                                                <tr>
                                                    <td><strong>Total Payable Amount:</strong></td>
                                                    <td>{location.state.paymentGateway === 'PayU' ? location.state.payUData.amount : (location.state.payUData.amount) / 100}</td>
                                                </tr>



                                            </tbody>
                                        </table>
                                        {/* <Button color='primary' className='mx-3 my-3' onClick={handlePayNow}>Pay Now</Button>
                                        <Button color='warning' className='my-3' onClick={handleCancelClick}>
                                            Cancel
                                        </Button> */}

                                        {/* <Button color='primary' className='mx-3 my-3 w-100' onClick={handlePayNow}>Pay Now</Button>
                                        <Button color='warning' className='my-3 w-100' onClick={handleCancelClick}>Cancel</Button> */}

                                        <Row>
                                            <Col className="d-flex justify-content-start">
                                                <Button color='primary' className='mx-3 my-3' onClick={handlePayNow}>Pay Now</Button>
                                            </Col>
                                            <Col className="d-flex justify-content-end">
                                                <Button color='warning' className='my-3' onClick={handleCancelClick}>Cancel</Button>
                                            </Col>
                                        </Row>

                                    </>
                                ) : (
                                    <p>Proccessing Payment</p>
                                )}

                            </CardBody>
                        </Card>
                    </Col>
                </Row>
            </Container>




        </Fragment>
    );
};

export default DirectPaymentConfirmPage;