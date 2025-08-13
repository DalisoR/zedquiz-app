import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { corsHeaders } from '../_shared/cors.ts'

// This is the core logic for our AI marking.
async function gradeAnswer(studentAnswer: string, correctAnswer: string) {
  // We will use the Gemini AI for this task.
  // NOTE: In a real production app, you would secure this API key.
  const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY')
  const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${GEMINI_API_KEY}`

  // This is the detailed prompt we send to the AI.
  const prompt = `
    You are an expert Zambian examinations marker, trained to understand the context of the Zambian curriculum.
    Your goal is to assess if the student understands the core concept, not just if they used the exact same words.

    The official correct answer provided by the teacher is:
    "${correctAnswer}"

    The student's submitted answer is:
    "${studentAnswer}"

    Analyze the student's answer based on the official correct answer. Does the student's answer demonstrate a clear cognitive understanding of the main idea or concept?

    Respond in a JSON format with two keys:
    1. "evaluation": A single word, either "CORRECT" or "INCORRECT".
    2. "explanation": A brief, helpful explanation for the student. If the student was correct, reinforce the concept. If the student was incorrect, gently explain the correct answer based on the teacher's provided solution.
  `

  try {
    const response = await fetch(GEMINI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
      }),
    })

    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}`)
    }

    const data = await response.json()
    const aiResponseText = data.candidates[0].content.parts[0].text
    
    // Clean the response to ensure it's valid JSON
    const cleanedJsonString = aiResponseText.replace(/```json|```/g, '').trim();
    return JSON.parse(cleanedJsonString);

  } catch (error) {
    console.error('Error contacting AI service:', error)
    // Provide a fallback response in case of an error
    return {
      evaluation: 'ERROR',
      explanation: 'Could not grade the answer at this time. Please try again later.',
    }
  }
}

// This is the main server function that listens for requests.
serve(async (req) => {
  // This is needed to handle CORS requests from the browser
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { studentAnswer, correctAnswer } = await req.json()

    if (!studentAnswer || !correctAnswer) {
      throw new Error('Missing studentAnswer or correctAnswer in the request body.')
    }

    const result = await gradeAnswer(studentAnswer, correctAnswer)

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
