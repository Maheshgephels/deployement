// import React, { Fragment, useState, useEffect } from 'react';
// import { Container, Row, Col, Button, Card, CardBody, Modal, ModalHeader, ModalBody, ModalFooter, FormFeedback, Label,  PopoverBody, UncontrolledPopover } from 'reactstrap';
// import { Breadcrumbs } from '../../AbstractElements';
// import axios from 'axios';
// import { BackendAPI } from '../../api';
// import SweetAlert from 'sweetalert2';
// import { MdDelete, MdInfoOutline } from "react-icons/md";
// import { FaEye, FaEyeSlash } from 'react-icons/fa';
// import { IoIosArrowDown } from "react-icons/io";
// import { Field, Form } from 'react-final-form'; // Import Field and Form from react-final-form
// import { Link, useNavigate } from 'react-router-dom';
// import Select from 'react-select';
// import { required, email, Wname, password, expiryDate } from '../Utils/validationUtils';
// import { getToken } from '../../Auth/Auth';
// import useAuth from '../../Auth/protectedAuth';


// //Utility function used to combine multiple validation functions into a single validation function
// const composeValidators = (...validators) => value =>
//     validators.reduce((error, validator) => error || validator(value), undefined);

// const ScanReport = () => {
//     useAuth();
//     const [data, setData] = useState([]);
//     const navigate = useNavigate(); // Initialize useHistory
//     const [loading, setLoading] = useState(true);
//     const [modal, setModal] = useState(false);
//     const [regCat, setRegCat] = useState([]);
//     const [facility, setFacility] = useState([]);
//     const [workshop, setWorkshop] = useState([]);
//     const [dayType, setDayType] = useState([]);
//     const [field, setField] = useState([]);



//     useEffect(() => {
//         fetchDropdown(); // Corrected function name
//     }, []);

//     const fetchDropdown = async () => {
//         try {
//             const token = getToken(); 
//             const response = await axios.get(`${BackendAPI}/report/getDropdownData`, {
//                 headers: {
//                     Authorization: `Bearer ${token}` // Include the token in the Authorization header
//                 }
//             });
//             setData(response.data);
//             setLoading(false);

//             console.log("Data: ", response.data);

//             const fetchfacility = response.data.facilityType;
//             const fetchregcat = response.data.regCategory;
//             const fetchdaytype = response.data.dayType;
//             const fetchworkshop = response.data.workshop;
//             const fetchfield = response.data.fields;


//             setRegCat(fetchregcat);
//             setFacility(fetchfacility);
//             setWorkshop(fetchworkshop);
//             setDayType(fetchdaytype);
//             setField(fetchfield);




//         } catch (error) {
//             console.error('Error fetching dropdown data:', error);
//             setLoading(false);
//         }
//     };


//     const handleSelect = (event) => {
//         console.log(event.target.value);
//     }




//     const onSubmit = async (values) => {
//         // Add null or undefined checks before mapping
//         const selectedField = values.reportfield ? values.reportfield.map(option => option.value) : [];
//         const selectedCategory = values.category ? values.category.map(option => option.value) : [];
//         const selectedEventday = values.eventday ? values.eventday.map(option => option.value) : [];
//         const selectedFacility = values.facility ? values.facility.map(option => option.value) : [];
//         const selectedWorkshop = values.workshop ? values.workshop.map(option => option.value) : [];

//         const formData = {
//             ...values,
//             reportfield: selectedField,
//             category: selectedCategory,
//             eventday: selectedEventday,
//             facility: selectedFacility,
//             workshop: selectedWorkshop,
//             startDate: values.startDate, // Add startDate to formData
//             endDate: values.endDate      // Add endDate to formData
//         };

//         try {
//             console.log('Form data to send:', formData);
//             const token = getToken(); 
//             const response = await axios.post(`${BackendAPI}/report/createReport`, formData,{
//                 headers: {
//                                 Authorization: `Bearer ${token}` // Include the token in the Authorization header
//                             }
//                         },{ responseType: 'blob' });

