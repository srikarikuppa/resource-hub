import { GoogleGenerativeAI } from '@google/generative-ai';
import fs from 'fs';

let apiKey = '';
try {
  const envFile = fs.readFileSync('.env', 'utf8');
  const match = envFile.match(/VITE_GEMINI_API_KEY=(.*)/);
  if (match) apiKey = match[1].trim().replace(/^['"]|['"]$/g, '');
} catch(e) {}

if (!apiKey) {
  console.log("API Key missing");
  process.exit(1);
}

const genAI = new GoogleGenerativeAI(apiKey);
const modelsToTest = [
    "gemini-2.5-flash",
    "gemini-2.0-flash",
    "gemini-1.5-flash",
    "gemini-1.5-flash-latest",
    "gemini-1.5-flash-8b",
    "gemini-1.5-pro",
    "gemini-pro",
    "gemini-pro-vision"
];

async function testAll() {
    console.log("Starting model compatibility test...");
    for (const m of modelsToTest) {
        try {
            const model = genAI.getGenerativeModel({ model: m });
            await model.generateContent("say exactly OK");
            console.log(`[SUCCESS] ${m}`);
        } catch(e) {
            console.log(`[FAILED] ${m} -> ${e.message.includes('[429') ? 'Quota Exceeded (429)' : e.message.includes('[404') ? 'Not Found (404)' : e.message.includes('[400') ? 'Bad Request (400) - API Key Invalid?' : e.message.includes('[403') ? 'Forbidden (403)' : e.message}`);
        }
    }
}
testAll();
