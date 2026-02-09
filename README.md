# CTP Plate Management Service

Система управления пластинами для CTP (Computer-to-Plate) оборудования.

## Функции
- Управление клиентами
- Учет пластин (формат, производитель, остатки)
- Обработка заказов
- Отслеживание движений пластин
- Контроль минимальных остатков

## Технологии
- Backend: Node.js, Express, TypeScript, Prisma
- Database: PostgreSQL
- Frontend: React, TypeScript, Vite
- Validation: Zod

## Установка

1. Клонируйте репозиторий:
   \`\`\`bash
   git clone https://github.com/ваш-username/ctp-service.git
   cd ctp-service
   \`\`\`

2. Установите зависимости:
   \`\`\`bash
   npm install
   \`\`\`

3. Настройте базу данных:
   \`\`\`bash
   cp .env.example .env
   # Отредактируйте .env с вашими данными PostgreSQL
   npx prisma migrate dev
   \`\`\`

4. Запустите:
   \`\`\`bash
   # Сервер разработки
   npm run server
   
   # Клиент разработки
   npm run dev
   \`\`\`

## API Endpoints
- GET /api/health - Проверка работы
- GET /api/clients - Список клиентов
- POST /api/clients - Создать клиента
- GET /api/orders - Список заказов
- GET /api/plates/stock - Остатки пластин