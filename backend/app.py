import os
import json
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import google.generativeai as genai
import firebase_admin
from firebase_admin import credentials, firestore, storage, auth
# from werkzeug.utils import secure_filename # No longer needed for saving temp files if done carefully
import PyPDF2
import io # Needed for reading file stream
from dotenv import load_dotenv # Import dotenv
import requests # For Maxelpay API call
import base64 # For Maxelpay encryption
from cryptography.hazmat.primitives.ciphers import Cipher, algorithms, modes # For Maxelpay encryption
from cryptography.hazmat.backends import default_backend # For Maxelpay encryption
import time # For timestamp
import uuid # For unique order ID
# Import the specific exception for permission errors
from google.api_core.exceptions import PermissionDenied, GoogleAPIError 
import datetime # Needed for daily scan logic
# Add imports for file handling if needed (os is already imported)
from PIL import Image # Potentially needed for image processing/validation
import mimetypes # To determine image MIME type
ALLOWED_IMAGE_EXTENSIONS = {'png', 'jpg', 'jpeg', 'webp', 'heic', 'heif'}
ALLOWED_FINANCE_EXTENSIONS = {'pdf', 'png', 'jpg', 'jpeg'}

# Placeholder for the actual PayID19 library - replace if needed
try:
    import payid19_python_sdk as payid19 
except ImportError:
    print("WARNING: PayID19 SDK placeholder not found. Payment endpoint will fail.")
    payid19 = None # Define it as None so the app doesn't crash

load_dotenv() # Load environment variables from .env file

# --- Load Gemini API Keys --- 
# Load all potential keys, filtering out any that aren't set
gemini_api_keys = [
    key for key in [
        os.environ.get('GEMINI_API_KEY_1'), 
        os.environ.get('GEMINI_API_KEY_2'), 
        os.environ.get('GEMINI_API_KEY_3'),
        # Keep the original name as a fallback for backward compatibility or single-key use
        os.environ.get('GEMINI_API_KEY') 
    ] if key
]

if not gemini_api_keys:
    print("CRITICAL ERROR: No Gemini API keys found in environment variables (GEMINI_API_KEY_1, _2, _3, or GEMINI_API_KEY).")
    # Depending on policy, you might exit or let it fail later.

# --- Flask App and Firebase Initialization --- 
app = Flask(__name__)

# Configure CORS explicitly
CORS(app, origins=[
    "https://lease-shield-frontend.onrender.com", # Your deployed frontend
    "http://localhost:3000" # For local development
], supports_credentials=True)

# --- Initialize Firebase Admin SDK (Handles Local and Deployed) ---
db = None # Initialize db to None
try:
    firebase_sdk_json_str = os.environ.get('FIREBASE_ADMIN_SDK_JSON_CONTENT')
    
    if firebase_sdk_json_str:
        # Deployed on Render (or env var set manually using JSON content)
        print("Using Firebase key from environment variable.")
        firebase_sdk_config = json.loads(firebase_sdk_json_str)
        cred = credentials.Certificate(firebase_sdk_config)
        project_id = firebase_sdk_config.get('project_id')
    else:
        # Running Locally - Check for Render Secret File path OR local path
        render_secret_path = '/etc/secrets/firebase_key.json'
        local_key_path = 'lease-shield-ai-firebase-admin-sdk.json' # Assuming file is in same dir as app.py

        if os.path.exists(render_secret_path):
             print(f"Using Firebase key from Render secret file: {render_secret_path}")
             cred = credentials.Certificate(render_secret_path)
             # We need project_id for storage bucket, get it from creds
             # Note: This requires the service account to have roles/iam.serviceAccountViewer or similar
             # If this fails, you might need to parse the JSON file manually here too
             try:
                 project_id = cred.project_id 
             except Exception as cred_err:
                  print(f"Warning: Could not get project_id from credential object: {cred_err}")
                  # Attempt to parse the file to get project_id as fallback
                  try:
                       with open(render_secret_path, 'r') as f:
                           key_data = json.load(f)
                       project_id = key_data.get('project_id')
                  except Exception as parse_err:
                       print(f"Error parsing secret file for project_id: {parse_err}")
                       project_id = None 
        elif os.path.exists(local_key_path):
            print(f"Using Firebase key from local file: {local_key_path}")
            cred = credentials.Certificate(local_key_path)
            # Attempt to parse the file to get project_id
            try:
                 with open(local_key_path, 'r') as f:
                     key_data = json.load(f)
                 project_id = key_data.get('project_id')
            except Exception as parse_err:
                 print(f"Error parsing local key file for project_id: {parse_err}")
                 project_id = None 
        else:
            raise FileNotFoundError(f"Firebase key file not found at {render_secret_path} or {local_key_path}")

        if not project_id:
            raise ValueError("Could not determine Firebase project ID from credentials.")
        
        firebase_admin.initialize_app(cred, {
            'storageBucket': project_id + '.appspot.com'
        })
        print("Firebase Admin SDK initialized successfully.")
        db = firestore.client() # Assign db client ONLY on success

except FileNotFoundError as e:
    print(f"CRITICAL ERROR: Firebase Admin SDK JSON key file not found. {e}")
    db = None # Ensure db is None if init fails
except ValueError as e:
    print(f"CRITICAL ERROR: Invalid Firebase Admin SDK JSON content or missing project_id. {e}")
    db = None # Ensure db is None if init fails
except Exception as e:
    print(f"CRITICAL ERROR: Failed to initialize Firebase Admin SDK: {e}")
    db = None # Ensure db is None if init fails

# Only proceed if db was initialized
if db is None:
    print("Aborting application startup due to Firebase initialization failure.")
    # Optional: exit the application if Firebase is absolutely required
    # sys.exit(1) 

# --- Remove global Gemini Init --- 
# genai.configure(api_key=os.environ.get('GEMINI_API_KEY')) # REMOVED
# model = genai.GenerativeModel('gemini-1.5-flash') # REMOVED

# Max characters for pasted text analysis
MAX_TEXT_LENGTH = 50000 # Approx 10-15 pages

# Verify Firebase Auth token
def verify_token(id_token):
    try:
        decoded_token = firebase_admin.auth.verify_id_token(id_token)
        return decoded_token['uid']
    except Exception as e:
        print(f"Token verification error: {e}")
        return None

# Check if user ID belongs to the designated admin email
def is_admin(user_id):
    if not user_id:
        return False
    try:
        user = firebase_admin.auth.get_user(user_id)
        return user.email == 'leofratu@gmail.com'
    except Exception as e:
        print(f"Error checking admin status for {user_id}: {e}")
        return False

# Modified to accept a file stream/object instead of path
def extract_pdf_text(file_stream):
    text = ""
    try:
        reader = PyPDF2.PdfReader(file_stream)
        for page_num in range(len(reader.pages)):
            page = reader.pages[page_num]
            text += page.extract_text() + "\\n"
        return text
    except Exception as e:
        print(f"PDF extraction error: {e}")
        return None

