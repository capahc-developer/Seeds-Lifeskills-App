import { useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  View,
  Pressable,
  ActivityIndicator,
} from "react-native";

import {
  router,
  useLocalSearchParams,
} from "expo-router";

import { Ionicons } from "@expo/vector-icons";

import { httpsCallable } from "firebase/functions";

import { functions } from "../../../lib/firebase";
import { findSkill } from "../../../data/skills";
import { useStudentProfile } from "../../../context/StudentProfileContext";


export default function Visual() {

  const { skillId } = useLocalSearchParams();

  const skill = findSkill(skillId);

  const { profile } = useStudentProfile();

  const [loading, setLoading] = useState(false);
  const [generatedPlan, setGeneratedPlan] = useState("");
  const [error, setError] = useState("");


  if (!skill) {
    return null;
  }


  const missing =
    !profile.strengths &&
    !profile.barriers &&
    !profile.interests;


  // --------------------------------
  // Generate AI Visual Plan
  // --------------------------------

  const handleGenerate = async () => {

    try {

      setLoading(true);
      setError("");


      const generateVisualPlan =
        httpsCallable(
          functions,
          "generateVisualPlan"
        );


      const result =
        await generateVisualPlan({

          skill: skill.title,

          strengths:
            profile.strengths ||
            "Not provided",

          barriers:
            profile.barriers ||
            "Not provided",

          interests:
            profile.interests ||
            "Not provided",

        });


      console.log(
        "AI response:",
        result.data
      );


      setGeneratedPlan(
        result.data.plan
      );


    } catch (err) {

      console.error(
        "Error generating visual:",
        err
      );

      setError(
        "We couldn't generate the visual. Please try again."
      );


    } finally {

      setLoading(false);

    }

  };


  // --------------------------------
  // Screen
  // --------------------------------

  return (

    <ScrollView style={s.page}>

      <View style={s.header}>

        <Pressable
          onPress={() => router.back()}
        >

          <Ionicons
            name="chevron-back"
            size={28}
          />

        </Pressable>


        <Text style={s.title}>
          Step-by-Step Visual
        </Text>


        <View style={{ width: 28 }} />

      </View>


      <View style={s.hero}>

        <Ionicons
          name="sparkles"
          size={34}
          color="#7559E8"
        />


        <View style={{ flex: 1 }}>

          <Text style={s.heroTitle}>
            Personalized Step-by-Step Visual
          </Text>


          <Text style={s.intro}>
            Uses the student profile and
            psychologist strategies for{" "}
            {skill.title}.
          </Text>

        </View>

      </View>


      {missing && (

        <Pressable
          style={s.warning}
          onPress={() =>
            router.push(
              "/student-profile"
            )
          }
        >

          <Ionicons
            name="information-circle-outline"
            size={22}
            color="#A56A00"
          />


          <Text style={s.warningText}>
            Add strengths, learning barriers,
            and interests to the Student
            Profile for better personalization.
          </Text>

        </Pressable>

      )}


      <Pressable
        style={[
          s.button,
          loading && s.buttonDisabled,
        ]}
        onPress={handleGenerate}
        disabled={loading}
      >

        {loading ? (

          <ActivityIndicator
            color="#FFF"
          />

        ) : (

          <Ionicons
            name="sparkles"
            size={20}
            color="#FFF"
          />

        )}


        <Text style={s.buttonText}>

          {loading
            ? "Generating..."
            : generatedPlan
              ? "Regenerate Visual"
              : "Generate My Child’s Visual"}

        </Text>

      </Pressable>


      {!!error && (

        <View style={s.errorBox}>

          <Text style={s.errorText}>
            {error}
          </Text>

        </View>

      )}


      {!!generatedPlan && (

        <View style={s.result}>

          <Text style={s.resultTitle}>

            {profile.name
              ? `${profile.name}’s `
              : ""}

            {skill.title}

          </Text>


          <Text style={s.aiPlan}>
            {generatedPlan}
          </Text>

        </View>

      )}

    </ScrollView>

  );

}


const s = StyleSheet.create({

  page: {
    flex: 1,
    backgroundColor: "#F2F9FF",
  },

  header: {
    paddingTop: 56,
    paddingHorizontal: 20,
    paddingBottom: 18,
    backgroundColor: "#FFF",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  title: {
    fontSize: 20,
    fontWeight: "800",
  },

  hero: {
    margin: 18,
    backgroundColor: "#FFF",
    borderRadius: 20,
    padding: 18,
    flexDirection: "row",
    gap: 13,
  },

  heroTitle: {
    fontSize: 18,
    fontWeight: "800",
  },

  intro: {
    color: "#718096",
    lineHeight: 20,
    marginTop: 5,
  },

  warning: {
    marginHorizontal: 18,
    backgroundColor: "#FFF5D9",
    borderRadius: 14,
    padding: 13,
    flexDirection: "row",
    gap: 9,
  },

  warningText: {
    flex: 1,
    color: "#76520E",
    lineHeight: 19,
  },

  button: {
    margin: 18,
    backgroundColor: "#258DEB",
    borderRadius: 18,
    padding: 17,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 9,
  },

  buttonDisabled: {
    opacity: 0.7,
  },

  buttonText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "800",
  },

  result: {
    marginHorizontal: 18,
    marginBottom: 36,
    backgroundColor: "#FFF",
    borderRadius: 20,
    padding: 18,
  },

  resultTitle: {
    fontSize: 22,
    fontWeight: "800",
    marginBottom: 16,
  },

  aiPlan: {
    fontSize: 16,
    color: "#45556B",
    lineHeight: 26,
  },

  errorBox: {
    marginHorizontal: 18,
    marginBottom: 18,
    backgroundColor: "#FFE8E8",
    borderRadius: 14,
    padding: 14,
  },

  errorText: {
    color: "#A52A2A",
    lineHeight: 20,
  },

});