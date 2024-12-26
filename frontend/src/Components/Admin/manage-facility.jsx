import React, { Fragment, useEffect, useState, useContext } from 'react';
import { Container, Row, Col, Card, Table, CardHeader, Button, CardBody, Media, Label, Input, Modal, ModalHeader, ModalBody, ModalFooter, PopoverBody, UncontrolledPopover, InputGroup, InputGroupText } from 'reactstrap';
import { Breadcrumbs } from '../../AbstractElements';
import { GoDotFill } from "react-icons/go";
import { Link, useNavigate } from 'react-router-dom';
import { FaEdit, FaAngleUp, FaAngleDown, FaCode, FaSortUp, FaSortDown } from 'react-icons/fa';
import { FaPlus } from "react-icons/fa6";
import { FiSearch } from "react-icons/fi";
import { BsThreeDotsVertical, BsThreeDots } from "react-icons/bs";
import { BiSort, BiSortAlt2 } from "react-icons/bi";
import { MdDelete, MdInfoOutline } from "react-icons/md";
import CustomizerContext from '../../_helper/Customizer';
import axios from 'axios';
import { BackendAPI } from '../../api';
import { BackendPath } from '../../api';
import { Pagination } from 'antd';
import { ToastContainer, toast } from "react-toastify";
import { Tooltip } from 'react-tooltip';
import SweetAlert from 'sweetalert2';
import { getToken } from '../../Auth/Auth';
import useAuth from '../../Auth/protectedAuth';
import { Button as B, Dropdown as D, Menu } from 'antd';
import { PermissionsContext } from '../../contexts/PermissionsContext';

