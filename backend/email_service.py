import smtplib
import ssl
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import List, Optional
import os
from datetime import datetime
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class EmailService:
    def __init__(self):
        self.smtp_server = os.getenv("SMTP_SERVER", "smtp.gmail.com")
        self.smtp_port = int(os.getenv("SMTP_PORT", "587"))
        self.sender_email = os.getenv("SENDER_EMAIL", "")
        self.sender_password = os.getenv("SENDER_PASSWORD", "")
        self.sender_name = os.getenv("SENDER_NAME", "نظام سلامتي")
        
    def send_notification_email(
        self, 
        to_email: str, 
        to_name: str,
        title: str, 
        message: str,
        notification_type: str,
        entity_type: Optional[str] = None,
        entity_id: Optional[int] = None
    ) -> bool:
        """
        Send notification email to user
        """
        try:
            # Create message
            msg = MIMEMultipart('alternative')
            msg['From'] = f"{self.sender_name} <{self.sender_email}>"
            msg['To'] = to_email
            msg['Subject'] = f"إشعار من {self.sender_name} - {title}"
            
            # Create HTML content
            html_content = self._create_html_email(
                to_name, title, message, notification_type, entity_type, entity_id
            )
            
            # Create plain text content
            text_content = self._create_text_email(
                to_name, title, message, notification_type, entity_type, entity_id
            )
            
            # Attach parts
            part1 = MIMEText(text_content, 'plain', 'utf-8')
            part2 = MIMEText(html_content, 'html', 'utf-8')
            
            msg.attach(part1)
            msg.attach(part2)
            
            # Send email
            context = ssl.create_default_context()
            with smtplib.SMTP(self.smtp_server, self.smtp_port) as server:
                server.starttls(context=context)
                server.login(self.sender_email, self.sender_password)
                server.send_message(msg)
                
            logger.info(f"Email sent successfully to {to_email}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to send email to {to_email}: {str(e)}")
            return False
    
    def _create_html_email(
        self, 
        to_name: str, 
        title: str, 
        message: str,
        notification_type: str,
        entity_type: Optional[str] = None,
        entity_id: Optional[int] = None
    ) -> str:
        """Create HTML email content"""
        
        # Get notification type in Arabic
        type_ar = self._get_notification_type_arabic(notification_type)
        
        # Get current date in Arabic
        current_date = datetime.now().strftime("%Y/%m/%d %H:%M")
        
        html = f"""
        <!DOCTYPE html>
        <html dir="rtl" lang="ar">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>{title}</title>
            <style>
                body {{
                    font-family: 'IBM Plex Sans Arabic', 'Noto Kufi Arabic', Arial, sans-serif;
                    line-height: 1.6;
                    color: #333;
                    max-width: 600px;
                    margin: 0 auto;
                    padding: 20px;
                    background-color: #f5f5f5;
                }}
                .container {{
                    background-color: white;
                    border-radius: 10px;
                    padding: 30px;
                    box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                }}
                .header {{
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white;
                    padding: 20px;
                    border-radius: 8px;
                    text-align: center;
                    margin-bottom: 30px;
                }}
                .header h1 {{
                    margin: 0;
                    font-size: 24px;
                }}
                .content {{
                    margin-bottom: 30px;
                }}
                .notification-type {{
                    background-color: #e3f2fd;
                    color: #1976d2;
                    padding: 8px 16px;
                    border-radius: 20px;
                    font-size: 14px;
                    display: inline-block;
                    margin-bottom: 20px;
                }}
                .message {{
                    background-color: #f8f9fa;
                    padding: 20px;
                    border-radius: 8px;
                    border-right: 4px solid #667eea;
                    margin: 20px 0;
                }}
                .footer {{
                    text-align: center;
                    color: #666;
                    font-size: 12px;
                    border-top: 1px solid #eee;
                    padding-top: 20px;
                }}
                .button {{
                    display: inline-block;
                    background-color: #667eea;
                    color: white;
                    padding: 12px 24px;
                    text-decoration: none;
                    border-radius: 5px;
                    margin: 20px 0;
                }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>نظام سلامتي</h1>
                    <p>نظام إدارة جولات الجودة وسلامة المرضى</p>
                </div>
                
                <div class="content">
                    <p>عزيزي/عزيزتي <strong>{to_name}</strong>،</p>
                    
                    <div class="notification-type">
                        {type_ar}
                    </div>
                    
                    <h2>{title}</h2>
                    
                    <div class="message">
                        {message}
                    </div>
                    
                    {f'<p><strong>نوع الكيان:</strong> {entity_type}</p>' if entity_type else ''}
                    {f'<p><strong>رقم الكيان:</strong> {entity_id}</p>' if entity_id else ''}
                    
                    <p>يرجى تسجيل الدخول إلى النظام لمراجعة التفاصيل الكاملة.</p>
                    
                    <a href="http://localhost:5174" class="button">تسجيل الدخول إلى النظام</a>
                </div>
                
                <div class="footer">
                    <p>تم إرسال هذا الإشعار في: {current_date}</p>
                    <p>هذا إشعار تلقائي من نظام سلامتي - يرجى عدم الرد على هذا البريد</p>
                </div>
            </div>
        </body>
        </html>
        """
        return html
    
    def _create_text_email(
        self, 
        to_name: str, 
        title: str, 
        message: str,
        notification_type: str,
        entity_type: Optional[str] = None,
        entity_id: Optional[int] = None
    ) -> str:
        """Create plain text email content"""
        
        type_ar = self._get_notification_type_arabic(notification_type)
        current_date = datetime.now().strftime("%Y/%m/%d %H:%M")
        
        text = f"""
نظام سلامتي - إشعار جديد

عزيزي/عزيزتي {to_name}،

نوع الإشعار: {type_ar}
العنوان: {title}

الرسالة:
{message}

{f'نوع الكيان: {entity_type}' if entity_type else ''}
{f'رقم الكيان: {entity_id}' if entity_id else ''}

يرجى تسجيل الدخول إلى النظام لمراجعة التفاصيل الكاملة:
http://localhost:5174

تم إرسال هذا الإشعار في: {current_date}

هذا إشعار تلقائي من نظام سلامتي - يرجى عدم الرد على هذا البريد
        """
        return text.strip()
    
    def _get_notification_type_arabic(self, notification_type: str) -> str:
        """Convert notification type to Arabic"""
        type_mapping = {
            "round_assigned": "تعيين جولة جديدة",
            "round_reminder": "تذكير بجولة",
            "round_deadline": "موعد نهائي للجولة",
            "capa_assigned": "تعيين خطة تصحيحية",
            "capa_deadline": "موعد نهائي للخطة التصحيحية",
            "system_update": "تحديث النظام",
            "general": "إشعار عام"
        }
        return type_mapping.get(notification_type, "إشعار")

# Global email service instance
email_service = EmailService()
