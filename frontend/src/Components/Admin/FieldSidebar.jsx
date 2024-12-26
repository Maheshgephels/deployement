import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Sidebar from 'react-sidebar';
import { BackendAPI } from '../../api';
import { getToken } from '../../Auth/Auth';
import useAuth from '../../Auth/protectedAuth';

const FieldSidebar = () => {
    useAuth();
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchFields();
    }, []);

    const fetchFields = async () => {
        try {
            const token = getToken(); 
            const response = await axios.get(`${BackendAPI}/field/getFields`, {
                headers: {
                    Authorization: `Bearer ${token}` // Include the token in the Authorization header
                }
            });
            setData(response.data);
            setLoading(false);
            console.log('Fields Available:', response.data); // Log the data received from the API
        } catch (error) {
            console.error('Error fetching facility types:', error);
            setLoading(false);
        }
    };

    return (
        <Sidebar
            sidebar={
                <div>
                    <h3>Field Labels</h3>
                    <ul>
                        {data.map(field => (
                            <li key={field.id}>{field.cs_field_label}</li>
                        ))}
                    </ul>
                </div>
            }
            docked={true} // Sidebar will be docked by default
            styles={{ sidebar: { background: 'white', width: '250px' } }} // Customize sidebar styles
        >
            {loading ? (
                <div>Loading...</div>
            ) : (
                <div />
            )}
        </Sidebar>
    );
};

export default FieldSidebar;
