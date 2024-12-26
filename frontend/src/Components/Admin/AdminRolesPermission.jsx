import React, { Fragment, useEffect, useState, useContext } from 'react';
import { Container, Row, Col, Card, Table, CardHeader, CardBody, Input, Button, Modal, ModalHeader, ModalFooter, ModalBody } from 'reactstrap';
import { Breadcrumbs } from '../../AbstractElements';
import axios from 'axios';
import { BackendAPI } from '../../api';
import SweetAlert from 'sweetalert2';
import { Link, useNavigate } from 'react-router-dom';
import { GoDotFill } from "react-icons/go";
import { FaEdit, FaKey } from 'react-icons/fa';
import { MdDelete } from "react-icons/md";
import { Pagination } from 'antd';
import CustomizerContext from '../../_helper/Customizer';
import { classes } from '../../Data/Layouts';
import { Tooltip } from 'react-tooltip';
import { PermissionsContext } from '../../contexts/PermissionsContext';
import { getToken } from '../../Auth/Auth';
import Select from 'react-select';
import useAuth from '../../Auth/protectedAuth';

const AdminRolesPermission = () => {
  useAuth();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [searchText, setSearchText] = useState('');
  const [catIds, setCatIds] = useState([]);
  const { layoutURL } = useContext(CustomizerContext);
  const [modal, setModal] = useState(false);
  const navigate = useNavigate();
  const [selectedRole, setSelectedRole] = useState(null);
  const [selectedReplacementUser, setSelectedReplacementUser] = useState('');
  const { permissions } = useContext(PermissionsContext);
  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [roleId, setRoleId] = useState(null);
  const [currentStatus, setCurrentStatus] = useState(null);

  console.log("Before", data);


  useEffect(() => {
    fetchRoles();
  }, [currentPage, pageSize, searchText, permissions]);

  const SupRolesPermission = permissions['AdminRolesPermission'];

  const fetchRoles = async () => {
    try {
      const token = getToken();
      const response = await axios.get(`${BackendAPI}/superAdmin/getAllrole?page=${currentPage}&pageSize=${pageSize}&search=${searchText}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      console.log(response.data);
      setData(response.data.roles);
      setTotalItems(response.data.totalItems);
      setCatIds(catIds);
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

  const handleManagePermission = (roleId, roleName, roleDes) => {
    const URL = '/onsite/AdminPermission/';
    const token = getToken();
    navigate(`${process.env.PUBLIC_URL}${URL}${layoutURL}`, { state: { roleId, roleName, roleDes } }, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
  };

  const handleDeleteRole = async (roleId) => {
    try {
      setModal(true);
      setSelectedRole(roleId);
      setSelectedReplacementUser('');
      console.log(`Role with ID ${roleId} deleted successfully.`);
    } catch (error) {
      console.error(`Error deleting role with ID ${roleId}:`, error);
    }
  };

  const handleChangeRole = async (selectedReplacementUser) => {
    try {
      const roleId = selectedRole;
      const token = getToken();
      await axios.delete(`${BackendAPI}/superAdmin/deleterole/${roleId}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }, {
        data: { replacementRoleId: selectedReplacementUser }
      });

      console.log(`Role updated successfully for user ID ${selectedReplacementUser} ${roleId}`);
      SweetAlert.fire({
        title: 'Warning!',
        text: 'Role deleted successfully!',
        icon: 'warning',
        timer: 3000,
        showConfirmButton: false,
                allowOutsideClick: false,
                allowEscapeKey: false 
      }).then((result) => {
        if (result.dismiss === SweetAlert.DismissReason.timer) {
          // window.location.href = '/onsite/roles-permission/Consoft';
        }
      });
    } catch (error) {
      console.error('Error updating role:', error);
    }

    fetchRoles();
  };

  const handleReplacementUserChange = (selectedOption) => {
    setSelectedReplacementUser(selectedOption);
  };

  const openStatusModal = (roleId, currentStatus) => {
    setRoleId(roleId);
    setCurrentStatus(currentStatus);
    setStatusModalOpen(true);
  };

  const closeStatusModal = () => {
    setStatusModalOpen(false);
  };

  const handleStatusUpdate = async (csa_role_id, currentStatus) => {
    const newStatus = currentStatus === 0 ? 1 : 0;
    try {
      const token = getToken();
      await axios.put(`${BackendAPI}/superAdmin/updateStatus`, { id: csa_role_id, status: newStatus }, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      const updatedRoles = data.map((role) =>
        role.csa_role_id === csa_role_id ? { ...role, csa_status: newStatus } : role
      );
      setData(updatedRoles);
      closeStatusModal();
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  const handleNavigation = () => {
    navigate(`${process.env.PUBLIC_URL}/onsite/add-role/Consoft`);
  };

//   const handleParentNavigation = () => {
//     navigate(`${process.env.PUBLIC_URL}/App-user/Consoft`);
// };

  return (
    <Fragment>
      <Breadcrumbs mainTitle="Manage Permission" parent="Onsite App" title="Manage Permission" />
      <Container fluid={true}>
        <Row>
          <Col sm="12">
            <Card>
              <CardHeader className="d-flex justify-content-between align-items-center flex-column flex-md-row">
                <div className="mb-2 mb-md-0">
                  <h5 className="mb-2 text-start">Admin Permissions</h5>
                  {/* <Input
                    placeholder="Search Role"
                    onChange={e => handleSearch(e.target.value)}
                    style={{ width: 200 }}
                  /> */}
                </div>
                {/* {SupRolesPermission?.add === 1 && (
                   <button onClick={handleNavigation} className="btn btn-warning">
                   Create Role
                 </button>
                )} */}
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
                          <th scope='col' className='text-start'>{'Role Name'}</th>
                          <th scope='col'>{'Role Description'}</th>
                          <th scope='col'>{'Created Date'}</th>
                          {/* <th scope='col' className='text-center'>{'Status'}</th> */}
                          {SupRolesPermission?.edit === 1 || SupRolesPermission?.delete === 1 ? (
                            <th scope='col' className='text-end'>{'Action'}</th>
                          ) : null}
                        </tr>
                      </thead>
                      <tbody>
                        {data.map((item, index) => (
                          <tr key={index} className="border-bottom-primary">
                            <td className='text-start'>{(currentPage - 1) * pageSize + index + 1}</td>
                            <td className='text-start'>{item.csa_role_name}</td>
                            <td className='text-start'>{item.csa_role_description}</td>
                            <td>{new Date(item.created_at).toLocaleDateString('en-GB')}</td>
                            {/* <td className='text-center'>
                              {item.csa_status === 0 ? (
                                <span style={{ color: 'red', fontSize: '20px', cursor: "pointer" }}
                                  onClick={() => openStatusModal(item.csa_role_id, item.csa_status)}
                                  data-tooltip-id="tooltip"
                                  data-tooltip-content="Inactive status"
                                  data-tooltip-event="click focus">
                                  <GoDotFill />
                                </span>
                              ) : (
                                <span
                                  style={{ color: 'green', fontSize: '20px', cursor: "pointer" }}
                                  onClick={() => openStatusModal(item.csa_role_id, item.csa_status)}
                                  data-tooltip-id="tooltip"
                                  data-tooltip-content="Active status"
                                  data-tooltip-event="click focus">
                                  <GoDotFill />
                                </span>
                              )}
                            </td> */}
                            {SupRolesPermission?.edit === 1 || SupRolesPermission?.delete === 1 ? (
                              <td className='text-end'>
                                <Tooltip id="tooltip" globalEventOff="click" />
                                {SupRolesPermission?.edit === 1 && (
                                  <Button color="primary" size="sm" onClick={() => handleManagePermission(item.csa_role_id, item.csa_role_name, item.csa_role_description)}
                                    data-tooltip-id="tooltip"
                                    data-tooltip-content="Edit Roles & Permissions"
                                    data-tooltip-event="click focus">
                                    <FaEdit />
                                  </Button>
                                )}
                                {/* {SupRolesPermission?.delete === 1 && (
                                  <Button color="danger" size="sm" onClick={() => {
                                    handleDeleteRole(item.csa_role_id);
                                    setModal(true);
                                  }} data-tooltip-id="tooltip"
                                    data-tooltip-content="Delete Roles"
                                    data-tooltip-event="click focus">
                                    <MdDelete />
                                  </Button>
                                )} */}
                              </td>
                            ) : null}
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

      <Modal isOpen={statusModalOpen} toggle={closeStatusModal} centered size="md">
        <ModalHeader toggle={closeStatusModal}>Confirmation</ModalHeader>
        <ModalBody>
          Are you sure you want to change the status?
        </ModalBody>
        <ModalFooter>
          <Button color="primary" onClick={() => handleStatusUpdate(roleId, currentStatus)}>Yes</Button>
          <Button color="secondary" onClick={closeStatusModal}>No</Button>
        </ModalFooter>
      </Modal>

      <Modal isOpen={modal} toggle={() => setModal(!modal)} centered>
        <ModalHeader toggle={() => setModal(!modal)}>Confirm Delete</ModalHeader>
        <ModalBody>
          <p className="mb-0">Choose a replacement role before deleting.</p>
          <div className="mt-3">
            <label htmlFor="replacementUser" className="mr-2">Replacement Role:</label>
            <Select
              id="replacementUser"
              className="react-select"
              value={selectedReplacementUser}
              onChange={handleReplacementUserChange}
              options={data
                .filter((item) => item.csa_role_id !== selectedRole && item.csa_status == 1)
                .map((filteredItem) => ({
                  value: filteredItem.csa_role_id,
                  label: filteredItem.csa_role_name
                }))
              }
            />
          </div>
        </ModalBody>
        <ModalFooter>
          <Button
            color="danger"
            onClick={() => {
              handleChangeRole(selectedReplacementUser);
              setModal(!modal);
            }}
            disabled={!selectedReplacementUser}
          >
            Delete
          </Button>
          <Button color="primary" onClick={() => setModal(!modal)}>Cancel</Button>
        </ModalFooter>
      </Modal>
    </Fragment>
  );
};

export default AdminRolesPermission;

