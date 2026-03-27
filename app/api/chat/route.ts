import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { streamChat, OllamaError } from "@/lib/ollama";
import type { OllamaMessage } from "@/lib/ollama";
import { buildFarmContext, SYSTEM_PROMPT } from "@/lib/chat-context";
import {
  webSearch,
  formatSearchResults,
  shouldSearch,
  sanitizeQuery,
  isSearchRateLimited,
} from "@/lib/web-search";

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { message?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const userMessage = body.message?.trim();
  if (!userMessage) {
    return NextResponse.json(
      { error: "Message is required" },
      { status: 400 },
    );
  }

  try {
    // Fetch conversation history (last 10 messages)
    const history = await prisma.chatMessage.findMany({
      where: { userId: session.userId },
      orderBy: { createdAt: "desc" },
      take: 10,
    });
    history.reverse();

    // Build farm data context; only run web search when relevant and not rate-limited
    const runSearch =
      shouldSearch(userMessage) && !isSearchRateLimited(session.userId);
    const searchQuery = runSearch ? sanitizeQuery(userMessage) : "";

    const [farmContext, searchResults] = await Promise.all([
      buildFarmContext(),
      searchQuery ? webSearch(searchQuery) : Promise.resolve([]),
    ]);
    const webContext = formatSearchResults(searchResults);

    // Save user message
    await prisma.chatMessage.create({
      data: {
        userId: session.userId,
        role: "user",
        content: userMessage,
      },
    });

    // Build messages array for Ollama
    const messages: OllamaMessage[] = [
      { role: "system", content: SYSTEM_PROMPT + farmContext + webContext },
      ...history.map(
        (m) =>
          ({
            role: m.role as "user" | "assistant",
            content: m.content,
          }) satisfies OllamaMessage,
      ),
      { role: "user", content: userMessage },
    ];

    // Stream response (await the connection — throws OllamaError if unreachable)
    const ollamaStream = await streamChat(messages);
    const reader = ollamaStream.getReader();
    let fullResponse = "";

    const encoder = new TextEncoder();
    const responseStream = new ReadableStream({
      async pull(controller) {
        try {
          const { done, value } = await reader.read();
          if (done) {
            // Save the complete assistant response
            if (fullResponse) {
              await prisma.chatMessage.create({
                data: {
                  userId: session.userId,
                  role: "assistant",
                  content: fullResponse,
                },
              });
            }
            controller.enqueue(encoder.encode(`data: [DONE]\n\n`));
            controller.close();
            return;
          }
          fullResponse += value;
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({ content: value })}\n\n`,
            ),
          );
        } catch (err) {
          controller.error(err);
        }
      },
    });

    return new Response(responseStream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (err) {
    if (err instanceof OllamaError) {
      return NextResponse.json(
        { error: "AI service is currently unavailable. Please try again later." },
        { status: 503 },
      );
    }
    console.error("Chat API error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
