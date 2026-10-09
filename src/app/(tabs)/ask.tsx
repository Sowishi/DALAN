import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import * as Location from 'expo-location';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Keyboard,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { DallyWelcome } from '@/components/dally-welcome';
import { Pressable } from '@/components/haptic-pressable';
import { LocationPicker, type PinnedLocation } from '@/components/location-picker';
import { HAZARD_META } from '@/constants/hazards';
import { Brand, Colors, Spacing } from '@/constants/theme';
import { useAssistant } from '@/context/assistant-provider';
import { useFloatingTabClearance } from '@/hooks/use-floating-tab-clearance';
import { useSpeakReplies } from '@/hooks/use-speak-replies';

const C = Colors.light;
const MAX_MESSAGE = 400;
const HEADER_BLOCK = 70;
const LANDSCAPE_BELOW_HEADER = 100;

export default function AskScreen() {
  const insets = useSafeAreaInsets();
  const tabClearance = useFloatingTabClearance();
  const {
    status,
    downloadProgress,
    loadProgress,
    error,
    messages,
    isGenerating,
    pendingReport,
    send,
    confirmPin,
    cancelPending,
    retry,
  } = useAssistant();
  const { stop: stopSpeaking, muted, setMuted } = useSpeakReplies(messages, isGenerating);
  const [draft, setDraft] = useState('');
  const [pin, setPin] = useState<PinnedLocation | null>(null);
  const [focusNonce, setFocusNonce] = useState(0);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const scrollRef = useRef<ScrollView>(null);
  const pickerOpen = pendingReport?.awaiting === 'location';

  useEffect(() => {
    const show = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      (event) => setKeyboardHeight(event.endCoordinates.height),
    );
    const hide = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => setKeyboardHeight(0),
    );
    return () => {
      show.remove();
      hide.remove();
    };
  }, []);

  const keyboardOpen = keyboardHeight > 0;
  const composerBottom = keyboardOpen ? keyboardHeight + Spacing.two : tabClearance;

  const locateOnGps = async () => {
    const { status: permission } = await Location.requestForegroundPermissionsAsync();
    if (permission !== Location.PermissionStatus.GRANTED) return;
    const fix = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.BestForNavigation,
    });
    setPin({ latitude: fix.coords.latitude, longitude: fix.coords.longitude });
    setFocusNonce((n) => n + 1);
  };

  useEffect(() => {
    if (!pickerOpen) return;
    void locateOnGps();
  }, [pickerOpen]);

  const ready = status === 'ready';
  const canSend = ready && !isGenerating && draft.trim().length > 0;
  const chatting = messages.length > 0;
  const showWelcomeArt = ready && !chatting && !pickerOpen;
  const backdropHeight = insets.top + HEADER_BLOCK + LANDSCAPE_BELOW_HEADER;

  const handleSend = () => {
    if (!canSend) return;
    const text = draft.trim();
    setDraft('');
    stopSpeaking();
    void send(text);
  };

  const handleSuggest = (prompt: string) => {
    if (!ready || isGenerating) return;
    setDraft('');
    stopSpeaking();
    void send(prompt);
  };

  return (
    <View style={styles.container}>
      {showWelcomeArt ? (
        <Image
          source={require('@/assets/images/dally_background.jpg')}
          style={[styles.backdrop, { height: backdropHeight }]}
          contentFit="cover"
          contentPosition="center"
          accessibilityIgnoresInvertColors
        />
      ) : null}
      <SafeAreaView edges={['top']} style={styles.flex}>
          <View style={styles.header}>
            <View style={styles.headerCopy}>
              <Text style={styles.headerTitle}>Dally</Text>
              <Text style={styles.headerSubtitle}>Your helper for road hindrances</Text>
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={muted ? 'Unmute Dally' : 'Mute Dally'}
              accessibilityState={{ selected: muted }}
              onPress={() => setMuted(!muted)}
              hitSlop={8}
              style={({ pressed }) => [styles.mute, pressed && styles.pressed]}>
              <Ionicons
                name={muted ? 'volume-mute' : 'volume-high'}
                size={22}
                color={muted ? C.textSecondary : Brand.green}
              />
            </Pressable>
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
              style={pickerOpen ? styles.threadShrink : styles.flex}
              contentContainerStyle={styles.thread}
              keyboardShouldPersistTaps="handled"
              keyboardDismissMode="interactive"
              showsVerticalScrollIndicator={false}
              onContentSizeChange={() => {
                if (messages.length > 0) {
                  scrollRef.current?.scrollToEnd({ animated: true });
                }
              }}>
              {messages.length === 0 ? (
                <DallyWelcome
                  disabled={!ready || isGenerating}
                  landscapeHeight={LANDSCAPE_BELOW_HEADER}
                  onSuggest={handleSuggest}
                />
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

          {pickerOpen && pendingReport ? (
            <View style={{ flex: 1, paddingBottom: tabClearance }}>
              <LocationPicker
                embedded
                visible
                location={pin}
                focusNonce={focusNonce}
                title={`File ${HAZARD_META[pendingReport.type].label}`}
                subtitle={pendingReport.description || 'Pin the exact spot'}
                confirmLabel="Post report"
                onChange={setPin}
                onRecenter={() => {
                  void locateOnGps();
                }}
                onClose={cancelPending}
                onConfirm={() => {
                  if (pin) void confirmPin(pin);
                }}
              />
            </View>
          ) : null}

          {pickerOpen ? null : (
          <View style={[styles.composer, { paddingBottom: composerBottom }]}>
            <View style={styles.inputShell}>
              <View style={styles.sparkle} accessibilityElementsHidden />
              <TextInput
                value={draft}
                onChangeText={setDraft}
                placeholder={ready ? 'Ask Dally…' : 'Dally is not ready yet'}
                placeholderTextColor={C.textSecondary}
                editable={ready && !isGenerating}
                multiline
                maxLength={MAX_MESSAGE}
                returnKeyType="send"
                onSubmitEditing={handleSend}
                blurOnSubmit
                accessibilityLabel="Message"
                onFocus={() => {
                  requestAnimationFrame(() => {
                    scrollRef.current?.scrollToEnd({ animated: true });
                  });
                }}
                style={styles.input}
              />
            </View>
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
          )}
      </SafeAreaView>
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
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
  },
  flex: { flex: 1, backgroundColor: 'transparent' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.two,
    paddingBottom: Spacing.one,
    gap: Spacing.two,
    backgroundColor: 'transparent',
  },
  headerCopy: { flex: 1, gap: 4 },
  mute: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.9)',
  },
  headerTitle: { fontSize: 34, fontWeight: '700', color: C.text, letterSpacing: -0.8 },
  headerSubtitle: { fontSize: 16, color: C.textSecondary },
  threadShrink: {
    flexGrow: 0,
    flexShrink: 1,
    maxHeight: 180,
  },
  thread: {
    flexGrow: 1,
    paddingHorizontal: Spacing.three,
    paddingBottom: Spacing.three,
    gap: Spacing.two,
  },
  bubble: {
    maxWidth: '84%',
    paddingHorizontal: Spacing.three,
    paddingVertical: 10,
  },
  bubbleUser: {
    alignSelf: 'flex-end',
    backgroundColor: Brand.green,
    borderRadius: 20,
    borderBottomRightRadius: 6,
  },
  bubbleAssistant: {
    alignSelf: 'flex-start',
    backgroundColor: C.backgroundElement,
    borderRadius: 20,
    borderBottomLeftRadius: 6,
  },
  bubbleUserText: { fontSize: 16, lineHeight: 22, color: Brand.white },
  bubbleAssistantText: { fontSize: 16, lineHeight: 22, color: C.text },
  composer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.two,
    paddingBottom: Spacing.two,
  },
  inputShell: {
    flex: 1,
    minHeight: 52,
    maxHeight: 120,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderRadius: 26,
    paddingLeft: 18,
    paddingRight: 12,
    paddingVertical: 4,
    backgroundColor: '#F4F6F5',
  },
  sparkle: {
    width: 8,
    height: 8,
    backgroundColor: '#8EBFB3',
    transform: [{ rotate: '45deg' }],
  },
  input: {
    flex: 1,
    minHeight: 44,
    maxHeight: 112,
    paddingVertical: 10,
    fontSize: 16,
    lineHeight: 22,
    color: C.text,
  },
  send: {
    width: 52,
    height: 52,
    borderRadius: 26,
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
