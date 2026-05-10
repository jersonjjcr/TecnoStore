import { NextResponse } from "next/server";
import { advanceRepair } from "@/lib/store";
import { getUserFromToken, getSessionCookieName } from "@/lib/auth";

function getRequestUser(request) {
  const token = request.cookies.get(getSessionCookieName())?.value;
  return getUserFromToken(token);
}

export async function PATCH(request, { params }) {
  const user = getRequestUser(request);
  if (!user) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  try {
    const repair = await advanceRepair(params.id, user);
    return NextResponse.json(repair);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 404 });
  }
}
