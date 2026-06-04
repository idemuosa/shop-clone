from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Category, Product, Cart, CartItem, Order, OrderItem
from .serializers import CategorySerializer, ProductSerializer, CartSerializer, CartItemSerializer
import requests
import os
from django.db.models import Sum, Count
from django.utils import timezone
from datetime import timedelta

class ProductViewSet(viewsets.ModelViewSet):
    queryset = Product.objects.all()
    serializer_class = ProductSerializer

    def perform_create(self, serializer):
        if self.request.user.is_authenticated:
            serializer.save(seller=self.request.user)
        else:
            serializer.save()

    def get_queryset(self):
        queryset = Product.objects.all()
        category = self.request.query_params.get('category')
        search = self.request.query_params.get('search')
        tag = self.request.query_params.get('tag')
        ordering = self.request.query_params.get('ordering')
        seller_only = self.request.query_params.get('seller_only')

        if seller_only == 'true' and self.request.user.is_authenticated:
            queryset = queryset.filter(seller=self.request.user)

        if category:
            queryset = queryset.filter(category__name__icontains=category)
        if search:
            queryset = queryset.filter(
                models.Q(name__icontains=search) |
                models.Q(description__icontains=search)
            )
        if tag:
            queryset = queryset.filter(tag__icontains=tag)

        if ordering:
            queryset = queryset.order_by(ordering)

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

    @action(detail=False, methods=['get'], permission_classes=[permissions.IsAdminUser])
    def analytics(self, request):
        end_date = timezone.now()
        start_date = end_date - timedelta(days=6)

        chart_data = []
        current_date = start_date
        while current_date <= end_date:
            day_orders = Order.objects.filter(
                created_at__date=current_date.date()
            )
            chart_data.append({
                'name': current_date.strftime('%a'),
                'sales': float(day_orders.aggregate(total=Sum('total_amount'))['total'] or 0),
                'orders': day_orders.count()
            })
            current_date += timedelta(days=1)

        total_sales = float(Order.objects.aggregate(total=Sum('total_amount'))['total'] or 0)
        total_orders = Order.objects.count()

        return Response({
            'chartData': chart_data,
            'totalSales': total_sales,
            'totalOrders': total_orders
        })

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

    @action(detail=False, methods=['get'], permission_classes=[permissions.IsAdminUser])
    def analytics(self, request):
        end_date = timezone.now()
        start_date = end_date - timedelta(days=6)

        chart_data = []
        current_date = start_date
        while current_date <= end_date:
            day_orders = Order.objects.filter(
                created_at__date=current_date.date()
            )
            chart_data.append({
                'name': current_date.strftime('%a'),
                'sales': float(day_orders.aggregate(total=Sum('total_amount'))['total'] or 0),
                'orders': day_orders.count()
            })
            current_date += timedelta(days=1)

        total_sales = float(Order.objects.aggregate(total=Sum('total_amount'))['total'] or 0)
        total_orders = Order.objects.count()

        return Response({
            'chartData': chart_data,
            'totalSales': total_sales,
            'totalOrders': total_orders
        })

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

    @action(detail=False, methods=['get'], permission_classes=[permissions.IsAdminUser])
    def analytics(self, request):
        end_date = timezone.now()
        start_date = end_date - timedelta(days=6)

        chart_data = []
        current_date = start_date
        while current_date <= end_date:
            day_orders = Order.objects.filter(
                created_at__date=current_date.date()
            )
            chart_data.append({
                'name': current_date.strftime('%a'),
                'sales': float(day_orders.aggregate(total=Sum('total_amount'))['total'] or 0),
                'orders': day_orders.count()
            })
            current_date += timedelta(days=1)

        total_sales = float(Order.objects.aggregate(total=Sum('total_amount'))['total'] or 0)
        total_orders = Order.objects.count()

        return Response({
            'chartData': chart_data,
            'totalSales': total_sales,
            'totalOrders': total_orders
        })

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
                    # Update Stock
                    try:
                        product = Product.objects.get(id=int(item.product_id))
                        product.stock = max(0, product.stock - item.quantity)
                        product.sold += item.quantity
                        product.save()
                    except (Product.DoesNotExist, ValueError):
                        pass

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

class ReviewViewSet(viewsets.ModelViewSet):
    queryset = Review.objects.all()
    serializer_class = ReviewSerializer

    def get_queryset(self):
        product_id = self.request.query_params.get('product_id')
        if product_id:
            return Review.objects.filter(product_id=product_id).order_by('-created_at')
        return Review.objects.all().order_by('-created_at')

    def perform_create(self, serializer):
        serializer.save(user=self.request.user, user_name=self.request.user.username)

