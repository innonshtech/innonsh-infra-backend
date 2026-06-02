import { BookingRepository } from './booking.repository';
import { CreateBookingDTO, UpdateBookingDTO, CreatePaymentPlanDTO } from './booking.dto';

export class BookingService {
  private repository: BookingRepository;

  constructor() {
    this.repository = new BookingRepository();
  }

  async getAllBookings(companyId: string) {
    return this.repository.findAll(companyId);
  }

  async getBookingById(id: string, companyId: string) {
    const booking = await this.repository.findById(id, companyId);
    if (!booking) throw new Error('Booking not found');
    return booking;
  }

  async createBooking(companyId: string, data: CreateBookingDTO) {
    return this.repository.create({ ...data, companyId });
  }

  async updateBooking(id: string, companyId: string, data: UpdateBookingDTO) {
    return this.repository.update(id, companyId, data);
  }

  async deleteBooking(id: string, companyId: string) {
    const booking = await this.getBookingById(id, companyId);
    return this.repository.delete(id, companyId, booking.unitId);
  }

  async cancelBooking(id: string, companyId: string) {
    const booking = await this.getBookingById(id, companyId);
    if (booking.status === 'CANCELLED') throw new Error('Booking is already cancelled');
    
    // Set booking to CANCELLED and Unit back to AVAILABLE
    return this.repository.updateStatus(id, companyId, 'CANCELLED', booking.unitId, 'AVAILABLE');
  }

  async confirmBooking(id: string, companyId: string) {
    const booking = await this.getBookingById(id, companyId);
    if (booking.status !== 'PENDING') throw new Error('Only pending bookings can be confirmed');
    
    // Set booking to CONFIRMED and Unit to SOLD
    return this.repository.updateStatus(id, companyId, 'CONFIRMED', booking.unitId, 'SOLD');
  }

  async getPaymentPlan(id: string, companyId: string) {
    await this.getBookingById(id, companyId);
    return this.repository.getPaymentPlan(id);
  }

  async savePaymentPlan(id: string, companyId: string, items: CreatePaymentPlanDTO) {
    await this.getBookingById(id, companyId);
    
    // Validate total percentage is 100%
    const totalPercentage = items.reduce((sum, item) => sum + item.percentage, 0);
    if (Math.abs(totalPercentage - 100) > 0.01) {
      throw new Error('Total payment plan percentage must equal 100%');
    }

    return this.repository.createPaymentPlan(id, items);
  }
}
