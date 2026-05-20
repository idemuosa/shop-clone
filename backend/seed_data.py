import requests
import json
import time

BASE_URL = "http://localhost:8000"

categories = [
    {"name": "Electronics", "image": "https://images.unsplash.com/photo-1498049794561-7780e7231661?q=80&w=1000&auto=format&fit=crop"},
    {"name": "Fashion", "image": "https://images.unsplash.com/photo-1445205170230-053b83016050?q=80&w=1000&auto=format&fit=crop"},
    {"name": "Home & Decor", "image": "https://images.unsplash.com/photo-1513519245088-0e12902e5a38?q=80&w=1000&auto=format&fit=crop"},
    {"name": "Sports", "image": "https://images.unsplash.com/photo-1461896836934-ffe607ba8211?q=80&w=1000&auto=format&fit=crop"},
    {"name": "Footwear", "image": "https://images.unsplash.com/photo-1542291026-7eec264c27ff?q=80&w=1000&auto=format&fit=crop"}
]

products = [
    {
        "name": "Samsung Galaxy S24 Ultra",
        "description": "Experience the ultimate smartphone with AI-powered camera features, titanium frame, and the fastest processor.",
        "price": 1299.99,
        "old_price": 1399.99,
        "image": "https://images.unsplash.com/photo-1707246135650-681966144e5d?q=80&w=1000&auto=format&fit=crop",
        "category_id": 1,
        "tag": "New Arrival",
        "stock": 50,
        "sold": 120
    },
    {
        "name": "Adidas Ultraboost Light",
        "description": "The most responsive Ultraboost ever. Feel the epic energy in every step with our lightest foam.",
        "price": 180.00,
        "old_price": 220.00,
        "image": "https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?q=80&w=1000&auto=format&fit=crop",
        "category_id": 5,
        "tag": "Best Seller",
        "stock": 100,
        "sold": 500
    },
    {
        "name": "Samsung 65\" Neo QLED 8K",
        "description": "Stunning clarity and detail. Transform your living room into a cinema with Quantum Matrix Technology Pro.",
        "price": 2499.00,
        "old_price": 3200.00,
        "image": "https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?q=80&w=1000&auto=format&fit=crop",
        "category_id": 1,
        "tag": "Featured",
        "stock": 15,
        "sold": 45
    },
    {
        "name": "Adidas Originals Track Jacket",
        "description": "Iconic sporty style with the classic 3-stripes. Made from recycled materials for a sustainable future.",
        "price": 75.00,
        "old_price": 95.00,
        "image": "https://images.unsplash.com/photo-1520975954732-35dd2229969e?q=80&w=1000&auto=format&fit=crop",
        "category_id": 2,
        "tag": "Flash Sale",
        "stock": 200,
        "sold": 1500
    },
    {
        "name": "Samsung Galaxy Buds3 Pro",
        "description": "Premium sound quality with active noise cancellation and ergonomic fit for all-day comfort.",
        "price": 249.99,
        "old_price": 299.99,
        "image": "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?q=80&w=1000&auto=format&fit=crop",
        "category_id": 1,
        "tag": "New Arrival",
        "stock": 75,
        "sold": 300
    },
    {
        "name": "Smart Ultra Watch Pro",
        "description": "The ultimate smartwatch with heart rate monitoring, GPS, and 7-day battery life.",
        "price": 19.99,
        "old_price": 89.99,
        "image": "https://images.unsplash.com/photo-1508685096489-723f0119762e?q=80&w=1000&auto=format&fit=crop",
        "category_id": 1,
        "tag": "Flash Sale",
        "stock": 150,
        "sold": 1200
    }
]

def seed():
    print(f"Connecting to {BASE_URL}...")

    # Wait for server to be ready
    max_retries = 5
    for i in range(max_retries):
        try:
            requests.get(f"{BASE_URL}/")
            break
        except:
            if i == max_retries - 1:
                print(f"Error: Could not connect to backend at {BASE_URL}. Is it running?")
                return
            print(f"Waiting for server... (attempt {i+1}/{max_retries})")
            time.sleep(2)

    print("Seeding categories...")
    for cat in categories:
        try:
            res = requests.post(f"{BASE_URL}/categories/", json=cat)
            if res.status_code == 200:
                print(f" Added Category: {cat['name']}")
        except Exception as e:
            print(f" Error adding category {cat['name']}: {e}")

    print("\nSeeding products...")
    for prod in products:
        try:
            res = requests.post(f"{BASE_URL}/products/", json=prod)
            if res.status_code == 200:
                print(f" Added Product: {prod['name']}")
            else:
                print(f" Failed to add {prod['name']}: {res.text}")
        except Exception as e:
            print(f" Error adding product {prod['name']}: {e}")

    print("\nSuccess! Database seeded with Samsung and Adidas products.")

if __name__ == "__main__":
    seed()
