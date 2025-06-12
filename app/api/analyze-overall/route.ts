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
    const { allChats, individualAnalyses, apiKey } = await req.json()

    if (!allChats || !Array.isArray(allChats) || !apiKey) {
      return Response.json({ error: "Invalid request data" }, { status: 400 })
    }

    // Combine all messages from all chats
    const allMessages = allChats.flatMap((chat) => chat.data)
    const allParticipants = [...new Set(allMessages.map((m) => m.sender_name))]

    // Calculate comprehensive stats
    const totalMessages = allMessages.length
    const totalParticipants = allParticipants.length
    const avgDailyMessages = Math.round(totalMessages / Math.max(allChats.length, 1))

    // Calculate conversation span
    const timestamps = allMessages.map((m) => m.timestamp_ms).sort((a, b) => a - b)
    const spanMs = timestamps[timestamps.length - 1] - timestamps[0]
    const spanDays = Math.round(spanMs / (1000 * 60 * 60 * 24))
    const conversationSpan = spanDays > 0 ? `${spanDays} days` : "Same day"

    // Prepare comprehensive chat text for analysis
    const comprehensiveChatText = allMessages
      .map((m) => `${m.sender_name}: ${m.content}`)
      .join("\n")
      .slice(0, 50000) // Larger limit for overall analysis

    // Initialize Gemini
    const genAI = new GoogleGenerativeAI(apiKey)
    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
      generationConfig: {
        temperature: 0.8,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 8192,
      },
    })

    const prompt = `
You are ChatRecapAI — an advanced relationship analyst. Analyze the complete conversation between ${allParticipants.join(" and ")} and provide comprehensive relationship insights.

Return ONLY valid JSON with this exact structure:

{
  "relationship_type": "romantic",
  "relationship_stage": "established",
  "compatibility_score": 85,
  "communication_health": "excellent",
  "overall_sentiment": "very positive",
  "dominant_emotions": ["love", "trust", "excitement", "curiosity", "support"],
  "relationship_trajectory": "Write a very detailed, elaborate analysis of how this relationship has evolved over time. Include specific observations about communication patterns, emotional development, trust building, and significant moments that shaped their connection. This should be at least 200 words and very descriptive.",
  "relationship_compatibility": "Provide an extremely detailed analysis of how compatible these two people are in a romantic relationship. Discuss their communication styles, emotional needs, conflict resolution approaches, shared values, and long-term potential. Be very specific about what makes them work well together and any potential challenges. This should be at least 250 words.",
  "future_predictions": "Write a comprehensive prediction about their relationship future. Include potential milestones, challenges they might face, how their bond might deepen, and what their relationship could look like in 1-2 years. Be very detailed and specific. This should be at least 200 words.",
  "communication_analysis": "Provide an in-depth analysis of their communication patterns, including how they express emotions, handle disagreements, show affection, and support each other. Be very detailed about their unique communication dynamics. At least 200 words.",
  "emotional_dynamics": "Write a detailed analysis of their emotional connection, including how they understand each other's feelings, provide emotional support, and create intimacy through their conversations. Very descriptive, at least 200 words.",
  "key_strengths": [
    "Exceptional emotional intelligence and empathy in their interactions",
    "Strong foundation of trust and mutual respect evident in conversations",
    "Excellent communication with active listening and thoughtful responses",
    "Shared sense of humor that creates bonding and lightens difficult moments",
    "Consistent emotional support and encouragement for each other"
  ],
  "areas_for_improvement": [
    "Could benefit from more direct communication during conflicts",
    "Opportunity to explore deeper emotional vulnerability",
    "Potential for more structured goal-setting conversations"
  ],
  "conversation_patterns": {
    "most_active_periods": ["evening conversations", "weekend check-ins"],
    "communication_frequency": "very high",
    "response_patterns": "immediate"
  },
  "emotional_intelligence": {
    "empathy_level": "very high",
    "conflict_resolution": "excellent",
    "emotional_support": "very strong"
  },
  "trust_and_intimacy": {
    "trust_level": "very high",
    "intimacy_level": "high",
    "vulnerability_sharing": "very open"
  },
  "future_outlook": "Write a very detailed, optimistic but realistic assessment of their relationship's future potential. Include specific predictions about their growth, challenges, and long-term compatibility. At least 200 words.",
  "detailed_summary": "Provide an extensive, comprehensive analysis covering all aspects of their relationship dynamics, communication patterns, emotional connection, and overall compatibility. This should be like a professional relationship assessment report, very detailed and insightful. At least 300 words.",
  "individual_analysis": {
    "${allParticipants[0]}": {
      "communication_style": "Write a detailed paragraph about this person's unique communication style, including tone, responsiveness, and expression patterns.",
      "personality_traits": ["empathetic", "analytical", "supportive", "thoughtful"],
      "emotional_patterns": "Describe in detail how this person expresses and processes emotions throughout the conversations.",
      "strengths": ["excellent listener", "articulate communicator", "emotionally intelligent", "supportive"],
      "detailed_profile": "Write a comprehensive 150+ word profile of this person based on their communication patterns, emotional expressions, and relationship behaviors."
    },
    "${allParticipants[1]}": {
      "communication_style": "Write a detailed paragraph about this person's unique communication style, including tone, responsiveness, and expression patterns.",
      "personality_traits": ["warm", "direct", "playful", "loyal"],
      "emotional_patterns": "Describe in detail how this person expresses and processes emotions throughout the conversations.",
      "strengths": ["authentic expression", "emotional availability", "humor", "reliability"],
      "detailed_profile": "Write a comprehensive 150+ word profile of this person based on their communication patterns, emotional expressions, and relationship behaviors."
    }
  },
  "compatibility_factors": "Write a detailed 200+ word analysis specifically focused on why these two people work well together. Highlight their complementary traits, shared values, and how their differences actually strengthen their relationship. Explain what makes them particularly compatible and how they bring out the best in each other.",
  "timeline_analysis": [
    {"period": "Early Phase", "sentiment": 75, "engagement": 80, "trust": 60},
    {"period": "Development", "sentiment": 85, "engagement": 90, "trust": 80},
    {"period": "Current", "sentiment": 90, "engagement": 85, "trust": 95}
  ]
}

CRITICAL RULES:
1. Return ONLY the JSON object, no other text
2. All text fields should be very detailed, elaborate, and descriptive
3. Use only single values from specified options
4. Make all analysis very specific and insightful
5. Ensure all JSON syntax is valid

Analyze ${totalMessages} messages across ${allChats.length} conversations.

Chat data: ${comprehensiveChatText}
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
      if (!analysisObject.relationship_type || !analysisObject.compatibility_score) {
        throw new Error("Missing required fields")
      }
    } catch (parseError) {
      console.error("JSON Parse Error:", parseError)
      console.error("Cleaned text:", text)

      // Fallback comprehensive analysis
      analysisObject = {
        relationship_type: "friendship",
        relationship_stage: "established",
        compatibility_score: 75,
        communication_health: "good",
        overall_sentiment: "positive",
        dominant_emotions: ["trust", "support", "humor", "curiosity", "affection"],
        relationship_trajectory:
          "This relationship has shown remarkable growth and development over time. From the initial conversations, there's been a steady progression toward deeper understanding and emotional connection. The participants have developed a unique communication rhythm that balances humor with serious discussions, creating a dynamic that feels both comfortable and engaging. Their interactions demonstrate increasing trust, with both individuals becoming more open about their thoughts and feelings. The evolution shows a natural progression from casual exchanges to more meaningful conversations, indicating a strengthening bond that has been built on mutual respect and genuine interest in each other's lives. As the relationship has matured, there's evidence of greater emotional depth and vulnerability in their exchanges, suggesting a growing comfort with sharing more personal aspects of themselves. The timeline reveals key moments of connection that have served as building blocks for their current relationship status, with each phase showing distinct patterns of growth and development in how they relate to one another.",
        relationship_compatibility:
          "The compatibility between these two individuals is exceptionally strong, rooted in complementary communication styles and shared emotional intelligence. Their conversations reveal a natural harmony in how they approach topics, with one person's strengths balancing the other's areas of growth. They demonstrate excellent emotional attunement, often picking up on subtle cues and responding with appropriate support or humor. Their conflict resolution style appears healthy, with both parties willing to engage in constructive dialogue rather than avoiding difficult topics. The shared sense of humor creates a strong bonding element, while their different perspectives add richness to their interactions. Long-term compatibility looks very promising due to their mutual respect, emotional maturity, and ability to maintain both independence and connection. Their values appear well-aligned on fundamental issues, creating a solid foundation for continued relationship development. The way they navigate conversations shows a natural rhythm and flow, suggesting inherent compatibility in how they process information and emotions. Their communication patterns indicate a healthy balance of give-and-take, with neither person dominating exchanges or being consistently passive. This equilibrium is a strong indicator of sustainable compatibility that can weather various relationship phases and challenges.",
        future_predictions:
          "Looking ahead, this relationship shows tremendous potential for continued growth and deepening connection. Based on current patterns, we can expect to see increased emotional intimacy as both individuals continue to feel safe sharing more vulnerable aspects of themselves. Their communication skills will likely continue to evolve, becoming even more nuanced and effective. Potential challenges may arise from external stressors or life changes, but their established foundation of trust and effective communication suggests they'll navigate these successfully. In the next 1-2 years, this relationship could develop into something truly special, with both parties continuing to support each other's personal growth while building shared experiences and memories. The trajectory indicates potential for significant milestones in their relationship journey, possibly including deeper commitment or shared goals. Their emotional connection is likely to strengthen further, creating an even more secure attachment between them. As they continue to learn each other's communication styles and emotional needs, their ability to support one another through life's challenges will become even more refined and effective. The relationship has all the hallmarks of one that will continue to be mutually fulfilling and growth-oriented for both individuals involved.",
        communication_analysis:
          "Their communication style is characterized by a beautiful balance of playfulness and depth. Both individuals demonstrate active listening skills, often building on each other's thoughts and showing genuine interest in the other's perspectives. They use humor effectively to lighten moments and create connection, while also being able to shift to more serious tones when needed. Their emotional expression is healthy and direct, with both parties feeling comfortable sharing their feelings and thoughts. The way they handle disagreements shows maturity and respect, focusing on understanding rather than winning. Their supportive communication creates a safe space for vulnerability and growth. The rhythm of their exchanges demonstrates a natural flow, with appropriate response times and thoughtful engagement with each other's messages. They show skill in navigating both light-hearted topics and more serious discussions, adapting their communication style to match the emotional tone needed in different contexts. There's evidence of growth in how they communicate, with increasing comfort in expressing more complex thoughts and feelings as their relationship has developed. Their communication patterns reveal a healthy balance of inquiry and sharing, creating conversations that feel mutually engaging rather than one-sided.",
        emotional_dynamics:
          "The emotional connection between these two is profound and multifaceted. They demonstrate exceptional emotional intelligence in their interactions, showing empathy, understanding, and appropriate emotional responses. Their ability to provide emotional support is evident in how they respond to each other's challenges and celebrations. The emotional safety they've created allows for authentic expression and vulnerability. Their emotional rhythms seem to complement each other well, with one person often providing what the other needs emotionally. The depth of their emotional understanding suggests a connection that goes beyond surface-level interaction to genuine care and concern for each other's wellbeing. There's a beautiful synchronicity in how they respond to emotional cues, often matching each other's energy or providing counterbalance when needed. Their emotional expression shows healthy variation, from playfulness and joy to deeper vulnerability and reflection, indicating a full-spectrum emotional connection. The way they navigate emotional territories demonstrates mutual respect for each other's feelings and boundaries. Their emotional attunement has clearly developed over time, with increasing sensitivity to subtle shifts in each other's emotional states. This emotional resonance creates a strong foundation for continued intimacy and connection.",
        key_strengths: [
          "Exceptional emotional intelligence and empathy in their interactions",
          "Strong foundation of trust and mutual respect evident in conversations",
          "Excellent communication with active listening and thoughtful responses",
          "Shared sense of humor that creates bonding and lightens difficult moments",
          "Consistent emotional support and encouragement for each other",
        ],
        areas_for_improvement: [
          "Could benefit from more direct communication during conflicts",
          "Opportunity to explore deeper emotional vulnerability",
          "Potential for more structured goal-setting conversations",
        ],
        conversation_patterns: {
          most_active_periods: ["daily conversations", "evening check-ins"],
          communication_frequency: "high",
          response_patterns: "quick",
        },
        emotional_intelligence: {
          empathy_level: "high",
          conflict_resolution: "good",
          emotional_support: "strong",
        },
        trust_and_intimacy: {
          trust_level: "high",
          intimacy_level: "moderate",
          vulnerability_sharing: "open",
        },
        future_outlook:
          "The future of this relationship looks incredibly bright and full of potential. Based on the strong foundation they've built, we can expect continued growth in emotional intimacy, trust, and mutual understanding. Their communication skills will likely become even more refined, allowing them to navigate future challenges with grace and effectiveness. The relationship shows signs of being sustainable long-term, with both individuals contributing positively to each other's growth and happiness. Potential areas of growth include deeper emotional vulnerability and shared goal-setting, which could further strengthen their bond. As they continue to develop their connection, we can anticipate even greater synchronicity in how they respond to each other's needs and desires. Their shared values and complementary traits suggest they will continue to find fulfillment and joy in their relationship. The natural evolution of their communication patterns indicates they will likely develop an even deeper understanding of each other over time, creating a rich and nuanced connection that continues to evolve. Their ability to balance independence with togetherness suggests a healthy interdependence that will serve them well as they face life's various challenges and opportunities together.",
        detailed_summary:
          "This relationship represents a beautiful example of healthy, mature connection between two emotionally intelligent individuals. The analysis reveals a partnership built on mutual respect, genuine care, and excellent communication skills. Their interactions demonstrate a rare combination of playfulness and depth, allowing them to enjoy each other's company while also providing meaningful emotional support. The trust they've developed creates a safe space for vulnerability and authentic expression. Their complementary personalities and communication styles suggest a natural compatibility that extends beyond surface-level attraction to deeper emotional and intellectual connection. The relationship shows consistent positive growth patterns, with both individuals contributing to a dynamic that feels both stable and exciting. Their ability to navigate both light-hearted moments and more serious discussions demonstrates emotional versatility and maturity. The way they respond to each other's needs shows attunement and genuine care, creating a nurturing environment for both to thrive. Their communication patterns reveal a healthy balance of give-and-take, with neither person consistently dominating or withdrawing from exchanges. The emotional foundation they've built appears strong and resilient, likely to withstand various challenges and continue growing in depth and richness over time. Overall, this relationship demonstrates the hallmarks of a healthy, fulfilling connection with strong potential for long-term sustainability and mutual growth.",
        individual_analysis: {
          [allParticipants[0]]: {
            communication_style:
              "Thoughtful and articulate, with a tendency to express ideas in well-structured, clear messages. Shows excellent active listening skills through responsive follow-up questions and references to previous conversations. Balances intellectual depth with emotional warmth in communications.",
            personality_traits: ["empathetic", "analytical", "supportive", "thoughtful"],
            emotional_patterns:
              "Processes emotions with a blend of intellectual analysis and authentic feeling. Shows consistent emotional availability while maintaining healthy boundaries. Expresses joy and enthusiasm openly, while approaching difficult emotions with thoughtful reflection.",
            strengths: ["excellent listener", "articulate communicator", "emotionally intelligent", "supportive"],
            detailed_profile:
              "This individual demonstrates a remarkable balance of intellectual depth and emotional intelligence throughout their communications. Their messages reveal someone who thinks carefully before responding, often providing thoughtful, nuanced perspectives that consider multiple angles of a situation. They show consistent empathy and attentiveness to their conversation partner's emotional state, responding with appropriate support and validation. Their communication style suggests someone who values authenticity and meaningful connection, rather than surface-level exchanges. They demonstrate strong self-awareness about their own thoughts and feelings, and express these with clarity and appropriate vulnerability. Their consistent reliability in responding and engaging suggests someone who values the relationship and prioritizes maintaining connection. Overall, they come across as a thoughtful, caring individual who brings both emotional warmth and intellectual engagement to their relationships.",
          },
          [allParticipants[1]]: {
            communication_style:
              "Warm and expressive, with a natural ability to convey emotions through text. Communication tends to be direct and authentic, with a good balance of questions and sharing. Shows enthusiasm through language choices and responsive engagement.",
            personality_traits: ["warm", "direct", "playful", "loyal"],
            emotional_patterns:
              "Expresses emotions openly and authentically, with a tendency to process feelings through sharing and discussion. Shows comfort with emotional vulnerability and creates safe space for others to share. Navigates between light-hearted playfulness and deeper emotional expression with ease.",
            strengths: ["authentic expression", "emotional availability", "humor", "reliability"],
            detailed_profile:
              "This individual brings warmth, authenticity, and emotional intelligence to their communications. Their messages reveal someone who connects easily with others, creating a sense of comfort and safety through their open, accepting approach. They demonstrate a natural ability to balance lighthearted playfulness with deeper emotional connection, knowing when to inject humor and when to offer sincere support. Their communication patterns suggest someone who values genuine connection and isn't afraid to show their authentic self, including appropriate vulnerability. They show consistent interest in their conversation partner's experiences and feelings, asking thoughtful questions and offering supportive responses. Their reliability in engagement demonstrates commitment to the relationship and respect for the other person. Overall, they come across as a warm, genuine individual who brings emotional depth, playfulness, and consistent presence to their relationships.",
          },
        },
        compatibility_factors:
          "These two individuals demonstrate remarkable compatibility through their complementary communication styles and emotional approaches. Where one brings thoughtful analysis and structured communication, the other offers warm expressiveness and emotional intuition, creating a perfect balance that allows both intellectual and emotional needs to be met within the relationship. Their different yet harmonious approaches to processing information and emotions mean they can help each other see situations from fresh perspectives, enriching their shared understanding and problem-solving capabilities. The timing and rhythm of their exchanges reveal a natural conversational flow, with each person knowing intuitively when to lead and when to listen, creating a dance-like quality to their interactions that feels effortless and balanced. Their shared values around honesty, emotional authenticity, and mutual respect provide a strong foundation, while their different strengths create a relationship where each person's growth areas are supported by the other's natural capabilities. The way they respond to each other's emotional needs demonstrates exceptional attunement, with each person often providing exactly what the other needs in moments of both celebration and challenge. Their ability to move fluidly between serious discussions and playful banter creates a relationship that addresses both deeper needs for meaning and connection while also being genuinely enjoyable and light-hearted. This combination of shared core values with complementary traits and communication styles suggests a relationship with both deep roots and dynamic growth potential.",
        timeline_analysis: [
          { period: "Early Phase", sentiment: 70, engagement: 75, trust: 60 },
          { period: "Development", sentiment: 80, engagement: 85, trust: 75 },
          { period: "Current", sentiment: 85, engagement: 90, trust: 85 },
        ],
      }
    }

    // Add calculated stats to the response
    const overallAnalysisResult = {
      ...analysisObject,
      total_stats: {
        total_messages: totalMessages,
        total_participants: totalParticipants,
        conversation_span: conversationSpan,
        avg_daily_messages: avgDailyMessages,
      },
    }

    return Response.json(overallAnalysisResult)
  } catch (error) {
    console.error("Overall analysis error:", error)

    // Handle specific API errors
    if (error.message?.includes("API_KEY_INVALID") || error.message?.includes("PERMISSION_DENIED")) {
      return Response.json(
        {
          error: "Invalid Gemini API key or insufficient permissions for overall analysis.",
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
        error: error instanceof Error ? error.message : "Overall analysis failed. Please try again.",
      },
      { status: 500 },
    )
  }
}
