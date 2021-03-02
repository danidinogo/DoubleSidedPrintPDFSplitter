const fetch = require('node-fetch'),
    fs = require('fs'),
    PDFLib = require('pdf-lib'),
    PDFDocument = PDFLib.PDFDocument,
    rgb = PDFLib.rgb,
    fontkit = require('@pdf-lib/fontkit');

async function main(offset=0) {
    const inDoc = await PDFDocument.load(fs.readFileSync('./in/in.pdf'), {ignoreEncryption: true}),
        first = await PDFDocument.create(),
        second = await PDFDocument.create();

    let pages = inDoc.getPages();
    await new Promise(async res => {
        for(let i=offset, z=0;i<pages.length;i++, z++) {
            pages[i] = await process_page(inDoc, i);
            if(z%2===0) {
                let [evenPage] = await first.copyPages(inDoc, [i]);
                first.addPage(evenPage);
            } else {
                let [oddPage] = await second.copyPages(inDoc, [i]);
                second.addPage(oddPage);
            }
            
        }
        res();
    }).then(async () => {
        fs.writeFileSync('./out/first.pdf', await first.save());
        if(pages.length>1) {
            fs.writeFileSync('./out/second.pdf', await second.save());
        }
        console.log('Páginas del documento 1: '+first.getPages().length);
        console.log('Páginas del documento 2: '+second.getPages().length);
    }).catch(e => {
        console.log(e);
    });
}
let offset = 0;
if(process.argv.includes('--offset')||process.argv.includes('-o')) {
    offset = process.argv.indexOf('--offset');
    offset = offset===-1 ? process.argv.indexOf('-o') : offset;
    offset = process.argv[offset+1]!==undefined ? process.argv[offset+1] : 0;
    offset = parseInt(offset)>0 ? offset : 0;
}
async function process_page(pdfDoc, pageIndex) {
    const fontBytes = await fetch('https://pdf-lib.js.org/assets/ubuntu/Ubuntu-R.ttf').then(res => res.arrayBuffer());
    pdfDoc.registerFontkit(fontkit);
    const customFont = await pdfDoc.embedFont(fontBytes);

    let page = pdfDoc.getPages()[pageIndex],
        pageNumber = pageIndex + 1;

    page.drawText(pageNumber.toString(), {
        x: 40,
        y: 450,
        size: 35,
        font: customFont,
        color: rgb(0, 0.53, 0.71),
      })
    page.drawRectangle({
        x: 800,
        y: 800,
        width: customFont.widthOfTextAtSize(pageNumber.toString(), 35),
        height: customFont.heightAtSize(35),
        borderColor: rgb(1, 0, 0),
        borderWidth: 1.5,
    });
    return page;
}
main(offset);