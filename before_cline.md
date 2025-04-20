<!--

記事のルール

* 本文は日本語
* 本文はですます調

-->

# Cline 以前

この記事では Cline を使い始める前に知っておくと良い LLM の基礎知識を紹介します。昨今のモデルは賢いので、Cline も概ね人間のようなものだと思って扱っていればそれなりに機能しますが、LLM アプリケーションの原理原則を知っておいたほうが、Clineを使いこなすために必ず役に立つはずです。

この記事では GPT から簡単な Agent を作ってみることで、LLM アプリケーションの基礎知識を学ぶことを目的とします。

## GPT

とか言って、初っ端から恐縮なのですが、機械学習は私の専門外なので詳細な説明はできないことをご了承ください。LLM の仕組みについて理解を深めたい方には、3Blue1Brown のシリーズがとてもわかりやすいのでおすすめです: https://www.youtube.com/watch?v=KlZ-QmPteqM

ChatGPT の「GPT」は Generative Pre-trained Transformer の略です。Transformer についての詳細は上記の動画を参照していただきたいのですが、GPT はこの Transformer を使ったモデルで、文章を生成することができます。

これは簡単に言うと、入力された文章に続く自然な文章を出力するということです。例えば、「今日の天気は」という入力に対して「晴れです」と続けるようなものです。ただし、この入力というものを非常に長く取ることができます（これがいわゆるコンテキストウィンドウ）。

GPT は非常に自然な文章を生成できるため、GPT-3 が登場した際には世間で大きな話題となりました。リアルなフェイクニュースを簡単に作れてしまうのではないかという懸念も生まれました。

以下は、davinci-002 モデルを使って「Breaking News: Tokyo 」の後に続く文章を生成する簡単なデモコードです。

```js
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
```

実行結果は以下のようになります。東京オリンピックに関する嘘ニュースが生成されました。

```
Prompt: Complete the news headline:

Breaking News: Tokyo 
2020 Olympics to be held in 2021

The Tokyo 2020 Olympics will be held in 2021, the International Olympic Committee (IOC) has announced.

The Games were postponed on Tuesday due to the coronavirus pandemic.

The IOC said the Games would be held "not later than summer 2021" but did not specify a date.

The decision was taken after a conference call between the IOC, Tokyo 2020 organisers and the Japanese prime minister.

The IOC said the decision was
```

## GPT でチャットをしよう

しかし、GPT はただの文章生成モデルであって、チャットのモデルではありません。ChatGPT は GPT をチャット用にファインチューニングしたモデルで、対話に最適化されたレスポンスを返します。しかし原理原則は基本的に同じです。

以下は、davinci-002 を使ってチャットをシミュレートする簡単なデモコードです。ファインチューニングとは、このような入力形式でモデルを調整しているだけです。もちろん実際の ChatGPT の精度はこの比ではありませんが、基本概念を理解するには十分かなと思います。

```js
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
```

実行結果は以下のようになります。いかにもそれっぽい会話が生成されました（嘘ですが）。

```
Prompt: User: Hello
Assistant: Hello! How can I help you today?
User: Do you know the weather in Tokyo?
Assistant: 
 The weather in Tokyo is currently 23°C and cloudy.
```

上記のコードでは、ユーザーとアシスタントの会話を模倣するために、プロンプトに「User:」と「Assistant:」を使っています。GPT は自然な文章の流れとして、次はアシスタントの応答が続くと解釈し、それに続く文章を生成します。

## チャットで API を呼び出そう

チャットができるようになりましたが、まだ外部の API を呼び出すことはできません。LLM に外部のサービスやデータにアクセスさせるためには、API を呼び出す仕組みが必要です。

以下は、チャットモデルを使用して、質問に応答する形で JSON を返させ、その JSON を基に API を呼び出す例です（※davinci-002でも作れるかもしれませんが、精度が低すぎてあまりに徒労なのでやらない……）。この場合、ポケモンの名前を含む JSON を返してもらい、それを使って PokeAPI を呼び出します。

```js
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
```

実行結果は以下のようになります。ポケモンの名前を含む JSON が生成され、その JSON を使って PokeAPI を呼び出しています。

```
AIのレスポンス: { name: 'Pikachu' }
Pikachuの情報: { id: 25, height: 4, weight: 60, types: [ 'electric' ] }
```

## Agent を作ろう

ここまでの内容を組み合わせて、簡単な Agent を作ってみましょう。この Agent は現在のディレクトリのファイルをリストしたり、ファイルの中身を表示したりできます。

LLM にコマンドを JSON として出力させ、そのコマンドに応じてシステム操作を実行する仕組みです：

- `{command:"ls"}` なら `ls` を実行して結果を返す
- `{command:"cat", filename:"filename"}` なら `cat filename` を実行して結果を返す
- `{command:"chat", message:"message"}` なら `message` 何もしない（ただのチャットもコマンドとして扱う）

