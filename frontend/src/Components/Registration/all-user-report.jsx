import React, { Fragment, useState, useEffect, useContext } from 'react';
import { Container, Row, Input, Col, Button, Card, CardBody, Modal, ModalHeader, ModalBody, ModalFooter, Label, PopoverBody, UncontrolledPopover, CardHeader } from 'reactstrap';
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

const AllUserReport = () => {
    useAuth();
    const [data, setData] = useState([]);
    const [user, setUser] = useState({});
    const [fielddata, setFieldData] = useState([]);
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [modal, setModal] = useState(false);
    const [error, setError] = useState('');
    const [show, setShow] = useState('');
    const [selectedFields, setSelectedFields] = useState([]);
    const [reportName, setReportName] = useState(''); // Default to an empty string or a default name
    const { permissions } = useContext(PermissionsContext);
    const [reportType, setReportType] = useState('');
    const [regCat, setRegCat] = useState([]);
    const [ticket, setTicket] = useState([]);
    const [addon, setAddon] = useState([]);
    const [startDate, setStartDate] = useState("");
    const categoryOptions = regCat.map(status => ({
        value: status.cs_reg_cat_id,
        label: status.cs_reg_category
    }));
    const ticketOptions = ticket.map(status => ({
        value: status.ticket_id,  // Correctly accessing ticket_id
        label: status.ticket_title
    }));
    const addonOptions = addon.map(status => ({
        value: status.addon_id,
        label: status.addon_title
    }));


    console.log("Report Type", reportType);

    useEffect(() => {
        fetchUser();
        fetchDropdown();
        fetchSettings();
    }, [permissions]);

    // Extract Facultys component
    const BasicUserReportPermissions = permissions['AllUserReport'];

    const fetchUser = async () => {
        try {
            const token = getToken();
            const response = await axios.get(`${BackendAPI}/reports/getConfirmUserData`, {
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
            setFieldData(response.data.fieldData);

            setLoading(false);
        } catch (error) {
            console.error('Error fetching exhibitor data:', error);
            setLoading(false);
        }
    };

    const fetchSettings = async () => {
        try {

            const response = await axios.get(`${BackendAPI}/auth/getsettings`, {});
            const fetchedSettings = response.data.settings;

            console.log("Fetch Setting", fetchedSettings);
            setShow(fetchedSettings);


        } catch (error) {
            console.error("Error fetching settings:", error);
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

            const fetchregcat = response.data.regCategory;
            const fetchTicket = response.data.ticket;
            const fetchAddon = response.data.addon;

            setRegCat(fetchregcat);
            setTicket(fetchTicket);
            setAddon(fetchAddon);



        } catch (error) {
            console.error('Error fetching dropdown data:', error);
            setLoading(false);
        }
    };


    const handleCancel = () => {
        setModal(true);
    };

    const handleNavigation = () => {
        navigate(`${process.env.PUBLIC_URL}/event/dashboard/Consoft`);
    };

    const handlePriceChange = (e) => {
        setReportType(e.target.value);
        setError('');
        setSelectedFields([])
    };

    const keyLabelMapping = {
        cs_title: 'Title',
        cs_first_name: 'First Name',
        cs_last_name: 'Last Name',
        cs_reg_category: 'Registration Category',
        cs_phone: 'Contact Number',
        cs_email: 'Email',
        cs_username: 'User Name',
        cs_password: 'Password',
        created_at: 'Registration Date'
        // Add more mappings here as needed
    };

    // const exhOptions = Object.keys(user)
    //     .filter(key => keyLabelMapping[key])
    //     .map(key => ({
    //         value: key,
    //         label: keyLabelMapping[key] || key // Use the mapped label or default to the key
    //     }));

    const exhOptions = [
        ...(reportType === "*" || reportType === "1" || reportType === "iscomplimentary" || reportType === "isCompany" || reportType === "cancelUser"
          ? [{ value: 'cs_regno', label: 'Registration Number' }]
          : []), // Conditionally add option
        ...fielddata.map(field => ({
          value: field.cs_field_name,
          label: field.cs_field_label
        })),
        ...(reportType === "*" || reportType === "1" ? [{ value: 'cs_remark', label: 'General Remark' }] : []),
        ...(reportType === "*" || reportType === "1" ? [{ value: 'cs_iscomplimentary', label: 'Payment Status' }] : []),
        ...(reportType === "cancelUser" ? [{ value: 'cancellation_reason', label: 'Cancellation Reason' }] : []),
        ...(reportType === "isCompany" || reportType === "1"
          ? [
              { value: 'cs_companyregistration', label: 'Company Registration' },
              { value: 'cs_company_name', label: 'Company Name' }
            ]
          : []),
        { value: 'cs_status', label: 'Status' },
        ...(reportType === "*" ? [{ value: 'cs_isconfirm', label: 'User Status' }] : []), // Conditionally add option
        { value: 'created_at', label: 'Registration Date' } // Hardcoded option at the end
      ];
      



    // Add the "Select All" option
    const selectAllOption = {
        value: 'select_all',
        label: 'Select All'
    };

    const handleSelectChange = (selectedOptions) => {
        if (selectedOptions.some(option => option.value === 'select_all')) {
            // Select all options except "Select All"
            setSelectedFields(exhOptions);
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

        const errors = form.getState().errors;
        if (Object.keys(errors).length === 0 && selectedFields.length > 0) {
            const startDate = form.getState().values.startDate;
            const endDate = form.getState().values.endDate;
            const selectedCategories = form.getState().values.cs_reg_cat_id;
            const selectedTickets = form.getState().values.cs_ticket;
            const selectedAddons = form.getState().values.cs_addons;

            generateXLSX(selectedFields, startDate, endDate, selectedCategories, selectedTickets, selectedAddons);
        }
    };


    const generateXLSX = (fields, startDate, endDate, selectedCategories, selectedTickets, selectedAddons) => {
        if (!Array.isArray(data) || data.length === 0) {
            console.error('Data is not an array or is empty:', data);
            return;
        }

        console.log("Selected Categories:", selectedCategories);
        console.log("Selected Ticket:", selectedTickets);
        console.log("Selected Addon:", selectedAddons);

        // Filter data based on reportType
        const typeFilteredData = data.filter(item => {
            // Check for empty reportType (default), or match based on reportType
            if (reportType === "*") {
                return true;
            }

            // If reportType is 'iscomplimentary', check for cs_iscomplimentary
            if (reportType === 'iscomplimentary') {
                return item.cs_iscomplimentary === 1; // Only include items where cs_iscomplimentary is 1
            }

            // If reportType is 'nonConfirm', check for confirm_payment
            if (reportType === 'nonConfirm') {
                return item.confirm_payment === 1 && item.cs_isconfirm === 0; // Only include items where cs_iscomplimentary is 1
            }

            // If reportType is 'cancelUser', check for confirm_payment
            if (reportType === 'cancelUser') {
                return item.cs_status === 2; // Only include items where cs_status is 2
            }

            // If reportType is 'Company User', check for cs_companyregistration
            if (reportType === 'isCompany') {
                return item.cs_companyregistration === 'Yes'; // Only include items where cs_companyregistration is 1
            }


            // Otherwise, apply the existing logic based on cs_isconfirm
            return item.cs_isconfirm === parseInt(reportType);
        });


        // Apply filters for Category, Ticket, and Add-on
        const filteredData = typeFilteredData.filter(item => {
            const categoryMatch = !selectedCategories || selectedCategories.some(category => {
                const match = category === item.cs_reg_cat_id;
                return match;
            });

            const ticketMatch = !selectedTickets || selectedTickets.some(ticket => {
                const match = ticket === item.cs_ticket;
                return match;
            });

            const addonMatch = !selectedAddons || selectedAddons.some(addon => {
                const match = addon === item.cs_addons;
                return match;
            });

            return categoryMatch && ticketMatch && addonMatch;
        });


        // Parse the start and end dates properly
        const start = startDate ? moment(startDate).startOf('day') : null;
        const end = endDate ? moment(endDate).endOf('day') : null;

        // Log the parsed dates to check their values
        // console.log('Parsed Start Date:', start ? start.format('YYYY-MM-DD') : 'None');
        // console.log('Parsed End Date:', end ? end.format('YYYY-MM-DD') : 'None');

        // Filter data by date range using moment
        const dateFilteredData = filteredData.filter(item => {
            const itemDate = moment(item.created_at); // Ensure this format is correct for your data

            // Log the item date and check against start and end dates
            // console.log('Item Date:', itemDate.format('YYYY-MM-DD'), 'Start:', start ? start.format('YYYY-MM-DD') : 'None', 'End:', end ? end.format('YYYY-MM-DD') : 'None');

            return (!start || itemDate.isSameOrAfter(start)) && (!end || itemDate.isSameOrBefore(end));
        });

        console.log('Filtered Data:', dateFilteredData); // Log the filtered data

        if (dateFilteredData.length === 0) {
            Swal.fire({
                title: 'No Data Found!',
                text: 'No records match the selected criteria.',
                icon: 'warning',
                timer: 3000,
                showConfirmButton: false
            });
            return;
        }

        // Get the admin's timezone
        const AdminTimezone = localStorage.getItem('AdminTimezone');

        // Create headers from selected fields and add "Sr. No."
        const headers = ['Sr. No.', ...fields.map(field => field.label)];

        // Map data to rows and include serial number
        const rows = dateFilteredData.map((item, index) => {
            const rowData = [index + 1]; // Sr. No.

            fields.forEach(field => {
                if (field.label === 'Registration Date') {
                    rowData.push(
                        moment(item.created_at)
                            .tz(AdminTimezone)
                            .format('YYYY-MM-DD HH:mm:ss')
                    );
                } else if (field.label === 'Company Registration') {
                    rowData.push(
                        item.cs_companyregistration ? 'Company' : 'Direct' // Correct handling of status
                    );
                } else if (field.label === 'Payment Status') {
                    rowData.push(
                        item.cs_iscomplimentary ? 'Complimentary' : 'Fully Paid' // Correct handling of status
                    );
                }
                else if (field.label === 'User Status') {
                    rowData.push(
                        item.cs_isconfirm ? 'Confirm' : 'Basic' // Correct handling of status
                    );
                }
                else if (field.label === 'DOB') {
                    rowData.push(
                        item.cs_dob ? moment(item.cs_dob).format('YYYY-MM-DD') : '' // Keep empty if cs_dob is not available
                    );
                } else if (field.label === 'Status') {
                    rowData.push(
                        item.cs_status ? 'Active' : 'Inactive' // Correct handling of status
                    );
                } else {
                    rowData.push(item[field.value] || ''); // Use field.value to access other data
                }
            });

            return rowData;
        });


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
                navigate(`${process.env.PUBLIC_URL}/registration/all-user-report/Consoft`);
            }
        });
    };





    return (
        <Fragment>
            <Breadcrumbs mainTitle={
                <>
                    User Report
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
                            • Create and download a custom report of users by entering a report name and selecting the desired report type.<br />
                            • To generate a report based on categories or ticket types, select the Confirm User Report option.<br />
                            • Customize the report by choosing specific details to include, such as user information(Select Field) or ticket categories.
                        </PopoverBody>
                    </UncontrolledPopover>
                </>
            } parent="Registration Admin" title="User Report" />
            <Container fluid={true}>
                <Row className='justify-content-center'>
                    <Col sm="9">
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
                                                <Col md="12">
                                                    <div className="form-group">
                                                        <strong>Report Type<span className="red-asterisk"> *</span></strong>
                                                        <div className="d-flex flex-wrap mt-3">
                                                            <div className="me-4 mb-3">
                                                                <input
                                                                    type="radio"
                                                                    name="priceType"
                                                                    value="*"
                                                                    onChange={handlePriceChange}
                                                                    className="me-2"
                                                                />
                                                                <strong>All User Report</strong>
                                                            </div>
                                                            {show === 'Yes' && (

                                                                <div className="me-4 mb-3">
                                                                    <input
                                                                        type="radio"
                                                                        name="priceType"
                                                                        value="0"
                                                                        onChange={handlePriceChange}
                                                                        className="me-2"
                                                                    />
                                                                    <strong>Basic User Report</strong>
                                                                </div>
                                                            )}


                                                            <div className="me-4 mb-3">
                                                                <input
                                                                    type="radio"
                                                                    name="priceType"
                                                                    value="1"
                                                                    checked={reportType === '1'}
                                                                    onChange={handlePriceChange}
                                                                    className="me-2"
                                                                />
                                                                <strong>Confirm User Report</strong>
                                                            </div>

                                                            <div className="me-4 mb-3">
                                                                <input
                                                                    type="radio"
                                                                    name="priceType"
                                                                    value="iscomplimentary"
                                                                    onChange={handlePriceChange}
                                                                    className="me-2"
                                                                />
                                                                <strong>Complimentary User Report</strong>
                                                            </div>

                                                            <div className="me-4 mb-3">
                                                                <input
                                                                    type="radio"
                                                                    name="priceType"
                                                                    value="nonConfirm"
                                                                    onChange={handlePriceChange}
                                                                    className="me-2"
                                                                />
                                                                <strong>Non Confirm User Report</strong>
                                                            </div>

                                                            <div className="me-4 mb-3">
                                                                <input
                                                                    type="radio"
                                                                    name="priceType"
                                                                    value="cancelUser"
                                                                    onChange={handlePriceChange}
                                                                    className="me-2"
                                                                />
                                                                <strong>Cancel User Report</strong>
                                                            </div>

                                                            <div className="me-4 mb-3">
                                                                <input
                                                                    type="radio"
                                                                    name="priceType"
                                                                    value="isCompany"
                                                                    onChange={handlePriceChange}
                                                                    className="me-2"
                                                                />
                                                                <strong>Company User Report</strong>
                                                            </div>
                                                        </div>
                                                        {error && <p className='d-block text-danger'>{error}</p>}

                                                    </div>
                                                </Col>
                                            </Row>


                                            {reportType === '1' && (
                                                <>
                                                    <Row>
                                                        <Col md="12" className="mb-3">
                                                            <Field name="cs_reg_cat_id">
                                                                {({ input, meta }) => {
                                                                    const selectedOptions = categoryOptions.filter(option =>
                                                                        Array.isArray(input.value) && input.value.includes(option.value)
                                                                    );

                                                                    return (
                                                                        <div>
                                                                            <Label className="form-label" htmlFor="paymenttype_id"><strong>Registration Category</strong></Label>
                                                                            <Select
                                                                                {...input}
                                                                                options={categoryOptions}
                                                                                placeholder="Select Category"
                                                                                isSearchable={true}
                                                                                onChange={(value) => input.onChange(value.map(option => option.value))}
                                                                                onBlur={input.onBlur}
                                                                                classNamePrefix="react-select"
                                                                                isMulti={true}
                                                                                value={categoryOptions.filter(option => input.value?.includes(option.value))}
                                                                            />
                                                                            {meta.error && meta.touched && <p className="d-block text-danger">{meta.error}</p>}
                                                                        </div>
                                                                    );
                                                                }}
                                                            </Field>

                                                        </Col>
                                                        <Col md="12" className="mb-3">
                                                            <Field name="cs_ticket">
                                                                {({ input, meta }) => {
                                                                    // const selectedOption = ticketOptions.find(option => option.value === input.value);
                                                                    const selectedOptions = ticketOptions.filter(option =>
                                                                        Array.isArray(input.value) && input.value.includes(option.label)
                                                                    );
                                                                    return (
                                                                        <div>
                                                                            <Label className="form-label" for="paymenttype_id"><strong>Ticket</strong></Label>
                                                                            <Select
                                                                                {...input}
                                                                                options={ticketOptions}
                                                                                placeholder="Select Ticket"
                                                                                isSearchable={true}
                                                                                onChange={(value) => input.onChange(value.map(option => option.label))}
                                                                                onBlur={input.onBlur}
                                                                                classNamePrefix="react-select"
                                                                                isMulti={true}
                                                                                value={ticketOptions.filter(option => input.value?.includes(option.label))}
                                                                            />
                                                                            {meta.error && meta.touched && <p className="d-block text-danger">{meta.error}</p>}
                                                                        </div>
                                                                    );
                                                                }}
                                                            </Field>
                                                        </Col>
                                                        <Col md="12" className="mb-3">
                                                            <Field name="cs_addons">
                                                                {({ input, meta }) => {
                                                                    // const selectedOption = addonOptions.find(option => option.value === input.value);
                                                                    const selectedOptions = addonOptions.filter(option =>
                                                                        Array.isArray(input.value) && input.value.includes(option.label)
                                                                    );
                                                                    return (
                                                                        <div>
                                                                            <Label className="form-label" for="paymenttype_id"><strong>Add-on</strong></Label>
                                                                            <Select
                                                                                {...input}
                                                                                options={addonOptions}
                                                                                placeholder="Select Addon"
                                                                                isSearchable={true}
                                                                                onChange={(value) => input.onChange(value.map(option => option.label))}
                                                                                onBlur={input.onBlur}
                                                                                classNamePrefix="react-select"
                                                                                isMulti={true}
                                                                                value={addonOptions.filter(option => input.value?.includes(option.label))}
                                                                            />
                                                                            {meta.error && meta.touched && <p className="d-block text-danger">{meta.error}</p>}
                                                                        </div>
                                                                    );
                                                                }}
                                                            </Field>
                                                        </Col>
                                                    </Row>
                                                </>
                                            )}
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
                                                    <Field
                                                        name="endDate"
                                                        validate={startDate ? required : undefined}
                                                    >
                                                        {({ input, meta }) => (
                                                            <div>
                                                                <Label className="form-label" htmlFor="endDate">
                                                                    <strong>To Date</strong>
                                                                </Label>
                                                                <input
                                                                    {...input}
                                                                    className="form-control"
                                                                    id="end_date"
                                                                    type="date"
                                                                    placeholder="Enter End Date"
                                                                    min={startDate} // Dynamically set the minimum date
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
        </Fragment >
    );
};

export default AllUserReport;