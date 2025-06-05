
import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { trpc } from '@/utils/trpc';
import type { Group, CreateGroupInput, UpdateGroupInput } from '../../../server/src/schema';

export function GroupManager() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Group[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<Group | null>(null);

  const [formData, setFormData] = useState<CreateGroupInput>({
    name: '',
    description: null,
    parent_group_id: undefined
  });

  const loadGroups = useCallback(async () => {
    try {
      const result = await trpc.getGroups.query();
      setGroups(result);
    } catch (error) {
      setError('Failed to load groups');
      console.error('Load groups error:', error);
    }
  }, []);

  useEffect(() => {
    loadGroups();
  }, [loadGroups]);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    
    setIsLoading(true);
    try {
      const results = await trpc.searchGroups.query({
        query: searchQuery,
        limit: 20,
        offset: 0
      });
      setSearchResults(results);
    } catch (error) {
      setError('Search failed');
      console.error('Search error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: null,
      parent_group_id: undefined
    });
    setEditingGroup(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      if (editingGroup) {
        const updateData: UpdateGroupInput = {
          id: editingGroup.id,
          ...formData
        };
        const updatedGroup = await trpc.updateGroup.mutate(updateData);
        setGroups((prev: Group[]) => 
          prev.map((g: Group) => g.id === updatedGroup.id ? updatedGroup : g)
        );
        setSuccess('Group updated successfully');
      } else {
        const newGroup = await trpc.createGroup.mutate(formData);
        setGroups((prev: Group[]) => [...prev, newGroup]);
        setSuccess('Group created successfully');
      }
      
      resetForm();
      setIsDialogOpen(false);
    } catch (error) {
      setError(editingGroup ? 'Failed to update group' : 'Failed to create group');
      console.error('Submit error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (group: Group) => {
    setEditingGroup(group);
    setFormData({
      name: group.name,
      description: group.description,
      parent_group_id: group.parent_group_id || undefined
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: number) => {
    setIsLoading(true);
    try {
      await trpc.deleteGroup.mutate({ id });
      setGroups((prev: Group[]) => prev.filter((g: Group) => g.id !== id));
      setSuccess('Group deleted successfully');
    } catch (error) {
      setError('Failed to delete group');
      console.error('Delete error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getParentGroupName = (parentId: number | null) => {
    if (!parentId) return '-';
    const parent = groups.find((g: Group) => g.id === parentId);
    return parent ? parent.name : 'Unknown';
  };

  const getAvailableParentGroups = () => {
    return groups.filter((g: Group) => editingGroup ? g.id !== editingGroup.id : true);
  };

  const displayedGroups = searchResults.length > 0 ? searchResults : groups;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">📁 Group Management</h2>
          <p className="text-gray-600">Organize your ledgers into groups</p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm} className="bg-purple-600 hover:bg-purple-700">
              ➕ Add New Group
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>{editingGroup ? 'Edit Group' : 'Create New Group'}</DialogTitle>
              <DialogDescription>
                {editingGroup ? 'Update group information' : 'Fill in the group details below'}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Group Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setFormData((prev: CreateGroupInput) => ({ ...prev, name: e.target.value }))
                  }
                  placeholder="Group name"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  value={formData.description || ''}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setFormData((prev: CreateGroupInput) => ({ 
                      ...prev, 
                      description: e.target.value || null 
                    }))
                  }
                  placeholder="Group description (optional)"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="parent-group">Parent Group (Optional)</Label>
                <Select 
                  value={formData.parent_group_id?.toString() || 'none'} 
                  onValueChange={(value: string) =>
                    setFormData((prev: CreateGroupInput) => ({ 
                      ...prev, 
                      parent_group_id: value === 'none' ? undefined : parseInt(value) 
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select parent group (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No Parent Group</SelectItem>
                    {getAvailableParentGroups().map((group: Group) => (
                      <SelectItem key={group.id} value={group.id.toString()}>
                        {group.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? 'Saving...' : (editingGroup ? 'Update' : 'Create')}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">🔍 Search Groups</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex space-x-2">
            <Input
              value={searchQuery}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
              placeholder="Search by group name or description..."
              onKeyPress={(e: React.KeyboardEvent) => {
                if (e.key === 'Enter') {
                  handleSearch();
                }
              }}
            />
            <Button onClick={handleSearch} disabled={isLoading}>
              {isLoading ? 'Searching...' : 'Search'}
            </Button>
            <Button variant="outline" onClick={() => {
              setSearchQuery('');
              setSearchResults([]);
            }}>
              Clear
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Alerts */}
      {error && (
        <Alert className="border-red-200 bg-red-50">
          <AlertDescription className="text-red-800">{error}</AlertDescription>
        </Alert>
      )}
      {success && (
        <Alert className="border-green-200 bg-green-50">
          <AlertDescription className="text-green-800">{success}</AlertDescription>
        </Alert>
      
      )}

      {/* Groups Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            📋 Groups List ({displayedGroups.length} {displayedGroups.length === 1 ? 'group' : 'groups'})
          </CardTitle>
          {searchResults.length > 0 && (
            <CardDescription>Showing search results for "{searchQuery}"</CardDescription>
          )}
        </CardHeader>
        <CardContent>
          {displayedGroups.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">
                {searchResults.length === 0 && searchQuery ? 'No groups found for your search.' : 'No groups yet. Create one above!'}
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Parent Group</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Updated</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {displayedGroups.map((group: Group) => (
                  <TableRow key={group.id}>
                    <TableCell className="font-medium">{group.name}</TableCell>
                    <TableCell>{group.description || '-'}</TableCell>
                    <TableCell>{getParentGroupName(group.parent_group_id)}</TableCell>
                    <TableCell>{group.created_at.toLocaleDateString()}</TableCell>
                    <TableCell>{group.updated_at.toLocaleDateString()}</TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button variant="outline" size="sm" onClick={() => handleEdit(group)}>
                          ✏️ Edit
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700">
                              🗑️ Delete
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Group</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete "{group.name}"? This action cannot be undone and may affect related ledgers.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDelete(group.id)}
                                className="bg-red-600 hover:bg-red-700"
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