//             // Create a URL for the downloaded file
//             const url = window.URL.createObjectURL(new Blob([response.data]));

//             // Create a link element and trigger the download
//             const link = document.createElement('a');
//             link.href = url;
//             link.setAttribute('download', `${values.Reportname}.xlsx`);
//             document.body.appendChild(link);
//             link.click();

//             // Cleanup
//             window.URL.revokeObjectURL(url);

//             SweetAlert.fire({
//                 title: 'Success!',
//                 text: 'Workshop created successfully!',
//                 icon: 'success',
//                 timer: 3000,
//                 showConfirmButton: false,
//                 allowOutsideClick: false,
//                 allowEscapeKey: false 
//             }).then((result) => {
//                 if (result.dismiss === SweetAlert.DismissReason.timer) {
//                     navigate(`${process.env.PUBLIC_URL}/Scan-reports/Consoft`);
//                 }
//             });
//         } catch (error) {
//             console.error('Error creating application login:', error.message);
//         }
//     };


//     const handleCancel = () => {
//         setModal(true);
//     };

//     const handleNavigation = () => {
//         navigate(`${process.env.PUBLIC_URL}/dashboard/default/Consoft`);
//     };


//     return (
//         <Fragment>
//             <Breadcrumbs mainTitle={
//                 <>
//                     Scan Report
//                     <MdInfoOutline
//                         id="reportPopover"
//                         style={{
//                             cursor: 'pointer', position: 'absolute', marginLeft: '5px'
//                         }}
//                     />
//                     <UncontrolledPopover
//                         placement="bottom"
//                         target="reportPopover"
//                         trigger="focus"
//                     >
//                         <PopoverBody>
//                         Customized and download a report for scanned facilities in the Onsite App, 
//                         filtered by facility or by event days.
//                         </PopoverBody>
//                     </UncontrolledPopover>
//                 </>
//             } parent="Onsite App" title="Scan Report" />
//             <Container fluid={true}>
//                 <Row>
//                     <Col sm="12">
//                         <Card>
//                             <CardBody>
//                                 <Form onSubmit={onSubmit}>
//                                     {({ handleSubmit }) => (
//                                         <form className='needs-validation' noValidate='' onSubmit={handleSubmit}>
//                                             <Row>
//                                                 <Col md="4" className="mb-3">
//                                                     <Field
//                                                         name="Reportname"
//                                                         validate={composeValidators(required)}
//                                                     >
//                                                         {({ input, meta }) => (
//                                                             <div>
//                                                                 <Label className='form-label' for="Reportname"><strong>Report Name <span className="red-asterisk">*</span></strong></Label>
//                                                                 <input
//                                                                     {...input}
//                                                                     className="form-control"
//                                                                     id="Reportname"
//                                                                     placeholder='Enter Report name'
//                                                                     type="text"
//                                                                 />
//                                                                 {meta.error && meta.touched && <p className='d-block text-danger'>{meta.error}</p>}
//                                                             </div>
//                                                         )}
//                                                     </Field>
//                                                 </Col>
//                                             </Row>

//                                             {/* <Row>
//                                                 <Col md="4" className="mb-3">
//                                                     <Field
//                                                         name={`category`} // Use dynamic field name
//                                                     >
//                                                         {({ input }) => (
//                                                             <div>
//                                                                 <Label className='form-label' for="category"><strong>Category</strong></Label>
//                                                                 <Select
//                                                                     {...input}
//                                                                     options={[
//                                                                         { value: 'all', label: 'Select All' },
//                                                                         ...regCat.map(pref => ({ value: pref.cs_reg_cat_id, label: pref.cs_reg_category }))
//                                                                     ]}
//                                                                     // options={regCat.map(pref => ({ value: pref.cs_reg_cat_id, label: pref.cs_reg_category }))}
//                                                                     placeholder={`Select Category`}
//                                                                     isSearchable={true}
//                                                                     onChange={(value) => {
//                                                                         if (value && value.length > 0 && value[0].value === 'all') {
//                                                                             const allCatNames = regCat.map(pref => pref.cs_reg_cat_id);
//                                                                             input.onChange([{ value: allCatNames, label: 'Select All' }]);
//                                                                         } else {
//                                                                             input.onChange(value);
//                                                                         }
//                                                                     }}
//                                                                     // onChange={(value) => input.onChange(value)}
//                                                                     onBlur={input.onBlur}
//                                                                     classNamePrefix="react-select"
//                                                                     isMulti={true}
//                                                                     value={input.value}
//                                                                 />

