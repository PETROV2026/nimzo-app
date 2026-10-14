import { Redirect } from 'expo-router';

// The app has no authenticated home screen yet, so "/" sends everyone straight to "/login".
export default function Index() {
  return <Redirect href="/login" />;
}
