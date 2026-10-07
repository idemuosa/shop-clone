import { useState, useEffect, useMemo, lazy, Suspense } from "react";
import Navbar from "./components/Navbar";
import Hero from "./components/Hero";
import CategorySection from "./components/CategorySection";
import ProductSection from "./components/ProductSection";
import PromoBanner from "./components/PromoBanner";
import Footer from "./components/Footer";
import AuthModal from "./components/auth/AuthModal";

// Lazy load large components
const AdminDashboard = lazy(() => import("./components/admin/AdminDashboard"));
const UserProfilePage = lazy(() => import("./components/profile/UserProfilePage"));
const UserDashboard = lazy(() => import("./components/dashboard/UserDashboard"));
const CheckoutPage = lazy(() => import("./components/CheckoutPage"));
const InfoPage = lazy(() => import("./components/InfoPages"));

import BrandPartners from "./components/BrandPartners";
import CartDrawer from "./components/CartDrawer";
import ScrollToTop from "./components/ScrollToTop";
import { AuthProvider, useAuth } from "./lib/AuthContext";
import { CartProvider, useCart } from "./lib/CartContext";
import { CurrencyProvider } from "./lib/CurrencyContext";
import { SocketProvider } from "./lib/SocketContext";
import { API_URL } from "./lib/api";
import { Truck, Headset, ShieldCheck, Search, X, Package } from "lucide-react";
import { Toaster, toast } from "sonner";
import { Button } from "./components/ui/button";
import { getOptimizedImageUrl } from "./lib/utils";

