import { Request, Response, NextFunction } from 'express';
import { AiService } from './ai.service';
import { sendResponse } from '@utils/response.util';
import { AppError } from '../../middleware/error.middleware';

export class AiController {
  private service: AiService;

  constructor() {
    this.service = new AiService();
  }

  getSessions = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.id;
      const companyId = req.user!.company_id;
      const sessions = await this.service.getSessions(userId, companyId);
      sendResponse(res, 200, 'Chat sessions retrieved', sessions);
    } catch (error) {
      next(error);
    }
  };

  getSessionById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.id;
      const companyId = req.user!.company_id;
      const session = await this.service.getSessionById(req.params.id as string, userId, companyId);
      if (!session) {
        throw new AppError('Chat session not found', 404);
      }
      sendResponse(res, 200, 'Chat session retrieved', session);
    } catch (error) {
      next(error);
    }
  };

  chat = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.id;
      const companyId = req.user!.company_id;
      const { sessionId, message } = req.body;

      if (!message || !message.text) {
        throw new AppError('Message content is required', 400);
      }

      let session: any;
      let history: any[] = [];

      if (sessionId) {
        session = await this.service.getSessionById(sessionId, userId, companyId);
        if (!session) {
          throw new AppError('Chat session not found', 404);
        }
        history = Array.isArray(session.messages) ? session.messages : [];
      }

      const userMessage = {
        role: 'user',
        text: message.text,
        timestamp: new Date().toISOString()
      };
      history.push(userMessage);

      const responseText = await this.service.askGemini(history);

      const assistantMessage = {
        role: 'assistant',
        text: responseText,
        timestamp: new Date().toISOString()
      };
      history.push(assistantMessage);

      if (sessionId) {
        session = await this.service.updateSession(sessionId, userId, companyId, history);
      } else {
        const title = message.text.length > 35 
          ? message.text.substring(0, 35) + '...' 
          : message.text;
        session = await this.service.createSession(userId, companyId, title, history);
      }

      sendResponse(res, 200, 'Chat response processed', {
        sessionId: session.id,
        title: session.title,
        messages: session.messages
      });
    } catch (error) {
      next(error);
    }
  };

  deleteSession = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.id;
      const companyId = req.user!.company_id;
      await this.service.deleteSession(req.params.id as string, userId, companyId);
      sendResponse(res, 200, 'Chat session deleted');
    } catch (error) {
      next(error);
    }
  };
}
