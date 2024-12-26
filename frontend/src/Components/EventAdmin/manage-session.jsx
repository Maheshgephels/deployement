import React, { useState, useEffect, useRef, Fragment, useContext } from 'react';
import {
  Container, Button, Navbar, NavbarBrand, NavbarToggler, Collapse, Nav, NavItem, NavLink, Modal, ModalHeader, ModalFooter, ModalBody, FormGroup, Label, Input, TabContent, TabPane,
  CardHeader, CardBody, Card, FormFeedback, PopoverBody, UncontrolledPopover
} from 'reactstrap';
import { Breadcrumbs } from '../../AbstractElements';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { FaCalendarAlt, FaPlus, FaTrash, FaClock, FaChevronRight, FaChevronLeft, FaCog, FaEdit } from 'react-icons/fa';
import { format } from 'date-fns';
import { MdDelete, MdInfoOutline } from "react-icons/md";
import axios from 'axios';
import { BackendAPI } from '../../api';
import { getToken } from '../../Auth/Auth';
import { toast } from 'react-toastify';
import '../../assets/scss/programandsession/ManageSession.css';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import 'react-big-calendar/lib/css/react-big-calendar.css'; // Add the CSS file
import { format as formatDateFns } from 'date-fns'; // Use date-fns for formatting dates
import classnames from 'classnames';
import Select from 'react-select';
import SweetAlert from 'sweetalert2';
import CustomEvent from './CustomEvent';
import { useLocation } from 'react-router-dom';
import useAuth from '../../Auth/protectedAuth';
import ReactTooltip from 'react-tooltip';
import { Skeleton } from 'antd';
import { PermissionsContext } from '../../contexts/PermissionsContext';
import moment from 'moment';
// Initialize localizer
const localizer = momentLocalizer(moment);

const CustomToolbar = () => (
  <div className="custom-toolbar">
    {/* Add your custom buttons or leave it empty to hide all controls */}
  </div>
);

const formatTime = (date) => {
  if (!date) return '';
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  return `${hours}:${minutes}`;
};

