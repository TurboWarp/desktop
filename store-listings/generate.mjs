import fs from 'node:fs';
import path from 'node:path';

const NUMBER_OF_ADDONS = 50;
const CHANGELOG_LINK = 'https://desktop.turbowarp.org/?changelog';
const SCREENSHOT_PROJECT_LINK = 'https://scratch.mit.edu/projects/425020125/';
const translations = require('./imported.json');

const parseCSV = (contents) => {
  // Enforce consistent newline endings
  contents = contents.replace(/\r\n/g, '\n');

  const rows = [];
  let currentRow = [''];
  let inQuote = false;

  let i = 0;
  while (i < contents.length) {
    const character = contents[i];
    if (inQuote) {
      if (character === '"') {
        const nextCharacter = contents[i + 1];
        if (nextCharacter === '"') {
          // Literal quote character
          currentRow[currentRow.length - 1] += '"';
          i += 2;
        } else {
          inQuote = false;
          i++;
        }
      } else {
        // Literal quoted text
        currentRow[currentRow.length - 1] += character
        i++;
      }
    } else {
      if (character === ',') {
        // Start a new column
        currentRow.push('');
        i++;

        if (contents[i] === '"') {
          inQuote = true;
          i++;
        }
      } else if (character === '\n') {
        // Start a new row
        rows.push(currentRow);
        currentRow = [''];
        i++;
      } else {
        currentRow[currentRow.length - 1] += character
        i++;
      }
    }
  }

  // Don't forget to record the last row, if it exists
  if (currentRow.length) {
    rows.push(currentRow);
  }

  return rows;
};

const generateCSV = (rows) => {
  const result = [];
  for (const row of rows) {
    const escapedRow = row.map(item => {
      if (item.includes('\n') || item.includes(',')) {
        return `"${item.replace(/"/g, '""')}"`;
      }
      return item;
    });
    result.push(escapedRow.join(','));
  }
  return result.join('\n');
};

const generateStoreListings = (rows) => {
  // CSV header: Field, ID, Type (Type), default, en-us, de, nl, fr, ...

  // Remove everything after English
  rows = rows.map(i => i.slice(0, 5));

  const STRING_ID_MAP = {
    Description: 'microsoft-store-description',
    ReleaseNotes: 'microsoft-store-generic-release-notes',
    DesktopScreenshotCaption1: 'microsoft-store-screenshot-caption',
    DesktopScreenshotCaption2: 'microsoft-store-screenshot-caption',
    DesktopScreenshotCaption3: 'microsoft-store-screenshot-addons',
    DesktopScreenshotCaption4: 'microsoft-store-screenshot-packager',
  };

  const USE_DEFAULT_ROWS = [
    'Title',
    'CopyrightTrademarkInformation',
    'DesktopScreenshot1',
    'DesktopScreenshot2',
    'DesktopScreenshot3',
    'DesktopScreenshot4',
    'DesktopScreenshot5',
    'DesktopScreenshot6',
    'DesktopScreenshot7',
    'DesktopScreenshot8',
    'DesktopScreenshot9',
    'DesktopScreenshot10',
    'SearchTerm1',
    'SearchTerm2',
    'SearchTerm3',
    'SearchTerm4',
    'SearchTerm5',
    'SearchTerm6',
    'SearchTerm7',
  ];

  for (const [localeName, localeValues] of Object.entries(translations)) {
    const getString = (key) => {
      if (localeValues[key]) {
        return localeValues[key]
          .replace('{number_of_addons}', NUMBER_OF_ADDONS)
          .replace('{changelog_link}', CHANGELOG_LINK)
          .replace('{screenshot_project_link}', SCREENSHOT_PROJECT_LINK)
      }

      console.warn(`Missing translation ${key} for ${localeName}`);
      return null;
    };

    rows[0].push(localeName);

    for (let rowIndex = 1; rowIndex < rows.length; rowIndex++) {
      const row = rows[rowIndex];
      const rowId = row[0];
      const englishValue = row[4];

      if (USE_DEFAULT_ROWS.includes(rowId)) {
        row.push(englishValue);
      } else if (Object.prototype.hasOwnProperty.call(STRING_ID_MAP, rowId)) {
        const translation = getString(STRING_ID_MAP[rowId]);
        // The way the translations are imported, the string should always be defined
        row.push(translation || englishValue);
      }
    }
  }

  return rows;
};

const csvRows = parseCSV(fs.readFileSync(path.join(import.meta.dirname, 'from-microsoft.csv'), 'utf8'));
const parsedStoreListings = generateStoreListings(csvRows);
fs.writeFileSync('import-to-microsoft.csv', generateCSV(parsedStoreListings));
