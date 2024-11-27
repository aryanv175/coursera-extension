const API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent';

// Store conversation history
let conversationHistory = [];

// Enhanced course data scraping
function scrapeCourseData() {
    const courseData = {
        title: document.querySelector('h1')?.textContent?.trim(),
        description: document.querySelector('[data-e2e="course-description"]')?.textContent?.trim(),
        // Get syllabus information
        syllabus: Array.from(document.querySelectorAll('[data-e2e="course-module"]')).map(module => ({
            title: module.querySelector('h3')?.textContent?.trim(),
            content: Array.from(module.querySelectorAll('[data-e2e="lesson-item"]')).map(lesson => ({
                title: lesson.textContent?.trim(),
                duration: lesson.querySelector('.duration')?.textContent?.trim()
            }))
        })),
        // Get instructor information
        instructors: Array.from(document.querySelectorAll('[data-e2e="instructor-info"]')).map(instructor => ({
            name: instructor.querySelector('.instructor-name')?.textContent?.trim(),
            title: instructor.querySelector('.instructor-title')?.textContent?.trim()
        })),
        // Get course details
        details: {
            level: document.querySelector('[data-e2e="course-level"]')?.textContent?.trim(),
            duration: document.querySelector('[data-e2e="course-duration"]')?.textContent?.trim(),
            rating: document.querySelector('[data-e2e="course-rating"]')?.textContent?.trim()
        }
    };
    
    console.log('Scraped Course Data:', courseData);
    return courseData;
}

// Initialize conversation with enhanced context
function initializeConversation(courseData) {
    const courseContext = `
        Course: ${courseData.title}
        Description: ${courseData.description}
        Level: ${courseData.details?.level || 'Not specified'}
        Duration: ${courseData.details?.duration || 'Not specified'}
        
        Syllabus Overview:
// Initialize conversation with system message
function initializeConversation(courseContext) {
    conversationHistory = [{
        role: "user",
        parts: [{
            text: `You are a helpful teaching assistant for a Coursera course.
                  Here is the course context:
                  Course Title: ${courseContext.title}
                  Course Description: ${courseContext.description}
                  
                  Please keep your responses concise and focused on helping students understand the course material.
                  Acknowledge that you understand this context.`
        }]
    }, {
        role: "model",
        parts: [{
            text: "I understand. I'm your Coursera Assistant for this course. I'll help you understand the course material with concise, focused responses. What would you like to know about the course?"
        }]
    }];
}

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
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M20 2H4C2.9 2 2 2.9 2 4V22L6 18H20C21.1 18 22 17.1 22 16V4C22 2.9 21.1 2 20 2ZM20 16H6L4 18V4H20V16Z" fill="currentColor"/>
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

// Function to call Gemini API with conversation history
async function generateResponse(prompt, courseContext) {
    try {
        // Add user's new message to history
        conversationHistory.push({
            role: "user",
            parts: [{ text: prompt }]
        });

        const response = await fetch(`${API_URL}?key=${config.GEMINI_API_KEY}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                contents: conversationHistory,
                generationConfig: {
                    temperature: 0.7,
                    topK: 40,
                    topP: 0.95,
                    maxOutputTokens: 1024,
                }
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            console.error('API Error:', errorData);
            throw new Error(`API error: ${errorData.error?.message || 'Unknown error'}`);
        }

        const data = await response.json();
        console.log('API Response:', data);
        
        if (data.candidates && data.candidates[0].content) {
            const responseText = data.candidates[0].content.parts[0].text;
            
            // Add model's response to history
            conversationHistory.push({
                role: "model",
                parts: [{ text: responseText }]
            });

            // Keep only the last 10 messages to prevent context window overflow
            if (conversationHistory.length > 12) { // 2 initial + 10 conversation
                conversationHistory = [
                    ...conversationHistory.slice(0, 2), // Keep initial context
                    ...conversationHistory.slice(-10) // Keep last 10 messages
                ];
            }

            return responseText;
        } else {
            throw new Error('No response generated');
        }
    } catch (error) {
        console.error('Error details:', error);
        return `I apologize, but I encountered an error: ${error.message}. Please try again.`;
    }
}

// Initialize extension
function init() {
    const courseData = scrapeCourseData();
    initializeConversation(courseData);
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