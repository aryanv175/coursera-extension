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

// Enhanced scraping function to handle both video lectures and reading materials
async function scrapeCourseData() {
    try {
        const currentUrl = window.location.href;
        console.log("Starting course data scraping for URL:", currentUrl);
        
        // Wait for content to load
        await new Promise(resolve => setTimeout(resolve, 3000));

        const courseData = {
            title: document.querySelector('h1')?.textContent?.trim() || 'Coursera Course',
            currentLecture: {
                title: '',
                content: '',
                type: '' // 'video' or 'reading'
            },
            transcripts: {}
        };

        // Determine content type based on URL
        if (currentUrl.includes('/lecture/')) {
            courseData.currentLecture.type = 'video';
            console.log("Detected video lecture content");
            
            // Get video lecture title
            const lectureTitle = document.querySelector('.rc-LectureName, .title')?.textContent?.trim();
            courseData.currentLecture.title = lectureTitle || 'Current Video Lecture';
            
            // Try to click transcript button if it exists and transcript is not visible
            const transcriptButton = document.querySelector('button[aria-label="Show transcript"]');
            if (transcriptButton && !document.querySelector('.phrases')) {
                transcriptButton.click();
                await new Promise(resolve => setTimeout(resolve, 1000));
            }

            // Get transcript content from phrases div
            const phrasesDiv = document.querySelector('.phrases');
            if (phrasesDiv) {
                const transcriptParts = Array.from(phrasesDiv.querySelectorAll('span'))
                    .map(span => span.textContent?.trim())
                    .filter(text => text && text.length > 0);

                if (transcriptParts.length > 0) {
                    courseData.currentLecture.content = transcriptParts.join(' ');
                    console.log("=== Scraped Video Transcript ===");
                    console.log(`Found ${transcriptParts.length} transcript segments`);
                    console.log("Sample:", courseData.currentLecture.content.substring(0, 200));
                    console.log("Full length:", courseData.currentLecture.content.length);
                    console.log("========================");
                }
            }
        } 
        else if (currentUrl.includes('/supplement/')) {
            courseData.currentLecture.type = 'reading';
            console.log("Detected reading material content");
            
            // Get reading material title
            const readingTitle = document.querySelector('h1, .title')?.textContent?.trim();
            courseData.currentLecture.title = readingTitle || 'Current Reading Material';
            
            // Get reading content
            const readingContent = document.querySelector('.css-1474zrz');
            if (readingContent) {
                courseData.currentLecture.content = readingContent.textContent.trim();
                console.log("=== Scraped Reading Content ===");
                console.log("Sample:", courseData.currentLecture.content.substring(0, 200));
                console.log("Full length:", courseData.currentLecture.content.length);
                console.log("========================");
            } else {
                console.warn("Could not find reading content with class css-1474zrz");
            }
        }

        // Store content with URL as key
        if (courseData.currentLecture.content) {
            accumulatedTranscripts.set(currentUrl, {
                title: courseData.currentLecture.title,
                type: courseData.currentLecture.type,
                content: courseData.currentLecture.content
            });
        }

        // Add all accumulated content to course data
        courseData.transcripts = Object.fromEntries(accumulatedTranscripts);

        return courseData;
    } catch (error) {
        console.error("Error scraping course data:", error);
        return null;
    }
}

