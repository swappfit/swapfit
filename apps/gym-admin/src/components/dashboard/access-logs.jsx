import React, { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card"
import { Button } from "../ui/button"
import { Input } from "../ui/input"
import { Badge } from "../ui/badge"
import { 
  Shield, 
  Search, 
  MoreHorizontal, 
  Eye, 
  Trash2, 
  AlertTriangle,
  CheckCircle,
  Clock,
  MapPin,
  Monitor,
  Download,
  Filter
} from "lucide-react"
import { Avatar, AvatarFallback } from "../ui/avatar"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "../ui/dropdown-menu"

const accessLogs = [
  {
    id: 1,
    user: "Alex Johnson",
    email: "alex.johnson@fitness.com",
    action: "Login",
    status: "Success",
    ipAddress: "192.168.1.100",
    location: "New York, NY",
    device: "Chrome on Windows",
    timestamp: "2024-01-25 10:30:15",
    avatar: "AJ",
    sessionDuration: "2h 15m"
  },
  {
    id: 2,
    user: "Sarah Wilson",
    email: "sarah.wilson@fitness.com",
    action: "Login",
    status: "Failed",
    ipAddress: "203.45.67.89",
    location: "Los Angeles, CA",
    device: "Safari on iPhone",
    timestamp: "2024-01-25 10:25:42",
    avatar: "SW",
    sessionDuration: "0m"
  },
  {
    id: 3,
    user: "Mike Chen",
    email: "mike.chen@fitness.com",
    action: "Logout",
    status: "Success",
    ipAddress: "172.16.0.50",
    location: "Chicago, IL",
    device: "Firefox on Mac",
    timestamp: "2024-01-25 10:20:33",
    avatar: "MC",
    sessionDuration: "1h 45m"
  },
  {
    id: 4,
    user: "Lisa Rodriguez",
    email: "lisa.rodriguez@fitness.com",
    action: "Login",
    status: "Success",
    ipAddress: "10.0.0.25",
    location: "Miami, FL",
    device: "Edge on Windows",
    timestamp: "2024-01-25 10:15:18",
    avatar: "LR",
    sessionDuration: "3h 30m"
  },
  {
    id: 5,
    user: "David Brown",
    email: "david.brown@fitness.com",
    action: "Password Change",
    status: "Success",
    ipAddress: "192.168.1.150",
    location: "Seattle, WA",
    device: "Chrome on Android",
    timestamp: "2024-01-25 10:10:55",
    avatar: "DB",
    sessionDuration: "45m"
  }
]

export function AccessLogs() {
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")

  const filteredLogs = accessLogs.filter(log => {
    const matchesSearch = log.user.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         log.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         log.ipAddress.includes(searchTerm)
    const matchesStatus = statusFilter === "all" || log.status === statusFilter
    return matchesSearch && matchesStatus
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Access Logs</h1>
          <p className="text-slate-400 mt-1">Track admin logins, user sessions, for security & compliance</p>
        </div>
        <Button className="bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white">
          <Download className="w-4 h-4 mr-2" />
          Export Logs
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm">Total Logins</p>
                <p className="text-2xl font-bold text-white">1,247</p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-blue-500 rounded-lg flex items-center justify-center">
                <Shield className="w-6 h-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm">Successful Logins</p>
                <p className="text-2xl font-bold text-white">1,189</p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm">Failed Attempts</p>
                <p className="text-2xl font-bold text-white">58</p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-pink-500 rounded-lg flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm">Active Sessions</p>
                <p className="text-2xl font-bold text-white">23</p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-lg flex items-center justify-center">
                <Monitor className="w-6 h-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card className="bg-slate-800 border-slate-700">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
              <Input
                type="search"
                placeholder="Search by user, email, or IP address..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-slate-700 border-slate-600 text-white placeholder-slate-400"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 bg-slate-700 border border-slate-600 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="all">All Status</option>
              <option value="Success">Success</option>
              <option value="Failed">Failed</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Access Logs List */}
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white">Access Log History</CardTitle>
          <CardDescription className="text-slate-400">
            {filteredLogs.length} logs found
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredLogs.map((log) => (
              <div
                key={log.id}
                className="flex items-center justify-between p-4 bg-slate-700 rounded-lg hover:bg-slate-600 transition-colors"
              >
                <div className="flex items-center space-x-4">
                  <Avatar className="h-12 w-12">
                    <AvatarFallback className="bg-gradient-to-br from-green-400 to-blue-500 text-white">
                      {log.avatar}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-semibold text-white">{log.user}</h3>
                    <div className="flex items-center space-x-4 text-sm text-slate-400">
                      <span>{log.email}</span>
                      <span className="flex items-center">
                        <MapPin className="w-4 h-4 mr-1" />
                        {log.location}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2 mt-1">
                      <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30 text-xs">
                        {log.action}
                      </Badge>
                      <Badge className="bg-gray-500/20 text-gray-400 border-gray-500/30 text-xs">
                        {log.ipAddress}
                      </Badge>
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-4">
                  <div className="text-right">
                    <Badge 
                      className={
                        log.status === "Success" 
                          ? "bg-green-500/20 text-green-400 border-green-500/30"
                          : "bg-red-500/20 text-red-400 border-red-500/30"
                      }
                    >
                      {log.status}
                    </Badge>
                    <p className="text-sm text-slate-400 mt-1">{log.timestamp}</p>
                  </div>
                  
                  <div className="text-right text-sm text-slate-400">
                    <p className="flex items-center">
                      <Clock className="w-4 h-4 mr-1" />
                      {log.sessionDuration}
                    </p>
                    <p className="text-xs">{log.device}</p>
                  </div>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="text-slate-400 hover:text-white">
                        <MoreHorizontal className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-48 bg-slate-800 border-slate-700">
                      <DropdownMenuItem className="text-slate-300 hover:text-white hover:bg-slate-700">
                        <Eye className="w-4 h-4 mr-2" />
                        View Details
                      </DropdownMenuItem>
                      <DropdownMenuItem className="text-slate-300 hover:text-white hover:bg-slate-700">
                        <Shield className="w-4 h-4 mr-2" />
                        Security Check
                      </DropdownMenuItem>
                      <DropdownMenuItem className="text-slate-300 hover:text-white hover:bg-slate-700">
                        <Download className="w-4 h-4 mr-2" />
                        Export Log
                      </DropdownMenuItem>
                      <DropdownMenuItem className="text-red-400 hover:text-red-300 hover:bg-slate-700">
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete Log
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
