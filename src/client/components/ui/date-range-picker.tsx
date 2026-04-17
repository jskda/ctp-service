import { format } from 'date-fns';
import { Input } from './input';
import { Label } from './label';

interface DateRangePickerProps {
  from?: Date;
  to?: Date;
  onChange: (range: { from?: Date; to?: Date }) => void;
}

export function DateRangePicker({ from, to, onChange }: DateRangePickerProps) {
  return (
    <div className="flex items-center gap-2">
      <div>
        <Label>С</Label>
        <Input
          type="date"
          value={from ? format(from, 'yyyy-MM-dd') : ''}
          onChange={(e) =>
            onChange({
              from: e.target.value ? new Date(e.target.value) : undefined,
              to,
            })
          }
        />
      </div>
      <div>
        <Label>По</Label>
        <Input
          type="date"
          value={to ? format(to, 'yyyy-MM-dd') : ''}
          onChange={(e) =>
            onChange({
              from,
              to: e.target.value ? new Date(e.target.value) : undefined,
            })
          }
        />
      </div>
    </div>
  );
}