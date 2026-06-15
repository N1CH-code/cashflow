'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Send, Bot, User, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useTranslation } from '@/lib/i18n';
import { PageContainer } from '@/components/layout/PageContainer';
import { GlassCard } from '@/components/ui/glass-card';
import { cn } from '@/lib/utils';
import { api } from '@/lib/api';

function MarkdownRenderer({ content }: { content: string }) {
  const lines = content.split('\n');
  return (
    <div className="text-sm leading-relaxed">
      {lines.map((line, i) => {
        if (line.startsWith('### ')) return <p key={i} className="text-base font-bold text-white mt-2 mb-1">{line.slice(4)}</p>;
        if (line.startsWith('## ')) return <p key={i} className="text-lg font-bold text-white mt-3 mb-1">{line.slice(3)}</p>;
        if (line.startsWith('# ')) return <p key={i} className="text-xl font-bold text-white mt-3 mb-2">{line.slice(2)}</p>;
        if (line.startsWith('**') && line.endsWith('**')) return <p key={i} className="font-semibold text-white">{line.slice(2, -2)}</p>;
        if (line.startsWith('- ')) return <li key={i} className="text-white/80 ml-4 list-disc">{line.slice(2)}</li>;
        if (line.startsWith('* ')) return <li key={i} className="text-white/80 ml-4 list-disc">{line.slice(2)}</li>;
        if (line.startsWith('> ')) return <blockquote key={i} className="border-l-2 border-accent-ruby pl-3 text-white/60 italic my-1">{line.slice(2)}</blockquote>;
        if (line === '') return <br key={i} />;
        return <p key={i} className="text-white/80">{line}</p>;
      })}
    </div>
  );
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export default function AiChatPage() {
  const { t } = useTranslation();
  const suggestedQuestions = [
    t('ai.questions.whereSpent'),
    t('ai.questions.afford'),
    t('ai.questions.saveMore'),
    t('ai.questions.biggestExpenses'),
  ];
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [initialized, setInitialized] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!initialized && messages.length === 0) {
      setMessages([
        {
          role: 'assistant',
          content: t('ai.welcome'),
        },
      ]);
      setInitialized(true);
    }
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (text?: string) => {
    const msg = text || input;
    if (!msg.trim() || loading) return;

    const userMsg: Message = { role: 'user', content: msg };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const response = await api.chatWithAI(msg);
      const aiMsg: Message = { role: 'assistant', content: response.message || response.reply || 'I couldn\'t process that. Please try again.' };
      setMessages((prev) => [...prev, aiMsg]);
    } catch {
      setMessages((prev) => [...prev, { role: 'assistant', content: 'Sorry, I encountered an error. Please try again later.' }]);
    }
    setLoading(false);
  };

  return (
    <PageContainer withNav={false}>
      <div className="flex h-screen flex-col pt-4">
        <div className="mb-4 px-4">
          <h1 className="text-xl font-bold text-white">{t('ai.title')}</h1>
        </div>

        <div className="flex-1 overflow-y-auto px-4 pb-4 scrollbar-none">
          <div className="space-y-4">
            {messages.map((msg, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 }}
                className={cn('flex gap-3', msg.role === 'user' ? 'flex-row-reverse' : 'flex-row')}
              >
                <div
                  className={cn(
                    'flex h-8 w-8 shrink-0 items-center justify-center rounded-xl',
                    msg.role === 'user' ? 'bg-accent-ruby/20' : 'bg-accent-blue/20',
                  )}
                >
                  {msg.role === 'user' ? <User size={16} className="text-accent-rose" /> : <Bot size={16} className="text-accent-blue" />}
                </div>
                <div
                  className={cn(
                    'max-w-[80%] rounded-2xl px-4 py-3',
                    msg.role === 'user'
                      ? 'bg-accent-ruby/15 rounded-tr-md'
                      : 'bg-dark-surface rounded-tl-md border border-white/5',
                  )}
                >
                  {msg.role === 'user' ? (
                    <p className="text-sm text-white">{msg.content}</p>
                  ) : (
                    <MarkdownRenderer content={msg.content} />
                  )}
                </div>
              </motion.div>
            ))}
            {loading && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-accent-blue/20">
                  <Bot size={16} className="text-accent-blue" />
                </div>
                <div className="rounded-2xl bg-dark-surface border border-white/5 px-4 py-3 rounded-tl-md">
                  <div className="flex gap-1">
                    <span className="h-2 w-2 animate-bounce rounded-full bg-white/40" style={{ animationDelay: '0ms' }} />
                    <span className="h-2 w-2 animate-bounce rounded-full bg-white/40" style={{ animationDelay: '150ms' }} />
                    <span className="h-2 w-2 animate-bounce rounded-full bg-white/40" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </motion.div>
            )}
          </div>
          <div ref={bottomRef} />
        </div>

        {messages.length <= 1 && (
          <div className="px-4 mb-4">
            <p className="mb-2 text-xs font-medium text-white/40 uppercase">{t('ai.suggested')}</p>
            <div className="flex flex-wrap gap-2">
              {suggestedQuestions.map((q) => (
                <button
                  key={q}
                  onClick={() => handleSend(q)}
                  className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white/60 transition-colors hover:border-accent-ruby/30 hover:text-accent-rose"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="border-t border-white/5 px-4 py-3">
          <div className="flex gap-2">
            <Input
              placeholder={t('ai.placeholder')}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              className="flex-1"
            />
            <button
              onClick={() => handleSend()}
              disabled={!input.trim() || loading}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-r from-accent-ruby to-accent-crimson text-white shadow-lg shadow-accent-ruby/25 disabled:opacity-50"
            >
              {loading ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
            </button>
          </div>
        </div>
      </div>
    </PageContainer>
  );
}
