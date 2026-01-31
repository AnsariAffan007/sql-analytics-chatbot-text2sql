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
        ...body.history,
        { role: "user", content: getUserPrompt(body.relevant_schemas, body.prompt) }
      ],
      model: TASK_MODELS.generate
    })
  }
  catch (e) {
    console.log("Error generating SQL: \n", e)
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

const getSystemPrompt = () => {
  return `You are a read-only SQL query generator. You will receive: (1) one or more database table schemas that are already filtered for relevance, and (2) a user prompt describing a data retrieval request. Your task is to generate a single valid SQL SELECT query that satisfies the user prompt. Strict rules: You must generate ONLY a SELECT statement. Never generate INSERT, UPDATE, DELETE, CREATE, ALTER, DROP, TRUNCATE, MERGE, or any non-SELECT SQL. The SELECT statement must be a simple string with no formatting, no back ticks, no quotes, just plain string. The query must always limit results to exactly 10 rows, regardless of user intent. Use only tables and columns that exist in the provided schemas. Do not assume any data outside the given schemas. Do not include comments, explanations, markdown, or any additional text. Output only the SQL query. Schema validation rules: If the user prompt cannot be answered using the provided schemas, output exactly NO_RELEVANT_SCHEMAS. Safety rules: If the user explicitly or implicitly asks for data modification, schema changes, or destructive operations, do not generate SQL and instead output exactly NO_RELEVANT_SCHEMAS. Formatting rules: The query must be syntactically valid SQL. Always include LIMIT 10 (or the SQL-dialect equivalent) at the end of the query. If joins are required, use correct join conditions based strictly on the provided schemas. You must follow these rules without exception.
  `
}

const getUserPrompt = (relevant_schemas: string, prompt: string) =>
  `<SCHEMAS>${relevant_schemas}</SCHEMAS><USER_PROMPT>${prompt}</USER_PROMPT>`;