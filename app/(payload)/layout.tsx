/* THIS FILE WAS GENERATED AUTOMATICALLY BY PAYLOAD. */
import configPromise from '@payload-config'
import '@payloadcms/next/css'
import { RootLayout, handleServerFunctions } from '@payloadcms/next/layouts'

import React from 'react'

import { importMap } from './admin/importMap'

type Args = {
    children: React.ReactNode
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const serverFunction = async (args: any) => {
    'use server'
    return handleServerFunctions({
        ...args,
        config: configPromise,
        importMap,
    })
}

const Layout = ({ children }: Args) => (
    <RootLayout
        config={configPromise}
        importMap={importMap}
        serverFunction={serverFunction}
    >
        {children}
    </RootLayout>
)

export default Layout
