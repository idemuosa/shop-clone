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
    <section className="py-8 bg-gray-50 overflow-hidden border-t border-gray-100">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-6">
           <h2 className="text-lg sm:text-xl font-bold uppercase tracking-tight italic">Official <span className="text-orange-600">Store</span> Partners</h2>
           <p className="text-[9px] sm:text-[10px] font-semibold text-gray-400 uppercase tracking-widest mt-1">100% Authentic Brands Guaranteed</p>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-6 md:gap-10">
          {brands.map((brand, i) => (
            <motion.div
              key={brand.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 0.4, y: 0 }}
              transition={{ delay: i * 0.1 }}
              whileHover={{ opacity: 1, scale: 1.1 }}
              className="w-16 sm:w-20 md:w-24 grayscale hover:grayscale-0 transition-all cursor-pointer"
            >
              <img 
                src={brand.logo} 
                alt={brand.name} 
                className="w-full h-auto object-contain max-h-8"
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
