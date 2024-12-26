import React, { useState, useEffect } from 'react';
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
  Input
} from 'reactstrap';
import './CertConfiguration.css'; // Import custom CSS for styling
import { getToken } from '../../Auth/Auth';
import { toast } from 'react-toastify';
import { BackendAPI } from '../../api/index';
import { useNavigate } from 'react-router-dom';
import { useLocation } from 'react-router-dom';

const Certconfiguration = () => {
  const CM_TO_PX = 37.795276;
  const PX_TO_CM = 0.0264583333;
  const [badgeSize, setBadgeSize] = useState('A4');
  const [width, setWidth] = useState(21.0);
  const [height, setHeight] = useState(29.7);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState('Blank');
  const [badgeType, setBadgeType] = useState('Single');
  const [orientation, setOrientation] = useState('Portrait');
  const navigate = useNavigate(); // Initialize navigate hook
  const [categories, setCategories] = useState([]);

  const location = useLocation();
  // Destructure properties from location.state with default values or empty strings
  const { badgeName = '', designation = '', category = '' } = location.state || {};

  // Destructure badgeDatafromApi and badge with default values or an empty object
  const { badgeDatafromApi = {}, badge = {} } = location.state || {};

  // Determine the values of categoryName, designationName, and badgeName based on the source
  const categoryName = badge.category_name || category;
  const designationName = badge.designation_name || designation;
  const editedBadgeName = badge.badge_name || null;
  const finalBadgeName = editedBadgeName || badgeName;

  const [storedData, setStoredData] = useState({
    id: badge.category_id || '',
    badgeName: typeof finalBadgeName === 'string' ? finalBadgeName : '',
    designation: typeof designationName === 'string' ? designationName : '',
    categoryName: typeof categoryName === 'string' ? categoryName : ''
});

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

  const handleBadgeSizeChange = (e) => {
    const selectedSize = e.target.value;
    setBadgeSize(selectedSize);

    if (selectedSize === 'A4') {
      setWidth(21.0);
      setHeight(29.7);
    } else if (selectedSize === 'A5') {
      setWidth(14.8);
      setHeight(21.0);
    } else if (selectedSize === 'A6') {
      setWidth(10.5);
      setHeight(14.8);
    } else if (selectedSize === 'Custom size') {
      setWidth('');
      setHeight('');
    }
  };

  useEffect(() => {
    // Check if category has an id
    if (category && category.id) {
        localStorage.setItem('storedData', JSON.stringify({ id: category.id, badgeName, designation, categoryName: category.name }));
        setStoredData({ id: category.id, badgeName, designation, categoryName: category.name });
        // console.log('Category ID:', category.id); // Log the category id
    }
}, [badgeName, designation, category]);

  const handleBadgeTypeChange = (e) => setBadgeType(e.target.value);
  const handleOrientationChange = (e) => setOrientation(e.target.value);

  const toggleModal = () => setIsModalOpen(!isModalOpen);

  const handleTemplateSelect = (template) => {
    setSelectedTemplate(template);
    if(template == "Explore"){
    toggleModal();
    }
  };

  const handleSubmit = async () => {
    // Prepare the data to be sent
    const widthInPx = width * CM_TO_PX;
    const heightInPx = height * CM_TO_PX;
    const badgeData = {
      badgeSize,
      width: widthInPx,    // Send width in pixels
      height: heightInPx,   // Send height in pixels
      selectedTemplate,
      orientation,
      storedData
    };

    try {
      const token = getToken();
      // Send badge data to backend to create a new badge
      const response = await axios.post(`${BackendAPI}/certificate/Certconfiguration`, {
        badgeData
    }, {
          headers: {
              Authorization: `Bearer ${token}` // Include the token in the Authorization header
          }
      });

      // Handle success or show a success message
      console.log('Badge created successfully:', response.data);

      if (response.status === 200) {
          navigate(`${process.env.PUBLIC_URL}/onsite/certificate-design/Consoft`, {
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

  return (
    <div className="container mt-5">
      {/* Card */}
      <Card>
        <CardBody>
          <CardTitle tag="h5" className="text-center mb-4">
            Badge Configuration
          </CardTitle>

          {/* Row with Input Fields and Preview */}
          <Row>
            {/* Left Column - Input Fields */}
            <Col md={6}>
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
                <Label for="badgeSize"><strong>Badge Size</strong></Label>
                <Input type="select" id="badgeSize" value={badgeSize} onChange={handleBadgeSizeChange}>
                  <option value="Custom size">Custom size</option>
                  <option value="A4">A4</option>
                  <option value="A5">A5</option>
                  <option value="A6">A6</option>
                </Input>
              </FormGroup>

              {/* Show Custom Width/Height Input Fields if 'Custom size' is selected */}
              {badgeSize === 'Custom size' && (
                <Row>
                  <Col md={6}>
                    <FormGroup>
                      <Input
                        type="number"
                        id="width"
                        value={width}
                        onChange={(e) => setWidth(e.target.value)}
                        placeholder="Enter width in cm"
                      />
                    </FormGroup>
                  </Col>
                  <Col md={6}>
                    <FormGroup>
                      <Input
                        type="number"
                        id="height"
                        value={height}
                        onChange={(e) => setHeight(e.target.value)}
                        placeholder="Enter height in cm"
                      />
                    </FormGroup>
                  </Col>
                </Row>
              )}

              {/* Badge Type Selection */}
              {/* <FormGroup>
                <Label for="badgeType"><strong>Badge Type</strong></Label>
                <Input type="select" id="badgeType" value={badgeType} onChange={handleBadgeTypeChange}>
                  <option value="Single">Single</option>
                  <option value="Double">Double</option>
                  <option value="Mirror">Mirror</option>
                </Input>
              </FormGroup> */}

              {/* Orientation Selection */}
              <FormGroup>
                <Label for="orientation"><strong>Orientation</strong></Label>
                <Input type="select" id="orientation" value={orientation} onChange={handleOrientationChange}>
                  <option value="Portrait">Portrait</option>
                  <option value="Landscape">Landscape</option>

                </Input>
              </FormGroup>
            </Col>

            {/* Right Column - Preview */}
            <Col md={6} className="d-flex justify-content-center align-items-center" style={{ height: '100%' }}>
              <div>
                <h6 className="text-center">Badge Preview</h6>
                <div className="badge-preview p-3 border position-relative" style={{ width: 'fit-content' }}>
                  <div
                    className={`badge-card ${badgeType}`}
                    style={{ width: '10cm', height: '12cm', position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', backgroundColor: 'lightgrey',}}
                  >
                   
                          <div className="single-content">Certificate</div>
                  </div>

                  {/* Display height on the right-hand side */}
                  <div style={{
                    position: 'absolute',
                    right: '-2rem',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    fontSize: '14px'
                  }}>
                    {height ? `${height}cm` : ' '}
                  </div>

                  {/* Display width at the bottom */}
                  <div style={{
                    position: 'absolute',
                    bottom: '-2rem',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    fontSize: '14px'
                  }}>
                    {width ? `${width}cm` : ' '}
                  </div>
                </div>

                {/* <p className="pt-5"><strong>Selected Badge Size:</strong> {badgeSize}</p>
                <p><strong>Selected Template:</strong> {selectedTemplate || 'None'}</p>
                <p><strong>Badge Type:</strong> {badgeType || 'None'}</p>
                <p><strong>Orientation:</strong> {orientation || 'None'}</p> */}
              </div>
            </Col>



            <div className="d-flex justify-content-end mt-4 me-5">
                <Button color="primary" onClick={handleSubmit}>
                  Submit
                </Button>
              </div>


          </Row>
        </CardBody>
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
    </div>
  );
};

const reverseText = (text) => {
  return text.split('').reverse().join('');
};


export default Certconfiguration;
