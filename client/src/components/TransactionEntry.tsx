
import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { trpc } from '@/utils/trpc';
import type { CreateTransactionInput, Ledger, TransactionEntry as TransactionEntryType } from '../../../server/src/schema';

interface TransactionDetail {
  ledger_id: number;
  debit_amount: number;
  credit_amount: number;
  description: string | null;
}

export function TransactionEntry() {
  const [ledgers, setLedgers] = useState<Ledger[]>([]);
  const [recentTransactions, setRecentTransactions] = useState<TransactionEntryType[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [formData, setFormData] = useState<CreateTransactionInput>({
    entry_date: new Date(),
    description: '',
    details: [
      { ledger_id: 0, debit_amount: 0, credit_amount: 0, description: null },
      { ledger_id: 0, debit_amount: 0, credit_amount: 0, description: null }
    ]
  });

  const loadData = useCallback(async () => {
    try {
      const [ledgersResult, transactionsResult] = await Promise.all([
        trpc.getLedgers.query(),
        trpc.getTransactions.query()
      ]);
      setLedgers(ledgersResult);
      setRecentTransactions(transactionsResult.slice(0, 10)); // Show only recent 10
    } catch (error) {
      setError('Failed to load data');
      console.error('Load data error:', error);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const addDetailRow = () => {
    setFormData((prev: CreateTransactionInput) => ({
      ...prev,
      details: [...prev.details, { ledger_id: 0, debit_amount: 0, credit_amount: 0, description: null }]
    }));
  };

  const removeDetailRow = (index: number) => {
    if (formData.details.length <= 2) return; // Keep at least 2 rows
    
    setFormData((prev: CreateTransactionInput) => ({
      ...prev,
      details: prev.details.filter((_, i) => i !== index)
    }));
  };

  const updateDetail = (index: number, field: keyof TransactionDetail, value: string | number | null) => {
    setFormData((prev: CreateTransactionInput) => ({
      ...prev,
      details: prev.details.map((detail, i) => 
        i === index ? { ...detail, [field]: value } : detail
      )
    }));
  };

  const getTotalDebits = () => {
    return formData.details.reduce((sum, detail) => sum + detail.debit_amount, 0);
  };

  const getTotalCredits = () => {
    return formData.details.reduce((sum, detail) => sum + detail.credit_amount, 0);
  };

  const isBalanced = () => {
    const totalDebits = getTotalDebits();
    const totalCredits = getTotalCredits();
    return Math.abs(totalDebits - totalCredits) < 0.01 && totalDebits > 0;
  };

  const resetForm = () => {
    setFormData({
      entry_date: new Date(),
      description: '',
      details: [
        { ledger_id: 0, debit_amount: 0, credit_amount: 0, description: null },
        { ledger_id: 0, debit_amount: 0, credit_amount: 0, description: null }
      ]
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isBalanced()) {
      setError('Transaction is not balanced. Total debits must equal total credits.');
      return;
    }

    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      const newTransaction = await trpc.createTransaction.mutate(formData);
      setSuccess(`Transaction created successfully! Entry Number: ${newTransaction.entry_number}`);
      resetForm();
      loadData(); // Reload recent transactions
    } catch (error) {
      setError('Failed to create transaction');
      console.error('Submit error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDateForInput = (date: Date) => {
    return date.toISOString().split('T')[0];
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">➕ Transaction Entry</h2>
        <p className="text-gray-600">Record new accounting transactions</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Transaction Form */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">💰 New Transaction</CardTitle>
              <CardDescription>Fill in the transaction details below</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Header Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="entry-date">Entry Date *</Label>
                    <Input
                      id="entry-date"
                      type="date"
                      value={formatDateForInput(formData.entry_date)}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setFormData((prev: CreateTransactionInput) => ({ 
                          ...prev, 
                          entry_date: new Date(e.target.value) 
                        }))
                      }
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description">Description *</Label>
                    <Input
                      id="description"
                      value={formData.description}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setFormData((prev: CreateTransactionInput) => ({ 
                          ...prev, 
                          description: e.target.value 
                        }))
                      }
                      placeholder="Transaction description"
                      required
                    />
                  </div>
                </div>

                {/* Transaction Details */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label className="text-base font-semibold">Transaction Details</Label>
                    <Button type="button" variant="outline" onClick={addDetailRow}>
                      ➕ Add Row
                    </Button>
                  </div>

                  <div className="border rounded-lg overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Ledger</TableHead>
                          <TableHead>Description</TableHead>
                          <TableHead>Debit</TableHead>
                          <TableHead>Credit</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {formData.details.map((detail, index) => (
                          <TableRow key={index}>
                            <TableCell>
                              <Select
                                value={detail.ledger_id.toString()}
                                onValueChange={(value: string) =>
                                  updateDetail(index, 'ledger_id', parseInt(value))
                                }
                              >
                                <SelectTrigger className="w-full">
                                  <SelectValue placeholder="Select ledger" />
                                </SelectTrigger>
                                <SelectContent>
                                  {ledgers.map((ledger: Ledger) => (
                                    <SelectItem key={ledger.id} value={ledger.id.toString()}>
                                      {ledger.name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </TableCell>
                            <TableCell>
                              <Input
                                value={detail.description || ''}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                  updateDetail(index, 'description', e.target.value || null)
                                }
                                placeholder="Line description"
                              />
                            </TableCell>
                            <TableCell>
                              <Input
                                type="number"
                                step="0.01"
                                min="0"
                                value={detail.debit_amount}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                  updateDetail(index, 'debit_amount', parseFloat(e.target.value) || 0)
                                }
                                placeholder="0.00"
                              />
                            </TableCell>
                            <TableCell>
                              <Input
                                type="number"
                                step="0.01"
                                min="0"
                                value={detail.credit_amount}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                  updateDetail(index, 'credit_amount', parseFloat(e.target.value) || 0)
                                }
                                placeholder="0.00"
                              />
                            </TableCell>
                            <TableCell>
                              {formData.details.length > 2 && (
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() => removeDetailRow(index)}
                                  className="text-red-600 hover:text-red-700"
                                >
                                  🗑️
                                </Button>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>

                  {/* Totals */}
                  <div className="flex justify-end space-x-4 text-sm">
                    <div className="text-right">
                      <div>Total Debits: <span className="font-semibold">${getTotalDebits().toFixed(2)}</span></div>
                      <div>Total Credits: <span className="font-semibold">${getTotalCredits().toFixed(2)}</span></div>
                      <div className={`font-semibold ${isBalanced() ? 'text-green-600' : 'text-red-600'}`}>
                        Difference: ${(getTotalDebits() - getTotalCredits()).toFixed(2)}
                      </div>
                    </div>
                  </div>
                </div>

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

                {/* Submit Buttons */}
                <div className="flex space-x-2">
                  <Button 
                    type="submit" 
                    disabled={isLoading || !isBalanced()}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    {isLoading ? 'Saving...' : '💾 Save Transaction'}
                  </Button>
                  <Button type="button" variant="outline" onClick={resetForm}>
                    🔄 Reset Form
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Recent Transactions */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">📋 Recent Transactions</CardTitle>
            </CardHeader>
            <CardContent>
              {recentTransactions.length === 0 ? (
                <p className="text-gray-500 text-center py-4">No transactions yet</p>
              ) : (
                <div className="space-y-2">
                  {recentTransactions.map((transaction: TransactionEntryType) => (
                    <div key={transaction.id} className="border rounded p-3 text-sm">
                      <div className="font-semibold">{transaction.entry_number}</div>
                      <div className="text-gray-600">{transaction.description}</div>
                      <div className="text-xs text-gray-500">
                        {transaction.entry_date.toLocaleDateString()} • ${transaction.total_amount.toFixed(2)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
