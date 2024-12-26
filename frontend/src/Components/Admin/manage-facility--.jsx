import React, { Fragment, useEffect, useState, useContext } from 'react';
import { Container, Row, Col, Card, Table, CardHeader, Button, CardBody, Media, Label, Input } from 'reactstrap';
import { Breadcrumbs } from '../../AbstractElements';
import { GoDotFill } from "react-icons/go";
import { Link, useNavigate } from 'react-router-dom';
import { FaEdit } from 'react-icons/fa';
import { MdDelete } from "react-icons/md";
import CustomizerContext from '../../_helper/Customizer';
import axios from 'axios';
import { BackendAPI } from '../../api';
import { BackendPath } from '../../api';
import { Pagination } from 'antd';
import SweetAlert from 'sweetalert2';




const Facility = () => {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(0);
    const [pageSize, setPageSize] = useState(10);
    const [totalItems, setTotalItems] = useState(0);
    const [searchText, setSearchText] = useState('');
    const navigate = useNavigate();
    const { layoutURL } = useContext(CustomizerContext);


    useEffect(() => {
        fetchRoles();
    }, [currentPage, pageSize, searchText]);

    const fetchRoles = async () => {
        try {
            const token = getToken();
            const response = await axios.get(`${BackendAPI}/user/getfacility?page=${currentPage}&pageSize=${pageSize}&search=${searchText}`,{
                headers: {
                    Authorization: `Bearer ${token}` // Include the token in the Authorization header
                }
            });
            setData(response.data.facilities);
            setTotalPages(response.data.totalPages);
            setTotalItems(response.data.totalItems);
            setLoading(false);
            // console.log(response.data);
        } catch (error) {
            console.error('Error fetching roles:', error);
            setLoading(false);
        }
    };

    const handlePageChange = (page, size) => {
        setCurrentPage(page);
        setPageSize(size);
    };

    const handlePageSizeChange = (size) => {
        setPageSize(size);
        setCurrentPage(1); // Reset to first page when changing page size
        // Refetch data with the new page size
        fetchRoles();
    };


    const handleSearch = (value) => {
        setSearchText(value);
    };


    const handleStatusUpdate = async (cs_facility_id, currentStatus, cs_display_name ) => {
        // Calculate the new status based on the current status
        const newStatus = currentStatus == 0 ? 1 : 0;
        try {
            // Update the status via API call
            await axios.put(`${BackendAPI}/user/UpdateStatus`, { id: cs_facility_id, status: newStatus, Name: cs_display_name });
            
            // Update the data state immediately to reflect the change in the UI
            const updatedFacilities = data.map((facility) =>
                facility.cs_facility_id === cs_facility_id ? { ...facility, cs_status: newStatus } : facility
            );
            setData(updatedFacilities);
        } catch (error) {
            console.error('Error updating status:', error);
        }
    };

    const editFacility = (facilityId) => {
        console.log(facilityId);
        const URL = '/Edit-facility/';
        // Pass data as state through route props
        navigate(`${process.env.PUBLIC_URL}${URL}${layoutURL}`, { state: { facilityId } });
    };
    


    const handleDelete = async (facilityId) => {
        try {
            await axios.delete(`${BackendAPI}/user/deleteFacility/${facilityId}`);
    
            SweetAlert.fire({
                title: 'Warning!',
                text: 'Facility removed successfully!',
                icon: 'success',
                timer: 3000,
                showConfirmButton: false,
                allowOutsideClick: false,
                allowEscapeKey: false 
            }).then((result) => {
                if (result.dismiss === SweetAlert.DismissReason.timer) {
                    navigate("/manage-facility/Consoft");
                }
            });
        } catch (error) {
            console.error('Error deleting facility:', error);
        }
    };

        const handleNavigation = () => {
        navigate(`${process.env.PUBLIC_URL}/Add-Workshop/Consoft`);
      };
    



    return (
        <Fragment>
            <Breadcrumbs parentClickHandler={handleNavigation} mainTitle="Manage Facility" parent="Onsite App" title="Manage Facility" />
            <Container fluid={true}>
                <Row>
                    <Col sm="12">
                        <Card>
                            <CardHeader className="d-flex justify-content-between align-items-center flex-column flex-md-row">
                                <div className="mb-2 mb-md-0">
                                    <h5 className="mb-2">Facilities</h5>
                                    <Input
                                        placeholder="Search all columns"
                                        onChange={e => handleSearch(e.target.value)}
                                        style={{ width: 200 }}
                                    />
                                </div>
                                <div className="mt-2 mt-md-0">
                                    <Link to="/create-facility/Consoft" className="btn btn-warning">Create Facility</Link>
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
                                                    <th scope='col'>{'Display Name'}</th>
                                                    <th scope='col'>{'Type'}</th>
                                                    <th scope='col'>{'Logo'}</th>
                                                    <th scope='col'>{'Daywise'}</th>
                                                    <th scope='col' className='text-center'>{'Status'}</th>
                                                    <th scope='col' className='text-end'>{'Action'}</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {data.map((item, index) => (
                                                    <tr key={index} className="border-bottom-primary">
                                                        <td className='text-start'>{(currentPage - 1) * pageSize + index + 1}</td> {/* Calculate the serial number based on the current page and page size */}
                                                        <td>{item.cs_display_name}</td>
                                                        <td>{item.cs_type}</td>
                                                        <td >
                                                            <img
                                                                src={`${BackendPath}${item.cs_logo_image_url}`}
                                                                alt="Logo"
                                                                className="img-fluid mr-2 "
                                                                style={{ maxWidth: '30px' }} // Set the maximum width dynamically
                                                            />
                                                            <img
                                                                src={`${BackendPath}${item.cs_logo_darkmode_image_url}`}
                                                                alt="Logo"
                                                                className="img-fluid mr-2 bg-dark"
                                                                style={{ maxWidth: '30px' }} // Set the maximum width dynamically
                                                            />
                                                            {/* <img src={item.logo_darkmode_image_url} alt="Logo" className="img-fluid" style={{ maxWidth: '30px', backgroundColor: 'black' }} /> */}

                                                        </td>

                                                        <td >

                                                            <Media body className="icon-state switch-sm">
                                                                <Label className="switch">
                                                                    <Input type="checkbox" checked={item.cs_daywise == 'Yes'} />
                                                                    <span className={"switch-state " + (item.cs_daywise === 'Yes' ? "bg-success" : "bg-danger")}></span>
                                                                </Label>
                                                            </Media>
                                                        </td>

                                                        {/* <td className="text-center">
                                                            {item.daywise == 'No' ? (
                                                                <span style={{ color: 'green', fontSize: '20px' }}>
                                                                    <FaToggleOn />
                                                                </span>
                                                            ) : (
                                                                <span style={{ color: 'red', fontSize: '20px' }}>
                                                                    <FaToggleOff />                                                            </span>

                                                            )}
                                                        </td> */}
                                                        {/* <td>
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

                                                        <td className='text-center'>
                                                            {item.cs_status == 0 ? (
                                                                <span style={{ color: 'red', fontSize: '20px', cursor: "pointer" }}
                                                                    onClick={() => handleStatusUpdate(item.cs_facility_id, item.cs_status, item.cs_display_name)}>
                                                                    <GoDotFill />
                                                                </span>
                                                            ) : (
                                                                <span style={{ color: 'green', fontSize: '20px', cursor: "pointer" }}
                                                                    onClick={() => handleStatusUpdate(item.cs_facility_id, item.cs_status, item.cs_display_name)}>
                                                                    <GoDotFill />
                                                                </span>
                                                            )}
                                                        </td>


                                                        <td className='text-end'>
                                                            <Button color="primary" size="sm" onClick={() => editFacility(item.cs_facility_id)} >
                                                                <FaEdit /> {/* Key icon inside the button */}
                                                            </Button>

                                                            <Button color="danger" size="sm" onClick={() => handleDelete(item.cs_facility_id)}  >
                                                                <MdDelete /> {/* Delete icon inside the button */}
                                                            </Button>

                                                        </td>
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

export default Facility;
