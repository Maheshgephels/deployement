
import React, { Fragment, useState, useEffect } from 'react';
import { Container, Row, Col, Button, Card, CardBody, Modal, ModalHeader, ModalBody, ModalFooter, FormFeedback, Label, PopoverBody, UncontrolledPopover } from 'reactstrap';
import { Breadcrumbs } from '../../AbstractElements';
import axios from 'axios';
import { BackendAPI } from '../../api';
import SweetAlert from 'sweetalert2';
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import { MdDelete, MdInfoOutline } from "react-icons/md";
import { IoIosArrowDown } from "react-icons/io";
import { Field, Form } from 'react-final-form'; // Import Field and Form from react-final-form
import { Link, useNavigate } from 'react-router-dom';
import Select from 'react-select';
import { required, email, Wname, password, expiryDate } from '../Utils/validationUtils';
import { toast } from 'react-toastify';
import generatePDFFromBadgeListforList from '../Badge-Design/badgeDownlode/UserListbadgeprint';

//
import { FormGroup, Input } from 'reactstrap';

import useAuth from '../../Auth/protectedAuth';
import { getToken } from '../../Auth/Auth';




const SingleExport = () => {
    useAuth();
    const [options, setOptions] = useState([]);
    const [selectedUser, setSelectedUser] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [foundUsers, setFoundUsers] = useState([]);
    const navigate = useNavigate(); // Initialize useHistory




    const handleSearch = async () => {
        // Perform search logic here
        if (searchQuery.trim() !== '') {
            try {
                const token = getToken();
                console.log("searchQuery from handleSearch single ", searchQuery)
                // const response = await axios.get(`${BackendAPI}/export/getsearchUserdata`,{
                //     headers: {
                //         Authorization: `Bearer ${token}` // Include the token in the Authorization header
                //     }
                // },{
                //     params: {
                //         query: searchQuery
                //     }
                // });

                const response = await axios.get(`${BackendAPI}/export/getsearchUserdata`, {
                    headers: {
                        Authorization: `Bearer ${token}`
                    },
                    params: {
                        query: searchQuery
                    }
                });
                const foundUsers = response.data[0];
                console.log('foundUsers searching:', foundUsers);

                setFoundUsers(foundUsers);
                if (foundUsers.length > 0) {
                    toast.info(`Found ${foundUsers.length} matching records`);
                } else {
                    toast.error('No matching records found');
                }
            } catch (error) {
                console.error('Error searching:', error);
                toast.error('Failed to search');
            }
        } else {
            toast.warning('Please enter a search query');
        }
    };




    //--
    // const handleExportBadges = async () => {
    //     // Logic to export badges for selected user
    //     // Implement this based on your requirements
    //     if (selectedUser) {
    //         const category = selectedUser.cs_reg_category;

    //         console.log("selectedUser value ", selectedUser);

    //         try {
    //             const token = getToken(); 
    //             const response = await axios.post(`${BackendAPI}/badge/getbadgefileds`, { category },{
    //                 headers: {
    //                     Authorization: `Bearer ${token}` // Include the token in the Authorization header
    //                 }
    //             });
    //             const apibadgeDataResponse = response.data.badgedata;

    //             console.log(apibadgeDataResponse);

    //             apibadgeDataResponse.badge_fields.forEach(field => {
    //                 // Check if the user object contains a property with the same name as cs_field_name
    //                 if (
    //                     selectedUser.hasOwnProperty(field.cs_field_name) &&
    //                     selectedUser[field.cs_field_name] !== null && // Check for null values
    //                     selectedUser[field.cs_field_name] !== undefined // Check for undefined values
    //                 ) {
    //                     // If the value is a string, update cs_field_name with the corresponding value from the user object
    //                     if (typeof selectedUser[field.cs_field_name] === 'string') {
    //                         field.cs_field_name = selectedUser[field.cs_field_name].trim(); // Trim any leading/trailing spaces
    //                     } else { // If the value is not a string, convert it to a string
    //                         field.cs_field_name = String(selectedUser[field.cs_field_name]);
    //                     }
    //                 }

    //                 // Check if cs_field_name is "fullname" and update it accordingly
    //                 if (field.cs_field_name === "fullname") {
    //                     field.cs_field_name = `${selectedUser.cs_first_name} ${selectedUser.cs_last_name}`;
    //                 }
    //             });

    //             // Wrapping apibadgeDataResponse in an array
    //             const badgeList = [apibadgeDataResponse];

    //             // Logging the badge list
    //             console.log("Badge List:", badgeList);

    //             await generatePDFFromBadgeListforList(badgeList);

    //             toast.success(`Exporting badge for ${selectedUser.cs_first_name} ${selectedUser.cs_last_name}`);
    //         } catch (error) {
    //             console.error('Error exporting badges:', error);
    //             toast.error('Failed to export badges');
    //         }
    //     } else {
    //         toast.warning('Please select a user to export the badge');
    //     }
    // };



    //270524
    const handleExportBadges = async () => {
        // Logic to export badges for selected user
        // Implement this based on your requirements
        if (selectedUser) {
            const category = selectedUser.cs_reg_category;

            console.log("selectedUser value ", selectedUser);

            try {
                const token = getToken();
                const response = await axios.post(`${BackendAPI}/badge/getbadgefileds`, { category }, {
                    headers: {
                        Authorization: `Bearer ${token}` // Include the token in the Authorization header
                    }
                });
                const apibadgeDataResponse = response.data.badgedata;

                console.log(apibadgeDataResponse);

                apibadgeDataResponse.badge_fields.forEach(field => {
                    // Check if the user object contains a property with the same name as cs_field_name
                    if (
                        selectedUser.hasOwnProperty(field.cs_field_name) &&
                        selectedUser[field.cs_field_name] !== null && // Check for null values
                        selectedUser[field.cs_field_name] !== undefined // Check for undefined values
                    ) {
                        // If the value is a string, update cs_field_name with the corresponding value from the user object
                        if (typeof selectedUser[field.cs_field_name] === 'string') {
                            field.cs_field_name = selectedUser[field.cs_field_name].trim(); // Trim any leading/trailing spaces
                        } else { // If the value is not a string, convert it to a string
                            field.cs_field_name = String(selectedUser[field.cs_field_name]);
                        }
                    }

                    // Check if cs_field_name is "fullname" and update it accordingly
                    if (field.cs_field_name === "fullname") {
                        field.cs_field_name = `${selectedUser.cs_first_name} ${selectedUser.cs_last_name}`;
                        const fullName = selectedUser.cs_title ? `${selectedUser.cs_title} ${selectedUser.cs_first_name} ${selectedUser.cs_last_name}` : `${selectedUser.cs_first_name} ${selectedUser.cs_last_name}`;
                        field.cs_field_name = fullName;
                    }

                    if (field.cs_field_label === "First Name") {
                        field.textBold = true; // or any style you want to add for bold text
                    }
                    else{
                        field.textBold = false; // 
                    }
                });

                // Wrapping apibadgeDataResponse in an array
                const badgeList = [apibadgeDataResponse];

                // Logging the badge list
                console.log("Badge List:", badgeList);

                await generatePDFFromBadgeListforList(badgeList);

                toast.success(`Exporting badge for ${selectedUser.cs_first_name} ${selectedUser.cs_last_name}`);
            } catch (error) {
                if (error.response) {
                    // Server responded with a status other than 200 range
                    console.error('API error:', error.response.data);
                    toast.error(`Failed to export badges: ${error.response.data.message}`);
                } else if (error.request) {
                    // Request was made but no response received
                    console.error('Network error:', error.request);
                    toast.error('Failed to export badges: Network error. Please check your internet connection.');
                } else {
                    // Something else caused the error
                    console.error('Error:', error.message);
                    toast.error(`Failed to export badges: ${error.message}`);
                }
            }
        } else {
            toast.warning('Please select a user to export the badge');
        }
    };



    return (
        <Fragment>
            <Breadcrumbs mainTitle={
                <>
                    Single Export
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
                            Export a badge for a single user only.
                        </PopoverBody>
                    </UncontrolledPopover>
                </> 
            } parent="Badge" title="Badge Export" />
            <Container fluid>
                <Row>
                    <Col sm="6">
                        <Card>
                            <CardBody>
                                <FormGroup>
                                    <Label for="searchQuery">Search by Registration Number, First Name, or Last Name:</Label>
                                    <Input
                                        type="text"
                                        name="searchQuery"
                                        id="searchQuery"
                                        placeholder="Enter search query"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                    />
                                </FormGroup>
                                <Button color="primary" className='me-2' onClick={handleSearch}>Search</Button>
                                {/* Display found users as options in a dropdown select */}
                                {foundUsers.length > 0 && (
                                    <FormGroup>
                                        <Label for="foundUsers">Select a user:</Label>
                                        <Input
                                            type="select"
                                            name="foundUsers"
                                            id="foundUsers"
                                            onChange={(e) => setSelectedUser(foundUsers.find(user => user.id === parseInt(e.target.value)))}
                                        >
                                            <option value="">Select a user...</option>
                                            {foundUsers.map(user => (
                                                <option key={user.id} value={user.id}>{user.cs_regno} - {user.cs_first_name} {user.cs_last_name}</option>
                                            ))}

                                        </Input>
                                    </FormGroup>
                                )}
                                {/* Button to trigger badge export */}
                                <Button color="success" onClick={handleExportBadges}>Export Badge</Button>
                            </CardBody>
                        </Card>
                    </Col>
                </Row>
            </Container>

        </Fragment>
    );
};

export default SingleExport;
