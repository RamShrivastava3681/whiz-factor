import React, { useState, useEffect } from 'react';
import { Settings2, Plus, Edit, Trash2, Calculator, AlertTriangle, CheckCircle } from 'lucide-react';
import { mockFeeConfigurations, mockLimitConfigurations } from '@/data/demoData';
import { createApiUrl } from '@/config/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface FeeConfiguration {
  id: string;
  name: string;
  description: string;
  type: 'flat' | 'percentage' | 'tiered';
  isActive: boolean;
  flatAmount?: number;
  percentage?: number;
  minAmount?: number;
  maxAmount?: number;
  tiers?: FeeTier[];
  applicableTo: {
    buyers?: string[];
    suppliers?: string[];
    transactionCategories?: string[];
  };
  version: number;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
}

interface FeeTier {
  fromAmount: number;
  toAmount?: number;
  percentage?: number;
  flatAmount?: number;
}

interface LimitConfiguration {
  id: string;
  name: string;
  description: string;
  type: 'buyer_credit' | 'supplier_concentration' | 'transaction_value' | 'daily' | 'monthly';
  isActive: boolean;
  maxValue: number;
  warningThreshold?: number;
  period?: 'daily' | 'weekly' | 'monthly' | 'yearly';
  entityId?: string;
  entityType?: 'buyer' | 'supplier';
  blockOnBreach: boolean;
  requireManualApproval: boolean;
  version: number;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
}

interface FeeCalculationPreview {
  fees: any[];
  totalFees: number;
  canProceed: boolean;
  violations: string[];
  warnings: string[];
}

