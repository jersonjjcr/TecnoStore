import { NextResponse } from "next/server";
import { addRepair, deleteRepair, getRepairs } from "@/lib/store";
import { getUserFromToken, getSessionCookieName } from "@/lib/auth";

function getRequestUser(request) {
  const token = request.cookies.get(getSessionCookieName())?.value;
  return getUserFromToken(token);
}

export async function GET(request) {
  const user = getRequestUser(request);
  if (!user) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  const repairs = await getRepairs(user);
  return NextResponse.json(repairs);
}

export async function POST(request) {
  const user = getRequestUser(request);
  if (!user) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  const body = await request.json();

  if (!body.customer || !body.phone || !body.device || !body.issue) {
    return NextResponse.json(
      { error: "Todos los datos del cliente y del equipo son obligatorios." },
      { status: 400 }
    );
  }

  const estimate = Number(body.estimate);
  if (!Number.isFinite(estimate) || estimate <= 0) {
    return NextResponse.json(
      { error: "El presupuesto debe ser mayor que cero." },
      { status: 400 }
    );
  }

  const repair = await addRepair(body, user);
  return NextResponse.json(repair, { status: 201 });
}

export async function DELETE(request) {
  const user = getRequestUser(request);
  if (!user) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  const body = await request.json();

  if (!body.id) {
    return NextResponse.json(
      { error: "Id de la orden es obligatorio." },
      { status: 400 }
    );
  }

  try {
    await deleteRepair(body.id, user);
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
