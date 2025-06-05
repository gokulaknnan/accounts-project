
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export function TrialBalanceReport() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">⚖️ Trial Balance Report</h2>
        <p className="text-gray-600">Generate trial balance reports</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">📊 Trial Balance Generator</CardTitle>
          <CardDescription>Generate trial balance as on a specific date</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-gray-500">Trial balance report generator will be implemented here.</p>
            <p className="text-sm text-gray-400 mt-2">
              This will generate trial balance showing all ledger balances as on a specific date.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
