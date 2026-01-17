import { MoonStar, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';
import React, { useEffect, useState } from 'react';

export default function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  const isDark = theme === 'dark';

  const toggleTheme = () => {
    setTheme(isDark ? 'light' : 'dark');
  };

  return (
    <button
      onClick={toggleTheme}
      className="flex h-8 w-14 items-center rounded-full bg-gray-200 p-1 transition-colors dark:bg-gray-500/70"
      aria-label="테마 전환"
    >
      <div
        className={`flex items-center justify-center rounded-full bg-white p-1 shadow-sm transition-transform duration-300 dark:bg-gray-700 ${
          isDark ? 'translate-x-5.5' : 'translate-x-0'
        }`}
      >
        {isDark ? (
          <MoonStar size={18} className="text-gray-800 dark:text-white" />
        ) : (
          <Sun size={18} className="text-gray-800 dark:text-white" />
        )}
      </div>
    </button>
  );
}
