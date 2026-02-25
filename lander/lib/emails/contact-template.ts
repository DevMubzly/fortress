export const ContactEmailTemplate = (data: {
  name: string;
  organization: string;
  role: string;
  sector: string;
  budget: string;
}) => `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; color: #333; line-height: 1.6; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { text-align: center; margin-bottom: 30px; }
    .logo { font-size: 24px; font-weight: bold; color: #000; text-decoration: none; }
    .content { background-color: #f9fafb; padding: 30px; border-radius: 8px; }
    .details { background-color: #fff; padding: 15px; border-radius: 6px; margin: 20px 0; border: 1px solid #e5e7eb; }
    .detail-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #f3f4f6; }
    .detail-row:last-child { border-bottom: none; }
    .label { font-weight: 600; color: #6b7280; }
    .value { font-weight: 500; }
    .footer { text-align: center; margin-top: 30px; font-size: 12px; color: #9ca3af; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">Fortress</div>
    </div>
    
    <div class="content">
      <h2>Response Received</h2>
      <p>Hi ${data.name},</p>
      
      <p>Thank you for getting in touch with the Fortress team. We have received your inquiry and will review the details shortly.</p>
      
      <div class="details">
        <div class="detail-row">
          <span class="label">Organization</span>
          <span class="value">${data.organization}</span>
        </div>
        <div class="detail-row">
          <span class="label">Role</span>
          <span class="value">${data.role}</span>
        </div>
        <div class="detail-row">
          <span class="label">Sector</span>
          <span class="value">${data.sector}</span>
        </div>
        <div class="detail-row">
          <span class="label">Budget</span>
          <span class="value">${data.budget}</span>
        </div>
      </div>
      
      <p>We typically respond within 24-48 business hours.</p>
      
      <p>Best regards,<br>The Fortress Team</p>
    </div>
    
    <div class="footer">
      &copy; ${new Date().getFullYear()} Fortress. All rights reserved.
    </div>
  </div>
</body>
</html>
`;
