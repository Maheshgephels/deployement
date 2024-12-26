import React, { Fragment, useEffect, useState, useContext } from 'react';
import { Container, Row, Col, Card, Table, CardHeader, CardBody, Input, Button, Modal, ModalHeader, ModalFooter, ModalBody } from 'reactstrap';
import { Breadcrumbs } from '../../AbstractElements';
import axios from 'axios';
import { BackendAPI } from '../../api';
import SweetAlert from 'sweetalert2';
import { Link, useNavigate } from 'react-router-dom';
import { Pagination } from 'antd';
import CustomizerContext from '../../_helper/Customizer';
import { PermissionsContext } from '../../contexts/PermissionsContext';
import { getToken } from '../../Auth/Auth';
import moment from 'moment-timezone'; // Import moment-timezone for timezone support
import useAuth from '../../Auth/protectedAuth';

const LoggedInUsers = () => {
    useAuth();
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalItems, setTotalItems] = useState(0);
    const [pageSize, setPageSize] = useState(10);
    const [searchText, setSearchText] = useState('');
    const { layoutURL } = useContext(CustomizerContext);
    const navigate = useNavigate();
    const { permissions } = useContext(PermissionsContext);

    const AdminTimezone = localStorage.getItem('AdminTimezone');

    useEffect(() => {
        fetchLoggedInUsers();
    }, [currentPage, pageSize, searchText, permissions]);

    const fetchLoggedInUsers = async () => {
        try {
            const token = getToken();
            const response = await axios.get(`${BackendAPI}/eventdata/getLoggedInUsers?page=${currentPage}&pageSize=${pageSize}&search=${searchText}`, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
            setData(response.data.users);
            setTotalItems(response.data.totalItems);
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

    return (
        <Fragment>
            <Breadcrumbs mainTitle="Manage Logged-In Users" parent="User Management" title="Logged-In Users" />
            <Container fluid={true}>
                <Row>
                    <Col sm="12">
                        <Card>
                            <CardHeader>
                                <div className='d-flex align-items-center w-100'>
                                    <div className="mb-2 mb-md-0 w-100">
                                        <h5 className="mb-2 text-start">Logged-In Users</h5>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardBody>
                                <div className='table-responsive'>
                                    {loading ? (
                                        <p>Loading...</p>
                                    ) : (
                                        <Table>
                                            <thead>
                                                <tr className='border-bottom-primary'>
                                                    <th scope='col' className='text-start'>{'Sr No.'}</th>
                                                    <th scope='col' className='text-start'>{'Title'}</th>
                                                    <th scope='col' className='text-start'>{'First Name'}</th>
                                                    <th scope='col' className='text-start'>{'Last Name'}</th>
                                                    <th scope='col' className='text-start'>{'Username'}</th>
                                                    <th scope='col' className='text-start'>{'Category'}</th>
                                                    <th scope='col' className='text-start'>{'Login Time'}</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {data.length > 0 ? (
                                                    data.map((item, index) => (
                                                        <tr key={index} className="border-bottom-primary">
                                                            <td className='text-start'>{(currentPage - 1) * pageSize + index + 1}</td>
                                                            <td className='text-start'>{item.cs_title}</td>
                                                            <td className='text-start'>{item.cs_first_name}</td>
                                                            <td className='text-start'>{item.cs_last_name}</td>
                                                            <td className='text-start'>{item.username}</td>
                                                            <td className='text-start'>{item.cs_reg_category}</td>
                                                            <td className='text-start'>
                                                                {moment(item.login_time).tz(AdminTimezone).format('YYYY-MM-DD HH:mm:ss')}
                                                            </td>

                                                        </tr>
                                                    ))
                                                ) : (
                                                    <tr>
                                                        <td colSpan="7" className="text-center">No User found</td>
                                                    </tr>
                                                )}
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
        </Fragment>
    );
};

export default LoggedInUsers;
