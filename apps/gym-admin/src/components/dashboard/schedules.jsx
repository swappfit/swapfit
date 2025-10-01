import React, { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card"
import { Button } from "../ui/button"
import { Badge } from "../ui/badge"
import { 
  Calendar, 
  Clock, 
  Users, 
  MapPin, 
  Plus,
  Edit,
  Trash2,
  MoreHorizontal,
  CheckCircle,
  AlertCircle,
  User,
  Dumbbell,
  Music,
  Heart,
  Zap
} from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "../ui/dropdown-menu"

const scheduleData = []

const getTypeIcon = (type) => {
  switch (type.toLowerCase()) {
    case "yoga":
      return Heart
    case "cardio":
    case "hiit":
      return Zap
    case "strength":
      return Dumbbell
    case "dance":
    case "zumba":
      return Music
    default:
      return User
  }
}

const getTypeColor = (type) => {
  switch (type.toLowerCase()) {
    case "yoga":
      return "from-purple-500 to-pink-500"
    case "cardio":
    case "hiit":
      return "from-orange-500 to-red-500"
    case "strength":
      return "from-blue-500 to-indigo-500"
    case "dance":
    case "zumba":
      return "from-pink-500 to-purple-500"
    case "crossfit":
      return "from-green-500 to-emerald-500"
    default:
      return "from-gray-500 to-gray-600"
  }
}

const getStatusColor = (status) => {
  switch (status.toLowerCase()) {
    case "active":
      return "bg-green-500/10 text-green-500 border-green-500/20"
    case "full":
      return "bg-blue-500/10 text-blue-500 border-blue-500/20"
    case "cancelled":
      return "bg-red-500/10 text-red-500 border-red-500/20"
    default:
      return "bg-gray-500/10 text-gray-500 border-gray-500/20"
  }
}

export function Schedules() {
  const [selectedDay, setSelectedDay] = useState("Monday")
  const [items, setItems] = useState(scheduleData)

  useEffect(() => {
    let alive = true
    import("../../lib/api.js").then(({ listSchedules }) =>
      listSchedules()
        .then((data) => { if (alive) setItems(data || []) })
        .catch(() => {})
    )
    return () => { alive = false }
  }, [])

  const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
  const filteredSchedule = items.filter(item => item.day === selectedDay)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Class Schedules</h1>
          <p className="text-muted-foreground">Manage gym classes, trainers, and booking schedules</p>
        </div>
        <Button className="bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white">
          <Plus className="h-4 w-4 mr-2" />
          Add New Class
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="bg-card border-border">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Classes</p>
                 <p className="text-2xl font-bold text-foreground">{items.length}</p>
              </div>
              <Calendar className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active Classes</p>
                 <p className="text-2xl font-bold text-foreground">{items.filter(s => s.status === "Active").length}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Full Classes</p>
                 <p className="text-2xl font-bold text-foreground">{items.filter(s => s.status === "Full").length}</p>
              </div>
              <AlertCircle className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Enrollments</p>
                 <p className="text-2xl font-bold text-foreground">{items.reduce((sum, s) => sum + (s.enrolled || 0), 0)}</p>
              </div>
              <Users className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Day Selector */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-foreground">Weekly Schedule</CardTitle>
          <CardDescription className="text-muted-foreground">Select a day to view class schedules</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2 mb-6">
            {days.map((day) => (
              <Button
                key={day}
                variant={selectedDay === day ? "default" : "outline"}
                onClick={() => setSelectedDay(day)}
                className={selectedDay === day ? "bg-green-500 hover:bg-green-600" : "border-border text-muted-foreground hover:text-foreground"}
              >
                {day}
              </Button>
            ))}
          </div>

          {/* Schedule for Selected Day */}
          <div className="space-y-4">
            {filteredSchedule.length > 0 ? (
              filteredSchedule.map((classItem) => {
                const TypeIcon = getTypeIcon(classItem.type)
                return (
                  <div key={classItem.id} className="flex items-center justify-between p-4 bg-muted/50 rounded-lg border border-border">
                    <div className="flex items-center space-x-4">
                      <div className={`w-12 h-12 bg-gradient-to-br ${getTypeColor(classItem.type)} rounded-lg flex items-center justify-center`}>
                        <TypeIcon className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <h3 className="font-medium text-foreground">{classItem.className}</h3>
                        <p className="text-sm text-muted-foreground">Trainer: {classItem.trainer}</p>
                        <div className="flex items-center space-x-4 mt-1">
                          <div className="flex items-center space-x-1">
                            <Clock className="h-3 w-3 text-muted-foreground" />
                            <span className="text-sm text-muted-foreground">{classItem.startTime || classItem.time?.split(' - ')[0]} - {classItem.endTime || classItem.time?.split(' - ')[1]}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <MapPin className="h-3 w-3 text-muted-foreground" />
                            <span className="text-sm text-muted-foreground">{classItem.location}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Users className="h-3 w-3 text-muted-foreground" />
                            <span className="text-sm text-muted-foreground">{classItem.enrolled}/{classItem.capacity}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge className={getStatusColor(classItem.status)}>
                        {classItem.status}
                      </Badge>
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
                            View Enrollments
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-foreground hover:bg-accent">
                            <Calendar className="h-4 w-4 mr-2" />
                            Edit Schedule
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-red-500 hover:bg-accent">
                            <Trash2 className="h-4 w-4 mr-2" />
                            Cancel Class
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                )
              })
            ) : (
              <div className="text-center py-8">
                <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium text-foreground mb-2">No classes scheduled</h3>
                <p className="text-muted-foreground">No classes are scheduled for {selectedDay}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-card border-border hover:border-primary/50 transition-colors">
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
                <Calendar className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">Create Class</h3>
                <p className="text-sm text-muted-foreground">Schedule a new fitness class</p>
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
                <h3 className="font-semibold text-foreground">Manage Trainers</h3>
                <p className="text-sm text-muted-foreground">Assign trainers to classes</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border hover:border-primary/50 transition-colors">
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-500 rounded-lg flex items-center justify-center">
                <Clock className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">Booking System</h3>
                <p className="text-sm text-muted-foreground">Manage class bookings</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
