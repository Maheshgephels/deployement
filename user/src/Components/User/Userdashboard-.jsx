import React from 'react';
import useAuth from '../../Auth/protectedAuth';
const UserDashboard = () => {
    useAuth(); // Assuming useAuth is a custom hook for authentication

    return (
        <div>
            <h1>User Dashboard</h1>
            {/* Add your dashboard content here */}
        </div>
    );
};

export default UserDashboard;
