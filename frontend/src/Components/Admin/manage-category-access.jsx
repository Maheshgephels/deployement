import React, { Fragment, useEffect, useState, useContext } from 'react';
import { Container, Row, Col, Card, Table, CardHeader, CardBody, Input, Button, Modal, ModalHeader, ModalFooter, ModalBody, PopoverBody, UncontrolledPopover, InputGroup, InputGroupText } from 'reactstrap';
import { Breadcrumbs } from '../../AbstractElements';
import axios from 'axios';
import { BackendAPI } from '../../api';
import { Link, useNavigate } from 'react-router-dom'; // Import useHistory for programmatic navigation
import { GoDotFill } from "react-icons/go";
import { MdDelete, MdInfoOutline } from "react-icons/md";
import { FiSearch } from "react-icons/fi";
import { BiSort, BiSortAlt2 } from "react-icons/bi";
import { BsThreeDotsVertical, BsThreeDots } from "react-icons/bs";
import { FaKey, FaSortUp, FaSortDown } from 'react-icons/fa'; // Import the key icon
import { Pagination } from 'antd';
import CustomizerContext from '../../_helper/Customizer';
import { classes } from '../../Data/Layouts';
import { Tooltip } from 'react-tooltip';
import { PermissionsContext } from '../../contexts/PermissionsContext';
import { getToken } from '../../Auth/Auth';
import SweetAlert from 'sweetalert2';
import useAuth from '../../Auth/protectedAuth';


