
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { contactsTable } from '../db/schema';
import { type CreateContactInput, type UpdateContactInput, type SearchInput } from '../schema';
import { createContact, getContacts, getContact, updateContact, deleteContact, searchContacts } from '../handlers/contacts';
import { eq } from 'drizzle-orm';

// Test input data
const testContactInput: CreateContactInput = {
  name: 'Test Customer',
  contact_type: 'customer',
  phone: '+1234567890',
  email: 'test@example.com',
  address: '123 Test Street'
};

const testSupplierInput: CreateContactInput = {
  name: 'Test Supplier',
  contact_type: 'supplier',
  phone: '+0987654321',
  email: 'supplier@example.com',
  address: '456 Supplier Avenue'
};

describe('contacts handlers', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  describe('createContact', () => {
    it('should create a contact with all fields', async () => {
      const result = await createContact(testContactInput);

      expect(result.name).toEqual('Test Customer');
      expect(result.contact_type).toEqual('customer');
      expect(result.phone).toEqual('+1234567890');
      expect(result.email).toEqual('test@example.com');
      expect(result.address).toEqual('123 Test Street');
      expect(result.id).toBeDefined();
      expect(result.created_at).toBeInstanceOf(Date);
      expect(result.updated_at).toBeInstanceOf(Date);
    });

    it('should create a contact with minimal fields', async () => {
      const minimalInput: CreateContactInput = {
        name: 'Minimal Contact',
        contact_type: 'both'
      };

      const result = await createContact(minimalInput);

      expect(result.name).toEqual('Minimal Contact');
      expect(result.contact_type).toEqual('both');
      expect(result.phone).toBeNull();
      expect(result.email).toBeNull();
      expect(result.address).toBeNull();
      expect(result.id).toBeDefined();
    });

    it('should save contact to database', async () => {
      const result = await createContact(testContactInput);

      const contacts = await db.select()
        .from(contactsTable)
        .where(eq(contactsTable.id, result.id))
        .execute();

      expect(contacts).toHaveLength(1);
      expect(contacts[0].name).toEqual('Test Customer');
      expect(contacts[0].contact_type).toEqual('customer');
      expect(contacts[0].phone).toEqual('+1234567890');
    });
  });

  describe('getContacts', () => {
    it('should return empty array when no contacts exist', async () => {
      const result = await getContacts();
      expect(result).toEqual([]);
    });

    it('should return all contacts', async () => {
      await createContact(testContactInput);
      await createContact(testSupplierInput);

      const result = await getContacts();

      expect(result).toHaveLength(2);
      expect(result[0].name).toEqual('Test Customer');
      expect(result[1].name).toEqual('Test Supplier');
    });
  });

  describe('getContact', () => {
    it('should return contact by id', async () => {
      const created = await createContact(testContactInput);

      const result = await getContact({ id: created.id });

      expect(result.id).toEqual(created.id);
      expect(result.name).toEqual('Test Customer');
      expect(result.contact_type).toEqual('customer');
    });

    it('should throw error when contact not found', async () => {
      await expect(getContact({ id: 999 })).rejects.toThrow(/not found/i);
    });
  });

  describe('updateContact', () => {
    it('should update contact fields', async () => {
      const created = await createContact(testContactInput);

      const updateInput: UpdateContactInput = {
        id: created.id,
        name: 'Updated Customer',
        contact_type: 'both',
        phone: '+9999999999'
      };

      const result = await updateContact(updateInput);

      expect(result.id).toEqual(created.id);
      expect(result.name).toEqual('Updated Customer');
      expect(result.contact_type).toEqual('both');
      expect(result.phone).toEqual('+9999999999');
      expect(result.email).toEqual('test@example.com'); // Unchanged
      expect(result.address).toEqual('123 Test Street'); // Unchanged
    });

    it('should update only specified fields', async () => {
      const created = await createContact(testContactInput);

      const updateInput: UpdateContactInput = {
        id: created.id,
        name: 'New Name Only'
      };

      const result = await updateContact(updateInput);

      expect(result.name).toEqual('New Name Only');
      expect(result.contact_type).toEqual('customer'); // Unchanged
      expect(result.phone).toEqual('+1234567890'); // Unchanged
    });

    it('should set nullable fields to null', async () => {
      const created = await createContact(testContactInput);

      const updateInput: UpdateContactInput = {
        id: created.id,
        phone: null,
        email: null
      };

      const result = await updateContact(updateInput);

      expect(result.phone).toBeNull();
      expect(result.email).toBeNull();
      expect(result.name).toEqual('Test Customer'); // Unchanged
    });

    it('should throw error when contact not found', async () => {
      const updateInput: UpdateContactInput = {
        id: 999,
        name: 'Non-existent'
      };

      await expect(updateContact(updateInput)).rejects.toThrow(/not found/i);
    });
  });

  describe('deleteContact', () => {
    it('should delete contact', async () => {
      const created = await createContact(testContactInput);

      const result = await deleteContact({ id: created.id });

      expect(result.success).toBe(true);

      const contacts = await db.select()
        .from(contactsTable)
        .where(eq(contactsTable.id, created.id))
        .execute();

      expect(contacts).toHaveLength(0);
    });

    it('should throw error when contact not found', async () => {
      await expect(deleteContact({ id: 999 })).rejects.toThrow(/not found/i);
    });
  });

  describe('searchContacts', () => {
    beforeEach(async () => {
      await createContact(testContactInput);
      await createContact(testSupplierInput);
      await createContact({
        name: 'John Doe',
        contact_type: 'customer',
        phone: '+1111111111',
        email: 'john@doe.com',
        address: '789 Oak Street'
      });
    });

    it('should search by name', async () => {
      const searchInput: SearchInput = {
        query: 'Test Customer',
        limit: 10,
        offset: 0
      };

      const result = await searchContacts(searchInput);

      expect(result).toHaveLength(1);
      expect(result[0].name).toEqual('Test Customer');
    });

    it('should search by phone', async () => {
      const searchInput: SearchInput = {
        query: '+1234567890',
        limit: 10,
        offset: 0
      };

      const result = await searchContacts(searchInput);

      expect(result).toHaveLength(1);
      expect(result[0].name).toEqual('Test Customer');
    });

    it('should search by email', async () => {
      const searchInput: SearchInput = {
        query: 'supplier@example.com',
        limit: 10,
        offset: 0
      };

      const result = await searchContacts(searchInput);

      expect(result).toHaveLength(1);
      expect(result[0].name).toEqual('Test Supplier');
    });

    it('should search by address', async () => {
      const searchInput: SearchInput = {
        query: 'Oak Street',
        limit: 10,
        offset: 0
      };

      const result = await searchContacts(searchInput);

      expect(result).toHaveLength(1);
      expect(result[0].name).toEqual('John Doe');
    });

    it('should perform case-insensitive search', async () => {
      const searchInput: SearchInput = {
        query: 'test',
        limit: 10,
        offset: 0
      };

      const result = await searchContacts(searchInput);

      expect(result).toHaveLength(2);
      expect(result.map(c => c.name)).toContain('Test Customer');
      expect(result.map(c => c.name)).toContain('Test Supplier');
    });

    it('should respect limit and offset', async () => {
      const searchInput: SearchInput = {
        query: 'test',
        limit: 1,
        offset: 1
      };

      const result = await searchContacts(searchInput);

      expect(result).toHaveLength(1);
    });

    it('should return empty array when no matches found', async () => {
      const searchInput: SearchInput = {
        query: 'nonexistent',
        limit: 10,
        offset: 0
      };

      const result = await searchContacts(searchInput);

      expect(result).toEqual([]);
    });
  });
});
