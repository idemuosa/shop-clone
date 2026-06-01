from django.db.models.signals import post_save
from django.dispatch import receiver
from django.core.mail import send_mail
from django.conf import settings
from .models import Order

@receiver(post_save, sender=Order)
def send_order_confirmation(sender, instance, created, **kwargs):
    # Only send email if status changed to 'paid' or a new 'paid' order is created
    if instance.status == 'paid':
        subject = f'Order Confirmation #{instance.id}'
        message = f'Hi {instance.full_name},\n\nYour order has been confirmed and paid successfully.\nReference: {instance.payment_reference}\nTotal: {instance.total_amount}\n\nWe will notify you when it ships.'

        try:
            send_mail(
                subject,
                message,
                settings.DEFAULT_FROM_EMAIL,
                [instance.email],
                fail_silently=True,
            )

            # Also notify admin
            admin_message = f'New Order #{instance.id} from {instance.email}\nAmount: {instance.total_amount}'
            send_mail(
                f'NEW SALE: {instance.total_amount}',
                admin_message,
                settings.DEFAULT_FROM_EMAIL,
                [settings.ADMIN_EMAIL],
                fail_silently=True,
            )
        except Exception as e:
            print(f"Failed to send email: {e}")
