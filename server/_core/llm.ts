import { GoogleGenerativeAI } from "@google/generative-ai";
import { ENV } from "./env";

export type Role = "system" | "user" | "assistant" | "tool" | "function";

export type Message = {
  role: Role;
  content: string;
};

export type InvokeParams = {
  messages: Message[];
  response_format?: { type: "json_object" | "json_schema"; json_schema?: any };
};

export type InvokeResult = {
  choices: Array<{
    message: {
      content: string;
    };
  }>;
};

export async function invokeLLM(params: InvokeParams): Promise<InvokeResult> {
  if (!ENV.forgeApiKey) {
    throw new Error("Gemini API Key is missing. Please check your .env file.");
  }

  const genAI = new GoogleGenerativeAI(ENV.forgeApiKey);
  const model = genAI.getGenerativeModel({
    model: "gemini-2.0-flash",
    generationConfig: {
      responseMimeType: params.response_format?.type === "json_object" || params.response_format?.type === "json_schema" ? "application/json" : "text/plain",
    }
  });

  // Convert messages to Gemini format
  // Gemini expects a history of [user, model, user, model...]
  // System instructions are set on model initialization, but for simplicity we'll prepend to the first user message if possible
  // or just map roles.

  // Simple mapping:
  // system -> user (prepend)
  // user -> user
  // assistant -> model

  let systemInstruction = "";
  const history = [];

  for (const msg of params.messages) {
    if (msg.role === "system") {
      systemInstruction += msg.content + "\n";
    } else if (msg.role === "user") {
      history.push({
        role: "user",
        parts: [{ text: (history.length === 0 ? systemInstruction : "") + msg.content }],
      });
      // Clear system instruction after first use so it's not repeated if there are multiple user messages (though usually system is first)
      if (history.length === 1) systemInstruction = "";
    } else if (msg.role === "assistant") {
      history.push({
        role: "model",
        parts: [{ text: msg.content }],
      });
    }
  }

  // If there was a system message but no user message yet (rare), we need to handle it.
  // But typically we have system -> user.

  // The last message is the new prompt
  const lastMsg = history.pop();
  if (!lastMsg || lastMsg.role !== "user") {
    throw new Error("Last message must be from user");
  }

  const chat = model.startChat({
    history: history,
  });

  const result = await chat.sendMessage(lastMsg.parts[0].text);
  const response = result.response;
  const text = response.text();
  console.log("[LLM] Raw response:", text);

  return {
    choices: [
      {
        message: {
          content: text,
        },
      },
    ],
  };
}
