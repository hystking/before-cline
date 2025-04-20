import OpenAI from "openai";
import dotenv from "dotenv";

dotenv.config();
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// promptでユーザーとアシスタントの会話をシミュレーション。最後にアシスタントが応答する部分を空白にしておく。
const prompt = `User: Hello
Assistant: Hello! How can I help you today?
User: Do you know the weather in Tokyo?
Assistant: `;
console.log("Prompt:", prompt);

// OpenAIのAPIを呼び出して、アシスタントの応答を生成
const response = await openai.completions.create({
  model: "davinci-002",
  prompt,
  max_tokens: 150,
  temperature: 0,
  stop: ["User:"], // User:が出てきたらストップ
});
console.log(response.choices[0].text);
