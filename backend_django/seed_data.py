import os
import django
import random

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from api.models import Category, Product

def seed():
    # Categories
    categories = [
        {"name": "Electronics", "image": "https://images.unsplash.com/photo-1498049794561-7780e7231661?q=80&w=400&auto=format&fit=crop"},
        {"name": "Fashion", "image": "https://images.unsplash.com/photo-1445205170230-053b83016050?q=80&w=400&auto=format&fit=crop"},
        {"name": "Home & Decor", "image": "https://images.unsplash.com/photo-1513519245088-0e12902e5a38?q=80&w=400&auto=format&fit=crop"},
        {"name": "Footwear", "image": "https://images.unsplash.com/photo-1542291026-7eec264c27ff?q=80&w=400&auto=format&fit=crop"},
        {"name": "Gadgets", "image": "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?q=80&w=400&auto=format&fit=crop"},
        {"name": "Books", "image": "https://images.unsplash.com/photo-1544947950-fa07a98d237f?q=80&w=400&auto=format&fit=crop"},
        {"name": "Laptops", "image": "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?q=80&w=400&auto=format&fit=crop"},
    ]

    for cat_data in categories:
        Category.objects.get_or_create(name=cat_data["name"], defaults={"image": cat_data["image"]})

    # Products
    cat_objs = list(Category.objects.all())
    product_data = [
        {
            "name": "Samsung Galaxy S24 Ultra",
            "description": "Experience the ultimate smartphone with AI camera features.",
            "price": 1299.99,
            "old_price": 1399.99,
            "image": "https://images.unsplash.com/photo-1707246135650-681966144e5d?q=80&w=600&auto=format&fit=crop",
            "tag": "New Arrival",
            "stock": 50,
            "sold": 120,
            "prescription": "Professional use only. Keep away from extreme heat."
        },
        {
            "name": "Adidas Ultraboost Light",
            "description": "The most responsive Ultraboost ever.",
            "price": 180.00,
            "old_price": 220.00,
            "image": "https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?q=80&w=600&auto=format&fit=crop",
            "tag": "Best Seller",
            "stock": 100,
            "sold": 500,
            "prescription": "Wash cold, air dry only. Do not bleach."
        },
        {
            "name": "Smart Ultra Watch Pro",
            "description": "The ultimate smartwatch with 7-day battery life.",
            "price": 19.99,
            "old_price": 89.99,
            "image": "https://images.unsplash.com/photo-1508685096489-723f0119762e?q=80&w=600&auto=format&fit=crop",
            "tag": "Flash Sale",
            "stock": 150,
            "sold": 1200,
            "prescription": "IP68 water resistant. Charging requires 5V/1A adapter."
        },
        {
            "name": "Wireless Noise Cancelling Headphones",
            "description": "Premium sound quality with active noise cancellation.",
            "price": 299.99,
            "old_price": 349.99,
            "image": "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?q=80&w=600&auto=format&fit=crop",
            "tag": "Trending",
            "stock": 75,
            "sold": 300
        },
        {
            "name": "Minimalist Ceramic Vase",
            "description": "Handcrafted ceramic vase for modern home decor.",
            "price": 45.00,
            "old_price": 60.00,
            "image": "https://images.unsplash.com/photo-1581783898377-1c85bf937427?q=80&w=600&auto=format&fit=crop",
            "tag": "Home Essential",
            "stock": 200,
            "sold": 80
        }
    ]

    for p in product_data:
        cat = random.choice(cat_objs)
        Product.objects.get_or_create(
            name=p["name"],
            defaults={
                "description": p["description"],
                "price": p["price"],
                "old_price": p["old_price"],
                "image": p["image"],
                "category": cat,
                "tag": p["tag"],
                "stock": p["stock"],
                "sold": p["sold"],
                "prescription": p.get("prescription"),
                "rating": random.uniform(3.5, 5.0),
                "reviews_count": random.randint(10, 500)
            }
        )

    print("Database seeded successfully!")

if __name__ == "__main__":
    seed()
