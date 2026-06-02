import { Request, Response } from 'express';
import { companyService } from './company.service';
import { CompanyStatus } from './company.types';

const allowedStatuses = Object.values(CompanyStatus);

export const getCompanies = async (req: Request, res: Response) => {
  try {
    const { status, page = '1', limit = '10' } = req.query;

    // ✅ Validate status
    if (status && !allowedStatuses.includes(status as any)) {
      return res.status(400).json({ message: 'Invalid status value' });
    }

    const companies = await companyService.fetchCompanies(
      status as CompanyStatus,
      Number(page),
      Number(limit)
    );

    res.json(companies);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to fetch companies' });
  }
};

// ✅ Approve
export const approveCompany = async (req: Request, res: Response) => {
  try {
    const idParam = req.params.id;

    // ✅ Ensure it's a string
    if (!idParam || Array.isArray(idParam)) {
      return res.status(400).json({ message: 'Invalid company id' });
    }

    const updated = await companyService.approveCompany(idParam as string);

    res.json({
      message: 'Company approved successfully',
      data: updated,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to approve company' });
  }
};

// ✅ Reject
export const rejectCompany = async (req: Request, res: Response) => {
  try {
    const idParam = req.params.id;

    if (!idParam || Array.isArray(idParam)) {
      return res.status(400).json({ message: 'Invalid company id' });
    }

    const updated = await companyService.rejectCompany(idParam as string);

    res.json({
      message: 'Company rejected successfully',
      data: updated,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to reject company' });
  }
};

// ✅ Update Status
export const updateStatus = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const { status } = req.body;

    if (!allowedStatuses.includes(status as any)) {
      return res.status(400).json({ message: 'Invalid status value' });
    }

    const updatedCompany = await companyService.updateCompanyStatus(id, status);

    if (!updatedCompany) {
      return res.status(404).json({ message: 'Company not found' });
    }

    res.json({ message: 'Company status updated successfully', data: updatedCompany });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to update company status' });
  }
};