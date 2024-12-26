import React, { useState, useEffect, Fragment, useContext } from 'react';
import { Container, Row, Col, Card, CardHeader, CardBody, Button, Table, Input, TabContent, TabPane, Nav, NavItem, NavLink, PopoverBody, UncontrolledPopover } from 'reactstrap';
import classnames from 'classnames';
import { Breadcrumbs } from '../../AbstractElements';
import { MdDelete, MdInfoOutline } from "react-icons/md";
import Papa from 'papaparse';
import axios from 'axios';
import { BackendAPI } from '../../api';
import SweetAlert from 'sweetalert2';
import { Link, useNavigate } from 'react-router-dom';
import { getToken } from '../../Auth/Auth';
import useAuth from '../../Auth/protectedAuth';
import { toast } from 'react-toastify';
import { Tooltip } from 'react-tooltip';
import { PermissionsContext } from '../../contexts/PermissionsContext';


const ImportUserWithoutReg = () => {
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
    const [importingData, setImportingData] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [message, setMessage] = useState('');
    const [titles, settitles] = useState([]);
    const { permissions } = useContext(PermissionsContext);

    console.log("File data:", fileData);
    console.log("Mandatory Data:", manData);
    console.log("Workshop data:", workshopid);
    console.log("Correct Entries:", importedData);
    console.log("Duplicate Entries:", duplicateEntries);
    console.log("Wrong Entries:", wrongEntries);

    const navigate = useNavigate(); // Initialize useHistory

    useEffect(() => {
        // Fetch the maximum registration number when the component mounts
        fetchMaxNumber();
    }, []);

    const fetchMaxNumber = async () => {
        try {
            const token = getToken();
            const response = await axios.get(`${BackendAPI}/manageuser/getMaxNo`, {
                headers: {
                    Authorization: `Bearer ${token}` // Include the token in the Authorization header
                }
            });
            const maxNo = response.data; // Response directly contains the maximum registration number
            setMaxNumber(maxNo);
        } catch (error) {
            console.error('Error fetching maximum registration number:', error);
        }
    };

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
    }, [permissions]);

        // Extract Facultys component
        const ImportUserWithoutRegPermissions = permissions['ImportUserWithoutReg'];

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

            Papa.parse(selectedFile, {
                header: true, // Assumes first row as header
                complete: (result) => {
                    // Trim leading and trailing spaces from the parsed data
                    const parsedData = result.data.map((row) => {
                        return Object.fromEntries(
                            Object.entries(row).map(([key, value]) => [key.trim(), value ? value.trim() : value])
                        );
                    });

                    processFileData(parsedData);

                    // Clear the file input after processing
                    event.target.value = '';
                },
            });
        }
    };


    const processFileData = (fileData) => {
        // Extract headers from the first row of the CSV file
        const csvHeaders = fileData.length > 0 ? Object.keys(fileData[0]).map(header => header.trim()) : [];
        console.log("CSV Headers:", csvHeaders);

        // Find matching headers
        const matchingHeaders = csvHeaders.filter(header => manData.includes(header));

        // Log matched headers to the console
        console.log("Matched Headers:", matchingHeaders);

        // Check if 'Registration Category ID' is in the headers
        const hasRegistrationCategoryIDHeader = csvHeaders.includes('Registration Category ID');

        if (!hasRegistrationCategoryIDHeader) {
            toast('File must contain Registration Category ID column');
            setWrongEntries(fileData);
            setImportedData([]);
            return;
        }

        const hasRegistrationnumberHeader = csvHeaders.includes('Registration Number');

        if (hasRegistrationnumberHeader) {
            toast('File contain Registration Number column');
            setWrongEntries(fileData);
            setImportedData([]);
            return;
        }

        // Proceed even if 'Workshop Category' is missing or undefined
        const hasWorkshopCategoryHeader = csvHeaders.includes('Workshop Category');

        // Extract valid Registration Category IDs
        const fileCatids = fileData
            .map((item) => item['Registration Category ID'] ? String(item['Registration Category ID']).trim() : null)
            .filter(Boolean); // Filter out null or undefined

        // If 'Workshop Category' is present, extract valid Workshop Category IDs, otherwise set as an empty array
        const fileWorkshopids = hasWorkshopCategoryHeader
            ? fileData.map((item) => item['Workshop Category'] ? String(item['Workshop Category']).trim() : null).filter(Boolean)
            : [];

        const filetitle = fileData
            .map((item) => String(item['Title'] || ''))

        console.log("Title:", filetitle);
        // const filetitle = fileData
        // .map((item) => String(item['Title'] || ''));

        // Active IDs from external data
        const activeCatid = catid.map((Cat) => String(Cat.cs_reg_cat_id));
        const activeWorkshopid = workshopid.map((Workshop) => String(Workshop.cs_workshop_id));
        const activeTitle = titles.map((title) => String(title.cs_prefix_id));

        // Find wrong entries
        const wrongs = fileCatids.filter(
            (catid) => !activeCatid.includes(catid)
        );

        const wrongWorkshops = hasWorkshopCategoryHeader
            ? fileWorkshopids.filter((workshopid) => !activeWorkshopid.includes(workshopid))
            : []; // Skip if 'Workshop Category' is missing

        const wrongtitles = filetitle.filter((title) => {
            return !activeTitle.includes(title) && title.trim() !== '';
        });

        console.log("Wrong Title:", wrongtitles);



        // Check for empty or invalid entries in matched headers
        const emptyEntries = fileData.filter((item) =>
            matchingHeaders
                .filter(header => header !== 'Title' && header !== 'Workshop Category')  // Exclude 'Title' from being checked for emptiness
                .some((header) => item[header] === undefined || item[header].trim() === '')
        );

        console.log("Empty", emptyEntries);

        // Validation logic for First Name and Last Name
        const invalidEntries = fileData.filter((item) => {
            const firstName = item['First Name'] ? item['First Name'].trim() : '';
            const lastName = item['Last Name'] ? item['Last Name'].trim() : '';

            const hasLeadingOrTrailingSpaces = (value) => /^\s+|\s+$/.test(value);

            const hasInvalidChars = (value) => !/^[a-zA-Z0-9-_().]+(?:\s+[a-zA-Z0-9-_().]+)*$/.test(value);

            return (
                hasLeadingOrTrailingSpaces(firstName) ||
                hasLeadingOrTrailingSpaces(lastName) ||
                hasInvalidChars(firstName) ||
                hasInvalidChars(lastName)
            );
        });



        // Identify wrong entries
        const wrongEntries = fileData.filter((item) =>
            (item['Registration Category ID'] && wrongs.includes(String(item['Registration Category ID']))) ||
            // (hasWorkshopCategoryHeader && item['Workshop Category'] && wrongWorkshops.includes(String(item['Workshop Category']))) ||
            (item['Workshop Category'] && wrongWorkshops.includes(String(item['Workshop Category']))) ||
            (item['Title'] && wrongtitles.includes(String(item['Title']))) ||
            emptyEntries.includes(item) ||
            invalidEntries.includes(item)
        );

        setWrongEntries(wrongEntries);

        // Identify correct entries
        const correctEntries = fileData.filter((item) =>
            (item['Registration Category ID'] && !wrongs.includes(String(item['Registration Category ID']))) &&
            // (!hasWorkshopCategoryHeader || (item['Workshop Category'] && !wrongWorkshops.includes(String(item['Workshop Category'])))) &&
            (!item['Workshop Category'] || !wrongWorkshops.includes(item['Workshop Category'])) &&
            (!item['Title'] || !wrongtitles.includes(String(item['Title']))) &&
            !emptyEntries.includes(item) &&
            !invalidEntries.includes(item)
        );

        setImportedData(correctEntries);
        setfileData(fileData);

        // Show success alert
        SweetAlert.fire({
            title: 'Success!',
            text: 'File Uploaded successfully!',
            icon: 'success',
            timer: 3000,
            showConfirmButton: false,
            allowOutsideClick: false,
            allowEscapeKey: false,
        });
    };



    const findDuplicates = (data) => {
        const duplicates = [];
        const headers = Object.keys(data[0]); // Assuming headers are in the first row

        // Find the index of the "Registration Number" column
        const registrationNumberIndex = headers.findIndex(header => header === "Registration Number");

        if (registrationNumberIndex !== -1) {
            const seen = {};
            data.forEach((entry, index) => {
                const value = entry[headers[registrationNumberIndex]];
                if (seen[value]) {
                    duplicates.push(entry);
                } else {
                    seen[value] = true;
                }
            });
        } else {
            console.error("Registration Number column not found.");
        }
        setDuplicateEntries(duplicates);
    };




    const handleImportCorrectedData = async () => {
        setIsProcessing(true);
        setMessage('The process has started and is running in the background. Once it is completed, we will notify you. In the meantime, you are free to start other processes.');

        setTimeout(() => {
            setMessage('');
        }, 10000);


        const toastId = toast.info('Processing...', { autoClose: false });
        try {

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
                    await axios.post(`${BackendAPI}/manageuser/addBulkUser`, chunk, {
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

            setIsProcessing(false);
            toast.dismiss(toastId);
            toast.success("All Users are imported sucessfully");

            SweetAlert.fire({
                title: 'Success!',
                text: 'User correct data imported successfully !',
                icon: 'success',
                timer: 3000,
                showConfirmButton: false,
                allowOutsideClick: false,
                allowEscapeKey: false
            }).then((result) => {
                if (result.dismiss === SweetAlert.DismissReason.timer) {
                    navigate(`${process.env.PUBLIC_URL}/onsite/manage-user/Consoft`);
                }
            });
        } catch (error) {
            console.error('Error Importing:', error.message);
            toast.dismiss(toastId);
            if (error.response && error.response.status === 503) {
                toast.error("Your request could not be processed at this moment due to ongoing processes in the queue. We will notify you once the process is completed. Please try again later.");
            } else if (error.request) {
                // Request made but no response received
                toast.error('Network error. Please try again later.');
            } else {
                // Something happened in setting up the request
                toast.error('Failed to import user. Please try again later.');
            }
        } finally {
            setImportingData(false); // Finished importing process
        }
    };

    const handleDownloadSampleFile = async () => {
        try {
            // Make a GET request to the sample file route
            console.log("hello");
            const response = await axios.get(`${BackendAPI}/report/samplefile`, {
                responseType: 'blob' // Specify responseType as 'blob' to handle binary data
            });

            // Create a URL for the generated file blob
            const url = window.URL.createObjectURL(new Blob([response.data]));

            // Create an anchor element and trigger a download
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', 'sample_without_registration_num.csv');
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
            const response = await axios.get(`${BackendAPI}/report/importinstructionfilewithoutreg`, {
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
                            Use this feature to <strong>Import users without entering the registration number</strong>(Registration number will auto-generated as set in Admin setting) <br />
                            First, download and review the instruction file, then download the sample file and enter your data. Once you have completed and verified your entries, select the file and click <strong>Import Data</strong> to proceed. <br />
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
                                    <h5 className="mb-2 text-start">Import without Registration Number</h5>
                                    <small>Your auto registration number will start from: {maxNumber}</small>
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
                                {ImportUserWithoutRegPermissions?.add === 1 && (
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
                                {ImportUserWithoutRegPermissions?.add === 1 && (
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
                                                            {fileData.length > 0 &&
                                                                Object.keys(fileData[0]).map((header, index) => (
                                                                    <th key={index}>{header}</th>
                                                                ))}
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {wrongEntries.length > 0 ? (
                                                            wrongEntries.map((rowData, rowIndex) => (
                                                                <tr key={rowIndex}>
                                                                    {Object.values(rowData).map((value, colIndex) => (
                                                                        <td key={colIndex}>{value}</td>
                                                                    ))}
                                                                </tr>
                                                            ))
                                                        ) : (
                                                            <tr>
                                                                <td colSpan={fileData.length > 0 ? Object.keys(fileData[0]).length : 1} className="text-center">
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

                <div>
                    {message && <DismissibleNotification message={message} onClose={() => setMessage('')} />}
                    {/* Your form and other components */}
                </div>
            </Container>
        </Fragment>
    );
};

export default ImportUserWithoutReg;
