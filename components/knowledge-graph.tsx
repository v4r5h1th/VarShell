"use client"

import type React from "react"

import { useEffect, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { BookOpen, ExternalLink, Loader2, Plus, Trash2, Edit3, Save, X } from "lucide-react"
import type { KnowledgeGraphData, GraphNode } from "@/app/page"

interface KnowledgeGraphProps {
  data: KnowledgeGraphData
  onUpdateProficiency: (nodeId: string, proficiency: GraphNode["proficiency"]) => void
  onUpdateGraph: (newGraph: KnowledgeGraphData) => void
  readOnly?: boolean
  highlightedNodes?: string[] // For roadmap visualization
}

interface Resource {
  title: string
  url: string
  description: string
}

const proficiencyColors = {
  not_started: "#9ca3af",
  beginner: "#ef4444",
  intermediate: "#f59e0b",
  advanced: "#3b82f6",
  expert: "#10b981",
}

const proficiencyLabels = {
  not_started: "Not Started",
  beginner: "Beginner",
  intermediate: "Intermediate",
  advanced: "Advanced",
  expert: "Expert",
}

const categories = [
  "Programming Languages",
  "Web Development",
  "Mobile Development",
  "Data Science",
  "Machine Learning",
  "Cloud Computing",
  "Databases",
  "DevOps",
  "Design",
  "Cybersecurity",
  "AI/ML",
  "Backend Development",
  "Frontend Development",
  "Development Tools",
  "General",
]

export function KnowledgeGraph({
  data,
  onUpdateProficiency,
  onUpdateGraph,
  readOnly = false,
  highlightedNodes = [],
}: KnowledgeGraphProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null)
  const [hoveredNode, setHoveredNode] = useState<string | null>(null)
  const [resources, setResources] = useState<{ [nodeId: string]: Resource[] }>({})
  const [loadingResources, setLoadingResources] = useState<string | null>(null)
  const [resourceDialogOpen, setResourceDialogOpen] = useState(false)
  const [currentResourceNode, setCurrentResourceNode] = useState<GraphNode | null>(null)
  const [addNodeDialogOpen, setAddNodeDialogOpen] = useState(false)
  const [editNodeDialogOpen, setEditNodeDialogOpen] = useState(false)
  const [editingNode, setEditingNode] = useState<GraphNode | null>(null)
  const [newNodeData, setNewNodeData] = useState({
    label: "",
    proficiency: "not_started" as GraphNode["proficiency"],
    category: "General",
  })

  // Force-directed layout algorithm for better spacing
  const calculateNodePositions = (nodes: GraphNode[], edges: any[], canvasWidth: number, canvasHeight: number) => {
    const nodeCount = nodes.length
    if (nodeCount === 0) return nodes

    // Initialize positions if not set
    const positionedNodes = nodes.map((node, index) => {
      if (node.x === undefined || node.y === undefined) {
        // Use grid layout for better initial distribution
        const cols = Math.ceil(Math.sqrt(nodeCount))
        const rows = Math.ceil(nodeCount / cols)

        const col = index % cols
        const row = Math.floor(index / cols)

        const paddingX = 80
        const paddingY = 80
        const spacingX = (canvasWidth - 2 * paddingX) / Math.max(1, cols - 1)
        const spacingY = (canvasHeight - 2 * paddingY) / Math.max(1, rows - 1)

        return {
          ...node,
          x: paddingX + col * spacingX,
          y: paddingY + row * spacingY,
          vx: 0,
          vy: 0,
        }
      }
      return { ...node, vx: 0, vy: 0 }
    })

    // Force-directed layout simulation with better parameters
    const iterations = 150
    const repulsionStrength = 12000
    const attractionStrength = 0.05
    const minDistance = 140 // Increased minimum distance

    for (let iter = 0; iter < iterations; iter++) {
      // Reset forces
      positionedNodes.forEach((node) => {
        node.vx = 0
        node.vy = 0
      })

      // Repulsion forces (keep nodes apart)
      for (let i = 0; i < positionedNodes.length; i++) {
        for (let j = i + 1; j < positionedNodes.length; j++) {
          const nodeA = positionedNodes[i]
          const nodeB = positionedNodes[j]

          const dx = nodeA.x! - nodeB.x!
          const dy = nodeA.y! - nodeB.y!
          const distance = Math.sqrt(dx * dx + dy * dy)

          if (distance < minDistance && distance > 0) {
            const force = repulsionStrength / (distance * distance)
            const fx = (dx / distance) * force
            const fy = (dy / distance) * force

            nodeA.vx! += fx
            nodeA.vy! += fy
            nodeB.vx! -= fx
            nodeB.vy! -= fy
          }
        }
      }

      // Attraction forces for connected nodes
      edges.forEach((edge) => {
        const sourceNode = positionedNodes.find((n) => n.id === edge.source)
        const targetNode = positionedNodes.find((n) => n.id === edge.target)

        if (sourceNode && targetNode) {
          const dx = targetNode.x! - sourceNode.x!
          const dy = targetNode.y! - sourceNode.y!
          const distance = Math.sqrt(dx * dx + dy * dy)

          if (distance > 0) {
            const force = attractionStrength * distance
            const fx = (dx / distance) * force
            const fy = (dy / distance) * force

            sourceNode.vx! += fx
            sourceNode.vy! += fy
            targetNode.vx! -= fx
            targetNode.vy! -= fy
          }
        }
      })

      // Apply forces and update positions
      positionedNodes.forEach((node) => {
        node.x! += node.vx! * 0.08
        node.y! += node.vy! * 0.08

        // Keep nodes within canvas bounds with more padding
        const margin = 70
        node.x! = Math.max(margin, Math.min(canvasWidth - margin, node.x!))
        node.y! = Math.max(margin, Math.min(canvasHeight - margin, node.y!))
      })
    }

    return positionedNodes.map(({ vx, vy, ...node }) => node)
  }

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Set canvas size
    canvas.width = canvas.offsetWidth
    canvas.height = Math.max(700, canvas.offsetHeight) // Increased height for better spacing

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // Calculate better node positions
    const nodes = calculateNodePositions(data.nodes, data.edges, canvas.width, canvas.height)

    // Draw edges
    ctx.strokeStyle = "#e5e7eb"
    ctx.lineWidth = 2
    data.edges.forEach((edge) => {
      const sourceNode = nodes.find((n) => n.id === edge.source)
      const targetNode = nodes.find((n) => n.id === edge.target)

      if (sourceNode && targetNode && sourceNode.x && sourceNode.y && targetNode.x && targetNode.y) {
        ctx.beginPath()
        ctx.moveTo(sourceNode.x, sourceNode.y)
        ctx.lineTo(targetNode.x, targetNode.y)
        ctx.stroke()
      }
    })

    // Draw nodes
    nodes.forEach((node) => {
      if (!node.x || !node.y) return

      const isHovered = hoveredNode === node.id
      const isHighlighted = highlightedNodes.includes(node.id)
      const radius = isHovered ? 35 : 30 // Reduced from 45/40 to 35/30

      // Determine node color
      let nodeColor
      if (isHighlighted) {
        nodeColor = proficiencyColors[node.proficiency] // Highlighted nodes show their actual proficiency
      } else if (highlightedNodes.length > 0) {
        nodeColor = "#9ca3af" // Grey for non-highlighted nodes in roadmap mode
      } else {
        nodeColor = proficiencyColors[node.proficiency] // Normal mode
      }

      // Node circle
      ctx.beginPath()
      ctx.arc(node.x, node.y, radius, 0, 2 * Math.PI)
      ctx.fillStyle = nodeColor
      ctx.fill()
      ctx.strokeStyle = isHovered ? "#374151" : "#6b7280"
      ctx.lineWidth = isHovered ? 3 : 2
      ctx.stroke()

      // Node label
      ctx.fillStyle = "#ffffff"
      ctx.font = isHovered ? "bold 11px sans-serif" : "10px sans-serif" // Reduced font size
      ctx.textAlign = "center"
      ctx.textBaseline = "middle"

      // Wrap text if too long
      const maxWidth = radius * 1.6 // Adjusted for smaller radius
      const words = node.label.split(" ")
      let line = ""
      const y = node.y

      if (words.length === 1 || ctx.measureText(node.label).width <= maxWidth) {
        ctx.fillText(node.label, node.x, y)
      } else {
        const lines: string[] = []
        words.forEach((word) => {
          const testLine = line + word + " "
          if (ctx.measureText(testLine).width > maxWidth && line !== "") {
            lines.push(line.trim())
            line = word + " "
          } else {
            line = testLine
          }
        })
        lines.push(line.trim())

        const lineHeight = 12 // Reduced line height
        const startY = y - ((lines.length - 1) * lineHeight) / 2

        lines.forEach((line, index) => {
          ctx.fillText(line, node.x, startY + index * lineHeight)
        })
      }
    })

    // Update node positions in data
    data.nodes.forEach((node, index) => {
      if (nodes[index]) {
        node.x = nodes[index].x
        node.y = nodes[index].y
      }
    })
  }, [data, hoveredNode, highlightedNodes])

  const handleCanvasClick = (event: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const x = event.clientX - rect.left
    const y = event.clientY - rect.top

    const clickedNode = data.nodes.find((node) => {
      if (!node.x || !node.y) return false
      const distance = Math.sqrt((x - node.x) ** 2 + (y - node.y) ** 2)
      return distance <= 30 // Updated for smaller radius
    })

    if (clickedNode) {
      setSelectedNode(clickedNode)
    }
  }

  const handleCanvasMouseMove = (event: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const x = event.clientX - rect.left
    const y = event.clientY - rect.top

    const hoveredNode = data.nodes.find((node) => {
      if (!node.x || !node.y) return false
      const distance = Math.sqrt((x - node.x) ** 2 + (y - node.y) ** 2)
      return distance <= 30 // Updated for smaller radius
    })

    setHoveredNode(hoveredNode?.id || null)
    canvas.style.cursor = hoveredNode ? "pointer" : "default"
  }

  const fetchResources = async (node: GraphNode) => {
    setCurrentResourceNode(node)
    setResourceDialogOpen(true)

    if (resources[node.id]) return

    setLoadingResources(node.id)
    try {
      const response = await fetch("/api/get-resources", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          skill: node.label,
          proficiency: node.proficiency,
          category: node.category,
        }),
      })

      if (!response.ok) throw new Error("Failed to fetch resources")

      const data = await response.json()
      setResources((prev) => ({
        ...prev,
        [node.id]: data.resources,
      }))
    } catch (error) {
      console.error("Error fetching resources:", error)
      setResources((prev) => ({
        ...prev,
        [node.id]: [
          {
            title: `Learn ${node.label} - Official Documentation`,
            url: `https://www.google.com/search?q=${encodeURIComponent(node.label + " official documentation")}`,
            description: "Official documentation and getting started guide",
          },
          {
            title: `${node.label} Tutorial for ${proficiencyLabels[node.proficiency]}s`,
            url: `https://www.google.com/search?q=${encodeURIComponent(node.label + " tutorial " + node.proficiency)}`,
            description: `${proficiencyLabels[node.proficiency]} level tutorial and examples`,
          },
          {
            title: `${node.label} Practice Exercises`,
            url: `https://www.google.com/search?q=${encodeURIComponent(node.label + " practice exercises coding")}`,
            description: "Hands-on practice and coding exercises",
          },
        ],
      }))
    } finally {
      setLoadingResources(null)
    }
  }

  const addNode = () => {
    if (!newNodeData.label.trim()) return

    const newNode: GraphNode = {
      id: `node_${Date.now()}`,
      label: newNodeData.label,
      proficiency: newNodeData.proficiency,
      category: newNodeData.category,
      resources: [],
    }

    const updatedGraph = {
      ...data,
      nodes: [...data.nodes, newNode],
    }

    onUpdateGraph(updatedGraph)
    setAddNodeDialogOpen(false)
    setNewNodeData({ label: "", proficiency: "not_started", category: "General" })
  }

  const deleteNode = (nodeId: string) => {
    const updatedGraph = {
      nodes: data.nodes.filter((node) => node.id !== nodeId),
      edges: data.edges.filter((edge) => edge.source !== nodeId && edge.target !== nodeId),
    }

    onUpdateGraph(updatedGraph)
  }

  const editNode = (node: GraphNode) => {
    setEditingNode(node)
    setEditNodeDialogOpen(true)
  }

  const saveEditedNode = () => {
    if (!editingNode) return

    const updatedGraph = {
      ...data,
      nodes: data.nodes.map((node) => (node.id === editingNode.id ? editingNode : node)),
    }

    onUpdateGraph(updatedGraph)
    setEditNodeDialogOpen(false)
    setEditingNode(null)
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold">Your Knowledge Graph</h2>
        {!readOnly && (
          <Button onClick={() => setAddNodeDialogOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add Skill
          </Button>
        )}
      </div>

      {/* Legend */}
      <div className="flex gap-2">
        <Badge variant="outline" className="bg-gray-100 text-gray-800">
          Not Started
        </Badge>
        <Badge variant="outline" className="bg-red-100 text-red-800">
          Beginner
        </Badge>
        <Badge variant="outline" className="bg-yellow-100 text-yellow-800">
          Intermediate
        </Badge>
        <Badge variant="outline" className="bg-blue-100 text-blue-800">
          Advanced
        </Badge>
        <Badge variant="outline" className="bg-green-100 text-green-800">
          Expert
        </Badge>
        {highlightedNodes.length > 0 && (
          <Badge variant="outline" className="bg-gray-100 text-gray-800">
            Grey = Skills to Learn
          </Badge>
        )}
      </div>

      {/* Canvas */}
      <Card>
        <CardContent className="p-0">
          <canvas
            ref={canvasRef}
            className="w-full h-[700px] border rounded-lg bg-gradient-to-br from-gray-50 to-white"
            onClick={handleCanvasClick}
            onMouseMove={handleCanvasMouseMove}
            onMouseLeave={() => setHoveredNode(null)}
          />
        </CardContent>
      </Card>

      {/* Skill Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {data.nodes.map((node) => (
          <Card key={node.id} className="cursor-pointer hover:shadow-md transition-shadow">
            <CardHeader className="pb-2">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <CardTitle className="text-sm">{node.label}</CardTitle>
                  <p className="text-xs text-gray-500">{node.category}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge style={{ backgroundColor: proficiencyColors[node.proficiency] }} className="text-white">
                    {proficiencyLabels[node.proficiency]}
                  </Badge>
                  {!readOnly && (
                    <div className="flex gap-1">
                      <Button variant="ghost" size="sm" onClick={() => editNode(node)} className="h-6 w-6 p-0">
                        <Edit3 className="w-3 h-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteNode(node.id)}
                        className="h-6 w-6 p-0 text-red-600"
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-2">
                {!readOnly && (
                  <Select
                    value={node.proficiency}
                    onValueChange={(value) => onUpdateProficiency(node.id, value as GraphNode["proficiency"])}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="not_started">⚪ Not Started</SelectItem>
                      <SelectItem value="beginner">🔴 Beginner</SelectItem>
                      <SelectItem value="intermediate">🟡 Intermediate</SelectItem>
                      <SelectItem value="advanced">🔵 Advanced</SelectItem>
                      <SelectItem value="expert">🟢 Expert</SelectItem>
                    </SelectContent>
                  </Select>
                )}

                <Button
                  variant="outline"
                  size="sm"
                  className="w-full bg-transparent"
                  onClick={() => fetchResources(node)}
                  disabled={loadingResources === node.id}
                >
                  {loadingResources === node.id ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <BookOpen className="w-4 h-4 mr-2" />
                  )}
                  {loadingResources === node.id ? "Loading..." : "Get Resources"}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Add Node Dialog */}
      <Dialog open={addNodeDialogOpen} onOpenChange={setAddNodeDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add New Skill</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Skill Name</label>
              <Input
                placeholder="e.g., React.js, Python, Machine Learning"
                value={newNodeData.label}
                onChange={(e) => setNewNodeData({ ...newNodeData, label: e.target.value })}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Proficiency Level</label>
              <Select
                value={newNodeData.proficiency}
                onValueChange={(value) =>
                  setNewNodeData({ ...newNodeData, proficiency: value as GraphNode["proficiency"] })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="not_started">⚪ Not Started</SelectItem>
                  <SelectItem value="beginner">🔴 Beginner</SelectItem>
                  <SelectItem value="intermediate">🟡 Intermediate</SelectItem>
                  <SelectItem value="advanced">🔵 Advanced</SelectItem>
                  <SelectItem value="expert">🟢 Expert</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Category</label>
              <Select
                value={newNodeData.category}
                onValueChange={(value) => setNewNodeData({ ...newNodeData, category: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2 pt-4">
              <Button onClick={() => setAddNodeDialogOpen(false)} variant="outline" className="flex-1">
                Cancel
              </Button>
              <Button onClick={addNode} disabled={!newNodeData.label.trim()} className="flex-1">
                Add Skill
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Node Dialog */}
      <Dialog open={editNodeDialogOpen} onOpenChange={setEditNodeDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Skill</DialogTitle>
          </DialogHeader>
          {editingNode && (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Skill Name</label>
                <Input
                  value={editingNode.label}
                  onChange={(e) => setEditingNode({ ...editingNode, label: e.target.value })}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Proficiency Level</label>
                <Select
                  value={editingNode.proficiency}
                  onValueChange={(value) =>
                    setEditingNode({ ...editingNode, proficiency: value as GraphNode["proficiency"] })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="not_started">⚪ Not Started</SelectItem>
                    <SelectItem value="beginner">🔴 Beginner</SelectItem>
                    <SelectItem value="intermediate">🟡 Intermediate</SelectItem>
                    <SelectItem value="advanced">🔵 Advanced</SelectItem>
                    <SelectItem value="expert">🟢 Expert</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Category</label>
                <Select
                  value={editingNode.category}
                  onValueChange={(value) => setEditingNode({ ...editingNode, category: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex gap-2 pt-4">
                <Button onClick={() => setEditNodeDialogOpen(false)} variant="outline" className="flex-1">
                  <X className="w-4 h-4 mr-2" />
                  Cancel
                </Button>
                <Button onClick={saveEditedNode} className="flex-1">
                  <Save className="w-4 h-4 mr-2" />
                  Save Changes
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Resources Dialog */}
      <Dialog open={resourceDialogOpen} onOpenChange={setResourceDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <BookOpen className="w-5 h-5" />
              Learning Resources for {currentResourceNode?.label}
            </DialogTitle>
            <p className="text-sm text-gray-600">
              Curated resources for {currentResourceNode ? proficiencyLabels[currentResourceNode.proficiency] : ""}{" "}
              level
              {currentResourceNode?.category && ` in ${currentResourceNode.category}`}
            </p>
          </DialogHeader>
          <div className="space-y-4">
            {loadingResources === currentResourceNode?.id ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4 text-blue-500" />
                  <p className="text-lg font-medium">Finding the best resources...</p>
                  <p className="text-sm text-gray-600">This may take a few seconds</p>
                </div>
              </div>
            ) : currentResourceNode && resources[currentResourceNode.id] ? (
              <div className="grid gap-4">
                {resources[currentResourceNode.id].map((resource, index) => (
                  <Card key={index} className="p-4 hover:shadow-md transition-shadow border-l-4 border-l-blue-500">
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0 w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                        <ExternalLink className="w-5 h-5 text-blue-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-base mb-2 text-gray-900">{resource.title}</h4>
                        <p className="text-sm text-gray-600 mb-3 leading-relaxed">{resource.description}</p>
                        <a
                          href={resource.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 text-sm font-medium underline decoration-2 underline-offset-2"
                        >
                          Visit Resource
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 text-lg">No resources loaded yet</p>
                <p className="text-gray-400 text-sm">Click "Get Resources" to load learning materials</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
