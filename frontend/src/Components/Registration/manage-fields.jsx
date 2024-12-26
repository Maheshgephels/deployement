import React, { useState, useEffect, Fragment, useContext } from 'react';
import axios from 'axios';
import { Breadcrumbs } from '../../AbstractElements';
import { BackendAPI } from '../../api';
import {
    Row, Col, Card, input, Label, CardBody, CardHeader, Button, Modal, ModalHeader, ModalBody, ModalFooter,
    TabContent, TabPane, Nav, NavItem, NavLink, CardText, CardTitle,
    Dropdown, Popover, PopoverBody, UncontrolledPopover
} from 'reactstrap';
import { FaAngleDoubleLeft, FaEdit, FaAngleDoubleRight, FaLock, FaUnlock, FaAngleDoubleUp, FaAngleDoubleDown } from "react-icons/fa";
import { MdDelete, MdInfoOutline } from "react-icons/md";
import Draggable from 'react-draggable';
import SweetAlert from 'sweetalert2';
import { Tooltip } from 'react-tooltip';
import { ToastContainer, toast } from "react-toastify";
import Select from 'react-select';
import CreatableSelect from 'react-select/creatable';
import { Link, useNavigate } from 'react-router-dom';
import { Field, Form } from 'react-final-form';
import debounce from 'lodash.debounce';
import { PermissionsContext } from '../../contexts/PermissionsContext';
import { required, email, Name, Img, PDF, fieldname } from '../Utils/validationUtils';
import { getToken } from '../../Auth/Auth';
import useAuth from '../../Auth/protectedAuth';
import { Tooltip as Tippy } from 'react-tooltip';
// Define the required validator
const requiredValidator = value => (value ? undefined : 'This field is required');

// Utility function to combine multiple validation functions
const composeValidators = (...validators) => value =>
    validators.reduce((error, validator) => error || validator(value), undefined);

