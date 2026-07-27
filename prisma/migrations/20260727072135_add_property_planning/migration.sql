-- CreateTable
CREATE TABLE "PropertyPlan" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "projectName" TEXT NOT NULL,
    "plotSize" DOUBLE PRECISION NOT NULL,
    "roadWidth" DOUBLE PRECISION NOT NULL,
    "fsi" DOUBLE PRECISION NOT NULL,
    "budget" DOUBLE PRECISION NOT NULL,
    "targetCustomer" TEXT NOT NULL,
    "unitMix" TEXT,
    "parkingLayout" TEXT,
    "amenities" TEXT,
    "clubHouse" TEXT,
    "landscape" TEXT,
    "commercialSpace" TEXT,
    "elevationConcept" TEXT,
    "costEstimates" TEXT,
    "saleableArea" DOUBLE PRECISION,
    "svgFloorPlan" TEXT,
    "dxfContent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PropertyPlan_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "PropertyPlan" ADD CONSTRAINT "PropertyPlan_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;
