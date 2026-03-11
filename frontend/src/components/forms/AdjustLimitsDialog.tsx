import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DollarSign, TrendingUp, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

interface AdjustLimitsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entity: any;
  onSuccess?: () => void;
}

interface LimitData {
  currentLimit: number;
  newLimit: number;
  usedLimit: number;
  availableLimit: number;
  reason: string;
}

export function AdjustLimitsDialog({ open, onOpenChange, entity, onSuccess }: AdjustLimitsDialogProps) {
  const [limitData, setLimitData] = useState<LimitData>({
    currentLimit: 0,
    newLimit: 0,
    usedLimit: 0,
    availableLimit: 0,
    reason: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initialize limit data when entity changes
  useEffect(() => {
    if (entity) {
      const currentLimit = entity.type === 'supplier' 
        ? (entity.totalLimitSanctioned || entity.creditLimit || 0)
        : (entity.creditLimit || entity.exposureLimit || 0);
      
      const usedLimit = entity.usedLimit || entity.usedCredit || 0;
      const availableLimit = currentLimit - usedLimit;

      setLimitData({
        currentLimit,
        newLimit: currentLimit,
        usedLimit,
        availableLimit,
        reason: ''
      });
    }
  }, [entity]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!entity) return;
    
    // Validation
    if (limitData.newLimit < 0) {
      toast.error('Limit cannot be negative');
      return;
    }
    
    if (limitData.newLimit < limitData.usedLimit) {
      toast.error('New limit cannot be less than currently used limit');
      return;
    }
    
    if (!limitData.reason.trim()) {
      toast.error('Please provide a reason for the limit adjustment');
      return;
    }

    setIsSubmitting(true);
    
    try {
      const updateData = {
        ...entity,
        ...(entity.type === 'supplier' 
          ? { 
              totalLimitSanctioned: limitData.newLimit,
              creditLimit: limitData.newLimit,
              availableLimit: limitData.newLimit - limitData.usedLimit
            }
          : {
              creditLimit: limitData.newLimit,
              exposureLimit: limitData.newLimit,
              availableLimit: limitData.newLimit - limitData.usedLimit
            }
        ),
        limitAdjustmentHistory: [
          ...(entity.limitAdjustmentHistory || []),
          {
            date: new Date().toISOString(),
            previousLimit: limitData.currentLimit,
            newLimit: limitData.newLimit,
            reason: limitData.reason,
            adjustedBy: 'Admin' // In real app, get from auth context
          }
        ],
        updatedAt: new Date().toISOString()
      };

      const response = await fetch(`http://localhost:3000/api/entities/${entity.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
        },
        body: JSON.stringify(updateData)
      });

      if (!response.ok) {
        throw new Error('Failed to adjust limits');
      }

      const result = await response.json();
      
      toast.success('Limits adjusted successfully', {
        description: `${entity.name}'s limit has been updated to ${formatCurrency(limitData.newLimit)}`
      });
      
      onSuccess?.();
      onOpenChange(false);
      
      // Reset form
      setLimitData(prev => ({
        ...prev,
        newLimit: limitData.newLimit,
        currentLimit: limitData.newLimit,
        reason: ''
      }));
      
    } catch (error) {
      console.error('Error adjusting limits:', error);
      toast.error('Failed to adjust limits', {
        description: 'Please try again later'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const calculateChange = () => {
    const change = limitData.newLimit - limitData.currentLimit;
    const percentChange = limitData.currentLimit > 0 
      ? ((change / limitData.currentLimit) * 100) 
      : 0;
    
    return { change, percentChange };
  };

  const { change, percentChange } = calculateChange();
  const newAvailableLimit = limitData.newLimit - limitData.usedLimit;

  if (!entity) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <DollarSign className="w-5 h-5" />
            Adjust Limits - {entity.name}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Current Status */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground">Current Limit</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">
                  {formatCurrency(limitData.currentLimit)}
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground">Used Limit</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600">
                  {formatCurrency(limitData.usedLimit)}
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground">Available</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {formatCurrency(limitData.availableLimit)}
                </div>
              </CardContent>
            </Card>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* New Limit Input */}
            <div className="space-y-2">
              <Label htmlFor="newLimit">New Limit</Label>
              <Input
                id="newLimit"
                type="number"
                step="1"
                min="0"
                value={limitData.newLimit}
                onChange={(e) => setLimitData(prev => ({
                  ...prev,
                  newLimit: Number(e.target.value)
                }))}
                placeholder="Enter new limit amount"
                required
              />
            </div>

            {/* Change Summary */}
            {change !== 0 && (
              <Card className={`border ${change > 0 ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}>
                <CardContent className="pt-4">
                  <div className="flex items-center gap-2">
                    {change > 0 ? (
                      <TrendingUp className="w-5 h-5 text-green-600" />
                    ) : (
                      <AlertTriangle className="w-5 h-5 text-red-600" />
                    )}
                    <div>
                      <div className="text-sm font-medium">
                        {change > 0 ? 'Increase' : 'Decrease'}: {formatCurrency(Math.abs(change))}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {percentChange > 0 ? '+' : ''}{percentChange.toFixed(1)}% change
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        New available: {formatCurrency(newAvailableLimit)}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Validation Warnings */}
            {limitData.newLimit < limitData.usedLimit && (
              <Card className="border-red-200 bg-red-50">
                <CardContent className="pt-4">
                  <div className="flex items-center gap-2 text-red-600">
                    <AlertTriangle className="w-4 h-4" />
                    <span className="text-sm">
                      New limit cannot be less than currently used limit ({formatCurrency(limitData.usedLimit)})
                    </span>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Reason */}
            <div className="space-y-2">
              <Label htmlFor="reason">Reason for Adjustment *</Label>
              <Textarea
                id="reason"
                value={limitData.reason}
                onChange={(e) => setLimitData(prev => ({
                  ...prev,
                  reason: e.target.value
                }))}
                placeholder="Explain the reason for this limit adjustment (e.g., improved risk profile, business growth, etc.)"
                rows={3}
                required
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={isSubmitting || limitData.newLimit < limitData.usedLimit}
              >
                {isSubmitting ? 'Adjusting...' : 'Adjust Limits'}
              </Button>
            </DialogFooter>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}