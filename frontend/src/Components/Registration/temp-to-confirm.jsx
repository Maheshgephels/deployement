import React, { Fragment, useState, useEffect, useContext } from 'react';
import { Container, Row, Col, Input, Label, Button, Card, CardBody, Modal, ModalHeader, FormFeedback, ModalBody, ModalFooter, Media, PopoverBody, UncontrolledPopover } from 'reactstrap';
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
import { required, email, Img, PDF, option, number, Name, NAME, radio, username, expiryDate } from '../Utils/validationUtils';
import { PermissionsContext } from '../../contexts/PermissionsContext';
import useAuth from '../../Auth/protectedAuth';
import { toast } from 'react-toastify';
import { getToken } from '../../Auth/Auth';
import moment from 'moment';



//Utility function used to combine multiple validation functions into a single validation function
const composeValidators = (...validators) => value =>
    validators.reduce((error, validator) => error || validator(value), undefined);

const AdminConfirmUser = () => {
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
    const [regAmount, setRegAmount] = useState('');
    const [regAddonAmount, setRegAddonAmount] = useState('');
    const [processingAmount, setProcessingAmount] = useState('');
    const [processingFee, setProcessingFee] = useState('');
    const [totalPaidAmount, settotalPaidAmount] = useState('');
    const { permissions } = useContext(PermissionsContext);
    const [category, setCategory] = useState(''); // Define state and setter
    const [addonticket, setAddonTicket] = useState(''); // Define state and setter
    const [showNextStep, setShowNextStep] = useState(false); // Handles when "Next" is clicked
    const [isChecked, setIsChecked] = useState(false); // Track the state of the checkbox
    const [sendEmail, setSendEmail] = useState(false);
    const [remark, SetRemark] = useState('');
    const paymentTypeOptions = paymentType.map(type => ({
        value: type.paymenttype_id,
        label: type.paymenttype_name
    }));
    const paymentStatusOptions = paymentStatus.map(status => ({
        value: status.paymentstatus_id,
        label: status.paymentstatus_name
    }));

    const AddonAmountMap = Object.fromEntries(
        addonAmount.map(item => [item.addon_id, item.addon_amount])
    );

    console.log("Addon Ticket", addonticket);
    console.log("Ticket Amount", ticketAmount);
    console.log("Addon Amount", addonAmount);
    console.log("Reg Amount", regAmount);
    console.log("Reg Addon Amount", regAddonAmount);
    console.log("Processing Fee", processingFee);
    console.log("Data", Data);







    const empty = '';



    // console.log("Ticket", ticket);
    console.log("Category to match", category);






    useEffect(() => {
        fetchFields(); // Corrected function name
    }, [permissions]);

    useEffect(() => {
        fetchDropdown(); // Corrected function name
    }, []);

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
    const [registereduser, setregistereduser] = useState();







    // Extract Add User setting Permissions component
    const AddUserPermissions = permissions['AdminConfirmUser'];

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

    const toSentenceCase = (str) => {
        if (!str) return ''; // Handle empty or undefined strings
        return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
    };

    const onSubmit = async (formData) => {
        const username = formData.cs_first_name;
        console.log("Form Data", formData);

        try {
            // Filter out fields with empty values and exclude payment-related fields from 'values'
            const toastId = toast.info('Processing...', { autoClose: false });
            const values = {};
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
                'paymenttype_id',
                'paymentstatus_id',
                'currency',
                'temppayment_id', // Added temppayment_id
            ];

            // for (const key in formData) {
            //     if (Object.hasOwnProperty.call(formData, key)) {
            //         if (formData[key].value !== '') {
            //             // Add payment-related fields to paymentDetails
            //             if (paymentFields.includes(key)) {
            //                 paymentDetails[key] = formData[key].value || formData[key];
            //             } else {
            //                 // Add other fields to values
            //                 values[key] = formData[key].value || formData[key];
            //             }
            //         }
            //     }
            // }

            for (const key in formData) {
                if (Object.hasOwnProperty.call(formData, key)) {
                    // Check if formData[key] is not null or undefined
                    if (formData[key] && formData[key].value !== '') {
                        // Add payment-related fields to paymentDetails
                        if (paymentFields.includes(key)) {
                            paymentDetails[key] = formData[key].value || formData[key];
                        } else {
                            // Add other fields to values
                            values[key] = formData[key].value || formData[key];
                        }
                    }
                }
            }

            if (values.cs_first_name) {
                values.cs_first_name = toSentenceCase(values.cs_first_name);
            }

            if (values.cs_last_name) {
                values.cs_last_name = toSentenceCase(values.cs_last_name);
            }


            // Add temppayment_id to paymentDetails manually from Data object
            if (Data?.temppayment_id) {
                paymentDetails.temppayment_id = Data.temppayment_id;
            }

            Object.values(selectedWorkshops).forEach((workshop) => {
                const formattedWorkshopType = `cs_${workshop.workshopType.toLowerCase().replace(/\s+/g, '')}`;
                values[formattedWorkshopType] = workshop.addon_workshop_id;
            });

            // Add accompany person data as JSON
            values.accompany_person_data = JSON.stringify(addonFormData);

            console.log('Formatted form data to send:', values);
            console.log('Payment details to send:', paymentDetails);

            const token = getToken();

            if (Data?.id) {
                // Make the API call to add user with separate data and payment details
                const response = await axios.post(`${BackendAPI}/reguser/addTempConfirmUser`, {
                    data: values, // Send the filtered data
                    paymentDetails: paymentDetails, // Send the payment details separately
                    Id: Data.id,
                    remark
                }, {
                    headers: {
                        Authorization: `Bearer ${token}` // Include the token in the Authorization header
                    }
                });

                toast.dismiss(toastId);


                if (response.data.success) {
                    SweetAlert.fire({
                        title: 'Success!',
                        text: sendEmail ?
                            `User ${username} created and mail sent successfully!` :
                            `User ${username} created successfully!`,
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
            } else {
                // Execute other API when Data is empty
                const alternateResponse = await axios.post(`${BackendAPI}/reguser/addBasConfUser`, {
                    data: values, // You can send the same or different data here
                    paymentDetails: paymentDetails,
                }, {
                    headers: {
                        Authorization: `Bearer ${token}` // Include the token in the Authorization header
                    }
                });

                if (alternateResponse.data.success) {
                    SweetAlert.fire({
                        title: 'Success!',
                        html: `User ${username} created successfully!`,
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






    useEffect(() => {
        const filterTickets = () => {
            if (category) {
                const parsedCategory = JSON.parse(category); // Parse the category

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
                setFilteredTickets(filtered); // Set filtered tickets
            } else {
                setFilteredTickets([]); // If no category, show all tickets
            }
        };

        const filterAddon = () => {
            if (addonticket) {
                const parsedAddon = JSON.parse(addonticket); // Parse the selected addon ticket
                console.log("Addon:", parsedAddon);

                // Find the matching ticket based on the addon ticket ID
                const matchedTicket = ticketAmount.find(ticketItem => ticketItem.ticket_id === parsedAddon);
                console.log("Matched", matchedTicket);
                if (matchedTicket) {
                    const amount = matchedTicket.tick_amount; // Get the ticket amount
                    setRegAmount(amount); // Store the ticket amount in regAmount

                    // Calculate the processing fee based on the percentage
                    const currentAmount = parseFloat(regAmount);
                    const processingPercentage = processingFee.cs_value; // This should be your percentage
                    const processingFeeAmount = parseFloat(amount * processingPercentage) / 100; // Calculate processing fee

                    console.log("Processing Fees", processingFeeAmount);

                    setProcessingAmount(processingFeeAmount); // Set the calculated processing fee
                    settotalPaidAmount(currentAmount + processingFeeAmount);
                    console.log("Matched Ticket Amount:", amount);
                    console.log("Processing Fee Amount:", processingFeeAmount);
                } else {
                    setRegAmount(''); // Reset if no matching ticket is found
                    setProcessingAmount(0); // Reset processing amount as well
                }


                const filtered = addon.filter(addon => {
                    if (addon.addon_ticket_ids && addon.addon_ticket_ids !== 'null') {
                        try {
                            const parsedTicketIds = JSON.parse(addon.addon_ticket_ids);
                            console.log("Parsed Ticket Addon IDs:", parsedTicketIds);
                            return Array.isArray(parsedTicketIds) && parsedTicketIds.includes(parsedAddon);
                        } catch (e) {
                            console.error("Error parsing addon ticket IDs:", e);
                            return false; // Return false if parsing fails
                        }
                    }
                    return false; // If addon_ticket_ids is null or invalid, return false 
                });

                setFilteredAddon(filtered); // Set the filtered addons
            } else {
                setFilteredAddon([]); // If no category, reset the filtered addons
                setRegAmount(''); // Reset regAmount if no addonticket
            }
        };

        // Call the filter functions
        filterTickets(); // Call the filter function
        filterAddon(); // Call the filter function
    }, [category, addonticket, ticket]); // Run effect when category or tickets change

    console.log("Addon Ticket", addonticket);
    console.log("Ticket Amount", ticketAmount);






    const fetchDropdown = async () => {
        try {
            const token = getToken();
            const response = await axios.get(`${BackendAPI}/reguser/getDropdownData`, {
                headers: {
                    Authorization: `Bearer ${token}` // Include the token in the Authorization header
                }
            });

            setData(response.data);
            console.log(response.data);
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

            console.log("Fetched Ticket Amount", fetchTicketAmount);

            // Get the current date
            const currentDate = new Date();

            // Filter ticket amounts based on the current date
            const filteredTicketAmount = fetchTicketAmount.filter(ticket => {
                const startDate = new Date(ticket.tick_duration_start_date);
                const endDate = new Date(ticket.tick_duration_till_date);
                return startDate <= currentDate && endDate >= currentDate;
            });

            // Log filtered ticket amounts
            console.log("Filtered Ticket Amount", filteredTicketAmount);

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
            setTicketAmount(filteredTicketAmount); // Set the filtered ticket amounts
            setAddonAmount(fetchAddonAmount);
            setProcessingFee(fetchProcessingFee);

            console.log(fetchprefixes);

        } catch (error) {
            console.error('Error fetching dropdown data:', error);
            setLoading(false);
        }
    };





    const handleNavigation = () => {
        navigate(`${process.env.PUBLIC_URL}/registration/temp-user-listing/Consoft`);
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

    const handleCancellation = (e) => {
        SetRemark(e.target.value);
    };


    return (
        <Fragment>
            <Breadcrumbs parentClickHandler={handleNavigation} mainTitle={
                <>
                    Confirm User
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
                            Verify the user's payment details carefully and confirm them.
                        </PopoverBody>
                    </UncontrolledPopover>
                </>
            } parent="Manage Temp User" title="Create Confirm User" />
            <Container fluid={true}>
                <Row>
                    <Col sm="12">
                        <Card>
                            <CardBody>
                                <Form onSubmit={onSubmit}>
                                    {({ handleSubmit }) => (
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
                                                                {
                                                                    fieldType[index] === 'Dropdown' && fieldLabels[index] === 'Ticket' && (
                                                                        <Field
                                                                            name={`${fieldName[index]}`} // Use dynamic field name
                                                                            initialValue={Data?.cs_ticket || ''}
                                                                            validate={requiredfield[index] === '1' ? composeValidators(option) : (value) => composeValidators()(value)}
                                                                        >
                                                                            {({ input, meta }) => {
                                                                                const selectedOption = ticket.find(option => option.ticket_id === parseInt(Data?.cs_ticket));


                                                                                let options = ticket.map(pref => ({
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

                                                                {/* Addon */}

                                                                {/* {fieldType[index] === 'Dropdown' && fieldLabels[index] === 'Addons' && (
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
                                                                                    addon.map(pref => ({ value: pref.addon_id, label: pref.addon_title })) :
                                                                                    [
                                                                                        { value: '', label: 'Select' }, // Adding the "Select" option as the first item
                                                                                        ...addon.map(pref => ({ value: pref.addon_id, label: pref.addon_title }))
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
                                                            )} */}

                                                                {/* {
                                                                    fieldType[index] === 'Dropdown' && fieldLabels[index] === 'Addons' && (
                                                                        <Field
                                                                            name={`${fieldName[index]}`} // Use dynamic field name
                                                                            initialValue={Data?.cs_addons || ''}
                                                                        // validate={requiredfield[index] === '1' ? composeValidators(option) : (value) => composeValidators()(value)}
                                                                        >
                                                                            {({ input, meta }) => {
                                                                                const selectedOption = addon.find(option => option.addon_id === parseInt(Data?.cs_addons));

                                                                                let options = addon.map(pref => ({
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
                                                                                                    const currentAmount = parseFloat(regAmount);
                                                                                                    const addonAmountToAdd = parseFloat(matchedAddon.addon_amount);
                                                                                                    const processingPercentage = processingFee.cs_value;
                                                                                                    const processingFeeAmount = parseFloat(currentAmount * processingPercentage) / 100; // Calculate processing fee

                                                                                                    setRegAddonAmount(matchedAddon.addon_amount); // Set the amount in regAmount
                                                                                                    setRegAmount(currentAmount + addonAmountToAdd);
                                                                                                    setProcessingAmount(processingFeeAmount);
                                                                                                    settotalPaidAmount(currentAmount + addonAmountToAdd + processingFeeAmount)
                                                                                                } else {
                                                                                                    setRegAddonAmount(''); // Reset if no matching addon amount is found
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
                                                                                                matchedOptions.map(option => ({ value: option.cs_field_option, label: option.cs_field_option })) :
                                                                                                [
                                                                                                    { value: '', label: 'Select' }, // Adding the "Select" option as the first item
                                                                                                    ...matchedOptions.map(option => ({ value: option.cs_field_option, label: option.cs_field_option }))
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
                                                                            initialValue={Data?.[fieldName[index]] || ''}
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
                                                                    fieldType[index] === 'Date' && (
                                                                        <Field
                                                                            name={`${fieldName[index]}`} // Use dynamic field name
                                                                            // initialValue={Data?.[fieldName[index]] || ''}
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
                                            {!showNextStep && (
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
                                                            {/* <Field
                                                                name="paymenttype_id"
                                                                initialValue={Data?.paymenttype_id}
                                                            >
                                                                {({ input, meta }) => (
                                                                    <div>
                                                                        <Label className='form-label' for="paymenttype_id"><strong>Payment Status</strong></Label>
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
                                                                            value={input.value}
                                                                        />
                                                                        {meta.error && meta.touched && <p className='d-block text-danger'>{meta.error}</p>}
                                                                    </div>
                                                                )}
                                                            </Field> */}

                                                            <Field
                                                                name="paymentstatus_id"
                                                                validate={option}
                                                                initialValue={Data?.paymentstatus_id}
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
                                                            {/* <Field
                                                                name="payment_mode"
                                                                initialValue={Data?.payment_mode}
                                                            >
                                                                {({ input, meta }) => (
                                                                    <div>
                                                                        <Label className='form-label' for="eventday"><strong>Payment Mode</strong></Label>
                                                                        <Select
                                                                            {...input}
                                                                            options={paymentTypeOptions}
                                                                            placeholder={`Select Payment Mode`}
                                                                            isSearchable={true}
                                                                            onChange={(value) => {
                                                                                input.onChange(value);
                                                                            }}
                                                                            onBlur={input.onBlur}
                                                                            classNamePrefix="react-select"
                                                                            isMulti={false}
                                                                            value={input.value}
                                                                        />
                                                                        {meta.error && meta.touched && <p className='d-block text-danger'>{meta.error}</p>}
                                                                    </div>
                                                                )}
                                                            </Field> */}

                                                            <Field
                                                                name="paymenttype_id"
                                                                validate={option}
                                                                initialValue={Data?.paymenttype_id}
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

                                                            <Field name="payment_mode"
                                                                initialValue={Data?.payment_mode}
                                                            >
                                                                {({ input, meta }) => (
                                                                    <div className="form-group">
                                                                        <label><strong>Ticket Status</strong></label>
                                                                        <Select
                                                                            {...input}
                                                                            value={{ label: input.value, value: input.value }} // Pre-select value in react-select
                                                                            onChange={(e) => input.onChange(e.value)} // Update form state
                                                                            options={[
                                                                                { value: 'online', label: 'Online' },
                                                                                { value: 'offline', label: 'Offline' },
                                                                            ]}
                                                                            classNamePrefix="react-select"
                                                                        // className={`form-control ${meta.touched && meta.error ? 'error-class' : ''}`}
                                                                        />
                                                                        {meta.touched && meta.error && (
                                                                            <FormFeedback>{meta.error}</FormFeedback>
                                                                        )}
                                                                    </div>
                                                                )}
                                                            </Field>
                                                        </Col>


                                                    </Row>
                                                    <Row>

                                                        <Col xs={12} sm={6} md={4} className="mb-3">
                                                            <Field name="cheque_no"
                                                                initialValue={Data?.cheque_no}
                                                            >
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

                                                        <Col xs={12} sm={6} md={4} className="mb-3">
                                                            <Field name="payment_date"
                                                                initialValue={
                                                                    Data?.payment_date
                                                                        ? moment(Data.payment_date).format('YYYY-MM-DDTHH:mm') // Include date and time
                                                                        : ''
                                                                }
                                                            >
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
                                                            <Field name="bank"
                                                                initialValue={Data?.bank}
                                                            >
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
                                                    </Row>
                                                    <Row>


                                                        <Col xs={12} sm={6} md={4} className="mb-3">

                                                            <Field name="branch"
                                                                initialValue={Data?.branch}
                                                            >
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



                                                        <Col xs={12} sm={6} md={4} className="mb-3">
                                                            <Field name="currency"
                                                                initialValue={Data?.currency}
                                                            >
                                                                {({ input, meta }) => (
                                                                    <div>
                                                                        <Label className="form-label" for="currency">
                                                                            <strong>Payment Currency</strong>
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
                                                            <Field name="conference_fees" validate={required}
                                                                initialValue={Data?.conference_fees}
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
                                                    </Row>

                                                    <Row>
                                                        <Col xs={12} sm={6} md={4} className="mb-3">

                                                            <Field name="processing_fee"
                                                                initialValue={Data?.processing_fee}                                                         >
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

                                                        <Col xs={12} sm={6} md={4} className="mb-3">
                                                            <Field name="total_paid_amount"
                                                                validate={required}
                                                                initialValue={Data?.current_paid_amount}
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
                                                        <Col xs={12} sm={6} md={4} className="mb-3">

                                                            <div className="mb-3">
                                                                <Label className='form-check-label' for="sendEmail">
                                                                    <strong>
                                                                        Remark
                                                                    </strong>
                                                                </Label>
                                                                <Input
                                                                    id="cancellation_message"
                                                                    type="textarea"
                                                                    onChange={handleCancellation}
                                                                    className="form-control"
                                                                />
                                                            </div>

                                                        </Col>
                                                    </Row>
                                                </>
                                            )}

                                            {/* Row for the checkbox - hide this when Next is clicked */}
                                            {!showNextStep && (
                                                <Row>
                                                    <Col md="8" className="mb-3">
                                                        {/* <Field name="cs_iscomplimentary" type="checkbox">
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
                                                        </Field> */}


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
                                                                        <strong>Do you want to send a confirmation email to {Data?.cs_first_name} ?</strong>
                                                                    </Label>
                                                                    {meta.error && meta.touched && <p className='d-block text-danger'>{meta.error}</p>}
                                                                </div>
                                                            )}
                                                        </Field>
                                                    </Col>
                                                </Row>
                                            )}


                                            {/* Conditionally render the fields when showNextStep is true */}



                                            {/* Next button (shown when checkbox is unchecked and on the first step) */}
                                            {/* {!showNextStep && !isChecked && (
                                                <Row>
                                                    <Col xs={12}>
                                                        <Button color='primary' className="me-2 mt-3" onClick={handleNextClick}>Next</Button>
                                                    </Col>
                                                </Row>
                                            )} */}

                                            {/* Back and Submit buttons when the third row is shown */}
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
                                            {(!showNextStep) && (
                                                <Row className="d-flex justify-content-between align-items-center">
                                                    {/* <Col xs="auto">
                                                        {showNextStep && (
                                                            <Button color='success' className="me-2 mt-3" onClick={handleBackClick}>Back</Button>
                                                        )}
                                                    </Col> */}
                                                    <Col xs="auto">
                                                        <Button color='warning' className="me-2 mt-3" onClick={handleCancel}>Cancel</Button>
                                                        <Button color='primary' type='submit' className="me-2 mt-3">Confirm User</Button>
                                                    </Col>
                                                </Row>

                                            )}

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
        </Fragment >
    );
};

export default AdminConfirmUser;




