/**
 * @Author: Ravi
 * @CreatedDate: 03-11-2020
 */
import React, { Component } from 'react';
import {
  View,
  Image,
  Text,
  TouchableOpacity,
  BackHandler,
  StyleSheet
} from 'react-native';
import moment from 'moment';
import Loader from './loader';
import BackgroundTimer from 'react-native-background-timer';
import PushNotification from 'react-native-push-notification';

// expo
import * as Permissions from 'expo-permissions';
import { Audio } from 'expo-av';

// Assets
export const bar = require('./assets/bar_icon.png');
export const monitoringAnimation =
  require('./assets/monitoring_animation.png');

// Monitor Class
export default class App extends Component {

  // Constructor
  constructor(props) {
    super(props);
    this.notifyId = 0;
    this.state = {
      loading: false,
      monitoringStatus: false,
      monitoringStop: false,
      time: moment().format("LT"),
      date: moment().format("LL"),
      notifyId: 0,
      recording: false,
      audioFile: '',
      haveRecordingPermissions: false,
      recordingexpo: null
    }
  }

  handleBackButtonClick() {
    if (this.state.recording) {
        return true;
    } else {
      this.props.navigation.goBack(null);
      return true;
    }
  }

  _askForPermissions = async () => {
    const response = await Permissions.askAsync(Permissions.AUDIO_RECORDING);
    this.setState({
      haveRecordingPermissions: response.status === 'granted',
    });
  };

  async componentDidMount() {
    this.setState({ loading: true });
    BackHandler.addEventListener(
      'hardwareBackPress', () => this.handleBackButtonClick());
    this._askForPermissions();
    this.setState({ loading: false });
    this.timer = setInterval(() => {
      this.setState({
        time: moment().format("LT"),
        date: moment().format("LL")
      });
    }, 10000);
  }

  componentWillUnmount() {
    BackHandler.removeEventListener(
      'hardwareBackPress', () => this.handleBackButtonClick());
    PushNotification.cancelAllLocalNotifications();
  }


  initilizeAudio = async () => {
    await Audio.setAudioModeAsync({
      allowsRecordingIOS: true,
      interruptionModeIOS: Audio.INTERRUPTION_MODE_IOS_DO_NOT_MIX,
      staysActiveInBackground: true,
      shouldDuckAndroid: true,
      interruptionModeAndroid: Audio.INTERRUPTION_MODE_ANDROID_DO_NOT_MIX,
      playThroughEarpieceAndroid: false
    });
    const recording = new Audio.Recording();
    await recording.prepareToRecordAsync({
      android : {
        extension: ".wav",
        outputFormat: Audio.RECORDING_OPTION_ANDROID_OUTPUT_FORMAT_DEFAULT,
        audioEncoder: Audio.RECORDING_OPTION_ANDROID_AUDIO_ENCODER_AAC,
        sampleRate: 16000,
        numberOfChannels: 1,
        bitRate: 128000
      },
      ios: {
        extension: '.wav',
        audioQuality: Audio.RECORDING_OPTION_IOS_AUDIO_QUALITY_MAX,
        sampleRate: 16000,
        numberOfChannels: 1,
        bitRate: 128000,
        linearPCMBitDepth: 16,
        linearPCMIsBigEndian: false,
        linearPCMIsFloat: false,
      },
    });

    return recording;
  }

  audioStartStop = async () => {

    if (this.state.recording) {
      await this.state.recordingexpo.stopAndUnloadAsync();
      var audioFile = this.state.recordingexpo.getURI();
      console.log('create 30 sec audio at the following location:')
      console.log(audioFile)

    this.initilizeAudio().then(async (recording) => {
        await recording.startAsync();
        this.setState({
           audioFile: '',
           recording: true,
           recordingexpo: recording
        });

        return;
      });
    }
  }

  startMonitoring = async () => {

    this.setState({
       audioFile: '',
       recording: true,
    });

    this.initilizeAudio().then(async (recording) => {
      await recording.startAsync();

      this.setState({
        recordingexpo: recording
      })

      BackgroundTimer.runBackgroundTimer(() => {
        console.log('running in the background every 30 sec')
        this.audioStartStop()
      },30000);

      this.notifyId++;

      PushNotification.localNotification({
        id: '' + this.state.notifyId,
        largeIcon: "ic_launcher",
        ongoing: true,
        message: "Curie Symptom monitoring undergoing",
        autoCancel: false
      });

      this.setState({
        monitoringStatus: !this.state.monitoringStatus
      })
    });
  }

  stopMonitoring = async () => {
    if (this.state.recording) {
      await this.state.recordingexpo.stopAndUnloadAsync();
    }
    PushNotification.cancelAllLocalNotifications();
    BackgroundTimer.stopBackgroundTimer();

    this.setState({
      monitoringStop: true
    });

    setTimeout(() => {
      this.setState({
        monitoringStop: false,
        monitoringStatus: false
      });
    }, 2000);
  }

