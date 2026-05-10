import { NextResponse } from "next/server";
import { addSale, deleteSale, getSales } from "@/lib/store";

export async function GET() {
  const sales = await getSales();
  return NextResponse.json(sales);
}

export async function POST(request) {
  const body = await request.json();

  if (!body.customer || !body.payment || !body.productId) {
    return NextResponse.json(
      { error: "Cliente, metodo de pago y producto son obligatorios." },
      { status: 400 }
    );
  }

  try {
    const sale = await addSale(body);
    return NextResponse.json(sale, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

export async function DELETE(request) {
  const body = await request.json();

  if (!body.id) {
    return NextResponse.json(
      { error: "Id de la venta es obligatorio." },
      { status: 400 }
    );
  }

  try {
    await deleteSale(body.id);
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
