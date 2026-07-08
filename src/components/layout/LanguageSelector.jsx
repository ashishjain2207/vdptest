import { Check, ChevronDown } from 'lucide-react';
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@imriva/framework';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';

const languages = [
  { code: 'DE', label: 'DE', fullName: 'Deutsch' },
  { code: 'EN', label: 'EN', fullName: 'English' },
];

export function LanguageSelector() {
  const { language, setLanguage } = useLanguage();

  const handleLanguageChange = (lang) => {
    setLanguage(lang);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="h-9 px-3 gap-1.5 bg-white border-[#D6D6D6] text-[#4B4A4A] hover:bg-muted hover:text-[#4B4A4A] font-medium"
        >
          {language}
          <ChevronDown className="w-3.5 h-3.5 opacity-60" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent 
        align="end" 
        side="bottom"
        className="w-40 bg-white border-[#D6D6D6] shadow-lg z-[10000]"
      >
        {languages.map((lang) => {
          const isSelected = language === lang.code;
          return (
            <DropdownMenuItem
              key={lang.code}
              onClick={() => handleLanguageChange(lang.code)}
              className={cn(
                'flex items-center justify-between cursor-pointer',
                isSelected && 'text-primary font-medium',
              )}
            >
              <span>{lang.fullName} ({lang.code})</span>
              {isSelected && (
                <Check className="w-4 h-4 text-primary" />
              )}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
