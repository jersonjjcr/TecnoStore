import { NextResponse } from "next/server";
import { getUserFromToken, getSessionCookieName } from "@/lib/auth";

export function GET(request) {
  const token = request.cookies.get(getSessionCookieName())?.value;
  const user = getUserFromToken(token);
  return NextResponse.json({ user });
}
