from django.core.management import call_command

from gallery.models import MediaItem


def test_seed_uses_our_photos_and_removes_stock(db, client, settings, tmp_path):
    settings.MEDIA_ROOT = tmp_path
    MediaItem.objects.create(title="Old stock", alt="x", external_url="https://images.pexels.com/photos/1/a.jpeg")
    MediaItem.objects.create(title="My upload", alt="y", external_url="https://example.com/mine.jpg")

    call_command("seed_demo")
    call_command("seed_demo")  # safe to run twice

    titles = set(MediaItem.objects.values_list("title", flat=True))
    assert "Old stock" not in titles and "My upload" in titles
    ours = MediaItem.objects.exclude(title="My upload")
    assert ours.count() == 9 and all(m.file and not m.external_url and not m.credit for m in ours)
    assert ours.filter(featured=True).count() == 5

    data = client.get("/api/gallery/").json()
    assert not any("pexels" in (m["src"] + (m["video"] or "")) for m in data)
    assert all(m["alt"] for m in data)
