'use client'

import { useState, useRef, useEffect, type FormEvent } from 'react'
import type Anthropic from '@anthropic-ai/sdk'

interface Message {
  role:    'user' | 'assistant'
  content: string
}

interface ChatWindowProps {
  slug:      string
  agentName: string
  company:   string
}

function MessageBubble({ msg }: { msg: Message }) {
  const isUser = msg.role === 'user'
  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-3`}>
      <div
        className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm whitespace-pre-wrap leading-relaxed ${
          isUser
            ? 'bg-neutral-900 text-white rounded-br-sm'
            : 'bg-neutral-100 text-neutral-900 rounded-bl-sm'
        }`}
      >
        {msg.content}
      </div>
    </div>
  )
}

function TypingIndicator() {
  return (
    <div className="flex justify-start mb-3">
      <div className="bg-neutral-100 rounded-2xl rounded-bl-sm px-4 py-3 flex gap-1 items-center">
        {[0, 1, 2].map(i => (
          <span
            key={i}
            className="w-1.5 h-1.5 bg-neutral-400 rounded-full animate-bounce"
            style={{ animationDelay: `${i * 150}ms` }}
          />
        ))}
      </div>
    </div>
  )
}

export function ChatWindow({ slug, agentName, company }: ChatWindowProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [apiMessages, setApiMessages] = useState<Anthropic.MessageParam[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [initialized, setInitialized] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  // Scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  // Get initial greeting from agent (with 1 retry on failure)
  useEffect(() => {
    if (initialized) return
    setInitialized(true)

    async function fetchGreeting(): Promise<string | null> {
      const res = await fetch(`/api/chat/${slug}`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ message: 'hola', messages: [] }),
      })
      if (!res.ok) return null
      const data = await res.json()
      return data.response ?? null
    }

    async function getGreeting() {
      setLoading(true)
      try {
        let response = await fetchGreeting()
        if (!response) {
          // single retry after brief delay
          await new Promise(r => setTimeout(r, 1500))
          response = await fetchGreeting()
        }
        if (response) {
          setMessages([{ role: 'assistant', content: response }])
        } else {
          setMessages([{
            role:    'assistant',
            content: `Hola, soy ${agentName} de ${company}. ¿En qué puedo ayudarte hoy?`,
          }])
        }
      } catch {
        setMessages([{
          role:    'assistant',
          content: `Hola, soy ${agentName} de ${company}. ¿En qué puedo ayudarte hoy?`,
        }])
      } finally {
        setLoading(false)
        inputRef.current?.focus()
      }
    }

    getGreeting()
  }, [slug, agentName, company, initialized])

  async function sendMessage(text: string) {
    if (!text.trim() || loading) return

    const userMsg: Message = { role: 'user', content: text }
    setMessages(prev => [...prev, userMsg])
    setInput('')
    setLoading(true)

    try {
      const res = await fetch(`/api/chat/${slug}`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ message: text, messages: apiMessages }),
      })

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`)
      }

      const data = await res.json()
      setMessages(prev => [...prev, { role: 'assistant', content: data.response }])
      setApiMessages(data.messages)
    } catch {
      setMessages(prev => [
        ...prev,
        {
          role:    'assistant',
          content: 'Hubo un error al procesar tu mensaje. Por favor intentá de nuevo.',
        },
      ])
    } finally {
      setLoading(false)
      inputRef.current?.focus()
    }
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    sendMessage(input)
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage(input)
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="border-b border-neutral-200 px-4 py-3 flex-shrink-0">
        <p className="font-semibold text-neutral-900 text-sm">{agentName}</p>
        <p className="text-xs text-neutral-500">{company}</p>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        {messages.map((msg, i) => (
          <MessageBubble key={i} msg={msg} />
        ))}
        {loading && <TypingIndicator />}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <form
        onSubmit={handleSubmit}
        className="border-t border-neutral-200 px-4 py-3 flex gap-2 items-end flex-shrink-0"
      >
        <textarea
          ref={inputRef}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Escribí tu mensaje..."
          rows={1}
          disabled={loading}
          className="flex-1 resize-none rounded-xl border border-neutral-300 px-3 py-2 text-sm
            focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:border-transparent
            disabled:opacity-50 disabled:cursor-not-allowed
            max-h-32 overflow-y-auto"
          style={{ lineHeight: '1.5' }}
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="rounded-xl bg-neutral-900 text-white px-4 py-2 text-sm font-medium
            hover:bg-neutral-700 active:bg-neutral-800
            disabled:opacity-40 disabled:cursor-not-allowed
            transition-colors flex-shrink-0"
        >
          Enviar
        </button>
      </form>
    </div>
  )
}
