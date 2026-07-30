import { Request, Response, NextFunction } from 'express';
import { AiService } from './ai.service';
import { sendResponse } from '@utils/response.util';
import { AppError } from '../../middleware/error.middleware';
import { z } from 'zod';

const fileAttachmentSchema = z.object({
  base64: z.string().optional(),
  mimeType: z.string().optional(),
  url: z.string().optional()
}).optional();

const bulkFileAttachmentSchema = z.object({
  base64: z.string().optional(),
  mimeType: z.string().optional(),
  name: z.string().optional(),
  url: z.string().optional()
});

const ownerDetailSchema = z.object({
  name: z.string(),
  share: z.number(),
  mobile: z.string()
});

const analyzeLandPlotSchema = z.object({
  name: z.string().optional(),
  projectName: z.string().optional(),
  projectId: z.string().optional(),
  address: z.string().optional(),
  village: z.string().optional(),
  surveyNumber: z.string().optional(),
  googleMapLink: z.string().optional(),
  area: z.number().optional(),
  unit: z.string().optional(),
  roadWidth: z.number().optional(),
  askingPrice: z.number().optional(),
  zoning: z.string().optional(),
  soilReport: fileAttachmentSchema,
  titleDeed: fileAttachmentSchema,
  titleDeeds: z.array(bulkFileAttachmentSchema).optional(),
  additionalNotes: z.string().optional(),
  owners: z.array(ownerDetailSchema).optional(),
  chatPrompt: z.string().optional()
});

const analyzeJVAgreementSchema = z.object({
  projectName: z.string().optional(),
  landOwnerName: z.string().optional(),
  builderName: z.string().optional(),
  investorName: z.string().optional(),
  landValue: z.number().optional(),
  constructionCost: z.number().optional(),
  investorFunds: z.number().optional(),
  landOwnerTerms: z.string().optional(),
  builderTerms: z.string().optional(),
  investorTerms: z.string().optional(),
  termSheet: fileAttachmentSchema,
  chatPrompt: z.string().optional()
});

const calculateFeasibilitySchema = z.object({
  projectName: z.string(),
  area: z.number(),
  fsi: z.number(),
  sellingPrice: z.number(),
  materialCost: z.number(),
  bylawsDoc: fileAttachmentSchema,
  metadata: z.any().optional()
});

const predictApprovalDelaySchema = z.object({
  authorityName: z.string(),
  status: z.string(),
  submissionDate: z.string(),
  objectionLetter: fileAttachmentSchema,
  metadata: z.any().optional()
});

const generatePropertyPlanSchema = z.object({
  projectName: z.string(),
  plotSize: z.number(),
  roadWidth: z.number(),
  fsi: z.number(),
  budget: z.number(),
  targetCustomer: z.string(),
  frontSetback: z.number().optional(),
  rearSetback: z.number().optional(),
  sideSetbacks: z.number().optional(),
  requestedFloors: z.number().optional(),
  version: z.string().optional(),
  parentPlanId: z.string().nullable().optional(),
  facing: z.string().optional(),
  parkingType: z.string().optional(),
  gardenRequired: z.boolean().optional(),
  swimmingPool: z.boolean().optional(),
  commercialShops: z.boolean().optional(),
  flatMix: z.string().optional(),
  liftCount: z.number().optional(),
  staircaseCount: z.number().optional(),
  landCost: z.number().optional(),
  expectedSalesRate: z.number().optional(),
  flatsPerFloor: z.number().optional(),
  customInstructions: z.string().optional()
});

