import { NextResponse } from "next/server";
import {
  getAllStoreProfiles,
  authorizeStore,
  getUserFromToken,
  getSessionCookieName
} from "@/lib/auth";

export async function GET(request) {
  const token = request.cookies.get(getSessionCookieName())?.value;
  const user = getUserFromToken(token);

  if (!user || user.role !== "admin") {
    return NextResponse.json({ error: "Acceso no autorizado." }, { status: 403 });
  }

  const stores = await getAllStoreProfiles();
  return NextResponse.json({ stores });
}

export async function PATCH(request) {
  const token = request.cookies.get(getSessionCookieName())?.value;
  const user = getUserFromToken(token);

  if (!user || user.role !== "admin") {
    return NextResponse.json({ error: "Acceso no autorizado." }, { status: 403 });
  }

  const body = await request.json();
  const { id } = body || {};

  if (!id) {
    return NextResponse.json({ error: "Id de la tienda es obligatorio." }, { status: 400 });
  }

  try {
    const store = await authorizeStore(id);
    return NextResponse.json({ store });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
