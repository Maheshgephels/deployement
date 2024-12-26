import React, { Fragment, useState, useEffect, useContext } from 'react';
import { Container, Row, Col, Button, Card, CardBody, Modal, ModalHeader, ModalBody, ModalFooter, Label } from 'reactstrap';
import { useForm } from 'react-hook-form';
import axios from 'axios';
import { BackendAPI } from '../../api';
import SweetAlert from 'sweetalert2';
import { Breadcrumbs } from '../../AbstractElements';
import { useNavigate, useLocation } from 'react-router-dom';
import { required, FacName, Img, Wname, email, Contact, fieldname } from '../Utils/validationUtils';
import Select from 'react-select';
import { Field, Form } from 'react-final-form';
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

const EditLocation = () => {
    useAuth();
    const [isChecked, setIsChecked] = useState([]);
    const [files, setFiles] = useState({ exhIcon: '', darkModeIcon: '' });
    const [data, setData] = useState([]);
    const [exh, setExh] = useState([]);
    const [icon, setIcon] = useState([]);
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [modal, setModal] = useState(false);
    const [selectedImage, setSelectedImage] = useState(null);
    const [imageError, setImageError] = useState('');
    const [name, setName] = useState('');
    const [nameValidationMessage, setNameValidationMessage] = useState('');
    const [nameTouched, setNameTouched] = useState(false);
    const [mode, setMode] = useState([]);
    const [formDataToSend, setFormDataToSend] = useState(null);
    const [showGrapesEditor, setShowGrapesEditor] = useState(false);
    const [type, setType] = useState('');
    const [iconType, setIconType] = useState([]);
    const location = useLocation();
    const { item } = location.state;
    const [initialData, setInitialData] = useState({});
    const { permissions } = useContext(PermissionsContext);

    console.log("DAta:", item);

    console.log("Exh:", exh);


    useEffect(() => {
        setInitialData({
            lName: item.location_name,
            eType: item.exh_type,
            eTypeid: item.exh_type_id,
            iType: item.shape_type
        });
    }, [item, permissions]);

       // Extract Locations component
       const LocationsPermissions = permissions['ManageLocation'];

    useEffect(() => {
        fetchExhibitor();
    }, []);

    const fetchExhibitor = async () => {
        try {
            const token = getToken();
            const response = await axios.get(`${BackendAPI}/Location/getExhibitor`, {
                headers: {
                    Authorization: `Bearer ${token}`
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

    // const onSubmit = async (values) => {
    //     const exhType = values.eType ? values.eType.label : '';
    //     const exhTypeid = values.eType ? values.eType.value : '';
    //     const iconType = values.iType ? values.iType.value : '';

    //     const formData = {
    //         ...values,
    //         eType: exhType,
    //         eTypeid: exhTypeid,
    //         iType: iconType
    //     };

    //     // Compare current values with initial data
    //     const updatedFields = {};
    //     Object.keys(values).forEach(key => {
    //         if (values[key] !== initialData[key]) {
    //             updatedFields[key] = values[key];
    //         }
    //     });

    //     console.log("Form:", formData);

    //     try {
    //         const token = getToken();
    //         const response = await axios.post(`${BackendAPI}/Location/storebLocation`, formData, {
    //             headers: {
    //                 Authorization: `Bearer ${token}`
    //             }
    //         });

    //         SweetAlert.fire({
    //             title: 'Success!',
    //             text: 'Location created successfully!',
    //             icon: 'success',
    //             timer: 3000,
    //             showConfirmButton: false,
    //             allowOutsideClick: false,
    //             allowEscapeKey: false
    //         }).then((result) => {
    //             if (result.dismiss === SweetAlert.DismissReason.timer) {
    //                 setShowGrapesEditor(false);
    //                 navigate(`${process.env.PUBLIC_URL}/event/manage-Location/Consoft`);
    //             }
    //         });

    //     } catch (error) {
    //         console.error('Error creating page:', error.message);
    //     }
    // };

    // Example of updated `onSubmit` function
const onSubmit = async (values) => {
    if (nameValidationMessage) {
        return; // Prevent form submission if there is a validation error
    }

    const id = item.id;


    const formData = {
        ...values,
        id: id,
        eType: type,
    };

    // Compare current values with initial data
    const updatedFields = {};
    Object.keys(formData).forEach(key => {
        if (formData[key] !== initialData[key]) {
            updatedFields[key] = formData[key];
        }
    });

    console.log("Updated Data:", formData); // Log only updated fields

    try {
        const token = getToken();
        const response = await axios.post(`${BackendAPI}/Location/updateLocation`, updatedFields, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });

        SweetAlert.fire({
            title: 'Success!',
            text: 'Location updated successfully!',
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
        console.error('Error updating location:', error.message);
    }
};

const validatename = debounce(async (value) => {
    try {

        if (value === item.location_name) {
            // Skip validation if the name is the same as the current name
            setNameValidationMessage('');
            return;
        }

        // Call the API to check name availability
        const token = getToken();
        const response = await axios.post(`${BackendAPI}/Location/check-location-name`, { lName: value }, {
            headers: {
                Authorization: `Bearer ${token}` // Include the token in the Authorization header
            }
        });

        console.log('Server response:', response);
        if (!response.data.available) {
            setNameValidationMessage('Page name already exists');
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
        if (nameTouched) {
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
            <Breadcrumbs parentClickHandler={handleNavigation} mainTitle="Edit Location" parent="Manage Location" title="Create Location" />
            <Container fluid={true}>
                <Row>
                    <Col sm="12">
                        <Card>
                            <CardBody>
                                <Form onSubmit={onSubmit} initialValues={initialData}>
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
                                                                        input.onChange(e);
                                                                        setName(e.target.value);
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
                                                        name="eTypeid"
                                                        validate={required}
                                                        // initialValue={item.exh_type_id}
                                                    >
                                                        {({ input, meta }) => {
                                                            const selectedOption = exhOptions.find(option => option.value === input.value) || null;

                                                            return (
                                                                <div>
                                                                    <Label className='form-label' for="eventday">
                                                                        <strong>Select Exhibitor <span className="red-asterisk">*</span></strong>
                                                                    </Label>
                                                                    <Select
                                                                        {...input}
                                                                        options={exhOptions}
                                                                        placeholder="Select Exhibitor"
                                                                        isSearchable={true}
                                                                        onChange={(option) => {
                                                                            input.onChange(option.value);
                                                                            setType(option.label)
                                                                        }}
                                                                        onBlur={input.onBlur}
                                                                        classNamePrefix="react-select"
                                                                        value={selectedOption}                                                                    />
                                                                    {meta.error && meta.touched && <p className='d-block text-danger'>{meta.error}</p>}
                                                                </div>
                                                            );
                                                        }}
                                                    </Field>
                                                </Col>
                                                
                                            </Row>

                                            <Row>
                                                <Col md="4" className="mb-3">
                                                    <Field
                                                        name="iType"
                                                        validate={required}
                                                        initialValue={item.shape_type}
                                                    >
                                                        {({ input, meta }) => {
                                                            const selectedOption = iconOptions.find(option => option.value === input.value) || null;

                                                            return (
                                                                <div>
                                                                    <Label className='form-label' for="eventday"><strong>Select Icon Type <span className="red-asterisk">*</span></strong></Label>
                                                                    <Select
                                                                        {...input}
                                                                        options={iconOptions}
                                                                        placeholder="Select Icon Type"
                                                                        isSearchable={true}
                                                                        onChange={(value) => {
                                                                            input.onChange(value.value);
                                                                        }}
                                                                        onBlur={input.onBlur}
                                                                        classNamePrefix="react-select"
                                                                        value={selectedOption}
                                                                    />
                                                                    {meta.error && meta.touched && <p className='d-block text-danger'>{meta.error}</p>}
                                                                </div>
                                                            );
                                                        }}
                                                    </Field>
                                                </Col>
                                            </Row>

                                            <small>Note:- The location icon is used in maps to indicate and locate your current position of event floor</small>

                                            {LocationsPermissions?.edit === 1 && (
                                            <div className="d-flex justify-content-between mt-3">
                                                <div>
                                                    <Button color='primary' type='submit' className="me-2">Update</Button>
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
                    <p>Your changes will be discarded. Are you sure you want to cancel?</p>
                </ModalBody>
                <ModalFooter>
                    <Button onClick={handleNavigation} color='warning'>Yes</Button>
                    <Button color="primary" onClick={() => setModal(!modal)}>No</Button>
                </ModalFooter>
            </Modal>
        </Fragment>
    );
};

export default EditLocation;


