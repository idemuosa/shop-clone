import { Facebook, Twitter, Instagram, Linkedin, Send, Phone, Mail, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { collection, query, onSnapshot } from "firebase/firestore";

interface FooterProps {
  onOpenInfoPage?: (page: string) => void;
}

export default function Footer({ onOpenInfoPage }: FooterProps) {
  const [settings, setSettings] = useState<any>(null);

  useEffect(() => {
    const q = query(collection(db, 'settings'));
    const unsubscribe = onSnapshot(q, (snap) => {
      if (!snap.empty) setSettings(snap.docs[0].data());
    });
    return () => unsubscribe();
  }, []);

  return (
    <footer className="bg-black text-white pt-8 pb-6">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Top Footer */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6 mb-8">
          {/* About Us */}
          <div className="space-y-2.5">
            <h3 className="text-xs font-black tracking-widest text-white italic">About {settings?.storeName || 'Vivi'}</h3>
            <p className="text-[11px] font-medium text-gray-400 leading-relaxed italic">
              {settings?.storeName || 'Vivi.co'} is Africa's fastest-growing e-commerce destination bringing quality products with speed and security.
            </p>
          </div>

          {/* Brand & Newsletter */}
          <div className="space-y-2.5">
            <h2 className="text-lg font-black tracking-tighter italic">{settings?.logoUrl || 'Vivi'}<span className="text-orange-600">.co</span></h2>
            <p className="text-gray-400 text-[11px] leading-snug font-medium">
              Join the {settings?.storeName || 'Vivi.co'} community!
            </p>
            <div className="relative">
              <Input 
                type="email" 
                placeholder="Enter email"
                className="bg-zinc-900 border-zinc-800 text-white pr-9 h-8 rounded-lg text-xs focus-visible:ring-orange-500"
              />
              <Button size="icon" className="absolute right-0.5 top-0.5 h-7 w-7 bg-orange-600 hover:bg-orange-700 rounded-md">
                <Send className="h-3 w-3" />
              </Button>
            </div>
          </div>

          {/* Get in touch */}
          <div className="space-y-2.5">
            <h3 className="text-xs font-black tracking-widest text-white italic">Get in touch</h3>
            <ul className="space-y-2 text-[11px] font-medium text-gray-400">
              <li className="flex items-start gap-2">
                <MapPin className="h-3.5 w-3.5 text-orange-600 shrink-0 mt-0.5" />
                <span>{settings?.storeAddress || '123 Fashion Street, Lagos, Nigeria'}</span>
              </li>
              <li className="flex items-center gap-2">
                <Phone className="h-3.5 w-3.5 text-orange-600 shrink-0" />
                <span>{settings?.storePhone || '+234 (0) 800-VIVI'}</span>
              </li>
              <li className="flex items-center gap-2" onClick={() => onOpenInfoPage?.('Help')}>
                <Mail className="h-3.5 w-3.5 text-orange-600 shrink-0" />
                <span className="cursor-pointer hover:text-orange-600 transition-colors">{settings?.storeEmail || 'support@vivi.co'}</span>
              </li>
            </ul>
          </div>

          {/* Account */}
          <div className="space-y-2.5">
            <h3 className="text-xs font-black tracking-widest text-white italic">Account</h3>
            <ul className="space-y-1.5 text-xs md:text-sm font-medium text-gray-400">
              {["My Account", "Login / Register", "Cart", "Wishlist", "Order History"].map((item) => (
                <li key={item} className="hover:text-orange-600 transition-colors cursor-pointer">{item}</li>
              ))}
            </ul>
          </div>

          {/* Quick Links */}
          <div className="space-y-2.5">
            <h3 className="text-xs font-black tracking-widest text-white italic">Quick Link</h3>
            <ul className="space-y-1.5 text-xs md:text-sm font-medium text-gray-400">
              {[
                { label: "New Arrival", target: "New Arrivals" },
                { label: "Best Seller", target: "Best Sellers" },
                { label: "Help Center", target: "Help" },
                { label: "Privacy Policy", target: "Help" },
                { label: "Terms of Use", target: "Help" }
              ].map((item) => (
                <li
                  key={item.label}
                  className="hover:text-orange-600 transition-colors cursor-pointer"
                  onClick={() => onOpenInfoPage?.(item.target)}
                >
                  {item.label}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom Footer */}
        <div className="pt-4 border-t border-zinc-900 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-[9px] font-bold tracking-widest text-gray-500">
            © 2024 {settings?.storeName || 'Vivi.co'} - All rights reserved
          </p>
          
          <div className="flex items-center gap-2.5">
            {[
              { Icon: Facebook, url: settings?.facebookUrl },
              { Icon: Twitter, url: settings?.twitterUrl },
              { Icon: Instagram, url: settings?.instagramUrl },
              { Icon: Linkedin, url: '#' }
            ].map((social, idx) => (
              <a 
                key={idx} 
                href={social.url || '#'}
                target="_blank"
                rel="noopener noreferrer"
                className="w-7 h-7 rounded-full bg-zinc-900 flex items-center justify-center hover:bg-orange-600 transition-all hover:-translate-y-0.5 text-white"
              >
                <social.Icon className="h-3.5 w-3.5" />
              </a>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/7/78/Google_Play_Store_badge_EN.svg/1200px-Google_Play_Store_badge_EN.svg.png" alt="Google Play" className="h-7 opacity-80 hover:opacity-100 transition-opacity" referrerPolicy="no-referrer" />
            <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/3/3c/Download_on_the_App_Store_Badge.svg/1200px-Download_on_the_App_Store_Badge.svg.png" alt="App Store" className="h-7 opacity-80 hover:opacity-100 transition-opacity" referrerPolicy="no-referrer" />
          </div>
        </div>
      </div>
    </footer>
  );
}
