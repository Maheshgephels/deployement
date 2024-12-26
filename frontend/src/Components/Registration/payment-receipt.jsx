import React, { Fragment, useState, useEffect, useContext } from 'react';
import { Container, Button, Row, Col, Card, CardBody, CardHeader, UncontrolledPopover, PopoverBody } from 'reactstrap';
import { Breadcrumbs } from '../../AbstractElements';
import { MdInfoOutline } from "react-icons/md";
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { BackendAPI, BackendPath } from '../../api';
import { PermissionsContext } from '../../contexts/PermissionsContext';
import useAuth from '../../Auth/protectedAuth';
import { getToken } from '../../Auth/Auth';
import parse from 'html-react-parser';
import moment from 'moment';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { toWords } from 'number-to-words';



const PaymentReceipt = () => {
    useAuth();
    const [receipt, setReceipt] = useState(''); // Initialize as an empty string
    const [settingdata, setSettingData] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();
    const location = useLocation();
    const { item } = location.state || {};
    const { permissions } = useContext(PermissionsContext);
    const generateReceiptPermissions = permissions['PaymentReceipt'];
    const determineTempId = (item) => {
        let temp_id;
      
        if (item.GST_Fee === "Yes") {
            // If GST is included
            if (item.GST_Include === "Yes" && !item.isStateMatched) {
                temp_id = 14; // GST Fee Yes
            } else if (item.isStateMatched) {
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
      const temp_id = determineTempId(item);

    // console.log("Receipt", receipt);
    console.log("Receipt Data", item);



    useEffect(() => {
        fetchReceipt();
    }, [permissions]);

    const fetchReceipt = async () => {
        try {
            const token = getToken();
            const response = await axios.post(`${BackendAPI}/paymentRoutes/getReceipt`, { temp_id }, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
            console.log('Fetch Receipt Response:', response.data); // Log response data

            setReceipt(response.data.htmlContent || ''); // Ensure this is a string field in your response
            setSettingData(response.data.settingData);

            console.log("Setting Data after fetch:", response.data.settingData);

        } catch (error) {
            console.error('Error fetching receipt:', error);
            setLoading(false);
        }
    };
    

    useEffect(() => {
        if (receipt && item) {
            const injectedHtml = injectDataIntoTemplate(receipt, item);
            setReceipt(injectedHtml);
        }
    }, [receipt, item]);



    // Function to replace placeholders with actual data, using moment for date formatting
    const injectDataIntoTemplate = (template, data) => {
        return template.replace(/\{{(\w+)\}}/g, (_, key) => {
            // Check if the key is a date field and format it using moment
            if (['created_at', 'payment_date', 'updated_at'].includes(key) && data[key]) {
                return moment(data[key]).format('DD MMM YYYY'); // Adjust format as needed
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
        navigate(`${process.env.PUBLIC_URL}/registration/manage-payment/Consoft`);
    };

    const handleGeneratePDF = async () => {
        const receiptElement = document.getElementById('receiptContent'); // Make sure this ID is on the element you want to convert

        if (receiptElement) {
            const canvas = await html2canvas(receiptElement, { scale: 2 }); // Increase scale for better resolution
            const imgData = canvas.toDataURL('image/png');

            const pdf = new jsPDF('p', 'mm', 'a4');
            const pageWidth = pdf.internal.pageSize.getWidth();
            const pageHeight = pdf.internal.pageSize.getHeight();
            const imgWidth = pageWidth;
            const imgHeight = (canvas.height * pageWidth) / canvas.width;

            if (imgHeight > pageHeight) {
                // Multiple pages if the content is larger than a single page
                let y = 0;
                while (y < imgHeight) {
                    pdf.addImage(imgData, 'PNG', 0, y ? 0 : 10, imgWidth, imgHeight, '', 'FAST');
                    y += pageHeight;
                    if (y < imgHeight) pdf.addPage();
                }
            } else {
                pdf.addImage(imgData, 'PNG', 0, 10, imgWidth, imgHeight, '', 'FAST');
            }

            pdf.save(`Payment_Receipt_${item.cs_regno}.pdf`);
        }
    };

    return (
        <Fragment>
            <Breadcrumbs parentClickHandler={handleNavigation} mainTitle={
                <>
                    Payment Receipt
                    <MdInfoOutline
                        id="addPopover"
                        style={{
                            cursor: 'pointer', position: 'absolute', marginLeft: '5px'
                        }}
                    />
                    <UncontrolledPopover
                        placement="bottom"
                        target="addPopover"
                        trigger="focus"
                    >
                        <PopoverBody>
                            Use the <strong>Create User</strong> feature to register a new user and ensure all required information is accurately entered before creating.
                        </PopoverBody>
                    </UncontrolledPopover>
                </>
            } parent="Registration Admin" title="Create User" />
            <Container fluid={true}>
                <Row>
                    <Col sm="12">
                        <Card>
                            <CardHeader>

                                <div className='d-flex align-items-center w-100'>
                                    <div className="mb-2 mb-md-0 w-100">
                                        <h5>Payment Receipt For {item.cs_first_name} ({item.cs_regno})</h5>

                                    </div>
                                    <div className="text-md-end w-100 mt-2 mt-md-0 text-end text-wrap">
                                        {generateReceiptPermissions?.add === 1 && (
                                            <Button color='warning' onClick={handleGeneratePDF}>
                                                Generate E Receipt
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            </CardHeader>
                            <CardBody>
                                <div id="receiptContent"> {/* Add this ID for the element you want to capture */}
                                    {parse(receipt)} {/* Render HTML */}
                                </div>
                            </CardBody>

                        </Card>
                    </Col>
                </Row>
            </Container>
        </Fragment>
    );
};

export default PaymentReceipt;
