import { Star, Heart, ShoppingCart, ChevronLeft, ChevronRight, Filter, X, Zap, Eye, Truck, CheckCircle2, SlidersHorizontal, CreditCard, ShieldCheck, Plus, User, MapPin, Home, Building, Minus, Clock, Award, Info, BadgeCheck, AlertCircle, Sparkles, Edit, ShoppingBag, Package, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { motion, AnimatePresence } from "motion/react";
import { useState, useMemo, useEffect } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Slider } from "@/components/ui/slider";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
} from "@/components/ui/sheet";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { db, auth } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp, query, onSnapshot, orderBy, where, updateDoc, doc } from "firebase/firestore";
import { toast } from "sonner";
import { useAuth } from "@/lib/AuthContext";
import { useCart } from "@/lib/CartContext";
import { useCurrency } from "@/lib/CurrencyContext";
import { API_URL } from "@/lib/api";
import { cn } from "@/lib/utils";
import AIReviewSummarizer from "./ai/AIReviewSummarizer";

interface Product {
  id: string | number;
  name: string;
  price: string;
  oldPrice?: string;
  rating: number;
  reviews: number;
  image: string;
  tag?: string;
  category: string;
  sold: string;
  description?: string;
  prescription?: string;
}

interface ProductSectionProps {
  title: string;
  subtitle: string;
  products: Product[];
  onAddToWishlist?: () => void;
  onProductView?: (product: Product) => void;
}

