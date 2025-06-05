
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { NavigationMenu, NavigationMenuContent, NavigationMenuItem, NavigationMenuList, NavigationMenuTrigger } from '@/components/ui/navigation-menu';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { trpc } from '@/utils/trpc';
import { ContactsManager } from '@/components/ContactsManager';
import { LedgerManager } from '@/components/LedgerManager';
import { GroupManager } from '@/components/GroupManager';
import { FinancialYearManager } from '@/components/FinancialYearManager';
import { TransactionEntry } from '@/components/TransactionEntry';
import { TransactionCorrection } from '@/components/TransactionCorrection';
import { DateRangeTransactions } from '@/components/DateRangeTransactions';
import { Calculator } from '@/components/Calculator';
import { LedgerManagement } from '@/components/LedgerManagement';
import { DaybookManagement } from '@/components/DaybookManagement';
import { DaybookReport } from '@/components/DaybookReport';
import { LedgerReport } from '@/components/LedgerReport';
import { TrialBalanceReport } from '@/components/TrialBalanceReport';
import { ProfitLossReport } from '@/components/ProfitLossReport';
import { BalanceSheetReport } from '@/components/BalanceSheetReport';
import { ToolsManager } from '@/components/ToolsManager';
import type { User, LoginInput } from '../../server/src/schema';

type ActiveView = 
  | 'dashboard'
  | 'contacts'
  | 'ledger' 
  | 'group'
  | 'financial-year'
  | 'transaction-entry'
  | 'transaction-correction'
  | 'date-range-transactions'
  | 'calculator'
  | 'ledger-management'
  | 'daybook-management'
  | 'daybook-report'
  | 'ledger-report'
  | 'trial-balance'
  | 'profit-loss'
  | 'balance-sheet'
  | 'tools';

// Create a type for the logged-in user (without password_hash)
type LoggedInUser = Omit<User, 'password_hash'>;

