import express from 'express';
import nodemailer from 'nodemailer';
import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';
import puppeteer from 'puppeteer';
import path from 'path';
import fs from 'fs';
import { TransactionModel, NOAModel } from '../models/schemas';
import { broadcastNotification } from '../index';

const router = express.Router();

// Email configuration (configure with your SMTP settings)
const createEmailTransporter = () => {
  return nodemailer.createTransport({
    // For development - use your preferred email service
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: false,
    auth: {
      user: process.env.SMTP_USER || 'your-email@example.com',
      pass: process.env.SMTP_PASS || 'your-app-password'
    }
  });
};

// Generate secure token for NOA
const generateNOAToken = (): string => {
  return crypto.randomBytes(32).toString('hex');
};

// Create and send NOA email
router.post('/send', async (req, res) => {
  try {
    const { transactionId, buyerEmail } = req.body;

    if (!transactionId || !buyerEmail) {
      return res.status(400).json({
        success: false,
        message: 'Transaction ID and buyer email are required'
      });
    }

    // Find the transaction
    const transaction = await TransactionModel.findOne({ transactionId });
    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found'
      });
    }

    // Generate NOA token and data
    const noaId = uuidv4();
    const token = generateNOAToken();
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 72); // 72 hour expiry

    // Create new NOA document
    const newNOA = new NOAModel({
      noaId: token,
      transactionId,
      buyerEmail,
      supplierId: transaction.supplierId,
      supplierName: transaction.supplierName,
      buyerId: transaction.buyerId,
      buyerName: transaction.buyerName,
      invoiceNumber: transaction.invoiceNumber,
      invoiceDate: transaction.invoiceDate,
      invoiceValue: transaction.invoiceValue,
      advanceAmount: transaction.advanceAmount,
      feeAmount: transaction.feeAmount,
      netAmount: transaction.netAmount,
      dueDate: transaction.dueDate || '',
      status: 'sent',
      emailSent: false,
      accessCount: 0
    });

    // Save NOA to MongoDB
    const savedNOA = await newNOA.save();

    // Update transaction status
    transaction.noaStatus = 'sent';
    transaction.noaSentAt = new Date();
    transaction.noaToken = token;

    // Create email content
    const referenceNumber = `REF-${transaction.transactionId}-${Date.now().toString().slice(-6)}`;
    const noaUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/noa/${token}`;
    
    const emailSubject = `Invoice Verification Required – ${referenceNumber}`;
    const emailBody = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <style>
        body { font-family: Georgia, serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { border-bottom: 2px solid #333; padding-bottom: 20px; margin-bottom: 30px; }
        .content { margin-bottom: 30px; }
        .cta-button { background-color: #2c3e50; color: white; padding: 15px 30px; text-decoration: none; display: inline-block; margin: 20px 0; border-radius: 5px; font-weight: bold; }
        .footer { border-top: 1px solid #ccc; padding-top: 20px; font-size: 12px; color: #666; }
        .highlight { background-color: #f8f9fa; padding: 15px; border-left: 4px solid #2c3e50; margin: 20px 0; }
    </style>
</head>
<body>
    <div class="header">
        <h1 style="margin: 0; font-size: 24px;">Invoice Verification Letter</h1>
        <p style="margin: 5px 0 0 0; color: #666;">Reference: ${referenceNumber}</p>
    </div>
    
    <div class="content">
        <p>Dear ${transaction.buyerName},</p>
        
        <p>We are writing to inform you that we have entered into a receivables financing arrangement with <strong>${transaction.supplierName}</strong> and have purchased the invoice detailed below.</p>
        
        <div class="highlight">
            <strong>Invoice Details:</strong><br>
            Invoice Number: ${transaction.invoiceNumber}<br>
            Invoice Date: ${new Date(transaction.invoiceDate).toLocaleDateString()}<br>
            Amount: ${transaction.currency} ${transaction.invoiceValue.toLocaleString()}<br>
            Due Date: ${transaction.dueDate ? new Date(transaction.dueDate).toLocaleDateString() : 'Not specified'}
        </div>
        
        <p>Under our agreement, we require your confirmation that the goods or services covered by this invoice have been delivered and are satisfactory, and that payment will be made directly to us on the due date.</p>
        
        <p>Please review the attached Invoice Verification Letter and provide your digital confirmation by clicking the button below:</p>
        
        <a href="${noaUrl}" class="cta-button">Review & Sign Invoice Verification</a>
        
        <p><strong>Important:</strong> This verification link is valid for 72 hours and expires on ${expiresAt.toLocaleDateString()} at ${expiresAt.toLocaleTimeString()}.</p>
        
        <p>If you have any queries regarding this matter, please contact us at finance@whizunik.com.</p>
        
        <p>Yours faithfully,<br>
        <strong>Whizunik Finance Team</strong><br>
        Trade Finance Department</p>
    </div>
    
    <div class="footer">
        <p><strong>Legal Disclaimer:</strong> This communication is confidential and may contain legally privileged information. If you are not the intended recipient, please notify us immediately and delete this message. This notice constitutes formal notification under our receivables financing agreement.</p>
        
        <p><strong>Whizunik Financial Services</strong><br>
        Email: finance@whizunik.com | Phone: +44 (0)20 7000 0000<br>
        Registered in England and Wales. Company No. 12345678</p>
    </div>
</body>
</html>
    `;

    // Send email
    const transporter = createEmailTransporter();
    
    try {
      await transporter.sendMail({
        from: `"Whizunik Finance" <${process.env.SMTP_USER || 'finance@whizunik.com'}>`,
        to: buyerEmail,
        subject: emailSubject,
        html: emailBody
      });

      // Update NOA to mark email as sent
      savedNOA.emailSent = true;
      savedNOA.emailSentAt = new Date();
      await savedNOA.save();

      console.log(`NOA email sent successfully to ${buyerEmail} for transaction ${transactionId}`);
    } catch (emailError) {
      console.error('Email send error:', emailError);
      // Continue with success response even if email fails in development
      console.log('Email sending failed, but NOA data saved. URL:', noaUrl);
    }

    res.json({
      success: true,
      message: 'NOA sent successfully',
      data: {
        noaId: savedNOA.noaId,
        token,
        expiresAt,
        noaUrl: noaUrl, // Include URL in response for development
        referenceNumber
      }
    });

  } catch (error) {
    console.error('Send NOA error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get NOA data by token (for webpage display)
router.get('/:token', async (req, res) => {
  try {
    const { token } = req.params;
    const noaData = await NOAModel.findOne({ noaId: token });

    if (!noaData) {
      return res.status(404).json({
        success: false,
        message: 'NOA not found or invalid token'
      });
    }

    // Check if expired
    if (noaData.expiresAt && new Date() > noaData.expiresAt) {
      return res.status(410).json({
        success: false,
        message: 'NOA has expired'
      });
    }

    // Check if expired (72 hours from creation)
    const expiryDate = new Date(noaData.createdAt);
    expiryDate.setHours(expiryDate.getHours() + 72);
    
    if (new Date() > expiryDate) {
      return res.status(410).json({
        success: false,
        message: 'NOA has expired'
      });
    }

    // Update access tracking
    noaData.accessCount += 1;
    noaData.lastAccessedAt = new Date();
    
    // Update status to delivered if first time
    if (noaData.status === 'sent') {
      noaData.status = 'delivered';
    }
    
    await noaData.save();

    // Get transaction details
    const transaction = await TransactionModel.findOne({ transactionId: noaData.transactionId });

    res.json({
      success: true,
      data: {
        noaData,
        transaction,
        canSign: noaData.status !== 'acknowledged'
      }
    });

  } catch (error) {
    console.error('Get NOA error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Submit digital signature
router.post('/:token/sign', async (req, res) => {
  try {
    const { token } = req.params;
    const { fullName, position, signatureDataUrl } = req.body;
    const ipAddress = req.ip || req.connection.remoteAddress || 'unknown';
    const userAgent = req.get('User-Agent') || 'unknown';

    const noaData = await NOAModel.findOne({ noaId: token });

    if (!noaData) {
      return res.status(404).json({
        success: false,
        message: 'NOA not found or invalid token'
      });
    }

    // Check if already acknowledged
    if (noaData.status === 'acknowledged') {
      return res.status(400).json({
        success: false,
        message: 'NOA has already been acknowledged'
      });
    }

    // Update NOA status to acknowledged
    noaData.status = 'acknowledged';
    await noaData.save();

    // Update transaction NOA status to signed and create supplier payment obligation
    const transaction = await TransactionModel.findOne({ transactionId: noaData.transactionId });
    if (transaction) {
      console.log('🔄 Before update:', {
        transactionId: transaction.transactionId,
        supplierId: transaction.supplierId,
        supplierName: transaction.supplierName,
        status: transaction.status,
        paymentDue: transaction.paymentDue,
        payoutStatus: transaction.payoutStatus,
        advanceAmount: transaction.advanceAmount
      });
      
      transaction.noaStatus = 'signed';
      transaction.status = 'approved'; // Update main transaction status
      transaction.paymentDue = true; // Mark that supplier payment is now due
      transaction.approvedAt = new Date();
      await transaction.save();
      
      console.log('✅ After update:', {
        transactionId: transaction.transactionId,
        supplierId: transaction.supplierId,
        supplierName: transaction.supplierName,
        noaStatus: transaction.noaStatus,
        status: transaction.status,
        paymentDue: transaction.paymentDue,
        payoutStatus: transaction.payoutStatus,
        advanceAmount: transaction.advanceAmount,
        approvedAt: transaction.approvedAt
      });
      
      // Broadcast notification about payment obligation
      broadcastNotification({
        type: 'payment_due',
        title: 'Supplier Payment Due',
        message: `Advance payment of $${transaction.advanceAmount} is due to ${transaction.supplierName}`,
        timestamp: new Date(),
        priority: 'high'
      });
    } else {
      console.error('❌ Transaction not found for NOA:', noaData.transactionId);
    }

    res.json({
      success: true,
      message: 'NOA acknowledged successfully',
      data: {
        noaId: noaData.noaId,
        status: noaData.status, 
        acknowledgedAt: noaData.updatedAt,
        acknowledgedBy: fullName
      }
    });

  } catch (error) {
    console.error('Sign NOA error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Generate and download signed NOA PDF
router.get('/:token/pdf', async (req, res) => {
  try {
    const { token } = req.params;
    const noaData = await NOAModel.findOne({ noaId: token });

    if (!noaData) {
      return res.status(404).json({
        success: false,
        message: 'NOA not found or invalid token'
      });
    }

    if (noaData.status !== 'acknowledged') {
      return res.status(400).json({
        success: false,
        message: 'NOA must be acknowledged before generating PDF'
      });
    }

    const transaction = await TransactionModel.findOne({ transactionId: noaData.transactionId });
    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found'
      });
    }

    // Generate PDF HTML content
    const pdfHtml = generateSignedNOAPDFHtml(noaData, transaction);

    // Generate PDF using Puppeteer
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();
    await page.setContent(pdfHtml, { waitUntil: 'networkidle0' });
    
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '20mm',
        right: '15mm',
        bottom: '20mm',
        left: '15mm'
      }
    });

    await browser.close();

    // Set headers for PDF download
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="NOA-${transaction.transactionId}-signed.pdf"`);
    
    res.send(pdfBuffer);

  } catch (error) {
    console.error('Generate PDF error:', error);
    res.status(500).json({
      success: false,
      message: 'Error generating PDF'
    });
  }
});

// Get NOA status for transaction
router.get('/status/:transactionId', async (req, res) => {
  try {
    const { transactionId } = req.params;
    
    const transaction = await TransactionModel.findOne({ transactionId });
    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found'
      });
    }

    // Find NOA data
    const noaData = await NOAModel.findOne({ transactionId });

    res.json({
      success: true,
      data: {
        transactionId,
        noaStatus: noaData ? noaData.status : 'not-sent',
        noaSentAt: noaData?.emailSentAt,
        noaViewedAt: noaData?.lastAccessedAt,
        noaSignedAt: noaData?.updatedAt
      }
    });

  } catch (error) {
    console.error('Get NOA status error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Helper function to generate signed NOA PDF HTML
function generateSignedNOAPDFHtml(noaData: any, transaction: any): string {
  const signedDate = noaData.signedAt?.toLocaleDateString() || '';
  const signedTime = noaData.signedAt?.toLocaleTimeString() || '';
  const referenceNumber = `REF-${transaction.transactionId}-${Date.now().toString().slice(-6)}`;
  
  return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <style>
        @page { margin: 20mm 15mm; }
        body { font-family: Georgia, serif; line-height: 1.6; color: #333; font-size: 12pt; }
        .header-section { display: flex; justify-content: space-between; border-bottom: 2px solid #333; padding-bottom: 20px; margin-bottom: 30px; }
        .header-left, .header-right { width: 48%; }
        .title { text-align: center; font-size: 18pt; font-weight: bold; text-transform: uppercase; margin: 30px 0; }
        .invoice-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        .invoice-table th, .invoice-table td { border: 1px solid #333; padding: 10px; text-align: left; }
        .invoice-table th { background-color: #f5f5f5; font-weight: bold; }
        .bank-details { border: 2px solid #333; padding: 15px; margin: 20px 0; }
        .signature-section { display: flex; justify-content: space-between; margin-top: 40px; }
        .signature-left, .signature-right { width: 48%; }
        .signature-box { border: 1px solid #333; height: 100px; margin: 10px 0; position: relative; }
        .signature-image { max-width: 100%; max-height: 90px; }
        .signed-indicator { background-color: #e8f5e8; border: 2px solid #4CAF50; padding: 10px; text-align: center; color: #2e7d32; font-weight: bold; margin-top: 20px; }
        .legal-text { font-size: 11pt; margin: 15px 0; text-align: justify; }
        .watermark { position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%) rotate(-45deg); font-size: 72pt; color: rgba(0,0,0,0.05); z-index: -1; }
    </style>
</head>
<body>
    <div class="watermark">DIGITALLY SIGNED</div>
    
    <div class="header-section">
        <div class="header-left">
            <strong>${transaction.buyerName}</strong><br>
            [Buyer Address Line 1]<br>
            [Buyer Address Line 2]<br>
            [Buyer Address Line 3]
        </div>
        <div class="header-right">
            <strong>Your Supplier:</strong><br>
            ${transaction.supplierName}<br>
            [Supplier Address Line 1]<br>
            [Supplier Address Line 2]
        </div>
    </div>
    
    <p><strong>Date:</strong> ${new Date().toLocaleDateString()}</p>
    <p><strong>Our Reference:</strong> ${referenceNumber}</p>
    <p><strong>Invoice Verification Letter No.:</strong> IVL-${transaction.transactionId}</p>
    
    <div class="title">Invoice Verification Letter</div>
    
    <p class="legal-text">We are writing to inform you that we have entered into a receivables financing agreement with the above-named supplier and have purchased the receivables relating to the invoice(s) detailed below.</p>
    
    <table class="invoice-table">
        <thead>
            <tr>
                <th>Invoice Number</th>
                <th>Issue Date</th>
                <th>Due Date</th>
                <th>Invoice Amount</th>
            </tr>
        </thead>
        <tbody>
            <tr>
                <td>${transaction.invoiceNumber}</td>
                <td>${new Date(transaction.invoiceDate).toLocaleDateString()}</td>
                <td>${new Date(transaction.dueDate).toLocaleDateString()}</td>
                <td>${transaction.currency} ${parseFloat(transaction.invoiceAmount).toLocaleString()}</td>
            </tr>
        </tbody>
    </table>
    
    <p class="legal-text">By signing this letter, you confirm that:</p>
    <ol class="legal-text">
        <li>You acknowledge our notification of the purchase of the above receivables;</li>
        <li>The goods and/or services represented by the invoice have been delivered and conform to your requirements;</li>
        <li>There is no consignment, retention of title, or similar arrangement affecting these goods;</li>
        <li>You will pay the invoice amount in full without any deduction, set-off, or counterclaim;</li>
        <li>Payment will be made directly to the bank account detailed below;</li>
        <li>You confirm compliance with all applicable anti-bribery and corruption laws.</li>
    </ol>
    
    <div class="bank-details">
        <strong>Payment Details:</strong><br>
        Account Name: Whizunik Financial Services Ltd<br>
        Bank: Barclays Bank PLC<br>
        Account Number: 12345678<br>
        Sort Code: 20-00-00<br>
        IBAN: GB29 BARC 2000 0012 3456 78<br>
        SWIFT: BARCGB22
    </div>
    
    <p class="legal-text">This agreement shall be governed by English law and subject to the exclusive jurisdiction of the English courts. Any disputes arising may be referred to arbitration under the LCIA Rules, conducted in London in the English language.</p>
    
    <div class="signature-section">
        <div class="signature-left">
            <p><strong>Yours faithfully,</strong></p>
            <div class="signature-box"></div>
            <p>Whizunik Finance Team<br>Authorized Signatory</p>
        </div>
        <div class="signature-right">
            <p><strong>Acknowledged and agreed:</strong></p>
            <div class="signature-box">
                ${noaData.signatoryData?.signatureDataUrl ? `<img src="${noaData.signatoryData.signatureDataUrl}" class="signature-image" alt="Digital Signature">` : ''}
            </div>
            <p><strong>Name:</strong> ${noaData.signatoryData?.fullName || ''}<br>
            <strong>Position:</strong> ${noaData.signatoryData?.position || ''}<br>
            <strong>Date:</strong> ${signedDate}</p>
        </div>
    </div>
    
    <div class="signed-indicator">
        ✓ DIGITALLY SIGNED AND EXECUTED<br>
        Signed on ${signedDate} at ${signedTime}<br>
        IP Address: ${noaData.signatoryData?.ipAddress}<br>
        Document Hash: ${noaData.token.substring(0, 16)}...
    </div>
</body>
</html>
  `;
}

export default router;