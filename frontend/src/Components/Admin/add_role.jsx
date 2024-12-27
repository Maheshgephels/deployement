import React, { Fragment, useState, useEffect } from 'react';
import { Container, Row, Col, Button, Card, Label, Media, Input, CardBody, Table, Modal, ModalHeader, ModalBody, ModalFooter, PopoverBody, UncontrolledPopover } from 'reactstrap';
import { useForm } from 'react-final-form';
import axios from 'axios';
import { BackendAPI } from '../../api';
import { Breadcrumbs, Btn, H5 } from '../../AbstractElements';
import { Divider } from 'antd';
import { MdDelete, MdInfoOutline } from "react-icons/md";
import SweetAlert from 'sweetalert2';
import useAuth from '../../Auth/protectedAuth';
import { Link, useNavigate } from 'react-router-dom';
import ReactTooltip from "react-tooltip";
import { getToken } from '../../Auth/Auth';
import { toast } from 'react-toastify';
import debounce from 'lodash.debounce';
import { Form, Field } from 'react-final-form';
import { required, email, Name, Img, PDF, RoleName } from '../Utils/validationUtils';


//Utility function used to combine multiple validation functions into a single validation function
const composeValidators = (...validators) => value =>
    validators.reduce((error, validator) => error || validator(value), undefined);

