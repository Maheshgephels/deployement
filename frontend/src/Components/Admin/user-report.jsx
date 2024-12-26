import React, { Fragment, useState, useEffect, useContext } from 'react';
import { Container, Row, Col, Button, Card, CardBody, Modal, ModalHeader, ModalBody, ModalFooter, FormFeedback, Label, PopoverBody, UncontrolledPopover } from 'reactstrap';
import { Breadcrumbs } from '../../AbstractElements';
import axios from 'axios';
import { BackendAPI } from '../../api';
import SweetAlert from 'sweetalert2';
import { MdDelete, MdInfoOutline } from "react-icons/md";
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import { IoIosArrowDown } from "react-icons/io";
import { Field, Form } from 'react-final-form'; // Import Field and Form from react-final-form
import { Link, useNavigate } from 'react-router-dom';
import Select from 'react-select';
import { required, email, Wname, password, expiryDate } from '../Utils/validationUtils';
import { PermissionsContext } from '../../contexts/PermissionsContext';
import { getToken } from '../../Auth/Auth';
import useAuth from '../../Auth/protectedAuth';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { parseISO, format } from 'date-fns';
import { toast } from 'react-toastify';



//Utility function used to combine multiple validation functions into a single validation function
const composeValidators = (...validators) => value =>
    validators.reduce((error, validator) => error || validator(value), undefined);

