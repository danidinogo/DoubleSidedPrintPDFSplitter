const fetch = require('node-fetch'),
    fs = require('fs'),
    PDFLib = require('pdf-lib'),
    PDFDocument = PDFLib.PDFDocument,
    rgb = PDFLib.rgb,
    fontkit = require('@pdf-lib/fontkit');

async function main(offset=0, pagination=true) {
    const inDoc = await PDFDocument.load(fs.readFileSync('./in/in.pdf'), {ignoreEncryption: true}),
        first = await PDFDocument.create(),
        second = await PDFDocument.create();

    let pages = inDoc.getPages();
    await new Promise(async res => {
        for(let i=offset, z=0;i<pages.length;i++, z++) {
            if(pagination) {
                pages[i] = await add_pagination(inDoc, i, z+1);
            }
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

async function add_pagination(pdfDoc, pageIndex, pageNumber) {
    const fontBytes = await fetch('https://pdf-lib.js.org/assets/ubuntu/Ubuntu-R.ttf').then(res => res.arrayBuffer());
    pdfDoc.registerFontkit(fontkit);
    const customFont = await pdfDoc.embedFont(fontBytes);

    let page = pdfDoc.getPages()[pageIndex];

    page.drawText(pageNumber.toString(), {
        x: 550,
        y: 50,
        size: 35,
        font: customFont,
        color: rgb(0, 0.53, 0.71),
      })
    return page;
}


let offset = 0;
if(process.argv.includes('--offset')||process.argv.includes('-o')) {
    offset = process.argv.indexOf('--offset');
    offset = offset===-1 ? process.argv.indexOf('-o') : offset;
    offset = process.argv[offset+1]!==undefined ? process.argv[offset+1] : 0;
    offset = parseInt(offset)>0 ? offset : 0;
}
let pagination = true;
if(process.argv.includes('--pagination')||process.argv.includes('-p')) {
    pagination = process.argv.indexOf('--pagination');
    pagination = pagination===-1 ? process.argv.indexOf('-p') : pagination;
    pagination = process.argv[pagination+1]!==undefined ? process.argv[pagination+1] : 0;
    pagination = parseInt(pagination)>0 ? pagination : 0;
}
main(offset, pagination===true||pagination==="true"||pagination==="1");