//                                                             </div>
//                                                         )}
//                                                     </Field>
//                                                 </Col>
//                                             </Row> */}

//                                             <Row>
//                                                 <Col md="4" className="mb-3">
//                                                     <Field
//                                                         name={`facility`} // Use dynamic field name
//                                                     >
//                                                         {({ input }) => (
//                                                             <div>
//                                                                 <Label className='form-label' for="facility"><strong>Facility</strong></Label>
//                                                                 <Select
//                                                                     {...input}
//                                                                     options={[
//                                                                         { value: 'all', label: 'Select All' },
//                                                                         ...facility.map(pref => ({ value: pref.cs_name, label: pref.cs_display_name }))
//                                                                     ]}

//                                                                     // options={facility.map(pref => ({ value: pref.cs_name, label: pref.cs_display_name }))}
//                                                                     placeholder={`Select facility`}
//                                                                     isSearchable={true}
//                                                                     onChange={(value) => {
//                                                                         if (value && value.length > 0 && value[0].value === 'all') {
//                                                                             const allfacilities = facility.map(pref => pref.cs_name);
//                                                                             input.onChange([{ value: allfacilities, label: 'Select All' }]);
//                                                                         } else {
//                                                                             input.onChange(value);
//                                                                         }
//                                                                     }}
//                                                                     // onChange={(value) => input.onChange(value)}
//                                                                     onBlur={input.onBlur}
//                                                                     classNamePrefix="react-select"
//                                                                     isMulti={true}
//                                                                     value={input.value}
//                                                                 />
//                                                             </div>
//                                                         )}
//                                                     </Field>
//                                                 </Col>
//                                             </Row>

//                                             {/* <Row>
//                                                 <Col md="4" className="mb-3">
//                                                     <Field
//                                                         name={`workshop`} // Use dynamic field name
//                                                     >
//                                                         {({ input }) => (
//                                                             <div>
//                                                                 <Label className='form-label' for="workshop"><strong>Workshop</strong></Label>
//                                                                 <Select
//                                                                     {...input}
//                                                                     options={[
//                                                                         { value: 'all', label: 'Select All' },
//                                                                         ...workshop.map(pref => ({ value: pref.cs_workshop_id, label: pref.cs_workshop_name }))
//                                                                     ]}
//                                                                     // options={workshop.map(pref => ({ value: pref.cs_workshop_id, label: pref.cs_workshop_name }))}
//                                                                     placeholder={`Select Workshop`}
//                                                                     isSearchable={true}
//                                                                     onChange={(value) => {
//                                                                         if (value && value.length > 0 && value[0].value === 'all') {
//                                                                             const allWorkshops = facility.map(pref => pref.cs_workshop_id);
//                                                                             input.onChange([{ value: allWorkshops, label: 'Select All' }]);
//                                                                         } else {
//                                                                             input.onChange(value);
//                                                                         }
//                                                                     }}
//                                                                     // onChange={(value) => input.onChange(value)}
//                                                                     onBlur={input.onBlur}
//                                                                     classNamePrefix="react-select"
//                                                                     isMulti={true}
//                                                                     value={input.value}
//                                                                 />
//                                                             </div>
//                                                         )}
//                                                     </Field>
//                                                 </Col>
//                                             </Row> */}

