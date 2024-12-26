import React, { useRef, useState, useEffect, Fragment } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Breadcrumbs } from '../AbstractElements';
import EmailEditor from 'react-email-editor';
import axios from 'axios';
import { Field, Form } from 'react-final-form';
import { Container, Row, Col, Button, Card, CardHeader, Modal, ModalHeader, ModalFooter, ModalBody, Label, Input } from 'reactstrap';
import { Tooltip } from 'react-tooltip';
import { BackendAPI, BackendPath } from '../api';
import { getToken } from '../Auth/Auth';
import { GrPowerReset } from "react-icons/gr";
import { RiDraftLine } from "react-icons/ri";
import { FaEdit, FaRegSave, FaArrowLeft, FaPaperPlane } from "react-icons/fa";
import { required, email, Name, Img, PDF, fieldname } from '../Components/Utils/validationUtils';
import useAuth from '../Auth/protectedAuth';
import Template from "./sample";
import Empty from "./Empty";
import SweetAlert from 'sweetalert2';
import { ToastContainer, toast } from "react-toastify";



// Define the required validator
const requiredValidator = value => (value ? undefined : 'This field is required');

// Utility function to combine multiple validation functions
const composeValidators = (...validators) => value =>
  validators.reduce((error, validator) => error || validator(value), undefined);

