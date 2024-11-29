# Coursera Assistant - AI-Powered Learning Companion

## Overview
Coursera Assistant is a Chrome extension that enhances your learning experience on Coursera by providing real-time assistance through AI-powered interactions. It serves as a virtual teaching assistant, helping students better understand course content through natural conversations and visual analysis.

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

## Technical Implementation

### API Integration
- **Text Interactions**: Powered by `gemini-1.5-pro` model for contextual understanding
- **Visual Analysis**: Utilizes `gemini-1.5-pro-vision` for image processing
- **Real-time Processing**: Instant responses with maintained context

### Privacy & Security
- **Data Protection**: Processes only course-related content
- **Secure Communication**: Encrypted API interactions
- **User Privacy**: No personal data storage

## Monetization Strategy

### Subscription Model
- **Free Tier**: Basic course assistance with limited queries
- **Premium Features**:
  - Unlimited AI interactions
  - Visual analysis capability
  - Advanced concept explanations
  - Personalized learning insights

### Payment Processing
- **Integration**: Stripe payment gateway
- **Flexible Plans**: Monthly and annual subscription options
- **Secure Transactions**: PCI-compliant payment processing

## Future Enhancements
- Advanced learning analytics
- Personalized study recommendations
- Interactive concept visualization
- Cross-course knowledge integration

## Installation
1. Clone the repository
2. Install dependencies: `npm install`
3. Configure API keys in `.env`
4. Build the extension: `npm run build`
5. Load in Chrome as unpacked extension

## Support
For questions or support, please open an issue in the repository or contact our support team.

## License
This project is licensed under the ISC License - see the LICENSE file for details.
