import { NextResponse, type NextRequest } from "next/server";

import { createLifetimeOrder } from "@/src/lib/server/razorpay";
import {
  RouteAuthError,
  requireAuthenticatedUser,
} from "@/src/lib/server/requestAuth";

export const runtime = "nodejs";

interface OrderRequestBody {
  plan?: string;
}

export async function POST(request: NextRequest) {
  try {
    const { uid } = await requireAuthenticatedUser(request);

    let body: OrderRequestBody;

    try {
      body = (await request.json()) as OrderRequestBody;
    } catch {
      return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
    }

    if (body.plan !== "lifetime") {
      return NextResponse.json({ error: "Only lifetime plan is available right now." }, { status: 400 });
    }

    const order = await createLifetimeOrder(uid);

    return NextResponse.json(order);
  } catch (error) {
    if (error instanceof RouteAuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    const message = error instanceof Error ? error.message : "Could not create order.";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
