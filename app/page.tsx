"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import {
  Upload,
  FileText,
  BarChart3,
  Key,
  Instagram,
  AlertTriangle,
  ExternalLink,
  Globe,
  Info,
  Download,
  CheckCircle,
  Clock,
  RefreshCw,
  XCircle,
  Shield,
} from "lucide-react"
import ChatAnalysis from "./components/chat-analysis"
import OverallAnalysis from "./components/overall-analysis"

interface ChatMessage {
  sender_name: string
  timestamp_ms: number
  content: string
  is_geoblocked_for_viewer: boolean
}

interface ChatFile {
  name: string
  data: ChatMessage[]
}

interface AnalysisProgress {
  currentFile: number
  totalFiles: number
  currentFileName: string
  status: "analyzing" | "completed" | "error" | "retrying"
  retryCount?: number
}

export default function ChatAnalyzer() {
  const [apiKey, setApiKey] = useState("")
  const [apiKeyValidated, setApiKeyValidated] = useState(false)
  const [isValidatingKey, setIsValidatingKey] = useState(false)
  const [chatFiles, setChatFiles] = useState<ChatFile[]>([])
  const [analysisResults, setAnalysisResults] = useState<any[]>([])
  const [overallAnalysis, setOverallAnalysis] = useState<any>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analysisProgress, setAnalysisProgress] = useState<AnalysisProgress | null>(null)
  const [currentStep, setCurrentStep] = useState<"api-key" | "upload" | "analyze">("api-key")

  // Validate API key format
  const validateApiKeyFormat = (key: string) => {
    // Google API keys typically start with "AIza" and are 39 characters long
    const trimmedKey = key.trim()
    if (!trimmedKey) return { valid: false, message: "API key is required" }
    if (!trimmedKey.startsWith("AIza")) return { valid: false, message: "Google API keys should start with 'AIza'" }
    if (trimmedKey.length !== 39) return { valid: false, message: "Google API keys should be 39 characters long" }
    return { valid: true, message: "" }
  }

  // Test API key with a simple request
  const testApiKey = async (key: string) => {
    try {
      const response = await fetch("/api/test-api-key", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ apiKey: key }),
      })

      const result = await response.json()
      return { valid: response.ok, message: result.message || result.error }
    } catch (error) {
      return { valid: false, message: "Failed to test API key" }
    }
  }

  const handleApiKeySubmit = async () => {
    const trimmedKey = apiKey.trim()
    if (!trimmedKey) return

    // First validate format
    const formatValidation = validateApiKeyFormat(trimmedKey)
    if (!formatValidation.valid) {
      alert(formatValidation.message)
      return
    }

    setIsValidatingKey(true)

    // Test the API key
    const testResult = await testApiKey(trimmedKey)
    setIsValidatingKey(false)

    if (testResult.valid) {
      setApiKeyValidated(true)
      setCurrentStep("upload")
    } else {
      alert(`API Key Error: ${testResult.message}`)
    }
  }

  // Sort files by name (message_1.json, message_2.json, etc.)
  const sortFilesByName = (files: ChatFile[]) => {
    return files.sort((a, b) => {
      // Extract numbers from filenames for proper sorting
      const getNumber = (filename: string) => {
        const match = filename.match(/(\d+)/)
        return match ? Number.parseInt(match[1]) : 0
      }
      return getNumber(a.name) - getNumber(b.name)
    })
  }

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files) return

    const newChatFiles: ChatFile[] = []

    Array.from(files).forEach((file) => {
      const reader = new FileReader()
      reader.onload = (e) => {
        try {
          const jsonData = JSON.parse(e.target?.result as string)
          const messages = Array.isArray(jsonData) ? jsonData : jsonData.messages || []
          newChatFiles.push({
            name: file.name,
            data: messages,
          })

          if (newChatFiles.length === files.length) {
            const sortedFiles = sortFilesByName(newChatFiles)
            setChatFiles((prev) => sortFilesByName([...prev, ...sortedFiles]))
            setCurrentStep("analyze")
          }
        } catch (error) {
          alert(`Invalid JSON file: ${file.name}. Please upload valid chat exports.`)
        }
      }
      reader.readAsText(file)
    })
  }

  const analyzeAllChats = async () => {
    if (chatFiles.length === 0) return

    setIsAnalyzing(true)
    setAnalysisProgress({
      currentFile: 0,
      totalFiles: chatFiles.length,
      currentFileName: "",
      status: "analyzing",
    })
    const results = []

    try {
      // Process files in order
      for (let i = 0; i < chatFiles.length; i++) {
        const chatFile = chatFiles[i]

        // Update progress
        setAnalysisProgress({
          currentFile: i + 1,
          totalFiles: chatFiles.length,
          currentFileName: chatFile.name,
          status: "analyzing",
        })

        let retryCount = 0
        let success = false

        while (!success && retryCount < 3) {
          try {
            if (retryCount > 0) {
              setAnalysisProgress({
                currentFile: i + 1,
                totalFiles: chatFiles.length,
                currentFileName: `${chatFile.name} (Retry ${retryCount}/3)`,
                status: "retrying",
                retryCount,
              })
              // Wait before retry
              await new Promise((resolve) => setTimeout(resolve, 2000 * retryCount))
            }

            const response = await fetch("/api/analyze-chat", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                messages: chatFile.data,
                apiKey: apiKey,
                fileName: chatFile.name,
              }),
            })

            if (!response.ok) {
              const errorData = await response.json()

              // Check if it's an API key error (don't retry these)
              if (response.status === 401 || errorData.error?.includes("API_KEY_INVALID")) {
                throw new Error(`Invalid API Key: ${errorData.error}. Please check your API key and try again.`)
              }

              // Check if it's a 503 error (service unavailable)
              if (response.status === 503) {
                retryCount++
                if (retryCount >= 3) {
                  throw new Error(`Service temporarily unavailable for ${chatFile.name}. Please try again later.`)
                }
                continue
              }

              throw new Error(errorData.error || `Analysis failed for ${chatFile.name}`)
            }

            const result = await response.json()
            results.push({ ...result, fileName: chatFile.name })
            success = true

            // Small delay to show progress
            await new Promise((resolve) => setTimeout(resolve, 500))
          } catch (error) {
            if (error.message.includes("Invalid API Key") || retryCount >= 2) {
              throw error
            }
            retryCount++
          }
        }
      }

      setAnalysisResults(results)

      // Update progress for overall analysis
      setAnalysisProgress({
        currentFile: chatFiles.length,
        totalFiles: chatFiles.length,
        currentFileName: "Generating overall analysis...",
        status: "analyzing",
      })

      // Generate overall analysis with retry logic
      let overallRetryCount = 0
      let overallSuccess = false

      while (!overallSuccess && overallRetryCount < 3) {
        try {
          if (overallRetryCount > 0) {
            setAnalysisProgress({
              currentFile: chatFiles.length,
              totalFiles: chatFiles.length,
              currentFileName: `Overall analysis (Retry ${overallRetryCount}/3)`,
              status: "retrying",
              retryCount: overallRetryCount,
            })
            await new Promise((resolve) => setTimeout(resolve, 3000 * overallRetryCount))
          }

          const overallResponse = await fetch("/api/analyze-overall", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              allChats: chatFiles,
              individualAnalyses: results,
              apiKey: apiKey,
            }),
          })

          if (overallResponse.ok) {
            const overallResult = await overallResponse.json()
            setOverallAnalysis(overallResult)
            overallSuccess = true
          } else if (overallResponse.status === 503) {
            overallRetryCount++
            if (overallRetryCount >= 3) {
              console.warn("Overall analysis failed after retries, but individual analyses succeeded")
              overallSuccess = true // Continue without overall analysis
            }
          } else {
            overallRetryCount++
            if (overallRetryCount >= 3) {
              console.warn("Overall analysis failed, but individual analyses succeeded")
              overallSuccess = true
            }
          }
        } catch (error) {
          overallRetryCount++
          if (overallRetryCount >= 3) {
            console.warn("Overall analysis failed, but individual analyses succeeded")
            overallSuccess = true
          }
        }
      }

      // Mark as completed
      setAnalysisProgress({
        currentFile: chatFiles.length,
        totalFiles: chatFiles.length,
        currentFileName: "Analysis completed!",
        status: "completed",
      })
    } catch (error) {
      setAnalysisProgress({
        currentFile: 0,
        totalFiles: chatFiles.length,
        currentFileName: `Error: ${error.message}`,
        status: "error",
      })
      alert(`Analysis failed: ${error.message}`)
    } finally {
      setIsAnalyzing(false)
      // Clear progress after 3 seconds
      setTimeout(() => setAnalysisProgress(null), 3000)
    }
  }

  const removeFile = (index: number) => {
    setChatFiles((prev) => prev.filter((_, i) => i !== index))
  }

  const resetAll = () => {
    setChatFiles([])
    setAnalysisResults([])
    setOverallAnalysis(null)
    setAnalysisProgress(null)
    setCurrentStep("upload")
  }

  const resetApiKey = () => {
    setApiKey("")
    setApiKeyValidated(false)
    setChatFiles([])
    setAnalysisResults([])
    setOverallAnalysis(null)
    setAnalysisProgress(null)
    setCurrentStep("api-key")
  }

  return (
    <div className="min-h-screen bg-white text-black">
      <div className="max-w-6xl mx-auto p-6">
        {/* Header */}
        <div className="text-center mb-12 border-b border-gray-200 pb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Globe className="h-8 w-8 text-black" />
            <h1 className="text-5xl font-bold text-black">BondSense</h1>
          </div>
          <p className="text-xl text-gray-600 mb-4">Advanced relationship insights through AI-powered chat analysis</p>
          <div className="text-sm text-gray-500">
            <a 
              href="https://tanishaeaeaea.vercel.app" 
              target="_blank" 
              rel="noopener noreferrer"
              className="font-medium hover:text-black transition-colors"
            >
              tanishaeaeaea.vercel.app
            </a>
          </div>

          {/* Creator Credit */}
          <div className="flex items-center justify-center gap-2 text-gray-500 mt-4 font-mono text-sm">
            <span>Developed by</span>
            <a
              href="https://instagram.com/kaushikieee"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 hover:text-black transition-colors group"
            >
              <span className="group-hover:underline">Kaushik</span>
            </a>
            <span>for</span>
            <span className="relative group">
              <span className="cursor-pointer group-hover:text-black transition-colors">(her)</span>
              <span className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-black text-white px-2 py-1 rounded text-sm opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap font-mono">
                Tanisha
              </span>
            </span>
          </div>
        </div>

        {/* API Key Step */}
        {currentStep === "api-key" && (
          <div className="space-y-6">
            <Card className="border-2 border-gray-200 shadow-lg bg-white">
              <CardHeader className="border-b border-gray-100">
                <CardTitle className="flex items-center gap-2 text-black">
                  <Key className="h-5 w-5" />
                  Google Gemini API Configuration
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-6">
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                    <div className="flex items-start gap-3 text-gray-700">
                      <AlertTriangle className="h-5 w-5 mt-0.5" />
                      <div>
                        <p className="font-semibold text-black">API Key Required</p>
                        <p className="text-sm mb-3">
                          This application requires a Google Gemini API key to function. Get your free key from Google
                          AI Studio.
                        </p>
                        <a
                          href="https://makersuite.google.com/app/apikey"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-black hover:underline font-medium"
                        >
                          Get API Key <ExternalLink className="h-3 w-3" />
                        </a>
                      </div>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="api-key" className="text-black font-medium">
                      Google Gemini API Key
                    </Label>
                    <Input
                      id="api-key"
                      type="password"
                      value={apiKey}
                      onChange={(e) => setApiKey(e.target.value)}
                      placeholder="AIzaSy..."
                      className="mt-2 border-gray-300 focus:border-black focus:ring-black"
                    />
                    <div className="mt-2 space-y-1">
                      <p className="text-xs text-gray-500">
                        Your API key is processed securely and never stored on our servers
                      </p>
                      {apiKey && (
                        <div className="text-xs">
                          {validateApiKeyFormat(apiKey).valid ? (
                            <span className="text-green-600 flex items-center gap-1">
                              <CheckCircle className="h-3 w-3" />
                              Format looks correct
                            </span>
                          ) : (
                            <span className="text-red-600 flex items-center gap-1">
                              <XCircle className="h-3 w-3" />
                              {validateApiKeyFormat(apiKey).message}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                  <Button
                    onClick={handleApiKeySubmit}
                    disabled={!apiKey.trim() || isValidatingKey}
                    className="w-full bg-black hover:bg-gray-800 text-white font-medium py-3 disabled:bg-gray-300"
                  >
                    {isValidatingKey ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Validating API Key...
                      </>
                    ) : (
                      "Validate & Continue"
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* API Key Troubleshooting */}
            <Card className="border-2 border-red-200 shadow-lg bg-red-50">
              <CardHeader className="border-b border-red-100">
                <CardTitle className="flex items-center gap-2 text-red-900">
                  <AlertTriangle className="h-5 w-5" />
                  API Key Troubleshooting
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-4 text-red-800">
                  <p>
                    <strong>Getting "API key not valid" errors?</strong> Here's how to fix common issues:
                  </p>
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <div className="bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold mt-0.5">
                        1
                      </div>
                      <div>
                        <p className="font-semibold">Check API Key Format</p>
                        <p className="text-sm">Must start with "AIza" and be exactly 39 characters long</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold mt-0.5">
                        2
                      </div>
                      <div>
                        <p className="font-semibold">Enable Gemini API</p>
                        <p className="text-sm">
                          Go to{" "}
                          <a
                            href="https://console.cloud.google.com/apis/library/generativelanguage.googleapis.com"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="underline"
                          >
                            Google Cloud Console
                          </a>{" "}
                          and enable the Generative Language API
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold mt-0.5">
                        3
                      </div>
                      <div>
                        <p className="font-semibold">Check Restrictions</p>
                        <p className="text-sm">
                          Ensure your API key doesn't have IP or referrer restrictions that block this domain
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold mt-0.5">
                        4
                      </div>
                      <div>
                        <p className="font-semibold">Create New Key</p>
                        <p className="text-sm">If all else fails, create a fresh API key from Google AI Studio</p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-red-100 p-3 rounded-lg">
                    <p className="text-sm">
                      <strong>Still having issues?</strong> Make sure you're using a key from{" "}
                      <a
                        href="https://makersuite.google.com/app/apikey"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="underline font-medium"
                      >
                        Google AI Studio
                      </a>
                      , not Google Cloud Console.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Privacy & Security Assurance Card */}
            <Card className="border-2 border-green-200 shadow-lg bg-green-50">
              <CardHeader className="border-b border-green-100">
                <CardTitle className="flex items-center gap-2 text-green-900">
                  <Shield className="h-5 w-5" />🔒 Your Privacy is Protected
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-4 text-green-800">
                  <p className="font-semibold text-lg">
                    <strong>We CANNOT and DO NOT read your chat conversations!</strong>
                  </p>
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <div className="bg-green-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold mt-0.5">
                        ✓
                      </div>
                      <div>
                        <p className="font-semibold">Direct API Processing</p>
                        <p className="text-sm">
                          Your chats go directly from your browser to Google's Gemini AI - we never see them
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="bg-green-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold mt-0.5">
                        ✓
                      </div>
                      <div>
                        <p className="font-semibold">No Server Storage</p>
                        <p className="text-sm">Chat data is never uploaded to our servers or stored anywhere</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="bg-green-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold mt-0.5">
                        ✓
                      </div>
                      <div>
                        <p className="font-semibold">Your API Key</p>
                        <p className="text-sm">
                          You provide your own Google API key - all processing happens under your account
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="bg-green-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold mt-0.5">
                        ✓
                      </div>
                      <div>
                        <p className="font-semibold">Client-Side Processing</p>
                        <p className="text-sm">
                          All file reading and preparation happens in your browser, not on our servers
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-green-100 p-4 rounded-lg border-l-4 border-green-500">
                    <p className="text-sm font-medium">
                      <strong>Technical Guarantee:</strong> This application is designed with privacy-first
                      architecture. Your chat files are processed entirely client-side, and API requests go directly to
                      Google's servers using your personal API key. We have no technical capability to access, read, or
                      store your conversations.
                    </p>
                  </div>
                  <div className="bg-white p-3 rounded-lg border border-green-300">
                    <p className="text-sm text-green-900">
                      <strong>Open Source:</strong> You can verify our privacy claims by reviewing the source code. The
                      application is transparent about how your data is handled.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* What is an API Key Info Card */}
            <Card className="border-2 border-blue-200 shadow-lg bg-blue-50">
              <CardHeader className="border-b border-blue-100">
                <CardTitle className="flex items-center gap-2 text-blue-900">
                  <Info className="h-5 w-5" />
                  What is an API Key?
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-4 text-blue-800">
                  <p>
                    An <strong>API Key</strong> is a unique identifier that allows applications to access AI services.
                    Think of it as a password that lets our chat analyzer communicate with Google's Gemini AI.
                  </p>
                  <div className="space-y-2">
                    <h4 className="font-semibold">Why do you need one?</h4>
                    <ul className="list-disc list-inside space-y-1 text-sm">
                      <li>Enables AI-powered analysis of your chat conversations</li>
                      <li>Provides access to advanced language understanding capabilities</li>
                      <li>Ensures secure and authenticated requests to the AI service</li>
                      <li>Allows for personalized usage tracking and rate limiting</li>
                    </ul>
                  </div>
                  <div className="bg-blue-100 p-3 rounded-lg">
                    <p className="text-sm">
                      <strong>Free to get:</strong> Google provides free API access with generous usage limits. Perfect
                      for analyzing your chat conversations!
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Upload Step */}
        {currentStep === "upload" && (
          <div className="space-y-6">
            {/* API Key Status */}
            <Card className="border-2 border-green-200 shadow-lg bg-green-50">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-green-800">
                    <CheckCircle className="h-5 w-5" />
                    <span className="font-medium">API Key Validated Successfully</span>
                  </div>
                  <Button
                    onClick={resetApiKey}
                    variant="outline"
                    size="sm"
                    className="border-green-300 text-green-700 hover:bg-green-100"
                  >
                    Change API Key
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="border-2 border-gray-200 shadow-lg bg-white">
              <CardHeader className="border-b border-gray-100">
                <CardTitle className="flex items-center gap-2 text-black">
                  <Upload className="h-5 w-5" />
                  Upload Chat Files
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-6">
                  <div>
                    <Label htmlFor="chat-files" className="text-black font-medium">
                      Select JSON Chat Files (Multiple files supported)
                    </Label>
                    <Input
                      id="chat-files"
                      type="file"
                      accept=".json"
                      multiple
                      onChange={handleFileUpload}
                      className="mt-2 border-gray-300 focus:border-black focus:ring-black file:bg-black file:text-white file:border-0 file:rounded file:px-4 file:py-2 file:mr-4 file:hover:bg-gray-800"
                    />
                    <p className="text-xs text-gray-500 mt-2">
                      Files will be automatically sorted by name (message_1.json, message_2.json, etc.)
                    </p>
                  </div>

                  {chatFiles.length > 0 && (
                    <div className="space-y-4">
                      <h3 className="text-black font-medium">Uploaded Files (in order):</h3>
                      <div className="space-y-2">
                        {chatFiles.map((file, index) => (
                          <div
                            key={index}
                            className="flex items-center justify-between bg-gray-50 border border-gray-200 rounded-lg p-4"
                          >
                            <div className="flex items-center gap-3">
                              <div className="bg-black text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">
                                {index + 1}
                              </div>
                              <FileText className="h-4 w-4 text-gray-600" />
                              <span className="text-black font-medium">{file.name}</span>
                              <span className="text-gray-500 text-sm">({file.data.length} messages)</span>
                            </div>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => removeFile(index)}
                              className="border-gray-300 text-gray-600 hover:bg-gray-100 hover:text-black"
                            >
                              Remove
                            </Button>
                          </div>
                        ))}
                      </div>

                      <Button
                        onClick={() => setCurrentStep("analyze")}
                        className="w-full bg-black hover:bg-gray-800 text-white font-medium py-3"
                      >
                        <BarChart3 className="h-4 w-4 mr-2" />
                        Proceed to Analysis
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* How to Extract Instagram Chats Info Card */}
            <Card className="border-2 border-green-200 shadow-lg bg-green-50">
              <CardHeader className="border-b border-green-100">
                <CardTitle className="flex items-center gap-2 text-green-900">
                  <Download className="h-5 w-5" />
                  How to Extract Instagram Chats
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-4 text-green-800">
                  <p>Follow these steps to download your Instagram chat data for analysis:</p>
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <div className="bg-green-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold mt-0.5">
                        1
                      </div>
                      <div>
                        <p className="font-semibold">Open Instagram Settings</p>
                        <p className="text-sm">Go to your Instagram profile → Settings → Account Center</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="bg-green-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold mt-0.5">
                        2
                      </div>
                      <div>
                        <p className="font-semibold">Download Your Information</p>
                        <p className="text-sm">Select "Download your information" from the menu</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="bg-green-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold mt-0.5">
                        3
                      </div>
                      <div>
                        <p className="font-semibold">Choose Download Options</p>
                        <p className="text-sm">Select "Download info without media" for faster processing</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="bg-green-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold mt-0.5">
                        4
                      </div>
                      <div>
                        <p className="font-semibold">Find Your Chats</p>
                        <p className="text-sm">Once downloaded, look for JSON files in the "messages" folder</p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-green-100 p-3 rounded-lg">
                    <p className="text-sm">
                      <strong>Note:</strong> The download process may take a few hours to complete. Instagram will
                      notify you when it's ready!
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Analysis Step */}
        {currentStep === "analyze" && (
          <div className="space-y-8">
            {/* API Key Status */}
            <Card className="border-2 border-green-200 shadow-lg bg-green-50">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-green-800">
                    <CheckCircle className="h-5 w-5" />
                    <span className="font-medium">API Key Validated Successfully</span>
                  </div>
                  <Button
                    onClick={resetApiKey}
                    variant="outline"
                    size="sm"
                    className="border-green-300 text-green-700 hover:bg-green-100"
                  >
                    Change API Key
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="border-2 border-gray-200 shadow-lg bg-white">
              <CardHeader className="border-b border-gray-100">
                <CardTitle className="flex items-center gap-2 text-black">
                  <BarChart3 className="h-5 w-5" />
                  Analysis Ready - {chatFiles.length} File{chatFiles.length !== 1 ? "s" : ""} Queued
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div className="flex gap-4">
                    <Button
                      onClick={analyzeAllChats}
                      disabled={chatFiles.length === 0 || isAnalyzing}
                      className="flex-1 bg-black hover:bg-gray-800 text-white font-medium py-4 disabled:bg-gray-300"
                    >
                      {isAnalyzing ? (
                        <>
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                          Analyzing...
                        </>
                      ) : (
                        <>
                          <BarChart3 className="h-5 w-5 mr-2" />
                          Start Analysis
                        </>
                      )}
                    </Button>

                    <Button
                      onClick={resetAll}
                      variant="outline"
                      disabled={isAnalyzing}
                      className="border-gray-300 text-gray-600 hover:bg-gray-100 hover:text-black disabled:opacity-50"
                    >
                      Reset All
                    </Button>
                  </div>

                  {/* Progress Bar */}
                  {analysisProgress && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {analysisProgress.status === "analyzing" && (
                            <Clock className="h-4 w-4 text-blue-600 animate-pulse" />
                          )}
                          {analysisProgress.status === "retrying" && (
                            <RefreshCw className="h-4 w-4 text-orange-600 animate-spin" />
                          )}
                          {analysisProgress.status === "completed" && (
                            <CheckCircle className="h-4 w-4 text-green-600" />
                          )}
                          {analysisProgress.status === "error" && <AlertTriangle className="h-4 w-4 text-red-600" />}
                          <span className="text-sm font-medium text-black">
                            {analysisProgress.status === "analyzing" && "Analyzing"}
                            {analysisProgress.status === "retrying" && "Retrying"}
                            {analysisProgress.status === "completed" && "Completed"}
                            {analysisProgress.status === "error" && "Error"}
                          </span>
                        </div>
                        <span className="text-sm text-gray-600">
                          {analysisProgress.currentFile} of {analysisProgress.totalFiles}
                        </span>
                      </div>

                      <Progress
                        value={(analysisProgress.currentFile / analysisProgress.totalFiles) * 100}
                        className="w-full"
                      />

                      <p className="text-sm text-gray-600">{analysisProgress.currentFileName}</p>

                      {analysisProgress.status === "retrying" && (
                        <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
                          <p className="text-sm text-orange-800">
                            <strong>Service temporarily unavailable.</strong> Retrying automatically...
                            {analysisProgress.retryCount && ` (Attempt ${analysisProgress.retryCount + 1}/3)`}
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Overall Analysis - At the top */}
            {overallAnalysis && (
              <div className="space-y-6">
                <div className="text-center border-b border-gray-200 pb-6">
                  <h2 className="text-4xl font-bold text-black mb-2">Complete Relationship Analysis</h2>
                  <p className="text-gray-600">
                    Based on all {chatFiles.length} chat file{chatFiles.length !== 1 ? "s" : ""}
                  </p>
                </div>
                <OverallAnalysis data={overallAnalysis} />
              </div>
            )}

            {/* Individual Analysis Results */}
            {analysisResults.length > 0 && (
              <div className="space-y-12">
                <div className="text-center border-b border-gray-200 pb-6">
                  <h2 className="text-3xl font-bold text-black mb-2">Individual Chat Analysis</h2>
                  <p className="text-gray-600">Detailed breakdown of each conversation</p>
                </div>

                {analysisResults.map((result, index) => (
                  <div key={index} className="space-y-6">
                    <div className="text-center border-b border-gray-200 pb-6">
                      <div className="bg-black text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold mx-auto mb-3">
                        {index + 1}
                      </div>
                      <h3 className="text-2xl font-bold text-black mb-2">{result.fileName}</h3>
                      <p className="text-gray-600">Individual Analysis</p>
                    </div>
                    <ChatAnalysis data={result} />
                  </div>
                ))}

                {/* Footer */}
                <div className="text-center py-8 border-t border-gray-200">
                  <div className="flex items-center justify-center gap-2 text-gray-500">
                    <span className="text-sm">tanishaeaea.vercel.app • Powered by Gemini AI • Built by</span>
                    <a
                      href="https://instagram.com/kaushikieee"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 hover:text-black transition-colors font-medium"
                    >
                      <Instagram className="h-4 w-4" />
                      <span>@kaushikieee</span>
                    </a>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
