/* THIS FILE WAS GENERATED AUTOMATICALLY BY PAYLOAD. */
import configPromise from '@payload-config'
import { RootPage } from '@payloadcms/next/views'
import { importMap } from '../importMap'

type Args = {
    params: Promise<{
        segments: string[]
    }>
    searchParams: Promise<{
        [key: string]: string | string[]
    }>
}

const Page = async ({ params, searchParams }: Args) => (
    <RootPage config={configPromise} params={params} searchParams={searchParams} importMap={importMap} />
)

export default Page
