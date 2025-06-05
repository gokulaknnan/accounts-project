
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { financialYearsTable } from '../db/schema';
import { type CreateFinancialYearInput } from '../schema';
import { 
  createFinancialYear, 
  getFinancialYears, 
  getActiveFinancialYear, 
  setActiveFinancialYear, 
  deleteFinancialYear 
} from '../handlers/financial_years';
import { eq } from 'drizzle-orm';

const testInput: CreateFinancialYearInput = {
  name: 'FY 2023-24',
  start_date: new Date('2023-04-01'),
  end_date: new Date('2024-03-31'),  
  is_active: false
};

const testInput2: CreateFinancialYearInput = {
  name: 'FY 2024-25',
  start_date: new Date('2024-04-01'),
  end_date: new Date('2025-03-31'),
  is_active: true
};

describe('Financial Years', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  describe('createFinancialYear', () => {
    it('should create a financial year', async () => {
      const result = await createFinancialYear(testInput);

      expect(result.name).toEqual('FY 2023-24');
      expect(result.start_date).toEqual(new Date('2023-04-01'));
      expect(result.end_date).toEqual(new Date('2024-03-31'));
      expect(result.is_active).toEqual(false);
      expect(result.id).toBeDefined();
      expect(result.created_at).toBeInstanceOf(Date);
      expect(result.updated_at).toBeInstanceOf(Date);
    });

    it('should save financial year to database', async () => {
      const result = await createFinancialYear(testInput);

      const financialYears = await db.select()
        .from(financialYearsTable)
        .where(eq(financialYearsTable.id, result.id))
        .execute();

      expect(financialYears).toHaveLength(1);
      expect(financialYears[0].name).toEqual('FY 2023-24');
      expect(financialYears[0].is_active).toEqual(false);
    });

    it('should create active financial year', async () => {
      const result = await createFinancialYear(testInput2);

      expect(result.is_active).toEqual(true);
      expect(result.name).toEqual('FY 2024-25');
    });
  });

  describe('getFinancialYears', () => {
    it('should return empty array when no financial years exist', async () => {
      const results = await getFinancialYears();
      expect(results).toEqual([]);
    });

    it('should return all financial years', async () => {
      await createFinancialYear(testInput);
      await createFinancialYear(testInput2);

      const results = await getFinancialYears();

      expect(results).toHaveLength(2);
      expect(results[0].name).toEqual('FY 2023-24');
      expect(results[1].name).toEqual('FY 2024-25');
    });
  });

  describe('getActiveFinancialYear', () => {
    it('should return null when no active financial year exists', async () => {
      const result = await getActiveFinancialYear();
      expect(result).toBeNull();
    });

    it('should return null when only inactive financial years exist', async () => {
      await createFinancialYear(testInput);
      
      const result = await getActiveFinancialYear();
      expect(result).toBeNull();
    });

    it('should return active financial year', async () => {
      await createFinancialYear(testInput);
      await createFinancialYear(testInput2);

      const result = await getActiveFinancialYear();

      expect(result).not.toBeNull();
      expect(result!.name).toEqual('FY 2024-25');
      expect(result!.is_active).toEqual(true);
    });
  });

  describe('setActiveFinancialYear', () => {
    it('should throw error when financial year does not exist', async () => {
      await expect(setActiveFinancialYear({ id: 999 }))
        .rejects.toThrow(/not found/i);
    });

    it('should set financial year as active', async () => {
      const fy1 = await createFinancialYear(testInput);
      const fy2 = await createFinancialYear(testInput2);

      // Set first financial year as active
      const result = await setActiveFinancialYear({ id: fy1.id });

      expect(result.id).toEqual(fy1.id);
      expect(result.is_active).toEqual(true);

      // Verify in database that only one is active
      const allFinancialYears = await getFinancialYears();
      const activeYears = allFinancialYears.filter(fy => fy.is_active);
      
      expect(activeYears).toHaveLength(1);
      expect(activeYears[0].id).toEqual(fy1.id);
    });

    it('should deactivate previously active financial year', async () => {
      const fy1 = await createFinancialYear(testInput);
      const fy2 = await createFinancialYear(testInput2); // This one is active

      // Verify fy2 is initially active
      let activeYear = await getActiveFinancialYear();
      expect(activeYear!.id).toEqual(fy2.id);

      // Set fy1 as active
      await setActiveFinancialYear({ id: fy1.id });

      // Verify only fy1 is now active
      activeYear = await getActiveFinancialYear();
      expect(activeYear!.id).toEqual(fy1.id);

      // Verify fy2 is no longer active
      const allFinancialYears = await getFinancialYears();
      const fy2Updated = allFinancialYears.find(fy => fy.id === fy2.id);
      expect(fy2Updated!.is_active).toEqual(false);
    });
  });

  describe('deleteFinancialYear', () => {
    it('should return false when financial year does not exist', async () => {
      const result = await deleteFinancialYear({ id: 999 });
      expect(result.success).toEqual(false);
    });

    it('should delete financial year successfully', async () => {
      const fy = await createFinancialYear(testInput);

      const result = await deleteFinancialYear({ id: fy.id });
      expect(result.success).toEqual(true);

      // Verify it's deleted from database
      const financialYears = await db.select()
        .from(financialYearsTable)
        .where(eq(financialYearsTable.id, fy.id))
        .execute();

      expect(financialYears).toHaveLength(0);
    });

    it('should delete active financial year', async () => {
      const fy = await createFinancialYear(testInput2); // active financial year

      const result = await deleteFinancialYear({ id: fy.id });
      expect(result.success).toEqual(true);

      // Verify no active financial year exists
      const activeYear = await getActiveFinancialYear();
      expect(activeYear).toBeNull();
    });
  });
});
