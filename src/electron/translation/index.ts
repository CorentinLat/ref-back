import fr from './fr.json';

export default function translate(key: string): string {
    // @ts-ignore
    return fr[key.toUpperCase()] || key;
}
