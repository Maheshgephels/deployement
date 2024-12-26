import React, { Fragment, useEffect, useState } from 'react';
import { Container, Row, Col, Button, Card, CardBody, CardHeader, FormFeedback, Input, FormGroup, Label, Modal, ModalBody, ModalFooter, ModalHeader } from 'reactstrap';
import { Form, Field } from 'react-final-form';
import { required, Name } from '../Utils/validationUtils';
import useAuth from '../../Auth/protectedAuth';
import { Breadcrumbs } from '../../AbstractElements';
import axios from 'axios';
import { BackendAPI } from '../../api/index';
import { getToken } from '../../Auth/Auth';
import Select from 'react-select';
import 'react-datepicker/dist/react-datepicker.css';
import SweetAlert from 'sweetalert2';
import { Link, useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import { Divider } from 'antd';

const composeValidators = (...validators) => value =>
    validators.reduce((error, validator) => error || validator(value), undefined);

const PaymentSetup = () => {
    useAuth();

    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [states, setStates] = useState([]);
    const [priceInclusion, setPriceInclusion] = useState('Included');
    const [percentageValue, setPercentageValue] = useState('');
    const [amountValue, setAmountValue] = useState('');

    const [currencydata, setCurrencydata] = useState([]);
    const [paymentMode, setPaymentMode] = useState(null);
    const [showGateways, setShowGateways] = useState(false);
    const [gateway, setGateway] = useState('');
    const [modal, setModal] = useState(false);
    const navigate = useNavigate();
    const [paymentDetails, setPaymentDetails] = useState({});
    const [processingFee, setProcessingFee] = useState(paymentDetails["processing_fees"] || '');
    const [gst, setGst] = useState(paymentDetails["GST"] || '');
    const [feeInclude, setFeeInclude] = useState(paymentDetails["processing_fee_IncludeExclude"] || 'Include');  // Set this from your data, e.g., 'Include'
    const [gstInclude, setGstInclude] = useState(paymentDetails["GST_Include"] || 'No'); // State for GST Include
    const [feeType, setFeeType] = useState(paymentDetails["processing_fees_in"] || '');
    const [currency, setCurrency] = useState(null); // Initially null or a default value

    console.log("Fee Type", feeType);
    console.log("Payment Data", paymentDetails);
    // Options for the select component
    // const currencyOptions = [
    //     { value: 'USD', label: 'USD' },
    //     { value: 'EUR', label: 'EUR' },
    //     { value: 'INR', label: 'INR' },
    //     { value: 'GBP', label: 'GBP' }
    // ];

    const uniqueCurrencies = [
        ...new Set(currencydata.map((country) => country.cs_currencyCode)),
    ];
    const currencyOptions = uniqueCurrencies.map((currencyCode) => ({
        value: currencyCode,
        label: currencyCode,
    }));


    const handleExInChange = (e) => {
        setPriceInclusion(e.target.value);
    };

    useEffect(() => {
        if (paymentDetails.processing_fee_IncludeExclude === 'Include') {
            setFeeInclude('Include');
        }
        if (paymentDetails["Processing fee in %"]) {
            setPercentageValue(paymentDetails["Processing fee in %"]);
        }
        if (paymentDetails["Processing fee in %"]) {
            setAmountValue(paymentDetails["Processing fee in %"]);
        }

        // Set the feeType based on whether the percentage or amount exists
        if (paymentDetails["Processing fee in %"]) {
            setFeeType('Percentage');
        } else if (paymentDetails["Processing fee in %"]) {
            setFeeType('Amount');
        }

        if (paymentDetails.processing_fees_in) {
            setFeeType(paymentDetails.processing_fees_in);
        } 

        setProcessingFee(paymentDetails["processing_fees"] || '');

        if (paymentDetails && paymentDetails["currency"]) {
            setCurrency({
                value: paymentDetails["currency"],
                label: paymentDetails["currency"]
            });
        }
        setPaymentMode(paymentDetails["Payment_mode"])
        if (paymentDetails["Payment_mode"] == "Both" || paymentDetails["Payment_mode"] == "Online") {
            setShowGateways(true)
        }

        setGateway(paymentDetails["payment_gateway"]);
        setGst(paymentDetails["GST"]);
    }, [paymentDetails]);

    useEffect(() => {
        const fetchPaymentDetails = async () => {
            try {
                const token = getToken(); // Use your function to get the token
                const response = await axios.get(`${BackendAPI}/paymentRoutes/getPaymentDetails`, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });

                if (response.status === 200) {
                    console.log("response.data.data", response.data.data);
                    setPaymentDetails(response.data.data); // Set the retrieved data in the state
                } else {
                    console.error("Failed to fetch payment details", response);
                }
            } catch (error) {
                console.error('Error fetching payment details:', error);
            }
        };

        fetchPaymentDetails();
    }, []);

    console.log("stored payment details", paymentDetails);

    // Handler for 'Percentage/Amount' radio button group
    // const handleFeeInChange = (e) => {
    //     setFeeType(e.target.value);
    //     // Reset values when switching between Percentage/Amount
    //     if (e.target.value === 'Percentage') {
    //         setAmountValue('');
    //     } else {
    //         setPercentageValue('');
    //     }
    // };

    const handleFeeInChange = (e) => {
        const value = e.target.value;
        setFeeType(value);
    };

    const onSubmit = async (values) => {
        const selectedCategory = values.category ? values.category.map(option => option.value) : null;

        // Prepare the data to be sent
        const formData = {
            orgDetail: values.orgDetail,
            identificationNumber: values.identificationNumber,
            GST_Include: gstInclude,
            gst: values.gst.value, // Ensure only the value is sent
            cgst: values.cgst,
            sgst: values.sgst,
            igst: values.igst,
            state: values.state,
            feeInclude: feeInclude,
            processingFee: processingFee,
            numberOfSeats: values.numberOfSeats,
            category: selectedCategory,
            feeType: feeType, // Selected fee type (either 'Amount' or 'Percentage')
            amount: feeType === 'Amount' ? amountValue : undefined, // Send amount if selected
            percentage: feeType === 'Percentage' ? percentageValue : undefined, // Send percentage if selected
            currency: currency.value, // Currency is required only when 'Amount' is selected
            paymentMode: paymentMode,
            paymentGateway: showGateways ? gateway : undefined, // Only send gateway if payment mode is online or both
        };

        console.log("formData", formData); // Log the prepared data

        try {
            const token = getToken(); // Get the token for authorization
            const response = await axios.post(`${BackendAPI}/paymentRoutes/savePaymentDetails`, formData, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });

            if (response.status === 200) {
                // Handle success response
                console.log("Payment details saved successfully", response.data);

                // SweetAlert for success
                Swal.fire({
                    icon: 'success',
                    title: 'Success',
                    text: 'Payment details saved successfully.',
                    timer: 3000,
                    showConfirmButton: false,
                    allowOutsideClick: false,
                    allowEscapeKey: false
                });
            } else {
                console.error("Unexpected response", response);

                // SweetAlert for failure
                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: 'Failed to save payment details. Please try again.',
                    timer: 3000,
                    showConfirmButton: false,
                    allowOutsideClick: false,
                    allowEscapeKey: false
                });
            }
        } catch (error) {
            console.error('Error saving payment details:', error);
            alert("An error occurred while saving payment details. Please check your input and try again.");
        }
    };



    const fetchDropdown = async () => {
        try {
            const token = getToken();
            const response = await axios.get(`${BackendAPI}/paymentRoutes/getDropdownData`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            setData(response.data);
            setLoading(false);

            // Destructure all necessary data, including states
            const { states: fetchStates } = response.data;
            const { currency: fetchcurrency } = response.data;


            // Set the states data to be used in a dropdown
            setStates(fetchStates);
            setCurrencydata(fetchcurrency);
        } catch (error) {
            console.error('Error fetching dropdown data:', error);
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDropdown();
    }, []);

    const handleCancel = () => {
        setModal(true);
    };

    const handleNavigation = () => {
        navigate(`${process.env.PUBLIC_URL}/registration/manage-tickets/Consoft`);
    };

    const handleDurationChange = (e) => {
        const { name, value } = e.target;
        setCurrency(prev => ({ ...prev, [name]: value }));
    };

    return (
        <Fragment>
            <Breadcrumbs mainTitle="Payment Setup" parent="Registration Admin" title="Payment Setup" />
            <Container fluid={true}>
                <Row className='justify-content-center'>
                    <Col sm="10">
                        <Card>
                            <CardBody>
                                <Form onSubmit={onSubmit} render={({ handleSubmit }) => (
                                    <form onSubmit={handleSubmit}>
                                        <Row>
                                            <Col md="12" className="mb-3">
                                                <Field name="orgDetail" initialValue={paymentDetails["Organization Name"] || ''} validate={composeValidators(required, Name)}>
                                                    {({ input, meta }) => (
                                                        <div className="form-group">
                                                            <label><strong>Organization Name</strong><span className="red-asterisk">*</span></label>
                                                            <input {...input} type="text" placeholder="Enter Organization Name" className={`form-control ${meta.touched && meta.error ? 'error-class' : ''}`} />
                                                            {meta.error && meta.touched && <p className='d-block text-danger'>{meta.error}</p>}
                                                        </div>
                                                    )}
                                                </Field>
                                            </Col>
                                            <Col md="12" className="mb-3">
                                                <Field name="identificationNumber" initialValue={paymentDetails["GST No."] || ''} validate={required}>
                                                    {({ input, meta }) => (
                                                        <div className="form-group">
                                                            <Label><strong>Identification Number</strong><span className="red-asterisk">*</span></Label>
                                                            <input {...input} placeholder="Enter Identification Number" className={`form-control ${meta.touched && meta.error ? 'error-class' : ''}`} />
                                                            {meta.error && meta.touched && <p className='d-block text-danger'>{meta.error}</p>}
                                                        </div>
                                                    )}
                                                </Field>
                                            </Col>
                                            {/* GST Selection */}
                                            <Col md="6" className="mb-3">
                                                <Field name="gst" initialValue={paymentDetails["GST"] || ''} validate={required}>
                                                    {({ input, meta }) => (
                                                        <div className="form-group">
                                                            <Label><strong>Tax Applicable</strong></Label>
                                                            <Select
                                                                {...input}
                                                                options={[{ value: 'Yes', label: 'Yes' }, { value: 'No', label: 'No' }]}
                                                                classNamePrefix="react-select"
                                                                onChange={(selectedOption) => {
                                                                    input.onChange(selectedOption);
                                                                    setGst(selectedOption.value); // Update GST state
                                                                }}
                                                                value={input.value && input.value.value ? input.value : { value: input.value, label: input.value }} // Ensure value is an object
                                                            />
                                                            {meta.error && meta.touched && <p className='d-block text-danger'>{meta.error}</p>}
                                                        </div>
                                                    )}
                                                </Field>
                                            </Col>

                                            {/* Conditionally Render CGST, SGST, IGST Fields based on GST Selection */}
                                            {gst === 'Yes' && (
                                                <>
                                                    {/* GST Include Field */}
                                                    <Col md="6" className="mb-3">
                                                        <Field name="gst_include" initialValue={paymentDetails["GST_Include"] || ''} validate={required}>
                                                            {({ input, meta }) => (
                                                                <div className="form-group">
                                                                    <Label><strong>Tax Include</strong></Label>
                                                                    <Select
                                                                        {...input}
                                                                        options={[{ value: 'Yes', label: 'Yes' }, { value: 'No', label: 'No' }]}
                                                                        classNamePrefix="react-select"
                                                                        onChange={(selectedOption) => {
                                                                            input.onChange(selectedOption);
                                                                            setGstInclude(selectedOption.value); // Update GST Include state
                                                                        }}
                                                                        value={input.value && input.value.value ? input.value : { value: input.value, label: input.value }} // Ensure value is an object
                                                                    />
                                                                    {meta.error && meta.touched && <p className='d-block text-danger'>{meta.error}</p>}
                                                                </div>
                                                            )}
                                                        </Field>
                                                    </Col>

                                                    <Col md="4" className="mb-3">
                                                        <Field name="igst" initialValue={paymentDetails["IGST"] || ''} validate={required}>
                                                            {({ input, meta }) => (
                                                                <div className="form-group">
                                                                    <Label><strong>Tax %</strong><span className="red-asterisk">*</span></Label>
                                                                    <input {...input} placeholder="Enter in %" className={`form-control ${meta.touched && meta.error ? 'error-class' : ''}`} />
                                                                    {meta.error && meta.touched && <p className='d-block text-danger'>{meta.error}</p>}
                                                                </div>
                                                            )}
                                                        </Field>
                                                    </Col>

                                                    <Col md="4" className="mb-3">
                                                        <Field name="cgst" initialValue={paymentDetails["CGST"] || ''} >
                                                            {({ input, meta }) => (
                                                                <div className="form-group">
                                                                    <Label className="d-flex justify-content-between align-items-center"><strong>CGST %</strong><small>(Applicable for INR)</small></Label>
                                                                    <input {...input} placeholder="Enter in %" className={`form-control ${meta.touched && meta.error ? 'error-class' : ''}`} />
                                                                    {meta.error && meta.touched && <p className='d-block text-danger'>{meta.error}</p>}
                                                                </div>
                                                            )}
                                                        </Field>
                                                    </Col>
                                                    <Col md="4" className="mb-3">
                                                        <Field name="sgst" initialValue={paymentDetails["SGST"] || ''}>
                                                            {({ input, meta }) => (
                                                                <div className="form-group">
                                                                    <Label className="d-flex justify-content-between align-items-center"><strong>SGST %</strong><small>(Applicable for INR)</small></Label>
                                                                    <input {...input} placeholder="Enter in %" className={`form-control ${meta.touched && meta.error ? 'error-class' : ''}`} />
                                                                    {meta.error && meta.touched && <p className='d-block text-danger'>{meta.error}</p>}
                                                                </div>
                                                            )}
                                                        </Field>
                                                    </Col>
                                                </>
                                            )}

                                            <Col md="6" className="mb-3">
                                                {/* <Field name={`state`} initialValue={paymentDetails["Organization State"] || ''}>
                                                    {({ input }) => (
                                                        <div>
                                                            <Label className='form-label' for="state"><strong>State</strong></Label>
                                                            <Select
                                                                {...input}
                                                                options={[{ value: '0', label: 'Select State' }, ...states.map(pref => ({ value: pref.cs_state_id, label: pref.cs_state_name }))]} // Use cs_state_id as value
                                                                placeholder={`Select State`}
                                                                isSearchable={true}
                                                                onChange={(selectedOption) => {
                                                                    // Set input value to the selected state's ID
                                                                    input.onChange(selectedOption ? selectedOption.value : null); // Use selectedOption.value to get cs_state_id
                                                                }}
                                                                onBlur={input.onBlur}
                                                                classNamePrefix="react-select"
                                                                isMulti={false}
                                                                value={input.value ? { value: input.value, label: states.find(state => state.cs_state_id === input.value)?.cs_state_name } : { value: '0', label: 'Select State' }} // Find the state name for display
                                                            />
                                                        </div>
                                                    )}
                                                </Field> */}
                                                <Field
                                                    name={`state`}
                                                    initialValue={paymentDetails["Organization State"] || ''}
                                                >
                                                    {({ input, meta }) => {
                                                        // Convert "Organization State" to a number if it's a valid string
                                                        const organizationState = Number(paymentDetails["Organization State"]);

                                                        // Find the option corresponding to Data.cs_state
                                                        const selectedOption = states.find(option => option.cs_state_id === organizationState);

                                                        // Map state to create the options array
                                                        let options = states.map(pref => ({
                                                            value: pref.cs_state_id,
                                                            label: pref.cs_state_name,
                                                        }));

                                                        options = [
                                                            { value: '', label: 'Select' },
                                                            ...options
                                                        ];

                                                        return (
                                                            <div>
                                                                <Label className='form-label' for="state"><strong>State</strong></Label>
                                                                <Select
                                                                    {...input}
                                                                    options={options}
                                                                    placeholder={`Select State`}
                                                                    isSearchable={true}
                                                                    onChange={(selectedOption) => {
                                                                        input.onChange(selectedOption ? selectedOption.value : '');
                                                                    }}
                                                                    onBlur={input.onBlur}
                                                                    classNamePrefix="react-select"
                                                                    value={options.find(option => option.value === Number(input.value)) || null} // Set the value directly to the initialValue
                                                                />
                                                                {meta.error && meta.touched && <p className='d-block text-danger'>{meta.error}</p>}
                                                            </div>
                                                        );
                                                    }}
                                                </Field>

                                            </Col>

                                        </Row>
                                        <Divider></Divider>
                                        <strong>Processing Fees</strong>
                                        <Row>

                                            <Col md="6" className="mb-3 mt-3">
                                                <div className="form-group">
                                                    <Field name="processing_fee" initialValue={processingFee}>
                                                        {({ input, meta }) => (
                                                            <div className="form-group">
                                                                <label><strong>Apply Processing Fee?</strong></label>
                                                                <Select
                                                                    {...input}
                                                                    options={[
                                                                        { value: 'Yes', label: 'Yes' },
                                                                        { value: 'No', label: 'No' }
                                                                    ]}
                                                                    classNamePrefix="react-select"
                                                                    onChange={(selectedOption) => {
                                                                        input.onChange(selectedOption); // Update the form field
                                                                        setProcessingFee(selectedOption.value); // Update component state
                                                                    }}
                                                                    value={
                                                                        input.value && input.value.value ? input.value :
                                                                            (input.value ? { value: input.value, label: input.value } : null)
                                                                    }
                                                                />
                                                                {meta.error && meta.touched && (
                                                                    <p className="d-block text-danger">{meta.error}</p>
                                                                )}
                                                            </div>
                                                        )}
                                                    </Field>
                                                </div>
                                            </Col>


                                            {/* Conditionally render Include/Exclude if Processing Fee is "Yes" */}
                                            {processingFee === 'Yes' && (
                                                <Col md="6" className="mb-3 mt-3">
                                                    <div className="form-group">
                                                        <Field name="feeinclude" initialValue={paymentDetails["processing_fee_IncludeExclude"] || ''}>
                                                            {({ input, meta }) => (
                                                                <div className="form-group">
                                                                    <label><strong>Include/Exclude</strong></label>
                                                                    <Select
                                                                        {...input}
                                                                        options={[{ value: 'Include', label: 'Include' }, { value: 'Exclude', label: 'Exclude' }]}
                                                                        classNamePrefix="react-select"
                                                                        onChange={(selectedOption) => {
                                                                            input.onChange(selectedOption);
                                                                            setFeeInclude(selectedOption.value);
                                                                            setFeeType(''); // Reset feeType when Include/Exclude is changed
                                                                        }}
                                                                        value={input.value && input.value.value ? input.value : { value: input.value, label: input.value }}
                                                                    />
                                                                    {meta.error && meta.touched && <p className="d-block text-danger">{meta.error}</p>}
                                                                </div>
                                                            )}
                                                        </Field>
                                                    </div>
                                                </Col>
                                            )}

                                            {/* Conditionally render radio buttons if "Include" is selected */}
                                            {processingFee === 'Yes' && (
                                                <Col md="6" className="mb-3 pt-4 ps-4">
                                                    <div className="form-group pt-2">
                                                        <div className="me-5">
                                                            <input
                                                                type="radio"
                                                                name="feeIn"
                                                                value="Percentage"
                                                                checked={feeType === 'Percentage'}
                                                                onChange={handleFeeInChange}
                                                                className="me-2"
                                                            /> Percentage
                                                            <input
                                                                type="radio"
                                                                name="feeIn"
                                                                value="Amount"
                                                                checked={feeType === 'Amount'}
                                                                onChange={handleFeeInChange}
                                                                className="ms-3 me-2"
                                                            /> Amount
                                                        </div>
                                                    </div>
                                                </Col>
                                            )}

                                            {/* Conditionally render input fields based on feeType */}
                                            {processingFee === 'Yes' && (

                                                <Col md="6" className="mb-3">
                                                    {feeType === 'Percentage' && (
                                                        <FormGroup>
                                                            <Label><strong>Enter Percentage</strong></Label>
                                                            <Input
                                                                type="number"
                                                                placeholder="Enter in %"
                                                                name="Processing fee in %"
                                                                value={percentageValue}
                                                                onChange={(e) => setPercentageValue(e.target.value)}
                                                            />
                                                        </FormGroup>
                                                    )}
                                                    {feeType === 'Amount' && (
                                                        <FormGroup>
                                                            <Label><strong>How much?</strong></Label>
                                                            <Input
                                                                type="number"
                                                                placeholder="Enter price"
                                                                name="Processing fee in Amount"
                                                                value={amountValue}
                                                                onChange={(e) => setAmountValue(e.target.value)}
                                                            />
                                                        </FormGroup>
                                                    )}
                                                </Col>

                                            )}
                                        </Row>

                                        <Divider></Divider>

                                        <Row>
                                            <Col md="6" className='mb-3 mt-3' >
                                                <div className="form-group">
                                                    <Label><strong>Currency</strong></Label>
                                                    <Select
                                                        name="currency"
                                                        value={currency} // Set the selected value as an object
                                                        onChange={(selectedOption) => setCurrency(selectedOption)} // Update currency with selected option
                                                        options={currencyOptions}
                                                        classNamePrefix="react-select"
                                                    />
                                                </div>
                                            </Col>
                                            <Col md="6" className="mb-3 mt-3" >
                                                <div className="form-group">
                                                    <strong>Payment Mode</strong>

                                                    <div className='mt-3'>
                                                        <input type="radio" name="paymentMode" value="Offline" checked={paymentMode === 'Offline'} onChange={(e) => { setPaymentMode(e.target.value); setShowGateways(false); setGateway(''); }} className='me-2' /> Offline
                                                        <input type="radio" name="paymentMode" value="Online" checked={paymentMode === 'Online'} onChange={(e) => { setPaymentMode(e.target.value); setShowGateways(true); }} className='ms-3 me-2' /> Online
                                                        <input type="radio" name="paymentMode" value="Both" checked={paymentMode === 'Both'} onChange={(e) => { setPaymentMode(e.target.value); setShowGateways(true); }} className='ms-3 me-2' /> Both
                                                    </div>
                                                </div>
                                            </Col>
                                            {showGateways && (
                                                <Col md="12" className="mb-3">
                                                    <div className="form-group">
                                                        <label><strong>Payment Gateway</strong></label>
                                                        <Select
                                                            value={gateway ? { value: gateway, label: gateway } : null} // Ensure the selected value is in object form
                                                            onChange={(option) => setGateway(option.value)} // Handle changes to update gateway state
                                                            options={[
                                                                { value: 'PayU', label: 'PayU' },
                                                                { value: 'PayPal', label: 'PayPal' },
                                                                { value: 'CCAvenue', label: 'CCAvenue' }
                                                            ]}
                                                            placeholder="Select Payment Gateway"
                                                            classNamePrefix="react-select"
                                                        />
                                                    </div>
                                                </Col>

                                            )}
                                            {/* <Col md="12" className="mb-3">
                                                <label><strong>Currency</strong></label>
                                                <select value={currency} initialValue={paymentDetails["currency"] || ''} onChange={(e) => setCurrency(e.target.value)} className="form-control">
                                                    <option value="USD">USD</option>
                                                    <option value="INR">INR</option>
                                                    <option value="EUR">EUR</option>
                                                    <option value="GBP">GBP</option>
                                                </select>
                                            </Col> */}



                                            <div className="d-flex justify-content-end mt-3">
                                                <Button color='warning' onClick={handleCancel} className="ms-3">Cancel</Button>
                                                <Button type="submit" color="primary" className='ms-3'>Save</Button>
                                            </div>
                                        </Row>
                                    </form>
                                )} />
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
                        <p>Your changes will be discarded. Are you sure you want to cancel?</p>
                    </div>
                </ModalBody>
                <ModalFooter>
                    <Button onClick={handleNavigation} color='warning'>Yes</Button>
                    <Button color="primary" onClick={() => setModal(!modal)}>No</Button>
                </ModalFooter>
            </Modal>
        </Fragment>
    );
};

export default PaymentSetup;
