"use client";

import { useState, useRef } from "react";
import {
  Send,
  User,
  Loader2,
  Paperclip,
  X,
  FileText,
  Sparkles,
  Zap,
  FileSearch,
} from "lucide-react";
import ReactMarkdown from "react-markdown";

type Message = {
  role: "user" | "ai";
  content: string;
};

export default function Home() {
  const [prompt, setPrompt] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // -----------------------------------------
  // Convert File -> Base64
  // -----------------------------------------
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.readAsDataURL(file);

      reader.onload = () => {
        if (typeof reader.result === "string") {
          const base64Data = reader.result.split(",")[1];

          resolve(base64Data);
        } else {
          reject(new Error("Failed to convert file to Base64."));
        }
      };

      reader.onerror = (error) => {
        reject(error);
      };
    });
  };

  // -----------------------------------------
  // Send Message
  // -----------------------------------------
  const sendMessage = async (
    e?: React.FormEvent,
    customPrompt?: string
  ) => {
    if (e) {
      e.preventDefault();
    }

    const finalPrompt =
      customPrompt !== undefined ? customPrompt : prompt;

    // Don't send empty request
    if (!finalPrompt.trim() && !selectedFile) {
      return;
    }

    // -----------------------------------------
    // User message
    // -----------------------------------------
    let userMessageContent = finalPrompt;

    if (selectedFile) {
      userMessageContent += `\n\n📎 *Attached File: ${selectedFile.name}*`;
    }

    const newMessages: Message[] = [
      ...messages,
      {
        role: "user",
        content: userMessageContent,
      },
    ];

    setMessages(newMessages);

    setPrompt("");
    setIsLoading(true);

    try {
      // -----------------------------------------
      // Prepare file
      // -----------------------------------------
      let fileBase64: string | null = null;
      let fileMimeType: string | null = null;

      if (selectedFile) {
        fileBase64 = await fileToBase64(selectedFile);
        fileMimeType = selectedFile.type;
      }

      // -----------------------------------------
      // API request
      // -----------------------------------------
      const res = await fetch("/api/chat", {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          prompt:
            finalPrompt ||
            "Please analyze the attached document.",

          fileBase64,
          fileMimeType,
        }),
      });

      const data = await res.json();

      // Clear selected file
      setSelectedFile(null);

      // -----------------------------------------
      // Success
      // -----------------------------------------
      if (res.ok && data.result) {
        setMessages([
          ...newMessages,
          {
            role: "ai",
            content: data.result,
          },
        ]);
      } else {
        // -----------------------------------------
        // API error
        // -----------------------------------------
        setMessages([
          ...newMessages,
          {
            role: "ai",
            content:
              `**Error:** ${
                data.error || "Server error occurred."
              }`,
          },
        ]);
      }
    } catch (error) {
      console.error("Frontend error:", error);

      setMessages([
        ...newMessages,
        {
          role: "ai",
          content:
            "**Error:** Something went wrong while connecting to the AI service.",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  // -----------------------------------------
  // Handle quick action
  // -----------------------------------------
  const handleQuickAction = (action: string) => {
    setPrompt(action);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex flex-col items-center justify-center p-4 md:p-8 font-sans">

      <div className="w-full max-w-4xl bg-white/80 backdrop-blur-xl rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white/50 overflow-hidden flex flex-col h-[85vh]">

        {/* -----------------------------------------
            Header
        ----------------------------------------- */}

        <div className="bg-gradient-to-r from-slate-900 to-indigo-900 text-white p-6 px-8 flex items-center justify-between">

          <div className="flex items-center gap-3">

            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center backdrop-blur-md">

              <Sparkles
                className="text-indigo-300"
                size={22}
              />

            </div>

            <div>

              <h1 className="text-xl font-bold tracking-tight">
                DocuMind AI
              </h1>

              <p className="text-xs text-indigo-200 mt-0.5 font-medium">
                Intelligent Document Analyzer
              </p>

            </div>

          </div>

          {/* Model status */}

          <div className="hidden md:flex items-center gap-2 text-xs font-medium px-3 py-1.5 bg-white/10 rounded-full">

            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />

          Gemini 3.8 Flash Ready

          </div>

        </div>

        {/* -----------------------------------------
            Chat Area
        ----------------------------------------- */}

        <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6">

          {messages.length === 0 ? (

            <div className="h-full flex flex-col items-center justify-center max-w-md mx-auto text-center animate-in fade-in duration-700">

              <div className="w-20 h-20 bg-indigo-50 rounded-3xl flex items-center justify-center mb-6 shadow-sm border border-indigo-100/50">

                <FileSearch
                  size={36}
                  className="text-indigo-600"
                />

              </div>

              <h2 className="text-2xl font-bold text-slate-800 mb-3">
                How can I help you today?
              </h2>

              <p className="text-slate-500 mb-8 leading-relaxed">
                Upload your contracts, reports, invoices, or
                other supported files. I can summarize
                documents, extract important information,
                analyze content, and answer your questions.
              </p>

              {/* Quick Actions */}

              <div className="grid grid-cols-1 w-full gap-3">

                <button
                  onClick={() =>
                    handleQuickAction(
                      "Summarize the main points of this document."
                    )
                  }
                  className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/50 transition-all text-left group"
                >

                  <Zap
                    size={18}
                    className="text-amber-500 group-hover:scale-110 transition-transform"
                  />

                  <span className="text-sm font-medium text-slate-700">
                    Summarize main points
                  </span>

                </button>

                <button
                  onClick={() =>
                    handleQuickAction(
                      "Extract all important financial figures, amounts, percentages, and dates from this document."
                    )
                  }
                  className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/50 transition-all text-left group"
                >

                  <FileText
                    size={18}
                    className="text-blue-500 group-hover:scale-110 transition-transform"
                  />

                  <span className="text-sm font-medium text-slate-700">
                    Extract financial data
                  </span>

                </button>

              </div>

            </div>

          ) : (

            messages.map((msg, index) => (

              <div
                key={index}
                className={`flex gap-4 ${
                  msg.role === "user"
                    ? "flex-row-reverse"
                    : ""
                }`}
              >

                {/* Avatar */}

                <div
                  className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 shadow-sm ${
                    msg.role === "user"
                      ? "bg-gradient-to-br from-indigo-500 to-indigo-600"
                      : "bg-gradient-to-br from-slate-800 to-slate-900"
                  }`}
                >

                  {msg.role === "user" ? (
                    <User
                      size={18}
                      className="text-white"
                    />
                  ) : (
                    <Sparkles
                      size={18}
                      className="text-white"
                    />
                  )}

                </div>

                {/* Message */}

                <div
                  className={`p-5 rounded-3xl max-w-[85%] leading-relaxed ${
                    msg.role === "user"
                      ? "bg-indigo-600 text-white rounded-tr-sm shadow-md"
                      : "bg-white border border-slate-100 text-slate-700 rounded-tl-sm shadow-sm"
                  }`}
                >

                  <div
                    className={
                      msg.role === "ai"
                        ? "prose prose-sm prose-slate max-w-none"
                        : "whitespace-pre-wrap text-sm"
                    }
                  >

                    {msg.role === "ai" ? (
                      <ReactMarkdown>
                        {msg.content}
                      </ReactMarkdown>
                    ) : (
                      msg.content
                    )}

                  </div>

                </div>

              </div>

            ))

          )}

          {/* Loading */}

          {isLoading && (

            <div className="flex gap-4 animate-in fade-in">

              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center shrink-0 shadow-sm">

                <Sparkles
                  size={18}
                  className="text-white"
                />

              </div>

              <div className="p-5 rounded-3xl bg-white border border-slate-100 shadow-sm rounded-tl-sm flex items-center gap-3">

                <Loader2
                  className="animate-spin text-indigo-600"
                  size={18}
                />

                <span className="text-slate-500 text-sm font-medium">
                  Analyzing with Gemini...
                </span>

              </div>

            </div>

          )}

        </div>

        {/* -----------------------------------------
            Input Area
        ----------------------------------------- */}

        <div className="p-4 md:p-6 bg-white/50 backdrop-blur-md border-t border-slate-100">

          {/* Selected file */}

          {selectedFile && (

            <div className="flex items-center gap-2 bg-indigo-50 border border-indigo-100 text-indigo-700 px-4 py-2.5 rounded-xl text-sm w-fit mb-3 animate-in slide-in-from-bottom-2">

              <FileText size={16} />

              <span className="truncate max-w-[250px] font-medium">
                {selectedFile.name}
              </span>

              <button
                type="button"
                onClick={() =>
                  setSelectedFile(null)
                }
                className="hover:text-red-500 hover:bg-red-50 p-1 rounded-md transition-colors ml-2"
              >

                <X size={16} />

              </button>

            </div>

          )}

          {/* Form */}

          <form
            onSubmit={(e) => sendMessage(e)}
            className="flex gap-2 items-end bg-white border border-slate-200 shadow-sm rounded-2xl p-2 focus-within:border-indigo-300 focus-within:ring-4 focus-within:ring-indigo-50 transition-all"
          >

            {/* File input */}

            <input
              type="file"
              className="hidden"
              ref={fileInputRef}
              accept=".pdf,.txt,.csv,.json,.md,.jpg,.jpeg,.png,.webp"
              onChange={(e) => {

                if (
                  e.target.files &&
                  e.target.files[0]
                ) {
                  setSelectedFile(
                    e.target.files[0]
                  );
                }

              }}
            />

            {/* Attach button */}

            <button
              type="button"
              onClick={() =>
                fileInputRef.current?.click()
              }
              className="p-3 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-colors disabled:opacity-50 flex-shrink-0"
              disabled={isLoading}
              title="Attach a file"
            >

              <Paperclip size={20} />

            </button>

            {/* Textarea */}

            <textarea
              value={prompt}
              onChange={(e) =>
                setPrompt(e.target.value)
              }
              onKeyDown={(e) => {

                if (
                  e.key === "Enter" &&
                  !e.shiftKey
                ) {

                  e.preventDefault();

                  sendMessage();

                }

              }}
              placeholder="Ask anything or command the AI..."
              className="flex-1 max-h-32 min-h-[44px] bg-transparent border-none outline-none py-3 px-2 text-slate-700 text-sm resize-none placeholder:text-slate-400"
              disabled={isLoading}
              rows={1}
            />

            {/* Send */}

            <button
              type="submit"
              disabled={
                isLoading ||
                (!prompt.trim() &&
                  !selectedFile)
              }
              className="bg-indigo-600 text-white p-3 rounded-xl hover:bg-indigo-700 hover:shadow-md transition-all disabled:opacity-50 disabled:hover:shadow-none disabled:cursor-not-allowed flex-shrink-0 mb-0.5 mr-0.5"
            >

              <Send
                size={18}
                className={
                  prompt.trim() || selectedFile
                    ? "translate-x-0.5"
                    : ""
                }
              />

            </button>

          </form>

          {/* Footer */}

          <div className="text-center mt-3">

            <p className="text-[11px] text-slate-400">
            Powered by Gemini 3.8 Flash · AI can make mistakes. Verify critical information.
            </p>

          </div>

        </div>

      </div>

    </div>
  );
}