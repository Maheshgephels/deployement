import React, { Fragment, useEffect, useState, useContext } from 'react';
import { useLocation } from 'react-router-dom';
import { Container, Row, Col, Card, Label, Button, CardBody, Modal, ModalHeader, ModalBody, ModalFooter, } from 'reactstrap';
import axios from 'axios';
import { BackendAPI } from '../../api';
import { Field, Form } from 'react-final-form';
import { required, Wname, Name } from '../Utils/validationUtils';
import CustomizerContext from '../../_helper/Customizer';
import { Link, useNavigate } from 'react-router-dom';
import { Breadcrumbs } from '../../AbstractElements';
import SweetAlert from 'sweetalert2';
import debounce from 'lodash.debounce';
import useAuth from '../../Auth/protectedAuth';
import { getToken } from '../../Auth/Auth';
import Select from 'react-select';

const composeValidators = (...validators) => value =>
    validators.reduce((error, validator) => error || validator(value), undefined);

const EditRegWorkshopType = () => {
    useAuth();
    const [workshop, setWorkshop] = useState({}); // State to store workshop data
    const { layoutURL } = useContext(CustomizerContext);
    const [modal, setModal] = useState(false);
    const location = useLocation();
    const { catName } = location.state;
    const { workshopId, workshopname } = location.state;
    const navigate = useNavigate();
    const [name, setName] = useState('');
    const [nameValidationMessage, setNameValidationMessage] = useState('');
    const [nameTouched, setNameTouched] = useState(false);
    const [custom, setCustom] = useState([]);

    useEffect(() => {
        fetchWorkshop(); // Fetch workshop data when component mounts
        fetchDropdown();
    }, []);

    const fetchWorkshop = async () => {
        try {
            const token = getToken();
            const response = await axios.post(`${BackendAPI}/regWorkshop/editworkshoptype`, { workshopId }, {
                headers: {
                    Authorization: `Bearer ${token}` // Include the token in the Authorization header
                }
            });
            console.log('Data from API:', response.data);
            setWorkshop(response.data[0]); // Set workshop data to the first item in the response array
        } catch (error) {
            console.error('Error fetching workshop data:', error);
        }
    };

    // const handleCancel = () => {
    //     const URL = '/onsite/manage-workshop/';
    //     navigate(`${process.env.PUBLIC_URL}${URL}${layoutURL}`);
    // };
    const handleCancel = () => {
        setModal(true);
    };

    const handleNavigation = () => {
        navigate(`${process.env.PUBLIC_URL}/registration/manage-reg-workshoptype/Consoft`);
      };


    const onSubmit = async (values) => {
        // console.log('U_workshop:', values);
        if (nameValidationMessage) {
            return; // Prevent form submission if there is a validation error
        }

        try {
            const token = getToken();
            // Send formData to server
            const response = await axios.post(`${BackendAPI}/regWorkshop/updateworkshoptype`, { values, workshopId }, {
                headers: {
                    Authorization: `Bearer ${token}` // Include the token in the Authorization header
                }
            });

            // Handle server response
            if (response.status === 200) {
                // Show success message to the user
                console.log('Workshop updated successfully');
            } else {
                // Handle error condition
                console.error('Error updating Workshop:', response.data.message);
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
                    navigate(`${process.env.PUBLIC_URL}/registration/manage-reg-workshoptype/${layoutURL}`);
                }
            });
        } catch (error) {
            // Handle network error or other exceptions
            console.error('Error updating settings:', error.message);
        }
    };


    const validatename = debounce(async (value) => {
        try {

            if (value === workshopname) {
                // Skip validation if the name is the same as the current name
                setNameValidationMessage('');
                return;
            }

            // Call the API to check name availability
            const token = getToken();
            const response = await axios.post(`${BackendAPI}/regWorkshop/check-workshoptype-name`, { dName: value }, {
                headers: {
                    Authorization: `Bearer ${token}` // Include the token in the Authorization header
                }
            });

            console.log('Server response:', response);
            if (!response.data.available) {
                setNameValidationMessage('Workshop name already exists');
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

    const fetchDropdown = async () => {
        try {
            const token = getToken();
            const response = await axios.get(`${BackendAPI}/manageuser/getDropdownData`, {
                headers: {
                    Authorization: `Bearer ${token}` // Include the token in the Authorization header
                }
            });
            // setData(response.data);
            console.log(response.data);
            // setLoading(false);

            const fetchCutomData = response.data.workshoptype;


            setCustom(fetchCutomData);


        } catch (error) {
            console.error('Error fetching dropdown data:', error);
            // setLoading(false);
        }
    };
    const workshopOptions = custom.map((option) => ({
        value: option.id,
        label: option.workshoptype_name,
    }));


    return (
        <Fragment>
            <Breadcrumbs parentClickHandler={handleNavigation} mainTitle="Edit Workshop Type" parent="Manage Workshop Type" title="Edit Workshop Type" />
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
                                                        initialValue={workshop.workshoptype_name}
                                                        validate={composeValidators(required, Name)}
                                                    >
                                                        {({ input, meta }) => (
                                                            <div>

                                                                <Label className='form-label' for="displayname"><strong>Workshop Type Name <span className="red-asterisk">*</span></strong></Label>
                                                                <input
                                                                    {...input}
                                                                    className="form-control"
                                                                    id="displayname"
                                                                    type="text"
                                                                    placeholder="Enter Workshop type name"
                                                                    onChange={(e) => {
                                                                        input.onChange(e); // Trigger onChange of the Field component
                                                                        setName(e.target.value); // Update userName state
                                                                        setNameTouched(true);
                                                                    }}
                                                                />
                                                                {nameValidationMessage && <div className="text-danger">{nameValidationMessage}</div>}

                                                                {meta.error && meta.touched && <p className='d-block text-danger'>{meta.error}</p>}
                                                            </div>
                                                        )}
                                                    </Field>

                                                </Col>

                                              

                                             


                                            </Row>
                                            {/* <Row>
                                                <Col md="4" className="mb-3">
                                                    <Field
                                                        name="adduser"
                                                        type="checkbox"
                                                        initialValue={workshop.cs_visible_add_user || ''}
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
                                            </Row> */}

                                            {/* <Row>
                                                <Col md="4" className="mb-3">
                                                    <Field
                                                        name="spot"
                                                        type="checkbox"
                                                        initialValue={workshop.cs_visible_onspot || ''}
                                                    // validate={composeValidators(required, Wname)}
                                                    >
                                                        {({ input, meta }) => (
                                                            <div >
                                                                <input
                                                                    {...input}
                                                                    id="spot" // Correct ID for the input
                                                                />
                                                                <Label className='form-check-label' style={{ marginLeft: '10px' }} for="spot"><strong>Visible in spot registration form</strong></Label>
                                                                {meta.error && meta.touched && <p className='d-block text-danger'>{meta.error}</p>}
                                                            </div>
                                                        )}
                                                    </Field>
                                                </Col>
                                            </Row> */}
                                            <small className="form-text text-muted">Note: For icon change visit facility page.</small> {/* Help text for pagination */}


                                            <div>
                                                <Button color='primary' type='submit' className="me-2 mt-3">Save</Button>
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
                    {/* <Link to="/App-user/Consoft" className="btn btn-warning">Yes</Link> */}
                    <Button color="primary" onClick={() => setModal(!modal)}>No</Button>
                </ModalFooter>
            </Modal>
        </Fragment>
    );
};

export default EditRegWorkshopType;
