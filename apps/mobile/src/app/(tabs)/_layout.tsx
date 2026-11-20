import { Tabs } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useWindowDimensions, View } from 'react-native';
import { useSession } from '@/auth/session-provider';
import { useClientsSync } from '@/clients/clients-sync';
import { AppHeader } from '@/components/app-header';
import { HeaderIconButton } from '@/components/header-icon-button';
import { NavigationBar } from '@/components/navigation-bar';
import { SyncToast } from '@/components/sync-toast';
import { useToast } from '@/components/toast';
import { FeedbackDialog } from '@/feedback/feedback-dialog';
import { useFeedbackSync } from '@/feedback/feedback-sync';
import { closeFeedback, openFeedback, useFeedbackScreen } from '@/feedback/open-feedback';
import { useOnline } from '@/lib/use-online';
import { useOpenNoteFromNotification } from '@/notes/reminders';
import { colors } from '@/theme';
import { useServiceFormsSync } from '@/service-forms/service-forms-sync';

const railMinWidth = 900;

export default function TabsLayout() {
  const { width, height } = useWindowDimensions();
  const variant = width > height && width >= railMinWidth ? 'rail' : 'dock';

  const session = useSession();
  const technicianId = session.status === 'signed-in' ? session.session.user.id : '';
  useClientsSync(technicianId);
  useServiceFormsSync(technicianId);
  useOpenNoteFromNotification();
  useFeedbackSync(technicianId);
  const feedbackScreen = useFeedbackScreen();
  const online = useOnline();
  const { toast, showToast } = useToast();
  return (
    <>
      <StatusBar style="light" />
      <Tabs
        tabBar={(props) => <NavigationBar {...props} variant={variant} />}
        screenLayout={({ route, children }) =>
          route.name === 'profile' ? (
            children
          ) : (
            <View className="flex-1 overflow-hidden rounded-t-[28px] bg-canvas">{children}</View>
          )
        }
        screenOptions={{
          tabBarPosition: variant === 'rail' ? 'left' : 'bottom',
          header: ({ options, route }) => {
            const title = typeof options.title === 'string' ? options.title : route.name;
            const search =
              typeof options.headerTitle === 'function'
                ? options.headerTitle({ children: title })
                : undefined;
            return (
              <AppHeader
                title={title}
                variant={variant}
                actions={
                  <>
                    {options.headerRight?.({ canGoBack: false })}
                    {search ? null : (
                      <HeaderIconButton
                        icon="chatbubble-ellipses-outline"
                        label="Enviar comentarios"
                        onPress={() => openFeedback(route.name)}
                      />
                    )}
                  </>
                }
                search={search}
              />
            );
          },
          sceneStyle: { backgroundColor: colors.muted },
        }}
      >
        <Tabs.Screen name="services" options={{ title: 'Servicios' }} />
        <Tabs.Screen name="clients" options={{ title: 'Clientes' }} />
        <Tabs.Screen name="notes" options={{ title: 'Notas' }} />
        <Tabs.Screen name="profile" options={{ title: 'Perfil', headerShown: false }} />
        <Tabs.Screen name="index" options={{ href: null }} />
      </Tabs>
      <SyncToast />
      {feedbackScreen && technicianId ? (
        <FeedbackDialog
          technicianId={technicianId}
          screen={feedbackScreen}
          onSent={() => {
            closeFeedback();
            showToast(
              'Gracias por tu comentario',
              online ? 'Lo recibirá el equipo de Nimzo.' : 'Se enviará cuando haya conexión.',
            );
          }}
          onClose={closeFeedback}
        />
      ) : null}
      {toast}
    </>
  );
}
