import OpenAI from "openai";
import dotenv from "dotenv";

dotenv.config();
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const prompt = `Complete the news headline:

Breaking News: Tokyo `

console.log("Prompt:", prompt);

const response = await openai.completions.create({
  model: "davinci-002",
  prompt,
  max_tokens: 100,
  temperature: 0,
});

console.log(response.choices[0].text);
