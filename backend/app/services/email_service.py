import logging

import httpx

from app.config import settings

logger = logging.getLogger(__name__)

RESEND_API_URL = "https://api.resend.com/emails"


async def _send_email(to_email: str, subject: str, html_body: str) -> None:
    if not settings.RESEND_API_KEY:
        logger.warning(f"RESEND_API_KEY not set. Skipping email to {to_email}: {subject}")
        return
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.post(
                RESEND_API_URL,
                headers={"Authorization": f"Bearer {settings.RESEND_API_KEY}", "Content-Type": "application/json"},
                json={"from": settings.FROM_EMAIL, "to": [to_email], "subject": subject, "html": html_body},
            )
            if response.status_code in (200, 201):
                logger.info(f"Email sent to {to_email}: {subject}")
            else:
                logger.error(f"Email API error {response.status_code}: {response.text}")
    except Exception as e:
        logger.error(f"Failed to send email to {to_email}: {e}")


def _wrap_html(body: str) -> str:
    return f'<div style="font-family:Inter,sans-serif;max-width:600px;margin:0 auto;padding:20px;">{body}</div>'


async def send_verification_email(to_email: str, name: str, token: str) -> None:
    url = f"{settings.FRONTEND_URL}/verify-email/{token}"
    html = _wrap_html(f'<h2 style="color:#3B82F6;">Welcome to CCMS, {name}!</h2><p>Verify your email:</p><a href="{url}" style="display:inline-block;background:#3B82F6;color:white;padding:12px 24px;text-decoration:none;border-radius:8px;">Verify Email</a><p style="color:#94A3B8;font-size:12px;">Expires in 24 hours.</p>')
    await _send_email(to_email, "Verify your CCMS account", html)


async def send_status_change_email(to_email: str, name: str, ref_no: str, new_status: str) -> None:
    html = _wrap_html(f'<h2 style="color:#3B82F6;">Complaint Status Updated</h2><p>Hi {name}, complaint <strong>{ref_no}</strong> status: <strong style="color:#10B981;">{new_status}</strong></p>')
    await _send_email(to_email, f"Complaint {ref_no} — Status: {new_status}", html)


async def send_sla_warning_email(to_email: str, name: str, ref_no: str, hours_remaining: float) -> None:
    html = _wrap_html(f'<h2 style="color:#F59E0B;">⚠️ SLA Warning</h2><p>Hi {name}, complaint <strong>{ref_no}</strong> has <strong style="color:#F59E0B;">{hours_remaining:.1f}h</strong> remaining.</p>')
    await _send_email(to_email, f"SLA Warning: Complaint {ref_no}", html)


async def send_escalation_email(to_email: str, name: str, ref_no: str) -> None:
    html = _wrap_html(f'<h2 style="color:#EF4444;">🚨 Complaint Escalated</h2><p>Hi {name}, complaint <strong>{ref_no}</strong> has breached SLA and been escalated.</p>')
    await _send_email(to_email, f"ESCALATED: Complaint {ref_no}", html)


async def send_password_reset_email(to_email: str, name: str, token: str) -> None:
    url = f"{settings.FRONTEND_URL}/reset-password?token={token}"
    html = _wrap_html(f'<h2 style="color:#3B82F6;">Password Reset</h2><p>Hi {name},</p><a href="{url}" style="display:inline-block;background:#3B82F6;color:white;padding:12px 24px;text-decoration:none;border-radius:8px;">Reset Password</a><p style="color:#94A3B8;font-size:12px;">Expires in 1 hour.</p>')
    await _send_email(to_email, "CCMS — Password Reset", html)
