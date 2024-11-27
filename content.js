const API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent';

// Function to scrape course data
function scrapeCourseData() {
    const courseData = {
        title: document.querySelector('h1')?.textContent,
        description: document.querySelector('[data-e2e="course-description"]')?.textContent,
        modules: Array.from(document.querySelectorAll('[data-e2e="course-module"]')).map(module => ({
            title: module.querySelector('h3')?.textContent,
            content: module.textContent
        }))
    };
    
    console.log('Scraped Course Data:', courseData);
    return courseData;
}

// Create and append chat button
function createChatButton() {
    const chatButton = document.createElement('div');
    chatButton.className = 'course-assistant-chat-button';
    chatButton.innerHTML = `
        <svg viewBox="0 0 24 24" width="24" height="24">
            <path fill="currentColor" d="M20,2H4A2,2 0 0,0 2,4V22L6,18H20A2,2 0 0,0 22,16V4A2,2 0 0,0 20,2M20,16H6L4,18V4H20"/>
        </svg>
    `;
    document.body.appendChild(chatButton);
    
    return chatButton;
}

// Create chat popup
function createChatPopup() {
    const popup = document.createElement('div');
    popup.className = 'course-assistant-popup hidden';
    popup.innerHTML = `
        <div class="chat-header">
            <h3>Coursera Assistant</h3>
            <div class="actions">
                <button class="close-button">×</button>
            </div>
        </div>
        <div class="chat-messages">
            <div class="message assistant">
                <div class="message-avatar">C</div>
                <div class="message-content">Hi! I'm your Coursera Assistant. I can help you better understand this course. What would you like to know?</div>
            </div>
        </div>
        <div class="chat-input">
            <textarea placeholder="Ask me anything about the course..."></textarea>
            <button class="send-button">Send</button>
        </div>
    `;
    document.body.appendChild(popup);
    
    return popup;
}

// Function to call Gemini API
async function generateResponse(prompt, courseContext) {
    try {
        const response = await fetch(`${API_URL}?key=${config.GEMINI_API_KEY}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                contents: [{
                    parts: [{
                        text: `You are a helpful teaching assistant for a Coursera course. 
                              Use the following course context to answer the student's question:
                              ${JSON.stringify(courseContext)}
                              
                              Student's question: ${prompt}`
                    }]
                }],
                generationConfig: {
                    temperature: 0.7,
                    topK: 40,
                    topP: 0.95,
                    maxOutputTokens: 1024,
                }
            })
        });

        const data = await response.json();
        
        if (data.candidates && data.candidates[0].content) {
            return data.candidates[0].content.parts[0].text;
        } else {
            throw new Error('No response generated');
        }
    } catch (error) {
        console.error('Error calling Gemini API:', error);
        return 'I apologize, but I encountered an error processing your request. Please try again.';
    }
}

// Initialize extension
function init() {
    const courseData = scrapeCourseData();
    const chatButton = createChatButton();
    const chatPopup = createChatPopup();
    
    // Toggle chat popup
    chatButton.addEventListener('click', () => {
        chatPopup.classList.toggle('hidden');
    });
    
    // Close popup
    chatPopup.querySelector('.close-button').addEventListener('click', () => {
        chatPopup.classList.add('hidden');
    });

    // Handle send message
    const textarea = chatPopup.querySelector('textarea');
    const sendButton = chatPopup.querySelector('.send-button');

    async function sendMessage() {
        const text = textarea.value.trim();
        if (text) {
            const messagesContainer = chatPopup.querySelector('.chat-messages');
            
            // Add user message
            messagesContainer.innerHTML += `
                <div class="message user">
                    <div class="message-content">${text}</div>
                </div>
            `;
            
            // Add loading message
            const loadingMessage = document.createElement('div');
            loadingMessage.className = 'message assistant';
            loadingMessage.innerHTML = `
                <div class="message-avatar">C</div>
                <div class="message-content loading">Thinking...</div>
            `;
            messagesContainer.appendChild(loadingMessage);
            
            // Clear input
            textarea.value = '';
            messagesContainer.scrollTop = messagesContainer.scrollHeight;

            // Get AI response
            const response = await generateResponse(text, courseData);
            
            // Replace loading message with actual response
            loadingMessage.innerHTML = `
                <div class="message-avatar">C</div>
                <div class="message-content">${response}</div>
            `;
            messagesContainer.scrollTop = messagesContainer.scrollHeight;
        }
    }

    sendButton.addEventListener('click', sendMessage);
    textarea.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });
}

// Run initialization when DOM is loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
} 