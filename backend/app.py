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
CORS(app)

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
        return user_doc.to_dict()
    else:
        print(f"Creating default free profile for user: {user_id}")
        default_profile = {
            'userId': user_id, 
            'subscriptionTier': 'free',
            'freeScansUsed': 0,
            'createdAt': firestore.SERVER_TIMESTAMP
            # Add email later if needed, might require frontend to pass it
        }
        try:
            user_ref.set(default_profile)
            return default_profile
        except Exception as e:
             print(f"Error creating user profile for {user_id}: {e}")
             return None # Indicate failure

def increment_free_scan_count(user_id):
    """Atomically increments the free scan count for a user."""
    user_ref = db.collection('users').document(user_id)
    try:
        user_ref.update({'freeScansUsed': firestore.Increment(1)})
        return True
    except Exception as e:
        print(f"Error incrementing scan count for {user_id}: {e}")
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
         # Handle case where profile creation failed
         return jsonify({'error': 'Could not retrieve or create user profile.'}), 500

    can_analyze = False
    is_free_scan_increment = False

    if user_profile.get('subscriptionTier') == 'paid':
        can_analyze = True
    elif user_profile.get('subscriptionTier') == 'free':
        free_scans_used = user_profile.get('freeScansUsed', 0)
        if free_scans_used < 3:
            can_analyze = True
            is_free_scan_increment = True # Mark that we need to increment count after analysis
        else:
            # Free limit reached
             print(f"User {user_id} free scan limit reached.")
             return jsonify({'error': 'Free analysis limit reached. Please upgrade to analyze more leases.', 'upgradeRequired': True}), 402 # Payment Required
    else:
        # Unknown subscription tier - deny access
        print(f"User {user_id} has unknown subscription tier: {user_profile.get('subscriptionTier')}")
        return jsonify({'error': 'Invalid subscription status.'}), 403
        
    if not can_analyze:
         # This case should technically be handled above, but as a fallback
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
            # Specific error if analysis itself failed
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

        # --- Increment free scan count if needed --- 
        if is_free_scan_increment:
            if not increment_free_scan_count(user_id):
                 # Log error but proceed - analysis was done, just count failed
                 print(f"Failed to increment free scan count for user {user_id} after successful analysis.")
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

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 8081))
    app.run(host='0.0.0.0', port=port, debug=True) # Added debug=True for development 