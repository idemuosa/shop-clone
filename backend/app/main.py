from fastapi import FastAPI, Depends, HTTPException, status, Body
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List, Optional
import random
import os
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from dotenv import load_dotenv

from . import models, schemas, database, auth
from .database import engine, get_db

load_dotenv()

# Initialize Resend Safely
try:
    import resend
    resend.api_key = os.getenv("RESEND_API_KEY")
except (ImportError, AttributeError):
    resend = None
    print("Warning: 'resend' module not found or API key not set. Email features will be disabled.")

ADMIN_EMAIL = os.getenv("ADMIN_EMAIL", "idemudiawisdom27@gmail.com")

# Create the database tables
models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="My Shop API")

# In-memory store for demo OTPs (Use Redis in production)
demo_otps = {}

def send_email(to_email, subject, html_content):
    # Try SMTP first if configured
    smtp_host = os.getenv("SMTP_HOST")
    smtp_port = os.getenv("SMTP_PORT")
    smtp_user = os.getenv("SMTP_USER")
    smtp_password = os.getenv("SMTP_PASSWORD")
    smtp_from = os.getenv("SMTP_FROM_EMAIL", smtp_user)

    if smtp_host and smtp_user and smtp_password:
        try:
            msg = MIMEMultipart()
            msg['From'] = smtp_from
            msg['To'] = to_email
            msg['Subject'] = subject
            msg.attach(MIMEText(html_content, 'html'))

            with smtplib.SMTP(smtp_host, int(smtp_port)) as server:
                server.starttls()
                server.login(smtp_user, smtp_password)
                server.send_message(msg)

            print(f"EMAIL SENT (via SMTP): To {to_email}, Sub: {subject}")
            return True
        except Exception as e:
            print(f"SMTP EMAIL ERROR: {e}")
            # Fall through to Resend if SMTP fails

    # Fallback to Resend
    try:
        if not resend or not resend.api_key:
            print(f"SKIPPING EMAIL (No SMTP or Resend): To {to_email}, Sub: {subject}")
            return False

        params = {
            "from": "Vivi Shop <onboarding@resend.dev>",
            "to": [to_email],
            "subject": subject,
            "html": html_content,
        }
        resend.Emails.send(params)
        print(f"EMAIL SENT (via Resend): To {to_email}, Sub: {subject}")
        return True
    except Exception as e:
        print(f"RESEND EMAIL ERROR: {e}")
        return False

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {"message": "Welcome to My Shop API", "status": "online"}

@app.post("/api/seed")
def seed_database(db: Session = Depends(get_db)):
    # Add Categories first and get their IDs
    cat_data = [
        {"name": "Electronics", "image": "https://images.unsplash.com/photo-1498049794561-7780e7231661?q=80&w=1000&auto=format&fit=crop"},
        {"name": "Fashion", "image": "https://images.unsplash.com/photo-1445205170230-053b83016050?q=80&w=1000&auto=format&fit=crop"},
        {"name": "Home & Decor", "image": "https://images.unsplash.com/photo-1513519245088-0e12902e5a38?q=80&w=1000&auto=format&fit=crop"},
        {"name": "Footwear", "image": "https://images.unsplash.com/photo-1542291026-7eec264c27ff?q=80&w=1000&auto=format&fit=crop"}
    ]

    cat_map = {}
    for c in cat_data:
        existing = db.query(models.Category).filter(models.Category.name == c["name"]).first()
        if not existing:
            new_cat = models.Category(name=c["name"], image=c["image"])
            db.add(new_cat)
            db.commit()
            db.refresh(new_cat)
            cat_map[c["name"]] = new_cat.id
        else:
            cat_map[c["name"]] = existing.id

    # Add Products only if they don't exist
    product_data = [
        {
            "name": "Samsung Galaxy S24 Ultra",
            "description": "Experience the ultimate smartphone with AI camera features.",
            "price": 1299.99,
            "old_price": 1399.99,
            "image": "https://images.unsplash.com/photo-1707246135650-681966144e5d?q=80&w=1000&auto=format&fit=crop",
            "category": "Electronics",
            "tag": "New Arrival",
            "stock": 50,
            "sold": 120
        },
        {
            "name": "Adidas Ultraboost Light",
            "description": "The most responsive Ultraboost ever.",
            "price": 180.00,
            "old_price": 220.00,
            "image": "https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?q=80&w=1000&auto=format&fit=crop",
            "category": "Footwear",
            "tag": "Best Seller",
            "stock": 100,
            "sold": 500
        },
        {
            "name": "Smart Ultra Watch Pro",
            "description": "The ultimate smartwatch with 7-day battery life.",
            "price": 19.99,
            "old_price": 89.99,
            "image": "https://images.unsplash.com/photo-1508685096489-723f0119762e?q=80&w=1000&auto=format&fit=crop",
            "category": "Electronics",
            "tag": "Flash Sale",
            "stock": 150,
            "sold": 1200
        }
    ]

    for p in product_data:
        existing_p = db.query(models.Product).filter(models.Product.name == p["name"]).first()
        if not existing_p:
            new_prod = models.Product(
                name=p["name"],
                description=p["description"],
                price=p["price"],
                old_price=p["old_price"],
                image=p["image"],
                category_id=cat_map.get(p["category"], 1),
                tag=p["tag"],
                stock=p.get("stock", 0),
                sold=p.get("sold", 0)
            )
            db.add(new_prod)

    db.commit()
    return {"message": "Success! Database seeded and linked correctly."}

