// PaymentsPlans.jsx - Update to properly display trainer names and IDs
import React, { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card"
import { Button } from "../ui/button"
import { Input } from "../ui/input"
import { Badge } from "../ui/badge"
import { 
  Search, 
  MoreHorizontal, 
  CreditCard, 
  Crown,
  DollarSign, 
  Users, 
  TrendingUp, 
  AlertCircle, 
  CheckCircle, 
  Eye,
  MapPin,
  Loader2,
  RefreshCw,
  User,
  XCircle,
  Calendar,
  Filter
} from "lucide-react"
import { Avatar, AvatarFallback } from "../ui/avatar"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "../ui/dropdown-menu"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select"

export function PaymentsPlans() {
  const [searchTerm, setSearchTerm] = useState("")
  const [allSubscriptions, setAllSubscriptions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [refreshing, setRefreshing] = useState(false)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [filterStatus, setFilterStatus] = useState("all")
  const [filterType, setFilterType] = useState("all")

  // Check authentication on component mount
  useEffect(() => {
    // Try multiple possible token keys
    const token = localStorage.getItem('token') || 
                  localStorage.getItem('authToken') || 
                  localStorage.getItem('accessToken') || 
                  sessionStorage.getItem('token');
    
    setIsAuthenticated(!!token);
    
    if (!token) {
      setError('You must be logged in to view this page.');
      setLoading(false);
      return;
    }
    
    fetchAllSubscriptions();
  }, [])

  // Fetch all subscription data
  const fetchAllSubscriptions = async () => {
    setLoading(true)
    setError(null)
    
    try {
      // Try multiple possible token keys
      const token = localStorage.getItem('token') || 
                    localStorage.getItem('authToken') || 
                    localStorage.getItem('accessToken') || 
                    sessionStorage.getItem('token');
      
      // Use the admin endpoint to get all subscriptions
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api'}/subscriptions/admin/all-subscriptions`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fetch subscriptions');
      }
      
      const data = await response.json();
      
      if (data.success) {
        setAllSubscriptions(data.data || []);
      }
    } catch (error) {
      console.error("Error fetching subscriptions:", error)
      setError(error.message || "Failed to load data. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case "active":
        return "bg-green-500/10 text-green-500 border-green-500/20"
      case "pending":
        return "bg-yellow-500/10 text-yellow-500 border-yellow-500/20"
      case "cancelled":
      case "expired":
        return "bg-red-500/10 text-red-500 border-red-500/20"
      case "in_trial":
        return "bg-blue-500/10 text-blue-500 border-blue-500/20"
      default:
        return "bg-gray-500/10 text-gray-500 border-gray-500/20"
    }
  }

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    })
  }

  const refreshData = async () => {
    setRefreshing(true)
    try {
      await fetchAllSubscriptions()
    } catch (error) {
      console.error("Error refreshing data:", error)
      setError(error.message || "Failed to refresh data. Please try again.")
    } finally {
      setRefreshing(false)
    }
  }

  // Handle subscription cancellation
  const handleCancelSubscription = async (subscriptionId) => {
    if (!confirm('Are you sure you want to cancel this subscription?')) {
      return;
    }
    
    try {
      // Try multiple possible token keys
      const token = localStorage.getItem('token') || 
                    localStorage.getItem('authToken') || 
                    localStorage.getItem('accessToken') || 
                    sessionStorage.getItem('token');
      
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api'}/subscriptions/${subscriptionId}/cancel`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to cancel subscription');
      }
      
      // Refresh data after cancellation
      await fetchAllSubscriptions();
      alert('Subscription cancelled successfully');
    } catch (error) {
      console.error("Error cancelling subscription:", error);
      alert(error.message || "Failed to cancel subscription. Please try again.");
    }
  };

  // Filter subscriptions based on search term and filters
  const filteredSubscriptions = allSubscriptions.filter(sub => {
    // Apply search filter
    const matchesSearch = 
      sub.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sub.userEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (sub.multiGymTier?.name && sub.multiGymTier.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (sub.gymPlan?.name && sub.gymPlan.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (sub.trainerPlan?.name && sub.trainerPlan.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (sub.gymPlan?.gym?.name && sub.gymPlan.gym.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (sub.trainerPlan?.trainer?.user?.memberProfile?.name && 
       sub.trainerPlan.trainer.user.memberProfile.name.toLowerCase().includes(searchTerm.toLowerCase()));
    
    // Apply status filter
    const matchesStatus = filterStatus === "all" || sub.status === filterStatus;
    
    // Apply type filter
    let matchesType = filterType === "all";
    if (filterType === "multi-gym" && sub.multiGymTier) matchesType = true;
    if (filterType === "gym" && sub.gymPlan) matchesType = true;
    if (filterType === "trainer" && sub.trainerPlan) matchesType = true;
    
    return matchesSearch && matchesStatus && matchesType;
  });

  // Group subscriptions by type
  const multiGymSubscriptions = filteredSubscriptions.filter(sub => sub.multiGymTier);
  const gymSubscriptions = filteredSubscriptions.filter(sub => sub.gymPlan);
  const trainerSubscriptions = filteredSubscriptions.filter(sub => sub.trainerPlan);

  // Calculate statistics
  const totalRevenue = filteredSubscriptions
    .filter(s => s.status === 'active')
    .reduce((sum, sub) => {
      let price = 0;
      
      // Handle multi-gym tier price
      if (sub.multiGymTier) {
        price = sub.multiGymTier.price || 0;
      }
      // Handle gym plan price
      else if (sub.gymPlan) {
        price = sub.gymPlan.price || 0;
      }
      // Handle trainer plan price
      else if (sub.trainerPlan) {
        price = sub.trainerPlan.price || 0;
      }
      
      return sum + price;
    }, 0);

  const activeSubscriptions = filteredSubscriptions.filter(s => s.status === 'active').length;
  const cancelledSubscriptions = filteredSubscriptions.filter(s => s.status === 'cancelled').length;
  const pendingSubscriptions = filteredSubscriptions.filter(s => s.status === 'pending').length;

  if (!isAuthenticated) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <AlertCircle className="h-8 w-8 text-red-500" />
        <p className="text-red-500">You must be logged in to view this page.</p>
        <Button onClick={() => window.location.href = '/login'}>
          Login
        </Button>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <AlertCircle className="h-8 w-8 text-red-500" />
        <p className="text-red-500">{error}</p>
        <Button onClick={refreshData}>Try Again</Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Subscription Management</h1>
          <p className="text-muted-foreground">View and manage all user subscriptions</p>
        </div>
        <Button 
          className="bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white"
          onClick={refreshData}
          disabled={refreshing}
        >
          {refreshing ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4 mr-2" />
          )}
          Refresh Data
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="bg-card border-border">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Subscriptions</p>
                <p className="text-2xl font-bold text-foreground">{filteredSubscriptions.length}</p>
              </div>
              <CreditCard className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active</p>
                <p className="text-2xl font-bold text-foreground">{activeSubscriptions}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Cancelled</p>
                <p className="text-2xl font-bold text-foreground">{cancelledSubscriptions}</p>
              </div>
              <XCircle className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Revenue</p>
                <p className="text-2xl font-bold text-foreground">${totalRevenue.toFixed(2)}</p>
              </div>
              <DollarSign className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by user name, email, or plan..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-background border-border text-foreground placeholder:text-muted-foreground"
          />
        </div>
        <div className="flex gap-2">
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="in_trial">In Trial</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="multi-gym">Multi-Gym</SelectItem>
              <SelectItem value="gym">Gym</SelectItem>
              <SelectItem value="trainer">Trainer</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Multi-Gym Subscriptions */}
      {multiGymSubscriptions.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-foreground flex items-center">
            <Crown className="h-5 w-5 mr-2 text-purple-500" />
            Multi-Gym Subscriptions ({multiGymSubscriptions.length})
          </h2>
          <div className="rounded-md border">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="text-left p-4 font-medium">User</th>
                    <th className="text-left p-4 font-medium">Plan</th>
                    <th className="text-left p-4 font-medium">Price</th>
                    <th className="text-left p-4 font-medium">Status</th>
                    <th className="text-left p-4 font-medium">Start Date</th>
                    <th className="text-left p-4 font-medium">End Date</th>
                    <th className="text-left p-4 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {multiGymSubscriptions.map((subscription, index) => (
                    <tr key={index} className="border-b hover:bg-muted/30">
                      <td className="p-4">
                        <div className="flex items-center space-x-3">
                          <Avatar className="h-8 w-8">
                            <AvatarFallback className="bg-gradient-to-br from-purple-500 to-pink-500 text-white">
                              {subscription.userAvatar}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{subscription.userName}</p>
                            <p className="text-sm text-muted-foreground">{subscription.userEmail}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <div>
                          <p className="font-medium">{subscription.multiGymTier?.name || 'Unknown'}</p>
                          <p className="text-sm text-muted-foreground">{subscription.multiGymTier?.description || ''}</p>
                        </div>
                      </td>
                      <td className="p-4">
                        <p className="font-medium">${subscription.multiGymTier?.price || 0}/month</p>
                      </td>
                      <td className="p-4">
                        <Badge className={getStatusColor(subscription.status)}>
                          {subscription.status}
                        </Badge>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                          {formatDate(subscription.startDate)}
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                          {formatDate(subscription.endDate)}
                        </div>
                      </td>
                      <td className="p-4">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>
                              <Eye className="h-4 w-4 mr-2" />
                              View Details
                            </DropdownMenuItem>
                            {subscription.status === 'active' && (
                              <DropdownMenuItem 
                                className="text-red-500"
                                onClick={() => handleCancelSubscription(subscription.id)}
                              >
                                <XCircle className="h-4 w-4 mr-2" />
                                Cancel Subscription
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Gym Subscriptions */}
      {gymSubscriptions.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-foreground flex items-center">
            <MapPin className="h-5 w-5 mr-2 text-blue-500" />
            Gym Subscriptions ({gymSubscriptions.length})
          </h2>
          <div className="rounded-md border">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="text-left p-4 font-medium">User</th>
                    <th className="text-left p-4 font-medium">Plan</th>
                    <th className="text-left p-4 font-medium">Gym</th>
                    <th className="text-left p-4 font-medium">Price</th>
                    <th className="text-left p-4 font-medium">Status</th>
                    <th className="text-left p-4 font-medium">Start Date</th>
                    <th className="text-left p-4 font-medium">End Date</th>
                    <th className="text-left p-4 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {gymSubscriptions.map((subscription, index) => (
                    <tr key={index} className="border-b hover:bg-muted/30">
                      <td className="p-4">
                        <div className="flex items-center space-x-3">
                          <Avatar className="h-8 w-8">
                            <AvatarFallback className="bg-gradient-to-br from-blue-500 to-cyan-500 text-white">
                              {subscription.userAvatar}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{subscription.userName}</p>
                            <p className="text-sm text-muted-foreground">{subscription.userEmail}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <div>
                          <p className="font-medium">{subscription.gymPlan?.name || 'Unknown'}</p>
                        </div>
                      </td>
                      <td className="p-4">
                        <div>
                          <p className="font-medium">{subscription.gymPlan?.gym?.name || 'Unknown'}</p>
                          <p className="text-xs text-muted-foreground">ID: {subscription.gymPlan?.gymId || 'N/A'}</p>
                        </div>
                      </td>
                      <td className="p-4">
                        <p className="font-medium">${subscription.gymPlan?.price || 0}/month</p>
                      </td>
                      <td className="p-4">
                        <Badge className={getStatusColor(subscription.status)}>
                          {subscription.status}
                        </Badge>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                          {formatDate(subscription.startDate)}
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                          {formatDate(subscription.endDate)}
                        </div>
                      </td>
                      <td className="p-4">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>
                              <Eye className="h-4 w-4 mr-2" />
                              View Details
                            </DropdownMenuItem>
                            {subscription.status === 'active' && (
                              <DropdownMenuItem 
                                className="text-red-500"
                                onClick={() => handleCancelSubscription(subscription.id)}
                              >
                                <XCircle className="h-4 w-4 mr-2" />
                                Cancel Subscription
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Trainer Subscriptions */}
      {trainerSubscriptions.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-foreground flex items-center">
            <User className="h-5 w-5 mr-2 text-green-500" />
            Trainer Subscriptions ({trainerSubscriptions.length})
          </h2>
          <div className="rounded-md border">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="text-left p-4 font-medium">User</th>
                    <th className="text-left p-4 font-medium">Plan</th>
                    <th className="text-left p-4 font-medium">Trainer</th>
                    <th className="text-left p-4 font-medium">Price</th>
                    <th className="text-left p-4 font-medium">Status</th>
                    <th className="text-left p-4 font-medium">Start Date</th>
                    <th className="text-left p-4 font-medium">End Date</th>
                    <th className="text-left p-4 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {trainerSubscriptions.map((subscription, index) => (
                    <tr key={index} className="border-b hover:bg-muted/30">
                      <td className="p-4">
                        <div className="flex items-center space-x-3">
                          <Avatar className="h-8 w-8">
                            <AvatarFallback className="bg-gradient-to-br from-green-500 to-teal-500 text-white">
                              {subscription.userAvatar}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{subscription.userName}</p>
                            <p className="text-sm text-muted-foreground">{subscription.userEmail}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <div>
                          <p className="font-medium">{subscription.trainerPlan?.name || 'Unknown'}</p>
                        </div>
                      </td>
                      <td className="p-4">
                        <div>
                          <p className="font-medium">
                            {subscription.trainerPlan?.trainer?.user?.memberProfile?.name || 
                             subscription.trainerPlan?.trainer?.user?.name || 
                             subscription.trainerPlan?.trainer?.email?.split('@')[0] || 
                             'Unknown'}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            ID: {subscription.trainerPlan?.trainer?.id || subscription.trainerPlan?.trainerId || 'N/A'}
                          </p>
                        </div>
                      </td>
                      <td className="p-4">
                        <p className="font-medium">${subscription.trainerPlan?.price || 0}/month</p>
                      </td>
                      <td className="p-4">
                        <Badge className={getStatusColor(subscription.status)}>
                          {subscription.status}
                        </Badge>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                          {formatDate(subscription.startDate)}
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                          {formatDate(subscription.endDate)}
                        </div>
                      </td>
                      <td className="p-4">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>
                              <Eye className="h-4 w-4 mr-2" />
                              View Details
                            </DropdownMenuItem>
                            {subscription.status === 'active' && (
                              <DropdownMenuItem 
                                className="text-red-500"
                                onClick={() => handleCancelSubscription(subscription.id)}
                              >
                                <XCircle className="h-4 w-4 mr-2" />
                                Cancel Subscription
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* No subscriptions found */}
      {filteredSubscriptions.length === 0 && (
        <Card className="bg-card border-border">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <CreditCard className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No subscriptions found</h3>
            <p className="text-muted-foreground text-center max-w-md">
              {searchTerm || filterStatus !== "all" || filterType !== "all"
                ? "Try adjusting your search or filters to see more results."
                : "There are no subscriptions in the system yet."}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}