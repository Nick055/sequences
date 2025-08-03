import * as React from 'react';
import {NavigationContainer} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {StyleSheet, View, Text, Button, ScrollView, TextInput, Alert} from 'react-native';
import styles from './styles';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {AudioContext, AudioBuffer, GainNode, AudioBufferSourceNode} from 'react-native-audio-api';

const Stack = createNativeStackNavigator();

const HomeScreen = ({navigation}) => {

  return (
    <View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
      <Text>sequences</Text>
      <Button title="Create New Sequence" onPress={()=>{
        navigation.navigate("Edit Sequence")
      }}/>
      <Button title="View Existing Sequences" onPress={()=>{
        navigation.navigate("View Sequences")
      }}/>
    </View>
  );

}

const EditSequenceScreen = ({navigation}) => {

  const [sequenceName, setSequenceName] = React.useState(() => {
    const dateObj = new Date();
    let dateStr = "seq_"+dateObj.toLocaleDateString('fr-CA') + "_" + dateObj.toLocaleTimeString('en-GB', {hour12: false});
    dateStr = dateStr.replace(/:/g, '-');
    return dateStr;
  });

  const [sectionsNo, setSectionsNo] = React.useState(0);
  const [sectionElements, setSectionElements] = React.useState<React.ReactElement[]>([]);

  const [tempi, setTempi] = React.useState<number[]>([]);
  const [beatsPerBar, setBeatsPerBar] = React.useState<number[]>([]);
  const [bars, setBars] = React.useState<number[]>([]);
  
  const addSection = () => {
    setSectionElements(prev => [...prev, (
        <View style={styles.sectionContainer} key={(sectionsNo + 1).toString()}>
          <Text>Section {sectionsNo + 1}</Text>
          <Text>Tempo (bpm):</Text>
          <TextInput inputMode="numeric" placeholder="120" onChangeText={text => {
            setTempi(prevTempi => {
              const newTempi = [...prevTempi];
              newTempi[sectionsNo] = Number(text);
              return newTempi;
            });
            }}/>
          <Text>Number of Beats per Bar:</Text>
          <TextInput inputMode="numeric" placeholder="4" onChangeText={text => {
            setBeatsPerBar(prevBeats => {
              const newBeats = [...prevBeats];
              newBeats[sectionsNo] = Number(text);
              return newBeats;
            });
          }}/>
          <Text>Number of Bars:</Text>
          <TextInput inputMode="numeric" placeholder="8" onChangeText={text => {
            setBars(prevBars => {
              const newBars = [...prevBars];
              newBars[sectionsNo] = Number(text);
              return newBars;
            });
          }}/>
        </View>
      )]);
    setSectionsNo(sectionsNo + 1);
  };

  const removeSection = () => {
    if (sectionsNo > 1) {
      sectionElements.pop();
      setSectionsNo(sectionsNo - 1);
    }
  }

  const saveSequence = async () => {
    if (sectionsNo > 0) {
      const SequenceObject = {
        name: sequenceName,
        tempi: tempi,
        beatsPerBar: beatsPerBar,
        bars: bars
      };
      const sequenceJSON = JSON.stringify(SequenceObject);
      await AsyncStorage.setItem(sequenceName, sequenceJSON);
      Alert.alert("Sequence Saved", sequenceJSON);
      navigation.navigate("Play Sequence", {sequenceKey: sequenceName});
    }
  }

  return (
    <View style={{flex: 1}}>
      <Text>Edit Sequence</Text>
      <Text>Sequence Name:</Text>
      <TextInput value={sequenceName} onChangeText={setSequenceName}/>
      <ScrollView>
        {sectionElements}
      </ScrollView>
      <Button title="Add Tempo Section" onPress={addSection}/>
      <Button title="Remove Last Section" onPress={removeSection}/>
      <Button title="Save Sequence" onPress={saveSequence}/>
    </View>
  );

}