  renderMonitoring = () => {
    if (this.state.monitoringStatus) {
      return (
        <View
          style={styles.stopMonitoringContainer}
        >
          <View
            style={styles.stopMonitoringTimeDateContainer}
          >
            <View
              style={styles.stopMonitoringTimeDate}
            >
              <Text style={styles.timeText}>
                {this.state.time}
              </Text>
              <Text style={styles.dateText}>
                {this.state.date}
              </Text>
            </View>
          </View>
          <View
            style={styles.stopMonitoringGifContainer}
          >
            <Image
              source={monitoringAnimation}
              style={{
                width: 130,
                height: 130
              }}
            />
          </View>
          <View
            style={styles.stopNowButtonContainer}
          >
            <TouchableOpacity
              style={styles.stoptNowButton}
              onPress={() => this.stopMonitoring()}
            >
              <Text style={styles.stoptNowButtonTxt}>
                STOP NOW
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      );
    } else {
      return (
        <View
          style={styles.monitorContainer}
        >
          <View
            style={styles.closeBarContainer}
          >
            <View style={styles.closeBar}>
              <Image
                source={bar}
                style={{
                  width: 50,
                  height: 10
                }}
              />
           </View>
          </View>
          <View
            style={styles.beginMonitoringContainer}
          >
            <View
              style={styles.beginMonitoring}
            >
              <View
                style={styles.beginMonitoringTitle}
              >
                <View
                  style={{
                    width: '75%',
                    height: '20%'
                  }}
                >
                  <Text style={styles.beginMonitoringTitleTxt}>
                    To begin monitoring tap start now
                  </Text>
                </View>
              </View>
              <View
                style={styles.startNowButtonContainer}
              >
                <TouchableOpacity
                  style={styles.startNowButton}
                  onPress={() => this.startMonitoring()}
                >
                  <Text style={styles.startNowButtonTxt}>
                    START NOW
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      );
    }
  }

  render() {
    return (
      <View style={styles.container}>
        <Loader loading={this.state.loading} />
        {this.renderMonitoring()}
      </View>
    );
  }
}

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'flex-end'
  },
  monitorContainer: {
    width: '100%',
    height: '95%',
    borderTopRightRadius: 15,
    borderTopLeftRadius: 15,
    backgroundColor: '#1B1B1B'
  },
  closeBarContainer: {
    width: '100%',
    height: '5%',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center'
  },
  closeBar: {
    width: '50%',
    height: '100%',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center'
  },
  beginMonitoringContainer: {
    width: '100%',
    height: '95%',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center'
  },
  beginMonitoring: {
    width: '100%',
    height: '95%',
    display: 'flex',
    flexDirection: 'column'
  },
  beginMonitoringTitle: {
    width: '100%',
    height: '90%',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center'
  },
  beginMonitoringTitleTxt: {
    fontFamily: 'Lato',
    fontStyle: 'normal',
    fontWeight: '400',
    fontSize: 18,
    lineHeight: 22,
    letterSpacing: 0.5,
    color: '#FFFFFF',
    textAlign: 'center'
  },
  startNowButtonContainer: {
    width: '100%',
    height: '10%',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center'
  },
  startNowButton: {
    width: '90%',
    height: '90%',
    borderRadius: 8,
    backgroundColor: '#05C5D9',
    borderColor: '#05C5D9',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center'
  },
  startNowButtonTxt: {
    fontFamily: 'Lato',
    fontStyle: 'normal',
    fontWeight: 'bold',
    fontSize: 16,
    lineHeight: 19,
    letterSpacing: 0.5,
    color: '#FFFFFF'
  },
  stopMonitoringContainer: {
    width: '100%',
    height: '100%',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1B1B1B'
  },
  stopMonitoringTimeDateContainer: {
    width: '100%',
    height: '40%',
    display: 'flex',
    justifyContent: 'flex-end',
    alignItems: 'center'
  },
  stopMonitoringTimeDate: {
    width: '100%',
    height: '50%',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
  },
  timeText: {
    fontFamily: 'Lato',
    fontStyle: 'normal',
    fontWeight: '400',
    fontSize: 53,
    lineHeight: 55,
    letterSpacing: 0,
    color: '#AAAAAA'
  },
  dateText: {
    fontFamily: 'Lato',
    fontStyle: 'normal',
    fontWeight: '400',
    fontSize: 20,
    lineHeight: 25,
    letterSpacing: 0,
    color: '#AAAAAA'
  },
  stopMonitoringGifContainer: {
    width: '100%',
    height: '50%',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
  },
  stopNowButtonContainer: {
    width: '100%',
    height: '10%',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
  },
  stoptNowButton: {
    width: '90%',
    height: '90%',
    borderRadius: 8,
    backgroundColor: 'transparent',
    borderWidth: 1.2,
    borderColor: '#05C5D9',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center'
  },
  stoptNowButtonTxt: {
    fontFamily: 'Lato',
    fontStyle: 'normal',
    fontWeight: 'bold',
    fontSize: 16,
    lineHeight: 19,
    letterSpacing: 0.5,
    color: '#05C5D9'
  },
  healthAssessmentContainer: {
    width: '100%',
    height: '100%',
    backgroundColor: '#1B1B1B',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center'
  },
  healthAssessmentCheckContainer: {
    width: '100%',
    height: '50%',
    display: 'flex',
    justifyContent: 'flex-end',
    alignItems: 'center'
  },
  healthAssessmentCheck: {
    width: '100%',
    height: '40%',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center'
  },
  healthAssessmentSuccessContainer: {
    width: '100%',
    height: '20%',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center'
  },
  healthAssessmentSuccessTxt: {
    fontFamily: 'Lato',
    fontStyle: 'normal',
    fontWeight: '400',
    fontSize: 18,
    lineHeight: 22,
    letterSpacing: -0.11,
    color: '#FFFFFF',
    textAlign: 'center'
  },
  healthAssessmentReportContainer: {
    width: '100%',
    height: '60%',
    display: 'flex',
    justifyContent: 'flex-start',
    alignItems: 'center'
  },
  clickHereTxt: {
    fontFamily: 'Lato',
    fontStyle: 'normal',
    fontWeight: '400',
    fontSize: 16,
    lineHeight: 19,
    letterSpacing: 0,
    color: '#05C5D9'
  }
});
