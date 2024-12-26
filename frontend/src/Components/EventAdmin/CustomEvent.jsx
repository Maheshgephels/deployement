import React, { useState, useEffect, useContext } from 'react';
import {
  Button, Modal, ModalHeader, ModalFooter, ModalBody, Input, FormGroup, Label, Nav, NavItem, NavLink, TabContent, TabPane, FormFeedback
} from 'reactstrap';
import { FaCalendarAlt, FaEdit, FaTrash, FaBars } from 'react-icons/fa';
import { getToken } from '../../Auth/Auth';
import axios from 'axios';
import { BackendAPI } from '../../api';
import Select from 'react-select'; // Make sure react-select is installed
import classnames from 'classnames';
import DatePicker from 'react-datepicker';
import { toast } from 'react-toastify';
import SweetAlert from 'sweetalert2';
import { Tooltip } from 'react-tooltip';
import { MdDeleteOutline } from "react-icons/md";
import { IoMdAddCircleOutline } from "react-icons/io";
import { PermissionsContext } from '../../contexts/PermissionsContext';
import '../../assets/scss/programandsession/ManageSession.css';

const CustomEvent = ({ event, onEdit, onDelete, onSubsession, SelectedSlot, sessionLength, starttimeforliting, endtimeforliting }) => {
  const formatTime = (date) => {
    if (!date) return '';
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  };
  const [isMenuOpen, setIsMenuOpen] = useState(false);



  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const [modal, setModal] = useState(false);
  const [editModal, setEditModal] = useState(false);
  const [subsessionModal, setSubsessionModal] = useState(false);
  const [eventIdToDelete, setEventIdToDelete] = useState(null);
  const [Faculties, setFaculties] = useState([]);
  const [Roles, setRole] = useState([]);
  const [halltype, sethalltype] = useState([]);
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const toggleDateModal = () => setIsDateModalOpen(!isDateModalOpen);
  const [isDateModalOpen, setIsDateModalOpen] = useState(false);
  const [startDate, setStartDate] = useState(new Date());
  const [toDateArray, setToDateArray] = useState([]);
  const [savedDateId, setSavedDateId] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentSubsession, setCurrentSubsession] = useState(null);
  const [isHovered, setIsHovered] = useState(false);
  const [thumbnail, setThumbnail] = useState(null);
  const [previousThumbnailUrl, setPreviousThumbnailUrl] = useState('');
  const [adminServerName, setAdminServerName] = useState('');
  const { permissions } = useContext(PermissionsContext);
  const [sessData, setSessData] = useState({
    title: event.title,
    description: event.description,
    start: event.start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    end: event.end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    hallType: '',
    startTime: '',
    endTime: '',
    selectedFaculty: null,
    selectedRole: null,
    activeTabContent: 1,
    session_date: new Date()
  });

  console.log("SESS", sessData);

  const colors = [
    '#007bff', // Blue
    '#28a745', // Green
    '#dc3545', // Red
    '#ffc107', // Yellow
    '#17a2b8', // Teal
    '#6c757d', // Gray
    '#343a40', // Dark Gray
    '#e83e8c', // Pink
    '#fd7e14'  // Orange
  ];

  const getColor = (index) => colors[index % colors.length];




  const handleFileChange = (e) => {
    setThumbnail(e.target.files[0]);
  };


  const [formData, setFormData] = useState({
    title: event.title,
    description: event.description,
    start: event.start,
    end: event.end,
    hallType: '',
    startTime: '',
    endTime: '',
    selectedFaculty: null,
    selectedRole: null,
    activeTabContent: 1,
    session_date: new Date()
  });
  const [endTimesOptions, setEndTimesOptions] = useState([]);
  const [facultyRolePairs, setFacultyRolePairs] = useState([]);
  const [activeTabContent, setActiveTabContent] = useState(formData.activeTabContent || 1);
  const [selectedFaculty, setSelectedFaculty] = useState([]);
  const [selectedRole, setSelectedRole] = useState([]);
  const [startTime, setStartTime] = useState(formatTime(SelectedSlot?.start));
  const [endTime, setEndTime] = useState(formatTime(SelectedSlot?.end));
  const [newSessionLength, setNewSessionLength] = useState(sessionLength);
  const [fixedstartTime, setfixedstartTime] = useState('');
  const [fixedendTime, setfixedEndTime] = useState('');
  const [timeError, setTimeError] = useState('');
  const [sessionname, setsessionname] = useState('');
  const [subsessions, setSubsessions] = useState([]);
  const [subsessionsfordata, setSubsessionsfordata] = useState([]);
  const [FacultyAndRoles, setFacultyAndRoles] = useState([]);
  const [error, setError] = useState('');
  const [editIndex, setEditIndex] = useState(null);
  const [EditSessionDate, setSessionDate] = useState(null);
  const [triggerRerender, setTriggerRerender] = useState(false);
  const [error1, setError1] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  console.log("sessionLength", sessionLength);

  console.log("event id ", event.id);

  const sessionId = event.id;

  // fecth subsession for listing 

  const handleMouseEnter = () => {
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
  };

  const fetchSubsessions = async () => {
    try {
      const token = getToken(); // Assuming getToken is defined elsewhere
      const response = await axios.post(`${BackendAPI}/session/get-subsessions`, { sessionId }, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      console.log("Response:", response.data);
      setSubsessions(response.data);

    } catch (error) {
      console.error('Error fetching subsessions:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {

    fetchSubsessions();
  }, [sessionId, permissions]);

  // Extract Component Permission
  const ManageSessionPermissions = permissions['ManageSession'];

  const fetchfacultyandrole = async () => {
    try {
      const token = getToken(); // Assuming getToken is defined elsewhere
      const response = await axios.post(`${BackendAPI}/session/get-facultyandrole`, { sessionId }, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      const { facultyAndRoles } = response.data;
      setFacultyAndRoles(facultyAndRoles);

    } catch (error) {
      console.error('Error fetching subsessions:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {

    fetchfacultyandrole();
  }, [sessionId]);

  //fetch subsesion data for edit

  const fetchEditSubsessions = async (subsesionid) => {
    try {
      const token = getToken(); // Assuming getToken is defined elsewhere
      const response = await axios.post(`${BackendAPI}/session/Edit-subsessions`, { subsesionid }, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      // setSubsessionsfordata(response.data);

      const sessionData = response.data;
      console.log('Data from API:', sessionData);

      // Check if the data format matches the expected structure

      if (sessionData && sessionData.session_id) {
        // Extract the main session details
        const data = sessionData;

        // Combine faculty and role data
        if (sessionData.roles[0].sroled_id) {
          const facultyLookup = Faculties.reduce((acc, faculty) => {
            acc[faculty.faculty_id] = {
              value: faculty.faculty_id,
              label: `${faculty.ntitle} ${faculty.fname} ${faculty.lname}`
            };
            return acc;
          }, {});

          const roleLookup = Roles.reduce((acc, role) => {
            acc[role.role_id] = {
              value: role.role_id,
              label: role.role_name
            };
            return acc;
          }, {});

          // const facultyRolePairs = (data.roles || []).map(item => ({
          //   faculty: facultyLookup[item.faculty_id] || { value: item.faculty_id, label: 'Unknown Faculty' },
          //   role: roleLookup[item.role_id] || { value: item.role_id, label: ' ' }
          // }));


          const initialPairs = (data.roles || []).map(item => ({
            sroled_id: item.sroled_id,
            faculty: facultyLookup[item.faculty_id] || { value: item.faculty_id, label: 'Unknown Faculty' },
            role: roleLookup[item.role_id] || { value: item.role_id, label: ' ' }
          }));

          setFacultyRolePairs(initialPairs);

          console.log(initialPairs);
        }
        // setFacultyRolePairs(facultyRolePairs);

        // Set form data including faculty and role pairs
        setSubsessionsfordata(prevFormData => ({
          ...prevFormData,
          title: data.session_title || prevFormData.title,
          description: data.session_description || prevFormData.description,
          hallType: data.locat_id,
          startTime: data.start_time || prevFormData.startTime,
          endTime: data.end_time || prevFormData.endTime,
          facultyRolePairs: facultyRolePairs, // Store combined faculty and role data
          activeTabContent: data.sessiontype_id,
          session_date: data.session_date,

        }));

        setStartTime(data.start_time);
        setEndTime(data.end_time);

      
        //  generateEndTimesOptions(data.start_time);
      }
    } catch (error) {
      console.error('Error fetching subsessions:', error);
    } finally {
      setLoading(false);
    }
  };


  const generateEndTimesOptions = (start, initialEndTime) => {
    let startDateTime = new Date();
    const [hours, minutes] = start.split(':').map(Number);
    startDateTime.setHours(hours);
    startDateTime.setMinutes(minutes);

    const options = [];
    let optionTime = new Date(startDateTime);

    while (options.length < 10) {
      optionTime.setMinutes(optionTime.getMinutes() + newSessionLength);
      options.push(formatTime(optionTime));
    }

    // if (initialEndTime && options.includes(initialEndTime)) {
    //   setEndTime(initialEndTime);
    // } else {
    //   setEndTime(options[0]);
    // }

    options[0] = initialEndTime;
    setEndTimesOptions(options);
  };


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
  

  const handleTimeChangesubsession = (event, isStartTime) => {
    const newValue = event.target.value;

    if (isStartTime) {
      if (newValue < fixedstartTime || newValue > fixedendTime) {
        setTimeError('Start time must be between ' + fixedstartTime + ' and ' + fixedendTime + '.');
      } else if (newValue >= endTime && endTime) {
        setTimeError('End time must be after start time.');
      } else {
        setStartTime(newValue);
        setTimeError('');
      }
    } else {
      if (newValue < fixedstartTime || newValue > fixedendTime) {
        setTimeError('End time must be between ' + fixedstartTime + ' and ' + fixedendTime + '.');
      } else if (newValue <= startTime && startTime) {
        setTimeError('End time must be after start time.');
      } else {
        setEndTime(newValue);
        setTimeError('');
      }
    }
  };


  const formatDate = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0'); // Months are zero-indexed
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };



  const filterDate = date => {
    return toDateArray.some(toDate => toDate.date.toDateString() === date.toDateString());
  };

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
          id: dateObj.id
        }));

        setToDateArray(toDates);
        console.log("toDates", toDates);

        // Set the first date as the initial startDate and its ID
        if (toDates.length > 0) {
          setStartDate(toDates[0].date);
          // setStartDate(new Date(toDates[0].date))
          setSavedDateId(toDates[0].id); // Use the ID of the first date
        }
      } else {
        console.error('Error: Invalid response format or missing to_dates data');
      }
    } catch (error) {
      console.error('Error fetching to_date values:', error);
    }
  };





  const handleDateSelect = async (date) => {
    setStartDate(date);
    setSessionDate(formatDate(date));

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
        const { id, message } = response.data;
        console.log('Date saved with ID:', id);
        // toast.success(message);

        // Store the ID in state
        setSavedDateId(id);
      } else {
        throw new Error('Unexpected response format');
      }
    } catch (error) {
      console.error('Error saving date:', error);
      toast.error('Failed to save date.');
    }
    toggleDateModal(); // Close the modal after saving the date
  };


  const toggleTab = (tab) => {
    if (activeTabContent !== tab) setActiveTabContent(tab);
  };

  const fetchSession = async (sessionId) => {
    try {
      const token = getToken(); // Fetch the auth token
      const response = await axios.post(`${BackendAPI}/session/editSession`, { sessionId }, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      const sessionData = response.data;

      console.log('Data from API-khuhsboo:', sessionData);

      // Check if the data format matches the expected structure
      if (sessionData && sessionData.session_id) {
        // Extract the main session details
        const data = sessionData;

        // Combine faculty and role data
        if (sessionData.roles[0].sroled_id) {
          const facultyLookup = Faculties.reduce((acc, faculty) => {
            acc[faculty.faculty_id] = {
              value: faculty.faculty_id,
              label: `${faculty.ntitle} ${faculty.fname} ${faculty.lname}`
            };
            return acc;
          }, {});

          const roleLookup = Roles.reduce((acc, role) => {
            acc[role.role_id] = {
              value: role.role_id,
              label: role.role_name
            };
            return acc;
          }, {});

          // const facultyRolePairs = (data.roles || []).map(item => ({
          //   faculty: facultyLookup[item.faculty_id] || { value: item.faculty_id, label: 'Unknown Faculty' },
          //   role: roleLookup[item.role_id] || { value: item.role_id, label: ' ' }
          // }));


          const initialPairs = (data.roles || []).map(item => ({
            sroled_id: item.sroled_id,
            faculty: facultyLookup[item.faculty_id] || { value: item.faculty_id, label: 'Unknown Faculty' },
            role: roleLookup[item.role_id] || { value: item.role_id, label: ' ' }
          }));

          setFacultyRolePairs(initialPairs);
          console.log("initialPairs", initialPairs);
        }


        // setFacultyRolePairs(facultyRolePairs);

        // Set form data including faculty and role pairs
        setFormData(prevFormData => ({
          ...prevFormData,
          title: data.session_title || prevFormData.title,
          description: data.session_description || prevFormData.description,
          hallType: data.locat_id,
          startTime: data.start_time || prevFormData.startTime,
          endTime: data.end_time || prevFormData.endTime,
          facultyRolePairs: facultyRolePairs, // Store combined faculty and role data
          activeTabContent: data.sessiontype_id,
          session_date: data.session_date,

        }));
        setSessData(event => ({
          ...event,
          title: data.session_title || event.title,
          description: data.session_description || event.description,
          hallType: data.locat_id,
          start: data.start_time ? convertTo12Hour(data.start_time) : event.start,
          end: data.end_time ? convertTo12Hour(data.end_time) : event.end,
          facultyRolePairs: facultyRolePairs, // Store combined faculty and role data
          activeTabContent: data.sessiontype_id,
          session_date: data.session_date,

        }));



        setStartTime(data.start_time);
        setEndTime(data.end_time);
        setSessionDate(data.session_date);
        generateEndTimesOptions(data.start_time, data.end_time);
        setTriggerRerender(prev => !prev);
        // setPreviousThumbnailUrl(data.session_thumbnail);

        // const currentImagePath =  `${adminServerName}${data.session_thumbnail}`;
        const currentImagePath = data.session_thumbnail ? `${adminServerName}${data.session_thumbnail}` : '';
        setPreviousThumbnailUrl(currentImagePath);
        // setThumbnail(data.session_thumbnail);


      } else {
        console.error('Unexpected session data format:', sessionData);
      }
    } catch (error) {
      console.error('Error fetching session data:', error);
    }
  };
  function convertTo12Hour(time24) {
    const [hour, minute] = time24.split(':');
    const period = +hour >= 12 ? 'PM' : 'AM';
    const adjustedHour = +hour % 12 || 12;
    return `${adjustedHour}:${minute} ${period}`;
  }


  const fetchSessionforsubsession = async (sessionId) => {
    try {
      const token = getToken(); // Fetch the auth token
      const response = await axios.post(`${BackendAPI}/session/editSession`, { sessionId }, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      const sessionData = response.data;
      // console.log('Data from API:', sessionData);

      // Check if the data format matches the expected structure
      if (sessionData && sessionData.session_id) {
        // Extract the main session details
        const data = sessionData;
        setFormData(prevFormData => ({
          ...prevFormData,
          title: data.session_title || prevFormData.title,
          startTime: data.start_time || prevFormData.startTime,
          endTime: data.end_time || prevFormData.endTime,

        }));

        setsessionname(data.session_title);
        setStartTime(data.start_time);
        setEndTime(data.end_time);
        setfixedstartTime(data.start_time);
        setfixedEndTime(data.end_time);
      } else {
        console.error('Unexpected session data format:', sessionData);
      }
    } catch (error) {
      console.error('Error fetching session data:', error);
    }
  };

  useEffect(() => {
    fetchToDateArray(); // Corrected function name
  }, []);



  // const handleEditClick = (index) => {
  //   const pair = facultyRolePairs[index];
  //   setSelectedFaculty(pair.faculty);
  //   setSelectedRole(pair.role);
  //   // Remove the pair being edited from the list
  //   setFacultyRolePairs(facultyRolePairs.filter((_, i) => i !== index));
  // };

  // const handleDeleteClick = (index) => {
  //   setFacultyRolePairs(facultyRolePairs.filter((_, i) => i !== index));
  // };

  const handleAddFacultyRole = () => {
    if (selectedFaculty && selectedRole) {
      const newPair = {
        sroled_id: '',
        faculty: selectedFaculty,
        role: selectedRole
      };
      setFacultyRolePairs([...facultyRolePairs, newPair]);
      console.log("facultyRolePairs1", facultyRolePairs);
      setSelectedFaculty([]);
      setSelectedRole([]);
    }
  };


  // const handleAddOrUpdateFacultyRole = () => {
  //   if (selectedFaculty) {
  //     if (editIndex != null) {
  //       // Update the existing item
  //       const updatedPairs = facultyRolePairs.map((pair, i) =>
  //         i === editIndex ? { faculty: selectedFaculty, role: selectedRole } : pair
  //       );
  //       setFacultyRolePairs(updatedPairs);
  //       setEditIndex(null);
  //     } else {
  //       // Add a new item
  //       const newPair = {
  //         sroled_id: '',
  //         faculty: selectedFaculty,
  //         role: selectedRole
  //       };
  //       setFacultyRolePairs([...facultyRolePairs, newPair]);
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

  const handleEditClick = (index) => {
    const pair = facultyRolePairs[index];
    setSelectedFaculty(pair.faculty);
    setSelectedRole(pair.role);
    setEditIndex(index); // Set editIndex to the index of the item being edited
  };

  const handleDeleteClick = (index) => {
    setFacultyRolePairs(facultyRolePairs.filter((_, i) => i !== index));
    // Clear the edit index if it's the same as the deleted item
    if (editIndex === index) {
      setEditIndex(null);
      setSelectedFaculty(null);
      setSelectedRole(null);
    }
  };




  const handleDelete = (eventId) => {
    setEventIdToDelete(eventId);
    setModal(true);
  };

  const confirmDelete = () => {
    onDelete(eventIdToDelete);
    setModal(false);
    setEventIdToDelete(null);
  };

  const closeDeleteModal = () => {
    setModal(false);
    setIsHovered(false);
    setEventIdToDelete(null);
  };

  const openEditModal = () => {
    // console.log('Event ID:', event.id); // Log event ID
    fetchSession(event.id);
    setEventIdToDelete(event.id);
    setEditModal(true);
    setEditIndex(null);
    setSelectedFaculty(null);
    setSelectedRole(null);

  };


  const opensubsessionModal = () => {
    // console.log('Event ID:', event.id); // Log event ID
    fetchSessionforsubsession(event.id);
    setEventIdToDelete(event.id);
    setSubsessionModal(true);
  };

  const closesubsessionModal = () => {

    // setFacultyRolePairs([]);
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
        setSubsessionModal(false);
        setFacultyRolePairs([]);
      }
    });
  };

  const closeEditModal = () => {
    setEditModal(false);
    setFacultyRolePairs([]);
    setEditIndex(null);
    setSelectedFaculty(null);
    setSelectedRole(null);
    setPreviousThumbnailUrl(null);
    setThumbnail(null);

  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };


  const handleFormChangeforsubsession = (e) => {

    const { name, value } = e.target;
    setSubsessionsfordata({
      ...subsessionsfordata,
      [name]: value
    });
  };





  const toggleTab1 = (tabId) => {
    setFormData({
      ...formData,
      activeTabContent: tabId
    });
  };

  //edit form submit for session 

  // const submitEditForm = async (event) => {
  //   event.preventDefault();

  //   try {
  //     // Collect form data
  //     console.log("formData on update ", formData);
  //     const updatedSessionData = {
  //       sessionId: eventIdToDelete,  // Assuming you have a sessionId in your formData
  //       title: formData.title,
  //       description: formData.description,
  //       hallType: formData.hallType,
  //       startTime: startTime,
  //       endTime: endTime,
  //       sessionDate: startDate ? startDate.toISOString().split('T')[0] : '',
  //       facultyRoles: facultyRolePairs.map(pair => ({
  //         sroled_id: pair.sroled_id,
  //         faculty_id: pair.faculty.value,
  //         role_id: pair.role.value
  //       })),
  //       activeTabContent: activeTabContent,

  //     };

  //     // Send request to updateSession API
  //     const token = getToken();
  //     const response = await axios.post(`${BackendAPI}/session/updateSession`, updatedSessionData, {
  //       headers: {
  //         Authorization: `Bearer ${token}`
  //       }
  //     });

  //     if (response.status === 200) {
  //       // Handle success (e.g., show a success message or update UI)
  //       console.log('Session updated successfully');
  //       closeEditModal(); // Close modal after successful update

  //       window.location.reload();
  //     }
  //   } catch (error) {
  //     console.error('Error updating session:', error);
  //     // Handle error (e.g., show an error message)
  //   }
  // };

  const submitEditForm = async (event) => {
    event.preventDefault();

    const errorMsg = validateDescription(formData.description);
    if (errorMsg) {
      setError1(errorMsg);
      return;
    }
    setError1('');

    console.log("formData on update ", formData);

    try {
      // Create a FormData object


      const title = formData.title || '';  // Replace with your actual state/prop value for title
      const description = formData.description || '';
      const hallType = formData.hallType || '';

      const formData1 = new FormData();

      // Append text fields
      formData1.append('sessionId', eventIdToDelete);  // Assuming you have a sessionId in your formData
      formData1.append('title', title);
      formData1.append('description', description);
      formData1.append('hallType', hallType);
      formData1.append('startTime', startTime);
      formData1.append('endTime', endTime);
      // formData1.append('sessionDate', startDate ? startDate.toISOString().split('T')[0] : ''); // Old
      formData1.append('sessionDate', EditSessionDate); // updated code by Mahesh 22-08-24
      console.log('edit session date', EditSessionDate);
      formData1.append('activeTabContent', activeTabContent);

      // Append facultyRoles array as JSON
      formData1.append('facultyRoles', JSON.stringify(facultyRolePairs.map(pair => ({
        sroled_id: pair.sroled_id,
        faculty_id: pair.faculty.value,
        role_id: pair.role.value,
      }))));

      // Append thumbnail if a new one is selected
      if (thumbnail) {
        formData1.append('thumbnail', thumbnail);
      }

      // Send request to updateSession API
      const token = getToken();
      const response = await axios.post(`${BackendAPI}/session/updateSession`, formData1, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',  // Important for file uploads
        },
      });

      if (response.status === 200) {
        // Handle success (e.g., show a success message or update UI)
        console.log('Session updated successfully');
        closeEditModal(); // Close modal after successful update
        fetchSession(eventIdToDelete);
        // const updatedSession = response.data; // Assuming the response returns the updated session data

        // updateSessionInState(updatedSession); 
        SweetAlert.fire({
          title: 'Success!',
          text: 'Session Edited successfully!',
          icon: 'success',
          timer: 3000,
          showConfirmButton: false,
          allowOutsideClick: false,
          allowEscapeKey: false
        });

        window.location.reload();
      }
    } catch (error) {
      console.error('Error updating session:', error);
      // Handle error (e.g., show an error message)
    }
  };

  const validateDescription = (value) => {
    const maxWords = 250;
    if (!value) return;

    const wordCount = value.trim().split(/\s+/).length;
    return wordCount > maxWords ? `Description must be ${maxWords} words or fewer` : '';
  };




  const submitEditSubsessionForm = async (event) => {
    event.preventDefault();
    const errorMsg = validateDescription(subsessionsfordata.description);
    if (errorMsg) {
      setError1(errorMsg);
      return;
    }
    setError1('');
    try {
      // Collect form data
      console.log("formData on update ", subsessionsfordata);
      const updatedSessionData = {
        subsessionid: currentSubsession,
        title: subsessionsfordata.title,
        description: subsessionsfordata.description,
        // hallType: subsessionsfordata.hallType,
        startTime: startTime,
        endTime: endTime,
        // sessionDate: subsessionsfordata ? startDate.toISOString().split('T')[0] : '',
        facultyRoles: facultyRolePairs.map(pair => ({
          sroled_id: pair.sroled_id,
          faculty_id: pair.faculty.value,
          role_id: pair.role.value
        })),
        activeTabContent: activeTabContent,

      };

      // Send request to updateSession API
      const token = getToken();
      const response = await axios.post(`${BackendAPI}/session/updateSubSession`, updatedSessionData, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      setSubsessionsfordata([]);

      if (response.status === 200) {
        // Handle success (e.g., show a success message or update UI)
        console.log('Session updated successfully');
        closeModal(); // Close modal after successful update
        fetchSubsessions();
        SweetAlert.fire({
          title: 'Success!',
          text: 'Subsession Edited successfully!',
          icon: 'success',
          timer: 3000,
          showConfirmButton: false,
          allowOutsideClick: false,
          allowEscapeKey: false
        });
      }
      setFacultyRolePairs([]);

    } catch (error) {
      console.error('Error updating session:', error);
      // Handle error (e.g., show an error message)
    }



  };


  const fetchDropdown = async () => {
    try {
      const token = getToken();
      const response = await axios.get(`${BackendAPI}/session/getDropdownData`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      setData(response.data);
      setLoading(false);

      const fetchhalltype = response.data.halltype;
      const fetchfacultytype = response.data.facultytype;
      const role = response.data.role;

      sethalltype(fetchhalltype);
      setFaculties(fetchfacultytype);
      setRole(role);
      console.log("dropdown data ", fetchhalltype);
    } catch (error) {
      console.error('Error fetching dropdown data:', error);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDropdown();
  }, []);


  //subsession submit  add


  const handleFormSubmit = async (event) => {
    event.preventDefault();
    setIsSubmitting(true);
    const errorMsg = validateDescription(formData.description);
    if (errorMsg) {
      setError1(errorMsg);
      setIsSubmitting(false); // Re-enable button on validation error
      return;
    }
    setError1('');


    // Prepare data for API call
    const updatedSessionData = {
      sessionId: eventIdToDelete,
      title: formData.title,
      description: formData.description,
      startTime: startTime,
      endTime: endTime,
      facultyRolePairs, // This should be an array of objects
      activeTabContent, // Add the selected tab ID
      savedDateId, // Include the saved date ID
      startDate: formatDate(startDate)

    };

    try {
      // Replace with your actual API endpoint
      const token = getToken();
      const response = await axios.post(`${BackendAPI}/session/add-subsession`, updatedSessionData, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      // Handle success
      console.log('Form submitted successfully:', response.data);
      setFacultyRolePairs([]);
      setSubsessionModal(false);
      // setShouldFetch(true);

      SweetAlert.fire({
        title: 'Success!',
        text: 'Sub-Session Created successfully !',
        icon: 'success',
        timer: 3000,
        showConfirmButton: false,
        allowOutsideClick: false,
        allowEscapeKey: false
      });
      fetchSubsessions();
    } catch (error) {
      // Handle error
      console.error('Error submitting form:', error);
    } finally {
      setIsSubmitting(false); // Re-enable button after the process is complete
    }
  };

  const handleEditSubsession = (subsession) => {
    // fetchSessionforsubsession(event.id);
    fetchEditSubsessions(subsession);
    setCurrentSubsession(subsession);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setCurrentSubsession(null);
    setFacultyRolePairs([]);
  };

  const handleDeleteSubsession = (subsessionId) => {
    SweetAlert.fire({
      title: 'Are you sure?',
      text: 'Do you really want to delete this sub session? This action cannot be undone.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, delete it!',
      cancelButtonText: 'Cancel',
      reverseButtons: true
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          const token = getToken();
          await axios.delete(`${BackendAPI}/session/deletesubsession`, {
            headers: {
              Authorization: `Bearer ${token}` // Include the token in the Authorization header
            },
            data: { subsessionId } // Include the data payload correctly
          });

          SweetAlert.fire({
            title: 'Deleted!',
            text: 'Sub Session removed successfully!',
            icon: 'success',
            timer: 3000,
            showConfirmButton: false,
            allowOutsideClick: false,
            allowEscapeKey: false
          });

          // Refresh the subsession list or update UI as needed
          fetchSubsessions();
        } catch (error) {
          console.error('Error deleting Subsession:', error);
          SweetAlert.fire({
            title: 'Error!',
            text: 'There was an error deleting the sub session. Please try again.',
            icon: 'error',
            timer: 3000,
            showConfirmButton: false,
            allowOutsideClick: false,
            allowEscapeKey: false
          });
        }
      }
    });
  };

  useEffect(() => {
    fetchadminserver(); // Fetch Faculty data when component mounts
  }, []);

  const fetchadminserver = async () => {
    try {
      const token = getToken();
      const response = await axios.get(`${BackendAPI}/faculty/adminserver`, {
        headers: {
          Authorization: `Bearer ${token}` // Include the token in the Authorization header
        }
      });
      console.log('server', response.data);


      const data = response.data;
      console.log('data', data);
      // Assuming `adminserver_name` is the field you need
      setAdminServerName(data.adminserver_name || '');

    } catch (error) {
      console.error('Error fetching Faculty data:', error);
    }
  };

  useEffect(() => {
    console.log('CustomEvent re-rendered with new sessData:', sessData);
  }, [sessData]);



  return (




    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '20px' }}>


      {/* Session Card */}
      <div
        key={event.id}
        className="session-card"
        style={{
          // flex: '1',
          marginBottom: '20px',
          padding: '15px',
          // border: '1px solid #ddd',
          // borderRadius: '8px',
          width: '60%',
          height: 'auto',
          overflow: 'auto',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          position: 'relative',

        }}
        onDoubleClick={openEditModal}
      >
        {/* Top Section: Time and Hamburger Menu */}
        <div style={{ marginBottom: '10px', display: 'flex', alignItems: 'center' }}>
          {/* Time Information */}
          <p style={{ margin: '0', fontSize: '14px', flex: '1' }}>
            {event.start?.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} -
            {event.end?.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </p>

          {/* Hamburger Menu */}
          {(ManageSessionPermissions?.edit === 1 || ManageSessionPermissions?.delete === 1 || ManageSessionPermissions?.add === 1) && (
            <div onClick={toggleMenu} style={{ cursor: 'pointer', fontSize: '20px' }}>
              <FaBars />
            </div>
          )}
        </div>


        {/* Session Info */}
        <div style={{ flexGrow: 1, marginBottom: '10px' }}>
          <h6 style={{ fontSize: '16px', margin: '0' }}>{event.title}</h6>
          <p
            style={{
              margin: '0',
              fontSize: '14px',
              whiteSpace: 'nowrap',          // Prevents text from wrapping to the next line
              overflow: 'hidden',            // Ensures content that overflows is hidden
              textOverflow: 'ellipsis',      // Adds the ellipsis (...) at the end of the line
            }}
          >
            {event.description}
          </p>
          {/* {FacultyAndRoles
  .filter(item => item.session_id === event.id)
  .map((item, index) => {
    // Find the faculty name based on faculty_id
    const faculty = Faculties.find(fac => fac.faculty_id === item.faculty_id);
     const facultyName = faculty ? `${faculty.ntitle} ${faculty.fname} ${faculty.lname}` : 'Unknown Faculty';

    // Find the role name based on role_id
    const role = Roles.find(r => r.role_id === item.role_id);
    const roleName = role ? role.role_name : ' ';

    return (
      <p key={index} style={{ margin: '0', fontSize: '14px' }}>
        {facultyName} - {roleName}
      </p>
    );
  })} */}

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
            {FacultyAndRoles.length === 0 ? (
              <p>Speaker - TBA</p>
            ) : (
              FacultyAndRoles
                .filter(item => item.session_id === event.id)
                .map((item, index) => {
                  // Find the faculty based on faculty_id
                  const faculty = Faculties.find(fac => fac.faculty_id === item.faculty_id);
                  const facultyName = faculty ? `${faculty.ntitle || ''} ${faculty.fname || ''} ${faculty.lname || ''}` : 'Unknown Faculty';

                  // Find the role based on role_id
                  const role = Roles.find(r => r.role_id === item.role_id);
                  const roleName = role ? role.role_name : ' ';

                  return (
                    <div
                      key={index}
                      style={{
                        position: 'relative',
                        display: 'flex',
                        alignItems: 'center',
                      }}
                    >
                      <div
                        // data-tip={`${facultyName} - ${roleName}`} // Tooltip content
                        data-tooltip-id="tooltip"
                        data-tooltip-content={`${facultyName} - ${roleName}`}
                        data-tooltip-event="click focus"
                        style={{
                          width: '30px',
                          height: '30px',
                          borderRadius: '50%',
                          backgroundColor: getColor(index), // Assign color based on index
                          border: '1px solid #fff',
                          color: '#fff',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '14px',
                          fontWeight: 'bold',
                          cursor: 'pointer',
                          textAlign: 'center',
                        }}
                      // title={`${facultyName} - ${roleName}`} // Tooltip on hover

                      >
                        {faculty ? `${faculty.fname.charAt(0)}${roleName.charAt(0)}` : 'T'}
                        <Tooltip id="tooltip" globalEventOff="click" />
                      </div>
                    </div>
                  );
                })
            )}
          </div>
        </div>

        {/* Dropdown Menu */}
        {isMenuOpen && (
          <div
            className="dropdown-menu"
            style={{
              position: 'absolute',
              top: '50px', // Adjust based on where you want the menu to appear
              right: '0',
              zIndex: '10',
              // width: '200px',
              padding: '10px',
              backgroundColor: '#fff',
              border: '1px solid #ddd',
              borderRadius: '8px',
              boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
              display: 'flex',
              justifyContent: 'center',
              gap: '10px',
            }}
          >
            {ManageSessionPermissions?.add === 1 && (
              <button
                data-tooltip-id="tooltip"
                data-tooltip-content="Add Subsession"
                data-tooltip-event="click focus"
                onClick={opensubsessionModal}
                style={{
                  padding: '8px',
                  fontSize: '14px',
                  border: 'none',
                  borderRadius: '4px',
                  backgroundColor: '#007bff',
                  color: '#fff',
                  cursor: 'pointer',
                }}
              >
                <IoMdAddCircleOutline />
              </button>
            )}
            {ManageSessionPermissions?.edit === 1 && (
              <button
                data-tooltip-id="tooltip"
                data-tooltip-content="Edit Session"
                data-tooltip-event="click focus"
                onClick={openEditModal}
                style={{
                  padding: '8px',
                  fontSize: '14px',
                  border: 'none',
                  borderRadius: '4px',
                  backgroundColor: '#28a745',
                  color: '#fff',
                  cursor: 'pointer',
                }}
              >
                <FaEdit />
              </button>
            )}
            {ManageSessionPermissions?.delete === 1 && (
              <button
                data-tooltip-id="tooltip"
                data-tooltip-content="Delete"
                data-tooltip-event="click focus"
                onClick={() => handleDelete(event.id)}
                style={{
                  padding: '8px',
                  fontSize: '14px',
                  border: 'none',
                  borderRadius: '4px',
                  backgroundColor: '#dc3545',
                  color: '#fff',
                  cursor: 'pointer',
                }}
              >
                <MdDeleteOutline />
              </button>
            )}
          </div>
        )}
        <Tooltip id="tooltip" globalEventOff="click" place="top" />

      </div>


      {/* Subsessions Section */}
      <div style={{ width: '40%', height: '600px', padding: '15px', border: '1px solid #ddd', borderRadius: '8px', boxShadow: '0 4px 8px rgba(0,0,0,0.1)', overflow: 'scroll' }}>
        <div style={{ height: 'inherit' }}>
          <h5 style={{ margin: '0 0 10px 0' }}>Subsessions</h5>
          {subsessions.length > 0 ? (
            subsessions.map(subsession => (
              <div key={subsession.subsession_id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                <div style={{ flex: 1 }}>

                  <h6 style={{ margin: '0 0 5px 0' }}>{subsession.start_time} - {subsession.end_time}</h6>
                  {/* <p>{subsession.subsession_description}</p> */}
                </div>
                <div style={{ flex: 1 }}>

                  <h6 style={{ margin: '0 0 5px 0' }}>{subsession.subsession_title}</h6>
                  {/* <p>{subsession.subsession_description}</p> */}
                </div>
                <div style={{ display: 'flex', gap: '5px' }}>
                  {ManageSessionPermissions?.edit === 1 && (
                    <button
                      data-tooltip-id="tooltip"
                      data-tooltip-content="Edit Subsession"
                      data-tooltip-event="click focus"
                      onClick={() => handleEditSubsession(subsession.subsession_id)}
                      style={{
                        padding: '4px 8px',
                        fontSize: '12px',
                        border: 'none',
                        borderRadius: '4px',
                        backgroundColor: '#28a745',
                        color: '#fff',
                        cursor: 'pointer',
                      }}
                    >
                      <FaEdit />
                    </button>
                  )}
                  {ManageSessionPermissions?.delete === 1 && (
                    <button
                      data-tooltip-id="tooltip"
                      data-tooltip-content="Delete Subsession"
                      data-tooltip-event="click focus"
                      onClick={() => handleDeleteSubsession(subsession.subsession_id)}
                      style={{
                        padding: '4px 8px',
                        fontSize: '12px',
                        border: 'none',
                        borderRadius: '4px',
                        backgroundColor: '#dc3545',
                        color: '#fff',
                        cursor: 'pointer',
                      }}
                    >
                      <MdDeleteOutline />
                    </button>
                  )}
                </div>
              </div>
            ))
          ) : (
            <p>No subsessions available.</p>
          )}
        </div>
        <Tooltip id="tooltip" globalEventOff="click" place="top" />
      </div>


      {/* Edit Modal  session*/}
      <Modal isOpen={editModal} toggle={closeEditModal} className="modal-dialog-centered" backdrop="static" keyboard={false}>
        <ModalHeader toggle={closeEditModal}>Edit Session</ModalHeader>
        <ModalBody className='pt-0'>
          <form onSubmit={submitEditForm}>
            <FormGroup>
              <Label className='fw-bold' for="eventTitle">Session Name *</Label>
              <Input
                type="text"
                id="eventTitle"
                name="title"
                value={formData.title}
                onChange={handleFormChange}
                required
              />
            </FormGroup>



            <FormGroup>
              <Label className='fw-bold' for="hallType">Hall *</Label>
              <Input
                type="select"
                id="hallType"
                name="hallType"
                value={formData.hallType}
                onChange={handleFormChange}
                required
              >

                {/* <option value="">Select Hall *</option> */}
                <option value="0">Conference Hall</option>
                {halltype.map((ht) => (
                  <option key={ht.locat_id} value={ht.locat_id}>{ht.locat_name}</option>
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
                {/* <FormGroup>
                  <Label className='fw-bold' for="endTime">End Time</Label>
                  <Input
                    type="select"
                    id="endTime"
                    value={endTime}
                    onChange={(e) => handleTimeChange(e, false)}
                    required
                  >
                    {endTimesOptions.map((option, index) => (
                      <option key={index} value={option}>
                        {option}
                      </option>
                    ))}
                  </Input>

                </FormGroup> */}
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
              {!thumbnail && previousThumbnailUrl && (
                <div>
                  <p>Existing Thumbnail:</p>
                  <img
                    src={previousThumbnailUrl}
                    alt="Previous Thumbnail"
                    style={{ width: '100px', height: '100px', objectFit: 'cover' }}
                  />
                </div>
              )}
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
                  onClick={() => toggleTab(1)}
                >
                  Session
                </NavLink>
              </NavItem>
              <NavItem>
                <NavLink
                  className={classnames({ active: activeTabContent === 2 })}
                  onClick={() => toggleTab(2)}
                >
                  Workshop
                </NavLink>
              </NavItem>
              <NavItem>
                <NavLink
                  className={classnames({ active: activeTabContent === 3 })}
                  onClick={() => toggleTab(3)}
                >
                  Break
                </NavLink>
              </NavItem>
            </Nav>
            <FormGroup>
              <Label className='fw-bold mt-3' for="eventDescription">Description(250 words)</Label>
              <Input
                type="textarea"
                id="eventDescription"
                name="description"
                value={formData.description}
                onChange={handleFormChange}
                required
                invalid={!!error1}
              />
              {error1 && <FormFeedback>{error1}</FormFeedback>}
            </FormGroup>
            <TabContent activeTab={activeTabContent}>
              <TabPane tabId={1}>
                <div>
                  <FormGroup>
                    <Label className='fw-bold' for="facultySelect">Select Faculty</Label>
                    <Select
                      options={Faculties.map(faculty => ({ value: faculty.faculty_id, label: `${faculty.ntitle} ${faculty.fname} ${faculty.lname}` }))}
                      id="facultySelect"
                      value={selectedFaculty}
                      onChange={setSelectedFaculty}
                      placeholder="Select faculty"
                    />
                  </FormGroup>
                  <FormGroup>
                    <Label className='fw-bold' for="roleSelect">Select Role</Label>
                    <Select
                      options={Roles.map(role => ({ value: role.role_id, label: role.role_name }))}
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
                    <h4 className='mt-2'>Selected Faculty and Roles</h4>
                    {facultyRolePairs.length > 0 ? (
                      <ul>
                        {facultyRolePairs.map((pair, index) => (
                          <li key={index} style={{
                            backgroundColor: index === editIndex ? 'yellow' : 'transparent',
                            padding: '10px',
                            border: '1px solid #ccc',
                            margin: '5px 0'
                          }}>
                            {pair.faculty.label} - {pair.role ? pair.role.label : ' '}
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
                <div>
                  <FormGroup>
                    <Label className='fw-bold' for="facultySelect">Select Faculty</Label>
                    <Select
                      options={Faculties.map(faculty => ({ value: faculty.faculty_id, label: `${faculty.ntitle} ${faculty.fname} ${faculty.lname}` }))}
                      id="facultySelect"
                      value={selectedFaculty}
                      onChange={setSelectedFaculty}
                      placeholder="Select faculty"
                    />
                  </FormGroup>
                  <FormGroup>
                    <Label className='fw-bold' for="roleSelect">Select Role</Label>
                    <Select
                      options={Roles.map(role => ({ value: role.role_id, label: role.role_name }))}
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
                    <h4 className='mt-2'>Selected Faculty and Roles</h4>
                    {facultyRolePairs.length > 0 ? (
                      <ul>
                        {facultyRolePairs.map((pair, index) => (
                          <li key={index} style={{
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
                </div>
              </TabPane>
              <TabPane tabId={3}>
                {/* <FormGroup>
                  <Label className='fw-bold' for="breakDetails">Break Details</Label>
                  <Input type="text" id="breakDetails" placeholder="Enter break details" />
                </FormGroup> */}
              </TabPane>
            </TabContent>
            <div className="modal-footer">
              <Button className='me-2' color="primary" type="submit">Save Changes</Button>
              <Button color="secondary" onClick={closeEditModal}>Cancel</Button>
            </div>
          </form>
        </ModalBody>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal isOpen={modal} toggle={closeDeleteModal} className="modal-dialog-centered">
        <ModalHeader toggle={closeDeleteModal}>Confirm Delete</ModalHeader>
        <ModalBody>
          <p>Are you sure you want to delete this session?</p>

          <p>This action will permanently delete the session along with all its associated subsessions. </p>
        </ModalBody>
        <ModalFooter>
          <Button color="danger" onClick={confirmDelete}>Delete</Button>
          <Button color="secondary" onClick={closeDeleteModal}>Cancel</Button>
        </ModalFooter>
      </Modal>

      <Modal isOpen={isDateModalOpen} toggle={toggleDateModal}>
        <ModalHeader toggle={toggleDateModal}>Select Start Date</ModalHeader>
        <ModalBody>
          <FormGroup>
            <DatePicker
              inline
              id="startDate"
              selected={EditSessionDate}
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

      {/* add subsesion  */}

      <Modal isOpen={subsessionModal} toggle={closesubsessionModal} className="modal-dialog-centered" backdrop="static" keyboard={false}>
        <ModalHeader toggle={closesubsessionModal}>
          Add Subsession
        </ModalHeader>
        <ModalBody className='pt-0'>
          <form onSubmit={handleFormSubmit}>
            <h3>{sessionname}</h3>
            <FormGroup>
              <Label className='fw-bold' for="eventTitle">SubSession Name *</Label>
              <Input
                type="text"
                id="eventTitle"
                name="title"
                onChange={handleFormChange}
                required
              />
            </FormGroup>


            <div className="row">
              <div className="col-md-5">
                <FormGroup>
                  <Label className='fw-bold' for="startTime">Start Time *</Label>
                  <Input
                    type="time"
                    id="startTime"
                    value={startTime}
                    onChange={(e) => handleTimeChangesubsession(e, true)}
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
                    onChange={(e) => handleTimeChangesubsession(e, false)}
                    required
                  >
                  </Input>
                </FormGroup>
              </div>
              {timeError && <div className="text-danger">{timeError}</div>}
            </div>
            <Nav tabs>
              <NavItem>
                <NavLink
                  className={classnames({ active: activeTabContent === 1 })}
                  onClick={() => toggleTab(1)}
                >
                  Session
                </NavLink>
              </NavItem>
              <NavItem>
                <NavLink
                  className={classnames({ active: activeTabContent === 2 })}
                  onClick={() => toggleTab(2)}
                >
                  Workshop
                </NavLink>
              </NavItem>
              <NavItem>
                <NavLink
                  className={classnames({ active: activeTabContent === 3 })}
                  onClick={() => toggleTab(3)}
                >
                  Break
                </NavLink>
              </NavItem>
            </Nav>
            <FormGroup>
              <Label className='fw-bold mt-3' for="eventDescription">Description(250 words)</Label>
              <Input
                type="textarea"
                id="eventDescription"
                name="description"
                onChange={handleFormChange}
                invalid={!!error1}
              />
              {error1 && <FormFeedback>{error1}</FormFeedback>}
            </FormGroup>
            <TabContent activeTab={activeTabContent}>
              <TabPane tabId={1}>
                {/* <FormGroup>
                  <Label className='fw-bold' for="facultySelect">Select Faculty</Label>
                  <Select
                    options={Faculties.map(faculty => ({ value: faculty.faculty_id, label: `${faculty.ntitle} ${faculty.fname} ${faculty.lname}` }))}
                    id="facultySelect"
                    value={selectedFaculty}
                    onChange={setSelectedFaculty}
                    placeholder="Select faculty"

                  />
                </FormGroup>
                <FormGroup>
                  <Label className='fw-bold' for="roleSelect">Select Role</Label>
                  <Select
                    options={Roles.map(role => ({ value: role.role_id, label: role.role_name }))}
                    id="roleSelect"
                    value={selectedRole}
                    onChange={setSelectedRole}
                    placeholder="Select role"
                  />
                </FormGroup>


                <Button color="primary" onClick={handleAddFacultyRole}>Add Faculty and Role</Button>
                <div>
                 <h4 className='mt-2'>Selected Faculty and Roles</h4>
                  {facultyRolePairs.length > 0 ? (
                    <ul>
                      {facultyRolePairs.map((pair, index) => (
                        <li key={index}>
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
                </div> */}
                <div>
                  <FormGroup>
                    <Label className='fw-bold' for="facultySelect">Select Faculty</Label>
                    <Select
                      options={Faculties.map(faculty => ({ value: faculty.faculty_id, label: `${faculty.ntitle} ${faculty.fname} ${faculty.lname}` }))}
                      id="facultySelect"
                      value={selectedFaculty}
                      onChange={setSelectedFaculty}
                      placeholder="Select faculty"
                    />
                  </FormGroup>
                  <FormGroup>
                    <Label className='fw-bold' for="roleSelect">Select Role</Label>
                    <Select
                      options={Roles.map(role => ({ value: role.role_id, label: role.role_name }))}
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
                    <h4 className='mt-2'>Selected Faculty and Roles</h4>
                    {facultyRolePairs.length > 0 ? (
                      <ul>
                        {facultyRolePairs.map((pair, index) => (
                          <li key={index} style={{
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
                </div>
              </TabPane>
              <TabPane tabId={2}>
                <div>
                  <FormGroup>
                    <Label className='fw-bold' for="facultySelect">Select Faculty</Label>
                    <Select
                      options={Faculties.map(faculty => ({ value: faculty.faculty_id, label: `${faculty.ntitle} ${faculty.fname} ${faculty.lname}` }))}
                      id="facultySelect"
                      value={selectedFaculty}
                      onChange={setSelectedFaculty}
                      placeholder="Select faculty"
                    />
                  </FormGroup>
                  <FormGroup>
                    <Label className='fw-bold' for="roleSelect">Select Role</Label>
                    <Select
                      options={Roles.map(role => ({ value: role.role_id, label: role.role_name }))}
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
                    <h4 className='mt-2'>Selected Faculty and Roles</h4>
                    {facultyRolePairs.length > 0 ? (
                      <ul>
                        {facultyRolePairs.map((pair, index) => (
                          <li key={index} style={{
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
                </div>
              </TabPane>
              <TabPane tabId={3}>
                {/* <FormGroup>
                  <Label className='fw-bold' for="breakDetails">Break Details</Label>
                  <Input type="text" id="breakDetails" placeholder="Enter break details" />
                </FormGroup> */}
              </TabPane>
            </TabContent>
            <div className="modal-footer">
              <Button className='me-2' color="primary" type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Saving...' : 'Save'}
              </Button>
              <Button color="secondary" onClick={closesubsessionModal}>Cancel</Button>
            </div>
          </form>
        </ModalBody>
      </Modal>

      {/* edit subsession modal */}
      <Modal isOpen={isModalOpen} toggle={closeModal} className="modal-dialog-centered" backdrop="static" keyboard={false}>
        {/* <h2>Edit Subsession</h2> */}
        <ModalHeader toggle={closeModal}>Edit Subsession</ModalHeader>
        <ModalBody className='pt-0'>
          <form onSubmit={submitEditSubsessionForm}>
            <FormGroup>
              <Label className='fw-bold' for="subsessionTitle">SubSession Name *</Label>
              <Input
                type="text"
                id="subsessionTitle"
                name="title"
                value={subsessionsfordata.title}
                onChange={handleFormChangeforsubsession}
                required
              />
            </FormGroup>

            <div className="row">
              <div className="col-md-5">
                <FormGroup>
                  <Label className='fw-bold' for="startTime">Start Time *</Label>
                  <Input
                    type="time"
                    id="startTime"
                    name="startTime"
                    value={startTime}
                    onChange={(e) => handleTimeChangesubsession(e, true)}
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
                    name="endTime"
                    value={endTime}
                    onChange={(e) => handleTimeChangesubsession(e, false)}
                    required
                  >



                  </Input>
                </FormGroup>
              </div>
              {timeError && <div className="text-danger">{timeError}</div>}

            </div>
            {/* Faculty and Role selection */}
            <Nav tabs>
              <NavItem>
                <NavLink
                  className={classnames({ active: activeTabContent === 1 })}
                  onClick={() => toggleTab(1)}
                >
                  Session
                </NavLink>
              </NavItem>
              <NavItem>
                <NavLink
                  className={classnames({ active: activeTabContent === 2 })}
                  onClick={() => toggleTab(2)}
                >
                  Workshop
                </NavLink>
              </NavItem>
              <NavItem>
                <NavLink
                  className={classnames({ active: activeTabContent === 3 })}
                  onClick={() => toggleTab(3)}
                >
                  Break
                </NavLink>
              </NavItem>
            </Nav>
            <FormGroup>
              <Label className='fw-bold mt-3' for="description">Description(250 words)</Label>
              <Input
                type="textarea"
                id="description"
                name="description"
                value={subsessionsfordata.description}
                onChange={handleFormChangeforsubsession}
                invalid={!!error1}
              />
              {error1 && <FormFeedback>{error1}</FormFeedback>}
            </FormGroup>


            <TabContent activeTab={activeTabContent}>
              <TabPane tabId={1}>
                {/* <FormGroup>
                  <Label className='fw-bold' for="facultySelect">Select Faculty</Label>
                  <Select
                    options={Faculties.map(faculty => ({ value: faculty.faculty_id, label: `${faculty.ntitle} ${faculty.fname} ${faculty.lname}` }))}
                    id="facultySelect"
                    value={selectedFaculty}
                    onChange={setSelectedFaculty}
                    placeholder="Select faculty"

                  />
                </FormGroup>
                <FormGroup>
                  <Label className='fw-bold' for="roleSelect">Select Role</Label>
                  <Select
                    options={Roles.map(role => ({ value: role.role_id, label: role.role_name }))}
                    id="roleSelect"
                    value={selectedRole}
                    onChange={setSelectedRole}
                    placeholder="Select role"
                  />
                </FormGroup>
                <Button color="primary" onClick={handleAddFacultyRole}>Add Faculty and Role</Button>
                <div>
                 <h4 className='mt-2'>Selected Faculty and Roles</h4>
                  {facultyRolePairs.length > 0 ? (
                    <ul>
                      {facultyRolePairs.map((pair, index) => (
                        <li key={index}>
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
                </div> */}
                <div>
                  <FormGroup>
                    <Label className='fw-bold' for="facultySelect">Select Faculty</Label>
                    <Select
                      options={Faculties.map(faculty => ({ value: faculty.faculty_id, label: `${faculty.ntitle} ${faculty.fname} ${faculty.lname}` }))}
                      id="facultySelect"
                      value={selectedFaculty}
                      onChange={setSelectedFaculty}
                      placeholder="Select faculty"
                    />
                  </FormGroup>
                  <FormGroup>
                    <Label className='fw-bold' for="roleSelect">Select Role</Label>
                    <Select
                      options={Roles.map(role => ({ value: role.role_id, label: role.role_name }))}
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
                    <h4 className='mt-2'>Selected Faculty and Roles</h4>
                    {facultyRolePairs.length > 0 ? (
                      <ul>
                        {facultyRolePairs.map((pair, index) => (
                          <li key={index} style={{
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
                </div>
              </TabPane>
              <TabPane tabId={2}>
                <div>
                  <FormGroup>
                    <Label className='fw-bold' for="facultySelect">Select Faculty</Label>
                    <Select
                      options={Faculties.map(faculty => ({ value: faculty.faculty_id, label: `${faculty.ntitle} ${faculty.fname} ${faculty.lname}` }))}
                      id="facultySelect"
                      value={selectedFaculty}
                      onChange={setSelectedFaculty}
                      placeholder="Select faculty"
                    />
                  </FormGroup>
                  <FormGroup>
                    <Label className='fw-bold' for="roleSelect">Select Role</Label>
                    <Select
                      options={Roles.map(role => ({ value: role.role_id, label: role.role_name }))}
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
                    <h4 className='mt-2'>Selected Faculty and Roles</h4>
                    {facultyRolePairs.length > 0 ? (
                      <ul>
                        {facultyRolePairs.map((pair, index) => (
                          <li key={index} style={{
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
                </div>
              </TabPane>
              <TabPane tabId={3}>
                {/* <FormGroup>
                  <Label className='fw-bold' for="breakDetails">Break Details</Label>
                  <Input type="text" id="breakDetails" placeholder="Enter break details" />
                </FormGroup> */}
              </TabPane>
            </TabContent>
            <div className="modal-footer">
              <Button color="primary" type="submit">Save Changes</Button>
              <Button color="secondary" onClick={closeModal}>Cancel</Button>
            </div>
          </form>
        </ModalBody>
      </Modal>

    </div>
  );

};





export default CustomEvent;
