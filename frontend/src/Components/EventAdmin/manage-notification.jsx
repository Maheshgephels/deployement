import React, { Fragment, useEffect, useState, useContext } from 'react';
import { Container, Row, Col, Card, Table, CardHeader, CardBody, Input, Button, Modal, ModalHeader, ModalFooter, ModalBody, PopoverBody, UncontrolledPopover, InputGroup, InputGroupText } from 'reactstrap';
import { Breadcrumbs } from '../../AbstractElements';
import axios from 'axios';
import { BackendAPI } from '../../api';
import SweetAlert from 'sweetalert2';
import { Link, useNavigate } from 'react-router-dom';
import { GoDotFill } from "react-icons/go";
import { FaEdit, FaAngleUp, FaAngleDown, FaCode, FaSortUp, FaSortDown, FaMapMarkedAlt } from 'react-icons/fa';
import { FaPlus, FaMapLocationDot } from "react-icons/fa6";
import { FiSearch } from "react-icons/fi";
import { BsThreeDotsVertical, BsThreeDots } from "react-icons/bs";
import { BiSort, BiSortAlt2 } from "react-icons/bi";
import { MdDelete, MdInfoOutline, MdReorder } from "react-icons/md";
import { Pagination } from 'antd';
import CustomizerContext from '../../_helper/Customizer';
import { Tooltip } from 'react-tooltip';
import { classes } from '../../Data/Layouts';
import { PermissionsContext } from '../../contexts/PermissionsContext';
import { getToken } from '../../Auth/Auth';
import useAuth from '../../Auth/protectedAuth';
import Swal from 'sweetalert2';
import { Button as B, Dropdown as D, Menu } from 'antd';
import { MdRefresh } from 'react-icons/md';
import moment from 'moment-timezone';


