import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { AddTransactionDialog } from '../components/forms/AddTransactionDialog';

// Mock dependencies that might exist
vi.mock('sonner', () => ({
    toast: { success: vi.fn(), error: vi.fn() }
}));

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
    observe() { }
    unobserve() { }
    disconnect() { }
};

describe('AddTransactionDialog', () => {
    it('calculates reserve amount automatically as 20% of invoice amount and is read-only', async () => {
        render(
            <AddTransactionDialog
                open={true}
                onOpenChange={vi.fn()}
            />
        );

        // Initial check (might be empty/0)
        const reserveInput = screen.getByLabelText(/Reserve Amount/i);
        expect(reserveInput).toHaveAttribute('readonly');

        // Find the invoice amount input and type a value
        const invoiceInput = screen.getByLabelText(/Invoice Amount/i);
        const user = userEvent.setup();
        await user.clear(invoiceInput);
        await user.type(invoiceInput, '10000');

        // Wait for the reserve amount to update
        // The value should be 2000 (20% of 10000)
        expect(reserveInput).toHaveValue(2000);
    });
});
