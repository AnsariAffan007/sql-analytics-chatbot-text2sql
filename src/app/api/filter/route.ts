import TASK_MODELS from "@/data/models";
import sql from "@/db";
import SCHEMA_RETRIEVAL_QUERY from "@/db/schema-retriever";
import { NextResponse } from "next/server";
import OpenAI from "openai";

const openaiClient = new OpenAI({
  baseURL: "http://localhost:11434/v1/",
  apiKey: "ollama"
});

// #region POST
export async function POST(request: Request) {

  const body = await request.json()

  const schema = await sql.unsafe(SCHEMA_RETRIEVAL_QUERY)
  const schemaString: string = schema.map(table => `${table.table_name} ${table.table_definition}`).join("\n")

  let response: OpenAI.Chat.Completions.ChatCompletion | null = null

  try {
    response = await openaiClient.chat.completions.create({
      messages: [
        { role: "system", content: getSystemPrompt() },
        { role: "user", content: getUserPrompt(schemaString, body.prompt) }
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
  `
You are a database schema filter. 
You will receive: 
(1) a complete database schema containing multiple tables, and 
(2) a user prompt describing a task, query, or feature. 
Your job is to identify only the tables that are relevant to the user prompt, and return them as is. Include a table only if it is directly or indirectly required to fulfill the task. Preserve the exact original format of each selected table. 
Strict rules: 
- Do not modify the table format. 
- Do not generate queries. 
- Do not repeat tables. 
- Do not modify table names, column names, data types, comments, ordering, or formatting. 
- Do not add new columns, new relationsm, new tables, new fields. 
- Do not explain, summarize, or provide reasoning. Do not include irrelevant tables. 
- If table is missing any relation or column, clearly output NO_RELEVANT_SCHEMAS. 
- Output only the selected schemas, concatenated exactly as they were received. 
- If no tables are relevant, output exactly NO_RELEVANT_SCHEMAS.`

const getUserPrompt = (schema: string, prompt: string) =>
  `<SCHEMAS>\n${schema}\n</SCHEMAS>\n<USER_PROMPT>\n${prompt}\n</USER_PROMPT>`;