"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Newspaper,
  Briefcase,
  BookOpen,
  TrendingUp,
  ExternalLink,
  RefreshCw,
  Clock,
  MapPin,
  DollarSign,
  Star,
} from "lucide-react"
import type { KnowledgeGraphData } from "@/app/page"

interface UpdatesPageProps {
  userGraph?: KnowledgeGraphData
}

interface Article {
  id: string
  title: string
  summary: string
  url: string
  source: string
  publishedAt: string
  relevantSkills: string[]
  category: "news" | "tutorial" | "trend"
}

interface JobPosting {
  id: string
  title: string
  company: string
  location: string
  salary: string
  description: string
  requiredSkills: string[]
  matchPercentage: number
  postedAt: string
  url: string
}

interface Course {
  id: string
  title: string
  provider: string
  description: string
  level: string
  duration: string
  rating: number
  price: string
  relevantSkills: string[]
  url: string
}

// Mock data - in real app, this would come from APIs
const mockArticles: Article[] = [
  {
    id: "1",
    title: "React 19 Beta Released: New Features and Breaking Changes",
    summary:
      "React 19 introduces new hooks, improved server components, and better TypeScript support. Learn about the key changes and migration path.",
    url: "https://react.dev/blog/2024/04/25/react-19",
    source: "React Blog",
    publishedAt: "2024-01-15",
    relevantSkills: ["React.js", "JavaScript", "TypeScript"],
    category: "news",
  },
  {
    id: "2",
    title: "Machine Learning Trends 2024: What's Next in AI",
    summary:
      "Explore the latest trends in machine learning including large language models, computer vision advances, and ethical AI practices.",
    url: "https://example.com/ml-trends-2024",
    source: "AI Weekly",
    publishedAt: "2024-01-14",
    relevantSkills: ["Machine Learning", "Python", "AI/ML"],
    category: "trend",
  },
  {
    id: "3",
    title: "Complete Guide to Node.js Performance Optimization",
    summary:
      "Learn advanced techniques for optimizing Node.js applications including clustering, caching, and database optimization strategies.",
    url: "https://example.com/nodejs-performance",
    source: "Dev.to",
    publishedAt: "2024-01-13",
    relevantSkills: ["Node.js", "JavaScript", "Backend Development"],
    category: "tutorial",
  },
]

const mockJobs: JobPosting[] = [
  {
    id: "1",
    title: "Senior Full Stack Developer",
    company: "TechCorp Inc.",
    location: "San Francisco, CA",
    salary: "$120k - $160k",
    description:
      "We're looking for a senior full stack developer to join our growing team. You'll work on cutting-edge web applications using React, Node.js, and cloud technologies.",
    requiredSkills: ["React.js", "Node.js", "JavaScript", "TypeScript", "AWS"],
    matchPercentage: 85,
    postedAt: "2024-01-15",
    url: "https://example.com/job/1",
  },
  {
    id: "2",
    title: "Machine Learning Engineer",
    company: "AI Innovations",
    location: "Remote",
    salary: "$140k - $180k",
    description:
      "Join our ML team to build next-generation AI products. Experience with Python, TensorFlow, and cloud platforms required.",
    requiredSkills: ["Python", "Machine Learning", "TensorFlow", "AWS", "Data Science"],
    matchPercentage: 72,
    postedAt: "2024-01-14",
    url: "https://example.com/job/2",
  },
  {
    id: "3",
    title: "Frontend Developer",
    company: "StartupXYZ",
    location: "New York, NY",
    salary: "$90k - $120k",
    description:
      "Build beautiful, responsive web applications using modern frontend technologies. Great opportunity for growth in a fast-paced startup environment.",
    requiredSkills: ["React.js", "JavaScript", "CSS", "HTML"],
    matchPercentage: 90,
    postedAt: "2024-01-13",
    url: "https://example.com/job/3",
  },
]

