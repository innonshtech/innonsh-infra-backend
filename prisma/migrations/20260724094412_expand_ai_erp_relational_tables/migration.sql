/*
  Warnings:

  - You are about to drop the column `aiRecommendedModel` on the `JVAgreement` table. All the data in the column will be lost.
  - You are about to drop the column `aiRiskAnalysis` on the `JVAgreement` table. All the data in the column will be lost.
  - You are about to drop the column `aiRoiPrediction` on the `JVAgreement` table. All the data in the column will be lost.
  - You are about to drop the column `builderName` on the `JVAgreement` table. All the data in the column will be lost.
  - You are about to drop the column `builderTerms` on the `JVAgreement` table. All the data in the column will be lost.
  - You are about to drop the column `constructionCost` on the `JVAgreement` table. All the data in the column will be lost.
  - You are about to drop the column `investorFunds` on the `JVAgreement` table. All the data in the column will be lost.
  - You are about to drop the column `investorName` on the `JVAgreement` table. All the data in the column will be lost.
  - You are about to drop the column `investorTerms` on the `JVAgreement` table. All the data in the column will be lost.
  - You are about to drop the column `landOwnerName` on the `JVAgreement` table. All the data in the column will be lost.
  - You are about to drop the column `landOwnerTerms` on the `JVAgreement` table. All the data in the column will be lost.
  - You are about to drop the column `landValue` on the `JVAgreement` table. All the data in the column will be lost.
  - You are about to drop the column `projectName` on the `JVAgreement` table. All the data in the column will be lost.
  - You are about to drop the `ApprovalTask` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `FeasibilityStudy` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `LandPlot` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `agreementNumber` to the `JVAgreement` table without a default value. This is not possible if the table is not empty.
  - Added the required column `agreementType` to the `JVAgreement` table without a default value. This is not possible if the table is not empty.
  - Added the required column `effectiveDate` to the `JVAgreement` table without a default value. This is not possible if the table is not empty.
  - Added the required column `projectId` to the `JVAgreement` table without a default value. This is not possible if the table is not empty.
  - Added the required column `status` to the `JVAgreement` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "ApprovalTask" DROP CONSTRAINT "ApprovalTask_companyId_fkey";

-- DropForeignKey
ALTER TABLE "FeasibilityStudy" DROP CONSTRAINT "FeasibilityStudy_companyId_fkey";

-- DropForeignKey
ALTER TABLE "LandPlot" DROP CONSTRAINT "LandPlot_companyId_fkey";

-- AlterTable
ALTER TABLE "JVAgreement" DROP COLUMN "aiRecommendedModel",
DROP COLUMN "aiRiskAnalysis",
DROP COLUMN "aiRoiPrediction",
DROP COLUMN "builderName",
DROP COLUMN "builderTerms",
DROP COLUMN "constructionCost",
DROP COLUMN "investorFunds",
DROP COLUMN "investorName",
DROP COLUMN "investorTerms",
DROP COLUMN "landOwnerName",
DROP COLUMN "landOwnerTerms",
DROP COLUMN "landValue",
DROP COLUMN "projectName",
ADD COLUMN     "agreementNumber" TEXT NOT NULL,
ADD COLUMN     "agreementType" TEXT NOT NULL,
ADD COLUMN     "document" TEXT,
ADD COLUMN     "effectiveDate" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "expiryDate" TIMESTAMP(3),
ADD COLUMN     "projectId" TEXT NOT NULL,
ADD COLUMN     "status" TEXT NOT NULL;

-- DropTable
DROP TABLE "ApprovalTask";

-- DropTable
DROP TABLE "FeasibilityStudy";

-- DropTable
DROP TABLE "LandPlot";

-- CreateTable
CREATE TABLE "Land" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "landCode" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "village" TEXT NOT NULL,
    "taluka" TEXT NOT NULL,
    "district" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "surveyNumber" TEXT NOT NULL,
    "subSurveyNumber" TEXT,
    "area" DOUBLE PRECISION NOT NULL,
    "unit" TEXT NOT NULL,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "googleMapLink" TEXT,
    "landType" TEXT NOT NULL,
    "zoning" TEXT NOT NULL,
    "currentStatus" TEXT NOT NULL,
    "askingPrice" DOUBLE PRECISION NOT NULL,
    "marketValue" DOUBLE PRECISION,
    "purchasePrice" DOUBLE PRECISION,
    "remarks" TEXT,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Land_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LandOwner" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "mobile" TEXT NOT NULL,
    "email" TEXT,
    "aadhaar" TEXT,
    "pan" TEXT,
    "address" TEXT,
    "bankDetails" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LandOwner_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LandOwnership" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "landId" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "ownershipPercentage" DOUBLE PRECISION NOT NULL,
    "ownershipType" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LandOwnership_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LandDocument" (
    "id" TEXT NOT NULL,
    "landId" TEXT NOT NULL,
    "documentType" TEXT NOT NULL,
    "documentName" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "expiryDate" TIMESTAMP(3),
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "uploadedBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LandDocument_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SoilReport" (
    "id" TEXT NOT NULL,
    "landId" TEXT NOT NULL,
    "soilType" TEXT NOT NULL,
    "bearingCapacity" DOUBLE PRECISION NOT NULL,
    "waterLevel" DOUBLE PRECISION,
    "reportFile" TEXT,
    "testedBy" TEXT,
    "reportDate" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SoilReport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Encumbrance" (
    "id" TEXT NOT NULL,
    "landId" TEXT NOT NULL,
    "bankLoan" DOUBLE PRECISION,
    "courtCase" TEXT,
    "mortgage" TEXT,
    "governmentRestriction" TEXT,
    "remarks" TEXT,
    "status" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Encumbrance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NearbyInfrastructure" (
    "id" TEXT NOT NULL,
    "landId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "distance" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "NearbyInfrastructure_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GovernmentNotification" (
    "id" TEXT NOT NULL,
    "landId" TEXT NOT NULL,
    "department" TEXT NOT NULL,
    "notificationType" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL,
    "document" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GovernmentNotification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LandAIScore" (
    "id" TEXT NOT NULL,
    "landId" TEXT NOT NULL,
    "overallScore" DOUBLE PRECISION NOT NULL,
    "developmentScore" DOUBLE PRECISION NOT NULL,
    "riskScore" DOUBLE PRECISION NOT NULL,
    "appreciationScore" DOUBLE PRECISION NOT NULL,
    "recommendedPrice" DOUBLE PRECISION,
    "futureValue" DOUBLE PRECISION,
    "summary" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LandAIScore_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "JVProject" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "landId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "projectType" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "JVProject_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Partner" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "company" TEXT,
    "mobile" TEXT NOT NULL,
    "email" TEXT,
    "address" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Partner_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RevenueShare" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "partnerId" TEXT NOT NULL,
    "percentage" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RevenueShare_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProfitShare" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "partnerId" TEXT NOT NULL,
    "percentage" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProfitShare_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AreaShare" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "partnerId" TEXT NOT NULL,
    "area" DOUBLE PRECISION NOT NULL,
    "unit" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AreaShare_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PartnerWallet" (
    "id" TEXT NOT NULL,
    "partnerId" TEXT NOT NULL,
    "balance" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalPaid" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalReceived" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "pendingAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PartnerWallet_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ROIAnalysis" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "investment" DOUBLE PRECISION NOT NULL,
    "expectedRevenue" DOUBLE PRECISION NOT NULL,
    "expectedProfit" DOUBLE PRECISION NOT NULL,
    "roi" DOUBLE PRECISION NOT NULL,
    "paybackPeriod" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ROIAnalysis_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "JVAIRecommendation" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "bestModel" TEXT NOT NULL,
    "riskScore" DOUBLE PRECISION NOT NULL,
    "roiPrediction" TEXT NOT NULL,
    "recommendation" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "JVAIRecommendation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Feasibility" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "landId" TEXT NOT NULL,
    "projectName" TEXT NOT NULL,
    "fsi" DOUBLE PRECISION NOT NULL,
    "tdr" DOUBLE PRECISION,
    "roadWidth" DOUBLE PRECISION NOT NULL,
    "plotArea" DOUBLE PRECISION NOT NULL,
    "saleableArea" DOUBLE PRECISION,
    "constructionArea" DOUBLE PRECISION,
    "constructionCost" DOUBLE PRECISION NOT NULL,
    "marketRate" DOUBLE PRECISION NOT NULL,
    "expectedRevenue" DOUBLE PRECISION,
    "expectedProfit" DOUBLE PRECISION,
    "cashFlow" TEXT,
    "breakEven" DOUBLE PRECISION,
    "timeline" TEXT,
    "status" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Feasibility_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ZoningRule" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "zoneType" TEXT NOT NULL,
    "fsi" DOUBLE PRECISION NOT NULL,
    "heightLimit" DOUBLE PRECISION,
    "setback" TEXT,
    "parkingRequirement" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ZoningRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MunicipalRule" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "ruleName" TEXT NOT NULL,
    "description" TEXT,
    "value" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MunicipalRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MarketAnalysis" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "avgSellingPrice" DOUBLE PRECISION NOT NULL,
    "demand" TEXT NOT NULL,
    "competitorProjects" TEXT,
    "absorptionRate" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MarketAnalysis_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FeasibilityAI" (
    "id" TEXT NOT NULL,
    "feasibilityId" TEXT NOT NULL,
    "profitScore" DOUBLE PRECISION NOT NULL,
    "riskScore" DOUBLE PRECISION NOT NULL,
    "successProbability" DOUBLE PRECISION NOT NULL,
    "recommendation" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FeasibilityAI_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Approval" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "approvalType" TEXT NOT NULL,
    "authority" TEXT NOT NULL,
    "applicationNumber" TEXT NOT NULL,
    "submittedDate" TIMESTAMP(3) NOT NULL,
    "expectedApprovalDate" TIMESTAMP(3),
    "approvedDate" TIMESTAMP(3),
    "status" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Approval_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ApprovalDocument" (
    "id" TEXT NOT NULL,
    "approvalId" TEXT NOT NULL,
    "documentName" TEXT NOT NULL,
    "documentType" TEXT NOT NULL,
    "file" TEXT NOT NULL,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ApprovalDocument_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ApprovalChecklist" (
    "id" TEXT NOT NULL,
    "approvalId" TEXT NOT NULL,
    "item" TEXT NOT NULL,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "remarks" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ApprovalChecklist_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ApprovalTimeline" (
    "id" TEXT NOT NULL,
    "approvalId" TEXT NOT NULL,
    "stage" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "remarks" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ApprovalTimeline_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ApprovalAI" (
    "id" TEXT NOT NULL,
    "approvalId" TEXT NOT NULL,
    "delayProbability" DOUBLE PRECISION NOT NULL,
    "missingDocuments" TEXT NOT NULL,
    "nextStep" TEXT NOT NULL,
    "estimatedApprovalDays" DOUBLE PRECISION NOT NULL,
    "riskLevel" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ApprovalAI_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Land" ADD CONSTRAINT "Land_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LandOwner" ADD CONSTRAINT "LandOwner_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LandOwnership" ADD CONSTRAINT "LandOwnership_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LandOwnership" ADD CONSTRAINT "LandOwnership_landId_fkey" FOREIGN KEY ("landId") REFERENCES "Land"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LandOwnership" ADD CONSTRAINT "LandOwnership_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "LandOwner"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LandDocument" ADD CONSTRAINT "LandDocument_landId_fkey" FOREIGN KEY ("landId") REFERENCES "Land"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SoilReport" ADD CONSTRAINT "SoilReport_landId_fkey" FOREIGN KEY ("landId") REFERENCES "Land"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Encumbrance" ADD CONSTRAINT "Encumbrance_landId_fkey" FOREIGN KEY ("landId") REFERENCES "Land"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NearbyInfrastructure" ADD CONSTRAINT "NearbyInfrastructure_landId_fkey" FOREIGN KEY ("landId") REFERENCES "Land"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GovernmentNotification" ADD CONSTRAINT "GovernmentNotification_landId_fkey" FOREIGN KEY ("landId") REFERENCES "Land"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LandAIScore" ADD CONSTRAINT "LandAIScore_landId_fkey" FOREIGN KEY ("landId") REFERENCES "Land"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JVProject" ADD CONSTRAINT "JVProject_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JVProject" ADD CONSTRAINT "JVProject_landId_fkey" FOREIGN KEY ("landId") REFERENCES "Land"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Partner" ADD CONSTRAINT "Partner_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JVAgreement" ADD CONSTRAINT "JVAgreement_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "JVProject"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RevenueShare" ADD CONSTRAINT "RevenueShare_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "JVProject"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProfitShare" ADD CONSTRAINT "ProfitShare_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "JVProject"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AreaShare" ADD CONSTRAINT "AreaShare_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "JVProject"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PartnerWallet" ADD CONSTRAINT "PartnerWallet_partnerId_fkey" FOREIGN KEY ("partnerId") REFERENCES "Partner"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ROIAnalysis" ADD CONSTRAINT "ROIAnalysis_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "JVProject"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JVAIRecommendation" ADD CONSTRAINT "JVAIRecommendation_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "JVProject"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Feasibility" ADD CONSTRAINT "Feasibility_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Feasibility" ADD CONSTRAINT "Feasibility_landId_fkey" FOREIGN KEY ("landId") REFERENCES "Land"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ZoningRule" ADD CONSTRAINT "ZoningRule_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MunicipalRule" ADD CONSTRAINT "MunicipalRule_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MarketAnalysis" ADD CONSTRAINT "MarketAnalysis_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeasibilityAI" ADD CONSTRAINT "FeasibilityAI_feasibilityId_fkey" FOREIGN KEY ("feasibilityId") REFERENCES "Feasibility"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Approval" ADD CONSTRAINT "Approval_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Approval" ADD CONSTRAINT "Approval_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApprovalDocument" ADD CONSTRAINT "ApprovalDocument_approvalId_fkey" FOREIGN KEY ("approvalId") REFERENCES "Approval"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApprovalChecklist" ADD CONSTRAINT "ApprovalChecklist_approvalId_fkey" FOREIGN KEY ("approvalId") REFERENCES "Approval"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApprovalTimeline" ADD CONSTRAINT "ApprovalTimeline_approvalId_fkey" FOREIGN KEY ("approvalId") REFERENCES "Approval"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApprovalAI" ADD CONSTRAINT "ApprovalAI_approvalId_fkey" FOREIGN KEY ("approvalId") REFERENCES "Approval"("id") ON DELETE CASCADE ON UPDATE CASCADE;
