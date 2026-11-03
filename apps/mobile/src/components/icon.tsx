import { MaterialCommunityIcons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';

export const Icon = MaterialCommunityIcons;

export type IconName = ComponentProps<typeof MaterialCommunityIcons>['name'];
