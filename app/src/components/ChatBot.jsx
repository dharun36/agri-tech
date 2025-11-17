/**
 * ChatBot Component - Farming Assistant Interface
 * 
 * A modern, responsive chat interface for the farming assistant.
 * Features:
 * - Clean, WhatsApp-like design
 * - Typing indicators
 * - Action item highlights
 * - Suggested messages
 * - Responsive layout
 */

import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import {
  FaPaperPlane,
  FaRobot,
  FaUser,
  FaSeedling,
  FaTimes,
  FaComments,
  FaMicrophone,
  FaStop
} from 'react-icons/fa';
import chatService from '../services/chatService';

const ChatBot = ({ isOpen, onClose }) => {
  const { t } = useTranslation();
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Auto-scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  // Focus input when chat opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // Initialize chat with welcome message
  useEffect(() => {
    if (messages.length === 0) {
      setMessages([{
        id: 'welcome',
        role: 'assistant',
        content: "🌱 Hello! I'm your farming assistant. I can help you manage crops, check weather, track fertilizer applications, and more. What would you like to do today?",
        timestamp: new Date().toISOString(),
        isWelcome: true
      }]);
    }
  }, []);

  /**
   * Send message to chatbot
   */
  const sendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: inputMessage.trim(),
      timestamp: new Date().toISOString()
    };

    // Add user message to chat
    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);
    setIsTyping(true);
    setShowSuggestions(false);

    try {
      // Send message to chat service
      const response = await chatService.sendMessage(userMessage.content);

      // Create assistant message
      const assistantMessage = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: response.message,
        timestamp: response.timestamp,
        success: response.success,
        functionCalls: response.functionCalls || [],
        actions: chatService.extractActionItems(response)
      };

      // Add assistant message
      setMessages(prev => [...prev, assistantMessage]);

      // If rate limited, show helpful suggestion
      if (response.isRateLimited) {
        setTimeout(() => {
          const suggestionMessage = {
            id: `suggestion-${Date.now()}`,
            role: 'assistant',
            content: "💡 While you wait, you can use the navigation menu to manage crops manually, or try the quick actions below for common tasks.",
            timestamp: new Date().toISOString(),
            isSuggestion: true
          };
          setMessages(prev => [...prev, suggestionMessage]);
        }, 1000);
      }

    } catch (error) {
      console.error('Chat error:', error);

      // Add error message
      const errorMessage = {
        id: `error-${Date.now()}`,
        role: 'assistant',
        content: chatService.getErrorMessage(error),
        timestamp: new Date().toISOString(),
        isError: true
      };

      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
      setIsTyping(false);
    }
  };

  /**
   * Handle Enter key press
   */
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  /**
   * Use suggested message
   */
  const useSuggestedMessage = (suggestion) => {
    setInputMessage(suggestion);
    setShowSuggestions(false);
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  /**
   * Clear chat history
   */
  const clearChat = () => {
    setMessages([]);
    chatService.clearHistory();
    setShowSuggestions(true);
  };

  // Don't render if not open
  if (!isOpen) return null;

  // Don't render if not open
  if (!isOpen) return null;

  return (
    <div className="fixed bottom-20 right-6 z-50 w-96 h-[500px] flex flex-col">
      <div className="bg-white rounded-2xl shadow-2xl h-full flex flex-col border border-gray-200">
        {/* Header */}
        <div className="bg-green-600 text-white p-3 rounded-t-2xl flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="bg-white bg-opacity-20 p-1.5 rounded-full">
              <FaSeedling className="text-sm" />
            </div>
            <div>
              <h3 className="font-semibold text-sm">Farming Assistant</h3>
              <p className="text-green-100 text-xs">
                {isTyping ? 'Thinking...' : isLoading ? 'Processing...' : 'Online'}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-1">
            <button
              onClick={clearChat}
              className="text-white hover:bg-white hover:bg-opacity-20 p-1.5 rounded-full transition-colors"
              title="Clear chat"
            >
              <FaComments className="text-sm" />
            </button>
            <button
              onClick={onClose}
              className="text-white hover:bg-white hover:bg-opacity-20 p-1.5 rounded-full transition-colors"
            >
              <FaTimes className="text-sm" />
            </button>
          </div>
        </div>

        {/* Messages Container */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((message) => (
            <MessageBubble key={message.id} message={message} />
          ))}

          {/* Typing indicator */}
          {isTyping && <TypingIndicator />}

          {/* Suggested messages */}
          {showSuggestions && messages.length <= 1 && (
            <SuggestedMessages onSelect={useSuggestedMessage} />
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="border-t p-4">
          <div className="flex items-center space-x-2">
            <div className="flex-1 relative">
              <textarea
                ref={inputRef}
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type your message..."
                rows="1"
                className="w-full border border-gray-300 rounded-full px-4 py-2 pr-12 resize-none focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                disabled={isLoading}
              />
              {inputMessage.trim() && (
                <button
                  onClick={sendMessage}
                  disabled={isLoading}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-green-600 text-white p-2 rounded-full hover:bg-green-700 transition-colors disabled:opacity-50"
                >
                  <FaPaperPlane className="text-sm" />
                </button>
              )}
            </div>
          </div>

          {/* Quick actions */}
          <div className="flex space-x-2 mt-2">
            <QuickActionButton
              text="My crops"
              onClick={() => useSuggestedMessage("Show me all my crops")}
            />
            <QuickActionButton
              text="Weather"
              onClick={() => useSuggestedMessage("What's the weather like?")}
            />
            <QuickActionButton
              text="Add crop"
              onClick={() => useSuggestedMessage("Add a new crop to my farm")}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * Individual message bubble component
 */
const MessageBubble = ({ message }) => {
  const isUser = message.role === 'user';
  const isError = message.isError;
  const isSuggestion = message.isSuggestion;

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-2xl ${isUser
        ? 'bg-green-600 text-white'
        : isError
          ? 'bg-red-50 text-red-800 border border-red-200'
          : isSuggestion
            ? 'bg-blue-50 text-blue-800 border border-blue-200'
            : 'bg-gray-100 text-gray-800'
        }`}>
        {/* Message content */}
        <div
          className="whitespace-pre-wrap"
          dangerouslySetInnerHTML={{
            __html: chatService.formatMessage(message.content)
          }}
        />

        {/* Action items */}
        {message.actions && message.actions.length > 0 && (
          <div className="mt-2 space-y-1">
            {message.actions.map((action, index) => (
              <div key={index} className="flex items-center space-x-2 text-sm opacity-90">
                <span>{action.icon}</span>
                <span>{action.type.replace('_', ' ')}</span>
              </div>
            ))}
          </div>
        )}

        {/* Timestamp */}
        <div className={`text-xs mt-1 ${isUser ? 'text-green-100' : 'text-gray-500'
          }`}>
          {new Date(message.timestamp).toLocaleTimeString()}
        </div>
      </div>
    </div>
  );
};

/**
 * Typing indicator component
 */
const TypingIndicator = () => (
  <div className="flex justify-start">
    <div className="bg-gray-100 px-3 py-2 rounded-xl">
      <div className="flex items-center space-x-2">
        <FaRobot className="text-green-600 text-sm" />
        <div className="flex space-x-1">
          <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"></div>
          <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
          <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
        </div>
      </div>
    </div>
  </div>
);

/**
 * Suggested messages component
 */
const SuggestedMessages = ({ onSelect }) => {
  const suggestions = chatService.getSuggestedMessages();

  return (
    <div className="space-y-2">
      <p className="text-sm text-gray-500 text-center">Try asking:</p>
      <div className="grid grid-cols-1 gap-2">
        {suggestions.slice(0, 4).map((suggestion, index) => (
          <button
            key={index}
            onClick={() => onSelect(suggestion)}
            className="text-left p-3 bg-gray-50 hover:bg-gray-100 rounded-lg border border-gray-200 transition-colors text-sm"
          >
            {suggestion}
          </button>
        ))}
      </div>
    </div>
  );
};

/**
 * Quick action button component
 */
const QuickActionButton = ({ text, onClick }) => (
  <button
    onClick={onClick}
    className="bg-green-50 hover:bg-green-100 text-green-700 px-2 py-1 rounded-lg text-xs transition-colors border border-green-200"
  >
    {text}
  </button>
);

export default ChatBot;