const mockCourses: Course[] = [
  {
    id: "1",
    title: "Advanced React Patterns and Performance",
    provider: "Frontend Masters",
    description:
      "Master advanced React concepts including render optimization, custom hooks, and architectural patterns for large applications.",
    level: "Advanced",
    duration: "6 hours",
    rating: 4.8,
    price: "$39/month",
    relevantSkills: ["React.js", "JavaScript", "Web Development"],
    url: "https://example.com/course/1",
  },
  {
    id: "2",
    title: "Machine Learning with Python",
    provider: "Coursera",
    description:
      "Complete introduction to machine learning using Python, scikit-learn, and TensorFlow. Includes hands-on projects and real-world applications.",
    level: "Beginner",
    duration: "40 hours",
    rating: 4.6,
    price: "Free",
    relevantSkills: ["Python", "Machine Learning", "Data Science"],
    url: "https://example.com/course/2",
  },
  {
    id: "3",
    title: "Node.js Microservices Architecture",
    provider: "Udemy",
    description:
      "Learn to build scalable microservices with Node.js, Docker, and Kubernetes. Covers API design, testing, and deployment strategies.",
    level: "Intermediate",
    duration: "12 hours",
    rating: 4.7,
    price: "$89.99",
    relevantSkills: ["Node.js", "Docker", "Kubernetes", "Backend Development"],
    url: "https://example.com/course/3",
  },
]