# Analyze lease with Gemini
def analyze_lease(text):
    # Refined prompt for stricter JSON output and specific keys
    prompt = f"""
    Analyze the following lease document. Extract the specified information and format the output ONLY as a single JSON object. 
    Do not include any text before or after the JSON object (e.g., no ```json markdown).
    The JSON object must have the following top-level keys: 'extracted_data', 'clause_summaries', 'risks', and 'score'.
    
    1.  **extracted_data**: An object containing these exact keys. If a value cannot be found, use the string "Not Found".
        -   `Landlord_Name`: Full name of the landlord/lessor.
        -   `Tenant_Name`: Full name of the tenant/lessee.
        -   `Property_Address`: Full address of the leased property.
        -   `Lease_Start_Date`: The exact start date of the lease term.
        -   `Lease_End_Date`: The exact end date of the lease term.
        -   `Monthly_Rent_Amount`: The numerical value of the monthly rent (e.g., "$1500" or "1500").
        -   `Rent_Due_Date`: The day or date rent is due each month (e.g., "1st of the month", "5th").
        -   `Security_Deposit_Amount`: The numerical value of the security deposit.
        -   `Lease_Term`: The lease term in months (e.g., "12").

    2.  **clause_summaries**: An object summarizing the following clauses. Use the exact key names provided. If a clause is not present, omit the key or use "Not Found".
        -   `Termination_Clause`: Summary of how the lease can be terminated by either party.
        -   `Pet_Policy`: Summary of rules regarding pets.
        -   `Subletting_Policy`: Summary of rules regarding subletting.
        -   `Maintenance_Responsibilities`: Summary of who is responsible for repairs/maintenance (landlord/tenant).
        -   `Late_Fee_Policy`: Summary of penalties for late rent payments.
        -   `Renewal_Options`: Summary of options or procedures for lease renewal.

    3.  **risks**: An array of strings, where each string describes an unusual or potentially unfavorable clause for the tenant. If no risks are found, return an empty array [].
    
    4.  **score**: An integer score from 0 (very unfavorable for tenant) to 100 (very favorable for tenant), based on the number and severity of unfavorable clauses identified in 'risks'.
    
    Lease Document Text:
    --- START --- 
    {text}
    --- END --- 
    
    Output ONLY the JSON object.
    """
    
    last_error = None # Store the last error encountered

    # Iterate through the available API keys
    for i, api_key in enumerate(gemini_api_keys):
        print(f"Attempting Gemini analysis with API key #{i+1}")
        try:
            # Configure GenAI with the current key for this attempt
            genai.configure(api_key=api_key)
            # Initialize the model (consider model name from env var if needed)
            model = genai.GenerativeModel('gemini-1.5-flash') 
            
            response = model.generate_content(prompt)
            
            # Attempt to clean and parse the response
            cleaned_text = response.text.strip().lstrip('```json').rstrip('```').strip()
            print(f"Gemini analysis successful with API key #{i+1}")
            return cleaned_text # Success!
            
        except PermissionDenied as e:
            # Check if it's specifically an invalid API key error
            # The error message might vary, adjust string check if needed
            if "API key not valid" in str(e) or "invalid" in str(e).lower():
                print(f"Warning: Gemini API key #{i+1} failed (Invalid Key): {e}")
                last_error = e # Store the error
                continue # Try the next key
            else:
                # Different permission error (e.g., API not enabled for project)
                print(f"Gemini API Permission Error (key #{i+1}): {e}")
                last_error = e
                break # Don't retry with other keys for non-key-related permission issues
                
        except GoogleAPIError as e: # Catch other Google API errors
            print(f"Gemini API Error (key #{i+1}): {e}")
            last_error = e
            # Decide whether to retry on other errors (e.g., rate limits?) 
            # For now, let's stop on most API errors other than invalid key.
            break 
            
        except Exception as e:
            # Catch any other unexpected errors during configuration or generation
            print(f"Unexpected Error during Gemini analysis (key #{i+1}): {e}")
            last_error = e
            break # Stop on unexpected errors

    # If the loop finished without returning, all keys failed
    print(f"Gemini analysis failed after trying {len(gemini_api_keys)} key(s).")
    if last_error:
        print(f"Last error encountered: {last_error}")
    # You could potentially return the last_error object or a specific message
    return None

# --- Maxelpay Encryption Helper --- 
def maxelpay_encryption(secret_key, payload_data):
  """Encrypts payload data for Maxelpay API using AES CBC."""
  try:
    # Convert to bytes
    iv = secret_key[:16].encode("utf-8")
    secret_key_bytes = secret_key.encode("utf-8")  
    
    # Pad data to match the block size (AES block size is 128 bits / 16 bytes, but example used 256? Let's stick to AES standard 16)
    # The example padding seemed incorrect for AES-256 CBC. Using standard PKCS7 padding is more robust, 
    # but requests library often handles content-type correctly without manual padding if data is JSON.
    # Let's follow the provided example's explicit padding for now, but use 16-byte blocks.
    block_size_bytes = 16 # AES block size
    payload_json_bytes = json.dumps(payload_data).encode("utf-8")
    padding_length = block_size_bytes - (len(payload_json_bytes) % block_size_bytes)
    padded_data = payload_json_bytes + bytes([padding_length]) * padding_length # PKCS7 padding

    # Original example padding (might be specific to Maxelpay? Keep if PKCS7 fails)
    # block_size_manual = 256 
    # padded_data = json.dumps(payload_data).encode("utf-8")
    # padded_data += b' ' * (block_size_manual - len(padded_data) % block_size_manual)

    backend = default_backend()
    # Ensure secret key length is suitable for AES-256 (32 bytes)
    if len(secret_key_bytes) != 32:
        print(f"Warning: Maxelpay Secret Key length is {len(secret_key_bytes)} bytes, expected 32 for AES-256. Check documentation.")
        # Handle error or potentially pad/truncate key if required by Maxelpay (less secure)
        # For now, we'll let Cipher raise an error if length is wrong.

    cipher = Cipher(algorithms.AES(secret_key_bytes), modes.CBC(iv), backend=backend) 
    encryptor = cipher.encryptor()
    encrypted_data = encryptor.update(padded_data) + encryptor.finalize() 
    result = base64.b64encode(encrypted_data).decode("utf-8")
    return result
  except Exception as e:
      print(f"Maxelpay encryption error: {e}")
      raise # Re-raise the exception to be caught in the route

# --- End Maxelpay Encryption Helper ---

# --- Firestore User Helpers --- 

