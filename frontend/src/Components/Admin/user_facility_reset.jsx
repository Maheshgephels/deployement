// import React, { Fragment, useEffect, useState, useContext } from 'react';
// import { useLocation } from 'react-router-dom';
// import { Container, Row, Col, Card, Input, Table, CardHeader, CardBody, Button, Modal, ModalHeader, ModalFooter, ModalBody ,FormGroup,Label} from 'reactstrap'; // Import Modal component
// import axios from 'axios';
// import { BackendAPI } from '../../api';
// import { Link, useNavigate } from 'react-router-dom'; // Import useHistory for programmatic navigation
// import { FaEdit, FaSave } from "react-icons/fa";
// import { Breadcrumbs } from '../../AbstractElements';
// import { PermissionsContext } from '../../contexts/PermissionsContext';
// import { toast } from 'react-toastify';
// import { getToken } from '../../Auth/Auth';
// import useAuth from '../../Auth/protectedAuth';


// const UserFacilityReset = () => {
//     useAuth();
//     const [data, setData] = useState([]);
//     const [loading, setLoading] = useState(true);
//     const [editableRows, setEditableRows] = useState([]); // State to manage editable rows
//     const [currentlyEditedIndex, setCurrentlyEditedIndex] = useState(null); // State to track currently edited row
//     const location = useLocation();
//     const { catId, catName } = location.state;
//     const { user } = location.state;
//     const [modal, setModal] = useState(false);
//     const [selectedDays, setSelectedDays] = useState(0); // State to store selected days in modal
//     const [selectedRowIndex, setSelectedRowIndex] = useState(null); // State to store the index of the row being edited
//     const { permissions } = useContext(PermissionsContext);
//     const [userStatus, setUserStatus] = useState('');

//     useEffect(() => {
//         fetchCategory();
//         console.log("user", user);
//     }, [permissions]);

//     // Extract Category Access component
//     const CategoryAccesspermissions = permissions['Category Access'];

//     const fetchCategory = async () => {
//         try {
//             console.log("api call resetfacilityUser", user);
//             const token = getToken();
//             const response = await axios.post(`${BackendAPI}/category/resetfacilityUser`, { cs_regno: user.cs_regno }, {
//                 headers: {
//                     Authorization: `Bearer ${token}` // Include the token in the Authorization header
//                 }
//             });
//             setData(response.data);
//             console.log(response.data);
//             setEditableRows(new Array(response.data.length).fill(false)); // Initialize editableRows array
//             setLoading(false);
//         } catch (error) {
//             console.error('Error fetching pages:', error);
//             setLoading(false);
//         }
//     };

//     const toggleRowEditable = (index) => {
//         setCurrentlyEditedIndex(index); // Set the index of the row being edited
//         setSelectedRowIndex(index); // Set the index of the row for which modal is opened
//         setSelectedDays(data[index].allow_count); // Set the initial value of selected days
//         setModal(true);
//     };



//     // const handleModalSave = async () => {
//     //     const newItem = { ...data[selectedRowIndex], allow_count: selectedDays };
//     //     const newData = [...data];
//     //     newData[selectedRowIndex] = newItem;
//     //     setData(newData);

//     //     try {
//     //         const facilityName = data[selectedRowIndex].name;
//     //         // Update the facility count using the API endpoint
//     //         await axios.put(`${BackendAPI}/category/updateFacilityCount`, { cs_regno: user.cs_regno, cs_allow_count: selectedDays, facilityName: facilityName});

//     //         console.log('Data updated successfully');
//     //         setModal(false);
//     //         setEditableRows(prevState => {
//     //             const newState = [...prevState];
//     //             newState[selectedRowIndex] = false; // Disable editing after saving
//     //             return newState;
//     //         });
//     //     } catch (error) {
//     //         console.error('Error updating data:', error);
//     //     }
//     // };


//     const handleModalSave = async () => {
//         const newItem = { ...data[selectedRowIndex], allow_count: selectedDays };
//         const newData = [...data];
//         newData[selectedRowIndex] = newItem;
//         setData(newData);

