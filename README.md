# Lease Shield AI

An intelligent lease analysis application powered by Google's Gemini AI that helps tenants understand their lease agreements.

## Features

- **Secure Authentication**: User account management via Firebase Authentication
- **PDF Upload & Processing**: Secure PDF upload to Firebase Storage
- **AI-Powered Analysis**: Automated lease analysis using Google Gemini AI
- **Interactive Dashboard**: View extracted lease terms, clause summaries, and risk analysis
- **Secure Data Storage**: All user data and analysis results stored securely in Firebase Firestore

## Tech Stack

### Frontend
- React (with Material UI)
- Firebase SDK (Authentication, Firestore, Storage)

### Backend
- Python with Flask/FastAPI
- Firebase Admin SDK
- Google Generative AI SDK
- PyMuPDF for PDF text extraction

## Setup Instructions

### Prerequisites
- Node.js and npm
- Python 3.8+
- Firebase account and project
- Google AI Studio API key (for Gemini)

### Frontend Setup
1. Install dependencies:
   ```
   npm install
   ```

2. Create a `.env` file in the root directory with your Firebase configuration:
   ```
   REACT_APP_FIREBASE_API_KEY=your_firebase_api_key
   ```

3. Start the development server:
   ```
   npm start
   ```

### Backend Setup
1. Navigate to the backend directory:
   ```
   cd backend
   ```

2. Install Python dependencies:
   ```
   pip install -r requirements.txt
   ```

3. Create a Firebase Admin SDK service account key and save it as:
   ```
   lease-shield-ai-firebase-admin-sdk.json
   ```

4. Set environment variables:
   ```
   export GEMINI_API_KEY=your_gemini_api_key
   ```

5. Start the backend server:
   ```
   python app.py
   ```

## Deployment

### Frontend
Deploy to Firebase Hosting:
```
npm run build
firebase deploy --only hosting
```

### Backend
Deploy to Google Cloud Run:
```
gcloud builds submit --tag gcr.io/lease-shield-ai/backend
gcloud run deploy --image gcr.io/lease-shield-ai/backend --platform managed
```

## Security Considerations
- API keys are stored securely as environment variables
- Firebase security rules restrict access to user-specific data
- PDFs are stored securely in Firebase Storage
- Authentication required for all API endpoints