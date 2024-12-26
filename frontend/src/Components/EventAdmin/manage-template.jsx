import React, { Fragment, useEffect, useState } from 'react';
import { Container, Row, Col, Card, CardHeader, CardBody, Button, Modal, ModalHeader, ModalBody, ModalFooter, Nav, NavItem, NavLink, TabContent, TabPane, Media, Label, Input, Ribb } from 'reactstrap';
import classnames from 'classnames';
import { Breadcrumbs } from '../../AbstractElements';
import axios from 'axios';
import { BackendAPI } from '../../api';
import { useNavigate } from 'react-router-dom';
import { FaEdit, FaTrashAlt, FaEye, FaClone } from 'react-icons/fa';
import { FaPlus, FaFile } from "react-icons/fa6";
import { Pagination } from 'antd';
import { ToastContainer, toast } from "react-toastify";
import { getToken } from '../../Auth/Auth';
import SweetAlert from 'sweetalert2';
import { Tooltip } from 'react-tooltip';
import parse from 'html-react-parser';
import useAuth from '../../Auth/protectedAuth';

const Templates = () => {
    useAuth();
    const [data, setData] = useState([]);
    const [activedata, setActiveData] = useState([]);
    const [inactivedata, setInactiveData] = useState([]);
    const [draftdata, setDraftData] = useState([]);
    const [clonedata, setCloneData] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalItems, setTotalItems] = useState(0);
    const [pageSize, setPageSize] = useState(10);
    const [modalOpen, setModalOpen] = useState(false);
    const [selectedTemplateContent, setSelectedTemplateContent] = useState('');
    const [activeTab, setActiveTab] = useState('all'); // Default tab is "all"
    const [templates, setTemplates] = useState([]); // Assume this state holds your templates
    const [deletemodal, setDeleteModal] = useState(false);
    const [tempName, setTempName] = useState(null);
    const [tempId, setTempId] = useState(null);
    const navigate = useNavigate();

    console.log("Data", data);
    console.log("Active", activedata);
    console.log("Inactive", inactivedata);


    useEffect(() => {
        fetchTemplates(activeTab);
    }, [currentPage, pageSize, activeTab]);

    const fetchTemplates = async (status) => {
        try {
            const token = getToken();
            const response = await axios.get(`${BackendAPI}/editor/getTemplates?page=${currentPage}&pageSize=${pageSize}&status=${status}`, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            // Assuming you want to filter the data where cs_status is 1
            setData(response.data.pages);
            // setData(response.data.pages.filter(template => template.cs_isclone === 0));
            setActiveData(response.data.pages.filter(template => template.cs_status === 1));
            setInactiveData(response.data.pages.filter(template => template.cs_status === 0));
            setDraftData(response.data.pages.filter(template => template.cs_status === 2));
            setCloneData(response.data.pages.filter(template => template.cs_isclone === 1));
            setTotalItems(response.data.totalItems);
        } catch (error) {
            console.error('Error fetching templates:', error);
        }
    };


    const handlePageChange = (page, size) => {
        setCurrentPage(page);
        setPageSize(size);
    };

    const handleEdit = (template) => {
        navigate(`${process.env.PUBLIC_URL}/event/email-template/Consoft`, { state: { template } });
    };


    const handleClone = async (templateId) => {
        console.log("TempID", templateId);

        try {
            const template_id = templateId;
            const token = getToken();

            const response = await axios.post(`${BackendAPI}/editor/clonetemplate`, { template_id }, {
                headers: {
                    Authorization: `Bearer ${token}`, // Include the token in the Authorization header
                },
            });

            // Show success alert
            await SweetAlert.fire({
                title: 'Success!',
                text: 'Template cloned successfully!',
                icon: 'success',
                timer: 3000,
                showConfirmButton: false,
                allowOutsideClick: false,
                allowEscapeKey: false,
            });

            fetchTemplates();

            console.log('Save response', response.data);
        } catch (error) {
            console.error('Error sending mail:', error);

            // Display the error message from the response or a default message
            const errorMessage = error.response?.data?.error || 'There was an error cloning the template. Please try again later.';

            // Optionally show a toast notification for errors
            toast.error(errorMessage);
        }
    };

    const openDeleteModal = (tempId, tempName) => {
        setTempName(tempName);
        setTempId(tempId);
        setDeleteModal(true);
    };

    const closeDeleteModal = () => {
        setDeleteModal(false);
    };



    const handleDelete = async () => {
        try {
            const token = getToken();

            const response = await axios.post(`${BackendAPI}/editor/deletetemplate`,
                { template_id: tempId }, // Ensure template_id is correctly named
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });

            await SweetAlert.fire({
                title: 'Success!',
                text: 'Template deleted successfully!',
                icon: 'success',
                timer: 3000,
                showConfirmButton: false,
                allowOutsideClick: false,
                allowEscapeKey: false,
            });

            fetchTemplates();

            console.log('Delete response', response.data);
        } catch (error) {
            console.error('Error deleting template:', error);

            const errorMessage = error.response?.data?.error || 'There was an error deleting the template. Please try again later.';

            toast.error(errorMessage);
        }
        setDeleteModal(false);

    };


    const toggleModal = (templateId) => {
        const selectedTemplate = data.find(template => template.template_id === templateId);
        if (selectedTemplate) {
            setSelectedTemplateContent(selectedTemplate.template_content);
        }
        setModalOpen(!modalOpen);
    };

    const handleNavigation = () => {
        navigate(`${process.env.PUBLIC_URL}/event/email-template/Consoft`);
    };

    const toggleTab = (tab) => {
        if (activeTab !== tab) {
            setActiveTab(tab);
            setCurrentPage(1); // Reset to first page on tab change
        }
    };

    const updateTemplateStatus = async (templateId, status) => {
        console.log("Updating status to:", status); // Debugging log
        try {
            const token = getToken();
            // Send the update request with templateId and status directly
            await axios.put(`${BackendAPI}/editor/UpdateStatus`, { templateId, status }, {
                headers: {
                    Authorization: `Bearer ${token}` // Include the token in the Authorization header
                }
            });

            // Update the state with the new status
            const updatedTemplates = data.map((template) =>
                template.template_id === templateId ? { ...template, cs_status: status } : template // Correct the variable here
            );

            setData(updatedTemplates); // Set the updated state

        } catch (error) {
            console.error('Error updating status:', error);
        }
    };




    return (
        <Fragment>
            <Breadcrumbs mainTitle="Manage Templates" parent="Email" title="Templates" />
            <Container fluid={true}>
                <Row>
                    <Col sm="12">
                        <Card>
                            <CardHeader className="d-flex justify-content-between align-items-center">
                                <h5 className="mb-0">Templates</h5>
                                {/* <Button color='warning' onClick={handleNavigation}>
                                    Create Template
                                </Button> */}
                                <>
                                    <Button
                                        color=""
                                        className='circular'
                                        onClick={handleNavigation} data-tooltip-id="create"
                                    >
                                        <FaPlus
                                            className='buttonStyle'
                                        />

                                    </Button>
                                    <Tooltip id="create" place="top" effect="solid">
                                        Create Template
                                    </Tooltip>
                                </>
                            </CardHeader>
                            <CardBody className='pt-2'>
                                {/* Tabs for filtering */}
                                <Nav className='mb-3' tabs>
                                    <NavItem>
                                        <NavLink
                                            className={classnames({ active: activeTab === 'all' })}
                                            onClick={() => toggleTab('all')}
                                        >
                                            All Templates
                                        </NavLink>
                                    </NavItem>
                                    <NavItem>
                                        <NavLink
                                            className={classnames({ active: activeTab === 'active' })}
                                            onClick={() => toggleTab('active')}
                                        >
                                            Active
                                        </NavLink>
                                    </NavItem>
                                    <NavItem>
                                        <NavLink
                                            className={classnames({ active: activeTab === 'inactive' })}
                                            onClick={() => toggleTab('inactive')}
                                        >
                                            Inactive
                                        </NavLink>
                                    </NavItem>
                                    <NavItem>
                                        <NavLink
                                            className={classnames({ active: activeTab === 'draft' })}
                                            onClick={() => toggleTab('draft')}
                                        >
                                            Draft
                                        </NavLink>
                                    </NavItem>
                                    <NavItem>
                                        <NavLink
                                            className={classnames({ active: activeTab === 'clone' })}
                                            onClick={() => toggleTab('clone')}
                                        >
                                            Clone
                                        </NavLink>
                                    </NavItem>
                                    {/* <NavItem>
                                        <NavLink
                                            className={classnames({ active: activeTab === 'discarded' })}
                                            onClick={() => toggleTab('discarded')}
                                        >
                                            Discarded
                                        </NavLink>
                                    </NavItem> */}
                                </Nav>

                                {/* Template List */}
                                <TabContent activeTab={activeTab}>
                                    <TabPane tabId={activeTab}>
                                        <Row>
                                            {activeTab === 'all' && (
                                                data.length > 0 ? (
                                                    data.map((template) => (
                                                        <Col md="12" sm="6" xs="12" key={template.template_id} className="mb-2">
                                                            <Card className="template-card">
                                                                <div className={`ribbon ribbon-clip-bottom-right ${template.cs_status === 1 ? 'ribbon-success' : 'ribbon-warning'}`}>
                                                                    {template.cs_status === 1 ? (
                                                                        <span className="">Active</span>
                                                                    ) : (
                                                                        <span className="">Inactive</span>
                                                                    )}
                                                                </div>


                                                                <div className="template-card-body p-3 d-flex justify-content-between align-items-start">
                                                                    <div>
                                                                        <h5 className="template-name mb-2">{template.template_name}</h5>
                                                                        <p className="template-subject text-muted">{template.template_subject}</p>
                                                                    </div>
                                                                    {/* Checkbox switch for icon state */}
                                                                    <Media body className="icon-state switch-sm align-self-start">
                                                                        <Label className="switch">
                                                                            <Input
                                                                                type="checkbox"
                                                                                checked={template.cs_status === 1} // Check if cs_status is 1 for checked state
                                                                                onChange={(e) => {
                                                                                    const newStatus = e.target.checked ? 1 : 0; // Set newStatus to 1 or 0 based on checkbox state
                                                                                    updateTemplateStatus(template.template_id, newStatus); // Call the update function with the template ID and new status
                                                                                }}
                                                                            />
                                                                            <span className={"switch-state " + (template.cs_status === 1 ? "bg-success" : "bg-danger")}></span>
                                                                        </Label>
                                                                    </Media>
                                                                </div>
                                                                <div className="template-card-footer d-flex justify-content-between p-2">
                                                                    <div className="button-group d-flex">
                                                                        <Button color="" className='circular' size="md" onClick={() => handleEdit(template)}>
                                                                            <FaEdit />
                                                                        </Button>
                                                                        <Button color="" className='circular' size="md" onClick={() => toggleModal(template.template_id)}>
                                                                            <FaEye />
                                                                        </Button>
                                                                        {template.cs_isclone === 0 && (
                                                                            <Button color="" className='circular' size="md" onClick={() => handleClone(template.template_id)}>
                                                                                <FaClone />
                                                                            </Button>
                                                                        )}
                                                                        {![1, 2, 3, 4, 5].includes(template.template_id) && (
                                                                            <Button color="" className="circular" size="md" onClick={() => openDeleteModal(template.template_id, template.template_name)}>
                                                                                <FaTrashAlt />
                                                                            </Button>
                                                                        )}
                                                                    </div>
                                                                    {/* Status Text */}
                                                                    {/* <div className="status-text me-2">
                                                                        {template.cs_status === 1 ? (
                                                                            <span className="text-success">Active</span>
                                                                        ) : (
                                                                            <span className="text-danger">Inactive</span>
                                                                        )}
                                                                    </div> */}
                                                                </div>
                                                            </Card>
                                                        </Col>
                                                    ))
                                                ) : (
                                                    <div className="text-center mt-3">
                                                        <h6>No templates found</h6>
                                                    </div>

                                                )
                                            )}


                                            {activeTab === 'active' && (
                                                activedata.length > 0 ? ( // Check if activedata has any entries
                                                    activedata.map((template) => (
                                                        <Col md="12" sm="6" xs="12" key={template.template_id} className="mb-2">
                                                            <Card className="template-card">
                                                                <div className={`ribbon ribbon-clip-bottom-right ${template.cs_status === 1 ? 'ribbon-success' : 'ribbon-warning'}`}>
                                                                    {template.cs_status === 1 ? (
                                                                        <span className="">Active</span>
                                                                    ) : (
                                                                        <span className="">Inactive</span>
                                                                    )}
                                                                </div>
                                                                <div className="template-card-body p-3 d-flex justify-content-between align-items-start">
                                                                    <div>
                                                                        <h5 className="template-name mb-2">{template.template_name}</h5>
                                                                        <p className="template-subject text-muted">{template.template_subject}</p>
                                                                    </div>
                                                                    {/* Checkbox switch for icon state */}
                                                                    <Media body className="icon-state switch-sm align-self-start">
                                                                        <Label className="switch">
                                                                            <Input
                                                                                type="checkbox"
                                                                                checked={template.cs_status === 1} // Check if cs_status is 1 for checked state
                                                                                onChange={(e) => {
                                                                                    const newStatus = e.target.checked ? 1 : 0; // Set newStatus to 1 or 0 based on checkbox state
                                                                                    updateTemplateStatus(template.template_id, newStatus); // Call the update function with the template ID and new status
                                                                                }}
                                                                            />
                                                                            <span className={"switch-state " + (template.cs_status === 1 ? "bg-success" : "bg-danger")}></span>
                                                                        </Label>
                                                                    </Media>
                                                                </div>
                                                                <div className="template-card-footer d-flex justify-content-between p-2">
                                                                    <div className="button-group d-flex">
                                                                        <Button color="" className='circular' size="md" onClick={() => handleEdit(template)}>
                                                                            <FaEdit />
                                                                        </Button>
                                                                        <Button color="" className='circular' size="md" onClick={() => toggleModal(template.template_id)}>
                                                                            <FaEye />
                                                                        </Button>
                                                                        <Button color="" className='circular' size="md" onClick={() => handleClone(template.template_id)}>
                                                                            <FaClone />
                                                                        </Button>
                                                                        {![1, 2, 3, 4, 5].includes(template.template_id) && (
                                                                            <Button color="" className="circular" size="md" onClick={() => openDeleteModal(template.template_id, template.template_name)}>
                                                                                <FaTrashAlt />
                                                                            </Button>
                                                                        )}
                                                                    </div>
                                                                    {/* Status Text */}
                                                                    {/* <div className="status-text me-2">
                                                                        {template.cs_status === 1 ? (
                                                                            <span className="text-success">Active</span>
                                                                        ) : (
                                                                            <span className="text-danger">Inactive</span>
                                                                        )}
                                                                    </div> */}
                                                                </div>
                                                            </Card>
                                                        </Col>
                                                    ))
                                                ) : (
                                                    <div className="text-center mt-3">
                                                        <h6>No active templates found</h6>
                                                    </div>
                                                )
                                            )}


                                            {activeTab === 'inactive' && (
                                                inactivedata.length > 0 ? ( // Change 1: Check if inactivedata has any entries
                                                    inactivedata.map((template) => (
                                                        <Col md="12" sm="6" xs="12" key={template.template_id} className="mb-2">
                                                            <Card className="template-card">
                                                                <div className={`ribbon ribbon-clip-bottom-right ${template.cs_status === 1 ? 'ribbon-success' : 'ribbon-warning'}`}>
                                                                    {template.cs_status === 1 ? (
                                                                        <span className="">Active</span>
                                                                    ) : (
                                                                        <span className="">Inactive</span>
                                                                    )}
                                                                </div>

                                                                <div className="template-card-body p-3 d-flex justify-content-between align-items-start">
                                                                    <div>
                                                                        <h5 className="template-name mb-2">{template.template_name}</h5>
                                                                        <p className="template-subject text-muted">{template.template_subject}</p>
                                                                    </div>
                                                                    {/* Checkbox switch for icon state */}
                                                                    <Media body className="icon-state switch-sm align-self-start">
                                                                        <Label className="switch">
                                                                            <Input
                                                                                type="checkbox"
                                                                                checked={template.cs_status === 1} // Check if cs_status is 1 for checked state
                                                                                onChange={(e) => {
                                                                                    const newStatus = e.target.checked ? 1 : 0; // Set newStatus to 1 or 0 based on checkbox state
                                                                                    updateTemplateStatus(template.template_id, newStatus); // Call the update function with the template ID and new status
                                                                                }}
                                                                            />
                                                                            <span className={"switch-state " + (template.cs_status === 1 ? "bg-success" : "bg-danger")}></span>
                                                                        </Label>
                                                                    </Media>
                                                                </div>
                                                                <div className="template-card-footer d-flex justify-content-between p-2">
                                                                    <div className="button-group d-flex">
                                                                        <Button color="" className='circular' size="md" onClick={() => handleEdit(template)}>
                                                                            <FaEdit />
                                                                        </Button>
                                                                        <Button color="" className='circular' size="md" onClick={() => toggleModal(template.template_id)}>
                                                                            <FaEye />
                                                                        </Button>
                                                                        <Button color="" className='circular' size="md" onClick={() => handleClone(template.template_id)}>
                                                                            <FaClone />
                                                                        </Button>
                                                                        {![1, 2, 3, 4, 5].includes(template.template_id) && (
                                                                            <Button color="" className="circular" size="md" onClick={() => openDeleteModal(template.template_id, template.template_name)}>
                                                                                <FaTrashAlt />
                                                                            </Button>
                                                                        )}
                                                                    </div>
                                                                    {/* Status Text */}
                                                                    {/* <div className="status-text me-2">
                                                                        {template.cs_status === 1 ? (
                                                                            <span className="text-success">Active</span>
                                                                        ) : (
                                                                            <span className="text-danger">Inactive</span>
                                                                        )}
                                                                    </div> */}
                                                                </div>
                                                            </Card>
                                                        </Col>
                                                    ))
                                                ) : ( // Change 2: Render this when inactivedata is empty
                                                    <div className="text-center mt-3">
                                                        <h6>No inactive templates found</h6> {/* Change 3: Message when no inactive templates are found */}
                                                    </div>
                                                )
                                            )}


                                            {activeTab === 'draft' && (
                                                draftdata.length > 0 ? (
                                                    draftdata.map((template) => (
                                                        <Col md="12" sm="6" xs="12" key={template.template_id} className="mb-2">
                                                            <div className="ribbon-wrapper"> {/* Add ribbon wrapper here */}
                                                                <Card className="template-card">

                                                                    <div className="ribbon ribbon-clip-bottom-right ribbon-warning">Draft</div> {/* Add the ribbon */}
                                                                    <div className="template-card-body p-3 d-flex justify-content-between align-items-start">
                                                                        <div>
                                                                            <h5 className="template-name mb-2">{template.template_name}</h5>
                                                                            <p className="template-subject text-muted">{template.template_subject}</p>
                                                                        </div>
                                                                        <FaFile style={{ color: 'orange', fontSize: '40px' }} /> {/* Use inline styles here */}
                                                                    </div>
                                                                    <div className="template-card-footer d-flex justify-content-between p-2">
                                                                        <div className="button-group d-flex">
                                                                            <Button color="" className='circular' size="md" onClick={() => handleEdit(template)}>
                                                                                <FaEdit />
                                                                            </Button>
                                                                            <Button color="" className='circular' size="md" onClick={() => toggleModal(template.template_id)}>
                                                                                <FaEye />
                                                                            </Button>
                                                                            <Button color="" className='circular' size="md" onClick={() => handleClone(template.template_id)}>
                                                                                <FaClone />
                                                                            </Button>
                                                                            {![1, 2, 3, 4, 5].includes(template.template_id) && (
                                                                                <Button color="" className="circular" size="md" onClick={() => openDeleteModal(template.template_id, template.template_name)}>
                                                                                    <FaTrashAlt />
                                                                                </Button>
                                                                            )}
                                                                        </div>
                                                                        {/* Status Text */}
                                                                        <div className="status-text me-2">
                                                                            {template.cs_status === 2 && <span className="text-warning">Draft</span>}
                                                                        </div>
                                                                    </div>
                                                                </Card>
                                                            </div>
                                                        </Col>
                                                    ))
                                                ) : (
                                                    <div className="text-center mt-3">
                                                        <h6>No draft templates found</h6>
                                                    </div>
                                                )
                                            )}




                                            {activeTab === 'clone' && (
                                                clonedata.length > 0 ? ( // Change 1: Check if clonedata has any entries
                                                    clonedata.map((template) => (
                                                        <Col md="12" sm="6" xs="12" key={template.template_id} className="mb-2">
                                                            <Card className="template-card">
                                                                <div className="ribbon ribbon-clip-bottom-right ribbon-warning">Clone</div> {/* Add the ribbon */}

                                                                <div className="template-card-body p-3">
                                                                    <h5 className="template-name mb-2">{template.template_name}</h5>
                                                                    <p className="template-subject text-muted">{template.template_subject}</p>
                                                                </div>
                                                                <div className="template-card-footer d-flex p-2">
                                                                    <Button color="" className='circular' size="md" onClick={() => handleEdit(template)}>
                                                                        <FaEdit />
                                                                    </Button>
                                                                    <Button color="" className='circular' size="md" onClick={() => toggleModal(template.template_id)}>
                                                                        <FaEye />
                                                                    </Button>
                                                                    {![1, 2, 3, 4, 5].includes(template.template_id) && (
                                                                        <Button color="" className="circular" size="md" onClick={() => openDeleteModal(template.template_id, template.template_name)}>
                                                                            <FaTrashAlt />
                                                                        </Button>
                                                                    )}
                                                                </div>
                                                            </Card>
                                                        </Col>
                                                    ))
                                                ) : ( // Change 2: Render this when clonedata is empty
                                                    <div className="text-center mt-3">
                                                        <h6>No cloned templates found</h6> {/* Change 3: Message when no cloned templates are found */}
                                                    </div>
                                                )
                                            )}

                                        </Row>
                                    </TabPane>
                                </TabContent>

                                {totalItems > 10 && (
                                    <div className="d-flex justify-content-center align-items-center mt-3">
                                        <Pagination
                                            current={currentPage}
                                            pageSize={pageSize}
                                            total={totalItems}
                                            onChange={handlePageChange}
                                            showSizeChanger
                                        />
                                    </div>
                                )}
                            </CardBody>
                        </Card>
                    </Col>
                </Row>
            </Container>

            {/* Modal for viewing template content */}
            <Modal isOpen={modalOpen} toggle={() => setModalOpen(!modalOpen)} style={{ width: '750px', maxWidth: '100%', padding: '20px' }}>
                <div>
                    {parse(selectedTemplateContent)} {/* Render HTML */}
                </div>
            </Modal>


            {/* Delete Confirmation Modal */}
            <Modal isOpen={deletemodal} toggle={closeDeleteModal} centered size="md">
                <ModalHeader toggle={closeDeleteModal}>Confirmation</ModalHeader>
                <ModalBody>
                    <div className='ms-2'>
                        <p>Are you sure you want to delete the <strong>{tempName}</strong> template?
                            Once deleted, the template will no longer be available.</p>
                    </div>
                </ModalBody>
                <ModalFooter>
                    <Button color="primary" onClick={handleDelete}>Yes</Button>
                    <Button color="warning" onClick={closeDeleteModal}>No</Button>
                </ModalFooter>
            </Modal>

            <ToastContainer />
        </Fragment>
    );
};

export default Templates;