const UserReport = () => {
    useAuth();
    const [data, setData] = useState([]);
    const navigate = useNavigate(); // Initialize useHistory
    const [loading, setLoading] = useState(true);
    const [modal, setModal] = useState(false);
    const [regCat, setRegCat] = useState([]);
    const [facility, setFacility] = useState([]);
    const [workshop, setWorkshop] = useState([]);
    const [dayType, setDayType] = useState([]);
    const [field, setField] = useState([]);
    const { permissions } = useContext(PermissionsContext);
    const [userOptions, setUserOptions] = useState({ fromStart: [], fromEnd: [] });



    useEffect(() => {
        fetchDropdown(); // Corrected function name
        fetchUserRecords();
    }, [permissions]);

    // Extract User Report Permissions component
    const UserReportPermissions = permissions['UserReport'];

    const fetchDropdown = async () => {
        try {
            const token = getToken();
            const response = await axios.get(`${BackendAPI}/report/getDropdownData`, {
                headers: {
                    Authorization: `Bearer ${token}` // Include the token in the Authorization header
                }
            });
            setData(response.data);
            setLoading(false);

            console.log("Data: ", response.data);

            const fetchfacility = response.data.facilityType;
            const fetchregcat = response.data.regCategory;
            const fetchdaytype = response.data.UserdayType;
            const fetchworkshop = response.data.workshop;
            const fetchfield = response.data.fields;


            setRegCat(fetchregcat);
            setFacility(fetchfacility);
            setWorkshop(fetchworkshop);
            setDayType(fetchdaytype);
            setField(fetchfield);




        } catch (error) {
            console.error('Error fetching dropdown data:', error);
            setLoading(false);
        }
    };


    const handleSelect = (event) => {
        console.log(event.target.value);
    }

    const fetchUserRecords = async () => {
        try {
            const token = getToken();
            const response = await axios.get(`${BackendAPI}/export/userlistforbadge`, {
                headers: {
                    Authorization: `Bearer ${token}` // Include the token in the Authorization header
                }
            });
            const users = response.data[0]; // Assuming the API returns an array of user objects
            console.log(' user records:', users);

            // Map user records to options, reversing the order for the second dropdown
            const optionsFromStart = users.map(user => ({
                value: user.cs_regno,
                label: `${user.cs_regno} - ${user.cs_first_name} ${user.cs_last_name}`
            }));

            const optionsFromEnd = [...optionsFromStart].reverse();

            // Prepend default text values to the dropdown options
            optionsFromStart.unshift({ value: 'from_start', label: 'From Start' });
            optionsFromEnd.unshift({ value: 'to_end', label: 'To End' });

            setUserOptions({
                fromStart: optionsFromStart,
                fromEnd: optionsFromEnd
            });
        } catch (error) {
            console.error('Error fetching user records:', error);
            toast.error('Failed to fetch user records. Please try again later.');
        }
    };




    const onSubmit = async (values) => {
        // Add null or undefined checks before mapping
        const selectedField = values.reportfield ? values.reportfield.map(option => option.value) : field.map(pref => pref.cs_field_name);
        const selectedCategory = values.category ? values.category.map(option => option.value) : regCat.map(pref => pref.cs_reg_cat_id);
        const selectedEventday = values.eventday ? values.eventday.map(option => option.value) : [];
        const selectedFacility = values.facility ? values.facility.map(option => option.value) : [];
        const selectedWorkshop = values.workshop ? values.workshop.map(option => option.value) : [];
        const startReg = values.startReg ? values.startReg.value : null;
        const endReg = values.endReg ? values.endReg.value : null;

        const formData = {
            ...values,
            reportfield: selectedField,
            category: selectedCategory,
            eventday: selectedEventday,
            facility: selectedFacility,
            workshop: selectedWorkshop,
            startDate: values.startDate, // Add startDate to formData
            endDate: values.endDate,      // Add endDate to formData
            startReg: startReg, // Add startReg to formData
            endReg: endReg      // Add endReg to formData
        };

        try {
            console.log('Form data to send:', formData);
            const token = getToken();
            // const response = await axios.post(`${BackendAPI}/report/createUserReport`, formData, { responseType: 'blob' },{
            //     headers: {
            //         Authorization: `Bearer ${token}` // Include the token in the Authorization header
            //     }
            // });
            const response = await axios.post(
                `${BackendAPI}/report/createUserReport`,
                formData,
                {
                    headers: {
                        Authorization: `Bearer ${token}` // Include the token in the Authorization header
                    },
                    responseType: 'blob' // Include the responseType in the same configuration object
                }
            );

            // Create a URL for the downloaded file
            const url = window.URL.createObjectURL(new Blob([response.data]));

            // Create a link element and trigger the download
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `${values.Reportname}.xlsx`);
            document.body.appendChild(link);
            link.click();

            // Cleanup
            window.URL.revokeObjectURL(url);

            SweetAlert.fire({
                title: 'Success!',
                text: 'User report downloaded successfully!',
                icon: 'success',
                timer: 3000,
                showConfirmButton: false,
                allowOutsideClick: false,
                allowEscapeKey: false
            }).then((result) => {
                if (result.dismiss === SweetAlert.DismissReason.timer) {
                    navigate(`${process.env.PUBLIC_URL}/onsite/user-report/Consoft`);
                }
            });
        } catch (error) {
            console.error('Error creating application login:', error.message);
        }
    };


    const handleCancel = () => {
        setModal(true);
    };

    const handleNavigation = () => {
        navigate(`${process.env.PUBLIC_URL}/onsite/dashboard/Consoft`);
    };


    return (
        <Fragment>
            <Breadcrumbs mainTitle={
                <>
                    User Report
                    <MdInfoOutline
                        id="reportPopover"
                        style={{
                            cursor: 'pointer', position: 'absolute', marginLeft: '5px'
                        }}
                    />
                    <UncontrolledPopover
                        placement="bottom"
                        target="reportPopover"
                        trigger="focus"
                    >
                        <PopoverBody>
                            Customize and download a report of users by selecting the category, event days,
                            date range of registration, or range of registration numbers.
                        </PopoverBody>
                    </UncontrolledPopover>
                </>
            } parent="Onsite App" title="User Report" />
            <Container fluid={true}>
                <Row className='justify-content-center'>
                    <Col sm="8">
                        <Card>
                            <CardBody>
                                <Form onSubmit={onSubmit}>
                                    {({ handleSubmit }) => (
                                        <form className='needs-validation' noValidate='' onSubmit={handleSubmit}>
                                            <Row>
                                                <Col md="12" className="mb-3">
                                                    <Field
                                                        name="Reportname"
                                                        validate={composeValidators(required)}
                                                    >
                                                        {({ input, meta }) => (
                                                            <div>
                                                                <Label className='form-label' for="Reportname"><strong>Report Name <span className="red-asterisk">*</span></strong></Label>
                                                                <input
                                                                    {...input}
                                                                    className="form-control"
                                                                    id="Reportname"
                                                                    placeholder='Enter Report name'
                                                                    type="text"
                                                                    readOnly={UserReportPermissions?.validate === 0}
                                                                />
                                                                {meta.error && meta.touched && <p className='d-block text-danger'>{meta.error}</p>}
                                                            </div>
                                                        )}
                                                    </Field>
                                                </Col>
                                            </Row>

                                            <Row>
                                                <Col md="12" className="mb-3">
                                                    <Field
                                                        name={`category`} // Use dynamic field name
                                                    >
                                                        {({ input }) => (
                                                            <div>
                                                                <Label className='form-label' for="category"><strong>Category</strong></Label>
                                                                <Select
                                                                    {...input}
                                                                    options={[
                                                                        { value: 'all', label: 'Select All' },
                                                                        ...regCat.map(pref => ({ value: pref.cs_reg_cat_id, label: pref.cs_reg_category }))
                                                                    ]}
                                                                    // options={regCat.map(pref => ({ value: pref.cs_reg_cat_id, label: pref.cs_reg_category }))}
                                                                    placeholder={`Select Category`}
                                                                    isSearchable={true}
                                                                    onChange={(value) => {
                                                                        if (value && value.length > 0 && value[0].value === 'all') {
                                                                            const allCatNames = regCat.map(pref => pref.cs_reg_cat_id);
                                                                            input.onChange([{ value: allCatNames, label: 'Select All' }]);
                                                                        } else {
                                                                            input.onChange(value);
                                                                        }
                                                                    }}
                                                                    // onChange={(value) => input.onChange(value)}
                                                                    onBlur={input.onBlur}
                                                                    classNamePrefix="react-select"
                                                                    isMulti={true}
                                                                    value={input.value}
                                                                />

                                                            </div>
                                                        )}
                                                    </Field>
                                                </Col>
                                            </Row>

                                            <Row>
                                                <Col md="12" className="mb-3">
                                                    <Field
                                                        name={`eventday`} // Use dynamic field name
                                                    >
                                                        {({ input }) => (
                                                            <div>
                                                                <Label className='form-label' for="eventday"><strong>Event Day</strong></Label>
                                                                <Select
                                                                    {...input}
                                                                    options={[
                                                                        { value: 'all', label: 'Select All' },
                                                                        ...dayType.map(pref => ({ value: pref.cs_reg_daytype_id, label: pref.cs_reg_daytype_name }))
                                                                    ]}
                                                                    placeholder={`Select Event Day`}
                                                                    isSearchable={true}
                                                                    // onChange={(value) => input.onChange(value)}
                                                                    onChange={(value) => {
                                                                        if (value && value.length > 0 && value[0].value === 'all') {
                                                                            const allDays = dayType.map(pref => pref.cs_reg_daytype_id);
                                                                            input.onChange([{ value: allDays, label: 'Select All' }]);
                                                                        } else {
                                                                            input.onChange(value);
                                                                        }
                                                                    }}
                                                                    onBlur={input.onBlur}
                                                                    classNamePrefix="react-select"
                                                                    isMulti={true}
                                                                    value={input.value}
                                                                />
                                                            </div>
                                                        )}
                                                    </Field>
                                                </Col>
                                            </Row>
                                            <Row>
                                                <Col md="12" className="mb-3">
                                                    <Field
                                                        name={`workshop`} // Use dynamic field name
                                                    >
                                                        {({ input }) => (
                                                            <div>
                                                                <Label className='form-label' for="workshop"><strong>Workshop</strong></Label>
                                                                <Select
                                                                    {...input}
                                                                    options={[
                                                                        { value: 'all', label: 'Select All' },
                                                                        ...workshop.map(pref => ({ value: pref.cs_workshop_id, label: pref.cs_workshop_name }))
                                                                    ]}
                                                                    placeholder={`Select Workshop`}
                                                                    isSearchable={true}
                                                                    onChange={(value) => {
                                                                        if (value && value.length > 0 && value[0].value === 'all') {
                                                                            const allWorkshops = workshop.map(pref => pref.cs_workshop_id);
                                                                            input.onChange([{ value: allWorkshops, label: 'Select All' }]);
                                                                        } else {
                                                                            input.onChange(value);
                                                                        }
                                                                    }}
                                                                    onBlur={input.onBlur}
                                                                    classNamePrefix="react-select"
                                                                    isMulti={true}
                                                                    value={input.value}
                                                                />
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
                                                <Col md="6" className="mb-3">
                                                    <Label for="startReg"><strong>Start Reg No</strong></Label>
                                                    <Field
                                                        name="startReg"
                                                        render={({ input }) => (
                                                            <Select
                                                                {...input}
                                                                options={userOptions.fromStart}
                                                                classNamePrefix="react-select"
                                                            />
                                                        )}
                                                    />
                                                </Col>
                                                <Col md="6" className="mb-3">
                                                    <Label for="endReg"><strong>End Reg No</strong></Label>
                                                    <Field
                                                        name="endReg"
                                                        render={({ input }) => (
                                                            <Select
                                                                {...input}
                                                                options={userOptions.fromEnd}
                                                                classNamePrefix="react-select"
                                                            />
                                                        )}
                                                    />
                                                </Col>
                                            </Row>

                                            <Row>
                                                <Col md="12" className="mb-3">
                                                    <Field
                                                        name={`reportfield`}
                                                    >
                                                        {({ input }) => (
                                                            <div>
                                                                <Label className='form-label' for="reportfield"><strong>Report Fields</strong></Label>
                                                                <Select
                                                                    {...input}
                                                                    options={[
                                                                        { value: 'all', label: 'Select All' },
                                                                        ...field.map(pref => ({ value: pref.cs_field_name, label: pref.cs_field_label }))
                                                                    ]}
                                                                    placeholder={`Select Report Field`}
                                                                    isSearchable={true}
                                                                    onChange={(value) => {
                                                                        if (value && value.length > 0 && value[0].value === 'all') {
                                                                            const allFieldNames = field.map(pref => pref.cs_field_name);
                                                                            input.onChange([{ value: allFieldNames, label: 'Select All' }]);
                                                                        } else {
                                                                            input.onChange(value);
                                                                        }
                                                                    }}
                                                                    onBlur={input.onBlur}
                                                                    classNamePrefix="react-select"
                                                                    isMulti={true}
                                                                    isClearable={false}
                                                                    value={input.value}
                                                                />
                                                            </div>
                                                        )}
                                                    </Field>
                                                </Col>
                                            </Row>








                                            <div>
                                                <Button color='primary' type='submit' className="me-2 mt-3">Download Report</Button>
                                                <Button color='warning' onClick={handleCancel} className="mt-3">Cancel</Button>
                                            </div>




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
                    <Button
                        onClick={handleNavigation} color='warning'>
                        Yes

                    </Button>
                    {/* <Link to="/Workshop/Consoft" className="btn btn-warning">Yes</Link> */}
                    <Button color="primary" onClick={() => setModal(!modal)}>No</Button>
                </ModalFooter>
            </Modal>
        </Fragment>
    );
};

export default UserReport;
