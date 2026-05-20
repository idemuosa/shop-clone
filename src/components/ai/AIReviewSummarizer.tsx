import React, { useState } from 'react';
import { GoogleGenAI } from "@google/genai";
import { Sparkles, Loader2, MessageSquareText, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { motion } from 'motion/react';

interface Review {
  userName: string;
  rating: number;
  comment: string;
}

interface ReviewSummaryProps {
  reviews: Review[];
  productName: string;
}

export default function AIReviewSummarizer({ reviews, productName }: ReviewSummaryProps) {
  const [summary, setSummary] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Model initialization
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  const model = "gemini-3-flash-preview";

  const generateSummary = async () => {
    if (reviews.length === 0) return;
    setIsLoading(true);
    setSummary(null);

    try {
      const reviewText = reviews.slice(0, 10).map(r => `[${r.rating} Stars] ${r.userName}: ${r.comment}`).join('\n');
      
      const prompt = `
        You are an expert e-commerce analyst. Analyze these customer reviews for "${productName}" and provide a punchy, 3-bullet point summary for a potential buyer:
        - Overall Vibe (Is it worth it?)
        - Best Thing (What stood out?)
        - Heads Up (Any warnings or minor issues?)
        
        Keep it professional yet engaging, like a high-end tech review site.
        Use bullet points (-) only.
        
        Reviews to analyze:
        ${reviewText}
      `;

      const response = await ai.models.generateContent({
        model,
        contents: prompt,
        config: {
          temperature: 0.7,
          topP: 0.9,
          systemInstruction: "You are a concise AI assistant that summarizes product reviews for a high-traffic e-commerce marketplace. Be honest, objective, and extremely concise."
        }
      });

      setSummary(response.text || "AI is taking a break. Check back in a moment!");
    } catch (error) {
      console.error("Summary Error:", error);
      setSummary("Failed to link with AI brain. Please try again!");
    } finally {
      setIsLoading(false);
    }
  };

  if (reviews.length === 0) return null;

  return (
    <Card className="p-6 bg-green-50/50 border-green-100 rounded-[32px] overflow-hidden relative group">
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 relative z-10">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-purple-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-purple-100">
             <MessageSquareText className="h-6 w-6" />
          </div>
          <div>
            <h3 className="font-black uppercase tracking-tighter italic text-lg leading-tight">AI Review <span className="text-purple-600">Summarizer</span></h3>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest italic">Get the consensus in 3 seconds</p>
          </div>
        </div>

        {!summary ? (
          <Button 
            onClick={generateSummary}
            disabled={isLoading}
            className="bg-black hover:bg-zinc-800 text-white font-black rounded-xl h-12 px-8 flex items-center gap-2 group-hover:scale-105 transition-transform"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <Sparkles className="h-4 w-4 text-orange-400" />
                SUMMARIZE REVIEWS
              </>
            )}
          </Button>
        ) : (
          <Button 
            variant="ghost" 
            onClick={() => setSummary(null)}
            className="text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-purple-600"
          >
            RESET
          </Button>
        )}
      </div>

      {summary && (
        <motion.div 
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="mt-6 pt-6 border-t border-green-100"
        >
          <div className="prose prose-sm font-sans font-bold text-zinc-700 whitespace-pre-line leading-relaxed">
            {summary}
          </div>
          <div className="flex items-center gap-2 mt-4 text-[9px] font-black text-gray-400 uppercase tracking-widest italic">
            <ShieldCheck className="h-3 w-3" /> Vertically integrated AI consensus
          </div>
        </motion.div>
      )}

      {/* Background decoration */}
      <Sparkles className="absolute top-[-20px] right-[-20px] h-40 w-40 text-purple-600/5 rotate-12 pointer-events-none" />
    </Card>
  );
}
