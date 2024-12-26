import React, { Fragment, useEffect, useState, useContext } from 'react';
import { Container, Row, Col, Card, Table, CardHeader, CardBody, Input, Label, Button, Modal, ModalHeader, ModalBody, ModalFooter, FormGroup, Badge, InputGroup, InputGroupText } from 'reactstrap';
import { Breadcrumbs } from '../../AbstractElements';
import axios from 'axios';
import { BackendAPI } from '../../api';
import { Link, useNavigate } from 'react-router-dom';
import { GoDotFill } from "react-icons/go";
import { Pagination } from 'antd';
import CustomizerContext from '../../_helper/Customizer';
import SweetAlert from 'sweetalert2';
import { Field, Form } from 'react-final-form';
import { PermissionsContext } from '../../contexts/PermissionsContext';
import { Tooltip } from 'react-tooltip';
import { getToken } from '../../Auth/Auth';
import Select from 'react-select';
import { FaEdit, FaSortUp, FaSortDown, FaEye, FaClone } from 'react-icons/fa';
import { FaPlus } from "react-icons/fa6";
import { FiSearch } from "react-icons/fi";
import { BsThreeDotsVertical, BsThreeDots } from "react-icons/bs";
import { BiSort, BiSortAlt2 } from "react-icons/bi";
import { MdDelete, MdInfoOutline } from "react-icons/md";
import { AiOutlineMenu } from 'react-icons/ai';
import Swal from 'sweetalert2'; // Import SweetAlert2
import '../../assets/scss/programandsession/Ticketpage.css';
import { Button as B, Dropdown as D, Menu } from 'antd';


import useAuth from '../../Auth/protectedAuth';
import './MenuCard.css';
// Define the required validator
const requiredValidator = value => (value ? undefined : 'This field is required');

// Utility function to combine multiple validation functions
const composeValidators = (...validators) => value =>
    validators.reduce((error, validator) => error || validator(value), undefined);



