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
  Shield
} from "lucide-react"
import { Avatar, AvatarFallback } from "../ui/avatar"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "../ui/dropdown-menu"

const fallbackMembers = []

const fallbackTrainers = []

// Mock data for Gym Approvals
const gymApprovalsData = [
  {
    id: 1,
    gymName: "FitLife Center",
    owner: "John Smith",
    email: "john@fitlife.com",
    phone: "+1 (555) 777-8888",
    location: "Downtown District",
    status: "Pending",
    submittedDate: "2024-01-18",
    documents: "Complete",
    avatar: "FL"
  },
  {
    id: 2,
    gymName: "Elite Fitness",
    owner: "Sarah Brown",
    email: "sarah@elitefitness.com",
    phone: "+1 (555) 888-9999",
    location: "Westside Plaza",
    status: "Approved",
    submittedDate: "2024-01-15",
    documents: "Complete",
    avatar: "EF"
  },
  {
    id: 3,
    gymName: "PowerHouse Gym",
    owner: "Mike Johnson",
    email: "mike@powerhouse.com",
    phone: "+1 (555) 999-0000",
    location: "Eastside Mall",
    status: "Rejected",
    submittedDate: "2024-01-12",
    documents: "Incomplete",
    avatar: "PH"
  },
  {
    id: 4,
    gymName: "Wellness Studio",
    owner: "Lisa Davis",
    email: "lisa@wellness.com",
    phone: "+1 (555) 000-1111",
    location: "Northside Center",
    status: "Pending",
    submittedDate: "2024-01-20",
    documents: "Complete",
    avatar: "WS"
  },
  {
    id: 5,
    gymName: "Athletic Club",
    owner: "Tom Wilson",
    email: "tom@athletic.com",
    phone: "+1 (555) 111-2222",
    location: "Southside Complex",
    status: "Pending",
    submittedDate: "2024-01-19",
    documents: "Complete",
    avatar: "AC"
  }
]

