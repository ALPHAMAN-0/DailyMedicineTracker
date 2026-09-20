import { google } from "googleapis";

const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
const rawKey = process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY;
const ownerEmail = process.env.GOOGLE_SHEET_OWNER_EMAIL;

if (!email || !rawKey || !ownerEmail) {
  console.error(
    "Missing one of GOOGLE_SERVICE_ACCOUNT_EMAIL, GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY, GOOGLE_SHEET_OWNER_EMAIL in the environment."
  );
  process.exit(1);
}

const auth = new google.auth.JWT({
  email,
  key: rawKey.replace(/\\n/g, "\n"),
  scopes: [
    "https://www.googleapis.com/auth/spreadsheets",
    "https://www.googleapis.com/auth/drive.file",
  ],
});

const sheets = google.sheets({ version: "v4", auth });
const drive = google.drive({ version: "v3", auth });

async function main() {
  console.log("Creating spreadsheet...");
  const createRes = await sheets.spreadsheets.create({
    requestBody: {
      properties: { title: "Daily Medicine Tracker Data" },
      sheets: [{ properties: { title: "Medicines" } }],
    },
  });

  const spreadsheetId = createRes.data.spreadsheetId;
  console.log(`Created spreadsheet: ${spreadsheetId}`);

  console.log("Writing Medicines header row...");
  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range: "Medicines!A1",
    valueInputOption: "RAW",
    requestBody: {
      values: [["ID", "Name", "DoseCount", "Active", "CreatedAt", "RemovedAt"]],
    },
  });

  console.log(`Sharing with ${ownerEmail}...`);
  await drive.permissions.create({
    fileId: spreadsheetId,
    sendNotificationEmail: true,
    requestBody: {
      role: "writer",
      type: "user",
      emailAddress: ownerEmail,
    },
  });

  console.log("\nDone. Set this as GOOGLE_SHEET_ID in your environment:");
  console.log(spreadsheetId);
  console.log(
    `\nOpen it at: https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
