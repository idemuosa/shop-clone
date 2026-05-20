import { Facebook, Twitter, Instagram, Linkedin, Send, Phone, Mail, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface FooterProps {
  onOpenInfoPage?: (page: string) => void;
}

export default function Footer({ onOpenInfoPage }: FooterProps) {
  return (
    <footer className="bg-black text-white pt-20 pb-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Top Footer */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-12 mb-16">
          {/* About Us */}
          <div className="space-y-6">
            <h3 className="text-sm font-black  tracking-widest text-white italic">About Vivo</h3>
            <p className="text-xs font-bold text-gray-400 leading-relaxed italic">
              Vivo.co is Africa's fastest-growing e-commerce destination. Our mission is to bridge the gap between quality and affordability, bringing world-class products to your doorstep with unmatched speed and security.
            </p>
            <div className="pt-2">
              <p className="text-[10px] font-black text-purple-600  tracking-widest">Our Vision</p>
              <p className="text-[10px] text-gray-500 font-bold  mt-1">To democratize premium retail across the continent.</p>
            </div>
          </div>

          {/* Brand & Newsletter */}
          <div className="space-y-6">
            <h2 className="text-2xl font-black tracking-tighter  italic">Vivo<span className="text-purple-600">.co</span></h2>
            <p className="text-gray-400 text-sm leading-relaxed font-medium">
              Join the Vivo.co community and stay updated with our latest offers!
            </p>
            <div className="relative">
              <Input 
                type="email" 
                placeholder="Enter your email" 
                className="bg-zinc-900 border-zinc-800 text-white pr-12 h-12 rounded-xl focus-visible:ring-purple-500"
              />
              <Button size="icon" className="absolute right-1 top-1 h-10 w-10 bg-purple-600 hover:bg-purple-700 rounded-lg">
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Get in touch */}
          <div className="space-y-6">
            <h3 className="text-sm font-black  tracking-widest text-white italic">Get in touch</h3>
            <ul className="space-y-4 text-xs font-bold text-gray-400">
              <li className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-purple-600 shrink-0" />
                <span>123 Fashion Street, Suite 456, <br /> Lagos, Nigeria</span>
              </li>
              <li className="flex items-center gap-3">
                <Phone className="h-5 w-5 text-purple-600 shrink-0" />
                <span>+234 (0) 800-VIVO</span>
              </li>
              <li className="flex items-center gap-3" onClick={() => onOpenInfoPage?.('Help')}>
                <Mail className="h-5 w-5 text-purple-600 shrink-0" />
                <span className="cursor-pointer hover:text-purple-600 transition-colors">support@vivo.co</span>
              </li>
            </ul>
          </div>

          {/* Account */}
          <div className="space-y-6">
            <h3 className="text-sm font-black  tracking-widest text-white italic">Account</h3>
            <ul className="space-y-3 text-xs font-bold text-gray-400">
              {["My Account", "Login / Register", "Cart", "Wishlist", "Order History"].map((item) => (
                <li key={item} className="hover:text-purple-600 transition-colors cursor-pointer">{item}</li>
              ))}
            </ul>
          </div>

          {/* Quick Links */}
          <div className="space-y-6">
            <h3 className="text-sm font-black  tracking-widest text-white italic">Quick Link</h3>
            <ul className="space-y-3 text-xs font-bold text-gray-400">
              {[
                { label: "New Arrival", target: "New Arrivals" },
                { label: "Best Seller", target: "Best Sellers" },
                { label: "Flash Sales", target: "Flash Sales" },
                { label: "Help Center", target: "Help" },
                { label: "Privacy Policy", target: "Help" },
                { label: "Terms of Use", target: "Help" }
              ].map((item) => (
                <li
                  key={item.label}
                  className="hover:text-purple-600 transition-colors cursor-pointer"
                  onClick={() => onOpenInfoPage?.(item.target)}
                >
                  {item.label}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom Footer */}
        <div className="pt-8 border-t border-zinc-900 flex flex-col md:flex-row items-center justify-between gap-6">
          <p className="text-[10px] font-black  tracking-widest text-gray-500">
            © 2024 Vivo.co - All rights reserved
          </p>
          
          <div className="flex items-center gap-4">
            {[Facebook, Twitter, Instagram, Linkedin].map((Icon, idx) => (
              <a 
                key={idx} 
                href="#" 
                className="w-10 h-10 rounded-full bg-zinc-900 flex items-center justify-center hover:bg-purple-600 transition-all hover:-translate-y-1 text-white"
              >
                <Icon className="h-5 w-5" />
              </a>
            ))}
          </div>

          <div className="flex items-center gap-4">
            <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/7/78/Google_Play_Store_badge_EN.svg/1200px-Google_Play_Store_badge_EN.svg.png" alt="Google Play" className="h-10 opacity-80 hover:opacity-100 transition-opacity" referrerPolicy="no-referrer" />
            <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/3/3c/Download_on_the_App_Store_Badge.svg/1200px-Download_on_the_App_Store_Badge.svg.png" alt="App Store" className="h-10 opacity-80 hover:opacity-100 transition-opacity" referrerPolicy="no-referrer" />
          </div>
        </div>
      </div>
    </footer>
  );
}
