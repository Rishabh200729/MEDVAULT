import { useState, useRef, useEffect } from 'react';
import { Mic, MicOff, Volume2, VolumeX, Send, Bot, User, Loader, Globe } from 'lucide-react';
import { api, getToken } from '../lib/api';

interface ChatMessage {
  role: 'user' | 'ai';
  text: string;
  timestamp: Date;
}

// Extend Window for webkitSpeechRecognition
interface SpeechRecognitionEvent {
  results: { [key: number]: { [key: number]: { transcript: string } } };
}

export default function VoiceChatRAG() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [language, setLanguage] = useState('en');
  const [autoSpeak, setAutoSpeak] = useState(true);
  const [interimText, setInterimText] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Initialize Speech Recognition
  const startListening = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Speech recognition not supported. Use Chrome or Edge.');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = language === 'hi' ? 'hi-IN' : language === 'ta' ? 'ta-IN' : 'en-IN';

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let transcript = '';
      for (let i = 0; i < Object.keys(event.results).length; i++) {
        transcript += event.results[i][0].transcript;
      }
      setInterimText(transcript);
    };

    recognition.onend = () => {
      setIsListening(false);
      if (interimText.trim()) {
        setInputText(interimText.trim());
        // Auto-send after speech ends
        handleSend(interimText.trim());
      }
      setInterimText('');
    };

    recognition.onerror = () => {
      setIsListening(false);
      setInterimText('');
    };

    recognitionRef.current = recognition;
    recognition.start();
    setIsListening(true);
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setIsListening(false);
  };

  // Text-to-Speech
  const speak = (text: string) => {
    if (!('speechSynthesis' in window)) return;

    // Cancel any ongoing speech
    speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = language === 'hi' ? 'hi-IN' : language === 'ta' ? 'ta-IN' : 'en-IN';
    utterance.rate = 0.9;
    utterance.pitch = 1;

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    speechSynthesis.speak(utterance);
  };

  const stopSpeaking = () => {
    speechSynthesis.cancel();
    setIsSpeaking(false);
  };

  // Send message to RAG backend
  const handleSend = async (text?: string) => {
    const query = text || inputText.trim();
    if (!query || isLoading) return;

    const userMsg: ChatMessage = { role: 'user', text: query, timestamp: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setInputText('');
    setIsLoading(true);

    try {
      const data = await api<{ answer: string; rag_source: string }>('/voice/chat', {
        method: 'POST',
        token: getToken()!,
        body: { query, language },
      });

      const aiMsg: ChatMessage = { role: 'ai', text: data.answer, timestamp: new Date() };
      setMessages(prev => [...prev, aiMsg]);

      // Auto-speak the response
      if (autoSpeak) {
        speak(data.answer);
      }
    } catch (err: unknown) {
      const errMsg: ChatMessage = {
        role: 'ai',
        text: err instanceof Error ? err.message : 'Something went wrong. Please try again.',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="glass-card" style={{ padding: '0', overflow: 'hidden', display: 'flex', flexDirection: 'column', height: '600px' }}>
      {/* Header */}
      <div style={{
        padding: '1rem 1.5rem', borderBottom: '1px solid var(--color-border)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        background: 'rgba(15,23,42,0.5)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{
            width: '2.5rem', height: '2.5rem', borderRadius: '0.75rem',
            background: 'linear-gradient(135deg, var(--color-primary), var(--color-primary-light))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Bot size={18} color="white" />
          </div>
          <div>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, margin: 0 }}>MedVault Voice AI</h3>
            <p style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', margin: 0 }}>
              RAG-powered · Ask about your health records
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Globe size={14} color="var(--color-text-secondary)" />
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            style={{
              background: 'rgba(15,23,42,0.8)', border: '1px solid var(--color-border)',
              borderRadius: '0.5rem', padding: '0.3rem 0.5rem', color: 'var(--color-text-primary)',
              fontSize: '0.8rem', outline: 'none',
            }}
          >
            <option value="en">English</option>
            <option value="hi">हिंदी</option>
            <option value="ta">தமிழ்</option>
          </select>
          <button
            onClick={() => setAutoSpeak(!autoSpeak)}
            title={autoSpeak ? 'Auto-speak ON' : 'Auto-speak OFF'}
            style={{
              background: autoSpeak ? 'rgba(20,184,166,0.2)' : 'transparent',
              border: '1px solid var(--color-border)', borderRadius: '0.5rem',
              padding: '0.35rem', cursor: 'pointer', display: 'flex',
              color: autoSpeak ? 'var(--color-primary-light)' : 'var(--color-text-secondary)',
            }}
          >
            {autoSpeak ? <Volume2 size={16} /> : <VolumeX size={16} />}
          </button>
        </div>
      </div>

      {/* Chat Messages */}
      <div style={{
        flex: 1, overflowY: 'auto', padding: '1.25rem',
        display: 'flex', flexDirection: 'column', gap: '1rem',
      }}>
        {messages.length === 0 && (
          <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--color-text-secondary)' }}>
            <Bot size={40} style={{ marginBottom: '1rem', opacity: 0.3 }} />
            <h4 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.5rem', color: 'var(--color-text-primary)' }}>
              Voice Health Assistant
            </h4>
            <p style={{ fontSize: '0.85rem', lineHeight: 1.6, maxWidth: '400px', margin: '0 auto' }}>
              Ask me anything about your health records in English or Hindi. I'll answer using your medical data.
            </p>
            <div style={{ marginTop: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', alignItems: 'center' }}>
              {[
                language === 'hi' ? 'Mera blood group kya hai?' : 'What is my blood group?',
                language === 'hi' ? 'Mujhe kya allergy hai?' : 'Do I have any allergies?',
                language === 'hi' ? 'Meri dawaiyan kya hain?' : 'What medications am I on?',
              ].map((q, i) => (
                <button
                  key={i}
                  onClick={() => handleSend(q)}
                  style={{
                    background: 'rgba(20,184,166,0.08)', border: '1px solid rgba(20,184,166,0.2)',
                    borderRadius: '0.75rem', padding: '0.5rem 1rem', color: 'var(--color-primary-light)',
                    cursor: 'pointer', fontSize: '0.85rem', transition: 'all 0.2s ease',
                  }}
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <div
            key={i}
            style={{
              display: 'flex', gap: '0.75rem',
              flexDirection: msg.role === 'user' ? 'row-reverse' : 'row',
            }}
          >
            <div style={{
              width: '2rem', height: '2rem', borderRadius: '50%', flexShrink: 0,
              background: msg.role === 'user' ? 'rgba(59,130,246,0.2)' : 'rgba(20,184,166,0.2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              {msg.role === 'user' ? <User size={14} color="#60a5fa" /> : <Bot size={14} color="#14b8a6" />}
            </div>
            <div style={{
              maxWidth: '75%', padding: '0.85rem 1.1rem', borderRadius: '1rem',
              background: msg.role === 'user'
                ? 'linear-gradient(135deg, rgba(59,130,246,0.15), rgba(59,130,246,0.08))'
                : 'rgba(15,23,42,0.8)',
              border: `1px solid ${msg.role === 'user' ? 'rgba(59,130,246,0.2)' : 'var(--color-border)'}`,
              fontSize: '0.9rem', lineHeight: 1.65,
            }}>
              {msg.text}
              {msg.role === 'ai' && (
                <button
                  onClick={() => speak(msg.text)}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: '0.3rem',
                    background: 'none', border: 'none', color: 'var(--color-primary-light)',
                    cursor: 'pointer', fontSize: '0.75rem', marginLeft: '0.5rem', opacity: 0.7,
                  }}
                >
                  <Volume2 size={12} /> Play
                </button>
              )}
            </div>
          </div>
        ))}

        {isLoading && (
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <div style={{
              width: '2rem', height: '2rem', borderRadius: '50%', flexShrink: 0,
              background: 'rgba(20,184,166,0.2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Bot size={14} color="#14b8a6" />
            </div>
            <div style={{
              padding: '0.85rem 1.1rem', borderRadius: '1rem',
              background: 'rgba(15,23,42,0.8)', border: '1px solid var(--color-border)',
              fontSize: '0.9rem', color: 'var(--color-text-secondary)',
              display: 'flex', alignItems: 'center', gap: '0.5rem',
            }}>
              <Loader size={14} style={{ animation: 'spin 1s linear infinite' }} />
              Analyzing your records...
            </div>
          </div>
        )}

        <div ref={chatEndRef} />
      </div>

      {/* Interim transcript */}
      {isListening && interimText && (
        <div style={{
          padding: '0.5rem 1.5rem', background: 'rgba(59,130,246,0.05)',
          borderTop: '1px solid rgba(59,130,246,0.1)', fontSize: '0.85rem',
          color: 'var(--color-text-secondary)', fontStyle: 'italic',
        }}>
          🎤 {interimText}
        </div>
      )}

      {/* Input Area */}
      <div style={{
        padding: '1rem 1.25rem', borderTop: '1px solid var(--color-border)',
        display: 'flex', alignItems: 'center', gap: '0.75rem',
        background: 'rgba(15,23,42,0.5)',
      }}>
        {/* Mic Button */}
        <button
          onClick={isListening ? stopListening : startListening}
          style={{
            width: '2.75rem', height: '2.75rem', borderRadius: '50%', flexShrink: 0,
            background: isListening
              ? 'linear-gradient(135deg, #dc2626, #ef4444)'
              : 'linear-gradient(135deg, var(--color-primary), var(--color-primary-light))',
            border: 'none', cursor: 'pointer', display: 'flex',
            alignItems: 'center', justifyContent: 'center',
            boxShadow: isListening ? '0 0 20px rgba(239,68,68,0.4)' : '0 0 20px rgba(20,184,166,0.2)',
            transition: 'all 0.2s ease',
            animation: isListening ? 'pulse-red 1.5s infinite' : 'none',
          }}
        >
          {isListening ? <MicOff size={18} color="white" /> : <Mic size={18} color="white" />}
        </button>

        {/* Text Input */}
        <input
          className="input-field"
          placeholder={isListening ? 'Listening...' : language === 'hi' ? 'Apna sawaal poochein...' : 'Ask about your health...'}
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={isListening}
          style={{ flex: 1 }}
        />

        {/* Send Button */}
        <button
          onClick={() => handleSend()}
          disabled={!inputText.trim() || isLoading}
          style={{
            width: '2.75rem', height: '2.75rem', borderRadius: '50%', flexShrink: 0,
            background: inputText.trim() ? 'var(--color-primary)' : 'var(--color-border)',
            border: 'none', cursor: inputText.trim() ? 'pointer' : 'default',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'all 0.2s ease',
          }}
        >
          <Send size={16} color="white" />
        </button>

        {/* Stop speaking */}
        {isSpeaking && (
          <button
            onClick={stopSpeaking}
            style={{
              width: '2.75rem', height: '2.75rem', borderRadius: '50%', flexShrink: 0,
              background: 'rgba(239,68,68,0.2)', border: '1px solid rgba(239,68,68,0.3)',
              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            <VolumeX size={16} color="#f87171" />
          </button>
        )}
      </div>

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
