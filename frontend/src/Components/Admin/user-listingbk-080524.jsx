import React, { Fragment, useState, useEffect } from 'react';
import { Container, Row, Col, Card, CardBody, CardHeader, Button, Table, Input, Modal, ModalHeader, ModalBody, ModalFooter } from 'reactstrap';
import { Breadcrumbs, P } from '../../../src/AbstractElements';
import axios from 'axios';
import { FaEdit } from 'react-icons/fa';
import { MdDelete } from "react-icons/md";
import Select, { components } from 'react-select';
import { Pagination } from 'antd';
import { BackendAPI } from '../../api';
import { useLocation } from 'react-router-dom';
import generatePDFFromBadgeData from '../Badge-Design/badgeDownlode/BadgePDFDownloadButton';
import { IoMdPrint } from "react-icons/io";

const { MultiValueRemove } = components;

const UserListing = () => {
    const location = useLocation();
    // const { catID } = useParams(); // Extract catID from URL params
    const [users, setUsers] = useState([]);
    const { catID } = location.state || {};
    const { Title } = location.state || {};
    const [selectedColumns, setSelectedColumns] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalItems, setTotalItems] = useState(0);
    const [pageSize, setPageSize] = useState(10);
    const [searchText, setSearchText] = useState('');
    const [modalOpen, setModalOpen] = useState(false);
    const [response, setResponse] = useState(null);
    const [allColumns, setAllColumns] = useState([]);

    // console.log(catID);

    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const { catID } = location.state || {}; // Provide a default value for catID
                let url = `${BackendAPI}/manageuser/getUser?page=${currentPage}&pageSize=${pageSize}&search=${searchText}`;
                if (catID) {
                    url += `&catID=${catID}`;
                }
                const response = await axios.get(url);
                setResponse(response.data);
                setUsers(response.data.Users);
                setTotalItems(response.data.totalItems);
                setLoading(false);
                const availableColumns = response.data.allColumn.map(column => ({
                    value: column.cs_field_name,
                    label: column.cs_field_label
                }));
                setAllColumns(availableColumns);
            } catch (error) {
                console.error('Error fetching data:', error);
                setLoading(false);
            }
        };
    
        fetchUsers();
    }, [currentPage, pageSize, searchText, catID]);
    

    // Set initial selectedColumns to include the first four columns
    useEffect(() => {
        if (allColumns.length > 0) {
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

    const handleSearch = (value) => {
        setSearchText(value);
        setCurrentPage(1);
    };



    const handleColumnChange = (selectedOptions) => {
        setSelectedColumns(selectedOptions.map(option => option.value));
    };

const MultiValueRemoveWithCondition = ({ children, ...props }) => {
    // Check if the option should be removable
    const shouldRemove = selectedColumns.length > 4 && selectedColumns.indexOf(props.data.value) >= 4;

    // Render the remove button only if the condition is met
    return shouldRemove ? <MultiValueRemove {...props}>{children}</MultiValueRemove> : null;
};



const handlePrintBadge = async (user) => {


try {    
        const category = user.cs_reg_category;

        console.log("Printing badge for user:", JSON.stringify(user, null, 2));

        const response = await axios.post(`${BackendAPI}/badge/getbadgefileds`, { category });

        const apibadgeDataResponse = response.data.badgedata;


        console.log(apibadgeDataResponse);


        // Dummy API response (replace with your actual API call)
        // const apibadgeDataResponse = {
        //     width: 455.905511811,
        //     height: 900.9527559055,
        //     badge_fields: [
        //         {
        //             cs_field_type_id: 'text',
        //             cs_field_name: 'cs_first_name',
        //             cs_field_position_x: 100,
        //             cs_field_position_y: 50,
        //             cs_text_size: 12,
        //             cs_field_width: 200,
        //             cs_field_height: 200
        //             // Other field properties...
        //         },
        //         {
        //             cs_field_type_id: 'text',
        //             cs_field_name: 'cs_last_name',
        //             cs_field_position_x: 100,
        //             cs_field_position_y: 100,
        //             cs_field_width: 300,
        //             cs_field_height: 200,
        //             cs_text_size: 12
        //             // Other field properties...
        //         },
        //         {
        //             cs_field_type_id: 'qr',
        //             cs_field_name: 'cs_regno',
        //             cs_field_position_x: 100,
        //             cs_field_position_y: 250,
        //             cs_text_size: 12,
        //             cs_field_width: 200,
        //             cs_field_height: 200
                
        //             // Other field properties...
        //         },
        //         {
        //             cs_field_type_id: 'image',
        //             cs_field_name: 'cs_regno',
        //             cs_field_position_x: 100,
        //             cs_field_position_y: 400,
        //             cs_text_size: 12,
        //             cs_field_width: 200,
        //             cs_field_height: 200,
        //             cs_field_content: "https://images.unsplash.com/photo-1617854818583-09e7f077a156?q=80&w=1740&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
                
        //             // Other field properties...
        //         },
        //         {
        //             cs_field_type_id: 'backgroundimg',
        //             cs_field_name: 'cs_regno',
        //             cs_field_position_x: 100,
        //             cs_field_position_y: 400,
        //             cs_text_size: 12,
        //             cs_field_width: 200,
        //             cs_field_height: 200,
        //             cs_field_content: "https://plus.unsplash.com/premium_photo-1671017848638-a154949b71e1?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8OXx8dXJsfGVufDB8fDB8fHww"
                
        //             // Other field properties...
        //         },
             
        //     ]
        // };

        apibadgeDataResponse.badge_fields.forEach(field => {
            // Check if the user object contains a property with the same name as cs_field_name
            if (
                user.hasOwnProperty(field.cs_field_name) &&
                user[field.cs_field_name] !== null && // Check for null values
                user[field.cs_field_name] !== undefined // Check for undefined values
            ) {
                // If the value is a string, update cs_field_name with the corresponding value from the user object
                if (typeof user[field.cs_field_name] === 'string') {
                    field.cs_field_name = user[field.cs_field_name].trim(); // Trim any leading/trailing spaces
                } else { // If the value is not a string, convert it to a string
                    field.cs_field_name = String(user[field.cs_field_name]);
                }
            }
        });

        // // // Now badgeDataResponse contains the updated values from the user object
        console.log("Final badge data before print :", apibadgeDataResponse);
   
        await generatePDFFromBadgeData(apibadgeDataResponse); 
//--------------
    
    } catch (error) {
        console.error('Error fetching badge data:', error);
    }
};





    return (
        <Fragment>
            <Breadcrumbs parentClickHandler={handleNavigation} mainTitle="User Listing" parent="Manage User" title="User Listing" />
            <Container fluid={true}>
                <Row>
                    <Col sm="12">
                        <Card>
                            <CardHeader className="d-flex justify-content-between align-items-center flex-column flex-md-row">
                                <div className="mb-2 mb-md-0">
                                    <h5 className="mb-2 text-start">{ Title } User List</h5>
                                    <Input
                                        placeholder="Search across all columns"
                                        onChange={e => handleSearch(e.target.value)}
                                        style={{ width: 200 }}
                                    />
                                </div>
                                <div className="mt-2 mt-md-0">
                                    <Button color="primary" onClick={toggleModal}>Select Columns</Button>
                                </div>
                            </CardHeader>
                            <CardBody>
                                <div className='table-responsive'>
                                    {loading ? (
                                        <p>Loading...</p>
                                    ) : (
                                        <Table className="table">
                                            <thead>
                                                <tr className="border-bottom-primary">
                                                    <th scope='col' className='text-start'>{'Sr No.'}</th>
                                                    {selectedColumns.map((col) => (
                                                        <th className='text-center' key={col}>{allColumns.find(column => column.value === col)?.label}</th>
                                                    ))}
                                                    <th scope='col' className='text-end'>{'Action'}</th>
                                                </tr>
                                            </thead>

                                            <tbody className='text-center'>
                                                {users.map((user, index) => (
                                                    <tr key={index}>
                                                        <td className='text-start'>{(currentPage - 1) * pageSize + index + 1}</td>
                                                        {selectedColumns.map((col) => (
                                                            <td key={col}>{user[col]}</td>
                                                        ))}
                                                        <td className='text-end'>
                                                            <Button color="primary" size="sm" >
                                                                <FaEdit />
                                                            </Button>
                                                            <Button color="danger" size="sm"  >
                                                                <MdDelete />
                                                            </Button>
                                                            <Button color="info" size="sm" onClick={() => handlePrintBadge(user)}>
                                                                <IoMdPrint />
                                                            </Button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </Table>
                                    )}
                                </div>
                                {totalItems > pageSize && (
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
                         components={{
                             MultiValueRemove: MultiValueRemoveWithCondition // Use custom MultiValueRemove component
                         }}
                     />


                    )}
                </ModalBody>
                <ModalFooter>
                    {/* <Button color="primary" onClick={handleModalSave}>Save</Button>{' '}
                    <Button color="secondary" onClick={toggleModal}>Cancel</Button> */}
                </ModalFooter>
            </Modal>
        </Fragment>
    );
};

export default UserListing;
