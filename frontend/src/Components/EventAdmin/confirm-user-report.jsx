// import React, { Fragment, useState, useEffect, useContext } from 'react';
// import { Container, Row, Input, Col, Button, Card, CardBody, Modal, ModalHeader, ModalBody, ModalFooter, Label, PopoverBody, UncontrolledPopover } from 'reactstrap';
// import axios from 'axios';
// import Swal from 'sweetalert2';
// import { Breadcrumbs } from '../../AbstractElements';
// import { BackendAPI } from '../../api';
// import { useNavigate } from 'react-router-dom';
// import { required, option } from '../Utils/validationUtils';
// import Select from 'react-select';
// import { MdDelete, MdInfoOutline } from "react-icons/md";
// import { Field, Form } from 'react-final-form';
// import styled from 'styled-components';
// import useAuth from '../../Auth/protectedAuth';
// import { getToken } from '../../Auth/Auth';
// import { PermissionsContext } from '../../contexts/PermissionsContext';
// import * as XLSX from 'xlsx';
// import moment from 'moment';

// const RedAsterisk = styled.span`
//   color: red;
// `;

// // Utility function used to combine multiple validation functions into a single validation function
// const composeValidators = (...validators) => value =>
//     validators.reduce((error, validator) => error || validator(value), undefined);

// const ConfirmUserReport = () => {
//     useAuth();
//     const [data, setData] = useState([]);
//     const [user, setUser] = useState({});
//     const navigate = useNavigate();
//     const [loading, setLoading] = useState(true);
//     const [modal, setModal] = useState(false);
//     const [selectedFields, setSelectedFields] = useState([]);
//     const [reportName, setReportName] = useState(''); // Default to an empty string or a default name
//     const { permissions } = useContext(PermissionsContext);

//     console.log(data);

//     useEffect(() => {
//         fetchUser();
//     }, [permissions]);

//     // Extract Facultys component
//     const BasicUserReportPermissions = permissions['ConfirmUserReport'];

//     const fetchUser = async () => {
//         try {
//             const token = getToken();
//             const response = await axios.get(`${BackendAPI}/eventuser/getConfirmUserData
//                 `, {
//                 headers: {
//                     Authorization: `Bearer ${token}`
//                 }
//             });

//             setData(response.data.userData || []); // Ensure data is an array
//             setUser(response.data.userData[0] || {});
//             setLoading(false);
//         } catch (error) {
//             console.error('Error fetching exhibitor data:', error);
//             setLoading(false);
//         }
//     };

//     const handleCancel = () => {
//         setModal(true);
//     };

//     const handleNavigation = () => {
//         navigate(`${process.env.PUBLIC_URL}/event/dashboard/Consoft`);
//     };

//     const keyLabelMapping = {
//         cs_title: 'Title',
//         cs_first_name: 'First Name',
//         cs_last_name: 'Last Name',
//         cs_reg_category: 'Registration Category',
//         cs_phone: 'Contact Number',
//         cs_email: 'Email',
//         cs_username: 'User Name',
//         cs_password: 'Password',
//         created_at: 'Created Date'
//         // Add more mappings here as needed
//     };

//     const exhOptions = Object.keys(user)
//         .filter(key => keyLabelMapping[key])
//         .map(key => ({
//             value: key,
//             label: keyLabelMapping[key] || key // Use the mapped label or default to the key
//         }));

//     // Add the "Select All" option
//     const selectAllOption = {
//         value: 'select_all',
//         label: 'Select All'
//     };

//     const handleSelectChange = (selectedOptions) => {
//         if (selectedOptions.some(option => option.value === 'select_all')) {
//             // Select all options
//             setSelectedFields(exhOptions); // Set all options as selected
//         } else {
//             setSelectedFields(selectedOptions);
//         }
//     };

//     const handleReportDownload = (form) => {
//         form.submit(); // Trigger validation

//         // Check if there are errors in the form
//         const errors = form.getState().errors;
//         if (Object.keys(errors).length === 0 && selectedFields.length > 0) {
//             generateXLSX(selectedFields);
//             // form.reset(); // Reset the form fields
//         }
//     };

//     const generateXLSX = (fields) => {
//         if (!Array.isArray(data) || data.length === 0) {
//             console.error('Data is not an array or is empty:', data);
//             return;
//         }

