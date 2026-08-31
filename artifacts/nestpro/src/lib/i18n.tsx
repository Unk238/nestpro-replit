import React, { createContext, useContext, useState } from 'react';

export type LanguageCode = 'en' | 'hi' | 'kn' | 'te' | 'ta' | 'ml' | 'mr' | 'bn' | 'gu' | 'pa' | 'ur' | 'or' | 'as';

export interface LanguageInfo {
  code: LanguageCode;
  name: string;
  nativeName: string;
}

export const SUPPORTED_LANGUAGES: LanguageInfo[] = [
  { code: 'en', name: 'English', nativeName: 'English' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिंदी' },
  { code: 'kn', name: 'Kannada', nativeName: 'ಕನ್ನಡ' },
  { code: 'te', name: 'Telugu', nativeName: 'తెలుగు' },
  { code: 'ta', name: 'Tamil', nativeName: 'தமிழ்' },
  { code: 'ml', name: 'Malayalam', nativeName: 'മലയാളം' },
  { code: 'mr', name: 'Marathi', nativeName: 'मराठी' },
  { code: 'bn', name: 'Bengali', nativeName: 'বাংলা' },
  { code: 'gu', name: 'Gujarati', nativeName: 'ગુજરાતી' },
  { code: 'pa', name: 'Punjabi', nativeName: 'ਪੰਜਾਬੀ' },
  { code: 'ur', name: 'Urdu', nativeName: 'اردو' },
  { code: 'or', name: 'Odia', nativeName: 'ଓଡ଼ିଆ' },
  { code: 'as', name: 'Assamese', nativeName: 'অসমীয়া' },
];

export const TRANSLATIONS: Record<string, Record<LanguageCode, string>> = {
  appName: {
    en: 'RENTAQ', hi: 'RENTAQ', kn: 'RENTAQ', te: 'RENTAQ', ta: 'RENTAQ',
    ml: 'RENTAQ', mr: 'RENTAQ', bn: 'RENTAQ', gu: 'RENTAQ', pa: 'RENTAQ',
    ur: 'RENTAQ', or: 'RENTAQ', as: 'RENTAQ',
  },
  tagline: {
    en: 'Everything you manage. One place.',
    hi: 'सब कुछ जो आप प्रबंधित करते हैं। एक ही स्थान पर।',
    kn: 'ನೀವು ನಿರ್ವಹಿಸುವ ಪ್ರತಿಯೊಂದೂ. ಒಂದೇ ಸ್ಥಳದಲ್ಲಿ.',
    te: 'మీరు నిర్వహించే ప్రతిదీ. ఒకే చోట.',
    ta: 'நீங்கள் நிர்வகிக்கும் அனைத்தும். ஒரே இடத்தில்.',
    ml: 'നിങ്ങൾ കൈകാര്യം ചെയ്യുന്നതെല്ലാം. ഒരിടത്ത്.',
    mr: 'तुम्ही व्यवस्थापित करत असलेले सर्व काही. एकाच ठिकाणी.',
    bn: 'আপনি যা পরিচালনা করেন সবকিছু। এক জায়গায়।',
    gu: 'તમે જે કંઈ મેનેજ કરો છો તે બધું. એક જગ્યાએ.',
    pa: 'ਸਭ ਕੁਝ ਜੋ ਤੁਸੀਂ ਪ੍ਰਬੰਧਿਤ ਕਰਦੇ ਹੋ। ਇੱਕ ਥਾਂ ਤੇ।',
    ur: 'ہر وہ چیز جو آپ سنبھالتے ہیں۔ ایک جگہ۔',
    or: 'ଆପଣ ପରିଚାଳନା କରୁଥିବା ସମସ୍ତ ଜିନିଷ। ଗୋଟିଏ ସ୍ଥାନରେ।',
    as: 'আপুনি পৰিচালনা কৰা সকলো। এটা স্থানত।',
  },
  dashboard: {
    en: 'Operations Center', hi: 'संचालन केंद्र', kn: 'ಕಾರ್ಯಾಚರಣೆ ಕೇಂದ್ರ',
    te: 'కార్యకలాపాల కేంద్రం', ta: 'செயல்பாட்டு மையம்', ml: 'പ്രവർത്തന കേന്ദ്രം',
    mr: 'ऑपरेशन्स केंद्र', bn: 'অপারেশন সেন্টার', gu: 'ઓપરેશન્સ કેન્દ્ર',
    pa: 'ਓਪਰੇਸ਼ਨ ਸੈਂਟਰ', ur: 'آپریشنز سنٹر', or: 'ଅପରେସନ୍ କେନ୍ଦ୍ର', as: 'অপাৰেচন কেন্দ্ৰ',
  },
  properties: {
    en: 'Properties', hi: 'प्रॉपर्टीज', kn: 'ಆಸ್ತಿಗಳು', te: 'ప్రాపర్టీలు',
    ta: 'பண்புகள்', ml: 'പ്രോപ്പർട്ടികൾ', mr: 'प्रॉपर्टीज', bn: 'সম্পত্তি',
    gu: 'પ્રોપર્ટીઝ', pa: 'ਜਾਇਦਾਦਾਂ', ur: 'ਜਾਇਦਾਦਾਂ', or: 'ପ୍ରପର୍ଟି', as: 'সম্পত্তি',
  },
  bookings: {
    en: 'Central Bookings', hi: 'बुकिंग्स इनबॉक्स', kn: 'ಬುಕಿಂಗ್‌ಗಳು', te: 'బుకింగ్‌లు',
    ta: 'முன்பதிவுகள்', ml: 'ബുക്കിംഗുകൾ', mr: 'बुकिंग्ज', bn: 'বুকিং',
    gu: 'બુકિંગ્સ', pa: 'ਬੁਕਿੰਗਜ਼', ur: 'بکنگز', or: 'ବୁକିଂ', as: 'বুকিং',
  },
  guests: {
    en: 'Guests & Tenants', hi: 'अतिथि और किरायेदार', kn: 'ಅತಿಥಿಗಳು ಮತ್ತು ಬಾಡಿಗೆದಾರರು',
    te: 'అతిథులు & అద్దెదారులు', ta: 'விருந்தினர்கள் & வாடகைதாரர்கள்', ml: 'അതിഥികളും വാടകക്കാരും',
    mr: 'पाहुणे आणि भाडेकरू', bn: 'অতিথি ও ভাড়াটিয়া', gu: 'મહેમાનો અને ભાડૂતો',
    pa: 'ਮਹਿਮਾਨ ਅਤੇ ਕਿਰਾਏਦਾਰ', ur: 'مہمان اور کرایہ دار', or: 'ଅତିଥି ଏବଂ ଭଡ଼ାଟିଆ', as: 'অতিথি আৰু ভাৰাতীয়া',
  },
  payments: {
    en: 'Payments & Ledger', hi: 'भुगतान और बहीखाता', kn: 'ಪಾವತಿಗಳು ಮತ್ತು ಲೆಡ್ಜರ್',
    te: 'చెల్లింపులు & లెడ్జర్', ta: 'பணம் & லெட்ஜர்', ml: 'പേയ്‌മെന്റുകളും ലെഡ്ജറും',
    mr: 'पेमेंट्स आणि लेजर', bn: 'পেমেন্ট ও লেজার', gu: 'ચુકવણીઓ અને ખાતાવહી',
    pa: 'ਭੁਗਤਾਨ ਅਤੇ ਲੇਖਾ', ur: 'ادائیگی اور لیجر', or: 'ଦେୟ ଏବଂ ଖାତା', as: 'পৰিশোধ আৰু খতিয়ান',
  },
  utilities: {
    en: 'Utilities & Meters', hi: 'बिजली व मीटर', kn: 'ಯುಟಿಲಿಟೀಸ್ ಮತ್ತು ಮೀಟರ್',
    te: 'విద్యుత్ & మీటర్లు', ta: 'பயன்பாடுகள் & மீட்டர்கள்', ml: 'യൂട്ടിലിറ്റികൾ',
    mr: 'वीज आणि मीटर्स', bn: 'ইউটিলিটি ও মিটার', gu: 'વીજળી અને મીટર',
    pa: 'ਬਿਜਲੀ ਅਤੇ ਮੀਟਰ', ur: 'یوٹیلیٹیز اور میٹر', or: 'ବିଜୁଳି ଏବଂ ମିଟର', as: 'বিদ্যুৎ আৰু মিটাৰ',
  },
  studio: {
    en: 'RENTAQ Studio', hi: 'रेन्टाक स्टूडियो', kn: 'ರೆಂಟಾಕ್ ಸ್ಟುಡಿಯೋ',
    te: 'రెంటాక్ స్టూడియో', ta: 'ரென்டாக் ஸ்டுடியோ', ml: 'റെന്റാക്ക് സ്റ്റുഡിയോ',
    mr: 'रेन्टाक स्टुडिओ', bn: 'রেন্টাক স্টুডিও', gu: 'રેન્ટાક સ્ટુડિયો',
    pa: 'ਰੈਂਟਾਕ ਸਟੂਡੀਓ', ur: 'رینٹاک اسٹوڈیو', or: 'ରେଣ୍ଟାକ୍ ଷ୍ଟୁଡିଓ', as: 'ৰেণ্টাক ষ্টুডিঅ’',
  },
  qrTools: {
    en: 'QR Code Generator', hi: 'QR कोड टूल्स', kn: 'ಕ್ಯೂಆರ್ ಕೋಡ್ ಪರಿಕರಗಳು',
    te: 'QR కోడ్ సాధనాలు', ta: 'QR குறியீடு கருவிகள்', ml: 'ക്യുആർ കോഡുകൾ',
    mr: 'QR कोड टूल्स', bn: 'QR কোড টুলস', gu: 'QR કોડ ટૂલ્સ',
    pa: 'QR ਕੋਡ ਟੂਲਜ਼', ur: 'کیو آر کوڈ ٹولز', or: 'QR କୋଡ୍ ଟୁଲ୍ସ', as: 'QR ক’ড সঁজুলি',
  },
  aiReceptionist: {
    en: 'AI Virtual Reception', hi: 'AI रिसेप्शनिस्ट', kn: 'AI ರಿಸೆಪ್ಷನಿಸ್ಟ್',
    te: 'AI రిసెప్షనిస్ట్', ta: 'AI வரவேற்பாளர்', ml: 'AI റിസപ്ഷനിസ്റ്റ്',
    mr: 'AI रिसेप्शनिस्ट', bn: 'AI অভ্যর্থনাকারী', gu: 'AI રિસેપ્શનિસ્ટ',
    pa: 'AI ਰਿਸੈਪਸ਼ਨਿਸਟ', ur: 'AI استقبالیہ', or: 'AI ରିସେପ୍ସନିଷ୍ଟ', as: 'AI অভ্যৰ্থনাকাৰী',
  },
  services: {
    en: 'Services Marketplace', hi: 'सेवाएं और कानूनी मदद', kn: 'ಸೇವೆಗಳ ಮಾರುಕಟ್ಟೆ',
    te: 'సేవల మార్కెట్‌ప్లేస్', ta: 'சேவைகள் சந்தை', ml: 'സേവന മാർക്കറ്റ്പ്ലേസ്',
    mr: 'सेवा मार्केटप्लेस', bn: 'সার্ভিস মার্কেটপ্লেস', gu: 'સેવાઓ માર્કેટપ્લેસ',
    pa: 'ਸੇਵਾਵਾਂ ਮਾਰਕੀਟਪਲੇਸ', ur: 'سروسز مارکیٹ پلیس', or: 'ସେବା ବଜାର', as: 'সেৱা বজাৰ',
  },
  team: {
    en: 'Team & RBAC', hi: 'टीम और अनुमतियां', kn: 'ತಂಡ ಮತ್ತು ಅನುಮತಿಗಳು',
    te: 'బృందం & అనుమతులు', ta: 'குழு & அனுமதிகள்', ml: 'ടീമും അനുമതികളും',
    mr: 'टीम आणि परवानग्या', bn: 'টিম ও অনুমতি', gu: 'ટીમ અને પરવાનગીઓ',
    pa: 'ਟੀਮ ਅਤੇ ਅਧਿਕਾਰ', ur: 'ٹیم اور اجازت نامے', or: 'ଟିମ୍ ଏବଂ ଅନୁମତି', as: 'দল আৰু অনুমতি',
  },
  settings: {
    en: 'Settings', hi: 'सेटिंग्स', kn: 'ಸೆಟ್ಟಿಂಗ್‌ಗಳು', te: 'సెಟ್ಟಿంగ్‌లు',
    ta: 'அமைப்புகள்', ml: 'ക്രമീകരണങ്ങൾ', mr: 'सेटिंग्ज', bn: 'সেটিংস',
    gu: 'સેટિંગ્સ', pa: 'ਸੈਟਿੰਗਾਂ', ur: 'ترتیبات', or: 'ସେଟିଙ୍ଗସ୍', as: 'ছেটিংছ',
  },
};

interface I18nContextType {
  language: LanguageCode;
  setLanguage: (code: LanguageCode) => void;
  t: (key: string, defaultText?: string) => string;
}

const I18nContext = createContext<I18nContextType>({
  language: 'en',
  setLanguage: () => {},
  t: (key: string, defaultText?: string) => defaultText || key,
});

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<LanguageCode>(() => {
    const saved = localStorage.getItem('rentaq_language') as LanguageCode;
    return saved || 'en';
  });

  const setLanguage = (code: LanguageCode) => {
    setLanguageState(code);
    localStorage.setItem('rentaq_language', code);
  };

  const t = (key: string, defaultText?: string): string => {
    if (TRANSLATIONS[key] && TRANSLATIONS[key][language]) {
      return TRANSLATIONS[key][language];
    }
    return defaultText || key;
  };

  return (
    <I18nContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useTranslation() {
  return useContext(I18nContext);
}
