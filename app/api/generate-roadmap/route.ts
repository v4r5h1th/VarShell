import { type NextRequest, NextResponse } from "next/server"
import { generateText } from "ai"
import { google } from "@ai-sdk/google"

export async function POST(request: NextRequest) {
  try {
    if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
      return NextResponse.json({ error: "Missing GOOGLE_GENERATIVE_AI_API_KEY environment variable." }, { status: 500 })
    }

    const { baseGraph, roadmapGoal } = await request.json()

    const currentSkills = baseGraph.nodes.map((node: any) => `${node.label} (${node.proficiency})`).join(", ")

    const prompt = `
Based on the user's current knowledge graph and their learning goal, generate a comprehensive roadmap as a knowledge graph.

Current Skills: ${currentSkills}
Learning Goal: "${roadmapGoal}"

Generate a JSON object with this structure:
{
  "name": "Roadmap Name",
  "description": "Brief description of the roadmap",
  "graph": {
    "nodes": [
      {
        "id": "unique_id",
        "label": "Skill/Topic Name",
        "proficiency": "not_started|beginner|intermediate|advanced|expert",
        "category": "category_name",
        "resources": ["resource1", "resource2"]
      }
    ],
    "edges": [
      {
        "source": "node_id",
        "target": "node_id",
        "relationship": "prerequisite|enables|builds_on|leads_to"
      }
    ]
  }
}

Guidelines:
1. Include the user's existing skills with their current proficiency levels
2. Add 10-20 new skills needed to achieve the goal
3. Mark existing skills as their current proficiency, new skills as "not_started" or "beginner"
4. Create logical learning paths with edges showing prerequisites and progressions
5. Group skills into relevant categories
6. Include practical resources for each skill
7. Show clear progression from current state to goal

Focus on creating a realistic, step-by-step learning path that builds upon existing knowledge.

Return only the JSON object, no additional text.
`

    const { text } = await generateText({
      model: google("gemini-1.5-flash", {
        apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY,
      }),
      prompt,
    })

    // Parse the generated JSON
    let roadmapData
    try {
      const cleanedText = text
        .replace(/```json\n?/g, "")
        .replace(/```\n?/g, "")
        .trim()

      roadmapData = JSON.parse(cleanedText)

      // Validate the roadmap data
      const graph = roadmapData.graph
      if (!graph || !graph.nodes || !graph.edges) {
        throw new Error("Invalid graph structure")
      }

      // Ensure all nodes have required fields
      graph.nodes = graph.nodes.map((node, index) => ({
        id: node.id || `node_${index + 1}`,
        label: node.label || `Skill ${index + 1}`,
        proficiency: ["not_started", "beginner", "intermediate", "advanced", "expert"].includes(node.proficiency)
          ? node.proficiency
          : "not_started",
        category: node.category || "General",
        resources: [],
      }))

      roadmapData.graph = graph
    } catch (parseError) {
      console.error("JSON parsing failed for roadmap:", parseError)

      // Fallback roadmap
      roadmapData = {
        name: `${roadmapGoal} Roadmap`,
        description: `Personalized learning path for ${roadmapGoal}`,
        graph: {
          nodes: [
            ...baseGraph.nodes,
            {
              id: "new_1",
              label: "Next Step",
              proficiency: "beginner",
              category: "Learning",
              resources: ["Start here", "Basic tutorial"],
            },
          ],
          edges: baseGraph.edges,
        },
      }
    }

    return NextResponse.json(roadmapData)
  } catch (error) {
    console.error("Error generating roadmap:", error)
    return NextResponse.json({ error: "Failed to generate roadmap" }, { status: 500 })
  }
}
