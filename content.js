const API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent';

// Store conversation history
let conversationHistory = [];

// Add transcript storage
let accumulatedTranscripts = new Map(); // Store transcripts by lecture ID/URL

// Function to wait for elements to load
function waitForElement(selector, timeout = 10000) {
    return new Promise((resolve, reject) => {
        // Try alternative selectors if main one fails
        const selectors = Array.isArray(selector) ? selector : [selector];
        
        // Check if any of the selectors exist
        for (const sel of selectors) {
            const element = document.querySelector(sel);
            if (element) {
                return resolve(element);
            }
        }

        const observer = new MutationObserver(() => {
            for (const sel of selectors) {
                const element = document.querySelector(sel);
                if (element) {
                    resolve(element);
                    observer.disconnect();
                    return;
                }
            }
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });

        setTimeout(() => {
            observer.disconnect();
            // Instead of rejecting, resolve with null
            resolve(null);
        }, timeout);
    });
}

// Enhanced scraping function
async function scrapeCourseData() {
    try {
        console.log("Starting course data scraping...");
        
        // Wait for any main content container
        const mainContainer = await waitForElement([
            '.rc-MainContainer',
            '.course-content',
            '.rc-VideoMiniPlayer',
            '.course-page',
            'main'
        ]);

        // Continue even if main container is not found
        console.log("Main container found:", !!mainContainer);

        const courseData = {
            title: '',
            description: '',
            syllabus: [],
            currentLecture: {
                title: '',
                transcript: '',
                content: ''
            },
            transcripts: {}
        };

        // Scrape course title
        try {
            const titleElement = await waitForElement('h1.banner-title, h1.course-name');
            courseData.title = titleElement?.textContent?.trim();
            console.log("Found course title:", courseData.title);
        } catch (e) {
            console.warn("Could not find course title:", e);
        }

        // Scrape course description
        try {
            const descElement = await waitForElement('[data-e2e="course-description"], .about-section');
            courseData.description = descElement?.textContent?.trim();
            console.log("Found course description");
        } catch (e) {
            console.warn("Could not find course description:", e);
        }

        // Scrape current lecture content
        try {
            // Wait for video player or lecture content
            const videoContainer = await waitForElement('.rc-VideoMiniPlayer, .video-container');
            if (videoContainer) {
                courseData.currentLecture.title = document.querySelector('.rc-LectureName')?.textContent?.trim();
                console.log("Found lecture title:", courseData.currentLecture.title);
            }
        } catch (e) {
            console.warn("Could not find video container:", e);
        }

        // Scrape transcript
        try {
            const transcriptButton = await waitForElement('button[aria-label="Show transcript"]');
            if (transcriptButton) {
                transcriptButton.click();
                await new Promise(resolve => setTimeout(resolve, 1000)); // Wait for transcript to load
                
                const transcriptContainer = await waitForElement('.rc-VideoTranscript');
                if (transcriptContainer) {
                    const transcriptSegments = Array.from(transcriptContainer.querySelectorAll('p'))
                        .map(p => p.textContent.trim())
                        .filter(text => text.length > 0);
                    
                    courseData.currentLecture.transcript = transcriptSegments.join('\n');
                    console.log("Found transcript");
                }
            }
        } catch (e) {
            console.warn("Could not find transcript:", e);
        }

        // Scrape syllabus
        try {
            const syllabusContainer = await waitForElement('.rc-WeekView');
            if (syllabusContainer) {
                const weeks = Array.from(syllabusContainer.querySelectorAll('.week'));
                courseData.syllabus = weeks.map(week => ({
                    title: week.querySelector('.week-title')?.textContent?.trim(),
                    content: Array.from(week.querySelectorAll('.lesson-item')).map(lesson => ({
                        title: lesson.querySelector('.lesson-name')?.textContent?.trim(),
                        type: lesson.querySelector('.lesson-type')?.textContent?.trim()
                    }))
                }));
                console.log("Found syllabus");
            }
        } catch (e) {
            console.warn("Could not find syllabus:", e);
        }

        // Store the scraped data
        if (courseData.currentLecture.transcript) {
            const url = window.location.href;
            accumulatedTranscripts.set(url, {
                title: courseData.currentLecture.title,
                transcript: courseData.currentLecture.transcript
            });
            courseData.transcripts = Object.fromEntries(accumulatedTranscripts);
        }

        console.log("Final scraped data:", courseData);
        return courseData;
    } catch (error) {
        console.error("Error scraping course data:", error);
        return null;
    }
}

