import { createApiUrl, getApiHeaders } from '@/config/api';
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Building2, User, DollarSign, Shield } from 'lucide-react';
import { toast } from 'sonner';

interface EditEntityDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entity: any;
  onSuccess?: () => void;
}

export function EditEntityDialog({ open, onOpenChange, entity, onSuccess }: EditEntityDialogProps) {
  const [formData, setFormData] = useState<any>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initialize form data when entity changes
  useEffect(() => {
    if (entity) {
      setFormData({
        ...entity
      });
    }
  }, [entity]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!entity) return;

    setIsSubmitting(true);
    
    try {
      const response = await fetch(createApiUrl(`/entities/${entity.id}`), {
        method: 'PUT',
        headers: {
          ...getApiHeaders(),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        throw new Error('Failed to update entity');
      }

      const result = await response.json();
      
      toast.success('Entity updated successfully', {
        description: `${formData.name} has been updated`
      });
      
      onSuccess?.();
      onOpenChange(false);
      
    } catch (error) {
      console.error('Error updating entity:', error);
      toast.error('Failed to update entity', {
        description: 'Please try again later'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData((prev: any) => ({
      ...prev,
      [field]: value
    }));
  };

  const handleNestedChange = (parentField: string, childField: string, value: any) => {
    setFormData((prev: any) => ({
      ...prev,
      [parentField]: {
        ...prev[parentField],
        [childField]: value
      }
    }));
  };

  if (!entity) return null;

  const isSupplier = entity.type === 'supplier';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {isSupplier ? <Building2 className="w-5 h-5" /> : <User className="w-5 h-5" />}
            Edit {isSupplier ? 'Supplier' : 'Buyer'} - {entity.name}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <User className="w-5 h-5" />
                Basic Information
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  value={formData.name || ''}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="contactEmail">Contact Email *</Label>
                <Input
                  id="contactEmail"
                  type="email"
                  value={formData.contactEmail || formData.email || ''}
                  onChange={(e) => handleInputChange('contactEmail', e.target.value)}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  value={formData.phone || ''}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select value={formData.status || 'active'} onValueChange={(value) => handleInputChange('status', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="address">Address</Label>
                <Textarea
                  id="address"
                  value={formData.address || ''}
                  onChange={(e) => handleInputChange('address', e.target.value)}
                  rows={2}
                />
              </div>
            </CardContent>
          </Card>

          {/* Location Details */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Location Details</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="city">City</Label>
                <Input
                  id="city"
                  value={formData.city || ''}
                  onChange={(e) => handleInputChange('city', e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="state">State</Label>
                <Input
                  id="state"
                  value={formData.state || ''}
                  onChange={(e) => handleInputChange('state', e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="country">Country</Label>
                <Input
                  id="country"
                  value={formData.country || ''}
                  onChange={(e) => handleInputChange('country', e.target.value)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Financial Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <DollarSign className="w-5 h-5" />
                Financial Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {isSupplier ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="totalLimitSanctioned">Total Limit Sanctioned</Label>
                    <Input
                      id="totalLimitSanctioned"
                      type="number"
                      value={formData.totalLimitSanctioned || ''}
                      onChange={(e) => handleInputChange('totalLimitSanctioned', Number(e.target.value))}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="advanceRate">Advance Rate (%)</Label>
                    <Input
                      id="advanceRate"
                      type="number"
                      min="0"
                      max="100"
                      value={formData.advanceRate || ''}
                      onChange={(e) => handleInputChange('advanceRate', e.target.value)}
                    />
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="creditLimit">Credit Limit</Label>
                    <Input
                      id="creditLimit"
                      type="number"
                      value={formData.creditLimit || formData.exposureLimit || ''}
                      onChange={(e) => handleInputChange('creditLimit', Number(e.target.value))}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="riskRating">Risk Rating</Label>
                    <Select value={formData.riskRating || formData.riskCategory} onValueChange={(value) => handleInputChange('riskRating', value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low Risk</SelectItem>
                        <SelectItem value="medium">Medium Risk</SelectItem>
                        <SelectItem value="high">High Risk</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Supplier-specific fields */}
          {isSupplier && (
            <>
              {/* Transaction Fees */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Transaction Fees (%)</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="days0to30">0-30 days</Label>
                      <Input
                        id="days0to30"
                        type="number"
                        step="0.1"
                        value={formData.transactionFees?.days0to30 || ''}
                        onChange={(e) => handleNestedChange('transactionFees', 'days0to30', e.target.value)}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="days31to60">31-60 days</Label>
                      <Input
                        id="days31to60"
                        type="number"
                        step="0.1"
                        value={formData.transactionFees?.days31to60 || ''}
                        onChange={(e) => handleNestedChange('transactionFees', 'days31to60', e.target.value)}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="days61to90">61-90 days</Label>
                      <Input
                        id="days61to90"
                        type="number"
                        step="0.1"
                        value={formData.transactionFees?.days61to90 || ''}
                        onChange={(e) => handleNestedChange('transactionFees', 'days61to90', e.target.value)}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="days91to120">91-120 days</Label>
                      <Input
                        id="days91to120"
                        type="number"
                        step="0.1"
                        value={formData.transactionFees?.days91to120 || ''}
                        onChange={(e) => handleNestedChange('transactionFees', 'days91to120', e.target.value)}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="days121to150">121-150 days</Label>
                      <Input
                        id="days121to150"
                        type="number"
                        step="0.1"
                        value={formData.transactionFees?.days121to150 || ''}
                        onChange={(e) => handleNestedChange('transactionFees', 'days121to150', e.target.value)}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Bank Details */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Bank Details</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="accountNumber">Account Number</Label>
                    <Input
                      id="accountNumber"
                      value={formData.bankDetails?.accountNumber || ''}
                      onChange={(e) => handleNestedChange('bankDetails', 'accountNumber', e.target.value)}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="bankName">Bank Name</Label>
                    <Input
                      id="bankName"
                      value={formData.bankDetails?.bankName || ''}
                      onChange={(e) => handleNestedChange('bankDetails', 'bankName', e.target.value)}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="ifscCode">IFSC Code</Label>
                    <Input
                      id="ifscCode"
                      value={formData.bankDetails?.ifscCode || ''}
                      onChange={(e) => handleNestedChange('bankDetails', 'ifscCode', e.target.value)}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="branchCode">Branch Code</Label>
                    <Input
                      id="branchCode"
                      value={formData.bankDetails?.branchCode || ''}
                      onChange={(e) => handleNestedChange('bankDetails', 'branchCode', e.target.value)}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Additional Settings */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Additional Settings</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="gracePeriod">Grace Period (days)</Label>
                      <Input
                        id="gracePeriod"
                        type="number"
                        value={formData.gracePeriod || ''}
                        onChange={(e) => handleInputChange('gracePeriod', e.target.value)}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="lateFees">Late Fees (%)</Label>
                      <Input
                        id="lateFees"
                        type="number"
                        step="0.1"
                        value={formData.lateFees || ''}
                        onChange={(e) => handleInputChange('lateFees', e.target.value)}
                      />
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="noaRequired"
                        checked={formData.noaRequired || false}
                        onCheckedChange={(checked) => handleInputChange('noaRequired', checked)}
                      />
                      <Label htmlFor="noaRequired">NOA Required</Label>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="collateralTaken"
                        checked={formData.collateralTaken || false}
                        onCheckedChange={(checked) => handleInputChange('collateralTaken', checked)}
                      />
                      <Label htmlFor="collateralTaken">Collateral Taken</Label>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Updating...' : 'Update Entity'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}