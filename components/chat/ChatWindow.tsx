'use client'

import { useState, useRef, useEffect, type FormEvent } from 'react'
import type Anthropic from '@anthropic-ai/sdk'
import type { RFQDraft } from '@/types/agent'

interface Message {
  role:    'user' | 'assistant'
  content: string
}

interface ChatWindowProps {
  slug:      string
  agentName: string
  company:   string
  greeting:  string
  lead:      { name: string; email: string; company?: string }
  accentColor?: string
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

export function ChatWindow({ slug, agentName, company, greeting, lead, accentColor = '#171717' }: ChatWindowProps) {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: greeting },
  ])
  // El saludo se pasa como contexto a la API para que el modelo sepa que ya se presentó
  const [apiMessages, setApiMessages] = useState<Anthropic.MessageParam[]>([
    { role: 'assistant', content: greeting },
  ])
  const [rfqDraft, setRfqDraft] = useState<RFQDraft | null>(null)
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

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
        body:    JSON.stringify({ message: text, messages: apiMessages, lead, rfqDraft }),
      })

      if (!res.ok) throw new Error(`HTTP ${res.status}`)

      const data = await res.json()
      setMessages(prev => [...prev, { role: 'assistant', content: data.response }])
      setApiMessages(data.messages)
      if (data.rfqDraft) setRfqDraft(data.rfqDraft)
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
      setTimeout(() => inputRef.current?.focus(), 50)
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
          autoComplete="off"
          data-gramm="false"
          data-gramm_editor="false"
          data-enable-grammarly="false"
          className="flex-1 resize-none rounded-xl border border-neutral-300 px-3 py-2 text-base sm:text-sm
            focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:border-transparent
            disabled:opacity-50 disabled:cursor-not-allowed
            max-h-32 overflow-y-auto"
          style={{ lineHeight: '1.5' }}
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="rounded-xl text-white px-4 py-2 text-sm font-medium
            disabled:opacity-40 disabled:cursor-not-allowed
            transition-colors flex-shrink-0"
          style={{ backgroundColor: accentColor }}
        >
          Enviar
        </button>
      </form>
    </div>
  )
}
