
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { groupsTable } from '../db/schema';
import { type CreateGroupInput, type UpdateGroupInput, type DeleteInput, type SearchInput } from '../schema';
import { createGroup, getGroups, getGroup, updateGroup, deleteGroup, searchGroups } from '../handlers/groups';
import { eq } from 'drizzle-orm';

const testGroupInput: CreateGroupInput = {
  name: 'Test Group',
  description: 'A group for testing',
  parent_group_id: undefined
};

const testGroupWithParentInput: CreateGroupInput = {
  name: 'Child Group',
  description: 'A child group for testing'
};

describe('Groups handlers', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  describe('createGroup', () => {
    it('should create a group without parent', async () => {
      const result = await createGroup(testGroupInput);

      expect(result.name).toEqual('Test Group');
      expect(result.description).toEqual('A group for testing');
      expect(result.parent_group_id).toBeNull();
      expect(result.id).toBeDefined();
      expect(result.created_at).toBeInstanceOf(Date);
      expect(result.updated_at).toBeInstanceOf(Date);
    });

    it('should create a group with parent', async () => {
      // Create parent group first
      const parentGroup = await createGroup(testGroupInput);

      const childInput: CreateGroupInput = {
        ...testGroupWithParentInput,
        parent_group_id: parentGroup.id
      };

      const result = await createGroup(childInput);

      expect(result.name).toEqual('Child Group');
      expect(result.parent_group_id).toEqual(parentGroup.id);
      expect(result.id).toBeDefined();
    });

    it('should save group to database', async () => {
      const result = await createGroup(testGroupInput);

      const groups = await db.select()
        .from(groupsTable)
        .where(eq(groupsTable.id, result.id))
        .execute();

      expect(groups).toHaveLength(1);
      expect(groups[0].name).toEqual('Test Group');
      expect(groups[0].description).toEqual('A group for testing');
    });
  });

  describe('getGroups', () => {
    it('should return empty array when no groups exist', async () => {
      const result = await getGroups();
      expect(result).toEqual([]);
    });

    it('should return all groups', async () => {
      await createGroup(testGroupInput);
      await createGroup({ ...testGroupInput, name: 'Second Group' });

      const result = await getGroups();

      expect(result).toHaveLength(2);
      expect(result[0].name).toEqual('Test Group');
      expect(result[1].name).toEqual('Second Group');
    });
  });

  describe('getGroup', () => {
    it('should return a specific group', async () => {
      const createdGroup = await createGroup(testGroupInput);

      const result = await getGroup({ id: createdGroup.id });

      expect(result.id).toEqual(createdGroup.id);
      expect(result.name).toEqual('Test Group');
      expect(result.description).toEqual('A group for testing');
    });

    it('should throw error for non-existent group', async () => {
      await expect(getGroup({ id: 999 }))
        .rejects.toThrow(/group not found/i);
    });
  });

  describe('updateGroup', () => {
    it('should update group name', async () => {
      const createdGroup = await createGroup(testGroupInput);

      const updateInput: UpdateGroupInput = {
        id: createdGroup.id,
        name: 'Updated Group Name'
      };

      const result = await updateGroup(updateInput);

      expect(result.id).toEqual(createdGroup.id);
      expect(result.name).toEqual('Updated Group Name');
      expect(result.description).toEqual('A group for testing'); // Unchanged
    });

    it('should update group description', async () => {
      const createdGroup = await createGroup(testGroupInput);

      const updateInput: UpdateGroupInput = {
        id: createdGroup.id,
        description: 'Updated description'
      };

      const result = await updateGroup(updateInput);

      expect(result.id).toEqual(createdGroup.id);
      expect(result.name).toEqual('Test Group'); // Unchanged
      expect(result.description).toEqual('Updated description');
    });

    it('should update parent group', async () => {
      const parentGroup = await createGroup(testGroupInput);
      const childGroup = await createGroup({ ...testGroupInput, name: 'Child Group' });

      const updateInput: UpdateGroupInput = {
        id: childGroup.id,
        parent_group_id: parentGroup.id
      };

      const result = await updateGroup(updateInput);

      expect(result.id).toEqual(childGroup.id);
      expect(result.parent_group_id).toEqual(parentGroup.id);
    });

    it('should throw error for non-existent group', async () => {
      const updateInput: UpdateGroupInput = {
        id: 999,
        name: 'Non-existent'
      };

      await expect(updateGroup(updateInput))
        .rejects.toThrow(/group not found/i);
    });
  });

  describe('deleteGroup', () => {
    it('should delete an existing group', async () => {
      const createdGroup = await createGroup(testGroupInput);

      const deleteInput: DeleteInput = { id: createdGroup.id };
      const result = await deleteGroup(deleteInput);

      expect(result.success).toBe(true);

      // Verify group is deleted
      const groups = await db.select()
        .from(groupsTable)
        .where(eq(groupsTable.id, createdGroup.id))
        .execute();

      expect(groups).toHaveLength(0);
    });

    it('should throw error for non-existent group', async () => {
      const deleteInput: DeleteInput = { id: 999 };

      await expect(deleteGroup(deleteInput))
        .rejects.toThrow(/group not found/i);
    });
  });

  describe('searchGroups', () => {
    it('should search groups by name', async () => {
      await createGroup({ name: 'Sales Group', description: 'Sales department' });
      await createGroup({ name: 'Purchase Group', description: 'Purchase department' });
      await createGroup({ name: 'Admin Team', description: 'Administration' });

      const searchInput: SearchInput = {
        query: 'Group',
        limit: 10,
        offset: 0
      };

      const result = await searchGroups(searchInput);

      expect(result).toHaveLength(2);
      expect(result.map(g => g.name)).toContain('Sales Group');
      expect(result.map(g => g.name)).toContain('Purchase Group');
    });

    it('should search groups by description', async () => {
      await createGroup({ name: 'Sales', description: 'Sales related activities' });
      await createGroup({ name: 'Purchase', description: 'Purchase activities' });

      const searchInput: SearchInput = {
        query: 'activities',
        limit: 10,
        offset: 0
      };

      const result = await searchGroups(searchInput);

      expect(result).toHaveLength(2);
    });

    it('should respect limit and offset', async () => {
      await createGroup({ name: 'Alpha Group', description: 'First' });
      await createGroup({ name: 'Beta Group', description: 'Second' });
      await createGroup({ name: 'Gamma Group', description: 'Third' });

      const searchInput: SearchInput = {
        query: 'Group',
        limit: 2,
        offset: 1
      };

      const result = await searchGroups(searchInput);

      expect(result).toHaveLength(2);
    });

    it('should return empty array for no matches', async () => {
      await createGroup({ name: 'Test Group', description: 'Testing' });

      const searchInput: SearchInput = {
        query: 'NonExistent',
        limit: 10,
        offset: 0
      };

      const result = await searchGroups(searchInput);

      expect(result).toEqual([]);
    });
  });
});
