import React, { Fragment, useEffect, useState, useContext } from 'react';
import { Container, Row, Col, Card, Table, CardHeader, CardBody, Input, Button, Modal, ModalHeader, ModalFooter, ModalBody, PopoverBody, UncontrolledPopover, InputGroup, InputGroupText } from 'reactstrap';
import { Breadcrumbs } from '../../AbstractElements';
import axios from 'axios';
import { BackendAPI } from '../../api';
import { BackendPath } from '../../api';
import SweetAlert from 'sweetalert2';
import { Link, useNavigate } from 'react-router-dom';
import { GoDotFill } from "react-icons/go";
import { FaEdit, FaAngleUp, FaAngleDown, FaCode, FaSortUp, FaSortDown, FaReceipt } from 'react-icons/fa';
import { FiSearch } from "react-icons/fi";
import { BsThreeDotsVertical, BsThreeDots } from "react-icons/bs";
import { BiSort, BiSortAlt2 } from "react-icons/bi";
import { MdDelete, MdInfoOutline } from "react-icons/md";
import { Pagination } from 'antd';
import CustomizerContext from '../../_helper/Customizer';
import { Tooltip } from 'react-tooltip';
import { classes } from '../../Data/Layouts';
import { ToastContainer, toast } from "react-toastify";
import { PermissionsContext } from '../../contexts/PermissionsContext';
import { getToken } from '../../Auth/Auth';
import useAuth from '../../Auth/protectedAuth';
import moment from 'moment-timezone';
import { Button as B, Dropdown as D, Menu } from 'antd';


