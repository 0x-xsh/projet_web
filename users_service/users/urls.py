from django.urls import path
from . import views

urlpatterns = [
    path('me/', views.UserDetailView.as_view(), name='user-detail'),
    path('<int:user_id>/', views.get_user_by_id, name='user-by-id'),
] 