import { motion } from "motion/react";
import { Button } from "@/components/ui/button";
import { Zap, ArrowRight, Gift } from "lucide-react";
import { useState, useEffect } from "react";
import { useAuth } from "@/lib/AuthContext";
import { db } from "@/lib/firebase";
import { doc, updateDoc, arrayUnion } from "firebase/firestore";
import { toast } from "sonner";

export default function PromoBanner() {
  const { user } = useAuth();
  const [timeLeft, setTimeLeft] = useState({
    hours: 12,
    minutes: 45,
    seconds: 30
  });

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev.seconds > 0) return { ...prev, seconds: prev.seconds - 1 };
        if (prev.minutes > 0) return { ...prev, minutes: prev.minutes - 1, seconds: 59 };
        if (prev.hours > 0) return { ...prev, hours: prev.hours - 1, minutes: 59, seconds: 59 };
        return prev;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleGetCoupon = async () => {
    if (!user) {
      toast.info("Please login to claim your coupon!");
      return;
    }

    try {
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        vouchers: arrayUnion({
          code: 'FIRST20',
          offer: '20% OFF',
          type: 'First Order',
          date: 'Dec 31, 2024',
          addedAt: new Date().toISOString()
        })
      });
      toast.success("Coupon added to your profile!", {
        description: "Use code FIRST20 at checkout.",
        icon: <Gift className="h-4 w-4 text-orange-600" />
      });
    } catch (e) {
      console.error("Coupon error:", e);
      toast.error("Failed to add coupon. It might already be in your profile.");
    }
  };

  return (
    <section className="py-4 sm:py-6 bg-white">
      <div className="max-w-5xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="relative bg-orange-600 rounded-2xl sm:rounded-3xl overflow-hidden shadow-lg sm:shadow-xl shadow-orange-100">
          {/* Animated Background Pattern */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white via-transparent to-transparent"></div>
          </div>

          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between p-3.5 sm:p-5 md:p-8 gap-3 sm:gap-6">
            <div className="flex-1 text-center md:text-left">
              <div className="inline-flex items-center gap-1 bg-yellow-400 text-black px-2.5 py-0.5 rounded-full text-[9px] sm:text-[10px] font-black uppercase tracking-wider mb-2">
                <Zap className="h-2.5 w-2.5 fill-black" />
                Limited Offers Available
              </div>
              
              <h2 className="text-lg sm:text-2xl md:text-3xl font-black text-white leading-tight mb-2 uppercase italic tracking-tighter">
                DON'T WAIT! <span className="text-yellow-400">EXTRA 20% OFF</span> ON YOUR FIRST ORDER
              </h2>

              <div className="flex flex-wrap justify-center md:justify-start items-center gap-1.5 mb-3">
                <div className="flex flex-col items-center">
                  <div className="bg-white/20 backdrop-blur-md text-white w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl flex items-center justify-center text-xs sm:text-sm font-black border border-white/30">
                    {String(timeLeft.hours).padStart(2, '0')}
                  </div>
                  <span className="text-[8px] sm:text-[9px] font-black text-orange-100 mt-0.5 uppercase tracking-widest">Hours</span>
                </div>
                <div className="text-white text-sm sm:text-lg font-black self-center mb-2">:</div>
                <div className="flex flex-col items-center">
                  <div className="bg-white/20 backdrop-blur-md text-white w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl flex items-center justify-center text-xs sm:text-sm font-black border border-white/30">
                    {String(timeLeft.minutes).padStart(2, '0')}
                  </div>
                  <span className="text-[8px] sm:text-[9px] font-black text-orange-100 mt-0.5 uppercase tracking-widest">Mins</span>
                </div>
                <div className="text-white text-sm sm:text-lg font-black self-center mb-2">:</div>
                <div className="flex flex-col items-center">
                  <div className="bg-white/20 backdrop-blur-md text-white w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl flex items-center justify-center text-xs sm:text-sm font-black border border-white/30">
                    {String(timeLeft.seconds).padStart(2, '0')}
                  </div>
                  <span className="text-[8px] sm:text-[9px] font-black text-orange-100 mt-0.5 uppercase tracking-widest">Secs</span>
                </div>
              </div>

              <Button
                onClick={handleGetCoupon}
                className="bg-white text-orange-600 hover:bg-yellow-400 hover:text-black px-4 sm:px-6 h-9 sm:h-11 rounded-lg sm:rounded-xl text-xs sm:text-sm font-black shadow-md transition-all hover:scale-105 active:scale-95 uppercase tracking-tight"
              >
                Get My Coupon <ArrowRight className="ml-1 h-3.5 w-3.5 sm:h-4 sm:w-4" />
              </Button>
            </div>

            <div className="relative shrink-0 hidden sm:block">
              <motion.div 
                animate={{ y: [0, -6, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                className="relative z-10"
              >
                <img 
                  src="https://images.unsplash.com/photo-1523275335684-37898b6baf30?q=80&w=1000&auto=format&fit=crop" 
                  alt="Special Offer" 
                  className="w-36 md:w-52 h-28 md:h-44 object-cover rounded-xl sm:rounded-2xl shadow-lg rotate-2"
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?q=80&w=1000&auto=format&fit=crop';
                  }}
                />
                <div className="absolute -bottom-2 -left-2 bg-yellow-400 text-black px-2 py-1 rounded-lg font-black text-[10px] sm:text-xs shadow-md border-2 border-white -rotate-6">
                  -85% OFF
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
