import React, { Fragment, useEffect, useState, useContext } from 'react';
import { Container, Row, Col, Card, Table, CardHeader, CardBody, Input, Button, Modal, ModalHeader, ModalFooter, ModalBody, PopoverBody, UncontrolledPopover, InputGroup, InputGroupText } from 'reactstrap';
import { Breadcrumbs } from '../../AbstractElements';
import axios from 'axios';
import { BackendAPI } from '../../api';
import SweetAlert from 'sweetalert2';
import { Link, useNavigate } from 'react-router-dom';
import { GoDotFill } from "react-icons/go";
import { FaEdit, FaAngleUp, FaAngleDown, FaCode, FaSortUp, FaSortDown } from 'react-icons/fa';
import { FaPlus } from "react-icons/fa6";
import { FiSearch } from "react-icons/fi";
import { BsThreeDotsVertical, BsThreeDots } from "react-icons/bs";
import { BiSort, BiSortAlt2 } from "react-icons/bi";
import { MdDelete, MdInfoOutline } from "react-icons/md";
import { Pagination } from 'antd';
import CustomizerContext from '../../_helper/Customizer';
import { classes } from '../../Data/Layouts';
import { Tooltip } from 'react-tooltip';
import { PermissionsContext } from '../../contexts/PermissionsContext';
import { getToken } from '../../Auth/Auth';
import Select from 'react-select';
import { Button as B, Dropdown as D, Menu } from 'antd';
import useAuth from '../../Auth/protectedAuth';

