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

const composeValidators = (...validators) => value =>
    validators.reduce((error, validator) => error || validator(value), undefined);

const EditRegCategory = () => {
    useAuth();
    const [category, setCategory] = useState([]); // State to store category data
    const { layoutURL } = useContext(CustomizerContext);
    const location = useLocation();
    const { catId, catName, onsite, prodData, registration} = location.state;
    const navigate = useNavigate();
    const [designationName, setDesignationName] = useState('');
    const [newdesignations, setdesignations] = useState([]);
    const [designation, setdesignation] = useState([]);
    const [deleteDesignations, setDeleteDesignations] = useState([]);
    const [name, setName] = useState('');
    const [nameValidatioMessage, setNameValidatioMessage] = useState('');
    const [nameTouched, setNameTouched] = useState(false);
    const [modal, setModal] = useState(false);
    const [showRemaining, setShowRemaining] = useState(onsite);




    console.log("Data:", prodData);
    console.log("Location",location.state);

    const handleShowTypeChange = (e, input) => {
        const isChecked = e.target.checked;
        const value = isChecked ? 1 : 0;
        input.onChange(value);
        setShowRemaining(value);
    };


    const handleCancel = () => {
        setModal(true);
    };

    const handleNavigation = () => {
        navigate(`${process.env.PUBLIC_URL}/registration/manage-reg-category/Consoft`);
    };

    const onSubmit = async (values) => {
        if (nameValidatioMessage) {
            return; // Prevent form submission if there is a validation error
        }
        try {
            const onsite = values.show_onsite ? 1 : 0;

            // const designations = [];
            // for (let i = 0; i < Object.keys(values).length; i++) {
            //     const index = Object.keys(values).findIndex(key => key === `designationId${i}`);
            //     if (index !== -1) {
            //         const designationId = values[`designationId${i}`];
            //         const designationName = values[`designationName${i}`];
            //         const originalDesignationId = category[i].cs_designation_id;
            //         const originalDesignationName = category[i].cs_designation_name;
            //         if (designationId !== originalDesignationId || designationName !== originalDesignationName) {
            //             designations.push({
            //                 id: designationId,
            //                 name: designationName
            //             });
            //         }
            //     }
            // }

            const token = getToken();
            const response = await axios.post(`${BackendAPI}/regcatgory/updatecategory`, {
                catId,
                categoryName: values.categoryName,
                registration: values.show_reg ? "1" : "0",
                onsite: values.show_onsite ? "1" : "0",
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
                console.log('Category updated successfully');
            } else {
                console.error('Error updating category:', response.data.message);
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
                    navigate(`${process.env.PUBLIC_URL}/registration/manage-reg-category/${layoutURL}`);
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

    const handleAddCategory = () => {
        if (designationName.trim() !== '') {
            setdesignations([...newdesignations, designationName]);
            setDesignationName('');
        }
    };

    const handleEditCategory = (index, newName) => {
        const updateddesignations = [...newdesignations];
        updateddesignations[index] = newName;
        setdesignations(updateddesignations);
    };

    const handleRemoveCategory = (index) => {
        const updateddesignations = [...newdesignations];
        updateddesignations.splice(index, 1);
        setdesignations(updateddesignations);
    };

    const handleDeleteDesignation = (cs_designation_id, cs_designation_name) => {
        console.log("Deleting designation with ID:", cs_designation_id);
        console.log("Current category array:", designation);

        const updatedCategory = designation.filter(des => des.id !== cs_designation_id);
        console.log("Updated category array:", updatedCategory);

        setdesignation(updatedCategory);
        setDeleteDesignations(prevState => [...prevState, cs_designation_id, cs_designation_name]);
    };

    const validatename = debounce(async (value) => {
        try {
            if (value === catName) {
                setNameValidatioMessage('');
                return;
            }

            const token = getToken();
            const response = await axios.post(`${BackendAPI}/eventcategory/check-category`, { catName: value }, {
                headers: {
                    Authorization: `Bearer ${token}` // Include the token in the Authorization header
                }
            });

            console.log('Server response:', response);
            if (!response.data.available) {
                setNameValidatioMessage('Category already exists');
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
            <Breadcrumbs parentClickHandler={handleNavigation} mainTitle="Edit Category" parent="Manage Category" title="Edit Category" />
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
                                                        name="categoryName"
                                                        initialValue={catName}
                                                        validate={composeValidators(required, Name)}
                                                    >
                                                        {({ input, meta }) => (
                                                            <div>
                                                                <Label className='form-label' for="categoryName"><strong>Category Name <span className="red-asterisk">*</span></strong></Label>
                                                                <input
                                                                    {...input}
                                                                    className="form-control"
                                                                    id="categoryName"
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
                                            {prodData && prodData.some(item => item.product_id === 3 && item.cs_status === 1) && (


                                                <Row>
                                                    <Col md="12" className="mb-3">
                                                        <Field
                                                            name="show_onsite"
                                                            initialValue={onsite}
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
                                                            initialValue={registration}
                                                            type="checkbox"
                                                        >
                                                            {({ input, meta }) => (
                                                                <div>

                                                                    <input
                                                                        {...input}
                                                                        id="sReg"
                                                                        onChange={(e) => {
                                                                            input.onChange(e);
                                                                            setShowRemaining(e.target.checked);
                                                                        }}
                                                                    />
                                                                    <Label className='form-check-label' style={{ marginLeft: '10px' }} for="sReg">
                                                                        <strong>Should the created category be visible in the Registration admin confernece registration form ?</strong>
                                                                    </Label>

                                                                    {meta.error && meta.touched && <p className='d-block text-danger'>{meta.error}</p>}
                                                                </div>
                                                            )}
                                                        </Field>
                                                    </Col>
                                                </Row>

                                            )}


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
                                                        <Button color="primary" onClick={handleAddCategory} className="ml-2">Add</Button>
                                                    </div>
                                                </Col>
                                            </Row>

                                            {category.length > 0 && category.some(item => item.cs_designation_name) && (
                                                <Row>
                                                    {category.map((item, index) => (
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
                                                        {newdesignations.map((category, index) => (
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

                                            <div>
                                                <Button color='primary' type='submit' className="me-3 mt-3">Update</Button>
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

export default EditRegCategory;
