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

const rewards = [
  { text: '5% OFF', color: '#ea580c', value: 'SAVE5' },
  { text: '10% OFF', color: '#18181b', value: 'SAVE10' },
  { text: 'FREE SHIPPING', color: '#ea580c', value: 'FREESHIP' },
  { text: 'NO LUCK', color: '#71717a', value: null },
  { text: '20% OFF', color: '#ea580c', value: 'SAVE20' },
  { text: 'SURPRISE', color: '#18181b', value: 'TEMU2026' },
  { text: '$5 CREDIT', color: '#ea580c', value: 'CASH5' },
  { text: 'TRY AGAIN', color: '#71717a', value: null },
];

export default function SpinToWin() {
  const [isOpen, setIsOpen] = useState(false);
  const [isSpinning, setIsSpinning] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const controls = useAnimation();
  const [rotation, setRotation] = useState(0);

  const spinWheel = async () => {
    if (isSpinning) return;
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
    if (reward.value) {
      setResult(reward.text);
      toast.success(`Congratulations! You won ${reward.text}!`, {
        description: `Use code: ${reward.value}`,
        icon: <Trophy className="h-4 w-4 text-orange-600" />
      });
    } else {
      toast.error("Better luck next time!");
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
            <Gift className="h-6 w-6 text-orange-600 animate-bounce" />
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
              className="bg-white rounded-[40px] max-w-md w-full p-8 relative overflow-hidden text-center"
            >
              <Button 
                 variant="ghost" 
                 size="icon" 
                 onClick={() => setIsOpen(false)}
                 className="absolute top-6 right-6 rounded-full"
              >
                <X className="h-6 w-6" />
              </Button>

              <div className="mb-8">
                <BadgeCheck className="h-12 w-12 text-orange-600 mx-auto mb-4" />
                <h2 className="text-3xl font-black uppercase tracking-tighter italic italic">Lucky <span className="text-orange-600">Spin</span> Wheel</h2>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-2">Test your luck and win exclusive Temu rewards</p>
              </div>

              {/* Wheel Container */}
              <div className="relative w-72 h-72 mx-auto mb-10 mt-4">
                <div className="absolute top-[-10px] left-1/2 -translate-x-1/2 z-10">
                   <ChevronDown className="h-10 w-10 text-orange-600 fill-orange-600 drop-shadow-lg" />
                </div>
                
                <motion.div
                  animate={controls}
                  className="w-full h-full rounded-full border-8 border-zinc-900 shadow-2xl relative overflow-hidden"
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
                        className="absolute top-10 left-[70%] -translate-x-1/2 text-[10px] font-black text-white uppercase tracking-tighter"
                        style={{ transform: 'rotate(22.5deg)' }}
                      >
                        {reward.text}
                      </span>
                    </div>
                  ))}
                  {/* Wheel Center */}
                  <div className="absolute inset-0 m-auto w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-lg border-4 border-zinc-900 z-10">
                    <Zap className="h-6 w-6 text-orange-600 fill-orange-600" />
                  </div>
                </motion.div>
              </div>

              <div className="space-y-4">
                {result ? (
                  <div className="bg-orange-50 p-6 rounded-3xl border-2 border-dashed border-orange-200">
                    <p className="text-xs font-black text-orange-600 uppercase tracking-widest mb-2">Your Reward:</p>
                    <h3 className="text-4xl font-black tracking-tighter italic">{result}</h3>
                    <div className="flex items-center justify-center gap-2 mt-4 text-green-600">
                      <CheckCircle2 className="h-4 w-4" />
                      <span className="text-[10px] font-black uppercase tracking-widest">Added to your active coupons</span>
                    </div>
                  </div>
                ) : (
                  <Button 
                    onClick={spinWheel}
                    disabled={isSpinning}
                    className="w-full h-16 bg-orange-600 hover:bg-orange-700 text-white font-black text-xl rounded-2xl shadow-xl shadow-orange-100 transition-all active:scale-95"
                  >
                    {isSpinning ? (
                      <RefreshCcw className="h-6 w-6 animate-spin" />
                    ) : (
                      'SPIN NOW for FREE'
                    )}
                  </Button>
                )}
                
                <p className="text-[10px] font-bold text-gray-400">1 Free Spin Available Daily</p>
              </div>

              {/* Decorative elements */}
              <Sparkles className="absolute top-10 left-10 text-yellow-400 h-6 w-6 animate-pulse" />
              <Star className="absolute bottom-10 right-10 text-orange-200 h-8 w-8 animate-bounce" />
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
