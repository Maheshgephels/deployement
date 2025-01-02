import React, { Fragment, useState, useEffect, useContext } from 'react';
import { Container, Row, Col, Input, Label, Button, Card, CardBody, Modal, ModalHeader, Table, FormFeedback, ModalBody, ModalFooter, Media, PopoverBody, UncontrolledPopover } from 'reactstrap';
import { useForm } from 'react-hook-form';
import axios from 'axios';
import { BackendAPI } from '../../api';
import SweetAlert from 'sweetalert2';
// import { Input } from 'antd';
import { Breadcrumbs } from '../../AbstractElements';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { MdDelete, MdInfoOutline } from "react-icons/md";
import { FaUser, FaRegIdCard, FaMoneyBillWave, FaTicketAlt, FaPlus } from 'react-icons/fa';
import Select from 'react-select';
import { Field, Form } from 'react-final-form'; // Import Field and Form from react-final-form
import { required, email, Img, PDF, option, number, Name, NAME, radio, expiryDate } from '../Utils/validationUtils';
import { PermissionsContext } from '../../contexts/PermissionsContext';
import useAuth from '../../Auth/protectedAuth';
import { getToken } from '../../Auth/Auth';
import { Divider } from 'antd';





//Utility function used to combine multiple validation functions into a single validation function
const composeValidators = (...validators) => value =>
    validators.reduce((error, validator) => error || validator(value), undefined);

