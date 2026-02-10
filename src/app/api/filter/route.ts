import { NextResponse } from "next/server";
import TASK_MODELS from "@/data/models";
import { sql } from "@/db";
import postgres from "postgres";
import pgvector from "pgvector"
import OpenAI from "openai";

const openaiClient = new OpenAI({
  baseURL: "https://api.cohere.ai/compatibility/v1",
  apiKey: process.env.COHERE_API_KEY,
});

const embedQuery = async (text: string) => {
  const embedding = await openaiClient.embeddings.create({
    model: TASK_MODELS.embedder,
    input: text,
    encoding_format: "float"
  })
  return embedding.data[0].embedding
};

// #region POST
export async function POST(request: Request) {

  const body = await request.json()

  // let schemaString = ''
  // try {
  //   const schema = await sql.unsafe(SCHEMA_RETRIEVAL_QUERY)
  //   schemaString = schema.map(table => `${table.table_name} ${table.table_definition}`).join("\n")
  // }
  // catch (e) {
  //   console.log("Error retrieving schema: \n", e)
  //   return NextResponse.json(
  //     { data: "Failed to retrieve DB Schema to filter" },
  //     { status: 500 }
  //   )
  // }

  // let response: OpenAI.Chat.Completions.ChatCompletion | null = null

  // try {
  //   response = await openaiClient.chat.completions.create({
  //     messages: [
  //       { role: "system", content: getSystemPrompt() },
  //       { role: "user", content: getUserPrompt(schemaString, body.prompt) }
  //     ],
  //     model: TASK_MODELS.filter
  //   })
  // }
  // catch (e) {
  //   console.log("Error filtering schemas: \n", e)
  //   return NextResponse.json(
  //     { data: "Something has gone wrong" },
  //     { status: 500 }
  //   )
  // }

  const queryEmbedding = pgvector.toSql(await embedQuery(body.prompt))

  let items: postgres.RowList<postgres.Row[]>;
  try {
    items = await sql`SELECT table_definition, embedding <-> ${queryEmbedding} as distance FROM table_embeddings ORDER BY embedding <-> ${queryEmbedding} LIMIT 10`;
  }
  catch (e) {
    console.log("Failed to retrieve documents: \n", e)
    return NextResponse.json(
      { data: "Something has gone wrong" },
      { status: 500 }
    )
  }

  return NextResponse.json(
    { data: items.filter(item => item.distance < 1).map(table => table.table_definition).join("\n") },
    { status: 200 }
  )
}

// #region Sys Prompt
// const getSystemPrompt = () =>
//   `
// You are a database schema filter.
// You will receive:
// (1) a complete database schema containing multiple tables, and
// (2) a user prompt describing a task, query, or feature.
// Your job is to identify tables that are relevant to the user prompt, and return them as it is. Include a table only if it is directly or indirectly required to fulfill the task. Preserve the exact original format of each selected table.
// Strict rules:
// - Do not generate queries.
// - Do not modify the table format.
// - Do not repeat tables.
// - Do not modify table names, column names, data types, comments, ordering, or formatting.
// - Do not add new columns, new relationsm, new tables, new fields.
// - Do not explain, summarize, or provide reasoning. Do not include irrelevant tables.
// - If table is missing any relation or column, clearly output NO_RELEVANT_SCHEMAS.
// - Output only the selected schemas, concatenated exactly as they were received.
// - If no tables are relevant, output exactly NO_RELEVANT_SCHEMAS.`

// const getUserPrompt = (schema: string, prompt: string) =>
//   `<SCHEMAS>\n${schema}\n</SCHEMAS>\n<USER_PROMPT>\n${prompt}\n</USER_PROMPT>`;