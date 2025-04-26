import React, { createContext, useState, useEffect, useContext } from 'react';
import { useAuthState } from '../hooks/useAuthState';
import { db } from '../firebase/config';
import { doc, onSnapshot, getDoc } from 'firebase/firestore';

const UserProfileContext = createContext();

export const UserProfileProvider = ({ children }) => {
  const { user } = useAuthState();
  const [profile, setProfile] = useState(null);
  const [loadingProfile, setLoadingProfile] = useState(true);

  useEffect(() => {
    let unsubscribe = () => {}; // Initialize unsubscribe function

    if (user) {
      setLoadingProfile(true);
      const userRef = doc(db, 'users', user.uid);

      // Use onSnapshot for real-time updates
      unsubscribe = onSnapshot(userRef, (docSnap) => {
        if (docSnap.exists()) {
          setProfile(docSnap.data());
        } else {
          // If profile doesn't exist yet, maybe try fetching once more
          // Or rely on the backend's get_or_create_user_profile
          console.log("User profile not found in Firestore (yet?).");
          setProfile(null); // Or a default state?
          // Attempt to fetch once explicitly if snapshot fails initially
          getDoc(userRef).then(snap => {
             if (snap.exists()) setProfile(snap.data());
             else setProfile({ subscriptionTier: 'free', freeScansUsed: 0 }); // Assume free default if not found
          }).catch(err => {
             console.error("Error fetching profile fallback:", err);
             setProfile({ subscriptionTier: 'free', freeScansUsed: 0 }); // Assume free default on error
          });
        }
        setLoadingProfile(false);
      }, (error) => {
        console.error("Error listening to user profile:", error);
        setProfile(null);
        setLoadingProfile(false);
      });

    } else {
      // User logged out
      setProfile(null);
      setLoadingProfile(false);
      unsubscribe(); // Ensure listener is cleaned up
    }

    // Cleanup listener on component unmount or user change
    return () => unsubscribe();
  }, [user]); // Re-run effect when user auth state changes

  return (
    <UserProfileContext.Provider value={{ profile, loadingProfile }}>
      {children}
    </UserProfileContext.Provider>
  );
};

export const useUserProfile = () => useContext(UserProfileContext); 