const CategoryPermissions = () => {
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
    const navigate = useNavigate(); // Initialize useHistory
    const { permissions } = useContext(PermissionsContext);
    const [isProcessing, setIsProcessing] = useState(false);
    const [prodData, setProdData] = useState([]);


    useEffect(() => {
        fetchCategory();
        fetchCat();
    }, [currentPage, pageSize, searchText, permissions]);

    // Extract Category Access component
    const CategoryAccesspermissions = permissions['CategoryPermissions'];

    const fetchCategory = async () => {
        try {
            const token = getToken();
            // const Response = await axios.get(`${BackendAPI}/category/getCategory?page=${currentPage}&pageSize=${pageSize}&search=${searchText}`, {
            //     headers: {
            //         Authorization: `Bearer ${token}` // Include the token in the Authorization header
            //     }
            // });
            const Response = await axios.get(`${BackendAPI}/category/getCategory`, {
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
            console.log(Response.data); // Log the response data
            setData(Response.data.categories); // Assuming categories property contains the array
            setTotalItems(Response.data.totalItems);
            const catIds = Response.data.categories.map(category => category.cs_reg_cat_id);
            setCatIds(catIds); // Update the catIds state
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
           
            setProdData(response.data.prodData)
        } catch (error) {
            console.error('Error fetching types:', error);
        }
    };

    // const handleBadgeData = async () => {
    //     const token = getToken();

    //     try {
    //         setIsProcessing(true); // Disable button and show processing
    //         const response = await axios.get(`${BackendAPI}/category/genratebadgedata`, {
    //             headers: {
    //                 Authorization: `Bearer ${token}`,
    //             },
    //         });

    //         // Handle the response if needed
    //         console.log(response.data);

    //         // Show success alert
    //         SweetAlert.fire({
    //             title: 'Success!',
    //             text: 'Badge data generated successfully.',
    //             icon: 'success',
    //             confirmButtonText: 'OK',
    //         });
    //     } catch (error) {
    //         console.error("Error fetching badge data:", error);

    //         // Show error alert
    //         SweetAlert.fire({
    //             title: 'Error!',
    //             text: 'An error occurred while generating badge data.',
    //             icon: 'error',
    //             confirmButtonText: 'OK',
    //         });
    //     } finally {
    //         setIsProcessing(false); // Re-enable the button
    //     }
    // };

    const handleBadgeData = async () => {
        const token = getToken();
    
        // Show confirmation alert before proceeding
        const result = await SweetAlert.fire({
            title: 'Are you sure?',
            text: 'Do you want to generate the badge data?',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Yes',
            cancelButtonText: 'No',
        });
    
        if (result.isConfirmed) {
            try {
                setIsProcessing(true); // Disable button and show processing
                const response = await axios.get(`${BackendAPI}/category/genratebadgedata`, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });
    
                // Handle the response if needed
                console.log(response.data);
    
                // Show success alert after generating badge data
                SweetAlert.fire({
                    title: 'Success!',
                    text: 'Badge data generated successfully.',
                    icon: 'success',
                    showConfirmButton: false, // No "OK" button in success alert
                    timer: 2000, // Optionally, auto-close after 2 seconds
                });
            } catch (error) {
                console.error("Error fetching badge data:", error);
    
                // Show error alert
                SweetAlert.fire({
                    title: 'Error!',
                    text: 'An error occurred while generating badge data.',
                    icon: 'error',
                    confirmButtonText: 'OK',
                });
            } finally {
                setIsProcessing(false); // Re-enable the button
            }
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


    const handleManagePermission = (catId, catName) => {
        const URL = '/onsite/edit-category-permission/';
        // Pass data as state through route props
        navigate(`${process.env.PUBLIC_URL}${URL}${layoutURL}`, { state: { catId, catName } });
    };

    const resetBadgeData = async (catIds) => {
        try {
            const token = getToken();
            const response = await axios.post(`${BackendAPI}/category/resetBadgeData`, { catIds }, {
                headers: {
                    Authorization: `Bearer ${token}` // Include the token in the Authorization header
                }
            });
            // Assuming the response contains updated data in a property called 'categories'
            setModal(false);

            SweetAlert.fire({
                title: 'Success!',
                text: 'Badge data reset successfully!',
                icon: 'success',
                timer: 3000,
                showConfirmButton: false,
                allowOutsideClick: false,
                allowEscapeKey: false
            }).then((result) => {
                // if (result.dismiss === SweetAlert.DismissReason.timer) {
                //     navigate(`${process.env.PUBLIC_URL}/dashboard/default/${layoutURL}`);
                // }
            });

        } catch (error) {
            console.error('Error resetting badge data:', error);
            setLoading(false);
        }
    };










    return (
        <Fragment>
            <Breadcrumbs mainTitle={
                <>
                    Manage Category Permission
                    <MdInfoOutline
                        id="permissionPopover"
                        style={{
                            cursor: 'pointer', position: 'absolute', marginLeft: '5px'
                        }}
                    />
                    <UncontrolledPopover
                        placement="bottom"
                        target="permissionPopover"
                        trigger="focus"
                    >
                        <PopoverBody>
                            Users will be granted access to facilities based on the allowed count for each category. <br />
                            Ensure you set the facility count accurately for each category to reflect the appropriate access limits.
                            Adjust the facility count as needed to match the requirements for each user category.
                        </PopoverBody>
                    </UncontrolledPopover>
                </>
            } parent="Onsite App" title="Manage Categories Permission" />
            <Container fluid={true}>
                <Row>
                    <Col sm="12">
                        <Card>
                            {/* <CardHeader className="d-flex justify-content-between align-items-center flex-column flex-md-row">
                                <div className="mb-2 mb-md-0">
                                    <h5 className="mb-2 text-center">Category Access</h5>
                                </div>
                                <div className="mt-2 mt-md-0">
                                    <Input
                                        placeholder="Search Category"
                                        onChange={e => handleSearch(e.target.value)}
                                        style={{ width: 200 }}
                                    />
                                </div>
                            </CardHeader> */}
                            <CardHeader>
                                <div className='d-flex align-items-center'>
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
                                    {CategoryAccesspermissions?.validate === 1 && (
    prodData && prodData.some(item => (item.product_id === 1 || item.product_id === 2) && item.cs_status === 1) && (
        <div className="text-md-end w-100 mt-2 mt-md-0 text-end text-wrap">
            <Button onClick={handleBadgeData} color='warning' disabled={isProcessing}>
                {isProcessing ? 'Processing...' : 'Generate Badge Data'}
            </Button>
        </div>
    )
)}

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
                                                    {/* <th scope='col' className='text-center'>{'Status'}</th> */}
                                                    {CategoryAccesspermissions?.edit === 1 && (
                                                        <th scope='col' className='text-end'>{'Action'}</th>
                                                    )}
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {data.map((item, index) => (
                                                    <tr key={index} className="border-bottom-primary">
                                                        <td className='text-start'>{index + 1}</td> {/* Incremental serial number */}
                                                        <td className='text-start'>{item.cs_reg_category}</td>
                                                        {/* <td className='text-center'>
                                                            {item.cs_status === '0' ? (
                                                                <span style={{ color: 'red', fontSize: '20px' }}>
                                                                    <GoDotFill />
                                                                </span>
                                                            ) : (
                                                                <span style={{ color: 'green', fontSize: '20px' }}>
                                                                    <GoDotFill />
                                                                </span>
                                                            )}
                                                        </td> */}
                                                        {CategoryAccesspermissions?.edit === 1 && (
                                                            <td className='text-end'>
                                                                <Tooltip id="tooltip" globalEventOff="click" />

                                                                <Button color="primary" size="sm" onClick={() => handleManagePermission(item.cs_reg_cat_id, item.cs_reg_category)}
                                                                    data-tooltip-id="tooltip"
                                                                    data-tooltip-content="Category Access"
                                                                    data-tooltip-event="click focus" >
                                                                    <FaKey /> {/* Key icon inside the button */}
                                                                </Button>
                                                            </td>
                                                        )}
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </Table>
                                    )}

                                </div>
                                {CategoryAccesspermissions?.validate === 1 && (
                                    <div className='text-end'>
                                        <Button color='warning' type='submit' className="mr-2 mt-3" onClick={() => setModal(true)}>
                                            Reset All Badge Data
                                        </Button>
                                    </div>
                                )}

                                {/* Pagination */}
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
                                {/* End Pagination */}
                            </CardBody>
                        </Card>
                    </Col>
                </Row>
            </Container>

            {/* Modal */}
            <Modal isOpen={modal} toggle={() => setModal(!modal)} centered size="md">
                <ModalHeader toggle={() => setModal(!modal)}>Warning: Reseting Badge Data</ModalHeader>
                <ModalBody>
                    <div style={{ marginBottom: '20px' }}>
                        <p><strong>Alert:  Reset Badge Data</strong></p>
                        <p>
                            Resetting badge data will clear all scan and taken data for all users. This action will not affect the assigned permissions for users.
                            Before proceeding, please ensure that you want to reset the scan and usage counts for all users, as this action cannot be undone.
                        </p>
                        <p>Are you sure you want to continue?</p>
                    </div>
                </ModalBody>
                <ModalFooter>
                    <Button color="primary" onClick={() => resetBadgeData(catIds)}>Sure</Button>
                    <Button color="secondary" onClick={() => setModal(!modal)}>Cancel</Button>
                </ModalFooter>
            </Modal>
        </Fragment>
    );
};

export default CategoryPermissions;
