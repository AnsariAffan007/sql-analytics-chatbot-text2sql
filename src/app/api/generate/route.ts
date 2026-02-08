import TASK_MODELS from "@/data/models";
import { NextResponse } from "next/server";
import OpenAI from "openai";

const openaiClient = new OpenAI({
  baseURL: process.env.GENERATOR_MODEL_URL,
  apiKey: process.env.GENERATOR_MODEL_API_KEY,
});

// #region POST
export async function POST(request: Request) {

  const body = await request.json()

  let response: OpenAI.Chat.Completions.ChatCompletion | null = null

  try {
    response = await openaiClient.chat.completions.create({
      messages: [
        { role: "system", content: getSystemPrompt() },
        {
          role: "user",
          content: getUserPrompt(
            body.relevant_schemas,
            body.prompt,
            (body.previousError && body.previousQuery) ? body.previousError : undefined,
            (body.previousError && body.previousQuery) ? body.previousQuery : undefined,
          )
        }
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
  return `
You are a read-only SQL query generator. You will receive: 
(1) <SCHEMAS> - one or more database table schemas that are already filtered for relevance, 
(2) <USER_PROMPT> - a user prompt describing a data retrieval request. 
Your task is to generate a single valid SQL SELECT query that satisfies the user prompt. 
Strict rules: 
- You must generate ONLY a SELECT statement. 
- Never generate INSERT, UPDATE, DELETE, CREATE, ALTER, DROP, TRUNCATE, MERGE, or any non-SELECT SQL. 
- The query must always limit results to exactly 10 rows, regardless of user intent. 
- Use only tables and columns that exist in the provided schemas. Do not hallucinate tables, relations, columns.
- Do not include formatting, back ticks, quotes.
- Do not include comments, explanations, markdown, or any additional text.
- Every selected column must be fully qualified with its table name. Columns should only be selected from relevant tables.
Schema validation rules: 
- If the user prompt cannot be answered using the provided schemas, output exactly NO_RELEVANT_SCHEMAS.
Safety rules: 
- If the user explicitly or implicitly asks for data modification, schema changes, or destructive operations, do not generate SQL and instead output exactly OPERATION_NOT_ALLOWED. 
Formatting rules: 
- The query must be syntactically valid SQL string. 
- Always include LIMIT 10 (or the SQL-dialect equivalent) at the end of the query. 
- If joins are required, use correct join conditions based strictly on the provided schemas. 
RETRY RULES:
If a <PREVIOUS_QUERY> and <PREVIOUS_ERROR> block is present:
- You must MODIFY the previous query instead of generating a new one.
- Fix the query using the error message as guidance.
- You MAY remove invalid columns or replace them with valid columns from the SAME table.
- You MUST NOT introduce new tables.
- Simplify the query if needed.
You must follow these rules without exception.
`
}

const getUserPrompt = (
  relevant_schemas: string,
  prompt: string,
  previousError?: string,
  previousQuery?: string
) =>
  `<SCHEMAS>${relevant_schemas}</SCHEMAS><USER_PROMPT>${prompt}</USER_PROMPT>`
  + (previousError ? `<PREVIOUS_ERROR>${previousError}</PREVIOUS_ERROR>` : '')
  + (previousQuery ? `<PREVIOUS_QUERY>${previousQuery}</PREVIOUS_QUERY>` : '');