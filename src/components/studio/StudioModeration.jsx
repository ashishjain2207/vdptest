import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Button,
  Badge,
  Avatar,
  AvatarFallback,
  AvatarImage,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@imriva/framework';
import { CheckCircle, XCircle, Eye, Flag, Clock } from 'lucide-react';

const pendingReports = [
  {
    id: '1',
    type: 'post',
    reason: 'Spam content',
    reporter: { name: 'John Doe', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150' },
    reported: { name: 'Suspicious User', content: 'Check out this amazing deal! Click here...' },
    timestamp: '2 hours ago',
    priority: 'high',
  },
  {
    id: '2',
    type: 'user',
    reason: 'Harassment',
    reporter: { name: 'Sarah Mitchell', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150' },
    reported: { name: 'Bad Actor', content: 'Multiple harassment complaints' },
    timestamp: '5 hours ago',
    priority: 'medium',
  },
  {
    id: '3',
    type: 'comment',
    reason: 'Inappropriate content',
    reporter: { name: 'Marcus Chen', avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150' },
    reported: { name: 'Random User', content: 'This comment contains offensive language...' },
    timestamp: '1 day ago',
    priority: 'low',
  },
];

const StudioModeration = () => {
  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
              <Clock className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">12</p>
              <p className="text-sm text-muted-foreground">Pending</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">156</p>
              <p className="text-sm text-muted-foreground">Resolved</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
              <XCircle className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">8</p>
              <p className="text-sm text-muted-foreground">Actions Taken</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Flag className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">24</p>
              <p className="text-sm text-muted-foreground">This Week</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Reports Queue */}
      <Card>
        <CardHeader>
          <CardTitle>Moderation Queue</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="pending">
            <TabsList>
              <TabsTrigger value="pending">Pending (12)</TabsTrigger>
              <TabsTrigger value="resolved">Resolved</TabsTrigger>
              <TabsTrigger value="escalated">Escalated</TabsTrigger>
            </TabsList>

            <TabsContent value="pending" className="mt-4 space-y-4">
              {pendingReports.map((report) => (
                <div key={report.id} className="p-4 border border-border rounded-lg space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-2 h-2 rounded-full ${
                        report.priority === 'high' ? 'bg-red-500' :
                          report.priority === 'medium' ? 'bg-yellow-500' : 'bg-gray-400'
                      }`} />
                      <Badge variant="outline">{report.type}</Badge>
                      <span className="text-sm font-medium text-foreground">{report.reason}</span>
                    </div>
                    <span className="text-xs text-muted-foreground">{report.timestamp}</span>
                  </div>

                  <div className="bg-secondary/50 p-3 rounded-lg">
                    <p className="text-sm text-muted-foreground mb-1">Reported content:</p>
                    <p className="text-sm text-foreground">{report.reported.content}</p>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Avatar className="w-6 h-6">
                        <AvatarImage src={report.reporter.avatar} />
                        <AvatarFallback>{report.reporter.name[0]}</AvatarFallback>
                      </Avatar>
                      Reported by {report.reporter.name}
                    </div>
                    <div className="flex gap-2">
                      <Button variant="ghost" size="sm">
                        <Eye className="w-4 h-4 mr-1" /> View
                      </Button>
                      <Button variant="outline" size="sm">Dismiss</Button>
                      <Button variant="destructive" size="sm">Take Action</Button>
                    </div>
                  </div>
                </div>
              ))}
            </TabsContent>

            <TabsContent value="resolved" className="mt-4">
              <p className="text-center py-8 text-muted-foreground">No resolved reports to show</p>
            </TabsContent>

            <TabsContent value="escalated" className="mt-4">
              <p className="text-center py-8 text-muted-foreground">No escalated reports</p>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default StudioModeration;