function MainContent() {
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);
  const [activeInfoPage, setActiveInfoPage] = useState<string | null>(null);
  const { isOpen: isCartOpen, setIsOpen: setIsCartOpen } = useCart();
  const [showAdmin, setShowAdmin] = useState(() => typeof window !== 'undefined' && localStorage.getItem('showAdmin') === 'true');
  const [showProfile, setShowProfile] = useState(false);
  const [showDashboard, setShowDashboard] = useState(false);
  const [products, setProducts] = useState<any[]>([]);
  const [isProductsLoading, setIsProductsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [wishlistCount, setWishlistCount] = useState(0);
  const [isVerifyingPayment, setIsVerifyingPayment] = useState(false);
  const [lastViewedCategory, setLastViewedCategory] = useState<string>(() => {
    return localStorage.getItem('lastViewedCategory') || '';
  });
  const { user, isAdmin, loading } = useAuth();

  // Check for Paystack reference on mount
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const reference = urlParams.get('reference');
    if (reference && !isVerifyingPayment) {
      handleVerifyPayment(reference);
    }
  }, []);

  const handleVerifyPayment = async (reference: string) => {
    setIsVerifyingPayment(true);
    toast.loading("Verifying your payment...");
    try {
      const res = await fetch(`${API_URL}/api/paystack/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reference })
      });
      const data = await res.json();
      if (data.status && data.data.status === 'success') {
        toast.dismiss();
        toast.success("Payment verified! Your order is being processed.");
        window.history.replaceState({}, document.title, "/");
      } else {
        toast.dismiss();
        toast.error("Payment verification failed.");
      }
    } catch (e) {
      toast.dismiss();
      toast.error("Error verifying payment.");
    } finally {
      setIsVerifyingPayment(false);
    }
  };

  const handleProductView = (product: any) => {
    if (product.category) {
      setLastViewedCategory(product.category);
      localStorage.setItem('lastViewedCategory', product.category);
    }
  };

  const recommendedProducts = useMemo(() => {
    if (!lastViewedCategory) {
      return products.filter(p => p.tag === 'Featured' || p.rating >= 4.5).slice(0, 12);
    }
    const categoryMatches = products.filter(p => p.category === lastViewedCategory);
    if (categoryMatches.length < 4) {
      const others = products
        .filter(p => p.category !== lastViewedCategory && p.rating >= 4)
        .slice(0, 12 - categoryMatches.length);
      return [...categoryMatches, ...others];
    }
    return categoryMatches.slice(0, 12);
  }, [products, lastViewedCategory]);

  useEffect(() => {
    if (user && !showAdmin && !showProfile) {
      setShowDashboard(true);
    } else {
      setShowDashboard(false);
    }
  }, [user, showAdmin, showProfile]);

  const addToWishlist = () => {
    setWishlistCount(prev => prev + 1);
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (showAdmin) setShowAdmin(false);
    if (showProfile) setShowProfile(false);
    if (showCheckout) setShowCheckout(false);
    setActiveInfoPage(null);
  };

  const handleCheckout = () => {
    if (!user) {
      setIsAuthModalOpen(true);
      toast.info("Please login to proceed with checkout");
      return;
    }
    setIsCartOpen(false);
    setShowCheckout(true);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        if (showCheckout) setShowCheckout(false);
        else if (activeInfoPage) setActiveInfoPage(null);
        else if (showAdmin) setShowAdmin(false);
        else if (showProfile) setShowProfile(false);
        else if (showDashboard) setShowDashboard(false);
        else if (searchQuery) setSearchQuery("");
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showCheckout, activeInfoPage, showAdmin, showProfile, showDashboard, searchQuery]);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await fetch(`${API_URL}/products/`);
        const data = await response.json();

        if (Array.isArray(data)) {
          const prods = data.map((p: any) => ({
            id: p.id,
            name: p.name,
            description: p.description,
            price: p.price,
            oldPrice: p.old_price,
            image: p.image,
            category: p.category_name || "General",
            tag: p.tag,
            rating: p.rating || 4.5,
            reviews: p.reviews_count || 0,
            sold: p.sold || 0,
            stock: p.stock || 0,
            createdAt: p.created_at
          }));
          setProducts(prods);
        }
      } catch (error) {
        console.error("App products fetch error:", error);
      } finally {
        setIsProductsLoading(false);
      }
    };

    fetchProducts();
    const interval = setInterval(fetchProducts, 30000);
    return () => clearInterval(interval);
  }, []);

  const filteredProducts = products.filter(p => {
    const name = String(p.name || "").toLowerCase();
    const category = String(p.category || "").toLowerCase();
    const query = String(searchQuery || "").toLowerCase();
    return name.includes(query) || category.includes(query);
  });

  if (showCheckout) {
    return (
      <>
        <Navbar
          onOpenAuth={() => setIsAuthModalOpen(true)}
          onOpenCart={() => setIsCartOpen(true)}
          onOpenProfile={() => {
            setShowCheckout(false);
            setShowProfile(true);
          }}
          onToggleAdmin={() => {
            setShowCheckout(false);
            setShowAdmin(true);
          }}
          onSearch={handleSearch}
          onOpenInfoPage={(page) => setActiveInfoPage(page)}
          showAdmin={showAdmin}
          wishlistCount={wishlistCount}
        />
        <CheckoutPage onBack={() => setShowCheckout(false)} />
        <CartDrawer
          isOpen={isCartOpen}
          onClose={() => setIsCartOpen(false)}
          onCheckout={handleCheckout}
        />
      </>
    );
  }

  if (activeInfoPage) {
    return (
      <>
        <Navbar
          onOpenAuth={() => setIsAuthModalOpen(true)}
          onOpenCart={() => setIsCartOpen(true)}
          onOpenProfile={() => {
            setActiveInfoPage(null);
            setShowProfile(true);
          }}
          onToggleAdmin={() => {
            setActiveInfoPage(null);
            setShowAdmin(true);
          }}
          onSearch={handleSearch}
          onOpenInfoPage={(page) => setActiveInfoPage(page)}
          showAdmin={showAdmin}
          wishlistCount={wishlistCount}
        />
        <InfoPage
          title={activeInfoPage}
          onBack={() => setActiveInfoPage(null)}
          products={products}
          onAddToWishlist={addToWishlist}
          onProductView={handleProductView}
        />
        <CartDrawer
          isOpen={isCartOpen}
          onClose={() => setIsCartOpen(false)}
          onCheckout={handleCheckout}
        />
        <Footer />
      </>
    );
  }

  if (showAdmin) {
    if (!isAdmin && !loading) {
      setShowAdmin(false);
      return null;
    }
    if (loading) return <div className="min-h-screen flex items-center justify-center font-black  italic tracking-tighter">Authenticating...</div>;

    return (
      <>
        <Navbar 
          onOpenAuth={() => setIsAuthModalOpen(true)} 
          onOpenCart={() => setIsCartOpen(true)}
          onOpenProfile={() => {
            setShowAdmin(false);
            setShowProfile(true);
          }}
          onToggleAdmin={() => setShowAdmin(false)}
          onSearch={handleSearch}
          onOpenInfoPage={(page) => setActiveInfoPage(page)}
          showAdmin={showAdmin}
          wishlistCount={wishlistCount}
        />
        <AdminDashboard />
        <CartDrawer
          isOpen={isCartOpen} 
          onClose={() => setIsCartOpen(false)} 
          onCheckout={handleCheckout}
        />
      </>
    );
  }

  if (showProfile) {
    return (
      <>
        <Navbar 
          onOpenAuth={() => setIsAuthModalOpen(true)} 
          onOpenCart={() => setIsCartOpen(true)}
          onOpenProfile={() => setShowProfile(true)}
          onToggleAdmin={() => {
            setShowProfile(false);
            setShowAdmin(true);
          }}
          onSearch={handleSearch}
          onOpenInfoPage={(page) => setActiveInfoPage(page)}
          showAdmin={showAdmin}
          wishlistCount={wishlistCount}
        />
        <UserProfilePage
          onClose={() => setShowProfile(false)}
          onSwitchToAdmin={() => {
            setShowProfile(false);
            setShowAdmin(true);
          }}
        />
        <CartDrawer
          isOpen={isCartOpen} 
          onClose={() => setIsCartOpen(false)} 
          onCheckout={handleCheckout}
        />
      </>
    );
  }

  if (showDashboard && user && !searchQuery) {
    return (
      <div className="min-h-screen bg-[#f8f9fa]">
        <Navbar 
          onOpenAuth={() => setIsAuthModalOpen(true)} 
          onOpenCart={() => setIsCartOpen(true)}
          onOpenProfile={() => {
            setShowDashboard(false);
            setShowProfile(true);
          }}
          onToggleAdmin={() => {
            setShowDashboard(false);
            setShowAdmin(true);
          }}
          onSearch={handleSearch}
          onOpenInfoPage={(page) => setActiveInfoPage(page)}
          showAdmin={showAdmin}
          wishlistCount={wishlistCount}
        />
        <UserDashboard onBrowseMore={() => setShowDashboard(false)} />
        <CartDrawer
          isOpen={isCartOpen} 
          onClose={() => setIsCartOpen(false)} 
          onCheckout={handleCheckout}
        />
        <Footer />
        <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f5f5f5] font-sans selection:bg-green-100 selection:text-orange-600">
      <Navbar 
        onOpenAuth={() => setIsAuthModalOpen(true)} 
        onOpenCart={() => setIsCartOpen(true)}
        onOpenProfile={() => setShowProfile(true)}
        onToggleAdmin={() => setShowAdmin(!showAdmin)}
        onSearch={handleSearch}
        onOpenInfoPage={(page) => setActiveInfoPage(page)}
        showAdmin={showAdmin}
        wishlistCount={wishlistCount}
      />
      <main>
        {searchQuery ? (
          <div className="py-6 sm:py-8 bg-white">
            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 mb-6">
              <div className="bg-gradient-to-r from-green-50/90 to-orange-50/40 p-4 sm:p-6 rounded-2xl md:rounded-3xl border border-green-100/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                  <div className="bg-orange-600 p-2.5 sm:p-3 rounded-2xl shadow-md shadow-orange-200 shrink-0">
                    <Search className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h2 className="text-xl sm:text-2xl md:text-3xl font-black tracking-tighter italic">
                        Search <span className="text-orange-600">Results</span>
                      </h2>
                      <span className="bg-orange-600 text-white text-[10px] sm:text-xs font-extrabold px-2.5 py-0.5 rounded-full shadow-xs">
                        {filteredProducts.length} {filteredProducts.length === 1 ? 'Item' : 'Items'}
                      </span>
                    </div>
                    <p className="text-xs sm:text-sm font-bold text-gray-500 tracking-wide mt-1 truncate max-w-full" title={searchQuery}>
                      Showing results for <span className="text-orange-600 italic font-black">"{searchQuery.length > 38 ? searchQuery.slice(0, 38) + '...' : searchQuery}"</span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-start sm:self-center shrink-0">
                  <Button
                    variant="outline"
                    onClick={() => handleSearch("")}
                    className="font-black text-[11px] sm:text-xs text-gray-600 hover:text-orange-600 hover:border-orange-300 rounded-xl h-9 px-3.5 bg-white shadow-xs transition-all flex items-center gap-1.5"
                  >
                    Clear search <X className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>

              {/* Dynamic Category Quick Pills */}
              <div className="mt-3 flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-hide no-scrollbar">
                <span className="text-[10px] font-black uppercase text-gray-400 tracking-wider whitespace-nowrap mr-1">
                  Quick Filter:
                </span>
                {["All", "Fashion", "Home & Decor", "Electronics", "Gadgets", "Watches", "Sports"].map((cat) => (
                  <button
                    key={cat}
                    onClick={() => handleSearch(cat === "All" ? "" : cat)}
                    className={`text-[11px] font-bold px-3 py-1 rounded-full border transition-all whitespace-nowrap ${
                      (cat === "All" && !searchQuery) || searchQuery.toLowerCase() === cat.toLowerCase()
                        ? "bg-orange-600 text-white border-orange-600 shadow-xs"
                        : "bg-gray-50 text-gray-600 border-gray-200 hover:border-orange-300 hover:text-orange-600 hover:bg-orange-50/50"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>
            <ProductSection 
              title="Matched" 
              subtitle="Items" 
              products={filteredProducts} 
              isLoading={isProductsLoading}
              onAddToWishlist={addToWishlist}
              onProductView={handleProductView}
            />
            {filteredProducts.length === 0 && (
              <div className="text-center py-12 sm:py-16 bg-gray-50/50 rounded-2xl md:rounded-3xl border border-dashed border-gray-200 max-w-5xl mx-auto px-4 my-6">
                <div className="w-16 h-16 sm:w-20 sm:h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm border border-gray-100">
                   <Package className="h-8 w-8 sm:h-10 sm:w-10 text-orange-400" />
                </div>
                <h3 className="text-xl sm:text-2xl font-black tracking-tighter mb-2 italic">
                  No items <span className="text-orange-600">matched</span> "{searchQuery.length > 30 ? searchQuery.slice(0, 30) + '...' : searchQuery}"
                </h3>
                <p className="text-gray-500 font-bold text-xs tracking-wide mb-6 max-w-md mx-auto">
                  Try checking your spelling, or explore popular categories below.
                </p>

                <div className="flex flex-wrap justify-center gap-2 max-w-lg mx-auto mb-6">
                  {["Fashion", "Home & Decor", "Electronics", "Gadgets", "Watches"].map((cat) => (
                    <Button
                      key={cat}
                      variant="outline"
                      size="sm"
                      onClick={() => handleSearch(cat)}
                      className="rounded-full text-xs font-bold border-gray-200 hover:border-orange-500 hover:text-orange-600 bg-white"
                    >
                      {cat}
                    </Button>
                  ))}
                </div>

                <Button 
                  onClick={() => handleSearch("")}
                  className="bg-orange-600 hover:bg-orange-700 text-white font-black rounded-xl px-8 h-12 shadow-lg shadow-orange-200 text-sm active:scale-95 transition-all"
                >
                  View all products
                </Button>
              </div>
            )}
          </div>
        ) : (
          <>
            <Hero />
            <CategorySection onSelectCategory={(cat) => handleSearch(cat === "all" ? "" : cat)} />

            <ProductSection 
              title="Featured"
              subtitle="Products"
              products={products.length > 0 ? products : []} 
              isLoading={isProductsLoading}
              onAddToWishlist={addToWishlist}
              onProductView={handleProductView}
            />
            
            <section className="py-4">
              <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="relative bg-orange-500 rounded-2xl p-5 overflow-hidden group cursor-pointer text-white">
                  <div className="z-10 relative">
                    <p className="font-bold mb-1 text-xs tracking-widest opacity-80">Smart Tech</p>
                    <h3 className="text-xl font-black mb-3 leading-tight">The Best Smart <br /> Watch under <br /> ₦20</h3>
                    <button className="bg-white text-orange-600 px-5 py-2 rounded-full text-xs font-black shadow-md hover:scale-105 transition-transform">Shop Now</button>
                  </div>
                  <img 
                    src={getOptimizedImageUrl("https://images.unsplash.com/photo-1508685096489-723f0119762e", 1000)}
                    alt="Smart Watch" 
                    className="absolute right-[-10%] bottom-[-10%] h-[120%] object-contain group-hover:scale-110 transition-transform duration-500 mix-blend-overlay opacity-40"
                    referrerPolicy="no-referrer"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1544006659-f0b21f04cb1b?q=80&w=1000&auto=format&fit=crop';
                    }}
                  />
                </div>
                <div className="relative bg-zinc-900 rounded-2xl p-5 overflow-hidden group cursor-pointer text-white">
                  <div className="z-10 relative">
                    <p className="text-orange-500 font-bold mb-1 text-xs tracking-widest">Limited Edition</p>
                    <h3 className="text-xl font-black mb-3 leading-tight">Meet your new <br /> Trending Furniture <br /> Design</h3>
                    <button className="bg-orange-500 text-white px-5 py-2 rounded-full text-xs font-black shadow-md hover:scale-105 transition-transform">Shop Now</button>
                  </div>
                  <img 
                    src={getOptimizedImageUrl("https://images.unsplash.com/photo-1567016432779-094069958ea5", 1000)}
                    alt="Furniture" 
                    className="absolute right-[-10%] bottom-[-10%] h-[120%] object-contain group-hover:scale-110 transition-transform duration-500 opacity-50"
                    referrerPolicy="no-referrer"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1592078615290-033ee584e267?q=80&w=1000&auto=format&fit=crop';
                    }}
                  />
                </div>
              </div>
            </section>

            <ProductSection 
              title="Best" 
              subtitle="Sellers" 
              products={products.filter(p => p.tag === 'Best Seller')} 
              isLoading={isProductsLoading}
              onAddToWishlist={addToWishlist}
              onProductView={handleProductView}
            />

            {recommendedProducts.length > 0 && (
              <ProductSection 
                title="Recommended" 
                subtitle="For You" 
                products={recommendedProducts} 
                isLoading={isProductsLoading}
                onAddToWishlist={addToWishlist}
                onProductView={handleProductView}
              />
            )}
            <BrandPartners />
            <PromoBanner />
          </>
        )}

        {/* Features Section */}
        <section className="py-8 bg-white border-t border-gray-100">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex flex-col items-center text-center">
              <div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center mb-2">
                <Truck className="h-5 w-5 text-orange-600" />
              </div>
              <h4 className="text-xs font-bold mb-0.5 tracking-wider">Free and Fast Delivery</h4>
              <p className="text-[10px] text-gray-500">Free delivery for all orders over ₦140</p>
            </div>
            <div className="flex flex-col items-center text-center">
              <div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center mb-2">
                <Headset className="h-5 w-5 text-orange-600" />
              </div>
              <h4 className="text-xs font-bold mb-0.5 tracking-wider">24/7 Customer Service</h4>
              <p className="text-[10px] text-gray-500">Friendly 24/7 customer support</p>
            </div>
            <div className="flex flex-col items-center text-center">
              <div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center mb-2">
                <ShieldCheck className="h-5 w-5 text-orange-600" />
              </div>
              <h4 className="text-xs font-bold mb-0.5 tracking-wider">Money Back Guarantee</h4>
              <p className="text-[10px] text-gray-500">We return money within 30 days</p>
            </div>
          </div>
        </section>
      </main>
      <Footer />
      <ScrollToTop />
      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
      <CartDrawer 
        isOpen={isCartOpen} 
        onClose={() => setIsCartOpen(false)} 
        onCheckout={handleCheckout}
      />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <SocketProvider>
        <CurrencyProvider>
          <CartProvider>
            <Suspense fallback={<div className="min-h-screen flex items-center justify-center font-black italic tracking-tighter">Loading Vivi...</div>}>
              <MainContent />
            </Suspense>
            <Toaster position="top-center" richColors />
          </CartProvider>
        </CurrencyProvider>
      </SocketProvider>
    </AuthProvider>
  );
}
