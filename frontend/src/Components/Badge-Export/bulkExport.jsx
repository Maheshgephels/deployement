import React, { Fragment, useState, useEffect, useContext } from 'react';
import { Container, Row, Col, Button, Card, CardHeader, CardBody, Label, PopoverBody, UncontrolledPopover } from 'reactstrap';
import { Breadcrumbs } from '../../AbstractElements';
import axios from 'axios';
import { BackendAPI } from '../../api';
import { Field, Form } from 'react-final-form';
import { MdDelete, MdInfoOutline } from "react-icons/md";
import Select from 'react-select';
import { toast } from 'react-toastify';
import { Link, useNavigate } from 'react-router-dom';
import generatePDFFromBadgeListforList from '../Badge-Design/badgeDownlode/UserListbadgeprint';
// Import PermissionsContext
import { PermissionsContext } from '../../contexts/PermissionsContext';
import useAuth from '../../Auth/protectedAuth';
import { getToken } from '../../Auth/Auth';



const BulkExport = () => {
    useAuth();
    const [userOptions, setUserOptions] = useState({ fromStart: [], fromEnd: [] });
    const [regCategory, setregCategory] = useState([]);
    const [dayType, setDayType] = useState([]);
    const [modal, setModal] = useState(false);
    const navigate = useNavigate(); // Initialize useHistory
    const { permissions } = useContext(PermissionsContext);

    useEffect(() => {
        fetchDropdown();
        fetchUserRecords();
    }, [permissions]);

    // Extract Bulk Export component
    const BulkExportpermissions = permissions['BulkExport'];
    // console.log('categoryPermissions', categoryPermissions);


    const fetchDropdown = async () => {
        try {
            const token = getToken();
            const response = await axios.get(`${BackendAPI}/export/getDropdownData`, {
                headers: {
                    Authorization: `Bearer ${token}` // Include the token in the Authorization header
                }
            });
            const { regCategory, dayType } = response.data;
            console.log("Dropdown Data:", response.data);
            setregCategory(regCategory);
            setDayType(dayType);
        } catch (error) {
            console.error('Error fetching dropdown data:', error);
        }
    };




    const onSubmit = async (values) => {
        const toastId = toast.info('Processing...', { autoClose: false });
    
        try {
            console.log('on submit click');
    
            // Extract selected category and event day IDs
            const selectedCategory = values.category ? [values.category.value] : [];
            let categoryName = null;
    
            if (selectedCategory.length > 0) {
                const selectedCategoryObject = regCategory.find(category => category.cs_reg_cat_id === selectedCategory[0]);
                categoryName = selectedCategoryObject ? selectedCategoryObject.cs_reg_category : null;
            }
    
            const selectedEventDay = values.eventday ? [values.eventday.value] : [];
            const token = getToken();
            const badgeFieldsResponse = await axios.post(`${BackendAPI}/badge/getbadgefileds`, { category: categoryName }, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
    
            const badgeFieldsData = badgeFieldsResponse.data.badgedata;
            const csFieldNames = badgeFieldsData.badge_fields.map(field => field.cs_field_name);
    
            console.log("csFieldNames", csFieldNames);
    
            const requestBody = {
                selectedCategory,
                selectedEventDay,
                csFieldNames
            };
    
            const userDataResponse = await axios.post(`${BackendAPI}/export/exportbadgeUsers`, requestBody, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
    
            const [userDatas, metadata] = userDataResponse.data;
            console.log("userDatas on bulk export", userDatas);
    
            if (userDatas.length === 0) {
                console.log('No user data found');
                toast.dismiss(toastId); // Dismiss the processing toast
                toast.error('No user data found for the selected category');
                return;
            }
    
            const badgeList = [];
    
            userDatas.forEach(userData => {
                const newBadge = {
                    width: badgeFieldsData.width,
                    height: badgeFieldsData.height,
                    orientation: badgeFieldsData.orientation,
                    type: badgeFieldsData.type,
                    badge_fields: []
                };
    
                badgeFieldsData.badge_fields.forEach(field => {
                    const fieldName = field.cs_field_name;
                    const fieldValue = userData[fieldName];
                    // Add bold text property if fieldName is cs_first_name
                    const newField = { ...field, cs_field_name: fieldValue };
                    if (fieldName === 'cs_first_name') {
                        newField.textBold = true; // or any style you want to add for bold text
                    }
                    else{
                        newField.textBold = false; // 
                    }
                    newBadge.badge_fields.push(newField);
                });
    
                badgeList.push(newBadge);
            });
            
    
            await generatePDFFromBadgeListforList(badgeList);
            toast.dismiss(toastId);
            toast.success('Badges exported successfully!');
        } catch (error) {
            console.log('Error occurred', error);
            toast.dismiss(toastId); // Dismiss the processing toast in case of an error
            if (error.response && error.response.data && error.response.data.error) {
                toast.error(error.response.data.error);
            } else {
                toast.error('An unexpected error occurred. Please try again later.');
            }
        }
    };
    



    ///////////////////////  slectstart and end Reg No

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


    const fetchBadgeFields = async (category) => {
        try {
            const token = getToken();
            const response = await axios.post(`${BackendAPI}/badge/getbadgefileds`, { category }, {
                headers: {
                    Authorization: `Bearer ${token}` // Include the token in the Authorization header
                }
            });
            return response.data.badgedata;
        } catch (error) {
            console.error('Error fetching badge fields:', error);
            // toast.error('Failed to fetch badge fields. Please try again later.');
            return null;
        }
    };




    // const onSubmitSecondForm = async (values) => {
    //     try {
    //         const startRegValue = values.startReg.value;
    //         const endRegValue = values.endReg.value;
    //         console.log('start and endReg:', startRegValue, endRegValue);

    //         if (startRegValue === 'from_start' || endRegValue === 'to_end') {
    //             toast.error('Please select start and end registration numbers.');
    //             return;
    //         }
    //         const token = getToken(); 
    //         const response = await axios.get(`${BackendAPI}/export/userlistforbadge?startReg=${startRegValue}&endReg=${endRegValue}`,{
    //             headers: {
    //                 Authorization: `Bearer ${token}` // Include the token in the Authorization header
    //             }
    //         });
    //         const users = response.data[0];
    //         console.log('Fetching users:', users);

    //         if (users.length === 0) {
    //             toast.error('No user data found for the selected range.');
    //             return;
    //         }

    //         const badgeList = [];
    //         for (const user of users) {
    //             if (!user.cs_reg_category) {
    //                 toast.error('User object does not contain the category property:', user);
    //                 continue;
    //             }

    //             console.log('Fetching badge fields for category:', user.cs_reg_category);
    //             const badgeFieldsData = await fetchBadgeFields(user.cs_reg_category);

    //             if (!badgeFieldsData) {
    //                 console.error('No badge data found for user:', user);
    //                 continue;
    //             }

    //             const newBadge = {
    //                 width: badgeFieldsData.width,
    //                 height: badgeFieldsData.height,
    //                 orientation: badgeFieldsData.orientation,
    //                 badge_fields: []
    //             };
    //             badgeFieldsData.badge_fields.forEach(field => {
    //                 let fieldValue = user[field.cs_field_name]; // Get the field value from userData
    //                 // Check if the field is 'fullname' and concatenate cs_first_name and cs_last_name if it is
    //                 if (field.cs_field_name === 'fullname') {
    //                     fieldValue = `${user.cs_first_name} ${user.cs_last_name}`;
    //                 }
    //                 const newField = { ...field, cs_field_name: fieldValue };
    //                 newBadge.badge_fields.push(newField);
    //             });

    //             badgeList.push(newBadge);
    //         }

    //         await generatePDFFromBadgeListforList(badgeList);
    //         toast.success('Badges exported successfully.');
    //     } catch (error) {
    //         console.error('Error exporting badges:', error);
    //         toast.error('An unexpected error occurred. Please try again later.');
    //     }
    // };


    //--270524
    const onSubmitSecondForm = async (values) => {
        
        const toastId = toast.info('Processing...', { autoClose: false });

        try {
            const startRegValue = values.startReg.value;
            const endRegValue = values.endReg.value;
            console.log('start and endReg:', startRegValue, endRegValue);

            if (startRegValue === 'from_start' || endRegValue === 'to_end') {
                toast.error('Please select start and end registration numbers.');
                return;
            }

            const token = getToken();
            const response = await axios.get(`${BackendAPI}/export/userlistforbadge?startReg=${startRegValue}&endReg=${endRegValue}`, {
                headers: {
                    Authorization: `Bearer ${token}` // Include the token in the Authorization header
                }
            });
            const users = response.data[0];
            console.log('Fetching users:', users);

            if (users.length === 0) {
                console.log('No user data found');
                toast.dismiss(toastId); // Dismiss the processing toast
                toast.error('No user data found for the selected range');
                return;
            }

            const badgeList = [];
            const skippedUsers = [];

            for (const user of users) {
                if (!user.cs_reg_category) {
                    console.warn('User object does not contain the category property:', user);
                    skippedUsers.push(user);
                    continue;
                }

                try {
                    console.log('Fetching badge fields for category:', user.cs_reg_category);
                    const badgeFieldsData = await fetchBadgeFields(user.cs_reg_category);

                    if (!badgeFieldsData) {
                        console.error('No badge data found for user:', user);
                        skippedUsers.push(user);
                        continue;
                    }

                    const newBadge = {
                        width: badgeFieldsData.width,
                        height: badgeFieldsData.height,
                        orientation: badgeFieldsData.orientation,
                        type : badgeFieldsData.type,
                        badge_fields: []
                    };

                    badgeFieldsData.badge_fields.forEach(field => {
                        let fieldValue = user[field.cs_field_name]; // Get the field value from userData
                        // Check if the field is 'fullname' and concatenate cs_first_name and cs_last_name if it is
                        if (field.cs_field_name === 'fullname') {
                            // fieldValue = `${user.cs_first_name} ${user.cs_last_name}`;
                            const fullName = user.cs_title ? `${user.cs_title} ${user.cs_first_name} ${user.cs_last_name}` : `${user.cs_first_name} ${user.cs_last_name}`;
                            fieldValue = fullName;
                        }
                        const newField = { ...field, cs_field_name: fieldValue };
                        if (field.cs_field_label === 'First Name') {
                            newField.textBold = true; // or any style you want to add for bold text
                        }
                        else{
                            newField.textBold = false; // 
                        }
                        newBadge.badge_fields.push(newField);
                    });

                    badgeList.push(newBadge);
                } catch (error) {
                    console.error('Error processing user:', user, error);
                    skippedUsers.push(user);
                }
            }

            if (badgeList.length > 0) {
                await generatePDFFromBadgeListforList(badgeList);
                toast.dismiss(toastId);
                toast.success('Badges exported successfully!');
            } else {
                toast.error('No badges were exported.');
            }

            if (skippedUsers.length > 0) {
                console.warn('Skipped users:', skippedUsers);
                toast.warn(`${skippedUsers.length} users were skipped due to missing data or errors.`);
            }
        } catch (error) {
            console.error('Error exporting badges:', error);
            toast.error('An unexpected error occurred. Please try again later.');
        }
    };

    const onSubmitThirdForm = async (values) => {
        const toastId = toast.info('Processing...', { autoClose: false });

        try {
            const startDate = values.startDate; // Assumes values.startDate is a Date object or string in YYYY-MM-DD format
            const endDate = values.endDate; // Assumes values.endDate is a Date object or string in YYYY-MM-DD format

            // Ensure both dates are selected
            if (!startDate || !endDate) {
                toast.error('Please select both start and end dates.');
                return;
            }

            const token = getToken();
            const response = await axios.get(`${BackendAPI}/export/userlistforbadge2?startDate=${startDate}&endDate=${endDate}`, {
                headers: {
                    Authorization: `Bearer ${token}` // Include the token in the Authorization header
                }
            });
            const users = response.data[0];
            console.log('Fetching users:', users);

            // if (users.length === 0) {
            //     toast.error('No user data found for the selected range.');
            //     return;
            // }

            if (users.length === 0) {
                console.log('No user data found');
                toast.dismiss(toastId); // Dismiss the processing toast
                toast.error('No user data found for the selected range');
                return;
            }

            const badgeList = [];
            const skippedUsers = [];

            for (const user of users) {
                if (!user.cs_reg_category) {
                    console.warn('User object does not contain the category property:', user);
                    skippedUsers.push(user);
                    continue;
                }

                try {
                    console.log('Fetching badge fields for category:', user.cs_reg_category);
                    const badgeFieldsData = await fetchBadgeFields(user.cs_reg_category);

                    if (!badgeFieldsData) {
                        console.error('No badge data found for user:', user);
                        skippedUsers.push(user);
                        continue;
                    }

                    const newBadge = {
                        width: badgeFieldsData.width,
                        height: badgeFieldsData.height,
                        orientation: badgeFieldsData.orientation,
                        type : badgeFieldsData.type,
                        badge_fields: []
                    };

                    badgeFieldsData.badge_fields.forEach(field => {
                        let fieldValue = user[field.cs_field_name]; // Get the field value from userData
                        // Check if the field is 'fullname' and concatenate cs_first_name and cs_last_name if it is
                        // if (field.cs_field_name === 'fullname') {
                        //     fieldValue = `${user.cs_first_name} ${user.cs_last_name}`;
                        // }

                        if (field.cs_field_name === 'fullname') {
                            // fieldValue = `${user.cs_first_name} ${user.cs_last_name}`;
                            const fullName = user.cs_title ? `${user.cs_title} ${user.cs_first_name} ${user.cs_last_name}` : `${user.cs_first_name} ${user.cs_last_name}`;
                            fieldValue = fullName;
                        }
                        const newField = { ...field, cs_field_name: fieldValue };

                        if (field.cs_field_name === 'cs_first_name' || field.cs_field_label === 'First Name') {
                            newField.textBold = true; // or any style you want to add for bold text
                        }
                        else{
                            newField.textBold = false; // 
                        }
                        newBadge.badge_fields.push(newField);
                    });

                    badgeList.push(newBadge);
                } catch (error) {
                    console.error('Error processing user:', user, error);
                    skippedUsers.push(user);
                }
            }

            if (badgeList.length > 0) {
                await generatePDFFromBadgeListforList(badgeList);
                toast.dismiss(toastId);
                toast.success('Badges exported successfully!');
            } else {
                toast.error('No badges were exported.');
            }

            if (skippedUsers.length > 0) {
                console.warn('Skipped users:', skippedUsers);
                toast.warn(`${skippedUsers.length} users were skipped due to missing data or errors.`);
            }
        } catch (error) {
            console.error('Error exporting badges:', error);
            toast.error('An unexpected error occurred. Please try again later.');
        }
    };





    //-------



    const handleCancel = () => {
        setModal(true);
    };



    return (
        <Fragment>
            <Breadcrumbs mainTitle={
                <>
                    Bulk Export
                    <MdInfoOutline
                        id="singleExportPopover"
                        style={{
                            cursor: 'pointer', position: 'absolute', marginLeft: '5px'
                        }}
                    />
                    <UncontrolledPopover
                        placement="bottom"
                        target="singleExportPopover"
                        trigger="focus"
                    >
                        <PopoverBody>
                            Bulk export badges allows you to quickly export and manage badge information for many users at once in <strong>PDF</strong> format. <br />
                            You can export badges by category, registration type, within a range of start and end registration numbers, or by date range of user registration.
                        </PopoverBody>
                    </UncontrolledPopover>
                </>
            } parent="Badge" title="Badge Export" />
            <Container fluid>
                <Row>
                    <Col md="6">
                        <Card>
                            <CardHeader>
                                <strong>Category Wise</strong>
                            </CardHeader>
                            <CardBody>
                                <Form onSubmit={onSubmit}>
                                    {({ handleSubmit }) => (
                                        <form onSubmit={handleSubmit}>
                                            <Row>
                                                <Col md="6">
                                                    <Label for="category"><strong>Category</strong></Label>
                                                    <Field
                                                        name="category"
                                                        render={({ input }) => (
                                                            <Select
                                                                {...input}
                                                                options={regCategory.map(cat => ({ value: cat.cs_reg_cat_id, label: cat.cs_reg_category }))}
                                                                classNamePrefix="react-select"
                                                            />
                                                        )}
                                                    />
                                                </Col>
                                                <Col md="6">
                                                    <Label for="eventday"><strong>Event Day</strong></Label>
                                                    <Field
                                                        name="eventday"
                                                        render={({ input }) => (
                                                            <Select
                                                                {...input}
                                                                options={dayType.map(day => ({ value: day.cs_reg_daytype_id, label: day.cs_reg_daytype_name }))}
                                                                classNamePrefix="react-select"
                                                            />
                                                        )}
                                                    />
                                                </Col>
                                            </Row>
                                            <Button color="primary" type="submit" className="mt-3 me-2">Export Badge</Button>
                                            <Button color="warning" onClick={handleCancel} className="mt-3">Cancel</Button>
                                        </form>
                                    )}
                                </Form>

                            </CardBody>
                        </Card>

                    </Col>
                    <Col md="6">
                        <Card>
                            <CardHeader>
                                <strong>Registration Number Wise</strong>
                            </CardHeader>
                            <CardBody>
                                <Form onSubmit={onSubmitSecondForm}>
                                    {({ handleSubmit }) => (
                                        <form onSubmit={handleSubmit}>
                                            <Row>
                                                <Col md="6">
                                                    <Label for="startReg"><strong>Select Start Registration Number</strong></Label>
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
                                                <Col md="6">
                                                    <Label for="endReg"><strong>Select End Registration Number</strong></Label>
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
                                            <Button color="primary" type="submit" className="mt-3 mr-2">Export Badge</Button>
                                        </form>
                                    )}
                                </Form>
                            </CardBody>
                        </Card>

                    </Col>

                    <Col md="6">
                        <Card>
                            <CardHeader>
                                <strong>DateWise</strong>
                            </CardHeader>
                            <CardBody>
                                <Form onSubmit={onSubmitThirdForm}>
                                    {({ handleSubmit }) => (
                                        <form onSubmit={handleSubmit}>
                                            <Row>
                                                <Col md="6">
                                                    <Label for="startDate"><strong>Select From Date</strong></Label>
                                                    <Field name="startDate">
                                                        {({ input }) => (
                                                            <input
                                                                {...input}
                                                                type="date"
                                                                className="form-control"
                                                                placeholder="Select start date"
                                                            />
                                                        )}
                                                    </Field>
                                                </Col>
                                                <Col md="6">
                                                    <Label for="endDate"><strong>Select To Date</strong></Label>
                                                    <Field name="endDate">
                                                        {({ input }) => (
                                                            <input
                                                                {...input}
                                                                type="date"
                                                                className="form-control"
                                                                placeholder="Select end date"
                                                            />
                                                        )}
                                                    </Field>
                                                </Col>
                                            </Row>
                                            <Button color="primary" type="submit" className="mt-3 mr-2">Export Badge</Button>
                                        </form>
                                    )}
                                </Form>
                            </CardBody>
                        </Card>
                    </Col>
                </Row>

            </Container>

        </Fragment>
    );
};

export default BulkExport;
