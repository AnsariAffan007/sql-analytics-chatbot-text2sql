import { ChromaClient } from "chromadb";

const vector = new ChromaClient({
  host: "localhost",
  port: 8000,
  database: "dvdrental-schemas",
  ssl: false,
});

export default vector