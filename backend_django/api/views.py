from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Category, Product, Cart, CartItem, Order, OrderItem
from .serializers import CategorySerializer, ProductSerializer, CartSerializer, CartItemSerializer
import requests
import os

class ProductViewSet(viewsets.ModelViewSet):
    queryset = Product.objects.all()
    serializer_class = ProductSerializer

    def get_queryset(self):
        queryset = Product.objects.all()
        category = self.request.query_params.get('category')
        search = self.request.query_params.get('search')
        tag = self.request.query_params.get('tag')

        if category:
            queryset = queryset.filter(category__name__icontains=category)
        if search:
            queryset = queryset.filter(
                models.Q(name__icontains=search) |
                models.Q(description__icontains=search)
            )
        if tag:
            queryset = queryset.filter(tag__icontains=tag)

        return queryset

class CategoryViewSet(viewsets.ModelViewSet):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer

class CartViewSet(viewsets.GenericViewSet):
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Cart.objects.filter(user=self.request.user)

    @action(detail=False, methods=['get'])
    def my_cart(self, request):
        cart, created = Cart.objects.get_or_create(user=request.user)
        serializer = CartSerializer(cart)
        return Response(serializer.data)

    @action(detail=False, methods=['post'])
    def sync(self, request):
        cart, created = Cart.objects.get_or_create(user=request.user)
        items_data = request.data.get('items', [])

        # Simple sync: Replace current backend cart with the one from frontend
        # In a real app, you might want to merge them instead
        cart.items.all().delete()

        for item in items_data:
            CartItem.objects.create(
                cart=cart,
                product_id=item.get('id'),
                name=item.get('name'),
                price=item.get('price'),
                price_value=item.get('priceValue'),
                image=item.get('image'),
                quantity=item.get('quantity', 1)
            )

        serializer = CartSerializer(cart)
        return Response(serializer.data, status=status.HTTP_200_OK)

    @action(detail=False, methods=['post'])
    def add_item(self, request):
        cart, created = Cart.objects.get_or_create(user=request.user)
        item_data = request.data

        product_id = item_data.get('id')
        item, created = CartItem.objects.get_or_create(
            cart=cart,
            product_id=product_id,
            defaults={
                'name': item_data.get('name'),
                'price': item_data.get('price'),
                'price_value': item_data.get('priceValue'),
                'image': item_data.get('image'),
                'quantity': item_data.get('quantity', 1)
            }
        )

        if not created:
            item.quantity += item_data.get('quantity', 1)
            item.save()

        return Response(CartSerializer(cart).data)

class OrderViewSet(viewsets.ModelViewSet):
    permission_classes = [permissions.IsAuthenticated]
    queryset = Order.objects.all()
    serializer_class = OrderSerializer

    def get_queryset(self):
        return Order.objects.filter(user=self.request.user).order_by('-created_at')

    @action(detail=False, methods=['post'])
    def verify_payment(self, request):
        reference = request.data.get('reference')
        order_details = request.data.get('order_details', {})

        if not reference:
            return Response({"error": "No reference provided"}, status=status.HTTP_400_BAD_REQUEST)

        # Verify with Paystack
        paystack_secret_key = os.getenv('PAYSTACK_SECRET_KEY')
        url = f"https://api.paystack.co/transaction/verify/{reference}"
        headers = {
            "Authorization": f"Bearer {paystack_secret_key}",
            "Content-Type": "application/json",
        }

        try:
            response = requests.get(url, headers=headers)
            res_data = response.json()

            if res_data['status'] and res_data['data']['status'] == 'success':
                # Create the order in our database
                amount = res_data['data']['amount'] / 100 # Convert back from kobo

                # Get user's cart items
                try:
                    cart = Cart.objects.get(user=request.user)
                except Cart.DoesNotExist:
                    return Response({"error": "Cart not found"}, status=status.HTTP_400_BAD_REQUEST)

                order = Order.objects.create(
                    user=request.user,
                    full_name=order_details.get('full_name', request.user.username),
                    email=request.user.email,
                    address=order_details.get('address', 'N/A'),
                    city=order_details.get('city', 'N/A'),
                    total_amount=amount,
                    payment_reference=reference,
                    status='paid'
                )

                for item in cart.items.all():
                    OrderItem.objects.create(
                        order=order,
                        product_name=item.name,
                        price=item.price_value,
                        quantity=item.quantity,
                        image=item.image
                    )

                # Clear cart after successful order
                cart.items.all().delete()

                return Response({"message": "Payment verified and order created", "order_id": order.id}, status=status.HTTP_201_CREATED)

            return Response({"error": "Payment verification failed", "details": res_data.get('message')}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
