import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Mic, MicOff, Activity, AlertCircle, Send, User, Bot, MapPin } from 'lucide-react';

interface Message {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  isEmergency?: boolean;
  mapsLinks?: string[];
}

export default function AIAssistant({ onTriggerSOS, userLocation }: { onTriggerSOS: (reason: string) => void, userLocation: [number, number] | null }) {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    { id: '1', sender: 'ai', text: 'Hello. I am your AI Emergency Assistant. How can I help you today? You can type or use voice. Say "Help Help" or "Bachao" for auto-SOS.' }
  ]);
  const [inputText, setInputText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const recognitionRef = useRef<any>(null);
  const isListeningRef = useRef(isListening);

  useEffect(() => {
    isListeningRef.current = isListening;
  }, [isListening]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const processWithAI = async (text: string) => {
    if (!text.trim()) return;
    
    const userMsg: Message = { id: Date.now().toString(), sender: 'user', text };
    setMessages(prev => [...prev, userMsg]);
    setIsProcessing(true);
    
    try {
      const res = await fetch('/api/ai/analyze-symptoms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, location: userLocation })
      });
      
      if (!res.ok) throw new Error('API Error');
      const data = await res.json();
      
      if (data.success) {
        const isCritical = data.text.includes('CRITICAL EMERGENCY:');
        const aiMsg: Message = { 
          id: (Date.now() + 1).toString(), 
          sender: 'ai', 
          text: data.text,
          isEmergency: isCritical,
          mapsLinks: data.mapsLinks
        };
        setMessages(prev => [...prev, aiMsg]);
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      console.error('AI Processing error:', error);
      setMessages(prev => [...prev, { 
        id: (Date.now() + 1).toString(), 
        sender: 'ai', 
        text: 'Error connecting to AI Assistant. Please seek immediate medical help if this is an emergency.',
        isEmergency: true
      }]);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSend = () => {
    if (inputText.trim()) {
      processWithAI(inputText);
      setInputText('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setIsListening(false);
  }, []);

  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = 'en-IN';

      recognitionRef.current.onresult = (event: any) => {
        let currentTranscript = '';
        let isFinal = false;
        
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          currentTranscript += event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            isFinal = true;
          }
        }
        
        setTranscript(currentTranscript);
        
        // Voice SOS Trigger
        const lowerTranscript = currentTranscript.toLowerCase();
        if (lowerTranscript.includes('help help') || lowerTranscript.includes('bachao')) {
          onTriggerSOS('Voice Trigger: ' + currentTranscript);
          stopListening();
          processWithAI(currentTranscript);
          setTranscript('');
          return;
        }

        if (isFinal) {
          processWithAI(currentTranscript);
          setTranscript('');
        }
      };

      recognitionRef.current.onerror = (event: any) => {
        if (event.error === 'aborted') {
          return;
        }
        console.error('Speech recognition error', event.error);
        setIsListening(false);
      };

      recognitionRef.current.onend = () => {
        if (isListeningRef.current) {
          try {
            recognitionRef.current.start();
          } catch (e) {
            setIsListening(false);
          }
        }
      };
    }
    
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [onTriggerSOS, stopListening]);

  const toggleListening = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  const startListening = () => {
    setTranscript('');
    try {
      recognitionRef.current.start();
      setIsListening(true);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 flex flex-col h-[600px]">
      <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-white rounded-t-2xl z-10">
        <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
          <Activity className="w-5 h-5 text-indigo-500" />
          AI Emergency Assistant
        </h2>
        <button
          onClick={toggleListening}
          className={`p-2 rounded-full transition-colors ${
            isListening ? 'bg-red-100 text-red-600 animate-pulse' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
          title={isListening ? "Stop listening" : "Start voice input"}
        >
          {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
        </button>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3 bg-gray-50">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex gap-3 max-w-[85%] ${msg.sender === 'user' ? 'self-end flex-row-reverse' : 'self-start'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${msg.sender === 'user' ? 'bg-indigo-100 text-indigo-600' : msg.isEmergency ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'}`}>
              {msg.sender === 'user' ? <User className="w-4 h-4" /> : msg.isEmergency ? <AlertCircle className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
            </div>
            <div className={`p-3 rounded-2xl text-sm ${
              msg.sender === 'user' 
                ? 'bg-indigo-600 text-white rounded-tr-none' 
                : msg.isEmergency 
                  ? 'bg-red-50 text-red-800 border border-red-200 rounded-tl-none' 
                  : 'bg-white text-gray-800 border border-gray-200 rounded-tl-none shadow-sm'
            }`}>
              <div className="whitespace-pre-wrap font-sans">{msg.text}</div>
              {msg.mapsLinks && msg.mapsLinks.length > 0 && (
                <div className="mt-3 flex flex-col gap-1 border-t border-gray-200 pt-2">
                  <span className="text-xs font-semibold text-gray-500 mb-1">Nearby Facilities:</span>
                  {msg.mapsLinks.map((link, idx) => (
                    <a key={idx} href={link} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-indigo-600 hover:text-indigo-800 hover:underline text-xs">
                      <MapPin className="w-3 h-3" /> View on Maps ({idx + 1})
                    </a>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
        
        {transcript && (
          <div className="flex gap-3 max-w-[85%] self-end flex-row-reverse opacity-70">
            <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 bg-indigo-100 text-indigo-600">
              <User className="w-4 h-4" />
            </div>
            <div className="p-3 rounded-2xl text-sm bg-indigo-600 text-white rounded-tr-none italic">
              {transcript}...
            </div>
          </div>
        )}

        {isProcessing && (
          <div className="flex gap-3 max-w-[85%] self-start">
            <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 bg-blue-100 text-blue-600">
              <Bot className="w-4 h-4" />
            </div>
            <div className="p-3 rounded-2xl text-sm bg-white text-gray-800 border border-gray-200 rounded-tl-none shadow-sm flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
              Typing...
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 border-t border-gray-100 bg-white rounded-b-2xl">
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type your emergency here..."
            className="flex-1 bg-gray-100 border-transparent focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 rounded-xl px-4 py-2 text-sm transition-all outline-none"
            disabled={isProcessing}
          />
          <button
            onClick={handleSend}
            disabled={!inputText.trim() || isProcessing}
            className="p-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