export function UpdatesPage({ userGraph }: UpdatesPageProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [lastUpdated, setLastUpdated] = useState(new Date())

  const userSkills = userGraph?.nodes.map((node) => node.label) || []

  const getRelevantContent = (items: any[], skillsField: string) => {
    if (userSkills.length === 0) return items

    return items
      .map((item) => ({
        ...item,
        relevanceScore: item[skillsField].filter((skill: string) =>
          userSkills.some(
            (userSkill) =>
              userSkill.toLowerCase().includes(skill.toLowerCase()) ||
              skill.toLowerCase().includes(userSkill.toLowerCase()),
          ),
        ).length,
      }))
      .filter((item) => item.relevanceScore > 0)
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
  }

  const relevantArticles = getRelevantContent(mockArticles, "relevantSkills")
  const relevantJobs = getRelevantContent(mockJobs, "requiredSkills")
  const relevantCourses = getRelevantContent(mockCourses, "relevantSkills")

  const refreshUpdates = async () => {
    setIsLoading(true)
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 2000))
    setLastUpdated(new Date())
    setIsLoading(false)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })
  }

  const getMatchColor = (percentage: number) => {
    if (percentage >= 80) return "bg-green-100 text-green-800"
    if (percentage >= 60) return "bg-yellow-100 text-yellow-800"
    return "bg-red-100 text-red-800"
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-semibold">Personalized Updates</h2>
          <p className="text-gray-600 mt-1">AI-curated content based on your knowledge graph</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-sm text-gray-500 flex items-center gap-2">
            <Clock className="w-4 h-4" />
            Last updated: {lastUpdated.toLocaleTimeString()}
          </div>
          <Button onClick={refreshUpdates} disabled={isLoading} variant="outline" size="sm">
            <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Skills Summary */}
      {userSkills.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Tracking Updates For</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {userSkills.slice(0, 10).map((skill, index) => (
                <Badge key={index} variant="outline" className="bg-blue-50 text-blue-700">
                  {skill}
                </Badge>
              ))}
              {userSkills.length > 10 && (
                <Badge variant="outline" className="bg-gray-50 text-gray-600">
                  +{userSkills.length - 10} more
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Content Tabs */}
      <Tabs defaultValue="articles" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="articles" className="flex items-center gap-2">
            <Newspaper className="w-4 h-4" />
            Articles ({relevantArticles.length})
          </TabsTrigger>
          <TabsTrigger value="jobs" className="flex items-center gap-2">
            <Briefcase className="w-4 h-4" />
            Jobs ({relevantJobs.length})
          </TabsTrigger>
          <TabsTrigger value="courses" className="flex items-center gap-2">
            <BookOpen className="w-4 h-4" />
            Courses ({relevantCourses.length})
          </TabsTrigger>
        </TabsList>

        {/* Articles Tab */}
        <TabsContent value="articles" className="space-y-4">
          {relevantArticles.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <Newspaper className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No relevant articles found</p>
                <p className="text-sm text-gray-400">
                  Add more skills to your knowledge graph to see personalized content
                </p>
              </CardContent>
            </Card>
          ) : (
            relevantArticles.map((article) => (
              <Card key={article.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                      {article.category === "news" && <Newspaper className="w-6 h-6 text-blue-600" />}
                      {article.category === "tutorial" && <BookOpen className="w-6 h-6 text-blue-600" />}
                      {article.category === "trend" && <TrendingUp className="w-6 h-6 text-blue-600" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="font-semibold text-lg text-gray-900 leading-tight">{article.title}</h3>
                        <Badge variant="outline" className="ml-2 flex-shrink-0">
                          {article.category}
                        </Badge>
                      </div>
                      <p className="text-gray-600 mb-3 leading-relaxed">{article.summary}</p>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4 text-sm text-gray-500">
                          <span>{article.source}</span>
                          <span>{formatDate(article.publishedAt)}</span>
                        </div>
                        <a
                          href={article.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 font-medium"
                        >
                          Read More
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      </div>
                      <div className="flex flex-wrap gap-2 mt-3">
                        {article.relevantSkills.map((skill, index) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            {skill}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        {/* Jobs Tab */}
        <TabsContent value="jobs" className="space-y-4">
          {relevantJobs.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <Briefcase className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No relevant job postings found</p>
                <p className="text-sm text-gray-400">
                  Add more skills to your knowledge graph to see matching opportunities
                </p>
              </CardContent>
            </Card>
          ) : (
            relevantJobs.map((job) => (
              <Card key={job.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                      <Briefcase className="w-6 h-6 text-green-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h3 className="font-semibold text-lg text-gray-900">{job.title}</h3>
                          <p className="text-gray-600 font-medium">{job.company}</p>
                        </div>
                        <Badge className={getMatchColor(job.matchPercentage)}>{job.matchPercentage}% match</Badge>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-500 mb-3">
                        <div className="flex items-center gap-1">
                          <MapPin className="w-4 h-4" />
                          {job.location}
                        </div>
                        <div className="flex items-center gap-1">
                          <DollarSign className="w-4 h-4" />
                          {job.salary}
                        </div>
                        <span>{formatDate(job.postedAt)}</span>
                      </div>
                      <p className="text-gray-600 mb-3 leading-relaxed">{job.description}</p>
                      <div className="flex items-center justify-between">
                        <div className="flex flex-wrap gap-2">
                          {job.requiredSkills.slice(0, 5).map((skill, index) => (
                            <Badge
                              key={index}
                              variant={userSkills.includes(skill) ? "default" : "outline"}
                              className="text-xs"
                            >
                              {skill}
                            </Badge>
                          ))}
                          {job.requiredSkills.length > 5 && (
                            <Badge variant="outline" className="text-xs">
                              +{job.requiredSkills.length - 5} more
                            </Badge>
                          )}
                        </div>
                        <a
                          href={job.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 font-medium"
                        >
                          Apply Now
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        {/* Courses Tab */}
        <TabsContent value="courses" className="space-y-4">
          {relevantCourses.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No relevant courses found</p>
                <p className="text-sm text-gray-400">
                  Add more skills to your knowledge graph to see learning recommendations
                </p>
              </CardContent>
            </Card>
          ) : (
            relevantCourses.map((course) => (
              <Card key={course.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                      <BookOpen className="w-6 h-6 text-purple-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h3 className="font-semibold text-lg text-gray-900">{course.title}</h3>
                          <p className="text-gray-600 font-medium">{course.provider}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">{course.level}</Badge>
                          <div className="flex items-center gap-1 text-sm text-gray-500">
                            <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                            {course.rating}
                          </div>
                        </div>
                      </div>
                      <p className="text-gray-600 mb-3 leading-relaxed">{course.description}</p>
                      <div className="flex items-center gap-4 text-sm text-gray-500 mb-3">
                        <div className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {course.duration}
                        </div>
                        <div className="flex items-center gap-1">
                          <DollarSign className="w-4 h-4" />
                          {course.price}
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex flex-wrap gap-2">
                          {course.relevantSkills.map((skill, index) => (
                            <Badge
                              key={index}
                              variant={userSkills.includes(skill) ? "default" : "outline"}
                              className="text-xs"
                            >
                              {skill}
                            </Badge>
                          ))}
                        </div>
                        <a
                          href={course.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 font-medium"
                        >
                          View Course
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
