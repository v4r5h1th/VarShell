import { type NextRequest, NextResponse } from "next/server"
import { generateText } from "ai"
import { google } from "@ai-sdk/google"

export async function POST(request: NextRequest) {
  try {
    console.log("Graph generation API called")

    if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
      console.error("Missing API key")
      return NextResponse.json({ error: "Missing GOOGLE_GENERATIVE_AI_API_KEY environment variable." }, { status: 500 })
    }

    const { userInput } = await request.json()
    console.log("User input received:", userInput?.substring(0, 100) + "...")

    const prompt = `
You are an expert knowledge graph generator. Based on the user's description of their skills and knowledge, create a comprehensive knowledge graph.

User input: "${userInput}"

Generate a JSON object with the following structure:
{
  "nodes": [
    {
      "id": "unique_id_1",
      "label": "Skill/Topic Name",
      "proficiency": "not_started|beginner|intermediate|advanced|expert",
      "category": "category_name",
      "resources": []
    }
  ],
  "edges": [
    {
      "source": "node_id",
      "target": "node_id", 
      "relationship": "enables|requires|builds_on|leads_to|related_to"
    }
  ]
}

IMPORTANT GUIDELINES:
1. Extract 10-20 specific skills/technologies mentioned or implied by the user
2. Infer realistic proficiency levels based on the user's description:
   - "never used" or "want to learn" = not_started
   - "know" or "familiar with" = intermediate
   - "basic" or "learning" = beginner  
   - "experienced" or "good at" = advanced
   - "expert" or "years of experience" = expert
3. Create meaningful categories like:
   - "Programming Languages"
   - "Web Development" 
   - "Data Science"
   - "Machine Learning"
   - "Databases"
   - "Cloud Computing"
   - "Mobile Development"
   - "DevOps"
   - "Design"
4. Add logical relationships between skills:
   - JavaScript enables React
   - HTML/CSS are required for Web Development
   - Python enables Data Science
   - SQL is related to Databases
5. Use clear, specific labels (e.g., "React.js" not just "React")
6. Leave resources array empty (will be populated dynamically)

Analyze the user's input carefully and create a realistic representation of their knowledge.

Return ONLY the JSON object, no additional text or formatting.
`

    console.log("Calling Gemini API for graph generation...")
    const { text } = await generateText({
      model: google("gemini-1.5-flash", {
        apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY,
      }),
      prompt,
    })

    console.log("Gemini response received:", text.substring(0, 200) + "...")

    // Parse the generated JSON
    let graph
    try {
      // Clean the response - remove any markdown formatting
      const cleanedText = text
        .replace(/```json\n?/g, "")
        .replace(/```\n?/g, "")
        .trim()

      console.log("Cleaned text for parsing:", cleanedText.substring(0, 200) + "...")

      graph = JSON.parse(cleanedText)

      // Validate structure
      if (!graph.nodes || !Array.isArray(graph.nodes)) {
        throw new Error("Invalid graph structure - missing nodes array")
      }

      if (!graph.edges || !Array.isArray(graph.edges)) {
        graph.edges = [] // Edges are optional
      }

      // Ensure all nodes have required fields
      graph.nodes = graph.nodes.map((node, index) => ({
        id: node.id || `node_${index + 1}`,
        label: node.label || `Skill ${index + 1}`,
        proficiency: ["not_started", "beginner", "intermediate", "advanced", "expert"].includes(node.proficiency)
          ? node.proficiency
          : "intermediate",
        category: node.category || "General",
        resources: [],
      }))

      // Validate edges reference existing nodes
      const nodeIds = new Set(graph.nodes.map((n) => n.id))
      graph.edges = graph.edges.filter((edge) => nodeIds.has(edge.source) && nodeIds.has(edge.target))

      console.log(
        "Successfully parsed graph with",
        graph.nodes?.length || 0,
        "nodes and",
        graph.edges?.length || 0,
        "edges",
      )
    } catch (parseError) {
      console.error("JSON parsing failed:", parseError)
      console.log("Raw AI response:", text)

      // Create a more intelligent fallback based on user input
      graph = createIntelligentFallback(userInput)
    }

    return NextResponse.json({ graph })
  } catch (error) {
    console.error("Error generating graph:", error)
    return NextResponse.json(
      {
        error: "Failed to generate knowledge graph",
        details: error.message,
      },
      { status: 500 },
    )
  }
}

function createIntelligentFallback(userInput: string) {
  const input = userInput.toLowerCase()
  const nodes = []
  const edges = []
  let nodeId = 1

  // Common skill patterns
  const skillPatterns = [
    {
      keywords: ["javascript", "js"],
      label: "JavaScript",
      category: "Programming Languages",
      proficiency: "intermediate",
    },
    { keywords: ["python"], label: "Python", category: "Programming Languages", proficiency: "intermediate" },
    { keywords: ["react"], label: "React.js", category: "Web Development", proficiency: "intermediate" },
    { keywords: ["html"], label: "HTML", category: "Web Development", proficiency: "intermediate" },
    { keywords: ["css"], label: "CSS", category: "Web Development", proficiency: "intermediate" },
    { keywords: ["node", "nodejs"], label: "Node.js", category: "Backend Development", proficiency: "intermediate" },
    { keywords: ["sql", "database"], label: "SQL", category: "Databases", proficiency: "intermediate" },
    { keywords: ["git"], label: "Git", category: "Development Tools", proficiency: "intermediate" },
    {
      keywords: ["machine learning", "ml"],
      label: "Machine Learning",
      category: "Data Science",
      proficiency: "not_started",
    },
    {
      keywords: ["data science", "data analysis"],
      label: "Data Science",
      category: "Data Science",
      proficiency: "not_started",
    },
  ]

  // Extract skills from user input
  skillPatterns.forEach((pattern) => {
    if (pattern.keywords.some((keyword) => input.includes(keyword))) {
      // Determine proficiency from context
      let proficiency = pattern.proficiency
      if (input.includes("expert") || input.includes("years of experience")) proficiency = "expert"
      else if (input.includes("advanced") || input.includes("experienced")) proficiency = "advanced"
      else if (input.includes("basic") || input.includes("learning") || input.includes("beginner"))
        proficiency = "beginner"

      nodes.push({
        id: `node_${nodeId}`,
        label: pattern.label,
        proficiency,
        category: pattern.category,
        resources: [],
      })
      nodeId++
    }
  })

  // Add some basic edges
  if (nodes.length > 1) {
    // Find related skills and connect them
    const jsNode = nodes.find((n) => n.label === "JavaScript")
    const reactNode = nodes.find((n) => n.label === "React.js")
    const htmlNode = nodes.find((n) => n.label === "HTML")
    const cssNode = nodes.find((n) => n.label === "CSS")

    if (jsNode && reactNode) {
      edges.push({ source: jsNode.id, target: reactNode.id, relationship: "enables" })
    }
    if (htmlNode && cssNode) {
      edges.push({ source: htmlNode.id, target: cssNode.id, relationship: "related_to" })
    }
  }

  // If no skills detected, create a basic graph
  if (nodes.length === 0) {
    nodes.push({
      id: "node_1",
      label: "General Knowledge",
      proficiency: "beginner",
      category: "Learning",
      resources: [],
    })
  }

  return { nodes, edges }
}