//                                             <Row>
//                                                 <Col md="4" className="mb-3">
//                                                     <Field
//                                                         name={`eventday`} // Use dynamic field name
//                                                         validate={composeValidators(required)}
//                                                     >
//                                                         {({ input, meta }) => (
//                                                             <div>
//                                                                 <Label className='form-label' for="eventday"><strong>Event Day</strong></Label>
//                                                                 <Select
//                                                                     {...input}
//                                                                     options={[
//                                                                         { value: 'all', label: 'Select All' },
//                                                                         ...dayType.map(pref => ({ value: pref.cs_reg_daytype_id, label: pref.cs_reg_daytype_name }))
//                                                                     ]}

//                                                                     placeholder={`Select Event Day`}
//                                                                     isSearchable={true}
//                                                                     // onChange={(value) => input.onChange(value)}
//                                                                     onChange={(value) => {
//                                                                         if (value && value.length > 0 && value[0].value === 'all') {
//                                                                             const allDays = dayType.map(pref => pref.cs_reg_daytype_id);
//                                                                             input.onChange([{ value: allDays, label: 'Select All' }]);
//                                                                         } else {
//                                                                             input.onChange(value);
//                                                                         }
//                                                                     }}
//                                                                     onBlur={input.onBlur}
//                                                                     classNamePrefix="react-select"
//                                                                     isMulti={true}
//                                                                     value={input.value}
//                                                                 />
//                                                                 {meta.error && meta.touched && <p className='d-block text-danger'>{meta.error}</p>}

//                                                             </div>
//                                                         )}
//                                                     </Field>

//                                                 </Col>
//                                             </Row>

//                                             {/* <Row>
//                                                 <Col md="4" className="mb-3">
//                                                     <Field
//                                                         name={`reportfield`}
//                                                     >
//                                                         {({ input }) => (
//                                                             <div>
//                                                                 <Label className='form-label' for="reportfield"><strong>Report Fields</strong></Label>
//                                                                 <Select
//                                                                     {...input}
//                                                                     options={[
//                                                                         { value: 'all', label: 'Select All' },
//                                                                         ...field.map(pref => ({ value: pref.cs_field_name, label: pref.cs_field_label }))
//                                                                     ]}
//                                                                     placeholder={`Select Report Field`}
//                                                                     isSearchable={true}
//                                                                     onChange={(value) => {
//                                                                         if (value && value.length > 0 && value[0].value === 'all') {
//                                                                             const allFieldNames = field.map(pref => pref.cs_field_name);
//                                                                             input.onChange([{ value: allFieldNames, label: 'Select All' }]);
//                                                                         } else {
//                                                                             input.onChange(value);
//                                                                         }
//                                                                     }}
//                                                                     onBlur={input.onBlur}
//                                                                     classNamePrefix="react-select"
//                                                                     isMulti={true}
//                                                                     value={input.value}
//                                                                 />
//                                                             </div>
//                                                         )}
//                                                     </Field>
//                                                 </Col>
//                                             </Row> */}

// <Row>
//                                                 <Col md="2" className="mb-3">
//                                                     <Field name="startDate">
//                                                         {({ input }) => (
//                                                             <div>
//                                                                 <Label className='form-label' for="startDate"><strong>From Date</strong></Label>
//                                                                 <input
//                                                                     {...input}
//                                                                      className="form-control"
//                                                                     id="start_date"
//                                                                     type="date"
//                                                                     placeholder="Enter Start Date"
//                                                                     // min={minDate}
//                                                                     max="9999-12-31"
//                                                                 />
//                                                             </div>
//                                                         )}
//                                                     </Field>
//                                                 </Col>

//                                                 <Col md="2" className="mb-3">
//                                                     <Field name="endDate">
//                                                         {({ input }) => (
//                                                             <div>
//                                                                 <Label className='form-label' for="endDate"><strong>To Date</strong></Label>
//                                                                 <input
//                                                                     {...input}
//                                                                      className="form-control"
//                                                                     id="end_date"
//                                                                     type="date"
//                                                                     placeholder="Enter End Date"
//                                                                     // min={minDate}
//                                                                     max="9999-12-31"
//                                                                 />
//                                                             </div>
//                                                         )}

