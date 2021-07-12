const fetch = require('node-fetch'),
    fs = require('fs'),
    PDFLib = require('pdf-lib'),
    PDFDocument = PDFLib.PDFDocument,
    rgb = PDFLib.rgb,
    fontkit = require('@pdf-lib/fontkit');

async function main(offset=0, pagination=true, split_range=[-1, -1]) {

    let files  = fs.readdirSync('./in/'),
        total_pages = 0;
    for(let f in files) {
        let file = {
            format: files[f].substr(-4),
            name: files[f].slice(0, -4)
        }
        if(file.format===".pdf") {
            let inDoc = await PDFDocument.load(fs.readFileSync('./in/'+files[f]), {ignoreEncryption: true}),
                first = await PDFDocument.create(),
                second = await PDFDocument.create();

            let pages = inDoc.getPages();
            split_range[0] = split_range[0]===-1 ? offset : split_range;
            split_range[1] = split_range[1]===-1 ? pages.length : split_range;

            await new Promise(async res => {
                for(let i=offset, z=0;i<pages.length;i++, z++) {
                    if(i>=split_range[0]&&i<=split_range[1]) {
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
                }
                res();
            }).then(async () => {
                if(!fs.existsSync('./out/'+file.name)) {
                    fs.mkdirSync('./out/'+file.name);
                }
                fs.writeFileSync('./out/'+file.name+'/first.pdf', await first.save());
                if(pages.length>1) {
                    fs.writeFileSync('./out/'+file.name+'/second.pdf', await second.save());
                }
                console.log('Páginas del documento 1: '+first.getPages().length);
                console.log('Páginas del documento 2: '+second.getPages().length);
                total_pages += first.getPages().length + second.getPages().length;
            }).catch(e => {
                console.log(e);
            });
        } else {
            console.log('Error: el formato del archivo '+files[f]+' no es PDF');
        }
    }
    console.log('Páginas totales: '+total_pages);
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
    offset = parseInt(offset)>0 ? parseInt(offset) : 0;
}
let pagination = true;
if(process.argv.includes('--pagination')||process.argv.includes('-p')) {
    pagination = process.argv.indexOf('--pagination');
    pagination = pagination===-1 ? process.argv.indexOf('-p') : pagination;
    pagination = process.argv[pagination+1]!==undefined ? process.argv[pagination+1] : 0;
    pagination = parseInt(pagination)>0 ? pagination : 0;
}

let split_range = [-1, -1],
    split = undefined;
if(process.argv.includes('--split-range')||process.argv.includes('-s')) {
    split = process.argv.indexOf('--split-range');
    split = split_range[0]===-1 ? process.argv.indexOf('-s') : pagination;
    split_range[0] = process.argv[split+1]!==undefined ? process.argv[split+1] : 0;
    split_range[1] = process.argv[split+2]!==undefined ? process.argv[split+2] : 0;
    // Falta terminar de afinar
}

// Falta terminar de afinar split_range
main(offset, pagination===true||pagination==="true"||pagination==="1", split_range = [-1, -1]);