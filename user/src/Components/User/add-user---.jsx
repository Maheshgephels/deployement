import React, { Fragment, useState, useEffect, useContext } from 'react';
import { Container, Row, Col, Input, Label, Table, Button, Card, CardBody, CardHeader, Modal, ModalHeader, FormFeedback, ModalBody, ModalFooter, Media, PopoverBody, UncontrolledPopover } from 'reactstrap';
import { useForm } from 'react-hook-form';
import axios from 'axios';
import { BackendAPI } from '../../api';
import SweetAlert from 'sweetalert2';
// import { Input } from 'antd';
import { Breadcrumbs } from '../../AbstractElements';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { MdDelete, MdInfoOutline } from "react-icons/md";
import Select from 'react-select';
import { Field, Form } from 'react-final-form'; // Import Field and Form from react-final-form
import { required, email, Img, PDF, option, number, Name, NAME, radio, username1, password, expiryDate } from '../Utils/validationUtils';
// import { PermissionsContext } from '../../contexts/PermissionsContext';
import useAuth from '../../Auth/protectedAuth';
import { getToken } from '../../Auth/Auth';
import moment from 'moment';
import Ordersummary from './order-summary';



//Utility function used to combine multiple validation functions into a single validation function
const composeValidators = (...validators) => value =>
    validators.reduce((error, validator) => error || validator(value), undefined);

