
import { SymbolView, SymbolViewProps, SymbolWeight } from "expo-symbols";
import { StyleProp, ViewStyle } from "react-native";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";

// Mapping from Material icon names to SF Symbol names
const materialToSFSymbol: Record<string, string> = {
  'home': 'house.fill',
  'calculate': 'function',
  'check-circle': 'checkmark.circle.fill',
  'person': 'person.fill',
  'settings': 'gearshape.fill',
  'search': 'magnifyingglass',
  'notifications': 'bell.fill',
  'menu': 'line.3.horizontal',
  'close': 'xmark',
  'delete': 'trash.fill',
  'edit': 'pencil',
  'add': 'plus',
  'remove': 'minus',
  'info': 'info.circle.fill',
  'error': 'exclamationmark.triangle.fill',
  'warning': 'exclamationmark.circle.fill',
  'public': 'globe',
  'lock': 'lock.fill',
  'email': 'envelope.fill',
  'phone': 'phone.fill',
  'calendar-today': 'calendar',
  'event': 'calendar.badge.clock',
  'access-time': 'clock.fill',
  'location-on': 'location.fill',
  'location-city': 'building.2.fill',
  'favorite': 'heart.fill',
  'star': 'star.fill',
  'share': 'square.and.arrow.up',
  'download': 'arrow.down.circle.fill',
  'upload': 'arrow.up.circle.fill',
  'refresh': 'arrow.clockwise',
  'chevron-left': 'chevron.left',
  'chevron-right': 'chevron.right',
  'arrow-back': 'arrow.left',
  'arrow-forward': 'arrow.right',
  'description': 'doc.text.fill',
  'article': 'doc.text.fill',
  'savings': 'dollarsign.circle.fill',
  'verified': 'checkmark.seal.fill',
  'verified-user': 'person.badge.shield.checkmark.fill',
  'schedule': 'clock.fill',
  'badge': 'person.text.rectangle.fill',
  'flight': 'airplane',
  'flight-takeoff': 'airplane.departure',
  'help': 'questionmark.bubble.fill',
  'chat': 'message.fill',
};

export function IconSymbol({
  ios_icon_name,
  android_material_icon_name,
  size = 24,
  color,
  style,
  weight = "regular",
}: {
  ios_icon_name?: SymbolViewProps["name"];
  android_material_icon_name: keyof typeof MaterialIcons.glyphMap;
  size?: number;
  color: string;
  style?: StyleProp<ViewStyle>;
  weight?: SymbolWeight;
}) {
  // Use provided iOS icon name, or map from Material icon name
  const sfSymbolName = ios_icon_name || materialToSFSymbol[android_material_icon_name] || 'questionmark.circle';
  
  return (
    <SymbolView
      weight={weight}
      tintColor={color}
      resizeMode="scaleAspectFit"
      name={sfSymbolName}
      style={[
        {
          width: size,
          height: size,
        },
        style,
      ]}
    />
  );
}
