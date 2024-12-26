import React, { Fragment, useEffect, useState, useContext } from 'react';
import { Container, Row, Col, Card, Table, CardHeader, CardBody, Input, Button, Modal, ModalHeader, ModalFooter, ModalBody, PopoverBody, UncontrolledPopover, InputGroup, InputGroupText } from 'reactstrap';
import { Breadcrumbs } from '../../AbstractElements';
import axios from 'axios';
import { BackendAPI } from '../../api';
import SweetAlert from 'sweetalert2';
import { Link, useNavigate } from 'react-router-dom';
import { GoDotFill } from "react-icons/go";
import { FaEdit, FaAngleUp, FaAngleDown, FaCode, FaSortUp, FaSortDown } from 'react-icons/fa';
import { FaPlus } from "react-icons/fa6";
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
import { Button as B, Dropdown as D, Menu } from 'antd';
import useAuth from '../../Auth/protectedAuth';
import moment from 'moment-timezone';


const ManageHall = () => {
    useAuth();
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalItems, setTotalItems] = useState(0);
    const [pageSize, setPageSize] = useState(10);
    const [searchText, setSearchText] = useState('');
    const [sortColumn, setSortColumn] = useState(''); // Column to sort by
    const [sortOrder, setSortOrder] = useState('desc'); // Sort order (asc/desc)
    const [mapedhallid, setMapedhallid] = useState([]);
    const [catIds, setCatIds] = useState([]);
    const { layoutURL } = useContext(CustomizerContext);
    const [modal, setModal] = useState(false);
    const [statusModalOpen, setStatusModalOpen] = useState(false); // New state for modal visibility
    const [HallIdToUpdate, setHallIdToUpdate] = useState(null); // Hall ID to update status
    const [HallName, setHallName] = useState(null);
    const [currentStatus, setCurrentStatus] = useState(null);
    const [deleteHallDetails, setDeleteHallDetails] = useState({ HallId: null, facilityId: null }); // New state for delete Hall details
    const navigate = useNavigate();
    const { permissions } = useContext(PermissionsContext);
    const isIdMatched = mapedhallid.includes(HallIdToUpdate);
    const AdminTimezone = localStorage.getItem('AdminTimezone');


    console.log("Mapped Hall", mapedhallid);



    useEffect(() => {
        fetchHall();
        fetchMappedid();
    }, [currentPage, pageSize, searchText, permissions]);

    // Extract Halls component
    const HallsPermissions = permissions['ManageHall'];

    const fetchHall = async () => {
        try {
            const token = getToken();
            const Response = await axios.get(`${BackendAPI}/hall/getHall`, {
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
            console.log("Hall data", Response.data);
            setData(Response.data.categories);
            setTotalItems(Response.data.totalItems);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching data:', error);
            setLoading(false);
        }
    };

    const fetchMappedid = async () => {
        try {
            const token = getToken();
            const Response = await axios.get(`${BackendAPI}/hall/getMappedHallId`, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
            console.log("Hall data", Response.data);
            setMapedhallid(Response.data.mapedid)
        } catch (error) {
            console.error('Error fetching data:', error);
            setLoading(false);
        }
    };


    const handleSort = (column) => {
        const order = sortColumn === column && sortOrder === 'asc' ? 'desc' : 'asc';
        setSortColumn(column);
        setSortOrder(order);
        fetchHall(); // Fetch the data again with the updated sorting
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

        ...(HallsPermissions?.edit === 1
            ? [{
                key: '1',
                label: (
                    <div onClick={() => handleEdit(item.locat_id, item.heading)}>
                        <FaEdit /> Edit Details
                    </div>
                ),
            }]
            : []
        ),

        ...(HallsPermissions?.delete === 1
            ? [{
                key: '2',
                label: (
                    <div onClick={() => openDeleteModal(item.locat_id, item.locat_name)}>
                        <MdDelete /> Delete Hall
                    </div>
                ),
            }]
            : []
        ),
        // Add more options if needed
    ];


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
    };

    const handleEdit = (HallId, Hallname) => {
        const URL = '/event/edit-hall/';
        navigate(`${process.env.PUBLIC_URL}${URL}${layoutURL}`, { state: { HallId } });
    };

    const handleDelete = async () => {
        try {
            const { HallId } = deleteHallDetails;
            const token = getToken();
            await axios.delete(`${BackendAPI}/hall/deleteHall`, {
                headers: {
                    Authorization: `Bearer ${token}` // Include the token in the Authorization header
                },
                data: { HallId } // Include the data payload correctly
            });
            SweetAlert.fire({
                title: 'Success!',
                text: 'Hall removed successfully!',
                icon: 'success',
                timer: 3000,
                showConfirmButton: false,
                allowOutsideClick: false,
                allowEscapeKey: false
            }).then((result) => {
                if (result.dismiss === SweetAlert.DismissReason.timer) {
                    navigate(`${process.env.PUBLIC_URL}/event/manage-hall/Consoft`);
                }
            });
            fetchHall(); // Fetch updated Hall list
        } catch (error) {
            console.error('Error deleting Hall:', error);
        }
        setModal(false); // Close modal after deletion
    };


    const openStatusModal = (HallId, currentStatus, HallName) => {
        setHallIdToUpdate(HallId);
        setHallName(HallName);
        setCurrentStatus(currentStatus);
        setStatusModalOpen(true);
    };


    const closeStatusModal = () => {
        setStatusModalOpen(false);
    };

    const handleStatusUpdate = async () => {
        const HallId = HallIdToUpdate;
        const currentHall = data.find(Hall => Hall.locat_id === HallId);
        if (!currentHall) return;
        const currentStatus = currentHall.status;
        const newStatus = currentStatus === 0 ? 1 : 0;
        try {
            const token = getToken();
            await axios.put(`${BackendAPI}/hall/UpdateStatus`, { HallId, status: newStatus }, {
                headers: {
                    Authorization: `Bearer ${token}` // Include the token in the Authorization header
                }
            });
            const updatedHalls = data.map((Hall) =>
                Hall.locat_id === HallId ? { ...Hall, status: newStatus } : Hall
            );
            setData(updatedHalls);
        } catch (error) {
            console.error('Error updating status:', error);
        }
        closeStatusModal(); // Close modal after status update
    };

    const openDeleteModal = (HallId, HallName) => {
        setDeleteHallDetails({ HallId });
        setHallName(HallName);
        setModal(true);
    };

    const closeDeleteModal = () => {
        setModal(false);
    };

    const handleNavigation = () => {
        navigate(`${process.env.PUBLIC_URL}/event/add-hall/Consoft`);
    };



    return (
        <Fragment>
            <Breadcrumbs mainTitle={
                <>
                    Manage Hall
                    <MdInfoOutline
                        id="hallPopover"
                        style={{
                            cursor: 'pointer', position: 'absolute', marginLeft: '5px'
                        }}
                    />
                    <UncontrolledPopover
                        placement="bottom"
                        target="hallPopover"
                        trigger="focus"
                    >
                        <PopoverBody>
                            The Manage Hall feature lets you set up halls for your event venue. < br />
                            You can assign sessions to created Halls.
                            You can map these halls on the floor map, This helps you easily find sessions, sponsor booths, and activities throughout your venue. Spend less time guiding and more time engaging!
                            You can edit hall and can manage the status as <span className="text-success">Active</span> / <span className="text-danger">Inactive</span> as needed.
                        </PopoverBody>
                    </UncontrolledPopover>
                </>
            } parent="Event App Admin" title="Manage Hall" />
            <Container fluid={true}>
                <Row>
                    <Col sm="12">
                        <Card>
                            {/* <CardHeader className="d-flex justify-content-between align-items-center flex-column flex-md-row">
                                <div className="mb-2 mb-md-0">
                                    <h5 className="mb-2 text-start">Halls</h5>
                                    <Input
                                        placeholder="Search Hall"
                                        onChange={e => handleSearch(e.target.value)}
                                        style={{ width: 200 }}
                                    />
                                </div>
                                {HallsPermissions?.add === 1 && (
                                    <button onClick={handleNavigation} className="btn btn-warning">
                                        Create Hall
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
                                                placeholder="Search Hall"
                                                onChange={e => handleSearch(e.target.value)}
                                            // style={{ borderRadius: '20px' }}
                                            />
                                        </InputGroup>
                                    </div>
                                    <div className="text-md-end w-100 mt-2 mt-md-0 text-end text-wrap">
                                        {HallsPermissions?.add === 1 && (
                                            <>
                                            <Button
                                                color=""
                                                className='circular'
                                                onClick={handleNavigation} data-tooltip-id="insertdTooltip"
                                            >
                                                <FaPlus
                                                    className='buttonStyle'
                                                />

                                            </Button>
                                            <Tooltip id="insertdTooltip" place="top" effect="solid">
                                                Create Hall
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
                                        <p className='text-center'>No hall found</p>
                                    ) : (
                                        <Table>
                                            <thead>
                                                <tr className='border-bottom-primary'>
                                                    <th scope='col' className='text-start'>
                                                        Sr No.
                                                    </th>
                                                    <th scope='col' className='text-start' onClick={() => handleSort('locat_name')}>
                                                        {'Hall Name'}
                                                        {getSortIndicator('locat_name')}
                                                    </th>
                                                    <th scope='col' className='text-start' onClick={() => handleSort('hall_type_name')}>
                                                        {'Hall Type'}
                                                        {getSortIndicator('hall_type_name')}
                                                    </th>
                                                    {/* <th scope='col' className='text-start' onClick={() => handleSort('created_at')}>
                                                        {'Date'}
                                                        {getSortIndicator('created_at')}
                                                    </th> */}
                                                    <th scope='col' className='text-center' onClick={() => handleSort('status')}>
                                                        {'Status'}
                                                        {getSortIndicator('status')}
                                                    </th>
                                                    {HallsPermissions?.edit === 1 || HallsPermissions?.delete === 1 ? (
                                                        <th scope='col' className='text-end'>Action</th>
                                                    ) : null}
                                                </tr>
                                            </thead>

                                            <tbody>
                                                {data.map((item, index) => (
                                                    <tr key={index} className="border-bottom-primary">
                                                        <td className='text-start'>{(currentPage - 1) * pageSize + index + 1}</td>
                                                        <td className='text-start'>{item.locat_name}</td>
                                                        <td className='text-start'>{item.hall_type_name}</td>
                                                        {/* <td className='text-center'>
                                                            {AdminTimezone && item.created_at
                                                                ? moment(item.created_at).tz(AdminTimezone).format('YYYY-MM-DD')  // Only Date
                                                                : new Date(item.created_at).toLocaleDateString('en-US')}
                                                        </td> */}
                                                        <td className='text-center'>
                                                            {item.status === 0 || item.status === "0" ? (
                                                                <span style={{ color: 'red', fontSize: '20px', cursor: "pointer" }}
                                                                    onClick={() => openStatusModal(item.locat_id, item.status, item.locat_name)}
                                                                    data-tooltip-id="tooltip"
                                                                    data-tooltip-content="Inactive status"
                                                                    data-tooltip-event="click focus">
                                                                    <GoDotFill />
                                                                </span>
                                                            ) : (
                                                                <span
                                                                    style={{ color: 'green', fontSize: '20px', cursor: "pointer" }}
                                                                    onClick={() => openStatusModal(item.locat_id, item.status, item.locat_name)}
                                                                    data-tooltip-id="tooltip"
                                                                    data-tooltip-content="Active status"
                                                                    data-tooltip-event="click focus">
                                                                    <GoDotFill />
                                                                </span>
                                                            )}
                                                            <Tooltip id="tooltip" globalEventOff="click" />
                                                        </td>
                                                        {HallsPermissions?.edit === 1 || HallsPermissions?.delete === 1 ? (
                                                            <td className='text-end'>
                                                                <Tooltip id="tooltip" globalEventOff="click" />
                                                                {/* {HallsPermissions?.edit === 1 && (
                                                                    <Button color="primary" size="sm" onClick={() => handleEdit(item.locat_id, item.heading)}
                                                                        data-tooltip-id="tooltip"
                                                                        data-tooltip-content="Edit Details"
                                                                        data-tooltip-event="click focus" >
                                                                        <FaEdit />
                                                                    </Button>
                                                                )}
                                                                {HallsPermissions?.delete === 1 && (
                                                                    <Button color="danger" size="sm" onClick={() => openDeleteModal(item.locat_id, item.locat_name)}
                                                                        data-tooltip-id="tooltip"
                                                                        data-tooltip-content="Delete Hall"
                                                                        data-tooltip-event="click focus" >
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
                        <p><strong>Alert: Changing Status</strong></p>
                        {!isIdMatched && (
                            <p>This action will {currentStatus === 0 ? "Inactive" : "Active"} the  <strong>{HallName}</strong>, and all associated sessions and sub-sessions will be {currentStatus === 0 ? "Inactive" : "Active"}.
                                Are you sure you want to continue?
                            </p>
                        )}
                        {isIdMatched && (
                            <p>
                                <strong>{HallName}</strong>  is currently displayed on the floor map. Are you sure you want to change its status to Inactive? This action will permanently remove the all associated sessions, sub-sessions and hall from the floor map.
                            </p>
                        )}
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
                        <p><strong>Alert: Deleting Hall</strong></p>

                        <p>This action will delete the <strong>{HallName}</strong>, This action will permanently remove the all associated sessions, sub-sessions and hall from the floor map.
                            Are you sure you want to continue?</p>
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

export default ManageHall;