export default function ProductSection({ title, subtitle, products, onAddToWishlist, onProductView }: ProductSectionProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [priceRange, setPriceRange] = useState<number[]>([0, 200]);
  const [minRating, setMinRating] = useState<string>("0");
  const [selectedProduct, setInternalSelectedProduct] = useState<Product | null>(null);

  const setSelectedProduct = (product: Product | null) => {
    setInternalSelectedProduct(product);
    if (product && onProductView) {
      onProductView(product);
    }
  };
  const [isOrdering, setIsOrdering] = useState(false);
  const [checkoutStep, setCheckoutStep] = useState<'details' | 'address' | 'payment'>('details');
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<any>(null);
  const [paymentType, setPaymentType] = useState<'card' | 'momo' | 'bank' | 'pod'>('card');
  const [userPaymentMethods, setUserPaymentMethods] = useState<any[]>([]);
  const [manualCardNumber, setManualCardNumber] = useState("");
  const [manualExpiry, setManualExpiry] = useState("");
  const [manualCVC, setManualCVC] = useState("");
  const [manualName, setManualName] = useState("");
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [deliveryCity, setDeliveryCity] = useState("");
  const [deliveryZip, setDeliveryZip] = useState("");
  const [productQuantities, setProductQuantities] = useState<Record<string, number>>({});
  const [saveCard, setSaveCard] = useState(false);
  const [recentBoughVisible, setRecentBoughVisible] = useState(false);
  const [reviews, setReviews] = useState<any[]>([]);
  const [newReviewRating, setNewReviewRating] = useState(5);
  const [newReviewComment, setNewReviewComment] = useState("");
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const { user, profile } = useAuth();
  const { addToCart, setIsOpen } = useCart();
  const { formatPrice } = useCurrency();

  const handleAddToCart = (product: Product, quantity: number = 1) => {
    addToCart({
      id: product.id.toString(),
      name: product.name,
      price: product.price.toString(),
      priceValue: typeof product.price === 'number' ? product.price : parseFloat(product.price.toString().replace(/[^\d.]/g, '')),
      image: product.image
    }, quantity);
    toast.success(`${product.name} added to cart!`, {
      icon: <ShoppingCart className="h-4 w-4 text-purple-600" />,
      action: {
        label: "View Cart",
        onClick: () => setIsOpen(true)
      }
    });
  };

  useEffect(() => {
    const timer = setTimeout(() => setRecentBoughVisible(true), 3000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!user || checkoutStep !== 'payment') return;

    const q = query(collection(db, 'users', user.uid, 'paymentMethods'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const methods = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setUserPaymentMethods(methods);
      if (methods.length > 0 && !selectedPaymentMethod) {
        setSelectedPaymentMethod(methods[0]);
      }
    }, (error) => {
      console.error("Payment methods snapshot error:", error);
    });

    return () => unsubscribe();
  }, [user, checkoutStep]);

  useEffect(() => {
    if (!selectedProduct) {
      setReviews([]);
      return;
    }

    const q = query(
      collection(db, 'products', selectedProduct.id.toString(), 'reviews'),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const revs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setReviews(revs);
    }, (error) => {
      console.error("Product reviews snapshot error:", error);
    });

    return () => unsubscribe();
  }, [selectedProduct]);

  const handleSubmitReview = async () => {
    if (!user) {
      toast.error("Please login to submit a review");
      return;
    }

    if (!newReviewComment.trim()) {
      toast.error("Please enter a comment");
      return;
    }

    setIsSubmittingReview(true);
    try {
      await addDoc(collection(db, 'products', selectedProduct!.id.toString(), 'reviews'), {
        productId: selectedProduct!.id.toString(),
        userId: user.uid,
        userName: user.displayName || user.email?.split('@')[0] || "Anonymous",
        rating: newReviewRating,
        comment: newReviewComment,
        createdAt: serverTimestamp(),
      });
      setNewReviewComment("");
      setNewReviewRating(5);
      toast.success("Review submitted!");
    } catch (error: any) {
      toast.error("Failed to submit review: " + error.message);
    } finally {
      setIsSubmittingReview(false);
    }
  };

  // Extract unique categories from products
  const categories = useMemo(() => {
    const cats = products.map(p => p.category).filter(Boolean) as string[];
    return ["all", ...Array.from(new Set(cats))];
  }, [products]);

  const validateLuhn = (number: string) => {
    let sum = 0;
    let shouldDouble = false;
    for (let i = number.length - 1; i >= 0; i--) {
      let digit = parseInt(number.charAt(i));
      if (shouldDouble) {
        if ((digit *= 2) > 9) digit -= 9;
      }
      sum += digit;
      shouldDouble = !shouldDouble;
    }
    return sum % 10 === 0;
  };

  const formatCardNumber = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const matches = v.match(/\d{4,16}/g);
    const match = (matches && matches[0]) || '';
    const parts = [];
    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }
    if (parts.length) {
      return parts.join(' ');
    } else {
      return v;
    }
  };

  const validateExpiry = (val: string) => {
    if (val.length !== 5) return false;
    const [monthStr, yearStr] = val.split('/');
    const month = parseInt(monthStr);
    const year = parseInt(yearStr);
    if (isNaN(month) || isNaN(year)) return false;
    if (month < 1 || month > 12) return false;
    
    const now = new Date();
    const currentYear = now.getFullYear() % 100;
    const currentMonth = now.getMonth() + 1;
    
    if (year < currentYear) return false;
    if (year === currentYear && month < currentMonth) return false;
    
    return true;
  };

  const filteredProducts = useMemo(() => {
    return products.filter(product => {
      const priceStr = String(product.price || "0").replace(/[^\d.]/g, '');
      const price = parseFloat(priceStr) || 0;

      const matchesCategory = selectedCategory === "all" || product.category === selectedCategory;
      const matchesPrice = price >= priceRange[0] && price <= priceRange[1];
      const matchesRating = (product.rating || 0) >= parseFloat(minRating || "0");
      
      return matchesCategory && matchesPrice && matchesRating;
    });
  }, [products, selectedCategory, priceRange, minRating]);

  const resetFilters = () => {
    setSelectedCategory("all");
    setPriceRange([0, 200]);
    setMinRating("0");
  };

  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (selectedCategory !== "all") count++;
    if (priceRange[0] !== 0 || priceRange[1] !== 200) count++;
    if (minRating !== "0") count++;
    return count;
  }, [selectedCategory, priceRange, minRating]);

  const handlePlaceOrder = async (product: Product) => {
    if (!user) {
      toast.error("Please login to place an order");
      return;
    }

    if (checkoutStep === 'details') {
      setCheckoutStep('address');
      return;
    }

    if (checkoutStep === 'address') {
      if (!deliveryAddress || !deliveryCity || !deliveryZip) {
        toast.error("Please fill in all delivery details");
        return;
      }
      setCheckoutStep('payment');
      return;
    }

    if (!selectedPaymentMethod) {
      toast.error("Please select a payment method");
      return;
    }

    if (selectedPaymentMethod.id === 'manual') {
      const cleanNumber = manualCardNumber.replace(/\s+/g, '');
      if (cleanNumber.length < 16 || !validateLuhn(cleanNumber)) {
        toast.error("Please enter a valid 16-digit card number");
        return;
      }
      if (!validateExpiry(manualExpiry)) {
        toast.error("Please enter a valid expiry date (MM/YY)");
        return;
      }
      if (!manualCVC || !manualName) {
        toast.error("Please fill in all card details");
        return;
      }
    }

    setIsOrdering(true);
    try {
      const cleanNumber = manualCardNumber.replace(/\s+/g, '');
      const cardBrand = cleanNumber.startsWith('4') ? 'Visa' : 'MasterCard';
      const cardLast4 = cleanNumber.slice(-4);

      if (selectedPaymentMethod.id === 'manual' && saveCard && user) {
        await addDoc(collection(db, 'users', user.uid, 'paymentMethods'), {
          last4: cardLast4,
          brand: cardBrand,
          expiry: manualExpiry,
          name: manualName,
          createdAt: serverTimestamp(),
        });
      }

      const quantity = productQuantities[product.id] || 1;
      const unitPrice = typeof product.price === 'number' ? product.price : parseFloat(product.price.toString().replace(/[^\d.]/g, ''));
      const totalAmount = unitPrice * quantity;

      const orderData = {
        userId: user.uid,
        customerEmail: user.email,
        productName: product.name,
        productImage: product.image,
        quantity: quantity,
        items: [{ id: product.id, name: product.name, price: product.price, quantity }],
        totalAmount: totalAmount,
        shippingAddress: {
          address: deliveryAddress,
          city: deliveryCity,
          zipCode: deliveryZip
        },
        paymentMethod: {
          type: paymentType,
          last4: selectedPaymentMethod?.id === 'manual' ? cardLast4 : (selectedPaymentMethod?.last4 || ''),
          brand: selectedPaymentMethod?.id === 'manual' ? cardBrand : (selectedPaymentMethod?.brand || paymentType.toUpperCase())
        },
        status: 'pending',
        createdAt: serverTimestamp(),
      };

      const orderRef = await addDoc(collection(db, 'orders'), orderData);

      toast.success(
        <div className="flex flex-col gap-1">
          <p className="font-bold">Order Placed Successfully!</p>
          <p className="text-[10px]  font-black tracking-widest text-purple-600">
            Vivo Reward: You saved ${(unitPrice * quantity * 0.9).toFixed(2)} today!
          </p>
          <Button variant="link" className="p-0 h-auto text-[10px] text-blue-600 font-bold  tracking-tighter">
            Share with friends for a $20 Coupon 🎁
          </Button>
        </div>,
        { duration: 6000 }
      );

      // Log notification for order email (simulated)
      await addDoc(collection(db, 'notifications'), {
        type: 'order_notification',
        orderId: orderRef.id,
        userId: user.uid,
        email: user.email,
        status: 'pending',
        createdAt: serverTimestamp(),
      });

      // Send real emails via local API
      try {
        await fetch(`${API_URL}/api/send-order-confirmation`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            email: user.email, 
            orderId: orderRef.id,
            productName: product.name,
            totalAmount: totalAmount.toFixed(2),
            shippingAddress: {
              address: deliveryAddress,
              city: deliveryCity,
              zipCode: deliveryZip
            },
            name: user.displayName
          }),
        });
      } catch (emailErr) {
        console.error('Order emails failed:', emailErr);
      }

      // Add Shopsy Coins (Loyalty Points)
      try {
        const pointsToEarn = Math.floor(totalAmount);
        await updateDoc(doc(db, 'users', user.uid), {
          points: (profile?.points || 0) + pointsToEarn,
          updatedAt: serverTimestamp(),
        });
      } catch (pointErr) {
        console.error('Failed to add points:', pointErr);
      }

      setSelectedProduct(null);
      setCheckoutStep('details');
      setSelectedPaymentMethod(null);
      setManualCardNumber("");
      setManualExpiry("");
      setManualCVC("");
      setManualName("");
      setSaveCard(false);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsOrdering(false);
    }
  };

  return (
    <section className="py-12 bg-[#f5f5f5]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <AnimatePresence>
          {recentBoughVisible && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="mb-6 bg-gradient-to-r from-purple-600 to-purple-500 p-[1px] rounded-2xl shadow-lg shadow-purple-100 overflow-hidden"
            >
              <div className="bg-white p-4 rounded-[15px] flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="bg-green-100 rounded-full p-2">
                    <Truck className="h-5 w-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-800">
                      <span className="text-purple-600 font-black">VIVO PRICE ALERT:</span> 124 people bought this in the last hour!
                    </p>
                    <p className="text-[10px] text-gray-500 font-medium">Free express shipping available for your area <span className="font-bold underline cursor-pointer">Check Zip</span></p>
                  </div>
                </div>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8 text-gray-400 hover:text-purple-600 hover:bg-green-50"
                  onClick={() => setRecentBoughVisible(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4 bg-white p-4 md:p-5 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="bg-purple-600 p-2 md:p-2.5 rounded-xl shadow-lg shadow-purple-100">
              <Zap className="h-4 w-4 md:h-5 md:w-5 text-white fill-white" />
            </div>
            <div>
              <h2 className="text-lg md:text-2xl font-black text-black  tracking-tighter leading-none">{title} <span className="text-purple-600 italic">{subtitle}</span></h2>
              <p className="text-[9px] md:text-[10px] font-bold text-gray-400  tracking-widest mt-1">{filteredProducts.length} Products Found</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            {/* Collapsible Filter Panel (Sheet) */}
            <Sheet>
              <SheetTrigger
                render={(props) => (
                  <button
                    {...props}
                    className={cn(
                      "inline-flex items-center justify-center gap-2 border-2 rounded-xl h-11 px-4 text-sm font-bold transition-all bg-white hover:bg-muted hover:text-foreground border-gray-100 hover:border-purple-200",
                      activeFiltersCount > 0 && "bg-green-50 border-purple-500 text-purple-600"
                    )}
                  >
                    <SlidersHorizontal className="h-4 w-4" />
                    Filter Options
                    {activeFiltersCount > 0 && (
                      <span className="ml-1 bg-purple-600 text-white h-5 w-5 p-0 flex items-center justify-center rounded-full text-[10px]">
                        {activeFiltersCount}
                      </span>
                    )}
                  </button>
                )}
              />
              <SheetContent className="w-[300px] sm:w-[400px] rounded-l-3xl border-none">
                <SheetHeader className="pb-6 border-b border-gray-100">
                  <SheetTitle className="text-2xl font-black  italic tracking-tighter">
                    Filter <span className="text-purple-600">Products</span>
                  </SheetTitle>
                  <SheetDescription className="font-medium">
                    Refine your search to find the best deals.
                  </SheetDescription>
                </SheetHeader>

                <div className="py-8 space-y-8">
                  {/* Category Filter */}
                  <div className="space-y-3">
                    <label className="text-xs font-black  tracking-widest text-gray-400 flex items-center gap-2">
                      <Filter className="h-3 w-3" /> Category
                    </label>
                    <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                      <SelectTrigger className="bg-gray-50 border-none shadow-none h-12 font-bold rounded-xl">
                        <SelectValue placeholder="Select Category" />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl">
                        {categories.map(cat => (
                          <SelectItem key={cat} value={cat} className="capitalize font-medium">
                            {cat === "all" ? "All Categories" : cat}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Price Range Filter */}
                  <div className="space-y-5">
                    <div className="flex justify-between items-center">
                      <label className="text-xs font-black  tracking-widest text-gray-400">Price Range</label>
                      <span className="text-sm font-black text-purple-600 bg-green-50 px-3 py-1 rounded-full">${priceRange[0]} - ${priceRange[1]}</span>
                    </div>
                    <Slider 
                      value={priceRange} 
                      max={200} 
                      step={1} 
                      onValueChange={setPriceRange}
                      className="py-4"
                    />
                  </div>

                  {/* Rating Filter */}
                  <div className="space-y-3">
                    <label className="text-xs font-black  tracking-widest text-gray-400">Minimum Rating</label>
                    <Select value={minRating} onValueChange={setMinRating}>
                      <SelectTrigger className="bg-gray-50 border-none shadow-none h-12 font-bold rounded-xl">
                        <SelectValue placeholder="Select Rating" />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl">
                        <SelectItem value="0" className="font-medium">All Ratings</SelectItem>
                        <SelectItem value="3" className="font-medium">3+ Stars</SelectItem>
                        <SelectItem value="4" className="font-medium">4+ Stars</SelectItem>
                        <SelectItem value="4.5" className="font-medium">4.5+ Stars</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <SheetFooter className="mt-auto pt-6 border-t border-gray-100 flex-col gap-3">
                  <Button 
                    variant="outline" 
                    onClick={resetFilters}
                    className="w-full h-12 text-gray-400 hover:text-purple-600 gap-2 font-black  tracking-tighter rounded-xl border-2"
                  >
                    <X className="h-4 w-4" />
                    Reset All Filters
                  </Button>
                </SheetFooter>
              </SheetContent>
            </Sheet>

            <div className="hidden sm:flex gap-1">
              <Button variant="ghost" size="icon" className="rounded-xl h-11 w-11 hover:bg-green-50 hover:text-purple-600 border border-transparent hover:border-green-100">
                <ChevronLeft className="h-5 w-5" />
              </Button>
              <Button variant="ghost" size="icon" className="rounded-xl h-11 w-11 hover:bg-green-50 hover:text-purple-600 border border-transparent hover:border-green-100">
                <ChevronRight className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>

        {/* Rating Quick Filter */}
        <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-2 scrollbar-hide no-scrollbar">
          <span className="text-[10px] font-black  text-gray-400 tracking-widest whitespace-nowrap mr-2 flex items-center gap-1.5">
            <Star className="h-3 w-3" /> Min Rating:
          </span>
          {[
            { label: "All Ratings", value: "0" },
            { label: "3+ Stars", value: "3" },
            { label: "4+ Stars", value: "4" },
            { label: "4.5+ Stars", value: "4.5" }
          ].map((rating) => (
            <Button
              key={rating.value}
              variant={minRating === rating.value ? "default" : "outline"}
              size="sm"
              onClick={() => setMinRating(rating.value)}
              className={`rounded-full px-4 h-8 text-[11px] font-black  tracking-tighter transition-all border-2 flex-shrink-0 ${
                minRating === rating.value 
                  ? "bg-purple-600 border-purple-600 text-white shadow-lg shadow-purple-100"
                  : "bg-white border-gray-100 text-gray-400 hover:border-purple-200 hover:text-purple-600"
              }`}
            >
              {rating.value !== "0" && (
                <Star className={`h-3 w-3 mr-1.5 ${minRating === rating.value ? "fill-white text-white" : "fill-purple-500 text-purple-500"}`} />
              )}
              {rating.label}
            </Button>
          ))}
        </div>

        {/* Active Filters Display */}
        {activeFiltersCount > 0 && (
          <div className="flex flex-wrap gap-2 mb-6">
            {selectedCategory !== "all" && (
              <Badge variant="secondary" className="bg-white border border-green-200 text-purple-600 font-bold px-3 py-1.5 rounded-full flex items-center gap-2">
                Category: {selectedCategory}
                <X className="h-3 w-3 cursor-pointer" onClick={() => setSelectedCategory("all")} />
              </Badge>
            )}
            {(priceRange[0] !== 0 || priceRange[1] !== 200) && (
              <Badge variant="secondary" className="bg-white border border-green-200 text-purple-600 font-bold px-3 py-1.5 rounded-full flex items-center gap-2">
                Price: ${priceRange[0]}-${priceRange[1]}
                <X className="h-3 w-3 cursor-pointer" onClick={() => setPriceRange([0, 200])} />
              </Badge>
            )}
            {minRating !== "0" && (
              <Badge variant="secondary" className="bg-white border border-green-200 text-purple-600 font-bold px-3 py-1.5 rounded-full flex items-center gap-2">
                Rating: {minRating}+ Stars
                <X className="h-3 w-3 cursor-pointer" onClick={() => setMinRating("0")} />
              </Badge>
            )}
            <Button variant="ghost" size="sm" onClick={resetFilters} className="text-[10px] font-black  text-gray-400 hover:text-purple-600">
              Clear All
            </Button>
          </div>
        )}

        {/* Product Grid */}
        {filteredProducts.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3 md:gap-4">
            <AnimatePresence mode="popLayout">
              {filteredProducts.map((product) => (
                <motion.div 
                  key={product.id}
                  layout
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="group bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all cursor-pointer border border-transparent hover:border-purple-200"
                  onClick={() => setSelectedProduct(product)}
                >
                  <div className="relative aspect-square bg-gray-50 overflow-hidden">
                    {product.tag && (
                      <div className="absolute top-0 left-0 bg-purple-600 text-white text-[11px] font-black px-2 py-1 rounded-br-lg z-10 flex items-center gap-1">
                        <Zap className="h-3 w-3 fill-white" />
                        {product.tag}
                      </div>
                    )}
                      <div className="absolute top-0 right-0 bg-yellow-400 text-black text-[9px] font-black px-2 py-1 rounded-bl-lg z-10 animate-pulse">
                        Price drop
                      </div>
                      <div className="absolute bottom-2 left-2 flex flex-col gap-1 z-20">
                        <div className="bg-blue-600 text-white text-[8px] font-black px-2 py-0.5 rounded-full shadow-lg flex items-center gap-1">
                          <BadgeCheck className="h-2 w-2" />
                          Shopsy express
                        </div>
                        <div className="bg-green-600 text-white text-[8px] font-black px-2 py-0.5 rounded-full shadow-lg flex items-center gap-1">
                          <CheckCircle2 className="h-2 w-2" />
                          Quality verified
                        </div>
                      </div>
                    <div className="absolute top-2 right-2 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-20">
                      <Button 
                        size="icon" 
                        variant="secondary" 
                        className="rounded-full h-8 w-8 shadow-md bg-white/90 hover:bg-purple-600 hover:text-white"
                        onClick={(e) => {
                          e.stopPropagation();
                          onAddToWishlist?.();
                          toast.success("Added to Wishlist");
                        }}
                      >
                        <Heart className="h-4 w-4" />
                      </Button>
                      <Button 
                        size="icon" 
                        variant="secondary" 
                        className="rounded-full h-8 w-8 shadow-md bg-white/90 hover:bg-purple-600 hover:text-white"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleAddToCart(product);
                        }}
                      >
                        <ShoppingCart className="h-4 w-4" />
                      </Button>
                      <Button 
                        size="icon" 
                        variant="secondary" 
                        className="rounded-full h-8 w-8 shadow-md bg-white/90 hover:bg-purple-600 hover:text-white"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedProduct(product);
                        }}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </div>

                    {/* Quick View Overlay */}
                    <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center z-10">
                      <Button 
                        variant="secondary" 
                        className="bg-white/95 hover:bg-purple-600 hover:text-white font-black text-[10px]  tracking-tighter rounded-full px-6 h-9 shadow-xl transform translate-y-4 group-hover:translate-y-0 transition-all duration-300"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedProduct(product);
                        }}
                      >
                        Quick View
                      </Button>
                    </div>

                    <img 
                      src={product.image} 
                      alt={product.name} 
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
                      loading="lazy"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1560393464-5c69a73c5770?q=80&w=500&auto=format&fit=crop';
                      }}
                    />
                  </div>

                  <div className="p-2 md:p-3">
                    <h3 className="text-[10px] md:text-xs font-medium text-gray-800 line-clamp-2 h-7 md:h-8 mb-1 md:mb-2 group-hover:text-purple-600 transition-colors">{product.name}</h3>
                    
                    <div className="flex items-baseline gap-1 md:gap-1.5 mb-1">
                      <span className="text-sm md:text-lg font-black text-purple-600 leading-none">{formatPrice(product.price)}</span>
                      {product.oldPrice && (
                        <span className="text-[9px] md:text-[11px] text-gray-400 line-through">{formatPrice(product.oldPrice)}</span>
                      )}
                    </div>

                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-0.5">
                        <Star className="h-2.5 w-2.5 md:h-3 md:w-3 fill-purple-500 text-purple-500" />
                        <span className="text-[9px] md:text-[11px] font-bold text-gray-700">{product.rating}</span>
                      </div>
                      {product.sold && (
                        <span className="text-[9px] md:text-[10px] font-bold text-gray-400">{product.sold} sold</span>
                      )}
                    </div>
                    
                      <div className="flex items-center justify-between mb-3 bg-gray-50 rounded-lg p-1">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-7 w-7 rounded-md hover:bg-white hover:text-purple-600 transition-colors"
                          onClick={(e) => {
                            e.stopPropagation();
                            setProductQuantities(prev => ({
                              ...prev,
                              [product.id]: Math.max(1, (prev[product.id] || 1) - 1)
                            }));
                          }}
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        <span className="text-xs font-black w-8 text-center">{productQuantities[product.id] || 1}</span>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-7 w-7 rounded-md hover:bg-white hover:text-purple-600 transition-colors"
                          onClick={(e) => {
                            e.stopPropagation();
                            setProductQuantities(prev => ({
                              ...prev,
                              [product.id]: (prev[product.id] || 1) + 1
                            }));
                          }}
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>
                        <Button
                          className="w-full h-8 bg-purple-600 text-white hover:bg-purple-700 border-none text-[11px] font-black rounded-lg transition-colors shadow-sm gap-2"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleAddToCart(product, productQuantities[product.id] || 1);
                          }}
                        >
                          <ShoppingCart className="h-3.5 w-3.5" />
                          Add to cart
                        </Button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        ) : (
          <div className="py-20 text-center bg-white rounded-2xl shadow-sm">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gray-50 mb-6">
              <Filter className="h-10 w-10 text-gray-200" />
            </div>
            <h3 className="text-xl font-black  tracking-tighter mb-2">No results found</h3>
            <p className="text-gray-400 mb-8 font-medium">Try adjusting your filters or search terms.</p>
            <Button onClick={resetFilters} variant="outline" className="rounded-full px-8 border-2 border-purple-600 text-purple-600 font-black hover:bg-purple-600 hover:text-white">
              Clear all filters
            </Button>
          </div>
        )}

        {/* Product Detail Modal */}
        <Dialog 
          open={!!selectedProduct} 
          onOpenChange={(open) => {
            if (!open) {
              setSelectedProduct(null);
              setCheckoutStep('details');
            }
          }}
        >
          <DialogContent className="max-w-4xl p-0 overflow-hidden rounded-3xl border-none">
            {selectedProduct && (
              <div className="flex flex-col md:flex-row min-h-[500px]">
                <div className="md:w-2/5 bg-gray-50 relative">
                  <img 
                    src={selectedProduct.image} 
                    alt={selectedProduct.name} 
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1560393464-5c69a73c5770?q=80&w=500&auto=format&fit=crop';
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                </div>
                <div className="md:w-3/5 p-8 flex flex-col">
                  {checkoutStep === 'details' ? (
                    <Tabs defaultValue="overview" className="flex flex-col h-full">
                      <TabsList className="grid w-full grid-cols-2 mb-6 bg-gray-100/50 rounded-2xl p-1">
                        <TabsTrigger 
                          value="overview" 
                          className="rounded-xl font-black text-[10px]  tracking-[0.2em] data-[state=active]:bg-white data-[state=active]:text-purple-600 data-[state=active]:shadow-sm transition-all"
                        >
                          Overview
                        </TabsTrigger>
                        <TabsTrigger 
                          value="reviews" 
                          className="rounded-xl font-black text-[10px]  tracking-[0.2em] data-[state=active]:bg-white data-[state=active]:text-purple-600 data-[state=active]:shadow-sm transition-all flex items-center gap-1.5"
                        >
                          <Sparkles className="h-3 w-3" />
                          Reviews ({selectedProduct.reviews})
                        </TabsTrigger>
                      </TabsList>

                      <TabsContent value="overview" className="flex-1 flex flex-col mt-0 focus-visible:outline-none">
                        <ScrollArea className="flex-1 pr-4 -mr-4">
                          <DialogHeader className="mb-6">
                            <div className="flex items-center gap-2 mb-2">
                              <Badge className="bg-purple-600 text-white border-none">{selectedProduct.category}</Badge>
                              {selectedProduct.tag && <Badge variant="outline" className="border-purple-600 text-purple-600">{selectedProduct.tag} OFF</Badge>}
                            </div>
                            <DialogTitle className="text-3xl font-black leading-tight mb-2">{selectedProduct.name}</DialogTitle>
                            <div className="flex items-center gap-4">
                              <div className="flex items-center gap-1">
                                {[...Array(5)].map((_, i) => (
                                  <Star key={i} className={`h-4 w-4 ${i < Math.floor(selectedProduct.rating) ? "fill-purple-500 text-purple-500" : "text-gray-200"}`} />
                                ))}
                                <span className="text-sm font-bold ml-1">{selectedProduct.rating}</span>
                              </div>
                              <span className="text-sm text-gray-400 font-medium">{selectedProduct.reviews} Verified Reviews</span>
                            </div>
                          </DialogHeader>
                          
                          <div className="flex items-baseline gap-3 mb-8">
                            <span className="text-5xl font-black text-purple-600">{formatPrice(selectedProduct.price)}</span>
                            {selectedProduct.oldPrice && (
                              <span className="text-xl text-gray-400 line-through font-medium">{formatPrice(selectedProduct.oldPrice)}</span>
                            )}
                          </div>

                          <DialogDescription className="text-gray-600 mb-6 leading-relaxed font-medium text-base">
                            {selectedProduct.description || `Experience premium quality with our ${selectedProduct.name}. This top-rated product from our ${selectedProduct.category} collection is designed for performance and style. Limited stock available at this flash sale price!`}
                          </DialogDescription>

                          {selectedProduct.prescription && (
                            <div className="bg-blue-50 border-2 border-blue-100 p-6 rounded-[32px] mb-8 relative overflow-hidden group">
                               <div className="relative z-10">
                                  <div className="flex items-center gap-2 mb-3">
                                     <div className="bg-blue-600 p-1.5 rounded-lg text-white">
                                        <AlertCircle className="h-4 w-4" />
                                     </div>
                                     <h4 className="text-sm font-black  tracking-tighter text-blue-900 italic">Special <span className="text-blue-600">Instructions</span></h4>
                                  </div>
                                  <p className="text-xs font-bold text-blue-800 leading-relaxed whitespace-pre-wrap">
                                     {selectedProduct.prescription}
                                  </p>
                               </div>
                               <FileText className="absolute right-[-10px] top-[-10px] h-24 w-24 text-blue-600/5 rotate-12 transition-transform group-hover:scale-110" />
                            </div>
                          )}

                          <div className="grid grid-cols-2 gap-4 mb-8">
                            <div className="bg-gray-50 p-4 rounded-3xl border border-gray-100">
                              <p className="text-[10px] font-black text-gray-400  tracking-widest mb-1 flex items-center gap-2">
                                <ShieldCheck className="h-3 w-3 text-green-500" /> Vivo Assurance
                              </p>
                              <p className="text-xs font-bold">100% Original Guaranteed</p>
                            </div>
                            <div className="bg-gray-50 p-4 rounded-3xl border border-gray-100">
                              <p className="text-[10px] font-black text-gray-400  tracking-widest mb-1 flex items-center gap-2">
                                <Clock className="h-3 w-3 text-purple-500" /> Shopsy Express
                              </p>
                              <p className="text-xs font-bold">Delivery by tomorrow</p>
                            </div>
                          </div>

                          <div className="space-y-6 mb-8">
                            <div className="bg-white p-6 rounded-3xl border-2 border-gray-100">
                              <h4 className="text-sm font-black  tracking-[0.2em] mb-4 flex items-center gap-2">
                                <Info className="h-4 w-4 text-purple-600" /> Apple Style Specs
                              </h4>
                              <div className="space-y-3">
                                <div className="flex justify-between items-center py-2 border-b border-gray-50 text-[11px]">
                                  <span className="text-gray-400 font-bold  tracking-tight">Dimensions</span>
                                  <span className="font-black">15.5 x 7.2 x 0.8 cm</span>
                                </div>
                                <div className="flex justify-between items-center py-2 border-b border-gray-50 text-[11px]">
                                  <span className="text-gray-400 font-bold  tracking-tight">Weight</span>
                                  <span className="font-black">187g</span>
                                </div>
                                <div className="flex justify-between items-center py-2 border-b border-gray-50 text-[11px]">
                                  <span className="text-gray-400 font-bold  tracking-tight">Materials</span>
                                  <span className="font-black">Aerospace-grade Aluminum</span>
                                </div>
                                <div className="flex justify-between items-center py-2 text-[11px]">
                                  <span className="text-gray-400 font-bold  tracking-tight">Box Includes</span>
                                  <span className="font-black">Device, USB-C Cable</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </ScrollArea>
                      </TabsContent>

                      <TabsContent value="reviews" className="flex-1 flex flex-col mt-0 focus-visible:outline-none overflow-hidden">
                        <ScrollArea className="flex-1 pr-4 -mr-4">
                          <div className="space-y-8 pb-4">
                            <div className="bg-gradient-to-br from-green-50 to-white p-8 rounded-[32px] border-2 border-green-100 shadow-sm">
                              <div className="flex items-center gap-3 mb-6">
                                <div className="bg-purple-600 p-2 rounded-xl text-white">
                                  <Edit className="h-5 w-5" />
                                </div>
                                <h4 className="text-xl font-black  tracking-tighter italic">Write a <span className="text-purple-600">Review</span></h4>
                              </div>
                              
                              <div className="space-y-6">
                                <div className="space-y-3">
                                  <Label className="text-[10px] font-black  tracking-widest text-gray-400">How would you rate it?</Label>
                                  <div className="flex gap-2">
                                    {[1, 2, 3, 4, 5].map((star) => (
                                      <button
                                        key={star}
                                        onClick={() => setNewReviewRating(star)}
                                        className="transition-all active:scale-75 hover:scale-110"
                                      >
                                        <Star className={`h-10 w-10 ${star <= newReviewRating ? "fill-purple-500 text-purple-500" : "text-gray-200"}`} />
                                      </button>
                                    ))}
                                  </div>
                                </div>
                                <div className="space-y-2">
                                  <Label className="text-[10px] font-black  tracking-widest text-gray-400">Share your experience</Label>
                                  <textarea
                                    value={newReviewComment}
                                    onChange={(e) => setNewReviewComment(e.target.value)}
                                    placeholder="What did you like? How was the delivery?"
                                    className="w-full min-h-[120px] p-5 rounded-3xl border-2 border-gray-100 focus:border-purple-500 focus:outline-none transition-all resize-none text-sm font-medium bg-white/50 backdrop-blur-sm"
                                  />
                                </div>
                                <Button 
                                  onClick={handleSubmitReview}
                                  disabled={isSubmittingReview}
                                  className="w-full bg-black hover:bg-zinc-800 text-white font-black  tracking-widest text-xs h-14 rounded-2xl shadow-xl shadow-zinc-200"
                                >
                                  {isSubmittingReview ? "Submitting..." : (user ? "Post verified review" : "Login to review")}
                                </Button>
                              </div>
                            </div>

                            <div className="space-y-6 px-2">
                              <div className="flex items-center justify-between border-b-2 border-gray-100 pb-4">
                                <h4 className="text-base font-black  tracking-tighter italic flex items-center gap-2">
                                  <Sparkles className="h-5 w-5 text-purple-600" /> What <span className="text-purple-600">AI</span> Thinks
                                </h4>
                                <Badge className="bg-green-100 text-purple-600 font-black border-none text-[9px] ">BETA</Badge>
                              </div>
                              <AIReviewSummarizer reviews={reviews} productName={selectedProduct.name} />

                              <div className="flex items-center justify-between mt-8 border-b-2 border-gray-100 pb-4">
                                <h4 className="text-sm font-black  tracking-widest text-gray-400">Community Gallery</h4>
                                <span className="text-[10px] font-black text-purple-600  tracking-widest">{reviews.length} total reviews</span>
                              </div>

                              {reviews.length > 0 ? (
                                <div className="grid grid-cols-1 gap-4">
                                  {reviews.map((review) => (
                                    <div key={review.id} className="p-6 rounded-[24px] border-2 border-gray-50 bg-white hover:border-green-100 transition-all shadow-sm hover:shadow-md">
                                      <div className="flex justify-between items-start mb-4">
                                        <div className="flex items-center gap-4">
                                          <div className="w-12 h-12 rounded-2xl bg-purple-600 flex items-center justify-center text-white font-black shadow-lg shadow-purple-100">
                                            {review.userName.charAt(0)}
                                          </div>
                                          <div>
                                            <div className="flex items-center gap-2">
                                              <p className="text-sm font-black  tracking-tight">{review.userName}</p>
                                              <Badge className="bg-green-100 text-green-700 border-none font-black text-[8px]  px-1.5 flex items-center gap-1">
                                                <BadgeCheck className="h-3 w-3" /> VERIFIED BUYER
                                              </Badge>
                                            </div>
                                            <div className="flex gap-0.5 mt-1">
                                              {[...Array(5)].map((_, i) => (
                                                <Star key={i} className={`h-3 w-3 ${i < review.rating ? "fill-purple-500 text-purple-500" : "text-gray-100"}`} />
                                              ))}
                                            </div>
                                          </div>
                                        </div>
                                        <span className="text-[10px] text-gray-400 font-bold  italic mt-1">
                                          {review.createdAt?.toDate().toLocaleDateString(undefined, { day: 'numeric', month: 'short' }) || "Just now"}
                                        </span>
                                      </div>
                                      <p className="text-sm text-gray-700 font-medium leading-relaxed bg-gray-50/50 p-4 rounded-xl border border-gray-50 italic">
                                        "{review.comment}"
                                      </p>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <div className="text-center py-20 bg-gray-50/50 rounded-[40px] border-4 border-dashed border-gray-100">
                                  <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm">
                                    <User className="h-10 w-10 text-gray-200" />
                                  </div>
                                  <p className="text-gray-400 font-black  tracking-[0.2em] text-xs">No reviews match your criteria yet.</p>
                                  <Button
                            variant="link"
                            className="text-purple-600 mt-4 font-black  text-[10px] tracking-widest"
                          >
                            Be the first to review
                          </Button>
                                </div>
                              )}
                            </div>
                          </div>
                        </ScrollArea>
                      </TabsContent>

                      <div className="mt-8 pt-6 border-t border-gray-100 space-y-4 bg-white">
                        <div className="flex items-center gap-4 mb-2">
                          <div className="flex items-center bg-gray-50 rounded-xl p-1 border border-green-100">
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-10 w-10 rounded-lg hover:bg-white hover:text-purple-600 transition-all"
                              onClick={() => setProductQuantities(prev => ({
                                ...prev,
                                [selectedProduct.id]: Math.max(1, (prev[selectedProduct.id] || 1) - 1)
                              }))}
                            >
                              <Minus className="h-4 w-4" />
                            </Button>
                            <span className="text-lg font-black w-12 text-center text-purple-600">{productQuantities[selectedProduct.id] || 1}</span>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-10 w-10 rounded-lg hover:bg-white hover:text-purple-600 transition-all"
                              onClick={() => setProductQuantities(prev => ({
                                ...prev,
                                [selectedProduct.id]: (prev[selectedProduct.id] || 1) + 1
                              }))}
                            >
                              <Plus className="h-4 w-4" />
                            </Button>
                          </div>
                          <p className="text-[10px] font-black text-gray-400  tracking-[0.2em]">Adjust Quantity</p>
                        </div>
                        <div className="flex gap-4">
                          <Button 
                            className="flex-1 h-16 bg-purple-600 hover:bg-purple-700 text-white font-black text-xl rounded-2xl shadow-lg shadow-purple-200 transition-all active:scale-95"
                            onClick={() => handlePlaceOrder(selectedProduct)}
                          >
                            Buy now
                          </Button>
                          <Button 
                            variant="secondary"
                            className="flex-1 h-16 bg-white border-2 border-purple-600 text-purple-600 hover:bg-green-50 font-black text-xl rounded-2xl transition-all active:scale-95"
                            onClick={() => handleAddToCart(selectedProduct, productQuantities[selectedProduct.id] || 1)}
                          >
                            Add to cart
                          </Button>
                        </div>
                        <div className="flex gap-4">
                          <Button 
                            variant="outline" 
                            className="flex-1 h-12 rounded-xl border-2 font-bold hover:bg-green-50 hover:text-purple-600 transition-all text-gray-700"
                            onClick={() => {
                              onAddToWishlist?.();
                              toast.success("Added to Wishlist");
                            }}
                          >
                            <Heart className="h-5 w-5 mr-2" /> Wishlist
                          </Button>
                          <Button variant="outline" className="flex-1 h-12 rounded-xl border-2 font-bold hover:bg-green-50 hover:text-purple-600 transition-all  tracking-tighter">
                            Share
                          </Button>
                        </div>
                      </div>

                      {/* Related Products Section */}
                      <div className="mt-12 pt-10 border-t border-gray-100">
                        <div className="flex items-center justify-between mb-8">
                          <div>
                            <h3 className="text-2xl font-black  tracking-tighter italic">Recommended for <span className="text-purple-600">You</span></h3>
                            <p className="text-[10px] font-black text-gray-400  tracking-widest mt-1">Customers who viewed this also bought</p>
                          </div>
                          <Badge className="bg-green-100 text-purple-600 border-none font-bold text-[10px] ">TOP PICKS</Badge>
                        </div>
                        <div className="grid grid-cols-2 gap-6 mb-10">
                          {products
                            .filter(p => p.category === selectedProduct.category && p.id !== selectedProduct.id)
                            .slice(0, 4)
                            .map((relatedP) => (
                              <div 
                                key={relatedP.id} 
                                className="group cursor-pointer bg-white rounded-3xl p-3 border-2 border-transparent hover:border-purple-500 transition-all hover:shadow-xl hover:shadow-purple-100"
                                onClick={() => {
                                  setSelectedProduct(relatedP);
                                  // Scroll top of the dialog
                                  const scrollArea = document.querySelector('[role="dialog"] [data-radix-scroll-area-viewport]');
                                  if (scrollArea) scrollArea.scrollTo({ top: 0, behavior: 'smooth' });
                                }}
                              >
                                <div className="aspect-square rounded-[20px] overflow-hidden bg-gray-50 mb-4 relative">
                                  <img 
                                    src={relatedP.image} 
                                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" 
                                    onError={(e) => {
                                      (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1560393464-5c69a73c5770?q=80&w=500&auto=format&fit=crop';
                                    }}
                                  />
                                  <div className="absolute top-2 right-2 bg-white/80 backdrop-blur-md p-2 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity">
                                    <ShoppingBag className="h-4 w-4 text-purple-600" />
                                  </div>
                                </div>
                                <div className="px-1">
                                  <p className="text-[9px] font-black text-gray-400  tracking-widest mb-1">{relatedP.tag || 'New Arrival'}</p>
                                  <h4 className="font-bold text-sm truncate mb-2 leading-tight">{relatedP.name}</h4>
                                  <div className="flex items-center justify-between">
                                    <p className="font-black text-purple-600 text-lg">{formatPrice(relatedP.price)}</p>
                                    <div className="flex items-center gap-1">
                                      <Star className="h-3 w-3 fill-purple-500 text-purple-500" />
                                      <span className="text-[10px] font-bold text-gray-400">{relatedP.rating || '5.0'}</span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ))}
                        </div>
                        {products.filter(p => p.category === selectedProduct.category && p.id !== selectedProduct.id).length === 0 && (
                          <div className="bg-gray-50 rounded-[32px] p-8 text-center border-2 border-dashed border-gray-100 opacity-60">
                             <Package className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                             <p className="text-[10px] font-black text-gray-400  tracking-widest leading-relaxed">Checking more items in {selectedProduct.category} category...</p>
                          </div>
                        )}
                      </div>
                    </Tabs>
                  ) : (
                    <div className="flex flex-col h-full">
                      <div className="flex items-center gap-2 mb-6">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => {
                            if (checkoutStep === 'address') setCheckoutStep('details');
                            if (checkoutStep === 'payment') setCheckoutStep('address');
                          }}
                          className="rounded-full hover:bg-gray-100"
                        >
                          <ChevronLeft className="h-5 w-5" />
                        </Button>
                        <DialogTitle className="text-2xl font-black  tracking-tighter">
                          {checkoutStep === 'address' ? 'Delivery' : 'Complete'} <span className="text-purple-600">{checkoutStep === 'address' ? 'Details' : 'Purchase'}</span>
                        </DialogTitle>
                      </div>

                      <div className="space-y-6 flex-1">
                        <div className="bg-green-50 p-4 rounded-2xl flex items-center justify-between border border-green-100">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-lg bg-white p-1">
                              <img
                                src={selectedProduct.image}
                                alt=""
                                className="w-full h-full object-cover rounded"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1560393464-5c69a73c5770?q=80&w=500&auto=format&fit=crop';
                                }}
                              />
                            </div>
                            <div>
                              <p className="text-sm font-bold truncate max-w-[150px]">{selectedProduct.name}</p>
                              <p className="text-xs text-gray-500">Qty: {productQuantities[selectedProduct.id] || 1}</p>
                            </div>
                          </div>
                          <p className="text-lg font-black text-purple-600">
                            {formatPrice((typeof selectedProduct.price === 'number' ? selectedProduct.price : parseFloat(selectedProduct.price.toString().replace(/[^\d.]/g, ''))) * (productQuantities[selectedProduct.id] || 1))}
                          </p>
                        </div>

                        {checkoutStep === 'address' ? (
                          <div className="space-y-4">
                            <div className="flex items-center justify-between">
                              <h4 className="text-sm font-black  tracking-widest text-gray-400">Shipping Address</h4>
                            </div>
                            <div className="space-y-4 p-5 bg-white border-2 border-green-100 rounded-3xl shadow-sm">
                              <div className="space-y-2">
                                <Label htmlFor="delivery-address" className="text-[10px] font-black  tracking-widest text-gray-400">Street Address</Label>
                                <div className="relative">
                                  <Input 
                                    id="delivery-address"
                                    placeholder="House number and street name"
                                    value={deliveryAddress}
                                    onChange={(e) => setDeliveryAddress(e.target.value)}
                                    className="rounded-xl border-gray-100 focus:border-purple-500 bg-gray-50/30 pl-10"
                                  />
                                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                </div>
                              </div>
                              <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                  <Label htmlFor="delivery-city" className="text-[10px] font-black  tracking-widest text-gray-400">City</Label>
                                  <div className="relative">
                                    <Input 
                                      id="delivery-city"
                                      placeholder="City"
                                      value={deliveryCity}
                                      onChange={(e) => setDeliveryCity(e.target.value)}
                                      className="rounded-xl border-gray-100 focus:border-purple-500 bg-gray-50/30 pl-10"
                                    />
                                    <Building className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                  </div>
                                </div>
                                <div className="space-y-2">
                                  <Label htmlFor="delivery-zip" className="text-[10px] font-black  tracking-widest text-gray-400">ZIP Code</Label>
                                  <div className="relative">
                                    <Input 
                                      id="delivery-zip"
                                      placeholder="12345"
                                      value={deliveryZip}
                                      onChange={(e) => setDeliveryZip(e.target.value.replace(/\D/g, '').slice(0, 10))}
                                      className="rounded-xl border-gray-100 focus:border-purple-500 bg-gray-50/30 pl-10"
                                    />
                                    <Home className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-4">
                            <div className="flex items-center justify-between">
                              <h4 className="text-sm font-black  tracking-widest text-gray-400">Payment Method</h4>
                              <div className="flex gap-4">
                                <Button 
                                  variant="link" 
                                  className="text-purple-600 font-bold p-0 h-auto text-xs"
                                  onClick={() => {
                                    setSelectedProduct(null);
                                    setCheckoutStep('details');
                                    toast.info("Opening Profile Settings...");
                                    // This would open the AuthModal in Profile tab
                                  }}
                                >
                                  Manage Cards
                                </Button>
                              </div>
                            </div>

                          <div className="space-y-4">
                            <div className="flex bg-gray-100 rounded-xl p-1 mb-6">
                              {(['card', 'momo', 'bank', 'pod'] as const).map((type) => (
                                <Button
                                  key={type}
                                  variant="ghost"
                                  onClick={() => {
                                    setPaymentType(type);
                                    setSelectedPaymentMethod(null);
                                  }}
                                  className={`flex-1 rounded-lg font-black text-[9px]  tracking-tighter h-9 px-1 ${
                                    paymentType === type ? 'bg-white text-purple-600 shadow-sm' : 'text-gray-400'
                                  }`}
                                >
                                  {type === 'card' ? 'Card' : type === 'momo' ? 'MoMo' : type === 'bank' ? 'Transfer' : 'POD'}
                                </Button>
                              ))}
                            </div>

                            {paymentType === 'card' ? (
                            <RadioGroup 
                              value={selectedPaymentMethod?.id} 
                              onValueChange={(val) => {
                                if (val === 'manual') {
                                  setSelectedPaymentMethod({ id: 'manual' });
                                } else {
                                  const method = userPaymentMethods.find(m => m.id === val);
                                  if (method) setSelectedPaymentMethod(method);
                                }
                              }}
                              className="gap-3"
                            >
                              {/* Saved Cards List */}
                              {userPaymentMethods.map((method) => (
                                <div 
                                  key={method.id}
                                  className={`relative flex items-center p-4 rounded-2xl border-2 transition-all cursor-pointer bg-white ${
                                    selectedPaymentMethod?.id === method.id 
                                      ? 'border-purple-500 bg-green-50/30'
                                      : 'border-gray-50 hover:border-gray-200'
                                  }`}
                                  onClick={() => setSelectedPaymentMethod(method)}
                                >
                                  <RadioGroupItem value={method.id} id={method.id} className="sr-only" />
                                  <div className="flex items-center gap-3 w-full">
                                    <div className={`p-2 rounded-lg ${method.brand === 'Visa' ? 'bg-blue-50 text-blue-600' : 'bg-red-50 text-red-600'}`}>
                                      <CreditCard className="h-5 w-5" />
                                    </div>
                                    <div className="flex-1">
                                      <p className="font-bold text-sm">{method.brand} ending in {method.last4}</p>
                                      <p className="text-[10px] text-gray-400  font-black">Expires {method.expiry}</p>
                                    </div>
                                    {selectedPaymentMethod?.id === method.id && (
                                      <div className="bg-purple-600 rounded-full p-1 h-5 w-5 flex items-center justify-center">
                                        <CheckCircle2 className="h-3 w-3 text-white" />
                                      </div>
                                    )}
                                  </div>
                                </div>
                              ))}

                              {/* Manual Card Entry Trigger */}
                              <div 
                                onClick={() => setSelectedPaymentMethod({ id: 'manual' })}
                                className={`relative flex items-center p-4 rounded-2xl border-2 border-dashed transition-all cursor-pointer bg-white ${
                                  selectedPaymentMethod?.id === 'manual' 
                                    ? 'border-purple-500 bg-green-50/30 border-solid shadow-sm'
                                    : 'border-gray-200 hover:border-orange-200 hover:bg-orange-50/10'
                                }`}
                              >
                                <RadioGroupItem value="manual" id="manual" className="sr-only" />
                                <div className="flex items-center gap-3 w-full">
                                  <div className={`p-2 rounded-lg bg-gray-50 text-gray-400 ${selectedPaymentMethod?.id === 'manual' ? 'bg-purple-600 text-white' : ''}`}>
                                    <Plus className="h-5 w-5" />
                                  </div>
                                  <div className="flex-1">
                                    <p className="font-bold text-sm">Add New Card</p>
                                    <p className="text-[10px] text-gray-400  font-black">Secure one-time payment</p>
                                  </div>
                                  {selectedPaymentMethod?.id === 'manual' && (
                                    <div className="bg-purple-600 rounded-full p-1 h-5 w-5 flex items-center justify-center">
                                      <CheckCircle2 className="h-3 w-3 text-white" />
                                    </div>
                                  )}
                                </div>
                              </div>
                            </RadioGroup>
                            ) : paymentType === 'momo' ? (
                              <div className="space-y-4 animate-in fade-in zoom-in-95 duration-300">
                                <div className="bg-green-50 p-6 rounded-3xl border-2 border-green-100 space-y-4">
                                  <h4 className="text-sm font-black  italic tracking-tighter">Mobile <span className="text-purple-600">Money</span></h4>
                                  <div className="space-y-3">
                                    <div className="space-y-1">
                                      <Label className="text-[10px] font-black  text-gray-400">Select Provider</Label>
                                      <div className="grid grid-cols-2 gap-2">
                                        <Button variant="outline" onClick={() => setSelectedPaymentMethod({ id: 'mtn' })} className={`h-12 rounded-xl border-2 font-bold justify-start px-3 bg-white ${selectedPaymentMethod?.id === 'mtn' ? 'border-purple-500 shadow-purple-100 shadow-md' : 'border-zinc-100'}`}>
                                          <div className="w-6 h-6 bg-yellow-400 rounded-full mr-2" /> MTN
                                        </Button>
                                        <Button variant="outline" onClick={() => setSelectedPaymentMethod({ id: 'airtel' })} className={`h-12 rounded-xl border-2 font-bold justify-start px-3 bg-white ${selectedPaymentMethod?.id === 'airtel' ? 'border-purple-500 shadow-purple-100 shadow-md' : 'border-zinc-100'}`}>
                                          <div className="w-6 h-6 bg-red-600 rounded-full mr-2" /> Airtel
                                        </Button>
                                      </div>
                                    </div>
                                    <div className="space-y-1">
                                      <Label className="text-[10px] font-black  text-gray-400">Phone Number</Label>
                                      <Input placeholder="+234 ..." className="h-12 rounded-xl border-2 border-zinc-100 focus:border-purple-500 bg-white" />
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ) : paymentType === 'bank' ? (
                              <div className="space-y-4 animate-in fade-in zoom-in-95 duration-300">
                                <div className="bg-zinc-900 p-6 rounded-3xl text-white space-y-4" onClick={() => setSelectedPaymentMethod({ id: 'bank' })}>
                                  <div className="flex items-center justify-between">
                                     <h4 className="text-sm font-black  tracking-widest text-zinc-400">Bank Transfer</h4>
                                     <Building className="h-5 w-5 text-zinc-600" />
                                  </div>
                                  <div className="space-y-4 bg-zinc-800/50 p-4 rounded-2xl border border-zinc-700/50">
                                    <div className="flex justify-between items-center">
                                      <span className="text-[10px]  font-black text-zinc-500">Bank Name</span>
                                      <span className="text-sm font-bold">WEMA BANK / ALAT</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                      <span className="text-[10px]  font-black text-zinc-500">Account No.</span>
                                      <span className="text-lg font-black tracking-widest text-purple-400">0123456789</span>
                                    </div>
                                  </div>
                                  <p className="text-[9px] text-zinc-500 font-bold  text-center">Transfer AND CLICK "PAY NOW"</p>
                                </div>
                              </div>
                            ) : (
                               <div className="bg-gray-50 p-8 rounded-3xl border-2 border-dashed border-gray-200 text-center space-y-3 cursor-pointer" onClick={() => setSelectedPaymentMethod({ id: 'pod' })}>
                                <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mx-auto shadow-sm">
                                   <Truck className="h-6 w-6 text-purple-600" />
                                </div>
                                <h4 className="font-black  italic tracking-tighter">Pay on <span className="text-purple-600">Delivery</span></h4>
                                <p className="text-[10px] text-gray-500 font-bold  leading-relaxed max-w-[200px] mx-auto">
                                  Pay cash or card when your rider arrives.
                                </p>
                              </div>
                            )}

                            <AnimatePresence>
                              {selectedPaymentMethod?.id === 'manual' && (
                                <motion.div 
                                  initial={{ height: 0, opacity: 0 }}
                                  animate={{ height: "auto", opacity: 1 }}
                                  exit={{ height: 0, opacity: 0 }}
                                  className="overflow-hidden"
                                >
                                  <div className="p-5 bg-white border-2 border-green-100 rounded-2xl space-y-4 shadow-sm">
                                    <div className="space-y-4">
                                      <div className="space-y-2">
                                        <Label htmlFor="checkout-name" className="text-[10px] font-black  tracking-widest text-gray-400">Cardholder Name</Label>
                                        <div className="relative">
                                          <Input 
                                            id="checkout-name"
                                            placeholder="Full Name as on card"
                                            value={manualName}
                                            onChange={(e) => setManualName(e.target.value)}
                                            className="rounded-xl border-gray-100 focus:border-purple-500 bg-gray-50/30 pl-10"
                                          />
                                          <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                        </div>
                                        {manualName.length > 0 && manualName.trim().split(' ').length < 2 && (
                                          <p className="text-[10px] text-purple-400 font-bold  tracking-tight">Enter First and Last Name</p>
                                        )}
                                        {manualName.trim().split(' ').length >= 2 && (
                                          <p className="text-[10px] text-green-600 font-bold  tracking-tight flex items-center gap-1">
                                            <CheckCircle2 className="h-3 w-3" /> Name format verified
                                          </p>
                                        )}
                                      </div>
                                      <div className="space-y-2">
                                        <Label htmlFor="checkout-card-number" className="text-[10px] font-black  tracking-widest text-gray-400">Card Number</Label>
                                        <div className="relative">
                                          <Input 
                                            id="checkout-card-number"
                                            placeholder="Card Number"
                                            value={manualCardNumber}
                                            onChange={(e) => setManualCardNumber(formatCardNumber(e.target.value))}
                                            className="rounded-xl border-gray-100 focus:border-purple-500 bg-gray-50/30 pl-10"
                                            maxLength={19} // 16 digits + 3 spaces
                                          />
                                          <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                        </div>
                                        {manualCardNumber.length > 0 && manualCardNumber.replace(/\s+/g, '').length < 16 && (
                                          <p className="text-[10px] text-red-500 font-bold  tracking-tight">
                                            Require {16 - manualCardNumber.replace(/\s+/g, '').length} more digits
                                          </p>
                                        )}
                                        {manualCardNumber.replace(/\s+/g, '').length === 16 && (
                                          <div className="flex items-center justify-between">
                                            <p className={`text-[10px] font-bold  tracking-tight flex items-center gap-1 ${validateLuhn(manualCardNumber.replace(/\s+/g, '')) ? 'text-green-600' : 'text-red-500'}`}>
                                              {validateLuhn(manualCardNumber.replace(/\s+/g, '')) ? (
                                                <><CheckCircle2 className="h-3 w-3" /> Luhn Check Passed</>
                                              ) : (
                                                <><X className="h-3 w-3" /> Invalid Card Number</>
                                              )}
                                            </p>
                                            <span className="text-[10px] text-gray-400 font-black">
                                              {manualCardNumber.replace(/\s+/g, '').startsWith('4') ? 'VISA' : 'MASTERCARD'}
                                            </span>
                                          </div>
                                        )}
                                      </div>
                                      <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                          <Label htmlFor="checkout-expiry" className="text-[10px] font-black  tracking-widest text-gray-400">Expiry Date</Label>
                                          <Input 
                                            id="checkout-expiry"
                                            placeholder="MM/YY"
                                            value={manualExpiry}
                                            onChange={(e) => {
                                              let val = e.target.value.replace(/\D/g, '');
                                              if (val.length > 2) val = val.slice(0, 2) + '/' + val.slice(2, 4);
                                              setManualExpiry(val);
                                            }}
                                            maxLength={5}
                                            className={`rounded-xl border-gray-100 focus:border-purple-500 bg-gray-50/30 ${manualExpiry.length === 5 && !validateExpiry(manualExpiry) ? 'border-red-500' : ''}`}
                                          />
                                          {manualExpiry.length === 5 && !validateExpiry(manualExpiry) && (
                                            <p className="text-[10px] text-red-500 font-bold  tracking-tight">Invalid Expiry</p>
                                          )}
                                          {manualExpiry.length === 5 && validateExpiry(manualExpiry) && (
                                            <p className="text-[10px] text-green-600 font-bold  tracking-tight flex items-center gap-1">
                                              <CheckCircle2 className="h-3 w-3" /> Valid
                                            </p>
                                          )}
                                        </div>
                                        <div className="space-y-2">
                                          <Label htmlFor="checkout-cvc" className="text-[10px] font-black  tracking-widest text-gray-400">CVC Code</Label>
                                          <Input 
                                            id="checkout-cvc"
                                            type="password"
                                            placeholder="•••"
                                            value={manualCVC}
                                            onChange={(e) => setManualCVC(e.target.value.replace(/\D/g, '').slice(0, 3))}
                                            maxLength={3}
                                            className="rounded-xl border-gray-100 focus:border-purple-500 bg-gray-50/30"
                                          />
                                        </div>
                                      </div>
                                      <div className="flex items-center gap-2 pt-2">
                                        <input 
                                          type="checkbox"
                                          id="save-card"
                                          checked={saveCard}
                                          onChange={(e) => setSaveCard(e.target.checked)}
                                          className="rounded border-purple-300 text-purple-600 focus:ring-purple-500 h-4 w-4"
                                        />
                                        <Label htmlFor="save-card" className="text-xs text-gray-600 font-bold cursor-pointer">Save card details for future shopping</Label>
                                      </div>
                                    </div>
                                  </div>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        </div>
                      )}

                        <div className="pt-6 border-t border-dashed border-gray-200">
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-gray-500 font-medium text-sm">Subtotal</span>
                            <span className="font-bold text-sm font-mono">{formatPrice((typeof selectedProduct.price === 'number' ? selectedProduct.price : parseFloat(selectedProduct.price.toString().replace(/[^\d.]/g, ''))) * (productQuantities[selectedProduct.id] || 1))}</span>
                          </div>
                          <div className="flex justify-between items-center mb-4">
                            <span className="text-gray-500 font-medium text-sm">Shipping</span>
                            <span className="text-green-600 font-bold text-sm tracking-widest ">FREE</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="font-black  tracking-widest text-lg">Total</span>
                            <span className="text-2xl font-black text-purple-600 font-mono tracking-tighter">
                              {formatPrice((typeof selectedProduct.price === 'number' ? selectedProduct.price : parseFloat(selectedProduct.price.toString().replace(/[^\d.]/g, ''))) * (productQuantities[selectedProduct.id] || 1))}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="mt-8">
                        <Button 
                          className="w-full h-16 bg-purple-600 hover:bg-purple-700 text-white font-black text-xl rounded-2xl shadow-lg shadow-purple-200 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                          onClick={() => handlePlaceOrder(selectedProduct)}
                          disabled={isOrdering || (checkoutStep === 'payment' && !selectedPaymentMethod)}
                        >
                          {isOrdering ? 'Processing...' : checkoutStep === 'address' ? 'Continue to payment' : `Pay ${formatPrice(selectedProduct.price)}`}
                        </Button>
                        <p className="text-[10px] text-gray-400 text-center mt-3  font-black tracking-widest flex items-center justify-center gap-1">
                          <ShieldCheck className="h-3 w-3" /> Secure checkout powered by Stripe
                        </p>
                      </div>
                    </div>
                  )}

                  {checkoutStep === 'details' && (
                    <div className="mt-6 pt-6 border-t border-gray-100 flex items-center justify-between">
                      <div className="flex items-center gap-2 text-xs font-bold text-green-600">
                        <Truck className="h-4 w-4" /> FREE SHIPPING
                      </div>
                      <div className="text-xs font-bold text-gray-400  tracking-widest">
                        {selectedProduct.sold} SOLD ALREADY
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </section>
  );
}
