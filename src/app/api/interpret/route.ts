import TASK_MODELS from "@/data/models";
import { NextResponse } from "next/server";
import OpenAI from "openai";

const openaiClient = new OpenAI({
  baseURL: "http://localhost:11434/v1/",
  apiKey: "ollama",
  dangerouslyAllowBrowser: true
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
  "You are a data assistant. You will receive: (1) the output of a SQL query formatted as JSON, and (2) a user prompt asking a question about the data. Your task is to answer the user's question using **only the information present in the JSON**. Do not invent, assume, or fetch data from outside the JSON. Do not modify the JSON or generate SQL. Provide answers in clear, natural language, concise and relevant to the user's prompt. If the JSON does not contain enough information to answer the question, respond exactly: 'NO_RELEVANT_DATA'."

const getUserPrompt = (sqlOutput: unknown, prompt: string) =>
  `<SQLOUTPUT>${JSON.stringify(sqlOutput)}</SQLOUTPUT><USER_PROMPT>${prompt}</USER_PROMPT>`;