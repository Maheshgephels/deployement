import React, { Fragment, useState, useEffect, useContext } from 'react';
import { Container, Row, Col, Input, Label, Button, Card, CardBody, Modal, ModalHeader, Table, FormFeedback, ModalBody, ModalFooter, Media, PopoverBody, UncontrolledPopover } from 'reactstrap';
import { useForm } from 'react-hook-form';
import axios from 'axios';
import { BackendAPI } from '../../api';
import SweetAlert from 'sweetalert2';
// import { Input } from 'antd';
import { Breadcrumbs } from '../../AbstractElements';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { MdDelete, MdInfoOutline } from "react-icons/md";
import { FaUser, FaRegIdCard, FaMoneyBillWave, FaTicketAlt, FaPlus, FaEdit } from 'react-icons/fa';
import Select from 'react-select';
import { Field, Form } from 'react-final-form'; // Import Field and Form from react-final-form
import { required, email, Img, PDF, option, number, Name, NAME, radio } from '../Utils/validationUtils';
import { PermissionsContext } from '../../contexts/PermissionsContext';
import useAuth from '../../Auth/protectedAuth';
import { getToken } from '../../Auth/Auth';
import { Divider } from 'antd';
import moment from 'moment';




//Utility function used to combine multiple validation functions into a single validation function
const composeValidators = (...validators) => value =>
    validators.reduce((error, validator) => error || validator(value), undefined);

