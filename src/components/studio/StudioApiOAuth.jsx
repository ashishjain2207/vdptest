import { useState } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Button,
  Input,
  Label,
  Textarea,
  Switch,
  Badge,
  Separator,
} from '@imriva/framework';
import { Key, Plus, Copy, Eye, EyeOff, Trash2, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { useT, useTParams } from '@/i18n';

const existingApps = [
  {
    id: '1',
    name: 'Mobile App',
    clientId: 'vdp_live_abc123xyz789',
    created: '2024-01-15',
    status: 'active',
    scopes: ['read', 'write', 'profile'],
  },
  {
    id: '2',
    name: 'Analytics Dashboard',
    clientId: 'vdp_live_def456uvw012',
    created: '2024-02-20',
    status: 'active',
    scopes: ['read', 'analytics'],
  },
];

const StudioApiOAuth = () => {
  const t = useT();
  const tr = useTParams();
  const [showSecrets, setShowSecrets] = useState({});
  const [newAppName, setNewAppName] = useState('');
  const [redirectUri, setRedirectUri] = useState('');
  const [description, setDescription] = useState('');

  const toggleSecret = (id) => {
    setShowSecrets(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success(t('toasts.copiedToClipboard'));
  };

  const handleCreateApp = () => {
    if (!newAppName.trim()) {
      toast.error(t('toasts.enterAppName'));
      return;
    }
    toast.success(tr('toasts.oauthAppWouldBeCreated', { name: newAppName }));
    setNewAppName('');
    setRedirectUri('');
    setDescription('');
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* API Keys Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="w-5 h-5" />
            API Configuration
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label>API Base URL</Label>
              <div className="flex gap-2">
                <Input
                  readOnly
                  value="https://api.vdpconnect.com/v1"
                  className="font-mono text-sm"
                />
                <Button variant="outline" size="icon" onClick={() => copyToClipboard('https://api.vdpconnect.com/v1')} aria-label="Copy API base URL">
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Webhook URL</Label>
              <div className="flex gap-2">
                <Input
                  readOnly
                  value="https://api.vdpconnect.com/webhooks"
                  className="font-mono text-sm"
                />
                <Button variant="outline" size="icon" onClick={() => copyToClipboard('https://api.vdpconnect.com/webhooks')} aria-label="Copy webhook URL">
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>

          <Separator />

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="font-medium text-foreground">Rate Limiting</p>
              <Switch defaultChecked />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Requests per minute</Label>
                <Input type="number" defaultValue="60" />
              </div>
              <div className="space-y-2">
                <Label>Requests per hour</Label>
                <Input type="number" defaultValue="1000" />
              </div>
              <div className="space-y-2">
                <Label>Requests per day</Label>
                <Input type="number" defaultValue="10000" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* OAuth Apps */}
      <Card>
        <CardHeader>
          <CardTitle>OAuth Applications</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {existingApps.map((app) => (
            <div key={app.id} className="p-4 border border-border rounded-lg space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                    <Key className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">{app.name}</p>
                    <p className="text-xs text-muted-foreground">Created {app.created}</p>
                  </div>
                </div>
                <Badge variant={app.status === 'active' ? 'default' : 'secondary'}>
                  {app.status}
                </Badge>
              </div>

              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Client ID</Label>
                <div className="flex gap-2">
                  <Input
                    readOnly
                    value={showSecrets[app.id] ? app.clientId : '•'.repeat(24)}
                    className="font-mono text-sm"
                  />
                  <Button variant="outline" size="icon" onClick={() => toggleSecret(app.id)} aria-label={showSecrets[app.id] ? 'Hide client ID' : 'Show client ID'}>
                    {showSecrets[app.id] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </Button>
                  <Button variant="outline" size="icon" onClick={() => copyToClipboard(app.clientId)} aria-label="Copy client ID">
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex gap-2">
                  {app.scopes.map((scope) => (
                    <Badge key={scope} variant="outline" className="text-xs">
                      {scope}
                    </Badge>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm" className="gap-1">
                    <RefreshCw className="w-3 h-3" />
                    Rotate
                  </Button>
                  <Button variant="ghost" size="sm" className="text-destructive gap-1">
                    <Trash2 className="w-3 h-3" />
                    Revoke
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Create New App */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="w-5 h-5" />
            Create OAuth Application
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="app-name">Application Name *</Label>
            <Input
              id="app-name"
              value={newAppName}
              onChange={(e) => setNewAppName(e.target.value)}
              placeholder="My Application"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="redirect-uri">Redirect URI</Label>
            <Input
              id="redirect-uri"
              value={redirectUri}
              onChange={(e) => setRedirectUri(e.target.value)}
              placeholder="https://myapp.com/callback"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="app-description">Description</Label>
            <Textarea
              id="app-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="Describe what your application does..."
            />
          </div>

          <div className="space-y-3">
            <Label>Scopes</Label>
            <div className="flex flex-wrap gap-3">
              {['read', 'write', 'profile', 'analytics', 'admin'].map((scope) => (
                <label key={scope} className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" className="rounded" defaultChecked={scope === 'read'} />
                  <span className="text-sm">{scope}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="flex justify-end">
            <Button onClick={handleCreateApp} className="gap-2">
              <Plus className="w-4 h-4" />
              Create Application
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default StudioApiOAuth;
