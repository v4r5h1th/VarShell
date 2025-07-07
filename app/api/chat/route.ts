import { type NextRequest, NextResponse } from "next/server"
import { generateText } from "ai"
import { google } from "@ai-sdk/google"

export async function POST(request: NextRequest) {
  if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
    return NextResponse.json({ error: "Missing GOOGLE_GENERATIVE_AI_API_KEY environment variable." }, { status: 500 })
  }

  try {
    const { message, knowledgeGraph } = await request.json()

    const graphSummary = `
User's Knowledge Graph:
Nodes: ${knowledgeGraph.nodes.map((node: any) => `${node.label} (${node.proficiency})`).join(", ")}
Categories: ${[...new Set(knowledgeGraph.nodes.map((node: any) => node.category))].join(", ")}
`

    const prompt = `
You are a career advisor AI with access to the user's knowledge graph. Based on their current skills and proficiency levels, provide helpful career guidance.

${graphSummary}

User question: "${message}"

Provide a helpful, personalized response that:
1. References their current skills and proficiency levels
2. Suggests specific next steps or learning paths
3. Recommends job opportunities that match their skills
4. Identifies skill gaps for desired roles
5. Gives actionable advice

Keep the response conversational and encouraging.
`

    const { text } = await generateText({
      model: google("gemini-1.5-flash", {
        apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY,
      }),
      prompt,
    })

    return NextResponse.json({ response: text })
  } catch (error) {
    console.error("Error in chat:", error)
    return NextResponse.json({ error: "Failed to get AI response" }, { status: 500 })
  }
}
