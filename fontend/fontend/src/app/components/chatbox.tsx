'use client'

import { useState, useRef, useEffect } from 'react'
import styles from './Chatbot.module.css'

type Message = {
  sender: 'user' | 'bot'
  text: string
}

export default function Chatbot() {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const chatEndRef = useRef<HTMLDivElement>(null)

  const toggleChat = () => setIsOpen(!isOpen)

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages, loading])

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim()) return

    const userMsg: Message = { sender: 'user', text: input }
    setMessages(prev => [...prev, userMsg])
    setInput('')
    setLoading(true)

    try {
      const res = await fetch(`http://localhost:3006/rag?q=${encodeURIComponent(input)}`)
      const data = await res.json()

      const botMsg: Message = {
        sender: 'bot',
        text: data?.answer || 'Xin lỗi, mình chưa có câu trả lời cho câu hỏi này 😅',
      }

      setMessages(prev => [...prev, botMsg])
    } catch (err) {
      setMessages(prev => [
        ...prev,
        { sender: 'bot', text: '⚠️ Lỗi khi gọi API.' },
      ])
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      {/* Chat Button */}
      <button
        onClick={toggleChat}
        className={styles.chatButton}
        aria-label="Toggle chat"
      >
        <ChatIcon />
      </button>

      {/* Chat Container */}
      {isOpen && (
        <div className={styles.chatContainer}>
          {/* Header */}
          <div className={styles.chatHeader}>
            <div className={styles.chatHeaderTitle}>
              <BotIcon />
              <span>Trợ lý AI</span>
              <span className={styles.statusDot}></span>
            </div>
            <button className={styles.closeButton} onClick={toggleChat}>
              ✕
            </button>
          </div>

          {/* Messages */}
          <div className={styles.chatBody}>
            {messages.length === 0 && (
              <div style={{ textAlign: 'center', color: '#64748b', marginTop: '2rem' }}>
                <BotIcon style={{ fontSize: '3rem', marginBottom: '1rem' }} />
                <p style={{ fontSize: '1.1rem', fontWeight: '600' }}>Xin chào! 👋</p>
                <p style={{ fontSize: '0.95rem' }}>Tôi có thể giúp gì cho bạn?</p>
              </div>
            )}

            {messages.map((msg, i) => (
              <div
                key={i}
                className={`${styles.messageWrapper} ${msg.sender === 'user'
                    ? styles.messageWrapperUser
                    : styles.messageWrapperBot
                  }`}
              >
                <div
                  className={`${styles.message} ${msg.sender === 'user'
                      ? styles.messageUser
                      : styles.messageBot
                    }`}
                >
                  {msg.text}
                </div>
              </div>
            ))}

            {/* Loading */}
            {loading && (
              <div className={styles.loadingWrapper}>
                <div className={styles.loadingMessage}>
                  <span>Đang trả lời</span>
                  <div className={styles.loadingDots}>
                    <span className={styles.loadingDot}></span>
                    <span className={styles.loadingDot}></span>
                    <span className={styles.loadingDot}></span>
                  </div>
                </div>
              </div>
            )}

            <div ref={chatEndRef} />
          </div>

          {/* Input */}
          <form onSubmit={sendMessage} className={styles.chatFooter}>
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className={styles.chatInput}
              placeholder="Nhập câu hỏi của bạn..."
            />
            <button type="submit" className={styles.sendButton} disabled={loading}>
              <SendIcon />
            </button>
          </form>
        </div>
      )}
    </>
  )
}

// Icon Components
function ChatIcon() {
  return (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      <line x1="9" y1="10" x2="15" y2="10" />
      <line x1="9" y1="14" x2="13" y2="14" />
    </svg>
  )
}

function BotIcon({ style }: { style?: React.CSSProperties }) {
  return (
    <svg style={style} width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="10" rx="2" />
      <circle cx="12" cy="5" r="2" />
      <path d="M12 7v4" />
      <line x1="8" y1="16" x2="8" y2="16" />
      <line x1="16" y1="16" x2="16" y2="16" />
    </svg>
  )
}

function SendIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="22" y1="2" x2="11" y2="13" />
      <polygon points="22 2 15 22 11 13 2 9 22 2" />
    </svg>
  )
}