const EmailTemplate = (props) => {
  useAuth();
  const emailEditorRef = useRef(null);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [fieldLabels, setFieldLabels] = useState([]);
  const [fieldName, setFieldName] = useState([]);
  const [modal, setModal] = useState(false);
  const [testmodal, setTestModal] = useState(false);
  const [email, setEmail] = useState('');
  const location = useLocation();
  const navigate = useNavigate();
  const [temp, setTemp] = useState(false);
  const [tempName, setTempName] = useState('');
  const [tempSubject, setTempSubject] = useState('');
  const { template } = location.state || {};

  // Create the mergeTags object
  const mergeTags = {};

  // Dynamic tags based on field names and labels
  fieldName.forEach((name, index) => {
    mergeTags[name] = {
      name: fieldLabels[index],
      value: `{{${name}}}`,
      sample: `${fieldLabels[index]}`
    };
  });

  // Adding hardcoded tags
  // mergeTags["qr_code"] = {
  //   name: "QR Code",
  //   value: "{{qr_code}}",
  //   sample: "QR Code will appear here"
  // };

  mergeTags["header"] = {
    name: "Header",
    value: "{{header}}",
    sample: "Header image will appear here"
  };

  mergeTags["footer"] = {
    name: "Footer",
    value: "{{footer}}",
    sample: "Footer image will appear here"
  };

  mergeTags["current_date"] = {
    name: "Current Date",
    value: "{{current_date}}",
    sample: "Current Date"
  };

  // mergeTags["paymenttype_name"] = {
  //   name: "Payment Mode",
  //   value: "{{paymenttype_name}}",
  //   sample: "Payment Mode"
  // };
  // mergeTags["tracking_id"] = {
  //   name: "Tracking Id",
  //   value: "{{tracking_id}}",
  //   sample: "Tracking Id"
  // };
  // mergeTags["payment_date"] = {
  //   name: "Payment Date",
  //   value: "{{payment_date}}",
  //   sample: "Payment Date"
  // };
  mergeTags["updated_at"] = {
    name: "Confirmation Date",
    value: "{{updated_at}}",
    sample: "Confirmation Date"
  };
  // mergeTags["currency"] = {
  //   name: "Currency",
  //   value: "{{currency}}",
  //   sample: "Currency"
  // };
  mergeTags["total_amount"] = {
    name: "Total Paid Amount",
    value: "{{total_amount}}",
    sample: "Total Paid Amount"
  };
  // mergeTags["amount_word"] = {
  //   name: "Amount In word",
  //   value: "{{amount_word}}",
  //   sample: "Amount In word"
  // };

    mergeTags["ticket_message"] = {
    name: "Ticket Message will appear here",
    value: "{{ticket_message}}",
    sample: "Ticket Message will appear here"
  };

  mergeTags["conference_fees"] = {
    name: "Registration Amount",
    value: "{{conference_fees}}",
    sample: "Registration Amount"
  };

  mergeTags["gst_amount"] = {
    name: "Tax Amount",
    value: "{{gst_amount}}",
    sample: "Tax Amount"
  };

  mergeTags["cgst_amount"] = {
    name: "CGST Amount",
    value: "{{cgst_amount}}",
    sample: "CGST Amount"
  };

  mergeTags["sgst_amount"] = {
    name: "SGST Amount",
    value: "{{sgst_amount}}",
    sample: "SGST Amount"
  };



  console.log("Field Name", fieldName);
  console.log("Field Label", fieldLabels);


  // Open the modal when the component first loads
  useEffect(() => {
    if (!template) {
      setTemp(true);
    }
    else {
      setTempName(template.template_name);
      setTempSubject(template.template_subject);
    }
    fetchFields();

  }, [template]); // Adding 'template' to the dependency array

  const fetchFields = async () => {
    try {
      const token = getToken();
      const response = await axios.get(`${BackendAPI}/reguser/getField`, {
        headers: {
          Authorization: `Bearer ${token}` // Include the token in the Authorization header
        }
      });
      const fieldsData = response.data.Fields;
      const fieldLabels = fieldsData.map(field => field.cs_field_label);
      const fieldName = fieldsData.map(field => field.cs_field_name);

      console.log("Data:", fieldsData);

      // setData(fieldsData);
      setFieldLabels(fieldLabels);
      setFieldName(fieldName);

      // console.log('Id:', fieldName);
    } catch (error) {
      console.error('Error fetching Fields:', error);
    }
  };


  // Load design when the editor loads
  const onLoad = () => {
    if (emailEditorRef.current) {
      if (template && template.template_draft_design) {
        // Load the draft design if available
        emailEditorRef.current.editor.loadDesign(JSON.parse(template.template_draft_design));
      } else if (template && template.template_default_design) {
        // Fallback to the default design
        emailEditorRef.current.editor.loadDesign(JSON.parse(template.template_default_design));
      } else {
        // Load the hardcoded Template as the last resort
        emailEditorRef.current.editor.loadDesign(Template);
      }
    }
  };

  const exportHtml = async () => {
    emailEditorRef.current.editor.exportHtml(async (data) => {
      const { design, html } = data;

      try {
        const token = getToken();
        const response = await axios.post(`${BackendAPI}/editor/savetemplate`, {
          html,
          design: JSON.stringify(design), // Convert design to JSON string
          tempName,
          tempSubject
        }, {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
        });
        SweetAlert.fire({
          title: 'Success!',
          text: 'Template saved successfully!',
          icon: 'success',
          timer: 3000,
          showConfirmButton: false,
          allowOutsideClick: false,
          allowEscapeKey: false
        }).then((result) => {
          if (result.dismiss === SweetAlert.DismissReason.timer) {
            navigate(`${process.env.PUBLIC_URL}/event/manage-template/Consoft`);
          }
        });

        console.log('Save response', response.data);
      } catch (error) {
        console.error('Error saving template:', error);
      }
    });
  };

  // Function to handle opening and closing the modal
  const toggleModal = () => setTestModal(!testmodal);

  // Function to handle email input change
  const handleEmailChange = (e) => setEmail(e.target.value);

  const testcontent = async () => {
    emailEditorRef.current.editor.exportHtml(async (data) => {
      const { design, html } = data;

      try {
        const token = getToken();
        const response = await axios.post(`${BackendAPI}/editor/testemail`, {
          design: JSON.stringify(design),
          html,
          tempSubject,
          email,
        }, {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
        });

        await SweetAlert.fire({
          title: 'Success!',
          text: 'Test Email sent successfully!',
          icon: 'success',
          timer: 3000,
          showConfirmButton: false,
          allowOutsideClick: false,
          allowEscapeKey: false
        });

        console.log('Email response:', response.data);
      } catch (error) {
        console.error('Error sending test email:', error);
        toast.error('Failed to send test email. Please try again later.');
      }
    });

    toggleModal();
  };


  const drafcontent = async () => {
    emailEditorRef.current.editor.exportHtml(async (data) => {
      const { design, html } = data;

      try {
        const token = getToken();
        const response = await axios.post(`${BackendAPI}/editor/drafttemplate`, {
          design: JSON.stringify(design), // Convert design to JSON string
          html,
          temp_id: template.template_id
        }, {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
        });
        SweetAlert.fire({
          title: 'Info!',
          text: 'Template drafted successfully!',
          icon: 'info',
          timer: 3000,
          showConfirmButton: false,
          allowOutsideClick: false,
          allowEscapeKey: false
        }).then((result) => {
          // if (result.dismiss === SweetAlert.DismissReason.timer) {
          //   navigate(`${process.env.PUBLIC_URL}/event/manage-template/Consoft`);
          // }
        });

        console.log('Save response', response.data);
      } catch (error) {
        console.error('Error saving template:', error);
      }
    });
  };

  const savecontent = async () => {
    emailEditorRef.current.editor.exportHtml(async (data) => {
      const { design, html } = data;

      try {
        const token = getToken();
        const response = await axios.post(`${BackendAPI}/editor/publishTemplate`, {
          design: JSON.stringify(design), // Convert design to JSON string
          html,
          temp_id: template.template_id,
          tempName,
          tempSubject
        }, {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
        });
        SweetAlert.fire({
          title: 'Success!',
          text: 'Template saved successfully!',
          icon: 'success',
          timer: 3000,
          showConfirmButton: false,
          allowOutsideClick: false,
          allowEscapeKey: false
        }).then((result) => {
          if (result.dismiss === SweetAlert.DismissReason.timer) {
            navigate(`${process.env.PUBLIC_URL}/event/manage-template/Consoft`);
          }
        });

        console.log('Save response', response.data);
      } catch (error) {
        console.error('Error saving template:', error);
      }
    });
  };

  const onReady = () => {
    emailEditorRef.current.editor.registerCallback(
      'image',
      async (file, done) => {
        const fileBlob = file.attachments[0];

        setSelectedFiles([fileBlob]);

        const reader = new FileReader();
        reader.onloadend = async () => {
          const binaryData = reader.result;

          try {
            const formData = new FormData();
            formData.append('file', new Blob([binaryData], { type: fileBlob.type }), fileBlob.name);
            const token = getToken();

            const response = await axios.post(`${BackendAPI}/editor/uploads`, formData, {
              headers: {
                'Content-Type': 'multipart/form-data',
                Authorization: `Bearer ${token}`
              },
            });
            const imageUrl = `${BackendPath}${response.data?.filelink}`;
            done({ progress: 100, url: imageUrl });
          } catch (error) {
            console.error('Upload failed:', error);
            done({ progress: 0 });
          }
        };

        reader.readAsArrayBuffer(fileBlob);
      }
    );
    console.log('Editor is ready');
  };

  // Custom appearance settings for free version
  const appearance = {
    theme: 'modern_light',
    panels: {
      tools: {
        backgroundColor: '#282c34',
        color: '#ffffff',
        dock: 'left'
      },
      properties: {
        backgroundColor: '#333',
        color: '#fff',
      },
    },
    fontFamily: 'Poppins, sans-serif',
    color: {
      color: '#ffffff',
      backgroundColor: '#000000',
    },
  };

  const projectId = '7879';

  // Optional: Button to load design manually
  const loadDesignManually = () => {
    if (emailEditorRef.current) {
      emailEditorRef.current.editor.loadDesign(JSON.parse(template.template_draft_design));
    }
  };

  // Optional: Button to load design manually
  const loadBasicDesignManually = () => {
    if (emailEditorRef.current) {
      emailEditorRef.current.editor.loadDesign(Empty); // Clear the editor content
    }
  };

  const tempModal = () => {
    setTemp(false);
  };

  const handleCancel = () => {
    setModal(true);
  };

  const handleNavigation = () => {
    navigate(`${process.env.PUBLIC_URL}/event/manage-template/Consoft`);
  };

  const onSubmit = (values) => {
    console.log('Form Values:', values);
    // Perform any actions with the form values here
    setTemp(false); // Close modal after submission
  };

  return (
    <Fragment>
      <Breadcrumbs mainTitle="Manage Templates" parent="Email" title="Templates" />
      <Container>
        <Card className="my-4 p-3 shadow-sm border-0">
          <Row className="align-items-center">
            <Col md="8" className="d-flex align-items-center">
              <span onClick={handleCancel} style={{ cursor: 'pointer', marginRight: '8px' }}>
                <FaArrowLeft />
              </span>

              {template && template.template_name ? (
                <h5 className="mb-0 text-start d-flex align-items-center">
                  {tempName}
                  <span className='ms-2' onClick={() => setTemp(true)} style={{ cursor: 'pointer' }}>
                    <FaEdit />
                  </span>
                </h5>
              ) : (
                <h5 className="mb-0 text-start d-flex align-items-center">
                  {tempName}
                  {tempName && (
                    <span className='ms-2' onClick={() => setTemp(true)} style={{ cursor: 'pointer' }}>
                      <FaEdit />
                    </span>
                  )}
                </h5>
              )}
            </Col>


            <Col md="4" className="text-end">
              <Button color="success"
                onClick={toggleModal}
                className='me-2'
                data-tooltip-id="tooltip"
                data-tooltip-content="Test Email"
                data-tooltip-event="click focus"
              >
                <FaPaperPlane />
              </Button>
              {!template && (
                <Button color="primary"
                  onClick={exportHtml}
                  className='me-2'
                  data-tooltip-id="tooltip"
                  data-tooltip-content="Publish"
                  data-tooltip-event="click focus"
                >
                  <FaRegSave />
                </Button>
              )}
              {template && (
                <Button color="primary"
                  onClick={savecontent}
                  className='me-2'
                  data-tooltip-id="tooltip"
                  data-tooltip-content="Publish"
                  data-tooltip-event="click focus"
                >
                  <FaRegSave />
                </Button>
              )}
              <Button color="warning"
                onClick={drafcontent}
                className='me-2'
                data-tooltip-id="tooltip"
                data-tooltip-content="Draft Changes"
                data-tooltip-event="click focus"
              >
                <RiDraftLine />
              </Button>
              {template && (
                <Button color="danger"
                  onClick={loadDesignManually}
                  className="me-2"
                  data-tooltip-id="tooltip"
                  data-tooltip-content="Reset template"
                  data-tooltip-event="click focus"
                >
                  <GrPowerReset />
                </Button>
              )}
              {!template && (
                <Button color="danger"
                  onClick={loadBasicDesignManually}
                  className="me-2"
                  data-tooltip-id="tooltip"
                  data-tooltip-content="Empty template"
                  data-tooltip-event="click focus"
                >
                  <GrPowerReset />
                </Button>
              )}
            </Col>
          </Row>
          <Tooltip id="tooltip" globalEventOff="click" />

        </Card>

        <Card>
          <Row>
            <Col>
              <div style={{ position: 'relative', height: '500px' }}>
                <EmailEditor
                  ref={emailEditorRef}
                  onLoad={onLoad} // Automatically load design on editor load
                  onReady={onReady}
                  options={{
                    appearance,
                    mergeTags: mergeTags,
                    projectId,
                  }}
                />
                <a
                  href="#"
                  onClick={(e) => e.preventDefault()} // Prevents the default anchor link behavior
                  className="custom-link"
                >
                  Consoft services
                </a>

              </div>
            </Col>
          </Row>
        </Card>

        <Modal centered="true" isOpen={temp}>
          <ModalHeader>Template Details</ModalHeader>
          <ModalBody>
            <Form
              onSubmit={onSubmit}
              initialValues={{ tempName, tempSubject }} // Set initial values for the form fields
              render={({ handleSubmit }) => (
                <form onSubmit={handleSubmit}>
                  <div style={{ marginBottom: '20px' }}>
                    <Label className='form-label' htmlFor="tempName">
                      <strong>Template Name</strong>
                      <span className='text-danger'>*</span>
                    </Label>
                    <Field
                      name="tempName"
                      validate={composeValidators(requiredValidator)}
                    >
                      {({ input, meta }) => (
                        <>
                          <input
                            {...input}
                            className="form-control"
                            type="text"
                            id="tempName"
                            onChange={(e) => {
                              input.onChange(e); // Trigger onChange of the Field component
                              setTempName(e.target.value); // Update local state
                            }}
                          />
                          {meta.error && meta.touched && <p className='d-block text-danger'>{meta.error}</p>}
                        </>
                      )}
                    </Field>
                  </div>

                  <div style={{ marginBottom: '20px' }}>
                    <Label className='form-label' htmlFor="tempSubject">
                      <strong>Template Subject</strong>
                      <span className='text-danger'>*</span>
                    </Label>
                    <Field
                      name="tempSubject"
                      validate={composeValidators(requiredValidator)}
                    >
                      {({ input, meta }) => (
                        <>
                          <Input
                            {...input}
                            className="form-control"
                            type="textarea"
                            id="tempSubject"
                            onChange={(e) => {
                              input.onChange(e); // Trigger onChange of the Field component
                              setTempSubject(e.target.value); // Update local state
                            }}
                          />
                          {meta.error && meta.touched && <p className='d-block text-danger'>{meta.error}</p>}
                        </>
                      )}
                    </Field>
                  </div>
                </form>
              )}
            />
          </ModalBody>
          <ModalFooter>
            <Button color="primary" onClick={tempModal}
              disabled={!tempName || !tempSubject || !tempName.trim() || !tempSubject.trim()}>
              Next
            </Button>
            <Button color="warning" onClick={handleNavigation}>
              Cancel
            </Button>
          </ModalFooter>
        </Modal>

        {/* Modal */}
        <Modal isOpen={modal} toggle={() => setModal(!modal)} centered>
          <ModalHeader toggle={() => setModal(!modal)}>Confirmation</ModalHeader>
          <ModalBody>
            <div>
              <p>
                Your changes will be discarded. Are you sure you want to cancel? Please remember to publish or save your changes as a draft to avoid losing any work.
              </p>

            </div>
          </ModalBody>
          <ModalFooter>
            <Button onClick={handleNavigation} color="warning">
              Yes
            </Button>
            {/* <Link to="/manage-facility/Consoft" className="btn btn-warning">Yes</Link> */}
            <Button color="primary" onClick={() => setModal(!modal)}>No</Button>
          </ModalFooter>
        </Modal>

        {/* Test email Modal */}

        <Modal isOpen={testmodal} toggle={toggleModal}>
          <ModalHeader toggle={toggleModal}>Send Test Email</ModalHeader>
          <ModalBody>
            <div>
              <label htmlFor="email"><strong>Enter email address:</strong></label>
              <Input
                type="email"
                id="email"
                placeholder="Enter recipient's email"
                value={email}
                onChange={handleEmailChange}
              />
            </div>
          </ModalBody>
          <ModalFooter>
            <Button color="primary" onClick={testcontent}>
              Send Email
            </Button>{' '}
            <Button color="warning" onClick={toggleModal}>
              Cancel
            </Button>
          </ModalFooter>
        </Modal>

      </Container>
    </Fragment>
  );
};

