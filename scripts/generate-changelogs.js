const fs = require('fs');
const pathUtil = require('path');
const lte = require('semver/functions/lte');

/**
 * @typedef Release
 * @property {string} version
 * @property {Date} date
 * @property {string[]} notes
 */

const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December'
];

const escapeXmlText = (xml) => xml.replace(/[<>&]/g, c => {
  // We don't need to escape quotes because we only use this for text, not attributes
  switch (c) {
    case '<': return '&lt;';
    case '>': return '&gt;';
    case '&': return '&amp;';
  }
});

/** @returns {Release[]} */
const parse = () => {
  const releaseData = [];
  const source = fs.readFileSync(pathUtil.join(__dirname, '../changelog.md'), 'utf-8');
  const sections = source.split(/^# /gm);

  // Remove the information section at the start
  sections.shift();

  for (const section of sections) {
    const version = section.match(/\d+\.\d+\.\d+(?:-[\w.-]+)?/)[0];
    const date = new Date(section.match(/\((\d+-\d+-\d+)\)/)[1]);

    /** @type {Release} */
    const data = {
      version,
      date,
      notes: []
    };

    for (const note of section.matchAll(/^ *[-*] *(.+)/gm)) {
      data.notes.push(note[1]);
    }

    releaseData.push(data);
  }
  return releaseData;
};

/**
 * @param {Release[]} releases
 */
const generateHomepage = (releases) => {
  const path = pathUtil.join(__dirname, '../docs/index.html');
  let source = fs.readFileSync(path, 'utf-8');
  const releasedVersion = source.match(/const VERSION *= *["']([\d\w\.\-]+)["']/i)[1];

  let html = '';
  for (const {version, date, notes} of releases) {
    if (lte(version, releasedVersion)) {
      html += `        <div data-version="${version}">\n`;
      html += `          <h3>v${version} (${MONTHS[date.getUTCMonth()]} ${date.getUTCDate()} ${date.getUTCFullYear()})</h3>\n`;
      html += '          <ul>\n';
      for (const note of notes) {
        html += `            <li>${escapeXmlText(note)}</li>\n`;
      }
      html += '          </ul>\n';
      html += '        </div>\n';
    }
  }

  source = source.replace(
    /<!-- CHANGELOG_START -->[\s\S]*<!-- CHANGELOG_END -->/m,
    `<!-- CHANGELOG_START -->\n${html}        <!-- CHANGELOG_END -->`
  );
  fs.writeFileSync(path, source);
};

/**
 * @param {Release[]} releases
 */
const generateMetainfo = (releases) => {
  let xml = '';
  for (const {version, date, notes} of releases) {
    xml += `    <release version="${version}" date="${date.getUTCFullYear()}-${date.getUTCMonth() + 1}-${date.getUTCDate()}">\n`;
    xml += '      <description>\n';
    xml += '        <ul>\n';
    for (let note of notes) {
      // This file is only used on Linux
      if (note.startsWith('Windows:') || note.startsWith('macOS:')) {
        continue;
      }
      note = note.replace(/^Linux: */, '');
      xml += `          <li>${escapeXmlText(note)}</li>\n`;
    }
    xml += '        </ul>\n';
    xml += '      </description>\n';
    xml += '    </release>\n';
  }

  const path = pathUtil.join(__dirname, '../linux-files/org.turbowarp.TurboWarp.metainfo.xml');
  let source = fs.readFileSync(path, 'utf-8');
  source = source.replace(
    /<releases>[\s\S]*<\/releases>/m,
    `<releases>\n${xml}  </releases>`
  );
  fs.writeFileSync(path, source);
};

/**
 * @param {Release[]} releases
 */
const generateJSON = (releases) => {
  const data = [];
  for (const {version, date, notes} of releases) {
    data.push({
      version,
      date: `${date.getUTCFullYear()}-${date.getUTCMonth() + 1}-${date.getUTCDate()}`,
      notes
    });
  }

  const path = pathUtil.join(__dirname, '../docs/changelog.json');
  fs.writeFileSync(path, JSON.stringify(data, null, 2));
};

const releases = parse();
generateHomepage(releases);
generateMetainfo(releases);
generateJSON(releases);
