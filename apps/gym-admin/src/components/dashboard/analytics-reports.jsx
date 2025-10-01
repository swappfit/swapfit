import React, { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card"
import { Button } from "../ui/button"
import { Badge } from "../ui/badge"
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  Calendar, 
  Download, 
  Filter,
  ArrowUpRight,
  ArrowDownRight,
  Activity,
  Target,
  Award,
  Building2
} from "lucide-react"

const analyticsData = {
  overview: {
    totalMembers: 2847,
    activeMembers: 2341,
    totalRevenue: 125000,
    avgEngagement: 78.5,
    memberGrowth: 12.5,
    revenueGrowth: 8.3,
    engagementGrowth: -2.1
  },
  metrics: [
    {
      title: "New Signups",
      value: "156",
      change: "+12.5%",
      trend: "up",
      icon: Users,
      color: "from-green-400 to-blue-500"
    },
    {
      title: "Active Challenges",
      value: "24",
      change: "+8.2%",
      trend: "up",
      icon: Target,
      color: "from-blue-400 to-purple-500"
    },
    {
      title: "Badges Issued",
      value: "1,234",
      change: "+15.3%",
      trend: "up",
      icon: Award,
      color: "from-purple-400 to-pink-500"
    },
    {
      title: "Gym Partners",
      value: "89",
      change: "+5.4%",
      trend: "up",
      icon: Building2,
      color: "from-yellow-400 to-orange-500"
    }
  ],
  topGyms: [
    { name: "Fitness First", members: 245, growth: 12.5, revenue: 45000 },
    { name: "Elite Fitness", members: 189, growth: 8.2, revenue: 38000 },
    { name: "PowerFit Gym", members: 156, growth: 15.3, revenue: 32000 },
    { name: "Yoga Studio Plus", members: 98, growth: 5.4, revenue: 25000 },
    { name: "CrossFit Central", members: 134, growth: 10.1, revenue: 28000 }
  ],
  recentActivity: [
    { type: "New Member", user: "Sarah Johnson", gym: "Fitness First", time: "2 minutes ago" },
    { type: "Challenge Completed", user: "Mike Chen", gym: "Elite Fitness", time: "15 minutes ago" },
    { type: "Badge Earned", user: "Alex Rodriguez", gym: "PowerFit Gym", time: "1 hour ago" },
    { type: "Gym Joined", user: "Emma Wilson", gym: "Yoga Studio Plus", time: "2 hours ago" },
    { type: "Revenue Generated", user: "David Park", gym: "CrossFit Central", time: "3 hours ago" }
  ]
}