def get_or_create_user_profile(user_id):
    """Gets user profile from Firestore, creates default free tier if not found."""
    user_ref = db.collection('users').document(user_id)
    user_doc = user_ref.get()
    if user_doc.exists:
        # Ensure existing profiles have new fields (handle potential missing fields)
        profile_data = user_doc.to_dict()
        if 'dailyScansUsed' not in profile_data:
            profile_data['dailyScansUsed'] = 0
        if 'lastScanDate' not in profile_data:
            profile_data['lastScanDate'] = None # Or a default past date string like '1970-01-01'
        return profile_data
    else:
        print(f"Creating default free profile for user: {user_id}")
        default_profile = {
            'userId': user_id, 
            'subscriptionTier': 'free',
            'freeScansUsed': 0,
            'maxAllowedScans': 3, # Default for free tier
            'dailyScansUsed': 0,
            'lastScanDate': None, # Initialize as None
            'createdAt': firestore.SERVER_TIMESTAMP
        }
        try:
            user_ref.set(default_profile)
            return default_profile
        except Exception as e:
             print(f"Error creating user profile for {user_id}: {e}")
             return None # Indicate failure

def increment_scan_counts(user_id, tier):
    """Atomically increments scan counts based on tier."""
    user_ref = db.collection('users').document(user_id)
    today_str = datetime.date.today().isoformat() # Get YYYY-MM-DD

    try:
        # Use a transaction to ensure atomicity if needed, but separate updates might be fine
        
        # Increment monthly count for limited tiers (free, commercial, premium)
        if tier in ['free', 'commercial', 'premium']:
            user_ref.update({'freeScansUsed': firestore.Increment(1)})
            print(f"Incremented monthly scan count for user {user_id} (tier: {tier})")

        # Handle daily count for premium tier
        if tier == 'premium':
            # Fetch current daily count and date first
            user_doc = user_ref.get()
            if user_doc.exists:
                profile_data = user_doc.to_dict()
                last_scan_date = profile_data.get('lastScanDate')
                daily_scans = profile_data.get('dailyScansUsed', 0)

                update_data = {}
                if last_scan_date == today_str:
                    # Same day, just increment
                    update_data['dailyScansUsed'] = firestore.Increment(1)
                    print(f"Incremented daily scan count for user {user_id} (tier: {tier})")
                else:
                    # New day, reset count to 1 and update date
                    update_data['dailyScansUsed'] = 1
                    update_data['lastScanDate'] = today_str
                    print(f"Reset daily scan count to 1 for user {user_id} (tier: {tier}) on new day {today_str}")
                
                user_ref.update(update_data)
            else:
                 print(f"Error: Could not find user {user_id} to update daily scan count.")
                 return False # Indicate failure if user doc missing

        return True
    except Exception as e:
        print(f"Error incrementing scan counts for {user_id} (tier: {tier}): {e}")
        return False

# --- End Firestore User Helpers --- 

# --- Ping Endpoint --- 
@app.route('/api/ping', methods=['GET'])
def ping():
    """Simple endpoint to keep the backend alive."""
    # No auth needed, just return success
    return jsonify({'status': 'pong'}), 200
# --- End Ping Endpoint ---

# --- Maxelpay Checkout Route ---
@app.route('/api/payid/create-checkout-session', methods=['POST']) # Keep route name consistent with frontend for now
def create_checkout_session():
    if db is None:
        print("Error: Firestore database client not initialized.")
        return jsonify({'error': 'Server configuration error: Database unavailable.'}), 500
    # --- Authorization --- 
    auth_header = request.headers.get('Authorization')
    if not auth_header or not auth_header.startswith('Bearer '):
        return jsonify({'error': 'Unauthorized'}), 401
    token = auth_header.split('Bearer ')[1]
    user_id = verify_token(token)
    if not user_id:
        return jsonify({'error': 'Invalid token'}), 401
    
    # Optionally get user email for payload
    user_email = "Not Provided" 
    user_name = "Lease Shield User"
    try:
        firebase_user = auth.get_user(user_id)
        user_email = firebase_user.email or user_email
        user_name = firebase_user.display_name or user_name
    except Exception as e:
        print(f"Could not fetch user details from Firebase: {e}")
    # --- End Authorization ---

    # --- Load API Keys and Config --- 
    api_key = os.environ.get('MAXELPAY_API_KEY')
    secret_key = os.environ.get('MAXELPAY_SECRET_KEY')
    environment = os.environ.get('MAXELPAY_ENVIRONMENT', 'stg') # Default to staging
    frontend_url = os.environ.get('FRONTEND_URL', 'http://localhost:3000') 

    if not api_key or not secret_key:
        print("ERROR: Maxelpay API keys not found in environment variables.")
        return jsonify({'error': 'Server configuration error: Payment keys missing.'}), 500

    # --- Construct API Endpoint ---
    endpoint = f"https://api.maxelpay.com/v1/{environment}/merchant/order/checkout"
    if environment == 'stg': # Adjust subdomain for staging if needed (common practice)
        endpoint = f"https://api.stg.maxelpay.com/v1/{environment}/merchant/order/checkout" # Guessing staging URL

    # --- Get Plan Details (Assume $5 Pro Plan for now) ---
    # In a real app, this might come from the request or a config file
    amount = "5.00" # Use string with decimals as per example
    currency = "USD" # Or get from request if supporting multiple
    plan_description = "Lease Shield AI Pro Monthly"
    site_name = "Lease Shield AI"
    website_url = frontend_url # Or your main domain

    # --- Prepare Payload --- 
    order_id = str(uuid.uuid4()) # Generate a unique order ID
    timestamp = str(int(time.time())) # Current Unix timestamp as string

    # Construct dynamic URLs
    # TODO: Create actual frontend routes for these
    redirect_url = f"{frontend_url}/payment/success?order_id={order_id}" 
    cancel_url = f"{frontend_url}/pricing?status=cancelled&order_id={order_id}"
    # TODO: Implement a webhook endpoint in this backend to receive status updates
    webhook_url = f"{request.url_root}api/maxelpay/webhook" # Assumes root URL + path

    payload_data = {
        "orderID": order_id,
        "amount": amount,
        "currency": currency,
        "timestamp": timestamp,
        "userName": user_name,
        "siteName": site_name,
        "userEmail": user_email,
        "redirectUrl": redirect_url,
        "websiteUrl": website_url,
        "cancelUrl": cancel_url,
        "webhookUrl": webhook_url
    }

    # --- Encrypt and Make API Call --- 
    try:
        encrypted_payload_data = maxelpay_encryption(secret_key, payload_data)
        
        api_payload = json.dumps({'data': encrypted_payload_data})
        
        headers = {
            "api-key": api_key,
            "Content-Type": "application/json"
        }

        print(f"Sending request to Maxelpay: {endpoint}") # Log endpoint
        # print(f"Payload (unencrypted): {payload_data}") # DEBUG - Don't log sensitive data in prod
        # print(f"Headers: {headers}") # DEBUG
        # print(f"Body (encrypted): {api_payload}") # DEBUG

        response = requests.request("POST", endpoint, headers=headers, data=api_payload, timeout=20) # Add timeout
        response.raise_for_status() # Raise an exception for bad status codes (4xx or 5xx)

        response_data = response.json()
        print(f"Maxelpay Response: {response_data}") # Log response

        # Extract the checkout URL - Updated to use 'result' key based on logs
        checkout_url = response_data.get('result') 

        if not checkout_url:
            print("ERROR: Maxelpay response did not contain the 'result' key with the checkout URL.") # Updated error message
            return jsonify({'error': 'Failed to get checkout URL from payment provider response.', 'provider_response': response_data}), 500
        
        # --- Store checkout session details for webhook correlation ---
        try:
            session_ref = db.collection('checkout_sessions').document(order_id)
            session_ref.set({
                'userId': user_id,
                'maxelpayOrderId': order_id, # Redundant but clear
                'status': 'pending', # Initial status
                'createdAt': firestore.SERVER_TIMESTAMP,
                'amount': amount,
                'currency': currency
            })
            print(f"Stored checkout session mapping for order {order_id} and user {user_id}")
        except Exception as db_error:
            # Log the error but proceed with returning the checkout URL to the user
            print(f"Firestore Error: Failed to store checkout session mapping for order {order_id}: {db_error}")
            # Depending on requirements, you might want to prevent checkout if this fails
            # For now, we let the user proceed to pay. Manual reconciliation might be needed if webhook fails.
        # --- End Store checkout session ---

        return jsonify({'checkoutUrl': checkout_url})

    except requests.exceptions.RequestException as req_err:
        print(f"Maxelpay API request failed: {req_err}")
        # Log response body if available
        error_body = None
        if req_err.response is not None:
            try: error_body = req_err.response.json() 
            except: error_body = req_err.response.text
        return jsonify({'error': f'Payment provider communication error: {str(req_err)}', 'details': error_body}), 502 # Bad Gateway
    except Exception as e:
        print(f"Error creating Maxelpay checkout session: {e}")
        return jsonify({'error': f'An internal error occurred during payment processing: {str(e)}'}), 500

