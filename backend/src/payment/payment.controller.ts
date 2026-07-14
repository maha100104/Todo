import { Controller, Post, Body, UseGuards, BadRequestException } from '@nestjs/common';
import { JwtAuthGuard } from '../guard/jwt-auth-guard';

interface PaymentBody {
  method: 'credit' | 'debit' | 'upi';
  amount: number;
  // Card fields
  cardNumber?: string;
  cardName?: string;
  cardExpiry?: string;
  cardCvv?: string;
  // UPI field
  upiId?: string;
}

@Controller('payment')
@UseGuards(JwtAuthGuard)
export class PaymentController {

  @Post('process')
  async processPayment(@Body() body: PaymentBody) {
    const { method, amount, cardNumber, cardName, cardExpiry, cardCvv, upiId } = body;

    if (!method || !amount) {
      throw new BadRequestException('Payment method and amount are required.');
    }

    // Validate based on method
    if (method === 'credit' || method === 'debit') {
      if (!cardNumber || !cardName || !cardExpiry || !cardCvv) {
        throw new BadRequestException('Card number, cardholder name, expiry, and CVV are required.');
      }
      const cleanCard = cardNumber.replace(/\s/g, '');
      if (cleanCard.length !== 16) {
        throw new BadRequestException('Card number must be 16 digits.');
      }
      if (cardCvv.length !== 3) {
        throw new BadRequestException('CVV must be 3 digits.');
      }
      if (!/^\d{2}\/\d{2}$/.test(cardExpiry)) {
        throw new BadRequestException('Expiry must be in MM/YY format.');
      }
    } else if (method === 'upi') {
      if (!upiId || !upiId.includes('@')) {
        throw new BadRequestException('A valid UPI ID is required (e.g. name@upi).');
      }
    }

    // Simulate payment processing
    const txnId = `TXN${Date.now()}`;

    return {
      success: true,
      message: 'Payment processed successfully!',
      transactionId: txnId,
      amount,
      method,
      timestamp: new Date().toISOString(),
    };
  }
}
