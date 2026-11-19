from django.db import migrations


def forwards(apps, schema_editor):
    from gallery.our_work import add_our_work, remove_stock

    MediaItem = apps.get_model("gallery", "MediaItem")
    remove_stock(MediaItem)
    add_our_work(MediaItem)


class Migration(migrations.Migration):
    """Swap the old stock gallery for our own job photos in existing databases."""

    dependencies = [("gallery", "0001_initial")]
    operations = [migrations.RunPython(forwards, migrations.RunPython.noop)]
