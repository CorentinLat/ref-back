import axios from 'axios';
import { NoVideoError } from '../domain/error/NoVideoError';

export const getVideoUrlsFromVeoLinks = async (veoLinks: string[]): Promise<string[]> => {
    return Promise.all(veoLinks.map(getVideoUrlFromVeo));
};

const getVideoUrlFromVeo = async (veoLink: string): Promise<string> => {
    try {
        // Extraction de l'ID de la vidéo à partir de l'URL
        const match = veoLink.match(/https?:\/\/app\.veo\.co\/matches\/([0-9A-Za-z-_]+)/);
        if (!match || !match[1]) {
            throw new NoVideoError();
        }
        
        const videoId = match[1];

        // Appel de l'API JSON des vidéos de Veo
        const response = await axios.get(`https://app.veo.co/api/app/matches/${videoId}/videos`);
        const videoData = response.data;

        if (!Array.isArray(videoData) || videoData.length === 0) {
            throw new NoVideoError();
        }

        // Parcours et filtrage des formats disponibles
        for (const fmt of videoData) {
            const formatUrl = fmt.url;
            const mimeType = fmt.mime_type;

            // Ignorer les configurations invalides ou les flux de type transport stream (.ts / mp2t)
            if (!formatUrl || mimeType === 'video/mp2t') {
                continue;
            }

            // Retourne la première URL valide trouvée
            return formatUrl;
        }

        throw new NoVideoError();
    } catch (error) {
        if (error instanceof NoVideoError) {
            throw error;
        }
        throw new NoVideoError();
    }
};
