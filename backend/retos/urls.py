from rest_framework.routers import DefaultRouter

from .views import AvanceViewSet, RetoViewSet, TareaSemanalViewSet

router = DefaultRouter()
router.register('retos', RetoViewSet)
router.register('avances', AvanceViewSet)
router.register('tareas', TareaSemanalViewSet)

urlpatterns = router.urls
