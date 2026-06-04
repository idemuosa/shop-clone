from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ProductViewSet, CategoryViewSet, CartViewSet, OrderViewSet, ReviewViewSet, WishlistViewSet, ProfileViewSet, AddressViewSet

router = DefaultRouter()
router.register(r'products', ProductViewSet)
router.register(r'categories', CategoryViewSet)
router.register(r'cart', CartViewSet, basename='cart')
router.register(r'orders', OrderViewSet, basename='orders')
router.register(r'reviews', ReviewViewSet)
router.register(r'wishlist', WishlistViewSet, basename='wishlist')
router.register(r'profile', ProfileViewSet, basename='profile')
router.register(r'addresses', AddressViewSet, basename='addresses')
router.register(r'merchants', MerchantApplicationViewSet, basename='merchants')

urlpatterns = [
    path('', include(router.urls)),
]
