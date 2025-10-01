import React, { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card"
import { Button } from "../ui/button"
import { Input } from "../ui/input"
import { Badge } from "../ui/badge"
import { Search, Plus, MoreHorizontal, Edit, Trash2, Award, Users, Target } from "lucide-react"
import { Avatar, AvatarFallback } from "../ui/avatar"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "../ui/dropdown-menu"

const defaultBadges = [
  {
    id: 1,
    name: "Early Bird",
    description: "Complete 5 workouts before 7 AM",
    category: "Achievement",
    icon: "🌅",
    color: "from-yellow-400 to-orange-500",
    issuedCount: 156,
    requirements: "5 early morning workouts",
    createdAt: "2024-01-15"
  },
  {
    id: 2,
    name: "Challenge Master",
    description: "Complete 10 fitness challenges",
    category: "Challenge",
    icon: "🏆",
    color: "from-purple-400 to-pink-500",
    issuedCount: 89,
    requirements: "10 challenge completions",
    createdAt: "2024-01-20"
  },
  {
    id: 3,
    name: "Strength Warrior",
    description: "Lift 1000+ lbs in a single session",
    category: "Strength",
    icon: "💪",
    color: "from-red-400 to-red-600",
    issuedCount: 234,
    requirements: "1000+ lbs total lift",
    createdAt: "2024-02-01"
  },
  {
    id: 4,
    name: "Cardio King",
    description: "Run 50+ miles in a month",
    category: "Cardio",
    icon: "🏃",
    color: "from-green-400 to-blue-500",
    issuedCount: 67,
    requirements: "50+ miles monthly",
    createdAt: "2024-02-10"
  },
  {
    id: 5,
    name: "Consistency Champion",
    description: "Work out 30 days in a row",
    category: "Consistency",
    icon: "📅",
    color: "from-indigo-400 to-purple-500",
    issuedCount: 123,
    requirements: "30 consecutive days",
    createdAt: "2024-02-15"
  }
]

const recentIssuances = [
  {
    id: 1,
    badgeName: "Early Bird",
    userName: "Sarah Johnson",
    issuedAt: "2 minutes ago",
    avatar: "SJ"
  },
  {
    id: 2,
    badgeName: "Challenge Master",
    userName: "Mike Chen",
    issuedAt: "15 minutes ago",
    avatar: "MC"
  },
  {
    id: 3,
    badgeName: "Strength Warrior",
    userName: "Alex Rodriguez",
    issuedAt: "1 hour ago",
    avatar: "AR"
  },
  {
    id: 4,
    badgeName: "Cardio King",
    userName: "Emma Wilson",
    issuedAt: "2 hours ago",
    avatar: "EW"
  }
]

export function BadgeManager() {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [gyms, setGyms] = useState([])
  const [selectedGymId, setSelectedGymId] = useState("")
  const [badges, setBadges] = useState(defaultBadges)

  useEffect(() => {
    let alive = true
    import("../../lib/api.js").then(({ authHeaders }) =>
      fetch((import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api') + '/gyms/discover?page=1&limit=50', {
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
      })
        .then((r) => (r.ok ? r.json() : Promise.reject()))
        .then((json) => { if (alive) setGyms((json?.data?.gyms || []).filter((g) => g.status === 'approved')) })
        .catch(() => {})
    )
    return () => { alive = false }
  }, [])

  useEffect(() => {
    if (!selectedGymId) return
    let alive = true
    import("../../lib/api.js").then(({ authHeaders }) =>
      fetch((import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api') + `/gyms/profile/${selectedGymId}`, {
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
      })
        .then((r) => (r.ok ? r.json() : Promise.reject()))
        .then((json) => {
          if (!alive) return
          const b = Array.isArray(json?.data?.badges) ? json.data.badges : []
          setBadges(b.map((name, idx) => ({ id: idx + 1, name, description: '-', category: 'General', icon: '🏅', color: 'from-yellow-400 to-orange-500', issuedCount: 0, requirements: '-', createdAt: new Date().toISOString().slice(0,10) })))
        })
        .catch(() => {})
    )
    return () => { alive = false }
  }, [selectedGymId])

  const saveBadges = async () => {
    if (!selectedGymId) return
    const names = badges.map((b) => b.name)
    const { authHeaders } = await import("../../lib/api.js")
    await fetch((import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api') + `/admin/gyms/${selectedGymId}/badges`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify({ badges: names }),
    })
  }

  const filteredBadges = badges.filter(badge => {
    const matchesSearch = badge.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         badge.description.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = selectedCategory === "all" || badge.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  const getCategoryColor = (category) => {
    switch (category) {
      case "Achievement": return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30"
      case "Challenge": return "bg-purple-500/20 text-purple-400 border-purple-500/30"
      case "Strength": return "bg-red-500/20 text-red-400 border-red-500/30"
      case "Cardio": return "bg-green-500/20 text-green-400 border-green-500/30"
      case "Consistency": return "bg-indigo-500/20 text-indigo-400 border-indigo-500/30"
      default: return "bg-slate-500/20 text-slate-400 border-slate-500/30"
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white">Badge Manager</h1>
        <p className="text-slate-400 mt-2">Create and manage achievement badges to motivate your fitness community.</p>
      </div>
      <div className="flex items-center gap-3">
        <label className="text-sm text-slate-400">Gym:</label>
        <select value={selectedGymId} onChange={(e) => setSelectedGymId(e.target.value)} className="px-3 py-2 bg-slate-800 border border-slate-700 text-white rounded-md">
          <option value="">Select gym…</option>
          {gyms.map((g) => (
            <option key={g.id} value={g.id}>{g.name}</option>
          ))}
        </select>
        <Button onClick={saveBadges} className="bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600">Save</Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-slate-900 border-slate-800">
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="p-3 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500">
                <Award className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-400">Total Badges</p>
                <p className="text-2xl font-bold text-white">{badges.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-900 border-slate-800">
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="p-3 rounded-full bg-gradient-to-br from-green-400 to-blue-500">
                <Users className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-400">Total Issued</p>
                <p className="text-2xl font-bold text-white">{badges.reduce((sum, badge) => sum + badge.issuedCount, 0)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-900 border-slate-800">
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="p-3 rounded-full bg-gradient-to-br from-purple-400 to-pink-500">
                <Target className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-400">Active Categories</p>
                <p className="text-2xl font-bold text-white">{new Set(badges.map(b => b.category)).size}</p>
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
            placeholder="Search badges..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-slate-800 border-slate-700 text-white placeholder-slate-400 focus:border-green-500 focus:ring-green-500"
          />
        </div>
        <div className="flex gap-2">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-2 bg-slate-800 border border-slate-700 text-white rounded-md focus:border-green-500 focus:ring-green-500"
          >
            <option value="all">All Categories</option>
            <option value="Achievement">Achievement</option>
            <option value="Challenge">Challenge</option>
            <option value="Strength">Strength</option>
            <option value="Cardio">Cardio</option>
            <option value="Consistency">Consistency</option>
          </select>
          <Button className="bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600">
            <Plus className="w-4 h-4 mr-2" />
            Create Badge
          </Button>
        </div>
      </div>

      {/* Badges Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {filteredBadges.map((badge) => (
          <Card key={badge.id} className="bg-slate-900 border-slate-800 hover:border-green-500/30 transition-all duration-200">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${badge.color} flex items-center justify-center text-2xl`}>
                  {badge.icon}
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="text-slate-400 hover:text-white">
                      <MoreHorizontal className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-48 bg-slate-800 border-slate-700">
                    <DropdownMenuItem className="text-slate-300 hover:text-white hover:bg-slate-700">
                      <Edit className="w-4 h-4 mr-2" />
                      Edit Badge
                    </DropdownMenuItem>
                    <DropdownMenuItem className="text-slate-300 hover:text-white hover:bg-slate-700">
                      <Users className="w-4 h-4 mr-2" />
                      View Recipients
                    </DropdownMenuItem>
                    <DropdownMenuItem className="text-red-400 hover:text-red-300 hover:bg-slate-700">
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete Badge
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              <CardTitle className="text-white">{badge.name}</CardTitle>
              <CardDescription className="text-slate-400">{badge.description}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Badge className={getCategoryColor(badge.category)}>
                  {badge.category}
                </Badge>
                <span className="text-sm text-slate-400">{badge.issuedCount} issued</span>
              </div>
              <div className="text-sm text-slate-400">
                <p><strong>Requirements:</strong> {badge.requirements}</p>
                <p><strong>Created:</strong> {badge.createdAt}</p>
              </div>
              <div className="flex space-x-2">
                <Button size="sm" variant="outline" className="border-slate-600 text-slate-300 hover:bg-slate-700 flex-1">
                  Edit
                </Button>
                <Button size="sm" variant="outline" className="border-slate-600 text-slate-300 hover:bg-slate-700 flex-1">
                  Issue
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent Issuances */}
      <Card className="bg-slate-900 border-slate-800">
        <CardHeader>
          <CardTitle className="text-white">Recent Badge Issuances</CardTitle>
          <CardDescription className="text-slate-400">
            Latest badge awards across your fitness community
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentIssuances.map((issuance) => (
              <div key={issuance.id} className="flex items-center justify-between p-3 rounded-lg bg-slate-800/50">
                <div className="flex items-center space-x-3">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className="bg-gradient-to-br from-green-400 to-blue-500 text-white">
                      {issuance.avatar}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-medium text-white">
                      {issuance.userName} earned <span className="text-green-400">{issuance.badgeName}</span>
                    </p>
                    <p className="text-xs text-slate-400">{issuance.issuedAt}</p>
                  </div>
                </div>
                <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                  New
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
