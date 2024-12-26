import React, { Fragment, useState, useEffect, useRef, useContext } from 'react';
import { Container, Row, Col, Input, Label, Button, Card, CardBody, Modal, ModalHeader, ModalBody, ModalFooter, Popover, PopoverHeader, PopoverBody, UncontrolledPopover } from 'reactstrap';
import { useForm } from 'react-hook-form';
import axios from 'axios';
import { BackendAPI } from '../../api';
import SweetAlert from 'sweetalert2';
import { Breadcrumbs } from '../../AbstractElements';
import { useNavigate } from 'react-router-dom';
import Select from 'react-select';
import { MdDelete, MdInfoOutline } from "react-icons/md";
import { Field, Form } from 'react-final-form';
import { required, pageName, Img1, Wname } from '../Utils/validationUtils';
import debounce from 'lodash.debounce';
import useAuth from '../../Auth/protectedAuth';
import { getToken } from '../../Auth/Auth';
import { toast } from 'react-toastify';
import styled from 'styled-components';
import GrapesEditor from '../GrapesEditor/GrapesEditor';
import { PermissionsContext } from '../../contexts/PermissionsContext';

const composeValidators = (...validators) => value =>
    validators.reduce((error, validator) => error || validator(value), undefined);


const RedAsterisk = styled.span`
  color: red;
`;


