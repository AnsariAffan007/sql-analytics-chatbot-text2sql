import sql from "@/db"
import SCHEMA_RETRIEVAL_QUERY from "@/db/schema-retriever"
import { NextResponse } from "next/server"

export async function GET() {

  let schemaString = ''

  try {
    const schema = await sql.unsafe(SCHEMA_RETRIEVAL_QUERY)
    schemaString = schema.map(table => `${table.table_name} ${table.table_definition}`).join(`\n`)
  }
  catch (e) {
    console.log("Error retrieving schema: \n", e)
    return NextResponse.json(
      { data: "Failed to retrieve DB Schema" },
      { status: 500 }
    )
  }

  return NextResponse.json(
    { data: schemaString },
    { status: 200 }
  )
}