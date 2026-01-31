"use client"

import { useState } from "react"
import { useAuth } from "@/components/AuthContext"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { HardDrive, MessageSquare, LogOut, Plus, Paperclip, X, FileIcon } from "lucide-react"
import { toast } from "sonner"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useCases, useCreateCase } from "@/hooks/useBackendQueries"
import { Textarea } from "@/components/ui/textarea"

export function Case() {
  const { user, logout } = useAuth()
  const router = useRouter()
  const { data: cases, isLoading } = useCases()
  const createCaseMutation = useCreateCase()
  
  const [files, setFiles] = useState<File[]>([])
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [clientName, setClientName] = useState("")
  const [priority, setPriority] = useState<"low" | "medium" | "high">("medium")

  const handleLogout = async () => {
    await logout()
    router.push("/login")
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || [])
    setFiles((prev) => [...prev, ...selectedFiles])
  }

  const handleRemoveFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index))
  }

  const handleCreateCase = async () => {
    if (!title.trim()) {
      toast.error("Title is required")
      return
    }

    if (!clientName.trim()) {
      toast.error("Client name is required")
      return
    }

    if (!user?.companyId) {
      toast.error("Company ID is required")
      return
    }

    try {
      await createCaseMutation.mutateAsync({
        data: {
          title: title.trim(),
          description: description.trim() || undefined,
          clientName: clientName.trim(),
          priority,
          companyId: user.companyId,
        },
        files: files.length > 0 ? files : undefined,
      })

      toast.success("Case created successfully")
      setTitle("")
      setDescription("")
      setClientName("")
      setPriority("medium")
      setFiles([])
      setIsCreateOpen(false)
    } catch (error) {
      toast.error("Failed to create case")
    }
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
              {isLoading ? (
                <div className="p-6 text-center text-muted-foreground">
                  Loading cases...
                </div>
              ) : !cases || cases.length === 0 ? (
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
                        {new Date(item.updatedAt).toLocaleDateString()}
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
          className={`absolute inset-y-0 right-0 flex flex-col w-full sm:w-105 h-full bg-card border-l shadow-xl transition-transform duration-200 ease-out ${
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
              <label className="text-sm font-medium">Title *</label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Case title"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Client Name *</label>
              <Input
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                placeholder="Client name"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Description</label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Case description"
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Priority</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as "low" | "medium" | "high")}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Paperclip className="h-4 w-4" /> Attachments
              </div>
              <div className="border-2 border-dashed rounded-lg p-4">
                <input
                  type="file"
                  multiple
                  onChange={handleFileSelect}
                  className="hidden"
                  id="file-upload"
                />
                <label
                  htmlFor="file-upload"
                  className="flex flex-col items-center justify-center cursor-pointer"
                >
                  <Paperclip className="h-8 w-8 text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">Click to select files</p>
                </label>
              </div>
              {files.length > 0 && (
                <div className="border rounded-md divide-y text-sm">
                  {files.map((f, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between px-3 py-2"
                    >
                      <div className="flex items-center gap-2">
                        <FileIcon className="h-4 w-4 text-muted-foreground" />
                        <div className="flex flex-col">
                          <span className="font-medium">{f.name}</span>
                          <span className="text-xs text-muted-foreground">
                            {(f.size / 1024).toFixed(1)} KB
                          </span>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemoveFile(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center justify-end gap-2 border-t px-4 py-3 bg-card/90">
            <Button 
              onClick={handleCreateCase} 
              disabled={createCaseMutation.isPending}
            >
              {createCaseMutation.isPending ? "Creating..." : "Create"}
            </Button>
          </div>
        </aside>
      </div>
    </div>
  );
}
