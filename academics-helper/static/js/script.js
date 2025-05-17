document.addEventListener('DOMContentLoaded', function() {
    // Sound Manager
    const SoundManager = {
        sounds: {
            webEnter: new Audio('/static/sounds/WebEnterBell.mp3'),
            geminiKey: new Audio('/static/sounds/GeminiKeyEnter.mp3'),
            pdfWaiting: new Audio('/static/sounds/WaitingSound.mp3'),
            meteorResponse: new Audio('/static/sounds/MeteorSound.mp3')
        },
        
        muted: false,
        
        playSound: function(soundName) {
            if (this.muted) return;
            
            if (this.sounds[soundName]) {
                // Reset the audio to beginning in case it was already playing
                this.sounds[soundName].currentTime = 0;
                // Play the sound
                this.sounds[soundName].play().catch(error => {
                    console.log('Sound play error:', error);
                    // Most browsers require user interaction before playing audio
                });
            }
        },
        
        toggleMute: function() {
            this.muted = !this.muted;
            return this.muted;
        },
        
        setVolume: function(volume) {
            for (let sound in this.sounds) {
                this.sounds[sound].volume = volume;
            }
        }
    };
    
    // Set initial volume
    SoundManager.setVolume(0.5);
    
    // DOM Elements
    const apiKeyInput = document.getElementById('api-key-input');
    const saveKeyBtn = document.getElementById('save-key-btn');
    const tickContainer = document.querySelector('.tick-container');
    const dropArea = document.getElementById('drop-area');
    const fileInput = document.getElementById('file-input');
    const browseBtn = document.getElementById('browse-btn');
    const fileInfo = document.getElementById('file-info');
    const filename = document.getElementById('filename');
    const chatContainer = document.getElementById('chat-container');
    const summaryContent = document.getElementById('summary-content');
    const chatMessages = document.getElementById('chat-messages');
    const questionInput = document.getElementById('question-input');
    const sendBtn = document.getElementById('send-btn');
    const statusMessage = document.getElementById('status-message');
    const toggleSoundBtn = document.getElementById('toggle-sound');
    
    // Session data
    let sessionId = null;
    let userInteracted = false;
    
    // Play entrance sound on first user interaction
    document.body.addEventListener('click', function firstInteraction() {
        if (!userInteracted) {
            SoundManager.playSound('webEnter');
            userInteracted = true;
        }
    });
    
    // Sound toggle button
    toggleSoundBtn.addEventListener('click', function() {
        const isMuted = SoundManager.toggleMute();
        this.innerHTML = isMuted ? 
            '<i class="fas fa-volume-mute"></i>' : 
            '<i class="fas fa-volume-up"></i>';
    });
    
    // Event Listeners
    saveKeyBtn.addEventListener('click', saveApiKey);
    dropArea.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', handleFileUpload);
    browseBtn.addEventListener('click', () => fileInput.click());
    sendBtn.addEventListener('click', sendQuestion);
    questionInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') sendQuestion();
    });
    
    // Drag and drop functionality
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        dropArea.addEventListener(eventName, preventDefaults, false);
    });
    
    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }
    
    ['dragenter', 'dragover'].forEach(eventName => {
        dropArea.addEventListener(eventName, highlight, false);
    });
    
    ['dragleave', 'drop'].forEach(eventName => {
        dropArea.addEventListener(eventName, unhighlight, false);
    });
    
    function highlight() {
        dropArea.classList.add('highlight');
    }
    
    function unhighlight() {
        dropArea.classList.remove('highlight');
    }
    
    dropArea.addEventListener('drop', handleDrop, false);
    
    function handleDrop(e) {
        const dt = e.dataTransfer;
        const files = dt.files;
        
        if (files.length > 0 && files[0].type === 'application/pdf') {
            fileInput.files = files;
            handleFileUpload();
        } else {
            setStatus('Please upload a PDF file.', 'error');
        }
    }
    
    // Functions
    async function saveApiKey() {
        const apiKey = apiKeyInput.value.trim();
        
        if (!apiKey) {
            setStatus('Please enter an API key.', 'error');
            return;
        }
        
        setStatus('Saving API key...');
        
        try {
            const response = await fetch('/api/save-key', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ api_key: apiKey }),
            });
            
            const data = await response.json();
            
            if (data.success) {
                // Play Gemini key sound
                SoundManager.playSound('geminiKey');
                
                // Show tick animation
                tickContainer.classList.remove('hidden');
                
                // Hide input and button temporarily
                apiKeyInput.style.opacity = '0.5';
                saveKeyBtn.style.opacity = '0.5';
                
                // Hide tick and restore input after animation
                setTimeout(() => {
                    tickContainer.classList.add('hidden');
                    apiKeyInput.style.opacity = '1';
                    saveKeyBtn.style.opacity = '1';
                    apiKeyInput.value = ''; // Clear for security
                    apiKeyInput.placeholder = '✓ API Key Saved';
                }, 2000);
                
                setStatus('API key saved successfully!', 'success');
            } else {
                setStatus(data.error, 'error');
            }
        } catch (error) {
            setStatus('Error saving API key: ' + error.message, 'error');
        }
    }
    
    async function handleFileUpload() {
        if (!fileInput.files.length) return;
        
        const file = fileInput.files[0];
        
        if (file.type !== 'application/pdf') {
            setStatus('Please upload a PDF file.', 'error');
            return;
        }
        
        setStatus('Uploading PDF...');
        
        // Play waiting sound
        SoundManager.playSound('pdfWaiting');
        
        const formData = new FormData();
        formData.append('file', file);
        
        try {
            const response = await fetch('/api/upload-pdf', {
                method: 'POST',
                body: formData,
            });
            
            const data = await response.json();
            
            if (data.success) {
                sessionId = data.session_id;
                filename.textContent = data.filename;
                fileInfo.classList.remove('hidden');
                chatContainer.classList.remove('hidden');
                summaryContent.textContent = data.summary;
                chatMessages.innerHTML = '';
                setStatus('PDF processed successfully!', 'success');
            } else {
                setStatus(data.error, 'error');
            }
        } catch (error) {
            setStatus('Error uploading PDF: ' + error.message, 'error');
        }
    }
    
    async function sendQuestion() {
        const question = questionInput.value.trim();
        
        if (!question) return;
        
        if (!sessionId) {
            setStatus('Please upload a PDF first.', 'error');
            return;
        }
        
        // Add user message to chat
        addMessage('You', question);
        questionInput.value = '';
        
        setStatus('Getting response...');
        
        try {
            const response = await fetch('/api/ask', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    session_id: sessionId,
                    question: question,
                }),
            });
            
            const data = await response.json();
            
            if (data.success) {
                // Play meteor sound when response is received
                SoundManager.playSound('meteorResponse');
                
                addMessage('Meteor', data.response);
                setStatus('Ready', 'success');
            } else {
                setStatus(data.error, 'error');
            }
        } catch (error) {
            setStatus('Error: ' + error.message, 'error');
        }
    }
    
    function addMessage(sender, message) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `chat-message ${sender === 'You' ? 'user-message' : 'bot-message'}`;
        
        const senderSpan = document.createElement('strong');
        senderSpan.textContent = sender + ': ';
        
        const messageContent = document.createElement('span');
        messageContent.textContent = message;
        
        messageDiv.appendChild(senderSpan);
        messageDiv.appendChild(messageContent);
        
        chatMessages.appendChild(messageDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }
    
    function setStatus(message, type = '') {
        statusMessage.textContent = message;
        statusMessage.className = type;
    }
    
    // Check if API key is already saved
    if (apiKeyInput.value.trim()) {
        setStatus('API key loaded from storage.', 'success');
    }
});
