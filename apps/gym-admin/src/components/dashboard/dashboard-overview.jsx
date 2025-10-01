import React, { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card"
import { Button } from "../ui/button"
import { Badge } from "../ui/badge"
import { 
  Users, 
  TrendingUp, 
  DollarSign, 
  Target, 
  Calendar,
  Award,
  Activity,
  ArrowUp,
  ArrowDown
} from "lucide-react"

const fallbackStats = [
  {
    title: "Total Members",
    value: "2,847",
    change: "+12.5%",
    changeType: "positive",
    icon: Users,
    color: "from-blue-500 to-purple-500"
  },
  {
    title: "Active Subscriptions",
    value: "1,923",
    change: "+8.2%",
    changeType: "positive",
    icon: TrendingUp,
    color: "from-green-500 to-emerald-500"
  },
  {
    title: "Monthly Revenue",
    value: "$45,231",
    change: "+15.3%",
    changeType: "positive",
    icon: DollarSign,
    color: "from-orange-500 to-red-500"
  },
  {
    title: "Goal Completion",
    value: "78.2%",
    change: "-2.1%",
    changeType: "negative",
    icon: Target,
    color: "from-purple-500 to-pink-500"
  }
]

const recentActivity = []

export function DashboardOverview() {
  const [stats, setStats] = useState(fallbackStats)

  useEffect(() => {
    let isMounted = true
    import("../../lib/api.js").then(({ getAdminDashboard }) =>
      getAdminDashboard()
        .then((data) => {
          if (!isMounted || !data) return
          const s = [
            {
              title: "Total Members",
              value: String(data.userStats?.total ?? 0),
              change: "+0%",
              changeType: "positive",
              icon: Users,
              color: "from-blue-500 to-purple-500",
            },
            {
              title: "Active Subscriptions",
              value: String(data.platformStats?.activeSubscriptions ?? 0),
              change: "+0%",
              changeType: "positive",
              icon: TrendingUp,
              color: "from-green-500 to-emerald-500",
            },
            {
              title: "Approved Gyms",
              value: String(data.gymStats?.approved ?? 0),
              change: "+0%",
              changeType: "positive",
              icon: Award,
              color: "from-orange-500 to-red-500",
            },
            {
              title: "Pending Gyms",
              value: String(data.gymStats?.pendingApproval ?? 0),
              change: "+0%",
              changeType: "negative",
              icon: Target,
              color: "from-purple-500 to-pink-500",
            },
          ]
          setStats(s)
        })
        .catch(() => {})
    )
    return () => {
      isMounted = false
    }
  }, [])
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground">Welcome back! Here's what's happening with your gym today.</p>
        </div>
        <Button className="bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white">
          <Calendar className="h-4 w-4 mr-2" />
          View Reports
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <Card key={index} className="bg-card border-border">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{stat.title}</p>
                  <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                  <div className="flex items-center mt-1">
                    {stat.changeType === "positive" ? (
                      <ArrowUp className="h-3 w-3 text-green-500 mr-1" />
                    ) : (
                      <ArrowDown className="h-3 w-3 text-red-500 mr-1" />
                    )}
                    <span className={`text-xs font-medium ${
                      stat.changeType === "positive" ? "text-green-500" : "text-red-500"
                    }`}>
                      {stat.change}
                    </span>
                    <span className="text-xs text-muted-foreground ml-1">from last month</span>
                  </div>
                </div>
                <div className={`w-12 h-12 bg-gradient-to-br ${stat.color} rounded-lg flex items-center justify-center`}>
                  <stat.icon className="h-6 w-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent Activity */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-foreground">Recent Activity</CardTitle>
          <CardDescription className="text-muted-foreground">
            Latest member activities and achievements
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentActivity.map((activity) => (
              <div key={activity.id} className="flex items-center space-x-4 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-blue-500 rounded-full flex items-center justify-center text-white font-medium text-sm">
                  {activity.avatar}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">
                    <span className="font-semibold">{activity.user}</span> {activity.action}
                  </p>
                  <p className="text-xs text-muted-foreground">{activity.time}</p>
                </div>
                <Badge variant="secondary" className="text-xs">
                  {activity.type}
                </Badge>
              </div>
            ))}
          </div>
          <div className="mt-4 pt-4 border-t border-border">
            <Button variant="outline" className="w-full border-border text-muted-foreground hover:text-foreground">
              View All Activity
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-card border-border hover:border-primary/50 transition-colors">
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
                <Users className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">Add New Member</h3>
                <p className="text-sm text-muted-foreground">Register a new gym member</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border hover:border-primary/50 transition-colors">
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-500 rounded-lg flex items-center justify-center">
                <Award className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">Create Challenge</h3>
                <p className="text-sm text-muted-foreground">Set up a new fitness challenge</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border hover:border-primary/50 transition-colors">
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-500 rounded-lg flex items-center justify-center">
                <Activity className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">View Analytics</h3>
                <p className="text-sm text-muted-foreground">Check performance metrics</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
