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
const AIAssistant = lazy(() => import("./components/ai/AIAssistant"));
const CheckoutPage = lazy(() => import("./components/CheckoutPage"));
const InfoPage = lazy(() => import("./components/InfoPages"));
const SpinToWin = lazy(() => import("./components/games/SpinToWin"));

import BrandPartners from "./components/BrandPartners";
import CartDrawer from "./components/CartDrawer";
import { AuthProvider, useAuth } from "./lib/AuthContext";
import { CartProvider, useCart } from "./lib/CartContext";
import { CurrencyProvider } from "./lib/CurrencyContext";
import { API_URL } from "./lib/api";
import { db } from "./lib/firebase";
import { collection, onSnapshot, query, orderBy } from "firebase/firestore";
import { Truck, Headset, ShieldCheck, Zap, Search, X, Package } from "lucide-react";
import { motion } from "motion/react";
import { Toaster, toast } from "sonner";
import { Button } from "./components/ui/button";

function MainContent() {
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);
  const [activeInfoPage, setActiveInfoPage] = useState<string | null>(null);
  const { isOpen: isCartOpen, setIsOpen: setIsCartOpen } = useCart();
  const [showAdmin, setShowAdmin] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showDashboard, setShowDashboard] = useState(false);
  const [products, setProducts] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [wishlistCount, setWishlistCount] = useState(0);
  const [lastViewedCategory, setLastViewedCategory] = useState<string>(() => {
    return localStorage.getItem('lastViewedCategory') || '';
  });
  const { user, profile, isAdmin, loading } = useAuth();

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
      // Complement with high rated products if not enough in category
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

  // Add keyboard navigation (ArrowLeft to go back)
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
      } catch (error) {
        console.error("App products fetch error:", error);
      }
    };

    fetchProducts();
    // Poll for updates every 30 seconds since we're not using WebSockets/onSnapshot for the Python API
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
        <AIAssistant />
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
        <AIAssistant />
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
      // Only reset if we are sure the user is NOT admin
      setShowAdmin(false);
      return null;
    }
    // If loading, show a loader or just wait
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
        <AIAssistant />
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
        <AIAssistant />
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
        <AIAssistant />
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
    <div className="min-h-screen bg-[#f5f5f5] font-sans selection:bg-green-100 selection:text-purple-600">
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
        {/* Flash Sale Banner */}
        <div className="bg-purple-600 text-white py-2 overflow-hidden whitespace-nowrap">
          <motion.div 
            animate={{ x: ["100%", "-100%"] }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            className="flex items-center gap-8 font-bold  text-sm"
          >
            <span className="flex items-center gap-2"><Zap className="h-4 w-4 fill-yellow-400 text-yellow-400" /> Flash Sale: Up to 90% Off!</span>
            <span className="flex items-center gap-2"><Zap className="h-4 w-4 fill-yellow-400 text-yellow-400" /> Limited Time Only</span>
            <span className="flex items-center gap-2"><Zap className="h-4 w-4 fill-yellow-400 text-yellow-400" /> Free Shipping on First Order</span>
            <span className="flex items-center gap-2"><Zap className="h-4 w-4 fill-yellow-400 text-yellow-400" /> Flash Sale: Up to 90% Off!</span>
          </motion.div>
        </div>

        {searchQuery ? (
          <div className="py-12 bg-white">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mb-10">
              <div className="flex items-center gap-4 bg-green-50 p-8 rounded-[40px] border-2 border-green-100">
                <div className="bg-purple-600 p-4 rounded-3xl shadow-xl shadow-purple-200">
                   <Search className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h2 className="text-4xl font-black  tracking-tighter italic">Search <span className="text-purple-600">Results</span></h2>
                  <p className="text-sm font-bold text-gray-400  tracking-widest mt-1">Found {filteredProducts.length} items for <span className="text-purple-600 italic">"{searchQuery}"</span></p>
                </div>
                <Button 
                  variant="ghost" 
                  onClick={() => handleSearch("")}
                  className="ml-auto font-black  tracking-widest text-[10px] text-gray-400 hover:text-purple-600"
                >
                   Clear search <X className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </div>
            <ProductSection 
              title="Matched" 
              subtitle="Items" 
              products={filteredProducts} 
              onAddToWishlist={addToWishlist}
              onProductView={handleProductView}
            />
            {filteredProducts.length === 0 && (
              <div className="text-center py-24">
                <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-8">
                   <Package className="h-12 w-12 text-gray-200" />
                </div>
                <h3 className="text-3xl font-black  tracking-tighter mb-4 italic">No items <span className="text-purple-600">match</span> that search</h3>
                <p className="text-gray-400 font-bold  text-xs tracking-widest mb-10 max-w-sm mx-auto">Try checking your spelling or using more general keywords like "Watch" or "Jersey".</p>
                <Button 
                  onClick={() => handleSearch("")}
                  className="bg-purple-600 hover:bg-purple-700 text-white font-black rounded-2xl px-12 h-16 shadow-2xl shadow-purple-200 text-lg active:scale-95 transition-all"
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
            
            {/* Flash Sale Timer Section */}
            <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
              <div className="bg-white rounded-xl p-6 shadow-sm border border-green-100 flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                  <div className="bg-purple-600 p-3 rounded-lg text-white">
                    <Zap className="h-6 w-6 fill-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-black text-purple-600  italic tracking-tighter">Flash Sale</h2>
                    <p className="text-sm text-gray-500 font-medium">Ending in: <span className="text-black font-bold">02:45:12</span></p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="text-center">
                    <div className="bg-gray-100 w-12 h-12 rounded-lg flex items-center justify-center text-xl font-bold">02</div>
                    <span className="text-[10px]  font-bold text-gray-400">Hours</span>
                  </div>
                  <div className="text-center">
                    <div className="bg-gray-100 w-12 h-12 rounded-lg flex items-center justify-center text-xl font-bold">45</div>
                    <span className="text-[10px]  font-bold text-gray-400">Mins</span>
                  </div>
                  <div className="text-center">
                    <div className="bg-gray-100 w-12 h-12 rounded-lg flex items-center justify-center text-xl font-bold">12</div>
                    <span className="text-[10px]  font-bold text-gray-400">Secs</span>
                  </div>
                </div>
              </div>
            </section>

            <ProductSection 
              title="Flash" 
              subtitle="Deals" 
              products={products.length > 0 ? products : []} 
              onAddToWishlist={addToWishlist}
              onProductView={handleProductView}
            />
            
            {/* Secondary Promo Banners */}
            <section className="py-10">
              <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="relative bg-purple-500 rounded-3xl p-10 overflow-hidden group cursor-pointer text-white">
                  <div className="z-10 relative">
                    <p className="font-bold mb-2  tracking-widest opacity-80">Smart Tech</p>
                    <h3 className="text-3xl font-black mb-6 leading-tight">The Best Smart <br /> Watch under <br /> $20</h3>
                    <button className="bg-white text-purple-600 px-8 py-3 rounded-full text-sm font-black shadow-lg hover:scale-105 transition-transform">Shop Now</button>
                  </div>
                  <img 
                    src="https://images.unsplash.com/photo-1508685096489-723f0119762e?q=80&w=1000&auto=format&fit=crop" 
                    alt="Smart Watch" 
                    className="absolute right-[-10%] bottom-[-10%] h-[120%] object-contain group-hover:scale-110 transition-transform duration-500 mix-blend-overlay opacity-40"
                    referrerPolicy="no-referrer"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1544006659-f0b21f04cb1b?q=80&w=1000&auto=format&fit=crop';
                    }}
                  />
                </div>
                <div className="relative bg-zinc-900 rounded-3xl p-10 overflow-hidden group cursor-pointer text-white">
                  <div className="z-10 relative">
                    <p className="text-purple-500 font-bold mb-2  tracking-widest">Limited Edition</p>
                    <h3 className="text-3xl font-black mb-6 leading-tight">Meet your new <br /> Trending Furniture <br /> Design</h3>
                    <button className="bg-purple-500 text-white px-8 py-3 rounded-full text-sm font-black shadow-lg hover:scale-105 transition-transform">Shop Now</button>
                  </div>
                  <img 
                    src="https://images.unsplash.com/photo-1567016432779-094069958ea5?q=80&w=1000&auto=format&fit=crop" 
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
              onAddToWishlist={addToWishlist}
              onProductView={handleProductView}
            />

            {recommendedProducts.length > 0 && (
              <ProductSection 
                title="Recommended" 
                subtitle="For You" 
                products={recommendedProducts} 
                onAddToWishlist={addToWishlist}
                onProductView={handleProductView}
              />
            )}
            <BrandPartners />
            <PromoBanner />
          </>
        )}

        {/* Features Section */}
        <section className="py-20 bg-white border-t border-gray-100">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-3 gap-12">
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-full bg-green-50 flex items-center justify-center mb-6">
                <Truck className="h-8 w-8 text-purple-600" />
              </div>
              <h4 className="text-lg font-bold mb-2  tracking-wider">Free and Fast Delivery</h4>
              <p className="text-sm text-gray-500">Free delivery for all orders over $140</p>
            </div>
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-full bg-green-50 flex items-center justify-center mb-6">
                <Headset className="h-8 w-8 text-purple-600" />
              </div>
              <h4 className="text-lg font-bold mb-2  tracking-wider">24/7 Customer Service</h4>
              <p className="text-sm text-gray-500">Friendly 24/7 customer support</p>
            </div>
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-full bg-green-50 flex items-center justify-center mb-6">
                <ShieldCheck className="h-8 w-8 text-purple-600" />
              </div>
              <h4 className="text-lg font-bold mb-2  tracking-wider">Money Back Guarantee</h4>
              <p className="text-sm text-gray-500">We return money within 30 days</p>
            </div>
          </div>
        </section>
      </main>
      <Footer />
      <AIAssistant />
      <SpinToWin />
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
      <CurrencyProvider>
        <CartProvider>
          <Suspense fallback={<div className="min-h-screen flex items-center justify-center font-black italic tracking-tighter">Loading Vivo...</div>}>
            <MainContent />
          </Suspense>
          <Toaster position="top-center" richColors />
        </CartProvider>
      </CurrencyProvider>
    </AuthProvider>
  );
}
