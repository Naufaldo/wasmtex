export type Lang = 'id' | 'en';
export declare function getLang(): Lang;
export declare function setLang(lang: Lang): void;
export declare function toggleLang(): Lang;
export declare const t: (idText: string, enText: string, currentLang?: Lang) => string;
