import React, {useEffect, useState, useRef, useCallback} from 'react';
import {
  View,
  StyleSheet,
  Button,
  TouchableOpacity,
  Text,
  Linking,
  Image,
  Alert
} from 'react-native';
import {Camera, useCameraDevices} from 'react-native-vision-camera';
import Tflite from 'tflite-react-native';
// import TensorflowLite from "@switt/react-native-tensorflow-lite";
import { YOLOv5TFLite } from "./YOLOv5TFLite";
import { Asset } from 'expo-asset';

function App() {
  const camera = useRef<Camera>(null);;
  const devices = useCameraDevices();
  const device = devices.back;

  const [name, setName] = useState<String|null>(null);
  const [showCamera, setShowCamera] = useState(false);
  const [isCameraInitialized, setIsCameraInitialized] = useState(false);
  const [imageSource, setImageSource] = useState('');

  const onCameraInitialized = useCallback(() => {
    console.log('Camera initialized!');
    setIsCameraInitialized(true);
  }, []);

  let tflite = new Tflite();
  

  useEffect(() => {
    async function getPermission() {
      const newCameraPermission = await Camera.requestCameraPermission();
      console.log(newCameraPermission);
    }
    getPermission();

    tflite.loadModel({
      model: 'models/bird-ft16.tflite',// required
      labels: 'models/birds.txt',  // required
      numThreads: 1,                              // defaults to 1  
    },
    (err, res) => {
      if(err)
        console.log(err);
      else
        console.log(res);
    });

  }, []);




  const capturePhoto = async () => {
      
      if (camera.current !== null && isCameraInitialized) {
        
        // const photo = await camera.current.takeSnapshot();
        const photo = await camera.current.takeSnapshot();
        setImageSource(photo.path);
        setShowCamera(false);
        console.log(photo.path);
        

        let modelAsset = Asset.fromModule(require('./birdfloat16_metadata.tflite'));
        let labelAsset = Asset.fromModule(require('./birds.txt'));
        // // let modelAsset = Asset.fromModule(require('./birdint8.tflite'));
        // // let modelAsset = Asset.fromModule(require('./lite-model_aiy_vision_classifier_birds_V1_3.tflite'));
        // // let modelAsset = Asset.fromModule(require('./lite-model_qat_mobilenet_v2_retinanet_256_1.tflite'));
        
        if (!modelAsset.downloaded) { await modelAsset.downloadAsync() };

        // // const results = await TensorflowLite.runModelWithImage({
        // //   model: modelAsset.localUri!,
        // //   file: photo.path,
        // //   grayScale: false
        // // });

        // let results = await TensorflowLite.runModelWithFiles({
        //   model: modelAsset.localUri!,
        //   files: [photo.path],
        //   grayScale: false
        // });

        
        // let output = JSON.parse(results);
        // Alert.alert(output[0].categories[0].label);
        // console.log(JSON.stringify(results));
        // let parsed_results = JSON.parse(results);
        // if(parsed_results[0].categories.length > 0){
        //   setName(parsed_results[0].categories[0].displayName);
        // }else{
        //   setName("Can't Determine");
        // }


        let results = await YOLOv5TFLite.detect(
          {
          image: photo.path,  // required
          model: modelAsset.localUri!,// required
          labels: labelAsset.localUri!,  // required
          // numThreads: 1,                              // defaults to 1  
          // numResultsPerClass: 1,
          // mean: 127.5,
          // std: 127.5,
          // threshold: 0
        },
        (err, res) => {
          if(err){
            console.log(err);
        }else{
            console.log(res);
        }}
        );
        console.log(results);
        
        

      }

    
  };

  if (device == null) {
    return <Text>Camera not available</Text>;
  }

  return (
    <View style={styles.container}>
      {showCamera ? (
        <>
          <Camera
            ref={camera}
            style={StyleSheet.absoluteFill}
            device={device}
            isActive={showCamera}
            onInitialized={onCameraInitialized}
            photo={true}
          />

          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={styles.camButton}
              onPress={() => capturePhoto()}
            />
          </View>
        </>
      ) : (
        <>
          {imageSource !== '' ? (
            <Image
              style={styles.image}
              source={{
                uri: `file://'${imageSource}`,
              }}
            />
          ) : null}

          <View style={styles.backButton}>
            <TouchableOpacity
              style={{
                backgroundColor: 'rgba(0,0,0,0.2)',
                padding: 10,
                justifyContent: 'center',
                alignItems: 'center',
                borderRadius: 10,
                borderWidth: 2,
                borderColor: '#fff',
                width: 100,
              }}
              onPress={() => setShowCamera(true)}>
              <Text style={{color: 'white', fontWeight: '500'}}>Back</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.buttonContainer}>
            <View style={styles.buttons}>
              <TouchableOpacity
                style={{
                  backgroundColor: '#fff',
                  padding: 10,
                  justifyContent: 'center',
                  alignItems: 'center',
                  borderRadius: 10,
                  borderWidth: 2,
                  borderColor: '#77c3ec',
                }}
                onPress={() => setShowCamera(true)}>
                <Text style={{color: '#77c3ec', fontWeight: '500'}}>
                  Retake
                </Text>
              </TouchableOpacity>
              <Text style={{color: 'white', fontWeight: '900', fontSize:20}}>
                  { name }
              </Text>
              <TouchableOpacity
                style={{
                  backgroundColor: '#77c3ec',
                  padding: 10,
                  justifyContent: 'center',
                  alignItems: 'center',
                  borderRadius: 10,
                  borderWidth: 2,
                  borderColor: 'white',
                }}
                onPress={() => setShowCamera(true)}>
                <Text style={{color: 'white', fontWeight: '500'}}>
                  Use Photo
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  button: {
    backgroundColor: 'gray',
  },
  backButton: {
    backgroundColor: 'rgba(0,0,0,0.0)',
    position: 'absolute',
    justifyContent: 'center',
    width: '100%',
    top: 0,
    padding: 20,
  },
  buttonContainer: {
    backgroundColor: 'rgba(0,0,0,0.2)',
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    bottom: 0,
    padding: 20,
  },
  buttons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  camButton: {
    height: 80,
    width: 80,
    borderRadius: 40,
    //ADD backgroundColor COLOR GREY
    backgroundColor: '#B2BEB5',

    alignSelf: 'center',
    borderWidth: 4,
    borderColor: 'white',
  },
  image: {
    width: '100%',
    height: '100%',
    aspectRatio: 9 / 16,
  },
});

export default App;