export function AnalyticsReports() {
  const [selectedPeriod, setSelectedPeriod] = useState("30d")

  const getTrendIcon = (trend) => {
    return trend === "up" ? (
      <ArrowUpRight className="w-4 h-4 text-green-400" />
    ) : (
      <ArrowDownRight className="w-4 h-4 text-red-400" />
    )
  }

  const getActivityColor = (type) => {
    switch (type) {
      case "New Member": return "bg-green-500/20 text-green-400 border-green-500/30"
      case "Challenge Completed": return "bg-blue-500/20 text-blue-400 border-blue-500/30"
      case "Badge Earned": return "bg-purple-500/20 text-purple-400 border-purple-500/30"
      case "Gym Joined": return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30"
      case "Revenue Generated": return "bg-orange-500/20 text-orange-400 border-orange-500/30"
      default: return "bg-slate-500/20 text-slate-400 border-slate-500/30"
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">Analytics & Reports</h1>
          <p className="text-slate-400 mt-2">Comprehensive insights into your fitness ecosystem performance.</p>
        </div>
        <div className="flex gap-2">
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="px-3 py-2 bg-slate-800 border border-slate-700 text-white rounded-md focus:border-green-500 focus:ring-green-500"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
            <option value="1y">Last year</option>
          </select>
          <Button variant="outline" className="border-slate-600 text-slate-300 hover:bg-slate-700">
            <Filter className="w-4 h-4 mr-2" />
            Filter
          </Button>
          <Button className="bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {analyticsData.metrics.map((metric) => (
          <Card key={metric.title} className="bg-slate-900 border-slate-800 hover:border-green-500/30 transition-all duration-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-400">
                {metric.title}
              </CardTitle>
              <div className={`p-2 rounded-lg bg-gradient-to-br ${metric.color}`}>
                <metric.icon className="h-4 w-4 text-white" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{metric.value}</div>
              <div className="flex items-center space-x-1 mt-1">
                {getTrendIcon(metric.trend)}
                <span className="text-xs text-green-400">{metric.change}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main Analytics Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart Placeholder */}
        <Card className="bg-slate-900 border-slate-800">
          <CardHeader>
            <CardTitle className="text-white">Member Growth</CardTitle>
            <CardDescription className="text-slate-400">
              Monthly member registration trends
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80 flex items-center justify-center">
              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-green-400 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <BarChart3 className="h-8 w-8 text-white" />
                </div>
                <p className="text-slate-400">Chart component will be added here</p>
                <p className="text-sm text-slate-500 mt-2">Member growth visualization</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Revenue Chart */}
        <Card className="bg-slate-900 border-slate-800">
          <CardHeader>
            <CardTitle className="text-white">Revenue Analytics</CardTitle>
            <CardDescription className="text-slate-400">
              Monthly revenue and subscription trends
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80 flex items-center justify-center">
              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <TrendingUp className="h-8 w-8 text-white" />
                </div>
                <p className="text-slate-400">Chart component will be added here</p>
                <p className="text-sm text-slate-500 mt-2">Revenue analytics visualization</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Performing Gyms */}
      <Card className="bg-slate-900 border-slate-800">
        <CardHeader>
          <CardTitle className="text-white">Top Performing Gyms</CardTitle>
          <CardDescription className="text-slate-400">
            Leading gym partners by member count and revenue
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {analyticsData.topGyms.map((gym, index) => (
              <div key={gym.name} className="flex items-center justify-between p-4 rounded-lg bg-slate-800/50 hover:bg-slate-800 transition-colors">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center justify-center w-8 h-8">
                    <span className="w-6 h-6 text-center text-sm font-bold text-slate-400">#{index + 1}</span>
                  </div>
                  <div>
                    <h3 className="font-medium text-white">{gym.name}</h3>
                    <p className="text-sm text-slate-400">{gym.members} members</p>
                  </div>
                </div>
                <div className="flex items-center space-x-6">
                  <div className="text-right">
                    <p className="text-sm font-medium text-white">${gym.revenue.toLocaleString()}</p>
                    <p className="text-xs text-slate-400">Revenue</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-green-400">+{gym.growth}%</p>
                    <p className="text-xs text-slate-400">Growth</p>
                  </div>
                  <Button size="sm" variant="outline" className="border-slate-600 text-slate-300 hover:bg-slate-700">
                    View Details
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card className="bg-slate-900 border-slate-800">
        <CardHeader>
          <CardTitle className="text-white">Recent Activity</CardTitle>
          <CardDescription className="text-slate-400">
            Latest activities across your fitness ecosystem
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {analyticsData.recentActivity.map((activity, index) => (
              <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-slate-800/50">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-blue-500 rounded-full flex items-center justify-center">
                    <Activity className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">
                      {activity.user} - {activity.type}
                    </p>
                    <p className="text-xs text-slate-400">{activity.gym} • {activity.time}</p>
                  </div>
                </div>
                <Badge className={getActivityColor(activity.type)}>
                  {activity.type}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Key Metrics Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-slate-900 border-slate-800">
          <CardHeader>
            <CardTitle className="text-white">Engagement Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-white">{analyticsData.overview.avgEngagement}%</div>
            <p className="text-sm text-slate-400 mt-2">
              Average member engagement across all platforms
            </p>
            <div className="flex items-center space-x-1 mt-2">
              <ArrowDownRight className="w-4 h-4 text-red-400" />
              <span className="text-xs text-red-400">{Math.abs(analyticsData.overview.engagementGrowth)}% from last month</span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900 border-slate-800">
          <CardHeader>
            <CardTitle className="text-white">Total Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-white">${analyticsData.overview.totalRevenue.toLocaleString()}</div>
            <p className="text-sm text-slate-400 mt-2">
              Total revenue generated this month
            </p>
            <div className="flex items-center space-x-1 mt-2">
              <ArrowUpRight className="w-4 h-4 text-green-400" />
              <span className="text-xs text-green-400">+{analyticsData.overview.revenueGrowth}% from last month</span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900 border-slate-800">
          <CardHeader>
            <CardTitle className="text-white">Active Members</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-white">{analyticsData.overview.activeMembers.toLocaleString()}</div>
            <p className="text-sm text-slate-400 mt-2">
              Members with activity in the last 30 days
            </p>
            <div className="flex items-center space-x-1 mt-2">
              <ArrowUpRight className="w-4 h-4 text-green-400" />
              <span className="text-xs text-green-400">+{analyticsData.overview.memberGrowth}% from last month</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
