import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { CardBody, Row, Col, Dropdown, DropdownToggle, DropdownMenu, DropdownItem, Card, Label } from 'reactstrap';
import { BackendAPI } from '../../../api';
import { getToken } from '../../../Auth/Auth';

const AddFieldForm = ({ addFieldAsComponent, badgeType, activeside }) => {
    const [formFields, setFormFields] = useState([]);
    const [dropdownOpen, setDropdownOpen] = useState(false);

    console.log("Active", activeside);
    // Fetch form fields when component mounts
    useEffect(() => {
        fetchFormFields();
    }, []);

    const fetchFormFields = async () => {
        try {
            const token = getToken();
            const response = await axios.get(`${BackendAPI}/badge/formfields`, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
            setFormFields(response.data.data); // Update form fields state
        } catch (error) {
            console.error('Error fetching form fields:', error);
        }
    };

    // Update field selection to add to the selected side ('front' or 'back')
    const handleAddFieldClick = (field, side) => {
        console.log("Adding field to side:", side);
        addFieldAsComponent({ ...field, side }); // Pass side to the addFieldAsComponent
    };

    const toggleDropdown = () => {
        setDropdownOpen(!dropdownOpen);
    };

    return (
        <Card className="mb-0 text-center shadow-sm">
            {/* <Label className="mb-0 ms-5"><strong>User Fields</strong></Label> */}
            <CardBody>
                <Row className="align-items-center justify-content-center">
                    <Col md="auto">
                        <Dropdown isOpen={dropdownOpen} toggle={toggleDropdown}>
                            <DropdownToggle
                                caret
                                style={{ color: 'black', borderColor: 'black', width: '300px', height: '40px' }}
                            >
                                Select User Field
                            </DropdownToggle>
                            <DropdownMenu
                                style={{
                                    width: '300px',
                                    maxHeight: '200px',
                                    overflowY: 'auto'
                                }}
                            >
                                {/* Front side option for all badge types */}
                                {activeside === 'front' && formFields.map((field) => (
                                    <DropdownItem
                                        key={field.cs_field_id}
                                        onClick={() => handleAddFieldClick(field, 'front')} // Default to 'front'
                                    >
                                        {field.cs_field_label}
                                    </DropdownItem>
                                ))}

                                {/* Divider for Double Badge */}
                                {badgeType === 'Double' && activeside !== 'front' && (
                                    <>
                                        <DropdownItem divider />
                                        {/* Back side option for Double Badge */}
                                        {formFields.map((field) => (
                                            <DropdownItem
                                                key={`${field.cs_field_id}_back`}
                                                onClick={() => handleAddFieldClick(field, 'back')} // Add to 'back' side
                                            >
                                                {field.cs_field_label}
                                            </DropdownItem>
                                        ))}
                                    </>
                                )}
                            </DropdownMenu>
                        </Dropdown>

                    </Col>
                </Row>
            </CardBody>
        </Card>
    );
};

export default AddFieldForm;

// import React, { useState, useEffect } from 'react';
// import axios from 'axios';
// import { CardBody, Row, Col, Card } from 'reactstrap';
// import Select from 'react-select';
// import { BackendAPI } from '../../../api';
// import { getToken } from '../../../Auth/Auth';

// const AddFieldForm = ({ addFieldAsComponent, badgeType, activeside }) => {
//     const [formFields, setFormFields] = useState([]);
//     const [selectedOption, setSelectedOption] = useState(null);

//     console.log("Active", activeside);

//     // Fetch form fields when component mounts
//     useEffect(() => {
//         fetchFormFields();
//     }, []);

//     const fetchFormFields = async () => {
//         try {
//             const token = getToken();
//             const response = await axios.get(`${BackendAPI}/badge/formfields`, {
//                 headers: {
//                     Authorization: `Bearer ${token}`
//                 }
//             });
//             setFormFields(response.data.data); // Update form fields state
//         } catch (error) {
//             console.error('Error fetching form fields:', error);
//         }
//     };

//     // Update field selection to add to the selected side ('front' or 'back')
//     const handleSelectChange = (selectedField) => {
//         if (selectedField) {
//             const { field, side } = selectedField;
//             console.log("Adding field to side:", side);
//             addFieldAsComponent({ ...field, side }); // Pass side to the addFieldAsComponent
//         }
//     };

//     // Generate options for react-select
//     const generateOptions = (side) => {
//         return formFields.map((field) => ({
//             label: field.cs_field_label,
//             value: field.cs_field_id,
//             field: field,
//             side: side
//         }));
//     };

//     return (
//         <Card className="mb-0 text-center shadow-sm">
//             <h6 className="mb-0 ms-5"><strong>User Fields</strong></h6>
//             <CardBody>
//                 <Row className="align-items-center justify-content-center">
//                     <Col xs="auto">
//                         {/* Front side options */}
//                         {activeside === 'front' && (
//                             <Select
//                                 options={generateOptions('front')}
//                                 onChange={handleSelectChange}
//                                 placeholder="Select Field"
//                                 value={selectedOption}
//                                 getOptionLabel={(e) => e.label}
//                                 getOptionValue={(e) => e.value}
//                             />
//                         )}

//                         {/* Divider and Back side options for Double Badge */}
//                         {badgeType === 'Double' && activeside !== 'front' && (
//                             <>
//                                 <div className="dropdown-divider" />
//                                 <Select
//                                     options={generateOptions('back')}
//                                     onChange={handleSelectChange}
//                                     placeholder="Select Field"
//                                     value={selectedOption}
//                                     getOptionLabel={(e) => e.label}
//                                     getOptionValue={(e) => e.value}
//                                 />
//                             </>
//                         )}
//                     </Col>
//                 </Row>
//             </CardBody>
//         </Card>
//     );
// };

// export default AddFieldForm;