function App() {
  const [user, setUser] = useState<LoggedInUser | null>(null);
  const [activeView, setActiveView] = useState<ActiveView>('dashboard');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');
  
  // Login form state
  const [loginData, setLoginData] = useState<LoginInput>({
    username: '',
    password: ''
  });

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    
    try {
      const response = await trpc.login.mutate(loginData);
      if (response.success && response.user) {
        setUser(response.user);
        setActiveView('dashboard');
      } else {
        setError(response.message || 'Login failed');
      }
    } catch (error) {
      setError('Login failed. Please check your credentials.');
      console.error('Login error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    setUser(null);
    setActiveView('dashboard');
    setLoginData({ username: '', password: '' });
  };

  // Login page
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <Card className="w-full max-w-md shadow-lg">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold text-indigo-900">📊 Accounts Manager</CardTitle>
            <CardDescription>Sign in to access your accounting dashboard</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  type="text"
                  value={loginData.username}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setLoginData((prev: LoginInput) => ({ ...prev, username: e.target.value }))
                  }
                  placeholder="Enter your username"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={loginData.password}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setLoginData((prev: LoginInput) => ({ ...prev, password: e.target.value }))
                  }
                  placeholder="Enter your password"
                  required
                />
              </div>
              {error && (
                <Alert className="border-red-200 bg-red-50">
                  <AlertDescription className="text-red-800">{error}</AlertDescription>
                </Alert>
              )}
              <Button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700" disabled={isLoading}>
                {isLoading ? 'Signing in...' : '🔐 Sign In'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Main dashboard with navigation
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-bold text-indigo-900">📊 Accounts Manager</h1>
              <div className="text-sm text-gray-500">
                Welcome, {user.username}
              </div>
            </div>
            <Button variant="outline" onClick={handleLogout} className="text-red-600 hover:text-red-700">
              🚪 Logout
            </Button>
          </div>
        </div>
      </header>

      {/* Navigation Menu */}
      <nav className="bg-white shadow-sm border-b">
        <div className="px-6 py-2">
          <NavigationMenu>
            <NavigationMenuList className="space-x-1">
              {/* Dashboard */}
              <NavigationMenuItem>
                <Button
                  variant={activeView === 'dashboard' ? 'default' : 'ghost'}
                  onClick={() => setActiveView('dashboard')}
                  className="h-10"
                >
                  🏠 Dashboard
                </Button>
              </NavigationMenuItem>

              {/* Masters */}
              <NavigationMenuItem>
                <NavigationMenuTrigger className="h-10 bg-blue-600 text-white hover:bg-blue-700">
                  📋 Masters
                </NavigationMenuTrigger>
                <NavigationMenuContent>
                  <div className="grid w-48 gap-1 p-2">
                    <Button
                      variant="ghost"
                      className="justify-start h-8"
                      onClick={() => setActiveView('contacts')}
                    >
                      👥 Contacts
                    </Button>
                    <Button
                      variant="ghost"
                      className="justify-start h-8"
                      onClick={() => setActiveView('ledger')}
                    >
                      📖 Ledger
                    </Button>
                    <Button
                      variant="ghost"
                      className="justify-start h-8"
                      onClick={() => setActiveView('group')}
                    >
                      📁 Group
                    </Button>
                    <Button
                      variant="ghost"
                      className="justify-start h-8"
                      onClick={() => setActiveView('financial-year')}
                    >
                      📅 Financial Year
                    </Button>
                  </div>
                </NavigationMenuContent>
              </NavigationMenuItem>

              {/* Transactions */}
              <NavigationMenuItem>
                <NavigationMenuTrigger className="h-10 bg-green-600 text-white hover:bg-green-700">
                  💰 Transactions
                </NavigationMenuTrigger>
                <NavigationMenuContent>
                  <div className="grid w-48 gap-1 p-2">
                    <Button
                      variant="ghost"
                      className="justify-start h-8"
                      onClick={() => setActiveView('transaction-entry')}
                    >
                      ➕ Entry
                    </Button>
                    <Button
                      variant="ghost"
                      className="justify-start h-8"
                      onClick={() => setActiveView('transaction-correction')}
                    >
                      ✏️ Correction
                    </Button>
                    <Button
                      variant="ghost"
                      className="justify-start h-8"
                      onClick={() => setActiveView('date-range-transactions')}
                    >
                      📅 Date to Date
                    </Button>
                    <Button
                      variant="ghost"
                      className="justify-start h-8"
                      onClick={() => setActiveView('calculator')}
                    >
                      🧮 Calculator
                    </Button>
                  </div>
                </NavigationMenuContent>
              </NavigationMenuItem>

              {/* Management */}
              <NavigationMenuItem>
                <NavigationMenuTrigger className="h-10 bg-purple-600 text-white hover:bg-purple-700">
                  🔧 Management
                </NavigationMenuTrigger>
                <NavigationMenuContent>
                  <div className="grid w-48 gap-1 p-2">
                    <Button
                      variant="ghost"
                      className="justify-start h-8"
                      onClick={() => setActiveView('ledger-management')}
                    >
                      📖 Ledger
                    </Button>
                    <Button
                      variant="ghost"
                      className="justify-start h-8"
                      onClick={() => setActiveView('daybook-management')}
                    >
                      📔 Daybook
                    </Button>
                  </div>
                </NavigationMenuContent>
              </NavigationMenuItem>

              {/* Reports */}
              <NavigationMenuItem>
                <NavigationMenuTrigger className="h-10 bg-orange-600 text-white hover:bg-orange-700">
                  📊 Reports
                </NavigationMenuTrigger>
                <NavigationMenuContent>
                  <div className="grid w-48 gap-1 p-2">
                    <Button
                      variant="ghost"
                      className="justify-start h-8"
                      onClick={() => setActiveView('daybook-report')}
                    >
                      📔 Daybook
                    </Button>
                    <Button
                      variant="ghost"
                      className="justify-start h-8"
                      onClick={() => setActiveView('ledger-report')}
                    >
                      📖 Ledger
                    </Button>
                    <Button
                      variant="ghost"
                      className="justify-start h-8"
                      onClick={() => setActiveView('trial-balance')}
                    >
                      ⚖️ Trial Balance
                    </Button>
                    <Button
                      variant="ghost"
                      className="justify-start h-8"
                      onClick={() => setActiveView('profit-loss')}
                    >
                      📈 P&L
                    </Button>
                    <Button
                      variant="ghost"
                      className="justify-start h-8"
                      onClick={() => setActiveView('balance-sheet')}
                    >
                      📋 Balance Sheet
                    </Button>
                  </div>
                </NavigationMenuContent>
              </NavigationMenuItem>

              {/* Tools */}
              <NavigationMenuItem>
                <NavigationMenuTrigger className="h-10 bg-red-600 text-white hover:bg-red-700">
                  🛠️ Tools
                </NavigationMenuTrigger>
                <NavigationMenuContent>
                  <div className="grid w-48 gap-1 p-2">
                    <Button
                      variant="ghost"
                      className="justify-start h-8"
                      onClick={() => setActiveView('tools')}
                    >
                      🔧 Manage Tools
                    </Button>
                  </div>
                </NavigationMenuContent>
              </NavigationMenuItem>
            </NavigationMenuList>
          </NavigationMenu>
        </div>
      </nav>

      {/* Main Content */}
      <main className="px-6 py-6">
        {activeView === 'dashboard' && (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">🏠 Welcome to Your Accounting Dashboard</h2>
              <p className="text-gray-600 mb-8">Manage your finances with our comprehensive accounting tools</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg text-blue-800">📋 Masters</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-blue-600 mb-3">Manage contacts, ledgers, groups, and financial years</p>
                  <Button size="sm" className="bg-blue-600 hover:bg-blue-700" onClick={() => setActiveView('contacts')}>
                    Get Started
                  </Button>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg text-green-800">💰 Transactions</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-green-600 mb-3">Record entries, corrections, and view transactions</p>
                  <Button size="sm" className="bg-green-600 hover:bg-green-700" onClick={() => setActiveView('transaction-entry')}>
                    New Entry
                  </Button>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg text-orange-800">📊 Reports</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-orange-600 mb-3">Generate daybook, ledger, and financial reports</p>
                  <Button size="sm" className="bg-orange-600 hover:bg-orange-700" onClick={() => setActiveView('daybook-report')}>
                    View Reports
                  </Button>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-200">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg text-red-800">🛠️ Tools</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-red-600 mb-3">Backup, clean database, and other utilities</p>
                  <Button size="sm" className="bg-red-600 hover:bg-red-700" onClick={() => setActiveView('tools')}>
                    Manage
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* Masters */}
        {activeView === 'contacts' && <ContactsManager />}
        {activeView === 'ledger' && <LedgerManager />}
        {activeView === 'group' && <GroupManager />}
        {activeView === 'financial-year' && <FinancialYearManager />}

        {/* Transactions */}
        {activeView === 'transaction-entry' && <TransactionEntry />}
        {activeView === 'transaction-correction' && <TransactionCorrection />}
        {activeView === 'date-range-transactions' && <DateRangeTransactions />}
        {activeView === 'calculator' && <Calculator />}

        {/* Management */}
        {activeView === 'ledger-management' && <LedgerManagement />}
        {activeView === 'daybook-management' && <DaybookManagement />}

        {/* Reports */}
        {activeView === 'daybook-report' && <DaybookReport />}
        {activeView === 'ledger-report' && <LedgerReport />}
        {activeView === 'trial-balance' && <TrialBalanceReport />}
        {activeView === 'profit-loss' && <ProfitLossReport />}
        {activeView === 'balance-sheet' && <BalanceSheetReport />}

        {/* Tools */}
        {activeView === 'tools' && <ToolsManager />}
      </main>
    </div>
  );
}

export default App;