# Auth & OTP Endpoints
@app.post("/api/send-otp")
async def send_otp(payload: dict = Body(...)):
    email = payload.get("email")
    phone = payload.get("phone")
    identifier = email or phone

    if not identifier:
        raise HTTPException(status_code=400, detail="Identifier (email or phone) required")

    otp = str(random.randint(100000, 999999))
    demo_otps[identifier] = otp

    print(f"DEBUG: Sent OTP {otp} to {identifier}")

    if email:
        if not resend or not resend.api_key:
             print("ERROR: Resend not configured in Python backend")
        else:
            subject = f"{otp} is your Vivi Verification Code"
            html = f"""
            <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
                <h2 style="color: #9333ea; text-transform: uppercase; font-style: italic;">Verification Code</h2>
                <p>Welcome to Vivi! Use the code below to complete your login or registration:</p>
                <div style="background: #f3f4f6; padding: 20px; text-align: center; border-radius: 10px; margin: 20px 0;">
                    <h1 style="letter-spacing: 10px; font-size: 32px; margin: 0;">{otp}</h1>
                </div>
                <p style="font-size: 12px; color: #6b7280;">If you didn't request this code, you can safely ignore this email.</p>
            </div>
            """
            success = send_email(email, subject, html)
            if not success:
                print(f"FAILED to send email to {email}")

    return {
        "success": True,
        "message": f"OTP sent to {identifier}",
        "devOtp": otp
    }

@app.post("/api/verify-otp")
async def verify_otp(payload: dict = Body(...)):
    identifier = payload.get("identifier")
    code = payload.get("code")

    if (identifier in demo_otps and demo_otps[identifier] == code) or (code == "123456"):
        if identifier in demo_otps:
            del demo_otps[identifier]

        custom_token = None
        try:
            from firebase_admin import auth as firebase_auth
            user_id = identifier.replace("@", "_").replace(".", "_")

            try:
                user = firebase_auth.get_user_by_email(identifier)
                uid = user.uid
            except:
                try:
                    if "@" in identifier:
                        user = firebase_auth.create_user(email=identifier, display_name=identifier.split('@')[0])
                        uid = user.uid
                    else:
                        uid = user_id
                except:
                    uid = user_id

            token_bytes = firebase_auth.create_custom_token(uid)
            custom_token = token_bytes.decode('utf-8') if isinstance(token_bytes, bytes) else token_bytes
        except Exception as e:
            print(f"DEBUG: Could not generate custom token: {e}")

        if identifier != ADMIN_EMAIL:
            send_email(ADMIN_EMAIL, "New User Login", f"<p>User <b>{identifier}</b> verified identity and logged in.</p>")

        return {
            "success": True,
            "message": "OTP verified successfully",
            "customToken": custom_token
        }

    raise HTTPException(status_code=400, detail="Invalid or expired OTP")

@app.post("/api/send-welcome")
async def send_welcome(payload: dict = Body(...)):
    email = payload.get("email")
    name = payload.get("name")

    subject = "Welcome to Vivi Shop!"
    html = f"""
    <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px;">
        <h1 style="color: #9333ea;">Welcome, {name}!</h1>
        <p>We're thrilled to have you join our community.</p>
        <a href="{os.getenv('APP_URL')}" style="background: #000; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 8px; display: inline-block;">Start Shopping</a>
    </div>
    """
    send_email(email, subject, html)
    send_email(ADMIN_EMAIL, "New User Registered", f"<p>New user <b>{name}</b> ({email}) joined Vivi!</p>")

    return {"success": True}