const Notification = () => {
    useAuth();
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalItems, setTotalItems] = useState(0);
    const [pageSize, setPageSize] = useState(10);
    const [searchText, setSearchText] = useState('');
    const [sortColumn, setSortColumn] = useState(''); // Column to sort by
    const [sortOrder, setSortOrder] = useState('desc'); // Sort order (asc/desc)
    const [catIds, setCatIds] = useState([]);
    const { layoutURL } = useContext(CustomizerContext);
    const [modal, setModal] = useState(false);
    const [resend, setResend] = useState(false);
    const [statusModalOpen, setStatusModalOpen] = useState(false); // New state for modal visibility
    const [NotificationIdToUpdate, setNotificationIdToUpdate] = useState(null); // Notification ID to update status
    const [NotificationName, setNotificationName] = useState(null);
    const [currentStatus, setCurrentStatus] = useState(null);
    const [deleteNotificationDetails, setDeleteNotificationDetails] = useState({ NotificationId: null, facilityId: null }); // New state for delete Notification details
    const navigate = useNavigate();
    const { permissions } = useContext(PermissionsContext);
    const AdminTimezone = localStorage.getItem('AdminTimezone');




    useEffect(() => {
        fetchNotification();
    }, [currentPage, pageSize, searchText, permissions]);

    // Extract Notifications component
    const NotificationsPermissions = permissions['Notification'];

    const fetchNotification = async () => {
        try {
            const token = getToken();
            // const Response = await axios.get(`${BackendAPI}/notification/getNotification?page=${currentPage}&pageSize=${pageSize}&search=${searchText}`, {
            //     headers: {
            //         Authorization: `Bearer ${token}` // Include the token in the Authorization header
            //     }
            // });
            const Response = await axios.get(`${BackendAPI}/notification/getNotification`, {
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
            console.log("Notification data", Response.data);
            setData(Response.data.categories);
            setTotalItems(Response.data.totalItems);
            setCatIds(catIds);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching data:', error);
            setLoading(false);
        }
    };

    const handlePageChange = (page, size) => {
        setCurrentPage(page);
        setPageSize(size);
    };

    const handleSearch = (value) => {
        setSearchText(value);
    };

    const handleSort = (column) => {
        const order = sortColumn === column && sortOrder === 'asc' ? 'desc' : 'asc';
        setSortColumn(column);
        setSortOrder(order);
        fetchNotification(); // Fetch the data again with the updated sorting
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

        ...(NotificationsPermissions?.edit === 1
            ? [{
                key: '1',
                label: (
                    <div onClick={() => handleEdit(item.not_id, item.heading)}>
                        <FaEdit /> Edit Details
                    </div>
                ),
            }]
            : []
        ),

        ...(NotificationsPermissions?.delete === 1
            ? [{
                key: '2',
                label: (
                    <div onClick={() => openDeleteModal(item.not_id, item.heading)}>
                        <MdDelete /> Delete Notification
                    </div>
                ),
            }]
            : []
        ),

        ...(NotificationsPermissions?.add === 1
            ? [{
                key: '3',
                label: (
                    <div onClick={() => resendModal(item.not_id, item.heading)}>
                        <MdRefresh /> Resend Notification
                    </div>
                ),
            }]
            : []
        ),
        // Add more options if needed
    ];


    const handleEdit = (NotificationId, Notificationname) => {
        const URL = '/event/edit-notification/';
        navigate(`${process.env.PUBLIC_URL}${URL}${layoutURL}`, { state: { NotificationId, Notificationname } });
    };

    const handleDelete = async () => {
        try {
            const { NotificationId } = deleteNotificationDetails;
            const token = getToken();
            await axios.delete(`${BackendAPI}/Notification/deleteNotification`, {
                headers: {
                    Authorization: `Bearer ${token}` // Include the token in the Authorization header
                },
                data: { NotificationId } // Include the data payload correctly
            });
            SweetAlert.fire({
                title: 'Success!',
                text: 'Notification removed successfully!',
                icon: 'success',
                timer: 3000,
                showConfirmButton: false,
                allowOutsideClick: false,
                allowEscapeKey: false
            }).then((result) => {
                if (result.dismiss === SweetAlert.DismissReason.timer) {
                    navigate(`${process.env.PUBLIC_URL}/event/manage-notification/Consoft`);
                }
            });
            fetchNotification(); // Fetch updated Notification list
        } catch (error) {
            console.error('Error deleting Notification:', error);
        }
        setModal(false); // Close modal after deletion
    };


    const openStatusModal = (NotificationId, NotificationName, currentStatus) => {
        setNotificationIdToUpdate(NotificationId);
        setNotificationName(NotificationName);
        setCurrentStatus(currentStatus);
        setStatusModalOpen(true);
    };


    const closeStatusModal = () => {
        setStatusModalOpen(false);
    };

    const handleStatusUpdate = async () => {
        const NotificationId = NotificationIdToUpdate;
        const currentNotification = data.find(Notification => Notification.not_id === NotificationId);
        if (!currentNotification) return;
        const currentStatus = currentNotification.status;
        const newStatus = currentStatus === 0 ? 1 : 0;
        try {
            const token = getToken();
            await axios.put(`${BackendAPI}/Notification/UpdateStatus`, { NotificationId, status: newStatus }, {
                headers: {
                    Authorization: `Bearer ${token}` // Include the token in the Authorization header
                }
            });
            const updatedNotifications = data.map((Notification) =>
                Notification.not_id === NotificationId ? { ...Notification, status: newStatus } : Notification
            );
            setData(updatedNotifications);
        } catch (error) {
            console.error('Error updating status:', error);
        }
        closeStatusModal(); // Close modal after status update
    };

    const openDeleteModal = (NotificationId, NotificationName) => {
        setDeleteNotificationDetails({ NotificationId });
        setNotificationName(NotificationName);
        setModal(true);
    };

    const resendModal = (NotificationId, NotificationName) => {
        setNotificationIdToUpdate(NotificationId);
        setNotificationName(NotificationName);
        setResend(true);
    }

    const closeDeleteModal = () => {
        setModal(false);
    };

    const resentModal = () => {
        setResend(false);
    };

    const handleNavigation = () => {
        navigate(`${process.env.PUBLIC_URL}/event/add-Notification/Consoft`);
    };

    const handleResend = async () => {
        const NotificationId = NotificationIdToUpdate;
        try {
            const token = getToken();
            const response = await axios.post(`${BackendAPI}/Notification/resend-notification`, { not_id: NotificationId }, {
                headers: {
                    Authorization: `Bearer ${token}` // Include the token in the Authorization header
                }
            });

            if (response.status === 200) {
                // Assume newStatus and newDate are retrieved from response data or other logic
                const newDate = response.data.newDate; // Replace with the actual data structure

                const updatedNotifications = data.map((Notification) =>
                    Notification.not_id === NotificationId ? { ...Notification, not_date: newDate } : Notification
                );
                setData(updatedNotifications);

                Swal.fire({
                    icon: 'success',
                    title: 'Notification Resent',
                    text: 'The notification was successfully resent.',
                    timer: 3000,
                    showConfirmButton: false,
                    allowOutsideClick: false,
                    allowEscapeKey: false
                });
                fetchNotification();
                resentModal();
            } else {
                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: 'Failed to resend the notification.',
                });
            }
        } catch (error) {
            console.error('Error resending the notification:', error);
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'An error occurred while trying to resend the notification.',
            });
        }
    };




    return (
        <Fragment>
            <Breadcrumbs mainTitle={
                <>
                    Manage Notification
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
                            From here, you can send notifications to users of the event app. <br />
                            You can also manage each notification's status as <span className="text-success">Active</span> or <span className="text-danger">Inactive</span>, edit them, or resend them as needed.
                        </PopoverBody>
                    </UncontrolledPopover>
                </>
            } parent="Event App Admin" title="Manage Notification" />
            <Container fluid={true}>
                <Row>
                    <Col sm="12">
                        <Card>
                            {/* <CardHeader className="d-flex justify-content-between align-items-center flex-column flex-md-row">
                                <div className="mb-2 mb-md-0">
                                    <h5 className="mb-2 text-start">Notifications</h5>
                                    <Input
                                        placeholder="Search Notification"
                                        onChange={e => handleSearch(e.target.value)}
                                        style={{ width: 200 }}
                                    />
                                </div>
                                {NotificationsPermissions?.add === 1 && (
                                    <button onClick={handleNavigation} className="btn btn-warning">
                                        Create Notification
                                    </button>
                                )}
                            </CardHeader> */}
                            <CardHeader>
                                <div className='d-flex align-items-center w-100'>
                                    <div className="mb-2 mb-md-0 w-100">
                                        {/* <h5 className="mb-2 text-start">Payment</h5> */}
                                        <InputGroup style={{ width: '100%', maxWidth: '210px', borderRadius: '20px' }}>
                                            <InputGroupText>
                                                <FiSearch />
                                            </InputGroupText>
                                            <Input
                                                placeholder="Search Notification"
                                                onChange={e => handleSearch(e.target.value)}
                                            // style={{ borderRadius: '20px' }}
                                            />
                                        </InputGroup>
                                    </div>
                                    <div className="text-md-end w-100 mt-2 mt-md-0 text-end text-wrap">
                                        {NotificationsPermissions?.add === 1 && (
                                            // <Button onClick={handleNavigation} color='warning'>
                                            //     Send Notification
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
                                                    Create Notification
                                                </Tooltip>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </CardHeader>
                            <CardBody>
                                <div className='table-responsive'>
                                    {loading ? (
                                        <p>Loading...</p>
                                    ) : data.length === 0 ? (
                                        <p className='text-center'>No notification found</p>
                                    ) : (
                                        <Table>
                                            <thead>
                                                <tr className='border-bottom-primary'>
                                                    <th scope='col' className='text-start'>{'Sr No.'}</th>
                                                    <th scope='col' className='text-start' onClick={() => handleSort('heading')}>
                                                        {'Notification Heading'}
                                                        {getSortIndicator('heading')}
                                                    </th>
                                                    {/* <th scope='col' className='text-start'>{'Notification Heading'}</th> */}
                                                    <th scope='col' className='text-start' onClick={() => handleSort('not_date')}>
                                                        {'Notification Date and time'}
                                                        {getSortIndicator('not_date')}
                                                    </th>
                                                    {/* <th scope='col' className='text-start'>{'Notification Date and time'}</th> */}
                                                    <th scope='col' className='text-start' onClick={() => handleSort('posted_by')}>
                                                        {'Posted by'}
                                                        {getSortIndicator('posted_by')}
                                                    </th>
                                                    {/* <th scope='col' className='text-start'>{'Posted by'}</th> */}
                                                    <th scope='col' className='text-center' onClick={() => handleSort('status')}>
                                                        {'Status'}
                                                        {getSortIndicator('status')}
                                                    </th>
                                                    {/* <th scope='col' className='text-center'>{'Status'}</th> */}
                                                    {NotificationsPermissions?.edit === 1 || NotificationsPermissions?.delete === 1 ? (
                                                        <th scope='col' className='text-end'>Action</th>
                                                    ) : null}
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {data.map((item, index) => (
                                                    <tr key={index} className="border-bottom-primary">
                                                        <td className='text-start'>{(currentPage - 1) * pageSize + index + 1}</td>
                                                        <td className='text-start'>{item.heading}</td>
                                                        {/* <td className='text-start'>{new Date(item.not_date).toLocaleString()}</td> */}
                                                        <td className='text-start'>
                                                            {AdminTimezone && item.not_date
                                                                ? moment(item.not_date).tz(AdminTimezone).format('MM/DD/YYYY, hh:mm:ss A') // Custom format
                                                                : new Date(item.not_date).toLocaleString('en-US')}
                                                        </td>

                                                        <td className='text-start'>{item.posted_by}</td>
                                                        <td className='text-center'>
                                                            {item.status === 0 ? (
                                                                <span style={{ color: 'red', fontSize: '20px', cursor: "pointer" }}
                                                                    onClick={() => openStatusModal(item.not_id, item.heading, item.status)}
                                                                    data-tooltip-id="tooltip"
                                                                    data-tooltip-content="Inactive status"
                                                                    data-tooltip-event="click focus">
                                                                    <GoDotFill />
                                                                </span>
                                                            ) : (
                                                                <span
                                                                    style={{ color: 'green', fontSize: '20px', cursor: "pointer" }}
                                                                    onClick={() => openStatusModal(item.not_id, item.heading, item.status)}
                                                                    data-tooltip-id="tooltip"
                                                                    data-tooltip-content="Active status"
                                                                    data-tooltip-event="click focus">
                                                                    <GoDotFill />
                                                                </span>
                                                            )}
                                                            <Tooltip id="tooltip" globalEventOff="click" />
                                                        </td>
                                                        {NotificationsPermissions?.edit === 1 || NotificationsPermissions?.delete === 1 ? (
                                                            <td className='text-end'>
                                                                <Tooltip id="tooltip" globalEventOff="click" />
                                                                {/* {NotificationsPermissions?.edit === 1 && (
                                                                    <Button color="primary" size="sm" onClick={() => handleEdit(item.not_id, item.heading)}
                                                                        data-tooltip-id="tooltip"
                                                                        data-tooltip-content="Edit Details"
                                                                        data-tooltip-event="click focus" >
                                                                        <FaEdit />
                                                                    </Button>
                                                                )}
                                                                {NotificationsPermissions?.delete === 1 && (
                                                                    <Button color="danger" size="sm" onClick={() => openDeleteModal(item.not_id, item.heading)}
                                                                        data-tooltip-id="tooltip"
                                                                        data-tooltip-content="Delete Notification"
                                                                        data-tooltip-event="click focus" >
                                                                        <MdDelete />
                                                                    </Button>
                                                                )}

                                                                {NotificationsPermissions?.add === 1 && (
                                                                    <Button color="warning" size="sm" onClick={() => resendModal(item.not_id, item.heading)}
                                                                        data-tooltip-id="tooltip"
                                                                        data-tooltip-content="Resend Notification"
                                                                        data-tooltip-event="click focus">
                                                                        <MdRefresh />
                                                                    </Button>
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
                                                        ) : null}
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

            <Modal isOpen={statusModalOpen} toggle={closeStatusModal} allowOutsideClick='false' centered size="md">
                <ModalHeader toggle={closeStatusModal}>Confirmation</ModalHeader>
                <ModalBody>
                    <div className='ms-2'>
                        <p>Are you sure you want to change the status of <strong>{NotificationName}</strong> to {currentStatus === 0 ? "Active" : "Inactive"}?</p>
                    </div>
                </ModalBody>
                <ModalFooter>
                    <Button color="primary" onClick={handleStatusUpdate}>Yes</Button>
                    <Button color="warning" onClick={closeStatusModal}>No</Button>
                </ModalFooter>
            </Modal>

            {/* Delete Confirmation Modal */}
            <Modal isOpen={modal} toggle={closeDeleteModal} centered size="md">
                <ModalHeader toggle={closeDeleteModal}>Confirmation</ModalHeader>
                <ModalBody>
                    <div className='ms-2'>
                        <p>Are you sure you want to delete <strong>{NotificationName}</strong> Notification?</p>
                    </div>
                </ModalBody>
                <ModalFooter>
                    <Button color="primary" onClick={handleDelete}>Yes</Button>
                    <Button color="warning" onClick={closeDeleteModal}>No</Button>
                </ModalFooter>
            </Modal>


            {/* Resend Confirmation Modal */}
            <Modal isOpen={resend} toggle={resentModal} centered size="md">
                <ModalHeader toggle={resentModal}>Confirmation</ModalHeader>
                <ModalBody>
                    <div className='ms-2'>
                        <p>Are you sure you want to resent Notification?</p>
                        <p>This notification will display in the event app after clicking on the Notification icon at the top.
                        </p>
                    </div>
                </ModalBody>
                <ModalFooter>
                    <Button color="primary" onClick={handleResend}>Yes</Button>
                    <Button color="warning" onClick={resentModal}>No</Button>
                </ModalFooter>
            </Modal>
        </Fragment>
    );
};

export default Notification;
