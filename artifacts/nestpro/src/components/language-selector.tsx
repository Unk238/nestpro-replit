import React from 'react';
import { Globe } from 'lucide-react';
import { useTranslation, SUPPORTED_LANGUAGES, LanguageCode } from '@/lib/i18n';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export function LanguageSelector({ className }: { className?: string }) {
  const { language, setLanguage } = useTranslation();
  const currentLang = SUPPORTED_LANGUAGES.find((l) => l.code === language) || SUPPORTED_LANGUAGES[0];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-700/80 bg-slate-900/90 text-xs font-semibold text-slate-200 hover:border-indigo-400 hover:text-white transition-colors focus-visible:ring-2 focus-visible:ring-indigo-400 ${className || ''}`}
        >
          <Globe className="h-3.5 w-3.5 text-indigo-400" />
          <span>{currentLang.nativeName}</span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48 bg-slate-900 border-slate-700 max-h-64 overflow-y-auto">
        {SUPPORTED_LANGUAGES.map((l) => (
          <DropdownMenuItem
            key={l.code}
            onClick={() => setLanguage(l.code)}
            className={`cursor-pointer flex items-center justify-between text-xs py-2 ${
              language === l.code ? 'bg-indigo-600/30 text-indigo-300 font-bold' : 'text-slate-200 hover:bg-slate-800'
            }`}
          >
            <span>{l.nativeName}</span>
            <span className="text-[10px] text-slate-400">{l.name}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
