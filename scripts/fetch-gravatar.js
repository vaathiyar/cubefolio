import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import https from 'https';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// PLACEHOLDER: Replace with your actual email
const EMAIL = 'krishtna999@gmail.com';

const hash = crypto.createHash('md5').update(EMAIL.trim().toLowerCase()).digest('hex');
const gravatarUrl = `https://www.gravatar.com/avatar/${hash}?s=200&d=identicon`;
const outputPath = path.join(__dirname, '../public/favicon.png');

console.log(`Fetching Gravatar for ${EMAIL}...`);

https.get(gravatarUrl, (response) => {
    if (response.statusCode !== 200) {
        console.error(`Failed to fetch image. Status Code: ${response.statusCode}`);
        process.exit(1);
    }

    const file = fs.createWriteStream(outputPath);
    response.pipe(file);

    file.on('finish', () => {
        file.close();
        console.log(`Favicon saved to ${outputPath}`);
    });
}).on('error', (err) => {
    fs.unlink(outputPath, () => { });
    console.error(`Error fetching image: ${err.message}`);
    process.exit(1);
});
