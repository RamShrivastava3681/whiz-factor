import React, { useState } from 'react';
import { AddSupplierForm, SupplierFormData } from './AddSupplierForm';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';

interface AddSupplierDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddSupplierDialog({ open, onOpenChange }: AddSupplierDialogProps) {
  const handleSubmit = async (data: SupplierFormData) => {
    try {
      console.log('Supplier data:', data);
      
      // Send the data to the backend API
      const response = await fetch('http://localhost:3000/api/entities', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token') || ''}` 
        },
        body: JSON.stringify({
          ...data,
          type: 'supplier'
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to add supplier');
      }
      
      const result = await response.json();
      
      toast.success('Supplier added successfully!', {
        description: `${data.name} has been added to your supplier database.`
      });
      
      // Trigger a refresh of the entities list
      window.dispatchEvent(new CustomEvent('refreshEntities'));
      
      onOpenChange(false);
    } catch (error) {
      console.error('Error adding supplier:', error);
      toast.error('Failed to add supplier', {
        description: 'Please check your data and try again.'
      });
    }
  };

  const handleCancel = () => {
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-financial-navy">
            Add New Supplier
          </DialogTitle>
        </DialogHeader>
        <AddSupplierForm onSubmit={handleSubmit} onCancel={handleCancel} />
      </DialogContent>
    </Dialog>
  );
}