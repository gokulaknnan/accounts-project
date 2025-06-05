
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { trpc } from '@/utils/trpc';
import type { DaybookReportInput } from '../../../server/src/schema';

interface ReportData {
  entries: Array<{
    id: number;
    entry_number: string;
    entry_date: Date;
    description: string;
    total_amount: number;
  }>;
  summary: {
    total_entries: number;
    total_amount: number;
  };
}

export function DaybookReport() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [reportData, setReportData] = useState<ReportData | null>(null);

  const [formData, setFormData] = useState<DaybookReportInput>({
    start_date: new Date(),
    end_date: new Date(),
    period: 'daily',
    day_summary: false
  });

  const handleGenerateReport = async () => {
    setIsLoading(true);
    setError('');
    
    try {
      const result = await trpc.getDaybookReport.query(formData);
      // Handle the result properly - we don't know the actual structure yet
      // so we'll set it as unknown first, then cast or transform as needed
      setReportData(result as unknown as ReportData);
    } catch (error) {
      setError('Failed to generate daybook report');
      console.error('Report error:', error);
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
        <h2 className="text-2xl font-bold text-gray-900">📔 Daybook Report</h2>
        <p className="text-gray-600">Generate detailed daybook reports for any date range</p>
      </div>

      {/* Report Parameters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">📊 Report Parameters</CardTitle>
          <CardDescription>Configure your daybook report settings</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="start-date">Start Date</Label>
              <Input
                id="start-date"
                type="date"
                value={formatDateForInput(formData.start_date)}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setFormData((prev: DaybookReportInput) => ({ 
                    ...prev, 
                    start_date: new Date(e.target.value) 
                  }))
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="end-date">End Date</Label>
              <Input
                id="end-date"
                type="date"
                value={formatDateForInput(formData.end_date)}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setFormData((prev: DaybookReportInput) => ({ 
                    ...prev, 
                    end_date: new Date(e.target.value) 
                  }))
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="period">Period</Label>
              <Select 
                value={formData.period || 'daily'} 
                onValueChange={(value: 'daily' | 'weekly' | 'monthly') =>
                  setFormData((prev: DaybookReportInput) => ({ ...prev, period: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select period" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="day-summary">Day Summary</Label>
              <div className="flex items-center space-x-2">
                <Switch
                  id="day-summary"
                  checked={formData.day_summary}
                  onCheckedChange={(checked: boolean) =>
                    setFormData((prev: DaybookReportInput) => ({ ...prev, day_summary: checked }))
                  }
                />
                <Label htmlFor="day-summary" className="text-sm">Enable</Label>
              </div>
            </div>
          </div>

          <div className="mt-4">
            <Button onClick={handleGenerateReport} disabled={isLoading} className="bg-orange-600 hover:bg-orange-700">
              {isLoading ? 'Generating...' : '📊 Generate Report'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Error Alert */}
      {error && (
        <Alert className="border-red-200 bg-red-50">
          <AlertDescription className="text-red-800">{error}</AlertDescription>
        </Alert>
      )}

      {/* Report Results */}
      {reportData && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">📋 Daybook Report Results</CardTitle>
            <CardDescription>
              Report for {formData.start_date.toLocaleDateString()} to {formData.end_date.toLocaleDateString()}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <p className="text-gray-500">Report data will be displayed here once the backend returns the actual structure.</p>
              <p className="text-sm text-gray-400 mt-2">
                The current implementation shows a placeholder. The actual report will contain transaction details, 
                summaries, and totals based on the selected parameters.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
