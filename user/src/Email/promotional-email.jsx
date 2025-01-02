import React, { Fragment, useState, useEffect, useContext } from 'react';
import { Container, Row, Col, Label, Input, Button, Card, CardBody, CardHeader, Modal, ModalHeader, ModalBody, ModalFooter, Nav, NavItem, NavLink, PopoverBody, UncontrolledPopover } from 'reactstrap';
import SweetAlert from 'sweetalert2';
import Select from 'react-select';
import axios from 'axios';
import { BackendAPI } from '../api';
import { Breadcrumbs } from '../AbstractElements';
import { useNavigate } from 'react-router-dom'; // Import useHistory for programmatic navigation
import ReactQuill from 'react-quill';
import { MdDelete, MdInfoOutline } from "react-icons/md";
import { Editor } from '@tinymce/tinymce-react';
import 'react-quill/dist/quill.snow.css';
import { getToken } from '../Auth/Auth';
import useAuth from '../Auth/protectedAuth';
import { Form, Field } from 'react-final-form';
import { required, email } from '../Components/Utils/validationUtils';
import { FaPaperPlane } from "react-icons/fa";
import { PermissionsContext } from '../contexts/PermissionsContext';


// Utility function used to combine multiple validation functions into a single validation function
const composeValidators = (...validators) => value =>
  validators.reduce((error, validator) => error || validator(value), undefined);