const updateJVAgreementLifecycleSchema = z.object({
  milestones: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      plannedDate: z.string().nullable().optional(),
      actualDate: z.string().nullable().optional(),
      status: z.string(),
      responsibleParty: z.string()
    })
  ).optional(),
  paymentSchedule: z.array(
    z.object({
      id: z.string(),
      installment: z.number(),
      amount: z.number(),
      dueDate: z.string().nullable().optional(),
      paidDate: z.string().nullable().optional(),
      status: z.string()
    })
  ).optional(),
  legalChecklist: z.record(z.string(), z.boolean()).optional(),
  basicDetails: z.record(z.string(), z.any()).optional(),
  financialDetails: z.record(z.string(), z.any()).optional(),
  revenueSharingDetails: z.record(z.string(), z.any()).optional(),
  agreementDetails: z.record(z.string(), z.any()).optional(),
  landOwnerDetails: z.record(z.string(), z.any()).optional(),
  builderDetails: z.record(z.string(), z.any()).optional(),
  investorDetails: z.record(z.string(), z.any()).optional()
});


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

  getLandPlots = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const companyId = req.user!.company_id;
      const data = await this.service.getLandPlots(companyId);
      sendResponse(res, 200, 'Land plots retrieved successfully', data);
    } catch (error) {
      next(error);
    }
  };

  analyzeLandPlot = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const companyId = req.user!.company_id;
      const validated = analyzeLandPlotSchema.parse(req.body);
      const result = await this.service.analyzeLandPlot(companyId, validated);
      sendResponse(res, 201, 'Land plot analyzed successfully', result);
    } catch (error) {
      next(error);
    }
  };

  getJVAgreements = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const companyId = req.user!.company_id;
      const data = await this.service.getJVAgreements(companyId);
      sendResponse(res, 200, 'JV agreements retrieved successfully', data);
    } catch (error) {
      next(error);
    }
  };

  analyzeJVAgreement = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const companyId = req.user!.company_id;
      const validated = analyzeJVAgreementSchema.parse(req.body);
      const result = await this.service.analyzeJVAgreement(companyId, validated);
      sendResponse(res, 201, 'JV agreement terms analyzed successfully', result);
    } catch (error) {
      next(error);
    }
  };

  getFeasibilityStudies = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const companyId = req.user!.company_id;
      const data = await this.service.getFeasibilityStudies(companyId);
      sendResponse(res, 200, 'Feasibility studies retrieved successfully', data);
    } catch (error) {
      next(error);
    }
  };

  calculateFeasibility = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const companyId = req.user!.company_id;
      const validated = calculateFeasibilitySchema.parse(req.body);
      const result = await this.service.calculateFeasibility(companyId, validated);
      sendResponse(res, 201, 'Feasibility analysis completed successfully', result);
    } catch (error) {
      next(error);
    }
  };

  getApprovalTasks = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const companyId = req.user!.company_id;
      const data = await this.service.getApprovalTasks(companyId);
      sendResponse(res, 200, 'Approval tasks retrieved successfully', data);
    } catch (error) {
      next(error);
    }
  };

  predictApprovalDelay = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const companyId = req.user!.company_id;
      const validated = predictApprovalDelaySchema.parse(req.body);
      const result = await this.service.predictApprovalDelay(companyId, validated);
      sendResponse(res, 201, 'Approval delay analysis completed successfully', result);
    } catch (error) {
      next(error);
    }
  };

  getPropertyPlans = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const companyId = req.user!.company_id;
      const data = await this.service.getPropertyPlans(companyId);
      sendResponse(res, 200, 'Property plans retrieved successfully', data);
    } catch (error) {
      next(error);
    }
  };

  generatePropertyPlan = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const companyId = req.user!.company_id;
      const validated = generatePropertyPlanSchema.parse(req.body);
      const result = await this.service.generatePropertyPlan(companyId, validated);
      sendResponse(res, 201, 'Property plan generated successfully', result);
    } catch (error) {
      next(error);
    }
  };

  updateJVAgreementLifecycle = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const companyId = req.user!.company_id;
      const { id } = req.params;
      const validated = updateJVAgreementLifecycleSchema.parse(req.body);
      const result = await this.service.updateJVAgreementLifecycle(companyId, id as string, validated);
      sendResponse(res, 200, 'JV lifecycle status updated successfully', result);
    } catch (error) {
      next(error);
    }
  };

  getDocumentCatalog = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const companyId = req.user!.company_id;
      const data = await this.service.getDocumentCatalog(companyId);
      sendResponse(res, 200, 'Unified document catalog retrieved successfully', data);
    } catch (error) {
      next(error);
    }
  };

  updateLandPlot = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const companyId = req.user!.company_id;
      const { id } = req.params;
      const validated = analyzeLandPlotSchema.parse(req.body);
      const result = await this.service.updateLandPlot(companyId, id as string, validated);
      sendResponse(res, 200, 'Land plot updated and re-analyzed successfully', result);
    } catch (error) {
      next(error);
    }
  };
}
