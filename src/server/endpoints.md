Clients

    GET /api/clients - список всех клиентов
    GET /api/clients/:id - получить клиента по ID
    POST /api/clients - создать клиента
    PUT /api/clients/:id - обновить клиента
    DELETE /api/clients/:id - удалить клиента

Orders

    GET /api/orders - список заказов (с фильтрами)
    GET /api/orders/:id - получить заказ по ID
    POST /api/orders - создать заказ
    PUT /api/orders/:id - обновить заказ (включая статус)
    DELETE /api/orders/:id - удалить заказ

Plates

    GET /api/plates/types - список типов пластин с остатками
    GET /api/plates/types/:id - получить тип пластины по ID
    POST /api/plates/types - создать тип пластины
    PUT /api/plates/types/:id - обновить тип пластины
    DELETE /api/plates/types/:id - удалить тип пластины
    POST /api/plates/movements - создать движение пластины
    GET /api/plates/movements - список движений (с фильтрами)
    GET /api/plates/stock - текущие остатки всех типов пластин

System

    GET /api/health - проверка работоспособности