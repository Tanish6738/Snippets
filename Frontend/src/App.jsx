import React from 'react'
import { UserProvider } from './Context/UserContext'
import AppRoutes from './Routes/AppRoutes'

const App = () => {
  return (
    <UserProvider>

        <AppRoutes />
        </UserProvider>
  )
}

export default App
