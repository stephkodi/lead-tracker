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
 * Receives JSON payloads to append leads or update lead status in real-time.
 */

function doPost(e) {
  var lock = LockService.getScriptLock();
  // Wait up to 30 seconds for other concurrent requests
  lock.tryLock(30000);

  try {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    var headers = [
      "Lead ID",
      "Timestamp",
      "Date",
      "Customer Name",
      "Phone",
      "Email",
      "Location",
      "Services",
      "Requirements",
      "Status",
      "Assigned Vendor"
    ];

    // Ensure header row exists if sheet is empty
    if (sheet.getLastRow() === 0) {
      sheet.appendRow(headers);
      var headerRange = sheet.getRange(1, 1, 1, headers.length);
      headerRange.setBackground("#0F172A");
      headerRange.setFontColor("#FFFFFF");
      headerRange.setFontWeight("bold");
      sheet.setFrozenRows(1);
    }

    var data = {};
    if (e.postData && e.postData.contents) {
      data = JSON.parse(e.postData.contents);
    } else {
      data = e.parameter || {};
    }

    var action = data.action || "create";

    // 1. UPDATE EXISTING LEAD STATUS
    if (action === "update_status") {
      var leadId = data.leadId;
      var newStatus = data.status;
      var values = sheet.getDataRange().getValues();
      var idCol = values[0].indexOf("Lead ID");
      var phoneCol = values[0].indexOf("Phone");
      var statusCol = values[0].indexOf("Status");
      var vendorCol = values[0].indexOf("Assigned Vendor");

      for (var i = 1; i < values.length; i++) {
        var matchById = (idCol !== -1 && String(values[i][idCol]) === String(leadId));
        var matchByPhone = (phoneCol !== -1 && data.phone && String(values[i][phoneCol]) === String(data.phone));

        if (matchById || matchByPhone) {
          if (statusCol !== -1) {
            sheet.getRange(i + 1, statusCol + 1).setValue(newStatus);
          }
          if (data.vendorAssigned && vendorCol !== -1) {
            sheet.getRange(i + 1, vendorCol + 1).setValue(data.vendorAssigned);
          }
          return ContentService.createTextOutput(JSON.stringify({
            status: "success",
            action: "update_status",
            updatedRow: i + 1,
            newStatus: newStatus
          })).setMimeType(ContentService.MimeType.JSON);
        }
      }

      return ContentService.createTextOutput(JSON.stringify({
        status: "not_found",
        message: "Lead ID not found to update"
      })).setMimeType(ContentService.MimeType.JSON);
    }

    // 2. APPEND NEW LEAD
    var newRow = [
      data.leadId || ("lead-" + Date.now()),
      data.timestamp || new Date().toISOString(),
      data.date || "",
      data.customerName || "",
      data.phone || "",
      data.email || "",
      data.location || "",
      data.services || "",
      data.requirements || "",
      data.status || "Captured",
      data.vendorAssigned || "Unassigned"
    ];

    sheet.appendRow(newRow);

    return ContentService.createTextOutput(JSON.stringify({
      status: "success",
      action: "create",
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

1. In the top right corner of the Apps Script editor, click **Deploy** > **New deployment** (or **Manage deployments** > edit to create a new version if updating).
2. Click the gear icon (`⚙`) next to "Select type" and select **Web app**.
3. Configure the deployment settings:
   - **Description**: `v2 Status Sync Webhook`
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
| A | Lead ID | Unique ID (e.g., `lead-17739...`) for syncing status updates |
| B | Timestamp | ISO 8601 creation timestamp |
| C | Date | Date of service requested |
| D | Customer Name | Name of customer |
| E | Phone | Customer phone number |
| F | Email | Customer email (optional) |
| G | Location | Service location / address |
| H | Services | Comma-separated list of services |
| I | Requirements | Scope of work / project details |
| J | Status | Lead status (`Captured`, `Dispatched`, `In Progress`, `Completed`, `Cancelled`) |
| K | Assigned Vendor | Name or number of assigned vendor |
