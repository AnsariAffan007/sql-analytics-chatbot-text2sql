const TASK_MODELS = {
  intender: "llama3.2:3b",
  chat: "llama3.2:3b",
  embedder: "embeddinggemma:300m",
  filter: "openai/gpt-oss-20b:free",
  generate: "openai/gpt-oss-20b:free",
  interpret: "openai/gpt-oss-20b:free",
} as const

export default TASK_MODELS;