# --- End Maxelpay Checkout Route ---

# --- Webhook Route (Placeholder) ---
@app.route('/api/maxelpay/webhook', methods=['POST'])
def maxelpay_webhook():
    if db is None:
        print("Webhook Error: Firestore database client not initialized.")
        # Still return 200 to Maxelpay if possible, but log the internal error
        return jsonify({'status': 'received (internal DB error)'}), 200 
    # 1. --- IMPORTANT: Verify Webhook Signature ---
    # Replace this with actual signature verification logic from Maxelpay docs!
    # This usually involves getting a signature from request headers,
    # reconstructing a signed message using the payload and your secret key,
    # and comparing the signatures. Failing this check MUST return an error (e.g., 403 Forbidden).
    # Example Placeholder:
    # received_signature = request.headers.get('Maxelpay-Signature') # Check correct header name
    # if not verify_maxelpay_signature(request.data, received_signature, os.environ.get('MAXELPAY_SECRET_KEY')):
    #     print("Webhook Error: Invalid signature")
    #     return jsonify({'error': 'Invalid signature'}), 403
    print("Webhook Info: Skipping signature verification (PLACEHOLDER - IMPLEMENT THIS!)")
    # --- End Signature Verification ---

    print("Received Maxelpay Webhook:")
    try:
        data = request.json
        print(json.dumps(data, indent=2))

        # 2. Extract Key Information
        order_id = data.get('orderID')
        status = data.get('status') # Verify actual status field name from Maxelpay docs
        # Potentially other useful fields: transactionId, amount, currency, etc.

        if not order_id or not status:
            print("Webhook Error: Missing orderID or status in payload")
            return jsonify({'error': 'Missing required fields'}), 400

        # 3. Update Checkout Session Status (Optional but good practice)
        try:
            session_ref = db.collection('checkout_sessions').document(order_id)
            session_ref.update({
                'status': status,
                'webhookReceivedAt': firestore.SERVER_TIMESTAMP,
                'webhookPayload': data # Store the raw payload for reference
            })
        except Exception as db_error:
             print(f"Webhook Info: Failed to update checkout_sessions doc for {order_id}: {db_error}")
             # Continue processing regardless

        # 4. Process Successful Payment
        # Verify the exact status string indicating success from Maxelpay docs (e.g., 'completed', 'paid', 'success')
        if status.upper() == 'COMPLETED': # Assuming 'COMPLETED' means success
            print(f"Processing successful payment for Order ID: {order_id}")

            # Find the user associated with this order
            checkout_doc = session_ref.get()
            if not checkout_doc.exists:
                 print(f"Webhook Error: Could not find checkout session for order {order_id}")
                 # Decide how to handle - maybe log for manual check?
                 return jsonify({'status': 'received (session not found)'}), 200 # Acknowledge receipt

            user_id = checkout_doc.to_dict().get('userId')
            if not user_id:
                print(f"Webhook Error: Missing userId in checkout session for order {order_id}")
                return jsonify({'status': 'received (user ID missing)'}), 200 # Acknowledge receipt

            # Update the user's profile in Firestore
            try:
                user_ref = db.collection('users').document(user_id)
                user_ref.update({
                    'subscriptionTier': 'paid',
                    'subscriptionStartDate': firestore.SERVER_TIMESTAMP, # Mark start date
                    'lastPaymentOrderId': order_id # Keep track of the last successful order
                    # Optionally clear free scans used:
                    # 'freeScansUsed': 0
                })
                print(f"Successfully updated user {user_id} subscription to 'paid' for order {order_id}")
            except Exception as user_update_error:
                print(f"Webhook Error: Failed to update user profile for user {user_id} (order {order_id}): {user_update_error}")
                # Log this error seriously - payment received but user not upgraded
                # Consider adding to a retry queue or manual alert system
                return jsonify({'error': 'Failed to update user profile'}), 500 # Internal Server Error

        elif status.upper() in ['FAILED', 'CANCELLED', 'EXPIRED']: # Handle other statuses if needed
            print(f"Payment status for Order ID {order_id}: {status}")
            # No user update needed, status already logged in checkout_sessions

        else:
            print(f"Webhook Info: Received unhandled status '{status}' for order {order_id}")


        return jsonify({'status': 'received'}), 200
    except Exception as e:
        print(f"Error processing Maxelpay webhook: {e}")
        return jsonify({'error': 'Failed to process webhook'}), 500
# --- End Webhook Route ---

