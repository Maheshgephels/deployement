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
    const [selectedFields, setSelectedFields] = useState([]);
    const [reportName, setReportName] = useState(''); // Default to an empty string or a default name
    const [reportType, setReportType] = useState('');
    const [startDate, setStartDate] = useState("");
    const { permissions } = useContext(PermissionsContext);


    console.log("Report Type", reportType);

    useEffect(() => {
        fetchUser();
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

            // Ensure userData is an array and set the field options from fieldData
            setData(response.data.userData || []);
            setUser(response.data.userData[0] || {});

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

    const handlePriceChange = (e) => {
        setReportType(e.target.value);
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
        cs_phone: 'Contact Number',
        cs_email: 'Email',
        paymentstatus_name: 'Payment Status',
        paymenttype_name: 'Payment Type',
        tracking_id: 'Tracking Id',
        currency: 'Currency',
        total_paid_amount: 'Total Paid Amount',
        payment_date: 'Payment Date'
        // Add more mappings here as needed
    };

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
                } else if (field.label === 'Status') {
                    rowData.push(
                        item.cs_status ? 'Active' : 'Inactive' // Correct handling of status
                    );
                } else {
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
                            Customize and download a report of users by selecting the category, event days, date range of registration.
                        </PopoverBody>
                    </UncontrolledPopover>
                </>
            } parent="Registration Admin" title="Basic User Report" />
            <Container fluid={true}>
            <Row className='justify-content-center'>
            <Col sm="6">
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
                                            <Row>
                                                {/* Report Type Radio Buttons */}
                                                <Col md="12" className="mb-3">
                                                    <div className="form-group">
                                                        <strong>Payment Mode</strong>
                                                        <div className="me-5 mt-3">
                                                            <input
                                                                type="radio"
                                                                name="priceType"
                                                                value="Online"
                                                                onChange={handlePriceChange}
                                                                className="me-2"
                                                            />
                                                            <strong>Online Paid Report</strong>
                                                            <input
                                                                type="radio"
                                                                name="priceType"
                                                                value="Offline"
                                                                onChange={handlePriceChange}
                                                                className="ms-3 me-2"
                                                            />
                                                            <strong>Offline Paid Report</strong>
                                                        </div>
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
                                                <Field name="endDate">
                                                        {({ input }) => (
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