export function UserManagement() {
  const [activeTab, setActiveTab] = useState("members")
  const [searchTerm, setSearchTerm] = useState("")
  const [filterStatus, setFilterStatus] = useState("all")
  const [members, setMembers] = useState(fallbackMembers)
  const [trainers, setTrainers] = useState(fallbackTrainers)

  useEffect(() => {
    let isMounted = true
    import("../../lib/api.js").then(({ listUsers }) =>
      Promise.all([
        listUsers({ page: 1, limit: 50, role: 'MEMBER' }),
        listUsers({ page: 1, limit: 50, role: 'TRAINER' }),
      ])
        .then(([m, t]) => {
          if (!isMounted) return
          const toMember = (u) => ({
            id: u.id,
            name: u.memberProfile?.name || u.email.split('@')[0],
            email: u.email,
            phone: u.memberProfile?.phone || '-',
            membership: u.memberProfile?.tier || 'Basic',
            status: 'Active',
            joinDate: new Date(u.createdAt).toISOString().slice(0, 10),
            lastVisit: new Date(u.createdAt).toISOString().slice(0, 10),
            avatar: (u.memberProfile?.name || u.email).slice(0, 2).toUpperCase(),
          })
          const toTrainer = (u) => ({
            id: u.id,
            name: u.trainerProfile?.name || u.email.split('@')[0],
            email: u.email,
            phone: u.trainerProfile?.phone || '-',
            specialty: u.trainerProfile?.bio || 'General Fitness',
            rating: 5,
            clients: 0,
            status: 'Active',
            experience: u.trainerProfile?.experience ? `${u.trainerProfile.experience} years` : '—',
            avatar: (u.trainerProfile?.name || u.email).slice(0, 2).toUpperCase(),
          })
          setMembers((m?.users || []).map(toMember))
          setTrainers((t?.users || []).map(toTrainer))
        })
        .catch(() => {})
    )
    return () => {
      isMounted = false
    }
  }, [])

  const tabs = [
    { id: "members", label: "Members", icon: UserCheck, count: members.length },
    { id: "trainers", label: "Trainers", icon: Dumbbell, count: trainers.length },
    { id: "gym-approvals", label: "Gym Approvals", icon: Building2, count: gymApprovalsData.length }
  ]

  const getStatusColor = (status) => {
    switch (status.toLowerCase()) {
      case "active":
      case "approved":
        return "bg-green-500/10 text-green-500 border-green-500/20"
      case "inactive":
      case "rejected":
        return "bg-red-500/10 text-red-500 border-red-500/20"
      case "pending":
        return "bg-yellow-500/10 text-yellow-500 border-yellow-500/20"
      default:
        return "bg-gray-500/10 text-gray-500 border-gray-500/20"
    }
  }

  const renderMembersTab = () => (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="bg-card border-border">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Members</p>
                 <p className="text-2xl font-bold text-foreground">{members.length}</p>
              </div>
              <UserCheck className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active Members</p>
                 <p className="text-2xl font-bold text-foreground">{members.filter(m => m.status === "Active").length}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Premium Members</p>
                 <p className="text-2xl font-bold text-foreground">{members.filter(m => m.membership === "Premium").length}</p>
              </div>
              <Crown className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">New This Month</p>
                 <p className="text-2xl font-bold text-foreground">{members.filter(m => new Date(m.joinDate) > new Date('2024-01-01')).length}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Members List */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-foreground">Members</CardTitle>
          <CardDescription className="text-muted-foreground">Manage gym members and their memberships</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {members.map((member) => (
              <div key={member.id} className="flex items-center justify-between p-4 bg-muted/50 rounded-lg border border-border">
                <div className="flex items-center space-x-4">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-500 text-white">
                      {member.avatar}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-medium text-foreground">{member.name}</h3>
                    <p className="text-sm text-muted-foreground">{member.email}</p>
                    <div className="flex items-center space-x-2 mt-1">
                      <Badge className={getStatusColor(member.status)}>
                        {member.status}
                      </Badge>
                      <Badge variant="outline" className="text-muted-foreground border-border">
                        {member.membership}
                      </Badge>
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
                    <Eye className="h-4 w-4" />
                  </Button>
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
                        <Phone className="h-4 w-4 mr-2" />
                        Call Member
                      </DropdownMenuItem>
                      <DropdownMenuItem className="text-foreground hover:bg-accent">
                        <Mail className="h-4 w-4 mr-2" />
                        Send Email
                      </DropdownMenuItem>
                      <DropdownMenuItem className="text-red-500 hover:bg-accent">
                        <Trash2 className="h-4 w-4 mr-2" />
                        Remove Member
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

  const renderTrainersTab = () => (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="bg-card border-border">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Trainers</p>
                 <p className="text-2xl font-bold text-foreground">{trainers.length}</p>
              </div>
              <Dumbbell className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active Trainers</p>
                 <p className="text-2xl font-bold text-foreground">{trainers.filter(t => t.status === "Active").length}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Avg Rating</p>
                <p className="text-2xl font-bold text-foreground">4.8</p>
              </div>
              <Star className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Clients</p>
                 <p className="text-2xl font-bold text-foreground">{trainers.reduce((sum, t) => sum + t.clients, 0)}</p>
              </div>
              <Users className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Trainers List */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-foreground">Trainers</CardTitle>
          <CardDescription className="text-muted-foreground">Manage fitness trainers and their specialties</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {trainers.map((trainer) => (
              <div key={trainer.id} className="flex items-center justify-between p-4 bg-muted/50 rounded-lg border border-border">
                <div className="flex items-center space-x-4">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className="bg-gradient-to-br from-green-500 to-blue-500 text-white">
                      {trainer.avatar}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-medium text-foreground">{trainer.name}</h3>
                    <p className="text-sm text-muted-foreground">{trainer.specialty}</p>
                    <div className="flex items-center space-x-2 mt-1">
                      <Badge className={getStatusColor(trainer.status)}>
                        {trainer.status}
                      </Badge>
                      <div className="flex items-center space-x-1">
                        <Star className="h-3 w-3 text-yellow-400 fill-current" />
                        <span className="text-sm text-muted-foreground">{trainer.rating}</span>
                      </div>
                      <Badge variant="outline" className="text-muted-foreground border-border">
                        {trainer.clients} clients
                      </Badge>
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
                    <Eye className="h-4 w-4" />
                  </Button>
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
                        <Calendar className="h-4 w-4 mr-2" />
                        View Schedule
                      </DropdownMenuItem>
                      <DropdownMenuItem className="text-foreground hover:bg-accent">
                        <Users className="h-4 w-4 mr-2" />
                        View Clients
                      </DropdownMenuItem>
                      <DropdownMenuItem className="text-red-500 hover:bg-accent">
                        <Trash2 className="h-4 w-4 mr-2" />
                        Remove Trainer
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

  const renderGymApprovalsTab = () => (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="bg-card border-border">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Requests</p>
                <p className="text-2xl font-bold text-foreground">{gymApprovalsData.length}</p>
              </div>
              <Building2 className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Pending</p>
                <p className="text-2xl font-bold text-foreground">{gymApprovalsData.filter(g => g.status === "Pending").length}</p>
              </div>
              <ClockIcon className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Approved</p>
                <p className="text-2xl font-bold text-foreground">{gymApprovalsData.filter(g => g.status === "Approved").length}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Rejected</p>
                <p className="text-2xl font-bold text-foreground">{gymApprovalsData.filter(g => g.status === "Rejected").length}</p>
              </div>
              <AlertCircle className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Gym Approvals List */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-foreground">Gym Approval Requests</CardTitle>
          <CardDescription className="text-muted-foreground">Review and manage gym partnership requests</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {gymApprovalsData.map((gym) => (
              <div key={gym.id} className="flex items-center justify-between p-4 bg-muted/50 rounded-lg border border-border">
                <div className="flex items-center space-x-4">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className="bg-gradient-to-br from-orange-500 to-red-500 text-white">
                      {gym.avatar}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-medium text-foreground">{gym.gymName}</h3>
                    <p className="text-sm text-muted-foreground">Owner: {gym.owner}</p>
                    <div className="flex items-center space-x-2 mt-1">
                      <Badge className={getStatusColor(gym.status)}>
                        {gym.status}
                      </Badge>
                      <Badge variant="outline" className="text-muted-foreground border-border">
                        {gym.documents}
                      </Badge>
                      <span className="text-sm text-muted-foreground">{gym.location}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
                    <Eye className="h-4 w-4" />
                  </Button>
                  {gym.status === "Pending" && (
                    <>
                      <Button variant="ghost" size="sm" className="text-green-500 hover:text-green-400">
                        <CheckCircle className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-400">
                        <AlertCircle className="h-4 w-4" />
                      </Button>
                    </>
                  )}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="bg-card border-border">
                      <DropdownMenuItem className="text-foreground hover:bg-accent">
                        <Shield className="h-4 w-4 mr-2" />
                        View Documents
                      </DropdownMenuItem>
                      <DropdownMenuItem className="text-foreground hover:bg-accent">
                        <Mail className="h-4 w-4 mr-2" />
                        Contact Owner
                      </DropdownMenuItem>
                      <DropdownMenuItem className="text-red-500 hover:bg-accent">
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete Request
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">User Management</h1>
          <p className="text-muted-foreground">Manage members, trainers, and gym partnerships</p>
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
            placeholder="Search users..."
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
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
          <option value="pending">Pending</option>
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

      {/* Tab Content */}
      <div className="mt-6">
        {activeTab === "members" && renderMembersTab()}
        {activeTab === "trainers" && renderTrainersTab()}
        {activeTab === "gym-approvals" && renderGymApprovalsTab()}
      </div>
    </div>
  )
}
