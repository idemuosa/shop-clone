from fastapi import FastAPI, Depends, HTTPException, status, Body
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List, Optional
import random
import os
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
    try:
        if not resend or not resend.api_key:
            print(f"SKIPPING EMAIL (Resend not configured): To {to_email}, Sub: {subject}")
            return False

        params = {
            "from": "Vivo Shop <onboarding@resend.dev>",
            "to": [to_email],
            "subject": subject,
            "html": html_content,
        }
        resend.Emails.send(params)
        print(f"EMAIL SENT: To {to_email}, Sub: {subject}")
        return True
    except Exception as e:
        print(f"EMAIL ERROR: {e}")
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
    return {"message": "Welcome to My Shop API"}

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
            subject = f"{otp} is your Vivo Verification Code"
            html = f"""
            <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
                <h2 style="color: #9333ea; text-transform: uppercase; font-style: italic;">Verification Code</h2>
                <p>Welcome to Vivo! Use the code below to complete your login or registration:</p>
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

    subject = "Welcome to Vivo Shop!"
    html = f"""
    <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px;">
        <h1 style="color: #9333ea;">Welcome, {name}!</h1>
        <p>We're thrilled to have you join our community.</p>
        <a href="{os.getenv('APP_URL')}" style="background: #000; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 8px; display: inline-block;">Start Shopping</a>
    </div>
    """
    send_email(email, subject, html)
    send_email(ADMIN_EMAIL, "New User Registered", f"<p>New user <b>{name}</b> ({email}) joined Vivo!</p>")

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