// Update initialization conversation to handle both content types
function initializeConversation(courseData) {
    const contentContext = Object.entries(courseData.transcripts)
        .map(([url, data]) => `
            ${data.type === 'video' ? 'Video Lecture' : 'Reading Material'}: ${data.title}
            Content: ${data.content}
        `).join('\n\n');

    // Instead of storing conversation history, just log the initialization
    console.log("Initialized with course context:", {
        title: courseData.title,
        currentMaterial: courseData.currentLecture.title,
        type: courseData.currentLecture.type
    });
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

// Update generateResponse function to properly use course content
async function generateResponse(prompt, courseData) {
    try {
        // Handle pleasantries
        const pleasantries = /^(hi|hey|hello|thanks|thank you|bye|goodbye|ok|okay)$/i;
        if (pleasantries.test(prompt.trim())) {
            return prompt.toLowerCase().includes('thank') ? 
                "You're welcome! What else would you like to know about the course?" :
                "Hello! How can I help you with this course?";
        }

        // Check for inappropriate content
        const inappropriatePatterns = [
            /\b(sex|porn|nude|dating|gambling|drugs|illegal|hack|crack|pirate)\b/i,
            /(how to cheat|exam answers|test answers|assignment solutions)/i,
            /(bitcoin|crypto|stock|investment advice|financial advice)/i,
            /\b(politics|religion|conspiracy|dating advice)\b/i
        ];

        if (inappropriatePatterns.some(pattern => pattern.test(prompt))) {
            return "Please keep the questions related to the scope of this course.";
        }

        // Create a formatted context from all accumulated transcripts
        const courseContext = Object.entries(courseData.transcripts)
            .map(([url, data]) => `
                === ${data.type === 'video' ? 'Video Lecture' : 'Reading Material'}: ${data.title} ===
                ${data.content}
            `).join('\n\n');

        console.log("Sending context to Gemini:", {
            courseTitle: courseData.title,
            currentLecture: courseData.currentLecture.title,
            contextLength: courseContext.length,
            transcriptsCount: Object.keys(courseData.transcripts).length
        });

        const response = await fetch(`${API_URL}?key=${config.GEMINI_API_KEY}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                contents: [{
                    parts: [{
                        text: `You are the Coursera Assistant for the course "${courseData.title}".
                              Current lecture/reading: "${courseData.currentLecture.title}"
                              
                              Use this course content to answer the question:
                              ${courseContext}
                              
                              Student's question: ${prompt}
                              
                              Remember to:
                              1. Base your answer on the course content provided above
                              2. If the answer isn't in the content, say so
                              3. Keep responses focused and relevant to the course material`
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

        if (!response.ok) {
            const errorData = await response.json();
            console.error('API Error:', errorData);
            throw new Error(`API error: ${errorData.error?.message || 'Unknown error'}`);
        }

        const data = await response.json();
        console.log('API Response:', data);
        
        if (data.candidates && data.candidates[0].content) {
            let responseText = data.candidates[0].content.parts[0].text;
            
            // Clean up formatting
            responseText = responseText.replace(/\*\*(.*?)\*\*/g, '$1');
            
            return responseText;
        } else {
            throw new Error('No response generated');
        }
    } catch (error) {
        console.error('Error details:', error);
        return `I apologize, but I encountered an error: ${error.message}. Please try again.`;
    }
}

// Update URL change detection
function observeUrlChanges() {
    let lastUrl = window.location.href;
    
    setInterval(async () => {
        const currentUrl = window.location.href;
        if (currentUrl !== lastUrl) {
            console.log("URL changed, waiting for new content to load...");
            lastUrl = currentUrl;
            
            // Wait for content to load
            await new Promise(resolve => setTimeout(resolve, 3000));
            
            // Re-scrape data
            const newCourseData = await scrapeCourseData();
            if (newCourseData) {
                console.log("New lecture content scraped, updating context...");
                initializeConversation(newCourseData);
                
                // Notify about context update
                conversationHistory.push({
                    role: "system",
                    parts: [{
                        text: `Updated context with new lecture: "${newCourseData.currentLecture.title}"`
                    }]
                });
            }
        }
    }, 1000);
}

// Add function to handle screenshots
async function captureVideoFrame(video) {
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d').drawImage(video, 0, 0);
    return canvas.toDataURL('image/jpeg');
}

// Function to convert base64 to binary
function base64ToBytes(base64) {
    const binString = atob(base64.split(',')[1]);
    return Uint8Array.from(binString, (m) => m.charCodeAt(0));
}

// Update the analyzeImageWithGemini function with the correct model
async function analyzeImageWithGemini(imageBase64) {
    try {
        console.log("Preparing to analyze image with Gemini Vision...");
        
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro-vision:generateContent?key=${config.GEMINI_API_KEY}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                contents: [{
                    parts: [{
                        text: "You are the Coursera Assistant. Please explain what you see in this video frame from the course lecture."
                    }, {
                        inline_data: {
                            mime_type: "image/jpeg",
                            data: imageBase64.split(',')[1]
                        }
                    }]
                }]
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            console.error('Gemini Vision API Error:', errorData);
            throw new Error(`API error: ${errorData.error?.message || 'Unknown error'}`);
        }

        const data = await response.json();
        console.log('Gemini Vision API Response:', data);

        if (data.candidates && data.candidates[0]?.content?.parts?.[0]?.text) {
            return data.candidates[0].content.parts[0].text;
        } else {
            throw new Error('No valid response from Gemini Vision API');
        }
    } catch (error) {
        console.error('Error analyzing image with Gemini Vision:', error);
        return "I apologize, but I encountered an error analyzing the image. Please try again or ask about the content directly.";
    }
}

// Update the screenshot button creation with higher z-index
function addScreenshotButton(video) {
    // First, find the video player container
    let videoContainer = video.closest('.video-container, .player-container, .rc-VideoMiniPlayer, [data-e2e="video-player"]');    
    if (!videoContainer) {
        // If no container found, find the closest parent with position relative/absolute
        videoContainer = video.closest('div');
        videoContainer.style.position = 'relative';
    }

    // Explicitly set container styles
    videoContainer.style.position = 'relative';
    videoContainer.style.zIndex = '1'; 
    
    // Remove any existing screenshot button
    const existingButton = videoContainer.querySelector('.screenshot-button-container');
    if (existingButton) {
        existingButton.remove();
    }

    const buttonContainer = document.createElement('div');
    buttonContainer.className = 'screenshot-button-container';
    buttonContainer.style.cssText = `
        position: absolute;
        top: 10px;
        right: 10px;
        z-index: 2147483646;
        opacity: 1 !important;
        visibility: visible !important;
        display: block !important;
    `;

    const button = document.createElement('button');
    button.className = 'screenshot-button';
    button.innerHTML = `
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 15.2C13.7673 15.2 15.2 13.7673 15.2 12C15.2 10.2327 13.7673 8.8 12 8.8C10.2327 8.8 8.8 10.2327 8.8 12C8.8 13.7673 10.2327 15.2 12 15.2Z" fill="white"/>
            <path d="M9 3L7.17 5H4C2.9 5 2 5.9 2 7V19C2 20.1 2.9 21 4 21H20C21.1 21 22 20.1 22 19V7C22 5.9 21.1 5 20 5H16.83L15 3H9ZM12 17C9.24 17 7 14.76 7 12C7 9.24 9.24 7 12 7C14.76 7 17 9.24 17 12C17 14.76 14.76 17 12 17Z" fill="white"/>
        </svg>
    `;
    button.style.cssText = `
        background: rgba(0, 0, 0, 0.7);
        border: 2px solid rgba(255, 255, 255, 0.8);
        border-radius: 50%;
        padding: 8px;
        cursor: pointer;
        transition: all 0.2s ease;
        width: 44px;
        height: 44px;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 2px 8px rgba(0,0,0,0.2);
        opacity: 1 !important;
        visibility: visible !important;
    `;

    button.addEventListener('mouseover', () => {
        button.style.backgroundColor = 'rgba(0, 0, 0, 0.9)';
        button.style.transform = 'scale(1.1)';
    });

    button.addEventListener('mouseout', () => {
        button.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
        button.style.transform = 'scale(1)';
    });

    button.addEventListener('click', async () => {
        try {
            video.pause();
            console.log("Capturing video frame...");
            const imageBase64 = await captureVideoFrame(video);
            console.log("Video frame captured successfully");
            
            const chatPopup = document.querySelector('.course-assistant-popup');
            const messagesContainer = chatPopup.querySelector('.chat-messages');
            
            chatPopup.classList.remove('hidden');
            
            // Add screenshot message
            messagesContainer.innerHTML += `
                <div class="message user">
                    <div class="message-content">
                        <img src="${imageBase64}" style="max-width: 100%; border-radius: 8px; margin-bottom: 8px;">
                        <div style="font-size: 12px; color: #666;">Screenshot from lecture</div>
                    </div>
                </div>
            `;
            
            // Add loading message
            const loadingMessage = document.createElement('div');
            loadingMessage.className = 'message assistant';
            loadingMessage.innerHTML = `
                <div class="message-avatar">C</div>
                <div class="message-content loading">Analyzing screenshot...</div>
            `;
            messagesContainer.appendChild(loadingMessage);
            
            messagesContainer.scrollTop = messagesContainer.scrollHeight;
            
            console.log("Sending image to Gemini Vision API...");
            const analysis = await analyzeImageWithGemini(imageBase64);
            console.log("Received analysis from Gemini Vision API");
            
            loadingMessage.innerHTML = `
                <div class="message-avatar">C</div>
                <div class="message-content">${analysis}</div>
            `;
            
            messagesContainer.scrollTop = messagesContainer.scrollHeight;
        } catch (error) {
            console.error("Error processing screenshot:", error);
            const chatPopup = document.querySelector('.course-assistant-popup');
            const messagesContainer = chatPopup.querySelector('.chat-messages');
            
            messagesContainer.innerHTML += `
                <div class="message assistant">
                    <div class="message-avatar">C</div>
                    <div class="message-content">I apologize, but I encountered an error processing the screenshot. Please try again.</div>
                </div>
            `;
        }
    });

    buttonContainer.appendChild(button);
    videoContainer.appendChild(buttonContainer);

    // Add periodic check to ensure button remains visible
    const visibilityCheck = setInterval(() => {
        if (!document.body.contains(buttonContainer)) {
            videoContainer.appendChild(buttonContainer);
        }
        buttonContainer.style.display = 'flex';
        buttonContainer.style.visibility = 'visible';
        buttonContainer.style.opacity = '1';
        button.style.visibility = 'visible';
        button.style.opacity = '1';
    }, 1000);

    // Update init function to check for video and add button
    if (window.location.href.includes('/lecture/')) {
        const checkForVideo = setInterval(() => {
            const video = document.querySelector('video');
            if (video && !video.closest('.screenshot-button-container')) {
                addScreenshotButton(video);
            }
        }, 2000);
    }
}

// Update init function to add screenshot button when on video lectures
async function init() {
    try {
        console.log("Initializing extension...");
        
        // Create chat elements
        const chatButton = createChatButton();
        const chatPopup = createChatPopup();
        
        // Initial course data scraping
        const courseData = await scrapeCourseData();
        if (courseData) {
            console.log("Successfully scraped initial course data");
            initializeConversation(courseData);
            // Pass courseData to setupEventListeners
            setupEventListeners(chatButton, chatPopup, courseData);
        }
        
        observeUrlChanges();
        
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

            // Get latest course data before generating response
            const currentCourseData = await scrapeCourseData();
            const response = await generateResponse(text, currentCourseData);
            
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