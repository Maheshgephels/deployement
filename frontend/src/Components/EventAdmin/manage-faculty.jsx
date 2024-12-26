import React, { Fragment, useEffect, useState, useContext } from 'react';
import { Container, Row, Col, Card, Table, CardHeader, CardBody, Input, Button, Modal, ModalHeader, ModalFooter, ModalBody, PopoverBody, UncontrolledPopover, InputGroup, InputGroupText, FormGroup } from 'reactstrap';
import { Breadcrumbs } from '../../AbstractElements';
import axios from 'axios';
import { BackendAPI } from '../../api';
import SweetAlert from 'sweetalert2';
import { Link, useNavigate } from 'react-router-dom';
import { GoDotFill } from "react-icons/go";
import { FaEdit, FaAngleUp, FaAngleDown, FaCode, FaSortUp, FaSortDown } from 'react-icons/fa';
import { FiSearch } from "react-icons/fi";
import { BsThreeDotsVertical, BsThreeDots } from "react-icons/bs";
import { BiSort, BiSortAlt2 } from "react-icons/bi";
import { MdDelete, MdInfoOutline, MdReorder } from "react-icons/md";
import { BiExport } from "react-icons/bi";
import { Pagination } from 'antd';
import CustomizerContext from '../../_helper/Customizer';
import { Tooltip } from 'react-tooltip';
import { ToastContainer, toast } from "react-toastify";
import { classes } from '../../Data/Layouts';
import { PermissionsContext } from '../../contexts/PermissionsContext';
import { getToken } from '../../Auth/Auth';
import useAuth from '../../Auth/protectedAuth';
import { useLocation } from 'react-router-dom';
import { Button as B, Dropdown as D, Menu } from 'antd';


