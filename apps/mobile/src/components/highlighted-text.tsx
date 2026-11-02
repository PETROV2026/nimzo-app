import { Text } from 'react-native';
import { splitByMatches } from '@/notes/highlight';

type HighlightedTextProps = {
  text: string;
  term: string;
  className?: string;
  numberOfLines?: number;
};

export function HighlightedText({ text, term, className, numberOfLines }: HighlightedTextProps) {
  const parts = splitByMatches(text, term);
  return (
    <Text numberOfLines={numberOfLines} className={className}>
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
