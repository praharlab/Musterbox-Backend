const { join } = require('path');
const { readFileSync } = require('fs');
const { launch } = require('puppeteer');
const { template, templateSettings } = require('lodash');
const htmlToPdfmake = require('html-to-pdfmake');
const pdfMake = require('pdfmake/build/pdfmake');
const { JSDOM } = require('jsdom');
const vfsFonts = require('pdfmake/build/vfs_fonts');
const PdfPrinter = require('pdfmake');
pdfMake.vfs = vfsFonts.vfs;
const path = require('path');

/**
 * Generates the PDF using html file and input data
 * @param {string} htmlFileName name of html file
 * @param {object} obj object that contains dynamic data that needs to be replaced in html file
 */
exports.generatePDF = async (htmlFileName, obj) => {
  try {
    const templatePath = join(__dirname, '../html/', `${htmlFileName}.html`);

    templateSettings.interpolate = /{{([\s\S]+?)}}/g;
    let content = readFileSync(templatePath, 'utf-8');
    const compiled = template(content);
    content = compiled(obj);

    const browser = await launch({
      headless: true,
      args: ['--no-sandbox'],
    });

    const page = await browser.newPage();
    await page.setContent(content, {
      waitUntil: 'domcontentloaded',
    });

    await page.emulateMediaType('screen');
    const pdfBuffer = await page.pdf({
      format: 'A4',
      margin: {
        top: '20px',
        bottom: '20px',
        right: '20px',
        left: '20px',
      },
      preferCSSPageSize: true,
    });
    await browser.close();
    return Buffer.from(pdfBuffer);
  } catch (error) {
    console.log('Error in Generate PDF Function', error);
    throw error;
  }
};

exports.generatePDFWithImage = async (htmlFileName, obj) => {
  try {
    const templatePath = join(__dirname, '../html/', `${htmlFileName}.html`);

    templateSettings.interpolate = /{{([\s\S]+?)}}/g;
    let content = readFileSync(templatePath, 'utf-8');
    const compiled = template(content);
    content = compiled(obj);

    const browser = await launch({
      headless: true,
      args: ['--no-sandbox'],
    });

    const page = await browser.newPage();
    await page.setContent(content, {
      waitUntil: 'networkidle0',
    });

    await page.emulateMediaType('screen');
    const pdfBuffer = await page.pdf({
      format: 'A4',
      margin: {
        top: '20px',
        bottom: '20px',
        right: '20px',
        left: '20px',
      },
      preferCSSPageSize: true,
    });
    await browser.close();
    return Buffer.from(pdfBuffer);
  } catch (error) {
    console.log('Error in Generate PDF Function', error);
    throw error;
  }
};

exports.generateLetterPDF = async (htmlFileName, obj, headerTemplate) => {
  try {
    const templatePath = join(__dirname, '../html/', `${htmlFileName}.html`);

    templateSettings.interpolate = /{{([\s\S]+?)}}/g;
    let content = readFileSync(templatePath, 'utf-8');
    const compiled = template(content);
    content = compiled(obj);

    const browser = await launch({
      headless: true,
      args: ['--no-sandbox'],
    });

    const page = await browser.newPage();
    await page.setContent(content, {
      waitUntil: 'networkidle0',
    });

    await page.emulateMediaType('screen');

    const pdfBuffer = await page.pdf({
      format: 'A4',
      displayHeaderFooter: headerTemplate ? true : false,
      headerTemplate: headerTemplate ? headerTemplate : '',
      footerTemplate: ' ',
      margin: {
        top: '240px',
        bottom: '140px',
        right: '60px',
        left: '60px',
      },
      preferCSSPageSize: true,
    });
    await browser.close();
    return Buffer.from(pdfBuffer);
  } catch (error) {
    throw new Error('Error in Generate Letter PDF Function ' + error.message);
  }
};

