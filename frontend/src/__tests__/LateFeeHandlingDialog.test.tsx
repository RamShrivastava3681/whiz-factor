import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import LateFeeHandlingDialog from '../components/forms/LateFeeHandlingDialog';

// Mock ResizeObserver for Radix UI dialogs
global.ResizeObserver = class ResizeObserver {
    observe() { }
    unobserve() { }
    disconnect() { }
};

describe('LateFeeHandlingDialog', () => {
    const mockInvoice = {
        id: 'INV-123',
        supplierName: 'Test Supplier',
        invoiceAmount: 1000,
        paidAmount: 0,
        remainingAmount: 1000,
        lateFees: 50,
        reference: 'REF123',
        agingDays: 15
    };

    it('renders with scrollable DialogContent classes', () => {
        render(
            <LateFeeHandlingDialog
                open={true}
                onOpenChange={vi.fn()}
                invoice={mockInvoice}
                reserves={100}
                onConfirm={vi.fn()}
            />
        );

        // In Radix UI, the DialogContent has a specific role or testid we can query
        const dialogContent = screen.getByRole('dialog');

        // Check if the appropriate scroll classes are present
        expect(dialogContent).toHaveClass('max-h-[90vh]');
        expect(dialogContent).toHaveClass('overflow-y-auto');
    });
});
