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
import { required, email, option } from '../../Components/Utils/validationUtils';
import { FaPaperPlane } from "react-icons/fa";
import { PermissionsContext } from '../../contexts/PermissionsContext';
import parse from 'html-react-parser';



// Utility function used to combine multiple validation functions into a single validation function
const composeValidators = (...validators) => value =>
    validators.reduce((error, validator) => error || validator(value), undefined);

const RegBulkEmail = () => {
    useAuth();
    const [loading, setLoading] = useState(true);
    const [modal, setModal] = useState(false); // Initialize modal state
    const navigate = useNavigate(); // Initialize useHistory
    const [catData, setCatData] = useState([]);
    const [tempData, setTempData] = useState([]);
    const [ticketData, setTicketData] = useState([]);
    const [addonData, setAddonData] = useState([]);
    const [filteredTickets, setFilteredTickets] = useState([]);
    const [filteredAddon, setFilteredAddon] = useState([]);
    const [data, setData] = useState([]);
    const [regCat, setRegCat] = useState([]);
    const [selectedCat, setSelectedCat] = useState(''); // Added state to store selected category
    const [selectedTicket, setSelectedTicket] = useState(''); // Added state to store selected category
    const [selectedAddons, setSelectedAddons] = useState([]);
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

    const ticketOption = filteredTickets.map(status => ({
        value: status.ticket_id,
        label: status.ticket_title
    }));

    const addonOption = filteredAddon.map(status => ({
        value: status.addon_id,
        label: status.addon_title
    }));



    console.log("Category", catData);
    console.log("Selected Category", selectedCat);

    console.log("Ticket", ticketData);
    console.log("Selected Ticket", selectedTicket);

    console.log("Addon", addonData);
    console.log("Selected Addon", selectedAddons);


    // console.log(selectedCat);

    useEffect(() => {
        const filtered = selectedCat.length
            ? ticketData.filter(ticket =>
                ticket.ticket_category &&
                selectedCat.some(catId =>
                    JSON.parse(ticket.ticket_category).includes(catId)
                )
            )
            : ticketData; // Show all tickets if no category is selected
        setFilteredTickets(filtered);
    }, [selectedCat, ticketData]);

    useEffect(() => {
        const filtered = selectedTicket.length
            ? addonData.filter(addon => {
                // Normalize addon_ticket_ids to an array of numbers
                let ticketIds = [];
                if (addon.addon_ticket_ids) {
                    if (addon.addon_ticket_ids.startsWith("[") || addon.addon_ticket_ids.startsWith("{")) {
                        // Replace curly braces with square brackets if necessary
                        const normalizedString = addon.addon_ticket_ids.replace(/{/g, "[").replace(/}/g, "]");
                        try {
                            ticketIds = JSON.parse(normalizedString);
                        } catch (error) {
                            console.error("Error parsing ticket IDs:", addon.addon_ticket_ids, error);
                        }
                    }
                }
                // Ensure ticketIds is an array
                return Array.isArray(ticketIds) && ticketIds.some(ticketId => selectedTicket.includes(ticketId));
            })
            : addonData; // Show all add-ons if no ticket selected
        setFilteredAddon(filtered);
    }, [selectedTicket, addonData]);





    useEffect(() => {
        fetchCat();
    }, [permissions]);


    // Extract AdminSettingPermissions component
    const RegBulkEmail = permissions['RegBulkEmail'];

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
            setTicketData(response.data.ticketData);
            setAddonData(response.data.addonData);
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
        console.log("Data", values);

        const formData = new FormData();
        formData.append('category', values.category);
        formData.append('ticket_id', values.ticket_id);
        formData.append('addon_id', values.addon_id);

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
            const response = await axios.post(`${BackendAPI}/sendgrid/reg-bulk-email`, formData, {
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
                    navigate(`${process.env.PUBLIC_URL}/registration/reg-bulk-email/Consoft`);
                }
            });
        } catch (error) {
            // Dismiss the processing toast
            toast.dismiss(toastId);
            console.error('Error sending mail:', error);
            // toast.error(error);

            // toast.error('Error sending mail');

            // Show the error using SweetAlert
            SweetAlert.fire({
                title: 'No Data Found!',
                text: error.response.data,
                icon: 'error',
                timer: 3000,
                showConfirmButton: false,
                allowOutsideClick: false,
                allowEscapeKey: false
            });


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
                                                        <Field name={`category`}>
                                                            {({ input }) => (
                                                                <div>
                                                                    <Label className='form-label' for="category">
                                                                        <strong>To</strong>
                                                                    </Label>
                                                                    <Select
                                                                        {...input}
                                                                        options={[
                                                                            { value: 'all', label: 'Select All' },
                                                                            ...catData.map(pref => ({ value: pref.id, label: pref.Cat }))
                                                                        ]}
                                                                        placeholder={`Select Category`}
                                                                        isSearchable={true}
                                                                        onChange={(value) => {
                                                                            if (value && value.some(option => option.value === 'all')) {
                                                                                // Get all category IDs
                                                                                const allCategoryIds = catData.map(pref => pref.id);
                                                                                input.onChange(allCategoryIds);
                                                                                setSelectedCat(allCategoryIds); // Store only the IDs
                                                                            } else {
                                                                                const selectedIds = value.map(option => option.value);
                                                                                input.onChange(selectedIds);
                                                                                setSelectedCat(selectedIds); // Store only the IDs
                                                                            }
                                                                        }}
                                                                        onBlur={input.onBlur}
                                                                        classNamePrefix="react-select"
                                                                        isMulti={true}
                                                                        isClearable={false}
                                                                        value={catData
                                                                            .filter(pref => selectedCat.includes(pref.id))
                                                                            .map(pref => ({ value: pref.id, label: pref.Cat }))} // Map back to objects for display
                                                                    />
                                                                </div>
                                                            )}
                                                        </Field>
                                                    </Col>



                                                    <Col md="12" className="mb-3">
                                                        <Field name={`ticket_id`}>
                                                            {({ input, meta }) => {
                                                                const selectedOption = Array.isArray(input.value)
                                                                    ? input.value.map(v => ticketOption.find(option => option.value === v))
                                                                    : ticketOption.find(option => option.value === input.value);

                                                                return (
                                                                    <div>
                                                                        <Label className="form-label" for="ticket_id">
                                                                            <strong>Ticket</strong>
                                                                        </Label>
                                                                        <Select
                                                                            {...input}
                                                                            options={[
                                                                                { value: 'all', label: 'Select All' },
                                                                                ...ticketOption
                                                                            ]}
                                                                            placeholder="Select Ticket"
                                                                            isSearchable={true}
                                                                            onChange={(selected) => {
                                                                                if (selected && selected.length && selected.some(opt => opt.value === 'all')) {
                                                                                    // "Select All" is included
                                                                                    const allValues = ticketOption.map(opt => opt.value);
                                                                                    input.onChange(allValues); // Replace "all" with all ticket IDs
                                                                                    setSelectedTicket(allValues); // Update selected tickets
                                                                                } else if (Array.isArray(selected)) {
                                                                                    // Handle regular multiple selection
                                                                                    const selectedIds = selected.map(option => option.value);
                                                                                    input.onChange(selectedIds);
                                                                                    setSelectedTicket(selectedIds);
                                                                                } else {
                                                                                    // Handle single selection
                                                                                    input.onChange(selected ? selected.value : null);
                                                                                    setSelectedTicket(selected ? [selected.value] : []);
                                                                                }
                                                                            }}
                                                                            onBlur={input.onBlur}
                                                                            classNamePrefix="react-select"
                                                                            isMulti={true} // Enables multi-select
                                                                            isClearable={false}
                                                                            value={selectedOption} // Adjust selected values
                                                                        />
                                                                        {meta.error && meta.touched && (
                                                                            <p className="d-block text-danger">{meta.error}</p>
                                                                        )}
                                                                    </div>
                                                                );
                                                            }}
                                                        </Field>
                                                    </Col>


                                                    <Col md="12" className="mb-3">
                                                        <Field name={`addon_id`}>
                                                            {({ input, meta }) => {
                                                                // Map input value to selected options for proper rendering
                                                                const selectedOption = Array.isArray(input.value)
                                                                    ? input.value.map(v => addonOption.find(option => option.value === v))
                                                                    : addonOption.find(option => option.value === input.value);

                                                                return (
                                                                    <div>
                                                                        <Label className="form-label" for="addon_id"><strong>Add-on</strong></Label>
                                                                        <Select
                                                                            {...input}
                                                                            options={[{ value: 'all', label: 'Select All' }, ...addonOption]}
                                                                            placeholder="Select Add-on"
                                                                            isSearchable={true}
                                                                            isMulti={true} // Enable multi-select
                                                                            isClearable={false}
                                                                            onChange={(selected) => {
                                                                                if (Array.isArray(selected)) {
                                                                                    const isSelectAll = selected.some(option => option.value === 'all');

                                                                                    if (isSelectAll) {
                                                                                        // Select All: Add all add-ons to the selection
                                                                                        const allValues = addonOption.map(opt => opt.value);
                                                                                        input.onChange(allValues);
                                                                                        setSelectedAddons(allValues); // Update state with all values
                                                                                    } else {
                                                                                        // Extract selected values, excluding Select All
                                                                                        const selectedIds = selected.map(option => option.value).filter(value => value !== 'all');
                                                                                        input.onChange(selectedIds);
                                                                                        setSelectedAddons(selectedIds); // Update state with selected values
                                                                                    }
                                                                                } else {
                                                                                    input.onChange([]);
                                                                                    setSelectedAddons([]); // Clear state if no selection
                                                                                }
                                                                            }}
                                                                            onBlur={input.onBlur}
                                                                            classNamePrefix="react-select"
                                                                            value={selectedOption} // Properly format the selected value
                                                                        />
                                                                        {meta.error && meta.touched && <p className="d-block text-danger">{meta.error}</p>}
                                                                    </div>
                                                                );
                                                            }}
                                                        </Field>
                                                    </Col>




                                                </Row>
                                                {mailType === 'custom' && (
                                                    <>
                                                        <Row>
                                                            <Col md="12" className="mb-3">
                                                                <Field name="temp_id" >
                                                                    {({ input, meta }) => {
                                                                        // Find the selected option based on the input value
                                                                        const selectedOption = templateOption.find(option => option.value === input.value);

                                                                        return (
                                                                            <div>
                                                                                <Label className="form-label" for="temp_id">
                                                                                    <strong>Email Template<span className="red-asterisk"> *</span></strong>
                                                                                </Label>
                                                                                <Select
                                                                                    {...input}
                                                                                    options={templateOption}
                                                                                    placeholder="Select Template"
                                                                                    isSearchable={true}
                                                                                    onChange={handleTemplateChange} // Assuming this function is defined elsewhere
                                                                                    onBlur={input.onBlur}
                                                                                    classNamePrefix="react-select"
                                                                                    isMulti={false}
                                                                                    value={selectedOption} // Properly setting the selected value
                                                                                />
                                                                                {meta.error && meta.touched && (
                                                                                    <p className="d-block text-danger">{meta.error}</p>
                                                                                )}
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

export default RegBulkEmail;
