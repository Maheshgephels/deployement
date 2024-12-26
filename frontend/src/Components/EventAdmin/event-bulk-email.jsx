import React, { Fragment, useState, useEffect, useContext } from 'react';
import { Container, Row, Col, Label, Input, Button, Card, CardBody, CardHeader, Modal, ModalHeader, ModalBody, ModalFooter, Nav, NavItem, NavLink, PopoverBody, UncontrolledPopover } from 'reactstrap';
import SweetAlert from 'sweetalert2';
import Select from 'react-select';
import axios from 'axios';
import { BackendAPI } from '../../api';
import { Breadcrumbs } from '../../AbstractElements';
import { useNavigate } from 'react-router-dom'; // Import useHistory for programmatic navigation
import ReactQuill from 'react-quill';
import { MdDelete, MdInfoOutline } from "react-icons/md";
import { Editor } from '@tinymce/tinymce-react';
import 'react-quill/dist/quill.snow.css';
import { getToken } from '../../Auth/Auth';
import useAuth from '../../Auth/protectedAuth';
import { ToastContainer, toast } from "react-toastify";
import { Form, Field } from 'react-final-form';
import { required, email } from '../../Components/Utils/validationUtils';
import { FaPaperPlane } from "react-icons/fa";
import { PermissionsContext } from '../../contexts/PermissionsContext';
import parse from 'html-react-parser';



// Utility function used to combine multiple validation functions into a single validation function
const composeValidators = (...validators) => value =>
    validators.reduce((error, validator) => error || validator(value), undefined);

