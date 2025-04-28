import React, { useEffect } from 'react'
import { UserProvider } from './Context/UserContext'
import { NotificationProvider } from './Context/NotificationContext'
import { ProjectProvider } from './Context/ProjectContext'
import AppRoutes from './Routes/AppRoutes'

const App = () => {
  useEffect(() => {
    // Optimize loading
    document.head.innerHTML += `
      <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
      <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
      <meta name="description" content="Code sharing and collaboration platform for developers" />
      <meta name="theme-color" content="#0f172a" />
      <link rel="preload" href="/fonts/inter-var.woff2" as="font" type="font/woff2" crossorigin />
    `;
  }, []);

  return (
    <UserProvider>
      <NotificationProvider>
        <AppRoutes />
      </NotificationProvider>
    </UserProvider>
  )
}

export default App