//         try {
//             const facilityName = data[selectedRowIndex].name;
//             // Update the facility count using the API endpoint
//             const token = getToken();
//             const response = await axios.put(`${BackendAPI}/category/updateFacilityCount`, {
//                 cs_regno: user.cs_regno,
//                 cs_allow_count: selectedDays,
//                 facilityName: facilityName
//             }, {
//                 headers: {
//                     Authorization: `Bearer ${token}` // Include the token in the Authorization header
//                 }
//             });

//             // Show a success toast message with the API response message
//             toast.success(response.data.message, {
//                 position: toast.POSITION.TOP_RIGHT
//             });
//             setModal(false);
//             setEditableRows(prevState => {
//                 const newState = [...prevState];
//                 newState[selectedRowIndex] = false; // Disable editing after saving
//                 return newState;
//             });
//         } catch (error) {
//             console.error('Error updating data:', error);
//             // Show an error toast message with the API error message
//             toast.error(error.response?.data?.message || 'Error updating facility count', {
//                 position: toast.POSITION.TOP_RIGHT
//             });
//         }
//     };


//     const getFormattedFacilityName = (name) => {
//         if (name && name.startsWith && name.includes('_')) {
//             const [prefix, suffix] = name.split('_');
//             const formattedSuffix = suffix.charAt(0).toUpperCase() + suffix.slice(1).replace(/\d+/g, day => ` day ${day}`);
//             return `${formattedSuffix}`;
//         } else {
//             return name || '';
//         }
//     };

//     return (
//         <Fragment>
//             <Breadcrumbs parentClickHandler={handleNavigation} mainTitle="Facility Reset " parent="Manage User" title="Facility Reset    " />
//             <Container fluid={true}>
//                 <Row>
//                     <Col sm="12">
//                         <Card>
//                             <CardHeader className="d-flex justify-content-between align-items-center flex-column flex-md-row">
//                                 <div className="mb-2 mb-md-0">
//                                     <h5 className="mb-2 text-center">{catName}</h5>
//                                 </div>
//                             </CardHeader>
//                             <CardBody>
//                                 <div className='table-responsive'>
//                                     {loading ? (
//                                         <p>Loading...</p>
//                                     ) : (
//                                         <Table>
//                                             <thead>
//                                                 <tr className='border-bottom-primary'>
//                                                     <th scope='col' className='text-start'>{'Sr No.'}</th>
//                                                     <th scope='col' className='text-center'>{'Facility Name'}</th>
//                                                     <th scope='col' className='text-center'>{'Allow Count'}</th>
//                                                     <th scope='col' className='text-center'>{'Taken Status'}</th>
//                                                     <th scope='col' className='text-center'>{'Datetime Utilization'}</th>
//                                                     {CategoryAccesspermissions?.edit === 1 && (
//                                                         <th scope='col' className='text-center'>{'Action'}</th>
//                                                     )}
//                                                 </tr>
//                                             </thead>
//                                             <tbody>
//                                                 {data.map((page, index) => (
//                                                     <tr key={index} className="border-bottom-primary">
//                                                         <td className='text-start'>{index + 1}</td> {/* Incremental serial number */}
//                                                         <td className='text-center'>{getFormattedFacilityName(page.name)}</td>
//                                                         <td className='text-center'>{page.allow_count}</td>
//                                                         <td className='text-center'>{page.status}</td>
//                                                         <td className='text-center'>{`${page.cs_date}: ${page.cs_time}`}</td>
//                                                         {CategoryAccesspermissions?.edit === 1 && (
//                                                             <td className='text-center'>
//                                                                 <Button color="warning" size="sm" onClick={() => toggleRowEditable(index)} disabled={editableRows[index]}>
//                                                                     <FaEdit />
//                                                                 </Button>
//                                                             </td>
//                                                         )}
//                                                     </tr>
//                                                 ))}
//                                             </tbody>
//                                         </Table>
//                                     )}
//                                 </div>
//                             </CardBody>
//                         </Card>
//                     </Col>
//                 </Row>
//             </Container>

