# CTP-Service

[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue.svg)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18.3-61dafb.svg)](https://reactjs.org/)
[![Vite](https://img.shields.io/badge/Vite-7.2-646cff.svg)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-38bdf8.svg)](https://tailwindcss.com/)
[![Node.js](https://img.shields.io/badge/Node.js-18.x-339933.svg)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-5.2-000000.svg)](https://expressjs.com/)
[![Prisma](https://img.shields.io/badge/Prisma-6.19-2D3748.svg)](https://www.prisma.io/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-14-4169E1.svg)](https://www.postgresql.org/)
[![TanStack Query](https://img.shields.io/badge/TanStack_Query-5.90-FF4154.svg)](https://tanstack.com/query)
[![Zod](https://img.shields.io/badge/Zod-4.3-3E6B8C.svg)](https://zod.dev/)
[![React Hook Form](https://img.shields.io/badge/React_Hook_Form-7.71-EC5990.svg)](https://react-hook-form.com/)
[![shadcn/ui](https://img.shields.io/badge/shadcn/ui-2024-000000.svg)](https://ui.shadcn.com/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

Система для управления заказами и учёта пластин в CTP-производстве с соблюдением принципов заказоориентированности и событийного подхода.

## 📋 О проекте

CTP Service - это веб-приложение для автоматизации учёта в CTP-производстве. Система позволяет создавать заказы, отслеживать их статусы, вести учёт пластин и контролировать остатки.

### Особенности

- **Заказоориентированность** — заказ первичен, клиент не активный агент
- **Система действий** — нет избыточного CRUD, только допустимые действия
- **Снапшоты** — клиентские настройки фиксируются на момент создания заказа
- **Учёт пластин** — движения, остатки, брак, потери
- **Автоматический контроль остатков** — уведомления о дефиците

## 🚀 Технологии

### Backend
- **Node.js** — среда выполнения
- **Express** — веб-фреймворк
- **Prisma ORM** — работа с базой данных
- **PostgreSQL** — база данных
- **Zod** — валидация API запросов

### Frontend
- **React 18** — UI библиотека
- **TypeScript** — типизация
- **Vite** — сборка и разработка
- **Tailwind CSS** — стилизация
- **shadcn/ui** — компоненты интерфейса
- **TanStack Query** — управление серверным состоянием
- **React Router** — маршрутизация
- **React Hook Form** — работа с формами
- **Zod** — валидация данных
- **Lucide React** — иконки

## 📦 Установка и запуск

### Требования

- Node.js 18+
- PostgreSQL 14+
- npm или yarn

### Шаги установки

1. Клонировать репозиторий
```bash
git clone https://github.com/your-username/ctp-service.git
cd ctp-service
```

2. Установить зависимости
```bash
npm install
```

3. Настроить переменные окружения
```bash
cp .env.example .env
# Отредактировать .env, указав DATABASE_URL
```
4. Выполнить миграции базы данных
```bash
npx prisma migrate dev
npx prisma generate
```
5. Запустить приложение
```bash
# Запуск в режиме разработки
npm run dev:full

# Или по отдельности:
npm run server    # Запуск сервера на http://localhost:3001
npm run dev       # Запуск клиента на http://localhost:5173
```

## 🏗️ Архитектура

### Структура проекта
```bash
ctp-service/
├── prisma/                  # Prisma схемы и миграции
│   ├── schema.prisma        # Схема базы данных
│   └── migrations/          # Миграции
├── src/
│   ├── client/              # Frontend приложение
│   │   ├── components/      # React компоненты
│   │   ├── hooks/           # Кастомные хуки
│   │   ├── pages/           # Страницы приложения
│   │   ├── lib/             # Утилиты и API клиент
│   │   ├── types/           # TypeScript типы
│   │   └── utils/           # Вспомогательные функции
│   └── server/              # Backend сервер
│       ├── controllers/     # Контроллеры API
│       ├── routes/          # Маршруты API
│       └── utils/           # Утилиты и валидация
├── package.json
└── README.md
```

### Модели данных
**Order (Заказ)**
- Статусы: NEW → PROCESS → DONE
- Содержит формат пластин и количество
- Фиксирует снапшот настроек клиента

**Client (Клиент)**
- Хранит технологические настройки
- Поддерживает мягкое удаление (архивацию)
- Настройки копируются в заказ при создании

**PlateType (Тип пластины)**
- Формат, производитель, параметры
- Минимальный порог для уведомлений
- Поддерживает мягкое удаление

**PlateMovement (Движение пластин)**
- INCOMING (поступление) / OUTGOING (списание)
- Типы: закупка, возврат, корректировка, использование, брак, потери
- Ответственность: клиент, производство, материалы

**EventLog (Лог событий)**
- Фиксирует все действия в системе
- Используется для аудита и отладки

## 🔧 API Эндпоинты

### Заказы
- GET /api/orders - список заказов
- GET /api/orders/:id - детали заказа
- POST /api/orders - создание заказа
- POST /api/orders/:id/start-processing - перевод в работу
- POST /api/orders/:id/complete - завершение заказа

### Клиенты
- GET /api/clients - список клиентов
- GET /api/clients/active - активные клиенты
- POST /api/clients - создание клиента
- PUT /api/clients/:id - обновление клиента
- DELETE /api/clients/:id - архивация клиента

### Пластины
- GET /api/plates/types - типы пластин
- GET /api/plates/types/active - активные типы
- POST /api/plates/types - создание типа
- PUT /api/plates/types/:id/threshold - установка порога
- POST /api/plates/movements/purchase - закупка
- POST /api/plates/movements/usage - списание по заказу
- POST /api/plates/movements/scrap/ - учёт брака
- POST /api/plates/movements/loss/ - учёт потерь
- GET /api/plates/stock - текущие остатки

### Настройки
- GET /api/settings/system - системные настройки
- GET /api/settings/plates/stock - остатки пластин
- GET /api/settings/stats - статистика системы

## 📱 Использование

### Управление заказами
1. Создание заказа - выбор клиента, формата пластин и количества
2. Перевод в работу - после проверки заказ переводится в статус PROCESS
3. Завершение заказа - после выполнения заказ переводится в статус DONE

### Учёт пластин
1. Поступление - закупка новых пластин
2. Списание - пластины автоматически списываются при создании заказа
3. Брак - учёт бракованных пластин с указанием ответственности
4. Потери - учёт пластин на тесты и калибровку

### Контроль остатков
- Автоматический расчёт остатков на основе всех движений
- Уведомления о дефиците при падении ниже порога
- Возможность корректировки остатков

## 🗄️ Структура базы данных
```bash
-- Основные таблицы
Client           -- Клиенты и их настройки
Order            -- Заказы
PlateType        -- Типы пластин
PlateMovement    -- Движения пластин
EventLog         -- Лог событий
```

## 🔐 Безопасность

- Валидация всех входных данных через Zod
- Транзакции для атомарных операций
- Мягкое удаление вместо физического
- Логирование всех критических действий

## 🙏 Благодарности
- shadcn/ui - компоненты UI
- TanStack Query - управление состоянием
- Prisma - ORM
- Tailwind CSS - стилизация