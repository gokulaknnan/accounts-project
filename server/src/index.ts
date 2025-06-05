
import { initTRPC } from '@trpc/server';
import { createHTTPServer } from '@trpc/server/adapters/standalone';
import 'dotenv/config';
import cors from 'cors';
import superjson from 'superjson';
import { z } from 'zod';

// Import schemas
import {
  loginInputSchema,
  createGroupInputSchema,
  updateGroupInputSchema,
  createContactInputSchema,
  updateContactInputSchema,
  createLedgerInputSchema,
  updateLedgerInputSchema,
  createFinancialYearInputSchema,
  createTransactionInputSchema,
  searchInputSchema,
  deleteInputSchema,
  daybookReportInputSchema,
  ledgerReportInputSchema,
  trialBalanceInputSchema
} from './schema';

// Import handlers
import { login } from './handlers/auth';
import {
  createGroup,
  getGroups,
  getGroup,
  updateGroup,
  deleteGroup,
  searchGroups
} from './handlers/groups';
import {
  createContact,
  getContacts,
  getContact,
  updateContact,
  deleteContact,
  searchContacts
} from './handlers/contacts';
import {
  createLedger,
  getLedgers,
  getLedger,
  updateLedger,
  deleteLedger,
  searchLedgers
} from './handlers/ledgers';
import {
  createFinancialYear,
  getFinancialYears,
  getActiveFinancialYear,
  setActiveFinancialYear,
  deleteFinancialYear
} from './handlers/financial_years';
import {
  createTransaction,
  getTransactions,
  getTransaction,
  getTransactionsByDateRange,
  correctTransaction,
  deleteTransaction
} from './handlers/transactions';
import {
  getDaybookReport,
  getLedgerReport,
  getTrialBalance,
  getProfitAndLoss,
  getBalanceSheet
} from './handlers/reports';
import {
  backupDatabase,
  cleanEntireDatabase,
  cleanCorrections
} from './handlers/tools';

const t = initTRPC.create({
  transformer: superjson,
});

const publicProcedure = t.procedure;
const router = t.router;

const appRouter = router({
  // Health check
  healthcheck: publicProcedure.query(() => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }),

  // Authentication
  login: publicProcedure
    .input(loginInputSchema)
    .mutation(({ input }) => login(input)),

  // Groups
  createGroup: publicProcedure
    .input(createGroupInputSchema)
    .mutation(({ input }) => createGroup(input)),
  getGroups: publicProcedure
    .query(() => getGroups()),
  getGroup: publicProcedure
    .input(deleteInputSchema)
    .query(({ input }) => getGroup(input)),
  updateGroup: publicProcedure
    .input(updateGroupInputSchema)
    .mutation(({ input }) => updateGroup(input)),
  deleteGroup: publicProcedure
    .input(deleteInputSchema)
    .mutation(({ input }) => deleteGroup(input)),
  searchGroups: publicProcedure
    .input(searchInputSchema)
    .query(({ input }) => searchGroups(input)),

  // Contacts
  createContact: publicProcedure
    .input(createContactInputSchema)
    .mutation(({ input }) => createContact(input)),
  getContacts: publicProcedure
    .query(() => getContacts()),
  getContact: publicProcedure
    .input(deleteInputSchema)
    .query(({ input }) => getContact(input)),
  updateContact: publicProcedure
    .input(updateContactInputSchema)
    .mutation(({ input }) => updateContact(input)),
  deleteContact: publicProcedure
    .input(deleteInputSchema)
    .mutation(({ input }) => deleteContact(input)),
  searchContacts: publicProcedure
    .input(searchInputSchema)
    .query(({ input }) => searchContacts(input)),

  // Ledgers
  createLedger: publicProcedure
    .input(createLedgerInputSchema)
    .mutation(({ input }) => createLedger(input)),
  getLedgers: publicProcedure
    .query(() => getLedgers()),
  getLedger: publicProcedure
    .input(deleteInputSchema)
    .query(({ input }) => getLedger(input)),
  updateLedger: publicProcedure
    .input(updateLedgerInputSchema)
    .mutation(({ input }) => updateLedger(input)),
  deleteLedger: publicProcedure
    .input(deleteInputSchema)
    .mutation(({ input }) => deleteLedger(input)),
  searchLedgers: publicProcedure
    .input(searchInputSchema)
    .query(({ input }) => searchLedgers(input)),

  // Financial Years
  createFinancialYear: publicProcedure
    .input(createFinancialYearInputSchema)
    .mutation(({ input }) => createFinancialYear(input)),
  getFinancialYears: publicProcedure
    .query(() => getFinancialYears()),
  getActiveFinancialYear: publicProcedure
    .query(() => getActiveFinancialYear()),
  setActiveFinancialYear: publicProcedure
    .input(deleteInputSchema)
    .mutation(({ input }) => setActiveFinancialYear(input)),
  deleteFinancialYear: publicProcedure
    .input(deleteInputSchema)
    .mutation(({ input }) => deleteFinancialYear(input)),

  // Transactions
  createTransaction: publicProcedure
    .input(createTransactionInputSchema)
    .mutation(({ input }) => createTransaction(input)),
  getTransactions: publicProcedure
    .query(() => getTransactions()),
  getTransaction: publicProcedure
    .input(deleteInputSchema)
    .query(({ input }) => getTransaction(input)),
  getTransactionsByDateRange: publicProcedure
    .input(z.object({
      start_date: z.coerce.date(),
      end_date: z.coerce.date()
    }))
    .query(({ input }) => getTransactionsByDateRange(input)),
  correctTransaction: publicProcedure
    .input(z.object({
      id: z.number(),
      correction_data: createTransactionInputSchema
    }))
    .mutation(({ input }) => correctTransaction(input)),
  deleteTransaction: publicProcedure
    .input(deleteInputSchema)
    .mutation(({ input }) => deleteTransaction(input)),

  // Reports
  getDaybookReport: publicProcedure
    .input(daybookReportInputSchema)
    .query(({ input }) => getDaybookReport(input)),
  getLedgerReport: publicProcedure
    .input(ledgerReportInputSchema)
    .query(({ input }) => getLedgerReport(input)),
  getTrialBalance: publicProcedure
    .input(trialBalanceInputSchema)
    .query(({ input }) => getTrialBalance(input)),
  getProfitAndLoss: publicProcedure
    .input(z.object({
      start_date: z.coerce.date(),
      end_date: z.coerce.date()
    }))
    .query(({ input }) => getProfitAndLoss(input)),
  getBalanceSheet: publicProcedure
    .input(z.object({
      as_on_date: z.coerce.date()
    }))
    .query(({ input }) => getBalanceSheet(input)),

  // Tools
  backupDatabase: publicProcedure
    .mutation(() => backupDatabase()),
  cleanEntireDatabase: publicProcedure
    .mutation(() => cleanEntireDatabase()),
  cleanCorrections: publicProcedure
    .mutation(() => cleanCorrections())
});

export type AppRouter = typeof appRouter;

async function start() {
  const port = process.env['SERVER_PORT'] || 2022;
  const server = createHTTPServer({
    middleware: (req, res, next) => {
      cors()(req, res, next);
    },
    router: appRouter,
    createContext() {
      return {};
    },
  });
  server.listen(port);
  console.log(`TRPC server listening at port: ${port}`);
}

start();
