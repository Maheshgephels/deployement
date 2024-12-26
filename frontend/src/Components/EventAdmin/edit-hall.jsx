import React, { Fragment, useEffect, useState, useContext } from 'react';
import { useLocation } from 'react-router-dom';
import { Container, Row, Col, Card, Label, Button, CardBody, Modal, ModalHeader, ModalBody, ModalFooter, Input, FormFeedback } from 'reactstrap';
import axios from 'axios';
import { BackendAPI } from '../../api';
import { Field, Form } from 'react-final-form';
import { required, Notify } from '../Utils/validationUtils';
import CustomizerContext from '../../_helper/Customizer';
import { Link, useNavigate } from 'react-router-dom';
import { Breadcrumbs } from '../../AbstractElements';
import SweetAlert from 'sweetalert2';
import useAuth from '../../Auth/protectedAuth';
import { getToken } from '../../Auth/Auth';
import { PermissionsContext } from '../../contexts/PermissionsContext';

const composeValidators = (...validators) => value =>
    validators.reduce((error, validator) => error || validator(value), undefined);

const EditHall = () => {
    useAuth();
    const [Hall, setHall] = useState({}); // State to store Hall data
    const { layoutURL } = useContext(CustomizerContext);
    const [modal, setModal] = useState(false);
    const location = useLocation();
    const { catName } = location.state;
    const { HallId, Hallname } = location.state;
    const navigate = useNavigate();
    const [name, setName] = useState('');
    const [nameValidationMessage, setNameValidationMessage] = useState('');
    const [nameTouched, setNameTouched] = useState(false);
    const [halltype, setHalltype] = useState([]);
    const [loading, setLoading] = useState(true);
    const { permissions } = useContext(PermissionsContext);

    useEffect(() => {
        fetchHall(); // Fetch Hall data when component mounts
    }, [permissions]);

    // Extract Halls component
    const HallsPermissions = permissions['ManageHall'];

    const fetchHall = async () => {
        try {
            const token = getToken();
            const response = await axios.post(`${BackendAPI}/hall/editHall`, { HallId }, {
                headers: {
                    Authorization: `Bearer ${token}` // Include the token in the Authorization header
                }
            });
            console.log('Data from API:', response.data);
            setHall(response.data[0]); // Set Hall data to the first item in the response array
        } catch (error) {
            console.error('Error fetching Hall data:', error);
        }
    };

    const handleCancel = () => {
        setModal(true);
    };

    const handleNavigation = () => {
        navigate(`${process.env.PUBLIC_URL}/event/manage-hall/Consoft`);
    };

    const onSubmit = async (values) => {
        if (nameValidationMessage) {
            return; // Prevent form submission if there is a validation error
        }
        try {
            const token = getToken();
            // Send formData to server
            const response = await axios.post(`${BackendAPI}/hall/updateHall`, { values, HallId }, {
                headers: {
                    Authorization: `Bearer ${token}` // Include the token in the Authorization header
                }
            });

            // Handle server response
            if (response.status === 200) {
                // Show success message to the user
                console.log('Hall updated successfully');
            } else {
                // Handle error condition
                console.error('Error updating Hall:', response.data.message);
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
                    navigate(`${process.env.PUBLIC_URL}/event/manage-hall/${layoutURL}`);
                }
            });
        } catch (error) {
            // Handle network error or other exceptions
            console.error('Error updating settings:', error.message);
        }
    };

    const fetchDropdown = async () => {
        try {
            const token = getToken();
            const response = await axios.get(`${BackendAPI}/hall/getDropdownData`, {
                headers: {
                    Authorization: `Bearer ${token}` // Include the token in the Authorization header
                }
            });
            setLoading(false);

            const fetchHalltype = response.data.halltype;
            setHalltype(fetchHalltype);

            console.log("Check:", fetchHalltype);
        } catch (error) {
            console.error('Error fetching dropdown data:', error);
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDropdown(); // Corrected function name
    }, []);

    return (
        <Fragment>
            <Breadcrumbs parentClickHandler={handleNavigation} mainTitle="Edit Hall" parent="Manage Hall" title="Edit Hall" />
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
                                                        name="dName"
                                                        initialValue={Hall.locat_name || ''} // Set initial value to Hall name, defaulting to empty string
                                                        validate={composeValidators(required, Notify)}
                                                    >
                                                        {({ input, meta }) => (
                                                            <div>
                                                                <Label className='form-label' for="HallName"><strong>Hall Heading <span className="red-asterisk">*</span></strong></Label>
                                                                <input
                                                                    {...input}
                                                                    className="form-control"
                                                                    id="HallName"
                                                                    type="text"
                                                                    placeholder="Enter hall name"
                                                                />
                                                                {meta.error && meta.touched && <p className='d-block text-danger'>{meta.error}</p>}
                                                            </div>
                                                        )}
                                                    </Field>
                                                </Col>
                                            </Row>

                                            <Row>
                                                <Col md="6 mb-3">
                                                    <Label for="Description"><strong>Description</strong></Label>
                                                    <Field
                                                        name="Description"
                                                        initialValue={Hall.description || ''}

                                                    >
                                                        {({ input, meta }) => (
                                                            <>
                                                                <Input {...input} type="textarea" id="Description" placeholder="Enter hall description" />
                                                                {meta.error && meta.touched && <p className='d-block text-danger'>{meta.error}</p>}
                                                            </>
                                                        )}
                                                    </Field>
                                                </Col>
                                            </Row>
                                            <Row>
                                                <Col md="4" className="mb-3">
                                                    <Label className='form-label' for="type"><strong>Hall type <span className="red-asterisk">*</span></strong></Label>
                                                    <Field
                                                        name="halltype" // Use dynamic field name
                                                        validate={composeValidators(required)}
                                                        initialValue={Hall.locat_type || 'Demo'}
                                                    >
                                                        {({ input, meta }) => (
                                                            <div>
                                                                <select
                                                                    {...input}
                                                                    className="form-control"
                                                                    id="selectmethod"
                                                                >
                                                                    {/* <option value="">Select hall type</option> */}
                                                                    {halltype.map((option) => (
                                                                        <option key={option.hall_type_id} value={option.hall_type_id}>
                                                                            {option.hall_type_name}
                                                                        </option>
                                                                    ))}
                                                                </select>
                                                                {meta.error && meta.touched && <FormFeedback className='d-block text-danger'>{meta.error}</FormFeedback>}
                                                            </div>
                                                        )}
                                                    </Field>
                                                </Col>
                                            </Row>
                                            {HallsPermissions?.edit === 1 && (
                                            <div>
                                                <Button color='primary' type='submit' className="me-2 mt-3">Save</Button>
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
                        <p>
                            Your changes will be discarded. Are you sure you want to cancel?
                        </p>
                    </div>
                </ModalBody>
                <ModalFooter>
                    <Button onClick={handleNavigation} color='warning'>
                        Yes
                    </Button>
                    <Button color="primary" onClick={() => setModal(!modal)}>No</Button>
                </ModalFooter>
            </Modal>
        </Fragment>
    );
};

export default EditHall;
