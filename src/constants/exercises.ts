import { Exercise } from '../types'

export const DEFAULT_EXERCISES: Exercise[] = [
  // CHEST
  { id: 'e001', name: 'Barbell Bench Press', primaryMuscle: 'chest', muscleGroups: ['chest', 'triceps', 'shoulders'], equipment: 'barbell', isCustom: false },
  { id: 'e002', name: 'Incline Barbell Press', primaryMuscle: 'chest', muscleGroups: ['chest', 'shoulders', 'triceps'], equipment: 'barbell', isCustom: false },
  { id: 'e003', name: 'Dumbbell Bench Press', primaryMuscle: 'chest', muscleGroups: ['chest', 'triceps'], equipment: 'dumbbell', isCustom: false },
  { id: 'e004', name: 'Incline Dumbbell Press', primaryMuscle: 'chest', muscleGroups: ['chest', 'shoulders'], equipment: 'dumbbell', isCustom: false },
  { id: 'e005', name: 'Cable Fly', primaryMuscle: 'chest', muscleGroups: ['chest'], equipment: 'cable', isCustom: false },
  { id: 'e006', name: 'Pec Deck / Chest Fly Machine', primaryMuscle: 'chest', muscleGroups: ['chest'], equipment: 'machine', isCustom: false },
  { id: 'e007', name: 'Dips (Chest)', primaryMuscle: 'chest', muscleGroups: ['chest', 'triceps'], equipment: 'bodyweight', isCustom: false },
  { id: 'e008', name: 'Push-Up', primaryMuscle: 'chest', muscleGroups: ['chest', 'triceps', 'shoulders'], equipment: 'bodyweight', isCustom: false },
  { id: 'e009', name: 'Decline Bench Press', primaryMuscle: 'chest', muscleGroups: ['chest', 'triceps'], equipment: 'barbell', isCustom: false },

  // BACK
  { id: 'e010', name: 'Conventional Deadlift', primaryMuscle: 'back', muscleGroups: ['back', 'glutes', 'hamstrings'], equipment: 'barbell', isCustom: false },
  { id: 'e011', name: 'Pull-Up', primaryMuscle: 'back', muscleGroups: ['back', 'biceps'], equipment: 'bodyweight', isCustom: false },
  { id: 'e012', name: 'Chin-Up', primaryMuscle: 'back', muscleGroups: ['back', 'biceps'], equipment: 'bodyweight', isCustom: false },
  { id: 'e013', name: 'Barbell Row', primaryMuscle: 'back', muscleGroups: ['back', 'biceps'], equipment: 'barbell', isCustom: false },
  { id: 'e014', name: 'Lat Pulldown', primaryMuscle: 'back', muscleGroups: ['back', 'biceps'], equipment: 'cable', isCustom: false },
  { id: 'e015', name: 'Seated Cable Row', primaryMuscle: 'back', muscleGroups: ['back', 'biceps'], equipment: 'cable', isCustom: false },
  { id: 'e016', name: 'T-Bar Row', primaryMuscle: 'back', muscleGroups: ['back', 'biceps'], equipment: 'barbell', isCustom: false },
  { id: 'e017', name: 'Dumbbell Row', primaryMuscle: 'back', muscleGroups: ['back', 'biceps'], equipment: 'dumbbell', isCustom: false },
  { id: 'e018', name: 'Face Pull', primaryMuscle: 'shoulders', muscleGroups: ['back', 'shoulders'], equipment: 'cable', isCustom: false },
  { id: 'e019', name: 'Rack Pull', primaryMuscle: 'back', muscleGroups: ['back', 'glutes'], equipment: 'barbell', isCustom: false },

  // SHOULDERS
  { id: 'e020', name: 'Overhead Press (Barbell)', primaryMuscle: 'shoulders', muscleGroups: ['shoulders', 'triceps'], equipment: 'barbell', isCustom: false },
  { id: 'e021', name: 'Dumbbell Shoulder Press', primaryMuscle: 'shoulders', muscleGroups: ['shoulders', 'triceps'], equipment: 'dumbbell', isCustom: false },
  { id: 'e022', name: 'Arnold Press', primaryMuscle: 'shoulders', muscleGroups: ['shoulders', 'triceps'], equipment: 'dumbbell', isCustom: false },
  { id: 'e023', name: 'Lateral Raise', primaryMuscle: 'shoulders', muscleGroups: ['shoulders'], equipment: 'dumbbell', isCustom: false },
  { id: 'e024', name: 'Cable Lateral Raise', primaryMuscle: 'shoulders', muscleGroups: ['shoulders'], equipment: 'cable', isCustom: false },
  { id: 'e025', name: 'Rear Delt Fly', primaryMuscle: 'shoulders', muscleGroups: ['shoulders', 'back'], equipment: 'dumbbell', isCustom: false },
  { id: 'e026', name: 'Machine Shoulder Press', primaryMuscle: 'shoulders', muscleGroups: ['shoulders', 'triceps'], equipment: 'machine', isCustom: false },

  // BICEPS
  { id: 'e027', name: 'Barbell Curl', primaryMuscle: 'biceps', muscleGroups: ['biceps', 'forearms'], equipment: 'barbell', isCustom: false },
  { id: 'e028', name: 'Dumbbell Curl', primaryMuscle: 'biceps', muscleGroups: ['biceps', 'forearms'], equipment: 'dumbbell', isCustom: false },
  { id: 'e029', name: 'Hammer Curl', primaryMuscle: 'biceps', muscleGroups: ['biceps', 'forearms'], equipment: 'dumbbell', isCustom: false },
  { id: 'e030', name: 'Incline Dumbbell Curl', primaryMuscle: 'biceps', muscleGroups: ['biceps'], equipment: 'dumbbell', isCustom: false },
  { id: 'e031', name: 'Preacher Curl', primaryMuscle: 'biceps', muscleGroups: ['biceps'], equipment: 'barbell', isCustom: false },
  { id: 'e032', name: 'Cable Curl', primaryMuscle: 'biceps', muscleGroups: ['biceps', 'forearms'], equipment: 'cable', isCustom: false },
  { id: 'e033', name: 'Concentration Curl', primaryMuscle: 'biceps', muscleGroups: ['biceps'], equipment: 'dumbbell', isCustom: false },

  // TRICEPS
  { id: 'e034', name: 'Skull Crusher (EZ-Bar)', primaryMuscle: 'triceps', muscleGroups: ['triceps'], equipment: 'barbell', isCustom: false },
  { id: 'e035', name: 'Tricep Pushdown (Cable)', primaryMuscle: 'triceps', muscleGroups: ['triceps'], equipment: 'cable', isCustom: false },
  { id: 'e036', name: 'Overhead Tricep Extension', primaryMuscle: 'triceps', muscleGroups: ['triceps'], equipment: 'dumbbell', isCustom: false },
  { id: 'e037', name: 'Close-Grip Bench Press', primaryMuscle: 'triceps', muscleGroups: ['triceps', 'chest'], equipment: 'barbell', isCustom: false },
  { id: 'e038', name: 'Tricep Kickback', primaryMuscle: 'triceps', muscleGroups: ['triceps'], equipment: 'dumbbell', isCustom: false },
  { id: 'e039', name: 'Dips (Triceps)', primaryMuscle: 'triceps', muscleGroups: ['triceps', 'chest'], equipment: 'bodyweight', isCustom: false },

  // QUADRICEPS / LEGS
  { id: 'e040', name: 'Back Squat', primaryMuscle: 'quadriceps', muscleGroups: ['quadriceps', 'glutes', 'hamstrings'], equipment: 'barbell', isCustom: false },
  { id: 'e041', name: 'Front Squat', primaryMuscle: 'quadriceps', muscleGroups: ['quadriceps', 'glutes'], equipment: 'barbell', isCustom: false },
  { id: 'e042', name: 'Leg Press', primaryMuscle: 'quadriceps', muscleGroups: ['quadriceps', 'glutes', 'hamstrings'], equipment: 'machine', isCustom: false },
  { id: 'e043', name: 'Leg Extension', primaryMuscle: 'quadriceps', muscleGroups: ['quadriceps'], equipment: 'machine', isCustom: false },
  { id: 'e044', name: 'Bulgarian Split Squat', primaryMuscle: 'quadriceps', muscleGroups: ['quadriceps', 'glutes'], equipment: 'dumbbell', isCustom: false },
  { id: 'e045', name: 'Hack Squat', primaryMuscle: 'quadriceps', muscleGroups: ['quadriceps', 'glutes'], equipment: 'machine', isCustom: false },
  { id: 'e046', name: 'Walking Lunges', primaryMuscle: 'quadriceps', muscleGroups: ['quadriceps', 'glutes', 'hamstrings'], equipment: 'dumbbell', isCustom: false },

  // HAMSTRINGS / GLUTES
  { id: 'e047', name: 'Romanian Deadlift', primaryMuscle: 'hamstrings', muscleGroups: ['hamstrings', 'glutes', 'back'], equipment: 'barbell', isCustom: false },
  { id: 'e048', name: 'Leg Curl (Lying)', primaryMuscle: 'hamstrings', muscleGroups: ['hamstrings'], equipment: 'machine', isCustom: false },
  { id: 'e049', name: 'Leg Curl (Seated)', primaryMuscle: 'hamstrings', muscleGroups: ['hamstrings'], equipment: 'machine', isCustom: false },
  { id: 'e050', name: 'Hip Thrust', primaryMuscle: 'glutes', muscleGroups: ['glutes', 'hamstrings'], equipment: 'barbell', isCustom: false },
  { id: 'e051', name: 'Glute Bridge', primaryMuscle: 'glutes', muscleGroups: ['glutes', 'hamstrings'], equipment: 'bodyweight', isCustom: false },
  { id: 'e052', name: 'Cable Kickback', primaryMuscle: 'glutes', muscleGroups: ['glutes'], equipment: 'cable', isCustom: false },

  // CALVES
  { id: 'e053', name: 'Standing Calf Raise', primaryMuscle: 'calves', muscleGroups: ['calves'], equipment: 'machine', isCustom: false },
  { id: 'e054', name: 'Seated Calf Raise', primaryMuscle: 'calves', muscleGroups: ['calves'], equipment: 'machine', isCustom: false },
  { id: 'e055', name: 'Donkey Calf Raise', primaryMuscle: 'calves', muscleGroups: ['calves'], equipment: 'machine', isCustom: false },

  // CORE
  { id: 'e056', name: 'Plank', primaryMuscle: 'core', muscleGroups: ['core'], equipment: 'bodyweight', isCustom: false },
  { id: 'e057', name: 'Cable Crunch', primaryMuscle: 'core', muscleGroups: ['core'], equipment: 'cable', isCustom: false },
  { id: 'e058', name: 'Hanging Leg Raise', primaryMuscle: 'core', muscleGroups: ['core'], equipment: 'bodyweight', isCustom: false },
  { id: 'e059', name: 'Ab Wheel Rollout', primaryMuscle: 'core', muscleGroups: ['core'], equipment: 'other', isCustom: false },
  { id: 'e060', name: 'Russian Twist', primaryMuscle: 'core', muscleGroups: ['core'], equipment: 'other', isCustom: false },
  { id: 'e061', name: 'Decline Sit-Up', primaryMuscle: 'core', muscleGroups: ['core'], equipment: 'bodyweight', isCustom: false },
  { id: 'e062', name: 'Dragon Flag', primaryMuscle: 'core', muscleGroups: ['core'], equipment: 'bodyweight', isCustom: false },

  // CARDIO / FULL BODY
  { id: 'e063', name: 'Treadmill Run', primaryMuscle: 'cardio', muscleGroups: ['cardio', 'full_body'], equipment: 'machine', isCustom: false },
  { id: 'e064', name: 'Rowing Machine', primaryMuscle: 'cardio', muscleGroups: ['cardio', 'back', 'core'], equipment: 'machine', isCustom: false },
  { id: 'e065', name: 'Jump Rope', primaryMuscle: 'cardio', muscleGroups: ['cardio', 'calves'], equipment: 'other', isCustom: false },
  { id: 'e066', name: 'Burpees', primaryMuscle: 'full_body', muscleGroups: ['full_body', 'cardio'], equipment: 'bodyweight', isCustom: false },
  { id: 'e067', name: 'Kettlebell Swing', primaryMuscle: 'full_body', muscleGroups: ['glutes', 'hamstrings', 'core', 'back'], equipment: 'kettlebell', isCustom: false },
  { id: 'e068', name: 'Box Jump', primaryMuscle: 'full_body', muscleGroups: ['quadriceps', 'glutes', 'calves'], equipment: 'bodyweight', isCustom: false },
  { id: 'e069', name: 'Battle Ropes', primaryMuscle: 'full_body', muscleGroups: ['shoulders', 'core', 'cardio'], equipment: 'other', isCustom: false },
  { id: 'e070', name: 'Farmer\'s Walk', primaryMuscle: 'full_body', muscleGroups: ['forearms', 'core', 'full_body'], equipment: 'dumbbell', isCustom: false },

  // FOREARMS
  { id: 'e071', name: 'Wrist Curl', primaryMuscle: 'forearms', muscleGroups: ['forearms'], equipment: 'barbell', isCustom: false },
  { id: 'e072', name: 'Reverse Curl', primaryMuscle: 'forearms', muscleGroups: ['forearms', 'biceps'], equipment: 'barbell', isCustom: false },
]
