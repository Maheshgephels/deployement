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
import { IoMdSend } from "react-icons/io";
import { Pagination } from 'antd';
import CustomizerContext from '../../_helper/Customizer';
import { Tooltip } from 'react-tooltip';
import { classes } from '../../Data/Layouts';
import { PermissionsContext } from '../../contexts/PermissionsContext';
import { getToken } from '../../Auth/Auth';
import { Button as B, Dropdown as D, Menu } from 'antd';
import useAuth from '../../Auth/protectedAuth';

const Manageprogramday = () => {
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
    const [statusModalOpen, setStatusModalOpen] = useState(false); // New state for modal visibility
    const [ProgramdayIdToUpdate, setProgramdayIdToUpdate] = useState(null); // Programday ID to update status
    const [ProgramdayName, setProgramdayName] = useState(null);
    const [currentStatus, setCurrentStatus] = useState(null);
    const [deleteProgramdayDetails, setDeleteProgramdayDetails] = useState({ ProgramdayId: null, facilityId: null }); // New state for delete Programday details
    const navigate = useNavigate();
    const { permissions } = useContext(PermissionsContext);



    useEffect(() => {
        fetchProgramday();
    }, [currentPage, pageSize, searchText, permissions]);

    // Extract Programdays component
    const ManageprogramdayPermissions = permissions['Manageprogramday'];

    const fetchProgramday = async () => {
        try {
            const token = getToken();
            // const Response = await axios.get(`${BackendAPI}/programday/getProgramday?page=${currentPage}&pageSize=${pageSize}&search=${searchText}`, {
            //     headers: {
            //         Authorization: `Bearer ${token}` // Include the token in the Authorization header
            //     }
            // });
            const Response = await axios.get(`${BackendAPI}/programday/getProgramday`, {
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
            console.log("Programday data", Response.data);
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
        fetchProgramday(); // Fetch the data again with the updated sorting
    };


    const getSortIndicator = (column) => {
        if (sortColumn === column) {
            return sortOrder === 'asc' ? (
                <BiSort
                 style={{ marginLeft: '5px', fontSize: '0.8rem', verticalAlign: 'middle', color: 'black' }} />
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

        ...(ManageprogramdayPermissions?.edit === 1
            ? [{
                key: '1',
                label: (
                    <div onClick={() => handleEdit(item.prog_id)}>
                        <FaEdit /> Edit Program Day
                    </div>
                ),
            }]
            : []
        ),

        ...(ManageprogramdayPermissions?.delete === 1
            ? [{
                key: '2',
                label: (
                    <div onClick={() => openDeleteModal(item.prog_id, item.prog_name)}>
                        <MdDelete /> Delete Program Day
                    </div>
                ),
            }]
            : []
        ),

        ...(ManageprogramdayPermissions?.add === 1
            ? [{
                key: '3',
                label: (
                    <div onClick={() => handleGoToSession(item.prog_id)}>
                        <IoMdSend   /> Go to Session
                    </div>
                ),
            }]
            : []
        ),
        // Add more options if needed
    ];


    const handleEdit = (ProgramdayId, Programdayname) => {
        const URL = '/event/edit-programday/';
        navigate(`${process.env.PUBLIC_URL}${URL}${layoutURL}`, { state: { ProgramdayId, Programdayname } });
    };

    const handleDelete = async () => {
        try {
            const { ProgramdayId } = deleteProgramdayDetails;
            const token = getToken();
            await axios.delete(`${BackendAPI}/Programday/deleteProgramday`, {
                headers: {
                    Authorization: `Bearer ${token}` // Include the token in the Authorization header
                },
                data: { ProgramdayId } // Include the data payload correctly
            });
            SweetAlert.fire({
                title: 'Success!',
                text: 'Programday removed successfully!',
                icon: 'success',
                timer: 3000,
                showConfirmButton: false,
                allowOutsideClick: false,
                allowEscapeKey: false
            }).then((result) => {
                if (result.dismiss === SweetAlert.DismissReason.timer) {
                    navigate(`${process.env.PUBLIC_URL}/event/manage-program/Consoft`);
                }
            });
            fetchProgramday(); // Fetch updated Programday list
        } catch (error) {
            console.error('Error deleting Programday:', error);
        }
        setModal(false); // Close modal after deletion
    };


    const openStatusModal = (ProgramdayId, currentStatus, ProgName) => {
        setProgramdayIdToUpdate(ProgramdayId);
        setProgramdayName(ProgName);
        setCurrentStatus(currentStatus);
        setStatusModalOpen(true);
    };


    const closeStatusModal = () => {
        setStatusModalOpen(false);
    };

    const handleStatusUpdate = async () => {
        const ProgramdayId = ProgramdayIdToUpdate;
        const currentProgramday = data.find(Programday => Programday.prog_id === ProgramdayId);
        if (!currentProgramday) return;
        const currentStatus = currentProgramday.status;
        const newStatus = currentStatus === 0 ? 1 : 0;
        try {
            const token = getToken();
            await axios.put(`${BackendAPI}/Programday/UpdateStatus`, { ProgramdayId, status: newStatus }, {
                headers: {
                    Authorization: `Bearer ${token}` // Include the token in the Authorization header
                }
            });
            const updatedProgramdays = data.map((Programday) =>
                Programday.prog_id === ProgramdayId ? { ...Programday, status: newStatus } : Programday
            );
            setData(updatedProgramdays);
        } catch (error) {
            console.error('Error updating status:', error);
        }
        closeStatusModal(); // Close modal after status update
    };

    const openDeleteModal = (ProgramdayId, ProgName) => {
        setDeleteProgramdayDetails({ ProgramdayId });
        setProgramdayName(ProgName);
        setModal(true);
    };

    const closeDeleteModal = () => {
        setModal(false);
    };

    const handleNavigation = () => {
        navigate(`${process.env.PUBLIC_URL}/event/add-programday/Consoft`);
    };

    const handleGoToSession = (ProgramdayId) => {
        const URL = '/event/manage-session/';
        navigate(`${process.env.PUBLIC_URL}${URL}${layoutURL}`, { state: { ProgramdayId } });
    };



    return (
        <Fragment>
            <Breadcrumbs mainTitle={
                <>
                    Manage Program Day
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
                            From here, you can create and manage the days of the event. <br />
                            These days will appear when you create sessions for the Event.
                            also you can go to the session page for that program day by clicking on <strong>Go to Session</strong> button.
                        </PopoverBody>
                    </UncontrolledPopover>
                </>
            } parent="Event App Admin" title="Manage Program Day" />
            <Container fluid={true}>
                <Row>
                    <Col sm="12">
                        <Card>
                            {/* <CardHeader className="d-flex justify-content-between align-items-center flex-column flex-md-row">
                                <div className="mb-2 mb-md-0">
                                    <h5 className="mb-2 text-start">Programdays</h5>
                                    <Input
                                        placeholder="Search Programday"
                                        onChange={e => handleSearch(e.target.value)}
                                        style={{ width: 200 }}
                                    />
                                </div>
                                {ManageprogramdayPermissions?.add === 1 && (
                                    <button onClick={handleNavigation} className="btn btn-warning">
                                        Create Programday
                                    </button>
                                )}
                            </CardHeader> */}
                            <CardHeader>
                                <div className='d-flex align-items-center w-100'>
                                <div className="mb-2 mb-md-0 w-100">
                                        {/* <h5 className="mb-2 text-start">Payment</h5> */}
                                        <InputGroup style={{ width: '100%', maxWidth: '220px', borderRadius: '20px' }}>
                                            <InputGroupText>
                                                <FiSearch />
                                            </InputGroupText>
                                            <Input
                                                placeholder="Search Program Day"
                                                onChange={e => handleSearch(e.target.value)}
                                            // style={{ borderRadius: '20px' }}
                                            />
                                        </InputGroup>
                                    </div>
                                    <div className="text-md-end w-100 mt-2 mt-md-0 text-end text-wrap">
                                        {ManageprogramdayPermissions?.add === 1 && (
                                            // <Button onClick={handleNavigation} color='warning'>
                                            //     Create Program Day
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
                                                    Create Program Day
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
                                    ) : (
                                        <Table>
                                            <thead>
                                                <tr className='border-bottom-primary'>
                                                    <th scope='col' className='text-start'>{'Sr No.'}</th>
                                                    <th scope='col' className='text-start' onClick={() => handleSort('prog_name')}>
                                                        {'Program day Name'}
                                                        {getSortIndicator('prog_name')}
                                                    </th>
                                                    {/* <th scope='col' className='text-start'>{'Program day Name'}</th> */}
                                                    <th scope='col' className='text-start' onClick={() => handleSort('from_date')}>
                                                        {'Date'}
                                                        {getSortIndicator('from_date')}
                                                    </th>
                                                    {/* <th scope='col' className='text-start'>{'Date'}</th> */}
                                                    <th scope='col' className='text-start' onClick={() => handleSort('start_time')}>
                                                        {'Start Time'}
                                                        {getSortIndicator('start_time')}
                                                    </th>
                                                    {/* <th scope='col' className='text-start'>{'Start Time'}</th> */}
                                                    <th scope='col' className='text-start' onClick={() => handleSort('end_time')}>
                                                        {'End Time'}
                                                        {getSortIndicator('end_time')}
                                                    </th>
                                                    {/* <th scope='col' className='text-start'>{'End Time'}</th> */}
                                                    <th scope='col' className='text-center' onClick={() => handleSort('status')}>
                                                        {'Status'}
                                                        {getSortIndicator('status')}
                                                    </th>
                                                    {/* <th scope='col' className='text-center'>{'Status'}</th> */}
                                                    {ManageprogramdayPermissions?.edit === 1 || ManageprogramdayPermissions?.delete === 1 ? (
                                                        <th scope='col' className='text-end'>Action</th>
                                                    ) : null}
                                                    {/* <th scope='col' className='text-center'>{'Go to Session'}</th> */}
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {data.map((item, index) => (
                                                    <tr key={index} className="border-bottom-primary">
                                                        <td className='text-start'>{(currentPage - 1) * pageSize + index + 1}</td>
                                                        <td className='text-start'>{item.prog_name}</td>
                                                        <td className='text-start'>{item.from_date}</td>
                                                        <td className='text-start'>{item.start_time}</td>
                                                        <td className='text-start'>{item.end_time}</td>

                                                        <td className='text-center'>
                                                            {item.status === 0 || item.status === "0" ? (
                                                                <span style={{ color: 'red', fontSize: '20px', cursor: "pointer" }}
                                                                    onClick={() => openStatusModal(item.prog_id, item.status, item.prog_name)}
                                                                    data-tooltip-id="tooltip"
                                                                    data-tooltip-content="Inactive status"
                                                                    data-tooltip-event="click focus">
                                                                    <GoDotFill />
                                                                </span>
                                                            ) : (
                                                                <span
                                                                    style={{ color: 'green', fontSize: '20px', cursor: "pointer" }}
                                                                    onClick={() => openStatusModal(item.prog_id, item.status, item.prog_name)}
                                                                    data-tooltip-id="tooltip"
                                                                    data-tooltip-content="Active status"
                                                                    data-tooltip-event="click focus">
                                                                    <GoDotFill />
                                                                </span>
                                                            )}
                                                            <Tooltip id="tooltip" globalEventOff="click" />
                                                        </td>
                                                        {ManageprogramdayPermissions?.edit === 1 || ManageprogramdayPermissions?.delete === 1 ? (
                                                            <td className='text-end'>
                                                                <Tooltip id="tooltip" globalEventOff="click" />
                                                                {/* {ManageprogramdayPermissions?.edit === 1 && (
                                                                <Button color="primary" size="sm" onClick={() => handleEdit(item.prog_id)}
                                                                    data-tooltip-id="tooltip"
                                                                    data-tooltip-content="Edit Details"
                                                                    data-tooltip-event="click focus" >
                                                                    <FaEdit />
                                                                </Button>
                                                                 )} 
                                                                {ManageprogramdayPermissions?.delete === 1 && (
                                                                <Button color="danger" size="sm" onClick={() => openDeleteModal(item.prog_id, item.prog_name)}
                                                                    data-tooltip-id="tooltip"
                                                                    data-tooltip-content="Delete Programday"
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
                                                        {/* <td className='text-center'>
                                                            <Button color="info" size="sm" onClick={() => handleGoToSession(item.prog_id)}>
                                                                Go to Session
                                                            </Button>
                                                        </td> */}
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

                        <p>This action will {currentStatus === 0 ? "Active" : "Inactive"} the  <strong>{ProgramdayName}</strong>, and all associated sessions and sub-sessions will be {currentStatus === 0 ? "Active" : "Inactive"}.
                            Are you sure you want to continue?</p>
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

                        <p>This action will delete the <strong>{ProgramdayName}</strong>, and all its associated sessions and sub-sessions will be deleted.
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

export default Manageprogramday;