const EventBulkEmail = () => {
    useAuth();
    const [loading, setLoading] = useState(true);
    const [modal, setModal] = useState(false); // Initialize modal state
    const navigate = useNavigate(); // Initialize useHistory
    const [catData, setCatData] = useState([]);
    const [tempData, setTempData] = useState([]);
    const [data, setData] = useState([]);
    const [regCat, setRegCat] = useState([]);
    const [selectedCat, setSelectedCat] = useState(null); // Added state to store selected category
    const [selectedTemplateContent, setSelectedTemplateContent] = useState('');
    const [selectedTemplateId, setSelectedTemplateId] = useState('');
    const [nameValidationMessage, setNameValidationMessage] = useState('');
    const [files, setFiles] = useState([]);
    const [QRvisible, setQRvisible] = useState(false);
    const [activeTab, setActiveTab] = useState('single'); // State to track active tab
    const [value, setValue] = useState('');
    const { permissions } = useContext(PermissionsContext);
    const [modalOpen, setModalOpen] = useState(false);
    const [mailType, SetMailType] = useState('custom');
    const templateOption = tempData.map(status => ({
        value: status.template_id,
        label: status.template_name
    }));




    console.log("Template", selectedTemplateContent);

    // console.log(selectedCat);


    useEffect(() => {
        fetchCat();
    }, [permissions]);


    // Extract AdminSettingPermissions component
    const EventBulkEmail = permissions['EventBulkEmail'];

    const fetchCat = async () => {
        try {
            const token = getToken();
            const response = await axios.get(`${BackendAPI}/sendgrid/getCat`, {
                headers: {
                    Authorization: `Bearer ${token}` // Include the token in the Authorization header
                }
            });
            const catData = response.data.Types.map(item => ({
                id: item.cs_reg_cat_id,
                Cat: item.cs_reg_category
            }));
            setCatData(catData);
            setTempData(response.data.templateData);
        } catch (error) {
            console.error('Error fetching types:', error);
        }
    };


    // const onSubmit = async (values) => {
    //   const selectedCategory = values.category ? values.category.map(option => option.value) : [];

    //   const formData = new FormData();
    //   formData.append('category', selectedCategory);
    //   formData.append('To', values.To);
    //   formData.append('Subject', values.Subject);
    //   // formData.append('Body', value);
    //   formData.append('Body', htmlExhContent);

    //   // formData.append('QR', QRvisible ? "1" : "0",)
    //   if (values.startDate) {
    //     formData.append('startDate', values.startDate);
    //   }
    //   if (values.endDate) {
    //     formData.append('endDate', values.endDate);
    //   }

    //   files.forEach((file, index) => {
    //     formData.append('attachments', file);
    //   });

    //   try {
    //     const token = getToken();
    //     const response = await axios.post(`${BackendAPI}/sendgrid/bulk-email`, formData, {
    //       headers: {
    //         Authorization: `Bearer ${token}`,
    //         'Content-Type': 'multipart/form-data'
    //       }
    //     });
    //     SweetAlert.fire({
    //       title: 'Success!',
    //       text: 'Mail sent successfully!',
    //       icon: 'success',
    //       timer: 3000,
    //       showConfirmButton: false,
    //       allowOutsideClick: false,
    //       allowEscapeKey: false
    //     }).then((result) => {
    //       // if (result.dismiss === SweetAlert.DismissReason.timer) {
    //       //   navigate(`${process.env.PUBLIC_URL}/roles-permission/Consoft`);
    //       // }
    //     });
    //   } catch (error) {
    //     console.error('Error sending mail:', error);
    //   }
    // };


    const onSubmit = async (values) => {
        const toastId = toast.info('Processing...', { autoClose: false });

        const selectedCategory = values.category ? values.category.map(option => option.value) : [];
        const selectedTemplate = values.temp_id ? values.temp_id.map(option => option.value) : [];
        console.log("Values", values);

        const formData = new FormData();
        formData.append('category', selectedCategory);

        formData.append('temp_id', selectedTemplateId);

        formData.append('mailType', mailType);
        formData.append('To', values.To);
        formData.append('Subject', values.Subject);
        // Remove <p> tags (open and close) before appending
        const cleanValue = value.replace(/<\/?p>/g, '');

        // Append the cleaned value to formData
        formData.append('Body', cleanValue);
        // formData.append('Body', value);
        // formData.append('Body', htmlExhContent);

        // formData.append('QR', QRvisible ? "1" : "0",)
        if (values.startDate) {
            formData.append('startDate', values.startDate);
        }
        if (values.endDate) {
            formData.append('endDate', values.endDate);
        }

        files.forEach((file, index) => {
            formData.append('attachments', file);
        });

        try {
            const token = getToken();
            const response = await axios.post(`${BackendAPI}/sendgrid/bulk-email`, formData, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'multipart/form-data'
                }
            });

            // Dismiss the processing toast
            toast.dismiss(toastId);
            SweetAlert.fire({
                title: 'Success!',
                text: 'Mail sent successfully!',
                icon: 'success',
                timer: 3000,
                showConfirmButton: false,
                allowOutsideClick: false,
                allowEscapeKey: false
            }).then((result) => {
                if (result.dismiss === SweetAlert.DismissReason.timer) {
                    navigate(`${process.env.PUBLIC_URL}/onsite/promotional-email/Consoft`);
                }
            });
        } catch (error) {
            // Dismiss the processing toast
            toast.dismiss(toastId);
            console.error('Error sending mail:', error);
            toast.error(error);

        }
    };


    const handleCancel = () => {
        setModal(true); // Set modal state to true to activate the modal
    };


    const handleNavigation = () => {
        navigate(`${process.env.PUBLIC_URL}/roles-permission/Consoft`);
    };


    const handleImageChange = (event) => {
        const newFiles = Array.from(event.target.files);
        setFiles(newFiles);
    };


    const handleTemplateChange = (selectedValue) => {

        // Get the selected template details
        const selectedTemplate = tempData.find(
            (template) => template.template_id === selectedValue?.value
        );

        setSelectedTemplateId(selectedValue.value);

        // Update selected template content if found
        if (selectedTemplate) {
            setSelectedTemplateContent(selectedTemplate.template_content);
        }

        toggleModal(selectedValue);
    };

    const toggleModal = (templateId) => {
        const selectedTemplate = data.find(template => template.template_id === templateId);
        if (selectedTemplate) {
            setSelectedTemplateContent(selectedTemplate.template_content);
        }
        setModalOpen(!modalOpen);
    };

    const handleMailChange = (e) => {
        SetMailType(e.target.value);
    };




    return (
        <Fragment>
            <Breadcrumbs mainTitle={
                <>
                    Promotional Email
                    <MdInfoOutline
                        id="emailPopover"
                        style={{
                            cursor: 'pointer', position: 'absolute', marginLeft: '5px'
                        }}
                    />
                    <UncontrolledPopover
                        placement="bottom"
                        target="emailPopover"
                        trigger="focus"
                    >
                        <PopoverBody>
                            You can send an email to a specific user as needed, or you can send bulk emails by category
                            or within a selected date range of user registrations, using a common subject, message body, and attachment.
                        </PopoverBody>
                    </UncontrolledPopover>
                </>
            } parent="Onsite App" title="Promotional Email" />
            <Container fluid>
                <Row className='justify-content-center'>
                    <Col sm="9">
                        <Card>
                            {/* <CardHeader className="d-flex justify-content-between align-items-center flex-column flex-md-row">
                <div className="mb-2 mb-md-0">
                  <h5 className="mb-2">New Message</h5>
                </div>
              </CardHeader> */}
                            <CardBody>
                                <Nav tabs className='justify-content-center'>
                                    <NavItem>
                                        <NavLink
                                            className={activeTab === 'single' ? 'active' : ''}
                                            onClick={() => setActiveTab('single')}
                                        >
                                            Single Mail
                                        </NavLink>
                                    </NavItem>
                                    <NavItem>
                                        <NavLink
                                            className={activeTab === 'multiple' ? 'active' : ''}
                                            onClick={() => setActiveTab('multiple')}
                                        >
                                            Bulk Email
                                        </NavLink>
                                    </NavItem>
                                </Nav>
                                {activeTab === 'single' && (
                                    <Form onSubmit={onSubmit}>
                                        {({ handleSubmit }) => (
                                            <form className='needs-validation' noValidate='' onSubmit={handleSubmit}>


                                                {/* <Col md="6" className="mb-3">
                          <Field
                            name={`category`} // Use dynamic field name
                          >
                            {({ input }) => (
                              <div>
                                <Label className='form-label' for="category"><strong>To <span className="red-asterisk">*</span></strong></Label>
                                <Select
                                  {...input}
                                  options={[
                                    { value: 'all', label: 'Select All' },
                                    ...catData.map(pref => ({ value: pref.id, label: pref.Cat }))
                                  ]}
                                  // options={regCat.map(pref => ({ value: pref.cs_reg_cat_id, label: pref.cs_reg_category }))}
                                  placeholder={`Select Category`}
                                  isSearchable={true}
                                  onChange={(value) => {
                                    if (value && value.length > 0 && value[0].value === 'all') {
                                      const allCatNames = catData.map(pref => pref.id);
                                      input.onChange([{ value: allCatNames, label: 'Select All' }]);
                                    } else {
                                      input.onChange(value);
                                    }
                                  }}
                                  // onChange={(value) => input.onChange(value)}
                                  onBlur={input.onBlur}
                                  classNamePrefix="react-select"
                                  isMulti={true}
                                  value={catData.find(option => option.value === selectedCat)}
                                />

                              </div>
                            )}
                          </Field>
                        </Col> */}
                                                <Row>
                                                    <Col md="12" className="mb-3 mt-3">
                                                        <Label className='form-label' for="to"><strong>To<span className="red-asterisk">*</span></strong></Label>
                                                        <Field
                                                            name="To"
                                                            validate={composeValidators(required, email)}
                                                        >
                                                            {({ input, meta }) => (
                                                                <>
                                                                    <input
                                                                        {...input}
                                                                        className="form-control"
                                                                        type="text" id="to"
                                                                    // placeholder="Enter role name"
                                                                    />
                                                                    {nameValidationMessage && <div className="text-danger">{nameValidationMessage}</div>}

                                                                    {meta.error && meta.touched && <span className='text-danger'>{meta.error}</span>}
                                                                </>
                                                            )}
                                                        </Field>
                                                    </Col>
                                                </Row>

                                                <Row>
                                                    <Col md="12" className="mb-3">
                                                        <Label className='form-label' for="subject"><strong>Subject<span className="red-asterisk">*</span></strong></Label>
                                                        <Field
                                                            name="Subject"
                                                            validate={composeValidators(required)}
                                                        >
                                                            {({ input, meta }) => (
                                                                <>
                                                                    <input
                                                                        {...input}
                                                                        className="form-control"
                                                                        type="text" id="subject"
                                                                    // placeholder="Enter role name"
                                                                    />
                                                                    {nameValidationMessage && <div className="text-danger">{nameValidationMessage}</div>}

                                                                    {meta.error && meta.touched && <span className='text-danger'>{meta.error}</span>}
                                                                </>
                                                            )}
                                                        </Field>
                                                    </Col>
                                                </Row>
                                                <Row>
                                                    <Col md="12" className="mb-3">
                                                        <Label for="body"><strong>Message</strong></Label>

                                                        <Field
                                                            name="Body"
                                                        >
                                                            {({ input }) => (
                                                                // <Input {...input} type="textarea" id="body" placeholder="Enter mail body" />


                                                                <ReactQuill theme="snow" value={value} onChange={setValue} modules={{
                                                                    toolbar: [
                                                                        [{ header: '1' }, { header: '2' }, { font: [] }],
                                                                        [{ size: ['small', false, 'large', 'huge'] }],  // Remove the size options and add the below line
                                                                        ['bold', 'italic', 'underline', 'strike', 'blockquote'],
                                                                        [{ list: 'ordered' }, { list: 'bullet' }],
                                                                        [{ 'align': [] }, { 'color': [] }, { 'background': [] }],
                                                                        ['link', 'image', 'video'],
                                                                        ['clean']
                                                                    ],
                                                                }} />
                                                            )}
                                                        </Field>
                                                    </Col>
                                                </Row>

                                                {/* <Row>
                          <Col md="12 mb-3">
                            <Label for="body"><strong>Message</strong></Label>
                            <Editor
                              apiKey='n1omie5alrddgxqjtmb1e5ua0wkqejg2jaydsdl5tticibpv'
                              init={{
                                plugins: 'anchor autolink charmap codesample emoticons image link lists media searchreplace table visualblocks wordcount checklist mediaembed casechange export formatpainter pageembed linkchecker a11ychecker tinymcespellchecker permanentpen powerpaste advtable advcode editimage advtemplate ai mentions tinycomments tableofcontents footnotes mergetags autocorrect typography inlinecss markdown',
                                toolbar: 'undo redo | blocks fontfamily fontsize | bold italic underline strikethrough | link image media table mergetags | addcomment showcomments | spellcheckdialog a11ycheck typography | align lineheight | checklist numlist bullist indent outdent | emoticons charmap | removeformat',
                                tinycomments_mode: 'embedded',
                                tinycomments_author: 'Author name',
                                mergetags_list: [
                                  { value: 'First.Name', title: 'First Name' },
                                  { value: 'Email', title: 'Email' },
                                ],
                                ai_request: (request, respondWith) => respondWith.string(() => Promise.reject("See docs to implement AI Assistant")),
                              }}
                              initialValue={value}
                              onEditorChange={(content, editor) => setValue(content)}
                            />
                            <Field name="Body" initialValue={value}>
                              {({ input }) => <input {...input} type="hidden" />}
                            </Field>
                          </Col>
                        </Row> */}


                                                <Row>
                                                    <Col md="12" className="mb-3">
                                                        <Label for="attachment"><strong>Attachment</strong></Label>

                                                        <Field name="Attachment">
                                                            {({ input }) => (
                                                                <Input type="file" name="attachment" onChange={handleImageChange} multiple />

                                                            )}
                                                        </Field>
                                                    </Col>
                                                </Row>

                                                {/* <Row>

                        <div className="form">
                        <input id="spot" type="checkbox" onChange={(e) => setQRvisible(e.target.checked)} checked={QRvisible} />
                        <label className='form-check-label' style={{ marginLeft: '10px' }} htmlFor="spot"><strong>Visible in app registration form</strong></label>
                    </div>

                      </Row> */}


                                                <Button color='primary' type='submit' className="me-2 mt-3">
                                                    <FaPaperPlane style={{ marginRight: '8px' }} />
                                                    Send
                                                </Button>
                                                <Button color='warning' onClick={handleCancel} className="mt-3" >Cancel</Button>
                                            </form>
                                        )}
                                    </Form>
                                )}
                                {activeTab === 'multiple' && (
                                    <Form onSubmit={onSubmit}>
                                        {({ handleSubmit }) => (
                                            <form className='needs-validation' noValidate='' onSubmit={handleSubmit}>
                                                <Row>
                                                    {/* Report Type Radio Buttons */}
                                                    <Col md="12" className="mb-3 mt-3">
                                                        <div className="form-group">
                                                            <strong>Mail Type</strong>
                                                            <div className="me-5 mt-3">
                                                                <input
                                                                    type="radio"
                                                                    name="priceType"
                                                                    value="custom"
                                                                    checked={mailType === 'custom'}
                                                                    onChange={handleMailChange}
                                                                    className="me-2"
                                                                />
                                                                <strong>Custom Email</strong>
                                                                <input
                                                                    type="radio"
                                                                    name="priceType"
                                                                    value="static"
                                                                    onChange={handleMailChange}
                                                                    className="ms-3 me-2"
                                                                />
                                                                <strong>Compose Own Email</strong>
                                                            </div>
                                                        </div>
                                                    </Col>
                                                </Row>
                                                <Row>
                                                    <Col md="12" className="mb-3">
                                                        <Field
                                                            name={`category`} // Use dynamic field name
                                                        >
                                                            {({ input }) => (
                                                                <div>
                                                                    <Label className='form-label' for="category"><strong>To<span className="red-asterisk">*</span></strong></Label>
                                                                    <Select
                                                                        {...input}
                                                                        options={[
                                                                            { value: 'all', label: 'Select All' },
                                                                            ...catData.map(pref => ({ value: pref.id, label: pref.Cat }))
                                                                        ]}
                                                                        // options={regCat.map(pref => ({ value: pref.cs_reg_cat_id, label: pref.cs_reg_category }))}
                                                                        placeholder={`Select Category`}
                                                                        isSearchable={true}
                                                                        onChange={(value) => {
                                                                            if (value && value.length > 0 && value[0].value === 'all') {
                                                                                const allCatNames = catData.map(pref => pref.id);
                                                                                input.onChange([{ value: allCatNames, label: 'Select All' }]);
                                                                            } else {
                                                                                input.onChange(value);
                                                                            }
                                                                        }}
                                                                        // onChange={(value) => input.onChange(value)}
                                                                        onBlur={input.onBlur}
                                                                        classNamePrefix="react-select"
                                                                        isMulti={true}
                                                                        isClearable={false}
                                                                        value={catData.find(option => option.value === selectedCat)}
                                                                    />

                                                                </div>
                                                            )}
                                                        </Field>
                                                    </Col>


                                                    {/* <Col md="6 mb-3">
                          <Label className='form-label' for="to"><strong>To: <span className="red-asterisk">*</span></strong></Label>
                          <Field
                            name="To"
                            validate={composeValidators(required, email)}
                          >
                            {({ input, meta }) => (
                              <>
                                <input
                                  {...input}
                                  className="form-control"
                                  type="text" id="to"
                                // placeholder="Enter role name"
                                />
                                {nameValidationMessage && <div className="text-danger">{nameValidationMessage}</div>}

                                {meta.error && meta.touched && <span className='text-danger'>{meta.error}</span>}
                              </>
                            )}
                          </Field>
                        </Col> */}
                                                </Row>
                                                {mailType === 'custom' && (
                                                    <>
                                                        <Row>
                                                            <Col md="12" className="mb-3">
                                                                <Field name={`temp_id`}>
                                                                    {({ input, meta }) => {
                                                                        const selectedOption = templateOption.find(option => option.value === input.value);
                                                                        return (
                                                                            <div>
                                                                                <Label className="form-label" for="temp_id"><strong>Email Template</strong></Label>
                                                                                <Select
                                                                                    {...input}
                                                                                    options={templateOption}
                                                                                    placeholder="Select Template"
                                                                                    isSearchable={true}
                                                                                    onChange={handleTemplateChange} // Using a dedicated function
                                                                                    onBlur={input.onBlur}
                                                                                    classNamePrefix="react-select"
                                                                                    isMulti={false}
                                                                                    value={selectedOption} // Setting the selected value
                                                                                />
                                                                                {meta.error && meta.touched && <p className="d-block text-danger">{meta.error}</p>}
                                                                            </div>
                                                                        );
                                                                    }}
                                                                </Field>
                                                            </Col>
                                                        </Row>
                                                    </>
                                                )}
                                                <Row>
                                                    <Col md="6" className="mb-3">
                                                        <Field name="startDate">
                                                            {({ input }) => (
                                                                <div>
                                                                    <Label className='form-label' for="startDate"><strong>From Date</strong></Label>
                                                                    <input
                                                                        {...input}
                                                                        className="form-control"
                                                                        id="start_date"
                                                                        type="date"
                                                                        placeholder="Enter Start Date"
                                                                        // min={minDate}
                                                                        max="9999-12-31"
                                                                    />
                                                                </div>
                                                            )}
                                                        </Field>
                                                    </Col>

                                                    <Col md="6" className="mb-3">
                                                        <Field name="endDate">
                                                            {({ input }) => (
                                                                <div>
                                                                    <Label className='form-label' for="endDate"><strong>To Date</strong></Label>
                                                                    <input
                                                                        {...input}
                                                                        className="form-control"
                                                                        id="end_date"
                                                                        type="date"
                                                                        placeholder="Enter End Date"
                                                                        // min={minDate}
                                                                        max="9999-12-31"
                                                                    />
                                                                </div>
                                                            )}

                                                        </Field>
                                                    </Col>
                                                </Row>

                                                {mailType === 'static' && (
                                                    <>
                                                        <Row>
                                                            <Col md="12" className="mb-3">
                                                                <Label className='form-label' for="subject"><strong>Subject<span className="red-asterisk">*</span></strong></Label>
                                                                <Field
                                                                    name="Subject"
                                                                    validate={composeValidators(required)}
                                                                >
                                                                    {({ input, meta }) => (
                                                                        <>
                                                                            <input
                                                                                {...input}
                                                                                className="form-control"
                                                                                type="text" id="subject"
                                                                            // placeholder="Enter role name"
                                                                            />
                                                                            {nameValidationMessage && <div className="text-danger">{nameValidationMessage}</div>}

                                                                            {meta.error && meta.touched && <span className='text-danger'>{meta.error}</span>}
                                                                        </>
                                                                    )}
                                                                </Field>
                                                            </Col>
                                                        </Row>
                                                        <Row>
                                                            <Col md="12" className="mb-3">
                                                                <Label for="body"><strong>Message:</strong></Label>
                                                                <Field
                                                                    name="Body"
                                                                >
                                                                    {({ input }) => (
                                                                        // <Input {...input} type="textarea" id="body" placeholder="Enter mail body" />
                                                                        <ReactQuill theme="snow" value={value} onChange={setValue} modules={{
                                                                            toolbar: [
                                                                                [{ header: '1' }, { header: '2' }, { font: [] }],
                                                                                [{ size: ['small', false, 'large', 'huge'] }],  // Remove the size options and add the below line
                                                                                ['bold', 'italic', 'underline', 'strike', 'blockquote'],
                                                                                [{ list: 'ordered' }, { list: 'bullet' }],
                                                                                [{ 'align': [] }, { 'color': [] }, { 'background': [] }],
                                                                                ['link', 'image', 'video'],
                                                                                ['clean']
                                                                            ],
                                                                        }} />
                                                                    )}
                                                                </Field>
                                                            </Col>
                                                        </Row>

                                                    </>
                                                )}

                                                <Row>
                                                    <Col md="12" className="mb-3">
                                                        <Label for="attachment"><strong>Attachment:</strong></Label>

                                                        <Field name="Attachment">
                                                            {({ input }) => (
                                                                <Input type="file" name="attachment" onChange={handleImageChange} multiple />

                                                            )}
                                                        </Field>
                                                    </Col>
                                                </Row>

                                                {/* <Row>

                        <div className="form">
                        <input id="spot" type="checkbox" onChange={(e) => setQRvisible(e.target.checked)} checked={QRvisible} />
                        <label className='form-check-label' style={{ marginLeft: '10px' }} htmlFor="spot"><strong>Visible in app registration form</strong></label>
                    </div>

                      </Row> */}









                                                <Button color='primary' type='submit' className="me-2 mt-3" > <FaPaperPlane style={{ marginRight: '8px' }} />
                                                    Send</Button>
                                                <Button color='warning' onClick={handleCancel} className="mt-3" >Cancel</Button>
                                            </form>
                                        )}
                                    </Form>
                                )}
                            </CardBody>
                        </Card>
                    </Col>
                    {/* <Col sm="6">
            <Card>
              <CardHeader className="d-flex justify-content-between align-items-center flex-column flex-md-row">
                <div className="mb-2 mb-md-0">
                  <h5 className="mb-2">Template Preview</h5>
                </div>
              </CardHeader>
              <CardBody style={{ width: '750px', maxWidth: '100%', padding: '20px' }}>

              <div className="template-content">{parse(selectedTemplateContent)}</div>


              </CardBody>
              <div>
              </div>

            </Card>
          </Col> */}
                </Row>
            </Container>
            {/* Modal */}
            <Modal isOpen={modal} toggle={() => setModal(!modal)} centered>
                <ModalHeader toggle={() => setModal(!modal)}>Confirmation</ModalHeader>
                <ModalBody>
                    <div className='ms-2'>
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
                    {/* <Link to="/roles-permission/Consoft" className="btn btn-warning">Yes</Link> */}
                    <Button color="primary" onClick={() => setModal(!modal)}>No</Button>
                </ModalFooter>
            </Modal>

            {/* Modal for viewing template content */}
            <Modal isOpen={modalOpen} toggle={() => setModalOpen(!modalOpen)} style={{ width: '750px', maxWidth: '100%', padding: '20px' }}>
                <div>
                    {parse(selectedTemplateContent)} {/* Render HTML */}
                </div>
            </Modal>
        </Fragment>
    );
};

export default EventBulkEmail;
