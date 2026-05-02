import { atom } from 'nanostores';

export const currentVideo = atom<string | null>(null);
export const activeCodeTab = atom<string>('react');
