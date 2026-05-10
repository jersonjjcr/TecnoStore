import { NextResponse } from "next/server";
import { advanceRepair } from "@/lib/store";

export async function PATCH(_request, { params }) {
  try {
    const repair = await advanceRepair(params.id);
    return NextResponse.json(repair);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 404 });
  }
}
