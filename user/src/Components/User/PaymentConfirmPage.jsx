// import React, { Fragment, useEffect } from 'react';
// import { Container, Row, Col, Button, Card, UncontrolledPopover, PopoverBody } from 'reactstrap';
// import { Breadcrumbs } from '../../AbstractElements';
// import { MdInfoOutline } from "react-icons/md";
// import { useNavigate, useLocation } from 'react-router-dom';
// import SweetAlert from 'sweetalert2';

// /* global Razorpay */  // Do not Remove this

// const PaymentConfirmPage = () => {
//     const navigate = useNavigate();
//     const location = useLocation(); // Use location to get query params

//     // Extract query parameters from the URL (after returning from PayU)
//     useEffect(() => {
//         const params = new URLSearchParams(location.search);
//         const txnid = params.get('txnid');
//         const amount = params.get('amount');
//         const status = params.get('status');

//         // Handle success or failure alert
//         if (txnid && amount) {
//             if (status === 'success') {
//                 SweetAlert.fire({
//                     title: 'Payment Successful!',
//                     text: `Transaction ID: ${txnid} for an amount of ₹${amount} has been successfully processed.`,
//                     icon: 'success',
//                     confirmButtonText: 'OK'
//                 }).then(() => {
//                     navigate(`${process.env.PUBLIC_URL}/user-dashboard/Consoft`);
//                 });
//             } else {
//                 SweetAlert.fire({
//                     title: 'Payment Failed!',
//                     text: `Transaction ID: ${txnid} failed. Please try again.`,
//                     icon: 'error',
//                     confirmButtonText: 'OK'
//                 }).then(() => {
//                     navigate(`${process.env.PUBLIC_URL}/conference-register/Consoft`);
//                 });
//             }
//         }
//     }, [location.search, navigate]);



//     // const handlePayNow = () => {
//     //     const { payUData, paymentUrl, paymentGateway } = location.state || {}; // Use state if available for initial payment
//     //     if (!payUData || !paymentUrl) return;

//     //     // Dynamically create the PayU form
//     //     const payuForm = document.createElement('form');
//     //     payuForm.setAttribute('action', paymentUrl);
//     //     payuForm.setAttribute('method', 'POST');

//     //     // Dynamically add inputs for all PayU data
//     //     Object.keys(payUData).forEach((key) => {
//     //         const input = document.createElement('input');
//     //         input.type = 'hidden';
//     //         input.name = key;
//     //         input.value = payUData[key];
//     //         payuForm.appendChild(input);
//     //     });

//     //     // Append the form to the body and submit it
//     //     document.body.appendChild(payuForm);
//     //     payuForm.submit(); // Automatically submit the PayU form
//     // };




//     // console.log("payUData", payUData);
//     const handlePayNow = () => {
//         const { payUData, paymentUrl, paymentGateway } = location.state || {}; // Use state if available for payment

//         if (!paymentGateway) {
//             alert("Payment gateway not specified.");
//             return;
//         }



//         if (paymentGateway === 'PayU') {
//             if (!payUData || !paymentUrl) {
//                 alert("Missing PayU payment data or URL.");
//                 return;
//             }

//             // Dynamically create the PayU form
//             const payuForm = document.createElement('form');
//             payuForm.setAttribute('action', paymentUrl);
//             payuForm.setAttribute('method', 'POST');

//             // Dynamically add inputs for all PayU data
//             Object.keys(payUData).forEach((key) => {
//                 const input = document.createElement('input');
//                 input.type = 'hidden';
//                 input.name = key;
//                 input.value = payUData[key];
//                 payuForm.appendChild(input);
//             });

//             // Append the form to the body and submit it
//             document.body.appendChild(payuForm);
//             payuForm.submit(); // Automatically submit the PayU form
//         } else if (paymentGateway === 'Razorpay') {

//             if (typeof Razorpay === 'undefined') {
//                 alert('Razorpay SDK is not loaded');
//                 return;
//             }

//             if (!payUData) {
//                 alert("Missing Razorpay payment data.");
//                 return;
//             }

//             // Initialize Razorpay
//             const razorpayOptions = {
//                 key: payUData.key, // Razorpay key ID
//                 amount: payUData.amount, // Amount in paisa
//                 currency: payUData.currency,
//                 name: "Your Company Name",
//                 description: payUData.productinfo,
//                 order_id: payUData.orderId, // Razorpay order ID
//                 prefill: {
//                     name: payUData.firstname,
//                     email: payUData.email,
//                     contact: payUData.phone,
//                 },
//                 notes: {
//                     userId: payUData.udf1,
//                     temppaymentId: payUData.udf2,
//                 },
//                 handler: function (response) {
//                     // Success callback
//                     console.log("Payment successful:", response);
//                     // You can make an API call to verify the payment or process the order
//                 },
//                 modal: {
//                     ondismiss: function () {
//                         // User closed the Razorpay checkout window
//                         console.log("Payment cancelled by user.");
//                     },
//                 },
//             };

//             const rzp = new Razorpay(razorpayOptions);

//             // Open Razorpay Checkout
//             rzp.open();
//         } else {
//             alert("Unsupported payment gateway.");
//         }
//     };


