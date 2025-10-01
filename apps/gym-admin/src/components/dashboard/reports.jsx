import React from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card"
import { Button } from "../ui/button"
import { Badge } from "../ui/badge"
import { 
  TrendingUp, 
  TrendingDown, 
  Users, 
  DollarSign, 
  Calendar,
  Download,
  Filter,
  BarChart3,
  PieChart,
  Activity,
  Target,
  Award
} from "lucide-react"

const reportData = [
  {
    id: 1,
    title: "Monthly Revenue Report",
    type: "Financial",
    period: "January 2024",
    status: "Generated",
    date: "2024-01-20",
    downloads: 15
  },
  {
    id: 2,
    title: "Member Activity Analysis",
    type: "Analytics",
    period: "Last 30 Days",
    status: "Pending",
    date: "2024-01-19",
    downloads: 8
  },
  {
    id: 3,
    title: "Class Attendance Report",
    type: "Operations",
    period: "This Week",
    status: "Generated",
    date: "2024-01-18",
    downloads: 23
  },
  {
    id: 4,
    title: "Trainer Performance Review",
    type: "HR",
    period: "Q4 2023",
    status: "Generated",
    date: "2024-01-17",
    downloads: 12
  },
  {
    id: 5,
    title: "Equipment Usage Statistics",
    type: "Operations",
    period: "Last Month",
    status: "Failed",
    date: "2024-01-16",
    downloads: 0
  }
]

const getTypeColor = (type) => {
  switch (type.toLowerCase()) {
    case "financial":
      return "from-green-500 to-emerald-500"
    case "analytics":
      return "from-blue-500 to-purple-500"
    case "operations":
      return "from-orange-500 to-red-500"
    case "hr":
      return "from-purple-500 to-pink-500"
    default:
      return "from-gray-500 to-gray-600"
  }
}

const getStatusColor = (status) => {
  switch (status.toLowerCase()) {
    case "generated":
      return "bg-green-500/10 text-green-500 border-green-500/20"
    case "pending":
      return "bg-yellow-500/10 text-yellow-500 border-yellow-500/20"
    case "failed":
      return "bg-red-500/10 text-red-500 border-red-500/20"
    default:
      return "bg-gray-500/10 text-gray-500 border-gray-500/20"
  }
}

export function Reports() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Reports & Analytics</h1>
          <p className="text-muted-foreground">Generate and view detailed reports and analytics</p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" className="border-border text-muted-foreground hover:text-foreground">
            <Filter className="h-4 w-4 mr-2" />
            Filter
          </Button>
          <Button className="bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white">
            <BarChart3 className="h-4 w-4 mr-2" />
            Generate Report
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="bg-card border-border">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Reports</p>
                <p className="text-2xl font-bold text-foreground">{reportData.length}</p>
              </div>
              <BarChart3 className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Generated</p>
                <p className="text-2xl font-bold text-foreground">{reportData.filter(r => r.status === "Generated").length}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Downloads</p>
                <p className="text-2xl font-bold text-foreground">{reportData.reduce((sum, r) => sum + r.downloads, 0)}</p>
              </div>
              <Download className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Failed Reports</p>
                <p className="text-2xl font-bold text-foreground">{reportData.filter(r => r.status === "Failed").length}</p>
              </div>
              <TrendingDown className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Reports List */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-foreground">Recent Reports</CardTitle>
          <CardDescription className="text-muted-foreground">View and manage generated reports</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {reportData.map((report) => (
              <div key={report.id} className="flex items-center justify-between p-4 bg-muted/50 rounded-lg border border-border">
                <div className="flex items-center space-x-4">
                  <div className={`w-12 h-12 bg-gradient-to-br ${getTypeColor(report.type)} rounded-lg flex items-center justify-center`}>
                    <BarChart3 className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-medium text-foreground">{report.title}</h3>
                    <p className="text-sm text-muted-foreground">{report.period}</p>
                    <div className="flex items-center space-x-2 mt-1">
                      <Badge className={getStatusColor(report.status)}>
                        {report.status}
                      </Badge>
                      <Badge variant="outline" className="text-muted-foreground border-border">
                        {report.type}
                      </Badge>
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">{report.date}</p>
                    <p className="text-sm text-muted-foreground">{report.downloads} downloads</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
                      <Download className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
                      <BarChart3 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-card border-border hover:border-primary/50 transition-colors">
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
                <BarChart3 className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">Financial Reports</h3>
                <p className="text-sm text-muted-foreground">Revenue, expenses, and financial analytics</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border hover:border-primary/50 transition-colors">
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-500 rounded-lg flex items-center justify-center">
                <Users className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">Member Analytics</h3>
                <p className="text-sm text-muted-foreground">Member activity and engagement metrics</p>
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
                <h3 className="font-semibold text-foreground">Performance Reports</h3>
                <p className="text-sm text-muted-foreground">Trainer and class performance metrics</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
