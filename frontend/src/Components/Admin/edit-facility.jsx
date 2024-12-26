import React, { Fragment, useState, useEffect } from 'react';
import { Container, Row, Col, Label, Button, Card, CardBody, Modal, ModalHeader, ModalBody, ModalFooter, Input, Popover, PopoverHeader, PopoverBody } from 'reactstrap';
import axios from 'axios';
import { BackendAPI, BackendPath } from '../../api';
import SweetAlert from 'sweetalert2';
import { Breadcrumbs } from '../../AbstractElements';
import { useNavigate, useLocation } from 'react-router-dom';
import { Field, Form } from 'react-final-form';
import debounce from 'lodash.debounce';
import { required, Img, FacName } from '../Utils/validationUtils'; // Ensure you import the Img function correctly
import useAuth from '../../Auth/protectedAuth';
import { getToken } from '../../Auth/Auth';



const composeValidators = (...validators) => value =>
  validators.reduce((error, validator) => error || validator(value), undefined);


const EditFacility = () => {
  useAuth();
  const [data, setData] = useState([]);
  const [files, setFiles] = useState({ brightModeIcon: '', darkModeIcon: '' });
  const [selectedImage, setSelectedImage] = useState(null);
  const [selectedPdf, setSelectedPdf] = useState(null);
  const [imageError, setImageError] = useState('');
  const [pdfError, setPdfError] = useState('');
  const [nameValidationMessage, setNameValidationMessage] = useState('');
  const [nameTouched, setNameTouched] = useState(false);
  const [modal, setModal] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { item } = location.state || {}; // Default to empty object
  const [currentName, setCurrentName] = useState('');
  const [loading, setLoading] = useState(true);
  const [logoOpen, setLogoOpen] = useState(false);
  const [imageOpen, setImageOpen] = useState(false);
  const [iconPreviewUrl, setIconPreviewUrl] = useState(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState(null);


  console.log(item);


  // useEffect(() => {
  //   fetchfacility(item.cs_facility_id);
  // }, [item.cs_facility_id]);

  // const fetchfacility = async (facilityId) => {
  //   try {
  //     const token = getToken();
  //     console.log(token);
  //     const response = await axios.post(
  //       `${BackendAPI}/user/editfacility/${facilityId}`,
  //       {},
  //       { // empty data payload, if needed you can remove it.
  //         headers: {
  //           Authorization: `Bearer ${token}`
  //         }
  //       }
  //     );
  //     setData(response.data);
  //     setCurrentName(response.data[0].cs_display_name); // Set the current name
  //     setLoading(false);
  //   } catch (error) {
  //     console.error('Error fetching facility:', error);
  //     setLoading(false);
  //   }
  // };

  const handleImageChange = async (event, type) => {
    const file = event.target.files[0];
    if (file) {
      try {
        await Img(file);
        setFiles(prevFiles => ({ ...prevFiles, [type]: file }));
        setSelectedImage(file);
        setImageError('');
        const url = URL.createObjectURL(file);
        setIconPreviewUrl(url);
      } catch (error) {
        setSelectedImage(null);
        setImageError(error);
      }
    }
  };

  // const handlePdfChange = async (event, type) => {
  //   const file = event.target.files[0];
  //   if (file) {
  //     try {
  //       await Img(file); // Assuming Img also validates PDFs
  //       setFiles(prevFiles => ({ ...prevFiles, [type]: file }));
  //       setSelectedPdf(file);
  //       setPdfError('');
  //     } catch (error) {
  //       setSelectedPdf(null);
  //       setPdfError(error);
  //     }
  //   }
  // };

  const validatename = debounce(async (value) => {
    if (value === item.cs_display_name) {
      setNameValidationMessage('');
      return;
    }
    try {
      const token = getToken();
      const response = await axios.post(`${BackendAPI}/login/check-facility-name`, { dName: value }, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      if (!response.data.available) {
        setNameValidationMessage('Facility name already exists');
      } else {
        setNameValidationMessage('');
      }
    } catch (error) {
      console.error('Error checking name availability:', error);
      setNameValidationMessage('Error checking name availability');
    }
  }, 500);

  useEffect(() => {
    if (nameTouched) {
      validatename(item.cs_display_name);
    }
    return () => {
      validatename.cancel();
    };
  }, [item.cs_display_name, nameTouched]);

  const onSubmit = async (formData) => {
    if (nameValidationMessage) {
      return; // Prevent form submission if there is a validation error
    }
    try {
      const id = item.cs_facility_id;
      const formDataToSend = new FormData();
      Object.keys(formData).forEach(key => {
        formDataToSend.append(key, formData[key]);
      });
      formDataToSend.append('brightModeIcon', files.brightModeIcon);
      formDataToSend.append('Facility_id', id);

      const token = getToken();
      await axios.post(`${BackendAPI}/user/updateFacility`, formDataToSend, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      SweetAlert.fire({
        title: 'Success!',
        text: 'Facility Updated successfully!',
        icon: 'success',
        timer: 3000,
        showConfirmButton: false,
        allowOutsideClick: false,
        allowEscapeKey: false
      }).then((result) => {
        if (result.dismiss === SweetAlert.DismissReason.timer) {
          navigate(`${process.env.PUBLIC_URL}/oniste/manage-facility/Consoft`);
        }
      });
    } catch (error) {
      console.error('Error updating facility:', error.message);
    }
  };

  // const initialValues = {
  //   dName: item.length > 0 ? item.cs_display_name : '',
  //   facilityType: item.length > 0 ? item.cs_type : ''
  // };

  const handleCancel = () => {
    setModal(true);
  };

  const handleNavigation = () => {
    navigate(`${process.env.PUBLIC_URL}/onsite/manage-facility/Consoft`);
  };

  return (
    <Fragment>
      <Breadcrumbs parentClickHandler={handleNavigation} mainTitle="Edit Facility" parent="Manage Facility" title="Create Edit" />
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
                            name="dName"
                            validate={composeValidators(required, FacName, async (value) => {
                              if (value !== item.cs_display_name) {
                                return validatename(value);
                              }
                            })}
                            initialValue={item.cs_display_name}
                          >
                            {({ input, meta }) => (
                              <div>
                                <Label className='form-label' for="displayname"><strong>Facility Name <span className="red-asterisk">*</span></strong></Label>
                                <input
                                  {...input}
                                  className="form-control"
                                  id="displayname"
                                  type="text"
                                  placeholder="Enter facility name"
                                  onChange={(e) => {
                                    input.onChange(e);
                                    setNameTouched(true);
                                  }}
                                />
                                {nameValidationMessage && <div className="text-danger">{nameValidationMessage}</div>}
                                {meta.error && meta.touched && <p className='d-block text-danger'>{meta.error}</p>}
                              </div>
                            )}
                          </Field>
                        </Col>
                        
                        {item.cs_type !== "workshop" ? (
                        <Col md="4" className="mb-3">
                          <Label className='form-label' for="type"><strong>Facility Type <span className="red-asterisk">*</span></strong></Label>
                          <Field name="facilityType" validate={required} initialValue={item.cs_type}
                          >
                            {({ input, meta }) => (
                              <div>
                                <select {...input} className="form-control" id="selectmethod">
                                  <option value="">Select type</option>
                                  {/* <option value="workshop">Workshop</option> */}
                                  <option value="food">Food</option>
                                  <option value="certificate">Certificate</option>
                                  <option value="gift">Checkin/Gift</option>
                                </select>
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
                        {/* <Col md="4" className="mb-3">
                          <Label for="brightModeIcon"><strong>Icon <span className="red-asterisk">*</span></strong></Label>
                          <Input
                            type="file"
                            name="brightmode"
                            onChange={(event) => handleImageChange(event, 'brightModeIcon')}
                            required={!data.length || !data[0].cs_logo_image_name}
                          />
                          {imageError && <p style={{ color: 'red' }}>{imageError}</p>}
                          {data.length > 0 && <p style={{ color: 'green' }}>Current icon: {data[0].cs_logo_image_url}</p>}
                        </Col> */}

                        {/* Facility Icon */}
                        <Col md="4" className="mb-3">
                          <div>
                            <Label for="brightModeIcon"><strong>Facility Icon <span className="red-asterisk">*</span></strong></Label>
                            <Input
                              type="file"
                              name="brightmode"
                              onChange={(event) => handleImageChange(event, 'brightModeIcon')}
                              required={!item.cs_logo_image_url}
                            />
                            {imageError && <p style={{ color: 'red' }}>{imageError}</p>}
                            {!imageError && (
                              <p
                                id="iconAvailable"
                                style={{ color: 'green', cursor: 'pointer' }}
                                onMouseEnter={() => setLogoOpen(true)}
                                onMouseLeave={() => setLogoOpen(false)}
                              >
                                ✔️ Facility Icon Preview
                              </p>
                            )}

                            <Popover
                              placement="right"
                              isOpen={logoOpen}
                              target="iconAvailable"
                              toggle={() => setLogoOpen(!logoOpen)}
                            >
                              <PopoverHeader>Facility Icon Preview</PopoverHeader>
                              {/* <PopoverBody>
                                                                <img src={`${BackendPath}${item.exh_logo}`} alt="Current Exhibitor Icon" style={{ maxWidth: '200px' }} />
                                                            </PopoverBody> */}
                              <PopoverBody>
                                {iconPreviewUrl ? (
                                  <img src={iconPreviewUrl} alt="Current facility Icon" style={{ maxWidth: '200px' }} />
                                ) : (
                                  <img src={`${BackendPath}${item.cs_logo_image_url}`} alt="Current facility Icon" style={{ maxWidth: '200px' }} />
                                )}
                              </PopoverBody>
                            </Popover>
                          </div>
                          {!selectedImage && (
                            <small className="form-text text-muted">
                              <strong>Image Size:</strong> 200KB Max <br />
                              <strong>Dimensions:</strong> 600(H) × 600(W) <br />
                              <strong>Image Type:</strong> PNG
                            </small>
                          )}
                        </Col>
                        {/* 
                        <Col md="4" className="mb-3">
                          <Label for="darkModeIcon"><strong>Dark Mode Icon <span className="red-asterisk">*</span></strong></Label>
                          <Input
                            type="file"
                            name="darkmode"
                            onChange={(event) => handlePdfChange(event, 'darkModeIcon')}
                            required={!data.length || !data[0].cs_logo_darkmode_image_name}
                          />
                          {pdfError && <p style={{ color: 'red' }}>{pdfError}</p>}
                          {data.length > 0 && <p style={{ color: 'green' }}>Current icon: {data[0].cs_logo_darkmode_image_name}</p>}
                        </Col> */}
                      </Row>


                      <Button color="primary" className='me-2'>Update</Button>
                      <Button color="warning" onClick={handleCancel}>Cancel</Button>
                    </form>
                  )}
                </Form>
              </CardBody>
            </Card>
          </Col>
        </Row>
      </Container>

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
          {/* <Link to="/App-user/Consoft" className="btn btn-warning">Yes</Link> */}
          <Button color="primary" onClick={() => setModal(!modal)}>No</Button>
        </ModalFooter>
      </Modal>
    </Fragment>
  );
};

export default EditFacility;