class WishlistViewSet(viewsets.GenericViewSet):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = WishlistSerializer

    def get_queryset(self):
        return Wishlist.objects.filter(user=self.request.user)

    @action(detail=False, methods=['get'])
    def my_wishlist(self, request):
        wishlist, created = Wishlist.objects.get_or_create(user=request.user)
        serializer = self.get_serializer(wishlist)
        return Response(serializer.data)

    @action(detail=False, methods=['post'])
    def add_to_wishlist(self, request):
        product_id = request.data.get('product_id')
        if not product_id:
            return Response({"error": "product_id is required"}, status=status.HTTP_400_BAD_REQUEST)

        wishlist, created = Wishlist.objects.get_or_create(user=request.user)
        try:
            product = Product.objects.get(id=product_id)
            wishlist.products.add(product)
            return Response({"message": "Product added to wishlist"}, status=status.HTTP_200_OK)
        except Product.DoesNotExist:
            return Response({"error": "Product not found"}, status=status.HTTP_404_NOT_FOUND)

    @action(detail=False, methods=['post'])
    def remove_from_wishlist(self, request):
        product_id = request.data.get('product_id')
        wishlist = Wishlist.objects.filter(user=request.user).first()
        if wishlist and product_id:
            wishlist.products.remove(product_id)
            return Response({"message": "Product removed from wishlist"}, status=status.HTTP_200_OK)
        return Response({"error": "Not found"}, status=status.HTTP_404_NOT_FOUND)

class ProfileViewSet(viewsets.GenericViewSet):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = UserProfileSerializer

    @action(detail=False, methods=['get', 'post', 'put'])
    def me(self, request):
        profile, created = UserProfile.objects.get_or_create(user=request.user)

        if request.method in ['POST', 'PUT']:
            data = request.data
            profile.display_name = data.get('display_name', profile.display_name)
            profile.uid = data.get('uid', profile.uid)
            if 'points' in data:
                profile.points = data.get('points')
            if 'last_spin' in data:
                profile.last_spin = data.get('last_spin')
            profile.save()

        serializer = self.get_serializer(profile)
        return Response(serializer.data)

    @action(detail=False, methods=['post'])
    def add_voucher(self, request):
        code = request.data.get('code')
        offer = request.data.get('offer')
        if not code or not offer:
            return Response({"error": "Code and offer required"}, status=status.HTTP_400_BAD_REQUEST)

        Voucher.objects.create(user=request.user, code=code, offer=offer)
        return Response({"message": "Voucher added"}, status=status.HTTP_201_CREATED)

    @action(detail=False, methods=['get', 'post'])
    def addresses(self, request):
        if request.method == 'GET':
            addresses = Address.objects.filter(user=request.user)
            return Response(AddressSerializer(addresses, many=True).data)

        serializer = AddressSerializer(data=request.data)
        if serializer.is_valid():
            if serializer.validated_data.get('is_default'):
                Address.objects.filter(user=request.user).update(is_default=False)
            serializer.save(user=request.user)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['put', 'delete'], url_path='addresses/(?P<address_id>[^/.]+)')
    def manage_address(self, request, pk=None, address_id=None):
        # The 'pk' here is dummy since we use detail=False for 'addresses' action usually,
        # but DRF routers can be tricky with nested.
        # Let's just create a separate ViewSet for Address for better REST practice.
        pass

class AddressViewSet(viewsets.ModelViewSet):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = AddressSerializer

    def get_queryset(self):
        return Address.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        if serializer.validated_data.get('is_default'):
            Address.objects.filter(user=self.request.user).update(is_default=False)
        serializer.save(user=self.request.user)

    def perform_update(self, serializer):
        if serializer.validated_data.get('is_default'):
            Address.objects.filter(user=self.request.user).update(is_default=False)
        serializer.save()

    @action(detail=False, methods=['post'])
    def use_voucher(self, request):
        voucher_id = request.data.get('voucher_id')
        try:
            voucher = Voucher.objects.get(id=voucher_id, user=request.user)
            voucher.is_used = True
            voucher.save()
            return Response({"message": "Voucher marked as used"})
        except Voucher.DoesNotExist:
            return Response({"error": "Voucher not found"}, status=status.HTTP_404_NOT_FOUND)

class MerchantApplicationViewSet(viewsets.ModelViewSet):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = MerchantApplicationSerializer

    def get_queryset(self):
        if self.request.user.is_staff:
            return MerchantApplication.objects.all()
        return MerchantApplication.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAdminUser])
    def approve(self, request, pk=None):
        application = self.get_object()
        application.status = 'approved'
        application.save()

        # Grant merchant role to user
        profile, created = 