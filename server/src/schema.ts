
import { z } from 'zod';

// User schema
export const userSchema = z.object({
  id: z.number(),
  username: z.string(),
  email: z.string().email(),
  password_hash: z.string(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type User = z.infer<typeof userSchema>;

// Login input schema
export const loginInputSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1)
});

export type LoginInput = z.infer<typeof loginInputSchema>;

// Login response schema
export const loginResponseSchema = z.object({
  success: z.boolean(),
  user: userSchema.omit({ password_hash: true }).optional(),
  message: z.string().optional()
});

export type LoginResponse = z.infer<typeof loginResponseSchema>;

// Group schema
export const groupSchema = z.object({
  id: z.number(),
  name: z.string(),
  description: z.string().nullable(),
  parent_group_id: z.number().nullable(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type Group = z.infer<typeof groupSchema>;

// Create group input schema
export const createGroupInputSchema = z.object({
  name: z.string().min(1),
  description: z.string().nullable().optional(),
  parent_group_id: z.number().optional()
});

export type CreateGroupInput = z.infer<typeof createGroupInputSchema>;

// Update group input schema
export const updateGroupInputSchema = z.object({
  id: z.number(),
  name: z.string().min(1).optional(),
  description: z.string().nullable().optional(),
  parent_group_id: z.number().nullable().optional()
});

export type UpdateGroupInput = z.infer<typeof updateGroupInputSchema>;

// Contact schema
export const contactSchema = z.object({
  id: z.number(),
  name: z.string(),
  contact_type: z.enum(['customer', 'supplier', 'both']),
  phone: z.string().nullable(),
  email: z.string().email().nullable(),
  address: z.string().nullable(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type Contact = z.infer<typeof contactSchema>;

// Create contact input schema
export const createContactInputSchema = z.object({
  name: z.string().min(1),
  contact_type: z.enum(['customer', 'supplier', 'both']),
  phone: z.string().nullable().optional(),
  email: z.string().email().nullable().optional(),
  address: z.string().nullable().optional()
});

export type CreateContactInput = z.infer<typeof createContactInputSchema>;

// Update contact input schema
export const updateContactInputSchema = z.object({
  id: z.number(),
  name: z.string().min(1).optional(),
  contact_type: z.enum(['customer', 'supplier', 'both']).optional(),
  phone: z.string().nullable().optional(),
  email: z.string().email().nullable().optional(),
  address: z.string().nullable().optional()
});

export type UpdateContactInput = z.infer<typeof updateContactInputSchema>;

// Ledger schema
export const ledgerSchema = z.object({
  id: z.number(),
  name: z.string(),
  group_id: z.number(),
  contact_id: z.number().nullable(),
  opening_balance: z.number(),
  balance_type: z.enum(['debit', 'credit']),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type Ledger = z.infer<typeof ledgerSchema>;

// Create ledger input schema
export const createLedgerInputSchema = z.object({
  name: z.string().min(1),
  group_id: z.number(),
  contact_id: z.number().optional(),
  opening_balance: z.number().default(0),
  balance_type: z.enum(['debit', 'credit']).default('debit')
});

export type CreateLedgerInput = z.infer<typeof createLedgerInputSchema>;

// Update ledger input schema
export const updateLedgerInputSchema = z.object({
  id: z.number(),
  name: z.string().min(1).optional(),
  group_id: z.number().optional(),
  contact_id: z.number().nullable().optional(),
  opening_balance: z.number().optional(),
  balance_type: z.enum(['debit', 'credit']).optional()
});

export type UpdateLedgerInput = z.infer<typeof updateLedgerInputSchema>;

// Financial Year schema
export const financialYearSchema = z.object({
  id: z.number(),
  name: z.string(),
  start_date: z.coerce.date(),
  end_date: z.coerce.date(),
  is_active: z.boolean(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type FinancialYear = z.infer<typeof financialYearSchema>;

// Create financial year input schema
export const createFinancialYearInputSchema = z.object({
  name: z.string().min(1),
  start_date: z.coerce.date(),
  end_date: z.coerce.date(),
  is_active: z.boolean().default(false)
});

export type CreateFinancialYearInput = z.infer<typeof createFinancialYearInputSchema>;

// Transaction entry schema
export const transactionEntrySchema = z.object({
  id: z.number(),
  entry_number: z.string(),
  entry_date: z.coerce.date(),
  description: z.string(),
  total_amount: z.number(),
  is_correction: z.boolean(),
  original_entry_id: z.number().nullable(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type TransactionEntry = z.infer<typeof transactionEntrySchema>;

// Transaction detail schema
export const transactionDetailSchema = z.object({
  id: z.number(),
  entry_id: z.number(),
  ledger_id: z.number(),
  debit_amount: z.number(),
  credit_amount: z.number(),
  description: z.string().nullable()
});

export type TransactionDetail = z.infer<typeof transactionDetailSchema>;

// Create transaction input schema
export const createTransactionInputSchema = z.object({
  entry_date: z.coerce.date(),
  description: z.string().min(1),
  details: z.array(z.object({
    ledger_id: z.number(),
    debit_amount: z.number().default(0),
    credit_amount: z.number().default(0),
    description: z.string().nullable().optional()
  })).min(2)
});

export type CreateTransactionInput = z.infer<typeof createTransactionInputSchema>;

// Search input schema
export const searchInputSchema = z.object({
  query: z.string().min(1),
  limit: z.number().int().positive().default(10),
  offset: z.number().int().nonnegative().default(0)
});

export type SearchInput = z.infer<typeof searchInputSchema>;

// Report input schemas
export const daybookReportInputSchema = z.object({
  start_date: z.coerce.date(),
  end_date: z.coerce.date(),
  period: z.enum(['daily', 'weekly', 'monthly']).default('daily'),
  day_summary: z.boolean().default(false)
});

export type DaybookReportInput = z.infer<typeof daybookReportInputSchema>;

export const ledgerReportInputSchema = z.object({
  ledger_id: z.number().optional(),
  group_id: z.number().optional(),
  start_date: z.coerce.date(),
  end_date: z.coerce.date(),
  period: z.enum(['daily', 'weekly', 'monthly']).default('daily'),
  ledger_summary: z.boolean().default(false)
});

export type LedgerReportInput = z.infer<typeof ledgerReportInputSchema>;

export const trialBalanceInputSchema = z.object({
  as_on_date: z.coerce.date()
});

export type TrialBalanceInput = z.infer<typeof trialBalanceInputSchema>;

// Delete input schema
export const deleteInputSchema = z.object({
  id: z.number()
});

export type DeleteInput = z.infer<typeof deleteInputSchema>;