//                                                     </Field>
//                                                 </Col>
//                                             </Row>







//                                             <div>
//                                                 <Button color='primary' type='submit' className="me-2 mt-3">Download Report</Button>
//                                                 <Button color='warning' onClick={handleCancel} className="mt-3">Cancel</Button>
//                                             </div>




//                                         </form>
//                                     )}
//                                 </Form>
//                             </CardBody>
//                         </Card>
//                     </Col>
//                 </Row>
//             </Container>
//             {/* Modal */}
//             <Modal isOpen={modal} toggle={() => setModal(!modal)} centered>
//                 <ModalHeader toggle={() => setModal(!modal)}>Confirmation</ModalHeader>
//                 <ModalBody>
//                     <div>
//                         <p>
//                         Your changes will be discarded. Are you sure you want to cancel?
//                         </p>
//                     </div>
//                 </ModalBody>
//                 <ModalFooter>
//                 <Button
//                         onClick={handleNavigation} color='warning'>
//                         Yes

//                     </Button>
//                     {/* <Link to="/Workshop/Consoft" className="btn btn-warning">Yes</Link> */}
//                     <Button color="primary" onClick={() => setModal(!modal)}>No</Button>
//                 </ModalFooter>
//             </Modal>
//         </Fragment>
//     );
// };

// export default ScanReport;



import React, { Fragment, useState, useEffect } from 'react';
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
import * as XLSX from 'xlsx';
import moment from 'moment';


const RedAsterisk = styled.span`
  color: red;
`;

// Utility function used to combine multiple validation functions into a single validation function
const composeValidators = (...validators) => value =>
    validators.reduce((error, validator) => error || validator(value), undefined);

