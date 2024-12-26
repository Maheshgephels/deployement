import React, { Fragment, useEffect, useState, useContext } from 'react';
import { Container, Row, Col, Card, Table, CardHeader, CardBody, Input, Button, Modal, ModalHeader, ModalFooter, ModalBody, Form, FormGroup, Label, PopoverBody, UncontrolledPopover, InputGroup, InputGroupText } from 'reactstrap';
import { Breadcrumbs } from '../../AbstractElements';
import axios from 'axios';
import { BackendAPI, BackendPath } from '../../api';
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
import { Button as B, Dropdown as D, Menu } from 'antd';
import useAuth from '../../Auth/protectedAuth';

const ManageLocation = () => {
    useAuth();
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [mapedid, setMapedid] = useState([]);
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
    const [LocationIdToUpdate, setLocationIdToUpdate] = useState(null); // Location ID to update status
    const [LocationName, setLocationName] = useState(null);
    const [currentStatus, setCurrentStatus] = useState(null);
    const [deleteLocationDetails, setDeleteLocationDetails] = useState({ LocationId: null, facilityId: null }); // New state for delete Location details
    const navigate = useNavigate();
    const { permissions } = useContext(PermissionsContext);
    const [uploadModalOpen, setUploadModalOpen] = useState(false); // State for upload modal visibility
    const [selectedFile, setSelectedFile] = useState(null);
    const [existingImage, setExistingImage] = useState(null);
    const isIdMatched = mapedid.includes(LocationIdToUpdate);

    console.log("Mapped Id:", mapedid);
    console.log("Data", data);

    useEffect(() => {
        fetchLocation();
        fetchMappedid();
    }, [currentPage, pageSize, searchText, permissions]);

    // Extract Locations component
    const LocationsPermissions = permissions['ManageLocation'];
      // Extract floor map component
  const FloorPlanPermissions = permissions['FloorPlanEditor'];

    const fetchLocation = async () => {
        try {
            const token = getToken();
            // const Response = await axios.get(`${BackendAPI}/Location/getLocation?page=${currentPage}&pageSize=${pageSize}&search=${searchText}`, {
            //     headers: {
            //         Authorization: `Bearer ${token}` // Include the token in the Authorization header
            //     }
            // });
            const Response = await axios.get(`${BackendAPI}/Location/getLocation`, {
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
            console.log("Location data", Response.data);
            setData(Response.data.categories);
            setTotalItems(Response.data.totalItems);
            setCatIds(catIds);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching data:', error);
            setLoading(false);
        }
    };


    const fetchMappedid = async () => {
        try {
            const token = getToken();
            const Response = await axios.get(`${BackendAPI}/Location/getMappedid`, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
            console.log("Location data", Response.data);
            setMapedid(Response.data.mapedid)
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
        fetchLocation(); // Fetch the data again with the updated sorting
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

        ...(LocationsPermissions?.edit === 1
            ? [{
                key: '1',
                label: (
                    <div onClick={() => handleEdit(item)}>
                        <FaEdit /> Edit Details
                    </div>
                ),
            }]
            : []
        ),

        ...(LocationsPermissions?.delete === 1
            ? [{
                key: '2',
                label: (
                    <div onClick={() => openDeleteModal(item.id, item.location_name)}>
                        <MdDelete /> Delete Location
                    </div>
                ),
            }]
            : []
        ),
        // Add more options if needed
    ];


    const handleEdit = async (item) => {
        const URL = '/event/edit-Location/';
        navigate(`${process.env.PUBLIC_URL}${URL}${layoutURL}`, { state: { item } });
    };

    const handleDelete = async () => {
        try {
            const { LocationId } = deleteLocationDetails;
            const token = getToken();
            await axios.delete(`${BackendAPI}/Location/deleteLocation`, {
                headers: {
                    Authorization: `Bearer ${token}` // Include the token in the Authorization header
                },
                data: { LocationId } // Include the data payload correctly
            });
            SweetAlert.fire({
                title: 'Success!',
                text: 'Location removed successfully!',
                icon: 'success',
                timer: 3000,
                showConfirmButton: false,
                allowOutsideClick: false,
                allowEscapeKey: false
            }).then((result) => {
                if (result.dismiss === SweetAlert.DismissReason.timer) {
                    navigate(`${process.env.PUBLIC_URL}/event/manage-Location/Consoft`);
                }
            });
            fetchLocation(); // Fetch updated Location list
        } catch (error) {
            console.error('Error deleting Location:', error);
        }
        setModal(false); // Close modal after deletion
    };


    const openStatusModal = (LocationId, currentStatus, LocationName) => {
        setLocationIdToUpdate(LocationId);
        setLocationName(LocationName);
        setCurrentStatus(currentStatus);
        setStatusModalOpen(true);
    };


    const closeStatusModal = () => {
        setStatusModalOpen(false);
    };

    const handleFileChange = (event) => {
        setSelectedFile(event.target.files[0]);
    };

    const handleStatusUpdate = async () => {
        const LocationId = LocationIdToUpdate;
        const currentLocation = data.find(Location => Location.id === LocationId);
        if (!currentLocation) return;
        const currentStatus = currentLocation.status;
        const newStatus = currentStatus === 0 ? 1 : 0;
        try {
            const token = getToken();
            await axios.put(`${BackendAPI}/Location/UpdateStatus`, { LocationId, status: newStatus }, {
                headers: {
                    Authorization: `Bearer ${token}` // Include the token in the Authorization header
                }
            });
            const updatedLocations = data.map((Location) =>
                Location.id === LocationId ? { ...Location, status: newStatus } : Location
            );
            setData(updatedLocations);
        } catch (error) {
            console.error('Error updating status:', error);
        }
        closeStatusModal(); // Close modal after status update
    };

    const openDeleteModal = (LocationId, LocationName) => {
        setDeleteLocationDetails({ LocationId });
        setLocationName(LocationName);
        setModal(true);
    };

    const closeDeleteModal = () => {
        setModal(false);
    };

    const handleNavigation = () => {
        navigate(`${process.env.PUBLIC_URL}/event/add-Location/Consoft`);
    };

    const closeUploadModal = () => {
        setUploadModalOpen(false); // Close the upload modal
    };

    const handleFileUpload = async () => {
        if (!selectedFile) return;
        const formData = new FormData();
        formData.append('file', selectedFile);
        try {
            const token = getToken();
            await axios.post(`${BackendAPI}/Location/uploadImage`, formData, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'multipart/form-data'
                }
            });
            SweetAlert.fire({
                title: 'Success!',
                text: 'Image uploaded successfully!',
                icon: 'success',
                timer: 3000,
                showConfirmButton: false,
                allowOutsideClick: false,
                allowEscapeKey: false
            });
            setUploadModalOpen(false); // Close the upload modal
            setSelectedFile(null); // Clear the selected file
        } catch (error) {
            console.error('Error uploading file:', error);
        }
    };

    const handleNavigationforimage = async (LocationId) => {
        navigate(`${process.env.PUBLIC_URL}/event/floor-map/Consoft`);
    };


    // Icon mapping based on shape_type
    const iconMapping = {
        1: `${BackendPath}map-assets/location.png`,
        2: `${BackendPath}map-assets/square.png`,
        3: `${BackendPath}map-assets/circle.png`,
        4: `${BackendPath}map-assets/pin.png`,
    };


    return (
        <Fragment>
            <Breadcrumbs mainTitle={
                <>
                    Manage Location
                    <MdInfoOutline
                        id="locatPopover"
                        style={{
                            cursor: 'pointer', position: 'absolute', marginLeft: '5px'
                        }}
                    />
                    <UncontrolledPopover
                        placement="bottom"
                        target="locatPopover"
                        trigger="focus"
                    >
                        <PopoverBody>
                            Create locations and link them to the floor map. This makes it easier for users to find sponsor booths and activities throughout your venue.
                            Spend less time guiding and more time engaging! <br />
                            All the active locations will be displayed while locating the locations on the floor Map and floor map. <br />
                            You can edit the loaction and manage the status as <span className="text-success">Active</span> / <span className="text-danger">Inactive</span> as needed.
                        </PopoverBody>
                    </UncontrolledPopover>
                </>
            } parent="Event App Admin" title="Manage Location" />
            <Container fluid={true}>
                <Row>
                    <Col sm="12">
                        <Card>
                            {/* <CardHeader className="d-flex justify-content-between align-items-center flex-column flex-md-row">
                                <div className="mb-2 mb-md-0">
                                    <h5 className="mb-2 text-start">Locations</h5>
                                    <Input
                                        placeholder="Search Location"
                                        onChange={e => handleSearch(e.target.value)}
                                        style={{ width: 200 }}
                                    />
                                </div>
                                {LocationsPermissions?.add === 1 && (
                                    <button onClick={handleNavigation} className="btn btn-warning">
                                        Create Location
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
                                                placeholder="Search Location"
                                                onChange={e => handleSearch(e.target.value)}
                                            // style={{ borderRadius: '20px' }}
                                            />
                                        </InputGroup>
                                    </div>

                                    <div className="text-md-end w-100 mt-2 mt-md-0 text-end text-wrap">
                                        {FloorPlanPermissions?.view === 1 && (
                                            // <Button onClick={handleNavigationforimage} color='warning' className='m-3'>
                                            //     Floor Map
                                            // </Button>
                                            <>
                                                <Button
                                                    color=""
                                                    className='circular'
                                                    onClick={handleNavigationforimage} data-tooltip-id="floormap"
                                                >
                                                    <FaMapMarkedAlt
                                                        className='buttonStyle'
                                                    />

                                                </Button>
                                                <Tooltip id="floormap" place="top" effect="solid">
                                                    Floor Map
                                                </Tooltip>
                                            </>
                                        )}

                                        {LocationsPermissions?.add === 1 && (
                                            // <Button onClick={handleNavigation} color='warning'>
                                            //     Create Location
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
                                                    Create Location
                                                </Tooltip>
                                            </>
                                        )}
                                    </div >
                                </div>

                            </CardHeader>
                            <CardBody>
                                <div className='table-responsive'>
                                    {loading ? (
                                        <p>Loading...</p>
                                    ) : data.length === 0 ? (
                                        <p className='text-center'>No location found</p>
                                    ) : (
                                        <Table>
                                            <thead>
                                                <tr className='border-bottom-primary'>
                                                    <th scope='col' className='text-start'>{'Sr No.'}</th>
                                                    <th scope='col' className='text-start' onClick={() => handleSort('location_name')}>
                                                        {'Location Name'}
                                                        {getSortIndicator('location_name')}
                                                    </th>
                                                    {/* <th scope='col' className='text-start'>{'Location Name'}</th> */}
                                                    <th scope='col' className='text-start' onClick={() => handleSort('exh_type')}>
                                                        {'Exhibitor'}
                                                        {getSortIndicator('exh_type')}
                                                    </th>
                                                    {/* <th scope='col' className='text-start'>{'Exhibitor'}</th> */}
                                                    <th scope='col' className='text-center'>{'Used Icon'}</th>
                                                    <th scope='col' className='text-center' onClick={() => handleSort('status')}>
                                                        {'Status'}
                                                        {getSortIndicator('status')}
                                                    </th>
                                                    {/* <th scope='col' className='text-center'>{'Status'}</th> */}
                                                    {LocationsPermissions?.edit === 1 || LocationsPermissions?.delete === 1 ? (
                                                        <th scope='col' className='text-end'>Action</th>
                                                    ) : null}
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {data.map((item, index) => (
                                                    <tr key={index} className="border-bottom-primary">
                                                        <td className='text-start'>{(currentPage - 1) * pageSize + index + 1}</td>
                                                        <td className='text-start'>{item.location_name}</td>
                                                        <td className='text-start'>{item.exh_type}</td>
                                                        <td className='text-center'>
                                                            {iconMapping[item.shape_type] && (
                                                                <img src={iconMapping[item.shape_type]} alt="icon" style={{ width: '20px', height: '20px' }} />
                                                            )}
                                                        </td>                                                        {/* <td className='text-start'>{item.posted_by}</td> */}
                                                        <td className='text-center'>
                                                            {item.status === 0 || item.status === "0" ? (
                                                                <span style={{ color: 'red', fontSize: '20px', cursor: "pointer" }}
                                                                    onClick={() => openStatusModal(item.id, item.status, item.location_name)}
                                                                    data-tooltip-id="tooltip"
                                                                    data-tooltip-content="Inactive status"
                                                                    data-tooltip-event="click focus">
                                                                    <GoDotFill />
                                                                </span>
                                                            ) : (
                                                                <span
                                                                    style={{ color: 'green', fontSize: '20px', cursor: "pointer" }}
                                                                    onClick={() => openStatusModal(item.id, item.status, item.location_name)}
                                                                    data-tooltip-id="tooltip"
                                                                    data-tooltip-content="Active status"
                                                                    data-tooltip-event="click focus">
                                                                    <GoDotFill />
                                                                </span>
                                                            )}
                                                            <Tooltip id="tooltip" globalEventOff="click" />
                                                        </td>
                                                        {LocationsPermissions?.edit === 1 || LocationsPermissions?.delete === 1 ? (
                                                            <td className='text-end'>
                                                                <Tooltip id="tooltip" globalEventOff="click" />
                                                                {/* {LocationsPermissions?.edit === 1 && (
                                                                    <Button color="primary" size="sm" onClick={() => handleEdit(item)}
                                                                        data-tooltip-id="tooltip"
                                                                        data-tooltip-content="Edit Details"
                                                                        data-tooltip-event="click focus" >
                                                                        <FaEdit />
                                                                    </Button>
                                                                )}
                                                                {LocationsPermissions?.delete === 1 && (
                                                                    <Button color="danger" size="sm" onClick={() => openDeleteModal(item.id, item.location_name)}
                                                                        data-tooltip-id="tooltip"
                                                                        data-tooltip-content="Delete Location"
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
                            <p>Are you sure you want to change the status of <strong>{LocationName}</strong> to {currentStatus === 0 ? "Active" : "Inactive"}?</p>
                        )}
                        {isIdMatched && (
                            <p>
                                <strong>{LocationName}</strong> is currently displayed on the floor map. Are you sure you want to change its status to {currentStatus === 0 ? "Active" : "Inactive"}? This action will permanently remove the location from the floor map.
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
                        <p><strong>Alert: Deleting Location</strong></p>
                        <p>Are you sure you want to delete <strong>{LocationName}</strong> Location? This change will remove the location from the floor map.</p>
                    </div>
                </ModalBody>
                <ModalFooter>
                    <Button color="primary" onClick={handleDelete}>Yes</Button>
                    <Button color="warning" onClick={closeDeleteModal}>No</Button>
                </ModalFooter>
            </Modal>

            <Modal isOpen={uploadModalOpen} toggle={closeUploadModal}>
                <ModalHeader toggle={closeUploadModal}>Upload Venue Image</ModalHeader>
                <ModalBody>
                    {existingImage && (
                        <div className="mb-3">
                            <img src={existingImage} alt="Existing Venue" style={{ width: '100%' }} />
                        </div>
                    )}
                    <Form>
                        <FormGroup>
                            <Label for="file">Select Image</Label>
                            <Input type="file" name="file" id="file" onChange={handleFileChange} />
                        </FormGroup>
                    </Form>
                </ModalBody>
                <ModalFooter>
                    <Button color="primary" onClick={handleFileUpload}>Upload</Button>{' '}
                    <Button color="secondary" onClick={closeUploadModal}>Cancel</Button>
                </ModalFooter>
            </Modal>
        </Fragment>
    );
};

export default ManageLocation;
