import React, { Fragment, useState, useEffect, useContext, useRef } from 'react';
import { Container, Row, Col, Input, Label, Table, Button, Card, CardBody, CardHeader, Modal, ModalHeader, FormFeedback, ModalBody, ModalFooter, Media, Alert, PopoverBody, UncontrolledPopover, Popover, PopoverHeader } from 'reactstrap';
import { useForm } from 'react-hook-form';
import axios from 'axios';
import { BackendAPI, BackendPath } from '../../api';
import SweetAlert from 'sweetalert2';
// import { Input } from 'antd';
import { Breadcrumbs } from '../../AbstractElements';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { MdDelete, MdInfoOutline } from "react-icons/md";
import Select from 'react-select';
import { Field, Form } from 'react-final-form'; // Import Field and Form from react-final-form
import { required, email, Img, PDF, option, number, Name, NAME, radio, expiryDate, shortbio, longbio, username1, password, Email } from '../Utils/validationUtils';
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
    const [gstfee, setgstfee] = useState();
    const [gstinclded, setgstinclded] = useState();
    const [gstamount, setgstamount] = useState();
    const [gstpercentage, setgstpercentage] = useState(18);
    const [processingfeein, setprocessingfeein] = useState();
    const [processinginclded, setprocessinginclded] = useState();
    const [currency, setcurrency] = useState();
    const [processingfeeornot, setprocessingfeeornot] = useState();
    const [Useremail, setEmail] = useState('');
    const [selectedAddonNames, setSelectedAddonNames] = useState([]);
    const [workshopCategory1, setWorkshopCategory1] = useState();
    const [addedpaymentmode, setaddedpaymentmode] = useState();
    const [addonCounts, setAddonCounts] = useState({});
    const [addonFormData, setAddonFormData] = useState({});
    const [registereduser, setregistereduser] = useState();
    const [workshoptypedata, setworkshoptype] = useState([]);
    const [selectedWorkshops, setSelectedWorkshops] = useState({}); // Tracks selected workshop per type
    const [files, setFiles] = useState({ photo: '', resume: '' });
    const initialValue = '';
    const [selectedFacilityType, setSelectedFacilityType] = useState(initialValue);
    const [selectedImage, setSelectedImage] = useState(null);
    const [selectedPdf, setSelectedPdf] = useState(null);
    const [imageError, setImageError] = useState('');
    const [pdfError, setPdfError] = useState('');
    const [selectedcv, setselectedcv] = useState(null);
    const [Faculty, setFaculty] = useState({}); // State to store Faculty data
    const [imageErrorforcv, setImageErrorforcv] = useState('');
    const [imagePreview, setImagePreview] = useState(Faculty.photo || null);
    const [pdfPreview, setPdfPreview] = useState(null);
    const [adminServerName, setAdminServerName] = useState('');

    const [logoOpen, setLogoOpen] = useState(false);
    const [imageOpen, setImageOpen] = useState(false);
    const [iconPreviewUrl, setIconPreviewUrl] = useState(null);
    const [imagePreviewUrl, setImagePreviewUrl] = useState(null);
    const iconAvailableRef = useRef(null);

    const toSentenceCase = (str) => {
        if (!str) return ''; // Handle empty or undefined strings
        return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
      };




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

    const AddonAmountMap = Object.fromEntries(
        addonAmount.map(item => [item.addon_id, item.addon_amount])
    );

    useEffect(() => {
        // Initialize paymentMode based on addedpaymentmode
        if (addedpaymentmode === 'Online' || addedpaymentmode === 'Offline') {
            setPaymentMode(addedpaymentmode.toLowerCase());
        }
    }, [addedpaymentmode]);

    //Console.log("DataData", Data);

    const [paymentDetails, setPaymentDetails] = useState({
        cardNumber: '',
        cardExpiry: '',
        cardCVV: '',
    });

    const empty = '';

    //Console.log("UserEmail11121",Useremail);
    //Console.log("Field Data", data);
    //Console.log("Reg Cat", regCat);
    //Console.log("Addon Amount", addonAmount);
    //Console.log("Reg Amount", regAmount);
    //Console.log("Reg Addon Amount", regAddonAmount);
    //Console.log("Processing Fee", processingFee);
    //Console.log("Processing Fee", gstamount);


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
        fetchUserTicketcounts();
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
            //Console.log('Data from API:', response.data);
            setformData(response.data[0]); // Set workshop data to the first item in the response array
            setEmail(response.data[0].cs_email);
        } catch (error) {
            //Console.error('Error fetching workshop data:', error);
        }
    };



    const fetchUserTicketcounts = async () => {
        try {
            const token = getToken();
            const response = await axios.get(`${BackendAPI}/register/getconfirmusers`, {
                headers: {
                    Authorization: `Bearer ${token}` // Include the token in the Authorization header
                }
            });
            setregistereduser(response.data);  // Assuming response.data contains the user's ticket data
            console.log("registereduserdata", response.data)
        } catch (error) {
            console.error('Error fetching user tickets:', error);
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



            //Console.log("Data:", fieldsData);
            //Console.log("Custom:", customfield);



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



            // //Console.log('Id:', fieldName);
        } catch (error) {
            //Console.error('Error fetching Fields:', error);
            setLoading(false);
        }
    };

    const handleCancel = () => {
        setModal(true);
    };

    const onSubmit = async (formData, files) => {

        console.log("formdata", formData);
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
            const facultyDetails = {};
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

            const facultyFields = [
                'designation',
                'description',
                'long_description',
                'facultytype_id',
                'fname',
                'lname',
                'country',
                'contact1',
                'email1',
                'ntitle'
            ];

            // Prepare other fields
            const values = {};

            // Loop through formData to separate payment and other fields
            for (const key in formData) {
                if (Object.hasOwnProperty.call(formData, key)) {
                    // Add payment-related fields to paymentDetails
                    if (paymentFields.includes(key)) {
                        paymentDetails[key] = formData[key].value || formData[key];
                    } else if (facultyFields.includes(key)) {
                        facultyDetails[key] = formData[key].value || formData[key];
                    } else {
                        // Add other fields to values
                        values[key] = formData[key].value || formData[key];
                    }
                }
            }

            if (values.cs_first_name) {
                values.cs_first_name = toSentenceCase(values.cs_first_name);
              }
        
              if (values.cs_last_name) {
                values.cs_last_name = toSentenceCase(values.cs_last_name);
              }

            const token = getToken();  // Assuming you have a functio


            // Append other form fields to FormData
            for (const key in values) {
                data.append(key, values[key]);
            }

            data.append('photo', selectedImage);
            data.append('resume', selectedcv);
            // Append 'cs_isconfirm' flag to FormData
            data.append('cs_isconfirm', 0); // Set flag to 0
            data.append('userid', userId); // Set flag to 0
            console.log("workshopCategory1", selectedWorkshops);

            data.append('cs_workshop_category', workshopCategory1);
            data.append('facultyDetails', JSON.stringify(facultyDetails));
            console.log("workshopCategory1", selectedWorkshops);
            Object.values(selectedWorkshops).forEach(workshop => {
                const formattedWorkshopType = `cs_${workshop.workshopType.toLowerCase().replace(/\s+/g, '')}`;  // Remove spaces
                data.append(formattedWorkshopType, workshop.addon_workshop_id);
            });
            data.append('accompany_person_data', JSON.stringify(addonFormData));


            const response = await axios.post(`${BackendAPI}/register/addUser`, data, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'multipart/form-data'  // Set the content type to multipart/form-data
                }
            });






            if (response.data.success) {
                //Console.log('User created, proceeding to payment processing...');

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
                //Console.log("paymentDetails.paymenttype_id", paymentDetails.paymenttype_id);

                const paymentData = {
                    userId: userId, // Assuming the user ID is returned from the registration response
                    amount: totalPaidAmount, // Replace with actual amount
                    currency: currency || 'INR', // Replace with actual currency
                    paymenttype_id: paymentDetails.paymenttype_id || 6, // From form
                    conference_fees: paymentDetails.conference_fees, // From form
                    productinfo: 'Conference Registration', // Required by PayU
                    firstname: values.cs_first_name + '' + values.cs_last_name, // Required by PayU
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
                //Console.log("paymentDetails.payment_mode", paymentDetails.payment_mode);


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

                    //Console.log('Payment response:', paymentResponse.data);

                    // Handle the response, e.g., redirect to PayU URL if successful
                    if (paymentResponse.data.success) {
                        // Navigate to the PaymentPage component using 'useNavigate'
                        const paymentUrl = paymentResponse.data.paymentUrl;
                        const payUData = paymentResponse.data.payUData;
                        const paymentGateway = paymentResponse.data.paymentGateway;

                        navigate(`${process.env.PUBLIC_URL}/confirm-payment/Consoft`, { state: { payUData, paymentUrl, paymentGateway } }); // Use navigate instead of history.push
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
            //Console.error('Error:', error.message);
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
            //Console.log("KHUSH", response.data);
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
            const fetchaddedpaymentmode = response.data.paymentmode[0];
            const { workshoptype: fetchworkshoptype } = response.data;




            //Console.log("Fetched fetchregcat Amount", fetchregcat);


            // Get the current date
            const currentDate = new Date();

            // Filter ticket amounts based on the current date
            const filteredTicketAmount = fetchTicketAmount.filter(ticket => {
                const startDate = new Date(ticket.tick_duration_start_date);
                const endDate = new Date(ticket.tick_duration_till_date);
                return startDate <= currentDate && endDate >= currentDate;
            });

            // Log filtered ticket amounts
            //Console.log("Filtered Ticket Amount", fetchgstamount.cs_value);

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
            setaddedpaymentmode(fetchaddedpaymentmode.cs_value);
            setworkshoptype(fetchworkshoptype);




            //Console.log("gstamount", gstamount);

        } catch (error) {
            //Console.error('Error fetching dropdown data:', error);
            setLoading(false);
        }
    };



    const handleNavigation = () => {
        navigate(`${process.env.PUBLIC_URL}/user-dashboard/Consoft`);
    };



    // useEffect(() => {
    //     const filterTickets = () => {
    //         if (category) {
    //             const parsedCategory = JSON.parse(category); // Parse the category

    //             //Console.log("Parsed Cat", parsedCategory);

    //             const filtered = ticket.filter(ticket => {
    //                 // Check if ticket_category is valid
    //                 if (ticket.ticket_category && ticket.ticket_category !== 'null') {
    //                     try {
    //                         const ticketCategories = JSON.parse(ticket.ticket_category); // Parse ticket_category
    //                         return Array.isArray(ticketCategories) && ticketCategories.includes(parsedCategory); // Ensure it's an array and includes the category
    //                     } catch (e) {
    //                         //Console.error("Error parsing ticket category:", e);
    //                         return false; // Return false if parsing fails
    //                     }
    //                 }
    //                 return false; // If ticket_category is null or invalid, return false
    //             });
    //             //Console.log("Filtered", filtered);
    //             setFilteredTickets(filtered); // Set filtered tickets
    //         } else {
    //             setFilteredTickets([]); // If no category, show all tickets
    //         }
    //     };

    //     const filterAddon = () => {
    //         if (addonticket) {
    //             const parsedAddon = JSON.parse(addonticket); // Parse the selected addon ticket
    //             //Console.log("Addon:", parsedAddon);

    //             // Find the matching ticket based on the addon ticket ID
    //             const matchedTicket = ticketAmount.find(ticketItem => ticketItem.ticket_id === parsedAddon);
    //             //Console.log("Matched", matchedTicket);
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

    //                     //Console.log("Matched Ticket Amount:", amount);
    //                     //Console.log("Processing Fee Amount:", processingAmount);
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

    //                 //Console.log("Matched Ticket Amount:", amount);
    //                 //Console.log("Processing Fee Amount:", processingAmount);
    //                 //Console.log("GST Amount:", gstAmount);
    //                 //Console.log("Total Amount with GST:", totalAmount);
    //                 // //Console.log("Processing Fee Amount:", processingFeeAmount);
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
    //                         //Console.log("Parsed Ticket Addon IDs:", parsedTicketIds);
    //                         return Array.isArray(parsedTicketIds) && parsedTicketIds.includes(parsedAddon);
    //                     } catch (e) {
    //                         //Console.error("Error parsing addon ticket IDs:", e);
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
                //Console.log("Parsed Cat", parsedCategory);

                const filtered = ticket.filter(ticket => {
                    if (ticket.ticket_category && ticket.ticket_category !== 'null') {
                        try {
                            const ticketCategories = JSON.parse(ticket.ticket_category); // Parse ticket_category
                            return Array.isArray(ticketCategories) && ticketCategories.includes(parsedCategory);
                        } catch (e) {
                            //Console.error("Error parsing ticket category:", e);
                            return false;
                        }
                    }
                    return false;
                });
                //Console.log("Filtered", filtered);
                setFilteredTickets(filtered);
            } else {
                setFilteredTickets([]);
            }
        };

        // const filterAddon = () => {
        //     if (addonticket) {
        //         const parsedAddon = JSON.parse(addonticket);
        //         console.log("Addon:", parsedAddon);

        //         const matchedTicket = ticketAmount.find(ticketItem => ticketItem.ticket_id === parsedAddon);
        //         //Console.log("Matched", matchedTicket);

        //         if (matchedTicket) {
        //             const amount = parseFloat(matchedTicket.tick_amount);
        //             setRegAmount(amount);

        //             let gstAmount = 0;
        //             let processingAmount = 0;
        //             let totalAmount = amount;

        //             // Calculate GST first
        //             if (gstfee === 'Yes') {
        //                 // gstAmount = (amount * parseFloat(gstpercentage)) / 100;
        //                 //Console.log("GST Amount:", gstAmount);

        //                 // if (gstinclded === 'No') {
        //                 //     totalAmount += gstAmount; // Add GST to total if excluded
        //                 // }
        //                 if (gstinclded === 'Yes') {
        //                     if (processinginclded === 'Include') {
        //                         // Eliminate the processing fee before calculating GST
        //                         let baseAmountWithoutProcessing = amount;
        //                         if (processingfeeornot === 'Yes') {
        //                             if (processingfeein === 'Percentage') {
        //                                 processingAmount = (amount * parseFloat(processingFee.cs_value)) / 100 ;
        //                             } else {
        //                                 processingAmount = parseFloat(processingFee.cs_value);
        //                             }

        //                             baseAmountWithoutProcessing -= processingAmount; // Subtract processing fee from the base amount
        //                         }

        //                         // Calculate GST on the base amount without processing fee
        //                         gstAmount = (baseAmountWithoutProcessing * parseFloat(gstpercentage)) / (100 + parseFloat(gstpercentage));
        //                         totalAmount = baseAmountWithoutProcessing - gstAmount; // Update total amount after GST calculation
        //                     }
        //                 } else {
        //                     // GST is excluded; normal processing
        //                     gstAmount = (amount * parseFloat(gstpercentage)) / 100;
        //                     totalAmount += gstAmount; // Add GST to total if excluded
        //                 }
        //             }

        //             setgstamount(gstAmount); // Store the calculated GST amount
        //             setProcessingAmount(processingAmount);

        //             // Now calculate the processing fee on the new total (amount + GST)
        //             if (processingfeeornot === 'Yes') {
        //                 if (processinginclded === 'Exclude') {
        //                 processingAmount =
        //                     processingfeein === 'Percentage'
        //                         ? (totalAmount * parseFloat(processingFee.cs_value)) / 100
        //                         : parseFloat(processingFee.cs_value);
        //                 }

        //                 totalAmount =
        //                     processinginclded === 'Exclude'
        //                         ? totalAmount + processingAmount // Add processing fee if excluded
        //                         : totalAmount;

        //                 setProcessingAmount(processingAmount);
        //             } else {
        //                 setProcessingAmount(0);
        //             }

        //             settotalPaidAmount(totalAmount);

        //             //Console.log("Matched Ticket Amount:", amount);
        //             //Console.log("GST Amount:", gstAmount);
        //             //Console.log("Processing Fee Amount:", processingAmount);
        //             //Console.log("Total Amount with GST and Processing Fee:", totalAmount);
        //         } else {
        //             setRegAmount(0);
        //             setProcessingAmount(0);
        //             settotalPaidAmount(0);
        //             setgstamount(0);
        //         }

        const filterAddon = () => {
            if (addonticket) {
                const parsedAddon = JSON.parse(addonticket);
                console.log("Addon:", parsedAddon);

                const matchedTicket = ticketAmount.find(ticketItem => ticketItem.ticket_id === parsedAddon);

                if (matchedTicket) {
                    const amount = parseFloat(matchedTicket.tick_amount);
                    let gstAmount = 0;
                    let processingAmount = 0;
                    let regAmount = amount; // Initialize regAmount with the base ticket amount
                    let totalAmount = amount; // Initialize totalAmount with the base ticket amount

                    // Calculate GST and adjust regAmount
                    if (gstfee === 'Yes') {
                        console.log("processingAmount1", gstinclded);
                        if (gstinclded === 'Yes') {
                            console.log("processingAmount2", processingfeeornot);
                            if (processingfeeornot === 'Yes') {
                                console.log("processingAmount3", processinginclded);
                                let baseAmountWithoutProcessing = amount;
                                if (processinginclded === 'Include') {
                                    // Eliminate processing fee before calculating GST
                                    console.log("processingAmount4", processingAmount);

                                    if (processingfeeornot === 'Yes') {
                                        if (processingfeein === 'Percentage') {
                                            processingAmount = (amount * parseFloat(processingFee.cs_value)) / 100;
                                            console.log("processingAmount", processingAmount);
                                        } else {
                                            processingAmount = parseFloat(processingFee.cs_value);
                                        }

                                        baseAmountWithoutProcessing -= processingAmount; // Subtract processing fee from base
                                        setProcessingAmount(processingAmount);
                                    }

                                    gstAmount = (baseAmountWithoutProcessing * parseFloat(gstpercentage)) / (100);
                                    regAmount = baseAmountWithoutProcessing - gstAmount; // Adjust regAmount after GST
                                } else {
                                    // If processing fee is not included, calculate GST directly on the amount
                                    gstAmount = (baseAmountWithoutProcessing * parseFloat(gstpercentage)) / (100);
                                    console.log("gstAmount", gstAmount);
                                    regAmount = baseAmountWithoutProcessing - gstAmount; // Adjust regAmount after GST
                                }
                            }
                            else {
                                // If processing fee is not included, calculate GST directly on the amount
                                gstAmount = (amount * parseFloat(gstpercentage)) / (100);
                                regAmount = amount - gstAmount; // Adjust regAmount after GST
                            }
                        }


                        else {
                            // GST is excluded; normal processing
                            // gstAmount = (amount * parseFloat(gstpercentage)) / 100;
                            // console.log("gstAmount12", gstAmount);
                            // totalAmount += gstAmount; // Add GST to total if excluded


                            if (processingfeeornot === 'Yes') {
                                console.log("processingAmount31", processinginclded);
                                let baseAmountWithoutProcessing = amount;
                                if (processinginclded === 'Include') {
                                    // Eliminate processing fee before calculating GST
                                    console.log("processingAmount41", processingfeein);


                                    if (processingfeein === 'Percentage') {
                                        processingAmount = (amount * parseFloat(processingFee.cs_value)) / 100;
                                        console.log("processingAmount", processingAmount);
                                    } else {
                                        processingAmount = parseFloat(processingFee.cs_value);
                                    }

                                    baseAmountWithoutProcessing -= processingAmount; // Subtract processing fee from base
                                    setProcessingAmount(processingAmount);


                                    gstAmount = (baseAmountWithoutProcessing * parseFloat(gstpercentage)) / (100);
                                    totalAmount += gstAmount;
                                } else {
                                    // If processing fee is not included, calculate GST directly on the amount
                                    gstAmount = (amount * parseFloat(gstpercentage)) / 100;
                                    console.log("gstAmount12", gstAmount);
                                    totalAmount += gstAmount; // Add GST to total if excluded
                                }
                            }
                            else {
                                // If processing fee is not included, calculate GST directly on the amount
                                gstAmount = (amount * parseFloat(gstpercentage)) / 100;
                                console.log("gstAmount12", gstAmount);
                                totalAmount += gstAmount;
                            }
                        }
                    }



                    setgstamount(gstAmount); // Store the calculated GST amount

                    // Calculate processing fee
                    if (processingfeeornot === 'Yes') {
                        if (processinginclded === 'Exclude') {
                            processingAmount =
                                processingfeein === 'Percentage'
                                    ? (totalAmount * parseFloat(processingFee.cs_value)) / 100
                                    : parseFloat(processingFee.cs_value);

                            console.log("processingAmount2", processingAmount);

                            totalAmount += processingAmount; // Add processing fee if excluded
                        } else {
                            processingAmount =
                                processingfeein === 'Percentage'
                                    ? (totalAmount * parseFloat(processingFee.cs_value)) / 100
                                    : parseFloat(processingFee.cs_value);

                        }

                        setProcessingAmount(processingAmount);
                    } else {
                        setProcessingAmount(0);
                    }

                    setRegAmount(regAmount); // Adjusted registration amount
                    settotalPaidAmount(totalAmount); // Total amount for display or further calculations
                } else {
                    // Reset values if no match is found
                    setRegAmount(0);
                    setProcessingAmount(0);
                    settotalPaidAmount(0);
                    setgstamount(0);
                }



                const filtered = addon.filter(addon => {
                    if (addon.addon_ticket_ids && addon.addon_ticket_ids !== 'null') {
                        try {
                            // Convert {2,4,3} to [2,4,3] format
                            const normalizedTicketIds = addon.addon_ticket_ids.replace(/{/g, '[').replace(/}/g, ']');
                            const parsedTicketIds = JSON.parse(normalizedTicketIds);
                            //Console.log("Parsed Ticket Addon IDs:", parsedTicketIds);

                            return Array.isArray(parsedTicketIds) && parsedTicketIds.includes(parsedAddon);
                        } catch (e) {
                            //Console.error("Error parsing addon ticket IDs:", e);
                            return false;
                        }
                    }
                    return false;
                });
                console.log("withoutfiltered", addon);
                console.log("filtered", filtered);
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
    }, [category, addonticket]);

    useEffect(() => {
        console.log("selectedWorkshops", selectedWorkshops);
    }, [selectedWorkshops]);




    const calculateAndSetAmounts = (matchedAddon, isAdding) => {
        const currentAmount = parseFloat(regAmount);
        const addonAmountToAdd = parseFloat(matchedAddon.addon_amount);
        let totalAmount = isAdding ? currentAmount + addonAmountToAdd : currentAmount - addonAmountToAdd;
        let regAmount1 = isAdding ? currentAmount + addonAmountToAdd : currentAmount - addonAmountToAdd;
        let gstAmount = 0;
        let processingFeeAmount = 0;
        let processingAmount = 0;

        // Calculate GST if applicable
        // if (gstfee === 'Yes') {
        //     gstAmount = (totalAmount * parseFloat(gstpercentage)) / 100;
        //     if (gstinclded === 'No') {
        //         totalAmount += gstAmount; // Add GST to total if it is not included
        //     }
        //     setgstamount(gstAmount);
        // }
        if (gstfee === 'Yes') {
            if (gstinclded === 'Yes') {
                if (processingfeeornot === 'Yes') {
                    if (processinginclded === 'Include') {
                        // Eliminate processing fee before calculating GST
                        let baseAmountWithoutProcessing = regAmount1;
                        if (processingfeeornot === 'Yes') {
                            if (processingfeein === 'Percentage') {
                                processingAmount = (regAmount1 * parseFloat(processingFee.cs_value)) / 100;
                                console.log("processingAmount", processingAmount);
                            } else {
                                processingAmount = parseFloat(processingFee.cs_value);
                            }

                            baseAmountWithoutProcessing -= processingAmount; // Subtract processing fee from base
                        }

                        gstAmount = (baseAmountWithoutProcessing * parseFloat(gstpercentage)) / (100);
                        regAmount1 = baseAmountWithoutProcessing - gstAmount; // Adjust regAmount after GST

                    } else {
                        // If processing fee is not included, calculate GST directly on the amount
                        gstAmount = (regAmount1 * parseFloat(gstpercentage)) / (100);
                        regAmount1 = regAmount1 - gstAmount; // Adjust regAmount after GST
                    }
                } else {
                    // If processing fee is not included, calculate GST directly on the amount
                    gstAmount = (regAmount1 * parseFloat(gstpercentage)) / (100);
                    regAmount1 = regAmount1 - gstAmount; // Adjust regAmount after GST
                }

            } else {
                // GST is excluded; normal processing
                gstAmount = (regAmount1 * parseFloat(gstpercentage)) / 100;
                totalAmount += gstAmount; // Add GST to total if excluded
            }
        }

        setgstamount(gstAmount);

        // Calculate Processing Fee if applicable
        // if (processingfeeornot === 'Yes') {
        //     processingFeeAmount = processingfeein === 'Percentage'
        //         ? (totalAmount * parseFloat(processingFee.cs_value)) / 100
        //         : parseFloat(processingFee.cs_value);

        //     if (processinginclded === 'Exclude') {
        //         totalAmount += processingFeeAmount; // Add processing fee to total if excluded
        //     }
        // }

        if (processingfeeornot === 'Yes') {
            console.log("processingAmount", processingAmount);
            if (processinginclded === 'Exclude') {
                processingAmount =
                    processingfeein === 'Percentage'
                        ? (totalAmount * parseFloat(processingFee.cs_value)) / 100
                        : parseFloat(processingFee.cs_value);

                console.log("processingAmount", processingAmount);

                totalAmount += processingAmount; // Add processing fee if excluded
            } else {
                // Processing fee already considered for regAmount when included
                if (processingfeein !== 'Percentage') {
                    processingAmount = parseFloat(processingFee.cs_value);
                }
            }

            setProcessingAmount(processingAmount);
        } else {
            setProcessingAmount(0);
        }

        setRegAmount(regAmount1); // Adjusted registration amount
        settotalPaidAmount(totalAmount);

        // Update all amounts in the state
        // setProcessingAmount(processingFeeAmount);
        setRegAddonAmount(isAdding ? addonAmountToAdd : -addonAmountToAdd); // Adjust addon amount in state based on add/remove
        // setRegAmount(isAdding ? currentAmount + addonAmountToAdd : currentAmount - addonAmountToAdd); // Adjust registration amount
        // settotalPaidAmount(totalAmount); // Set total paid amount including GST and processing fee

        // Debug logs
        console.log("Base Amount:", currentAmount);
        console.log("Addon Amount:", addonAmountToAdd);
        console.log("Registration Amount:", regAmount);
        console.log("GST Amount:", gstAmount);
        console.log("Processing Fee Amount:", processingFeeAmount);
        console.log("Total Amount with GST and Processing Fee:", totalAmount);
    };









    //Console.log("Addon Ticket", addonticket);
    //Console.log("Ticket Amount", ticketAmount);

    const handleNextClick = () => {
        setShowNextStep(true); // Move to the third row and show Submit/Cancel buttons
    };

    const handleBackClick = () => {
        setShowNextStep(false); // Go back to the first and second rows
    };

    const facultyTypeOptions = facultytype.map(status => ({
        value: status.facultytype_id,
        label: status.type_title
    }));
    const exhibitorOptions = exhibitor.map(status => ({
        value: status.exh_id,
        label: status.exh_name
    }));

    const handleImageChange = async (event, type) => {
        const file = event.target.files[0];

        if (file) {
            setFiles(prevFiles => ({ ...prevFiles, [type]: file }));
            setSelectedImage(file); // Update selectedImage state
            const url = URL.createObjectURL(file);
            setIconPreviewUrl(url);
        }
        try {
            await Img(file); // Wait for the Promise to resolve
            setImageError('');
        } catch (error) {
            setSelectedImage(null);
            setImageError(error);
        }
    };
    const handleImageChange1 = async (event, type) => {
        const file = event.target.files[0];
        if (file) {
            setFiles(prevFiles => ({ ...prevFiles, [type]: file }));
            const errorMessage = PDF(file); // Validate the file
            if (errorMessage) {
                setselectedcv(null);
                setImageErrorforcv(errorMessage);
            } else {
                setselectedcv(file); // Update selectedImage state
                setImageErrorforcv('');
                const reader = new FileReader();
                reader.onloadend = () => {
                    setPdfPreview(reader.result);
                };
                reader.readAsDataURL(file);
            }
        } else {
            setselectedcv(null);
            setImageErrorforcv('Please select a file.');
        }
    };



    return (
        <Fragment>
            <Breadcrumbs parentClickHandler={handleNavigation} mainTitle={
                <>
                    Register for Conference
                    {/* <MdInfoOutline
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
                    </UncontrolledPopover> */}
                </>
            } parent="Manage User" title="Create User" />
            <Container fluid={true}>

                <Row>
                    <Col sm={!showNextStep ? "12" : "8"}>
                        <Card>
                            <CardHeader className="d-flex justify-content-between align-items-center flex-column flex-md-row">
                                <div className="mb-2 mb-md-0">
                                    <h5 className="mb-2 text-start">{settingdata.event_name}</h5> {/* Corrected closing tag */}
                                    {settingdata.event_start_date && (
                                        <small className="mb-2 text-start">
                                            Conference Date: {moment(settingdata.event_start_date).format('MMM DD, YYYY')}
                                        </small>
                                    )}
                                </div>


                            </CardHeader>
                            <CardBody>
                                {Data?.cs_isconfirm === 0 && Data?.confirm_payment === 0 || Data?.confirm_payment === null ? (

                                    <Form onSubmit={onSubmit}>
                                        {({ handleSubmit }) => (
                                            <form className="needs-validation" noValidate="" onSubmit={handleSubmit}>

                                                {(!showNextStep) && (
                                                    <Row>
                                                        <Col sm="12" className="mb-3">

                                                            <Field
                                                                name={`cs_reg_category`}
                                                                initialValue={Data?.cs_reg_cat_id || ''} // Use optional chaining to avoid errors
                                                            // validate={option}
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
                                                        

                                                                //Console.log("Selected  Registration Option:", selectedOption);
                                                                //Console.log("Registration Options:", options);

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
                                                                                //Console.log("Selected Option:", selectedOption);
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

                                                                    //Console.log("Selected  Registration Option:", selectedOption);
                                                                    //Console.log("Registration Options:", options);

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
                                                                                        filteredTickets.map(ticket => {
                                                                                            // Calculate userTicketCount by filtering registereduser for this ticket's ID
                                                                                            const userTicketCount = registereduser.filter(user => parseInt(user.cs_ticket, 10) === ticket.ticket_id).length;
                                                                                            console.log("userTicketCount for", ticket.ticket_id, userTicketCount);
                                                                                            const isLimitedAndFull = ticket.ticket_type === "Limited" && userTicketCount >= parseInt(ticket.ticket_count);

                                                                                            return (
                                                                                                <tr
                                                                                                    key={ticket.ticket_id}
                                                                                                    className={parseInt(input.value) === ticket.ticket_id ? 'table-active' : ''}
                                                                                                >
                                                                                                    <td className='text-start'>
                                                                                                        <div>
                                                                                                            <strong>{ticket.ticket_title}</strong>
                                                                                                        </div>
                                                                                                        <div>
                                                                                                            {ticket.ticket_ispaid === "0"
                                                                                                                ? 'Free'
                                                                                                                : ticketAmountMap[ticket.ticket_id]
                                                                                                                    ? `$${ticketAmountMap[ticket.ticket_id]}`
                                                                                                                    : <div className="text-danger">Ticket date is expired.</div>
                                                                                                            }
                                                                                                        </div>
                                                                                                        {isLimitedAndFull && (
                                                                                                            <div className="text-danger">There are no more tickets available.</div>
                                                                                                        )}
                                                                                                    </td>
                                                                                                    <td className='text-end'>
                                                                                                        <Button
                                                                                                            color={parseInt(input.value) === ticket.ticket_id ? 'warning' : 'primary'}
                                                                                                            onClick={() => {
                                                                                                                const newTicketId = parseInt(input.value) === ticket.ticket_id ? '' : ticket.ticket_id;
                                                                                                                input.onChange(newTicketId);
                                                                                                                setAddonTicket(newTicketId);
                                                                                                            }}
                                                                                                            disabled={isLimitedAndFull || (ticket.ticket_ispaid === "1" && !ticketAmountMap[ticket.ticket_id])}
                                                                                                        >
                                                                                                            {parseInt(input.value) === ticket.ticket_id ? 'Cancel' : 'Select'}
                                                                                                        </Button>
                                                                                                    </td>
                                                                                                </tr>
                                                                                            );
                                                                                        })
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

                                                                            //Console.log("Selected  Registration Option:", selectedOption);
                                                                            //Console.log("Registration Options:", options);

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
                                                                                            //Console.log("Selected Option:", selectedOption);
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

                                                                                    //Console.log("Selected  Registration Option:", selectedOption);
                                                                                    //Console.log("Registration Options:", options);

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
                                                                                                    //Console.log("Selected Option:", selectedOption);
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


                                                                    {/* {
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

                                                                                    //Console.log("Selected addon Option:", selectedOption);
                                                                                    //Console.log("Registration Options:", options);

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
                                                                                                    //Console.log("Selected Option:", selectedOption);
                                                                                                    input.onChange(selectedOption ? selectedOption.value : '');

                                                                                                    // Find the selected addon amount
                                                                                                    // const matchedAddon = addonAmount.find(addon => addon.addon_id === selectedOption.value);
                                                                                                    // if (matchedAddon) {
                                                                                                    //     const currentAmount = (regAmount);
                                                                                                    //     const addonAmountToAdd = parseFloat(matchedAddon.addon_amount);
                                                                                                    //     const processingPercentage = processingFee.cs_value;
                                                                                                    //     const processingFeeAmount = (currentAmount * processingPercentage) / 100; // Calculate processing fee

                                                                                                    //     setRegAddonAmount(matchedAddon.addon_amount); // Set the amount in regAmount
                                                                                                    //     setRegAmount(currentAmount + addonAmountToAdd);
                                                                                                    //     setProcessingAmount(processingFeeAmount);
                                                                                                    //     settotalPaidAmount(currentAmount + addonAmountToAdd + processingFeeAmount)
                                                                                                    // }
                                                                                                        
                                                                                                        const matchedAddon = addonAmount.find(addon => addon.addon_id === selectedOption.value);
                                                                                                        calculateAndSetAmounts(matchedAddon);
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
                                                                                            onBlur={(e) => {
                                                                                                const trimmedValue = e.target.value.trim(); // Trim leading and trailing spaces on blur
                                                                                                input.onBlur(trimmedValue);
                                                                                                input.onChange(trimmedValue); // Update the form state with the trimmed value
                                                                                            }}



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
                                                                                            onBlur={(e) => {
                                                                                                const trimmedValue = e.target.value.trim(); // Trim leading and trailing spaces on blur
                                                                                                input.onBlur(trimmedValue);
                                                                                                input.onChange(trimmedValue); // Update the form state with the trimmed value
                                                                                            }}

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
                                                                                validate={requiredfield[index] === '1' ? composeValidators(Email) : (value) => composeValidators()(value)}
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
                                                                                            onChange={(e) => {
                                                                                                input.onChange(e); // Update Field's internal state
                                                                                                setEmail(e.target.value); // Update parent component state
                                                                                            }}
                                                                                            onBlur={(e) => {
                                                                                                const trimmedValue = e.target.value.trim(); // Trim leading and trailing spaces on blur
                                                                                                input.onBlur(trimmedValue);
                                                                                                input.onChange(trimmedValue); // Update the form state with the trimmed value
                                                                                            }}

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
                                                            {/* Conditionally show Designation, Bio, and Long Bio fields when selectCat equals 3 */}
                                                            {selectCat === 3 && (
                                                                <>
                                                                    <Col xs={12} sm={6} md={4} className="mb-3">
                                                                        <Field
                                                                            name="facultytype_id"
                                                                        >
                                                                            {({ input, meta }) => {
                                                                                const selectedOption = facultyTypeOptions.find(option => option.value === input.value);

                                                                                console.log("Selected Option", selectedOption);

                                                                                return (
                                                                                    <div>
                                                                                        <Label className='form-label' for="facultytype_id"><strong>Faculty Type<span className="red-asterisk">*</span></strong></Label>
                                                                                        <Select
                                                                                            {...input}
                                                                                            options={facultyTypeOptions}
                                                                                            placeholder={`Select Faculty Type`}
                                                                                            isSearchable={true}
                                                                                            onChange={(value) => {
                                                                                                input.onChange(value);
                                                                                            }}
                                                                                            onBlur={input.onBlur}
                                                                                            classNamePrefix="react-select"
                                                                                            isMulti={false}
                                                                                            value={selectedOption}
                                                                                        />
                                                                                        {meta.error && meta.touched && <p className='d-block text-danger'>{meta.error}</p>}
                                                                                    </div>
                                                                                );
                                                                            }}
                                                                        </Field>
                                                                    </Col>

                                                                    {/* Designation Field */}
                                                                    <Col xs={12} sm={6} md={4} className="mb-3">
                                                                        <Field name="designation">
                                                                            {({ input, meta }) => (
                                                                                <div>
                                                                                    <Label className='form-label' htmlFor="designation"><strong>Designation</strong></Label>
                                                                                    <input
                                                                                        {...input}
                                                                                        className="form-control"
                                                                                        id="designation"
                                                                                        type="text"
                                                                                        placeholder="Enter designation"
                                                                                        onChange={(e) => {
                                                                                            input.onChange(e); // Trigger onChange of the Field component
                                                                                        }}
                                                                                    />
                                                                                    {meta.error && meta.touched && <p className='d-block text-danger'>{meta.error}</p>}
                                                                                </div>
                                                                            )}
                                                                        </Field>
                                                                    </Col>

                                                                    {/* Bio Field */}
                                                                    <Col xs={12} sm={6} md={4} className="mb-3">
                                                                        <Field name="description"
                                                                            validate={composeValidators(shortbio)}
                                                                        >
                                                                            {({ input, meta }) => (
                                                                                <div>
                                                                                    <Label className='form-label' htmlFor="description">
                                                                                        <strong>Bio <span className="red-asterisk">*</span></strong>
                                                                                        <small> (250 Words)</small>
                                                                                    </Label>
                                                                                    <Input
                                                                                        {...input}
                                                                                        type="textarea"
                                                                                        id="description"
                                                                                        placeholder="Enter Faculty description"
                                                                                    />
                                                                                    {meta.error && meta.touched && <p className='d-block text-danger'>{meta.error}</p>}
                                                                                </div>
                                                                            )}
                                                                        </Field>
                                                                    </Col>

                                                                    {/* Long Bio Field */}
                                                                    <Col xs={12} sm={6} md={4} className="mb-3">
                                                                        <Field name="long_description"
                                                                            validate={composeValidators(longbio)}
                                                                            initialValue={''}

                                                                        >
                                                                            {({ input, meta }) => (
                                                                                <div>
                                                                                    <Label className='form-label' htmlFor="longdescription">
                                                                                        <strong>Long Bio</strong><small>(1000 Words)</small>
                                                                                    </Label>
                                                                                    <Input
                                                                                        {...input}
                                                                                        type="textarea"
                                                                                        id="longdescription"
                                                                                        placeholder="Enter Faculty Long description"
                                                                                    />
                                                                                    {meta.error && meta.touched && <p className='d-block text-danger'>{meta.error}</p>}
                                                                                </div>
                                                                            )}
                                                                        </Field>
                                                                    </Col>

                                                                    {/* Faculty Profile */}
                                                                    <Col xs={12} sm={6} md={4} className="mb-3">
                                                                        <div>
                                                                            <Label for="photo"><strong>Profile Image</strong></Label>
                                                                            <Input
                                                                                type="file"
                                                                                name="photo"
                                                                                onChange={(event) => handleImageChange(event, 'photo')}
                                                                            />
                                                                            {imageError && <p style={{ color: 'red' }}>{imageError}</p>}
                                                                            {!imageError && (iconPreviewUrl || Faculty.photo) && (
                                                                                <p
                                                                                    ref={iconAvailableRef}
                                                                                    style={{ color: 'green', cursor: 'pointer' }}
                                                                                    onMouseEnter={() => setLogoOpen(true)}
                                                                                    onMouseLeave={() => setLogoOpen(false)}
                                                                                >
                                                                                    ✔️ Faculty Profile Preview
                                                                                </p>
                                                                            )}


                                                                            <Popover
                                                                                placement="right"
                                                                                isOpen={logoOpen}
                                                                                target={iconAvailableRef.current} // Use ref for the target
                                                                                toggle={() => setLogoOpen(!logoOpen)}
                                                                            >
                                                                                <PopoverHeader>Faculty Profile Preview</PopoverHeader>
                                                                                {/* <PopoverBody>
                                                                             <img src={`${BackendPath}${item.exh_logo}`} alt="Current Exhibitor Icon" style={{ maxWidth: '200px' }} />
                                                                         </PopoverBody> */}
                                                                                <PopoverBody>
                                                                                    {iconPreviewUrl ? (
                                                                                        <img src={iconPreviewUrl} alt="Current faculty Icon" style={{ maxWidth: '200px' }} />
                                                                                    ) : (
                                                                                        <img src={`${BackendPath}${Faculty.photo}`} alt="Current faculty Icon" style={{ maxWidth: '200px' }} />
                                                                                    )}
                                                                                </PopoverBody>
                                                                            </Popover>
                                                                        </div>
                                                                        {!selectedImage && (
                                                                            <small className="form-text text-muted">
                                                                                <strong>Image Size:</strong> 200KB Max <br />
                                                                                <strong>Dimensions:</strong> 600(H) × 600(W) <br />
                                                                                <strong>Image Type:</strong> PNG
                                                                            </small>
                                                                        )}
                                                                    </Col>


                                                                    <Col xs={12} sm={6} md={4} className="mb-3">
                                                                        <div>
                                                                            <Label for="resume">
                                                                                <strong>CV</strong>
                                                                            </Label>
                                                                            <Input
                                                                                type="file"
                                                                                name="resume"
                                                                                accept="application/pdf"
                                                                                onChange={(event) => handleImageChange1(event, 'resume')}
                                                                            />
                                                                            {imageErrorforcv && <p style={{ color: 'red' }}>{imageErrorforcv}</p>}
                                                                            {pdfPreview && (
                                                                                <div>
                                                                                    <p style={{ color: 'green' }}>Preview:</p>
                                                                                    <embed
                                                                                        src={pdfPreview}
                                                                                        type="application/pdf"
                                                                                        width="100%"
                                                                                        height="200px"
                                                                                    // style={{ border: '1px solid #ccc' }}
                                                                                    />
                                                                                </div>
                                                                            )}
                                                                            {Faculty.resume && !imageErrorforcv && (
                                                                                <div>
                                                                                    {/* <p style={{ color: 'green' }}>Current CV:</p> */}
                                                                                    <a href={`${BackendPath}${Faculty.resume}`} target="_blank" rel="noopener noreferrer" style={{ color: 'green', cursor: 'pointer' }}>
                                                                                        ✔️ Click to open Current CV
                                                                                    </a>
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                    </Col>
                                                                </>
                                                            )}
                                                            {selectCat === 4 && (
                                                                <>
                                                                    <Col xs={12} sm={6} md={4} className="mb-3">
                                                                        <Field
                                                                            name="exh_id"
                                                                        >
                                                                            {({ input, meta }) => {
                                                                                const selectedOption = exhibitorOptions.find(option => option.value === input.value);

                                                                                console.log("Selected Option", selectedOption);

                                                                                return (
                                                                                    <div>
                                                                                        <Label className='form-label' for="exh_id"><strong>Exhibitor<span className="red-asterisk">*</span></strong></Label>
                                                                                        <Select
                                                                                            {...input}
                                                                                            options={exhibitorOptions}
                                                                                            placeholder={`Select Exhibitor`}
                                                                                            isSearchable={true}
                                                                                            onChange={(value) => {
                                                                                                input.onChange(value);
                                                                                            }}
                                                                                            onBlur={input.onBlur}
                                                                                            classNamePrefix="react-select"
                                                                                            isMulti={false}
                                                                                            value={selectedOption}
                                                                                        />
                                                                                        {meta.error && meta.touched && <p className='d-block text-danger'>{meta.error}</p>}
                                                                                    </div>
                                                                                );
                                                                            }}
                                                                        </Field>
                                                                    </Col>


                                                                </>
                                                            )}
                                                        </Row>
                                                    )}
                                                    {(showNextStep) && (

                                                        <Row>
                                                            <Col md="12">
                                                                <Field
                                                                    name="cs_addons"
                                                                    initialValue={Data?.cs_addons || ''}

                                                                >
                                                                    {({ input, meta, form }) => {
                                                                        const selectedOptions = input.value ? input.value.split(',').map(id => parseInt(id)) : [];
                                                                        console.log("current selected addon", selectedOptions);

                                                                        const toggleAddon = (addonId, addonName, addonCatType, workshopId) => {
                                                                            const isSelected = selectedOptions.includes(addonId);
                                                                            const updatedOptions = isSelected
                                                                                ? selectedOptions.filter(id => id !== addonId)
                                                                                : [...selectedOptions, addonId];

                                                                            input.onChange(updatedOptions.join(','));

                                                                            setSelectedAddonNames(prevNames =>
                                                                                isSelected
                                                                                    ? prevNames.filter(name => name !== addonName)
                                                                                    : [...prevNames, addonName]
                                                                            );

                                                                            if (addonCatType === "1") {
                                                                                setWorkshopCategory1(isSelected ? '' : workshopId);
                                                                            } else if (addonCatType === "2") {
                                                                                setAddonCounts(prevCounts => ({
                                                                                    ...prevCounts,
                                                                                    [addonId]: isSelected ? 0 : (prevCounts[addonId] || 1),
                                                                                }));
                                                                                setAddonFormData(prevData => ({
                                                                                    ...prevData,
                                                                                    [addonId]: isSelected ? [] : (prevData[addonId] || [{ name: '', age: '' }]),
                                                                                }));
                                                                            }
                                                                        };
                                                                        const handleAddPerson = (addonId, count) => {
                                                                            setAddonCounts(prevCounts => ({
                                                                                ...prevCounts,
                                                                                [addonId]: count,
                                                                            }));

                                                                            setAddonFormData(prevData => ({
                                                                                ...prevData,
                                                                                [addonId]: Array.from({ length: count }, () => ({ name: '', age: '' })),
                                                                            }));
                                                                        };



                                                                        const handleInputChange = (addonId, index, field, value) => {
                                                                            setAddonFormData(prevData => ({
                                                                                ...prevData,
                                                                                [addonId]: prevData[addonId].map((entry, idx) =>
                                                                                    idx === index ? { ...entry, [field]: value } : entry
                                                                                ),
                                                                            }));
                                                                        };

                                                                        // const incrementCount = (addon, addonId) => {
                                                                        //     handleCountChange(addon, addonId, (addonCounts[addonId] || 0) + 1);
                                                                        // };

                                                                        // // Function to decrement count
                                                                        // const decrementCount = (addon, addonId) => {
                                                                        //     handleCountChange(addon, addonId, Math.max((addonCounts[addonId] || 0) - 1, 0));
                                                                        // };


                                                                        const incrementCount = (addon, addonId) => {
                                                                            // handleCountChange(addon, addonId, (addonCounts[addonId] || 0) + 1);
                                                                            const currentCount = addonCounts[addonId] || 0;
                                                                            if (currentCount < 0) {
                                                                                handleCountChange(addon, addonId, (addonCounts[addonId] || 0) + 1);
                                                                            } else {
                                                                                // When count reaches 0, remove the addonId from selectedOptions
                                                                                const isSelected = selectedOptions.includes(addonId);
                                                                                if (!isSelected) {
                                                                                    const updatedOptions = [...selectedOptions, addonId];
                                                                                    input.onChange(updatedOptions.join(','));
                                                                                    setSelectedAddonNames(prevNames => [...prevNames, addon.name]);
                                                                                }
                                                                                // Update addonCounts to 0 for the addonId
                                                                                handleCountChange(addon, addonId, (addonCounts[addonId] || 0) + 1);
                                                                            }
                                                                        };

                                                                        // Function to decrement count
                                                                        const decrementCount = (addon, addonId) => {
                                                                            // handleCountChange(addon, addonId, Math.max((addonCounts[addonId] || 0) - 1, 0));
                                                                            const currentCount = addonCounts[addonId] || 0;
                                                                            if (currentCount > 1) {
                                                                                handleCountChange(addon, addonId, currentCount - 1);
                                                                            } else {
                                                                                // When count reaches 0, remove the addonId from selectedOptions
                                                                                const updatedOptions = selectedOptions.filter(id => id !== addonId);
                                                                                input.onChange(updatedOptions.join(','));

                                                                                // Remove the addon name from selectedAddonNames
                                                                                setSelectedAddonNames(prevNames => prevNames.filter(name => name !== addon.name));

                                                                                // Update addonCounts to 0 for the addonId
                                                                                handleCountChange(addon, addonId, 0);
                                                                            }
                                                                        };

                                                                        // Handle count change with direct input or increment/decrement
                                                                        const handleCountChange = (addon, addonId, newCount) => {

                                                                            console.log("addon:", addon);  // Log the addon object to check its structure
                                                                            console.log("addonId:", addonId);  // Log
                                                                            // Parse newCount to ensure it's a number
                                                                            const parsedNewCount = parseInt(newCount, 10);

                                                                            // Get the previous count and calculate if we are adding or subtracting
                                                                            const previousCount = addonCounts[addonId] || 0;
                                                                            const isAdding = parsedNewCount > previousCount;
                                                                            const countDifference = Math.abs(parsedNewCount - previousCount);

                                                                            // Retrieve the max limit if the addon has a limited number of accompanying persons


                                                                            // Retrieve the max limit if the addon has a limited number of accompanying persons
                                                                            const maxLimit = addon.addon_accper_type === "Limited" ? addon.addon_accper_limit : undefined;

                                                                            console.log("maxLimit:", maxLimit);  // Log maxLimit for debugging

                                                                            // If maxLimit is defined, use Math.min to ensure the new count doesn't exceed it
                                                                            const validatedCount = maxLimit ? Math.min(parsedNewCount, maxLimit) : parsedNewCount;

                                                                            // Update the addonCounts state with the validated count
                                                                            setAddonCounts(prevCounts => ({ ...prevCounts, [addonId]: validatedCount }));

                                                                            // Adjust the form data entries based on the validated count
                                                                            setAddonFormData(prevData => ({
                                                                                ...prevData,
                                                                                [addonId]: Array.from({ length: validatedCount }, (_, i) => prevData[addonId]?.[i] || { name: '', age: '' })
                                                                            }));

                                                                            const matchedAddon = addonAmount.find(item => item.addon_id === addonId);

                                                                            // Call `calculateAndSetAmounts` the necessary number of times
                                                                            if (matchedAddon) {
                                                                                for (let i = 0; i < countDifference; i++) {
                                                                                    calculateAndSetAmounts(matchedAddon, isAdding);
                                                                                }
                                                                            }
                                                                        };



                                                                        // return (
                                                                        //     <div>
                                                                        //         <Label className='form-label' htmlFor="cs_addons">
                                                                        //             <strong>Addons</strong><span className="text-danger"> *</span>
                                                                        //         </Label>

                                                                        //         <div className="addon-cards-container">
                                                                        //             {filteredAddon.map((addon) => {
                                                                        //                 const userTicketCount = registereduser.filter(user => user.cs_ticket === ticket.ticket_id).length;
                                                                        //                 // Current count of addon
                                                                        //                 const isLimitedAndFull = addon.addon_type === "Limited" && addon.addon_count <= userTicketCount;


                                                                        //                 return (
                                                                        //                     <React.Fragment key={addon.addon_id}>
                                                                        //                         <Card className="mb-3">
                                                                        //                             <CardBody className="d-flex justify-content-between align-items-center">
                                                                        //                                 <div>
                                                                        //                                     <h5 className="mb-1">{addon.addon_title}</h5>
                                                                        //                                     {/* <p className="mb-0">Price: ${AddonAmountMap[addon.addon_id] || 'N/A'}</p> */}
                                                                        //                                     <div>
                                                                        //                                         {addon.addon_ispaid === 0
                                                                        //                                             ? 'Free'
                                                                        //                                             : AddonAmountMap[addon.addon_id]
                                                                        //                                                 ? `$${AddonAmountMap[addon.addon_id]}`
                                                                        //                                                 : <div className="text-danger">Addon date is expired.</div>
                                                                        //                                         }
                                                                        //                                     </div>
                                                                        //                                     {isLimitedAndFull && (
                                                                        //                                         <div className="text-danger">There are no more seats available for this addon.</div>
                                                                        //                                     )}
                                                                        //                                 </div>
                                                                        //                                 <div className="addon-controls">
                                                                        //                                     {addon.addon_cat_type === "2" ? (
                                                                        //                                         <div className="d-flex align-items-center mb-2">
                                                                        //                                             <button
                                                                        //                                                 type="button"
                                                                        //                                                 className="btn btn-outline-secondary"
                                                                        //                                                 onClick={() => {
                                                                        //                                                     const isAdding = false;
                                                                        //                                                     decrementCount(addon, addon.addon_id);
                                                                        //                                                     const matchedAddon = addonAmount.find(item => item.addon_id === addon.addon_id);
                                                                        //                                                     if (matchedAddon) {
                                                                        //                                                         calculateAndSetAmounts(matchedAddon, isAdding);
                                                                        //                                                     }
                                                                        //                                                 }}
                                                                        //                                                 disabled={(addonCounts[addon.addon_id] || 0) <= 0}
                                                                        //                                             >
                                                                        //                                                 -
                                                                        //                                             </button>
                                                                        //                                             <input
                                                                        //                                                 type="number"
                                                                        //                                                 className="form-control mx-2 text-center"
                                                                        //                                                 style={{ width: '60px' }}
                                                                        //                                                 value={addonCounts[addon.addon_id] || 0}
                                                                        //                                                 onChange={(e) => handleCountChange(addon, addon.addon_id, e.target.value)}
                                                                        //                                                 min="0"
                                                                        //                                                 max={addon.addon_accper_type === "Limited" ? addon.addon_accper_limit : undefined}
                                                                        //                                             />
                                                                        //                                             <button
                                                                        //                                                 type="button"
                                                                        //                                                 className="btn btn-outline-secondary"
                                                                        //                                                 onClick={() => {
                                                                        //                                                     const isAdding = !selectedOptions.includes(addon.addon_id);
                                                                        //                                                     incrementCount(addon, addon.addon_id);
                                                                        //                                                     const matchedAddon = addonAmount.find(item => item.addon_id === addon.addon_id);
                                                                        //                                                     if (matchedAddon) {
                                                                        //                                                         calculateAndSetAmounts(matchedAddon, isAdding);
                                                                        //                                                     }
                                                                        //                                                 }}
                                                                        //                                                 disabled={addon.addon_accper_type === "Limited" && addonCounts[addon.addon_id] >= addon.addon_accper_limit}
                                                                        //                                             >
                                                                        //                                                 +
                                                                        //                                             </button>
                                                                        //                                         </div>
                                                                        //                                     ) : (
                                                                        //                                         <button
                                                                        //                                             type="button"
                                                                        //                                             className={`btn ${selectedOptions.includes(addon.addon_id) ? 'btn-danger' : 'btn-primary'}`}
                                                                        //                                             onClick={() => {
                                                                        //                                                 const isAdding = !selectedOptions.includes(addon.addon_id);
                                                                        //                                                 toggleAddon(addon.addon_id, addon.addon_title, addon.addon_cat_type, addon.addon_workshop_id);
                                                                        //                                                 const matchedAddon = addonAmount.find(item => item.addon_id === addon.addon_id);
                                                                        //                                                 if (matchedAddon) {
                                                                        //                                                     calculateAndSetAmounts(matchedAddon, isAdding);
                                                                        //                                                 }
                                                                        //                                             }}
                                                                        //                                             disabled={isLimitedAndFull || (addon.addon_ispaid === 1 && !AddonAmountMap[addon.addon_id])}
                                                                        //                                         >
                                                                        //                                             {selectedOptions.includes(addon.addon_id) ? '- Remove' : '+ Add'}
                                                                        //                                         </button>
                                                                        //                                     )}
                                                                        //                                 </div>
                                                                        //                             </CardBody>
                                                                        //                         </Card>

                                                                        //                         {/* Separate accompanying persons container */}
                                                                        //                         {addon.addon_cat_type === "2" && addonFormData[addon.addon_id] && addonFormData[addon.addon_id].length > 0 && (
                                                                        //                             <Card className="mb-3 accompany-persons-card">
                                                                        //                                 <CardBody>
                                                                        //                                     <h6 className="mb-3">Accompanying Persons</h6>
                                                                        //                                     <div className="accompany-persons-container">
                                                                        //                                         {addonFormData[addon.addon_id].map((person, index) => (
                                                                        //                                             <div key={index} className="d-flex align-items-center mb-3">
                                                                        //                                                 <span className="me-3" style={{ minWidth: '150px' }}>Accompany Person {index + 1}</span>
                                                                        //                                                 <input
                                                                        //                                                     type="text"
                                                                        //                                                     placeholder="Name"
                                                                        //                                                     value={person.name || ''}
                                                                        //                                                     onChange={(e) => handleInputChange(addon.addon_id, index, 'name', e.target.value)}
                                                                        //                                                     className="form-control me-3"
                                                                        //                                                     style={{ maxWidth: '250px' }}
                                                                        //                                                 />
                                                                        //                                                 <input
                                                                        //                                                     type="number"
                                                                        //                                                     placeholder="Age"
                                                                        //                                                     value={person.age || ''}
                                                                        //                                                     onChange={(e) => handleInputChange(addon.addon_id, index, 'age', e.target.value)}
                                                                        //                                                     className="form-control"
                                                                        //                                                     style={{ maxWidth: '80px' }}
                                                                        //                                                 />
                                                                        //                                             </div>
                                                                        //                                         ))}
                                                                        //                                     </div>
                                                                        //                                 </CardBody>
                                                                        //                             </Card>
                                                                        //                         )}

                                                                        //                     </React.Fragment>
                                                                        //                 );
                                                                        //             })}
                                                                        //         </div>


                                                                        //         {meta.error && meta.touched && <p className='d-block text-danger'>{meta.error}</p>}
                                                                        //     </div>
                                                                        // );

                                                                        return (
                                                                            <div>
                                                                                <Label className="form-label" htmlFor="cs_addons">
                                                                                    <strong>Addons</strong><span className="text-danger"> *</span>
                                                                                </Label>

                                                                                {Object.entries(
                                                                                    filteredAddon.reduce((acc, addon) => {
                                                                                        const key = addon.addon_workshoprtype_id; // Group by this ID
                                                                                        if (!acc[key]) acc[key] = [];
                                                                                        acc[key].push(addon);
                                                                                        return acc;
                                                                                    }, {})
                                                                                ).map(([addon_workshoprtype_id, groupedAddons]) => {
                                                                                    // Check if any addon in the group has addon_cat_type === "1"
                                                                                    const showCategoryTitle = groupedAddons.some(addon => addon.addon_cat_type === "1");

                                                                                    const workshopType = workshoptypedata.find(
                                                                                        (type) => type.id === parseInt(addon_workshoprtype_id, 10)
                                                                                    )?.workshoptype_name || "Unknown";

                                                                                    return (

                                                                                        <div key={addon_workshoprtype_id} className="workshop-category">
                                                                                            {showCategoryTitle && (
                                                                                                <h4 className="category-title">Workshop Type: {workshopType}</h4>
                                                                                            )}

                                                                                            {groupedAddons.map(addon => {
                                                                                                const userTicketCount = registereduser.filter(user => user.cs_ticket === ticket.ticket_id).length;
                                                                                                const isLimitedAndFull = addon.addon_type === "Limited" && addon.addon_count <= userTicketCount;

                                                                                                return (
                                                                                                    <React.Fragment key={addon.addon_id}>
                                                                                                        <Card key={addon.addon_id} className="mb-3">
                                                                                                            <CardBody className="d-flex justify-content-between align-items-center">
                                                                                                                <div>
                                                                                                                    <h5 className="mb-1">{addon.addon_title}</h5>
                                                                                                                    <div>
                                                                                                                        {addon.addon_ispaid === 0
                                                                                                                            ? 'Free'
                                                                                                                            : AddonAmountMap[addon.addon_id]
                                                                                                                                ? `$${AddonAmountMap[addon.addon_id]}`
                                                                                                                                : <div className="text-danger">Addon date is expired.</div>
                                                                                                                        }
                                                                                                                    </div>
                                                                                                                    {isLimitedAndFull && (
                                                                                                                        <div className="text-danger">There are no more seats available for this addon.</div>
                                                                                                                    )}
                                                                                                                </div>
                                                                                                                <div className="addon-controls">
                                                                                                                    {addon.addon_cat_type === "2" ? (
                                                                                                                        <div className="d-flex align-items-center mb-2">
                                                                                                                            <button
                                                                                                                                type="button"
                                                                                                                                className="btn btn-outline-secondary"
                                                                                                                                onClick={() => {
                                                                                                                                    const isAdding = false;
                                                                                                                                    decrementCount(addon, addon.addon_id);
                                                                                                                                    const matchedAddon = addonAmount.find(item => item.addon_id === addon.addon_id);
                                                                                                                                    if (matchedAddon) {
                                                                                                                                        calculateAndSetAmounts(matchedAddon, isAdding);
                                                                                                                                    }
                                                                                                                                }}
                                                                                                                                disabled={(addonCounts[addon.addon_id] || 0) <= 0}
                                                                                                                            >
                                                                                                                                -
                                                                                                                            </button>
                                                                                                                            <input
                                                                                                                                type="number"
                                                                                                                                className="form-control mx-2 text-center"
                                                                                                                                style={{ width: '60px' }}
                                                                                                                                value={addonCounts[addon.addon_id] || 0}
                                                                                                                                onChange={(e) => handleCountChange(addon, addon.addon_id, e.target.value)}
                                                                                                                                min="0"
                                                                                                                                max={addon.addon_accper_type === "Limited" ? addon.addon_accper_limit : undefined}
                                                                                                                            />
                                                                                                                            <button
                                                                                                                                type="button"
                                                                                                                                className="btn btn-outline-secondary"
                                                                                                                                onClick={() => {
                                                                                                                                    const isAdding = !selectedOptions.includes(addon.addon_id);
                                                                                                                                    incrementCount(addon, addon.addon_id);
                                                                                                                                    const matchedAddon = addonAmount.find(item => item.addon_id === addon.addon_id);
                                                                                                                                    if (matchedAddon) {
                                                                                                                                        calculateAndSetAmounts(matchedAddon, isAdding);
                                                                                                                                    }
                                                                                                                                }}
                                                                                                                                disabled={addon.addon_accper_type === "Limited" && addonCounts[addon.addon_id] >= addon.addon_accper_limit}
                                                                                                                            >
                                                                                                                                +
                                                                                                                            </button>
                                                                                                                        </div>
                                                                                                                    ) : (

                                                                                                                        // <button
                                                                                                                        //     type="button"
                                                                                                                        //     className={`btn ${selectedOptions.includes(addon.addon_id) || (selectedWorkshops[addon.addon_workshoprtype_id]?.selected_addon_id === addon.addon_id) ? 'btn-danger' : 'btn-primary'}`}
                                                                                                                        //     onClick={() => {
                                                                                                                        //         const isAdding = !selectedOptions.includes(addon.addon_id);
                                                                                                                        //         toggleAddon(addon.addon_id, addon.addon_title, addon.addon_cat_type, addon.addon_workshop_id);
                                                                                                                        //         const matchedAddon = addonAmount.find(item => item.addon_id === addon.addon_id);
                                                                                                                        //         if (matchedAddon) {
                                                                                                                        //             calculateAndSetAmounts(matchedAddon, isAdding);
                                                                                                                        //         }

                                                                                                                        //         // Update the selected workshops state
                                                                                                                        //         setSelectedWorkshops(prev => {
                                                                                                                        //             // Retrieve the current state for the given workshop type ID
                                                                                                                        //             const currentWorkshop = prev[addon.addon_workshoprtype_id] || {};

                                                                                                                        //             // Determine whether to remove or add the addon
                                                                                                                        //             const updatedAddonId = currentWorkshop.selected_addon_id === addon.addon_id ? null : addon.addon_id;

                                                                                                                        //             // If we are removing the addon (set to null), we will remove the entire workshop entry
                                                                                                                        //             const updatedState = {
                                                                                                                        //                 ...prev,
                                                                                                                        //                 // If selected_addon_id is null, we remove the entry for this addon_workshoprtype_id
                                                                                                                        //                 ...(updatedAddonId === null
                                                                                                                        //                     ? { [addon.addon_workshoprtype_id]: undefined } // Remove the entire workshop entry
                                                                                                                        //                     : {
                                                                                                                        //                         [addon.addon_workshoprtype_id]: {
                                                                                                                        //                             workshopType: workshoptypedata.find(
                                                                                                                        //                                 (type) => type.id === parseInt(addon.addon_workshoprtype_id, 10)
                                                                                                                        //                             )?.workshoptype_name || "Unknown",
                                                                                                                        //                             addon_workshop_id: addon.addon_workshop_id,
                                                                                                                        //                             selected_addon_id: updatedAddonId
                                                                                                                        //                         }
                                                                                                                        //                     })
                                                                                                                        //             };

                                                                                                                        //             console.log("updated selectedWorkshops", updatedState);  // Log the updated state

                                                                                                                        //             // Return the updated state to React's state setter
                                                                                                                        //             return updatedState;
                                                                                                                        //         });




                                                                                                                        //     }}
                                                                                                                        //     disabled={
                                                                                                                        //         isLimitedAndFull ||
                                                                                                                        //         (addon.addon_ispaid === 1 && !AddonAmountMap[addon.addon_id]) ||
                                                                                                                        //         (selectedWorkshops[addon.addon_workshoprtype_id]?.selected_addon_id && selectedWorkshops[addon.addon_workshoprtype_id]?.selected_addon_id !== addon.addon_id)
                                                                                                                        //     }
                                                                                                                        // >
                                                                                                                        //     {selectedOptions.includes(addon.addon_id) || (selectedWorkshops[addon.addon_workshoprtype_id]?.selected_addon_id === addon.addon_id) ? '- Remove' : '+ Add'}
                                                                                                                        // </button>
                                                                                                                        addon.addon_cat_type === "1" ? (

                                                                                                                            <button
                                                                                                                                type="button"
                                                                                                                                className={`btn ${selectedOptions.includes(addon.addon_id) || (selectedWorkshops[addon.addon_workshoprtype_id]?.selected_addon_id === addon.addon_id) ? 'btn-danger' : 'btn-primary'}`}
                                                                                                                                onClick={() => {
                                                                                                                                    const isAdding = !selectedOptions.includes(addon.addon_id);
                                                                                                                                    toggleAddon(addon.addon_id, addon.addon_title, addon.addon_cat_type, addon.addon_workshop_id);
                                                                                                                                    const matchedAddon = addonAmount.find(item => item.addon_id === addon.addon_id);
                                                                                                                                    if (matchedAddon) {
                                                                                                                                        calculateAndSetAmounts(matchedAddon, isAdding);
                                                                                                                                    }

                                                                                                                                    // Update the selected workshops state
                                                                                                                                    setSelectedWorkshops(prev => {
                                                                                                                                        // Retrieve the current state for the given workshop type ID
                                                                                                                                        const currentWorkshop = prev[addon.addon_workshoprtype_id] || {};

                                                                                                                                        // Determine whether to remove or add the addon
                                                                                                                                        const updatedAddonId = currentWorkshop.selected_addon_id === addon.addon_id ? null : addon.addon_id;

                                                                                                                                        // If we are removing the addon (set to null), we will remove the entire workshop entry
                                                                                                                                        const updatedState = {
                                                                                                                                            ...prev,
                                                                                                                                            // If selected_addon_id is null, we remove the entry for this addon_workshoprtype_id
                                                                                                                                            ...(updatedAddonId === null
                                                                                                                                                ? { [addon.addon_workshoprtype_id]: undefined } // Remove the entire workshop entry
                                                                                                                                                : {
                                                                                                                                                    [addon.addon_workshoprtype_id]: {
                                                                                                                                                        workshopType: workshoptypedata.find(
                                                                                                                                                            (type) => type.id === parseInt(addon.addon_workshoprtype_id, 10)
                                                                                                                                                        )?.workshoptype_name || "Unknown",
                                                                                                                                                        addon_workshop_id: addon.addon_workshop_id,
                                                                                                                                                        selected_addon_id: updatedAddonId
                                                                                                                                                    }
                                                                                                                                                })
                                                                                                                                        };

                                                                                                                                        console.log("updated selectedWorkshops", updatedState);  // Log the updated state

                                                                                                                                        // Return the updated state to React's state setter
                                                                                                                                        return updatedState;
                                                                                                                                    });




                                                                                                                                }}
                                                                                                                            // disabled={
                                                                                                                            //     isLimitedAndFull ||
                                                                                                                            //     (addon.addon_ispaid === 1 && !AddonAmountMap[addon.addon_id]) ||
                                                                                                                            //     (selectedWorkshops[addon.addon_workshoprtype_id]?.selected_addon_id && selectedWorkshops[addon.addon_workshoprtype_id]?.selected_addon_id !== addon.addon_id)
                                                                                                                            // }
                                                                                                                            >
                                                                                                                                {selectedOptions.includes(addon.addon_id) || (selectedWorkshops[addon.addon_workshoprtype_id]?.selected_addon_id === addon.addon_id) ? '- Remove' : '+ Add'}
                                                                                                                            </button>
                                                                                                                        ) : (

                                                                                                                            <button
                                                                                                                                type="button"
                                                                                                                                className={`btn ${selectedOptions.includes(addon.addon_id) ? 'btn-danger' : 'btn-primary'}`}
                                                                                                                                onClick={() => {
                                                                                                                                    const isAdding = !selectedOptions.includes(addon.addon_id);
                                                                                                                                    toggleAddon(addon.addon_id, addon.addon_title, addon.addon_cat_type, 0);
                                                                                                                                    const matchedAddon = addonAmount.find(item => item.addon_id === addon.addon_id);
                                                                                                                                    if (matchedAddon) {
                                                                                                                                        calculateAndSetAmounts(matchedAddon, isAdding);
                                                                                                                                    }
                                                                                                                                }}
                                                                                                                            // disabled={
                                                                                                                            //     isLimitedAndFull ||
                                                                                                                            //     (addon.addon_ispaid === 1 && !AddonAmountMap[addon.addon_id]) ||
                                                                                                                            //     (selectedWorkshops[addon.addon_workshoprtype_id]?.selected_addon_id && selectedWorkshops[addon.addon_workshoprtype_id]?.selected_addon_id !== addon.addon_id)
                                                                                                                            // }
                                                                                                                            >
                                                                                                                                {selectedOptions.includes(addon.addon_id) ? '- Remove' : '+ Add'}
                                                                                                                            </button>

                                                                                                                        )


                                                                                                                    )}
                                                                                                                </div>
                                                                                                            </CardBody>
                                                                                                        </Card>

                                                                                                        {/* Separate accompanying persons container */}
                                                                                                        {addon.addon_cat_type === "2" && addonFormData[addon.addon_id] && addonFormData[addon.addon_id].length > 0 && (
                                                                                                            <Card className="mb-3 accompany-persons-card">
                                                                                                                <CardBody>
                                                                                                                    <h6 className="mb-3">Accompanying Persons</h6>
                                                                                                                    <div className="accompany-persons-container">
                                                                                                                        {addonFormData[addon.addon_id].map((person, index) => (
                                                                                                                            <div key={index} className="d-flex align-items-center mb-3">
                                                                                                                                <span className="me-3" style={{ minWidth: '150px' }}>Accompany Person {index + 1}</span>
                                                                                                                                <input
                                                                                                                                    type="text"
                                                                                                                                    placeholder="Name"
                                                                                                                                    value={person.name || ''}
                                                                                                                                    onChange={(e) => handleInputChange(addon.addon_id, index, 'name', e.target.value)}
                                                                                                                                    className="form-control me-3"
                                                                                                                                    style={{ maxWidth: '250px' }}
                                                                                                                                />
                                                                                                                                <input
                                                                                                                                    type="number"
                                                                                                                                    placeholder="Age"
                                                                                                                                    value={person.age || ''}
                                                                                                                                    onChange={(e) => handleInputChange(addon.addon_id, index, 'age', e.target.value)}
                                                                                                                                    className="form-control"
                                                                                                                                    style={{ maxWidth: '80px' }}
                                                                                                                                />
                                                                                                                            </div>
                                                                                                                        ))}
                                                                                                                    </div>
                                                                                                                </CardBody>
                                                                                                            </Card>
                                                                                                        )}
                                                                                                    </React.Fragment>

                                                                                                );

                                                                                            })}
                                                                                        </div>
                                                                                    );
                                                                                })}
                                                                            </div>
                                                                        );

                                                                    }}
                                                                </Field>

                                                                <Field name="cs_workshop_category" initialValue={Data?.cs_workshop_category || ''}>
                                                                    {({ input }) => (
                                                                        <input type="hidden" {...input} />
                                                                    )}
                                                                </Field>

                                                                {workshopCategory1 && (
                                                                    <div className="mt-3">
                                                                        <h6>Selected Workshop Category:</h6>
                                                                        <p>{workshopCategory1}</p>
                                                                    </div>
                                                                )}
                                                            </Col>
                                                        </Row>
                                                    )}





                                                    {(showNextStep && addedpaymentmode === 'Both' && totalPaidAmount > 0) && (
                                                        <Row>
                                                            <Col md="12" className="mb-3">
                                                                <div className="form-group">
                                                                    <strong>Payment</strong>
                                                                    <div className='me-5 mt-3'>

                                                                        <>
                                                                            <input
                                                                                type="radio"
                                                                                name="payment_mode"
                                                                                value="online"
                                                                                checked={paymentMode === 'online'}
                                                                                onChange={handlePaymentModeChange}
                                                                                disabled={!addonticket}
                                                                                className='me-2'
                                                                            />
                                                                            <strong>Online</strong>
                                                                        </>


                                                                        <>
                                                                            <input
                                                                                type="radio"
                                                                                name="payment_mode"
                                                                                value="offline"
                                                                                checked={paymentMode === 'offline'}
                                                                                onChange={handlePaymentModeChange}
                                                                                disabled={!addonticket}
                                                                                className='ms-3 me-2'
                                                                            />
                                                                            <strong>Offline</strong>
                                                                        </>

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
                                                            <Button color="warning" className="me-2 mt-3" onClick={handleCancel}>Cancel</Button>
                                                            {/* <Button color="primary" type="submit" className="me-2 mt-3" disabled={!paymentMode}>Submit</Button> */}
                                                            <Button
                                                                color="primary"
                                                                type="submit"
                                                                className="me-2 mt-3"
                                                                disabled={totalPaidAmount > 0 && !paymentMode}
                                                            >
                                                                Submit
                                                            </Button>


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

                                ) : Data?.cs_isconfirm == 1 ? (
                                    <Alert
                                        color="success"
                                        style={{ backgroundColor: '#d4edda', color: '#155724', borderColor: '#c3e6cb' }} // Light green colors for member status
                                        className="mt-3"
                                    >
                                        {/* <h4 className="alert-heading">?? Membership Approved!</h4>
        <hr />
        <p className="mb-2">
            <strong>Congratulations!</strong> Your membership has been approved and you are now part of IADVL Pune.
        </p> */}
                                        <div className="alert alert-success" role="alert" style={{ padding: '1.5rem', borderRadius: '0.5rem', boxShadow: '0 4px 8px rgba(0,0,0,0.1)' }}>
                                            <h4 className="alert-heading" style={{ color: '#155724', fontSize: '1.4rem' }}>
                                                🎉 Thank You for your Registration !
                                            </h4>
                                            <hr style={{ border: '1px solid #c3e6cb', margin: '1rem 0' }} />
                                            <p className="mb-2" style={{ fontSize: '1rem', color: '#155724' }}>
                                                Your Registration Number is:
                                                <span style={{ fontWeight: 'bold', fontSize: '1.2rem', color: '#0c5e2f', marginLeft: '0.3rem' }}>
                                                    {Data?.cs_regno}
                                                </span>
                                            </p>
                                            <p style={{ fontSize: '1rem', color: '#155724' }}>
                                                <strong>Category:</strong> {Data?.category_name}
                                            </p>
                                            <p style={{ fontSize: '1rem', color: '#155724' }}>
                                                <strong>Ticket:</strong> {Data?.ticket_name}
                                            </p>
                                        </div>

                                        {/* <p className="mt-3">Welcome to the community! We look forward to your active participation.</p>
<hr />
        <p className="mb-0">If you have any questions, feel free to reach out to us at support@iadvlpune.com.</p> */}
                                    </Alert>
                                ) : (
                                    // Code to execute if condition is false (optional)
                                    <Alert
                                        color="warning"
                                        style={{ backgroundColor: '#fff3cd', color: '#856404', borderColor: '#ffeeba' }} // Light warm colors
                                        className="mt-3"
                                    >
                                        <h5 className="alert-heading">Registration Status</h5>
                                        <p>You have already registered for Conference. Please wait for the response.</p>
                                    </Alert>
                                )}
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
                                regAmount={regAmount}
                                totalPaidAmount={totalPaidAmount}
                                setRegAmount={setRegAmount}
                                settotalPaidAmount={settotalPaidAmount}
                                currency={currency}
                                processingAmount={processingAmount}
                                gstamount={gstamount}
                                gstfee={gstfee}
                                gstinclded={gstinclded}
                                processinginclded={processinginclded}
                                processingfeeornot={processingfeeornot}
                                processingfeein={processingfeein}
                                gstpercentage={gstpercentage}
                                setProcessingAmount={setProcessingAmount}
                                setgstamount={setgstamount}
                                setgstfee={setgstfee}
                                setgstinclded={setgstinclded}
                                setprocessinginclded={setprocessinginclded}
                                setprocessingfeeornot={setprocessingfeeornot}
                                setprocessingfeein={setprocessingfeein}
                                setgstpercentage={setgstpercentage}
                                processingFee={processingFee}
                                UserEmail={Useremail} // Pass the email state 
                                selectedAddonNames={selectedAddonNames}
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
                    {/* <Link to="/manage-facility///Consoft" className="btn btn-warning">Yes</Link> */}
                    <Button color="primary" onClick={() => setModal(!modal)}>No</Button>
                </ModalFooter>
            </Modal>
        </Fragment >
    );
};


export default AddConferenceUser;




