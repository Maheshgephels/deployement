import React, { Fragment, useState, useEffect, useContext } from 'react';
import { Container, Button, Row, Col, Card, CardBody, CardHeader } from 'reactstrap';
import { Breadcrumbs } from '../../AbstractElements';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { BackendAPI, BackendPath } from '../../api';
import { PermissionsContext } from '../../contexts/PermissionsContext';
import useAuth from '../../Auth/protectedAuth';
import { getToken } from '../../Auth/Auth';
import parse from 'html-react-parser';
import moment from 'moment-timezone';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { toWords } from 'number-to-words';



const PaymentReceipt = () => {
    useAuth();
    const [receipt, setReceipt] = useState(''); // Initialize as an empty string
    const [settingdata, setSettingData] = useState([]);
    const navigate = useNavigate();
    const location = useLocation();
    const [data, setData] = useState([]);
    const { item } = location.state || {};
    const { permissions } = useContext(PermissionsContext);
    const AdminTimezone = localStorage.getItem('AdminTimezone');
    const generateReceiptPermissions = permissions['PaymentReceipt'];
    const [isMobile, setIsMobile] = useState(window.innerWidth <= 720);
    const determineTempId = (data) => {
        let temp_id;

        if (data.GST_Fee === "Yes") {
            // If GST is included
            if (data.GST_Include === "Yes" && !data.isStateMatched) {
                temp_id = 14; // GST Fee Yes
            } else if (data.isStateMatched) {
                temp_id = 17; // State matched 
            } else {
                temp_id = 16; // GST Fee No
            }
        } else {
            // If GST is not included
            temp_id = 10;
        }

        return temp_id;
    };


    // console.log("Receipt", receipt);
    console.log("Receipt Data", item);
    // console.log("Template", temp_id);

    console.log("User Data", data);

    useEffect(() => {
        // Fetch user data on mount
        const fetchData = async () => {
            await fetchUserData(); // Ensure this updates `data`
        };
        fetchData();

        // Handle SweetAlert based on `data.status`
        // if (data?.status === 0) {
        //     SweetAlert.fire({
        //         title: 'Success!',
        //         text: 'Payment receipt not available',
        //         icon: 'success',
        //         timer: 3000,
        //         showConfirmButton: false,
        //         allowOutsideClick: false,
        //         allowEscapeKey: false
        //     }).then(() => {
        //         navigate(`${process.env.PUBLIC_URL}/user-dashboard/Consoft`);
        //     });
        // }
    }, [data?.status]);



    const fetchUserData = async () => {
        try {
            const token = getToken();

            // Fetch UserId from localStorage
            const storedUserId = localStorage.getItem('UserId');

            if (!storedUserId) {
                console.error('UserId is not found in localStorage.');
                return;
            }

            const UserId = parseInt(storedUserId, 10); // Convert to number
            const response = await axios.post(`${BackendAPI}/paymentRoutes/getUserReceipt`, { UserId }, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
            console.log('Fetch User Receipt Response:', response.data);
            const userData = response.data.data[0];
            setData(userData);
            // Calculate temp_id after data is fetched
            const temp_id = determineTempId(userData);
            console.log("Determined temp_id:", temp_id);

            // Fetch receipt with the calculated temp_id
            fetchReceipt(temp_id);
        } catch (error) {
            console.error('Error fetching receipt:', error);
        }
    };



    const fetchReceipt = async (temp_id) => {
        console.log("Explicitly passed temp_id:", temp_id); // Log the passed temp_id
        try {
            const token = getToken();
            const response = await axios.post(`${BackendAPI}/paymentRoutes/getReceipt`, { temp_id }, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            console.log('Fetch Receipt Response:', response.data);

            let htmlContent = response.data.htmlContent || '';
            // Comment out the @media block
            htmlContent = htmlContent.replace(
                /@media only screen and \(max-width: 720px\) {([\s\S]*?})\s*}/g,
                match => `/* ${match} */`
            );

            setReceipt(htmlContent);
            setSettingData(response.data.settingData);

        } catch (error) {
            console.error('Error fetching receipt:', error);
        }
    };

    useEffect(() => {
        if (receipt && data) {
            const injectedHtml = injectDataIntoTemplate(receipt, data);
            setReceipt(injectedHtml);
        }
    }, [receipt, data]);



    // Function to replace placeholders with actual data, using moment for date formatting
    const injectDataIntoTemplate = (template, data) => {
        return template.replace(/\{{(\w+)\}}/g, (_, key) => {
            // Check if the key is a date field and format it using moment
            if (['created_at', 'updated_at'].includes(key) && data[key]) {
                return moment(data[key]).format('DD MMM YYYY'); // Adjust format as needed
            }

            // Check if the key is a date field and format it using moment
            if (['payment_date'].includes(key) && data[key]) {
                // Format the date and get the timezone abbreviation
                const formattedDate = moment.tz(data.payment_date, AdminTimezone).format('DD MMM YYYY'); // Format the date
                // Get the abbreviation using the custom mapping
                const timezoneAbbr = moment.tz(data.payment_date, AdminTimezone).format('z');

                // Return formatted date with timezone information
                return `${formattedDate} (${timezoneAbbr})`;
            }

            // Convert total_paid_amount to words if the key is amount_word
            if (key === 'amount_word' && data.total_paid_amount) {
                const amountInWords = toWords(Number(data.total_amount));
                return amountInWords.charAt(0).toUpperCase() + amountInWords.slice(1) + ' Only'; // Capitalize first letter and add " Only"
            }

            // Replace header placeholder with an image tag if header exists in settingdata
            if (key === 'header' && settingdata.header) {
                return `
                    <img align="center" border="0" 
                        src="${BackendPath}${settingdata.header}" 
                        alt="header" title="header" 
                        style="outline: none;text-decoration: none;-ms-interpolation-mode: bicubic;clear: both;display: inline-block !important;border: none;height: auto;float: none;width: 100%;max-width: 700px;" 
                        width="700" />
                `;
            }

            // Replace footer placeholder with an image tag if footer exists in settingdata
            if (key === 'footer' && settingdata.footer) {
                return `
                    <img align="center" border="0" 
                        src="${BackendPath}${settingdata.footer}" 
                        alt="footer" title="footer" 
                        style="outline: none;text-decoration: none;-ms-interpolation-mode: bicubic;clear: both;display: inline-block !important;border: none;height: auto;float: none;width: 100%;max-width: 700px;" 
                        width="700" />
                `;
            }

            // Replace with data or empty if key is missing
            return data[key] || '';
        });
    };



    //Not working
    // const injectDataIntoTemplate = (template, data) => {
    //     console.log("Template before replacement:", template);
    //     console.log("Data for replacement:", data);
    //     console.log("Setting Data for replacement:", settingdata);

    //     // Replace data placeholders like {{created_at}}, {{amount_word}}, etc.
    //     let populatedTemplate = template.replace(/\{{(\w+)\}}/g, (_, key) => {
    //         if (['created_at', 'payment_date', 'updated_at'].includes(key) && data[key]) {
    //             return moment(data[key]).format('DD MMM YYYY');
    //         }
    //         if (key === 'amount_word' && data.total_paid_amount) {
    //             const amountInWords = toWords(Number(data.total_paid_amount));
    //             return amountInWords.charAt(0).toUpperCase() + amountInWords.slice(1) + ' Only';
    //         }
    //         return data[key] || '';
    //     });

    //     // Update settingdata URLs with forward slashes
    //     const headerUrl = `http://localhost:4000/${settingdata.header.replace(/\\/g, '/')}`;
    //     const footerUrl = `http://localhost:4000/${settingdata.footer.replace(/\\/g, '/')}`;

    //     // Replace {{header}} and {{footer}} placeholders with updated URLs
    //     populatedTemplate = populatedTemplate.replace('{{header}}', headerUrl);
    //     populatedTemplate = populatedTemplate.replace('{{footer}}', footerUrl);

    //     console.log("Updated Receipt Template:", populatedTemplate);

    //     return populatedTemplate;
    // };



    const handleNavigation = () => {
        navigate(`${process.env.PUBLIC_URL}/user-dashboard/Consoft`);
    };

    const handleGeneratePDF = async () => {
        if (receipt) {
            const receiptElement = document.createElement('div');
            receiptElement.innerHTML = receipt; // Set the receipt content dynamically from state
    
            receiptElement.style.margin = '0';
            receiptElement.classList.add('receipt-content'); // Add a class for consistent styles
    
            // Append the receipt element to the body for rendering
            document.body.appendChild(receiptElement);
    
            const canvas = await html2canvas(receiptElement, { scale: 2 });
            const imgData = canvas.toDataURL('image/png');
    
            const pdf = new jsPDF('p', 'mm', 'a4');
            const pageWidth = pdf.internal.pageSize.getWidth();
            const pageHeight = pdf.internal.pageSize.getHeight();
            const imgWidth = pageWidth;
            const imgHeight = (canvas.height * pageWidth) / canvas.width;
    
            // Add padding after capturing the canvas by adjusting the placement
            const padding = 20; // Padding size in mm
            const xPos = padding;
            const yPos = padding;
    
            if (imgHeight > pageHeight) {
                let y = 0;
                while (y < imgHeight) {
                    pdf.addImage(imgData, 'PNG', xPos, yPos + y ? 0 : 10, imgWidth - 2 * padding, imgHeight, '', 'FAST');
                    y += pageHeight;
                    if (y < imgHeight) pdf.addPage();
                }
            } else {
                pdf.addImage(imgData, 'PNG', xPos, yPos + 10, imgWidth - 2 * padding, imgHeight, '', 'FAST');
            }
    
            document.body.removeChild(receiptElement);
    
            pdf.save(`Payment_Receipt_${data.cs_regno}.pdf`);
        }
    };

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth <= 720);
        window.addEventListener('resize', handleResize);

        return () => {
            window.removeEventListener('resize', handleResize);
        };
    }, []);

    return (
        <Fragment>
            <Breadcrumbs mainTitle="Payment Receipt" parent="Registration Admin" title="Payment Receipt" />
            <Container fluid={true}>
                {data?.status === 0 ? ( // Check if status is 0
                    <Row>
                        <Col sm="12">
                            <Card>
                                <CardHeader>
                                    <h5>Payment Receipt Unavailable</h5>
                                </CardHeader>
                                <CardBody>
                                    <p>The payment receipt is not available at this moment. Please contact admin or try again later.</p>
                                    <Button color="primary" onClick={handleNavigation}>
                                        Go Back to Dashboard
                                    </Button>
                                </CardBody>
                            </Card>
                        </Col>
                    </Row>
                ) : ( // Render the receipt content if status is not 0
                    <Row>
                        <Col sm="12">
                            <Card>
                                <CardHeader>
                                    <div className='d-flex align-items-center w-100'>
                                        <div className="mb-2 mb-md-0 w-100">
                                            <h5>Payment Receipt</h5>
                                        </div>
                                        <div className="text-md-end w-100 mt-2 mt-md-0 text-end text-wrap">
                                            <Button color='warning' onClick={handleGeneratePDF}>
                                                Download Receipt
                                            </Button>
                                        </div>
                                    </div>
                                </CardHeader>
                                {!isMobile && (

                                    <CardBody>
                                        <div id="receiptContent">
                                            {parse(receipt)} {/* Render HTML */}
                                        </div>
                                    </CardBody>
                                )}
                            </Card>
                        </Col>
                    </Row>
                )}
            </Container>
        </Fragment>
    );

};

export default PaymentReceipt;
