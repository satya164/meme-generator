/* @flow */

import React, { Component } from 'react';
import { StyleSheet, Text, Image, TouchableWithoutFeedback, ActivityIndicator, StatusBar, View } from 'react-native';
import { Font, AppLoading } from 'expo';
import GridView from './GridView';
import MemeViewer from './MemeViewer';
import config from '../config';

StatusBar.setBarStyle("dark-content");

const CARD_WIDTH = 160;

type State = {
  data: Array<{ imageUrl: string }>;
  page: {
    index: number,
    size: number,
  },
  source: { uri: string },
  status: 'loading' | 'loaded' | 'error' | 'requesting',
  error: ?string
}

export default class MemeList extends Component<void, void, State> {
  state: State = {
    data: [],
    page: {
      index: 0,
      size: 24,
    },
    source: null,
    status: 'loading',
    error: null,
    ready: false,
  }

  componentDidMount() {
    this._fetchAssets();
    this._fetchPopular();
  }

  componentDidUpdate(prevProps, prevState) {
    if (prevState.status !== 'requetsing' && this.state.status === 'requesting') {
      this._fetchPopular();
    }
  }

  _fetchAssets = async () => {
    await Font.loadAsync('impact', require('../assets/fonts/impact.ttf'));

    this.setState({ ready: true });
  };

  _fetchPopular = async () => {
    const { page } = this.state;

    try {
      const res = await fetch(`http://version1.api.memegenerator.net/Generators_Select_ByPopular?pageIndex=${page.index}&pageSize=${page.size}&days=&apiKey=${config.memegenerator.key}`);
      const data = await res.json();

      if (data.success) {
        this.setState(state => ({ data: state.data.concat(data.result), status: 'loaded' }));
      } else {
        throw new Error();
      }
    } catch (e) {
      this.setState({ error: 'Failed to load memes', status: 'error' });
    }
  }

  _handleEndReached = () => {
    if (this.state.status === 'requesting') {
      return;
    }

    this.setState(state => ({
      status: 'requesting',
      page: {
        index: state.page.index + 1,
        size: 24,
      }
    }));
  }

  _handleClose = () => {
    this.setState({ source: null });
  }

  _renderRow = (rowData: any, { width }) => {
    return (
      <TouchableWithoutFeedback onPress={() => this.setState({ source: { uri: rowData.imageUrl  } })}>
        <View>
          <Image
            ref={c => this._nodes[rowData.imageUrl] = c}
            source={{ uri: rowData.imageUrl }}
            style={[ styles.image, { width, height: width } ]}
          />
        </View>
      </TouchableWithoutFeedback>
    );
  };

  _getNumberOfColumns = (width: number) => {
    return Math.floor(width / CARD_WIDTH);
  };

  _nodes = {};

  render() {
    if (!this.state.ready) {
      return <AppLoading />
    }

    if (this.state.status === 'loading') {
      return (
        <View style={[styles.loading, styles.container]}>
          <ActivityIndicator />
        </View>
      )
    }

    return (
      <View style={styles.container}>
        <GridView
          data={this.state.data}
          pageSize={2}
          style={styles.container}
          spacing={8}
          renderRow={this._renderRow}
          getNumberOfColumns={this._getNumberOfColumns}
          onEndReached={this._handleEndReached}
        />
        <MemeViewer
          onClose={this._handleClose}
          node={this.state.source && this._nodes[this.state.source.uri]}
          source={this.state.source}
        />
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fafafa',
  },
  loading: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  image: {
    resizeMode: 'cover',
    backgroundColor: '#ccc',
  },
});
