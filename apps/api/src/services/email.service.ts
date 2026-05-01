import { Resend } from 'resend';
import { env } from '../config/env';

const resend = new Resend(env.RESEND_API_KEY);

export async function sendInvitationEmail(
  to: string,
  workspaceName: string,
  inviteLink: string
): Promise<void> {
  await resend.emails.send({
    from: env.EMAIL_FROM,
    to,
    subject: `You've been invited to join ${workspaceName} on WorkNest`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>You're invited to join <strong>${workspaceName}</strong></h2>
        <p>You've been invited to collaborate on WorkNest. Click the button below to accept your invitation.</p>
        <a href="${inviteLink}" style="
          display: inline-block;
          background: #6366f1;
          color: white;
          padding: 12px 24px;
          border-radius: 8px;
          text-decoration: none;
          font-weight: 600;
          margin: 16px 0;
        ">Accept Invitation</a>
        <p style="color: #6b7280; font-size: 14px;">This invitation expires in 48 hours. If you didn't expect this email, you can safely ignore it.</p>
      </div>
    `,
  });
}

export async function sendMentionNotificationEmail(
  to: string,
  mentionedBy: string,
  context: string,
  link: string
): Promise<void> {
  await resend.emails.send({
    from: env.EMAIL_FROM,
    to,
    subject: `${mentionedBy} mentioned you on WorkNest`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2><strong>${mentionedBy}</strong> mentioned you</h2>
        <blockquote style="border-left: 4px solid #6366f1; padding-left: 16px; color: #374151;">${context}</blockquote>
        <a href="${link}" style="
          display: inline-block;
          background: #6366f1;
          color: white;
          padding: 12px 24px;
          border-radius: 8px;
          text-decoration: none;
          font-weight: 600;
          margin: 16px 0;
        ">View Comment</a>
      </div>
    `,
  });
}
