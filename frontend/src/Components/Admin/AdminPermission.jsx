import React, { Fragment, useState, useEffect, useContext } from 'react';
import { Container, Row, Col, Label, Input, Button, Card, CardBody, Table, Media, Modal, ModalHeader, ModalBody, ModalFooter, Nav, NavItem, NavLink, TabContent, TabPane } from 'reactstrap';
import classnames from 'classnames';
import axios from 'axios';
import { BackendAPI } from '../../api';
import { Breadcrumbs, Btn, H5 } from '../../AbstractElements';
import { Divider } from 'antd';
import { useNavigate, useLocation } from 'react-router-dom';
import SweetAlert from 'sweetalert2';
import { getToken } from '../../Auth/Auth';
import useAuth from '../../Auth/protectedAuth';
import { PermissionsContext } from '../../contexts/PermissionsContext';
import { Form, Field } from 'react-final-form'; // Ensure this import is used
import { required, Name } from '../Utils/validationUtils'; // Adjust imports based on actual usage

const composeValidators = (...validators) => value =>
    validators.reduce((error, validator) => error || validator(value), undefined);

const AdminPermission = () => {
    useAuth();
    const [data, setData] = useState([]);
    const [productData, setproductData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modal, setModal] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();
    const { permissions } = useContext(PermissionsContext);
    const { roleId, roleName, roleDes } = location.state;
    const [activeTab, setActiveTab] = useState('1'); // Ensure activeTab is a string to match Tab IDs

    useEffect(() => {
        fetchPages();
        fetchProducts();
    }, [permissions]);

    const fetchPages = async () => {
        try {
            const token = getToken();
            const response = await axios.post(`${BackendAPI}/superAdmin/getpages`, { roleId }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            const pagesData = response.data.reduce((acc, page) => {
                if (!acc[page.product_id]) {
                    acc[page.product_id] = [];
                }
                acc[page.product_id].push(page);
                return acc;
            }, {});

            setData(pagesData);
            console.log('Fetched Pages:', pagesData);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching pages:', error);
            setLoading(false);
        }
    };

    const fetchProducts = async () => {
        try {
            const token = getToken();
            const response = await axios.get(`${BackendAPI}/superAdmin/getproduct`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            const products = response.data;
            setproductData(products);
            console.log(products);

            if (products.length > 0) {
                setActiveTab(`${products[0].product_id}`); // Use product_id as string
            }

            setLoading(false);
        } catch (error) {
            console.error('Error fetching products:', error);
            setLoading(false);
        }
    };

    const toggleTab = (tab) => {
        if (activeTab !== tab) setActiveTab(tab);
    };

    const handleCheckboxChange = async (e, index, field, facilityId) => {
        try {
            const newData = { ...data };
            const product_id = Number(activeTab); // Ensure product_id is correctly calculated

            if (!newData[product_id]) return;

            newData[product_id][index][field] = e.target.checked ? 1 : 0;

            console.log('Updating Checkbox:', { newData, field, facilityId });

            const token = getToken();
            const res = await axios.post(`${BackendAPI}/superAdmin/updatepermission`, {
                RoleId: roleId,
                Component: field,
                value: newData[product_id][index][field],
                ComponentId: facilityId
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            setData(newData);
            console.log('API Response:', res.data.message);
        } catch (error) {
            console.error(`Error updating ${field}:`, error);
        }
    };

    const handleCancel = () => setModal(true);

    const onSubmit = async (formData) => {
        try {
            const { rName, rDes } = formData;
            const updatedData = { roleName: rName, roleDes: rDes, roleId };
            console.log(updatedData);
            const token = getToken();
            const response = await axios.post(`${BackendAPI}/superAdmin/updateRole`, updatedData, {
                headers: { Authorization: `Bearer ${token}` }
            });
            SweetAlert.fire({
                title: 'Success!',
                text: 'Changes updated successfully!',
                icon: 'success',
                timer: 3000,
                showConfirmButton: false
            }).then((result) => {
                if (result.dismiss === SweetAlert.DismissReason.timer) {
                    navigate(`${process.env.PUBLIC_URL}/onsite/admin-role-permission/Consoft`);
                }
            });
            console.log('Role updated successfully:', response.data);
        } catch (error) {
            console.error('Error updating role:', error);
        }
    };

        // Extract AdminSettingPermissions component
        const SupAdminPermissions = permissions['Super Admin Permission'];

    const handleNavigation = () => navigate(`${process.env.PUBLIC_URL}/onsite/admin-role-permission/Consoft`);

    return (
        <Fragment>
            <Breadcrumbs parentClickHandler={handleNavigation} mainTitle="Edit Role & Permission" parent="Admin Permission" title="Edit Role & Permission" />
            <Container fluid>
                <Row>
                    <Col sm="12">
                        <Card>
                            <CardBody>
                                <Form onSubmit={onSubmit}>
                                    {({ handleSubmit }) => (
                                        <form className='needs-validation' noValidate='' onSubmit={handleSubmit}>
                                            <Row>
                                                <Col md="4 mb-3">
                                                    <Label className='form-label' for="roleName"><strong>Role Name <span className="red-asterisk">*</span></strong></Label>
                                                    <Field
                                                        name="rName"
                                                        validate={composeValidators(required, Name)}
                                                        initialValue={roleName}
                                                    >
                                                        {({ input, meta }) => (
                                                            <>
                                                                <input
                                                                    {...input}
                                                                    className="form-control"
                                                                    type="text"
                                                                    id="roleName"
                                                                    placeholder="Enter role name"
                                                                />
                                                                {meta.error && meta.touched && <span className='text-danger'>{meta.error}</span>}
                                                            </>
                                                        )}
                                                    </Field>
                                                </Col>
                                            </Row>
                                            <Row>
                                                <Col md="6 mb-3">
                                                    <Label for="roleDescription"><strong>Role Description</strong></Label>
                                                    <Field
                                                        name="rDes"
                                                        initialValue={roleDes}
                                                    >
                                                        {({ input }) => (
                                                            <Input {...input} type="textarea" id="roleDescription" placeholder="Enter role description" />
                                                        )}
                                                    </Field>
                                                </Col>
                                            </Row>

                                            <Fragment>
                                                <h5>Permissions</h5>
                                                <Divider></Divider>
                                                <Nav tabs>
                                                    {productData.map((product, index) => (
                                                        <NavItem key={product.product_id}>
                                                            <NavLink
                                                                className={classnames({ active: activeTab === `${product.product_id}` })}
                                                                onClick={() => toggleTab(`${product.product_id}`)}
                                                            >
                                                                {product.product_name}
                                                            </NavLink>
                                                        </NavItem>
                                                    ))}
                                                </Nav>
                                                <TabContent activeTab={activeTab}>
                                                    {productData.map((product) => (
                                                        <TabPane tabId={`${product.product_id}`} key={product.product_id}>
                                                            <div className='table-responsive'>
                                                                {loading ? (
                                                                    <p>Loading...</p>
                                                                ) : (
                                                                    <Table>
                                                                        <thead>
                                                                            <tr className='border-bottom-primary'>
                                                                                <th scope='col'>{'Pages'}</th>
                                                                                <th scope='col'>{'View'}</th>
                                                                                <th scope='col'>{'Validate'}</th>
                                                                                <th scope='col'>{'Add'}</th>
                                                                                <th scope='col'>{'Edit'}</th>
                                                                                <th scope='col'>{'Print'}</th>
                                                                                <th scope='col'>{'Delete'}</th>
                                                                            </tr>
                                                                        </thead>
                                                                        <tbody>
                                                                            {data[product.product_id]?.map((page, index) => (
                                                                                <tr key={index}>
                                                                                    <td>{page.cs_component_name}</td>
                                                                                    <td>
                                                                                        <Media body className="text-center icon-state switch">
                                                                                            <Label className="switch">
                                                                                                <Input type="checkbox" checked={page.view === 1}
                                                                                                    onChange={(e) => handleCheckboxChange(e, index, 'view', page.cs_component_id)}
                                                                                                />
                                                                                                <span className={"switch-state " + (page.view === 1 ? "bg-success" : "bg-danger")}></span>
                                                                                            </Label>
                                                                                            {page.view === 1 ? (
                                                                                                <Label className="text-success">Enabled</Label>
                                                                                            ) : (
                                                                                                <Label className="text-danger">Disabled</Label>
                                                                                            )}
                                                                                        </Media>
                                                                                    </td>
                                                                                    <td>
                                                                                        <Media body className="text-center icon-state switch">
                                                                                            <Label className="switch">
                                                                                                <Input type="checkbox"
                                                                                                    checked={page.validate === 1}
                                                                                                    onChange={(e) => handleCheckboxChange(e, index, 'validate', page.cs_component_id)}
                                                                                                />
                                                                                                <span className={"switch-state " + (page.validate === 1 ? "bg-success" : "bg-danger")}></span>
                                                                                            </Label>
                                                                                            {page.validate === 1 ? (
                                                                                                <Label className="text-success">Enabled</Label>
                                                                                            ) : (
                                                                                                <Label className="text-danger">Disabled</Label>
                                                                                            )}
                                                                                        </Media>
                                                                                    </td>
                                                                                    <td>
                                                                                        <Media body className="text-center icon-state switch">
                                                                                            <Label className="switch">
                                                                                                <Input type="checkbox"
                                                                                                    checked={page.add === 1}
                                                                                                    onChange={(e) => handleCheckboxChange(e, index, 'add', page.cs_component_id)}
                                                                                                />
                                                                                                <span className={"switch-state " + (page.add === 1 ? "bg-success" : "bg-danger")}></span>
                                                                                            </Label>
                                                                                            {page.add === 1 ? (
                                                                                                <Label className="text-success">Enabled</Label>
                                                                                            ) : (
                                                                                                <Label className="text-danger">Disabled</Label>
                                                                                            )}
                                                                                        </Media>
                                                                                    </td>
                                                                                    <td>
                                                                                        <Media body className="text-center icon-state switch">
                                                                                            <Label className="switch">
                                                                                                <Input type="checkbox"
                                                                                                    checked={page.edit === 1}
                                                                                                    onChange={(e) => handleCheckboxChange(e, index, 'edit', page.cs_component_id)}
                                                                                                />
                                                                                                <span className={"switch-state " + (page.edit === 1 ? "bg-success" : "bg-danger")}></span>
                                                                                            </Label>
                                                                                            {page.edit === 1 ? (
                                                                                                <Label className="text-success">Enabled</Label>
                                                                                            ) : (
                                                                                                <Label className="text-danger">Disabled</Label>
                                                                                            )}
                                                                                        </Media>
                                                                                    </td>
                                                                                    <td>
                                                                                        <Media body className="text-center icon-state switch">
                                                                                            <Label className="switch">
                                                                                                <Input type="checkbox"
                                                                                                    checked={page.print === 1}
                                                                                                    onChange={(e) => handleCheckboxChange(e, index, 'print', page.cs_component_id)}
                                                                                                />
                                                                                                <span className={"switch-state " + (page.print === 1 ? "bg-success" : "bg-danger")}></span>
                                                                                            </Label>
                                                                                            {page.print === 1 ? (
                                                                                                <Label className="text-success">Enabled</Label>
                                                                                            ) : (
                                                                                                <Label className="text-danger">Disabled</Label>
                                                                                            )}
                                                                                        </Media>
                                                                                    </td>
                                                                                    <td>
                                                                                        <Media body className="text-center icon-state switch">
                                                                                            <Label className="switch">
                                                                                                <Input type="checkbox"
                                                                                                    checked={page.delete === 1}
                                                                                                    onChange={(e) => handleCheckboxChange(e, index, 'delete', page.cs_component_id)}
                                                                                                />
                                                                                                <span className={"switch-state " + (page.delete === 1 ? "bg-success" : "bg-danger")}></span>
                                                                                            </Label>
                                                                                            {page.delete === 1 ? (
                                                                                                <Label className="text-success">Enabled</Label>
                                                                                            ) : (
                                                                                                <Label className="text-danger">Disabled</Label>
                                                                                            )}
                                                                                        </Media>
                                                                                    </td>
                                                                                </tr>
                                                                            ))}
                                                                        </tbody>
                                                                    </Table>
                                                                )}
                                                            </div>
                                                        </TabPane>
                                                    ))}
                                                </TabContent>
                                            </Fragment>
                                            <Button color='primary' type='submit' className="me-2 mt-3">Edit Role</Button>
                                            <Button color='warning' onClick={handleCancel} className="mt-3">Cancel</Button>
                                        </form>
                                    )}
                                </Form>
                            </CardBody>
                        </Card>
                    </Col>
                </Row>
            </Container>
            {/* Modal */}
            <Modal isOpen={modal} toggle={() => setModal(!modal)} centered>
                <ModalHeader toggle={() => setModal(!modal)}>Confirmation</ModalHeader>
                <ModalBody>
                    <div>
                        <p>Your changes will be discarded. Are you sure you want to cancel?</p>
                    </div>
                </ModalBody>
                <ModalFooter>
                    <Button onClick={handleNavigation} color='warning'>Yes</Button>
                    <Button color="primary" onClick={() => setModal(!modal)}>No</Button>
                </ModalFooter>
            </Modal>
        </Fragment>
    );
};

export default AdminPermission;
