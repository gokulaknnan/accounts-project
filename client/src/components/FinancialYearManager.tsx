
import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { trpc } from '@/utils/trpc';
import type { FinancialYear, CreateFinancialYearInput } from '../../../server/src/schema';

export function FinancialYearManager() {
  const [financialYears, setFinancialYears] = useState<FinancialYear[]>([]);
  const [activeYear, setActiveYear] = useState<FinancialYear | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const [formData, setFormData] = useState<CreateFinancialYearInput>({
    name: '',
    start_date: new Date(),
    end_date: new Date(),
    is_active: false
  });

  const loadData = useCallback(async () => {
    try {
      const [yearsResult, activeYearResult] = await Promise.all([
        trpc.getFinancialYears.query(),
        trpc.getActiveFinancialYear.query().catch(() => null)
      ]);
      setFinancialYears(yearsResult);
      setActiveYear(activeYearResult);
    } catch (error) {
      setError('Failed to load financial years');
      console.error('Load data error:', error);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const resetForm = () => {
    const currentDate = new Date();
    const nextYear = new Date(currentDate.getFullYear() + 1, currentDate.getMonth(), currentDate.getDate());
    
    setFormData({
      name: `FY ${currentDate.getFullYear()}-${currentDate.getFullYear() + 1}`,
      start_date: currentDate,
      end_date: nextYear,
      is_active: false
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      const newYear = await trpc.createFinancialYear.mutate(formData);
      setFinancialYears((prev: FinancialYear[]) => [...prev, newYear]);
      setSuccess('Financial year created successfully');
      
      resetForm();
      setIsDialogOpen(false);
      
      // Reload to get updated active year if this was set as active
      if (formData.is_active) {
        loadData();
      }
    } catch (error) {
      setError('Failed to create financial year');
      console.error('Submit error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSetActive = async (id: number) => {
    setIsLoading(true);
    try {
      await trpc.setActiveFinancialYear.mutate({ id });
      setSuccess('Active financial year updated successfully');
      loadData(); // Reload to get updated active year
    } catch (error) {
      setError('Failed to set active financial year');
      console.error('Set active error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    setIsLoading(true);
    try {
      await trpc.deleteFinancialYear.mutate({ id });
      setFinancialYears((prev: FinancialYear[]) => prev.filter((fy: FinancialYear) => fy.id !== id));
      setSuccess('Financial year deleted successfully');
      
      // Reload to get updated active year if the deleted year was active
      if (activeYear?.id === id) {
        loadData();
      }
    } catch (error) {
      setError('Failed to delete financial year');
      console.error('Delete error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString();
  };

  const formatDateForInput = (date: Date) => {
    return date.toISOString().split('T')[0];
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">📅 Financial Year Management</h2>
          <p className="text-gray-600">Manage your accounting periods</p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm} className="bg-indigo-600 hover:bg-indigo-700">
              ➕ Add New Financial Year
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Create New Financial Year</DialogTitle>
              <DialogDescription>
                Set up a new accounting period for your business
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Year Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setFormData((prev: CreateFinancialYearInput) => ({ ...prev, name: e.target.value }))
                  }
                  placeholder="e.g., FY 2023-2024"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="start-date">Start Date *</Label>
                <Input
                  id="start-date"
                  type="date"
                  value={formatDateForInput(formData.start_date)}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setFormData((prev: CreateFinancialYearInput) => ({ 
                      ...prev, 
                      start_date: new Date(e.target.value) 
                    }))
                  }
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="end-date">End Date *</Label>
                <Input
                  id="end-date"
                  type="date"
                  value={formatDateForInput(formData.end_date)}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setFormData((prev: CreateFinancialYearInput) => ({ 
                      ...prev, 
                      end_date: new Date(e.target.value) 
                    }))
                  }
                  required
                />
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="is-active"
                  checked={formData.is_active}
                  onCheckedChange={(checked: boolean) =>
                    setFormData((prev: CreateFinancialYearInput) => ({ ...prev, is_active: checked }))
                  }
                />
                <Label htmlFor="is-active">Set as active financial year</Label>
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? 'Creating...' : 'Create'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Active Year Info */}
      {activeYear && (
        <Card className="bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
          <CardHeader>
            <CardTitle className="text-lg text-green-800 flex items-center">
              ✅ Active Financial Year
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-green-900">{activeYear.name}</h3>
                <p className="text-sm text-green-700">
                  {formatDate(activeYear.start_date)} to {formatDate(activeYear.end_date)}
                </p>
              </div>
              <Badge className="bg-green-100 text-green-800">Active</Badge>
            </div>
          </CardContent>
        </Card>
      )}

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

      {/* Financial Years Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            📋 Financial Years List ({financialYears.length} {financialYears.length === 1 ? 'year' : 'years'})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {financialYears.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">No financial years yet. Create one above!</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Start Date</TableHead>
                  <TableHead>End Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {financialYears.map((fy: FinancialYear) => (
                  <TableRow key={fy.id}>
                    <TableCell className="font-medium">{fy.name}</TableCell>
                    <TableCell>{formatDate(fy.start_date)}</TableCell>
                    <TableCell>{formatDate(fy.end_date)}</TableCell>
                    <TableCell>
                      <Badge className={fy.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                        {fy.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell>{formatDate(fy.created_at)}</TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        {!fy.is_active && (
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => handleSetActive(fy.id)}
                            className="text-green-600 hover:text-green-700"
                          >
                            ✅ Set Active
                          </Button>
                        )}
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700">
                              🗑️ Delete
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Financial Year</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete "{fy.name}"? This action cannot be undone and may affect related transactions.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDelete(fy.id)}
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
