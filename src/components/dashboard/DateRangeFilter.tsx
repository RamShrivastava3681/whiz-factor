import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Calendar, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';

const ranges = [
  { label: '7D', value: '7d' },
  { label: '30D', value: '30d' },
  { label: '90D', value: '90d' },
  { label: 'Custom', value: 'custom' },
];

export function DateRangeFilter() {
  const [selected, setSelected] = useState('30d');

  return (
    <div className="flex items-center gap-4">
      <div className="flex items-center gap-1 p-1 rounded-lg bg-muted">
        {ranges.map((range) => (
          <button
            key={range.value}
            onClick={() => setSelected(range.value)}
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
        <span className="hidden sm:inline">Dec 1 - Dec 14, 2025</span>
      </Button>

      <Button variant="outline" size="sm" className="gap-2">
        <Download className="w-4 h-4" />
        <span className="hidden sm:inline">Export</span>
      </Button>
    </div>
  );
}
