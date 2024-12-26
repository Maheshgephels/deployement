import React, { Fragment, useEffect, useState } from 'react';
import { Container, Row, Col, Card, Table, CardHeader, CardBody } from 'reactstrap';
import axios from 'axios';
import { BackendAPI } from '../../api';
import useAuth from '../../Auth/protectedAuth';
import { getToken } from '../../Auth/Auth';
import moment from 'moment-timezone'; // Import moment-timezone for timezone support

const LatestSignUpUsers = () => {
    useAuth();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const AdminTimezone = localStorage.getItem('AdminTimezone');

    useEffect(() => {
        fetchLatestBasicUsers();
    }, []);

    const fetchLatestBasicUsers = async () => {
        try {
            const token = getToken();
            const response = await axios.get(`${BackendAPI}/eventdata/latestBasicUsers`, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
            console.log("Fetched users:", response.data.users); // Debugging response data
            setUsers(response.data.users);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching latest basic users:', error);
            setLoading(false);
        }
    };

    return (
        <Fragment>
            <Container fluid={true}>
                <Row>
                    <Col sm="12">
                        <Card>
                            <CardHeader>
                                <h5 className="mb-2 text-start">Latest Sign-Up Users</h5>
                            </CardHeader>
                            <CardBody>
                                {loading ? (
                                    <p>Loading...</p>
                                ) : (
                                    <Table responsive>
                                        <thead>
                                            <tr>
                                                <th>ID</th>
                                                <th>Title</th>
                                                <th>First Name</th>
                                                <th>Last Name</th>
                                                <th>Email</th>
                                                <th>Phone</th>
                                                <th>Username</th>
                                                <th>DateTime</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {users.length > 0 ? (
                                                users.map((user) => {
                                                    console.log("User created_at (raw):", user.created_at);
                                                    
                                                    const formattedDateTime = user.created_at
                                                        ? moment(user.created_at).tz(AdminTimezone).format('YYYY-MM-DD HH:mm:ss')
                                                        : 'Unknown Date';

                                                    return (
                                                        <tr key={user.id}>
                                                            <td>{user.id}</td>
                                                            <td>{user.cs_title}</td>
                                                            <td>{user.cs_first_name}</td>
                                                            <td>{user.cs_last_name}</td>
                                                            <td>{user.cs_email}</td>
                                                            <td>{user.cs_phone || 'N/A'}</td>
                                                            <td>{user.cs_username || 'N/A'}</td>
                                                            <td>{formattedDateTime}</td>
                                                        </tr>
                                                    );
                                                })
                                            ) : (
                                                <tr>
                                                    <td colSpan="8" className="text-center">No User found</td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </Table>
                                )}
                            </CardBody>
                        </Card>
                    </Col>
                </Row>
            </Container>
        </Fragment>
    );
};

export default LatestSignUpUsers;
