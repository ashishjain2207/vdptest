import { Heart, MessageCircle, Repeat2, Share, ExternalLink, Linkedin, BadgeCheck } from 'lucide-react';
import { Avatar, AvatarImage, AvatarFallback, Button, Badge } from '@imriva/framework';
import { cn } from '@/lib/utils';
import { useState } from 'react';

export function LinkedInPostCard({ post }) {
  const [isExpanded, setIsExpanded] = useState(false);

  const formatNumber = (num) => {
    if (num >= 1000) {
      return `${(num / 1000).toFixed(1)  }K`;
    }
    return num.toString();
  };

  const sourceConfig = {
    vdpResearch: {
      label: 'vdpResearch LinkedIn',
      color: 'bg-[#0A66C2]/10 text-[#0A66C2] border-[#0A66C2]/20',
    },
    HypZert: {
      label: 'HypZert LinkedIn',
      color: 'bg-[#0A66C2]/10 text-[#0A66C2] border-[#0A66C2]/20',
    },
  };

  const config = sourceConfig[post.source];

  return (
    <article className="bg-card rounded-xl border border-border overflow-hidden animate-fade-in">
      {/* Integration Label */}
      <div className="bg-muted/50 px-4 py-2 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Linkedin className="w-4 h-4 text-[#0A66C2]" />
          <span className="text-xs font-medium text-muted-foreground">
            Beispiel: LinkedIn-Integration in vdpConnect
          </span>
        </div>
        <Badge variant="outline" className={cn('text-xs', config.color)}>
          {config.label}
        </Badge>
      </div>

      {/* Post Content */}
      <div className="p-4">
        <div className="flex gap-3">
          {/* Avatar */}
          <Avatar className="w-11 h-11 flex-shrink-0">
            <AvatarImage src={post.author.avatar} alt={post.author.name} />
            <AvatarFallback>{post.author.name.slice(0, 2)}</AvatarFallback>
          </Avatar>

          {/* Content */}
          <div className="flex-1 min-w-0">
            {/* Header */}
            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="flex items-center gap-1">
                  <span className="font-semibold text-foreground">
                    {post.author.name}
                  </span>
                  <BadgeCheck className="w-4 h-4 text-[#0A66C2] fill-[#0A66C2]/20" />
                </div>
                <p className="text-xs text-muted-foreground">{post.author.role}</p>
                <p className="text-xs text-muted-foreground">{post.timestamp}</p>
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                className="gap-1.5 text-xs border-[#0A66C2]/30 text-[#0A66C2] hover:bg-[#0A66C2]/10"
              >
                <ExternalLink className="w-3 h-3" />
                Auf LinkedIn ansehen
              </Button>
            </div>

            {/* Post Content */}
            <div className="mt-3">
              <p className={cn(
                'text-foreground whitespace-pre-wrap break-words leading-relaxed text-sm',
                !isExpanded && 'line-clamp-4',
              )}>
                {post.content}
              </p>
              {post.content.length > 280 && (
                <button 
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="text-primary text-sm font-medium hover:underline mt-1"
                >
                  {isExpanded ? 'Weniger anzeigen' : 'Mehr anzeigen'}
                </button>
              )}
            </div>

            {/* Image */}
            {post.image && (
              <div className="mt-3 rounded-lg overflow-hidden border border-border">
                <img 
                  src={post.image} 
                  alt="LinkedIn post" 
                  className="w-full h-auto object-cover max-h-64"
                  loading="lazy"
                />
              </div>
            )}

            {/* LinkedIn-style engagement */}
            <div className="mt-3 pt-2 border-t border-border">
              <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
                <span>{formatNumber(post.likes)} Reaktionen</span>
                <span>{formatNumber(post.comments)} Kommentare · {formatNumber(post.reposts)} Reposts</span>
              </div>
              <div className="flex items-center justify-around -mx-2">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="gap-1.5 text-muted-foreground hover:text-foreground hover:bg-muted flex-1"
                >
                  <Heart className="w-4 h-4" />
                  <span className="text-xs">Gefällt mir</span>
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="gap-1.5 text-muted-foreground hover:text-foreground hover:bg-muted flex-1"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span className="text-xs">Kommentieren</span>
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="gap-1.5 text-muted-foreground hover:text-foreground hover:bg-muted flex-1"
                >
                  <Repeat2 className="w-4 h-4" />
                  <span className="text-xs">Reposten</span>
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="gap-1.5 text-muted-foreground hover:text-foreground hover:bg-muted flex-1"
                >
                  <Share className="w-4 h-4" />
                  <span className="text-xs">Senden</span>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}
