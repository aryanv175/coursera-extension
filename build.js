const fs = require('fs');
require('dotenv').config();

const config = {
    GEMINI_API_KEY: process.env.GEMINI_API_KEY
};

fs.writeFileSync(
    'config.js',
    `const config = ${JSON.stringify(config, null, 2)};`
); 