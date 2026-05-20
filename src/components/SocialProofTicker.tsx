import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ShoppingBag, Users, Zap, Star } from 'lucide-react';
import { db } from '@/lib/firebase';
import { collection, query, orderBy, limit, onSnapshot } from 'firebase/firestore';

interface SocialProof {
  id: string;
  customerEmail: string;
  productName: string;
  time: string;
}

const names = ['Adebayo', 'Chinelo', 'Oluwatobi', 'Zainab', 'Chidi', 'Ify', 'Tunde', 'Kemi', 'Samuel', 'Sarah'];
const cities = ['Lagos', 'Abuja', 'Port Harcourt', 'Ibadan', 'Kano', 'Enugu', 'Benin City', 'Warri'];

export default function SocialProofTicker() {
  const [currentNotification, setCurrentNotification] = useState<SocialProof | null>(null);
  const [realOrders, setRealOrders] = useState<any[]>([]);

  useEffect(() => {
    const q = query(collection(db, 'orders'), orderBy('createdAt', 'desc'), limit(10));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (!snapshot.empty) {
        const orders = snapshot.docs.map(doc => ({
          id: doc.id,
          customerEmail: doc.data().customerEmail,
          productName: doc.data().productName,
          time: 'Just now'
        }));
        setRealOrders(orders);
      }
    }, (error) => {
      console.warn("SocialProofTicker subscription restricted:", error);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const showNotification = () => {
      if (currentNotification) return;

      let nextNotif: SocialProof | null = null;

      if (realOrders.length > 0 && Math.random() > 0.3) {
        const randomOrder = realOrders[Math.floor(Math.random() * realOrders.length)];
        const email = String(randomOrder.customerEmail || "");
        const maskedEmail = email.includes('@') ?
          email.split('@')[0].slice(0, 3) + '***' :
          names[Math.floor(Math.random() * names.length)];

        nextNotif = {
          ...randomOrder,
          customerEmail: maskedEmail
        };
      } else {
        const randomName = names[Math.floor(Math.random() * names.length)];
        const randomCity = cities[Math.floor(Math.random() * cities.length)];
        const products = ['Smart Watch Ultra', 'Wireless Earbuds', 'Gaming Mouse', 'Keyboard Pro', 'USB-C Hub'];
        const randomProduct = products[Math.floor(Math.random() * products.length)];

        nextNotif = {
          id: Math.random().toString(),
          customerEmail: randomName,
          productName: randomProduct,
          time: 'just now in ' + randomCity
        };
      }

      setCurrentNotification(nextNotif);
      setTimeout(() => setCurrentNotification(null), 6000);
    };

    const intervalId = setInterval(showNotification, 30000);
    return () => clearInterval(intervalId);
  }, [realOrders, currentNotification]);

  return (
    <div className="fixed bottom-24 left-6 z-40 hidden md:block">
      <AnimatePresence>
        {currentNotification && (
          <motion.div
            initial={{ opacity: 0, x: -100, scale: 0.8 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: -100, scale: 0.5 }}
            className="bg-white/80 backdrop-blur-xl border border-white shadow-[0_15px_40px_rgba(0,0,0,0.1)] p-4 rounded-[24px] flex items-center gap-4 max-w-[300px]"
          >
            <div className="w-12 h-12 bg-purple-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-purple-100 flex-shrink-0">
              <ShoppingBag className="h-6 w-6" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-black text-purple-600 uppercase tracking-widest mb-1 italic">Recent Purchase</p>
              <h4 className="text-xs font-black text-black leading-tight uppercase tracking-tighter truncate">
                {currentNotification.customerEmail} bought {currentNotification.productName}
              </h4>
              <div className="flex items-center gap-2 mt-1">
                <div className="flex -space-x-1">
                   {[1,2,3].map(i => <div key={i} className="w-3 h-3 rounded-full bg-purple-600 border border-white" />)}
                </div>
                <p className="text-[9px] font-bold text-gray-400 uppercase tracking-tighter">{currentNotification.time}</p>
              </div>
            </div>
            <motion.div 
               animate={{ scale: [1, 1.2, 1] }} 
               transition={{ repeat: Infinity, duration: 2 }}
               className="bg-green-50 p-1.5 rounded-lg"
            >
               <Zap className="h-3 w-3 text-purple-600 fill-purple-600" />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
