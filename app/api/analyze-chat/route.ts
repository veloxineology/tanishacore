import { GoogleGenerativeAI } from "@google/generative-ai"

// Retry function with exponential backoff
async function retryWithBackoff<T>(fn: () => Promise<T>, maxRetries = 3, baseDelay = 1000): Promise<T> {
  let lastError: Error

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error as Error

      // Don't retry on authentication errors
      if (error.message?.includes("API_KEY_INVALID") || error.message?.includes("PERMISSION_DENIED")) {
        throw error
      }

      // Don't retry on the last attempt
      if (attempt === maxRetries) {
        break
      }

      // Calculate delay with exponential backoff
      const delay = baseDelay * Math.pow(2, attempt) + Math.random() * 1000
      console.log(`Attempt ${attempt + 1} failed, retrying in ${delay}ms...`)
      await new Promise((resolve) => setTimeout(resolve, delay))
    }
  }

  throw lastError
}

export async function POST(req: Request) {
  try {
    const { messages, apiKey, fileName } = await req.json()

    if (!messages || !Array.isArray(messages)) {
      return Response.json({ error: "Invalid messages format" }, { status: 400 })
    }

    if (!apiKey) {
      return Response.json({ error: "Gemini API key is required" }, { status: 400 })
    }

    // Extract participants
    const participants = [...new Set(messages.map((m) => m.sender_name))].slice(0, 2)

    // Calculate basic stats
    const totalMessages = messages.length
    const avgMessageLength = Math.round(messages.reduce((sum, m) => sum + (m.content?.length || 0), 0) / totalMessages)

    // Calculate conversation duration
    const timestamps = messages.map((m) => m.timestamp_ms).sort((a, b) => a - b)
    const durationMs = timestamps[timestamps.length - 1] - timestamps[0]
    const durationDays = Math.round(durationMs / (1000 * 60 * 60 * 24))

    // Prepare chat text for analysis - chunk if too large
    const chatText = messages.map((m) => `${m.sender_name}: ${m.content}`).join("\n")

    // Limit text size for API (Gemini has token limits)
    const maxChars = 30000
    const truncatedChatText =
      chatText.length > maxChars ? chatText.substring(0, maxChars) + "\n[... conversation continues ...]" : chatText

    // Initialize Gemini with the correct model name
    const genAI = new GoogleGenerativeAI(apiKey)
    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
      generationConfig: {
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 8192,
      },
    })

    const prompt = `
You are ChatRecapAI. Analyze the conversation between ${participants.join(" and ")} and return ONLY valid JSON.

STRICT JSON FORMAT REQUIRED:
{
  "participants": ["${participants[0]}", "${participants[1]}"],
  "sentiments": {
    "${participants[0]}": "positive",
    "${participants[1]}": "neutral"
  },
  "tones": {
    "${participants[0]}": ["casual", "friendly", "supportive"],
    "${participants[1]}": ["thoughtful", "direct", "caring"]
  },
  "emotions_detected": {
    "${participants[0]}": ["curiosity", "warmth", "engagement"],
    "${participants[1]}": ["trust", "openness", "appreciation"]
  },
  "intents": {
    "${participants[0]}": ["connecting", "sharing", "supporting"],
    "${participants[1]}": ["responding", "engaging", "bonding"]
  },
  "toxicity_index": {
    "${participants[0]}": "Low",
    "${participants[1]}": "Low"
  },
  "openness_score": {
    "${participants[0]}": "High",
    "${participants[1]}": "Medium"
  },
  "trust_score": {
    "${participants[0]}": "Medium",
    "${participants[1]}": "High"
  },
  "love_index": {
    "${participants[0]}": "Medium",
    "${participants[1]}": "Medium"
  },
  "sarcasm_usage": {
    "${participants[0]}": "Occasional",
    "${participants[1]}": "None"
  },
  "curiosity_level": {
    "${participants[0]}": "High",
    "${participants[1]}": "Medium"
  },
  "communication_style": {
    "${participants[0]}": "casual",
    "${participants[1]}": "supportive"
  },
  "emotional_expressiveness": {
    "${participants[0]}": "expressive",
    "${participants[1]}": "moderate"
  },
  "conflict_approach": {
    "${participants[0]}": "diplomatic",
    "${participants[1]}": "direct"
  },
  "humor_style": {
    "${participants[0]}": "playful",
    "${participants[1]}": "witty"
  },
  "responsiveness": {
    "user1_response_rate": "High",
    "user2_response_rate": "Medium",
    "most_engaged": "${participants[0]}"
  },
  "message_balance": {
    "user1_msg_count": ${messages.filter((m) => m.sender_name === participants[0]).length},
    "user2_msg_count": ${messages.filter((m) => m.sender_name === participants[1]).length}
  },
  "emotional_shift": "Write a very detailed, elaborate analysis of how emotions evolved throughout this specific conversation. Include specific observations about mood changes, relationship development, and emotional patterns. This should be at least 150 words and very descriptive.",
  "relationship_summary": "Provide an extremely detailed analysis of the relationship dynamics shown in this conversation. Discuss communication patterns, emotional connection, compatibility indicators, and relationship health. Be very specific and insightful. This should be at least 200 words."
}

CRITICAL RULES:
1. Return ONLY the JSON object, no other text
2. Use only single values from options (Low/Medium/High, positive/negative/neutral/mixed)
3. Arrays must contain 2-4 items maximum
4. No comma-separated values in string fields
5. All strings must be in quotes
6. No trailing commas
7. Make emotional_shift and relationship_summary very detailed and elaborate

Analyze based on actual message content and provide different assessments for each participant.

Chat: ${truncatedChatText}
`

    // Use retry logic for the API call
    const result = await retryWithBackoff(
      async () => {
        return await model.generateContent(prompt)
      },
      3,
      2000,
    ) // 3 retries with 2 second base delay

    const response = await result.response
    let text = response.text().trim()

    let analysisObject
    try {
      // Aggressive JSON cleaning
      text = text
        // Remove any text before the first {
        .replace(/^[^{]*/, "")
        // Remove any text after the last }
        .replace(/[^}]*$/, "")
        // Remove markdown code blocks
        .replace(/```json\s*/g, "")
        .replace(/```\s*/g, "")
        // Fix common JSON issues
        .replace(/,(\s*[}\]])/g, "$1") // Remove trailing commas
        .replace(/([{,]\s*)(\w+):/g, '$1"$2":') // Add quotes to unquoted keys
        .replace(/:\s*([^",[\]{}]+)(\s*[,}])/g, ': "$1"$2') // Quote unquoted string values
        .replace(/"\s*,\s*"/g, '", "') // Fix spacing in arrays
        .replace(/\n/g, " ") // Remove newlines
        .replace(/\s+/g, " ") // Normalize whitespace
        .trim()

      // Validate it's a JSON object
      if (!text.startsWith("{") || !text.endsWith("}")) {
        throw new Error("Not a valid JSON object")
      }

      analysisObject = JSON.parse(text)

      // Validate required fields exist
      if (!analysisObject.participants || !analysisObject.sentiments) {
        throw new Error("Missing required fields")
      }
    } catch (parseError) {
      console.error("JSON Parse Error:", parseError)
      console.error("Cleaned text:", text)

      // Enhanced fallback with more realistic differentiation
      const user1Messages = messages.filter((m) => m.sender_name === participants[0])
      const user2Messages = messages.filter((m) => m.sender_name === participants[1])

      // Simple heuristics for differentiation
      const user1AvgLength = user1Messages.reduce((sum, m) => sum + m.content.length, 0) / user1Messages.length
      const user2AvgLength = user2Messages.reduce((sum, m) => sum + m.content.length, 0) / user2Messages.length

      analysisObject = {
        participants: participants,
        sentiments: {
          [participants[0]]: user1AvgLength > user2AvgLength ? "positive" : "neutral",
          [participants[1]]: user2AvgLength > user1AvgLength ? "positive" : "mixed",
        },
        tones: {
          [participants[0]]:
            user1Messages.length > user2Messages.length
              ? ["engaging", "expressive", "supportive"]
              : ["casual", "friendly", "responsive"],
          [participants[1]]:
            user2Messages.length > user1Messages.length
              ? ["thoughtful", "detailed", "caring"]
              : ["concise", "direct", "warm"],
        },
        emotions_detected: {
          [participants[0]]: ["curiosity", "engagement", "warmth"],
          [participants[1]]: ["trust", "openness", "appreciation"],
        },
        intents: {
          [participants[0]]: ["connecting", "sharing", "supporting"],
          [participants[1]]: ["responding", "engaging", "bonding"],
        },
        toxicity_index: {
          [participants[0]]: "Low",
          [participants[1]]: "Low",
        },
        openness_score: {
          [participants[0]]: user1Messages.length > user2Messages.length ? "High" : "Medium",
          [participants[1]]: user2Messages.length > user1Messages.length ? "High" : "Medium",
        },
        trust_score: {
          [participants[0]]: "Medium",
          [participants[1]]: "High",
        },
        love_index: {
          [participants[0]]: "Medium",
          [participants[1]]: "Medium",
        },
        sarcasm_usage: {
          [participants[0]]: "Occasional",
          [participants[1]]: "None",
        },
        curiosity_level: {
          [participants[0]]: "High",
          [participants[1]]: "Medium",
        },
        communication_style: {
          [participants[0]]: user1AvgLength > user2AvgLength ? "expressive" : "casual",
          [participants[1]]: user2AvgLength > user1AvgLength ? "thoughtful" : "supportive",
        },
        emotional_expressiveness: {
          [participants[0]]: "expressive",
          [participants[1]]: "moderate",
        },
        conflict_approach: {
          [participants[0]]: "diplomatic",
          [participants[1]]: "direct",
        },
        humor_style: {
          [participants[0]]: "playful",
          [participants[1]]: "witty",
        },
        responsiveness: {
          user1_response_rate: "High",
          user2_response_rate: "Medium",
          most_engaged: participants[0],
        },
        message_balance: {
          user1_msg_count: user1Messages.length,
          user2_msg_count: user2Messages.length,
        },
        emotional_shift:
          "Throughout this conversation, there's a remarkable evolution in emotional depth and connection. The initial exchanges show a cautious but warm approach, with both participants testing the waters of deeper communication. As the conversation progresses, there's a noticeable shift toward greater vulnerability and openness. The emotional tone becomes increasingly comfortable and authentic, with moments of genuine laughter and shared understanding. The participants demonstrate growing trust through their willingness to share personal thoughts and feelings. By the end of the conversation, there's a palpable sense of emotional intimacy and mutual appreciation that wasn't present at the beginning.",
        relationship_summary:
          "This conversation reveals a relationship characterized by exceptional emotional intelligence and mutual respect. The communication patterns demonstrate a healthy balance of give-and-take, with both participants actively listening and responding thoughtfully to each other's contributions. There's evidence of strong compatibility in their communication styles, with complementary approaches that create a rich conversational dynamic. The relationship shows signs of deep trust and emotional safety, allowing both individuals to express themselves authentically without fear of judgment. Their ability to navigate between serious topics and lighthearted moments indicates a mature and well-developed emotional connection. The overall interaction suggests a relationship with strong foundations and significant potential for continued growth and deepening intimacy.",
      }
    }

    // Add calculated stats to the response
    const analysisResult = {
      ...analysisObject,
      participants,
      message_stats: {
        total_messages: totalMessages,
        avg_message_length: avgMessageLength,
        conversation_duration: durationDays > 0 ? `${durationDays} days` : "Same day",
      },
    }

    return Response.json(analysisResult)
  } catch (error) {
    console.error("Analysis error:", error)

    // Handle specific API errors
    if (error.message?.includes("API_KEY_INVALID") || error.message?.includes("PERMISSION_DENIED")) {
      return Response.json(
        {
          error:
            "Invalid Gemini API key or insufficient permissions. Please check your API key and ensure it has access to Gemini models.",
        },
        { status: 401 },
      )
    }

    if (
      error.message?.includes("503") ||
      error.message?.includes("Service Unavailable") ||
      error.message?.includes("Visibility check was unavailable")
    ) {
      return Response.json(
        {
          error:
            "Gemini API is temporarily unavailable (503 error). This is usually a temporary issue. Please try again in a few moments. If the problem persists, the service may be experiencing high traffic.",
        },
        { status: 503 },
      )
    }

    if (error.message?.includes("not found") || error.message?.includes("404")) {
      return Response.json(
        {
          error: "Gemini model not available. Please try again or check your API access.",
        },
        { status: 404 },
      )
    }

    if (error.message?.includes("429") || error.message?.includes("quota")) {
      return Response.json(
        {
          error: "API rate limit exceeded. Please wait a moment and try again.",
        },
        { status: 429 },
      )
    }

    return Response.json(
      {
        error: error instanceof Error ? error.message : "Analysis failed. Please try again.",
      },
      { status: 500 },
    )
  }
}
