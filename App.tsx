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

  React.useEffect(() => {
    async function fetchSequence() {
      const sequenceJSON = await AsyncStorage.getItem(route.params.sequenceKey);
      if(sequenceJSON) {
        setSequence(JSON.parse(sequenceJSON));
      } else {
        setSequence({"name": "Unknown Sequence", "tempi": [], "beatsPerBar": [], "bars": []});
      }
      const sequenceData = JSON.parse(sequenceJSON || '{"name": "Unknown Sequence", "tempi": [], "beatsPerBar": [], "bars": []}');
      if (sequenceData.tempi.length > 0) {
        for (let i = 0; i < sequenceData.tempi.length; i++) {
          setSequenceElements(prev => [...prev, (
            <View style={styles.sectionContainer} key={i.toString()}>
              <Text>Section {i + 1}</Text>
              <Text>Tempo: {sequenceData.tempi[i]} bpm</Text>
              <Text>Beats per Bar: {sequenceData.beatsPerBar[i]}</Text>
              <Text>Bars: {sequenceData.bars[i]}</Text>
            </View>
          )]);
        }
      } else {
        setSequenceElements([<Text key={(-1).toString()}>Failed to load sequence elements.</Text>]);
      }
    }
    fetchSequence();
  },[]);

  return (
    <View style={{flex: 1}}>
      <Text>Sequence Key: {route.params.sequenceKey}</Text>
      <Text>Sequence Name: {sequence?.name}</Text>
      <Text>{JSON.stringify(sequence)}</Text>
      <ScrollView>
        {sequenceElements}
      </ScrollView>
      <Button title="Play Sequence" onPress={()=>{}}/>
    </View>
  );

}

const ViewSequencesScreen = () => {

  return (
    <View style={{flex: 1}}>
      <Text>Existing Sequences:</Text>
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
