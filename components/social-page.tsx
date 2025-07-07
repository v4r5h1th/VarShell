"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Search, UserPlus, Eye, MessageCircle, TrendingUp } from "lucide-react"
import { KnowledgeGraph } from "@/components/knowledge-graph"
import type { KnowledgeGraphData } from "@/app/page"

interface Friend {
  id: string
  name: string
  avatar: string
  status: "online" | "offline"
  graph: KnowledgeGraphData
  recentActivity: string
  commonSkills: number
}

interface SocialPageProps {
  userGraph?: KnowledgeGraphData
}

// Mock friend data
const mockFriends: Friend[] = [
  {
    id: "1",
    name: "vejey Chen",
    avatar: "/placeholder.svg?height=40&width=40",
    status: "online",
    recentActivity: "Learning TypeScript",
    commonSkills: 8,
    graph: {
      nodes: [
        { id: "1", label: "JavaScript", proficiency: "expert", category: "Programming" },
        { id: "2", label: "React", proficiency: "advanced", category: "Frontend" },
        { id: "3", label: "Node.js", proficiency: "intermediate", category: "Backend" },
        { id: "4", label: "TypeScript", proficiency: "beginner", category: "Programming" },
        { id: "5", label: "GraphQL", proficiency: "intermediate", category: "API" },
        { id: "6", label: "MongoDB", proficiency: "intermediate", category: "Databases" },
        { id: "7", label: "Express.js", proficiency: "advanced", category: "Backend" },
        { id: "8", label: "CSS", proficiency: "advanced", category: "Frontend" },
      ],
      edges: [
        { source: "1", target: "2", relationship: "enables" },
        { source: "1", target: "3", relationship: "enables" },
        { source: "1", target: "4", relationship: "extends" },
        { source: "3", target: "7", relationship: "uses" },
        { source: "2", target: "8", relationship: "requires" },
      ],
    },
  },
  {
    id: "2",
    name: "demo2 Kim",
    avatar: "/placeholder.svg?height=40&width=40",
    status: "online",
    recentActivity: "Completed AWS certification",
    commonSkills: 5,
    graph: {
      nodes: [
        { id: "1", label: "Python", proficiency: "expert", category: "Programming" },
        { id: "2", label: "Machine Learning", proficiency: "advanced", category: "AI" },
        { id: "3", label: "AWS", proficiency: "advanced", category: "Cloud" },
        { id: "4", label: "Docker", proficiency: "intermediate", category: "DevOps" },
        { id: "5", label: "Kubernetes", proficiency: "beginner", category: "DevOps" },
        { id: "6", label: "TensorFlow", proficiency: "intermediate", category: "AI" },
        { id: "7", label: "PostgreSQL", proficiency: "advanced", category: "Databases" },
        { id: "8", label: "Pandas", proficiency: "expert", category: "Data Science" },
      ],
      edges: [
        { source: "1", target: "2", relationship: "enables" },
        { source: "3", target: "4", relationship: "supports" },
        { source: "4", target: "5", relationship: "leads_to" },
        { source: "2", target: "6", relationship: "uses" },
        { source: "1", target: "8", relationship: "enables" },
      ],
    },
  },
  {
    id: "3",
    name: "srivatsa Rodriguez",
    avatar: "/placeholder.svg?height=40&width=40",
    status: "offline",
    recentActivity: "Building mobile app",
    commonSkills: 3,
    graph: {
      nodes: [
        { id: "1", label: "Swift", proficiency: "expert", category: "Mobile" },
        { id: "2", label: "iOS Development", proficiency: "advanced", category: "Mobile" },
        { id: "3", label: "React Native", proficiency: "intermediate", category: "Mobile" },
        { id: "4", label: "Firebase", proficiency: "intermediate", category: "Backend" },
        { id: "5", label: "Xcode", proficiency: "advanced", category: "Development Tools" },
        { id: "6", label: "UIKit", proficiency: "expert", category: "Mobile" },
      ],
      edges: [
        { source: "1", target: "2", relationship: "enables" },
        { source: "3", target: "4", relationship: "integrates_with" },
        { source: "1", target: "6", relationship: "uses" },
        { source: "5", target: "2", relationship: "supports" },
      ],
    },
  },
]

export function SocialPage({ userGraph }: SocialPageProps) {
  const [selectedFriend, setSelectedFriend] = useState<Friend | null>(null)
  const [searchQuery, setSearchQuery] = useState("")

  const filteredFriends = mockFriends.filter((friend) => friend.name.toLowerCase().includes(searchQuery.toLowerCase()))

  const getCommonSkills = (friendGraph: KnowledgeGraphData) => {
    if (!userGraph) return []

    const userSkills = userGraph.nodes.map((node) => node.label.toLowerCase())
    const friendSkills = friendGraph.nodes.filter((node) => userSkills.includes(node.label.toLowerCase()))

    return friendSkills
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold">Social Learning Network</h2>
        <Button>
          <UserPlus className="w-4 h-4 mr-2" />
          Add Friends
        </Button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
        <Input
          placeholder="Search friends..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Friends List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredFriends.map((friend) => {
          const commonSkills = getCommonSkills(friend.graph)

          return (
            <Card key={friend.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <Avatar>
                      <AvatarImage src={friend.avatar || "/placeholder.svg"} alt={friend.name} />
                      <AvatarFallback>
                        {friend.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </AvatarFallback>
                    </Avatar>
                    <div
                      className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-white ${
                        friend.status === "online" ? "bg-green-500" : "bg-gray-400"
                      }`}
                    />
                  </div>
                  <div className="flex-1">
                    <CardTitle className="text-lg">{friend.name}</CardTitle>
                    <p className="text-sm text-gray-600">{friend.recentActivity}</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between items-center">
                  <Badge variant="outline">{friend.graph.nodes.length} skills</Badge>
                  {commonSkills.length > 0 && <Badge variant="secondary">{commonSkills.length} in common</Badge>}
                </div>

                {/* Common Skills Preview */}
                {commonSkills.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-gray-600">Shared Skills:</p>
                    <div className="flex flex-wrap gap-1">
                      {commonSkills.slice(0, 3).map((skill) => (
                        <Badge key={skill.id} variant="outline" className="text-xs">
                          {skill.label}
                        </Badge>
                      ))}
                      {commonSkills.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{commonSkills.length - 3} more
                        </Badge>
                      )}
                    </div>
                  </div>
                )}

                <div className="flex gap-2">
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm" className="flex-1 bg-transparent">
                        <Eye className="w-4 h-4 mr-2" />
                        View Graph
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle>{friend.name}'s Knowledge Graph</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <KnowledgeGraph
                          data={friend.graph}
                          onUpdateProficiency={() => {}}
                          onUpdateGraph={() => {}}
                          readOnly={true}
                        />
                      </div>
                    </DialogContent>
                  </Dialog>

                  <Button variant="outline" size="sm">
                    <MessageCircle className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Learning Insights */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Learning Insights
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">12</div>
              <div className="text-sm text-gray-600">Skills in common with friends</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">5</div>
              <div className="text-sm text-gray-600">Friends learning similar topics</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">3</div>
              <div className="text-sm text-gray-600">Trending skills in your network</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