export default EmailTemplate;


// import React, { useRef, useState, useEffect, Fragment } from 'react';
// import { useNavigate, useLocation } from 'react-router-dom';
// import { Breadcrumbs } from '../AbstractElements';
// import EmailEditor from 'react-email-editor';
// // import EmailEditor from "@editex/react-email-editor";
// import axios from 'axios';
// import { Container, Row, Col, Button, Card } from 'reactstrap';
// import { Tooltip } from 'react-tooltip';
// import { BackendAPI, BackendPath } from '../api';
// import { getToken } from '../Auth/Auth';
// import { GrPowerReset } from "react-icons/gr";
// import { RiDraftLine } from "react-icons/ri";
// import { FaRegSave } from "react-icons/fa";
// import useAuth from '../Auth/protectedAuth';
// import Template from "./sample";
// import Empty from "./Empty";

// // Define the required validator
// const requiredValidator = value => (value ? undefined : 'This field is required');

// // Utility function to combine multiple validation functions
// const composeValidators = (...validators) => value =>
//   validators.reduce((error, validator) => error || validator(value), undefined);

// const EmailTemplate = (props) => {
//   useAuth();
//   const emailEditorRef = useRef(null);
//   const [selectedFiles, setSelectedFiles] = useState([]);
//   const location = useLocation();
//   const navigate = useNavigate();
//   const { template } = location.state || {};

