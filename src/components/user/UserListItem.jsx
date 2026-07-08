import { ChevronRight } from 'lucide-react';
import { Avatar, AvatarImage, AvatarFallback } from '@imriva/framework';
import { cn, getInitials } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';

/**
 * Simple user list item component with avatar, name, handle, and arrow icon
 * Matches the design shown in the UI mockup
 */
export function UserListItem({ user, onClick, className }) {
  const navigate = useNavigate();

  const handleClick = () => {
    if (onClick) {
      onClick(user);
    } else {
      navigate(`/user/${user.handle}`);
    }
  };

  return (
    <div
      className={cn(
        'flex items-center gap-3 p-3 border-b border-border last:border-b-0',
        'hover:bg-accent/50 transition-colors cursor-pointer',
        className,
      )}
      onClick={handleClick}
    >
      <Avatar className="w-10 h-10 flex-shrink-0">
        {user.avatar ? (
          <AvatarImage src={user.avatar} alt={user.name} />
        ) : null}
        <AvatarFallback className="bg-sky-100 text-sky-700 dark:bg-sky-900/50 dark:text-sky-300 text-sm font-medium">
          {getInitials(user.name)}
        </AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm text-foreground truncate">{user.name}</p>
        <p className="text-xs text-muted-foreground truncate">@{user.handle}</p>
      </div>
      <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
    </div>
  );
}
