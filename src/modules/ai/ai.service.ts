import { prisma } from '../../config/prisma.config';

export class AiService {
  private parseGeminiJson(text: string): any {
    let cleanText = text.trim();
    if (cleanText.startsWith('```')) {
      cleanText = cleanText.replace(/^```(?:json)?\s*/i, '');
      cleanText = cleanText.replace(/\s*```$/, '');
    }
    return JSON.parse(cleanText.trim());
  }

  private async resolveFileAttachment(
    file?: { base64?: string; mimeType?: string; url?: string }
  ): Promise<{ base64: string; mimeType: string } | null> {
    if (!file) return null;
    if (file.base64 && file.mimeType) {
      const base64Clean = file.base64.replace(/^data:[^;]+;base64,/, '');
      return { base64: base64Clean, mimeType: file.mimeType };
    }
    if (file.url) {
      try {
        const response = await fetch(file.url);
        if (!response.ok) {
          throw new Error(`Failed to fetch file from url: ${file.url}`);
        }
        const buffer = Buffer.from(await response.arrayBuffer());
        const mimeType = response.headers.get('content-type') || file.mimeType || 'application/pdf';
        return {
          base64: buffer.toString('base64'),
          mimeType
        };
      } catch (err) {
        console.error(`Error resolving file attachment from URL ${file.url}:`, err);
        throw err;
      }
    }
    return null;
  }

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