const Facility = () => {
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
    const [catid, setCatid] = useState([]);
    const [modalOpen, setModalOpen] = useState(false);
    const [selectedFacilityId, setSelectedFacilityId] = useState(null);
    const [selectedDaywiseStatus, setSelectedDaywiseStatus] = useState('');
    const [modal, setModal] = useState(false);
    const [deleteFacName, setDeleteFacName] = useState('');
    const [deleteFacId, setDeleteFacId] = useState(null);
    const navigate = useNavigate();
    const { layoutURL } = useContext(CustomizerContext);
    const { permissions } = useContext(PermissionsContext);
    const [statusModalOpen, setStatusModalOpen] = useState(false);
    const [currentStatus, setCurrentStatus] = useState(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [message, setMessage] = useState('');


    console.log("Before", data);

    console.log("Cat id", catid);


    const DismissibleNotification = ({ message, onClose }) => {
        return (
            <div style={{
                position: 'fixed',
                bottom: '20px',
                left: '20px',
                backgroundColor: '#000',
                color: '#fff',
                padding: '15px',
                borderRadius: '5px',
                boxShadow: '0px 0px 10px rgba(0, 0, 0, 0.5)',
                zIndex: '9999'
            }}>
                <span>{message}</span>
                <button onClick={onClose} style={{ marginLeft: '10px', backgroundColor: 'transparent', border: 'none', color: '#fff', cursor: 'pointer' }}>✕</button>
            </div>
        );
    };

    useEffect(() => {
        fetchRoles();
    }, [currentPage, pageSize, searchText, permissions]);

    // Extract Facility component
    const FacilityPermissions = permissions['Facility'];

    const fetchRoles = async () => {
        try {
            const token = getToken();
            // const response = await axios.get(`${BackendAPI}/user/getfacility?page=${currentPage}&pageSize=${pageSize}&search=${searchText}`, {
            //     headers: {
            //         Authorization: `Bearer ${token}` // Include the token in the Authorization header
            //     }
            // });
            const response = await axios.get(`${BackendAPI}/user/getfacility`, {
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
        } catch (error) {
            console.error('Error fetching roles:', error);
            setLoading(false);
        }
    };

    const handlePageChange = (page, size) => {
        setCurrentPage(page);
        setPageSize(size);
    };

    const handlePageSizeChange = (size) => {
        setPageSize(size);
        setCurrentPage(1);
        fetchRoles();
    };

    const handleSearch = (value) => {
        setSearchText(value);
    };

    const handleSort = (column) => {
        const order = sortColumn === column && sortOrder === 'asc' ? 'desc' : 'asc';
        setSortColumn(column);
        setSortOrder(order);
        fetchRoles(); // Fetch the data again with the updated sorting
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
        ...(FacilityPermissions?.edit === 1
            ? [{
                key: '1',
                label: (
                    <div onClick={() => editFacility(item)}>
                        <FaEdit /> Edit Facility
                    </div>
                ),
            }]
            : []
        ),


        // Conditionally render the delete option if WorkshopsPermissions?.delete === 1
        ...(FacilityPermissions?.delete === 1
            ? [{
                key: '3', // Ensure unique key for each option
                label: (
                    <div onClick={() => openDeleteModal(item.cs_facility_id, item.cs_display_name)}>
                        <MdDelete /> Delete Facility
                    </div>
                )
            }]
            : []
        ),
        // Add more options if needed
    ];


    useEffect(() => {
        const fetchCatId = async () => {
            setLoading(true);
            try {
                const token = getToken();
                const response = await axios.get(`${BackendAPI}/field/getCatId`, {
                    headers: {
                        Authorization: `Bearer ${token}` // Include the token in the Authorization header
                    }
                });
                setCatid(response.data);
                setLoading(false);
            } catch (error) {
                console.error("Error fetching users:", error);
                setLoading(false);
            }
        };

        fetchCatId();
    }, []);

    const toggleModal = (facilityId, daywiseStatus, facilityName) => {
        setSelectedFacilityId(facilityId);
        setSelectedDaywiseStatus(daywiseStatus);
        setDeleteFacName(facilityName);
        setModalOpen(!modalOpen);
    };

    const handleDaywiseToggle = async (facilityId, newDaywiseStatus) => {
        const token = getToken();
        setIsProcessing(true);
        setMessage('The process has started and is running in the background. Once it is completed, we will notify you. In the meantime, you are free to start other processes.');


        const toastId = toast.info('Processing...', { autoClose: false });
        try {



            await axios.put(`${BackendAPI}/user/UpdateDaywise`, { id: facilityId, daywise: newDaywiseStatus }, {
                headers: {
                    Authorization: `Bearer ${token}` // Include the token in the Authorization header
                }
            });
            const updatedFacilities = data.map((facility) =>
                facility.cs_facility_id === facilityId ? { ...facility, cs_daywise: newDaywiseStatus } : facility
            );
            setData(updatedFacilities);
            setIsProcessing(false);
            toast.dismiss(toastId);
            setMessage('');
            toast.success("Day wise updated sucessfully");
        } catch (error) {
            console.error('Error updating daywise status:', error);
            setIsProcessing(false);
            toast.dismiss(toastId);

            if (error.response && error.response.status === 503) {
                toast.error('Your request could not be processed at this moment due to ongoing processes in the queue. We will notify you once the process is completed. Please try again later.');
            } else if (error.request) {
                // Request made but no response received
                toast.error('Network error. Please try again later.');
            } else {
                // Something happened in setting up the request
                toast.error('Failed to update daywise. Please try again later.');
            }
        }
    };

    const editFacility = (item) => {
        const URL = '/onsite/edit-facility/';
        navigate(`${process.env.PUBLIC_URL}${URL}${layoutURL}`, { state: { item } });
    };


    const openStatusModal = (FacId, currentStatus, facilityName) => {
        setDeleteFacId(FacId);
        setCurrentStatus(currentStatus);
        setDeleteFacName(facilityName);
        setStatusModalOpen(true);
    };

    const closeStatusModal = () => {
        setDeleteFacId(null);
        setCurrentStatus(null);
        setDeleteFacName(null);
        setStatusModalOpen(false);
    };

    const handleStatusUpdate = async (cs_facility_id, currentStatus, cs_display_name) => {
        // Calculate the new status based on the current status
        const newStatus = currentStatus === 0 ? 1 : 0;


        setIsProcessing(true);
        setMessage('The process has started and is running in the background. Once it is completed, we will notify you. In the meantime, you are free to start other processes.');
        setTimeout(() => {
            setMessage('');
        }, 10000);

        //   const itemId = data[selectedRowIndex].cs_facility_detail_id;
        const toastId = toast.info('Processing...', { autoClose: false });

        try {
            const token = getToken();
            // Update the status via API call
            const response = await axios.put(`${BackendAPI}/user/UpdateStatus`, { id: cs_facility_id, status: newStatus, Name: cs_display_name }, {
                headers: {
                    Authorization: `Bearer ${token}` // Include the token in the Authorization header
                }
            });

            // Check if the response status is 200 before updating the state
            if (response.status === 200) {
                // Use a functional update to ensure we're working with the latest state
                setData(prevData => {
                    const updatedFacilities = prevData.map((facility) =>
                        facility.cs_facility_id === cs_facility_id ? { ...facility, cs_status: newStatus } : facility
                    );
                    return updatedFacilities;
                });

                setIsProcessing(false);
                toast.dismiss(toastId);
                toast.success(response.data.message);

            } else {
                console.error('Failed to update status: response status not 200');
                setIsProcessing(false);
                toast.dismiss(toastId);
                toast.error('Failed to update count. Please try again later.');
            }
        } catch (error) {
            console.error('Error updating status:', error);
            setIsProcessing(false);
            toast.dismiss(toastId);
            if (error.response && error.response.status === 503) {
                toast.error("Your request could not be processed at this moment due to ongoing processes in the queue. We will notify you once the process is completed. Please try again later.");
            } else if (error.request) {
                // Request made but no response received
                toast.error('Network error. Please try again later.');
            } else {
                // Something happened in setting up the request
                toast.error('Failed to update count. Please try again later.');
            }
        }
    };

    useEffect(() => {
        console.log("After update:", data);
    }, [data]);




    const handleDelete = async (facilityId) => {
        setModal(false);

        try {
            const token = getToken();
            await axios.delete(`${BackendAPI}/user/deleteFacility/${facilityId}`, {
                headers: {
                    Authorization: `Bearer ${token}` // Include the token in the Authorization header
                }
            });

            SweetAlert.fire({
                title: 'Success!',
                text: 'Facility removed successfully!',
                icon: 'success',
                timer: 3000,
                showConfirmButton: false,
                allowOutsideClick: false,
                allowEscapeKey: false
            }).then((result) => {
                if (result.dismiss === SweetAlert.DismissReason.timer) {
                    navigate(`${process.env.PUBLIC_URL}/onsite/manage-facility/Consoft`);
                }
            });
        } catch (error) {
            console.error('Error deleting facility:', error);
        }
    };

    const openDeleteModal = (facilityId, facilityName) => {
        setDeleteFacId(facilityId);
        setDeleteFacName(facilityName); // Set the facility name when opening the modal
        setModal(true);
    };

    const closeDeleteModal = () => {
        setDeleteFacId(null);
        setDeleteFacName('');  // Reset the facility name
        setModal(false);
    };

    const handleCreateFacilityClick = () => {
        if (catid.length === 0) {
            SweetAlert.fire({
                title: 'Warning!',
                text: 'Create category first',
                icon: 'question',
                timer: 3000,
                showConfirmButton: false,
                allowOutsideClick: false,
                allowEscapeKey: false
            }).then((result) => {
                if (result.dismiss === SweetAlert.DismissReason.timer) {
                    navigate(`${process.env.PUBLIC_URL}/onsite/manage-category/Consoft`);
                }
            });
        } else {
            navigate(`${process.env.PUBLIC_URL}/onsite/create-facility/Consoft`);
        }
    };





    return (
        <Fragment>
            <Breadcrumbs mainTitle={
                <>
                    Manage Facility
                    <MdInfoOutline
                        id="facilityPopover"
                        style={{
                            cursor: 'pointer', position: 'absolute', marginLeft: '5px'
                        }}
                    />
                    <UncontrolledPopover
                        placement="bottom"
                        target="facilityPopover"
                        trigger="focus"
                    >
                        <PopoverBody>
                            Create and manage event facilities, such as check-in facilitiy and more. <br />
                            Facilities can be easily edited, changed status between <span className="text-success">Active</span> or <span className="text-danger">Inactive</span> and
                            switch the access type between <strong>Daywise</strong> (available for all event days) and <strong>Non-daywise</strong> (available only once during the entire event).
                        </PopoverBody>
                    </UncontrolledPopover>
                </>
            } parent="Onsite App" title="Manage Facility" />
            <Container fluid={true}>
                <Row>
                    <Col sm="12">
                        <Card>
                            {/* <CardHeader className="d-flex justify-content-between align-items-center flex-column flex-md-row">
                                <div className="mb-2 mb-md-0">
                                    <h5 className="mb-2">Facilities</h5>
                                    <Input
                                        placeholder="Search all columns"
                                        onChange={e => handleSearch(e.target.value)}
                                        style={{ width: 200 }}
                                    />

                                </div>
                                {FacilityPermissions?.add === 1 && (
                                    <div className="mt-2 mt-md-0">
                                        <Button color="warning" onClick={handleCreateFacilityClick}>Create Facility</Button>
                                    </div>
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
                                                placeholder="Search Facility"
                                                onChange={e => handleSearch(e.target.value)}
                                            // style={{ borderRadius: '20px' }}
                                            />
                                        </InputGroup>
                                    </div>
                                    <div className="text-md-end w-100 mt-2 mt-md-0 text-end text-wrap">
                                        {FacilityPermissions?.add === 1 && (
                                            // <Button onClick={handleCreateFacilityClick} color='warning'>
                                            //     Create Facility
                                            // </Button>
                                            <>
                                                <Button
                                                    color=""
                                                    className='circular'
                                                    onClick={handleCreateFacilityClick} data-tooltip-id="create"
                                                >
                                                    <FaPlus
                                                        className='buttonStyle'
                                                    />

                                                </Button>
                                                <Tooltip id="create" place="top" effect="solid">
                                                    Create Facility
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
                                        <p className='text-center'>No facility found</p>
                                    ) : (
                                        <Table>
                                            <thead>
                                                <tr className='border-bottom-primary'>
                                                    <th scope='col' className='text-start'>{'Sr No.'}</th>
                                                    <th scope='col' className='text-start' onClick={() => handleSort('cs_display_name')}>
                                                        {'Facility Name'}
                                                        {getSortIndicator('cs_display_name')}
                                                    </th>
                                                    {/* <th scope='col'>{'Facility Name'}</th> */}
                                                    <th scope='col' className='text-center' onClick={() => handleSort('cs_type')}>
                                                        {'Type'}
                                                        {getSortIndicator('cs_type')}
                                                    </th>
                                                    {/* <th scope='col'>{'Type'}</th> */}
                                                    <th scope='col' className='text-center'>{'Icon'}</th>
                                                    <th scope='col'>{'Daywise'}</th>
                                                    <th scope='col' className='text-center' onClick={() => handleSort('cs_status')}>
                                                        {'Status'}
                                                        {getSortIndicator('cs_status')}
                                                    </th>
                                                    {/* <th scope='col' className='text-center'>{'Status'}</th> */}
                                                    {FacilityPermissions?.edit === 1 || FacilityPermissions?.delete === 1 ? (
                                                        <th scope='col' className='text-end'>{'Action'}</th>
                                                    ) : null}
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {data.map((item, index) => (
                                                    <tr key={index} className="border-bottom-primary">
                                                        <td className='text-start'>{(currentPage - 1) * pageSize + index + 1}</td> {/* Calculate the serial number based on the current page and page size */}
                                                        <td className='text-start'>{item.cs_display_name}</td>
                                                        <td className='text-center'>{item.cs_type}</td>
                                                        <td className='text-center'>
                                                            <img
                                                                src={`${BackendPath}${item.cs_logo_image_url}`}
                                                                alt="Logo"
                                                                className="img-fluid mr-2 "
                                                                style={{ maxWidth: '30px' }} // Set the maximum width dynamically
                                                            />
                                                            {/* <img
                                                                src={`${BackendPath}${item.cs_logo_darkmode_image_url}`}
                                                                alt="Logo"
                                                                className="img-fluid mr-2 bg-dark"
                                                                style={{ maxWidth: '30px' }} // Set the maximum width dynamically
                                                            /> */}
                                                            {/* <img src={item.logo_darkmode_image_url} alt="Logo" className="img-fluid" style={{ maxWidth: '30px', backgroundColor: 'black' }} /> */}

                                                        </td>

                                                        <td>
                                                            <Media body className="icon-state switch-sm">
                                                                <Label className="switch">
                                                                    <Input
                                                                        type="checkbox"
                                                                        checked={item.cs_daywise === 'Yes'}
                                                                        onChange={() => {
                                                                           
                                                                                toggleModal(item.cs_facility_id, item.cs_daywise, item.cs_display_name);
                                                                            
                                                                        }}
                                                                        // disabled={item.cs_type === 'workshop'}
                                                                     
                                                                    />



                                                                    <span className={"switch-state " + (item.cs_daywise === 'Yes' ? "bg-success" : "bg-danger")}></span>
                                                                </Label>
                                                            </Media>
                                                        </td>

                                                        <td className='text-center'>
                                                            {item.cs_status === 0 ? (
                                                                <span style={{ color: 'red', fontSize: '20px', cursor: "pointer" }}
                                                                    onClick={() => openStatusModal(item.cs_facility_id, item.cs_status, item.cs_display_name)}
                                                                    data-tooltip-id="tooltip"
                                                                    data-tooltip-content="Inactive status"
                                                                    data-tooltip-event="click focus">
                                                                    <GoDotFill />
                                                                </span>
                                                            ) : (
                                                                <span
                                                                    style={{ color: 'green', fontSize: '20px', cursor: "pointer" }}
                                                                    onClick={() => openStatusModal(item.cs_facility_id, item.cs_status, item.cs_display_name)}
                                                                    data-tooltip-id="tooltip"
                                                                    data-tooltip-content="Active status"
                                                                    data-tooltip-event="click focus">
                                                                    <GoDotFill />
                                                                </span>
                                                            )}
                                                            <Tooltip id="tooltip" globalEventOff="click" />

                                                        </td>


                                                        {/* <td className='text-center'>
                                                            {item.cs_status === 0 ? (
                                                                <span style={{ color: 'red', fontSize: '20px', cursor: "pointer" }}
                                                                    onClick={() => openStatusModal(item.cs_facility_id, item.cs_status, item.cs_display_name)}
                                                                    data-tooltip-id="tooltip"
                                                                    data-tooltip-content="Inactive status"
                                                                    data-tooltip-event="click focus">
                                                                    <GoDotFill />
                                                                </span>
                                                            ) : (
                                                                <span style={{ color: 'green', fontSize: '20px', cursor: "pointer" }}
                                                                    onClick={() => openStatusModal(item.cs_facility_id, item.cs_status, item.cs_display_name)}
                                                                    data-tooltip-id="tooltip"
                                                                    data-tooltip-content="Active status"
                                                                    data-tooltip-event="click focus">
                                                                    <GoDotFill />
                                                                </span>
                                                            )}
                                                        </td> */}

                                                        {/* <td className='text-center'>
                                                            {item.cs_status === 0 ? (
                                                                <span
                                                                    style={{ color: 'red', fontSize: '20px', cursor: "pointer" }}
                                                                    onClick={() => openStatusModal(item.cs_facility_id, item.cs_status, item.cs_display_name)}
                                                                    data-tooltip-id="tooltip"
                                                                    data-tooltip-content="Inactive status"
                                                                    data-tooltip-event="click focus"
                                                                >
                                                                    <GoDotFill />
                                                                </span>
                                                            ) : (
                                                                <span
                                                                    style={{ color: 'green', fontSize: '20px', cursor: "pointer" }}
                                                                    onClick={() => openStatusModal(item.cs_facility_id, item.cs_status, item.cs_display_name)}
                                                                    data-tooltip-id="tooltip"
                                                                    data-tooltip-content="Active status"
                                                                    data-tooltip-event="click focus"
                                                                >
                                                                    <GoDotFill />
                                                                </span>
                                                            )}
                                                            <Tooltip id="tooltip" globalEventOff="click" />
                                                        </td> */}


                                                        {FacilityPermissions?.edit === 1 || FacilityPermissions?.delete === 1 ? (
                                                            <td className='text-end'>
                                                                {/* {FacilityPermissions?.edit === 1 && (
                                                                    <Button color="primary" size="sm" onClick={() => editFacility(item)}
                                                                        data-tooltip-id="tooltip"
                                                                        data-tooltip-content="Edit Facility"
                                                                        data-tooltip-event="click focus"
                                                                    >
                                                                        <FaEdit /> 
                                                                    </Button>
                                                                )}
                                                                {FacilityPermissions?.delete === 1 && (
                                                                    <Button color="danger" size="sm" onClick={() => openDeleteModal(item.cs_facility_id, item.cs_display_name)}
                                                                        data-tooltip-id="tooltip"
                                                                        data-tooltip-content="Delete Facility"
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
                <div>
                    {message && <DismissibleNotification message={message} onClose={() => setMessage('')} />}
                    {/* Your form and other components */}
                </div>
            </Container>
            <ToastContainer />


            <Modal isOpen={modalOpen} toggle={toggleModal} centered size='md'>
                <ModalHeader toggle={toggleModal}>Confirmation: Daywise Status Change</ModalHeader>
                <ModalBody>
                    <div className='ms-2'>
                        <p>Are you sure you want to change the daywise status for {deleteFacName}?</p>
                    </div>
                </ModalBody>
                <ModalFooter>
                    <Button color="primary" onClick={() => {
                        handleDaywiseToggle(selectedFacilityId, selectedDaywiseStatus === 'Yes' ? 'No' : 'Yes');
                        setModalOpen(false);
                    }}>Yes</Button>
                    <Button color="warning" onClick={toggleModal}>Cancel</Button>
                </ModalFooter>
            </Modal>


            {/* Delete Confirmation Modal */}
            <Modal isOpen={modal} toggle={closeDeleteModal} centered size="md">
                <ModalHeader toggle={closeDeleteModal}>Confirmation: Delete Facility</ModalHeader>
                <ModalBody>
                    <div className='ms-2'>
                        <p>Are you sure you want to delete <strong>{deleteFacName}</strong> facility ?</p>
                    </div>
                </ModalBody>
                <ModalFooter>
                    <Button color="primary" onClick={() => handleDelete(deleteFacId)}>Yes</Button>
                    <Button color="warning" onClick={closeDeleteModal}>No</Button>
                </ModalFooter>
            </Modal>

            {/* Status Change Confirmation Modal */}
            <Modal isOpen={statusModalOpen} toggle={closeStatusModal} centered size='md'>
                <ModalHeader toggle={closeStatusModal}>Confirmation: Status Change</ModalHeader>
                <ModalBody>
                    <div className='ms-2'>
                        <p>Are you sure you want to change the status of <strong>{deleteFacName}</strong> to {currentStatus === 0 ? "Active" : "Inactive"}?</p>
                    </div>
                </ModalBody>
                <ModalFooter>
                    <Button color="primary" onClick={() => {
                        handleStatusUpdate(deleteFacId, currentStatus, deleteFacName);
                        closeStatusModal();
                    }}>
                        Yes
                    </Button>
                    <Button color="warning" onClick={closeStatusModal}>No</Button>
                </ModalFooter>
            </Modal>
        </Fragment>
    );
};

export default Facility;