//   console.log("Template", template);

//   // Load design when the editor loads
//   const onLoad = () => {
//     if (emailEditorRef.current) {
//       if (template && template.template_draft_design) {
//         // Load the draft design if available
//         emailEditorRef.current.editor.loadDesign(JSON.parse(template.template_draft_design));
//       } else if (template && template.template_default_design) {
//         // Fallback to the default design
//         emailEditorRef.current.editor.loadDesign(JSON.parse(template.template_default_design));
//       } else {
//         // Load the hardcoded Template as the last resort
//         emailEditorRef.current.editor.loadDesign(Template);
//       }
//     }
//   };


//   const exportHtml = async () => {
//     emailEditorRef.current.editor.exportHtml(async (data) => {
//       const { design, html } = data;

//       try {
//         const token = getToken();
//         const response = await axios.post(`${BackendAPI}/editor/savetemplate`, {
//           html,
//           design: JSON.stringify(design), // Convert design to JSON string
//         }, {
//           headers: {
//             'Content-Type': 'application/json',
//             Authorization: `Bearer ${token}`
//           },
//         });

//         console.log('Save response', response.data);
//       } catch (error) {
//         console.error('Error saving template:', error);
//       }
//     });
//   };

//   const drafcontent = async () => {
//     emailEditorRef.current.editor.exportHtml(async (data) => {
//       const { design, html } = data;

