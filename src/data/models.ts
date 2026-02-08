const TASK_MODELS = {
  intender: "openai/gpt-oss-20b:free",
  chat: "openai/gpt-oss-20b:free",
  embedder: "intfloat/e5-base-v2",
  filter: "openai/gpt-oss-20b:free",
  generate: "openai/gpt-oss-20b:free",
  interpret: "openai/gpt-oss-20b:free",
} as const

export default TASK_MODELS;