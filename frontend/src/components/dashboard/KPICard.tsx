import { cn } from '@/lib/utils';
import { LucideIcon, TrendingUp, TrendingDown, Loader2 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

interface KPICardProps {
  title: string;
  value: string;
  trend?: number;
  trendLabel?: string;
  icon: LucideIcon;
  variant?: 'default' | 'success' | 'warning' | 'primary';
  loading?: boolean;
  onClick?: () => void;
}

export function KPICard({ 
  title, 
  value, 
  trend, 
  trendLabel, 
  icon: Icon, 
  variant = 'default',
  loading = false,
  onClick 
}: KPICardProps) {
  const isPositive = trend && trend > 0;
  
  const variantStyles = {
    default: 'bg-card border-border',
    success: 'bg-success/5 border-success/20',
    warning: 'bg-warning/5 border-warning/20', 
    primary: 'bg-primary/5 border-primary/20',
  };

  const iconStyles = {
    default: 'bg-muted text-muted-foreground',
    success: 'bg-success/10 text-success',
    warning: 'bg-warning/10 text-warning',
    primary: 'bg-primary/10 text-primary',
  };

  if (loading) {
    return (
      <div className={cn(
        'financial-card',
        variantStyles[variant]
      )}>
        <div className="flex items-start justify-between">
          <div className="space-y-3 flex-1">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-8 w-32" />
            <Skeleton className="h-4 w-20" />
          </div>
          <Skeleton className="w-12 h-12 rounded-lg" />
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'financial-card cursor-pointer',
        variantStyles[variant],
        onClick && 'hover:scale-[1.02]'
      )}
      onClick={onClick}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-2 flex-1">
          <p className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
            {title}
          </p>
          <p className="text-3xl font-bold text-financial-navy leading-tight">
            {value}
          </p>
          {trend !== undefined && (
            <div className="flex items-center gap-1.5 pt-1">
              {isPositive ? (
                <TrendingUp className="w-4 h-4 text-success" />
              ) : (
                <TrendingDown className="w-4 h-4 text-destructive" />
              )}
              <span
                className={cn(
                  'text-sm font-semibold',
                  isPositive ? 'text-success' : 'text-destructive'
                )}
              >
                {isPositive ? '+' : ''}{Math.abs(trend).toFixed(1)}%
              </span>
              {trendLabel && (
                <span className="text-xs text-muted-foreground ml-1">
                  {trendLabel}
                </span>
              )}
            </div>
          )}
        </div>
        <div className={cn(
          'w-14 h-14 rounded-lg flex items-center justify-center transition-colors',
          iconStyles[variant]
        )}>
          <Icon className="w-7 h-7" />
        </div>
      </div>
    </div>
  );
}