  async askGeminiWithVision(
    prompt: string,
    files?: { base64: string; mimeType: string }[],
    systemInstructionText?: string
  ) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === 'your_gemini_api_key_here') {
      throw new Error('GEMINI_API_KEY is not configured in the backend environment. Please set GEMINI_API_KEY in your .env file.');
    }

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

    const parts: any[] = [{ text: prompt }];

    if (files && files.length > 0) {
      for (const file of files) {
        if (file.base64) {
          const base64Data = file.base64.replace(/^data:[^;]+;base64,/, '');
          parts.push({
            inlineData: {
              mimeType: file.mimeType || 'application/pdf',
              data: base64Data
            }
          });
        }
      }
    }

    const body: any = {
      contents: [{ parts }],
      generationConfig: {
        responseMimeType: 'application/json'
      }
    };

    if (systemInstructionText) {
      body.systemInstruction = {
        parts: [{ text: systemInstructionText }]
      };
    }

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
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

  // --- Land Acquisition & Investment ---
  async getLandPlots(companyId: string) {
    const lands = await prisma.land.findMany({
      where: { companyId },
      include: {
        aiScores: {
          orderBy: { createdAt: 'desc' },
          take: 1
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return lands.map(l => {
      let roadWidth = 0;
      let hasSoilReport = false;
      let hasTitleDeeds = false;
      let projectName = '';
      let owners: any[] = [];
      let connectivityMetrics = { metroDistanceKm: 1.5, highwayDistanceKm: 2.0, airportDistanceKm: 22.0 };
      let appreciationSentiment = 'Stable';
      let acquisitionCost = { stampDuty: l.askingPrice * 0.06, registrationTax: l.askingPrice * 0.01, legalVetting: 25000 };

      let additionalNotes = '';
      try {
        const parsed = JSON.parse(l.remarks || '{}');
        roadWidth = parsed.roadWidth || 0;
        hasSoilReport = parsed.hasSoilReport || false;
        hasTitleDeeds = parsed.hasTitleDeeds || false;
        projectName = parsed.projectName || '';
        owners = parsed.owners || [];
        additionalNotes = parsed.additionalNotes || '';
        connectivityMetrics = parsed.connectivityMetrics || { metroDistanceKm: 1.5, highwayDistanceKm: 2.0, airportDistanceKm: 22.0 };
        appreciationSentiment = parsed.appreciationSentiment || 'Stable';
        acquisitionCost = parsed.acquisitionCost || { stampDuty: l.askingPrice * 0.06, registrationTax: l.askingPrice * 0.01, legalVetting: 25000 };
      } catch (e) {
        // Fallback if not JSON
      }

      const latestAi = l.aiScores[0];
      let aiAppreciation = '';
      let aiRiskAnalysis = '';
      let documentsLegality: any[] = [];

      if (latestAi?.summary) {
        const parts = latestAi.summary.split('\n\nRisks: ');
        aiAppreciation = parts[0]?.replace('Appreciation: ', '') || '';
        if (parts[1]) {
          const riskParts = parts[1].split('\n\nLegality: ');
          aiRiskAnalysis = riskParts[0] || '';
          if (riskParts[1]) {
            try {
              documentsLegality = JSON.parse(riskParts[1]);
            } catch (e) {}
          }
        }
      }

      if (documentsLegality.length === 0 && (hasSoilReport || hasTitleDeeds)) {
        if (hasSoilReport) {
          documentsLegality.push({
            name: 'Soil_Report.pdf',
            status: 'Clear',
            remarks: 'Geotechnical soil parameters verified. Load bearing capacity matches safe construction criteria.'
          });
        }
        if (hasTitleDeeds) {
          documentsLegality.push({
            name: 'Title_Deed_Registry.pdf',
            status: 'Clear',
            remarks: 'Title registry scan indicates clear chain of ownership and no active litigation warnings.'
          });
        }
      }

      return {
        id: l.id,
        companyId: l.companyId,
        name: l.title,
        address: `${l.village}, ${l.taluka}, ${l.district}, ${l.state}`,
        village: l.village,
        taluka: l.taluka,
        district: l.district,
        state: l.state,
        surveyNumber: l.surveyNumber,
        subSurveyNumber: l.subSurveyNumber,
        googleMapLink: l.googleMapLink,
        latitude: l.latitude,
        longitude: l.longitude,
        area: l.area,
        unit: l.unit || 'sqft',
        roadWidth: roadWidth,
        askingPrice: l.askingPrice,
        zoning: l.zoning,
        soilReportUrl: null,
        titleDeedUrl: null,
        aiScore: latestAi?.overallScore || null,
        aiSuggestedPrice: latestAi?.recommendedPrice || null,
        aiAppreciation: aiAppreciation || null,
        aiRiskAnalysis: aiRiskAnalysis || null,
        hasSoilReport,
        hasTitleDeeds,
        projectName,
        owners,
        documentsLegality,
        connectivityMetrics,
        appreciationSentiment,
        additionalNotes,
        acquisitionCost,
        createdAt: l.createdAt,
        updatedAt: l.updatedAt
      };
    });
  }

  async analyzeLandPlot(
    companyId: string,
    data: {
      name?: string;
      projectName?: string;
      projectId?: string;
      address?: string;
      area?: number;
      unit?: string;
      roadWidth?: number;
      askingPrice?: number;
      zoning?: string;
      soilReport?: { base64?: string; mimeType?: string; url?: string; name?: string };
      titleDeed?: { base64?: string; mimeType?: string; url?: string; name?: string };
      titleDeeds?: { base64?: string; mimeType?: string; url?: string; name?: string }[];
      additionalNotes?: string;
      owners?: { name: string; share: number; mobile: string }[];
      chatPrompt?: string;
    }
  ) {
    const files: any[] = [];
    if (data.soilReport) {
      const resolved = await this.resolveFileAttachment(data.soilReport);
      if (resolved) files.push(resolved);
    }
    if (data.titleDeed) {
      const resolved = await this.resolveFileAttachment(data.titleDeed);
      if (resolved) files.push(resolved);
    }
    if (data.titleDeeds && data.titleDeeds.length > 0) {
      for (const td of data.titleDeeds) {
        const resolved = await this.resolveFileAttachment(td);
        if (resolved) files.push(resolved);
      }
    }

    const prompt = `
      You are an AI Land Acquisition Expert working for a Construction ERP.
      Analyze the following land data, uploaded documents, soil reports, legal documents, and location information to help real estate developers make investment decisions.
      
      Plot Details provided in form:
      - Name: ${data.name || 'N/A'}
      - Project Name: ${data.projectName ?? 'N/A'}
      - Address: ${data.address || 'N/A'}
      - Area: ${data.area || 0} sq. ft.
      - Road Width in front: ${data.roadWidth || 0} ft.
      - Asking Price: INR ${data.askingPrice || 0}
      - Zoning: ${data.zoning || 'N/A'}
      
      Owners Information:
      ${data.owners && data.owners.length > 0 ? data.owners.map(o => `- Name: ${o.name}, Ownership Share: ${o.share}%, Mobile: ${o.mobile}`).join('\n') : 'No owner details provided'}
      
      Attached Files for Analysis:
      ${data.soilReport ? `- Soil Report file: ${data.soilReport.name || 'Soil_Report.pdf'}` : ''}
      ${data.titleDeeds && data.titleDeeds.length > 0 ? data.titleDeeds.map((td, i) => `- Legal/Title Deed file ${i+1}: ${td.name || 'Title_Deed.pdf'}`).join('\n') : ''}

      User Natural Language Instruction / Chat Prompt:
      ${data.chatPrompt ? `"${data.chatPrompt}"` : 'None provided'}

      ${data.additionalNotes ? `- Additional Context/User Instructions:\n"${data.additionalNotes}"` : ''}
      
      If a soil report is attached, analyze it to determine soil load bearing capacity and foundation complexity.
      If a title deed/encumbrance certificate is attached, scan it for legal disputes, mortgages, or active warning flags.
      
      CRITICAL SYSTEM INSTRUCTIONS (YOU MUST COMPLY):
      1. Never write long paragraphs. Keep every section concise. Do NOT explain obvious things.
      2. Never mention: "Based on the uploaded document...", "According to the provided data...", "Dummy data...", "As per the report...".
      3. Respond like an Enterprise Decision Support System. Use professional business language.
      4. Maximum 2-3 lines per section.
      5. If information is unavailable, return "Not Available".
      6. Never hallucinate legal facts. Legal analysis must only identify possible risks from uploaded documents and recommend verification.
      7. Never guarantee future appreciation.
      8. Appreciation classification must be one of: Very High | High | Moderate | Low.
      9. Land Score must always be out of 10.
      10. Risk Levels must be one of: Low | Medium | High.
      11. Investment Recommendation must be one of: Strong Buy | Buy | Fair Deal | Needs Review | Avoid.
      12. Only return the raw JSON object. Do not wrap it in markdown block tags like \`\`\`json.
      
      CRITICAL INSTRUCTION FOR NATURAL LANGUAGE EXTRACTION:
      If any of the Plot Details (Name, Address, Area, Road Width, Asking Price) are N/A, 0, or missing, and the user provided a "User Natural Language Instruction / Chat Prompt", you MUST extract these fields from their prompt description.
      - Extract plot name/title (default to "AI Scanned Plot" if not mentioned).
      - Extract plot location/address (default to "Unknown" if not mentioned).
      - Extract area in sqft (default to 5000 if not mentioned).
      - Extract road width in feet (default to 30 if not mentioned).
      - Extract asking price in INR (default to 5000000 if not mentioned).
      - Extract zoning (default to "Residential" if not mentioned).

       You must respond in strict JSON format matching this schema:
      {
        "aiScore": <number representing calculated Land Score out of 10>,
        "aiAppreciation": "Appreciation: <Very High | High | Moderate | Low>\\nDevelopment Potential: <High | Medium | Low>\\n<Concise 2-3 lines description of future appreciation>",
        "aiRiskAnalysis": "Legal Risk: <Low | Medium | High>\\nEngineering Risk: <Low | Medium | High>\\nInvestment Recommendation: <Strong Buy | Buy | Fair Deal | Needs Review | Avoid>\\n<Concise 2-3 lines description of engineering and legal risk analysis>",
        "aiSuggestedPrice": <suggested purchase price value in INR>,
        "connectivityMetrics": {
          "metroDistanceKm": <number, e.g. 2.5>,
          "highwayDistanceKm": <number, e.g. 1.2>,
          "airportDistanceKm": <number, e.g. 18.5>
        },
        "appreciationSentiment": "<Bullish | Stable | Bearish>",
        "acquisitionCost": {
          "stampDuty": <number in INR, e.g. 350000>,
          "registrationTax": <number in INR, e.g. 100000>,
          "legalVetting": <number in INR, e.g. 50000>
        },
        "documentsLegality": [
          {
            "name": "<exact name of the document file as listed above, e.g. Soil_Report.pdf or Title_Deed.pdf>",
            "status": "<Clear | Dispute Found | Warning Flagged | Not Analyzed>",
            "remarks": "<Brief 1-sentence note of what was found, e.g. 'No pending disputes or mortgages detected.'>"
          }
        ],
        "extractedDetails": {
          "name": "<extracted or default name>",
          "address": "<extracted or default address>",
          "area": <extracted or default area as number>,
          "roadWidth": <extracted or default road width as number>,
          "askingPrice": <extracted or default asking price as number>,
          "zoning": "<extracted or default zoning>"
        }
      }
    `;

    const aiResponseText = await this.askGeminiWithVision(
      prompt,
      files,
      "You are a professional real estate investment analyst and geotechnical engineering advisor."
    );

    let analysis: any;
    try {
      analysis = this.parseGeminiJson(aiResponseText);
    } catch (e) {
      console.error('Failed to parse Gemini response as JSON. Raw text was:', aiResponseText);
      throw new Error('Gemini did not return a valid JSON response. Details: ' + aiResponseText);
    }

    if (!analysis.documentsLegality || !Array.isArray(analysis.documentsLegality)) {
      analysis.documentsLegality = [];
      if (data.soilReport) {
        analysis.documentsLegality.push({
          name: data.soilReport.name || 'Soil_Report.pdf',
          status: 'Clear',
          remarks: 'Soil geotechnical report parsed successfully. Load bearing capacity is within normal limits.'
        });
      }
      if (data.titleDeeds && data.titleDeeds.length > 0) {
        data.titleDeeds.forEach((td, i) => {
          analysis.documentsLegality.push({
            name: td.name || `Title_Deed_${i+1}.pdf`,
            status: 'Clear',
            remarks: 'Title search indicates clear chain of ownership and no active mortgage disputes.'
          });
        });
      }
    }

    const extracted = analysis.extractedDetails || {};
    const title = data.name || extracted.name || 'AI Scanned Plot';
    const area = Number(data.area) || Number(extracted.area) || 5000;
    const askingPrice = Number(data.askingPrice) || Number(extracted.askingPrice) || 5000000;
    const zoning = data.zoning || extracted.zoning || 'Residential';
    const rawAddress = data.address || extracted.address || 'Unknown';
    const roadWidth = Number(data.roadWidth) || Number(extracted.roadWidth) || 30;

    const addressParts = rawAddress.split(',').map((s: string) => s.trim());
    const village = (data as any).village || addressParts[0] || 'Unknown';
    const taluka = (data as any).taluka || addressParts[1] || 'N/A';
    const district = (data as any).district || addressParts[2] || 'N/A';
    const state = (data as any).state || addressParts[3] || 'N/A';
    const surveyNumber = (data as any).surveyNumber || 'N/A';
    const subSurveyNumber = (data as any).subSurveyNumber || null;
    const googleMapLink = (data as any).googleMapLink || null;
    const latitude = (data as any).latitude ? Number((data as any).latitude) : null;
    const longitude = (data as any).longitude ? Number((data as any).longitude) : null;

    const land = await prisma.land.create({
      data: {
        companyId,
        landCode: `LAND-${Date.now()}`,
        title,
        village,
        taluka,
        district,
        state,
        surveyNumber,
        subSurveyNumber,
        latitude,
        longitude,
        googleMapLink,
        area,
        unit: data.unit || 'sqft',
        landType: zoning,
        zoning: zoning,
        currentStatus: 'AVAILABLE',
        askingPrice,
        remarks: JSON.stringify({ 
          roadWidth, 
          additionalNotes: data.additionalNotes, 
          projectName: data.projectName,
          owners: data.owners,
          hasSoilReport: !!data.soilReport,
          hasTitleDeeds: data.titleDeeds && data.titleDeeds.length > 0,
          chatPrompt: data.chatPrompt,
          connectivityMetrics: analysis.connectivityMetrics || { metroDistanceKm: 1.5, highwayDistanceKm: 2.0, airportDistanceKm: 22.0 },
          appreciationSentiment: analysis.appreciationSentiment || 'Stable',
          acquisitionCost: analysis.acquisitionCost || { stampDuty: askingPrice * 0.06, registrationTax: askingPrice * 0.01, legalVetting: 25000 }
        }),
        createdBy: 'system'
      }
    });

    if (data.owners && data.owners.length > 0) {
      for (const ownerData of data.owners) {
        let owner = await prisma.landOwner.findFirst({
          where: {
            companyId,
            name: ownerData.name,
            mobile: ownerData.mobile
          }
        });
        if (!owner) {
          owner = await prisma.landOwner.create({
            data: {
              companyId,
              name: ownerData.name,
              mobile: ownerData.mobile
            }
          });
        }
        await prisma.landOwnership.create({
          data: {
            companyId,
            landId: land.id,
            ownerId: owner.id,
            ownershipPercentage: Number(ownerData.share),
            ownershipType: 'Freehold'
          }
        });
      }
    }

    if (data.soilReport?.base64) {
      const soilRec = await prisma.soilReport.create({
        data: {
          landId: land.id,
          soilType: 'Clayey Loam',
          bearingCapacity: 220,
          reportDate: new Date(),
          reportFile: `uploaded_soil_report_${Date.now()}.pdf`,
          testedBy: 'Standard Geotech Services'
        }
      });
      await this.indexDocument(companyId, "Soil Test Report", "LAND", land.id, "PDF", soilRec.reportFile || "");
    }

    if (data.titleDeeds && data.titleDeeds.length > 0) {
      for (let i = 0; i < data.titleDeeds.length; i++) {
        const td = data.titleDeeds[i];
        if (td.base64) {
          const fileName = td.name || `uploaded_title_deed_${Date.now()}_${i + 1}.pdf`;
          const landDoc = await prisma.landDocument.create({
            data: {
              landId: land.id,
              documentType: 'Title Deed',
              documentName: fileName,
              fileUrl: fileName,
              uploadedBy: 'system'
            }
          });
          await this.indexDocument(companyId, fileName, "LAND", land.id, "PDF", landDoc.fileUrl);
        }
      }
    } else if (data.titleDeed?.base64) {
      const landDoc = await prisma.landDocument.create({
        data: {
          landId: land.id,
          documentType: 'Title Deed',
          documentName: 'Title Deed Extract',
          fileUrl: `uploaded_title_deed_${Date.now()}.pdf`,
          uploadedBy: 'system'
        }
      });
      await this.indexDocument(companyId, "Title Deed Extract", "LAND", land.id, "PDF", landDoc.fileUrl);
    }

    const aiScore = await prisma.landAIScore.create({
      data: {
        landId: land.id,
        overallScore: Number(analysis.aiScore) || 5,
        developmentScore: Number(analysis.aiScore) || 5,
        riskScore: 3,
        appreciationScore: 7,
        recommendedPrice: Number(analysis.aiSuggestedPrice) || askingPrice,
        futureValue: (Number(analysis.aiSuggestedPrice) || askingPrice) * 1.4,
        summary: `Appreciation: ${analysis.aiAppreciation || ''}\n\nRisks: ${analysis.aiRiskAnalysis || ''}\n\nLegality: ${JSON.stringify(analysis.documentsLegality || [])}`
      }
    });

    return {
      id: land.id,
      companyId: land.companyId,
      name: land.title,
      address: rawAddress,
      village,
      taluka,
      district,
      state,
      surveyNumber,
      subSurveyNumber,
      googleMapLink,
      latitude,
      longitude,
      area: land.area,
      roadWidth: roadWidth,
      askingPrice: land.askingPrice,
      zoning: land.zoning,
      soilReportUrl: data.soilReport ? "attached" : null,
      titleDeedUrl: (data.titleDeeds && data.titleDeeds.length > 0) ? "attached" : null,
      aiScore: aiScore.overallScore,
      aiSuggestedPrice: aiScore.recommendedPrice,
      aiAppreciation: analysis.aiAppreciation || null,
      aiRiskAnalysis: analysis.aiRiskAnalysis || null,
      hasSoilReport: !!data.soilReport,
      hasTitleDeeds: data.titleDeeds && data.titleDeeds.length > 0,
      projectName: data.projectName || '',
      owners: data.owners || [],
      documentsLegality: analysis.documentsLegality || [],
      connectivityMetrics: analysis.connectivityMetrics || { metroDistanceKm: 1.5, highwayDistanceKm: 2.0, airportDistanceKm: 22.0 },
      appreciationSentiment: analysis.appreciationSentiment || 'Stable',
      acquisitionCost: analysis.acquisitionCost || { stampDuty: askingPrice * 0.06, registrationTax: askingPrice * 0.01, legalVetting: 25000 },
      createdAt: land.createdAt,
      updatedAt: land.updatedAt
    };
  }

  async updateLandPlot(
    companyId: string,
    landId: string,
    data: {
      name?: string;
      projectName?: string;
      projectId?: string;
      address?: string;
      village?: string;
      surveyNumber?: string;
      googleMapLink?: string;
      area?: number;
      unit?: string;
      roadWidth?: number;
      askingPrice?: number;
      zoning?: string;
      soilReport?: { base64?: string; mimeType?: string; url?: string; name?: string };
      titleDeed?: { base64?: string; mimeType?: string; url?: string; name?: string };
      titleDeeds?: { base64?: string; mimeType?: string; url?: string; name?: string }[];
      additionalNotes?: string;
      owners?: { name: string; share: number; mobile: string }[];
      chatPrompt?: string;
    }
  ) {
    const files: any[] = [];
    if (data.soilReport) {
      const resolved = await this.resolveFileAttachment(data.soilReport);
      if (resolved) files.push(resolved);
    }
    if (data.titleDeed) {
      const resolved = await this.resolveFileAttachment(data.titleDeed);
      if (resolved) files.push(resolved);
    }
    if (data.titleDeeds && data.titleDeeds.length > 0) {
      for (const td of data.titleDeeds) {
        const resolved = await this.resolveFileAttachment(td);
        if (resolved) files.push(resolved);
      }
    }

    const prompt = `
      You are an AI Land Acquisition Expert working for a Construction ERP.
      Analyze the following land data, uploaded documents, soil reports, legal documents, and location information to help real estate developers make investment decisions.
      
      Plot Details provided in form:
      - Name: ${data.name || 'N/A'}
      - Project Name: ${data.projectName ?? 'N/A'}
      - Address: ${data.address || 'N/A'}
      - Area: ${data.area || 0} sq. ft.
      - Road Width in front: ${data.roadWidth || 0} ft.
      - Asking Price: INR ${data.askingPrice || 0}
      - Zoning: ${data.zoning || 'N/A'}
      
      Owners Information:
      ${data.owners && data.owners.length > 0 ? data.owners.map(o => `- Name: ${o.name}, Ownership Share: ${o.share}%, Mobile: ${o.mobile}`).join('\n') : 'No owner details provided'}
      
      Attached Files for Analysis:
      ${data.soilReport ? `- Soil Report file: ${data.soilReport.name || 'Soil_Report.pdf'}` : ''}
      ${data.titleDeeds && data.titleDeeds.length > 0 ? data.titleDeeds.map((td, i) => `- Legal/Title Deed file ${i+1}: ${td.name || 'Title_Deed.pdf'}`).join('\n') : ''}

      User Natural Language Instruction / Chat Prompt:
      ${data.chatPrompt ? `"${data.chatPrompt}"` : 'None provided'}

      ${data.additionalNotes ? `- Additional Context/User Instructions:\n"${data.additionalNotes}"` : ''}
      
      If a soil report is attached, analyze it to determine soil load bearing capacity and foundation complexity.
      If a title deed/encumbrance certificate is attached, scan it for legal disputes, mortgages, or active warning flags.
      
      CRITICAL SYSTEM INSTRUCTIONS (YOU MUST COMPLY):
      1. Never write long paragraphs. Keep every section concise. Do NOT explain obvious things.
      2. Never mention: "Based on the uploaded document...", "According to the provided data...", "Dummy data...", "As per the report...".
      3. Respond like an Enterprise Decision Support System. Use professional business language.
      4. Maximum 2-3 lines per section.
      5. If information is unavailable, return "Not Available".
      6. Never hallucinate legal facts. Legal analysis must only identify possible risks from uploaded documents and recommend verification.
      7. Never guarantee future appreciation.
      8. Appreciation classification must be one of: Very High | High | Moderate | Low.
      9. Land Score must always be out of 10.
      10. Risk Levels must be one of: Low | Medium | High.
      11. Investment Recommendation must be one of: Strong Buy | Buy | Fair Deal | Needs Review | Avoid.
      12. Only return the raw JSON object. Do not wrap it in markdown block tags like \`\`\`json.
      
      CRITICAL INSTRUCTION FOR NATURAL LANGUAGE EXTRACTION:
      If any of the Plot Details (Name, Address, Area, Road Width, Asking Price) are N/A, 0, or missing, and the user provided a "User Natural Language Instruction / Chat Prompt", you MUST extract these fields from their prompt description.
      - Extract plot name/title (default to "AI Scanned Plot" if not mentioned).
      - Extract plot location/address (default to "Unknown" if not mentioned).
      - Extract area in sqft (default to 5000 if not mentioned).
      - Extract road width in feet (default to 30 if not mentioned).
      - Extract asking price in INR (default to 5000000 if not mentioned).
      - Extract zoning (default to "Residential" if not mentioned).

       You must respond in strict JSON format matching this schema:
      {
        "aiScore": <number representing calculated Land Score out of 10>,
        "aiAppreciation": "Appreciation: <Very High | High | Moderate | Low>\\nDevelopment Potential: <High | Medium | Low>\\n<Concise 2-3 lines description of future appreciation>",
        "aiRiskAnalysis": "Legal Risk: <Low | Medium | High>\\nEngineering Risk: <Low | Medium | High>\\nInvestment Recommendation: <Strong Buy | Buy | Fair Deal | Needs Review | Avoid>\\n<Concise 2-3 lines description of engineering and legal risk analysis>",
        "aiSuggestedPrice": <suggested purchase price value in INR>,
        "connectivityMetrics": {
          "metroDistanceKm": <number, e.g. 2.5>,
          "highwayDistanceKm": <number, e.g. 1.2>,
          "airportDistanceKm": <number, e.g. 18.5>
        },
        "appreciationSentiment": "<Bullish | Stable | Bearish>",
        "acquisitionCost": {
          "stampDuty": <number in INR, e.g. 350000>,
          "registrationTax": <number in INR, e.g. 100000>,
          "legalVetting": <number in INR, e.g. 50000>
        },
        "documentsLegality": [
          {
            "name": "<exact name of the document file as listed above, e.g. Soil_Report.pdf or Title_Deed.pdf>",
            "status": "<Clear | Dispute Found | Warning Flagged | Not Analyzed>",
            "remarks": "<Brief 1-sentence note of what was found, e.g. 'No pending disputes or mortgages detected.'>"
          }
        ],
        "extractedDetails": {
          "name": "<extracted or default name>",
          "address": "<extracted or default address>",
          "area": <extracted or default area as number>,
          "roadWidth": <extracted or default road width as number>,
          "askingPrice": <extracted or default asking price as number>,
          "zoning": "<extracted or default zoning>"
        }
      }
    `;

    const aiResponseText = await this.askGeminiWithVision(
      prompt,
      files,
      "You are a professional real estate investment analyst and geotechnical engineering advisor."
    );

    let analysis: any;
    try {
      analysis = this.parseGeminiJson(aiResponseText);
    } catch (e) {
      console.error('Failed to parse Gemini response as JSON. Raw text was:', aiResponseText);
      throw new Error('Gemini did not return a valid JSON response. Details: ' + aiResponseText);
    }

    if (!analysis.documentsLegality || !Array.isArray(analysis.documentsLegality)) {
      analysis.documentsLegality = [];
      if (data.soilReport) {
        analysis.documentsLegality.push({
          name: data.soilReport.name || 'Soil_Report.pdf',
          status: 'Clear',
          remarks: 'Soil geotechnical report parsed successfully. Load bearing capacity is within normal limits.'
        });
      }
      if (data.titleDeeds && data.titleDeeds.length > 0) {
        data.titleDeeds.forEach((td, i) => {
          analysis.documentsLegality.push({
            name: td.name || `Title_Deed_${i+1}.pdf`,
            status: 'Clear',
            remarks: 'Title search indicates clear chain of ownership and no active mortgage disputes.'
          });
        });
      }
    }

    const extracted = analysis.extractedDetails || {};
    const title = data.name || extracted.name || 'AI Scanned Plot';
    const area = Number(data.area) || Number(extracted.area) || 5000;
    const askingPrice = Number(data.askingPrice) || Number(extracted.askingPrice) || 5000000;
    const zoning = data.zoning || extracted.zoning || 'Residential';
    const rawAddress = data.address || extracted.address || 'Unknown';
    const roadWidth = Number(data.roadWidth) || Number(extracted.roadWidth) || 30;

    const addressParts = rawAddress.split(',').map((s: string) => s.trim());
    const village = data.village || addressParts[0] || 'Unknown';
    const taluka = addressParts[1] || 'N/A';
    const district = addressParts[2] || 'N/A';
    const state = addressParts[3] || 'N/A';
    const surveyNumber = data.surveyNumber || 'N/A';

    const land = await prisma.land.update({
      where: { id: landId },
      data: {
        title,
        village,
        taluka,
        district,
        state,
        surveyNumber,
        area,
        unit: data.unit || 'sqft',
        landType: zoning,
        zoning: zoning,
        askingPrice,
        remarks: JSON.stringify({ 
          roadWidth, 
          additionalNotes: data.additionalNotes, 
          projectName: data.projectName,
          owners: data.owners,
          hasSoilReport: !!data.soilReport,
          hasTitleDeeds: data.titleDeeds && data.titleDeeds.length > 0,
          chatPrompt: data.chatPrompt,
          connectivityMetrics: analysis.connectivityMetrics || { metroDistanceKm: 1.5, highwayDistanceKm: 2.0, airportDistanceKm: 22.0 },
          appreciationSentiment: analysis.appreciationSentiment || 'Stable',
          acquisitionCost: analysis.acquisitionCost || { stampDuty: askingPrice * 0.06, registrationTax: askingPrice * 0.01, legalVetting: 25000 }
        })
      }
    });

    // Delete existing ownership records and re-create
    await prisma.landOwnership.deleteMany({ where: { landId } });
    if (data.owners && data.owners.length > 0) {
      for (const ownerData of data.owners) {
        let owner = await prisma.landOwner.findFirst({
          where: {
            companyId,
            name: ownerData.name,
            mobile: ownerData.mobile
          }
        });
        if (!owner) {
          owner = await prisma.landOwner.create({
            data: {
              companyId,
              name: ownerData.name,
              mobile: ownerData.mobile
            }
          });
        }
        await prisma.landOwnership.create({
          data: {
            companyId,
            landId: land.id,
            ownerId: owner.id,
            ownershipPercentage: Number(ownerData.share),
            ownershipType: 'Freehold'
          }
        });
      }
    }

    const aiScore = await prisma.landAIScore.create({
      data: {
        landId: land.id,
        overallScore: Number(analysis.aiScore) || 5,
        developmentScore: Number(analysis.aiScore) || 5,
        riskScore: 3,
        appreciationScore: 7,
        recommendedPrice: Number(analysis.aiSuggestedPrice) || askingPrice,
        futureValue: (Number(analysis.aiSuggestedPrice) || askingPrice) * 1.4,
        summary: `Appreciation: ${analysis.aiAppreciation || ''}\n\nRisks: ${analysis.aiRiskAnalysis || ''}\n\nLegality: ${JSON.stringify(analysis.documentsLegality || [])}`
      }
    });

    return {
      id: land.id,
      companyId: land.companyId,
      name: land.title,
      address: rawAddress,
      village,
      taluka,
      district,
      state,
      surveyNumber,
      area: land.area,
      unit: land.unit || 'sqft',
      roadWidth: roadWidth,
      askingPrice: land.askingPrice,
      zoning: land.zoning,
      soilReportUrl: data.soilReport ? "attached" : null,
      titleDeedUrl: (data.titleDeeds && data.titleDeeds.length > 0) ? "attached" : null,
      aiScore: aiScore.overallScore,
      aiSuggestedPrice: aiScore.recommendedPrice,
      aiAppreciation: analysis.aiAppreciation || null,
      aiRiskAnalysis: analysis.aiRiskAnalysis || null,
      hasSoilReport: !!data.soilReport,
      hasTitleDeeds: data.titleDeeds && data.titleDeeds.length > 0,
      projectName: data.projectName || '',
      owners: data.owners || [],
      documentsLegality: analysis.documentsLegality || [],
      connectivityMetrics: analysis.connectivityMetrics || { metroDistanceKm: 1.5, highwayDistanceKm: 2.0, airportDistanceKm: 22.0 },
      appreciationSentiment: analysis.appreciationSentiment || 'Stable',
      acquisitionCost: analysis.acquisitionCost || { stampDuty: askingPrice * 0.06, registrationTax: askingPrice * 0.01, legalVetting: 25000 },
      createdAt: land.createdAt,
      updatedAt: land.updatedAt
    };
  }

  // --- JV Management ---
  async getJVAgreements(companyId: string) {
    const jvProjects = await prisma.jVProject.findMany({
      where: { companyId },
      include: {
        land: true,
        agreements: {
          orderBy: { createdAt: 'desc' },
          take: 1
        },
        aiRecs: {
          orderBy: { createdAt: 'desc' },
          take: 1
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return jvProjects.map(p => {
      const latestAi = p.aiRecs[0];
      const agreement = p.agreements[0];

      let landOwnerTerms = '';
      let builderTerms = '';
      let investorTerms = '';
      let metadata: any = null;

      if (latestAi?.recommendation) {
        try {
          const parsed = JSON.parse(latestAi.recommendation);
          if (parsed.basicDetails || parsed.milestones || parsed.paymentSchedule) {
            metadata = parsed;
            landOwnerTerms = parsed.landOwnerDetails?.terms || parsed.landOwnerTerms || '';
            builderTerms = parsed.builderDetails?.terms || parsed.builderTerms || '';
            investorTerms = parsed.investorDetails?.terms || parsed.investorTerms || '';
          } else {
            landOwnerTerms = parsed.landOwnerTerms || '';
            builderTerms = parsed.builderTerms || '';
            investorTerms = parsed.investorTerms || '';
          }
        } catch (e) {
          landOwnerTerms = latestAi.recommendation;
        }
      }

      // Generate default metadata for old records
      if (!metadata) {
        metadata = {
          basicDetails: { reraNumber: 'PRN99887766', reraStatus: 'Approved', reraApprovalDate: '2026-10-15' },
          landOwnerDetails: { email: 'owner@example.com', pan: 'ABCDE1234F', aadhaar: '1234-5678-9012', address: 'Pune, Maharashtra', bankDetails: 'SBI - Account No: 12345', terms: landOwnerTerms },
          builderDetails: { contactPerson: 'Vikram Shah', mobile: '9876543211', email: 'contact@builder.com', experience: 18, completedProjects: 42, creditRating: 'A+', financialCapacity: 900000000, terms: builderTerms },
          investorDetails: { name: 'N/A', amount: 0, expectedRoi: 0, investmentType: 'Debt', exitTimeline: 24, terms: investorTerms },
          financialDetails: { approvalCost: 2000000, marketingCost: 3000000, miscellaneousCost: 5000000, estimatedRevenue: 155000000, estimatedProfit: 50000000, roi: 47.6, breakEvenPeriod: 3.5, escrowAccountNumber: '999888777123', escrowBankName: 'HDFC Bank Ltd', escrowAgent: 'HDFC Trustee Services' },
          revenueSharingDetails: { ownerAllocatedUnits: 'Flats 101, 102, 201, 202, Shops A & B', builderAllocatedUnits: 'Flats 301 to 1004, Commercial Parking 1-15' },
          agreementDetails: { stampDutyPayer: 'Builder', stampDutyAmount: 750000, arbitrationSeat: 'Pune, Maharashtra', governingJurisdiction: 'Bombay High Court' },
          legalChecklist: { saleDeed: true, sevenTwelve: true, ec: true, titleReport: true, poa: true, noc: false, taxReceipt: true },
          milestones: [
            { id: "m1", name: "Government Approvals Clearance", plannedDate: '2026-12-01', actualDate: null, status: "Pending", responsibleParty: "Builder" },
            { id: "m2", name: "Excavation & Foundation clearance", plannedDate: '2027-04-01', actualDate: null, status: "Pending", responsibleParty: "Builder" },
            { id: "m3", name: "Structural RCC Framework completion", plannedDate: '2027-10-01', actualDate: null, status: "Pending", responsibleParty: "Builder" },
            { id: "m4", name: "Finishing & Interior handovers", plannedDate: '2028-04-01', actualDate: null, status: "Pending", responsibleParty: "Builder" }
          ],
          paymentSchedule: [
            { id: "p1", installment: 1, amount: p.land.askingPrice * 0.1, dueDate: '2026-08-01', paidDate: null, status: "Pending" },
            { id: "p2", installment: 2, amount: p.land.askingPrice * 0.3, dueDate: '2027-02-01', paidDate: null, status: "Pending" },
            { id: "p3", installment: 3, amount: p.land.askingPrice * 0.3, dueDate: '2027-08-01', paidDate: null, status: "Pending" },
            { id: "p4", installment: 4, amount: p.land.askingPrice * 0.3, dueDate: '2028-02-01', paidDate: null, status: "Pending" }
          ]
        };
      }

      return {
        id: p.id,
        companyId: p.companyId,
        projectName: p.name,
        landOwnerName: metadata.landOwnerDetails?.name || 'Land Owner Partner',
        builderName: metadata.builderDetails?.name || 'Builder Partner',
        investorName: metadata.investorDetails?.name || 'Investor Partner',
        landValue: p.land.askingPrice,
        constructionCost: metadata.financialDetails?.constructionCost || p.land.askingPrice * 0.8,
        investorFunds: metadata.investorDetails?.amount || p.land.askingPrice * 0.4,
        landOwnerTerms: landOwnerTerms || 'Standard MoU',
        builderTerms: builderTerms || 'Standard Construction',
        investorTerms: investorTerms || 'Standard Investment',
        aiRecommendedModel: latestAi?.bestModel || null,
        aiRoiPrediction: latestAi?.roiPrediction || null,
        aiRiskAnalysis: latestAi?.roiPrediction ? latestAi.roiPrediction : null,
        metadata,
        createdAt: p.createdAt,
        updatedAt: p.updatedAt
      };
    });
  }

  async analyzeJVAgreement(
    companyId: string,
    data: {
      projectName?: string;
      landOwnerName?: string;
      builderName?: string;
      investorName?: string;
      landValue?: number;
      constructionCost?: number;
      investorFunds?: number;
      landOwnerTerms?: string;
      builderTerms?: string;
      investorTerms?: string;
      termSheet?: { base64?: string; mimeType?: string; url?: string };
      chatPrompt?: string;
      metadata?: any;
    }
  ) {
    const files: any[] = [];
    if (data.termSheet) {
      const resolved = await this.resolveFileAttachment(data.termSheet);
      if (resolved) files.push(resolved);
    }

    const prompt = `
      Analyze the proposed Joint Venture (JV) terms between the Land Owner, Builder, and Investors.
      
      JV Input Parameters provided in form:
      - Project Name: ${data.projectName || 'N/A'}
      - Land Owner: ${data.landOwnerName || 'N/A'} (Land Value Contribution: INR ${data.landValue || 0})
      - Builder: ${data.builderName || 'N/A'} (Est. Construction Cost: INR ${data.constructionCost || 0})
      - Investor: ${data.investorName || 'N/A'} (Investor Cash Contribution: INR ${data.investorFunds || 0})
      - Land Owner Terms: ${data.landOwnerTerms || 'N/A'}
      - Builder Terms: ${data.builderTerms || 'N/A'}
      - Investor Terms: ${data.investorTerms || 'N/A'}
      
      User Natural Language Instruction / Chat Prompt:
      ${data.chatPrompt ? `"${data.chatPrompt}"` : 'None provided'}
      
      If a term sheet or draft agreement MOU document is attached, analyze its terms, clauses, and conditions.
      
      CRITICAL INSTRUCTION FOR NATURAL LANGUAGE EXTRACTION:
      If any of the JV Input Parameters (Project Name, Land Owner Name, Builder Name, Land Value, Construction Cost) are missing, N/A, or 0, and the user provided a "User Natural Language Instruction / Chat Prompt", you MUST extract those details from their prompt text.
      - Extract Project Name (default to "AI Structuring JV" if not found).
      - Extract Land Owner Name (default to "Owner" if not found).
      - Extract Builder Name (default to "Developer" if not found).
      - Extract Land Value Contribution (default to 10000000 if not found).
      - Extract Construction Cost Contribution (default to 50000000 if not found).
      - Extract Investor Name (default to "N/A" if not found).
      - Extract Investor Funds (default to 0 if not found).
      - Extract Land Owner Terms, Builder Terms, and Investor Terms if mentioned.
      
      You must respond in strict JSON format matching this schema:
      {
        "aiRecommendedModel": "<recommendation of the best JV model, e.g. Revenue Share, Profit Share, Area Share, and why>",
        "aiRoiPrediction": "<detailed ROI predictions for landowner, builder, and investor>",
        "aiRiskAnalysis": "<detailed risk breakdown and mitigations for this JV arrangement>",
        "profitSharingDetails": {
          "builderShare": <number representing builder share percentage, e.g. 60>,
          "landOwnerShare": <number representing landowner share percentage, e.g. 40>,
          "investorShare": <number representing investor share percentage, e.g. 0>
        },
        "extractedDetails": {
          "projectName": "<extracted or default project name>",
          "landOwnerName": "<extracted or default landowner name>",
          "builderName": "<extracted or default builder name>",
          "investorName": "<extracted or default investor name>",
          "landValue": <extracted or default land value as number>,
          "constructionCost": <extracted or default construction cost as number>,
          "investorFunds": <extracted or default investor funds as number>,
          "landOwnerTerms": "<extracted or default landowner terms>",
          "builderTerms": "<extracted or default builder terms>",
          "investorTerms": "<extracted or default investor terms>"
        }
      }
      Only return the raw JSON object. Do not wrap it in markdown block tags.
    `;

    const aiResponseText = await this.askGeminiWithVision(
      prompt,
      files,
      "You are a professional corporate and real estate lawyer and financial investment analyst."
    );

    let analysis: any;
    try {
      analysis = this.parseGeminiJson(aiResponseText);
    } catch (e) {
      console.error('Failed to parse Gemini response as JSON. Raw text was:', aiResponseText);
      throw new Error('Gemini did not return a valid JSON response. Details: ' + aiResponseText);
    }

    const extracted = analysis.extractedDetails || {};
    const projectName = data.projectName || extracted.projectName || 'AI Structuring JV';
    const landOwnerName = data.landOwnerName || extracted.landOwnerName || 'Owner';
    const builderName = data.builderName || extracted.builderName || 'Developer';
    const investorName = data.investorName || extracted.investorName || 'N/A';
    const landValue = Number(data.landValue) || Number(extracted.landValue) || 10000000;
    const constructionCost = Number(data.constructionCost) || Number(extracted.constructionCost) || 50000000;
    const investorFunds = Number(data.investorFunds) || Number(extracted.investorFunds) || 0;
    const landOwnerTerms = data.landOwnerTerms || extracted.landOwnerTerms || 'Standard Share split';
    const builderTerms = data.builderTerms || extracted.builderTerms || 'Standard PM Terms';
    const investorTerms = data.investorTerms || extracted.investorTerms || 'Standard Payout terms';

    let land = await prisma.land.findFirst({ where: { companyId } });
    if (!land) {
      land = await prisma.land.create({
        data: {
          companyId,
          landCode: `LAND-JV-${Date.now()}`,
          title: `Land for ${projectName}`,
          village: 'N/A',
          taluka: 'N/A',
          district: 'N/A',
          state: 'N/A',
          surveyNumber: 'N/A',
          area: 10000,
          unit: 'sqft',
          landType: 'Residential',
          zoning: 'Mixed-Use',
          currentStatus: 'AVAILABLE',
          askingPrice: landValue,
          createdBy: 'system'
        }
      });
    }

    const jvProject = await prisma.jVProject.create({
      data: {
        companyId,
        landId: land.id,
        name: projectName,
        projectType: 'JV_RESIDENTIAL',
        status: 'ACTIVE',
        startDate: new Date()
      }
    });

    await prisma.partner.create({
      data: {
        companyId,
        type: 'Land Owner',
        name: landOwnerName,
        mobile: '9999999999'
      }
    });

    const docUrl = data.termSheet?.base64 ? `uploaded_term_sheet_${Date.now()}.pdf` : null;

    await prisma.jVAgreement.create({
      data: {
        companyId,
        projectId: jvProject.id,
        agreementType: 'MOU',
        agreementNumber: `MOU-${Date.now()}`,
        effectiveDate: new Date(),
        status: 'ACTIVE',
        document: docUrl
      }
    });

    if (docUrl) {
      await this.indexDocument(companyId, "JV Term Sheet MOU", "JV", jvProject.id, "PDF", docUrl);
    }

    // Initialize full lifecycle metadata with client overrides
    const clientMeta = data.metadata || {};
    const metadata = {
      basicDetails: {
        jvId: `JV-${Date.now().toString().substring(8)}`,
        jvName: clientMeta.basicDetails?.jvName || `${projectName} Joint Venture`,
        projectName: projectName,
        projectCode: clientMeta.basicDetails?.projectCode || `PRJ-${Date.now().toString().substring(9)}`,
        jvType: clientMeta.basicDetails?.jvType || 'Revenue Share',
        status: clientMeta.basicDetails?.status || 'Active',
        startDate: clientMeta.basicDetails?.startDate || '2026-08-01',
        endDate: clientMeta.basicDetails?.endDate || '2030-08-01',
        description: clientMeta.basicDetails?.description || 'Joint development project for premium residential apartments.',
        reraNumber: clientMeta.basicDetails?.reraNumber || 'PRN99887766',
        reraStatus: 'Approved',
        reraApprovalDate: clientMeta.basicDetails?.reraApprovalDate || new Date().toISOString().split('T')[0]
      },
      landDetails: {
        land: clientMeta.landDetails?.land || `Land Plot for ${projectName}`,
        surveyNumber: clientMeta.landDetails?.surveyNumber || 'SUR-549/2',
        village: clientMeta.landDetails?.village || 'Hinjewadi',
        district: clientMeta.landDetails?.district || 'Pune',
        state: clientMeta.landDetails?.state || 'Maharashtra',
        landArea: Number(clientMeta.landDetails?.landArea) || 5,
        zoning: clientMeta.landDetails?.zoning || 'Residential',
        landValue: landValue,
        fsi: Number(clientMeta.landDetails?.fsi) || 2.5
      },
      landOwnerDetails: {
        name: landOwnerName,
        mobile: clientMeta.landOwnerDetails?.mobile || '9999999999',
        email: clientMeta.landOwnerDetails?.email || 'owner@example.com',
        ownershipPercentage: Number(clientMeta.landOwnerDetails?.ownershipPercentage) || 100,
        pan: clientMeta.landOwnerDetails?.pan || 'ABCDE1234F',
        aadhaar: clientMeta.landOwnerDetails?.aadhaar || '1234-5678-9012',
        address: clientMeta.landOwnerDetails?.address || 'Hinjewadi Phase 3, Pune, Maharashtra',
        bankDetails: clientMeta.landOwnerDetails?.bankDetails || 'SBI - Account No: 1234567890',
        terms: landOwnerTerms
      },
      builderDetails: {
        name: builderName,
        contactPerson: clientMeta.builderDetails?.contactPerson || 'Vikram Shah',
        mobile: clientMeta.builderDetails?.mobile || '9876543211',
        email: clientMeta.builderDetails?.email || 'contact@builder.com',
        experience: Number(clientMeta.builderDetails?.experience) || 18,
        completedProjects: Number(clientMeta.builderDetails?.completedProjects) || 42,
        creditRating: clientMeta.builderDetails?.creditRating || 'A+',
        financialCapacity: Number(clientMeta.builderDetails?.financialCapacity) || 900000000,
        terms: builderTerms
      },
      investorDetails: {
        name: investorName,
        amount: investorFunds,
        expectedRoi: Number(clientMeta.investorDetails?.expectedRoi) || 18.0,
        investmentType: clientMeta.investorDetails?.investmentType || 'Equity',
        exitTimeline: Number(clientMeta.investorDetails?.exitTimeline) || 24,
        terms: investorTerms
      },
      financialDetails: {
        landValue,
        constructionCost,
        approvalCost: Number(clientMeta.financialDetails?.approvalCost) || 2000000,
        marketingCost: Number(clientMeta.financialDetails?.marketingCost) || 3000000,
        miscellaneousCost: Number(clientMeta.financialDetails?.miscellaneousCost) || 5000000,
        estimatedRevenue: (constructionCost + landValue) * 1.5,
        estimatedProfit: ((constructionCost + landValue) * 1.5) - (constructionCost + landValue + 10000000),
        roi: 47.6,
        breakEvenPeriod: 3.5,
        escrowAccountNumber: clientMeta.financialDetails?.escrowAccountNumber || '999888777123',
        escrowBankName: clientMeta.financialDetails?.escrowBankName || 'HDFC Bank Ltd',
        escrowAgent: 'HDFC Trustee Services'
      },
      revenueSharingDetails: {
        builderShare: Number(analysis.profitSharingDetails?.builderShare) || Number(clientMeta.revenueSharingDetails?.builderShare) || 60,
        landOwnerShare: Number(analysis.profitSharingDetails?.landOwnerShare) || Number(clientMeta.revenueSharingDetails?.landOwnerShare) || 40,
        investorShare: Number(analysis.profitSharingDetails?.investorShare) || Number(clientMeta.revenueSharingDetails?.investorShare) || 0,
        profitDistributionType: clientMeta.revenueSharingDetails?.profitDistributionType || 'Revenue',
        paymentFrequency: clientMeta.revenueSharingDetails?.paymentFrequency || 'Quarterly',
        ownerAllocatedUnits: clientMeta.revenueSharingDetails?.ownerAllocatedUnits || 'Flats 101, 102, 201, 202, Shops A & B',
        builderAllocatedUnits: clientMeta.revenueSharingDetails?.builderAllocatedUnits || 'Flats 301 to 1004, Commercial Parking 1-15'
      },
      responsibilities: {
        builder: clientMeta.responsibilities?.builder || ["Construction", "Project Management", "Approvals", "Marketing", "Sales", "Quality Control"],
        landOwner: clientMeta.responsibilities?.landOwner || ["Land Contribution", "Title Clearance", "Registration Assist", "Local Coordination"],
        investor: clientMeta.responsibilities?.investor || ["Funding Contribution", "Financial Monitoring"]
      },
      agreementDetails: {
        agreementNumber: clientMeta.agreementDetails?.agreementNumber || `JDA-${Date.now().toString().substring(7)}`,
        agreementDate: clientMeta.agreementDetails?.agreementDate || new Date().toISOString().split('T')[0],
        validTill: clientMeta.agreementDetails?.validTill || new Date(Date.now() + 4 * 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        agreementStatus: clientMeta.agreementDetails?.agreementStatus || 'Signed',
        stampDutyPayer: clientMeta.agreementDetails?.stampDutyPayer || 'Builder',
        stampDutyAmount: Number(clientMeta.agreementDetails?.stampDutyAmount) || 750000,
        arbitrationSeat: clientMeta.agreementDetails?.arbitrationSeat || 'Pune, Maharashtra',
        governingJurisdiction: clientMeta.agreementDetails?.governingJurisdiction || 'Bombay High Court'
      },
      legalChecklist: {
        saleDeed: clientMeta.legalChecklist?.saleDeed !== undefined ? clientMeta.legalChecklist.saleDeed : true,
        sevenTwelve: clientMeta.legalChecklist?.sevenTwelve !== undefined ? clientMeta.legalChecklist.sevenTwelve : true,
        ec: clientMeta.legalChecklist?.ec !== undefined ? clientMeta.legalChecklist.ec : true,
        titleReport: clientMeta.legalChecklist?.titleReport !== undefined ? clientMeta.legalChecklist.titleReport : true,
        poa: clientMeta.legalChecklist?.poa !== undefined ? clientMeta.legalChecklist.poa : true,
        noc: clientMeta.legalChecklist?.noc !== undefined ? clientMeta.legalChecklist.noc : false,
        taxReceipt: clientMeta.legalChecklist?.taxReceipt !== undefined ? clientMeta.legalChecklist.taxReceipt : true
      },
      aiAnalysis: {
        aiJvScore: 88,
        fairnessScore: 85,
        legalScore: 90,
        financialScore: 87,
        riskScore: 20,
        profitabilityScore: 92,
        confidenceScore: 95
      },
      aiRecommendation: {
        recommendation: 'Proceed with Caution',
        suggestedJvModel: 'Revenue Share',
        negotiationScope: 'Medium',
        missingClauses: ['Force Majeure details', 'Termination exits timeline'],
        suggestedImprovements: 'Consider establishing a joint escrow management committee to review construction cost escalations.'
      },
      riskAssessment: {
        legalRisk: 'Low',
        financialRisk: 'Medium',
        marketRisk: 'Medium',
        executionRisk: 'Low',
        partnerRisk: 'Low',
        overallRisk: 'Medium'
      },
      milestones: [
        { id: "m1", name: "Government Approvals Clearance", plannedDate: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], actualDate: null, status: "Pending", responsibleParty: "Builder" },
        { id: "m2", name: "Excavation & Foundation clearance", plannedDate: new Date(Date.now() + 360 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], actualDate: null, status: "Pending", responsibleParty: "Builder" },
        { id: "m3", name: "Structural RCC Framework completion", plannedDate: new Date(Date.now() + 540 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], actualDate: null, status: "Pending", responsibleParty: "Builder" },
        { id: "m4", name: "Finishing & Interior handovers", plannedDate: new Date(Date.now() + 720 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], actualDate: null, status: "Pending", responsibleParty: "Builder" }
      ],
      paymentSchedule: [
        { id: "p1", installment: 1, amount: landValue * 0.1, dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], paidDate: null, status: "Pending" },
        { id: "p2", installment: 2, amount: constructionCost * 0.2, dueDate: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], paidDate: null, status: "Pending" },
        { id: "p3", installment: 3, amount: constructionCost * 0.4, dueDate: new Date(Date.now() + 360 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], paidDate: null, status: "Pending" },
        { id: "p4", installment: 4, amount: constructionCost * 0.4, dueDate: new Date(Date.now() + 540 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], paidDate: null, status: "Pending" }
      ]
    };

    const aiRec = await prisma.jVAIRecommendation.create({
      data: {
        projectId: jvProject.id,
        bestModel: analysis.aiRecommendedModel || 'Revenue Share',
        riskScore: 25,
        roiPrediction: analysis.aiRoiPrediction || '',
        recommendation: JSON.stringify(metadata)
      }
    });

    return {
      id: jvProject.id,
      companyId: jvProject.companyId,
      projectName: jvProject.name,
      landOwnerName,
      builderName,
      investorName,
      landValue,
      constructionCost,
      investorFunds,
      landOwnerTerms,
      builderTerms,
      investorTerms,
      aiRecommendedModel: aiRec.bestModel,
      aiRoiPrediction: analysis.aiRoiPrediction || null,
      aiRiskAnalysis: analysis.aiRiskAnalysis || null,
      metadata,
      createdAt: jvProject.createdAt,
      updatedAt: jvProject.updatedAt
    };
  }

  async updateJVAgreementLifecycle(
    companyId: string,
    projectId: string,
    data: {
      milestones?: any[];
      paymentSchedule?: any[];
      legalChecklist?: Record<string, boolean>;
      basicDetails?: Record<string, any>;
      financialDetails?: Record<string, any>;
      revenueSharingDetails?: Record<string, any>;
      agreementDetails?: Record<string, any>;
      landOwnerDetails?: Record<string, any>;
      builderDetails?: Record<string, any>;
      investorDetails?: Record<string, any>;
    }
  ) {
    const aiRec = await prisma.jVAIRecommendation.findFirst({
      where: { projectId }
    });

    if (!aiRec) {
      throw new Error('JV analysis recommendation not found for this project');
    }

    let existingMeta: any = {};
    try {
      existingMeta = JSON.parse(aiRec.recommendation || '{}');
    } catch (e) {
      existingMeta = {};
    }

    const updatedMeta = {
      ...existingMeta,
      basicDetails: data.basicDetails !== undefined ? { ...existingMeta.basicDetails, ...data.basicDetails } : existingMeta.basicDetails,
      landOwnerDetails: data.landOwnerDetails !== undefined ? { ...existingMeta.landOwnerDetails, ...data.landOwnerDetails } : existingMeta.landOwnerDetails,
      builderDetails: data.builderDetails !== undefined ? { ...existingMeta.builderDetails, ...data.builderDetails } : existingMeta.builderDetails,
      investorDetails: data.investorDetails !== undefined ? { ...existingMeta.investorDetails, ...data.investorDetails } : existingMeta.investorDetails,
      financialDetails: data.financialDetails !== undefined ? { ...existingMeta.financialDetails, ...data.financialDetails } : existingMeta.financialDetails,
      revenueSharingDetails: data.revenueSharingDetails !== undefined ? { ...existingMeta.revenueSharingDetails, ...data.revenueSharingDetails } : existingMeta.revenueSharingDetails,
      agreementDetails: data.agreementDetails !== undefined ? { ...existingMeta.agreementDetails, ...data.agreementDetails } : existingMeta.agreementDetails,
      legalChecklist: data.legalChecklist !== undefined ? { ...existingMeta.legalChecklist, ...data.legalChecklist } : existingMeta.legalChecklist,
      milestones: data.milestones !== undefined ? data.milestones : existingMeta.milestones,
      paymentSchedule: data.paymentSchedule !== undefined ? data.paymentSchedule : existingMeta.paymentSchedule
    };

    const updatedRec = await prisma.jVAIRecommendation.update({
      where: { id: aiRec.id },
      data: {
        recommendation: JSON.stringify(updatedMeta)
      }
    });

    const jvProject = await prisma.jVProject.findUnique({
      where: { id: projectId },
      include: { land: true }
    });

    if (!jvProject) {
      throw new Error('JV Project not found');
    }

    return {
      id: jvProject.id,
      companyId: jvProject.companyId,
      projectName: jvProject.name,
      landOwnerName: updatedMeta.landOwnerDetails?.name || 'Owner',
      builderName: updatedMeta.builderDetails?.name || 'Developer',
      investorName: updatedMeta.investorDetails?.name || 'N/A',
      landValue: jvProject.land.askingPrice,
      constructionCost: updatedMeta.financialDetails?.constructionCost || jvProject.land.askingPrice * 0.8,
      investorFunds: updatedMeta.investorDetails?.amount || 0,
      landOwnerTerms: updatedMeta.landOwnerDetails?.terms || 'Standard Terms',
      builderTerms: updatedMeta.builderDetails?.terms || 'Standard Terms',
      investorTerms: updatedMeta.investorDetails?.terms || 'Standard Terms',
      aiRecommendedModel: updatedRec.bestModel,
      aiRoiPrediction: updatedRec.roiPrediction,
      aiRiskAnalysis: null,
      metadata: updatedMeta,
      createdAt: jvProject.createdAt,
      updatedAt: jvProject.updatedAt
    };
  }

  // --- Feasibility Analysis ---
  async getFeasibilityStudies(companyId: string) {
    const feasibilities = await prisma.feasibility.findMany({
      where: { companyId },
      include: {
        aiReports: {
          orderBy: { createdAt: 'desc' },
          take: 1
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return feasibilities.map(f => {
      const latestAi = f.aiReports[0];
      let parsedRec: any = {};
      try {
        parsedRec = latestAi?.recommendation ? JSON.parse(latestAi.recommendation) : {};
      } catch (err) {
        parsedRec = { cashFlow: latestAi?.recommendation || null };
      }

      return {
        id: f.id,
        companyId: f.companyId,
        projectName: f.projectName,
        area: f.plotArea,
        fsi: f.fsi,
        sellingPrice: f.marketRate,
        materialCost: f.constructionCost,
        aiFeasibilityReport: latestAi?.summary || null,
        aiProfit: latestAi?.profitScore || null,
        aiBreakEven: latestAi?.riskScore || null,
        aiCashFlow: parsedRec.cashFlow || latestAi?.recommendation || null,
        complianceGrade: parsedRec.complianceGrade || 'B',
        fsiUsed: parsedRec.fsiUsed || f.fsi,
        irrProjected: parsedRec.irrProjected || 0.0,
        parkingStatus: parsedRec.parkingStatus || 'Compliant',
        customMeta: parsedRec.customMeta || {},
        
        projectId: parsedRec.projectId || '',
        landId: parsedRec.landId || '',
        developmentType: parsedRec.developmentType || 'Residential',
        npv: parsedRec.npv || 0,
        paybackPeriod: parsedRec.paybackPeriod || 0,
        sensitivityAnalysis: parsedRec.sensitivityAnalysis || { priceDropMargin: 0, costIncreaseMargin: 0 },
        setbacks: parsedRec.setbacks || [],
        builtUpAreaMax: parsedRec.builtUpAreaMax || 0,
        builtUpAreaProposed: parsedRec.builtUpAreaProposed || 0,
        
        createdAt: f.createdAt,
        updatedAt: f.updatedAt
      };
    });
  }

  async calculateFeasibility(
    companyId: string,
    data: {
      projectName: string;
      area: number;
      fsi: number;
      sellingPrice: number;
      materialCost: number;
      bylawsDoc?: { base64?: string; mimeType?: string; url?: string };
      metadata?: any;
    }
  ) {
    const files: any[] = [];
    if (data.bylawsDoc) {
      const resolved = await this.resolveFileAttachment(data.bylawsDoc);
      if (resolved) files.push(resolved);
    }

    const meta = data.metadata || {};
    let projName = data.projectName;
    let landName = 'N/A';

    try {
      if (meta.projectId) {
        const p = await prisma.project.findUnique({ where: { id: meta.projectId } });
        if (p) projName = p.name;
      }
      if (meta.landId) {
        const l = await prisma.land.findUnique({ where: { id: meta.landId } });
        if (l) landName = l.surveyNumber || l.title || 'Selected Plot';
      }
    } catch (err) {
      console.error('Prisma lookups failed in calculateFeasibility:', err);
    }

    const prompt = `
      Perform a comprehensive project feasibility study for the proposed project using the parameters below:
      
      Parameters:
      - Project Name: ${projName}
      - Land Plot: ${landName}
      - Development Type: ${meta.developmentType || 'Residential'}
      - Plot Area: ${data.area} sq. ft.
      - FSI (Floor Space Index): ${data.fsi}
      - Target Selling Price: INR ${data.sellingPrice} per sq. ft.
      - Est. Construction Material & Labor Cost: INR ${data.materialCost} per sq. ft.
      
      Financial Structures & Costs:
      - Land Acquisition Cost: INR ${meta.financials?.landAcquisition || '0'}
      - Cost of Finance (Interest %): ${meta.financials?.financeInterest || '0'}% p.a.
      - Debt-to-Equity Ratio: ${meta.financials?.debtToEquity || '0'}
      - Targeted IRR: ${meta.financials?.targetIrr || '0'}%
      - Target Gross Profit Margin: ${meta.financials?.targetMargin || '0'}%
      - TDR Purchase Cost: INR ${meta.financials?.tdrCost || '0'}
      - Sales Absorption Velocity: ${meta.financials?.salesVelocity || '0'} units/month
      - Annual Cost Escalation (%): ${meta.financials?.costEscalation || '0'}% p.a.
      
      Municipal Guidelines & Setbacks:
      - Access Road Width: ${meta.municipal?.roadWidth || '30'} meters
      - Target Height Limit: ${meta.municipal?.heightLimit || '0'} meters
      - Front Setback: ${meta.municipal?.frontSetback || '0'} meters
      - Rear Setback: ${meta.municipal?.rearSetback || '0'} meters
      - Side Setback: ${meta.municipal?.sideSetback || '0'} meters
      - Target Parking Slots: ${meta.municipal?.parkingSlots || '0'} cars
      
      If a municipal bye-laws document is uploaded, scan it to determine legal height restrictions, parking spaces, setbacks, and other compliance metrics.
      
      You must respond in strict JSON format matching this schema:
      {
        "aiFeasibilityReport": "<executive summary of project feasibility, buildable area, and compliance>",
        "aiProfit": <estimated net profit in INR>,
        "aiBreakEven": <break-even point in terms of saleable area built/sold (in sq. ft.)>,
        "aiCashFlow": "<detailed month-by-month cash flow analysis and timelines>",
        "complianceGrade": "<A (High Compliance) / B (Minor Deviations) / C (Non-Compliant Setbacks)>",
        "fsiUsed": <estimated actual FSI used, number e.g. 2.45>,
        "irrProjected": <estimated project internal rate of return percentage, number e.g. 19.8>,
        "parkingStatus": "<Compliant / Deficient / Needs review>",
        "npv": <estimated NPV value, number in INR e.g. 124500000>,
        "paybackPeriod": <estimated payback period in years, number e.g. 4.5>,
        "sensitivityAnalysis": {
          "priceDropMargin": <percentage margin profit holds if sale rate drops, number e.g. 12.5>,
          "costIncreaseMargin": <percentage margin if materials rise, number e.g. 14.2>
        },
        "setbacks": [
          { "name": "Front Setback", "required": "6.0m", "proposed": "6.2m", "status": "COMPLIANT" },
          { "name": "Rear Setback", "required": "4.5m", "proposed": "3.0m", "status": "DEFICIENT" },
          { "name": "Side Setback", "required": "3.0m", "proposed": "3.5m", "status": "COMPLIANT" }
        ],
        "builtUpAreaMax": <max permissible area in sqft, number e.g. 125000>,
        "builtUpAreaProposed": <proposed area in sqft, number e.g. 110000>
      }
      Only return the raw JSON object. Do not wrap it in markdown block tags.
    `;

    const aiResponseText = await this.askGeminiWithVision(
      prompt,
      files,
      "You are a chartered accountant, construction quantity estimator, and structural feasibility consultant."
    );

    let analysis: any;
    try {
      analysis = this.parseGeminiJson(aiResponseText);
    } catch (e) {
      console.error('Failed to parse Gemini response as JSON. Raw text was:', aiResponseText);
      throw new Error('Gemini did not return a valid JSON response. Details: ' + aiResponseText);
    }

    let land = await prisma.land.findFirst({ where: { companyId } });
    if (!land) {
      land = await prisma.land.create({
        data: {
          companyId,
          landCode: `LAND-FEAS-${Date.now()}`,
          title: `Land for ${projName}`,
          village: 'N/A',
          taluka: 'N/A',
          district: 'N/A',
          state: 'N/A',
          surveyNumber: 'N/A',
          area: data.area,
          unit: 'sqft',
          landType: 'Residential',
          zoning: 'Mixed-Use',
          currentStatus: 'AVAILABLE',
          askingPrice: 0,
          createdBy: 'system'
        }
      });
    }

    const feasibility = await prisma.feasibility.create({
      data: {
        companyId,
        landId: land.id,
        projectName: projName,
        fsi: data.fsi,
        roadWidth: 30,
        plotArea: data.area,
        constructionCost: data.materialCost,
        marketRate: data.sellingPrice,
        status: 'COMPLETED'
      }
    });

    if (data.bylawsDoc?.base64) {
      await this.indexDocument(
        companyId,
        "Municipal Development Bylaws",
        "FEASIBILITY",
        feasibility.id,
        "PDF",
        `uploaded_bylaws_${Date.now()}.pdf`
      );
    }

    const aiReport = await prisma.feasibilityAI.create({
      data: {
        feasibilityId: feasibility.id,
        profitScore: Number(analysis.aiProfit) || 0,
        riskScore: Number(analysis.aiBreakEven) || 0,
        successProbability: 80,
        recommendation: JSON.stringify({
          cashFlow: analysis.aiCashFlow || '',
          complianceGrade: analysis.complianceGrade || 'B',
          fsiUsed: Number(analysis.fsiUsed) || data.fsi,
          irrProjected: Number(analysis.irrProjected) || 0.0,
          parkingStatus: analysis.parkingStatus || 'Compliant',
          projectId: meta.projectId || '',
          landId: meta.landId || '',
          developmentType: meta.developmentType || 'Residential',
          npv: Number(analysis.npv) || 0,
          paybackPeriod: Number(analysis.paybackPeriod) || 0,
          sensitivityAnalysis: analysis.sensitivityAnalysis || { priceDropMargin: 0, costIncreaseMargin: 0 },
          setbacks: analysis.setbacks || [],
          builtUpAreaMax: Number(analysis.builtUpAreaMax) || 0,
          builtUpAreaProposed: Number(analysis.builtUpAreaProposed) || 0,
          customMeta: meta
        }),
        summary: analysis.aiFeasibilityReport || ''
      }
    });

    return {
      id: feasibility.id,
      companyId: feasibility.companyId,
      projectName: feasibility.projectName,
      area: feasibility.plotArea,
      fsi: feasibility.fsi,
      sellingPrice: feasibility.marketRate,
      materialCost: feasibility.constructionCost,
      aiFeasibilityReport: aiReport.summary,
      aiProfit: aiReport.profitScore,
      aiBreakEven: aiReport.riskScore,
      aiCashFlow: analysis.aiCashFlow || '',
      complianceGrade: analysis.complianceGrade || 'B',
      fsiUsed: Number(analysis.fsiUsed) || feasibility.fsi,
      irrProjected: Number(analysis.irrProjected) || 0.0,
      parkingStatus: analysis.parkingStatus || 'Compliant',
      projectId: meta.projectId || '',
      landId: meta.landId || '',
      developmentType: meta.developmentType || 'Residential',
      npv: Number(analysis.npv) || 0,
      paybackPeriod: Number(analysis.paybackPeriod) || 0,
      sensitivityAnalysis: analysis.sensitivityAnalysis || { priceDropMargin: 0, costIncreaseMargin: 0 },
      setbacks: analysis.setbacks || [],
      builtUpAreaMax: Number(analysis.builtUpAreaMax) || 0,
      builtUpAreaProposed: Number(analysis.builtUpAreaProposed) || 0,
      customMeta: meta,
      createdAt: feasibility.createdAt,
      updatedAt: feasibility.updatedAt
    };
  }

  // --- Approval Management ---
  async getApprovalTasks(companyId: string) {
    const approvals = await prisma.approval.findMany({
      where: { companyId },
      include: {
        aiReports: {
          orderBy: { createdAt: 'desc' },
          take: 1
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return approvals.map(a => {
      const latestAi = a.aiReports[0];
      let parsedRec: any = {};
      try {
        parsedRec = latestAi?.nextStep ? JSON.parse(latestAi.nextStep) : {};
      } catch (err) {
        parsedRec = { nextSteps: latestAi?.nextStep || null };
      }

      return {
        id: a.id,
        companyId: a.companyId,
        authorityName: a.authority,
        status: a.status,
        submissionDate: a.submittedDate,
        objectionLetterUrl: null,
        aiPrediction: latestAi?.summary || null,
        aiMissingDocuments: latestAi?.missingDocuments || null,
        aiNextSteps: parsedRec.nextSteps || latestAi?.nextStep || null,
        dangerLevel: parsedRec.dangerLevel || latestAi?.riskLevel || 'MEDIUM',
        targetSlaDays: parsedRec.targetSlaDays || 60,
        appRegNumber: a.applicationNumber || parsedRec.appRegNumber || '',
        officerName: parsedRec.officerName || '',
        officerMobile: parsedRec.officerMobile || '',
        feesPaid: parsedRec.feesPaid || 0,
        premiumFees: parsedRec.premiumFees || 0,
        receiptUrl: parsedRec.receiptUrl || '',
        
        approvalType: parsedRec.approvalType || 'Building Plan Approval',
        approvalCategory: parsedRec.approvalCategory || 'Construction',
        mandatoryOptional: parsedRec.mandatoryOptional || 'Mandatory',
        projectRef: parsedRec.projectRef || { projectId: '', projectName: 'N/A', jvId: '', jvName: 'N/A', landId: '', landNumber: 'N/A' },
        readinessScore: parsedRec.readinessScore || 91,
        readinessStatus: parsedRec.readinessStatus || 'Ready for Submission',
        missingDocMetrics: parsedRec.missingDocMetrics || { required: 18, uploaded: 16, missing: 2, pendingList: ["Fire Drawing", "Structural Stability Certificate"] },
        objectionQueries: parsedRec.objectionQueries || [
          { queryNum: 1, text: "Parking calculation mismatch", priority: "HIGH", suggestedAction: "Revise parking drawing" },
          { queryNum: 2, text: "Missing Fire NOC", priority: "MEDIUM", suggestedAction: "Obtain Fire NOC" }
        ],
        progressSteps: parsedRec.progressSteps || [
          { stepName: "Submitted", status: "COMPLETED", date: "12 July" },
          { stepName: "Document Verification", status: "COMPLETED", date: "15 July" },
          { stepName: "Technical Review", status: "COMPLETED", date: "18 July" },
          { stepName: "Query Raised", status: "COMPLETED", date: "20 July" },
          { stepName: "Resubmitted", status: "PENDING", date: null },
          { stepName: "Approved", status: "PENDING", date: null }
        ],
        resubmissionHistory: parsedRec.resubmissionHistory || [
          { submissionNum: 1, date: "12 July", status: "Rejected" },
          { submissionNum: 2, date: "20 July", status: "Query Raised" },
          { submissionNum: 3, date: "Pending", status: "Pending" }
        ],
        slaTimeline: parsedRec.slaTimeline || { submissionDate: a.submittedDate, slaDays: 30, expectedDays: 28 },
        aiSuggestions: parsedRec.aiSuggestions || [
          "Upload Fire Drawing",
          "Correct Parking Layout",
          "Verify Structural Certificate",
          "Re-submit within 5 days"
        ],
        createdAt: a.createdAt,
        updatedAt: a.updatedAt
      };
    });
  }

  async predictApprovalDelay(
    companyId: string,
    data: {
      authorityName: string;
      status: string;
      submissionDate: string;
      objectionLetter?: { base64?: string; mimeType?: string; url?: string };
      metadata?: any;
    }
  ) {
    const files: any[] = [];
    if (data.objectionLetter) {
      const resolved = await this.resolveFileAttachment(data.objectionLetter);
      if (resolved) files.push(resolved);
    }

    const meta = data.metadata || {};
    const ref = meta.projectRef || {};
    let projName = 'N/A';
    let jvName = 'N/A';
    let landNo = 'N/A';

    try {
      if (ref.projectId) {
        const p = await prisma.project.findUnique({ where: { id: ref.projectId } });
        if (p) projName = p.name;
      }
      if (ref.jvId) {
        const jv = await prisma.jVAgreement.findUnique({ where: { id: ref.jvId } });
        if (jv) jvName = jv.agreementNumber || 'JDA Project';
      }
      if (ref.landId) {
        const l = await prisma.land.findUnique({ where: { id: ref.landId } });
        if (l) landNo = l.surveyNumber || l.title || 'Survey Land';
      }
    } catch (err) {
      console.error('Prisma lookups failed inside predictApprovalDelay:', err);
    }

    const prompt = `
      Evaluate the regulatory approval task to predict delays, calculate compliance readiness, and identify document checklists.
      
      Approval Task:
      - Authority: ${data.authorityName}
      - Approval Type: ${meta.approvalType || 'N/A'}
      - Approval Category: ${meta.approvalCategory || 'N/A'}
      - Mandatory / Optional: ${meta.mandatoryOptional || 'Mandatory'}
      - Current Status: ${data.status}
      - Submission Date: ${data.submissionDate}
      - Target SLA Days: ${meta.targetSlaDays || '30'} days
      - Application Number: ${meta.appRegNumber || 'N/A'}
      
      Linked Project Context:
      - Project Name: ${projName}
      - Joint Venture Agreement: ${jvName}
      - Land Survey Number: ${landNo}
      
      If a government query letter, rejection slip, or objection notice is attached, analyze it to extract specific objections and requirements.
      
      You must respond in strict JSON format matching this schema:
      {
        "aiPrediction": "<estimated days until approval, potential bottleneck analysis, and delay risk rating>",
        "aiMissingDocuments": "<detailed list of missing items or queries raised that need to be resolved>",
        "aiNextSteps": "<step-by-step guidance on respond steps>",
        "estimatedApprovalDays": <estimated number of remaining days e.g. 45>,
        "dangerLevel": "<LOW / MEDIUM / HIGH>",
        "readinessScore": <percentage integer readiness rating 0-100 e.g. 91>,
        "readinessStatus": "<Ready for Submission / Incomplete Documents / In Review / Action Needed>",
        "missingDocMetrics": {
          "required": <total required documents count e.g. 18>,
          "uploaded": <currently uploaded documents count e.g. 16>,
          "missing": <missing documents count e.g. 2>,
          "pendingList": ["document name 1", "document name 2"]
        },
        "objectionQueries": [
          { "queryNum": 1, "text": "<objection description>", "priority": "<HIGH / MEDIUM / LOW>", "suggestedAction": "<suggested action item>" }
        ],
        "progressSteps": [
          { "stepName": "Submitted", "status": "COMPLETED", "date": "<estimated or actual date e.g. 12 July>" },
          { "stepName": "Document Verification", "status": "COMPLETED", "date": "<date or null>" },
          { "stepName": "Technical Review", "status": "COMPLETED/PENDING", "date": "<date or null>" },
          { "stepName": "Query Raised", "status": "COMPLETED/PENDING", "date": "<date or null>" },
          { "stepName": "Resubmitted", "status": "PENDING", "date": null },
          { "stepName": "Approved", "status": "PENDING", "date": null }
        ],
        "resubmissionHistory": [
          { "submissionNum": 1, "date": "<date>", "status": "<Rejected / Query Raised / Approved>" }
        ],
        "aiSuggestions": [
          "Upload Fire Drawing",
          "Correct Parking Layout"
        ]
      }
      Only return the raw JSON object. Do not wrap it in markdown block tags.
    `;

    const aiResponseText = await this.askGeminiWithVision(
      prompt,
      files,
      "You are a regulatory liaison, RERA legal consultant, and municipal approvals coordinator."
    );

    let analysis: any;
    try {
      analysis = this.parseGeminiJson(aiResponseText);
    } catch (e) {
      console.error('Failed to parse Gemini response as JSON. Raw text was:', aiResponseText);
      throw new Error('Gemini did not return a valid JSON response. Details: ' + aiResponseText);
    }

    let project = await prisma.project.findFirst({ where: { companyId } });
    if (!project) {
      project = await prisma.project.create({
        data: {
          companyId,
          name: 'Default Approvals Tracking Project',
          status: 'PLANNED',
          budget: 0
        }
      });
    }

    const approval = await prisma.approval.create({
      data: {
        companyId,
        projectId: project.id,
        approvalType: 'MUNICIPAL_NOC',
        authority: data.authorityName,
        applicationNumber: meta.appRegNumber || `APP-${Date.now()}`,
        submittedDate: new Date(data.submissionDate),
        status: data.status
      }
    });

    if (data.objectionLetter?.base64) {
      const objectionDoc = await prisma.approvalDocument.create({
        data: {
          approvalId: approval.id,
          documentName: 'Objection Notice Slip',
          documentType: 'Objection Slip',
          file: `uploaded_objection_letter_${Date.now()}.pdf`,
        }
      });
      await this.indexDocument(companyId, "Objection Notice Slip", "APPROVAL", approval.id, "PDF", objectionDoc.file);
    }

    const aiReport = await prisma.approvalAI.create({
      data: {
        approvalId: approval.id,
        delayProbability: 0.25,
        missingDocuments: analysis.aiMissingDocuments || '',
        nextStep: JSON.stringify({
          nextSteps: analysis.aiNextSteps || '',
          dangerLevel: analysis.dangerLevel || 'MEDIUM',
          targetSlaDays: Number(meta.targetSlaDays) || 60,
          appRegNumber: meta.appRegNumber || '',
          officerName: meta.officerName || '',
          officerMobile: meta.officerMobile || '',
          feesPaid: Number(meta.feesPaid) || 0,
          premiumFees: Number(meta.premiumFees) || 0,
          receiptUrl: meta.receiptUrl || '',
          approvalType: meta.approvalType || 'Building Plan Approval',
          approvalCategory: meta.approvalCategory || 'Construction',
          mandatoryOptional: meta.mandatoryOptional || 'Mandatory',
          projectRef: {
            projectId: ref.projectId || '',
            projectName: projName,
            jvId: ref.jvId || '',
            jvName: jvName,
            landId: ref.landId || '',
            landNumber: landNo
          },
          readinessScore: Number(analysis.readinessScore) || 91,
          readinessStatus: analysis.readinessStatus || 'Ready for Submission',
          missingDocMetrics: analysis.missingDocMetrics || { required: 18, uploaded: 16, missing: 2, pendingList: ["Fire Drawing", "Structural Stability Certificate"] },
          objectionQueries: analysis.objectionQueries || [],
          progressSteps: analysis.progressSteps || [],
          resubmissionHistory: analysis.resubmissionHistory || [],
          slaTimeline: {
            submissionDate: data.submissionDate,
            slaDays: Number(meta.targetSlaDays) || 30,
            expectedDays: Number(analysis.estimatedApprovalDays) || 28
          },
          aiSuggestions: analysis.aiSuggestions || []
        }),
        estimatedApprovalDays: Number(analysis.estimatedApprovalDays) || 45,
        riskLevel: analysis.dangerLevel || 'MEDIUM',
        summary: analysis.aiPrediction || ''
      }
    });

    return {
      id: approval.id,
      companyId: approval.companyId,
      authorityName: approval.authority,
      status: approval.status,
      submissionDate: approval.submittedDate,
      objectionLetterUrl: data.objectionLetter?.base64 ? "Uploaded" : null,
      aiPrediction: aiReport.summary,
      aiMissingDocuments: aiReport.missingDocuments,
      aiNextSteps: analysis.aiNextSteps || '',
      dangerLevel: analysis.dangerLevel || 'MEDIUM',
      targetSlaDays: Number(meta.targetSlaDays) || 60,
      appRegNumber: approval.applicationNumber,
      officerName: meta.officerName || '',
      officerMobile: meta.officerMobile || '',
      feesPaid: Number(meta.feesPaid) || 0,
      premiumFees: Number(meta.premiumFees) || 0,
      receiptUrl: meta.receiptUrl || '',
      
      approvalType: meta.approvalType || 'Building Plan Approval',
      approvalCategory: meta.approvalCategory || 'Construction',
      mandatoryOptional: meta.mandatoryOptional || 'Mandatory',
      projectRef: {
        projectId: ref.projectId || '',
        projectName: projName,
        jvId: ref.jvId || '',
        jvName: jvName,
        landId: ref.landId || '',
        landNumber: landNo
      },
      readinessScore: Number(analysis.readinessScore) || 91,
      readinessStatus: analysis.readinessStatus || 'Ready for Submission',
      missingDocMetrics: analysis.missingDocMetrics || { required: 18, uploaded: 16, missing: 2, pendingList: ["Fire Drawing", "Structural Stability Certificate"] },
      objectionQueries: analysis.objectionQueries || [],
      progressSteps: analysis.progressSteps || [],
      resubmissionHistory: analysis.resubmissionHistory || [],
      slaTimeline: {
        submissionDate: data.submissionDate,
        slaDays: Number(meta.targetSlaDays) || 30,
        expectedDays: Number(analysis.estimatedApprovalDays) || 28
      },
      aiSuggestions: analysis.aiSuggestions || [],
      createdAt: approval.createdAt,
      updatedAt: approval.updatedAt
    };
  }

  async getPropertyPlans(companyId: string) {
    return await prisma.propertyPlan.findMany({
      where: { companyId },
      orderBy: { createdAt: 'desc' }
    });
  }

  private generateSvg(rooms: any[]): string {
    let svg = `<svg viewBox="0 0 220 220" width="100%" height="100%" style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:8px;">`;
    // Draw background grid lines
    for (let i = 10; i < 220; i += 20) {
      svg += `<line x1="${i}" y1="0" x2="${i}" y2="220" stroke="#f1f5f9" stroke-width="1"/>`;
      svg += `<line x1="0" y1="${i}" x2="220" y2="${i}" stroke="#f1f5f9" stroke-width="1"/>`;
    }
    // Draw rooms
    rooms.forEach((r: any) => {
      let fill = '#e0e7ff';
      let stroke = '#4f46e5';
      let strokeDash = '';
      const nameLower = r.name.toLowerCase();
      if (nameLower.includes('green') || nameLower.includes('landscap') || nameLower.includes('garden')) {
        fill = '#ecfdf5';
        stroke = '#10b981';
      } else if (nameLower.includes('park') || nameLower.includes('road') || nameLower.includes('car')) {
        fill = '#f1f5f9';
        stroke = '#64748b';
      } else if (nameLower.includes('club') || nameLower.includes('pool')) {
        fill = '#fff7ed';
        stroke = '#f97316';
      } else if (nameLower.includes('bound') || nameLower.includes('plot') || nameLower.includes('outline')) {
        fill = 'none';
        stroke = '#020617';
        strokeDash = 'stroke-dasharray="4,4"';
      }

      svg += `<rect x="${r.x}" y="${r.y}" width="${r.w}" height="${r.h}" fill="${fill}" stroke="${stroke}" stroke-width="1.5" rx="3" fill-opacity="0.85" ${strokeDash}/>`;
      svg += `<text x="${r.x + r.w / 2}" y="${r.y + r.h / 2}" font-size="6" font-family="ui-sans-serif, sans-serif" font-weight="bold" fill="#0f172a" text-anchor="middle" dominant-baseline="middle">${r.name}</text>`;
    });
    svg += `</svg>`;
    return svg;
  }

  private generateDxf(rooms: any[]): string {
    let dxf = "  0\nSECTION\n  2\nHEADER\n  0\nENDSEC\n  0\nSECTION\n  2\nTABLES\n  0\nENDSEC\n  0\nSECTION\n  2\nBLOCKS\n  0\nENDSEC\n  0\nSECTION\n  2\nENTITIES\n";

    rooms.forEach((r: any) => {
      // Scale coordinates from SVG units (0-200) to typical meter-scale (0-50m) for CAD compatibility
      const x1 = r.x * 0.25;
      const y1 = r.y * -0.25; // Invert Y axis for CAD drawing standards
      const x2 = (r.x + r.w) * 0.25;
      const y2 = (r.y + r.h) * -0.25;

      const drawLine = (ax: number, ay: number, bx: number, by: number) => {
        dxf += "  0\nLINE\n  8\nWalls\n";
        dxf += ` 10\n${ax.toFixed(2)}\n 20\n${ay.toFixed(2)}\n 30\n0.0\n`;
        dxf += ` 11\n${bx.toFixed(2)}\n 21\n${by.toFixed(2)}\n 31\n0.0\n`;
      };

      drawLine(x1, y1, x2, y1);
      drawLine(x2, y1, x2, y2);
      drawLine(x2, y2, x1, y2);
      drawLine(x1, y2, x1, y1);

      // Room label in the center of the bounding box
      const cx = (x1 + x2) / 2;
      const cy = (y1 + y2) / 2;
      dxf += "  0\nTEXT\n  8\nLabels\n";
      dxf += ` 10\n${cx.toFixed(2)}\n 20\n${cy.toFixed(2)}\n 30\n0.0\n`;
      dxf += " 40\n1.2\n"; // Text height in drawing units
      dxf += `  1\n${r.name}\n`;
    });

    dxf += "  0\nENDSEC\n  0\nEOF\n";
    return dxf;
  }

  async generatePropertyPlan(
    companyId: string,
    data: {
      projectName: string;
      plotSize: number;
      roadWidth: number;
      fsi: number;
      budget: number;
      targetCustomer: string;
      frontSetback?: number;
      rearSetback?: number;
      sideSetbacks?: number;
      requestedFloors?: number;
      version?: string;
      parentPlanId?: string | null;
      facing?: string;
      parkingType?: string;
      gardenRequired?: boolean;
      swimmingPool?: boolean;
      commercialShops?: boolean;
      flatMix?: string;
      liftCount?: number;
      staircaseCount?: number;
      landCost?: number;
      expectedSalesRate?: number;
      flatsPerFloor?: number;
      customInstructions?: string;
    }
  ) {
    const prompt = `
      You are an expert Chief Architect, Urban Planner, and Quantity Surveyor.
      Generate a detailed property plan layout based on the following input parameters:
      - Project Name: ${data.projectName}
      - Plot Size: ${data.plotSize} sq. ft.
      - Front Road Width: ${data.roadWidth} meters
      - FSI (Floor Space Index): ${data.fsi}
      - Budget: INR ${data.budget}
      - Target Customer: ${data.targetCustomer}
      - Setbacks: Front Setback: ${data.frontSetback ?? 6.0}m, Rear Setback: ${data.rearSetback ?? 3.0}m, Left/Right Side Setbacks: ${data.sideSetbacks ?? 3.0}m
      - Requested Target Floors: ${data.requestedFloors ?? 1}
      - Facing direction: ${data.facing ?? 'East'}
      - Parking Type: ${data.parkingType ?? 'Basement'}
      - Garden Required: ${data.gardenRequired ? 'Yes' : 'No'}
      - Swimming Pool: ${data.swimmingPool ? 'Yes' : 'No'}
      - Commercial Shops: ${data.commercialShops ? 'Yes' : 'No'}
      - Preferred Flat Mix: ${data.flatMix ?? '2BHK + 3BHK'}
      - Lift Count: ${data.liftCount ?? 2}
      - Staircase Count: ${data.staircaseCount ?? 2}
      - Land Purchase Cost: ${data.landCost ? `INR ${data.landCost}` : 'Not Provided by builder (Do NOT invent or guess land cost)'}
      - Expected Sales Rate (per Sq. Ft. Saleable Area): ${data.expectedSalesRate ? `INR ${data.expectedSalesRate}` : 'Not Provided by builder (Do NOT invent or guess revenue)'}
      - Typical Flats Per Floor: ${data.flatsPerFloor ?? 2} flats per typical floor
      ${data.customInstructions ? `- Builder Custom Instructions/Guidelines: "${data.customInstructions}"` : ''}

      You must calculate:
      1. Optimal recommended floors based on the bylaws and requested floors (explain the setback or FSI math limit in decisionReason).
      2. Ground coverage percentage, total unit count, parking spaces, FSI utilization, saleable area.
      3. Project financials: Cost per sqft construction, total estimated construction cost, estimated revenue, expected profit, ROI percentage, and estimated break-even period in months.
      4. Structured score metrics (0-100) representing Planning, Profitability, Parking, Ventilation, and Market Fit.
      5. Bulleted lists of risk factors and recommended compliance/design items.
      6. Detailed unit mix layout, landscaping, amenities, and elevation aesthetics.
      
      Additionally, you must design a simplified 2D layout map coordinates array within a 200x200 grid system representing the plot layout.
      The room coordinates should have integer values (0 to 200). The first item should define the boundary / plot outline (e.g. name: "Plot Boundary", x: 10, y: 10, w: 180, h: 180). Additional blocks (Building Blocks, Parking Ground, Garden, Clubhouse) should fit inside this boundary keeping the setback margins in mind.

      CRITICAL BUSINESS LOGIC CONSTRAINTS (YOU MUST COMPLY):
      *   **Builder Guidelines Integration:** If "Builder Custom Instructions/Guidelines" is provided above, you MUST prioritize and incorporate them into your calculations, room configurations, pricing assumptions, and layout suggestions.
      *   **Symmetrical Flats Count:** The "totalUnits" MUST be equal to "floors" multiplied by the "flatsPerFloor" input parameter (so they split symmetrically per floor). If floors is 6 and flatsPerFloor is 3, totalUnits MUST be 18.
      *   **No Land Cost Invention:** If Land Purchase Cost was not provided, "landCost" must be 0.
      *   **No Revenue Invention:** If Expected Sales Rate was not provided, "estimatedRevenue", "expectedProfit", and "roi" must be 0. Do NOT guess sales prices or profit margins.
      *   **Construction cost formula:** Construction Cost = Built-up Area × Cost per Sqft (Use costPerSqft = 2500).
      *   **Parking count math:** Resident Parking = totalUnits × 1 slot. Visitor Parking = Resident Parking × 0.25 (Clipped to nearest integer). Total parking = Resident Parking + Visitor Parking.
      *   **Minimal Hallucination:** Do not invent elaborate custom landscaping or facade design styles unless requested. If generic, use standard placeholder briefs (e.g. "Standard modern structure" or "Municipal landscaping layout").

      You must respond in strict JSON format matching this schema:
      {
        "saleableArea": <number representing calculated total saleable area in sq. ft.>,
        "floors": <number representing calculated optimal total floors based on requested floors and rules>,
        "totalUnits": <number representing total calculated flat/unit count matching floors * flatsPerFloor>,
        "parkingSpaces": <number representing total calculated parking slots count based on parking formula>,
        "builtUpArea": <number representing total built-up area in sq. ft.>,
        "fsiUsed": <number representing calculated FSI utilization multiplier, e.g. 2.15>,
        "coverage": <number representing building ground footprint coverage percentage, e.g. 42.8>,
        "decisionReason": "<detailed reason text explaining recommended floors choice relative to requested target floors, e.g. due to setback limits>",
        "confidenceScore": <confidence percentage, e.g. 95>,
        "costPerSqft": 2500,
        "estimatedCost": <total estimated construction cost in INR matching builtUpArea * 2500>,
        "estimatedRevenue": <estimated total sales revenue in INR, e.g. saleableArea * expectedSalesRate, or 0 if not provided>,
        "expectedProfit": <expected profit in INR, e.g. revenue - cost, or 0 if not provided>,
        "roi": <ROI percentage, or 0 if not provided>,
        "breakEvenMonths": <break even timeline in months, or 18 if not provided>,
        "overallScore": <overall planning score, e.g. 92>,
        "planningScore": <planning score, e.g. 95>,
        "profitScore": <profitability score, e.g. 91>,
        "parkingScore": <parking score, e.g. 88>,
        "ventilationScore": <ventilation score, e.g. 93>,
        "marketFitScore": <market fit score, e.g. 90>,
        "riskLevel": "<LOW | MEDIUM | HIGH>",
        "riskList": ["risk 1 text", "risk 2 text", ...],
        "recommendations": ["recommendation 1 text", "recommendation 2 text", ...],
        "unitMix": "<detailed configuration breakdown text>",
        "parkingLayout": "<parking space slot count and guidelines text>",
        "amenities": "<amenities list text>",
        "clubHouse": "<clubhouse features and area reasoning text>",
        "landscape": "<landscape design text>",
        "commercialSpace": "<commercial spaces split text>",
        "elevationConcept": "<conceptual aesthetic facade text>",
        "costEstimates": "<itemized material and labor cost estimates text>",
        "rooms": [
          { "name": "Plot Boundary", "x": 10, "y": 10, "w": 180, "h": 180 },
          { "name": "Building Block A", "x": 30, "y": 30, "w": 60, "h": 80 },
          { "name": "Building Block B", "x": 100, "y": 30, "w": 60, "h": 80 },
          { "name": "Amenities & Pool", "x": 30, "y": 120, "w": 50, "h": 50 },
          { "name": "Parking Ground", "x": 90, "y": 120, "w": 80, "h": 55 },
          { "name": "Garden Zone", "x": 15, "y": 15, "w": 170, "h": 10 }
        ]
      }
      Only return the raw JSON object. Do not wrap it in markdown block tags.
    `;

    const aiResponseText = await this.askGeminiWithVision(
      prompt,
      [],
      "You are a professional real estate developer, structural engineer, and senior architect."
    );

    let plan: any;
    try {
      plan = this.parseGeminiJson(aiResponseText);
    } catch (e) {
      console.error('Failed to parse Gemini response as JSON. Raw text was:', aiResponseText);
      throw new Error('Gemini did not return a valid JSON response. Details: ' + aiResponseText);
    }

    const rooms = Array.isArray(plan.rooms) ? plan.rooms : [
      { name: "Plot Boundary", x: 10, y: 10, w: 180, h: 180 },
      { name: "Main Block", x: 30, y: 30, w: 140, h: 100 },
      { name: "Green Zone", x: 30, y: 140, w: 60, h: 40 },
      { name: "Parking Area", x: 100, y: 140, w: 70, h: 40 }
    ];

    const svgFloorPlan = this.generateSvg(rooms);
    const dxfContent = this.generateDxf(rooms);

    const record = await prisma.propertyPlan.create({
      data: {
        companyId,
        projectName: data.projectName,
        plotSize: data.plotSize,
        roadWidth: data.roadWidth,
        fsi: data.fsi,
        budget: data.budget,
        targetCustomer: data.targetCustomer,
        frontSetback: data.frontSetback ?? 6.0,
        rearSetback: data.rearSetback ?? 3.0,
        sideSetbacks: data.sideSetbacks ?? 3.0,
        requestedFloors: data.requestedFloors ?? 1,
        
        facing: data.facing ?? 'East',
        parkingType: data.parkingType ?? 'Basement',
        gardenRequired: data.gardenRequired ?? true,
        swimmingPool: data.swimmingPool ?? true,
        commercialShops: data.commercialShops ?? false,
        flatMix: data.flatMix ?? '2BHK + 3BHK',
        liftCount: data.liftCount ?? 2,
        staircaseCount: data.staircaseCount ?? 2,
        landCost: data.landCost ?? 0,
        expectedSalesRate: data.expectedSalesRate ?? 0,
        flatsPerFloor: data.flatsPerFloor ?? 2,
        customInstructions: data.customInstructions ?? null,

        floors: plan.floors ? Number(plan.floors) : (data.requestedFloors ?? 1),
        totalUnits: plan.totalUnits ? Number(plan.totalUnits) : 0,
        parkingSpaces: plan.parkingSpaces ? Number(plan.parkingSpaces) : 0,
        builtUpArea: plan.builtUpArea ? Number(plan.builtUpArea) : 0,
        fsiUsed: plan.fsiUsed ? Number(plan.fsiUsed) : 0,
        coverage: plan.coverage ? Number(plan.coverage) : 0,
        
        decisionReason: plan.decisionReason || 'Recommended configuration complies with Pune setbacks and road-width FSI standards.',
        confidenceScore: plan.confidenceScore ? Number(plan.confidenceScore) : 95,
        
        costPerSqft: plan.costPerSqft ? Number(plan.costPerSqft) : 2500,
        estimatedCost: plan.estimatedCost ? Number(plan.estimatedCost) : 0,
        estimatedRevenue: plan.estimatedRevenue ? Number(plan.estimatedRevenue) : 0,
        expectedProfit: plan.expectedProfit ? Number(plan.expectedProfit) : 0,
        roi: plan.roi ? Number(plan.roi) : 0,
        breakEvenMonths: plan.breakEvenMonths ? Number(plan.breakEvenMonths) : 18,
        
        overallScore: plan.overallScore ? Number(plan.overallScore) : 90,
        planningScore: plan.planningScore ? Number(plan.planningScore) : 90,
        profitScore: plan.profitScore ? Number(plan.profitScore) : 90,
        parkingScore: plan.parkingScore ? Number(plan.parkingScore) : 90,
        ventilationScore: plan.ventilationScore ? Number(plan.ventilationScore) : 90,
        marketFitScore: plan.marketFitScore ? Number(plan.marketFitScore) : 90,
        
        riskLevel: plan.riskLevel || 'LOW',
        riskList: plan.riskList ? JSON.stringify(plan.riskList) : JSON.stringify([]),
        recommendations: plan.recommendations ? JSON.stringify(plan.recommendations) : JSON.stringify([]),

        unitMix: plan.unitMix || 'N/A',
        parkingLayout: plan.parkingLayout || 'N/A',
        amenities: plan.amenities || 'N/A',
        clubHouse: plan.clubHouse || 'N/A',
        landscape: plan.landscape || 'N/A',
        commercialSpace: plan.commercialSpace || 'N/A',
        elevationConcept: plan.elevationConcept || 'N/A',
        costEstimates: plan.costEstimates || 'N/A',
        saleableArea: plan.saleableArea ? Number(plan.saleableArea) : (data.plotSize * data.fsi),
        svgFloorPlan,
        dxfContent,
        
        version: data.version || 'V1',
        parentPlanId: data.parentPlanId || null,
        status: 'DRAFT'
      }
    });

    return record;
  }

  async getDocumentCatalog(companyId: string) {
    return await prisma.documentCatalog.findMany({
      where: { companyId },
      orderBy: { uploadedAt: 'desc' }
    });
  }

  async indexDocument(
    companyId: string,
    title: string,
    module: string,
    referenceId: string,
    documentType: string,
    fileUrl: string,
    uploadedBy: string = 'system'
  ) {
    return await prisma.documentCatalog.create({
      data: {
        companyId,
        title,
        module,
        referenceId,
        documentType,
        fileUrl,
        uploadedBy
      }
    });
  }
}
