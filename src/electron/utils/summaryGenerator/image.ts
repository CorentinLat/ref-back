// @ts-ignore PDFiumLibrary exists...
import { PDFiumDocument, PDFiumLibrary, PDFiumPageRenderOptions } from '@hyzyla/pdfium';
import { promises as fs } from 'fs';
import { join } from 'path';
import sharp from 'sharp';

import logger from '../logger';
import { tempPath } from '../path';
import { removeFile } from '../file';

export const convertPdfToPng = async (pdfPath: string): Promise<string|null> => {
    const pngPath = join(tempPath, `${Date.now()}.png`);

    try {
        const buff = await fs.readFile(pdfPath);

        const library = await PDFiumLibrary.init();
        const document: PDFiumDocument = await library.loadDocument(buff);

        const pageCount = document.getPageCount();
        if (!pageCount) {
            document.destroy();
            library.destroy();
            return null;
        }

        const firstPage = document.getPage(0);
        const image = await firstPage.render({ scale: 5, render: renderFunction });

        await fs.writeFile(pngPath, Buffer.from(image.data));

        document.destroy();
        library.destroy();

        return pngPath;
    } catch (e) {
        logger.error('Error on convertPdfToPng: ', e);

        removeFile(pngPath);
        return null;
    }
};

const renderFunction = (options: PDFiumPageRenderOptions): Promise<Buffer> =>
    sharp(options.data, {
        raw: {
            width: options.width,
            height: options.height,
            channels: 4,
        },
    })
        .png()
        .toBuffer();
