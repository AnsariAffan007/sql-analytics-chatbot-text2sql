import { NextResponse } from "next/server";
import OpenAI from "openai";

const openaiClient = new OpenAI({
  baseURL: process.env.INTENDER_MODEL_URL,
  apiKey: process.env.INTENDER_MODEL_API_KEY
})

export async function POST(request: Request) {
  const body = await request.json();
  const prompt = body.prompt

  let response: OpenAI.Chat.Completions.ChatCompletion | null = null
  try {
    if (!process.env.INTENDER_MODEL_NAME) return NextResponse.json(
      { data: "Intender model name not found" },
      { status: 500 }
    )
    response = await openaiClient.chat.completions.create({
      messages: [
        { role: "system", content: getSystemPrompt() },
        { role: "user", content: prompt }
      ],
      model: process.env.INTENDER_MODEL_NAME
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
You are a decision maker, for a Text to SQL multi-agent system. You take in a user prompt, and respond with ONLY selective keywords, that decide the next step of the flow.
The selective keywords are:
- CHAT: The user is chatting or asking general questions. No SQL data retrieval is needed.
- NEW_QUERY: The user is requesting data that requires querying the SQL database and does not depend on previous conversation context.
Strict Rules:
- Respond with ONLY ONE of the keywords above, and NOTHING ELSE.
- Do NOT add explanations or natural language.
- NEVER ask questions, or speak in natural language.
- Always choose one keyword.
- You NEVER add keywords of your own to respond with
You strictly respond with the mentioned keywords, and nothing else.
`
