import React from 'react';
import {
  TouchableWithoutFeedback,
  Animated,
  Easing,
  Platform,
} from 'react-native';
import ReactNativeHapticFeedback from 'react-native-haptic-feedback';

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableWithoutFeedback);

const TouchableScale = ({ children, onPress, style = {}, scaleTo = 0.97, haptic = true }) => {
  const animation = React.useRef(new Animated.Value(1)).current;

  const animateIn = () => {
    Animated.timing(animation, {
      toValue: scaleTo,
      duration: 100,
      useNativeDriver: true,
      easing: Easing.out(Easing.quad),
    }).start();
  };

  const animateOut = () => {
    Animated.timing(animation, {
      toValue: 1,
      duration: 100,
      useNativeDriver: true,
      easing: Easing.out(Easing.quad),
    }).start();
  };

  const handlePress = () => {
    if (haptic) {
      ReactNativeHapticFeedback.trigger('impactLight', {
        enableVibrateFallback: true,
        ignoreAndroidSystemSettings: false,
      });
    }
    onPress?.();
  };

  return (
    <Animated.View style={[{ transform: [{ scale: animation }] }, style]}>
      <TouchableWithoutFeedback
        onPressIn={animateIn}
        onPressOut={animateOut}
        onPress={handlePress}>
        <Animated.View>{children}</Animated.View>
      </TouchableWithoutFeedback>
    </Animated.View>
  );
};

export default TouchableScale;
