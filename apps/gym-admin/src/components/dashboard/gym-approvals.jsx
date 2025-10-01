import React, { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card"
import { Button } from "../ui/button"
import { Badge } from "../ui/badge"
import { Search, Check, X, Eye, MapPin, Phone, Mail, Building2, Users, Calendar } from "lucide-react"
import { Avatar, AvatarFallback } from "../ui/avatar"
import { Input } from "../ui/input"

const pendingApprovals = []

export function GymApprovals() {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedStatus, setSelectedStatus] = useState("all")
  const [selectedGym, setSelectedGym] = useState(null)
  const [approvals, setApprovals] = useState(pendingApprovals)

  useEffect(() => {
    let alive = true
    import("../../lib/api.js").then(({ listPendingGyms }) =>
      listPendingGyms()
        .then((data) => {
          if (!alive) return
          const mapped = (data || []).map((g) => ({
            id: g.id,
            gymName: g.name,
            owner: g.manager?.email || 'Owner',
            email: g.manager?.email || '-',
            phone: '-',
            address: g.address || '-',
            description: '—',
            memberCapacity: 0,
            facilities: Array.isArray(g.facilities) ? g.facilities : [],
            submittedDate: new Date().toISOString().slice(0,10),
            status: g.status || 'Pending',
            documents: [],
            avatar: (g.name || 'GY')[0] + (g.name || 'M')[1] || 'GY',
          }))
          setApprovals(mapped)
        })
        .catch(() => {})
    )
    return () => { alive = false }
  }, [])

  const filteredApprovals = approvals.filter(approval => {
    const matchesSearch = approval.gymName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         approval.owner.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = selectedStatus === "all" || approval.status === selectedStatus
    return matchesSearch && matchesStatus
  })

  const getStatusColor = (status) => {
    switch (status) {
      case "Pending": return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30"
      case "Under Review": return "bg-blue-500/20 text-blue-400 border-blue-500/30"
      case "Approved": return "bg-green-500/20 text-green-400 border-green-500/30"
      case "Rejected": return "bg-red-500/20 text-red-400 border-red-500/30"
      default: return "bg-slate-500/20 text-slate-400 border-slate-500/30"
    }
  }

  const handleApprove = (id) => {
    // Handle approval logic
    console.log("Approved gym:", id)
  }

  const handleReject = (id) => {
    // Handle rejection logic
    console.log("Rejected gym:", id)
  }

  const handleViewDetails = (gym) => {
    setSelectedGym(gym)
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white">Gym Approval Requests</h1>
        <p className="text-slate-400 mt-2">Review and manage gym partnership applications.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="bg-slate-900 border-slate-800">
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="p-3 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500">
                <Building2 className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-400">Pending</p>
                <p className="text-2xl font-bold text-white">{pendingApprovals.filter(a => a.status === "Pending").length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-900 border-slate-800">
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="p-3 rounded-full bg-gradient-to-br from-blue-400 to-purple-500">
                <Eye className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-400">Under Review</p>
                <p className="text-2xl font-bold text-white">{pendingApprovals.filter(a => a.status === "Under Review").length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-900 border-slate-800">
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="p-3 rounded-full bg-gradient-to-br from-green-400 to-blue-500">
                <Check className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-400">Approved This Month</p>
                <p className="text-2xl font-bold text-white">12</p>
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
                <p className="text-sm font-medium text-slate-400">Total Capacity</p>
                <p className="text-2xl font-bold text-white">{pendingApprovals.reduce((sum, a) => sum + a.memberCapacity, 0).toLocaleString()}</p>
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
            placeholder="Search gyms or owners..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-slate-800 border-slate-700 text-white placeholder-slate-400 focus:border-green-500 focus:ring-green-500"
          />
        </div>
        <div className="flex gap-2">
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-3 py-2 bg-slate-800 border border-slate-700 text-white rounded-md focus:border-green-500 focus:ring-green-500"
          >
            <option value="all">All Status</option>
            <option value="Pending">Pending</option>
            <option value="Under Review">Under Review</option>
            <option value="Approved">Approved</option>
            <option value="Rejected">Rejected</option>
          </select>
        </div>
      </div>

      {/* Gym Approvals List */}
      <div className="grid gap-6">
        {filteredApprovals.map((approval) => (
          <Card key={approval.id} className="bg-slate-900 border-slate-800 hover:border-green-500/30 transition-all duration-200">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-4">
                  <Avatar className="h-16 w-16">
                    <AvatarFallback className="bg-gradient-to-br from-green-400 to-blue-500 text-white text-lg">
                      {approval.avatar}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <CardTitle className="text-white text-xl">{approval.gymName}</CardTitle>
                    <CardDescription className="text-slate-400">
                      Owned by {approval.owner}
                    </CardDescription>
                    <div className="flex items-center space-x-4 mt-2">
                      <div className="flex items-center space-x-1 text-sm text-slate-400">
                        <MapPin className="w-4 h-4" />
                        <span>{approval.address}</span>
                      </div>
                      <div className="flex items-center space-x-1 text-sm text-slate-400">
                        <Users className="w-4 h-4" />
                        <span>{approval.memberCapacity} capacity</span>
                      </div>
                      <div className="flex items-center space-x-1 text-sm text-slate-400">
                        <Calendar className="w-4 h-4" />
                        <span>Submitted {approval.submittedDate}</span>
                      </div>
                    </div>
                  </div>
                </div>
                <Badge className={getStatusColor(approval.status)}>
                  {approval.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-slate-300">{approval.description}</p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium text-white mb-2">Contact Information</h4>
                  <div className="space-y-2 text-sm text-slate-400">
                    <div className="flex items-center space-x-2">
                      <Mail className="w-4 h-4" />
                      <span>{approval.email}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Phone className="w-4 h-4" />
                      <span>{approval.phone}</span>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-medium text-white mb-2">Facilities</h4>
                  <div className="flex flex-wrap gap-1">
                    {approval.facilities.map((facility, index) => (
                      <Badge key={index} variant="outline" className="text-xs border-slate-600 text-slate-300">
                        {facility}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-medium text-white mb-2">Required Documents</h4>
                <div className="flex flex-wrap gap-1">
                  {approval.documents.map((doc, index) => (
                    <Badge key={index} variant="outline" className="text-xs border-green-600 text-green-400">
                      ✓ {doc}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-slate-700">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleViewDetails(approval)}
                  className="border-slate-600 text-slate-300 hover:bg-slate-700"
                >
                  <Eye className="w-4 h-4 mr-2" />
                  View Details
                </Button>
                
                <div className="flex space-x-2">
                  <Button
                    size="sm"
                    onClick={() => handleReject(approval.id)}
                    variant="outline"
                    className="border-red-600 text-red-400 hover:bg-red-600/20"
                  >
                    <X className="w-4 h-4 mr-2" />
                    Reject
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => handleApprove(approval.id)}
                    className="bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600"
                  >
                    <Check className="w-4 h-4 mr-2" />
                    Approve
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredApprovals.length === 0 && (
        <Card className="bg-slate-900 border-slate-800">
          <CardContent className="p-12 text-center">
            <Building2 className="w-12 h-12 text-slate-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-white mb-2">No approval requests found</h3>
            <p className="text-slate-400">No gym applications match your current filters.</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
