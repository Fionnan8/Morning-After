import { FontAwesome, Ionicons } from '@expo/vector-icons';
import { ComponentProps } from 'react';

import { Night } from '@/constants/night';

type IoniconName = ComponentProps<typeof Ionicons>['name'];
type FAName = ComponentProps<typeof FontAwesome>['name'];

/** Crisp line/solid UI icon (Ionicons) — replaces generic emoji glyphs. */
export function Icon({
  name,
  size = 24,
  color = Night.text,
}: {
  name: IoniconName;
  size?: number;
  color?: string;
}) {
  return <Ionicons name={name} size={size} color={color} />;
}

/** Brand glyph (FontAwesome) for share channels. */
export function BrandIcon({
  name,
  size = 24,
  color = Night.text,
}: {
  name: FAName;
  size?: number;
  color?: string;
}) {
  return <FontAwesome name={name} size={size} color={color} />;
}
