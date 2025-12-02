"""
Email Notification Service

Sends transactional emails using Resend API.
"""

import os
import logging
from typing import Optional, Dict, Any
import resend

logger = logging.getLogger(__name__)

# Initialize Resend
resend.api_key = os.getenv("RESEND_API_KEY", "")


class EmailService:
    """Service for sending transactional emails"""

    FROM_EMAIL = os.getenv("FROM_EMAIL", "SlabStak <noreply@slabstak.com>")
    APP_URL = os.getenv("APP_URL", "https://slabstak.com")

    @staticmethod
    async def send_email(
        to: str,
        subject: str,
        html: str,
        text: Optional[str] = None,
    ) -> bool:
        """
        Send an email using Resend

        Args:
            to: Recipient email address
            subject: Email subject
            html: HTML body
            text: Plain text body (optional)

        Returns:
            True if successful, False otherwise
        """
        if not resend.api_key:
            logger.warning("RESEND_API_KEY not configured - email not sent")
            return False

        try:
            params = {
                "from": EmailService.FROM_EMAIL,
                "to": [to],
                "subject": subject,
                "html": html,
            }

            if text:
                params["text"] = text

            response = resend.Emails.send(params)
            logger.info(f"Email sent successfully to {to}: {response}")
            return True

        except Exception as e:
            logger.error(f"Failed to send email to {to}: {e}")
            return False

    @staticmethod
    async def send_welcome_email(to: str, user_name: Optional[str] = None) -> bool:
        """Send welcome email to new user"""
        name = user_name or "there"

        subject = "Welcome to SlabStak!"
        html = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
                body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }}
                .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                .header {{ background: linear-gradient(135deg, #0ea5e9 0%, #6366f1 100%); padding: 40px 20px; text-align: center; border-radius: 8px 8px 0 0; }}
                .header h1 {{ color: white; margin: 0; font-size: 28px; }}
                .content {{ background: #fff; padding: 40px; border: 1px solid #e2e8f0; border-top: none; }}
                .button {{ display: inline-block; padding: 12px 24px; background: #0ea5e9; color: white; text-decoration: none; border-radius: 6px; margin: 20px 0; }}
                .footer {{ text-align: center; padding: 20px; color: #64748b; font-size: 14px; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>Welcome to SlabStak!</h1>
                </div>
                <div class="content">
                    <p>Hi {name},</p>

                    <p>Thanks for joining SlabStak - the AI-powered sports card intelligence platform!</p>

                    <p>Here's what you can do now:</p>
                    <ul>
                        <li><strong>Scan cards</strong> - Upload photos and get instant AI grading and valuation</li>
                        <li><strong>Build your vault</strong> - Organize and track your collection</li>
                        <li><strong>Generate listings</strong> - Create optimized listings for eBay, PWCC, and more</li>
                        <li><strong>Track shows</strong> - Manage dealer show inventory and P&L</li>
                    </ul>

                    <p style="text-align: center;">
                        <a href="{EmailService.APP_URL}/scan" class="button">Scan Your First Card</a>
                    </p>

                    <p>Free users can save up to 10 cards. Upgrade to Pro for unlimited storage, advanced analytics, and priority support.</p>

                    <p>Questions? Just reply to this email - we're here to help!</p>

                    <p>Best,<br>The SlabStak Team</p>
                </div>
                <div class="footer">
                    <p>&copy; 2024 SlabStak. All rights reserved.</p>
                    <p><a href="{EmailService.APP_URL}" style="color: #0ea5e9; text-decoration: none;">Visit SlabStak</a></p>
                </div>
            </div>
        </body>
        </html>
        """

        text = f"""
        Welcome to SlabStak!

        Hi {name},

        Thanks for joining SlabStak - the AI-powered sports card intelligence platform!

        Here's what you can do now:
        - Scan cards - Upload photos and get instant AI grading and valuation
        - Build your vault - Organize and track your collection
        - Generate listings - Create optimized listings for eBay, PWCC, and more
        - Track shows - Manage dealer show inventory and P&L

        Get started: {EmailService.APP_URL}/scan

        Free users can save up to 10 cards. Upgrade to Pro for unlimited storage, advanced analytics, and priority support.

        Questions? Just reply to this email - we're here to help!

        Best,
        The SlabStak Team
        """

        return await EmailService.send_email(to, subject, html, text)

    @staticmethod
    async def send_subscription_confirmation(
        to: str,
        plan: str,
        amount: float,
    ) -> bool:
        """Send subscription confirmation email"""
        subject = f"SlabStak Pro Subscription Confirmed"

        html = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
                body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }}
                .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                .header {{ background: linear-gradient(135deg, #10b981 0%, #3b82f6 100%); padding: 40px 20px; text-align: center; border-radius: 8px 8px 0 0; }}
                .header h1 {{ color: white; margin: 0; font-size: 28px; }}
                .content {{ background: #fff; padding: 40px; border: 1px solid #e2e8f0; border-top: none; }}
                .plan-box {{ background: #f0fdf4; border: 2px solid #10b981; padding: 20px; border-radius: 8px; margin: 20px 0; }}
                .footer {{ text-align: center; padding: 20px; color: #64748b; font-size: 14px; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>🎉 You're now Pro!</h1>
                </div>
                <div class="content">
                    <p>Your SlabStak Pro subscription is now active!</p>

                    <div class="plan-box">
                        <h3 style="margin-top: 0; color: #10b981;">SlabStak Pro - {plan.title()}</h3>
                        <p style="font-size: 24px; font-weight: bold; margin: 10px 0;">${amount:.2f}/{plan}</p>
                    </div>

                    <p><strong>Your Pro benefits:</strong></p>
                    <ul>
                        <li>✅ Unlimited card vault storage</li>
                        <li>✅ AI-powered listing generator for all platforms</li>
                        <li>✅ Advanced dealer show tracking</li>
                        <li>✅ CSV import/export</li>
                        <li>✅ Priority email support</li>
                        <li>✅ Early access to new features</li>
                    </ul>

                    <p>Your subscription will automatically renew. You can manage your subscription anytime in your account settings.</p>

                    <p>Thanks for supporting SlabStak!</p>

                    <p>Best,<br>The SlabStak Team</p>
                </div>
                <div class="footer">
                    <p>&copy; 2024 SlabStak. All rights reserved.</p>
                    <p><a href="{EmailService.APP_URL}/account" style="color: #0ea5e9; text-decoration: none;">Manage Subscription</a></p>
                </div>
            </div>
        </body>
        </html>
        """

        return await EmailService.send_email(to, subject, html)

    @staticmethod
    async def send_card_scan_summary(
        to: str,
        card_count: int,
        total_value: float,
    ) -> bool:
        """Send weekly card scan summary"""
        subject = f"Your Weekly SlabStak Summary - {card_count} Cards Scanned"

        html = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
                body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }}
                .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                .header {{ background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); padding: 40px 20px; text-align: center; border-radius: 8px 8px 0 0; }}
                .header h1 {{ color: white; margin: 0; font-size: 28px; }}
                .content {{ background: #fff; padding: 40px; border: 1px solid #e2e8f0; border-top: none; }}
                .stat-box {{ background: #f8fafc; padding: 20px; border-radius: 8px; margin: 15px 0; text-align: center; }}
                .stat-box h3 {{ margin: 0; color: #64748b; font-size: 14px; text-transform: uppercase; }}
                .stat-box p {{ margin: 10px 0 0; font-size: 32px; font-weight: bold; color: #0ea5e9; }}
                .footer {{ text-align: center; padding: 20px; color: #64748b; font-size: 14px; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>Your Weekly Summary</h1>
                </div>
                <div class="content">
                    <p>Here's your SlabStak activity for this week:</p>

                    <div class="stat-box">
                        <h3>Cards Scanned</h3>
                        <p>{card_count}</p>
                    </div>

                    <div class="stat-box">
                        <h3>Total Estimated Value</h3>
                        <p>${total_value:,.2f}</p>
                    </div>

                    <p>Keep building your collection and tracking your portfolio value!</p>

                    <p style="text-align: center; margin: 30px 0;">
                        <a href="{EmailService.APP_URL}/vault" style="display: inline-block; padding: 12px 24px; background: #0ea5e9; color: white; text-decoration: none; border-radius: 6px;">View Your Vault</a>
                    </p>

                    <p>Best,<br>The SlabStak Team</p>
                </div>
                <div class="footer">
                    <p>&copy; 2024 SlabStak. All rights reserved.</p>
                </div>
            </div>
        </body>
        </html>
        """

        return await EmailService.send_email(to, subject, html)


# Global instance
email_service = EmailService()
