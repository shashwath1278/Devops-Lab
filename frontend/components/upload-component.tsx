"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { Cloud, Upload, Loader2, Check, X } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface UploadComponentProps {
  userId: string
}

export default function UploadComponent({ userId }: UploadComponentProps) {
  const [file, setFile] = useState<File | null>(null)
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [subject, setSubject] = useState("")
  const [tags, setTags] = useState("")
  const [isDragging, setIsDragging] = useState(false)
  const [loading, setLoading] = useState(false)
  const [uploadStatus, setUploadStatus] = useState<"idle" | "success" | "error">("idle")
  const [errorMessage, setErrorMessage] = useState("")
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const files = e.dataTransfer.files
    if (files.length > 0) {
      setFile(files[0])
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      setFile(files[0])
    }
  }

  const validateForm = (): boolean => {
    if (!file) {
      setErrorMessage("Please select a file")
      return false
    }
    if (!title.trim()) {
      setErrorMessage("Please enter a title")
      return false
    }
    if (!subject.trim()) {
      setErrorMessage("Please select a subject")
      return false
    }
    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setUploadStatus("idle")
    setErrorMessage("")

    if (!validateForm()) {
      setUploadStatus("error")
      return
    }

    setLoading(true)
    try {
      const formData = new FormData()
      formData.append("file", file!)
      formData.append("title", title)
      formData.append("description", description)
      formData.append("subject", subject)
      formData.append("tags", tags)
      formData.append("user_id", userId)

      const response = await fetch("/api/documents/upload", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.detail || "Upload failed")
      }

      setUploadStatus("success")
      toast({
        title: "Success",
        description: "Document uploaded successfully!",
      })

      // Reset form
      setFile(null)
      setTitle("")
      setDescription("")
      setSubject("")
      setTags("")
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }

      // Clear success message after 3 seconds
      setTimeout(() => setUploadStatus("idle"), 3000)
    } catch (error) {
      const message = error instanceof Error ? error.message : "Upload failed"
      setErrorMessage(message)
      setUploadStatus("error")
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="h-full border-0 shadow-lg sticky top-24">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Cloud className="w-5 h-5 text-accent" />
          Upload Document
        </CardTitle>
        <CardDescription>Share your study materials and notes</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Drag & Drop Area */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-all ${
              isDragging ? "border-accent bg-accent/10" : "border-border hover:border-accent/50 hover:bg-secondary/50"
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
              onChange={handleFileSelect}
              className="hidden"
            />
            <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
            <p className="text-sm font-medium text-foreground">{file ? file.name : "Drag & drop or click to upload"}</p>
            <p className="text-xs text-muted-foreground mt-1">PDF, Images, or Documents</p>
          </div>

          {/* Form Fields */}
          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium text-foreground block mb-1">Title *</label>
              <Input
                placeholder="Document title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                disabled={loading}
                className="border-input"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-foreground block mb-1">Subject *</label>
              <Input
                placeholder="e.g., Mathematics, Biology, History"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                disabled={loading}
                className="border-input"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-foreground block mb-1">Description</label>
              <Textarea
                placeholder="Add any additional notes..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={loading}
                rows={3}
                className="border-input resize-none"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-foreground block mb-1">Tags</label>
              <Input
                placeholder="Comma-separated tags"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                disabled={loading}
                className="border-input"
              />
            </div>
          </div>

          {/* Status Messages */}
          {uploadStatus === "error" && errorMessage && (
            <Alert variant="destructive">
              <X className="h-4 w-4" />
              <AlertDescription>{errorMessage}</AlertDescription>
            </Alert>
          )}

          {uploadStatus === "success" && (
            <Alert className="border-accent bg-accent/10">
              <Check className="h-4 w-4 text-accent" />
              <AlertDescription className="text-accent">Document uploaded successfully!</AlertDescription>
            </Alert>
          )}

          {/* Submit Button */}
          <Button
            type="submit"
            disabled={loading}
            className="w-full bg-primary text-primary-foreground hover:bg-primary/90 h-10"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="mr-2 h-4 w-4" />
                Upload Document
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
