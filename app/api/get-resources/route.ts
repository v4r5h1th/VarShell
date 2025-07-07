import { type NextRequest, NextResponse } from "next/server"
import { generateText } from "ai"
import { google } from "@ai-sdk/google"

export async function POST(request: NextRequest) {
  try {
    console.log("Resources API called")

    if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
      console.error("Missing API key")
      return NextResponse.json({ error: "Missing GOOGLE_GENERATIVE_AI_API_KEY environment variable." }, { status: 500 })
    }

    const { skill, proficiency, category } = await request.json()
    console.log("Generating resources for:", { skill, proficiency, category })

    const prompt = `
You are a learning resource curator. Generate 6-8 high-quality, REAL learning resources for "${skill}" at ${proficiency} level in the ${category} category.

IMPORTANT: Provide REAL, working URLs to actual websites, not placeholder URLs.

Return ONLY a JSON array with this exact structure:
[
  {
    "title": "Specific Resource Title",
    "url": "https://actual-working-url.com",
    "description": "Clear description of what this resource offers (50-80 words)"
  }
]

Requirements for ${proficiency} level ${skill}:

${
  proficiency === "beginner"
    ? `- Getting started guides and tutorials
  - Interactive learning platforms (freeCodeCamp, Codecademy, etc.)
  - Official documentation for beginners
  - YouTube tutorial series
  - Basic project ideas and examples`
    : proficiency === "intermediate"
      ? `- In-depth tutorials and courses
  - Real-world project examples
  - Best practices and design patterns
  - Community forums and discussions
  - Intermediate-level documentation`
      : proficiency === "advanced"
        ? `- Advanced concepts and techniques
  - Performance optimization guides
  - Complex project examples
  - Research papers and case studies
  - Expert-level documentation`
        : `- Cutting-edge research and developments
  - Contributing to open source projects
  - Teaching and mentoring resources
  - Conference talks and presentations
  - Expert communities and forums`
}

Focus on these types of resources:
1. Official documentation and guides
2. Reputable learning platforms (Coursera, edX, Udemy, Pluralsight)
3. GitHub repositories with examples
4. YouTube channels and video tutorials
5. Interactive coding platforms
6. Community forums and Stack Overflow
7. Blogs and articles from experts
8. Practice platforms and coding challenges

Make sure URLs are real and accessible. Include a mix of free and premium resources.

Return only the JSON array, no additional text or formatting.
`

    console.log("Calling Gemini API...")
    const { text } = await generateText({
      model: google("gemini-1.5-flash", {
        apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY,
      }),
      prompt,
    })

    console.log("Gemini response received:", text.substring(0, 200) + "...")

    // Parse the generated JSON
    let resources
    try {
      const cleanedText = text
        .replace(/```json\n?/g, "")
        .replace(/```\n?/g, "")
        .trim()

      console.log("Cleaned text:", cleanedText.substring(0, 200) + "...")
      resources = JSON.parse(cleanedText)

      // Validate the structure
      if (!Array.isArray(resources)) {
        throw new Error("Response is not an array")
      }

      // Ensure each resource has required fields and clean up
      resources = resources.map((resource, index) => ({
        title: resource.title || `${skill} Resource ${index + 1}`,
        url: resource.url || `https://www.google.com/search?q=${encodeURIComponent(skill + " " + proficiency)}`,
        description: resource.description || `Learn more about ${skill} at ${proficiency} level`,
      }))

      console.log("Successfully parsed", resources.length, "resources")
    } catch (parseError) {
      console.error("JSON parsing failed for resources:", parseError)
      console.log("Raw AI response:", text)

      // Enhanced fallback resources based on skill and proficiency
      resources = generateEnhancedFallbackResources(skill, proficiency, category)
    }

    return NextResponse.json({ resources })
  } catch (error) {
    console.error("Error fetching resources:", error)
    return NextResponse.json(
      {
        error: "Failed to fetch resources",
        details: error.message,
      },
      { status: 500 },
    )
  }
}

function generateEnhancedFallbackResources(skill: string, proficiency: string, category: string) {
  const skillLower = skill.toLowerCase()
  const resources = []

  // Skill-specific resources
  if (skillLower.includes("javascript")) {
    resources.push(
      {
        title: "MDN JavaScript Guide",
        url: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide",
        description:
          "Comprehensive JavaScript documentation with examples and best practices from Mozilla Developer Network.",
      },
      {
        title: "JavaScript.info Modern Tutorial",
        url: "https://javascript.info/",
        description:
          "Modern JavaScript tutorial covering everything from basics to advanced topics with interactive examples.",
      },
    )
  } else if (skillLower.includes("python")) {
    resources.push(
      {
        title: "Python.org Official Tutorial",
        url: "https://docs.python.org/3/tutorial/",
        description: "Official Python tutorial covering language fundamentals and standard library usage.",
      },
      {
        title: "Real Python Tutorials",
        url: "https://realpython.com/",
        description: "High-quality Python tutorials and articles for developers of all skill levels.",
      },
    )
  } else if (skillLower.includes("react")) {
    resources.push(
      {
        title: "React Official Documentation",
        url: "https://react.dev/",
        description: "Official React documentation with interactive examples and comprehensive guides.",
      },
      {
        title: "React Tutorial for Beginners",
        url: "https://react.dev/learn",
        description: "Step-by-step React learning guide with hands-on examples and exercises.",
      },
    )
  }

  // Proficiency-specific resources
  if (proficiency === "beginner") {
    resources.push(
      {
        title: `freeCodeCamp ${skill} Course`,
        url: `https://www.freecodecamp.org/learn`,
        description: `Free interactive coding course covering ${skill} fundamentals with hands-on projects.`,
      },
      {
        title: `${skill} Crash Course - YouTube`,
        url: `https://www.youtube.com/results?search_query=${encodeURIComponent(skill + " crash course")}`,
        description: `Video crash course covering ${skill} basics in an easy-to-follow format.`,
      },
    )
  } else if (proficiency === "intermediate") {
    resources.push({
      title: `${skill} Best Practices Guide`,
      url: `https://www.google.com/search?q=${encodeURIComponent(skill + " best practices guide")}`,
      description: `Comprehensive guide covering ${skill} best practices and common patterns.`,
    })
  } else if (proficiency === "advanced" || proficiency === "expert") {
    resources.push({
      title: `Advanced ${skill} GitHub Projects`,
      url: `https://github.com/search?q=${encodeURIComponent(skill)}&type=repositories&s=stars&o=desc`,
      description: `Open source projects and advanced examples showcasing ${skill} capabilities.`,
    })
  }

  // Category-specific resources
  if (category.toLowerCase().includes("programming")) {
    resources.push({
      title: `Stack Overflow ${skill} Questions`,
      url: `https://stackoverflow.com/questions/tagged/${encodeURIComponent(skill.toLowerCase())}`,
      description: `Community-driven Q&A platform with solutions to common ${skill} problems.`,
    })
  }

  // Generic high-quality resources
  resources.push(
    {
      title: `Coursera ${skill} Courses`,
      url: `https://www.coursera.org/search?query=${encodeURIComponent(skill)}`,
      description: `University-level courses and specializations in ${skill} from top institutions.`,
    },
    {
      title: `${skill} Documentation Hub`,
      url: `https://www.google.com/search?q=${encodeURIComponent(skill + " official documentation")}`,
      description: `Official documentation and reference materials for ${skill}.`,
    },
  )

  return resources.slice(0, 6) // Return max 6 resources
}
