import { SectionList, StyleSheet, Text, View } from "react-native";
import { MenuItemCard } from "./MenuItemCard";
import { LegacyColors } from "@/constants/colors";
import type { MenuItem } from "@/types";

type Section = { title: string; data: MenuItem[] };
type Props = { sections: Section[]; restaurantId: string };

export function MenuSection({ sections, restaurantId }: Props) {
  return (
    <SectionList
      sections={sections}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => <MenuItemCard item={item} restaurantId={restaurantId} />}
      renderSectionHeader={({ section: { title } }) => (
        <View style={styles.header}>
          <Text style={styles.title}>{title}</Text>
        </View>
      )}
      stickySectionHeadersEnabled
      contentContainerStyle={styles.list}
    />
  );
}

const styles = StyleSheet.create({
  list: { paddingBottom: 120 },
  header: { backgroundColor: LegacyColors.surface, paddingHorizontal: 20, paddingVertical: 10, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: LegacyColors.border },
  title: { fontSize: 17, fontWeight: "800", color: LegacyColors.ink },
});