const PlaySequenceScreen = ({route}) => {

  const [sequence, setSequence] = React.useState<any>(null);
  const [sequenceElements, setSequenceElements] = React.useState<React.ReactElement[]>([]);
  const [metronomeColor, setMetronomeColor] = React.useState('#040');
  const [disableButton, setDisableButton] = React.useState(false);

  React.useEffect(() => {
    async function fetchSequence() {
      //fetch data from AsyncStorage
      const sequenceJSON = await AsyncStorage.getItem(route.params.sequenceKey);
      if(sequenceJSON) {
        setSequence(JSON.parse(sequenceJSON));
      } else {
        setSequence({"name": "Unknown Sequence", "tempi": [], "beatsPerBar": [], "bars": []});
      }
      //use const as setSequence needs time to update sequence state
      const sequenceData = JSON.parse(sequenceJSON || '{"name": "Unknown Sequence", "tempi": [], "beatsPerBar": [], "bars": []}');
      if (sequenceData.tempi.length > 0) {
        for (let i = 0; i < sequenceData.tempi.length; i++) {
          setSequenceElements(prev => [...prev, (
            <View style={styles.sectionContainer} key={i.toString()}>
              <Text>Section {i + 1}</Text>
              <Text>Tempo: {sequenceData.tempi[i]} bpm</Text>
              <Text>Beats per Bar: {sequenceData.beatsPerBar[i]}</Text>
              <Text>{sequenceData.bars[i]} Bars</Text>
            </View>
          )]);
        }
      } else {
        setSequenceElements([<Text key={(-1).toString()}>Failed to load sequence elements.</Text>]);
      }
    }
    fetchSequence();
  },[]);

  const decodeAudioData = async (context: AudioContext, arrayBuffer: string) => {
    return await context.decodeAudioData(arrayBuffer);
  }

  const playSequence = async () => {
    if (!sequence || !sequence.tempi || !sequence.beatsPerBar || !sequence.bars) return;

    setDisableButton(true);

    const audioContext = new AudioContext();
     const audioBuffer_strongBeat = await fetch('https://github.com/Nick055/sequences/raw/main/assets/beat_highPitch.mp3')
      .then((response_strongBeat) => response_strongBeat.arrayBuffer())
      .then((arrayBuffer_strongBeat) => audioContext.decodeAudioData(arrayBuffer_strongBeat));
    const audioBuffer_weakBeat = await fetch('https://github.com/Nick055/sequences/raw/main/assets/beat_lowPitch.mp3')
      .then((response_weakBeat) => response_weakBeat.arrayBuffer())
      .then((arrayBuffer_weakBeat) => audioContext.decodeAudioData(arrayBuffer_weakBeat));
    
    for (let i = 0; i < sequence.tempi.length; i++) {
      const interval = 60000 / sequence.tempi[i];
      const totalBeats = sequence.beatsPerBar[i] * sequence.bars[i];

      // Await the completion of each section before moving to the next
      let beat = 0;
      await new Promise<void>((resolve) => {
        const startTime = Date.now();

        const playBeat = () => {
          if (Date.now() - startTime >= interval * beat && beat <= totalBeats) {
            const playerNode = audioContext.createBufferSource();
            if(beat % sequence.beatsPerBar[i] === 0) {
              setMetronomeColor('#e00');
              playerNode.buffer = audioBuffer_strongBeat;
            } else {
              setMetronomeColor('#0e0');
              playerNode.buffer = audioBuffer_weakBeat;
            } 
            playerNode.connect(audioContext.destination);
            playerNode.start(audioContext.currentTime);
            setTimeout(() => {
              setMetronomeColor('#040');
              playerNode.stop(audioContext.currentTime + 0.2);
            }, 50);
            beat++;
            playBeat();
          } else {
            setTimeout(playBeat, 1);
          }
          if (beat > totalBeats) {
            resolve();
            return;
          }
        };
        playBeat();
      });
    }
    audioContext.close();
    setDisableButton(false);
  }

  return (
    <View style={{flex: 1}}>
      <Text>Play Sequence</Text>
      <Text>Sequence Name: {sequence?.name}</Text>
      <ScrollView style={{flex: 1}}>
        {sequenceElements}
      </ScrollView>
      <View style={{flexDirection: 'row', alignContent: 'center', justifyContent: 'center'}}>
        <View style={[styles.metronomeIndicator, {backgroundColor: metronomeColor}]}></View>
      </View>
      <Button title="Play Sequence" onPress={playSequence} disabled={disableButton}/>
    </View>
  );
}

const ViewSequencesScreen = ({navigation}) => {

  const [sequences, setSequences] = React.useState<any[]>([]);
  const [sequencesElements, setSequencesElements] = React.useState<React.ReactElement[]>([]);

  async function fetchAllSequences() {
    const keys = await AsyncStorage.getAllKeys();
    const sequencesJSON = await AsyncStorage.multiGet(keys);
    const sequencesArray = sequencesJSON.map(([key, value]) => {
      return {key, value: JSON.parse(value || '{}')};
    });
    setSequences(sequencesArray);
    if (sequencesArray.length > 0) {
      const elements = sequencesArray.map((seq, i) => (
        <View style={styles.sequencesViewContainer} key={(i + 1).toString()}>
          <Text>Sequence Name: {seq.value.name}</Text>
          <Button title="Play Sequence" onPress={()=>playSequence(seq)}/>
          <Button title="Delete Sequence" onPress={async () => await deleteSequence(seq.key)}/>
        </View>
      ));
      setSequencesElements(elements);
    } else {
      setSequencesElements([<Text key={(-1).toString()}>Failed to load sequences: no sequences found.</Text>]);
    }
  }

  const playSequence = (seq: any) => {
    navigation.navigate("Play Sequence", {sequenceKey: seq.value.name});
  }

  const deleteSequence = async (key: string) => {
    await AsyncStorage.removeItem(key);
    Alert.alert("Sequence Deleted", `Sequence with key ${key} has been deleted.`);
    fetchAllSequences();
  }

  const deleteAllSequences = async () => {
    await AsyncStorage.clear();
    Alert.alert("All sequences deleted.","All data cleared from AsyncStorage.");
    setSequences([]);
    setSequencesElements([]);
  }

  React.useEffect(() => {
    fetchAllSequences();
  }, []);

  return (
    <View style={{flex: 1}}>
      <Text>Existing Sequences:</Text>
      <Text>Total Sequences: {sequences.length}</Text>
      <ScrollView>
        {sequencesElements}
      </ScrollView>
      <Button title="Delete All Sequences" onPress={deleteAllSequences}/>
    </View>
  );

}

const App = () => {

  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Home" screenOptions={{headerShown: false}}>
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="Edit Sequence" component={EditSequenceScreen} />
        <Stack.Screen name="Play Sequence" component={PlaySequenceScreen} />
        <Stack.Screen name="View Sequences" component={ViewSequencesScreen}/>
      </Stack.Navigator>
    </NavigationContainer>
  );
  
};

export default App;
