import React, { Fragment, useState, useEffect, useRef, useContext } from 'react';
import { Container, Row, Col, Input, Label, Button, Card, CardBody, Modal, ModalHeader, ModalBody, ModalFooter, Popover, PopoverHeader, PopoverBody, UncontrolledPopover } from 'reactstrap';
import { useForm } from 'react-hook-form';
import axios from 'axios';
import { BackendAPI, BackendPath } from '../../api';
import SweetAlert from 'sweetalert2';
import { Breadcrumbs } from '../../AbstractElements';
import { useNavigate, useLocation } from 'react-router-dom';
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


const EditPage = () => {
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
    const [cat, setCat] = useState([]);
    const [htmlData, setHtmlData] = useState();
    const [mode, setMode] = useState([]);
    const [formDataToSend, setFormDataToSend] = useState(null);
    const [showGrapesEditor, setShowGrapesEditor] = useState(false);
    const [pageType, setPageType] = useState([]); // State variable to track selected page type
    const [catIds, setCatIds] = useState([]); // New state for catIds
    const [unselectedCategories, setUnselectedCategories] = useState(category.map(pref => pref.cs_reg_cat_id));
    const location = useLocation();
    const { item } = location.state;
    const [logoOpen, setLogoOpen] = useState(false);
    const [iconPreviewUrl, setIconPreviewUrl] = useState(null);
    const iconAvailableRef = useRef(null);
    const { permissions } = useContext(PermissionsContext);

    console.log("Item:", item);
    console.log("Limit:", navLimit);


    useEffect(() => {
        const fetchCategory = async () => {
            try {
                const token = getToken();
                const response = await axios.get(`${BackendAPI}/page/getCategory`, {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                });

                // Modify role name for 'Guest'
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
                setCategory(modifiedCategories); // Set modified categories
                setMode(response.data.eventMode[0]?.cs_value);
                setNavlimit(response.data.navbarLimit);
                setLoading(false);
            } catch (error) {
                console.error('Error fetching facility types:', error);
                setLoading(false);
            }
        };

        fetchCategory(); // Fetch categories when component mounts
    }, [permissions]);

    // Extract Component Permission
    const PagePermissions = permissions['EditPage'];

    useEffect(() => {
        const fetchCategoryDetail = async () => {
            try {
                const token = getToken();
                const response = await axios.post(`${BackendAPI}/page/fetchCategoryDetail`, { item }, {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                });
                console.log("RES:", response.data);
                setCat(response.data.pagesData); // Set workshop data to the first item in the response array
                setHtmlData(response.data.htmlData[0].html_content);

                // Extract catIds directly from response
                const catIds = response.data.pagesData
                    .filter(page => page.status === 1) // Filter pages with status = 1
                    .map(page => page.cs_reg_cat_id); // Map to get the category IDs
                setCatIds(catIds); // Set catIds state
                setPageType(item.page_type);
            } catch (error) {
                console.error('Error fetching user detail data:', error);
            }
        };

        fetchCategoryDetail(); // Fetch workshop data when component mounts
    }, [item]);

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
        if (nameValidationMessage) {
            return; // Prevent form submission if there is a validation error
        }
        const selectedCategory = values.Category ? values.Category.map(option => option.value) : [];

        const selectedType = values.pType ? values.pType.value : ''; // Ensure correct access to the selected value

        console.log("Selected Type:", selectedType); // Debugging log



        const formData = {
            ...values,
            Category: selectedCategory,
            NonCategory: unselectedCategories,
            page_id: item.page_id,
            sidebar: values.sidebar ? '1' : '0',
            navbar: values.navbar ? '1' : '0',
            login: values.login ? 0 : 1,
            type: item.page_type,
            Data: htmlData,
            // pType: selectedType, // Assuming pType determines directlink or customeditor
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

            if (pageType === 'customeditor') {
                // Handle custom editor submission logic
                setFormDataToSend(formDataToSend);
                setShowGrapesEditor(true);
                // Optionally perform additional custom editor actions here
            } else {
                // Handle direct link submission logic
                formDataToSend.append('pageContent', iframeHTML);

                const response = await axios.post(`${BackendAPI}/page/updatePage`, formDataToSend, {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                });

                SweetAlert.fire({
                    title: 'Success!',
                    text: 'Page updated successfully!',
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

            if (value === item.page_display_name) {
                // Skip validation if the name is the same as the current name
                setNameValidationMessage('');
                return;
            }

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

    const categoryOptions = category.map(cat => ({
        value: cat.cs_reg_cat_id,
        label: cat.cs_reg_category
    }));

    const initialCategoryValues = categoryOptions.filter(option => catIds.includes(option.value));


    return (
        <Fragment>
            <Breadcrumbs parentClickHandler={handleNavigation} mainTitle="Edit Page" parent="Manage Page" title="Edit Page" />
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
                                                        initialValue={item.page_display_name}
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

                                                {item.page_type !== 'Static' && item.page_type !== 'Web' ? (
                                                    <Col md="4" className="mb-3">
                                                        <Field
                                                            name="pType"
                                                            validate={required}
                                                            initialValue={item.page_type}
                                                        >
                                                            {({ input, meta }) => {
                                                                // Define options locally
                                                                const options = [
                                                                    { value: 'directlink', label: 'Enter web page link' },
                                                                    { value: 'customeditor', label: 'Custom editor' }
                                                                ];

                                                                // Find the selected option based on the input value
                                                                const selectedOption = options.find(option => option.value === input.value);

                                                                return (
                                                                    <div>
                                                                        <Label className='form-label' for="type"><strong>Select Type <span className="red-asterisk">*</span></strong></Label>
                                                                        <Select
                                                                            {...input}
                                                                            options={options}
                                                                            placeholder={`Select Page Type`}
                                                                            isSearchable={true}
                                                                            onChange={(value) => {
                                                                                input.onChange(value); // Update form state
                                                                                setPageType(value.value); // Update local state if needed
                                                                            }}
                                                                            onBlur={input.onBlur}
                                                                            classNamePrefix="react-select"
                                                                            isMulti={false}
                                                                            value={selectedOption} // Use the selectedOption
                                                                        />
                                                                        {meta.error && meta.touched && <p className='d-block text-danger'>{meta.error}</p>}
                                                                    </div>
                                                                );
                                                            }}
                                                        </Field>
                                                    </Col>

                                                ) : null}



                                                {pageType === 'directlink' ? (
                                                    <Col md='4' className='mb-3'>
                                                        <Field
                                                            name="pLink"
                                                            validate={composeValidators(required)}
                                                            initialValue={item.directlink_url}

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
                                                {/* <Col md="4 mb-3">
                                                    <div>
                                                        <Label for="pageIcon"><strong>Page Icon <span className="red-asterisk">*</span></strong></Label>
                                                        <Input
                                                            type="file"
                                                            name="pageIcon"
                                                            onChange={(event) => handleImageChange(event, 'pageIcon')}
                                                            required={!item.icon_image_name}
                                                        />
                                                        {imageError && <p style={{ color: 'red' }}>{imageError}</p>}
                                                        <p style={{ color: 'green' }}>✔️ Icon Available</p>
                                                    </div>
                                                </Col> */}

                                                {/* Page Icon */}
                                                <Col md="4" className="mb-3">
                                                    <div>
                                                        <Label for="pageIcon"><strong>Page Icon <span className="red-asterisk">*</span></strong></Label>
                                                        <Input
                                                            type="file"
                                                            name="pageIcon"
                                                            onChange={(event) => handleImageChange(event, 'pageIcon')}
                                                            required={!item.icon_image_name}
                                                        />
                                                        {imageError && <p style={{ color: 'red' }}>{imageError}</p>}
                                                        {!imageError && (
                                                            <p
                                                                id="iconAvailable"
                                                                style={{ color: 'green', cursor: 'pointer' }}
                                                                onMouseEnter={() => setLogoOpen(true)}
                                                                onMouseLeave={() => setLogoOpen(false)}
                                                            >
                                                                ✔️ Page Icon Preview
                                                            </p>
                                                        )}

                                                        <Popover
                                                            placement="right"
                                                            isOpen={logoOpen}
                                                            target="iconAvailable"
                                                            toggle={() => setLogoOpen(!logoOpen)}
                                                        >
                                                            <PopoverHeader>Page Icon Preview</PopoverHeader>
                                                            <PopoverBody>
                                                                {iconPreviewUrl ? (
                                                                    <img src={iconPreviewUrl} alt="Current page Icon" style={{ maxWidth: '200px' }} />
                                                                ) : (
                                                                    <img src={`${BackendPath}${item.icon_image_url}`} alt="Current page Icon" style={{ maxWidth: '200px' }} />
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


                                                {mode === '2' || mode === '3' ? (
                                                    <Col md="4" className="mb-3">
                                                        <Label className='form-label' htmlFor="eventday"><strong>Select Category <span className="red-asterisk">*</span></strong></Label>
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
                                                        <Field
                                                            name="Category"
                                                        // validate={required}
                                                        >
                                                            {({ input, meta }) => {
                                                                // Debugging: log category and catIds
                                                                console.log("Category Data:", category);
                                                                console.log("Cat IDs:", catIds);

                                                                // Map catIds to selected options
                                                                const selectedOptions = catIds.map(id => {
                                                                    const option = category.find(cat => cat.cs_reg_cat_id === parseInt(id, 10));
                                                                    if (option) {
                                                                        return { value: option.cs_reg_cat_id, label: option.cs_reg_category };
                                                                    }
                                                                    return null;
                                                                }).filter(option => option !== null);

                                                                // Prepare options for the select box
                                                                const categoryOptions = category.map(cat => ({
                                                                    value: cat.cs_reg_cat_id,
                                                                    label: cat.cs_reg_category
                                                                }));

                                                                // Debugging: log options and selectedOptions
                                                                console.log("Category Options:", categoryOptions);
                                                                console.log("Selected Options:", selectedOptions);

                                                                return (
                                                                    <div>
                                                                        <Select
                                                                            {...input}
                                                                            options={categoryOptions}
                                                                            isMulti
                                                                            placeholder="Select Category"
                                                                            classNamePrefix="react-select"
                                                                            onChange={(value) => {
                                                                                handleCategoryChange(value);
                                                                                input.onChange(value);
                                                                                setCatIds(value.map(v => v.value));
                                                                            }}
                                                                            value={selectedOptions} // Pass the selected options here
                                                                        />
                                                                        {meta.error && meta.touched && <p className='d-block text-danger'>{meta.error}</p>}
                                                                    </div>
                                                                );
                                                            }}
                                                        </Field>
                                                    </Col>
                                                ) : null}





                                            </Row>

                                            <Row>
                                                <Col md="4" className="mb-3">
                                                    <Field
                                                        name="sidebar"
                                                        type="checkbox"
                                                        initialValue={item.sidebar === '1'}
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
                                                {/* {navLimit === 'no' ? ( */}
                                                <Col md="4" className="mb-3">
                                                    <Field
                                                        name="navbar"
                                                        type="checkbox"
                                                        initialValue={item.navbar === '1'}
                                                    >
                                                        {({ input, meta }) => (
                                                            <div>
                                                                <input
                                                                    {...input}
                                                                    id="navbar"
                                                                    disabled={navLimit === 'yes' && item.navbar === '0'} // Disable the checkbox if navLimit is 'no'
                                                                />
                                                                <Label className='form-check-label' style={{ marginLeft: '10px' }} for="navbar">
                                                                    <strong>Visible in App Navbar</strong>
                                                                </Label>
                                                                {meta.error && meta.touched && <p className='d-block text-danger'>{meta.error}</p>}
                                                            </div>
                                                        )}
                                                    </Field>
                                                </Col>
                                                {/* ) : null} */}
                                            </Row>




                                            <Row>
                                                {/* Conditionally render the checkbox */}
                                                {mode === '2' ? (
                                                    <Col md="4" className="mb-3">
                                                        <Field
                                                            name="login"
                                                            type="checkbox"
                                                            initialValue={item.login_access !== 1}
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


                                                <small>Note:- You can add up to 3 pages to the Navbar.</small>


                                            </Row>


                                            {PagePermissions?.edit === 1 && (
                                                <div className="d-flex justify-content-between mt-3">
                                                    <div>
                                                        {pageType === 'directlink' ? (
                                                            <>
                                                                <Button color='primary' type='submit' className="me-2">Update</Button>
                                                                <Button color='warning' onClick={handleCancel}>Cancel</Button>
                                                            </>
                                                        ) : (
                                                            <>
                                                                {pageType !== 'customeditor' && (
                                                                    <Button color='primary' type='submit' className="me-2">Update</Button>
                                                                )}
                                                                {pageType === 'customeditor' && (
                                                                    <Button type='submit' className="me-2" color="primary">Next</Button>
                                                                )}
                                                                <Button color='warning' onClick={handleCancel}>Cancel</Button>
                                                            </>
                                                        )}
                                                    </div>
                                                    {/* {pageType === 'customeditor' && (
                                                    <Button type='submit' className="ms-auto" color="primary">Next</Button>
                                                )} */}
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

export default EditPage;