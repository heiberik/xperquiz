import { NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/auth";
import {
  getOrCreateGame,
  getPlayer,
  getRoundWinner,
  updateGameTopic,
  resetForNewRound,
  atomicStatusUpdate,
} from "@/lib/db/queries";

const topicSchema = z.object({
  topic: z.string().min(1).max(100),
});

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const parsed = topicSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.issues },
        { status: 400 }
      );
    }

    const { topic } = parsed.data;

    const game = await getOrCreateGame();
    if (game.status !== "topic_selection") {
      return NextResponse.json(
        { error: "Not accepting topic selection right now" },
        { status: 400 }
      );
    }

    const player = await getPlayer(game.id, session.user.id);
    if (!player) {
      return NextResponse.json(
        { error: "Player not found" },
        { status: 400 }
      );
    }

    const winner = await getRoundWinner(game.id);
    if (!winner || winner.id !== player.id) {
      return NextResponse.json(
        { error: "Only the round winner can select the topic" },
        { status: 403 }
      );
    }

    const now = new Date();
    const result = await atomicStatusUpdate(
      game.id,
      "topic_selection",
      "generating",
      now
    );

    if (result.rowCount === 0) {
      return NextResponse.json({ success: true });
    }

    await updateGameTopic(game.id, topic);
    await resetForNewRound(game.id);

    const origin = new URL(request.url).origin;

    try {
      const res = await fetch(`${origin}/api/generate-questions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ gameId: game.id, topic }),
      });
      if (!res.ok) {
        console.error("generate-questions failed:", await res.text());
        await atomicStatusUpdate(
          game.id,
          "generating",
          "waiting_for_players",
          new Date()
        );
      }
    } catch (error) {
      console.error("generate-questions error:", error);
      await atomicStatusUpdate(
        game.id,
        "generating",
        "waiting_for_players",
        new Date()
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("select-topic error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
