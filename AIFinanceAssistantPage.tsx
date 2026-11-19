// AI Finance Assistant Page ("ECONVYX Intelligence")

import React, { useState, useEffect, useRef } from 'react';
import {
  Sparkles,
  Send,
  Bot,
  User,
  ExternalLink,
  ShieldAlert,
  ArrowRight,
  HelpCircle,
  CheckCircle2,
} from 'lucide-react';
import { api } from '../../lib/api.js';
import { useAuth } from '../../context/AuthContext.js';
import { useNavigate } from 'react-router-dom';

interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  sourceReferences?: Array<{
    type: 'invoice' | 'bill' | 'customer' | 'bank_transaction' | 'verification';
    id: string;
    label: string;
  }>;
  deterministicCalculations?: Record<string, string>;
  suggestedFollowUps?: string[];
  timestamp: string;
}

export const AIFinanceAssistantPage: React.FC = () => {
  const { user, activeWorkspace } = useAuth();
  const navigate = useNavigate();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [inputQuery, setInputQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      sender: 'assistant',
      text: `Hello ${user?.fullName?.split(' ')[0] || 'there'}. I am **ECONVYX Intelligence**, your AI financial analyst.\n\nI answer your questions strictly using confirmed ledger data, verified invoices, and reconciled bank records for **${activeWorkspace?.name || 'Apex Components'}**. I will never invent numbers or execute transactions without your approval.\n\nHow can I help you today?`,
      suggestedFollowUps: [
        'How much money is currently outstanding?',
        'Which customers have the highest overdue balances?',
        'What is my expected cash position in 30 days?',
        'Why is this invoice flagged?',
        'Identify unreconciled payments.',
      ],
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendQuery = async (queryText?: string) => {
    const q = queryText || inputQuery;
    if (!q.trim() || isLoading) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: q,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputQuery('');
    setIsLoading(true);

    try {
      const res = await api.queryAssistant(q);

      const assistantMsg: ChatMessage = {
        id: `ai-${Date.now()}`,
        sender: 'assistant',
        text: res.answer,
        sourceReferences: res.sourceReferences,
        deterministicCalculations: res.deterministicCalculations,
        suggestedFollowUps: res.suggestedFollowUps,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err: any) {
      const errorMsg: ChatMessage = {
        id: `err-${Date.now()}`,
        sender: 'assistant',
        text: `Error processing financial query: ${err.message || 'Unable to retrieve data.'}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-8.5rem)] bg-white rounded-xl border border-brand-border shadow-card overflow-hidden">
      {/* Assistant Header */}
      <div className="flex items-center justify-between px-6 py-3.5 border-b border-brand-border bg-brand-deep-navy text-white">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-white/10 text-brand-bright-aqua">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold flex items-center gap-2">
              ECONVYX Intelligence
              <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded bg-brand-teal/30 text-brand-aqua border border-brand-teal/40">
                Grounded in Ledger Facts
              </span>
            </h2>
            <p className="text-[11px] text-slate-300">
              Workspace: {activeWorkspace?.name || 'Apex Components'} &bull; Currency: INR (₹)
            </p>
          </div>
        </div>

        <div className="text-[11px] text-slate-300 hidden sm:block italic">
          "AI interprets. Financial logic calculates. Humans approve."
        </div>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5 bg-slate-50/50">
        {messages.map((msg) => {
          const isUser = msg.sender === 'user';

          return (
            <div
              key={msg.id}
              className={`flex gap-3 max-w-3xl ${isUser ? 'ml-auto flex-row-reverse' : ''}`}
            >
              {/* Avatar */}
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                  isUser
                    ? 'bg-brand-teal text-white'
                    : 'bg-brand-primary-navy text-brand-bright-aqua'
                }`}
              >
                {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
              </div>

              {/* Message Body */}
              <div
                className={`p-4 rounded-xl text-xs space-y-3 leading-relaxed shadow-xs ${
                  isUser
                    ? 'bg-brand-deep-navy text-white rounded-tr-none'
                    : 'bg-white border border-slate-200 text-slate-800 rounded-tl-none'
                }`}
              >
                {/* Text Content */}
                <div className="whitespace-pre-wrap">{msg.text}</div>

                {/* Deterministic Calculations Card (Proof of math) */}
                {msg.deterministicCalculations && Object.keys(msg.deterministicCalculations).length > 0 && (
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-1.5 text-[11px]">
                    <div className="font-bold text-slate-700 flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-brand-teal" />
                      <span>Verified Ledger Calculations</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-200">
                      {Object.entries(msg.deterministicCalculations).map(([key, val]) => (
                        <div key={key}>
                          <span className="text-slate-500">{key}: </span>
                          <span className="font-bold text-slate-800">{val}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Source References */}
                {msg.sourceReferences && msg.sourceReferences.length > 0 && (
                  <div className="pt-2 border-t border-slate-100 text-[11px]">
                    <span className="font-bold text-slate-500">Source Records Cited: </span>
                    <div className="flex flex-wrap gap-1.5 mt-1">
                      {msg.sourceReferences.map((ref, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-0.5 rounded bg-slate-100 border border-slate-200 text-slate-700 font-medium"
                        >
                          {ref.label}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Suggested Follow-up Questions */}
                {msg.suggestedFollowUps && msg.suggestedFollowUps.length > 0 && (
                  <div className="pt-2 border-t border-slate-100">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                      Suggested Inquiries
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {msg.suggestedFollowUps.map((prompt, idx) => (
                        <button
                          key={idx}
                          onClick={() => handleSendQuery(prompt)}
                          className="text-[11px] text-brand-teal font-medium hover:bg-teal-50 px-2 py-1 rounded border border-teal-200 text-left transition-colors"
                        >
                          {prompt} &rarr;
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div className={`text-[10px] ${isUser ? 'text-slate-300' : 'text-slate-400'} text-right`}>
                  {msg.timestamp}
                </div>
              </div>
            </div>
          );
        })}

        {isLoading && (
          <div className="flex gap-3 max-w-md">
            <div className="w-8 h-8 rounded-full bg-brand-primary-navy text-brand-bright-aqua flex items-center justify-center shrink-0">
              <Bot className="w-4 h-4" />
            </div>
            <div className="p-3 bg-white border border-slate-200 rounded-xl rounded-tl-none text-xs text-slate-500 flex items-center gap-2">
              <span className="w-2 h-2 bg-brand-teal rounded-full animate-bounce" />
              <span className="w-2 h-2 bg-brand-teal rounded-full animate-bounce [animation-delay:0.2s]" />
              <span className="w-2 h-2 bg-brand-teal rounded-full animate-bounce [animation-delay:0.4s]" />
              <span>Analyzing business ledger...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Bar */}
      <div className="p-4 bg-white border-t border-brand-border">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendQuery();
          }}
          className="flex items-center gap-2"
        >
          <input
            type="text"
            value={inputQuery}
            onChange={(e) => setInputQuery(e.target.value)}
            placeholder="Ask a financial question (e.g. 'How much money is currently outstanding?')..."
            className="flex-1 px-4 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 outline-none focus:border-brand-teal focus:bg-white transition-all"
          />
          <button
            type="submit"
            disabled={!inputQuery.trim() || isLoading}
            className="p-2.5 bg-brand-deep-navy hover:bg-brand-midnight disabled:opacity-50 text-white rounded-lg transition-colors shadow-xs"
            aria-label="Send message"
          >
            <Send className="w-4 h-4 text-brand-aqua" />
          </button>
        </form>
        <div className="flex items-center justify-between text-[10px] text-slate-400 mt-2 px-1">
          <span>Answers are calculated deterministically from verified database records.</span>
          <span>Never executes unauthorized financial transfers.</span>
        </div>
      </div>
    </div>
  );
};