@app.route('/api/analyze', methods=['POST'])
def analyze_document():
    if db is None:
        print("Error: Firestore database client not initialized.")
        return jsonify({'error': 'Server configuration error: Database unavailable.'}), 500
    # --- Authorization & Subscription Check --- 
    auth_header = request.headers.get('Authorization')
    if not auth_header or not auth_header.startswith('Bearer '):
        return jsonify({'error': 'Unauthorized'}), 401
    token = auth_header.split('Bearer ')[1]
    user_id = verify_token(token)
    if not user_id:
        return jsonify({'error': 'Invalid token'}), 401
    
    user_profile = get_or_create_user_profile(user_id)
    if not user_profile:
         return jsonify({'error': 'Could not retrieve or create user profile.'}), 500

    can_analyze = False
    should_increment = False # Unified flag
    tier = user_profile.get('subscriptionTier')
    
    # Get current scan counts
    monthly_scans_used = user_profile.get('freeScansUsed', 0)
    daily_scans_used = user_profile.get('dailyScansUsed', 0)
    last_scan_date = user_profile.get('lastScanDate')
    today_str = datetime.date.today().isoformat()

    # Check if daily count needs reset (for premium tier check)
    if tier == 'premium' and last_scan_date != today_str:
        current_daily_for_check = 0 # Treat as 0 for limit check if date is old
    else:
        current_daily_for_check = daily_scans_used

    # --- Tier Logic --- 
    if tier == 'pro': # New Pro tier
        can_analyze = True
        should_increment = False # Unlimited
        print(f"User {user_id} (Pro) - Access granted (Unlimited)")
    elif tier == 'paid': # Keep existing paid tier logic (assuming unlimited)
        can_analyze = True
        should_increment = False
        print(f"User {user_id} (Paid) - Access granted (Unlimited)")
    elif tier == 'premium': # New Premium tier
        max_monthly_scans = 50 # Defined limit
        max_daily_scans = 3 # Defined limit
        # Check monthly limit
        if monthly_scans_used < max_monthly_scans:
            # Check daily limit
            if current_daily_for_check < max_daily_scans:
                can_analyze = True
                should_increment = True # Increment both monthly and daily
                print(f"User {user_id} (Premium) - Access granted (Monthly: {monthly_scans_used}/{max_monthly_scans}, Daily: {current_daily_for_check}/{max_daily_scans})")
            else:
                print(f"User {user_id} (Premium) Daily scan limit reached ({current_daily_for_check}/{max_daily_scans})")
                return jsonify({'error': f'Daily analysis limit ({max_daily_scans}) reached for Premium plan.', 'limitReached': 'daily'}), 429 # Too Many Requests
        else:
             print(f"User {user_id} (Premium) Monthly scan limit reached ({monthly_scans_used}/{max_monthly_scans})")
             return jsonify({'error': f'Monthly analysis limit ({max_monthly_scans}) reached for Premium plan. Upgrade or wait until next cycle.', 'limitReached': 'monthly'}), 429 # Too Many Requests
    elif tier == 'commercial':
        max_scans = user_profile.get('maxAllowedScans', 0)
        if max_scans <= 0:
            print(f"User {user_id} (Commercial) has max scans set to {max_scans}. Denying access.")
            return jsonify({'error': 'Commercial plan has no scans allowed. Contact admin.', 'upgradeRequired': False}), 403
        if monthly_scans_used < max_scans:
            can_analyze = True
            should_increment = True # Increment monthly count
            print(f"User {user_id} (Commercial) - Access granted ({monthly_scans_used}/{max_scans})")
        else:
            print(f"User {user_id} (Commercial) scan limit reached ({monthly_scans_used}/{max_scans}).")
            return jsonify({'error': f'Commercial scan limit reached ({monthly_scans_used}/{max_scans} used). Contact admin for more.', 'limitReached': 'monthly'}), 429
    elif tier == 'free':
        free_limit = 3
        if monthly_scans_used < free_limit:
            can_analyze = True
            should_increment = True # Increment monthly count
            print(f"User {user_id} (Free) - Access granted ({monthly_scans_used}/{free_limit})")
        else:
             print(f"User {user_id} (Free) scan limit reached ({monthly_scans_used}/{free_limit}).")
             return jsonify({'error': 'Free analysis limit reached. Please upgrade.', 'upgradeRequired': True, 'limitReached': 'monthly'}), 429
    else:
        # Unknown subscription tier
        print(f"User {user_id} has unknown subscription tier: {tier}")
        return jsonify({'error': 'Invalid subscription status.'}), 403
        
    if not can_analyze:
         # Fallback denial
         print(f"User {user_id} (Tier: {tier}) - Access denied (Fallback check)")
         return jsonify({'error': 'Analysis not permitted with current subscription.'}), 403
    # --- End Authorization & Subscription Check ---

    text = None
    file_content_type = None
    original_filename = "Uploaded File" # Default name

    # Try getting file first
    if 'leaseFile' in request.files:
        file = request.files['leaseFile']
        original_filename = file.filename or original_filename
        file_content_type = file.content_type
        
        if file_content_type == 'application/pdf':
            # Read file stream into memory for PyPDF2
            file_stream = io.BytesIO(file.read())
            text = extract_pdf_text(file_stream)
            if text is None:
                 return jsonify({'error': 'Failed to extract text from PDF'}), 500
        elif file_content_type == 'text/plain':
            try:
                text = file.read().decode('utf-8')
            except Exception as e:
                print(f"Error reading text file: {e}")
                return jsonify({'error': 'Failed to read text file'}), 500
        else:
            return jsonify({'error': 'Unsupported file type. Please upload PDF or TXT.'}), 400

    # If no file, try getting text from JSON body
    elif request.is_json and 'text' in request.json:
        text = request.json['text']
        original_filename = "Pasted Text"
        # Add input validation for text length
        if len(text) > MAX_TEXT_LENGTH:
            print(f"Input text too long: {len(text)} characters")
            return jsonify({'error': f'Pasted text exceeds the maximum length of {MAX_TEXT_LENGTH} characters.'}), 413 # Payload Too Large
        if not text.strip(): # Check if text is just whitespace
             return jsonify({'error': 'Pasted text cannot be empty.'}), 400
    
    # If neither file nor text provided
    if text is None:
        return jsonify({'error': 'No file or text provided for analysis'}), 400

    # Analyze the extracted/provided text
    try:
        analysis_result_text = analyze_lease(text)
        if not analysis_result_text:
            return jsonify({'error': 'AI analysis failed. Please try again later.'}), 500
        
        # Parse the JSON response from Gemini
        try:
            # Gemini might return markdown ```json ... ```
            cleaned_text = analysis_result_text.strip().lstrip('```json').rstrip('```')
            result_data = json.loads(cleaned_text)
        except json.JSONDecodeError as json_err:
            print(f"JSON Decode Error: {json_err}")
            print(f"Raw Gemini Response: {analysis_result_text}")
            # If response is not valid JSON, wrap raw text
            result_data = {
                'raw_analysis': analysis_result_text,
                'error_message': 'Analysis result was not valid JSON.'
            }
        except Exception as parse_err: # Catch other potential parsing errors
             print(f"Parsing Error: {parse_err}")
             result_data = {
                'raw_analysis': analysis_result_text,
                'error_message': 'An error occurred while parsing the analysis result.'
            }

        # --- Increment scan counts if needed --- 
        if should_increment:
            # Use the new function and pass the tier
            if not increment_scan_counts(user_id, tier):
                 # Log error but proceed - analysis was done, just count failed
                 print(f"CRITICAL: Failed to increment scan counts for user {user_id} (tier: {tier}) after successful analysis.")
                 # Consider adding to a retry queue or alert system
        # --- End Increment --- 

        # Save result to Firestore (as before, creating new doc)
        new_lease_id = None
        try:
            lease_ref = db.collection('leases').add({
                'userId': user_id,
                'fileName': original_filename, # Use original filename or default
                # 'filePath': None, # No longer storing path
                # 'fileUrl': None, # No longer storing URL
                'status': 'complete' if 'error_message' not in result_data else 'error',
                'analysis': result_data,
                'createdAt': firestore.SERVER_TIMESTAMP # Use server timestamp
            })
            new_lease_id = lease_ref[1].id # Get the ID of the newly created doc
        except Exception as db_error:
            print(f"Firestore saving error: {db_error}")
            # Decide if we should fail the request or just return the analysis without saving
            new_lease_id = None # Indicate saving failed
        
        # Return analysis result (and optionally the new lease ID)
        return jsonify({
            'success': True,
            'leaseId': new_lease_id, # Return the ID of the *newly created* doc
            'analysis': result_data
        })
    
    except Exception as e:
        print(f"Analysis endpoint error: {e}")
        # Attempt to save error state if possible (might fail if analysis failed early)
        # We don't have a lease_id readily available here unless we create it earlier
        # For simplicity now, just return the error
        return jsonify({'error': str(e)}), 500

