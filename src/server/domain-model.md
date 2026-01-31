# Формализованная Доменная Модель CTP-Системы

## 1. Сущности

### 1.1. Order (Заказ)
- **orderId**: string (ID)
- **clientId**: string (ссылка на Client)
- **colorMode**: enum(CMYK | BLACK | MULTICOLOR)
- **status**: enum(new | process | done)
- **createdAt**: timestamp
- **updatedAt**: timestamp
- **notesSnapshot**: JSON (снапшот клиентских настроек и условных пометок)

### 1.2. Client (Клиент)
- **clientId**: string (ID)
- **name**: string
- **techNotes**: JSON (массив строк с технологическими настройками)

### 1.3. PlateType (Тип пластины)
- **plateTypeId**: string (ID)
- **format**: string
- **manufacturer**: string
- **otherParams**: JSON (дополнительные идентифицирующие параметры)
- **minStockThreshold**: number (минимальный порог для уведомлений)

### 1.4. Event (Событие)
- **eventId**: string (ID)
- **eventType**: string (тип события)
- **timestamp**: timestamp
- **payload**: JSON (данные события)
- **context**: enum(order | stock | system)

---

## 2. Типы Событий (Event Types)

### 2.1. События, связанные с заказами

#### OrderCreated
- **eventType**: `order.created`
- **context**: `order`
- **payload**:
  - orderId: string
  - clientId: string
  - colorMode: string
  - status: "new"
  - createdAt: timestamp
  - notesSnapshot: object

#### OrderStatusChanged
- **eventType**: `order.status.changed`
- **context**: `order`
- **payload**:
  - orderId: string
  - oldStatus: string
  - newStatus: string
  - changedAt: timestamp

### 2.2. События, связанные с пластинами

#### PlateMovement
- **eventType**: `plate.movement`
- **context**: `stock`
- **payload**:
  - plateTypeId: string
  - quantity: number
  - movementType: enum(incoming | outgoing)
  - reason: enum(purchase | return | correction | normal_usage | scrap_client | scrap_production | scrap_material | loss_test | loss_calibration | loss_equipment)
  - orderId: string (опционально)
  - responsibility: enum(client | production | materials) (для scrap и loss)
  - timestamp: timestamp

---

## 3. Инварианты и бизнес-правила

1. **Заказ не может существовать без клиента**.
2. **Статус заказа может меняться только через событие `OrderStatusChanged`**.
3. **Пластины списываются только через событие `PlateMovement` с `reason: normal_usage` и `orderId` при `status=process`**.
4. **Остаток пластины = Σ(входящие движения) - Σ(исходящие движения)**.
5. **`notesSnapshot` в заказе создается при `OrderCreated` и не зависит от последующих изменений в клиенте**.
6. **Событие `PlateMovement` с `reason: scrap_*` всегда имеет атрибут `responsibility`**.

---

## 4. Производные сущности (агрегаты)

### 4.1. Stock (Остатки)
- **Ключ**: `plateTypeId`
- **Значение**: `quantity` (число)
- **Вычисляется как**: `SUM(movement.quantity WHERE movementType='incoming') - SUM(movement.quantity WHERE movementType='outgoing')`

### 4.2. DeficitAlert (Уведомление о дефиците)
- **Ключ**: `plateTypeId`
- **Состояние**: `true/false`
- **Вычисляется как**: `stock.quantity < plateType.minStockThreshold`