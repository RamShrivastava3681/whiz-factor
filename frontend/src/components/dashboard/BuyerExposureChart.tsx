import { buyerExposureData } from '@/data/mockData';
import { cn } from '@/lib/utils';

const getExposureColor = (percentage: number): string => {
  if (percentage >= 80) return 'bg-destructive';
  if (percentage >= 60) return 'bg-warning';
  return 'bg-success';
};

const getExposureLabel = (percentage: number): string => {
  if (percentage >= 80) return 'High';
  if (percentage >= 60) return 'Medium';
  return 'Low';
};

export function BuyerExposureChart() {
  return (
    <div className="rounded-lg border bg-card p-6">
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-foreground">Buyer Exposure Heatmap</h3>
        <p className="text-xs text-muted-foreground">Current exposure vs. limit by buyer</p>
      </div>
      <div className="space-y-4">
        {buyerExposureData.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground mb-2">No buyer exposure data available</p>
            <p className="text-sm text-muted-foreground">Data will appear here once connected to your system.</p>
          </div>
        ) : (
          buyerExposureData.map((buyer) => (
            <div key={buyer.name} className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium text-foreground truncate max-w-[120px]">{buyer.name}</span>
                <div className="flex items-center gap-2">
                  <span className={cn(
                    'text-xs px-2 py-0.5 rounded-full font-medium',
                    buyer.percentage >= 80 ? 'bg-destructive/10 text-destructive' :
                    buyer.percentage >= 60 ? 'bg-warning/10 text-warning' :
                    'bg-success/10 text-success'
                  )}>
                    {getExposureLabel(buyer.percentage)}
                  </span>
                  <span className="text-muted-foreground">{buyer.percentage}%</span>
                </div>
              </div>
              <div className="h-2 rounded-full bg-muted overflow-hidden">
                <div
                  className={cn('h-full rounded-full transition-all duration-500', getExposureColor(buyer.percentage))}
                  style={{ width: `${buyer.percentage}%` }}
                />
              </div>
            </div>
          ))
        )}
      </div>
      <div className="mt-4 pt-4 border-t border-border flex items-center justify-center gap-6 text-xs">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full bg-success" />
          <span className="text-muted-foreground">Low (&lt;60%)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full bg-warning" />
          <span className="text-muted-foreground">Medium (60-80%)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full bg-destructive" />
          <span className="text-muted-foreground">High (&gt;80%)</span>
        </div>
      </div>
    </div>
  );
}