// ✅ Generate offer letter PDF
exports.generateOfferLetterPdf = async (htmlFileName, obj) => {
  const fonts = {
    Roboto: {
      bold: path.join(__dirname, '../fonts/Roboto-Bold.ttf'),
      normal: path.join(__dirname, '../fonts/Roboto-Regular.ttf'),
      italics: path.join(__dirname, '../fonts/Roboto-Italic.ttf'),
      bolditalics: path.join(__dirname, '../fonts/Roboto-BoldItalic.ttf'),
    },
    NotoSansDevanagari: {
      normal: path.join(
        __dirname,
        '../fonts/NotoSansDevanagari-VariableFont_wdth,wght.ttf'
      ),
      bold: path.join(__dirname, '../fonts/NotoSansDevanagari-Bold.ttf'),
    },
  };
  const printer = new PdfPrinter(fonts);
  try {
    const templatePath = path.join(
      __dirname,
      '../html',
      `${htmlFileName}.html`
    );
    templateSettings.interpolate = /{{([\s\S]+?)}}/g;

    // Preprocess HTML with embedded images
    let htmlContent = readFileSync(templatePath, 'utf-8');
    // htmlContent = embedImagesAsBase64(htmlContent);
    htmlContent = template(htmlContent)(obj);

    // Convert to pdfmake content
    const dom = new JSDOM();
    let pdfContent = htmlToPdfmake(htmlContent, {
      window: dom.window,
      defaultStyles: {
        p: { margin: [0, 0, 0, 0], bold: false, lineHeight: 1.6 },
        table: { tableAutoSize: true, alignment: 'center' },
        th: { bold: true },
      },
    });

    // 🧼 Clean empty DIVs
    const divIndex = pdfContent.findIndex((x) => x.nodeName === 'DIV');
    if (divIndex !== -1 && pdfContent[divIndex].stack) {
      pdfContent[divIndex].stack = pdfContent[divIndex].stack.filter(
        (x) => !(x.text && typeof x.text === 'string' && x.text.trim() === '')
      );
    }

    // 🔧 Table cleanup & enhancement
    const cleanTableCells = (docContent) => {
      if (Array.isArray(docContent)) {
        docContent.forEach(cleanTableCells);
      } else if (docContent && typeof docContent === 'object') {
        if (docContent.table?.body) {
          const maxCols = Math.max(
            ...docContent.table.body.map((row) => row.length)
          );
          docContent.table.body = docContent.table.body.map((row) => {
            const newRow = [];
            let i = 0;
            while (i < maxCols) {
              if (row[i] !== undefined) {
                newRow.push(row[i]);
                i++;
              } else {
                let colspan = 1;
                while (i + colspan < maxCols && row[i + colspan] === undefined)
                  colspan++;
                if (newRow.length > 0) {
                  const lastCell = newRow[newRow.length - 1];
                  if (typeof lastCell === 'object') {
                    lastCell.colSpan = (lastCell.colSpan || 1) + colspan;
                  }
                }
                i += colspan;
              }
            }
            return newRow;
          });
        }
        for (const key in docContent) {
          cleanTableCells(docContent[key]);
        }
      }
    };

    const centerAllTables = (docContent, parent = null, keyInParent = null) => {
      if (Array.isArray(docContent)) {
        docContent.forEach((item, index) =>
          centerAllTables(item, docContent, index)
        );
      } else if (docContent && typeof docContent === 'object') {
        if (docContent.table?.body) {
          const centeredTable = {
            columns: [
              { width: '*', text: '' },
              {
                width: 'auto',
                ...docContent,
                alignment: 'center',
                style: (docContent.style || []).concat('centeredTable'),
              },
              { width: '*', text: '' },
            ],
          };
          if (parent && keyInParent !== null) {
            parent[keyInParent] = centeredTable;
          }
          return;
        }
        for (const key in docContent) {
          centerAllTables(docContent[key], docContent, key);
        }
      }
    };

    const assignFonts = (content) => {
      if (Array.isArray(content)) return content.map(assignFonts);
      if (content && typeof content === 'object') {
        if (typeof content.text === 'string') {
          content.font = /[\u0900-\u097F]/.test(content.text)
            ? 'NotoSansDevanagari'
            : 'Roboto';
        }
        for (const key in content) {
          content[key] = assignFonts(content[key]);
        }
      }
      return content;
    };
    const fixBase64Images = (content) => {
      if (Array.isArray(content)) {
        return content.map(fixBase64Images);
      } else if (content && typeof content === 'object') {
        if (
          content.nodeName === 'IMG' &&
          content.image?.startsWith('data:image')
        ) {
          // Turn into valid pdfmake image object
          return {
            image: content.image,
            fit: [150, 150], // adjust size as needed
            alignment: content.alignment || 'center',
            style: content.style || [],
          };
        }

        // Recursively process children
        for (const key in content) {
          content[key] = fixBase64Images(content[key]);
        }
      }
      return content;
    };

    cleanTableCells(pdfContent);
    centerAllTables(pdfContent);
    pdfContent = assignFonts(pdfContent);
    pdfContent = fixBase64Images(pdfContent);

    // 📄 Letterhead background image
    const letterheadPath = path.join(
      __dirname,
      `../uploads/company/letterHead/${obj?.letterHead}`
    );
    const backgroundImage = getImageAsBase64(letterheadPath);

    const docDefinition = {
      content: pdfContent,
      pageSize: 'A4',
      pageMargins: [50, 170, 50, 110],
      defaultStyle: {
        fontSize: 9,
        table: { alignment: 'center' },
        'html-table': { alignment: 'center' },
        centeredTable: { alignment: 'center' },
      },
      styles: {
        'html-table': { alignment: 'center' },
        centeredTable: { alignment: 'center' },
      },
      background: {
        image: backgroundImage,
        width: 595.28,
        height: 841.89,
        absolutePosition: { x: 0, y: 0 },
      },
    };

    return new Promise((resolve, reject) => {
      const pdfDoc = printer.createPdfKitDocument(docDefinition);
      const chunks = [];
      pdfDoc.on('data', (chunk) => chunks.push(chunk));
      pdfDoc.on('end', () => resolve(Buffer.concat(chunks)));
      pdfDoc.end();
    });
  } catch (error) {
    console.error('Error generating offer letter with pdfmake:', error);
    throw error;
  }
};

function getImageAsBase64(imagePath) {
  const imageBuffer = readFileSync(imagePath);
  return `data:image/jpeg;base64,${imageBuffer.toString('base64')}`;
}