const AddRole = () => {
    useAuth();
    const [newRoleName, setNewRoleName] = useState('');
    const [newRoleDescription, setNewRoleDescription] = useState('');
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isChecked, setIsChecked] = useState([]); // Initialize isChecked state
    const [modal, setModal] = useState(false); // Initialize modal state
    const navigate = useNavigate(); // Initialize useHistory
    const [name, setName] = useState('');
    const [nameValidationMessage, setNameValidationMessage] = useState('');
    const [nameTouched, setNameTouched] = useState(false);
    const [step, setStep] = useState(1); // Step 1 for role details, Step 2 for permissions



    useEffect(() => {
        fetchpermission();
    }, []);

    //Fetching Facility data 
    const fetchpermission = async () => {
        try {
            const token = getToken();
            const response = await axios.get(`${BackendAPI}/role/getpermission`, {
                headers: {
                    Authorization: `Bearer ${token}` // Include the token in the Authorization header
                }
            });
            setData(response.data);
            console.log(response.data);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching roles:', error);
            setLoading(false);
        }
    };

    const handleNext = (event) => {
        event.preventDefault();
        setStep(2); // Move to the next step
    };

    const handleAddRole = async (values) => {

        if (nameValidationMessage) {
            return; // Prevent form submission if there is a validation error
        }

        const newRoleName = values.rName;
        const newRoleDescription = values.roleDescription;

        try {
            const newData = data.map(page => ({
                cs_facility_id: page.cs_facility_id,
                cs_read_search: page.cs_read_search === 'Yes' ? 'Yes' : 'No',
                cs_validate: page.cs_validate === 'Yes' ? 'Yes' : 'No',
                cs_add: page.cs_add === 'Yes' ? 'Yes' : 'No',
                cs_edit: page.cs_edit === 'Yes' ? 'Yes' : 'No',
                cs_delete: page.cs_delete === 'Yes' ? 'Yes' : 'No',
                cs_print: page.cs_print === 'Yes' ? 'Yes' : 'No',
                cs_count: page.cs_count === 'Yes' ? 'Yes' : 'No'
            }));

            const newRole = {
                role_name: newRoleName,
                role_description: newRoleDescription,
                permissions: newData, // Include the permissions data
                date: new Date().toISOString(), // Include the current timestamp
            };

            console.log(newData);
            const token = getToken();
            await axios.post(`${BackendAPI}/role/addrole`, newRole, {
                headers: {
                    Authorization: `Bearer ${token}` // Include the token in the Authorization header
                }
            });

            console.log('New role added to the database successfully.');
            SweetAlert.fire({
                title: 'Success!',
                text: 'Role created successfully!',
                icon: 'success',
                timer: 3000,
                showConfirmButton: false,
                allowOutsideClick: false,
                allowEscapeKey: false
            }).then((result) => {
                if (result.dismiss === SweetAlert.DismissReason.timer) {
                    navigate(`${process.env.PUBLIC_URL}/onsite/roles-permission/Consoft`);
                }
            });
        } catch (error) {
            console.error('Error adding role:', error);
        }
    };


    const handleCheckboxChange = async (e, index, field, facilityId) => {


        try {
            const isCheckedValue = e.target.checked ? 'Yes' : 'No';
            const newData = data.map((page, pageIndex) => {
                if (pageIndex === index) {
                    return { ...page, [field]: isCheckedValue };
                }
                return page;
            });
            setData(newData); // Update the state with the modified data

            // Log the updated field, data, and facility_id
            console.log(`Field "${field}" updated to "${isCheckedValue}" at index ${index} for facility ID ${facilityId}`);
            console.log('Updated Data:', newData);
        } catch (error) {
            console.error(`Error updating ${field}:`, error);
        }
    };

    const handleCancel = () => {
        setModal(true); // Set modal state to true to activate the modal
    };

    const onSubmit = () => {
        // Your form submission logic here
        // console.log(values);
    };



    const handleNavigation = () => {
        navigate(`${process.env.PUBLIC_URL}/onsite/roles-permission/Consoft`);
    };

    const validatename = debounce(async (value) => {
        try {

            // Call the API to check name availability
            const token = getToken();
            const response = await axios.post(`${BackendAPI}/role/check-role-name`, { rName: value }, {
                headers: {
                    Authorization: `Bearer ${token}` // Include the token in the Authorization header
                }
            });

            console.log('Server response:', response);
            if (!response.data.available) {
                setNameValidationMessage('Role name already exists');
            } else {
                // Only set the validation message if the name is valid
                setNameValidationMessage('');
            }
        } catch (error) {
            console.error('Error checking username availability:', error);
            setNameValidationMessage('Error checking name availability');
        }
    }, 500); // Debounce time: 500ms

    useEffect(() => {
        if (nameTouched) { // Only validate name if it has been touched
            validatename(name);
        }
        return () => {
            validatename.cancel();
        };
    }, [name, nameTouched]);



    const handleKeyDown = (event) => {
        if (event.key === 'Enter') {
            event.preventDefault();
        }
    };





    return (
        <Fragment>
            <Breadcrumbs parentClickHandler={handleNavigation} mainTitle="Create Role" parent="Role & Permission" title="Create Role" />
            <Container fluid={true}>
                <Row>
                    <Col sm="12">
                        <Card>
                            <CardBody>
                                <Form onSubmit={handleAddRole}>
                                    {({ handleSubmit }) => (
                                        <form className='needs-validation' noValidate onSubmit={handleSubmit} onKeyDown={handleKeyDown}>
                                            {step === 1 && (
                                                <>
                                                    <Row>
                                                        <Col md="4 mb-3">
                                                            <Label className='form-label' for="roleName">
                                                                <strong>Role Name <span className="red-asterisk">*</span></strong>
                                                            </Label>
                                                            <Field
                                                                name="rName"
                                                                validate={composeValidators(required, RoleName)}
                                                            >
                                                                {({ input, meta }) => (
                                                                    <>
                                                                        <input
                                                                            {...input}
                                                                            className="form-control"
                                                                            type="text"
                                                                            id="roleName"
                                                                            placeholder="Enter role name"
                                                                            onChange={(e) => {
                                                                                input.onChange(e); // Trigger onChange of the Field component
                                                                                setName(e.target.value); // Update userName state
                                                                                setNameTouched(true);
                                                                            }}
                                                                        />
                                                                        {nameValidationMessage && <div className="text-danger">{nameValidationMessage}</div>}
                                                                        {meta.error && meta.touched && <span className='text-danger'>{meta.error}</span>}
                                                                    </>
                                                                )}
                                                            </Field>
                                                        </Col>

                                                        {/* <Col md="6 mb-3">
                                                            <Label for="roleDescription">
                                                                <strong>Role Description</strong>
                                                            </Label>
                                                            <Field name="roleDescription">
                                                                {({ input }) => (
                                                                    <Input {...input} type="textarea" id="roleDescription" placeholder="Enter role description" />
                                                                )}
                                                            </Field>
                                                        </Col> */}
                                                    </Row>

                                                    <Row>
                                                        <Col md="6 mb-3">
                                                            <Label for="roleDescription"><strong>Role Description</strong></Label>
                                                            <Field
                                                                name="roleDescription"
                                                            >
                                                                {({ input }) => (
                                                                    <Input {...input} type="textarea" id="roleDescription" placeholder="Enter role description" />
                                                                )}
                                                            </Field>
                                                        </Col>
                                                    </Row>
                                                    <Button disabled={!name || nameValidationMessage }  color='primary' onClick={handleNext} className="me-2 mt-3">Next</Button>
                                                    <Button color='warning' onClick={handleCancel} className="mt-3">Cancel</Button>
                                                </>
                                            )}

                                            {step === 2 && (
                                                <>
                                                    {/* Permission Card */}
                                                    <h5>Permissions <MdInfoOutline
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
                                                                Ensure role permissions are set correctly to maintain specific access in the Onsite App for that role.
                                                            </PopoverBody>
                                                        </UncontrolledPopover></h5>
                                                    <Divider />
                                                    <div className="table-responsive">
                                                        <Table>
                                                            <thead>
                                                                <tr className='border-bottom-primary'>
                                                                    <th scope='col'>{'Pages'}</th>
                                                                    <th scope='col'>{'Search'}</th>
                                                                    <th scope='col'>{'Validate'}</th>
                                                                    <th scope='col'>{'Add'}</th>
                                                                    <th scope='col'>{'Edit'}</th>
                                                                    <th scope='col'>{'Print'}</th>
                                                                    <th scope='col'>{'Count'}</th>
                                                                </tr>
                                                            </thead>
                                                            <tbody>
                                                                {data.map((page, index) => (
                                                                    <tr key={index}>
                                                                        <td>{page.cs_display_name}</td>
                                                                        {/* <td>
                                                                <Media body className="text-center icon-state switch">
                                                                    <Label className="switch">
                                                                        <Input type="checkbox"
                                                                            checked={page.cs_read_search === 'Yes'}
                                                                            onChange={(e) => handleCheckboxChange(e, index, 'cs_read_search', page.cs_facility_id)}
                                                                            disabled={page.cs_type === 'food' || page.cs_type === 'gift' || page.cs_type === 'certificate' || page.cs_type === 'workshop'}
                                                                            data-tip="This checkbox is disabled."
                                                                        />
                                                                        <ReactTooltip />
                                                                    </Label>
                                                                </Media>
                                                            </td> */}

                                                                        <td>

                                                                            <Media
                                                                                body
                                                                                className={`text-center icon-state switch ${page.cs_type === 'food' || page.cs_type === 'gift' || page.cs_type === 'certificate' || page.cs_type === 'workshop' ? 'disabled' : ''}`}
                                                                            >
                                                                                <Label className="switch">
                                                                                    <Input
                                                                                        type="switch"
                                                                                        checked={page.cs_read_search === 'Yes'}
                                                                                        onChange={(e) => handleCheckboxChange(e, index, 'cs_read_search', page.cs_facility_id)}
                                                                                        disabled={page.cs_type === 'food' || page.cs_type === 'gift' || page.cs_type === 'certificate' || page.cs_type === 'workshop'}
                                                                                    />
                                                                                    <span className={"switch-state " + (page.cs_read_search === 'Yes' ? "bg-success" : "bg-danger")}></span>
                                                                                </Label>
                                                                                {/* Display text based on the state */}
                                                                                {page.cs_read_search === 'Yes' ? (
                                                                                    <Label className="text-success">Enabled</Label>
                                                                                ) : (
                                                                                    <Label className="text-danger">Disabled</Label>
                                                                                )}
                                                                            </Media>

                                                                        </td>


                                                                        <td>

                                                                            <Media body
                                                                                className={`text-center icon-state switch ${page.cs_type === 'configuration' ? 'disabled' : ''}`}
                                                                            >
                                                                                <Label className="switch">
                                                                                    <Input type="switch"
                                                                                        checked={page.cs_validate === 'Yes'}
                                                                                        onChange={(e) => handleCheckboxChange(e, index, 'cs_validate', page.cs_facility_id)}
                                                                                        disabled={page.cs_type === 'configuration'}
                                                                                    />
                                                                                    <span className={"switch-state " + (page.cs_validate === 'Yes' ? "bg-success" : "bg-danger")}></span>
                                                                                </Label>
                                                                                {/* Display text based on the state */}
                                                                                {page.cs_validate === 'Yes' ? (
                                                                                    <Label className="text-success">Enabled</Label>
                                                                                ) : (
                                                                                    <Label className="text-danger">Disabled</Label>
                                                                                )}
                                                                            </Media>
                                                                        </td>
                                                                        <td>
                                                                            <Media body
                                                                                className={`text-center icon-state switch ${page.cs_type === 'food' || page.cs_type === 'gift' || page.cs_type === 'certificate' || page.cs_type === 'configuration' || page.cs_type === 'workshop' || page.cs_type === 'viewallaccess' ? 'disabled' : ''}`}
                                                                            >
                                                                                <Label className="switch">
                                                                                    <Input type="switch"
                                                                                        checked={page.cs_add === 'Yes'}
                                                                                        onChange={(e) => handleCheckboxChange(e, index, 'cs_add', page.cs_facility_id)}
                                                                                        disabled={page.cs_type === 'food' || page.cs_type === 'gift' || page.cs_type === 'certificate' || page.cs_type === 'configuration' || page.cs_type === 'workshop' || page.cs_type === 'viewallaccess'}
                                                                                    />
                                                                                    <span className={"switch-state " + (page.cs_add === 'Yes' ? "bg-success" : "bg-danger")}></span>
                                                                                </Label>
                                                                                {/* Display text based on the state */}
                                                                                {page.cs_add === 'Yes' ? (
                                                                                    <Label className="text-success">Enabled</Label>
                                                                                ) : (
                                                                                    <Label className="text-danger">Disabled</Label>
                                                                                )}
                                                                            </Media>
                                                                        </td>

                                                                        <td>
                                                                            <Media body
                                                                                className={`text-center icon-state switch ${page.cs_type === 'food' || page.cs_type === 'gift' || page.cs_type === 'certificate' || page.cs_type === 'configuration' || page.cs_type === 'workshop' || page.cs_type === 'viewallaccess' ? 'disabled' : ''}`}
                                                                            >
                                                                                <Label className="switch">
                                                                                    <Input type="switch"
                                                                                        checked={page.cs_edit === 'Yes'}
                                                                                        onChange={(e) => handleCheckboxChange(e, index, 'cs_edit', page.cs_facility_id)}
                                                                                        disabled={page.cs_type === 'food' || page.cs_type === 'gift' || page.cs_type === 'certificate' || page.cs_type === 'configuration' || page.cs_type === 'workshop' || page.cs_type === 'viewallaccess'}
                                                                                    />
                                                                                    <span className={"switch-state " + (page.cs_edit === 'Yes' ? "bg-success" : "bg-danger")}></span>
                                                                                </Label>
                                                                                {/* Display text based on the state */}
                                                                                {page.cs_edit === 'Yes' ? (
                                                                                    <Label className="text-success">Enabled</Label>
                                                                                ) : (
                                                                                    <Label className="text-danger">Disabled</Label>
                                                                                )}
                                                                            </Media>
                                                                        </td>
                                                                        {/* <td>
                                                                    <Media body className="text-center icon-state switch">
                                                                        <Label className="switch">
                                                                            <Input type="checkbox" checked={page.cs_delete === 'Yes'} onChange={(e) => handleCheckboxChange(e, index, 'cs_delete', page.cs_facility_id)} />
                                                                            <span className={"switch-state " + (page.cs_delete === 'Yes' ? "bg-success" : "bg-danger")}></span>
                                                                        </Label>
                                                                        {page.cs_delete === 'Yes' ? (
                                                                            <Label className="text-success">Enabled</Label>
                                                                        ) : (
                                                                            <Label className="text-danger">Disabled</Label>
                                                                        )}
                                                                    </Media>
                                                                </td> */}
                                                                        <td>
                                                                            <Media body
                                                                                className={`text-center icon-state switch ${page.cs_type === 'food' || page.cs_type === 'gift' || page.cs_type === 'configuration' || page.cs_type === 'workshop' || page.cs_type === 'viewallaccess' ? 'disabled' : ''}`}
                                                                            >
                                                                                <Label className="switch">
                                                                                    <Input type="switch"
                                                                                        checked={page.cs_print === 'Yes'}
                                                                                        onChange={(e) => handleCheckboxChange(e, index, 'cs_print', page.cs_facility_id)}
                                                                                        disabled={page.cs_type === 'food' || page.cs_type === 'gift' || page.cs_type === 'configuration' || page.cs_type === 'workshop' || page.cs_type === 'viewallaccess'}
                                                                                    />
                                                                                    <span className={"switch-state " + (page.cs_print === 'Yes' ? "bg-success" : "bg-danger")}></span>
                                                                                </Label>
                                                                                {/* Display text based on the state */}
                                                                                {page.cs_print === 'Yes' ? (
                                                                                    <Label className="text-success">Enabled</Label>
                                                                                ) : (
                                                                                    <Label className="text-danger">Disabled</Label>
                                                                                )}
                                                                            </Media>
                                                                        </td>
                                                                        <td>
                                                                            <Media body
                                                                                className={`text-center icon-state switch ${page.cs_type === 'configuration' || page.cs_type === 'viewallaccess' ? 'disabled' : ''}`}
                                                                            >
                                                                                <Label className="switch">
                                                                                    <Input type="switch"
                                                                                        checked={page.cs_count === 'Yes'}
                                                                                        onChange={(e) => handleCheckboxChange(e, index, 'cs_count', page.cs_facility_id)}
                                                                                        disabled={page.cs_type === 'configuration' || page.cs_type === 'viewallaccess'}
                                                                                    />
                                                                                    <span className={"switch-state " + (page.cs_count === 'Yes' ? "bg-success" : "bg-danger")}></span>
                                                                                </Label>
                                                                                {/* Display text based on the state */}
                                                                                {page.cs_count === 'Yes' ? (
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
                                                    </div>
                                                    <Button color='primary' type='submit' className="me-2 mt-3">Create Role</Button>
                                                    <Button color='warning' onClick={handleCancel} className="mt-3">Cancel</Button>
                                                </>
                                            )}
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
                    <div className='ms-2'>
                        <p>
                            Your changes will be discarded. Are you sure you want to cancel?
                        </p>
                    </div>
                </ModalBody>
                <ModalFooter>
                    <Button
                        onClick={handleNavigation} color='warning'>
                        Yes

                    </Button>
                    {/* <Link to="/onsite/roles-permission/Consoft" className="btn btn-warning">Yes</Link> */}
                    <Button color="primary" onClick={() => setModal(!modal)}>No</Button>
                </ModalFooter>
            </Modal>
        </Fragment>
    );
};

export default AddRole;
