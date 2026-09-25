import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { api } from '../services/api';
import {
  MessageSquare,
  X,
  Send,
  Mic,
  MicOff,
  Volume2,
  Bot,
  User,
  Sparkles,
  Loader2,
  Info
} from 'lucide-react';

export function AIChatbot() {
  const { user } = useAuth();
  const { language, t } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: 'welcome',
      sender: 'bot',
      text:
        language === 'mr'
          ? 'नमस्कार! मी संगम सहाय्यक आहे. मी तुम्हाला शिष्यवृत्ती अर्ज, उत्पन्न दाखला पडताळणी, संमती आणि अर्जाच्या स्थितीबद्दल मदत करू शकतो.'
          : language === 'hi'
          ? 'नमस्ते! मैं संगम सहायक हूँ. मैं आपको छात्रवृत्ति आवेदन, आय प्रमाण पत्र सत्यापन, सहमति और आवेदन की स्थिति के बारे में सहायता कर सकता हूँ.'
          : 'Hello! I am Sangam Sahayak. I can assist you with your scholarship applications, automated Revenue document verification, citizen consent, or current status.'
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(true);
  const [errorNotice, setErrorNotice] = useState(null);

  const messagesEndRef = useRef(null);
  const recognitionRef = useRef(null);

  // Auto scroll to latest message
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  // Speech Recognition Setup (Web Speech API)
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;

      // Set language code based on current portal language
      if (language === 'mr') {
        recognition.lang = 'mr-IN';
      } else if (language === 'hi') {
        recognition.lang = 'hi-IN';
      } else {
        recognition.lang = 'en-IN';
      }

      recognition.onstart = () => {
        setIsListening(true);
        setErrorNotice(null);
      };

      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setInput(transcript);
        handleSend(transcript);
      };

      recognition.onerror = (event) => {
        console.warn('Speech recognition error:', event.error);
        setIsListening(false);
        if (event.error === 'not-allowed') {
          setErrorNotice('Microphone access was denied. Please allow microphone permissions or type your question.');
        } else {
          setErrorNotice('Voice recognition paused. You can speak again or type.');
        }
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    } else {
      setSpeechSupported(false);
    }
  }, [language]);

  const toggleListening = () => {
    if (!speechSupported || !recognitionRef.current) {
      setErrorNotice('Voice recognition is not supported in this browser. Please type your query.');
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      try {
        recognitionRef.current.start();
      } catch (e) {
        recognitionRef.current.stop();
        setTimeout(() => recognitionRef.current.start(), 200);
      }
    }
  };

  // Text to Speech (SpeechSynthesis)
  const speakText = (text) => {
    if (!('speechSynthesis' in window)) return;

    window.speechSynthesis.cancel(); // Stop any active speech
    // Clean markdown asterisks
    const cleanText = text.replace(/[*_#`]/g, '');
    const utterance = new SpeechSynthesisUtterance(cleanText);

    if (language === 'mr') {
      utterance.lang = 'mr-IN';
    } else if (language === 'hi') {
      utterance.lang = 'hi-IN';
    } else {
      utterance.lang = 'en-IN';
    }

    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    window.speechSynthesis.speak(utterance);
  };

  const handleSend = async (customMessage) => {
    const textToSend = typeof customMessage === 'string' ? customMessage : input;
    if (!textToSend.trim() || loading) return;

    const userMsg = { id: `usr-${Date.now()}`, sender: 'user', text: textToSend };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);
    setErrorNotice(null);

    try {
      const data = await api.ai.chat(textToSend, language);
      const botMsg = { id: `bot-${Date.now()}`, sender: 'bot', text: data.response };
      setMessages((prev) => [...prev, botMsg]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          id: `bot-err-${Date.now()}`,
          sender: 'bot',
          text: 'Sangam Sahayak is currently synchronizing with government directory. Please retry shortly.'
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const quickPrompts = [
    { label: language === 'mr' ? 'अर्जाची स्थिती?' : language === 'hi' ? 'आवेदन की स्थिति?' : 'Application status?', query: 'What is my application status?' },
    { label: language === 'mr' ? 'संगम आयडी काय आहे?' : language === 'hi' ? 'संगम आईडी क्या है?' : 'What is Sangam ID?', query: 'What is my Sangam ID?' },
    { label: language === 'mr' ? 'संमती कशी द्यावी?' : language === 'hi' ? 'सहमति क्यों चाहिए?' : 'Why consent is needed?', query: 'Why is consent required for document sharing?' },
    { label: language === 'mr' ? 'संगम कसे कार्य करते?' : language === 'hi' ? 'संगम कैसे काम करता है?' : 'How does Sangam work?', query: 'How does Sangam connect government services?' }
  ];

  return (
    <>
      {/* Floating Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 z-40 flex items-center space-x-2 px-4 py-3 rounded-full bg-[#0f294a] text-white shadow-lg hover:bg-[#1a385f] transition-all hover:scale-105 border border-slate-700"
        aria-label="Open AI Assistant"
      >
        <Bot className="w-5 h-5 text-amber-400" />
        <span className="text-xs font-semibold tracking-wide hidden sm:inline">
          {t('aiAssistantTitle')}
        </span>
        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
      </button>

      {/* Chat Window Modal */}
      {isOpen && (
        <div className="fixed bottom-20 right-4 sm:right-6 z-50 w-[92vw] sm:w-96 bg-white rounded-xl shadow-2xl border border-slate-300 flex flex-col h-[520px] max-h-[80vh] overflow-hidden">
          {/* Header */}
          <div className="bg-[#0f294a] text-white px-4 py-3 flex items-center justify-between">
            <div className="flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded-full bg-amber-400/20 flex items-center justify-center">
                <Bot className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <h3 className="text-xs font-bold tracking-tight">Sangam Sahayak AI</h3>
                <p className="text-[10px] text-slate-300">
                  {user ? `${user.name} (${user.role})` : 'Public Citizen Helpdesk'}
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 rounded text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Quick Prompts Bar */}
          <div className="px-3 py-2 bg-slate-50 border-b border-slate-200 overflow-x-auto flex space-x-1.5 scrollbar-none">
            {quickPrompts.map((p, idx) => (
              <button
                key={idx}
                onClick={() => handleSend(p.query)}
                className="whitespace-nowrap px-2 py-1 rounded-full text-[10px] font-medium bg-white text-slate-700 border border-slate-200 hover:bg-amber-50 hover:border-amber-300 transition-colors shrink-0"
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* Error Notice if Voice denied */}
          {errorNotice && (
            <div className="px-3 py-1.5 bg-amber-50 border-b border-amber-200 text-[11px] text-amber-800 flex items-center space-x-1.5">
              <Info className="w-3.5 h-3.5 shrink-0" />
              <span>{errorNotice}</span>
            </div>
          )}

          {/* Messages Body */}
          <div className="flex-1 p-3 overflow-y-auto space-y-3 bg-slate-50/50">
            {messages.map((m) => (
              <div
                key={m.id}
                className={`flex flex-col ${m.sender === 'user' ? 'items-end' : 'items-start'}`}
              >
                <div
                  className={`max-w-[85%] rounded-lg p-2.5 text-xs ${
                    m.sender === 'user'
                      ? 'bg-[#0f294a] text-white rounded-br-none'
                      : 'bg-white text-slate-800 border border-slate-200 shadow-2xs rounded-bl-none'
                  }`}
                >
                  <p className="whitespace-pre-line leading-relaxed">{m.text}</p>
                </div>
                {m.sender === 'bot' && (
                  <button
                    onClick={() => speakText(m.text)}
                    className="mt-1 flex items-center space-x-1 text-[10px] text-slate-500 hover:text-amber-600 transition-colors px-1"
                    title={t('readAloud')}
                  >
                    <Volume2 className="w-3 h-3" />
                    <span>{t('readAloud')}</span>
                  </button>
                )}
              </div>
            ))}

            {loading && (
              <div className="flex items-center space-x-2 text-xs text-slate-500 bg-white p-2.5 rounded-lg border border-slate-200 w-max shadow-2xs">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-500" />
                <span>Checking government records...</span>
              </div>
            )}

            {isListening && (
              <div className="flex items-center space-x-2 text-xs text-emerald-700 bg-emerald-50 p-2 rounded-lg border border-emerald-200 animate-pulse">
                <Mic className="w-3.5 h-3.5 text-emerald-600" />
                <span>{t('voiceListening')}</span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input Bar */}
          <div className="p-2.5 bg-white border-t border-slate-200 flex items-center space-x-1.5">
            <button
              type="button"
              onClick={toggleListening}
              className={`p-2 rounded-md transition-colors ${
                isListening
                  ? 'bg-red-500 text-white animate-pulse'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-[#0f294a]'
              }`}
              title="Voice Input (English, Hindi, Marathi)"
            >
              {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            </button>

            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder={t('typeMessagePlaceholder')}
              className="flex-1 text-xs border border-slate-200 rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-[#0f294a]"
              disabled={loading || isListening}
            />

            <button
              onClick={() => handleSend()}
              disabled={!input.trim() || loading}
              className="p-2 rounded-md bg-[#0f294a] text-white hover:bg-[#1a385f] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
