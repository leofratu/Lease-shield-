import React, { useState, useEffect, useCallback } from 'react';
import { useAuthState } from '../hooks/useAuthState'; // Correct path to the hook
import { Navigate } from 'react-router-dom'; // For redirecting if not admin

// --- API Helper Functions --- 
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8081';

const fetchAdminData = async (endpoint, token, options = {}) => {
    const response = await fetch(`${API_URL}${endpoint}`, {
        ...options,
        headers: {
            ...options.headers,
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
        },
    });
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: response.statusText }));
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    }
    return response.json();
};

const getAdminUsers = (token) => fetchAdminData('/api/admin/users', token);

const setAdminUserScans = (token, userId, limit) => {
    return fetchAdminData('/api/admin/set-scans', token, {
        method: 'POST',
        body: JSON.stringify({ targetUserId: userId, scanLimit: parseInt(limit, 10) }),
    });
};

const createAdminCommercialUser = (token, email, password, limit) => {
    return fetchAdminData('/api/admin/create-commercial', token, {
        method: 'POST',
        body: JSON.stringify({ email, password, scanLimit: parseInt(limit, 10) }),
    });
};
// --- End API Helpers ---

// List of admin emails
const ADMIN_EMAILS = ['leofratu@gmail.com'];

const AdminPage = () => {
    // Log when the component function body starts executing
    console.log("AdminPage component mounting..."); 

    const { user, loading: authLoading } = useAuthState();
    const [isAdmin, setIsAdmin] = useState(false);
    const [adminChecked, setAdminChecked] = useState(false);
    const [users, setUsers] = useState([]);
    const [isLoadingUsers, setIsLoadingUsers] = useState(true);
    const [fetchError, setFetchError] = useState('');

    // State for Set Scans Form
    const [targetUserId, setTargetUserId] = useState('');
    const [scanLimit, setScanLimit] = useState('');
    const [isSettingScans, setIsSettingScans] = useState(false);
    const [setScansMessage, setSetScansMessage] = useState({ type: '', text: '' });

    // State for Create User Form
    const [newUserEmail, setNewUserEmail] = useState('');
    const [newUserPassword, setNewUserPassword] = useState('');
    const [newUserScanLimit, setNewUserScanLimit] = useState('');
    const [isCreatingUser, setIsCreatingUser] = useState(false);
    const [createUserMessage, setCreateUserMessage] = useState({ type: '', text: '' });

    // State for Find User ID by Email
    const [findEmail, setFindEmail] = useState('');
    const [foundUserId, setFoundUserId] = useState('');
    const [findUserMessage, setFindUserMessage] = useState('');

    // Function to fetch users - wrapped in useCallback
    const loadUsers = useCallback(async () => {
        if (!user) {
            console.log("AdminPage: loadUsers called but user is null, returning.");
            return;
        }
        
        console.log("AdminPage: loadUsers starting...");
        setIsLoadingUsers(true);
        setFetchError('');
        try {
            const token = await user.getIdToken();
            console.log("AdminPage: loadUsers got token, fetching users...");
            const fetchedUsers = await getAdminUsers(token);
            console.log(`AdminPage: loadUsers received ${fetchedUsers?.length || 0} users.`);
            setUsers(fetchedUsers || []);
        } catch (err) {
            console.error("AdminPage: Error in loadUsers:", err);
            setFetchError(`Failed to load users: ${err.message}`);
            setUsers([]);
        } finally {
            console.log("AdminPage: loadUsers finished.");
            setIsLoadingUsers(false);
        }
    }, [user]); // Re-create loadUsers only if user object changes

    // Effect to check admin status and fetch initial data
    useEffect(() => {
        if (!authLoading) {
            // Log the user object to inspect its contents
            console.log('Auth state loaded. User object:', user);
            
            // Check if user exists and email matches any admin email (case-insensitive)
            const isAdminUser = user && ADMIN_EMAILS.some(email => 
                user.email?.toLowerCase() === email.toLowerCase()
            );
            
            console.log(`Checking admin status: User email is ${user?.email}, isAdminUser = ${isAdminUser}`);
            
            setIsAdmin(isAdminUser);
            setAdminChecked(true);
            
            if (isAdminUser) {
                loadUsers(); // Load users when admin status is confirmed
            } else {
                setIsLoadingUsers(false); // No data to load if not admin
            }
        } else {
            console.log('Auth state still loading...');
            setIsLoadingUsers(true); // Still loading auth state
        }
    }, [user, authLoading, loadUsers]);

    // --- Form Handlers ---
    const handleSetScansSubmit = async (e) => {
        e.preventDefault();
        if (!targetUserId || scanLimit === '' || !user) return;

        setIsSettingScans(true);
        setSetScansMessage({ type: '', text: '' });
        try {
            const token = await user.getIdToken();
            const result = await setAdminUserScans(token, targetUserId, scanLimit);
            setSetScansMessage({ type: 'success', text: result.message || 'Scan limit updated successfully!' });
            setTargetUserId('');
            setScanLimit('');
            loadUsers(); // Refresh user list
        } catch (err) {
            setSetScansMessage({ type: 'error', text: `Failed to set scans: ${err.message}` });
        } finally {
            setIsSettingScans(false);
        }
    };

    const handleCreateUserSubmit = async (e) => {
        e.preventDefault();
        if (!newUserEmail || !newUserPassword || newUserScanLimit === '' || !user) return;

        setIsCreatingUser(true);
        setCreateUserMessage({ type: '', text: '' });
        try {
            const token = await user.getIdToken();
            const result = await createAdminCommercialUser(token, newUserEmail, newUserPassword, newUserScanLimit);
            setCreateUserMessage({ type: 'success', text: `${result.message || 'User created successfully.'} (ID: ${result.userId})` });
            setNewUserEmail('');
            setNewUserPassword('');
            setNewUserScanLimit('');
            loadUsers(); // Refresh user list
        } catch (err) {
            setCreateUserMessage({ type: 'error', text: `Failed to create user: ${err.message}` });
        } finally {
            setIsCreatingUser(false);
        }
    };

    // --- Find User ID Handler ---
    const handleFindUserByEmail = (e) => {
        e.preventDefault();
        setFoundUserId(''); // Clear previous result
        setFindUserMessage('');
        if (!findEmail) {
            setFindUserMessage('Please enter an email address.');
            return;
        }
        const found = users.find(u => u.email?.toLowerCase() === findEmail.toLowerCase());
        if (found) {
            setFoundUserId(found.userId);
            setFindUserMessage('User found.');
        } else {
            setFindUserMessage('User not found with that email.');
        }
    };
    
    const handleCopyToClipboard = (text) => {
        navigator.clipboard.writeText(text).then(() => {
            setFindUserMessage('User ID copied to clipboard!');
        }).catch(err => {
            console.error('Failed to copy text: ', err);
            setFindUserMessage('Failed to copy User ID.');
        });
    };

    const handleUseUserId = (userId) => {
        setTargetUserId(userId); // Set the User ID in the other form
        setFindUserMessage('User ID populated in \'Set Scan Limit\' form.');
    };
    
    // --- Render Logic ---
    if (authLoading) {
        return <div className="flex justify-center items-center min-h-screen"><p>Loading Authentication...</p></div>;
    }
    
    // Wait until admin check is complete before rendering
    if (!adminChecked) {
        return <div className="flex justify-center items-center min-h-screen"><p>Checking permissions...</p></div>;
    }

    // Unauthorized message for non-admin users
    if (!isAdmin) {
        return (
             <div className="container mx-auto p-6 text-center">
                 <h1 className="text-2xl font-bold text-red-600">Admin Access Required</h1>
                 <p className="text-gray-600 mt-2">You do not have permission to access this page. Please contact an administrator if you believe this is an error.</p>
             </div>
        );
    }

    // --- Input Base Styles --- (Centralized for consistency)
    const inputBaseStyle = "w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition duration-150 ease-in-out";
    const buttonBaseStyle = "w-full font-bold py-2 px-4 rounded-md disabled:opacity-50 disabled:cursor-not-allowed transition duration-150 ease-in-out";
    const cardBaseStyle = "bg-white shadow-lg rounded-lg p-6 border border-gray-200"; // Added subtle border

    // Admin View
    return (
        <div className="container mx-auto p-6 space-y-8">
            <h1 className="text-3xl font-bold text-gray-800">Admin Dashboard</h1>
            
            {fetchError && (
                <div className="bg-red-50 border border-red-400 text-red-700 px-4 py-3 rounded-lg relative mb-4" role="alert">
                    <strong className="font-bold">Error: </strong>
                    <span className="block sm:inline">{fetchError}</span>
                </div>
            )}

            {/* --- User List Section --- */}    
            <div className={cardBaseStyle}>
                <h2 className="text-2xl font-semibold mb-4 text-gray-700">User Management</h2>
                {isLoadingUsers ? (
                    <p className="text-gray-600">Loading users...</p>
                ) : users.length === 0 ? (
                    <p className="text-gray-600">No users found.</p>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th scope="col" className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Email</th>
                                    <th scope="col" className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">User ID</th>
                                    <th scope="col" className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Tier</th>
                                    <th scope="col" className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Scans Used</th>
                                    <th scope="col" className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Max Scans</th>
                                    <th scope="col" className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Created At</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {users.map((u) => (
                                    <tr key={u.userId} className="hover:bg-gray-50 transition duration-150 ease-in-out">
                                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-800">{u.email || 'N/A'}</td>
                                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 font-mono text-xs">{u.userId}</td>
                                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500"><span className={`px-2.5 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full ${u.subscriptionTier === 'paid' ? 'bg-green-100 text-green-800' : u.subscriptionTier === 'commercial' ? 'bg-blue-100 text-blue-800' : 'bg-yellow-100 text-yellow-800'}`}>{u.subscriptionTier || 'N/A'}</span></td>
                                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 text-center">{u.freeScansUsed ?? '-'}</td>
                                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 text-center">{u.maxAllowedScans ?? '-'}</td>
                                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">{u.createdAt ? new Date(u.createdAt).toLocaleDateString() : 'N/A'}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* --- Action Forms Grid --- */}    
            <div className="grid md:grid-cols-3 gap-6">
                
                 {/* --- Find User ID Section --- */} 
                <div className={cardBaseStyle}>
                    <h3 className="text-xl font-semibold mb-4 text-gray-700">Find User ID</h3>
                    <form onSubmit={handleFindUserByEmail} className="space-y-4">
                        <div>
                            <label htmlFor="findEmail" className="block text-sm font-medium text-gray-700 mb-1">User Email</label>
                            <input 
                                type="email" 
                                id="findEmail" 
                                value={findEmail}
                                onChange={(e) => setFindEmail(e.target.value)}
                                placeholder="Enter user's email" 
                                required 
                                className={inputBaseStyle}
                            />
                        </div>
                         <button 
                            type="submit" 
                            disabled={isLoadingUsers || !findEmail}
                            className={`${buttonBaseStyle} bg-indigo-600 hover:bg-indigo-700 text-white`}
                        >
                            Find User ID
                        </button>
                        {findUserMessage && (
                            <p className={`text-sm ${foundUserId ? 'text-green-600' : 'text-red-600'}`}>
                                {findUserMessage}
                            </p>
                        )}
                        {foundUserId && (
                            <div className="mt-2 p-3 bg-gray-50 rounded-md border border-gray-200 space-y-2">
                                <div>
                                    <p className="text-sm text-gray-800 font-medium">User ID Found:</p>
                                    <p className="text-xs text-gray-600 font-mono break-all">{foundUserId}</p>
                                </div>
                                <div className="flex space-x-2">
                                    <button 
                                        onClick={() => handleCopyToClipboard(foundUserId)}
                                        type="button" 
                                        className="text-xs bg-gray-500 hover:bg-gray-600 text-white font-semibold py-1 px-2 rounded-md transition duration-150 ease-in-out"
                                    >
                                        Copy
                                    </button>
                                    <button 
                                        onClick={() => handleUseUserId(foundUserId)}
                                        type="button" 
                                        className="text-xs bg-blue-500 hover:bg-blue-600 text-white font-semibold py-1 px-2 rounded-md transition duration-150 ease-in-out"
                                    >
                                        Use ID
                                    </button>
                                </div>
                            </div>
                        )}
                    </form>
                </div>

                {/* --- Set Scan Limit Form Section --- */} 
                <div className={cardBaseStyle}>
                    <h3 className="text-xl font-semibold mb-4 text-gray-700">Set User Scan Limit</h3>
                    <form onSubmit={handleSetScansSubmit} className="space-y-4">
                        <div>
                            <label htmlFor="targetUserId" className="block text-sm font-medium text-gray-700 mb-1">Target User ID</label>
                            <input 
                                type="text" 
                                id="targetUserId" 
                                value={targetUserId}
                                onChange={(e) => setTargetUserId(e.target.value)}
                                placeholder="Enter User ID or find by email" 
                                required 
                                className={inputBaseStyle}
                            />
                        </div>
                        <div>
                            <label htmlFor="scanLimit" className="block text-sm font-medium text-gray-700 mb-1">New Scan Limit</label>
                            <input 
                                type="number" 
                                id="scanLimit" 
                                value={scanLimit}
                                onChange={(e) => setScanLimit(e.target.value)}
                                placeholder="e.g., 100" 
                                required 
                                min="0" 
                                step="1"
                                className={inputBaseStyle}
                            />
                        </div>
                        <button 
                            type="submit" 
                            disabled={isSettingScans || !targetUserId || scanLimit === ''}
                            className={`${buttonBaseStyle} bg-blue-600 hover:bg-blue-700 text-white`}
                        >
                            {isSettingScans ? 'Setting...' : 'Set Limit'}
                        </button>
                        {setScansMessage.text && (
                            <p className={`text-sm ${setScansMessage.type === 'success' ? 'text-green-600' : 'text-red-600'}`}>
                                {setScansMessage.text}
                            </p>
                        )}
                    </form>
                </div>

                {/* --- Create Commercial User Form Section --- */} 
                <div className={cardBaseStyle}>
                    <h3 className="text-xl font-semibold mb-4 text-gray-700">Create Commercial User</h3>
                     <form onSubmit={handleCreateUserSubmit} className="space-y-4">
                         <div>
                            <label htmlFor="newUserEmail" className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                            <input 
                                type="email" 
                                id="newUserEmail" 
                                value={newUserEmail}
                                onChange={(e) => setNewUserEmail(e.target.value)}
                                placeholder="user@example.com" 
                                required 
                                className={inputBaseStyle}
                            />
                        </div>
                         <div>
                            <label htmlFor="newUserPassword" className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                            <input 
                                type="password" 
                                id="newUserPassword" 
                                value={newUserPassword}
                                onChange={(e) => setNewUserPassword(e.target.value)}
                                placeholder="Min. 6 characters" 
                                required 
                                minLength="6"
                                className={inputBaseStyle}
                            />
                        </div>
                        <div>
                            <label htmlFor="newUserScanLimit" className="block text-sm font-medium text-gray-700 mb-1">Initial Scan Limit</label>
                            <input 
                                type="number" 
                                id="newUserScanLimit" 
                                value={newUserScanLimit}
                                onChange={(e) => setNewUserScanLimit(e.target.value)}
                                placeholder="e.g., 50" 
                                required 
                                min="0" 
                                step="1"
                                className={inputBaseStyle}
                            />
                        </div>
                        <button 
                            type="submit" 
                            disabled={isCreatingUser || !newUserEmail || !newUserPassword || newUserScanLimit === ''}
                            className={`${buttonBaseStyle} bg-green-600 hover:bg-green-700 text-white`}
                        >
                            {isCreatingUser ? 'Creating...' : 'Create User'}
                        </button>
                        {createUserMessage.text && (
                            <p className={`text-sm ${createUserMessage.type === 'success' ? 'text-green-600' : 'text-red-600'}`}>
                                {createUserMessage.text}
                            </p>
                        )}
                    </form>
                </div>
            </div>
        </div>
    );
};

export default AdminPage; 