//             {/* Modal */}
//             <Modal isOpen={modal} toggle={() => setModal(!modal)} centered size="sm">
//                 <ModalHeader toggle={() => setModal(!modal)}>Select Allowed Count</ModalHeader>
//                 <ModalBody>
//                     Set allow counts reflecting on user badge data so make sure counts are correct
//                     {/* <Input
//                             type="text"
//                             value={selectedDays}
//                             className='text-center'
//                             onChange={(e) => setSelectedDays(e.target.value)}
//                             min={0}
//                         /> */}

//                     <FormGroup>
//                         <Label for="allowedCount">Allowed Count</Label>
//                         <Input
//                             id="allowedCount"
//                             type="number"
//                             value={selectedDays}
//                             className='text-center'
//                             onChange={(e) => setSelectedDays(e.target.value)}
//                             min={0}
//                         />
//                     </FormGroup>
//                     <FormGroup>
//                         <Label for="userStatus">Edit User Status</Label>
//                         <Input
//                             id="userStatus"
//                             type="text"
//                             value={userStatus}
//                             className='text-center'
//                             onChange={(e) => setUserStatus(e.target.value)}
//                         />
//                     </FormGroup>
//                 </ModalBody>
//                 <ModalFooter>
//                     <Button color="primary" onClick={() => handleModalSave()}>Save</Button>
//                     <Button color="secondary" onClick={() => setModal(!modal)}>Cancel</Button>
//                 </ModalFooter>
//             </Modal>
//         </Fragment>
//     );
// };

// export default UserFacilityReset;

import React, { Fragment, useEffect, useState, useContext } from 'react';
import { useLocation } from 'react-router-dom';
import {
    Container, Row, Col, Card, Input, Table, CardHeader, CardBody, Button,
    Modal, ModalHeader, ModalFooter, ModalBody, FormGroup, Label, PopoverBody, UncontrolledPopover
} from 'reactstrap';
import axios from 'axios';
import { BackendAPI } from '../../api';
import { Link, useNavigate } from 'react-router-dom';
import { FaEdit, FaSave } from "react-icons/fa";
import { MdDelete, MdInfoOutline } from "react-icons/md";
import { Breadcrumbs } from '../../AbstractElements';
import { PermissionsContext } from '../../contexts/PermissionsContext';
import { toast } from 'react-toastify';
import { getToken } from '../../Auth/Auth';
import useAuth from '../../Auth/protectedAuth';
import moment from 'moment-timezone';

