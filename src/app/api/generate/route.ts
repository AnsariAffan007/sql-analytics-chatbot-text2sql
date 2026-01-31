import DVD_RENTAL_SCHEMA from "@/data/dvd-rental-schema";
import { NextResponse } from "next/server";
import OpenAI from "openai";

const openaiClient = new OpenAI({
  baseURL: "http://localhost:11434/v1/",
  apiKey: "ollama",
  dangerouslyAllowBrowser: true
});
const TEXT_TO_SQL_MODEL = "llama3.2:3b"

// #region POST
export async function POST(request: Request) {

  const body = await request.json()

  let response: OpenAI.Chat.Completions.ChatCompletion | null = null

  try {
    response = await openaiClient.chat.completions.create({
      messages: [
        { role: "system", content: getSystemPrompt() },
        ...body.history,
        { role: "user", content: body.prompt }
      ],
      model: TEXT_TO_SQL_MODEL
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
  return `You are a text to sql chatbot. You just respond in plain SQL. You write SQL queries to be run on PostgreSQL, to retrieve results based on user's input. You return no more than 10 rows in the output. You don't introduce new tables or columns. If the user's request is not satisfiable based on current schema, you responsd with "Insufficient information". Here is the database schema below\n${DVD_RENTAL_SCHEMA}`
}