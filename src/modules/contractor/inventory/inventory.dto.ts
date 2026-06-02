import { z } from 'zod';

// Inventory Item Schemas
export const createInventoryItemSchema = z.object({
  name: z.string().min(2),
  sku: z.string().optional(),
  description: z.string().optional(),
  unit: z.string().min(1),
  category: z.string().optional(),
  minStock: z.number().optional().default(0),
});

export const updateInventoryItemSchema = z.object({
  name: z.string().min(2).optional(),
  sku: z.string().optional(),
  description: z.string().optional(),
  unit: z.string().min(1).optional(),
  category: z.string().optional(),
  minStock: z.number().optional(),
});

// Warehouse Schemas
export const createWarehouseSchema = z.object({
  name: z.string().min(2),
  location: z.string().optional(),
});

// Stock Movement Schemas
export const stockMovementSchema = z.object({
  inventoryItemId: z.string().uuid(),
  warehouseId: z.string().uuid(),
  quantity: z.number(), // Use positive for ADD, negative for REMOVE
  type: z.enum(['IN', 'OUT', 'TRANSFER']),
  reference: z.string().optional(),
  notes: z.string().optional(),
  projectId: z.string().uuid().optional(),
});

export type CreateInventoryItemDTO = z.infer<typeof createInventoryItemSchema>;
export type UpdateInventoryItemDTO = z.infer<typeof updateInventoryItemSchema>;
export type CreateWarehouseDTO = z.infer<typeof createWarehouseSchema>;
export type StockMovementDTO = z.infer<typeof stockMovementSchema>;
