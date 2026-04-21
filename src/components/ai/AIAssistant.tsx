import React, { useState, useEffect, useRef } from 'react';
import { GoogleGenAI } from "@google/genai";
import { 
  MessageSquare, 
  X, 
  Send, 
  Bot, 
  User, 
  Loader2, 
  Sparkles, 
  Zap,
  ShoppingBag,
  ExternalLink
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { db } from '@/lib/firebase';
import { collection, getDocs } from 'firebase/firestore';

interface Message {
  role: 'user' | 'model';
  text: string;
}

export default function AIAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { role: 'model', text: "Hi! I'm your Shopsy AI Assistant. How can I help you find the perfect product today?" }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  
  // Model initialization
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  const model = "gemini-3-flash-preview";

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setMessages(prev => [...prev, { role: 'user', text: userMessage }]);
    setInput('');
    setIsLoading(true);

    try {
      // 1. Fetch current catalog for context
      const pSnap = await getDocs(collection(db, 'products'));
      const productCatalog = pSnap.docs.map(d => ({
        name: d.data().name,
        price: d.data().price,
        category: d.data().category,
        image: d.data().image
      }));

      const systemInstruction = `
        You are a helpful and energetic E-commerce personal shopper named "Shopsy Assistant".
        Your goal is to help users find products from our current catalog.
        
        Current Catalog:
        ${JSON.stringify(productCatalog)}

        Rules:
        1. Only recommend products from the catalog provided above.
        2. Be enthusiastic and professional.
        3. If you recommend a product, mention its name and price.
        4. If a user asks for something not in the catalog, politely explain we don't have it but suggest the closest alternative.
        5. Use markdown for formatting (e.g., **bold** for product names).
      `;

      const chat = ai.chats.create({
        model,
        config: {
          systemInstruction,
        }
      });

      // Prepare history
      const history = messages.map(m => ({
        role: m.role,
        parts: [{ text: m.text }]
      }));

      const response = await ai.models.generateContent({
        model,
        contents: [...history, { role: 'user', parts: [{ text: userMessage }] }],
        config: { systemInstruction }
      });

      setMessages(prev => [...prev, { role: 'model', text: response.text || "I'm sorry, I couldn't process that." }]);
    } catch (error) {
      console.error("AI Error:", error);
      setMessages(prev => [...prev, { role: 'model', text: "Oops! My circuits got crossed. Please try again in a moment." }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <AnimatePresence>
        {!isOpen && (
          <motion.div
            initial={{ scale: 0, rotate: -45 }}
            animate={{ scale: 1, rotate: 0 }}
            exit={{ scale: 0, rotate: 45 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <Button
              onClick={() => setIsOpen(true)}
              className="w-16 h-16 rounded-full bg-orange-600 hover:bg-orange-700 shadow-2xl shadow-orange-200 flex flex-col items-center justify-center gap-0 p-0 border-4 border-white"
            >
              <Sparkles className="h-4 w-4 text-yellow-400 absolute top-3 right-3 animate-pulse" />
              <Bot className="h-8 w-8 text-white" />
            </Button>
          </motion.div>
        )}

        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 100, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 100, scale: 0.8 }}
            className="w-[90vw] md:w-[400px] h-[500px] bg-white rounded-[32px] shadow-[0_20px_50px_rgba(234,88,12,0.2)] border border-orange-100 flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="p-6 bg-gradient-to-r from-orange-600 to-orange-500 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-white/20 p-2 rounded-xl backdrop-blur-sm">
                  <Bot className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-black uppercase tracking-tight italic text-sm">Shopsy <span className="text-yellow-400">Assistant</span></h3>
                  <div className="flex items-center gap-1">
                    <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
                    <span className="text-[10px] font-bold uppercase tracking-widest opacity-80">Online & Ready</span>
                  </div>
                </div>
              </div>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => setIsOpen(false)}
                className="text-white hover:bg-white/20 rounded-full"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>

            {/* Chat Content */}
            <ScrollArea className="flex-1 p-6 space-y-4" viewportRef={scrollRef}>
              <div className="space-y-6 pb-4">
                {messages.map((msg, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: msg.role === 'user' ? 20 : -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} gap-3`}
                  >
                    {msg.role === 'model' && (
                      <div className="bg-orange-100 p-2 rounded-lg h-fit flex-shrink-0">
                        <Bot className="h-4 w-4 text-orange-600" />
                      </div>
                    )}
                    <div className={`max-w-[80%] p-4 rounded-2xl text-sm font-medium leading-relaxed font-sans shadow-sm ${
                      msg.role === 'user' 
                        ? 'bg-orange-600 text-white rounded-tr-none' 
                        : 'bg-gray-50 text-gray-800 rounded-tl-none border border-gray-100'
                    }`}>
                      {msg.text}
                    </div>
                  </motion.div>
                ))}
                {isLoading && (
                  <div className="flex justify-start gap-3">
                    <div className="bg-orange-100 p-2 rounded-lg h-fit">
                      <Bot className="h-4 w-4 text-orange-600" />
                    </div>
                    <div className="bg-gray-50 p-4 rounded-2xl rounded-tl-none border border-gray-100">
                      <Loader2 className="h-4 w-4 animate-spin text-orange-600" />
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>

            {/* Input */}
            <div className="p-4 border-t border-gray-100 bg-gray-50/50">
              <form 
                onSubmit={(e) => { e.preventDefault(); handleSend(); }}
                className="flex items-center gap-2"
              >
                <Input 
                  placeholder="Type your question..."
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  className="flex-1 rounded-xl border-gray-100 bg-white focus:border-orange-500 h-11 text-sm font-bold"
                />
                <Button 
                  type="submit" 
                  disabled={!input.trim() || isLoading}
                  className="bg-orange-600 hover:bg-orange-700 text-white rounded-xl h-11 w-11 p-0 shadow-lg shadow-orange-100 transition-all active:scale-95"
                >
                  <Send className="h-5 w-5" />
                </Button>
              </form>
              <p className="text-[9px] text-gray-400 text-center mt-3 font-black uppercase tracking-tighter">
                Powered by <span className="text-orange-600">Gemini 3 Flash</span>
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
