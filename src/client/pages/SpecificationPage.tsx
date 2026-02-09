// src/client/pages/SpecificationPage.tsx
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, CheckCircle, XCircle, AlertTriangle, Package, Users, Layers } from 'lucide-react';

export function SpecificationPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Спецификация системы</h1>
        <p className="text-muted-foreground mt-2">
          Документация и ключевые принципы системы учёта CTP-производства
        </p>
      </div>

      {/* Основные принципы */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Ключевые принципы
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-3">
              <h3 className="font-semibold text-green-600 flex items-center gap-2">
                <CheckCircle className="h-4 w-4" />
                Что система ДЕЛАЕТ
              </h3>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-green-500 mt-1.5"></div>
                  <span>Учёт заказов (NEW → PROCESS → DONE)</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-green-500 mt-1.5"></div>
                  <span>Контрольные пометки по красочности</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-green-500 mt-1.5"></div>
                  <span>Учёт пластин (движение, остатки, брак)</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-green-500 mt-1.5"></div>
                  <span>Уведомления о дефиците</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-green-500 mt-1.5"></div>
                  <span>Организация файлов заказов</span>
                </li>
              </ul>
            </div>
            <div className="space-y-3">
              <h3 className="font-semibold text-red-600 flex items-center gap-2">
                <XCircle className="h-4 w-4" />
                Что система НЕ делает
              </h3>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-red-500 mt-1.5"></div>
                  <span>Не управляет CTP-оборудованием</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-red-500 mt-1.5"></div>
                  <span>Не выполняет RIP</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-red-500 mt-1.5"></div>
                  <span>Не хранит/анализирует RIP-файлы</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-red-500 mt-1.5"></div>
                  <span>Не является ERP или CRM</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-red-500 mt-1.5"></div>
                  <span>Нет избыточного CRUD</span>
                </li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Матрица красочности */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Красочность заказов
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">ColorMode</th>
                  <th className="text-left p-2">Статус</th>
                  <th className="text-left p-2">Контрольные пометки</th>
                  <th className="text-left p-2">Назначение</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b">
                  <td className="p-2 font-medium">CMYK</td>
                  <td className="p-2"><span className="bg-gray-100 px-2 py-1 rounded text-xs">Дефолтный</span></td>
                  <td className="p-2">—</td>
                  <td className="p-2">Базовый сценарий системы</td>
                </tr>
                <tr className="border-b">
                  <td className="p-2 font-medium">BLACK</td>
                  <td className="p-2"><span className="bg-gray-100 px-2 py-1 rounded text-xs">Дефолтный с расширением</span></td>
                  <td className="p-2">Условные (по клиенту)</td>
                  <td className="p-2">Задел под будущие расширения</td>
                </tr>
                <tr>
                  <td className="p-2 font-medium">MULTICOLOR</td>
                  <td className="p-2"><span className="bg-yellow-100 px-2 py-1 rounded text-xs">Недефолтный</span></td>
                  <td className="p-2">
                    <span className="bg-yellow-50 px-2 py-1 rounded text-xs font-medium">Overprint control</span>
                  </td>
                  <td className="p-2">Контроль внимания оператора</td>
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Статусы заказов */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Статусы заказов
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="border rounded-lg p-4">
              <div className="font-bold text-lg mb-2">NEW</div>
              <div className="text-sm text-muted-foreground">
                Заказ принят и проверен, но не взят в работу
                <div className="mt-2 text-xs bg-gray-100 p-2 rounded">
                  Автоматически выставляется при создании
                </div>
              </div>
            </div>
            <div className="border rounded-lg p-4">
              <div className="font-bold text-lg mb-2">PROCESS</div>
              <div className="text-sm text-muted-foreground">
                Заказ взят в производство (RIP + вывод)
                <div className="mt-2 text-xs bg-blue-100 p-2 rounded">
                  Задается вручную через действие
                </div>
              </div>
            </div>
            <div className="border rounded-lg p-4">
              <div className="font-bold text-lg mb-2">DONE</div>
              <div className="text-sm text-muted-foreground">
                Заказ выполнен
                <div className="mt-2 text-xs bg-green-100 p-2 rounded">
                  Задается вручную через действие
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Клиентские настройки */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Клиентские технологические настройки
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="bg-blue-50 border border-blue-100 p-4 rounded-lg">
              <h3 className="font-semibold text-blue-800 mb-2">Принцип снапшота</h3>
              <p className="text-sm text-blue-700">
                Настройки хранятся у клиента, при создании заказа подтягиваются в виде снапшота.
                Дальнейшие изменения настроек клиента НЕ меняют уже созданные заказы.
              </p>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <h4 className="font-medium mb-2">Примеры настроек</h4>
                <ul className="text-sm space-y-1">
                  <li className="flex items-center gap-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-blue-500"></div>
                    «Компенсация растискивания: +X%»
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-blue-500"></div>
                    «Особые требования к выводу»
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-blue-500"></div>
                    «Всегда проверять перед RIP»
                  </li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium mb-2">Где отображаются</h4>
                <ul className="text-sm space-y-1">
                  <li className="flex items-center gap-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-green-500"></div>
                    В карточке заказа
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-green-500"></div>
                    Визуально заметно при переводе в PROCESS
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-green-500"></div>
                    Не могут быть проигнорированы оператором
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Учёт пластин */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Layers className="h-5 w-5" />
            Учёт пластин
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <h4 className="font-medium mb-2">Типы движения</h4>
                <ul className="text-sm space-y-2">
                  <li>
                    <div className="font-medium">Поступление</div>
                    <div className="text-muted-foreground">Закупка, Возврат, Корректировка</div>
                  </li>
                  <li>
                    <div className="font-medium">Использование</div>
                    <div className="text-muted-foreground">По заказу (только PROCESS)</div>
                  </li>
                  <li>
                    <div className="font-medium">Брак</div>
                    <div className="text-muted-foreground">Клиент / Производство / Материалы</div>
                  </li>
                  <li>
                    <div className="font-medium">Потери</div>
                    <div className="text-muted-foreground">Тесты, Калибровки, Сбой оборудования</div>
                  </li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium mb-2">Ключевые принципы</h4>
                <ul className="text-sm space-y-2">
                  <li className="flex items-start gap-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-purple-500 mt-1.5"></div>
                    <span>Учёт через события движения</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-purple-500 mt-1.5"></div>
                    <span>Остатки — производная величина</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-purple-500 mt-1.5"></div>
                    <span>Нет прямого редактирования остатков</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-purple-500 mt-1.5"></div>
                    <span>Ответственность — атрибут события</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}