import { Text, View } from 'react-native';
import { initials } from '@/lib/initials';

const sizes = {
  md: { box: 'h-14 w-14 rounded-xl', text: 'text-lg' },
  lg: { box: 'h-20 w-20 rounded-2xl', text: 'text-3xl' },
};

type ClientMonogramProps = {
  name: string;
  active?: boolean;
  size?: keyof typeof sizes;
};

export function ClientMonogram({ name, active = true, size = 'md' }: ClientMonogramProps) {
  const style = sizes[size];
  return (
    <View
      importantForAccessibility="no-hide-descendants"
      className={`items-center justify-center ${style.box} ${active ? 'bg-primary/15' : 'bg-border'}`}
    >
      <Text
        className={`font-sans-bold ${style.text} ${active ? 'text-primary-strong' : 'text-muted'}`}
      >
        {initials(name)}
      </Text>
    </View>
  );
}
