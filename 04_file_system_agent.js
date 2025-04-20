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
