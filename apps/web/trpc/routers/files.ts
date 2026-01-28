import { z } from "zod"
import { router, protectedProcedure } from "../init"
import { mockStore, generateId } from "@/lib/db/mock-store"
import type { File, Folder } from "@marcx/db";

export const filesRouter = router({
  // Get all files and folders for user
  getFiles: protectedProcedure
    .input(z.object({ folderId: z.string().nullable().optional() }))
    .query(({ ctx, input }) => {
      const userFiles: File[] = []
      const userFolders: Folder[] = []

      mockStore.files.forEach((file) => {
        if (file.userId === ctx.user.id && file.folderId === (input.folderId || null)) {
          userFiles.push(file)
        }
      })

      mockStore.folders.forEach((folder) => {
        if (folder.userId === ctx.user.id && folder.parentId === (input.folderId || null)) {
          userFolders.push(folder)
        }
      })

      return {
        files: userFiles.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
        folders: userFolders.sort((a, b) => a.name.localeCompare(b.name)),
      }
    }),

  // Create folder
  createFolder: protectedProcedure
    .input(
      z.object({
        name: z.string(),
        parentId: z.string().nullable().optional(),
      }),
    )
    .mutation(({ ctx, input }) => {
      const folderId = generateId()
      const folder: Folder = {
        id: folderId,
        userId: ctx.user.id,
        name: input.name,
        parentId: input.parentId || null,
        createdAt: new Date(),
      }
      mockStore.folders.set(folderId, folder)
      return folder
    }),

  // Add file record (after upload to blob)
  addFile: protectedProcedure
    .input(
      z.object({
        name: z.string(),
        url: z.string(),
        size: z.string(),
        type: z.string(),
        folderId: z.string().nullable().optional(),
      }),
    )
    .mutation(({ ctx, input }) => {
      const fileId = generateId()
      const file: File = {
        id: fileId,
        userId: ctx.user.id,
        name: input.name,
        url: input.url,
        size: input.size,
        type: input.type,
        folderId: input.folderId || null,
        createdAt: new Date(),
        updatedAt: new Date(),
      }
      mockStore.files.set(fileId, file)
      return file
    }),

  // Delete file
  deleteFile: protectedProcedure.input(z.object({ fileId: z.string() })).mutation(({ input }) => {
    mockStore.files.delete(input.fileId)
    return { success: true }
  }),

  // Delete folder (and all contents)
  deleteFolder: protectedProcedure.input(z.object({ folderId: z.string() })).mutation(({ input }) => {
    // Delete all files in folder
    mockStore.files.forEach((file, id) => {
      if (file.folderId === input.folderId) {
        mockStore.files.delete(id)
      }
    })
    // Delete folder
    mockStore.folders.delete(input.folderId)
    return { success: true }
  }),

  // Rename file
  renameFile: protectedProcedure
    .input(
      z.object({
        fileId: z.string(),
        name: z.string(),
      }),
    )
    .mutation(({ input }) => {
      const file = mockStore.files.get(input.fileId)
      if (file) {
        file.name = input.name
        file.updatedAt = new Date()
      }
      return file
    }),

  // Get storage stats
  getStorageStats: protectedProcedure.query(({ ctx }) => {
    let totalSize = 0
    let fileCount = 0

    mockStore.files.forEach((file) => {
      if (file.userId === ctx.user.id) {
        totalSize += Number.parseInt(file.size) || 0
        fileCount++
      }
    })

    return {
      totalSize,
      fileCount,
      folderCount: Array.from(mockStore.folders.values()).filter((f) => f.userId === ctx.user.id).length,
    }
  }),
})
