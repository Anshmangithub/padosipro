import { groupByCategory } from '../src/utils/groupByCategory';

describe('groupByCategory', () => {
  it('groups items under their category in first-seen order', () => {
    const items = [
      { id: '1', category: 'Cleaning' },
      { id: '2', category: 'Repairs' },
      { id: '3', category: 'Cleaning' },
    ];

    const sections = groupByCategory(items);

    expect(sections).toEqual([
      { title: 'Cleaning', data: [items[0], items[2]] },
      { title: 'Repairs', data: [items[1]] },
    ]);
  });

  it('returns an empty array for an empty input', () => {
    expect(groupByCategory([])).toEqual([]);
  });
});
