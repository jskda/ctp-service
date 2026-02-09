// src/client/utils/actionMatrix.ts
/**
 * МАТРИЦА ДЕЙСТВИЙ СИСТЕМЫ
 * Согласно спецификации, раздел 11
 * Система строится вокруг допустимых действий, а не форм редактирования
 */

export interface ActionDefinition {
  id: string;
  label: string;
  context: 'order' | 'stock' | 'client' | 'system';
  conditions: string[];
  eventType: string;
  description: string;
}

export const ACTION_MATRIX: ActionDefinition[] = [
  // ==================== ДЕЙСТВИЯ С ЗАКАЗАМИ ====================
  {
    id: 'order.create',
    label: 'Создать заказ',
    context: 'system',
    conditions: ['—'],
    eventType: 'OrderCreated',
    description: 'Создание заказа с автоматическим снапшотом клиентских настроек и контрольных пометок по красочности'
  },
  {
    id: 'order.start-processing',
    label: 'Перевести заказ в работу',
    context: 'order',
    conditions: ['status = NEW'],
    eventType: 'OrderStatusChanged → PROCESS',
    description: 'Перевод заказа в статус PROCESS (RIP + вывод)'
  },
  {
    id: 'order.complete',
    label: 'Завершить заказ',
    context: 'order',
    conditions: ['status = PROCESS'],
    eventType: 'OrderStatusChanged → DONE',
    description: 'Завершение заказа, перевод в статус DONE'
  },
  {
    id: 'order.folder.create',
    label: 'Создать папку заказа',
    context: 'order',
    conditions: ['папка отсутствует'],
    eventType: 'OrderFolderCreated',
    description: 'Создание файловой папки для заказа (через локальный агент)'
  },
  {
    id: 'order.folder.open',
    label: 'Открыть папку заказа',
    context: 'order',
    conditions: ['папка существует'],
    eventType: '—',
    description: 'Открытие папки заказа в файловой системе (side-effect)'
  },

  // ==================== ДЕЙСТВИЯ УЧЁТА ПЛАСТИН ====================
  // Поступление
  {
    id: 'plate.purchase',
    label: 'Зафиксировать закупку пластин',
    context: 'stock',
    conditions: ['—'],
    eventType: 'PlateMovement: INCOMING / PURCHASE',
    description: 'Учет поступления пластин от поставщика'
  },
  {
    id: 'plate.return',
    label: 'Зафиксировать возврат пластин',
    context: 'stock',
    conditions: ['—'],
    eventType: 'PlateMovement: INCOMING / RETURN',
    description: 'Учет возврата пластин на склад'
  },
  {
    id: 'plate.correction',
    label: 'Корректировка прихода',
    context: 'stock',
    conditions: ['—'],
    eventType: 'PlateMovement: INCOMING / CORRECTION',
    description: 'Корректировка учтенных остатков'
  },

  // Использование по заказу
  {
    id: 'plate.usage',
    label: 'Списать пластины по заказу',
    context: 'order',
    conditions: ['status = PROCESS'],
    eventType: 'PlateMovement: OUTGOING / NORMAL_USAGE',
    description: 'Списание пластин на выполнение заказа, ответственность: производство'
  },

  // Брак
  {
    id: 'plate.scrap.client',
    label: 'Зафиксировать брак (клиент)',
    context: 'order',
    conditions: ['—'],
    eventType: 'PlateMovement: OUTGOING / SCRAP_CLIENT',
    description: 'Списание бракованных пластин по вине клиента'
  },
  {
    id: 'plate.scrap.production',
    label: 'Зафиксировать брак (производство)',
    context: 'order',
    conditions: ['—'],
    eventType: 'PlateMovement: OUTGOING / SCRAP_PRODUCTION',
    description: 'Списание бракованных пластин по вине производства'
  },
  {
    id: 'plate.scrap.material',
    label: 'Зафиксировать брак (материалы)',
    context: 'stock',
    conditions: ['—'],
    eventType: 'PlateMovement: OUTGOING / SCRAP_MATERIAL',
    description: 'Списание бракованных пластин по вине материалов/поставщика'
  },

  // Производственные потери
  {
    id: 'plate.loss.test',
    label: 'Зафиксировать тест',
    context: 'stock',
    conditions: ['—'],
    eventType: 'PlateMovement: OUTGOING / LOSS_TEST',
    description: 'Списание пластин на тестирование оборудования'
  },
  {
    id: 'plate.loss.calibration',
    label: 'Зафиксировать калибровку',
    context: 'stock',
    conditions: ['—'],
    eventType: 'PlateMovement: OUTGOING / LOSS_CALIBRATION',
    description: 'Списание пластин на калибровку оборудования'
  },
  {
    id: 'plate.loss.equipment',
    label: 'Зафиксировать сбой оборудования',
    context: 'stock',
    conditions: ['—'],
    eventType: 'PlateMovement: OUTGOING / LOSS_EQUIPMENT',
    description: 'Списание пластин из-за сбоя оборудования'
  },

  // ==================== ДЕЙСТВИЯ СПРАВОЧНИКОВ ====================
  {
    id: 'plate-type.create',
    label: 'Создать тип пластины',
    context: 'system',
    conditions: ['—'],
    eventType: 'PlateTypeCreated',
    description: 'Добавление нового типа пластин в справочник'
  },
  {
    id: 'plate-threshold.set',
    label: 'Задать минимальный остаток',
    context: 'stock',
    conditions: ['—'],
    eventType: 'PlateThresholdUpdated',
    description: 'Установка минимального уровня остатков для уведомлений'
  },
  {
    id: 'client.create',
    label: 'Создать клиента',
    context: 'system',
    conditions: ['—'],
    eventType: 'ClientCreated',
    description: 'Добавление клиента с технологическими настройками'
  },
  {
    id: 'client.settings.update',
    label: 'Изменить клиентские настройки',
    context: 'client',
    conditions: ['—'],
    eventType: 'ClientSettingsUpdated',
    description: 'Обновление технологических настроек клиента (не влияет на существующие заказы)'
  }
];

/**
 * Проверяет, доступно ли действие в текущем контексте
 */
export function isActionAvailable(
  actionId: string, 
  context: { orderStatus?: OrderStatus, hasFolder?: boolean }
): boolean {
  const action = ACTION_MATRIX.find(a => a.id === actionId);
  if (!action) return false;

  // Проверяем условия для действий с заказами
  if (action.context === 'order' && context.orderStatus) {
    switch (actionId) {
      case 'order.start-processing':
        return context.orderStatus === 'NEW';
      case 'order.complete':
        return context.orderStatus === 'PROCESS';
      case 'order.usage':
        return context.orderStatus === 'PROCESS';
      default:
        return true;
    }
  }

  // Проверяем условия для действий с папками
  if (actionId === 'order.folder.create') {
    return !context.hasFolder;
  }
  if (actionId === 'order.folder.open') {
    return context.hasFolder === true;
  }

  return true;
}

/**
 * Возвращает действия, доступные для заказа в текущем статусе
 */
export function getAvailableOrderActions(orderStatus: OrderStatus, hasFolder: boolean): ActionDefinition[] {
  return ACTION_MATRIX.filter(action => {
    if (action.context !== 'order') return false;
    return isActionAvailable(action.id, { orderStatus, hasFolder });
  });
}