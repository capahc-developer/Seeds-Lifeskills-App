import { useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  View,
  Pressable,
  ActivityIndicator,
  Image,
} from "react-native";

import {
  router,
  useLocalSearchParams,
} from "expo-router";

import { Ionicons } from "@expo/vector-icons";

import { httpsCallable } from "firebase/functions";
import { doc, getDoc } from "firebase/firestore";

import {
  functions,
  auth,
  db,
} from "../../../lib/firebase";

import { findSkill } from "../../../data/skills";
import { useStudentProfile } from "../../../context/StudentProfileContext";


export default function Visual() {

  const { skillId } = useLocalSearchParams();

  const resolvedSkillId =
    Array.isArray(skillId)
      ? skillId[0]
      : skillId;

  const skill = findSkill(resolvedSkillId);

  const { profile } = useStudentProfile();

  const [loading, setLoading] = useState(false);
  const [posterUrl, setPosterUrl] = useState("");
  const [error, setError] = useState("");


  if (!skill) {
    return null;
  }


  const missing =
    !profile.strengths &&
    !profile.barriers &&
    !profile.interests;


  // --------------------------------
  // Get parent-approved steps
  // --------------------------------

  const getStepsForVisual = async () => {

    const user = auth.currentUser;

    let steps = [];


    // --------------------------------
    // 1. First try parent's customized steps
    // --------------------------------

    if (user) {

      try {

        const customRef = doc(
          db,
          "users",
          user.uid,
          "skillCustomizations",
          String(resolvedSkillId)
        );

        const customSnap =
          await getDoc(customRef);


        if (customSnap.exists()) {

          const customData =
            customSnap.data();

          if (
            Array.isArray(customData.steps) &&
            customData.steps.length > 0
          ) {

            steps =
              customData.steps;

            console.log(
              "Using customized steps:",
              steps
            );

            return steps;

          }

        }

      } catch (err) {

        console.error(
          "Error loading customized steps:",
          err
        );

      }

    }


    // --------------------------------
    // 2. Fall back to default skill steps
    // --------------------------------

    try {

      const skillRef = doc(
        db,
        "skills",
        String(resolvedSkillId)
      );

      const skillSnap =
        await getDoc(skillRef);


      if (skillSnap.exists()) {

        const skillData =
          skillSnap.data();

        if (
          Array.isArray(skillData.steps) &&
          skillData.steps.length > 0
        ) {

          steps =
            skillData.steps;

          console.log(
            "Using default skill steps:",
            steps
          );

          return steps;

        }

      }

    } catch (err) {

      console.error(
        "Error loading default skill steps:",
        err
      );

    }


    return [];

  };


  // --------------------------------
  // Generate AI Visual Poster
  // --------------------------------

  const handleGenerate = async () => {

    try {

      setLoading(true);
      setError("");


      // Get the exact steps the parent sees
      // before generating the poster.

      const steps =
        await getStepsForVisual();


      console.log(
        "Steps being sent to AI:",
        steps
      );


      // Do not generate a poster if
      // we couldn't find any steps.

      if (!steps.length) {

        setError(
          "No steps were found for this skill. Please add or adjust the steps first."
        );

        return;

      }


      const generateVisualPlan =
        httpsCallable(
          functions,
          "generateVisualPlan"
        );


      const result =
        await generateVisualPlan({

          skillId:
            String(resolvedSkillId),

          skill:
            skill.title,

          // IMPORTANT:
          // These are the parent-approved steps.
          steps,

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


      const url =
        result.data?.posterUrl;


      if (!url) {

        throw new Error(
          "The AI function did not return a poster URL."
        );

      }


      console.log(
        "Poster URL:",
        url
      );


      setPosterUrl(url);


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

    <ScrollView
      style={s.page}
      contentContainerStyle={s.content}
    >

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
            Create a personalized visual poster
            for{" "}
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
            ? "Creating Poster..."
            : posterUrl
              ? "Regenerate Poster"
              : "Generate My Child’s Visual"}

        </Text>

      </Pressable>


      {loading && (

        <View style={s.loadingCard}>

          <Ionicons
            name="image-outline"
            size={42}
            color="#7559E8"
          />

          <Text style={s.loadingTitle}>
            Creating your visual...
          </Text>

          <Text style={s.loadingText}>
            Your personalized poster is being
            created. This may take a little while.
          </Text>

        </View>

      )}


      {!!error && (

        <View style={s.errorBox}>

          <Text style={s.errorText}>
            {error}
          </Text>

        </View>

      )}


      {!!posterUrl && (

        <View style={s.result}>

          <Text style={s.resultTitle}>

            {profile.name
              ? `${profile.name}’s `
              : ""}

            {skill.title}

          </Text>


          <Image
            source={{
              uri: posterUrl,
            }}
            style={s.poster}
            resizeMode="contain"
            onLoad={() => {

              console.log(
                "Poster loaded successfully"
              );

            }}
            onError={(event) => {

              console.error(
                "Poster failed to load:",
                event.nativeEvent.error
              );

              setError(
                "The poster was created, but the image could not be displayed."
              );

            }}
          />


          <Text style={s.disclaimer}>
            AI-generated visuals may need to be
            adjusted for your child’s individual
            needs.
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

  content: {
    paddingBottom: 40,
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

  loadingCard: {
    marginHorizontal: 18,
    marginBottom: 18,
    backgroundColor: "#FFF",
    borderRadius: 20,
    padding: 24,
    alignItems: "center",
  },

  loadingTitle: {
    fontSize: 18,
    fontWeight: "800",
    marginTop: 12,
  },

  loadingText: {
    color: "#718096",
    lineHeight: 20,
    marginTop: 6,
    textAlign: "center",
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
    textAlign: "center",
  },

  poster: {
    width: "100%",
    height: 520,
    borderRadius: 14,
    backgroundColor: "#F5F7FA",
  },

  disclaimer: {
    fontSize: 12,
    color: "#8A94A3",
    lineHeight: 17,
    marginTop: 14,
    textAlign: "center",
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