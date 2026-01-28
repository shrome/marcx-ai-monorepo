"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { useRegisterCompany } from "@/hooks/useCompanyQueries"
import { toast } from "sonner"
import { Loader2, Building2, Globe } from "lucide-react"

interface CompanyFormProps {
  onSuccess: () => void
}

export function CompanyForm({ onSuccess }: CompanyFormProps) {
  const registerCompanyMutation = useRegisterCompany()

  const [companyName, setCompanyName] = useState("")
  const [companyCategory, setCompanyCategory] = useState<"ACCOUNTING" | "MARKETING">("ACCOUNTING")
  const [companyDescription, setCompanyDescription] = useState("")
  const [companyWebsite, setCompanyWebsite] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await registerCompanyMutation.mutateAsync({
        name: companyName,
        category: companyCategory,
        description: companyDescription || undefined,
        website: companyWebsite || undefined,
      })
      toast.success("Company created! Welcome to the platform!")
      onSuccess()
    } catch (error: any) {
      toast.error(error?.message || "Failed to create company")
    }
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">Set up your company</CardTitle>
        <CardDescription>Tell us about your business</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="company-name">Company Name</Label>
            <div className="relative">
              <Building2 className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="company-name"
                type="text"
                placeholder="Acme Inc."
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                className="pl-10"
                required
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="company-category">Industry</Label>
            <Select value={companyCategory} onValueChange={(value: "ACCOUNTING" | "MARKETING") => setCompanyCategory(value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select industry" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ACCOUNTING">Accounting</SelectItem>
                <SelectItem value="MARKETING">Marketing</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="company-website">Website (Optional)</Label>
            <div className="relative">
              <Globe className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="company-website"
                type="url"
                placeholder="https://example.com"
                value={companyWebsite}
                onChange={(e) => setCompanyWebsite(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="company-description">Description (Optional)</Label>
            <Textarea
              id="company-description"
              placeholder="Tell us about your company..."
              value={companyDescription}
              onChange={(e) => setCompanyDescription(e.target.value)}
              rows={3}
            />
          </div>
          <Button type="submit" className="w-full" disabled={registerCompanyMutation.isPending}>
            {registerCompanyMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Complete Setup
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
