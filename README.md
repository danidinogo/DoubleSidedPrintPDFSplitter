# Double Sided Print PDF Splitter
Split PDF pages in two files. Print first file, put the paper back, and print second one. It also process pages, so that it adds automatically numeration. You can also specify some parameters, like offset to remove some pages from the file production.

## What can you do
With this application you can currently:
- Divide a PDF in another two PDF files. First file will have odds pages, second one even ones.
- Remove first x pages, using the parameter "--offset" or "-o". For example "node index.js --offset 2 # this will remove first 2 pages and then it will split files.
- Adds pagination to all pages at the right corner. You can set this off setting the parameter "--pagination" to 0 or false. For example: "node index.js --pagination 0" ; "node index.js --pagination false"

## Getting started
1. Open a terminal and clone the repository: git clone https://github.com/KWERTYX/DoubleSidedPrintPDFSplitter . You can also download it and unzip.
2. Get into the folder with the terminal, and install libraries: npm install
3. Add the input PDF file in the "DoubleSidedPrintPDFSplitter/in" folder and rename it to "in.pdf"
4. Use the command: node index.js
5. If you don't get any error because the PDF could be protected, you will get 2 files: "DoubleSidedPrintPDFSplitter/first.pdf" and "DoubleSidedPrintPDFSplitter/second.pdf"

## Troubleshooting
- I get an error when I execute "node index.js"
- - Do you have internet connection? Some things must be downloaded from internet, such as fonts or libraries. If you get internet and you keep having the same problem, it could be that your PDF file is protected. Go to https://smallpdf.com/unlock-pdf and download the file and try again. 

## Next possible implementations
- Add catches to get bugs checkpoints
- ~~Recognize and auto send splitted files to printer~~
- Change the execution command to add the route of the file you want to split
- Add a parameter to add the route where you want to have the spplited files
- Add a parameter to autoremove splitted files after the print

# Built as a quick application
It has been coded in order to get a quick solution. It hasn't been tested in much cases, and there are some already-found-problems that might not been resolved. Feel free to use and add implementations. 

# Changelog
0.0.1 (02/02/2021)
1. Split a PDF in two PDF files.
2. Adds pagination to all pages
3. You can set an offset of pages that will be removed before the PDF split

0.0.2 (23/09/2021)
1. Quickfixes. It only got splitted first file instead of all files that were in the "in" folder
2. Printing function for each file
