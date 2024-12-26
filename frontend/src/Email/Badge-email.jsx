import React, { Fragment, useState, useEffect, useContext } from 'react';
import { Container, Row, Col, Label, Input, Button, Card, CardBody, Modal, ModalHeader, ModalBody, ModalFooter, CardHeader, PopoverBody, UncontrolledPopover } from 'reactstrap';
import SweetAlert from 'sweetalert2';
import Select from 'react-select';
import { MdDelete, MdInfoOutline } from "react-icons/md";
import axios from 'axios';
import { BackendAPI } from '../api';
import { Breadcrumbs } from '../AbstractElements';
import { useNavigate } from 'react-router-dom';
import { getToken } from '../Auth/Auth';
import useAuth from '../Auth/protectedAuth';
import { Form, Field } from 'react-final-form';
import { required } from '../Components/Utils/validationUtils';
import { FaPaperPlane } from "react-icons/fa";
import jsPDF from 'jspdf';
import QRCode from 'qrcode';
import ReactQuill from 'react-quill';
import { toast } from 'react-toastify';
import { PermissionsContext } from '../contexts/PermissionsContext';

const composeValidators = (...validators) => value =>
  validators.reduce((error, validator) => error || validator(value), undefined);

const PX_TO_MM = 0.264583; // Conversion factor from pixels to mm

