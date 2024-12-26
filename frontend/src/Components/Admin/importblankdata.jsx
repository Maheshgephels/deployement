import React, { Fragment, useState, useEffect, useContext } from "react";
import { Container, Row, Col, Card, CardBody, CardHeader, Button, Input, Nav, NavItem, NavLink, TabContent, TabPane, Table, PopoverBody, UncontrolledPopover } from "reactstrap";
import { Breadcrumbs } from "../../AbstractElements";
import axios from "axios";
import { Link, useNavigate } from 'react-router-dom';
import { MdDelete, MdInfoOutline } from "react-icons/md";
import SweetAlert from 'sweetalert2';
import { BackendAPI } from "../../api";
import Papa from "papaparse";
import classnames from "classnames"; // Import classnames
import { PermissionsContext } from '../../contexts/PermissionsContext';
import { getToken } from '../../Auth/Auth';
import useAuth from '../../Auth/protectedAuth';
import { toast } from 'react-toastify';
import { Tooltip } from 'react-tooltip';



const ImportBlankUser = () => {
  useAuth();
  const [users, setUsers] = useState([]);
  const [catid, setCatid] = useState([]);
  const [workshopid, setWorkshopid] = useState([]);
  const [manData, setManData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [fileData, setFileData] = useState(null);
  const [CorrectData, setCorrectData] = useState([]);
  const [DuplicateData, setDuplicateData] = useState([]);
  const [Wrong, setWrongs] = useState([]);
  const [activeTab, setActiveTab] = useState("corrected");
  const navigate = useNavigate();
  const { permissions } = useContext(PermissionsContext);
  const [importingData, setImportingData] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [message, setMessage] = useState('');
  const [titles, settitles] = useState([]);


  console.log("Workshop data:", workshopid);
  console.log("Cat data:", catid);
  console.log("Reg data:", users);
  console.log("File data:", fileData);
  console.log("Mandatory Data:", manData);
  console.log("Correct Entries:", CorrectData);
  console.log("Duplicate Entries:", DuplicateData);
  console.log("Wrong Entries:", Wrong);

  const ImportBlankPermission = permissions['ImportBlankUser'];

  useEffect(() => {
    const fetchReg = async () => {
      setLoading(true);
      try {
        const token = getToken();
        const response = await axios.get(`${BackendAPI}/field/getRegno`, {
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
        console.log("DATA", response.data);
        setCatid(response.data.catData);
        setWorkshopid(response.data.workshopData);
        settitles(response.data.prefixData);

        // Transform the mandatory data to an array of field labels
        const mandatoryLabels = response.data.mandatoryData.map(item => item.cs_field_label);
        setManData(mandatoryLabels);

        setLoading(false);
      } catch (error) {
        console.error("Error fetching users:", error);
        setError("Error fetching users. Please try again later.");
        setLoading(false);
      }
    };

    fetchCatId();
  }, []);



  const handleFileUpload = (event) => {
    const file = event.target.files[0];

    if (file.type !== 'text/csv') {
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

    Papa.parse(file, {
      complete: (result) => {

        // Trim leading and trailing spaces from the parsed data
        const parsedData = result.data.map(row => {
          return Object.fromEntries(
            Object.entries(row).map(([key, value]) => [key.trim(), value ? value.trim() : value])
          );
        });

        setFileData(parsedData);

        // Extract headers from the first row of the CSV file
        const csvHeaders = parsedData.length > 0 ? Object.keys(parsedData[0]).map(header => header.trim()) : [];
        console.log("CSV Headers:", csvHeaders);

        // Find matching headers
        const matchingHeaders = csvHeaders.filter(header => manData.includes(header));

        // Log matched headers to the console
        console.log("Matched Headers:", matchingHeaders);

        // Check if 'Registration Number' and 'Registration Category ID' are in the header
        const hasRequiredHeaders = csvHeaders.includes('Registration Number') && csvHeaders.includes('Registration Category ID');

        if (!hasRequiredHeaders) {
          toast('File does not contain required headers: Registration Number or Registration Category ID');
          setWrongs(parsedData);
          setCorrectData([]);
        } else {
          const fileRegnos = parsedData
            .filter((item) => item['Registration Number'] !== undefined)
            .map((item) => item['Registration Number']);
          const fileCatids = parsedData
            .filter((item) => item['Registration Category ID'] !== undefined)
            .map((item) => String(item['Registration Category ID']));
          // const fileWorkshopids = parsedData
          //   .filter((item) => item['Workshop Category'] !== undefined)
          //   .map((item) => String(item['Workshop Category']));
          // const filetitle = parsedData
          // .filter((item) => item['Title'] !== undefined)
          // .map((item) => String(item['Title']));
          // const filetitle = parsedData
          // .map((item) => String(item['Title'] || ''));
          //   const fileWorkshopids = (data) => {
          //     return data.filter(item => !titles.some(title => title.cs_prefix_id === parseInt(item['Title'])));
          // };

          const userRegnos = users.map((user) => String(user.cs_regno));
          const activeCatid = catid.map((Cat) => String(Cat.cs_reg_cat_id));
          const activeWorkshopid = workshopid.map((Workshop) => String(Workshop.cs_workshop_id));
          const activeTitle = titles.map((title) => String(title.cs_prefix_id));

          const duplicates = userRegnos.filter((regno) => fileRegnos.includes(regno));
          const wrongs = fileCatids.filter((catid) => !activeCatid.includes(catid));
          // const wrongWorkshops = fileWorkshopids.filter((workshopid) => !activeWorkshopid.includes(workshopid));
          // const wrongtitles = filetitle.filter((titles) => !activeTitle.includes(titles));
          // const wrongtitles = filetitle.filter((title) => !activeTitle.includes(title) || title.trim() === '');
          // const wrongtitles = filetitle.filter((title) => !activeTitle.includes(title) || title.trim() === '');

          // Check for empty columns in matched headers
          // const emptyEntries = parsedData.filter((item) =>
          //   matchingHeaders.some((header) => item[header] === undefined || item[header].trim() === '')
          // );

          // Validation logic for First Name and Last Name
          // const invalidEntries = parsedData.filter((item) => {
          //   const firstName = item['First Name'] ? item['First Name'].trim() : '';
          //   const lastName = item['Last Name'] ? item['Last Name'].trim() : '';

          //   const hasLeadingOrTrailingSpaces = (value) => /^\s+|\s+$/.test(value);
          //   // const hasInvalidChars = (value) => !/^[a-zA-Z0-9-_()]+(?: [a-zA-Z0-9-_()]+)*$/.test(value);
          //   const hasInvalidChars = (value) => !/^[a-zA-Z0-9-_().]+(?: [a-zA-Z0-9-_().]+)*$/.test(value);

          //   return (
          //     hasLeadingOrTrailingSpaces(firstName) ||
          //     hasLeadingOrTrailingSpaces(lastName) ||
          //     hasInvalidChars(firstName) ||
          //     hasInvalidChars(lastName)
          //   );
          // });

          const blankTitles = parsedData.filter((item) => !item['Title'] || item['Title'].trim() === '');

          const wrongEntries = parsedData.filter((item) =>
            (item['Registration Category ID'] && wrongs.includes(String(item['Registration Category ID'])))
            // ||
            // emptyEntries.includes(item) ||
            // invalidEntries.includes(item)
          );

          const correctEntries = parsedData.filter((item) =>
            item['Registration Number'] &&
            !duplicates.includes(item['Registration Number']) &&
            !wrongs.includes(item['Registration Category ID'])
            // !emptyEntries.includes(item) &&
            // !invalidEntries.includes(item)
          );

          setDuplicateData(duplicates);
          setWrongs(wrongEntries);
          setCorrectData(correctEntries);

          SweetAlert.fire({
            title: 'Success!',
            text: 'File record are added for processing entries, Please review your data and process import',
            icon: 'success',
            timer: 3000,
            showConfirmButton: false,
            allowOutsideClick: false,
            allowEscapeKey: false,
          });

          event.target.value = '';
        }
      },
      header: true, // Assumes first row as header
    });
  };

  const handleDownloadSampleFile = async () => {
    try {


      const response = await axios.get(`${BackendAPI}/report/samplefilewithregistrationnum`, {
        responseType: 'blob' // Specify responseType as 'blob' to handle binary data
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));

      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'sample_with_registration_num.csv');
      document.body.appendChild(link);
      link.click();

      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading sample file:', error);
    }
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


      const uniqueCorrectedData = CorrectData.filter(entry => {
        return entry && entry['Registration Number'] && entry['Registration Number'].trim() !== '';
      });

      console.log("Unique Corrected Data:", uniqueCorrectedData);

      const chunkSize = 100;
      const token = getToken();

      const sendChunk = async (chunk) => {
        try {
          await axios.post(`${BackendAPI}/manageuser/addBulkUser`, chunk, {
            headers: {
              Authorization: `Bearer ${token}`
            }
          });
        } catch (error) {
          console.error('Error sending chunk:', error.response ? error.response.data : error.message);
          throw error;
        }
      };

      for (let i = 0; i < uniqueCorrectedData.length; i += chunkSize) {
        const chunk = uniqueCorrectedData.slice(i, i + chunkSize);
        await sendChunk(chunk);
      }

      setIsProcessing(false);
      toast.dismiss(toastId);
      toast.success("All Users are imported sucessfully");

      SweetAlert.fire({
        title: 'Success!',
        text: 'User correct data imported successfully!',
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

  const handleDownloadInstructionFile = async () => {
    try {
      // Make a GET request to the sample file route
      console.log("hello");
      const response = await axios.get(`${BackendAPI}/report/importinstructionfileforblankdata`, {
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
              Use this feature to import Blank users data with registration numbers for blank badges, <br />
              First, download and review the instruction file, then download the sample file and enter your data. Once you have completed and verified your entries, select the file and click <strong>Import Data</strong> to proceed. <br />
              After importing, the users will appear on user listing.
            </PopoverBody>
          </UncontrolledPopover>
        </>
      } parent="Manage User" title="Import Users" />
      <Container fluid={true}>
        <Row>
          <Col sm={12}>
            <Card>
              <CardHeader className="d-flex justify-content-between align-items-center flex-column flex-md-row">
                <div className="mb-2 mb-md-0">
                  <h5 className="mb-2 text-start">Import Blank badge data</h5>
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
                {ImportBlankPermission?.add === 1 && (
                  <div className="mt-md-0">
                    <Input
                      type="file"
                      accept=".csv"
                      onChange={handleFileUpload} // Pass the event directly
                      style={{ display: 'none' }}
                      id="fileInput"
                    />
                    <label htmlFor="fileInput" className="btn btn-primary mr-2">
                      Select File
                    </label>

                  </div>
                )}
                {ImportBlankPermission?.add === 1 && (

                  <div className="mt-md-0">
                    {/* <Button color="warning" type="button" className="mr-2 mb-2" onClick={handleImportCorrectedData}
                  disabled={CorrectData.length === 0}>
                    Import Data
                  </Button> */}
                    <Button
                      color='warning'
                      type='button'
                      className="mr-2 mb-2"
                      onClick={handleImportCorrectedData}
                      disabled={CorrectData.length === 0 || importingData} // Disable button if no imported data or importing in progress
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
                        className={classnames({
                          active: activeTab === 'corrected',
                        })}
                        onClick={() => setActiveTab('corrected')}
                      >
                        Corrected Entries
                      </NavLink>
                    </NavItem>
                    <NavItem>
                      <NavLink
                        className={classnames({
                          active: activeTab === 'duplicate',
                        })}
                        onClick={() => setActiveTab('duplicate')}
                      >
                        Duplicate Entries
                      </NavLink>
                    </NavItem>
                    <NavItem>
                      <NavLink
                        className={classnames({ active: activeTab === 'wrong' })}
                        onClick={() => setActiveTab('wrong')}
                      >
                        Wrong Entries
                      </NavLink>
                    </NavItem>
                  </Nav>
                  <div className='table-responsive'>
                    <TabContent activeTab={activeTab}>
                      <TabPane tabId="corrected">
                        <Table>
                          <thead>
                            <tr>
                              {CorrectData && CorrectData.length > 0 && Object.keys(CorrectData[0]).map((key, index) => (
                                <th key={index}>{key}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {CorrectData && CorrectData.length > 0 ? (
                              CorrectData.map((rowData, rowIndex) => (
                                <tr key={rowIndex}>
                                  {Object.values(rowData).map((value, colIndex) => (
                                    <td key={colIndex}>{value}</td>
                                  ))}
                                </tr>
                              ))
                            ) : (
                              <tr>
                                <td colSpan={(fileData && fileData.length > 0) ? Object.keys(fileData[0]).length : 1} className="text-center">
                                  No Correct Entries Found
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </Table>
                      </TabPane>
                      <TabPane tabId="duplicate">
                        <Table>
                          <thead>
                            <tr>
                              {fileData && fileData.length > 0 && Object.keys(fileData[0]).map((key, index) => (
                                <th key={index}>{key}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {DuplicateData && DuplicateData.length > 0 ? (
                              DuplicateData.map((regno, index) => {
                                const duplicateRow = fileData.find(
                                  (row) => row['Registration Number'] === regno
                                );
                                if (duplicateRow) {
                                  return (
                                    <tr key={index}>
                                      {Object.values(duplicateRow).map((value, colIndex) => (
                                        <td key={colIndex}>{value}</td>
                                      ))}
                                    </tr>
                                  );
                                }
                                return null;
                              })
                            ) : (
                              <tr>
                                <td colSpan={(fileData && fileData.length > 0) ? Object.keys(fileData[0]).length : 1} className="text-center">
                                  No Duplicate Entries Found
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </Table>
                      </TabPane>
                      <TabPane tabId="wrong">
                        <Table>
                          <thead>
                            <tr>
                              {fileData && fileData.length > 0 && Object.keys(fileData[0]).map((key, index) => (
                                <th key={index}>{key}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {Wrong && Wrong.length > 0 ? (
                              Wrong.map((rowData, rowIndex) => (
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
        <div>
          {message && <DismissibleNotification message={message} onClose={() => setMessage('')} />}
          {/* Your form and other components */}
        </div>
      </Container>
    </Fragment>
  );
};

export default ImportBlankUser;

