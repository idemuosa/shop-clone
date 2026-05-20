import React, { useState, useEffect, useRef } from 'react';
import {
  Bot,
  X, 
  Send, 
  Loader2,
  Sparkles,
  MessageSquare
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';

interface Message {
  role: 'user' | 'model';
  text: string;
}

export default function AIAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { role: 'model', text: "Hi! I'm your Vivo AI Assistant. I can help you find products, track orders, or answer questions about our policies. How can I help you today?" }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setMessages(prev => [...prev, { role: 'user', text: userMessage }]);
    setInput('');
    setIsLoading(true);

    try {
      // 1. Fetch current catalog from Python API
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
      const pRes = await fetch(`${apiUrl}/products/`);
      let productCatalog = [];
      if (pRes.ok) {
        productCatalog = await pRes.json();
      }

      // 2. Prepare the prompt with Vivo Help Knowledge
      const systemInstruction = `
        You are "Vivo Assistant", a helpful e-commerce expert for Vivo Shop.
        
        VIVO HELP DESK KNOWLEDGE:
        - Order Tracking: Users can track orders in their Account Dashboard or via the confirmation email link.
        - Return Policy: 30-day money-back guarantee. Items must be in original condition.
        - Coupons: Apply codes at the checkout page in the 'Coupon Code' field.
        - Security: We use SSL encryption and secure payment partners.
        - Selling on Vivo: Users can apply via the 'Brands' page or 'Sell on Vivo' footer link.
        - Shipping: Free delivery on orders over $140. Same-day delivery available in some areas.

        PRODUCT CATALOG:
        ${JSON.stringify(productCatalog.slice(0, 20))}

        GUIDELINES:
        - Be enthusiastic, professional, and concise.
        - If recommending products, mention name and price.
        - If a user asks about something not in the catalog, suggest a similar item or say we don't have it yet.
        - Always use markdown for bolding **Product Names**.
      `;

      // Using a simpler fetch to a proxy or direct API if the SDK is problematic
      // Since we are in a browser, we'll try to use the Gemini API directly via fetch to avoid SDK version conflicts
      const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

      if (!apiKey) {
        throw new Error("Gemini API Key is missing");
      }

      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            { role: 'user', parts: [{ text: systemInstruction }] },
            ...messages.map(m => ({
              role: m.role === 'model' ? 'model' : 'user',
              parts: [{ text: m.text }]
            })),
            { role: 'user', parts: [{ text: userMessage }] }
          ],
          generationConfig: {
            maxOutputTokens: 500,
          }
        })
      });

      const data = await response.json();
      const aiText = data.candidates?.[0]?.content?.parts?.[0]?.text || "I'm having trouble connecting to my brain right now. Please try again.";

      setMessages(prev => [...prev, { role: 'model', text: aiText }]);
    } catch (error) {
      console.error("AI Assistant Error:", error);
      setMessages(prev => [...prev, { role: 'model', text: "I'm currently offline for a quick maintenance break. Please check our FAQ or try again in a few minutes!" }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-[100]">
      <AnimatePresence>
        {!isOpen && (
          <motion.div
            initial={{ scale: 0, rotate: -45 }}
            animate={{ scale: 1, rotate: 0 }}
            exit={{ scale: 0, rotate: 45 }}
            whileHover={{ scale: 1.1 }}
          >
            <Button
              onClick={() => setIsOpen(true)}
              className="w-16 h-16 rounded-full bg-purple-600 hover:bg-purple-700 shadow-2xl shadow-purple-200 flex flex-col items-center justify-center p-0 border-4 border-white"
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
            className="w-[90vw] md:w-[400px] h-[550px] bg-white rounded-[32px] shadow-[0_20px_50px_rgba(147,51,234,0.2)] border border-green-100 flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="p-6 bg-purple-600 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-white/20 p-2 rounded-xl backdrop-blur-sm">
                  <Bot className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-black uppercase tracking-tight italic text-sm">Vivo <span className="text-yellow-400">Assistant</span></h3>
                  <div className="flex items-center gap-1">
                    <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
                    <span className="text-[10px] font-bold uppercase tracking-widest opacity-80">AI Support Online</span>
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
            <ScrollArea className="flex-1 p-6" viewportRef={scrollRef}>
              <div className="space-y-6 pb-4">
                {messages.map((msg, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} gap-3`}
                  >
                    {msg.role === 'model' && (
                      <div className="bg-purple-50 p-2 rounded-lg h-fit flex-shrink-0">
                        <Bot className="h-4 w-4 text-purple-600" />
                      </div>
                    )}
                    <div className={`max-w-[85%] p-4 rounded-2xl text-sm font-medium leading-relaxed ${
                      msg.role === 'user' 
                        ? 'bg-purple-600 text-white rounded-tr-none'
                        : 'bg-gray-50 text-gray-800 rounded-tl-none border border-gray-100'
                    }`}>
                      {msg.text}
                    </div>
                  </motion.div>
                ))}
                {isLoading && (
                  <div className="flex justify-start gap-3">
                    <div className="bg-purple-50 p-2 rounded-lg h-fit">
                      <Bot className="h-4 w-4 text-purple-600" />
                    </div>
                    <div className="bg-gray-50 p-4 rounded-2xl rounded-tl-none border border-gray-100">
                      <Loader2 className="h-4 w-4 animate-spin text-purple-600" />
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
                  placeholder="Ask me anything..."
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  className="flex-1 rounded-xl border-gray-100 bg-white focus:border-purple-500 h-12 text-sm font-bold shadow-sm"
                />
                <Button 
                  type="submit" 
                  disabled={!input.trim() || isLoading}
                  className="bg-purple-600 hover:bg-purple-700 text-white rounded-xl h-12 w-12 p-0 shadow-lg shadow-purple-100 transition-all active:scale-95"
                >
                  <Send className="h-5 w-5" />
                </Button>
              </form>
              <p className="text-[9px] text-gray-400 text-center mt-3 font-black uppercase tracking-tighter">
                Vivo AI Intelligence • Powered by Gemini
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
