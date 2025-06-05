
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
import type { Contact, CreateContactInput, UpdateContactInput } from '../../../server/src/schema';

export function ContactsManager() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Contact[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);

  const [formData, setFormData] = useState<CreateContactInput>({
    name: '',
    contact_type: 'customer',
    phone: null,
    email: null,
    address: null
  });

  const loadContacts = useCallback(async () => {
    try {
      const result = await trpc.getContacts.query();
      setContacts(result);
    } catch (error) {
      setError('Failed to load contacts');
      console.error('Load contacts error:', error);
    }
  }, []);

  useEffect(() => {
    loadContacts();
  }, [loadContacts]);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    
    setIsLoading(true);
    try {
      const results = await trpc.searchContacts.query({
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
      contact_type: 'customer',
      phone: null,
      email: null,
      address: null
    });
    setEditingContact(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      if (editingContact) {
        const updateData: UpdateContactInput = {
          id: editingContact.id,
          ...formData
        };
        const updatedContact = await trpc.updateContact.mutate(updateData);
        setContacts((prev: Contact[]) => 
          prev.map((c: Contact) => c.id === updatedContact.id ? updatedContact : c)
        );
        setSuccess('Contact updated successfully');
      } else {
        const newContact = await trpc.createContact.mutate(formData);
        setContacts((prev: Contact[]) => [...prev, newContact]);
        setSuccess('Contact created successfully');
      }
      
      resetForm();
      setIsDialogOpen(false);
    } catch (error) {
      setError(editingContact ? 'Failed to update contact' : 'Failed to create contact');
      console.error('Submit error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (contact: Contact) => {
    setEditingContact(contact);
    setFormData({
      name: contact.name,
      contact_type: contact.contact_type,
      phone: contact.phone,
      email: contact.email,
      address: contact.address
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: number) => {
    setIsLoading(true);
    try {
      await trpc.deleteContact.mutate({ id });
      setContacts((prev: Contact[]) => prev.filter((c: Contact) => c.id !== id));
      setSuccess('Contact deleted successfully');
    } catch (error) {
      setError('Failed to delete contact');
      console.error('Delete error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getContactTypeColor = (type: string) => {
    switch (type) {
      case 'customer': return 'bg-blue-100 text-blue-800';
      case 'supplier': return 'bg-green-100 text-green-800';
      case 'both': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const displayedContacts = searchResults.length > 0 ? searchResults : contacts;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">👥 Contacts Management</h2>
          <p className="text-gray-600">Manage your customers and suppliers</p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm} className="bg-blue-600 hover:bg-blue-700">
              ➕ Add New Contact
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>{editingContact ? 'Edit Contact' : 'Create New Contact'}</DialogTitle>
              <DialogDescription>
                {editingContact ? 'Update contact information' : 'Fill in the contact details below'}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setFormData((prev: CreateContactInput) => ({ ...prev, name: e.target.value }))
                  }
                  placeholder="Contact name"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="contact-type">Contact Type *</Label>
                <Select 
                  value={formData.contact_type || 'customer'} 
                  onValueChange={(value: 'customer' | 'supplier' | 'both') =>
                    setFormData((prev: CreateContactInput) => ({ ...prev, contact_type: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select contact type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="customer">Customer</SelectItem>
                    <SelectItem value="supplier">Supplier</SelectItem>
                    <SelectItem value="both">Both</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  value={formData.phone || ''}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setFormData((prev: CreateContactInput) => ({ ...prev, phone: e.target.value || null }))
                  }
                  placeholder="Phone number"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email || ''}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setFormData((prev: CreateContactInput) => ({ ...prev, email: e.target.value || null }))
                  }
                  placeholder="Email address"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Address</Label>
                <Input
                  id="address"
                  value={formData.address || ''}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setFormData((prev: CreateContactInput) => ({ ...prev, address: e.target.value || null }))
                  }
                  placeholder="Contact address"
                />
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? 'Saving...' : (editingContact ? 'Update' : 'Create')}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">🔍 Search Contacts</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex space-x-2">
            <Input
              value={searchQuery}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
              placeholder="Search by name, email, phone..."
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

      {/* Contacts Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            📋 Contacts List ({displayedContacts.length} {displayedContacts.length === 1 ? 'contact' : 'contacts'})
          </CardTitle>
          {searchResults.length > 0 && (
            <CardDescription>Showing search results for "{searchQuery}"</CardDescription>
          )}
        </CardHeader>
        <CardContent>
          {displayedContacts.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">
                {searchResults.length === 0 && searchQuery ? 'No contacts found for your search.' : 'No contacts yet. Create one above!'}
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Address</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {displayedContacts.map((contact: Contact) => (
                  <TableRow key={contact.id}>
                    <TableCell className="font-medium">{contact.name}</TableCell>
                    <TableCell>
                      <Badge className={getContactTypeColor(contact.contact_type)}>
                        {contact.contact_type}
                      </Badge>
                    </TableCell>
                    <TableCell>{contact.phone || '-'}</TableCell>
                    <TableCell>{contact.email || '-'}</TableCell>
                    <TableCell>{contact.address || '-'}</TableCell>
                    <TableCell>{contact.created_at.toLocaleDateString()}</TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button variant="outline" size="sm" onClick={() => handleEdit(contact)}>
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
                              <AlertDialogTitle>Delete Contact</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete "{contact.name}"? This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDelete(contact.id)}
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
