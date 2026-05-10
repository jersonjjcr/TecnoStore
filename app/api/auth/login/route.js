import { NextResponse } from "next/server";
import { loginUser, getSessionCookieName, findUserByEmail } from "@/lib/auth";

export async function POST(request) {
  const body = await request.json();
  const { email, password } = body || {};

  if (!email || !password) {
    return NextResponse.json({ error: "Correo y contraseña son obligatorios." }, { status: 400 });
  }

  const user = await findUserByEmail(email || "");
  if (!user || user.password !== password) {
    return NextResponse.json({ error: "Credenciales inválidas." }, { status: 401 });
  }

  if (user.role === "store" && !user.authorized) {
    return NextResponse.json(
      { error: "La tienda aún no ha sido autorizada por el administrador." },
      { status: 403 }
    );
  }

  const token = await loginUser(email, password);
  if (!token) {
    return NextResponse.json({ error: "Credenciales inválidas." }, { status: 401 });
  }

  const response = NextResponse.json({ user: { ...user, password: undefined } });
  response.cookies.set(getSessionCookieName(), token, {
    httpOnly: true,
    path: "/",
    maxAge: 60 * 60 * 24
  });
  return response;
}
