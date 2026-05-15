import { RootLayout, handleServerFunctions } from '@payloadcms/next/layouts'
import type { ReactNode } from 'react'
import configPromise from '@payload-config'
import { importMap } from './importMap'
import '@payloadcms/next/css'

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const serverFunction = async (args: { name: string; args: Record<string, unknown> }) => {
    'use server'
    return handleServerFunctions({
      ...args,
      config: configPromise,
      importMap,
    })
  }

  return (
    <RootLayout config={configPromise} importMap={importMap} serverFunction={serverFunction}>
      {children}
    </RootLayout>
  )
}
