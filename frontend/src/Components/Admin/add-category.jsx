import React, { Fragment, useState, useEffect } from 'react';
import { Container, Row, Col, Input, Button, Card, CardBody, Modal, ModalHeader, ModalBody, ModalFooter, FormFeedback, Label } from 'reactstrap';
import { Breadcrumbs } from '../../AbstractElements';
import axios from 'axios';
import { BackendAPI } from '../../api';
import debounce from 'lodash.debounce';
import SweetAlert from 'sweetalert2';
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import { IoIosArrowDown } from "react-icons/io";
import { Field, Form } from 'react-final-form'; // Import Field and Form from react-final-form
import { Link, useNavigate, useLocation } from 'react-router-dom';
import Select from 'react-select';
import { required, name, Wname, password, expiryDate } from '../Utils/validationUtils';
import { FaEdit } from 'react-icons/fa'; // Import the key icon
import { MdDelete } from "react-icons/md";
import useAuth from '../../Auth/protectedAuth';
import { getToken } from '../../Auth/Auth';


//Utility function used to combine multiple validation functions into a single validation function
const composeValidators = (...validators) => value =>
    validators.reduce((error, validator) => error || validator(value), undefined);

const AddCategory = () => {
    useAuth();
    const [data, setData] = useState([]);
    const location = useLocation();
    const { prodData } = location.state;
    const navigate = useNavigate(); // Initialize useHistory
    const [loading, setLoading] = useState(true);
    const [modal, setModal] = useState(false);
    const [designationName, setDesignationName] = useState('');
    const [designations, setdesignations] = useState([]);

    const [name, setName] = useState('');
    const [nameValidatioMessage, setNameValidatioMessage] = useState('');
    const [nameTouched, setNameTouched] = useState(false);
    const [showRemaining, setShowRemaining] = useState(false);




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
            catName: values.catName,
            registration: values.show_reg ? "1" : "0",
            onsite: values.show_onsite ? "1" : "0",
            // designations: designations
        };

        try {
            console.log('Form data to send:', formData);
            const token = getToken();
            await axios.post(`${BackendAPI}/category/addcategory`, formData, {
                headers: {
                    Authorization: `Bearer ${token}` // Include the token in the Authorization header
                }
            });

            SweetAlert.fire({
                title: 'Success!',
                text: 'Category created successfully!',
                icon: 'success',
                timer: 3000,
                showConfirmButton: false,
                allowOutsideClick: false,
                allowEscapeKey: false
            }).then((result) => {
                if (result.dismiss === SweetAlert.DismissReason.timer) {
                    navigate(`${process.env.PUBLIC_URL}/onsite/manage-category/Consoft`);
                }
            });
        } catch (error) {
            console.error('Error creating application login:', error.message);
        }
    };


    const handleAddCategory = () => {
        if (designationName.trim() !== '') {
            setdesignations([...designations, designationName]);
            setDesignationName('');
        }
    };

    const handleEditCategory = (index, newName) => {
        const updateddesignations = [...designations];
        updateddesignations[index] = newName;
        setdesignations(updateddesignations);
    };

    const handleRemoveCategory = (index) => {
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
            const response = await axios.post(`${BackendAPI}/category/check-category`, { catName: value }, {
                headers: {
                    Authorization: `Bearer ${token}` // Include the token in the Authorization header
                }
            });

            console.log('Server response:', response);
            if (!response.data.available) {
                setNameValidatioMessage('Category already exists');
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
    }, [name, nameTouched]);

    const handleNavigation = () => {
        navigate(`${process.env.PUBLIC_URL}/onsite/manage-category/Consoft`);
    };

    return (
        <Fragment>
            <Breadcrumbs parentClickHandler={handleNavigation} mainTitle="Create Category" parent="Manage Category" title="Create Category" />
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
                                                                <Label className='form-label' for="catName"><strong>Category Name <span className="red-asterisk">*</span></strong></Label>
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

                                            {prodData && prodData.some(item => item.product_id === 3 && item.cs_status === 1) && (


                                                <Row>
                                                    <Col md="12" className="mb-3">
                                                        <Field
                                                            name="show_onsite"
                                                            type="checkbox"
                                                        >
                                                            {({ input, meta }) => (
                                                                <div>
                                                                    
                                                                    <input
                                                                        {...input}
                                                                        id="sOnsite"
                                                                        onChange={(e) => {
                                                                            input.onChange(e);
                                                                            setShowRemaining(e.target.checked);
                                                                        }}
                                                                    />
                                                                    <Label className='form-check-label' style={{ marginLeft: '10px' }} for="sOnsite">
                                                                        <strong>Should the created category be visible in the Onsite admin spot registration form ?</strong>
                                                                    </Label>
                                                                    
                                                                    {meta.error && meta.touched && <p className='d-block text-danger'>{meta.error}</p>}
                                                                </div>
                                                            )}
                                                        </Field>
                                                    </Col>
                                                </Row>

                                            )}

                                            {prodData && prodData.some(item => item.product_id === 1 && item.cs_status === 1) && (


                                                <Row>
                                                    <Col md="12" className="mb-3">
                                                        <Field
                                                            name="show_reg"
                                                            type="checkbox"
                                                        >
                                                            {({ input, meta }) => (
                                                                <div>
                                                                    
                                                                    <input
                                                                        {...input}
                                                                        id="sEvent"
                                                                        onChange={(e) => {
                                                                            input.onChange(e);
                                                                            setShowRemaining(e.target.checked);
                                                                        }}
                                                                    />
                                                                    <Label className='form-check-label' style={{ marginLeft: '10px' }} for="sEvent">
                                                                        <strong>Should the created category be visible in the Registration admin confernece registration form ?</strong>
                                                                    </Label>
                                                                    
                                                                    {meta.error && meta.touched && <p className='d-block text-danger'>{meta.error}</p>}
                                                                </div>
                                                            )}
                                                        </Field>
                                                    </Col>
                                                </Row>

                                            )}

                                            {/* {prodData && prodData.some(item => item.product_id === 2 && item.cs_status === 1) && (

                                                <Row>
                                                    <Col md="8" className="mb-3">
                                                        <Field
                                                            name="show_event"
                                                            type="checkbox"
                                                        >
                                                            {({ input, meta }) => (
                                                                <div>
                                                                    <input
                                                                        {...input}
                                                                        id="sEvent"
                                                                        onChange={(e) => {
                                                                            input.onChange(e);
                                                                            setShowRemaining(e.target.checked);
                                                                        }}
                                                                    />
                                                                    <Label className='form-check-label' style={{ marginLeft: '10px' }} for="sEvent">
                                                                        <strong>Should the created category be visible in the Event admin ?</strong>
                                                                    </Label>
                                                                    {meta.error && meta.touched && <p className='d-block text-danger'>{meta.error}</p>}
                                                                </div>
                                                            )}
                                                        </Field>
                                                    </Col>
                                                </Row>

                                            )} */}

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
                                                        <Button color='primary' onClick={handleAddCategory} className='ml-2'>Add</Button>
                                                    </div>
                                                </Col>
                                            </Row> */}

                                            {/* <Row>
                                                <Col md="4" className="mb-3">
                                                    <ul className="list-group">
                                                        {designations.map((category, index) => (
                                                            <li className="list-group-item d-flex justify-content-between align-items-center" key={index}>
                                                                <Input
                                                                    type="text"
                                                                    value={category}
                                                                    onChange={(e) => handleEditCategory(index, e.target.value)}
                                                                />
                                                                <div>
                                                                    <Button color="danger" size="sm" onClick={() => handleRemoveCategory(index)}><MdDelete /></Button>
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




                                            <div>
                                                <Button color='primary' type='submit' className="me-3 mt-3">Create Category</Button>
                                                <Button color='warning' onClick={handleCancel} className="mt-3">Cancel</Button>
                                            </div>




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
                    {/* <Link to="/onsite/manage-category/Consoft" className="btn btn-warning">Yes</Link> */}
                    <Button color="primary" onClick={() => setModal(!modal)}>No</Button>
                </ModalFooter>
            </Modal>
        </Fragment>
    );
};

export default AddCategory;