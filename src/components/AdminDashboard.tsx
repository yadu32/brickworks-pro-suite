import { useState, useEffect } from 'react';
import { Shield, Users, Eye, EyeOff, RefreshCw, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import apiClient from '@/api/client';

interface AdminUser {
  id: string;
  email: string;
  owner_name: string | null;
  location: string | null;
  factory_name: string | null;
  phone_number: string | null;
  subscription_status: string;
  days_left: number | null;
  last_active_at: string | null;
  created_at: string;
}

const AdminDashboard = () => {
  const { toast } = useToast();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [pin, setPin] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const verifyPin = async () => {
    if (pin.length !== 4) {
      toast({ title: 'Error', description: 'Please enter a 4-digit PIN', variant: 'destructive' });
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await apiClient.post(`/admin/verify-pin?pin=${pin}`);
      if (response.data.valid) {
        setIsAuthenticated(true);
        loadUsers();
        toast({ title: 'Success', description: 'Admin access granted' });
      }
    } catch (err: any) {
      setError('Invalid PIN. Access denied.');
      toast({ title: 'Access Denied', description: 'Invalid admin PIN', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  const loadUsers = async () => {
    setIsLoading(true);
    try {
      const response = await apiClient.get(`/admin/users?pin=${pin}`);
      setUsers(response.data);
    } catch (err: any) {
      toast({ title: 'Error', description: 'Failed to load user data', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return 'Never';
    const date = new Date(dateStr);
    return date.toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'premium':
      case 'lifetime':
        return 'text-green-500 bg-green-500/10';
      case 'trial':
        return 'text-yellow-500 bg-yellow-500/10';
      case 'expired':
        return 'text-red-500 bg-red-500/10';
      default:
        return 'text-gray-500 bg-gray-500/10';
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      verifyPin();
    }
  };

  // PIN Entry Screen
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <Card className="w-full max-w-md card-dark">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
              <Shield className="h-8 w-8 text-primary" />
            </div>
            <CardTitle className="text-2xl font-bold text-foreground">Admin Dashboard</CardTitle>
            <p className="text-muted-foreground mt-2">Enter your admin PIN to access</p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                type={showPin ? 'text' : 'password'}
                placeholder="Enter 4-digit PIN"
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                onKeyPress={handleKeyPress}
                className="pl-10 pr-10 text-center text-2xl tracking-widest"
                maxLength={4}
              />
              <button
                type="button"
                onClick={() => setShowPin(!showPin)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showPin ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
            
            {error && (
              <p className="text-destructive text-sm text-center">{error}</p>
            )}
            
            <Button 
              onClick={verifyPin} 
              className="w-full" 
              disabled={isLoading || pin.length !== 4}
            >
              {isLoading ? 'Verifying...' : 'Access Dashboard'}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Admin Dashboard
  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
              <Shield className="h-8 w-8 text-primary" />
              Admin Dashboard
            </h1>
            <p className="text-muted-foreground mt-1">View all registered users and their activity</p>
          </div>
          <Button onClick={loadUsers} disabled={isLoading} variant="outline">
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="card-dark">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-sm">Total Users</p>
                  <p className="text-3xl font-bold text-foreground">{users.length}</p>
                </div>
                <Users className="h-10 w-10 text-primary" />
              </div>
            </CardContent>
          </Card>
          <Card className="card-dark">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-sm">Premium Users</p>
                  <p className="text-3xl font-bold text-green-500">
                    {users.filter(u => u.subscription_status === 'Premium' || u.subscription_status === 'Lifetime').length}
                  </p>
                </div>
                <div className="h-10 w-10 rounded-full bg-green-500/10 flex items-center justify-center">
                  <span className="text-green-500 text-lg">$</span>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="card-dark">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-sm">Trial Users</p>
                  <p className="text-3xl font-bold text-yellow-500">
                    {users.filter(u => u.subscription_status === 'Trial').length}
                  </p>
                </div>
                <div className="h-10 w-10 rounded-full bg-yellow-500/10 flex items-center justify-center">
                  <span className="text-yellow-500 text-lg">⏳</span>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="card-dark">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-sm">Free/Expired</p>
                  <p className="text-3xl font-bold text-red-500">
                    {users.filter(u => u.subscription_status === 'Free' || u.subscription_status === 'Expired').length}
                  </p>
                </div>
                <div className="h-10 w-10 rounded-full bg-red-500/10 flex items-center justify-center">
                  <span className="text-red-500 text-lg">!</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Users Table */}
        <Card className="card-dark">
          <CardHeader>
            <CardTitle className="text-foreground flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              Registered Users
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent border-border">
                    <TableHead className="text-secondary">Name & Email</TableHead>
                    <TableHead className="text-secondary">Location</TableHead>
                    <TableHead className="text-secondary">Factory Name</TableHead>
                    <TableHead className="text-secondary">Phone</TableHead>
                    <TableHead className="text-secondary">Subscription</TableHead>
                    <TableHead className="text-secondary">Days Left</TableHead>
                    <TableHead className="text-secondary">Last Active</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                        {isLoading ? 'Loading users...' : 'No users found'}
                      </TableCell>
                    </TableRow>
                  ) : (
                    users.map((user) => (
                      <TableRow key={user.id} className="border-border">
                        <TableCell>
                          <div>
                            <p className="font-medium text-foreground">{user.owner_name || 'N/A'}</p>
                            <p className="text-sm text-muted-foreground">{user.email}</p>
                          </div>
                        </TableCell>
                        <TableCell className="text-foreground">{user.location || 'N/A'}</TableCell>
                        <TableCell className="text-foreground">{user.factory_name || 'N/A'}</TableCell>
                        <TableCell className="text-foreground">{user.phone_number || 'N/A'}</TableCell>
                        <TableCell>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(user.subscription_status)}`}>
                            {user.subscription_status}
                          </span>
                        </TableCell>
                        <TableCell className="text-foreground">
                          {user.days_left !== null ? (
                            <span className={user.days_left <= 5 ? 'text-red-500 font-medium' : ''}>
                              {user.days_left} days
                            </span>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          {formatDate(user.last_active_at)}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminDashboard;
