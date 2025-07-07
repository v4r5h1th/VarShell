"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { KnowledgeGraph } from "@/components/knowledge-graph"
import { ChatInterface } from "@/components/chat-interface"
import { SocialPage } from "@/components/social-page"
import { RoadmapGenerator } from "@/components/roadmap-generator"
import { LoginPage } from "@/components/login-page"
import { UpdatesPage } from "@/components/updates-page"
import { Brain, MessageCircle, Map, Users, Copy, Trash2, Newspaper, LogOut } from "lucide-react"

export interface GraphNode {
  id: string
  label: string
  proficiency: "not_started" | "beginner" | "intermediate" | "advanced" | "expert"
  category: string
  x?: number
  y?: number
  resources?: string[]
}

export interface GraphEdge {
  source: string
  target: string
  relationship: string
}

export interface KnowledgeGraphData {
  nodes: GraphNode[]
  edges: GraphEdge[]
}

export interface GraphVersion {
  id: string
  name: string
  description: string
  graph: KnowledgeGraphData
  createdAt: Date
  isMain: boolean
}

export default function HomePage() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [currentUser, setCurrentUser] = useState<{ email: string; name: string } | null>(null)
  const [graphVersions, setGraphVersions] = useState<GraphVersion[]>([])
  const [activeVersionId, setActiveVersionId] = useState<string>("")
  const [isGenerating, setIsGenerating] = useState(false)
  const [userInput, setUserInput] = useState("")
  const [activeTab, setActiveTab] = useState("generate")
  const [showRoadmapGenerator, setShowRoadmapGenerator] = useState(false)

  useEffect(() => {
    // Check if user is logged in
    const savedUser = localStorage.getItem("currentUser")
    if (savedUser) {
      setCurrentUser(JSON.parse(savedUser))
      setIsLoggedIn(true)
    }
  }, [])

  useEffect(() => {
    if (isLoggedIn) {
      const saved = localStorage.getItem("graphVersions")
      if (saved) {
        const versions = JSON.parse(saved)
        setGraphVersions(versions)
        const mainVersion = versions.find((v: GraphVersion) => v.isMain)
        if (mainVersion) {
          setActiveVersionId(mainVersion.id)
          setActiveTab("graph")
        }
      }
    }
  }, [isLoggedIn])

  useEffect(() => {
    if (graphVersions.length > 0 && isLoggedIn) {
      localStorage.setItem("graphVersions", JSON.stringify(graphVersions))
    }
  }, [graphVersions, isLoggedIn])

  const handleLogin = (credentials: { email: string; password: string }) => {
    // In a real app, this would validate against a backend
    const user = {
      email: credentials.email,
      name: credentials.email.split("@")[0].charAt(0).toUpperCase() + credentials.email.split("@")[0].slice(1),
    }
    setCurrentUser(user)
    setIsLoggedIn(true)
    localStorage.setItem("currentUser", JSON.stringify(user))
  }

  const handleLogout = () => {
    setIsLoggedIn(false)
    setCurrentUser(null)
    setGraphVersions([])
    setActiveVersionId("")
    setActiveTab("generate")
    localStorage.removeItem("currentUser")
    localStorage.removeItem("graphVersions")
  }

  if (!isLoggedIn) {
    return <LoginPage onLogin={handleLogin} />
  }

  const activeVersion = graphVersions.find((v) => v.id === activeVersionId)
  const mainVersion = graphVersions.find((v) => v.isMain)

  const generateKnowledgeGraph = async () => {
    if (!userInput.trim()) return

    setIsGenerating(true)
    try {
      const response = await fetch("/api/generate-graph", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userInput }),
      })

      if (!response.ok) throw new Error("Failed to generate graph")

      const data = await response.json()

      const newVersion: GraphVersion = {
        id: mainVersion?.id || "main",
        name: "Main Knowledge Graph",
        description: "Your primary knowledge graph",
        graph: data.graph,
        createdAt: new Date(),
        isMain: true,
      }

      if (mainVersion) {
        setGraphVersions((prev) => prev.map((v) => (v.isMain ? newVersion : v)))
      } else {
        setGraphVersions((prev) => [...prev, newVersion])
      }

      setActiveVersionId(newVersion.id)
      setActiveTab("graph")
    } catch (error) {
      console.error("Error generating graph:", error)
    } finally {
      setIsGenerating(false)
    }
  }

  const updateNodeProficiency = (nodeId: string, proficiency: GraphNode["proficiency"]) => {
    if (!activeVersion) return

    const updatedGraph = {
      ...activeVersion.graph,
      nodes: activeVersion.graph.nodes.map((node) => (node.id === nodeId ? { ...node, proficiency } : node)),
    }

    const updatedVersion = { ...activeVersion, graph: updatedGraph }
    setGraphVersions((prev) => prev.map((v) => (v.id === activeVersionId ? updatedVersion : v)))
  }

  const updateGraph = (newGraph: KnowledgeGraphData) => {
    if (!activeVersion) return

    const updatedVersion = { ...activeVersion, graph: newGraph }
    setGraphVersions((prev) => prev.map((v) => (v.id === activeVersionId ? updatedVersion : v)))
  }

  const duplicateGraph = () => {
    if (!activeVersion) return

    const newVersion: GraphVersion = {
      id: `version_${Date.now()}`,
      name: `${activeVersion.name} - Copy`,
      description: "Duplicated graph for roadmap customization",
      graph: JSON.parse(JSON.stringify(activeVersion.graph)),
      createdAt: new Date(),
      isMain: false,
    }

    setGraphVersions((prev) => [...prev, newVersion])
    setActiveVersionId(newVersion.id)
    setShowRoadmapGenerator(true)
  }

  const deleteVersion = (versionId: string) => {
    if (graphVersions.find((v) => v.id === versionId)?.isMain) return

    setGraphVersions((prev) => prev.filter((v) => v.id !== versionId))

    if (activeVersionId === versionId) {
      const mainVersion = graphVersions.find((v) => v.isMain)
      setActiveVersionId(mainVersion?.id || "")
    }
  }

  const updateVersionGraph = (versionId: string, newGraph: KnowledgeGraphData, name?: string, description?: string) => {
    setGraphVersions((prev) =>
      prev.map((v) =>
        v.id === versionId
          ? {
              ...v,
              graph: newGraph,
              name: name || v.name,
              description: description || v.description,
            }
          : v,
      ),
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        {/* Header with User Info */}
        <div className="flex justify-between items-center mb-8">
          <div className="text-center flex-1">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">Knowledge Graph AI</h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Tell the AI what you know, generate your personalized knowledge graph, and get AI-powered career guidance
              based on your skills.
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm text-gray-600">Welcome back,</p>
              <p className="font-medium text-gray-900">{currentUser?.name}</p>
            </div>
            <Button variant="outline" size="sm" onClick={handleLogout}>
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>

        {/* Version Management */}
        {graphVersions.length > 0 && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Graph Versions</span>
                <div className="flex gap-2">
                  <Button onClick={duplicateGraph} disabled={!activeVersion} size="sm" variant="outline">
                    <Copy className="w-4 h-4 mr-2" />
                    Duplicate & Customize
                  </Button>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {graphVersions.map((version) => (
                  <div key={version.id} className="flex items-center gap-2">
                    <Button
                      variant={activeVersionId === version.id ? "default" : "outline"}
                      size="sm"
                      onClick={() => setActiveVersionId(version.id)}
                      className="flex items-center gap-2"
                    >
                      {version.isMain && <Brain className="w-4 h-4" />}
                      {version.name}
                      <Badge variant="secondary" className="ml-1">
                        {version.graph.nodes.length} skills
                      </Badge>
                    </Button>
                    {!version.isMain && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteVersion(version.id)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-5 mb-8">
            <TabsTrigger value="generate" className="flex items-center gap-2">
              <Brain className="w-4 h-4" />
              Generate
            </TabsTrigger>
            <TabsTrigger value="graph" className="flex items-center gap-2">
              <Map className="w-4 h-4" />
              Knowledge Graph
            </TabsTrigger>
            <TabsTrigger value="chat" className="flex items-center gap-2">
              <MessageCircle className="w-4 h-4" />
              AI Chat
            </TabsTrigger>
            <TabsTrigger value="updates" className="flex items-center gap-2">
              <Newspaper className="w-4 h-4" />
              Updates
            </TabsTrigger>
            <TabsTrigger value="social" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              Social
            </TabsTrigger>
          </TabsList>

          <TabsContent value="generate" className="space-y-6">
            <Card className="max-w-2xl mx-auto">
              <CardHeader>
                <CardTitle>Generate Your Knowledge Graph</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Textarea
                  placeholder="Tell me about your knowledge and skills. For example: 'I know JavaScript, React, and basic Python. I'm interested in machine learning and have some experience with data analysis...'"
                  value={userInput}
                  onChange={(e) => setUserInput(e.target.value)}
                  rows={6}
                  className="w-full"
                />
                <Button
                  onClick={generateKnowledgeGraph}
                  disabled={isGenerating || !userInput.trim()}
                  className="w-full"
                  size="lg"
                >
                  {isGenerating ? "Generating Graph..." : "Generate Knowledge Graph"}
                </Button>

                {!mainVersion && (
                  <div className="text-center py-8">
                    <Brain className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">Start by describing your current knowledge and skills above</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="graph" className="space-y-6">
            {activeVersion ? (
              <KnowledgeGraph
                data={activeVersion.graph}
                onUpdateProficiency={updateNodeProficiency}
                onUpdateGraph={updateGraph}
                readOnly={false}
              />
            ) : (
              <div className="text-center py-16">
                <Map className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 mb-4">No knowledge graph generated yet</p>
                <Button onClick={() => setActiveTab("generate")}>Generate Your First Graph</Button>
              </div>
            )}
          </TabsContent>

          <TabsContent value="chat" className="space-y-6">
            {activeVersion ? (
              <ChatInterface knowledgeGraph={activeVersion.graph} />
            ) : (
              <div className="text-center py-16">
                <MessageCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 mb-4">Generate a knowledge graph first to start chatting</p>
                <Button onClick={() => setActiveTab("generate")}>Generate Knowledge Graph</Button>
              </div>
            )}
          </TabsContent>

          <TabsContent value="updates" className="space-y-6">
            <UpdatesPage userGraph={activeVersion?.graph} />
          </TabsContent>

          <TabsContent value="social" className="space-y-6">
            <SocialPage userGraph={activeVersion?.graph} />
          </TabsContent>
        </Tabs>

        <RoadmapGenerator
          isOpen={showRoadmapGenerator}
          onClose={() => setShowRoadmapGenerator(false)}
          baseGraph={activeVersion?.graph}
          onGraphUpdate={(newGraph, name, description) => {
            if (activeVersion) {
              updateVersionGraph(activeVersion.id, newGraph, name, description)
            }
          }}
        />
      </div>
    </div>
  )
}
