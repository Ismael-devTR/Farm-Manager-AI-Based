export type OllamaMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

export class OllamaError extends Error {
  constructor(
    message: string,
    public readonly status?: number,
  ) {
    super(message);
    this.name = "OllamaError";
  }
}

/**
 * Streams a chat completion from the local Ollama instance.
 * The fetch happens eagerly so callers can catch connection errors.
 * Returns a ReadableStream of content-token strings.
 */
export async function streamChat(
  messages: OllamaMessage[],
  signal?: AbortSignal,
): Promise<ReadableStream<string>> {
  const baseUrl = process.env.FM_OLLAMA_BASE_URL ?? "http://localhost:11434";
  const model = process.env.FM_OLLAMA_MODEL ?? "gemma3:4b";

  let response: Response;
  try {
    response = await fetch(`${baseUrl}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ model, messages, stream: true }),
      signal: signal ?? AbortSignal.timeout(10000),
    });
  } catch (err) {
    throw new OllamaError(
      err instanceof Error ? err.message : "Failed to connect to Ollama",
    );
  }

  if (!response.ok) {
    throw new OllamaError(
      `Ollama returned ${response.status}`,
      response.status,
    );
  }

  const reader = response.body?.getReader();
  if (!reader) {
    throw new OllamaError("No response body from Ollama");
  }

  return new ReadableStream<string>({
    async pull(controller) {
      const decoder = new TextDecoder();
      let buffer = "";

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) {
            if (buffer.trim()) {
              try {
                const chunk = JSON.parse(buffer) as {
                  message?: { content?: string };
                };
                if (chunk.message?.content) {
                  controller.enqueue(chunk.message.content);
                }
              } catch {
                // skip
              }
            }
            controller.close();
            return;
          }

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() ?? "";

          for (const line of lines) {
            if (!line.trim()) continue;
            try {
              const chunk = JSON.parse(line) as {
                message?: { content?: string };
                done?: boolean;
              };
              if (chunk.message?.content) {
                controller.enqueue(chunk.message.content);
              }
            } catch {
              // skip malformed lines
            }
          }
        }
      } catch (err) {
        controller.error(
          new OllamaError(
            err instanceof Error ? err.message : "Stream read error",
          ),
        );
      }
    },
  });
}
