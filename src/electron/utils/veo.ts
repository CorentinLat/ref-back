import axios from 'axios';

import { NoVideoError } from '../domain/error/NoVideoError';

export async function getVideoUrlFromVeo(veoLink: string): Promise<string> {
    const response = await axios.get(veoLink);

    try {
        const matches = response.data.thumbnail.match('https://c.veocdn.com/([a-z]|[0-9]|-)+/standard/machine/([a-z]|[0-9])+/');
        if (matches?.length) {
            return `${matches[0]}video.mp4`;
        }

        throw new Error();
    } catch (error) {
        throw new NoVideoError();
    }
}