# --- Add DELETE Endpoint --- 
@app.route('/api/leases/<string:lease_id>', methods=['DELETE'])
def delete_lease(lease_id):
    if db is None:
        print("Error: Firestore database client not initialized.")
        return jsonify({'error': 'Server configuration error: Database unavailable.'}), 500
    # Check authorization
    auth_header = request.headers.get('Authorization')
    if not auth_header or not auth_header.startswith('Bearer '):
        return jsonify({'error': 'Unauthorized'}), 401
    
    token = auth_header.split('Bearer ')[1]
    user_id = verify_token(token)
    if not user_id:
        return jsonify({'error': 'Invalid token'}), 401

    if not lease_id:
        return jsonify({'error': 'Missing lease ID'}), 400

    try:
        lease_ref = db.collection('leases').document(lease_id)
        lease_doc = lease_ref.get()

        if not lease_doc.exists:
            return jsonify({'error': 'Lease analysis not found'}), 404

        # Security Check: Ensure the user requesting delete owns the document
        if lease_doc.to_dict().get('userId') != user_id:
            print(f"Unauthorized delete attempt: User {user_id} tried to delete lease {lease_id} owned by {lease_doc.to_dict().get('userId')}")
            return jsonify({'error': 'Forbidden'}), 403

        # Delete the document from Firestore
        lease_ref.delete()

        # Optionally: Delete corresponding file from Firebase Storage if applicable
        # file_path = lease_doc.to_dict().get('filePath')
        # if file_path:
        #    try:
        #        bucket = storage.bucket() # Get bucket reference if needed
        #        blob = bucket.blob(file_path)
        #        blob.delete()
        #        print(f"Deleted storage file: {file_path}")
        #    except Exception as storage_err:
        #        print(f"Error deleting storage file {file_path}: {storage_err}") 
        #        # Continue even if storage delete fails, Firestore doc is main record

        return jsonify({'success': True, 'message': 'Lease analysis deleted successfully'}), 200

    except Exception as e:
        print(f"Error deleting lease {lease_id}: {e}")
        return jsonify({'error': 'An error occurred while deleting the analysis'}), 500
# --- End DELETE Endpoint --- 

# --- Admin Routes --- 

@app.route('/api/admin/users', methods=['GET'])
def get_all_users():
    if db is None:
        return jsonify({'error': 'Server configuration error: Database unavailable.'}), 500

    # 1. Verify Auth Token
    auth_header = request.headers.get('Authorization')
    if not auth_header or not auth_header.startswith('Bearer '):
        return jsonify({'error': 'Unauthorized: Missing or invalid token'}), 401
    token = auth_header.split('Bearer ')[1]
    user_id = verify_token(token)
    if not user_id:
        return jsonify({'error': 'Unauthorized: Invalid token'}), 401

    # 2. Check if the user is the admin
    if not is_admin(user_id):
        print(f"Forbidden access attempt to /api/admin/users by user: {user_id}")
        return jsonify({'error': 'Forbidden: Admin access required'}), 403

    # 3. Fetch users from Firestore
    try:
        users_ref = db.collection('users')
        all_users_docs = users_ref.stream()
        users_list = []
        for doc in all_users_docs:
            user_data = doc.to_dict()
            user_data['userId'] = doc.id # Ensure userId is included
            # Optionally fetch email from Firebase Auth if not stored in profile
            try:
                auth_user = firebase_admin.auth.get_user(doc.id)
                user_data['email'] = auth_user.email
            except Exception as auth_err:
                print(f"Could not fetch email for user {doc.id}: {auth_err}")
                user_data['email'] = user_data.get('email', 'N/A') # Use stored email or N/A
            
            # Convert Timestamps to strings for JSON serialization if necessary
            if 'createdAt' in user_data and isinstance(user_data['createdAt'], firestore.SERVER_TIMESTAMP.__class__):
                 # Handle uncommitted server timestamps if needed, or skip/format
                 user_data['createdAt'] = None # Or format if available after get()
            elif 'createdAt' in user_data and hasattr(user_data['createdAt'], 'isoformat'):
                 user_data['createdAt'] = user_data['createdAt'].isoformat()
            # Add similar handling for other timestamp fields like 'subscriptionStartDate'

            users_list.append(user_data)
            
        return jsonify(users_list), 200
    except Exception as e:
        print(f"Error fetching users from Firestore: {e}")
        return jsonify({'error': 'Failed to retrieve users'}), 500

@app.route('/api/admin/set-scans', methods=['POST'])
def set_user_scans():
    if db is None:
        return jsonify({'error': 'Server configuration error: Database unavailable.'}), 500

    # 1. Verify Auth Token & Admin Status
    auth_header = request.headers.get('Authorization')
    if not auth_header or not auth_header.startswith('Bearer '):
        return jsonify({'error': 'Unauthorized: Missing or invalid token'}), 401
    token = auth_header.split('Bearer ')[1]
    user_id = verify_token(token)
    if not user_id or not is_admin(user_id):
        return jsonify({'error': 'Forbidden: Admin access required'}), 403

    # 2. Get Data from Request
    data = request.get_json()
    if not data:
        return jsonify({'error': 'Missing request body'}), 400
        
    target_user_id = data.get('targetUserId')
    scan_limit_input = data.get('scanLimit')

    if not target_user_id:
        return jsonify({'error': 'Missing targetUserId'}), 400
    if scan_limit_input is None: # Allow 0, check specifically for None
        return jsonify({'error': 'Missing scanLimit'}), 400
        
    try:
        # Ensure scan_limit is a non-negative integer
        scan_limit = int(scan_limit_input)
        if scan_limit < 0:
            raise ValueError("Scan limit cannot be negative.")
    except (ValueError, TypeError):
        return jsonify({'error': 'Invalid scanLimit: must be a non-negative integer.'}), 400

    # 3. Update Firestore
    try:
        user_ref = db.collection('users').document(target_user_id)
        user_doc = user_ref.get()
        
        if not user_doc.exists:
            return jsonify({'error': 'Target user not found'}), 404
            
        # Set the maxAllowedScans field
        # Decide if freeScansUsed should be reset - let's not reset for now
        user_ref.update({
            'maxAllowedScans': scan_limit
            # Optionally update tier if setting scans implies a specific tier
            # 'subscriptionTier': 'commercial' # Or another tier name
        })
        
        print(f"Admin {user_id} set scan limit for user {target_user_id} to {scan_limit}")
        return jsonify({'success': True, 'message': f'Scan limit updated to {scan_limit} for user {target_user_id}'}), 200
        
    except Exception as e:
        print(f"Error updating scan limit for {target_user_id}: {e}")
        return jsonify({'error': 'Failed to update user scan limit'}), 500
        
