import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
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
import Animated, {
  Easing,
  interpolate,
  ReduceMotion,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import { Pressable } from '@/components/haptic-pressable';
import { DALLY_SUGGESTIONS } from '@/components/dally-welcome';
import { HAZARD_META } from '@/constants/hazards';
import { Brand, Colors, Spacing } from '@/constants/theme';
import { useAssistant } from '@/context/assistant-provider';

const C = Colors.light;
const MAX_MESSAGE = 400;
const FAB_SIZE = 64;
const FAB_EXPANDED = 168;
const HINT = 'Ask Dally';

const timing = (to: number, duration: number) =>
  withTiming(to, {
    duration,
    easing: Easing.out(Easing.cubic),
    reduceMotion: ReduceMotion.System,
  });

type ActivityDallyChatProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  location: { latitude: number; longitude: number } | null;
  fabBottom: number;
};

export function ActivityDallyChat({
  open,
  onOpenChange,
  location,
  fabBottom,
}: ActivityDallyChatProps) {
  const {
    status,
    error,
    messages,
    isGenerating,
    pendingReport,
    send,
    confirmPin,
    cancelPending,
    retry,
  } = useAssistant();
  const [draft, setDraft] = useState('');
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const scrollRef = useRef<ScrollView>(null);
  const hint = useSharedValue(0);

  useEffect(() => {
    if (open) {
      hint.value = 0;
      return;
    }
    hint.value = withRepeat(
      withSequence(
        withDelay(800, timing(1, 460)),
        withDelay(2600, timing(0, 340)),
        withDelay(7000, timing(0, 1)),
      ),
      -1,
      false,
    );
    return () => {
      hint.value = 0;
    };
  }, [hint, open]);

  const pillStyle = useAnimatedStyle(() => ({
    width: interpolate(hint.value, [0, 1], [FAB_SIZE, FAB_EXPANDED]),
  }));
  const labelStyle = useAnimatedStyle(() => ({
    opacity: interpolate(hint.value, [0, 0.45, 1], [0, 0, 1]),
    transform: [{ translateX: interpolate(hint.value, [0, 1], [16, 0]) }],
  }));

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

  const ready = status === 'ready';
  const canSend = ready && !isGenerating && draft.trim().length > 0;
  const pickerOpen = pendingReport?.awaiting === 'location';
  const sheetBottom = keyboardHeight > 0 ? keyboardHeight : 0;

  const handleSend = () => {
    if (!canSend) return;
    const text = draft.trim();
    setDraft('');
    void send(text);
  };

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
      {open ? null : (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Ask Dally"
          onPress={() => onOpenChange(true)}
          style={[styles.fab, { bottom: fabBottom }]}>
          <Animated.View style={[styles.pill, pillStyle]}>
            <Animated.Text numberOfLines={1} style={[styles.hint, labelStyle]}>
              {HINT}
            </Animated.Text>
            <View style={styles.fabFace}>
              <Image
                source={require('@/assets/images/dally_mascot.png')}
                style={styles.fabMascot}
                contentFit="contain"
                accessibilityIgnoresInvertColors
              />
            </View>
          </Animated.View>
        </Pressable>
      )}

      {open ? (
        <View style={[styles.sheet, { paddingBottom: Math.max(sheetBottom, 12) }]}>
          <View style={styles.sheetHead}>
            <View style={styles.sheetBrand}>
              <View style={styles.sheetAvatar}>
                <Image
                  source={require('@/assets/images/dally_mascot.png')}
                  style={styles.sheetMascot}
                  contentFit="contain"
                  accessibilityIgnoresInvertColors
                />
              </View>
              <View style={styles.sheetCopy}>
                <Text style={styles.sheetTitle}>Dally</Text>
                <Text style={styles.sheetSubtitle}>Ask about hazards on your route</Text>
              </View>
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Close Dally"
              onPress={() => onOpenChange(false)}
              style={styles.closeBtn}>
              <Ionicons name="close" size={22} color={C.text} />
            </Pressable>
          </View>

          {status === 'downloading' || status === 'loading' ? (
            <View style={styles.status}>
              <ActivityIndicator color={Brand.green} />
              <Text style={styles.statusText}>
                {status === 'downloading' ? 'Downloading Dally…' : 'Loading Dally…'}
              </Text>
            </View>
          ) : status === 'error' ? (
            <View style={styles.status}>
              <Text style={styles.statusText}>{error ?? 'Dally is unavailable.'}</Text>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Try again"
                onPress={() => void retry()}
                style={styles.retry}>
                <Text style={styles.retryLabel}>Try again</Text>
              </Pressable>
            </View>
          ) : (
            <ScrollView
              ref={scrollRef}
              style={styles.thread}
              contentContainerStyle={styles.threadContent}
              keyboardShouldPersistTaps="handled"
              keyboardDismissMode="interactive"
              showsVerticalScrollIndicator={false}
              onContentSizeChange={() => {
                scrollRef.current?.scrollToEnd({ animated: true });
              }}>
              {messages.length === 0 ? (
                <View style={styles.empty}>
                  <Text style={styles.emptyTitle}>Need a hand while you move?</Text>
                  <Text style={styles.emptyBody}>
                    Ask about flooding, debris, or a safer way around a report.
                  </Text>
                  <View style={styles.chips}>
                    {DALLY_SUGGESTIONS.map((item) => (
                      <Pressable
                        key={item.key}
                        accessibilityRole="button"
                        accessibilityLabel={item.prompt}
                        disabled={!ready || isGenerating}
                        onPress={() => void send(item.prompt)}
                        style={({ pressed }) => [styles.chip, pressed && styles.pressed]}>
                        <Text style={styles.chipLabel}>{item.prompt}</Text>
                      </Pressable>
                    ))}
                  </View>
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

          {pickerOpen && pendingReport ? (
            <View style={styles.pinBar}>
              <Text style={styles.pinCopy}>
                File {HAZARD_META[pendingReport.type].label} at your current spot?
              </Text>
              <View style={styles.pinActions}>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Cancel report"
                  onPress={cancelPending}
                  style={styles.pinCancel}>
                  <Text style={styles.pinCancelLabel}>Cancel</Text>
                </Pressable>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Use current location"
                  disabled={!location}
                  onPress={() => {
                    if (location) void confirmPin(location);
                  }}
                  style={[styles.pinConfirm, !location && styles.pinDisabled]}>
                  <Text style={styles.pinConfirmLabel}>Use current location</Text>
                </Pressable>
              </View>
            </View>
          ) : null}

          {status === 'ready' ? (
            <View style={styles.composer}>
              <View style={styles.inputShell}>
                <TextInput
                  value={draft}
                  onChangeText={setDraft}
                  placeholder="Ask Dally…"
                  placeholderTextColor={C.textSecondary}
                  editable={!isGenerating}
                  multiline
                  maxLength={MAX_MESSAGE}
                  returnKeyType="send"
                  onSubmitEditing={handleSend}
                  blurOnSubmit
                  accessibilityLabel="Message"
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
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    right: Spacing.three,
    zIndex: 30,
    elevation: 30,
  },
  pill: {
    height: FAB_SIZE,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingLeft: 16,
    paddingRight: 5,
    gap: 8,
    borderRadius: FAB_SIZE / 2,
    overflow: 'hidden',
    backgroundColor: Brand.white,
    shadowColor: '#000000',
    shadowOpacity: 0.18,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 12,
  },
  hint: {
    flexShrink: 0,
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: -0.2,
    color: Brand.green,
  },
  fabFace: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: '#CEF9E8',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  fabMascot: { width: 44, height: 44 },
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    top: '28%',
    zIndex: 40,
    elevation: 40,
    backgroundColor: Brand.white,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: Spacing.three,
    paddingTop: 12,
    shadowColor: '#000000',
    shadowOpacity: 0.16,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: -4 },
  },
  sheetHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  sheetBrand: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  sheetAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#CEF9E8',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  sheetMascot: { width: 32, height: 32 },
  sheetCopy: { flex: 1, gap: 2 },
  sheetTitle: { fontSize: 18, fontWeight: '700', color: C.text, letterSpacing: -0.3 },
  sheetSubtitle: { fontSize: 13, color: C.textSecondary },
  closeBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: C.backgroundElement,
  },
  status: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
    paddingHorizontal: Spacing.three,
  },
  statusText: { fontSize: 15, lineHeight: 21, color: C.textSecondary, textAlign: 'center' },
  retry: {
    height: 40,
    paddingHorizontal: 16,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Brand.green,
  },
  retryLabel: { fontSize: 15, fontWeight: '700', color: Brand.white },
  thread: { flex: 1 },
  threadContent: {
    flexGrow: 1,
    paddingVertical: Spacing.two,
    gap: Spacing.two,
  },
  empty: { gap: 10, paddingTop: Spacing.two },
  emptyTitle: { fontSize: 20, fontWeight: '700', color: C.text, letterSpacing: -0.3 },
  emptyBody: { fontSize: 15, lineHeight: 21, color: C.textSecondary },
  chips: { gap: 8, marginTop: 6 },
  chip: {
    minHeight: 44,
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#F4F7F6',
    justifyContent: 'center',
  },
  chipLabel: { fontSize: 15, fontWeight: '600', color: C.text },
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
  pinBar: {
    gap: 10,
    paddingVertical: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#E8EBEA',
  },
  pinCopy: { fontSize: 14, lineHeight: 20, color: C.text },
  pinActions: { flexDirection: 'row', gap: 8 },
  pinCancel: {
    height: 44,
    paddingHorizontal: 16,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: C.backgroundElement,
  },
  pinCancelLabel: { fontSize: 15, fontWeight: '600', color: C.text },
  pinConfirm: {
    flex: 1,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Brand.green,
  },
  pinConfirmLabel: { fontSize: 15, fontWeight: '700', color: Brand.white },
  pinDisabled: { opacity: 0.4 },
  composer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingTop: 8,
  },
  inputShell: {
    flex: 1,
    minHeight: 48,
    maxHeight: 100,
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 4,
    backgroundColor: '#F4F6F5',
    justifyContent: 'center',
  },
  input: {
    minHeight: 40,
    maxHeight: 92,
    paddingVertical: 8,
    fontSize: 16,
    lineHeight: 22,
    color: C.text,
  },
  send: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Brand.green,
  },
  sendDisabled: { opacity: 0.4 },
  pressed: { opacity: 0.7 },
});
