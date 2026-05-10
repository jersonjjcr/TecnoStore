import { NextResponse } from "next/server";
import { registerStore } from "@/lib/auth";

export async function POST(request) {
  const body = await request.json();
  const storeName = String(body.storeName || "").trim();
  const email = String(body.email || "").trim().toLowerCase();
  const password = String(body.password || "").trim();
  const confirmPassword = String(body.confirmPassword || "").trim();
  const paymentAmount = Number(body.paymentAmount);
  const subscriptionPlan = String(body.subscriptionPlan || "Pro").trim();

  if (!storeName || !email || !password || !confirmPassword) {
    return NextResponse.json(
      { error: "Todos los campos son obligatorios." },
      { status: 400 }
    );
  }

  if (password !== confirmPassword) {
    return NextResponse.json(
      { error: "Las contraseñas no coinciden." },
      { status: 400 }
    );
  }

  if (paymentAmount !== 25) {
    return NextResponse.json(
      { error: "El pago debe ser de 25 dólares." },
      { status: 400 }
    );
  }

  try {
    await registerStore({
      storeName,
      email,
      password,
      subscriptionPlan,
      paymentAmount
    });

    return NextResponse.json(
      {
        message:
          "Tienda registrada y pago procesado. La autorización del administrador está pendiente."
      },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
