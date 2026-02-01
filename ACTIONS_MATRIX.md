# Матрица действий системы CTP

## Заказы

| Действие | Эндпоинт | Метод | Эффект |
|----------|----------|-------|--------|
| Создать заказ | `/api/orders` | POST | OrderCreated (status=new, colorMode, notesSnapshot) |
| Перевести в работу | `/api/orders/:id/start-processing` | POST | OrderStatusChanged → PROCESS |
| Завершить заказ | `/api/orders/:id/complete` | POST | OrderStatusChanged → DONE |

## Клиенты

| Действие | Эндпоинт | Метод | Эффект |
|----------|----------|-------|--------|
| Создать клиента | `/api/clients` | POST | ClientCreated |
| Изменить клиентские настройки | `/api/clients/:id/tech-notes` | PUT | ClientTechNotesUpdated |

## Пластины - Типы

| Действие | Эндпоинт | Метод | Эффект |
|----------|----------|-------|--------|
| Создать тип пластины | `/api/plates/types` | POST | PlateTypeCreated |
| Задать минимальный остаток | `/api/plates/types/:id/threshold` | PUT | PlateThresholdUpdated |

## Пластины - Поступление

| Действие | Эндпоинт | Метод | Тип события |
|----------|----------|-------|-------------|
| Зафиксировать закупку | `/api/plates/movements/purchase` | POST | PlateMovement: INCOMING / PURCHASE |
| Зафиксировать возврат | `/api/plates/movements/return` | POST | PlateMovement: INCOMING / RETURN |
| Корректировка прихода | `/api/plates/movements/correction` | POST | PlateMovement: INCOMING/OUTGOING / CORRECTION |

## Пластины - Использование по заказу

| Действие | Эндпоинт | Метод | Ответственность | Тип события |
|----------|----------|-------|-----------------|-------------|
| Списать пластины по заказу | `/api/plates/movements/usage` | POST | PRODUCTION | PlateMovement: OUTGOING / NORMAL_USAGE |

## Пластины - Брак

| Действие | Эндпоинт | Метод | Ответственность | Тип события |
|----------|----------|-------|-----------------|-------------|
| Брак (клиент) | `/api/plates/movements/scrap/client` | POST | CLIENT | PlateMovement: OUTGOING / SCRAP_CLIENT |
| Брак (производство) | `/api/plates/movements/scrap/production` | POST | PRODUCTION | PlateMovement: OUTGOING / SCRAP_PRODUCTION |
| Брак (материалы) | `/api/plates/movements/scrap/material` | POST | MATERIALS | PlateMovement: OUTGOING / SCRAP_MATERIAL |

## Пластины - Производственные потери

| Действие | Эндпоинт | Метод | Тип события |
|----------|----------|-------|-------------|
| Тест | `/api/plates/movements/loss/test` | POST | PlateMovement: OUTGOING / LOSS_TEST |
| Калибровка | `/api/plates/movements/loss/calibration` | POST | PlateMovement: OUTGOING / LOSS_CALIBRATION |
| Сбой оборудования | `/api/plates/movements/loss/equipment` | POST | PlateMovement: OUTGOING / LOSS_EQUIPMENT |

## Уведомления

| Действие | Эндпоинт | Метод | Примечание |
|----------|----------|-------|------------|
| Просмотр остатков | `/api/plates/stock` | GET | Вычисляемое состояние, не событие |