import React, { createContext, useContext } from 'react'
import { business } from '../data/site'

export type StudioConfig = {
  name: string
  tagline: string
  claim: string
  phoneDisplay: string
  phoneClean: string
  siteUrl: string
  email: string
  address: string
  city: string
  postalCode: string
  instagram: string
  instagramHandle: string
  mapsUrl: string
  mapsEmbed: string
  hours: readonly { days: string; time: string }[] | Array<{ days: string; time: string }>
}

const StudioConfigContext = createContext<StudioConfig>(business as StudioConfig)

export function StudioConfigProvider({
  value,
  children,
}: {
  value?: StudioConfig
  children: React.ReactNode
}) {
  return (
    <StudioConfigContext.Provider value={value || (business as StudioConfig)}>
      {children}
    </StudioConfigContext.Provider>
  )
}

export function useStudioConfig(): StudioConfig {
  return useContext(StudioConfigContext) || (business as StudioConfig)
}
