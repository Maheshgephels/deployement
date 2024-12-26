import React, { Fragment, useEffect, useState, useContext } from 'react';
import { Container, Row, Col, Card, Table, CardHeader, CardBody, Input, Button, Modal, ModalHeader, ModalFooter, ModalBody, PopoverBody, UncontrolledPopover, InputGroup, InputGroupText } from 'reactstrap';
import { Breadcrumbs } from '../../AbstractElements';
import axios from 'axios';
import { BackendAPI } from '../../api';
import { BackendPath } from '../../api';
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
import { ToastContainer, toast } from "react-toastify";
import { Button as B, Dropdown as D, Menu } from 'antd';
import { PermissionsContext } from '../../contexts/PermissionsContext';
import { getToken } from '../../Auth/Auth';
import useAuth from '../../Auth/protectedAuth';

const Pages = () => {
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
    const [pagetype, setPageType] = useState([]);
    const { layoutURL } = useContext(CustomizerContext);
    const [modalOpen, setModalOpen] = useState(false);
    const [modal, setModal] = useState(false);
    const [statusModalOpen, setStatusModalOpen] = useState(false); // New state for modal visibility
    const [PageIdToUpdate, setPageIdToUpdate] = useState(null); // Workshop ID to update status
    const [pageName, setpageName] = useState(null);
    const [currentStatus, setCurrentStatus] = useState(null);
    const [deleteWorkshopDetails, setDeleteWorkshopDetails] = useState({ workshopId: null, facilityId: null }); // New state for delete workshop details
    const navigate = useNavigate();
    const { permissions } = useContext(PermissionsContext);



    useEffect(() => {
        fetchPages();
    }, [currentPage, pageSize, searchText, permissions]);

    // Extract Event Manage Page component
    const PagePermissions = permissions['Pages'];

    const fetchPages = async () => {
        try {
            const token = getToken();
            // const Response = await axios.get(`${BackendAPI}/page/getPages?page=${currentPage}&pageSize=${pageSize}&search=${searchText}`, {
            //     headers: {
            //         Authorization: `Bearer ${token}` // Include the token in the Authorization header
            //     }
            // });
            const Response = await axios.get(`${BackendAPI}/page/getPages`, {
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
            console.log("Data:", Response.data);
            const filteredData = Response.data.pages.filter(page => page.page_id !== 1);

            const pagesData = Response.data.pages;
            const pageTypes = pagesData.map(page => page.page_type); // Extract page types
            setData(filteredData);
            setPageType(pageTypes);
            // setData(Response.data.pages);
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
        setCurrentPage(1);

    };

    const handleSort = (column) => {
        const order = sortColumn === column && sortOrder === 'asc' ? 'desc' : 'asc';
        setSortColumn(column);
        setSortOrder(order);
        fetchPages(); // Fetch the data again with the updated sorting
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

        ...(PagePermissions?.edit === 1
            ? [
                {
                    key: '1',
                    label: (
                        <div
                            style={{
                                display: 'inline-block',
                                cursor: item.page_type === 'Static' ? 'not-allowed' : 'pointer',
                                color: item.page_type === 'Static' ? 'gray' : 'inherit',
                            }}
                            onClick={() =>
                                item.page_type !== 'Static' && handleEdit(item)
                            }
                        >
                            <FaEdit /> Edit Page
                        </div>
                    ),
                }]
            : []
        ),
        
        ...(PagePermissions?.delete === 1
            ? [
                {
                    key: '2',
                    label: (
                        <div
                            style={{
                                display: 'inline-block',
                                cursor: item.page_type === 'Static' || item.page_type === 'Web' ? 'not-allowed' : 'pointer',
                                color: item.page_type === 'Static' || item.page_type === 'Web' ? 'gray' : 'inherit',
                            }}
                            onClick={() =>
                                item.page_type !== 'Static' && item.page_type !== 'Web' && openDeleteModal(item.page_id, item.page_display_name)
                            }
                        >
                            <MdDelete /> Delete Page
                        </div>
                    ),
                }]
            : []
        ),
        
        // Add more options if needed
    ];

    const handleEdit = async (item) => {
        const URL = '/event/edit-page/';
        navigate(`${process.env.PUBLIC_URL}${URL}${layoutURL}`, { state: { item } });
    };

    const handleDelete = async () => {
        try {
            const { pageId, pageName } = deleteWorkshopDetails;
            const token = getToken();
            await axios.delete(`${BackendAPI}/page/deletePage`, {
                headers: {
                    Authorization: `Bearer ${token}` // Include the token in the Authorization header
                },
                data: { pageId, pageName } // Include the data payload correctly
            });
            SweetAlert.fire({
                title: 'Success!',
                text: 'Page removed successfully!',
                icon: 'success',
                timer: 3000,
                showConfirmButton: false,
                allowOutsideClick: false,
                allowEscapeKey: false
            }).then((result) => {
                if (result.dismiss === SweetAlert.DismissReason.timer) {
                    navigate(`${process.env.PUBLIC_URL}/event/manage-page/Consoft`);
                }
            });
            fetchPages();
        } catch (error) {
            console.error('Error deleting workshop:', error);
        }
        setModal(false); // Close modal after deletion
    };


    const openStatusModal = (pageId, pageName, currentStatus) => {
        setPageIdToUpdate(pageId);
        setpageName(pageName);
        setCurrentStatus(currentStatus);
        setStatusModalOpen(true);
    };


    const closeStatusModal = () => {
        setStatusModalOpen(false);
    };

    const handleStatusUpdate = async () => {
        const pageId = PageIdToUpdate;
        const currentPage = data.find(page => page.page_id === pageId);
        if (!currentPage) return;
        const currentStatus = currentPage.status;
        const newStatus = currentStatus === 0 ? 1 : 0;
        try {
            const token = getToken();
            await axios.put(`${BackendAPI}/page/UpdateStatus`, { pageId, status: newStatus, Name: currentPage.page_display_name }, {
                headers: {
                    Authorization: `Bearer ${token}` // Include the token in the Authorization header
                }
            });
            const updatedPage = data.map((page) =>
                page.page_id === pageId ? { ...page, status: newStatus } : page
            );
            setData(updatedPage);
        } catch (error) {
            console.error('Error updating status:', error);
        }
        closeStatusModal(); // Close modal after status update
    };

    const openDeleteModal = (pageId, pageName) => {
        setDeleteWorkshopDetails({ pageId, pageName });
        setpageName(pageName);
        setModal(true);
    };

    const closeDeleteModal = () => {
        setModal(false);
    };

    const handleNavigation = () => {
        navigate(`${process.env.PUBLIC_URL}/event/create-page/Consoft`);
    };


    const handleUpItem = async (item) => {
        console.log("Up:", item);
        try {
            const token = getToken();
            const response = await axios.post(`${BackendAPI}/page/moveup`, { item: item.page_id, order: item.page_order }, {
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
            fetchPages();
        } catch (error) {
            // Show a generic error message in case of failure
            toast('Already at the top position !');
        }
    };


    const handleDownItem = async (item) => {

        console.log("Down:", item);

        try {
            const token = getToken();
            const response = await axios.post(`${BackendAPI}/page/movedown`, { item: item.page_id, order: item.page_order }, {
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
            fetchPages();
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
                    Manage Pages
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
                            From here, you can manage the pages displayed in the Event app and organize them in your sidebar,
                            Navbar, and Home page. For each page, customize the design, control visibility, manage the order, and update the status. <br />
                            Only pages with an active status will be displayed in the Event App.
                        </PopoverBody>
                    </UncontrolledPopover>
                </>
            } parent="Event App Admin" title="Manage Page" />
            <Container fluid={true}>
                <Row>
                    <Col sm="12">
                        <Card>
                            {/* <CardHeader className="d-flex justify-content-between align-items-center flex-column flex-md-row">
                                <div className="mb-2 mb-md-0">
                                    <h5 className="mb-2 text-start">Event Manage Page</h5>
                                    <Input
                                        placeholder="Search Workshop"
                                        onChange={e => handleSearch(e.target.value)}
                                        style={{ width: 200 }}
                                    />
                                </div>
                                {PagePermissions?.add === 1 && (
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
                                                placeholder="Search Page"
                                                onChange={e => handleSearch(e.target.value)}
                                            // style={{ borderRadius: '20px' }}
                                            />
                                        </InputGroup>
                                    </div>
                                    <div className="text-md-end w-100 mt-2 mt-md-0 text-end text-wrap">
                                        {order === false && (
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
                                                Reorder Page
                                            </Tooltip>
                                        </>

                                        )}
                                        {PagePermissions?.add === 1 && (
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
                                                 Create Page
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
                                        <p className='text-center'>No page found</p>
                                    ) : (
                                        <Table>
                                            <thead>
                                                <tr className='border-bottom-primary'>
                                                    <th scope='col' className='text-center'>Sr No.</th>
                                                    {order !== false && (
                                                        <th scope='col' className='text-center'>Page Order</th>
                                                    )}
                                                    <th scope='col' className='text-center' onClick={() => handleSort('page_display_name')}>
                                                        {'Page Name'}
                                                        {getSortIndicator('page_display_name')}
                                                    </th>
                                                    {/* <th scope='col' className='text-center'>Page Name</th> */}
                                                    <th scope='col' className='text-center'>Page Icon</th>
                                                    <th scope='col' className='text-center' onClick={() => handleSort('status')}>
                                                        {'Status'}
                                                        {getSortIndicator('status')}
                                                    </th>
                                                    {(PagePermissions?.edit === 1 || PagePermissions?.delete === 1) && (
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
                                                                        // disabled={item.page_type === 'Static'}
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
                                                                        // disabled={item.page_type === 'Static'}

                                                                    >
                                                                        <FaAngleDown />
                                                                    </Button>
                                                                </div>
                                                            </td>
                                                        )}
                                                        <td className='text-center'>{item.page_display_name}</td>
                                                        <td className='text-center'>
                                                            <img
                                                                src={`${BackendPath}${item.icon_image_url}`}
                                                                alt="Logo"
                                                                className="img-fluid mr-2"
                                                                style={{ maxWidth: '30px' }}
                                                            />
                                                        </td>
                                                        <td className='text-center'>
                                                            {item.status === 0 ? (
                                                                <span
                                                                    style={{ color: 'red', fontSize: '20px', cursor: "pointer" }}
                                                                    onClick={() => openStatusModal(item.page_id, item.page_display_name, item.status)}
                                                                    data-tooltip-id="tooltip"
                                                                    data-tooltip-content="Inactive status"
                                                                    data-tooltip-event="click focus"
                                                                >
                                                                    <GoDotFill />
                                                                </span>
                                                            ) : (
                                                                <span
                                                                    style={{ color: 'green', fontSize: '20px', cursor: "pointer" }}
                                                                    onClick={() => openStatusModal(item.page_id, item.page_display_name, item.status)}
                                                                    data-tooltip-id="tooltip"
                                                                    data-tooltip-content="Active status"
                                                                    data-tooltip-event="click focus"
                                                                >
                                                                    <GoDotFill />
                                                                </span>
                                                            )}
                                                            <Tooltip id="tooltip" globalEventOff="click" />
                                                        </td>
                                                        {(PagePermissions?.edit === 1 || PagePermissions?.delete === 1) && (
                                                            <td className='text-center' style={{ width: '140px' }}>
                                                                <Tooltip id="tooltip" globalEventOff="click" />
                                                                {/* {PagePermissions?.edit === 1 && (
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
                                                                )} */}
                                                                {/* Edit Button with Tooltip */}
                                                                {/* <div data-tooltip-id="tooltip"
                                                                    data-tooltip-content={item.page_type === 'Static' ? "Edit disabled for this page" : "Edit page"}
                                                                    data-tooltip-event="hover focus"
                                                                    style={{ display: 'inline-block' }}>
                                                                    <Button
                                                                        color="primary"
                                                                        size="sm"
                                                                        onClick={() => handleEdit(item)}
                                                                        disabled={item.page_type === 'Static'}
                                                                        style={item.page_type === 'Static' ? { cursor: "not-allowed" } : {}}
                                                                    >
                                                                        <FaEdit />
                                                                    </Button>
                                                                </div> */}
                                                                {/* {PagePermissions?.delete === 1 && item.page_type !== 'Static' && (
                                                                    <Button
                                                                        color="danger"
                                                                        size="sm"
                                                                        onClick={() => openDeleteModal(item.page_id, item.page_display_name)}
                                                                        data-tooltip-id="tooltip"
                                                                        data-tooltip-content="Delete Page"
                                                                        data-tooltip-event="click focus"
                                                                    >
                                                                        <MdDelete />
                                                                    </Button>
                                                                )} */}
                                                                {/* Delete Button with Tooltip */}
                                                                {/* <div
                                                                    data-tooltip-id="tooltip"
                                                                    data-tooltip-content={
                                                                        item.page_type === 'Static' || item.page_type === 'Web'
                                                                            ? "Delete disabled for this page"
                                                                            : "Delete page"
                                                                    }
                                                                    data-tooltip-event="hover focus"
                                                                    style={{ display: 'inline-block' }}
                                                                >
                                                                    <Button
                                                                        color="danger"
                                                                        size="sm"
                                                                        onClick={() => openDeleteModal(item.page_id, item.page_display_name)}
                                                                        disabled={item.page_type === 'Static' || item.page_type === 'Web'}
                                                                        style={item.page_type === 'Static' || item.page_type === 'Web'
                                                                            ? { cursor: "not-allowed" }
                                                                            : {}
                                                                        }
                                                                    >
                                                                        <MdDelete />
                                                                    </Button>

                                                                    
                                                                </div> */}

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
                        <p>
                            Are you sure you want to change the status of the <strong>{pageName}</strong> page to {currentStatus === 0 ? "Active" : "Inactive"}? <br />
                            When the status is changed to Inactive, the page will no longer be visible in the Event App.
                        </p>
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
                        <p>Are you sure you want to delete the <strong>{pageName}</strong> page?
                            Once deleted, the page will no longer be available.</p>
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
                    <p>Do you want to reorder the pages? <br />
                        The same order will be displayed in the event app.</p>

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

export default Pages;
