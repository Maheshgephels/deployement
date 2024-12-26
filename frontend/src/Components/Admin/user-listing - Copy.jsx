import React, { Fragment, useState, useEffect } from 'react';
import { Container, Row, Col, Card, CardBody, CardHeader, Button, Table, Input, Modal, ModalHeader, ModalBody, ModalFooter } from 'reactstrap';
import { Breadcrumbs, P } from '../../../src/AbstractElements';
import axios from 'axios';
import { FaEdit } from 'react-icons/fa';
import { MdDelete } from "react-icons/md";
import Select, { components } from 'react-select';
import { Pagination } from 'antd';
import { BackendAPI } from '../../api';
import { getToken } from '../../Auth/Auth';
import useAuth from '../../Auth/protectedAuth';

const { MultiValueRemove } = components;

const UserListing = () => {
    const [users, setUsers] = useState([]);
    const [selectedColumns, setSelectedColumns] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalItems, setTotalItems] = useState(0);
    const [pageSize, setPageSize] = useState(10);
    const [searchText, setSearchText] = useState('');
    const [modalOpen, setModalOpen] = useState(false);
    const [response, setResponse] = useState(null);
    const [allColumns, setAllColumns] = useState([]);

    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const token = getToken(); 
                const response = await axios.get(`${BackendAPI}/manageuser/getUser?page=${currentPage}&pageSize=${pageSize}&search=${searchText}`, {
                    headers: {
                        Authorization: `Bearer ${token}` // Include the token in the Authorization header
                    }
                });
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
    }, [currentPage, pageSize, searchText]);

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


    return (
        <Fragment>
            <Breadcrumbs parentClickHandler={handleNavigation} mainTitle="User Listing" parent="Manage User" title="User Listing" />
            <Container fluid={true}>
                <Row>
                    <Col sm="12">
                        <Card>
                            <CardHeader className="d-flex justify-content-between align-items-center flex-column flex-md-row">
                                <div className="mb-2 mb-md-0">
                                    <h5 className="mb-2 text-start">User Listing</h5>
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
