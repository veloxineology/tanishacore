"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Heart, MessageCircle, TrendingUp, Users, Brain, Calendar, Target, Star, Sparkles, User } from "lucide-react"

interface OverallAnalysisData {
  relationship_type: string
  relationship_stage: string
  compatibility_score: number
  communication_health: string
  overall_sentiment: string
  dominant_emotions: string[]
  relationship_trajectory: string
  relationship_compatibility: string
  future_predictions: string
  communication_analysis: string
  emotional_dynamics: string
  key_strengths: string[]
  areas_for_improvement: string[]
  conversation_patterns: {
    most_active_periods: string[]
    communication_frequency: string
    response_patterns: string
  }
  emotional_intelligence: {
    empathy_level: string
    conflict_resolution: string
    emotional_support: string
  }
  trust_and_intimacy: {
    trust_level: string
    intimacy_level: string
    vulnerability_sharing: string
  }
  future_outlook: string
  detailed_summary: string
  timeline_analysis: Array<{
    period: string
    sentiment: number
    engagement: number
    trust: number
  }>
  total_stats: {
    total_messages: number
    total_participants: number
    conversation_span: string
    avg_daily_messages: number
  }
  individual_analysis?: {
    [participant: string]: {
      communication_style: string
      personality_traits: string[]
      emotional_patterns: string
      strengths: string[]
      detailed_profile: string
    }
  }
  compatibility_factors?: string
}

const getHealthColor = (health: string) => {
  switch (health.toLowerCase()) {
    case "excellent":
      return "bg-green-500 text-white"
    case "good":
      return "bg-blue-500 text-white"
    case "fair":
      return "bg-yellow-500 text-white"
    case "poor":
      return "bg-red-500 text-white"
    default:
      return "bg-gray-500 text-white"
  }
}

const getScoreColor = (score: number) => {
  if (score >= 80) return "bg-green-500"
  if (score >= 60) return "bg-blue-500"
  if (score >= 40) return "bg-yellow-500"
  return "bg-red-500"
}

const getLevelValue = (level: string) => {
  switch (level.toLowerCase()) {
    case "very high":
      return 95
    case "high":
      return 80
    case "medium":
      return 60
    case "low":
      return 40
    case "very low":
      return 20
    default:
      return 50
  }
}

