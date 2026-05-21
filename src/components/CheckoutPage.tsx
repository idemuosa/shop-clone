import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  CreditCard,
  MapPin,
  Truck,
  ShieldCheck,
  ChevronLeft,
  CheckCircle2,
  Plus,
  User,
  Building,
  Home,
  ShoppingBag,
  Clock,
  ArrowRight,
  Package,
  ShieldAlert,
  Zap
} from 'lucide-react';
import { useCart } from '@/lib/CartContext';
import { useAuth } from '@/lib/AuthContext';
import { useCurrency } from '@/lib/CurrencyContext';
import { API_URL } from '@/lib/api';
import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp, query, onSnapshot } from 'firebase/firestore';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'motion/react';

interface CheckoutPageProps {
  onBack: () => void;
}

export default function CheckoutPage({ onBack }: CheckoutPageProps) {
  const { items, totalPrice, clearCart } = useCart();
  const { user, profile } = useAuth();
  const { formatPrice } = useCurrency();
  const [step, setStep] = useState<'address' | 'payment' | 'success'>('address');
  const [isProcessing, setIsProcessing] = useState(false);

  // Address State
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [zip, setZip] = useState('');

  // Payment State
  const [paymentType, setPaymentType] = useState<'card' | 'momo' | 'bank' | 'pod'>('card');
  const [selectedCard, setSelectedCard] = useState<any>(null);
  const [savedCards, setSavedCards] = useState<any[]>([]);
  const [storeSettings, setStoreSettings] = useState<any>(null);

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, 'users', user.uid, 'paymentMethods'));
    const unsubscribe = onSnapshot(q, (snap) => {
      setSavedCards(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    // Fetch store settings for bank/momo details
    const settingsQ = query(collection(db, 'settings'));
    const unsubscribeSettings = onSnapshot(settingsQ, (snap) => {
        if (!snap.empty) setStoreSettings(snap.docs[0].data());
    });

    return () => {
        unsubscribe();
        unsubscribeSettings();
    };
  }, [user]);

  const handlePlaceOrder = async () => {
    if (!user) {
        toast.error("Please login to place an order");
        return;
    }
    setIsProcessing(true);

    try {
      const orderData = {
        userId: user.uid,
        customerEmail: user.email,
        items: items.map(item => ({
           id: item.id,
           name: item.name,
           price: item.price,
           quantity: item.quantity
        })),
        totalAmount: totalPrice,
        shippingAddress: { address, city, zipCode: zip },
        status: 'pending',
        createdAt: serverTimestamp(),
      };

      const orderRef = await addDoc(collection(db, 'orders'), orderData);

      // Send confirmation via API (Optional/Simulated)
      try {
        await fetch(`${API_URL}/api/send-order-confirmation`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: user.email,
            orderId: orderRef.id,
            productName: items[0].name + (items.length > 1 ? ` and ${items.length - 1} more` : ''),
            totalAmount: totalPrice.toFixed(2),
            shippingAddress: { address, city, zipCode: zip },
            name: user.displayName || profile?.displayName
          }),
        });
      } catch (e) { console.error("Order confirmation email failed", e); }

      setStep('success');
      clearCart();
      toast.success("Order placed successfully!");
    } catch (error: any) {
      toast.error("Order failed: " + error.message);
    } finally {
      setIsProcessing(false);
    }
  };

  if (items.length === 0 && step !== 'success') {
      return (
          <div className="min-h-[80vh] flex flex-col items-center justify-center p-4">
              <div className="bg-white p-6 md:p-12 rounded-[32px] md:rounded-[40px] shadow-xl text-center max-w-md w-full border-2 border-gray-50">
                  <div className="w-16 h-16 md:w-24 md:h-24 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6 md:mb-8">
                      <ShoppingBag className="h-8 w-8 md:h-12 md:w-12 text-gray-200" />
                  </div>
                  <h2 className="text-xl md:text-3xl font-black tracking-tighter italic mb-3 md:mb-4">Your Cart is <span className="text-purple-600">Empty</span></h2>
                  <p className="text-gray-400 font-bold text-[10px] md:text-xs tracking-widest mb-6 md:mb-10 uppercase">Add some items to your cart before checking out.</p>
                  <Button onClick={onBack} className="w-full h-12 md:h-16 bg-purple-600 hover:bg-purple-700 text-white font-black rounded-2xl shadow-xl shadow-purple-100 text-xs md:text-base">
                      Back to shopping
                  </Button>
              </div>
          </div>
      );
  }

  return (
    <div className="min-h-screen bg-[#f8f9fa] py-4 md:py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        <AnimatePresence mode="wait">
          {step !== 'success' ? (
            <motion.div
              key="checkout-form"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8"
            >
              {/* Left Column: Checkout Steps */}
              <div className="lg:col-span-2 space-y-4 md:space-y-8">
                <div className="bg-white p-5 md:p-8 rounded-[32px] md:rounded-[40px] shadow-sm border border-gray-100">
                  <div className="flex items-center justify-between mb-6 md:mb-8">
                    <div className="flex items-center gap-2 md:gap-4">
                      <Button variant="ghost" size="icon" onClick={onBack} className="rounded-full hover:bg-gray-100 h-8 w-8 md:h-10 md:w-10">
                        <ChevronLeft className="h-5 w-5 md:h-6 md:w-6" />
                      </Button>
                      <div>
                        <h1 className="text-lg md:text-3xl font-black tracking-tighter leading-none">Checkout</h1>
                        <p className="text-[8px] md:text-[10px] font-bold text-gray-400 tracking-widest mt-1 uppercase">Secure Payment</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 md:gap-2">
                       <div className={`w-7 h-7 md:w-8 md:h-8 rounded-full flex items-center justify-center font-black text-[10px] md:text-xs ${step === 'address' ? 'bg-purple-600 text-white' : 'bg-green-100 text-green-700'}`}>
                          {step === 'address' ? '1' : <CheckCircle2 className="h-3 w-3 md:h-4 md:w-4" />}
                       </div>
                       <div className="w-4 md:w-8 h-1 bg-gray-100 rounded-full"></div>
                       <div className={`w-7 h-7 md:w-8 md:h-8 rounded-full flex items-center justify-center font-black text-[10px] md:text-xs ${step === 'payment' ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-400'}`}>
                          2
                       </div>
                    </div>
                  </div>

                  {step === 'address' ? (
                    <motion.div
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="space-y-6 md:space-y-8"
                    >
                      <div>
                        <h3 className="text-lg md:text-xl font-black tracking-tighter italic mb-4 md:mb-6 flex items-center gap-2">
                          <MapPin className="h-4 w-4 md:h-5 md:w-5 text-purple-600" /> Shipping <span className="text-purple-600">Details</span>
                        </h3>

                        <div className="space-y-3 md:space-y-4">
                          <div className="space-y-1.5 md:space-y-2">
                            <Label className="text-[9px] md:text-[10px] font-black text-gray-400 ml-1 uppercase">Street Address</Label>
                            <div className="relative">
                              <Input
                                placeholder="House number and street name"
                                value={address}
                                onChange={(e) => setAddress(e.target.value)}
                                className="pl-10 md:pl-12 h-12 md:h-16 rounded-xl md:rounded-2xl border-2 border-gray-50 focus:border-purple-500 font-bold transition-all bg-gray-50/50 text-xs md:text-base"
                              />
                              <Home className="absolute left-3.5 md:left-4 top-1/2 -translate-y-1/2 h-4 w-4 md:h-5 md:w-5 text-gray-300" />
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-3 md:gap-4">
                            <div className="space-y-1.5 md:space-y-2">
                              <Label className="text-[9px] md:text-[10px] font-black text-gray-400 ml-1 uppercase">City</Label>
                              <div className="relative">
                                <Input
                                  placeholder="City"
                                  value={city}
                                  onChange={(e) => setCity(e.target.value)}
                                  className="pl-10 md:pl-12 h-12 md:h-16 rounded-xl md:rounded-2xl border-2 border-gray-50 focus:border-purple-500 font-bold transition-all bg-gray-50/50 text-xs md:text-base"
                                />
                                <Building className="absolute left-3.5 md:left-4 top-1/2 -translate-y-1/2 h-4 w-4 md:h-5 md:w-5 text-gray-300" />
                              </div>
                            </div>
                            <div className="space-y-1.5 md:space-y-2">
                              <Label className="text-[9px] md:text-[10px] font-black text-gray-400 ml-1 uppercase">Zip Code</Label>
                              <Input
                                placeholder="100001"
                                value={zip}
                                onChange={(e) => setZip(e.target.value)}
                                className="h-12 md:h-16 rounded-xl md:rounded-2xl border-2 border-gray-50 focus:border-purple-500 font-bold transition-all bg-gray-50/50 text-xs md:text-base"
                              />
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="bg-green-50 p-4 md:p-6 rounded-2xl md:rounded-[32px] border-2 border-green-100 flex items-start gap-3 md:gap-4">
                        <div className="bg-white p-2 md:p-3 rounded-xl md:rounded-2xl shadow-sm shrink-0">
                           <Truck className="h-5 w-5 md:h-6 md:w-6 text-purple-600" />
                        </div>
                        <div>
                          <h4 className="font-black italic tracking-tighter text-green-900 text-sm md:text-base leading-none mb-1">Vivo Express Delivery</h4>
                          <p className="text-[9px] md:xs text-green-700 font-bold leading-relaxed">
                            Eligible for FREE same-day delivery!
                          </p>
                        </div>
                      </div>

                      <Button
                        onClick={() => {
                          if (!address || !city || !zip) {
                            toast.error("Please fill in your shipping details");
                            return;
                          }
                          setStep('payment');
                          window.scrollTo({ top: 0, behavior: 'smooth' });
                        }}
                        className="w-full h-14 md:h-20 bg-purple-600 hover:bg-purple-700 text-white font-black text-base md:text-xl rounded-2xl shadow-xl shadow-purple-100 transition-all active:scale-95 group"
                      >
                        Continue to payment
                        <ArrowRight className="ml-2 h-5 w-5 md:h-6 md:w-6 group-hover:translate-x-1 transition-transform" />
                      </Button>
                    </motion.div>
                  ) : (
                    <motion.div
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="space-y-8"
                    >
                      <div>
                        <h3 className="text-xl font-black  tracking-tighter italic mb-6 flex items-center gap-2">
                          <CreditCard className="h-5 w-5 text-purple-600" /> Payment <span className="text-purple-600">Method</span>
                        </h3>

                        <div className="flex bg-gray-100 rounded-2xl p-1.5 mb-8">
                          {(['card', 'momo', 'bank', 'pod'] as const).map((type) => (
                            <Button
                              key={type}
                              variant="ghost"
                              onClick={() => {
                                setPaymentType(type);
                                setSelectedCard(null);
                              }}
                              className={`flex-1 rounded-xl font-black text-[10px]  tracking-widest h-12 transition-all ${
                                paymentType === type ? 'bg-white text-purple-600 shadow-md' : 'text-gray-400 hover:text-gray-600'
                              }`}
                            >
                              {type === 'card' ? 'Card' : type === 'momo' ? 'MoMo' : type === 'bank' ? 'Bank' : 'Cash'}
                            </Button>
                          ))}
                        </div>

                        {paymentType === 'card' ? (
                          <div className="space-y-4">
                            {savedCards.length > 0 ? (
                               <RadioGroup value={selectedCard?.id} onValueChange={(v) => setSelectedCard(savedCards.find(c => c.id === v))} className="gap-4">
                                  {savedCards.map(card => (
                                    <div key={card.id} className={`flex items-center p-6 rounded-3xl border-2 cursor-pointer transition-all ${selectedCard?.id === card.id ? 'border-purple-500 bg-purple-50/30' : 'border-gray-50 bg-white hover:border-gray-200'}`} onClick={() => setSelectedCard(card)}>
                                       <div className={`p-3 rounded-2xl mr-4 ${card.brand === 'Visa' ? 'bg-blue-50 text-blue-600' : 'bg-red-50 text-red-600'}`}>
                                          <CreditCard className="h-6 w-6" />
                                       </div>
                                       <div className="flex-1">
                                          <p className="font-black text-sm  tracking-tight">{card.brand} ending in {card.last4}</p>
                                          <p className="text-[10px] text-gray-400  font-bold">Expires {card.expiry}</p>
                                       </div>
                                       {selectedCard?.id === card.id && (
                                           <div className="bg-purple-600 rounded-full p-1">
                                               <CheckCircle2 className="h-4 w-4 text-white" />
                                           </div>
                                       )}
                                    </div>
                                  ))}
                                  <div className="p-6 rounded-3xl border-2 border-dashed border-gray-200 flex items-center justify-center gap-2 text-gray-400 hover:text-purple-600 hover:border-purple-200 transition-all cursor-pointer group">
                                      <Plus className="h-5 w-5 group-hover:scale-110 transition-transform" />
                                      <span className="text-xs font-black  tracking-widest">Add New Card</span>
                                  </div>
                               </RadioGroup>
                            ) : (
                              <div className="text-center py-16 bg-white rounded-[40px] border-2 border-dashed border-gray-100">
                                 <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <CreditCard className="h-8 w-8 text-gray-200" />
                                 </div>
                                 <p className="text-xs font-black text-gray-400  tracking-widest max-w-[200px] mx-auto">No saved cards found. Please use another method or add a card in profile.</p>
                              </div>
                            )}
                          </div>
                        ) : paymentType === 'pod' ? (
                           <div className="bg-white p-10 rounded-[40px] border-2 border-gray-100 text-center space-y-6 shadow-sm">
                              <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto">
                                 <ShoppingBag className="h-10 w-10 text-green-600" />
                              </div>
                              <div>
                                <h4 className="text-2xl font-black  italic tracking-tighter">Pay on <span className="text-purple-600">Delivery</span></h4>
                                <p className="text-sm text-gray-500 font-medium leading-relaxed max-w-sm mx-auto mt-2">
                                  Our rider will bring a POS terminal for card payments or accept cash when your order arrives.
                                </p>
                              </div>
                              <div className="flex items-center justify-center gap-2 text-[10px] font-black text-purple-600  tracking-widest bg-purple-50 py-2 rounded-full px-6 w-fit mx-auto">
                                 <ShieldCheck className="h-3 w-3" /> Safe & Secure
                              </div>
                           </div>
                        ) : paymentType === 'bank' ? (
                            <div className="bg-white p-5 md:p-10 rounded-[32px] md:rounded-[40px] border-2 border-purple-100 shadow-xl relative overflow-hidden group">
                               <div className="relative z-10">
                                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 md:mb-8">
                                     <div className="flex items-center gap-3">
                                        <div className="bg-purple-600 p-2 rounded-xl text-white shadow-lg shadow-purple-200">
                                           <Building className="h-5 w-5" />
                                        </div>
                                        <h4 className="text-lg md:text-2xl font-black italic tracking-tighter text-black uppercase leading-none">Bank <span className="text-purple-600">Transfer</span></h4>
                                     </div>
                                     <div className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest w-fit">Manual Verification</div>
                                  </div>

                                  <div className="space-y-4 md:space-y-6">
                                    <div className="p-5 md:p-8 bg-gray-50/50 rounded-2xl md:rounded-3xl border border-gray-100 backdrop-blur-sm group-hover:bg-white transition-colors duration-500">
                                       <div className="flex justify-between items-center pb-4 border-b border-gray-100 mb-4">
                                          <span className="text-[10px] font-black text-gray-400 tracking-widest uppercase">Beneficiary</span>
                                          <span className="text-xs md:text-sm font-black text-black truncate ml-2">VIVO PREMIUM STORE</span>
                                       </div>

                                       <div className="space-y-4 md:space-y-6">
                                          <div className="flex flex-col gap-1">
                                             <span className="text-[8px] font-black text-purple-400 tracking-widest uppercase">Bank Network</span>
                                             <span className="text-base md:text-lg font-black text-black tracking-tight">{storeSettings?.bankName || 'WEMA BANK / ALAT'}</span>
                                          </div>

                                          <div className="flex flex-col gap-1">
                                             <span className="text-[8px] font-black text-purple-400 tracking-widest uppercase">Account Number</span>
                                             <div className="flex items-center justify-between gap-2">
                                                <span className="text-2xl md:text-4xl font-black tracking-[0.1em] md:tracking-[0.2em] text-purple-600 break-all">{storeSettings?.bankAccountNumber || '0123456789'}</span>
                                                <Button
                                                   variant="ghost"
                                                   size="icon"
                                                   className="rounded-full h-8 w-8 md:h-10 md:w-10 hover:bg-purple-100 hover:text-purple-600 shrink-0"
                                                   onClick={() => {
                                                      navigator.clipboard.writeText(storeSettings?.bankAccountNumber || '0123456789');
                                                      toast.success("Account number copied!");
                                                   }}
                                                >
                                                   <Plus className="h-4 w-4 md:h-5 md:w-5" />
                                                </Button>
                                             </div>
                                          </div>
                                       </div>
                                    </div>

                                    <div className="bg-purple-600 p-4 rounded-xl md:rounded-2xl flex items-center gap-3 shadow-lg shadow-purple-100">
                                       <Zap className="h-4 w-4 md:h-5 md:w-5 text-yellow-400 fill-yellow-400 animate-pulse shrink-0" />
                                       <p className="text-[8px] md:text-[9px] text-white font-black uppercase tracking-widest leading-tight">
                                          Transfer exactly <span className="text-yellow-400">{formatPrice(totalPrice)}</span> then click "Place Order" below.
                                       </p>
                                    </div>
                                  </div>
                               </div>

                               <Building className="absolute right-[-20px] bottom-[-20px] h-32 w-32 md:h-48 md:w-40 text-purple-600/5 rotate-12" />
                            </div>
                        ) : paymentType === 'momo' ? (
                            <div className="bg-green-600 p-8 rounded-[40px] text-white space-y-6 shadow-xl">
                               <div className="flex items-center justify-between">
                                  <h4 className="text-xl font-black  italic tracking-tighter text-green-50">Mobile <span className="text-black">Money</span></h4>
                                  <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                                     <Plus className="h-5 w-5" />
                                  </div>
                               </div>
                               <div className="bg-green-700/50 p-6 rounded-3xl border border-green-500/30">
                                  <p className="text-[10px]  font-black text-green-300 tracking-widest mb-1">Phone Number</p>
                                  <p className="text-3xl font-black tracking-tighter">{storeSettings?.momoNumber || '+234 800 000 0000'}</p>
                               </div>
                               <p className="text-[9px] text-green-200 font-black  text-center tracking-widest">Pay via MTN/Airtel MoMo</p>
                            </div>
                        ) : (
                          <div className="p-16 text-center bg-white rounded-[40px] border-2 border-gray-100">
                             <ShieldAlert className="h-12 w-12 text-gray-200 mx-auto mb-4" />
                             <p className="text-xs font-black text-gray-400  tracking-widest">This payment method is temporarily unavailable.</p>
                          </div>
                        )}
                      </div>

                      <div className="flex gap-4">
                        <Button
                            variant="outline"
                            onClick={() => setStep('address')}
                            className="h-18 px-8 rounded-2xl border-2 font-black  tracking-widest text-xs"
                        >
                            Back
                        </Button>
                        <Button
                          onClick={handlePlaceOrder}
                          disabled={isProcessing || (paymentType === 'card' && !selectedCard && savedCards.length > 0)}
                          className="flex-1 h-12 bg-black hover:bg-zinc-800 text-white font-black text-xl rounded-1xl shadow-xl transition-all active:scale-56 py-3"
                        >
                          {isProcessing ? 'Processing...' : `Place order • ${formatPrice(totalPrice)}`}
                        </Button>
                      </div>
                    </motion.div>
                  )}
                </div>

                {/* Secure Badge */}
                <div className="flex items-center justify-center gap-6 p-8 bg-gray-100/50 rounded-[32px] border border-gray-100">
                   <div className="flex items-center gap-2">
                      <ShieldCheck className="h-5 w-5 text-green-600" />
                      <span className="text-[10px] font-black  tracking-widest text-gray-500">SSL Encrypted</span>
                   </div>
                   <div className="w-px h-4 bg-gray-200"></div>
                   <div className="flex items-center gap-2">
                      <Package className="h-5 w-5 text-purple-600" />
                      <span className="text-[10px] font-black  tracking-widest text-gray-500">Vivo Guarantee</span>
                   </div>
                   <div className="w-px h-4 bg-gray-200"></div>
                   <div className="flex items-center gap-2">
                      <Clock className="h-5 w-5 text-orange-500" />
                      <span className="text-[10px] font-black  tracking-widest text-gray-500">24/7 Support</span>
                   </div>
                </div>
              </div>

              {/* Right Column: Order Summary */}
              <div className="space-y-8">
                <div className="bg-white p-8 rounded-[40px] shadow-sm border border-gray-100 sticky top-24">
                  <h3 className="text-xl font-black  tracking-tighter italic mb-8 border-b border-gray-50 pb-4">Order <span className="text-purple-600">Summary</span></h3>

                  <ScrollArea className="max-h-[300px] mb-8 pr-4">
                    <div className="space-y-6">
                      {items.map(item => (
                        <div key={item.id} className="flex gap-4 group">
                          <div className="w-16 h-16 rounded-2xl overflow-hidden bg-gray-50 flex-shrink-0 border border-gray-50">
                            <img src={item.image} alt={item.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-black  truncate group-hover:text-purple-600 transition-colors">{item.name}</p>
                            <div className="flex items-center justify-between mt-1">
                               <p className="text-[10px] font-bold text-gray-400 ">Qty: {item.quantity}</p>
                               <p className="text-sm font-black text-purple-600">{formatPrice(item.priceValue * item.quantity)}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>

                  <div className="space-y-4 pt-6 border-t border-dashed border-gray-100">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-black  text-gray-400 tracking-widest">Subtotal</span>
                      <span className="text-sm font-bold">{formatPrice(totalPrice)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-black  text-gray-400 tracking-widest">Shipping</span>
                      <span className="text-xs font-black text-green-600  tracking-tighter">FREE</span>
                    </div>
                    <div className="flex justify-between items-center pt-4 border-t border-gray-50">
                      <span className="text-base font-black  tracking-tighter">Total Amount</span>
                      <span className="text-2xl font-black text-purple-600 tracking-tighter">{formatPrice(totalPrice)}</span>
                    </div>
                  </div>

                  <div className="mt-8 p-4 bg-purple-50 rounded-2xl border border-purple-100 text-center">
                     <p className="text-[10px] font-black text-purple-600  tracking-widest">Points Earned: {Math.floor(totalPrice)}</p>
                  </div>
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="checkout-success"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="max-w-xl mx-auto py-6 md:py-12"
            >
              <div className="bg-white p-6 md:p-12 rounded-[32px] md:rounded-[50px] shadow-2xl text-center space-y-6 md:space-y-8 border-4 border-green-50 relative overflow-hidden">
                 <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-purple-600 via-green-500 to-yellow-400"></div>

                 <div className="w-20 h-20 md:w-32 md:h-32 bg-green-100 rounded-full flex items-center justify-center mx-auto relative group">
                    <CheckCircle2 className="h-10 w-10 md:h-16 md:w-16 text-green-600 group-hover:scale-110 transition-transform" />
                    <div className="absolute inset-0 rounded-full border-4 border-green-100 animate-ping opacity-25"></div>
                 </div>

                 <div className="space-y-2 md:space-y-3">
                    <h2 className="text-3xl md:text-5xl font-black tracking-tighter italic leading-none">Order <br /><span className="text-purple-600">Successful!</span></h2>
                    <p className="text-gray-400 font-bold text-[8px] md:text-[10px] tracking-widest leading-relaxed pt-1 md:pt-2">
                      Your premium Vivo order has been placed. <br className="hidden md:block" /> Check your email for confirmation.
                    </p>
                 </div>

                 <div className="grid grid-cols-2 gap-3 md:gap-4">
                    <div className="bg-gray-50 p-4 md:p-6 rounded-2xl md:rounded-[32px] border border-gray-100">
                       <p className="text-[8px] md:text-[10px] font-black text-gray-400 mb-1 uppercase tracking-widest">Order Ref</p>
                       <p className="text-[10px] md:text-sm font-black">#VIVO-{Math.random().toString(36).slice(-6).toUpperCase()}</p>
                    </div>
                    <div className="bg-gray-50 p-4 md:p-6 rounded-2xl md:rounded-[32px] border border-gray-100">
                       <p className="text-[8px] md:text-[10px] font-black text-gray-400 mb-1 uppercase tracking-widest">Arrival Date</p>
                       <p className="text-[10px] md:text-sm font-black text-green-600 ">Tomorrow, 4PM</p>
                    </div>
                 </div>

                 <div className="space-y-3 md:space-y-4">
                    <Button onClick={onBack} className="w-full h-14 md:h-18 bg-black hover:bg-zinc-800 text-white font-black text-base md:text-lg rounded-2xl shadow-xl">
                        Track my order
                    </Button>
                    <Button variant="ghost" onClick={onBack} className="w-full h-10 md:h-12 font-black tracking-widest text-[8px] md:text-[10px] text-gray-400 hover:text-purple-600">
                        Continue shopping
                    </Button>
                 </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
