from django.db import migrations

OLD = "What's your postcode? I'll check we cover your area and when we could get to you."
NEW = "What's your ZIP code? I'll check we cover your area and when we could get to you."


def forwards(apps, schema_editor):
    QR = apps.get_model("chat", "QuickReply")
    QR.objects.filter(label="Ask postcode").update(label="Ask ZIP code")
    QR.objects.filter(text=OLD).update(text=NEW)


class Migration(migrations.Migration):
    dependencies = [("chat", "0004_conversation_contact_via_and_more")]
    operations = [migrations.RunPython(forwards, migrations.RunPython.noop)]
