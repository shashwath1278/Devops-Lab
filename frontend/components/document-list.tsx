"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { Search, Trash2, FileText, Loader2, Eye, AlertCircle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface Document {
  id: string
  title: string
  description: string
  subject: string
  tags: string[]
  file_url: string
  uploaded_by: string
}

export default function DocumentList() {
  const { data: session } = useSession()
  const [documents, setDocuments] = useState<Document[]>([])
  const [filteredDocuments, setFilteredDocuments] = useState<Document[]>([])
  const [search, setSearch] = useState("")
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [error, setError] = useState("")
  const { toast } = useToast()
  const [flashcards, setFlashcards] = useState<{ question: string, answer: string }[]>([])
  const [isFlashcardModalOpen, setIsFlashcardModalOpen] = useState(false)
  const [currentCardIndex, setCurrentCardIndex] = useState(0)
  const [isFlipped, setIsFlipped] = useState(false)
  const [generatingId, setGeneratingId] = useState<string | null>(null)

  const [quiz, setQuiz] = useState<{ question: string, options: string[], answer: number, explanation: string }[]>([])
  const [isQuizModalOpen, setIsQuizModalOpen] = useState(false)
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [selectedOption, setSelectedOption] = useState<number | null>(null)
  const [showResult, setShowResult] = useState(false)
  const [score, setScore] = useState(0)
  const [generatingQuizId, setGeneratingQuizId] = useState<string | null>(null)

  const handleGenerateQuiz = async (docId: string) => {
    setGeneratingQuizId(docId)
    try {
      const response = await fetch("/api/quiz/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ document_id: docId }),
      })

      if (!response.ok) throw new Error("Failed to generate quiz")

      const data = await response.json()
      if (data.quiz && data.quiz.length > 0) {
        setQuiz(data.quiz)
        setCurrentQuestionIndex(0)
        setScore(0)
        setSelectedOption(null)
        setShowResult(false)
        setIsQuizModalOpen(true)
      } else {
        toast({ title: "Info", description: "No quiz could be generated from this document." })
      }
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to generate quiz. Please try again.",
        variant: "destructive",
      })
    } finally {
      setGeneratingQuizId(null)
    }
  }

  const handleOptionSelect = (index: number) => {
    if (selectedOption !== null) return // Prevent changing answer
    setSelectedOption(index)
    setShowResult(true)
    if (index === quiz[currentQuestionIndex].answer) {
      setScore(score + 1)
    }
  }

  const nextQuestion = () => {
    setSelectedOption(null)
    setShowResult(false)
    setCurrentQuestionIndex(currentQuestionIndex + 1)
  }

  const handleGenerateFlashcards = async (docId: string) => {
    setGeneratingId(docId)
    try {
      const response = await fetch("/api/flashcards/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ document_id: docId }),
      })

      if (!response.ok) throw new Error("Failed to generate flashcards")

      const data = await response.json()
      if (data.flashcards && data.flashcards.length > 0) {
        setFlashcards(data.flashcards)
        setCurrentCardIndex(0)
        setIsFlipped(false)
        setIsFlashcardModalOpen(true)
      } else {
        toast({ title: "Info", description: "No flashcards could be generated from this document." })
      }
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to generate flashcards. Please try again.",
        variant: "destructive",
      })
    } finally {
      setGeneratingId(null)
    }
  }

  const nextCard = () => {
    setIsFlipped(false)
    setCurrentCardIndex((prev) => (prev + 1) % flashcards.length)
  }

  const prevCard = () => {
    setIsFlipped(false)
    setCurrentCardIndex((prev) => (prev - 1 + flashcards.length) % flashcards.length)
  }

  // Fetch documents
  useEffect(() => {
    fetchDocuments()
    const interval = setInterval(fetchDocuments, 30000)
    return () => clearInterval(interval)
  }, [])

  // Filter documents by search
  useEffect(() => {
    const filtered = documents.filter(
      (doc) =>
        (doc.title || "").toLowerCase().includes(search.toLowerCase()) ||
        (doc.description || "").toLowerCase().includes(search.toLowerCase()) ||
        (doc.subject || "").toLowerCase().includes(search.toLowerCase()),
    )
    setFilteredDocuments(filtered)
  }, [search, documents])

  const fetchDocuments = async () => {
    try {
      const response = await fetch("/api/documents")
      if (!response.ok) throw new Error("Failed to fetch documents")
      const data = await response.json()
      setDocuments(data || [])
      setError("")
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to load documents"
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (docId: string) => {
    if (!(session?.user as any)?.id) {
      toast({
        title: "Error",
        description: "User not authenticated",
        variant: "destructive",
      })
      return
    }

    if (!confirm("Are you sure you want to delete this document?")) return

    setDeleting(docId)
    try {
      const response = await fetch(`/api/documents/${docId}?user_id=${(session?.user as any)?.id}`, {
        method: "DELETE",
      })

      if (!response.ok) throw new Error("Failed to delete document")

      setDocuments(documents.filter((doc) => doc.id !== docId))
      toast({
        title: "Success",
        description: "Document deleted successfully",
      })
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to delete document"
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      })
    } finally {
      setDeleting(null)
    }
  }

  return (
    <>
      <Card className="border-0 shadow-xl bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-accent" />
                Document Library
              </CardTitle>
              <CardDescription>Browse and manage shared documents</CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchDocuments}
              disabled={loading}
              className="border-border bg-transparent"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Refresh"}
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by title, description, or subject..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 border-input"
            />
          </div>

          {/* Error State */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Loading State */}
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
          ) : filteredDocuments.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="w-12 h-12 text-muted-foreground/50 mx-auto mb-3" />
              <p className="text-muted-foreground font-medium">
                {search ? "No documents match your search" : "No documents yet"}
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                {search ? "Try a different search term" : "Upload your first document to get started"}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredDocuments.map((doc) => (
                <div
                  key={doc.id}
                  className="group border border-border rounded-lg p-4 hover:border-accent/50 hover:bg-secondary/50 transition-all duration-200 hover:shadow-md"
                >
                  {/* Header */}
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-foreground truncate group-hover:text-primary transition-colors">
                        {doc.title}
                      </h3>
                      <p className="text-xs text-muted-foreground">by {doc.uploaded_by}</p>
                    </div>

                    <button
                      onClick={() => handleDelete(doc.id)}
                      disabled={deleting === doc.id}
                      className="ml-2 p-1 hover:bg-destructive/10 rounded transition-colors"
                      title="Delete document"
                    >
                      {deleting === doc.id ? (
                        <Loader2 className="w-4 h-4 text-destructive animate-spin" />
                      ) : (
                        <Trash2 className="w-4 h-4 text-muted-foreground hover:text-destructive transition-colors" />
                      )}
                    </button>

                  </div>

                  {/* Description */}
                  <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{doc.description || "No description"}</p>

                  {/* Subject Badge */}
                  <div className="flex flex-wrap gap-2 mb-3">
                    <Badge variant="secondary" className="bg-secondary text-foreground">
                      {doc.subject}
                    </Badge>
                  </div>

                  {/* Tags */}
                  {doc.tags && doc.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-3">
                      {doc.tags.slice(0, 3).map((tag, idx) => (
                        <Badge key={idx} variant="outline" className="text-xs border-border">
                          {tag}
                        </Badge>
                      ))}
                      {doc.tags.length > 3 && (
                        <Badge variant="outline" className="text-xs border-border">
                          +{doc.tags.length - 3}
                        </Badge>
                      )}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(doc.file_url, "_blank")}
                      className="flex-1 border-border hover:bg-accent hover:text-accent-foreground transition-colors"
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      View
                    </Button>
                    <Button
                      variant="default"
                      size="sm"
                      onClick={() => handleGenerateFlashcards(doc.id)}
                      disabled={generatingId === doc.id}
                      className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
                    >
                      {generatingId === doc.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <>
                          <span className="mr-2">⚡</span> Study
                        </>
                      )}
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => handleGenerateQuiz(doc.id)}
                      disabled={generatingQuizId === doc.id}
                      className="flex-1 bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-300 transition-colors"
                      title="Take a Quiz"
                    >
                      {generatingQuizId === doc.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <>
                          <span className="mr-2">📝</span> Quiz
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Flashcard Modal */}
      {isFlashcardModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-card w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-4 border-b border-border flex justify-between items-center bg-secondary/50">
              <h3 className="font-bold text-lg">Flashcards ({currentCardIndex + 1}/{flashcards.length})</h3>
              <button onClick={() => setIsFlashcardModalOpen(false)} className="text-muted-foreground hover:text-foreground">
                ✕
              </button>
            </div>

            <div className="flex-1 p-8 flex items-center justify-center min-h-[300px] bg-secondary/20">
              <div
                className="w-full h-64 perspective-1000 cursor-pointer"
                onClick={() => setIsFlipped(!isFlipped)}
              >
                <div className={`relative w-full h-full transition-transform duration-500 transform-style-3d ${isFlipped ? 'rotate-y-180' : ''}`}>
                  {/* Front */}
                  <div className="absolute w-full h-full backface-hidden bg-white dark:bg-gray-800 rounded-xl shadow-lg border-2 border-primary/20 flex items-center justify-center p-8 text-center">
                    <div>
                      <span className="block text-xs font-bold text-primary mb-4 uppercase tracking-wider">Question</span>
                      <p className="text-xl font-medium">{flashcards[currentCardIndex].question}</p>
                    </div>
                  </div>

                  {/* Back */}
                  <div className="absolute w-full h-full backface-hidden bg-primary text-primary-foreground rounded-xl shadow-lg rotate-y-180 flex items-center justify-center p-8 text-center">
                    <div>
                      <span className="block text-xs font-bold text-primary-foreground/70 mb-4 uppercase tracking-wider">Answer</span>
                      <p className="text-xl font-medium">{flashcards[currentCardIndex].answer}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-border flex justify-between items-center bg-secondary/50">
              <Button variant="outline" onClick={prevCard} disabled={flashcards.length <= 1}>Previous</Button>
              <p className="text-sm text-muted-foreground">Click card to flip</p>
              <Button variant="outline" onClick={nextCard} disabled={flashcards.length <= 1}>Next</Button>
            </div>
          </div>
        </div>
      )}

      {/* Quiz Modal */}
      {isQuizModalOpen && quiz.length > 0 && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-card w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-4 border-b border-border flex justify-between items-center bg-secondary/50">
              <h3 className="font-bold text-lg flex items-center gap-2">
                <span className="text-xl">📝</span> Quiz Mode
              </h3>
              <button onClick={() => setIsQuizModalOpen(false)} className="text-muted-foreground hover:text-foreground">
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              {currentQuestionIndex < quiz.length ? (
                <div className="space-y-6">
                  {/* Progress */}
                  <div className="flex justify-between text-sm text-muted-foreground mb-2">
                    <span>Question {currentQuestionIndex + 1} of {quiz.length}</span>
                    <span>Score: {score}</span>
                  </div>
                  <div className="w-full bg-secondary h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-primary h-full transition-all duration-300"
                      style={{ width: `${((currentQuestionIndex + 1) / quiz.length) * 100}%` }}
                    />
                  </div>

                  {/* Question */}
                  <h2 className="text-xl font-bold">{quiz[currentQuestionIndex].question}</h2>

                  {/* Options */}
                  <div className="space-y-3">
                    {quiz[currentQuestionIndex].options.map((option, idx) => {
                      let optionClass = "w-full justify-start text-left p-4 h-auto border-2 hover:bg-accent/50"

                      if (showResult) {
                        if (idx === quiz[currentQuestionIndex].answer) {
                          optionClass = "w-full justify-start text-left p-4 h-auto border-2 border-green-500 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300"
                        } else if (idx === selectedOption) {
                          optionClass = "w-full justify-start text-left p-4 h-auto border-2 border-red-500 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300"
                        } else {
                          optionClass = "w-full justify-start text-left p-4 h-auto border-2 opacity-50"
                        }
                      } else if (selectedOption === idx) {
                        optionClass = "w-full justify-start text-left p-4 h-auto border-2 border-primary bg-primary/10"
                      }

                      return (
                        <Button
                          key={idx}
                          variant="outline"
                          className={optionClass}
                          onClick={() => handleOptionSelect(idx)}
                          disabled={showResult}
                        >
                          <span className="mr-3 font-bold opacity-70">{String.fromCharCode(65 + idx)}.</span>
                          {option}
                        </Button>
                      )
                    })}
                  </div>

                  {/* Explanation & Next Button */}
                  {showResult && (
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-300 space-y-4">
                      <div className={`p-4 rounded-lg ${selectedOption === quiz[currentQuestionIndex].answer ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200' : 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200'}`}>
                        <p className="font-bold mb-1">
                          {selectedOption === quiz[currentQuestionIndex].answer ? "Correct! 🎉" : "Incorrect 😔"}
                        </p>
                        <p className="text-sm">{quiz[currentQuestionIndex].explanation}</p>
                      </div>

                      <Button onClick={nextQuestion} className="w-full" size="lg">
                        {currentQuestionIndex < quiz.length - 1 ? "Next Question" : "See Results"}
                      </Button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-12 space-y-6">
                  <div className="text-6xl mb-4">🏆</div>
                  <h2 className="text-3xl font-bold">Quiz Completed!</h2>
                  <div className="text-xl">
                    You scored <span className="font-bold text-primary">{score}</span> out of <span className="font-bold">{quiz.length}</span>
                  </div>
                  <p className="text-muted-foreground">
                    {score === quiz.length ? "Perfect score! You're a master!" :
                      score > quiz.length / 2 ? "Good job! Keep studying." : "Keep practicing, you'll get there!"}
                  </p>
                  <Button onClick={() => setIsQuizModalOpen(false)} size="lg">Close Quiz</Button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
