/**
 * PDF bağlantılarını tarayıcıda güvenilir açmak için yardımcılar.
 * Büyük base64 PDF'ler <a href> içine gömülürse çoğu tarayıcıda açılmaz.
 */
(function (global) {
    const blobCache = new Map();

    function resolvePdfUrl(pdfUrl, pdfData) {
        const url = (pdfUrl || '').trim();
        if (url) return url;

        if (!pdfData || typeof pdfData !== 'string' || !pdfData.startsWith('data:')) {
            return '';
        }

        const cacheKey = String(pdfData.length) + ':' + pdfData.slice(0, 80);
        if (blobCache.has(cacheKey)) {
            return blobCache.get(cacheKey);
        }

        try {
            const commaIndex = pdfData.indexOf(',');
            if (commaIndex === -1) return '';

            const header = pdfData.slice(0, commaIndex);
            const base64 = pdfData.slice(commaIndex + 1);
            const mimeMatch = header.match(/data:([^;]+)/i);
            const mime = mimeMatch ? mimeMatch[1] : 'application/pdf';

            const binary = atob(base64);
            const bytes = new Uint8Array(binary.length);
            for (let i = 0; i < binary.length; i++) {
                bytes[i] = binary.charCodeAt(i);
            }

            const blobUrl = URL.createObjectURL(new Blob([bytes], { type: mime }));
            blobCache.set(cacheKey, blobUrl);
            return blobUrl;
        } catch (err) {
            console.warn('PDF bağlantısı oluşturulamadı:', err);
            return '';
        }
    }

    global.BlogPdfUtils = {
        resolvePdfUrl
    };
})(window);