export default function FeeLimits() {
  const [feeConfigurations, setFeeConfigurations] = useState<FeeConfiguration[]>([]);
  const [limitConfigurations, setLimitConfigurations] = useState<LimitConfiguration[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('fees');
  
  // Fee dialog states
  const [feeDialogOpen, setFeeDialogOpen] = useState(false);
  const [editingFee, setEditingFee] = useState<FeeConfiguration | null>(null);
  const [feeForm, setFeeForm] = useState<Partial<FeeConfiguration>>({
    type: 'percentage',
    isActive: true,
    applicableTo: {}
  });
  
  // Limit dialog states
  const [limitDialogOpen, setLimitDialogOpen] = useState(false);
  const [editingLimit, setEditingLimit] = useState<LimitConfiguration | null>(null);
  const [limitForm, setLimitForm] = useState<Partial<LimitConfiguration>>({
    type: 'transaction_value',
    isActive: true,
    blockOnBreach: false,
    requireManualApproval: true
  });
  
  // Preview states
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false);
  const [previewAmount, setPreviewAmount] = useState<string>('');
  const [previewResult, setPreviewResult] = useState<FeeCalculationPreview | null>(null);

  useEffect(() => {
    // Initialize with empty data - replace with API calls
    initializeEmptyState();
  }, []);

  const initializeEmptyState = () => {
    setLoading(true);
    
    // Initialize empty configurations
    setFeeConfigurations([]);
    setLimitConfigurations([]);
    setTimeout(() => setLoading(false), 500);
  };

  const handleSaveFee = async () => {
    try {
      const url = editingFee ? createApiUrl(`/fee-limits/fees/${editingFee.id}`) : createApiUrl('/fee-limits/fees');
      const method = editingFee ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...feeForm, createdBy: 'current-user' })
      });
      
      if (response.ok) {
        fetchConfigurations();
        setFeeDialogOpen(false);
        setEditingFee(null);
        setFeeForm({ type: 'percentage', isActive: true, applicableTo: {} });
      }
    } catch (error) {
      console.error('Error saving fee configuration:', error);
    }
  };

  const handleSaveLimit = async () => {
    try {
      const url = editingLimit ? createApiUrl(`/fee-limits/limits/${editingLimit.id}`) : createApiUrl('/fee-limits/limits');
      const method = editingLimit ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...limitForm, createdBy: 'current-user' })
      });
      
      if (response.ok) {
        fetchConfigurations();
        setLimitDialogOpen(false);
        setEditingLimit(null);
        setLimitForm({ type: 'transaction_value', isActive: true, blockOnBreach: false, requireManualApproval: true });
      }
    } catch (error) {
      console.error('Error saving limit configuration:', error);
    }
  };

  const handleDeleteFee = async (id: string) => {
    try {
      const response = await fetch(createApiUrl(`/fee-limits/fees/${id}`), { method: 'DELETE' });
      if (response.ok) {
        fetchConfigurations();
      }
    } catch (error) {
      console.error('Error deleting fee configuration:', error);
    }
  };

  const handlePreviewCalculation = async () => {
    if (!previewAmount) return;
    
    try {
      const response = await fetch(createApiUrl('/fee-limits/preview'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          transactionAmount: parseFloat(previewAmount)
        })
      });
      
      const data = await response.json();
      if (data.success) {
        setPreviewResult(data.data);
      }
    } catch (error) {
      console.error('Error calculating preview:', error);
    }
  };

  const openEditFee = (fee: FeeConfiguration) => {
    setEditingFee(fee);
    setFeeForm(fee);
    setFeeDialogOpen(true);
  };

  const openEditLimit = (limit: LimitConfiguration) => {
    setEditingLimit(limit);
    setLimitForm(limit);
    setLimitDialogOpen(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <Settings2 className="w-8 h-8 animate-spin text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">Loading configurations...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Fee & Limits Configuration</h1>
          <p className="text-sm text-muted-foreground">Configure fees, reserves, and exposure limits</p>
        </div>
        <div className="flex gap-2">
          <Dialog open={previewDialogOpen} onOpenChange={setPreviewDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="gap-2">
                <Calculator className="w-4 h-4" />
                Preview Calculation
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Fee & Limit Preview</DialogTitle>
                <DialogDescription>
                  Preview fees and limit checks for a transaction amount
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="amount">Transaction Amount</Label>
                  <Input
                    id="amount"
                    type="number"
                    placeholder="Enter amount"
                    value={previewAmount}
                    onChange={(e) => setPreviewAmount(e.target.value)}
                  />
                </div>
                <Button onClick={handlePreviewCalculation} className="w-full">
                  Calculate Preview
                </Button>
                
                {previewResult && (
                  <div className="space-y-4 pt-4 border-t">
                    <div>
                      <h4 className="font-semibold">Fee Breakdown</h4>
                      {previewResult.fees.map((fee, index) => (
                        <div key={index} className="flex justify-between text-sm">
                          <span>{fee.description}</span>
                          <span>${fee.amount.toFixed(2)}</span>
                        </div>
                      ))}
                      <div className="flex justify-between font-semibold border-t pt-2">
                        <span>Total Fees:</span>
                        <span>${previewResult.totalFees.toFixed(2)}</span>
                      </div>
                    </div>
                    
                    {previewResult.violations.length > 0 && (
                      <Alert>
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription>
                          <div className="space-y-1">
                            <strong>Limit Violations:</strong>
                            {previewResult.violations.map((violation, index) => (
                              <div key={index} className="text-sm">• {violation}</div>
                            ))}
                          </div>
                        </AlertDescription>
                      </Alert>
                    )}
                    
                    {previewResult.warnings.length > 0 && (
                      <Alert>
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription>
                          <div className="space-y-1">
                            <strong>Warnings:</strong>
                            {previewResult.warnings.map((warning, index) => (
                              <div key={index} className="text-sm">• {warning}</div>
                            ))}
                          </div>
                        </AlertDescription>
                      </Alert>
                    )}
                  </div>
                )}
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="fees">Fee Configurations</TabsTrigger>
          <TabsTrigger value="limits">Limit Configurations</TabsTrigger>
        </TabsList>

        <TabsContent value="fees" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Fee Configurations</CardTitle>
                  <CardDescription>
                    Define configurable fee structures for automatic calculation
                  </CardDescription>
                </div>
                <Dialog open={feeDialogOpen} onOpenChange={setFeeDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="gap-2">
                      <Plus className="w-4 h-4" />
                      New Fee Configuration
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>
                        {editingFee ? 'Edit Fee Configuration' : 'New Fee Configuration'}
                      </DialogTitle>
                      <DialogDescription>
                        Configure automatic fee calculation rules
                      </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="fee-name">Name</Label>
                          <Input
                            id="fee-name"
                            value={feeForm.name || ''}
                            onChange={(e) => setFeeForm({ ...feeForm, name: e.target.value })}
                            placeholder="e.g., Processing Fee"
                          />
                        </div>
                        <div>
                          <Label htmlFor="fee-type">Type</Label>
                          <Select value={feeForm.type} onValueChange={(value) => setFeeForm({ ...feeForm, type: value as any })}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="flat">Flat Amount</SelectItem>
                              <SelectItem value="percentage">Percentage</SelectItem>
                              <SelectItem value="tiered">Tiered</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      
                      <div>
                        <Label htmlFor="fee-description">Description</Label>
                        <Textarea
                          id="fee-description"
                          value={feeForm.description || ''}
                          onChange={(e) => setFeeForm({ ...feeForm, description: e.target.value })}
                          placeholder="Describe when this fee applies"
                        />
                      </div>
                      
                      {feeForm.type === 'flat' && (
                        <div>
                          <Label htmlFor="flat-amount">Flat Amount ($)</Label>
                          <Input
                            id="flat-amount"
                            type="number"
                            step="0.01"
                            value={feeForm.flatAmount || ''}
                            onChange={(e) => setFeeForm({ ...feeForm, flatAmount: parseFloat(e.target.value) })}
                          />
                        </div>
                      )}
                      
                      {feeForm.type === 'percentage' && (
                        <div className="grid grid-cols-3 gap-4">
                          <div>
                            <Label htmlFor="percentage">Percentage (%)</Label>
                            <Input
                              id="percentage"
                              type="number"
                              step="0.01"
                              value={feeForm.percentage || ''}
                              onChange={(e) => setFeeForm({ ...feeForm, percentage: parseFloat(e.target.value) })}
                            />
                          </div>
                          <div>
                            <Label htmlFor="min-amount">Min Amount ($)</Label>
                            <Input
                              id="min-amount"
                              type="number"
                              step="0.01"
                              value={feeForm.minAmount || ''}
                              onChange={(e) => setFeeForm({ ...feeForm, minAmount: parseFloat(e.target.value) })}
                            />
                          </div>
                          <div>
                            <Label htmlFor="max-amount">Max Amount ($)</Label>
                            <Input
                              id="max-amount"
                              type="number"
                              step="0.01"
                              value={feeForm.maxAmount || ''}
                              onChange={(e) => setFeeForm({ ...feeForm, maxAmount: parseFloat(e.target.value) })}
                            />
                          </div>
                        </div>
                      )}
                      
                      <div className="flex items-center space-x-2">
                        <Switch
                          id="fee-active"
                          checked={feeForm.isActive}
                          onCheckedChange={(checked) => setFeeForm({ ...feeForm, isActive: checked })}
                        />
                        <Label htmlFor="fee-active">Active</Label>
                      </div>
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" onClick={() => setFeeDialogOpen(false)}>
                        Cancel
                      </Button>
                      <Button onClick={handleSaveFee}>
                        {editingFee ? 'Update' : 'Create'} Configuration
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Value</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {feeConfigurations.map((fee) => (
                    <TableRow key={fee.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{fee.name}</div>
                          <div className="text-sm text-muted-foreground">{fee.description}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {fee.type.charAt(0).toUpperCase() + fee.type.slice(1)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {fee.type === 'flat' && `$${fee.flatAmount?.toFixed(2)}`}
                        {fee.type === 'percentage' && `${fee.percentage}%`}
                        {fee.type === 'tiered' && 'Tiered'}
                        {fee.type === 'percentage' && fee.minAmount && (
                          <div className="text-xs text-muted-foreground">
                            Min: ${fee.minAmount}, Max: ${fee.maxAmount}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant={fee.isActive ? 'default' : 'secondary'}>
                          {fee.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openEditFee(fee)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteFee(fee.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="limits" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Limit Configurations</CardTitle>
                  <CardDescription>
                    Configure exposure limits and thresholds for risk management
                  </CardDescription>
                </div>
                <Dialog open={limitDialogOpen} onOpenChange={setLimitDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="gap-2">
                      <Plus className="w-4 h-4" />
                      New Limit Configuration
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>
                        {editingLimit ? 'Edit Limit Configuration' : 'New Limit Configuration'}
                      </DialogTitle>
                      <DialogDescription>
                        Configure automatic limit enforcement rules
                      </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="limit-name">Name</Label>
                          <Input
                            id="limit-name"
                            value={limitForm.name || ''}
                            onChange={(e) => setLimitForm({ ...limitForm, name: e.target.value })}
                            placeholder="e.g., Transaction Limit"
                          />
                        </div>
                        <div>
                          <Label htmlFor="limit-type">Type</Label>
                          <Select value={limitForm.type} onValueChange={(value) => setLimitForm({ ...limitForm, type: value as any })}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="buyer_credit">Buyer Credit</SelectItem>
                              <SelectItem value="supplier_concentration">Supplier Concentration</SelectItem>
                              <SelectItem value="transaction_value">Transaction Value</SelectItem>
                              <SelectItem value="daily">Daily Limit</SelectItem>
                              <SelectItem value="monthly">Monthly Limit</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      
                      <div>
                        <Label htmlFor="limit-description">Description</Label>
                        <Textarea
                          id="limit-description"
                          value={limitForm.description || ''}
                          onChange={(e) => setLimitForm({ ...limitForm, description: e.target.value })}
                          placeholder="Describe this limit configuration"
                        />
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="max-value">Maximum Value ($)</Label>
                          <Input
                            id="max-value"
                            type="number"
                            value={limitForm.maxValue || ''}
                            onChange={(e) => setLimitForm({ ...limitForm, maxValue: parseFloat(e.target.value) })}
                          />
                        </div>
                        <div>
                          <Label htmlFor="warning-threshold">Warning Threshold (%)</Label>
                          <Input
                            id="warning-threshold"
                            type="number"
                            min="0"
                            max="100"
                            value={limitForm.warningThreshold || ''}
                            onChange={(e) => setLimitForm({ ...limitForm, warningThreshold: parseFloat(e.target.value) })}
                          />
                        </div>
                      </div>
                      
                      <div className="space-y-3">
                        <div className="flex items-center space-x-2">
                          <Switch
                            id="block-breach"
                            checked={limitForm.blockOnBreach}
                            onCheckedChange={(checked) => setLimitForm({ ...limitForm, blockOnBreach: checked })}
                          />
                          <Label htmlFor="block-breach">Block transactions on breach</Label>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <Switch
                            id="manual-approval"
                            checked={limitForm.requireManualApproval}
                            onCheckedChange={(checked) => setLimitForm({ ...limitForm, requireManualApproval: checked })}
                          />
                          <Label htmlFor="manual-approval">Require manual approval</Label>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <Switch
                            id="limit-active"
                            checked={limitForm.isActive}
                            onCheckedChange={(checked) => setLimitForm({ ...limitForm, isActive: checked })}
                          />
                          <Label htmlFor="limit-active">Active</Label>
                        </div>
                      </div>
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" onClick={() => setLimitDialogOpen(false)}>
                        Cancel
                      </Button>
                      <Button onClick={handleSaveLimit}>
                        {editingLimit ? 'Update' : 'Create'} Configuration
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Maximum Value</TableHead>
                    <TableHead>Warning At</TableHead>
                    <TableHead>Actions on Breach</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {limitConfigurations.map((limit) => (
                    <TableRow key={limit.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{limit.name}</div>
                          <div className="text-sm text-muted-foreground">{limit.description}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {limit.type.replace('_', ' ').split(' ').map(word => 
                            word.charAt(0).toUpperCase() + word.slice(1)
                          ).join(' ')}
                        </Badge>
                      </TableCell>
                      <TableCell>${limit.maxValue.toLocaleString()}</TableCell>
                      <TableCell>
                        {limit.warningThreshold ? `${limit.warningThreshold}%` : 'None'}
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          {limit.blockOnBreach && <Badge variant="destructive" className="text-xs">Block</Badge>}
                          {limit.requireManualApproval && <Badge variant="secondary" className="text-xs">Manual Approval</Badge>}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={limit.isActive ? 'default' : 'secondary'}>
                          {limit.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openEditLimit(limit)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {/* Handle delete */}}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
