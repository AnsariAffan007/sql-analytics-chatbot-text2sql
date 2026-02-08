const TASK_MODELS = {
  intender: "openai/gpt-oss-20b:free",
  chat: "openai/gpt-oss-20b:free",
  embedder: "embed-multilingual-v3.0",
  generate: "openai/gpt-oss-20b:free",
  interpret: "openai/gpt-oss-20b:free",
} as const

export default TASK_MODELS;