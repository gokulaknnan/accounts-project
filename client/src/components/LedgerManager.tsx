
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
import { Badge } from '@/components/ui/badge';
import { trpc } from '@/utils/trpc';
import type { Ledger, CreateLedgerInput, UpdateLedgerInput, Group, Contact } from '../../../server/src/schema';

export function LedgerManager() {
  const [ledgers, setLedgers] = useState<Ledger[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Ledger[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingLedger, setEditingLedger] = useState<Ledger | null>(null);

  const [formData, setFormData] = useState<CreateLedgerInput>({
    name: '',
    group_id: 0,
    contact_id: undefined,
    opening_balance: 0,
    balance_type: 'debit'
  });

  const loadData = useCallback(async () => {
    try {
      const [ledgersResult, groupsResult, contactsResult] = await Promise.all([
        trpc.getLedgers.query(),
        trpc.getGroups.query(),
        trpc.getContacts.query()
      ]);
      setLedgers(ledgersResult);
      setGroups(groupsResult);
      setContacts(contactsResult);
    } catch (error) {
      setError('Failed to load data');
      console.error('Load data error:', error);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    
    setIsLoading(true);
    try {
      const results = await trpc.searchLedgers.query({
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
      group_id: groups.length > 0 ? groups[0].id : 0,
      contact_id: undefined,
      opening_balance: 0,
      balance_type: 'debit'
    });
    setEditingLedger(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      if (editingLedger) {
        const updateData: UpdateLedgerInput = {
          id: editingLedger.id,
          ...formData
        };
        const updatedLedger = await trpc.updateLedger.mutate(updateData);
        setLedgers((prev: Ledger[]) => 
          prev.map((l: Ledger) => l.id === updatedLedger.id ? updatedLedger : l)
        );
        setSuccess('Ledger updated successfully');
      } else {
        const newLedger = await trpc.createLedger.mutate(formData);
        setLedgers((prev: Ledger[]) => [...prev, newLedger]);
        setSuccess('Ledger created successfully');
      }
      
      resetForm();
      setIsDialogOpen(false);
    } catch (error) {
      setError(editingLedger ? 'Failed to update ledger' : 'Failed to create ledger');
      console.error('Submit error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (ledger: Ledger) => {
    setEditingLedger(ledger);
    setFormData({
      name: ledger.name,
      group_id: ledger.group_id,
      contact_id: ledger.contact_id || undefined,
      opening_balance: ledger.opening_balance,
      balance_type: ledger.balance_type
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: number) => {
    setIsLoading(true);
    try {
      await trpc.deleteLedger.mutate({ id });
      setLedgers((prev: Ledger[]) => prev.filter((l: Ledger) => l.id !== id));
      setSuccess('Ledger deleted successfully');
    } catch (error) {
      setError('Failed to delete ledger');
      console.error('Delete error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getGroupName = (groupId: number) => {
    const group = groups.find((g: Group) => g.id === groupId);
    return group ? group.name : 'Unknown';
  };

  const getContactName = (contactId: number | null) => {
    if (!contactId) return '-';
    const contact = contacts.find((c: Contact) => c.id === contactId);
    return contact ? contact.name : 'Unknown';
  };

  const displayedLedgers = searchResults.length > 0 ? searchResults : ledgers;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">📖 Ledger Management</h2>
          <p className="text-gray-600">Manage your account ledgers</p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm} className="bg-green-600 hover:bg-green-700">
              ➕ Add New Ledger
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>{editingLedger ? 'Edit Ledger' : 'Create New Ledger'}</DialogTitle>
              <DialogDescription>
                {editingLedger ? 'Update ledger information' : 'Fill in the ledger details below'}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Ledger Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setFormData((prev: CreateLedgerInput) => ({ ...prev, name: e.target.value }))
                  }
                  placeholder="Ledger name"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="group">Group *</Label>
                <Select 
                  value={formData.group_id > 0 ? formData.group_id.toString() : groups.length > 0 ? groups[0].id.toString() : 'default'} 
                  onValueChange={(value: string) =>
                    setFormData((prev: CreateLedgerInput) => ({ ...prev, group_id: parseInt(value) }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select group" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="default">Select a group</SelectItem>
                    {groups.map((group: Group) => (
                      <SelectItem key={group.id} value={group.id.toString()}>
                        {group.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="contact">Contact (Optional)</Label>
                <Select 
                  value={formData.contact_id?.toString() || 'none'} 
                  onValueChange={(value: string) =>
                    setFormData((prev: CreateLedgerInput) => ({ 
                      ...prev, 
                      contact_id: value === 'none' ? undefined : parseInt(value) 
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select contact (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No Contact</SelectItem>
                    {contacts.map((contact: Contact) => (
                      <SelectItem key={contact.id} value={contact.id.toString()}>
                        {contact.name} ({contact.contact_type})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="opening-balance">Opening Balance</Label>
                <Input
                  id="opening-balance"
                  type="number"
                  step="0.01"
                  value={formData.opening_balance}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setFormData((prev: CreateLedgerInput) => ({ 
                      ...prev, 
                      opening_balance: parseFloat(e.target.value) || 0 
                    }))
                  }
                  placeholder="0.00"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="balance-type">Balance Type</Label>
                <Select 
                  value={formData.balance_type} 
                  onValueChange={(value: 'debit' | 'credit') =>
                    setFormData((prev: CreateLedgerInput) => ({ ...prev, balance_type: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select balance type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="debit">Debit</SelectItem>
                    <SelectItem value="credit">Credit</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? 'Saving...' : (editingLedger ? 'Update' : 'Create')}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">🔍 Search Ledgers</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex space-x-2">
            <Input
              value={searchQuery}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
              placeholder="Search by ledger name..."
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

      {/* Ledgers Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            📋 Ledgers List ({displayedLedgers.length} {displayedLedgers.length === 1 ? 'ledger' : 'ledgers'})
          </CardTitle>
          {searchResults.length > 0 && (
            <CardDescription>Showing search results for "{searchQuery}"</CardDescription>
          )}
        </CardHeader>
        <CardContent>
          {displayedLedgers.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">
                {searchResults.length === 0 && searchQuery ? 'No ledgers found for your search.' : 'No ledgers yet. Create one above!'}
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Group</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Opening Balance</TableHead>
                  <TableHead>Balance Type</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {displayedLedgers.map((ledger: Ledger) => (
                  <TableRow key={ledger.id}>
                    <TableCell className="font-medium">{ledger.name}</TableCell>
                    <TableCell>{getGroupName(ledger.group_id)}</TableCell>
                    <TableCell>{getContactName(ledger.contact_id)}</TableCell>
                    <TableCell>{ledger.opening_balance.toFixed(2)}</TableCell>
                    <TableCell>
                      <Badge className={ledger.balance_type === 'debit' ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}>
                        {ledger.balance_type}
                      </Badge>
                    </TableCell>
                    <TableCell>{ledger.created_at.toLocaleDateString()}</TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button variant="outline" size="sm" onClick={() => handleEdit(ledger)}>
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
                              <AlertDialogTitle>Delete Ledger</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete "{ledger.name}"? This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDelete(ledger.id)}
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
