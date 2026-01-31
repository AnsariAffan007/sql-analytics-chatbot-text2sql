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
        { role: "user", content: JSON.stringify(body.sqlOutput) }
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

const getSystemPrompt = () => {
  return `You are a SQL data interpreter. You take JSON output of Analytic SQL Select statements, and interpret them in natural language so that end user can understand. You keep the answers concise and to the point.`
}