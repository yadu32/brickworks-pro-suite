from .auth import router as auth_router
from .factory import router as factory_router
from .product import router as product_router
from .production import router as production_router
from .material import router as material_router
from .material_purchase import router as material_purchase_router
from .material_usage import router as material_usage_router
from .sale import router as sale_router
from .customer import router as customer_router
from .supplier import router as supplier_router
from .employee import router as employee_router
from .employee_payment import router as employee_payment_router
from .factory_rate import router as factory_rate_router
from .other_expense import router as other_expense_router

__all__ = [
    'auth_router',
    'factory_router',
    'product_router',
    'production_router',
    'material_router',
    'material_purchase_router',
    'material_usage_router',
    'sale_router',
    'customer_router',
    'supplier_router',
    'employee_router',
    'employee_payment_router',
    'factory_rate_router',
    'other_expense_router',
]