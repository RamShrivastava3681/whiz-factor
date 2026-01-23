import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Calendar, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { format, subDays, subMonths, startOfDay, endOfDay } from 'date-fns';

const ranges = [
  { label: '7D', value: '7d' },
  { label: '30D', value: '30d' },
  { label: '90D', value: '90d' },
  { label: 'Custom', value: 'custom' },
];

interface DateRange {
  from: Date;
  to: Date;
}

export function DateRangeFilter() {
  const [selected, setSelected] = useState('30d');
  const [dateRange, setDateRange] = useState<DateRange | null>(null);
  const [isCustomMode, setIsCustomMode] = useState(false);

  // Calculate date range based on selection
  const calculateDateRange = (value: string): DateRange => {
    const today = new Date();
    switch (value) {
      case '7d':
        return {
          from: startOfDay(subDays(today, 7)),
          to: endOfDay(today)
        };
      case '30d':
        return {
          from: startOfDay(subDays(today, 30)),
          to: endOfDay(today)
        };
      case '90d':
        return {
          from: startOfDay(subDays(today, 90)),
          to: endOfDay(today)
        };
      default:
        return {
          from: startOfDay(subDays(today, 30)),
          to: endOfDay(today)
        };
    }
  };

  // Update date range when selection changes
  useEffect(() => {
    if (selected !== 'custom') {
      setDateRange(calculateDateRange(selected));
      setIsCustomMode(false);
    } else {
      setIsCustomMode(true);
    }
  }, [selected]);

  // Initialize with default range
  useEffect(() => {
    setDateRange(calculateDateRange('30d'));
  }, []);

  const handleRangeSelect = (value: string) => {
    setSelected(value);
    // Emit custom event for dashboard to listen to date changes
    if (value !== 'custom') {
      const range = calculateDateRange(value);
      window.dispatchEvent(new CustomEvent('dateRangeChanged', { 
        detail: { range, period: value } 
      }));
    }
  };

  const formatDateRange = (range: DateRange | null) => {
    if (!range) return 'Select dates';
    return `${format(range.from, 'MMM d')} - ${format(range.to, 'MMM d, yyyy')}`;
  };

  return (
    <div className="flex items-center gap-4">
      <div className="flex items-center gap-1 p-1 rounded-lg bg-muted">
        {ranges.map((range) => (
          <button
            key={range.value}
            onClick={() => handleRangeSelect(range.value)}
            className={cn(
              'px-3 py-1.5 text-sm font-medium rounded-md transition-all duration-200',
              selected === range.value
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            {range.label}
          </button>
        ))}
      </div>
      
      <Button variant="outline" size="sm" className="gap-2">
        <Calendar className="w-4 h-4" />
        <span className="hidden sm:inline">{formatDateRange(dateRange)}</span>
      </Button>

      <Button variant="outline" size="sm" className="gap-2">
        <Download className="w-4 h-4" />
        <span className="hidden sm:inline">Export</span>
      </Button>
    </div>
  );
}