//     return (
//         <Fragment>
//             <Breadcrumbs mainTitle={
//                 <>
//                     Payment Details
//                     {/* <MdInfoOutline
//                         id="addPopover"
//                         style={{ cursor: 'pointer', position: 'absolute', marginLeft: '5px' }}
//                     />
//                     <UncontrolledPopover placement="bottom" target="addPopover" trigger="focus">
//                         <PopoverBody>
//                             Information about payment
//                         </PopoverBody>
//                     </UncontrolledPopover> */}
//                 </>
//             } parent="Register for Conference" title="Payment Details" />

//             <Card>
//                 <Row className='justify-content-center py-2'>
//                     <Col md="6">
//                         {location.state?.payUData ? (
//                             <>
//                                 <table className='table table-bordered table-striped'>
//                                     <tbody>
//                                         <tr>
//                                             <td><strong className='fs-5'>{location.state.payUData.productinfo}</strong></td>
//                                             <td colSpan={1}></td>
//                                         </tr>
//                                         <tr>
//                                             <td><strong>Total Payable Amount:</strong></td>
//                                             <td>{location.state.paymentGateway === 'PayU' ? location.state.payUData.amount : (location.state.payUData.amount) / 100}</td>
//                                         </tr>

//                                         <tr>
//                                             <td><strong>Name:</strong></td>
//                                             <td>{location.state.payUData.firstname}</td>
//                                         </tr>
//                                         <tr>
//                                             <td><strong>Email:</strong></td>
//                                             <td>{location.state.payUData.email}</td>
//                                         </tr>
//                                         <tr>
//                                             <td><strong>Phone:</strong></td>
//                                             <td>{location.state.payUData.phone}</td>
//                                         </tr>
//                                     </tbody>
//                                 </table>
//                                 <Button color='primary' className='mx-3 my-3' onClick={handlePayNow}>Pay Now</Button>
//                                 <Button color='warning' className='my-3' onClick={() => navigate(-1)}>Cancel</Button>
//                             </>
//                         ) : (
//                             <p>Proccessing Payment</p>
//                         )}
//                     </Col>
//                 </Row>
//             </Card>
//         </Fragment>
//     );
// };

// export default PaymentConfirmPage;


import React, { Fragment, useEffect } from 'react';
import { Container, Row, Col, Button, Card, UncontrolledPopover, PopoverBody, CardBody } from 'reactstrap';
import { Breadcrumbs } from '../../AbstractElements';
import { MdInfoOutline } from "react-icons/md";
import { useNavigate, useLocation } from 'react-router-dom';
import SweetAlert from 'sweetalert2';

/* global Razorpay */  // Do not Remove this

const PaymentConfirmPage = () => {
    const navigate = useNavigate();
    const location = useLocation(); // Use location to get query params

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
                    navigate(`${process.env.PUBLIC_URL}/user-dashboard/Consoft`);
                });
            } else {
                SweetAlert.fire({
                    title: 'Payment Failed!',
                    text: `Transaction ID: ${txnid} failed. Please try again.`,
                    icon: 'error',
                    confirmButtonText: 'OK'
                }).then(() => {
                    navigate(`${process.env.PUBLIC_URL}/conference-register/Consoft`);
                });
            }
        }
    }, [location.search, navigate]);

    const handlePayNow = () => {
        const { payUData, paymentUrl, paymentGateway } = location.state || {}; // Use state if available for payment

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
                name: "Your Company Name",
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
                handler: function (response) {
                    // Success callback
                    console.log("Payment successful:", response);
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
        } else {
            alert("Unsupported payment gateway.");
        }
    };

    return (
        <Fragment>
            <Breadcrumbs mainTitle={<>Payment Details</>} parent="Register for Conference" title="Payment Details" />

            <Container fluid={true}>
                <Row className='justify-content-center'>
                    <Col xs={12} md={8} lg={6}>
                        <Card>
                            <CardBody>
                                {location.state?.payUData ? (
                                    <>
                                        <table className='table table-bordered table-striped'>
                                            <tbody>
                                                <tr>
                                                    <td><strong className='fs-5'>{location.state.payUData.productinfo}</strong></td>
                                                    <td colSpan={1}></td>
                                                </tr>
                                                <tr>
                                                    <td><strong>Total Payable Amount:</strong></td>
                                                    <td>{location.state.paymentGateway === 'PayU' ? location.state.payUData.amount : (location.state.payUData.amount) / 100}</td>
                                                </tr>
                                                <tr>
                                                    <td><strong>Name:</strong></td>
                                                    <td>{location.state.payUData.firstname}</td>
                                                </tr>
                                                <tr>
                                                    <td><strong>Email:</strong></td>
                                                    <td>{location.state.payUData.email}</td>
                                                </tr>
                                                <tr>
                                                    <td><strong>Phone:</strong></td>
                                                    <td>{location.state.payUData.phone}</td>
                                                </tr>
                                            </tbody>
                                        </table>
                                        <Button color='primary' className='mx-3 my-3 w-100' onClick={handlePayNow}>Pay Now</Button>
                                        <Button color='warning' className='my-3 w-100' onClick={() => navigate(-1)}>Cancel</Button>
                                    </>
                                ) : (
                                    <p className="text-center">Processing Payment...</p>
                                )}
                            </CardBody>
                        </Card>
                    </Col>
                </Row>
            </Container>
        </Fragment>
    );
};

export default PaymentConfirmPage;