const ManagePayment = () => {
    useAuth();
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [order, setOrder] = useState(false);
    const [shapeValidationMessage, setShapeValidationMessage] = useState('');
    const [hallValidationMessage, setHallValidationMessage] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [totalItems, setTotalItems] = useState(0);
    const [pageSize, setPageSize] = useState(10);
    const [searchText, setSearchText] = useState('');
    const [sortColumn, setSortColumn] = useState(''); // Column to sort by
    const [sortOrder, setSortOrder] = useState('asc'); // Sort order (asc/desc)
    const [catIds, setCatIds] = useState([]);
    const { layoutURL } = useContext(CustomizerContext);
    const [modal, setModal] = useState(false);
    const [modalOpen, setModalOpen] = useState(false);
    const [statusModalOpen, setStatusModalOpen] = useState(false); // New state for modal visibility
    const [PageIdToUpdate, setPageIdToUpdate] = useState(null); // Workshop ID to update status
    const [exhName, setexhName] = useState(null);
    const [currentStatus, setCurrentStatus] = useState(null);
    const [deleteWorkshopDetails, setDeleteWorkshopDetails] = useState({ workshopId: null, facilityId: null }); // New state for delete workshop details
    const navigate = useNavigate();
    const { permissions } = useContext(PermissionsContext);
    const AdminTimezone = localStorage.getItem('AdminTimezone');




    useEffect(() => {
        fetchPayments();
    }, [currentPage, pageSize, searchText, permissions]);

    const ManagePaymentPermissions = permissions['ManagePayment'];

    const fetchPayments = async () => {
        try {
            const token = getToken();
            const Response = await axios.get(`${BackendAPI}/paymentRoutes/getPaymentData`, {
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
            console.log("data", Response.data);

            // Update to use Response.data.data instead of categories
            if (Array.isArray(Response.data.data)) {
                setData(Response.data.data);  // Updated to set data
            } else {
                setData([]);  // Default to empty array if data is not valid
            }
            setTotalItems(Response.data.totalItems || 0);  // Handle totalItems
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
        setCurrentPage(1);

    };

    const handleSort = (column) => {
        const order = sortColumn === column && sortOrder === 'asc' ? 'desc' : 'asc';
        setSortColumn(column);
        setSortOrder(order);
        fetchPayments(); // Fetch the data again with the updated sorting
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

    const getSettings = (item) => {
        // Get all payments for the same user_id
        const relatedPayments = data.filter(payment => payment.user_id === item.user_id);

        return [
            {
                key: '1',
                label: (
                    <div onClick={() => handleEdit(item)}>
                        <FaEdit /> View & Add payment
                    </div>
                ),
            },
            {
                key: '2',
                label: (
                    <div onClick={() => generateReceipt(item)}>
                        <FaReceipt /> Generate Payment Receipt
                    </div>
                ),
            },
            {
                key: '3',
                label: (
                    <div onClick={() => openDeleteModal(item.payment_id, item.cs_first_name)}>
                        <MdDelete /> Delete Payment
                    </div>
                ),
            },
            // Add more options if needed
        ];
    };

    const handleEdit = async (item) => {
        const URL = '/registration/add-payment/';
        navigate(`${process.env.PUBLIC_URL}${URL}${layoutURL}`, { state: { item } });
    };

    const generateReceipt = async (item) => {
        const URL = '/registration/payment-receipt/';
        navigate(`${process.env.PUBLIC_URL}${URL}${layoutURL}`, { state: { item } });
    };

    const handleDelete = async () => {
        try {
            const { exhId, exhName } = deleteWorkshopDetails;
            const token = getToken();
            await axios.delete(`${BackendAPI}/paymentRoutes/deletePayment`, {
                headers: {
                    Authorization: `Bearer ${token}` // Include the token in the Authorization header
                },
                data: { exhId, exhName } // Include the data payload correctly
            });
            SweetAlert.fire({
                title: 'Success!',
                text: 'Payment removed successfully!',
                icon: 'success',
                timer: 3000,
                showConfirmButton: false,
                allowOutsideClick: false,
                allowEscapeKey: false
            }).then((result) => {
                if (result.dismiss === SweetAlert.DismissReason.timer) {
                    navigate(`${process.env.PUBLIC_URL}/registration/manage-payment/Consoft`);
                }
            });
            fetchPayments();
        } catch (error) {
            console.error('Error deleting workshop:', error);
        }
        setModal(false); // Close modal after deletion
    };


    const openStatusModal = (paymentId, currentStatus) => {
        setPageIdToUpdate(paymentId);
        setCurrentStatus(currentStatus);
        setexhName(exhName);
        setStatusModalOpen(true);
    };


    const closeStatusModal = () => {
        setStatusModalOpen(false);
    };

    const handleStatusUpdate = async () => {
        const paymentId = PageIdToUpdate;
        const currentPage = data.find(page => page.payment_id === paymentId);
        if (!currentPage) return;
        const currentStatus = currentPage.status;
        const newStatus = currentStatus === 0 ? 1 : 0;
        try {
            const token = getToken();
            await axios.put(`${BackendAPI}/paymentRoutes/UpdateStatus`, { paymentId, status: newStatus }, {
                headers: {
                    Authorization: `Bearer ${token}` // Include the token in the Authorization header
                }
            });
            const updatedPage = data.map((page) =>
                page.payment_id === paymentId ? { ...page, status: newStatus } : page
            );
            setData(updatedPage);
        } catch (error) {
            console.error('Error updating status:', error);
        }
        closeStatusModal(); // Close modal after status update
    };

    const openDeleteModal = (exhId, exhName) => {
        setDeleteWorkshopDetails({ exhId, exhName });
        setexhName(exhName);
        setModal(true);
    };

    const closeDeleteModal = () => {
        setModal(false);
    };

    const handleNavigation = () => {
        navigate(`${process.env.PUBLIC_URL}/registration/add-payment/Consoft`);
    };




    return (
        <Fragment>
            <Breadcrumbs mainTitle={
                <>
                    Manage Payments
                    <MdInfoOutline
                        id="exhibitorPopover"
                        style={{
                            cursor: 'pointer', position: 'absolute', marginLeft: '5px'
                        }}
                    />
                    <UncontrolledPopover
                        placement="bottom"
                        target="exhibitorPopover"
                        trigger="focus"
                    >
                        <PopoverBody>
                            From here, you can add profiles for organizers exhibiting at your event, including their images, descriptions, contact details and more. <br />
                            You can also manage the order of the exhibitor listings, and the exhibitors will appear in the same order in the Event App.
                        </PopoverBody>
                    </UncontrolledPopover>
                </>
            } parent="Registration Admin" title=" Manage Payments" />
            <Container fluid={true}>
                <Row>
                    <Col sm="12">
                        <Card>
                            <CardHeader>
                                <div className='d-flex align-items-center w-100'>
                                    <div className="mb-2 mb-md-0 w-100">
                                        {/* <h5 className="mb-2 text-start">Payment</h5> */}
                                        <InputGroup style={{ width: '100%', maxWidth: '200px', borderRadius: '20px' }}>
                                            <InputGroupText>
                                                <FiSearch />
                                            </InputGroupText>
                                            <Input
                                                placeholder="Search Payment"
                                                onChange={e => handleSearch(e.target.value)}
                                            // style={{ borderRadius: '20px' }}
                                            />
                                        </InputGroup>
                                    </div>
                                    {/* <div className="text-md-end w-100 mt-2 mt-md-0 text-end text-wrap">
                                        {ManagePaymentPermissions?.add === 1 && (
                                            <Button onClick={handleNavigation} color='warning'>
                                                Create Payment
                                            </Button>
                                        )}
                                    </div> */}
                                </div>
                            </CardHeader>
                            <CardBody>
                                <div className='table-responsive'>
                                    {loading ? (
                                        <p>Loading...</p>
                                    ) : data.length === 0 ? (
                                        <p className='text-center'>No payment found</p>
                                    ) : (
                                        <Table>
                                            <thead>
                                                <tr className='border-bottom-primary'>
                                                    <th scope='col' className='text-center'>Sr No.</th>
                                                    <th scope='col' className='text-center' onClick={() => handleSort('cs_regno')}>
                                                        {'Reg No'}
                                                        {getSortIndicator('cs_regno')}
                                                    </th>
                                                    <th scope='col' className='text-center' onClick={() => handleSort('cs_first_name')}>
                                                        {'Name'}
                                                        {getSortIndicator('cs_first_name')}
                                                    </th>
                                                    {/* <th scope='col' className='text-center'>Exhibitor Name</th> */}
                                                    <th scope='col' className='text-center' onClick={() => handleSort('payment_mode')}>
                                                        {'Payment Mode'}
                                                        {getSortIndicator('payment_mode')}
                                                    </th>
                                                    {/* <th scope='col' className='text-center'>Exhibitor Email</th> */}
                                                    <th scope='col' className='text-center' onClick={() => handleSort('bank')}>
                                                        {'Bank'}
                                                        {getSortIndicator('bank')}
                                                    </th>
                                                    <th scope='col' className='text-center' onClick={() => handleSort('branch')}>
                                                        {'Brank'}
                                                        {getSortIndicator('branch')}
                                                    </th>
                                                    <th scope='col' className='text-center' onClick={() => handleSort('tracking_id')}>
                                                        {'Tracking Id'}
                                                        {getSortIndicator('tracking_id')}
                                                    </th>
                                                    <th scope='col' className='text-center' onClick={() => handleSort('current_paid_amount')}>
                                                        {'Paid Amount'}
                                                        {getSortIndicator('current_paid_amount')}
                                                    </th>
                                                    <th scope='col' className='text-center' onClick={() => handleSort('payment_date')}>
                                                        {'Payment Date'}
                                                        {getSortIndicator('payment_date')}
                                                    </th>
                                                    {/* <th scope='col' className='text-center'>Created Date</th> */}
                                                    <th scope='col' className='text-center' onClick={() => handleSort('status')}>
                                                        {'Status'}
                                                        {getSortIndicator('status')}
                                                    </th>
                                                    {/* <th scope='col' className='text-center'>Status</th> */}
                                                    {(ManagePaymentPermissions?.edit === 1 || ManagePaymentPermissions?.delete === 1) && (
                                                        <th scope='col' className='text-center'>Action</th>
                                                    )}
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {data.map((item, index) => (
                                                    <tr key={index} className="border-bottom-primary">
                                                        <td className='text-center' style={{ width: '80px' }}>
                                                            {(currentPage - 1) * pageSize + index + 1}
                                                        </td>
                                                        <td className='text-center w-25'>{item.cs_regno}</td>
                                                        <td className='text-center w-25'>{item.cs_first_name} {item.cs_last_name}</td>
                                                        <td className='text-center'>{item.payment_mode}</td>
                                                        <td className='text-center w-25'>{item.bank}</td>
                                                        <td className='text-center w-25'>{item.branch}</td>
                                                        <td className='text-center w-25'>{item.tracking_id}</td>
                                                        <td className='text-center w-25'>{item.total_paid_amount}</td>
                                                        <td className='text-center'>
                                                            {AdminTimezone && item.payment_date
                                                                ? moment(item.payment_date).tz(AdminTimezone).format('YYYY-MM-DD')  // Only Date
                                                                : new Date(item.payment_date).toLocaleDateString('en-US')}
                                                        </td>
                                                        <td className='text-center'>
                                                            {item.status === 0 ? (
                                                                <span
                                                                    style={{ color: 'red', fontSize: '20px', cursor: "pointer" }}
                                                                    onClick={() => openStatusModal(item.payment_id, item.status)}
                                                                    data-tooltip-id="tooltip"
                                                                    data-tooltip-content="Inactive status"
                                                                    data-tooltip-event="click focus"
                                                                >
                                                                    <GoDotFill />
                                                                </span>
                                                            ) : (
                                                                <span
                                                                    style={{ color: 'green', fontSize: '20px', cursor: "pointer" }}
                                                                    onClick={() => openStatusModal(item.payment_id, item.status)}
                                                                    data-tooltip-id="tooltip"
                                                                    data-tooltip-content="Active status"
                                                                    data-tooltip-event="click focus"
                                                                >
                                                                    <GoDotFill />
                                                                </span>
                                                            )}
                                                            <Tooltip id="tooltip" globalEventOff="click" />
                                                        </td>
                                                        {(ManagePaymentPermissions?.edit === 1 || ManagePaymentPermissions?.delete === 1) && (
                                                            <td className='text-center' style={{ width: '140px' }}>
                                                                <Tooltip id="tooltip" globalEventOff="click" />
                                                                {/* {ManagePaymentPermissions?.edit === 1 && (
                                                                    <Button
                                                                        color="primary"
                                                                        size="sm"
                                                                        onClick={() => handleEdit(item)}
                                                                        data-tooltip-id="tooltip"
                                                                        data-tooltip-content="Edit Details"
                                                                        data-tooltip-event="click focus"
                                                                    >
                                                                        <FaEdit />
                                                                    </Button>
                                                                )}
                                                                {ManagePaymentPermissions?.delete === 1 && (
                                                                    <Button
                                                                        color="danger"
                                                                        size="sm"
                                                                        onClick={() => openDeleteModal(item.exh_id, item.exh_name)}
                                                                        data-tooltip-id="tooltip"
                                                                        data-tooltip-content="Delete Page"
                                                                        data-tooltip-event="click focus"
                                                                    >
                                                                        <MdDelete />
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

            <Modal isOpen={statusModalOpen} toggle={closeStatusModal} allowOutsideClick='false' centered size="md">
                <ModalHeader toggle={closeStatusModal}>Confirmation</ModalHeader>
                <ModalBody>
                    <div className='ms-2'>
                        <p>Are you sure you want to change the status to {currentStatus === 0 ? "Active" : "Inactive"}?</p>
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
                        <p>Are you sure you want to delete <strong>{exhName}</strong> payment?</p>
                    </div>
                </ModalBody>
                <ModalFooter>
                    <Button color="primary" onClick={handleDelete}>Yes</Button>
                    <Button color="warning" onClick={closeDeleteModal}>No</Button>
                </ModalFooter>
            </Modal>


        </Fragment>
    );
};

export default ManagePayment;
