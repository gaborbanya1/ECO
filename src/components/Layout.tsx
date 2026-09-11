/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { motion, AnimatePresence } from "motion/react";
import { ReactNode } from "react";
import { Moon, Sun } from "lucide-react";
import { THEME } from "../types";

interface LayoutProps {
  children: ReactNode;
  isDarkMode: boolean;
  onThemeToggle: () => void;
}

export default function Layout({ children, isDarkMode, onThemeToggle }: LayoutProps) {
  const colors = isDarkMode ? THEME.dark : THEME.light;

  return (
    <div className={`min-h-screen transition-colors duration-700 ${colors.background} ${colors.text} font-sans selection:bg-sage-200`}>
      <div className="max-w-md mx-auto px-6 pt-[calc(3rem+env(safe-area-inset-top))] pb-[calc(2rem+env(safe-area-inset-bottom))] flex flex-col min-h-screen">
        <header className="flex flex-col items-center gap-5 mb-10">
          <motion.img 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            src="https://www.ecokozosseg.hu/assets/eco-logo-BCwkOKcu.png" 
            alt="Eco Logo" 
            className="h-14 drop-shadow-sm"
          />
        </header>

        <main className="flex-grow">
          <AnimatePresence mode="wait">
            <motion.div
              key={isDarkMode ? 'dark' : 'light'}
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.02 }}
              transition={{ duration: 0.4 }}
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </main>

        <footer className="mt-auto pt-8 pb-8 flex flex-col items-center gap-6">
          <motion.button 
            id="theme-toggle-btn"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            onClick={onThemeToggle}
            className={`p-3 rounded-full transition-all ${colors.accent} ${colors.text} hover:scale-110 active:scale-95 shadow-sm`}
            aria-label={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
          >
            {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
          </motion.button>
          
          <div className="text-center opacity-40 text-sm font-light">
            <p>Mindful moments by Energy of Consciousness</p>
          </div>
        </footer>
      </div>
    </div>
  );
}
