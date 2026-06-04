from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

class ProductBase(BaseModel):
    name: str
    description: Optional[str] = None
    price: float
    old_price: Optional[float] = None
    image: str
    category_id: int
    tag: Optional[str] = None
    stock: Optional[int] = 0
    sold: Optional[int] = 0
    is_available: Optional[bool] = True

class ProductCreate(ProductBase):
    pass

class Product(ProductBase):
    id: int
    rating: float
    reviews_count: int
    created_at: datetime
    category_name: Optional[str] = None

    class Config:
        from_attributes = True

class CategoryBase(BaseModel):
    name: str
    image: Optional[str] = None

class CategoryCreate(CategoryBase):
    pass

class Category(CategoryBase):
    id: int
    products: List[Product] = []

    class Config:
        from_attributes = True

class CartItemBase(BaseModel):
    product_id: str
    name: str
    price: str
    price_value: float
    image: str
    quantity: int

class CartItem(CartItemBase):
    id: int
    cart_id: int

    class Config:
        from_attributes = True

class Cart(BaseModel):
    id: int
    user_uid: str
    items: List[CartItem] = []
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
