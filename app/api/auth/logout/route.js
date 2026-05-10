import { NextResponse } from "next/server";
import { deleteSession, getSessionCookieName } from "@/lib/auth";

export async function POST(request) {
  const token = request.cookies.get(getSessionCookieName())?.value;
  if (token) {
    deleteSession(token);
  }

  const response = NextResponse.json({ success: true });
  response.cookies.set(getSessionCookieName(), "", {
    path: "/",
    maxAge: 0
  });
  return response;
}
