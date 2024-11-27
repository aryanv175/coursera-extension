const fs = require('fs');
require('dotenv').config();

if (!process.env.GEMINI_API_KEY) {
    console.error('Error: GEMINI_API_KEY not found in .env file');
    process.exit(1);
}

const config = {
    GEMINI_API_KEY: process.env.GEMINI_API_KEY
};

console.log('Generating config.js with API key:', config.GEMINI_API_KEY.substring(0, 10) + '...');

fs.writeFileSync(
    'config.js',
    `const config = ${JSON.stringify(config, null, 2)};`
);

console.log('config.js generated successfully'); 