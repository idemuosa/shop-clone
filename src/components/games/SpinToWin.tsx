import React, { useState, useRef } from 'react';
import { motion, AnimatePresence, useAnimation } from 'motion/react';
import { 
  Trophy, 
  X, 
  Sparkles, 
  Gift, 
  Zap, 
  Star,
  ChevronDown,
  RefreshCcw,
  CheckCircle2,
  BadgeCheck
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { useAuth } from '@/lib/AuthContext';
import { db } from '@/lib/firebase';
import { doc, updateDoc, arrayUnion, serverTimestamp } from 'firebase/firestore';

const rewards = [
  { text: '5% OFF', color: '#9333ea', value: 'SAVE5' },
  { text: '10% OFF', color: '#18181b', value: 'SAVE10' },
  { text: 'FREE SHIPPING', color: '#9333ea', value: 'FREESHIP' },
  { text: 'NO LUCK', color: '#71717a', value: null },
  { text: '20% OFF', color: '#9333ea', value: 'SAVE20' },
  { text: 'SURPRISE', color: '#18181b', value: 'VIVI2026' },
  { text: '$5 CREDIT', color: '#9333ea', value: 'CASH5' },
  { text: 'TRY AGAIN', color: '#71717a', value: null },
];

export default function SpinToWin() {
  const { user, profile } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isSpinning, setIsSpinning] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const controls = useAnimation();
  const [rotation, setRotation] = useState(0);

  const spinWheel = async () => {
    if (isSpinning) return;

    if (!user) {
      toast.error("Please login to spin the wheel!");
      return;
    }

    // Check if user has already spun today
    const lastSpin = profile?.lastSpin?.toDate ? profile.lastSpin.toDate() : (profile?.lastSpin ? new Date(profile.lastSpin) : null);
    if (lastSpin && new Date().toDateString() === lastSpin.toDateString()) {
      toast.error("You've already used your free spin today!");
      return;
    }

    setIsSpinning(true);
    setResult(null);

    // Randomize a winning index
    const winningIndex = Math.floor(Math.random() * rewards.length);
    const sliceAngle = 360 / rewards.length;
    
    // Calculate new rotation: 5 full spins (1800 deg) + angle for the slice
    // Note: We need to point the slice to the top (indicator)
    const extraSpins = 5;
    const targetAngle = (360 - (winningIndex * sliceAngle)) + (360 * extraSpins);
    const finalRotation = rotation + targetAngle;

    await controls.start({
      rotate: finalRotation,
      transition: { duration: 4, ease: [0.1, 0, 0.1, 1] }
    });

    setRotation(finalRotation % 360);
    setIsSpinning(false);
    
    const reward = rewards[winningIndex];

    // Save to Firestore
    try {
      const userRef = doc(db, 'users', user.uid);
      const updateData: any = {
        lastSpin: serverTimestamp(),
      };

      if (reward.value) {
        setResult(reward.text);
        updateData.vouchers = arrayUnion({
          code: reward.value,
          offer: reward.text,
          type: 'Spin Win',
          date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString(), // 7 days from now
          addedAt: new Date().toISOString()
        });

        toast.success(`Congratulations! You won ${reward.text}!`, {
          description: `Code: ${reward.value} added to your profile.`,
          icon: <Trophy className="h-4 w-4 text-purple-600" />
        });
      } else {
        toast.error("Better luck next time!");
      }

      await updateDoc(userRef, updateData);
    } catch (e) {
      console.error("Spin error:", e);
    }
  };

  return (
    <>
      {/* Small floating pulse button for gamification */}
      <div className="fixed bottom-6 left-6 z-40">
        <motion.div
           animate={{ scale: [1, 1.1, 1] }}
           transition={{ repeat: Infinity, duration: 2 }}
        >
          <Button 
            onClick={() => setIsOpen(true)}
            className="w-14 h-14 rounded-full bg-black hover:bg-zinc-800 shadow-2xl border-4 border-white flex items-center justify-center p-0"
          >
            <Gift className="h-6 w-6 text-purple-600 animate-bounce" />
          </Button>
        </motion.div>
      </div>

      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.5, opacity: 0 }}
              className="bg-white rounded-[32px] max-w-xs w-full p-6 relative overflow-hidden text-center"
            >
              <Button 
                 variant="ghost" 
                 size="icon" 
                 onClick={() => setIsOpen(false)}
                 className="absolute top-4 right-4 rounded-full h-8 w-8"
              >
                <X className="h-5 w-5" />
              </Button>

              <div className="mb-4">
                <BadgeCheck className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                <h2 className="text-xl font-black uppercase tracking-tighter italic">Lucky <span className="text-purple-600">Spin</span></h2>
                <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mt-1">Win exclusive Vivi rewards</p>
              </div>

              {/* Wheel Container */}
              <div className="relative w-48 h-48 mx-auto mb-6 mt-2">
                <div className="absolute top-[-8px] left-1/2 -translate-x-1/2 z-10">
                   <ChevronDown className="h-8 w-8 text-purple-600 fill-purple-600 drop-shadow-lg" />
                </div>
                
                <motion.div
                  animate={controls}
                  className="w-full h-full rounded-full border-4 border-zinc-900 shadow-xl relative overflow-hidden"
                  style={{ rotate: rotation }}
                >
                  {rewards.map((reward, i) => (
                    <div
                      key={i}
                      className="absolute top-0 left-0 w-full h-full"
                      style={{
                        backgroundColor: reward.color,
                        transform: `rotate(${i * (360 / rewards.length)}deg)`,
                        clipPath: 'polygon(50% 50%, 50% 0%, 100% 0%, 100% 41.5%)',
                      }}
                    >
                      <span 
                        className="absolute top-6 left-[70%] -translate-x-1/2 text-[8px] font-black text-white uppercase tracking-tighter"
                        style={{ transform: 'rotate(22.5deg)' }}
                      >
                        {reward.text}
                      </span>
                    </div>
                  ))}
                  {/* Wheel Center */}
                  <div className="absolute inset-0 m-auto w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-lg border-2 border-zinc-900 z-10">
                    <Zap className="h-4 w-4 text-purple-600 fill-purple-600" />
                  </div>
                </motion.div>
              </div>

              <div className="space-y-3">
                {result ? (
                  <div className="bg-green-50 p-4 rounded-2xl border-2 border-dashed border-green-200">
                    <p className="text-[10px] font-black text-purple-600 uppercase tracking-widest mb-1">Your Reward:</p>
                    <h3 className="text-2xl font-black tracking-tighter italic">{result}</h3>
                    <div className="flex items-center justify-center gap-1 mt-2 text-green-600">
                      <CheckCircle2 className="h-3 w-3" />
                      <span className="text-[8px] font-black uppercase tracking-widest">Coupon added</span>
                    </div>
                  </div>
                ) : (
                  <Button 
                    onClick={spinWheel}
                    disabled={isSpinning}
                    className="w-full h-12 bg-purple-600 hover:bg-purple-700 text-white font-black text-base rounded-xl shadow-lg shadow-purple-100 transition-all active:scale-95"
                  >
                    {isSpinning ? (
                      <RefreshCcw className="h-5 w-5 animate-spin" />
                    ) : (
                      'SPIN NOW'
                    )}
                  </Button>
                )}
                
                <p className="text-[9px] font-bold text-gray-400">1 Free Spin Available Daily</p>
              </div>

              {/* Decorative elements */}
              <Sparkles className="absolute top-10 left-10 text-yellow-400 h-6 w-6 animate-pulse" />
              <Star className="absolute bottom-10 right-10 text-purple-200 h-8 w-8 animate-bounce" />
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
