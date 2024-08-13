const fs = require("fs");
const readline = require("readline");
const csv = require("csv-parser");
const { google } = require("googleapis");

const results = [];

const writeProfile = (data) => {
  let content = `---
created:
contributors: ${data['curator']}
title: ${data["title"]}
url: ${data["url"]}
locations: ${data["locations"]}
start: ${data["start"]}
end: ${data["end"]}
size: ${data["size"]}
image: ${data["homepage image url"]}
logo: ${data["logo image url"]}
sectors:
  main sector: ${data["main sector"]}
  sector 2: ${data["sector 2"]}
  sector 3: ${data["sector 3"]}
activities: 
  main activity: ${data["main activity"]}
  activity 2: ${data["activity 2"]}
  activity 3: ${data["activity 3"]}
cohere: true
metadata_version: 1
---
\n
##Body\n
${data["description"]}\n

##key People
${data["key people"]}\n
##Theory of change
${data["theory of change"]}\n
##key learning resources
${data["learning resources"]}\n
##Connections
${data["connections"]}\n
`;


  // Object.keys(data).map((key, index) => {
  //   content += `### ${key}: 
  // ${data[key]}\n`;
  // });

  // Object.keys(data).forEach(key => {
  //   console.log(key)

  //   content += `### ${key}\n`
  //   content += `${data[key]}\n\n`
  // })

  // console.log(content)

  fs.writeFile(`data/${data["title"]}.md`, content, (err) => {
    if (err) {
      console.error(err);
    } else {
      // console.log("Markdown file is generated");
    }
  });
};

// // Read the CSV file
// fs.createReadStream("para.csv")
//   .pipe(csv())
//   .on("data", (data) => {
//     if (data["title"] == "Coasys") {
//       results.push(data);
//       writeProfile(data);
//     }
//   })
//   .on("end", () => {
//     // console.log('CSV Data:', results);
//   })
//   .on("error", (err) => {
//     // console.error('Error reading CSV file:', err);
//   });

// Load client secrets from a local file
fs.readFile("credentials.json", (err, content) => {
  if (err) return console.log("Error loading client secret file:", err);
  authorize(JSON.parse(content), listMajors);
});

/**
 * Create an OAuth2 client with the given credentials, and then execute the given callback function.
 * @param {Object} credentials The authorization client credentials.
 * @param {function} callback The callback to call with the authorized client.
 */
function authorize(credentials, callback) {
  const { client_secret, client_id, redirect_uris } = credentials.installed;
  const oAuth2Client = new google.auth.OAuth2(
    client_id,
    client_secret,
    redirect_uris[0]
  );

  // Check if we have previously stored a token.
  fs.readFile("token.json", (err, token) => {
    if (err) return getNewToken(oAuth2Client, callback);
    oAuth2Client.setCredentials(JSON.parse(token));
    callback(oAuth2Client);
  });
}

/**
 * Get and store new token after prompting for user authorization, and then execute the given callback with the authorized OAuth2 client.
 * @param {google.auth.OAuth2} oAuth2Client The OAuth2 client to get token for.
 * @param {getEventsCallback} callback The callback for the authorized client.
 */
function getNewToken(oAuth2Client, callback) {
  const authUrl = oAuth2Client.generateAuthUrl({
    scope: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
  });
  console.log("Authorize this app by visiting this url:", authUrl);
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  rl.question("Enter the code from that page here: ", (code) => {
    rl.close();
    oAuth2Client.getToken(code, (err, token) => {
      if (err) return console.error("Error retrieving access token", err);
      oAuth2Client.setCredentials(token);
      // Store the token to disk for later program executions
      fs.writeFile("token.json", JSON.stringify(token), (err) => {
        if (err) return console.error(err);
        console.log("Token stored to", "token.json");
      });
      callback(oAuth2Client);
    });
  });
}

/**
 * Prints the names and majors of students in a sample spreadsheet:
 * @see https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit
 * @param {google.auth.OAuth2} auth The authenticated Google OAuth client.
 */
function listMajors(auth) {
  const sheets = google.sheets({ version: "v4", auth });
  sheets.spreadsheets.values.get(
    {
      spreadsheetId: "1VbMvdy_pPzdREsAsXxONZWbPWS0rLxsy-NWJCg1cYDw",
      range: "Organisations!A1:AE",
    },
    (err, res) => {
      if (err) return console.log("The API returned an error: " + err);
      const rows = res.data.values;
      if (rows.length) {
        let keys;
        //get keys from first row
        rows.map((row, index) => {
          if (index === 0) keys = rows[0];
          else {
            let data = {};
            row.forEach((cell, index) => {
              data[keys[index]] = cell;
            });
            writeProfile(data);
          }
        });
      } else {
        console.log("No data found.");
      }
    }
  );
}
