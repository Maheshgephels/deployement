import React, { Fragment, useState, useRef, useEffect } from 'react';
import BadgeElement from '../badgelement/BadgeElement';
import ComponentSettings from '../componentsetting/ComponentSettings';
import './BadgeDesigner.css';
import BadgePDFExporter from '../BadgePDFExporter/BadgePDFExporter';
// import AddFieldForm from '../badgedesign/AddFieldForm/AddFieldForm';
import AddFieldForm from '../AddFieldForm/AddFieldForm';
import axios from 'axios';
import { Card, Col, Container, Row, ButtonGroup } from 'reactstrap';
import { v4 as uuidv4 } from 'uuid';
import Select from 'react-select';
// import BadgePDFDownloadButton from '../../component/badgeDownlode/BadgePDFDownloadButton'; 
import { useLocation } from 'react-router-dom';
import { BackendAPI } from '../../../api/index';
import { BackendPath } from '../../../api/index';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import SweetAlert from 'sweetalert2';
// import { getToken } from '../../Auth/Auth';
// import useAuth from '../../Auth/protectedAuth';
import useAuth from '../../../Auth/protectedAuth';
import { getToken } from '../../../Auth/Auth';
import { FaEdit } from 'react-icons/fa';
import { RiImageAddFill } from "react-icons/ri";
import { CiText } from "react-icons/ci";
import { AiOutlineBgColors } from "react-icons/ai";
import { BiQrScan } from "react-icons/bi";
import { GrFormDown, GrFormUp } from 'react-icons/gr';
import { MdGrid4X4, MdCancel } from "react-icons/md";
import { FaXmark } from "react-icons/fa6";
import { FaSearchMinus, FaSearchPlus, FaRedo } from 'react-icons/fa';
import { Tooltip } from 'react-tooltip';
import { Modal, ModalHeader, ModalBody, ModalFooter, Button, FormGroup, Label, Input, CardBody, CardHeader } from 'reactstrap';
import { Breadcrumbs } from '../../../AbstractElements';

