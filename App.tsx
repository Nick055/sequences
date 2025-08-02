import * as React from 'react';
import {NavigationContainer} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {StyleSheet, View, Text, Button, ScrollView, TextInput} from 'react-native';
import styles from './styles';
import AsyncStorage from '@react-native-async-storage/async-storage';

const Stack = createNativeStackNavigator();

const HomeScreen = ({navigation}) => {

  return (
    <View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
      <Text>sequences</Text>
      <Button title="Create New Sequence" onPress={()=>{
        navigation.navigate("Edit Sequence")
      }}/>
      <Button title="View Existing Sequences" onPress={()=>{}}/>
    </View>
  );

}

const EditSequenceScreen = () => {

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
    
    sectionElements.push(
    <View style={styles.sectionContainer}>
      <Text>Section {sectionsNo+1}</Text>
      <Text>Tempo (bpm):</Text>
      <TextInput keyboardType="numeric" placeholder="120" onChangeText={text => setTempi([...tempi,Number(text)])}/>
      <Text>Number of Beats per Bar:</Text>
      <TextInput keyboardType="numeric" placeholder="4" onChangeText={text => setBeatsPerBar([...beatsPerBar,Number(text)])}/>
      <Text>Number of Bars:</Text>
      <TextInput keyboardType="numeric" placeholder="8" onChangeText={text => setBars([...bars,Number(text)])}/>
    </View>
    );
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

const App = () => {

  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Home" screenOptions={{headerShown: false}}>
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="Edit Sequence" component={EditSequenceScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
  
};

export default App;
