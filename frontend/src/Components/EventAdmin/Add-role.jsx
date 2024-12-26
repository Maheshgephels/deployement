import React, { Fragment, useState, useEffect, useContext } from 'react';
import { Container, Row, Col, Input, Button, Card, CardBody, Modal, ModalHeader, ModalBody, ModalFooter, FormFeedback, Label } from 'reactstrap';
import { Breadcrumbs } from '../../AbstractElements';
import axios from 'axios';
import { BackendAPI } from '../../api';
import debounce from 'lodash.debounce';
import SweetAlert from 'sweetalert2';
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import { IoIosArrowDown } from "react-icons/io";
import { Field, Form } from 'react-final-form'; // Import Field and Form from react-final-form
import { Link, useNavigate } from 'react-router-dom';
import Select from 'react-select';
import { required, name, Wname, password, expiryDate } from '../Utils/validationUtils';
import { FaEdit } from 'react-icons/fa'; // Import the key icon
import { MdDelete } from "react-icons/md";
import useAuth from '../../Auth/protectedAuth';
import { getToken } from '../../Auth/Auth';
import { PermissionsContext } from '../../contexts/PermissionsContext';


//Utility function used to combine multiple validation functions into a single validation function
const composeValidators = (...validators) => value =>
    validators.reduce((error, validator) => error || validator(value), undefined);

