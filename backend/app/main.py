from fastapi import FastAPI, Depends, HTTPException, status, Body
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List, Optional
import random
import os
import re
import smtplib
import socketio
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from dotenv import load_dotenv

from . import models, schemas, database, auth
from .database import engine, get_db

load_dotenv()

DEFAULT_FROM_EMAIL = "Vivi Shop <onboarding@resend.dev>"

def parse_from_email(raw_from: str) -> str:
    if not raw_from:
        return DEFAULT_FROM_EMAIL
    cleaned = raw_from.strip("\"' \t\r\n")
    email_pattern = r'^(?:([^<]+)\s*<)?([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})>?$'
    match = re.match(email_pattern, cleaned)
    if match:
        name, addr = match.groups()
        if name and name.strip():
            return f"{name.strip()} <{addr}>"
        return addr
    return DEFAULT_FROM_EMAIL

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

# Socket.IO Server initialization for real-time events
sio = socketio.AsyncServer(async_mode='asgi', cors_allowed_origins='*')
sio_app = socketio.ASGIApp(sio, socketio_path='')
app.mount("/socket.io", sio_app)

@sio.event
async def connect(sid, environ):
    print(f"[Socket.IO] Client connected: {sid}")

@sio.event
async def disconnect(sid):
    print(f"[Socket.IO] Client disconnected: {sid}")

@sio.event
async def ping(sid):
    await sio.emit('pong', room=sid)

@sio.event
async def send_activity(sid, data):
    print(f"[Socket.IO Activity] {data.get('type')}: {data.get('message')}")
    await sio.emit('new_activity', data)

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
    if not resend or not resend.api_key:
        print(f"SKIPPING EMAIL (No SMTP or Resend): To {to_email}, Sub: {subject}")
        return False

    from_email = parse_from_email(os.getenv("FROM_EMAIL", ""))
    params = {
        "from": from_email,
        "to": [to_email],
        "subject": subject,
        "html": html_content,
    }
    try:
        resend.Emails.send(params)
        print(f"EMAIL SENT (via Resend): To {to_email}, Sub: {subject}")
        return True
    except Exception as e:
        print(f"RESEND EMAIL ERROR with 'from'={from_email}: {e}")
        if from_email != DEFAULT_FROM_EMAIL:
            print(f"Retrying email send with default sender: {DEFAULT_FROM_EMAIL}")
            try:
                params["from"] = DEFAULT_FROM_EMAIL
                resend.Emails.send(params)
                print(f"EMAIL SENT (via Resend fallback): To {to_email}, Sub: {subject}")
                return True
            except Exception as retry_err:
                print(f"RESEND EMAIL RETRY ERROR: {retry_err}")
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

@app.get("/health")
def health_check():
    return {"status": "ok"}

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

    try:
        masked_id = re.sub(r'(.{2}).*(@.*)', r'\1***\2', identifier) if "@" in identifier else re.sub(r'(.{3}).*(.{3})', r'\1***\2', identifier)
        await sio.emit("new_activity", {
            "message": f"Verification code requested for {masked_id}",
            "type": "auth"
        })
    except Exception as e:
        print(f"Socket emit notice: {e}")

    if email:
        if not resend or not resend.api_key:
             if os.getenv("NODE_ENV") != "production" and os.getenv("DEBUG", "True").lower() == "true":
                 print(f"[DEV OTP SIMULATION] Email service not configured. Generated OTP for {email}: {otp}")
                 return {
                     "success": True,
                     "message": f"[DEV MODE] Verification code generated: {otp} (Email service not configured)"
                 }
             raise HTTPException(status_code=400, detail="Email service not configured on server")

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
            raise HTTPException(status_code=400, detail="Failed to send verification email to recipient")

    return {
        "success": True,
        "message": f"OTP sent to {identifier}"
    }

@app.post("/api/verify-otp")
async def verify_otp(payload: dict = Body(...)):
    identifier = payload.get("identifier")
    code = payload.get("code")

    if identifier in demo_otps and demo_otps[identifier] == code:
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
    name = payload.get("name", "Explorer")
    verification_link = payload.get("verificationLink") or f"{os.getenv('APP_URL', 'http://localhost:5173')}/verify?email={email}"

    subject = "Verify your VIVI Shop account"
    html = f"""
    <h2>Welcome to VIVI Shop</h2>
    <p>Please verify your account by clicking the link below.</p>
    <a href="{verification_link}">Verify Account</a>
    """
    send_email(email, subject, html)
    send_email(ADMIN_EMAIL, "New User Registered", f"<p>New user <b>{name}</b> ({email}) joined VIVI Shop!</p>")

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

    try:
        await sio.emit("new_activity", {
            "message": f"New Order #{order_id[-8:].upper() if order_id else 'NEW'}: {product_name} (${total_amount})",
            "type": "order"
        })
    except Exception as e:
        print(f"Socket emit notice: {e}")

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
@app.get("/api/products/", response_model=List[schemas.Product])
def get_products(skip: int = 0, limit: int = 100, search: Optional[str] = None, db: Session = Depends(get_db)):
    query = db.query(models.Product)
    if search:
        query = query.filter(models.Product.name.ilike(f"%{search}%"))
    return query.offset(skip).limit(limit).all()


# Additional endpoints to prevent 404s/fetch failures on direct backend requests
@app.get("/api/reviews/")
def get_reviews(product_id: Optional[int] = None):
    return []

@app.post("/api/reviews/")
def create_review(payload: dict = Body(...)):
    return {"status": "success", "message": "Review submitted"}

@app.post("/api/wishlist/add_to_wishlist/")
def add_to_wishlist(payload: dict = Body(...)):
    return {"status": "success", "message": "Added to wishlist"}

@app.get("/api/orders/")
def get_orders():
    return []

@app.get("/api/orders/analytics/")
def get_orders_analytics():
    return {"chartData": [], "totalSales": 0, "totalOrders": 0}

@app.get("/api/profile/me/")
@app.get("/api/profile/me")
def get_profile_me():
    return {"email": "user@example.com", "name": "User", "points": 100}

@app.get("/api/profile/addresses/")
def get_profile_addresses():
    return []

@app.post("/api/profile/add_voucher/")
def add_voucher(payload: dict = Body(...)):
    return {"status": "success"}

@app.get("/api/merchants/")
def get_merchants():
    return []

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
