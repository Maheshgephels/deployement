import React, { Fragment, useEffect, useState, useContext } from 'react';
import { Container, Row, Col, Card, Table, CardHeader, Button, CardBody, Input, Label, Modal, ModalHeader, ModalBody, ModalFooter, PopoverBody, UncontrolledPopover, InputGroup, InputGroupText, Badge } from 'reactstrap';
import { Breadcrumbs } from '../../AbstractElements';
import { Link, useNavigate } from 'react-router-dom';
import { FaEdit, FaTrash, FaEye, FaEyeSlash, FaSortUp, FaSortDown } from 'react-icons/fa'; // Import the eye icons
import { FaPlus } from "react-icons/fa6";
import { FiSearch } from "react-icons/fi";
import { BsThreeDotsVertical, BsThreeDots } from "react-icons/bs";
import { BiSort, BiSortAlt2 } from "react-icons/bi";
import { MdDelete, MdInfoOutline } from "react-icons/md";
import { GoDotFill } from "react-icons/go";
import { TbLogout } from "react-icons/tb";
import CustomizerContext from '../../_helper/Customizer';
import SweetAlert from 'sweetalert2';
import { Tooltip } from 'react-tooltip';
import axios from 'axios';
import { Skeleton } from 'antd';
import { BackendAPI } from '../../api';
import { Pagination, Select } from 'antd';
import { PermissionsContext } from '../../contexts/PermissionsContext';
import useAuth from '../../Auth/protectedAuth';
import { getToken } from '../../Auth/Auth';
import { Button as B, Dropdown as D, Menu } from 'antd';
import moment from 'moment'; // Import moment.js for date formatting

const { Option } = Select;


