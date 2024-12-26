import React, { Fragment, useEffect, useState, useContext } from 'react';
import { useLocation } from 'react-router-dom';
import { Container, Row, Col, Card, Label, Button, CardBody, Input, Modal, ModalHeader, ModalBody, ModalFooter } from 'reactstrap';
import axios from 'axios';
import { BackendAPI } from '../../api';
import { Field, Form } from 'react-final-form';
import { required, Name } from '../Utils/validationUtils';
import CustomizerContext from '../../_helper/Customizer';
import { Link, useNavigate } from 'react-router-dom';
import { Breadcrumbs } from '../../AbstractElements';
import SweetAlert from 'sweetalert2';
import { FaEdit } from 'react-icons/fa'; // Import the key icon
import { MdDelete } from "react-icons/md";
import useAuth from '../../Auth/protectedAuth';
import { getToken } from '../../Auth/Auth';
import debounce from 'lodash.debounce';
import { PermissionsContext } from '../../contexts/PermissionsContext';

const composeValidators = (...validators) => value =>
    validators.reduce((error, validator) => error || validator(value), undefined);

const EditEventRole = () => {
    useAuth();
    const [Role, setRole] = useState([]); // State to store Role data
    const { layoutURL } = useContext(CustomizerContext);
    const location = useLocation();
    const { catId, catName } = location.state;
    const navigate = useNavigate();
    const [designationName, setDesignationName] = useState('');
    const [newdesignations, setdesignations] = useState([]);
    const [designation, setdesignation] = useState([]);
    const [deleteDesignations, setDeleteDesignations] = useState([]);
    const [name, setName] = useState('');
    const [nameValidatioMessage, setNameValidatioMessage] = useState('');
    const [nameTouched, setNameTouched] = useState(false);
    const [modal, setModal] = useState(false);
    const { permissions } = useContext(PermissionsContext);

    console.log("Data:", designationName);


    useEffect(() => {
        fetchRole(); // Fetch Role data when component mounts
    }, [permissions]);

    // Extract role component
    const EventrolesPermissions = permissions['Eventroles'];

    const fetchRole = async () => {
        try {
            const token = getToken();
            const response = await axios.post(`${BackendAPI}/eventRole/editRole`, { catId }, {
                headers: {
                    Authorization: `Bearer ${token}` // Include the token in the Authorization header
                }
            });
            console.log('Data from API:', response.data);
            setRole(response.data || []); // Ensure Role is always an array
            setdesignation(response.data.map(item => ({
                id: item.cs_designation_id,
                name: item.cs_designation_name
            })));
        } catch (error) {
            console.error('Error fetching Role data:', error);
        }
    };

    const handleCancel = () => {
        setModal(true);
    };

    const handleNavigation = () => {
        navigate(`${process.env.PUBLIC_URL}/event/manage-role/Consoft`);
    };

    const onSubmit = async (values) => {
        if (nameValidatioMessage) {
            return; // Prevent form submission if there is a validation error
        }
        try {
            const spotValue = values.spot ? 1 : 0;

            // const designations = [];
            // for (let i = 0; i < Object.keys(values).length; i++) {
            //     const index = Object.keys(values).findIndex(key => key === `designationId${i}`);
            //     if (index !== -1) {
            //         const designationId = values[`designationId${i}`];
            //         const designationName = values[`designationName${i}`];
            //         const originalDesignationId = Role[i].cs_designation_id;
            //         const originalDesignationName = Role[i].cs_designation_name;
            //         if (designationId !== originalDesignationId || designationName !== originalDesignationName) {
            //             designations.push({
            //                 id: designationId,
            //                 name: designationName
            //             });
            //         }
            //     }
            // }

            const token = getToken();
            const response = await axios.post(`${BackendAPI}/eventrole/updateRole`, {
                catId,
                RoleName: values.RoleName,
                // spot: spotValue,
                // designations: designations,
                // newdesignations: newdesignations,
                // delDesignations: deleteDesignations
            }, {
                headers: {
                    Authorization: `Bearer ${token}` // Include the token in the Authorization header
                }
            });
            if (response.status === 200) {
                console.log('Role updated successfully');
            } else {
                console.error('Error updating Role:', response.data.message);
            }

            SweetAlert.fire({
                title: 'Success!',
                text: 'Changes Updated successfully !',
                icon: 'success',
                timer: 3000,
                showConfirmButton: false,
                allowOutsideClick: false,
                allowEscapeKey: false
            }).then((result) => {
                if (result.dismiss === SweetAlert.DismissReason.timer) {
                    navigate(`${process.env.PUBLIC_URL}/event/manage-role/${layoutURL}`);
                }
            });
        } catch (error) {
            console.error('Error updating settings:', error.message);
        }
    };

    const handleChange = (e) => {
        const newValue = e.target.value;
        setDesignationName(newValue);
        console.log("designationName:", newValue);
    };

    const handleAddRole = () => {
        if (designationName.trim() !== '') {
            setdesignations([...newdesignations, designationName]);
            setDesignationName('');
        }
    };

    const handleEditRole = (index, newName) => {
        const updateddesignations = [...newdesignations];
        updateddesignations[index] = newName;
        setdesignations(updateddesignations);
    };

    const handleRemoveRole = (index) => {
        const updateddesignations = [...newdesignations];
        updateddesignations.splice(index, 1);
        setdesignations(updateddesignations);
    };

    const handleDeleteDesignation = (cs_designation_id, cs_designation_name) => {
        console.log("Deleting designation with ID:", cs_designation_id);
        console.log("Current Role array:", designation);

        const updatedRole = designation.filter(des => des.id !== cs_designation_id);
        console.log("Updated Role array:", updatedRole);

        setdesignation(updatedRole);
        setDeleteDesignations(prevState => [...prevState, cs_designation_id, cs_designation_name]);
    };

    const validatename = debounce(async (value) => {
        try {
            if (value === catName) {
                setNameValidatioMessage('');
                return;
            }

            const token = getToken();
            const response = await axios.post(`${BackendAPI}/eventRole/check-role`, { catName: value }, {
                headers: {
                    Authorization: `Bearer ${token}` // Include the token in the Authorization header
                }
            });

            console.log('Server response:', response);
            if (!response.data.available) {
                setNameValidatioMessage('Role already exists');
            } else {
                setNameValidatioMessage('');
            }
        } catch (error) {
            console.error('Error checking name availability:', error);
            setNameValidatioMessage('Error checking name availability');
        }
    }, 500);

    useEffect(() => {
        if (nameTouched) {
            validatename(name);
        }
        return () => {
            validatename.cancel();
        };
    }, [name, nameTouched]);

    return (
        <Fragment>
            <Breadcrumbs parentClickHandler={handleNavigation} mainTitle="Edit Role" parent="Manage Role" title="Edit Role" />
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
                                                        name="RoleName"
                                                        initialValue={Role[0]?.role_name || ''}
                                                        validate={composeValidators(required, Name)}
                                                    >
                                                        {({ input, meta }) => (
                                                            <div>
                                                                <Label className='form-label' for="RoleName"><strong>Role Name <span className="red-asterisk">*</span></strong></Label>
                                                                <input
                                                                    {...input}
                                                                    className="form-control"
                                                                    id="RoleName"
                                                                    type="text"
                                                                    onChange={(e) => {
                                                                        input.onChange(e);
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
                                                    <Label className="form-label" htmlFor="designationName"><strong>Designation Name</strong></Label>
                                                    <div className="d-flex">
                                                        <input
                                                            className="form-control"
                                                            id="designationName"
                                                            type="text"
                                                            value={designationName}
                                                            onChange={handleChange}
                                                        />
                                                        <Button color="primary" onClick={handleAddRole} className="ml-2">Add</Button>
                                                    </div>
                                                </Col>
                                            </Row>

                                            {Role.length > 0 && Role.some(item => item.cs_designation_name) && (
                                                <Row>
                                                    {Role.map((item, index) => (
                                                        <Fragment key={index}>
                                                            <Field name={`designationId${index}`} initialValue={item.cs_designation_id || ''}>
                                                                {({ input }) => (
                                                                    <input {...input} type="hidden" />
                                                                )}
                                                            </Field>
                                                            {designation.map((des, index) => (
                                                                <Col md="4" className="mb-3" key={index}>
                                                                    <Field
                                                                        name={`designationName${index}`}
                                                                        initialValue={des.name || ''}
                                                                    >
                                                                        {({ input, meta }) => (
                                                                            <div>
                                                                                <Label className="form-label" htmlFor={`designationName${index}`}><strong>Designation Name</strong></Label>
                                                                                <input
                                                                                    {...input}
                                                                                    className="form-control"
                                                                                    id={`designationName${index}`}
                                                                                    type="text"
                                                                                />
                                                                                <Button color="danger" size="sm" onClick={() => handleDeleteDesignation(des.id, des.name)} className="ml-2"><MdDelete /></Button>
                                                                            </div>
                                                                        )}
                                                                    </Field>
                                                                </Col>
                                                            ))}
                                                        </Fragment>
                                                    ))}
                                                </Row>
                                            )}

                                            <Row>
                                                <Col md="4" className="mb-3">
                                                    <ul className="list-group">
                                                        {newdesignations.map((Role, index) => (
                                                            <li className="list-group-item d-flex justify-content-between align-items-center" key={index}>
                                                                <Input
                                                                    type="text"
                                                                    value={Role}
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
                                            {EventrolesPermissions?.edit === 1 && (
                                                <div>
                                                    <Button color='primary' type='submit' className="me-3 mt-3">Save</Button>
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

export default EditEventRole;
