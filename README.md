Academics Helper - PDF Chatbot
Academics Helper is an interactive web application that allows users to upload PDF documents and chat with an AI assistant (Meteor) about the content. The application uses Google's Gemini API to generate summaries and answer questions based on the uploaded PDF content.

![Academics Helper Screenshotgle Gemini API key management

📄 PDF upload with drag-and-drop functionality

📝 Automatic document summarization

💬 Interactive chat interface with the document content

🔊 Sound effects for enhanced user experience

🎨 Beautiful gradient interface with modern design

📱 Responsive design for desktop and mobile devices

Demo
View Live Demo

Prerequisites
Before you begin, ensure you have the following installed:

Python 3.7+

pip (Python package installer)

A Google Gemini API key (Get one here)

Installation
1. Clone the repository
bash
git clone https://github.com/yourusername/academics-helper.git
cd academics-helper
2. Create and activate a virtual environment (recommended)
bash
# For Windows
python -m venv venv
venv\Scripts\activate

# For macOS/Linux
python -m venv venv
source venv/bin/activate
3. Install dependencies
bash
pip install flask flask-cors PyPDF2 requests
4. Set up the project structure
Ensure your project has the following structure:

text
academics-helper/
├── app.py
├── uploads/
├── static/
│   ├── css/
│   │   └── style.css
│   ├── js/
│   │   └── script.js
│   └── sounds/
│       ├── WebEnterBell.mp3
│       ├── GeminiKeyEnter.mp3
│       ├── WaitingSound.mp3
│       └── MeteorSound.mp3
└── templates/
    └── index.html
5. Add sound files
Place your sound files in the static/sounds/ directory with the following names:

WebEnterBell.mp3 (plays when user first interacts with the page)

GeminiKeyEnter.mp3 (plays when API key is saved)

WaitingSound.mp3 (plays when PDF is being processed)

MeteorSound.mp3 (plays when chat responses are received)

Running the Application
Start the Flask server:

bash
python app.py
Open your web browser and navigate to:

text
http://localhost:5000
Enter your Google Gemini API key when prompted

Upload a PDF document and start chatting with Meteor about the content!

Usage Guide
1. API Key Setup
When you first open the application, you'll need to enter your Google Gemini API key

Click "Save Key" to securely store your key

You'll see a green checkmark when the key is successfully saved

2. Uploading a PDF
Drag and drop a PDF file onto the upload area, or click "Browse Files"

The application will process the PDF and generate a summary

You'll hear a sound notification when processing is complete

3. Chatting with Meteor
Once your PDF is processed, you can ask questions about the document

Type your question in the input field and press Enter or click the send button

Meteor will respond based on the content of your PDF

You'll hear a notification sound when Meteor responds

4. Sound Controls
Click the sound icon in the top-right corner to toggle sound effects on/off

Customization
Changing Colors
To modify the color scheme, edit the CSS variables in static/css/style.css:

css
:root {
    --primary-color: #3498db;
    --secondary-color: #2980b9;
    /* Add more color variables here */
}
Changing Sound Effects
To use different sound effects, replace the MP3 files in the static/sounds/ directory with your own files (keeping the same filenames).

Troubleshooting
API Key Issues
If you encounter problems with your API key:

Ensure you've entered the correct key

Check that your API key has the necessary permissions

Verify your API usage quota hasn't been exceeded

PDF Processing Issues
If PDF processing fails:

Ensure the PDF is not password-protected

Try with a smaller PDF file (large files may take longer to process)

Check that the PDF contains extractable text (scanned PDFs may not work)

Contributing
Contributions are welcome! Please feel free to submit a Pull Request.

Fork the repository

Create your feature branch (git checkout -b feature/amazing-feature)

Commit your changes (git commit -m 'Add some amazing feature')

Push to the branch (git push origin feature/amazing-feature)

Open a Pull Request



Acknowledgments
Google Gemini API for powering the AI capabilities

Flask for the web framework

PyPDF2 for PDF text extraction

The open-source community for inspiration and resources

Made with ❤️ and Perplexity by Abhinav
