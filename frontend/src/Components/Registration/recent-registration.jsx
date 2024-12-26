import React, { Fragment, useState, useEffect } from 'react';
import { Container, Row, Col, Card, CardBody, CardHeader, Table } from 'reactstrap';
import axios from 'axios';
import { FaEdit } from 'react-icons/fa';
import { MdDelete } from "react-icons/md";
import Select, { components } from 'react-select';
import { BackendAPI } from '../../api';
import { getToken } from '../../Auth/Auth';
import useAuth from '../../Auth/protectedAuth';
import moment from 'moment'; // Import moment.js for date formatting


const { MultiValueRemove } = components;

const RecentRegistration = () => {
    useAuth();
    const [users, setUsers] = useState([]);
    const [selectedColumns, setSelectedColumns] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalItems, setTotalItems] = useState(0);
    const [pageSize, setPageSize] = useState(5);
    const [modalOpen, setModalOpen] = useState(false);
    const [response, setResponse] = useState(null);
    const [allColumns, setAllColumns] = useState([]);
    const AdminTimezone = localStorage.getItem('AdminTimezone');


    console.log("Data:", users);

    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const token = getToken();
                const url = `${BackendAPI}/manageuser/getUser?page=${currentPage}&pageSize=${pageSize}&catID=Yes`;
                const response = await axios.get(url, {
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
    }, [currentPage, pageSize]);


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

    const handleColumnChange = (selectedOptions) => {
        setSelectedColumns(selectedOptions.map(option => option.value));
    };

    const MultiValueRemoveWithCondition = ({ children, ...props }) => {
        const shouldRemove = selectedColumns.length > 4 && selectedColumns.indexOf(props.data.value) >= 4;
        return shouldRemove ? <MultiValueRemove {...props}>{children}</MultiValueRemove> : null;
    };


    const dates = users.map(item =>
        item.created_at
            ? moment(item.created_at).tz(AdminTimezone).format('YYYY-MM-DD HH:mm:ss')
            : 'Unknown Date'
    );


    return (
        <Fragment>
            <Container fluid={true}>
                <Row>
                    <Col sm="12">
                        <Card>
                            <CardHeader className="d-flex justify-content-between align-items-center flex-column flex-md-row">
                                <div>
                                    <h5 className="mb-0 text-start">Recent Spot Registration</h5>
                                </div>
                            </CardHeader>
                            <CardBody>
                                <div className='table-responsive'>
                                    {loading ? (
                                        <p>Loading...</p>
                                    ) : users.length === 0 ? (
                                        <p>No recent spot registrations available.</p>
                                    ) : (
                                        <Table className="table">
                                            <thead>
                                                <tr className="border-bottom-primary">
                                                    <th scope='col' className='text-start'>{'Sr No.'}</th>
                                                    {selectedColumns.map((col) => (
                                                        <th className='text-center' key={col}>{allColumns.find(column => column.value === col)?.label}</th>
                                                    ))}
                                                    <th scope='col' className='text-start'>{'DateTime'}</th>
                                                </tr>
                                            </thead>
                                            <tbody className='text-center'>
                                                {users.map((user, index) => (

                                                    <tr key={index}>
                                                        <td className='text-start'>{(currentPage - 1) * pageSize + index + 1}</td>
                                                        {selectedColumns.map((col) => (
                                                            <td key={col}>{user[col]}</td>
                                                        ))}
                                                        <td scope='col' className='text-start'>{dates}</td>
                                                    </tr>
                                                ))}

                                            </tbody>
                                        </Table>
                                    )}
                                </div>
                                {/* {totalItems > pageSize && (
                                <div className="d-flex justify-content-center align-items-center mt-3">
                                    <Pagination
                                        onChange={handlePageChange}
                                        current={currentPage}
                                        pageSize={pageSize}
                                        total={totalItems}
                                        showSizeChanger={true}
                                    />
                                </div>
                            )} */}
                            </CardBody>
                        </Card>
                    </Col>
                </Row>
            </Container>
        </Fragment>
    );
};

export default RecentRegistration;
