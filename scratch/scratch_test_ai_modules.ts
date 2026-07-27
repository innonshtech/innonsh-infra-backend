import { AiService } from '../src/modules/ai/ai.service';
import dotenv from 'dotenv';
dotenv.config();

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function runTests() {
  const service = new AiService();

  console.log("=========================================");
  console.log("STARTING AI MODULE TESTS WITH GEMINI API");
  console.log("=========================================\n");

  // 1. Test Land Plot Analysis
  console.log("--- 1. Testing Land Plot Analysis ---");
  const landData = {
    name: "Skyline Plot B",
    address: "Village Kharadi, Survey No. 12, Pune",
    area: 12000,
    roadWidth: 40,
    askingPrice: 45000000,
    zoning: "Residential",
    soilReport: {
      base64: Buffer.from("Soil bearing capacity: 150 kN/m2. Suitable for medium raft foundation. Medium clay composition.").toString('base64'),
      mimeType: "text/plain"
    }
  };

  try {
    console.log("Sending request to Gemini...");
    const prompt = `
      Analyze the following land plot:
      Name: ${landData.name}
      Address: ${landData.address}
      Area: ${landData.area} sqft
      Road Width: ${landData.roadWidth}ft
      Asking Price: INR ${landData.askingPrice}
      Zoning: ${landData.zoning}
      
      And check the attached report: "Soil bearing capacity is 150 kN/m2. Suitable for medium raft foundation."
      
      Respond in strict JSON:
      {
        "aiScore": 8.0,
        "aiAppreciation": "High appreciation expected",
        "aiRiskAnalysis": "No major risks",
        "aiSuggestedPrice": 42000000
      }
    `;
    const res = await service.askGeminiWithVision(prompt, [landData.soilReport], "You are a professional real estate analyst.");
    console.log("Gemini Response:\n", res);
    console.log("✔ Land Plot Analysis successfully processed by Gemini API!");
  } catch (err: any) {
    console.error("❌ Land Plot Analysis test failed:", err.message);
  }

  await sleep(3000);

  // 2. Test JV Agreement Analysis
  console.log("\n--- 2. Testing JV Agreement Analysis ---");
  const jvData = {
    projectName: "Riverside JV",
    landOwnerName: "Mr. Patil",
    builderName: "Lokeek Builders",
    investorName: "Global Wealth Fund",
    landValue: 30000000,
    constructionCost: 50000000,
    investorFunds: 20000000,
    landOwnerTerms: "Demands 45% area share and 10L cash upfront",
    builderTerms: "Requires 15% project management fee and takes remaining area share",
    investorTerms: "Requires 18% ROI before distribution of profit",
    termSheet: {
      base64: Buffer.from("MOU draft terms. 45% area to land owner. 18% ROI to investor.").toString('base64'),
      mimeType: "text/plain"
    }
  };

  try {
    console.log("Sending request to Gemini...");
    const prompt = `
      Analyze this JV between Land Owner (INR ${jvData.landValue} land), Builder (INR ${jvData.constructionCost} construction), and Investor (INR ${jvData.investorFunds} cash).
      Land Owner Terms: ${jvData.landOwnerTerms}
      Builder Terms: ${jvData.builderTerms}
      Investor Terms: ${jvData.investorTerms}
      
      Respond in strict JSON matching schema:
      {
        "aiRecommendedModel": "Area Share model suggested because...",
        "aiRoiPrediction": "Land owner ROI: 45% area, Builder ROI: ...",
        "aiRiskAnalysis": "Investor exit risk is mitigated by..."
      }
    `;
    const res = await service.askGeminiWithVision(prompt, [jvData.termSheet], "You are a legal financial advisor.");
    console.log("Gemini Response:\n", res);
    console.log("✔ JV Agreement Analysis successfully processed by Gemini API!");
  } catch (err: any) {
    console.error("❌ JV Agreement test failed:", err.message);
  }

  await sleep(3000);

  // 3. Test Feasibility Study
  console.log("\n--- 3. Testing Feasibility Analysis ---");
  const feasibilityData = {
    projectName: "Green Valley Plaza",
    area: 15000,
    fsi: 2.5,
    sellingPrice: 6500,
    materialCost: 2200,
    bylawsDoc: {
      base64: Buffer.from("Zoning laws. Height limit: 36 meters. Front setbacks: 6 meters.").toString('base64'),
      mimeType: "text/plain"
    }
  };

  try {
    console.log("Sending request to Gemini...");
    const prompt = `
      Perform project feasibility:
      Name: ${feasibilityData.projectName}
      Area: ${feasibilityData.area} sqft
      FSI: ${feasibilityData.fsi}
      Selling Price: INR ${feasibilityData.sellingPrice}/sqft
      Material/Labor Cost: INR ${feasibilityData.materialCost}/sqft
      
      Respond in strict JSON matching schema:
      {
        "aiFeasibilityReport": "High feasibility. Total built area is ...",
        "aiProfit": 35000000,
        "aiBreakEven": 12000,
        "aiCashFlow": "Month 1-6: Outflow, Month 7+: Inflow"
      }
    `;
    const res = await service.askGeminiWithVision(prompt, [feasibilityData.bylawsDoc], "You are a feasibility specialist.");
    console.log("Gemini Response:\n", res);
    console.log("✔ Feasibility Analysis successfully processed by Gemini API!");
  } catch (err: any) {
    console.error("❌ Feasibility test failed:", err.message);
  }

  await sleep(3000);

  // 4. Test Approval Delay Predictor
  console.log("\n--- 4. Testing Approval Delay Predictor ---");
  const approvalData = {
    authorityName: "RERA Maharashtra",
    status: "QUERY_RAISED",
    submissionDate: "2026-06-01",
    objectionLetter: {
      base64: Buffer.from("RERA Objection. Reason: Land title clearance certificate missing. Submit within 15 days.").toString('base64'),
      mimeType: "text/plain"
    }
  };

  try {
    console.log("Sending request to Gemini...");
    const prompt = `
      Predict delay for ${approvalData.authorityName} with status ${approvalData.status}.
      Objection Letter: "Land title certificate missing."
      
      Respond in strict JSON matching schema:
      {
        "aiPrediction": "Expect 30 days delay...",
        "aiMissingDocuments": "Land Title Clearance Certificate",
        "aiNextSteps": "Submit the title clearance document via RERA portal"
      }
    `;
    const res = await service.askGeminiWithVision(prompt, [approvalData.objectionLetter], "You are a regulatory coordinator.");
    console.log("Gemini Response:\n", res);
    console.log("✔ Approval Delay Prediction successfully processed by Gemini API!");
  } catch (err: any) {
    console.error("❌ Approval Delay Predictor test failed:", err.message);
  }
}

runTests();
