import express from 'express';
import multer from 'multer';
import cors from 'cors';
import { config } from 'dotenv';
import OpenAI from 'openai';
import * as XLSX from 'xlsx';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

config();

const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'dist')));

const upload = multer({ storage: multer.memoryStorage() });

let openai;
try {
  openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
} catch (error) {
  console.error('Error initializing OpenAI:', error);
}

app.post('/api/analyze', upload.single('file'), async (req, res) => {
  console.log('Received file upload request');
  if (!req.file) {
    console.log('No file uploaded');
    return res.status(400).json({ error: 'No file uploaded.' });
  }

  if (!openai) {
    console.error('OpenAI client not initialized');
    return res.status(500).json({ error: 'OpenAI client not initialized. Please check your API key configuration.' });
  }

  try {
    console.log('Processing file...');
    const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet);

    if (data.length === 0) {
      console.log('Uploaded file is empty');
      return res.status(400).json({ error: 'The uploaded file is empty or contains no valid data.' });
    }

    console.log('Sending request to OpenAI...');
    const prompt = `Analyze the following workshop feedback data and provide recommendations for future topics or speakers:

${JSON.stringify(data, null, 2)}

Please provide insights on:
1. Most popular topics or workshops
2. Highly rated speakers
3. Areas for improvement
4. Recommendations for future topics or speakers based on the feedback`;

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: prompt }],
    });

    if (!completion.choices || completion.choices.length === 0) {
      console.error('OpenAI API returned an empty response');
      return res.status(500).json({ error: 'Received an empty response from OpenAI. Please try again.' });
    }

    const analysis = completion.choices[0].message.content;
    console.log('Analysis completed successfully');

    res.json({ analysis });
  } catch (error) {
    console.error('Error during analysis:', error);
    let errorMessage = 'An error occurred during analysis. Please try again or contact support.';
    if (error instanceof Error) {
      errorMessage += ` Error details: ${error.message}`;
    }
    res.status(500).json({ error: errorMessage });
  }
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});