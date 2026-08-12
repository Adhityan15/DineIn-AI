import json
from django.utils.deprecation import MiddlewareMixin
from .models import AuditLog

class AuditLogMiddleware(MiddlewareMixin):
    """
    Middleware to automatically create AuditLog records for mutating requests (POST, PUT, PATCH, DELETE).
    Runs inside a try-except block to guarantee the primary request flow is never interrupted.
    """
    def get_client_ip(self, request):
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0].strip()
        else:
            ip = request.META.get('REMOTE_ADDR')
        return ip

    def process_response(self, request, response):
        # Only log mutating REST methods and successful/redirection status codes
        if request.method in ['POST', 'PUT', 'PATCH', 'DELETE'] and 200 <= response.status_code < 400:
            try:
                # Do not log audit log creations themselves to prevent endless loops
                if 'api/auth/login' in request.path or 'api/auth/logout' in request.path:
                    # Log login/logout operations specifically
                    action = f"User Login/Logout request to {request.path}"
                else:
                    action = f"REST API {request.method} request to {request.path}"

                user = request.user if request.user and request.user.is_authenticated else None
                ip_address = self.get_client_ip(request)
                
                # Create audit log record
                AuditLog.objects.create(
                    user=user,
                    action=action,
                    ip_address=ip_address,
                    model_name=request.path.split('/')[-2] if len(request.path.split('/')) > 2 else "Unknown",
                    record_id=request.path.split('/')[-1] if request.method in ['PUT', 'PATCH', 'DELETE'] else None,
                )
            except Exception:
                # Silently catch audit log failures to prevent service interruption
                pass
                
        return response


class BranchIsolationMiddleware(MiddlewareMixin):
    """
    Middleware that defines a lazy active_branch property on the request class.
    This resolves the active branch and ensures request.user is authenticated
    even during DRF force_authenticate test cases.
    """
    def process_request(self, request):
        if not hasattr(request.__class__, 'active_branch'):
            @property
            def active_branch_prop(self):
                if not hasattr(self, '_lazy_active_branch'):
                    from apps.core.models import Branch
                    branch_id = self.headers.get('X-Branch-ID') or self.GET.get('branch') or self.GET.get('branch_id')
                    
                    active_branch = None
                    if branch_id:
                        import uuid
                        try:
                            uuid.UUID(str(branch_id))
                            active_branch = Branch.objects.filter(id=branch_id).first()
                        except (ValueError, TypeError):
                            pass
                            
                    if not active_branch:
                        # 1. Fallback to authenticated user's branch
                        if hasattr(self, 'user') and self.user and self.user.is_authenticated:
                            active_branch = getattr(self.user, 'branch', None)
                        
                        # 2. Fallback to default branch
                        if not active_branch:
                            active_branch = Branch.objects.filter(is_default=True).first()
                            
                        # 3. Fallback to Adambakkam Chennai canonical ID
                        if not active_branch:
                            active_branch = Branch.objects.filter(id="c25e6dd3-b6e7-436e-99ed-13c0e965eb03").first()
                            
                        # 4. Fallback to any branch
                        if not active_branch:
                            active_branch = Branch.objects.first()

                    self._lazy_active_branch = active_branch
                return self._lazy_active_branch
                
            request.__class__.active_branch = active_branch_prop
            
        if not hasattr(request.__class__, 'active_branch_id'):
            @property
            def active_branch_id_prop(self):
                active = self.active_branch
                return active.id if active else None
                
            request.__class__.active_branch_id = active_branch_id_prop
