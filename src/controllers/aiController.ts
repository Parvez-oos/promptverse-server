import { Response } from 'express';
import OpenAI from 'openai';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { AuthRequest } from '../types';
import Prompt from '../models/Prompt';

const openai = process.env.OPENAI_API_KEY
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

const genAI = process.env.GEMINI_API_KEY
  ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
  : null;

const AI_PROVIDERS = ['ChatGPT', 'Gemini', 'Claude', 'Copilot'] as const;

export const testPrompt = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { content, aiTool } = req.body;

    if (!content) {
      res.status(400).json({ message: 'Prompt content is required.' });
      return;
    }

    if (!aiTool || !AI_PROVIDERS.includes(aiTool as any)) {
      res.status(400).json({ message: 'Valid AI tool (ChatGPT, Gemini, Claude, Copilot) is required.' });
      return;
    }

    let result = '';

    switch (aiTool) {
      case 'ChatGPT':
      case 'Claude':
      case 'Copilot': {
        if (!openai) {
          res.status(503).json({ message: 'OpenAI API key not configured. Prompt cannot be tested with this AI tool.' });
          return;
        }
        const model = aiTool === 'ChatGPT' ? 'gpt-4o-mini' : aiTool === 'Claude' ? 'claude-3-haiku-20240307' : 'gpt-4o-mini';
        const completion = await openai.chat.completions.create({
          model,
          messages: [
            {
              role: 'system',
              content: 'You are an AI prompt tester. Execute the following prompt and return the response. Be creative and thorough.',
            },
            { role: 'user', content },
          ],
          max_tokens: 2000,
        });
        result = completion.choices[0]?.message?.content || 'No response generated.';
        break;
      }

      case 'Gemini': {
        if (!genAI) {
          res.status(503).json({ message: 'Gemini API key not configured. Prompt cannot be tested with Gemini.' });
          return;
        }
        const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
        const geminiResult = await model.generateContent(content);
        result = geminiResult.response.text();
        break;
      }

      default:
        res.status(400).json({ message: 'Unsupported AI tool.' });
        return;
    }

    res.status(200).json({
      success: true,
      data: {
        content: result,
        aiTool,
        model: aiTool === 'Gemini' ? 'gemini-2.0-flash' : 'gpt-4o-mini',
      },
    });
  } catch (error: any) {
    console.error('AI Test Error:', error);
    res.status(500).json({
      message: error?.response?.data?.error?.message || error?.message || 'Failed to test prompt with AI.',
    });
  }
};
