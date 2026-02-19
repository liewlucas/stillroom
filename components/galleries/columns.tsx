"use client"

import { ColumnDef } from "@tanstack/react-table"
import { ArrowUpDown, ImageIcon, MoreVertical, Pencil, Trash2 } from "lucide-react"
import Link from "next/link"

import { Button } from "@/components/ui/button"
import { Photo } from "@/components/photo"
import { Checkbox } from "@/components/ui/checkbox"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { formatDate } from "@/lib/utils"

export interface Gallery {
    id: string
    title: string
    description?: string
    slug: string
    createdAt: string
    coverPhotoId: string | null
    photoCount: number
}

interface ColumnActions {
    onEdit: (gallery: Gallery) => void
    onDelete: (galleryId: string) => void
}

export function getColumns(actions: ColumnActions): ColumnDef<Gallery>[] {
    return [
        {
            id: "select",
            header: ({ table }) => (
                <Checkbox
                    checked={
                        table.getIsAllPageRowsSelected() ||
                        (table.getIsSomePageRowsSelected() && "indeterminate") as boolean
                    }
                    onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
                    aria-label="Select all"
                />
            ),
            cell: ({ row }) => (
                <Checkbox
                    checked={row.getIsSelected()}
                    onCheckedChange={(value) => row.toggleSelected(!!value)}
                    aria-label="Select row"
                />
            ),
            enableSorting: false,
            enableHiding: false,
        },
        {
            id: "preview",
            header: "Preview",
            enableSorting: false,
            enableHiding: false,
            cell: ({ row }) => {
                const coverPhotoId = row.original.coverPhotoId
                return (
                    <div className="w-16 h-12 rounded-md overflow-hidden bg-muted flex items-center justify-center">
                        {coverPhotoId ? (
                            <Photo
                                photoId={coverPhotoId}
                                className="w-full h-full object-cover"
                            />
                        ) : (
                            <ImageIcon className="w-5 h-5 text-muted-foreground" />
                        )}
                    </div>
                )
            },
        },
        {
            accessorKey: "title",
            header: ({ column }) => (
                <Button
                    variant="ghost"
                    onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                    className="-ml-4"
                >
                    Title
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
            ),
            cell: ({ row }) => (
                <Link
                    href={`/dashboard/galleries/${row.original.id}`}
                    className="font-medium hover:underline"
                >
                    {row.getValue("title")}
                </Link>
            ),
        },
        {
            accessorKey: "description",
            header: "Description",
            cell: ({ row }) => {
                const desc = row.getValue("description") as string | undefined
                return (
                    <span className="text-muted-foreground max-w-[200px] truncate block">
                        {desc || "—"}
                    </span>
                )
            },
        },
        {
            accessorKey: "photoCount",
            header: ({ column }) => (
                <Button
                    variant="ghost"
                    onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                    className="-ml-4"
                >
                    Photos
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
            ),
            cell: ({ row }) => (
                <span className="text-muted-foreground tabular-nums">
                    {row.getValue("photoCount")}
                </span>
            ),
        },
        {
            accessorKey: "slug",
            header: "Slug",
            cell: ({ row }) => (
                <span className="font-mono text-xs text-muted-foreground">
                    /{row.getValue("slug")}
                </span>
            ),
        },
        {
            accessorKey: "createdAt",
            header: ({ column }) => (
                <Button
                    variant="ghost"
                    onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                    className="-ml-4"
                >
                    Created
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
            ),
            cell: ({ row }) => (
                <span className="text-muted-foreground text-sm">
                    {formatDate(row.getValue("createdAt"))}
                </span>
            ),
        },
        {
            id: "actions",
            enableHiding: false,
            cell: ({ row }) => {
                const gallery = row.original

                return (
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                                <span className="sr-only">Open menu</span>
                                <MoreVertical className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => actions.onEdit(gallery)}>
                                <Pencil className="mr-2 h-4 w-4" />
                                Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                onClick={() => actions.onDelete(gallery.id)}
                                className="text-red-600 focus:text-red-600"
                            >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                )
            },
        },
    ]
}
