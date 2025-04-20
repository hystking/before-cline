import OpenAI from "openai";
import dotenv from "dotenv";
import fetch from "node-fetch";

dotenv.config();
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// ポケモンAPIからポケモン情報を取得する関数
async function getPokemonInfo(pokemonName) {
  const response = await fetch(
    `https://pokeapi.co/api/v2/pokemon/${pokemonName.toLowerCase()}`
  );
  return await response.json();
}

// チャットモデルにJSONを返すように指示
const chatResponse = await openai.chat.completions.create({
  model: "gpt-4-turbo-preview", // gpt-4.1-miniが利用できない場合の代替
  messages: [
    {
      role: "system",
      content:
        'Answer the user\'s question and return the name of a Pokémon in JSON format {"name": "pokemon_name"}. The name should be English.',
    },
    { role: "user", content: "かわいいポケモンを1匹教えて" },
  ],
  response_format: { type: "json_object" }, // レスポンスをJSONにしてくれる便利なオプション。これもファインチューニングされてるのか？
  temperature: 0,
});

// 返されたJSONをパース
const jsonResponse = JSON.parse(chatResponse.choices[0].message.content);
console.log("AIのレスポンス:", jsonResponse);

// JSONからポケモン名を取得してAPIを呼び出す
const pokemonData = await getPokemonInfo(jsonResponse.name);

console.log(`${jsonResponse.name}の情報:`, {
  id: pokemonData.id,
  height: pokemonData.height,
  weight: pokemonData.weight,
  types: pokemonData.types.map((t) => t.type.name),
});
