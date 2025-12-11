import React from 'react';
import { View, Pressable, StyleSheet, Alert, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { colors } from '../theme/colors';

type HeaderProps = {
  onLeave?: () => void;
  title?: string;
};

const Header = ({ onLeave, title }: HeaderProps) => {
  const navigation = useNavigation();

  const handlePress = () => {
    if (onLeave) {
      Alert.alert('Leave Game', 'Are you sure you want to leave the game?', [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Leave',
          onPress: onLeave,
          style: 'destructive',
        },
      ]);
    } else {
      navigation.goBack();
    }
  };

  return (
    <View style={styles.header}>
      <Pressable onPress={handlePress} style={styles.backButton}>
        <Ionicons name="chevron-back" size={32} color={colors.text} />
      </Pressable>
      {title && <Text style={styles.title}>{title}</Text>}
      <View style={styles.placeholder} />
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    zIndex: 10,
  },
  backButton: {
    opacity: 0.8,
  },
  title: {
    color: colors.text,
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  placeholder: {
    width: 32, // Same as chevron size
  },
});

export default Header;
