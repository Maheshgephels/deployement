import React, { Fragment, useEffect, useState, useContext } from 'react';
import { Container, Row, Col, Card, Table, CardHeader, CardBody, Input, Button } from 'reactstrap';
import { Breadcrumbs } from '../../AbstractElements';
import axios from 'axios';
import { BackendAPI } from '../../api';
import { Link, useNavigate } from 'react-router-dom';
import { GoDotFill } from "react-icons/go";
import { FaEdit } from 'react-icons/fa';
import { MdDelete } from "react-icons/md";
import { useLocation } from 'react-router-dom';
import { Pagination } from 'antd';
import CustomizerContext from '../../_helper/Customizer';
import SweetAlert from 'sweetalert2';
import { getToken } from '../../Auth/Auth';
import useAuth from '../../Auth/protectedAuth';


const ScannedRecords = () => {
    useAuth();
    const location = useLocation();
    const [data, setData] = useState([]);
    const { facilityType } = location.state || {};
    const { Title } = location.state || {};
    const { Total } = location.state || {};
    const { TotalAllowCount } = location.state || {};
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalItems, setTotalItems] = useState(0);
    const [pageSize, setPageSize] = useState(10);
    const [searchText, setSearchText] = useState('');
    
    const { layoutURL } = useContext(CustomizerContext);
    const navigate = useNavigate();

    useEffect(() => {
        fetchScannedRecords();
    }, [currentPage, pageSize, searchText]);

    const fetchScannedRecords = async () => {
        try {
            const { facilityType } = location.state || {};
            const token = getToken(); 
            let apiUrl = `${BackendAPI}/scanrecords/scannedFacilityRecords?page=${currentPage}&pageSize=${pageSize}&search=${searchText}`;
    
            if (facilityType) {
                apiUrl += `&facilityType=${facilityType}`;
            }
    
            const response = await axios.get(apiUrl,{
                headers: {
                                Authorization: `Bearer ${token}` // Include the token in the Authorization header
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
    
    

    const handlePageChange = (page, size) => {
        setCurrentPage(page);
        setPageSize(size);
    };

    const handleSearch = (value) => {
        setSearchText(value);
        setCurrentPage(1);
    };

    const handleEdit = (catId) => {
        // Handle edit action
    };

    const handleDelete = async (catId) => {
        // Handle delete action
    };


    const handleNavigation = () => {
        navigate(`${process.env.PUBLIC_URL}/dashboard/default/Consoft`);
    };



    return (
        <Fragment>
            <Breadcrumbs parentClickHandler={handleNavigation} mainTitle="Scanned Facility" parent="Onsite App" title="Scanned Facility Records" />
            <Container fluid={true}>
                <Row>
                    <Col sm="12">
                        <Card>
                            <CardHeader className="d-flex justify-content-between align-items-center flex-column flex-md-row">
                                <div className="mb-2 mb-md-0">
                                    <h5 className="mb-2 text-start">{ Title } Scanned Records</h5>
                                    <Input
                                        placeholder="Search"
                                        onChange={e => handleSearch(e.target.value)}
                                        style={{ width: 200 }}
                                    />
                                </div>
                                <div className="mt-2 mt-md-0">
                                    <h6 className="mb-2 text-start">{ Total } / { TotalAllowCount } </h6>
                                </div>
                            </CardHeader>

                            <CardBody>
                                <div className='table-responsive'>
                                    {loading ? (
                                        <p>Loading...</p>
                                    ) : data.length > 0 ? (
                                        <Table>
                                            <thead>
                                                <tr className='border-bottom-primary'>
                                                    <th scope='col' className='text-start'>{'Sr No.'}</th>
                                                    <th scope='col' className='text-start'>{'Reg No'}</th>
                                                    <th scope='col' className='text-center'>{'Full Name'}</th>
                                                    <th scope='col' className='text-center'>{'Category'}</th>
                                                    <th scope='col' className='text-center'>{'Device ID'}</th>
                                                    <th scope='col' className='text-center'>{'Date Time'}</th>
                                                    {/* <th scope='col' className='text-end'>{'Time'}</th> */}
                                                    {/* <th scope='col' className='text-end'>{'Action'}</th> */}
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {data.map((item, index) => (
                                                    <tr key={index} className="border-bottom-primary">
                                                        <td className='text-start'>{(currentPage - 1) * pageSize + index + 1}</td>
                                                        <td className='text-start'>{item.cs_regno}</td>
                                                        <td className='text-center'>{item.cs_title} {item.cs_first_name} {item.cs_last_name}</td>
                                                        <td className='text-center'>{item.cs_reg_category}</td>
                                                        <td className='text-center'>{item.cs_deviceid}</td>
                                                        <td className='text-center'>{item.cs_date + item.cs_time}</td>
                                                        {/* <td className='text-center'>{item.cs_time}</td> */}
                                                        
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </Table>
                                    ) : (
                                        <p>No Scanned data found for this Facility</p> // Display message when no data is found
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

export default ScannedRecords;