const Permission = () => {
  useAuth();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [searchText, setSearchText] = useState('');
  const [sortColumn, setSortColumn] = useState(''); // Column to sort by
  const [sortOrder, setSortOrder] = useState('asc'); // Sort order (asc/desc)
  const [catIds, setCatIds] = useState([]);
  const { layoutURL } = useContext(CustomizerContext);
  const [modal, setModal] = useState(false);
  const navigate = useNavigate();
  const [selectedRole, setSelectedRole] = useState(null);
  const [selectedReplacementUser, setSelectedReplacementUser] = useState('');
  const { permissions } = useContext(PermissionsContext);
  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [roleId, setRoleId] = useState(null);
  const [roleName, setRolename] = useState(null);
  const [currentStatus, setCurrentStatus] = useState(null);
  const [roleData, setRoleData] = useState([]);
  const [loginData, setLoginData] = useState([]);



  console.log("Login Name:", loginData);

  useEffect(() => {
    fetchRoles();
    fetchCat();
  }, [currentPage, pageSize, searchText, permissions]);

  const RolesPermissionPermissions = permissions['AppRolesPermission'];

  const fetchRoles = async () => {
    try {
      const token = getToken();
      // const response = await axios.get(`${BackendAPI}/role/getAllrole?page=${currentPage}&pageSize=${pageSize}&search=${searchText}`, {
      //   headers: {
      //     Authorization: `Bearer ${token}`
      //   }
      // });
      const response = await axios.get(`${BackendAPI}/role/getAllrole`, {
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
      console.log(response.data);
      const roles = response.data.roles;
      setData(roles);
      setTotalItems(response.data.totalItems);

      // // Extract cs_role_name and cs_role_id and set it in state
      // const roleData = roles.map(role => ({
      //   cs_role_name: role.cs_role_name,
      //   cs_role_id: role.cs_role_id
      // }));
      // setRoleData(roleData);

      setLoading(false);
    } catch (error) {
      console.error('Error fetching data:', error);
      setLoading(false);
    }
  };


  const fetchCat = async () => {
    try {
      const token = getToken();
      const response = await axios.get(`${BackendAPI}/role/getRole`, {
        headers: {
          Authorization: `Bearer ${token}` // Include the token in the Authorization header
        }
      });

      console.log("Check:", response.data);

      const roleData = response.data.role.map(item => ({
        cs_role_id: item.cs_role_id,
        cs_role_name: item.cs_role_name
      }));
      setRoleData(roleData);

      const loginData = response.data.login.map(item => ({
        login: item.cs_role_id,
      }));
      setLoginData(loginData);
    } catch (error) {
      console.error('Error fetching types:', error);
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

  const handleSort = (column) => {
    const order = sortColumn === column && sortOrder === 'asc' ? 'desc' : 'asc';
    setSortColumn(column);
    setSortOrder(order);
    fetchRoles(); // Fetch the data again with the updated sorting
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

  const getSettings = (item) => [
    // Conditionally render the edit option if WorkshopsPermissions?.edit === 1
    ...(RolesPermissionPermissions?.edit === 1
      ? [{
        key: '1',
        label: (
          <div onClick={() => handleManagePermission(item.cs_role_id, item.cs_role_name, item.role_description)}>
            <FaEdit /> Edit Role & Permission
          </div>
        ),
      }]
      : []
    ),


    // Conditionally render the delete option if WorkshopsPermissions?.delete === 1
    ...(RolesPermissionPermissions?.delete === 1
      ? [{
        key: '2', // Ensure unique key for each option
        label: (
          <div onClick={() => {
            handleDeleteRole(item.cs_role_id);
            setModal(true);
          }}>
            <MdDelete /> Delete Role
          </div>
        )
      }]
      : []
    ),
    // Add more options if needed
  ];

  const handleManagePermission = (roleId, roleName, roleDes) => {
    const URL = '/onsite/manage-permission/';
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
      const newRoleid = selectedReplacementUser.value;

      const token = getToken();
      await axios.put(`${BackendAPI}/role/deleterole`, { Id: roleId, newRoleid: newRoleid }, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }

      );

      console.log(`Role updated successfully for user ID ${selectedReplacementUser} ${roleId}`);
      SweetAlert.fire({
        title: 'Success!',
        text: 'Role deleted successfully!',
        icon: 'success',
        timer: 3000,
        showConfirmButton: false,
        allowOutsideClick: false,
        allowEscapeKey: false
      }).then((result) => {
        if (result.dismiss === SweetAlert.DismissReason.timer) {
          // window.location.href = '/roles-permission/Consoft';
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

  const openStatusModal = (roleId, currentStatus, roleName) => {
    const isRoleUsedInLogin = loginData.some(login => login.login === roleId);

    console.log("Alert:", isRoleUsedInLogin);

    if (isRoleUsedInLogin) {
      setStatusModalOpen(false);

      // Display a warning SweetAlert if the role is in use and cannot be inactivated
      SweetAlert.fire({
        title: 'Warning!',
        html: `The role <strong>${roleName}</strong> cannot be inactivated because it is currently assigned to app login users.`,
        icon: 'warning',
        timer: 3000,
        showConfirmButton: false,
        allowOutsideClick: false,
        allowEscapeKey: false
      });
      return;
    }
    setRoleId(roleId);
    setCurrentStatus(currentStatus);
    setRolename(roleName);
    setStatusModalOpen(true);
  };

  const closeStatusModal = () => {
    setStatusModalOpen(false);
  };

  // const handleStatusUpdate = async (cs_role_id, currentStatus) => {
  //   const newStatus = currentStatus === 0 ? 1 : 0;
  //   try {
  //     const token = getToken();
  //     await axios.put(`${BackendAPI}/role/updateStatus`, { id: cs_role_id, status: newStatus }, {
  //       headers: {
  //         Authorization: `Bearer ${token}`
  //       }
  //     });
  //     const updatedRoles = data.map((role) =>
  //       role.cs_role_id === cs_role_id ? { ...role, cs_status: newStatus } : role
  //     );
  //     setData(updatedRoles);
  //     closeStatusModal();
  //   } catch (error) {
  //     console.error('Error updating status:', error);
  //   }
  // };

  const handleStatusUpdate = async (cs_role_id, currentStatus) => {
    // Check if the role_id is present in loginData

    const newStatus = currentStatus === 0 ? 1 : 0;
    try {
      const token = getToken();
      await axios.put(`${BackendAPI}/role/updateStatus`, { id: cs_role_id, status: newStatus }, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      const updatedRoles = data.map((role) =>
        role.cs_role_id === cs_role_id ? { ...role, cs_status: newStatus } : role
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


  return (
    <Fragment>
      <Breadcrumbs mainTitle={
        <>
          Manage Role
          <MdInfoOutline
            id="rolePopover"
            style={{
              cursor: 'pointer', position: 'absolute', marginLeft: '5px'
            }}
          />
          <UncontrolledPopover
            placement="bottom"
            target="rolePopover"
            trigger="focus"
          >
            <PopoverBody>
              Create and manage roles for the Onsite App, with permissions allocated based on each app user's role.
            </PopoverBody>
          </UncontrolledPopover>
        </>
      } parent="Onsite App" title="Manage Role" />
      <Container fluid={true}>
        <Row>
          <Col sm="12">
            <Card>
              <CardHeader>
                <div className='d-flex align-items-center w-100'>
                  <div className="mb-2 mb-md-0 w-100">
                    {/* <h5 className="mb-2 text-start">Payment</h5> */}
                    <InputGroup style={{ width: '100%', maxWidth: '200px', borderRadius: '20px' }}>
                      <InputGroupText>
                        <FiSearch />
                      </InputGroupText>
                      <Input
                        placeholder="Search Role"
                        onChange={e => handleSearch(e.target.value)}
                      // style={{ borderRadius: '20px' }}
                      />
                    </InputGroup>
                  </div>
                  <div className="text-md-end w-100 mt-2 mt-md-0 text-end">
                    {RolesPermissionPermissions?.add === 1 && (
                      // <Button onClick={handleNavigation} color='warning'>
                      //   Create Role
                      // </Button>
                      <>
                        <Button
                          color=""
                          className='circular'
                          onClick={handleNavigation} data-tooltip-id="create"
                        >
                          <FaPlus
                            className='buttonStyle'
                          />

                        </Button>
                        <Tooltip id="create" place="top" effect="solid">
                          Create Role
                        </Tooltip>
                      </>
                    )}
                  </div>
                </div>
              </CardHeader>




              <CardBody>
                <div className='table-responsive'>
                  {loading ? (
                    <p>Loading...</p>
                  ) : data.length === 0 ? (
                    <p className='text-center'>No role found</p>
                  ) : (
                    <Table>
                      <thead>
                        <tr className='border-bottom-primary'>
                          <th scope='col' className='text-start'>{'Sr No.'}</th>
                          <th scope='col' className='text-start' onClick={() => handleSort('cs_role_name')}>
                            {'Role Name'}
                            {getSortIndicator('cs_role_name')}
                          </th>
                          {/* <th scope='col' className='text-start'>{'Role Name'}</th> */}
                          <th scope='col'>{'Role Description'}</th>
                          <th scope='col' className='text-start' onClick={() => handleSort('created_at')}>
                            {'Created Date'}
                            {getSortIndicator('created_at')}
                          </th>
                          {/* <th scope='col'>{'Created Date'}</th> */}
                          <th scope='col' className='text-center' onClick={() => handleSort('cs_status')}>
                            {'Status'}
                            {getSortIndicator('cs_status')}
                          </th>
                          {/* <th scope='col' className='text-center'>{'Status'}</th> */}
                          {RolesPermissionPermissions?.edit === 1 || RolesPermissionPermissions?.delete === 1 ? (
                            <th scope='col' className='text-end'>{'Action'}</th>
                          ) : null}
                        </tr>
                      </thead>
                      <tbody>
                        {data.map((item, index) => (
                          <tr key={index} className="border-bottom-primary">
                            <td className='text-start'>{(currentPage - 1) * pageSize + index + 1}</td>
                            <td className='text-start'>{item.cs_role_name}</td>
                            <td className='text-start'>{item.role_description}</td>
                            <td>{new Date(item.created_at).toLocaleDateString('en-GB')}</td>
                            <td className='text-center'>
                              {item.cs_status === 0 ? (
                                <span style={{ color: 'red', fontSize: '20px', cursor: "pointer" }}
                                  onClick={() => openStatusModal(item.cs_role_id, item.cs_status, item.cs_role_name)}
                                  data-tooltip-id="tooltip"
                                  data-tooltip-content="Inactive status"
                                  data-tooltip-event="click focus">
                                  <GoDotFill />
                                </span>
                              ) : (
                                <span
                                  style={{ color: 'green', fontSize: '20px', cursor: "pointer" }}
                                  onClick={() => openStatusModal(item.cs_role_id, item.cs_status, item.cs_role_name)}
                                  data-tooltip-id="tooltip"
                                  data-tooltip-content="Active status"
                                  data-tooltip-event="click focus">
                                  <GoDotFill />
                                </span>
                              )}
                            </td>
                            {RolesPermissionPermissions?.edit === 1 || RolesPermissionPermissions?.delete === 1 ? (
                              <td className='text-end'>
                                <Tooltip id="tooltip" globalEventOff="click" />
                                {/* {RolesPermissionPermissions?.edit === 1 && (
                                  <Button color="primary" size="sm" onClick={() => handleManagePermission(item.cs_role_id, item.cs_role_name, item.role_description)}
                                    data-tooltip-id="tooltip"
                                    data-tooltip-content="Edit Role & Permission"
                                    data-tooltip-event="click focus">
                                    <FaEdit />
                                  </Button>
                                )}
                                {RolesPermissionPermissions?.delete === 1 && (
                                  <Button color="danger" size="sm" onClick={() => {
                                    handleDeleteRole(item.cs_role_id);
                                    setModal(true);
                                  }} data-tooltip-id="tooltip"
                                    data-tooltip-content="Delete Role"
                                    data-tooltip-event="click focus">
                                    <MdDelete />
                                  </Button>
                                )} */}

                                <D
                                  menu={{ items: getSettings(item) }} // Pass user to getSettings
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

      <Modal isOpen={statusModalOpen} toggle={closeStatusModal} centered size="md">
        <ModalHeader toggle={closeStatusModal}>Confirmation</ModalHeader>
        <ModalBody>
          <div className='ms-2'>
            <p>Are you sure you want to change the status of {roleName} to {currentStatus === 0 ? "Active" : "Inactive"}?</p>
          </div>
        </ModalBody>

        <ModalFooter>
          <Button color="primary" onClick={() => handleStatusUpdate(roleId, currentStatus, roleName)}>Yes</Button>
          <Button color="warning" onClick={closeStatusModal}>No</Button>
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
              classNamePrefix="react-select"
              value={roleData.find(option => option.value === selectedRole)}
              onChange={handleReplacementUserChange}
              options={roleData
                .filter(option => option.cs_role_id !== selectedRole)
                .map(pref => ({ value: pref.cs_role_id, label: pref.cs_role_name }))}

              placeholder="Select replacement Category"
              isSearchable={true}
            // options={data
            //   .filter((item) => item.cs_role_id !== selectedRole && item.cs_status == 1)
            //   .map((filteredItem) => ({
            //     value: filteredItem.cs_role_id,
            //     label: filteredItem.cs_role_name
            //   }))
            // }
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

export default Permission;

