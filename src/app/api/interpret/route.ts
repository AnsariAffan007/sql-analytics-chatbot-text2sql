import TASK_MODELS from "@/data/models";
import { NextResponse } from "next/server";
import OpenAI from "openai";

const openaiClient = new OpenAI({
  baseURL: process.env.INTERPRETER_MODEL_URL,
  apiKey: process.env.INTERPRETER_MODEL_API_KEY,
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
  `
You will receive:
1. The output of a SQL query formatted as JSON.
2. A user prompt asking a question about the data.
Your task:
- Answer the user's question using ONLY the information present in the JSON.
- Treat the JSON as complete and authoritative & assume JSON satisfies all conditions in user prompt.
- Assume every row in the JSON satisfies the user’s constraints, even if some conditions are not explicitly visible in the fields.
- If the answer can be derived by reading, comparing, counting, or summarizing the JSON, you MUST do so.
- Do NOT re-check or question whether the data matches the prompt.
Rules:
- Focus on explaining the JSON, rather than ANSWERING user prompt.
- Consider ONLY the question from user prompt which needs to be answered. Do not focus on other fields which are not required to answer the question.
- Do not invent or assume data outside the JSON.
- Do not generate SQL.
- Unless required fields are missing, assume data is correct, even if mentioned fields are not available in the JSON.
- Do not say the data is insufficient unless the required fields are completely missing.
- You MUST NOT check for the presence of user's conditions in the JSON.
- Answer directly and concisely in natural language.
Output rules:
- Do NOT use tables.
- IF required, format the answer in markdown.
- Mention only what is visible in the JSON.
`

const getUserPrompt = (sqlOutput: unknown, prompt: string) =>
  `<SQLOUTPUT>\n${JSON.stringify(sqlOutput)}\n</SQLOUTPUT>\n<USER_PROMPT>\n${prompt}\n</USER_PROMPT>`;