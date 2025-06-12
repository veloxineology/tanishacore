import { GoogleGenerativeAI } from "@google/generative-ai"

export async function POST(req: Request) {
  try {
    const { apiKey } = await req.json()

    if (!apiKey) {
      return Response.json({ error: "API key is required" }, { status: 400 })
    }

    // Initialize Gemini with the provided API key
    const genAI = new GoogleGenerativeAI(apiKey)
    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
      generationConfig: {
        temperature: 0.1,
        maxOutputTokens: 100,
      },
    })

    // Test with a simple prompt
    const result = await model.generateContent("Say 'API key is working' if you can read this.")
    const response = await result.response
    const text = response.text()

    if (text && text.toLowerCase().includes("working")) {
      return Response.json({
        message: "API key is valid and working correctly!",
        success: true,
      })
    } else {
      return Response.json(
        {
          error: "API key test failed - unexpected response from Gemini",
          success: false,
        },
        { status: 400 },
      )
    }
  } catch (error) {
    console.error("API key test error:", error)

    // Handle specific error types
    if (error.message?.includes("API_KEY_INVALID") || error.message?.includes("PERMISSION_DENIED")) {
      return Response.json(
        {
          error: "Invalid API key. Please check that your key is correct and has access to the Gemini API.",
          success: false,
        },
        { status: 401 },
      )
    }

    if (error.message?.includes("403")) {
      return Response.json(
        {
          error:
            "API key doesn't have permission to access Gemini. Please enable the Generative Language API in Google Cloud Console.",
          success: false,
        },
        { status: 403 },
      )
    }

    if (error.message?.includes("404")) {
      return Response.json(
        {
          error: "Gemini model not found. Please ensure your API key has access to Gemini 1.5 Flash.",
          success: false,
        },
        { status: 404 },
      )
    }

    if (error.message?.includes("429")) {
      return Response.json(
        {
          error: "API rate limit exceeded. Please wait a moment and try again.",
          success: false,
        },
        { status: 429 },
      )
    }

    if (error.message?.includes("503") || error.message?.includes("Service Unavailable")) {
      return Response.json(
        {
          error: "Gemini service is temporarily unavailable. Please try again in a few moments.",
          success: false,
        },
        { status: 503 },
      )
    }

    return Response.json(
      {
        error: `API key validation failed: ${error.message || "Unknown error"}`,
        success: false,
      },
      { status: 500 },
    )
  }
}
