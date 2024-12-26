import React, { Fragment, useEffect, useState, useContext } from 'react';
import { Container, Row, Col, Card, Table, CardHeader, CardBody, Input, Button, Modal, ModalHeader, ModalFooter, ModalBody, PopoverBody, UncontrolledPopover, InputGroup, InputGroupText, Badge } from 'reactstrap';
import { Breadcrumbs } from '../../AbstractElements';
import axios from 'axios';
import { BackendAPI } from '../../api';
import SweetAlert from 'sweetalert2';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { GoDotFill } from "react-icons/go";
import { FaEdit, FaSortUp, FaSortDown, FaClone, FaCheckCircle,  FaEye, FaEyeSlash } from 'react-icons/fa';
import { FiSearch } from "react-icons/fi";
import { BiSort, BiSortAlt2 } from "react-icons/bi";
import { TbColumnInsertRight } from "react-icons/tb";
import { BsThreeDotsVertical, BsThreeDots } from "react-icons/bs";
import { MdDelete, MdInfoOutline } from "react-icons/md";
import { BiExport } from "react-icons/bi";
import { Pagination } from 'antd';
import CustomizerContext from '../../_helper/Customizer';
import { Tooltip } from 'react-tooltip';
import { classes } from '../../Data/Layouts';
import { PermissionsContext } from '../../contexts/PermissionsContext';
import { getToken } from '../../Auth/Auth';
import useAuth from '../../Auth/protectedAuth';
import { Button as B, Dropdown as D, Menu } from 'antd';
import debounce from 'lodash.debounce';
import Select, { components } from 'react-select';
import fileDownload from 'js-file-download';
import * as XLSX from 'xlsx';

const { MultiValueRemove } = components;


