import { ActionRowBuilder, ButtonStyle, MessageFlags } from 'discord.js';
import { noSkipsView } from '../../question_views/noSkipsView';

describe('noSkipsView', () => {
    it('adds a Premium button for the skip pack SKU', () => {
        const view = noSkipsView('sku-123');

        expect(view.flags).toBe(MessageFlags.IsComponentsV2);
        expect(view.components).toHaveLength(2);

        const row = (view.components![1] as unknown as ActionRowBuilder).toJSON() as any;
        expect(row.components[0]).toEqual(expect.objectContaining({ style: ButtonStyle.Premium, sku_id: 'sku-123' }));
    });

    it('falls back to the vote link only when there is no skip pack SKU', () => {
        const view = noSkipsView(null);

        expect(view.components).toHaveLength(1);
    });
});
