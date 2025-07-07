"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Loader2, Wand2, Save, X } from "lucide-react"
import { KnowledgeGraph } from "@/components/knowledge-graph"
import type { KnowledgeGraphData } from "@/app/page"

interface RoadmapGeneratorProps {
  isOpen: boolean
  onClose: () => void
  baseGraph?: KnowledgeGraphData
  onGraphUpdate: (graph: KnowledgeGraphData, name: string, description: string) => void
}

export function RoadmapGenerator({ isOpen, onClose, baseGraph, onGraphUpdate }: RoadmapGeneratorProps) {
  const [roadmapPrompt, setRoadmapPrompt] = useState("")
  const [generatedGraph, setGeneratedGraph] = useState<KnowledgeGraphData | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [graphName, setGraphName] = useState("")
  const [graphDescription, setGraphDescription] = useState("")

  const popularRoadmaps = [
    "Full Stack Web Developer",
    "Data Scientist",
    "Machine Learning Engineer",
    "DevOps Engineer",
    "Mobile App Developer",
    "Cybersecurity Specialist",
    "Cloud Architect",
    "AI/ML Researcher",
  ]

  const generateRoadmap = async () => {
    if (!roadmapPrompt.trim() || !baseGraph) return

    setIsGenerating(true)
    try {
      const response = await fetch("/api/generate-roadmap", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          baseGraph,
          roadmapGoal: roadmapPrompt,
        }),
      })

      if (!response.ok) throw new Error("Failed to generate roadmap")

      const data = await response.json()
      setGeneratedGraph(data.graph)
      setGraphName(data.name || `${roadmapPrompt} Roadmap`)
      setGraphDescription(data.description || `Customized roadmap for ${roadmapPrompt}`)
    } catch (error) {
      console.error("Error generating roadmap:", error)
    } finally {
      setIsGenerating(false)
    }
  }

  const saveRoadmap = () => {
    if (generatedGraph && graphName) {
      onGraphUpdate(generatedGraph, graphName, graphDescription)
      onClose()
      // Reset state
      setRoadmapPrompt("")
      setGeneratedGraph(null)
      setGraphName("")
      setGraphDescription("")
    }
  }

  const handleClose = () => {
    onClose()
    // Reset state
    setRoadmapPrompt("")
    setGeneratedGraph(null)
    setGraphName("")
    setGraphDescription("")
  }

  // Get highlighted nodes (existing skills from base graph)
  const getHighlightedNodes = () => {
    if (!baseGraph || !generatedGraph) return []

    const baseSkills = baseGraph.nodes.map((node) => node.label.toLowerCase())
    return generatedGraph.nodes.filter((node) => baseSkills.includes(node.label.toLowerCase())).map((node) => node.id)
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex justify-between items-center">
            <DialogTitle>AI Roadmap Generator</DialogTitle>
            <Button variant="ghost" size="sm" onClick={handleClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {!generatedGraph ? (
            <>
              {/* Roadmap Input */}
              <Card>
                <CardHeader>
                  <CardTitle>What do you want to learn?</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Textarea
                    placeholder="Describe your learning goal. For example: 'I want to become a full-stack web developer' or 'Help me transition into data science'"
                    value={roadmapPrompt}
                    onChange={(e) => setRoadmapPrompt(e.target.value)}
                    rows={4}
                  />

                  <div className="space-y-2">
                    <p className="text-sm font-medium">Popular Roadmaps:</p>
                    <div className="flex flex-wrap gap-2">
                      {popularRoadmaps.map((roadmap) => (
                        <Badge
                          key={roadmap}
                          variant="outline"
                          className="cursor-pointer hover:bg-blue-50"
                          onClick={() => setRoadmapPrompt(`I want to become a ${roadmap}`)}
                        >
                          {roadmap}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <Button onClick={generateRoadmap} disabled={isGenerating || !roadmapPrompt.trim()} className="w-full">
                    {isGenerating ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Generating Personalized Roadmap...
                      </>
                    ) : (
                      <>
                        <Wand2 className="w-4 h-4 mr-2" />
                        Generate AI Roadmap
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>

              {/* Current Knowledge Preview */}
              {baseGraph && (
                <Card>
                  <CardHeader>
                    <CardTitle>Your Current Knowledge</CardTitle>
                    <p className="text-sm text-gray-600">
                      The AI will build upon these skills to create your personalized roadmap
                    </p>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {baseGraph.nodes.map((node) => (
                        <Badge
                          key={node.id}
                          variant="outline"
                          className={`${
                            node.proficiency === "expert"
                              ? "bg-green-100 text-green-800"
                              : node.proficiency === "advanced"
                                ? "bg-blue-100 text-blue-800"
                                : node.proficiency === "intermediate"
                                  ? "bg-yellow-100 text-yellow-800"
                                  : "bg-red-100 text-red-800"
                          }`}
                        >
                          {node.label}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          ) : (
            <>
              {/* Generated Roadmap */}
              <div className="space-y-4">
                <div className="flex justify-between items-start">
                  <div className="space-y-2">
                    <Input
                      value={graphName}
                      onChange={(e) => setGraphName(e.target.value)}
                      placeholder="Roadmap name"
                      className="text-lg font-semibold"
                    />
                    <Input
                      value={graphDescription}
                      onChange={(e) => setGraphDescription(e.target.value)}
                      placeholder="Description"
                      className="text-sm"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={() => setGeneratedGraph(null)} variant="outline">
                      Regenerate
                    </Button>
                    <Button onClick={saveRoadmap}>
                      <Save className="w-4 h-4 mr-2" />
                      Save Roadmap
                    </Button>
                  </div>
                </div>

                <KnowledgeGraph
                  data={generatedGraph}
                  onUpdateProficiency={() => {}}
                  onUpdateGraph={() => {}}
                  readOnly={true}
                  highlightedNodes={getHighlightedNodes()}
                />
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
