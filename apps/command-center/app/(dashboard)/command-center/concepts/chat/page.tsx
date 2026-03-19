"use client";

import { useState } from "react";
import { useChat } from "@ai-sdk/react";

export default function ExteriorConceptChatPage() {
  const [intakeData] = useState<Record<string, unknown>>({});

  const { messages, input, handleInputChange, handleSubmit, isLoading, append } =
    useChat({
      api: "/api/ai/exterior-concept",
      body: { intakeData },
    });

  return (
    <div className="mx-auto max-w-3xl p-6">
      <div className="mb-4 rounded-2xl border bg-white p-4 shadow-sm">
        <h1 className="text-xl font-semibold">Exterior Concept Intake Chat</h1>
        <p className="mt-1 text-sm text-slate-500">Describe the exterior design request to start the intake workflow.</p>
      </div>

      <div className="mb-4 min-h-[200px] space-y-3 rounded-2xl border bg-white p-4 shadow-sm">
        {messages.length === 0 && (
          <p className="text-sm text-slate-400">No messages yet. Start by describing the project.</p>
        )}
        {messages.map((m) => (
          <div
            key={m.id}
            className={`rounded-xl p-3 ${m.role === "user" ? "bg-slate-100" : "bg-emerald-50"}`}
          >
            <div className="mb-1 text-xs font-medium uppercase text-slate-500">{m.role}</div>
            <div className="text-sm whitespace-pre-wrap">{m.content}</div>
          </div>
        ))}
        {isLoading && (
          <div className="rounded-xl bg-slate-50 p-3">
            <div className="text-xs text-slate-400">Thinking...</div>
          </div>
        )}
      </div>

      <form
        onSubmit={handleSubmit}
        className="flex gap-2 rounded-2xl border bg-white p-3 shadow-sm"
      >
        <input
          className="flex-1 rounded-xl border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-300"
          value={input}
          onChange={handleInputChange}
          placeholder="Describe the exterior design request"
          disabled={isLoading}
        />
        <button
          type="submit"
          disabled={isLoading}
          className="rounded-xl bg-black px-4 py-2 text-sm text-white hover:bg-slate-800 disabled:opacity-50 transition-colors"
        >
          Send
        </button>
      </form>

      <button
        type="button"
        className="mt-4 rounded-xl border px-4 py-2 text-sm hover:bg-slate-50 transition-colors"
        onClick={() =>
          append({
            role: "user",
            content:
              "My name is Tim Chamberlain, email tim@example.com. The address is 123 Example St, Fort Washington, MD. I want a modern exterior refresh. Budget is $20k to $40k. Style: modern, clean lines, warm contrast. Photos: https://dummy.kealee.local/front.jpg, https://dummy.kealee.local/rear.jpg",
          })
        }
      >
        Load sample intake
      </button>
    </div>
  );
}
