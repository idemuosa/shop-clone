import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { RadioGroup } from '@/components/ui/radio-group';
import {
  CreditCard,
  MapPin,
  Truck,
  ShieldCheck,
  ChevronLeft,
  CheckCircle2,
  Plus,
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

  // Discount/Voucher State
  const [discount, setDiscount] = useState(0);
  const [selectedVoucher, setSelectedVoucher] = useState<any>(null);

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

  const [createdOrderDetails, setCreatedOrderDetails] = useState<{ orderId: string; name: string; phone: string } | null>(null);

  const processOrderPlacement = async (paymentRef: string) => {
    setIsProcessing(true);
    try {
      const finalTotal = totalPrice - discount;
      const orderId = paymentRef || `VIVI-${Math.random().toString(36).slice(-6).toUpperCase()}`;
      const customerName = profile?.displayName || (profile as any)?.display_name || user?.displayName || user?.email?.split('@')[0] || 'Customer';
      const customerPhone = (profile as any)?.phone || user?.phoneNumber || '07045108847 or 09053091235';

      setCreatedOrderDetails({ orderId, name: customerName, phone: customerPhone });

      // Save order to Firestore if user exists
      if (user) {
        try {
          await addDoc(collection(db, 'orders'), {
            userId: user.uid,
            orderId: orderId,
            orderNumber: orderId,
            customerName: customerName,
            customerEmail: user.email,
            name: customerName,
            phone: customerPhone,
            phoneNumber: customerPhone,
            items: items.map(item => ({
              id: item.id,
              name: item.name,
              quantity: item.quantity,
              price: item.price,
              priceValue: item.priceValue,
              image: item.image,
              orderNumber: item.orderNumber || orderId
            })),
            totalAmount: finalTotal,
            shippingAddress: { address, city, zip },
            paymentMethod: paymentType,
            status: paymentType === 'card' ? 'paid' : 'pending',
            createdAt: serverTimestamp()
          });

          // Save notification for customer in Firestore
          await addDoc(collection(db, 'notifications'), {
            type: 'order_notification',
            userId: user.uid,
            orderId: orderId,
            orderNumber: orderId,
            email: user.email,
            name: customerName,
            phone: customerPhone,
            amount: finalTotal,
            paymentMethod: paymentType,
            message: `Order #${orderId} placed successfully! Total: ₦${finalTotal.toFixed(2)} (${paymentType.toUpperCase()})`,
            createdAt: serverTimestamp()
          });
        } catch (dbErr) {
          console.error("Firestore order save error:", dbErr);
        }
      }

      // Send order confirmation email and notify backend
      const payload = {
        userId: user?.uid,
        email: user?.email,
        phone: customerPhone,
        name: customerName,
        orderId: orderId,
        orderNumber: orderId,
        items: items.map(item => ({
          name: item.name,
          quantity: item.quantity,
          price: item.price,
          priceValue: item.priceValue,
          image: item.image
        })),
        totalAmount: finalTotal,
        shippingAddress: { address, city, zip },
        paymentMethod: paymentType
      };

      await fetch(`${API_URL}/api/send-order-confirmation`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      }).catch(err => console.error("Order email error:", err));

      setStep('success');
      clearCart();
      toast.success(`Order #${orderId} confirmed!`);
    } catch (error: any) {
      toast.error("Error processing order: " + (error.message || "Unknown error"));
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePlaceOrder = async () => {
    if (!user) {
        toast.error("Please login to place an order");
        return;
    }
    if (!address || !city) {
        toast.error("Please enter a valid shipping address");
        setStep('address');
        return;
    }

    if (paymentType === 'card') {
      if ((window as any).PaystackPop) {
        const handler = (window as any).PaystackPop.setup({
          key: import.meta.env.VITE_PAYSTACK_PUBLIC_KEY || 'pk_test_your_key_here',
          email: user.email,
          amount: Math.round((totalPrice - discount) * 100), // in kobo
          currency: 'NGN',
          callback: async function(response: any) {
            toast.success("Payment successful!");
            await processOrderPlacement(response.reference);
          },
          onClose: function() {
            toast.error("Payment cancelled");
          }
        });
        handler.openIframe();
      } else {
        await processOrderPlacement(`CARD-${Math.random().toString(36).slice(-6).toUpperCase()}`);
      }
    } else {
      const refPrefix = paymentType === 'bank' ? 'BANK' : paymentType === 'momo' ? 'MOMO' : 'POD';
      const ref = `${refPrefix}-${Math.random().toString(36).slice(-6).toUpperCase()}`;
      await processOrderPlacement(ref);
    }
  };

  if (items.length === 0 && step !== 'success') {
      return (
          <div className="min-h-[40vh] flex flex-col items-center justify-center p-4 py-8">
              <div className="bg-white p-5 md:p-8 rounded-2xl md:rounded-3xl shadow-lg text-center max-w-md w-full border border-gray-100">
                  <div className="w-12 h-12 md:w-16 md:h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 md:mb-5">
                      <ShoppingBag className="h-6 w-6 md:h-8 md:w-8 text-gray-300" />
                  </div>
                  <h2 className="text-lg md:text-2xl font-black tracking-tighter italic mb-2 md:mb-3">Your Cart is <span className="text-orange-600">Empty</span></h2>
                  <p className="text-gray-400 font-bold text-[10px] md:text-xs tracking-widest mb-4 md:mb-6 uppercase">Add some items to your cart before checking out.</p>
                  <Button onClick={onBack} className="w-full h-10 md:h-12 bg-orange-600 hover:bg-orange-700 text-white font-black rounded-xl shadow-md text-xs md:text-sm">
                      Back to shopping
                  </Button>
              </div>
          </div>
      );
  }

  return (
    <div className="min-h-screen bg-[#f8f9fa] py-3 md:py-6 px-3 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <AnimatePresence mode="wait">
          {step !== 'success' ? (
            <motion.div
              key="checkout-form"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6"
            >
              {/* Left Column: Checkout Steps */}
              <div className="lg:col-span-2 space-y-4">
                <div className="bg-white p-4 md:p-6 rounded-2xl md:rounded-3xl shadow-sm border border-gray-100">
                  <div className="flex items-center justify-between mb-4 md:mb-6">
                    <div className="flex items-center gap-2 md:gap-3">
                      <Button variant="ghost" size="icon" onClick={onBack} className="rounded-full hover:bg-gray-100 h-8 w-8">
                        <ChevronLeft className="h-4 w-4 md:h-5 md:w-5" />
                      </Button>
                      <div>
                        <h1 className="text-base md:text-2xl font-black tracking-tighter leading-none">Checkout</h1>
                        <p className="text-[8px] md:text-[10px] font-bold text-gray-400 tracking-widest mt-0.5 uppercase">Secure Payment</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 md:gap-2">
                       <div className={`w-6 h-6 md:w-7 md:h-7 rounded-full flex items-center justify-center font-black text-[10px] ${step === 'address' ? 'bg-orange-600 text-white' : 'bg-green-100 text-green-700'}`}>
                          {step === 'address' ? '1' : <CheckCircle2 className="h-3 w-3" />}
                       </div>
                       <div className="w-4 md:w-6 h-1 bg-gray-100 rounded-full"></div>
                       <div className={`w-6 h-6 md:w-7 md:h-7 rounded-full flex items-center justify-center font-black text-[10px] ${step === 'payment' ? 'bg-orange-600 text-white' : 'bg-gray-100 text-gray-400'}`}>
                          2
                       </div>
                    </div>
                  </div>

                  {step === 'address' ? (
                    <motion.div
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="space-y-4 md:space-y-6"
                    >
                      <div>
                        <h3 className="text-base md:text-lg font-black tracking-tighter italic mb-3 md:mb-4 flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-orange-600" /> Shipping <span className="text-orange-600">Details</span>
                        </h3>

                        <div className="space-y-3">
                          <div className="space-y-1">
                            <Label className="text-[9px] md:text-[10px] font-black text-gray-400 ml-1 uppercase">Street Address</Label>
                            <div className="relative">
                              <Input
                                placeholder="House number and street name"
                                value={address}
                                onChange={(e) => setAddress(e.target.value)}
                                className="pl-9 md:pl-10 h-10 md:h-12 rounded-xl border-2 border-gray-50 focus:border-orange-500 font-bold transition-all bg-gray-50/50 text-xs md:text-sm"
                              />
                              <Home className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-300" />
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1">
                              <Label className="text-[9px] md:text-[10px] font-black text-gray-400 ml-1 uppercase">City</Label>
                              <div className="relative">
                                <Input
                                  placeholder="City"
                                  value={city}
                                  onChange={(e) => setCity(e.target.value)}
                                  className="pl-9 md:pl-10 h-10 md:h-12 rounded-xl border-2 border-gray-50 focus:border-orange-500 font-bold transition-all bg-gray-50/50 text-xs md:text-sm"
                                />
                                <Building className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-300" />
                              </div>
                            </div>
                            <div className="space-y-1">
                              <Label className="text-[9px] md:text-[10px] font-black text-gray-400 ml-1 uppercase">Zip Code</Label>
                              <Input
                                placeholder="100001"
                                value={zip}
                                onChange={(e) => setZip(e.target.value)}
                                className="h-10 md:h-12 rounded-xl border-2 border-gray-50 focus:border-orange-500 font-bold transition-all bg-gray-50/50 text-xs md:text-sm"
                              />
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="bg-green-50 p-3 md:p-4 rounded-xl md:rounded-2xl border-2 border-green-100 flex items-start gap-3">
                        <div className="bg-white p-2 rounded-xl shadow-sm shrink-0">
                           <Truck className="h-4 w-4 md:h-5 md:w-5 text-orange-600" />
                        </div>
                        <div>
                          <h4 className="font-black italic tracking-tighter text-green-900 text-xs md:text-sm leading-none mb-1">Vivi Express Delivery</h4>
                          <p className="text-[9px] md:text-xs text-green-700 font-bold leading-relaxed">
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
                        className="w-full h-11 md:h-14 bg-orange-600 hover:bg-orange-700 text-white font-black text-sm md:text-base rounded-xl shadow-md transition-all active:scale-95 group"
                      >
                        Continue to payment
                        <ArrowRight className="ml-2 h-4 w-4 md:h-5 md:w-5 group-hover:translate-x-1 transition-transform" />
                      </Button>
                    </motion.div>
                  ) : (
                    <motion.div
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="space-y-6"
                    >
                      <div>
                        <h3 className="text-base md:text-lg font-black tracking-tighter italic mb-4 flex items-center gap-2">
                          <CreditCard className="h-4 w-4 text-orange-600" /> Payment <span className="text-orange-600">Method</span>
                        </h3>

                        <div className="flex bg-gray-100 rounded-xl p-1 mb-6">
                          {(['card', 'momo', 'bank', 'pod'] as const).map((type) => (
                            <Button
                              key={type}
                              variant="ghost"
                              onClick={() => {
                                setPaymentType(type);
                                setSelectedCard(null);
                              }}
                              className={`flex-1 rounded-lg font-black text-[9px] md:text-[10px] tracking-widest h-9 md:h-10 transition-all ${
                                paymentType === type ? 'bg-white text-orange-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'
                              }`}
                            >
                              {type === 'card' ? 'Card' : type === 'momo' ? 'MoMo' : type === 'bank' ? 'Bank' : 'Cash'}
                            </Button>
                          ))}
                        </div>

                        {paymentType === 'card' ? (
                          <div className="space-y-3">
                            {savedCards.length > 0 ? (
                               <RadioGroup value={selectedCard?.id} onValueChange={(v) => setSelectedCard(savedCards.find(c => c.id === v))} className="gap-3">
                                  {savedCards.map(card => (
                                    <div key={card.id} className={`flex items-center p-4 rounded-2xl border-2 cursor-pointer transition-all ${selectedCard?.id === card.id ? 'border-orange-500 bg-orange-50/30' : 'border-gray-50 bg-white hover:border-gray-200'}`} onClick={() => setSelectedCard(card)}>
                                       <div className={`p-2 rounded-xl mr-3 ${card.brand === 'Visa' ? 'bg-blue-50 text-blue-600' : 'bg-red-50 text-red-600'}`}>
                                          <CreditCard className="h-5 w-5" />
                                       </div>
                                       <div className="flex-1">
                                          <p className="font-black text-xs md:text-sm tracking-tight">{card.brand} ending in {card.last4}</p>
                                          <p className="text-[9px] text-gray-400 font-bold">Expires {card.expiry}</p>
                                       </div>
                                       {selectedCard?.id === card.id && (
                                           <div className="bg-orange-600 rounded-full p-0.5">
                                               <CheckCircle2 className="h-3.5 w-3.5 text-white" />
                                           </div>
                                       )}
                                    </div>
                                  ))}
                                  <div className="p-4 rounded-2xl border-2 border-dashed border-gray-200 flex items-center justify-center gap-2 text-gray-400 hover:text-orange-600 hover:border-orange-200 transition-all cursor-pointer group">
                                      <Plus className="h-4 w-4 group-hover:scale-110 transition-transform" />
                                      <span className="text-[10px] md:text-xs font-black tracking-widest">Add New Card</span>
                                  </div>
                               </RadioGroup>
                            ) : (
                              <div className="text-center py-10 bg-white rounded-2xl border-2 border-dashed border-gray-100">
                                 <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-3">
                                    <CreditCard className="h-6 w-6 text-gray-200" />
                                 </div>
                                 <p className="text-[10px] md:text-xs font-black text-gray-400 tracking-widest max-w-[200px] mx-auto">No saved cards found. Please use another method or add a card in profile.</p>
                              </div>
                            )}
                          </div>
                        ) : paymentType === 'pod' ? (
                           <div className="bg-white p-6 md:p-8 rounded-2xl border-2 border-gray-100 text-center space-y-4 shadow-sm">
                              <div className="w-14 h-14 bg-green-50 rounded-full flex items-center justify-center mx-auto">
                                 <ShoppingBag className="h-7 w-7 text-green-600" />
                              </div>
                              <div>
                                <h4 className="text-lg md:text-xl font-black italic tracking-tighter">Pay on <span className="text-orange-600">Delivery</span></h4>
                                <p className="text-xs text-gray-500 font-medium leading-relaxed max-w-sm mx-auto mt-1">
                                  Our rider will bring a POS terminal for card payments or accept cash when your order arrives.
                                </p>
                              </div>
                              <div className="flex items-center justify-center gap-1.5 text-[9px] font-black text-orange-600 tracking-widest bg-orange-50 py-1.5 rounded-full px-4 w-fit mx-auto">
                                 <ShieldCheck className="h-3 w-3" /> Safe & Secure
                              </div>
                           </div>
                        ) : paymentType === 'bank' ? (
                            <div className="bg-white p-4 md:p-6 rounded-2xl border-2 border-orange-100 shadow-lg relative overflow-hidden group">
                               <div className="relative z-10">
                                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-4">
                                     <div className="flex items-center gap-2 md:gap-3">
                                        <div className="bg-orange-600 p-1.5 rounded-xl text-white shadow-md shadow-orange-200">
                                           <Building className="h-4 w-4 md:h-5 md:w-5" />
                                        </div>
                                        <h4 className="text-base md:text-xl font-black italic tracking-tighter text-black uppercase leading-none">Bank <span className="text-orange-600">Transfer</span></h4>
                                     </div>
                                     <div className="bg-green-100 text-green-700 px-2.5 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest w-fit">Manual Verification</div>
                                  </div>

                                  <div className="space-y-3 md:space-y-4">
                                    <div className="p-4 md:p-6 bg-gray-50/50 rounded-xl md:rounded-2xl border border-gray-100 backdrop-blur-sm group-hover:bg-white transition-colors duration-500">
                                       <div className="flex justify-between items-center pb-3 border-b border-gray-100 mb-3">
                                          <span className="text-[9px] font-black text-gray-400 tracking-widest uppercase">Beneficiary</span>
                                          <span className="text-xs font-black text-black truncate ml-2">VIVO PREMIUM STORE</span>
                                       </div>

                                       <div className="space-y-3">
                                          <div className="flex flex-col gap-0.5">
                                             <span className="text-[8px] font-black text-orange-400 tracking-widest uppercase">Bank Network</span>
                                             <span className="text-sm md:text-base font-black text-black tracking-tight">{storeSettings?.bankName || 'WEMA BANK / ALAT'}</span>
                                          </div>

                                          <div className="flex flex-col gap-0.5">
                                             <span className="text-[8px] font-black text-orange-400 tracking-widest uppercase">Account Number</span>
                                             <div className="flex items-center justify-between gap-2">
                                                <span className="text-xl md:text-3xl font-black tracking-[0.1em] text-orange-600 break-all">{storeSettings?.bankAccountNumber || '0123456789'}</span>
                                                <Button
                                                   variant="ghost"
                                                   size="icon"
                                                   className="rounded-full h-7 w-7 md:h-8 md:w-8 hover:bg-orange-100 hover:text-orange-600 shrink-0"
                                                   onClick={() => {
                                                      navigator.clipboard.writeText(storeSettings?.bankAccountNumber || '0123456789');
                                                      toast.success("Account number copied!");
                                                   }}
                                                >
                                                   <Plus className="h-4 w-4" />
                                                </Button>
                                             </div>
                                          </div>
                                       </div>
                                    </div>

                                    <div className="bg-orange-600 p-3 rounded-xl flex items-center gap-2.5 shadow-md shadow-orange-100">
                                       <Zap className="h-4 w-4 text-yellow-400 fill-yellow-400 animate-pulse shrink-0" />
                                       <p className="text-[8px] md:text-[9px] text-white font-black uppercase tracking-widest leading-tight">
                                          Transfer exactly <span className="text-yellow-400">{formatPrice(totalPrice)}</span> then click "Place Order" below.
                                       </p>
                                    </div>
                                  </div>
                               </div>

                               <Building className="absolute right-[-20px] bottom-[-20px] h-28 w-28 text-orange-600/5 rotate-12" />
                            </div>
                        ) : paymentType === 'momo' ? (
                            <div className="bg-green-600 p-6 rounded-2xl text-white space-y-4 shadow-lg">
                               <div className="flex items-center justify-between">
                                  <h4 className="text-lg font-black italic tracking-tighter text-green-50">Mobile <span className="text-black">Money</span></h4>
                                  <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                                     <Plus className="h-4 w-4" />
                                  </div>
                               </div>
                               <div className="bg-green-700/50 p-4 rounded-xl border border-green-500/30">
                                  <p className="text-[9px] font-black text-green-300 tracking-widest mb-1">Phone Number</p>
                                  <p className="text-2xl font-black tracking-tighter">{storeSettings?.momoNumber || '+234 800 000 0000'}</p>
                               </div>
                               <p className="text-[8px] text-green-200 font-black text-center tracking-widest">Pay via MTN/Airtel MoMo</p>
                            </div>
                        ) : (
                          <div className="p-10 text-center bg-white rounded-2xl border-2 border-gray-100">
                             <ShieldAlert className="h-8 w-8 text-gray-200 mx-auto mb-2" />
                             <p className="text-[10px] font-black text-gray-400 tracking-widest">This payment method is temporarily unavailable.</p>
                          </div>
                        )}
                      </div>

                      <div className="flex gap-3">
                        <Button
                            variant="outline"
                            onClick={() => setStep('address')}
                            className="h-11 md:h-12 px-6 rounded-xl border-2 font-black tracking-widest text-xs"
                        >
                            Back
                        </Button>
                        <Button
                          onClick={handlePlaceOrder}
                          disabled={isProcessing || (paymentType === 'card' && !selectedCard && savedCards.length > 0)}
                          className="flex-1 h-11 md:h-12 bg-black hover:bg-zinc-800 text-white font-black text-sm md:text-base rounded-xl shadow-lg transition-all active:scale-95"
                        >
                          {isProcessing ? 'Processing...' : `Place order • ${formatPrice(totalPrice)}`}
                        </Button>
                      </div>
                    </motion.div>
                  )}
                </div>

                {/* Secure Badge */}
                <div className="flex items-center justify-center gap-4 md:gap-6 p-4 bg-gray-100/50 rounded-2xl border border-gray-100">
                   <div className="flex items-center gap-1.5">
                      <ShieldCheck className="h-4 w-4 text-green-600" />
                      <span className="text-[9px] font-black tracking-widest text-gray-500">SSL Encrypted</span>
                   </div>
                   <div className="w-px h-3 bg-gray-200"></div>
                   <div className="flex items-center gap-1.5">
                      <Package className="h-4 w-4 text-orange-600" />
                      <span className="text-[9px] font-black tracking-widest text-gray-500">Vivi Guarantee</span>
                   </div>
                   <div className="w-px h-3 bg-gray-200"></div>
                   <div className="flex items-center gap-1.5">
                      <Clock className="h-4 w-4 text-orange-500" />
                      <span className="text-[9px] font-black tracking-widest text-gray-500">24/7 Support</span>
                   </div>
                </div>
              </div>

              {/* Right Column: Order Summary */}
              <div className="space-y-4">
                <div className="bg-white p-4 md:p-6 rounded-2xl md:rounded-3xl shadow-sm border border-gray-100 sticky top-24">
                  <h3 className="text-base md:text-lg font-black tracking-tighter italic mb-4 border-b border-gray-50 pb-3">Order <span className="text-orange-600">Summary</span></h3>

                  <ScrollArea className="max-h-[220px] mb-4 pr-3">
                    <div className="space-y-4">
                      {items.map(item => (
                        <div key={item.id} className="flex gap-3 group">
                          <div className="w-12 h-12 md:w-14 md:h-14 rounded-xl overflow-hidden bg-gray-50 flex-shrink-0 border border-gray-50">
                            <img src={item.image} alt={item.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-black truncate group-hover:text-orange-600 transition-colors">{item.name}</p>
                            <div className="flex items-center justify-between mt-1">
                               <p className="text-[10px] font-bold text-gray-400">Qty: {item.quantity}</p>
                               <p className="text-xs md:text-sm font-black text-orange-600">{formatPrice(item.priceValue * item.quantity)}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>

                  <div className="space-y-3 pt-4 border-t border-dashed border-gray-100">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-black text-gray-400 tracking-widest">Subtotal</span>
                      <span className="text-xs md:text-sm font-bold">{formatPrice(totalPrice)}</span>
                    </div>
                    {discount > 0 && (
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] font-black text-orange-600 tracking-widest">Discount ({selectedVoucher?.offer})</span>
                        <span className="text-xs md:text-sm font-bold text-orange-600">-{formatPrice(discount)}</span>
                      </div>
                    )}
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-black text-gray-400 tracking-widest">Shipping</span>
                      <span className="text-xs font-black text-green-600 tracking-tighter">FREE</span>
                    </div>
                    <div className="flex justify-between items-center pt-3 border-t border-gray-50">
                      <span className="text-sm md:text-base font-black tracking-tighter">Total Amount</span>
                      <span className="text-lg md:text-xl font-black text-orange-600 tracking-tighter">{formatPrice(totalPrice - discount)}</span>
                    </div>
                  </div>

                  {profile?.vouchers?.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-gray-50">
                       <p className="text-[9px] md:text-[10px] font-black text-gray-400 tracking-widest uppercase mb-3">Apply Voucher</p>
                       <div className="space-y-2">
                          {profile.vouchers.map((v: any, idx: number) => (
                             <div
                                key={idx}
                                onClick={() => {
                                   if (selectedVoucher?.code === v.code) {
                                      setSelectedVoucher(null);
                                      setDiscount(0);
                                   } else {
                                      setSelectedVoucher(v);
                                      if (v.offer.includes('%')) {
                                         const percentage = parseFloat(v.offer.split('%')[0]) / 100;
                                         setDiscount(totalPrice * percentage);
                                      } else if (v.offer.includes('₦')) {
                                         const amount = parseFloat(v.offer.split('₦')[1]);
                                         setDiscount(Math.min(amount, totalPrice));
                                      } else if (v.offer.includes('$')) {
                                         const amount = parseFloat(v.offer.split('$')[1]);
                                         setDiscount(Math.min(amount, totalPrice));
                                      }
                                      toast.success(`Voucher ${v.code} applied!`);
                                   }
                                }}
                                className={`p-3 rounded-xl border-2 cursor-pointer transition-all flex items-center justify-between ${selectedVoucher?.code === v.code ? 'border-orange-600 bg-orange-50' : 'border-gray-50 bg-gray-50/30 hover:border-orange-200'}`}
                             >
                                <div>
                                   <p className="font-black text-[10px] uppercase tracking-tight">{v.code}</p>
                                   <p className="text-[8px] font-bold text-orange-600 uppercase">{v.offer}</p>
                                </div>
                                {selectedVoucher?.code === v.code ? (
                                   <div className="h-4 w-4 bg-orange-600 rounded-full flex items-center justify-center">
                                      <CheckCircle2 className="h-2.5 w-2.5 text-white" />
                                   </div>
                                ) : (
                                   <ArrowRight className="h-3.5 w-3.5 text-gray-300" />
                                )}
                             </div>
                          ))}
                       </div>
                    </div>
                  )}

                  <div className="mt-4 p-3 bg-orange-50 rounded-xl border border-orange-100 text-center">
                     <p className="text-[9px] md:text-[10px] font-black text-orange-600 tracking-widest">Points Earned: {Math.floor(totalPrice - discount)}</p>
                  </div>
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="checkout-success"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="max-w-md mx-auto py-4 md:py-8"
            >
              <div className="bg-white p-5 md:p-8 rounded-2xl md:rounded-3xl shadow-xl text-center space-y-5 border-4 border-green-50 relative overflow-hidden">
                 <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-orange-600 via-green-500 to-yellow-400"></div>

                 <div className="w-16 h-16 md:w-20 md:h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto relative group">
                    <CheckCircle2 className="h-8 w-8 md:h-10 md:w-10 text-green-600 group-hover:scale-110 transition-transform" />
                    <div className="absolute inset-0 rounded-full border-4 border-green-100 animate-ping opacity-25"></div>
                 </div>

                 <div className="space-y-1.5">
                    <h2 className="text-2xl md:text-3xl font-black tracking-tighter italic leading-none">Order <span className="text-orange-600">Successful!</span></h2>
                    <p className="text-gray-400 font-bold text-[8px] md:text-[10px] tracking-widest leading-relaxed pt-1">
                      Your premium Vivi order has been placed. Check your email for confirmation.
                    </p>
                 </div>

                 <div className="grid grid-cols-2 gap-3">
                    <div className="bg-gray-50 p-3 md:p-4 rounded-xl border border-gray-100 col-span-2 text-left">
                       <p className="text-[8px] md:text-[9px] font-black text-gray-400 mb-1 uppercase tracking-widest">Order Details</p>
                       <p className="text-[10px] md:text-xs font-bold text-gray-800">Order #: <span className="text-orange-600 font-black">{createdOrderDetails?.orderId || 'VIVI-ORDER'}</span></p>
                       <p className="text-[10px] md:text-xs font-bold text-gray-800">Customer: <span className="font-black">{createdOrderDetails?.name}</span></p>
                       <p className="text-[10px] md:text-xs font-bold text-gray-800">Phone: <span className="font-black">{createdOrderDetails?.phone}</span></p>
                    </div>
                    <div className="bg-gray-50 p-3 md:p-4 rounded-xl border border-gray-100 col-span-2">
                       <p className="text-[8px] md:text-[9px] font-black text-gray-400 mb-0.5 uppercase tracking-widest">Arrival Date</p>
                       <p className="text-[9px] md:text-xs font-black text-green-600">Tomorrow, 4PM</p>
                    </div>
                 </div>

                 <div className="space-y-2.5">
                    <Button onClick={onBack} className="w-full h-11 md:h-12 bg-black hover:bg-zinc-800 text-white font-black text-sm md:text-base rounded-xl shadow-md">
                        Track my order
                    </Button>
                    <Button variant="ghost" onClick={onBack} className="w-full h-8 md:h-9 font-black tracking-widest text-[8px] md:text-[10px] text-gray-400 hover:text-orange-600">
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
