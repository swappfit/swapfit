import React, { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card"
import { Button } from "../ui/button"
import { Input } from "../ui/input"
import { Badge } from "../ui/badge"
import { Switch } from "../ui/switch"
import { 
  Settings, 
  User, 
  Shield, 
  Bell, 
  Palette, 
  Database, 
  Globe, 
  CreditCard,
  Save,
  Eye,
  EyeOff,
  Key,
  Mail,
  Phone,
  Building2,
  Users,
  Target,
  Award
} from "lucide-react"
import { Avatar, AvatarFallback } from "../ui/avatar"

export function SettingsPage() {
  const [activeTab, setActiveTab] = useState("profile")
  const [showPassword, setShowPassword] = useState(false)
  const [notifications, setNotifications] = useState({
    email: true,
    push: true,
    sms: false,
    challenges: true,
    achievements: true,
    maintenance: true
  })

  const tabs = [
    { id: "profile", label: "Profile", icon: User },
    { id: "security", label: "Security", icon: Shield },
    { id: "notifications", label: "Notifications", icon: Bell },
    { id: "appearance", label: "Appearance", icon: Palette },
    { id: "integrations", label: "Integrations", icon: Database },
    { id: "billing", label: "Billing", icon: CreditCard }
  ]

  const renderProfileTab = () => (
    <div className="space-y-6">
      <Card className="bg-slate-900 border-slate-800">
        <CardHeader>
          <CardTitle className="text-white">Profile Information</CardTitle>
          <CardDescription className="text-slate-400">
            Update your account profile and personal information
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center space-x-4">
            <Avatar className="h-20 w-20">
              <AvatarFallback className="bg-gradient-to-br from-green-400 to-blue-500 text-white text-xl">
                AJ
              </AvatarFallback>
            </Avatar>
            <div>
              <Button variant="outline" className="border-slate-600 text-slate-300 hover:bg-slate-700">
                Change Avatar
              </Button>
              <p className="text-sm text-slate-400 mt-1">JPG, PNG or GIF. Max size 2MB.</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-white">First Name</label>
              <Input 
                defaultValue="Alex" 
                className="mt-1 bg-slate-800 border-slate-700 text-white focus:border-green-500"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-white">Last Name</label>
              <Input 
                defaultValue="Johnson" 
                className="mt-1 bg-slate-800 border-slate-700 text-white focus:border-green-500"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-white">Email</label>
              <Input 
                defaultValue="alex.johnson@example.com" 
                type="email"
                className="mt-1 bg-slate-800 border-slate-700 text-white focus:border-green-500"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-white">Phone</label>
              <Input 
                defaultValue="+1 (555) 123-4567" 
                className="mt-1 bg-slate-800 border-slate-700 text-white focus:border-green-500"
              />
            </div>
            <div className="md:col-span-2">
              <label className="text-sm font-medium text-white">Bio</label>
              <textarea 
                defaultValue="Fitness enthusiast and gym administrator with 5+ years of experience in health and wellness management."
                rows={3}
                className="mt-1 w-full bg-slate-800 border border-slate-700 text-white rounded-md px-3 py-2 focus:border-green-500 focus:ring-green-500"
              />
            </div>
          </div>
          
          <div className="flex justify-end">
            <Button className="bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600">
              <Save className="w-4 h-4 mr-2" />
              Save Changes
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )

  const renderSecurityTab = () => (
    <div className="space-y-6">
      <Card className="bg-slate-900 border-slate-800">
        <CardHeader>
          <CardTitle className="text-white">Change Password</CardTitle>
          <CardDescription className="text-slate-400">
            Update your password to keep your account secure
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium text-white">Current Password</label>
            <div className="relative mt-1">
              <Input 
                type={showPassword ? "text" : "password"}
                className="bg-slate-800 border-slate-700 text-white focus:border-green-500 pr-10"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff className="h-4 w-4 text-slate-400" /> : <Eye className="h-4 w-4 text-slate-400" />}
              </Button>
            </div>
          </div>
          <div>
            <label className="text-sm font-medium text-white">New Password</label>
            <Input 
              type="password"
              className="mt-1 bg-slate-800 border-slate-700 text-white focus:border-green-500"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-white">Confirm New Password</label>
            <Input 
              type="password"
              className="mt-1 bg-slate-800 border-slate-700 text-white focus:border-green-500"
            />
          </div>
          <Button className="bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600">
            <Key className="w-4 h-4 mr-2" />
            Update Password
          </Button>
        </CardContent>
      </Card>

      <Card className="bg-slate-900 border-slate-800">
        <CardHeader>
          <CardTitle className="text-white">Two-Factor Authentication</CardTitle>
          <CardDescription className="text-slate-400">
            Add an extra layer of security to your account
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium text-white">SMS Authentication</h4>
              <p className="text-sm text-slate-400">Receive codes via SMS</p>
            </div>
            <Switch />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium text-white">Email Authentication</h4>
              <p className="text-sm text-slate-400">Receive codes via email</p>
            </div>
            <Switch />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium text-white">Authenticator App</h4>
              <p className="text-sm text-slate-400">Use Google Authenticator or similar</p>
            </div>
            <Switch />
          </div>
        </CardContent>
      </Card>
    </div>
  )

  const renderNotificationsTab = () => (
    <div className="space-y-6">
      <Card className="bg-slate-900 border-slate-800">
        <CardHeader>
          <CardTitle className="text-white">Notification Preferences</CardTitle>
          <CardDescription className="text-slate-400">
            Choose how you want to receive notifications
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <h4 className="font-medium text-white">Notification Channels</h4>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Mail className="w-5 h-5 text-slate-400" />
                  <span className="text-white">Email Notifications</span>
                </div>
                <Switch 
                  checked={notifications.email}
                  onCheckedChange={(checked) => setNotifications({...notifications, email: checked})}
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Bell className="w-5 h-5 text-slate-400" />
                  <span className="text-white">Push Notifications</span>
                </div>
                <Switch 
                  checked={notifications.push}
                  onCheckedChange={(checked) => setNotifications({...notifications, push: checked})}
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Phone className="w-5 h-5 text-slate-400" />
                  <span className="text-white">SMS Notifications</span>
                </div>
                <Switch 
                  checked={notifications.sms}
                  onCheckedChange={(checked) => setNotifications({...notifications, sms: checked})}
                />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="font-medium text-white">Notification Types</h4>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Target className="w-5 h-5 text-green-400" />
                  <span className="text-white">Challenge Updates</span>
                </div>
                <Switch 
                  checked={notifications.challenges}
                  onCheckedChange={(checked) => setNotifications({...notifications, challenges: checked})}
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Award className="w-5 h-5 text-purple-400" />
                  <span className="text-white">Achievement Alerts</span>
                </div>
                <Switch 
                  checked={notifications.achievements}
                  onCheckedChange={(checked) => setNotifications({...notifications, achievements: checked})}
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Building2 className="w-5 h-5 text-yellow-400" />
                  <span className="text-white">Maintenance Notices</span>
                </div>
                <Switch 
                  checked={notifications.maintenance}
                  onCheckedChange={(checked) => setNotifications({...notifications, maintenance: checked})}
                />
              </div>
            </div>
          </div>

          <Button className="bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600">
            <Save className="w-4 h-4 mr-2" />
            Save Preferences
          </Button>
        </CardContent>
      </Card>
    </div>
  )

  const renderAppearanceTab = () => (
    <div className="space-y-6">
      <Card className="bg-slate-900 border-slate-800">
        <CardHeader>
          <CardTitle className="text-white">Theme Settings</CardTitle>
          <CardDescription className="text-slate-400">
            Customize the appearance of your dashboard
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <h4 className="font-medium text-white">Color Theme</h4>
            <div className="grid grid-cols-3 gap-4">
              <div className="p-4 rounded-lg bg-slate-800 border-2 border-green-500 cursor-pointer">
                <div className="w-full h-8 bg-gradient-to-r from-green-400 to-blue-500 rounded mb-2"></div>
                <p className="text-sm text-white text-center">Default</p>
              </div>
              <div className="p-4 rounded-lg bg-slate-800 border border-slate-700 cursor-pointer hover:border-slate-600">
                <div className="w-full h-8 bg-gradient-to-r from-purple-400 to-pink-500 rounded mb-2"></div>
                <p className="text-sm text-white text-center">Purple</p>
              </div>
              <div className="p-4 rounded-lg bg-slate-800 border border-slate-700 cursor-pointer hover:border-slate-600">
                <div className="w-full h-8 bg-gradient-to-r from-orange-400 to-red-500 rounded mb-2"></div>
                <p className="text-sm text-white text-center">Orange</p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="font-medium text-white">Display Options</h4>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-white">Compact Mode</span>
                <Switch />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-white">Show Animations</span>
                <Switch />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-white">Auto-refresh Data</span>
                <Switch />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )

  const renderIntegrationsTab = () => (
    <div className="space-y-6">
      <Card className="bg-slate-900 border-slate-800">
        <CardHeader>
          <CardTitle className="text-white">Connected Services</CardTitle>
          <CardDescription className="text-slate-400">
            Manage your third-party integrations
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 rounded-lg bg-slate-800/50">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
                <Globe className="w-5 h-5 text-white" />
              </div>
              <div>
                <h4 className="font-medium text-white">Google Analytics</h4>
                <p className="text-sm text-slate-400">Connected • Last sync 2 hours ago</p>
              </div>
            </div>
            <Button variant="outline" size="sm" className="border-red-600 text-red-400 hover:bg-red-600/20">
              Disconnect
            </Button>
          </div>

          <div className="flex items-center justify-between p-4 rounded-lg bg-slate-800/50">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center">
                <Mail className="w-5 h-5 text-white" />
              </div>
              <div>
                <h4 className="font-medium text-white">Mailchimp</h4>
                <p className="text-sm text-slate-400">Connected • Last sync 1 day ago</p>
              </div>
            </div>
            <Button variant="outline" size="sm" className="border-red-600 text-red-400 hover:bg-red-600/20">
              Disconnect
            </Button>
          </div>

          <div className="flex items-center justify-between p-4 rounded-lg bg-slate-800/50">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-purple-500 rounded-lg flex items-center justify-center">
                <Users className="w-5 h-5 text-white" />
              </div>
              <div>
                <h4 className="font-medium text-white">Slack</h4>
                <p className="text-sm text-slate-400">Not connected</p>
              </div>
            </div>
            <Button size="sm" className="bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600">
              Connect
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )

  const renderBillingTab = () => (
    <div className="space-y-6">
      <Card className="bg-slate-900 border-slate-800">
        <CardHeader>
          <CardTitle className="text-white">Current Plan</CardTitle>
          <CardDescription className="text-slate-400">
            Manage your subscription and billing information
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="p-6 rounded-lg bg-gradient-to-r from-green-500/20 to-blue-500/20 border border-green-500/30">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-white">Pro Plan</h3>
                <p className="text-slate-300">$99/month</p>
                <p className="text-sm text-slate-400 mt-1">Next billing: February 1, 2024</p>
              </div>
              <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                Active
              </Badge>
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="font-medium text-white">Plan Features</h4>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                <span className="text-slate-300">Unlimited gym members</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                <span className="text-slate-300">Advanced analytics</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                <span className="text-slate-300">Priority support</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                <span className="text-slate-300">Custom integrations</span>
              </div>
            </div>
          </div>

          <div className="flex space-x-3">
            <Button variant="outline" className="border-slate-600 text-slate-300 hover:bg-slate-700">
              Change Plan
            </Button>
            <Button variant="outline" className="border-slate-600 text-slate-300 hover:bg-slate-700">
              View Invoices
            </Button>
            <Button variant="outline" className="border-red-600 text-red-400 hover:bg-red-600/20">
              Cancel Subscription
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )

  const renderTabContent = () => {
    switch (activeTab) {
      case "profile": return renderProfileTab()
      case "security": return renderSecurityTab()
      case "notifications": return renderNotificationsTab()
      case "appearance": return renderAppearanceTab()
      case "integrations": return renderIntegrationsTab()
      case "billing": return renderBillingTab()
      default: return renderProfileTab()
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white">Settings</h1>
        <p className="text-slate-400 mt-2">Manage your account settings and preferences.</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Sidebar */}
        <div className="lg:w-64">
          <Card className="bg-slate-900 border-slate-800">
            <CardContent className="p-4">
              <nav className="space-y-2">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center space-x-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      activeTab === tab.id
                        ? "bg-gradient-to-r from-green-500/20 to-blue-500/20 text-green-400 border border-green-500/30"
                        : "text-slate-400 hover:text-white hover:bg-slate-800"
                    }`}
                  >
                    <tab.icon className="w-4 h-4" />
                    <span>{tab.label}</span>
                  </button>
                ))}
              </nav>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="flex-1">
          {renderTabContent()}
        </div>
      </div>
    </div>
  )
}