//         // Get the admin's timezone
//         const AdminTimezone = localStorage.getItem('AdminTimezone');

//         // Create headers from selected fields and add "Sr. No."
//         const headers = ['Sr. No.', ...fields.map(field => field.label)];
//         console.log('Headers:', headers);

//         // Map data to rows and include serial number
//         const rows = data.map((item, index) => {
//             const rowData = [index + 1]; // Sr. No.
//             fields.forEach(field => {
//                 if (field.label === 'Created Date') {
//                     rowData.push(
//                         moment(item.created_at)
//                             .tz(AdminTimezone)
//                             .format('YYYY-MM-DD HH:mm:ss')
//                     );
//                 } else {
//                     rowData.push(item[field.value] || '');
//                 }
//             });
//             return rowData;
//         });
//         console.log('Rows:', rows);

//         // Create a new workbook and worksheet using SheetJS (xlsx)
//         const wb = XLSX.utils.book_new(); // Create a new workbook
//         const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]); // Add headers and rows

//         // Append worksheet to workbook
//         XLSX.utils.book_append_sheet(wb, ws, 'Report'); // Name the sheet "Report"

//         // Generate the XLSX file and trigger download
//         XLSX.writeFile(wb, `${reportName || 'report'}.xlsx`);

//         // Show success alert
//         Swal.fire({
//             title: 'Success!',
//             text: 'Report generated successfully!',
//             icon: 'success',
//             timer: 3000,
//             showConfirmButton: false,
//             allowOutsideClick: false,
//             allowEscapeKey: false
//         }).then((result) => {
//             if (result.dismiss === Swal.DismissReason.timer) {
//                 navigate(`${process.env.PUBLIC_URL}/event/confirm-user-report/Consoft`);
//             }
//         });
//     };


//     // const generateCSV = (fields) => {
//     //     if (!Array.isArray(data) || data.length === 0) {
//     //         console.error('Data is not an array or is empty:', data);
//     //         return;
//     //     }

//     //     // Get the admin's timezone
//     //     const AdminTimezone = localStorage.getItem('AdminTimezone');

//     //     // Create headers from selected fields and add "Sr. No."
//     //     const headers = ['Sr. No.', ...fields.map(field => field.label)];
//     //     console.log('Headers:', headers);

//     //     // Map data to rows and include serial number
//     //     const rows = data.map((item, index) => {
//     //         return [
//     //             index + 1, // Sr. No.
//     //             ...fields.map(field => {
//     //                 if (field.label === 'Created Date') {
//     //                     return moment(item.created_at)
//     //                         .tz(AdminTimezone)
//     //                         .format('YYYY-MM-DD HH:mm:ss');
//     //                 } else {
//     //                     return item[field.value] || '';
//     //                 }
//     //             })
//     //         ];
//     //     });
//     //     console.log('Rows:', rows);

//     //     // Create CSV content
//     //     let csvContent = 'data:text/csv;charset=utf-8,';
//     //     csvContent += headers.join(',') + '\n';
//     //     rows.forEach(row => {
//     //         csvContent += row.join(',') + '\n';
//     //     });

//     //     // Create download link
//     //     const encodedUri = encodeURI(csvContent);
//     //     const link = document.createElement('a');
//     //     link.setAttribute('href', encodedUri);
//     //     link.setAttribute('download', `${reportName || 'report'}.csv`); // Default name if reportName is empty
//     //     document.body.appendChild(link);
//     //     link.click();
//     //     document.body.removeChild(link); // Clean up after download

//     //     // Show success alert
//     //     Swal.fire({
//     //         title: 'Success!',
//     //         text: 'Report generated successfully!',
//     //         icon: 'success',
//     //         timer: 3000,
//     //         showConfirmButton: false,
//     //         allowOutsideClick: false,
//     //         allowEscapeKey: false
//     //     }).then((result) => {
//     //         if (result.dismiss === Swal.DismissReason.timer) {
//     //             navigate(`${process.env.PUBLIC_URL}/event/basic-user-report/Consoft`);
//     //         }
//     //     });
//     // };



