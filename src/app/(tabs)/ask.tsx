import { Ionicons } from '@expo/vector-icons';
import { useRef, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { SafeAreaView } from 'react-native-safe-area-context';

import { Pressable } from '@/components/haptic-pressable';
import { Brand, Colors, Spacing } from '@/constants/theme';
import { useFloatingTabClearance } from '@/hooks/use-floating-tab-clearance';
import { useLocalAssistant } from '@/hooks/use-local-assistant';

const C = Colors.light;
const MAX_MESSAGE = 400;

export default function AskScreen() {
  const tabClearance = useFloatingTabClearance();
  const { status, downloadProgress, loadProgress, error, messages, isGenerating, send, retry } =
    useLocalAssistant();
  const [draft, setDraft] = useState('');
  const scrollRef = useRef<ScrollView>(null);

  const ready = status === 'ready';
  const canSend = ready && !isGenerating && draft.trim().length > 0;

  const handleSend = () => {
    if (!canSend) return;
    const text = draft.trim();
    setDraft('');
    void send(text);
  };

  return (
    <View style={styles.container}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <SafeAreaView edges={['top']} style={styles.flex}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Ask</Text>
            <Text style={styles.headerSubtitle}>Talk about DALAN on this phone</Text>
          </View>

          {status === 'downloading' || status === 'loading' ? (
            <StatusPanel
              title={status === 'downloading' ? 'Downloading the local model' : 'Loading the local model'}
              detail={
                status === 'downloading'
                  ? 'About 400 MB. This happens once, then chat stays on the device.'
                  : 'Reading the model into memory. This can take a moment.'
              }
              progress={status === 'downloading' ? downloadProgress : loadProgress}
            />
          ) : status === 'error' ? (
            <ErrorPanel message={error ?? 'Something went wrong.'} onRetry={() => void retry()} />
          ) : (
            <ScrollView
              ref={scrollRef}
              style={styles.flex}
              contentContainerStyle={styles.thread}
              keyboardShouldPersistTaps="handled"
              onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}>
              {messages.length === 0 ? (
                <View style={styles.empty}>
                  <Text style={styles.emptyTitle}>Ask about this app</Text>
                  <Text style={styles.emptyBody}>
                    Try “How do I report a flood?” or “What does Explore show?”
                  </Text>
                </View>
              ) : (
                messages.map((message) => (
                  <View
                    key={message.id}
                    style={[
                      styles.bubble,
                      message.role === 'user' ? styles.bubbleUser : styles.bubbleAssistant,
                    ]}>
                    <Text
                      style={
                        message.role === 'user' ? styles.bubbleUserText : styles.bubbleAssistantText
                      }>
                      {message.content || (isGenerating ? '…' : '')}
                    </Text>
                  </View>
                ))
              )}
            </ScrollView>
          )}

          <View style={[styles.composer, { paddingBottom: tabClearance }]}>
            <TextInput
              value={draft}
              onChangeText={setDraft}
              placeholder={ready ? 'Ask about DALAN…' : 'Model is not ready yet'}
              placeholderTextColor={C.textSecondary}
              editable={ready && !isGenerating}
              multiline
              maxLength={MAX_MESSAGE}
              returnKeyType="send"
              onSubmitEditing={handleSend}
              blurOnSubmit
              accessibilityLabel="Message"
              style={styles.input}
            />
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Send message"
              accessibilityState={{ disabled: !canSend, busy: isGenerating }}
              disabled={!canSend}
              onPress={handleSend}
              style={({ pressed }) => [
                styles.send,
                !canSend && styles.sendDisabled,
                pressed && canSend && styles.pressed,
              ]}>
              {isGenerating ? (
                <ActivityIndicator color={Brand.white} />
              ) : (
                <Ionicons name="arrow-up" size={20} color={Brand.white} />
              )}
            </Pressable>
          </View>
        </SafeAreaView>
      </KeyboardAvoidingView>
    </View>
  );
}

function StatusPanel({
  title,
  detail,
  progress,
}: {
  title: string;
  detail: string;
  progress: number;
}) {
  const percent = Math.round(progress * 100);

  return (
    <View style={styles.panel}>
      <ActivityIndicator color={Brand.green} size="large" />
      <Text style={styles.panelTitle}>{title}</Text>
      <Text style={styles.panelDetail}>{detail}</Text>
      <View style={styles.track} accessibilityRole="progressbar" accessibilityValue={{ now: percent, min: 0, max: 100 }}>
        <View style={[styles.fill, { width: `${percent}%` }]} />
      </View>
      <Text style={styles.percent}>{percent}%</Text>
    </View>
  );
}

function ErrorPanel({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <View style={styles.panel}>
      <Text style={styles.panelTitle}>Could not start the local model</Text>
      <Text style={styles.panelDetail}>{message}</Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Try again"
        onPress={onRetry}
        style={({ pressed }) => [styles.retry, pressed && styles.pressed]}>
        <Text style={styles.retryLabel}>Try again</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.background },
  flex: { flex: 1 },
  header: {
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.two,
    paddingBottom: Spacing.three,
    gap: Spacing.half,
  },
  headerTitle: { fontSize: 32, fontWeight: '700', color: C.text, letterSpacing: -0.5 },
  headerSubtitle: { fontSize: 15, color: C.textSecondary },
  thread: {
    flexGrow: 1,
    paddingHorizontal: Spacing.three,
    paddingBottom: Spacing.three,
    gap: Spacing.two,
  },
  empty: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: Spacing.two,
    gap: Spacing.two,
  },
  emptyTitle: { fontSize: 22, fontWeight: '600', color: C.text, letterSpacing: -0.3 },
  emptyBody: { fontSize: 15, lineHeight: 21, color: C.textSecondary },
  bubble: {
    maxWidth: '84%',
    borderRadius: Spacing.three,
    paddingHorizontal: Spacing.three,
    paddingVertical: 10,
  },
  bubbleUser: {
    alignSelf: 'flex-end',
    backgroundColor: Brand.green,
  },
  bubbleAssistant: {
    alignSelf: 'flex-start',
    backgroundColor: C.backgroundElement,
  },
  bubbleUserText: { fontSize: 16, lineHeight: 22, color: Brand.white },
  bubbleAssistantText: { fontSize: 16, lineHeight: 22, color: C.text },
  composer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: Spacing.two,
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.two,
    paddingBottom: Spacing.two,
  },
  input: {
    flex: 1,
    minHeight: 44,
    maxHeight: 120,
    borderRadius: Spacing.three,
    paddingHorizontal: Spacing.three,
    paddingVertical: 10,
    fontSize: 16,
    lineHeight: 22,
    color: C.text,
    backgroundColor: C.backgroundElement,
  },
  send: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Brand.green,
  },
  sendDisabled: { opacity: 0.4 },
  panel: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: Spacing.four,
    gap: Spacing.three,
  },
  panelTitle: { fontSize: 22, fontWeight: '600', color: C.text, letterSpacing: -0.3 },
  panelDetail: { fontSize: 15, lineHeight: 21, color: C.textSecondary },
  track: {
    height: 4,
    borderRadius: 2,
    backgroundColor: C.backgroundSelected,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    backgroundColor: Brand.green,
  },
  percent: { fontSize: 13, color: C.textSecondary },
  retry: {
    alignSelf: 'flex-start',
    height: 44,
    paddingHorizontal: Spacing.three,
    borderRadius: Spacing.three,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Brand.green,
  },
  retryLabel: { fontSize: 16, fontWeight: '700', color: Brand.white },
  pressed: { opacity: 0.7 },
});
