"use client";

import { SubmitEventHandler, useEffect, useRef, useState } from "react";
import SimpleBar from 'simplebar-react';
import 'simplebar-react/dist/simplebar.min.css';
import OpenAI from "openai";
import Markdown from 'react-markdown'
import SimplebarCore from "simplebar"
import "./app.css"
import axios, { AxiosError, AxiosResponse } from "axios"
import { format } from "sql-formatter"

// #region MAIN
function Page() {

  const [messages, setMessages] = useState<{ party: "ai" | "self", content: string }[]>([])
  const [history, setHistory] = useState<OpenAI.Chat.Completions.ChatCompletionMessageParam[]>([])

  const [loading, setLoading] = useState(false)
  const promptInputRef = useRef<HTMLInputElement>(null)

  // Output states
  const [sqlSchemas, setSqlSchemas] = useState({ data: "", loading: false, error: "" });
  const [sqlQuery, setSqlQuery] = useState({ data: "", loading: false, error: "" });
  const [sqlOutput, setSqlOutput] = useState({ data: "", loading: false, error: "" });
  useEffect(() => {
    function resetLoadingStates() {
      setSqlSchemas(prev => ({ ...prev, loading: false }))
      setSqlQuery(prev => ({ ...prev, loading: false }))
      setSqlOutput(prev => ({ ...prev, loading: false }))
    }
    if (!loading) resetLoadingStates()
  }, [loading])

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

  // #region Submit
  const sendMessage: SubmitEventHandler<HTMLFormElement> = async (e) => {
    e.preventDefault()
    const prompt = new FormData(e.currentTarget).get('chat-prompt') as string
    if (!prompt || prompt === '') return;
    // Add user prompt to messages state
    setMessages(prev => ([...prev, { party: "self", content: prompt }]))
    // Clear the prompt input
    if (promptInputRef.current) promptInputRef.current.value = ""
    setLoading(true)
    setSqlSchemas(prev => ({ ...prev, error: "", loading: true }))
    setSqlQuery(prev => ({ ...prev, error: "", loading: true }))
    setSqlOutput(prev => ({ ...prev, error: "", loading: true }))
    // #region filter
    // Make API Call to filter SQL Schemas
    let filteredSchemasResponse: AxiosResponse<{ data: string }> | null = null
    try {
      filteredSchemasResponse = await axios.post("/api/filter", { prompt: prompt })
      setSqlSchemas(prev => ({ ...prev, data: filteredSchemasResponse?.data?.data || "", loading: false }))
    }
    catch (e) {
      const error = e as AxiosError<{ data: string }>
      setSqlSchemas(prev => ({ ...prev, loading: false, error: (error?.response?.data?.data || "") as string }))
      setLoading(false);
      return;
    }
    // #region generate
    // Make API Call to generate SQL on server, and getting the SQL
    let sqlGenerationResponse: AxiosResponse<{ data: string }> | null = null
    try {
      sqlGenerationResponse = await axios.post("/api/generate", {
        prompt: prompt,
        history: history,
        relevant_schemas: filteredSchemasResponse?.data.data || ""
      })
      setSqlQuery(prev => ({ ...prev, data: sqlGenerationResponse?.data?.data || "", loading: false }))
    }
    catch (e) {
      const error = e as AxiosError<{ data: string }>
      setSqlQuery(prev => ({ ...prev, loading: false, error: (error?.response?.data?.data || "") as string }))
      setLoading(false)
      return;
    }
    // #region interpret
    // Make API Call to RUN SQL on postgres
    let postgresQueryResponse: AxiosResponse<{ data: string }> | null = null
    try {
      postgresQueryResponse = await axios.post("/api/run", { sql: sqlGenerationResponse?.data?.data })
      setSqlOutput(prev => ({ ...prev, data: postgresQueryResponse?.data?.data || "", loading: false }))
    }
    catch (e) {
      const error = e as AxiosError<{ data: string }>
      setSqlOutput(prev => ({ ...prev, loading: false, error: (error?.response?.data?.data || "") as string }))
      setLoading(false)
      return;
    }
    // Make API Call to interpret SQL Output by LLM
    try {
      const response = await axios.post("/api/interpret", {
        prompt: prompt,
        sqlOutput: postgresQueryResponse?.data?.data || ""
      })
      setMessages(prev => ([...prev, { party: "ai", content: response.data.data || "" }]))
    }
    catch (e) {
      console.log("Error interpreting SQL: ", e)
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
          {sqlSchemas.loading
            ? <span className="loader"></span>
            : sqlSchemas.error
              ? <span className="error">{sqlSchemas.error}</span>
              : (
                <SimpleBar style={{ height: "100%", width: "100%" }}>
                  <pre style={{ whiteSpace: "pre-wrap" }}>
                    {sqlSchemas.data}
                  </pre>
                </SimpleBar>
              )
          }
        </div>
        <div className="sql-query">
          <label>SQL Query</label>
          {sqlQuery.loading
            ? <span className="loader"></span>
            : sqlQuery.error
              ? <span className="error">{sqlQuery.error}</span>
              : (
                <SimpleBar style={{ height: "100%", width: "100%" }}>
                  <pre style={{ whiteSpace: "pre-wrap" }}>
                    {format(sqlQuery.data, { language: "postgresql" })}
                  </pre>
                </SimpleBar>
              )
          }
        </div>
        <div className="sql-output">
          <label>SQL Output</label>
          {sqlOutput.loading
            ? <span className="loader"></span>
            : sqlOutput.error
              ? <span className="error">{sqlOutput.error}</span>
              : (
                <SimpleBar style={{ height: "100%", width: "100%" }}>
                  <pre style={{ whiteSpace: "pre-wrap" }}>
                    {JSON.stringify(sqlOutput.data, null, 2)}
                  </pre>
                </SimpleBar>
              )
          }
        </div>
      </div>

    </div>
  )
}

export default Page
