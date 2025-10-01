import React, { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card"
import { Button } from "../ui/button"
import { Badge } from "../ui/badge"
import { Input } from "../ui/input"
import { 
  Bell, 
  Send, 
  Search, 
  Filter, 
  Plus, 
  Edit, 
  Trash2, 
  Eye, 
  Users, 
  Calendar,
  Target,
  Award,
  Building2,
  Mail,
  Clock,
  CheckCircle,
  AlertCircle
} from "lucide-react"
import { Avatar, AvatarFallback } from "../ui/avatar"

const notifications = []

const notificationTemplates = [
  {
    id: 1,
    name: "Challenge Announcement",
    description: "Announce new fitness challenges to all members",
    type: "Challenge",
    icon: Target
  },
  {
    id: 2,
    name: "Achievement Celebration",
    description: "Celebrate member achievements and badge unlocks",
    type: "Achievement",
    icon: Award
  },
  {
    id: 3,
    name: "Maintenance Alert",
    description: "Notify about gym maintenance and closures",
    type: "Maintenance",
    icon: Building2
  },
  {
    id: 4,
    name: "Progress Report",
    description: "Send monthly progress reports to members",
    type: "Report",
    icon: Users
  }
]

export function MemberNotifications() {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedType, setSelectedType] = useState("all")
  const [selectedStatus, setSelectedStatus] = useState("all")
  const [selectedPriority, setSelectedPriority] = useState("all")
  const [items, setItems] = useState(notifications)

  useEffect(() => {
    let alive = true
    import("../../lib/api.js").then(({ authHeaders }) =>
      fetch((import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api') + '/notifications/me', {
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
      })
        .then((r) => (r.ok ? r.json() : Promise.reject()))
        .then((json) => {
          if (!alive) return
          const mapped = (json?.data || []).map((n) => ({
            id: n.id,
            title: n.title,
            message: n.message,
            type: n.type || 'General',
            priority: 'Low',
            status: 'Sent',
            recipients: 0,
            sentAt: n.createdAt ? new Date(n.createdAt).toLocaleString() : null,
            scheduledFor: null,
            icon: Bell,
            color: 'from-green-400 to-blue-500',
          }))
          setItems(mapped)
        })
        .catch(() => {})
    )
    return () => { alive = false }
  }, [])

  const filteredNotifications = items.filter(notification => {
    const matchesSearch = notification.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         notification.message.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesType = selectedType === "all" || notification.type === selectedType
    const matchesStatus = selectedStatus === "all" || notification.status === selectedStatus
    const matchesPriority = selectedPriority === "all" || notification.priority === selectedPriority
    return matchesSearch && matchesType && matchesStatus && matchesPriority
  })

  const getStatusColor = (status) => {
    switch (status) {
      case "Sent": return "bg-green-500/20 text-green-400 border-green-500/30"
      case "Scheduled": return "bg-blue-500/20 text-blue-400 border-blue-500/30"
      case "Draft": return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30"
      case "Failed": return "bg-red-500/20 text-red-400 border-red-500/30"
      default: return "bg-slate-500/20 text-slate-400 border-slate-500/30"
    }
  }

  const getPriorityColor = (priority) => {
    switch (priority) {
      case "High": return "bg-red-500/20 text-red-400 border-red-500/30"
      case "Medium": return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30"
      case "Low": return "bg-green-500/20 text-green-400 border-green-500/30"
      default: return "bg-slate-500/20 text-slate-400 border-slate-500/30"
    }
  }

  const getTypeColor = (type) => {
    switch (type) {
      case "Challenge": return "bg-green-500/20 text-green-400 border-green-500/30"
      case "Achievement": return "bg-purple-500/20 text-purple-400 border-purple-500/30"
      case "Maintenance": return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30"
      case "Report": return "bg-blue-500/20 text-blue-400 border-blue-500/30"
      case "Class": return "bg-red-500/20 text-red-400 border-red-500/30"
      default: return "bg-slate-500/20 text-slate-400 border-slate-500/30"
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white">Member Notifications</h1>
        <p className="text-slate-400 mt-2">Manage and send notifications to your fitness community.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="bg-slate-900 border-slate-800">
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="p-3 rounded-full bg-gradient-to-br from-green-400 to-blue-500">
                <Bell className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-400">Total Sent</p>
                <p className="text-2xl font-bold text-white">{notifications.filter(n => n.status === "Sent").length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-900 border-slate-800">
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="p-3 rounded-full bg-gradient-to-br from-blue-400 to-purple-500">
                <Clock className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-400">Scheduled</p>
                <p className="text-2xl font-bold text-white">{notifications.filter(n => n.status === "Scheduled").length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-900 border-slate-800">
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="p-3 rounded-full bg-gradient-to-br from-purple-400 to-pink-500">
                <Users className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-400">Total Recipients</p>
                <p className="text-2xl font-bold text-white">{notifications.reduce((sum, n) => sum + n.recipients, 0).toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-900 border-slate-800">
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="p-3 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500">
                <Mail className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-400">Templates</p>
                <p className="text-2xl font-bold text-white">{notificationTemplates.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
          <Input
            placeholder="Search notifications..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-slate-800 border-slate-700 text-white placeholder-slate-400 focus:border-green-500 focus:ring-green-500"
          />
        </div>
        <div className="flex gap-2">
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="px-3 py-2 bg-slate-800 border border-slate-700 text-white rounded-md focus:border-green-500 focus:ring-green-500"
          >
            <option value="all">All Types</option>
            <option value="Challenge">Challenge</option>
            <option value="Achievement">Achievement</option>
            <option value="Maintenance">Maintenance</option>
            <option value="Report">Report</option>
            <option value="Class">Class</option>
          </select>
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-3 py-2 bg-slate-800 border border-slate-700 text-white rounded-md focus:border-green-500 focus:ring-green-500"
          >
            <option value="all">All Status</option>
            <option value="Sent">Sent</option>
            <option value="Scheduled">Scheduled</option>
            <option value="Draft">Draft</option>
            <option value="Failed">Failed</option>
          </select>
          <select
            value={selectedPriority}
            onChange={(e) => setSelectedPriority(e.target.value)}
            className="px-3 py-2 bg-slate-800 border border-slate-700 text-white rounded-md focus:border-green-500 focus:ring-green-500"
          >
            <option value="all">All Priorities</option>
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </select>
          <Button className="bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600">
            <Plus className="w-4 h-4 mr-2" />
            New Notification
          </Button>
        </div>
      </div>

      {/* Notification Templates */}
      <Card className="bg-slate-900 border-slate-800">
        <CardHeader>
          <CardTitle className="text-white">Quick Templates</CardTitle>
          <CardDescription className="text-slate-400">
            Use pre-built templates for common notifications
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {notificationTemplates.map((template) => (
              <div key={template.id} className="p-4 rounded-lg bg-slate-800/50 hover:bg-slate-800 transition-colors border border-slate-700 cursor-pointer">
                <div className="flex items-center space-x-3">
                  <div className="p-2 rounded-lg bg-gradient-to-br from-green-400 to-blue-500">
                    <template.icon className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-medium text-white">{template.name}</h3>
                    <p className="text-sm text-slate-400">{template.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Notifications List */}
      <div className="space-y-6">
        {filteredNotifications.map((notification) => (
          <Card key={notification.id} className="bg-slate-900 border-slate-800 hover:border-green-500/30 transition-all duration-200">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-4">
                  <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${notification.color} flex items-center justify-center`}>
                    <notification.icon className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-white">{notification.title}</CardTitle>
                    <CardDescription className="text-slate-400">
                      {notification.message}
                    </CardDescription>
                    <div className="flex items-center space-x-4 mt-2">
                      <div className="flex items-center space-x-1 text-sm text-slate-400">
                        <Users className="w-4 h-4" />
                        <span>{notification.recipients.toLocaleString()} recipients</span>
                      </div>
                      {notification.sentAt && (
                        <div className="flex items-center space-x-1 text-sm text-slate-400">
                          <CheckCircle className="w-4 h-4" />
                          <span>Sent {notification.sentAt}</span>
                        </div>
                      )}
                      {notification.scheduledFor && (
                        <div className="flex items-center space-x-1 text-sm text-slate-400">
                          <Clock className="w-4 h-4" />
                          <span>Scheduled for {notification.scheduledFor}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge className={getTypeColor(notification.type)}>
                    {notification.type}
                  </Badge>
                  <Badge className={getPriorityColor(notification.priority)}>
                    {notification.priority}
                  </Badge>
                  <Badge className={getStatusColor(notification.status)}>
                    {notification.status}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between pt-4 border-t border-slate-700">
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-slate-600 text-slate-300 hover:bg-slate-700"
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    Preview
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-slate-600 text-slate-300 hover:bg-slate-700"
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    Edit
                  </Button>
                </div>
                
                <div className="flex space-x-2">
                  {notification.status === "Draft" && (
                    <Button
                      size="sm"
                      className="bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600"
                    >
                      <Send className="w-4 h-4 mr-2" />
                      Send Now
                    </Button>
                  )}
                  {notification.status === "Scheduled" && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-yellow-600 text-yellow-400 hover:bg-yellow-600/20"
                    >
                      <Clock className="w-4 h-4 mr-2" />
                      Reschedule
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-red-600 text-red-400 hover:bg-red-600/20"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredNotifications.length === 0 && (
        <Card className="bg-slate-900 border-slate-800">
          <CardContent className="p-12 text-center">
            <Bell className="w-12 h-12 text-slate-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-white mb-2">No notifications found</h3>
            <p className="text-slate-400">No notifications match your current filters.</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