@app.route('/api/admin/create-commercial', methods=['POST'])
def create_commercial_user():
    if db is None:
        return jsonify({'error': 'Server configuration error: Database unavailable.'}), 500

    # 1. Verify Auth Token & Admin Status
    auth_header = request.headers.get('Authorization')
    if not auth_header or not auth_header.startswith('Bearer '):
        return jsonify({'error': 'Unauthorized: Missing or invalid token'}), 401
    token = auth_header.split('Bearer ')[1]
    requesting_user_id = verify_token(token)
    if not requesting_user_id or not is_admin(requesting_user_id):
        return jsonify({'error': 'Forbidden: Admin access required'}), 403

    # 2. Get Data from Request
    data = request.get_json()
    if not data:
        return jsonify({'error': 'Missing request body'}), 400
        
    email = data.get('email')
    password = data.get('password')
    scan_limit_input = data.get('scanLimit')

    if not email or not password:
        return jsonify({'error': 'Missing email or password'}), 400
    if scan_limit_input is None:
        return jsonify({'error': 'Missing scanLimit'}), 400
        
    try:
        scan_limit = int(scan_limit_input)
        if scan_limit < 0:
            raise ValueError("Scan limit cannot be negative.")
    except (ValueError, TypeError):
        return jsonify({'error': 'Invalid scanLimit: must be a non-negative integer.'}), 400
        
    # 3. Create User in Firebase Auth
    new_user_uid = None
    try:
        new_user = firebase_admin.auth.create_user(
            email=email,
            password=password,
            email_verified=True # Optional: mark as verified since admin created
        )
        new_user_uid = new_user.uid
        print(f"Admin {requesting_user_id} created new Auth user {email} ({new_user_uid})")
    except firebase_admin.auth.EmailAlreadyExistsError:
        print(f"Failed to create user: Email {email} already exists.")
        return jsonify({'error': 'Email already exists'}), 409 # Conflict
    except Exception as e:
        print(f"Error creating Firebase Auth user {email}: {e}")
        return jsonify({'error': 'Failed to create user authentication'}), 500
        
    # 4. Create User Profile in Firestore
    if new_user_uid:
        try:
            user_ref = db.collection('users').document(new_user_uid)
            profile_data = {
                'userId': new_user_uid,
                'email': email, 
                'subscriptionTier': 'commercial', # Assign specific tier
                'maxAllowedScans': scan_limit,
                'freeScansUsed': 0, # Start with 0 used
                'createdAt': firestore.SERVER_TIMESTAMP
            }
            user_ref.set(profile_data)
            print(f"Created Firestore profile for commercial user {email} ({new_user_uid}) with scan limit {scan_limit}")
            return jsonify({
                'success': True, 
                'message': 'Commercial user created successfully', 
                'userId': new_user_uid, 
                'email': email
            }), 201 # Created
        except Exception as e:
            print(f"CRITICAL: Failed to create Firestore profile for user {new_user_uid} after Auth creation: {e}")
            # Consider deleting the Auth user here or adding manual cleanup process
            return jsonify({'error': 'User authentication created, but failed to create user profile data.'}), 500
    else:
        # Should not happen if Auth creation didn't error, but as fallback
        return jsonify({'error': 'Failed to get new user ID after creation'}), 500

# --- End Admin Routes --- 

# --- NEW: Photo Inspection Endpoint ---
def allowed_image_file(filename):
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in ALLOWED_IMAGE_EXTENSIONS

