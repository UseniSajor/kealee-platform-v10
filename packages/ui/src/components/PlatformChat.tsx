/**
 * PlatformChat — Floating conversational AI chat widget
 *
 * Presentation-only component: all data fetching and streaming
 * are handled by the parent via props/callbacks.
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { cn } from '../lib/utils';

// ─── Types ────────────────────────────────────────────────────────────────

export interface ChatAction {
  type: 'approve_decision' | 'reschedule_task' | 'send_message' | 'request_change_order';
  description: string;
  data: Record<string, unknown>;
  requiresConfirmation: boolean;
}

export interface ChatSource {
  type: 'project' | 'task' | 'budget' | 'bid' | 'report' | 'photo' | 'contractor';
  id: string;
  label: string;
}

export interface ConversationMessage {
  role: 'user' | 'assistant';
  content: string;
  toolsUsed?: string[];
  actions?: ChatAction[];
  sources?: ChatSource[];
  timestamp: string;
}

export interface PlatformChatProps {
  messages: ConversationMessage[];
  onSendMessage: (message: string) => void;
  onActionClick?: (action: ChatAction) => void;
  onSourceClick?: (source: ChatSource) => void;
  isLoading?: boolean;
  streamingText?: string;
  userName?: string;
  isOpen?: boolean;
  onToggle?: () => void;
  position?: 'bottom-right' | 'bottom-left';
  className?: string;
}

// ─── Source Badge Colors ──────────────────────────────────────────────────

const sourceBadgeColors: Record<string, string> = {
  project: 'bg-blue-100 text-blue-700',
  task: 'bg-green-100 text-green-700',
  budget: 'bg-amber-100 text-amber-700',
  bid: 'bg-purple-100 text-purple-700',
  report: 'bg-gray-100 text-gray-700',
  photo: 'bg-pink-100 text-pink-700',
  contractor: 'bg-teal-100 text-teal-700',
};

// ─── Message Bubble ──────────────────────────────────────────────────────

function MessageBubble({
  msg,
  onActionClick,
  onSourceClick,
}: {
  msg: ConversationMessage;
  onActionClick?: (action: ChatAction) => void;
  onSourceClick?: (source: ChatSource) => void;
}) {
  const isUser = msg.role === 'user';

  return (
    <div className={cn('flex w-full mb-3', isUser ? 'justify-end' : 'justify-start')}>
      <div
        className={cn(
          'max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed',
          isUser
            ? 'bg-blue-600 text-white rounded-br-md'
            : 'bg-gray-100 text-gray-900 rounded-bl-md',
        )}
      >
        {/* Message content */}
        <div className="whitespace-pre-wrap break-words">{msg.content}</div>

        {/* Sources */}
        {msg.sources && msg.sources.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-2 pt-2 border-t border-gray-200/50">
            {msg.sources.map((source, i) => (
              <button
                key={`${source.id}-${i}`}
                onClick={() => onSourceClick?.(source)}
                className={cn(
                  'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium cursor-pointer hover:opacity-80 transition-opacity',
                  sourceBadgeColors[source.type] || 'bg-gray-100 text-gray-600',
                )}
              >
                {source.label}
              </button>
            ))}
          </div>
        )}

        {/* Action buttons */}
        {msg.actions && msg.actions.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-3 pt-2 border-t border-gray-200/50">
            {msg.actions.map((action, i) => (
              <button
                key={`action-${i}`}
                onClick={() => onActionClick?.(action)}
                className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-600 text-white hover:bg-blue-700 transition-colors shadow-sm"
              >
                {action.description}
              </button>
            ))}
          </div>
        )}

        {/* Tools used indicator */}
        {msg.toolsUsed && msg.toolsUsed.length > 0 && (
          <div className="text-[10px] mt-2 opacity-50">
            Looked up: {msg.toolsUsed.join(', ')}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Typing Indicator ────────────────────────────────────────────────────

function TypingIndicator() {
  return (
    <div className="flex justify-start mb-3">
      <div className="bg-gray-100 rounded-2xl rounded-bl-md px-4 py-3 flex items-center gap-1">
        <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
        <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
        <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
      </div>
    </div>
  );
}

// ─── Chat Icon SVG ──────────────────────────────────────────────────────

function ChatIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  );
}

function CloseIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

function SendIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="22" y1="2" x2="11" y2="13" />
      <polygon points="22 2 15 22 11 13 2 9 22 2" />
    </svg>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────