const ManageUser = () => {
    useAuth();
    const [data, setData] = useState([]);
    const [label, setLabel] = useState([]);
    const [selectedItems, setSelectedItems] = useState([]);
    const [selectedColumns, setSelectedColumns] = useState([]);
    const [allColumns, setAllColumns] = useState([]);
    const location = useLocation();
    const { catID } = location.state || {};
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
    const [UserIdToUpdate, setUserIdToUpdate] = useState(null); // User ID to update status
    const [UserName, setUserName] = useState(null);
    const [currentStatus, setCurrentStatus] = useState(null);
    const [deleteUserDetails, setDeleteUserDetails] = useState({ UserId: null, facilityId: null }); // New state for delete User details
    const navigate = useNavigate();
    const { permissions } = useContext(PermissionsContext);
    const [modalOpen, setModalOpen] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [editing, setEditing] = useState({});
    const [selectedUser, setSelectedUser] = useState(null);
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);

    console.log("Data:", data);

    const columns = [
        { value: 'cs_title', label: 'Title' },
        { value: 'cs_first_name', label: 'First Name' },
        { value: 'cs_last_name', label: 'Last Name' },
        { value: 'cs_reg_category', label: 'Registration Category' },
        { value: 'cs_email', label: 'Email' },
        { value: 'cs_phone', label: 'Phone' },
        { value: 'cs_isconfirm', label: 'User Type' }
    ];

    const selectedcolumn = [
        'cs_title',
        'cs_first_name',
        'cs_last_name',
        'cs_reg_category',
        'cs_isconfirm'
    ];

    const newcolumns = [
        { value: 'cs_status', label: 'Status' },
    ];

    const column = [
        'cs_status',
    ];


    console.log("Selected Column:", selectedColumns);

    const handleView = async (UserId) => {
        try {
            const token = getToken();
            const response = await axios.post(`${BackendAPI}/eventuser/editUser`, { UserId }, {
                headers: {
                    Authorization: `Bearer ${token}` // Include the token in the Authorization header
                }
            });
            setSelectedUser(response.data[0]);
            console.log("response.data", response.data);
            setIsViewModalOpen(true);
        } catch (error) {
            console.error("Error fetching user details:", error);
        }
    };

    const toggleShowPassword = (id) => {
        setShowPassword(prevState => ({
            ...prevState,
            [id]: !prevState[id]
        }));
    };




    useEffect(() => {
        fetchUser();
    }, [currentPage, pageSize, searchText, permissions]);

    // Extract Users component
    const ManageUserPermissions = permissions['ManageUser'];

    useEffect(() => {
        const storedColumns = localStorage.getItem('Columns');
        if (storedColumns) {
            setSelectedColumns(JSON.parse(storedColumns));
        } else if (allColumns.length > 0) {
            setSelectedColumns(allColumns.slice(0, 4).map(column => column.value));
        }
    }, [allColumns]);

    const fetchUser = async () => {
        try {
            const token = getToken();
            const columnsParam = selectedColumns.join(',');

            const response = await axios.get(`${BackendAPI}/eventuser/getUser`, {
                params: {
                    page: currentPage,
                    pageSize: pageSize,
                    search: searchText,
                    catId: catID,
                    sortColumn: sortColumn,
                    sortOrder: sortOrder,
                    selectedColumns: columnsParam
                },
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            console.log("User data", response.data);

            // Assuming response.data.categories is the array of user objects
            const users = response.data.categories;

            // Create an array to store categorized users
            const categorizedUsers = users.map(user => ({
                ...user,  // Spread the existing user properties
                cs_isconfirm: user.cs_isconfirm === 1 ? 'Confirm' : 'Basic'
            }));

            // Now set your data states
            setData(categorizedUsers);
            setLabel(response.data.labels);
            setTotalItems(response.data.totalItems);
            setAllColumns(columns);
            setSelectedColumns(selectedcolumn);
            setCatIds(catIds);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching data:', error);
            setLoading(false);
        }
    };



    const handleSearch = debounce((value) => {
        setSearchText(value);
        setCurrentPage(1);
    }, 750); // Adjust delay as needed

    const handleSort = (column) => {
        const order = sortColumn === column && sortOrder === 'asc' ? 'desc' : 'asc';
        setSortColumn(column);
        setSortOrder(order);
        fetchUser(); // Fetch the data again with the updated sorting
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




    const handlePageChange = (page, size) => {
        setCurrentPage(page);
        console.log("Page:", page, "Size:", size);
        if (isNaN(size)) {
            setPageSize(totalItems); // Set pageSize to totalItems to display all
        } else {
            setPageSize(parseInt(size, 10)); // Ensure size is an integer
        }
    };



    const handleEdit = (UserId) => {
        const URL = '/event/edit-event-user/';
        navigate(`${process.env.PUBLIC_URL}${URL}${layoutURL}`, { state: { UserId } });
    };

    const handleDelete = async () => {
        try {
            const { UserId } = deleteUserDetails;
            const token = getToken();
            await axios.delete(`${BackendAPI}/eventuser/deleteUser`, {
                headers: {
                    Authorization: `Bearer ${token}` // Include the token in the Authorization header
                },
                data: { UserId } // Include the data payload correctly
            });
            SweetAlert.fire({
                title: 'Success!',
                text: 'User Deleted Successfully!',
                icon: 'success',
                timer: 3000,
                showConfirmButton: false,
                allowOutsideClick: false,
                allowEscapeKey: false
            }).then((result) => {
                if (result.dismiss === SweetAlert.DismissReason.timer) {
                    navigate(`${process.env.PUBLIC_URL}/event/manage-user/Consoft`);
                }
            });
            fetchUser(); // Fetch updated User list
        } catch (error) {
            console.error('Error deleting User:', error);
        }
        setModal(false); // Close modal after deletion
    };


    const openStatusModal = (UserId, userName, currentStatus) => {
        setUserIdToUpdate(UserId);
        setUserName(userName);
        setCurrentStatus(currentStatus);
        setStatusModalOpen(true);
    };


    const closeStatusModal = () => {
        setStatusModalOpen(false);
    };

    const handleStatusUpdate = async () => {
        const UserId = UserIdToUpdate;
        const currentUser = data.find(User => User.id === UserId);
        if (!currentUser) return;
        const currentStatus = currentUser.cs_status;
        const newStatus = currentStatus === 0 ? 1 : 0;
        try {
            const token = getToken();

            await axios.put(`${BackendAPI}/eventuser/UpdateStatus`, { UserId, status: newStatus }, {
                headers: {
                    Authorization: `Bearer ${token}` // Include the token in the Authorization header
                }
            });
            const updatedUsers = data.map((User) =>
                User.id === UserId ? { ...User, cs_status: newStatus } : User
            );
            console.log("updatedUsers", updatedUsers);
            setData(updatedUsers);
        } catch (error) {
            console.error('Error updating status:', error);
        }
        closeStatusModal(); // Close modal after status update
    };

    const openDeleteModal = (UserId) => {
        setDeleteUserDetails({ UserId });
        setModal(true);
    };

    const closeDeleteModal = () => {
        setModal(false);
    };

    const handleNavigation = () => {
        navigate(`${process.env.PUBLIC_URL}/Add-User/Consoft`);
    };

    const toggleModal = () => {
        setModalOpen(!modalOpen);
    };

    const handleDoubleClick = (id, field) => {
        setEditing(prevState => ({
            ...prevState,
            [id]: {
                ...prevState[id],
                [field]: true
            }
        }));
    };

    const handleInputChange = (id, field, value) => {
        setData(prevData =>
            prevData.map(user =>
                user.id === id ? { ...user, [field]: value } : user
            )
        );
    };

    const handleBlur = async (id, field) => {
        const userToUpdate = data.find(user => user.id === id);
        if (!userToUpdate) return;

        const updatedField = field === 'cs_first_name' ? userToUpdate.cs_first_name : userToUpdate.cs_last_name;

        try {
            const token = getToken();
            await axios.post(`${BackendAPI}/eventuser/updateName`, {
                UserId: id,
                firstName: field === 'cs_first_name' ? updatedField : userToUpdate.cs_first_name,
                lastName: field === 'cs_last_name' ? updatedField : userToUpdate.cs_last_name
            }, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            // Display SweetAlert notification
            SweetAlert.fire({
                title: 'Success!',
                text: `${field === 'cs_first_name' ? 'First Name' : 'Last Name'} updated successfully!`,
                icon: 'success',
                timer: 3000,
                showConfirmButton: false,
                allowOutsideClick: false,
                allowEscapeKey: false
            });

            setEditing(prevState => ({
                ...prevState,
                [id]: {
                    ...prevState[id],
                    [field]: false
                }
            }));
        } catch (error) {
            console.error('Error updating user name:', error);
        }
    };

    const handleExport = (option) => {
        if (option === 'CSV') {
            exportToCSV(data, 'User_Data.csv');
        } else if (option === 'Excel') {
            exportToExcel(data, 'User_Data.xlsx');
        }
    };

    // const exportToCSV = (data, filename) => {
    //     const csvData = data.map(row => ({
    //         ...row,
    //         // Customize which fields to include in the CSV
    //     }));

    //     const csvContent = [
    //         Object.keys(csvData[0]).join(','), // Header row
    //         ...csvData.map(row => Object.values(row).join(',')) // Data rows
    //     ].join('\n');

    //     fileDownload(csvContent, filename);
    // };

    const exportToCSV = () => {
        // Filter users based on selectedItems
        const filteredUsers = data.filter(user => selectedItems.includes(user.id));

        console.log("User", filteredUsers);

        // Extract keys from the filteredUsers
        const dataKeys = [...selectedColumns, ...column];
        const combinedLabels = [...label, ...newcolumns];

        console.log("Combined Label", dataKeys);


        // Filter labels to include only those matching the data keys
        const filteredLabels = combinedLabels.filter(labelItem => dataKeys.includes(labelItem.cs_field_name));
        // Add "Sr No." to the beginning of the header labels
        const headers = ["Sr No.", ...filteredLabels.map(labelItem => labelItem.cs_field_label)];

        // Map data with the filtered labels, replace Status values, and add "Sr No."
        const mappedData = filteredUsers.map((item, index) => {
            let newItem = { "Sr No.": index + 1 }; // Add "Sr No." starting from 1
            filteredLabels.forEach(labelItem => {
                if (labelItem.cs_field_name === 'cs_status') {
                    newItem[labelItem.cs_field_label] = item[labelItem.cs_field_name] === 1 ? 'Active' : 'Inactive';
                } else {
                    newItem[labelItem.cs_field_label] = item[labelItem.cs_field_name];
                }
            });
            return newItem;
        });

        // Convert mappedData to CSV and download it
        const csvContent = [
            Object.keys(mappedData[0]).join(','), // Add headers (filtered labels)
            ...mappedData.map(row => Object.values(row).join(',')) // Add rows
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', 'User_data.csv');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };


    // const exportToExcel = (data, filename) => {
    //     const worksheet = utils.json_to_sheet(data);
    //     const workbook = utils.book_new();
    //     utils.book_append_sheet(workbook, worksheet, 'User Data');
    //     const excelBuffer = write(workbook, { bookType: 'xlsx', type: 'array' });

    //     fileDownload(excelBuffer, filename);
    // };

    const exportToExcel = () => {
        // Filter users based on selectedItems
        const filteredUsers = data.filter(user => selectedItems.includes(user.id));

        const dataKeys = Object.keys(data[0]);
        const filteredLabels = label.filter(labelItem => dataKeys.includes(labelItem.cs_field_name));

        // Add "Sr No." to the beginning of the header labels
        const headers = ["Sr No.", ...filteredLabels.map(labelItem => labelItem.cs_field_label)];

        // Map data with the filtered labels, replace Status values, and add "Sr No."
        const mappedData = filteredUsers.map((item, index) => {
            let newItem = { "Sr No.": index + 1 }; // Add "Sr No." starting from 1
            filteredLabels.forEach(labelItem => {
                if (labelItem.cs_field_name === 'cs_status') {
                    newItem[labelItem.cs_field_label] = item[labelItem.cs_field_name] === 1 ? 'Active' : 'Inactive';
                } else {
                    newItem[labelItem.cs_field_label] = item[labelItem.cs_field_name];
                }
            });
            return newItem;
        });

        const worksheet = XLSX.utils.json_to_sheet(mappedData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1');
        XLSX.writeFile(workbook, 'User_Data.xlsx');
    };

    const items = [
        {
            key: '1',
            label: (
                <div onClick={() => handleExport('CSV')}>Export as CSV</div>
            ),
        },
        {
            key: '2',
            label: (
                <div onClick={() => handleExport('Excel')}>Export as Excel</div>
            ),
        },
    ];

    const actions = [
        {
            key: '1',
            label: (
                <div onClick={() => bulkoperation(0)}>Make Inactive</div>
            ),
        },
        {
            key: '2',
            label: (
                <div onClick={() => bulkoperation(1)}>Make Active</div>
            ),
        },
    ];

    const handleColumnChange = (selectedOptions) => {
        setSelectedColumns(selectedOptions.map(option => option.value));
        localStorage.setItem('Columns', JSON.stringify(selectedOptions.map(option => option.value)));
    };

    const MultiValueRemoveWithCondition = ({ children, ...props }) => {
        // Check if the option should be removable
        const shouldRemove = selectedColumns.length > 4 && selectedColumns.indexOf(props.data.value) >= 4;

        // Render the remove button only if the condition is met
        return shouldRemove ? <MultiValueRemove {...props}>{children}</MultiValueRemove> : null;
    };


    const handleSelectAll = (event) => {
        if (event.target.checked) {
            // Select all items
            setSelectedItems(data.map(item => item.id));

        } else {
            // Deselect all items
            setSelectedItems([]);
        }
    };

    const handleSelectRow = (id) => {
        if (selectedItems.includes(id)) {
            // Deselect item
            setSelectedItems(selectedItems.filter(itemId => itemId !== id));
        } else {
            // Select item
            setSelectedItems([...selectedItems, id]);
        }
    };


    const bulkoperation = async (status) => {
        try {
            const token = getToken();

            // Perform the bulk update
            await axios.put(`${BackendAPI}/eventuser/BulkUpdateStatus`, { status, Id: selectedItems }, {
                headers: {
                    Authorization: `Bearer ${token}` // Include the token in the Authorization header
                }
            });

            // Update the local state to reflect the new status
            const updatedUsers = data.map(user =>
                selectedItems.includes(user.id) ? { ...user, cs_status: status } : user
            );

            setData(updatedUsers);
            SweetAlert.fire({
                title: 'Success!',
                text: `Users successfully ${status === 1 ? 'activated' : 'deactivated'}.`,
                icon: 'success',
                timer: 3000,
                showConfirmButton: false
            });
            setSelectedItems([]); // Clear selectedItems after operation


        } catch (error) {
            console.error('Error updating status:', error);
            SweetAlert.fire({
                title: 'Error',
                text: 'An error occurred while updating the users.',
                icon: 'error',
                confirmButtonText: 'OK'
            });
        }
    };


    const getSettings = (user) => [
        ...(ManageUserPermissions?.edit === 1
            ? [{
                key: '1',
                label: (
                    <div onClick={() => handleEdit(user.id)}>
                        <FaEdit /> Edit User
                    </div>
                ),
            }]
            : []
        ),
        {
            key: '2',
            label: (
                <div onClick={() => handleView(user.id)}>
                    <FaEye /> View Details
                </div>
            ),
        },
        // Add more options if needed
    ];






    return (
        <Fragment>
            <Breadcrumbs mainTitle={
                <>
                    Manage User
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
                            Here you can view all registered users. <br />
                            To find a specific user, enter their name or details in the search field. <br />
                            You can edit user information, manage the user's status (<span className="text-success">Active</span> or <span className="text-danger">Inactive</span>), and view details by clicking the View button.

                        </PopoverBody>
                    </UncontrolledPopover>
                </>
            } parent="Event App Admin" title="Manage User" />
            <Container fluid={true}>
                <Row>
                    <Col sm="12">
                        <Card>
                            {/* <CardHeader className="d-flex justify-content-between align-items-center flex-column flex-md-row">
                                <div className="mb-2 mb-md-0">
                                    <h5 className="mb-2 text-start">Users</h5>
                                    <Input
                                        placeholder="Search User"
                                        onChange={e => handleSearch(e.target.value)}
                                        style={{ width: 200 }}
                                    />
                                </div>
                                {ManageUserPermissions?.add === 1 && (
                                    <button onClick={handleNavigation} className="btn btn-warning">
                                        Create User
                                    </button>
                                )}
                            </CardHeader> */}


                            <CardHeader>
                                <div className='d-flex align-items-center w-100'>
                                    <div className="mb-2 mb-md-0 w-100">
                                        {/* <h5 className="mb-2 text-start">{Title} User List</h5> */}
                                        <InputGroup style={{ width: '100%', maxWidth: '200px', borderRadius: '20px' }}>
                                            <InputGroupText>
                                                <FiSearch />
                                            </InputGroupText>
                                            <Input
                                                placeholder="Search User"
                                                onChange={e => handleSearch(e.target.value)}
                                            // style={{ borderRadius: '20px' }}
                                            />
                                        </InputGroup>

                                    </div>
                                    {/* <div className="text-md-end w-100 mt-2 mt-md-0 text-end text-wrap">
                                        <Button color="primary" onClick={toggleModal}>Select Columns</Button>

                                        {selectedItems.length > 0 && (
                                            <D menu={{ items: actions }} placement="bottomLeft" arrow>
                                                <Button color="primary"> ◻ With Selected</Button>
                                            </D>
                                        )}
                                        {selectedItems.length > 0 && (
                                            <D menu={{ items }} placement="bottomRight" arrow>
                                                <Button className='ms-2' color="warning">Export</Button>
                                            </D>
                                        )}
                                    </div> */}
                                    <div className="text-md-end w-100 mt-2 mt-md-0 text-end text-wrap">
                                        {/* Modal Button with Tooltip */}


                                        <Button
                                            color=""
                                            className='circular'
                                            onClick={toggleModal} data-tooltip-id="insertTooltip"
                                        >
                                            <TbColumnInsertRight
                                                className='buttonStyle'
                                            />

                                        </Button>
                                        <Tooltip id="insertTooltip" place="top" effect="solid">
                                            Select Column
                                        </Tooltip>



                                        {/* Export Button with Tooltip */}
                                        {selectedItems.length > 0 && (
                                            <>
                                                <D menu={{ items }} placement="bottomRight" arrow trigger={['click']}>
                                                    <Button
                                                        color=""
                                                        className='circular'
                                                        data-tooltip-id="exportTooltip"
                                                    >
                                                        <BiExport className='buttonStyle' />
                                                    </Button>
                                                </D>
                                                <Tooltip id="exportTooltip" place="top" effect="solid">
                                                    Export Data
                                                </Tooltip>


                                            </>
                                        )}

                                        {/* Actions Button with Tooltip */}
                                        {selectedItems.length > 0 && (
                                            <>
                                                <D menu={{ items: actions }} placement="bottomLeft" arrow trigger={['click']}>
                                                    <Button
                                                        color=""
                                                        className='circular'
                                                        data-tooltip-id="actionsTooltip"
                                                    >
                                                        <BsThreeDots
                                                            className='buttonStyle'
                                                        />
                                                    </Button>
                                                </D>
                                                <Tooltip id="actionsTooltip" place="top" effect="solid">
                                                    More Actions
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
                                        <p className='text-center'>No User found</p>
                                    ) : (

                                        <Table className="table">
                                            <thead>
                                                <tr className="border-bottom-primary">
                                                    {/* Checkbox column header */}
                                                    <th scope='col' className='text-center'>
                                                        <input
                                                            type="checkbox"
                                                            onChange={handleSelectAll} // Function to handle 'select all' checkbox
                                                        />
                                                    </th>
                                                    <th scope='col' className='text-start'>{'Sr No.'}</th>
                                                    {selectedColumns.map((col) => (
                                                        <th className='text-center' key={col} onClick={() => handleSort(col)}>
                                                            {allColumns.find(column => column.value === col)?.label}
                                                            {getSortIndicator(col)}
                                                        </th>
                                                    ))}
                                                    <th scope='col' className='text-center' onClick={() => handleSort('cs_status')}>
                                                        {'Status'}
                                                        {getSortIndicator('cs_status')}
                                                    </th>
                                                    {/* <th scope='col' className='text-center'>{'Status'}</th> */}
                                                    {ManageUserPermissions?.edit === 1 || ManageUserPermissions?.delete === 1 || ManageUserPermissions?.print === 1 ? (
                                                        <th scope='col' className='text-center'>{'Action'}</th>
                                                    ) : null}
                                                </tr>
                                            </thead>

                                            <tbody className='text-center'>
                                                {data.map((user, index) => (
                                                    <tr key={index} className="border-bottom-primary">
                                                        {/* Checkbox for each row */}
                                                        <td className='text-center'>
                                                            <input
                                                                type="checkbox"
                                                                checked={selectedItems.includes(user.id)} // Determine if the row is selected
                                                                onChange={() => handleSelectRow(user.id)} // Function to handle row selection
                                                            />
                                                        </td>
                                                        <td className='text-start'>{(currentPage - 1) * pageSize + index + 1}</td>
                                                        {selectedColumns.map((col) => (
                                                            <td key={col}>{user[col]}</td>
                                                        ))}

                                                        <td className='text-center'>
                                                            {user.cs_status === "0" || user.cs_status === 0 ? (
                                                                <span style={{ color: 'red', fontSize: '20px', cursor: "pointer" }}
                                                                    onClick={() => openStatusModal(user.id, user.cs_first_name, user.cs_status)}
                                                                    data-tooltip-id="tooltip"
                                                                    data-tooltip-content="Inactive status"
                                                                    data-tooltip-event="click focus">
                                                                    <GoDotFill />
                                                                </span>
                                                            ) : (
                                                                <span
                                                                    style={{ color: 'green', fontSize: '20px', cursor: "pointer" }}
                                                                    onClick={() => openStatusModal(user.id, user.cs_first_name, user.cs_status)}
                                                                    data-tooltip-id="tooltip"
                                                                    data-tooltip-content="Active status"
                                                                    data-tooltip-event="click focus">
                                                                    <GoDotFill />
                                                                </span>
                                                            )}
                                                            <Tooltip id="tooltip" globalEventOff="click" />
                                                        </td>
                                                        {ManageUserPermissions?.edit === 1 || ManageUserPermissions?.delete === 1 || ManageUserPermissions?.print === 1 ? (
                                                            <td className='text-center'>
                                                                <Tooltip id="tooltip" globalEventOff="click" />
                                                                {/* {ManageUserPermissions?.edit === 1 && (
                                                                    <Button color="primary" size="sm"
                                                                        data-tooltip-id="tooltip"
                                                                        data-tooltip-content="Edit User"
                                                                        data-tooltip-event="click focus" onClick={() => handleEdit(user)} >
                                                                        <FaEdit />
                                                                    </Button>
                                                                )}
                                                                <Button color="info" size="sm" onClick={() => handleView(user.id)}
                                                                    data-tooltip-id="tooltip"
                                                                    data-tooltip-content="View Details"
                                                                    data-tooltip-event="click focus">
                                                                    <FaEye />
                                                                </Button> */}
                                                                {/* {UserListingpermissions?.delete === 1 && (
                                                                    <Button color="danger" size="sm"
                                                                        data-tooltip-id="tooltip"
                                                                        data-tooltip-content="Remove User"
                                                                        data-tooltip-event="click focus"  >
                                                                        <MdDelete />
                                                                    </Button>
                                                                )} */}

                                                                <D
                                                                    menu={{ items: getSettings(user) }} // Pass user to getSettings
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
            <Modal isOpen={modalOpen} toggle={toggleModal}>
                <ModalHeader toggle={toggleModal}>Select Columns</ModalHeader>
                <ModalBody>
                    <Select
                        options={allColumns.map(column => ({
                            value: column.value,
                            label: column.label,
                            isDisabled: column.isFixed // Disable fixed columns
                        }))}
                        isMulti
                        value={selectedColumns.map(col => ({
                            value: col,
                            label: allColumns.find(column => column.value === col)?.label
                        }))}
                        onChange={handleColumnChange}
                        isClearable={false}
                        components={{
                            MultiValueRemove: MultiValueRemoveWithCondition // Use custom MultiValueRemove component
                        }}
                    />
                </ModalBody>
                <ModalFooter>
                    {/* <Button color="primary" onClick={handleModalSave}>Save</Button>{' '}
                    <Button color="secondary" onClick={toggleModal}>Cancel</Button> */}
                </ModalFooter>
            </Modal>

            <Modal isOpen={statusModalOpen} toggle={closeStatusModal} allowOutsideClick='false' centered size="md">
                <ModalHeader toggle={closeStatusModal}>Confirmation</ModalHeader>
                <ModalBody>
                    <div className='ms-2'>
                        <p>Are you sure you want to change the status of <strong>{UserName}</strong> to {currentStatus === 0 ? "Active" : "Inactive"}?</p>
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
                        <p>Are you sure you want to delete {UserName} User?</p>
                    </div>
                </ModalBody>
                <ModalFooter>
                    <Button color="primary" onClick={handleDelete}>Yes</Button>
                    <Button color="warning" onClick={closeDeleteModal}>No</Button>
                </ModalFooter>
            </Modal>
            {selectedUser && (
                <Modal isOpen={isViewModalOpen} toggle={() => setIsViewModalOpen(false)}>
                    <ModalHeader toggle={() => setIsViewModalOpen(false)}>User Details</ModalHeader>
                    <ModalBody>
                        <Table className='table table-bordered table-striped' style={{ width: '100%', marginBottom: '1rem' }}>
                            <tbody>
                                {selectedUser.cs_regno && (
                                    <tr>
                                        <td><strong>Registration Number:</strong></td>
                                        <td>{selectedUser.cs_regno}</td>
                                    </tr>
                                )}

                                <tr>
                                    <td><strong>Name:</strong></td>
                                    <td>{selectedUser.cs_title} {selectedUser.cs_first_name} {selectedUser.cs_last_name}</td>
                                </tr>

                                <tr>
                                    <td><strong>Email:</strong></td>
                                    <td>{selectedUser.cs_email}</td>
                                </tr>
                                <tr>
                                    <td><strong>Contact Number:</strong></td>
                                    <td>{selectedUser.cs_phone}</td>
                                </tr>
                                <tr>
                                    <td><strong>Category:</strong></td>
                                    <td>{selectedUser.cs_reg_category}</td>
                                </tr>
                                <tr>
                                    <td><strong>Username:</strong></td>
                                    <td>{selectedUser.cs_username}</td>
                                </tr>
                                <tr>
                                    <td><strong>Registration Date:</strong></td>
                                    <td>{new Date(selectedUser.created_at).toISOString().split('T')[0]}</td>
                                </tr>

                                <tr>
                                    <td><strong>Password:</strong></td>
                                    <td>
                                        <div style={{ display: 'flex', alignItems: 'center' }}>
                                            <span>{showPassword ? selectedUser.cs_password : '********'}</span>
                                            <Button
                                                color="link"
                                                onClick={() => setShowPassword(!showPassword)}
                                                style={{ marginLeft: '8px', padding: 0, color: 'inherit' }}
                                            >
                                                {showPassword ? <FaEyeSlash /> : <FaEye />}                                            </Button>
                                        </div>
                                    </td>
                                </tr>

                            </tbody>
                        </Table>
                    </ModalBody>
                    <ModalFooter>
                        <Button color="warning" onClick={() => setIsViewModalOpen(false)}>Close</Button>
                    </ModalFooter>
                </Modal>
            )}

        </Fragment >
    );
};

export default ManageUser;
