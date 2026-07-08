import { useState } from 'react';
import { Smile } from 'lucide-react';
import { Button } from '@imriva/framework';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

const COMMON_EMOJIS = [
  '😀', '😊', '😂', '❤️', '👍', '🎉', '🔥', '✨',
  '😍', '🙏', '💯', '👏', '😢', '🤔', '😎', '💪',
  '🏠', '📈', '💰', '✅', '❌', '⭐', '💼', '📌',
];

/**
 * Lightweight emoji picker - inserts emoji at cursor in textarea.
 */
export function EmojiPicker({ value, onChange, disabled }) {
  const [open, setOpen] = useState(false);

  const insertEmoji = (emoji) => {
    onChange((value ?? '') + emoji);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-9 w-9 text-muted-foreground hover:text-foreground shrink-0"
          disabled={disabled}
          aria-label="Open emoji picker"
          aria-haspopup="dialog"
        >
          <Smile className="w-5 h-5" aria-hidden />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-2" align="start" side="top">
        <div className="grid grid-cols-8 gap-1">
          {COMMON_EMOJIS.map((emoji) => (
            <button
              key={emoji}
              type="button"
              className="w-8 h-8 flex items-center justify-center rounded hover:bg-secondary text-lg transition-colors"
              aria-label={`Insert emoji ${emoji}`}
              onClick={() => {
                insertEmoji(emoji);
                setOpen(false);
              }}
            >
              {emoji}
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
