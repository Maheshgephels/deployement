import React, { Fragment, useState, useEffect, useContext, useRef } from 'react';
import { Container, Row, Col, Input, Label, Button, Card, CardBody, Modal, ModalHeader, FormFeedback, ModalBody, ModalFooter, Media, PopoverBody, UncontrolledPopover, Popover, PopoverHeader } from 'reactstrap';
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
import { required, email, Img, PDF, option, number, Name, NAME, radio, expiryDate, shortbio, longbio, username1, password } from '../Utils/validationUtils';

import { PermissionsContext } from '../../contexts/PermissionsContext';
import useAuth from '../../Auth/protectedAuth';
import { getToken } from '../../Auth/Auth';
import { toast } from 'react-toastify';
import moment from 'moment';






//Utility function used to combine multiple validation functions into a single validation function
const composeValidators = (...validators) => value =>
    validators.reduce((error, validator) => error || validator(value), undefined);

const AddRegUser = () => {
    useAuth();
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modal, setModal] = useState(false);
    const [fieldLabels, setFieldLabels] = useState([]);
    const [fieldType, setFieldType] = useState([]);
    const [requiredfield, setRequiredField] = useState([]); // Define requiredfield state
    const [fieldId, setFieldId] = useState([]);
    const [fieldName, setFieldName] = useState([]);
    const navigate = useNavigate(); // Initialize useHistory
    const location = useLocation();
    const { Data } = location.state || {};
    const [prefixes, setPrefixes] = useState([]);
    const [state, setState] = useState([]);
    const [country, setCountry] = useState([]);
    const [regCat, setRegCat] = useState([]);
    const [workshop, setWorkshop] = useState([]);
    const [dayType, setDayType] = useState([]);
    const [custom, setCustom] = useState([]);
    const [selectCat, setSelectCat] = useState('');
    const [customfield, setCustomfield] = useState([]);
    const [ticket, setTicket] = useState([]);
    const [filteredTickets, setFilteredTickets] = useState([]); // State for filtered tickets
    const [filteredAddon, setFilteredAddon] = useState([]);
    const [paymentType, setPaymentType] = useState([]);
    const [paymentStatus, setPaymentStatus] = useState([]);
    const [ticketAmount, setTicketAmount] = useState([]);
    const [addonAmount, setAddonAmount] = useState([]);
    const [addonCounts, setAddonCounts] = useState({});
    const [addon, setAddon] = useState([]);
    const [regAmount, setRegAmount] = useState(0);
    const [regAddonAmount, setRegAddonAmount] = useState(0);
    const [processingAmount, setProcessingAmount] = useState(0);
    const [processingFee, setProcessingFee] = useState(0);
    const [totalPaidAmount, settotalPaidAmount] = useState(0);
    const { permissions } = useContext(PermissionsContext);
    const [category, setCategory] = useState(''); // Define state and setter
    const [addonticket, setAddonTicket] = useState(''); // Define state and setter
    const [showNextStep, setShowNextStep] = useState(false); // Handles when "Next" is clicked
    const [isChecked, setIsChecked] = useState(false); // Track the state of the checkbox
    const [sendEmail, setSendEmail] = useState(false);
    const [files, setFiles] = useState({ photo: '', resume: '' });
    const initialValue = '';
    const [selectedFacilityType, setSelectedFacilityType] = useState(initialValue);
    const [selectedImage, setSelectedImage] = useState(null);
    const [selectedPdf, setSelectedPdf] = useState(null);
    const [imageError, setImageError] = useState('');
    const [pdfError, setPdfError] = useState('');
    const username = localStorage.getItem('username');
    const [facultytype, setfacultytype] = useState([]);
    const [exhibitor, setExhibitor] = useState([]);
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
    const [registereduser, setregistereduser] = useState();
    const paymentTypeOptions = paymentType.map(type => ({
        value: type.paymenttype_id,
        label: type.paymenttype_name
    }));
    const paymentStatusOptions = paymentStatus.map(status => ({
        value: status.paymentstatus_id,
        label: status.paymentstatus_name
    }));
    const facultyTypeOptions = facultytype.map(status => ({
        value: status.facultytype_id,
        label: status.type_title
    }));
    const exhibitorOptions = exhibitor.map(status => ({
        value: status.exh_id,
        label: status.exh_name
    }));

    console.log("Selected Cat", category);

    console.log("Field", fieldName);
    console.log("Addon Ticket", addonticket);
    console.log("Ticket Amount", ticketAmount);
    console.log("Addon Amount", addonAmount);
    console.log("Reg Amount", regAmount);
    console.log("Reg Addon Amount", regAddonAmount);
    console.log("Processing Fee", processingFee);
    console.log("Ticket", ticket);
    console.log("Filtered Ticket", filteredTickets);



    const [selectedAddonNames, setSelectedAddonNames] = useState([]);
    const [workshopCategory1, setWorkshopCategory1] = useState();
    const [addedpaymentmode, setaddedpaymentmode] = useState();
    const [addonFormData, setAddonFormData] = useState({});
    const [workshoptypedata, setworkshoptype] = useState([]);
    const [selectedWorkshops, setSelectedWorkshops] = useState({}); // Tracks selected workshop per type
    const [gstfee, setgstfee] = useState();
    const [gstinclded, setgstinclded] = useState();
    const [gstamount, setgstamount] = useState();
    const [gstpercentage, setgstpercentage] = useState(18);
    const [processingfeein, setprocessingfeein] = useState();
    const [processinginclded, setprocessinginclded] = useState();
    const [currency, setcurrency] = useState();
    const [processingfeeornot, setprocessingfeeornot] = useState();









    const empty = '';



    console.log("Location Data", Data);
    // console.log("Ticket", ticket);
    console.log("Category to match", category);






    useEffect(() => {
        fetchFields(); // Corrected function name
    }, [permissions]);

    useEffect(() => {
        fetchDropdown(); // Corrected function name
    }, []);




    // Extract Add User setting Permissions component
    const AddUserPermissions = permissions['AddRegUser'];

    const fetchFields = async () => {
        try {
            const token = getToken();
            const response = await axios.get(`${BackendAPI}/reguser/getField`, {
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


            console.log("Data:", fieldsData);
            console.log("Custom:", customfield);



            // setData(fieldsData);
            setFieldLabels(fieldLabels);
            setFieldType(fieldType);
            setFieldName(fieldName);
            setCustomfield(customfield);
            setRequiredField(requiredfield); // Set requiredfield state
            setFieldId(fieldId);
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

    const onSubmit = async (formData, files) => {
        const username = formData.cs_first_name;

        try {
            const toastId = toast.info('Processing...', { autoClose: false });
            const paymentDetails = {};
            const facultyDetails = {};
            const formDataToSend = new FormData();

            console.log('File found:', files.photo);




            const paymentFields = [
                'total_paid_amount',
                'processing_fee',
                'conference_fees',
                'branch',
                'bank',
                'payment_date',
                'cheque_no',
                'payment_mode',
                'paymenttype_id',
                'paymentstatus_id',
                'currency'
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

            // Check if any paymentFields contain a value
            let hasPaymentDetails = false;
            let hadFacultyDetails = false;

            for (const key in formData) {
                if (Object.hasOwnProperty.call(formData, key)) {
                    if (formData[key].value !== '') {
                        if (paymentFields.includes(key)) {
                            paymentDetails[key] = formData[key].value || formData[key];
                        } else if (facultyFields.includes(key)) {
                            facultyDetails[key] = formData[key].value || formData[key];
                        } else {
                            formDataToSend.append(key, formData[key].value || formData[key]);
                        }
                    }
                }
            }

            // Create a data object to hold only unique form values
            const values = {};
            for (const key in formData) {
                if (Object.hasOwnProperty.call(formData, key)) {
                    // Exclude payment and faculty fields from values
                    if (!paymentFields.includes(key) && !facultyFields.includes(key) && formData[key].value !== '') {
                        values[key] = formData[key].value || formData[key];
                    }
                }
            }

            console.log("Payment", paymentDetails);
            console.log("Faculty", facultyDetails);
            console.log("Value", values);

            // Append the data object as JSON string under the 'data' key
            formDataToSend.append('data', JSON.stringify(values));
            // Check if Data and Data.id are defined before appending
            if (Data && Data.id) {
                formDataToSend.append('Id', JSON.stringify(Data.id));
            }


            // Append paymentDetails to FormData only if it has values
            if (hasPaymentDetails) {
                paymentDetails.payment_mode = 'offline'; // Set payment_mode here if needed
                formDataToSend.append('paymentDetails', JSON.stringify(paymentDetails));
            }
            if (hadFacultyDetails) {
                facultyDetails.fname = formData.cs_first_name; // Use formData directly
                facultyDetails.lname = formData.cs_last_name;
                facultyDetails.country = formData.cs_country;
                facultyDetails.contact1 = formData.cs_phone;
                facultyDetails.email1 = formData.cs_email;
                facultyDetails.ntitle = formData.cs_title;
                formDataToSend.append('photo', selectedImage);
                formDataToSend.append('resume', selectedcv);
            }


            // Append paymentDetails and facultyDetails to FormData
            formDataToSend.append('paymentDetails', JSON.stringify(paymentDetails));
            formDataToSend.append('facultyDetails', JSON.stringify(facultyDetails));


            formDataToSend.append('cs_workshop_category', workshopCategory1);
            Object.values(selectedWorkshops).forEach(workshop => {
                const formattedWorkshopType = `cs_${workshop.workshopType.toLowerCase().replace(/\s+/g, '')}`;  // Remove spaces
                formDataToSend.append(formattedWorkshopType, workshop.addon_workshop_id);
            });
            formDataToSend.append('accompany_person_data', JSON.stringify(addonFormData));

            console.log('Formatted form data to send:', formDataToSend);

            const token = getToken();

            if (Data?.id) {
                const response = await axios.post(`${BackendAPI}/reguser/addConfirmUser`, formDataToSend, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        // Do not set Content-Type to multipart/form-data; axios does it automatically
                    }
                });

                toast.dismiss(toastId);

                if (response.data.success) {
                    SweetAlert.fire({
                        title: 'Success!',
                        html: sendEmail ?
                            `User <b>${username}</b> created and mail successfully!` :
                            `User <b>${username}</b> created successfully!`,
                        icon: 'success',
                        timer: 3000,
                        showConfirmButton: false,
                        allowOutsideClick: false,
                        allowEscapeKey: false
                    }).then((result) => {
                        if (result.dismiss === SweetAlert.DismissReason.timer) {
                            navigate(`${process.env.PUBLIC_URL}/registration/basic-user-listing/Consoft`);
                        }
                    });
                }
            } else {
                const alternateResponse = await axios.post(`${BackendAPI}/reguser/addBasConfUser`, formDataToSend, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        // Same as above: let axios set Content-Type
                    }
                });

                toast.dismiss(toastId);

                if (alternateResponse.data.success) {
                    SweetAlert.fire({
                        title: 'Success!',
                        html: `User <b>${username}</b> created successfully!`,
                        icon: 'success',
                        timer: 3000,
                        showConfirmButton: false,
                        allowOutsideClick: false,
                        allowEscapeKey: false
                    }).then((result) => {
                        if (result.dismiss === SweetAlert.DismissReason.timer) {
                            navigate(`${process.env.PUBLIC_URL}/registration/confirm-user-listing/Consoft`);
                        }
                    });
                }
            }
        } catch (error) {
            console.error('Error creating user:', error.message);
        }
    };

    const validateUniqueUsername = async (value) => {
        try {
            // const response = await axios.get(`/api/check-username/${value}`);
            const token = getToken();
            const response = await axios.get(`${BackendAPI}/reguser/check-username/${value}`, {
                headers: {
                    Authorization: `Bearer ${token}` // Include the token in the Authorization header
                }
            });
            if (response.data.exists) {
                return 'Username already taken';
            }
        } catch (error) {
            return 'Error checking username';
        }
        return undefined;
    };



    // useEffect(() => {
    //     const filterTickets = () => {
    //         if (category) {
    //             const parsedCategory = JSON.parse(category); // Parse the category

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
    //             if (matchedTicket) {
    //                 const amount = matchedTicket.tick_amount; // Get the ticket amount
    //                 setRegAmount(amount); // Store the ticket amount in regAmount

    //                 // Calculate the processing fee based on the percentage
    //                 const currentAmount = parseFloat(regAmount);
    //                 const processingPercentage = processingFee.cs_value; // This should be your percentage
    //                 const processingFeeAmount = (currentAmount * processingPercentage) / 100; // Calculate processing fee

    //                 setProcessingAmount(processingFeeAmount); // Set the calculated processing fee
    //                 settotalPaidAmount(currentAmount + processingFeeAmount);
    //                 console.log("Matched Ticket Amount:", amount);
    //                 console.log("Processing Fee Amount:", processingFeeAmount);
    //             } else {
    //                 setRegAmount(''); // Reset if no matching ticket is found
    //                 setProcessingAmount(0); // Reset processing amount as well
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
    //             setRegAmount(''); // Reset regAmount if no addonticket
    //         }
    //     };

    //     // Call the filter functions
    //     filterTickets(); // Call the filter function
    //     filterAddon(); // Call the filter function
    // }, [category, addonticket, ticket]); // Run effect when category or tickets change

    // console.log("Addon Ticket", addonticket);
    // console.log("Ticket Amount", ticketAmount);

    const ticketAmountMap = Object.fromEntries(
        ticketAmount.map(item => [item.ticket_id, item.tick_amount])
    );

    const AddonAmountMap = Object.fromEntries(
        addonAmount.map(item => [item.addon_id, item.addon_amount])
    );




    useEffect(() => {
        const filterTickets = () => {
            if (category) {
                const parsedCategory = JSON.parse(category); // Parse the category

                console.log("Parsed Cat", parsedCategory);

                const filtered = ticket.filter(ticket => {
                    // Check if ticket_category is valid
                    if (ticket.ticket_category && ticket.ticket_category !== 'null') {
                        try {
                            const ticketCategories = JSON.parse(ticket.ticket_category); // Parse ticket_category
                            return Array.isArray(ticketCategories) && ticketCategories.includes(parsedCategory); // Ensure it's an array and includes the category
                        } catch (e) {
                            console.error("Error parsing ticket category:", e);
                            return false; // Return false if parsing fails
                        }
                    }
                    return false; // If ticket_category is null or invalid, return false
                });
                console.log("Filtered", filtered);
                setFilteredTickets(filtered); // Set filtered tickets
            } else {
                setFilteredTickets([]); // If no category, show all tickets
            }
        };

        // const filterAddon = () => {
        //     if (addonticket) {
        //         const parsedAddon = JSON.parse(addonticket); // Parse the selected addon ticket
        //         console.log("Addon:", parsedAddon);

        //         // Find the matching ticket based on the addon ticket ID
        //         const matchedTicket = ticketAmount.find(ticketItem => ticketItem.ticket_id === parsedAddon);
        //         console.log("Matched", matchedTicket);
        //         if (matchedTicket) {
        //             const amount = parseFloat(matchedTicket.tick_amount); // Convert tick_amount to a number
        //             setRegAmount(amount); // Store the ticket amount in regAmount

        //             // Calculate the processing fee based on the percentage
        //             const currentAmount = amount; // No parseFloat needed if regAmount is already a number
        //             const processingPercentage = processingFee.cs_value; // Should be a number
        //             const processingFeeAmount = (amount * processingPercentage) / 100; // Correct calculation without parseFloat

        //             setProcessingAmount(processingFeeAmount); // Set the calculated processing fee
        //             settotalPaidAmount(currentAmount + processingFeeAmount);

        //             console.log("Matched Ticket Amount:", amount);
        //             console.log("Processing Fee Amount:", processingFeeAmount);
        //         } else {
        //             setRegAmount(0); // Reset if no matching ticket is found
        //             setProcessingAmount(0); // Reset processing amount as well
        //             settotalPaidAmount(0);
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




                setFilteredAddon(filtered); // Set the filtered addons
            } else {
                setFilteredAddon([]); // If no category, reset the filtered addons
                setRegAmount(0); // Reset regAmount if no addonticket
                setProcessingAmount(0);
                settotalPaidAmount(0);

            }
        };

        // Call the filter functions
        filterTickets(); // Call the filter function
        filterAddon(); // Call the filter function
        fetchUserTicketcounts();
    }, [category, addonticket]); // Run effect when category or tickets change



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


    console.log("Addon Ticket", addonticket);
    console.log("Ticket Amount", ticketAmount);


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







    // const fetchDropdown = async () => {
    //     try {
    //         const token = getToken();
    //         const response = await axios.get(`${BackendAPI}/reguser/getDropdownData`, {
    //             headers: {
    //                 Authorization: `Bearer ${token}` // Include the token in the Authorization header
    //             }
    //         });

    //         setData(response.data);
    //         console.log(response.data);
    //         setLoading(false);

    //         // Extracting the data from the response
    //         const fetchprefixes = response.data.prefix;
    //         const fetchstate = response.data.states;
    //         const fetchcountry = response.data.country;
    //         const fetchregcat = response.data.regCategory;
    //         const fetchworkshop = response.data.workshop;
    //         const fetchdaytype = response.data.dayType;
    //         const fetchCutomData = response.data.custom;
    //         const fetchTicket = response.data.ticket;
    //         const fetchAddon = response.data.addon;
    //         const fetchPaymentType = response.data.paymentType;
    //         const fetchPaymentStatus = response.data.paymentStatus;
    //         const fetchTicketAmount = response.data.ticketAmount;
    //         const fetchAddonAmount = response.data.addonAmount;
    //         const fetchProcessingFee = response.data.processingFees[0];
    //         const fetchfacultytype = response.data.facultytype;
    //         const fetchexhibitor = response.data.exhibitor;


    //         console.log("Fetched Ticket Amount", fetchTicketAmount);

    //         // Get the current date
    //         const currentDate = new Date();

    //         // Filter ticket amounts based on the current date
    //         const filteredTicketAmount = fetchTicketAmount.filter(ticket => {
    //             const startDate = new Date(ticket.tick_duration_start_date);
    //             const endDate = new Date(ticket.tick_duration_till_date);
    //             return startDate <= currentDate && endDate >= currentDate;
    //         });

    //         // Log filtered ticket amounts
    //         console.log("Filtered Ticket Amount", filteredTicketAmount);

    //         setTicket(fetchTicket);

    //         // Set other states
    //         setPrefixes(fetchprefixes);
    //         setState(fetchstate);
    //         setCountry(fetchcountry);
    //         setRegCat(fetchregcat);
    //         setWorkshop(fetchworkshop);
    //         setDayType(fetchdaytype);
    //         setCustom(fetchCutomData);
    //         setAddon(fetchAddon);
    //         setPaymentType(fetchPaymentType);
    //         setPaymentStatus(fetchPaymentStatus);
    //         setTicketAmount(fetchTicketAmount); // Set the filtered ticket amounts
    //         setAddonAmount(fetchAddonAmount);
    //         setProcessingFee(fetchProcessingFee);
    //         setfacultytype(fetchfacultytype);
    //         setExhibitor(fetchexhibitor);


    //         console.log(fetchprefixes);

    //     } catch (error) {
    //         console.error('Error fetching dropdown data:', error);
    //         setLoading(false);
    //     }
    // };


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
        navigate(`${process.env.PUBLIC_URL}registration/confirm-user-listing/Consoft`);
    };

    const handleCheckboxChange = (e) => {
        const checked = e.target.checked;
        setIsChecked(checked); // Set the checkbox state
        if (checked) {
            setShowNextStep(false); // Ensure the form stays in the first and second row when checkbox is checked

        }
    };

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
                    Create Confirm User
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
            } parent="Manage User" title="Create Confirm User" />
            <Container fluid={true}>
                <Row>
                    <Col sm="12">
                        <Card>
                            <CardBody>
                                <Form onSubmit={onSubmit}
                                    render={({ handleSubmit, form }) => (
                                        <form className="needs-validation" noValidate="" onSubmit={handleSubmit}>
                                            {/* Main row for the first and second rows */}
                                            {!showNextStep && (
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
                                                                    fieldType[index] === 'Dropdown' && fieldLabels[index] === 'State' && (
                                                                        <Field
                                                                            name={`${fieldName[index]}`}
                                                                            initialValue={Data?.cs_state || ''}
                                                                            // Use optional chaining to avoid errors
                                                                            validate={isFieldRequired ? composeValidators(option) : (value) => composeValidators()(value)}
                                                                        >
                                                                            {({ input, meta }) => {
                                                                                const selectedOption = state.find(option => option.cs_state_name === Data?.cs_state);
                                                                                let options = state.map(pref => ({
                                                                                    value: pref.cs_state_name,
                                                                                    label: pref.cs_state_name,
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

                                                                    )

                                                                }

                                                                {
                                                                    fieldType[index] === 'Dropdown' && fieldLabels[index] === 'Country' && (
                                                                        <Field
                                                                            name={`${fieldName[index]}`}
                                                                            initialValue={Data?.cs_country || ''} // Use optional chaining to avoid errors
                                                                            validate={isFieldRequired ? composeValidators(option) : (value) => composeValidators()(value)}
                                                                        >
                                                                            {({ input, meta }) => {
                                                                                const selectedOption = country.find(option => option.cs_country === Data?.cs_country);
                                                                                let options = country.map(pref => ({
                                                                                    value: pref.cs_country,
                                                                                    label: pref.cs_country,
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

                                                                    )


                                                                }

                                                                {
                                                                    fieldType[index] === 'Dropdown' && fieldLabels[index] === 'Workshop Category' && (
                                                                        <Field
                                                                            name={`${fieldName[index]}`}
                                                                            initialValue={Data?.cs_workshop_category || ''} // Use optional chaining to avoid errors
                                                                            validate={isFieldRequired ? composeValidators(option) : (value) => composeValidators()(value)}
                                                                        >
                                                                            {({ input, meta }) => {
                                                                                const selectedOption = workshop.find(option => option.cs_workshop_id === Data?.cs_workshop_category);
                                                                                let options = workshop.map(pref => ({
                                                                                    value: pref.cs_workshop_id,
                                                                                    label: pref.cs_workshop_name,
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
                                                                    )



                                                                }


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

                                                                {/* {fieldName = cs_reg_category === 3 &&(

                                                                        // <Label className='form-label' for="type">
                                                                        //     <strong>Faculty type <span className="red-asterisk">*</span></strong>
                                                                        // </Label>
                                                                        <Field
                                                                            name="facultytype"
                                                                            validate={composeValidators(required)}
                                                                            initialValue={Faculty.facultytype_id || ''}
                                                                        >
                                                                            {({ input, meta }) => (
                                                                                <div>
                                                                                    <select
                                                                                        {...input}
                                                                                        className="form-control"
                                                                                        id="selectmethod"
                                                                                    >
                                                                                        <option value="" disabled>Select Faculty type</option>
                                                                                        {facultytype.map((option) => (
                                                                                            <option key={option.facultytype_id} value={option.facultytype_id}>
                                                                                                {option.type_title}
                                                                                            </option>
                                                                                        ))}
                                                                                    </select>
                                                                                    {meta.error && meta.touched && (
                                                                                        <FormFeedback className='d-block text-danger'>
                                                                                            {meta.error}
                                                                                        </FormFeedback>
                                                                                    )}
                                                                                </div>
                                                                            )}
                                                                        </Field>

                                                                    )

                                                                } */}


                                                                {
                                                                    fieldType[index] === 'Dropdown' && fieldLabels[index] === 'Registration Type' && (
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
                                                                                            dayType.map(pref => ({ value: pref.cs_reg_daytype_id, label: pref.cs_reg_daytype_name })) :
                                                                                            [
                                                                                                { value: '', label: 'Select' }, // Adding the "Select" option as the first item
                                                                                                ...dayType.map(pref => ({ value: pref.cs_reg_daytype_id, label: pref.cs_reg_daytype_name }))
                                                                                            ]
                                                                                        }

                                                                                        // options={[{ value: '', label: 'Select' }, // Adding the "Select" option as the first item
                                                                                        // ...dayType.map(pref => ({ value: pref.cs_reg_daytype_id, label: pref.cs_reg_daytype_name }))]}
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

                                                                {/* Ticket */}
                                                                {/* {
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
                                                                } */}

                                                                {/* {fieldType[index] === 'Dropdown' && fieldLabels[index] === 'Ticket' && (
                                                                    <Field
                                                                        name={`${fieldName[index]}`} // Dynamic field name
                                                                        initialValue={Data?.cs_ticket || ''}
                                                                        validate={requiredfield[index] === '1' ? composeValidators(option) : (value) => composeValidators()(value)}
                                                                    >
                                                                        {({ input, meta }) => {
                                                                            const validRegisteredUser = Array.isArray(registereduser) ? registereduser : [];

                                                                            let options = filteredTickets.map(ticket => {
                                                                                const userTicketCount = validRegisteredUser.filter(user => user.cs_ticket === ticket.ticket_id).length;
                                                                                const isLimitedAndFull = ticket.ticket_type === "Limited" && userTicketCount >= ticket.ticket_count;

                                                                                let label = ticket.ticket_title;

                                                                                if (isLimitedAndFull) {
                                                                                    label += ' - No seats available';
                                                                                } else if (ticket.ticket_ispaid === "1" && !ticketAmountMap[ticket.ticket_id]) {
                                                                                    label += ' - Ticket date expired';
                                                                                }

                                                                                return {
                                                                                    value: ticket.ticket_id,
                                                                                    label,
                                                                                    isWarning: isLimitedAndFull || (ticket.ticket_ispaid === "1" && !ticketAmountMap[ticket.ticket_id])
                                                                                };
                                                                            });

                                                                            if (requiredfield[index] !== '1') {
                                                                                options = [{ value: '', label: 'Select', isWarning: false }, ...options];
                                                                            }

                                                                            // Custom styles for react-select
                                                                            const customStyles = {
                                                                                option: (provided, state) => ({
                                                                                    ...provided,
                                                                                    color: state.data.isWarning ? 'red' : 'black', // Red for warnings, black otherwise
                                                                                    backgroundColor: state.isFocused ? '#f0f0f0' : 'white',
                                                                                }),
                                                                                singleValue: (provided, state) => ({
                                                                                    ...provided,
                                                                                    color: state.data?.isWarning ? 'red' : 'black', // Keep selected value styled
                                                                                })
                                                                            };

                                                                            return (
                                                                                <div>
                                                                                    <Label className='form-label' for={`displayname${index}`}>
                                                                                        <strong>{label}</strong>
                                                                                        {requiredfield[index] === '1' && <span className="text-danger"> *</span>}
                                                                                    </Label>
                                                                                    <Select
                                                                                        {...input}
                                                                                        options={options}
                                                                                        placeholder={`Select ${label}`}
                                                                                        isSearchable={true}
                                                                                        styles={customStyles}
                                                                                        onChange={(selectedOption) => {
                                                                                            input.onChange(selectedOption ? selectedOption.value : '');
                                                                                            setAddonTicket(selectedOption.value); // Update addon ticket
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



                                                                )} */}


                                                                {fieldType[index] === 'Dropdown' && fieldLabels[index] === 'Ticket' && (
                                                                    <Field
                                                                        name={`${fieldName[index]}`} // Dynamic field name
                                                                        initialValue={Data?.cs_ticket || ''}
                                                                        validate={requiredfield[index] === '1' ? composeValidators(option) : (value) => composeValidators()(value)}
                                                                    >
                                                                        {({ input, meta }) => {
                                                                            const validRegisteredUser = Array.isArray(registereduser) ? registereduser : [];

                                                                            let options = filteredTickets.map(ticket => {
                                                                                const userTicketCount = validRegisteredUser.filter(user => user.cs_ticket === ticket.ticket_id).length;
                                                                                const isLimitedAndFull = ticket.ticket_type === "Limited" && userTicketCount >= ticket.ticket_count;

                                                                                let label = ticket.ticket_title;

                                                                                if (isLimitedAndFull) {
                                                                                    label += ' - No seats available';
                                                                                } else if (ticket.ticket_ispaid === "1" && !ticketAmountMap[ticket.ticket_id]) {
                                                                                    label += ' - Ticket date expired';
                                                                                }

                                                                                return {
                                                                                    value: ticket.ticket_id,
                                                                                    label,
                                                                                    isWarning: isLimitedAndFull || (ticket.ticket_ispaid === "1" && !ticketAmountMap[ticket.ticket_id])
                                                                                };
                                                                            });

                                                                            if (requiredfield[index] !== '1') {
                                                                                options = [{ value: '', label: 'Select', isWarning: false }, ...options];
                                                                            }

                                                                            // Check if cs_addons has a value, and disable the ticket dropdown if true
                                                                            // const isAddonSelected = Data?.cs_addons && Data.cs_addons !== '';
                                                                            const isAddonSelected = form.getFieldState('cs_addons')?.value ? form.getFieldState('cs_addons').value.split(',').length > 0 : false; // Use form.getFieldState to access input value


                                                                            // Custom styles for react-select
                                                                            const customStyles = {
                                                                                option: (provided, state) => ({
                                                                                    ...provided,
                                                                                    color: state.data.isWarning ? 'red' : 'black', // Red for warnings, black otherwise
                                                                                    backgroundColor: state.isFocused ? '#f0f0f0' : 'white',
                                                                                }),
                                                                                singleValue: (provided, state) => ({
                                                                                    ...provided,
                                                                                    color: state.data?.isWarning ? 'red' : 'black', // Keep selected value styled
                                                                                })
                                                                            };

                                                                            return (
                                                                                <div>
                                                                                    <Label className='form-label' for={`displayname${index}`}>
                                                                                        <strong>{label}</strong>
                                                                                        {requiredfield[index] === '1' && <span className="text-danger"> *</span>}
                                                                                    </Label>

                                                                                    {/* Conditionally render the Select dropdown */}
                                                                                    <Select
                                                                                        {...input}
                                                                                        options={options}
                                                                                        placeholder={`Select ${label}`}
                                                                                        isSearchable={true}
                                                                                        styles={customStyles}
                                                                                        isDisabled={isAddonSelected} // Disable dropdown if addon is selected
                                                                                        onChange={(selectedOption) => {
                                                                                            input.onChange(selectedOption ? selectedOption.value : '');
                                                                                            setAddonTicket(selectedOption.value); // Update addon ticket
                                                                                        }}
                                                                                        onBlur={input.onBlur}
                                                                                        classNamePrefix="react-select"
                                                                                        value={options.find(option => option.value === parseInt(input.value)) || null}
                                                                                    />

                                                                                    {/* Show message if addon is selected and user tries to select ticket */}
                                                                                    {isAddonSelected && (
                                                                                        <p className="text-warning">
                                                                                            Please deselect the addon before selecting a ticket.
                                                                                        </p>
                                                                                    )}

                                                                                    {meta.error && meta.touched && <p className='d-block text-danger'>{meta.error}</p>}
                                                                                </div>
                                                                            );
                                                                        }}
                                                                    </Field>
                                                                )}





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

                                                                {fieldType[index] === 'Username' && (
                                                                    <Field
                                                                        name={`${fieldName[index]}`} // Use dynamic field name
                                                                        validate={requiredfield[index] === '1' ? composeValidators(username1, validateUniqueUsername) : (value) => composeValidators()(value)}
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
                                                                )}

                                                                {fieldType[index] === 'Password' && (
                                                                    <Field
                                                                        name={`${fieldName[index]}`} // Use dynamic field name
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
                                                                                />
                                                                                {meta.error && meta.touched && <p className='d-block text-danger'>{meta.error}</p>}
                                                                            </div>
                                                                        )}
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

                                                            </Col>
                                                        );
                                                    })}
                                                </Row>
                                            )}

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
                                            {!showNextStep && (

                                                <Row>
                                                    <Col md="12">
                                                        <Field
                                                            name="cs_addons"
                                                            initialValue={Data?.cs_addons || ''}
                                                            validate={option}
                                                        >
                                                            {({ input, meta, form }) => {
                                                                const selectedOptions = input.value ? input.value.split(',').map(id => parseInt(id)) : [];
                                                                console.log("current selected addon", selectedOptions);

                                                                const toggleAddon = (addonId, addonName, addonCatType, workshopId) => {
                                                                    const isSelected = selectedOptions.includes(addonId);
                                                                    const updatedOptions = isSelected
                                                                        ? selectedOptions.filter(id => id !== addonId)
                                                                        : [...selectedOptions, addonId];

                                                                    console.log("Updated select", updatedOptions);

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
                                                                // const handleAddPerson = (addonId, count) => {
                                                                //     setAddonCounts(prevCounts => ({
                                                                //         ...prevCounts,
                                                                //         [addonId]: count,
                                                                //     }));

                                                                //     setAddonFormData(prevData => ({
                                                                //         ...prevData,
                                                                //         [addonId]: Array.from({ length: count }, () => ({ name: '', age: '' })),
                                                                //     }));
                                                                // };



                                                                const handleInputChange = (addonId, index, field, value) => {
                                                                    setAddonFormData(prevData => ({
                                                                        ...prevData,
                                                                        [addonId]: prevData[addonId].map((entry, idx) =>
                                                                            idx === index ? { ...entry, [field]: value } : entry
                                                                        ),
                                                                    }));
                                                                };

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
                                                                                        const validRegisteredUser = Array.isArray(registereduser) ? registereduser : [];
                                                                                        const userTicketCount = validRegisteredUser.filter(user => user.cs_ticket === ticket.ticket_id).length;
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



                                            {/* Row for the checkbox - hide this when Next is clicked */}
                                            {!showNextStep && (
                                                <Row>
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
                                                                        <strong>Do you want to send a confirmation email to User ?</strong>
                                                                    </Label>
                                                                    {meta.error && meta.touched && <p className='d-block text-danger'>{meta.error}</p>}
                                                                </div>
                                                            )}
                                                        </Field>
                                                    </Col>
                                                </Row>
                                            )}

                                            {/* Conditionally render the fields when showNextStep is true */}
                                            {showNextStep && (
                                            <>
                                                {/* First Row */}
                                                <Row>
                                                    <Col xs={12} sm={6} md={4} className="mb-3">
                                                        {/* <Field name="paymenttype_id">
                                                                {({ input, meta }) => (
                                                                    <div>
                                                                        <Label className="form-label" for="paymenttype_id">
                                                                            <strong>Payment Status</strong><span className="text-danger"> *</span>
                                                                        </Label>
                                                                        <input
                                                                            {...input}
                                                                            className="form-control"
                                                                            id="paymenttype_id"
                                                                            placeholder="Payment Status"
                                                                        />
                                                                        {meta.error && meta.touched && <p className="d-block text-danger">{meta.error}</p>}
                                                                    </div>
                                                                )}
                                                            </Field> */}

                                                        <Field
                                                            name="paymentstatus_id"
                                                            initialValue={Data?.paymentstatus_id}
                                                        >
                                                            {({ input, meta }) => {
                                                                const selectedOption = paymentStatusOptions.find(option => option.value === input.value);

                                                                console.log("Selected Option", selectedOption);

                                                                return (
                                                                    <div>
                                                                        <Label className='form-label' for="paymentstatus_id"><strong>Payment Status</strong></Label>
                                                                        <Select
                                                                            {...input}
                                                                            options={paymentStatusOptions}
                                                                            placeholder={`Select Payment Status`}
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

                                                    <Col xs={12} sm={6} md={4} className="mb-3">
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
                                                        <Field
                                                            name="paymenttype_id"
                                                            initialValue={Data?.paymenttype_id}
                                                        >
                                                            {({ input, meta }) => {
                                                                const selectedOption = paymentTypeOptions.find(option => option.value === input.value);

                                                                console.log("Selected Type Option", selectedOption);

                                                                return (
                                                                    <div>
                                                                        <Label className='form-label' for="paymenttype_id"><strong>Payment Type</strong></Label>
                                                                        <Select
                                                                            {...input}
                                                                            options={paymentTypeOptions}
                                                                            placeholder={`Select Payment Status`}
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

                                                    <Col xs={12} sm={6} md={4} className="mb-3">
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


                                                </Row>
                                                <Row>

                                                    <Col xs={12} sm={6} md={4} className="mb-3">
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

                                                    <Col xs={12} sm={6} md={4} className="mb-3">
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

                                                    <Col xs={12} sm={6} md={4} className="mb-3">
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
                                                </Row>
                                                <Row>


                                                    <Col xs={12} sm={6} md={4} className="mb-3">
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
                                                    </Col>



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

                                                    <Col xs={12} sm={6} md={4} className="mb-3">
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
                                                    </Col>
                                                </Row>

                                                <Row>
                                                    <Col xs={12} sm={6} md={4} className="mb-3">
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
                                            </>
                                             )} 


                                            {/* Next button (shown when checkbox is unchecked and on the first step) */}
                                            {!showNextStep && !isChecked && (
                                                <Row>
                                                    <Col xs={12}>
                                                        <Button color='primary' className="me-2 mt-3" onClick={handleNextClick}>Next</Button>
                                                    </Col>
                                                </Row>
                                            )}

                                            {/* Back and Submit buttons when the third row is shown */}
                                            {(showNextStep || isChecked) && (
                                                <Row className="d-flex justify-content-between align-items-center">
                                                    <Col xs="auto">
                                                        {/* Hide Back button when the checkbox is checked */}
                                                        {showNextStep && (
                                                            <Button color='success' className="me-2 mt-3" onClick={handleBackClick}>Back</Button>
                                                        )}
                                                    </Col>
                                                    <Col xs="auto">
                                                        {/* <Button color='warning' className="me-2 mt-3">Cancel</Button> */}
                                                        <Button color='primary' type='submit' className="me-2 mt-3">Submit</Button>
                                                    </Col>
                                                </Row>

                                            )}

                                        </form>
                                    )}
                                >
                                </Form>

                            </CardBody>
                        </Card>
                    </Col>
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

export default AddRegUser;




