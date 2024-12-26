import React, { Fragment, useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { BackendAPI, BackendPath } from '../../api';
import { Breadcrumbs } from "../../../src/AbstractElements";
import useAuth from '../../Auth/protectedAuth';
import { getToken } from '../../Auth/Auth';
import SweetAlert from 'sweetalert2';
import { MapContainer, ImageOverlay, Marker, Popup, useMapEvents, FeatureGroup, Polygon, Tooltip, useMap } from 'react-leaflet';
import { EditControl } from 'react-leaflet-draw';
import { Card, CardBody, CardHeader, Button, FormGroup, Label, Input, Row, Col, CardFooter, Modal, ModalHeader, ModalFooter, ModalBody, PopoverBody, UncontrolledPopover } from 'reactstrap';
import Select from 'react-select';
import { MdDelete, MdInfoOutline } from "react-icons/md";
import { FaEdit } from 'react-icons/fa';
import L, { featureGroup } from 'leaflet';
import { PermissionsContext } from '../../contexts/PermissionsContext';
import Swal from 'sweetalert2';
import 'leaflet/dist/leaflet.css';
import 'leaflet-draw/dist/leaflet.draw.css';
import pinicon from "../../map-icon/pin.png";
import locationicon from "../../map-icon/location.png";
import circleicon from "../../map-icon/circle.png";
import squareicon from "../../map-icon/square.png";

const FloorPlanEditor = () => {
  useAuth();
  const { permissions } = useContext(PermissionsContext);
  const [isEditing, setIsEditing] = useState(false);
  const [imageSrc, setImageSrc] = useState('');
  const [imagePath, setIimagePath] = useState('');
  const [shapes, setShapes] = useState([]);
  const [hallData, setHallData] = useState([]);
  const [exh, setExh] = useState([]);
  const [shapePositions, setShapePositions] = useState({});
  const [hallPositions, setHallPositions] = useState({});
  const [bounds, setBounds] = useState([
    [0, 0],
    [1, 1]
  ]);
  const [zoom, setZoom] = useState(9); // Default zoom level
  const [currentShapeIndex, setCurrentShapeIndex] = useState(0); // Track the current shape index
  const [selectedId, setSelectedId] = useState(''); // State to store selected ID from dropdown
  const [selectedExhId, setSelectedExhId] = useState(''); // State to store selected ID from dropdown
  const [selectedHallId, setSelectedHallId] = useState('');
  const [selectedImage, setSelectedImage] = useState(null);
  const [path, setPath] = useState('');
  const [imageUploaded, setImageUploaded] = useState(true);
  const [UploadModalOpen, setUploadModalOpen] = useState(false); // State for modal visibility
  const [replaceModalOpen, setReplaceModalOpen] = useState(false); // State for replace modal visibility
  const [isDrawingPolygon, setIsDrawingPolygon] = useState(false);
  const [shapeValidationMessage, setShapeValidationMessage] = useState('');
  const [hallValidationMessage, setHallValidationMessage] = useState('');
  const [prevSelectedHallId, setPrevSelectedHallId] = useState(null);
  const [polygonsVisible, setPolygonsVisible] = useState(true);
  const [isDraggable, setIsDraggable] = useState(false); // Draggable state for each marker
  const [isModalOpen, setIsModalOpen] = useState(false); // state to manage modal visibility
  const [isMarkerModalOpen, setIsMarkerModalOpen] = useState(false); // state to manage modal visibility
  const [hasTooltipShown, setHasTooltipShown] = useState(false); // Flag to track if tooltip has been shown
  const [hasMarkerModalShown, setHasMarkerModalShown] = useState(false); // Flag to track if tooltip has been shown


  const [drawnItems] = useState(new L.FeatureGroup());


  console.log("Data", shapes);
  console.log("ExhData", exh);
  console.log("Position:", shapePositions);
  console.log("Hall Position:", hallPositions);
  console.log("Image:", imagePath);
  console.log("Id:", selectedId);
  console.log("Hall:", selectedHallId);

  // Extract floor map component
  const FloorPlanPermissions = permissions['FloorPlanEditor'];

  const getFloorPlanData = async () => {
    try {
      const token = getToken(); // Retrieve authentication token
      const response = await axios.get(`${BackendAPI}/Location/getFloorPlanData`, {
        headers: {
          Authorization: `Bearer ${token}` // Include the token in the Authorization header
        }
      });

      const { shapes, shapePositions, hallPositions, imagePath } = response.data; // Destructure data from response
      console.log("Floor Data:", response.data);

      // Update state with fetched data
      // setImageSrc(imageSrc);
      setIimagePath(imagePath);
      setShapePositions(shapePositions);
      setHallPositions(hallPositions);

      // Store fetched data in local storage
      localStorage.setItem('imageSrc', imageSrc);
      localStorage.setItem('path', imagePath);
      localStorage.setItem('shapePositions', JSON.stringify(shapePositions));
      localStorage.setItem('hallPositions', JSON.stringify(hallPositions));


    } catch (error) {
      console.error('Error fetching floor plan data:', error);
    }
  };

  useEffect(() => {
    const savedPath = JSON.parse(localStorage.getItem('imagePath'));
    const savedShapePositions = JSON.parse(localStorage.getItem('shapePositions'));

    if (savedPath) {
      setIimagePath(savedPath);
      setImageUploaded(false);
    }

    if (savedShapePositions) {
      setShapePositions(savedShapePositions);
    }

    const fetchCategoryDetail = async () => {
      try {
        const token = getToken(); // Retrieve authentication token
        const response = await axios.get(`${BackendAPI}/Location/getExhiloc`, {
          headers: {
            Authorization: `Bearer ${token}` // Include the token in the Authorization header
          }
        });
        setShapes(response.data.locData); // Set shapes data received from the API response
        setHallData(response.data.hallData);
        localStorage.setItem('shapes', JSON.stringify(response.data.locData));

        const exhresponse = await axios.get(`${BackendAPI}/Location/getExhibitorData`, {
          headers: {
            Authorization: `Bearer ${token}` // Include the token in the Authorization header
          }
        });
        setExh(exhresponse.data.exhData); // Set shapes data received from the API response
      } catch (error) {
        console.error('Error fetching user detail data:', error);
      }
    };

    fetchCategoryDetail(); // Invoke the fetch function when the component mounts

    if (!savedShapePositions || !savedPath) {
      getFloorPlanData(); // Invoke the fetch function when the component mounts
    }
  }, [permissions]);

  useEffect(() => {
    // Check if imagePath is available and update state accordingly
    if (imagePath) {
      setImageUploaded(true);
    } else {
      setImageUploaded(false);
    }
  }, [imagePath]);


  const handleImageUpload = (event) => {
    const file = event.target.files[0];
    const reader = new FileReader();
    reader.onload = () => {
      setImageSrc(reader.result);
      localStorage.setItem('imageSrc', reader.result); // Save to local storage
    };
    reader.readAsDataURL(file);
    setSelectedImage(file);
    setIimagePath(`map-assets/${file.name}`);
    setImageUploaded(true); // Set image uploaded state to true
  };

  const handleImageReplace = () => {
    setReplaceModalOpen(true); // Show the confirmation modal
  };

  const confirmImageReplace = () => {
    setReplaceModalOpen(false); // Close the confirmation modal
    setUploadModalOpen(false);
    const input = document.getElementById('imageUploadFooter');
    if (input) {
      input.click(); // Trigger the file input click to open the file selection dialog
    }
  };

  // const handleImageReplaceConfirm = (event) => {
  //   const file = event.target.files[0];
  //   const reader = new FileReader();
  //   reader.onload = () => {
  //     setImageSrc(reader.result);
  //     localStorage.setItem('imageSrc', reader.result); // Save to local storage
  //   };
  //   reader.readAsDataURL(file);
  //   setSelectedImage(file);
  //   setIimagePath(`map-assets/${file.name}`);
  //   setImageUploaded(true); // Set image uploaded state to true
  // };

  const handleImageReplaceConfirm = (event) => {
    const file = event.target.files[0];

    if (!file) return;

    const validTypes = ['image/jpeg', 'image/png', 'image/jpg']; // Allow JPG, JPEG, and PNG formats
    const maxSize = 2 * 1024 * 1024; // 2 MB in bytes

    // Validate file type
    if (!validTypes.includes(file.type)) {
      Swal.fire({
        icon: 'error',
        title: 'Invalid File Type',
        text: 'Please upload an image in JPG, JPEG, or PNG format.',
      });
      return;
    }

    // Validate file size
    if (file.size > maxSize) {
      Swal.fire({
        icon: 'error',
        title: 'File Too Large',
        text: 'The file size must not exceed 2 MB.',
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setImageSrc(reader.result);
      localStorage.setItem('imageSrc', reader.result); // Save to local storage
      setSelectedImage(file);
      setIimagePath(`map-assets/${file.name}`);
      setImageUploaded(true); // Set image uploaded state to true

      // Show success alert
      SweetAlert.fire({
        title: 'Upload Successful',
        text: 'The floor map image has been successfully uploaded.',
        icon: 'success',
        timer: 3000,
        showConfirmButton: false,
        allowOutsideClick: false,
        allowEscapeKey: false
      });
    };
    reader.readAsDataURL(file);

  };

  const addShape = (e) => {
    const { lat, lng } = e.latlng;
    const id = parseInt(selectedId);
    const Exhid = parseInt(selectedExhId);

    if (!isNaN(id) && !isNaN(Exhid)) {
      const newShape = shapes.find(shape => shape.id === id);
      if (newShape) {
        // Create or update shape positions using both ExhId and id
        const newShapePositions = {
          ...shapePositions,
          [Exhid]: {
            ...shapePositions[Exhid],
            [id]: { lat, lng }
          }
        };

        console.log("Test:", newShapePositions);
        setShapePositions(newShapePositions);
        localStorage.setItem('shapePositions', JSON.stringify(newShapePositions)); // Save to local storage
        setSelectedId(''); // Reset selectedId after adding shape
        setSelectedExhId(''); // Reset selectedExhId after adding shape
        setCurrentShapeIndex(currentShapeIndex + 1); // Move to the next shape
      } else {
        alert(`Shape with ID ${id} not found.`);
      }
    }
  };


  const removeShape = (exhId, id) => {
    const updatedExhPositions = { ...shapePositions[exhId] };
    delete updatedExhPositions[id];

    const updatedShapePositions = {
      ...shapePositions,
      [exhId]: updatedExhPositions
    };

    if (Object.keys(updatedExhPositions).length === 0) {
      delete updatedShapePositions[exhId];
    }

    setShapePositions(updatedShapePositions);
    localStorage.setItem('shapePositions', JSON.stringify(updatedShapePositions)); // Save to local storage
  };

  const removeHallShape = (id) => {
    const updatedHallPositions = { ...hallPositions };
    delete updatedHallPositions[id];
    setHallPositions(updatedHallPositions);
    localStorage.setItem('hallPositions', JSON.stringify(updatedHallPositions));
  };


  const iconMapping = {
    1: `${BackendPath}map-assets/location.png`,
    2: `${BackendPath}map-assets/square.png`,
    3: `${BackendPath}map-assets/circle.png`,
    4: `${BackendPath}map-assets/pin.png`,
  };

  const dropdownOptions = shapes
    .filter(shape => !(
      shapePositions[shape.exh_type_id] &&
      shapePositions[shape.exh_type_id][shape.id]
    ))
    .map(shape => ({
      value: shape.id,
      label: shape.location_name,
      exhibitor: shape.exh_type_id
    }));

  console.log("Dropdown:", dropdownOptions);


  const hallOptions = hallData.filter(hall => !hallPositions[hall.locat_id]).map(hall => ({
    value: hall.locat_id,
    label: hall.locat_name,
  }));

  const savePositions = async () => {
    const exhibitorCards = exh.map((exhibitor) => `
    <div class="card" onclick="zoomToSelected(${exhibitor.exh_id})">
      <div class="card-body d-flex align-items-center">
        <div class="logo-container mr-3">
          <img src="${BackendPath}${exhibitor.exh_logo}" alt="${exhibitor.exh_name} Logo" class="img-fluid" style="max-width: 50px; height: auto; border-radius: 5px;">
        </div>
        <div class="details-container">
          <h5 class="card-title">Exhibitor Name: ${exhibitor.exh_name}</h5>
          <p class="card-text">Exhibitor Type: ${exhibitor.exh_type}</p>
        </div>
      </div>
    </div>
  `).join('');

    const htmlContent = `
  <!DOCTYPE html>
  <html>
    <head>
      <title>Floor Plan</title>
      <link rel="stylesheet" href="https://unpkg.com/leaflet/dist/leaflet.css" />
      <style>
        body {
          margin: 0;
          padding: 0;
          display: flex;
          justify-content: center;
          align-items: center;
          height: 100vh;
          background-color: #f8f9fa;
        }
        .map-container {
          width: 100%;
          height: 100vh;
          position: relative;
        }
        .shape {
          position: absolute;
          cursor: pointer;
          text-align: center;
          color: white;
          font-weight: bold;
          display: flex;
          justify-content: center;
          align-items: center;
          width: 50px;
          height: 50px;
        }
        .rectangle {
          background-color: red;
        }
        .circle {
          border-radius: 50%;
          background-color: blue;
        }
        @media (max-width: 600px) {
          .shape {
            width: 30px;
            height: 30px;
            font-size: 0.7em;
          }
        }
      </style>
    </head>
    <body>
      <div id="map" class="map-container"></div>
      <script src="https://unpkg.com/leaflet/dist/leaflet.js"></script>
      <script>
        var map = L.map('map', {
              attributionControl: false
          }).setView([0.5, 0.5], ${zoom});
        L.imageOverlay('${BackendPath}${imagePath}', [[0, 0], [1, 1]]).addTo(map);
        map.options.minZoom = 9;

        var shapes = ${JSON.stringify(shapes)};
        var shapePositions = ${JSON.stringify(shapePositions)};
        var iconMapping = ${JSON.stringify(iconMapping)};
        var hallPositions = ${JSON.stringify(hallPositions)};
        var hallData = ${JSON.stringify(hallData)};

        shapes.forEach(shape => {
          var position = shapePositions[shape.exh_type_id] && shapePositions[shape.exh_type_id][shape.id];
          if (position) {
            var popupContent = 'Stall Name: ' + shape.location_name + '<br>Exhibitor: ' + shape.exh_type;
            var iconUrl = iconMapping[shape.shape_type];
            var marker = L.marker([position.lat, position.lng], {
              icon: L.icon({
                iconUrl: iconUrl,
                iconSize: [30, 30],
                iconAnchor: [15, 30],
                popupAnchor: [0, -30]
              })
            }).addTo(map);
            marker.bindPopup(popupContent);
          }
        });

        // Object.keys(hallPositions).forEach(id => {
        //   var shape = hallPositions[id];
        //   if (shape && shape.geometry && shape.geometry.type === 'Polygon') {
        //     var coordinates = shape.geometry.coordinates[0].map(coord => [coord[1], coord[0]]);
        //     var hall = hallData.find(hall => hall.locat_id === parseInt(id));
        //     var popupContent = '<strong>' + (hall ? hall.locat_name : 'Unknown Hall') + '</strong>'
        //     L.polygon(coordinates, {color: 'Black', fillColor: 'orange'}).addTo(map).bindPopup(popupContent);
        //   }
        // });

        Object.keys(hallPositions).forEach(id => {
  var shape = hallPositions[id];
  if (shape && shape.geometry && shape.geometry.type === 'Polygon') {
    var coordinates = shape.geometry.coordinates[0].map(coord => [coord[1], coord[0]]);
    var hall = hallData.find(hall => hall.locat_id === parseInt(id));
    
    if (hall) { // Only create popupContent if hall exists
      var popupContent = '<strong>' + hall.locat_name + '</strong>';
      L.polygon(coordinates, {color: 'Black', fillColor: 'orange'})
        .addTo(map)
        .bindPopup(popupContent);
    } else {
      // Handle the case when the hall is not found if needed (e.g., skip or log)
      console.warn('Hall not found for ID');
    }
  }
});


        function removeHallShape(id) {
          // Implement your shape removal logic here
          alert('Remove shape with ID: ' + id);
        }
      </script>
    </body>
  </html>
`;


    // Create a blob from the HTML content
    // const blob = new Blob([htmlContent], { type: 'text/html' });

    // // Create a link element to download the blob as a file
    // const link = document.createElement('a');
    // link.href = URL.createObjectURL(blob);
    // link.download = 'floor-plan.html';

    // // Append the link to the body and trigger the download
    // document.body.appendChild(link);
    // link.click();
    // document.body.removeChild(link);

    // Create FormData object
    const formData = new FormData();
    if (selectedImage) {
      formData.append('image', selectedImage);
      // formData.append('imageSrc', imageSrc);
    }
    formData.append('shapes', JSON.stringify(shapes));
    formData.append('shapePositions', JSON.stringify(shapePositions));
    formData.append('hallPositions', JSON.stringify(hallPositions)); // Add this line
    formData.append('htmlContent', htmlContent);

    try {
      const token = getToken(); // Retrieve authentication token
      await axios.post(`${BackendAPI}/Location/saveFloorPlanData`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${token}` // Include the token in the Authorization header
        }
      });
      console.log('Floor plan data saved successfully.');

      SweetAlert.fire({
        title: 'Success!',
        text: 'Floor map updated successfully!',
        icon: 'success',
        timer: 3000,
        showConfirmButton: false,
        allowOutsideClick: false,
        allowEscapeKey: false
      }).then((result) => {
        setIsEditing(false);
        // if (result.dismiss === SweetAlert.DismissReason.timer) {
        //     setShowGrapesEditor(false);
        //     navigate(`${process.env.PUBLIC_URL}/event/manage-Location/Consoft`);
        // }
      });
    } catch (error) {
      console.error('Error saving floor plan data:', error);
    }
  };


  const MapEvents = () => {
    const map = useMapEvents({
      click: (e) => addShape(e),
      zoomend: () => {
        const currentZoom = map.getZoom();
        console.log(`Current zoom level: ${currentZoom}`);
      },
    });
    return null;
  };



  // Icon mapping based on shape_type
  // const iconMapping = {
  //   1: `${BackendPath}map-assets/location.png`,
  //   2: `${BackendPath}map-assets/circle.png`,
  //   3: `${BackendPath}map-assets/square.png`,
  //   4: `${BackendPath}map-assets/pin.png`,
  // };

  // // Filter shapes to exclude those already added to the map
  // const dropdownOptions = shapes.filter(shape => !shapePositions[shape.id]).map(shape => ({
  //   value: shape.id,
  //   label: shape.location_name,
  //   exhibitor: shape.exh_type_id
  // }));

  // const hallOptions = hallData.filter(hall => !shapePositions[hall.id]).map(hall => ({
  //   value: hall.locat_id,
  //   label: hall.locat_name,
  // }));

  const HallId = selectedHallId;
  console.log(HallId);

  const handlePolygonDraw = (e) => {
    const id = parseInt(selectedHallId);

    if (!isNaN(id) && e.layerType === 'polygon' && isDrawingPolygon) {
      const newShape = e.layer.toGeoJSON();

      // Update hallPositions with the newly drawn shape
      const newHallPositions = {
        ...hallPositions,
        [id]: newShape
      };
      setHallPositions(newHallPositions);
      localStorage.setItem('hallPositions', JSON.stringify(newHallPositions));
      console.log("New Hall Shape Data:", newShape);

      setIsDrawingPolygon(false); // Disable polygon drawing after saving
      setPrevSelectedHallId(null);
    }
  };



  const handleEditStart = () => {
    // Hide polygons when editing starts
    setPolygonsVisible(false);
  };

  const handleEditEnd = () => {
    // Show polygons again when editing finishes
    setPolygonsVisible(true);
  };

  const handleEdit = (e) => {
    const { layers } = e;


    layers.eachLayer((layer) => {

      if (layer instanceof L.Marker) {
        const { lat, lng } = layer.getLatLng();
        const [exhId, id] = layer.options.id.split('-');
        const updatedShapePositions = { ...shapePositions };
        updatedShapePositions[exhId][id] = { lat, lng };
        setShapePositions(updatedShapePositions);
        localStorage.setItem('shapePositions', JSON.stringify(updatedShapePositions));
      }
    });

    // After editing is finished, show polygons again
    handleEditEnd();
  };

  // const handleEdit = (e) => {
  //   // Hide polygons when edit is triggered
  //   setPolygonsVisible(false);

  //   const { layers } = e;

  //   layers.eachLayer((layer) => {
  //     if (layer instanceof L.Marker) {
  //       console.log("Stall Layer:", layer);

  //       const { lat, lng } = layer.getLatLng();
  //       const [exhId, id] = layer.options.id.split('-');
  //       const updatedShapePositions = { ...shapePositions };
  //       updatedShapePositions[exhId][id] = { lat, lng };
  //       setShapePositions(updatedShapePositions);
  //       localStorage.setItem('shapePositions', JSON.stringify(updatedShapePositions));
  //     } else if (layer instanceof L.Polygon) {
  //       const latlngs = layer.getLatLngs(); // Get the first ring of coordinates
  //       const id = layer.options.id; // Now, this should correctly get the ID from options
  //       console.log("Hall Layer:", layer);

  //       // Log the hall ID and new coordinates for the polygon
  //       console.log(`Updating Polygon ID: ${id}, New Coordinates:`, latlngs);

  //       // Check if id is defined before updating shape positions
  //       if (id) {
  //         const updatedShapePositions = { ...shapePositions };
  //         // Update shape positions with new latlngs
  //         updatedShapePositions[id] = latlngs.map(latlng => ({ lat: latlng.lat, lng: latlng.lng }));

  //         setShapePositions(updatedShapePositions);
  //         localStorage.setItem('shapePositions', JSON.stringify(updatedShapePositions));
  //       } else {
  //         console.error("Polygon ID is undefined!");
  //       }
  //     }
  //   });

  //   // Show polygons again after editing
  //   setPolygonsVisible(true);
  // };


  // const handleEdit = (e) => {
  //   const { layers } = e;
  //   layers.eachLayer((layer) => {
  //     if (layer instanceof L.Marker) {
  //       console.log("Im editing marker");

  //       // setPolygonsVisible(false);

  //       const { lat, lng } = layer.getLatLng();
  //       const [exhId, id] = layer.options.id.split('-');
  //       const updatedShapePositions = { ...shapePositions };
  //       updatedShapePositions[exhId][id] = { lat, lng };
  //       setShapePositions(updatedShapePositions);
  //       localStorage.setItem('shapePositions', JSON.stringify(updatedShapePositions));
  //     } else if (layer instanceof L.Polygon) {

  //       console.log("Im editing polygon");
  //       const polygonId = layer.options.id; // Assuming you have an ID for polygons
  //       const updatedPolygon = layer.toGeoJSON();
  //       const updatedHallPositions = { ...hallPositions };
  //       updatedHallPositions[polygonId] = updatedPolygon;
  //       setHallPositions(updatedHallPositions);
  //       localStorage.setItem('hallPositions', JSON.stringify(updatedHallPositions));
  //     }
  //   });
  // };


  const color = 'orange';


  const handleHallSelect = (option) => {
    const selectedHallId = option.value;

    // Check if the selected hall is already positioned
    if (hallPositions[selectedHallId]) {
      setHallValidationMessage('This hall is already positioned on the map.');
    } else {
      setHallValidationMessage('');

      // If a different hall was previously selected, clear the drawing state
      if (selectedHallId !== prevSelectedHallId) {
        setIsDrawingPolygon(false); // Stop drawing the previous polygon
        setPrevSelectedHallId(selectedHallId); // Update to the new hall ID
      }

      // Update the selected hall ID and enable drawing for the new hall
      setSelectedHallId(selectedHallId);
      setIsDrawingPolygon(true); // Enable polygon drawing
      if (!hasTooltipShown) {
        setHasTooltipShown(true);
        setIsModalOpen(true);
      }
    }
  };

  const updateShapePosition = (exhId, id, newLatLng) => {
    setShapePositions((prevPositions) => ({
      ...prevPositions,
      [exhId]: {
        ...prevPositions[exhId],
        [id]: { lat: newLatLng.lat, lng: newLatLng.lng }
      }
    }));
  };




  return (
    <Fragment>
      <Breadcrumbs
        mainTitle={
          !isEditing ? (
            <>
              Floor Map
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
                  The Maps feature, along with location details, helps users navigate the venue and discover activities and points of interest using the Event App. <br />
                  As users explore the map, they can tap on different areas to find halls, exhibitor stalls, sponsors, and other features. <br />
                  They can also access the map from related sections, such as exhibitor profiles or event sessions from the event app. Tapping a location on the map will zoom in on that area for easy navigation. <br />
                  Upload the floor map image of the venue and click the <strong>Go to floor Map</strong> button to add locations and Hall in the floor map.
                </PopoverBody>
              </UncontrolledPopover>
            </>
          ) : (
            <>
              Floor Map
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
                  From here, you can locate the locations and halls on the floor map by selecting them from the dropdown menu. <br />
                  After placing them, click the <strong>Save Floor Map</strong> button.
                </PopoverBody>
              </UncontrolledPopover>
            </>
          )
        }
        parent="Map"
        title="Floor Map"
      />

      {!isEditing && (
        <Card className="my-4 p-4 shadow-sm border-0 template-card">
          <div className="ribbon ribbon-clip-top-left ribbon-success">
            <span>Active</span>
          </div>
          <CardBody className="d-flex align-items-center justify-content-between">
            <label className="h5 mb-0">Floor Map</label>
            {imageUploaded && (
              <Button className='ms-auto' color="warning" onClick={() => setIsEditing(true)}>Go to floor map</Button>
            )}
            {!imageUploaded && (
              <FormGroup>
                <Input
                  type="file"
                  accept=".png, .jpeg .jpg"
                  onChange={handleImageReplaceConfirm}
                  style={{ display: 'none' }}
                  id="imageUploadFooter"
                />
                {FloorPlanPermissions?.add === 1 && (

                  <Button color="primary" onClick={() => setUploadModalOpen(true)}>
                    Upload Floor Map
                  </Button>
                )}

              </FormGroup>
            )}
          </CardBody>
        </Card>

      )}

      {!isEditing && (
        <Card className="my-4 p-4 shadow-sm border-0 template-card">
          <div className="ribbon ribbon-clip-top-left ribbon-danger">  {/* Change `ribbon-success` to `ribbon-secondary` or any other class for Inactive styling */}
            <span>Inactive</span>
          </div>
          <CardBody className="d-flex align-items-center justify-content-between">
            <label className="h5 mb-0">Parking Map</label>
            {imageUploaded && (
              <Button disabled className="ms-auto" color="warning" onClick={() => setIsEditing(true)}>Go to floor map</Button>
            )}
            {!imageUploaded && (
              <FormGroup disabled>
                <Input
                  type="file"
                  accept=".png, .jpeg, .jpg"
                  onChange={handleImageReplaceConfirm}
                  style={{ display: 'none' }}
                  id="imageUploadFooter"
                />
                <Button color="primary" disabled>
                  Upload Floor Map
                </Button>
              </FormGroup>
            )}
          </CardBody>
        </Card>
      )}


      {isEditing && (
        <Card>
          <CardHeader className="d-flex justify-content-between align-items-center flex-column flex-md-row p-3">
            {imageUploaded && (
              <FormGroup style={{ flex: 1, minWidth: '200px' }} className="m-2">
                <Select
                  id="shapeId"
                  value={dropdownOptions.find(option => option.value === selectedId)}
                  onChange={(option) => {
                    const ExhId = option.exhibitor;
                    const shapeId = option.value;

                    if (shapePositions[ExhId] && shapePositions[ExhId][shapeId]) {
                      setShapeValidationMessage('This shape is already positioned for the selected exhibitor.');
                    } else {
                      setShapeValidationMessage('');
                      setIsMarkerModalOpen(true);
                      setSelectedId(shapeId ? shapeId : null);
                      setSelectedExhId(ExhId ? ExhId : null);
                    }
                  }}

                  options={dropdownOptions}
                  classNamePrefix="react-select"
                  placeholder="Select Location"
                  styles={{
                    container: (provided) => ({ ...provided, width: '100%' }),
                    menu: (provided) => ({ ...provided, zIndex: 9999 })
                  }}
                />
                {shapeValidationMessage && (
                  <div className="text-danger mt-2">
                    {shapeValidationMessage}
                  </div>
                )}
              </FormGroup>
            )}

            {imageUploaded && (
              <FormGroup style={{ flex: 1, minWidth: '200px' }} className="m-2">
                {/* <Select
                  id="hallId"
                  value={hallOptions.find(option => option.value === selectedHallId)}
                  onChange={(option) => {
                    const selectedHallId = option.value;
                    if (hallPositions[selectedHallId]) {
                      setHallValidationMessage('This hall is already positioned on the map.');
                    } else {
                      setHallValidationMessage('');
                      setSelectedHallId(selectedHallId);
                      setIsDrawingPolygon(true); // Enable polygon drawing
                    }
                  }}
                  options={hallOptions}
                  placeholder="Select Hall"
                  classNamePrefix="react-select"
                  styles={{
                    container: (provided) => ({ ...provided, width: '100%' }),
                    menu: (provided) => ({ ...provided, zIndex: 9999 })
                  }}
                /> */}
                <Select
                  id="hallId"
                  value={hallOptions.find(option => option.value === selectedHallId)}
                  onChange={handleHallSelect} // Use the handleHallSelect function
                  options={hallOptions}
                  placeholder="Select Hall"
                  classNamePrefix="react-select"
                  styles={{
                    container: (provided) => ({ ...provided, width: '100%' }),
                    menu: (provided) => ({ ...provided, zIndex: 9999 })
                  }}
                />
                {hallValidationMessage && (
                  <div className="text-danger mt-2">
                    {hallValidationMessage}
                  </div>
                )}
              </FormGroup>
            )}

            {imageUploaded && (
              <Button color="warning" className="mb-2" onClick={savePositions}>
                Save Floor Map
              </Button>
            )}
          </CardHeader>
          <CardBody>
            {imagePath && (
              <MapContainer
                attributionControl={false}
                style={{ height: '500px', width: '100%' }}
                center={[0.5, 0.5]}
                zoom={zoom}
                minZoom={8}
                crs={L.CRS.Simple}
                maxBounds={bounds}
                maxBoundsViscosity={1.0}
              >
                {imageSrc ? (
                  <ImageOverlay url={imageSrc} bounds={bounds} />
                ) : (
                  imagePath && (
                    <ImageOverlay
                      url={`${BackendPath}${imagePath}`}
                      bounds={bounds}
                    />
                  )
                )}

                <FeatureGroup ref={(featureGroupRef) => { if (featureGroupRef) drawnItems.addLayer(featureGroupRef) }}>
                  {/* Render Markers */}
                  {Object.keys(shapePositions).map((exhId) =>
                    Object.keys(shapePositions[exhId]).map((id) => {
                      const shape = shapes.find((shape) => shape.id === parseInt(id));
                      if (!shape) return null;

                      const position = shapePositions[exhId][id];
                      const markerKey = `marker-${exhId}-${id}`;

                      const getIcon = (shapeType) => L.icon({
                        iconUrl: iconMapping[shapeType] || locationicon,
                        iconSize: [30, 30],
                        iconAnchor: [15, 30],
                        popupAnchor: [0, -30]
                      });

                      const eventHandlers = {
                        dragend: (event) => {
                          const newLatLng = event.target.getLatLng();
                          updateShapePosition(exhId, id, newLatLng); // Update shape position in state
                        }
                      };

                      const toggleDraggable = () => {
                        setIsDraggable((prev) => !prev);
                      };

                      return (
                        <Marker
                          draggable={isDraggable}
                          eventHandlers={eventHandlers}
                          key={markerKey}
                          position={[position.lat, position.lng]}
                          icon={getIcon(shape.shape_type)}
                          id={markerKey}
                        >
                          <Popup>
                            <strong>{shape.location_name}</strong><br />
                            {shape.exh_type}
                            <br />
                            {/* <Button color="primary" size="sm" onClick={toggleDraggable}>
                              {isDraggable ? 'Stop Dragging' : 'Enable Dragging'}
                            </Button> */}
                            <br />
                            <Button color="danger" size="sm" onClick={() => removeShape(exhId, id)}>
                              Remove from map
                            </Button>
                          </Popup>
                        </Marker>
                      );
                    })
                  )}


                  {/* Render existing polygons */}
                  {polygonsVisible && Object.keys(hallPositions).map((id) => {
                    const shape = hallPositions[id];
                    if (shape && shape.geometry && shape.geometry.type === 'Polygon') {
                      const coordinates = shape.geometry.coordinates[0].map(coord => [coord[1], coord[0]]);
                      const hall = hallData.find((hall) => hall.locat_id === parseInt(id));

                      if (coordinates.length > 0 && hall) { // Only render if hall exists
                        return (
                          <Polygon
                            key={id}
                            positions={coordinates}
                            color="black"
                            fillColor="orange"
                          >
                            <Popup>
                              <strong>{hall.locat_name}</strong>
                              <br />
                              <Button color="danger" size="sm" onClick={() => removeHallShape(id)}>
                                Remove from map
                              </Button>
                            </Popup>
                          </Polygon>
                        );
                      }
                    }
                    return null;
                  })}

                  {/* <Button
                    onClick={handlePolygonDraw}
                    style={{
                      position: 'absolute',
                      top: '10px',
                      right: '10px',
                      zIndex: 1000,
                      backgroundColor: 'white',
                      border: '1px solid gray',
                      padding: '5px 10px',
                    }}
                  >
                    <FaEdit /> Edit
                  </Button> */}



                  {/* Render the polygon drawing tool if needed */}
                  {isDrawingPolygon && (
                    <>

                      <EditControl
                        position="topright"
                        onCreated={handlePolygonDraw} // Function to handle polygon creation
                        onEditStart={handleEditStart} // Hide polygons when edit starts
                        onEditStop={handleEditEnd}    // Show polygons when editing stops
                        onEdited={handleEdit}         // Save polygons after editing
                        draw={{
                          rectangle: false,
                          circle: false,
                          marker: false,
                          circlemarker: false,
                          polyline: false,
                          polygon: isDrawingPolygon && polygonsVisible // Only allow polygon drawing if allowed
                        }}
                        edit={{
                          featureGroup: drawnItems,  // Group of editable layers
                          remove: false,             // Disable remove control from Leaflet
                          edit: false
                        }}
                      />
                    </>
                  )}





                </FeatureGroup>
                <MapEvents />
              </MapContainer>
            )}
          </CardBody>

          <CardFooter className="d-flex justify-content-end">
            {imageUploaded && (
              <FormGroup>
                <Input
                  type="file"
                  accept=".png, .jpeg"
                  onChange={handleImageReplaceConfirm}
                  style={{ display: 'none' }}
                  id="imageUploadFooter"
                />
                <Button color="primary" onClick={() => setReplaceModalOpen(true)}>
                  Replace Floor Map
                </Button>
              </FormGroup>
            )}
          </CardFooter>
        </Card>
      )}
      {/* Upload Image Modal */}
      <Modal isOpen={UploadModalOpen} toggle={() => setUploadModalOpen(false)}>
        <ModalHeader toggle={() => setUploadModalOpen(false)}>Upload Floor Map</ModalHeader>
        <ModalBody>
          <p>
            Please upload an image in JPG, JPEG, or PNG format, not exceeding 5 MB.
          </p>
        </ModalBody>
        <ModalFooter>
          <Button color="primary" onClick={confirmImageReplace}>Yes</Button>
          <Button color="warning" onClick={() => setUploadModalOpen(false)}>Cancel</Button>
        </ModalFooter>
      </Modal>

      {/* Replace Image Modal */}
      <Modal isOpen={replaceModalOpen} toggle={() => setReplaceModalOpen(false)}>
        <ModalHeader toggle={() => setReplaceModalOpen(false)}>Confirm Replace</ModalHeader>
        <ModalBody>
          <p>
            When changing the floor map image, only the floor map image will be deleted. All the located locations & halls will retain their positions as they are.
            Are you sure you want to change the floor map image?
          </p>
        </ModalBody>
        <ModalFooter>
          <Button color="primary" onClick={confirmImageReplace}>Yes</Button>
          <Button color="warning" onClick={() => setReplaceModalOpen(false)}>Cancel</Button>
        </ModalFooter>
      </Modal>

      {/* Modal for hall */}
      <Modal isOpen={isModalOpen} toggle={() => setIsModalOpen(false)}>
        <ModalHeader toggle={() => setIsModalOpen(false)}>How to Place a Hall</ModalHeader>
        <ModalBody>
          <p>
            <strong>Step 1:</strong> First, click on the <strong>Polygon button</strong> located at the top right corner of the floor map to activate drawing mode.
          </p>
          <p>
            <strong>Step 2:</strong> Once drawing mode is active, click anywhere on the map to start drawing your selection area.
          </p>
          <p>
            <strong>Step 3:</strong> Move your mouse to form the shape of the hall or area you want to define. Each click will add a new point to your polygon.
          </p>
          <p>
            <strong>Step 4:</strong> Once you're finished, click on the first point you created to close the shape and complete your polygon. This will be your hall selection area.
          </p>
          {/* <p>
            <strong>Note:</strong> You can click and drag the points to adjust your polygon if needed. If you're unsure about the shape, feel free to start again by clicking the "Clear" button once available.
          </p> */}
        </ModalBody>
        {/* <ModalFooter>
          <Button color="warning" onClick={() => setIsModalOpen(false)}>
            Close
          </Button>
        </ModalFooter> */}
      </Modal>

      {/* Modal for marker */}
      <Modal isOpen={isMarkerModalOpen} toggle={() => setIsMarkerModalOpen(false)}>
        <ModalHeader toggle={() => setIsMarkerModalOpen(false)}>How to Place a Marker</ModalHeader>
        <ModalBody>
          <p>
            <strong>Step 1:</strong> Simply click anywhere on the floor map where you want to place your marker.
          </p>
          <p>
            <strong>Step 2:</strong> A marker you selected will appear at the location you clicked. This will be your selected point on the floor map.
          </p>
          {/* <p>
            <strong>Step 3:</strong> You can drag the marker to adjust its position if needed.
          </p>
          <p>
            <strong>Note:</strong> You can add multiple markers by clicking in different locations on the map. Click on any existing marker to edit or remove it.
          </p> */}
        </ModalBody>
        {/* <ModalFooter>
          <Button color="warning" onClick={() => setIsMarkerModalOpen(false)}>
            Close
          </Button>
        </ModalFooter> */}
      </Modal>


    </Fragment>
  );
};

export default FloorPlanEditor;


