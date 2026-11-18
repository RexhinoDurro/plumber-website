from django.core.management.base import BaseCommand

from ._demo import clear_demo


class Command(BaseCommand):
    help = "Delete all sample leads, chats and reviews created by seed_demo --demo."

    def handle(self, *args, **opts):
        self.stdout.write(f"Removed {clear_demo()} demo records.")
