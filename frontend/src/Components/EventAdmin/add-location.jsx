import React, { Fragment, useState, useEffect, useContext } from 'react';
import { Container, Row, Col, Input, Label, Button, Card, CardBody, Modal, ModalHeader, ModalBody, ModalFooter, PopoverBody, UncontrolledPopover } from 'reactstrap';
import { useForm } from 'react-hook-form';
import axios from 'axios';
import { BackendAPI } from '../../api';
import SweetAlert from 'sweetalert2';
import { Breadcrumbs } from '../../AbstractElements';
import { useNavigate } from 'react-router-dom';
import Select from 'react-select';
import { MdDelete, MdInfoOutline } from "react-icons/md";
import { Field, Form } from 'react-final-form';
import { required, option, fieldname } from '../Utils/validationUtils';
import debounce from 'lodash.debounce';
import useAuth from '../../Auth/protectedAuth';
import { getToken } from '../../Auth/Auth';
import { toast } from 'react-toastify';
import GrapesEditor from '../GrapesEditor/GrapesEditor';
import styled from 'styled-components';
import { PermissionsContext } from '../../contexts/PermissionsContext';
const composeValidators = (...validators) => value =>
    validators.reduce((error, validator) => error || validator(value), undefined);

const RedAsterisk = styled.span`
  color: red;
`;


