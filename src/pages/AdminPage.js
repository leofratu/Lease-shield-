import React, { useState, useEffect } from 'react';
import { useAuthState } from '../hooks/useAuthState'; // Correct path to the hook
import { Navigate } from 'react-router-dom'; // For redirecting if not admin

// Placeholder for API functions - replace with actual implementation
const getAdminUsers = async (token) => { console.log('Fetching admin users...'); return []; };
const setAdminUserScans = async (token, userId, limit) => { console.log(`Setting scans for ${userId} to ${limit}`); return { success: true }; };
const createAdminCommercialUser = async (token, email, password, limit) => { console.log(`Creating commercial user ${email} with limit ${limit}`); return { success: true, userId: 'newUserId123' }; };

const AdminPage = () => {
    const { user, loading } = useAuthState();
    const [isAdmin, setIsAdmin] = useState(false);
    const [users, setUsers] = useState([]);
    const [isLoadingData, setIsLoadingData] = useState(true);
    const [error, setError] = useState('');

    // Effect to check admin status and fetch data
    useEffect(() => {
        if (!loading) {
            if (user && user.email === 'leofratu@gmail.com') {
                setIsAdmin(true);
                // Fetch admin data if user is admin
                const fetchData = async () => {
                    if (!user) {
                        setError('User not available to fetch token.');
                        setIsLoadingData(false);
                        return;
                    }
                    try {
                        const token = await user.getIdToken();
                        if (!token) throw new Error('Could not get auth token.');
                        
                        setError(''); // Clear previous errors
                        setIsLoadingData(true);
                        
                        // Fetch users (add more data fetching here as needed)
                        const fetchedUsers = await getAdminUsers(token); 
                        setUsers(fetchedUsers || []); // Handle null/undefined response
                        
                    } catch (err) {
                        console.error("Error fetching admin data:", err);
                        setError(`Failed to load admin data: ${err.message}`);
                        setUsers([]); // Clear users on error
                    } finally {
                        setIsLoadingData(false);
                    }
                };
                fetchData();
            } else {
                // User is loaded but not the admin
                setIsAdmin(false);
                setIsLoadingData(false); // No data to load
            }
        } else {
            // Still loading auth state, ensure data loading state reflects this
            setIsLoadingData(true);
        }
    }, [user, loading]);

    // --- Render Logic ---

    // Show loading state while checking auth OR loading initial admin data
    if (loading || (isAdmin && isLoadingData)) {
        return <div className="container mx-auto p-4 text-center">Loading...</div>;
    }

    // If user is loaded and is NOT the admin, show "Not Found" 
    // (Simulating a 404 as requested)
    if (!isAdmin) {
        // Option 1: Simple "Not Found" message
        return (
             <div className="container mx-auto p-4 text-center">
                 <h1 className="text-2xl font-bold text-red-600">Page Not Found</h1>
                 <p>The requested admin page does not exist or you do not have permission to view it.</p>
             </div>
        );
        // Option 2: Redirect to a dedicated 404 page if you have one
        // return <Navigate to="/404" replace />; 
    }

    // If user is admin, show the admin content
    return (
        <div className="container mx-auto p-4">
            <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>
            
            {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">{error}</div>}

            {isLoadingData ? (
                <p>Loading admin data...</p>
            ) : (
                <div>
                    {/* TODO: Add components for: */}
                    {/* 1. Displaying the 'users' list */}
                    {/* 2. Form to set scans for a user (calling setAdminUserScans) */}
                    {/* 3. Form to create a commercial user (calling createAdminCommercialUser) */}
                    <h2 className="text-2xl font-semibold mb-4">User Management</h2>
                    <p>Admin features will be added here.</p>
                    <pre className="bg-gray-100 p-2 rounded overflow-x-auto text-sm">
                        {JSON.stringify(users, null, 2)}
                    </pre>
                    {/* --- Placeholder Forms --- */}
                     <div className="mt-6 p-4 border rounded bg-gray-50">
                        <h3 className="text-xl font-semibold mb-3">Set User Scan Limit (Placeholder)</h3>
                        {/* Add form inputs for userId and scanLimit */}
                        <button className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded disabled:opacity-50" disabled>
                            Set Limit
                        </button>
                    </div>
                     <div className="mt-6 p-4 border rounded bg-gray-50">
                        <h3 className="text-xl font-semibold mb-3">Create Commercial User (Placeholder)</h3>
                         {/* Add form inputs for email, password, scanLimit */}
                        <button className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded disabled:opacity-50" disabled>
                            Create User
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminPage; 