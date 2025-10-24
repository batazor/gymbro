import React, { createContext, useContext, useReducer, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Типы данных
export const WorkoutContext = createContext();

// Начальное состояние
const initialState = {
  googleSheetsUrl: '',
  workoutPlan: null,
  currentDay: null,
  currentExercise: null,
  progress: [],
  isLoading: false,
  error: null,
};

// Типы действий
export const ACTIONS = {
  SET_GOOGLE_SHEETS_URL: 'SET_GOOGLE_SHEETS_URL',
  SET_WORKOUT_PLAN: 'SET_WORKOUT_PLAN',
  SET_CURRENT_DAY: 'SET_CURRENT_DAY',
  SET_CURRENT_EXERCISE: 'SET_CURRENT_EXERCISE',
  ADD_PROGRESS: 'ADD_PROGRESS',
  SET_LOADING: 'SET_LOADING',
  SET_ERROR: 'SET_ERROR',
  CLEAR_ERROR: 'CLEAR_ERROR',
};

// Редьюсер
function workoutReducer(state, action) {
  switch (action.type) {
    case ACTIONS.SET_GOOGLE_SHEETS_URL:
      return { ...state, googleSheetsUrl: action.payload };
    
    case ACTIONS.SET_WORKOUT_PLAN:
      return { ...state, workoutPlan: action.payload };
    
    case ACTIONS.SET_CURRENT_DAY:
      return { ...state, currentDay: action.payload };
    
    case ACTIONS.SET_CURRENT_EXERCISE:
      return { ...state, currentExercise: action.payload };
    
    case ACTIONS.ADD_PROGRESS:
      return { 
        ...state, 
        progress: [...state.progress, action.payload] 
      };
    
    case ACTIONS.SET_LOADING:
      return { ...state, isLoading: action.payload };
    
    case ACTIONS.SET_ERROR:
      return { ...state, error: action.payload };
    
    case ACTIONS.CLEAR_ERROR:
      return { ...state, error: null };
    
    default:
      return state;
  }
}

// Провайдер контекста
export function WorkoutProvider({ children }) {
  const [state, dispatch] = useReducer(workoutReducer, initialState);

  // Загрузка сохраненных данных при запуске
  useEffect(() => {
    loadSavedData();
  }, []);

  // Сохранение данных при изменении
  useEffect(() => {
    saveData();
  }, [state.googleSheetsUrl, state.workoutPlan, state.progress]);

  const loadSavedData = async () => {
    try {
      const savedUrl = await AsyncStorage.getItem('googleSheetsUrl');
      const savedPlan = await AsyncStorage.getItem('workoutPlan');
      const savedProgress = await AsyncStorage.getItem('progress');

      if (savedUrl) {
        dispatch({ type: ACTIONS.SET_GOOGLE_SHEETS_URL, payload: savedUrl });
      }
      if (savedPlan) {
        dispatch({ type: ACTIONS.SET_WORKOUT_PLAN, payload: JSON.parse(savedPlan) });
      }
      if (savedProgress) {
        dispatch({ type: ACTIONS.ADD_PROGRESS, payload: JSON.parse(savedProgress) });
      }
    } catch (error) {
      console.error('Ошибка загрузки данных:', error);
    }
  };

  const saveData = async () => {
    try {
      if (state.googleSheetsUrl) {
        await AsyncStorage.setItem('googleSheetsUrl', state.googleSheetsUrl);
      }
      if (state.workoutPlan) {
        await AsyncStorage.setItem('workoutPlan', JSON.stringify(state.workoutPlan));
      }
      if (state.progress.length > 0) {
        await AsyncStorage.setItem('progress', JSON.stringify(state.progress));
      }
    } catch (error) {
      console.error('Ошибка сохранения данных:', error);
    }
  };

  const value = {
    state,
    dispatch,
    // Вспомогательные функции
    setGoogleSheetsUrl: (url) => dispatch({ type: ACTIONS.SET_GOOGLE_SHEETS_URL, payload: url }),
    setWorkoutPlan: (plan) => dispatch({ type: ACTIONS.SET_WORKOUT_PLAN, payload: plan }),
    setCurrentDay: (day) => dispatch({ type: ACTIONS.SET_CURRENT_DAY, payload: day }),
    setCurrentExercise: (exercise) => dispatch({ type: ACTIONS.SET_CURRENT_EXERCISE, payload: exercise }),
    addProgress: (progress) => dispatch({ type: ACTIONS.ADD_PROGRESS, payload: progress }),
    setLoading: (loading) => dispatch({ type: ACTIONS.SET_LOADING, payload: loading }),
    setError: (error) => dispatch({ type: ACTIONS.SET_ERROR, payload: error }),
    clearError: () => dispatch({ type: ACTIONS.CLEAR_ERROR }),
  };

  return (
    <WorkoutContext.Provider value={value}>
      {children}
    </WorkoutContext.Provider>
  );
}

// Хук для использования контекста
export function useWorkout() {
  const context = useContext(WorkoutContext);
  if (!context) {
    throw new Error('useWorkout должен использоваться внутри WorkoutProvider');
  }
  return context;
}
