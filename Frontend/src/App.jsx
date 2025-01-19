import React from 'react'
import { UserProvider } from './Context/UserContext'
import { GroupProvider } from './Context/GroupContext'
import AppRoutes from './Routes/AppRoutes'

const App = () => {
  return (
    <UserProvider>
      <GroupProvider>
        <AppRoutes />
      </GroupProvider>
    </UserProvider>
  )
}

export default App
