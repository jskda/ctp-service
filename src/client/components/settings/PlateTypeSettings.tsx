import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Alert, AlertDescription } from "@/components/ui/alert"

export function PlateTypeSettings() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Типы пластин</CardTitle>
        <CardDescription>
          Настройка параметров для CTP-пластин
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        <Alert>
          <AlertDescription>
            Изменения применяются сразу
          </AlertDescription>
        </Alert>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Тип</TableHead>
              <TableHead>Кол-во</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell>CMYK</TableCell>
              <TableCell>
                <Input type="number" defaultValue={4} />
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell>BLACK</TableCell>
              <TableCell>
                <Input type="number" defaultValue={1} />
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell>MULTICOLOR</TableCell>
              <TableCell>
                <Input type="number" defaultValue={0} />
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>

        <Button>Сохранить</Button>
      </CardContent>
    </Card>
  )
}
