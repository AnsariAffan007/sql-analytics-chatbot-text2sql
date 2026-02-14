import { NextResponse } from "next/server";
import OpenAI from "openai";

const openaiClient = new OpenAI({
  baseURL: process.env.CHAT_MODEL_URL,
  apiKey: process.env.CHAT_MODEL_API_KEY,
});

export async function POST(request: Request) {

  const body = await request.json()

  let response: OpenAI.Chat.Completions.ChatCompletion | null = null

  try {
    if (!process.env.CHAT_MODEL_NAME) return NextResponse.json(
      { data: "Chat model not found" },
      { status: 500 }
    )
    response = await openaiClient.chat.completions.create({
      messages: [
        { role: "system", content: getSystemPrompt() },
        { role: "user", content: body.prompt }
      ],
      model: process.env.CHAT_MODEL_NAME
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

`