@app.route('/api/inspect-photos', methods=['POST'])
def inspect_photos():
    if db is None:
        return jsonify({'error': 'Server configuration error: Database unavailable.'}), 500

    # --- Authorization --- 
    auth_header = request.headers.get('Authorization')
    if not auth_header or not auth_header.startswith('Bearer '):
        return jsonify({'error': 'Unauthorized'}), 401
    token = auth_header.split('Bearer ')[1]
    user_id = verify_token(token)
    if not user_id:
        return jsonify({'error': 'Invalid token'}), 401

    # --- File Handling ---
    if 'photos' not in request.files:
        return jsonify({'error': 'No photo files provided'}), 400

    uploaded_files = request.files.getlist('photos')
    
    if not uploaded_files or len(uploaded_files) == 0 or uploaded_files[0].filename == '':
         return jsonify({'error': 'No photos selected for upload'}), 400

    all_results = [] # Store results for all images
    all_issues = [] # Store issues across all images for cost estimate

    # --- Gemini Vision Analysis Logic ---
    for file in uploaded_files:
        if not file or not allowed_image_file(file.filename):
            print(f"Skipped invalid file type: {file.filename}")
            continue

        print(f"Processing photo for inspection: {file.filename}")
        try:
            # Read image data
            image_bytes = file.read()
            # Determine MIME type
            mime_type = mimetypes.guess_type(file.filename)[0]
            if not mime_type or not mime_type.startswith('image/'):
                print(f"Skipping file with undetermined or non-image MIME type: {file.filename}")
                continue
                
            # Prepare image part for Gemini
            image_part = {
                "mime_type": mime_type,
                "data": image_bytes
            }
            
            # Construct the prompt for Gemini Vision
            prompt = f"""\
            Analyze the provided image of a property (wall, fixture, roof, etc.). 
            Identify and describe any visible damage, defects, or potential issues (e.g., cracks, stains, rust, holes, wear and tear, water damage, mold). 
            For each distinct issue found, provide:
            1. A short label (e.g., 'Hairline Crack', 'Water Stain', 'Minor Corrosion').
            2. An estimated severity level (Low, Medium, High).
            3. A brief description or location if possible.
            
            Format the output ONLY as a single JSON object containing a key called 'identified_issues\'. 
            The value of 'identified_issues\' should be an array of objects, where each object represents a found issue and has the keys: 'label\', 'severity\', and 'description\'.
            If no issues are found, return an empty array: {{"identified_issues": []}}
            Do not include any text before or after the JSON object (e.g., no ```json markdown).
            """

            analysis_result_json = None
            last_error = None
            # Iterate through API keys (similar to analyze_lease)
            for i, api_key in enumerate(gemini_api_keys):
                print(f"Attempting Gemini Vision with API key #{i+1} for {file.filename}")
                try:
                    genai.configure(api_key=api_key)
                    # Use a model that supports vision, e.g., gemini-pro-vision or 1.5 flash/pro
                    model = genai.GenerativeModel('gemini-2.5-flash-preview-04-17') 
                    
                    # Generate content with prompt and image
                    response = model.generate_content([prompt, image_part])
                    
                    # Clean and parse the response
                    cleaned_text = response.text.strip().lstrip('```json').rstrip('```').strip()
                    analysis_result_json = json.loads(cleaned_text)
                    
                    print(f"Gemini Vision successful with API key #{i+1} for {file.filename}")
                    break # Success, exit key loop
                    
                except json.JSONDecodeError as json_err:
                    print(f"JSON Decode Error (key #{i+1}) for {file.filename}: {json_err}")
                    print(f"Raw Gemini Response: {response.text}")
                    last_error = json_err # Store error and try next key
                    continue
                except PermissionDenied as e:
                    if "API key not valid" in str(e) or "invalid" in str(e).lower():
                        print(f"Warning: Gemini API key #{i+1} failed (Invalid Key): {e}")
                        last_error = e
                        continue # Try next key
                    else:
                        print(f"Gemini API Permission Error (key #{i+1}) for {file.filename}: {e}")
                        last_error = e
                        break # Non-key permission error, stop trying
                except GoogleAPIError as e: 
                    print(f"Gemini API Error (key #{i+1}) for {file.filename}: {e}")
                    last_error = e
                    # Potentially retry on specific errors like rate limits, but stop for now
                    break
                except Exception as e:
                    print(f"Unexpected Error during Gemini vision (key #{i+1}) for {file.filename}: {e}")
                    last_error = e
                    break # Stop on unexpected errors

            # Process results if analysis was successful
            found_issues = []
            if analysis_result_json and 'identified_issues' in analysis_result_json:
                # Basic validation: ensure it's a list
                if isinstance(analysis_result_json['identified_issues'], list):
                    for issue in analysis_result_json['identified_issues']:
                        # Basic validation of issue structure
                        if isinstance(issue, dict) and 'label' in issue and 'severity' in issue and 'description' in issue:
                            issue_id = f"issue-{uuid.uuid4()}" # Generate unique ID
                            validated_issue = {
                                'id': issue_id,
                                'label': issue.get('label', 'Unknown'),
                                'severity': issue.get('severity', 'Unknown'),
                                'location': issue.get('description', 'N/A') # Use description as location for now
                            }
                            found_issues.append(validated_issue)
                            all_issues.append(validated_issue) # Add to overall list for estimate
                        else:
                            print(f"Warning: Skipping malformed issue object in response for {file.filename}: {issue}")
                else:
                     print(f"Warning: 'identified_issues' is not a list in response for {file.filename}")
            elif last_error:
                 print(f"Gemini Vision failed for {file.filename} after trying all keys. Last error: {last_error}")
                 # Optionally add an error marker to the result for this file
            else:
                 print(f"No issues identified or analysis failed for {file.filename}")
                 
            all_results.append({
                "fileName": file.filename,
                "imageUrl": "placeholder", # Replace if storing and serving images
                "issues": found_issues, # Issues found for THIS image
                "analysis_error": str(last_error) if last_error and not analysis_result_json else None # Include error if analysis failed
            })

        except Exception as file_proc_err:
             print(f"Error processing file {file.filename}: {file_proc_err}")
             # Add a result indicating this file failed processing
             all_results.append({
                "fileName": file.filename,
                "imageUrl": "placeholder",
                "issues": [],
                "processing_error": str(file_proc_err)
             })
    # --- End Gemini Vision Analysis Logic ---

    # --- Mock Repair Estimate (Based on combined issues) ---
    total_cost = 0
    line_items = []
    for issue in all_issues: # Iterate through issues from ALL processed images
        cost = 50 # Default mock cost
        if issue['severity'] == "Medium": cost = 150
        if issue['severity'] == "High": cost = 300
        line_items.append({ 'issueId': issue['id'], 'task': f"Repair {issue['label']}", 'estimatedCost': cost })
        total_cost += cost

    final_estimate = {
        "lineItems": line_items,
        "totalEstimatedCost": total_cost,
        "notes": "AI-based issue detection complete. Cost estimates are placeholders."
    }
    # --- End Mock Estimate ---

    return jsonify({
        'success': True, # Indicate endpoint success, individual files might have errors
        'results': all_results, # Contains results per file, including potential errors
        'repairEstimate': final_estimate
    }), 200

# --- End Photo Inspection Endpoint ---

# --- NEW: Finance Analysis Endpoint ---
def allowed_finance_file(filename):
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in ALLOWED_FINANCE_EXTENSIONS

@app.route('/api/analyze-finance', methods=['POST'])
def analyze_finance_document():
    if db is None:
        return jsonify({'error': 'Server configuration error: Database unavailable.'}), 500
        
    # --- Authorization --- 
    auth_header = request.headers.get('Authorization')
    if not auth_header or not auth_header.startswith('Bearer '):
        return jsonify({'error': 'Unauthorized'}), 401
    token = auth_header.split('Bearer ')[1]
    user_id = verify_token(token)
    if not user_id:
        return jsonify({'error': 'Invalid token'}), 401
        
    # --- File Handling ---
    if 'financeFile' not in request.files:
        return jsonify({'error': 'No finance file provided'}), 400
        
    file = request.files['financeFile']
    
    if file.filename == '':
        return jsonify({'error': 'No file selected for upload'}), 400
        
    if file and allowed_finance_file(file.filename):
        print(f"Received finance document: {file.filename}")
        
        # --- Placeholder Analysis Logic ---
        # In a real scenario:
        # 1. Extract text/data (e.g., using PyPDF2 for PDF, OCR for images).
        # 2. Pass extracted data to Gemini with a specific prompt for financial details.
        # 3. Parse Gemini's response.
        
        # Mock extracted data based on filename hint
        extracted_data = {
            'fileName': file.filename,
            'category': 'Utilities' if 'utility' in file.filename.lower() else 'Maintenance' if 'repair' in file.filename.lower() else 'Other',
            'vendor': 'Mock Vendor Inc.',
            'date': datetime.date.today().isoformat(),
            'amount': 123.45,
            'currency': 'USD',
            'summary': 'Placeholder summary of the financial document.'
        }
        # --- End Placeholder Logic ---

        return jsonify({
            'success': True,
            'extractedData': extracted_data
        }), 200
        
    else:
        return jsonify({'error': 'Invalid file type. Allowed: PDF, PNG, JPG, JPEG'}), 400
        
# --- End Finance Analysis Endpoint ---

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 8081))
    app.run(host='0.0.0.0', port=port, debug=True) # Added debug=True for development 