const UserFacilityReset = () => {
    useAuth();
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editableRows, setEditableRows] = useState([]);
    const [currentlyEditedIndex, setCurrentlyEditedIndex] = useState(null);
    const location = useLocation();
    const navigate = useNavigate(); // Initialize useHistory
    const { catId, catName } = location.state;
    const { user } = location.state;
    const [modal, setModal] = useState(false);
    const [selectedDays, setSelectedDays] = useState(0);
    const [selectedRowIndex, setSelectedRowIndex] = useState(null);
    const { permissions } = useContext(PermissionsContext);
    const [userStatus, setUserStatus] = useState('');
    const selectedTimezone = localStorage.getItem('selectedTimezone');

    console.log("DATA", data);



    useEffect(() => {
        fetchCategory();
        console.log("user", user);
    }, [permissions]);

    const CategoryAccesspermissions = permissions['Category Access'];

    const fetchCategory = async () => {
        try {
            console.log("api call resetfacilityUser", user);
            const token = getToken();
            const response = await axios.post(`${BackendAPI}/category/resetfacilityUser`, { cs_regno: user.cs_regno }, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            // Combine cs_date and cs_time into a single field
            const combinedData = response.data.map(item => ({
                ...item,
                cs_datetime: `${item.cs_date !== 'N/A' ? item.cs_date : ''} ${item.cs_time !== 'N/A' ? item.cs_time : ''}`.trim()
            }));

            setData(combinedData);
            console.log("User Data", combinedData);
            setEditableRows(new Array(combinedData.length).fill(false));
            setLoading(false);
        } catch (error) {
            console.error('Error fetching pages:', error);
            setLoading(false);
        }
    };


    const toggleRowEditable = (index) => {
        setCurrentlyEditedIndex(index);
        setSelectedRowIndex(index);
        setSelectedDays(data[index].allow_count);
        setUserStatus(data[index].status);
        setModal(true);
    };

    const handleModalSave = async () => {
        const newItem = { ...data[selectedRowIndex], allow_count: selectedDays, status: userStatus };
        const newData = [...data];
        newData[selectedRowIndex] = newItem;
        setData(newData);

        try {
            const facilityName = data[selectedRowIndex].name;
            const token = getToken();
            const response = await axios.put(`${BackendAPI}/category/updateFacilityCount`, {
                cs_regno: user.cs_regno,
                cs_allow_count: selectedDays,
                cs_user_status: userStatus,
                facilityName: facilityName
            }, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            toast.success(response.data.message, {
                position: toast.POSITION.TOP_RIGHT
            });
            setModal(false);
            setEditableRows(prevState => {
                const newState = [...prevState];
                newState[selectedRowIndex] = false;
                return newState;
            });
        } catch (error) {
            console.error('Error updating data:', error);
            toast.error(error.response?.data?.message || 'Error updating facility count', {
                position: toast.POSITION.TOP_RIGHT
            });
        }
    };

    const handleResetClick = async (index) => {
        const userstatus = data[index].status;
        const updatedStatus = data[index].status - 1;

        if (updatedStatus < 0) {
            toast.error("Cannot reset status below 0", {
                position: toast.POSITION.TOP_RIGHT
            });
            return;
        }
        const newItem = { ...data[index], status: updatedStatus };
        const newData = [...data];
        newData[index] = newItem;
        setData(newData);

        try {
            const facilityName = data[index].name;
            const token = getToken();
            const response = await axios.put(`${BackendAPI}/category/resetFacility`, {
                cs_regno: user.cs_regno,
                facilityName: facilityName,
                cs_user_status: userstatus
            }, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            toast.success(response.data.message, {
                position: toast.POSITION.TOP_RIGHT
            });
        } catch (error) {
            console.error('Error resetting facility:', error);
            toast.error(error.response?.data?.message || 'Error resetting facility', {
                position: toast.POSITION.TOP_RIGHT
            });
        }
    };

    const getFormattedFacilityName = (name) => {
        if (name && name.startsWith && name.includes('_')) {
            const [prefix, suffix] = name.split('_');
            const formattedSuffix = suffix.charAt(0).toUpperCase() + suffix.slice(1).replace(/\d+/g, day => ` day ${day}`);
            return `${formattedSuffix}`;
        } else {
            return name || '';
        }
    };

    const handleNavigation = () => {
        navigate(`${process.env.PUBLIC_URL}/onsite/manage-user/Consoft`);
    };

    return (
        <Fragment>
            <Breadcrumbs parentClickHandler={handleNavigation} mainTitle={
                <>
                    Facility Reset
                    <MdInfoOutline
                        id="resetPopover"
                        style={{
                            cursor: 'pointer', position: 'absolute', marginLeft: '5px'
                        }}
                    />
                    <UncontrolledPopover
                        placement="bottom"
                        target="resetPopover"
                        trigger="focus"
                    >
                        <PopoverBody>
                            Based on the facility, the allowed count and taken status of the facilities are displayed.
                            <br />
                            The Taken status count shows how often the facility has been used.
                            <br />
                            Clicking the <strong>Reset</strong> button will decrease the <strong>Taken Count</strong> by 1 and allow the facility to be used again.
                            <br />
                            Use the <strong>Action</strong> button to adjust the allowed count for a specific user for that facility.
                        </PopoverBody>
                    </UncontrolledPopover>
                </>
            } parent="Manage User" title="Facility Reset" />
            <Container fluid={true}>
                <Row>
                    <Col sm="12">
                        <Card>
                            <CardHeader className="d-flex justify-content-between align-items-center flex-column flex-md-row">
                                <div className="mb-2 mb-md-0">
                                    <h5 className="mb-2 text-center">{user.cs_first_name} ({user.cs_regno})</h5>
                                </div>
                            </CardHeader>
                            <CardBody>
                                <div className='table-responsive'>
                                {loading ? (
            <p>Loading...</p>
        ) : data.length === 0 ? ( // Check if data is empty
            <p className="text-center text-muted">Facility access is not generated yet.</p>
        ) : (
                                        <Table>
                                            <thead>
                                                <tr className='border-bottom-primary'>
                                                    <th scope='col' className='text-start'>{'Sr No.'}</th>
                                                    <th scope='col' className='text-center'>{'Facility Name'}</th>
                                                    <th scope='col' className='text-center'>{'Allow Count'}</th>
                                                    <th scope='col' className='text-center'>{'Taken Status'}</th>
                                                    <th scope='col' className='text-center'>{'Datetime Utilization'}</th>
                                                    {CategoryAccesspermissions?.edit === 1 && (
                                                        <th scope='col' className='text-center'>{'Action'}</th>
                                                    )}
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {data.map((page, index) => (
                                                    <tr key={index} className="border-bottom-primary">
                                                        <td className='text-start'>{index + 1}</td>
                                                        <td className='text-center'>{getFormattedFacilityName(page.name)}</td>
                                                        <td className='text-center'>{page.allow_count}</td>
                                                        <td className='text-center'>{page.status}
                                                            <Button color="warning" className='ms-2' size="sm" onClick={() => handleResetClick(index)} disabled={editableRows[index]}>
                                                                Reset
                                                            </Button>
                                                        </td>
                                                        {/* <td className='text-center'>{`${page.cs_datetime}`}</td> */}
                                                        <td className='text-center'>
                                                            {selectedTimezone && page.cs_datetime !== 'N/A' && page.cs_datetime  // Check if timezone and valid datetime is present
                                                                ? moment(page.cs_datetime, 'DD-MM-YYYY HH:mm:ss', true).isValid() // Parse with the correct format
                                                                    ? moment(page.cs_datetime, 'DD-MM-YYYY HH:mm:ss')
                                                                        .tz(selectedTimezone)
                                                                        .format('YYYY-MM-DD HH:mm')  // Format the date and time
                                                                    : 'Invalid Date'  // Display if the date-time format is incorrect
                                                                : page.cs_date !== 'N/A' && page.cs_time !== 'N/A'
                                                                    ? `${page.cs_date} ${page.cs_time}` // If only date and time are present, display them
                                                                    : 'N/A'  // If no valid datetime is present, display 'N/A'
                                                            }
                                                        </td>




                                                        {CategoryAccesspermissions?.edit === 1 && (
                                                            <td className='text-center'>
                                                                <Button color="warning" size="sm" onClick={() => toggleRowEditable(index)} disabled={editableRows[index]}>
                                                                    <FaEdit />
                                                                </Button>



                                                            </td>

                                                        )}
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </Table>
                                    )}
                                </div>
                            </CardBody>
                        </Card>
                    </Col>
                </Row>
            </Container>

            <Modal isOpen={modal} toggle={() => setModal(!modal)} centered size="sm">
                <ModalHeader toggle={() => setModal(!modal)}>Select Allowed Count</ModalHeader>
                <ModalBody>
                    Set allow counts reflecting on user badge data so make sure counts are correct
                    <FormGroup>
                        <Label for="allowedCount">Allowed Count</Label>
                        <Input
                            id="allowedCount"
                            type="number"
                            value={selectedDays}
                            className='text-center'
                            onChange={(e) => setSelectedDays(e.target.value)}
                            min={0}
                        />
                    </FormGroup>
                </ModalBody>
                <ModalFooter>
                    <Button color="primary" onClick={handleModalSave}>Save</Button>
                    <Button color="secondary" onClick={() => setModal(!modal)}>Cancel</Button>
                </ModalFooter>
            </Modal>
        </Fragment>
    );
};

export default UserFacilityReset;
