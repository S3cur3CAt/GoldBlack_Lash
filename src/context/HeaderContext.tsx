import React, { createContext, useContext, useState } from 'react'

interface HeaderContextType {
  subBar: React.ReactNode | null
  setSubBar: (node: React.ReactNode | null) => void
}

const HeaderContext = createContext<HeaderContextType>({
  subBar: null,
  setSubBar: () => {},
})

export const HeaderProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [subBar, setSubBar] = useState<React.ReactNode | null>(null)
  return (
    <HeaderContext.Provider value={{ subBar, setSubBar }}>
      {children}
    </HeaderContext.Provider>
  )
}

export const useHeaderSubBar = () => useContext(HeaderContext)

export const HeaderSubBarPortal: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { setSubBar } = useHeaderSubBar()

  React.useEffect(() => {
    setSubBar(children)
    return () => {
      setSubBar(null)
    }
  }, [children, setSubBar])

  return null
}
