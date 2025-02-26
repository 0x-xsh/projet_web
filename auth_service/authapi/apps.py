from django.apps import AppConfig
import atexit
import time
import os

class AuthapiConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'authapi'
    
    def ready(self):
        # Only run service registration in the main process, not in Django's reloader
        if os.environ.get('RUN_MAIN', None) != 'true':
            # Import here to avoid circular imports
            from .service_registry import service_registry
            
            # Slight delay to ensure the service is fully up before registering
            time.sleep(2)
            
            # Register the service
            service_registry.register()
            
            # Register the deregister function to run on shutdown
            atexit.register(service_registry.deregister) 