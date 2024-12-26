import React, { Fragment, useState, useEffect, useContext } from "react";
import { Container, Row, Col, Card, CardHeader, Label, CardBody, Button, Table, Input, TabContent, TabPane, Nav, NavItem, NavLink, PopoverBody, UncontrolledPopover } from 'reactstrap';
import classnames from 'classnames';
import { Breadcrumbs } from '../../AbstractElements';
import Papa from 'papaparse';
import axios from 'axios';
import { BackendAPI } from '../../api';
import SweetAlert from 'sweetalert2';
import { MdDelete, MdInfoOutline } from "react-icons/md";
import { Link, useNavigate } from 'react-router-dom';
import { getToken } from '../../Auth/Auth';
import useAuth from '../../Auth/protectedAuth';
import { toast } from 'react-toastify';
import { PermissionsContext } from '../../contexts/PermissionsContext';
import { Field, Form } from 'react-final-form';
import { Tooltip } from 'react-tooltip';

const ImportBasicRegUser = () => {
    useAuth();
    const [importedData, setImportedData] = useState([]);
    const [duplicateEntries, setDuplicateEntries] = useState([]);
    const [wrongEntries, setWrongEntries] = useState([]); // State for wrong entries
    const [activeTab, setActiveTab] = useState('1');
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [maxNumber, setMaxNumber] = useState(0); // State for maximum registration number
    const [catid, setCatid] = useState([]);
    const [workshopid, setWorkshopid] = useState([]);
    const [manData, setManData] = useState([]);
    const [fileData, setfileData] = useState([]);
    const [titles, settitles] = useState([]);
    const [importingData, setImportingData] = useState(false);
    const [users, setUsers] = useState([]);
    const [error, setError] = useState(null);
    const { permissions } = useContext(PermissionsContext);
    const [sendEmail, setSendEmail] = useState(false);

    console.log("File data:", fileData);
    console.log("Mandatory Data:", manData);
    console.log("Workshop data:", workshopid);
    console.log("Correct Entries:", importedData);
    console.log("Duplicate Entries:", duplicateEntries);
    console.log("Wrong Entries:", wrongEntries);

    const navigate = useNavigate(); // Initialize useHistory

    useEffect(() => {
        const fetchReg = async () => {
            setLoading(true);
            try {
                const token = getToken();
                const response = await axios.get(`${BackendAPI}/reguser/getEmails`, {
                    headers: {
                        Authorization: `Bearer ${token}` // Include the token in the Authorization header
                    }
                });

                setUsers(response.data);
                setLoading(false);
            } catch (error) {
                console.error("Error fetching users:", error);
                setError("Error fetching users. Please try again later.");
                setLoading(false);
            }
        };

        fetchReg();
    }, [permissions]);

    useEffect(() => {
        const fetchCatId = async () => {
            setLoading(true);
            try {
                const token = getToken();
                const response = await axios.get(`${BackendAPI}/field/getCatId`, {
                    headers: {
                        Authorization: `Bearer ${token}` // Include the token in the Authorization header
                    }
                });
                setCatid(response.data.catData);
                setWorkshopid(response.data.workshopData);
                settitles(response.data.prefixData);
                console.log("user dataa", response.data.catData);

                // Transform the mandatory data to an array of field labels
                const mandatoryLabels = response.data.mandatoryData.map(item => item.cs_field_label);
                setManData(mandatoryLabels);
                setLoading(false);
            } catch (error) {
                console.error("Error fetching users:", error);
                setLoading(false);
            }
        };

        fetchCatId();
    }, []);

    const toggleTab = (tab) => {
        if (activeTab !== tab) setActiveTab(tab);
    };

    const handleFileSelect = (event) => {
        const selectedFile = event.target.files[0];
        if (selectedFile) {
            const fileType = selectedFile.type;
            if (fileType !== 'text/csv') {
                SweetAlert.fire({
                    title: 'Warning!',
                    text: 'Select correct format',
                    icon: 'warning',
                    timer: 3000,
                    showConfirmButton: false,
                    allowOutsideClick: false,
                    allowEscapeKey: false,
                });
                // Clear the file input
                event.target.value = '';
                return;
            }

            const reader = new FileReader();
            reader.onload = (e) => {
                const data = new Uint8Array(e.target.result);
                if (fileType === 'text/csv') {
                    Papa.parse(selectedFile, {
                        complete: (result) => {
                            const fileData = result.data;
                            processFileData(fileData);
                        },
                        header: true
                    });
                }
                // Clear the file input after processing
                event.target.value = '';
            };
            reader.readAsArrayBuffer(selectedFile);
        }
    };

    const processFileData = (fileData) => {
        const extractHeaders = (data) => data.length > 0 ? Object.keys(data[0]).map(header => header.trim()) : [];

        // const validateEmailSyntax = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email); //Changes made by omkar

        const checkForDuplicates = (data, field) => {
            const uniqueValues = new Set();
            return data.filter(item => {
                const value = item[field];
                if (uniqueValues.has(value)) {
                    return true;
                }
                uniqueValues.add(value);
                return false;
            });
        };

        const validateHeaders = (headers) => {
            const requiredHeaders = ['Title', 'First Name', 'Last Name', 'Phone', 'Email'];
            const missingHeaders = requiredHeaders.filter(header => !headers.includes(header));

            if (missingHeaders.length > 0) {
                toast(`File must contain the following columns: ${missingHeaders.join(', ')}`);
                setWrongEntries(fileData);
                setImportedData([]);
                return false;
            }

            const hasRegistrationNumberHeader = headers.includes('Registration Number');


            if (hasRegistrationNumberHeader) {
                toast.warning('File contains Registration Number column');
                setWrongEntries(fileData);
                setImportedData([]);
                return false;
            }

            return true;
        };



        // const validateEmails = (data) => data.filter(item => !validateEmailSyntax(item['Email']));
        const validateEmails = (data) => data.filter(item => (item['Email']));

        // const validatePasswords = (data) => data.filter(item => !item['Password']);

        const validateNonEmptyFields = (data) => {
            const requiredFields = ['First Name', 'Last Name'];
            return data.filter(item =>
                requiredFields.some(field => !item[field] || item[field].trim() === '')
            );
        };


        // const validateCategoryIDs = (data) => {
        //     return data.filter(item => !catid.some(cat => cat.cs_reg_cat_id === parseInt(item['Registration Category ID'])));
        // };

        const validatetitle = (data) => {
            return data.filter(item => item['Title'] && !titles.some(title => title.cs_prefix_id === parseInt(item['Title'])));
        };

        const headers = extractHeaders(fileData);
        console.log("CSV Headers:", headers);

        if (!validateHeaders(headers)) {
            return;
        }

        const duplicateEmailsInFile = checkForDuplicates(fileData, 'Email');
        const invalidEmails = validateEmails(fileData);
        const emptyFields = validateNonEmptyFields(fileData);
        // const invalidCategoryIDs = validateCategoryIDs(fileData);
        const invalidtitleIDs = validatetitle(fileData);


        // Check for duplicates against existing users
        const existingUserEmails = new Set(users.map(user => user.cs_email));
        const duplicateEmailsFromExistingUsers = fileData.filter(item => existingUserEmails.has(item.Email));

        const duplicateEntries = [];
        //const wrongEntries = [...invalidEmails ,...emptyFields, ...invalidCategoryIDs]; //Changes made by omkar
        // const wrongEntries = [...emptyFields, ...invalidCategoryIDs, ...invalidtitleIDs];
        const wrongEntries = [...emptyFields, ...invalidtitleIDs];


        setDuplicateEntries(duplicateEntries);
        setWrongEntries(wrongEntries);

        const correctEntries = fileData.filter(item =>
            !duplicateEntries.includes(item) &&
            !wrongEntries.includes(item) &&
            // validateEmailSyntax(item['Email']) && //Changes made by omkar
            !emptyFields.includes(item)
        );

        setImportedData(correctEntries);
        setfileData(fileData);

        SweetAlert.fire({
            title: 'Success',
            text: 'File record are added for processing entries, Please review your data and process import!',
            icon: 'info',
            timer: 3000,
            showConfirmButton: false,
            allowOutsideClick: false,
            allowEscapeKey: false,
        });
    }




    const handleImportCorrectedData = async () => {

        try {
            const result = await SweetAlert.fire({
                title: 'Confirmation',
                text: sendEmail ?
                    'All the corrected entries will be imported, and an email will be sent to those email addresses. Do you want to proceed with importing users and sending emails?' :
                    'All the corrected entries will be imported, but emails will not be sent. Do you want to proceed with importing users without sending emails?',
                icon: 'warning',
                showCancelButton: true,
                confirmButtonText: 'Yes, import data',
                cancelButtonText: 'No, cancel',
            });

            const toastId = toast.info('Processing...', { autoClose: false });


            if (result.isConfirmed) {

                setImportingData(true); // Start importing process

                // Filter out wrong entries and duplicate entries
                const uniqueCorrectedData = importedData.filter(entry => {
                    return entry && entry['First Name'] && entry['First Name'].trim() !== '';
                });

                console.log("Unique Corrected Data:", uniqueCorrectedData);
                const chunkSize = 100; // Define the size of each chunk
                const token = getToken();

                // Function to send data in chunks
                const sendChunk = async (chunk) => {
                    try {
                        await axios.post(`${BackendAPI}/reguser/addBulkUser`, {
                            data: chunk, // Send the chunk of data
                            sendEmail: sendEmail // Include the sendEmail flag
                        }, {
                            headers: {
                                Authorization: `Bearer ${token}` // Include the token in the Authorization header
                            }
                        });
                    } catch (error) {
                        console.error('Error sending chunk:', error.response ? error.response.data : error.message);
                        throw error; // Rethrow the error to handle it in the outer try-catch block
                    }
                };

                // Split the data into chunks and send each chunk
                for (let i = 0; i < uniqueCorrectedData.length; i += chunkSize) {
                    const chunk = uniqueCorrectedData.slice(i, i + chunkSize);
                    await sendChunk(chunk); // Wait for the request to complete before sending the next one
                }

                toast.dismiss(toastId);


                SweetAlert.fire({
                    title: 'Success!',
                    text: sendEmail ?
                        'User correct data imported and mail sent successfully!' :
                        'User correct data imported successfully!',
                    icon: 'warning',
                    icon: 'success',
                    timer: 3000,
                    showConfirmButton: false,
                    allowOutsideClick: false,
                    allowEscapeKey: false
                }).then((result) => {
                    if (result.dismiss === SweetAlert.DismissReason.timer) {
                        navigate(`${process.env.PUBLIC_URL}/event/manage-user/Consoft`);
                    }
                });
            }
        } catch (error) {
            console.error('Error Importing:', error.message);
        } finally {
            setImportingData(false); // Finished importing process
        }
    };

    const handleDownloadSampleFile = async () => {
        try {
            // Make a GET request to the sample file route
            const response = await axios.get(`${BackendAPI}/reguser/samplefile`, {
                responseType: 'blob' // Specify responseType as 'blob' to handle binary data
            });

            // Create a URL for the generated file blob
            const url = window.URL.createObjectURL(new Blob([response.data]));

            // Create an anchor element and trigger a download
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', 'sample_basic.csv');
            document.body.appendChild(link);
            link.click();

            // Cleanup
            link.parentNode.removeChild(link);
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Error downloading sample file:', error);
        }
    };

    const handleDownloadInstructionFile = async () => {
        try {
            // Make a GET request to the sample file route
            console.log("hello");
            const response = await axios.get(`${BackendAPI}/reguser/instructionfile`, {
                responseType: 'blob' // Specify responseType as 'blob' to handle binary data
            });

            // Create a URL for the generated file blob
            const url = window.URL.createObjectURL(new Blob([response.data]));

            // Create an anchor element and trigger a download
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', 'Instructions.csv');
            document.body.appendChild(link);
            link.click();

            // Cleanup
            link.parentNode.removeChild(link);
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Error downloading sample file:', error);
        }
    };


    const handlesendmassage = async (values) => {
        const emailFlag = values.sendEmail || false;
        console.log("Send Email:", emailFlag);
    }

    return (
        <Fragment>
            <Breadcrumbs mainTitle={
                <>
                    Import Users
                    <MdInfoOutline
                        id="importPopover"
                        style={{
                            cursor: 'pointer', position: 'absolute', marginLeft: '5px'
                        }}
                    />
                    <UncontrolledPopover
                        placement="bottom"
                        target="importPopover"
                        trigger="focus"
                    >
                        <PopoverBody>
                            Use this feature to import basic users who have not yet Confirmed for the event. <br />

                            First, download and review the instruction file, then download the sample file and enter your data. Once you have completed and verified your entries, select the file and click <strong>Import Data</strong> to proceed.

                            You can also send an email to the users with corrected entries if needed.

                            After importing, the users will appear on user listings.

                        </PopoverBody>
                    </UncontrolledPopover>
                </>
            } parent="Manage User" title="Import Users" />
            <Container fluid>

                <Row>
                    <Col sm="12">
                        <Card>
                            <CardHeader className="d-flex justify-content-between align-items-center flex-column flex-md-row">
                                <div className="mb-2 mb-md-0">
                                    <h5 className="mb-2 text-start">Import Basic User</h5>

                                </div>
                                <div className="mb-2 mt-md-0">
                                    <button onClick={handleDownloadSampleFile} className="btn btn-success" data-tooltip-id="tooltip" data-tooltip-content="Download a Sample file To import Users" data-tooltip-event="click focus">
                                        Sample File
                                    </button>
                                    <Tooltip id="tooltip" globalEventOff="click" />
                                </div>
                                <div className="mb-2 mt-md-0">
                                    <button onClick={handleDownloadInstructionFile} className="btn btn-info" data-tooltip-id="tooltip" data-tooltip-content="Download a Instruction file To import Users" data-tooltip-event="click focus">
                                        Instruction File
                                    </button>
                                    <Tooltip id="tooltip" globalEventOff="click" />
                                </div>


                                <div className="mt-2 mt-md-0">
                                    <Input
                                        type="file"
                                        accept=".csv,.xlsx"
                                        onChange={handleFileSelect}
                                        style={{ display: 'none' }}
                                        id="fileInput"
                                    />
                                    <label htmlFor="fileInput" className="btn btn-primary">Select File</label>
                                </div>

                                <div className=" mt-md-0">
                                    <Button
                                        color='warning'
                                        type='button'
                                        className="mr-2 mb-2"
                                        onClick={handleImportCorrectedData}
                                        disabled={importedData.length === 0 || importingData} // Disable button if no imported data or importing in progress
                                    >
                                        Import Data
                                    </Button>
                                </div>





                            </CardHeader>

                            <CardBody>
                                <Form
                                    onSubmit={handlesendmassage}
                                    render={({ handleSubmit, form }) => (
                                        <form onSubmit={handleSubmit}>
                                            <Field
                                                name="sendEmail"
                                                type="checkbox"
                                            >
                                                {({ input, meta }) => (
                                                    <div className="mb-2">
                                                        <input
                                                            {...input}
                                                            id="sListing"
                                                            checked={sendEmail} // Controlled component
                                                            onChange={(e) => {
                                                                input.onChange(e); // Trigger Field's onChange
                                                                setSendEmail(e.target.checked); // Update state
                                                            }}
                                                        />
                                                        <Label className='form-check-label' style={{ marginLeft: '10px' }} for="sListing">
                                                            <strong>Do you want to send an email to the imported users?</strong>
                                                        </Label>
                                                        {meta.error && meta.touched && <p className='d-block text-danger'>{meta.error}</p>}
                                                    </div>
                                                )}
                                            </Field>
                                        </form>
                                    )}
                                />
                                <div className="table-container">

                                    <Nav tabs>
                                        <NavItem>
                                            <NavLink
                                                className={classnames({ active: activeTab === '1' })}
                                                onClick={() => { toggleTab('1'); }}
                                                style={{ cursor: 'pointer' }}
                                            >
                                                Correct Entries
                                            </NavLink>
                                        </NavItem>
                                        <NavItem>
                                            <NavLink
                                                className={classnames({ active: activeTab === '2' })}
                                                onClick={() => { toggleTab('2'); }}
                                                style={{ cursor: 'pointer' }}
                                            >
                                                Duplicate Entries
                                            </NavLink>
                                        </NavItem>
                                        <NavItem>
                                            <NavLink
                                                className={classnames({ active: activeTab === '3' })}
                                                onClick={() => { toggleTab('3'); }}
                                                style={{ cursor: 'pointer' }}
                                            >
                                                Wrong Entries
                                            </NavLink>
                                        </NavItem>
                                    </Nav>
                                    <div className='table-responsive'>
                                        <TabContent activeTab={activeTab}>
                                            <TabPane tabId="1">
                                                <Table>
                                                    <thead>
                                                        <tr>
                                                            {fileData.length > 0 &&
                                                                Object.keys(fileData[0]).map((header, index) => (
                                                                    <th key={index}>{header}</th>
                                                                ))}
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {importedData.length > 0 ? (
                                                            importedData.map((rowData, rowIndex) => (
                                                                <tr key={rowIndex}>
                                                                    {Object.values(rowData).map((value, colIndex) => (
                                                                        <td key={colIndex}>{value}</td>
                                                                    ))}
                                                                </tr>
                                                            ))
                                                        ) : (
                                                            <tr>
                                                                <td colSpan={fileData.length > 0 ? Object.keys(fileData[0]).length : 1} className="text-center">
                                                                    No Correct Entries Found
                                                                </td>
                                                            </tr>
                                                        )}
                                                    </tbody>
                                                </Table>
                                            </TabPane>
                                            <TabPane tabId="2">
                                                <Table>
                                                    <thead>
                                                        <tr>
                                                            {fileData.length > 0 &&
                                                                Object.keys(fileData[0]).map((header, index) => (
                                                                    <th key={index}>{header}</th>
                                                                ))}
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {duplicateEntries.length > 0 ? (
                                                            duplicateEntries.map((rowData, rowIndex) => (
                                                                <tr key={rowIndex}>
                                                                    {Object.values(rowData).map((value, colIndex) => (
                                                                        <td key={colIndex}>{value}</td>
                                                                    ))}
                                                                </tr>
                                                            ))
                                                        ) : (
                                                            <tr>
                                                                <td colSpan={fileData.length > 0 ? Object.keys(fileData[0]).length : 1} className="text-center">
                                                                    No Duplicate Entries Found
                                                                </td>
                                                            </tr>
                                                        )}
                                                    </tbody>
                                                </Table>
                                            </TabPane>
                                            <TabPane tabId="3">
                                                <Table>
                                                    <thead>
                                                        <tr>
                                                            {fileData && fileData.length > 0 && Object.keys(fileData[0]).map((key, index) => (
                                                                <th key={index}>{key}</th>
                                                            ))}
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {wrongEntries && wrongEntries.length > 0 ? (
                                                            wrongEntries.map((rowData, rowIndex) => (
                                                                <tr key={rowIndex}>
                                                                    {Object.values(rowData).map((value, colIndex) => (
                                                                        <td key={colIndex}>{value}</td>
                                                                    ))}
                                                                </tr>
                                                            ))
                                                        ) : (
                                                            <tr>
                                                                <td colSpan={(fileData && fileData.length > 0) ? Object.keys(fileData[0]).length : 1} className="text-center">
                                                                    No Wrong Entries Found
                                                                </td>
                                                            </tr>
                                                        )}
                                                    </tbody>
                                                </Table>
                                            </TabPane>
                                        </TabContent>
                                    </div>
                                </div>
                            </CardBody>
                        </Card>
                    </Col>
                </Row>
            </Container>
        </Fragment>
    );
};

export default ImportBasicRegUser;