//     return (
//         <Fragment>
//             <Breadcrumbs mainTitle={
//                 <>
//                     Confirm User Report
//                     <MdInfoOutline
//                         id="categoryPopover"
//                         style={{
//                             cursor: 'pointer', position: 'absolute', marginLeft: '5px'
//                         }}
//                     />
//                     <UncontrolledPopover
//                         placement="bottom"
//                         target="categoryPopover"
//                         trigger="focus"
//                     >
//                         <PopoverBody>
//                             Customize and download a report of users by selecting the category, event days, date range of registration.
//                         </PopoverBody>
//                     </UncontrolledPopover>
//                 </>
//             } parent="Event App Admin" title="Confirm User Report" />
//             <Container fluid={true}>
//                 <Row>
//                     <Col sm="12">
//                         <Card>
//                             <CardBody>
//                                 <Form
//                                     onSubmit={() => { }}
//                                     render={({ handleSubmit, form }) => (
//                                         <form className='needs-validation' noValidate onSubmit={handleSubmit}>
//                                             <Row>
//                                                 <Col md='4' className='mb-3'>
//                                                     <Field
//                                                         name="repName"
//                                                         validate={composeValidators(required)}
//                                                     >
//                                                         {({ input, meta }) => (
//                                                             <div>
//                                                                 <Label className='form-label' for="repname"><strong>Report Name <span className="red-asterisk">*</span></strong></Label>
//                                                                 <Input
//                                                                     {...input}
//                                                                     className="form-control"
//                                                                     id="repname"
//                                                                     type="text"
//                                                                     placeholder="Enter report name"
//                                                                     value={input.value} // Ensure the input value is controlled
//                                                                     onChange={(e) => {
//                                                                         setReportName(e.target.value);
//                                                                         input.onChange(e); // Update form state
//                                                                     }}
//                                                                 />
//                                                                 {meta.error && meta.touched && <p className='d-block text-danger'>{meta.error}</p>}
//                                                             </div>
//                                                         )}
//                                                     </Field>
//                                                 </Col>
//                                             </Row>
//                                             <Row>
//                                                 <Col md="4" className="mb-3">
//                                                     <Label className='form-label' htmlFor="fields"><strong>Select Field <span className="red-asterisk">*</span></strong></Label>
//                                                     <Field name="fields"
//                                                         validate={option}>
//                                                         {({ input, meta }) => (
//                                                             <div>
//                                                                 <Select
//                                                                     {...input}
//                                                                     options={[selectAllOption, ...exhOptions]}
//                                                                     placeholder="Select Fields"
//                                                                     isMulti={true}
//                                                                     onChange={(selectedOptions) => {
//                                                                         input.onChange(selectedOptions); // Update form state
//                                                                         handleSelectChange(selectedOptions);
//                                                                     }}
//                                                                     classNamePrefix="react-select"
//                                                                     value={input.value} // Ensure the Select value is controlled
//                                                                 />
//                                                                 {meta.error && meta.touched && <p className='d-block text-danger'>{meta.error}</p>}
//                                                             </div>
//                                                         )}
//                                                     </Field>
//                                                 </Col>
//                                             </Row>
//                                             {BasicUserReportPermissions?.validate === 1 && (
//                                             <div>
//                                                 <Button color='primary' onClick={() => handleReportDownload(form)} className="me-2 mt-3">Generate Report</Button>
//                                                 <Button color='warning' onClick={handleCancel} className="mt-3">Cancel</Button>
//                                             </div>
//                                             )}
//                                         </form>
//                                     )}
//                                 />
//                             </CardBody>
//                         </Card>
//                     </Col>
//                 </Row>
//             </Container>

//             {/* Modal for Confirmation */}
//             <Modal isOpen={modal} toggle={() => setModal(!modal)} centered>
//                 <ModalHeader toggle={() => setModal(!modal)}>Confirmation</ModalHeader>
//                 <ModalBody>
//                     <div>
//                         <p>
//                             Your changes will be discarded. Are you sure you want to cancel?
//                         </p>
//                     </div>
//                 </ModalBody>
//                 <ModalFooter>
//                     <Button
//                         onClick={handleNavigation} color='warning'>
//                         Yes
//                     </Button>
//                     <Button color="primary" onClick={() => setModal(!modal)}>No</Button>
//                 </ModalFooter>
//             </Modal>
//         </Fragment>
//     );
// };

// export default ConfirmUserReport;



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