const BadgeDesigner = () => {

    useAuth();
    const location = useLocation();
    // Destructure properties from location.state with default values or empty strings
    const { badgeName = '', designation = '', badgeData = '', category = '' } = location.state || {};

    // Destructure badgeDatafromApi and badge with default values or an empty object
    const { badgeDatafromApi = {}, badge = {}, badge_Type } = location.state || {};

    // Determine the values of categoryName, designationName, and badgeName based on the source
    const categoryName = badge.category_name || category.name;
    const designationName = badge.designation_name || designation;
    const editedBadgeName = badge.badge_name || null;
    const finalBadgeName = editedBadgeName || badgeName;
    const [modal, setModal] = useState(false);
    const [modalOpen, setModalOpen] = useState(false);
    const [showGrid, setShowGrid] = useState(false);
    const [activeSide, setActiveSide] = useState('front'); // Track which side is active
    const [selectedCat, setSelectedCat] = useState(null); // Added state to store selected category
    const [selectedCategory, setSelectedCategory] = useState(badge.category_name || category.name

    ); // Added state to store selected category
    const [catData, setCatData] = useState([]);


    const orientationOptions = [
        { value: 'Portrait', label: 'Portrait' },
        { value: 'Landscape', label: 'Landscape' },
    ];

    const toggleSide = (side) => {
        setActiveSide(side);
    };

    const handleSelectChange = (selectedOption) => {
        setSelectedCat(selectedOption ? selectedOption.value : null);
        setSelectedCategory(selectedOption.label);
    };

    useEffect(() => {
        const fetchCat = async () => {
            try {
                const token = getToken();
                const response = await axios.get(`${BackendAPI}/badge/getNoBadgeCat`, {
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
        fetchCat();
    }, []);

    // Initialize storedData state using the appropriate values
    const [storedData, setStoredData] = useState({
        id: badge.category_id || '',
        badgeName: typeof finalBadgeName === 'string' ? finalBadgeName : '',
        badgeData: typeof badgeData === 'string' ? badgeData : '',
        designation: typeof designationName === 'string' ? designationName : '',
        categoryName: typeof categoryName === 'string' ? categoryName : ''
    });

    const [tooltipOpen, setTooltipOpen] = useState({
        addCustomText: false,
        addFullName: false,
        selectImage: false,
        selectBackgroundImage: false,
        addQRCode: false,
    });

    // console.log("badgeData in designer", badgeData.badgeType);
    const toggleTooltip = () => setTooltipOpen(!tooltipOpen);


    const navigate = useNavigate(); // Initialize navigate hook
    const [size, setSize] = useState('');
    const [badgeSize, setBadgeSize] = useState({ width: badgeData.width, height: badgeData.height });
    const [dbadgeSize, setDBadgeSize] = useState({ width: badgeData.width, height: badgeData.height / 2 });
    const CM_TO_PX = 37.795276;
    const [badgeWidth, setBadgeWidth] = useState(((badgeData.width / CM_TO_PX).toFixed(2)));  // Initialize with value in cm
    const [badgeHeight, setBadgeHeight] = useState((badgeData.height / CM_TO_PX).toFixed(2));  // Initialize with value in cm
    const [orientation, setOrientation] = useState('');
    const [zoom, setZoom] = useState(0.60);
    // const [showGrid, setShowGrid] = useState(false);
    const [components, setComponents] = useState([]);
    const [badgeType, setBadgeType] = useState(badge.badge_type || badgeData.badgeType);
    // const badgeType = badgeData.badgeType

    const [showComponentSettings, setShowComponentSettings] = useState(false);
    const [selectedComponent, setSelectedComponent] = useState(null);
    const [showPreview, setShowPreview] = useState(false);
    const [showExport, setShowExport] = useState(false);
    const [componentCounter, setComponentCounter] = useState(1);
    const [enteredText, setEnteredText] = useState("");
    const [selectedImage, setSelectedImage] = useState(null);
    const [badgeNam, setBadgeName] = useState(storedData.badgeName);
    const [categoryName1, setCategoryName] = useState(storedData.categoryName);
    const [selectedOption, setSelectedOption] = useState('');
    const [showLayers, setShowLayers] = useState(false);
    const [showText, setShowText] = useState(false);
    const [showBadgeSection, setShowBadgeSection] = useState(false);
    // const [qrCodeData, setQRCodeData] = useState('');
    const PX_TO_CM = 0.0264583333;

    const [isFrontEditable, setIsFrontEditable] = useState(true);
    const [selectedSide, setSelectedSide] = useState('front'); // Default to front

    // Toggle between front and back editability
    const toggleEditableSide = () => {
        setIsFrontEditable(prev => !prev); // Switch between front and back
    };

    // State to track the currently editable side for Double/Single badges
    const [rotateBadge, setRotateBadge] = useState(false); // For Double Badge rotation


    const zoomIn = () => setZoom((prev) => Math.min(prev + 0.1, 2)); // Max zoom level: 200%
    const zoomOut = () => setZoom((prev) => Math.max(prev - 0.1, 0.5)); // Min zoom level: 50%
    const resetZoom = () => setZoom(0.60);

    console.log("Location : ", location.state);

    console.log("Component : ", components);
    console.log("Badge Type : ", badgeType);
    console.log("Badge Data : ", badgeData);
    console.log("Current Orientation (before update):", orientation);


    console.log("Badge Size : ", badgeSize);
    console.log("Double badge size : ", dbadgeSize);




    // const [isBadgeDesignSaved, setIsBadgeDesignSaved] = useState(false);

    const toggleModal = () => setModalOpen(!modalOpen);

    const handleBadgeTypeChange = (e) => setBadgeType(e.target.value);

    const toggleGrid = () => {
        setShowGrid(prev => !prev);
    };

    // Styling for the badge container
    const badgeContainerStyle = {
        // width: dbadgeSize.width,
        // height: dbadgeSize.height,
        width: badgeType === 'Double' ? dbadgeSize.width : badgeSize.width,
        height: badgeType === 'Double' ? dbadgeSize.height : badgeSize.height,
        transform: rotateBadge ? 'rotate(180deg)' : 'none', // Apply 180-degree rotation for Double badge
        transition: 'transform 0.3s', // Smooth transition for rotating
        transform: `scale(${zoom})`,

    };

    // Conditional styles for each badge type
    const frontStyle = { flex: 1 }; // Default front style
    const backStyle = badgeType == 'Double' ? { transform: 'rotate(180deg)', flex: 1 } : { flex: 1 };


    const handleEdit = () => {
        toggleModal(); // Open modal
    };
    const handleSave = () => {
        // Handle saving of the edited data
        // console.log('Saving:', badgeName, categoryName);
        toggleModal(); // Close modal after saving
    };

    // Function to handle selecting a component (e.g., when clicked)
    const handleSelectComponent = (id) => {
        setSelectedComponent(id); // Set the selected component's ID
    };


    // Inside your BadgeDesigner component
    useEffect(() => {
        if (badgeDatafromApi && badgeDatafromApi.badge_fields) {
            const { size, width, height, orientation, badge_fields } = badgeDatafromApi;

            console.log("Fields", badge_fields);
            // Convert pixel values to centimeters
            setSize(size);
            const widthInCm = width * PX_TO_CM;
            const heightInCm = height * PX_TO_CM;
            // console.log("Width from badgeDatafromApi:", widthInCm);
            // console.log("Height from badgeDatafromApi:", heightInCm);

            // Map through badge_fields array and create components
            const initialComponents = badge_fields.map((field) => {
                // Extract position and size from field data
                const position = {
                    top: parseFloat(field.cs_field_position_y),
                    left: parseFloat(field.cs_field_position_x),
                    zIndex: field.cs_zindex
                };
                const size = {
                    width: parseFloat(field.cs_field_width),
                    height: parseFloat(field.cs_field_height)
                };

                // Create component object based on field type
                let component = {};
                if (field.cs_field_type_id === 'text') {
                    component = {
                        id: field.cs_field_id,
                        type: field.cs_field_type_id,
                        content: field.cs_field_label,
                        position: position,
                        size: size,
                        side: field.cs_badge_side,
                        textFontSize: parseFloat(field.cs_text_size) || 12,
                        fontColor: field.cs_field_color,
                        alignment: field.cs_field_alignment,
                        font: field.cs_font,
                        textcase: field.cs_textcase,
                        fontWeight: field.cs_field_weight,
                        rotation: field.cs_field_rotate


                    };

                } else if (field.cs_field_type_id === 'image') {
                    component = {
                        id: field.cs_field_id,
                        type: field.cs_field_type_id,
                        content: field.cs_field_content, // Assuming the content is the image URL
                        position: position,
                        size: size,
                        side: field.cs_badge_side,
                        rotation: field.cs_field_rotate
                    };
                }
                else if (field.cs_field_type_id === 'backgroundimage') {
                    component = {
                        id: field.cs_field_id,
                        type: field.cs_field_type_id,
                        content: field.cs_field_content, // Assuming the content is the image URL
                        position: position,
                        size: size,
                        side: field.cs_badge_side,
                        rotation: field.cs_field_rotate
                    };
                } else if (field.cs_field_type_id === 'qr') {
                    component = {
                        id: field.cs_field_id,
                        type: field.cs_field_type_id,
                        content: 'qr', // Placeholder content for QR code components
                        position: position,
                        size: size,
                        side: field.cs_badge_side,
                        rotation: field.cs_field_rotate
                    };
                }
                else if (field.cs_field_type_id === 'customtext') {
                    component = {
                        id: field.cs_field_id,
                        type: field.cs_field_type_id,
                        content: field.cs_field_label,
                        position: position,
                        size: size,
                        side: field.cs_badge_side,
                        textFontSize: parseFloat(field.cs_text_size) || 12,
                        fontColor: field.cs_field_color,
                        alignment: field.cs_field_alignment,
                        font: field.cs_font,
                        textcase: field.cs_textcase,
                        fontWeight: field.cs_field_weight,
                        rotation: field.cs_field_rotate
                    };

                }
                else if (field.cs_field_type_id === 'fullname') {
                    component = {
                        id: field.cs_field_id,
                        type: field.cs_field_type_id,
                        content: field.cs_field_label,
                        position: position,
                        size: size,
                        side: field.cs_badge_side,
                        textFontSize: parseFloat(field.cs_text_size) || 12,
                        fontColor: field.cs_field_color,
                        alignment: field.cs_field_alignment,
                        font: field.cs_font,
                        textcase: field.cs_textcase,
                        fontWeight: field.cs_field_weight,
                        rotation: field.cs_field_rotate
                    };

                }
                return component;
            });

            // Set initial components state
            setComponents(initialComponents);

            // Set badge orientation
            setOrientation(orientation);

            // Set badge size
            setBadgeSize({ width: parseFloat(width), height: parseFloat(height) });
            setDBadgeSize({ width: parseFloat(width), height: parseFloat(height) / 2 });


            console.log("Orientation:", orientation);



            // Check if the retrieved width and height match any predefined page size
            // Check if the retrieved width and height approximately match any predefined page size
            const matchingPageSize = Object.entries(pageSizes).find(([size, dimensions]) => {
                const precision = 0.0001; // Adjust precision as needed
                return Math.abs(dimensions.width - widthInCm) < precision && Math.abs(dimensions.height - heightInCm) < precision;
            });

            // console.log('Matching page size:', matchingPageSize);

            if (matchingPageSize) {
                setSelectedPageSize(matchingPageSize[0]); // Set selected size to matched predefined size
            } else {
                setSelectedPageSize('custom'); // Set to "Custom" if size doesn't match predefined sizes
            }
        }
    }, [badgeDatafromApi]);


    //-- pages sizes 
    // Standard page sizes in cm
    const [selectedPageSize, setSelectedPageSize] = useState('custom');
    const [customPageSize, setCustomPageSize] = useState({ width: '', height: '' });
    const pageSizes = {
        'Custom size': { width: 10, height: 15 },
        A4: { width: 21, height: 29.7 },
        A5: { width: 14.8, height: 21 },
        A6: { width: 10.5, height: 14.8 },
    };
    // Handler for changing page size
    // const handlePageSizeChange = (e) => {
    //     const newSize = e.target.value;
    //     setSelectedPageSize(newSize);
    //     if (newSize === 'custom') {
    //         setCustomPageSize({ width: '', height: '' });
    //     } else {
    //         const pageSizeInCm = pageSizes[newSize];
    //         setBadgeSize({
    //             width: pageSizeInCm.width * CM_TO_PX,
    //             height: pageSizeInCm.height * CM_TO_PX
    //         });
    //     }
    // };


    const handlePageSizeChange = (e) => {
        const newSize = e.target.value;
        console.log("New size", newSize);
        setSelectedPageSize(newSize);
        setSize(newSize);
        if (newSize === 'Custom size' && badgeType === 'Single') {
            setBadgeSize({ width: 10 * CM_TO_PX, height: 15 * CM_TO_PX });
            setDBadgeSize({ width: 10 * CM_TO_PX, height: 30 * CM_TO_PX / 2 });
        } else if (newSize === 'Custom size' && badgeType === 'Single') {
            setBadgeSize({ width: 10 * CM_TO_PX, height: 30 * CM_TO_PX });
            setDBadgeSize({ width: 10 * CM_TO_PX, height: 30 * CM_TO_PX / 2 });
        }
        else {
            const pageSizeInCm = pageSizes[newSize];
            setBadgeSize({
                width: pageSizeInCm.width * CM_TO_PX,
                height: pageSizeInCm.height * CM_TO_PX
            });
            setDBadgeSize({
                width: pageSizeInCm.width * CM_TO_PX,
                height: pageSizeInCm.height * CM_TO_PX / 2
            });
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


    const handleWidthChange = (e) => {
        const cmValue = parseFloat(e.target.value).toFixed(3);
        const pxValue = cmValue * CM_TO_PX;
        setBadgeSize({ ...badgeSize, width: pxValue });
        setDBadgeSize({ ...dbadgeSize, width: pxValue });

    };

    const handleHeightChange = (e) => {
        const cmValue = parseFloat(e.target.value).toFixed(3);
        const pxValue = cmValue * CM_TO_PX;
        setBadgeSize({ ...badgeSize, height: pxValue });
        setDBadgeSize({ ...dbadgeSize, height: pxValue });
    };



    const handleTextContentChange = (newText) => {
        setEnteredText(newText); // Update the entered text state
        // Update the content property of the selected component
        const updatedComponents = components.map((component) => {
            if (component.id === selectedComponent) {
                return { ...component, content: newText };
            }
            return component;
        });
        setComponents(updatedComponents);
    };

    const handleTextCaseChange = (casetype) => {
        // setEnteredText(newText); // Update the entered text state
        // Update the content property of the selected component
        const updatedComponents = components.map((component) => {
            if (component.id === selectedComponent) {
                return { ...component, textcase: casetype };
            }
            return component;
        });
        setComponents(updatedComponents);
    };


    // Addon properties 

    // Example handler functions to add in your BadgeDesigner component
    const handleTextFontChange = (id, newFont) => {
        setComponents(prevComponents =>
            prevComponents.map(component =>
                component.id === id ? { ...component, font: newFont } : component
            )
        );
    };


    const handleTextFontWeightChange = (id, newFontWeight) => {
        setComponents(prevComponents =>
            prevComponents.map(component =>
                component.id === id ? { ...component, fontWeight: newFontWeight } : component
            )
        );
    };


    const handleTextAlignmentChange = (id, newTextAlign) => {
        setComponents(prevComponents =>
            prevComponents.map(component =>
                component.id === id ? { ...component, alignment: newTextAlign } : component
            )
        );
    };


    const handleTextRotationChange = (id, newRotation) => {
        setComponents(prevComponents =>
            prevComponents.map(component =>
                component.id === id ? { ...component, rotation: newRotation } : component
            )
        );
    };

    const handleTextColorChange = (id, newColor) => {
        setComponents(prevComponents =>
            prevComponents.map(component =>
                component.id === id ? { ...component, fontColor: newColor } : component
            )
        );
    };

    // Addon properties end



    const saveBadgeDesign = async () => {
        // Add 'field_side' property to each component
        const updatedComponents = components.map((component) => {
            // Set the field_side based on the component's side ('front' or 'back')
            return {
                ...component,
                cs_badge_side: component.side === 'front' ? 'front' : 'back',  // Assuming 'side' is either 'front' or 'back'
            };
        });

        const badgeDesign = {
            badgeSize,
            orientation,
            components: updatedComponents, // Use the updated components with 'field_side'
            storedData,
            badgeType,
            badgeNam,
            selectedCat,
            size: selectedPageSize
        };

        try {
            const token = getToken();
            const response = await axios.post(`${BackendAPI}/badge/saveBadgeDesign`, badgeDesign, {
                headers: {
                    Authorization: `Bearer ${token}` // Include the token in the Authorization header
                }
            });

            if (response.status === 200 || response.status === 201) {
                const successMessage = badgeData && badgeData.length > 0
                    ? 'Badge Template Saved Successfully!'
                    : 'Badge Template Updated Successfully!';

                SweetAlert.fire({
                    title: 'Success!',
                    text: successMessage,
                    icon: 'success',
                    timer: 3000,
                    showConfirmButton: false,
                    allowOutsideClick: false,
                    allowEscapeKey: false
                }).then((result) => {
                    if (result.dismiss === SweetAlert.DismissReason.timer) {
                        navigate(`${process.env.PUBLIC_URL}/onsite/create-badges/Consoft`);
                    }
                });

                setShowExport(true);
            } else {
                console.error('Failed to save badge design. Unexpected response:', response);
                toast.error('Failed to save badge design. Please try again.');
            }
        } catch (error) {
            console.error('Error saving badge design:', error);
            alert('Failed to save badge design. Please try again.');
        }
    };

    //------
    const addFullNameComponent = () => {
        const defaultComponentSize = { width: 113.3858267717, height: 30.7952755906 }; // You can adjust the size as needed
        const newPosition = {
            top: badgeSize.height / 2 - defaultComponentSize.height / 2,
            left: badgeSize.width / 2 - defaultComponentSize.width / 2
        };
        const newComponent = {
            id: uuidv4(),
            type: 'fullname', // Set the type to 'fullname'
            content: 'fullname', // Initialize content as empty
            // position: newPosition,
            position: {
                left: badgeType === 'Double' || badgeType === 'Mirror' ? dbadgeSize.width / 2 - defaultComponentSize.width / 2 : badgeSize.width / 2 - defaultComponentSize.width / 2,
                top: badgeType === 'Double' || badgeType === 'Mirror' ? dbadgeSize.height / 2 - defaultComponentSize.height / 2 : badgeSize.height / 2 - defaultComponentSize.height / 2,
                zIndex: 2
            },
            size: { ...defaultComponentSize },
            side: activeSide,
            textFontSize: 12, // Set default font size
            textcase: 'titlecase'
        };
        setComponents([...components, newComponent]);
        setSelectedComponent(newComponent.id);
    };
    //------


    const addCustomTextComponent = () => {
        const defaultComponentSize = { width: 113.3858267717, height: 37.7952755906 };
        const newPosition = {
            top: badgeSize.height / 2 - defaultComponentSize.height / 2,
            left: badgeSize.width / 2 - defaultComponentSize.width / 2
        };
        const newComponent = {
            id: uuidv4(),
            type: 'customtext', // Set type to customtext
            content: 'New Custom Text', // Default content for custom text component
            // position: newPosition,
            position: {
                left: badgeType === 'Double' || badgeType === 'Mirror' ? dbadgeSize.width / 2 - defaultComponentSize.width / 2 : badgeSize.width / 2 - defaultComponentSize.width / 2,
                top: badgeType === 'Double' || badgeType === 'Mirror' ? dbadgeSize.height / 2 - defaultComponentSize.height / 2 : badgeSize.height / 2 - defaultComponentSize.height / 2,
                zIndex: 2
            },
            size: { ...defaultComponentSize },
            side: activeSide,
            textFontSize: 12,
            textcase: 'titlecase'
        };
        setComponents([...components, newComponent]);
        setSelectedComponent(newComponent.id);
    };


    const addFieldAsComponent = (field) => {
        console.log("Data", field);
        const newComponent = {
            id: uuidv4(),
            type: 'text', // or the appropriate type like 'image', 'qr', etc.
            content: field.cs_field_label,
            formfield_id: field.cs_field_id,
            formfield_name: field.cs_field_label,
            position: { top: 100, left: 100, zIndex: 2 },
            size: { width: 100, height: 25 },
            textFontSize: 12,
            side: field.side, // Use the side passed from the field object
        };

        console.log("Compo", newComponent);  // Check the side here
        console.log("field", field);  // Check the field object
        setComponents(prevComponents => [...prevComponents, newComponent]);

    };




    //----

    const handleImageChange = (event) => {
        const imageFile = event.target.files[0];
        if (!imageFile) {
            alert('Please select an image file.');
            return;
        }
        // console.log('Selected file:', imageFile.name, imageFile.size, imageFile.type);
        addComponentImage(imageFile); // Pass the image file to the addComponentImage function
        event.target.value = '';
    };


    //----------------

    const addComponentImage = async (imageFile) => {
        const formData = new FormData();
        formData.append('image', imageFile);
        // for (let key of formData.keys()) {
        //     console.log(key, formData.get(key));
        // }

        try {
            const token = getToken();
            // Upload the image file to your server
            const response = await axios({
                method: 'post',
                url: `${BackendAPI}/badge/uplaodebadgeimg`,
                data: formData,
                headers: {
                    'Content-Type': 'multipart/form-data',
                    Authorization: `Bearer ${token}`
                }
            });





            // Check if the upload was successful
            if (response.status === 200) {
                let relativeUrl = response.data.imageUrl;
                // console.log("relativeUrl", relativeUrl)
                const imageUrl = `${BackendPath}${relativeUrl}`;
                // console.log('Uploaded image URL:', imageUrl);
                const defaultComponentSize = { width: 100, height: 100 };
                const newPosition = {
                    top: badgeSize.height / 2 - defaultComponentSize.height / 2,
                    left: badgeSize.width / 2 - defaultComponentSize.width / 2
                };


                // const imageUrl = data.imageUrl; // Assuming the API returns the URL of the uploaded image
                // Create a new component with the image URL
                const newComponent = {
                    id: uuidv4(),
                    type: 'image',
                    content: imageUrl, // Store the URL of the uploaded image
                    // position: newPosition,
                    position: {
                        left: badgeType === 'Double' || badgeType === 'Mirror' ? dbadgeSize.width / 2 - defaultComponentSize.width / 2 : badgeSize.width / 2 - defaultComponentSize.width / 2,
                        top: badgeType === 'Double' || badgeType === 'Mirror' ? dbadgeSize.height / 2 - defaultComponentSize.height / 2 : badgeSize.height / 2 - defaultComponentSize.height / 2,
                        zIndex: 2
                    },
                    size: { ...defaultComponentSize },
                    side: activeSide,
                    textFontSize: 12
                };

                // Add the new component to the list of components
                setComponents([...components, newComponent]);
            } else {
                // Handle error response from the server
                // console.error('Error uploading image:', data.error);
            }
        } catch (error) {
            console.error('Error uploading image:', error);
        }
    };






    const handleBackgroundImageChange = (event) => {
        const imageFile = event.target.files[0];
        if (!imageFile) {
            alert('Please select a background image file.');
            return;
        }
        // console.log('Selected background image file:', imageFile.name, imageFile.size, imageFile.type);
        addBackgroundImageComponent(imageFile); // Pass the image file to the addBackgroundImageComponent function
        event.target.value = '';
    };

    const addBackgroundImageComponent = async (imageFile) => {
        const formData = new FormData();
        formData.append('image', imageFile);

        try {
            // Upload the image file to your server
            const token = getToken();
            const response = await axios({
                method: 'post',
                url: `${BackendAPI}/badge/uplaodebadgeimg`,
                data: formData,
                headers: {
                    'Content-Type': 'multipart/form-data',
                    Authorization: `Bearer ${token}`
                }
            });

            // Check if the upload was successful
            if (response.status === 200) {
                let relativeUrl = response.data.imageUrl;

                // console.log("relativeUrl", relativeUrl)


                const imageUrl = `${BackendPath}${relativeUrl}`;


                // const defaultComponentSize = { width: badgeSize.width, height: badgeSize.height };
                const defaultComponentSize = {
                    width: badgeType === 'Double' || badgeType === 'Mirror' ? dbadgeSize.width : badgeSize.width,
                    height: badgeType === 'Double' || badgeType === 'Mirror' ? dbadgeSize.height : badgeSize.height
                };


                // Create a new component for background image
                const newComponent = {
                    id: uuidv4(),
                    type: 'backgroundimage',
                    content: imageUrl,
                    position: { top: 0, left: 0 },
                    size: { ...defaultComponentSize },
                    side: activeSide,
                    textFontSize: 12
                };

                // Add the new component to the list of components
                setComponents([...components, newComponent]);
            } else {
                // Handle error response from the server
                // console.error('Error uploading image:', data.error);
            }
        } catch (error) {
            console.error('Error uploading background image:', error);
        }
    };







    const addComponentQRCode = () => {
        const newComponent = {
            id: componentCounter,
            type: 'qr',
            side: activeSide,
            content: 'qr', // Set content to an empty string
            position: {
                left: badgeType === 'Double' || badgeType === 'Mirror' ? dbadgeSize.width / 2 : badgeSize.width / 2,
                top: badgeType === 'Double' || badgeType === 'Mirror' ? dbadgeSize.height / 2 : badgeSize.height / 2,
                zIndex: 2
            },
            size: { width: 100, height: 100 },
            textFontSize: 12
        };
        setComponents([...components, newComponent]);
        setComponentCounter(componentCounter + 1);
    };


    // const handleComponentClick = (id) => {
    //     setSelectedComponent(id);
    // };

    const handleComponentClick = (id, selectedSide) => {
        console.log("selectedSide", selectedSide);  // Logs the selected side ('front' or 'back')

        setSelectedComponent(id);  // Keep track of the selected component
        setSelectedSide(selectedSide);  // Track the selected side ('front' or 'back')
    };


    const handleComponentSizeChange = (id, newSize) => {
        const updatedComponents = components.map((component) => {
            if (component.id === id) {
                return { ...component, size: newSize };
            }
            return component;
        });
        setComponents(updatedComponents);
    };


    // const handleComponentPositionChange = (id, newPosition) => {
    //     console.log("Get", newPosition);
    //     const updatedComponents = components.map((component) => {
    //         if (component.id === id) {
    //             return { ...component, position: newPosition};
    //         }
    //         return component;
    //     });
    //     setComponents(updatedComponents);
    // };

    const handleComponentPositionChange = (id, newPosition) => {
        const { zIndex } = newPosition;

        console.log("Get", newPosition);
        // Check if any component, excluding the current one, already has zIndex 2
        const hasZIndex2 = components.some(
            (comp) => comp.id !== id && comp.position.zIndex === 2
        );

        // If zIndex is set to 1, adjust all other components
        if (zIndex === 1) {
            const updatedComponents = components.map((comp) => {
                if (comp.id !== id && comp.type !== 'backgroundimage' && hasZIndex2) {
                    return {
                        ...comp,
                        position: {
                            ...comp.position,
                            zIndex: (comp.position?.zIndex || 0) + 1,
                        },
                    };
                }
                return comp;
            });


            // Set current component's zIndex to 2
            const finalComponents = updatedComponents.map((comp) =>
                comp.id === id
                    ? {
                        ...comp,
                        position: {
                            ...newPosition,
                            zIndex: 2,
                        },
                    }
                    : comp
            );

            setComponents(finalComponents);
        } else {
            // Otherwise, update only the target component
            const updatedComponents = components.map((comp) =>
                comp.id === id ? { ...comp, position: newPosition } : comp
            );

            setComponents(updatedComponents);
        }
    };



    const handleOrientationChange = (e) => {
        const newOrientation = e.target.value;


        console.log("New Orientation (to be updated):", newOrientation);

        // Update the orientation state
        setOrientation(newOrientation);


        // Adjust badge size based on new orientation
        if (newOrientation === 'Landscape') {
            setBadgeSize({ width: badgeSize.height, height: badgeSize.width });
            if (badgeType === 'Double') {
                setDBadgeSize({ width: badgeSize.height, height: badgeSize.width / 2 });
            }
        } else if (newOrientation === 'Portrait') {
            setBadgeSize({ width: badgeSize.width, height: badgeSize.height });
            if (badgeType === 'Double') {
                setDBadgeSize({ width: badgeSize.width, height: badgeSize.height / 2 });
            }
        }
    };


    // if (newOrientation === 'Portrait') {
    //     setBadgeSize({ width: badgeSize.width, height: badgeSize.height });
    //     if (badgeType === 'Double') {
    //         setDBadgeSize({ width: dbadgeSize.width, height: dbadgeSize.height / 2 });
    //     }
    // } else {
    //     setBadgeSize({ width: badgeSize.height, height: badgeSize.width });
    //     if (badgeType === 'Double') {
    //         setDBadgeSize({ width: dbadgeSize.height / 2, height: dbadgeSize.width });
    //     }
    // }






    const handleZoomChange = (e) => {
        setZoom(parseInt(e.target.value));
    };

    const handleGridToggle = () => {
        setShowGrid(!showGrid);
    };


    const handleComponentContentChange = (id, newContent) => {
        const updatedComponents = components.map((component) => {
            if (component.id === id) {
                return { ...component, content: newContent };
            }
            return component;
        });
        setComponents(updatedComponents);
    };

    const onDelete = (id) => {
        // Filter out the component with the given ID
        const updatedComponents = components.filter((component) => component.id !== id);
        setComponents(updatedComponents);
    };


    const handleTextFontSizeChange = (id, newTextFontSize) => {
        const updatedComponents = components.map((component) => {
            if (component.id === id) {
                return { ...component, textFontSize: newTextFontSize };
            }
            return component;
        });
        setComponents(updatedComponents);
    };

    ///--
    const [showAddFieldForm, setShowAddFieldForm] = useState(false);

    const toggleAddFieldForm = () => {
        setShowAddFieldForm(!showAddFieldForm);
    };



    const handleCancel = () => {
        setModal(true);
    };

    const handleNavigation = () => {
        navigate(`${process.env.PUBLIC_URL}/onsite/create-badges/Consoft`);
    };






    return (
        <Fragment>
            <Breadcrumbs mainTitle="Badge Design" parent="Manage Badge" title="Badge Design" />

            <Container>
                <Card className="my-4 p-3 shadow-sm border-0">
                    <div className="zoom-control">
                        <ButtonGroup >
                            <Button outline onClick={zoomOut} disabled={zoom <= 0.5} className="zoom-button" color='primary'>
                                <FaSearchMinus />
                            </Button>
                            <Button outline onClick={resetZoom} disabled={zoom === 1} className="zoom-button" color='primary'>
                                <FaRedo />
                            </Button>
                            <Button outline onClick={zoomIn} disabled={zoom >= 2} className="zoom-button" color='primary'>
                                <FaSearchPlus />
                            </Button>
                        </ButtonGroup>
                    </div>
                    <Row className="align-items-center">
                        <Col md="8" className="d-flex align-items-center">
                            {/* Back Button */}
                            {/* <span onClick={handleCancel} style={{ cursor: 'pointer', marginRight: '8px' }}>
    <FaArrowLeft />
  </span> */}

                            <div className="mb-0 text-start d-flex align-items-center">
                                {/* Badge Name */}
                                <Label className="me-3"><strong>Badge Name:</strong> {badgeNam || "Not specified"}</Label>

                                {/* Badge Category */}
                                <Label><strong>Badge Category:</strong> {selectedCategory || "Not specified"}</Label>

                                {/* Edit Icon */}
                                {badgeNam && (
                                    <span className="ms-2" onClick={handleEdit} style={{ cursor: 'pointer' }}>
                                        <FaEdit />
                                    </span>
                                )}
                            </div>
                        </Col>

                        <Col md="4" className="text-end">
                            <Button color=""
                                onClick={handleCancel}
                                className='me-2 circular'
                                data-tooltip-id="tooltip"
                                data-tooltip-content="Cancel"
                                data-tooltip-event="click focus"
                            >
                                <FaXmark className='buttonStyle' />
                            </Button>
                        </Col>

                    </Row>
                    <Tooltip id="tooltip" globalEventOff="click" />


                </Card>
                <Card>

                    <div>

                        {/* <div className='row align-items-center justify-content-center'> */}
                        {/* Card container */}

                        {/* </div> */}



                        <div className="badge-designer-container">
                            <Col md="4">
                                <Card >
                                    {/* Properties Section Header */}
                                    <CardHeader>
                                        <h6>Properties</h6>

                                        {/* Layers Section */}
                                        {/* <div className="layer-section">
                                            <label className="d-flex justify-content-between align-items-center">
                                                <strong>Layers</strong>
                                                <GrFormDown onClick={() => setShowLayers(!showLayers)} style={{ cursor: 'pointer' }} />
                                            </label>
                                            <div className="layer-property-box d-flex justify-content-between align-items-center  px-5 mb-2" style={{
                                                border: '1px solid',
                                                borderRadius: '5px',
                                                backgroundColor: '#f7f7f7',
                                                boxShadow: '0 1px 2px rgba(0, 0, 0, 0.1)', // Adding slight shadow for depth
                                            }}>
                                                <p style={{ color: '#6c757d' }}>Layer Properties</p> 
                                                <GrFormDown
                                                    onClick={() => setShowLayers(!showLayers)}
                                                    style={{ cursor: 'pointer', color: '#6c757d', marginLeft: '8px' }} // Use marginLeft for spacing
                                                />
                                            </div>


                                            {showLayers && (
                                                <Card className="bordered-card mb-3">
                                                    <CardBody >
                                                        {false ? (
                                                            <div>Layers exist here.</div>
                                                        ) : (
                                                            <div>No layers till now.</div>
                                                        )}
                                                    </CardBody>
                                                </Card>
                                            )}
                                        </div> */}

                                        {/* Text Section */}
                                        <div className="text-section">
                                            {/* <label className="d-flex justify-content-between align-items-center mb-2">
                                                <strong>Text</strong>
                                                <GrFormDown onClick={() => setShowText(!showText)} style={{ cursor: 'pointer' }} />
                                            </label> */}
                                            <div
                                                className="layer-property-box d-flex justify-content-between align-items-center px-5 mb-2"
                                                style={{
                                                    border: '1px solid',
                                                    borderRadius: '5px',
                                                    backgroundColor: '#f7f7f7',
                                                    boxShadow: '0 1px 2px rgba(0, 0, 0, 0.1)', // Adding slight shadow for depth
                                                    cursor: 'pointer', // Make the whole section clickable
                                                }}
                                                onClick={() => setShowText(!showText)} // Toggle state on click
                                            >
                                                <p style={{ color: '#6c757d', margin: 0 }}>Text Properties</p> {/* Grey text color */}
                                                {showText ? ( // Correctly check the state variable
                                                    <GrFormUp style={{ color: '#6c757d', marginLeft: '8px' }} />
                                                ) : (
                                                    <GrFormDown style={{ color: '#6c757d', marginLeft: '8px' }} />
                                                )}
                                            </div>


                                            {(showText || selectedComponent) && (
                                                <div>
                                                    {selectedComponent ? (
                                                        (() => {
                                                            // Find the selected component's data in the components array
                                                            const selectedComponentData = components.find(c => c.id === selectedComponent);
                                                            if (selectedComponentData) {
                                                                return (
                                                                    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flexDirection: 'column' }}>
                                                                        <ComponentSettings
                                                                            component={selectedComponentData}
                                                                            handleComponentSizeChange={handleComponentSizeChange}
                                                                            handleComponentPositionChange={handleComponentPositionChange}
                                                                            handleTextFontSizeChange={handleTextFontSizeChange}
                                                                            handleTextContentChange={handleTextContentChange}
                                                                            handleTextCaseChange={handleTextCaseChange}
                                                                            handleTextFontChange={handleTextFontChange}
                                                                            handleTextFontWeightChange={handleTextFontWeightChange}
                                                                            handleTextAlignmentChange={handleTextAlignmentChange}
                                                                            handleTextRotationChange={handleTextRotationChange}
                                                                            handleTextColorChange={handleTextColorChange}
                                                                            AllComponent={components}
                                                                        />
                                                                    </div>
                                                                );
                                                            }
                                                            return null; // No component data found for the selected component
                                                        })()
                                                    ) : (
                                                        <div className="non-interactive-placeholder mb-4">
                                                            <h5>No Component Selected</h5>
                                                            <p>Select or add a component to see its settings</p>
                                                        </div>
                                                    )}
                                                </div>
                                            )}



                                        </div>
                                        {/* Badge Section */}
                                        <div className="badge-section">
                                            {/* <label className="d-flex justify-content-between align-items-center mb-2">
                                                <strong>Badge Section</strong>
                                                <GrFormDown onClick={() => setShowBadgeSection(!showBadgeSection)} style={{ cursor: 'pointer' }} />
                                            </label> */}
                                            <div
                                                className="layer-property-box d-flex justify-content-between align-items-center px-5 mb-2"
                                                style={{
                                                    border: '1px solid',
                                                    borderRadius: '5px',
                                                    backgroundColor: '#f7f7f7',
                                                    boxShadow: '0 1px 2px rgba(0, 0, 0, 0.1)', // Adding slight shadow for depth
                                                    cursor: 'pointer', // Make the whole section clickable
                                                }}
                                                onClick={() => setShowBadgeSection(!showBadgeSection)} // Toggle state on click
                                            >
                                                <p style={{ color: '#6c757d', margin: 0 }}>Badge Properties</p> {/* Grey text color */}
                                                {showBadgeSection ? (
                                                    <GrFormUp style={{ color: '#6c757d', marginLeft: '8px' }} />
                                                ) : (
                                                    <GrFormDown style={{ color: '#6c757d', marginLeft: '8px' }} />
                                                )}
                                            </div>



                                            {showBadgeSection && (
                                                <Card className="bordered-card mb-3">
                                                    <div className="badge-settings bg-transparent">
                                                        {/* <h3>Badge Settings</h3> */}
                                                        <div className="row">
                                                            <div className='col-auto pe-0'>
                                                                <label htmlFor="orientation">Orientation:</label>
                                                                <select
                                                                    id="orientation"
                                                                    value={badgeData.orientation || orientation}
                                                                    onChange={handleOrientationChange}
                                                                    className='form-select'
                                                                >
                                                                    <option value="Landscape">Landscape</option>
                                                                    <option value="Portrait">Portrait</option>
                                                                </select>
                                                            </div>
                                                            {/* <FormGroup>
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
                                                            </FormGroup> */}
                                                            <div className='col-auto pe-0'>

                                                                <FormGroup>
                                                                    <Label for="badgeSize">Badge Size</Label>
                                                                    <Input type="select" id="badgeSize" value={badgeData.badgeSize || size} onChange={handlePageSizeChange}>
                                                                        <option value="Custom size">Custom size</option>
                                                                        <option value="A4">A4</option>
                                                                        <option value="A5">A5</option>
                                                                        <option value="A6">A6</option>
                                                                    </Input>
                                                                </FormGroup>
                                                            </div>
                                                        </div>
                                                        {size === 'Custom size' && (

                                                            <div className="row">
                                                                <div className='col'>
                                                                    <label htmlFor="badgeWidth">Width (cm):</label>
                                                                    <input
                                                                        id="badgeWidth"
                                                                        type="number"
                                                                        value={(badgeSize.width / CM_TO_PX).toFixed(1)}
                                                                        onChange={handleWidthChange} // Handle changes in centimeters
                                                                        className='form-control'
                                                                    />
                                                                </div>
                                                                <div className='col'>
                                                                    <label htmlFor="badgeHeight">Height (cm):</label>
                                                                    <input
                                                                        id="badgeHeight"
                                                                        type="number"
                                                                        value={(badgeSize.height / CM_TO_PX).toFixed(1)}
                                                                        onChange={handleHeightChange} // Handle changes in centimeters
                                                                        className='form-control'
                                                                    />
                                                                </div>
                                                            </div>

                                                        )}

                                                        <div className="row">
                                                            <div className="col">
                                                                <FormGroup>
                                                                    <Label for="badgeType">Badge Type</Label>
                                                                    <Input type="select" id="badgeType" value={badgeType} onChange={handleBadgeTypeChange}>
                                                                        <option value="Single">Single</option>
                                                                        <option value="Double">Double</option>
                                                                        <option value="Mirror">Mirror</option>
                                                                    </Input>
                                                                </FormGroup>
                                                            </div>
                                                            <div className="col">

                                                            </div>
                                                        </div>
                                                    </div>
                                                </Card>
                                            )}
                                        </div>
                                    </CardHeader>
                                </Card>
                            </Col>
                            <Col md="7" className='container-col-wrap'>
                                <AddFieldForm addFieldAsComponent={addFieldAsComponent} badgeType={badgeType} activeside={activeSide} />

                                {/* Toggle Rotate Badge Button (Only for Double Type) */}
                                {badgeType === 'Double' && (
                                    <div className="toggle-buttons mt-3 mb-3">
                                        <Button
                                            color="primary"
                                            outline={activeSide !== 'front'} // Makes it outlined if not active
                                            className={activeSide === 'front' ? 'active' : ''}
                                            onClick={() => toggleSide('front')}
                                        >
                                            Front Side
                                        </Button>
                                        <Button
                                            color="primary"
                                            outline={activeSide !== 'back'} // Makes it outlined if not active
                                            className={`ms-2 ${activeSide === 'back' ? 'active' : ''}`}
                                            onClick={() => toggleSide('back')}
                                        >
                                            Back Side
                                        </Button>
                                    </div>
                                )}



                                {/* Badge Container */}
                                <div
                                    className={`badge-container ${showGrid ? 'grid-active' : ''} ${rotateBadge ? 'rotate-180' : ''}`}
                                    style={badgeContainerStyle}
                                >
                                    {/* Single Badge */}
                                    {badgeType === 'Single' && (
                                        <div className="badge-content-single">
                                            <h5 className='type-title'>Single Badge</h5>
                                            {components
                                                // .filter(component => component.side === 'front') // Ensure only front elements are shown
                                                .map(component => (
                                                    <BadgeElement
                                                        key={component.id}
                                                        {...component}
                                                        font={component.font} // Pass the font to BadgeElement
                                                        onTextFontChange={handleTextFontChange} // Make sure the handler is passed
                                                        alignment={component.alignment}  // Pass alignment prop
                                                        fontWeight={component.fontWeight}  // Pass font weight prop
                                                        letterCasing={component.textcase}
                                                        isSelected={component.id === selectedComponent}
                                                        onSelect={handleComponentClick}
                                                        onSizeChange={handleComponentSizeChange}
                                                        onPositionChange={handleComponentPositionChange}
                                                        onContentChange={handleComponentContentChange}
                                                        onAlignmentChange={handleTextAlignmentChange}
                                                        onTextFontWeightChange={handleTextFontWeightChange}
                                                        onRotationChange={handleTextRotationChange}
                                                        onColorChange={handleTextColorChange}
                                                        onDelete={onDelete}
                                                        badgeSize={badgeSize}
                                                        showGrid={showGrid}
                                                        zoom={zoom}

                                                    />

                                                ))}
                                        </div>
                                    )}

                                    {/* Front Side */}
                                    {badgeType === 'Double' && activeSide === 'front' && (

                                        <div
                                            className={`badge-front ${showGrid ? 'grid-active' : ''} editable`}
                                            style={{
                                                flex: 1
                                            }}
                                        >
                                            <h5 className="type-title">Front Side (Editable)</h5>
                                            {components
                                                .filter((component) => component.side === 'front')
                                                .map((component) => (
                                                    <BadgeElement
                                                        key={component.id}
                                                        {...component}
                                                        font={component.font}
                                                        onTextFontChange={handleTextFontChange}
                                                        alignment={component.alignment}
                                                        fontWeight={component.fontWeight}
                                                        letterCasing={component.textcase}
                                                        isSelected={component.id === selectedComponent}
                                                        onSelect={handleComponentClick}
                                                        onSizeChange={handleComponentSizeChange}
                                                        onPositionChange={handleComponentPositionChange}
                                                        onContentChange={handleComponentContentChange}
                                                        onAlignmentChange={handleTextAlignmentChange}
                                                        onTextFontWeightChange={handleTextFontWeightChange}
                                                        onRotationChange={handleTextRotationChange}
                                                        onColorChange={handleTextColorChange}
                                                        onDelete={onDelete}
                                                        badgeSize={dbadgeSize}
                                                        showGrid={showGrid}
                                                        zoom={zoom}
                                                    />
                                                ))}
                                        </div>
                                    )}

                                    {/* Back Side */}
                                    {badgeType === 'Double' && activeSide === 'back' && (
                                        <div
                                            className={`badge-back ${showGrid ? 'grid-active' : ''} editable`}
                                            style={{
                                                flex: 1
                                            }}
                                        >
                                            <h5 className="type-title">Back Side (Editable)</h5>
                                            {components
                                                .filter((component) => component.side === 'back')
                                                .map((component) => (
                                                    <BadgeElement
                                                        key={component.id}
                                                        {...component}
                                                        font={component.font}
                                                        onTextFontChange={handleTextFontChange}
                                                        alignment={component.alignment}
                                                        fontWeight={component.fontWeight}
                                                        letterCasing={component.textcase}
                                                        isSelected={component.id === selectedComponent}
                                                        onSelect={handleComponentClick}
                                                        onSizeChange={handleComponentSizeChange}
                                                        onPositionChange={handleComponentPositionChange}
                                                        onContentChange={handleComponentContentChange}
                                                        onAlignmentChange={handleTextAlignmentChange}
                                                        onTextFontWeightChange={handleTextFontWeightChange}
                                                        onRotationChange={handleTextRotationChange}
                                                        onColorChange={handleTextColorChange}
                                                        onDelete={onDelete}
                                                        badgeSize={dbadgeSize}
                                                        showGrid={showGrid}
                                                        zoom={zoom}
                                                    />
                                                ))}
                                        </div>
                                    )}

                                    {/* Double Badge - Front Side */}
                                    {/* {badgeType === 'Double' && (
                                    <div
                                        className={`badge-front ${showGrid ? 'grid-active' : ''} ${!rotateBadge ? 'editable' : ''}`}
                                        style={frontStyle}
                                    >
                                        <h5 className='type-title'>{!rotateBadge ? 'Front Side (Editable)' : 'Front Side'}</h5>
                                        {components
                                            .filter(component => component.side === 'front')
                                            .map(component => (
                                                <BadgeElement
                                                    key={component.id}
                                                    {...component}
                                                    font={component.font} // Pass the font to BadgeElement
                                                    onTextFontChange={handleTextFontChange} // Make sure the handler is passed
                                                    alignment={component.alignment}  // Pass alignment prop
                                                    fontWeight={component.fontWeight}  // Pass font weight prop
                                                    isSelected={component.id === selectedComponent}
                                                    onSelect={handleComponentClick}
                                                    onSizeChange={handleComponentSizeChange}
                                                    onPositionChange={handleComponentPositionChange}
                                                    onContentChange={handleComponentContentChange}
                                                    onAlignmentChange={handleTextAlignmentChange}
                                                    onTextFontWeightChange={handleTextFontWeightChange}
                                                    onRotationChange={handleTextRotationChange}
                                                    onColorChange={handleTextColorChange}
                                                    onDelete={onDelete}
                                                    badgeSize={badgeSize}
                                                    showGrid={showGrid}
                                                />
                                            ))}
                                    </div>
                                )} */}

                                    <div className="divider-line"></div>

                                    {/* Double Badge - Back Side */}
                                    {/* {badgeType === 'Double' && (
                                    <div
                                        className={`badge-back ${showGrid ? 'grid-active' : ''} ${rotateBadge ? 'editable' : ''}`}
                                        style={backStyle}
                                    >
                                        <h5 className='type-title'>{rotateBadge ? 'Back Side (Editable)' : 'Back Side'}</h5>
                                        {components
                                            .filter(component => component.side === 'back')
                                            .map(component => (
                                                <BadgeElement
                                                    key={component.id}
                                                    {...component}
                                                    rotateBadge={rotateBadge}  // Pass rotateBadge state
                                                    side={component.side}  // Pass the side (either 'front' or 'back')
                                                    font={component.font} // Pass the font to BadgeElement
                                                    onTextFontChange={handleTextFontChange} // Make sure the handler is passed
                                                    alignment={component.alignment}  // Pass alignment prop
                                                    fontWeight={component.fontWeight}  // Pass font weight prop
                                                    isSelected={component.id === selectedComponent}
                                                    onSelect={handleComponentClick}
                                                    onSizeChange={handleComponentSizeChange}
                                                    onPositionChange={handleComponentPositionChange}
                                                    onContentChange={handleComponentContentChange}
                                                    onAlignmentChange={handleTextAlignmentChange}
                                                    onTextFontWeightChange={handleTextFontWeightChange}
                                                    onRotationChange={handleTextRotationChange}
                                                    onColorChange={handleTextColorChange}
                                                    onDelete={onDelete}
                                                    badgeSize={badgeSize}
                                                    showGrid={showGrid}
                                                />
                                            ))}
                                    </div>
                                )} */}

                                    {/* Mirror Badge */}
                                    {badgeType === 'Mirror' && (
                                        <div className="badge-content-mirror">
                                            <div className="badge-front editable" style={frontStyle}>
                                                <h5 className='type-title'>Front Side (Editable)</h5>
                                                {components
                                                    .filter(component => component.side === 'front') // Only front components
                                                    .map(component => (
                                                        <BadgeElement
                                                            key={component.id}
                                                            {...component}
                                                            font={component.font} // Pass the font to BadgeElement
                                                            onTextFontChange={handleTextFontChange} // Make sure the handler is passed
                                                            alignment={component.alignment}  // Pass alignment prop
                                                            fontWeight={component.fontWeight}  // Pass font weight prop
                                                            letterCasing={component.textcase}
                                                            isSelected={component.id === selectedComponent}
                                                            onSelect={handleComponentClick}
                                                            onSizeChange={handleComponentSizeChange}
                                                            onPositionChange={handleComponentPositionChange}
                                                            onContentChange={handleComponentContentChange}
                                                            onAlignmentChange={handleTextAlignmentChange}
                                                            onTextFontWeightChange={handleTextFontWeightChange}
                                                            onRotationChange={handleTextRotationChange}
                                                            onColorChange={handleTextColorChange}
                                                            onDelete={onDelete}
                                                            badgeSize={dbadgeSize}
                                                            showGrid={showGrid}
                                                            zoom={zoom}
                                                        />
                                                    ))}
                                            </div>

                                            <div className="divider-line"></div>

                                            <div className="badge-back mirrored" style={{ ...backStyle, transform: 'rotate(180deg)', opacity: 0.5 }}>
                                                <h5 className='type-title'>Back Side (Mirrored)</h5>
                                                {components
                                                    .filter(component => component.side === 'front') // Mirror front components
                                                    .map(component => (
                                                        <BadgeElement
                                                            key={component.id}
                                                            {...component}
                                                            isSelected={false} // Back side is not selectable
                                                            font={component.font}
                                                            alignment={component.alignment}  // Pass alignment prop
                                                            fontWeight={component.fontWeight}  // Pass font weight prop
                                                            letterCasing={component.textcase}
                                                            badgeSize={dbadgeSize}
                                                            showGrid={showGrid}
                                                            zoom={zoom}
                                                            style={{ ...component.style, transform: 'rotate(180deg)' }} // Mirror element rotation
                                                        />
                                                    ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </Col>

                            <Modal isOpen={modalOpen} toggle={toggleModal}>
                                <ModalHeader toggle={toggleModal}>Edit Badge Information</ModalHeader>
                                <ModalBody>
                                    <FormGroup>
                                        <Label for="editBadgeName"><strong>Badge Name</strong></Label>
                                        <Input
                                            type="text"
                                            id="editBadgeName"
                                            value={badgeNam}
                                            onChange={(e) => setBadgeName(e.target.value)}
                                        />
                                    </FormGroup>
                                    {/* <FormGroup>
                                    <Label for="editCategoryName">Category Name</Label>
                                    <Input
                                        type="text"
                                        id="editCategoryName"
                                        value={storedData.categoryName}
                                        onChange={(e) => setCategoryName(e.target.value)}
                                    />
                                </FormGroup> */}
                                    <FormGroup>
                                        <Label for="categorySelect"><strong>Select Badge Category</strong></Label>
                                        <Select
                                            id="categorySelect"
                                            value={catData.find(option => option.value === selectedCat)}
                                            onChange={handleSelectChange}
                                            options={catData
                                                .filter(option => option.id !== parseInt(badge.category_id)) // Convert to a number if necessary
                                                .map(pref => ({ value: pref.id, label: pref.Cat }))}
                                            isSearchable={true}
                                            classNamePrefix="react-select"
                                        />

                                    </FormGroup>
                                </ModalBody>
                                <ModalFooter>
                                    <Button color="primary" onClick={handleSave}>Save</Button>
                                    <Button color="warning" onClick={toggleModal}>Cancel</Button>
                                </ModalFooter>
                            </Modal>

                            <Col md="1">
                                <div className="component-settings-container">
                                    <Card>
                                        <CardBody>
                                            <div className="d-flex flex-column align-items-start">
                                                {/* Grid Icon */}

                                                <div className="grid-icon">
                                                    <button
                                                        className="add-button"
                                                        id="addCustomTextTooltip"
                                                        onClick={toggleGrid}
                                                        data-tooltip-id="grid"
                                                        style={{ background: 'transparent', border: 'none', fontSize: '24px', color: 'black', padding: '2px 0px' }}
                                                    >
                                                        <MdGrid4X4 />
                                                        {/* Custom Text icon */}
                                                    </button>
                                                    <Tooltip id="grid" place="top" effect="solid">
                                                        Grid View
                                                    </Tooltip>
                                                </div>

                                                {/* Add Custom Text Button */}
                                                <div className="">
                                                    <button
                                                        className="add-button"
                                                        id="addCustomTextTooltip"
                                                        onClick={addCustomTextComponent}
                                                        data-tooltip-id="custom_field"
                                                        style={{ background: 'transparent', border: 'none', fontSize: '24px', color: 'black', padding: '2px 0px' }}
                                                    >
                                                        <CiText /> {/* Custom Text icon */}
                                                    </button>
                                                    <Tooltip id="custom_field" place="top" effect="solid">
                                                        Custom Field
                                                    </Tooltip>
                                                </div>

                                                {/* Add Full Name Button */}
                                                <div className="">
                                                    <button
                                                        className="add-button"
                                                        id="addFullNameTooltip"
                                                        onClick={addFullNameComponent}
                                                        data-tooltip-id="full_name"
                                                        style={{ background: 'transparent', border: 'none', fontSize: '21px', color: 'black', padding: '2px 0px' }}
                                                    >
                                                        FN
                                                    </button>
                                                    <Tooltip id="full_name" place="top" effect="solid">
                                                        Full Name
                                                    </Tooltip>
                                                </div>

                                                {/* Select Image Button */}
                                                {/* Select Image Button */}
                                                <div>
                                                    <label
                                                        htmlFor="image-upload"
                                                        className="add-button"
                                                        id="selectImageTooltip"
                                                        style={{
                                                            cursor: 'pointer',
                                                            fontSize: '24px',
                                                            color: 'black',
                                                            padding: '2px 0px',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                        }}
                                                        data-tooltip-id="img"
                                                    >
                                                        <RiImageAddFill style={{ fontSize: '24px', color: 'black' }} /> {/* Image add icon */}
                                                    </label>
                                                    <input
                                                        id="image-upload"
                                                        type="file"
                                                        accept="image/*"
                                                        style={{ display: 'none' }}
                                                        onChange={handleImageChange}
                                                    />
                                                    <Tooltip id="img" place="top" effect="solid">
                                                        Image
                                                    </Tooltip>
                                                </div>

                                                {/* Select Background Image Button */}
                                                <div>
                                                    <label
                                                        htmlFor="background-image-upload"
                                                        className="add-button"
                                                        id="selectBackgroundImageTooltip"
                                                        style={{
                                                            cursor: 'pointer',
                                                            fontSize: '24px',
                                                            color: 'black',
                                                            padding: '2px 0px',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                        }}
                                                        data-tooltip-id="bgimg"
                                                    >
                                                        <AiOutlineBgColors style={{ fontSize: '24px', color: 'black' }} /> {/* Background color icon */}
                                                    </label>
                                                    <input
                                                        id="background-image-upload"
                                                        type="file"
                                                        accept="image/*"
                                                        style={{ display: 'none' }}
                                                        onChange={handleBackgroundImageChange}
                                                    />
                                                    <Tooltip id="bgimg" place="top" effect="solid">
                                                        Custom Background Image
                                                    </Tooltip>
                                                </div>



                                                <div className="">
                                                    <button
                                                        className="add-button"
                                                        id="addQRCodeTooltip"
                                                        onClick={addComponentQRCode}
                                                        data-tooltip-id="qr"
                                                        style={{ background: 'transparent', border: 'none', fontSize: '24px', color: 'black', padding: '2px 0px' }}
                                                    >
                                                        <BiQrScan /> {/* QR code icon */}
                                                    </button>
                                                    <Tooltip id="qr" place="top" effect="solid">
                                                        Add QR Code
                                                    </Tooltip>
                                                </div>


                                                {/* Save Button */}
                                                {/* <button className="save-button" onClick={saveBadgeDesign}>Save</button> */}
                                                {/* Save Button using Reactstrap */}
                                                <div className="mt-3 me-3">
                                                    <Button
                                                        color="success" // Reactstrap predefined color
                                                        onClick={saveBadgeDesign}
                                                        style={{
                                                            width: '100%', // Optional: Adjust width to match other buttons
                                                        }}
                                                    >
                                                        Save
                                                    </Button>
                                                </div>
                                            </div>
                                        </CardBody>
                                    </Card>

                                </div>
                            </Col>


                        </div>
                        {/* {isBadgeDesignSaved && <BadgePDFDownloadButton badgeSize={badgeSize} components={components} />} */}


                    </div>
                </Card>

                {/* Modal */}
                <Modal isOpen={modal} toggle={() => setModal(!modal)} centered>
                    <ModalHeader toggle={() => setModal(!modal)}>Confirmation</ModalHeader>
                    <ModalBody>
                        <div>
                            <p>
                                Your changes will be discarded. Are you sure you want to cancel? Please remember save your changes to avoid losing any work.
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
            </Container>
        </Fragment>
    );
};


export default BadgeDesigner;