import React from 'react';
import { Globe, ChevronDown } from 'lucide-react';
import { useTranslation, SUPPORTED_LANGUAGES, LanguageCode } from '@/lib/i18n';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';

export function LanguageSelector() {
  const { language, setLanguage } = useTranslation();
  const current = SUPPORTED_LANGUAGES.find((l) => l.code === language) || SUPPORTED_LANGUAGES[0];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold bg-white border border-[#E5EAF1] hover:border-[#CBD5E1] hover:bg-[#F7F9FC] text-[#173B6C] transition-colors shadow-2xs focus-ring"
          title="Select Language"
        >
          <Globe className="h-3.5 w-3.5 text-[#2F6FED]" />
          <span>{current.nativeName}</span>
          <ChevronDown className="h-3 w-3 text-[#667085]" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-48 bg-white border-[#E5EAF1] text-[#172033] shadow-lg max-h-72 overflow-y-auto">
        {SUPPORTED_LANGUAGES.map((lang) => (
          <DropdownMenuItem
            key={lang.code}
            onClick={() => setLanguage(lang.code as LanguageCode)}
            className={`cursor-pointer text-xs py-1.5 ${
              language === lang.code ? 'bg-[#EFF5FF] text-[#2F6FED] font-bold' : 'text-[#172033] hover:bg-[#F7F9FC]'
            }`}
          >
            <span className="font-medium">{lang.nativeName}</span>
            <span className="ml-auto text-[10px] text-[#667085]">({lang.name})</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
