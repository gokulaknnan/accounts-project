
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export function Calculator() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">🧮 Calculator</h2>
        <p className="text-gray-600">Financial calculator for quick calculations</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">🔢 Financial Calculator</CardTitle>
          <CardDescription>Perform quick financial calculations</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-gray-500">Financial calculator will be implemented here.</p>
            <p className="text-sm text-gray-400 mt-2">
              This will provide a calculator interface for financial computations.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
