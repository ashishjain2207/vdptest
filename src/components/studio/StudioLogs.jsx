import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Button,
  Badge,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@imriva/framework';
import { Download, RefreshCw } from 'lucide-react';
import { useMemo, useState } from 'react';
import { ClearableSearchInput } from '@/components/ui/ClearableSearchInput';

const logEntries = [
  { id: '1', timestamp: '2024-01-15 14:32:15', level: 'info', source: 'auth', message: 'User login successful: sarah.mitchell@email.com', ip: '192.168.1.1' },
  { id: '2', timestamp: '2024-01-15 14:31:45', level: 'warning', source: 'api', message: 'Rate limit approaching for client: vdp_live_abc123', ip: '10.0.0.45' },
  { id: '3', timestamp: '2024-01-15 14:30:22', level: 'error', source: 'database', message: 'Connection timeout after 30000ms', ip: 'internal' },
  { id: '4', timestamp: '2024-01-15 14:29:18', level: 'info', source: 'system', message: 'Scheduled backup completed successfully', ip: 'internal' },
  { id: '5', timestamp: '2024-01-15 14:28:45', level: 'info', source: 'auth', message: 'Password reset requested: user@example.com', ip: '172.16.0.12' },
  { id: '6', timestamp: '2024-01-15 14:27:30', level: 'debug', source: 'api', message: 'GET /api/v1/users - 200 OK (45ms)', ip: '192.168.1.50' },
  { id: '7', timestamp: '2024-01-15 14:26:15', level: 'warning', source: 'security', message: 'Multiple failed login attempts detected', ip: '203.0.113.42' },
  { id: '8', timestamp: '2024-01-15 14:25:00', level: 'info', source: 'webhook', message: 'Webhook delivered to https://external.app/callback', ip: 'internal' },
];

const getLevelColor = (level) => {
  switch (level) {
  case 'error': return 'bg-red-100 text-red-700';
  case 'warning': return 'bg-yellow-100 text-yellow-700';
  case 'info': return 'bg-blue-100 text-blue-700';
  case 'debug': return 'bg-gray-100 text-gray-700';
  default: return 'bg-gray-100 text-gray-700';
  }
};

const StudioLogs = () => {
  const [logQuery, setLogQuery] = useState('');
  const filteredLogEntries = useMemo(() => {
    const q = logQuery.trim().toLowerCase();
    if (!q) {
      return logEntries;
    }
    return logEntries.filter(
      (log) =>
        log.message.toLowerCase().includes(q) ||
        log.source.toLowerCase().includes(q) ||
        log.level.toLowerCase().includes(q) ||
        log.ip.toLowerCase().includes(q) ||
        log.timestamp.toLowerCase().includes(q),
    );
  }, [logQuery]);
  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex items-center gap-4 flex-wrap">
        <ClearableSearchInput
          className="flex-1 min-w-[200px] max-w-md"
          placeholder="Search logs..."
          value={logQuery}
          onChange={(e) => setLogQuery(e.target.value)}
          clearAriaLabel="Clear search"
          dataTestId="studio-logs-search"
        />
        <Select defaultValue="all">
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Level" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Levels</SelectItem>
            <SelectItem value="error">Error</SelectItem>
            <SelectItem value="warning">Warning</SelectItem>
            <SelectItem value="info">Info</SelectItem>
            <SelectItem value="debug">Debug</SelectItem>
          </SelectContent>
        </Select>
        <Select defaultValue="all">
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Source" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Sources</SelectItem>
            <SelectItem value="auth">Auth</SelectItem>
            <SelectItem value="api">API</SelectItem>
            <SelectItem value="database">Database</SelectItem>
            <SelectItem value="system">System</SelectItem>
          </SelectContent>
        </Select>
        <div className="flex gap-2 ml-auto">
          <Button variant="outline" size="icon" aria-label="Refresh logs">
            <RefreshCw className="w-4 h-4" />
          </Button>
          <Button variant="outline" className="gap-2">
            <Download className="w-4 h-4" />
            Export
          </Button>
        </div>
      </div>

      {/* Log Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold">12,456</p>
              <p className="text-sm text-muted-foreground">Total Logs</p>
            </div>
            <Badge variant="secondary">24h</Badge>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold text-red-600">23</p>
              <p className="text-sm text-muted-foreground">Errors</p>
            </div>
            <Badge variant="destructive">!</Badge>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold text-yellow-600">89</p>
              <p className="text-sm text-muted-foreground">Warnings</p>
            </div>
            <Badge variant="outline" className="text-yellow-600">⚠</Badge>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold text-green-600">99.2%</p>
              <p className="text-sm text-muted-foreground">Uptime</p>
            </div>
            <Badge className="bg-green-500">✓</Badge>
          </CardContent>
        </Card>
      </div>

      {/* Logs Table */}
      <Card>
        <CardHeader>
          <CardTitle>System Logs</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-2 font-medium text-muted-foreground">Timestamp</th>
                  <th className="text-left py-3 px-2 font-medium text-muted-foreground">Level</th>
                  <th className="text-left py-3 px-2 font-medium text-muted-foreground">Source</th>
                  <th className="text-left py-3 px-2 font-medium text-muted-foreground">Message</th>
                  <th className="text-left py-3 px-2 font-medium text-muted-foreground">IP</th>
                </tr>
              </thead>
              <tbody className="font-mono text-xs">
                {filteredLogEntries.map((log) => (
                  <tr key={log.id} className="border-b border-border hover:bg-secondary/30">
                    <td className="py-2 px-2 text-muted-foreground whitespace-nowrap">{log.timestamp}</td>
                    <td className="py-2 px-2">
                      <Badge variant="outline" className={getLevelColor(log.level)}>
                        {log.level.toUpperCase()}
                      </Badge>
                    </td>
                    <td className="py-2 px-2 text-muted-foreground">{log.source}</td>
                    <td className="py-2 px-2 text-foreground max-w-md truncate">{log.message}</td>
                    <td className="py-2 px-2 text-muted-foreground">{log.ip}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
            <p className="text-sm text-muted-foreground">Showing 8 of 12,456 logs</p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled>Previous</Button>
              <Button variant="outline" size="sm">Next</Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default StudioLogs;
