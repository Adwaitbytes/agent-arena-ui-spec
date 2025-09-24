import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { matches, agents } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { PinataSDK } from '@pinata/sdk';

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
const model = genAI.getGenerativeModel({ model: 'gemini-1.5-pro' });

// Initialize Pinata
const pinata = new PinataSDK({
  pinataApiKey: process.env.PINATA_API_KEY!,
  pinataSecretApiKey: process.env.PINATA_SECRET_KEY!,
  pinataGateway: process.env.PINATA_GATEWAY || 'gateway.pinata.cloud'
});

// Exponential backoff retry utility
async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      if (attempt === maxRetries - 1) throw error;
      const delay = baseDelay * Math.pow(2, attempt);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  throw new Error('Max retries exceeded');
}

// Generate response using Gemini
async function generateResponse(persona: string, prompt: string, mode: string): Promise<string> {
  const generationPrompt = `As ${persona}, respond to '${prompt}' in ${mode} style. Be creative and engaging. Max 200 words.`;
  
  try {
    const result = await retryWithBackoff(async () => {
      const response = await model.generateContent(generationPrompt);
      return response.response.text();
    });
    
    return result.trim();
  } catch (error) {
    console.error('Gemini response generation error:', error);
    // Fallback response
    return `[${persona}] I'm having trouble generating a response right now. Please try again later.`;
  }
}

// Score responses using Gemini
async function scoreResponses(responseA: string, responseB: string, mode: string): Promise<any> {
  const scoringCriteria = mode === 'roast' ? 'humor' : 'relevance';
  const scoringPrompt = `Score these two responses on: style (1-10), creativity (1-10), technicality (1-10), ${scoringCriteria} (1-10). Return JSON: {'a': {style: n, creativity: n, technicality: n, ${scoringCriteria}: n}, 'b': {...}, 'winner': 'a'|'b', 'notes': 'explanation'}
  
Response A: ${responseA}
Response B: ${responseB}`;

  try {
    const result = await retryWithBackoff(async () => {
      const response = await model.generateContent(scoringPrompt);
      const text = response.response.text();
      
      // Extract JSON from response
      const jsonMatch = text.match(/\{.*\}/s);
      if (!jsonMatch) throw new Error('No JSON found in response');
      
      return JSON.parse(jsonMatch[0]);
    });
    
    return result;
  } catch (error) {
    console.error('Gemini scoring error:', error);
    // Fallback scoring
    return {
      a: { style: 5, creativity: 5, technicality: 5, [scoringCriteria]: 5 },
      b: { style: 5, creativity: 5, technicality: 5, [scoringCriteria]: 5 },
      winner: Math.random() > 0.5 ? 'a' : 'b',
      notes: 'Scoring temporarily unavailable - using fallback scores.'
    };
  }
}

export async function POST(request: NextRequest) {
  try {
    // Check for Gemini API key
    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json({
        error: 'Gemini API key not configured',
        code: 'GEMINI_API_KEY_MISSING'
      }, { status: 500 });
    }

    // Get matchId from URL
    const url = new URL(request.url);
    const matchId = url.searchParams.get('matchId');
    
    if (!matchId || isNaN(parseInt(matchId))) {
      return NextResponse.json({
        error: 'Valid matchId is required',
        code: 'INVALID_MATCH_ID'
      }, { status: 400 });
    }

    // Parse request body
    const body = await request.json();
    const { prompt, roundIndex } = body;

    // Validate inputs
    if (!prompt || typeof prompt !== 'string') {
      return NextResponse.json({
        error: 'Prompt is required',
        code: 'MISSING_PROMPT'
      }, { status: 400 });
    }

    if (prompt.length < 1 || prompt.length > 500) {
      return NextResponse.json({
        error: 'Prompt must be between 1 and 500 characters',
        code: 'INVALID_PROMPT_LENGTH'
      }, { status: 400 });
    }

    if (typeof roundIndex !== 'number' || roundIndex < 0 || roundIndex > 2) {
      return NextResponse.json({
        error: 'Round index must be between 0 and 2',
        code: 'INVALID_ROUND_INDEX'
      }, { status: 400 });
    }

    // Get match data
    const match = await db.select()
      .from(matches)
      .where(eq(matches.id, parseInt(matchId)))
      .limit(1);

    if (match.length === 0) {
      return NextResponse.json({
        error: 'Match not found',
        code: 'MATCH_NOT_FOUND'
      }, { status: 404 });
    }

    const matchData = match[0];

    // Validate match is in playable status
    if (matchData.status !== 'active' && matchData.status !== 'playing') {
      return NextResponse.json({
        error: 'Match is not in playable status',
        code: 'MATCH_NOT_PLAYABLE'
      }, { status: 400 });
    }

    // Get agent A and B details
    const agentA = await db.select()
      .from(agents)
      .where(eq(agents.id, matchData.agentAId!))
      .limit(1);

    const agentB = await db.select()
      .from(agents)
      .where(eq(agents.id, matchData.agentBId!))
      .limit(1);

    if (agentA.length === 0 || agentB.length === 0) {
      return NextResponse.json({
        error: 'Agent not found',
        code: 'AGENT_NOT_FOUND'
      }, { status: 404 });
    }

    const agentAData = agentA[0];
    const agentBData = agentB[0];

    // Generate responses
    const [responseA, responseB] = await Promise.all([
      generateResponse(agentAData.persona || agentAData.name, prompt, matchData.mode),
      generateResponse(agentBData.persona || agentBData.name, prompt, matchData.mode)
    ]);

    // Score responses
    const scores = await scoreResponses(responseA, responseB, matchData.mode);

    // Create round data
    const roundData = {
      prompt: prompt,
      responses: {
        user: {
          text: responseA,
          scores: scores.a
        },
        opp: {
          text: responseB,
          scores: scores.b
        }
      },
      roundWinner: scores.winner === 'a' ? 'user' : 'opp'
    };

    // Update match roundsData
    let currentRoundsData: any[] = [];
    try {
      currentRoundsData = matchData.roundsData ? JSON.parse(JSON.stringify(matchData.roundsData)) : [];
    } catch (error) {
      currentRoundsData = [];
    }

    // Ensure roundsData array has correct length
    while (currentRoundsData.length <= roundIndex) {
      currentRoundsData.push(null);
    }

    currentRoundsData[roundIndex] = roundData;

    // Update match in database
    const updatedMatch = await db.update(matches)
      .set({
        roundsData: currentRoundsData,
        status: 'playing'
      })
      .where(eq(matches.id, parseInt(matchId)))
      .returning();

    if (updatedMatch.length === 0) {
      return NextResponse.json({
        error: 'Failed to update match',
        code: 'UPDATE_FAILED'
      }, { status: 500 });
    }

    // Return success response
    return NextResponse.json({
      ok: true,
      data: {
        round: roundData,
        responses: {
          a: responseA,
          b: responseB
        },
        scores: scores
      }
    }, { status: 200 });

  } catch (error) {
    console.error('POST error:', error);
    return NextResponse.json({
      error: 'Internal server error: ' + error,
      code: 'INTERNAL_ERROR'
    }, { status: 500 });
  }
}