import React, { Fragment, useEffect, useState, useContext } from 'react';
import { Container, Row, Col, Card, Table, CardHeader, CardBody, Input, Label, Button, Modal, ModalHeader, ModalBody, ModalFooter, FormGroup, PopoverBody, UncontrolledPopover, InputGroup, InputGroupText } from 'reactstrap';
import { Breadcrumbs } from '../../AbstractElements';
import axios from 'axios';
import { BackendAPI } from '../../api';
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
import SweetAlert from 'sweetalert2';
import { Field, Form } from 'react-final-form';
import { PermissionsContext } from '../../contexts/PermissionsContext';
import { Tooltip } from 'react-tooltip';
import { getToken } from '../../Auth/Auth';
import { Button as B, Dropdown as D, Menu } from 'antd';
import Select from 'react-select';

import useAuth from '../../Auth/protectedAuth';

// Define the required validator
const requiredValidator = value => (value ? undefined : 'This field is required');

// Utility function to combine multiple validation functions
const composeValidators = (...validators) => value =>
    validators.reduce((error, validator) => error || validator(value), undefined);

const Eventroles = () => {
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
    const [selectedroleId, setSelectedroleId] = useState(null);
    const [selectedCatname, setSelectedCatName] = useState(null);
    const [selectedStatus, setSelectedStatus] = useState(null);
    const [catData, setCatData] = useState([]);
    const [selectedCat, setSelectedCat] = useState(null); // Added state to store selected role
    const [modal, setModal] = useState(false);
    const [deleteroleId, setDeleteroleId] = useState(null);
    const { layoutURL } = useContext(CustomizerContext);
    const navigate = useNavigate();
    const { permissions } = useContext(PermissionsContext);

    useEffect(() => {
        fetchrole();
        fetchCat();
    }, [currentPage, pageSize, searchText, permissions]);

    // Extract role component
    const EventrolesPermissions = permissions['Eventroles'];
    console.log('permissions from manage role', permissions);

    const fetchrole = async () => {
        try {
            const token = getToken();
            // const response = await axios.get(`${BackendAPI}/eventrole/getrole?page=${currentPage}&pageSize=${pageSize}&search=${searchText}`,
            // {
            //     headers: {
            //         Authorization: `Bearer ${token}` // Include the token in the Authorization header
            //     }
            // });
            const response = await axios.get(`${BackendAPI}/eventrole/getrole`, {
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
            const response = await axios.get(`${BackendAPI}/eventrole/getCat`, {
                headers: {
                    Authorization: `Bearer ${token}` // Include the token in the Authorization header
                }
            });
            const catData = response.data.Types.map(item => ({
                id: item.cs_reg_cat_id,
                Cat: item.cs_reg_role
            }));
            setCatData(catData);
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
        fetchrole(); // Fetch the data again with the updated sorting
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

        ...(EventrolesPermissions?.edit === 1
            ? [{
                key: '1',
                label: (
                    <div onClick={() => handleEdit(item.role_id, item.role_name)}>
                        <FaEdit /> Edit Details
                    </div>
                ),
            }]
            : []
        ),

        ...(EventrolesPermissions?.delete === 1
            ? [{
                key: '2',
                label: (
                    <div onClick={() => openDeleteModal(item.role_id, item.role_name)}>
                        <MdDelete /> Delete Role
                    </div>
                ),
            }]
            : []
        ),
        // Add more options if needed
    ];

    const handleEdit = (catId, catName) => {
        const URL = '/event/edit-event-role/';
        navigate(`${process.env.PUBLIC_URL}${URL}${layoutURL}`, { state: { catId, catName } });
    };

    const handleDelete = async (catId) => {
        try {
            const token = getToken();
            await axios.delete(`${BackendAPI}/eventrole/deleterole`, {
                headers: {
                    Authorization: `Bearer ${token}` // Include the token in the Authorization header
                },
                data: {
                    catId // Send catId in the request body
                }
            });

            SweetAlert.fire({
                title: 'Success!',
                text: 'Role removed successfully!',
                icon: 'success',
                timer: 3000,
                showConfirmButton: false,
                allowOutsideClick: false,
                allowEscapeKey: false
            }).then((result) => {
                if (result.dismiss === SweetAlert.DismissReason.timer) {
                    navigate(`${process.env.PUBLIC_URL}/event/manage-role/${layoutURL}`);
                }
            });
        } catch (error) {
            console.error('Error deleting role:', error);
        }
    };


    const checkRoleInSessionAndSubsession = async (roleId) => {
        try {
            const token = getToken();
            const response = await axios.get(`${BackendAPI}/eventrole/checkRoleInSessionAndSubsession/${roleId}`, {
                headers: {
                    Authorization: `Bearer ${token}` // Include the token in the Authorization header
                }
            });
            return response.data.exists;
        } catch (error) {
            console.error('Error checking role in session and subsession tables:', error);
            return false;
        }
    };

    const toggleStatusModal = async (catId, currentStatus, catName) => {
        const roleExists = await checkRoleInSessionAndSubsession(catId);
        if (roleExists) {
            SweetAlert.fire({
                title: 'Warning',
                text: `The role ${catName} exists in sessions or subsessions and cannot be inactivated. Please unassign the role from the faculty in the relevant sessions or subsessions first, and then you can inactivate the role.`,

                icon: 'warning',
                showConfirmButton: true,
                allowOutsideClick: false,
                allowEscapeKey: false
            });
        } else {
            setSelectedroleId(catId);
            setSelectedStatus(currentStatus);
            setSelectedCatName(catName);
            setStatusModal(!statusModal);
        }
    };

    const closetoggleStatusModal = () => {
        setSelectedroleId(null);
        setSelectedStatus(null);
        setStatusModal(false);
    };

    const confirmStatusUpdate = async (newCat) => {
        const newStatus = selectedStatus == 0 ? 1 : 0;
        try {
            const token = getToken();
            await axios.put(`${BackendAPI}/eventrole/UpdateStatus`, { Id: selectedroleId, status: newStatus }, {
                headers: {
                    Authorization: `Bearer ${token}` // Include the token in the Authorization header
                }
            });

            const updatedcat = data.map((workshop) =>
                workshop.cs_reg_cat_id === selectedroleId ? { ...workshop, cs_status: workshop.cs_status === 0 ? 1 : 0 } : workshop
            );
            setData(updatedcat);
            fetchrole();
            fetchCat();
            setStatusModal(false);
            setActiveStatusModal(false);
        } catch (error) {
            console.error('Error updating status:', error);
        }
    };

    const handleSelectChange = (selectedOption) => {
        setSelectedCat(selectedOption ? selectedOption.value : null);
    };

    const openDeleteModal = async (catId, catName) => {
        const roleExists = await checkRoleInSessionAndSubsession(catId);
        if (roleExists) {
            SweetAlert.fire({
                title: 'Warning',
                text: `The role ${catName} exists in sessions or subsessions and cannot be remove. Please unassign the role from the faculty in the relevant sessions or subsessions first, and then you can inactivate the role.`,
                icon: 'warning',
                showConfirmButton: true,
                allowOutsideClick: false,
                allowEscapeKey: false
            });
        } else {
            setDeleteroleId(catId);
            setSelectedCatName(catName);
            setModal(true);
        }
    };

    const closeDeleteModal = () => {
        setDeleteroleId(null);
        setModal(false);
    };

    const handleNavigation = () => {
        navigate(`${process.env.PUBLIC_URL}/event/add-event-role/Consoft`);
    };

    return (
        <Fragment>
            <Breadcrumbs mainTitle={
                <>
                    Manage Role
                    <MdInfoOutline
                        id="rolePopover"
                        style={{
                            cursor: 'pointer', position: 'absolute', marginLeft: '5px'
                        }}
                    />
                    <UncontrolledPopover
                        placement="bottom"
                        target="rolePopover"
                        trigger="focus"
                    >
                        <PopoverBody>
                            From here, you can create roles and set up these roles to the faculty when creating sessions and subsessions.
                        </PopoverBody>
                    </UncontrolledPopover>
                </>
            } parent="Event App Admin" title="Manage role" />
            <Container fluid={true}>
                <Row>
                    <Col sm="12">
                        <Card>
                            {/* <CardHeader className="d-flex justify-content-between align-items-center flex-column flex-md-row">
                                <div className="mb-2 mb-md-0">
                                    <h5 className="mb-2 text-start">Categories</h5>
                                    <Input
                                        placeholder="Search role"
                                        onChange={e => handleSearch(e.target.value)}
                                        style={{ width: 200 }}
                                    />
                                </div>
                                {EventrolesPermissions?.add === 1 && (
                                     <button onClick={handleNavigation} className="btn btn-warning">
                                     Create role
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
                                                placeholder="Search Role"
                                                onChange={e => handleSearch(e.target.value)}
                                            // style={{ borderRadius: '20px' }}
                                            />
                                        </InputGroup>
                                    </div>
                                    <div className="text-md-end w-100 mt-2 mt-md-0 text-end text-wrap">
                                        {EventrolesPermissions?.add === 1 && (
                                            // <Button onClick={handleNavigation} color='warning'>
                                            //     Create role
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
                                                    Create Role
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
                                        <p className='text-center'>No role found</p>
                                    ) : (
                                        <Table>
                                            <thead>
                                                <tr className='border-bottom-primary'>
                                                    <th scope='col' className='text-start'>{'Sr No.'}</th>
                                                    <th scope='col' className='text-start' onClick={() => handleSort('role_name')}>
                                                        {'Role Name'}
                                                        {getSortIndicator('role_name')}
                                                    </th>
                                                    {/* <th scope='col' className='text-start'>{'role Name'}</th> */}
                                                    {/* <th scope='col' className='text-center'>{'Number of Attendee'}</th> */}
                                                    {/* <th scope='col' className='text-center'>{'Number of Designation'}</th> */}
                                                    <th scope='col' className='text-center' onClick={() => handleSort('status')}>
                                                        {'Status'}
                                                        {getSortIndicator('status')}
                                                    </th>
                                                    {/* <th scope='col' className='text-center'>{'Status'}</th> */}
                                                    {EventrolesPermissions?.edit === 1 || EventrolesPermissions?.delete === 1 ? (
                                                        <th scope='col' className='text-end'>Action</th>
                                                    ) : null}

                                                </tr>
                                            </thead>
                                            <tbody>
                                                {data.map((item, index) => (
                                                    <tr key={index} className="border-bottom-primary">
                                                        <td className='text-start'>{(currentPage - 1) * pageSize + index + 1}</td>
                                                        <td className='text-start'>{item.role_name}</td>
                                                        {/* <td className='text-center'>{item.userCount}</td> */}
                                                        {/* <td className='text-center'>{item.designationCount}</td> */}
                                                        <td className='text-center'>
                                                            {item.status == 0 || item.status == '0' ? (
                                                                <span style={{ color: 'red', fontSize: '20px', cursor: "pointer" }}
                                                                    onClick={() => toggleStatusModal(item.role_id, item.status, item.role_name)}
                                                                    data-tooltip-id="tooltip"
                                                                    data-tooltip-content="Inactive status"
                                                                    data-tooltip-event="click focus">
                                                                    <GoDotFill />
                                                                </span>
                                                            ) : (
                                                                <span style={{ color: 'green', fontSize: '20px', cursor: "pointer" }}
                                                                    onClick={() => toggleStatusModal(item.role_id, item.status, item.role_name)}
                                                                    data-tooltip-id="tooltip"
                                                                    data-tooltip-content="Active status"
                                                                    data-tooltip-event="click focus">
                                                                    <GoDotFill />
                                                                </span>
                                                            )}
                                                        </td>
                                                        {EventrolesPermissions?.edit === 1 || EventrolesPermissions?.delete === 1 ? (

                                                            <td className='text-end'>
                                                                {/* {EventrolesPermissions?.edit === 1 && (
                                                                    <Button color="primary" size="sm" onClick={() => handleEdit(item.role_id, item.role_name)}
                                                                        data-tooltip-id="tooltip"
                                                                        data-tooltip-content="Edit role"
                                                                        data-tooltip-event="click focus">
                                                                        <FaEdit />
                                                                    </Button>
                                                                )}
                                                                {EventrolesPermissions?.delete === 1 && (
                                                                    <Button color="danger" size="sm" onClick={() => openDeleteModal(item.role_id, item.role_name)}
                                                                        data-tooltip-id="tooltip"
                                                                        data-tooltip-content="Delete role"
                                                                        data-tooltip-event="click focus" >
                                                                        <MdDelete />
                                                                    </Button>
                                                                )} */}
                                                                <Tooltip id="tooltip" globalEventOff="click" />


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

            <Modal isOpen={statusModal} toggle={closetoggleStatusModal}>
                <ModalHeader toggle={closetoggleStatusModal}>Change Status</ModalHeader>
                <ModalBody>
                    Are you sure you want to change the status of role "{selectedCatname}"?
                </ModalBody>
                <ModalFooter>
                    <Button color="primary" onClick={() => confirmStatusUpdate(selectedCat)}>
                        Yes
                    </Button>{' '}
                    <Button color="warning" onClick={closetoggleStatusModal}>
                        Cancel
                    </Button>
                </ModalFooter>
            </Modal>

            {/* Delete Confirmation Modal */}
            <Modal isOpen={modal} toggle={closeDeleteModal} centered size="md">
                <ModalHeader toggle={closeDeleteModal}>Confirmation</ModalHeader>
                <ModalBody>
                    <div className='ms-2'>
                        <p>Are you sure you want to delete <strong>{selectedCatname}</strong> role?</p>
                    </div>
                </ModalBody>
                <ModalFooter>
                    <Button color="primary" onClick={() => handleDelete(deleteroleId)}>Yes</Button>
                    <Button color="warning" onClick={closeDeleteModal}>No</Button>
                </ModalFooter>
            </Modal>
        </Fragment>
    );
};

export default Eventroles;