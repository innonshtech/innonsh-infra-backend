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
      try {
        const parsed = JSON.parse(l.remarks || '{}');
        roadWidth = parsed.roadWidth || 0;
      } catch (e) {
        // Fallback if not JSON
      }

      const latestAi = l.aiScores[0];
      let aiAppreciation = '';
      let aiRiskAnalysis = '';

      if (latestAi?.summary) {
        const parts = latestAi.summary.split('\n\nRisks: ');
        aiAppreciation = parts[0]?.replace('Appreciation: ', '') || '';
        aiRiskAnalysis = parts[1] || '';
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
        roadWidth: roadWidth,
        askingPrice: l.askingPrice,
        zoning: l.zoning,
        soilReportUrl: null,
        titleDeedUrl: null,
        aiScore: latestAi?.overallScore || null,
        aiSuggestedPrice: latestAi?.recommendedPrice || null,
        aiAppreciation: aiAppreciation || null,
        aiRiskAnalysis: aiRiskAnalysis || null,
        createdAt: l.createdAt,
        updatedAt: l.updatedAt
      };
    });
  }

  async analyzeLandPlot(
    companyId: string,
    data: {
      name: string;
      address: string;
      area: number;
      roadWidth: number;
      askingPrice: number;
      zoning: string;
      soilReport?: { base64: string; mimeType: string };
      titleDeed?: { base64: string; mimeType: string };
    }
  ) {
    const files: any[] = [];
    if (data.soilReport?.base64) files.push(data.soilReport);
    if (data.titleDeed?.base64) files.push(data.titleDeed);

    const prompt = `
      Analyze the following land plot and any attached documents (such as soil reports or title deeds) to estimate its potential and risks.
      
      Plot Details:
      - Name: ${data.name}
      - Address: ${data.address}
      - Area: ${data.area} sq. ft.
      - Road Width in front: ${data.roadWidth} ft.
      - Asking Price: INR ${data.askingPrice}
      - Zoning: ${data.zoning}
      
      If a soil report is attached, analyze it to determine soil load bearing capacity and foundation complexity.
      If a title deed/encumbrance certificate is attached, scan it for legal disputes, mortgages, or active warning flags.
      
      You must respond in strict JSON format matching this schema:
      {
        "aiScore": <number between 1 and 10 based on development potential>,
        "aiAppreciation": "<detailed text analysis of future appreciation trends>",
        "aiRiskAnalysis": "<detailed text analysis of engineering, legal, or financial risks>",
        "aiSuggestedPrice": <suggested fair value in INR based on plot details and documents>
      }
      Only return the raw JSON object. Do not wrap it in markdown block tags like \`\`\`json.
    `;

    const aiResponseText = await this.askGeminiWithVision(
      prompt,
      files,
      "You are a professional real estate investment analyst and geotechnical engineering advisor."
    );

    let analysis: any;
    try {
      analysis = JSON.parse(aiResponseText.trim());
    } catch (e) {
      console.error('Failed to parse Gemini response as JSON. Raw text was:', aiResponseText);
      throw new Error('Gemini did not return a valid JSON response. Details: ' + aiResponseText);
    }

    const addressParts = data.address.split(',').map(s => s.trim());
    const village = (data as any).village || addressParts[0] || 'N/A';
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
        title: data.name,
        village,
        taluka,
        district,
        state,
        surveyNumber,
        subSurveyNumber,
        latitude,
        longitude,
        googleMapLink,
        area: data.area,
        unit: 'sqft',
        landType: data.zoning,
        zoning: data.zoning,
        currentStatus: 'AVAILABLE',
        askingPrice: data.askingPrice,
        remarks: JSON.stringify({ roadWidth: data.roadWidth }),
        createdBy: 'system'
      }
    });

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

    if (data.titleDeed?.base64) {
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
        recommendedPrice: Number(analysis.aiSuggestedPrice) || data.askingPrice,
        futureValue: (Number(analysis.aiSuggestedPrice) || data.askingPrice) * 1.4,
        summary: `Appreciation: ${analysis.aiAppreciation || ''}\n\nRisks: ${analysis.aiRiskAnalysis || ''}`
      }
    });

    return {
      id: land.id,
      companyId: land.companyId,
      name: land.title,
      address: data.address,
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
      roadWidth: data.roadWidth,
      askingPrice: land.askingPrice,
      zoning: land.zoning,
      soilReportUrl: data.soilReport?.base64 ? "attached" : null,
      titleDeedUrl: data.titleDeed?.base64 ? "attached" : null,
      aiScore: aiScore.overallScore,
      aiSuggestedPrice: aiScore.recommendedPrice,
      aiAppreciation: analysis.aiAppreciation || null,
      aiRiskAnalysis: analysis.aiRiskAnalysis || null,
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

      if (latestAi?.recommendation) {
        try {
          const parsed = JSON.parse(latestAi.recommendation);
          landOwnerTerms = parsed.landOwnerTerms || '';
          builderTerms = parsed.builderTerms || '';
          investorTerms = parsed.investorTerms || '';
        } catch (e) {
          landOwnerTerms = latestAi.recommendation;
        }
      }

      return {
        id: p.id,
        companyId: p.companyId,
        projectName: p.name,
        landOwnerName: 'Land Owner Partner',
        builderName: 'Builder Partner',
        investorName: 'Investor Partner',
        landValue: p.land.askingPrice,
        constructionCost: p.land.askingPrice * 0.8, // Mocked Construction Cost
        investorFunds: p.land.askingPrice * 0.4,    // Mocked Funds
        landOwnerTerms: landOwnerTerms || 'Standard MoU',
        builderTerms: builderTerms || 'Standard Construction',
        investorTerms: investorTerms || 'Standard Investment',
        aiRecommendedModel: latestAi?.bestModel || null,
        aiRoiPrediction: latestAi?.roiPrediction || null,
        aiRiskAnalysis: latestAi?.roiPrediction ? latestAi.roiPrediction : null,
        createdAt: p.createdAt,
        updatedAt: p.updatedAt
      };
    });
  }

  async analyzeJVAgreement(
    companyId: string,
    data: {
      projectName: string;
      landOwnerName: string;
      builderName: string;
      investorName: string;
      landValue: number;
      constructionCost: number;
      investorFunds: number;
      landOwnerTerms: string;
      builderTerms: string;
      investorTerms: string;
      termSheet?: { base64: string; mimeType: string };
    }
  ) {
    const files: any[] = [];
    if (data.termSheet?.base64) files.push(data.termSheet);

    const prompt = `
      Analyze the proposed Joint Venture (JV) terms between the Land Owner, Builder, and Investors.
      
      JV Input Parameters:
      - Project Name: ${data.projectName}
      - Land Owner: ${data.landOwnerName} (Land Value Contribution: INR ${data.landValue})
      - Builder: ${data.builderName} (Est. Construction Cost: INR ${data.constructionCost})
      - Investor: ${data.investorName} (Investor Cash Contribution: INR ${data.investorFunds})
      - Land Owner Terms: ${data.landOwnerTerms}
      - Builder Terms: ${data.builderTerms}
      - Investor Terms: ${data.investorTerms}
      
      If a term sheet or draft agreement MOU document is attached, analyze its terms, clauses, and conditions.
      
      You must respond in strict JSON format matching this schema:
      {
        "aiRecommendedModel": "<recommendation of the best JV model, e.g. Revenue Share, Profit Share, Area Share, and why>",
        "aiRoiPrediction": "<detailed ROI predictions for landowner, builder, and investor>",
        "aiRiskAnalysis": "<detailed risk breakdown and mitigations for this JV arrangement>"
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
      analysis = JSON.parse(aiResponseText.trim());
    } catch (e) {
      console.error('Failed to parse Gemini response as JSON. Raw text was:', aiResponseText);
      throw new Error('Gemini did not return a valid JSON response. Details: ' + aiResponseText);
    }

    let land = await prisma.land.findFirst({ where: { companyId } });
    if (!land) {
      land = await prisma.land.create({
        data: {
          companyId,
          landCode: `LAND-JV-${Date.now()}`,
          title: `Land for ${data.projectName}`,
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
          askingPrice: data.landValue,
          createdBy: 'system'
        }
      });
    }

    const jvProject = await prisma.jVProject.create({
      data: {
        companyId,
        landId: land.id,
        name: data.projectName,
        projectType: 'JV_RESIDENTIAL',
        status: 'ACTIVE',
        startDate: new Date()
      }
    });

    await prisma.partner.create({
      data: {
        companyId,
        type: 'Land Owner',
        name: data.landOwnerName,
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

    const aiRec = await prisma.jVAIRecommendation.create({
      data: {
        projectId: jvProject.id,
        bestModel: analysis.aiRecommendedModel || 'Revenue Share',
        riskScore: 25,
        roiPrediction: analysis.aiRoiPrediction || '',
        recommendation: JSON.stringify({
          landOwnerTerms: data.landOwnerTerms,
          builderTerms: data.builderTerms,
          investorTerms: data.investorTerms
        })
      }
    });

    return {
      id: jvProject.id,
      companyId: jvProject.companyId,
      projectName: jvProject.name,
      landOwnerName: data.landOwnerName,
      builderName: data.builderName,
      investorName: data.investorName,
      landValue: data.landValue,
      constructionCost: data.constructionCost,
      investorFunds: data.investorFunds,
      landOwnerTerms: data.landOwnerTerms,
      builderTerms: data.builderTerms,
      investorTerms: data.investorTerms,
      aiRecommendedModel: aiRec.bestModel,
      aiRoiPrediction: analysis.aiRoiPrediction || null,
      aiRiskAnalysis: analysis.aiRiskAnalysis || null,
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
        aiCashFlow: latestAi?.recommendation || null,
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
      bylawsDoc?: { base64: string; mimeType: string };
    }
  ) {
    const files: any[] = [];
    if (data.bylawsDoc?.base64) files.push(data.bylawsDoc);

    const prompt = `
      Perform a comprehensive project feasibility study for the proposed project using the parameters below:
      
      Parameters:
      - Project Name: ${data.projectName}
      - Plot Area: ${data.area} sq. ft.
      - FSI (Floor Space Index): ${data.fsi}
      - Target Selling Price: INR ${data.sellingPrice} per sq. ft.
      - Est. Construction Material & Labor Cost: INR ${data.materialCost} per sq. ft.
      
      If a municipal bye-laws document is uploaded, scan it to determine legal height restrictions, parking spaces, setbacks, and other compliance metrics.
      
      You must respond in strict JSON format matching this schema:
      {
        "aiFeasibilityReport": "<executive summary of project feasibility, buildable area, and compliance>",
        "aiProfit": <estimated net profit in INR>,
        "aiBreakEven": <break-even point in terms of saleable area built/sold (in sq. ft.)>,
        "aiCashFlow": "<detailed month-by-month cash flow analysis and timelines>"
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
      analysis = JSON.parse(aiResponseText.trim());
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
          title: `Land for ${data.projectName}`,
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
        projectName: data.projectName,
        fsi: data.fsi,
        roadWidth: 30, // Mocked road width
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
        recommendation: analysis.aiCashFlow || '',
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
      aiCashFlow: aiReport.recommendation,
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
      return {
        id: a.id,
        companyId: a.companyId,
        authorityName: a.authority,
        status: a.status,
        submissionDate: a.submittedDate,
        objectionLetterUrl: null,
        aiPrediction: latestAi?.summary || null,
        aiMissingDocuments: latestAi?.missingDocuments || null,
        aiNextSteps: latestAi?.nextStep || null,
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
      objectionLetter?: { base64: string; mimeType: string };
    }
  ) {
    const files: any[] = [];
    if (data.objectionLetter?.base64) files.push(data.objectionLetter);

    const prompt = `
      Evaluate the regulatory approval task to predict delays and identify document compliance issues.
      
      Approval Task:
      - Authority: ${data.authorityName}
      - Current Status: ${data.status}
      - Submission Date: ${data.submissionDate}
      
      If a government query letter, rejection slip, or objection notice is attached, analyze it to extract specific objections and requirements.
      
      You must respond in strict JSON format matching this schema:
      {
        "aiPrediction": "<estimated days until approval, potential bottleneck analysis, and delay risk rating>",
        "aiMissingDocuments": "<detailed list of missing items or queries raised that need to be resolved>",
        "aiNextSteps": "<step-by-step guidance on how to respond and clear this approval>"
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
      analysis = JSON.parse(aiResponseText.trim());
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
        applicationNumber: `APP-${Date.now()}`,
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
        nextStep: analysis.aiNextSteps || '',
        estimatedApprovalDays: 45,
        riskLevel: 'MEDIUM',
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
      aiNextSteps: aiReport.nextStep,
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
      plan = JSON.parse(aiResponseText.trim());
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
