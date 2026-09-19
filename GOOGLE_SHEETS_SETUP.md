# Google Sheets Integration Guide: Service Lead Tracker

This guide explains how to connect your **Service Lead Tracker** PWA directly to a Google Sheet using a lightweight, serverless Google Apps Script Web App.

---

## 1. Create Your Google Sheet

1. Open [Google Sheets](https://sheets.new) and create a new blank spreadsheet.
2. Name it **"Service Leads Log"**.
3. Copy the URL of your new sheet from your browser's address bar (you can paste this in the app's Settings under *"Google Sheet URL"* to open it in one tap anytime).

---

## 2. Add Google Apps Script

1. In the Google Sheets menu, click **Extensions** > **Apps Script**.
2. Rename the project from *"Untitled project"* to **"Lead Tracker Webhook"**.
3. Replace all existing code in the editor (`Code.gs`) with the following script:

```javascript
/**
 * Service Lead Tracker - Google Apps Script Webhook
 * Receives JSON payloads and automatically appends leads to the Google Sheet.
 */

function doPost(e) {
  var lock = LockService.getScriptLock();
  // Wait up to 30 seconds for other concurrent requests
  lock.tryLock(30000);

  try {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    
    // Ensure header row exists if the sheet is empty
    if (sheet.getLastRow() === 0) {
      var headers = [
        "Timestamp",
        "Date of Service",
        "Customer Name",
        "Phone Number",
        "Email",
        "Location / Address",
        "Services Required",
        "Detailed Requirements",
        "Assigned Vendor"
      ];
      sheet.appendRow(headers);
      
      // Format header row with clean styling
      var headerRange = sheet.getRange(1, 1, 1, headers.length);
      headerRange.setBackground("#0F172A"); // Dark slate
      headerRange.setFontColor("#FFFFFF");
      headerRange.setFontWeight("bold");
      sheet.setFrozenRows(1);
    }

    // Parse incoming JSON payload
    var data = {};
    if (e.postData && e.postData.contents) {
      data = JSON.parse(e.postData.contents);
    } else {
      data = e.parameter || {};
    }

    // Build row values
    var newRow = [
      data.timestamp || new Date().toISOString(),
      data.date || "",
      data.customerName || "",
      data.phone || "",
      data.email || "",
      data.location || "",
      data.services || "",
      data.requirements || "",
      data.vendorAssigned || "Unassigned"
    ];

    sheet.appendRow(newRow);

    return ContentService.createTextOutput(JSON.stringify({
      status: "success",
      message: "Lead successfully logged",
      row: sheet.getLastRow()
    })).setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      status: "error",
      message: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);

  } finally {
    lock.releaseLock();
  }
}

function doGet(e) {
  return ContentService.createTextOutput(JSON.stringify({
    status: "active",
    message: "Service Lead Tracker Webhook is live and ready to receive POST requests."
  })).setMimeType(ContentService.MimeType.JSON);
}
```

---

## 3. Deploy as a Web App

1. In the top right corner of the Apps Script editor, click **Deploy** > **New deployment**.
2. Click the gear icon (`⚙`) next to "Select type" and select **Web app**.
3. Configure the deployment settings:
   - **Description**: `v1 Production Webhook`
   - **Execute as**: `Me (your-email@gmail.com)`
   - **Who has access**: `Anyone` *(Crucial: allows the Next.js backend to post leads without complex OAuth tokens)*.
4. Click **Deploy**.
5. Grant permissions if prompted by Google:
   - Click *Authorize access*.
   - Choose your Google account.
   - Click *Advanced* (at the bottom) > *Go to Lead Tracker Webhook (unsafe)*.
   - Click *Allow*.
6. Copy the **Web app URL** (looks like: `https://script.google.com/macros/s/AKfycbx.../exec`).

---

## 4. Connect to Service Lead Tracker

1. Open your **Service Lead Tracker** app.
2. Tap the **Settings** tab in the bottom navigation.
3. Paste the copied Web app URL into **"Google Apps Script Web App URL"**.
4. Paste your Google Sheet URL into **"Google Sheet Direct Link"**.
5. Tap **Save Settings** & **Test Webhook**.

---

## Sheet Column Reference

| Column # | Header Name | Description |
|---|---|---|
| A | Timestamp | ISO 8601 server logging timestamp |
| B | Date of Service | Selected date of service request |
| C | Customer Name | Name of client or company |
| D | Phone Number | Contact number |
| E | Email | Customer email (optional) |
| F | Location / Address | Service address or location |
| G | Services Required | Comma-separated list of selected badges |
| H | Detailed Requirements | Scope of work / project notes |
| I | Assigned Vendor | Selected vendor when dispatched |