const AppUser = () => {
    useAuth();
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(0);
    const [pageSize, setPageSize] = useState(10);
    const [totalItems, setTotalItems] = useState(0);
    const [searchText, setSearchText] = useState('');
    const [sortColumn, setSortColumn] = useState(''); // Column to sort by
    const [sortOrder, setSortOrder] = useState('desc'); // Sort order (asc/desc)
    const [showPassword, setShowPassword] = useState({});
    const [itemId, setItemId] = useState(null);
    const [currentStatus, setCurrentStatus] = useState(null);
    const [modal, setModal] = useState(false);
    const [logoutModal, setLogoutModal] = useState(false); // State to control the logout modal
    const [statusModal, setStatusModal] = useState(false);
    const [deleteId, setDeleteId] = useState(null); // State to store the ID of the user to be deleted
    const [logoutUsername, setLogoutUsername] = useState(null); // State to store the username of the user to be logged out
    const { layoutURL } = useContext(CustomizerContext);
    const navigate = useNavigate();
    const { permissions } = useContext(PermissionsContext);
    const AdminTimezone = localStorage.getItem('AdminTimezone');


    useEffect(() => {
        fetchUsers();
    }, [currentPage, pageSize, searchText]);

    // Extract AppUserLoginPermissions component
    const AppUserLoginPermissions = permissions['AppUser'];

    const fetchUsers = async () => {
        try {
            const token = getToken();
            // const response = await axios.get(`${BackendAPI}/login/getappuserlogin?page=${currentPage}&pageSize=${pageSize}&search=${searchText}`, {
            //     headers: {
            //         Authorization: `Bearer ${token}` // Include the token in the Authorization header
            //     }
            // });
            const response = await axios.get(`${BackendAPI}/login/getappuserlogin`, {
                params: {
                    page: currentPage,
                    pageSize: pageSize,
                    search: searchText,
                    sortColumn: sortColumn,
                    sortOrder: sortOrder
                },
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
            setData(response.data.facilities);
            setTotalPages(response.data.totalPages);
            setTotalItems(response.data.totalItems);
            setLoading(false);

            // Initialize showPassword state for each item
            const initialShowPasswordState = response.data.facilities.reduce((acc, item) => {
                acc[item.id] = false;
                return acc;
            }, {});
            setShowPassword(initialShowPasswordState);
        } catch (error) {
            console.error('Error fetching users:', error);
            setLoading(false);
        }
    };

    const handlePageChange = (page, size) => {
        setCurrentPage(page);
        setPageSize(size);
    };

    const handlePageSizeChange = (size) => {
        setPageSize(size);
        setCurrentPage(1); // Reset to first page when changing page size
        // Refetch data with the new page size
        fetchUsers();
    };

    const handleSearch = (value) => {
        setSearchText(value);
        setCurrentPage(1);
    };

    const handleSort = (column) => {
        const order = sortColumn === column && sortOrder === 'asc' ? 'desc' : 'asc';
        setSortColumn(column);
        setSortOrder(order);
        fetchUsers(); // Fetch the data again with the updated sorting
    };


    const getSortIndicator = (column) => {
        if (sortColumn === column) {
            return sortOrder === 'asc' ? (
                <BiSort style={{ marginLeft: '5px', fontSize: '0.8rem', verticalAlign: 'middle', color: 'black' }} />
            ) : (
                <BiSort style={{ marginLeft: '5px', fontSize: '0.8rem', verticalAlign: 'middle', color: 'black' }} />
            );
        }

        return (
            <span style={{ marginLeft: '5px', fontSize: '0.8rem', verticalAlign: 'middle', color: 'gray' }}>
                <BiSort />
                {/* <FaSortDown /> */}
            </span>
        );
    };

    const getSettings = (item) => [
        // Conditionally render the edit option if WorkshopsPermissions?.edit === 1
        ...(AppUserLoginPermissions?.edit === 1
            ? [{
                key: '1',
                label: (
                    <div onClick={() => editLogin(item.id, item.cs_username)}>
                        <FaEdit /> Edit User Login
                    </div>
                ),
            }]
            : []
        ),

        // Conditionally render the delete option if WorkshopsPermissions?.delete === 1
        ...(AppUserLoginPermissions?.delete === 1
            ? [{
                key: '2', // Ensure unique key for each option
                label: (
                    <div onClick={() => openDeleteModal(item.id)}>
                        <MdDelete /> Delete User Login
                    </div>
                )
            }]
            : []
        ),

        ...(AppUserLoginPermissions?.validate === 1 && item.logged_in_device_id !== null && item.logged_in_device_id !== ''
            ? [{
                key: '3',
                label: (
                    <div onClick={() => openLogoutModal(item.cs_username)}>
                        <TbLogout /> Force Logout
                    </div>
                ),
            }]
            : []
        ),
        // Add more options if needed
    ];

    const formatLastLogin = (lastLogin) => {
        if (!lastLogin) return ''; // Handle case when last login is not provided
        const date = new Date(lastLogin);
        const options = {
            year: 'numeric',
            month: 'numeric',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false // Use 24-hour format
        };
        return date.toLocaleString(undefined, options); // Format the date and time
    };

    const toggleShowPassword = (id) => {
        setShowPassword(prevState => ({
            ...prevState,
            [id]: !prevState[id]
        }));
    };

    const handleDelete = async (id) => {
        try {
            // Make an API request to delete the item with the given ID
            const token = getToken();
            await axios.delete(`${BackendAPI}/login/RemoveAppUser/${id}`, {
                headers: {
                    Authorization: `Bearer ${token}` // Include the token in the Authorization header
                }
            });
            // Remove the deleted item from the data array
            setData(prevData => prevData.filter(item => item.id !== id));
            // Update total items count
            setTotalItems(prevTotalItems => prevTotalItems - 1);
            SweetAlert.fire({
                title: 'Success!',
                text: 'User login deleted successfully!',
                icon: 'success',
                timer: 3000,
                showConfirmButton: false,
                allowOutsideClick: false,
                allowEscapeKey: false
            });
        } catch (error) {
            console.error('Error deleting user:', error.message);
        }
    };

    const handleLogout = async (username) => {
        try {
            const token = getToken();
            // Make an API request to logout the user with the given username
            await axios.delete(`${BackendAPI}/login/LogoutUser/${username}`, {
                headers: {
                    Authorization: `Bearer ${token}` // Include the token in the Authorization header
                }
            });

            // Update the data state immediately to reflect the change in the UI
            const updatedLogins = data.map((login) =>
                login.cs_username === username ? { ...login, logged_in_device_id: null } : login
            );
            setData(updatedLogins);

            SweetAlert.fire({
                title: 'Success!',
                text: 'User logged out successfully!',
                icon: 'success',
                timer: 3000,
                showConfirmButton: false,
                allowOutsideClick: false,
                allowEscapeKey: false
            });
        } catch (error) {
            console.error('Error logging out user:', error.message);
        }
    };

    const handleStatusUpdate = async (cs_id, currentStatus) => {
        // Calculate the new status based on the current status
        const newStatus = currentStatus === 0 ? 1 : 0;
        try {
            const token = getToken();
            // Update the status via API call
            await axios.put(`${BackendAPI}/login/UpdateStatus`, { id: cs_id, status: newStatus }, {
                headers: {
                    Authorization: `Bearer ${token}` // Include the token in the Authorization header
                }
            });

            // Update the data state immediately to reflect the change in the UI
            const updatedLogins = data.map((login) =>
                login.id === cs_id ? { ...login, cs_status: newStatus } : login
            );
            setData(updatedLogins);
        } catch (error) {
            console.error('Error updating status:', error);
        }
    };

    const editLogin = (cs_id, cs_username) => {
        console.log(cs_username);
        const URL = '/onsite/edit-app-login/';
        // Pass data as state through route props
        navigate(`${process.env.PUBLIC_URL}${URL}${layoutURL}`, { state: { cs_id, cs_username } });
    };

    const openDeleteModal = (id) => {
        setDeleteId(id);
        setModal(true);
    };

    const confirmDelete = () => {
        if (deleteId !== null) {
            handleDelete(deleteId);
            setDeleteId(null);
            setModal(false);
        }
    };

    const openLogoutModal = (username) => {
        setLogoutUsername(username);
        setLogoutModal(true);
    };

    const confirmLogout = () => {
        if (logoutUsername !== null) {
            handleLogout(logoutUsername);
            setLogoutUsername(null);
            setLogoutModal(false);
        }
    };

    const confirmStatusUpdate = () => {
        // Call the function to update status
        // Pass necessary parameters like item id and current status
        handleStatusUpdate(itemId, currentStatus);
        // Close the status confirmation modal
        setStatusModal(false);
    };

    const handleNavigation = () => {
        navigate(`${process.env.PUBLIC_URL}/onsite/create-app-login/Consoft`);
    };


    return (
        <Fragment>
            <Breadcrumbs mainTitle={
                <>
                    App User Login
                    <MdInfoOutline
                        id="loginPopover"
                        style={{
                            cursor: 'pointer', position: 'absolute', marginLeft: '5px'
                        }}
                    />
                    <UncontrolledPopover
                        placement="bottom"
                        target="loginPopover"
                        trigger="focus"
                    >
                        <PopoverBody>
                            Create and manage Onsite App login details, including app roles, account expiry date,
                            and Spot Registration start number. Admin-set permissions for each app role will be allocated to the user.  <br />
                            App user can login into single device. No mutiple login for single account is allowed. You have to logout from the App or Force logout from Admin to allow login into another device.
                        </PopoverBody>
                    </UncontrolledPopover>
                </>
            } parent="Onsite App" title="App User Login" />
            <Container fluid={true}>
                <Row>
                    <Col sm="12">
                        <Card>
                            {/* <CardHeader className="d-flex justify-content-between align-items-center flex-column flex-md-row">
                                <div className="mb-2 mb-md-0">
                                    <h5 className="mb-2 text-center">App User Logins</h5>
                                    <Input
                                        placeholder="Search all columns"
                                        onChange={(e) => handleSearch(e.target.value)}
                                        style={{ width: 200 }}
                                    />
                                </div>
                                {AppUserLoginPermissions?.add === 1 && (
                                    <div className="mt-2 mt-md-0">
                                        <Button onClick={handleNavigation} color='warning'>
                                    Create User Login
                                  </Button>
                                    </div>
                                )}
                            </CardHeader> */}
                            <CardHeader>
                                <div className='d-flex align-items-center w-100'>
                                    <div className="mb-2 mb-md-0 w-100">
                                        {/* <h5 className="mb-2 text-start">Payment</h5> */}
                                        <InputGroup style={{ width: '100%', maxWidth: '237px', borderRadius: '20px' }}>
                                            <InputGroupText>
                                                <FiSearch />
                                            </InputGroupText>
                                            <Input
                                                placeholder="Search App User Login"
                                                onChange={e => handleSearch(e.target.value)}
                                            // style={{ borderRadius: '20px' }}
                                            />
                                        </InputGroup>
                                    </div>
                                    <div className="text-md-end w-100 mt-2 mt-md-0 text-end text-wrap">
                                        {AppUserLoginPermissions?.add === 1 && (
                                            // <Button onClick={handleNavigation} color='warning'>
                                            //     Create User Login
                                            // </Button>
                                            <>
                                                <Button
                                                    color=""
                                                    className='circular'
                                                    onClick={handleNavigation} data-tooltip-id="create"
                                                >
                                                    <FaPlus
                                                        className='buttonStyle'
                                                    />

                                                </Button>
                                                <Tooltip id="create" place="top" effect="solid">
                                                    Create User Login
                                                </Tooltip>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </CardHeader>
                            <CardBody>
                                <div className='table-responsive'>
                                    {loading ? (
                                        <Skeleton active />
                                    ) : data.length === 0 ? (
                                        <p className='text-center'>No app user login found</p>
                                    ) : (
                                        <Table>
                                            {/* Table Header */}
                                            <thead>
                                                <tr className='border-bottom-primary'>
                                                    <th scope='col'>{'Sr No.'}</th>
                                                    <th scope='col' onClick={() => handleSort('cs_username')}>
                                                        {'Username'}
                                                        {getSortIndicator('cs_username')}
                                                    </th>
                                                    {/* <th scope='col'>{'Username'}</th> */}
                                                    <th scope='col'>{'Password'}</th>
                                                    {/* <th scope='col'>{'Email'}</th> */}
                                                    <th scope='col' onClick={() => handleSort('cs_role_name')}>
                                                        {'Role'}
                                                        {getSortIndicator('cs_role_name')}
                                                    </th>
                                                    {/* <th scope='col'>{'Role'}</th> */}
                                                    <th scope='col'>{'Device Id'}</th>
                                                    <th scope='col' className='text-center' onClick={() => handleSort('cs_login_time')}>
                                                        {'Last Login'}
                                                        {getSortIndicator('cs_login_time')}
                                                    </th>
                                                    {/* <th scope='col' className="text-center">{'Last Login'}</th> */}
                                                    <th scope='col' onClick={() => handleSort('cs_valid_upto')}>
                                                        {'Login Expiry'}
                                                        {getSortIndicator('cs_valid_upto')}
                                                    </th>
                                                    {/* <th scope='col'>{'Login Expiry'}</th> */}
                                                    <th scope='col' onClick={() => handleSort('cs_regno_start')}>
                                                        {'Spot No.'}
                                                        {getSortIndicator('cs_regno_start')}
                                                    </th>
                                                    {/* <th scope='col'>{'Spot No.'}</th> */}
                                                    <th scope='col' onClick={() => handleSort('logged_in_device_id')}>
                                                        {'Login Status'}
                                                        {getSortIndicator('logged_in_device_id')}
                                                    </th>
                                                    {/* <th scope='col'>{'Login Status'}</th> */}
                                                    <th scope='col' onClick={() => handleSort('cs_status')}>
                                                        {'Status'}
                                                        {getSortIndicator('cs_status')}
                                                    </th>
                                                    {/* <th scope='col'>{'Status'}</th> */}
                                                    {(AppUserLoginPermissions?.edit === 1 || AppUserLoginPermissions?.delete === 1 || AppUserLoginPermissions?.validate === 1) && (
                                                        <th scope='col' className="text-center">{'Action'}</th>
                                                    )}
                                                </tr>
                                            </thead>
                                            {/* Table Body */}
                                            <tbody>
                                                {data.map((item, index) => (
                                                    <tr key={index} className="border-bottom-primary">
                                                        <td className='text-start'>{(currentPage - 1) * pageSize + index + 1}</td>
                                                        <td>{item.cs_username}</td>
                                                        <td>
                                                            {showPassword[item.id] ? item.cs_password : '********'}
                                                            <Button color="link" onClick={() => toggleShowPassword(item.id)}>
                                                                {showPassword[item.id] ? <FaEye /> : <FaEyeSlash />}
                                                            </Button>
                                                        </td>
                                                        {/* <td>{item.cs_email}</td> */}
                                                        <td>{item.cs_role_name}</td>
                                                        <td>{item.logged_in_device_id}</td>
                                                        {/* <td className="text-center">{item.cs_login_time}</td> */}
                                                        <td className='text-center'>
                                                            {AdminTimezone && item.cs_login_time
                                                                ? moment(item.cs_login_time).tz(AdminTimezone).format('YYYY-MM-DD HH:mm:ss')
                                                                : new Date(item.cs_login_time).toLocaleDateString('en-US')}
                                                        </td>
                                                        <td>{item.cs_valid_upto}</td>
                                                        <td>{item.cs_regno_start}</td>
                                                        {/* <td className="text-center">
                                                            {item.logged_in_device_id !== null && item.logged_in_device_id !== '' ? (
                                                                <Label className="text-success">Log In</Label>
                                                            ) : (
                                                                <Label className="text-danger">Log Out</Label>
                                                            )}
                                                        </td> */}
                                                        <td className="text-center">
                                                            {item.logged_in_device_id !== null && item.logged_in_device_id !== '' ? (
                                                                <Badge color="success">
                                                                    Login
                                                                </Badge>
                                                            ) : (
                                                                <Badge color="danger">
                                                                    Logout
                                                                </Badge>
                                                            )}
                                                        </td>
                                                        <td className='text-center'>
                                                            <Tooltip id="tooltip" globalEventOff="click" />

                                                            {item.cs_status == 0 ? (
                                                                <span style={{ color: 'red', fontSize: '20px', cursor: "pointer" }}
                                                                    onClick={() => {
                                                                        // Set itemId and currentStatus to be used in confirmStatusUpdate
                                                                        setItemId(item.id);
                                                                        setCurrentStatus(item.cs_status);
                                                                        setLogoutUsername(item.cs_username);
                                                                        // Open the status confirmation modal
                                                                        setStatusModal(true);
                                                                    }}
                                                                    data-tooltip-id="tooltip"
                                                                    data-tooltip-content="Inactive status"
                                                                    data-tooltip-event="click focus">
                                                                    <GoDotFill />
                                                                </span>
                                                            ) : (
                                                                <span style={{ color: 'green', fontSize: '20px', cursor: "pointer" }}
                                                                    onClick={() => {
                                                                        // Set itemId and currentStatus to be used in confirmStatusUpdate
                                                                        setItemId(item.id);
                                                                        setCurrentStatus(item.cs_status);
                                                                        setLogoutUsername(item.cs_username);
                                                                        // Open the status confirmation modal
                                                                        setStatusModal(true);
                                                                    }}
                                                                    data-tooltip-id="tooltip"
                                                                    data-tooltip-content="Active status"
                                                                    data-tooltip-event="click focus">
                                                                    <GoDotFill />
                                                                </span>
                                                            )}
                                                        </td>
                                                        {(AppUserLoginPermissions?.edit === 1 || AppUserLoginPermissions?.delete === 1 || AppUserLoginPermissions?.validate === 1) && (
                                                            <td>
                                                                {/* {AppUserLoginPermissions?.delete === 1 && (
                                                                    <>
                                                                        <Button
                                                                            color="primary"
                                                                            size="sm"
                                                                            onClick={() => editLogin(item.id, item.cs_username)}
                                                                            data-tooltip-id="tooltip"
                                                                            data-tooltip-content="Edit User Login"
                                                                            data-tooltip-event="click focus"
                                                                        >
                                                                            <FaEdit />
                                                                        </Button>
                                                                        <Button
                                                                            color="danger"
                                                                            size="sm"
                                                                            onClick={() => openDeleteModal(item.id)}
                                                                            data-tooltip-id="tooltip"
                                                                            data-tooltip-content="Delete User Login"
                                                                            data-tooltip-event="click focus"
                                                                        >
                                                                            <FaTrash />
                                                                        </Button>
                                                                    </>
                                                                )}
                                                                {item.logged_in_device_id !== null && item.logged_in_device_id !== '' && (
                                                                    AppUserLoginPermissions?.validate === 1 && (
                                                                        <Button
                                                                            color="warning"
                                                                            size="sm"
                                                                            onClick={() => openLogoutModal(item.cs_username)}
                                                                            data-tooltip-id="tooltip"
                                                                            data-tooltip-content="Force Logout"
                                                                            data-tooltip-event="click focus"
                                                                        >
                                                                            <TbLogout />
                                                                        </Button>
                                                                    )
                                                                )} */}

                                                                <D
                                                                    menu={{ items: getSettings(item) }} // Pass user to getSettings
                                                                    placement="bottomLeft"
                                                                    arrow
                                                                    trigger={['click']}
                                                                >
                                                                    <Button color='' size="lg" className='circular'
                                                                    >
                                                                        <BsThreeDotsVertical />
                                                                    </Button>
                                                                </D>
                                                            </td>
                                                        )}

                                                    </tr>

                                                ))}
                                            </tbody>
                                        </Table>
                                    )}
                                </div>
                                {totalItems > 10 && (
                                    <div className="d-flex justify-content-center align-items-center mt-3">
                                        <Pagination
                                            onChange={handlePageChange}
                                            current={currentPage}
                                            pageSize={pageSize}
                                            total={totalItems}
                                            showSizeChanger={true}
                                            showQuickJumper={true}
                                        />
                                    </div>
                                )}
                            </CardBody>
                        </Card>
                    </Col>

                </Row>
            </Container>

            {/* Delete Confirmation Modal */}
            <Modal isOpen={modal} toggle={() => setModal(!modal)} centered size="md">
                <ModalHeader toggle={() => setModal(!modal)}>Confirmation</ModalHeader>
                <ModalBody>
                    <div className='ms-2'>
                        <p>Are you sure you want to delete <strong>{logoutUsername}</strong> user login?</p>
                    </div>
                </ModalBody>
                <ModalFooter>
                    <Button color="primary" onClick={confirmDelete}>Yes</Button>
                    <Button color="warning" onClick={() => setModal(!modal)}>No</Button>
                </ModalFooter>
            </Modal>

            {/* Logout Confirmation Modal */}
            <Modal isOpen={logoutModal} toggle={() => setLogoutModal(!logoutModal)} centered size="md">
                <ModalHeader toggle={() => setLogoutModal(!logoutModal)}>Confirmation</ModalHeader>
                <ModalBody>
                    <div className='ms-2'>
                        <p>Are you sure you want to log out this <strong>{logoutUsername}</strong> user login?</p>
                    </div>
                </ModalBody>
                <ModalFooter>
                    <Button color="primary" onClick={confirmLogout}>Yes</Button>
                    <Button color="warning" onClick={() => setLogoutModal(!logoutModal)}>No</Button>
                </ModalFooter>
            </Modal>

            {/* Status Confirmation Modal */}
            <Modal isOpen={statusModal} toggle={() => setStatusModal(!statusModal)} centered size="md">
                <ModalHeader toggle={() => setStatusModal(!statusModal)}>Confirmation</ModalHeader>
                <ModalBody>
                    <div className='ms-2'>
                        <p>Are you sure you want to change the status of <strong>{logoutUsername}</strong> to {currentStatus === 0 ? "Active" : "Inactive"}?</p>
                    </div>
                </ModalBody>
                <ModalFooter>
                    <Button color="primary" onClick={confirmStatusUpdate}>Yes</Button>
                    <Button color="warning" onClick={() => setStatusModal(!statusModal)}>No</Button>
                </ModalFooter>
            </Modal>

        </Fragment>
    );
};

export default AppUser;
