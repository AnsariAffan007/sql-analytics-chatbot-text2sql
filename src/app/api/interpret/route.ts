import TASK_MODELS from "@/data/models";
import { NextResponse } from "next/server";
import OpenAI from "openai";

const openaiClient = new OpenAI({
  baseURL: process.env.INTERPRETER_MODEL_URL,
  apiKey: process.env.INTERPRETER_MODEL_API_KEY,
});

// #region POST
export async function POST(request: Request) {

  const body = await request.json()

  let response: OpenAI.Chat.Completions.ChatCompletion | null = null

  try {
    response = await openaiClient.chat.completions.create({
      messages: [
        { role: "system", content: getSystemPrompt() },
        { role: "user", content: getUserPrompt(body.sqlOutput, body.prompt) }
      ],
      model: TASK_MODELS.interpret
    })
  }
  catch (e) {
    console.log("Error interpreting SQL Output: \n", e)
    return NextResponse.json(
      { data: "Something has gone wrong" },
      { status: 500 }
    )
  }

  return NextResponse.json(
    { data: response.choices[0].message.content },
    { status: 200 }
  )
}

const getSystemPrompt = () =>
  `
You will receive:
1. The output of a SQL query formatted as JSON.
2. A user prompt asking a question about the data.
Your task:
- Answer the user's question using ONLY the information present in the JSON.
- Treat the JSON as complete and authoritative.
- If the answer can be derived by reading, comparing, counting, or summarizing the JSON, you MUST do so.
- Do not say the data is insufficient unless the required fields are completely missing.
Rules:
- Do not invent or assume data outside the JSON.
- Do not generate SQL.
- Do not explain the JSON structure.
- Answer directly and concisely in natural language.
`

const getUserPrompt = (sqlOutput: unknown, prompt: string) =>
  `<SQLOUTPUT>${JSON.stringify(sqlOutput)}</SQLOUTPUT><USER_PROMPT>${prompt}</USER_PROMPT>`;