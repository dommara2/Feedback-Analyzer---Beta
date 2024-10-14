import { config } from 'dotenv';
import OpenAI from 'openai';
import * as XLSX from 'xlsx';

config();

let openai;
try {
  openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
} catch (error) {
  console.error('Error initializing OpenAI:', error);
}

export async function handler(event) {
  if (event.httpMethod !== 'POST') {
    return { 
      statusCode: 405, 
      body: JSON.stringify({ error: 'Method Not Allowed' }),
      headers: { 'Content-Type': 'application/json' }
    };
  }

  if (!openai) {
    console.error('OpenAI client not initialized');
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'OpenAI client not initialized. Please check your API key configuration.' }),
      headers: { 'Content-Type': 'application/json' }
    };
  }

  try {
    console.log('Received file upload request');
    const buffer = Buffer.from(event.body, 'base64');
    console.log('File size:', buffer.length, 'bytes');

    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet);

    console.log('Processed file. Row count:', data.length);

    if (data.length === 0) {
      console.log('Uploaded file is empty');
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'The uploaded file is empty or contains no valid data.' }),
        headers: { 'Content-Type': 'application/json' }
      };
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
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'Received an empty response from OpenAI. Please try again.' }),
        headers: { 'Content-Type': 'application/json' }
      };
    }

    const analysis = completion.choices[0].message.content;
    console.log('Analysis completed successfully');

    return {
      statusCode: 200,
      body: JSON.stringify({ analysis }),
      headers: { 'Content-Type': 'application/json' }
    };
  } catch (error) {
    console.error('Error during analysis:', error);
    let errorMessage = 'An error occurred during analysis. Please try again or contact support.';
    if (error instanceof Error) {
      errorMessage += ` Error details: ${error.message}`;
    }
    return {
      statusCode: 500,
      body: JSON.stringify({ error: errorMessage }),
      headers: { 'Content-Type': 'application/json' }
    };
  }
}