export function PlatformChat({
  messages,
  onSendMessage,
  onActionClick,
  onSourceClick,
  isLoading = false,
  streamingText,
  userName,
  isOpen: controlledOpen,
  onToggle,
  position = 'bottom-right',
  className,
}: PlatformChatProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  const isOpen = controlledOpen !== undefined ? controlledOpen : internalOpen;

  const toggleOpen = useCallback(() => {
    if (onToggle) {
      onToggle();
    } else {
      setInternalOpen((prev) => !prev);
    }
  }, [onToggle]);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, streamingText, isLoading]);

  // Focus input when panel opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  const handleSend = useCallback(() => {
    const trimmed = inputValue.trim();
    if (!trimmed || isLoading) return;
    onSendMessage(trimmed);
    setInputValue('');
  }, [inputValue, isLoading, onSendMessage]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    },
    [handleSend],
  );

  const positionClass =
    position === 'bottom-left' ? 'left-4 sm:left-6' : 'right-4 sm:right-6';

  return (
    <>
      {/* ── Chat Panel ──────────────────────────────────────────── */}
      {isOpen && (
        <div
          className={cn(
            'fixed bottom-20 z-50 flex flex-col bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden',
            // Mobile: full screen. Desktop: fixed size
            'inset-4 sm:inset-auto sm:bottom-20 sm:w-[400px] sm:h-[600px] sm:max-h-[80vh]',
            positionClass,
            className,
          )}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white flex-shrink-0">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                <ChatIcon className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-semibold text-sm">Kealee AI</h3>
                <p className="text-[10px] text-blue-100">
                  {isLoading ? 'Thinking...' : 'Online'}
                </p>
              </div>
            </div>
            <button
              onClick={toggleOpen}
              className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/20 transition-colors"
              aria-label="Close chat"
            >
              <CloseIcon className="w-4 h-4" />
            </button>
          </div>

          {/* Messages */}
          <div
            ref={messagesContainerRef}
            className="flex-1 overflow-y-auto px-4 py-4 space-y-1"
          >
            {/* Welcome message if no messages */}
            {messages.length === 0 && !streamingText && (
              <div className="text-center text-gray-500 text-sm py-8">
                <div className="w-12 h-12 mx-auto mb-3 bg-blue-100 rounded-full flex items-center justify-center">
                  <ChatIcon className="w-6 h-6 text-blue-600" />
                </div>
                <p className="font-medium text-gray-700">
                  Hi{userName ? ` ${userName}` : ''}! I'm your Kealee AI assistant.
                </p>
                <p className="mt-1 text-xs text-gray-400">
                  Ask me about your projects, budgets, schedules, or anything else.
                </p>
              </div>
            )}

            {/* Conversation messages */}
            {messages.map((msg, i) => (
              <MessageBubble
                key={`msg-${i}`}
                msg={msg}
                onActionClick={onActionClick}
                onSourceClick={onSourceClick}
              />
            ))}

            {/* Streaming text (partial response) */}
            {streamingText && (
              <div className="flex justify-start mb-3">
                <div className="max-w-[85%] bg-gray-100 text-gray-900 rounded-2xl rounded-bl-md px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap">
                  {streamingText}
                  <span className="inline-block w-1.5 h-4 bg-blue-500 animate-pulse ml-0.5 align-middle" />
                </div>
              </div>
            )}

            {/* Loading indicator */}
            {isLoading && !streamingText && <TypingIndicator />}

            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="flex-shrink-0 border-t border-gray-200 px-3 py-3 bg-white">
            <div className="flex items-end gap-2">
              <textarea
                ref={inputRef}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask me anything..."
                rows={1}
                className="flex-1 resize-none rounded-xl border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent max-h-24 overflow-y-auto"
                style={{ minHeight: '40px' }}
                disabled={isLoading}
              />
              <button
                onClick={handleSend}
                disabled={!inputValue.trim() || isLoading}
                className={cn(
                  'flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center transition-all',
                  inputValue.trim() && !isLoading
                    ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-sm'
                    : 'bg-gray-100 text-gray-400 cursor-not-allowed',
                )}
                aria-label="Send message"
              >
                <SendIcon className="w-4 h-4" />
              </button>
            </div>
            <p className="text-[10px] text-gray-400 mt-1.5 text-center">
              Kealee AI can make mistakes. Verify important information.
            </p>
          </div>
        </div>
      )}

      {/* ── Floating Chat Bubble ────────────────────────────────── */}
      <button
        onClick={toggleOpen}
        className={cn(
          'fixed bottom-4 z-50 w-14 h-14 rounded-full shadow-lg flex items-center justify-center transition-all duration-200 hover:scale-105',
          isOpen
            ? 'bg-gray-600 hover:bg-gray-700'
            : 'bg-blue-600 hover:bg-blue-700',
          positionClass,
        )}
        aria-label={isOpen ? 'Close chat' : 'Open chat'}
      >
        {isOpen ? (
          <CloseIcon className="w-6 h-6 text-white" />
        ) : (
          <ChatIcon className="w-6 h-6 text-white" />
        )}
      </button>
    </>
  );
}

export default PlatformChat;
