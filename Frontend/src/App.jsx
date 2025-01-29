import React, { useEffect } from 'react'
import { UserProvider } from './Context/UserContext'
import AppRoutes from './Routes/AppRoutes'

const App = () => {
  useEffect(() => {
    // Optimize loading
    document.head.innerHTML += `
      <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
      <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
      <meta name="description" content="Code sharing and collaboration platform for developers" />
    `;
  }, []);

  return (
    <UserProvider>
      <AppRoutes />
    </UserProvider>
  )
}

export default App