const ConfirmUserReport = () => {
    useAuth();
    const [data, setData] = useState([]);
    const [user, setUser] = useState({});
    const [fielddata, setFieldData] = useState([]);
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [modal, setModal] = useState(false);
    const [selectedFields, setSelectedFields] = useState([]);
    const [reportName, setReportName] = useState(''); // Default to an empty string or a default name
    const { permissions } = useContext(PermissionsContext);
    const [reportType, setReportType] = useState('*');
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




    useEffect(() => {
        fetchUser();
        fetchDropdown();
    }, [permissions]);

    // Extract Facultys component
    const BasicUserReportPermissions = permissions['EventUserReport'];

    const fetchUser = async () => {
        try {
            const token = getToken();
            const response = await axios.get(`${BackendAPI}/eventuser/getConfirmUserData`, {
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
        // Add more mappings here as needed
    };

    // const exhOptions = Object.keys(user)
    //     .filter(key => keyLabelMapping[key])
    //     .map(key => ({
    //         value: key,
    //         label: keyLabelMapping[key] || key // Use the mapped label or default to the key
    //     }));
    const exhOptions = [
        ...Object.keys(keyLabelMapping)  // Iterate over the keys
            .filter(key => keyLabelMapping[key])  // Filter out any keys that don't have a mapping
            .map(key => ({
                value: key,  // Use the key as the value
                label: keyLabelMapping[key],  // Use the mapping for the label
            })),
        { value: 'cs_status', label: 'Status' },
        { value: 'created_at', label: 'Created Date' } // Hardcoded option at the end
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

        const errors = form.getState().errors;
        if (Object.keys(errors).length === 0 && selectedFields.length > 0) {
            const startDate = form.getState().values.startDate;
            const endDate = form.getState().values.endDate;
            const selectedCategories = form.getState().values.cs_reg_cat_id;
            // const selectedTickets = form.getState().values.cs_ticket;
            // const selectedAddons = form.getState().values.cs_addons;

            // generateXLSX(selectedFields, startDate, endDate, selectedCategories, selectedTickets, selectedAddons);
            generateXLSX(selectedFields, startDate, endDate, selectedCategories);

        }
    };


    const generateXLSX = (fields, startDate, endDate, selectedCategories) => {
        if (!Array.isArray(data) || data.length === 0) {
            console.error('Data is not an array or is empty:', data);
            return;
        }

        // Filter data based on reportType
        const typeFilteredData = reportType === "*"
            ? data // Include all data when reportType is '*'
            : data.filter(item => {
                return reportType === "" || item.cs_isconfirm === parseInt(reportType);
            });


        // Apply filters for Category, Ticket, and Add-on
        const filteredData = typeFilteredData.filter(item => {
            const categoryMatch = !selectedCategories || selectedCategories.some(category => {
                const match = category === item.cs_reg_cat_id;
                return match;
            });


            return categoryMatch;

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
                if (field.label === 'Created Date') {
                    rowData.push(
                        moment(item.created_at)
                            .tz(AdminTimezone)
                            .format('YYYY-MM-DD HH:mm:ss')
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
                navigate(`${process.env.PUBLIC_URL}/event/confirm-user-report/Consoft`);
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
                            Customize and download a report of users by selecting the category, event days, date range of registration.
                        </PopoverBody>
                    </UncontrolledPopover>
                </>
            } parent="Registration Admin" title="Basic User Report" />
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
                                            <Row>
                                                {/* Report Type Radio Buttons */}
                                                <Col md="12" className="mb-3">
                                                    <div className="form-group">
                                                        <strong>Report Type</strong>
                                                        <div className="me-5 mt-3">
                                                            <input
                                                                type="radio"
                                                                name="priceType"
                                                                value="*"
                                                                onChange={handlePriceChange}
                                                                className="me-2"
                                                            />
                                                            <strong>All User Report</strong>
                                                            <input
                                                                type="radio"
                                                                name="priceType"
                                                                value="0"
                                                                onChange={handlePriceChange}
                                                                className="ms-3 me-2"
                                                            />
                                                            <strong>Basic User Report</strong>
                                                            <input
                                                                type="radio"
                                                                name="priceType"
                                                                value="1"
                                                                checked={reportType === '1'}
                                                                onChange={handlePriceChange}
                                                                className="ms-3 me-2"
                                                            />
                                                            <strong>Confirm User Report</strong>
                                                        </div>
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
                                                        {/* <Col md="12" className="mb-3">
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
                                                        </Col> */}
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
                                                                    min={startDate} // set min to startDate to prevent selecting an earlier date
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

export default ConfirmUserReport;