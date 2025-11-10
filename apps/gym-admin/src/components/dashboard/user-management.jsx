import React, { useEffect, useState, useCallback } from "react"
import { 
  Search, 
  Plus, 
  MoreHorizontal, 
  Edit, 
  Trash2, 
  UserCheck, 
  Dumbbell, 
  Building2,
  Calendar, 
  Phone, 
  Mail, 
  MapPin, 
  Crown, 
  Target, 
  TrendingUp,
  Star,
  Users,
  Clock,
  Award,
  CheckCircle,
  AlertCircle,
  Clock as ClockIcon,
  Eye,
  Shield,
  CreditCard,
  UserX,
  UserPlus,
  Ban,
  Settings,
  X,
  ChevronLeft,
  ChevronRight,
  Filter,
  Hash
} from "lucide-react"
import apiClient from "../../api/apiClient"

// Custom UI Components (same as before)
const Badge = ({ children, className = "", variant = "default" }) => {
  const baseClasses = "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
  const variantClasses = {
    default: "bg-gray-100 text-gray-800",
    secondary: "bg-gray-200 text-gray-700",
    outline: "border border-gray-300 bg-transparent text-gray-700"
  }
  
  return (
    <span className={`${baseClasses} ${variantClasses[variant]} ${className}`}>
      {children}
    </span>
  )
}

const Button = ({ children, className = "", variant = "default", size = "default", onClick, disabled = false, ...props }) => {
  const baseClasses = "inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background"
  
  const variantClasses = {
    default: "bg-blue-600 text-white hover:bg-blue-700",
    destructive: "bg-red-600 text-white hover:bg-red-700",
    outline: "border border-gray-300 bg-transparent hover:bg-gray-100",
    ghost: "hover:bg-gray-100",
    secondary: "bg-gray-100 text-gray-900 hover:bg-gray-200"
  }
  
  const sizeClasses = {
    default: "h-10 py-2 px-4",
    sm: "h-9 px-3",
    lg: "h-11 px-8",
    icon: "h-10 w-10"
  }
  
  return (
    <button
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
      onClick={onClick}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  )
}

