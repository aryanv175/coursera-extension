# CourseMate (Coursera Assistant) - AI-Powered Learning Companion

## Overview
Coursera Assistant is a Chrome extension that enhances your learning experience on Coursera by providing real-time assistance through AI-powered interactions. It serves as a virtual teaching assistant, helping students better understand course content through natural conversations and visual analysis.

![image](https://github.com/user-attachments/assets/560fcf42-4d36-456f-a06f-accb8a9a2c9c)

## Core Features

### 🤖 Intelligent Course Assistant
- **Context-Aware Responses**: Utilizes Google's Gemini Pro API to provide accurate, course-specific answers
- **Continuous Learning**: Accumulates context from lectures and reading materials as you progress
- **Natural Interaction**: Maintains conversational flow while keeping responses focused on course content

### 📸 Visual Learning Support
- **Lecture Frame Analysis**: Uses Gemini Pro Vision API to analyze and explain specific moments in video lectures
- **Screenshot Functionality**: Allows students to capture and get instant explanations of complex visuals
- **Visual Context**: Helps understand diagrams, charts, and visual concepts presented in lectures

### 💡 Key Benefits
- **Immediate Clarification**: Get instant answers to course-related questions
- **Deep Understanding**: Receive detailed explanations of complex concepts
- **Visual Learning**: Better comprehension through visual content analysis
- **24/7 Availability**: Access help whenever you need it

<img width="1145" alt="image" src="https://github.com/user-attachments/assets/63aed9c3-e73f-4fd5-9313-04b5259d1192">


## Technical Implementation

### API Integration
- **Text Interactions**: Powered by `gemini-1.5-pro` model for contextual understanding
- **Visual Analysis**: Utilizes `gemini-1.5-pro-vision` for image processing
- **Real-time Processing**: Instant responses with maintained context

### Privacy & Security
- **User Authentication**: Using firebase for Google Authentication
- **Data Protection**: Processes only course-related content
- **User Privacy**: No personal data storage

## Monetization Strategy

### Revenue: Subscription Model

<img width="1194" alt="image" src="https://github.com/user-attachments/assets/91610f98-b9b3-4c6c-9450-568091bbe394">



### Payment Processing
- **Integration**: Stripe payment gateway
- **Flexible Plans**: Monthly subscription options at different price points

## Future Enhancements
- AI powered questionnaires
- Advanced learning analytics
- Personalized study recommendations
- Interactive concept visualization

## Installation
1. Clone the repository
2. Install dependencies: `npm install`
3. Configure API keys in `.env`
4. Build the extension: `npm run build`
5. Load in Chrome as unpacked extension

## Error Handling
- Error Handling and debugging methods in place.
Example. if API calls are unsuccessful:
<img width="313" alt="image" src="https://github.com/user-attachments/assets/2abd68b2-ac2a-4626-aaf6-ba0c88e1bb7f">
<img width="458" alt="image" src="https://github.com/user-attachments/assets/e6344b8d-512a-420b-b63c-f37307c0f3d0">


## License
This project is licensed under the Creative Commons Attribution-NonCommercial 4.0 International License - see the LICENSE file for details.