//       try {
//         const token = getToken();
//         const response = await axios.post(`${BackendAPI}/editor/drafttemplate`, {
//           design: JSON.stringify(design), // Convert design to JSON string
//           html,
//           temp_id: template.template_id
//         }, {
//           headers: {
//             'Content-Type': 'application/json',
//             Authorization: `Bearer ${token}`
//           },
//         });

//         console.log('Save response', response.data);
//       } catch (error) {
//         console.error('Error saving template:', error);
//       }
//     });
//   };

//   const savecontent = async () => {
//     emailEditorRef.current.editor.exportHtml(async (data) => {
//       const { design, html } = data;

//       try {
//         const token = getToken();
//         const response = await axios.post(`${BackendAPI}/editor/publishTemplate`, {
//           design: JSON.stringify(design), // Convert design to JSON string
//           html,
//           temp_id: template.template_id
//         }, {
//           headers: {
//             'Content-Type': 'application/json',
//             Authorization: `Bearer ${token}`
//           },
//         });

//         console.log('Save response', response.data);
//       } catch (error) {
//         console.error('Error saving template:', error);
//       }
//     });
//   };

//   const onReady = () => {
//     emailEditorRef.current.editor.registerCallback(
//       'image',
//       async (file, done) => {
//         const fileBlob = file.attachments[0];

