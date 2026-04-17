import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getOrCreateGame, joinGame } from "@/lib/db/queries";

export async function POST() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const game = await getOrCreateGame();
    const player = await joinGame(
      game.id,
      session.user.id,
      session.user.name
    );

    return NextResponse.json({ success: true, player });
  } catch (error) {
    console.error("join error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
