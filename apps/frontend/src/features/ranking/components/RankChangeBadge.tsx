'use client';

import { Tag } from 'antd';

import { getRankChangeType } from '../types/ranking.types';

interface RankChangeBadgeProps {
  rankChange: number | null;
  isNew: boolean;
}

export function RankChangeBadge({ rankChange, isNew }: RankChangeBadgeProps) {
  const type = getRankChangeType(rankChange, isNew);

  switch (type) {
    case 'new':
      return <Tag color="gold">NEW</Tag>;
    case 'up':
      return <Tag color="red">↑{rankChange}</Tag>;
    case 'down':
      return <Tag color="blue">↓{Math.abs(rankChange ?? 0)}</Tag>;
    case 'same':
      return <Tag color="default">-</Tag>;
    case 'unknown':
    default:
      return <Tag color="default">-</Tag>;
  }
}