const ManageFaculty = () => {
    useAuth();
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [order, setOrder] = useState(false);
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
    const [FacultyIdToUpdate, setFacultyIdToUpdate] = useState(null); // Faculty ID to update status
    const [FacultyName, setFacultyName] = useState(null);
    const [currentStatus, setCurrentStatus] = useState(null);
    const [deleteFacultyDetails, setDeleteFacultyDetails] = useState({ FacultyId: null, facilityId: null }); // New state for delete Faculty details
    const navigate = useNavigate();
    const { permissions } = useContext(PermissionsContext);
    const location = useLocation();
    const { sortBy, Title } = location.state || {};



    useEffect(() => {
        fetchFaculty();
    }, [currentPage, pageSize, searchText, permissions, sortBy]);

    // Extract Facultys component
    const ManageRegFacultyPermissions = permissions['ManageFaculty'];
    console.log('sortby', sortBy);
    // Modify fetchFaculty to handle sorting
    const fetchFaculty = async () => {
        try {
            const token = getToken();
            let url = `${BackendAPI}/faculty/getFaculty?`; // Start building the URL with a question mark for query params

            // Add default query parameters
            url += `page=${currentPage}&pageSize=${pageSize}&search=${searchText}&sortColumn=${sortColumn}&sortOrder=${sortOrder}`;

            // Handle sorting
            if (sortBy === 'active') {
                url += '&sortBy=active'; // Append sorting by active
            } else if (sortBy === 'inactive') {
                url += '&sortBy=inactive'; // Append sorting by inactive
            } else if (sortBy === 'total') {
                url += '&sortBy=total'; // Append sorting by total
            }

            const Response = await axios.get(url, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
            setData(Response.data.categories);
            setTotalItems(Response.data.totalItems);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching data:', error);
            setLoading(false);
        }
    };

    const handlePageChange = (page, size) => {
        setCurrentPage(page);
        console.log("Page:", page, "Size:", size);
        if (isNaN(size)) {
            setPageSize(totalItems); // Set pageSize to totalItems to display all
        } else {
            setPageSize(parseInt(size, 10)); // Ensure size is an integer
        }
    };

    const handleSearch = (value) => {
        setSearchText(value);
        setCurrentPage(1);

    };

    const handleSort = (column) => {
        const order = sortColumn === column && sortOrder === 'asc' ? 'desc' : 'asc';
        setSortColumn(column);
        setSortOrder(order);
        fetchFaculty(); // Fetch the data again with the updated sorting
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

        ...(ManageRegFacultyPermissions?.edit === 1
            ? [{
                key: '1',
                label: (
                    <div onClick={() => handleEdit(item.faculty_id, item.heading)}>
                        <FaEdit /> Edit Details
                    </div>
                ),
            }]
            : []
        ),
        // Add more options if needed
    ];

    const handleEdit = (FacultyId, Facultyname) => {
        const URL = '/event/edit-faculty/';
        navigate(`${process.env.PUBLIC_URL}${URL}${layoutURL}`, { state: { FacultyId, Facultyname } });
    };

    const handleDelete = async () => {
        try {
            const { FacultyId } = deleteFacultyDetails;
            const token = getToken();
            await axios.delete(`${BackendAPI}/faculty/deleteFaculty`, {
                headers: {
                    Authorization: `Bearer ${token}` // Include the token in the Authorization header
                },
                data: { FacultyId } // Include the data payload correctly
            });
            SweetAlert.fire({
                title: 'Success!',
                text: 'Faculty removed successfully!',
                icon: 'success',
                timer: 3000,
                showConfirmButton: false,
                allowOutsideClick: false,
                allowEscapeKey: false
            }).then((result) => {
                if (result.dismiss === SweetAlert.DismissReason.timer) {
                    navigate(`${process.env.PUBLIC_URL}/event/manage-faculty/Consoft`);
                }
            });
            fetchFaculty(); // Fetch updated Faculty list
        } catch (error) {
            console.error('Error deleting Faculty:', error);
        }
        setModal(false); // Close modal after deletion
    };


    const openStatusModal = (FacultyId, currentStatus) => {
        setFacultyIdToUpdate(FacultyId);
        setCurrentStatus(currentStatus);
        setStatusModalOpen(true);
    };


    const closeStatusModal = () => {
        setStatusModalOpen(false);
    };

    const handleStatusUpdate = async () => {
        const FacultyId = FacultyIdToUpdate;
        const currentFaculty = data.find(Faculty => Faculty.faculty_id === FacultyId);
        if (!currentFaculty) return;
        const currentStatus = currentFaculty.status;
        const newStatus = currentStatus === 0 ? 1 : 0;
        try {
            const token = getToken();
            await axios.put(`${BackendAPI}/faculty/UpdateStatus`, { FacultyId, status: newStatus }, {
                headers: {
                    Authorization: `Bearer ${token}` // Include the token in the Authorization header
                }
            });
            const updatedFacultys = data.map((Faculty) =>
                Faculty.faculty_id === FacultyId ? { ...Faculty, status: newStatus } : Faculty
            );
            setData(updatedFacultys);
        } catch (error) {
            console.error('Error updating status:', error);
        }
        closeStatusModal(); // Close modal after status update
    };

    const openDeleteModal = (FacultyId) => {
        setDeleteFacultyDetails({ FacultyId });
        setModal(true);
    };

    const closeDeleteModal = () => {
        setModal(false);
    };

    const handleNavigation = () => {
        navigate(`${process.env.PUBLIC_URL}/event/add-Faculty/Consoft`);
    };

    const handleUpItem = async (item) => {
        console.log("Up:", item);
        try {
            const token = getToken();
            const response = await axios.post(`${BackendAPI}/faculty/moveup`, { item: item.faculty_id, order: item.faculty_order }, {
                headers: {
                    Authorization: `Bearer ${token}` // Include the token in the Authorization header
                }
            });

            // Check the response status and show appropriate toast message
            if (response.status === 200) {
                toast('Field position reordered successfully!');
            } else if (response.status === 202 && response.data.error) {
                toast('Already at the top position !'); // Show the error message from the server
            } else {
                toast('Unexpected response from the server.');
            }

            // Fetch updated fields after moving up
            fetchFaculty();
        } catch (error) {
            // Show a generic error message in case of failure
            toast('Already at the top position !');
        }
    };


    const handleDownItem = async (item) => {

        console.log("Down:", item);

        try {
            const token = getToken();
            const response = await axios.post(`${BackendAPI}/faculty/movedown`, { item: item.faculty_id, order: item.faculty_order }, {
                headers: {
                    Authorization: `Bearer ${token}` // Include the token in the Authorization header
                }
            });

            // Check the response status and show appropriate toast message
            if (response.status === 200) {
                toast('Field position reordered successfully!');
            } else if (response.status === 202 && response.data.error) {
                toast('Already at the bottom position !'); // Show the error message from the server
            } else {
                toast('Unexpected response from the server.');
            }

            // Fetch updated fields after moving up
            fetchFaculty();
        } catch (error) {
            console.error('Error updating flag:', error);
        }
    };

    const toggleModal = () => setModalOpen(!modalOpen);

    // Function to handle confirmation and reorder
    const handleReorder = () => {
        setOrder(true); // Update state
        toggleModal(); // Close modal
        // Add logic here if you need to execute something else on reorder
    };



    return (
        <Fragment>
            <Breadcrumbs mainTitle={
                <>
                    Manage Faculty
                    <MdInfoOutline
                        id="userPopover"
                        style={{
                            cursor: 'pointer', position: 'absolute', marginLeft: '5px'
                        }}
                    />
                    <UncontrolledPopover
                        placement="bottom"
                        target="userPopover"
                        trigger="focus"
                    >
                        <PopoverBody>
                            You can manage the event faculty from here, you have the option to rearrange their order as needed. <br />
                            The active faculty will be displayed in the <strong>Event App</strong> in the same order you set.
                        </PopoverBody>
                    </UncontrolledPopover>
                </>
            } parent="Event App Admin" title="Manage Faculty" />
            <Container fluid={true}>
                <Row>
                    <Col sm="12">
                        <Card>
                            {/* <CardHeader className="d-flex justify-content-between align-items-center flex-column flex-md-row">
                                <div className="mb-2 mb-md-0">
                                    <h5 className="mb-2 text-start">Facultys</h5>
                                    <Input
                                        placeholder="Search Faculty"
                                        onChange={e => handleSearch(e.target.value)}
                                        style={{ width: 200 }}
                                    />
                                </div>
                                {ManageRegFacultyPermissions?.add === 1 && (
                                    <button onClick={handleNavigation} className="btn btn-warning">
                                        Create Faculty
                                    </button>
                                )}
                            </CardHeader> */}
                            <CardHeader>
                                <div className='d-flex align-items-center w-100'>
                                <div className="mb-2 mb-md-0 w-100">
                                        {/* <h5 className="mb-2 text-start">Payment</h5> */}
                                        <InputGroup style={{ width: '100%', maxWidth: '200px', borderRadius: '20px' }}>
                                            <InputGroupText>
                                                <FiSearch />
                                            </InputGroupText>
                                            <Input
                                                placeholder="Search Faculty"
                                                onChange={e => handleSearch(e.target.value)}
                                            // style={{ borderRadius: '20px' }}
                                            />
                                        </InputGroup>
                                    </div>
                                    <div className="text-md-end w-100 mt-2 mt-md-0 text-end text-wrap">
                                        {order === false && (
                                            // <Button onClick={toggleModal} className="me-2" color='primary'>
                                            //     Reorder
                                            // </Button>

                                            <>
                                                <Button
                                                    color=""
                                                    className='circular'
                                                    onClick={toggleModal} data-tooltip-id="insertTooltip"
                                                >
                                                    <MdReorder
                                                        className='buttonStyle'
                                                    />

                                                </Button>
                                                <Tooltip id="insertTooltip" place="top" effect="solid">
                                                    Reorder Faculty
                                                </Tooltip>
                                            </>

                                        )}
                                        {/* {ManageRegFacultyPermissions?.add === 1 && (
                                            <Button onClick={handleNavigation} color='warning'>
                                                Create Faculty
                                            </Button>
                                        )} */}
                                    </div>
                                </div>
                            </CardHeader>
                            <CardBody>
                                <div className='table-responsive'>
                                    {loading ? (
                                        <p>Loading...</p>
                                    ) : data.length === 0 ? (
                                        <p className='text-center'>No faculty found</p>
                                    ) : (
                                        <Table>
                                            <thead>
                                                <tr className='border-bottom-primary'>
                                                    <th scope='col' className='text-start'>{'Sr No.'}</th>
                                                    {order !== false && (
                                                        <th scope='col' className='text-center'>Faculty Order</th>
                                                    )}
                                                    <th scope='col' className='text-start' onClick={() => handleSort('fname')}>
                                                        {'Faculty Name'}
                                                        {getSortIndicator('fname')}
                                                    </th>
                                                    {/* <th scope='col' className='text-start'>{'Faculty Name'}</th> */}
                                                    <th scope='col' className='text-start' onClick={() => handleSort('email1')}>
                                                        {'Email'}
                                                        {getSortIndicator('email1')}
                                                    </th>
                                                    {/* <th scope='col' className='text-start'>{'Email'}</th> */}
                                                    <th scope='col' className='text-start' onClick={() => handleSort('sessionCount')}>
                                                        {'Assigned Sessions'}
                                                        {getSortIndicator('sessionCount')}
                                                    </th>
                                                    {/* <th scope='col' className='text-center'>{'Assigned Sessions'}</th> */}
                                                    <th scope='col' className='text-center' onClick={() => handleSort('status')}>
                                                        {'Status'}
                                                        {getSortIndicator('status')}
                                                    </th>
                                                    {/* <th scope='col' className='text-center'>{'Status'}</th> */}
                                                    {ManageRegFacultyPermissions?.edit === 1 || ManageRegFacultyPermissions?.delete === 1 ? (
                                                        <th scope='col' className='text-end'>Action</th>
                                                    ) : null}
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {data.map((item, index) => (
                                                    <tr key={index} className="border-bottom-primary">
                                                        <td className='text-start'>{(currentPage - 1) * pageSize + index + 1}</td>
                                                        {order !== false && (
                                                            <td className='text-center' style={{ width: '140px' }}>
                                                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                                                    <Button
                                                                        color="warning"
                                                                        size="sm"
                                                                        onClick={() => handleUpItem(item)}
                                                                        data-tooltip-id="tooltip"
                                                                        data-tooltip-content="Move Up"
                                                                        data-tooltip-event="click focus"
                                                                        disabled={item.page_type === 'Static'}
                                                                    >
                                                                        <FaAngleUp />
                                                                    </Button>
                                                                    <Button
                                                                        color="warning"
                                                                        size="sm"
                                                                        onClick={() => handleDownItem(item)}
                                                                        data-tooltip-id="tooltip"
                                                                        data-tooltip-content="Move down"
                                                                        data-tooltip-event="click focus"
                                                                        disabled={item.page_type === 'Static'}

                                                                    >
                                                                        <FaAngleDown />
                                                                    </Button>
                                                                </div>
                                                            </td>
                                                        )}
                                                        <td className='text-start'>{`${item.ntitle} ${item.fname} ${item.mname} ${item.lname}`}</td>
                                                        <td className='text-start'>{item.email1}</td>
                                                        <td className='text-center'>{item.sessionCount}</td>
                                                        <td className='text-center'>
                                                            {item.status === "0" || item.status === 0 ? (
                                                                <span style={{ color: 'red', fontSize: '20px', cursor: "pointer" }}
                                                                    onClick={() => openStatusModal(item.faculty_id, item.status)}
                                                                    data-tooltip-id="tooltip"
                                                                    data-tooltip-content="Inactive status"
                                                                    data-tooltip-event="click focus">
                                                                    <GoDotFill />
                                                                </span>
                                                            ) : (
                                                                <span
                                                                    style={{ color: 'green', fontSize: '20px', cursor: "pointer" }}
                                                                    onClick={() => openStatusModal(item.faculty_id, item.status)}
                                                                    data-tooltip-id="tooltip"
                                                                    data-tooltip-content="Active status"
                                                                    data-tooltip-event="click focus">
                                                                    <GoDotFill />
                                                                </span>
                                                            )}
                                                            <Tooltip id="tooltip" globalEventOff="click" />
                                                        </td>
                                                        {ManageRegFacultyPermissions?.edit === 1 || ManageRegFacultyPermissions?.delete === 1 ? (
                                                            <td className='text-end'>
                                                                <Tooltip id="tooltip" globalEventOff="click" />
                                                                {/* {ManageRegFacultyPermissions?.edit === 1 && (
                                                                    <Button color="primary" size="sm" onClick={() => handleEdit(item.faculty_id, item.heading)}
                                                                        data-tooltip-id="tooltip"
                                                                        data-tooltip-content="Edit Details"
                                                                        data-tooltip-event="click focus" >
                                                                        <FaEdit />
                                                                    </Button>
                                                                )} */}
                                                                {/* {ManageRegFacultyPermissions?.delete === 1 && ( */}
                                                                {/* <Button color="danger" size="sm" onClick={() => openDeleteModal(item.faculty_id)}
                                                                        data-tooltip-id="tooltip"
                                                                        data-tooltip-content="Delete Faculty"
                                                                        data-tooltip-event="click focus" >
                                                                        <MdDelete />
                                                                    </Button> */}
                                                                {/* )} */}

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
                                            current={currentPage}
                                            pageSize={pageSize}
                                            total={totalItems}
                                            showSizeChanger
                                            pageSizeOptions={['10', '20', '50', '100']}
                                            onChange={handlePageChange}
                                            showQuickJumper={true}
                                            onShowSizeChange={(page, size) => {
                                                handlePageChange(page, size);
                                            }}
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
                        <p>Are you sure you want to change the status of <strong>"Faculty"</strong> to {currentStatus === 0 ? "Active" : "Inactive"}?</p>
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
                        <p>Are you sure you want to delete {FacultyName} Faculty?</p>
                    </div>
                </ModalBody>
                <ModalFooter>
                    <Button color="primary" onClick={handleDelete}>Yes</Button>
                    <Button color="warning" onClick={closeDeleteModal}>No</Button>
                </ModalFooter>
            </Modal>

            {/* Modal for Re-order Confirmation */}
            <Modal isOpen={modalOpen} toggle={toggleModal}>
                <ModalHeader toggle={toggleModal}>Confirm Reorder</ModalHeader>
                <ModalBody>
                    Do you want to reorder the pages? The same order will be displayed in the event app.
                </ModalBody>
                <ModalFooter>
                    <Button color="primary" onClick={handleReorder}>
                        Yes
                    </Button>
                    <Button color="warning" onClick={toggleModal}>
                        Cancel
                    </Button>

                </ModalFooter>
            </Modal>
        </Fragment>
    );
};

export default ManageFaculty;
