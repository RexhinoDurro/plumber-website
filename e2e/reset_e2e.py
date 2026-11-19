"""Delete the records e2e/real_data.py creates (names starting with "E2E"), so it can run again on a real database."""
from chat.models import Conversation
from leads.models import Lead, Payment

print(
    Payment.objects.filter(customer_name__startswith="E2E").delete()[0],
    Lead.objects.filter(name__startswith="E2E").delete()[0],
    Conversation.objects.filter(messages__body__startswith="E2E").distinct().delete()[0],
)
