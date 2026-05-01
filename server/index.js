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
const MODELS = ["gemini-1.5-flash", "gemini-1.5-pro", "gemini-2.0-flash"];

// --- Local Fallback Engines (Bulletproof) ---

// 1. Local Search Engine (Weighted Keyword Matching & Phrase Matching)
function localKeywordSearch(query, catalog) {
  const q = query.toLowerCase().trim();
  
  // Stop words to filter out for keyword matching
  const STOP_WORDS = new Set(['i', 'want', 'related', 'find', 'show', 'give', 'please', 'with', 'from', 'each', 'very', 'this', 'that', 'the', 'and', 'for', 'a', 'an', 'in', 'of', 'to', 'is', 'it', 'my', 'your', 'notes', 'resource', 'document', 'file', 'sharing', 'hub']);
  
  // Extract keywords
  const keywords = q.split(/\s+/).filter(w => w.length > 2 && !STOP_WORDS.has(w));
  
  const results = catalog.map(item => {
    let score = 0;
    const title = item.title.toLowerCase();
    const subject = (item.subject || "").toLowerCase();
    const desc = (item.description || "").toLowerCase();
    const branch = (item.branch || "").toLowerCase();
    const fullText = `${title} ${subject} ${desc} ${branch}`;

    // 1. Exact Phrase Match (Huge Boost)
    if (fullText.includes(q)) score += 50;

    // 2. Keyword Match with Weighting
    keywords.forEach(word => {
      if (title.includes(word)) score += 10;
      if (subject.includes(word)) score += 15; // Subjects are very important
      if (desc.includes(word)) score += 2;
      if (branch.includes(word)) score += 5;
    });

    // 3. Penalty for very generic results if score is low
    // If the only match was "notes" or similar common academic word, keep score low
    if (keywords.length === 0 && score > 0) score = 1;

    return { ...item, score };
  });

  // Minimum relevance threshold to filter out garbage results
  const minThreshold = 5; 
  
  const filteredResults = results
    .filter(r => r.score >= minThreshold)
    .sort((a, b) => b.score - a.score);

  const matchingIds = filteredResults.map(r => r.id);

  return {
    ids: matchingIds.slice(0, 12),
    reason: matchingIds.length > 0 
      ? `Search results found via smart local matching for "${query}".`
      : "No highly relevant documents found. Try using different keywords.",
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
      const errorMsg = err.message || String(err);
      console.warn(`[AI Moderation] Model ${modelName} failed:`, errorMsg);
      if (errorMsg.includes("leaked")) {
        console.error("CRITICAL: Your Gemini API Key is leaked and blocked by Google.");
        break; // Don't keep trying if the key is leaked
      }
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
       const errorMsg = err.message || String(err);
       console.warn(`[AI Search] Model ${modelName} failed:`, errorMsg);
       if (errorMsg.includes("leaked")) {
         console.error("CRITICAL: Your Gemini API Key is leaked and blocked by Google.");
         break; // Don't keep trying if the key is leaked
       }
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
