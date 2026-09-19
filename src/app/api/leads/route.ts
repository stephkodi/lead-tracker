import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const {
      action = 'create',
      id,
      leadId,
      status,
      date,
      customerName,
      phone,
      email,
      location,
      services,
      requirements,
      vendorAssigned,
      googleScriptUrl,
    } = body;

    const targetScriptUrl = googleScriptUrl || process.env.GOOGLE_SHEETS_WEBHOOK_URL;

    // --- HANDLE LEAD STATUS UPDATE ---
    if (action === 'update_status') {
      const effectiveId = leadId || id;
      if (!effectiveId || !status) {
        return NextResponse.json(
          {
            success: false,
            error: 'Missing required parameters: leadId and status are mandatory for status updates.',
          },
          { status: 400 }
        );
      }

      if (!targetScriptUrl) {
        return NextResponse.json(
          {
            success: true,
            syncedToSheet: false,
            message: 'Status updated locally. (Connect Google Sheets in Settings to sync remotely).',
            data: { leadId: effectiveId, status },
          },
          { status: 200 }
        );
      }

      try {
        const gasResponse = await fetch(targetScriptUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            action: 'update_status',
            leadId: effectiveId,
            status,
            phone: phone || undefined,
            vendorAssigned: vendorAssigned || undefined,
            timestamp: new Date().toISOString(),
          }),
          redirect: 'follow',
        });

        const responseText = await gasResponse.text();
        let responseJson: Record<string, unknown> = {};
        try {
          responseJson = JSON.parse(responseText);
        } catch {
          responseJson = { rawResponse: responseText };
        }

        return NextResponse.json(
          {
            success: true,
            syncedToSheet: gasResponse.ok,
            message: `Lead status synced to Google Sheet as '${status}'!`,
            gasResponse: responseJson,
          },
          { status: 200 }
        );
      } catch (err: unknown) {
        console.error('Error forwarding status update to Google Sheets:', err);
        return NextResponse.json(
          {
            success: true,
            syncedToSheet: false,
            warning: 'Status updated locally, but Google Sheets update failed.',
            error: err instanceof Error ? err.message : 'Unknown network error',
          },
          { status: 200 }
        );
      }
    }

    // --- HANDLE NEW LEAD CREATION ---
    if (!date || !customerName || !phone) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required fields: date, customerName, and phone are mandatory.',
        },
        { status: 400 }
      );
    }

    const effectiveLeadId = leadId || id || `lead-${Date.now()}`;
    const effectiveStatus = status || 'Captured';

    const leadPayload = {
      action: 'create',
      leadId: effectiveLeadId,
      timestamp: new Date().toISOString(),
      date,
      customerName,
      phone,
      email: email || '',
      location: location || '',
      services: Array.isArray(services) ? services.join(', ') : services || 'General',
      requirements: requirements || '',
      status: effectiveStatus,
      vendorAssigned: vendorAssigned || 'Unassigned',
    };

    if (!targetScriptUrl) {
      return NextResponse.json(
        {
          success: true,
          syncedToSheet: false,
          message: 'Lead captured locally! (To sync to Google Sheets, add your Web App URL in Settings).',
          data: leadPayload,
        },
        { status: 200 }
      );
    }

    // Forward to Google Apps Script Web App
    try {
      const gasResponse = await fetch(targetScriptUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(leadPayload),
        redirect: 'follow',
      });

      const responseText = await gasResponse.text();
      let responseJson: Record<string, unknown> = {};

      try {
        responseJson = JSON.parse(responseText);
      } catch {
        responseJson = { rawResponse: responseText };
      }

      if (!gasResponse.ok) {
        return NextResponse.json(
          {
            success: true,
            syncedToSheet: false,
            warning: `Google Apps Script returned status ${gasResponse.status}`,
            data: leadPayload,
            details: responseJson,
          },
          { status: 200 }
        );
      }

      return NextResponse.json(
        {
          success: true,
          syncedToSheet: true,
          message: 'Lead successfully logged to Google Sheets and saved!',
          data: leadPayload,
          gasResponse: responseJson,
        },
        { status: 200 }
      );
    } catch (networkError: unknown) {
      console.error('Error forwarding to Google Apps Script:', networkError);
      return NextResponse.json(
        {
          success: true,
          syncedToSheet: false,
          warning: 'Lead saved locally, but Google Sheets webhook was unreachable.',
          error: networkError instanceof Error ? networkError.message : 'Unknown network error',
          data: leadPayload,
        },
        { status: 200 }
      );
    }
  } catch (err: unknown) {
    console.error('API /api/leads error:', err);
    return NextResponse.json(
      {
        success: false,
        error: err instanceof Error ? err.message : 'Internal Server Error',
      },
      { status: 500 }
    );
  }
}
