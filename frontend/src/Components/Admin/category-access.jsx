import React, { Fragment, useEffect, useState, useContext } from 'react';
import { useLocation } from 'react-router-dom';
import { Container, Row, Col, Card, Input, Table, CardHeader, CardBody, Button, Modal, ModalHeader, ModalFooter, ModalBody, PopoverBody, UncontrolledPopover, InputGroup, InputGroupText } from 'reactstrap'; // Import Modal component
import axios from 'axios';
import { BackendAPI } from '../../api';
import { Link, useNavigate } from 'react-router-dom'; // Import useHistory for programmatic navigation
import { FaEdit, FaSave } from "react-icons/fa";
import { MdDelete, MdInfoOutline } from "react-icons/md";
import { BsThreeDotsVertical, BsThreeDots } from "react-icons/bs";
import { BiSort, BiSortAlt2 } from "react-icons/bi";
import { Breadcrumbs } from '../../AbstractElements';
import { PermissionsContext } from '../../contexts/PermissionsContext';
import useAuth from '../../Auth/protectedAuth';
import { getToken } from '../../Auth/Auth';
import { toast } from 'react-toastify';
const CategoryAccess = () => {
    useAuth();
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editableRows, setEditableRows] = useState([]); // State to manage editable rows
    const [currentlyEditedIndex, setCurrentlyEditedIndex] = useState(null); // State to track currently edited row
    const location = useLocation();
    const navigate = useNavigate(); // Initialize useHistory
    const { catId, catName } = location.state;
    const [modal, setModal] = useState(false);
    const [selectedDays, setSelectedDays] = useState(0); // State to store selected days in modal
    const [selectedRowIndex, setSelectedRowIndex] = useState(null); // State to store the index of the row being edited
    const { permissions } = useContext(PermissionsContext);
    const [isProcessing, setIsProcessing] = useState(false);
    const [message, setMessage] = useState('');
    const [selectedFacilityName, setSelectedFacilityName] = useState(''); // State to store selected facility name in modal


    useEffect(() => {
        fetchCategory();
    }, [permissions]);

    // Extract Category Access component
    const CategoryAccesspermissions = permissions['CategoryPermissions'];

    const DismissibleNotification = ({ message, onClose }) => {
        return (
            <div style={{
                position: 'fixed',
                bottom: '20px',
                left: '20px',
                backgroundColor: '#000',
                color: '#fff',
                padding: '15px',
                borderRadius: '5px',
                boxShadow: '0px 0px 10px rgba(0, 0, 0, 0.5)',
                zIndex: '9999'
            }}>
                <span>{message}</span>
                <button onClick={onClose} style={{ marginLeft: '10px', backgroundColor: 'transparent', border: 'none', color: '#fff', cursor: 'pointer' }}>✕</button>
            </div>
        );
    };

    const fetchCategory = async () => {
        try {
            const token = getToken();
            const response = await axios.post(`${BackendAPI}/category/getCategoryAccess`, { catId }, {
                headers: {
                    Authorization: `Bearer ${token}` // Include the token in the Authorization header
                }
            });
            setData(response.data);
            console.log(response.data);
            setEditableRows(new Array(response.data.length).fill(false)); // Initialize editableRows array
            setLoading(false);
        } catch (error) {
            console.error('Error fetching pages:', error);
            setLoading(false);
        }
    };

    // const toggleRowEditable = (index) => {
    //     setCurrentlyEditedIndex(index); // Set the index of the row being edited
    //     setSelectedRowIndex(index); // Set the index of the row for which modal is opened
    //     setSelectedDays(data[index].cs_allow_count); // Set the initial value of selected days
    //     setModal(true);
    // };
    const toggleRowEditable = (index) => {
        setCurrentlyEditedIndex(index); // Set the index of the row being edited
        setSelectedRowIndex(index); // Set the index of the row for which modal is opened
        setSelectedDays(data[index].cs_allow_count); // Set the initial value of selected days
        setModal(true);
        setSelectedFacilityName(getFormattedFacilityName(data[index].cs_facility_name)); // Set formatted facility name for modal
    };
    

    const handleCountChange = async (event, itemId, index) => {
        const { value } = event.target;
        const newData = data.map((item, i) => {
            if (i === index) {
                return { ...item, cs_allow_count: value };
            }
            return item;
        });
        setData(newData);
    };

    // const handleModalSave = async () => {
    //     const newItem = { ...data[selectedRowIndex], cs_allow_count: selectedDays };
    //     const newData = [...data];
    //     newData[selectedRowIndex] = newItem;
    //     setData(newData);
    //     setModal(false);


    //     setIsProcessing(true);
    //     setMessage('Process started. It may take longer.');

    //     // Show toast notification for ongoing process
    //     toast.info('Processing...', { autoClose: false });

    //     const itemId = data[selectedRowIndex].cs_facility_detail_id;
    //     try {
    //         const token = getToken();
    //         await axios.put(`${BackendAPI}/category/updateCount/${itemId}`, { cs_allow_count: selectedDays, catId }, {
    //             headers: {
    //                 Authorization: `Bearer ${token}` // Include the token in the Authorization header
    //             }
    //         });
    //         console.log('Data updated successfully');

    //         setEditableRows(prevState => {
    //             const newState = [...prevState];
    //             newState[selectedRowIndex] = false; // Disable editing after saving
    //             return newState;
    //         });
    //         toast.dismiss();

    //         // Show success toast notification
    //         toast.success(response.data.message);
    //     } catch (error) {
    //         console.error('Error updating data:', error);
    //     } finally {
    //         setIsProcessing(false);
    //     }

    // };


    const handleModalSave = async () => {
        const newItem = { ...data[selectedRowIndex], cs_allow_count: selectedDays };
        const newData = [...data];
        newData[selectedRowIndex] = newItem;
        setData(newData);
        setModal(false);
      
        setIsProcessing(true);
        setMessage('The process has started and is running in the background. Once it is completed, we will notify you. In the meantime, you are free to start other processes.');
      

        // setTimeout(() => {
        //     setMessage('');
        //   }, 10000);

          
        const itemId = data[selectedRowIndex].cs_facility_detail_id;
        const toastId = toast.info('Processing...', { autoClose: false });
      
        try {
          const token = getToken();
          const response = await axios.put(`${BackendAPI}/category/updateCount/${itemId}`,
            { cs_allow_count: selectedDays, catId },
            {
              headers: {
                Authorization: `Bearer ${token}`
              }
            }
          );

          if (response.data.error =="No badge data found") {
            // Handle case where no badge data is found
            toast.dismiss(toastId);
            setIsProcessing(false);
            setMessage('');
            toast.success("Category count updated successfully");
            return;
        }

    
      
          setEditableRows(prevState => {
            const newState = [...prevState];
            newState[selectedRowIndex] = false;
            return newState;
          });
      
          // Close the specific processing toast and show a success toast
          setIsProcessing(false);
          toast.dismiss(toastId);
          setMessage('');
          toast.success(response.data.message);
          
      
        } catch (error) {
         setIsProcessing(false);
          console.error('Error updating data:', error);
          toast.dismiss(toastId);
          
          
          if (error.response && error.response.status === 503) {
            toast.error("Your request could not be processed at this moment due to ongoing processes in the queue. We will notify you once the process is completed. Please try again later.");
          }else if (error.request) {
            // Request made but no response received
            toast.error('Network error. Please try again later.');
          } else {
            // Something happened in setting up the request
            toast.error('Failed to update count. Please try again later.');
          }
        } finally {
          setIsProcessing(false);
        }
      };
      

    const getFormattedFacilityName = (name) => {
        if (name && name.startsWith && name.includes('_')) {
            const [prefix, suffix] = name.split('_');
            const formattedSuffix = suffix.charAt(0).toUpperCase() + suffix.slice(1).replace(/\d+/g, day => ` day ${day}`);
            return `${formattedSuffix}`;
        } else {
            return name || '';
        }
    };

    const handleNavigation = () => {
        navigate(`${process.env.PUBLIC_URL}/onsite/manage-category-permission/Consoft`);
    };

    return (
        <Fragment>
            <Breadcrumbs parentClickHandler={handleNavigation} mainTitle={
                <>
                    Edit Category Access
                    <MdInfoOutline
                        id="accessPopover"
                        style={{
                            cursor: 'pointer', position: 'absolute', marginLeft: '5px'
                        }}
                    />
                    <UncontrolledPopover
                        placement="bottom"
                        target="accessPopover"
                        trigger="focus"
                    >
                        <PopoverBody>
                        Below is the allowed count for <strong>{catName}</strong>. Changing this count will automatically update the facility access for users in the <strong>{catName}</strong> category.
                        </PopoverBody>
                    </UncontrolledPopover>
                </>
            } parent="Manage Category Access" title="Edit Category Acess" />
            <Container fluid={true}>
                <Row>
                    <Col sm="12">
                        <Card>
                            <CardHeader className="d-flex justify-content-between align-items-center flex-column flex-md-row">
                                <div className="mb-2 mb-md-0">
                                    <h5 className="mb-2 text-center">{catName}</h5>
                                </div>
                            </CardHeader>
                            <CardBody>
                                <div className='table-responsive'>
                                    {loading ? (
                                        <p>Loading...</p>
                                    ) : data.length === 0 ? (
                                        <p className='text-center'>No category access found</p>
                                    ) : (
                                        <Table>
                                            <thead>
                                                <tr className='border-bottom-primary'>
                                                    <th scope='col' className='text-start'>{'Sr No.'}</th>
                                                    <th scope='col' className='text-center'>{'Facility Name'}</th>
                                                    <th scope='col' className='text-center'>{'Allow Count'}</th>
                                                    {CategoryAccesspermissions?.edit === 1 && (
                                                        <th scope='col' className='text-center'>{'Action'}</th>
                                                    )}
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {data.map((page, index) => (
                                                    <tr key={index} className="border-bottom-primary">
                                                        <td className='text-start'>{index + 1}</td> {/* Incremental serial number */}
                                                        <td className='text-center'>{getFormattedFacilityName(page.cs_facility_name)}</td>
                                                        <td className='text-center'>
                                                            <Input
                                                                type="text"
                                                                value={page.cs_allow_count}
                                                                className="border-0 text-center"
                                                                min={0}
                                                            />


                                                        </td>
                                                        {CategoryAccesspermissions?.edit === 1 && (
                                                            <td className='text-center'>
                                                                <Button color="warning" size="sm" onClick={() => toggleRowEditable(index)} disabled={editableRows[index]}>
                                                                    <FaEdit />
                                                                </Button>
                                                            </td>
                                                        )}
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </Table>
                                    )}
                                </div>
                            </CardBody>
                        </Card>
                    </Col>
                </Row>
                <div>
                    {message && <DismissibleNotification message={message} onClose={() => setMessage('')} />}
                    {/* Your form and other components */}
                </div>
            </Container>

            {/* Modal */}
            <Modal isOpen={modal} toggle={() => setModal(!modal)} centered size="sm">
    <ModalHeader toggle={() => setModal(!modal)}>Enter Allowed Count for {selectedFacilityName}</ModalHeader>
    <ModalBody>
        <div>
            <p>
                Set allow counts reflecting on user badge data so make sure counts are correct
            </p>
        </div>

        <Input
            type="number"
            value={selectedDays}
            className='text-center'
            onChange={(e) => setSelectedDays(Math.max(0, parseInt(e.target.value, 10)))}
            inputMode="numeric"
            min={0}
        />
    </ModalBody>
    <ModalFooter>
        <Button color="primary" onClick={handleModalSave}>Save</Button>
        <Button color="warning" onClick={() => setModal(!modal)}>Cancel</Button>
    </ModalFooter>
</Modal>

        </Fragment>
    );
};

export default CategoryAccess;
