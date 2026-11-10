export {};

declare global {
  interface Window {
    Eitaa?: {
      WebApp?: {
        initData: string;
        initDataUnsafe?: {
          user?: {
            id?: number;
            first_name?: string;
            last_name?: string;
            language_code?: string;
          };
        };
        platform?: string;
        version?: string;
        colorScheme?: "light" | "dark";
        ready?: () => void;
        expand?: () => void;
        close?: () => void;
        setHeaderColor?: (color: string) => void;
        setBackgroundColor?: (color: string) => void;
      };
    };
  }
}
