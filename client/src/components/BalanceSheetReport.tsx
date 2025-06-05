
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export function BalanceSheetReport() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">📋 Balance Sheet Report</h2>
        <p className="text-gray-600">Generate balance sheet statements</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">📊 Balance Sheet Generator</CardTitle>
          <CardDescription>Generate balance sheet as on a specific date</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-gray-500">Balance sheet report generator will be implemented here.</p>
            <p className="text-sm text-gray-400 mt-2">
              This will generate balance sheets showing assets, liabilities, and equity as on a specific date.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