// Initialize conversation with enhanced context
function initializeConversation(courseData) {
    const courseContext = `
        Course: ${courseData.title}
        Description: ${courseData.description}
        Level: ${courseData.details?.level || 'Not specified'}
        Duration: ${courseData.details?.duration || 'Not specified'}
        
        Syllabus Overview:
        ${courseData.syllabus.map(module => 
            `- ${module.title}
             ${module.content.map(lesson => `  • ${lesson.title}`).join('\n')}`
        ).join('\n')}
        
        Instructors:
        ${courseData.instructors.map(instructor => 
            `- ${instructor.name}${instructor.title ? ` (${instructor.title})` : ''}`
        ).join('\n')}

        Current Lecture: ${courseData.currentLecture.title}
        
        Accumulated Lecture Transcripts:
        ${Object.entries(courseData.transcripts).map(([url, data]) => 
            `--- Lecture: ${data.title} ---\n${data.transcript}\n`
        ).join('\n')}
    `.trim();

    conversationHistory = [{
        role: "user",
        parts: [{
            text: `You are a Coursera teaching assistant for: "${courseData.title}". 
                  
                  Here is the course context:
                  ${courseContext}
                  
                  Instructions:
                  1. Only answer questions related to this specific course and its content
                  2. If a question is inappropriate or unrelated to the course, respond with exactly:
                     "Please keep the questions related to the scope of this course."
                  3. Use the course context to provide accurate, helpful responses
                  4. Keep responses concise and focused
                  
                  Acknowledge that you understand these instructions.`
        }]
    }, {
        role: "model",
        parts: [{
            text: "I understand. I'm your Coursera Assistant for this course. I'll help you understand the course material while keeping responses focused and course-related. What would you like to know about the course?"
        }]
    }];
}

// Create and append chat button
function createChatButton() {
    // Remove any existing chat button first
    const existingButton = document.querySelector('.course-assistant-chat-button');
    if (existingButton) {
        existingButton.remove();
    }

    const chatButton = document.createElement('div');
    chatButton.className = 'course-assistant-chat-button';
    chatButton.setAttribute('id', 'courseAssistantButton');
    chatButton.style.cssText = `
        position: fixed !important;
        bottom: 20px !important;
        right: 20px !important;
        z-index: 2147483647 !important;
        display: flex !important;
    `;
    chatButton.innerHTML = `
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M20 2H4C2.9 2 2 2.9 2 4V22L6 18H20C21.1 18 22 17.1 22 16V4C22 2.9 21.1 2 20 2ZM20 16H6L4 18V4H20V16Z" fill="currentColor"/>
        </svg>
    `;
    
    // Force append to body
    document.documentElement.appendChild(chatButton);
    
    return chatButton;
}

// Add a periodic check to ensure the button exists
function ensureChatButtonExists() {
    if (!document.querySelector('.course-assistant-chat-button')) {
        createChatButton();
    }
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

// Update generateResponse to better handle off-topic questions
async function generateResponse(prompt, courseContext) {
    try {
        // Allow common pleasantries
        const pleasantries = /^(hi|hey|hello|thanks|thank you|bye|goodbye|ok|okay)$/i;
        if (pleasantries.test(prompt.trim())) {
            return prompt.toLowerCase().includes('thank') ? 
                "You're welcome! What else would you like to know about the course?" :
                "Hello! How can I help you with this course?";
        }

        // Check for obviously inappropriate or unrelated content
        const inappropriatePatterns = [
            /\b(sex|porn|nude|dating|gambling|drugs|illegal|hack|crack|pirate)\b/i,
            /(how to cheat|exam answers|test answers|assignment solutions)/i,
            /(bitcoin|crypto|stock|investment advice|financial advice)/i,
            /\b(politics|religion|conspiracy|dating advice)\b/i
        ];

        if (inappropriatePatterns.some(pattern => pattern.test(prompt))) {
            return "Please keep the questions related to the scope of this course.";
        }

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

// Add mutation observer to detect lecture changes
function observeLectureChanges() {
    const observer = new MutationObserver((mutations) => {
        // Check if URL has changed (indicating lecture change)
        if (window.location.href !== lastUrl) {
            lastUrl = window.location.href;
            
            // Re-scrape data and update context
            const courseData = scrapeCourseData();
            initializeConversation(courseData);
            
            // Add system message about context update
            conversationHistory.push({
                role: "system",
                parts: [{
                    text: "Lecture context has been updated. I now have information about the new lecture content."
                }]
            });
        }
    });

    // Observe changes to the document
    observer.observe(document.body, {
        childList: true,
        subtree: true
    });
}

// Store last URL to detect changes
let lastUrl = window.location.href;

// Update init function to handle async scraping
async function init() {
    try {
        console.log("Initializing extension...");
        
        // Create button immediately
        const chatButton = createChatButton();
        const chatPopup = createChatPopup();
        
        // Set up event listeners
        setupEventListeners(chatButton, chatPopup, null);
        
        // Ensure button exists with more frequent checks initially
        const checkInterval = setInterval(ensureChatButtonExists, 1000);
        
        // After 10 seconds, reduce check frequency
        setTimeout(() => {
            clearInterval(checkInterval);
            setInterval(ensureChatButtonExists, 5000);
        }, 10000);
        
        // Then scrape course data
        const courseData = await scrapeCourseData();
        if (courseData) {
            console.log("Successfully scraped course data");
            initializeConversation(courseData);
        } else {
            console.error("Failed to scrape course data");
        }
    } catch (error) {
        console.error("Error during initialization:", error);
    }
}

// Helper function to set up event listeners
function setupEventListeners(chatButton, chatPopup, courseData) {
    chatButton.addEventListener('click', () => {
        chatPopup.classList.toggle('hidden');
    });
    
    chatPopup.querySelector('.close-button').addEventListener('click', () => {
        chatPopup.classList.add('hidden');
    });

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
            
            textarea.value = '';
            messagesContainer.scrollTop = messagesContainer.scrollHeight;

            const response = await generateResponse(text, courseData);
            
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

// Modified initialization
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
} 