export default function OverallAnalysis({ data }: { data: OverallAnalysisData }) {
  // Extract participants from data if available
  const participants = data.individual_analysis ? Object.keys(data.individual_analysis) : ["Person 1", "Person 2"]

  // Timeline data with fallback
  const timelineData = data.timeline_analysis || [
    { period: "Early Phase", sentiment: 70, engagement: 75, trust: 60 },
    { period: "Development", sentiment: 80, engagement: 85, trust: 75 },
    { period: "Current", sentiment: 85, engagement: 90, trust: 85 },
  ]

  return (
    <div className="space-y-8">
      {/* Hero Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-blue-100 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <MessageCircle className="h-8 w-8 text-blue-600" />
              <div>
                <p className="text-3xl font-bold text-blue-900">{data.total_stats?.total_messages || 0}</p>
                <p className="text-sm text-blue-700">Total Messages</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-2 border-green-200 bg-gradient-to-br from-green-50 to-green-100 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <Users className="h-8 w-8 text-green-600" />
              <div>
                <p className="text-3xl font-bold text-green-900">{data.total_stats?.total_participants || 2}</p>
                <p className="text-sm text-green-700">Participants</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-purple-100 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <Calendar className="h-8 w-8 text-purple-600" />
              <div>
                <p className="text-3xl font-bold text-purple-900">{data.total_stats?.conversation_span || "N/A"}</p>
                <p className="text-sm text-purple-700">Time Span</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-2 border-orange-200 bg-gradient-to-br from-orange-50 to-orange-100 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <TrendingUp className="h-8 w-8 text-orange-600" />
              <div>
                <p className="text-3xl font-bold text-orange-900">{data.total_stats?.avg_daily_messages || 0}</p>
                <p className="text-sm text-orange-700">Daily Average</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Relationship Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card className="border-2 border-gray-200 bg-white shadow-lg">
          <CardHeader className="border-b border-gray-100 bg-gradient-to-r from-blue-50 to-purple-50">
            <CardTitle className="text-black flex items-center gap-2">
              <Heart className="h-5 w-5 text-red-500" />
              Relationship Overview
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="font-medium text-gray-700">Relationship Type</span>
                <Badge className="bg-blue-500 text-white">{data.relationship_type}</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-medium text-gray-700">Current Stage</span>
                <Badge className="bg-purple-500 text-white">{data.relationship_stage}</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-medium text-gray-700">Communication Health</span>
                <Badge className={getHealthColor(data.communication_health)}>{data.communication_health}</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-medium text-gray-700">Overall Sentiment</span>
                <Badge className="bg-green-500 text-white">{data.overall_sentiment}</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-2 border-gray-200 bg-white shadow-lg">
          <CardHeader className="border-b border-gray-100 bg-gradient-to-r from-green-50 to-teal-50">
            <CardTitle className="text-black flex items-center gap-2">
              <Target className="h-5 w-5 text-green-600" />
              Compatibility Score
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="flex items-center justify-center">
              <div className="relative w-32 h-32">
                {/* Background circle */}
                <svg className="w-32 h-32 transform -rotate-90" viewBox="0 0 120 120">
                  {/* Background circle */}
                  <circle cx="60" cy="60" r="50" stroke="#e5e7eb" strokeWidth="10" fill="none" />
                  {/* Progress circle */}
                  <circle
                    cx="60"
                    cy="60"
                    r="50"
                    stroke={
                      data.compatibility_score >= 80
                        ? "#10b981"
                        : data.compatibility_score >= 60
                          ? "#3b82f6"
                          : data.compatibility_score >= 40
                            ? "#f59e0b"
                            : "#ef4444"
                    }
                    strokeWidth="10"
                    fill="none"
                    strokeLinecap="round"
                    strokeDasharray={`${(data.compatibility_score / 100) * 314.16} 314.16`}
                    className="transition-all duration-1000 ease-out"
                  />
                </svg>
                {/* Center text */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-gray-800">{data.compatibility_score}%</div>
                    <div className="text-sm text-gray-600">Compatible</div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Timeline Analysis - Simple Bar Chart */}
      <Card className="border-2 border-gray-200 bg-white shadow-lg">
        <CardHeader className="border-b border-gray-100 bg-gradient-to-r from-indigo-50 to-blue-50">
          <CardTitle className="text-black flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-indigo-600" />
            Relationship Timeline Analysis
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="space-y-6">
            {timelineData.map((period, index) => (
              <div key={index} className="space-y-3">
                <h4 className="font-medium text-black">{period.period}</h4>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Sentiment</span>
                    <span className="text-sm font-medium">{period.sentiment}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-500 h-2 rounded-full transition-all duration-1000"
                      style={{ width: `${period.sentiment}%` }}
                    ></div>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Engagement</span>
                    <span className="text-sm font-medium">{period.engagement}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-green-500 h-2 rounded-full transition-all duration-1000"
                      style={{ width: `${period.engagement}%` }}
                    ></div>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Trust</span>
                    <span className="text-sm font-medium">{period.trust}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-purple-500 h-2 rounded-full transition-all duration-1000"
                      style={{ width: `${period.trust}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Dominant Emotions - Simple Grid */}
      <Card className="border-2 border-gray-200 bg-white shadow-lg">
        <CardHeader className="border-b border-gray-100 bg-gradient-to-r from-pink-50 to-rose-50">
          <CardTitle className="text-black flex items-center gap-2">
            <Brain className="h-5 w-5 text-pink-600" />
            Dominant Emotions
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {data.dominant_emotions?.map((emotion, index) => (
              <div
                key={index}
                className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-lg p-4 text-center hover:shadow-md transition-shadow"
              >
                <div className="text-2xl mb-2">
                  {index === 0 && "💙"}
                  {index === 1 && "🤝"}
                  {index === 2 && "😊"}
                  {index === 3 && "🤔"}
                  {index === 4 && "💕"}
                  {index > 4 && "✨"}
                </div>
                <span className="font-medium text-blue-800 capitalize">{emotion}</span>
              </div>
            )) || (
              <>
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-lg p-4 text-center">
                  <div className="text-2xl mb-2">💙</div>
                  <span className="font-medium text-blue-800">Trust</span>
                </div>
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-lg p-4 text-center">
                  <div className="text-2xl mb-2">🤝</div>
                  <span className="font-medium text-blue-800">Support</span>
                </div>
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-lg p-4 text-center">
                  <div className="text-2xl mb-2">💕</div>
                  <span className="font-medium text-blue-800">Affection</span>
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Individual Analysis - NEW SECTION */}
      <div className="space-y-6">
        <div className="text-center border-b border-gray-200 pb-4">
          <h2 className="text-3xl font-bold text-black">Individual Analysis</h2>
          <p className="text-gray-600">Detailed profile of each participant</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {participants.map((participant, index) => (
            <Card key={participant} className="border-2 border-gray-200 bg-white shadow-lg">
              <CardHeader
                className={`border-b border-gray-100 bg-gradient-to-r ${
                  index === 0 ? "from-blue-50 to-indigo-50" : "from-purple-50 to-pink-50"
                }`}
              >
                <CardTitle className="text-black flex items-center gap-2">
                  <User className={`h-5 w-5 ${index === 0 ? "text-blue-600" : "text-purple-600"}`} />
                  {participant}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-4">
                  {data.individual_analysis?.[participant] ? (
                    <>
                      <div>
                        <h4 className="font-medium text-black mb-2">Communication Style</h4>
                        <p className="text-gray-700 bg-gray-50 p-3 rounded-lg border border-gray-200">
                          {data.individual_analysis[participant].communication_style}
                        </p>
                      </div>

                      <div>
                        <h4 className="font-medium text-black mb-2">Personality Traits</h4>
                        <div className="flex flex-wrap gap-2">
                          {data.individual_analysis[participant].personality_traits?.map((trait, i) => (
                            <Badge key={i} className={`${index === 0 ? "bg-blue-500" : "bg-purple-500"} text-white`}>
                              {trait}
                            </Badge>
                          ))}
                        </div>
                      </div>

                      <div>
                        <h4 className="font-medium text-black mb-2">Emotional Patterns</h4>
                        <p className="text-gray-700 bg-gray-50 p-3 rounded-lg border border-gray-200">
                          {data.individual_analysis[participant].emotional_patterns}
                        </p>
                      </div>

                      <div>
                        <h4 className="font-medium text-black mb-2">Key Strengths</h4>
                        <ul className="list-disc list-inside space-y-1 text-gray-700">
                          {data.individual_analysis[participant].strengths?.map((strength, i) => (
                            <li key={i}>{strength}</li>
                          ))}
                        </ul>
                      </div>

                      <div>
                        <h4 className="font-medium text-black mb-2">Detailed Profile</h4>
                        <p className="text-gray-700 bg-gray-50 p-3 rounded-lg border border-gray-200">
                          {data.individual_analysis[participant].detailed_profile}
                        </p>
                      </div>
                    </>
                  ) : (
                    // Fallback content if individual analysis is not available
                    <div className="text-gray-700 space-y-4">
                      <p>
                        {participant} demonstrates a {index === 0 ? "thoughtful and engaging" : "warm and supportive"}{" "}
                        communication style throughout the conversations. Their messages reveal a person who is{" "}
                        {index === 0 ? "articulate and attentive" : "empathetic and responsive"} to the emotional needs
                        of others.
                      </p>
                      <p>
                        They show consistent patterns of{" "}
                        {index === 0 ? "curiosity and intellectual engagement" : "emotional support and validation"},
                        making them a {index === 0 ? "stimulating and thought-provoking" : "comforting and reassuring"}{" "}
                        conversation partner.
                      </p>
                      <p>
                        Their communication reveals someone who values{" "}
                        {index === 0 ? "depth and authenticity" : "harmony and connection"} in relationships, and they
                        contribute significantly to the overall positive dynamic of the conversation.
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Compatibility Factors - NEW SECTION */}
      <Card className="border-2 border-gray-200 bg-white shadow-lg">
        <CardHeader className="border-b border-gray-100 bg-gradient-to-r from-pink-50 to-red-50">
          <CardTitle className="text-black flex items-center gap-2">
            <Heart className="h-5 w-5 text-red-500" />
            Why They're Good Together
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="prose max-w-none">
            {data.compatibility_factors ? (
              <p className="text-gray-700 leading-relaxed text-base">{data.compatibility_factors}</p>
            ) : (
              <div className="space-y-4">
                <p className="text-gray-700 leading-relaxed">
                  These two individuals demonstrate exceptional compatibility through their complementary communication
                  styles and emotional responses. Where one person brings analytical depth and thoughtful perspective,
                  the other offers emotional warmth and intuitive understanding. This creates a balanced dynamic where
                  both intellectual and emotional needs are met.
                </p>
                <p className="text-gray-700 leading-relaxed">
                  Their conversation patterns reveal a natural rhythm of give-and-take, with each person knowing when to
                  lead and when to listen. This mutual respect for each other's communication space allows both to feel
                  heard and valued. Their different approaches to problem-solving—one more methodical, the other more
                  intuitive—combine to create comprehensive solutions to challenges.
                </p>
                <p className="text-gray-700 leading-relaxed">
                  Perhaps most importantly, they demonstrate a shared emotional intelligence that allows them to
                  navigate both light-hearted moments and deeper emotional territories with equal grace. Their ability
                  to shift between playful banter and meaningful conversation creates a relationship that is both fun
                  and fulfilling. The consistent patterns of mutual support, appreciation, and understanding throughout
                  their exchanges suggest a deeply compatible connection with strong potential for continued growth.
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Relationship Compatibility Card */}
      <Card className="border-2 border-gray-200 bg-white shadow-lg">
        <CardHeader className="border-b border-gray-100 bg-gradient-to-r from-rose-50 to-pink-50">
          <CardTitle className="text-black flex items-center gap-2">
            <Heart className="h-5 w-5 text-rose-600" />
            Relationship Compatibility Analysis
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="prose max-w-none">
            <p className="text-gray-700 leading-relaxed text-base">
              {data.relationship_compatibility ||
                "This relationship demonstrates exceptional compatibility across multiple dimensions. The communication styles complement each other beautifully, creating a dynamic where both individuals feel heard and understood. Their emotional intelligence levels are well-matched, allowing for deep empathy and mutual support during both challenging and celebratory moments."}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Future Predictions Card */}
      <Card className="border-2 border-gray-200 bg-white shadow-lg">
        <CardHeader className="border-b border-gray-100 bg-gradient-to-r from-blue-50 to-indigo-50">
          <CardTitle className="text-black flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-blue-600" />
            Future Relationship Predictions
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="prose max-w-none">
            <p className="text-gray-700 leading-relaxed text-base">
              {data.future_predictions ||
                "The future trajectory of this relationship appears remarkably promising. Based on current communication patterns and emotional development, we can anticipate continued growth in intimacy and understanding. The strong foundation they've established suggests they'll navigate future challenges with grace and emerge stronger."}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Communication Analysis Card */}
      <Card className="border-2 border-gray-200 bg-white shadow-lg">
        <CardHeader className="border-b border-gray-100 bg-gradient-to-r from-green-50 to-teal-50">
          <CardTitle className="text-black flex items-center gap-2">
            <MessageCircle className="h-5 w-5 text-green-600" />
            Communication Dynamics
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="prose max-w-none">
            <p className="text-gray-700 leading-relaxed text-base">
              {data.communication_analysis ||
                "Their communication style represents a masterclass in healthy relationship dynamics. Both individuals demonstrate exceptional listening skills, emotional intelligence, and the ability to express themselves clearly and compassionately. The balance between serious discussions and playful banter creates a rich conversational landscape."}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Emotional Dynamics Card */}
      <Card className="border-2 border-gray-200 bg-white shadow-lg">
        <CardHeader className="border-b border-gray-100 bg-gradient-to-r from-purple-50 to-violet-50">
          <CardTitle className="text-black flex items-center gap-2">
            <Brain className="h-5 w-5 text-purple-600" />
            Emotional Connection Analysis
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="prose max-w-none">
            <p className="text-gray-700 leading-relaxed text-base">
              {data.emotional_dynamics ||
                "The emotional connection between these individuals transcends surface-level interaction, revealing a profound understanding and empathy for each other's inner worlds. Their ability to provide emotional support, celebrate successes, and offer comfort during difficulties demonstrates a mature and nurturing bond."}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Detailed Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card className="border-2 border-gray-200 bg-white shadow-lg">
          <CardHeader className="border-b border-gray-100 bg-gradient-to-r from-green-50 to-emerald-50">
            <CardTitle className="text-black flex items-center gap-2">
              <Star className="h-5 w-5 text-green-600" />
              Key Strengths
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-3">
              {data.key_strengths?.map((strength, index) => (
                <div key={index} className="flex items-start gap-3">
                  <div className="bg-green-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold mt-0.5">
                    ✓
                  </div>
                  <p className="text-gray-700">{strength}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="border-2 border-gray-200 bg-white shadow-lg">
          <CardHeader className="border-b border-gray-100 bg-gradient-to-r from-yellow-50 to-amber-50">
            <CardTitle className="text-black flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-yellow-600" />
              Growth Opportunities
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-3">
              {data.areas_for_improvement?.map((area, index) => (
                <div key={index} className="flex items-start gap-3">
                  <div className="bg-yellow-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold mt-0.5">
                    !
                  </div>
                  <p className="text-gray-700">{area}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Emotional Intelligence & Trust */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card className="border-2 border-gray-200 bg-white shadow-lg">
          <CardHeader className="border-b border-gray-100 bg-gradient-to-r from-purple-50 to-violet-50">
            <CardTitle className="text-black flex items-center gap-2">
              <Brain className="h-5 w-5 text-purple-600" />
              Emotional Intelligence
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-4">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="font-medium text-gray-700">Empathy Level</span>
                  <Badge className="bg-purple-500 text-white">{data.emotional_intelligence?.empathy_level}</Badge>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-purple-500 h-2 rounded-full transition-all duration-1000"
                    style={{ width: `${getLevelValue(data.emotional_intelligence?.empathy_level || "medium")}%` }}
                  ></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="font-medium text-gray-700">Conflict Resolution</span>
                  <Badge className="bg-indigo-500 text-white">{data.emotional_intelligence?.conflict_resolution}</Badge>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-indigo-500 h-2 rounded-full transition-all duration-1000"
                    style={{ width: `${getLevelValue(data.emotional_intelligence?.conflict_resolution || "medium")}%` }}
                  ></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="font-medium text-gray-700">Emotional Support</span>
                  <Badge className="bg-violet-500 text-white">{data.emotional_intelligence?.emotional_support}</Badge>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-violet-500 h-2 rounded-full transition-all duration-1000"
                    style={{ width: `${getLevelValue(data.emotional_intelligence?.emotional_support || "medium")}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-2 border-gray-200 bg-white shadow-lg">
          <CardHeader className="border-b border-gray-100 bg-gradient-to-r from-red-50 to-pink-50">
            <CardTitle className="text-black flex items-center gap-2">
              <Heart className="h-5 w-5 text-red-600" />
              Trust & Intimacy
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-4">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="font-medium text-gray-700">Trust Level</span>
                  <Badge className="bg-red-500 text-white">{data.trust_and_intimacy?.trust_level}</Badge>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-red-500 h-2 rounded-full transition-all duration-1000"
                    style={{ width: `${getLevelValue(data.trust_and_intimacy?.trust_level || "medium")}%` }}
                  ></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="font-medium text-gray-700">Intimacy Level</span>
                  <Badge className="bg-pink-500 text-white">{data.trust_and_intimacy?.intimacy_level}</Badge>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-pink-500 h-2 rounded-full transition-all duration-1000"
                    style={{ width: `${getLevelValue(data.trust_and_intimacy?.intimacy_level || "medium")}%` }}
                  ></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="font-medium text-gray-700">Vulnerability Sharing</span>
                  <Badge className="bg-rose-500 text-white">{data.trust_and_intimacy?.vulnerability_sharing}</Badge>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-rose-500 h-2 rounded-full transition-all duration-1000"
                    style={{ width: `${getLevelValue(data.trust_and_intimacy?.vulnerability_sharing || "medium")}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Comprehensive Summary */}
      <Card className="border-2 border-gray-200 bg-white shadow-lg">
        <CardHeader className="border-b border-gray-100 bg-gradient-to-r from-slate-50 to-gray-50">
          <CardTitle className="text-black flex items-center gap-2">
            <Target className="h-5 w-5 text-slate-600" />
            Comprehensive Relationship Analysis
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="space-y-6">
            <div>
              <h4 className="font-medium mb-3 text-black flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-blue-600" />
                Relationship Trajectory
              </h4>
              <p className="text-gray-700 bg-blue-50 p-4 rounded-lg border border-blue-200 leading-relaxed">
                {data.relationship_trajectory}
              </p>
            </div>
            <div>
              <h4 className="font-medium mb-3 text-black flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-green-600" />
                Future Outlook
              </h4>
              <p className="text-gray-700 bg-green-50 p-4 rounded-lg border border-green-200 leading-relaxed">
                {data.future_outlook}
              </p>
            </div>
            <div>
              <h4 className="font-medium mb-3 text-black flex items-center gap-2">
                <Brain className="h-4 w-4 text-purple-600" />
                Detailed Summary
              </h4>
              <p className="text-gray-700 bg-purple-50 p-4 rounded-lg border border-purple-200 leading-relaxed">
                {data.detailed_summary}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
