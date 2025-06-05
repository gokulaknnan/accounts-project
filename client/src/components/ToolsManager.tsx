
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { trpc } from '@/utils/trpc';

export function ToolsManager() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleBackup = async () => {
    setIsLoading(true);
    setError('');
    setSuccess('');
    
    try {
      await trpc.backupDatabase.mutate();
      setSuccess('Database backup completed successfully!');
    } catch (error) {
      setError('Failed to backup database');
      console.error('Backup error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCleanEntire = async () => {
    setIsLoading(true);
    setError('');
    setSuccess('');
    
    try {
      await trpc.cleanEntireDatabase.mutate();
      setSuccess('Database cleaned successfully! All data has been removed.');
    } catch (error) {
      setError('Failed to clean database');
      console.error('Clean error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCleanCorrections = async () => {
    setIsLoading(true);
    setError('');
    setSuccess('');
    
    try {
      await trpc.cleanCorrections.mutate();
      setSuccess('Correction entries cleaned successfully!');
    } catch (error) {
      setError('Failed to clean corrections');
      console.error('Clean corrections error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleExit = () => {
    if (window.confirm('Are you sure you want to exit the application?')) {
      window.close();
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">🛠️ Tools & Utilities</h2>
        <p className="text-gray-600">Manage your database and application settings</p>
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Backup Tool */}
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardHeader>
            <CardTitle className="text-lg text-blue-800">💾 Database Backup</CardTitle>
            <CardDescription>Create a backup of your accounting data</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-blue-600 mb-4">
              Regular backups ensure your financial data is safe. This will create a complete backup 
              of all your transactions, ledgers, and settings.
            </p>
            <Button 
              onClick={handleBackup} 
              disabled={isLoading}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isLoading ? 'Creating Backup...' : '💾 Create Backup'}
            </Button>
          </CardContent>
        </Card>

        {/* Clean Corrections */}
        <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200">
          <CardHeader>
            <CardTitle className="text-lg text-yellow-800">🧹 Clean Corrections</CardTitle>
            <CardDescription>Remove correction transaction entries</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-yellow-600 mb-4">
              This will remove all correction entries from your database, keeping only the original transactions.
            </p>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button 
                  variant="outline" 
                  className="border-yellow-600 text-yellow-700 hover:bg-yellow-50"
                  disabled={isLoading}
                >
                  🧹 Clean Corrections
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Clean Correction Entries</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will permanently remove all correction transaction entries. 
                    Original transactions will remain intact. This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleCleanCorrections}
                    className="bg-yellow-600 hover:bg-yellow-700"
                  >
                    Clean Corrections
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </CardContent>
        </Card>

        {/* Clean Entire Database */}
        <Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-200">
          <CardHeader>
            <CardTitle className="text-lg text-red-800">⚠️ Clean Entire Database</CardTitle>
            <CardDescription>Remove all data from the database</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-red-600 mb-4">
              <strong>WARNING:</strong> This will permanently delete ALL data including transactions, 
              ledgers, groups, contacts, and financial years. Use with extreme caution!
            </p>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button 
                  variant="outline" 
                  className="border-red-600 text-red-700 hover:bg-red-50"
                  disabled={isLoading}
                >
                  ⚠️ Clean Entire Database
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>⚠️ Dangerous Operation</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will permanently delete ALL data in your accounting system:
                    • All transactions and entries
                    • All ledgers and groups
                    • All contacts and financial years
                    • All settings and configurations
                    
                    This action is IRREVERSIBLE. Make sure you have a recent backup before proceeding.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleCleanEntire}
                    className="bg-red-600 hover:bg-red-700"
                  >
                    Delete All Data
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </CardContent>
        </Card>

        {/* Exit Application */}
        <Card className="bg-gradient-to-br from-gray-50 to-gray-100 border-gray-200">
          <CardHeader>
            <CardTitle className="text-lg text-gray-800">🚪 Exit Application</CardTitle>
            <CardDescription>Close the accounting application</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 mb-4">
              Exit the application safely. Make sure all your work is saved before closing.
            </p>
            <Button 
              onClick={handleExit}
              variant="outline" 
              className="border-gray-600 text-gray-700 hover:bg-gray-50"
            >
              🚪 Exit Application
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
