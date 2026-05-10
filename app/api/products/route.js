import { NextResponse } from "next/server";
import { addProduct, getProducts, deleteProduct } from "@/lib/store";

export async function GET() {
  const products = await getProducts();
  return NextResponse.json(products);
}

export async function POST(request) {
  const body = await request.json();

  if (!body.name || !body.category) {
    return NextResponse.json(
      { error: "Nombre y categoria son obligatorios." },
      { status: 400 }
    );
  }

  const stock = Number(body.stock);
  const price = Number(body.price);

  if (!Number.isFinite(stock) || stock < 0 || !Number.isFinite(price) || price <= 0) {
    return NextResponse.json(
      { error: "Stock y precio deben ser validos." },
      { status: 400 }
    );
  }

  const product = await addProduct(body);
  return NextResponse.json(product, { status: 201 });
}

export async function DELETE(request) {
  const body = await request.json();

  if (!body.id) {
    return NextResponse.json(
      { error: "Id de producto es obligatorio." },
      { status: 400 }
    );
  }

  try {
    await deleteProduct(body.id);
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