const RegFields = () => {
    useAuth();
    const [data, setData] = useState([]);
    const navigate = useNavigate(); // Initialize useHistory
    const [basicFields, setBasicFields] = useState([]);
    const [formFields, setFormFields] = useState([]);
    const [typeData, setTypeData] = useState([]);
    const [dropdownData, setDropdownData] = useState([]);
    const [newdropdownData, setNewdropdownData] = useState([]);
    const [originalOrder, setOriginalOrder] = useState([]);
    const [selectedItem, setSelectedItem] = useState();
    const [modalOpen, setModalOpen] = useState(false);
    const [removeModalOpen, setremoveModalOpen] = useState(false);
    const [alertModalOpen, setalertModalOpen] = useState(false);
    const [editedLabel, setEditedLabel] = useState('');
    const [addUserVisible, setAddUserVisible] = useState(true);
    const [required, setRequired] = useState(true);
    const [addSpotVisible, setAddSpotVisible] = useState(true);
    const [addBasic, setAddbasic] = useState(true);
    const [addConfirm, setAddconfirm] = useState(true);
    const [addUserpan, setAdduserpan] = useState(true);
    const [addAdminpan, setAddadminpan] = useState(true);


    const [activeTab, setActiveTab] = useState('basic_field');
    const [createCustomModalOpen, setCreateCustomModalOpen] = useState(false);
    // const [isLocked, setIsLocked] = useState(() => {
    //     // Initialize the locked state from localStorage or default to false
    //     const storedLockState = localStorage.getItem('isLocked');
    //     return storedLockState ? JSON.parse(storedLockState) : false;
    // });
    const [isLocked, setIsLocked] = useState(false); // Default state for lock status

    const [optionsName, setoptionsName] = useState('');
    const [options, setoptions] = useState([]);
    const [selectedFieldType, setSelectedFieldType] = useState(null);
    const { permissions } = useContext(PermissionsContext);
    const [name, setName] = useState('');
    const [nameValidationMessage, setNameValidationMessage] = useState('');
    const [nameTouched, setNameTouched] = useState(false);

    const [optionId, setoptionId] = useState([]);
    const [optionVal, setoptionVal] = useState([]);

    const [optionData, setOptionData] = useState([]);
    const [deletedOptionIds, setDeletedOptionIds] = useState([]);

    const [popoverOpen, setPopoverOpen] = useState(false);
    const [customPopover, setCustomPopover] = useState(false);
    const togglePopover = () => setPopoverOpen(!popoverOpen);
    const toggleCustomPopover = () => setCustomPopover(!customPopover);


    // console.log("Basic fields:", basicFields);


    // console.log("OptionID:", optionId);
    console.log("optionData:", optionData);
    // console.log("deletedOptionIds:", deletedOptionIds);

    console.log("Form fields:", formFields);
    console.log("Selection:", selectedItem);
    console.log("Dropdown:", dropdownData);
    console.log("Additional Dropdown:", newdropdownData);






    // console.log(basicFields);
    console.log(formFields);
    // console.log(addSpotVisible);

    console.log("Lock:", isLocked);
    console.log("Dropdown:", dropdownData);




    const handleChange = (e) => {
        const newValue = e.target.value;
        setoptionsName(newValue);
        console.log("optionsName:", newValue);
    };

    const handleAddOptions = () => {
        if (optionsName.trim() !== '') {
            setoptions([...options, optionsName]);
            setoptionsName('');
        }
    };

    const handleEditOptions = (index, newName) => {
        const updatedoptions = [...options];
        updatedoptions[index] = newName;
        setoptions(updatedoptions);
    };

    const handleRemoveOptions = (index) => {
        const updatedoptions = [...options];
        updatedoptions.splice(index, 1);
        setoptions(updatedoptions);
    };

    useEffect(() => {
        // Update localStorage when isLocked state changes
        localStorage.setItem('isLocked', JSON.stringify(isLocked));
    }, [isLocked, permissions]);




    // Extract Fields component
    const RegFieldspermissions = permissions['RegFields'];
    // console.log('categoryPermissions', categoryPermissions);


    useEffect(() => {
        fetchFields();
        fetchFormFields();
        fetchData();
        fetchLockStatus();
    }, []);


    const fetchFields = async () => {
        try {
            const token = getToken();
            const response = await axios.get(`${BackendAPI}/regfield/getBasicFields`, {
                headers: {
                    Authorization: `Bearer ${token}` // Include the token in the Authorization header
                }
            });

            setData(response.data.Fields);

            const fieldData = response.data.Fields.map(item => ({
                id: item.cs_field_id,
                label: item.cs_field_label,
                type: item.cs_iscustom,
                name: item.cs_field_name
            }));

            const fieldLabels = fieldData.map(item => item.label);
            setBasicFields(fieldData);
            setOriginalOrder(fieldLabels.slice());
        } catch (error) {
            console.error('Error fetching fields:', error);
        }
    };

    const fetchFormFields = async () => {
        try {
            const token = getToken();
            const response = await axios.get(`${BackendAPI}/regfield/getFormfield`, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
            const fieldData = response.data.Fields.map(item => ({
                id: item.cs_field_id,
                label: item.cs_field_label,
                required: item.cs_is_required === '1',
                onspot: item.cs_visible_onspot === '1',
                userpan: item.cs_visible_reg_userform === '1',
                basic: item.cs_visible_reg_basicform === '1',
                dropdown: item.cs_field_type,
                custom: item.cs_iscustom

            }));
            setFormFields(fieldData);
        } catch (error) {
            console.error('Error fetching form fields:', error);
        }
    };

    // const fetchTypes = async () => {
    //     try {
    //         const token = getToken();
    //         const response = await axios.get(`${BackendAPI}/regfield/getTypes`, {
    //             headers: {
    //                 Authorization: `Bearer ${token}` // Include the token in the Authorization header
    //             }
    //         });
    //         const typeData = response.data.Types.map(item => ({
    //             id: item.cs_field_type,
    //             type: item.field_type_name
    //         }));
    //         setTypeData(typeData);
    //     } catch (error) {
    //         console.error('Error fetching types:', error);
    //     }
    // };

    const fetchData = async () => {
        try {
            const token = getToken();
            const response = await axios.get(`${BackendAPI}/regfield/getData`, {
                headers: {
                    Authorization: `Bearer ${token}` // Include the token in the Authorization header
                }
            });
            const dropdownData = response.data.Dropdowndata.map(item => ({
                option_id: item.cs_field_option_id,
                name: item.cs_field_option,
                field_id: item.cs_field_id
            }));
            setDropdownData(dropdownData);

            const typeData = response.data.Types.map(item => ({
                id: item.cs_field_type,
                type: item.field_type_name
            }));
            setTypeData(typeData);
        } catch (error) {
            console.error('Error fetching types:', error);
        }
    };



    const handleMoveItem = async (item, value) => {
        try {
            const token = getToken();
            const response = await axios.post(`${BackendAPI}/regfield/updateFlag`, { item: item.label, val: value }, {
                headers: {
                    Authorization: `Bearer ${token}` // Include the token in the Authorization header
                }
            });
            fetchFields();
            fetchFormFields();
        } catch (error) {
            console.error('Error updating flag:', error);
        }
    };

    const handleRemoveItem = async (item, value) => {
        try {
            const token = getToken();
            const response = await axios.post(`${BackendAPI}/regfield/updateFlag`, { item: item.label, val: value }, {
                headers: {
                    Authorization: `Bearer ${token}` // Include the token in the Authorization header
                }
            });
            fetchFields();
            fetchFormFields();
        } catch (error) {
            console.error('Error updating flag:', error);
        }
    };

    const handleUpItem = async (item) => {
        try {
            const token = getToken();
            const response = await axios.post(`${BackendAPI}/regfield/moveup`, { item: item.id }, {
                headers: {
                    Authorization: `Bearer ${token}` // Include the token in the Authorization header
                }
            });

            // Check the response status and show appropriate toast message
            if (response.status === 200) {
                toast('Field position reordered successfully!');
            } else if (response.status === 202 && response.data.error) {
                toast('Already at the top position !'); // Show the error message from the server
            } else {
                toast('Unexpected response from the server.');
            }

            // Fetch updated fields after moving up
            fetchFormFields();
        } catch (error) {
            // Show a generic error message in case of failure
            toast('Already at the top position !');
        }
    };


    const handleDownItem = async (item) => {
        try {
            const token = getToken();
            const response = await axios.post(`${BackendAPI}/regfield/movedown`, { item: item.id }, {
                headers: {
                    Authorization: `Bearer ${token}` // Include the token in the Authorization header
                }
            });

            // Check the response status and show appropriate toast message
            if (response.status === 200) {
                toast('Field position reordered successfully!');
            } else if (response.status === 202 && response.data.error) {
                toast('Already at the bottom position !'); // Show the error message from the server
            } else {
                toast('Unexpected response from the server.');
            }

            // Fetch updated fields after moving up
            fetchFormFields();
        } catch (error) {
            console.error('Error updating flag:', error);
        }
    };

    const handleEditLabel = (item) => {
        console.log("EDIT", item);
        setSelectedItem(item);
        setEditedLabel(item.label);
        setRequired(item.required);
        setAddSpotVisible(item.onspot);
        setAddbasic(item.basic);
        setAdduserpan(item.userpan)
        setModalOpen(true);
    };



    const handleDeleteCustomField = (item) => {
        setSelectedItem(item);
        setremoveModalOpen(true);
    };

    const closeRemoveModal = () => {
        setremoveModalOpen(!removeModalOpen);
    };



    const removeField = async () => {
        try {
            const token = getToken();
            const response = await axios.post(`${BackendAPI}/regfield/deletefield`, {
                id: selectedItem.id,
                custom_label: selectedItem.label,
                custom_field: selectedItem.name
            }, {
                headers: {
                    Authorization: `Bearer ${token}` // Include the token in the Authorization header
                }
            });
            if (response.status === 200) {
                setCreateCustomModalOpen(false);

                // Show SweetAlert upon successful response
                SweetAlert.fire({
                    title: 'Success!',
                    text: 'Cutom Field removed successfully!',
                    icon: 'success',
                    timer: 3000,
                    showConfirmButton: false,
                    allowOutsideClick: false,
                    allowEscapeKey: false
                }).then(() => {
                    fetchFields();
                    fetchFormFields();
                    // After the alert is closed, navigate to the desired location
                    // navigate("/Fields/Consoft");
                });
            } else {
                console.error('Error:', response.status); // Log the error status if not 200
            }

        } catch (error) {
            console.error('Error updating field:', error);
        }
        setremoveModalOpen(false);
    };

    const toggleModal = () => {
        setModalOpen(!modalOpen);
    };

    const updateLabel = async () => {
        if (selectedItem) {
            try {
                const token = getToken();
                const data = {
                    id: selectedItem.id,
                    label: editedLabel,
                    option_id: optionId,
                    option_value: optionVal,
                    option_data: optionData,
                    deletedOptionIds: deletedOptionIds,
                    required: required ? "1" : "0",
                    onspot: addSpotVisible ? "1" : "0",
                    basic: addBasic ? "1" : "0",
                    userpan: addUserpan ? "1" : "0",
                    new_option: newdropdownData
                };

                // Log data being sent to backend
                console.log('Data sent to backend:', data);

                await axios.post(`${BackendAPI}/regfield/editfield`, data, {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                });
                setOptionData([]);
                setDeletedOptionIds([]);
                setNewdropdownData([]);
                toast('Field updated successfully!');
                setModalOpen(false);
                fetchFormFields();
                fetchData();
            } catch (error) {
                console.error('Error updating field:', error);
                toast('Error updating field!');
            }
        }
    };


    const toggleTab = (tab) => {
        if (activeTab !== tab) {
            setActiveTab(tab);
        }
    };

    const toggleCreateCustomModal = () => {
        setSelectedFieldType(null);
        setCreateCustomModalOpen(!createCustomModalOpen);


    };

    const Lock_Unlock = () => {
        setalertModalOpen(!alertModalOpen);
    };


    const closealertModal = () => {
        setalertModalOpen(!alertModalOpen);
        setoptions(null);
        setoptionsName(null);
    };

    const fetchLockStatus = async () => {
        try {
            const token = getToken();
            const response = await axios.get(`${BackendAPI}/regfield/getLockStatus`, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            const lockData = response.data;
            console.log("Lock Data:", lockData); // Log lockData to inspect its structure

            // Assuming lockData.Lock is an array of locks
            const isLocked = lockData.Lock.some(lock => lock.cs_value === '1');
            setIsLocked(isLocked);
        } catch (error) {
            console.error('Error fetching lock status:', error);
            // Handle error fetching status (e.g., show a message)
        }
    };


    const toggleLock = async () => {
        try {
            const newLockStatus = !isLocked ? 1 : 0; // Toggle lock status
            const token = getToken();

            // Example of updating lock status on the server
            const response = await axios.post(`${BackendAPI}/regfield/updateLockStatus`, { cs_value: newLockStatus }, {
                headers: {
                    Authorization: `Bearer ${token}` // Include the token in the Authorization header
                }
            });

            // Update local state based on server response
            setIsLocked(!isLocked);
            setalertModalOpen(false);

        } catch (error) {
            console.error('Error toggling lock status:', error);
            // Handle error toggling lock (e.g., show a message)
        }
    };





    // const toggleLock = () => {
    //     setIsLocked(!isLocked);
    //     setalertModalOpen(false);

    // };

    const handleSubmit = async (formValues) => {
        // Extract the value of FieldType from formValues.fieldType
        const FieldType = formValues.fieldType.value;

        // Append FieldType to formValues
        const updatedFormValues = {
            ...formValues,
            FieldType: FieldType,
            options: options
        };

        console.log('Form values:', updatedFormValues); // Log updated form values

        // Add your Axios request to send form data to the backend
        try {
            const token = getToken();
            const response = await axios.post(`${BackendAPI}/regfield/CreateCustomField`, updatedFormValues, {
                headers: {
                    Authorization: `Bearer ${token}` // Include the token in the Authorization header
                }
            });
            // Check if the response status is 200 (OK)
            if (response.status === 200) {
                fetchData();
                setCreateCustomModalOpen(false);
                setoptions([]);
                setSelectedFieldType(null);

                // Show SweetAlert upon successful response
                SweetAlert.fire({
                    title: 'Success!',
                    text: 'Custom Field Created successfully!',
                    icon: 'success',
                    timer: 3000,
                    showConfirmButton: false,
                    allowOutsideClick: false,
                    allowEscapeKey: false
                }).then(() => {
                    fetchFields();
                    fetchFormFields();
                    // After the alert is closed, navigate to the desired location
                    // navigate("/Fields/Consoft");
                });
            } else {
                console.error('Error:', response.status); // Log the error status if not 200
            }
        } catch (error) {
            console.error('Error sending data to backend:', error);
        }
    };

    const isItemInFormFields = (item) => {
        return formFields.some((formItem) => formItem.id === item.id);
    };

    const validatename = debounce(async (value) => {
        try {

            // if (value === roleName) {
            //     // Skip validation if the name is the same as the current name
            //     setNameValidationMessage('');
            //     return;
            // }

            // Call the API to check name availability
            const token = getToken();
            const response = await axios.post(`${BackendAPI}/regfield/check-field-name`, { customLabel: value }, {
                headers: {
                    Authorization: `Bearer ${token}` // Include the token in the Authorization header
                }
            });

            console.log('Server response:', response);
            if (!response.data.available) {
                setNameValidationMessage('Field already exists');
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


    const handleNameChange = (optionId, newName) => {
        const index = dropdownData.findIndex(item => item.option_id === optionId);
        if (index !== -1) {
            // Update the dropdownData state with the new name
            const updatedDropdownData = [...dropdownData];
            updatedDropdownData[index] = { ...updatedDropdownData[index], name: newName };
            setDropdownData(updatedDropdownData);

            // Check if the option is in newdropdownData, if yes, update it there too
            const isNewOption = newdropdownData.some(item => item.option_id === optionId);
            if (isNewOption) {
                // Update the name in newdropdownData
                const updatedNewDropdownData = newdropdownData.map(item =>
                    item.option_id === optionId ? { ...item, name: newName } : item
                );
                setNewdropdownData(updatedNewDropdownData);
            }

            // Update optionData as before
            const newOptionData = [...optionData];
            const optionIndex = newOptionData.findIndex(data => data.optionId === optionId);
            if (optionIndex !== -1) {
                newOptionData[optionIndex] = { optionId, optionVal: newName };
            } else {
                newOptionData.push({ optionId, optionVal: newName });
            }
            setOptionData(newOptionData);
        }
    };



    const handleDeleteOption = (optionId) => {
        // Filter out the dropdown option with the specified optionId
        const updatedDropdownData = dropdownData.filter(item => item.option_id !== optionId);

        // Update the state with the modified dropdownData
        setDropdownData(updatedDropdownData);

        // Update newdropdownData to remove the deleted option
        const updatedNewDropdownData = newdropdownData.filter(item => item.option_id !== optionId);
        setNewdropdownData(updatedNewDropdownData);

        // Update the state for deleted optionIds
        setDeletedOptionIds(prev => [...prev, optionId]);
    };


    const handleAddOption = () => {
        const maxOptionId = dropdownData.length > 0
            ? Math.max(...dropdownData.map(item => item.option_id))
            : 0;

        const newOption = {
            option_id: maxOptionId + 1,
            name: 'New Option',
            field_id: selectedItem.id
        };

        console.log("New Option", newOption);

        // Update dropdownData
        setDropdownData(prevDropdownData => [...prevDropdownData, newOption]);

        // Update newdropdownData with only new options
        setNewdropdownData(prevNewDropdownData => [...prevNewDropdownData, newOption]);
    };





    return (
        <Fragment>
            {/* <Breadcrumbs mainTitle="Manage Registration form" parent="Onsite App" title="Manage Registration form" /> */}
            <Breadcrumbs
                mainTitle={
                    <>
                        Manage Registration form
                        <MdInfoOutline
                            id="infoPopover"
                            style={{
                                cursor: 'pointer', position: 'absolute', marginLeft: '5px'
                            }}
                        />
                        <UncontrolledPopover
                            placement="bottom"
                            target="infoPopover"
                            trigger="focus"
                        >
                            <PopoverBody>
                                From here you can set up the registration form fields for on-spot registration and the admin panel.
                                You can add or remove form fields, make them mandatory or optional, and set their order as needed.
                                <br />
                                The same changes will be displayed in the On-spot registration form and the Admin registration form.
                                <br /><br />
                                The fields <strong>First Name</strong>, <strong>Last Name</strong>, and <strong>Registration Category</strong> are required and will always be included in the registration form.
                            </PopoverBody>
                        </UncontrolledPopover>
                    </>
                }
                parent="Registration Admin"
                title="Manage Registration form"
            />

            <Row>
                <Col md={7}>
                    <Card>
                        <CardHeader className="d-flex justify-content-between align-items-center flex-column flex-md-row">
                            <div>

                                <h2>Form View</h2>
                                <small className="form-text text-muted">
                                    Note: To make a field mandatory, click on the Edit Field button.
                                </small>
                            </div>

                            {RegFieldspermissions?.validate === 1 && (
                                <Button
                                    color={isLocked ? "danger" : "success"}
                                    onClick={Lock_Unlock}
                                    data-tooltip-id="tooltip"
                                    data-tooltip-content={isLocked ? "Unlock the registration form" : "Lock the registration form"}
                                    data-tooltip-event="click focus"
                                >
                                    {isLocked ? <><FaLock /> Unlock</> : <><FaUnlock /> Lock</>}
                                </Button>
                            )}
                        </CardHeader>
                        <CardBody>
                            <div className={`drop-box ${isLocked ? 'locked' : ''}`}>
                                {formFields.map((item, index) => (
                                    <Card className="field-card" color="primary" outline style={{ padding: '15px' }}>
                                        <CardBody style={{ padding: '15px', display: 'flex', alignItems: 'center' }}>
                                            <div style={{ flex: 1 }}>
                                                {item.label} {item.required && <span className="text-danger"> *</span>}
                                            </div>
                                            {RegFieldspermissions?.edit === 1 && (
                                                <div className="button-group">
                                                    {![3, 4, 9, 10, 7, 12, 24, 25, 26].includes(item.id) && (
                                                        <>
                                                            <Button
                                                                color="primary"
                                                                size="sm"
                                                                onClick={() => handleEditLabel(item)}
                                                                disabled={isLocked}
                                                                data-tooltip-id="tooltip"
                                                                data-tooltip-content="Edit Field"
                                                                data-tooltip-event="click focus"
                                                            >
                                                                <FaEdit />
                                                            </Button>
                                                            <Button
                                                                color="warning"
                                                                size="sm"
                                                                onClick={() => handleRemoveItem(item, 0)}
                                                                disabled={isLocked}
                                                                data-tooltip-id="tooltip"
                                                                data-tooltip-content="Click to remove"
                                                                data-tooltip-event="click focus"
                                                            >
                                                                <FaAngleDoubleRight />
                                                            </Button>
                                                        </>
                                                    )}


                                                    <Button
                                                        color="warning"
                                                        size="sm"
                                                        onClick={() => handleUpItem(item)}
                                                        disabled={isLocked}
                                                        data-tooltip-id="tooltip"
                                                        data-tooltip-content="Move Up"
                                                        data-tooltip-event="click focus"
                                                    >
                                                        <FaAngleDoubleUp />
                                                    </Button>
                                                    <Button
                                                        color="warning"
                                                        size="sm"
                                                        onClick={() => handleDownItem(item)}
                                                        disabled={isLocked}
                                                        data-tooltip-id="tooltip"
                                                        data-tooltip-content="Move Down"
                                                        data-tooltip-event="click focus"
                                                    >
                                                        <FaAngleDoubleDown />
                                                    </Button>
                                                </div>
                                            )}
                                        </CardBody>
                                    </Card>
                                ))}
                            </div>
                        </CardBody>
                    </Card>

                </Col>

                {RegFieldspermissions?.add === 1 && (
                    <Col md={5}>
                        <Card>
                            <CardHeader>
                                <Nav tabs>
                                    <NavItem>
                                        <NavLink className={activeTab === 'basic_field' ? 'active' : ''} onClick={() => toggleTab('basic_field')} disabled={isLocked}>
                                            Basic Fields
                                            <MdInfoOutline
                                                id="BasicPopover"
                                                style={{
                                                    cursor: 'pointer', marginLeft: '5px'
                                                }}
                                            />
                                            <UncontrolledPopover
                                                placement="bottom"
                                                target="BasicPopover"
                                                trigger="focus"
                                            >
                                                <PopoverBody>
                                                    Below are the basic fields, you can add in a form by clicking on yellow icon provided.
                                                </PopoverBody>
                                            </UncontrolledPopover>
                                        </NavLink>
                                    </NavItem>
                                    <NavItem>
                                        <NavLink className={activeTab === 'custom_field' ? 'active' : ''} onClick={() => toggleTab('custom_field')} disabled={isLocked}>
                                            Custom Fields
                                            <MdInfoOutline
                                                id="CustomPopover"
                                                style={{
                                                    cursor: 'pointer', marginLeft: '5px'
                                                }}
                                            />
                                            <UncontrolledPopover
                                                placement="bottom"
                                                target="CustomPopover"
                                                trigger="focus"
                                            >
                                                <PopoverBody>
                                                    Create new custom fields to add in Registration form. after creating custom field add it in Registration form.
                                                </PopoverBody>
                                            </UncontrolledPopover>
                                        </NavLink>
                                    </NavItem>
                                </Nav>
                            </CardHeader>
                            <CardBody>
                                <TabContent activeTab={activeTab}>
                                    <TabPane tabId="basic_field">
                                        <div className="fetched-data-list">
                                            {basicFields
                                                .filter(item => item.type === 0) // Filter basic fields where cs_iscustom is 0
                                                .map((item, index) => (
                                                    <Card key={index} className={`field-card ${isLocked ? 'locked' : ''}`}>
                                                        <CardBody style={{ padding: '15px', display: 'flex', alignItems: 'center' }}>
                                                            <div style={{ flex: 1 }}>{item.label}</div>
                                                            {item.label !== "First Name" && item.label !== "Last Name" && item.label !== "Registration Category" && (
                                                                <div className="button-group">
                                                                    <Tooltip id="tooltip" globalEventOff="click" />
                                                                    <Button
                                                                        color="warning"
                                                                        size="sm"
                                                                        onClick={() => handleMoveItem(item, 1)}
                                                                        disabled={isLocked || isItemInFormFields(item)}
                                                                        data-tooltip-id="tooltip"
                                                                        data-tooltip-content="Add in form"
                                                                        data-tooltip-event="click focus"
                                                                    >
                                                                        <FaAngleDoubleLeft />
                                                                    </Button>
                                                                </div>
                                                            )}
                                                        </CardBody>
                                                    </Card>
                                                ))}
                                        </div>
                                    </TabPane>

                                    <TabPane tabId="custom_field">
                                        <div className="mt-2 md-2">
                                            <Button color="warning" onClick={toggleCreateCustomModal} disabled={isLocked}>
                                                Create Custom Fields
                                            </Button>
                                        </div>
                                        <div className="fetched-data-list">
                                            {basicFields
                                                .filter(item => item.type === 1) // Filter custom fields where cs_iscustom is 1
                                                .map((item, index) => (
                                                    <Card key={index} className={`field-card ${isLocked ? 'locked' : ''}`}>
                                                        <CardBody style={{ padding: '15px', display: 'flex', alignItems: 'center' }}>
                                                            <div style={{ flex: 1 }}>{item.label}</div>
                                                            <div className="button-group">
                                                                <Tooltip id="tooltip" globalEventOff="click" />
                                                                <Button
                                                                    color="warning" size="sm"
                                                                    onClick={() => handleMoveItem(item, 1)}
                                                                    disabled={isLocked || isItemInFormFields(item)}
                                                                    data-tooltip-id="tooltip"
                                                                    data-tooltip-content="Add in form"
                                                                    data-tooltip-event="click focus"
                                                                >
                                                                    <FaAngleDoubleLeft />
                                                                </Button>
                                                                <Button
                                                                    color="danger" size="sm"
                                                                    onClick={() => handleDeleteCustomField(item, 0)}
                                                                    disabled={isLocked || isItemInFormFields(item)}
                                                                    data-tooltip-id="tooltip"
                                                                    data-tooltip-content="Delete Field"
                                                                    data-tooltip-event="click focus"
                                                                >
                                                                    <MdDelete />
                                                                </Button>
                                                            </div>
                                                        </CardBody>
                                                    </Card>
                                                ))}
                                        </div>
                                    </TabPane>

                                </TabContent>
                            </CardBody>
                        </Card>
                    </Col>
                )}
            </Row>


            {/* Modal for Editing fields */}
            <Modal isOpen={modalOpen} toggle={toggleModal}>
                <ModalHeader toggle={toggleModal}>
                    <div className="d-flex justify-content-between align-items-center w-100">
                        <span>Edit Field</span>
                        {/* {selectedItem && selectedItem.id >= 23 && selectedItem.dropdown === '5' && (

                            <Button color="primary" size="sm" onClick={handleAddOption} className="mt-0">
                                Add New Option
                            </Button>
                        )} */}
                    </div>

                </ModalHeader>
                <ModalBody>
                    <div className="mb-4">
                        <Label for="label">Field Label</Label>
                        <input
                            id="label"
                            type="text"
                            value={editedLabel}
                            onChange={(e) => setEditedLabel(e.target.value)}
                            className="form-control"
                        />
                    </div>
                    {selectedItem && selectedItem.dropdown !== '4' && (
                        <div className="form">
                            <input
                                id="adduser"
                                type="checkbox"
                                onChange={(e) => setRequired(e.target.checked)}
                                checked={required}
                            />
                            <Label className="form-check-label ms-2" htmlFor="adduser">
                                <strong>Field is required</strong>
                            </Label>
                        </div>
                    )}

                    {/* <div className="form">
                        <input
                            id="spot"
                            type="checkbox"
                            onChange={(e) => setAddSpotVisible(e.target.checked)}
                            checked={addSpotVisible}
                        />
                        <Label className="form-check-label ms-2" htmlFor="spot">
                            <strong>Visible in app registration form</strong>
                        </Label>
                    </div> */}
                    <div className="form">
                        <input
                            id="basic"
                            type="checkbox"
                            onChange={(e) => setAddbasic(e.target.checked)}
                            checked={addBasic}
                        />
                        <Label className="form-check-label ms-2" htmlFor="spot">
                            <strong>Add user in Basic Registration form</strong>
                        </Label>
                    </div>
                    <div className="form">
                        <input
                            id="userpan"
                            type="checkbox"
                            onChange={(e) => setAdduserpan(e.target.checked)}
                            checked={addUserpan}
                        />
                        <Label className="form-check-label ms-2" htmlFor="spot">
                            <strong>Show in User Panel</strong>
                        </Label>
                    </div>
                    {selectedItem && selectedItem.custom === 1 && selectedItem.dropdown === '5' && (
                        <Fragment>
                            <div className="d-flex flex-wrap justify-content-center">
                                {dropdownData && dropdownData.map(item => (
                                    item.field_id === selectedItem.id && (
                                        <Card key={item.option_id} className="mb-3" style={{ width: '200px', margin: '10px' }}>
                                            <CardBody className="d-flex align-items-center h-100 p-2">
                                                <input
                                                    type="text"
                                                    value={item.name}
                                                    onChange={(e) => handleNameChange(item.option_id, e.target.value)}
                                                    className="flex-grow-1 me-2"
                                                />
                                                <Button color="danger" size="sm" onClick={() => handleDeleteOption(item.option_id)}>
                                                    <MdDelete />
                                                </Button>
                                            </CardBody>
                                        </Card>
                                    )
                                ))}
                            </div>
                        </Fragment>
                    )}
                </ModalBody>
                <ModalFooter className="d-flex justify-content-between">
                    {selectedItem && selectedItem.custom === 1 && selectedItem.dropdown === '5' && (
                        <Button color="primary" onClick={handleAddOption}>
                            Add New Option
                        </Button>
                    )}
                    <div className="d-flex">
                        <Button color="primary" onClick={updateLabel} className="me-2">Update</Button>
                        <Button color="warning" onClick={toggleModal}>Cancel</Button>
                    </div>
                </ModalFooter>
            </Modal>

            {/* Modal for creating custom fields */}
            <Modal isOpen={createCustomModalOpen} toggle={toggleCreateCustomModal}>
                <ModalHeader toggle={toggleCreateCustomModal}>Create Custom Fields</ModalHeader>
                <ModalBody>
                    <Form onSubmit={handleSubmit}>
                        {({ handleSubmit }) => (
                            <form onSubmit={handleSubmit}>
                                <Label className='form-label' htmlFor="fieldType"><strong>Select Field Type</strong>
                                    <MdInfoOutline
                                        id="fieldPopover"
                                        style={{
                                            cursor: 'pointer', marginLeft: '5px'
                                        }}
                                    />
                                    <UncontrolledPopover
                                        placement="bottom"
                                        target="fieldPopover"
                                        trigger="focus"
                                    >
                                        <PopoverBody>
                                            Select the appropriate field type (Text, Number, Date, Dropdown) for registration field.
                                        </PopoverBody>
                                    </UncontrolledPopover>
                                </Label>
                                <Field name="fieldType" validate={requiredValidator} style={{ marginBottom: '20px' }}>
                                    {({ input, meta }) => (
                                        <div style={{ marginBottom: '20px' }}>
                                            <Select
                                                {...input}
                                                options={typeData.map(pref => ({ value: pref.id, label: pref.type }))}
                                                isSearchable={true}
                                                onChange={(value) => {
                                                    input.onChange(value);
                                                    setSelectedFieldType(value);
                                                }}
                                                onBlur={input.onBlur}
                                                classNamePrefix="react-select"
                                            />
                                            {meta.error && meta.touched && <p className='d-block text-danger'>{meta.error}</p>}
                                            <div className='valid-feedback'>Looks good!</div>
                                        </div>
                                    )}
                                </Field>

                                <div style={{ marginBottom: '20px' }}>
                                    <Label className='form-label' htmlFor="customLabel"><strong>Field Name</strong></Label>
                                    {/* <Field name="customLabel" component="input" className="form-control" validate={requiredValidator} /> */}
                                    <Field
                                        name="customLabel"
                                        validate={composeValidators(requiredValidator, fieldname)}
                                    >
                                        {({ input, meta }) => (
                                            <>
                                                <input
                                                    {...input}
                                                    className="form-control"
                                                    type="text"
                                                    id="customLabel"
                                                    onChange={(e) => {
                                                        input.onChange(e); // Trigger onChange of the Field component
                                                        setName(e.target.value); // Update userName state
                                                        setNameTouched(true);
                                                    }}
                                                />
                                                {nameValidationMessage && <div className="text-danger">{nameValidationMessage}</div>}

                                                {meta.error && meta.touched && <p className='d-block text-danger'>{meta.error}</p>}
                                            </>
                                        )}
                                    </Field>

                                </div>

                                {/* <div className="form">
                                    <input
                                        id="spot"
                                        type="checkbox"
                                        onChange={(e) => setAddSpotVisible(e.target.checked)}
                                        checked={addSpotVisible}
                                    />
                                    <Label className="form-check-label ms-2" htmlFor="spot">
                                        <strong>Visible in app registration form</strong>
                                    </Label>
                                </div> */}

                                {/* <div className="form">
                                    <input
                                        id="basic"
                                        type="checkbox"
                                        onChange={(e) => setAddbasic(e.target.checked)}
                                        checked={addBasic}
                                    />
                                    <Label className="form-check-label ms-2" htmlFor="spot">
                                        <strong>Add user in Basic Registration form</strong>
                                    </Label>
                                </div> */}

                                {/* <div className="form">
                                    <input
                                        id="confirm"
                                        type="checkbox"
                                        onChange={(e) => setAddconfirm(e.target.checked)}
                                        checked={addConfirm}
                                    />
                                    <Label className="form-check-label ms-2" htmlFor="spot">
                                        <strong>Add User in Confirm registration form</strong>
                                    </Label>
                                </div> */}

                                {/* <div className="form">
                                    <input
                                        id="userpan"
                                        type="checkbox"
                                        onChange={(e) => setAdduserpan(e.target.checked)}
                                        checked={addUserpan}
                                    />
                                    <Label className="form-check-label ms-2" htmlFor="spot">
                                        <strong>Show in User Panel</strong>
                                    </Label>
                                </div> */}

                                {/* <div className="form">
                                    <input
                                        id="adminpan"
                                        type="checkbox"
                                        onChange={(e) => setAddadminpan(e.target.checked)}
                                        checked={addAdminpan}
                                    />
                                    <Label className="form-check-label ms-2" htmlFor="spot">
                                        <strong>Show in Admin Panel</strong>
                                    </Label>
                                </div> */}


                                {selectedFieldType && selectedFieldType.label === 'Dropdown' && (
                                    <div>
                                        <Col md="4" className="mb-3">
                                            <Label className='form-label' for="optionsName"><strong>Create Options <span className="red-asterisk">*</span></strong></Label>
                                            <div className="d-flex">
                                                <input
                                                    className="form-control"
                                                    id="optionsName"
                                                    type="text"
                                                    value={optionsName}
                                                    onChange={handleChange}
                                                />
                                                <Button color='primary' onClick={handleAddOptions} className='ml-2'>Add</Button>
                                            </div>
                                        </Col>
                                        <Col md="4" className="mb-3">
                                            <ul className="list-group">
                                                {options.map((option, index) => (
                                                    <li className="list-group-item d-flex justify-content-between align-items-center" key={index}>
                                                        <input
                                                            type="text"
                                                            value={option}
                                                            onChange={(e) => handleEditOptions(index, e.target.value)}
                                                        />
                                                        <div>
                                                            <Button color="danger" size="sm" onClick={() => handleRemoveOptions(index)}><MdDelete /></Button>
                                                        </div>
                                                    </li>
                                                ))}
                                            </ul>
                                        </Col>
                                    </div>
                                )}


                                <ModalFooter>
                                    <Button color="primary" type="submit">Create</Button>
                                    <Button color="warning" onClick={toggleCreateCustomModal}>Cancel</Button>
                                </ModalFooter>
                            </form>
                        )}
                    </Form>
                </ModalBody>
            </Modal>
            {/* Modal for REMOVING custom fields */}
            <Modal isOpen={removeModalOpen} toggle={closeRemoveModal} centered size="md">
                <ModalHeader toggle={closeRemoveModal}>Confirmation</ModalHeader>
                <ModalBody>
                    Are you sure you want to delete field?
                </ModalBody>
                <ModalFooter>
                    <Button color="primary" onClick={removeField}>Yes</Button>
                    <Button color="warning" onClick={closeRemoveModal}>No</Button>
                </ModalFooter>
            </Modal>

            {/* Modal for Warning Lock and Unlock */}
            <Modal isOpen={alertModalOpen} toggle={closealertModal} centered size="md">
                <ModalHeader toggle={closealertModal}>Confirmation</ModalHeader>
                <ModalBody>
                    <div style={{ marginBottom: '20px' }}>
                        <p><strong>Alert: Impact on Mobile Application & Forms</strong></p>
                        <p>
                            Changes to this form will affect all registration forms. Please ensure you
                            have uploaded offline data (if any) from the Onsite app to the server before
                            changing form fields. After making changes, you will need to reinstall the
                            Consoft Onsite app.
                        </p>
                        <p>Are you sure you want to continue?</p>
                    </div>
                </ModalBody>
                <ModalFooter>
                    <Button color="primary" onClick={toggleLock}>Yes</Button>
                    <Button color="warning" onClick={closealertModal}>No</Button>
                </ModalFooter>
            </Modal>

        </Fragment>
    );
};

export default RegFields;
