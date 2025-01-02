import React, { Fragment, useState, useEffect } from 'react';
import axios from 'axios';
import {
  Card,
  CardBody,
  CardTitle,
  Row,
  Col,
  Button,
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
  FormGroup,
  Label,
  Input,
  CardFooter,
  Container
} from 'reactstrap';
import './BadgeConfiguration.css'; // Import custom CSS for styling
import { getToken } from '../../Auth/Auth';
import { toast } from 'react-toastify';
import { BackendAPI } from '../../api/index';
import { useNavigate } from 'react-router-dom';
import { useLocation } from 'react-router-dom';
import Select from 'react-select';
import { Breadcrumbs } from '../../AbstractElements';


const Badgeconfiguration = () => {
  const CM_TO_PX = 37.795276;
  const PX_TO_CM = 0.0264583333;
  const [badgeType, setBadgeType] = useState('Single');
  const [badgeSize, setBadgeSize] = useState('A4');
  const [width, setWidth] = useState(badgeSize === 'A4' ? 21.0 : 10);
  const [height, setHeight] = useState(
    badgeSize === 'A4'
      ? 29.7
      : badgeType === 'Single'
        ? 15
        : 30
  );
  const [lwidth, setLWidth] = useState(10);
  const [lheight, setLHeight] = useState(badgeType === 'Single'
    ? 15
    : 30);
  const [pwidth, setPWidth] = useState(10);
  const [pheight, setPHeight] = useState(badgeType === 'Single'
    ? 15
    : 30);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState('Blank');
  const [widthError, setWidthError] = useState('');
  const [heightError, setHeightError] = useState('');
  const [orientation, setOrientation] = useState('Portrait');
  const navigate = useNavigate(); // Initialize navigate hook
  const [categories, setCategories] = useState([]);
  const [modal, setModal] = useState(false);
  const location = useLocation();
  // Destructure properties from location.state with default values or empty strings
  const { badgeName = '', badgeId = '', designation = '', category = '' } = location.state || {};

  // Destructure badgeDatafromApi and badge with default values or an empty object
  const { badgeDatafromApi = {}, badge = {} } = location.state || {};

  // Determine the values of categoryName, designationName, and badgeName based on the source
  const categoryName = badge.category_name || category;
  const designationName = badge.designation_name || designation;
  const editedBadgeName = badge.badge_name || null;
  const finalBadgeName = editedBadgeName || badgeName;

  console.log("Width", width);
  console.log("height", height);

  const [storedData, setStoredData] = useState({
    id: badge.category_id || '',
    badgeName: typeof finalBadgeName === 'string' ? finalBadgeName : '',
    designation: typeof designationName === 'string' ? designationName : '',
    categoryName: typeof categoryName === 'string' ? categoryName : ''
  });

  const badgeSizeOptions = [
    { value: 'Custom size', label: 'Custom size' },
    { value: 'A4', label: 'A4' },
    { value: 'A5', label: 'A5' },
    { value: 'A6', label: 'A6' },
  ];

  const badgeTypeOptions = [
    { value: 'Single', label: 'Single' },
    { value: 'Double', label: 'Double' },
    { value: 'Mirror', label: 'Mirror' },
  ];

  const orientationOptions = [
    { value: 'Portrait', label: 'Portrait' },
    { value: 'Landscape', label: 'Landscape' },
  ];

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const token = getToken();
        const response = await axios.post(`${BackendAPI}/badge/getcategories`, null, {
          headers: {
            Authorization: `Bearer ${token}` // Include the token in the Authorization header
          }
        });
        setCategories(response.data.categories);
      } catch (error) {
        console.error('Error fetching categories:', error);
      }
    };
    fetchCategories();
  }, []);

  const handleBadgeSizeChange = (selectedOption) => {
    const selectedSize = selectedOption.value;
    setBadgeSize(selectedSize);

    console.log("DA", selectedOption);

    if (selectedSize === 'A4') {
      setWidth(21.0);
      setHeight(29.7);
    } else if (selectedSize === 'A5') {
      setWidth(14.8);
      setHeight(21.0);
    } else if (selectedSize === 'A6') {
      setWidth(10.5);
      setHeight(14.8);
    } else if (selectedSize === 'Custom size' && badgeType === 'Single') {
      setWidth(10);
      setHeight(15);
    }
    else if (selectedSize === 'Custom size') {
      setWidth(10);
      setHeight(30);
    }
  };

  // Validation functions for width and height (required field)
  const validateWidth = (value) => {
    console.log("width", value);
    if (value === '') {
      setWidthError('This field is required');
      return false;
    }
    else if (width === '') {
      setWidthError('This field is required');

    }
    setWidthError('');
    return true;
  };

  const validateHeight = (value) => {
    console.log("height", value);
    if (value === '') {
      setHeightError('This field is required');
      return false;
    }
    setHeightError('');
    return true;
  };

  const handleWidthChange = (e) => {
    const value = e.target.value;
    setWidth(value);
    setPWidth(value);
    setLWidth(value);
    if (badgeSize === 'Custom size') {
      validateWidth(value);
    }
  };

  const handleHeightChange = (e) => {
    const value = e.target.value;
    setHeight(value);
    setPHeight(value);
    setPHeight(value);
    validateHeight(value);
  };

  useEffect(() => {
    // Check if category has an id
    if (category && category.id) {
      localStorage.setItem('storedData', JSON.stringify({ id: category.id, badgeName, designation, categoryName: category.name }));
      setStoredData({ id: category.id, badgeName, designation, categoryName: category.name });
      // console.log('Category ID:', category.id); // Log the category id
    }
  }, [badgeName, designation, category]);

  const handleOrientationChange = (selectedOption) => {
    const newOrientation = selectedOption.value;
    console.log("Orientation", newOrientation);

    setOrientation(newOrientation);

    if (newOrientation === 'Landscape') {
      // Swap width and height
      const currentWidth = width;
      const currentHeight = height;

      setLWidth(currentHeight);
      setLHeight(currentWidth);

    } else if (newOrientation === 'Portrait') {
      // Restore original width and height
      const currentWidth = width;
      const currentHeight = height;

      setPWidth(currentWidth);
      setHeight(currentHeight);


    }
  };
  const toggleModal = () => setIsModalOpen(!isModalOpen);

  const handleTemplateSelect = (template) => {
    setSelectedTemplate(template);
    if (template == "Explore") {
      toggleModal();
    }
  };

  const handleSubmit = async () => {
    // Check if the width and height fields have errors or are empty
    if ((badgeSize === 'Custom size' && (width === '' || height === '' || widthError || heightError))) {
      if (width === '') {
        setWidthError("This field is required");
        if (height === '') {
          setHeightError("This field is required");

        }
      }
      else if (height === '') {
        setHeightError("This field is required");

      }
      return;  // Prevent form submission if there are validation errors
    }    // Prepare the data to be sent
    const widthInPx = width * CM_TO_PX;
    const heightInPx = height * CM_TO_PX;
    const badgeData = {
      badgeSize,
      width: widthInPx,    // Send width in pixels
      height: heightInPx,   // Send height in pixels
      selectedTemplate,
      badgeType,
      orientation,
      storedData
    };


    console.log("Badge DATA", badgeData);

    try {
      const token = getToken();
      // Send badge data to backend to create a new badge
      const response = await axios.post(`${BackendAPI}/badge/badgeconfiguration`, {
        badgeData
      }, {
        headers: {
          Authorization: `Bearer ${token}` // Include the token in the Authorization header
        }
      });

      // Handle success or show a success message
      console.log('Badge created successfully:', response.data);

      if (response.status === 200) {
        navigate(`${process.env.PUBLIC_URL}/onsite/badge-design/Consoft`, {
          state: {
            badgeName: badgeName,
            designation: designation,
            badgeData: badgeData,
            category: categories.find(cat => cat.id === parseInt(storedData.id)) // Assuming badgeType is a string
          }
        });

        // navigate(`${process.env.PUBLIC_URL}/onsite/badge-configration/Consoft`, {
        //     // state: {
        //     //     badgeName: badgeName,
        //     //     designation: designation,
        //     //     category: categories.find(cat => cat.id === parseInt(badgeType)) // Assuming badgeType is a string
        //     // }
        // });
      }
    } catch (error) {
      // Handle error or show an error message
      console.error('Error creating badge:', error);
      if (error.response && error.response.data && error.response.data.message) {
        // If the error response contains a message from the API, display it
        // You can set it to a state variable and display it in your UI
        toast.error(error.response.data.message); // Use toast.error for displaying error messages
      } else {
        // If there is no specific message from the API, display a generic error message
        toast.error('Error fetching created badges. Please try again.'); // Display a generic error message
      }
    }
  };

  const openDeleteModal = () => {
    setModal(true);
  };

  const handleCancel = async () => {
    // if (!badge.category_id) return;

    try {
      const token = getToken();
      const response = await axios.delete(`${BackendAPI}/badge/removebadge/${badgeId}`, {
        headers: {
          Authorization: `Bearer ${token}` // Include the token in the Authorization header
        }
      });
      if (response.status === 200) {
        // Remove the badge from state
        // setCreatedBadges(prevBadges => prevBadges.filter(badge => badge.badge_id !== badgeToDelete.badge_id));
        navigate(`${process.env.PUBLIC_URL}/onsite/create-badges/Consoft`);            // Display success toast message
        toast.success('Badge removed successfully');
      } else {
        // Display error toast message if response status is not 200
        toast.error('Error removing badge');
      }
    } catch (error) {
      // Log the error to console
      console.error('Error removing badge:', error);
      // Display error toast message
      toast.error('Error removing badge');
    } finally {
      // Close the modal and clear the badge to be deleted
      setModal(false);
    }
  };

  return (
      <Fragment>
        <Breadcrumbs mainTitle="Badge Configuration" parent="Manage Badge" title="Badge Configuration" />

        <Container>
        {/* Card */}
        <Card>
          <CardBody>

            {/* Row with Input Fields and Preview */}
            <Row>
              {/* Left Column - Input Fields */}
              <Col md={5}>
                <div>
                  {/* Template Selection */}
                  <h6>Select Template</h6>
                  <Row>
                    {/* Blank Template Card */}
                    <Col md={6}>
                      <Card
                        className={`template-card ${selectedTemplate === 'Blank' ? 'selected' : ''}`}
                        onClick={() => handleTemplateSelect('Blank')}
                        style={{ cursor: 'pointer' }}
                      >
                        <CardBody className="text-center">
                          <p>Blank</p>
                        </CardBody>
                      </Card>
                    </Col>

                    {/* Explore Template Card */}
                    <Col md={6}>
                      <Card
                        className={`template-card ${selectedTemplate === 'Explore' ? 'selected' : ''}`}
                        onClick={() => handleTemplateSelect('Explore')}
                        style={{ cursor: 'pointer' }}
                      >
                        <CardBody className="text-center">
                          <p>Explore</p>
                        </CardBody>
                      </Card>
                    </Col>
                  </Row>
                </div>

                {/* Badge Size Selection */}
                <FormGroup>
                  <Label for="badgeSize">
                    <strong>Badge Size</strong>
                  </Label>
                  <Select
                    id="badgeSize"
                    options={badgeSizeOptions}
                    value={badgeSizeOptions.find((option) => option.value === badgeSize)}
                    onChange={handleBadgeSizeChange}
                    classNamePrefix="react-select"
                  />
                </FormGroup>

                {/* Show Custom Width/Height Input Fields if 'Custom size' is selected */}
                {badgeSize === 'Custom size' && (
                  <Row>
                    <Col md={6}>
                      <FormGroup>
                        <Input
                          type="number"
                          id="width"
                          value={orientation === 'Landscape' ? lwidth : pwidth}
                          onChange={handleWidthChange}
                          placeholder="Enter width in cm"
                        />
                        {widthError && <small className="text-danger">{widthError}</small>}
                      </FormGroup>
                    </Col>
                    <Col md={6}>
                      <FormGroup>
                        <Input
                          type="number"
                          id="height"
                          value={orientation === 'Landscape' ? lheight : pheight}
                          onChange={handleHeightChange}
                          placeholder="Enter height in cm"
                        />
                        {heightError && <small className="text-danger">{heightError}</small>}
                      </FormGroup>
                    </Col>
                  </Row>
                )}

                {/* Badge Type Selection */}
                <FormGroup>
                  <Label for="badgeType">
                    <strong>Badge Type</strong>
                  </Label>
                  <Select
                    id="badgeType"
                    options={badgeTypeOptions}
                    value={badgeTypeOptions.find((option) => option.value === badgeType)}
                    onChange={(selectedOption) => setBadgeType(selectedOption.value)}
                    classNamePrefix="react-select"
                  />
                </FormGroup>

                {/* Orientation Selection */}
                <FormGroup>
                  <Label for="orientation">
                    <strong>Orientation</strong>
                  </Label>
                  <Select
                    id="orientation"
                    options={orientationOptions}
                    value={orientationOptions.find((option) => option.value === orientation)}
                    onChange={handleOrientationChange}
                    classNamePrefix="react-select"
                  />
                </FormGroup>

              </Col>

              {/* Right Column - Preview */}
              <Col md={7} className="d-flex justify-content-center align-items-center" style={{ height: '100%' }}>
                <div>
                  <h6 className="text-center mb-3">Badge Preview ({orientation})</h6>
                  <div className="badge-preview p-3 border position-relative" style={{ width: 'fit-content' }}>
                    <div
                      className={`badge-card ${badgeType}`}
                      style={{
                        width: orientation === 'Landscape' ? '14cm' : '10cm',
                        height: orientation === 'Landscape' ? '8cm' : '12cm',
                        position: 'relative',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: 'lightgrey',
                      }}
                    >

                      {/* When badgeType is Mirror */}
                      {badgeType === 'Mirror' && (
                        <div className="badge-content mirror-content" style={{ width: '100%', textAlign: 'center', position: 'relative', height: '100%' }}>
                          {/* Front Side Content (Original) */}
                          <div className="front-side" style={{ position: 'absolute', top: '20%', width: '100%' }}>
                            <span>Mirror view</span>
                          </div>

                          {/* Dotted Line */}
                          <div className="divider-line" style={{ borderBottom: '2px dotted black', width: orientation === 'Landscape' ? '14cm' : '10cm', position: 'absolute', top: '50%' }}></div>

                          {/* Back Side Content (Mirrored and reversed) */}
                          <div className="back-side" style={{ position: 'absolute', bottom: '20%', width: '100%', transform: 'scaleY(-1)' }}>
                            <span>{reverseText("Mirror view")}</span>
                          </div>
                        </div>
                      )}

                      {/* If not Mirror, other badge types */}
                      {badgeType !== 'Mirror' && (
                        <div className={`badge-content ${orientation}`} style={{ width: '100%', height: '100%' }}>
                          {badgeType === 'Double' ? (
                            <div className="badge-content double-content d-flex flex-column" style={{ height: '100%', position: 'relative' }}>
                              {/* Front Side Text */}
                              <div className="front-side" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                                <span>Front Side</span>
                              </div>

                              {/* Dotted Line */}
                              <div className="divider-line" style={{ borderBottom: '2px dotted black', width: orientation === 'Landscape' ? '14cm' : '10cm', position: 'relative' }}></div>

                              {/* Back Side Text */}
                              <div className="back-side" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                                <span>Back Side</span>
                              </div>
                            </div>
                          ) : (
                            <div className="single-content">Single Content</div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Display height on the right-hand side */}
                    <div style={{
                      position: 'absolute',
                      right: '-2rem',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      fontSize: '14px'
                    }}>
                      {orientation === 'Portrait' ? `${height}cm` : `${width}cm`}
                    </div>

                    {/* Display width at the bottom */}
                    <div style={{
                      position: 'absolute',
                      bottom: '-2rem',
                      left: '50%',
                      transform: 'translateX(-50%)',
                      fontSize: '14px'
                    }}>
                      {orientation === 'Portrait' ? `${width}cm` : `${height}cm`}
                    </div>
                  </div>

                  {/* <p className="pt-5"><strong>Selected Badge Size:</strong> {badgeSize}</p>
                <p><strong>Selected Template:</strong> {selectedTemplate || 'None'}</p>
                <p><strong>Badge Type:</strong> {badgeType || 'None'}</p>
                <p><strong>Orientation:</strong> {orientation || 'None'}</p> */}
                </div>
              </Col>






            </Row>
          </CardBody>
          <CardFooter>
            <div className="d-flex justify-content-end me-3">
              <Button color="warning" onClick={openDeleteModal} className='me-2'>
                Cancel
              </Button>
              <Button color="primary" onClick={handleSubmit}>
                Next
              </Button>
            </div>
          </CardFooter>
        </Card>

        {/* Modal for Template Selection */}
        <Modal isOpen={isModalOpen} toggle={toggleModal}>
          <ModalHeader toggle={toggleModal}>Choose a Template</ModalHeader>
          <ModalBody>
            <Row>
              <Col md={6}>
                <Card onClick={() => handleTemplateSelect('Template 1')} className="mb-3" style={{ cursor: 'pointer' }}>
                  <CardBody className="text-center">
                    <p>Template 1</p>
                  </CardBody>
                </Card>
              </Col>
              <Col md={6}>
                <Card onClick={() => handleTemplateSelect('Template 2')} className="mb-3" style={{ cursor: 'pointer' }}>
                  <CardBody className="text-center">
                    <p>Template 2</p>
                  </CardBody>
                </Card>
              </Col>
              {/* Add more templates as needed */}
              <Button color="primary" onClick={handleSubmit}>
                Submit
              </Button>
            </Row>
          </ModalBody>
          <ModalFooter>
            <Button color="secondary" onClick={toggleModal}>Close</Button>
          </ModalFooter>
        </Modal>

        {/* Delete Confirmation Modal */}
        <Modal isOpen={modal} toggle={() => setModal(!modal)} centered size="md">
          <ModalHeader toggle={() => setModal(!modal)}>Confirm</ModalHeader>
          <ModalBody>
            You will lose all badge configurations you have done to <strong>{badgeName}</strong>. Are you sure you want to cancel?
          </ModalBody>
          <ModalFooter>
            <Button color="primary" onClick={handleCancel}>Yes</Button>
            <Button color="warning" onClick={() => setModal(!modal)}>No</Button>
          </ModalFooter>
        </Modal>
        </Container>
        </Fragment>
  );
};

const reverseText = (text) => {
  return text.split('').reverse().join('');
};


export default Badgeconfiguration;