const Input = ({ className = "", ...props }) => {
  return (
    <input
      className={`flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
      {...props}
    />
  )
}

const Card = ({ children, className = "" }) => (
  <div className={`rounded-lg border border-gray-200 bg-white text-gray-950 shadow-sm ${className}`}>
    {children}
  </div>
)

const CardHeader = ({ children, className = "" }) => (
  <div className={`flex flex-col space-y-1.5 p-6 ${className}`}>
    {children}
  </div>
)

const CardTitle = ({ children, className = "" }) => (
  <h3 className={`text-2xl font-semibold leading-none tracking-tight ${className}`}>
    {children}
  </h3>
)

const CardDescription = ({ children, className = "" }) => (
  <p className={`text-sm text-gray-500 ${className}`}>
    {children}
  </p>
)

const CardContent = ({ children, className = "" }) => (
  <div className={`p-6 pt-0 ${className}`}>
    {children}
  </div>
)

const Avatar = ({ children, className = "" }) => (
  <div className={`relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full ${className}`}>
    {children}
  </div>
)

const AvatarFallback = ({ children, className = "" }) => (
  <div className={`flex h-full w-full items-center justify-center rounded-full bg-gray-100 ${className}`}>
    {children}
  </div>
)

const Table = ({ children, className = "" }) => (
  <div className={`w-full caption-bottom text-sm ${className}`}>
    <table>{children}</table>
  </div>
)

const TableHeader = ({ children }) => (
  <thead className="[&_tr]:border-b">{children}</thead>
)

const TableBody = ({ children }) => (
  <tbody className="[&_tr:last-child]:border-0">{children}</tbody>
)

const TableRow = ({ children }) => (
  <tr className="border-b transition-colors hover:bg-gray-50/50 data-[state=selected]:bg-gray-50">
    {children}
  </tr>
)

const TableHead = ({ children }) => (
  <th className="h-12 px-4 text-left align-middle font-medium text-gray-500 [&:has([role=checkbox])]:pr-0">
    {children}
  </th>
)

const TableCell = ({ children }) => (
  <td className="p-4 align-middle [&:has([role=checkbox])]:pr-0">
    {children}
  </td>
)

const Select = ({ children, className = "", value, onChange, ...props }) => (
  <select
    className={`flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
    value={value}
    onChange={onChange}
    {...props}
  >
    {children}
  </select>
)

const Skeleton = ({ className = "" }) => (
  <div className={`animate-pulse rounded-md bg-gray-200 ${className}`} />
)

export function UserManagement() {
  // State for users and pagination
  const [users, setUsers] = useState([])
  const [userStats, setUserStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  
  // Pagination state
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    totalPages: 0,
    total: 0,
    hasNext: false,
    hasPrev: false
  })
  
  // Filter and search state
  const [searchTerm, setSearchTerm] = useState("")
  const [filterRole, setFilterRole] = useState("all")
  const [filterStatus, setFilterStatus] = useState("all")
  
  // Modal states
  const [selectedUser, setSelectedUser] = useState(null)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showStatusModal, setShowStatusModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [newStatus, setNewStatus] = useState("")
  const [editForm, setEditForm] = useState({})
  
  // Function to check if response is HTML (ngrok warning page)
  const isHtmlResponse = (response) => {
    return typeof response.data === 'string' && response.data.includes('<!DOCTYPE html>');
  }
  
  // Fetch users with pagination and filters
  const fetchUsers = useCallback(async (page = 1, reset = false) => {
    setLoading(true)
    setError(null)
    
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: pagination.limit.toString()
      })
      
      if (searchTerm) params.append('search', searchTerm)
      if (filterRole !== 'all') params.append('role', filterRole)
      if (filterStatus !== 'all') params.append('status', filterStatus)
      
      console.log('Fetching users with params:', params.toString());
      console.log('API URL:', apiClient.defaults.baseURL);
      
      const response = await apiClient.get(`/admin/users?${params}`)
      console.log('API response:', response);
      
      // Check if response is HTML (ngrok warning page)
      if (isHtmlResponse(response)) {
        console.error('Received HTML response instead of JSON. This might be an ngrok warning page.');
        setError('API connection issue. Please try refreshing the page or check your network connection.');
        return;
      }
      
      // Check if response has the expected structure
      if (!response.data || !response.data.data) {
        console.error('Invalid response structure:', response);
        setError('Invalid response from server');
        return;
      }
      
      const { users: fetchedUsers, pagination: fetchedPagination } = response.data.data;
      
      if (reset) {
        setUsers(fetchedUsers || []);
      } else {
        setUsers(prev => [...prev, ...(fetchedUsers || [])]);
      }
      
      setPagination(fetchedPagination || {
        page: 1,
        limit: 20,
        totalPages: 0,
        total: 0,
        hasNext: false,
        hasPrev: false
      });
    } catch (err) {
      console.error('Error fetching users:', err)
      
      // Handle different types of errors
      if (err.code === 'ERR_NETWORK' || err.message === 'Network Error') {
        setError('Unable to connect to the server. Please check if the backend server is running and accessible.');
      } else if (err.response && isHtmlResponse(err.response)) {
        setError('API connection issue. Please try refreshing the page or check your network connection.');
      } else {
        setError(err.response?.data?.message || 'Failed to load users. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }, [searchTerm, filterRole, filterStatus, pagination.limit])
  
  // Fetch user statistics
  const fetchUserStats = async () => {
    try {
      const response = await apiClient.get('/admin/users/stats')
      console.log('User stats response:', response);
      
      // Check if response is HTML (ngrok warning page)
      if (isHtmlResponse(response)) {
        console.error('Received HTML response instead of JSON for user stats. This might be an ngrok warning page.');
        return;
      }
      
      // Check if response has the expected structure
      if (!response.data || !response.data.data) {
        console.error('Invalid stats response structure:', response);
        return;
      }
      
      setUserStats(response.data.data)
    } catch (err) {
      console.error('Error fetching user stats:', err)
      
      // Handle different types of errors
      if (err.code === 'ERR_NETWORK' || err.message === 'Network Error') {
        console.error('Network error when fetching user stats');
      }
    }
  }
  
  // Initial data fetch
  useEffect(() => {
    fetchUsers(1, true)
    fetchUserStats()
  }, [searchTerm, filterRole, filterStatus])
  
  // Handle pagination
  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      fetchUsers(newPage, true)
    }
  }
  
  // Handle search with debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchTerm !== undefined) {
        fetchUsers(1, true)
      }
    }, 500)
    
    return () => clearTimeout(timer)
  }, [searchTerm])
  
  // Handle filter changes
  useEffect(() => {
    fetchUsers(1, true)
  }, [filterRole, filterStatus])
  
  // Get role color
  const getRoleColor = (role) => {
    switch (role) {
      case "MEMBER":
        return "bg-blue-100 text-blue-800"
      case "TRAINER":
        return "bg-green-100 text-green-800"
      case "GYM_OWNER":
        return "bg-purple-100 text-purple-800"
      case "ADMIN":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }
  
  // Get status color
  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case "active":
        return "bg-green-100 text-green-800"
      case "inactive":
        return "bg-red-100 text-red-800"
      case "suspended":
        return "bg-orange-100 text-orange-800"
      case "pending":
        return "bg-yellow-100 text-yellow-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }
  
  // Get tier color
  const getTierColor = (tier) => {
    switch (tier?.toLowerCase()) {
      case "platinum":
        return "bg-purple-100 text-purple-800"
      case "gold":
        return "bg-yellow-100 text-yellow-800"
      case "silver":
        return "bg-gray-100 text-gray-800"
      case "premium":
        return "bg-indigo-100 text-indigo-800"
      default:
        return "bg-blue-100 text-blue-800"
    }
  }
  
  // Handle edit user
  const handleEditUser = (user) => {
    setSelectedUser(user)
    setEditForm({
      name: user.name,
      email: user.email,
      phone: user.phone,
      status: user.status,
      tier: user.tier
    })
    setShowEditModal(true)
  }
  
  // Handle status change
  const handleStatusChange = (user) => {
    setSelectedUser(user)
    setNewStatus(user.status)
    setShowStatusModal(true)
  }
  
  // Handle delete user
  const handleDeleteUser = (user) => {
    setSelectedUser(user)
    setShowDeleteModal(true)
  }
  
  // Save user changes
  const saveUserChanges = async () => {
    try {
      const response = await apiClient.put(`/admin/users/${selectedUser.id}`, editForm)
      
      // Update local state
      setUsers(users.map(u => u.id === selectedUser.id ? response.data.data : u))
      
      setShowEditModal(false)
      alert('User updated successfully!')
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to update user. Please try again.')
    }
  }
  
  // Update user status
  const updateUserStatusHandler = async () => {
    try {
      const response = await apiClient.patch(`/admin/users/${selectedUser.id}/status`, { status: newStatus })
      
      // Update local state
      setUsers(users.map(u => u.id === selectedUser.id ? response.data.data : u))
      
      setShowStatusModal(false)
      alert('User status updated successfully!')
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to update user status. Please try again.')
    }
  }
  
  // Delete user
  const deleteUserHandler = async () => {
    try {
      await apiClient.delete(`/admin/users/${selectedUser.id}`)
      
      // Update local state
      setUsers(users.filter(u => u.id !== selectedUser.id))
      
      setShowDeleteModal(false)
      alert('User deleted successfully!')
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to delete user. Please try again.')
    }
  }
  
  // Reset filters
  const resetFilters = () => {
    setSearchTerm("")
    setFilterRole("all")
    setFilterStatus("all")
  }
  
  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
          <p className="text-gray-500">Manage all platform users and their accounts</p>
        </div>
        <Button onClick={() => fetchUsers(1, true)} className="bg-blue-600 text-white hover:bg-blue-700">
          <Plus className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Stats Cards */}
      {userStats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">Total Users</p>
                  <p className="text-2xl font-bold text-gray-900">{userStats.total}</p>
                </div>
                <Users className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">Active Users</p>
                  <p className="text-2xl font-bold text-gray-900">{userStats.active}</p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">New This Month</p>
                  <p className="text-2xl font-bold text-gray-900">{userStats.newThisMonth}</p>
                </div>
                <TrendingUp className="h-8 w-8 text-orange-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">With Subscriptions</p>
                  <p className="text-2xl font-bold text-gray-900">{userStats.withActiveSubscriptions}</p>
                </div>
                <CreditCard className="h-8 w-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
              <Input
                placeholder="Search users by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={filterRole} onChange={(e) => setFilterRole(e.target.value)}>
              <option value="all">All Roles</option>
              <option value="MEMBER">Members</option>
              <option value="TRAINER">Trainers</option>
              <option value="GYM_OWNER">Gym Owners</option>
              <option value="ADMIN">Admins</option>
            </Select>
            <Select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="suspended">Suspended</option>
              <option value="pending">Pending</option>
            </Select>
            <Button variant="outline" onClick={resetFilters}>
              <Filter className="h-4 w-4 mr-2" />
              Reset Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle>Users</CardTitle>
          <CardDescription>
            Showing {users.length} of {pagination.total} users
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading && users.length === 0 ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center space-x-4">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-1/4" />
                    <Skeleton className="h-4 w-1/3" />
                  </div>
                  <Skeleton className="h-8 w-20" />
                  <Skeleton className="h-8 w-20" />
                  <Skeleton className="h-8 w-20" />
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <p className="text-red-500 mb-4">{error}</p>
              <Button onClick={() => fetchUsers(1, true)}>Retry</Button>
              {error.includes('Unable to connect') && (
                <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                  <p className="text-sm text-blue-800">
                    <strong>Troubleshooting tips:</strong>
                  </p>
                  <ul className="text-sm text-blue-700 mt-2 text-left">
                    <li>Make sure your backend server is running</li>
                    <li>Check if the server is accessible at {apiClient.defaults.baseURL}</li>
                    <li>Verify the API endpoint is correct</li>
                    <li>Check for any CORS issues in the browser console</li>
                  </ul>
                </div>
              )}
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User ID</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Tier</TableHead>
                      <TableHead>Gyms</TableHead>
                      <TableHead>Trainers</TableHead>
                      <TableHead>Subscriptions</TableHead>
                      <TableHead>Join Date</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell>
                          <div className="flex items-center space-x-3">
                            <div className="flex items-center space-x-2">
                              <Hash className="h-4 w-4 text-gray-400" />
                              <div>
                                <p className="font-mono text-sm font-medium">#{user.id}</p>
                                <p className="text-xs text-gray-500">{user.email}</p>
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={getRoleColor(user.role)}>
                            {user.role}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(user.status)}>
                            {user.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className={getTierColor(user.tier)}>
                            {user.tier}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1 max-w-xs">
                            {user.gymNames && user.gymNames.length > 0 ? (
                              user.gymNames.map((gymName, index) => (
                                <Badge key={index} variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                                  <Building2 className="h-3 w-3 mr-1" />
                                  {gymName}
                                </Badge>
                              ))
                            ) : (
                              <span className="text-sm text-gray-500">No gyms</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1 max-w-xs">
                            {user.trainerNames && user.trainerNames.length > 0 ? (
                              user.trainerNames.map((trainerName, index) => (
                                <Badge key={index} variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                                  <Dumbbell className="h-3 w-3 mr-1" />
                                  {trainerName}
                                </Badge>
                              ))
                            ) : (
                              <span className="text-sm text-gray-500">No trainers</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm font-medium">{user.subscriptionCount}</span>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm">
                            {new Date(user.createdAt).toLocaleDateString()}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Button variant="ghost" size="sm" title="View Details">
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => handleEditUser(user)} title="Edit">
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => handleStatusChange(user)} title="Change Status">
                              <Settings className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => handleDeleteUser(user)} className="text-red-600" title="Delete">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              
              {/* Pagination */}
              {pagination.totalPages > 1 && (
                <div className="flex items-center justify-between mt-6">
                  <p className="text-sm text-gray-500">
                    Showing {((pagination.page - 1) * pagination.limit) + 1} to{' '}
                    {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
                    {pagination.total} results
                  </p>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(pagination.page - 1)}
                      disabled={!pagination.hasPrev}
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Previous
                    </Button>
                    <span className="text-sm">
                      Page {pagination.page} of {pagination.totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(pagination.page + 1)}
                      disabled={!pagination.hasNext}
                    >
                      Next
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Edit User Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Edit User</h2>
              <Button variant="ghost" size="sm" onClick={() => setShowEditModal(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <Input
                  id="name"
                  value={editForm.name}
                  onChange={(e) => setEditForm({...editForm, name: e.target.value})}
                />
              </div>
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <Input
                  id="email"
                  value={editForm.email}
                  disabled
                  className="bg-gray-100"
                />
              </div>
              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                <Input
                  id="phone"
                  value={editForm.phone}
                  onChange={(e) => setEditForm({...editForm, phone: e.target.value})}
                />
              </div>
              <div>
                <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <Select
                  id="status"
                  value={editForm.status}
                  onChange={(e) => setEditForm({...editForm, status: e.target.value})}
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="suspended">Suspended</option>
                  <option value="pending">Pending</option>
                </Select>
              </div>
              <div>
                <label htmlFor="tier" className="block text-sm font-medium text-gray-700 mb-1">Tier</label>
                <Select
                  id="tier"
                  value={editForm.tier}
                  onChange={(e) => setEditForm({...editForm, tier: e.target.value})}
                >
                  <option value="Basic">Basic</option>
                  <option value="Premium">Premium</option>
                  <option value="Gold">Gold</option>
                  <option value="Silver">Silver</option>
                  <option value="Platinum">Platinum</option>
                </Select>
              </div>
            </div>
            <div className="flex justify-end space-x-2 mt-6">
              <Button variant="outline" onClick={() => setShowEditModal(false)}>Cancel</Button>
              <Button onClick={saveUserChanges}>Save Changes</Button>
            </div>
          </div>
        </div>
      )}

      {/* Change Status Modal */}
      {showStatusModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Change User Status</h2>
              <Button variant="ghost" size="sm" onClick={() => setShowStatusModal(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-sm text-gray-500 mb-4">
              Change the status of user #{selectedUser?.id}. This will affect their access to the platform.
            </p>
            <div className="space-y-4">
              <div>
                <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <Select
                  id="status"
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="suspended">Suspended</option>
                  <option value="pending">Pending</option>
                </Select>
              </div>
            </div>
            <div className="flex justify-end space-x-2 mt-6">
              <Button variant="outline" onClick={() => setShowStatusModal(false)}>Cancel</Button>
              <Button onClick={updateUserStatusHandler}>Update Status</Button>
            </div>
          </div>
        </div>
      )}

      {/* Delete User Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Delete User</h2>
              <Button variant="ghost" size="sm" onClick={() => setShowDeleteModal(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-sm text-gray-500 mb-4">
              Are you sure you want to delete user #{selectedUser?.id}? This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-2 mt-6">
              <Button variant="outline" onClick={() => setShowDeleteModal(false)}>Cancel</Button>
              <Button variant="destructive" onClick={deleteUserHandler}>Delete User</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}