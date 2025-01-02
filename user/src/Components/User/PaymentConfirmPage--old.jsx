import React, { Fragment, useEffect } from 'react';
import { Container, Row, Col, Button, Card, UncontrolledPopover, PopoverBody } from 'reactstrap';
import { Breadcrumbs } from '../../AbstractElements';
import { MdInfoOutline } from "react-icons/md";
import { useNavigate, useLocation } from 'react-router-dom';
import SweetAlert from 'sweetalert2';

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
        const { payUData, paymentUrl } = location.state || {}; // Use state if available for initial payment
        if (!payUData || !paymentUrl) return;

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
    };

    return (
        <Fragment>
            <Breadcrumbs mainTitle={
                <>
                    Payment Details
                    <MdInfoOutline
                        id="addPopover"
                        style={{ cursor: 'pointer', position: 'absolute', marginLeft: '5px' }}
                    />
                    <UncontrolledPopover placement="bottom" target="addPopover" trigger="focus">
                        <PopoverBody>
                            {/* Information about payment */}
                        </PopoverBody>
                    </UncontrolledPopover>
                </>
            } parent="Register for Conference" title="Payment Details" />

            <Card>
                <Row>
                    <Col md="6">
                        {location.state?.payUData ? (
                            <>
                                <table className='table table-bordered table-striped'>
                                    <tbody>
                                        <tr>
                                            <td><strong>Amount:</strong></td>
                                            <td>{location.state.payUData.amount}</td>
                                        </tr>
                                        <tr>
                                            <td><strong>Product:</strong></td>
                                            <td>{location.state.payUData.productinfo}</td>
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
                                <Button color='primary' className='mx-3 my-3' onClick={handlePayNow}>Pay Now</Button>
                                <Button color='warning' className='my-3' onClick={() => navigate(-1)}>Cancel</Button>
                            </>
                        ) : (
                            <p>Proccessing Payment</p>
                        )}
                    </Col>
                </Row>
            </Card>
        </Fragment>
    );
};

export default PaymentConfirmPage;
