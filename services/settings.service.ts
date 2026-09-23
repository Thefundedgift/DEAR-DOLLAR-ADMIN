import { api } from '@/lib/api-client';
import type { SocialLinks } from '@/types';

export const settingsService = {
  async getSocialLinks(): Promise<SocialLinks> {
    const { data } = await api.get<SocialLinks>('/admin/settings/social-links');
    return data;
  },
  // Backend stores config + writes an audit log entry for every change
  async updateSocialLinks(input: SocialLinks): Promise<SocialLinks> {
    const { data } = await api.put<SocialLinks>('/admin/settings/social-links', input);
    return data;
  },
};