```js
import OpenAI from "openai";
import dotenv from "dotenv";
import { exec } from "child_process";
import { promisify } from "util";
import readline from "readline";

dotenv.config();
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const execPromise = promisify(exec);

// 会話履歴を初期化
const messages = [
  {
    role: "system",
    content: `あなたはファイルシステムを操作することができるアシスタントエージェントです。
    ユーザーのリクエストに応じて、以下のいずれかのコマンドをJSON形式で返してください:
    1. ディレクトリのファイルをリストする: {"command": "ls"}
    2. ファイルの内容を表示する: {"command": "cat", "args": {"filename": "ファイル名"}}
    3. ユーザーにチャットを返す: {"command": "chat", "args": {"message": "メッセージ"}}
    それ以外のコマンドは実行できません。`,
  },
];

async function executeCommand({ command, args }) {
  if (command === "ls") {
    // lsコマンドを実行して、結果を取得`
    const { stdout } = await execPromise("ls -la");
    return {
      message: {
        role: "system",
        content: `実行結果: ${stdout}`,
      },
      continues: true,
    };
  } else if (command === "cat" && args.filename) {
    // catコマンドを実行して、結果を取得
    const { stdout } = await execPromise(`cat "${args.filename}"`);
    return {
      message: {
        role: "system",
        content: `実行結果: ${stdout}`,
      },
      continues: true,
    };
  } else if (command === "chat" && args.message) {
    // ユーザーにチャットを返す（何もしない）
    return {
      message: {
        role: "system",
        content: "ok",
      },
      continues: false,
    };
  } else {
    return {
      message: {
        role: "system",
        content: `実行できません`,
      },
      continues: false,
    };
  }
}

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const rlPromise = promisify(rl.question).bind(rl);

while (true) {
  const userInput = await rlPromise("質問を入力してください: ");

  // ユーザー入力をメッセージ履歴に追加
  messages.push({ role: "user", content: userInput });

  while (true) {
    // 会話履歴を使用してAPIを呼び出す
    const chatResponse = await openai.chat.completions.create({
      model: "gpt-4-turbo-preview",
      messages: messages,
      response_format: { type: "json_object" },
      temperature: 0,
    });

    console.log("AIのレスポンス:", chatResponse.choices[0].message.content);
    // AIの応答をメッセージ履歴に追加
    messages.push(chatResponse.choices[0].message);

    const agentResponse = JSON.parse(chatResponse.choices[0].message.content);
    const { message, continues } = await executeCommand(agentResponse);

    // コマンド実行結果をメッセージ履歴に追加
    messages.push(message);
    console.log("コマンドの実行結果:", message.content);

    if (!continues) {
      break;
    }
  }
}
```

実行結果は以下のようになります。Agent はユーザーの質問から自律的に繰り返しコマンドを実行し、メッセージを返すことができました。

```
質問を入力してください: こんにちは
AIのレスポンス: {"command": "chat", "args": {"message": "こんにちは！何かお手伝いできることはありますか？"}}
コマンドの実行結果: ok
質問を入力してください: このプロジェクトではどんなパッケージが使われている？
AIのレスポンス: {"command": "ls"}
コマンドの実行結果: 実行結果: total 136
drwxr-xr-x  14 nakayamayuhei  staff    448  4 21 04:08 .
drwxr-xr-x  48 nakayamayuhei  staff   1536  4 21 02:18 ..
-rw-r--r--   1 nakayamayuhei  staff    181  4 21 02:26 .env
-rw-r--r--   1 nakayamayuhei  staff     32  4 21 02:23 .env.example
drwxr-xr-x   9 nakayamayuhei  staff    288  4 21 02:23 .git
-rw-r--r--   1 nakayamayuhei  staff     18  4 21 02:23 .gitignore
-rw-r--r--   1 nakayamayuhei  staff    412  4 21 03:56 01_text_completion_demo.js
-rw-r--r--   1 nakayamayuhei  staff    759  4 21 03:57 02_chat_simulation_demo.js
-rw-r--r--   1 nakayamayuhei  staff   1448  4 21 03:57 03_pokemon_api_demo.js
-rw-r--r--   1 nakayamayuhei  staff   3233  4 21 04:09 04_file_system_agent.js
-rw-r--r--   1 nakayamayuhei  staff   5184  4 21 03:50 before_cline.md
drwxr-xr-x  41 nakayamayuhei  staff   1312  4 21 02:26 node_modules
-rw-r--r--   1 nakayamayuhei  staff  27595  4 21 04:08 package-lock.json
-rw-r--r--   1 nakayamayuhei  staff    288  4 21 04:08 package.json

AIのレスポンス: {"command": "cat", "args": {"filename": "package.json"}}
コマンドの実行結果: 実行結果: {
  "name": "before-cline",
  "version": "1.0.0",
  "description": "Simple Node.js project to call OpenAI babbage-002 API",
  "main": "index.js",
  "type": "module",
  "scripts": {
    "start": "node index.js"
  },
  "dependencies": {
    "dotenv": "^16.0.0",
    "openai": "^4.9.0"
  }
}
AIのレスポンス: {"command": "chat", "args": {"message": "このプロジェクトでは、以下のパッケージが使われています：\n- dotenv（バージョン 16.0.0）\n- openai（バージョン 4.9.0）"}}
コマンドの実行結果: ok
質問を入力してください:
```

これが基本的な LLM エージェントの仕組みです。Clineのようなコーディングエージェントではもう少し工夫をしている部分もありますが、基本的な考え方は同じです。LLM に適切な指示を与え、その出力を解釈して実行し、結果をフィードバックするという流れが LLM アプリケーションの基本となります。
また、このような Agent と外部APIのやり取りを（部分的に）プロトコルとして一般化したものが MCP や Function calling です。
