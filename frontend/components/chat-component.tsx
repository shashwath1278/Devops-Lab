"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { MessageCircle, Send, X, Loader2, Maximize2, Minimize2 } from "lucide-react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"

interface Message {
  role: "user" | "assistant"
  content: string
}

export default function ChatComponent() {
  const [isOpen, setIsOpen] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const { toast } = useToast()

  // Auto-scroll to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  useEffect(() => {
    if (messages.length > 0 && window.innerWidth < 640) {
      // Keep chat open on mobile for conversational context
    }
  }, [messages])

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim()) return

    // Add user message to UI
    const userMessage: Message = { role: "user", content: input }
    setMessages((prev) => [...prev, userMessage])
    setInput("")
    setLoading(true)

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: input,
          history: messages,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to get response from AI")
      }

      const data = await response.json()
      const assistantMessage: Message = {
        role: "assistant",
        content: data.response || "No response received",
      }

      setMessages((prev) => [...prev, assistantMessage])
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to send message"
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed bottom-6 right-6 z-50 p-4 rounded-full shadow-lg hover:shadow-xl transition-all transform duration-200 ${isOpen ? "bg-accent text-accent-foreground scale-110" : "bg-primary text-primary-foreground hover:scale-110"
          }`}
        title={isOpen ? "Close chat" : "Open chat"}
      >
        {isOpen ? <X className="w-6 h-6" /> : <MessageCircle className="w-6 h-6" />}
      </button>

      {/* Chat Window - Responsive */}
      {isOpen && (
        <Card
          className={`fixed bottom-24 right-6 flex flex-col shadow-2xl border-0 z-40 bg-card rounded-2xl overflow-hidden transition-all duration-300 ease-in-out
            ${isExpanded
              ? "w-[800px] h-[80vh] max-w-[calc(100vw-32px)]"
              : "w-[450px] h-[600px] max-w-[calc(100vw-32px)]"
            }`}
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground p-4 rounded-t-2xl flex justify-between items-center">
            <div>
              <h3 className="font-semibold text-lg">Study Assistant</h3>
              <p className="text-xs text-primary-foreground/80">Powered by AI</p>
            </div>
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-1 hover:bg-white/20 rounded-md transition-colors"
              title={isExpanded ? "Minimize" : "Maximize"}
            >
              {isExpanded ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
            </button>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-background/50">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center px-2">
                <MessageCircle className="w-12 h-12 text-muted-foreground/30 mb-3" />
                <p className="text-sm text-muted-foreground font-medium">Welcome to Study Assistant</p>
                <p className="text-xs text-muted-foreground mt-2">
                  Ask questions about your documents or get help with your studies
                </p>
              </div>
            ) : (
              <>
                {messages.map((msg, idx) => (
                  <div
                    key={idx}
                    className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"} animate-in fade-in slide-in-from-bottom-2`}
                  >
                    <div
                      className={`max-w-[85%] px-4 py-3 rounded-lg text-sm leading-relaxed shadow-sm ${msg.role === "user"
                          ? "bg-primary text-primary-foreground rounded-br-none"
                          : "bg-secondary text-secondary-foreground rounded-bl-none prose prose-sm dark:prose-invert max-w-none"
                        }`}
                    >
                      {msg.role === "user" ? (
                        msg.content
                      ) : (
                        <ReactMarkdown
                          remarkPlugins={[remarkGfm]}
                          components={{
                            ul: ({ node, ...props }) => <ul className="list-disc pl-4 my-2" {...props} />,
                            ol: ({ node, ...props }) => <ol className="list-decimal pl-4 my-2" {...props} />,
                            h1: ({ node, ...props }) => <h1 className="text-lg font-bold my-2" {...props} />,
                            h2: ({ node, ...props }) => <h2 className="text-base font-bold my-2" {...props} />,
                            h3: ({ node, ...props }) => <h3 className="text-sm font-bold my-1" {...props} />,
                            code: ({ node, ...props }) => <code className="bg-black/10 dark:bg-white/10 rounded px-1 py-0.5 font-mono text-xs" {...props} />,
                            pre: ({ node, ...props }) => <pre className="bg-black/10 dark:bg-white/10 rounded p-2 my-2 overflow-x-auto" {...props} />,
                            p: ({ node, ...props }) => <p className="mb-2 last:mb-0" {...props} />,
                          }}
                        >
                          {msg.content}
                        </ReactMarkdown>
                      )}
                    </div>
                  </div>
                ))}
                {loading && (
                  <div className="flex justify-start">
                    <div className="bg-secondary text-secondary-foreground px-4 py-2 rounded-lg text-sm rounded-bl-none shadow-sm flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span className="text-xs">Thinking...</span>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </>
            )}
          </div>

          {/* Input Area */}
          <div className="border-t border-border p-4 rounded-b-2xl bg-card">
            <form onSubmit={handleSendMessage} className="flex gap-2">
              <Input
                placeholder="Ask a question..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                disabled={loading}
                className="border-input text-sm"
                autoFocus
              />
              <Button
                type="submit"
                disabled={loading || !input.trim()}
                size="sm"
                className="bg-accent text-accent-foreground hover:bg-accent/90 px-3 transition-colors"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              </Button>
            </form>
          </div>
        </Card>
      )}
    </>
  )
}