//         setSelectedFiles([fileBlob]);

//         const reader = new FileReader();
//         reader.onloadend = async () => {
//           const binaryData = reader.result;

//           try {
//             const formData = new FormData();
//             formData.append('file', new Blob([binaryData], { type: fileBlob.type }), fileBlob.name);
//             const token = getToken();

//             const response = await axios.post(`${BackendAPI}/editor/uploads`, formData, {
//               headers: {
//                 'Content-Type': 'multipart/form-data',
//                 Authorization: `Bearer ${token}`
//               },
//             });
//             const imageUrl = `${BackendPath}${response.data?.filelink}`;
//             done({ progress: 100, url: imageUrl });
//           } catch (error) {
//             console.error('Upload failed:', error);
//             done({ progress: 0 });
//           }
//         };

//         reader.readAsArrayBuffer(fileBlob);
//       }
//     );
//     console.log('Editor is ready');
//   };

//   // Custom appearance settings for free version
//   const appearance = {
//     theme: 'modern_light',
//     panels: {
//       tools: {
//         backgroundColor: '#282c34',
//         color: '#ffffff',
//         dock: 'left'
//       },
//       properties: {
//         backgroundColor: '#333',
//         color: '#fff',
//       },
//     },
//     fontFamily: 'Poppins, sans-serif',
//     color: {
//       color: '#ffffff',
//       backgroundColor: '#000000',
//     },
//   };

