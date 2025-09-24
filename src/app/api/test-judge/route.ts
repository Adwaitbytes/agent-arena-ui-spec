import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { z } from 'zod';

const testJudgeSchema = z.object({
    agentAResponse: z.string(),
    agentBResponse: z.string(),
    prompt: z.string(),
});

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const validation = testJudgeSchema.safeParse(body);

        if (!validation.success) {
            return NextResponse.json(
                { ok: false, error: validation.error.issues.map(i => i.message).join(', ') },
                { status: 400 }
            );
        }

        const { agentAResponse, agentBResponse, prompt } = validation.data;

        const superagentKey = process.env.SUPERAGENT_GEMINI_KEY;
        if (!superagentKey) {
            return NextResponse.json(
                { ok: false, error: 'Superagent key not configured' },
                { status: 500 }
            );
        }

        const genAI = new GoogleGenerativeAI(superagentKey);
        const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' }); // Superagent uses 2.0 Flash Experimental

        const superJudgePrompt = `You are a SUPERAGENT - an elite AI judge with expertise in evaluating AI agent responses.

COMPETITION DETAILS:
Challenge Prompt: "${prompt}"

AGENT A Response: "${agentAResponse}"
AGENT B Response: "${agentBResponse}"

EVALUATION CRITERIA (each scored 0-10):
1. CREATIVITY & ORIGINALITY
2. PROMPT ADHERENCE & RELEVANCE  
3. LANGUAGE MASTERY & STYLE
4. EMOTIONAL IMPACT & ENGAGEMENT

Provide your expert judgment in this exact JSON format:
{
  "detailed_scores": {
    "creativity": {"A": 7, "B": 8},
    "relevance": {"A": 9, "B": 7}, 
    "language": {"A": 8, "B": 7},
    "engagement": {"A": 7, "B": 8}
  },
  "category_totals": {
    "A": 31,
    "B": 30
  },
  "winner": "A",
  "confidence": 0.85,
  "summary": "Detailed analysis of why the winner was chosen"
}

Be thorough and fair in your assessment.`;

        const result = await model.generateContent(superJudgePrompt);
        const response = await result.response;
        const text = response.text().trim();

        // Try to parse the JSON response
        let judgment;
        try {
            judgment = JSON.parse(text);
        } catch (parseError) {
            return NextResponse.json({
                ok: false,
                error: 'Failed to parse judge response',
                rawResponse: text,
                parseError: parseError instanceof Error ? parseError.message : 'Unknown parse error'
            });
        }

        return NextResponse.json({
            ok: true,
            data: {
                judgment,
                rawResponse: text
            }
        });

    } catch (error) {
        console.error('Test judge API error:', error);
        return NextResponse.json(
            { ok: false, error: 'Failed to test judge' },
            { status: 500 }
        );
    }
}