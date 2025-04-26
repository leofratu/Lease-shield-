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

const AdminPage = () => {
    const { user, loading: authLoading } = useAuthState();
    const [isAdmin, setIsAdmin] = useState(false);
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

    // Function to fetch users - wrapped in useCallback
    const loadUsers = useCallback(async () => {
        if (!user) return;
        
        setIsLoadingUsers(true);
        setFetchError('');
        try {
            const token = await user.getIdToken();
            const fetchedUsers = await getAdminUsers(token);
            setUsers(fetchedUsers || []);
        } catch (err) {
            console.error("Error fetching admin users:", err);
            setFetchError(`Failed to load users: ${err.message}`);
            setUsers([]);
        } finally {
            setIsLoadingUsers(false);
        }
    }, [user]); // Re-create loadUsers only if user object changes

    // Effect to check admin status and fetch initial data
    useEffect(() => {
        if (!authLoading) {
            if (user && user.email === 'leofratu@gmail.com') {
                setIsAdmin(true);
                loadUsers(); // Load users when admin status is confirmed
            } else {
                setIsAdmin(false);
                setIsLoadingUsers(false); // No data to load if not admin
            }
        } else {
            setIsLoadingUsers(true); // Still loading auth state
        }
    }, [user, authLoading, loadUsers]); // Include loadUsers in dependency array

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
    
    // --- Render Logic ---
    if (authLoading) {
        return <div className="container mx-auto p-4 text-center">Loading Authentication...</div>;
    }

    if (!isAdmin) {
        return (
             <div className="container mx-auto p-4 text-center">
                 <h1 className="text-2xl font-bold text-red-600">Page Not Found</h1>
                 <p>The requested admin page does not exist or you do not have permission to view it.</p>
             </div>
        );
    }

    // Admin View
    return (
        <div className="container mx-auto p-4">
            <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>
            
            {fetchError && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">{fetchError}</div>}

            {/* --- User List Section --- */}    
            <div className="bg-white shadow-md rounded-lg p-6 mb-8">
                <h2 className="text-2xl font-semibold mb-4">User Management</h2>
                {isLoadingUsers ? (
                    <p>Loading users...</p>
                ) : users.length === 0 ? (
                    <p>No users found.</p>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User ID</th>
                                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tier</th>
                                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Scans Used</th>
                                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Max Scans</th>
                                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created At</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {users.map((u) => (
                                    <tr key={u.userId}>
                                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{u.email || 'N/A'}</td>
                                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 font-mono text-xs">{u.userId}</td>
                                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500"><span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${u.subscriptionTier === 'paid' ? 'bg-green-100 text-green-800' : u.subscriptionTier === 'commercial' ? 'bg-blue-100 text-blue-800' : 'bg-yellow-100 text-yellow-800'}`}>{u.subscriptionTier || 'N/A'}</span></td>
                                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">{u.freeScansUsed ?? 'N/A'}</td>
                                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">{u.maxAllowedScans ?? 'N/A'}</td>
                                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">{u.createdAt ? new Date(u.createdAt).toLocaleDateString() : 'N/A'}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            <div className="grid md:grid-cols-2 gap-8">
                {/* --- Set Scan Limit Form Section --- */} 
                <div className="bg-white shadow-md rounded-lg p-6">
                    <h3 className="text-xl font-semibold mb-4">Set User Scan Limit</h3>
                    <form onSubmit={handleSetScansSubmit}>
                        <div className="mb-4">
                            <label htmlFor="targetUserId" className="block text-sm font-medium text-gray-700 mb-1">Target User ID</label>
                            <input 
                                type="text" 
                                id="targetUserId" 
                                value={targetUserId}
                                onChange={(e) => setTargetUserId(e.target.value)}
                                placeholder="Enter User ID" 
                                required 
                                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                            />
                        </div>
                        <div className="mb-4">
                            <label htmlFor="scanLimit" className="block text-sm font-medium text-gray-700 mb-1">New Scan Limit</label>
                            <input 
                                type="number" 
                                id="scanLimit" 
                                value={scanLimit}
                                onChange={(e) => setScanLimit(e.target.value)}
                                placeholder="Enter non-negative integer" 
                                required 
                                min="0" 
                                step="1"
                                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                            />
                        </div>
                        <button 
                            type="submit" 
                            disabled={isSettingScans || !targetUserId || scanLimit === ''}
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isSettingScans ? 'Setting...' : 'Set Limit'}
                        </button>
                        {setScansMessage.text && (
                            <p className={`mt-3 text-sm ${setScansMessage.type === 'success' ? 'text-green-600' : 'text-red-600'}`}>
                                {setScansMessage.text}
                            </p>
                        )}
                    </form>
                </div>

                {/* --- Create Commercial User Form Section --- */} 
                <div className="bg-white shadow-md rounded-lg p-6">
                    <h3 className="text-xl font-semibold mb-4">Create Commercial User</h3>
                     <form onSubmit={handleCreateUserSubmit}>
                         <div className="mb-4">
                            <label htmlFor="newUserEmail" className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                            <input 
                                type="email" 
                                id="newUserEmail" 
                                value={newUserEmail}
                                onChange={(e) => setNewUserEmail(e.target.value)}
                                placeholder="user@example.com" 
                                required 
                                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                            />
                        </div>
                         <div className="mb-4">
                            <label htmlFor="newUserPassword" className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                            <input 
                                type="password" 
                                id="newUserPassword" 
                                value={newUserPassword}
                                onChange={(e) => setNewUserPassword(e.target.value)}
                                placeholder="Min. 6 characters" 
                                required 
                                minLength="6"
                                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                            />
                        </div>
                        <div className="mb-4">
                            <label htmlFor="newUserScanLimit" className="block text-sm font-medium text-gray-700 mb-1">Initial Scan Limit</label>
                            <input 
                                type="number" 
                                id="newUserScanLimit" 
                                value={newUserScanLimit}
                                onChange={(e) => setNewUserScanLimit(e.target.value)}
                                placeholder="Enter non-negative integer" 
                                required 
                                min="0" 
                                step="1"
                                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                            />
                        </div>
                        <button 
                            type="submit" 
                            disabled={isCreatingUser || !newUserEmail || !newUserPassword || newUserScanLimit === ''}
                            className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isCreatingUser ? 'Creating...' : 'Create User'}
                        </button>
                        {createUserMessage.text && (
                            <p className={`mt-3 text-sm ${createUserMessage.type === 'success' ? 'text-green-600' : 'text-red-600'}`}>
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