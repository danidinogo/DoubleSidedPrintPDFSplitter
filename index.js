const fetch = require('node-fetch'),
    fs = require('fs'),
    PDFLib = require('pdf-lib'),
    fontkit = require('@pdf-lib/fontkit'),
    printer = require('pdf-to-printer'),
    path = require('path');

async function main(offset=0, pagination=true, split_range=[-1, -1]) {
    let files  = fs.readdirSync('./in/'),
        results = [];
    for(let f in files) {
        console.log("Dividiendo archivo "+files[f]);
        results.push(await create_doublesidepdf(files[f], offset, pagination, split_range).then(async res => {
            console.log('Documento '+res.name+':\n- Páginas totales: '+res.pages+'\n- Páginas del documento 1: '+res.documents[0].pages+'\n- Páginas del documento 2: '+res.documents[1].pages);

            fs.unlinkSync('./in/'+files[f]);
            console.log('Archivo de entrada eliminado');

            if(res.pages>1) {
                console.log('Imprimiendo archivo 2. Pulsa enter cuando haya acabado y gires los folios en la impresora.');
                printer.print(path.join(__dirname, './out/'+res.name+'/second.pdf'));
                await enterToContinue();
            }
            const a = res.documents[0].pages > res.documents[1].pages ? 'Esta cara tiene una página más, así que añade un primer folio en blanco. ' : '';
            console.log('Imprimiendo archivo 1. '+a+'Pulsa enter cuando haya acabado');
            printer.print(path.join(__dirname, './out/'+res.name+'/first.pdf'));
            fs.rmdir(path.join(__dirname, './out/'+res.name), () => {});
            await enterToContinue();
        }));
    }
    console.log('Trabajo terminado. '+results.length+' ficheros divididos.');
}

async function create_doublesidepdf(file, offset, pagination, split_range) {
    let PDFDocument = PDFLib.PDFDocument,
        fileinfo = {
            format: file.substr(-4),
            name: file.slice(0, -4)
        };

    if(fileinfo.format===".pdf") {
        let inDoc = await PDFDocument.load(fs.readFileSync('./in/'+file), {ignoreEncryption: true}),
            first = await PDFDocument.create(),
            second = await PDFDocument.create();

        let pages = inDoc.getPages();
        let range = [
            split_range[0]===-1 ? offset : split_range[0],
            split_range[1]===-1 ? pages.length : split_range[1]
        ];
        return await new Promise(async resolve => {
            let result = {
                name: fileinfo.name,
                pages: pages,
                documents: []
            };
            await new Promise(async res => {
                for(let i=offset, z=0;i<pages.length;i++, z++) {
                    if(i>=range[0]&&i<=range[1]) {
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
                    progressbar(i+1, pages.length);
                }
                res();
            }).then(async () => {
                if(!fs.existsSync('./out/'+fileinfo.name)) {
                    fs.mkdirSync('./out/'+fileinfo.name);
                }
                fs.writeFileSync('./out/'+fileinfo.name+'/first.pdf', await first.save());
                if(pages.length>1) {
                    fs.writeFileSync('./out/'+fileinfo.name+'/second.pdf', await second.save());
                }
                result.documents = [
                    { pages: first.getPages().length },
                    { pages: second.getPages().length }
                ];
                result.pages = first.getPages().length + second.getPages().length;
                resolve(result);
            }).catch(e => {
                console.log(e);
            });
        });
    } else {
        console.log('Error: el formato del archivo '+file+' no es PDF');
    }
}

async function add_pagination(pdfDoc, pageIndex, pageNumber) {
    const fontBytes = await fetch('https://pdf-lib.js.org/assets/ubuntu/Ubuntu-R.ttf').then(res => res.arrayBuffer());
    pdfDoc.registerFontkit(fontkit);
    const customFont = await pdfDoc.embedFont(fontBytes),
        rgb = PDFLib.rgb;

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

function progressbar(i, limit, dots_limit=20) {
    const percentage = i/limit,
        dots_percentage = parseInt(percentage * dots_limit),
        dots = ".".repeat(dots_percentage),
        left = dots_limit - dots_percentage,
        empty = " ".repeat(left);
    process.stdout.write(`\r[${dots}${empty}] ${(percentage*100).toFixed(2)}%`);
    if(i/limit===1) {
        console.log('');
    }
}

function enterToContinue() {
    process.stdin.setRawMode(true)
    return new Promise(resolve => process.stdin.once('data', () => {
        process.stdin.setRawMode(false);
        resolve();
    }));
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
(async () => {
    await main(offset, pagination===true||pagination==="true"||pagination==="1", split_range = [-1, -1]);
})();