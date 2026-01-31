"use client";

import { SubmitEventHandler, useEffect, useRef, useState } from "react";
import SimpleBar from 'simplebar-react';
import 'simplebar-react/dist/simplebar.min.css';
import OpenAI from "openai";
import Markdown from 'react-markdown'
import SimplebarCore from "simplebar"
import "./app.css"
import axios from "axios"

// #region MAIN
function Page() {

  const [messages, setMessages] = useState<{ party: "ai" | "self", content: string }[]>([])
  const [history, setHistory] = useState<OpenAI.Chat.Completions.ChatCompletionMessageParam[]>([])

  const [loading, setLoading] = useState(false)
  const promptInputRef = useRef<HTMLInputElement>(null)

  // Output states
  const [sqlSchemas, setSqlSchemas] = useState("");
  const [sqlQuery, setSqlQuery] = useState("");
  const [sqlOutput, setSqlOutput] = useState("");

  // #region Scroll
  const simplebarRef = useRef<SimplebarCore>(null)
  const scrollToBottom = () => {
    const scrollEl = simplebarRef.current?.getScrollElement()
    if (scrollEl) {
      scrollEl.scrollTo({
        top: scrollEl.scrollHeight,
        behavior: "smooth"
      })
    }
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const sendMessage: SubmitEventHandler<HTMLFormElement> = async (e) => {
    e.preventDefault()
    const prompt = new FormData(e.currentTarget).get('chat-prompt') as string
    if (!prompt || prompt === '') return;
    // Add user prompt to messages state
    setMessages(prev => ([...prev, { party: "self", content: prompt }]))
    // Clear the prompt input
    if (promptInputRef.current) promptInputRef.current.value = ""
    setLoading(true)
    // Make API Call to filter SQL Schemas
    let filteredSchemasResponse = null
    try {
      filteredSchemasResponse = await axios.post("/api/filter", { prompt: prompt })
      setSqlSchemas(filteredSchemasResponse.data.data)
    }
    catch (e) {
      console.log("Error filtering schemas: ", e);
      setLoading(false);
      return;
    }
    // Make API Call to generate SQL on server, and getting the SQL
    let sqlGenerationResponse = null
    try {
      sqlGenerationResponse = await axios.post("/api/generate", { 
        prompt: prompt, 
        history: history,
        relevant_schemas: filteredSchemasResponse.data.data || ""
      })
      setSqlQuery(sqlGenerationResponse.data?.data || "")
    }
    catch (e) {
      console.log("Error generating SQL: ", e)
      setLoading(false)
      return;
    }
    // Make API Call to RUN SQL on postgres
    let postgresQueryResponse
    try {
      postgresQueryResponse = await axios.post("/api/run", { sql: sqlGenerationResponse.data.data })
      setSqlOutput(postgresQueryResponse.data.data)
    }
    catch (e) {
      console.log("Error running SQL: ", e)
      setLoading(false)
      return;
    }
    // Make API Call to interpret SQL Output by LLM
    try {
      const response = await axios.post("/api/interpret", { sqlOutput: postgresQueryResponse.data.data })
      setMessages(prev => ([...prev, { party: "ai", content: response.data.data || "" }]))
    }
    catch (e) {
      console.log("Error interpreting SQL: ", e)
      setLoading(false)
      return;
    }
    setLoading(false)
  }

  // #region JSX
  return (
    <div className="container">

      <div className="chatbox">
        <div className="title">
          <p>Text-to-SQL Chatbot</p>
        </div>
        <div className="chatarea">
          <SimpleBar style={{ height: "100%" }} ref={simplebarRef}>
            <div className="chats-container">
              {messages.map((message, index) => (
                <div
                  key={index}
                  className={`message ${message.party === "self" ? "sent" : "recieved"}`}
                >
                  <Markdown>{message.content}</Markdown>
                </div>
              ))}
            </div>
          </SimpleBar>
        </div>
        <form onSubmit={sendMessage} className="chatinput">
          <input autoComplete="off" name="chat-prompt" type="text" placeholder="Type your prompt" ref={promptInputRef} />
          <button type="submit" disabled={loading}>Send {" >"}</button>
        </form>
      </div>

      <div className="output-container">
        <div className="schemas">
          <label>Relevant Schemas</label>
          <SimpleBar style={{ height: "100%" }}>
            {sqlSchemas}
          </SimpleBar>
        </div>
        <div className="sql-query">
          <label>SQL Query</label>
          <SimpleBar style={{ height: "100%" }}>
            {sqlQuery}
          </SimpleBar>
        </div>
        <div className="sql-output">
          <label>SQL Output</label>
          <SimpleBar style={{ height: "100%" }}>
            <pre style={{ whiteSpace: "pre-wrap" }}>
              {JSON.stringify(sqlOutput, null, 2)}
            </pre>
          </SimpleBar>
        </div>
      </div>

    </div>
  )
}

export default Page