const AddEventRole = () => {
    useAuth();
    const [data, setData] = useState([]);
    const navigate = useNavigate(); // Initialize useHistory
    const [loading, setLoading] = useState(true);
    const [modal, setModal] = useState(false);
    const [designationName, setDesignationName] = useState('');
    const [designations, setdesignations] = useState([]);

    const [name, setName] = useState('');
    const [nameValidatioMessage, setNameValidatioMessage] = useState('');
    const [nameTouched, setNameTouched] = useState(false);
    const { permissions } = useContext(PermissionsContext);



    const handleChange = (e) => {
        const newValue = e.target.value;
        setDesignationName(newValue);
        console.log("designationName:", newValue);
    };

    const onSubmit = async (values) => {

        if (nameValidatioMessage) {
            return; // Prevent form submission if there is a validation error
        }

        const formData = {
            ...values,
            // adduser: values.adduser ? "1" : "0",
            // spot: values.spot ? "1" : "0",
            // designations: designations
        };

        try {
            console.log('Form data to send:', formData);
            const token = getToken();
            await axios.post(`${BackendAPI}/eventrole/addrole`, formData, {
                headers: {
                    Authorization: `Bearer ${token}` // Include the token in the Authorization header
                }
            });

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
                    navigate(`${process.env.PUBLIC_URL}/event/manage-role/Consoft`);
                }
            });
        } catch (error) {
            console.error('Error creating application login:', error.message);
        }
    };


    const handleAddRole = () => {
        if (designationName.trim() !== '') {
            setdesignations([...designations, designationName]);
            setDesignationName('');
        }
    };

    const handleEditRole = (index, newName) => {
        const updateddesignations = [...designations];
        updateddesignations[index] = newName;
        setdesignations(updateddesignations);
    };

    const handleRemoveRole = (index) => {
        const updateddesignations = [...designations];
        updateddesignations.splice(index, 1);
        setdesignations(updateddesignations);
    };

    const handleCancel = () => {
        setModal(true);
    };


    const validatename = debounce(async (value) => {
        try {

            // Call the API to check name availability
            const token = getToken();
            const response = await axios.post(`${BackendAPI}/eventrole/check-role`, { catName: value }, {
                headers: {
                    Authorization: `Bearer ${token}` // Include the token in the Authorization header
                }
            });

            console.log('Server response:', response);
            if (!response.data.available) {
                setNameValidatioMessage('Role already exists');
            } else {
                // Only set the validation message if the name is valid
                setNameValidatioMessage('');
            }
        } catch (error) {
            console.error('Error checking name availability:', error);
            setNameValidatioMessage('Error checking name availability');
        }
    }, 500); // Debounce time: 500ms



    // Effect to trigger validation when name changes
    useEffect(() => {
        if (nameTouched) { // Only validate name if it has been touched
            validatename(name);
        }
        return () => {
            validatename.cancel();
        };
    }, [name, nameTouched, permissions]);

    // Extract role component
    const EventrolesPermissions = permissions['Eventroles'];

    const handleNavigation = () => {
        navigate(`${process.env.PUBLIC_URL}/event/manage-role/Consoft`);
    };

    return (
        <Fragment>
            <Breadcrumbs parentClickHandler={handleNavigation} mainTitle="Create Role" parent="Manage Role" title="Create Role" />
            <Container fluid={true}>
                <Row>
                    <Col sm="12">
                        <Card>
                            <CardBody>
                                <Form onSubmit={onSubmit}>
                                    {({ handleSubmit }) => (
                                        <form className='needs-validation' noValidate='' onSubmit={handleSubmit}>

                                            <Row>
                                                <Col md="4" className="mb-3">
                                                    <Field
                                                        name="catName"
                                                        validate={composeValidators(required, Wname)}
                                                    >
                                                        {({ input, meta }) => (
                                                            <div>
                                                                <Label className='form-label' for="catName"><strong>Role Name <span className="red-asterisk">*</span></strong></Label>
                                                                <input
                                                                    {...input}
                                                                    className="form-control"
                                                                    id="catName"
                                                                    type="text"
                                                                    value={input.value} // Use input.value instead of catName
                                                                    onChange={(e) => {
                                                                        input.onChange(e); // Trigger onChange of the Field component
                                                                        setName(e.target.value);
                                                                        setNameTouched(true);
                                                                    }}
                                                                />

                                                                {nameValidatioMessage && <div className="text-danger">{nameValidatioMessage}</div>}



                                                                {meta.error && meta.touched && <p className='d-block text-danger'>{meta.error}</p>}
                                                            </div>
                                                        )}
                                                    </Field>
                                                </Col>
                                            </Row>

                                            {/* <Row>
                                                <Col md="4" className="mb-3">
                                                    <Label className='form-label' for="designationName"><strong>Designation Name</strong></Label>
                                                    <div className="d-flex">
                                                        <input
                                                            className="form-control"
                                                            id="designationName"
                                                            type="text"
                                                            value={designationName}
                                                            onChange={handleChange}
                                                        />
                                                        <Button color='primary' onClick={handleAddRole} className='ml-2'>Add</Button>
                                                    </div>
                                                </Col>
                                            </Row> */}

                                            {/* <Row>
                                                <Col md="4" className="mb-3">
                                                    <ul className="list-group">
                                                        {designations.map((role, index) => (
                                                            <li className="list-group-item d-flex justify-content-between align-items-center" key={index}>
                                                                <Input
                                                                    type="text"
                                                                    value={role}
                                                                    onChange={(e) => handleEditRole(index, e.target.value)}
                                                                />
                                                                <div>
                                                                    <Button color="danger" size="sm" onClick={() => handleRemoveRole(index)}><MdDelete /></Button>
                                                                </div>
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </Col>
                                            </Row> */}

                                            {/* <Row>
                                                <Col >
                                                    <Field
                                                        name="adduser"
                                                        type="checkbox"
                                                    // validate={composeValidators(required, Wname)}
                                                    >
                                                        {({ input, meta }) => (
                                                            <div >
                                                                <input
                                                                    {...input}
                                                                    id="adduser" // Correct ID for the input
                                                                />
                                                                <Label className='form-check-label' style={{ marginLeft: '10px' }} for="adduser"><strong>Visible in add user form</strong></Label>
                                                                {meta.error && meta.touched && <p className='d-block text-danger'>{meta.error}</p>}
                                                            </div>
                                                        )}
                                                    </Field>
                                                </Col>
                                            </Row>

                                            <Row>
                                                <Col >
                                                    <Field
                                                        name="spot"
                                                        type="checkbox"
                                                    // validate={composeValidators(required, Wname)}
                                                    >
                                                        {({ input, meta }) => (
                                                            <div >
                                                                <input
                                                                    {...input}
                                                                    id="spot" // Correct ID for the input
                                                                />
                                                                <Label className='form-check-label' style={{ marginLeft: '10px' }} for="adduser"><strong>Visible in spot registration form</strong></Label>
                                                                {meta.error && meta.touched && <p className='d-block text-danger'>{meta.error}</p>}
                                                            </div>
                                                        )}
                                                    </Field>
                                                </Col>
                                            </Row> */}



                                            {EventrolesPermissions?.add === 1 && (
                                                <div>
                                                    <Button color='primary' type='submit' className="me-3 mt-3">Create Role</Button>
                                                    <Button color='warning' onClick={handleCancel} className="mt-3">Cancel</Button>
                                                </div>
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
                    <div>
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
                    {/* <Link to="/Categories/Consoft" className="btn btn-warning">Yes</Link> */}
                    <Button color="primary" onClick={() => setModal(!modal)}>No</Button>
                </ModalFooter>
            </Modal>
        </Fragment>
    );
};

export default AddEventRole;