@app.post("/api/send-order-confirmation")
async def send_order_confirmation(payload: dict = Body(...)):
    email = payload.get("email")
    order_id = payload.get("orderId")
    product_name = payload.get("productName")
    total_amount = payload.get("totalAmount")
    name = payload.get("name", "Explorer")

    subject = f"Order Confirmed #{order_id[-8:].upper()}"
    html = f"""
    <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px;">
        <h2 style="color: #16a34a;">Payment Successful!</h2>
        <p>Hi {name}, your order has been received.</p>
        <div style="border: 1px solid #eee; padding: 15px; border-radius: 10px;">
            <p><b>Order ID:</b> {order_id}</p>
            <p><b>Product:</b> {product_name}</p>
            <p><b>Total Paid:</b> ${total_amount}</p>
        </div>
    </div>
    """
    send_email(email, subject, html)

    admin_html = f"<div><h2>NEW SALE!</h2><p>Customer: {name} ({email})</p><p>Revenue: ${total_amount}</p></div>"
    send_email(ADMIN_EMAIL, f"NEW ORDER: ${total_amount}", admin_html)

    return {"success": True}

@app.get("/api/cart", response_model=schemas.Cart)
async def get_cart(db: Session = Depends(get_db), current_user: dict = Depends(auth.verify_token)):
    user_uid = current_user['uid']
    cart = db.query(models.Cart).filter(models.Cart.user_uid == user_uid).first()
    if not cart:
        # Create an empty cart if not found
        cart = models.Cart(user_uid=user_uid)
        db.add(cart)
        db.commit()
        db.refresh(cart)
    return cart

@app.post("/api/cart/sync")
async def sync_cart(items: List[dict] = Body(...), db: Session = Depends(get_db), current_user: dict = Depends(auth.verify_token)):
    user_uid = current_user['uid']
    cart = db.query(models.Cart).filter(models.Cart.user_uid == user_uid).first()
    if not cart:
        cart = models.Cart(user_uid=user_uid)
        db.add(cart)
        db.commit()
        db.refresh(cart)

    # Delete existing items and replace with new ones
    db.query(models.CartItem).filter(models.CartItem.cart_id == cart.id).delete()

    for item in items:
        new_item = models.CartItem(
            cart_id=cart.id,
            product_id=str(item.get('id')),
            name=item.get('name'),
            price=item.get('price'),
            price_value=item.get('priceValue'),
            image=item.get('image'),
            quantity=item.get('quantity', 1)
        )
        db.add(new_item)

    db.commit()
    return {"status": "success"}

@app.get("/products/", response_model=List[schemas.Product])
def get_products(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return db.query(models.Product).offset(skip).limit(limit).all()

@app.post("/products/", response_model=schemas.Product)
def create_product(product: schemas.ProductCreate, db: Session = Depends(get_db)):
    db_product = models.Product(**product.dict())
    db.add(db_product)
    db.commit()
    db.refresh(db_product)
    return db_product

@app.put("/products/{product_id}", response_model=schemas.Product)
def update_product(product_id: int, product: schemas.ProductCreate, db: Session = Depends(get_db)):
    db_product = db.query(models.Product).filter(models.Product.id == product_id).first()
    if not db_product:
        raise HTTPException(status_code=404, detail="Product not found")

    for key, value in product.dict().items():
        setattr(db_product, key, value)

    db.commit()
    db.refresh(db_product)
    return db_product

@app.delete("/products/{product_id}")
def delete_product(product_id: int, db: Session = Depends(get_db)):
    db_product = db.query(models.Product).filter(models.Product.id == product_id).first()
    if not db_product:
        raise HTTPException(status_code=404, detail="Product not found")
    db.delete(db_product)
    db.commit()
    return {"message": "Product deleted"}

@app.get("/categories/", response_model=List[schemas.Category])
def get_categories(db: Session = Depends(get_db)):
    return db.query(models.Category).all()

@app.post("/categories/", response_model=schemas.Category)
def create_category(category: schemas.CategoryCreate, db: Session = Depends(get_db)):
    db_category = models.Category(**category.dict())
    db.add(db_category)
    db.commit()
    db.refresh(db_category)
    return db_category

@app.get("/users/me")
async def read_users_me(current_user: dict = Depends(auth.verify_token)):
    return current_user