const PromotionalEmail = () => {
  useAuth();
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false); // Initialize modal state
  const navigate = useNavigate(); // Initialize useHistory
  const [catData, setCatData] = useState([]);
  const [data, setData] = useState([]);
  const [regCat, setRegCat] = useState([]);
  const [selectedCat, setSelectedCat] = useState(null); // Added state to store selected category
  const [nameValidationMessage, setNameValidationMessage] = useState('');
  const [files, setFiles] = useState([]);
  const [QRvisible, setQRvisible] = useState(false);
  const [activeTab, setActiveTab] = useState('single'); // State to track active tab
  const [value, setValue] = useState('');
  const { permissions } = useContext(PermissionsContext);




  console.log(value);

  // console.log(selectedCat);


  useEffect(() => {
    fetchCat();
  }, [permissions]);


      // Extract AdminSettingPermissions component
      const PromotionalEMail = permissions['Promotional EMail'];

  const fetchCat = async () => {
    try {
      const token = getToken();
      const response = await axios.get(`${BackendAPI}/category/getCat`, {
        headers: {
          Authorization: `Bearer ${token}` // Include the token in the Authorization header
        }
      });
      const catData = response.data.Types.map(item => ({
        id: item.cs_reg_cat_id,
        Cat: item.cs_reg_category
      }));
      setCatData(catData);
    } catch (error) {
      console.error('Error fetching types:', error);
    }
  };

  const htmlExhContent = `
<!DOCTYPE HTML PUBLIC "-//W3C//DTD XHTML 1.0 Transitional //EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
<!--[if gte mso 9]>
<xml>
  <o:OfficeDocumentSettings>
    <o:AllowPNG/>
    <o:PixelsPerInch>96</o:PixelsPerInch>
  </o:OfficeDocumentSettings>
</xml>
<![endif]-->
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="x-apple-disable-message-reformatting">
  <!--[if !mso]><!--><meta http-equiv="X-UA-Compatible" content="IE=edge"><!--<![endif]-->
  <title></title>
  
    <style type="text/css">
      @media only screen and (min-width: 520px) {
  .u-row {
    width: 500px !important;
  }
  .u-row .u-col {
    vertical-align: top;
  }

  .u-row .u-col-100 {
    width: 500px !important;
  }

}

@media (max-width: 520px) {
  .u-row-container {
    max-width: 100% !important;
    padding-left: 0px !important;
    padding-right: 0px !important;
  }
  .u-row .u-col {
    min-width: 320px !important;
    max-width: 100% !important;
    display: block !important;
  }
  .u-row {
    width: 100% !important;
  }
  .u-col {
    width: 100% !important;
  }
  .u-col > div {
    margin: 0 auto;
  }
}
body {
  margin: 0;
  padding: 0;
}

table,
tr,
td {
  vertical-align: top;
  border-collapse: collapse;
}

p {
  margin: 0;
}

.ie-container table,
.mso-container table {
  table-layout: fixed;
}

* {
  line-height: inherit;
}

a[x-apple-data-detectors='true'] {
  color: inherit !important;
  text-decoration: none !important;
}

table, td { color: #000000; } </style>
  
  

<!--[if !mso]><!--><link href="https://fonts.googleapis.com/css?family=Montserrat:400,700&display=swap" rel="stylesheet" type="text/css"><!--<![endif]-->

</head>

<body class="clean-body u_body" style="margin: 0;padding: 0;-webkit-text-size-adjust: 100%;background-color: transparent;color: #000000">
  <!--[if IE]><div class="ie-container"><![endif]-->
  <!--[if mso]><div class="mso-container"><![endif]-->
  <table style="border-collapse: collapse;table-layout: fixed;border-spacing: 0;mso-table-lspace: 0pt;mso-table-rspace: 0pt;vertical-align: top;min-width: 320px;Margin: 0 auto;background-color: transparent;width:100%" cellpadding="0" cellspacing="0">
  <tbody>
  <tr style="vertical-align: top">
    <td style="word-break: break-word;border-collapse: collapse !important;vertical-align: top">
    <!--[if (mso)|(IE)]><table width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td align="center" style="background-color: transparent;"><![endif]-->
    
  
  
<div class="u-row-container" style="padding: 0px;background-color: transparent">
  <div class="u-row" style="margin: 0 auto;min-width: 320px;max-width: 500px;overflow-wrap: break-word;word-wrap: break-word;word-break: break-word;background-color: transparent;">
    <div style="border-collapse: collapse;display: table;width: 100%;height: 100%;background-color: transparent;">
      <!--[if (mso)|(IE)]><table width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td style="padding: 0px;background-color: transparent;" align="center"><table cellpadding="0" cellspacing="0" border="0" style="width:500px;"><tr style="background-color: transparent;"><![endif]-->
      
<!--[if (mso)|(IE)]><td align="center" width="500" style="width: 500px;padding: 0px;border-top: 0px solid transparent;border-left: 0px solid transparent;border-right: 0px solid transparent;border-bottom: 0px solid transparent;border-radius: 0px;-webkit-border-radius: 0px; -moz-border-radius: 0px;" valign="top"><![endif]-->
<div class="u-col u-col-100" style="max-width: 320px;min-width: 500px;display: table-cell;vertical-align: top;">
  <div style="height: 100%;width: 100% !important;border-radius: 0px;-webkit-border-radius: 0px; -moz-border-radius: 0px;">
  <!--[if (!mso)&(!IE)]><!--><div style="box-sizing: border-box; height: 100%; padding: 0px;border-top: 0px solid transparent;border-left: 0px solid transparent;border-right: 0px solid transparent;border-bottom: 0px solid transparent;border-radius: 0px;-webkit-border-radius: 0px; -moz-border-radius: 0px;"><!--<![endif]-->
  
<table style="font-family:arial,helvetica,sans-serif;" role="presentation" cellpadding="0" cellspacing="0" width="100%" border="0">
  <tbody>
    <tr>
      <td style="overflow-wrap:break-word;word-break:break-word;padding:10px;font-family:arial,helvetica,sans-serif;" align="left">
        
  <!--[if mso]><table width="100%"><tr><td><![endif]-->
    <h1 style="margin: 0px; line-height: 140%; text-align: center; word-wrap: break-word; font-family: georgia,palatino; font-size: 22px; font-weight: 400;"><span>{{cs_reg_category}}</span></h1>
  <!--[if mso]></td></tr></table><![endif]-->

      </td>
    </tr>
  </tbody>
</table>

  <!--[if (!mso)&(!IE)]><!--></div><!--<![endif]-->
  </div>
</div>
<!--[if (mso)|(IE)]></td><![endif]-->
      <!--[if (mso)|(IE)]></tr></table></td></tr></table><![endif]-->
    </div>
  </div>
  </div>
  


  
  
<div class="u-row-container" style="padding: 0px;background-color: transparent">
  <div class="u-row" style="margin: 0 auto;min-width: 320px;max-width: 500px;overflow-wrap: break-word;word-wrap: break-word;word-break: break-word;background-color: transparent;">
    <div style="border-collapse: collapse;display: table;width: 100%;height: 100%;background-color: transparent;">
      <!--[if (mso)|(IE)]><table width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td style="padding: 0px;background-color: transparent;" align="center"><table cellpadding="0" cellspacing="0" border="0" style="width:500px;"><tr style="background-color: transparent;"><![endif]-->
      
<!--[if (mso)|(IE)]><td align="center" width="500" style="width: 500px;padding: 0px;border-top: 0px solid transparent;border-left: 0px solid transparent;border-right: 0px solid transparent;border-bottom: 0px solid transparent;border-radius: 0px;-webkit-border-radius: 0px; -moz-border-radius: 0px;" valign="top"><![endif]-->
<div class="u-col u-col-100" style="max-width: 320px;min-width: 500px;display: table-cell;vertical-align: top;">
  <div style="height: 100%;width: 100% !important;border-radius: 0px;-webkit-border-radius: 0px; -moz-border-radius: 0px;">
  <!--[if (!mso)&(!IE)]><!--><div style="box-sizing: border-box; height: 100%; padding: 0px;border-top: 0px solid transparent;border-left: 0px solid transparent;border-right: 0px solid transparent;border-bottom: 0px solid transparent;border-radius: 0px;-webkit-border-radius: 0px; -moz-border-radius: 0px;"><!--<![endif]-->
  
<table style="font-family:arial,helvetica,sans-serif;" role="presentation" cellpadding="0" cellspacing="0" width="100%" border="0">
  <tbody>
    <tr>
      <td style="overflow-wrap:break-word;word-break:break-word;padding:10px;font-family:arial,helvetica,sans-serif;" align="left">
        
<table width="100%" cellpadding="0" cellspacing="0" border="0">
  <tr>
    <td style="padding-right: 0px;padding-left: 0px;" align="center">
      
      <img align="center" border="0" src="https://cdn.templates.unlayer.com/assets/1722238484052-customer-experience-creative-collage%201.png" alt="" title="" style="outline: none;text-decoration: none;-ms-interpolation-mode: bicubic;clear: both;display: inline-block !important;border: none;height: auto;float: none;width: 100%;max-width: 480px;" width="480"/>
      
    </td>
  </tr>
</table>

      </td>
    </tr>
  </tbody>
</table>

<table style="font-family:arial,helvetica,sans-serif;" role="presentation" cellpadding="0" cellspacing="0" width="100%" border="0">
  <tbody>
    <tr>
      <td style="overflow-wrap:break-word;word-break:break-word;padding:10px;font-family:arial,helvetica,sans-serif;" align="left">
        
  <div style="font-family: 'Montserrat',sans-serif; font-size: 14px; line-height: 140%; text-align: left; word-wrap: break-word;">
    <p style="line-height: 140%;">Dear  <strong>{{cs_first_name}}</strong> <strong>{{cs_last_name}}</strong></p>
<p style="line-height: 140%;">Thank you for registering for the IAPA 2025 conference, which will be held at AFMC, Pune from 14th to 16th February 2025.</p>
<p style="line-height: 140%;">We are delighted to confirm your registration for the conference, and your registration number is <strong>{{cs_regno}}</strong><br /><br /><br />Kindly regards</p>
<p style="line-height: 140%;"> </p>
  </div>

      </td>
    </tr>
  </tbody>
</table>

  <!--[if (!mso)&(!IE)]><!--></div><!--<![endif]-->
  </div>
</div>
<!--[if (mso)|(IE)]></td><![endif]-->
      <!--[if (mso)|(IE)]></tr></table></td></tr></table><![endif]-->
    </div>
  </div>
  </div>
  


  
  
<div class="u-row-container" style="padding: 0px;background-color: transparent">
  <div class="u-row" style="margin: 0 auto;min-width: 320px;max-width: 500px;overflow-wrap: break-word;word-wrap: break-word;word-break: break-word;background-color: transparent;">
    <div style="border-collapse: collapse;display: table;width: 100%;height: 100%;background-color: transparent;">
      <!--[if (mso)|(IE)]><table width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td style="padding: 0px;background-color: transparent;" align="center"><table cellpadding="0" cellspacing="0" border="0" style="width:500px;"><tr style="background-color: transparent;"><![endif]-->
      
<!--[if (mso)|(IE)]><td align="center" width="500" style="background-color: #000000;width: 500px;padding: 0px;border-top: 0px solid transparent;border-left: 0px solid transparent;border-right: 0px solid transparent;border-bottom: 0px solid transparent;border-radius: 0px;-webkit-border-radius: 0px; -moz-border-radius: 0px;" valign="top"><![endif]-->
<div class="u-col u-col-100" style="max-width: 320px;min-width: 500px;display: table-cell;vertical-align: top;">
  <div style="background-color: #000000;height: 100%;width: 100% !important;border-radius: 0px;-webkit-border-radius: 0px; -moz-border-radius: 0px;">
  <!--[if (!mso)&(!IE)]><!--><div style="box-sizing: border-box; height: 100%; padding: 0px;border-top: 0px solid transparent;border-left: 0px solid transparent;border-right: 0px solid transparent;border-bottom: 0px solid transparent;border-radius: 0px;-webkit-border-radius: 0px; -moz-border-radius: 0px;"><!--<![endif]-->
  
<table style="font-family:arial,helvetica,sans-serif;" role="presentation" cellpadding="0" cellspacing="0" width="100%" border="0">
  <tbody>
    <tr>
      <td style="overflow-wrap:break-word;word-break:break-word;padding:10px;font-family:arial,helvetica,sans-serif;" align="left">
        
  <div style="font-size: 14px; color: #fbeeb8; line-height: 140%; text-align: center; word-wrap: break-word;">
    <p style="line-height: 140%;">Copyright 2024 © ConSoft : Product by Gephels Systems All Rights Reserved.</p>
  </div>

      </td>
    </tr>
  </tbody>
</table>

  <!--[if (!mso)&(!IE)]><!--></div><!--<![endif]-->
  </div>
</div>
<!--[if (mso)|(IE)]></td><![endif]-->
      <!--[if (mso)|(IE)]></tr></table></td></tr></table><![endif]-->
    </div>
  </div>
  </div>
  


    <!--[if (mso)|(IE)]></td></tr></table><![endif]-->
    </td>
  </tr>
  </tbody>
  </table>
  <!--[if mso]></div><![endif]-->
  <!--[if IE]></div><![endif]-->
</body>

</html>

   `;




  const onSubmit = async (values) => {
    const selectedCategory = values.category ? values.category.map(option => option.value) : [];

    const formData = new FormData();
    formData.append('category', selectedCategory);
    formData.append('To', values.To);
    formData.append('Subject', values.Subject);
    formData.append('Body', value);
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
      SweetAlert.fire({
        title: 'Success!',
        text: 'Mail sent successfully!',
        icon: 'success',
        timer: 3000,
        showConfirmButton: false,
        allowOutsideClick: false,
        allowEscapeKey: false
      }).then((result) => {
        // if (result.dismiss === SweetAlert.DismissReason.timer) {
        //   navigate(`${process.env.PUBLIC_URL}/roles-permission/Consoft`);
        // }
      });
    } catch (error) {
      console.error('Error sending mail:', error);
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
        <Row>
          <Col sm="12">
            <Card>
              <CardHeader className="d-flex justify-content-between align-items-center flex-column flex-md-row">
                <div className="mb-2 mb-md-0">
                  <h5 className="mb-2">New Message</h5>
                </div>
              </CardHeader>
              <CardBody>
                <Nav tabs>
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
                      Multiple Mails
                    </NavLink>
                  </NavItem>
                </Nav>
                {activeTab === 'single' && (
                  <Form onSubmit={onSubmit}>
                    {({ handleSubmit }) => (
                      <form className='needs-validation' noValidate='' onSubmit={handleSubmit}>
                        <Row>
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
                          <Col md="6 mb-3">
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
                          <Col md="6 mb-3">
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
                          <Col md="12 mb-3">
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
                          <Col md="6 mb-3">
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


                        <Button disabled color='primary' type='submit' className="me-2 mt-3">
                          <FaPaperPlane style={{ marginRight: '8px' }} />
                          Send
                        </Button>
                        <Button color='warning' onClick={handleCancel} className="mt-3">Cancel</Button>
                      </form>
                    )}
                  </Form>
                )}
                {activeTab === 'multiple' && (
                  <Form onSubmit={onSubmit}>
                    {({ handleSubmit }) => (
                      <form className='needs-validation' noValidate='' onSubmit={handleSubmit}>
                        <Row>
                          <Col md="6" className="mb-3">
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
                        <Row>
                          <Col md="2" className="mb-3">
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

                          <Col md="2" className="mb-3">
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


                        <Row>
                          <Col md="6 mb-3">
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
                          <Col md="6 mb-3">
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

                        <Row>
                          <Col md="6 mb-3">
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









                        <Button disabled color='primary' type='submit' className="me-2 mt-3"> <FaPaperPlane style={{ marginRight: '8px' }} />
                          Send</Button>
                        <Button color='warning' onClick={handleCancel} className="mt-3">Cancel</Button>
                      </form>
                    )}
                  </Form>
                )}
              </CardBody>
            </Card>
          </Col>
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
    </Fragment>
  );
};

export default PromotionalEmail;
