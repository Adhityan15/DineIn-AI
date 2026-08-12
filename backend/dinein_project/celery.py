import os
from celery import Celery

# Patch redis default RESP version and disable maintenance notifications for RESP2 compatibility
try:
    import redis.connection
    redis.connection.DEFAULT_RESP_VERSION = 2
    
    def patch_configure(self, *args, **kwargs):
        self._maint_notifications_pool_handler = None
        self._maint_notifications_connection_handler = None
        self._oss_cluster_maint_notifications_handler = None
        
    redis.connection.MaintNotificationsAbstractConnection._configure_maintenance_notifications = patch_configure
except (ImportError, AttributeError):
    pass

# Set default settings module
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'dinein_project.settings.development')

app = Celery('dinein_project')

# Load settings from django configuration namespace='CELERY'
app.config_from_object('django.conf:settings', namespace='CELERY')

# Load task modules from all registered Django app configs.
app.autodiscover_tasks()

@app.task(bind=True, ignore_result=True)
def debug_task(self):
    print(f'Request: {self.request!r}')
