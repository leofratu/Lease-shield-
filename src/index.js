import React from 'react';
import ReactDOM from 'react-dom/client';
// import './index.css'; // Uncomment if you have global styles
import App from './App';
import reportWebVitals from './reportWebVitals';
import { UserProfileProvider } from './context/UserProfileContext';
import { HelmetProvider } from 'react-helmet-async';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <HelmetProvider>
      <UserProfileProvider>
        <App />
      </UserProfileProvider>
    </HelmetProvider>
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals(); 