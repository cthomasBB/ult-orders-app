import { useRouter } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Image,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useCreateOrderStore, makeDraftMedia } from "@/features/orders/createOrderStore";
import { pickImages, pickVideo, takePhoto } from "@/services/storage";
import { Colors } from "@/constants/colors";

const { width: SCREEN_W } = Dimensions.get("window");
const THUMB_SIZE = 100;
const MAX_PHOTOS = 3;

// ─── Filmstrip ────────────────────────────────────────────────────────────────

function FilmStrip() {
  const { draft, removeMedia } = useCreateOrderStore();
  if (draft.media.length === 0) return null;

  return (
    <View style={filmStyles.wrap}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={filmStyles.row}
      >
        {draft.media.map((m) => (
          <View key={m.id} style={filmStyles.thumb}>
            <Image source={{ uri: m.localUri }} style={filmStyles.thumbImg} />
            {m.type === "video" && (
              <View style={filmStyles.videoOverlay}>
                <Ionicons name="play" size={18} color={Colors.white} />
              </View>
            )}
            <Pressable
              style={filmStyles.removeBtn}
              onPress={() => removeMedia(m.id)}
              hitSlop={6}
            >
              <Ionicons name="close-circle" size={20} color={Colors.white} />
            </Pressable>
          </View>
        ))}

        {/* Ghost slot showing remaining capacity */}
        {draft.media.length < MAX_PHOTOS && !draft.media.some((m) => m.type === "video") && (
          <View style={filmStyles.ghost}>
            <Ionicons name="add" size={22} color={Colors.inkDisabled} />
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const filmStyles = StyleSheet.create({
  wrap: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.border,
    backgroundColor: Colors.card,
    paddingVertical: 14,
  },
  row: { paddingHorizontal: 16, gap: 10 },
  thumb: {
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: Colors.border,
    position: "relative",
  },
  thumbImg: { width: "100%", height: "100%" },
  videoOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.35)",
    alignItems: "center",
    justifyContent: "center",
  },
  removeBtn: {
    position: "absolute",
    top: 4,
    right: 4,
    backgroundColor: "rgba(0,0,0,0.5)",
    borderRadius: 10,
  },
  ghost: {
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Colors.border,
    borderStyle: "dashed",
    alignItems: "center",
    justifyContent: "center",
  },
});

// ─── Option tile ──────────────────────────────────────────────────────────────

function OptionTile({
  icon,
  title,
  subtitle,
  onPress,
  disabled,
}: {
  icon: React.ComponentProps<typeof Ionicons>["name"];
  title: string;
  subtitle: string;
  onPress: () => void;
  disabled?: boolean;
}) {
  return (
    <Pressable
      style={({ pressed }) => [
        tileStyles.tile,
        pressed && !disabled && tileStyles.tilePressed,
        disabled && tileStyles.tileDisabled,
      ]}
      onPress={onPress}
      disabled={disabled}
    >
      <View style={tileStyles.iconWrap}>
        <Ionicons
          name={icon}
          size={28}
          color={disabled ? Colors.inkDisabled : Colors.accent}
        />
      </View>
      <Text style={[tileStyles.title, disabled && tileStyles.textDisabled]}>
        {title}
      </Text>
      <Text style={tileStyles.sub}>{subtitle}</Text>
    </Pressable>
  );
}

const tileStyles = StyleSheet.create({
  tile: {
    flex: 1,
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 18,
    alignItems: "center",
    gap: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  tilePressed: { backgroundColor: Colors.accentLight, borderColor: Colors.accent },
  tileDisabled: { opacity: 0.4 },
  iconWrap: {
    width: 54,
    height: 54,
    borderRadius: 16,
    backgroundColor: Colors.accentLight,
    alignItems: "center",
    justifyContent: "center",
  },
  title: { fontSize: 14, fontWeight: "700", color: Colors.ink },
  sub: { fontSize: 11, color: Colors.inkSecondary, textAlign: "center" },
  textDisabled: { color: Colors.inkDisabled },
});

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function Step3MediaScreen() {
  const router = useRouter();
  const { draft, addMedia, goToStep } = useCreateOrderStore();
  const [isLoading, setIsLoading] = useState(false);

  const hasVideo = draft.media.some((m) => m.type === "video");
  const photoCount = draft.media.filter((m) => m.type === "photo").length;
  const atPhotoMax = photoCount >= MAX_PHOTOS;
  const hasAnyMedia = draft.media.length > 0;

  const handlePickPhotos = async () => {
    if (hasVideo || atPhotoMax) return;
    setIsLoading(true);
    try {
      const remaining = MAX_PHOTOS - photoCount;
      const assets = await pickImages(remaining);
      for (const asset of assets) {
        addMedia(makeDraftMedia(asset));
      }
    } catch (e: any) {
      if (!e.message.includes("cancelled")) {
        Alert.alert("Error", e.message ?? "Could not pick photos.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handlePickVideo = async () => {
    if (hasVideo || draft.media.length > 0) {
      Alert.alert(
        "Video only",
        "Remove your photos first to add a video, or keep photos only."
      );
      return;
    }
    setIsLoading(true);
    try {
      const asset = await pickVideo();
      if (asset) addMedia(makeDraftMedia(asset));
    } catch (e: any) {
      if (!e.message.includes("cancelled")) {
        Alert.alert("Error", e.message ?? "Could not pick video.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleTakePhoto = async () => {
    if (hasVideo || atPhotoMax) return;
    setIsLoading(true);
    try {
      const asset = await takePhoto();
      if (asset) addMedia(makeDraftMedia(asset));
    } catch (e: any) {
      if (!e.message.includes("cancelled")) {
        Alert.alert("Permission", e.message ?? "Could not open camera.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleNext = () => {
    goToStep(4);
    router.push("/create/details");
  };

  const handleBack = () => {
    goToStep(2);
    router.back();
  };

  return (
    <View style={styles.flex}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable style={styles.backBtn} onPress={handleBack} hitSlop={12}>
          <Ionicons name="arrow-back" size={20} color={Colors.ink} />
        </Pressable>
        <Text style={styles.headerTitle}>Add Media</Text>
        <View style={{ width: 38 }} />
      </View>

      {/* Filmstrip */}
      {hasAnyMedia && <FilmStrip />}

      {/* Options */}
      <ScrollView contentContainerStyle={styles.content}>
        {/* Status banner */}
        {hasVideo ? (
          <View style={styles.infoBanner}>
            <Ionicons name="videocam" size={15} color={Colors.accent} />
            <Text style={styles.infoText}>1 video added (max 15 sec)</Text>
          </View>
        ) : photoCount > 0 ? (
          <View style={styles.infoBanner}>
            <Ionicons name="images" size={15} color={Colors.accent} />
            <Text style={styles.infoText}>
              {photoCount} of {MAX_PHOTOS} photos · {atPhotoMax ? "Maximum reached" : `${MAX_PHOTOS - photoCount} more allowed`}
            </Text>
          </View>
        ) : (
          <Text style={styles.hint}>
            Add up to 3 photos or 1 short video (max 15s).{"\n"}
            Media appears in a 4:3 frame in your ULT order.
          </Text>
        )}

        {/* Option tiles */}
        <View style={styles.tilesRow}>
          <OptionTile
            icon="images-outline"
            title="Photos"
            subtitle={`Up to ${MAX_PHOTOS - photoCount} more`}
            onPress={handlePickPhotos}
            disabled={hasVideo || atPhotoMax || isLoading}
          />
          <OptionTile
            icon="videocam-outline"
            title="Video"
            subtitle="1 clip, max 15s"
            onPress={handlePickVideo}
            disabled={hasVideo || photoCount > 0 || isLoading}
          />
        </View>

        {/* Camera shortcut */}
        <Pressable
          style={({ pressed }) => [
            styles.cameraBtn,
            pressed && styles.cameraBtnPressed,
            (hasVideo || atPhotoMax || isLoading) && styles.cameraBtnDisabled,
          ]}
          onPress={handleTakePhoto}
          disabled={hasVideo || atPhotoMax || isLoading}
        >
          {isLoading ? (
            <ActivityIndicator size="small" color={Colors.accent} />
          ) : (
            <>
              <Ionicons name="camera-outline" size={20} color={Colors.accent} />
              <Text style={styles.cameraBtnText}>Open Camera</Text>
            </>
          )}
        </Pressable>

        {/* Skip note */}
        <Text style={styles.skipNote}>
          Media is optional — you can post without it.
        </Text>
      </ScrollView>

      {/* Footer */}
      <View style={styles.footer}>
        <Pressable style={styles.nextBtn} onPress={handleNext}>
          <Text style={styles.nextBtnText}>
            {hasAnyMedia ? "Next: Details" : "Skip to Details"}
          </Text>
          <Ionicons name="arrow-forward" size={18} color={Colors.white} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: Colors.surface },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 13, backgroundColor: Colors.card, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: Colors.border },
  backBtn: { width: 38, height: 38, borderRadius: 10, backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border, alignItems: "center", justifyContent: "center" },
  headerTitle: { fontSize: 17, fontWeight: "700", color: Colors.ink },
  content: { padding: 20, gap: 18 },
  infoBanner: { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: Colors.accentLight, borderRadius: 10, padding: 12 },
  infoText: { fontSize: 13, color: Colors.accent, fontWeight: "600" },
  hint: { fontSize: 14, color: Colors.inkSecondary, lineHeight: 20, textAlign: "center" },
  tilesRow: { flexDirection: "row", gap: 12 },
  cameraBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, height: 52, borderRadius: 14, borderWidth: 1.5, borderColor: Colors.accentLight, backgroundColor: Colors.card },
  cameraBtnPressed: { backgroundColor: Colors.accentLight },
  cameraBtnDisabled: { opacity: 0.4 },
  cameraBtnText: { fontSize: 15, fontWeight: "600", color: Colors.accent },
  skipNote: { textAlign: "center", fontSize: 12, color: Colors.inkDisabled },
  footer: { padding: 16, paddingBottom: Platform.OS === "ios" ? 32 : 16, backgroundColor: Colors.card, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: Colors.border },
  nextBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", height: 54, backgroundColor: Colors.accent, borderRadius: 14, gap: 8, shadowColor: Colors.accent, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.28, shadowRadius: 8, elevation: 4 },
  nextBtnText: { fontSize: 16, fontWeight: "700", color: Colors.white },
});