const BadgeEmail = () => {
  useAuth();
  const [modal, setModal] = useState(false);
  const navigate = useNavigate();
  const [catData, setCatData] = useState([]);
  const [userData, setUserData] = useState([]);
  const [emailData, setEmailData] = useState([]);
  const [selectedCat, setSelectedCat] = useState(null);
  const [nameValidationMessage, setNameValidationMessage] = useState('');
  const [files, setFiles] = useState([]);
  const [badgeVisible, setBadgeVisible] = useState(false);
  const [QRVisible, setQRVisible] = useState(false);
  const [value, setValue] = useState('');
  const { permissions } = useContext(PermissionsContext);

  console.log("UserData:", userData);

  const emailAddresses = userData.map(user => user.cs_email);
  console.log("Email Addresses:", emailData);

  const regNo = userData.map(user => user.cs_regno);
  console.log("Reg No:", regNo);



  useEffect(() => {
    fetchCat();
  }, [permissions]);

    // Extract AdminSettingPermissions component
    const BadgeEMail = permissions['Badge EMail'];

  const fetchCat = async () => {
    try {
      const token = getToken();
      const response = await axios.get(`${BackendAPI}/category/getCat`, {
        headers: {
          Authorization: `Bearer ${token}`
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

  const onSubmit = async (values) => {
    const selectedCategory = values.category ? values.category.map(option => option.value) : [];
    const formData = new FormData();
    formData.append('Subject', values.Subject);
    formData.append('Body', value);
    formData.append('Badge', badgeVisible ? "1" : "0");
    formData.append('QR', QRVisible ? "1" : "0");
    // formData.append('To', userData.cs_email);

    if (values.startDate) {
      formData.append('startDate', values.startDate);
    }
    if (values.endDate) {
      formData.append('endDate', values.endDate);
    }


    files.forEach((file, index) => {
      formData.append('attachments', file);
    });

    // if (badgeVisible) {
    //   const pdfs = await generateBadgePDFs(values);
    //   pdfs.forEach((pdfBlob, index) => {
    //     formData.append(`badgeAttachment`, pdfBlob, `badge_${index}.pdf`);
    //     formData.append(`To`, emailAddresses);
    //   });
    // }
    if (badgeVisible) {
      const pdfs = await generateBadgePDFs(values);

      if (!Array.isArray(pdfs) || pdfs.length === 0) {
        toast.error('Please design the badge first.');
        return;
      }


      pdfs.forEach(async (pdfBlob, index) => {
        console.log("index", emailAddresses[index]);
        formData.append(`badgeAttachment`, pdfBlob, `badge_${regNo[index]}.pdf`);
        formData.append(`To`, emailAddresses[index] || ''); // Using a fallback to empty string if email is undefined
        formData.append(`RegNo`, regNo[index] || ''); // Using a fallback to empty string if regno is undefined
      });
    }


    try {
      const token = getToken();
      await axios.post(`${BackendAPI}/sendgrid/bulk-badge`, formData, {
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
      }).then(() => {
        // navigate(`${process.env.PUBLIC_URL}/roles-permission/Consoft`);
      });
    } catch (error) {
      console.error('Error sending mail:', error);
    }
  };

  const handleCancel = () => {
    setModal(true);
  };

  const handleNavigation = () => {
    navigate(`${process.env.PUBLIC_URL}/roles-permission/Consoft`);
  };

  const handleImageChange = (event) => {
    const newFiles = Array.from(event.target.files);
    setFiles(newFiles);
  };

  const generateBadgePDFs = async (values) => {
    try {
      const category = values.category ? values.category[0].label : '';
      const token = getToken();
      const response = await axios.post(`${BackendAPI}/badge/getbadgefileds`, { category }, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      const apibadgeDataResponse = response.data.badgedata;
      const apiuserDataResponse = response.data.userData;
      const emailData = apiuserDataResponse.cs_email;

      setEmailData(emailData);
      setUserData(apiuserDataResponse);

      emailAddresses = userData.map(user => user.cs_email);
      console.log("Email Addresses1:", emailAddresses);

      regNo = userData.map(user => user.cs_regno);
      console.log("Reg No1:", regNo);

      const pdfs = await Promise.all(apiuserDataResponse.map(async (user) => {
        const badgeDataForUser = JSON.parse(JSON.stringify(apibadgeDataResponse));

        badgeDataForUser.badge_fields.forEach(field => {
          if (user.hasOwnProperty(field.cs_field_name) && user[field.cs_field_name]) {
            field.cs_field_name = typeof user[field.cs_field_name] === 'string'
              ? user[field.cs_field_name].trim()
              : String(user[field.cs_field_name]);
          }
          if (field.cs_field_name === "fullname") {
            const fullName = user.cs_title ? `${user.cs_title} ${user.cs_first_name} ${user.cs_last_name}` : `${user.cs_first_name} ${user.cs_last_name}`;
                    field.cs_field_name = fullName;
          }
        });

        const badgeList = [badgeDataForUser];
        return generatePDFFromBadgeListforList(badgeList);
      }));

      return pdfs;
    } catch (error) {
      console.error('Error generating badge data:', error);
      if (error.response && error.response.data && error.response.data.error) {
        console.error(error.response.data.error);
      } else {
        console.error('An unexpected error occurred while fetching badge data. Please try again later.');
      }
    }
  };

  const generatePDFFromBadgeListforList = async (badgeList) => {
    try {
      const firstBadgeData = badgeList[0];
      const { width, height, orientation, badge_fields } = firstBadgeData;
      const numericWidth = parseFloat(width) * PX_TO_MM;
      const numericHeight = parseFloat(height) * PX_TO_MM;

      const pdf = new jsPDF({
        orientation: orientation,
        unit: 'mm',
        format: [numericWidth, numericHeight]
      });

      pdf.deletePage(1);

      for (let i = 0; i < badgeList.length; i++) {
        const badgeData = badgeList[i];
        const { badge_fields } = badgeData;

        pdf.addPage();

        const backgroundImageField = badge_fields.find(field => field.cs_field_type_id === 'backgroundimage');
        if (backgroundImageField) {
          const backgroundImageUrl = backgroundImageField.cs_field_content;
          const backgroundImageX = parseFloat(backgroundImageField.cs_field_position_x) / 3.78;
          const backgroundImageY = parseFloat(backgroundImageField.cs_field_position_y) / 3.78;
          const pageWidth = parseFloat(backgroundImageField.cs_field_width) / 3.78;
          const pageHeight = parseFloat(backgroundImageField.cs_field_height) / 3.78;
          const imageData = await loadImageAsBase64(backgroundImageUrl);
          pdf.addImage(imageData, 'JPEG', backgroundImageX, backgroundImageY, pageWidth, pageHeight);
        }

        await Promise.all(badge_fields.map(async (field) => {
          switch (field.cs_field_type_id) {
            case 'text':
            case 'number':
              let fontSize = parseFloat(field.cs_text_size);
              const containerX = parseFloat(field.cs_field_position_x) / 3.78;
              const containerY = parseFloat(field.cs_field_position_y) / 3.78;
              const containerWidth = parseFloat(field.cs_field_width) / 3.78;
              const containerHeight = parseFloat(field.cs_field_height) / 3.78;
              pdf.setFontSize(fontSize);
              const centerX = containerX + containerWidth / 2;
              const centerY = containerY + containerHeight / 2;
              const textWidth = pdf.getStringUnitWidth(field.cs_field_name) * fontSize / pdf.internal.scaleFactor;
              const textX = centerX - (textWidth / 2);
              const textY = centerY + (fontSize / 4);
              pdf.text(textX, textY, field.cs_field_name);
              break;

            case 'customtext':
              let customFontSize = parseFloat(field.cs_text_size);
              const customContainerX = parseFloat(field.cs_field_position_x) / 3.78;
              const customContainerY = parseFloat(field.cs_field_position_y) / 3.78;
              const customcontainerWidth = parseFloat(field.cs_field_width) / 3.78;
              const customcontainerHeight = parseFloat(field.cs_field_height) / 3.78;
              pdf.setFontSize(customFontSize);
              const customCenterX = customContainerX + customcontainerWidth / 2;
              const customCenterY = customContainerY + customcontainerHeight / 2;
              const customTextWidth = pdf.getStringUnitWidth(field.cs_field_label) * customFontSize / pdf.internal.scaleFactor;
              const customTextX = customCenterX - (customTextWidth / 2);
              const customTextY = customCenterY + (customFontSize / 4);
              pdf.text(customTextX, customTextY, field.cs_field_label);
              break;

            case 'fullname':
              let fullNameFontSize = parseFloat(field.cs_text_size);
              const fullNameContainerX = parseFloat(field.cs_field_position_x) / 3.78;
              const fullNameContainerY = parseFloat(field.cs_field_position_y) / 3.78;
              const fullNamecontainerWidth = parseFloat(field.cs_field_width) / 3.78;
              const fullNamecontainerHeight = parseFloat(field.cs_field_height) / 3.78;
              pdf.setFontSize(fullNameFontSize);
              const fullNameCenterX = fullNameContainerX + fullNamecontainerWidth / 2;
              const fullNameCenterY = fullNameContainerY + fullNamecontainerHeight / 2;
              const fullNameTextWidth = pdf.getStringUnitWidth(field.cs_field_name) * fullNameFontSize / pdf.internal.scaleFactor;
              const fullNameTextX = fullNameCenterX - (fullNameTextWidth / 2);
              const fullNameTextY = fullNameCenterY + (fullNameFontSize / 4);
              pdf.text(fullNameTextX, fullNameTextY, field.cs_field_name);
              break;

            case 'image':
              const imageX = parseFloat(field.cs_field_position_x) / 3.78;
              const imageY = parseFloat(field.cs_field_position_y) / 3.78;
              const imageWidth = parseFloat(field.cs_field_width) / 3.78;
              const imageHeight = parseFloat(field.cs_field_height) / 3.78;
              const imageUrl = field.cs_field_content;
              const imageData = await loadImageAsBase64(imageUrl);
              pdf.addImage(imageData, 'JPEG', imageX, imageY, imageWidth, imageHeight);
              break;

            case 'qr':
              const qrData = field.cs_field_name.toString();
              const qrX = parseFloat(field.cs_field_position_x) / 3.78;
              const qrY = parseFloat(field.cs_field_position_y) / 3.78;
              const qrSizeWidth = parseFloat(field.cs_field_width) / 3.78;
              const qrSizeHeight = parseFloat(field.cs_field_height) / 3.78;
              const qrOptions = {
                errorCorrectionLevel: 'H',
                margin: 0,
                width: qrSizeWidth,
                height: qrSizeHeight,
                scale: 1
              };
              try {
                const qrImage = await QRCode.toDataURL(qrData);
                pdf.addImage(qrImage, 'PNG', qrX, qrY, qrSizeWidth, qrSizeHeight);
              } catch (error) {
                console.error('Error generating QR code:', error);
              }
              break;

            default:
              break;
          }
        }));
      }
      // pdf.save('badges.pdf');
      const pdfBlob = new Blob([pdf.output('blob')], { type: 'application/pdf' });
      return pdfBlob;
    } catch (error) {
      console.error('Error generating PDF:', error);
    }
  };

  const loadImageAsBase64 = (url) => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'Anonymous';
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);
        const dataURL = canvas.toDataURL('image/png');
        resolve(dataURL);
      };
      img.onerror = () => {
        reject(new Error('Failed to load image'));
      };
      img.src = url;
    });
  };

  return (
    <Fragment>
      <Breadcrumbs mainTitle={
        <>
          Badge Email
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
              Send a bulk badge email (as per the badge set in Manage Badge) to users in a selected 
              category or within a specified date range (users registered between those dates). <br/>
              The email can include their badge or only a QR code in PDF format.
            </PopoverBody>
          </UncontrolledPopover>
        </>
      } parent="Onsite App" title="Badge Email" />
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
                        </Col>
                        {/* <Col md="6 mb-3">
                          <Label className='form-label' for="to"><strong>To: *</strong></Label>
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
                          <Label className='form-label' for="subject"><strong>Subject: <span className="red-asterisk">*</span></strong></Label>
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

                      {/* <Row>
                        <Col md="6 mb-3">
                          <Label for="attachment"><strong>Attachment:</strong></Label>

                          <Field name="Attachment">
                            {({ input }) => (
                              <Input type="file" name="attachment" onChange={handleImageChange} multiple />

                            )}
                          </Field>
                        </Col>
                      </Row> */}
                      <Row>

                        <div className="form">
                          <input id="badge" type="checkbox" onChange={(e) => setBadgeVisible(e.target.checked)} checked={badgeVisible} />
                          <label className='form-check-label' style={{ marginLeft: '10px' }} htmlFor="badge"><strong>Confirm to send Badge in mail</strong></label>
                        </div>

                      </Row>

                      <Row>

                        <div className="form">
                          <input id="qr" type="checkbox" onChange={(e) => setQRVisible(e.target.checked)} checked={QRVisible} />
                          <label className='form-check-label' style={{ marginLeft: '10px' }} htmlFor="qr"><strong>Confirm to send QR in mail</strong></label>
                        </div>

                      </Row>









                      <Button color='primary' type='submit' className="me-2 mt-3" > <FaPaperPlane style={{ marginRight: '8px' }}/>
                        Send</Button>
                      <Button color='warning' onClick={handleCancel} className="mt-3" >Cancel</Button>
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

export default BadgeEmail;