const ManageSession = () => {
  useAuth();
  // const [startDate, setStartDate] = useState(new Date());
  const location = useLocation();
  const ProgramdayId = location.state ? location.state.ProgramdayId : null;
  const [startDate, setStartDate] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [sessionLength, setSessionLength] = useState(60); // Default session length in minutes
  const [isOpen, setIsOpen] = useState(false);
  const [isDateModalOpen, setIsDateModalOpen] = useState(false);
  const [isSessionModalOpen, setIsSessionModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [newSessionLength, setNewSessionLength] = useState(sessionLength);
  const [tabs, setTabs] = useState([]);
  const [activeTab, setActiveTab] = useState(0);
  const [scrollPosition, setScrollPosition] = useState(0);
  const [toDateArray, setToDateArray] = useState([]);
  const tabContainerRef = useRef(null);
  const [savedDateId, setSavedDateId] = useState(null);
  const [events, setEvents] = useState([]);
  const [tabEvents, setTabEvents] = useState({});
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [startTime, setStartTime] = useState(formatTime(selectedSlot?.start));
  const [endTime, setEndTime] = useState(formatTime(selectedSlot?.end));
  const [endTimesOptions, setEndTimesOptions] = useState([]);
  const [halltype, sethalltype] = useState([]);
  const [data, setData] = useState([]);
  const [activeTabContent, setActiveTabContent] = useState(1);
  const [Faculties, setFaculties] = useState([]);
  const [Role, setRole] = useState([]);
  const [selectedFaculty, setSelectedFaculty] = useState(null);
  const [selectedRole, setSelectedRole] = useState([]);
  const [facultyRolePairs, setFacultyRolePairs] = useState([]);
  const [editIndex, setEditIndex] = useState(null);
  const [selectedSession, setSelectedSession] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [filteredSessions, setFilteredSessions] = useState([]);
  const [shouldFetch, setShouldFetch] = useState(true);
  const [starttimeforliting, setstarttimeforliting] = useState('08:00');
  const [endtimeforliting, setendtimeforliting] = useState('17:00');
  const [progname, setprogname] = useState('');
  const [error, setError] = useState('');
  const [description, setDescription] = useState('');
  const [error1, setError1] = useState('');
  const { permissions } = useContext(PermissionsContext);
  const [isSubmitting, setIsSubmitting] = useState(false);

  console.log("Date", startDate);



  const toggle = () => setIsOpen(!isOpen);
  const toggleDateModal = () => setIsDateModalOpen(!isDateModalOpen);
  const toggleSessionModal = () => setIsSessionModalOpen(!isSessionModalOpen);

  const [thumbnail, setThumbnail] = useState(null);

  // Handle file change
  const handleFileChange = (e) => {
    setThumbnail(e.target.files[0]);
  };


  // const toggleTab = (tabId) => setActiveTab(tabId);



  const navigate = useNavigate();

  // Function to handle slot selection
  const handleSelectSlot = (slotInfo) => {
    setSelectedSlot(slotInfo);
    const startFormatted = formatTime(slotInfo.start);
    setStartTime(startFormatted);
    generateEndTimesOptions(startFormatted, endtimeforliting);
    setIsModalOpen(true);
    setDescription(' ');
  };

  const handleEditClick = (index) => {
    const { faculty, role } = facultyRolePairs[index];
    setSelectedFaculty(faculty);
    setSelectedRole(role);
    setEditIndex(index);
    // const updatedPairs = facultyRolePairs.filter((_, i) => i !== index);
    // setFacultyRolePairs(updatedPairs);
  };

  const handleDeleteClick = (index) => {
    const updatedPairs = facultyRolePairs.filter((_, i) => i !== index);
    setFacultyRolePairs(updatedPairs);
  };
  // Function to handle modal close
  // const handleModalClose = () => {
  //   setIsModalOpen(false);
  //   setFacultyRolePairs([]);
  // };
  const handleModalClose = () => {
    SweetAlert.fire({
      title: 'Are you sure?',
      text: "Your changes will be discarded. Are you sure you want to cancel?",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Yes',
      cancelButtonText: 'No'
    }).then((result) => {
      if (result.isConfirmed) {
        setIsModalOpen(false);
        setFacultyRolePairs([]);
        setSelectedFaculty(null);
        setSelectedRole(null);
            }
    });
  };

  const validateDescription = (value) => {
    const maxWords = 250;
    if (!value) return;

    const wordCount = value.trim().split(/\s+/).length;
    return wordCount > maxWords ? `Description must be ${maxWords} words or fewer` : '';
  };




  // fetch session data 
  useEffect(() => {
    const fetchSessions = async () => {
      try {
        const token = getToken();
        const response = await axios.get(`${BackendAPI}/session/get-session`, {
          headers: {
            Authorization: `Bearer ${token}` // Include the token in the Authorization header
          }
        });
        if (response.data && response.data.session) {
          setSessions(response.data.session);
          setShouldFetch(false); // Reset the trigger after fetching
        } else {
          console.error('Unexpected data format:', response.data);
        }
      } catch (error) {
        console.error('Error fetching sessions:', error);
      }
    };

    if (shouldFetch) {
      fetchSessions();
    }
  }, [shouldFetch, permissions]);

  // Extract Component Permission
  const ManageSessionPermissions = permissions['ManageSession'];

  useEffect(() => {
    const filtered = sessions.filter(
      session => session.locat_id === activeTab && session.prog_id === savedDateId
    );
    setFilteredSessions(filtered);
  }, [sessions, activeTab, savedDateId]);


  // Convert filtered sessions to events for the calendar
  const eventlist = filteredSessions.map(session => {
    if (!session.session_title) {
      console.warn('Missing title for session:', session);
    }

    const startDateTime = new Date(`${session.session_date}T${session.start_time}`);
    const endDateTime = session.end_time === 'Onwards'
      ? new Date(startDateTime.getTime() + 60 * 60 * 1000) // Handle "Onwards" by adding 1 hour
      : new Date(`${session.session_date}T${session.end_time}`);



    return {
      id: session.session_id,
      title: session.session_title || 'Untitled Event',
      description: session.session_description,
      start: startDateTime,
      end: endDateTime,
      ...session,
    };
  });


  // Function to handle form submission
  // const handleFormSubmit = async (event) => {
  //   event.preventDefault();

  //   // Convert startTime and endTime to Date objects
  //   const updatedStartTime = new Date(selectedSlot.start);
  //   updatedStartTime.setHours(parseInt(startTime.split(':')[0], 10));
  //   updatedStartTime.setMinutes(parseInt(startTime.split(':')[1], 10));

  //   const updatedEndTime = new Date(selectedSlot.end);
  //   updatedEndTime.setHours(parseInt(endTime.split(':')[0], 10));
  //   updatedEndTime.setMinutes(parseInt(endTime.split(':')[1], 10));

  //   // Prepare data for API call
  //   const formData = {
  //     title: event.target.title.value,
  //     description: event.target.description.value,
  //     hallLocation: event.target.selectmethod.value ? event.target.selectmethod.value : 0,
  //     startTime: formatTime(updatedStartTime), // Format time only
  //     endTime: formatTime(updatedEndTime),
  //     facultyRolePairs, // This should be an array of objects
  //     activeTabContent, // Add the selected tab ID
  //     savedDateId, // Include the saved date ID
  //     startDate: formatDate(startDate)
  //   };

  //   try {
  //     // Replace with your actual API endpoint
  //     const token = getToken();
  //     const response = await axios.post(`${BackendAPI}/session/add-session`, formData, {
  //       headers: {
  //         Authorization: `Bearer ${token}`,
  //       },
  //     });

  //     // Handle success
  //     console.log('Form submitted successfully:', response.data);
  //     setFacultyRolePairs([]);
  //     setIsModalOpen(false);
  //     setShouldFetch(true);

  //     SweetAlert.fire({
  //       title: 'Success!',
  //       text: 'Changes Updated successfully !',
  //       icon: 'success',
  //       timer: 3000,
  //       showConfirmButton: false,
  //       allowOutsideClick: false,
  //       allowEscapeKey: false
  //     });
  //   } catch (error) {
  //     // Handle error
  //     console.error('Error submitting form:', error);
  //   }
  // };


  const handleFormSubmit = async (event) => {
    event.preventDefault();
    setIsSubmitting(true);
    // Create a new FormData object
    const errorMsg = validateDescription(description);
    if (errorMsg) {
      setError1(errorMsg);
      setIsSubmitting(false); // Re-enable button on validation error
      return;
    }
    setError1('');

    const formData = new FormData();

    const updatedStartTime = new Date(selectedSlot.start);
    updatedStartTime.setHours(parseInt(startTime.split(':')[0], 10));
    updatedStartTime.setMinutes(parseInt(startTime.split(':')[1], 10));

    const updatedEndTime = new Date(selectedSlot.end);
    updatedEndTime.setHours(parseInt(endTime.split(':')[0], 10));
    updatedEndTime.setMinutes(parseInt(endTime.split(':')[1], 10));

    // Append form fields
    formData.append('title', event.target.title.value);
    formData.append('description', event.target.description.value);
    formData.append('hallLocation', event.target.selectmethod.value ? event.target.selectmethod.value : 0);
    formData.append('startTime', formatTime(updatedStartTime)); // Format time only
    formData.append('endTime', formatTime(updatedEndTime));
    formData.append('facultyRolePairs', JSON.stringify(facultyRolePairs)); // Convert array to JSON string
    formData.append('activeTabContent', activeTabContent); // Add the selected tab ID
    formData.append('savedDateId', savedDateId); // Include the saved date ID
    formData.append('startDate', formatDate(startDate));

    // Append the thumbnail file
    if (thumbnail) {
      formData.append('thumbnail', thumbnail);
    }

    try {
      // Replace with your actual API endpoint
      const token = getToken();
      const response = await axios.post(`${BackendAPI}/session/add-session`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data', // Important for file uploads
        },
      });

      // Handle success
      console.log('Form submitted successfully:', response.data);
      setFacultyRolePairs([]);
      setIsModalOpen(false);
      setShouldFetch(true);
      setThumbnail(null);


      SweetAlert.fire({
        title: 'Success!',
        text: 'Session Created successfully!',
        icon: 'success',
        timer: 3000,
        showConfirmButton: false,
        allowOutsideClick: false,
        allowEscapeKey: false
      });
    } catch (error) {
      // Handle error
      console.error('Error submitting form:', error);
    }finally {
      setIsSubmitting(false); // Re-enable button after the process is complete
    }
    
  };


  // const filteredRoles = selectedFaculty ? Role.filter(r => r.faculty_id === selectedFaculty.value) : [];

  const handleAddFacultyRole = () => {
    if (selectedFaculty && selectedRole) {
      setFacultyRolePairs([...facultyRolePairs, { faculty: selectedFaculty, role: selectedRole }]);
      setSelectedFaculty(null);
      setSelectedRole(null);
    }
    if (editIndex != null) {
      const updatedPairs = facultyRolePairs.filter((_, i) => i !== editIndex);
      setFacultyRolePairs(updatedPairs);

      setEditIndex(null);
    }
  };

  // const handleAddOrUpdateFacultyRole = () => {
  //   if (selectedFaculty && selectedRole) {
  //     if (editIndex != null) {
  //       // Update the existing item
  //       const updatedPairs = facultyRolePairs.map((pair, i) =>
  //         i === editIndex ? { faculty: selectedFaculty, role: selectedRole } : pair
  //       );
  //       setFacultyRolePairs(updatedPairs);
  //       setEditIndex(null);
  //     } else {
  //       // Add a new item
  //       setFacultyRolePairs([...facultyRolePairs, { faculty: selectedFaculty, role: selectedRole }]);
  //     }
  //     setSelectedFaculty(null);
  //     setSelectedRole(null);
  //   }
  // };

  const handleAddOrUpdateFacultyRole = () => {
    if (selectedFaculty) {
      if (editIndex != null) {
        // Update the existing item
        const updatedPairs = facultyRolePairs.map((pair, i) =>
          i === editIndex ? { faculty: selectedFaculty, role: selectedRole } : pair
        );
        setFacultyRolePairs(updatedPairs);
        setEditIndex(null);
      } else {
        // Add a new item, but ensure role is handled even if it's null
        const newPair = {
          sroled_id: '',
          faculty: selectedFaculty,
          role: selectedRole || { label: ' ' }, // Default to unknown if null
        };
        setFacultyRolePairs([...facultyRolePairs, newPair]);
      }
      setSelectedFaculty(null);
      setSelectedRole(null);
    }
  };


  const handleManageProgram = () => {
    navigate(`${process.env.PUBLIC_URL}/event/manage-program/Consoft`);
  };

  const toggleTab = async (tabId) => {

    setActiveTab(tabId);
    // await fetchEvents(tabId);
  };

  const formatDate = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0'); // Months are zero-indexed
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };


  // const fetchEvents = async (tabId) => {
  //   try {
  //     const token = getToken();
  //     const response = await axios.get(`${BackendAPI}/session/get-events`, {
  //       headers: {
  //         Authorization: `Bearer ${token}`
  //       },
  //       params: {
  //         tabId
  //       }
  //     });

  //     if (response.data && Array.isArray(response.data.events)) {
  //       setTabEvents(prev => ({
  //         ...prev,
  //         [tabId]: response.data.events
  //       }));
  //     } else {
  //       console.error('Error: Invalid response format or missing events data');
  //     }
  //   } catch (error) {
  //     console.error('Error fetching events:', error);
  //   }
  // };

  // const generateEndTimesOptions = (start) => {
  //   let startDateTime = new Date();
  //   const [hours, minutes] = start.split(':').map(Number);
  //   startDateTime.setHours(hours);
  //   startDateTime.setMinutes(minutes);

  //   const options = [];
  //   let optionTime = new Date(startDateTime);

  //   while (options.length < 10) {
  //     optionTime.setMinutes(optionTime.getMinutes() + newSessionLength);
  //     options.push(formatTime(optionTime));
  //   }

  //   setEndTimesOptions(options);
  //   setEndTime(options[0]);
  // };

  const generateEndTimesOptions = (start, endtimeforliting) => {
    let startDateTime = new Date();
    const [hours, minutes] = start.split(':').map(Number);
    startDateTime.setHours(hours);
    startDateTime.setMinutes(minutes);

    const options = [];
    let optionTime = new Date(startDateTime);

    // Convert endTime1 to Date object
    const [endHours, endMinutes] = endtimeforliting.split(':').map(Number);
    const endDateTime = new Date();
    endDateTime.setHours(endHours);
    endDateTime.setMinutes(endMinutes);

    // Generate options until we reach or exceed endDateTime
    while (optionTime <= endDateTime) {
      optionTime.setMinutes(optionTime.getMinutes() + newSessionLength);
      options.push(formatTime(optionTime));

    }

    // Ensure at least one option is available
    if (options.length > 0) {
      setEndTimesOptions(options);
      setEndTime(options[0]);
    } else {
      console.warn('No end times available within the specified range.');
    }
  };

  //fetch dropdown value

  const fetchDropdown = async () => {
    try {
      const token = getToken();
      const response = await axios.get(`${BackendAPI}/session/getDropdownData`, {
        headers: {
          Authorization: `Bearer ${token}` // Include the token in the Authorization header
        }
      });
      setData(response.data);
      console.log(response.data);
      setLoading(false);

      const fetchprefixes = response.data.prefix;
      const fetchstate = response.data.states;
      const fetchcountry = response.data.country;
      const fetchregcat = response.data.regCategory;
      const fetchworkshop = response.data.workshop;
      const fetchdaytype = response.data.dayType;
      const fetchCutomData = response.data.custom;
      const fetchfacultytype = response.data.facultytype;
      const fetchhalltype = response.data.halltype;
      const role = response.data.role;

      sethalltype(fetchhalltype);
      setFaculties(fetchfacultytype);
      setRole(role);





      console.log("Check:", role);


    } catch (error) {
      console.error('Error fetching dropdown data:', error);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDropdown(); // Corrected function name
  }, []);





  useEffect(() => {

    const fetchSessionData = async () => {
      try {
        const token = getToken();
        const response = await axios.get(`${BackendAPI}/session/get-session-date`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });

        if (response.data && Array.isArray(response.data.settings)) {
          const settings = response.data.settings;
          // const eventStartDateSetting = settings.find(setting => setting.cs_parameter === 'Event Start Date');
          const sessionLengthSetting = settings.find(settings => settings.cs_parameter === 'session_length');
          // const eventStartDate = eventStartDateSetting ? eventStartDateSetting.cs_value : '';
          const sessionLengthValue = sessionLengthSetting ? sessionLengthSetting.cs_value : '';

          setNewSessionLength(Number(sessionLengthValue));
        } else {
          console.error('Error: Invalid response format or missing data');
        }
      } catch (error) {
        console.error('Error fetching session data:', error);
      } finally {
        setLoading(false);
      }
    };

    const fetchTabs = async () => {
      try {
        const token = getToken();
        const response = await axios.get(`${BackendAPI}/session/get-hall`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        console.log("response", response);
        const tabsData = response.data.setting || [];
        if (tabsData.length > 0) {
          setTabs(tabsData);
          setActiveTab(tabsData[0].locat_id); // Set the first tab as active by default
        } else {
          console.warn('No tabs data received');
        }
      } catch (error) {
        console.error('Error fetching tabs:', error);
      }
    };

    // const fetchToDateArray = async () => {
    //   try {
    //     const token = getToken();
    //     const response = await axios.get(`${BackendAPI}/session/get-session-date`, {
    //       headers: {
    //         Authorization: `Bearer ${token}`
    //       }
    //     });

    //     if (response.data && Array.isArray(response.data.to_dates)) {
    //       // Map response data to include both date and ID
    //       const toDates = response.data.to_dates.map(dateObj => ({
    //         date: new Date(dateObj.date),
    //         id: dateObj.id,
    //         starttime: dateObj.starttime,
    //         endtime: dateObj.endtime
    //       }));

    //       setToDateArray(toDates);
    //       console.log("toDates", toDates);

    //       // Set the first date as the initial startDate and its ID
    //       if (toDates.length > 0) {
    //         setStartDate(toDates[0].date);
    //         // setStartDate(new Date(toDates[0].date))
    //         setSavedDateId(toDates[0].id); // Use the ID of the first date
    //         setstarttimeforliting(toDates[0].starttime);
    //         setendtimeforliting(toDates[0].endtime);
    //       }
    //     } else {
    //       console.error('Error: Invalid response format or missing to_dates data');
    //     }
    //   } catch (error) {
    //     console.error('Error fetching to_date values:', error);
    //   }
    // };


    console.log("ProgramdayId", ProgramdayId);

    const fetchToDateArray = async () => {
      try {
        const token = getToken();
        const response = await axios.get(`${BackendAPI}/session/get-session-date`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });

        if (response.data && Array.isArray(response.data.to_dates)) {
          // Map response data to include both date and ID
          const toDates = response.data.to_dates.map(dateObj => ({
            date: new Date(dateObj.date),
            id: dateObj.id,
            starttime: dateObj.starttime,
            endtime: dateObj.endtime,
            progname: dateObj.prog_name
          }));

          setToDateArray(toDates);
          console.log("toDates", toDates);

          // Check if ProgramdayId is provided
          if (ProgramdayId) {
            // Find the date object that matches ProgramdayId
            const selectedDate = toDates.find(dateObj => dateObj.id === parseInt(ProgramdayId, 10));

            if (selectedDate) {
              setStartDate(selectedDate.date);
              setSavedDateId(selectedDate.id);
              setstarttimeforliting(selectedDate.starttime);
              setendtimeforliting(selectedDate.endtime);
              setprogname(selectedDate.progname);

            } else {
              console.warn('ProgramdayId not found in toDates');
              // Fallback to default behavior
              if (toDates.length > 0) {
                setStartDate(toDates[0].date);
                setSavedDateId(toDates[0].id);
                setstarttimeforliting(toDates[0].starttime);
                setendtimeforliting(toDates[0].endtime);
                setprogname(toDates[0].progname);
              }
            }
          } else {
            // No ProgramdayId provided, fallback to default behavior
            if (toDates.length > 0) {
              setStartDate(toDates[0].date);
              setSavedDateId(toDates[0].id);
              setstarttimeforliting(toDates[0].starttime);
              setendtimeforliting(toDates[0].endtime);
              setprogname(toDates[0].progname);
            }
          }
        } else {
          console.error('Error: Invalid response format or missing to_dates data');
        }
      } catch (error) {
        console.error('Error fetching to_date values:', error);
      }
    };



    fetchSessionData();
    fetchTabs();
    fetchToDateArray();
  }, []);


  const handleSaveSessionLength = async () => {
    try {
      const token = getToken();
      const response = await axios.post(`${BackendAPI}/session/set-session-length`, {
        length: newSessionLength
      }, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      setSessionLength(newSessionLength);
      toast.success('Session length changed successfully!');
      toggleSessionModal();
    } catch (error) {
      console.error('Error saving session length:', error);
      toast.error('Failed to change session length.');
    }
  };

  const handleScroll = (direction) => {
    if (tabContainerRef.current) {
      const container = tabContainerRef.current;
      const scrollAmount = direction === 'left' ? -100 : 100;
      container.scrollLeft += scrollAmount;
      setScrollPosition(container.scrollLeft);
    }
  };
  // const formatTime = (date) => {
  //   if (!date) return '';
  //   return new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  // };

  const generateTimeSlots = (startTime, endTime) => {
    const slots = [];
    let currentTime = new Date(startTime);
    while (currentTime <= endTime) {
      slots.push(currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
      currentTime.setMinutes(currentTime.getMinutes() + 30);
    }
    return slots;
  };

  const timeSlots = generateTimeSlots(new Date(2024, 0, 1, 8, 0), new Date(2024, 0, 1, 23, 0));

  // Filter function to disable dates not in toDateArray
  const filterDate = date => {
    return toDateArray.some(toDate => toDate.date.toDateString() === date.toDateString());
  };


  const handleNavigate = (newDate) => {
    console.log('Navigated to date:', newDate);
    // Optionally update the state if you want to handle external navigation
    setStartDate(newDate);
  };

  // Function to add class names to highlighted dates
  // const dayClassName = date => {
  //   return toDateArray.some(toDate => toDate.date.toDateString() === date.toDateString())
  //     ? 'react-datepicker__day--highlighted'
  //     : undefined;
  // };
  const handleDateSelect = async (date) => {
    setStartDate(date);
    try {
      const token = getToken();
      const response = await axios.post(`${BackendAPI}/session/save-date`, {
        date: formatDate(date)
      }, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      // Check if the response contains the ID and message
      if (response.data && response.data.success) {
        const { id, starttime, endtime, prog_name, message } = response.data;
        console.log('Date saved with ID:', id);
        // toast.success(message);

        // Store the ID in state
        setSavedDateId(id);
        setstarttimeforliting(starttime);
        setendtimeforliting(endtime);
        setprogname(prog_name);
        console.log("ghdsfgshd", starttimeforliting);


      } else {
        throw new Error('Unexpected response format');
      }
    } catch (error) {
      console.error('Error saving date:', error);
      toast.error('Failed to save date.');
    }
    toggleDateModal(); // Close the modal after saving the date
  };
  // const handleTimeChange = (event, isStartTime) => {
  //   const selectedTime = event.target.value;

  //   if (isStartTime) {
  //     const [selectedHours, selectedMinutes] = selectedTime.split(':').map(Number);
  //     const [endHours, endMinutes] = endtimeforliting.split(':').map(Number);
  //     const [startHours, startMinutes] = starttimeforliting.split(':').map(Number);

  //     const selectedDateTime = new Date();
  //     selectedDateTime.setHours(selectedHours, selectedMinutes);

  //     const endDateTime = new Date();
  //     endDateTime.setHours(endHours, endMinutes);

  //     const minDateTime = new Date();
  //     minDateTime.setHours(startHours, startMinutes);

  //     if (selectedDateTime < minDateTime) {
  //       setError('Start time must be after or equal to the minimum allowed time.');
  //     } else if (selectedDateTime > endDateTime) {
  //       setError('Start time must be before or equal to end time.');
  //     } else {
  //       setError('');
  //       setStartTime(selectedTime);
  //       generateEndTimesOptions(selectedTime, endtimeforliting);
  //     }
  //   } else {
  //     setEndTime(selectedTime);
  //   }
  // };


  // const handleTimeChange = (event, isStartTime) => {
  //   const selectedTime = event.target.value;

  //   if (isStartTime) {
  //     // Handle start time change
  //     const [selectedHours, selectedMinutes] = selectedTime.split(':').map(Number);
  //     const [endHours, endMinutes] = endtimeforliting.split(':').map(Number);
  //     const [startHours, startMinutes] = starttimeforliting.split(':').map(Number);

  //     const selectedDateTime = new Date();
  //     selectedDateTime.setHours(selectedHours, selectedMinutes);

  //     const endDateTime = new Date();
  //     endDateTime.setHours(endHours, endMinutes);

  //     const minDateTime = new Date();
  //     minDateTime.setHours(startHours, startMinutes);

  //     if (selectedDateTime < minDateTime) {
  //       setError('Start time must be after or equal to the minimum allowed time.');
  //     } else if (selectedDateTime > endDateTime) {
  //       setError('Start time must be before or equal to end time.');
  //     } else {
  //       setError('');
  //       setStartTime(selectedTime);
  //       generateEndTimesOptions(selectedTime, endtimeforliting);
  //     }
  //   } else {
  //     // Handle end time change
  //     const [selectedHours, selectedMinutes] = selectedTime.split(':').map(Number);
  //     const [startHours, startMinutes] = starttimeforliting.split(':').map(Number);
  //     const [endHours, endMinutes] = endtimeforliting.split(':').map(Number);

  //     const selectedDateTime = new Date();
  //     selectedDateTime.setHours(selectedHours, selectedMinutes);

  //     const startDateTime = new Date();
  //     startDateTime.setHours(startHours, startMinutes);

  //     const endDateTime = new Date();
  //     endDateTime.setHours(endHours, endMinutes);

  //     if (selectedDateTime < startDateTime) {
  //       setError('End time must be after or equal to start time.');
  //     } else if (selectedDateTime > endDateTime) {
  //       setError('End time must be before or equal to the maximum allowed end time.');
  //     } else {
  //       setError('');
  //       setEndTime(selectedTime);
  //     }
  //   }
  // };

  const handleTimeChange = (event, isStartTime) => {
    const selectedTime = event.target.value;
  
    if (isStartTime) {
      // Handle start time change
      const [selectedHours, selectedMinutes] = selectedTime.split(':').map(Number);
      const selectedDateTime = new Date();
      selectedDateTime.setHours(selectedHours, selectedMinutes);
  
      // Parse endTime and startTime limits
      const [endHours, endMinutes] = endtimeforliting.split(':').map(Number);
      const endDateTime = new Date();
      endDateTime.setHours(endHours, endMinutes);
  
      const [minStartHours, minStartMinutes] = starttimeforliting.split(':').map(Number);
      const minStartDateTime = new Date();
      minStartDateTime.setHours(minStartHours, minStartMinutes);
  
      // Validate against minimum allowed start time and maximum allowed end time
      if (selectedDateTime < minStartDateTime) {
        setError('Start time must be after or equal to the minimum allowed time.');
      } else if (selectedDateTime > endDateTime) {
        setError('Start time must be before or equal to end time.');
      } else {
        setError('');
        setStartTime(selectedTime);
        generateEndTimesOptions(selectedTime, endtimeforliting);
  
        // Check if endTime is set and enforce the 10-minute interval
        if (endTime) {
          const [currentEndHours, currentEndMinutes] = endTime.split(':').map(Number);
          const currentEndDateTime = new Date();
          currentEndDateTime.setHours(currentEndHours, currentEndMinutes);
  
          const diffMinutes = (currentEndDateTime - selectedDateTime) / (1000 * 60);
          if (diffMinutes < 10) {
            setError('The time interval must be at least 10 minutes.');
            setEndTime('');  // Reset endTime if the interval is too short
          }
        }
      }
    } else {
      // Handle end time change
      const [selectedHours, selectedMinutes] = selectedTime.split(':').map(Number);
      const selectedDateTime = new Date();
      selectedDateTime.setHours(selectedHours, selectedMinutes);
  
      // Parse startTime and endTime limits
      const [startHours, startMinutes] = startTime.split(':').map(Number);
      const startDateTime = new Date();
      startDateTime.setHours(startHours, startMinutes);
  
      const [maxEndHours, maxEndMinutes] = endtimeforliting.split(':').map(Number);
      const maxEndDateTime = new Date();
      maxEndDateTime.setHours(maxEndHours, maxEndMinutes);
  
      // Validate against start time and maximum allowed end time
      if (selectedDateTime < startDateTime) {
        setError('End time must be after or equal to start time.');
      } else if (selectedDateTime > maxEndDateTime) {
        setError('End time must be before or equal to the maximum allowed end time.');
      } else {
        const diffMinutes = (selectedDateTime - startDateTime) / (1000 * 60);
        if (diffMinutes < 10) {
          setError('The time interval must be at least 10 minutes.');
        } else {
          setError('');
          setEndTime(selectedTime);
        }
      }
    }
  };
  
  


  const handleHallTypeChange = (e) => {
    console.log("tab", e.target.value);
    setActiveTab(e.target.value);
  };

  const toggleTab1 = async (tabId) => {
    if (activeTabContent !== tabId) {
      setActiveTabContent(tabId);
      // Use debounce to ensure fetchEvents isn't called too frequently
    }
  };
  // const validEvents = eventlist.filter(event => event && event.title);

  const handleEdit = (eventId) => {
    console.log('Edit event with ID:', eventId);
    // Implement your edit logic here
  };

  const handleDelete = (eventId) => {
    console.log('Delete event with ID:', eventId);
    // Implement your delete logic here
    try {
      const token = getToken();
      axios.delete(`${BackendAPI}/session/deletesession`, {
        headers: {
          Authorization: `Bearer ${token}` // Include the token in the Authorization header
        },
        data: { eventId } // Include the data payload correctly
      });
      SweetAlert.fire({
        title: 'Success!',
        text: 'Session removed successfully!',
        icon: 'success',
        timer: 3000,
        showConfirmButton: false,
        allowOutsideClick: false,
        allowEscapeKey: false
      });
      setShouldFetch(true);
    } catch (error) {
      console.error('Error deleting Notification:', error);
    }
    // setModal(false); // Close modal after deletion
  };

  const handleAddSubsession = (eventId) => {
    console.log('Add subsession to event with ID:', eventId);
    // Implement your  ubsession logic here
  };

  const [hours, minutes] = starttimeforliting.split(':').map(Number);
  const [hours1, minutes1] = endtimeforliting.split(':').map(Number);

  const startTime1 = new Date(startDate);
  startTime1.setHours(hours, minutes, 0); // Start time: 09:00 AM

  const endTime1 = new Date(startDate);
  endTime1.setHours(hours1, minutes1, 0); // End time: 05:00 PM

  // Filter and map events to include start and end times
  const validEvents = eventlist
    .filter(event => event && event.title) // Filter events with titles
    .map(event => ({
      ...event,
      // start: startTime1, // Apply static start time to each event
      // end: endTime1,     // Apply static end time to each event
    }));

  useEffect(() => {
    // Simulate data fetching
    setTimeout(() => {
      setIsLoading(false);
    }, 2000); // Example: 2 seconds delay to simulate loading
  }, []);


  return (
    <Fragment>
      <Breadcrumbs mainTitle={
        <>
          Manage Session
          <MdInfoOutline
            id="sessionPopover"
            style={{
              cursor: 'pointer', position: 'absolute', marginLeft: '5px'
            }}
          />
          <UncontrolledPopover
            placement="bottom"
            target="sessionPopover"
            trigger="focus"
          >
            <PopoverBody>
              Sessions help organize the event into manageable segments, making it easier for
              attendees to find and participate in topics that interest them. From here, you can create sessions for a specific hall or a common hall, including all necessary details.
            </PopoverBody>
          </UncontrolledPopover>
        </>
      } parent="Event App Admin" title="Manage Session" />
      <Container fluid={true}>
        <Card>
          <CardHeader>
            <div>
              <Navbar color="light" light expand="md">
                {/* <NavbarBrand href="/">Manage Session</NavbarBrand> */}
                <NavbarToggler onClick={toggle} />
                <Collapse isOpen={isOpen} navbar>
                  <Nav className="ml-auto" navbar>
                    <NavItem>
                      <NavLink href="#">
                        <Button color="primary" onClick={toggleDateModal}>
                          <FaCalendarAlt style={{ marginRight: '10px' }} />
                          {/* {startDate ? format(startDate, 'dd MMM - yyyy') (progname) : 'Select Date'} */}

                          {startDate ? (
                            <>
                              {format(startDate, 'dd MMM - yyyy')} ({progname})
                            </>
                          ) : (
                            'Select Date'
                          )}

                        </Button>
                      </NavLink>
                    </NavItem>
                    <NavItem>
                      <NavLink href="#">
                        <Button color="secondary" onClick={toggleSessionModal}>
                          <FaClock style={{ marginRight: '10px' }} />
                          Set Default Session Length
                        </Button>
                      </NavLink>
                    </NavItem>
                    <NavItem className="ml-5">
                    </NavItem>
                    <NavItem className="ml-5">
                      <NavLink href="#">
                        <Button color="success" onClick={handleManageProgram}>
                          <FaCog style={{ marginRight: '10px' }} />
                          Manage Program
                        </Button>
                      </NavLink>
                    </NavItem>
                  </Nav>
                </Collapse>
              </Navbar>

              <div>

                <div className="tab-container" ref={tabContainerRef}>
                  <Button
                    key='0'
                    color={activeTab === 0 ? 'primary' : 'secondary'}
                    onClick={() => toggleTab(0)}
                    className="tab-button me-2"
                  >
                    Conference Hall
                  </Button>
                  {tabs.map(tab => (
                    <Button
                      key={tab.locat_id}
                      color={activeTab === tab.locat_id ? 'primary' : 'secondary'}
                      onClick={() => toggleTab(tab.locat_id)}
                      className="tab-button me-2"
                    >
                      {tab.locat_name}
                    </Button>
                  ))}
                  {/* Add the "No Hall" tab */}

                  {scrollPosition.current > 0 && (
                    <Button className="scroll-button" onClick={() => handleScroll('left')}>
                      <FaChevronLeft />
                    </Button>
                  )}
                  <Button className="scroll-button" onClick={() => handleScroll('right')}>
                    <FaChevronRight />
                  </Button>
                </div>

              </div>
            </div>
          </CardHeader>

          {/* <div className="calendar-container mt-5"> */}

          {/* <div>
          {startDate ? (
            <Calendar
              localizer={localizer}
              events={validEvents}
              //  startAccessor="starttimeforliting"
              //  endAccessor="endtimeforliting"
              views={['day']}
              defaultView="day"
              min={startTime1}
              max={endTime1}
              defaultDate={startDate}
              key={startDate}
              style={{ height: '100vh' }}
              selectable
              onSelectSlot={handleSelectSlot}
              components={{
                event: (props) => (
                  <CustomEvent
                    {...props}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    onSubsession={handleAddSubsession}
                    SelectedSlot={selectedSlot}
                    sessionLength={newSessionLength}
                  />
                ),
                toolbar: CustomToolbar
              }}
            />
          ) : (
            <div className="no-date-message">
              <h3 className='mt-5'>Create the programs day first, and only then are you allowed to create sessions and subsessions for that day</h3>
            </div>
          )} */}

          <div >

            {/* <CardBody className="overflow-auto p-0">
              {startDate ? (
                <Calendar
                  localizer={localizer}
                  events={validEvents}
                  views={['day']}
                  defaultView="day"
                  min={startTime1}
                  max={endTime1}
                  defaultDate={startDate}
                  key={startDate}
                  style={{ height: '100vh' }}
                  selectable
                  onSelectSlot={handleSelectSlot}
                  components={{
                    event: (props) => (
                      <CustomEvent
                        {...props}
                        onEdit={handleEdit}
                        onDelete={handleDelete}
                        onSubsession={handleAddSubsession}
                        SelectedSlot={selectedSlot}
                        sessionLength={newSessionLength}
                        endtimeforliting={endtimeforliting}
                        starttimeforliting={starttimeforliting}

                      />
                    ),
                    toolbar: CustomToolbar
                  }}
                />
              ) : (
                <div className="no-date-message">
                  <h3 className="mt-5">
                    Create the program's day first, and only then are you allowed to create sessions and subsessions for that day
                  </h3>
                </div>
              )}
            </CardBody> */}
            <CardBody className="overflow-auto p-0">
              {isLoading ? (
                <Skeleton height="100vh" active />
              ) : startDate ? (
                <Calendar
                  localizer={localizer}
                  events={validEvents}
                  views={['day']}
                  defaultView="day"
                  min={startTime1}
                  max={endTime1}
                  defaultDate={startDate}
                  key={startDate}
                  style={{ height: '100vh' }}
                  selectable
                  onSelectSlot={handleSelectSlot}
                  components={{
                    event: (props) => (
                      <CustomEvent
                        {...props}
                        onEdit={handleEdit}
                        onDelete={handleDelete}
                        onSubsession={handleAddSubsession}
                        SelectedSlot={selectedSlot}
                        sessionLength={newSessionLength}
                        endtimeforliting={endtimeforliting}
                        starttimeforliting={starttimeforliting}
                      />
                    ),
                    toolbar: CustomToolbar
                  }}
                />
              ) : (
                <div className="no-date-message">
                  <h3 className="mt-5">
                    Create the program's day first, and only then are you allowed to create sessions and subsessions for that day
                  </h3>
                </div>
              )}
            </CardBody>
          </div>
        </Card>
      </Container>
      <div>
        <div className="calendar-tooltip">Click here to create a session</div>

        <style jsx>{`
        .no-date-message {
          font-size: 1.5rem;
          font-weight: bold;
          color: #dc3545; /* Bootstrap's danger color */
          text-align: center;
        }
      `}</style>
      </div>

      <div>

        {/* <SessionDetails sessions={filteredSessions} /> */}

        <Modal isOpen={isModalOpen} toggle={handleModalClose} className="modal-dialog-centered fixed-height-modal" backdrop="static" keyboard={false}>
          <ModalHeader toggle={handleModalClose}>Add Session</ModalHeader>
          <ModalBody>
            <form onSubmit={(e) => handleFormSubmit(e, editIndex)}>
              <FormGroup>
                <Label className='fw-bold' for="eventTitle">Session Name *</Label>
                <Input
                  type="text"
                  id="eventTitle"
                  name="title"
                  required
                />
              </FormGroup>
              {/* <FormGroup>
                <Label className='fw-bold' for="description">Description *</Label>
                <Input
                  type="textarea"
                  id="description"
                  name="description"
                  required
                />
              </FormGroup> */}

              <FormGroup>
                <Label className='fw-bold' for="location">Hall/Location *</Label>
                <Input
                  type="select"
                  id="selectmethod"
                  value={activeTab}
                  onChange={handleHallTypeChange}
                >
                  <option value="0">Conference Hall</option>
                  {halltype.map((option) => (
                    <option key={option.locat_id} value={option.locat_id}>
                      {option.locat_name}
                    </option>
                  ))}
                </Input>
              </FormGroup>

              <div className="row">
                <div className="col-md-5">
                  <FormGroup>
                    <Label className='fw-bold' for="startTime">Start Time *</Label>
                    <Input
                      type="time"
                      id="startTime"
                      value={startTime}
                      onChange={(e) => handleTimeChange(e, true)}
                      required
                    />
                  </FormGroup>
                </div>

                <div className="col-md-5">
                  <FormGroup>
                    <Label className='fw-bold' for="endTime">End Time *</Label>
                    <Input
                      type="time"
                      id="endTime"
                      value={endTime}
                      onChange={(e) => handleTimeChange(e, false)}
                    />
                  </FormGroup>
                </div>

                <div className="col-md-2">
                  <Label className='fw-bold' for="endTime">Day *</Label>
                  <Button color="primary" onClick={toggleDateModal}>
                    <FaCalendarAlt />
                  </Button>
                </div>

                {error && <p className='text-danger'>{error}</p>}
              </div>

              <FormGroup>
                <Label className='fw-bold' for="thumbnail">Session Thumbnail</Label>
                <Input
                  type="file"
                  id="thumbnail"
                  accept="image/*"
                  onChange={handleFileChange}
                />
                {thumbnail && (
                  <div>
                    <p>Selected File: {thumbnail.name}</p>
                    <img
                      src={URL.createObjectURL(thumbnail)}
                      alt="Thumbnail Preview"
                      style={{ width: '100px', height: '100px', objectFit: 'cover' }}
                    />
                  </div>
                )}
              </FormGroup>
              <Nav tabs>
                <NavItem>
                  <NavLink
                    className={classnames({ active: activeTabContent === 1 })}
                    onClick={() => toggleTab1(1)}
                  >
                    Session
                  </NavLink>
                </NavItem>
                <NavItem>
                  <NavLink
                    className={classnames({ active: activeTabContent === 2 })}
                    onClick={() => toggleTab1(2)}
                  >
                    Workshop
                  </NavLink>
                </NavItem>
                <NavItem>
                  <NavLink
                    className={classnames({ active: activeTabContent === 3 })}
                    onClick={() => toggleTab1(3)}
                  >
                    Break
                  </NavLink>
                </NavItem>
              </Nav>
              <FormGroup>
                <Label className='fw-bold mt-3' for="description" >Description(250 words)</Label>
                <Input
                  type="textarea"
                  id="description"
                  name="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  required
                  invalid={!!error1}
                />
                {error1 && <FormFeedback>{error1}</FormFeedback>}
              </FormGroup>
              <TabContent activeTab={activeTabContent}>
                <TabPane tabId={1}>
                  {/* <div>
                    <FormGroup>
                      <Label className='fw-bold' for="facultySelect">Select Faculty</Label>
                      <Select
                        options={Faculties.map(pref => ({ value: pref.faculty_id, label: `${pref.ntitle} ${pref.fname} ${pref.lname}` }))}
                        id="facultySelect"
                        value={selectedFaculty}
                        onChange={setSelectedFaculty}
                        placeholder="Select faculty"
                      />
                    </FormGroup>
                    <FormGroup>
                      <Label className='fw-bold' for="roleSelect">Select Role</Label>
                      <Select
                        options={Role.map(role => ({ value: role.role_id, label: role.role_name }))}
                        id="roleSelect"
                        value={selectedRole}
                        onChange={setSelectedRole}
                        placeholder="Select role"
                      />
                    </FormGroup>
                    <Button color="primary" onClick={handleAddFacultyRole}>Add Faculty and Role</Button>
                    <div>
                      <h4>Selected Faculty and Roles</h4>
                      {facultyRolePairs.length > 0 ? (
                        <ul>
                          {facultyRolePairs.map((pair, index) => (
                            <li key={index}
                            style={{
                              backgroundColor: index === editIndex ? 'yellow' : 'transparent',
                              padding: '10px',
                              border: '1px solid #ccc',
                              margin: '5px 0'
                            }}>
                              {pair.faculty.label} - {pair.role.label}
                              <Button color="link" onClick={() => handleEditClick(index)}>
                                <FaEdit />
                              </Button>
                              <Button color="link" onClick={() => handleDeleteClick(index)}>
                                <FaTrash />
                              </Button>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p>No faculty and roles selected</p>
                      )}
                    </div>
                  </div> */}
                  <div>
                    <FormGroup>
                      <Label className='fw-bold' for="facultySelect">Select Faculty</Label>
                      <Select
                        options={Faculties.map(pref => ({ value: pref.faculty_id, label: `${pref.ntitle} ${pref.fname} ${pref.lname}` }))}
                        id="facultySelect"
                        value={selectedFaculty}
                        onChange={setSelectedFaculty}
                        placeholder="Select faculty"
                      />
                    </FormGroup>
                    <FormGroup>
                      <Label className='fw-bold' for="roleSelect">Select Role</Label>
                      <Select
                        options={Role.map(role => ({ value: role.role_id, label: role.role_name }))}
                        id="roleSelect"
                        value={selectedRole}
                        onChange={setSelectedRole}
                        placeholder="Select role"
                      />
                    </FormGroup>
                    <Button color="primary" onClick={handleAddOrUpdateFacultyRole}>
                      {editIndex != null ? 'Update Faculty and Role' : 'Add Faculty and Role'}
                    </Button>
                    <div>
                      <h4>Selected Faculty and Roles</h4>
                      {facultyRolePairs.length > 0 ? (
                        <ul>
                          {facultyRolePairs.map((pair, index) => (
                            <li
                              key={index}
                              style={{
                                backgroundColor: index === editIndex ? 'yellow' : 'transparent',
                                padding: '10px',
                                border: '1px solid #ccc',
                                margin: '5px 0'
                              }}
                            >
                              {pair.faculty.label} - {pair.role.label}
                              <Button color="link" onClick={() => handleEditClick(index)}>
                                <FaEdit />
                              </Button>
                              <Button color="link" onClick={() => handleDeleteClick(index)}>
                                <FaTrash />
                              </Button>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p>No faculty and roles selected</p>
                      )}
                    </div>
                  </div>
                </TabPane>
                <TabPane tabId={2}>
                  {/* Content for Workshop */}
                  <div>
                    <FormGroup>
                      <Label className='fw-bold' for="facultySelect">Select Faculty</Label>
                      <Select
                        options={Faculties.map(pref => ({ value: pref.faculty_id, label: `${pref.ntitle} ${pref.fname} ${pref.lname}` }))}
                        id="facultySelect"
                        value={selectedFaculty}
                        onChange={setSelectedFaculty}
                        placeholder="Select faculty"
                      />
                    </FormGroup>
                    <FormGroup>
                      <Label className='fw-bold' for="roleSelect">Select Role</Label>
                      <Select
                        options={Role.map(role => ({ value: role.role_id, label: role.role_name }))}
                        id="roleSelect"
                        value={selectedRole}
                        onChange={setSelectedRole}
                        placeholder="Select role"
                      />
                    </FormGroup>
                    <Button color="primary" onClick={handleAddOrUpdateFacultyRole}>
                      {editIndex != null ? 'Update Faculty and Role' : 'Add Faculty and Role'}
                    </Button>
                    <div>
                      <h4>Selected Faculty and Roles</h4>
                      {facultyRolePairs.length > 0 ? (
                        <ul>
                          {facultyRolePairs.map((pair, index) => (
                            <li
                              key={index}
                              style={{
                                backgroundColor: index === editIndex ? 'yellow' : 'transparent',
                                padding: '10px',
                                border: '1px solid #ccc',
                                margin: '5px 0'
                              }}
                            >
                              {pair.faculty.label} - {pair.role.label}
                              <Button color="link" onClick={() => handleEditClick(index)}>
                                <FaEdit />
                              </Button>
                              <Button color="link" onClick={() => handleDeleteClick(index)}>
                                <FaTrash />
                              </Button>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p>No faculty and roles selected</p>
                      )}
                    </div>
                  </div>
                </TabPane>
                <TabPane tabId={3}>
                  {/* Content for Break */}
                  {/* <FormGroup>
                    <Label className='fw-bold' for="breakDetails">Break Details</Label>
                    <Input type="text" id="breakDetails" placeholder="Enter break details" />
                  </FormGroup> */}
                </TabPane>
              </TabContent>
              <div className="modal-footer">
              {ManageSessionPermissions?.add === 1 && (
                <>
                   <Button className='me-2' color="primary" type="submit" disabled={isSubmitting}>
  {isSubmitting ? 'Saving...' : 'Save'}
</Button>
                  <Button color="secondary" onClick={handleModalClose}>Cancel</Button>
                </>
              )}
              </div>
            </form>
          </ModalBody>
          <ModalFooter>
            {/* Additional footer content can go here */}
          </ModalFooter>
        </Modal>

      </div>


      {/* Modal for selecting start date */}
      <Modal isOpen={isDateModalOpen} toggle={toggleDateModal}>
        <ModalHeader toggle={toggleDateModal}>Select Start Date</ModalHeader>
        <ModalBody>
          <FormGroup>

            {/* <DatePicker
              inline
              id="startDate"
              selected={startDate}
              onChange={handleDateSelect}
              filterDate={filterDate}
              dateFormat="dd/MM/yyyy"
            /> */}

            <DatePicker
              inline
              id="startDate"
              selected={startDate}
              onChange={handleDateSelect}
              filterDate={filterDate}
              dateFormat="dd/MM/yyyy"
              dayClassName={(date) =>
                toDateArray.some(toDate => toDate.date.toDateString() === date.toDateString())
                  ? 'react-datepicker__day--highlighted'
                  : undefined
              }
              showMonthDropdown
              showYearDropdown
            />
          </FormGroup>
        </ModalBody>
      </Modal>

      {/* Modal for setting session length */}
      <Modal isOpen={isSessionModalOpen} toggle={toggleSessionModal}>
        <ModalHeader toggle={toggleSessionModal}>Set Default Session Length</ModalHeader>
        <ModalBody>
          <FormGroup>
            <Label className='fw-bold' for="sessionLength">Session Length (minutes)</Label>
            <input
              type="number"
              id="sessionLength"
              className="form-control"
              value={newSessionLength}
              onChange={(e) => setNewSessionLength(Number(e.target.value))}
            />
          </FormGroup>
        </ModalBody>
        <ModalFooter>
          <Button className='me-2' color="primary" onClick={handleSaveSessionLength}>
            Save
          </Button>
          <Button color="secondary" onClick={toggleSessionModal}>
            Cancel
          </Button>
        </ModalFooter>
      </Modal>

      {/* <div className="time-slot-container">
        {timeSlots.map((slot, index) => (
          <div key={index} className="time-slot">
            {slot}
          </div>
        ))}
      </div> */}
    </Fragment>
  );

};
export default ManageSession;
