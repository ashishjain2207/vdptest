import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@imriva/framework';
import {
  Users,
  MessageSquare,
  UserPlus,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

const statsCards = [
  {
    title: 'Active Users',
    value: '2,847',
    change: '+12.5%',
    trend: 'up',
    icon: Users,
    color: 'bg-blue-500',
  },
  {
    title: 'Posts Today',
    value: '1,234',
    change: '+8.2%',
    trend: 'up',
    icon: MessageSquare,
    color: 'bg-green-500',
  },
  {
    title: 'New Signups',
    value: '89',
    change: '-3.1%',
    trend: 'down',
    icon: UserPlus,
    color: 'bg-purple-500',
  },
  {
    title: 'Reports',
    value: '12',
    change: '+2',
    trend: 'up',
    icon: AlertTriangle,
    color: 'bg-orange-500',
  },
];

const activityData = [
  { name: 'Mon', users: 2400, posts: 1400 },
  { name: 'Tue', users: 1398, posts: 2210 },
  { name: 'Wed', users: 9800, posts: 2290 },
  { name: 'Thu', users: 3908, posts: 2000 },
  { name: 'Fri', users: 4800, posts: 2181 },
  { name: 'Sat', users: 3800, posts: 2500 },
  { name: 'Sun', users: 4300, posts: 2100 },
];

const userGrowthData = [
  { name: 'Jan', value: 4000 },
  { name: 'Feb', value: 4500 },
  { name: 'Mar', value: 5200 },
  { name: 'Apr', value: 4800 },
  { name: 'May', value: 6100 },
  { name: 'Jun', value: 7200 },
];

const contentTypeData = [
  { name: 'Text Posts', value: 45, color: '#10b981' },
  { name: 'Images', value: 30, color: '#3b82f6' },
  { name: 'Links', value: 15, color: '#8b5cf6' },
  { name: 'Videos', value: 10, color: '#f59e0b' },
];

const StudioDashboard = () => {
  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statsCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{stat.title}</p>
                    <p className="text-3xl font-bold text-foreground mt-1">{stat.value}</p>
                    <div className="flex items-center gap-1 mt-2">
                      {stat.trend === 'up' ? (
                        <TrendingUp className="w-4 h-4 text-green-500" />
                      ) : (
                        <TrendingDown className="w-4 h-4 text-red-500" />
                      )}
                      <span className={stat.trend === 'up' ? 'text-green-500 text-sm' : 'text-red-500 text-sm'}>
                        {stat.change}
                      </span>
                    </div>
                  </div>
                  <div className={`w-12 h-12 ${stat.color} rounded-xl flex items-center justify-center`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Activity Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Weekly Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={activityData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="name" className="text-xs" />
                  <YAxis className="text-xs" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }} 
                  />
                  <Area 
                    type="monotone" 
                    dataKey="users" 
                    stackId="1"
                    stroke="#3b82f6" 
                    fill="#3b82f6" 
                    fillOpacity={0.3}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="posts" 
                    stackId="2"
                    stroke="#10b981" 
                    fill="#10b981"
                    fillOpacity={0.3}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* User Growth Chart */}
        <Card>
          <CardHeader>
            <CardTitle>User Growth</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={userGrowthData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="name" className="text-xs" />
                  <YAxis className="text-xs" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }} 
                  />
                  <Bar dataKey="value" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Content Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Content Types</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={contentTypeData}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={80}
                    dataKey="value"
                  >
                    {contentTypeData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex flex-wrap gap-3 mt-4 justify-center">
              {contentTypeData.map((item) => (
                <div key={item.name} className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-xs text-muted-foreground">{item.name}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { action: 'New user registered', user: 'john.doe@email.com', time: '2 min ago', type: 'signup' },
                { action: 'Post flagged for review', user: 'Post #4521', time: '5 min ago', type: 'report' },
                { action: 'Organization created', user: 'PropTech Ventures', time: '12 min ago', type: 'org' },
                { action: 'User updated profile', user: 'sarah.mitchell', time: '18 min ago', type: 'update' },
                { action: 'New event published', user: 'Real Estate Summit 2024', time: '25 min ago', type: 'event' },
              ].map((activity, i) => (
                <div key={i} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${
                      activity.type === 'signup' ? 'bg-green-500' :
                        activity.type === 'report' ? 'bg-orange-500' :
                          activity.type === 'org' ? 'bg-blue-500' :
                            activity.type === 'event' ? 'bg-purple-500' :
                              'bg-gray-500'
                    }`} />
                    <div>
                      <p className="text-sm font-medium text-foreground">{activity.action}</p>
                      <p className="text-xs text-muted-foreground">{activity.user}</p>
                    </div>
                  </div>
                  <span className="text-xs text-muted-foreground">{activity.time}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default StudioDashboard;
