// src/server/routes/orderRoutes.ts
import { Router } from 'express';
// Импортируем контроллеры, когда они будут созданы
// import { createOrder, getAllOrders, getOrderById, transitionOrderToProcess, transitionOrderToDone, getMovementsForOrder } from '../controllers/orderController';

const router = Router();

// route: POST /api/orders -> action: Create Order
// router.post('/', createOrder);

// route: GET /api/orders -> action: View All Orders
// router.get('/', getAllOrders);

// route: GET /api/orders/:id -> action: View Order Details
// router.get('/:id', getOrderById);

// route: PUT /api/orders/:id/process -> action: Transition Order to Process
// router.put('/:id/process', transitionOrderToProcess);

// route: PUT /api/orders/:id/done -> action: Transition Order to Done
// router.put('/:id/done', transitionOrderToDone);

// route: GET /api/orders/:id/movements -> action: View Movements for Order
// router.get('/:id/movements', getMovementsForOrder);

// Пока что добавим заглушку
router.get('/', (req, res) => {
  res.json({ message: 'Orders route placeholder' });
});

export default router;