const AddConferenceUser = () => {
    useAuth();
    const [data, setData] = useState([]);
    const [settingdata, setSettingData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modal, setModal] = useState(false);
    const [fieldLabels, setFieldLabels] = useState([]);
    const [fieldType, setFieldType] = useState([]);
    const [requiredfield, setRequiredField] = useState([]); // Define requiredfield state
    const [fieldId, setFieldId] = useState([]);
    const [fieldName, setFieldName] = useState([]);
    const [StaticName, setStaticName] = useState([]);
    const navigate = useNavigate(); // Get navigate object for navigation
    const location = useLocation();
    const [showNextStep, setShowNextStep] = useState(false); // Handles when "Next" is clicked
    const [prefixes, setPrefixes] = useState([]);
    const [state, setState] = useState([]);
    const [country, setCountry] = useState([]);
    const [regCat, setRegCat] = useState([]);
    const [workshop, setWorkshop] = useState([]);
    const [dayType, setDayType] = useState([]);
    const [custom, setCustom] = useState([]);
    const [customfield, setCustomfield] = useState([]);
    const [ticket, setTicket] = useState([]);
    const [addon, setAddon] = useState([]);
    const [isChecked, setIsChecked] = useState([]); // Initialize isChecked state
    const [username, setusername] = useState([]);
    const [Data, setformData] = useState([]);
    const [filteredTickets, setFilteredTickets] = useState([]); // State for filtered tickets
    const [addonticket, setAddonTicket] = useState(''); // Define state and setter
    const [paymentType, setPaymentType] = useState([]);
    const [paymentStatus, setPaymentStatus] = useState([]);
    const [regAmount, setRegAmount] = useState(0);
    const [regAddonAmount, setRegAddonAmount] = useState(0);
    const [processingAmount, setProcessingAmount] = useState(0);
    const [processingFee, setProcessingFee] = useState(0);
    const [totalPaidAmount, settotalPaidAmount] = useState(0);
    const [ticketAmount, setTicketAmount] = useState([]);
    const [addonAmount, setAddonAmount] = useState([]);
    const [ticketQuantities, setTicketQuantities] = useState({});
    const [category, setCategory] = useState(''); // Define state and setter
    const [filteredAddon, setFilteredAddon] = useState([]);
    const [selectCat, setSelectCat] = useState('');

    const [facultytype, setfacultytype] = useState([]);
    const [exhibitor, setExhibitor] = useState([]);

    const [paymentMode, setPaymentMode] = useState(); // Default to online
    const[gstfee, setgstfee] =useState();
    const[gstinclded, setgstinclded] =useState();
    const[gstamount, setgstamount] =useState();
    const[gstpercentage, setgstpercentage] =useState(18);
    const[processingfeein, setprocessingfeein] =useState();
    const[processinginclded, setprocessinginclded] =useState();
    const[currency, setcurrency] =useState();
    const[processingfeeornot, setprocessingfeeornot] =useState();
    

    const handlePaymentModeChange = (event) => {
        setPaymentMode(event.target.value);
    };

    // const { permissions } = useContext(PermissionsContext);

    const paymentTypeOptions = paymentType.map(type => ({
        value: type.paymenttype_id,
        label: type.paymenttype_name
    }));
    const paymentStatusOptions = paymentStatus.map(status => ({
        value: status.paymentstatus_id,
        label: status.paymentstatus_name
    }));

    // Step 1: Create a map of ticket amounts by ticket_id for quick lookup
    const ticketAmountMap = Object.fromEntries(
        ticketAmount.map(item => [item.ticket_id, item.tick_amount])
    );


    const [paymentDetails, setPaymentDetails] = useState({
        cardNumber: '',
        cardExpiry: '',
        cardCVV: '',
    });

    const empty = '';



    console.log("Field Data", data);
    console.log("Reg Cat", regCat);
    console.log("Addon Amount", addonAmount);
    console.log("Reg Amount", regAmount);
    console.log("Reg Addon Amount", regAddonAmount);
    console.log("Processing Fee", processingFee);
    console.log("Processing Fee", gstamount);


    const handleQuantityChange = (ticketId, quantity) => {
        setTicketQuantities(prev => ({
            ...prev,
            [ticketId]: quantity
        }));
    };

    useEffect(() => {
        fetchFields(); // Corrected function name
    }, []);

    useEffect(() => {
        fetchDropdown(); // Corrected function name
    }, []);

    // Extract Add User setting Permissions component
    // const AddUserPermissions = permissions['AddRegUser'];'
    useEffect(() => {
        fetchuser(); // Fetch workshop data when component mounts
    }, []);

    const fetchuser = async () => {
        try {
            const userId = localStorage.getItem('UserId');
            const token = getToken();
            const response = await axios.post(`${BackendAPI}/userdashboard/edituser`, { userId }, {
                headers: {
                    Authorization: `Bearer ${token}` // Include the token in the Authorization header
                }
            });
            console.log('Data from API:', response.data);
            setformData(response.data[0]); // Set workshop data to the first item in the response array
        } catch (error) {
            console.error('Error fetching workshop data:', error);
        }
    };

    const fetchFields = async () => {
        try {
            const token = getToken();
            const response = await axios.get(`${BackendAPI}/register/getConfirmField`, {
                headers: {
                    Authorization: `Bearer ${token}` // Include the token in the Authorization header
                }
            });
            const fieldsData = response.data.Fields;
            const requiredfield = fieldsData.map(field => field.cs_is_required);
            const fieldLabels = fieldsData.map(field => field.cs_field_label);
            const fieldType = fieldsData.map(field => field.field_type_name);
            const fieldId = fieldsData.map(field => field.cs_field_id);
            const fieldName = fieldsData.map(field => field.cs_field_name);
            const customfield = fieldsData.map(field => field.cs_iscustom);
            const staticname = fieldsData.map(field => field.cs_folder_name);



            console.log("Data:", fieldsData);
            console.log("Custom:", customfield);



            // setData(fieldsData);
            setFieldLabels(fieldLabels);
            setFieldType(fieldType);
            setFieldName(fieldName);
            setCustomfield(customfield);
            setRequiredField(requiredfield); // Set requiredfield state
            setFieldId(fieldId);
            setStaticName(staticname);
            setSettingData(response.data.settingData);
            setLoading(false);



            // console.log('Id:', fieldName);
        } catch (error) {
            console.error('Error fetching Fields:', error);
            setLoading(false);
        }
    };

    const handleCancel = () => {
        setModal(true);
    };

    const onSubmit = async (formData) => {
        const username = formData.cs_first_name;
        const userId = localStorage.getItem('UserId'); // Retrieve user ID from local storage

        try {
            // Filter out fields with empty values
            // const values = {};
            // for (const key in formData) {
            //     if (formData[key] !== '') {
            //         values[key] = formData[key].value || formData[key];
            //     }
            // }
            const data = new FormData();

            const paymentDetails = {};
            const paymentFields = [
                'total_paid_amount',
                'processing_fee',
                'conference_fees',
                'branch',
                'bank',
                'payment_date',
                'cheque_no',
                'payment_mode',
                'currency',
                'payment_type',

            ];

            // Prepare other fields
            const values = {};

            // Loop through formData to separate payment and other fields
            for (const key in formData) {
                if (Object.hasOwnProperty.call(formData, key)) {
                    // Add payment-related fields to paymentDetails
                    if (paymentFields.includes(key)) {
                        paymentDetails[key] = formData[key].value || formData[key];
                    } else {
                        // Add other fields to values
                        values[key] = formData[key].value || formData[key];
                    }
                }
            }

            const token = getToken();  // Assuming you have a functio


            // Append other form fields to FormData
            for (const key in values) {
                data.append(key, values[key]);
            }

            // Append 'cs_isconfirm' flag to FormData
            data.append('cs_isconfirm', 0); // Set flag to 0
            data.append('userid', userId); // Set flag to 0


            const response = await axios.post(`${BackendAPI}/register/addUser`, data, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'multipart/form-data'  // Set the content type to multipart/form-data
                }
            });






            if (response.data.success) {
                console.log('User created, proceeding to payment processing...');

                // Step 2: Gather payment data
                // const paymentData = {
                //     userId: response.data.userId, // Assuming the user ID is returned from the registration response
                //     amount: 1000, // Replace with actual amount
                //     currency: 'INR', // Replace with actual currency
                //     paymenttype_id: 7,
                //     conference_fees: 3000,
                //     productinfo: 'Conference Registration', // Required by PayU
                //     firstname: values.cs_first_name + values.cs_last_name, // Required by PayU
                //     email: values.cs_email, // Required by PayU
                //     phone: values.cs_phone, // Required by PayU
                if (paymentDetails.payment_type) {
                    paymentDetails.paymenttype_id = paymentDetails.payment_type.value || paymentDetails.payment_type;
                    delete paymentDetails.payment_type; // Remove 'payment_type' after mapping
                }
                // };
                console.log("paymentDetails.paymenttype_id", paymentDetails.paymenttype_id);

                const paymentData = {
                    userId: userId, // Assuming the user ID is returned from the registration response
                    amount: totalPaidAmount, // Replace with actual amount
                    currency: currency || 'INR', // Replace with actual currency
                    paymenttype_id: paymentDetails.paymenttype_id || 6, // From form
                    conference_fees: paymentDetails.conference_fees, // From form
                    productinfo: 'Conference Registration', // Required by PayU
                    firstname: values.cs_first_name + values.cs_last_name, // Required by PayU
                    email: values.cs_email, // Required by PayU
                    phone: values.cs_phone, // Required by PayU
                    cheque_no: paymentDetails.cheque_no, // From form
                    payment_date: paymentDetails.payment_date, // From form
                    bank: paymentDetails.bank, // From form
                    branch: paymentDetails.branch,// From form
                    processing_fee: paymentDetails.processing_fee,
                    payment_mode: paymentMode,
                };


                // Store payment details in cs_reg_temppayment
                const storePaymentResponse = await axios.post(`${BackendAPI}/register/storePayment`, paymentData, {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                });

                // Extract the temppaymentId from the response
                console.log("paymentDetails.payment_mode", paymentDetails.payment_mode);


                if (paymentMode === 'online') {
                    const temppaymentId = storePaymentResponse.data.temppaymentId;

                    if (!temppaymentId) {
                        throw new Error('Temppayment ID not received from storePayment API');
                    }

                    // Step 2: Prepare full paymentData including the temppaymentId
                    const fullPaymentData = {
                        ...paymentData,
                        temppaymentId, // Add the temppaymentId to payment data
                    };

                    // Step 3: Process payment by sending the updated paymentData to PayU
                    const paymentResponse = await axios.post(`${BackendAPI}/register/processPayment`, { paymentData: fullPaymentData });

                    console.log('Payment response:', paymentResponse.data);

                    // Handle the response, e.g., redirect to PayU URL if successful
                    if (paymentResponse.data.success) {
                        // Navigate to the PaymentPage component using 'useNavigate'
                        const paymentUrl = paymentResponse.data.paymentUrl;
                        const payUData = paymentResponse.data.payUData;

                        navigate(`${process.env.PUBLIC_URL}/confirm-payment/Consoft`, { state: { payUData, paymentUrl } }); // Use navigate instead of history.push
                    } else {
                        SweetAlert.fire({
                            title: 'Payment Failed!',
                            text: paymentResponse.data.message,
                            icon: 'error',
                            confirmButtonText: 'Okay',
                        });
                    }
                } else {
                    SweetAlert.fire({
                        title: 'Payment Successful!',
                        text: `amount of ₹${paymentDetails.total_paid_amount} has been successfully processed.`,
                        icon: 'success',
                        confirmButtonText: 'OK'
                    }).then(() => {
                        navigate(`${process.env.PUBLIC_URL}/user-dashboard/Consoft`);
                    });
                }
            }
        } catch (error) {
            console.error('Error:', error.message);
            SweetAlert.fire({
                title: 'Error!',
                text: 'An error occurred during the registration process.',
                icon: 'error',
                confirmButtonText: 'Okay',
            });
        }
    };

    const fetchDropdown = async () => {
        try {
            const token = getToken();
            const response = await axios.get(`${BackendAPI}/register/getDropdownData`, {
                headers: {
                    Authorization: `Bearer ${token}` // Include the token in the Authorization header
                }
            });

            setData(response.data);
            console.log("KHUSH",response.data);
            setLoading(false);

            // Extracting the data from the response
            const fetchprefixes = response.data.prefix;
            const fetchstate = response.data.states;
            const fetchcountry = response.data.country;
            const fetchregcat = response.data.regCategory;
            const fetchworkshop = response.data.workshop;
            const fetchdaytype = response.data.dayType;
            const fetchCutomData = response.data.custom;
            const fetchTicket = response.data.ticket;
            const fetchAddon = response.data.addon;
            const fetchPaymentType = response.data.paymentType;
            const fetchPaymentStatus = response.data.paymentStatus;
            const fetchTicketAmount = response.data.ticketAmount;
            const fetchAddonAmount = response.data.addonAmount;
            const fetchProcessingFee = response.data.processingFees[0];
            const fetchfacultytype = response.data.facultytype;
            const fetchexhibitor = response.data.exhibitor;
            const fetchcurrency = response.data.currency[0];
            const fetchgstfee = response.data.gstfee[0];
            const fetchgstinclded = response.data.gstinclded[0];
            const fetchprocessingfeein = response.data.processingfeein[0];
            const fetchprocessinginclded = response.data.processinginclded[0];
            const fetchprocessingfeeornot = response.data.processingfeeornot[0];
            const fetchgstamount = response.data.gstamount[0];


            console.log("Fetched fetchregcat Amount", fetchregcat);


            // Get the current date
            const currentDate = new Date();

            // Filter ticket amounts based on the current date
            const filteredTicketAmount = fetchTicketAmount.filter(ticket => {
                const startDate = new Date(ticket.tick_duration_start_date);
                const endDate = new Date(ticket.tick_duration_till_date);
                return startDate <= currentDate && endDate >= currentDate;
            });

            // Log filtered ticket amounts
            console.log("Filtered Ticket Amount", fetchgstamount.cs_value);

            setTicket(fetchTicket);

            // Set other states
            setPrefixes(fetchprefixes);
            setState(fetchstate);
            setCountry(fetchcountry);
            setRegCat(fetchregcat);
            setWorkshop(fetchworkshop);
            setDayType(fetchdaytype);
            setCustom(fetchCutomData);
            setAddon(fetchAddon);
            setPaymentType(fetchPaymentType);
            setPaymentStatus(fetchPaymentStatus);
            setTicketAmount(fetchTicketAmount); // Set the filtered ticket amounts
            setAddonAmount(fetchAddonAmount);
            setProcessingFee(fetchProcessingFee);
            setfacultytype(fetchfacultytype);
            setExhibitor(fetchexhibitor);
            setcurrency(fetchcurrency.cs_value);
            setgstfee(fetchgstfee.cs_value);
            setgstinclded(fetchgstinclded.cs_value);
            setprocessingfeein(fetchprocessingfeein.cs_value);
            setprocessinginclded(fetchprocessinginclded.cs_value);
            setprocessingfeeornot(fetchprocessingfeeornot.cs_value);
            setgstpercentage(fetchgstamount.cs_value);




            console.log("gstamount",gstamount);

        } catch (error) {
            console.error('Error fetching dropdown data:', error);
            setLoading(false);
        }
    };



    const handleNavigation = () => {
        navigate(`${process.env.PUBLIC_URL}/User-listing/Consoft`);
    };



    // useEffect(() => {
    //     const filterTickets = () => {
    //         if (category) {
    //             const parsedCategory = JSON.parse(category); // Parse the category

    //             console.log("Parsed Cat", parsedCategory);

    //             const filtered = ticket.filter(ticket => {
    //                 // Check if ticket_category is valid
    //                 if (ticket.ticket_category && ticket.ticket_category !== 'null') {
    //                     try {
    //                         const ticketCategories = JSON.parse(ticket.ticket_category); // Parse ticket_category
    //                         return Array.isArray(ticketCategories) && ticketCategories.includes(parsedCategory); // Ensure it's an array and includes the category
    //                     } catch (e) {
    //                         console.error("Error parsing ticket category:", e);
    //                         return false; // Return false if parsing fails
    //                     }
    //                 }
    //                 return false; // If ticket_category is null or invalid, return false
    //             });
    //             console.log("Filtered", filtered);
    //             setFilteredTickets(filtered); // Set filtered tickets
    //         } else {
    //             setFilteredTickets([]); // If no category, show all tickets
    //         }
    //     };

    //     const filterAddon = () => {
    //         if (addonticket) {
    //             const parsedAddon = JSON.parse(addonticket); // Parse the selected addon ticket
    //             console.log("Addon:", parsedAddon);

    //             // Find the matching ticket based on the addon ticket ID
    //             const matchedTicket = ticketAmount.find(ticketItem => ticketItem.ticket_id === parsedAddon);
    //             console.log("Matched", matchedTicket);
    //             if (matchedTicket) {
    //                 const amount = parseFloat(matchedTicket.tick_amount); // Convert tick_amount to a number
    //                 setRegAmount(amount); // Store the ticket amount in regAmount

    //                 // Calculate the processing fee based on the percentage
    //                 // const currentAmount = amount; // No parseFloat needed if regAmount is already a number
    //                 // const processingPercentage = processingFee.cs_value; // Should be a number
    //                 // const processingFeeAmount = (amount * processingPercentage) / 100; // Correct calculation without parseFloat

    //                 // setProcessingAmount(processingFeeAmount); // Set the calculated processing fee
    //                 // settotalPaidAmount(currentAmount + processingFeeAmount);
    //                 if (processingfeeornot === 'Yes') {
    //                     const processingAmount = 
    //                         processingfeein === 'Percentage'
    //                             ? (amount * parseFloat(processingFee.cs_value)) / 100
    //                             : parseFloat(processingFee.cs_value);
    
    //                     // Check if fee is included or excluded
    //                     const totalAmount = 
    //                         processinginclded === 'Exclude'
    //                             ? amount + processingAmount
    //                             : amount;
    
    //                     setProcessingAmount(processingAmount);
    //                     settotalPaidAmount(totalAmount);
    
    //                     console.log("Matched Ticket Amount:", amount);
    //                     console.log("Processing Fee Amount:", processingAmount);
    //                 } else {
    //                     // If no processing fee, just set the total to the ticket amount
    //                     setProcessingAmount(0);
    //                     // settotalPaidAmount(amount);
    //                 }
    //                 let gstAmount = 0;
    //                 if (gstfee === 'Yes') {
    //                     gstAmount = (amount * parseFloat(gstamount)) / 100;
    //                     if (gstinclded === 'Exclude') {
    //                         totalAmount += gstAmount; // Add GST to total if excluded
    //                     }
    //                 }
    
    //                 setgstamount(gstAmount);
    //                 settotalPaidAmount(totalAmount);

    //                 console.log("Matched Ticket Amount:", amount);
    //                 console.log("Processing Fee Amount:", processingAmount);
    //                 console.log("GST Amount:", gstAmount);
    //                 console.log("Total Amount with GST:", totalAmount);
    //                 // console.log("Processing Fee Amount:", processingFeeAmount);
    //             } else {
    //                 setRegAmount(0); // Reset if no matching ticket is found
    //                 setProcessingAmount(0); // Reset processing amount as well
    //                 settotalPaidAmount(0);
    //                 setgstamount(0); // Reset GST amount
    //             }


    //             const filtered = addon.filter(addon => {
    //                 if (addon.addon_ticket_ids && addon.addon_ticket_ids !== 'null') {
    //                     try {
    //                         const parsedTicketIds = JSON.parse(addon.addon_ticket_ids);
    //                         console.log("Parsed Ticket Addon IDs:", parsedTicketIds);
    //                         return Array.isArray(parsedTicketIds) && parsedTicketIds.includes(parsedAddon);
    //                     } catch (e) {
    //                         console.error("Error parsing addon ticket IDs:", e);
    //                         return false; // Return false if parsing fails
    //                     }
    //                 }
    //                 return false; // If addon_ticket_ids is null or invalid, return false 
    //             });

    //             setFilteredAddon(filtered); // Set the filtered addons
    //         } else {
    //             setFilteredAddon([]); // If no category, reset the filtered addons
    //             setRegAmount(0); // Reset regAmount if no addonticket
    //             setProcessingAmount(0);
    //             settotalPaidAmount(0);
    //             setgstamount(0); 

    //         }
    //     };

    //     // Call the filter functions
    //     filterTickets(); // Call the filter function
    //     filterAddon(); // Call the filter function
    // }, [category, addonticket, gstfee, gstinclded, gstamount]); // Run effect when category or tickets change


    useEffect(() => {
        const filterTickets = () => {
            if (category) {
                const parsedCategory = JSON.parse(category); // Parse the category
                console.log("Parsed Cat", parsedCategory);
    
                const filtered = ticket.filter(ticket => {
                    if (ticket.ticket_category && ticket.ticket_category !== 'null') {
                        try {
                            const ticketCategories = JSON.parse(ticket.ticket_category); // Parse ticket_category
                            return Array.isArray(ticketCategories) && ticketCategories.includes(parsedCategory); 
                        } catch (e) {
                            console.error("Error parsing ticket category:", e);
                            return false;
                        }
                    }
                    return false;
                });
                console.log("Filtered", filtered);
                setFilteredTickets(filtered); 
            } else {
                setFilteredTickets([]);
            }
        };
    
        const filterAddon = () => {
            if (addonticket) {
                const parsedAddon = JSON.parse(addonticket); 
                console.log("Addon:", parsedAddon);
        
                const matchedTicket = ticketAmount.find(ticketItem => ticketItem.ticket_id === parsedAddon);
                console.log("Matched", matchedTicket);
        
                if (matchedTicket) {
                    const amount = parseFloat(matchedTicket.tick_amount); 
                    setRegAmount(amount);
        
                    let gstAmount = 0;
                    let processingAmount = 0;
                    let totalAmount = amount;
        
                    // Calculate GST first
                    if (gstfee === 'Yes') {
                        gstAmount = (amount * parseFloat(gstpercentage)) / 100;
                        console.log("GST Amount:", gstAmount);
        
                        if (gstinclded === 'No') {
                            totalAmount += gstAmount; // Add GST to total if excluded
                        }
                    }
                    
                    setgstamount(gstAmount); // Store the calculated GST amount
        
                    // Now calculate the processing fee on the new total (amount + GST)
                    if (processingfeeornot === 'Yes') {
                        processingAmount = 
                            processingfeein === 'Percentage'
                                ? (totalAmount * parseFloat(processingFee.cs_value)) / 100
                                : parseFloat(processingFee.cs_value);
        
                        totalAmount = 
                            processinginclded === 'Exclude'
                                ? totalAmount + processingAmount // Add processing fee if excluded
                                : totalAmount;
                        
                        setProcessingAmount(processingAmount);
                    } else {
                        setProcessingAmount(0);
                    }
        
                    settotalPaidAmount(totalAmount);
        
                    console.log("Matched Ticket Amount:", amount);
                    console.log("GST Amount:", gstAmount);
                    console.log("Processing Fee Amount:", processingAmount);
                    console.log("Total Amount with GST and Processing Fee:", totalAmount);
                } else {
                    setRegAmount(0); 
                    setProcessingAmount(0); 
                    settotalPaidAmount(0);
                    setgstamount(0); 
                }
        
                const filtered = addon.filter(addon => {
                    if (addon.addon_ticket_ids && addon.addon_ticket_ids !== 'null') {
                        try {
                            const parsedTicketIds = JSON.parse(addon.addon_ticket_ids);
                            console.log("Parsed Ticket Addon IDs:", parsedTicketIds);
                            return Array.isArray(parsedTicketIds) && parsedTicketIds.includes(parsedAddon);
                        } catch (e) {
                            console.error("Error parsing addon ticket IDs:", e);
                            return false;
                        }
                    }
                    return false;
                });
        
                setFilteredAddon(filtered); 
            } else {
                setFilteredAddon([]);
                setRegAmount(0);
                setProcessingAmount(0);
                settotalPaidAmount(0);
                setgstamount(0); 
            }
        };
        
    
        filterTickets(); 
        filterAddon(); 
    }, [category, addonticket, gstfee, gstinclded, gstamount]);
    

    console.log("Addon Ticket", addonticket);
    console.log("Ticket Amount", ticketAmount);

    const handleNextClick = () => {
        setShowNextStep(true); // Move to the third row and show Submit/Cancel buttons
    };

    const handleBackClick = () => {
        setShowNextStep(false); // Go back to the first and second rows
    };



    return (
        <Fragment>
            <Breadcrumbs parentClickHandler={handleNavigation} mainTitle={
                <>
                    Create Conference User
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
            } parent="Manage User" title="Create User" />
            <Container fluid={true}>

                <Row>
                    <Col sm={!showNextStep ? "12" : "8"}>
                        <Card>
                            <CardHeader className="d-flex justify-content-between align-items-center flex-column flex-md-row">
                                <div className="mb-2 mb-md-0">
                                    <h5 className="mb-2 text-start">{settingdata.event_name}</h5> {/* Corrected closing tag */}
                                    <small className="mb-2 text-start">
                                        {moment(settingdata.event_start_date).format('MMM DD, YYYY')}
                                    </small>
                                </div>


                            </CardHeader>
                            <CardBody>
                                <Form onSubmit={onSubmit}>
                                    {({ handleSubmit }) => (
                                        <form className="needs-validation" noValidate="" onSubmit={handleSubmit}>

                                            {(!showNextStep) && (
                                                <Row>
                                                    <Col sm="12" className="mb-3">

                                                        <Field
                                                            name={`cs_reg_category`}
                                                            initialValue={Data?.cs_reg_cat_id || ''} // Use optional chaining to avoid errors
                                                            validate={option}
                                                        >
                                                            {({ input, meta }) => {
                                                                const selectedOption = regCat.find(option => option.cs_reg_cat_id === Data?.cs_reg_cat_id);
                                                                let options = regCat.map(pref => ({
                                                                    value: pref.cs_reg_cat_id,
                                                                    label: pref.cs_reg_category,
                                                                }));

                                                                options = [{ value: '', label: 'Select' }, ...options];

                                                                // Track the selected value to conditionally render the next field
                                                                setSelectCat(input.value);
                                                                setCategory(input.value);

                                                                return (
                                                                    <div>
                                                                        <Label className='form-label' for={`displayname`}>
                                                                            <strong>Registration Category</strong>
                                                                            <span className="text-danger"> *</span>
                                                                        </Label>
                                                                        <Select
                                                                            {...input}
                                                                            options={options}
                                                                            placeholder={'Select Category'}
                                                                            isSearchable={true}
                                                                            onChange={(selectedOption) => {
                                                                                input.onChange(selectedOption ? selectedOption.value : '');
                                                                            }}
                                                                            onBlur={input.onBlur}
                                                                            classNamePrefix="react-select"
                                                                            value={options.find(option => option.value === input.value) || null}
                                                                        />
                                                                        {meta.error && meta.touched && <p className='d-block text-danger'>{meta.error}</p>}

                                                                    </div>
                                                                );
                                                            }}
                                                        </Field>

                                                    </Col>

                                                    <Col sm="12" className="mb-3">


                                                        {/* <Field
                                                            name={`cs_ticket`} // Use dynamic field name
                                                            initialValue={Data?.cs_ticket || ''}
                                                            validate={option}                                                                        >
                                                            {({ input, meta }) => {
                                                                const selectedOption = filteredTickets.find(option => option.ticket_id === parseInt(Data?.cs_ticket));


                                                                let options = filteredTickets.map(pref => ({
                                                                    value: pref.ticket_id,
                                                                    label: pref.ticket_title,
                                                                }));

                                                                    options = [
                                                                        { value: '', label: 'Select' },
                                                                        ...options
                                                                    ];
                                                        

                                                                console.log("Selected  Registration Option:", selectedOption);
                                                                console.log("Registration Options:", options);

                                                                return (
                                                                    <div>
                                                                        <Label className='form-label' for={`displaynameticket`}>
                                                                            <strong>Ticket</strong> <span className="text-danger"> *</span>
                                                                        </Label>
                                                                        <Select
                                                                            {...input}
                                                                            options={options}
                                                                            placeholder={`Select Ticket`}
                                                                            isSearchable={true}
                                                                            onChange={(selectedOption) => {
                                                                                console.log("Selected Option:", selectedOption);
                                                                                input.onChange(selectedOption ? selectedOption.value : '');
                                                                                setAddonTicket(selectedOption.value);
                                                                            }}

                                                                            onBlur={input.onBlur}
                                                                            classNamePrefix="react-select"
                                                                            value={options.find(option => option.value === parseInt(input.value)) || null}
                                                                        />
                                                                        {meta.error && meta.touched && <p className='d-block text-danger'>{meta.error}</p>}
                                                                    </div>
                                                                );
                                                            }}
                                                        </Field> */}

                                                        <Field
                                                            name={`cs_ticket`} // Use dynamic field name
                                                            initialValue={Data?.cs_ticket || ''}
                                                            validate={option}
                                                        >
                                                            {({ input, meta }) => {
                                                                const selectedOption = filteredTickets.find(option => option.ticket_id === parseInt(Data?.cs_ticket));

                                                                let options = filteredTickets.map(pref => ({
                                                                    value: pref.ticket_id,
                                                                    label: pref.ticket_title,
                                                                }));

                                                                options = [
                                                                    { value: '', label: 'Select' },
                                                                    ...options
                                                                ];

                                                                console.log("Selected  Registration Option:", selectedOption);
                                                                console.log("Registration Options:", options);

                                                                return (
                                                                    <div>
                                                                        <Label className="form-label">
                                                                            <strong>Ticket</strong> <span className="text-danger"> *</span>
                                                                        </Label>
                                                                        <Table hover>
                                                                            <tbody>
                                                                                {filteredTickets.length === 0 ? (
                                                                                    <tr>
                                                                                        <td colSpan="2" className="text-center">
                                                                                            No tickets available for selected category
                                                                                        </td>
                                                                                    </tr>
                                                                                ) : (
                                                                                    filteredTickets.map(ticket => (
                                                                                        <tr
                                                                                            key={ticket.ticket_id}
                                                                                            className={parseInt(input.value) === ticket.ticket_id ? 'table-active' : ''}
                                                                                        >
                                                                                            <td className='text-start'>
                                                                                                <div>
                                                                                                    <strong>{ticket.ticket_title}</strong>
                                                                                                </div>
                                                                                                <div>
                                                                                                    Price: ${ticketAmountMap[ticket.ticket_id] || 'N/A'}
                                                                                                </div>
                                                                                            </td>
                                                                                            <td className='text-end'>
                                                                                                <Button
                                                                                                    color="primary"
                                                                                                    onClick={() => {
                                                                                                        // If the same ticket is selected, deselect it
                                                                                                        const newTicketId = parseInt(input.value) === ticket.ticket_id ? '' : ticket.ticket_id;
                                                                                                        input.onChange(newTicketId);
                                                                                                        setAddonTicket(newTicketId);
                                                                                                    }}
                                                                                                    disabled={false} // Always enable the button
                                                                                                >
                                                                                                    {parseInt(input.value) === ticket.ticket_id ? 'Deselect' : 'Select'}
                                                                                                </Button>
                                                                                            </td>
                                                                                        </tr>
                                                                                    ))
                                                                                )}
                                                                            </tbody>
                                                                        </Table>
                                                                        {meta.error && meta.touched && <p className="text-danger">{meta.error}</p>}
                                                                    </div>
                                                                );
                                                            }}
                                                        </Field>



                                                    </Col>
                                                </Row>


                                            )}

                                            {(showNextStep) && (

                                                <Row className="d-flex flex-wrap">
                                                    {fieldLabels.map((label, index) => {
                                                        const isFieldRequired = requiredfield[index] === '1'; // Use string comparison for clarity
                                                        return (
                                                            <Col
                                                                key={index}
                                                                xs={12} // Full width for small devices
                                                                sm={6}  // Half width for medium devices
                                                                md={4}  // One-third width for larger devices
                                                                className="mb-3"
                                                            >
                                                                {/* Render the fields */}
                                                                {fieldType[index] === 'Dropdown' && fieldLabels[index] === 'Title' && (
                                                                    <Field
                                                                        name={`${fieldName[index]}`}
                                                                        initialValue={Data?.cs_title || ''} // Use optional chaining to avoid errors
                                                                        validate={isFieldRequired ? composeValidators(option) : (value) => composeValidators()(value)}
                                                                    >
                                                                        {({ input, meta }) => {
                                                                            const selectedOption = prefixes.find(option => option.cs_prefix === Data?.cs_title);
                                                                            let options = prefixes.map(pref => ({
                                                                                value: pref.cs_prefix,
                                                                                label: pref.cs_prefix,
                                                                            }));

                                                                            if (!isFieldRequired) {
                                                                                options = [{ value: '', label: 'Select' }, ...options];
                                                                            }

                                                                            return (
                                                                                <div>
                                                                                    <Label className='form-label' for={`displayname${index}`}>
                                                                                        <strong>{label}</strong>{isFieldRequired && <span className="text-danger"> *</span>}
                                                                                    </Label>
                                                                                    <Select
                                                                                        {...input}
                                                                                        options={options}
                                                                                        placeholder={`Select ${label}`}
                                                                                        isSearchable={true}
                                                                                        onChange={(selectedOption) => {
                                                                                            input.onChange(selectedOption ? selectedOption.value : '');
                                                                                        }}
                                                                                        onBlur={input.onBlur}
                                                                                        classNamePrefix="react-select"
                                                                                        value={options.find(option => option.value === input.value) || null}
                                                                                    />
                                                                                    {meta.error && meta.touched && <p className='d-block text-danger'>{meta.error}</p>}
                                                                                </div>
                                                                            );
                                                                        }}
                                                                    </Field>
                                                                )}

                                                                {
                                                                    fieldType[index] === 'Date' && (
                                                                        <Field
                                                                            name={`${fieldName[index]}`} // Use dynamic field name
                                                                            initialValue={Data?.[fieldName[index]]
                                                                                ? moment(Data[fieldName[index]]).isValid()
                                                                                    ? moment(Data[fieldName[index]]).format('YYYY-MM-DD')
                                                                                    : Data[fieldName[index]]
                                                                                : ''}
                                                                            validate={requiredfield[index] === '1' ? composeValidators(expiryDate) : (value) => composeValidators()(value)}
                                                                        >
                                                                            {({ input, meta }) => (
                                                                                <div>
                                                                                    <Label className='form-label' for={`displayname${index}`}>
                                                                                        <strong>{label}</strong>{requiredfield[index] === '1' && <span className="text-danger"> *</span>}
                                                                                    </Label>
                                                                                    <input
                                                                                        {...input}
                                                                                        className="form-control"
                                                                                        id={`displayname${index}`}
                                                                                        type="date"
                                                                                        placeholder={`Enter ${label}`}
                                                                                        // min={minDate}
                                                                                        max="9999-12-31"
                                                                                    />
                                                                                    {meta.error && meta.touched && <p className='d-block text-danger'>{meta.error}</p>}
                                                                                </div>
                                                                            )}
                                                                        </Field>
                                                                    )
                                                                }





                                                                {
                                                                    fieldType[index] === 'Dropdown' && fieldLabels[index] === 'State' && (
                                                                        <Field
                                                                            name={`${fieldName[index]}`} // Use dynamic field name
                                                                            validate={requiredfield[index] === '1' ? composeValidators(option) : (value) => composeValidators()(value)}
                                                                        >
                                                                            {({ input, meta }) => (
                                                                                <div>
                                                                                    <Label className='form-label' for={`displayname${index}`}>
                                                                                        <strong>{label}</strong>{requiredfield[index] === '1' && <span className="text-danger"> *</span>}
                                                                                    </Label>
                                                                                    <Select
                                                                                        {...input}
                                                                                        options={requiredfield[index] === '1' ?
                                                                                            state.map(pref => ({ value: pref.cs_state_name, label: pref.cs_state_name })) :
                                                                                            [
                                                                                                { value: '', label: 'Select' }, // Adding the "Select" option as the first item
                                                                                                ...state.map(pref => ({ value: pref.cs_state_name, label: pref.cs_state_name }))
                                                                                            ]
                                                                                        }

                                                                                        // options={[{ value: '', label: 'Select' }, // Adding the "Select" option as the first item
                                                                                        // ...state.map(pref => ({ value: pref.cs_state_name, label: pref.cs_state_name }))]}
                                                                                        placeholder={`Select ${label}`}
                                                                                        isSearchable={true}
                                                                                        onChange={(value) => input.onChange(value)}
                                                                                        onBlur={input.onBlur}
                                                                                        classNamePrefix="react-select"
                                                                                    />
                                                                                    {meta.error && meta.touched && <p className='d-block text-danger'>{meta.error}</p>}
                                                                                </div>
                                                                            )}
                                                                        </Field>
                                                                    )
                                                                }

                                                                {
                                                                    fieldType[index] === 'Dropdown' && fieldLabels[index] === 'Country' && (
                                                                        <Field
                                                                            name={`${fieldName[index]}`} // Use dynamic field name
                                                                            validate={requiredfield[index] === '1' ? composeValidators(option) : (value) => composeValidators()(value)}
                                                                        >
                                                                            {({ input, meta }) => (
                                                                                <div>
                                                                                    <Label className='form-label' for={`displayname${index}`}>
                                                                                        <strong>{label}</strong>{requiredfield[index] === '1' && <span className="text-danger"> *</span>}
                                                                                    </Label>
                                                                                    <Select
                                                                                        {...input}
                                                                                        options={requiredfield[index] === '1' ?
                                                                                            country.map(pref => ({ value: pref.cs_country, label: pref.cs_country })) :
                                                                                            [
                                                                                                { value: '', label: 'Select' }, // Adding the "Select" option as the first item
                                                                                                ...country.map(pref => ({ value: pref.cs_country, label: pref.cs_country }))
                                                                                            ]
                                                                                        }

                                                                                        // options={[{ value: '', label: 'Select' }, // Adding the "Select" option as the first item
                                                                                        // ...country.map(pref => ({ value: pref.cs_country, label: pref.cs_country }))]}
                                                                                        placeholder={`Select ${label}`}
                                                                                        isSearchable={true}
                                                                                        onChange={(value) => input.onChange(value)}
                                                                                        onBlur={input.onBlur}
                                                                                        classNamePrefix="react-select"
                                                                                    />
                                                                                    {meta.error && meta.touched && <p className='d-block text-danger'>{meta.error}</p>}
                                                                                </div>
                                                                            )}
                                                                        </Field>
                                                                    )
                                                                }


                                                                {/* Ticket
                                                            {
                                                                fieldType[index] === 'Dropdown' && fieldLabels[index] === 'Package' && (
                                                                    <Field
                                                                        name={`${fieldName[index]}`} // Use dynamic field name

                                                                        validate={requiredfield[index] === '1' ? composeValidators(option) : (value) => composeValidators()(value)}
                                                                    >
                                                                        {({ input, meta }) => {
                                                                            const selectedOption = filteredTickets.find(option => option.package_id === parseInt(Data?.package_option));


                                                                            let options = filteredTickets.map(pref => ({
                                                                                value: pref.package_id,
                                                                                label: `${pref.package_name} - ${pref.package_cost} Rs`,
                                                                            }));

                                                                            // Conditionally add the "Select" option based on requiredfield[index]
                                                                            if (requiredfield[index] !== '1') {
                                                                                options = [
                                                                                    { value: '', label: 'Select' },
                                                                                    ...options
                                                                                ];
                                                                            }

                                                                            console.log("Selected  Registration Option:", selectedOption);
                                                                            console.log("Registration Options:", options);

                                                                            return (
                                                                                <div>
                                                                                    <Label className='form-label' for={`displayname${index}`}>
                                                                                        <strong>{label}</strong>{requiredfield[index] === '1' && <span className="text-danger"> *</span>}
                                                                                    </Label>
                                                                                    <Select
                                                                                        {...input}
                                                                                        options={options}
                                                                                        placeholder={`Select ${label}`}
                                                                                        isSearchable={true}
                                                                                        onChange={(selectedOption) => {
                                                                                            console.log("Selected Option:", selectedOption);
                                                                                            input.onChange(selectedOption ? selectedOption.value : '');
                                                                                            setAddonTicket(selectedOption.value);
                                                                                        }}

                                                                                        onBlur={input.onBlur}
                                                                                        classNamePrefix="react-select"
                                                                                        value={options.find(option => option.value === parseInt(input.value)) || null}
                                                                                    />
                                                                                    {meta.error && meta.touched && <p className='d-block text-danger'>{meta.error}</p>}
                                                                                </div>
                                                                            );
                                                                        }}
                                                                    </Field>
                                                                )
                                                            } */}


                                                                {
                                                                    fieldType[index] === 'Dropdown' && fieldLabels[index] === 'Registration Category' && (
                                                                        <Field
                                                                            name={`${fieldName[index]}`}
                                                                            initialValue={Data?.cs_reg_cat_id || ''} // Use optional chaining to avoid errors
                                                                            validate={isFieldRequired ? composeValidators(option) : (value) => composeValidators()(value)}
                                                                        >
                                                                            {({ input, meta }) => {
                                                                                const selectedOption = regCat.find(option => option.cs_reg_cat_id === Data?.cs_reg_cat_id);
                                                                                let options = regCat.map(pref => ({
                                                                                    value: pref.cs_reg_cat_id,
                                                                                    label: pref.cs_reg_category,
                                                                                }));

                                                                                if (!isFieldRequired) {
                                                                                    options = [{ value: '', label: 'Select' }, ...options];
                                                                                }

                                                                                // Track the selected value to conditionally render the next field
                                                                                setSelectCat(input.value);
                                                                                setCategory(input.value);

                                                                                return (
                                                                                    <div>
                                                                                        <Label className='form-label' for={`displayname${index}`}>
                                                                                            <strong>{label}</strong>
                                                                                            {isFieldRequired && <span className="text-danger"> *</span>}
                                                                                        </Label>
                                                                                        <Select
                                                                                            {...input}
                                                                                            options={options}
                                                                                            placeholder={`Select ${label}`}
                                                                                            isSearchable={true}
                                                                                            onChange={(selectedOption) => {
                                                                                                input.onChange(selectedOption ? selectedOption.value : '');
                                                                                            }}
                                                                                            onBlur={input.onBlur}
                                                                                            classNamePrefix="react-select"
                                                                                            value={options.find(option => option.value === input.value) || null}
                                                                                        />
                                                                                        {meta.error && meta.touched && <p className='d-block text-danger'>{meta.error}</p>}

                                                                                    </div>
                                                                                );
                                                                            }}
                                                                        </Field>

                                                                    )


                                                                }



                                                                {/* Ticket */}
                                                                {
                                                                    fieldType[index] === 'Dropdown' && fieldLabels[index] === 'Ticket' && (
                                                                        <Field
                                                                            name={`${fieldName[index]}`} // Use dynamic field name
                                                                            initialValue={Data?.cs_ticket || ''}
                                                                            validate={requiredfield[index] === '1' ? composeValidators(option) : (value) => composeValidators()(value)}
                                                                        >
                                                                            {({ input, meta }) => {
                                                                                const selectedOption = filteredTickets.find(option => option.ticket_id === parseInt(Data?.cs_ticket));


                                                                                let options = filteredTickets.map(pref => ({
                                                                                    value: pref.ticket_id,
                                                                                    label: pref.ticket_title,
                                                                                }));

                                                                                // Conditionally add the "Select" option based on requiredfield[index]
                                                                                if (requiredfield[index] !== '1') {
                                                                                    options = [
                                                                                        { value: '', label: 'Select' },
                                                                                        ...options
                                                                                    ];
                                                                                }

                                                                                console.log("Selected  Registration Option:", selectedOption);
                                                                                console.log("Registration Options:", options);

                                                                                return (
                                                                                    <div>
                                                                                        <Label className='form-label' for={`displayname${index}`}>
                                                                                            <strong>{label}</strong>{requiredfield[index] === '1' && <span className="text-danger"> *</span>}
                                                                                        </Label>
                                                                                        <Select
                                                                                            {...input}
                                                                                            options={options}
                                                                                            placeholder={`Select ${label}`}
                                                                                            isSearchable={true}
                                                                                            onChange={(selectedOption) => {
                                                                                                console.log("Selected Option:", selectedOption);
                                                                                                input.onChange(selectedOption ? selectedOption.value : '');
                                                                                                setAddonTicket(selectedOption.value);
                                                                                            }}

                                                                                            onBlur={input.onBlur}
                                                                                            classNamePrefix="react-select"
                                                                                            value={options.find(option => option.value === parseInt(input.value)) || null}
                                                                                        />
                                                                                        {meta.error && meta.touched && <p className='d-block text-danger'>{meta.error}</p>}
                                                                                    </div>
                                                                                );
                                                                            }}
                                                                        </Field>
                                                                    )
                                                                }


                                                                {
                                                                    fieldType[index] === 'Dropdown' && fieldLabels[index] === 'Addons' && (
                                                                        <Field
                                                                            name={`${fieldName[index]}`} // Use dynamic field name
                                                                            initialValue={Data?.cs_addons || ''}
                                                                            validate={requiredfield[index] === '1' ? composeValidators(option) : (value) => composeValidators()(value)}
                                                                        >
                                                                            {({ input, meta }) => {
                                                                                const selectedOption = filteredAddon.find(option => option.addon_id === parseInt(Data?.cs_addons));

                                                                                let options = filteredAddon.map(pref => ({
                                                                                    value: pref.addon_id,
                                                                                    label: pref.addon_title,
                                                                                }));

                                                                                // Conditionally add the "Select" option based on requiredfield[index]
                                                                                if (requiredfield[index] !== '1') {
                                                                                    options = [
                                                                                        { value: '', label: 'Select' },
                                                                                        ...options
                                                                                    ];
                                                                                }

                                                                                console.log("Selected addon Option:", selectedOption);
                                                                                console.log("Registration Options:", options);

                                                                                return (
                                                                                    <div>
                                                                                        <Label className='form-label' htmlFor={`displayname${index}`}>
                                                                                            <strong>{label}</strong>{requiredfield[index] === '1' && <span className="text-danger"> *</span>}
                                                                                        </Label>
                                                                                        <Select
                                                                                            {...input}
                                                                                            options={options}
                                                                                            placeholder={`Select ${label}`}
                                                                                            isSearchable={true}
                                                                                            onChange={(selectedOption) => {
                                                                                                console.log("Selected Option:", selectedOption);
                                                                                                input.onChange(selectedOption ? selectedOption.value : '');

                                                                                                // Find the selected addon amount
                                                                                                const matchedAddon = addonAmount.find(addon => addon.addon_id === selectedOption.value);
                                                                                                if (matchedAddon) {
                                                                                                    const currentAmount = (regAmount);
                                                                                                    const addonAmountToAdd = parseFloat(matchedAddon.addon_amount);
                                                                                                    const processingPercentage = processingFee.cs_value;
                                                                                                    const processingFeeAmount = (currentAmount * processingPercentage) / 100; // Calculate processing fee

                                                                                                    setRegAddonAmount(matchedAddon.addon_amount); // Set the amount in regAmount
                                                                                                    setRegAmount(currentAmount + addonAmountToAdd);
                                                                                                    setProcessingAmount(processingFeeAmount);
                                                                                                    settotalPaidAmount(currentAmount + addonAmountToAdd + processingFeeAmount)
                                                                                                } else {
                                                                                                    setRegAddonAmount(0); // Reset if no matching addon amount is found
                                                                                                    // settotalPaidAmount(0);
                                                                                                    // setRegAmount()

                                                                                                }
                                                                                            }}
                                                                                            onBlur={input.onBlur}
                                                                                            classNamePrefix="react-select"
                                                                                            value={options.find(option => option.value === parseInt(input.value)) || null}
                                                                                        />
                                                                                        {meta.error && meta.touched && <p className='d-block text-danger'>{meta.error}</p>}
                                                                                    </div>
                                                                                );
                                                                            }}
                                                                        </Field>


                                                                    )
                                                                }

                                                                {
                                                                    fieldType[index] === 'Dropdown' && (customfield[index] == 1) && (
                                                                        <Field
                                                                            name={`${fieldName[index]}`} // Use dynamic field name
                                                                            validate={requiredfield[index] === '1' ? composeValidators(option) : (value) => composeValidators()(value)}
                                                                        >
                                                                            {({ input, meta }) => {
                                                                                // Filter fetchCustomData based on matching cs_field_id with fieldId
                                                                                const matchedOptions = custom.filter(option => option.cs_field_id === fieldId[index]);

                                                                                return (
                                                                                    <div>
                                                                                        <Label className='form-label' for={`displayname${index}`}>
                                                                                            <strong>{label}</strong>{requiredfield[index] === '1' && <span className="text-danger"> *</span>}
                                                                                        </Label>
                                                                                        <Select
                                                                                            {...input}
                                                                                            options={requiredfield[index] === '1' ?
                                                                                                matchedOptions.map(option => ({ value: option.cs_field_option_value, label: option.cs_field_option })) :
                                                                                                [
                                                                                                    { value: '', label: 'Select' }, // Adding the "Select" option as the first item
                                                                                                    ...matchedOptions.map(option => ({ value: option.cs_field_option_value, label: option.cs_field_option }))
                                                                                                ]
                                                                                            }

                                                                                            // options={[{ value: '', label: 'Select' }, // Adding the "Select" option as the first item
                                                                                            // ...matchedOptions.map(option => ({ value: option.cs_field_option_value, label: option.cs_field_option }))]}
                                                                                            placeholder={`Select ${label}`}
                                                                                            isSearchable={true}
                                                                                            onChange={(value) => input.onChange(value)}
                                                                                            onBlur={input.onBlur}
                                                                                            classNamePrefix="react-select"
                                                                                        />
                                                                                        {meta.error && meta.touched && <p className='d-block text-danger'>{meta.error}</p>}
                                                                                    </div>
                                                                                );
                                                                            }}
                                                                        </Field>
                                                                    )
                                                                }






                                                                {
                                                                    fieldType[index] === 'Long Text' && (
                                                                        <Field
                                                                            name={`${fieldName[index]}`} // Use dynamic field name
                                                                            initialValue={Data?.[fieldName[index]] || ''}
                                                                            validate={requiredfield[index] === '1' ? composeValidators(required) : (value) => composeValidators()(value)}
                                                                        >
                                                                            {({ input, meta }) => (
                                                                                <div>
                                                                                    <Label className='form-label' for={`displayname${index}`}>
                                                                                        <strong>{label}</strong>{requiredfield[index] === '1' && <span className="text-danger"> *</span>}
                                                                                    </Label>
                                                                                    <textarea
                                                                                        {...input}
                                                                                        className="form-control"
                                                                                        id={`displayname${index}`}
                                                                                        placeholder={`Enter ${label}`}
                                                                                    />
                                                                                    {meta.error && meta.touched && <p className='d-block text-danger'>{meta.error}</p>}
                                                                                </div>
                                                                            )}
                                                                        </Field>
                                                                    )
                                                                }

                                                                {
                                                                    fieldType[index] === 'Number' && (
                                                                        <Field
                                                                            name={`${fieldName[index]}`} // Use dynamic field name
                                                                            initialValue={Data?.[fieldName[index]] || ''}
                                                                            validate={requiredfield[index] === '1' ? composeValidators(number) : (value) => composeValidators()(value)}
                                                                        >
                                                                            {({ input, meta }) => (
                                                                                <div>
                                                                                    <Label className='form-label' for={`displayname${index}`}>
                                                                                        <strong>{label}</strong>{requiredfield[index] === '1' && <span className="text-danger"> *</span>}
                                                                                    </Label>
                                                                                    <input
                                                                                        {...input}
                                                                                        className="form-control"
                                                                                        id={`displayname${index}`}
                                                                                        type="number"
                                                                                        placeholder={`Enter ${label}`}
                                                                                    />
                                                                                    {meta.error && meta.touched && <p className='d-block text-danger'>{meta.error}</p>}
                                                                                </div>
                                                                            )}
                                                                        </Field>
                                                                    )
                                                                }

                                                                {
                                                                    fieldType[index] === 'Text' && (
                                                                        <Field
                                                                            name={`${fieldName[index]}`}
                                                                            initialValue={Data?.[fieldName[index]] || ''}
                                                                            validate={requiredfield[index] === '1' ? composeValidators(NAME) : (value) => composeValidators()(value)}
                                                                        >
                                                                            {({ input, meta }) => (
                                                                                <div>
                                                                                    <Label className='form-label' for={`displayname${index}`}>
                                                                                        <strong>{label}</strong>{requiredfield[index] === '1' && <span className="text-danger"> *</span>}
                                                                                    </Label>
                                                                                    <input
                                                                                        {...input}
                                                                                        className="form-control"
                                                                                        id={`displayname${index}`}
                                                                                        type="text"
                                                                                        value={input.value || ''}
                                                                                        placeholder={`Enter ${label}`}
                                                                                    />
                                                                                    {meta.error && meta.touched && <p className='d-block text-danger'>{meta.error}</p>}
                                                                                </div>
                                                                            )}
                                                                        </Field>

                                                                    )
                                                                }


                                                                {
                                                                    fieldType[index] === 'Email' && (
                                                                        <Field
                                                                            name={`${fieldName[index]}`} // Use dynamic field name
                                                                            initialValue={Data?.cs_email}
                                                                            validate={requiredfield[index] === '1' ? composeValidators(email) : (value) => composeValidators()(value)}
                                                                        >
                                                                            {({ input, meta }) => (
                                                                                <div>
                                                                                    <Label className='form-label' for={`displayname${index}`}>
                                                                                        <strong>{label}</strong>{requiredfield[index] === '1' && <span className="text-danger"> *</span>}
                                                                                    </Label>
                                                                                    <input
                                                                                        {...input}
                                                                                        className="form-control"
                                                                                        id={`displayname${index}`}
                                                                                        type="text"
                                                                                        placeholder={`Enter ${label}`}
                                                                                    />
                                                                                    {meta.error && meta.touched && <p className='d-block text-danger'>{meta.error}</p>}
                                                                                </div>
                                                                            )}
                                                                        </Field>
                                                                    )
                                                                }

                                                                {
                                                                    fieldType[index] === 'Radio' && (
                                                                        <Field
                                                                            name={`${fieldName[index]}`} // Use dynamic field name
                                                                            initialValue={Data?.[fieldName[index]] || ''}
                                                                            validate={requiredfield[index] === '1' ? composeValidators(radio) : (value) => composeValidators()(value)}
                                                                        >
                                                                            {({ input, meta }) => (
                                                                                <div>
                                                                                    <Label className='form-label' for={`radio${index}`}>
                                                                                        <strong>{label}</strong>{requiredfield[index] === '1' && <span className="text-danger"> *</span>}
                                                                                    </Label>
                                                                                    <div>
                                                                                        <Media body className="icon-state switch-sm">
                                                                                            <Label className="switch">
                                                                                                <Input
                                                                                                    type="checkbox"
                                                                                                    checked={input.value === 'Yes'}
                                                                                                    onChange={(e) => input.onChange(e.target.checked ? 'Yes' : 'No')}
                                                                                                />
                                                                                                <span className={"switch-state " + (input.value === 'Yes' ? "bg-success" : "bg-danger")}></span>
                                                                                            </Label>
                                                                                        </Media>
                                                                                    </div>
                                                                                    {meta.error && meta.touched && <p className='d-block text-danger'>{meta.error}</p>}
                                                                                </div>
                                                                            )}
                                                                        </Field>
                                                                    )
                                                                }

                                                                {
                                                                    fieldType[index] === 'File' && StaticName[index] === 'Document1' && (
                                                                        <Field
                                                                            name={`${fieldName[index]}`} // Use dynamic field name
                                                                            validate={requiredfield[index] === '1' ? composeValidators(PDF) : (value) => composeValidators()(value)}
                                                                        >
                                                                            {({ input, meta }) => (
                                                                                <div>
                                                                                    <Label className='form-label' for={`displayname${index}`}>
                                                                                        <strong>{label}</strong>{requiredfield[index] === '1' && <span className="text-danger"> *</span>}
                                                                                    </Label>

                                                                                    {/* File input field */}
                                                                                    <input
                                                                                        type="file"
                                                                                        accept=".pdf"  // Accepting only document formats
                                                                                        onChange={(e) => {
                                                                                            const file = e.target.files[0];
                                                                                            const maxFileSize = 2 * 1024 * 1024; // 2MB size limit

                                                                                            if (file && file.size > maxFileSize) {
                                                                                                alert('File size exceeds 2MB limit.');
                                                                                                e.target.value = ''; // Reset the file input
                                                                                            } else {
                                                                                                input.onChange(file);  // Pass the file object to the input if size is valid
                                                                                            }
                                                                                        }}
                                                                                        onBlur={input.onBlur}
                                                                                        className="form-control"
                                                                                        id={`document${index}`}
                                                                                    />

                                                                                    {/* Display validation error if any */}
                                                                                    {meta.error && meta.touched && <p className='d-block text-danger'>{meta.error}</p>}
                                                                                </div>
                                                                            )}
                                                                        </Field>
                                                                    )
                                                                }

                                                                {
                                                                    fieldType[index] === 'File' && StaticName[index] === 'Document2' && (
                                                                        <Field
                                                                            name={`${fieldName[index]}`} // Use dynamic field name
                                                                            validate={requiredfield[index] === '1' ? composeValidators(option) : (value) => composeValidators()(value)}
                                                                        >
                                                                            {({ input, meta }) => (
                                                                                <div>
                                                                                    <Label className='form-label' for={`displayname${index}`}>
                                                                                        <strong>{label}</strong>{requiredfield[index] === '1' && <span className="text-danger"> *</span>}
                                                                                    </Label>

                                                                                    {/* File input field */}
                                                                                    <input
                                                                                        type="file"
                                                                                        accept=".pdf,.doc,.docx"  // Accepting only document formats
                                                                                        onChange={(e) => {
                                                                                            const file = e.target.files[0];
                                                                                            const maxFileSize = 2 * 1024 * 1024; // 2MB size limit

                                                                                            if (file && file.size > maxFileSize) {
                                                                                                alert('File size exceeds 2MB limit.');
                                                                                                e.target.value = ''; // Reset the file input
                                                                                            } else {
                                                                                                input.onChange(file);  // Pass the file object to the input if size is valid
                                                                                            }
                                                                                        }}  // Pass the file object to the input
                                                                                        onBlur={input.onBlur}
                                                                                        className="form-control"
                                                                                        id={`document${index}`}
                                                                                    />

                                                                                    {meta.error && meta.touched && <p className='d-block text-danger'>{meta.error}</p>}
                                                                                </div>
                                                                            )}
                                                                        </Field>
                                                                    )
                                                                }
                                                                {
                                                                    fieldType[index] === 'File' && StaticName[index] === 'Document3' && (
                                                                        <Field
                                                                            name={`${fieldName[index]}`} // Use dynamic field name
                                                                            validate={requiredfield[index] === '1' ? composeValidators(option) : (value) => composeValidators()(value)}
                                                                        >
                                                                            {({ input, meta }) => (
                                                                                <div>
                                                                                    <Label className='form-label' for={`displayname${index}`}>
                                                                                        <strong>{label}</strong>{requiredfield[index] === '1' && <span className="text-danger"> *</span>}
                                                                                    </Label>

                                                                                    {/* File input field */}
                                                                                    <input
                                                                                        type="file"
                                                                                        accept=".pdf,.doc,.docx"  // Accepting only document formats
                                                                                        onChange={(e) => {
                                                                                            const file = e.target.files[0];
                                                                                            const maxFileSize = 2 * 1024 * 1024; // 2MB size limit

                                                                                            if (file && file.size > maxFileSize) {
                                                                                                alert('File size exceeds 2MB limit.');
                                                                                                e.target.value = ''; // Reset the file input
                                                                                            } else {
                                                                                                input.onChange(file);  // Pass the file object to the input if size is valid
                                                                                            }
                                                                                        }}  // Pass the file object to the input
                                                                                        onBlur={input.onBlur}
                                                                                        className="form-control"
                                                                                        id={`document${index}`}
                                                                                    />

                                                                                    {meta.error && meta.touched && <p className='d-block text-danger'>{meta.error}</p>}
                                                                                </div>
                                                                            )}
                                                                        </Field>
                                                                    )
                                                                }
                                                                {
                                                                    fieldType[index] === 'File' && StaticName[index] === 'Document4' && (
                                                                        <Field
                                                                            name={`${fieldName[index]}`} // Use dynamic field name
                                                                            validate={requiredfield[index] === '1' ? composeValidators(option) : (value) => composeValidators()(value)}
                                                                        >
                                                                            {({ input, meta }) => (
                                                                                <div>
                                                                                    <Label className='form-label' for={`displayname${index}`}>
                                                                                        <strong>{label}</strong>{requiredfield[index] === '1' && <span className="text-danger"> *</span>}
                                                                                    </Label>

                                                                                    {/* File input field */}
                                                                                    <input
                                                                                        type="file"
                                                                                        accept=".pdf,.doc,.docx"  // Accepting only document formats
                                                                                        onChange={(e) => {
                                                                                            const file = e.target.files[0];
                                                                                            const maxFileSize = 2 * 1024 * 1024; // 2MB size limit

                                                                                            if (file && file.size > maxFileSize) {
                                                                                                alert('File size exceeds 2MB limit.');
                                                                                                e.target.value = ''; // Reset the file input
                                                                                            } else {
                                                                                                input.onChange(file);  // Pass the file object to the input if size is valid
                                                                                            }
                                                                                        }}  // Pass the file object to the input
                                                                                        onBlur={input.onBlur}
                                                                                        className="form-control"
                                                                                        id={`document${index}`}
                                                                                    />

                                                                                    {meta.error && meta.touched && <p className='d-block text-danger'>{meta.error}</p>}
                                                                                </div>
                                                                            )}
                                                                        </Field>
                                                                    )
                                                                }
                                                                {
                                                                    fieldType[index] === 'File' && StaticName[index] === 'Document5' && (
                                                                        <Field
                                                                            name={`${fieldName[index]}`} // Use dynamic field name
                                                                            validate={requiredfield[index] === '1' ? composeValidators(option) : (value) => composeValidators()(value)}
                                                                        >
                                                                            {({ input, meta }) => (
                                                                                <div>
                                                                                    <Label className='form-label' for={`displayname${index}`}>
                                                                                        <strong>{label}</strong>{requiredfield[index] === '1' && <span className="text-danger"> *</span>}
                                                                                    </Label>

                                                                                    {/* File input field */}
                                                                                    <input
                                                                                        type="file"
                                                                                        accept=".pdf,.doc,.docx"  // Accepting only document formats
                                                                                        onChange={(e) => {
                                                                                            const file = e.target.files[0];
                                                                                            const maxFileSize = 2 * 1024 * 1024; // 2MB size limit

                                                                                            if (file && file.size > maxFileSize) {
                                                                                                alert('File size exceeds 2MB limit.');
                                                                                                e.target.value = ''; // Reset the file input
                                                                                            } else {
                                                                                                input.onChange(file);  // Pass the file object to the input if size is valid
                                                                                            }
                                                                                        }}  // Pass the file object to the input
                                                                                        onBlur={input.onBlur}
                                                                                        className="form-control"
                                                                                        id={`document${index}`}
                                                                                    />

                                                                                    {meta.error && meta.touched && <p className='d-block text-danger'>{meta.error}</p>}
                                                                                </div>
                                                                            )}
                                                                        </Field>
                                                                    )
                                                                }

                                                                {fieldType[index] === 'Username' && (
                                                                    <Field
                                                                        name={`${fieldName[index]}`} // Use dynamic field name
                                                                        initialValue={Data[fieldName[index]] || ''}
                                                                        validate={requiredfield[index] === '1' ? composeValidators(username1) : (value) => composeValidators()(value)}
                                                                    >
                                                                        {({ input, meta }) => (
                                                                            <div>
                                                                                <Label className='form-label' for={`displayname${index}`}>
                                                                                    <strong>{label}</strong>{requiredfield[index] === '1' && <span className="text-danger"> *</span>}
                                                                                </Label>
                                                                                <input
                                                                                    {...input}
                                                                                    className="form-control"
                                                                                    id={`displayname${index}`}
                                                                                    type="text"
                                                                                    placeholder={`Enter ${label}`}
                                                                                    disabled
                                                                                />
                                                                                {meta.error && meta.touched && <p className='d-block text-danger'>{meta.error}</p>}
                                                                            </div>
                                                                        )}
                                                                    </Field>
                                                                )}

                                                                {fieldType[index] === 'Password' && (
                                                                    <Field
                                                                        name={`${fieldName[index]}`} // Use dynamic field name
                                                                        initialValue={Data[fieldName[index]] || ''}
                                                                        validate={requiredfield[index] === '1' ? composeValidators(password) : (value) => composeValidators()(value)}
                                                                    >
                                                                        {({ input, meta }) => (
                                                                            <div>
                                                                                <Label className='form-label' for={`displayname${index}`}>
                                                                                    <strong>{label}</strong>{requiredfield[index] === '1' && <span className="text-danger"> *</span>}
                                                                                </Label>
                                                                                <input
                                                                                    {...input}
                                                                                    className="form-control"
                                                                                    id={`displayname${index}`}
                                                                                    type="text"
                                                                                    placeholder={`Enter ${label}`}
                                                                                    disabled
                                                                                />
                                                                                {meta.error && meta.touched && <p className='d-block text-danger'>{meta.error}</p>}
                                                                            </div>
                                                                        )}
                                                                    </Field>
                                                                )}




                                                            </Col>
                                                        );
                                                    })}
                                                </Row>

                                            )}


                                            {/* Row for the checkbox - hide this when Next is clicked */}

                                            {/* <Row>
                                                    <Col md="8" className="mb-3">
                                                        <Field name="cs_iscomplimentary" type="checkbox">
                                                            {({ input, meta }) => (
                                                                <div>
                                                                    <input
                                                                        {...input}
                                                                        id="cs_iscomplimentary"
                                                                        checked={input.checked} // Use input.checked to get the current checked state
                                                                        onChange={(e) => {
                                                                            const isChecked = e.target.checked ? 1 : 0; // Convert to 1 or 0
                                                                            input.onChange(isChecked); // Update form state with 1 or 0
                                                                            handleCheckboxChange(e); // Update checkbox state
                                                                        }}
                                                                    />
                                                                    <Label className='form-check-label' style={{ marginLeft: '10px' }} for="cs_iscomplimentary">
                                                                        <strong>Is this a complimentary?</strong>
                                                                    </Label>
                                                                    {meta.error && meta.touched && <p className='d-block text-danger'>{meta.error}</p>}
                                                                </div>
                                                            )}
                                                        </Field>


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
                                                                        <strong>Do you want to send a confirmation email to ?</strong>
                                                                    </Label>
                                                                    {meta.error && meta.touched && <p className='d-block text-danger'>{meta.error}</p>}
                                                                </div>
                                                            )}
                                                        </Field>
                                                    </Col>
                                                </Row> */}


                                            {/* Conditionally render the fields when showNextStep is true */}

                                            <>
                                                {/* First Row */}


                                                {/* <Col sm="12">
                                                        <Label className="form-label" htmlFor="payment_mode">
                                                            <strong>Payment</strong>
                                                            <span className="text-danger"> *</span>
                                                        </Label>
                                                        <div className="mb-3 mt-2">
                                                            <div className="form-check">
                                                                <Field
                                                                    name="payment_mode"
                                                                    component="input"
                                                                    type="radio"
                                                                    value="online"
                                                                    onChange={handlePaymentModeChange}
                                                                    className="form-check-input"
                                                                />
                                                                <Label className="form-check-label" htmlFor="online" style={{ fontSize: '1.2rem' }}>
                                                                    Online
                                                                </Label>
                                                            </div>
                                                            <div className="form-check mt-2">
                                                                <Field
                                                                    name="payment_mode"
                                                                    component="input"
                                                                    type="radio"
                                                                    value="offline"
                                                                    onChange={handlePaymentModeChange}
                                                                    checked={paymentMode === 'offline'}
                                                                    className="form-check-input"
                                                                />
                                                                <Label className="form-check-label" htmlFor="offline" style={{ fontSize: '1.2rem' }}>
                                                                    Offline
                                                                </Label>
                                                            </div>
                                                        </div>
                                                    </Col> */}
                                                {(showNextStep) && (
                                                    <Row>
                                                        <Col md="12" className="mb-3">
                                                            <div className="form-group">
                                                                <strong>Payment</strong>
                                                                <div className='me-5 mt-3'>
                                                                    <input
                                                                        type="radio"
                                                                        name="payment_mode"
                                                                        value="online"
                                                                        checked={paymentMode === 'online'}
                                                                        onChange={handlePaymentModeChange}
                                                                        disabled={!addonticket}
                                                                        className='me-2'
                                                                    /> <strong >Online</strong>
                                                                    <input
                                                                        type="radio"
                                                                        name="payment_mode"
                                                                        value="offline"
                                                                        checked={paymentMode === 'offline'}
                                                                        onChange={handlePaymentModeChange}
                                                                        disabled={!addonticket}
                                                                        className='ms-3 me-2'

                                                                    /><strong>Offline</strong>
                                                                </div>
                                                            </div>
                                                        </Col>

                                                    </Row>

                                                )}

                                                {paymentMode === 'offline' && (showNextStep) && (
                                                    <Row>


                                                        <Col xs={12} sm={6} md={6} className="mb-3">
                                                            {/* <Field name="payment_mode">
                                                                {({ input, meta }) => (
                                                                    <div>
                                                                        <Label className="form-label" for="payment_mode">
                                                                            <strong>Payment Mode</strong><span className="text-danger"> *</span>
                                                                        </Label>
                                                                        <input
                                                                            {...input}
                                                                            className="form-control"
                                                                            id="payment_mode"
                                                                            placeholder="Payment Mode"
                                                                        />
                                                                        {meta.error && meta.touched && <p className="d-block text-danger">{meta.error}</p>}
                                                                    </div>
                                                                )}
                                                            </Field> */}
                                                            <Field name="payment_type">
                                                                {({ input, meta }) => (
                                                                    <div>
                                                                        <Label className="form-label" for="eventday"><strong>Payment Type</strong></Label>
                                                                        <Select
                                                                            {...input}
                                                                            options={paymentTypeOptions}
                                                                            placeholder="Select Payment Mode"
                                                                            isSearchable={true}
                                                                            isMulti={false}
                                                                            onChange={(value) => {
                                                                                input.onChange(value);  // Update form value
                                                                                setPaymentDetails((prevDetails) => ({
                                                                                    ...prevDetails,
                                                                                    paymenttype_id: value ? value.value : null, // Set the selected payment type
                                                                                }));
                                                                            }}
                                                                            classNamePrefix="react-select"
                                                                            value={input.value}
                                                                        />
                                                                        {meta.error && meta.touched && <p className="d-block text-danger">{meta.error}</p>}
                                                                    </div>
                                                                )}
                                                            </Field>
                                                        </Col>

                                                        <Col xs={12} sm={6} md={6} className="mb-3">
                                                            <Field name="cheque_no">
                                                                {({ input, meta }) => (
                                                                    <div>
                                                                        <Label className="form-label" for="cheque_no">
                                                                            <strong>DD / CHEQUE NO. / TRANSACTION ID</strong><span className="text-danger"> *</span>
                                                                        </Label>
                                                                        <input
                                                                            {...input}
                                                                            className="form-control"
                                                                            id="cheque_no"
                                                                            placeholder="Transaction ID"
                                                                        />
                                                                        {meta.error && meta.touched && <p className="d-block text-danger">{meta.error}</p>}
                                                                    </div>
                                                                )}
                                                            </Field>
                                                        </Col>



                                                        <Col xs={12} sm={6} md={6} className="mb-3">
                                                            <Field name="payment_date">
                                                                {({ input, meta }) => (
                                                                    <div>
                                                                        <Label className="form-label" for="payment_date">
                                                                            <strong>Payment Date</strong><span className="text-danger"> *</span>
                                                                        </Label>
                                                                        {/* <input
                                                                            {...input}
                                                                            className="form-control"
                                                                            id="payment_date"
                                                                            placeholder="Payment Date"
                                                                        /> */}
                                                                        <input
                                                                            {...input}
                                                                            className="form-control"
                                                                            id="payment_date"
                                                                            type="date"
                                                                            placeholder="Enter Payment Date"
                                                                            // min={minDate}
                                                                            max="9999-12-31"
                                                                        />
                                                                        {meta.error && meta.touched && <p className="d-block text-danger">{meta.error}</p>}
                                                                    </div>
                                                                )}
                                                            </Field>
                                                        </Col>

                                                        <Col xs={12} sm={6} md={6} className="mb-3">
                                                            <Field name="bank">
                                                                {({ input, meta }) => (
                                                                    <div>
                                                                        <Label className="form-label" for="bank">
                                                                            <strong>Bank</strong><span className="text-danger"> *</span>
                                                                        </Label>
                                                                        <input
                                                                            {...input}
                                                                            className="form-control"
                                                                            id="bank"
                                                                            placeholder="Bank"
                                                                        />
                                                                        {meta.error && meta.touched && <p className="d-block text-danger">{meta.error}</p>}
                                                                    </div>
                                                                )}
                                                            </Field>
                                                        </Col>

                                                        <Col xs={12} sm={6} md={6} className="mb-3">
                                                            <Field name="branch">
                                                                {({ input, meta }) => (
                                                                    <div>
                                                                        <Label className="form-label" for="branch">
                                                                            <strong>Branch</strong><span className="text-danger"> *</span>
                                                                        </Label>
                                                                        <input
                                                                            {...input}
                                                                            className="form-control"
                                                                            id="branch"
                                                                            placeholder="Branch"
                                                                        />
                                                                        {meta.error && meta.touched && <p className="d-block text-danger">{meta.error}</p>}
                                                                    </div>
                                                                )}
                                                            </Field>
                                                        </Col>



                                                        {/* <Col xs={12} sm={6} md={6} className="mb-3">
                                                            <Field name="currency">
                                                                {({ input, meta }) => (
                                                                    <div>
                                                                        <Label className="form-label" for="currency">
                                                                            <strong>Payment Currency</strong><span className="text-danger"> *</span>
                                                                        </Label>
                                                                        <input
                                                                            {...input}
                                                                            className="form-control"
                                                                            id="currency"
                                                                            placeholder="Currency"
                                                                        />
                                                                        {meta.error && meta.touched && <p className="d-block text-danger">{meta.error}</p>}
                                                                    </div>
                                                                )}
                                                            </Field>
                                                        </Col> */}


                                                        {/* 
                                                        <Col xs={12} sm={6} md={6} className="mb-3">
                                                            <Field name="conference_fees"
                                                                initialValue={regAmount}
                                                            >
                                                                {({ input, meta }) => (
                                                                    <div>
                                                                        <Label className="form-label" for="conference_fees">
                                                                            <strong>Registration Amount</strong><span className="text-danger"> *</span>
                                                                        </Label>
                                                                        <input
                                                                            {...input}
                                                                            className="form-control"
                                                                            id="conference_fees"
                                                                            placeholder="Registration Amount"
                                                                        />
                                                                        {meta.error && meta.touched && <p className="d-block text-danger">{meta.error}</p>}
                                                                    </div>
                                                                )}
                                                            </Field>
                                                        </Col> */}

                                                        <Col xs={12} sm={6} md={4} className="mb-3">
                                                            <Field name="conference_fees"
                                                                initialValue={regAmount}
                                                            >
                                                                {({ input, meta }) => (
                                                                    <div>
                                                                        <Label className="form-label" for="conference_fees">
                                                                            <strong>Registration Amount</strong><span className="text-danger"> *</span>
                                                                        </Label>
                                                                        <input
                                                                            {...input}
                                                                            className="form-control"
                                                                            id="conference_fees"
                                                                            placeholder="Registration Amount"
                                                                        />
                                                                        {meta.error && meta.touched && <p className="d-block text-danger">{meta.error}</p>}
                                                                    </div>
                                                                )}
                                                            </Field>
                                                        </Col>


                                                        {/* <Col xs={12} sm={6} md={6} className="mb-3">
                                                            <Field name="processing_fee"
                                                                initialValue={processingAmount}                                                          >
                                                                {({ input, meta }) => (
                                                                    <div>
                                                                        <Label className="form-label" for="processing_fee">
                                                                            <strong>Processing Fees {processingFee.cs_value}%</strong><span className="text-danger"> *</span>
                                                                        </Label>
                                                                        <input
                                                                            {...input}
                                                                            className="form-control"
                                                                            id="processing_fee"
                                                                            placeholder="Processing Fees"
                                                                        />
                                                                        {meta.error && meta.touched && <p className="d-block text-danger">{meta.error}</p>}
                                                                    </div>
                                                                )}
                                                            </Field>
                                                        </Col> */}

                                                        <Col xs={12} sm={6} md={6} className="mb-3">
                                                            <Field name="total_paid_amount"
                                                                initialValue={totalPaidAmount}
                                                            >
                                                                {({ input, meta }) => (
                                                                    <div>
                                                                        <Label className="form-label" for="total_paid_amount">
                                                                            <strong>Total Paid Amount</strong><span className="text-danger"> *</span>
                                                                        </Label>
                                                                        <input
                                                                            {...input}
                                                                            className="form-control"
                                                                            id="total_paid_amount"
                                                                            placeholder="Total Paid Amount"
                                                                        />
                                                                        {meta.error && meta.touched && <p className="d-block text-danger">{meta.error}</p>}
                                                                    </div>
                                                                )}
                                                            </Field>
                                                        </Col>
                                                    </Row>

                                                )}

                                            </>

                                            {!showNextStep && (
                                                <Row className="d-flex justify-content-end">
                                                    <Col xs="auto">
                                                        <Button color="primary" className="me-2 mt-3" onClick={handleNextClick}  // Disable if category or ticket is not selected
                                                        >Next</Button>
                                                    </Col>
                                                </Row>
                                            )}

                                            {showNextStep && (
                                                <Row className="d-flex justify-content-between align-items-center">
                                                    <Col xs="auto">
                                                        {/* Conditionally render Back button */}
                                                        <Button color="success" className="me-2 mt-3" onClick={handleBackClick}>Back</Button>
                                                    </Col>
                                                    <Col xs="auto" className="text-end">
                                                        <Button color="warning" className="me-2 mt-3">Cancel</Button>
                                                        <Button color="primary" type="submit" className="me-2 mt-3">Submit</Button>
                                                    </Col>
                                                </Row>
                                            )}




                                            {/* <Row className="d-flex justify-content-between align-items-center">

                                                <Col xs="auto">
                                                    <Button color='warning' className="me-2 mt-3">Cancel</Button>
                                                    <Button color='primary' type='submit' className="me-2 mt-3">Submit</Button>
                                                </Col>
                                            </Row> */}



                                        </form>
                                    )}
                                </Form>

                            </CardBody>
                        </Card>

                    </Col >
                    {(showNextStep) && (
                        <Col
                            xs={12} // Full width for small devices
                            sm={6}  // Half width for medium devices
                            md={4}  // One-third width for larger devices
                        >
                             
                    <Ordersummary
                     category={category} 
                     setCategory={setCategory} 
                     addonticket={addonticket} 
                     setAddonTicket={setAddonTicket} 
                     regAmount ={regAmount}
                     totalPaidAmount ={totalPaidAmount}
                     setRegAmount ={setRegAmount}
                     settotalPaidAmount = {settotalPaidAmount}
                     currency ={currency}
                     processingAmount = {processingAmount}
                     gstamount ={gstamount}
                     gstfee ={gstfee}
                     gstinclded ={gstinclded}
                     processinginclded = {processinginclded}
                     processingfeeornot ={processingfeeornot}
                     processingfeein ={processingfeein}

                     >

</Ordersummary>
                    </Col>
                        
                    )}
                </Row>

            </Container>

            {/* Modal */}
            <Modal isOpen={modal} toggle={() => setModal(!modal)} centered>
                <ModalHeader toggle={() => setModal(!modal)}>Confirmation</ModalHeader>
                <ModalBody>
                    <div>
                        <p>
                            Your changes will be discarded. Are you sure you want to cancel?
                        </p>
                    </div>
                </ModalBody>
                <ModalFooter>
                    <button onClick={handleNavigation} className="btn btn-warning">
                        Yes
                    </button>
                    {/* <Link to="/manage-facility/Consoft" className="btn btn-warning">Yes</Link> */}
                    <Button color="primary" onClick={() => setModal(!modal)}>No</Button>
                </ModalFooter>
            </Modal>
        </Fragment >
    );
};


export default AddConferenceUser;