const AddLocation = () => {
    useAuth();
    const [isChecked, setIsChecked] = useState([]); // Initialize isChecked state
    const [files, setFiles] = useState({ exhIcon: '', darkModeIcon: '' });
    const [data, setData] = useState([]);
    const [exh, setExh] = useState([]);
    const [icon, setIcon] = useState([]);
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [modal, setModal] = useState(false);
    const { register, handleSubmit, formState: { errors } } = useForm();
    const [selectedImage, setSelectedImage] = useState(null);
    const [imageError, setImageError] = useState('');
    const [name, setName] = useState('');
    const [nameValidationMessage, setNameValidationMessage] = useState('');
    const [nameTouched, setNameTouched] = useState(false);
    const [mode, setMode] = useState([]);
    const [formDataToSend, setFormDataToSend] = useState(null);
    const [showGrapesEditor, setShowGrapesEditor] = useState(false);
    const [exhType, setExhType] = useState([]); // State variable to track selected page type
    const { permissions } = useContext(PermissionsContext);

    console.log("EXH:", exh);
    console.log("ICON:", icon);


    useEffect(() => {
        fetchExhibitor(); // Corrected function name
    }, [permissions]);

    // Extract Locations component
    const LocationsPermissions = permissions['ManageLocation'];

    const fetchExhibitor = async () => {
        try {
            const token = getToken();
            const response = await axios.get(`${BackendAPI}/Location/getExhibitor`, {
                headers: {
                    Authorization: `Bearer ${token}` // Include the token in the Authorization header
                }
            });

            setData(response.data);
            setExh(response.data.exhData);
            setIcon(response.data.iconData);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching facility types:', error);
            setLoading(false);
        }
    };




    const handleCancel = () => {
        setModal(true);
    };

    const onSubmit = async (values) => {
        const exhType = values.eType ? values.eType.label : ''; // Ensure correct access to the selected value
        const exhTypeid = values.eType ? values.eType.value : ''; // Ensure correct access to the selected value
        const iconType = values.iType ? values.iType.value : ''; // Ensure correct access to the selected value


        const formData = {
            ...values,
            eType: exhType,
            eTypeid: exhTypeid,
            iType: iconType
        };

        try {

            console.log("Data to send", formData);

            // Uncomment for actual API submission  
            const token = getToken();

            const response = await axios.post(`${BackendAPI}/Location/storeLocation`, formData, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            SweetAlert.fire({
                title: 'Success!',
                text: 'Location created successfully!',
                icon: 'success',
                timer: 3000,
                showConfirmButton: false,
                allowOutsideClick: false,
                allowEscapeKey: false
            }).then((result) => {
                if (result.dismiss === SweetAlert.DismissReason.timer) {
                    setShowGrapesEditor(false);
                    navigate(`${process.env.PUBLIC_URL}/event/manage-Location/Consoft`);
                }
            });

        } catch (error) {
            console.error('Error creating page:', error.message);
        }
    };





    const validatename = debounce(async (value) => {
        try {
            // Call the API to check name availability
            const token = getToken();
            const response = await axios.post(`${BackendAPI}/Location/check-location-name`, { lName: value }, {
                headers: {
                    Authorization: `Bearer ${token}` // Include the token in the Authorization header
                }
            });

            console.log('Server response:', response);
            if (!response.data.available) {
                setNameValidationMessage('Location name already exists');
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
        navigate(`${process.env.PUBLIC_URL}/event/manage-Location/Consoft`);
    };

    if (showGrapesEditor) {
        return <GrapesEditor formDataToSend={formDataToSend} navigate={navigate} />;
    }


    const exhOptions = exh.map(exhItem => ({
        value: exhItem.exh_id,
        label: exhItem.exh_name
    }));

    const iconOptions = icon.map(iconItem => ({
        value: iconItem.loc_icon_id,
        label: iconItem.loc_icon_name
    }));

    return (
        <Fragment>
            <Breadcrumbs parentClickHandler={handleNavigation} mainTitle={
                <>
                    Create Location
                    <MdInfoOutline
                        id="hallPopover"
                        style={{
                            cursor: 'pointer', position: 'absolute', marginLeft: '5px'
                        }}
                    />
                    <UncontrolledPopover
                        placement="bottom"
                        target="hallPopover"
                        trigger="focus"
                    >
                        <PopoverBody>
                            Create locations for stalls and sponsors at your event and link them to the floor map.
                            Provide a name for each location, choose the relevant exhibitor, and select the icon type to be displayed on the floor map.
                        </PopoverBody>
                    </UncontrolledPopover>
                </>
            } parent="Manage Location" title="Create Location" />
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
                                                        name="lName"
                                                        validate={composeValidators(required, fieldname)}
                                                    >
                                                        {({ input, meta }) => (
                                                            <div>
                                                                <Label className='form-label' for="locname"><strong>Location Name <span className="red-asterisk">*</span></strong></Label>
                                                                <input
                                                                    {...input}
                                                                    className="form-control"
                                                                    id="locname"
                                                                    type="text"
                                                                    placeholder="Enter location name"
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
                                            <Row>
                                                <Col md="4" className="mb-3">
                                                    <Field
                                                        name="eType"
                                                        validate={option}
                                                    >
                                                        {({ input, meta }) => (
                                                            <div>
                                                                <Label className='form-label' for="eventday"><strong>Select Exhibitor <span className="red-asterisk">*</span></strong></Label>
                                                                <Select
                                                                    {...input}
                                                                    options={exhOptions}
                                                                    placeholder="Select Exhibitor"
                                                                    isSearchable={true}
                                                                    onChange={(value) => {
                                                                        input.onChange(value);
                                                                        // setExhType(value); // Update state based on selection
                                                                    }}
                                                                    onBlur={input.onBlur}
                                                                    classNamePrefix="react-select"
                                                                    isMulti={false}
                                                                    value={input.value}
                                                                />
                                                                {meta.error && meta.touched && <p className='d-block text-danger'>{meta.error}</p>}
                                                            </div>
                                                        )}
                                                    </Field>
                                                </Col>
                                            </Row>

                                            <Row>
                                                <Col md="4" className="mb-3">
                                                    <Field
                                                        name="iType"
                                                        validate={option}
                                                    >
                                                        {({ input, meta }) => (
                                                            <div>
                                                                <Label className='form-label' for="eventday"><strong>Select Icon Type <span className="red-asterisk">*</span></strong></Label>
                                                                <Select
                                                                    {...input}
                                                                    options={iconOptions}
                                                                    placeholder="Select Icon Type"
                                                                    isSearchable={true}
                                                                    onChange={(value) => {
                                                                        input.onChange(value);
                                                                    }}
                                                                    onBlur={input.onBlur}
                                                                    classNamePrefix="react-select"
                                                                    isMulti={false}
                                                                    value={input.value}
                                                                />
                                                                {meta.error && meta.touched && <p className='d-block text-danger'>{meta.error}</p>}
                                                            </div>
                                                        )}
                                                    </Field>
                                                </Col>



                                            </Row>

                                            <small>Note:- The location icon is used in maps to indicate and locate your current position of event floor</small>



                                            {LocationsPermissions?.add === 1 && (
                                                <div className="d-flex justify-content-between mt-3">
                                                    <div>

                                                        <Button color='primary' type='submit' className="me-2">Create Location</Button>
                                                        <Button color='warning' onClick={handleCancel}>Cancel</Button>

                                                    </div>

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
                    {/* <Link to="/manage-facility/Consoft" className="btn btn-warning">Yes</Link> */}
                    <Button color="primary" onClick={() => setModal(!modal)}>No</Button>
                </ModalFooter>
            </Modal>
        </Fragment>
    );
};

export default AddLocation;