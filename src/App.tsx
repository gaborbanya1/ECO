/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from "react";
import Layout from "./components/Layout";
import Timer from "./components/Timer";

export default function App() {
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const saved = localStorage.getItem("eco-gong-theme");
    return saved ? JSON.parse(saved) : false;
  });

  useEffect(() => {
    localStorage.setItem("eco-gong-theme", JSON.stringify(isDarkMode));
  }, [isDarkMode]);

  return (
    <Layout isDarkMode={isDarkMode} onThemeToggle={() => setIsDarkMode(!isDarkMode)}>
      <Timer isDarkMode={isDarkMode} />
    </Layout>
  );
}

