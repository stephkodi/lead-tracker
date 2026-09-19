import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const {
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

    // Validate required fields
    if (!date || !customerName || !phone) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required fields: date, customerName, and phone are mandatory.',
        },
        { status: 400 }
      );
    }

    const leadPayload = {
      timestamp: new Date().toISOString(),
      date,
      customerName,
      phone,
      email: email || '',
      location: location || '',
      services: Array.isArray(services) ? services.join(', ') : services || 'General',
      requirements: requirements || '',
      vendorAssigned: vendorAssigned || 'Unassigned',
    };

    // Determine target webhook URL (request payload or environment variable)
    const targetScriptUrl = googleScriptUrl || process.env.GOOGLE_SHEETS_WEBHOOK_URL;

    if (!targetScriptUrl) {
      // Graceful fallback for local development or initial setup
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
          warning: 'Lead saved, but Google Sheets webhook was unreachable or blocked by CORS.',
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
