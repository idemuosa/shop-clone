import React from 'react';
import { ShoppingCart, X, Plus, Minus, Trash2, ArrowRight, ShoppingBag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle, 
  SheetFooter,
  SheetDescription
} from '@/components/ui/sheet';
import { useCart } from '@/lib/CartContext';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { motion, AnimatePresence } from 'motion/react';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onCheckout: () => void;
}

export default function CartDrawer({ isOpen, onClose, onCheckout }: CartDrawerProps) {
  const { items, removeFromCart, updateQuantity, totalPrice, totalItems } = useCart();

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-md p-0 flex flex-col border-l border-gray-100 shadow-2xl">
        <SheetHeader className="p-6 border-b border-gray-100 bg-white sticky top-0 z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-orange-100 p-2 rounded-xl">
                <ShoppingBag className="h-6 w-6 text-orange-600" />
              </div>
              <div>
                <SheetTitle className="text-xl font-black uppercase tracking-tighter">My <span className="text-orange-600">Cart</span></SheetTitle>
                <SheetDescription className="text-gray-400 font-bold uppercase text-[10px] tracking-widest mt-0.5">
                  {totalItems} Items in your bag
                </SheetDescription>
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full hover:bg-gray-100">
              <X className="h-5 w-5" />
            </Button>
          </div>
        </SheetHeader>

        <div className="flex-1 overflow-hidden bg-gray-50/50">
          <ScrollArea className="h-full p-6">
            {items.length === 0 ? (
              <div className="h-[60vh] flex flex-col items-center justify-center text-center px-10">
                <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center shadow-xl shadow-gray-200/50 mb-6 group hover:scale-110 transition-transform">
                  <ShoppingCart className="h-10 w-10 text-gray-200 group-hover:text-orange-400 transition-colors" />
                </div>
                <h3 className="text-xl font-black uppercase tracking-tighter mb-2">Cart is Empty</h3>
                <p className="text-gray-400 font-medium mb-8 text-sm">Looks like you haven't added anything to your cart yet.</p>
                <Button 
                  onClick={onClose}
                  className="bg-orange-600 hover:bg-orange-700 text-white font-black rounded-xl px-10 h-12 shadow-lg shadow-orange-200 transition-all active:scale-95"
                >
                  START SHOPPING
                </Button>
              </div>
            ) : (
              <div className="space-y-6 pb-20">
                <AnimatePresence>
                  {items.map((item) => (
                    <motion.div 
                      key={item.id}
                      layout
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: -100 }}
                      className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 group relative"
                    >
                      <div className="flex gap-4">
                        <div className="w-24 h-24 rounded-xl overflow-hidden bg-gray-50 flex-shrink-0">
                          <img 
                            src={item.image} 
                            alt={item.name} 
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                            referrerPolicy="no-referrer"
                          />
                        </div>
                        <div className="flex-1 flex flex-col justify-between">
                          <div>
                            <h4 className="font-bold text-sm leading-tight mb-1 line-clamp-1">{item.name}</h4>
                            <p className="text-orange-600 font-black text-lg">${(item.priceValue * item.quantity).toFixed(2)}</p>
                          </div>
                          
                          <div className="flex items-center justify-between mt-autp">
                            <div className="flex items-center gap-1 bg-gray-50 rounded-lg p-1 border border-gray-100">
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                onClick={() => updateQuantity(item.id, -1)}
                                className="h-7 w-7 rounded-md hover:bg-white text-gray-400"
                              >
                                <Minus className="h-3 w-3" />
                              </Button>
                              <span className="w-8 text-center font-black text-xs">{item.quantity}</span>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                onClick={() => updateQuantity(item.id, 1)}
                                className="h-7 w-7 rounded-md hover:bg-white text-gray-600"
                              >
                                <Plus className="h-3 w-3" />
                              </Button>
                            </div>
                            
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              onClick={() => removeFromCart(item.id)}
                              className="h-8 w-8 text-gray-300 hover:text-red-500 hover:bg-red-50 transition-colors"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </ScrollArea>
        </div>

        {items.length > 0 && (
          <SheetFooter className="p-6 bg-white border-t border-gray-100 shadow-[0_-10px_20px_rgba(0,0,0,0.02)]">
            <div className="w-full space-y-4">
              <div className="flex justify-between items-end mb-2">
                <div>
                  <p className="text-[10px] font-black uppercase text-gray-400 tracking-[0.2em]">Total Amount</p>
                  <p className="text-3xl font-black text-black tracking-tighter">
                    <span className="text-orange-600">$</span>{totalPrice.toFixed(2)}
                  </p>
                </div>
                <div className="text-right">
                  <Badge className="bg-green-100 text-green-700 border-none font-black text-[9px] uppercase tracking-wider mb-2">
                    Free Shipping Included
                  </Badge>
                </div>
              </div>
              
              <Button 
                onClick={onCheckout}
                className="w-full h-14 bg-orange-600 hover:bg-orange-700 text-white font-black text-lg rounded-2xl shadow-xl shadow-orange-100 transition-all active:scale-95 flex items-center justify-center gap-2 group"
              >
                PROCEED TO CHECKOUT
                <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Button>
              
              <p className="text-center text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                Safe & Secure Checkout
              </p>
            </div>
          </SheetFooter>
        )}
      </SheetContent>
    </Sheet>
  );
}
