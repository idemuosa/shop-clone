import { useState, useEffect } from "react";
import Navbar from "./components/Navbar";
import Hero from "./components/Hero";
import CategorySection from "./components/CategorySection";
import ProductSection from "./components/ProductSection";
import PromoBanner from "./components/PromoBanner";
import Footer from "./components/Footer";
import AuthModal from "./components/auth/AuthModal";
import AdminDashboard from "./components/admin/AdminDashboard";
import UserProfilePage from "./components/profile/UserProfilePage";
import AIAssistant from "./components/ai/AIAssistant";
import SocialProofTicker from "./components/SocialProofTicker";
import BrandPartners from "./components/BrandPartners";
import SpinToWin from "./components/games/SpinToWin";
import CartDrawer from "./components/CartDrawer";
import { AuthProvider, useAuth } from "./lib/AuthContext";
import { CartProvider } from "./lib/CartContext";
import { db } from "./lib/firebase";
import { collection, onSnapshot, query, orderBy } from "firebase/firestore";
import { Truck, Headset, ShieldCheck, Zap } from "lucide-react";
import { motion } from "motion/react";
import { Toaster, toast } from "sonner";
import { Button } from "./components/ui/button";

function MainContent() {
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [showAdmin, setShowAdmin] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [products, setProducts] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [wishlistCount, setWishlistCount] = useState(0);
  const { isAdmin } = useAuth();

  const addToWishlist = () => {
    setWishlistCount(prev => prev + 1);
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (showAdmin) setShowAdmin(false);
    if (showProfile) setShowProfile(false);
  };

  const handleCheckout = () => {
    setIsCartOpen(false);
    toast.info("Checkout process initiated! Redirecting to secure payment...");
    // For now, we keep it simple since we already have a checkout logic in ProductSection
    // In a "more perfect" app, we'd open a full Checkout Modal here.
  };

  useEffect(() => {
    const q = query(collection(db, "products"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const prods = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        price: `$${doc.data().price}`,
        oldPrice: doc.data().oldPrice ? `$${doc.data().oldPrice}` : undefined
      }));
      setProducts(prods);
    });
    return () => unsubscribe();
  }, []);

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (showAdmin && isAdmin) {
    return (
      <>
        <Navbar 
          onOpenAuth={() => setIsAuthModalOpen(true)} 
          onOpenCart={() => setIsCartOpen(true)}
          onOpenProfile={() => {
            setShowAdmin(false);
            setShowProfile(true);
          }}
          onToggleAdmin={() => setShowAdmin(!showAdmin)}
          onSearch={handleSearch}
          showAdmin={showAdmin}
          wishlistCount={wishlistCount}
        />
        <AdminDashboard />
        <AIAssistant />
        <SocialProofTicker />
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
          showAdmin={showAdmin}
          wishlistCount={wishlistCount}
        />
        <UserProfilePage onClose={() => setShowProfile(false)} />
        <AIAssistant />
        <SocialProofTicker />
        <CartDrawer 
          isOpen={isCartOpen} 
          onClose={() => setIsCartOpen(false)} 
          onCheckout={handleCheckout}
        />
      </>
    );
  }

  return (
    <div className="min-h-screen bg-[#f5f5f5] font-sans selection:bg-orange-100 selection:text-orange-600">
      <Navbar 
        onOpenAuth={() => setIsAuthModalOpen(true)} 
        onOpenCart={() => setIsCartOpen(true)}
        onOpenProfile={() => setShowProfile(true)}
        onToggleAdmin={() => setShowAdmin(!showAdmin)}
        onSearch={handleSearch}
        showAdmin={showAdmin}
        wishlistCount={wishlistCount}
      />
      <main>
        {/* Flash Sale Banner */}
        <div className="bg-orange-600 text-white py-2 overflow-hidden whitespace-nowrap">
          <motion.div 
            animate={{ x: ["100%", "-100%"] }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            className="flex items-center gap-8 font-bold uppercase text-sm"
          >
            <span className="flex items-center gap-2"><Zap className="h-4 w-4 fill-yellow-400 text-yellow-400" /> Flash Sale: Up to 90% Off!</span>
            <span className="flex items-center gap-2"><Zap className="h-4 w-4 fill-yellow-400 text-yellow-400" /> Limited Time Only</span>
            <span className="flex items-center gap-2"><Zap className="h-4 w-4 fill-yellow-400 text-yellow-400" /> Free Shipping on First Order</span>
            <span className="flex items-center gap-2"><Zap className="h-4 w-4 fill-yellow-400 text-yellow-400" /> Flash Sale: Up to 90% Off!</span>
          </motion.div>
        </div>

        {searchQuery ? (
          <div className="py-10">
            <ProductSection 
              title="Search" 
              subtitle="Results" 
              products={filteredProducts} 
              onAddToWishlist={addToWishlist}
            />
            {filteredProducts.length === 0 && (
              <div className="text-center py-20">
                <p className="text-xl font-bold text-gray-400 uppercase italic tracking-tighter">No items found for "{searchQuery}"</p>
                <Button variant="link" className="text-orange-600 mt-4" onClick={() => setSearchQuery("")}>View all products</Button>
              </div>
            )}
          </div>
        ) : (
          <>
            <Hero />
            <CategorySection onSelectCategory={(cat) => handleSearch(cat === "all" ? "" : cat)} />
            
            {/* Flash Sale Timer Section */}
            <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
              <div className="bg-white rounded-xl p-6 shadow-sm border border-orange-100 flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                  <div className="bg-orange-600 p-3 rounded-lg text-white">
                    <Zap className="h-6 w-6 fill-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-black text-orange-600 uppercase italic tracking-tighter">Flash Sale</h2>
                    <p className="text-sm text-gray-500 font-medium">Ending in: <span className="text-black font-bold">02:45:12</span></p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="text-center">
                    <div className="bg-gray-100 w-12 h-12 rounded-lg flex items-center justify-center text-xl font-bold">02</div>
                    <span className="text-[10px] uppercase font-bold text-gray-400">Hours</span>
                  </div>
                  <div className="text-center">
                    <div className="bg-gray-100 w-12 h-12 rounded-lg flex items-center justify-center text-xl font-bold">45</div>
                    <span className="text-[10px] uppercase font-bold text-gray-400">Mins</span>
                  </div>
                  <div className="text-center">
                    <div className="bg-gray-100 w-12 h-12 rounded-lg flex items-center justify-center text-xl font-bold">12</div>
                    <span className="text-[10px] uppercase font-bold text-gray-400">Secs</span>
                  </div>
                </div>
              </div>
            </section>

            <ProductSection 
              title="Flash" 
              subtitle="Deals" 
              products={products.length > 0 ? products : []} 
              onAddToWishlist={addToWishlist}
            />
            
            {/* Secondary Promo Banners */}
            <section className="py-10">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="relative bg-orange-500 rounded-3xl p-10 overflow-hidden group cursor-pointer text-white">
                  <div className="z-10 relative">
                    <p className="font-bold mb-2 uppercase tracking-widest opacity-80">Smart Tech</p>
                    <h3 className="text-4xl font-black mb-6 leading-tight">The Best Smart <br /> Watch under <br /> $20</h3>
                    <button className="bg-white text-orange-600 px-8 py-3 rounded-full text-sm font-black shadow-lg hover:scale-105 transition-transform">Shop Now</button>
                  </div>
                  <img 
                    src="https://images.unsplash.com/photo-1508685096489-723f0119762e?q=80&w=1000&auto=format&fit=crop" 
                    alt="Smart Watch" 
                    className="absolute right-[-10%] bottom-[-10%] h-[120%] object-contain group-hover:scale-110 transition-transform duration-500 mix-blend-overlay opacity-40"
                    referrerPolicy="no-referrer"
                  />
                </div>
                <div className="relative bg-zinc-900 rounded-3xl p-10 overflow-hidden group cursor-pointer text-white">
                  <div className="z-10 relative">
                    <p className="text-orange-500 font-bold mb-2 uppercase tracking-widest">Limited Edition</p>
                    <h3 className="text-4xl font-black mb-6 leading-tight">Meet your new <br /> Trending Furniture <br /> Design</h3>
                    <button className="bg-orange-500 text-white px-8 py-3 rounded-full text-sm font-black shadow-lg hover:scale-105 transition-transform">Shop Now</button>
                  </div>
                  <img 
                    src="https://images.unsplash.com/photo-1567016432779-094069958ea5?q=80&w=1000&auto=format&fit=crop" 
                    alt="Furniture" 
                    className="absolute right-[-10%] bottom-[-10%] h-[120%] object-contain group-hover:scale-110 transition-transform duration-500 opacity-50"
                    referrerPolicy="no-referrer"
                  />
                </div>
              </div>
            </section>

            <ProductSection 
              title="Best" 
              subtitle="Sellers" 
              products={products.filter(p => p.tag === 'Best Seller')} 
              onAddToWishlist={addToWishlist}
            />
            <BrandPartners />
            <PromoBanner />
          </>
        )}

        {/* Features Section */}
        <section className="py-20 bg-white border-t border-gray-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-3 gap-12">
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-full bg-orange-50 flex items-center justify-center mb-6">
                <Truck className="h-8 w-8 text-orange-600" />
              </div>
              <h4 className="text-lg font-bold mb-2 uppercase tracking-wider">Free and Fast Delivery</h4>
              <p className="text-sm text-gray-500">Free delivery for all orders over $140</p>
            </div>
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-full bg-orange-50 flex items-center justify-center mb-6">
                <Headset className="h-8 w-8 text-orange-600" />
              </div>
              <h4 className="text-lg font-bold mb-2 uppercase tracking-wider">24/7 Customer Service</h4>
              <p className="text-sm text-gray-500">Friendly 24/7 customer support</p>
            </div>
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-full bg-orange-50 flex items-center justify-center mb-6">
                <ShieldCheck className="h-8 w-8 text-orange-600" />
              </div>
              <h4 className="text-lg font-bold mb-2 uppercase tracking-wider">Money Back Guarantee</h4>
              <p className="text-sm text-gray-500">We return money within 30 days</p>
            </div>
          </div>
        </section>
      </main>
      <Footer />
      <AIAssistant />
      <SocialProofTicker />
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
      <CartProvider>
        <MainContent />
        <Toaster position="top-center" richColors />
      </CartProvider>
    </AuthProvider>
  );
}
