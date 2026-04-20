import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenerativeAI } from '@google/generative-ai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(express.json({ limit: '10mb' }));

const apiKey = process.env.GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(apiKey || "");

// --- Model Priority List ---
const MODELS = ["gemini-2.0-flash", "gemini-flash-latest"];

// --- Local Fallback Engines (Bulletproof) ---

// 1. Local Search Engine (Weighted Keyword Matching)
function localKeywordSearch(query, catalog) {
  const q = query.toLowerCase();
  const words = q.split(/\s+/).filter(w => w.length > 2);
  
  const results = catalog.map(item => {
    let score = 0;
    const text = `${item.title} ${item.subject} ${item.description} ${item.branch}`.toLowerCase();
    
    words.forEach(word => {
      if (text.includes(word)) score += 1;
      // Bonus for exact matches in title/subject
      if (item.title.toLowerCase().includes(word)) score += 2;
      if (item.subject.toLowerCase().includes(word)) score += 3;
    });

    return { ...item, score };
  });

  const matchingIds = results
    .filter(r => r.score > 0)
    .sort((a, b) => b.score - a.score)
    .map(r => r.id);

  return {
    ids: matchingIds.slice(0, 8),
    reason: matchingIds.length > 0 
      ? `Search results found via smart keyword matching for "${query}".`
      : "No matching documents found in the current catalog.",
    source: 'LOCAL'
  };
}

// 2. Local Academic Moderator (Keyword validation)
function localAcademicScan(parts, subject) {
  const content = JSON.stringify(parts).toLowerCase();
  const sub = subject.toLowerCase();
  
  // Strict Academic Indicators (MUST have at least one)
  const strongAcademicKeywords = ['lecture', 'syllabus', 'exam', 'quiz', 'assignment', 'theorem', 'derivation', 'proof', 'algorithm', 'schema', 'normalization', 'packet', 'protocol', 'circuit', 'diagram', 'tutorial', 'lab'];
  
  // Rejection Indicators (If these exist, we are very suspicious)
  const rejectionKeywords = ['poster', 'flyer', 'register', 'event', 'workshop', 'webinar', 'meme', 'advertisement', 'promo', 'discount', 'free entry'];

  const hasStrongAcademic = strongAcademicKeywords.some(w => content.includes(w));
  const hasSubjectMatch = content.includes(sub);
  const hasRejectionWords = rejectionKeywords.some(w => content.includes(w));

  // Logic: Must have a strong academic indicator OR a subject match AND no rejection words
  if ((hasStrongAcademic || hasSubjectMatch) && !hasRejectionWords) {
    return {
      isAcademic: true,
      isSafe: true,
      summary: "Document verified via local heuristic match.",
      source: 'LOCAL'
    };
  }

  return {
    isAcademic: false,
    isSafe: true,
    summary: "Irrelevant or non-academic content detected (Local Engine).",
    source: 'LOCAL'
  };
}

// --- API Endpoints ---

// 1. Scan/Verification Endpoint
app.post('/api/scan', async (req, res) => {
  const { parts, subject } = req.body;
  
  if (!apiKey) {
    console.log("No API Key detected, using Local Fallback Scanner...");
    return res.json(localAcademicScan(parts, subject));
  }

  // Waterfall AI Call
  for (const modelName of MODELS) {
    try {
      const model = genAI.getGenerativeModel({ model: modelName });
      const promptText = `You are a strict content moderator for a college resource-sharing platform. 
The user is attempting to upload a document for the academic subject: "${subject}". 

You MUST carefully analyze the ACTUAL physical content inside.
Does it contain rigorous academic material (lecture notes, syllabus, exams, study guides) heavily relevant to "${subject}"?
If it is an event poster, flyer, advertisement, meme, or irrelevant, YOU MUST REJECT IT.

Return ONLY a JSON object:
{
  "isAcademic": boolean,
  "isSafe": boolean,
  "summary": "1-sentence description"
}`;
      
      const result = await model.generateContent([promptText, ...parts]);
      const text = result.response.text();
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
         const data = JSON.parse(jsonMatch[0]);
         return res.json({ ...data, source: 'AI' });
      }
    } catch (err) {
      console.warn(`Model ${modelName} failed/quota hit. Trying next...`, err.message);
    }
  }

  // Final Fallback
  console.log("All AI models failed (Quota/Error). Using Local Engine.");
  res.json(localAcademicScan(parts, subject));
});

// 2. Semantic Search Endpoint
app.post('/api/search', async (req, res) => {
  const { query, catalog } = req.body;

  if (!apiKey) {
    console.log("No API Key detected, using Local Fallback Search...");
    return res.json(localKeywordSearch(query, catalog));
  }

  // Waterfall AI Call
  for (const modelName of MODELS) {
    try {
      const model = genAI.getGenerativeModel({ model: modelName });
      const prompt = `Match query "${query}" to resource IDs in this list: ${JSON.stringify(catalog)}. Return ONLY JSON {ids: [], reason: ""}.`;
      
      const result = await model.generateContent(prompt);
      const text = result.response.text();
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const data = JSON.parse(jsonMatch[0]);
        return res.json({ ...data, source: 'AI' });
      }
    } catch (err) {
       console.warn(`Model ${modelName} failed/quota hit. Trying next...`, err.message);
    }
  }

  // Final Fallback
  console.log("All AI models failed (Quota/Error). Using Local Engine.");
  res.json(localKeywordSearch(query, catalog));
});

// --- Serve Frontend Static Files ---
app.use(express.static(path.join(__dirname, '../dist')));

// --- API Endpoints ---
// (API routes go here, before the wildcard catch-all)

// ... existing routes ...

// Catch-all route to serve the frontend for any non-API requests (SPA support)
app.use((req, res, next) => {
  if (req.method === 'GET' && !req.path.startsWith('/api')) {
    const indexPath = path.join(__dirname, '../dist/index.html');
    res.sendFile(indexPath, (err) => {
      if (err) {
        console.error("Index.html not found at:", indexPath);
        res.status(404).send("Front-end build (dist/index.html) not found. Did you run 'npm run build'?");
      }
    });
  } else {
    next();
  }
});

app.listen(port, () => {
  console.log(`\n🚀 Bulletproof AI Bridge running on port ${port}`);
});
