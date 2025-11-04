// geminiClient.js

import { GoogleGenAI } from "@google/genai";
import * as dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config(); 

// Initialize the GoogleGenAI client.
// It automatically looks for the GEMINI_API_KEY environment variable.
const ai = new GoogleGenAI({});

// Export the client for use in other parts of your application
export default ai;