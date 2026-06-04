from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from .database import Base
import datetime

class Category(Base):
    __tablename__ = "categories"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True)
    image = Column(String)

    products = relationship("Product", back_populates="category")

class Product(Base):
    __tablename__ = "products"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    description = Column(String)
    price = Column(Float)
    old_price = Column(Float, nullable=True)
    image = Column(String)
    category_id = Column(Integer, ForeignKey("categories.id"))
    rating = Column(Float, default=0.0)
    reviews_count = Column(Integer, default=0)
    tag = Column(String, nullable=True) # e.g., 'Best Seller', 'New Arrival'
    stock = Column(Integer, default=0)
    sold = Column(Integer, default=0)
    is_available = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    category = relationship("Category", back_populates="products")

    @property
    def category_name(self):
        return self.category.name if self.category else None

class Cart(Base):
    __tablename__ = "carts"

    id = Column(Integer, primary_key=True, index=True)
    user_uid = Column(String, unique=True, index=True) # Firebase UID
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    items = relationship("CartItem", back_populates="cart", cascade="all, delete-orphan")

class CartItem(Base):
    __tablename__ = "cart_items"

    id = Column(Integer, primary_key=True, index=True)
    cart_id = Column(Integer, ForeignKey("carts.id"))
    product_id = Column(String)
    name = Column(String)
    price = Column(String)
    price_value = Column(Float)
    image = Column(String)
    quantity = Column(Integer, default=1)

    cart = relationship("Cart", back_populates="items")
