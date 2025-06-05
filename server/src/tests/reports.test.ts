
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { groupsTable, contactsTable, ledgersTable, transactionEntriesTable, transactionDetailsTable } from '../db/schema';
import { 
  getDaybookReport, 
  getLedgerReport, 
  getTrialBalance, 
  getProfitAndLoss, 
  getBalanceSheet 
} from '../handlers/reports';
import type { 
  DaybookReportInput, 
  LedgerReportInput, 
  TrialBalanceInput 
} from '../schema';

describe('Reports', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  // Helper function to create test data
  const createTestData = async () => {
    // Create groups
    const [assetsGroup] = await db.insert(groupsTable)
      .values({ name: 'Assets', description: 'Asset accounts' })
      .returning()
      .execute();

    const [liabilitiesGroup] = await db.insert(groupsTable)
      .values({ name: 'Liabilities', description: 'Liability accounts' })
      .returning()
      .execute();

    const [incomeGroup] = await db.insert(groupsTable)
      .values({ name: 'Income', description: 'Income accounts' })
      .returning()
      .execute();

    // Create ledgers
    const [cashLedger] = await db.insert(ledgersTable)
      .values({
        name: 'Cash',
        group_id: assetsGroup.id,
        opening_balance: '10000',
        balance_type: 'debit'
      })
      .returning()
      .execute();

    const [bankLedger] = await db.insert(ledgersTable)
      .values({
        name: 'Bank',
        group_id: assetsGroup.id,
        opening_balance: '25000',
        balance_type: 'debit'
      })
      .returning()
      .execute();

    const [salesLedger] = await db.insert(ledgersTable)
      .values({
        name: 'Sales',
        group_id: incomeGroup.id,
        opening_balance: '0',
        balance_type: 'credit'
      })
      .returning()
      .execute();

    const [capitalLedger] = await db.insert(ledgersTable)
      .values({
        name: 'Capital',
        group_id: liabilitiesGroup.id,
        opening_balance: '50000',
        balance_type: 'credit'
      })
      .returning()
      .execute();

    // Create transaction entries
    const testDate1 = new Date('2024-01-15');
    const testDate2 = new Date('2024-01-20');

    const [entry1] = await db.insert(transactionEntriesTable)
      .values({
        entry_number: 'TXN001',
        entry_date: testDate1,
        description: 'Cash sale',
        total_amount: '5000'
      })
      .returning()
      .execute();

    const [entry2] = await db.insert(transactionEntriesTable)
      .values({
        entry_number: 'TXN002',
        entry_date: testDate2,
        description: 'Bank deposit',
        total_amount: '3000'
      })
      .returning()
      .execute();

    // Create transaction details
    await db.insert(transactionDetailsTable)
      .values([
        {
          entry_id: entry1.id,
          ledger_id: cashLedger.id,
          debit_amount: '5000',
          credit_amount: '0',
          description: 'Cash received'
        },
        {
          entry_id: entry1.id,
          ledger_id: salesLedger.id,
          debit_amount: '0',
          credit_amount: '5000',
          description: 'Sales recorded'
        },
        {
          entry_id: entry2.id,
          ledger_id: bankLedger.id,
          debit_amount: '3000',
          credit_amount: '0',
          description: 'Bank deposit'
        },
        {
          entry_id: entry2.id,
          ledger_id: cashLedger.id,
          debit_amount: '0',
          credit_amount: '3000',
          description: 'Cash withdrawn'
        }
      ])
      .execute();

    return {
      groups: { assetsGroup, liabilitiesGroup, incomeGroup },
      ledgers: { cashLedger, bankLedger, salesLedger, capitalLedger },
      entries: { entry1, entry2 }
    };
  };

  describe('getDaybookReport', () => {
    it('should generate daybook report for date range', async () => {
      await createTestData();

      const input: DaybookReportInput = {
        start_date: new Date('2024-01-01'),
        end_date: new Date('2024-01-31'),
        period: 'daily',
        day_summary: false
      };

      const result = await getDaybookReport(input);

      expect(result).toHaveLength(4); // 2 entries × 2 details each
      expect(result[0].entry_number).toEqual('TXN001');
      expect(result[0].description).toEqual('Cash sale');
      expect(typeof result[0].total_amount).toBe('number');
      expect(typeof result[0].debit_amount).toBe('number');
      expect(typeof result[0].credit_amount).toBe('number');
      expect(result[0].entry_date).toBeInstanceOf(Date);
    });

    it('should filter transactions by date range', async () => {
      await createTestData();

      const input: DaybookReportInput = {
        start_date: new Date('2024-01-16'),
        end_date: new Date('2024-01-31'),
        period: 'daily',
        day_summary: false
      };

      const result = await getDaybookReport(input);

      expect(result).toHaveLength(2); // Only TXN002 should be included
      expect(result.every(r => r.entry_number === 'TXN002')).toBe(true);
    });
  });

  describe('getLedgerReport', () => {
    it('should generate ledger report for all ledgers', async () => {
      const testData = await createTestData();

      const input: LedgerReportInput = {
        start_date: new Date('2024-01-01'),
        end_date: new Date('2024-01-31'),
        period: 'daily',
        ledger_summary: false
      };

      const result = await getLedgerReport(input);

      expect(result).toHaveLength(4);
      expect(result[0].ledger_name).toBeDefined();
      expect(typeof result[0].opening_balance).toBe('number');
      expect(typeof result[0].debit_amount).toBe('number');
      expect(typeof result[0].credit_amount).toBe('number');
      expect(result[0].balance_type).toMatch(/^(debit|credit)$/);
    });

    it('should filter by specific ledger', async () => {
      const testData = await createTestData();

      const input: LedgerReportInput = {
        ledger_id: testData.ledgers.cashLedger.id,
        start_date: new Date('2024-01-01'),
        end_date: new Date('2024-01-31'),
        period: 'daily',
        ledger_summary: false
      };

      const result = await getLedgerReport(input);

      expect(result.length).toBeGreaterThan(0);
      expect(result.every(r => r.ledger_id === testData.ledgers.cashLedger.id)).toBe(true);
      expect(result.every(r => r.ledger_name === 'Cash')).toBe(true);
    });

    it('should filter by group', async () => {
      const testData = await createTestData();

      const input: LedgerReportInput = {
        group_id: testData.groups.assetsGroup.id,
        start_date: new Date('2024-01-01'),
        end_date: new Date('2024-01-31'),
        period: 'daily',
        ledger_summary: false
      };

      const result = await getLedgerReport(input);

      expect(result.length).toBeGreaterThan(0);
      // Should only include Cash and Bank ledgers (both in Assets group)
      const ledgerNames = [...new Set(result.map(r => r.ledger_name))];
      expect(ledgerNames).toEqual(expect.arrayContaining(['Cash', 'Bank']));
      expect(ledgerNames).not.toContain('Sales');
    });
  });

  describe('getTrialBalance', () => {
    it('should generate trial balance as on date', async () => {
      await createTestData();

      const input: TrialBalanceInput = {
        as_on_date: new Date('2024-01-31')
      };

      const result = await getTrialBalance(input);

      expect(result).toHaveLength(4); // All 4 ledgers
      expect(result[0].ledger_name).toBeDefined();
      expect(typeof result[0].opening_balance).toBe('number');
      expect(typeof result[0].total_debit).toBe('number');
      expect(typeof result[0].total_credit).toBe('number');
      expect(typeof result[0].closing_balance).toBe('number');
      expect(result[0].closing_balance_type).toMatch(/^(debit|credit)$/);
    });

    it('should calculate closing balances correctly', async () => {
      await createTestData();

      const input: TrialBalanceInput = {
        as_on_date: new Date('2024-01-31')
      };

      const result = await getTrialBalance(input);

      // Find cash ledger result
      const cashResult = result.find(r => r.ledger_name === 'Cash');
      expect(cashResult).toBeDefined();
      
      // Cash: Opening 10000 (debit) + 5000 (debit) - 3000 (credit) = 12000 (debit)
      expect(cashResult!.total_debit).toEqual(5000);
      expect(cashResult!.total_credit).toEqual(3000);
      expect(cashResult!.closing_balance).toEqual(12000);
      expect(cashResult!.closing_balance_type).toEqual('debit');
    });
  });

  describe('getProfitAndLoss', () => {
    it('should generate profit and loss statement', async () => {
      await createTestData();

      const input = {
        start_date: new Date('2024-01-01'),
        end_date: new Date('2024-01-31')
      };

      const result = await getProfitAndLoss(input);

      expect(result.period.start_date).toEqual(input.start_date);
      expect(result.period.end_date).toEqual(input.end_date);
      expect(Array.isArray(result.income)).toBe(true);
      expect(Array.isArray(result.expenses)).toBe(true);
      expect(typeof result.total_income).toBe('number');
      expect(typeof result.total_expenses).toBe('number');
      expect(typeof result.net_profit).toBe('number');
      expect(typeof result.net_loss).toBe('number');
    });

    it('should correctly categorize income and expenses', async () => {
      await createTestData();

      const input = {
        start_date: new Date('2024-01-01'),
        end_date: new Date('2024-01-31')
      };

      const result = await getProfitAndLoss(input);

      // Sales should appear in income (has net credit balance)
      const incomeNames = result.income.map((i: any) => i.ledger_name);
      expect(incomeNames).toContain('Sales');
      
      expect(result.total_income).toBeGreaterThan(0);
      expect(result.net_profit).toEqual(result.total_income - result.total_expenses);
    });
  });

  describe('getBalanceSheet', () => {
    it('should generate balance sheet as on date', async () => {
      await createTestData();

      const input = {
        as_on_date: new Date('2024-01-31')
      };

      const result = await getBalanceSheet(input);

      expect(result.as_on_date).toEqual(input.as_on_date);
      expect(Array.isArray(result.assets)).toBe(true);
      expect(Array.isArray(result.liabilities)).toBe(true);
      expect(typeof result.total_assets).toBe('number');
      expect(typeof result.total_liabilities).toBe('number');
      expect(typeof result.difference).toBe('number');
    });

    it('should correctly categorize assets and liabilities', async () => {
      await createTestData();

      const input = {
        as_on_date: new Date('2024-01-31')
      };

      const result = await getBalanceSheet(input);

      // Assets should include Cash and Bank (both have debit balances)
      const assetNames = result.assets.map((a: any) => a.ledger_name);
      expect(assetNames).toContain('Cash');
      expect(assetNames).toContain('Bank');

      // Liabilities should include Capital (has credit balance)
      const liabilityNames = result.liabilities.map((l: any) => l.ledger_name);
      expect(liabilityNames).toContain('Capital');

      expect(result.total_assets).toBeGreaterThan(0);
      expect(result.total_liabilities).toBeGreaterThan(0);
    });
  });
});
