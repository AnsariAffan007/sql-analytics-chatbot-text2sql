import DVD_RENTAL_SCHEMA from "@/data/dvd-rental-schema";
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
        { role: "user", content: getUserPrompt(body.prompt) }
      ],
      model: TASK_MODELS.filter
    })
  }
  catch (e) {
    console.log("Error filtering schemas: \n", e)
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
  `You are a database schema filter. You will receive: (1) a complete database schema containing multiple tables, and (2) a user prompt describing a task, query, or feature. Your job is to identify only the tables that are relevant to the user prompt. Include a table only if it is directly or indirectly required to fulfill the task. Preserve the exact original format of each selected table. Strict rules: Do not modify table names, column names, data types, comments, ordering, or formatting. Do not explain, summarize, or provide reasoning. Do not include irrelevant tables. Do not add new tables or fields. Output only the selected schemas, concatenated exactly as they were received. If no tables are relevant, output exactly NO_RELEVANT_SCHEMAS.`

const getUserPrompt = (prompt: string) =>
  `<SCHEMAS>${DVD_RENTAL_SCHEMA}</SCHEMAS><USER_PROMPT>${prompt}</USER_PROMPT>`;