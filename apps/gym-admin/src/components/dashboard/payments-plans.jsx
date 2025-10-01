import React, { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card"
import { Button } from "../ui/button"
import { Input } from "../ui/input"
import { Badge } from "../ui/badge"
import { 
  Search, 
  Plus, 
  MoreHorizontal, 
  Edit, 
  Trash2, 
  CreditCard, 
  Crown,
  DollarSign, 
  Calendar, 
  Users, 
  TrendingUp, 
  AlertCircle, 
  CheckCircle, 
  Clock, 
  Download,
  Star,
  CheckCircle2,
  XCircle,
  Eye,
  Send,
  Filter
} from "lucide-react"
import { Avatar, AvatarFallback } from "../ui/avatar"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "../ui/dropdown-menu"

const paymentsData = []

const plansData = []

export function PaymentsPlans() {
  const [activeTab, setActiveTab] = useState("payments")
  const [searchTerm, setSearchTerm] = useState("")
  const [filterStatus, setFilterStatus] = useState("all")
  const [transactions, setTransactions] = useState(paymentsData)
  const [plans, setPlans] = useState(plansData)
  const [gyms, setGyms] = useState([])
  const [selectedGymId, setSelectedGymId] = useState("")

  useEffect(() => {
    let alive = true
    // Load user transactions (fallback for admin until a global endpoint exists)
    import("../../lib/api.js").then(({ getMyTransactions }) =>
      getMyTransactions({ page: 1, limit: 50 })
        .then((res) => {
          if (!alive) return
          const mapTxn = (t) => ({
            id: t.id,
            member: t.user?.email || 'Me',
            amount: `$${(t.amount || 0).toFixed?.(2) ?? t.amount}`,
            plan: t.description || t.planName || '-',
            status: (t.status || 'Completed').replace(/_/g, ' '),
            date: new Date(t.createdAt || t.date || Date.now()).toISOString().slice(0,10),
            method: t.method || 'Card',
            avatar: (t.user?.email || 'TX')[0] + (t.user?.email || 'N')[1],
          })
          setTransactions((res?.data || []).map(mapTxn))
        })
        .catch(() => {})
    )
    // Load gyms to choose from (discover list)
    import("../../lib/api.js").then(({ authHeaders }) =>
      fetch((import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api') + '/gyms/discover?page=1&limit=50', {
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
      })
        .then((r) => (r.ok ? r.json() : Promise.reject()))
        .then((json) => { if (alive) setGyms(json?.data?.gyms || []) })
        .catch(() => {})
    )
    return () => { alive = false }
  }, [])

  useEffect(() => {
    if (!selectedGymId) return
    let alive = true
    import("../../lib/api.js").then(({ getGymPlans }) =>
      getGymPlans(selectedGymId)
        .then((data) => {
          if (!alive) return
          const mapped = (data || []).map((p) => ({
            id: p.id,
            name: p.name,
            price: `$${p.price}`,
            duration: p.duration,
            features: [],
            popularity: 'High',
            activeMembers: 0,
            color: 'blue',
            status: 'Active',
          }))
          setPlans(mapped)
        })
        .catch(() => {})
    )
    return () => { alive = false }
  }, [selectedGymId])

  const tabs = [
    { id: "payments", label: "Payments", icon: CreditCard, count: transactions.length },
    { id: "plans", label: "Plans", icon: Crown, count: plans.length }
  ]

  const getStatusColor = (status) => {
    switch (status.toLowerCase()) {
      case "completed":
      case "active":
        return "bg-green-500/10 text-green-500 border-green-500/20"
      case "pending":
        return "bg-yellow-500/10 text-yellow-500 border-yellow-500/20"
      case "failed":
      case "inactive":
        return "bg-red-500/10 text-red-500 border-red-500/20"
      default:
        return "bg-gray-500/10 text-gray-500 border-gray-500/20"
    }
  }

  const getPopularityColor = (popularity) => {
    switch (popularity.toLowerCase()) {
      case "very high":
        return "bg-purple-500/10 text-purple-500 border-purple-500/20"
      case "high":
        return "bg-green-500/10 text-green-500 border-green-500/20"
      case "medium":
        return "bg-yellow-500/10 text-yellow-500 border-yellow-500/20"
      case "low":
        return "bg-red-500/10 text-red-500 border-red-500/20"
      default:
        return "bg-gray-500/10 text-gray-500 border-gray-500/20"
    }
  }

  const getPlanColor = (color) => {
    switch (color) {
      case "blue":
        return "from-blue-500 to-blue-600"
      case "purple":
        return "from-purple-500 to-purple-600"
      case "green":
        return "from-green-500 to-green-600"
      case "orange":
        return "from-orange-500 to-orange-600"
      case "gray":
        return "from-gray-500 to-gray-600"
      default:
        return "from-blue-500 to-blue-600"
    }
  }

  const renderPaymentsTab = () => (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="bg-card border-border">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Revenue</p>
                <p className="text-2xl font-bold text-foreground">$12,847</p>
              </div>
              <DollarSign className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Completed</p>
                 <p className="text-2xl font-bold text-foreground">{transactions.filter(p => p.status.toLowerCase() === "completed").length}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Pending</p>
                 <p className="text-2xl font-bold text-foreground">{transactions.filter(p => p.status.toLowerCase() === "pending").length}</p>
              </div>
              <Clock className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Failed</p>
                 <p className="text-2xl font-bold text-foreground">{transactions.filter(p => p.status.toLowerCase() === "failed").length}</p>
              </div>
              <AlertCircle className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Payments List */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-foreground">Recent Payments</CardTitle>
          <CardDescription className="text-muted-foreground">Track payment transactions and status</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {transactions.map((payment) => (
              <div key={payment.id} className="flex items-center justify-between p-4 bg-muted/50 rounded-lg border border-border">
                <div className="flex items-center space-x-4">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className="bg-gradient-to-br from-green-500 to-blue-500 text-white">
                      {payment.avatar}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-medium text-foreground">{payment.member}</h3>
                    <p className="text-sm text-muted-foreground">{payment.plan}</p>
                    <div className="flex items-center space-x-2 mt-1">
                      <Badge className={getStatusColor(payment.status)}>
                        {payment.status}
                      </Badge>
                      <Badge variant="outline" className="text-muted-foreground border-border">
                        {payment.method}
                      </Badge>
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="text-right">
                   <p className="text-lg font-bold text-foreground">{payment.amount}</p>
                    <p className="text-sm text-muted-foreground">{payment.date}</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
                      <Download className="h-4 w-4" />
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent className="bg-card border-border">
                        <DropdownMenuItem className="text-foreground hover:bg-accent">
                          <Send className="h-4 w-4 mr-2" />
                          Send Receipt
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-foreground hover:bg-accent">
                          <Edit className="h-4 w-4 mr-2" />
                          Edit Payment
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-red-500 hover:bg-accent">
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete Payment
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )

  const renderPlansTab = () => (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="bg-card border-border">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Plans</p>
                 <p className="text-2xl font-bold text-foreground">{plans.length}</p>
              </div>
              <Crown className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active Plans</p>
                 <p className="text-2xl font-bold text-foreground">{plans.filter(p => p.status === "Active").length}</p>
              </div>
              <CheckCircle2 className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Members</p>
                 <p className="text-2xl font-bold text-foreground">{plans.reduce((sum, p) => sum + (p.activeMembers || 0), 0)}</p>
              </div>
              <Users className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Avg Price</p>
                <p className="text-2xl font-bold text-foreground">$67.99</p>
              </div>
              <TrendingUp className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Plans Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {plans.map((plan) => (
          <Card key={plan.id} className="bg-card border-border hover:border-primary/50 transition-colors">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className={`w-12 h-12 bg-gradient-to-br ${getPlanColor(plan.color)} rounded-lg flex items-center justify-center`}>
                  <Crown className="h-6 w-6 text-white" />
                </div>
                <Badge className={getStatusColor(plan.status)}>
                  {plan.status}
                </Badge>
              </div>
              <CardTitle className="text-foreground">{plan.name}</CardTitle>
              <CardDescription className="text-muted-foreground">
                {plan.duration} • {plan.activeMembers} members
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="text-center">
                  <p className="text-3xl font-bold text-foreground">{plan.price}</p>
                  <p className="text-sm text-muted-foreground">per {plan.duration}</p>
                </div>
                
                <div className="space-y-2">
                  <p className="text-sm font-medium text-foreground">Features:</p>
                  <ul className="space-y-1">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-center text-sm text-muted-foreground">
                        <CheckCircle className="h-3 w-3 text-green-500 mr-2 flex-shrink-0" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="flex items-center justify-between">
                  <Badge className={getPopularityColor(plan.popularity)}>
                    {plan.popularity} Popularity
                  </Badge>
                  <div className="flex items-center space-x-2">
                    <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
                      <Edit className="h-4 w-4" />
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent className="bg-card border-border">
                        <DropdownMenuItem className="text-foreground hover:bg-accent">
                          <Users className="h-4 w-4 mr-2" />
                          View Members
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-foreground hover:bg-accent">
                          <TrendingUp className="h-4 w-4 mr-2" />
                          Analytics
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-red-500 hover:bg-accent">
                          <XCircle className="h-4 w-4 mr-2" />
                          Deactivate
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Payments & Plans</h1>
          <p className="text-muted-foreground">Manage payments, subscriptions, and membership plans</p>
        </div>
        <Button className="bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white">
          <Plus className="h-4 w-4 mr-2" />
          Add New
        </Button>
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search payments or plans..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-background border-border text-foreground placeholder:text-muted-foreground"
          />
        </div>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-3 py-2 bg-background border border-border rounded-md text-foreground"
        >
          <option value="all">All Status</option>
          <option value="completed">Completed</option>
          <option value="pending">Pending</option>
          <option value="failed">Failed</option>
        </select>
      </div>

      {/* Tabs */}
      <div className="border-b border-border">
        <div className="flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center space-x-2 py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === tab.id
                  ? "border-green-500 text-green-600 dark:text-green-400"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              <tab.icon className="h-4 w-4" />
              <span>{tab.label}</span>
              <Badge variant="secondary" className="ml-1 bg-muted text-muted-foreground">
                {tab.count}
              </Badge>
            </button>
          ))}
        </div>
      </div>

      {/* Gym selector for Plans */}
      {activeTab === 'plans' && (
        <div className="flex items-center gap-3">
          <label className="text-sm text-muted-foreground">Gym:</label>
          <select value={selectedGymId} onChange={(e) => setSelectedGymId(e.target.value)} className="px-3 py-2 bg-background border border-border rounded-md text-foreground">
            <option value="">Select gym…</option>
            {gyms.map((g) => (
              <option key={g.id} value={g.id}>{g.name}</option>
            ))}
          </select>
        </div>
      )}

      {/* Tab Content */}
      <div className="mt-6">
        {activeTab === "payments" && renderPaymentsTab()}
        {activeTab === "plans" && renderPlansTab()}
      </div>
    </div>
  )
}
