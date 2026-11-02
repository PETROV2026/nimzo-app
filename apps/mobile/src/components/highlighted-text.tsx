import { splitByMatches } from '@nimzo/shared';
import { Text, type TextProps } from 'react-native';

type HighlightedTextProps = Omit<TextProps, 'children'> & {
  text: string;
  term?: string;
};

export function HighlightedText({ text, term = '', ...props }: HighlightedTextProps) {
  const parts = splitByMatches(text, term);
  return (
    <Text {...props}>
      {parts.map((part, index) =>
        part.match ? (
          <Text key={index} className="rounded bg-accent font-sans-semibold text-on-accent">
            {part.text}
          </Text>
        ) : (
          part.text
        ),
      )}
    </Text>
  );
}
