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
import { useCurrency } from '@/lib/CurrencyContext';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { motion, AnimatePresence } from 'motion/react';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onCheckout: () => void;
}

export default function CartDrawer({ isOpen, onClose, onCheckout }: CartDrawerProps) {
  const { items, removeFromCart, updateQuantity, totalPrice, totalItems, clearCart } = useCart();
  const { formatPrice } = useCurrency();

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="w-[90vw] sm:max-w-md p-0 flex flex-col border-l border-gray-100 shadow-2xl h-full">
        <SheetHeader className="p-3 md:p-4 border-b border-gray-100 bg-white sticky top-0 z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 md:gap-3">
              <div className="bg-green-100 p-1.5 md:p-2 rounded-xl">
                <ShoppingBag className="h-4 w-4 md:h-5 md:w-5 text-orange-600" />
              </div>
              <div>
                <SheetTitle className="text-base md:text-lg font-black tracking-tighter">My <span className="text-orange-600">Cart</span></SheetTitle>
                <SheetDescription className="text-gray-400 font-bold text-[8px] md:text-[10px] tracking-widest mt-0.5">
                  {totalItems} Items in bag
                </SheetDescription>
              </div>
            </div>
            <div className="flex items-center gap-1 md:gap-2">
              {items.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearCart}
                  className="text-[8px] md:text-[10px] font-black tracking-widest text-red-400 hover:text-red-500 hover:bg-red-50 h-7"
                >
                  Clear
                </Button>
              )}
              <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full hover:bg-gray-100 h-7 w-7">
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </SheetHeader>

        <div className="flex-1 overflow-hidden bg-gray-50/50">
          <ScrollArea className="h-full">
            <div className="p-3 md:p-4 space-y-3 pb-8">
              {items.length === 0 ? (
                <div className="py-10 flex flex-col items-center justify-center text-center px-6">
                  <div className="w-12 h-12 md:w-16 md:h-16 bg-white rounded-full flex items-center justify-center shadow-md shadow-gray-200/50 mb-3 md:mb-4">
                    <ShoppingCart className="h-6 w-6 md:h-8 md:w-8 text-gray-200" />
                  </div>
                  <h3 className="text-base md:text-lg font-black tracking-tighter mb-1">Cart is Empty</h3>
                  <p className="text-gray-400 font-medium mb-4 md:mb-6 text-xs">No items added yet.</p>
                  <Button
                    onClick={onClose}
                    className="bg-orange-600 hover:bg-orange-700 text-white font-black rounded-xl px-6 h-9 md:h-10 text-xs md:text-sm"
                  >
                    Start shopping
                  </Button>
                </div>
              ) : (
                <AnimatePresence>
                  {items.map((item) => (
                    <motion.div 
                      key={item.id}
                      layout
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: -50 }}
                      className="bg-white p-2 md:p-3 rounded-2xl shadow-sm border border-gray-100 group relative"
                    >
                      <div className="flex gap-3">
                        <div className="w-16 h-16 md:w-20 md:h-20 rounded-xl overflow-hidden bg-gray-50 flex-shrink-0">
                          <img 
                            src={item.image} 
                            alt={item.name} 
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1560393464-5c69a73c5770?q=80&w=500&auto=format&fit=crop';
                            }}
                          />
                        </div>
                        <div className="flex-1 flex flex-col justify-between py-0.5">
                          <div>
                            <h4 className="font-bold text-[10px] md:text-xs leading-tight mb-0.5 line-clamp-1">{item.name}</h4>
                            <p className="text-orange-600 font-black text-sm md:text-base">{formatPrice(item.priceValue * item.quantity)}</p>
                            {item.orderNumber && (
                              <p className="text-[8px] md:text-[9px] font-bold text-gray-500 mt-0.5">
                                Ref: <span className="text-orange-600 font-black">{item.orderNumber}</span>
                              </p>
                            )}
                            {(item.customerName || item.phone) && (
                              <p className="text-[8px] md:text-[9px] text-gray-400 font-medium">
                                {item.customerName && <span>Name: {item.customerName}</span>}
                                {item.customerName && item.phone && <span> | </span>}
                                {item.phone && <span>Phone: {item.phone}</span>}
                              </p>
                            )}
                          </div>
                          
                          <div className="flex items-center justify-between mt-auto">
                            <div className="flex items-center gap-0.5 bg-gray-50 rounded-lg p-0.5 border border-gray-100">
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                onClick={() => updateQuantity(item.id, -1)}
                                className="h-5 w-5 md:h-6 md:w-6 rounded-md hover:bg-white text-gray-400"
                              >
                                <Minus className="h-2 w-2 md:h-2.5 md:w-2.5" />
                              </Button>
                              <span className="w-5 md:w-6 text-center font-black text-[9px] md:text-[10px]">{item.quantity}</span>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                onClick={() => updateQuantity(item.id, 1)}
                                className="h-5 w-5 md:h-6 md:w-6 rounded-md hover:bg-white text-gray-600"
                              >
                                <Plus className="h-2 w-2 md:h-2.5 md:w-2.5" />
                              </Button>
                            </div>
                            
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              onClick={() => removeFromCart(item.id)}
                              className="h-6 w-6 md:h-7 md:w-7 text-gray-300 hover:text-red-500 transition-colors"
                            >
                              <Trash2 className="h-3 w-3 md:h-3.5 md:w-3.5" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              )}
            </div>
          </ScrollArea>
        </div>

        {items.length > 0 && (
          <SheetFooter className="p-3 md:p-4 bg-white border-t border-gray-100">
            <div className="w-full space-y-2.5">
              <div className="flex justify-between items-end">
                <div>
                  <p className="text-[8px] md:text-[10px] font-black text-gray-400 tracking-widest uppercase">Total</p>
                  <p className="text-lg md:text-2xl font-black text-black tracking-tighter leading-none">
                    {formatPrice(totalPrice)}
                  </p>
                </div>
                <Badge className="bg-green-100 text-green-700 border-none font-black text-[7px] md:text-[9px] tracking-wider py-0.5">
                  Free Shipping
                </Badge>
              </div>
              
              <Button 
                onClick={onCheckout}
                className="w-full h-10 md:h-12 bg-orange-600 hover:bg-orange-700 text-white font-black text-xs md:text-base rounded-xl shadow-md transition-all active:scale-95 flex items-center justify-center gap-2 group"
              >
                Proceed to Checkout
                <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Button>
            </div>
          </SheetFooter>
        )}
      </SheetContent>
    </Sheet>
  );
}
