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


const Importfaculty = () => {
    useAuth();
    const [importedData, setImportedData] = useState([]);
    const [duplicateEntries, setDuplicateEntries] = useState([]);
    const [wrongEntries, setWrongEntries] = useState([]); // State for wrong entries
    const [activeTab, setActiveTab] = useState('1');
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [maxNumber, setMaxNumber] = useState(0); // State for maximum registration number
    const [catid, setCatid] = useState([]);
    const [facultyid, setFacultyid] = useState([]);
    const [workshopid, setWorkshopid] = useState([]);
    const [manData, setManData] = useState([]);
    const [fileData, setfileData] = useState([]);
    const [importingData, setImportingData] = useState(false);
    const [users, setUsers] = useState([]);
    const [error, setError] = useState(null);
    const { permissions } = useContext(PermissionsContext);
    const [sendEmail, setSendEmail] = useState(false);
    const [titles, settitles] = useState([]);

    console.log("File data:", fileData);
    console.log("Mandatory Data:", manData);
    console.log("Workshop data:", workshopid);
    console.log("Correct Entries:", importedData);
    console.log("Duplicate Entries:", duplicateEntries);
    console.log("Wrong Entries:", wrongEntries);
    console.log("Email", sendEmail);


    const navigate = useNavigate(); // Initialize useHistory

    useEffect(() => {
        const fetchReg = async () => {
            setLoading(true);
            try {
                const token = getToken();
                const response = await axios.get(`${BackendAPI}/eventuser/getEmails`, {
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

    // Extract Facultys component
    const FacultysPermissions = permissions['ManageFaculty'];

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
                setFacultyid(response.data.facultyData);
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

    // const handleFileSelect = (event) => {
    //     const selectedFile = event.target.files[0];
    //     if (selectedFile) {
    //         const fileType = selectedFile.type;
    //         if (fileType !== 'text/csv') {
    //             SweetAlert.fire({
    //                 title: 'Warning!',
    //                 text: 'Select correct format',
    //                 icon: 'warning',
    //                 timer: 3000,
    //                 showConfirmButton: false,
    //                 allowOutsideClick: false,
    //                 allowEscapeKey: false,
    //             });
    //             // Clear the file input
    //             event.target.value = '';
    //             return;
    //         }

    //         const reader = new FileReader();
    //         reader.onload = (e) => {
    //             const data = new Uint8Array(e.target.result);
    //             if (fileType === 'text/csv') {
    //                 Papa.parse(selectedFile, {
    //                     complete: (result) => {
    //                         const fileData = result.data;
    //                         processFileData(fileData);
    //                     },
    //                     header: true
    //                 });
    //             }
    //             // Clear the file input after processing
    //             event.target.value = '';
    //         };
    //         reader.readAsArrayBuffer(selectedFile);
    //     }
    // };

    // const processFileData = (fileData) => {
    //     const extractHeaders = (data) => data.length > 0 ? Object.keys(data[0]).map(header => header.trim()) : [];

    //     const validateEmailSyntax = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

    //     const checkForDuplicates = (data, field) => {
    //         const uniqueValues = new Set();
    //         return data.filter(item => {
    //             const value = item[field];
    //             if (uniqueValues.has(value)) {
    //                 return true;
    //             }
    //             uniqueValues.add(value);
    //             return false;
    //         });
    //     };

    //     const validateHeaders = (headers) => {
    //         const requiredHeaders = ['Title', 'First Name', 'Last Name', 'Phone', 'Email', 'Registration Category ID'];
    //         const missingHeaders = requiredHeaders.filter(header => !headers.includes(header));

    //         const hasRegistrationNumberHeader = headers.includes('Registration Number');
    //         const hasRegistrationCategoryIDHeader = headers.includes('Registration Category ID');

    //         if (!hasRegistrationCategoryIDHeader) {
    //             toast('File must contain Registration Category ID column');
    //             setWrongEntries(fileData);
    //             setImportedData([]);
    //             return false;
    //         }

    //         if (hasRegistrationNumberHeader) {
    //             toast.warning('File contains Registration Number column');
    //             setWrongEntries(fileData);
    //             setImportedData([]);
    //             return false;
    //         }

    //         if (missingHeaders.length > 0) {
    //             toast(`File must contain the following columns: ${missingHeaders.join(', ')}`);
    //             setWrongEntries(fileData);
    //             setImportedData([]);
    //             return false;
    //         }

    //         return true;
    //     };

    //     // const validateEmails = (data) => data.filter(item => !validateEmailSyntax(item['Email']));
    //     const validateEmails = (data) => data.filter(item => (item['Email']));

    //     // const validatePasswords = (data) => data.filter(item => !item['Password']);

    //     const validateNonEmptyFields = (data) => {
    //         const requiredFields = ['Title', 'First Name', 'Last Name', 'Phone', 'Email', 'Registration Category ID'];
    //         return data.filter(item =>
    //             requiredFields.some(field => !item[field] || item[field].trim() === '')
    //         );
    //     };


    //     const validateCategoryIDs = (data) => {
    //         return data.filter(item => !catid.some(cat => cat.cs_reg_cat_id === parseInt(item['Registration Category ID'])));
    //     };


    //     const headers = extractHeaders(fileData);
    //     console.log("CSV Headers:", headers);

    //     if (!validateHeaders(headers)) {
    //         return;
    //     }

    //     const duplicateEmailsInFile = checkForDuplicates(fileData, 'Email');
    //     const invalidEmails = validateEmails(fileData);
    //     const emptyFields = validateNonEmptyFields(fileData);
    //     const invalidCategoryIDs = validateCategoryIDs(fileData);

    //     // Check for duplicates against existing users
    //     const existingUserEmails = new Set(users.map(user => user.cs_email));
    //     const duplicateEmailsFromExistingUsers = fileData.filter(item => existingUserEmails.has(item.Email));

    //     const duplicateEntries = [];
    //     // const wrongEntries = [...invalidEmails, ...emptyFields, ...invalidCategoryIDs]; //Changes made by omkar
    //     const wrongEntries = [...emptyFields, ...invalidCategoryIDs];

    //     setDuplicateEntries(duplicateEntries);
    //     setWrongEntries(wrongEntries);

    //     const correctEntries = fileData.filter(item =>
    //         !duplicateEntries.includes(item) &&
    //         !wrongEntries.includes(item) &&
    //         // validateEmailSyntax(item['Email']) && //Changes made by omkar
    //         !emptyFields.includes(item)
    //     );

    //     setImportedData(correctEntries);
    //     setfileData(fileData);

    //     SweetAlert.fire({
    //         title: 'Success!',
    //         text: 'File Uploaded successfully!',
    //         icon: 'success',
    //         timer: 3000,
    //         showConfirmButton: false,
    //         allowOutsideClick: false,
    //         allowEscapeKey: false,
    //     });
    // };





    // const findDuplicates = (data) => {
    //     const duplicates = [];
    //     const headers = Object.keys(data[0]); // Assuming headers are in the first row

    //     // Find the index of the "Registration Number" column
    //     const registrationNumberIndex = headers.findIndex(header => header === "Registration Number");

    //     if (registrationNumberIndex !== -1) {
    //         const seen = {};
    //         data.forEach((entry, index) => {
    //             const value = entry[headers[registrationNumberIndex]];
    //             if (seen[value]) {
    //                 duplicates.push(entry);
    //             } else {
    //                 seen[value] = true;
    //             }
    //         });
    //     } else {
    //         console.error("Registration Number column not found.");
    //     }
    //     setDuplicateEntries(duplicates);
    // };

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

        const validateEmailSyntax = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

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
            const requiredHeaders = ['Title', 'First Name', 'Last Name', 'Phone', 'Email', 'Faculty Type'];
            const missingHeaders = requiredHeaders.filter(header => !headers.includes(header));

            const hasRegistrationNumberHeader = headers.includes('Registration Number');
            // const hasRegistrationCategoryIDHeader = headers.includes('Registration Category ID');

            // if (!hasRegistrationCategoryIDHeader) {
            //     toast('File must contain Registration Category ID column');
            //     setWrongEntries(fileData);
            //     setImportedData([]);
            //     return false;
            // }

            if (hasRegistrationNumberHeader) {
                toast.warning('File contains Registration Number column');
                setWrongEntries(fileData);
                setImportedData([]);
                return false;
            }

            if (missingHeaders.length > 0) {
                toast(`File must contain the following columns: ${missingHeaders.join(', ')}`);
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
            const requiredFields = ['First Name', 'Last Name', 'Faculty Type'];
            return data.filter(item =>
                requiredFields.some(field => !item[field] || item[field].trim() === '')
            );
        };


        const validateFacultyIDs = (data) => {
            return data.filter(item => !facultyid.some(fac => fac.facultytype_id === parseInt(item['Faculty Type'])));
        };
        
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
        const invalidFacultyIDs = validateFacultyIDs(fileData);

        // Check for duplicates against existing users
        const existingUserEmails = new Set(users.map(user => user.cs_email));
        const duplicateEmailsFromExistingUsers = fileData.filter(item => existingUserEmails.has(item.Email));

        const duplicateEntries = [];
        // const wrongEntries = [...invalidEmails, ...emptyFields, ...invalidCategoryIDs]; //Changes made by omkar
        const wrongEntries = [...emptyFields, ...invalidFacultyIDs, ...invalidtitleIDs];

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
            title: 'Info!',
            text: 'File record are added for processing entries, Please review your data and process import!',
            icon: 'info',
            timer: 3000,
            showConfirmButton: false,
            allowOutsideClick: false,
            allowEscapeKey: false,
        });
    };






    const handleImportCorrectedData = async () => {
        try {

            setImportingData(true); // Start importing process

            const toastId = toast.info('Processing...', { autoClose: false });

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
                    await axios.post(`${BackendAPI}/eventuser/importfaculty`, {
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
            // const token = getToken();
            // await axios.post(`${BackendAPI}/manageuser/addBulkUser`, uniqueCorrectedData, {
            //     headers: {
            //         Authorization: `Bearer ${token}` // Include the token in the Authorization header
            //     }
            // });

            toast.dismiss(toastId);


            SweetAlert.fire({
                title: 'Success!',
                text: sendEmail ?
                    'Faculty correct data imported and mail sent successfully!' :
                    'Faculty correct data imported successfully!',
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
        } catch (error) {
            console.error('Error Importing:', error.message);
        } finally {
            setImportingData(false); // Finished importing process
        }
    };

    const handleDownloadSampleFile = async () => {
        try {
            // Make a GET request to the sample file route
            console.log("hello");
            const response = await axios.get(`${BackendAPI}/eventuser/facultyimportsamplefile`, {
                responseType: 'blob' // Specify responseType as 'blob' to handle binary data
            });

            // Create a URL for the generated file blob
            const url = window.URL.createObjectURL(new Blob([response.data]));

            // Create an anchor element and trigger a download
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', 'sample_faculty.csv');
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
            const response = await axios.get(`${BackendAPI}/eventuser/facultyimportinstructionfile`, {
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

    const handleNavigation = () => {
        navigate(`${process.env.PUBLIC_URL}/event/manage-faculty/Consoft`);
    };


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
                            Use this feature to Import the faculty of the event. <br />
                            Download the instruction file, review it carefully, then download the sample file. Once your entries are corrected, click <strong>Import Data</strong> to proceed.
                            After importing, to update more information about the faculty, go to the Manage Faculty page and edit the faculty details. <br />

                            Faculty will also be created as users.
                            You can also send an email to the users with corrected entries if needed. <br />

                            After importing, the users will appear on user listings.
                        </PopoverBody>
                    </UncontrolledPopover>
                </>
            } parentClickHandler={handleNavigation} parent="Manage faculty" title="Import Faculty" />
            <Container fluid>

                <Row>
                    <Col sm="12">
                        <Card>
                            <CardHeader className="d-flex justify-content-between align-items-center flex-column flex-md-row">
                                <div className="mb-2 mb-md-0">
                                    <h5 className="mb-2 text-start">Import Faculty</h5>

                                </div>
                                <div className="mb-2 mt-md-0">
                                    <button onClick={handleDownloadSampleFile} className="btn btn-success">
                                        Sample File
                                    </button>
                                </div>
                                <div className="mb-2 mt-md-0">
                                    <button onClick={handleDownloadInstructionFile} className="btn btn-info" data-tooltip-id="tooltip" data-tooltip-content="Download a Instruction file To import Users" data-tooltip-event="click focus">
                                        Instruction File
                                    </button>
                                    <Tooltip id="tooltip" globalEventOff="click" />
                                </div>

                                {FacultysPermissions?.add === 1 && (
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
                                )}
                                 {FacultysPermissions?.add === 1 && (
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
                                )}




                            </CardHeader>

                            <CardBody>
                                {/* <Col md="6" className="mb-3">
                                    <Input
                                        type="checkbox"
                                        id="sendEmail"
                                        checked={sendEmail}
                                        onChange={(e) => setSendEmail(e.target.checked)}
                                    />
                                    <Label className='form-check-label' style={{ marginLeft: '10px' }} htmlFor="sendEmail">
                                        <strong>Do you want to send an email to the users?</strong>
                                    </Label>
                                </Col> */}

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

export default Importfaculty;
