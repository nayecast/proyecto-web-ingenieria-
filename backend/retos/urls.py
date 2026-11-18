from rest_framework.routers import DefaultRouter

from .views import AvanceViewSet, RetoViewSet

router = DefaultRouter()
router.register('retos', RetoViewSet)
router.register('avances', AvanceViewSet)

urlpatterns = router.urls
