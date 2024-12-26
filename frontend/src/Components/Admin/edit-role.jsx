import React, { Fragment, useState, useEffect } from 'react';
import { Container, Row, Col, Label, Input, Button, Card, CardBody, Media, Table, Modal, ModalHeader, ModalBody, ModalFooter, FormFeedback, CardHeader, PopoverBody, UncontrolledPopover } from 'reactstrap';
import { useForm } from 'react-hook-form';
import axios from 'axios';
import { BackendAPI } from '../../api';
import { Breadcrumbs, Btn, H5 } from '../../AbstractElements';
import { MdDelete, MdInfoOutline } from "react-icons/md";
import { Divider } from 'antd';
import { Link, useNavigate, useLocation } from 'react-router-dom'; // Import useHistory for programmatic navigation
import SweetAlert from 'sweetalert2';
import { getToken } from '../../Auth/Auth';
import useAuth from '../../Auth/protectedAuth';
import { Form, Field } from 'react-final-form';
import { required, email, Name, Img, PDF } from '../Utils/validationUtils';
import debounce from 'lodash.debounce';



//Utility function used to combine multiple validation functions into a single validation function
const composeValidators = (...validators) => value =>
    validators.reduce((error, validator) => error || validator(value), undefined);

const SubTableComponent = () => {
    useAuth();
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isChecked, setIsChecked] = useState([]); // Initialize isChecked state
    const [modal, setModal] = useState(false); // Initialize modal state
    const navigate = useNavigate(); // Initialize useHistory
    const { register, handleSubmit, formState: { errors } } = useForm();
    const location = useLocation();
    const { roleId, roleName, roleDes } = location.state;
    const [name, setName] = useState('');
    const [nameValidationMessage, setNameValidationMessage] = useState('');
    const [nameTouched, setNameTouched] = useState(false);


    useEffect(() => {
        fetchPages();
    }, []);

    const fetchPages = async () => {
        try {
            const token = getToken();
            const response = await axios.post(`${BackendAPI}/role/getpages`, { roleId }, {
                headers: {
                    Authorization: `Bearer ${token}` // Include the token in the Authorization header
                }
            });
            setData(response.data);
            console.log(response.data);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching pages:', error);
            setLoading(false);
        }
    };

    const handleCheckboxChange = async (e, index, field, facilityId) => {

        try {
            const newData = [...data];
            // Update the corresponding field based on the provided column
            newData[index][field] = e.target.checked ? 'Yes' : 'No';
            setData(newData);

            // console.log("facilityId" + facilityId);

            // console.log(roleId, newData[index].field, newData[index][field]);
            const token = getToken();
            const res = await axios.post(`${BackendAPI}/role/updatepermission`, {
                userId: roleId,
                // pageId: newData[index].pageId,
                field: field, // Pass the field name directly
                value: newData[index][field], // Updated value of the specified field
                facilityId: facilityId // Include the facilityId in the request
            }, {
                headers: {
                    Authorization: `Bearer ${token}` // Include the token in the Authorization header
                }
            });

            console.log('API Response:', res.data.message);



        } catch (error) {
            console.error(`Error updating ${field}:`, error);
        }
    };

    const handleCancel = () => {
        setModal(true); // Set modal state to true to activate the modal
    };

    // const onSubmit = (data) => {
    //     if (data !== '') {
    //         alert('You submitted the form and stuff!');
    //     } else {
    //         errors.showMessages();
    //     }
    // };

    const onSubmit = async (formData) => {
        if (nameValidationMessage) {
            return; // Prevent form submission if there is a validation error
        }
        try {
            const { rName, rDes } = formData; // Destructure role name and description from formData
            const updatedData = { roleName: rName, roleDes: rDes, roleId }; // Include roleName, roleDescription, and roleId in the updatedData
            console.log(updatedData);
            const token = getToken();
            const response = await axios.post(`${BackendAPI}/role/updateRole`, updatedData, {
                headers: {
                    Authorization: `Bearer ${token}` // Include the token in the Authorization header
                }
            });
            SweetAlert.fire({
                title: 'Success!',
                text: 'Changes updated successfully!',
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
            console.log('Role updated successfully:', response.data);
        } catch (error) {
            console.error('Error updating role:', error);
            // Optionally, you can show an error message or perform any other error handling
        }
    };


    const validatename = debounce(async (value) => {
        try {

            if (value === roleName) {
                // Skip validation if the name is the same as the current name
                setNameValidationMessage('');
                return;
            }

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


    const handleNavigation = () => {
        navigate(`${process.env.PUBLIC_URL}/onsite/roles-permission/Consoft`);
    };



    return (
        <Fragment>
            <Breadcrumbs parentClickHandler={handleNavigation} mainTitle="Edit Role & Permission" parent="Role & Permission" title="Edit Role & Permission" />
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
                                                                    type="text" id="roleName"
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

                                            <Button color='primary' type='submit' className="me-2 mt-3">Edit details</Button>
                                            <Button color='warning' onClick={handleCancel} className="mt-3">Cancel</Button>
                                        </form>
                                    )}
                                </Form>

                            </CardBody>
                        </Card>





                        {/* <Form className='needs-validation' noValidate='' onSubmit={handleSubmit(onSubmit)}>
                                <Col md="4 mb-3">
                                        <Label className='form-label' for="roleName"><strong>Role Name</strong></Label>
                                        <input className="form-control" type="text" id="roleName" placeholder="Enter role name" name='rName' defaultValue={roleName} {...register('rName', { required: true, pattern: /^(?!\s*$).+/ })} />
                                        <FormFeedback className='d-block text-danger'>{errors.rName?.type === "required" && 'Role name is required'}</FormFeedback>
                                        <FormFeedback className='d-block text-danger'>{errors.rName?.type === "pattern" && 'Role name cannot be empty or contain only spaces'}</FormFeedback>
                                        <div className='valid-feedback'>Looks good!</div>
                                    </Col>
                                    <Col md="6 mb-3">
                                        <Label for="roleDescription"><strong>Role Description</strong></Label>
                                        <input className="form-control" type="textarea" id="roleDescription" placeholder="Enter role description" name='rDes' defaultValue={roleDes}  {...register('rDes')} />
                                    </Col> */}



                        <Fragment>

                            <Card>
                                <CardHeader>

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
                                    <br />
                                    <small>Note: On toggle permission get update no need to click on edit button</small>

                                </CardHeader>
                                <CardBody>
                                    {/* <h5>Permissions</h5>
                                    <small>Note: On toggle permission get update</small>
                                    <Divider></Divider> */}
                                    <div className='table-responsive'>
                                        {loading ? (
                                            <p>Loading...</p>
                                        ) : (
                                            <Table>
                                                <thead>
                                                    <tr className='border-bottom-primary'>
                                                        <th scope='col'>{'Pages'}</th>
                                                        <th scope='col'>{'Search'}</th>
                                                        <th scope='col'>{'Validate'}</th>
                                                        <th scope='col'>{'Add'}</th>
                                                        <th scope='col'>{'Edit'}</th>
                                                        {/* <th scope='col'>{'Delete'}</th> */}
                                                        <th scope='col'>{'Print'}</th>
                                                        <th scope='col'>{'Count'}</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {data.map((page, index) => (
                                                        <tr key={index}>
                                                            <td>{page.cs_display_name}</td>
                                                            <td>

                                                                <Media
                                                                    body
                                                                    className={`text-center icon-state switch ${page.cs_type === 'food' || page.cs_type === 'gift' || page.cs_type === 'certificate' || page.cs_type === 'workshop' ? 'disabled' : ''}`}
                                                                >
                                                                    <Label className="switch">
                                                                        <Input type="switch" checked={page.cs_read_search === 'Yes'}
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
                                                                            <Input type="switch" checked={page.cs_delete === 'Yes'} onChange={(e) => handleCheckboxChange(e, index, 'cs_delete', page.cs_facility_id)} />
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
                                        )}
                                    </div>
                                </CardBody>
                            </Card>
                        </Fragment>


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

export default SubTableComponent;
