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
import { Button as B, Dropdown as D, Menu } from 'antd';
import Swal from 'sweetalert2'; // Import SweetAlert2
import '../../assets/scss/programandsession/Ticketpage.css';

import useAuth from '../../Auth/protectedAuth';
import './MenuCard.css';
// Define the required validator
const requiredValidator = value => (value ? undefined : 'This field is required');

// Utility function to combine multiple validation functions
const composeValidators = (...validators) => value =>
    validators.reduce((error, validator) => error || validator(value), undefined);



const Manageaddon = () => {


    const navigate = useNavigate();
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalItems, setTotalItems] = useState(0);
    const [pageSize, setPageSize] = useState(10);
    const [searchText, setSearchText] = useState('');
    const { permissions } = useContext(PermissionsContext);
    const ManageaddonPermissions = permissions['Manageaddon'];
    const [sortColumn, setSortColumn] = useState(''); // Column to sort by
    const [sortOrder, setSortOrder] = useState('desc'); // Sort order (asc/desc)
    const [catIds, setCatIds] = useState([]);
    const { layoutURL } = useContext(CustomizerContext);
    // const ManageaddonPermissions = permissions['Workshops'];
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
        navigate(`${process.env.PUBLIC_URL}/registration/add-addon/Consoft`);
    };
    const handlePageChange = (page, size) => {
        setCurrentPage(page);
        setPageSize(size);
    };
    const handleSearch = (value) => {
        setSearchText(value);
        setCurrentPage(1);
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
            const Response = await axios.get(`${BackendAPI}/addonRoutes/getAddon`, {
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

    const handleEdit = (addon) => {
        const URL = '/registration/edit-addon/';
        navigate(`${process.env.PUBLIC_URL}${URL}${layoutURL}`, { state: { addon } });
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
    const openDeleteModal = (ticketId, ticketName) => {
        setDeleteticketDetails({ ticketId });
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
        const currentticket = data.find(user => user.addon_id === TicketId);
        if (!currentticket) return;
        const currentVisibility = currentticket.addon_visiblility;
        console.log("Visibility", currentVisibility);
        const visibilityStatus = currentVisibility === 0 ? 1 : 0;
        try {
            // Show confirmation dialog
            const result = await Swal.fire({
                title: 'Are you sure?',
                text: visibilityStatus ? 'Do you want to hide this addon?' : 'Do you want to show this addon?',
                icon: 'warning',
                showCancelButton: true,
                confirmButtonText: 'Yes, update it!',
                cancelButtonText: 'No, cancel!',
            });

            // Proceed only if the user confirms
            if (result.isConfirmed) {
                const token = getToken();
                console.log(`Sending visibility update: TicketId=${TicketId}, status=${visibilityStatus}`);
                const response = await axios.put(`${BackendAPI}/addonRoutes/toggleVisibility`,
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
                    text: 'Addon visibility has been updated.',
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


    const handleView = (addonId) => {
        const URL = '/registration/view-addon/';
        navigate(`${process.env.PUBLIC_URL}${URL}${layoutURL}`, { state: { addonId } });
    };

    const closeDeleteModal = () => {
        setModal(false);
    };

    // const handleDelete = async () => {
    //     try {
    //         const { ticketId } = deleteticketDetails;
    //         const token = getToken();
    //         await axios.delete(`${BackendAPI}/addonRoutes/deleteaddon`, {
    //             headers: {
    //                 Authorization: `Bearer ${token}` // Include the token in the Authorization header
    //             },
    //             data: { ticketId } // Include the data payload correctly
    //         });
    //         SweetAlert.fire({
    //             title: 'Success!',
    //             text: 'Addon removed successfully!',
    //             icon: 'success',
    //             timer: 3000,
    //             showConfirmButton: false,
    //             allowOutsideClick: false,
    //             allowEscapeKey: false
    //         }).then((result) => {
    //             if (result.dismiss === SweetAlert.DismissReason.timer) {
    //                 navigate(`${process.env.PUBLIC_URL}/registration/manage-addon/Consoft`);
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
            const { ticketId } = deleteticketDetails; // Extract the ticketId or addonId (adjust based on naming)
            const token = getToken(); // Get the authentication token

            // Make the DELETE request to the backend
            await axios.delete(`${BackendAPI}/addonRoutes/deleteaddon`, {
                headers: {
                    Authorization: `Bearer ${token}` // Pass token in headers
                },
                data: { ticketId } // Send ticketId (or addonId) as payload
            });

            // Success alert
            SweetAlert.fire({
                title: 'Success!',
                text: 'Addon removed successfully!',
                icon: 'success',
                timer: 3000,
                showConfirmButton: false,
                allowOutsideClick: false,
                allowEscapeKey: false
            }).then((result) => {
                if (result.dismiss === SweetAlert.DismissReason.timer) {
                    // Redirect to manage addons page
                    navigate(`${process.env.PUBLIC_URL}/registration/manage-addon/Consoft`);
                }
            });


        } catch (error) {
            console.error('Error deleting addon:', error);

            // Handle specific errors
            if (error.response && error.response.status === 400) {
                SweetAlert.fire({
                    title: 'Error!',
                    text: error.response.data.message || 'Addon deletion failed. It might be referenced in other records.',
                    icon: 'error',
                    showConfirmButton: true
                });
            } else {
                SweetAlert.fire({
                    title: 'Error!',
                    text: 'An unexpected error occurred while deleting the addon. Please try again later.',
                    icon: 'error',
                    showConfirmButton: true
                });
            }
        } finally {
            setModal(false); // Ensure the modal is closed
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
                <div onClick={() => toggleVisibility(item.addon_id)}>
                    <FaClone /> Mark a {item.addon_visiblility === 0 ? "Unhide" : "Hide"}
                </div>
            ),
        },
        {
            key: '3',
            label: (
                <div onClick={() => handleView(item.addon_id)}>
                    <FaEdit /> View Add-on
                </div>
            ),
        },
        {
            key: '4',
            label: (
                <div onClick={() => openDeleteModal(item.addon_id, item.addon_title)}>
                    <MdDelete /> Delete Addon
                </div>
            ),
        },
        // Add more options if needed
    ];

    const addonwiseNavigation = (addonId) => {
        const URL = '/registration/confirm-user-listing/';
        navigate(`${process.env.PUBLIC_URL}${URL}${layoutURL}`, { state: { addonId } });

    };



    return (
        <Fragment>
            <Breadcrumbs mainTitle="Manage Add-ons" parent="Registration Admin" title="Manage Add-ons" />
            <Container fluid={true}>
                <Row>
                    <Col sm="12">
                        <Card>
                            <CardHeader>
                                <div className='d-flex align-items-center w-100'>
                                    <div className="mb-2 mb-md-0 w-100">
                                        <InputGroup style={{ width: '100%', maxWidth: '200px', borderRadius: '20px' }}>
                                            <InputGroupText>
                                                <FiSearch />
                                            </InputGroupText>
                                            <Input
                                                placeholder="Search Add-on"
                                                onChange={e => handleSearch(e.target.value)}
                                            // style={{ borderRadius: '20px' }}
                                            />
                                        </InputGroup>
                                    </div>
                                    <div className="text-md-end w-100 mt-2 mt-md-0 text-end text-wrap">
                                        {ManageaddonPermissions?.add === 1 && (
                                            // <Button onClick={handleNavigation} color='warning'>
                                            //     Create Addon
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
                                                    Create Add-on
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
                                        <p className='text-center'>No Addon found</p>
                                    ) : (
                                        <Table>
                                            <thead>
                                                <tr className='border-bottom-primary'>
                                                    <th scope='col' className='text-start'>{'Sr No.'}</th>
                                                    <th scope='col' className='text-start' onClick={() => handleSort('addon_title')}>
                                                        {'Add-on Title'}
                                                        {getSortIndicator('addon_title')}
                                                    </th>
                                                    <th scope='col' className='text-start' onClick={() => handleSort('addon_ispaid')}>
                                                        {'Price'}
                                                        {getSortIndicator('addon_ispaid')}
                                                    </th>
                                                    <th scope='col' className='text-start' onClick={() => handleSort('addon_type')}>
                                                        {'Seats'}
                                                        {getSortIndicator('addon_type')}
                                                    </th>
                                                    <th scope='col' className='text-center' onClick={() => handleSort('userCount')}>
                                                        {'Usage Count'}
                                                        {getSortIndicator('userCount')}
                                                    </th>
                                                    {/* <th scope='col' className='text-start'>{'ticket Name'}</th> */}
                                                    <th scope='col' className='text-center' onClick={() => handleSort('addon_status')}>
                                                        {'Status'}
                                                        {getSortIndicator('addon_status')}
                                                    </th>
                                                    {/* <th scope='col' className='text-center'>{'Status'}</th> */}
                                                    {ManageaddonPermissions?.edit === 1 || ManageaddonPermissions?.delete === 1 ? (
                                                        <th scope='col' className='text-end'>Action</th>
                                                    ) : null}
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {data.map((item, index) => (
                                                    <tr key={index} className="border-bottom-primary">
                                                        <td className='text-start'>{(currentPage - 1) * pageSize + index + 1}</td>
                                                        <td className='text-start'>{item.addon_title}</td>
                                                        <td className='text-start'>{item.addon_ispaid === 0 ? 'Free' : 'Paid'}</td>


                                                        <td className='text-start'>
                                                            {item.addon_type === 'Unlimited'
                                                                ? 'Unlimited'
                                                                : `${item.addon_type} (${item.addon_count})`}
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
                                                        <td className='text-center'>
                                                            <Button
                                                                color='link' // Makes it look like a link
                                                                className='p-0' // Removes padding
                                                                style={{ textDecoration: 'none' }} // Inline style to remove underline
                                                                onClick={() => {
                                                                    if (item.userCount > 0) { // Check if userCount is greater than 0
                                                                        addonwiseNavigation(item.addon_id);
                                                                    }
                                                                }}
                                                            >
                                                                {item.userCount}
                                                            </Button>
                                                        </td>

                                                        <td className="text-center">
                                                            {item.addon_status === 'Open' ? (
                                                                <Badge color="success">
                                                                    Open
                                                                </Badge>
                                                            ) : item.addon_status === 'Close' ? (
                                                                <Badge color="danger">
                                                                    Close
                                                                </Badge>
                                                            ) : item.addon_status === 'SoldOut' ? (
                                                                <Badge color="warning">
                                                                    Sold Out
                                                                </Badge>
                                                            ) : (
                                                                <Badge color="dark">
                                                                    Unknown Status
                                                                </Badge>
                                                            )}
                                                        </td>

                                                        {ManageaddonPermissions?.edit === 1 || ManageaddonPermissions?.delete === 1 ? (
                                                            <td className='text-end'>
                                                                <Tooltip id="tooltip" globalEventOff="click" />
                                                                {/* {ManageaddonPermissions?.edit === 1 && (
                                                                    <Button color="primary" size="sm" onClick={() => handleEdit(item)}
                                                                        data-tooltip-id="tooltip"
                                                                        data-tooltip-content="Edit Details"
                                                                        data-tooltip-event="click focus" >
                                                                        <FaEdit />
                                                                    </Button>
                                                                )}
                                                                {ManageaddonPermissions?.delete === 1 && (
                                                                    <Button color="danger" size="sm" onClick={() => openDeleteModal(item.addon_id)}
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

                                                                {/* <Button
                                                                    color="secondary"
                                                                    size="sm"
                                                                    onClick={() => handleToggleMenu(item.addon_id)}
                                                                    data-tooltip-id="tooltip"
                                                                    data-tooltip-content="Options"
                                                                    data-tooltip-event="click focus"
                                                                >
                                                                    <AiOutlineMenu />
                                                                </Button> */}

                                                                {/* {openItemId === item.ticket_id && (
                                                                    <div className="menuCardWrapper">
                                                                        <div className="menuCard">
                                                                            <div className="menuCardContent">
                                                                                {item.ticket_visibility === '1' ? (
                                                                                    <div
                                                                                        className="menuCardItem warning"
                                                                                        onClick={() => toggleVisibility(item.ticket_id, 0)}
                                                                                        data-tooltip-id="tooltip"
                                                                                        data-tooltip-content="Hide ticket"
                                                                                        data-tooltip-event="click focus"
                                                                                    >
                                                                                        Hide
                                                                                    </div>
                                                                                ) : (
                                                                                    <div
                                                                                        className="menuCardItem success"
                                                                                        onClick={() => toggleVisibility(item.ticket_id, 1)}
                                                                                        data-tooltip-id="tooltip"
                                                                                        data-tooltip-content="Unhide ticket"
                                                                                        data-tooltip-event="click focus"
                                                                                    >
                                                                                        Unhide
                                                                                    </div>
                                                                                )}

                                                                                <div
                                                                                    className="menuCardItem info"
                                                                                    onClick={() => handleView(item.ticket_id)}
                                                                                    data-tooltip-id="tooltip"
                                                                                    data-tooltip-content="View ticket"
                                                                                    data-tooltip-event="click focus" s
                                                                                >
                                                                                    <FaEye className="icon" /> View
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                    </div>
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
            <Modal isOpen={modal} toggle={closeDeleteModal} centered size="md">
                <ModalHeader toggle={closeDeleteModal}>Confirmation</ModalHeader>
                <ModalBody>
                    <div className='ms-2'>
                        <p>Are you sure you want to delete <strong>{ticketName}</strong> addon?</p>
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
export default Manageaddon;