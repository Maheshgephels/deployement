import React, { useState, useEffect, Fragment } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast, ToastContainer } from 'react-toastify';
import { Button, Form, FormGroup, Label, Input, Spinner, Card, CardBody, CardTitle, Col, Row, Container, CardHeader, Table, Media, Badge, UncontrolledPopover, PopoverBody } from 'reactstrap';
import { MdDelete, MdInfoOutline } from "react-icons/md";
import { Field, Form as FinalForm } from 'react-final-form'; // Import Form from react-final-form
import { BackendAPI } from "../../api";
import useDirectuser from '../../Auth/Directuser';
import { getToken } from '../../Auth/Auth';
import Select from 'react-select';
import { required, email, Img, PDF, option, number, Name, NAME, radio, expiryDate, shortbio, longbio, username1, password, Email } from '../Utils/validationUtils';
import moment from 'moment';
import Multipleuser from './mulipleuserform';
import SweetAlert from 'sweetalert2';
import Ordersummary from './order-summary';
import logo from "../../assets/images/logo/logo-icon.png";

//Utility function used to combine multiple validation functions into a single validation function
const composeValidators = (...validators) => value =>
  validators.reduce((error, validator) => error || validator(value), undefined);

const AddUserDirectly = () => {
  // useDirectuser();
  const navigate = useNavigate();
  const [categories, setCategories] = useState(['Admin', 'User', 'Guest']); // Example categories
  const [selectedCategory, setSelectedCategory] = useState('');
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [ticket, setTicket] = useState([]);
  const [addon, setAddon] = useState([]);
  const [prefixes, setPrefixes] = useState([]);
  const [state, setState] = useState([]);
  const [country, setCountry] = useState([]);
  const [regCat, setRegCat] = useState([]);
  const [workshop, setWorkshop] = useState([]);
  const [dayType, setDayType] = useState([]);
  const [custom, setCustom] = useState([]);
  const [customfield, setCustomfield] = useState([]);
  const [paymentType, setPaymentType] = useState([]);
  const [paymentStatus, setPaymentStatus] = useState([]);
  const [regAmount, setRegAmount] = useState(0);
  const [regAddonAmount, setRegAddonAmount] = useState(0);
  const [processingAmount, setProcessingAmount] = useState(0);
  const [processingFee, setProcessingFee] = useState(0);
  const [totalPaidAmount, settotalPaidAmount] = useState(0);
  const [ticketAmount, setTicketAmount] = useState([]);
  const [addonAmount, setAddonAmount] = useState([]);
  const [facultytype, setFacultyType] = useState([]);
  const [exhibitor, setExhibitor] = useState([]);

  const [paymentMode, setPaymentMode] = useState(); // Default to online
  const [gstfee, setgstfee] = useState();
  const [gstinclded, setgstinclded] = useState();
  const [gstamount, setgstamount] = useState();
  const [gstpercentage, setgstpercentage] = useState(18);
  const [processingfeein, setprocessingfeein] = useState();
  const [processinginclded, setprocessinginclded] = useState();
  const [currency, setCurrency] = useState();
  const [processingfeeornot, setprocessingfeeornot] = useState();
  const [multiperuser, setmultiperuser] = useState();
  const [addedPaymentMode, setAddedPaymentMode] = useState();
  const [workshopTypeData, setWorkshopType] = useState([]);
  const [selectCat, setSelectCat] = useState('');
  const [category, setCategory] = useState(''); // Define state and setter
  const [showNextStep, setShowNextStep] = useState(false); // Handles when "Next" is clicked
  const [showTableview, setshowTableview] = useState(false); // Handles when "Next" is clicked
  const [settingdata, setSettingData] = useState([]);
  const [filteredTickets, setFilteredTickets] = useState([]); // State for filtered tickets
  const [addonticket, setAddonTicket] = useState(''); // Define state and setter
  const [filteredAddon, setFilteredAddon] = useState([]);
  const [registereduser, setregistereduser] = useState();
  const [selectedCounts, setSelectedCounts] = useState({});
  const [isButtonEnabled, setIsButtonEnabled] = useState(false);
  const [showUserform, setShowUserform] = useState(false);
  const [fieldLabels, setFieldLabels] = useState([]);
  const [fieldType, setFieldType] = useState([]);
  const [requiredfield, setRequiredField] = useState([]); // Define requiredfield state
  const [fieldId, setFieldId] = useState([]);
  const [fieldName, setFieldName] = useState([]);
  const [StaticName, setStaticName] = useState([]);
  const [Useremail, setEmail] = useState('');
  const [primaryUserIndex, setPrimaryUserIndex] = useState(null);
  const [selectedAddonNames, setSelectedAddonNames] = useState([]);
  const [workshopCategory1, setWorkshopCategory1] = useState();
  const [addedpaymentmode, setaddedpaymentmode] = useState();
  const [addonCounts, setAddonCounts] = useState({});
  const [addonFormData, setAddonFormData] = useState({});
  const [workshoptypedata, setworkshoptype] = useState([]);
  const [Ticketwithcounter, setTicketwithcounter] = useState([]);


  const [selectedWorkshops, setSelectedWorkshops] = useState({}); // Tracks selected workshop per type

  const [paymentDetails, setPaymentDetails] = useState({
    cardNumber: '',
    cardExpiry: '',
    cardCVV: '',
  });

  useEffect(() => {
    fetchDropdown(); // Corrected function name
    fetchFields();
    fetchUserTicketcounts();
  }, []);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);

      const response = await axios.get(`${BackendAPI}/auth/getsettings`, {});
      const fetchedSettings = response.data.settings;

      if (!fetchedSettings || fetchedSettings === "Yes") {
        // Redirect to 404 if settings are invalid or "no"
        navigate(`${process.env.PUBLIC_URL}/404`);
      }

      setLoading(false);
    } catch (error) {
      console.error("Error fetching settings:", error);
      toast.error("Failed to load settings data");
      setLoading(false);
    }
  };

  const fetchDropdown = async () => {
    try {
      const response = await axios.get(`${BackendAPI}/directuser/getDropdownData`);
      setData(response.data);
      setLoading(false);

      const fetchPrefixes = response.data.prefix;
      const fetchState = response.data.states;
      const fetchCountry = response.data.country;
      const fetchRegCat = response.data.regCategory;
      const fetchWorkshop = response.data.workshop;
      const fetchDayType = response.data.dayType;
      const fetchCustomData = response.data.custom;
      const fetchTicket = response.data.ticket;
      const fetchAddon = response.data.addon;
      const fetchPaymentType = response.data.paymentType;
      const fetchPaymentStatus = response.data.paymentStatus;
      const fetchTicketAmount = response.data.ticketAmount;
      const fetchAddonAmount = response.data.addonAmount;
      const fetchProcessingFee = response.data.processingFees[0];
      const fetchFacultyType = response.data.facultytype;
      const fetchExhibitor = response.data.exhibitor;
      const fetchCurrency = response.data.currency[0];
      const fetchGstFee = response.data.gstfee[0];
      const fetchGstIncluded = response.data.gstinclded[0];
      const fetchProcessingFeeIn = response.data.processingfeein[0];
      const fetchProcessingIncluded = response.data.processinginclded[0];
      const fetchProcessingFeeOrNot = response.data.processingfeeornot[0];
      const multiperuser = response.data.multipleuserdata[0];
      const fetchGstAmount = response.data.gstamount[0];
      const fetchAddedPaymentMode = response.data.paymentmode[0];
      const fetchaddedpaymentmode = response.data.paymentmode[0];
      const { workshoptype: fetchWorkshopType } = response.data;

      setTicket(fetchTicket);
      setPrefixes(fetchPrefixes);
      setState(fetchState);
      setCountry(fetchCountry);
      setRegCat(fetchRegCat);
      setWorkshop(fetchWorkshop);
      setDayType(fetchDayType);
      setCustom(fetchCustomData);
      setAddon(fetchAddon);
      setPaymentType(fetchPaymentType);
      setPaymentStatus(fetchPaymentStatus);
      setTicketAmount(fetchTicketAmount); // Set the filtered ticket amounts
      setAddonAmount(fetchAddonAmount);
      setProcessingFee(fetchProcessingFee);
      setFacultyType(fetchFacultyType);
      setExhibitor(fetchExhibitor);
      setCurrency(fetchCurrency.cs_value);
      setgstfee(fetchGstFee.cs_value);
      setgstinclded(fetchGstIncluded.cs_value);
      setprocessingfeein(fetchProcessingFeeIn.cs_value);
      setprocessinginclded(fetchProcessingIncluded.cs_value);
      setprocessingfeeornot(fetchProcessingFeeOrNot.cs_value);
      setgstpercentage(fetchGstAmount.cs_value);
      setAddedPaymentMode(fetchAddedPaymentMode.cs_value);
      setmultiperuser(multiperuser.cs_value);
      setWorkshopType(fetchWorkshopType);
      setaddedpaymentmode(fetchaddedpaymentmode.cs_value);

      console.log("fetchaddedpaymentmode.cs_value", fetchaddedpaymentmode.cs_value);

      if (fetchaddedpaymentmode.cs_value != "Both") {
        setPaymentMode(fetchaddedpaymentmode.cs_value);
      }


    } catch (error) {
      setLoading(false);
    }
  };

  const paymentTypeOptions = paymentType.map(type => ({
    value: type.paymenttype_id,
    label: type.paymenttype_name
  }));

  const handleCategoryClick = (category) => {
    toast.info(`Navigating to ${category}`);
    // Navigate or perform actions based on category
    // Example: navigate(`/category/${category}`);
  };

  const handleSubmit = async (formData, form) => {
    console.log('Form Values:', formData);
    // toast.success('Form submitted successfully!');

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

      const token = getToken();  // Assuming you have a functio


      // Append other form fields to FormData
      for (const key in values) {
        data.append(key, values[key]);
      }

      // data.append('photo', selectedImage);
      // data.append('resume', selectedcv);
      // Append 'cs_isconfirm' flag to FormData
      data.append('cs_isconfirm', 0); // Set flag to 0
      // data.append('userid', userId); // Set flag to 0
      console.log("workshopCategory1", selectedWorkshops);

      data.append('cs_workshop_category', workshopCategory1);
      data.append('facultyDetails', JSON.stringify(facultyDetails));
      console.log("workshopCategory1", selectedWorkshops);
      Object.values(selectedWorkshops).forEach(workshop => {
        const formattedWorkshopType = `cs_${workshop.workshopType.toLowerCase().replace(/\s+/g, '')}`;  // Remove spaces
        data.append(formattedWorkshopType, workshop.addon_workshop_id);
      });
      data.append('accompany_person_data', JSON.stringify(addonFormData));


      const response = await axios.post(`${BackendAPI}/directuser/addUser`, data);






      if (response.data.success) {
        console.log('User created successfully:', response.data.data);

        const { userid } = response.data.data;

        console.log('User ID:', userid);

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
          userId: userid, // Assuming the user ID is returned from the registration response
          amount: totalPaidAmount, // Replace with actual amount
          currency: currency || 'INR', // Replace with actual currency
          paymenttype_id: paymentDetails.paymenttype_id || 6, // From form
          conference_fees: paymentDetails.conference_fees, // From form
          productinfo: 'Payment Details', // Required by PayU
          firstname: values.cs_first_name + ' ' + values.cs_last_name, // Required by PayU
          email: values.cs_email, // Required by PayU
          phone: values.cs_phone, // Required by PayU
          cheque_no: paymentDetails.cheque_no, // From form
          payment_date: paymentDetails.payment_date, // From form
          bank: paymentDetails.bank, // From form
          branch: paymentDetails.branch,// From form
          processing_fee: paymentDetails.processing_fee,
          payment_mode: paymentMode,
          ticket: values.cs_ticket,
          category: values.cs_reg_category,
        };


        // Store payment details in cs_reg_temppayment
        const storePaymentResponse = await axios.post(`${BackendAPI}/directuser/storePayment`, paymentData);

        // Extract the temppaymentId from the response
        //Console.log("paymentDetails.payment_mode", paymentDetails.payment_mode);


        if (paymentMode === 'online' || paymentMode === 'Online') {
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
          const paymentResponse = await axios.post(`${BackendAPI}/directuser/processPayment`, { paymentData: fullPaymentData });

          //Console.log('Payment response:', paymentResponse.data);

          // Handle the response, e.g., redirect to PayU URL if successful
          if (paymentResponse.data.success) {
            // Navigate to the PaymentPage component using 'useNavigate'
            const paymentUrl = paymentResponse.data.paymentUrl;
            const payUData = paymentResponse.data.payUData;
            const paymentGateway = paymentResponse.data.paymentGateway;

            console.log("payUData", payUData);


            navigate(`${process.env.PUBLIC_URL}/conirmdirectformpayment`, { state: { payUData, paymentUrl, paymentGateway } }); // Use navigate instead of history.push
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
            setShowNextStep(false);
            setShowUserform(false);
            setSelectedCounts([]);
            setAddonFormData({});
            setAddonCounts({});
            setPaymentMode();
            navigate(`${process.env.PUBLIC_URL}/userregister`);
            form.reset();
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

  const fetchFields = async () => {
    try {
      const token = getToken();
      const response = await axios.get(`${BackendAPI}/directuser/getConfirmField`, {

      });
      const fieldsData = response.data.Fields;
      const requiredfield = fieldsData.map(field => field.cs_is_required);
      const fieldLabels = fieldsData.map(field => field.cs_field_label);
      const fieldType = fieldsData.map(field => field.field_type_name);
      const fieldId = fieldsData.map(field => field.cs_field_id);
      const fieldName = fieldsData.map(field => field.cs_field_name);
      const customfield = fieldsData.map(field => field.cs_iscustom);
      const staticname = fieldsData.map(field => field.cs_folder_name);


      setFieldLabels(fieldLabels);
      setFieldType(fieldType);
      setFieldName(fieldName);
      setCustomfield(customfield);
      setRequiredField(requiredfield); // Set requiredfield state
      setFieldId(fieldId);
      setStaticName(staticname);



      console.log("Data:", fieldsData);
      //Console.log("Custom:", customfield);



      // setData(fieldsData);

      setSettingData(response.data.settingData);
      setLoading(false);



      // //Console.log('Id:', fieldName);
    } catch (error) {
      //Console.error('Error fetching Fields:', error);
      setLoading(false);
    }
  };

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

  const fetchUserTicketcounts = async () => {
    try {
      const response = await axios.get(`${BackendAPI}/directuser/getconfirmusers`, {

      });
      setregistereduser(response.data);  // Assuming response.data contains the user's ticket data
      console.log("registereduserdata", response.data)
    } catch (error) {
      console.error('Error fetching user tickets:', error);
    }
  };



  // Function to handle count selection
  const handleCountChange = (ticketId, count) => {

    console.log("ticket data", ticketId, count);

    setSelectedCounts((prev) => {
      const updatedCounts = { ...prev, [ticketId]: count };
      // Check if any count is selected (greater than 0)
      const anyCountSelected = Object.values(updatedCounts).some((val) => val > 0);
      setIsButtonEnabled(anyCountSelected);
      return updatedCounts;
    });
  };

  // Continue button click handler
  const handleContinue = () => {
    console.log("selectedCounts", selectedCounts);
    setShowNextStep(false);
    setShowUserform(true);
  };

  const sum = Object.values(selectedCounts).reduce((acc, value) => acc + value, 0);


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


  const AddonAmountMap = Object.fromEntries(
    addonAmount.map(item => [item.addon_id, item.addon_amount])
  );

  const handlePaymentModeChange = (event) => {
    setPaymentMode(event.target.value);
  };




  return (
    <Fragment>
      <ToastContainer />
      <Container fluid={true}>
        <Row className='justify-content-center'>
          <Col sm="7">
            <Card>
              {/* <CardHeader className="d-flex justify-content-between align-items-center flex-column flex-md-row"> */}
              {/* <div className="mb-2 mb-md-0">
                  <h5 className="mb-2 text-start">{settingdata.event_name}</h5>
                  {settingdata.event_start_date && (
                    <small className="mb-2 text-start">
                      Conference Date: {moment(settingdata.event_start_date).format('MMM DD, YYYY')}
                    </small>
                  )}
                </div> */}



              {/* </CardHeader> */}



              <CardHeader>
                <div className="d-flex justify-content-center align-items-center">
                  <div>
                    <img
                      src={logo}
                      alt="Logo"
                      style={{ maxWidth: '75%', height: 'auto' }}
                    />
                  </div>
                  <h3 className="mb-0">Registration Form</h3>
                </div>
              </CardHeader>


              <CardBody>
                {/* <CardTitle tag="h3" className="text-center" style={{ color: 'black', marginBottom: '20px' }}>
                  Registration Form
                </CardTitle> */}
                <FinalForm onSubmit={handleSubmit}>
                  {({ handleSubmit }) => (
                    <form className="needs-validation" noValidate="" onSubmit={(formData, form) => handleSubmit(formData, form)}
                    >
                      {(!showNextStep && !showUserform) && (
                        // <Row>
                        //   <Col sm="12" className="mb-3">
                        //     <h5>Select Category</h5>
                        //     {regCat.length === 0 ? (
                        //       <p>No categories available</p>
                        //     ) : (

                        //       <Field name="cs_reg_category">
                        //         {({ input, meta }) => (
                        //           <div>
                        //             <ul style={{ listStyleType: 'none', padding: 0 }}>
                        //               {regCat.map((category, index) => (
                        //                 <li
                        //                   key={index}
                        //                   className="d-flex justify-content-between align-items-center my-2 p-2 border rounded"
                        //                   style={{ cursor: 'pointer', backgroundColor: '#f8f9fa' }}
                        //                   onClick={() => {
                        //                     input.onChange(category.cs_reg_cat_id);
                        //                     setSelectedCategory(category.cs_reg_cat_id);
                        //                     setCategory(category.cs_reg_cat_id);
                        //                     setShowNextStep(true);
                        //                   }}
                        //                 >
                        //                   <span>{category.cs_reg_category}</span>
                        //                   <span style={{ fontWeight: 'bold' }}>{'>>'}</span>
                        //                 </li>
                        //               ))}
                        //             </ul>
                        //             {meta.error && meta.touched && (
                        //               <p className="d-block text-danger">{meta.error}</p>
                        //             )}
                        //           </div>
                        //         )}
                        //       </Field>

                        //     )}
                        //   </Col>
                        // </Row>

                        <Row>
                          <Col sm="12" className="mb-5">
                            <h5>Select Category</h5>
                            {regCat.length === 0 ? (
                              <p>No categories available</p>
                            ) : (
                              <Field name="cs_reg_category">
                                {({ input, meta }) => (
                                  <div>
                                    <ul style={{ listStyleType: 'none', padding: 0 }}>
                                      {regCat.map((category, index) => (
                                        <li
                                          key={index}
                                          className="d-flex justify-content-between align-items-center my-3 p-3 border rounded"
                                          style={{
                                            cursor: 'pointer',
                                            backgroundColor: '#f8f9fa',
                                            fontSize: '1.2rem', // Increase font size
                                            height: '45px', // Increase height of each li item
                                          }}
                                          onClick={() => {
                                            input.onChange(category.cs_reg_cat_id);
                                            setSelectedCategory(category.cs_reg_cat_id);
                                            setCategory(category.cs_reg_cat_id);
                                            setShowNextStep(true);
                                          }}
                                        >
                                          <span>{category.cs_reg_category}</span>
                                          <span style={{ fontWeight: 'bold' }}>{'>>'}</span>
                                        </li>
                                      ))}
                                    </ul>
                                    {meta.error && meta.touched && (
                                      <p className="d-block text-danger">{meta.error}</p>
                                    )}
                                  </div>
                                )}
                              </Field>
                            )}
                          </Col>
                        </Row>

                      )}
                      {showNextStep && (
                        <Row>
                          <Col sm="12" className="mb-3">
                            {/* Back button to hide the step */}


                            {/* The Field component */}
                            <Field name="cs_ticket" >
                              {({ input, meta }) => {
                                // Map options from filteredTickets
                                let options = filteredTickets.map(pref => ({
                                  value: pref.ticket_id,
                                  label: pref.ticket_title,
                                  maxLimit: pref.ticket_max_limit, // Include max limit
                                }));

                                options = [
                                  { value: '', label: 'Select' },
                                  ...options
                                ];

                                // Map ticket amounts
                                const ticketAmountMap = Object.fromEntries(
                                  ticketAmount.map(item => [item.ticket_id, item.tick_amount])
                                );

                                return (
                                  <div>
                                    <Label className="form-label">
                                      <h5>Ticket<span className="text-danger"> *</span></h5>
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
                                            const userTicketCount = registereduser.filter(user => parseInt(user.cs_ticket, 10) === ticket.ticket_id).length;
                                            console.log("userTicketCount for", ticket.ticket_id, userTicketCount);
                                            const isLimitedAndFull = ticket.ticket_type === "Limited" && userTicketCount >= parseInt(ticket.ticket_count);

                                            const ticketCount = parseInt(ticket.ticket_count, 10) || 0; // Fallback to 0 if invalid
                                            console.log("Parsed ticketCount for", ticket.ticket_id, ticketCount);

                                            const availableSeats = Math.max(0, ticketCount - userTicketCount); // Calculate available seats
                                            console.log("Available seats for", ticket.ticket_id, availableSeats);
                                            const maxSelectableTickets =
                                              ticket.ticket_type === "Limited"
                                                ? Math.min(availableSeats, parseInt(ticket.ticket_max_limit, 10) || 0)
                                                : parseInt(ticket.ticket_max_limit, 10) || 0;
                                            console.log("maxSelectableTickets for", ticket.ticket_id, maxSelectableTickets);

                                            return (
                                              <tr
                                                key={ticket.ticket_id}
                                              >
                                                <td className="text-start">
                                                  <div className="mb-2 d-flex align-items-center">
                                                    {/* Ticket Title */}
                                                    <strong
                                                      id={`Popover-${ticket.ticket_id}`} // Unique ID for Popover target
                                                      style={{ cursor: 'pointer' }}
                                                    >
                                                      {ticket.ticket_title}
                                                    </strong>

                                                    {/* Info Icon */}
                                                    <MdInfoOutline
                                                      id={`Popover-${ticket.ticket_id}`} // Unique ID for Popover target
                                                      style={{
                                                        cursor: 'pointer',
                                                        marginLeft: '8px', // Adjust spacing between title and icon
                                                      }}
                                                    />

                                                    {/* Badge for Selected Ticket */}
                                                    {parseInt(input.value) === ticket.ticket_id && (
                                                      <Badge color="success" className="ms-2">Selected</Badge>
                                                    )}
                                                  </div>


                                                  <div className="mb-2">
                                                    {/* {ticket.ticket_ispaid === "0"
                                                      ? 'Free'
                                                      : ticketAmountMap[ticket.ticket_id]
                                                        ? `$${ticketAmountMap[ticket.ticket_id]}`
                                                        : <div className="text-danger">Ticket date is expired.</div>
                                                    } */}

                                                    {ticket.ticket_ispaid === "0"
                                                      ? 'Free'
                                                      : ticketAmountMap[ticket.ticket_id]
                                                        ? `${currency} ${ticketAmountMap[ticket.ticket_id]}`
                                                        : <div className="text-danger">Ticket date is expired.</div>
                                                    }
                                                  </div>
                                                  {isLimitedAndFull && (
                                                    <div className="text-danger mb-2">There are no more tickets available.</div>
                                                  )}
                                                  {/* Uncontrolled Popover */}
                                                  {ticket.ticket_description && (
                                                    <UncontrolledPopover
                                                      trigger="focus" // Show on hover
                                                      placement="bottom" // Position the popover
                                                      target={`Popover-${ticket.ticket_id}`} // Target the ticket title
                                                    >
                                                      <PopoverBody>
                                                        <h6 className="mb-0">Packages Included:</h6>
                                                        <small className="text-muted">{ticket.ticket_description}</small>
                                                      </PopoverBody>
                                                    </UncontrolledPopover>
                                                  )}
                                                </td>



                                                <td className="text-end">
                                                  {multiperuser === "Yes" ? (
                                                    // Dropdown for selecting ticket count
                                                    <select
                                                      value={selectedCounts[ticket.ticket_id] || 0} // Get value for this ticket or default to 0
                                                      onChange={(e) => {
                                                        const inputValue = parseInt(e.target.value, 10);

                                                        // Update the ticket count


                                                        handleCountChange(ticket.ticket_id, inputValue);

                                                        // Toggle the ticket ID
                                                        const newTicketId = input.value === ticket.ticket_id ? '' : ticket.ticket_id;
                                                        input.onChange(newTicketId);
                                                      }}
                                                      disabled={
                                                        isLimitedAndFull ||
                                                        (ticket.ticket_ispaid === "1" && !ticketAmountMap[ticket.ticket_id])
                                                      }
                                                      style={{
                                                        borderRadius: '25px',  // Rounded corners
                                                        padding: '10px 15px',  // Proper padding
                                                        fontSize: '14px',      // Adjust font size
                                                      }}
                                                    >
                                                      <option value={0}>0</option>
                                                      {[...Array(maxSelectableTickets).keys()].map(i => (
                                                        <option key={i} value={i + 1}>{i + 1}</option>
                                                      ))}
                                                    </select>
                                                  ) : (
                                                    // Button for single selection
                                                    <Button
                                                      color={parseInt(input.value) === ticket.ticket_id ? 'warning' : 'primary'}
                                                      onClick={(e) => {
                                                        const newTicketId = parseInt(input.value) === ticket.ticket_id ? '' : ticket.ticket_id;
                                                        input.onChange(newTicketId);
                                                        setAddonTicket(newTicketId);
                                                        //  const inputValue = parseInt(e.target.value, 10);

                                                        // Update the ticket count
                                                        setSelectedCounts({});
                                                        setIsButtonEnabled(0);
                                                        handleCountChange(ticket.ticket_id, 1);

                                                      }}
                                                      disabled={
                                                        isLimitedAndFull ||
                                                        (ticket.ticket_ispaid === "1" && !ticketAmountMap[ticket.ticket_id])
                                                      }
                                                    >
                                                      {parseInt(input.value) === ticket.ticket_id ? 'Cancel' : 'Select'}
                                                    </Button>
                                                  )}
                                                </td>

                                              </tr>
                                            );
                                          })
                                        )}
                                      </tbody>
                                    </Table>
                                    <br />
                                    <br />

                                    <div className="d-flex justify-content-between align-items-center mt-3">
                                      {/* Back Button */}
                                      <Button
                                        color="secondary"
                                        onClick={() => {
                                          setShowNextStep(false);
                                          setSelectedCounts([]);
                                        }
                                        }
                                        style={{
                                          padding: "10px 20px",
                                          borderRadius: "25px",
                                        }}
                                      >
                                        Back
                                      </Button>

                                      {/* Continue Button */}
                                      <Button
                                        color="Primary"
                                        onClick={handleContinue}
                                        disabled={!isButtonEnabled}
                                        style={{
                                          backgroundColor: isButtonEnabled ? "#007bff" : "#ccc",
                                          color: "white",
                                          padding: "10px 20px",
                                          borderRadius: "25px",
                                          border: "none",
                                          cursor: isButtonEnabled ? "pointer" : "not-allowed",
                                        }}
                                      >
                                        Continue
                                      </Button>
                                    </div>

                                    {meta.error && meta.touched && <p className="text-danger">{meta.error}</p>}
                                  </div>
                                );
                              }}
                            </Field>
                          </Col>
                        </Row>
                      )}
                      {showUserform && (
                        <Row className="d-flex flex-wrap">

                          {Array.from({ length: sum }, (_, cardIndex) => ( // `cardIndex` is defined here
                            <Card key={cardIndex}>
                              <CardBody>
                                <div className="ticket-info">
                                  {(() => {
                                    let ticketCounter = 1; // Initialize ticket counter globally
                                    return Object.entries(selectedCounts).flatMap(([ticketId, count]) => {
                                      const ticketdata = ticket.find(t => t.ticket_id === Number(ticketId)); // Find the ticket

                                      if (ticketdata) {

                                        setAddonTicket(ticketId);

                                        return Array.from({ length: count }, () => {
                                          const currentTicket = (
                                            <div key={`${ticketId}-${ticketCounter}`} className="ticket-details">
                                              <p className='mb-3'>
                                                <h6>{ticketdata.ticket_title}</h6>
                                                {multiperuser === "Yes" && (
                                                  <span> - Ticket #{ticketCounter}</span>
                                                )}

                                              </p>
                                            </div>
                                          );


                                          ticketCounter++; // Increment the global counter
                                          return currentTicket;
                                        });
                                      }
                                      return [];
                                    })[cardIndex]; // Use the card index to pick the specific ticket for this card
                                  })()}
                                </div>

                                {multiperuser === "Yes" && (
                                  <div className="mb-3">
                                    <label>
                                      <input
                                        type="checkbox"
                                        checked={primaryUserIndex === cardIndex}
                                        onChange={() =>
                                          setPrimaryUserIndex(primaryUserIndex === cardIndex ? null : cardIndex)
                                        }
                                        disabled={primaryUserIndex !== null && primaryUserIndex !== cardIndex}
                                      />
                                      <strong className="ms-1">Primary User</strong>
                                    </label>
                                  </div>
                                )}





                                <Row key={cardIndex}>






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

                                            validate={isFieldRequired ? composeValidators(option) : (value) => composeValidators()(value)}
                                          >
                                            {({ input, meta }) => {

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
                                          fieldType[index] === 'Text' && (
                                            <Field
                                              name={`${fieldName[index]}`}

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
                                                    onChange={(e) => {
                                                      input.onChange(e.target.value.trimStart()); // Allow trimming of leading spaces while typing
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
                                                    onChange={(e) => {
                                                      input.onChange(e.target.value.trimStart()); // Allow trimming of leading spaces while typing
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

                                        {/* {
                                          fieldType[index] === 'Text' && (
                                            <Field
                                              name={`${fieldName[index]}`}

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

                                                  />
                                                  {meta.error && meta.touched && <p className='d-block text-danger'>{meta.error}</p>}
                                                </div>
                                              )}
                                            </Field>

                                          )
                                        } */}


                                        {
                                          fieldType[index] === 'Email' && (
                                            <Field
                                              name={`${fieldName[index]}`} // Use dynamic field name

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
                                                    onChange={(e) => {
                                                      input.onChange(e.target.value.trimStart()); // Allow trimming of leading spaces while typing
                                                      setEmail(e.target.value);
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


                                      </Col>

                                    );
                                  })}
                                  {/* <hr /> */}
                                </Row>
                                {/* <Col>{filteredAddon}</Col> */}
                                {filteredAddon.length > 0 && (
                                  <Row>
                                    <Col md="12">
                                      <Field
                                        name="cs_addons"
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
                                            console.log("validatedCount", validatedCount);
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
                                                console.log("countDifference ", i, countDifference);
                                                console.log("isAdding", isAdding);
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
                                                                  //   type="button"
                                                                  //   className={`btn ${selectedOptions.includes(addon.addon_id) || (selectedWorkshops[addon.addon_workshoprtype_id]?.selected_addon_id === addon.addon_id) ? 'btn-danger' : 'btn-primary'}`}
                                                                  //   onClick={() => {
                                                                  //     const isAdding = !selectedOptions.includes(addon.addon_id);
                                                                  //     toggleAddon(addon.addon_id, addon.addon_title, addon.addon_cat_type, addon.addon_workshop_id);
                                                                  //     const matchedAddon = addonAmount.find(item => item.addon_id === addon.addon_id);
                                                                  //     if (matchedAddon) {
                                                                  //       calculateAndSetAmounts(matchedAddon, isAdding);
                                                                  //     }

                                                                  //     // Update the selected workshops state

                                                                  //     setSelectedWorkshops(prev => {
                                                                  //       // Retrieve the current state for the given workshop type ID
                                                                  //       const currentWorkshop = prev[addon.addon_workshoprtype_id] || {};

                                                                  //       // Determine whether to remove or add the addon
                                                                  //       const updatedAddonId = currentWorkshop.selected_addon_id === addon.addon_id ? null : addon.addon_id;

                                                                  //       // If we are removing the addon (set to null), we will remove the entire workshop entry
                                                                  //       const updatedState = {
                                                                  //         ...prev,
                                                                  //         // If selected_addon_id is null, we remove the entry for this addon_workshoprtype_id
                                                                  //         ...(updatedAddonId === null
                                                                  //           ? { [addon.addon_workshoprtype_id]: undefined } // Remove the entire workshop entry
                                                                  //           : {
                                                                  //             [addon.addon_workshoprtype_id]: {
                                                                  //               workshopType: workshoptypedata.find(
                                                                  //                 (type) => type.id === parseInt(addon.addon_workshoprtype_id, 10)
                                                                  //               )?.workshoptype_name || "Unknown",
                                                                  //               addon_workshop_id: addon.addon_workshop_id,
                                                                  //               selected_addon_id: updatedAddonId
                                                                  //             }
                                                                  //           })
                                                                  //       };

                                                                  //       console.log("updated selectedWorkshops", updatedState);  // Log the updated state

                                                                  //       // Return the updated state to React's state setter
                                                                  //       return updatedState;
                                                                  //     });




                                                                  //   }}
                                                                  //   disabled={
                                                                  //     isLimitedAndFull ||
                                                                  //     (addon.addon_ispaid === 1 && !AddonAmountMap[addon.addon_id]) ||
                                                                  //     (selectedWorkshops[addon.addon_workshoprtype_id]?.selected_addon_id && selectedWorkshops[addon.addon_workshoprtype_id]?.selected_addon_id !== addon.addon_id)
                                                                  //   }
                                                                  // >
                                                                  //   {selectedOptions.includes(addon.addon_id) || (selectedWorkshops[addon.addon_workshoprtype_id]?.selected_addon_id === addon.addon_id) ? '- Remove' : '+ Add'}
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

                                      <Field name="cs_workshop_category">
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


                                {(showUserform && addedpaymentmode === 'Both' && totalPaidAmount > 0) && (
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


                                {paymentMode === 'offline' || paymentMode === 'Offline' && (showUserform) && (
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



                              </CardBody>
                            </Card>







                          ))}
                          <div className="d-flex justify-content-between align-items-center mt-3">


                          </div>





                          <Row className="d-flex justify-content-between align-items-center">
                            <Col xs="auto" className="text-end">

                              <Button
                                color="secondary"
                                onClick={() => {
                                  setShowNextStep(true);
                                  setShowUserform(false);
                                }}

                                style={{
                                  padding: "10px 20px",
                                  borderRadius: "25px",
                                }}
                              >
                                Back
                              </Button>
                            </Col>

                            <Col xs="auto" className="text-end">
                              {/* <Button color="warning" className="me-2 mt-3" onClick={handleCancel}>Cancel</Button> */}
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




                        </Row>



                      )}


                      {/* <Button type="submit" color="primary" className="w-100 mt-4">
                      Submit
                    </Button> */}
                    </form>
                  )}
                </FinalForm>
              </CardBody>
            </Card>
          </Col>
          {/* {(showUserform) && (
                        <Col
                            xs={12} // Full width for small devices
                            sm={4}  // Half width for medium devices
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

                    )} */}

        </Row>
      </Container>
    </Fragment>

  );
};

export default AddUserDirectly;
