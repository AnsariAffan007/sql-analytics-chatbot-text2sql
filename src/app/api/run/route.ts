import sql from "@/db";
import { NextResponse } from "next/server";

export async function POST(request: Request) {

  const body = await request.json()

  let queryRes = null;
  try {
    queryRes = await sql.unsafe(body.sql)
  }
  catch (e) {
    console.log("Error running SQL: \n", e)
    return NextResponse.json(
      { data: "Something has gone wrong" },
      { status: 500 }
    )
  }

  return NextResponse.json(
    { data: queryRes },
    { status: 200 }
  )
}