import React, { Fragment, useEffect, useState, useContext } from 'react';
import { Container, Row, Col, Card, Table, CardHeader, CardBody, Input, Label, Button, Modal, ModalHeader, ModalBody, ModalFooter, InputGroup, InputGroupText, FormGroup, PopoverBody, UncontrolledPopover } from 'reactstrap';
import { Breadcrumbs } from '../../AbstractElements';
import axios from 'axios';
import { BackendAPI } from '../../api';
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
import SweetAlert from 'sweetalert2';
import { Field, Form } from 'react-final-form';
import { PermissionsContext } from '../../contexts/PermissionsContext';
import { Tooltip } from 'react-tooltip';
import { getToken } from '../../Auth/Auth';
import Select from 'react-select';
import { toast } from 'react-toastify';
import { Button as B, Dropdown as D, Menu } from 'antd';


import useAuth from '../../Auth/protectedAuth';

// Define the required validator
const requiredValidator = value => (value ? undefined : 'This field is required');

// Utility function to combine multiple validation functions
const composeValidators = (...validators) => value =>
    validators.reduce((error, validator) => error || validator(value), undefined);

const Categories = () => {
    useAuth();
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalItems, setTotalItems] = useState(0);
    const [pageSize, setPageSize] = useState(10);
    const [searchText, setSearchText] = useState('');
    const [sortColumn, setSortColumn] = useState(''); // Column to sort by
    const [sortOrder, setSortOrder] = useState('desc'); // Sort order (asc/desc)
    const [statusModal, setStatusModal] = useState(false);
    const [activestatusModal, setActiveStatusModal] = useState(false);
    const [selectedCategoryId, setSelectedCategoryId] = useState(null);
    const [selectedCatname, setSelectedCatName] = useState(null);
    const [selectedStatus, setSelectedStatus] = useState(null);
    const [catData, setCatData] = useState([]);
    const [prodData, setProdData] = useState([]);
    const [selectedCat, setSelectedCat] = useState(null); // Added state to store selected category
    const [modal, setModal] = useState(false);
    const [deleteCategoryId, setDeleteCategoryId] = useState(null);
    const { layoutURL } = useContext(CustomizerContext);
    const navigate = useNavigate();
    const { permissions } = useContext(PermissionsContext);
    const [isProcessing, setIsProcessing] = useState(false);
    const [message, setMessage] = useState('');


    console.log("Cat", selectedCategoryId);

    useEffect(() => {
        fetchCategory();
        fetchCat();
    }, [currentPage, pageSize, searchText, permissions]);

    // Extract Category component
    const categoryPermissions = permissions['Categories'];
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

    const fetchCategory = async () => {
        try {
            const token = getToken();
            const response = await axios.get(`${BackendAPI}/category/getCategories`, {
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

            setData(response.data.categories);
            setTotalItems(response.data.totalItems);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching data:', error);
            setLoading(false);
        }
    };

    const fetchCat = async () => {
        try {
            const token = getToken();
            const response = await axios.get(`${BackendAPI}/category/getCat`, {
                headers: {
                    Authorization: `Bearer ${token}` // Include the token in the Authorization header
                }
            });
            const catData = response.data.Types.map(item => ({
                id: item.cs_reg_cat_id,
                Cat: item.cs_reg_category
            }));
            setCatData(catData);
            setProdData(response.data.prodData)
        } catch (error) {
            console.error('Error fetching types:', error);
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
        fetchCategory(); // Fetch the data again with the updated sorting
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

        ...(categoryPermissions?.edit === 1
            ? [
                {
                    key: '1',
                    label: (
                        <div
                            style={{
                                display: 'inline-block',
                                cursor: item.cs_reg_cat_id === 0 || item.cs_reg_cat_id === 1 ? 'not-allowed' : 'pointer',
                                color: item.cs_reg_cat_id === 0 || item.cs_reg_cat_id === 1 ? 'gray' : 'inherit',
                            }}
                            onClick={() =>
                                item.cs_reg_cat_id !== 0 && item.cs_reg_cat_id !== 1 && handleEdit(item.cs_reg_cat_id, item.cs_reg_category, item.cs_show_spot_form, item.cs_show_conference_form)
                            }
                        >
                            <FaEdit /> Edit Category
                        </div>
                    ),
                }]
            : []
        ),
        ...(categoryPermissions?.delete === 1
            ? [
                {
                    key: '2',
                    label: (
                        <div
                            style={{
                                display: 'inline-block',
                                cursor: [0, 1, 2, 3, 4].includes(item.cs_reg_cat_id) ? 'not-allowed' : 'pointer',
                                color: [0, 1, 2, 3, 4].includes(item.cs_reg_cat_id) ? 'gray' : 'inherit',
                            }}
                            onClick={() =>
                                ![0, 1, 2, 3, 4].includes(item.cs_reg_cat_id) && handleDelete(item.cs_reg_cat_id)
                            }
                        >
                            <MdDelete /> Delete Category
                        </div>
                    ),
                }]
            : []
        )
        // Add more options if needed
    ];


    const handleEdit = (catId, catName, event) => {
        const URL = '/onsite/edit-category/';
        navigate(`${process.env.PUBLIC_URL}${URL}${layoutURL}`, { state: { catId, catName, event, prodData } });
    };

    const handleDelete = async (catId) => {
        try {
            const token = getToken();
            await axios.delete(`${BackendAPI}/category/deletecategory/${catId}`, {
                headers: {
                    Authorization: `Bearer ${token}` // Include the token in the Authorization header
                }
            });

            SweetAlert.fire({
                title: 'Success!',
                text: 'Category removed successfully!',
                icon: 'success',
                timer: 3000,
                showConfirmButton: false,
                allowOutsideClick: false,
                allowEscapeKey: false
            }).then((result) => {
                if (result.dismiss === SweetAlert.DismissReason.timer) {
                    navigate(`${process.env.PUBLIC_URL}/onsite/manage-category/${layoutURL}`);
                }
            });
        } catch (error) {
            console.error('Error deleting workshop:', error);
        }
    };

    const toggleStatusModal = (catId, currentStatus, catName) => {
        setSelectedCategoryId(catId);
        setSelectedStatus(currentStatus);
        setSelectedCatName(catName);
        setStatusModal(!statusModal);
    };

    const closetoggleStatusModal = () => {
        setSelectedCategoryId(null);
        setSelectedStatus(null);
        setStatusModal(false);
    };

    const toggleActiveStatusModal = (catId, currentStatus, catName) => {
        setSelectedCategoryId(catId);
        setSelectedStatus(currentStatus);
        setSelectedCatName(catName);
        setActiveStatusModal(!activestatusModal);
    };

    const closetoggleActiveStatusModal = () => {
        setSelectedCategoryId(null);
        setSelectedStatus(null);
        setSelectedCatName(null);
        setActiveStatusModal(false);
    };

    const confirmStatusUpdate = async (newCat) => {
        setStatusModal(false);
        const newStatus = selectedStatus == 0 ? 1 : 0;
        setIsProcessing(true);
        setMessage('The process has started and is running in the background. Once it is completed, we will notify you. In the meantime, you are free to start other processes.');


        setTimeout(() => {
            setMessage('');
        }, 10000);

        const toastId = toast.info('Processing...', { autoClose: false });
        try {
            const token = getToken();
            await axios.put(`${BackendAPI}/category/UpdateStatus`, { Id: selectedCategoryId, newCatid: newCat, status: newStatus }, {
                headers: {
                    Authorization: `Bearer ${token}` // Include the token in the Authorization header
                }
            });

            const updatedcat = data.map((workshop) =>
                workshop.cs_reg_cat_id === selectedCategoryId ? { ...workshop, cs_status: workshop.cs_status === 0 ? 1 : 0 } : workshop
            );
            setData(updatedcat);
            fetchCategory();
            fetchCat();
            setIsProcessing(false);
            toast.dismiss(toastId);
            toast.success("Status Updated sucessfully");
            // setStatusModal(false);
            setActiveStatusModal(false);
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
    };

    const handleSelectChange = (selectedOption) => {
        setSelectedCat(selectedOption ? selectedOption.value : null);
    };

    const openDeleteModal = (catId, catName) => {
        setDeleteCategoryId(catId);
        setSelectedCatName(catName);
        setModal(true);
    };

    const closeDeleteModal = () => {
        setDeleteCategoryId(null);
        setModal(false);
    };

    const handleNavigation = () => {
        navigate(`${process.env.PUBLIC_URL}/onsite/add-category/Consoft`, { state: { prodData } });
    };

    const categorywiseNavigation = (catID) => {
        const URL = '/onsite/manage-user/';
        navigate(`${process.env.PUBLIC_URL}${URL}${layoutURL}`, { state: { catID } });
    };

    return (
        <Fragment>
            <Breadcrumbs mainTitle={
                <>
                    Manage Category
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
                            Create and manage categories for classifying participants during on-spot registration through the admin panel. <br />
                            Categories can be easily edited and changed status between <span className="text-success">Active</span> or <span className="text-danger">Inactive.</span> <br />
                            Default categories include <strong>Faculty</strong>, <strong>Delegate</strong>, and <strong>Exhibitor</strong>, which you can rename or mark as <span className="text-success">Active</span> / <span className="text-danger">Inactive</span> as needed.
                        </PopoverBody>
                    </UncontrolledPopover>
                </>
            } parent="Onsite App" title="Manage Category" />
            <Container fluid={true}>
                <Row>
                    <Col sm="12">
                        <Card>
                            {/* <CardHeader className="d-flex justify-content-between align-items-center flex-column flex-md-row">
                                <div className="mb-2 mb-md-0">
                                    <h5 className="mb-2 text-start">Categories</h5>
                                    <Input
                                        placeholder="Search Category"
                                        onChange={e => handleSearch(e.target.value)}
                                        style={{ width: 200 }}
                                    />
                                </div>
                                {categoryPermissions?.add === 1 && (
                                     <button onClick={handleNavigation} className="btn btn-warning">
                                     Create Category
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
                                                placeholder="Search Category"
                                                onChange={e => handleSearch(e.target.value)}
                                            // style={{ borderRadius: '20px' }}
                                            />
                                        </InputGroup>
                                    </div>
                                    <div className="text-md-end w-100 mt-2 mt-md-0 text-end text-wrap">
                                        {categoryPermissions?.add === 1 && (
                                            // <Button onClick={handleNavigation} color='warning'>
                                            //     Create Category
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
                                                    Create Category
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
                                        <p className='text-center'>No category found</p>
                                    ) : (
                                        <Table>
                                            <thead>
                                                <tr className='border-bottom-primary'>
                                                    <th scope='col' className='text-start'>{'Sr No.'}</th>
                                                    <th scope='col' className='text-start' onClick={() => handleSort('cs_reg_category')}>
                                                        {'Category Name'}
                                                        {getSortIndicator('cs_reg_category')}
                                                    </th>
                                                    {/* <th scope='col' className='text-start'>{'Category Name'}</th> */}
                                                    <th scope='col' className='text-center' onClick={() => handleSort('userCount')}>
                                                        {'Number of Attendee'}
                                                        {getSortIndicator('userCount')}
                                                    </th>
                                                    {/* <th scope='col' className='text-center'>{'Number of Attendee'}</th> */}
                                                    {/* <th scope='col' className='text-center'>{'Number of Designation'}</th> */}
                                                    <th scope='col' className='text-center' onClick={() => handleSort('cs_status')}>
                                                        {'Status'}
                                                        {getSortIndicator('cs_status')}
                                                    </th>
                                                    {/* <th scope='col' className='text-center'>{'Status'}</th> */}
                                                    {categoryPermissions?.edit === 1 || categoryPermissions?.delete === 1 ? (
                                                        <th scope='col' className='text-end'>Action</th>
                                                    ) : null}

                                                </tr>
                                            </thead>
                                            <tbody>
                                                {data.map((item, index) => (
                                                    <tr key={index} className="border-bottom-primary">
                                                        <td className='text-start'>{(currentPage - 1) * pageSize + index + 1}</td>
                                                        <td className='text-start'>{item.cs_reg_category}</td>
                                                        {/* <td className='text-center' onClick={() => categorywiseNavigation(item.cs_reg_cat_id)}>
                                                            {item.userCount}
                                                        </td> */}
                                                        <td className='text-center'>
                                                            <Button
                                                                color='link' // Makes it look like a link
                                                                className='p-0' // Removes padding
                                                                style={{ textDecoration: 'none' }} // Inline style to remove underline
                                                                onClick={() => {
                                                                    if (item.userCount > 0) { // Check if userCount is greater than 0
                                                                        categorywiseNavigation(item.cs_reg_cat_id);
                                                                    }
                                                                }}
                                                            >
                                                                {item.userCount}
                                                            </Button>
                                                        </td>


                                                        {/* <td className='text-center'>{item.designationCount}</td> */}
                                                        <td className='text-center'>
                                                            {item.cs_reg_cat_id !== 0 ? (
                                                                item.cs_status === 0 ? (
                                                                    <span style={{ color: 'red', fontSize: '20px', cursor: "pointer" }}
                                                                        onClick={() => toggleActiveStatusModal(item.cs_reg_cat_id, item.cs_status, item.cs_reg_category)}
                                                                        data-tooltip-id="tooltip"
                                                                        data-tooltip-content="Inactive status"
                                                                        data-tooltip-event="click focus">
                                                                        <GoDotFill />
                                                                    </span>
                                                                ) : (
                                                                    <span style={{ color: 'green', fontSize: '20px', cursor: "pointer" }}
                                                                        onClick={() => toggleStatusModal(item.cs_reg_cat_id, item.cs_status, item.cs_reg_category)}
                                                                        data-tooltip-id="tooltip"
                                                                        data-tooltip-content="Active status"
                                                                        data-tooltip-event="click focus">
                                                                        <GoDotFill />
                                                                    </span>
                                                                )
                                                            ) : (
                                                                // If cs_reg_cat_id is 1 or 2, render a disabled or non-clickable icon
                                                                <span style={{ color: item.cs_status === 0 ? 'red' : 'green', fontSize: '20px', cursor: "not-allowed" }}
                                                                    data-tooltip-id="tooltip"
                                                                    data-tooltip-content="Action disabled for this category"
                                                                    data-tooltip-event="click focus">
                                                                    <GoDotFill />
                                                                </span>
                                                            )}
                                                        </td>

                                                        {categoryPermissions?.edit === 1 || categoryPermissions?.delete === 1 ? (

                                                            <td className='text-end'>
                                                                {/* <div data-tooltip-id="tooltip"
                                                                    data-tooltip-content={item.cs_reg_cat_id === 0 || item.cs_reg_cat_id === 1 ? "Edit disabled for this category" : "Edit Category"}
                                                                    data-tooltip-event="hover focus"
                                                                    style={{ display: 'inline-block' }}>
                                                                    <Button
                                                                        color="primary"
                                                                        size="sm"
                                                                        onClick={() => handleEdit(item.cs_reg_cat_id, item.cs_reg_category, item.cs_show_spot_form)}
                                                                        disabled={item.cs_reg_cat_id === 0 || item.cs_reg_cat_id === 1}
                                                                        style={item.cs_reg_cat_id === 0 || item.cs_reg_cat_id === 1 ? { cursor: "not-allowed" } : {}}
                                                                    >
                                                                        <FaEdit />
                                                                    </Button>
                                                                </div>

                                                                <div
                                                                    data-tooltip-id="tooltip"
                                                                    data-tooltip-content={
                                                                        [0, 1, 2, 3, 4].includes(item.cs_reg_cat_id)
                                                                            ? "Delete disabled for this category"
                                                                            : "Delete Category"
                                                                    }
                                                                    data-tooltip-event="hover focus"
                                                                    style={{ display: 'inline-block' }}
                                                                >
                                                                    <Button
                                                                        color="danger"
                                                                        size="sm"
                                                                        onClick={() => openDeleteModal(item.cs_reg_cat_id, item.cs_reg_category)}
                                                                        disabled={[0, 1, 2, 3, 4].includes(item.cs_reg_cat_id)}
                                                                        style={[0, 1, 2, 3, 4].includes(item.cs_reg_cat_id) ? { cursor: "not-allowed" } : {}}
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


                                                                <Tooltip id="tooltip" globalEventOff="click" />
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
            {/* Inactive Status Confirmation Modal */}
            <Modal isOpen={statusModal} toggle={closetoggleStatusModal} centered size="md">
                <ModalHeader toggle={closetoggleStatusModal}>Confirmation</ModalHeader>
                <ModalBody>
                    <div className='ms-2'>
                        <p><strong>Alert: Changing Status</strong></p>
                        <p>
                            Are you sure you want to inactive the <strong>{selectedCatname}</strong> category ?<br /><br />

                            If you proceed, the <strong>{selectedCatname}</strong> category will become Inactive, and all users assigned to this category will be automatically transferred to the selected replacement category. <br />
                            Please select the replacement category.                        </p>
                        <p>Are you sure you want to continue?</p>
                    </div>
                    {data.find(item => item.cs_reg_cat_id === selectedCategoryId)?.userCount !== 0 && (

                        <FormGroup>
                            <Label for="categorySelect">Select replacement Category:</Label>
                            <Select
                                id="categorySelect"
                                value={catData.find(option => option.value === selectedCat)}
                                onChange={handleSelectChange}
                                options={catData
                                    .filter(option => option.id !== selectedCategoryId)
                                    .map(pref => ({ value: pref.id, label: pref.Cat }))}
                                isSearchable={true}
                                classNamePrefix="react-select"
                            />

                        </FormGroup>
                    )}
                </ModalBody>
                <ModalFooter>
                    <Button color="danger" onClick={() => confirmStatusUpdate(selectedCat || 1)}>Yes</Button>
                    <Button color="primary" onClick={closetoggleStatusModal}>No</Button>
                </ModalFooter>
            </Modal>




            {/* Active Status Confirmation Modal */}
            <Modal isOpen={activestatusModal} toggle={closetoggleActiveStatusModal} centered size="md">
                <ModalHeader toggle={closetoggleActiveStatusModal}>Confirmation: Changing Status</ModalHeader>
                <ModalBody>
                    <div className='ms-2'>
                        <p><strong>Alert: Changing Status</strong></p>
                        <p>
                            This action will active the <strong>{selectedCatname}</strong> & access will be restored & you can create new users under <strong>{selectedCatname}</strong> Category
                        </p>
                        <p>Are you sure you want to continue?</p>
                    </div>
                    {/* <FormGroup>
                        <Label for="categorySelect">Select replacement Category:</Label>
                        <Select
                            id="categorySelect"
                            value={catData.find(option => option.value === selectedCat)}
                            onChange={handleSelectChange}
                            options={catData
                                .filter(option => option.id !== selectedCategoryId)
                                .map(pref => ({ value: pref.id, label: pref.Cat }))}
                            placeholder="Select replacement Category"
                            isSearchable={true}
                            className="react-select"
                        />

                    </FormGroup> */}
                </ModalBody>
                <ModalFooter>
                    <Button color="danger" onClick={() => confirmStatusUpdate(0)}>Yes</Button>
                    <Button color="primary" onClick={closetoggleActiveStatusModal}>No</Button>
                </ModalFooter>
            </Modal>

            {/* Delete Confirmation Modal */}
            <Modal isOpen={modal} toggle={closeDeleteModal} centered size="md">
                <ModalHeader toggle={closeDeleteModal}>Confirmation</ModalHeader>
                <ModalBody>
                    <div className='ms-2'>
                        <p>Are you sure you want to delete <strong>{selectedCatname}</strong> Category?</p>
                    </div>
                </ModalBody>
                <ModalFooter>
                    <Button color="primary" onClick={() => handleDelete(deleteCategoryId)}>Yes</Button>
                    <Button color="warning" onClick={closeDeleteModal}>No</Button>
                </ModalFooter>
            </Modal>
        </Fragment>
    );
};

export default Categories;