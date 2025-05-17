from flask import Flask, request, jsonify, render_template
from flask_cors import CORS
import os
import PyPDF2
import requests
import json
from pathlib import Path
import uuid

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Create uploads folder if it doesn't exist
UPLOAD_FOLDER = 'uploads'
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

# Store session data (in a real app, use a database)
sessions = {}

class GeminiClient:
    """Handles interactions with the Google Gemini API."""
    def __init__(self):
        self.api_key = ""
        self.api_key_file = Path.home() / ".gemini_api_key"
        self.base_url = "https://generativelanguage.googleapis.com/v1beta/models"
        self.model = "gemini-2.5-flash-preview-04-17"
        self.load_api_key()

    def load_api_key(self):
        """Load API key from file if it exists."""
        if self.api_key_file.exists():
            try:
                with open(self.api_key_file, 'r') as f:
                    self.api_key = f.read().strip()
            except Exception:
                pass

    def save_api_key(self, api_key):
        """Save API key to file."""
        self.api_key = api_key
        try:
            os.makedirs(self.api_key_file.parent, exist_ok=True)
            with open(self.api_key_file, 'w') as f:
                f.write(api_key)
            return True
        except Exception as e:
            raise Exception(f"Could not save API key: {str(e)}")

    def validate_api_key(self):
        """Check if API key is present."""
        if not self.api_key:
            raise Exception("Please enter your Google Gemini API key first.")

    def generate_summary(self, text):
        """Generate a summary of the PDF text using Gemini API."""
        self.validate_api_key()
        prompt = "Please provide a concise summary of the following document: \n\n" + text
        
        url = f"{self.base_url}/{self.model}:generateContent?key={self.api_key}"
        headers = {"Content-Type": "application/json"}
        data = {
            "contents": [{"parts": [{"text": prompt}]}]
        }
        
        try:
            response = requests.post(url, headers=headers, data=json.dumps(data))
            response.raise_for_status()
            result = response.json()
            
            if "candidates" in result and result["candidates"]:
                return result["candidates"][0]["content"]["parts"][0]["text"]
            else:
                raise Exception("No valid response from Gemini API")
        except requests.exceptions.RequestException as e:
            # Handle various error cases
            if response.status_code == 400:
                error_details = response.json().get("error", {})
                error_message = error_details.get("message", "Invalid request")
                raise Exception(f"API Error: {error_message}")
            elif response.status_code == 401:
                raise Exception("Invalid API key. Please check and try again.")
            elif response.status_code == 429:
                raise Exception("API quota exceeded. Please try again later.")
            else:
                raise Exception(f"Network error: {str(e)}")
        except Exception as e:
            raise Exception(f"Error generating summary: {str(e)}")

    def generate_chat_response(self, chat_history, pdf_text):
        """Generate a response from Gemini API based on chat history and PDF content."""
        self.validate_api_key()
        
        system_prompt = f"""You are Meteor, a helpful assistant answering questions about a document.
        Here is the document content:
        {pdf_text[:10000]} # Limiting content to avoid token limits
        Please answer questions based only on the information in this document.
        If the answer isn't in the document, say so politely."""
        
        messages = []
        messages.append({"role": "user", "parts": [{"text": f"Context information: {system_prompt}\n\nPlease answer questions based on this context."}]})
        
        # Add chat history
        for entry in chat_history:
            if "user" in entry:
                messages.append({"role": "user", "parts": [{"text": entry["user"]}]})
            if "assistant" in entry:
                messages.append({"role": "model", "parts": [{"text": entry["assistant"]}]})
        
        url = f"{self.base_url}/{self.model}:generateContent?key={self.api_key}"
        headers = {"Content-Type": "application/json"}
        data = {
            "contents": messages
        }
        
        try:
            response = requests.post(url, headers=headers, data=json.dumps(data))
            response.raise_for_status()
            result = response.json()
            
            if "candidates" in result and result["candidates"]:
                return result["candidates"][0]["content"]["parts"][0]["text"]
            else:
                raise Exception("No valid response from Gemini API")
        except requests.exceptions.RequestException as e:
            # Handle various error cases
            if response.status_code == 400:
                error_details = response.json().get("error", {})
                error_message = error_details.get("message", "Invalid request")
                raise Exception(f"API Error: {error_message}")
            elif response.status_code == 401:
                raise Exception("Invalid API key. Please check and try again.")
            elif response.status_code == 429:
                raise Exception("API quota exceeded. Please try again later.")
            else:
                raise Exception(f"Network error: {str(e)}")
        except Exception as e:
            raise Exception(f"Error generating chat response: {str(e)}")

# Initialize Gemini client
gemini_client = GeminiClient()

def extract_text_from_pdf(file_path):
    """Extract text from a PDF file."""
    try:
        text = ""
        with open(file_path, 'rb') as file:
            reader = PyPDF2.PdfReader(file)
            for page_num in range(len(reader.pages)):
                text += reader.pages[page_num].extract_text() + "\n"
        return text
    except Exception as e:
        raise Exception(f"Error extracting text from PDF: {str(e)}")

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/save-key', methods=['POST'])
def save_api_key():
    data = request.json
    api_key = data.get('api_key', '').strip()
    
    if not api_key:
        return jsonify({'success': False, 'error': 'Please enter an API key.'}), 400
    
    try:
        gemini_client.save_api_key(api_key)
        return jsonify({'success': True, 'message': 'API key saved successfully!'})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/upload-pdf', methods=['POST'])
def upload_pdf():
    if 'file' not in request.files:
        return jsonify({'success': False, 'error': 'No file part'}), 400
    
    file = request.files['file']
    
    if file.filename == '':
        return jsonify({'success': False, 'error': 'No selected file'}), 400
    
    if file and file.filename.endswith('.pdf'):
        # Create a unique session ID
        session_id = str(uuid.uuid4())
        
        # Save the file
        file_path = os.path.join(app.config['UPLOAD_FOLDER'], f"{session_id}.pdf")
        file.save(file_path)
        
        try:
            # Extract text from PDF
            pdf_text = extract_text_from_pdf(file_path)
            
            # Generate summary
            summary = gemini_client.generate_summary(pdf_text)
            
            # Store session data
            sessions[session_id] = {
                'pdf_text': pdf_text,
                'summary': summary,
                'chat_history': []
            }
            
            return jsonify({
                'success': True, 
                'session_id': session_id,
                'summary': summary,
                'filename': file.filename
            })
        except Exception as e:
            return jsonify({'success': False, 'error': str(e)}), 500
    
    return jsonify({'success': False, 'error': 'Invalid file format. Please upload a PDF.'}), 400

@app.route('/api/ask', methods=['POST'])
def ask_question():
    data = request.json
    session_id = data.get('session_id')
    question = data.get('question', '').strip()
    
    if not session_id or session_id not in sessions:
        return jsonify({'success': False, 'error': 'Invalid session. Please upload a PDF first.'}), 400
    
    if not question:
        return jsonify({'success': False, 'error': 'Please enter a question.'}), 400
    
    try:
        # Get session data
        session_data = sessions[session_id]
        pdf_text = session_data['pdf_text']
        chat_history = session_data['chat_history']
        
        # Add question to chat history
        chat_history.append({'user': question})
        
        # Generate response
        response = gemini_client.generate_chat_response(chat_history, pdf_text)
        
        # Add response to chat history
        chat_history.append({'assistant': response})
        
        return jsonify({
            'success': True,
            'response': response
        })
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, port=5000)
