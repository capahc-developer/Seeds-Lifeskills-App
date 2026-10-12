"""Run from the seeds-life-skills app folder after extracting this package there.
This installer modifies ONLY app/garden.jsx and adds garden artwork files.
"""
from pathlib import Path
import shutil
root=Path.cwd()
target=root/'app/garden.jsx'
source=Path(__file__).resolve().parent
if not target.exists():
 raise SystemExit('Please run from the seeds-life-skills app folder (where app/garden.jsx exists).')
text=target.read_text()
def replace_once(old,new):
 global text
 count=text.count(old)
 if count!=1: raise SystemExit(f'Expected code not found exactly once (found {count}): {old[:90]}\nNo files changed.')
 text=text.replace(old,new,1)
replace_once("import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';", "import { ActivityIndicator, Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';")
replace_once("import { GardenBackdrop, IllustratedPlant } from '../components/GardenIllustration';", "import { GardenBackdrop } from '../components/GardenIllustration';\nimport { FLOWER_TYPES, flowerImageSource } from '../components/GardenFlowerAssets';")
replace_once("  const [message, setMessage] = useState('');", "  const [message, setMessage] = useState('');\n  const [selectedFlower, setSelectedFlower] = useState('sunflower');")
replace_once("nextPlants = [...savedPlants, { id: `${Date.now()}-${Math.random().toString(36).slice(2)}`, stage: 0 }];", "nextPlants = [...savedPlants, { id: `${Date.now()}-${Math.random().toString(36).slice(2)}`, type: selectedFlower, stage: 0 }];")
replace_once("                  const canWater = waterAvailable > 0 && plant.stage < 3 && !working;", "                  const canWater = waterAvailable > 0 && plant.stage < 3 && !working;\n                  const flowerType = plant.type || FLOWER_TYPES[i % FLOWER_TYPES.length];\n                  // Future custom flowers may supply customStages: [seedURL, sproutURL, plantURL, flowerURL].\n                  const customURL = Array.isArray(plant.customStages) ? plant.customStages[plant.stage] : null;\n                  const imageSource = customURL ? { uri: customURL } : flowerImageSource(flowerType, plant.stage);")
replace_once("                      <IllustratedPlant stage={plant.stage} index={i} />", "                      <Image source={imageSource} resizeMode=\"contain\" style={s.flowerArt} />")
replace_once("          <Pressable disabled={working || seedsAvailable < 1}", "          <View style={s.flowerPicker}>\n            <Text style={s.pickerHeading}>Choose your next flower</Text>\n            <View style={s.flowerOptions}>\n              {FLOWER_TYPES.map(type => (\n                <Pressable key={type} accessibilityRole=\"button\" accessibilityLabel={`Choose ${type}`}\n                  onPress={() => setSelectedFlower(type)}\n                  style={[s.flowerOption, selectedFlower === type && s.flowerOptionSelected]}>\n                  <Image source={flowerImageSource(type, 3)} resizeMode=\"contain\" style={s.flowerPreview} />\n                  <Text style={s.flowerOptionName}>{type[0].toUpperCase() + type.slice(1)}</Text>\n                </Pressable>\n              ))}\n            </View>\n          </View>\n          <Pressable disabled={working || seedsAvailable < 1}")
replace_once("  plantGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', columnGap: 6, rowGap: 18 },", "  plantGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', columnGap: 6, rowGap: 18 },\n  flowerArt: { width: 91, height: 145 },\n  flowerPicker: { backgroundColor: '#FFF', borderRadius: 18, padding: 14, marginTop: 16 },\n  pickerHeading: { color: '#346C48', fontWeight: '800', fontSize: 16, marginBottom: 12 },\n  flowerOptions: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 8 },\n  flowerOption: { width: 91, alignItems: 'center', padding: 6, borderWidth: 2, borderColor: '#E4F1E3', borderRadius: 12 },\n  flowerOptionSelected: { borderColor: '#409D62', backgroundColor: '#EAF8E8' },\n  flowerPreview: { width: 65, height: 76 },\n  flowerOptionName: { fontSize: 11, color: '#356B49', fontWeight: '700' },")
assetdir=root/'assets/garden'
assetdir.mkdir(parents=True,exist_ok=True)
for p in (source/'assets/garden').glob('*.png'):
 shutil.copy2(p,assetdir/p.name)
shutil.copy2(source/'components/GardenFlowerAssets.js',root/'components/GardenFlowerAssets.js')
backup=target.with_suffix('.jsx.before-garden-images.bak')
shutil.copy2(target,backup)
target.write_text(text)
print('Installed 24 pot-free garden images and updated Garden screen.')
print('Backup:',backup)
print('No Firebase data or security rules were changed.')
