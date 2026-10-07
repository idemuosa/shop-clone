import { motion } from "motion/react";

const brands = [
  { name: "Apple", logo: "https://upload.wikimedia.org/wikipedia/commons/f/fa/Apple_logo_black.svg" },
  { name: "Samsung", logo: "https://upload.wikimedia.org/wikipedia/commons/2/24/Samsung_Logo.svg" },
  { name: "Nike", logo: "https://upload.wikimedia.org/wikipedia/commons/a/a6/Logo_NIKE.svg" },
  { name: "LG", logo: "https://upload.wikimedia.org/wikipedia/commons/b/bf/LG_logo_%282015%29.svg" },
  { name: "Sony", logo: "https://upload.wikimedia.org/wikipedia/commons/c/ca/Sony_logo.svg" },
  { name: "Adidas", logo: "https://upload.wikimedia.org/wikipedia/commons/2/20/Adidas_Logo.svg" },
];

export default function BrandPartners() {
  return (
    <section className="py-4 bg-gray-50 overflow-hidden border-t border-gray-100">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-3">
           <h2 className="text-base font-black uppercase tracking-tighter italic">Official <span className="text-orange-600">Store</span> Partners</h2>
           <p className="text-[8px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">100% Authentic Brands Guaranteed</p>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-3 md:gap-6">
          {brands.map((brand, i) => (
            <motion.div
              key={brand.name}
              initial={{ opacity: 0, y: 5 }}
              whileInView={{ opacity: 0.4, y: 0 }}
              transition={{ delay: i * 0.03 }}
              whileHover={{ opacity: 1, scale: 1.05 }}
              className="w-12 md:w-16 grayscale hover:grayscale-0 transition-all cursor-pointer"
            >
              <img 
                src={brand.logo} 
                alt={brand.name} 
                className="w-full h-auto object-contain max-h-5"
                referrerPolicy="no-referrer"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = 'https://placehold.co/150?text=' + brand.name;
                }}
              />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
