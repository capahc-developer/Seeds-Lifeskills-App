import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const GREEN = '#4B9B42';
function Leaf({ left, top, rotate = '0deg', size = 22, color = GREEN }) {
  return <View style={{ position: 'absolute', left, top, width: size, height: size * 0.62, backgroundColor: color, borderRadius: size, transform: [{ rotate }] }} />;
}
function Blossom({ color = '#F9A7CC', size = 50 }) {
  const r = size * .31;
  return <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
    {[0, 72, 144, 216, 288].map(deg => (
      <View key={deg} style={{ position: 'absolute', width: r, height: r * 1.45, borderRadius: r, backgroundColor: color, top: size * .06, left: (size-r)/2, transform: [{ translateY: size*.18 }, { rotate: `${deg}deg` }, { translateY: -size*.18 }] }} />
    ))}
    <View style={{ width: size*.26, height: size*.26, borderRadius: size, backgroundColor: '#FFD85C', borderWidth: 2, borderColor: '#ECA52E', zIndex: 2 }} />
  </View>;
}
export function IllustratedPlant({ stage = 0, index = 0 }) {
  const flowerColors = ['#FFC94B', '#F9A5CB', '#BD95ED', '#F7AD6B'];
  const flower = flowerColors[index % flowerColors.length];
  return (
    <View style={s.plantContainer}>
      <View style={s.growingArea}>
        {stage === 0 ? (
          <View style={s.seed} />
        ) : (
          <>
            <View style={[s.stem, { height: stage === 1 ? 35 : stage === 2 ? 68 : 75 }]} />
            <Leaf left={stage === 1 ? 19 : 7} top={stage === 1 ? 49 : 43} rotate="-34deg" size={stage === 1 ? 21 : 30} />
            <Leaf left={stage === 1 ? 38 : 41} top={stage === 1 ? 45 : 26} rotate="34deg" size={stage === 1 ? 21 : 30} color="#78BE50" />
            {stage >= 2 && <>
              <Leaf left={8} top={63} rotate="-35deg" size={26} />
              <Leaf left={40} top={58} rotate="35deg" size={26} color="#68AF48" />
              <Leaf left={20} top={25} rotate="-65deg" size={27} />
              <Leaf left={36} top={19} rotate="55deg" size={27} color="#82C45A" />
            </>}
            {stage === 3 && <View style={s.flower}><Blossom color={flower} size={55} /></View>}
          </>
        )}
      </View>
      <View style={s.potLip} />
      <View style={s.pot}>
        <View style={s.potShine} />
      </View>
    </View>
  );
}
function Cloud({ style }) {
  return <View style={[s.cloud, style]}>
    <View style={[s.cloudPuff, { left: 6, top: -12, width: 43, height: 35 }]} />
    <View style={[s.cloudPuff, { left: 31, top: -18, width: 51, height: 44 }]} />
    <View style={[s.cloudPuff, { left: 69, top: -7, width: 32, height: 27 }]} />
  </View>;
}
export function GardenBackdrop({ children }) {
  return (
    <View style={s.scene}>
      <View style={s.sky}>
        <Cloud style={{ top: 47, left: -13 }} />
        <Cloud style={{ top: 78, right: -20, transform: [{ scale: .7 }] }} />
        <View style={s.sun}><View style={s.sunInner} /></View>
      </View>
      <View style={s.fence}>
        {Array.from({ length: 13 }, (_, i) => <View key={i} style={s.picket}><View style={s.picketPoint} /></View>)}
      </View>
      <View style={s.bushRow}>
        {Array.from({ length: 11 }, (_, i) => <View key={i} style={[s.bush, { height: 45 + (i%3)*12, width: 45 + (i%2)*8 }]} />)}
      </View>
      <View style={s.grass} />
      <View style={s.content}>{children}</View>
    </View>
  );
}
const s = StyleSheet.create({
  scene: { backgroundColor: '#A5DDF6', borderRadius: 24, minHeight: 350, overflow: 'hidden', position: 'relative' },
  sky: { position: 'absolute', top: 0, left: 0, right: 0, height: 185, backgroundColor: '#A7E2FA' },
  sun: { position: 'absolute', width: 80, height: 80, borderRadius: 40, backgroundColor: '#FFE17B', top: 18, alignSelf: 'center', alignItems: 'center', justifyContent: 'center', borderWidth: 5, borderColor: '#FFD050' },
  sunInner: { width: 56, height: 56, borderRadius: 30, backgroundColor: '#FFDF65' },
  cloud: { position: 'absolute', width: 108, height: 24, borderRadius: 30, backgroundColor: '#FFFFFF' },
  cloudPuff: { position: 'absolute', borderRadius: 40, backgroundColor: '#FFFFFF' },
  fence: { position: 'absolute', top: 177, left: -10, right: -10, height: 90, flexDirection: 'row', justifyContent: 'space-around', alignItems: 'flex-end', backgroundColor: '#A7CF85' },
  picket: { width: '7%', height: 69, backgroundColor: '#DAB98A', borderWidth: 1, borderColor: '#B38E62', borderBottomWidth: 0 },
  picketPoint: { position: 'absolute', top: -13, left: -1, right: -1, height: 20, borderTopLeftRadius: 12, borderTopRightRadius: 12, backgroundColor: '#DAB98A', borderWidth: 1, borderBottomWidth: 0, borderColor: '#B38E62' },
  bushRow: { position: 'absolute', top: 218, left: -15, right: -15, height: 80, flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'center' },
  bush: { backgroundColor: '#70AD4D', borderRadius: 35, marginHorizontal: -5, borderWidth: 2, borderColor: '#559344' },
  grass: { position: 'absolute', top: 277, bottom: 0, left: 0, right: 0, backgroundColor: '#9CCF65' },
  content: { paddingTop: 265, paddingBottom: 22, paddingHorizontal: 8, minHeight: 360 },
  plantContainer: { width: 80, height: 157, alignItems: 'center', justifyContent: 'flex-end' },
  growingArea: { width: 80, height: 102, alignItems: 'center', justifyContent: 'flex-end', position: 'relative' },
  stem: { position: 'absolute', bottom: 0, width: 7, backgroundColor: '#398C39', borderRadius: 5 },
  flower: { position: 'absolute', top: -7, alignSelf: 'center' },
  seed: { width: 19, height: 13, borderRadius: 12, backgroundColor: '#8C512F', borderWidth: 2, borderColor: '#6D3C24', transform: [{ rotate: '-30deg' }], marginBottom: 2 },
  potLip: { width: 75, height: 17, borderRadius: 8, backgroundColor: '#CF8951', borderWidth: 2, borderColor: '#A76A3D', zIndex: 2 },
  pot: { width: 63, height: 37, marginTop: -3, backgroundColor: '#C9844D', borderBottomLeftRadius: 13, borderBottomRightRadius: 13, borderWidth: 2, borderColor: '#A86B3F', alignItems: 'flex-start' },
  potShine: { width: 12, height: 22, borderRadius: 9, backgroundColor: '#E6A16B', marginLeft: 8, marginTop: 4 },
});