const ScanReport = () => {
    useAuth();
    const [data, setData] = useState([]);
    const [dropdata, setDropdata] = useState([]);
    const [user, setUser] = useState({});
    const [facility, setFacility] = useState([]);
    const [daytype, setDaytype] = useState([]);
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [modal, setModal] = useState(false);
    const [selectedFields, setSelectedFields] = useState([]);
    const [selectedFacility, setSelectefacility] = useState([]);
    const [selecteddaytype, setSelectedaytype] = useState([]);
    const [reportName, setReportName] = useState(''); // Default to an empty string or a default name

    console.log("Record", data);
    console.log("Facility", facility);
    console.log("Day type", daytype);


    console.log("Selected Day", selecteddaytype);



    useEffect(() => {
        fetchUser();
    }, []);

    const fetchUser = async () => {
        try {
            const token = getToken();
            const response = await axios.get(`${BackendAPI}/report/getScanData`, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            setData(response.data.userData || []); // Ensure data is an array
            setUser(response.data.userData[0] || {});
            setFacility(response.data.facilityData || []);
            setDaytype(response.data.dayData || []);

            setLoading(false);
        } catch (error) {
            console.error('Error fetching exhibitor data:', error);
            setLoading(false);
        }
    };


    const handleCancel = () => {
        setModal(true);
    };

    const handleNavigation = () => {
        navigate(`${process.env.PUBLIC_URL}/onsite/dashboard/Consoft`);
    };

    const facilityOptions = facility.map(facility => ({
        value: `cs_${facility.cs_name}`,  // Concatenate 'cs_' to the value
        label: facility.cs_display_name,
        daywise: facility.cs_daywise
    }));



    const handleFacilitySelect = (selectedFacility) => {

        if (selectedFacility.some(option => option.value === 'select_all')) {
            // Select all options
            setSelectefacility(facilityOptions); // Set all options as selected
        } else {
            setSelectefacility(selectedFacility);
        }
    };

    const dayTypeOptions = daytype
        .filter(daytype => daytype.cs_reg_daytype_id !== 101) // Filter out the item with value 101
        .map(daytype => ({
            value: daytype.cs_reg_daytype_id,
            label: daytype.cs_reg_daytype_name,
        }));

    console.log("Option", dayTypeOptions);



    const handleDaySelect = (selectedDay) => {
        console.log("DATE", selectedDay);

        setSelectedaytype(selectedDay);

        const Facility = selectedFacility;

        console.log("FAC", Facility);

        // Extract the value from selectedDay
        const dayValue = selectedDay.value;

        // Update FAC based on daywise property
        const updatedFAC = Facility.map(item => {
            if (item.daywise === 'Yes') {
                // Concatenate dayValue to the value of items where daywise is 'Yes'
                return {
                    ...item,
                    value: `${item.value}${dayValue}`
                };
            }
            // Pass items with daywise 'No' as is
            return item;
        });

        setSelectefacility(updatedFAC);


        // Optionally, you can set the updatedFAC to some state or use it as needed
        console.log("Updated FAC", updatedFAC);
    };




    const keyLabelMapping = {
        cs_regno: 'Registration Number',
        cs_first_name: 'First Name',
        cs_last_name: 'Last Name',
        cs_reg_category: 'Registration Category',
        cs_date: 'Date & Time',
        // cs_time: 'Time',
        cs_deviceid: 'Device ID'
        // Add more mappings here as needed
    };

    const exhOptions = Object.keys(user)
        .filter(key => keyLabelMapping[key])
        .map(key => ({
            value: key,
            label: keyLabelMapping[key] || key // Use the mapped label or default to the key
        }));


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
        if (Object.keys(errors).length === 0) {
            const fieldsToExport = selectedFields.length > 0 ? selectedFields : exhOptions;
            const startDate = form.getState().values.startDate;
            const endDate = form.getState().values.endDate;

            generateXLSX(fieldsToExport, startDate, endDate);

            // form.reset(); // Optionally reset the form fields
        }
    };



    // const generateCSV = (fields) => {
    //     if (!Array.isArray(data) || data.length === 0) {
    //         console.error('Data is not an array or is empty:', data);
    //         return;
    //     }

    //     // Filter data by selected facility (matching cs_type with the selected facility value)
    //     const selectedFacilityValue = selectedFacility.map(fac => fac.value); // Array of selected facility values
    //     const filteredData = data.filter(item =>
    //         selectedFacilityValue.some(facility => item.cs_type.startsWith(facility))
    //     );

    //     if (filteredData.length === 0) {
    //         Swal.fire({
    //             title: 'No Data Found!',
    //             text: 'No records match the selected facility.',
    //             icon: 'warning',
    //             timer: 3000,
    //             showConfirmButton: false
    //         });
    //         return;
    //     }

    //     // Create headers from selected fields and add "Sr. No."
    //     const headers = ['Sr. No.', ...fields.map(field => field.label)];
    //     console.log('Headers:', headers);

    //     // Map filtered data to rows and include serial number
    //     const rows = filteredData.map((item, index) => {
    //         return [
    //             index + 1, // Sr. No., starts from 1
    //             ...fields.map(field => item[field.value] || '')
    //         ];
    //     });
    //     console.log('Rows:', rows);

    //     // Create CSV content
    //     let csvContent = 'data:text/csv;charset=utf-8,';
    //     csvContent += headers.join(',') + '\n';
    //     rows.forEach(row => {
    //         csvContent += row.join(',') + '\n';
    //     });

    //     // Create download link
    //     const encodedUri = encodeURI(csvContent);
    //     const link = document.createElement('a');
    //     link.setAttribute('href', encodedUri);
    //     link.setAttribute('download', `${reportName || 'report'}.csv`); // Default name if reportName is empty
    //     document.body.appendChild(link);
    //     link.click();
    //     document.body.removeChild(link); // Clean up after download

    //     // Cleanup URL object
    //     window.URL.revokeObjectURL(encodedUri);

    //     // Show success alert
    //     Swal.fire({
    //         title: 'Success!',
    //         text: 'Report generated successfully!',
    //         icon: 'success',
    //         timer: 3000,
    //         showConfirmButton: false,
    //         allowOutsideClick: false,
    //         allowEscapeKey: false
    //     }).then((result) => {
    //         if (result.dismiss === Swal.DismissReason.timer) {
    //             navigate(`${process.env.PUBLIC_URL}/basic-user-report/Consoft`);
    //         }
    //     });
    // };

    const generateXLSX = (fields, startDate, endDate) => {
        if (!Array.isArray(data) || data.length === 0) {
            console.error('Data is not an array or is empty:', data);
            return;
        }

        // Filter data by selected facility
        const selectedFacilityValue = selectedFacility.map(fac => fac.value);
        const filteredData = data.filter(item =>
            selectedFacilityValue.some(facility => item.cs_type.startsWith(facility))
        );

        // Parse the start and end dates properly
        const start = startDate ? moment(startDate).startOf('day') : null;
        const end = endDate ? moment(endDate).endOf('day') : null;

        // Filter data by date range using moment
        const dateFilteredData = filteredData.filter(item => {
            const itemDate = moment(item.cs_date, 'DD-MM-YYYY'); // Parse cs_date with the correct format
            return (!start || itemDate.isSameOrAfter(start)) && (!end || itemDate.isSameOrBefore(end));
        });

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

        const AdminTimezone = localStorage.getItem('AdminTimezone');

        // Create headers from selected fields and add "Sr. No."
        const headers = ['Sr. No.', ...fields.map(field => field.label)];
        console.log('Headers:', headers);

        // Map filtered data to rows and include serial number
        const rows = dateFilteredData.map((item, index) => {
            const rowData = {
                'Sr. No.': index + 1,
            };

            fields.forEach(field => {
                if (field.label === 'Date & Time') {
                    const dateTimeString = `${item.cs_date} ${item.cs_time}`.trim(); // Combine date and time, ensure no extra spaces
                    const itemDate = moment(dateTimeString, 'YYYY-MM-DD HH:mm:ss'); // Parse date with correct format
                    if (itemDate.isValid()) { // Check if the date is valid
                        rowData[field.label] = itemDate.tz(AdminTimezone).format('YYYY-MM-DD HH:mm:ss'); // Format with timezone
                    } else {
                        console.warn(`Invalid date for item: ${JSON.stringify(item)}`); // Log invalid date issue
                        rowData[field.label] = ''; // Assign an empty string if invalid
                    }
                } else {
                    rowData[field.label] = item[field.value] || ''; // Handle missing fields
                }
            });


            return rowData;
        });
        console.log('Rows:', rows);

        // Create a new workbook and worksheet
        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.json_to_sheet(rows, { header: headers });

        // Add worksheet to workbook
        XLSX.utils.book_append_sheet(wb, ws, 'Report');

        // Generate XLSX file
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
                navigate(`${process.env.PUBLIC_URL}/onsite/scan-report/Consoft`);
            }
        });
    };




    return (
        <Fragment>
            <Breadcrumbs mainTitle={
                <>
                    Scan Report
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
                            Customized and download a report for scanned facilities in the Onsite App,
                            filtered by facility or by event days.
                        </PopoverBody>
                    </UncontrolledPopover>
                </>
            } parent="Onsite App" title="Scan Report" />
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
                                            <Col md="12" className="mb-3">
                                                    <Label className='form-label' htmlFor="facility"><strong>Select Facility <span className="red-asterisk">*</span></strong></Label>
                                                    <Field name="facility"
                                                        validate={option}>
                                                        {({ input, meta }) => (
                                                            <div>
                                                                <Select
                                                                    {...input}
                                                                    options={[selectAllOption, ...facilityOptions]}
                                                                    placeholder="Select Facility"
                                                                    isMulti={true}
                                                                    onChange={(selectedFacility) => {
                                                                        input.onChange(selectedFacility); // Update form state
                                                                        handleFacilitySelect(selectedFacility);
                                                                    }}
                                                                    classNamePrefix="react-select"
                                                                    value={input.value} // Ensure the Select value is controlled
                                                                />
                                                                {meta.error && meta.touched && <p className='d-block text-danger'>{meta.error}</p>}
                                                            </div>
                                                        )}
                                                    </Field>
                                                </Col>
                                            </Row>
                                            <Row>
                                            <Col md="12" className="mb-3">
                                                    <Label className='form-label' htmlFor="day"><strong>Select Event Day</strong></Label>
                                                    <Field name="day"
                                                    >
                                                        {({ input, meta }) => (
                                                            <div>
                                                                <Select
                                                                    {...input}
                                                                    options={[...dayTypeOptions]}
                                                                    placeholder="Select Event day"
                                                                    isMulti={false}
                                                                    onChange={(selectedDay) => {
                                                                        input.onChange(selectedDay); // Update form state
                                                                        handleDaySelect(selectedDay);
                                                                    }}
                                                                    classNamePrefix="react-select"
                                                                    value={input.value} // Ensure the Select value is controlled
                                                                />
                                                                {/* {meta.error && meta.touched && <p className='d-block text-danger'>{meta.error}</p>} */}
                                                            </div>
                                                        )}
                                                    </Field>
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
                                                                    // min={minDate}
                                                                    max="9999-12-31"
                                                                />
                                                            </div>
                                                        )}

                                                    </Field>
                                                </Col>
                                            </Row>
                                            <Row>
                                            <Col md="12" className="mb-3">
                                                    <Label className='form-label' htmlFor="fields"><strong>Select Field</strong></Label>
                                                    <Field name="fields"
                                                    >
                                                        {({ input, meta }) => (
                                                            <div>
                                                                <Select
                                                                    {...input}
                                                                    options={[selectAllOption, ...exhOptions]}
                                                                    placeholder="Select Fields"
                                                                    isMulti={true}
                                                                    isClearable={false}
                                                                    onChange={(selectedOptions) => {
                                                                        input.onChange(selectedOptions); // Update form state
                                                                        handleSelectChange(selectedOptions);
                                                                    }}
                                                                    classNamePrefix="react-select"
                                                                    value={input.value} // Ensure the Select value is controlled
                                                                />
                                                                {/* {meta.error && meta.touched && <p className='d-block text-danger'>{meta.error}</p>} */}
                                                            </div>
                                                        )}
                                                    </Field>
                                                </Col>
                                            </Row>
                                            {/* <Row>
                                                <Col md="4" className="mb-3">
                                                    <Label className='form-label' htmlFor="fields"><strong>Select Field <span className="red-asterisk">*</span></strong></Label>
                                                    <Field name="fields"
                                                        validate={option}>
                                                        {({ input, meta }) => (
                                                            <div>
                                                                <Select
                                                                    {...input}
                                                                    options={[selectAllOption, ...exhOptions]}
                                                                    placeholder="Select Fields"
                                                                    isMulti={true}
                                                                    onChange={(selectedOptions) => {
                                                                        input.onChange(selectedOptions); // Update form state
                                                                        handleSelectChange(selectedOptions);
                                                                    }}
                                                                    classNamePrefix="react-select"
                                                                    value={input.value} // Ensure the Select value is controlled
                                                                />
                                                                {meta.error && meta.touched && <p className='d-block text-danger'>{meta.error}</p>}
                                                            </div>
                                                        )}
                                                    </Field>
                                                </Col>
                                            </Row> */}
                                            <div>
                                                <Button color='primary' onClick={() => handleReportDownload(form)} className="me-2 mt-3">Generate Report</Button>
                                                <Button color='warning' onClick={handleCancel} className="mt-3">Cancel</Button>
                                            </div>
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

export default ScanReport;
