"""Order confirmation email for Career Lab checkout."""
from __future__ import annotations

import html as html_lib
import os
from datetime import datetime

from ..emailer import send_email
from ..models import PaymentOrder
from .payment_catalog import format_money, get_product


EMAIL_SUBJECT = "Order Confirmation & Next Steps: LXD & ID Career Lab"
FROM_NAME_EMAIL = "HeeRise Academy <admin@heeriseacademy.com>"
ADMIN_EMAIL = "admin@heeriseacademy.com"


def _mail_from() -> str:
    for key in ("MAIL_FROM_INVOICE", "MAIL_FROM_PAYMENTS", "MAIL_FROM_VERIFICATION", "SMTP_FROM"):
        v = os.getenv(key, "").strip()
        if v:
            return v
    return ADMIN_EMAIL


def _survey_url() -> str:
    return os.getenv("PRE_BOOTCAMP_SURVEY_URL", "").strip() or "https://www.heeriseacademy.com/contact/"


def _team_email() -> str:
    return os.getenv("PAYMENTS_NOTIFY_EMAIL", os.getenv("CONTACT_NOTIFY_EMAIL", ADMIN_EMAIL)).strip()


def _date_text(when: datetime | None) -> str:
    dt = when or datetime.utcnow()
    return f"{dt.strftime('%B')} {dt.day}, {dt.year}"


def _first_name(order: PaymentOrder) -> str:
    name = (order.first_name or "").strip()
    if name:
        return name.split()[0]
    local = (order.customer_email or "").split("@")[0]
    token = local.split(".")[0].split("_")[0] if local else "Student"
    return token[:1].upper() + token[1:] if token else "Student"


def confirmation_payload(order: PaymentOrder) -> dict:
    product = get_product(order.product_id) or {}
    paid_at = order.paid_at or order.created_at
    amount = format_money(order.amount_cents, order.currency)
    order_number = order.order_number if str(order.order_number).startswith("#") else f"#{order.order_number}"
    is_bootcamp = product.get("kind", "bootcamp") == "bootcamp"
    program = product.get("program") or "Instructional Design Bootcamp"
    program_detail = product.get("program_detail") or "8 Weeks, Synchronous Online"
    email_program = product.get("email_program") or "LXD & ID Career Lab (8 Weeks)"
    welcome = (
        "Welcome to the LXD & ID Career Lab."
        if is_bootcamp
        else f"Thank you for purchasing {program}."
    )
    return {
        "status": order.status,
        "survey_url": _survey_url(),
        "web_summary": {
            "headline": "Payment Successful!" if order.status == "paid" else "Payment Processing",
            "welcome": welcome,
            "order_number": order_number,
            "date_text": _date_text(paid_at),
            "program": program,
            "program_detail": program_detail,
            "amount_paid": amount,
            "payment_method_display": order.payment_method_display or "",
        },
        "email": {
            "subject": EMAIL_SUBJECT if is_bootcamp else f"Order Confirmation: {program}",
            "first_name": _first_name(order),
            "sent": bool(order.email_sent_at),
            "program": email_program,
        },
    }


def _text_body(order: PaymentOrder, payload: dict) -> str:
    web = payload["web_summary"]
    email = payload["email"]
    survey = payload["survey_url"]
    return (
        f"Hi {email['first_name']},\n\n"
        "Thank you for enrolling! Your payment was successful, and your spot in the "
        "Instructional Design Bootcamp is officially secured. We are thrilled to have you "
        "join HeeRise Academy.\n\n"
        "Below is your receipt and important information regarding your next steps.\n\n"
        "Order Details\n"
        f"Order Number: {web['order_number']}\n"
        f"Date of Purchase: {web['date_text']}\n"
        f"Program: {email['program']}\n"
        f"Total Paid: {web['amount_paid']}\n"
        f"Payment Method: {web['payment_method_display']}\n\n"
        "Your Onboarding Checklist\n\n"
        "1. Complete the Pre-Bootcamp Survey (Action Required)\n"
        "Before we begin, please complete this brief survey to share your experience, "
        "goals, and tech setup needs.\n"
        f"Take the Survey: {survey}\n\n"
        "2. Look out for your Welcome Email\n"
        "Exactly one week before the program starts, we will send you a Welcome Packet. "
        "This will include:\n"
        "· The official Syllabus and schedule\n"
        "· Your tech setup guide\n"
        "· Instructions for joining our WeChat communication group\n"
        "· Your Google Classroom (LMS) login instructions\n\n"
        "3. Mark your calendar for Orientation\n"
        "We will host a Live Orientation Session on the Saturday at 10:00 AM right before "
        "your first official session. We will cover the bootcamp overview and host a live Q&A.\n\n"
        "If you have any immediate questions or emergency concerns, please reach out to us.\n\n"
        "We look forward to seeing you in class!\n\n"
        "Best regards,\n"
        "The HeeRise Academy Team\n"
        f"{ADMIN_EMAIL}\n\n"
        "© 2026 HeeRise Academy · All rights reserved\n"
    )


