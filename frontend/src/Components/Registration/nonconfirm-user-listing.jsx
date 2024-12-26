import React, { Fragment, useState, useEffect, useContext, useCallback } from 'react';
import { Container, Row, Col, Card, CardBody, CardHeader, Button, Table, Input, Modal, ModalHeader, ModalBody, ModalFooter, PopoverBody, UncontrolledPopover, InputGroup, InputGroupText } from 'reactstrap';
import { Breadcrumbs, P } from '../../AbstractElements';
import axios from 'axios';
import { GoDotFill } from "react-icons/go";
import { FaEdit, FaSortUp, FaSortDown, FaClone, FaCheckCircle } from 'react-icons/fa';
import { FiSearch } from "react-icons/fi";
import { BiSort, BiSortAlt2 } from "react-icons/bi";
import { TbColumnInsertRight } from "react-icons/tb";
import { BsThreeDotsVertical, BsThreeDots } from "react-icons/bs";
import { MdDelete, MdInfoOutline } from "react-icons/md";
import { BiExport } from "react-icons/bi";
import SweetAlert from 'sweetalert2';
import Select, { components } from 'react-select';
import { Pagination } from 'antd';
import { BackendAPI } from '../../api';
import { useLocation } from 'react-router-dom';
// import generatePDFFromBadgeData from '../Badge-Design/badgeDownlode/BadgePDFDownloadButton';
import { IoMdPrint } from "react-icons/io";
import { GrPowerCycle } from "react-icons/gr";
import { Tooltip } from 'react-tooltip';
import { ToastContainer, toast } from "react-toastify";
import generatePDFFromBadgeListforList from '../Badge-Design/badgeDownlode/UserListbadgeprint';
import { PermissionsContext } from '../../contexts/PermissionsContext';
import CustomizerContext from '../../_helper/Customizer';
import { Link, useNavigate } from 'react-router-dom';
import debounce from 'lodash.debounce';
import { Button as B, Dropdown as D, Menu } from 'antd';
import fileDownload from 'js-file-download';
import * as XLSX from 'xlsx';
import moment from 'moment';


// import ProtectedRoute, { useAuthentication } from '../../Auth/protectedroutes';
import useAuth from '../../Auth/protectedAuth';
import { getToken } from '../../Auth/Auth';



const { MultiValueRemove } = components;