const Managetickets = () => {


    const navigate = useNavigate();
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalItems, setTotalItems] = useState(0);
    const [pageSize, setPageSize] = useState(10);
    const [searchText, setSearchText] = useState('');
    const { permissions } = useContext(PermissionsContext);
    const [sortColumn, setSortColumn] = useState(''); // Column to sort by
    const [sortOrder, setSortOrder] = useState('desc'); // Sort order (asc/desc)
    const [catIds, setCatIds] = useState([]);
    const { layoutURL } = useContext(CustomizerContext);
    const ticketPermissions = permissions['Managetickets'];
    const [ticketIdToUpdate, setticketIdToUpdate] = useState(null); // ticket ID to update status
    const [ticketName, setticketName] = useState(null);
    const [currentStatus, setCurrentStatus] = useState(null);
    const [statusModalOpen, setStatusModalOpen] = useState(false); // New state for modal visibility
    const [deleteticketDetails, setDeleteticketDetails] = useState({ ticketId: null, facilityId: null }); // New state for delete ticket details
    const [modal, setModal] = useState(false);
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    const toggleMenu = () => {
        setIsMenuOpen(!isMenuOpen);
    };

    useAuth();

    const handleNavigation = () => {
        navigate(`${process.env.PUBLIC_URL}/registration/add-tickets/Consoft`);
    };
    const handlePageChange = (page, size) => {
        setCurrentPage(page);
        setPageSize(size);
    };
    const handleSearch = (value) => {
        setSearchText(value);
    };

    useEffect(() => {
        fetchTicket();
    }, [currentPage, pageSize, searchText, permissions]);

    const fetchTicket = async () => {
        try {
            const token = getToken();
            // const Response = await axios.get(`${BackendAPI}/Ticket/getTicket?page=${currentPage}&pageSize=${pageSize}&search=${searchText}`, {
            //     headers: {
            //         Authorization: `Bearer ${token}` // Include the token in the Authorization header
            //     }
            // });
            const Response = await axios.get(`${BackendAPI}/ticketRoutes/getTicket`, {
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
            console.log(Response.data);
            setData(Response.data.categories);
            setTotalItems(Response.data.totalItems);
            setCatIds(catIds);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching data:', error);
            setLoading(false);
        }
    };

    const handleEdit = (ticket) => {
        const URL = '/registration/edit-tickets/';
        navigate(`${process.env.PUBLIC_URL}${URL}${layoutURL}`, { state: { ticket } });
    };

    const handleSort = (column) => {
        const order = sortColumn === column && sortOrder === 'asc' ? 'desc' : 'asc';
        setSortColumn(column);
        setSortOrder(order);
        fetchTicket(); // Fetch the data again with the updated sorting
    };

    const openStatusModal = (ticketId, ticketName, currentStatus) => {
        setticketIdToUpdate(ticketId);
        setticketName(ticketName);
        setCurrentStatus(currentStatus);
        setStatusModalOpen(true);
    };
    const openDeleteModal = (ticketId, facilityId, ticketName) => {
        setDeleteticketDetails({ ticketId, facilityId });
        setticketName(ticketName);
        setModal(true);
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

    const toggleVisibility = async (TicketId) => {
        const currentticket = data.find(user => user.ticket_id === TicketId);
        if (!currentticket) return;
        const currentVisibility = currentticket.ticket_visibility;
        const visibilityStatus = currentVisibility === 0 ? 1 : 0;
        try {
            // Show confirmation dialog
            const result = await Swal.fire({
                title: 'Are you sure?',
                text: visibilityStatus ? 'Do you want to hide this ticket?' : 'Do you want to show this ticket?',
                icon: 'warning',
                showCancelButton: true,
                confirmButtonText: 'Yes, update it!',
                cancelButtonText: 'No, cancel!',
            });

            // Proceed only if the user confirms
            if (result.isConfirmed) {
                const token = getToken();
                console.log(`Sending visibility update: TicketId=${TicketId}, status=${visibilityStatus}`);
                const response = await axios.put(`${BackendAPI}/ticketRoutes/toggleVisibility`,
                    { TicketId, status: visibilityStatus },
                    {
                        headers: {
                            Authorization: `Bearer ${token}`
                        }
                    }
                );

                // Show success notification
                Swal.fire({
                    title: 'Updated!',
                    text: 'Ticket visibility has been updated.',
                    icon: 'success',
                    confirmButtonText: 'Ok'
                });

                fetchTicket(); // Refresh the data
            } else {
                // Show cancel notification
                Swal.fire({
                    title: 'Cancelled',
                    text: 'The visibility update was cancelled.',
                    icon: 'error',
                    confirmButtonText: 'Ok'
                });
            }
        } catch (error) {
            console.error('Error toggling visibility:', error);
            Swal.fire({
                title: 'Error!',
                text: 'There was an error updating the ticket visibility.',
                icon: 'error',
                confirmButtonText: 'Ok'
            });
        }
    };


    const handleView = (ticketId) => {
        const URL = '/registration/view-tickets/';
        navigate(`${process.env.PUBLIC_URL}${URL}${layoutURL}`, { state: { ticketId } });
    };

    const closeDeleteModal = () => {
        setModal(false);
    };

    // const handleDelete = async () => {
    //     try {
    //         const { ticketId } = deleteticketDetails;
    //         const token = getToken();
    //         await axios.delete(`${BackendAPI}/ticketRoutes/deleteticket`, {
    //             headers: {
    //                 Authorization: `Bearer ${token}` // Include the token in the Authorization header
    //             },
    //             data: { ticketId } // Include the data payload correctly
    //         });
    //         SweetAlert.fire({
    //             title: 'Success!',
    //             text: 'Ticket removed successfully!',
    //             icon: 'success',
    //             timer: 3000,
    //             showConfirmButton: false,
    //             allowOutsideClick: false,
    //             allowEscapeKey: false
    //         }).then((result) => {
    //             if (result.dismiss === SweetAlert.DismissReason.timer) {
    //                 navigate(`${process.env.PUBLIC_URL}/registration/manage-tickets/Consoft`);
    //             }
    //         });
    //         fetchTicket(); // Fetch updated ticket list
    //     } catch (error) {
    //         console.error('Error deleting ticket:', error);
    //     }
    //     setModal(false); // Close modal after deletion
    // };


    const handleDelete = async () => {
        try {
            const { ticketId } = deleteticketDetails;
            const token = getToken();
            
            await axios.delete(`${BackendAPI}/ticketRoutes/deleteticket`, {
                headers: {
                    Authorization: `Bearer ${token}` // Include the token in the Authorization header
                },
                data: { ticketId } // Include the data payload correctly
            });
    
            SweetAlert.fire({
                title: 'Success!',
                text: 'Ticket removed successfully!',
                icon: 'success',
                timer: 3000,
                showConfirmButton: false,
                allowOutsideClick: false,
                allowEscapeKey: false
            }).then((result) => {
                if (result.dismiss === SweetAlert.DismissReason.timer) {
                    navigate(`${process.env.PUBLIC_URL}/registration/manage-tickets/Consoft`);
                }
            });
    
            fetchTicket(); // Fetch updated ticket list
        } catch (error) {
            // Handle specific server error response
            if (error.response && error.response.status === 400) {
                SweetAlert.fire({
                    title: 'Error!',
                    text: error.response.data.message || 'Unable to delete the ticket.',
                    icon: 'error',
                    confirmButtonText: 'OK'
                });
            } else {
                // General error handler
                SweetAlert.fire({
                    title: 'Error!',
                    text: 'Something went wrong. Please try again later.',
                    icon: 'error',
                    confirmButtonText: 'OK'
                });
            }
    
            console.error('Error deleting ticket:', error);
        } finally {
            setModal(false); // Close modal regardless of success or failure
        }
    };
    

    const [openItemId, setOpenItemId] = useState(null);

    const handleToggleMenu = (id) => {
        setOpenItemId(openItemId === id ? null : id); // Toggle menu open/close
    };

    const getSettings = (item) => [
        {
            key: '1',
            label: (
                <div onClick={() => handleEdit(item)}>
                    <FaEdit /> Edit
                </div>
            ),
        },
        {
            key: '2',
            label: (
                <div onClick={() => toggleVisibility(item.ticket_id)}>
                    <FaClone /> Mark a {item.ticket_id === 1 ? "Hide" : "Unhide"}
                </div>
            ),
        },
        {
            key: '3',
            label: (
                <div onClick={() => handleView(item.ticket_id)}>
                    <FaEdit /> View ticket
                </div>
            ),
        },
        {
            key: '4',
            label: (
                <div onClick={() => openDeleteModal(item.ticket_id)}>
                    <MdDelete /> Delete Ticket
                </div>
            ),
        },
        // Add more options if needed
    ];



    return (
        <Fragment>
            <Breadcrumbs mainTitle="Manage Tickets" parent="Registration Admin" title="Manage Tickets" />
            <Container fluid={true}>
                <Row>
                    <Col sm="12">
                        <Card>
                            <CardHeader>
                                <div className='d-flex align-items-center w-100'>
                                    <div className="mb-2 mb-md-0 w-100">
                                        {/* <h5 className="mb-2 text-start">Ticket</h5> */}
                                        <InputGroup style={{ width: '100%', maxWidth: '200px', borderRadius: '20px' }}>
                                            <InputGroupText>
                                                <FiSearch />
                                            </InputGroupText>
                                            <Input
                                                placeholder="Search Ticket"
                                                onChange={e => handleSearch(e.target.value)}
                                            // style={{ borderRadius: '20px' }}
                                            />
                                        </InputGroup>
                                    </div>
                                    <div className="text-md-end w-100 mt-2 mt-md-0 text-end text-wrap">
                                        {ticketPermissions?.add === 1 && (
                                            // <Button onClick={handleNavigation} color='warning'>
                                            //     Create Tickets
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
                                                    Create Ticket
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
                                        <p className='text-center'>No Ticket found</p>
                                    ) : (
                                        <Table>
                                            <thead>
                                                <tr className='border-bottom-primary'>
                                                    <th scope='col' className='text-start'>{'Sr No.'}</th>
                                                    <th scope='col' className='text-start' onClick={() => handleSort('ticket_title')}>
                                                        {'Ticket Title'}
                                                        {getSortIndicator('ticket_title')}
                                                    </th>
                                                    <th scope='col' className='text-start' onClick={() => handleSort('ticket_ispaid')}>
                                                        {'Price'}
                                                        {getSortIndicator('ticket_ispaid')}
                                                    </th>
                                                    <th scope='col' className='text-start' onClick={() => handleSort('ticket_count')}>
                                                        {'Seats'}
                                                        {getSortIndicator('ticket_count')}
                                                    </th>
                                                    {/* <th scope='col' className='text-start'>{'ticket Name'}</th> */}
                                                    <th scope='col' className='text-center' onClick={() => handleSort('ticket_status')}>
                                                        {'Status'}
                                                        {getSortIndicator('ticket_status')}
                                                    </th>
                                                    {/* <th scope='col' className='text-center'>{'Status'}</th> */}
                                                    {ticketPermissions?.edit === 1 || ticketPermissions?.delete === 1 ? (
                                                        <th scope='col' className='text-end'>Action</th>
                                                    ) : null}
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {data.map((item, index) => (
                                                    <tr key={index} className="border-bottom-primary">
                                                        <td className='text-start'>{(currentPage - 1) * pageSize + index + 1}</td>
                                                        <td className='text-start'>{item.ticket_title}</td>
                                                        <td className='text-start'>{item.ticket_ispaid === '0' ? 'Free' : 'Paid'}</td>


                                                        <td className='text-start'>
                                                            {item.ticket_type === 'Unlimited' ? 'Unlimited' : item.ticket_count}
                                                        </td>

                                                        {/* <td className='text-center'>
                                                            {item.cs_status === 0 ? (
                                                                <span style={{ color: 'red', fontSize: '20px', cursor: "pointer" }}
                                                                    onClick={() => openStatusModal(item.ticket_id, item.cs_ticket_name, item.cs_status)}
                                                                    data-tooltip-id="tooltip"
                                                                    data-tooltip-content="Inactive status"
                                                                    data-tooltip-event="click focus">
                                                                    <GoDotFill />
                                                                </span>
                                                            ) : (
                                                                <span
                                                                    style={{ color: 'green', fontSize: '20px', cursor: "pointer" }}
                                                                    onClick={() => openStatusModal(item.ticket_id, item.cs_ticket_name, item.cs_status)}
                                                                    data-tooltip-id="tooltip"
                                                                    data-tooltip-content="Active status"
                                                                    data-tooltip-event="click focus">
                                                                    <GoDotFill />
                                                                </span>
                                                            )}
                                                            <Tooltip id="tooltip" globalEventOff="click" />
                                                        </td> */}

                                                        <td className="text-center">
                                                            {item.ticket_status === 'Open' ? (
                                                                <Badge color="success">
                                                                    Open
                                                                </Badge>
                                                            ) : item.ticket_status === 'Close' ? (
                                                                <Badge color="danger">
                                                                    Close
                                                                </Badge>
                                                            ) : item.ticket_status === 'SoldOut' ? (
                                                                <Badge color="warning">
                                                                    Sold Out
                                                                </Badge>
                                                            ) : (
                                                                <Badge color="dark">
                                                                    Unknown Status
                                                                </Badge>
                                                            )}
                                                        </td>

                                                        {ticketPermissions?.edit === 1 || ticketPermissions?.delete === 1 ? (
                                                            <td className='text-end'>
                                                                <Tooltip id="tooltip" globalEventOff="click" />
                                                                {/* {ticketPermissions?.edit === 1 && (
                                                                    <Button color="primary" size="sm" onClick={() => handleEdit(item)}
                                                                        data-tooltip-id="tooltip"
                                                                        data-tooltip-content="Edit Details"
                                                                        data-tooltip-event="click focus" >
                                                                        <FaEdit />
                                                                    </Button>
                                                                )} */}
                                                                {/* {ticketPermissions?.delete === 1 && (
                                                                    <Button color="danger" size="sm" onClick={() => openDeleteModal(item.ticket_id)}
                                                                        data-tooltip-id="tooltip"
                                                                        data-tooltip-content="Delete ticket"
                                                                        data-tooltip-event="click focus" >
                                                                        <MdDelete />
                                                                    </Button>
                                                                )} */}
                                                                {/* <Button
                                                                    color="secondary"
                                                                    size="sm"
                                                                    onClick={() => handleToggleMenu(item.ticket_id)}
                                                                    data-tooltip-id="tooltip"
                                                                    data-tooltip-content="Options"
                                                                    data-tooltip-event="click focus"
                                                                >
                                                                    <AiOutlineMenu />
                                                                </Button> */}



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
            <Modal isOpen={modal} toggle={closeDeleteModal} centered size="md">
                <ModalHeader toggle={closeDeleteModal}>Confirmation</ModalHeader>
                <ModalBody>
                    <div className='ms-2'>
                        <p>Are you sure you want to delete {ticketName} ticket?</p>
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
export default Managetickets;