const AddPayment = () => {
    useAuth();
    const [data, setData] = useState([]);
    const [relatedPayments, setRelatedPayments] = useState([]);
    const [selectedPayment, setSelectedPayment] = useState(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [loading, setLoading] = useState(true);
    const [modal, setModal] = useState(false);
    const [fieldLabels, setFieldLabels] = useState([]);
    const [fieldType, setFieldType] = useState([]);
    const [requiredfield, setRequiredField] = useState([]); // Define requiredfield state
    const [fieldId, setFieldId] = useState([]);
    const [fieldName, setFieldName] = useState([]);
    const navigate = useNavigate(); // Initialize useHistory
    const location = useLocation();
    const { item } = location.state || {};
    const [prefixes, setPrefixes] = useState([]);
    const [state, setState] = useState([]);
    const [country, setCountry] = useState([]);
    const [regCat, setRegCat] = useState([]);
    const [workshop, setWorkshop] = useState([]);
    const [dayType, setDayType] = useState([]);
    const [custom, setCustom] = useState([]);
    const [customfield, setCustomfield] = useState([]);
    const [ticket, setTicket] = useState([]);
    const [filteredTickets, setFilteredTickets] = useState([]); // State for filtered tickets
    const [filteredAddon, setFilteredAddon] = useState([]);
    const [paymentType, setPaymentType] = useState([]);
    const [paymentStatus, setPaymentStatus] = useState([]);
    const [addon, setAddon] = useState([]);
    const [username, setusername] = useState([]);
    const { permissions } = useContext(PermissionsContext);
    const [category, setCategory] = useState(''); // Define state and setter
    const [addonticket, setAddonTicket] = useState(''); // Define state and setter
    const userId = item.user_id;
    const [showNextStep, setShowNextStep] = useState(false); // Handles when "Next" is clicked
    const [isChecked, setIsChecked] = useState(false); // Track the state of the checkbox
    const [sendEmail, setSendEmail] = useState(false);
    const paymentTypeOptions = paymentType.map(type => ({
        value: type.paymenttype_id,
        label: type.paymenttype_name
    }));
    const paymentStatusOptions = paymentStatus.map(status => ({
        value: status.paymentstatus_id,
        label: status.paymentstatus_name
    }));


    console.log("Related Payment", relatedPayments);








    // useEffect(() => {
    //     fetchFields(); // Corrected function name
    // }, [permissions]);

    useEffect(() => {
        fetchDropdown(); // Corrected function name
        fetchPages();
    }, [permissions]);




    // Extract Add User setting Permissions component
    const AddUserPermissions = permissions['AddPayment'];


    const fetchPages = async () => {
        try {
            const token = getToken();
            const response = await axios.post(`${BackendAPI}/paymentRoutes/getPayment`, { userId }, {
                headers: {
                    Authorization: `Bearer ${token}` // Include the token in the Authorization header
                }
            });
            setRelatedPayments(response.data);
            console.log(response.data);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching pages:', error);
            setLoading(false);
        }
    };


    // const fetchFields = async () => {
    //     try {
    //         const token = getToken();
    //         const response = await axios.get(`${BackendAPI}/reguser/getField`, {
    //             headers: {
    //                 Authorization: `Bearer ${token}` // Include the token in the Authorization header
    //             }
    //         });
    //         const fieldsData = response.data.Fields;
    //         const requiredfield = fieldsData.map(field => field.cs_is_required);
    //         const fieldLabels = fieldsData.map(field => field.cs_field_label);
    //         const fieldType = fieldsData.map(field => field.field_type_name);
    //         const fieldId = fieldsData.map(field => field.cs_field_id);
    //         const fieldName = fieldsData.map(field => field.cs_field_name);
    //         const customfield = fieldsData.map(field => field.cs_iscustom);


    //         console.log("Data:", fieldsData);
    //         console.log("Custom:", customfield);



    //         // setData(fieldsData);
    //         setFieldLabels(fieldLabels);
    //         setFieldType(fieldType);
    //         setFieldName(fieldName);
    //         setCustomfield(customfield);
    //         setRequiredField(requiredfield); // Set requiredfield state
    //         setFieldId(fieldId);
    //         setLoading(false);

    //         // console.log('Id:', fieldName);
    //     } catch (error) {
    //         console.error('Error fetching Fields:', error);
    //         setLoading(false);
    //     }
    // };

    const handleCancel = () => {
        setModal(true);
    };

    const onSubmit = async (formData) => {
        const username = formData.cs_first_name;

        try {
            // Separate fields into `values` and `paymentDetails`
            const values = {};
            const paymentDetails = {};

            const formattedDateTime = moment(values.payment_date).format('YYYY-MM-DD HH:mm:ss');


            const paymentFields = [
                'total_paid_amount',
                'processing_fee',
                'conference_fees',
                'branch',
                'bank',
                'payment_date',
                'tracking_id',
                'payment_mode',
                'paymenttype_id',
                'paymentstatus_id',
                'currency',
                'user_id'
            ];

            for (const key in formData) {
                if (Object.hasOwnProperty.call(formData, key)) {
                    if (formData[key] !== '') {
                        const fieldValue = formData[key]?.value !== undefined ? formData[key].value : formData[key];

                        if (paymentFields.includes(key)) {
                            paymentDetails[key] = fieldValue;
                        } else {
                            values[key] = fieldValue;
                        }
                    }
                }
            }


            console.log('Payment details to send:', paymentDetails);

            // Set payment details
            paymentDetails.payment_mode = 'offline';
            paymentDetails.user_id = item.user_id; // Ensure user_id is coming from formData
            paymentDetails.payment_date = formattedDateTime;

            const token = getToken();

            // Make the API call
            const response = await axios.post(`${BackendAPI}/paymentRoutes/addPayment`, {
                data: values, // Send the filtered data
                paymentDetails: paymentDetails, // Send the payment details separately
            }, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            if (response.data.success) {
                SweetAlert.fire({
                    title: 'Success!',
                    html: `Payment for <b>${item.cs_first_name}</b> created successfully!`,
                    icon: 'success',
                    timer: 3000,
                    showConfirmButton: false,
                    allowOutsideClick: false,
                    allowEscapeKey: false
                }).then((result) => {
                    if (result.dismiss === SweetAlert.DismissReason.timer) {
                        navigate(`${process.env.PUBLIC_URL}/registration/manage-payment/Consoft`);
                    }
                });
            }
        } catch (error) {
            console.error('Error creating user:', error.message);
        }
    };







    const fetchDropdown = async () => {
        try {
            const token = getToken();
            const response = await axios.get(`${BackendAPI}/reguser/getDropdownData`, {
                headers: {
                    Authorization: `Bearer ${token}` // Include the token in the Authorization header
                }
            });

            setData(response.data);
            setLoading(false);

            const fetchPaymentType = response.data.paymentType;
            const fetchPaymentStatus = response.data.paymentStatus;


            setPaymentType(fetchPaymentType);
            setPaymentStatus(fetchPaymentStatus);


        } catch (error) {
            console.error('Error fetching dropdown data:', error);
            setLoading(false);
        }
    };




    const handleNavigation = () => {
        navigate(`${process.env.PUBLIC_URL}/User-listing/Consoft`);
    };

    const handleCheckboxChange = (e) => {
        const checked = e.target.checked;
        setIsChecked(checked); // Set the checkbox state
        if (checked) {
            setShowNextStep(false); // Ensure the form stays in the first and second row when checkbox is checked

        }
    };

    const handleNextClick = () => {
        setShowNextStep(true); // Move to the third row and show Submit/Cancel buttons
    };

    const handleBackClick = () => {
        setShowNextStep(false); // Go back to the first and second rows
    };

    const handleEditClick = (payment) => {
        setSelectedPayment(payment);
        setIsEditModalOpen(true);
    };

    const handleModalClose = () => {
        setIsEditModalOpen(false);
        setSelectedPayment(null);
    };

    const handleEditSubmit = async (values) => {
        try {
            const token = getToken();
            await axios.put(
                `${BackendAPI}/paymentRoutes/updatePayment`,
                { ...selectedPayment, ...values },
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );
            await fetchPages();
            handleModalClose();
        } catch (error) {
            console.error('Error updating payment:', error);
        }
    };


    return (
        <Fragment>
            <Breadcrumbs parentClickHandler={handleNavigation} mainTitle={
                <>
                    Create Payment
                    <MdInfoOutline
                        id="addPopover"
                        style={{
                            cursor: 'pointer', position: 'absolute', marginLeft: '5px'
                        }}
                    />
                    <UncontrolledPopover
                        placement="bottom"
                        target="addPopover"
                        trigger="focus"
                    >
                        <PopoverBody>
                            Use the <strong>Create User</strong> feature to register a new user and ensure all required information is accurately entered before creating.
                        </PopoverBody>
                    </UncontrolledPopover>
                </>
            } parent="Registration Admin" title=" Create Payment" />
            <Container fluid={true}>
                <Row>
                    <Col sm="12">
                        <Card>
                            <CardBody>
                                <h5 className="mb-4 text-start">User Details</h5>
                                <ul className="list-unstyled">
                                    <li className="mb-2">
                                        <FaUser className="me-2" />
                                        <strong>Name:</strong> {item.cs_first_name} {item.cs_last_name}
                                    </li>
                                    <li className="mb-2">
                                        <FaRegIdCard className="me-2" />
                                        <strong>Registration Number:</strong> {item.cs_regno}
                                    </li>
                                    <li className="mb-2">
                                        <FaTicketAlt className="me-2" />
                                        <strong>Ticket:</strong> {item.ticket_title || 'N/A'}
                                    </li>
                                    <li>
                                        <FaPlus className="me-2" />
                                        <strong>Addon:</strong> {item.addon_title || 'N/A'}
                                    </li>
                                </ul>

                                <div className='table-responsive'>
                                    <Table>
                                        <thead>
                                            <tr>
                                                <th>Sr no.</th>
                                                <th>Payment Mode</th>
                                                <th>DD / CHEQUE NO. / TRANSACTION ID</th>
                                                <th>Bank</th>
                                                <th>Paid Amount</th>
                                                <th>Payment Date</th>
                                                <th>Action</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {relatedPayments.map((payment, index) => (
                                                <tr key={payment.payment_id}>
                                                    <td>{index + 1}</td>
                                                    <td>{payment.payment_mode || 'N/A'}</td>
                                                    <td>{payment.tracking_id || 'N/A'}</td>
                                                    <td>{payment.bank || 'N/A'}</td>
                                                    <td>{payment.total_paid_amount || 'N/A'}</td>
                                                    <td>{payment.payment_date ? moment(payment.payment_date).format('YYYY-MM-DD HH:mm:ss') : 'N/A'}</td>
                                                    <td className='text-center cursor-pointer'>
                                                        <FaEdit
                                                            style={{ cursor: 'pointer' }}
                                                            onClick={() => handleEditClick(payment)}
                                                        />
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </Table>
                                </div>
                            </CardBody>

                            <Divider className='m-0' />
                            <CardBody>
                                <h5 className="mb-4 text-start">Add New Payment</h5>

                                <Form onSubmit={onSubmit}>
                                    {({ handleSubmit }) => (
                                        <form className="needs-validation" noValidate="" onSubmit={handleSubmit}>


                                            <>
                                                <Row>
                                                    <Col xs={12} sm={6} md={4} className="mb-3">

                                                        <Field
                                                            name="paymenttype_id"
                                                        >
                                                            {({ input, meta }) => {
                                                                const selectedOption = paymentTypeOptions.find(option => option.value === input.value);

                                                                console.log("Selected Type Option", selectedOption);

                                                                return (
                                                                    <div>
                                                                        <Label className='form-label' for="paymenttype_id"><strong>Payment Type</strong></Label>
                                                                        <Select
                                                                            {...input}
                                                                            options={paymentTypeOptions}
                                                                            placeholder={`Select Payment Status`}
                                                                            isSearchable={true}
                                                                            onChange={(value) => {
                                                                                input.onChange(value);
                                                                            }}
                                                                            onBlur={input.onBlur}
                                                                            classNamePrefix="react-select"
                                                                            isMulti={false}
                                                                            value={selectedOption}
                                                                        />
                                                                        {meta.error && meta.touched && <p className='d-block text-danger'>{meta.error}</p>}
                                                                    </div>
                                                                );
                                                            }}
                                                        </Field>
                                                    </Col>

                                                    <Col xs={12} sm={6} md={4} className="mb-3">

                                                        <Field
                                                            name="paymentstatus_id"
                                                        >
                                                            {({ input, meta }) => {
                                                                const selectedOption = paymentStatusOptions.find(option => option.value === input.value);

                                                                console.log("Selected Option", selectedOption);

                                                                return (
                                                                    <div>
                                                                        <Label className='form-label' for="paymentstatus_id"><strong>Payment Status</strong></Label>
                                                                        <Select
                                                                            {...input}
                                                                            options={paymentStatusOptions}
                                                                            placeholder={`Select Payment Status`}
                                                                            isSearchable={true}
                                                                            onChange={(value) => {
                                                                                input.onChange(value);
                                                                            }}
                                                                            onBlur={input.onBlur}
                                                                            classNamePrefix="react-select"
                                                                            isMulti={false}
                                                                            value={selectedOption}
                                                                        />
                                                                        {meta.error && meta.touched && <p className='d-block text-danger'>{meta.error}</p>}
                                                                    </div>
                                                                );
                                                            }}
                                                        </Field>
                                                    </Col>

                                                    <Col xs={12} sm={6} md={4} className="mb-3">
                                                        <Field name="tracking_id">
                                                            {({ input, meta }) => (
                                                                <div>
                                                                    <Label className="form-label" for="cheque_no">
                                                                        <strong>DD / CHEQUE NO. / TRANSACTION ID</strong><span className="text-danger"> *</span>
                                                                    </Label>
                                                                    <input
                                                                        {...input}
                                                                        className="form-control"
                                                                        id="cheque_no"
                                                                        placeholder="Transaction ID"
                                                                    />
                                                                    {meta.error && meta.touched && <p className="d-block text-danger">{meta.error}</p>}
                                                                </div>
                                                            )}
                                                        </Field>
                                                    </Col>


                                                </Row>
                                                <Row>

                                                    <Col xs={12} sm={6} md={4} className="mb-3">
                                                        <Field name="payment_date"
                                                        >
                                                            {({ input, meta }) => (
                                                                <div>
                                                                    <Label className="form-label" for="payment_date">
                                                                        <strong>Payment Date</strong><span className="text-danger"> *</span>
                                                                    </Label>
                                                                    <input
                                                                        {...input}
                                                                        className="form-control"
                                                                        id="payment_date"
                                                                        type="date"
                                                                        placeholder="Enter Payment Date"
                                                                        max="9999-12-31"
                                                                    />
                                                                    {meta.error && meta.touched && <p className="d-block text-danger">{meta.error}</p>}
                                                                </div>
                                                            )}
                                                        </Field>
                                                    </Col>

                                                    <Col xs={12} sm={6} md={4} className="mb-3">
                                                        <Field name="bank">
                                                            {({ input, meta }) => (
                                                                <div>
                                                                    <Label className="form-label" for="bank">
                                                                        <strong>Bank</strong><span className="text-danger"> *</span>
                                                                    </Label>
                                                                    <input
                                                                        {...input}
                                                                        className="form-control"
                                                                        id="bank"
                                                                        placeholder="Bank"
                                                                    />
                                                                    {meta.error && meta.touched && <p className="d-block text-danger">{meta.error}</p>}
                                                                </div>
                                                            )}
                                                        </Field>
                                                    </Col>

                                                    <Col xs={12} sm={6} md={4} className="mb-3">
                                                        <Field name="branch">
                                                            {({ input, meta }) => (
                                                                <div>
                                                                    <Label className="form-label" for="branch">
                                                                        <strong>Branch</strong><span className="text-danger"> *</span>
                                                                    </Label>
                                                                    <input
                                                                        {...input}
                                                                        className="form-control"
                                                                        id="branch"
                                                                        placeholder="Branch"
                                                                    />
                                                                    {meta.error && meta.touched && <p className="d-block text-danger">{meta.error}</p>}
                                                                </div>
                                                            )}
                                                        </Field>
                                                    </Col>
                                                </Row>
                                                <Row>


                                                    <Col xs={12} sm={6} md={4} className="mb-3">
                                                        <Field name="currency">
                                                            {({ input, meta }) => (
                                                                <div>
                                                                    <Label className="form-label" for="currency">
                                                                        <strong>Payment Currency</strong><span className="text-danger"> *</span>
                                                                    </Label>
                                                                    <input
                                                                        {...input}
                                                                        className="form-control"
                                                                        id="currency"
                                                                        placeholder="Currency"
                                                                    />
                                                                    {meta.error && meta.touched && <p className="d-block text-danger">{meta.error}</p>}
                                                                </div>
                                                            )}
                                                        </Field>
                                                    </Col>



                                                    <Col xs={12} sm={6} md={4} className="mb-3">
                                                        <Field name="conference_fees">
                                                            {({ input, meta }) => (
                                                                <div>
                                                                    <Label className="form-label" for="conference_fees">
                                                                        <strong>Registration Amount</strong><span className="text-danger"> *</span>
                                                                    </Label>
                                                                    <input
                                                                        {...input}
                                                                        className="form-control"
                                                                        id="conference_fees"
                                                                        placeholder="Registration Amount"
                                                                    />
                                                                    {meta.error && meta.touched && <p className="d-block text-danger">{meta.error}</p>}
                                                                </div>
                                                            )}
                                                        </Field>
                                                    </Col>

                                                    <Col xs={12} sm={6} md={4} className="mb-3">
                                                        <Field name="processing_fee">
                                                            {({ input, meta }) => (
                                                                <div>
                                                                    <Label className="form-label" for="processing_fee">
                                                                        <strong>Processing Fees</strong><span className="text-danger"> *</span>
                                                                    </Label>
                                                                    <input
                                                                        {...input}
                                                                        className="form-control"
                                                                        id="processing_fee"
                                                                        placeholder="Processing Fees"
                                                                    />
                                                                    {meta.error && meta.touched && <p className="d-block text-danger">{meta.error}</p>}
                                                                </div>
                                                            )}
                                                        </Field>
                                                    </Col>
                                                </Row>

                                                <Row>
                                                    <Col xs={12} sm={6} md={4} className="mb-3">
                                                        <Field name="total_paid_amount">
                                                            {({ input, meta }) => (
                                                                <div>
                                                                    <Label className="form-label" for="total_paid_amount">
                                                                        <strong>Total Paid Amount</strong><span className="text-danger"> *</span>
                                                                    </Label>
                                                                    <input
                                                                        {...input}
                                                                        className="form-control"
                                                                        id="total_paid_amount"
                                                                        placeholder="Total Paid Amount"
                                                                    />
                                                                    {meta.error && meta.touched && <p className="d-block text-danger">{meta.error}</p>}
                                                                </div>
                                                            )}
                                                        </Field>
                                                    </Col>
                                                </Row>
                                            </>





                                            {/* Back and Submit buttons when the third row is shown */}
                                            {(!showNextStep || isChecked) && (
                                                <Row className="d-flex justify-content-between align-items-center">
                                                    <Col xs="auto">
                                                        {/* Hide Back button when the checkbox is checked */}
                                                        {showNextStep && (
                                                            <Button color='success' className="me-2 mt-3" onClick={handleBackClick}>Back</Button>
                                                        )}
                                                    </Col>
                                                    <Col xs="auto">
                                                        <Button color='warning' className="me-2 mt-3">Cancel</Button>
                                                        <Button color='primary' type='submit' className="me-2 mt-3">Submit</Button>
                                                    </Col>
                                                </Row>

                                            )}

                                        </form>
                                    )}
                                </Form>

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
                <ModalFooter>
                    <button onClick={handleNavigation} className="btn btn-warning">
                        Yes
                    </button>
                    {/* <Link to="/manage-facility/Consoft" className="btn btn-warning">Yes</Link> */}
                    <Button color="primary" onClick={() => setModal(!modal)}>No</Button>
                </ModalFooter>
            </Modal>

            {/* Edit Modal */}
            <Modal isOpen={isEditModalOpen} toggle={handleModalClose} size='lg'>
                {/* <div className="modal-header">
                    <h5 className="modal-title">Edit Payment</h5>
                    <button type="button" className="close" onClick={handleModalClose}>
                        <span>&times;</span>
                    </button>
                </div> */}
                <ModalHeader toggle={handleModalClose}>Edit Payment</ModalHeader>
                <ModalBody>
                    <Form
                        onSubmit={handleEditSubmit}
                        initialValues={{
                            paymenttype_id: selectedPayment?.paymenttype_id || '',
                            paymentstatus_id: selectedPayment?.paymentstatus_id || '',
                            tracking_id: selectedPayment?.tracking_id || '',
                            bank: selectedPayment?.bank || '',
                            branch: selectedPayment?.branch || '',
                            currency: selectedPayment?.currency || '',
                            conference_fees: selectedPayment?.conference_fees || '',
                            processing_fee: selectedPayment?.processing_fee || '',
                            total_paid_amount: selectedPayment?.total_paid_amount || '',
                            payment_date: selectedPayment?.payment_date ? moment(selectedPayment.payment_date).format('YYYY-MM-DD') : ''
                        }}
                        render={({ handleSubmit }) => (
                            <form onSubmit={handleSubmit}>
                                <Row>
                                    <Col xs={12} sm={6} md={4} className="mb-3">
                                        <Field name="paymenttype_id">
                                            {({ input, meta }) => {
                                                const selectedOption = paymentTypeOptions.find(option => option.value === input.value);
                                                return (
                                                    <div>
                                                        <Label className="form-label" for="paymenttype_id">
                                                            <strong>Payment Type</strong>
                                                        </Label>
                                                        <Select
                                                            {...input}
                                                            options={paymentTypeOptions}
                                                            placeholder="Select Payment Type"
                                                            isSearchable
                                                            onChange={(value) => input.onChange(value)}
                                                            classNamePrefix="react-select"
                                                            isMulti={false}
                                                            value={selectedOption}
                                                        />
                                                        {meta.touched && meta.error && <p className="d-block text-danger">{meta.error}</p>}
                                                    </div>
                                                );
                                            }}
                                        </Field>
                                    </Col>

                                    <Col xs={12} sm={6} md={4} className="mb-3">
                                        <Field name="paymentstatus_id">
                                            {({ input, meta }) => {
                                                const selectedOption = paymentStatusOptions.find(option => option.value === input.value);
                                                return (
                                                    <div>
                                                        <Label className="form-label" for="paymentstatus_id">
                                                            <strong>Payment Status</strong>
                                                        </Label>
                                                        <Select
                                                            {...input}
                                                            options={paymentStatusOptions}
                                                            placeholder="Select Payment Status"
                                                            isSearchable
                                                            onChange={(value) => input.onChange(value)}
                                                            classNamePrefix="react-select"
                                                            isMulti={false}
                                                            value={selectedOption}
                                                        />
                                                        {meta.touched && meta.error && <p className="d-block text-danger">{meta.error}</p>}
                                                    </div>
                                                );
                                            }}
                                        </Field>
                                    </Col>

                                    <Col xs={12} sm={6} md={4} className="mb-3">
                                        <Field name="tracking_id">
                                            {({ input, meta }) => (
                                                <div>
                                                    <Label className="form-label" for="cheque_no" style={{ fontSize: '12px' }}>
                                                        <strong>DD / CHEQUE NO. / TRANSACTION ID</strong><span className="text-danger"> *</span>
                                                    </Label>
                                                    <input
                                                        {...input}
                                                        className="form-control"
                                                        id="cheque_no"
                                                        placeholder="Transaction ID"
                                                    />
                                                    {meta.touched && meta.error && <p className="d-block text-danger">{meta.error}</p>}
                                                </div>
                                            )}
                                        </Field>


                                    </Col>

                                </Row>
                                <Row>



                                    <Col xs={12} sm={6} md={4} className="mb-3">
                                        <Field name="payment_date">
                                            {({ input, meta }) => (
                                                <div>
                                                    <Label className="form-label" for="payment_date">
                                                        <strong>Payment Date</strong><span className="text-danger"> *</span>
                                                    </Label>
                                                    <input
                                                        {...input}
                                                        className="form-control"
                                                        id="payment_date"
                                                        type="date"
                                                        max="9999-12-31"
                                                        placeholder="Enter Payment Date"
                                                        disabled
                                                    />
                                                    {meta.touched && meta.error && <p className="d-block text-danger">{meta.error}</p>}
                                                </div>
                                            )}
                                        </Field>
                                    </Col>

                                    <Col xs={12} sm={6} md={4} className="mb-3">
                                        <Field name="bank">
                                            {({ input, meta }) => (
                                                <div>
                                                    <Label className="form-label" for="bank">
                                                        <strong>Bank</strong><span className="text-danger"> *</span>
                                                    </Label>
                                                    <input
                                                        {...input}
                                                        className="form-control"
                                                        id="bank"
                                                        placeholder="Bank"
                                                    />
                                                    {meta.error && meta.touched && <p className="d-block text-danger">{meta.error}</p>}
                                                </div>
                                            )}
                                        </Field>
                                    </Col>

                                    <Col xs={12} sm={6} md={4} className="mb-3">
                                        <Field name="branch">
                                            {({ input, meta }) => (
                                                <div>
                                                    <Label className="form-label" for="branch">
                                                        <strong>Branch</strong><span className="text-danger"> *</span>
                                                    </Label>
                                                    <input
                                                        {...input}
                                                        className="form-control"
                                                        id="branch"
                                                        placeholder="Branch"
                                                    />
                                                    {meta.error && meta.touched && <p className="d-block text-danger">{meta.error}</p>}
                                                </div>
                                            )}
                                        </Field>
                                    </Col>

                                </Row>

                                <Row>


                                    <Col xs={12} sm={6} md={4} className="mb-3">
                                        <Field name="currency">
                                            {({ input, meta }) => (
                                                <div>
                                                    <Label className="form-label" for="currency">
                                                        <strong>Payment Currency</strong><span className="text-danger"> *</span>
                                                    </Label>
                                                    <input
                                                        {...input}
                                                        className="form-control"
                                                        id="currency"
                                                        placeholder="Currency"
                                                    />
                                                    {meta.error && meta.touched && <p className="d-block text-danger">{meta.error}</p>}
                                                </div>
                                            )}
                                        </Field>
                                    </Col>



                                    <Col xs={12} sm={6} md={4} className="mb-3">
                                        <Field name="conference_fees">
                                            {({ input, meta }) => (
                                                <div>
                                                    <Label className="form-label" for="conference_fees">
                                                        <strong>Registration Amount</strong><span className="text-danger"> *</span>
                                                    </Label>
                                                    <input
                                                        {...input}
                                                        className="form-control"
                                                        id="conference_fees"
                                                        placeholder="Registration Amount"
                                                    />
                                                    {meta.error && meta.touched && <p className="d-block text-danger">{meta.error}</p>}
                                                </div>
                                            )}
                                        </Field>
                                    </Col>

                                    <Col xs={12} sm={6} md={4} className="mb-3">
                                        <Field name="processing_fee">
                                            {({ input, meta }) => (
                                                <div>
                                                    <Label className="form-label" for="processing_fee">
                                                        <strong>Processing Fees</strong><span className="text-danger"> *</span>
                                                    </Label>
                                                    <input
                                                        {...input}
                                                        className="form-control"
                                                        id="processing_fee"
                                                        placeholder="Processing Fees"
                                                    />
                                                    {meta.error && meta.touched && <p className="d-block text-danger">{meta.error}</p>}
                                                </div>
                                            )}
                                        </Field>
                                    </Col>
                                </Row>

                                <Row>
                                    <Col xs={12} sm={6} md={4} className="mb-3">
                                        <Field name="total_paid_amount">
                                            {({ input, meta }) => (
                                                <div>
                                                    <Label className="form-label" for="total_paid_amount">
                                                        <strong>Total Paid Amount</strong><span className="text-danger"> *</span>
                                                    </Label>
                                                    <input
                                                        {...input}
                                                        className="form-control"
                                                        id="total_paid_amount"
                                                        placeholder="Total Paid Amount"
                                                    />
                                                    {meta.error && meta.touched && <p className="d-block text-danger">{meta.error}</p>}
                                                </div>
                                            )}
                                        </Field>
                                    </Col>
                                </Row>

                                {/* Add more fields similarly as shown above */}

                                <div className="modal-footer">
                                    <Button color="warning" onClick={handleModalClose}>
                                        Cancel
                                    </Button>
                                    <Button type="submit" color="primary">
                                        Save Changes
                                    </Button>
                                </div>
                            </form>
                        )}
                    />
                </ModalBody>

            </Modal>


        </Fragment>
    );
};

export default AddPayment;




