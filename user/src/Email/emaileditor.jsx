import React, { useRef, useState, useEffect, Fragment } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Breadcrumbs } from '../AbstractElements';
import EmailEditor from 'react-email-editor';
import axios from 'axios';
import { Container, Row, Col, Button, Card, CardHeader } from 'reactstrap';
import { Tooltip } from 'react-tooltip';
import { BackendAPI, BackendPath } from '../api';
import { getToken } from '../Auth/Auth';
import { GrPowerReset } from "react-icons/gr";
import { RiDraftLine } from "react-icons/ri";
import { FaRegSave } from "react-icons/fa";
import useAuth from '../Auth/protectedAuth';
import Template from "./sample";
import Empty from "./Empty";

const EmailTemplate = (props) => {
  useAuth();
  const emailEditorRef = useRef(null);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const location = useLocation();
  const { template } = location.state || {};


  // Load design when the editor loads
  const onLoad = () => {
    if (emailEditorRef.current) {
      if (template && template.template_draft_design) {
        emailEditorRef.current.editor.loadDesign(template.template_draft_design);
      } else {
        emailEditorRef.current.editor.loadDesign(Template); // Load default design if no template is provided
      }
    }
  };
  const exportHtml = async () => {
    emailEditorRef.current.editor.exportHtml(async (data) => {
      const { design, html } = data;
      // console.log('exportHtml', html);
      // console.log('JSON', design);

      try {
        const token = getToken();
        const response = await axios.post(`${BackendAPI}/editor/savetemplate`, {
          html,
          design: JSON.stringify(design), // Convert design to JSON string
        }, {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
        });

        console.log('Save response', response.data);
      } catch (error) {
        console.error('Error saving template:', error);
      }
    });
  };

  const drafcontent = async () => {
    emailEditorRef.current.editor.exportHtml(async (data) => {
      const { design, html } = data;
      // console.log('exportHtml', html);
      // console.log('JSON', design);

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

        console.log('Save response', response.data);
      } catch (error) {
        console.error('Error saving template:', error);
      }
    });
  };

  const savecontent = async () => {
    emailEditorRef.current.editor.exportHtml(async (data) => {
      const { design, html } = data;
      // console.log('exportHtml', html);
      // console.log('JSON', design);

      try {
        const token = getToken();
        const response = await axios.post(`${BackendAPI}/editor/publishTemplate`, {
          design: JSON.stringify(design), // Convert design to JSON string
          html,
          temp_id: template.template_id
        }, {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
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
      emailEditorRef.current.editor.loadDesign(template.template_draft_design);
    }
  };

  // Optional: Button to load design manually
  const loadBasicDesignManually = () => {
    if (emailEditorRef.current) {
      emailEditorRef.current.editor.loadDesign(Empty); // Clear the editor content
    }
  };

  return (
    <Fragment>
      <Breadcrumbs mainTitle="Manage Templates" parent="Email" title="Templates" />
      <Container>
        <Card className="my-4 p-3 shadow-sm border-0">
          <Row className="align-items-center">
            <Col md="8">
              {template && template.template_name ? (
                <h5 className="mb-2 text-start">{template.template_name}</h5>
              ) : (
                <h5 className="mb-2 text-start">Create Template</h5>
              )}
            </Col>
            <Col md="4" className="text-end">
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
              <EmailEditor
                ref={emailEditorRef}
                onLoad={onLoad} // Automatically load design on editor load
                onReady={onReady}
                options={{
                  appearance,
                  mergeTags: {
                    first_name: {
                      name: "First Name",
                      value: "{{cs_first_name}}",
                      sample: "Fname will appear here"
                    },
                    last_name: {
                      name: "Last Name",
                      value: "{{cs_last_name}}",
                      sample: "Lname will appear here"
                    },
                    company_name: {
                      name: "Category Name",
                      value: "{{cs_reg_category}}",
                      sample: "Category name will appear here"
                    },
                    registration_number: {
                      name: "Registration Number",
                      value: "{{cs_regno}}",
                      sample: "Resgistration number will appear here"
                    }
                  },
                  tools: {
                    form: {
                      enabled: true
                    }
                  },
                }}
                projectId={projectId}
              />
            </Col>
          </Row>
        </Card>
      </Container>
    </Fragment>
  );
};

export default EmailTemplate;


