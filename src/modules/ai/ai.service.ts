import { prisma } from '../../config/prisma.config';

export class AiService {
  async getSessions(userId: string, companyId: string) {
    return (prisma as any).aiBoard.findMany({
      where: { userId, companyId },
      orderBy: { updatedAt: 'desc' },
      select: {
        id: true,
        title: true,
        createdAt: true,
        updatedAt: true
      }
    });
  }

  async getSessionById(id: string, userId: string, companyId: string) {
    return (prisma as any).aiBoard.findFirst({
      where: { id, userId, companyId }
    });
  }

  async createSession(userId: string, companyId: string, title: string, messages: any[]) {
    return (prisma as any).aiBoard.create({
      data: {
        userId,
        companyId,
        title,
        messages
      }
    });
  }

  async updateSession(id: string, userId: string, companyId: string, messages: any[]) {
    const session = await this.getSessionById(id, userId, companyId);
    if (!session) {
      throw new Error('Chat session not found');
    }

    let title = session.title;
    if (title === 'New Chat' || !title) {
      const firstUserMsg = messages.find(m => m.role === 'user');
      if (firstUserMsg) {
        title = firstUserMsg.text.length > 35 
          ? firstUserMsg.text.substring(0, 35) + '...' 
          : firstUserMsg.text;
      }
    }

    return (prisma as any).aiBoard.update({
      where: { id },
      data: {
        title,
        messages
      }
    });
  }

  async deleteSession(id: string, userId: string, companyId: string) {
    return (prisma as any).aiBoard.deleteMany({
      where: { id, userId, companyId }
    });
  }

  async askGemini(history: { role: string; text: string }[]) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === 'your_gemini_api_key_here') {
      throw new Error('GEMINI_API_KEY is not configured in the backend environment. Please set GEMINI_API_KEY in your .env file.');
    }

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

    const systemInstruction = {
      parts: [
        {
          text: `You are the Innonsh Construction ERP AI Assistant. You are an expert advisor for builders, contractors, and project managers. You help with estimations (BOQs), WBS planning, safety protocols, equipment maintenance schedules, labor management, raw material specifications, and budgeting.
          
          Guidelines:
          - Provide professional, clear, and highly detailed answers.
          - Output structured markdown tables, lists, and code formatters where relevant.
          - Incorporate standard construction terms (e.g. RCC, brickwork, excavation, safety margins, curing times, lead times).
          - Be concise but complete. Feel free to explain step-by-step methods.`
        }
      ]
    };

    const contents = history.map(msg => ({
      role: msg.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: msg.text }]
    }));

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          contents,
          systemInstruction
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Gemini API error response:', errorText);
        throw new Error(`Gemini API failed with status ${response.status}: ${errorText || 'Unknown Error'}`);
      }

      const data = (await response.json()) as any;
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

      if (!text) {
        throw new Error('Gemini API returned an empty or invalid response.');
      }

      return text;
    } catch (err: any) {
      console.error('Failed to communicate with Gemini API:', err);
      throw new Error(err.message || 'Failed to connect to the Gemini API server.');
    }
  }
}
