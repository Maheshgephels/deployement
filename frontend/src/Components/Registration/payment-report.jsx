import React, { Fragment, useState, useEffect, useContext } from 'react';
import { Container, Row, Input, Col, Button, Card, CardBody, Modal, ModalHeader, ModalBody, ModalFooter, Label, PopoverBody, UncontrolledPopover } from 'reactstrap';
import axios from 'axios';
import Swal from 'sweetalert2';
import { Breadcrumbs } from '../../AbstractElements';
import { BackendAPI } from '../../api';
import { useNavigate } from 'react-router-dom';
import { required, option } from '../Utils/validationUtils';
import Select from 'react-select';
import { MdDelete, MdInfoOutline } from "react-icons/md";
import { Field, Form } from 'react-final-form';
import styled from 'styled-components';
import useAuth from '../../Auth/protectedAuth';
import { getToken } from '../../Auth/Auth';
import { PermissionsContext } from '../../contexts/PermissionsContext';
import * as XLSX from 'xlsx';
import moment from 'moment';

const RedAsterisk = styled.span`
  color: red;
`;

// Utility function used to combine multiple validation functions into a single validation function
const composeValidators = (...validators) => value =>
    validators.reduce((error, validator) => error || validator(value), undefined);

const PaymentReport = () => {
    useAuth();
    const [data, setData] = useState([]);
    const [user, setUser] = useState({});
    const [fielddata, setFieldData] = useState([]);
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [modal, setModal] = useState(false);
    const [error, setError] = useState('');
    const [selectedFields, setSelectedFields] = useState([]);
    const [reportName, setReportName] = useState(''); // Default to an empty string or a default name
    const [reportType, setReportType] = useState('');
    const [startDate, setStartDate] = useState("");
    const [isInternational, setIsInternational] = useState('');
    const { permissions } = useContext(PermissionsContext);


    console.log("Report Type", reportType);

    useEffect(() => {
        fetchUser();
        fetchSettings();
    }, [permissions]);

    // Extract Facultys component
    const BasicUserReportPermissions = permissions['PaymentReport'];

    const fetchUser = async () => {
        try {
            const token = getToken();
            const response = await axios.get(`${BackendAPI}/reports/getPaymentData`, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
            console.log("Response", response.data);

            // Ensure updatedPaymentData is an array and set the field options from fieldData
            setData(response.data.updatedPaymentData || []);
            setUser(response.data.updatedPaymentData[0] || {});

            // Set options dynamically from fieldData
            // const dynamicOptions = response.data.fieldData.map(field => ({
            //     value: field.cs_field_name,
            //     label: field.cs_field_label
            // }));
            // setFieldData(response.data.fieldData);

            setLoading(false);
        } catch (error) {
            console.error('Error fetching exhibitor data:', error);
            setLoading(false);
        }
    };

    const fetchSettings = async () => {
        try {

            const response = await axios.get(`${BackendAPI}/setting/getsettings`, {});
            const fetchedSettings = response.data.settings;

            console.log("Fetch Setting", fetchedSettings);
            // setShow(fetchedSettings);
            const isInternationalSetting = fetchedSettings.find(setting => setting.cs_parameter === 'is_international');
            setIsInternational(isInternationalSetting?.cs_value === 'Yes');

        } catch (error) {
            console.error("Error fetching settings:", error);
        }
    };

    const handlePriceChange = (e) => {
        setReportType(e.target.value); // Update the report type state
        setError(''); // Clear any errors
        setSelectedFields([]); // Correctly update the selectedFields state to an empty array
    };




    const handleCancel = () => {
        setModal(true);
    };

    const handleNavigation = () => {
        navigate(`${process.env.PUBLIC_URL}/event/dashboard/Consoft`);
    };

    const keyLabelMapping = {
        cs_regno: 'Registration Number',
        cs_first_name: 'First Name',
        cs_last_name: 'Last Name',
        cs_reg_category: 'Registration Category',
        cs_email: 'Email',
        cs_phone: 'Contact Number',
        cs_state: 'State',
        paymenttype_name: 'Payment Type',
        cheque_no: 'Transaction No/Cheque No/DD No',
        tracking_id: 'Tracking Id',
        bank: 'Bank',
        branch: 'Branch',
        currency: 'Currency',
        conference_fees: 'Registration Amount',
        addon_fees: 'Add-on Amount'
        // Add more static mappings here as needed
    };

    // Conditionally add keys based on 'isInternational'
    if (!isInternational) {
        keyLabelMapping.cgst_amount = 'CGST';
        keyLabelMapping.sgst_amount = 'SGST';
        keyLabelMapping.igst_amount = 'IGST';
        keyLabelMapping.tax_amount = 'Total Tax Amount';
    } else {
        keyLabelMapping.tax_amount = 'Total Tax Amount';
    }

    // Add other common keys (if needed)
    keyLabelMapping.processing_fee = 'Processing Fee';
    keyLabelMapping.total_paid_amount = 'Total Paid Amount'
    keyLabelMapping.payment_date = 'Payment Date';
    keyLabelMapping.status = 'Payment Status';
    keyLabelMapping.is_cancel = 'User Status';


    // Create an array of options maintaining the order defined in keyLabelMapping
    const exhOptions = Object.entries(keyLabelMapping).map(([key, label]) => ({
        value: key,
        label: label // Use the mapped label directly
    }));

    // exhOptions now maintains the sequence as per keyLabelMapping


    // const exhOptions = [
    //     ...fielddata.map(field => ({
    //         value: field.cs_field_name,
    //         label: field.cs_field_label
    //     })),
    //     { value: 'cs_status', label: 'Status' },
    //     { value: 'created_at', label: 'Created Date' } // Hardcoded option at the end

    // ];




    // Add the "Select All" option
    const selectAllOption = {
        value: 'select_all',
        label: 'Select All'
    };

    const handleSelectChange = (selectedOptions) => {
        if (selectedOptions.some(option => option.value === 'select_all')) {
            // Select all options
            setSelectedFields(exhOptions); // Set all options as selected
        } else {
            setSelectedFields(selectedOptions);
        }
    };

    const handleReportDownload = (form) => {
        form.submit(); // Trigger validation

        // Validate price type selection
        if (!reportType) {
            setError('Please select any one of the above options.');
            return;
        }

        // Check if there are errors in the form
        const errors = form.getState().errors;
        if (Object.keys(errors).length === 0 && selectedFields.length > 0) {
            const startDate = form.getState().values.startDate;
            const endDate = form.getState().values.endDate;
            generateXLSX(selectedFields, startDate, endDate);
            // form.reset(); // Reset the form fields
        }
    };

    const generateXLSX = (fields, startDate, endDate) => {
        if (!Array.isArray(data) || data.length === 0) {
            console.error('Data is not an array or is empty:', data);
            return;
        }

        // Filter data based on reportType
        const typeFilteredData = data.filter(item => {
            const paymentMode = item.payment_mode; // Extract payment_mode

            // Include all records when reportType is '*' or empty
            if (reportType === "" || reportType === "*" || reportType.toLowerCase() === "payment") {
                return true; // Include all records
            }

            // Check if payment_mode is not null and matches the reportType
            return reportType === "" || (paymentMode !== null && paymentMode.toLowerCase() === String(reportType).toLowerCase());
        });

        console.log("Filter", typeFilteredData);

        // Get the admin's timezone
        const AdminTimezone = localStorage.getItem('AdminTimezone');


        // Parse the start and end dates properly
        const start = startDate ? moment(startDate).startOf('day') : null;
        const end = endDate ? moment(endDate).endOf('day') : null;

        // Log the parsed dates to check their values
        // console.log('Parsed Start Date:', start ? start.format('YYYY-MM-DD') : 'None');
        // console.log('Parsed End Date:', end ? end.format('YYYY-MM-DD') : 'None');

        // Filter data by date range using moment
        const dateFilteredData = typeFilteredData.filter(item => {
            const itemDate = moment(item.payment_date); // Ensure this format is correct for your data

            // Log the item date and check against start and end dates
            // console.log('Item Date:', itemDate.format('YYYY-MM-DD'), 'Start:', start ? start.format('YYYY-MM-DD') : 'None', 'End:', end ? end.format('YYYY-MM-DD') : 'None');

            return (!start || itemDate.isSameOrAfter(start)) && (!end || itemDate.isSameOrBefore(end));
        });

        console.log('Filtered Data:', dateFilteredData);

        // Create headers from selected fields and add "Sr. No."
        const headers = ['Sr. No.', ...fields.map(field => field.label)];
        console.log('Headers:', headers);

        // Map data to rows and include serial number
        const rows = dateFilteredData.map((item, index) => {
            const rowData = [index + 1]; // Sr. No.

            fields.forEach(field => {
                if (field.label === 'Payment Date') {
                    rowData.push(
                        item.payment_date ? moment(item.payment_date)
                            .tz(AdminTimezone)
                            .format('YYYY-MM-DD HH:mm:ss')
                            : ''
                    );
                } else if (field.label === 'DOB') {
                    rowData.push(
                        item.cs_dob ? moment(item.cs_dob).format('YYYY-MM-DD') : '' // Keep empty if cs_dob is not available
                    );
                } else if (field.label === 'IGST') {
                    rowData.push(
                        !item.isStateMatched
                            ? item.igst_amount || '' // If state matches, push IGST amount, or an empty string if undefined
                            : '' // Otherwise, push an empty string
                    );
                }

                else if (field.label === 'Payment Status') {
                    rowData.push(
                        item.status ? 'Active' : 'Inactive' // Correct handling of status
                    );
                } else if (field.label === 'User Status') {
                    rowData.push(
                        item.is_cancel ? 'Cancelled' : 'Active' // Correct handling of status
                    );
                }
                else {
                    rowData.push(item[field.value] || '');
                }
            });

            return rowData;
        });


        console.log('Rows:', rows);

        // Create a new workbook and worksheet using SheetJS (xlsx)
        const wb = XLSX.utils.book_new(); // Create a new workbook
        const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]); // Add headers and rows

        // Append worksheet to workbook
        XLSX.utils.book_append_sheet(wb, ws, 'Report'); // Name the sheet "Report"

        // Generate the XLSX file and trigger download
        XLSX.writeFile(wb, `${reportName || 'report'}.xlsx`);

        // Show success alert
        Swal.fire({
            title: 'Success!',
            text: 'Report generated successfully!',
            icon: 'success',
            timer: 3000,
            showConfirmButton: false,
            allowOutsideClick: false,
            allowEscapeKey: false
        }).then((result) => {
            if (result.dismiss === Swal.DismissReason.timer) {
                navigate(`${process.env.PUBLIC_URL}/registration/payment-report/Consoft`);
            }
        });
    };




    return (
        <Fragment>
            <Breadcrumbs mainTitle={
                <>
                    Payment Report
                    <MdInfoOutline
                        id="categoryPopover"
                        style={{
                            cursor: 'pointer', position: 'absolute', marginLeft: '5px'
                        }}
                    />
                    <UncontrolledPopover
                        placement="bottom"
                        target="categoryPopover"
                        trigger="focus"
                    >
                        <PopoverBody>
                            • Create a custom report by entering a report name and selecting the Payment Mode (Online or Offline).<br />
                            • Define the date range for the report by specifying the From Date and To Date.<br />
                            • Choose the fields to include in the report by selecting them from the Select Field option.
                        </PopoverBody>
                    </UncontrolledPopover>
                </>
            } parent="Registration Admin" title="Payment Report" />
            <Container fluid={true}>
                <Row className='justify-content-center'>
                    <Col sm="8">
                        <Card>
                            <CardBody>
                                <Form
                                    onSubmit={() => { }}
                                    render={({ handleSubmit, form }) => (
                                        <form className='needs-validation' noValidate onSubmit={handleSubmit}>
                                            <Row>
                                                <Col md="12" className="mb-3">
                                                    <Field
                                                        name="repName"
                                                        validate={composeValidators(required)}
                                                    >
                                                        {({ input, meta }) => (
                                                            <div>
                                                                <Label className='form-label' for="repname"><strong>Report Name <span className="red-asterisk">*</span></strong></Label>
                                                                <Input
                                                                    {...input}
                                                                    className="form-control"
                                                                    id="repname"
                                                                    type="text"
                                                                    placeholder="Enter report name"
                                                                    value={input.value} // Ensure the input value is controlled
                                                                    onChange={(e) => {
                                                                        setReportName(e.target.value);
                                                                        input.onChange(e); // Update form state
                                                                    }}
                                                                />
                                                                {meta.error && meta.touched && <p className='d-block text-danger'>{meta.error}</p>}
                                                            </div>
                                                        )}
                                                    </Field>
                                                </Col>
                                            </Row>
                                            <Row className="mb-3">
                                                {/* Report Type Radio Buttons */}
                                                <Col md="12">
                                                    <div className="form-group">
                                                        <strong>Payment Mode<span className="red-asterisk"> *</span></strong>
                                                        <div className="d-flex flex-column flex-md-row mt-3">
                                                            <div className="d-flex align-items-center mb-2 mb-md-0">
                                                                <input
                                                                    type="radio"
                                                                    name="priceType"
                                                                    value="*"
                                                                    onChange={handlePriceChange}
                                                                    className="me-2"
                                                                />
                                                                <strong>All Payment Report</strong>
                                                            </div>
                                                            <div className="d-flex align-items-center mb-2 mb-md-0 ms-md-3">
                                                                <input
                                                                    type="radio"
                                                                    name="priceType"
                                                                    value="Online"
                                                                    onChange={handlePriceChange}
                                                                    className="me-2"
                                                                />
                                                                <strong>Online Paid Report</strong>
                                                            </div>
                                                            <div className="d-flex align-items-center ms-md-3">
                                                                <input
                                                                    type="radio"
                                                                    name="priceType"
                                                                    value="Offline"
                                                                    onChange={handlePriceChange}
                                                                    className="me-2"
                                                                />
                                                                <strong>Offline Paid Report</strong>
                                                            </div>
                                                        </div>
                                                        {error && <p className='d-block text-danger'>{error}</p>}
                                                    </div>
                                                </Col>
                                            </Row>

                                            <Row>
                                                <Col md="6" className="mb-3">
                                                    <Field name="startDate">
                                                        {({ input }) => (
                                                            <div>
                                                                <Label className='form-label' for="startDate"><strong>From Date</strong></Label>
                                                                <input
                                                                    {...input}
                                                                    className="form-control"
                                                                    id="start_date"
                                                                    type="date"
                                                                    placeholder="Enter Start Date"
                                                                    // min={minDate}
                                                                    max="9999-12-31"
                                                                    onChange={(e) => {
                                                                        input.onChange(e); // updates the form state
                                                                        setStartDate(e.target.value); // updates local state
                                                                    }}
                                                                />
                                                            </div>
                                                        )}
                                                    </Field>
                                                </Col>


                                                <Col md="6" className="mb-3">
                                                    <Field name="endDate"
                                                        validate={startDate ? required : undefined}
                                                    >
                                                        {({ input, meta }) => (
                                                            <div>
                                                                <Label className='form-label' for="endDate"><strong>To Date</strong></Label>
                                                                <input
                                                                    {...input}
                                                                    className="form-control"
                                                                    id="end_date"
                                                                    type="date"
                                                                    placeholder="Enter End Date"
                                                                    min={startDate}
                                                                    max="9999-12-31"
                                                                />
                                                                {meta.error && meta.touched && (
                                                                    <p className="d-block text-danger">{meta.error}</p> // Display validation error
                                                                )}
                                                            </div>
                                                        )}

                                                    </Field>
                                                </Col>
                                            </Row>
                                            <Row>
                                                <Col md="12" className="mb-3">
                                                    <Label className='form-label' htmlFor="fields"><strong>Select Field <span className="red-asterisk">*</span></strong></Label>
                                                    <Field name="fields"
                                                        validate={option}>
                                                        {({ input, meta }) => (
                                                            <div>
                                                                <Select
                                                                    {...input}
                                                                    options={[selectAllOption, ...exhOptions]}
                                                                    placeholder="Select Fields"
                                                                    isMulti
                                                                    onChange={(selectedOptions) => {
                                                                        handleSelectChange(selectedOptions);
                                                                        input.onChange(selectedOptions.filter(option => option.value !== 'select_all')); // Update form state without "Select All"
                                                                    }}
                                                                    classNamePrefix="react-select"
                                                                    value={selectedFields} // Display selected fields without "Select All"
                                                                    isClearable={false}
                                                                />
                                                                {meta.error && meta.touched && <p className='d-block text-danger'>{meta.error}</p>}
                                                            </div>
                                                        )}
                                                    </Field>
                                                </Col>
                                            </Row>
                                            {BasicUserReportPermissions?.validate === 1 && (
                                                <div>
                                                    <Button color='primary' onClick={() => handleReportDownload(form)} className="me-2 mt-3">Generate Report</Button>
                                                    <Button color='warning' onClick={handleCancel} className="mt-3">Cancel</Button>
                                                </div>
                                            )}
                                        </form>
                                    )}
                                />
                            </CardBody>
                        </Card>
                    </Col>
                </Row>
            </Container>

            {/* Modal for Confirmation */}
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
                    <Button
                        onClick={handleNavigation} color='warning'>
                        Yes
                    </Button>
                    <Button color="primary" onClick={() => setModal(!modal)}>No</Button>
                </ModalFooter>
            </Modal>
        </Fragment>
    );
};

export default PaymentReport;