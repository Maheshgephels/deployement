import React, { Fragment, useEffect, useState, useContext, useRef } from 'react';
import { Container, Label, Row, Col, Card, Table, CardHeader, CardBody, Input, Button, Modal, ModalHeader, ModalFooter, ModalBody, PopoverBody, UncontrolledPopover, InputGroup, InputGroupText } from 'reactstrap';
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
import { MdDelete, MdInfoOutline } from "react-icons/md";
import { Pagination } from 'antd';
import CustomizerContext from '../../_helper/Customizer';
import { Tooltip } from 'react-tooltip';
import { classes } from '../../Data/Layouts';
import { PermissionsContext } from '../../contexts/PermissionsContext';
import { getToken } from '../../Auth/Auth';
import useAuth from '../../Auth/protectedAuth';
import { toast } from 'react-toastify';
import { Button as B, Dropdown as D, Menu } from 'antd';
import { SiEsbuild } from "react-icons/si";

const Workshop = () => {
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
    const [isWarningModalOpen, setWarningModalOpen] = useState(false);
    const [workshopIdToUpdate, setWorkshopIdToUpdate] = useState(null); // Workshop ID to update status
    const [workshopName, setWorkshopName] = useState(null);
    const [currentStatus, setCurrentStatus] = useState(null);
    const [deleteWorkshopDetails, setDeleteWorkshopDetails] = useState({ workshopId: null, facilityId: null }); // New state for delete workshop details
    const navigate = useNavigate();
    const { permissions } = useContext(PermissionsContext);
    const [isProcessing, setIsProcessing] = useState(false);
    const [message, setMessage] = useState('');
    const [files, setFiles] = useState({ brightModeIcon: '', darkModeIcon: '' });
    const [selectedFile, setSelectedFile] = useState(null);
    const [imageError, setImageError] = useState('');
    const [iconPreviewUrl, setIconPreviewUrl] = useState(null);
    const iconAvailableRef = useRef(null);
    const [workshopId, setWorkshopId] = useState(null);
    const [filemodal, setfilemodal] = useState(false);

    console.log("Data", data);

    const toggleModal = () => setfilemodal(!filemodal);

    const handleImageChange = (event) => {
        const file = event.target.files[0];
        if (file) {
            const fileType = file.type.split('/')[1].toLowerCase();
            const validTypes = ['png'];
            if (!validTypes.includes(fileType)) {
                setImageError('Only PNG files are allowed.');
                setSelectedFile(null);
                return;
            }
            setImageError('');
            setSelectedFile(file);
            setIconPreviewUrl(URL.createObjectURL(file));
        }
    };

    const handlegenrate = (workshopId, workshopName) => {
        // Open the modal to select the file first
        setWorkshopId(workshopId);
        setWorkshopName(workshopName);
        toggleModal();

    };

    const handleProceed = () => {
        if (!selectedFile) {
            setImageError('Please select a file before proceeding.');
            return;
        }

        // Proceed to submit form data
        const formData = {}; // Gather other form data here
        formData.dName = workshopName;
        // Include the selected file
        formData.brightModeIcon = selectedFile;

        onSubmit(formData, workshopId, workshopName);
        toggleModal(); // Close the modal after proceeding
    };

    const onSubmit = async (formData, workshopId, workshopName) => {
        try {
            // Include the current timestamp in the formData
            formData.datetime = new Date().toISOString();

            // Assign "No" for the `daywise` field
            formData.daywise = "No";
            formData.facilityType = "workshop";

            // Create FormData object for facility submission
            const formDataToSend = new FormData();
            Object.keys(formData).forEach(key => {
                if (formData[key] !== undefined) {
                    formDataToSend.append(key, formData[key]);
                }
            });

            // Add file to formData
            // formDataToSend.append('brightModeIcon', formData.brightModeIcon);

            // Send Facility Data
            const token = getToken();
            await axios.post(`${BackendAPI}/user/storeFacilityType`, formDataToSend, {
                headers: {
                    Authorization: `Bearer ${token}` // Include token for authentication
                }
            });


            setSelectedFile(null);

            // Second part of submission: Workshop creation
            const workshopData = {
                ...formData,
                spot: formData.spot ? "1" : "0", // Spot field, if applicable
                cs_workshop_id: workshopId,      // Add workshop ID
                cs_workshop_name: workshopName   // Add workshop name
            };

            await axios.post(`${BackendAPI}/workshop/gnratefacility`, workshopData, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            SweetAlert.fire({
                title: 'Success!',
                html: `Facility access for <strong>${workshopName}</strong> created successfully.`,
                icon: 'success',
                timer: 3000,
                showConfirmButton: false,
                allowOutsideClick: false,
                allowEscapeKey: false
            }).then((result) => {
                if (result.dismiss === SweetAlert.DismissReason.timer) {
                    navigate(`${process.env.PUBLIC_URL}/onsite/manage-workshop/Consoft`);
                }
            });

        } catch (error) {
            console.error('Error creating facility or workshop:', error.message);
            SweetAlert.fire({
                title: 'Error!',
                text: error.message || 'An error occurred while creating the workshop.',
                icon: 'error',
                timer: 3000,
                showConfirmButton: false
            });
        }
    };


    console.log("Workshop Data", data);


    useEffect(() => {
        fetchWorkshop();
    }, [currentPage, pageSize, searchText, permissions]);

    // Extract Workshops component
    const WorkshopsPermissions = permissions['Workshop'];

    const fetchWorkshop = async () => {
        try {
            const token = getToken();
            // const Response = await axios.get(`${BackendAPI}/workshop/getWorkshop?page=${currentPage}&pageSize=${pageSize}&search=${searchText}`, {
            //     headers: {
            //         Authorization: `Bearer ${token}` // Include the token in the Authorization header
            //     }
            // });
            const Response = await axios.get(`${BackendAPI}/workshop/getWorkshop`, {
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
        fetchWorkshop(); // Fetch the data again with the updated sorting
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
        ...(WorkshopsPermissions?.edit === 1
            ? [{
                key: '1',
                label: (
                    <div onClick={() => handleEdit(item.cs_workshop_id, item.cs_workshop_name)}>
                        <FaEdit /> Edit Workshop
                    </div>
                ),
            }]
            : []
        ),

        // Conditionally render the generate option if WorkshopsPermissions?.edit === 1 and facility_id is 0
        ...(WorkshopsPermissions?.edit === 1 && item.cs_facility_id === 0
            ? [{
                key: '2',
                label: (
                    <div onClick={() => handlegenrate(item.cs_workshop_id, item.cs_workshop_name)}>
                        <SiEsbuild /> Generate as Facility
                    </div>
                ),
            }]
            : []
        ),

        // Conditionally render the delete option if WorkshopsPermissions?.delete === 1
        ...(WorkshopsPermissions?.delete === 1
            ? [{
                key: '3', // Ensure unique key for each option
                label: (
                    <div onClick={item.userCount > 0
                        ? () => openWarningModal(item.cs_workshop_name)
                        : () => openDeleteModal(item.cs_workshop_id, item.cs_facility_id, item.cs_workshop_name)
                    }>
                        <MdDelete /> Delete Workshop
                    </div>
                )
            }]
            : []
        ),
        // Add more options if needed
    ];


    const handleEdit = (workshopId, workshopname) => {
        const URL = '/onsite/edit-workshop/';
        navigate(`${process.env.PUBLIC_URL}${URL}${layoutURL}`, { state: { workshopId, workshopname } });
    };


    const handleDelete = async () => {
        try {
            const { workshopId, facilityId } = deleteWorkshopDetails;
            const token = getToken();
            await axios.delete(`${BackendAPI}/workshop/deleteworkshop`, {
                headers: {
                    Authorization: `Bearer ${token}` // Include the token in the Authorization header
                },
                data: { workshopId, facilityId } // Include the data payload correctly
            });
            SweetAlert.fire({
                title: 'Success!',
                text: 'Workshop removed successfully!',
                icon: 'success',
                timer: 3000,
                showConfirmButton: false,
                allowOutsideClick: false,
                allowEscapeKey: false
            }).then((result) => {
                if (result.dismiss === SweetAlert.DismissReason.timer) {
                    navigate(`${process.env.PUBLIC_URL}/onsite/manage-workshop/Consoft`);
                }
            });
            fetchWorkshop(); // Fetch updated workshop list
        } catch (error) {
            console.error('Error deleting workshop:', error);
        }
        setModal(false); // Close modal after deletion
    };


    const openStatusModal = (workshopId, workshopName, currentStatus) => {
        setWorkshopIdToUpdate(workshopId);
        setWorkshopName(workshopName);
        setCurrentStatus(currentStatus);
        setStatusModalOpen(true);
    };


    const closeStatusModal = () => {
        setStatusModalOpen(false);
    };

    const handleStatusUpdate = async () => {
        closeStatusModal();

        setIsProcessing(true);
        setMessage('The process has started and is running in the background. Once it is completed, we will notify you. In the meantime, you are free to start other processes.');


        setTimeout(() => {
            setMessage('');
        }, 10000);

        const toastId = toast.info('Processing...', { autoClose: false });
        const workshopId = workshopIdToUpdate;
        const currentWorkshop = data.find(workshop => workshop.cs_workshop_id === workshopId);
        if (!currentWorkshop) return;
        const currentStatus = currentWorkshop.cs_status;
        const newStatus = currentStatus === 0 ? 1 : 0;
        try {
            const token = getToken();
            await axios.put(`${BackendAPI}/workshop/UpdateStatus`, { workshopId, status: newStatus, Name: currentWorkshop.cs_workshop_name }, {
                headers: {
                    Authorization: `Bearer ${token}` // Include the token in the Authorization header
                }
            });
            const updatedWorkshops = data.map((workshop) =>
                workshop.cs_workshop_id === workshopId ? { ...workshop, cs_status: newStatus } : workshop
            );

            setData(updatedWorkshops);
            setIsProcessing(false);
            toast.dismiss(toastId);
            toast.success("Status Updated sucessfully");
            // setStatusModal(false);
        } catch (error) {
            console.error('Error updating status:', error);
            toast.dismiss(toastId);
            if (error.response && error.response.status === 503) {
                toast.error("Your request could not be processed at this moment due to ongoing processes in the queue. We will notify you once the process is completed. Please try again later.");
            } else if (error.request) {
                // Request made but no response received
                toast.error('Network error. Please try again later.');
            } else {
                // Something happened in setting up the request
                toast.error('Status are not updated . Please try again later.');
            }
        }
        // Close modal after status update
    };

    const openDeleteModal = (workshopId, facilityId, workshopName) => {
        setDeleteWorkshopDetails({ workshopId, facilityId });
        setWorkshopName(workshopName);
        setModal(true);
    };

    const closeDeleteModal = () => {
        setModal(false);
    };

    const handleNavigation = () => {
        navigate(`${process.env.PUBLIC_URL}/onsite/add-workshop/Consoft`);
    };

    // Function to open the warning modal
    const openWarningModal = (workshopName) => {
        setWorkshopName(workshopName);
        setWarningModalOpen(true);
    };

    // Function to close the warning modal
    const closeWarningModal = () => {
        setWarningModalOpen(false);
    };

    const workshopwiseNavigation = (tname, workshopId) => {
        // Trim spaces and remove any middle spaces, then convert to lowercase and concatenate 'cs_'
        const tbl = `cs_${tname.trim().replace(/\s+/g, '').toLowerCase()}`;
        
        // Build the URL path
        const URL = '/onsite/manage-user/';
        
        // Navigate to the desired page with the new layoutURL and workshopId in the state
        navigate(`${process.env.PUBLIC_URL}${URL}${layoutURL}`, { state: { tbl, workshopId } });
      };
      
      
      




    return (
        <Fragment>
            <Breadcrumbs mainTitle={
                <>
                    Manage Workshop
                    <MdInfoOutline
                        id="workshopPopover"
                        style={{
                            cursor: 'pointer', position: 'absolute', marginLeft: '5px'
                        }}
                    />
                    <UncontrolledPopover
                        placement="bottom"
                        target="workshopPopover"
                        trigger="focus"
                    >
                        <PopoverBody>
                            Create and manage workshops, which will automatically be set up as a facility to manage its allowed count. <br />
                            Workshop can be easily edited and changed status between <span className="text-success">Active</span> or <span className="text-danger">Inactive.</span> <br />
                            The workshop will be displayed in the registration form under the workshop category field.
                        </PopoverBody>
                    </UncontrolledPopover>
                </>
            } parent="Onsite App" title="Manage Workshop" />
            <Container fluid={true}>
                <Row>
                    <Col sm="12">
                        <Card>
                            {/* <CardHeader className="d-flex justify-content-between align-items-center flex-column flex-md-row">
                                <div className="mb-2 mb-md-0">
                                    <h5 className="mb-2 text-start">Workshops</h5>
                                    <Input
                                        placeholder="Search Workshop"
                                        onChange={e => handleSearch(e.target.value)}
                                        style={{ width: 200 }}
                                    />
                                </div>
                                {WorkshopsPermissions?.add === 1 && (
                                    <button onClick={handleNavigation} className="btn btn-warning">
                                        Create Workshop
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
                                                placeholder="Search Workshop"
                                                onChange={e => handleSearch(e.target.value)}
                                            // style={{ borderRadius: '20px' }}
                                            />
                                        </InputGroup>
                                    </div>
                                    <div className="text-md-end w-100 mt-2 mt-md-0 text-end text-wrap">
                                        {WorkshopsPermissions?.add === 1 && (
                                            // <Button onClick={handleNavigation} color='warning'>
                                            //     Create Workshop
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
                                                    Create Workshop
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
                                        <p className='text-center'>No workshop found</p>
                                    ) : (
                                        <Table>
                                            <thead>
                                                <tr className='border-bottom-primary'>
                                                    <th scope='col' className='text-start'>{'Sr No.'}</th>
                                                    <th scope='col' className='text-start' onClick={() => handleSort('cs_workshop_name')}>
                                                        {'Workshop Name'}
                                                        {getSortIndicator('cs_workshop_name')}
                                                    </th>
                                                    <th scope='col' className='text-center' onClick={() => handleSort('tname')}>
                                                        {'Workshop Type'}
                                                        {getSortIndicator('tname')}
                                                    </th>
                                                    <th scope='col' className='text-center' onClick={() => handleSort('userCount')}>
                                                        {'Registered User Count'}
                                                        {getSortIndicator('userCount')}
                                                    </th>
                                                    <th scope='col' className='text-center' onClick={() => handleSort('cs_status')}>
                                                        {'Status'}
                                                        {getSortIndicator('cs_status')}
                                                    </th>
                                                    {WorkshopsPermissions?.edit === 1 || WorkshopsPermissions?.delete === 1 ? (
                                                        <th scope='col' className='text-end'>Action</th>
                                                    ) : null}
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {data.map((item, index) => (
                                                    <tr key={index} className="border-bottom-primary">
                                                        <td className='text-start'>{index + 1}</td>
                                                        <td className='text-start'>{item.cs_workshop_name}</td>
                                                        <td className='text-center'>{item.tname}</td>
                                                        {/* <td className='text-center'>{item.userCount}</td> */}
                                                        <td className='text-center'>
                                                            <Button
                                                                color='link' // Makes it look like a link
                                                                className='p-0' // Removes padding
                                                                style={{ textDecoration: 'none' }} // Inline style to remove underline
                                                                onClick={() => {
                                                                    if (item.userCount > 0) { // Check if userCount is greater than 0
                                                                        workshopwiseNavigation(item.tname, item.cs_workshop_id);
                                                                    }
                                                                }}
                                                            >
                                                                {item.userCount}
                                                            </Button>
                                                        </td>
                                                        <td className='text-center'>
                                                            {item.cs_status === 0 ? (
                                                                <span
                                                                    style={{ color: 'red', fontSize: '20px', cursor: "pointer" }}
                                                                    onClick={item.userCount > 0 ? () => openWarningModal(item.cs_workshop_name) : () => openStatusModal(item.cs_workshop_id, item.cs_workshop_name, item.cs_status)}
                                                                    data-tooltip-id="tooltip"
                                                                    data-tooltip-content={item.userCount > 0 ? "Cannot change status, users registered" : "Inactive status"}
                                                                    data-tooltip-event="click focus"
                                                                >
                                                                    <GoDotFill />
                                                                </span>
                                                            ) : (
                                                                <span
                                                                    style={{ color: 'green', fontSize: '20px', cursor: "pointer" }}
                                                                    onClick={item.userCount > 0 ? () => openWarningModal(item.cs_workshop_name) : () => openStatusModal(item.cs_workshop_id, item.cs_workshop_name, item.cs_status)}
                                                                    data-tooltip-id="tooltip"
                                                                    data-tooltip-content={item.userCount > 0 ? "Cannot change status, users registered" : "Active status"}
                                                                    data-tooltip-event="click focus"
                                                                >
                                                                    <GoDotFill />
                                                                </span>
                                                            )}
                                                            <Tooltip id="tooltip" globalEventOff="click" />
                                                        </td>
                                                        {WorkshopsPermissions?.edit === 1 || WorkshopsPermissions?.delete === 1 ? (
                                                            <td className='text-end'>
                                                                <Tooltip id="tooltip" globalEventOff="click" />
                                                                {/* {WorkshopsPermissions?.edit === 1 && (
                                                                    <Button color="primary" size="sm" onClick={() => handleEdit(item.cs_workshop_id, item.cs_workshop_name)}
                                                                        data-tooltip-id="tooltip"
                                                                        data-tooltip-content="Edit Details"
                                                                        data-tooltip-event="click focus" >
                                                                        <FaEdit />
                                                                    </Button>
                                                                )}

                                                                {item.cs_facility_id === 0 && (
                                                                    <Button
                                                                        color="secondary" // Fixed the typo here
                                                                        size="sm"
                                                                        onClick={() => handlegenrate(item.cs_workshop_id, item.cs_workshop_name)}
                                                                        data-tooltip-id="tooltip"
                                                                        data-tooltip-content="Genrate as Faclility"
                                                                        data-tooltip-event="click focus"
                                                                    >
                                                                        <SiEsbuild />
                                                                    </Button>
                                                                )}

                                                                {WorkshopsPermissions?.delete === 1 && (
                                                                    <Button color="danger" size="sm"
                                                                        onClick={item.userCount > 0 ? () => openWarningModal(item.cs_workshop_name) : () => openDeleteModal(item.cs_workshop_id, item.cs_facility_id, item.cs_workshop_name)}
                                                                        data-tooltip-id="tooltip"
                                                                        data-tooltip-content={item.userCount > 0 ? "Cannot delete, users registered" : "Delete Workshop"}
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
                        <p>Are you sure you want to change the status of {workshopName} to {currentStatus === 0 ? "Active" : "Inactive"}?</p>
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
                        <p>Are you sure you want to delete {workshopName} Workshop?</p>
                    </div>
                </ModalBody>
                <ModalFooter>
                    <Button color="primary" onClick={handleDelete}>Yes</Button>
                    <Button color="warning" onClick={closeDeleteModal}>No</Button>
                </ModalFooter>
            </Modal>
            {/* Inactive Confirmation Modal */}
            <Modal isOpen={isWarningModalOpen} toggle={closeWarningModal} centered size="md">
                <ModalHeader toggle={closeWarningModal}>Warning</ModalHeader>
                <ModalBody>
                    <div className='ms-2'>
                        <p><strong>{workshopName}</strong> workshop contains registered users. First, replace them, then you can edit the workshop.</p>
                    </div>
                </ModalBody>
                <ModalFooter>
                    <Button color="warning" onClick={closeWarningModal}>Close</Button>
                </ModalFooter>
            </Modal>


            <Modal isOpen={filemodal} toggle={toggleModal}>
                <ModalHeader toggle={toggleModal}>Upload Facility Icon</ModalHeader>
                <ModalBody>
                    <Label for="brightModeIcon">
                        <strong>Facility Icon <span className="red-asterisk">*</span></strong>
                    </Label>
                    <Input
                        type="file"
                        name="brightmode"
                        onChange={handleImageChange}
                        required
                    />
                    {imageError && <p style={{ color: 'red' }}>{imageError}</p>}
                    {iconPreviewUrl && (
                        <div>
                            <p style={{ color: 'green' }}>✔️ Facility Icon Preview</p>
                            <img src={iconPreviewUrl} alt="Selected Icon" style={{ maxWidth: '100%' }} />
                        </div>
                    )}
                    <small className="form-text text-muted">
                        <strong>Image Size:</strong> 200KB Max <br />
                        <strong>Dimensions:</strong> 600(H) × 600(W) <br />
                        <strong>Image Type:</strong> PNG
                    </small>
                </ModalBody>
                <ModalFooter>
                    <Button color="primary" onClick={handleProceed}>Proceed</Button>
                    <Button color="secondary" onClick={toggleModal}>Cancel</Button>
                </ModalFooter>
            </Modal>
        </Fragment>
    );
};

export default Workshop;