def _html_body(order: PaymentOrder, payload: dict) -> str:
    web = payload["web_summary"]
    email = payload["email"]
    survey = html_lib.escape(payload["survey_url"])
    first = html_lib.escape(email["first_name"])
    order_number = html_lib.escape(web["order_number"])
    date_text = html_lib.escape(web["date_text"])
    program = html_lib.escape(email["program"])
    amount = html_lib.escape(web["amount_paid"])
    method = html_lib.escape(web["payment_method_display"] or "")
    return f"""\
<!DOCTYPE html>
<html lang="en">
<body style="margin:0;padding:0;background:#f4f6f8;font-family:Inter,Arial,sans-serif;color:#1f2937;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f4f6f8;padding:24px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" width="640" cellspacing="0" cellpadding="0" style="max-width:640px;background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e5e7eb;">
          <tr>
            <td style="background:#011f5b;color:#ffffff;padding:20px 28px;">
              <div style="font-size:18px;font-weight:800;letter-spacing:0.04em;">HeeRise Academy</div>
              <div style="font-size:13px;opacity:0.85;margin-top:4px;">{html_lib.escape(ADMIN_EMAIL)}</div>
            </td>
          </tr>
          <tr>
            <td style="padding:28px;">
              <p style="margin:0 0 16px;">Hi {first},</p>
              <p style="margin:0 0 16px;">Thank you for enrolling! Your payment was successful, and your spot in the Instructional Design Bootcamp is officially secured. We are thrilled to have you join HeeRise Academy.</p>
              <p style="margin:0 0 20px;">Below is your receipt and important information regarding your next steps.</p>
              <h2 style="margin:0 0 12px;font-size:16px;color:#011f5b;">Order Details</h2>
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-bottom:24px;">
                <tr><td style="padding:8px 0;color:#5b6b75;">Order Number</td><td align="right" style="font-weight:700;">{order_number}</td></tr>
                <tr><td style="padding:8px 0;color:#5b6b75;">Date of Purchase</td><td align="right" style="font-weight:700;">{date_text}</td></tr>
                <tr><td style="padding:8px 0;color:#5b6b75;">Program</td><td align="right" style="font-weight:700;">{program}</td></tr>
                <tr><td style="padding:8px 0;color:#5b6b75;">Total Paid</td><td align="right" style="font-weight:700;color:#16a34a;">{amount}</td></tr>
                <tr><td style="padding:8px 0;color:#5b6b75;">Payment Method</td><td align="right" style="font-weight:700;">{method}</td></tr>
              </table>
              <h2 style="margin:0 0 12px;font-size:16px;color:#011f5b;">Your Onboarding Checklist</h2>
              <ol style="margin:0;padding-left:20px;line-height:1.55;">
                <li style="margin-bottom:14px;">
                  <strong>Complete the Pre-Bootcamp Survey (Action Required)</strong>
                  <div>Before we begin, please complete this brief survey to share your experience, goals, and tech setup needs.</div>
                  <div style="margin-top:8px;"><a href="{survey}" style="color:#017aff;font-weight:700;">Take the Survey →</a></div>
                </li>
                <li style="margin-bottom:14px;">
                  <strong>Look out for your Welcome Email</strong>
                  <div>Exactly one week before the program starts, we will send you a Welcome Packet. This will include:</div>
                  <ul style="margin:8px 0 0;padding-left:18px;">
                    <li>The official Syllabus and schedule</li>
                    <li>Your tech setup guide</li>
                    <li>Instructions for joining our WeChat communication group</li>
                    <li>Your Google Classroom (LMS) login instructions</li>
                  </ul>
                </li>
                <li>
                  <strong>Mark your calendar for Orientation</strong>
                  <div>We will host a Live Orientation Session on the Saturday at 10:00 AM right before your first official session. We will cover the bootcamp overview and host a live Q&amp;A.</div>
                </li>
              </ol>
              <p style="margin:24px 0 16px;">If you have any immediate questions or emergency concerns, please reach out to us.</p>
              <p style="margin:0 0 16px;">We look forward to seeing you in class!</p>
              <p style="margin:0;">Best regards,<br/>The HeeRise Academy Team<br/><a href="mailto:{ADMIN_EMAIL}" style="color:#017aff;">{ADMIN_EMAIL}</a></p>
            </td>
          </tr>
          <tr>
            <td style="padding:16px 28px;background:#f9fafb;color:#667085;font-size:12px;">© 2026 HeeRise Academy · All rights reserved</td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
"""


def send_order_confirmation(order: PaymentOrder) -> None:
    payload = confirmation_payload(order)
    subject = payload["email"]["subject"]
    from_addr = _mail_from()
    send_email(
        order.customer_email,
        subject,
        _text_body(order, payload),
        from_email=from_addr,
        reply_to=ADMIN_EMAIL,
        html_body=_html_body(order, payload),
    )


def send_team_payment_notice(order: PaymentOrder) -> None:
    payload = confirmation_payload(order)
    web = payload["web_summary"]
    body = (
        f"New paid enrollment:\n\n"
        f"  Order: {web['order_number']}\n"
        f"  Name: {order.first_name}\n"
        f"  Email: {order.customer_email}\n"
        f"  Product: {order.product_name}\n"
        f"  Amount: {web['amount_paid']}\n"
        f"  Method: {web['payment_method_display']}\n"
        f"  Provider: {order.provider}\n"
    )
    send_email(
        _team_email(),
        f"[HeeRise] Payment received {web['order_number']}",
        body,
        from_email=_mail_from(),
        reply_to=order.customer_email,
    )
