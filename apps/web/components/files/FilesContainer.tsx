"use client"

import { useState } from "react"
import { useAuth } from "@/components/AuthContext"
import { FileUploadZone } from "./FileUploadZone"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { HardDrive, MessageSquare, LogOut, Plus, Paperclip, X } from "lucide-react"
import { toast } from "sonner"
import Link from "next/link"
import { useRouter } from "next/navigation"

interface CaseRow {
  id: string
  title: string
  description: string | null
  status: string
  priority: string
  updatedAt: Date
}

interface Attachment {
  id: string
  name: string
  url: string
  size: string
  type: string
}

export function FilesContainer() {
  const { user, logout } = useAuth()
  const router = useRouter()
  const [cases, setCases] = useState<CaseRow[]>([])
  const [files, setFiles] = useState<Attachment[]>([])
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")

  const handleLogout = async () => {
    await logout()
    router.push("/login")
  }

  const handleUploadComplete = async (fileData: {
    name: string
    url: string
    size: string
    type: string
  }) => {
    setFiles((prev) => [
      {
        id: crypto.randomUUID(),
        ...fileData,
      },
      ...prev,
    ])
    toast.success("File uploaded")
  }

  const handleCreateCase = () => {
    if (!title.trim()) {
      toast.error("Title is required")
      return
    }

    const newCase: CaseRow = {
      id: crypto.randomUUID(),
      title: title.trim(),
      description: description.trim() || null,
      status: "open",
      priority: "medium",
      updatedAt: new Date(),
    }

    setCases((prev) => [newCase, ...prev])
    setTitle("")
    setDescription("")
    setIsCreateOpen(false)
    toast.success("Case created")
  }

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <aside className="w-64 border-r bg-card p-4 flex flex-col">
        <Link href="/" className="flex items-center gap-2 mb-6">
          <HardDrive className="h-6 w-6 text-primary" />
          <span className="font-bold text-lg">Cases</span>
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
            Cases
          </Button>
        </nav>

        <div className="border-t pt-4">
          <div className="flex items-center gap-2 px-3 py-2">
            <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-sm font-medium">
              {user?.name?.[0]?.toUpperCase() ||
                user?.email?.[0]?.toUpperCase() ||
                "?"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">
                {user?.name || "User"}
              </p>
              <p className="text-xs text-muted-foreground truncate">
                {user?.email}
              </p>
            </div>
            <Button variant="ghost" size="icon" onClick={handleLogout}>
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 flex flex-col min-w-0">
        <header className="border-b p-4 flex items-center justify-between">
          <div>
            <p className="text-xs uppercase text-muted-foreground">Cases</p>
            <h1 className="text-xl font-semibold">Case Management</h1>
          </div>
          <Button onClick={() => setIsCreateOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create Case
          </Button>
        </header>

        <section className="flex-1 overflow-auto">
          <div className="p-4">
            <div className="rounded-lg border bg-card">
              <div className="grid grid-cols-12 gap-4 px-4 py-3 border-b text-sm text-muted-foreground">
                <span className="col-span-4">Title</span>
                <span className="col-span-3">Status</span>
                <span className="col-span-3">Priority</span>
                <span className="col-span-2 text-right">Updated</span>
              </div>
              {cases.length === 0 ? (
                <div className="p-6 text-center text-muted-foreground">
                  No cases yet. Create your first case.
                </div>
              ) : (
                <div className="divide-y">
                  {cases.map((item) => (
                    <button
                      key={item.id}
                      className="grid grid-cols-12 gap-4 px-4 py-3 items-center w-full text-left hover:bg-accent transition-colors"
                      onClick={() => router.push(`/case/${item.id}`)}
                    >
                      <div className="col-span-4">
                        <p className="font-medium text-sm leading-tight">
                          {item.title}
                        </p>
                        {item.description && (
                          <p className="text-xs text-muted-foreground line-clamp-1">
                            {item.description}
                          </p>
                        )}
                      </div>
                      <div className="col-span-3">
                        <span className="inline-flex items-center rounded-full bg-primary/10 text-primary px-3 py-1 text-xs font-medium">
                          {item.status}
                        </span>
                      </div>
                      <div className="col-span-3 capitalize text-sm">
                        {item.priority}
                      </div>
                      <div className="col-span-2 text-right text-sm text-muted-foreground">
                        {item.updatedAt.toLocaleDateString()}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>
      </main>

      {/* Right sidebar create panel */}
      {/* Right sidebar create panel with slide-in animation */}
      <div
        className={`fixed inset-0 z-40 ${isCreateOpen ? "pointer-events-auto" : "pointer-events-none"}`}
        aria-hidden={!isCreateOpen}
      >
        <div
          className={`absolute inset-0 bg-black/30 backdrop-blur-sm transition-opacity duration-200 ${
            isCreateOpen ? "opacity-100" : "opacity-0"
          }`}
          onClick={() => setIsCreateOpen(false)}
        />
        <aside
          className={`absolute inset-y-0 right-0 flex flex-col w-full sm:w-[420px] h-full bg-card border-l shadow-xl transition-transform duration-200 ease-out ${
            isCreateOpen ? "translate-x-0" : "translate-x-full"
          }`}
          role="dialog"
          aria-modal="true"
        >
          <div className="flex items-center justify-between border-b px-4 py-3">
            <div>
              <p className="text-xs uppercase text-muted-foreground">Create</p>
              <h2 className="text-lg font-semibold">New Case</h2>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsCreateOpen(false)}
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          <div className="p-4 space-y-5 flex-1 overflow-y-auto">
            <div className="space-y-2">
              <label className="text-sm font-medium">Title</label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Case title"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Description</label>
              <Input
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Short description"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Paperclip className="h-4 w-4" /> Attachments
              </div>
              <FileUploadZone onUploadComplete={handleUploadComplete} />
              {files.length > 0 && (
                <div className="border rounded-md divide-y text-sm">
                  {files.map((f) => (
                    <div
                      key={f.id}
                      className="flex items-center justify-between px-3 py-2"
                    >
                      <div className="flex flex-col">
                        <span className="font-medium">{f.name}</span>
                        <span className="text-xs text-muted-foreground">
                          {f.type}
                        </span>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {f.size}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center justify-end gap-2 border-t px-4 py-3 bg-card/90">
            {/* <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
                Cancel
              </Button> */}
            <Button onClick={handleCreateCase}>Create</Button>
          </div>
        </aside>
      </div>
    </div>
  );
}
