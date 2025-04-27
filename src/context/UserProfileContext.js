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
    console.log("UserProfileContext: useEffect triggered.", { userId: user?.uid });
    let unsubscribe = () => {}; // Initialize unsubscribe function

    if (user) {
      console.log(`UserProfileContext: User found (UID: ${user.uid}), setting up profile listener.`);
      setLoadingProfile(true);
      const userRef = doc(db, 'users', user.uid);

      // Use onSnapshot for real-time updates
      unsubscribe = onSnapshot(userRef, (docSnap) => {
        if (docSnap.exists()) {
          const profileData = docSnap.data();
          console.log("UserProfileContext: Profile snapshot received (exists):", profileData);
          setProfile(profileData);
        } else {
          console.log("UserProfileContext: Profile snapshot received (does NOT exist). Attempting fallback getDoc.");
          // Attempt to fetch once explicitly if snapshot fails initially
          getDoc(userRef).then(snap => {
             if (snap.exists()) {
                 const profileData = snap.data();
                 console.log("UserProfileContext: Fallback getDoc successful:", profileData);
                 setProfile(profileData);
             } else {
                 console.log("UserProfileContext: Fallback getDoc also found no profile. Assuming default free tier.");
                 setProfile({ subscriptionTier: 'free', freeScansUsed: 0 }); // Assume free default if not found
             }
          }).catch(err => {
             console.error("UserProfileContext: Error during fallback getDoc:", err);
             setProfile({ subscriptionTier: 'free', freeScansUsed: 0 }); // Assume free default on error
          }).finally(() => {
            // Set loading false after fallback attempt completes
            console.log("UserProfileContext: Setting loadingProfile=false after fallback attempt.");
            setLoadingProfile(false);
          });
          // Don't set loading false here immediately, wait for the fallback
          return; // Exit early, loading state handled in finally block
        }
        // Set loading false if snapshot existed immediately
        console.log("UserProfileContext: Setting loadingProfile=false after initial snapshot success.");
        setLoadingProfile(false);
      }, (error) => {
        console.error("UserProfileContext: Error in onSnapshot listener:", error);
        setProfile(null);
        console.log("UserProfileContext: Setting loadingProfile=false after snapshot error.");
        setLoadingProfile(false);
      });

    } else {
      console.log("UserProfileContext: No user logged in. Resetting profile.");
      setProfile(null);
      setLoadingProfile(false);
      unsubscribe(); // Ensure listener is cleaned up
    }

    // Cleanup listener on component unmount or user change
    return () => {
        console.log("UserProfileContext: Cleaning up profile listener.");
        unsubscribe();
    }
  }, [user]); // Re-run effect when user auth state changes

  return (
    <UserProfileContext.Provider value={{ profile, loadingProfile }}>
      {children}
    </UserProfileContext.Provider>
  );
};

export const useUserProfile = () => useContext(UserProfileContext); 