//   const projectId = '7879';

//   // Optional: Button to load design manually
//   const loadDesignManually = () => {
//     if (emailEditorRef.current) {
//       emailEditorRef.current.editor.loadDesign(template.template_draft_design);
//     }
//   };

//   // Optional: Button to load design manually
//   const loadBasicDesignManually = () => {
//     if (emailEditorRef.current) {
//       emailEditorRef.current.editor.loadDesign(Empty); // Clear the editor content
//     }
//   };

//   return (
//     <Fragment>
//       <Breadcrumbs mainTitle="Manage Templates" parent="Email" title="Templates" />
//       {/* Inject a style block to hide the branding */}
//       <style>{`
//         .blockbuilder-branding {
//           display: none !important;
//         }
//       `}</style>
//       <Container>
//         <Card className="my-4 p-3 shadow-sm border-0">
//           <Row className="align-items-center">
//             <Col md="8">
//               {template && template.template_name ? (
//                 <h5 className="mb-2 text-start">{template.template_name}</h5>
//               ) : (
//                 <h5 className="mb-2 text-start">Create Template</h5>
//               )}
//             </Col>
//             <Col md="4" className="text-end">
//               {!template && (
//                 <Button color="primary"
//                   onClick={exportHtml}
//                   className='me-2'
//                   data-tooltip-id="tooltip"
//                   data-tooltip-content="Publish"
//                   data-tooltip-event="click focus"
//                 >
//                   <FaRegSave />
//                 </Button>
//               )}
//               {template && (
//                 <Button color="primary"
//                   onClick={savecontent}
//                   className='me-2'
//                   data-tooltip-id="tooltip"
//                   data-tooltip-content="Publish"
//                   data-tooltip-event="click focus"
//                 >
//                   <FaRegSave />
//                 </Button>
//               )}
//               <Button color="warning"
//                 onClick={drafcontent}
//                 className='me-2'
//                 data-tooltip-id="tooltip"
//                 data-tooltip-content="Draft Changes"
//                 data-tooltip-event="click focus"
//               >
//                 <RiDraftLine />
//               </Button>
//               {template && (
//                 <Button color="danger"
//                   onClick={loadDesignManually}
//                   className="me-2"
//                   data-tooltip-id="tooltip"
//                   data-tooltip-content="Reset template"
//                   data-tooltip-event="click focus"
//                 >
//                   <GrPowerReset />
//                 </Button>
//               )}
//               {!template && (
//                 <Button color="danger"
//                   onClick={loadBasicDesignManually}
//                   className="me-2"
//                   data-tooltip-id="tooltip"
//                   data-tooltip-content="Empty template"
//                   data-tooltip-event="click focus"
//                 >
//                   <GrPowerReset />
//                 </Button>
//               )}
//             </Col>
//           </Row>
//           <Tooltip id="tooltip" globalEventOff="click" />
//         </Card>

//         <Card>
//           <Row>
//             <Col>
//               <EmailEditor
//                 ref={emailEditorRef}
//                 onLoad={onLoad} // Automatically load design on editor load
//                 onReady={onReady}
//                 options={{
//                   appearance,
//                   mergeTags: {
//                     first_name: {
//                       name: "First Name",
//                       value: "{{cs_first_name}}",
//                       sample: "Fname will appear here"
//                     },
//                     last_name: {
//                       name: "Last Name",
//                       value: "{{cs_last_name}}",
//                       sample: "Lname will appear here"
//                     },
//                     company_name: {
//                       name: "Category Name",
//                       value: "{{cs_reg_category}}",
//                       sample: "Category name will appear here"
//                     },
//                     registration_number: {
//                       name: "Registration Number",
//                       value: "{{cs_regno}}",
//                       sample: "Resgistration number will appear here"
//                     }
//                   },
//                   projectId,
//                 }}
//               />
//             </Col>
//           </Row>
//         </Card>
//       </Container>
//     </Fragment>
//   );
// };

// export default EmailTemplate;

