"use client"

import { useState } from "react"
import { useAuth } from "@/components/AuthContext"
import { trpc } from "@/trpc/client"
import { FileGrid } from "./FileGrid"
import { FileUploadZone } from "./FileUploadZone"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { FolderPlus, ChevronRight, Home, HardDrive, MessageSquare, LogOut } from "lucide-react"
import { toast } from "sonner"
import Link from "next/link"
import { useRouter } from "next/navigation"
import type { File as FileType, Folder as FolderType } from "@marcx/db"
import { cn } from "@/lib/utils"

interface BreadcrumbItem {
  id: string | null
  name: string
}

export function FilesContainer() {
  const { user, logout } = useAuth()
  const router = useRouter()
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null)
  const [breadcrumbs, setBreadcrumbs] = useState<BreadcrumbItem[]>([{ id: null, name: "My Files" }])
  const [files, setFiles] = useState<FileType[]>([])
  const [folders, setFolders] = useState<FolderType[]>([])
  const [newFolderDialog, setNewFolderDialog] = useState(false)
  const [newFolderName, setNewFolderName] = useState("")

  const createFolder = trpc.files.createFolder.useMutation()
  const addFile = trpc.files.addFile.useMutation()
  const deleteFile = trpc.files.deleteFile.useMutation()
  const deleteFolder = trpc.files.deleteFolder.useMutation()
  const renameFile = trpc.files.renameFile.useMutation()

  const handleLogout = async () => {
    await logout()
    router.push("/login")
  }

  const handleOpenFolder = (folderId: string) => {
    const folder = folders.find((f) => f.id === folderId)
    if (folder) {
      setCurrentFolderId(folderId)
      setBreadcrumbs((prev) => [...prev, { id: folderId, name: folder.name }])
    }
  }

  const handleBreadcrumbClick = (index: number) => {
    const item = breadcrumbs[index]
    setCurrentFolderId(item.id)
    setBreadcrumbs((prev) => prev.slice(0, index + 1))
  }

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) return
    try {
      const folder = await createFolder.mutateAsync({
        name: newFolderName.trim(),
        parentId: currentFolderId,
      })
      setFolders((prev) => [...prev, folder])
      setNewFolderDialog(false)
      setNewFolderName("")
      toast.success("Folder created")
    } catch (error) {
      toast.error("Failed to create folder")
    }
  }

  const handleUploadComplete = async (fileData: {
    name: string
    url: string
    size: string
    type: string
  }) => {
    try {
      const file = await addFile.mutateAsync({
        ...fileData,
        folderId: currentFolderId,
      })
      setFiles((prev) => [file, ...prev])
      toast.success("File uploaded")
    } catch (error) {
      toast.error("Failed to save file")
    }
  }

  const handleDeleteFile = async (fileId: string) => {
    try {
      await deleteFile.mutateAsync({ fileId })
      setFiles((prev) => prev.filter((f) => f.id !== fileId))
      toast.success("File deleted")
    } catch (error) {
      toast.error("Failed to delete file")
    }
  }

  const handleDeleteFolder = async (folderId: string) => {
    try {
      await deleteFolder.mutateAsync({ folderId })
      setFolders((prev) => prev.filter((f) => f.id !== folderId))
      toast.success("Folder deleted")
    } catch (error) {
      toast.error("Failed to delete folder")
    }
  }

  const handleRenameFile = async (fileId: string, name: string) => {
    try {
      await renameFile.mutateAsync({ fileId, name })
      setFiles((prev) => prev.map((f) => (f.id === fileId ? { ...f, name } : f)))
      toast.success("File renamed")
    } catch (error) {
      toast.error("Failed to rename file")
    }
  }

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <aside className="w-64 border-r bg-card p-4 flex flex-col">
        <Link href="/" className="flex items-center gap-2 mb-6">
          <HardDrive className="h-6 w-6 text-primary" />
          <span className="font-bold text-lg">My Files</span>
        </Link>

        <nav className="space-y-1 flex-1">
          <Link href="/chat">
            <Button variant="ghost" className="w-full justify-start gap-2">
              <MessageSquare className="h-4 w-4" />
              AI Chat
            </Button>
          </Link>
          <Button variant="secondary" className="w-full justify-start gap-2">
            <HardDrive className="h-4 w-4" />
            My Files
          </Button>
        </nav>

        <div className="border-t pt-4">
          <div className="flex items-center gap-2 px-3 py-2">
            <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-sm font-medium">
              {user?.name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || "?"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{user?.name || "User"}</p>
              <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
            </div>
            <Button variant="ghost" size="icon" onClick={handleLogout}>
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="border-b p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-1 text-sm">
              {breadcrumbs.map((item, index) => (
                <div key={item.id || "root"} className="flex items-center">
                  {index > 0 && <ChevronRight className="h-4 w-4 text-muted-foreground mx-1" />}
                  <button
                    onClick={() => handleBreadcrumbClick(index)}
                    className={cn(
                      "hover:text-primary transition-colors",
                      index === breadcrumbs.length - 1 ? "font-medium" : "text-muted-foreground",
                    )}
                  >
                    {index === 0 ? <Home className="h-4 w-4" /> : item.name}
                  </button>
                </div>
              ))}
            </div>
            <Button onClick={() => setNewFolderDialog(true)} variant="outline" size="sm">
              <FolderPlus className="h-4 w-4 mr-2" />
              New Folder
            </Button>
          </div>
          <FileUploadZone onUploadComplete={handleUploadComplete} />
        </header>

        {/* File grid */}
        <FileGrid
          files={files.filter((f) => f.folderId === currentFolderId)}
          folders={folders.filter((f) => f.parentId === currentFolderId)}
          onOpenFolder={handleOpenFolder}
          onDeleteFile={handleDeleteFile}
          onDeleteFolder={handleDeleteFolder}
          onRenameFile={handleRenameFile}
        />
      </main>

      {/* New folder dialog */}
      <Dialog open={newFolderDialog} onOpenChange={setNewFolderDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create new folder</DialogTitle>
          </DialogHeader>
          <Input
            placeholder="Folder name"
            value={newFolderName}
            onChange={(e) => setNewFolderName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleCreateFolder()}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setNewFolderDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateFolder}>Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
