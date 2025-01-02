import React, { Fragment, useState, useEffect, useContext } from 'react';
import { Container, Row, Col, Button, Card, Input, CardHeader } from 'reactstrap';
import { MdInfoOutline } from "react-icons/md";
import SweetAlert from 'sweetalert2';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { BackendAPI } from '../../api';
import { getToken } from '../../Auth/Auth';

const Multipleuser = ({ category, setCategory, addonticket, setAddonTicket, regAmount, totalPaidAmount, setRegAmount, settotalPaidAmount, currency, gstamount,
    gstfee,
    gstinclded,
    processinginclded,
    processingfeeornot,
    processingfeein, processingAmount, setProcessingAmount,
    setgstfee,
    setgstinclded,
    setprocessinginclded,
    setprocessingfeeornot,
    setprocessingfeein,
    setgstpercentage, setgstamount, gstpercentage, processingFee, UserEmail, selectedAddonNames }) => {
    const navigate = useNavigate();
    const [regCat, setRegCat] = useState([]);
    const [tickets, setTickets] = useState([]); // For ticket dropdown options

    const [showPromoCodeInput, setShowPromoCodeInput] = useState(false); // State to toggle promo code input visibility
    const [promoCode, setPromoCode] = useState(""); // State for storing promo code
    const [promoMessage, setPromoMessage] = useState(""); // State for promo message
    // const [regAmount, setRegAmount] = useState(0);
    const [discountAmount, setDiscountAmount] = useState(0);
    const [discountApplied, setDiscountApplied] = useState(false);
    const [isError, setIsError] = useState(false);
    const [discountedpayableamount, setdiscountedpayableamount] = useState(0);
    const [gstamount1, setgstamount1] = useState(gstamount);
    const [processingAmount1, setProcessingAmount1] = useState(processingAmount);
    const [useddiscountData, setuseddiscountData] = useState([]);
    const [totalAmount, setTotalAmount] = useState([]);


    const calculateTotalAmount = () => {
        return regAmount - (discountAmount > 0 ? discountAmount : 0) + (gstamount > 0 ? gstamount : 0);
    };

    // Recalculate total amount when any of the dependent values change
    useEffect(() => {
        const updatedTotal = calculateTotalAmount();
        setTotalAmount(updatedTotal);
    }, [regAmount, discountAmount, gstamount]);

    console.log("UserEmail", UserEmail);



    const handleConfirmOrder = () => {
        SweetAlert.fire({
            title: 'Order Confirmed!',
            text: 'Your order has been successfully confirmed.',
            icon: 'success',
            confirmButtonText: 'OK'
        }).then(() => {
            navigate('/next-step'); // Replace '/next-step' with your desired path
        });
    };

    const fetchDropdown = async () => {
        try {
            const token = getToken();
            const response = await axios.get(`${BackendAPI}/register/getDropdownData`, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
            const fetchregcat = response.data.regCategory;
            const fetchTicket = response.data.ticket;

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

        } catch (error) {
            console.error('Error fetching dropdown data:', error);
        }
    };

    useEffect(() => {
        fetchDropdown();
    }, []);

    // Find the category name that matches the `category` ID
    const selectedCategoryName = regCat.find(option => option.value === category)?.label || "Category not found";

    // Find the ticket name that matches the `ticketId`
    const selectedTicketName = tickets.find(option => option.value === addonticket)?.label || "Ticket not found";

    const subtotal = 244; // Example subtotal amount

    const handlePromoCodeChange = (e) => {
        setPromoCode(e.target.value);
    };

    const fetchuseddiscountuser = async () => {
        try {
            const token = getToken();

            const response = await axios.get(`${BackendAPI}/register/useddicountemails`, {
                headers: {
                    Authorization: `Bearer ${token}` // Include the token in the Authorization header
                }
            });

            console.log('Data from API:', response.data);
            // Assuming you want to set formData with the first item in Fields array if it exists
            setuseddiscountData(response.data.Fields[0] || {}); // Set formData if the array has data, or an empty object
        } catch (error) {
            console.error('Error fetching discount log data:', error);
        }
    };


    useEffect(() => {
        fetchuseddiscountuser(); // Fetch workshop data when component mounts
    }, []);

    const calculateFees = () => {
        let updatedTotalAmount = regAmount; // Assuming regAmount is defined as base amount

        // Calculate GST
        if (gstfee === 'Yes') {
            // const calculatedGstAmount = (updatedTotalAmount * parseFloat(gstpercentage)) / 100;
            // setgstamount(calculatedGstAmount);

            // if (gstinclded === 'No') {
            //     updatedTotalAmount += calculatedGstAmount;
            // }
            let gstAmount = 0;
            if (gstinclded === 'Yes') {
                if (processinginclded === 'Include') {
                    // Eliminate processing fee before calculating GST
                    updatedTotalAmount = updatedTotalAmount + gstamount1 + processingAmount1;
                    console.log("updatedTotalAmount", updatedTotalAmount);
                    if (processingfeeornot === 'Yes') {
                        if (processingfeein === 'Percentage') {
                            processingAmount = (updatedTotalAmount * parseFloat(processingFee.cs_value)) / 100;
                            console.log("processingAmount", processingAmount);
                        } else {
                            processingAmount = parseFloat(processingFee.cs_value);
                        }

                        updatedTotalAmount -= processingAmount; // Subtract processing fee from base
                    }

                    gstAmount = (updatedTotalAmount * parseFloat(gstpercentage)) / (100);
                    regAmount = updatedTotalAmount - gstAmount; // Adjust regAmount after GST
                } else {
                    // If processing fee is not included, calculate GST directly on the amount

                    updatedTotalAmount = updatedTotalAmount + gstamount1;
                    console.log("updatedTotalAmount1", updatedTotalAmount);
                    gstAmount = (updatedTotalAmount * parseFloat(gstpercentage)) / (100);
                    regAmount = updatedTotalAmount - gstAmount; // Adjust regAmount after GST
                }
            } else {
                // GST is excluded; normal processing
                gstAmount = (updatedTotalAmount * parseFloat(gstpercentage)) / 100;
                updatedTotalAmount += gstAmount; // Add GST to total if excluded
            }
            setgstamount(gstAmount); // Store the calculated GST amount
        }



        // Calculate processing fee
        let calculatedProcessingAmount = 0;
        if (processingfeeornot === 'Yes') {
            calculatedProcessingAmount = processingfeein === 'Percentage'
                ? (updatedTotalAmount * parseFloat(processingFee.cs_value)) / 100
                : parseFloat(processingFee.cs_value);

            if (processinginclded === 'Exclude') {
                updatedTotalAmount += calculatedProcessingAmount;
            } else {
                calculatedProcessingAmount = processingAmount
            }
        }
        setProcessingAmount(calculatedProcessingAmount);
    };



    const handleRemovePromoCode = () => {
        setPromoCode("");
        setPromoMessage("");
        settotalPaidAmount(regAmount + gstamount1 + processingAmount1);
        setShowPromoCodeInput(false);
        setDiscountApplied(false);
        setDiscountAmount(0);
        setdiscountedpayableamount(0);

        calculateFees();

        // setProcessingAmount(processingAmount1);
        // setgstamount(gstamount1);
    };


    const handleApplyPromoCode = async () => {
        try {
            const token = getToken();
            const response = await axios.get(`${BackendAPI}/register/getDiscount`, {
                headers: {
                    Authorization: `Bearer ${token}`
                },
                params: {
                    discount_code: promoCode,
                }
            });

            if (response.data && response.data.discount_code === promoCode) {
                const discount = response.data;
                let finalDiscountAmount = 0;
                if (discount.discount_eligibility == "2") {
                    console.log("Hellodsd ffskfs ", discount.discount_emails);
                    console.log("UserEmail", UserEmail);

                    // Check if discount_emails is not empty and if it includes the UserEmail
                    if (discount.discount_emails && !discount.discount_emails.includes(UserEmail)) {
                        setPromoMessage("This promo code is not eligible for your email.");
                        setIsError(true);
                        return;
                    }

                    // Check if the email has already been used in useddiscountData
                    console.log('Used Discount Data:', useddiscountData);

                    let emailAlreadyUsed = false;

                    // Case 1: When useddiscountData is an array
                    if (Array.isArray(useddiscountData)) {
                        emailAlreadyUsed = useddiscountData.some(entry => entry.user_email === UserEmail);
                    }

                    // Case 2: When useddiscountData is a single object
                    if (useddiscountData && !Array.isArray(useddiscountData)) {
                        emailAlreadyUsed = useddiscountData.user_email === UserEmail;
                    }

                    console.log("emailAlreadyUsed", emailAlreadyUsed);

                    if (emailAlreadyUsed) {
                        setPromoMessage("This promo code has already been used by your email.");
                        setIsError(true);
                        return;
                    }

                    // If no errors, proceed with your discount logic...
                }


                // Check if the discount applies to registration
                if (discount.discount_applyto === "1") {
                    if (discount.discount_type === 'percentage') {
                        const percentageDiscount = (regAmount * discount.discount_percentage) / 100;
                        finalDiscountAmount = percentageDiscount > parseFloat(discount.discount_max_limit)
                            ? parseFloat(discount.discount_max_limit)
                            : percentageDiscount;

                        setPromoMessage(`Promo code applied! You received a ${discount.discount_percentage}% discount${finalDiscountAmount === parseFloat(discount.discount_max_limit) ? `, but the maximum discount limit is ${discount.discount_max_limit} ${discount.discount_currency || ''}.` : '.'}`);
                    } else if (discount.discount_type === 'flat') {
                        finalDiscountAmount = parseFloat(discount.discount_amount);
                        setPromoMessage(`Promo code applied! You received a discount of ${finalDiscountAmount} ${discount.discount_currency || ''}.`);
                    }
                }
                // Check if the discount applies to specific ticket IDs
                else if (discount.discount_applyto === "2") {
                    if (discount.discount_ticket_ids && discount.discount_ticket_ids.includes(addonticket)) {
                        if (discount.discount_type === 'percentage') {
                            const percentageDiscount = (regAmount * discount.discount_percentage) / 100;
                            finalDiscountAmount = percentageDiscount > parseFloat(discount.discount_max_limit)
                                ? parseFloat(discount.discount_max_limit)
                                : percentageDiscount;

                            setPromoMessage(`Promo code applied to ticket! You received a ${discount.discount_percentage}% discount${finalDiscountAmount === parseFloat(discount.discount_max_limit) ? `, but the maximum discount limit is ${discount.discount_max_limit} ${discount.discount_currency || ''}.` : '.'}`);
                        } else if (discount.discount_type === 'flat') {
                            finalDiscountAmount = parseFloat(discount.discount_amount);
                            setPromoMessage(`Promo code applied to ticket! You received a discount of ${finalDiscountAmount} ${discount.discount_currency || ''}.`);
                        }
                    } else {
                        setPromoMessage("This promo code does not apply to the selected ticket.");
                        setIsError(true);
                        return;
                    }
                }

                setDiscountAmount(finalDiscountAmount);
                setDiscountApplied(true);
                setIsError(false);

                const discountedRegAmount1 = regAmount - finalDiscountAmount;
                setdiscountedpayableamount(discountedRegAmount1);

                let gstAmount = 0;
                let totalAmount = discountedRegAmount1;
                let calculatedRegAmount = discountedRegAmount1; // For reverse calculation

                // if (gstfee === 'Yes') {
                //     gstAmount = (totalAmount * parseFloat(gstpercentage)) / 100;
                //     setgstamount(gstAmount);
                //     if (gstinclded === 'No') {
                //         totalAmount += gstAmount;
                //     }
                // }

                // let processingAmount = 0;
                // if (processingfeeornot === 'Yes') {
                //     processingAmount = processingfeein === 'Percentage'
                //         ? (totalAmount * parseFloat(processingFee.cs_value)) / 100
                //         : parseFloat(processingFee.cs_value);


                //         totalAmount += processingAmount;


                //     setProcessingAmount(processingAmount);
                // } else {
                //     setProcessingAmount(0);
                // }

                if (gstfee === 'Yes') {
                    if (gstinclded === 'Yes') {
                        if (processinginclded === 'Include') {
                            // Eliminate processing fee before calculating GST
                            let baseAmountWithoutProcessing = discountedRegAmount1;

                            console.log("baseAmountWithoutProcessing", baseAmountWithoutProcessing);

                            // Calculate GST on the base amount without processing fee
                            gstAmount = (baseAmountWithoutProcessing * parseFloat(gstpercentage)) / (100);
                            calculatedRegAmount = baseAmountWithoutProcessing + gstAmount; // Adjust regAmount after GST
                            totalAmount = calculatedRegAmount;
                            console.log("totalAmount2", totalAmount);
                        } else {
                            // Processing fee is not included, calculate GST directly on the amount
                            gstAmount = (discountedRegAmount1 * parseFloat(gstpercentage)) / (100);
                            calculatedRegAmount = discountedRegAmount1 + gstAmount; // Adjust regAmount after GST
                            totalAmount = calculatedRegAmount;
                            console.log("totalAmount3", totalAmount);
                        }
                    } else {
                        // GST is excluded; calculate and add to total
                        gstAmount = (calculatedRegAmount * parseFloat(gstpercentage)) / 100;
                        totalAmount += gstAmount;
                    }
                }

                setgstamount(gstAmount); // Update GST state
                // let totalAmount = calculatedRegAmount;

                // Calculate processing fee
                if (processingfeeornot === 'Yes') {
                    if (processinginclded === 'Exclude') {
                        processingAmount =
                            processingfeein === 'Percentage'
                                ? (totalAmount * parseFloat(processingFee.cs_value)) / 100
                                : parseFloat(processingFee.cs_value);

                        totalAmount += processingAmount; // Add processing fee if excluded
                    } else {
                        // Processing fee already included, set for display purposes
                        console.log("totalAmount", totalAmount);
                        if (processingfeein !== 'Percentage') {
                            processingAmount = parseFloat(processingFee.cs_value);
                            totalAmount += processingAmount;
                        } else {
                            processingAmount = (totalAmount * parseFloat(processingFee.cs_value)) / 100
                            totalAmount += processingAmount;
                        }
                    }

                    setProcessingAmount(processingAmount);
                } else {
                    setProcessingAmount(0);
                }

                // Update total paid amount
                settotalPaidAmount(totalAmount);

                // settotalPaidAmount(totalAmount);
            } else {
                setPromoMessage("Invalid promo code. Please try again.");
                setIsError(true);
            }
        } catch (error) {
            console.error('Error applying promo code:', error);
            setPromoMessage("Invalid promo code. Please try again.");
            setIsError(true);
        }
    };




    return (
        <Fragment>
            <Container>
                {/* <Row className="mb-4">
                    <Col>
                        <h3>Order Summary</h3>
                    </Col>
                </Row> */}

                <Card body>
                    <CardHeader className="d-flex p-0 justify-content-between align-items-center flex-column flex-md-row">
                        <div className="mb-2 mb-md-0">
                            <h5 className="mb-2 text-start">Order Summary</h5> {/* Corrected closing tag */}

                        </div>


                    </CardHeader>
                    <Row className="mb-2">

                        <Col xs="6">
                            <p className='mb-0 py-2'>{selectedCategoryName}</p>
                        </Col>
                    </Row>

                    <Row className="mb-2">
                        <Col xs="6">
                            <p className='mb-0 py-2'>{selectedTicketName}</p>
                            <ul>
                                {selectedAddonNames.map((name, index) => (
                                    <li key={index}>{name}</li>
                                ))}
                            </ul>
                        </Col>
                        <Col xs="6" className="text-end">
                            <p>{currency} {regAmount}</p>
                        </Col>
                    </Row>

                    {/* Promo Code Section
                     <Row className="mb-3">
                        <Col xs="6">
                            <p
                                style={{ cursor: 'pointer', color: '#007bff' }}
                                onClick={() => setShowPromoCodeInput(!showPromoCodeInput)} // Toggle input visibility
                            >
                                Have a promo code?
                            </p>
                        </Col>
                    </Row> */}
                    {!showPromoCodeInput ?
                        <Row className="mb-3">
                            <Col xs="6">
                                <p
                                    style={{ cursor: 'pointer', color: '#007bff' }}
                                    onClick={() => setShowPromoCodeInput(!showPromoCodeInput)}
                                >
                                    Have a promo code?
                                </p>
                            </Col>
                        </Row> : null
                    }

                    {showPromoCodeInput && !discountApplied ? (
                        <Row className="mb-2">
                            <Col xs="7">
                                <Input
                                    type="text"
                                    placeholder="Enter promo code"
                                    value={promoCode}
                                    onChange={handlePromoCodeChange}
                                />
                            </Col>
                            <Col xs="5" className="text-end">
                                <Button color="primary" onClick={handleApplyPromoCode}>
                                    Apply
                                </Button>
                            </Col>
                        </Row>
                    ) : discountApplied ? (
                        <Row className="mb-2">
                            <Col xs="6">
                                <p className='mb-0'>Promo code applied: <strong>{promoCode}</strong></p>
                            </Col>
                            <Col xs="6" className="text-end">
                                <Button color="link" onClick={handleRemovePromoCode} style={{ color: 'red' }}>
                                    Remove
                                </Button>
                            </Col>
                        </Row>
                    ) : null}

                    {promoMessage && (
                        <Row className="mt-2">
                            <Col>
                                <p className='mb-0' style={{ color: isError ? 'red' : 'green' }}>{promoMessage}</p>
                            </Col>
                        </Row>
                    )}

                    <Row className="mt-4" >
                        <Col xs="6">
                            <h6>Subtotal</h6>
                        </Col>
                        <Col xs="6" className="text-end">
                            <h6>{currency} {regAmount}</h6>
                        </Col>
                    </Row>

                    {discountAmount > 0 && (
                        <Row className="mt-2" style={{ color: 'green' }}>
                            <Col xs="6">
                                <h6>Discount</h6>
                            </Col>
                            <Col xs="6" className="text-end">
                                <h6>-{currency} {discountAmount}</h6>
                            </Col>
                        </Row>

                    )}
                    {discountedpayableamount > 0 && (
                        <Row className="mt-2" style={{ borderTop: '2px solid #000' }}>
                            <Col xs="6">
                                <h6>Total Payable Amount</h6>
                            </Col>
                            <Col xs="6" className="text-end">
                                <h6>{currency} {discountedpayableamount}</h6>
                            </Col>
                        </Row>
                    )}



                    {/* Display GST if Excluded */}
                    {gstfee === 'Yes' && gstamount > 0 && (
                        <Row className="">
                            <Col xs="6">
                                <p>TAX ({gstpercentage}%)</p>
                            </Col>
                            <Col xs="6" className="text-end">
                                <p>{currency} {gstamount}</p>
                            </Col>
                        </Row>


                    )}

                    {/* <Row className="mt-4" style={{ borderTop: '2px solid #000' }}>
                        <Col xs="6" className='mt-3'>
                            <h6>Total Ticket Amount</h6>
                        </Col>
                        <Col xs="6" className="text-end mt-3">
                            <h6>
                                {currency}
                                {(
                                    regAmount - (discountAmount > 0 ? discountAmount : 0) + (gstamount1 > 0 ? gstamount1 : 0)
                                )}
                            </h6>
                        </Col>
                    </Row> */}

                    {gstfee === 'Yes' && gstamount > 0 && (
                        <div>
                            {/* ... other JSX code */}
                            <Row className="mt-4" style={{ borderTop: '2px solid #000' }}>
                                <Col xs="6" className='mt-3'>
                                    <h6>Total Ticket Amount</h6>
                                </Col>
                                <Col xs="6" className="text-end mt-3">
                                    <h6>
                                        {currency}{totalAmount} {/* Display updated total */}
                                    </h6>
                                </Col>
                            </Row>
                        </div>
                    )}
                    {processingfeeornot === 'Yes' && (
                        <Row className="">
                            <Col xs="6" className='mt-3'>
                                <p>Processing Fee</p>
                            </Col>
                            <Col xs="6" className="text-end mt-3">
                                <p>{currency} {processingAmount}</p>
                            </Col>
                        </Row>
                    )}




                    <Row className="mt-2" style={{ borderTop: '2px solid #000' }}>
                        <Col xs="6">
                            <h5>Total</h5>
                        </Col>
                        <Col xs="6" className="text-end">
                            <h5>{currency} {totalPaidAmount}</h5>
                        </Col>
                    </Row>
                </Card>

                {/* <Row className="mt-4">
                    <Col>
                        <Button color="primary" onClick={handleConfirmOrder}>Confirm Order</Button>
                        <Button color="secondary" onClick={() => navigate('/back')}>Back</Button>
                    </Col>
                </Row> */}
            </Container>
        </Fragment>
    );
};

export default Multipleuser;