const NonConfirmUserListing = () => {

    useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    // const { catID } = useParams(); // Extract catID from URL params
    const [data, setData] = useState([]);
    const [label, setLabel] = useState([]);
    const [selectedItems, setSelectedItems] = useState([]);
    const [users, setUsers] = useState([]);
    const { catID } = location.state || {};
    const { Title } = location.state || {};
    const [selectedColumns, setSelectedColumns] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalItems, setTotalItems] = useState(0);
    const [pageSize, setPageSize] = useState(10);
    const [searchText, setSearchText] = useState('');
    const [sortColumn, setSortColumn] = useState(''); // Column to sort by
    const [sortOrder, setSortOrder] = useState('desc'); // Sort order (asc/desc)
    const [modalOpen, setModalOpen] = useState(false);
    const [statusModalOpen, setStatusModalOpen] = useState(false); // New state for modal visibility
    const [duplicateModalOpen, setDuplicateModalOpen] = useState(false); // New state for modal visibility
    const [response, setResponse] = useState([]);
    const [allColumns, setAllColumns] = useState([]);
    const [errorMessage, setErrorMessage] = useState('');
    const { permissions } = useContext(PermissionsContext);
    const { layoutURL } = useContext(CustomizerContext);
    const [userName, setuserName] = useState(null);
    const [currentStatus, setCurrentStatus] = useState(null);
    const [currentDuplicate, setCurrentDuplicate] = useState(null);
    const [userId, setuserId] = useState(null); // user ID to update status
    const [tempId, settempId] = useState(null); // user ID to update status
    const [userReg, setuserReg] = useState(null); // user ID to update status
    const opt = 'NonConf';




    console.log("Data:", data);
    console.log("Testing:", permissions);
    console.log("Label:", label);
    console.log("User:", users);
    console.log("Selected:", selectedColumns);
    console.log("Available:", allColumns);


    console.log("Slected ID:", selectedItems);

    const newColumns = [
        { cs_field_name: 'order_id', cs_field_label: 'Order Id' },
        { cs_field_name: 'tracking_id', cs_field_label: 'Tracking Id' },
        { cs_field_name: 'payment_date', cs_field_label: 'Payment Date' },
        { cs_field_name: 'regamount', cs_field_label: 'Total Registration Amount' },
        { cs_field_name: 'total_paid_amount', cs_field_label: 'Total Paid Amount' }
    ];

    const column = ['order_id', 'payment_date', 'regamount', 'total_paid_amount', 'tracking_id'];

    const combinedColumns = [...selectedColumns, ...column];



    // console.log("User name:", userName);



    const fetchUsers = useCallback(async () => {
        try {
            const token = getToken();
            // Convert selectedColumns to a comma-separated string
            const columnsParam = combinedColumns.join(',');

            let url = `${BackendAPI}/reguser/getTempUser?opt=${opt}&page=${currentPage}&pageSize=${pageSize}&search=${searchText}&sortColumn=${sortColumn}&sortOrder=${sortOrder}&selectedColumns=${columnsParam}`;
            if (catID) {
                url += `&catID=${catID}`;
            }
            const response = await axios.get(url, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
            setData(response.data);
            setResponse(response.data);
            setUsers(response.data.Users);
            setTotalItems(response.data.totalItems);
            const availableColumns = response.data.allColumn.map(column => ({
                value: column.cs_field_name,
                label: column.cs_field_label
            }));
            setAllColumns(availableColumns);
            setLabel(response.data.allColumn);
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    }, [currentPage, pageSize, searchText, catID, sortColumn, sortOrder]);

    useEffect(() => {
        fetchUsers();
    }, [fetchUsers]);

    // const handleSearch =  (
    //     debounce((value) => {
    //         setSearchText(value);
    //         setCurrentPage(1);
    //     }, 750), // Adjust delay as needed
    //     []
    // );


    // useEffect(() => {
    //     const fetchUsers = async () => {
    //         try {
    //             const token = getToken(); 
    //             const { catID } = location.state || {};
    //             let url = `${BackendAPI}/reguser/getUser?page=${currentPage}&pageSize=${pageSize}&search=${searchText}`;
    //             if (catID) {
    //                 url += `&catID=${catID}`;
    //             }
    //             const response = await axios.get(url, {
    //                 headers: {
    //                     Authorization: `Bearer ${token}`
    //                 }
    //             });
    //             setResponse(response.data);
    //             setUsers(response.data.Users);
    //             setTotalItems(response.data.totalItems);
    //             setLoading(false);
    //             const availableColumns = response.data.allColumn.map(column => ({
    //                 value: column.cs_field_name,
    //                 label: column.cs_field_label
    //             }));
    //             setAllColumns(availableColumns);
    //         } catch (error) {
    //             console.error('Error fetching data:', error);
    //             setLoading(false);
    //         }
    //     };

    //     fetchUsers();
    // }, [currentPage, pageSize, searchText, catID, permissions]);

    const UserListingpermissions = permissions['NonConfirmUserListing'];

    useEffect(() => {
        const storedColumns = localStorage.getItem('confirmColumns');
        if (storedColumns) {
            setSelectedColumns(JSON.parse(storedColumns));
        } else if (allColumns.length > 0) {
            setSelectedColumns(allColumns.slice(0, 4).map(column => column.value));
        }
    }, [allColumns]);

    const toggleModal = () => {
        setModalOpen(!modalOpen);
    };

    const handlePageChange = (page, size) => {
        setCurrentPage(page);
        setPageSize(size);
    };

    // const handleSearch = (value) => {
    //     setSearchText(value);
    //     setCurrentPage(1);
    // };

    //  const handleSearch =  (
    //     debounce((value) => {
    //         setSearchText(value);
    //         setCurrentPage(1);
    //     }, 750), // Adjust delay as needed
    //     []
    // );

    const handleSearch = debounce((value) => {
        setSearchText(value);
        setCurrentPage(1);
    }, 750); // Adjust delay as needed


    const handleEditUser = async (user) => {
        const catId = user.id;
        const URL = '/registration/edit-basic-user/';
        navigate(`${process.env.PUBLIC_URL}${URL}${layoutURL}`, { state: { Data: user } });
    };

    const handleColumnChange = (selectedOptions) => {
        setSelectedColumns(selectedOptions.map(option => option.value));
        localStorage.setItem('confirmColumns', JSON.stringify(selectedOptions.map(option => option.value)));
    };

    const MultiValueRemoveWithCondition = ({ children, ...props }) => {
        // Check if the option should be removable
        const shouldRemove = selectedColumns.length > 4 && selectedColumns.indexOf(props.data.value) >= 4;

        // Render the remove button only if the condition is met
        return shouldRemove ? <MultiValueRemove {...props}>{children}</MultiValueRemove> : null;
    };





    const openStatusModal = (userID, userName, currentStatus) => {
        setuserReg(userID);
        setuserName(userName);
        setCurrentStatus(currentStatus);
        setStatusModalOpen(true);
    };


    const closeStatusModal = () => {
        setStatusModalOpen(false);
    };


    const handleStatusUpdate = async () => {
        const regno = userReg;
        const currentuser = users.find(user => user.id === regno);
        if (!currentuser) return;
        const currentStatus = currentuser.cs_status;
        const newStatus = currentStatus === 0 ? 1 : 0;

        console.log("newStatus", newStatus);
        try {
            const token = getToken();
            await axios.put(`${BackendAPI}/reguser/UpdateStatus`, { regno, status: newStatus }, {
                headers: {
                    Authorization: `Bearer ${token}` // Include the token in the Authorization header
                }
            });
            const updatedusers = users.map((user) =>
                user.id === regno ? { ...user, cs_status: newStatus } : user
            );
            setUsers(updatedusers);
        } catch (error) {
            console.error('Error updating status:', error);
        }
        closeStatusModal(); // Close modal after status update
    };

    const openDuplicateModal = (user) => {
        setuserId(user.id)
        settempId(user.temppayment_id);
        setuserName(user.cs_first_name);
        setCurrentDuplicate(user.cs_isduplicate);
        setDuplicateModalOpen(true);
    };


    const closeDuplicateModal = () => {
        setDuplicateModalOpen(false);
    };

    const handleDiscardedUser = async () => {
        const Temp_Id = tempId;
        const Discard = 0;
        const Id = userId;
        // const currentuser = users.find(user => user.id === Temp_Id);
        // if (!currentuser) return;
        // const currentDuplicate = currentuser.cs_isduplicate;
        // const newDuplicate = currentDuplicate === 0 ? 1 : 0;

        console.log("Duplicate id", Id);
        try {
            const token = getToken();
            await axios.put(`${BackendAPI}/reguser/DiscardEntry`, { Temp_Id, Discard }, {
                headers: {
                    Authorization: `Bearer ${token}` // Include the token in the Authorization header
                }
            });
            const updatedusers = users.map((user) =>
                user.id === Id ? { ...user, is_discarded: Discard } : user
            );
            setUsers(updatedusers);
        } catch (error) {
            console.error('Error updating status:', error);
        }
        closeDuplicateModal(); // Close modal after status update
    };


    const handleDuplicateUpdate = async () => {
        const Id = userId;
        const currentuser = users.find(user => user.id === Id);
        if (!currentuser) return;
        const currentDuplicate = currentuser.cs_isduplicate;
        const newDuplicate = currentDuplicate === 0 ? 1 : 0;

        console.log("Duplicate id", Id);
        try {
            const token = getToken();
            await axios.put(`${BackendAPI}/reguser/UpdateDuplicate`, { Id, duplicate: newDuplicate }, {
                headers: {
                    Authorization: `Bearer ${token}` // Include the token in the Authorization header
                }
            });
            const updatedusers = users.map((user) =>
                user.id === Id ? { ...user, cs_isduplicate: newDuplicate } : user
            );
            setUsers(updatedusers);
        } catch (error) {
            console.error('Error updating status:', error);
        }
        closeDuplicateModal(); // Close modal after status update
    };

    const handleSort = (column) => {
        const order = sortColumn === column && sortOrder === 'asc' ? 'desc' : 'asc';
        setSortColumn(column);
        setSortOrder(order);
        fetchUsers(); // Fetch the data again with the updated sorting
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

    const handleExport = (option) => {
        if (option === 'CSV') {
            exportToCSV(users, 'User_Data.csv');
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
        const filteredUsers = users.filter(user => selectedItems.includes(user.id));

        // Extract keys from the filteredUsers
        const dataKeys = [...selectedColumns, ...column];
        const combinedLabels = [...label, ...newColumns];

        // Filter labels to include only those matching the data keys
        const filteredLabels = combinedLabels.filter(labelItem => dataKeys.includes(labelItem.cs_field_name));

        // Get the admin's timezone
        const AdminTimezone = localStorage.getItem('AdminTimezone');
        // Add "Sr No." to the beginning of the header labels
        const headers = ["Sr No.", ...filteredLabels.map(labelItem => labelItem.cs_field_label)];

        // Map filtered users data
        const mappedData = filteredUsers.map((item, index) => {
            let newItem = { "Sr No.": index + 1 }; // Add "Sr No." starting from 1

            filteredLabels.forEach(labelItem => {
                if (labelItem.cs_field_name === 'cs_status') {
                    newItem[labelItem.cs_field_label] = item[labelItem.cs_field_name] === 1 ? 'Active' : 'Inactive';
                } else if (labelItem.cs_field_name === 'payment_date') {
                    // Format the payment_date to Admin's timezone
                    const formattedDate = moment(item.payment_date)
                        .tz(AdminTimezone)
                        .format('YYYY-MM-DD HH:mm:ss');

                    newItem[labelItem.cs_field_label] = formattedDate; // Add formatted payment date
                } else {
                    newItem[labelItem.cs_field_label] = item[labelItem.cs_field_name];
                }
            });

            return newItem;
        });

        // Convert mappedData to CSV and download it
        const csvContent = [
            headers.join(','), // Add headers
            ...mappedData.map(row => headers.map(header => row[header] || '').join(',')) // Add rows
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
        // Assume selectedColumns and label are already defined

        // Filter users based on selectedItems
        const filteredUsers = users.filter(user => selectedItems.includes(user.id));

        // Extract keys from the filteredUsers
        const dataKeys = [...selectedColumns, ...column];
        const combinedLabels = [...label, ...newColumns];

        // Filter labels to include only those matching the data keys
        const filteredLabels = combinedLabels.filter(labelItem => dataKeys.includes(labelItem.cs_field_name));

        // Get the admin's timezone
        const AdminTimezone = localStorage.getItem('AdminTimezone');
        // Add "Sr No." to the beginning of the header labels
        const headers = ["Sr No.", ...filteredLabels.map(labelItem => labelItem.cs_field_label)];

        // Map filtered users data
        const mappedData = filteredUsers.map((item, index) => {
            let newItem = { "Sr No.": index + 1 }; // Add "Sr No." starting from 1

            filteredLabels.forEach(labelItem => {
                if (labelItem.cs_field_name === 'cs_status') {
                    newItem[labelItem.cs_field_label] = item[labelItem.cs_field_name] === 1 ? 'Active' : 'Inactive';
                } else if (labelItem.cs_field_name === 'payment_date') {
                    // Format the payment_date to Admin's timezone
                    const formattedDate = moment(item.payment_date)
                        .tz(AdminTimezone)
                        .format('YYYY-MM-DD HH:mm:ss');

                    newItem[labelItem.cs_field_label] = formattedDate; // Add formatted payment date
                } else {
                    newItem[labelItem.cs_field_label] = item[labelItem.cs_field_name];
                }
            });

            return newItem;
        });
        // Create worksheet and workbook
        const worksheet = XLSX.utils.json_to_sheet(mappedData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1');
        XLSX.writeFile(workbook, 'User_Data.xlsx');
    };



    const items = [
        {
            key: '2',
            label: (
                <div onClick={() => handleExport('CSV')}>Export as CSV</div>
            ),
        },
        {
            key: '3',
            label: (
                <div onClick={() => handleExport('Excel')}>Export as Excel</div>
            ),
        },
    ];

    const actions = (users) => [
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
        {
            key: '3',
            label: (
                <div onClick={() => bulkoperation(3)}>Make Unduplicate</div>
            ),
        },
        {
            key: '4',
            label: (
                <div onClick={() => bulkoperation(2)}>Make Duplicate</div>
            ),
        },
        {
            key: '5',
            label: (
                <div onClick={() => handleResendMail(0)}>
                    <GrPowerCycle /> Resend login mail
                </div>
            ),
        },
    ];

    const getSettings = (user) => [
        // {
        //     key: '1',
        //     label: (
        //         <div onClick={() => handleEditUser(user)}>
        //             <FaEdit /> Edit
        //         </div>
        //     ),
        // },
        // {
        //     key: '2',
        //     label: (
        //         <div onClick={() => openDuplicateModal(user)}>
        //             <FaClone /> Mark a {user.cs_isduplicate === 1 ? "Unduplicate" : "Duplicate"}
        //         </div>
        //     ),
        // },
        // {
        //     key: '3',
        //     label: (
        //         <div onClick={() => openDuplicateModal(user)}>
        //             <FaClone /> Mark a Unduplicate
        //         </div>
        //     ),
        // },
        {
            key: '2',
            label: (
                <div onClick={() => handleConfirmUser(user)}>
                    <FaCheckCircle /> Confirm User
                </div>
            ),
        },
        {
            key: '3',
            label: (
                <div onClick={() => openDuplicateModal(user)}>
                    <MdDelete /> Mark a Discarded
                </div>
            ),
        },
        {
            key: '5',
            label: (
                <div onClick={() => handleResendMail(user.id)}>
                    <GrPowerCycle /> Resend login mail
                </div>
            ),
        },
        // Add more options if needed
    ];

    const handleConfirmUser = async (user) => {
        const URL = '/registration/admin-confirm-user/';
        navigate(`${process.env.PUBLIC_URL}${URL}${layoutURL}`, { state: { Data: user } });
    };



    const handleSelectAll = (event) => {
        if (event.target.checked) {
            // Select all items
            setSelectedItems(users.map(item => item.id));

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
            await axios.put(`${BackendAPI}/reguser/BulkUpdateStatus`, { status, Id: selectedItems }, {
                headers: {
                    Authorization: `Bearer ${token}` // Include the token in the Authorization header
                }
            });

            // Update the local state to reflect the new status
            const updatedUsers = users.map(user =>
                selectedItems.includes(user.id) ? { ...user, cs_status: status } : user
            );

            setData(updatedUsers);
            fetchUsers();
            SweetAlert.fire({
                title: 'Success!',
                text: `Users successfully ${status === 1 ? 'activated' : 'deactivated'}.`,
                icon: 'success',
                timer: 3000,
                showConfirmButton: false,
                allowOutsideClick: false,
                allowEscapeKey: false
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

    const handleResendMail = async (id) => {
        const toastId = toast.info('Processing...', { autoClose: false });

        console.log("Id", id);

        try {
            const cs_id = id;
            const temp_id = 7;
            const flag = 1;
            const token = getToken();

            const response = await axios.post(`${BackendAPI}/sendgrid/resend`, { cs_id, Id: selectedItems, Template_id: temp_id, flag }, {
                headers: {
                    Authorization: `Bearer ${token}`, // Include the token in the Authorization header
                },
            });

            // Dismiss the processing toast
            toast.dismiss(toastId);

            // Show success alert
            await SweetAlert.fire({
                title: 'Success!',
                text: 'Mail sent successfully!',
                icon: 'success',
                timer: 3000,
                showConfirmButton: false,
                allowOutsideClick: false,
                allowEscapeKey: false,
            });

            console.log('Save response', response.data);
        } catch (error) {
            console.error('Error sending mail:', error);

            // Dismiss the processing toast
            toast.dismiss(toastId);

            // Display the error message from the response or a default message
            const errorMessage = error.response?.data?.message || 'There was an error sending the email. Please try again later.';
            toast.error(errorMessage);
        }
    };





    return (
        <Fragment>
            <Breadcrumbs mainTitle={
                <>
                    Manage Non Confirm Users
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
                            Here you can view all users and select fields to see additional details.
                            <br />
                            To find a specific user, enter their name or details in the search field.
                            <br />
                            You can edit user information, print their badge, and reset their facility count. Additionally, you can export the data displayed on the listing page.
                        </PopoverBody>
                    </UncontrolledPopover>
                </>
            } parent="Manage User" title="Manage Non Confirm Users" />
            <Container fluid={true}>
                <Row>
                    <Col sm="12">
                        <Card>
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
                                    <div className="text-md-end w-100 mt-2 mt-md-0 text-end text-wrap">
                                        {/* Modal Button with Tooltip */}
                                        {/* {1 === 1 && (
                                            <>
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
                                            </>
                                        )} */}

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
                                                <D menu={{ items: actions(users[0]) }} placement="bottomLeft" arrow trigger={['click']}>
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
                            <CardBody className='p-1 pb-3'>
                                <div className='table-responsive'>
                                    {loading ? (
                                        <p>Loading...</p>
                                    ) : users.length === 0 ? (
                                        <p className='text-center pt-3'>No user found</p>
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
                                                    {/* {selectedColumns.map((col) => (
                                                        <th className='text-center' key={col} onClick={() => handleSort(col)}>
                                                            {allColumns.find(column => column.value === col)?.label}
                                                            {getSortIndicator(col)}
                                                        </th>
                                                    ))} */}
                                                    <th scope='col' className='text-center' onClick={() => handleSort('cs_first_name')}>
                                                        {'First Name'}
                                                        {getSortIndicator('cs_first_name')}
                                                    </th>
                                                    {/* <th scope='col' className='text-center' onClick={() => handleSort('cs_last_name')}>
                                                        {'Last Name'}
                                                        {getSortIndicator('cs_last_name')}
                                                    </th> */}
                                                    {/* <th scope='col' className='text-center' onClick={() => handleSort('cs_email')}>
                                                        {'Email'}
                                                        {getSortIndicator('cs_email')}
                                                    </th> */}
                                                    <th scope='col' className='text-center' onClick={() => handleSort('order_id')}>
                                                        {'Order Id'}
                                                        {getSortIndicator('order_id')}
                                                    </th>
                                                    <th scope='col' className='text-center' onClick={() => handleSort('payment_date')}>
                                                        {'Payment Date'}
                                                        {getSortIndicator('payment_date')}
                                                    </th>
                                                    <th scope='col' className='text-center' onClick={() => handleSort('cs_reg_category')}>
                                                        {'Category'}
                                                        {getSortIndicator('cs_reg_category')}
                                                    </th>
                                                    <th scope='col' className='text-center' onClick={() => handleSort('cs_email')}>
                                                        {'Reg Type'}
                                                        {getSortIndicator('cs_email')}
                                                    </th>
                                                    <th scope='col' className='text-center' onClick={() => handleSort('regamount')}>
                                                        {'Total Reg Amount'}
                                                        {getSortIndicator('regamount')}
                                                    </th>
                                                    <th scope='col' className='text-center' onClick={() => handleSort('total_paid_amount')}>
                                                        {'Total Paid Amount'}
                                                        {getSortIndicator('total_paid_amount')}
                                                    </th>
                                                    <th scope='col' className='text-center' onClick={() => handleSort('cs_status')}>
                                                        {'Status'}
                                                        {getSortIndicator('cs_status')}
                                                    </th>
                                                    {/* <th scope='col' className='text-center'>{'Status'}</th> */}
                                                    {UserListingpermissions?.edit === 1 || UserListingpermissions?.delete === 1 || UserListingpermissions?.print === 1 ? (
                                                        <th scope='col' className='text-center'>{'Action'}</th>
                                                    ) : null}
                                                </tr>
                                            </thead>

                                            <tbody className='text-center'>
                                            {users
                                                    .filter(user => user.is_discarded === 1)  // Only include users where is_discarded is 1
                                                    .map((user, index) => (
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
                                                        {/* {selectedColumns.map((col) => (
                                                            <td key={col}>{user[col]}</td>
                                                        ))} */}
                                                        <td className='text-center'>{`${user.cs_first_name} ${user.cs_last_name}`}</td>
                                                        {/* <td className='text-center'>{user.cs_email}</td> */}
                                                        <td className='text-center'>{user.order_id}</td>
                                                        <td className='text-center'>
                                                            {moment(user.payment_date).format('YYYY-MM-DD HH:mm:ss')}
                                                        </td>
                                                        <td className='text-center'>{user.cs_reg_category}</td>
                                                        <td className='text-start'>
                                                            {user.ticket_title || user.addon_title
                                                                ? `Ticket: ${user.ticket_title || ''} Addon: ${user.addon_title || ''}`
                                                                : 'Not selected'}
                                                        </td>


                                                        <td className='text-center'>{user.regamount}</td>
                                                        <td className='text-center'>{user.total_paid_amount}</td>

                                                        {/* <td className='text-center'>
                                                            {user.cs_status === 0 ? (
                                                                <span style={{ color: 'red', fontSize: '20px', cursor: "pointer" }}
                                                                    onClick={() => openStatusModal(user.cs_regno, user.cs_first_name, user.cs_status)}
                                                                    data-tooltip-id="tooltip"
                                                                    data-tooltip-content="Inactive status"
                                                                    data-tooltip-event="click focus"
                                                                >
                                                                    <GoDotFill />
                                                                </span>
                                                            ) : (
                                                                <GoDotFill
                                                                    style={{ color: "green", fontSize: '20px', cursor: "pointer" }}
                                                                    onClick={() => openStatusModal(user.cs_regno, user.cs_first_name, user.cs_status)}
                                                                    data-tooltip-id="tooltip"
                                                                    data-tooltip-content="Active status"
                                                                    data-tooltip-event="click focus"
                                                                />
                                                            )}

                                                        </td> */}
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
                                                        {UserListingpermissions?.edit === 1 || UserListingpermissions?.delete === 1 || UserListingpermissions?.print === 1 ? (
                                                            <td className='text-center'>
                                                                <Tooltip id="tooltip" globalEventOff="click" />
                                                                {/* {UserListingpermissions?.edit === 1 && (
                                                                    <Button color="primary" size="sm"
                                                                        data-tooltip-id="tooltip"
                                                                        data-tooltip-content="Edit User"
                                                                        data-tooltip-event="click focus" onClick={() => handleEditUser(user)} >
                                                                        <FaEdit />
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

            {/* commented for static listing
            <Modal isOpen={modalOpen} toggle={toggleModal}>
                <ModalHeader toggle={toggleModal}>Select Columns</ModalHeader>
                <ModalBody>
                    {response && (
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


                    )}
                </ModalBody>
                <ModalFooter>
                    <Button color="primary" onClick={handleModalSave}>Save</Button>{' '}
                    <Button color="secondary" onClick={toggleModal}>Cancel</Button>
                </ModalFooter>
            </Modal> */}

            {/* Status Confirmation Modal */}
            <Modal isOpen={statusModalOpen} toggle={closeStatusModal} allowOutsideClick='false' centered size="md">
                <ModalHeader toggle={closeStatusModal}>Confirmation</ModalHeader>
                <ModalBody>
                    <div className='ms-2'>
                        <p>Are you sure you want to change the status of {userName} to {currentStatus === 0 ? "Active" : "Inactive"}?</p>
                    </div>
                </ModalBody>
                <ModalFooter>
                    <Button color="primary" onClick={handleStatusUpdate}>Yes</Button>
                    <Button color="warning" onClick={closeStatusModal}>No</Button>
                </ModalFooter>
            </Modal>
            {/* Discard Confirmation Modal */}
            <Modal isOpen={duplicateModalOpen} toggle={closeDuplicateModal} allowOutsideClick='false' centered size="md">
                <ModalHeader toggle={closeDuplicateModal}>Confirmation</ModalHeader>
                <ModalBody>
                    <div className='ms-2'>
                        <p>Are you sure you want to proceed with changes to <strong>{userName}</strong>? This will discard the payment entry associated with this user.</p>
                    </div>
                </ModalBody>
                <ModalFooter>
                    <Button color="primary" onClick={handleDiscardedUser}>Yes</Button>
                    <Button color="warning" onClick={closeDuplicateModal}>No</Button>
                </ModalFooter>
            </Modal>
        </Fragment>
    );
};

export default NonConfirmUserListing;
