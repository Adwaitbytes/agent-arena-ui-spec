import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { z } from 'zod';
import { smartUpload } from '@/lib/storage';

const generateSchema = z.object({
    agentPrompt: z.string().min(1),
    targetInput: z.string().min(1),
    agentName: z.string().optional(),
});

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const validation = generateSchema.safeParse(body);

        if (!validation.success) {
            return NextResponse.json(
                { ok: false, error: validation.error.issues.map(i => i.message).join(', ') },
                { status: 400 }
            );
        }

        const { agentPrompt, targetInput, agentName } = validation.data;

        if (!process.env.GEMINI_API_KEY) {
            return NextResponse.json(
                { ok: false, error: 'Gemini API key not configured' },
                { status: 500 }
            );
        }

        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' }); // Normal agents use 1.5 Flash

        // Construct the prompt for the AI
        const fullPrompt = `You are an AI agent${agentName ? ` named "${agentName}"` : ''} with the following personality and instructions:

${agentPrompt}

Now respond to this input: "${targetInput}"

Important guidelines:
- Stay true to your character/prompt personality
- Be creative and engaging
- Keep responses under 200 words
- If your prompt involves roasting/comedy, be witty but not offensive
- If your prompt involves other styles (poetic, logical, etc.), embody that style
- Generate a response that showcases your unique personality

Respond as your character would:`;

        const result = await model.generateContent(fullPrompt);
        const response = await result.response;
        const text = response.text();

        // Create response data
        const responseData = {
            response: text.trim(),
            agentName: agentName || 'Agent',
            timestamp: new Date().toISOString(),
            prompt: targetInput,
            agentPrompt: agentPrompt,
            generatedBy: 'gemini-1.5-flash'
        };

        // Store using IPFS via Pinata
        let storageHash = null;
        let storageType = null;

        try {
            const result = await smartUpload(responseData, {
                name: `agent-response-${agentName || 'unknown'}-${Date.now()}.json`,
                description: `Agent response for ${agentName || 'unknown'} at ${new Date().toISOString()}`
            });

            storageHash = result.cid;
            storageType = result.storageType;
            console.log(`Agent response stored to ${result.storageType}: ${storageHash}`);
        } catch (error) {
            console.error('Failed to store agent response:', error);
        }

        return NextResponse.json({
            ok: true,
            data: {
                ...responseData,
                storageHash,
                storageType,
                // Legacy compatibility  
                ipfsHash: storageType === 'pinata' ? storageHash : null
            },
        });

    } catch (error) {
        console.error('Generate API error:', error);
        return NextResponse.json(
            { ok: false, error: 'Failed to generate response' },
            { status: 500 }
        );
    }
}