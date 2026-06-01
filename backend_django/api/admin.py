from django.contrib import admin
from .models import Category, Product, Cart, CartItem, Order, OrderItem

class ProductInline(admin.TabularInline):
    model = Product
    extra = 1

@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ('name',)
    search_fields = ('name',)

@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ('name', 'category', 'price', 'stock', 'sold', 'is_available')
    list_filter = ('category', 'is_available', 'tag')
    search_fields = ('name', 'description')
    list_editable = ('price', 'stock', 'is_available')

class CartItemInline(admin.TabularInline):
    model = CartItem
    extra = 0

@admin.register(Cart)
class CartAdmin(admin.ModelAdmin):
    list_display = ('user', 'updated_at')
    inlines = [CartItemInline]

class OrderItemInline(admin.TabularInline):
    model = OrderItem
    extra = 0
    readonly_fields = ('product_name', 'price', 'quantity')

@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = ('id', 'user', 'total_amount', 'status', 'created_at')
    list_filter = ('status', 'created_at')
    search_fields = ('id', 'payment_reference', 'user__username', 'full_name')
    readonly_fields = ('payment_reference', 'total_amount')
    inlines = [OrderItemInline]
    list_editable = ('status',)