const EditCatPack = () => {
    useAuth();
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modal, setModal] = useState(false);
    const [error, setError] = useState('');
    const [fieldLabels, setFieldLabels] = useState([]);
    const [fieldType, setFieldType] = useState([]);
    const [requiredfield, setRequiredField] = useState([]); // Define requiredfield state
    const [fieldId, setFieldId] = useState([]);
    const [fieldName, setFieldName] = useState([]);
    const navigate = useNavigate(); // Initialize useHistory
    const location = useLocation();
    const { Data } = location.state || {};
    const [currencydata, setCurrencydata] = useState([]);
    const [currency, setCurrency] = useState(''); // Initially null or a default value
    const [prefixes, setPrefixes] = useState([]);
    const [state, setState] = useState([]);
    const [country, setCountry] = useState([]);
    const [regCat, setRegCat] = useState([]);
    const [workshop, setWorkshop] = useState([]);
    const [dayType, setDayType] = useState([]);
    const [custom, setCustom] = useState([]);
    const [customfield, setCustomfield] = useState([]);
    const [ticket, setTicket] = useState([]);
    const [filteredTickets, setFilteredTickets] = useState([]); // State for filtered tickets
    const [filteredAddon, setFilteredAddon] = useState([]);
    const [paymentType, setPaymentType] = useState([]);
    const [paymentStatus, setPaymentStatus] = useState([]);
    const [addon, setAddon] = useState([]);
    const [ticketAmount, setTicketAmount] = useState([]);
    const [addonAmount, setAddonAmount] = useState([]);
    const [username, setusername] = useState([]);
    const { permissions } = useContext(PermissionsContext);
    const [category, setCategory] = useState(''); // Define state and setter
    const [addonticket, setAddonTicket] = useState(''); // Define state and setter
    const [regAmount, setRegAmount] = useState(0);
    const [regAddonAmount, setRegAddonAmount] = useState(0);
    const [processingAmount, setProcessingAmount] = useState(0);
    const [processingFee, setProcessingFee] = useState(0);
    const [totalPaidAmount, settotalPaidAmount] = useState(0);
    const [showNextStep, setShowNextStep] = useState(false); // Handles when "Next" is clicked
    const [isChecked, setIsChecked] = useState(false); // Track the state of the checkbox
    const [sendEmail, setSendEmail] = useState(false);
    const [priceType, setPriceType] = useState('');
    const paymentTypeOptions = paymentType.map(type => ({
        value: type.paymenttype_id,
        label: type.paymenttype_name
    }));
    const paymentStatusOptions = paymentStatus.map(status => ({
        value: status.paymentstatus_id,
        label: status.paymentstatus_name
    }));
    const categoryOptions = regCat.map(status => ({
        value: status.cs_reg_cat_id,
        label: status.cs_reg_category
    }));

    // Step 1: Create a map of ticket amounts by ticket_id for quick lookup
    const ticketAmountMap = Object.fromEntries(
        ticketAmount.map(item => [item.ticket_id, item.tick_amount])
    );

    // Step 2: Create the ticketOptions array with the correct property names
    const ticketOptions = ticket.map(status => ({
        value: status.ticket_id,  // Correctly accessing ticket_id
        label: `${status.ticket_title} - Price: ${ticketAmountMap[status.ticket_id] || 'N/A'}` // Correctly using ticket_id for lookup
    }));

    console.log("Ticket Options with Price:", ticketOptions);

    const addonAmountMap = Object.fromEntries(
        addonAmount.map(item => [item.addon_id, item.addon_amount])
    );

    const addonOptions = addon.map(status => ({
        value: status.addon_id,
        label: `${status.addon_title} - Price: ${addonAmountMap[status.addon_id] || 'N/A'}` // Correctly using ticket_id for lookup
    }));

    const uniqueCurrencies = [
        ...new Set(currencydata.map((country) => country.cs_currencyCode)),
    ];
    const currencyOptions = uniqueCurrencies.map((currencyCode) => ({
        value: currencyCode,
        label: currencyCode,
    }));

    console.log("Addon Options with Price:", addonOptions);

    console.log("User Data", Data);
    console.log("Ticket", ticketOptions);
    console.log("Ticket Amount", ticketAmount);
    console.log("Addon", addon);
    console.log("PriceType:", priceType);


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
    // const [currency, setcurrency] = useState();
    const [processingfeeornot, setprocessingfeeornot] = useState();
    const [addonCounts, setAddonCounts] = useState({});
    const [registereduser, setregistereduser] = useState();

    const AddonAmountMap = Object.fromEntries(
        addonAmount.map(item => [item.addon_id, item.addon_amount])
    );












    // useEffect(() => {
    //     fetchFields(); // Corrected function name
    // }, [permissions]);

    useEffect(() => {
        fetchDropdown(); // Corrected function name
        fetchUserTicketcounts();
    }, [permissions]);

    // useEffect(() => {
    //     if (Data?.cs_addons && addon.length > 0) {
    //         console.log("Data.cs_addons:", Data.cs_addons);
    //         console.log("Addon array:", addon);

    //         // Convert Data.cs_addons to an array of integers
    //         const csAddonIds = Data.cs_addons.split(',').map(id => parseInt(id));
    //         console.log("Parsed csAddonIds:", csAddonIds);

    //         // Find matching addons from the addon array
    //         const matchingAddons = addon.filter(a => csAddonIds.includes(a.addon_id));
    //         console.log("Matching addons:", matchingAddons);

    //         // Initialize variables for state
    //         const initialSelectedAddonNames = [];
    //         let initialWorkshopCategory1 = '';
    //         const initialAddonCounts = {};
    //         const initialAddonFormData = {};

    //         // Iterate through matching addons
    //         matchingAddons.forEach(addon => {
    //             const { addon_id, addon_title, addon_cat_type, addon_workshop_id } = addon;

    //             console.log("Processing addon:", { addon_id, addon_title, addon_cat_type, addon_workshop_id });

    //             if (addon_cat_type === "1") {
    //                 initialWorkshopCategory1 = addon_workshop_id;
    //                 console.log("Set initialWorkshopCategory1:", initialWorkshopCategory1);
    //             }

    //             if (addon_cat_type === "2") {
    //                 initialAddonCounts[addon_id] = 1; // Default count
    //                 initialAddonFormData[addon_id] = [{ name: '', age: '' }];
    //                 console.log("Updated initialAddonCounts:", initialAddonCounts);
    //                 console.log("Updated initialAddonFormData:", initialAddonFormData);
    //             }

    //             initialSelectedAddonNames.push(addon_title);
    //             console.log("Added to initialSelectedAddonNames:", addon_title);
    //         });

    //         // Update state variables
    //         setSelectedAddonNames(initialSelectedAddonNames);
    //         console.log("Final selected addon names:", initialSelectedAddonNames);

    //         setWorkshopCategory1(initialWorkshopCategory1);
    //         console.log("Final WorkshopCategory1:", initialWorkshopCategory1);

    //         setAddonCounts(initialAddonCounts);
    //         console.log("Final addon counts:", initialAddonCounts);

    //         setAddonFormData(initialAddonFormData);
    //         console.log("Final addon form data:", initialAddonFormData);
    //     } else {
    //         console.log("Either Data.cs_addons or addon array is missing or empty.");
    //     }
    // }, [Data?.cs_addons]);


    // useEffect(() => {
    //     if (Data?.cs_addons && addon.length > 0) {
    //         console.log("Data.cs_addons:", Data.cs_addons);
    //         console.log("Addon array:", addon);

    //         // Convert Data.cs_addons to an array of integers
    //         const csAddonIds = Data.cs_addons.split(',').map(id => parseInt(id));
    //         console.log("Parsed csAddonIds:", csAddonIds);

    //         // Find matching addons from the addon array
    //         const matchingAddons = addon.filter(a => csAddonIds.includes(a.addon_id));
    //         console.log("Matching addons:", matchingAddons);

    //         // Initialize variables for state
    //         const initialSelectedAddonNames = [];
    //         let initialWorkshopCategory1 = '';
    //         const initialAddonCounts = {};
    //         const initialAddonFormData = {};
    //         const initialSelectedWorkshops = {};

    //         // Iterate through matching addons
    //         matchingAddons.forEach(addon => {
    //             const {
    //                 addon_id,
    //                 addon_title,
    //                 addon_cat_type,
    //                 addon_workshop_id,
    //                 addon_workshoprtype_id
    //             } = addon;

    //             console.log("Processing addon:", { addon_id, addon_title, addon_cat_type, addon_workshop_id });

    //             if (addon_cat_type === "1") {
    //                 initialWorkshopCategory1 = addon_workshop_id;
    //                 console.log("Set initialWorkshopCategory1:", initialWorkshopCategory1);

    //                 const currentWorkshop = addon_workshoprtype_id;
    //                 const updatedAddonId = addon_id;

    //                 initialSelectedWorkshops[addon_workshoprtype_id] =
    //                     updatedAddonId === null
    //                         ? undefined // Remove the workshop entry if null
    //                         : {
    //                             workshopType: workshoptypedata.find(
    //                                 (type) => type.id === parseInt(addon_workshoprtype_id, 10)
    //                             )?.workshoptype_name || "Unknown",
    //                             addon_workshop_id: addon_workshop_id,
    //                             selected_addon_id: updatedAddonId
    //                         };

    //                 console.log("Updated initialSelectedWorkshops:", initialSelectedWorkshops);
    //             }


    //             if (addon_cat_type === "2") {
    //                 // Call API to fetch accompanying persons
    //                 const token = getToken();
    //                 try {
    //                     const response = axios.post(`${BackendAPI}/paymentRoutes/accompanypersons`, {
    //                         Id: Data.id, // Send Data.id
    //                     }, {
    //                         headers: {
    //                             Authorization: `Bearer ${token}`
    //                         }
    //                     });

    //                     console.log("API response for accompanypersons:", response);

    //                     const accompanyPersons = response.receiptData;

    //                     // Set the count of accompanying persons
    //                     initialAddonCounts[addon_id] = accompanyPersons.length; // Set the count based on data length
    //                     console.log("Updated initialAddonCounts:", initialAddonCounts);

    //                     // Add accompanying person details (name and age) to form data
    //                     initialAddonFormData[addon_id] = accompanyPersons.map(person => ({
    //                         name: person.accper_name,
    //                         age: person.accper_age,
    //                     }));
    //                     console.log("Updated initialAddonFormData:", initialAddonFormData);

    //                 } catch (error) {
    //                     console.error("API call error:", error);
    //                 }
    //             }

    //             initialSelectedAddonNames.push(addon_title);
    //             console.log("Added to initialSelectedAddonNames:", addon_title);

    //             // Update workshops state logic

    //         });

    //         // Update state variables
    //         setSelectedAddonNames(initialSelectedAddonNames);
    //         console.log("Final selected addon names:", initialSelectedAddonNames);

    //         setWorkshopCategory1(initialWorkshopCategory1);
    //         console.log("Final WorkshopCategory1:", initialWorkshopCategory1);

    //         setAddonCounts(initialAddonCounts);
    //         console.log("Final addon counts:", initialAddonCounts);

    //         setAddonFormData(initialAddonFormData);
    //         console.log("Final addon form data:", initialAddonFormData);

    //         setSelectedWorkshops(initialSelectedWorkshops);
    //         console.log("Final selected workshops:", initialSelectedWorkshops);
    //     } else {
    //         console.log("Either Data.cs_addons or addon array is missing or empty.");
    //     }
    // }, [Data?.cs_addons, addon]);

    const fetchUserTicketcounts = async () => {
        try {
            // Assuming `Data.id` is available in the component's state or props
            const userId = Data.id; // Replace with the actual variable that contains the user ID

            // Send the user ID to the backend in the request body
            const response = await axios.post(`${BackendAPI}/reguser/getconfirmusers`, {
                userId: userId  // Sending the user ID in the request
            });


            console.log("registereduserdata", response.data);

            if (response.data) {
                const { cs_ticket, cs_addons } = response.data.user;

                // Update Data.cs_ticket with the received ticket value
                Data.cs_ticket = cs_ticket;  // Assuming it's a string or number, you can assign it directly

                // If cs_addons is a string (like '2,4'), split it into an array and store in Data.addons
                if (cs_addons) {
                    Data.cs_addons = cs_addons; // Convert to an array of integers
                }

                console.log("Updated Ticket Data:", Data.cs_ticket);
                console.log("Updated Addons Data:", Data.cs_addons);
            }

        } catch (error) {
            console.error('Error fetching user tickets:', error);
        }
    };


    useEffect(() => {
        const fetchAccompanyPersons = async () => {
            if (Data?.cs_addons && addon.length > 0) {
                console.log("Data.cs_addons:", Data.cs_addons);
                console.log("Addon array:", addon);

                // Convert Data.cs_addons to an array of integers
                const csAddonIds = Data.cs_addons.split(',').map(id => parseInt(id));
                console.log("Parsed csAddonIds:", csAddonIds);

                // Find matching addons from the addon array
                const matchingAddons = addon.filter(a => csAddonIds.includes(a.addon_id));
                console.log("Matching addons:", matchingAddons);

                // Initialize variables for state
                const initialSelectedAddonNames = [];
                let initialWorkshopCategory1 = '';
                const initialAddonCounts = {};
                const initialAddonFormData = {};
                const initialSelectedWorkshops = {};

                // Iterate through matching addons
                for (const addon of matchingAddons) {
                    const {
                        addon_id,
                        addon_title,
                        addon_cat_type,
                        addon_workshop_id,
                        addon_workshoprtype_id
                    } = addon;

                    console.log("Processing addon:", { addon_id, addon_title, addon_cat_type, addon_workshop_id });

                    if (addon_cat_type === "1") {
                        initialWorkshopCategory1 = addon_workshop_id;
                        console.log("Set initialWorkshopCategory1:", initialWorkshopCategory1);

                        const currentWorkshop = addon_workshoprtype_id;
                        const updatedAddonId = addon_id;

                        initialSelectedWorkshops[addon_workshoprtype_id] =
                            updatedAddonId === null
                                ? undefined // Remove the workshop entry if null
                                : {
                                    workshopType: workshoptypedata.find(
                                        (type) => type.id === parseInt(addon_workshoprtype_id, 10)
                                    )?.workshoptype_name || "Unknown",
                                    addon_workshop_id: addon_workshop_id,
                                    selected_addon_id: updatedAddonId
                                };

                        console.log("Updated initialSelectedWorkshops:", initialSelectedWorkshops);
                    }

                    if (addon_cat_type === "2") {
                        // Call API to fetch accompanying persons
                        const token = getToken();
                        try {
                            const response = await axios.post(`${BackendAPI}/paymentRoutes/accompanypersons`, {
                                Id: Data.id, // Send Data.id
                            }, {
                                headers: {
                                    Authorization: `Bearer ${token}`
                                }
                            });

                            console.log("API response for accompanypersons:", response);

                            const accompanyPersons = response.data.receiptData; // Corrected to use response.data

                            // Set the count of accompanying persons
                            initialAddonCounts[addon_id] = accompanyPersons.length; // Set the count based on data length
                            console.log("Updated initialAddonCounts:", initialAddonCounts);

                            // Add accompanying person details (name and age) to form data
                            initialAddonFormData[addon_id] = accompanyPersons.map(person => ({
                                id: person.accper_id,
                                name: person.accper_name,
                                age: person.accper_age,
                            }));
                            console.log("Updated initialAddonFormData:", initialAddonFormData);

                        } catch (error) {
                            console.error("API call error:", error);
                        }
                    }

                    initialSelectedAddonNames.push(addon_title);
                    console.log("Added to initialSelectedAddonNames:", addon_title);
                }

                // Update state variables
                setSelectedAddonNames(initialSelectedAddonNames);
                console.log("Final selected addon names:", initialSelectedAddonNames);

                setWorkshopCategory1(initialWorkshopCategory1);
                console.log("Final WorkshopCategory1:", initialWorkshopCategory1);

                setAddonCounts(initialAddonCounts);
                console.log("Final addon counts:", initialAddonCounts);

                setAddonFormData(initialAddonFormData);
                console.log("Final addon form data:", initialAddonFormData);

                setSelectedWorkshops(initialSelectedWorkshops);
                console.log("Final selected workshops:", initialSelectedWorkshops);

            } else {
                console.log("Either Data.cs_addons or addon array is missing or empty.");
            }
        };

        // Call the async function
        fetchAccompanyPersons();
    }, [Data?.cs_addons, addon]); // Depend on Data.cs_addons and addon to trigger useEffect







    // Extract Add User setting Permissions component
    const AddUserPermissions = permissions['EditCatPack'];

    // const fetchFields = async () => {
    //     try {
    //         const token = getToken();
    //         const response = await axios.get(`${BackendAPI}/reguser/getField`, {
    //             headers: {
    //                 Authorization: `Bearer ${token}` // Include the token in the Authorization header
    //             }
    //         });
    //         const fieldsData = response.data.Fields;
    //         const requiredfield = fieldsData.map(field => field.cs_is_required);
    //         const fieldLabels = fieldsData.map(field => field.cs_field_label);
    //         const fieldType = fieldsData.map(field => field.field_type_name);
    //         const fieldId = fieldsData.map(field => field.cs_field_id);
    //         const fieldName = fieldsData.map(field => field.cs_field_name);
    //         const customfield = fieldsData.map(field => field.cs_iscustom);


    //         console.log("Data:", fieldsData);
    //         console.log("Custom:", customfield);



    //         // setData(fieldsData);
    //         setFieldLabels(fieldLabels);
    //         setFieldType(fieldType);
    //         setFieldName(fieldName);
    //         setCustomfield(customfield);
    //         setRequiredField(requiredfield); // Set requiredfield state
    //         setFieldId(fieldId);
    //         setLoading(false);

    //         // console.log('Id:', fieldName);
    //     } catch (error) {
    //         console.error('Error fetching Fields:', error);
    //         setLoading(false);
    //     }
    // };

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
    //                 const currentAmount = amount; // No parseFloat needed if regAmount is already a number
    //                 const processingPercentage = processingFee.cs_value; // Should be a number
    //                 const processingFeeAmount = (amount * processingPercentage) / 100; // Correct calculation without parseFloat

    //                 setProcessingAmount(processingFeeAmount); // Set the calculated processing fee
    //                 settotalPaidAmount(currentAmount + processingFeeAmount);

    //                 console.log("Matched Ticket Amount:", amount);
    //                 console.log("Processing Fee Amount:", processingFeeAmount);
    //             } else {
    //                 setRegAmount(0); // Reset if no matching ticket is found
    //                 setProcessingAmount(0); // Reset processing amount as well
    //                 settotalPaidAmount(0);
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

    //         }
    //     };

    //     // Call the filter functions
    //     filterTickets(); // Call the filter function
    //     filterAddon(); // Call the filter function
    // }, [category, addonticket]); // Run effect when category or tickets change


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

    }, [category, addonticket]); // Run effect when category or tickets change


    console.log("Addon Ticket", addonticket);
    console.log("Ticket Amount", ticketAmount);

    const handleCancel = () => {
        setModal(true);
    };

    // const onSubmit = async (formData) => {
    //     const username = formData.cs_first_name;

    //     // Validate price type selection
    //     if (!priceType) {
    //         setError('Please select any one of the above options.');
    //         return;
    //     }

    //     try {
    //         // Separate fields into `values` and `paymentDetails`
    //         const values = {};
    //         const paymentDetails = {};

    //         // Define payment-related fields
    //         const paymentFields = [
    //             'total_paid_amount',
    //             'processing_fee',
    //             'conference_fees',
    //             'branch',
    //             'bank',
    //             'payment_date',
    //             'tracking_id',
    //             'payment_mode',
    //             'paymenttype_id',
    //             'paymentstatus_id',
    //             'currency',
    //             'user_id'
    //         ];

    //         for (const key in formData) {
    //             if (Object.hasOwnProperty.call(formData, key)) {
    //                 const fieldValue = formData[key]?.value !== undefined ? formData[key].value : formData[key];

    //                 // Skip adding `sendEmail` to `values`
    //                 if (key === 'sendEmail') continue;

    //                 // Check if the field is related to payment details
    //                 if (paymentFields.includes(key)) {
    //                     paymentDetails[key] = fieldValue || ''; // Assign empty string if the value is missing
    //                 } else {
    //                     values[key] = fieldValue || ''; // Assign empty string if the value is missing
    //                 }
    //             }
    //         }

    //         console.log('Payment details to send:', paymentDetails);
    //         console.log('Values to send:', values);

    //         // Set any additional payment details if required
    //         if (Object.keys(paymentDetails).length > 0) {
    //             paymentDetails.payment_mode = paymentDetails.payment_mode || 'Offline'; // Set a default payment mode
    //             paymentDetails.user_id = Data.id;

    //             // If payment details are available, set cs_iscomplimentary to 0
    //             values.cs_iscomplimentary = 0;
    //         } else {
    //             // If no payment details, set cs_iscomplimentary to 1
    //             values.cs_iscomplimentary = 1;
    //         }

    //         Object.values(selectedWorkshops).forEach(workshop => {
    //             const formattedWorkshopType = `cs_${workshop.workshopType.toLowerCase().replace(/\s+/g, '')}`;  // Remove spaces
    //             values.append(formattedWorkshopType, workshop.addon_workshop_id);
    //         });
    //         values.append('accompany_person_data', JSON.stringify(addonFormData));

    //         const token = getToken();

    //         // Make the API call
    //         const response = await axios.post(`${BackendAPI}/paymentRoutes/editfCatPack`, {
    //             data: values, // Send the filtered data
    //             paymentDetails, // Send the payment details separately
    //             Id: Data.id,
    //             sendEmail: formData.sendEmail // Pass `sendEmail` directly if needed
    //         }, {
    //             headers: {
    //                 Authorization: `Bearer ${token}`
    //             }
    //         });

    //         if (response.data.success) {
    //             SweetAlert.fire({
    //                 title: 'Success!',
    //                 html: `Category and package changed for <b>${Data.cs_first_name}</b> successfully!`,
    //                 icon: 'success',
    //                 timer: 3000,
    //                 showConfirmButton: false,
    //                 allowOutsideClick: false,
    //                 allowEscapeKey: false
    //             }).then((result) => {
    //                 if (result.dismiss === SweetAlert.DismissReason.timer) {
    //                     navigate(`${process.env.PUBLIC_URL}/registration/confirm-user-listing/Consoft`);
    //                 }
    //             });
    //         }
    //     } catch (error) {
    //         console.error('Error creating user:', error.message);
    //     }
    // };


    const onSubmit = async (formData) => {
        const username = formData.cs_first_name;

        // Validate price type selection
        if (!priceType) {
            setError('Please select any one of the above options.');
            return;
        }

        try {
            // Separate fields into `values` and `paymentDetails`
            const values = new FormData(); // Use FormData instead of a plain object
            const paymentDetails = {};

            // Define payment-related fields
            const paymentFields = [
                'total_paid_amount',
                'processing_fee',
                'conference_fees',
                'branch',
                'bank',
                'payment_date',
                'tracking_id',
                'payment_mode',
                'paymenttype_id',
                'paymentstatus_id',
                'currency',
                'user_id'
            ];

            for (const key in formData) {
                if (Object.hasOwnProperty.call(formData, key)) {
                    const fieldValue = formData[key]?.value !== undefined ? formData[key].value : formData[key];

                    // Skip adding `sendEmail` to `values`
                    if (key === 'sendEmail') continue;

                    // Check if the field is related to payment details
                    if (paymentFields.includes(key)) {
                        paymentDetails[key] = fieldValue || ''; // Assign empty string if the value is missing
                    } else {
                        values.append(key, fieldValue || ''); // Assign empty string if the value is missing
                    }
                }
            }

            console.log('Payment details to send:', paymentDetails);

            // Set any additional payment details if required
            if (Object.keys(paymentDetails).length > 0) {
                paymentDetails.payment_mode = paymentDetails.payment_mode || 'offline'; // Set a default payment mode
                paymentDetails.user_id = Data.id;

                // If payment details are available, set cs_iscomplimentary to 0
                values.append('cs_iscomplimentary', 0);
            } else {
                // If no payment details, set cs_iscomplimentary to 1
                values.append('cs_iscomplimentary', 1);
            }

            Object.values(selectedWorkshops).forEach(workshop => {
                const formattedWorkshopType = `cs_${workshop.workshopType.toLowerCase().replace(/\s+/g, '')}`; // Remove spaces
                values.append(formattedWorkshopType, workshop.addon_workshop_id);
            });

            values.append('accompany_person_data', JSON.stringify(addonFormData));

            const token = getToken();

            // Make the API call
            const response = await axios.post(`${BackendAPI}/paymentRoutes/editCatPack`, {
                data: Object.fromEntries(values), // Convert FormData to a plain object if required
                paymentDetails, // Send the payment details separately
                Id: Data.id,
                sendEmail: formData.sendEmail // Pass `sendEmail` directly if needed
            }, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            if (response.data.success) {
                SweetAlert.fire({
                    title: 'Success!',
                    html: `Category and package changed for ${Data.cs_first_name} successfully!`,
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
        } catch (error) {
            console.error('Error creating user:', error.message);
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
    //         setLoading(false);

    //         const fetchPaymentType = response.data.paymentType;
    //         const fetchPaymentStatus = response.data.paymentStatus;
    //         const fetchregcat = response.data.regCategory;
    //         const fetchTicket = response.data.ticket;
    //         const fetchAddon = response.data.addon;
    //         const fetchTicketAmount = response.data.ticketAmount;
    //         const fetchAddonAmount = response.data.addonAmount;

    //         setPaymentType(fetchPaymentType);
    //         setPaymentStatus(fetchPaymentStatus);
    //         setRegCat(fetchregcat);
    //         setTicket(fetchTicket);
    //         setAddon(fetchAddon);
    //         setTicketAmount(fetchTicketAmount); // Set the filtered ticket amounts
    //         setAddonAmount(fetchAddonAmount);


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
            const fetchCurrency = response.data.currency[0]?.cs_value;
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
            setCurrency({ value: fetchCurrency, label: fetchCurrency });
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

    const fetchCurrency = async () => {
        try {
            const token = getToken();
            const response = await axios.get(`${BackendAPI}/paymentRoutes/getDropdownData`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            setLoading(false);


            const { currency: fetchcurrency } = response.data;



            setCurrencydata(fetchcurrency);
        } catch (error) {
            console.error('Error fetching dropdown data:', error);
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCurrency();
    }, []);




    const handleNavigation = () => {
        navigate(`${process.env.PUBLIC_URL}/registration/confirm-user-listing/Consoft`);
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

    const handlePriceChange = (e) => {
        setPriceType(e.target.value);
        setError('');
    };



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






    return (
        <Fragment>
            <Breadcrumbs parentClickHandler={handleNavigation} mainTitle="Change Package" parent="Manage User" title="Change Package" />
            <Container fluid={true}>
                <Row>
                    <Col sm="12">
                        <Card>
                            <CardBody>
                                <h5 className="mb-4 text-start">User Details</h5>
                                <ul className="list-unstyled">
                                    <li className="mb-2">
                                        <FaUser className="me-2" />
                                        <strong>Name:</strong> {Data.cs_first_name} {Data.cs_last_name}
                                    </li>
                                    <li className="mb-2">
                                        <FaRegIdCard className="me-2" />
                                        <strong>Registration Number:</strong> {Data.cs_regno}
                                    </li>
                                </ul>

                                <Form onSubmit={onSubmit}>
                                    {({ handleSubmit }) => (
                                        <form className="needs-validation" noValidate="" onSubmit={handleSubmit}>
                                            <Row>
                                                <Col xs={12} sm={6} md={4} className="mb-3 mt-3">
                                                    <Field name="cs_reg_cat_id" initialValue={Data?.cs_reg_cat_id}>
                                                        {({ input, meta }) => {

                                                            const selectedOption = categoryOptions.find(option => option.value === input.value);
                                                            return (
                                                                <div>
                                                                    <Label className="form-label" for="paymenttype_id"><strong>Registration Category</strong></Label>
                                                                    <Select
                                                                        {...input}
                                                                        options={categoryOptions}
                                                                        placeholder="Select Category"
                                                                        isSearchable={true}
                                                                        onChange={(value) => input.onChange(value)}
                                                                        onBlur={input.onBlur}
                                                                        classNamePrefix="react-select"
                                                                        isMulti={false}
                                                                        value={selectedOption}
                                                                    />
                                                                    {meta.error && meta.touched && <p className="d-block text-danger">{meta.error}</p>}
                                                                </div>
                                                            );
                                                        }}
                                                    </Field>
                                                </Col>
                                                <Col xs={12} sm={6} md={4} className="mb-3 mt-3">
                                                    <Field name="cs_ticket" initialValue={Data?.cs_ticket}>
                                                        {({ input, meta }) => {
                                                            // Ensure input.value and ticketOptions.values are of the same type
                                                            const selectedValue = input.value;  // This could be string or number
                                                            const selectedOption = ticketOptions.find(option =>
                                                                String(option.value) === String(selectedValue)  // Ensure comparison is type-agnostic
                                                            );

                                                            console.log("input.value", input.value);  // Check what value is being passed
                                                            console.log("selectedOption", selectedOption);  // Check if the selected option is correctly found

                                                            return (
                                                                <div>
                                                                    <Label className="form-label" for="paymenttype_id"><strong>Ticket</strong></Label>
                                                                    <Select
                                                                        {...input}
                                                                        options={ticketOptions}
                                                                        placeholder="Select Ticket"
                                                                        isSearchable={true}
                                                                        onChange={(value) => input.onChange(value.value)} // When selected, update the form value
                                                                        onBlur={input.onBlur}
                                                                        classNamePrefix="react-select"
                                                                        isMulti={false}  // Single selection
                                                                        value={selectedOption || null}  // Fallback to null if no option is found
                                                                    />
                                                                    {meta.error && meta.touched && <p className="d-block text-danger">{meta.error}</p>}
                                                                </div>
                                                            );
                                                        }}
                                                    </Field>
                                                </Col>


                                                {/* <Col xs={12} sm={6} md={4} className="mb-3 mt-3">
                                                    <Field name="cs_addons" initialValue={parseInt(Data?.cs_addons)}>
                                                        {({ input, meta }) => {
                                                            const selectedOption = addonOptions.find(option => option.value === input.value);
                                                            return (
                                                                <div>
                                                                    <Label className="form-label" for="paymenttype_id"><strong>Add-on</strong></Label>
                                                                    <Select
                                                                        {...input}
                                                                        options={addonOptions}
                                                                        placeholder="Select Addon"
                                                                        isSearchable={true}
                                                                        onChange={(value) => input.onChange(value)}
                                                                        onBlur={input.onBlur}
                                                                        classNamePrefix="react-select"
                                                                        isMulti={false}
                                                                        value={selectedOption}
                                                                    />
                                                                    {meta.error && meta.touched && <p className="d-block text-danger">{meta.error}</p>}
                                                                </div>
                                                            );
                                                        }}
                                                    </Field>
                                                </Col> */}
                                            </Row>

                                            {!showNextStep && filteredAddon.length > 0 && (
                                                <Row>
                                                    <Col md="12">
                                                        <Field
                                                            name="cs_addons"
                                                            initialValue={Data?.cs_addons || ''}
                                                        >
                                                            {({ input, meta, form }) => {
                                                                const selectedOptions = input.value ? input.value.split(',').map(id => parseInt(id)) : [];
                                                                console.log("current selected addon", selectedOptions);

                                                                // const toggleAddon = (addonId, addonName, addonCatType, workshopId) => {
                                                                //     const isSelected = selectedOptions.includes(addonId);
                                                                //     const updatedOptions = isSelected
                                                                //         ? selectedOptions.filter(id => id !== addonId)
                                                                //         : [...selectedOptions, addonId];

                                                                //     console.log("Updated select", updatedOptions);

                                                                //     input.onChange(updatedOptions.join(','));

                                                                //     setSelectedAddonNames(prevNames =>
                                                                //         isSelected
                                                                //             ? prevNames.filter(name => name !== addonName)
                                                                //             : [...prevNames, addonName]
                                                                //     );

                                                                //     if (addonCatType === "1") {

                                                                //         setWorkshopCategory1(isSelected ? '' : workshopId);
                                                                //     } else if (addonCatType === "2") {
                                                                //         setAddonCounts(prevCounts => ({
                                                                //             ...prevCounts,
                                                                //             [addonId]: isSelected ? 0 : (prevCounts[addonId] || 1),
                                                                //         }));
                                                                //         setAddonFormData(prevData => ({
                                                                //             ...prevData,
                                                                //             [addonId]: isSelected ? [] : (prevData[addonId] || [{ name: '', age: '' }]),
                                                                //         }));
                                                                //     }
                                                                // };

                                                                const toggleAddon = (addonId, addonName, addonCatType, workshopId) => {
                                                                    console.log("ToggleAddon called with:", { addonId, addonName, addonCatType, workshopId });

                                                                    // Check if the addon is already selected
                                                                    const isSelected = selectedOptions.includes(addonId);
                                                                    console.log("Is selected:", isSelected);

                                                                    // Update selected options
                                                                    const updatedOptions = isSelected
                                                                        ? selectedOptions.filter(id => id !== addonId)
                                                                        : [...selectedOptions, addonId];
                                                                    console.log("Updated options:", updatedOptions);

                                                                    // Trigger input change
                                                                    input.onChange(updatedOptions.join(','));
                                                                    console.log("Input value after change:", input.value);

                                                                    // Update selected addon names
                                                                    setSelectedAddonNames(prevNames => {
                                                                        const updatedNames = isSelected
                                                                            ? prevNames.filter(name => name !== addonName)
                                                                            : [...prevNames, addonName];
                                                                        console.log("Updated addon names:", updatedNames);
                                                                        return updatedNames;
                                                                    });

                                                                    // Handle category type-specific logic
                                                                    if (addonCatType === "1") {
                                                                        console.log("Addon category type 1 detected");
                                                                        setWorkshopCategory1(isSelected ? '' : workshopId);
                                                                        console.log("WorkshopCategory1 after update:", isSelected ? '' : workshopId);
                                                                    } else if (addonCatType === "2") {
                                                                        console.log("Addon category type 2 detected");

                                                                        // Update addon counts
                                                                        setAddonCounts(prevCounts => {
                                                                            const updatedCounts = {
                                                                                ...prevCounts,
                                                                                [addonId]: isSelected ? 0 : (prevCounts[addonId] || 1),
                                                                            };
                                                                            console.log("Updated addon counts:", updatedCounts);
                                                                            return updatedCounts;
                                                                        });

                                                                        // Update addon form data
                                                                        setAddonFormData(prevData => {
                                                                            const updatedFormData = {
                                                                                ...prevData,
                                                                                [addonId]: isSelected ? [] : (prevData[addonId] || [{ id: '', name: '', age: '' }]),
                                                                            };
                                                                            console.log("Updated addon form data:", updatedFormData);
                                                                            return updatedFormData;
                                                                        });
                                                                    }
                                                                };





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
                                                                        [addonId]: Array.from({ length: validatedCount }, (_, i) => prevData[addonId]?.[i] || { id: '', name: '', age: '' })
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
                                                                            addon.reduce((acc, addon) => {

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


                                            {/* Price Type Radio Buttons */}
                                            <Col md="12" className="mb-3">
                                                <div className="form-group">
                                                    {/* <strong>Price</strong> */}
                                                    <div className="me-5 mt-3">
                                                        <input
                                                            type="radio"
                                                            name="priceType"
                                                            value="AddPayment"
                                                            onChange={handlePriceChange}
                                                            className="me-2"
                                                        />
                                                        <strong>Add Payment</strong>
                                                        <input
                                                            type="radio"
                                                            name="priceType"
                                                            value="Complimentary"
                                                            checked={priceType === 'Complimentary'}
                                                            onChange={handlePriceChange}
                                                            className="ms-3 me-2"
                                                        />
                                                        <strong>Complimentary</strong>
                                                    </div>
                                                    {/* Show error if price type is not selected */}
                                                    {error && <p className='d-block text-danger'>{error}</p>}
                                                </div>
                                            </Col>



                                            {/* Add New Payment Section - Conditional Rendering */}
                                            {priceType === 'AddPayment' && (
                                                <>
                                                    <Divider />
                                                    <CardBody p-1>
                                                        <h5 className="mb-4 text-start">Add New Payment</h5>
                                                        <Row>
                                                            <Col xs={12} sm={6} md={4} className="mb-3">

                                                                <Field
                                                                    name="paymenttype_id"
                                                                    validate={option}
                                                                >
                                                                    {({ input, meta }) => {
                                                                        const selectedOption = paymentTypeOptions.find(option => option.value === input.value);

                                                                        console.log("Selected Type Option", selectedOption);

                                                                        return (
                                                                            <div>
                                                                                <Label className='form-label' for="paymenttype_id"><strong>Payment Type</strong><span className='text-danger'> *</span></Label>
                                                                                <Select
                                                                                    {...input}
                                                                                    options={paymentTypeOptions}
                                                                                    placeholder={`Select Payment Type`}
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

                                                                <Field
                                                                    name="paymentstatus_id"
                                                                    validate={option}

                                                                >
                                                                    {({ input, meta }) => {
                                                                        const selectedOption = paymentStatusOptions.find(option => option.value === input.value);

                                                                        console.log("Selected Option", selectedOption);

                                                                        return (
                                                                            <div>
                                                                                <Label className='form-label' for="paymentstatus_id"><strong>Payment Status</strong><span className='text-danger'> *</span></Label>
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
                                                                <Field name="tracking_id">
                                                                    {({ input, meta }) => (
                                                                        <div>
                                                                            <Label className="form-label" for="cheque_no">
                                                                                <strong>DD / CHEQUE NO. / TRANSACTION ID</strong>
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
                                                                                <strong>Payment Date & Time</strong>
                                                                            </Label>
                                                                            <input
                                                                                {...input}
                                                                                className="form-control"
                                                                                id="payment_date"
                                                                                type="datetime-local"
                                                                                placeholder="Enter Payment Date"
                                                                                // min={minDate}
                                                                                max="9999-12-31T23:59"
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
                                                                                <strong>Bank</strong>
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
                                                                                <strong>Branch</strong>
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
                                                                        <div className="form-group">
                                                                            <Label>
                                                                                <strong>Currency</strong>
                                                                            </Label>
                                                                            <Select
                                                                                {...input} // Spread input props provided by Field
                                                                                options={currencyOptions}
                                                                                value={currency} // Set the selected value
                                                                                onChange={(selectedOption) => {
                                                                                    input.onChange(selectedOption.value); // Update Field's value with selected option's value
                                                                                    setCurrency(selectedOption); // Update the state (if needed elsewhere)
                                                                                }}
                                                                                classNamePrefix="react-select"
                                                                            />
                                                                            {meta.error && meta.touched && <p className="d-block text-danger">{meta.error}</p>}
                                                                        </div>
                                                                    )}
                                                                </Field>
                                                            </Col>



                                                            <Col xs={12} sm={6} md={4} className="mb-3">
                                                                <Field name="conference_fees" validate={required}>
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
                                                                <Field name="processing_fee">
                                                                    {({ input, meta }) => (
                                                                        <div>
                                                                            <Label className="form-label" for="processing_fee">
                                                                                <strong>Processing Fees</strong>
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
                                                                    validate={required}
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

                                                    </CardBody>
                                                </>
                                            )}

                                            <Row>
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
                                                                <strong>Do you want to send a changed package email to {Data.cs_first_name} ?</strong>
                                                            </Label>
                                                            {meta.error && meta.touched && <p className='d-block text-danger'>{meta.error}</p>}
                                                        </div>
                                                    )}
                                                </Field>
                                            </Row>



                                            {/* Buttons */}
                                            <Row className="d-flex justify-content-between align-items-center">

                                                <Col xs="auto">
                                                    <Button color="primary" type="submit" className="me-2 mt-3">Submit</Button>

                                                    <Button color="warning" className="me-2 mt-3" onClick={handleCancel}>Cancel</Button>
                                                </Col>
                                            </Row>
                                        </form>
                                    )}
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
        </Fragment>
    );
};

export default EditCatPack;




