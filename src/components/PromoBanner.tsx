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
    <section className="py-2 bg-white">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative bg-orange-600 rounded-xl sm:rounded-2xl overflow-hidden shadow-md shadow-orange-100">
          {/* Animated Background Pattern */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white via-transparent to-transparent"></div>
          </div>

          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between p-3 sm:p-4 md:p-5 gap-3 sm:gap-4">
            <div className="flex-1 text-center md:text-left">
              <div className="inline-flex items-center gap-1 bg-yellow-400 text-black px-2.5 py-0.5 rounded-md text-[10px] font-extrabold uppercase tracking-wider mb-1.5">
                <Zap className="h-3 w-3 fill-black" />
                Limited Offers Available
              </div>
              
              <h2 className="text-base sm:text-lg md:text-xl font-extrabold text-white leading-tight mb-2 uppercase italic tracking-tight">
                DON'T WAIT! <span className="text-yellow-400">EXTRA 20% OFF</span> <br className="hidden sm:inline" /> ON YOUR FIRST ORDER
              </h2>

              <div className="flex flex-wrap justify-center md:justify-start gap-1.5 sm:gap-2 mb-3">
                <div className="flex flex-col items-center">
                  <div className="bg-white/20 backdrop-blur-md text-white w-8 h-8 sm:w-9 sm:h-9 rounded-lg flex items-center justify-center text-xs sm:text-sm font-bold border border-white/30">
                    {String(timeLeft.hours).padStart(2, '0')}
                  </div>
                  <span className="text-[8px] sm:text-[9px] font-bold text-orange-100 mt-0.5 uppercase tracking-wider">Hours</span>
                </div>
                <div className="text-white text-sm sm:text-base font-bold self-center mb-2">:</div>
                <div className="flex flex-col items-center">
                  <div className="bg-white/20 backdrop-blur-md text-white w-8 h-8 sm:w-9 sm:h-9 rounded-lg flex items-center justify-center text-xs sm:text-sm font-bold border border-white/30">
                    {String(timeLeft.minutes).padStart(2, '0')}
                  </div>
                  <span className="text-[8px] sm:text-[9px] font-bold text-orange-100 mt-0.5 uppercase tracking-wider">Mins</span>
                </div>
                <div className="text-white text-sm sm:text-base font-bold self-center mb-2">:</div>
                <div className="flex flex-col items-center">
                  <div className="bg-white/20 backdrop-blur-md text-white w-8 h-8 sm:w-9 sm:h-9 rounded-lg flex items-center justify-center text-xs sm:text-sm font-bold border border-white/30">
                    {String(timeLeft.seconds).padStart(2, '0')}
                  </div>
                  <span className="text-[8px] sm:text-[9px] font-bold text-orange-100 mt-0.5 uppercase tracking-wider">Secs</span>
                </div>
              </div>

              <Button
                onClick={handleGetCoupon}
                className="bg-white text-orange-600 hover:bg-yellow-400 hover:text-black px-4 py-1.5 sm:px-5 sm:py-2 rounded-lg text-xs sm:text-sm font-bold shadow-md transition-all hover:scale-105 active:scale-95 uppercase tracking-tight h-auto"
              >
                Get My Coupon <ArrowRight className="ml-1 h-3.5 w-3.5 sm:h-4 sm:w-4" />
              </Button>
            </div>

            <div className="flex-1 relative flex justify-center w-full max-w-xs md:max-w-none">
              <motion.div 
                animate={{ y: [0, -5, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                className="relative z-10"
              >
                <img 
                  src="https://images.unsplash.com/photo-1523275335684-37898b6baf30?q=80&w=1000&auto=format&fit=crop" 
                  alt="Special Offer" 
                  className="w-full max-w-[110px] sm:max-w-[140px] md:max-w-[160px] mx-auto rounded-xl shadow-md rotate-3"
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?q=80&w=1000&auto=format&fit=crop';
                  }}
                />
                <div className="absolute -bottom-1.5 -left-1.5 sm:-bottom-2 sm:-left-2 bg-yellow-400 text-black px-2 py-0.5 rounded-lg font-black text-[10px] sm:text-xs shadow-sm border border-white -rotate-6">
                  -85% OFF
                </div>
              </motion.div>
              
              {/* Decorative circles */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[110%] h-[110%] border border-white/10 rounded-full -z-10"></div>
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[125%] h-[125%] border border-white/5 rounded-full -z-10"></div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
