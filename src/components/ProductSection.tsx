import { Star, Heart, ShoppingCart, ChevronLeft, ChevronRight, Filter, X, Zap, Eye, Truck, CheckCircle2, SlidersHorizontal, CreditCard, ShieldCheck, Plus, User, MapPin, Home, Building, Minus, Clock, Info, BadgeCheck, AlertCircle, Sparkles, Edit, ShoppingBag, Package, FileText, Phone } from "lucide-react";
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
import { db } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp, query, onSnapshot, updateDoc, doc } from "firebase/firestore";
import { toast } from "sonner";
import { useAuth } from "@/lib/AuthContext";
import { useCart } from "@/lib/CartContext";
import { useCurrency } from "@/lib/CurrencyContext";
import { API_URL } from "@/lib/api";
import { cn, getOptimizedImageUrl } from "@/lib/utils";
import { StarRating } from "@/components/ui/star-rating";

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
  isLoading?: boolean;
  onAddToWishlist?: () => void;
  onProductView?: (product: Product) => void;
}

export default function ProductSection({ title, subtitle, products, isLoading, onAddToWishlist, onProductView }: ProductSectionProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [priceRange, setPriceRange] = useState<number[]>([0, 1000000]);
  const [sortBy, setSortBy] = useState<string>("newest");
  const [selectedProduct, setInternalSelectedProduct] = useState<Product | null>(null);
  const [isDetailLoading, setIsDetailLoading] = useState(false);

  const setSelectedProduct = (product: Product | null) => {
    setInternalSelectedProduct(product);
    if (product) {
      setIsDetailLoading(true);
      setTimeout(() => setIsDetailLoading(false), 600);
    }
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
  const [deliveryPhone, setDeliveryPhone] = useState("");
  const [productQuantities, setProductQuantities] = useState<Record<string, number>>({});
  const [saveCard, setSaveCard] = useState(false);
  const [reviews, setReviews] = useState<any[]>([]);
  const [newReviewRating, setNewReviewRating] = useState(5);
  const [newReviewComment, setNewReviewComment] = useState("");
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [storeSettings, setStoreSettings] = useState<any>(null);
  const { user, profile } = useAuth();

  useEffect(() => {
    if (profile || user) {
      const initialPhone = (profile as any)?.phone || user?.phoneNumber || "";
      if (initialPhone) setDeliveryPhone(initialPhone);
    }
  }, [profile, user]);
  const { addToCart, setIsOpen } = useCart();
  const { formatPrice } = useCurrency();

  useEffect(() => {
    const q = query(collection(db, 'settings'));
    const unsubscribe = onSnapshot(q, (snap) => {
      if (!snap.empty) setStoreSettings(snap.docs[0].data());
    });
    return () => unsubscribe();
  }, []);

  const handleAddToCart = (product: Product, quantity: number = 1) => {
    const orderNumber = `VIVI-${Math.random().toString(36).slice(-6).toUpperCase()}`;
    const customerName = profile?.displayName || profile?.display_name || user?.displayName || user?.email?.split('@')[0] || 'Customer';
    const customerPhone = (profile as any)?.phone || user?.phoneNumber || '07045108847 or 09053091235';

    addToCart({
      id: product.id.toString(),
      name: product.name,
      price: product.price.toString(),
      priceValue: typeof product.price === 'number' ? product.price : parseFloat(product.price.toString().replace(/[^\d.]/g, '')),
      image: product.image,
      orderNumber,
      customerName,
      phone: customerPhone
    }, quantity);

    toast.success(
      <div>
        <p className="font-bold">{product.name} added to cart!</p>
        <p className="text-[10px] text-gray-500 font-bold mt-0.5">Order #: <span className="text-orange-600">{orderNumber}</span></p>
        <p className="text-[10px] text-gray-500 font-bold">Name: {customerName} | Phone: {customerPhone}</p>
      </div>,
      {
        icon: <ShoppingCart className="h-4 w-4 text-orange-600" />,
        action: {
          label: "View Cart",
          onClick: () => setIsOpen(true)
        }
      }
    );
  };

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

  const fetchReviews = async () => {
    if (!selectedProduct) return;
    try {
      const response = await fetch(`${API_URL}/api/reviews/?product_id=${selectedProduct.id}`);
      if (response.ok) {
        const data = await response.json();
        const mappedReviews = data.map((r: any) => ({
          id: r.id,
          userName: r.user_name || "Customer",
          rating: Number(r.rating) || 5,
          comment: r.comment,
          createdAt: { toDate: () => new Date(r.created_at) }
        }));
        setReviews(mappedReviews);

        if (mappedReviews.length > 0) {
          const sumRating = mappedReviews.reduce((acc: number, r: any) => acc + (Number(r.rating) || 5), 0);
          const avgRating = parseFloat((sumRating / mappedReviews.length).toFixed(1));
          setInternalSelectedProduct((prev: Product | null) => prev ? {
            ...prev,
            reviews: mappedReviews.length,
            rating: avgRating
          } : null);
        }
      }
    } catch (error) {
      console.error("Failed to fetch reviews:", error);
    }
  };

  useEffect(() => {
    if (!selectedProduct) {
      setReviews([]);
      return;
    }

    fetchReviews();
  }, [selectedProduct?.id]);

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
      const token = await user.getIdToken();
      const reviewerName = profile?.displayName || (profile as any)?.display_name || user?.displayName || user?.email?.split('@')[0] || 'Customer';

      const response = await fetch(`${API_URL}/api/reviews/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          product: selectedProduct!.id,
          rating: newReviewRating,
          comment: newReviewComment,
          user_name: reviewerName,
        }),
      });

      if (response.ok) {
        const resData = await response.json();
        setNewReviewComment("");
        setNewReviewRating(5);
        toast.success("Review submitted!");

        if (resData.product_reviews_count !== undefined) {
          setInternalSelectedProduct((prev: Product | null) => prev ? {
            ...prev,
            reviews: resData.product_reviews_count,
            rating: resData.product_rating
          } : null);
        }

        await fetchReviews();
      } else {
        toast.error("Failed to submit review.");
      }
    } catch (error: any) {
      toast.error("Failed to submit review: " + error.message);
    } finally {
      setIsSubmittingReview(false);
    }
  };

  const handleAddToWishlistAction = async (product: Product) => {
    if (!user) {
      toast.error("Please login to save items");
      return;
    }

    try {
      const token = await user.getIdToken();
      const response = await fetch(`${API_URL}/api/wishlist/add_to_wishlist/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ product_id: product.id })
      });

      if (response.ok) {
        onAddToWishlist?.();
        toast.success("Added to Wishlist");
      } else {
        toast.error("Failed to add to wishlist");
      }
    } catch (e) {
      toast.error("Error adding to wishlist");
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
    let result = products.filter(product => {
      const priceStr = String(product.price || "0").replace(/[^\d.]/g, '');
      const price = parseFloat(priceStr) || 0;

      const matchesCategory = selectedCategory === "all" || product.category === selectedCategory;
      const matchesPrice = price >= priceRange[0] && price <= priceRange[1];
      
      return matchesCategory && matchesPrice;
    });

    // Apply Sorting
    return result.sort((a, b) => {
      const priceA = parseFloat(String(a.price).replace(/[^\d.]/g, '')) || 0;
      const priceB = parseFloat(String(b.price).replace(/[^\d.]/g, '')) || 0;

      switch (sortBy) {
        case "price-low":
          return priceA - priceB;
        case "price-high":
          return priceB - priceA;
        case "rating":
          return (b.rating || 0) - (a.rating || 0);
        case "newest":
        default:
          // Assuming higher ID means newer, or use a date if available
          return Number(b.id) - Number(a.id);
      }
    });
  }, [products, selectedCategory, priceRange, sortBy]);

  const resetFilters = () => {
    setSelectedCategory("all");
    setPriceRange([0, 1000000]);
  };

  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (selectedCategory !== "all") count++;
    if (priceRange[0] !== 0 || priceRange[1] !== 1000000) count++;
    return count;
  }, [selectedCategory, priceRange]);

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
      if (!deliveryAddress || !deliveryCity || !deliveryZip || !deliveryPhone) {
        toast.error("Please fill in all delivery details including phone number");
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

      const generatedOrderNumber = `VIVI-${Math.random().toString(36).slice(-6).toUpperCase()}`;
      const customerName = profile?.displayName || profile?.display_name || user.displayName || user.email?.split('@')[0] || 'Customer';
      const customerPhone = deliveryPhone.trim() || (profile as any)?.phone || user.phoneNumber || '07045108847 or 09053091235';

      const orderData = {
        userId: user.uid,
        orderId: generatedOrderNumber,
        orderNumber: generatedOrderNumber,
        customerEmail: user.email,
        customerName: customerName,
        name: customerName,
        phone: customerPhone,
        phoneNumber: customerPhone,
        productName: product.name,
        productImage: product.image,
        quantity: quantity,
        items: [{ id: product.id, name: product.name, price: product.price, quantity, orderNumber: generatedOrderNumber }],
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
          <p className="text-[10px] font-bold text-gray-700">Order #: <span className="text-orange-600 font-black">{generatedOrderNumber}</span></p>
          <p className="text-[10px] font-bold text-gray-700">Name: {customerName} | Phone: {customerPhone}</p>
          <p className="text-[10px] font-black tracking-widest text-orange-600">
            Vivi Reward: You saved ${(unitPrice * quantity * 0.9).toFixed(2)} today!
          </p>
          <Button variant="link" className="p-0 h-auto text-[10px] text-blue-600 font-bold tracking-tighter">
            Share with friends for a ₦20 Coupon 🎁
          </Button>
        </div>,
        { duration: 6000 }
      );

      // Log notification for order and payment
      await addDoc(collection(db, 'notifications'), {
        type: 'order_notification',
        orderId: generatedOrderNumber,
        orderNumber: generatedOrderNumber,
        userId: user.uid,
        email: user.email,
        name: customerName,
        phone: customerPhone,
        amount: totalAmount,
        paymentMethod: paymentType,
        message: `Order #${generatedOrderNumber} (${product.name}) placed successfully! Total: ₦${totalAmount.toFixed(2)} (${paymentType.toUpperCase()})`,
        status: 'pending',
        createdAt: serverTimestamp(),
      });

      // Send real emails via local API
      try {
        await fetch(`${API_URL}/api/send-order-confirmation`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            userId: user.uid,
            email: user.email, 
            phone: customerPhone,
            orderId: generatedOrderNumber,
            orderNumber: generatedOrderNumber,
            productName: product.name,
            totalAmount: totalAmount.toFixed(2),
            paymentMethod: paymentType,
            shippingAddress: {
              address: deliveryAddress,
              city: deliveryCity,
              zipCode: deliveryZip
            },
            name: customerName
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
    <section className="py-3 bg-[#f5f5f5]">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-3 gap-2 bg-white p-2.5 md:p-3 rounded-lg shadow-xs border border-gray-100">
          <div className="flex items-center gap-2">
            <div className="bg-orange-600 p-1.5 rounded-md shadow-xs shadow-orange-100">
              <Zap className="h-3.5 w-3.5 text-white fill-white" />
            </div>
            <div>
              <h2 className="text-sm md:text-base font-black text-black tracking-tighter leading-none">{title} <span className="text-orange-600 italic">{subtitle}</span></h2>
              <p className="text-[7.5px] md:text-[8px] font-bold text-gray-400 tracking-widest mt-0.5">{filteredProducts.length} Products Found</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {/* Sorting Dropdown */}
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[110px] md:w-[130px] bg-white border border-gray-100 rounded-md h-7 px-2 font-bold text-[10px]">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent className="rounded-lg border">
                <SelectItem value="newest" className="font-medium text-[10px]">Newest First</SelectItem>
                <SelectItem value="price-low" className="font-medium text-[10px]">Price: Low to High</SelectItem>
                <SelectItem value="price-high" className="font-medium text-[10px]">Price: High to Low</SelectItem>
                <SelectItem value="rating" className="font-medium text-[10px]">Top Rated</SelectItem>
              </SelectContent>
            </Select>

            {/* Collapsible Filter Panel (Sheet) */}
            <Sheet>
              <SheetTrigger
                render={(props) => (
                  <button
                    {...props}
                    className={cn(
                      "inline-flex items-center justify-center gap-1 border rounded-md h-7 px-2.5 text-[10px] font-bold transition-all bg-white hover:bg-muted hover:text-foreground border-gray-100 hover:border-orange-200",
                      activeFiltersCount > 0 && "bg-green-50 border-orange-500 text-orange-600"
                    )}
                  >
                    <SlidersHorizontal className="h-3 w-3" />
                    Filter Options
                    {activeFiltersCount > 0 && (
                      <span className="ml-1 bg-orange-600 text-white h-3.5 w-3.5 p-0 flex items-center justify-center rounded-full text-[8px]">
                        {activeFiltersCount}
                      </span>
                    )}
                  </button>
                )}
              />
              <SheetContent className="w-[300px] sm:w-[400px] rounded-l-3xl border-none">
                <SheetHeader className="pb-6 border-b border-gray-100">
                  <SheetTitle className="text-2xl font-black  italic tracking-tighter">
                    Filter <span className="text-orange-600">Products</span>
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
                      <span className="text-sm font-black text-orange-600 bg-green-50 px-3 py-1 rounded-full">{formatPrice(priceRange[0])} - {formatPrice(priceRange[1])}</span>
                    </div>
                    <Slider 
                      value={priceRange} 
                      max={1000000}
                      step={500}
                      onValueChange={setPriceRange}
                      className="py-4"
                    />
                  </div>
                </div>

                <SheetFooter className="mt-auto pt-6 border-t border-gray-100 flex-col gap-3">
                  <Button 
                    variant="outline" 
                    onClick={resetFilters}
                    className="w-full h-12 text-gray-400 hover:text-orange-600 gap-2 font-black  tracking-tighter rounded-xl border-2"
                  >
                    <X className="h-4 w-4" />
                    Reset All Filters
                  </Button>
                </SheetFooter>
              </SheetContent>
            </Sheet>

            <div className="hidden sm:flex gap-1">
              <Button variant="ghost" size="icon" className="rounded-xl h-11 w-11 hover:bg-green-50 hover:text-orange-600 border border-transparent hover:border-green-100">
                <ChevronLeft className="h-5 w-5" />
              </Button>
              <Button variant="ghost" size="icon" className="rounded-xl h-11 w-11 hover:bg-green-50 hover:text-orange-600 border border-transparent hover:border-green-100">
                <ChevronRight className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>

        {/* Active Filters Display */}
        {activeFiltersCount > 0 && (
          <div className="flex flex-wrap gap-2 mb-6">
            {selectedCategory !== "all" && (
              <Badge variant="secondary" className="bg-white border border-green-200 text-orange-600 font-bold px-3 py-1.5 rounded-full flex items-center gap-2">
                Category: {selectedCategory}
                <X className="h-3 w-3 cursor-pointer" onClick={() => setSelectedCategory("all")} />
              </Badge>
            )}
            {(priceRange[0] !== 0 || priceRange[1] !== 1000000) && (
              <Badge variant="secondary" className="bg-white border border-green-200 text-orange-600 font-bold px-3 py-1.5 rounded-full flex items-center gap-2">
                Price: {formatPrice(priceRange[0])}-{formatPrice(priceRange[1])}
                <X className="h-3 w-3 cursor-pointer" onClick={() => setPriceRange([0, 1000000])} />
              </Badge>
            )}
            <Button variant="ghost" size="sm" onClick={resetFilters} className="text-[10px] font-black  text-gray-400 hover:text-orange-600">
              Clear All
            </Button>
          </div>
        )}

        {/* Product Grid */}
        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3 md:gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-white rounded-xl overflow-hidden shadow-sm border border-transparent animate-pulse">
                <div className="aspect-square bg-gray-200" />
                <div className="p-3 space-y-2">
                  <div className="h-3 bg-gray-200 rounded w-3/4" />
                  <div className="h-4 bg-gray-200 rounded w-1/2" />
                  <div className="flex justify-between">
                    <div className="h-2 bg-gray-200 rounded w-1/4" />
                    <div className="h-2 bg-gray-200 rounded w-1/4" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : filteredProducts.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3 md:gap-4">
            <AnimatePresence mode="popLayout">
              {filteredProducts.map((product) => (
                <motion.div 
                  key={product.id}
                  layout
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="group bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all cursor-pointer border border-transparent hover:border-orange-200"
                  onClick={() => setSelectedProduct(product)}
                >
                  <div className="relative aspect-square bg-gray-50 p-2 flex items-center justify-center overflow-hidden">
                    {product.tag && (
                      <div className="absolute top-0 left-0 bg-orange-600 text-white text-[11px] font-black px-2 py-1 rounded-br-lg z-10 flex items-center gap-1">
                        <Zap className="h-3 w-3 fill-white" />
                        {product.tag}
                      </div>
                    )}
                      <div className="absolute top-0 right-0 bg-yellow-400 text-black text-[9px] font-black px-2 py-1 rounded-bl-lg z-10 animate-pulse">
                        Price drop
                      </div>
                    <div className="absolute top-2 right-2 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-20">
                      <Button 
                        size="icon" 
                        variant="secondary" 
                        className="rounded-full h-8 w-8 shadow-md bg-white/90 hover:bg-orange-600 hover:text-white"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleAddToWishlistAction(product);
                        }}
                      >
                        <Heart className="h-4 w-4" />
                      </Button>
                      <Button 
                        size="icon" 
                        variant="secondary" 
                        className="rounded-full h-8 w-8 shadow-md bg-white/90 hover:bg-orange-600 hover:text-white"
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
                        className="rounded-full h-8 w-8 shadow-md bg-white/90 hover:bg-orange-600 hover:text-white"
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
                        className="bg-white/95 hover:bg-orange-600 hover:text-white font-black text-[10px]  tracking-tighter rounded-full px-6 h-9 shadow-xl transform translate-y-4 group-hover:translate-y-0 transition-all duration-300"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedProduct(product);
                        }}
                      >
                        Quick View
                      </Button>
                    </div>

                    <img 
                      src={getOptimizedImageUrl(product.image, 400)}
                      alt={product.name} 
                      className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-500 ease-out"
                      loading="lazy"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1560393464-5c69a73c5770?q=80&w=500&auto=format&fit=crop';
                      }}
                    />
                  </div>

                  <div className="p-2 md:p-3">
                    <h3 className="text-[10px] md:text-xs font-medium text-gray-800 line-clamp-2 h-7 md:h-8 mb-1 md:mb-2 group-hover:text-orange-600 transition-colors">{product.name}</h3>
                    
                    <div className="flex items-baseline gap-1 md:gap-1.5 mb-1">
                      <span className="text-sm md:text-lg font-black text-orange-600 leading-none">{formatPrice(product.price)}</span>
                      {product.oldPrice && (
                        <span className="text-[9px] md:text-[11px] text-gray-400 line-through">{formatPrice(product.oldPrice)}</span>
                      )}
                    </div>

                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-0.5">
                        <Star className="h-2.5 w-2.5 md:h-3 md:w-3 fill-orange-500 text-orange-500" />
                        <span className="text-[9px] md:text-[11px] font-bold text-gray-700">{product.rating}</span>
                      </div>
                      {product.sold && (
                        <span className="text-[9px] md:text-[10px] font-bold text-gray-400">{product.sold} sold</span>
                      )}
                    </div>
                    
                      <div className="flex items-center justify-between mb-1.5 bg-gray-50 rounded-md p-0.5">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-5.5 w-5.5 rounded hover:bg-white hover:text-orange-600 transition-colors"
                          onClick={(e) => {
                            e.stopPropagation();
                            setProductQuantities(prev => ({
                              ...prev,
                              [product.id]: Math.max(1, (prev[product.id] || 1) - 1)
                            }));
                          }}
                        >
                          <Minus className="h-2.5 w-2.5" />
                        </Button>
                        <span className="text-[11px] font-black w-6 text-center">{productQuantities[product.id] || 1}</span>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-5.5 w-5.5 rounded hover:bg-white hover:text-orange-600 transition-colors"
                          onClick={(e) => {
                            e.stopPropagation();
                            setProductQuantities(prev => ({
                              ...prev,
                              [product.id]: (prev[product.id] || 1) + 1
                            }));
                          }}
                        >
                          <Plus className="h-2.5 w-2.5" />
                        </Button>
                      </div>
                        <Button
                          className="w-full h-6.5 bg-orange-600 text-white hover:bg-orange-700 border-none text-[10px] font-black rounded-md transition-colors shadow-xs gap-1.5"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleAddToCart(product, productQuantities[product.id] || 1);
                          }}
                        >
                          <ShoppingCart className="h-3 w-3" />
                          Add to cart
                        </Button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        ) : (
          <div className="py-8 md:py-10 text-center bg-white rounded-2xl shadow-sm">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gray-50 mb-3">
              <Filter className="h-6 w-6 text-gray-200" />
            </div>
            <h3 className="text-lg font-black tracking-tighter mb-1">No results found</h3>
            <p className="text-xs md:text-sm text-gray-400 mb-4 font-medium">Try adjusting your filters or search terms.</p>
            <Button onClick={resetFilters} variant="outline" className="rounded-full h-9 px-6 text-xs border-2 border-orange-600 text-orange-600 font-black hover:bg-orange-600 hover:text-white">
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
          <DialogContent className="w-[95vw] sm:w-full max-w-3xl max-h-[90vh] overflow-y-auto overflow-x-hidden rounded-2xl sm:rounded-3xl p-0 border-none">
            {selectedProduct && (
              <div className="flex flex-col md:flex-row min-h-[400px] max-w-full overflow-x-hidden">
                {isDetailLoading ? (
                  <div className="flex flex-col md:flex-row w-full animate-pulse">
                    <div className="h-36 sm:h-48 md:h-auto md:w-2/5 bg-gray-200 shrink-0" />
                    <div className="md:w-3/5 p-4 sm:p-6 md:p-8 space-y-4 sm:space-y-6">
                      <div className="flex gap-2">
                        <div className="h-5 w-16 bg-gray-200 rounded-full" />
                        <div className="h-5 w-16 bg-gray-200 rounded-full" />
                      </div>
                      <div className="h-8 sm:h-10 w-3/4 bg-gray-200 rounded-xl" />
                      <div className="h-4 w-1/2 bg-gray-200 rounded-lg" />
                      <div className="h-10 sm:h-12 w-1/3 bg-gray-200 rounded-xl mt-4 sm:mt-8" />
                      <div className="space-y-3 mt-6 sm:mt-10">
                        <div className="h-3 w-full bg-gray-100 rounded" />
                        <div className="h-3 w-full bg-gray-100 rounded" />
                        <div className="h-3 w-2/3 bg-gray-100 rounded" />
                      </div>
                      <div className="flex gap-4 mt-auto pt-6 sm:pt-10">
                        <div className="h-12 sm:h-14 flex-1 bg-gray-200 rounded-2xl" />
                        <div className="h-12 sm:h-14 flex-1 bg-gray-200 rounded-2xl" />
                      </div>
                    </div>
                  </div>
                ) : (
  <>
                    <div className="h-40 sm:h-52 md:h-auto md:w-2/5 bg-gray-50 relative shrink-0 flex items-center justify-center p-2">
                      <Button
                        variant="ghost"
                        onClick={() => {
                          setSelectedProduct(null);
                          setCheckoutStep('details');
                        }}
                        className="absolute top-3 left-3 z-30 rounded-full bg-white/90 backdrop-blur-md hover:bg-white text-gray-700 shadow-sm h-8 w-8"
                        title="Back to Products"
                      >
                        <ChevronLeft className="h-4 w-4" />
                        <span>Back</span>
                      </Button>
                      <img
                        src={getOptimizedImageUrl(selectedProduct.image, 800)}
                        alt={selectedProduct.name}
                        className="w-full h-full object-contain max-h-36 sm:max-h-48 md:max-h-80 rounded-xl"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1560393464-5c69a73c5770?q=80&w=500&auto=format&fit=crop';
                        }}
                      />
                    </div>
                    <div className="md:w-3/5 p-3.5 sm:p-5 flex flex-col">
                  {checkoutStep === 'details' ? (
                    <Tabs defaultValue="overview" className="flex flex-col h-full">
                      <TabsList className="grid w-full grid-cols-2 mb-3 bg-gray-100/50 rounded-xl p-1">
                        <TabsTrigger 
                          value="overview" 
                          className="rounded-lg font-black text-[9px] tracking-wider data-[state=active]:bg-white data-[state=active]:text-orange-600 data-[state=active]:shadow-2xs transition-all h-7"
                        >
                          Overview
                        </TabsTrigger>
                        <TabsTrigger 
                          value="reviews" 
                          className="rounded-lg font-black text-[9px] tracking-wider data-[state=active]:bg-white data-[state=active]:text-orange-600 data-[state=active]:shadow-2xs transition-all flex items-center gap-1 h-7"
                        >
                          <Sparkles className="h-3 w-3" />
                          Reviews ({selectedProduct.reviews})
                        </TabsTrigger>
                      </TabsList>

                      <TabsContent value="overview" className="flex-1 flex flex-col mt-0 focus-visible:outline-none min-h-0">
                        <ScrollArea className="flex-1 pr-2 -mr-2 sm:pr-3 sm:-mr-3 max-h-[45vh] sm:max-h-[380px]">
                          <DialogHeader className="mb-2 sm:mb-3 text-left">
                            <div className="flex items-center gap-1.5 mb-1">
                              <Badge className="bg-orange-600 text-white border-none text-[8px] px-2 py-0.5">{selectedProduct.category}</Badge>
                              {selectedProduct.tag && <Badge variant="outline" className="border-orange-600 text-orange-600 text-[8px] px-2 py-0.5">{selectedProduct.tag} OFF</Badge>}
                            </div>
                            <DialogTitle className="text-sm sm:text-base md:text-lg font-black leading-snug mb-0.5 sm:mb-1">{selectedProduct.name}</DialogTitle>
                            <div className="flex items-center gap-2 flex-wrap">
                              <div className="flex items-center gap-0.5">
                                <StarRating value={selectedProduct.rating} readOnly size="sm" />
                                <span className="text-[11px] sm:text-xs font-bold ml-0.5 sm:ml-1">{selectedProduct.rating}</span>
                              </div>
                              <span className="text-[10px] sm:text-xs text-gray-400 font-medium">{selectedProduct.reviews} Verified Reviews</span>
                            </div>
                          </DialogHeader>
                          
                          <div className="flex items-baseline gap-2 mb-2 sm:mb-3">
                            <span className="text-xl sm:text-2xl md:text-3xl font-black text-orange-600">{formatPrice(selectedProduct.price)}</span>
                            {selectedProduct.oldPrice && (
                              <span className="text-xs sm:text-sm text-gray-400 line-through font-medium">{formatPrice(selectedProduct.oldPrice)}</span>
                            )}
                          </div>

                          <DialogDescription className="text-gray-600 mb-3 sm:mb-4 leading-relaxed font-medium text-[11px] sm:text-xs">
                            {selectedProduct.description || `Experience premium quality with our ${selectedProduct.name}. This top-rated product from our ${selectedProduct.category} collection is designed for performance and style. Limited stock available at this flash sale price!`}
                          </DialogDescription>

                          {selectedProduct.prescription && (
                            <div className="bg-blue-50 border border-blue-100 p-2.5 sm:p-3 rounded-xl sm:rounded-2xl mb-3 sm:mb-4 relative overflow-hidden group">
                               <div className="relative z-10">
                                  <div className="flex items-center gap-1.5 mb-1">
                                     <div className="bg-blue-600 p-1 rounded text-white">
                                        <AlertCircle className="h-3 w-3" />
                                     </div>
                                     <h4 className="text-xs font-black tracking-tight text-blue-900 italic">Special <span className="text-blue-600">Instructions</span></h4>
                                  </div>
                                  <p className="text-[10px] font-bold text-blue-800 leading-relaxed whitespace-pre-wrap">
                                     {selectedProduct.prescription}
                                  </p>
                               </div>
                               <FileText className="absolute right-[-10px] top-[-10px] h-12 w-12 sm:h-16 sm:w-16 text-blue-600/5 rotate-12 transition-transform group-hover:scale-110" />
                            </div>
                          )}

                          <div className="grid grid-cols-2 gap-2 mb-3 sm:mb-4">
                            <div className="bg-gray-50 p-2 sm:p-2.5 rounded-xl border border-gray-100">
                              <p className="text-[9px] font-black text-gray-400 tracking-wider mb-0.5 flex items-center gap-1">
                                <ShieldCheck className="h-3 w-3 text-green-500" /> Vivi Assurance
                              </p>
                              <p className="text-[10px] font-bold">100% Original Guaranteed</p>
                            </div>
                            <div className="bg-gray-50 p-2 sm:p-2.5 rounded-xl border border-gray-100">
                              <p className="text-[9px] font-black text-gray-400 tracking-wider mb-0.5 flex items-center gap-1">
                                <Clock className="h-3 w-3 text-orange-500" /> Shopsy Express
                              </p>
                              <p className="text-[10px] font-bold">Delivery by tomorrow</p>
                            </div>
                          </div>

                          <div className="space-y-3 mb-3 sm:mb-4">
                            <div className="bg-white p-2.5 sm:p-3 rounded-xl sm:rounded-2xl border border-gray-100 shadow-2xs">
                              <h4 className="text-[11px] sm:text-xs font-black tracking-wider mb-1.5 sm:mb-2 flex items-center gap-1.5">
                                <Info className="h-3.5 w-3.5 text-orange-600" /> Specifications & Features
                              </h4>
                              <div className="space-y-1">
                                <div className="flex justify-between items-center py-1 border-b border-gray-50 text-[10px]">
                                  <span className="text-gray-400 font-bold tracking-tight">Dimensions</span>
                                  <span className="font-black">15.5 x 7.2 x 0.8 cm</span>
                                </div>
                                <div className="flex justify-between items-center py-1 border-b border-gray-50 text-[10px]">
                                  <span className="text-gray-400 font-bold tracking-tight">Weight</span>
                                  <span className="font-black">187g</span>
                                </div>
                                <div className="flex justify-between items-center py-1 border-b border-gray-50 text-[10px]">
                                  <span className="text-gray-400 font-bold tracking-tight">Materials</span>
                                  <span className="font-black">Aerospace-grade Aluminum</span>
                                </div>
                                <div className="flex justify-between items-center py-1 text-[10px]">
                                  <span className="text-gray-400 font-bold tracking-tight">Box Includes</span>
                                  <span className="font-black">Device, USB-C Cable</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </ScrollArea>
                      </TabsContent>

                      <TabsContent value="reviews" className="flex-1 flex flex-col mt-0 focus-visible:outline-none min-h-0">
                        <ScrollArea className="flex-1 pr-2 -mr-2 sm:pr-4 sm:-mr-4 max-h-[45vh] sm:max-h-[380px]">
                          <div className="space-y-4 sm:space-y-8 pb-4">
                            <div className="bg-gradient-to-br from-green-50 to-white p-3.5 sm:p-8 rounded-2xl sm:rounded-[32px] border-2 border-green-100 shadow-sm">
                              <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-6">
                                <div className="bg-orange-600 p-1.5 sm:p-2 rounded-lg sm:rounded-xl text-white">
                                  <Edit className="h-4 w-4 sm:h-5 sm:w-5" />
                                </div>
                                <h4 className="text-base sm:text-xl font-black tracking-tighter italic">Write a <span className="text-orange-600">Review</span></h4>
                              </div>
                              
                              <div className="space-y-3 sm:space-y-6">
                                <div className="space-y-1.5 sm:space-y-3">
                                  <Label className="text-[10px] font-black tracking-widest text-gray-400">How would you rate it?</Label>
                                  <StarRating
                                    value={newReviewRating}
                                    onChange={setNewReviewRating}
                                    size="lg"
                                    showLabel
                                  />
                                </div>
                                <div className="space-y-1.5 sm:space-y-2">
                                  <Label className="text-[10px] font-black tracking-widest text-gray-400">Share your experience</Label>
                                  <textarea
                                    value={newReviewComment}
                                    onChange={(e) => setNewReviewComment(e.target.value)}
                                    placeholder="What did you like? How was the delivery?"
                                    className="w-full min-h-[90px] sm:min-h-[120px] p-3 sm:p-5 rounded-2xl sm:rounded-3xl border-2 border-gray-100 focus:border-orange-500 focus:outline-none transition-all resize-none text-xs sm:text-sm font-medium bg-white/50 backdrop-blur-sm"
                                  />
                                </div>
                                <Button 
                                  onClick={handleSubmitReview}
                                  disabled={isSubmittingReview}
                                  className="w-full bg-black hover:bg-zinc-800 text-white font-black tracking-widest text-[10px] sm:text-xs h-10 sm:h-14 rounded-xl sm:rounded-2xl shadow-md sm:shadow-xl shadow-zinc-200"
                                >
                                  {isSubmittingReview ? "Submitting..." : (user ? "Post verified review" : "Login to review")}
                                </Button>
                              </div>
                            </div>

                            <div className="space-y-4 sm:space-y-6 px-1 sm:px-2">

                              <div className="flex items-center justify-between mt-4 sm:mt-8 border-b-2 border-gray-100 pb-3 sm:pb-4">
                                <h4 className="text-xs sm:text-sm font-black tracking-widest text-gray-400">Community Gallery</h4>
                                <span className="text-[10px] font-black text-orange-600 tracking-widest">{reviews.length} total reviews</span>
                              </div>

                              {reviews.length > 0 ? (
                                <div className="grid grid-cols-1 gap-3 sm:gap-4">
                                  {reviews.map((review) => (
                                    <div key={review.id} className="p-3.5 sm:p-6 rounded-2xl sm:rounded-[24px] border-2 border-gray-50 bg-white hover:border-green-100 transition-all shadow-sm hover:shadow-md">
                                      <div className="flex justify-between items-start mb-2 sm:mb-4">
                                        <div className="flex items-center gap-2.5 sm:gap-4">
                                          <div className="w-9 h-9 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-orange-600 flex items-center justify-center text-white font-black text-xs sm:text-base shadow-md sm:shadow-lg shadow-orange-100 shrink-0">
                                            {review.userName.charAt(0)}
                                          </div>
                                          <div>
                                            <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                                              <p className="text-xs sm:text-sm font-black tracking-tight">{review.userName}</p>
                                              <Badge className="bg-green-100 text-green-700 border-none font-black text-[7px] sm:text-[8px] px-1 sm:px-1.5 flex items-center gap-0.5 sm:gap-1">
                                                <BadgeCheck className="h-2.5 w-2.5 sm:h-3 sm:w-3" /> VERIFIED BUYER
                                              </Badge>
                                            </div>
                                            <div className="mt-0.5 sm:mt-1">
                                              <StarRating value={review.rating} readOnly size="sm" />
                                            </div>
                                          </div>
                                        </div>
                                        <span className="text-[9px] sm:text-[10px] text-gray-400 font-bold italic mt-0.5 sm:mt-1 shrink-0">
                                          {review.createdAt?.toDate().toLocaleDateString(undefined, { day: 'numeric', month: 'short' }) || "Just now"}
                                        </span>
                                      </div>
                                      <p className="text-xs sm:text-sm text-gray-700 font-medium leading-relaxed bg-gray-50/50 p-2.5 sm:p-4 rounded-lg sm:rounded-xl border border-gray-50 italic">
                                        "{review.comment}"
                                      </p>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <div className="text-center py-10 sm:py-20 bg-gray-50/50 rounded-2xl sm:rounded-[40px] border-2 sm:border-4 border-dashed border-gray-100">
                                  <div className="w-12 h-12 sm:w-20 sm:h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-6 shadow-sm">
                                    <User className="h-6 w-6 sm:h-10 sm:w-10 text-gray-200" />
                                  </div>
                                  <p className="text-gray-400 font-black tracking-[0.15em] sm:tracking-[0.2em] text-[10px] sm:text-xs">No reviews match your criteria yet.</p>
                                  <Button
                            variant="link"
                            className="text-orange-600 mt-2 sm:mt-4 font-black text-[10px] tracking-widest"
                          >
                            Be the first to review
                          </Button>
                                </div>
                              )}
                            </div>
                          </div>
                        </ScrollArea>
                      </TabsContent>

                      <div className="mt-3 pt-3 border-t border-gray-100 space-y-2 bg-white">
                        <div className="flex items-center gap-3 mb-1">
                          <div className="flex items-center bg-gray-50 rounded-lg p-0.5 border border-green-100">
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-7 w-7 rounded hover:bg-white hover:text-orange-600 transition-all"
                              onClick={() => setProductQuantities(prev => ({
                                ...prev,
                                [selectedProduct.id]: Math.max(1, (prev[selectedProduct.id] || 1) - 1)
                              }))}
                            >
                              <Minus className="h-3 w-3" />
                            </Button>
                            <span className="text-xs font-black w-8 text-center text-orange-600">{productQuantities[selectedProduct.id] || 1}</span>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-7 w-7 rounded hover:bg-white hover:text-orange-600 transition-all"
                              onClick={() => setProductQuantities(prev => ({
                                ...prev,
                                [selectedProduct.id]: (prev[selectedProduct.id] || 1) + 1
                              }))}
                            >
                              <Plus className="h-3 w-3" />
                            </Button>
                          </div>
                          <p className="text-[9px] font-black text-gray-400 tracking-wider">Adjust Quantity</p>
                        </div>
                        <div className="flex gap-2">
                          <Button 
                            className="flex-1 h-10 bg-orange-600 hover:bg-orange-700 text-white font-black text-xs rounded-xl shadow-md shadow-orange-200 transition-all active:scale-95"
                            onClick={() => handlePlaceOrder(selectedProduct)}
                          >
                            Buy now
                          </Button>
                          <Button 
                            variant="secondary"
                            className="flex-1 h-10 bg-white border border-orange-600 text-orange-600 hover:bg-green-50 font-black text-xs rounded-xl transition-all active:scale-95"
                            onClick={() => handleAddToCart(selectedProduct, productQuantities[selectedProduct.id] || 1)}
                          >
                            Add to cart
                          </Button>
                        </div>
                        <div className="flex gap-2">
                          <Button 
                            variant="outline" 
                            className="flex-1 h-8 rounded-lg border font-bold hover:bg-green-50 hover:text-orange-600 transition-all text-gray-700 text-[10px]"
                            onClick={() => handleAddToWishlistAction(selectedProduct)}
                          >
                            <Heart className="h-3.5 w-3.5 mr-1" /> Wishlist
                          </Button>
                          <Button variant="outline" className="flex-1 h-8 rounded-lg border font-bold hover:bg-green-50 hover:text-orange-600 transition-all text-[10px] tracking-tight">
                            Share
                          </Button>
                        </div>
                      </div>

                      {/* Related Products Section */}
                      <div className="mt-6 sm:mt-10 pt-4 sm:pt-8 border-t border-gray-100">
                        <div className="flex items-center justify-between mb-4 sm:mb-6">
                          <div>
                            <h3 className="text-lg sm:text-2xl font-black tracking-tighter italic">Recommended for <span className="text-orange-600">You</span></h3>
                            <p className="text-[9px] sm:text-[10px] font-black text-gray-400 tracking-widest mt-0.5">Customers who viewed this also bought</p>
                          </div>
                          <Badge className="bg-green-100 text-orange-600 border-none font-bold text-[9px] sm:text-[10px]">TOP PICKS</Badge>
                        </div>
                        <div className="grid grid-cols-2 gap-3 sm:gap-6 mb-6 sm:mb-10">
                          {products
                            .filter(p => p.category === selectedProduct.category && p.id !== selectedProduct.id)
                            .slice(0, 4)
                            .map((relatedP) => (
                              <div 
                                key={relatedP.id} 
                                className="group cursor-pointer bg-white rounded-2xl sm:rounded-3xl p-2 sm:p-3 border-2 border-transparent hover:border-orange-500 transition-all hover:shadow-xl hover:shadow-orange-100"
                                onClick={() => {
                                  setSelectedProduct(relatedP);
                                  // Scroll top of the dialog
                                  const scrollArea = document.querySelector('[role="dialog"] [data-radix-scroll-area-viewport]');
                                  if (scrollArea) scrollArea.scrollTo({ top: 0, behavior: 'smooth' });
                                }}
                              >
                                <div className="aspect-square rounded-xl sm:rounded-[20px] overflow-hidden bg-gray-50 mb-2 sm:mb-4 relative">
                                  <img 
                                    src={relatedP.image} 
                                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" 
                                    onError={(e) => {
                                      (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1560393464-5c69a73c5770?q=80&w=500&auto=format&fit=crop';
                                    }}
                                  />
                                  <div className="absolute top-2 right-2 bg-white/80 backdrop-blur-md p-1.5 sm:p-2 rounded-lg sm:rounded-xl opacity-0 group-hover:opacity-100 transition-opacity">
                                    <ShoppingBag className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-orange-600" />
                                  </div>
                                </div>
                                <div className="px-0.5 sm:px-1">
                                  <p className="text-[8px] sm:text-[9px] font-black text-gray-400 tracking-widest mb-0.5 sm:mb-1">{relatedP.tag || 'New Arrival'}</p>
                                  <h4 className="font-bold text-xs sm:text-sm truncate mb-1 sm:mb-2 leading-tight">{relatedP.name}</h4>
                                  <div className="flex items-center justify-between">
                                    <p className="font-black text-orange-600 text-sm sm:text-lg">{formatPrice(relatedP.price)}</p>
                                    <div className="flex items-center gap-1">
                                      <Star className="h-2.5 w-2.5 sm:h-3 sm:w-3 fill-orange-500 text-orange-500" />
                                      <span className="text-[9px] sm:text-[10px] font-bold text-gray-400">{relatedP.rating || '5.0'}</span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ))}
                        </div>
                        {products.filter(p => p.category === selectedProduct.category && p.id !== selectedProduct.id).length === 0 && (
                          <div className="bg-gray-50 rounded-2xl sm:rounded-[32px] p-6 sm:p-8 text-center border-2 border-dashed border-gray-100 opacity-60">
                             <Package className="h-6 w-6 sm:h-8 sm:w-8 text-gray-300 mx-auto mb-2" />
                             <p className="text-[10px] font-black text-gray-400 tracking-widest leading-relaxed">Checking more items in {selectedProduct.category} category...</p>
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
                          {checkoutStep === 'address' ? 'Delivery' : 'Complete'} <span className="text-orange-600">{checkoutStep === 'address' ? 'Details' : 'Purchase'}</span>
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
                              <p className="text-sm font-bold truncate max-w-[120px]">{selectedProduct.name}</p>
                              <p className="text-xs text-gray-500">Qty: {productQuantities[selectedProduct.id] || 1}</p>
                            </div>
                          </div>
                          <p className="text-lg font-black text-orange-600">
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
                                    className="rounded-xl border-gray-100 focus:border-orange-500 bg-gray-50/30 pl-10"
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
                                      className="rounded-xl border-gray-100 focus:border-orange-500 bg-gray-50/30 pl-10"
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
                                      className="rounded-xl border-gray-100 focus:border-orange-500 bg-gray-50/30 pl-10"
                                    />
                                    <Home className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                  </div>
                                </div>
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor="delivery-phone" className="text-[10px] font-black  tracking-widest text-gray-400">Phone Number</Label>
                                <div className="relative">
                                  <Input
                                    id="delivery-phone"
                                    placeholder="Phone number for delivery updates"
                                    value={deliveryPhone}
                                    onChange={(e) => setDeliveryPhone(e.target.value)}
                                    className="rounded-xl border-gray-100 focus:border-orange-500 bg-gray-50/30 pl-10"
                                  />
                                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
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
                                  className="text-orange-600 font-bold p-0 h-auto text-xs"
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
                                    paymentType === type ? 'bg-white text-orange-600 shadow-sm' : 'text-gray-400'
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
                                      ? 'border-orange-500 bg-green-50/30'
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
                                      <div className="bg-orange-600 rounded-full p-1 h-5 w-5 flex items-center justify-center">
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
                                    ? 'border-orange-500 bg-green-50/30 border-solid shadow-sm'
                                    : 'border-gray-200 hover:border-orange-200 hover:bg-orange-50/10'
                                }`}
                              >
                                <RadioGroupItem value="manual" id="manual" className="sr-only" />
                                <div className="flex items-center gap-3 w-full">
                                  <div className={`p-2 rounded-lg bg-gray-50 text-gray-400 ${selectedPaymentMethod?.id === 'manual' ? 'bg-orange-600 text-white' : ''}`}>
                                    <Plus className="h-5 w-5" />
                                  </div>
                                  <div className="flex-1">
                                    <p className="font-bold text-sm">Add New Card</p>
                                    <p className="text-[10px] text-gray-400  font-black">Secure one-time payment</p>
                                  </div>
                                  {selectedPaymentMethod?.id === 'manual' && (
                                    <div className="bg-orange-600 rounded-full p-1 h-5 w-5 flex items-center justify-center">
                                      <CheckCircle2 className="h-3 w-3 text-white" />
                                    </div>
                                  )}
                                </div>
                              </div>
                            </RadioGroup>
                            ) : paymentType === 'momo' ? (
                              <div className="space-y-4 animate-in fade-in zoom-in-95 duration-300">
                                <div className="bg-green-50 p-6 rounded-3xl border-2 border-green-100 space-y-4">
                                  <h4 className="text-sm font-black  italic tracking-tighter">Mobile <span className="text-orange-600">Money</span></h4>
                                  <div className="space-y-3">
                                    <div className="space-y-1">
                                      <Label className="text-[10px] font-black  text-gray-400">Select Provider</Label>
                                      <div className="grid grid-cols-2 gap-2">
                                        <Button variant="outline" onClick={() => setSelectedPaymentMethod({ id: 'mtn' })} className={`h-12 rounded-xl border-2 font-bold justify-start px-3 bg-white ${selectedPaymentMethod?.id === 'mtn' ? 'border-orange-500 shadow-orange-100 shadow-md' : 'border-zinc-100'}`}>
                                          <div className="w-6 h-6 bg-yellow-400 rounded-full mr-2" /> MTN
                                        </Button>
                                        <Button variant="outline" onClick={() => setSelectedPaymentMethod({ id: 'airtel' })} className={`h-12 rounded-xl border-2 font-bold justify-start px-3 bg-white ${selectedPaymentMethod?.id === 'airtel' ? 'border-orange-500 shadow-orange-100 shadow-md' : 'border-zinc-100'}`}>
                                          <div className="w-6 h-6 bg-red-600 rounded-full mr-2" /> Airtel
                                        </Button>
                                      </div>
                                    </div>
                                    <div className="space-y-1">
                                      <Label className="text-[10px] font-black  text-gray-400">Phone Number</Label>
                                      <Input placeholder="+234 ..." className="h-12 rounded-xl border-2 border-zinc-100 focus:border-orange-500 bg-white" />
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
                                      <span className="text-sm font-bold">{storeSettings?.bankName || 'WEMA BANK / ALAT'}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                      <span className="text-[10px]  font-black text-zinc-500">Account No.</span>
                                      <span className="text-lg font-black tracking-widest text-orange-400">{storeSettings?.bankAccountNumber || '0123456789'}</span>
                                    </div>
                                  </div>
                                  <p className="text-[9px] text-zinc-500 font-bold  text-center">Transfer AND CLICK "PAY NOW"</p>
                                </div>
                              </div>
                            ) : (
                               <div className="bg-gray-50 p-8 rounded-3xl border-2 border-dashed border-gray-200 text-center space-y-3 cursor-pointer" onClick={() => setSelectedPaymentMethod({ id: 'pod' })}>
                                <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mx-auto shadow-sm">
                                   <Truck className="h-6 w-6 text-orange-600" />
                                </div>
                                <h4 className="font-black  italic tracking-tighter">Pay on <span className="text-orange-600">Delivery</span></h4>
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
                                            className="rounded-xl border-gray-100 focus:border-orange-500 bg-gray-50/30 pl-10"
                                          />
                                          <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                        </div>
                                        {manualName.length > 0 && manualName.trim().split(' ').length < 2 && (
                                          <p className="text-[10px] text-orange-400 font-bold  tracking-tight">Enter First and Last Name</p>
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
                                            className="rounded-xl border-gray-100 focus:border-orange-500 bg-gray-50/30 pl-10"
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
                                            className={`rounded-xl border-gray-100 focus:border-orange-500 bg-gray-50/30 ${manualExpiry.length === 5 && !validateExpiry(manualExpiry) ? 'border-red-500' : ''}`}
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
                                            className="rounded-xl border-gray-100 focus:border-orange-500 bg-gray-50/30"
                                          />
                                        </div>
                                      </div>
                                      <div className="flex items-center gap-2 pt-2">
                                        <input 
                                          type="checkbox"
                                          id="save-card"
                                          checked={saveCard}
                                          onChange={(e) => setSaveCard(e.target.checked)}
                                          className="rounded border-orange-300 text-orange-600 focus:ring-orange-500 h-4 w-4"
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
                            <span className="font-bold text-sm">{formatPrice((typeof selectedProduct.price === 'number' ? selectedProduct.price : parseFloat(selectedProduct.price.toString().replace(/[^\d.]/g, ''))) * (productQuantities[selectedProduct.id] || 1))}</span>
                          </div>
                          <div className="flex justify-between items-center mb-4">
                            <span className="text-gray-500 font-medium text-sm">Shipping</span>
                            <span className="text-green-600 font-bold text-sm tracking-widest ">FREE</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="font-black  tracking-widest text-lg">Total</span>
                            <span className="text-2xl font-black text-orange-600 tracking-tighter">
                              {formatPrice((typeof selectedProduct.price === 'number' ? selectedProduct.price : parseFloat(selectedProduct.price.toString().replace(/[^\d.]/g, ''))) * (productQuantities[selectedProduct.id] || 1))}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="mt-8">
                        <Button 
                          className="w-full h-16 bg-orange-600 hover:bg-orange-700 text-white font-black text-xl rounded-2xl shadow-lg shadow-orange-200 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
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
              </>
            )}
          </div>
        )}
      </DialogContent>
        </Dialog>
      </div>
    </section>
  );
}
