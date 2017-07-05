/* @flow */

import React, { PureComponent } from 'react';
import {
  Animated,
  View,
  Text,
  Image,
  ScrollView,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Keyboard,
  InteractionManager,
  TextInput,
  CameraRoll,
} from 'react-native';
import Expo, { Constants } from 'expo';

const SCREEN = Dimensions.get('window');
const AnimatedInput = Animated.createAnimatedComponent(TextInput);

export default class App extends PureComponent {
  state = {
    source: null,
    visibility: new Animated.Value(0),
    measurements: {
      pageX: 0,
      pageY: 0,
      width: 0,
      height: 0,
    },
    saving: false,
    inputHeightTop: 56,
    inputHeightBottom: 56,
  };

  componentWillReceiveProps(nextProps) {
    const { node, source } = nextProps;

    if (node && source) {
      node.measure((x, y, width, height, pageX, pageY) => {
        this.state.visibility.setValue(0);
        this.setState({
          source,
          measurements: { pageX, pageY, width, height },
        }, () =>
          Animated.timing(this.state.visibility, { toValue: 1, duration: 250 }).start()
        );
      });
    } else {
      Animated.timing(this.state.visibility, { toValue: 0, duration: 200 }).start(() =>
        this.setState({ source: null })
      );
    }
  }

  _handleClose = () => InteractionManager.runAfterInteractions(this.props.onClose);

  _handleSave = () => {
    this.setState({ saving: true }, async () => {
      const file = await Expo.takeSnapshotAsync(this._meme, {
        format: 'png',
        result: 'file'
      });

      CameraRoll.saveToCameraRoll(file);

      this.setState({ saving: false });
    });
  };

  _handleSizeChangeTop = e => this.setState({ inputHeightTop: e.nativeEvent.contentSize.height });
  _handleSizeChangeBottom = e => this.setState({ inputHeightBottom: e.nativeEvent.contentSize.height });

  _meme: any;

  render() {
    const { visibility, measurements } = this.state;

    const translateX = visibility.interpolate({
      inputRange: [ 0, 1 ],
      outputRange: [ measurements.pageX - ((SCREEN.width - measurements.width) / 2), 0 ],
    });
    const translateY = visibility.interpolate({
      inputRange: [ 0, 1 ],
      outputRange: [ measurements.pageY - ((SCREEN.height - measurements.height) / 2), 0 ],
    });
    const scale = visibility.interpolate({
      inputRange: [ 0, 1 ],
      outputRange: [ measurements.width / SCREEN.width, 1 ],
    });

    const inputStyle = [
      styles.input,
      { opacity: visibility, borderColor: this.state.saving ? 'transparent' : 'white' },
    ];

    return (
      <View style={StyleSheet.absoluteFill} pointerEvents={this.state.source ? "auto" : "none"}>
        <Animated.View style={[StyleSheet.absoluteFill, styles.overlay, { opacity: visibility } ]} />
        <Animated.View View style={[styles.toolbar, { opacity: visibility }]}>
          <TouchableOpacity onPress={this._handleClose}>
            <Text style={styles.button}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={this._handleSave}>
            <Text style={styles.button}>Save</Text>
          </TouchableOpacity>
        </Animated.View>
        <View style={styles.fill}>
          <View ref={c => (this._meme = c)}>
            <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
              <Animated.Image
                source={this.state.source}
                style={[styles.image, { transform: [{translateX}, {translateY}, {scale} ] }]}
              />
            </TouchableWithoutFeedback>
            <AnimatedInput multiline autoCapitalize="characters" style={[inputStyle, styles.top, {height: this.state.inputHeightTop}]} onContentSizeChange={this._handleSizeChangeTop} />
            <AnimatedInput multiline autoCapitalize="characters" style={[inputStyle,styles. bottom, {height: this.state.inputHeightBottom}]} onContentSizeChange={this._handleSizeChangeBottom} />
          </View>
        </View>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  toolbar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: Constants.statusBarHeight,
  },
  fill: {
    position: 'absolute',
    left: 0,
    top: (SCREEN.height - SCREEN.width) / 2,
    width: SCREEN.width,
    height: SCREEN.width,
  },
  image: {
    width: SCREEN.width,
    height: SCREEN.width,
  },
  overlay: {
    backgroundColor: 'white',
  },
  button: {
    color: '#3F51B5',
    backgroundColor: 'transparent',
    marginVertical: 16,
    marginHorizontal: 8,
    fontSize: 18,
  },
  input: {
    position: 'absolute',
    left: 0,
    right: 0,
    textAlign: 'center',
    color: 'white',
    fontWeight: 'bold',
    fontFamily: 'impact',
    marginHorizontal: 8,
    padding: 0,
    fontSize: 32,
    borderWidth: 1,
  },
  top: {
    top: 8,
  },
  bottom: {
    bottom: 8,
  }
});