const AddPage = () => {
    useAuth();
    const [isChecked, setIsChecked] = useState([]); // Initialize isChecked state
    const [files, setFiles] = useState({ pageIcon: '', darkModeIcon: '' });
    const [data, setData] = useState([]);
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [modal, setModal] = useState(false);
    const { register, handleSubmit, formState: { errors } } = useForm();
    const [selectedImage, setSelectedImage] = useState(null);
    const [imageError, setImageError] = useState('');
    const [name, setName] = useState('');
    const [navLimit, setNavlimit] = useState('');
    const [nameValidationMessage, setNameValidationMessage] = useState('');
    const [nameTouched, setNameTouched] = useState(false);
    const [category, setCategory] = useState([]);
    const [mode, setMode] = useState([]);
    const [formDataToSend, setFormDataToSend] = useState(null);
    const [showGrapesEditor, setShowGrapesEditor] = useState(false);
    const [pageType, setPageType] = useState([]); // State variable to track selected page type
    const [unselectedCategories, setUnselectedCategories] = useState(category.map(pref => pref.cs_reg_cat_id));
    const [iconOpen, setIconOpen] = useState(false);
    const [iconPreviewUrl, setIconPreviewUrl] = useState(null);
    const iconAvailableRef = useRef(null);
    const { permissions } = useContext(PermissionsContext);


    console.log("Type:", pageType);

    console.log("Limit:", navLimit);



    console.log("Category:", category);
    console.log("NonCategory:", unselectedCategories);


    useEffect(() => {
        fetchCategory(); // Corrected function name
    }, [permissions]);

    // Extract Component Permission
    const PagePermissions = permissions['AddPage'];

    const fetchCategory = async () => {
        try {
            const token = getToken();
            const response = await axios.get(`${BackendAPI}/page/getCategory`, {
                headers: {
                    Authorization: `Bearer ${token}` // Include the token in the Authorization header
                }
            });

            // Modify the role name for 'Guest'
            let modifiedCategories = response.data.catData.map(category => {
                if (category.cs_reg_category === 'Guest') {
                    return { ...category, cs_reg_category: 'Guest Mode' };
                }
                return category;
            });

            // Exclude 'Guest' if mode is '3'
            if (response.data.eventMode[0]?.cs_value === '3') {
                modifiedCategories = modifiedCategories.filter(category => category.cs_reg_category !== 'Guest Mode');
            }

            setData(response.data);
            setCategory(modifiedCategories); // Set the modified categories
            setMode(response.data.eventMode[0]?.cs_value);
            setNavlimit(response.data.navbarLimit);
            setLoading(false);
            console.log('Category Data:', response.data); // Log the data received from the API
        } catch (error) {
            console.error('Error fetching facility types:', error);
            setLoading(false);
        }
    };


    const handleCancel = () => {
        setModal(true);
    };

    const handleCategoryChange = (selected) => {
        if (selected && selected.length > 0 && selected[0].value === 'all') {
            const allCategories = category.map(pref => pref.cs_reg_cat_id);
            setUnselectedCategories([]);
            return;
        } else {
            setUnselectedCategories(category.map(pref => pref.cs_reg_cat_id).filter(id => !selected.some(item => item.value === id)));
        }
    };

    const onSubmit = async (values) => {


        const selectedCategory = values.Category ? values.Category.map(option => option.value) : [];

        const selectedType = values.pType ? values.pType.value : ''; // Ensure correct access to the selected value

        console.log("Selected Type:", selectedType); // Debugging log



        const formData = {
            ...values,
            Category: mode === '1' ? 0 : (mode === '3' ? [0, selectedCategory] : selectedCategory),
            NonCategory: unselectedCategories,
            sidebar: values.sidebar ? '1' : '0',
            navbar: values.navbar ? '1' : '0',
            login: values.login ? 0 : 1,
            pType: selectedType, // Assuming pType determines directlink or customeditor
        };

        try {
            const formDataToSend = new FormData();

            Object.keys(formData).forEach(key => {
                formDataToSend.append(key, formData[key]);
            });

            formDataToSend.append('pageIcon', files.pageIcon);

            // Preprocess pLink before submitting
            const iframeHTML = `<!DOCTYPE html>
                                <html lang="en">
                                <head>
                                    <meta charset="UTF-8">
                                    <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no">
                                    <title>Embedded Page</title>
                                    <style>
                                        body {
                                            font-family: Arial, sans-serif;
                                            margin: 0;
                                            padding: 0;
                                        }
                                        .iframe-container {
                                            width: 100%;
                                            height: 100vh; /* Adjust the height as needed */
                                        }
                                        iframe {
                                            width: 100%;
                                            height: 100%;
                                            border: none; /* Remove border */
                                        }
                                    </style>
                                </head>
                                <body>
                                    <div class="iframe-container">
                                        <!-- customeditor iframe -->
                                        <iframe src="${values.pLink}" title="Embedded Page"></iframe>
                                    </div>
                                </body>
                                </html>
                                `;
            console.log('Preprocessed HTML:', iframeHTML);


            // Uncomment for actual API submission
            const token = getToken();

            if (pageType?.value === 'customeditor') {
                // Handle custom editor submission logic
                setFormDataToSend(formDataToSend);
                setShowGrapesEditor(true);
                // Optionally perform additional custom editor actions here
            } else {
                // Handle direct link submission logic
                formDataToSend.append('pageContent', iframeHTML);

                const response = await axios.post(`${BackendAPI}/page/storePage`, formDataToSend, {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                });

                SweetAlert.fire({
                    title: 'Success!',
                    text: 'Page created successfully!',
                    icon: 'success',
                    timer: 3000,
                    showConfirmButton: false,
                    allowOutsideClick: false,
                    allowEscapeKey: false
                }).then((result) => {
                    if (result.dismiss === SweetAlert.DismissReason.timer) {
                        setShowGrapesEditor(false);
                        navigate(`${process.env.PUBLIC_URL}/event/manage-page/Consoft`);
                    }
                });
            }
        } catch (error) {
            console.error('Error creating page:', error.message);
        }
    };




    const handleImageChange = async (event, type) => {
        const file = event.target.files[0];

        if (file) {
            setFiles(prevFiles => ({ ...prevFiles, [type]: file }));
            setSelectedImage(file); // Update selectedImage state
            const url = URL.createObjectURL(file);
            setIconPreviewUrl(url);
        }
        try {
            await Img1(file); // Wait for the Promise to resolve
            setImageError('');
        } catch (error) {
            setSelectedImage(null);
            setImageError(error);
        }
    };

    const validatename = debounce(async (value) => {
        try {
            // Call the API to check name availability
            const token = getToken();
            const response = await axios.post(`${BackendAPI}/page/check-page-name`, { pName: value }, {
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
        if (nameTouched) { // Only validate name if it has been touched
            validatename(name);
        }
        return () => {
            validatename.cancel();
        };
    }, [name, nameTouched]);

    const handleNavigation = () => {
        navigate(`${process.env.PUBLIC_URL}/event/manage-page/Consoft`);
    };

    if (showGrapesEditor) {
        return <GrapesEditor formDataToSend={formDataToSend} navigate={navigate} />;
    }

    return (
        <Fragment>
            <Breadcrumbs parentClickHandler={handleNavigation} mainTitle={
                <>
                    Create Page
                    <MdInfoOutline
                        id="pagePopover"
                        style={{
                            cursor: 'pointer', position: 'absolute', marginLeft: '5px'
                        }}
                    />
                    <UncontrolledPopover
                        placement="bottom"
                        target="pagePopover"
                        trigger="focus"
                    >
                        <PopoverBody>
                            You can create a page for your Event App with the proper information to be displayed. <br />
                            Manage the page's visibility in the Sidebar and Navbar as needed. <br />
                            By default, the created page will display on the Homepage. Select the proper page icon.
                            Please ensure the icon meets the required specifications for the best display quality.
                        </PopoverBody>
                    </UncontrolledPopover>
                </>
            } parent="Manage Page" title="Create Page" />
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
                                                        name="pName"
                                                        validate={composeValidators(required, pageName)}
                                                    >
                                                        {({ input, meta }) => (
                                                            <div>
                                                                <Label className='form-label' for="displayname"><strong>Page Name <span className="red-asterisk">*</span></strong> <small>(25 Character)</small></Label>
                                                                <input
                                                                    {...input}
                                                                    className="form-control"
                                                                    id="displayname"
                                                                    type="text"
                                                                    placeholder="Enter Page Name"
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

                                                <Col md="4" className="mb-3">
                                                    <Field
                                                        name="pType"
                                                        validate={required}
                                                    >
                                                        {({ input, meta }) => (
                                                            <div>
                                                                <Label className='form-label' for="eventday"><strong>Select Type <span className="red-asterisk">*</span></strong></Label>
                                                                <MdInfoOutline
                                                                    id="typePopover"
                                                                    style={{
                                                                        cursor: 'pointer', position: 'absolute', marginLeft: '5px'
                                                                    }}
                                                                />
                                                                <UncontrolledPopover
                                                                    placement="bottom"
                                                                    target="typePopover"
                                                                    trigger="focus"
                                                                >
                                                                    <PopoverBody>
                                                                        Please select the page type based on your requirement. <br />
                                                                        If you have a webpage, choose <strong>Web Page Link</strong>. If you want to create a custom page, select <strong>Custom Editor</strong> to design your own page.
                                                                    </PopoverBody>
                                                                </UncontrolledPopover>
                                                                <Select
                                                                    {...input}
                                                                    options={[
                                                                        { value: 'directlink', label: 'Enter web page link' },
                                                                        { value: 'customeditor', label: 'Custom editor' }
                                                                    ]}
                                                                    placeholder={`Select Page Type`}
                                                                    isSearchable={true}
                                                                    onChange={(value) => {
                                                                        input.onChange(value);
                                                                        setPageType(value); // Update state based on selection
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


                                                {pageType?.value === 'directlink' ? (
                                                    <Col md='4' className='mb-3'>
                                                        <Field
                                                            name="pLink"
                                                            validate={composeValidators(required)}
                                                        >
                                                            {({ input, meta }) => (
                                                                <div>
                                                                    <Label className='form-label' for="link"><strong>Web Page Link <span className="red-asterisk">*</span></strong></Label>
                                                                    <input
                                                                        {...input}
                                                                        className="form-control"
                                                                        id="link"
                                                                        type="text"
                                                                        placeholder="Enter web page link"
                                                                    />
                                                                    {meta.error && meta.touched && <p className='d-block text-danger'>{meta.error}</p>}
                                                                </div>
                                                            )}
                                                        </Field>
                                                    </Col>
                                                ) : (
                                                    <></> // Render nothing if pageType is not 'directlink'
                                                )}



                                            </Row>

                                            <Row>

                                                <Col md="4" className="mb-3">
                                                    <div>
                                                        <Label for="pageIcon">
                                                            <strong>Page Icon <span className="red-asterisk">*</span></strong>
                                                        </Label>
                                                        <MdInfoOutline
                                                            id="iconPopover"
                                                            style={{
                                                                cursor: 'pointer', position: 'absolute', marginLeft: '5px'
                                                            }}
                                                        />
                                                        <UncontrolledPopover
                                                            placement="bottom"
                                                            target="iconPopover"
                                                            trigger="focus"
                                                        >
                                                            <PopoverBody>
                                                                Ensure you have uploaded the page icon so it looks correct and displays properly on the Event App for that page.
                                                            </PopoverBody>
                                                        </UncontrolledPopover>
                                                        <Input
                                                            type="file"
                                                            name="brightmode"
                                                            onChange={(event) => handleImageChange(event, 'pageIcon')}
                                                            required
                                                        />
                                                        {imageError && <p style={{ color: 'red' }}>{imageError}</p>}

                                                        {/* Conditionally render the preview text */}
                                                        {iconPreviewUrl && !imageError && (
                                                            <p
                                                                ref={iconAvailableRef}
                                                                style={{ color: 'green', cursor: 'pointer' }}
                                                                onMouseEnter={() => setIconOpen(true)}
                                                                onMouseLeave={() => setIconOpen(false)}
                                                            >
                                                                ✔️ Page Icon Preview
                                                            </p>
                                                        )}

                                                        <Popover
                                                            placement="right"
                                                            isOpen={iconOpen}
                                                            target={iconAvailableRef.current} // Use ref for the target
                                                            toggle={() => setIconOpen(!iconOpen)}
                                                        >
                                                            <PopoverHeader>Page Icon Preview</PopoverHeader>
                                                            <PopoverBody>
                                                                {iconPreviewUrl ? (
                                                                    <img src={iconPreviewUrl} alt="Current Exhibitor Icon" style={{ maxWidth: '200px' }} />
                                                                ) : (
                                                                    <p>No icon selected</p>
                                                                )}
                                                            </PopoverBody>
                                                        </Popover>
                                                    </div>
                                                    {!selectedImage && (
                                                        <small className="form-text text-muted">
                                                            <strong>Image Size:</strong> 200KB Max <br />
                                                            <strong>Dimensions:</strong> 600(H) × 600(W) <br />
                                                            <strong>Image Type:</strong> PNG, JPG, JPEG
                                                        </small>
                                                    )}
                                                </Col>

                                                {/* Conditionally render the checkbox */}
                                                {/* {mode === '2' || mode === '3' ? (
                                                <Col md="4" className="mb-3">
                                                    <Field
                                                        name="Category" // Use customeditor field name
                                                        validate={composeValidators(required)}
                                                    >
                                                        {({ input, meta }) => (
                                                            <div>
                                                                <Label className='form-label' for="eventday"><strong>Select Category <span className="red-asterisk">*</span></strong></Label>
                                                                <Select
                                                                    {...input}
                                                                    options={[
                                                                        { value: 'all', label: 'Select All' },
                                                                        ...category.map(pref => ({ value: pref.cs_reg_cat_id, label: pref.role_name }))
                                                                    ]}

                                                                    placeholder={`Select Category`}
                                                                    isSearchable={true}
                                                                    // onChange={(value) => input.onChange(value)}
                                                                    onChange={(value) => {
                                                                        if (value && value.length > 0 && value[0].value === 'all') {
                                                                            const allDays = category.map(pref => pref.cs_reg_cat_id);
                                                                            input.onChange([{ value: allDays, label: 'Select All' }]);
                                                                        } else {
                                                                            input.onChange(value);
                                                                        }
                                                                    }}
                                                                    onBlur={input.onBlur}
                                                                    classNamePrefix="react-select"
                                                                    isMulti={true}
                                                                    value={input.value}
                                                                />
                                                                {meta.error && meta.touched && <p className='d-block text-danger'>{meta.error}</p>}

                                                            </div>
                                                        )}
                                                    </Field>

                                                </Col>
                                                ) : null} */}
                                                {mode === '2' || mode === '3' ? (
                                                    <Col md="4" className="mb-3">
                                                        <Field
                                                            name="Category" // Use customeditor field name
                                                            validate={composeValidators(required)}
                                                        >
                                                            {({ input, meta }) => (
                                                                <div>
                                                                    <Label className='form-label' for="eventday"><strong>Select Category <span className="red-asterisk">*</span></strong></Label>
                                                                    <MdInfoOutline
                                                                        id="catPopover"
                                                                        style={{
                                                                            cursor: 'pointer', position: 'absolute', marginLeft: '5px'
                                                                        }}
                                                                    />
                                                                    <UncontrolledPopover
                                                                        placement="bottom"
                                                                        target="catPopover"
                                                                        trigger="focus"
                                                                    >
                                                                        <PopoverBody>
                                                                            The category you select from here will get the access of this page. <br />
                                                                            To show the page to users signing up through the Event app, select the <strong>User</strong> category.
                                                                            To show the page to users who prefer not to register but still want access, select the <strong>Guest</strong> category.
                                                                        </PopoverBody>
                                                                    </UncontrolledPopover>
                                                                    <Select
                                                                        {...input}
                                                                        options={[
                                                                            { value: 'all', label: 'Select All' },
                                                                            ...category.map(pref => ({ value: pref.cs_reg_cat_id, label: pref.cs_reg_category }))
                                                                        ]}
                                                                        placeholder={`Select Category`}
                                                                        isSearchable={true}
                                                                        onChange={(value) => {
                                                                            handleCategoryChange(value);
                                                                            if (value && value.length > 0 && value[0].value === 'all') {
                                                                                const allDays = category.map(pref => pref.cs_reg_cat_id);
                                                                                input.onChange([{ value: allDays, label: 'Select All' }]);
                                                                            } else {
                                                                                input.onChange(value);
                                                                            }
                                                                        }}
                                                                        onBlur={input.onBlur}
                                                                        classNamePrefix="react-select"
                                                                        isMulti={true}
                                                                        value={input.value}
                                                                    />
                                                                    {meta.error && meta.touched && <p className='d-block text-danger'>{meta.error}</p>}
                                                                </div>
                                                            )}
                                                        </Field>
                                                    </Col>
                                                ) : null}
                                            </Row>

                                            <Row>
                                                <Col md="4" className="mb-3">
                                                    <Field
                                                        name="sidebar"
                                                        type="checkbox"
                                                    >
                                                        {({ input, meta }) => (
                                                            <div >
                                                                <input
                                                                    {...input}
                                                                    id="sidebar" // Correct ID for the input
                                                                />
                                                                <Label className='form-check-label' style={{ marginLeft: '10px' }} for="sidebar"><strong>Visible in App Sidebar</strong></Label>
                                                                {meta.error && meta.touched && <p className='d-block text-danger'>{meta.error}</p>}
                                                            </div>
                                                        )}
                                                    </Field>
                                                </Col>
                                            </Row>



                                            <Row>
                                                {navLimit === 'no' ? (
                                                    <Col md="4" className="mb-3">
                                                        <Field
                                                            name="navbar"
                                                            type="checkbox"
                                                        >
                                                            {({ input, meta }) => (
                                                                <div>
                                                                    <input
                                                                        {...input}
                                                                        id="navbar" // Correct ID for the input
                                                                    />
                                                                    <Label className='form-check-label' style={{ marginLeft: '10px' }} htmlFor="navbar"><strong>Visible in App Navbar</strong></Label>
                                                                    {meta.error && meta.touched && <p className='d-block text-danger'>{meta.error}</p>}
                                                                </div>
                                                            )}
                                                        </Field>
                                                    </Col>

                                                ) : null}
                                            </Row>



                                            <Row>
                                                {/* Conditionally render the checkbox */}
                                                {mode === '2' ? (
                                                    <Col md="4" className="mb-3">
                                                        <Field
                                                            name="login"
                                                            type="checkbox"
                                                        >
                                                            {({ input, meta }) => (
                                                                <div >
                                                                    <input
                                                                        {...input}
                                                                        id="login" // Correct ID for the input
                                                                    />
                                                                    <Label className='form-check-label' style={{ marginLeft: '10px' }} for="login"><strong>Ask to guest user for login</strong></Label>
                                                                    {meta.error && meta.touched && <p className='d-block text-danger'>{meta.error}</p>}
                                                                </div>
                                                            )}
                                                        </Field>
                                                    </Col>
                                                ) : null}




                                            </Row>

                                            <small>Note:- You can add up to 3 pages to the Navbar.</small>




                                            {PagePermissions?.edit === 1 && (
                                                <div className="d-flex justify-content-between mt-3">
                                                    <div>
                                                        {pageType?.value === 'directlink' ? (
                                                            <>
                                                                <Button color='primary' type='submit' className="me-2">Publish</Button>
                                                                <Button color='warning' onClick={handleCancel}>Cancel</Button>
                                                            </>
                                                        ) : (
                                                            <></>
                                                        )}
                                                    </div>
                                                    {pageType?.value === 'customeditor' && (
                                                        <Button type='submit' className="ms-auto" color="primary">Next</Button>
                                                    )}
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

export default AddPage;