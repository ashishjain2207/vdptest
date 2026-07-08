import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Button,
  Badge,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@imriva/framework';
import { FileText, Image, Video, MoreVertical, Eye, Trash2, Pin } from 'lucide-react';
import { useMemo, useState } from 'react';
import { LangText } from '@/components/ui/LangText';
import { useT } from '@/i18n';
import { ClearableSearchInput } from '@/components/ui/ClearableSearchInput';

const recentContent = [
  { id: '1', type: 'post', title: 'Q4 Market Analysis Report', author: 'Sarah Mitchell', views: 1234, date: '2h ago', status: 'published' },
  { id: '2', type: 'image', title: 'Property Photos - Downtown Loft', author: 'Marcus Chen', views: 567, date: '4h ago', status: 'published' },
  { id: '3', type: 'post', title: 'Investment Strategies for 2024', author: 'David Park', views: 890, date: '6h ago', status: 'draft' },
  { id: '4', type: 'video', title: 'Virtual Tour - Beach House', author: 'Elena Rodriguez', views: 2341, date: '1d ago', status: 'published' },
  { id: '5', type: 'post', title: 'Market Trends Analysis', author: 'Amanda Foster', views: 456, date: '2d ago', status: 'published' },
];

const StudioContent = () => {
  const t = useT();
  const [contentQuery, setContentQuery] = useState('');
  const filteredRecentContent = useMemo(() => {
    const q = contentQuery.trim().toLowerCase();
    if (!q) {
      return recentContent;
    }
    return recentContent.filter(
      (c) =>
        c.title.toLowerCase().includes(q) ||
        c.author.toLowerCase().includes(q) ||
        String(c.status).toLowerCase().includes(q),
    );
  }, [contentQuery]);
  return (
    <div className="space-y-6">
      {/* Search & Filters */}
      <div className="flex items-center gap-4">
        <ClearableSearchInput
          className="flex-1 max-w-md"
          placeholder={t('common.search_content')}
          value={contentQuery}
          onChange={(e) => setContentQuery(e.target.value)}
          clearAriaLabel={t('common.clearSearch')}
          dataTestId="studio-content-search"
        />
        <Button variant="outline"><LangText path="common.filters"  /></Button>
        <Button><LangText path="common.create_content"  /></Button>
      </div>

      {/* Content Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <FileText className="w-8 h-8 text-blue-500" />
              <div>
                <p className="text-2xl font-bold">1,234</p>
                <p className="text-sm text-muted-foreground"><LangText path="common.total_posts"  /></p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Image className="w-8 h-8 text-green-500" />
              <div>
                <p className="text-2xl font-bold">5,678</p>
                <p className="text-sm text-muted-foreground"><LangText path="common.images"  /></p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Video className="w-8 h-8 text-purple-500" />
              <div>
                <p className="text-2xl font-bold">234</p>
                <p className="text-sm text-muted-foreground"><LangText path="common.videos"  /></p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Eye className="w-8 h-8 text-orange-500" />
              <div>
                <p className="text-2xl font-bold">45.2K</p>
                <p className="text-sm text-muted-foreground"><LangText path="common.total_views"  /></p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Content List */}
      <Card>
        <CardHeader>
          <CardTitle><LangText path="common.content_management"  /></CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="all">
            <TabsList>
              <TabsTrigger value="all"><LangText path="common.all"  /></TabsTrigger>
              <TabsTrigger value="posts"><LangText path="layout.posts"  /></TabsTrigger>
              <TabsTrigger value="media"><LangText path="common.media"  /></TabsTrigger>
              <TabsTrigger value="drafts"><LangText path="common.drafts"  /></TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="mt-4">
              <div className="space-y-2">
                {filteredRecentContent.map((content) => (
                  <div key={content.id} className="flex items-center justify-between p-3 hover:bg-secondary/50 rounded-lg transition-colors">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                        content.type === 'post' ? 'bg-blue-100' :
                          content.type === 'image' ? 'bg-green-100' : 'bg-purple-100'
                      }`}>
                        {content.type === 'post' ? <FileText className="w-5 h-5 text-blue-600" /> :
                          content.type === 'image' ? <Image className="w-5 h-5 text-green-600" /> :
                            <Video className="w-5 h-5 text-purple-600" />}
                      </div>
                      <div>
                        <p className="font-medium text-foreground">{content.title}</p>
                        <p className="text-sm text-muted-foreground">by {content.author} · {content.date}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <Badge variant={content.status === 'published' ? 'default' : 'secondary'}>
                        {content.status === 'published' ? (t('common.published')) : (t('common.draft'))}
                      </Badge>
                      <span className="text-sm text-muted-foreground">{content.views} <LangText path="posts.views"  /></span>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" aria-label={t('common.pin_content')}><Pin className="w-4 h-4" /></Button>
                        <Button variant="ghost" size="icon" aria-label={t('common.delete_content')}><Trash2 className="w-4 h-4" /></Button>
                        <Button variant="ghost" size="icon" aria-label={t('common.content_actions')}><MoreVertical className="w-4 h-4" /></Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="posts" className="mt-4">
              <p className="text-center py-8 text-muted-foreground"><LangText path="common.posts_view"  /></p>
            </TabsContent>
            <TabsContent value="media" className="mt-4">
              <p className="text-center py-8 text-muted-foreground"><LangText path="common.media_view"  /></p>
            </TabsContent>
            <TabsContent value="drafts" className="mt-4">
              <p className="text-center py-8 text-muted-foreground"><LangText path="common.drafts_view"  /></p>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default StudioContent;
